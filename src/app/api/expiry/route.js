import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    await requireUser();
    const today = new Date();
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + 30);
    const batches = await prisma.batchProduk.findMany({
      where: {
        jumlah: { gt: 0 },
        tanggalKedaluwarsa: { lte: threshold },
        produk: { aktif: true },
      },
      include: { produk: { select: { namaProduk: true, kodeBarang: true, satuan: { select: { kode: true } } } } },
      orderBy: { tanggalKedaluwarsa: "asc" },
    });
    return Response.json({ batches });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
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
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (tanggalKedaluwarsa < today) throw new ApiError("Batch kedaluwarsa tidak dapat diterima.");

    const batch = await prisma.$transaction(async (tx) => {
      const product = await tx.produk.findFirst({ where: { id: produkId, aktif: true } });
      if (!product) throw new ApiError("Produk tidak ditemukan.", 404);
      const created = await tx.batchProduk.create({
        data: { produkId, nomorBatch, tanggalKedaluwarsa, jumlah },
        include: { produk: { select: { namaProduk: true, kodeBarang: true, satuan: { select: { kode: true } } } } },
      });
      await tx.produk.update({ where: { id: produkId }, data: { stok: { increment: jumlah } } });
      return created;
    });
    return Response.json({ batch }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
