import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { getExpiryThresholds } from "../../../lib/expiry";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    await requireUser(["PEMILIK"]);
    const { start, returEnd, preventifEnd } = getExpiryThresholds();
    const batches = await prisma.batchProduk.findMany({
      where: {
        jumlah: { gt: 0 },
        tanggalKedaluwarsa: { lte: preventifEnd },
        produk: { aktif: true },
      },
      include: { produk: { select: { namaProduk: true, kodeBarang: true, satuan: { select: { kode: true } } } } },
      orderBy: { tanggalKedaluwarsa: "asc" },
    });
    const categorizedBatches = batches.map((batch) => {
      const expiry = new Date(batch.tanggalKedaluwarsa);
      const status = expiry < start ? "KEDALUWARSA" : expiry <= returEnd ? "BATAS_RETUR" : "PREVENTIF";
      return { ...batch, status };
    });
    return Response.json({
      batches: categorizedBatches,
      thresholds: { returEnd, preventifEnd },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Format penerimaan tidak valid.");
    const produkId = Number(body.produkId);
    const jumlah = Number(body.jumlah);
    const nomorBatch = typeof body.nomorBatch === "string" ? body.nomorBatch.trim() : "";
    const dateText = typeof body.tanggalKedaluwarsa === "string" ? body.tanggalKedaluwarsa : "";
    const tanggalKedaluwarsa = /^\d{4}-\d{2}-\d{2}$/.test(dateText)
      ? new Date(`${dateText}T00:00:00.000Z`)
      : new Date(Number.NaN);

    if (!Number.isInteger(produkId) || produkId < 1 || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > 100000) {
      throw new ApiError("Produk atau jumlah batch tidak valid.");
    }
    if (!nomorBatch || nomorBatch.length > 50 || Number.isNaN(tanggalKedaluwarsa.getTime())) {
      throw new ApiError("Nomor batch dan tanggal kedaluwarsa wajib valid.");
    }
    if (tanggalKedaluwarsa.toISOString().slice(0, 10) !== dateText) {
      throw new ApiError("Tanggal kedaluwarsa tidak valid.");
    }
    const prices = {};
    for (const field of ["hpp", "hargaBeli"]) {
      if (body[field] === undefined || body[field] === "") continue;
      const value = Number(body[field]);
      if (!Number.isFinite(value) || value < 0 || value > 9999999999.99) throw new ApiError(`${field === "hpp" ? "HPP" : "Harga beli"} tidak valid.`);
      prices[field] = value;
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (tanggalKedaluwarsa < today) throw new ApiError("Batch kedaluwarsa tidak dapat diterima.");

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.produk.findFirst({ where: { id: produkId, aktif: true } });
      if (!product) throw new ApiError("Produk tidak ditemukan.", 404);
      const overlaps = await tx.batchProduk.findMany({
        where: {
          produkId,
          nomorBatch: { not: nomorBatch },
          tanggalKedaluwarsa,
          jumlah: { gt: 0 },
        },
        select: { nomorBatch: true, jumlah: true },
      });
      if (overlaps.length && body.konfirmasiOverlap !== true) {
        return {
          warning: {
            code: "BATCH_EXPIRY_OVERLAP",
            message: "Produk ini sudah memiliki batch aktif dengan tanggal kedaluwarsa yang sama. Lanjutkan hanya jika batch berbeda memang benar.",
            overlaps,
          },
        };
      }

      const created = await tx.batchProduk.create({
        data: { produkId, penerimaId: user.id, nomorBatch, tanggalKedaluwarsa, jumlah },
        include: { produk: { select: { namaProduk: true, kodeBarang: true, satuan: { select: { kode: true } } } } },
      });
      await tx.produk.update({ where: { id: produkId }, data: { stok: { increment: jumlah } } });
      for (const field of ["hargaBeli", "hpp"]) {
        if (prices[field] === undefined || Number(product[field]) === prices[field]) continue;
        await tx.produk.update({ where: { id: produkId }, data: { [field]: prices[field] } });
        await tx.riwayatHarga.create({
          data: {
            produkId,
            userId: user.id,
            jenisHarga: field === "hpp" ? "HPP" : "BELI",
            hargaLama: product[field],
            hargaBaru: prices[field],
          },
        });
      }
      return { batch: created };
    });
    if (result.warning) return Response.json(result.warning, { status: 409 });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
