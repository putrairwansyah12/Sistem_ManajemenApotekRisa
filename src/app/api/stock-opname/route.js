import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const include = {
  produk: { select: { namaProduk: true } },
  user: { select: { nama: true } },
  detailBatch: {
    include: {
      batchProduk: {
        include: {
          produk: {
            select: {
              id: true,
              namaProduk: true,
              kodeBarang: true,
              satuan: { select: { kode: true } },
            },
          },
        },
      },
    },
  },
};

export async function GET() {
  try {
    await requireUser(["PEMILIK"]);
    const [records, products] = await Promise.all([
      prisma.stockOpname.findMany({
        include,
        orderBy: { tanggal: "desc" },
        take: 100,
      }),
      prisma.produk.findMany({
        where: { aktif: true },
        include: {
          batch: {
            orderBy: { tanggalKedaluwarsa: "asc" },
            include: {
              produk: {
                select: {
                  id: true,
                  namaProduk: true,
                  kodeBarang: true,
                  satuan: { select: { kode: true } },
                },
              },
            },
          },
        },
        orderBy: { namaProduk: "asc" },
      }),
    ]);
    return Response.json({ records, products });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Format stock opname tidak valid.");
    const produkId = Number(body.produkId);
    const alasan = typeof body.alasan === "string" ? body.alasan.trim() : "";
    if (!Number.isInteger(produkId) || produkId < 1 || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100 || !alasan || alasan.length > 255) {
      throw new ApiError("Produk, rincian batch, dan alasan wajib valid.");
    }

    const record = await prisma.$transaction(async (tx) => {
      const product = await tx.produk.findFirst({ where: { id: produkId, aktif: true } });
      if (!product) throw new ApiError("Produk tidak ditemukan.", 404);
      const currentBatches = await tx.batchProduk.findMany({ where: { produkId } });
      const currentById = new Map(currentBatches.map((batch) => [batch.id, batch]));
      const submittedIds = new Set();
      const submittedNumbers = new Set();
      let stokFisik = 0;
      const normalizedItems = body.items.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new ApiError("Rincian batch tidak valid.");
        const jumlahFisik = Number(item.jumlahFisik);
        if (!Number.isInteger(jumlahFisik) || jumlahFisik < 0 || jumlahFisik > 1000000) {
          throw new ApiError("Jumlah fisik setiap batch harus berupa bilangan bulat yang valid.");
        }
        stokFisik += jumlahFisik;
        if (!Number.isSafeInteger(stokFisik)) throw new ApiError("Total stok fisik melebihi batas.");

        if (item.batchId !== undefined && item.batchId !== null && item.batchId !== "") {
          const batchId = Number(item.batchId);
          const batch = currentById.get(batchId);
          if (!Number.isInteger(batchId) || !batch || submittedIds.has(batchId)) {
            throw new ApiError("Rincian batch tidak valid atau terduplikasi.");
          }
          submittedIds.add(batchId);
          return { batch, jumlahFisik };
        }

        const nomorBatch = typeof item.nomorBatch === "string" ? item.nomorBatch.trim() : "";
        const rawExpiry = typeof item.tanggalKedaluwarsa === "string" ? item.tanggalKedaluwarsa : "";
        const tanggalKedaluwarsa = /^\d{4}-\d{2}-\d{2}$/.test(rawExpiry)
          ? new Date(`${rawExpiry}T00:00:00.000Z`)
          : null;
        if (!nomorBatch || nomorBatch.length > 50 || !tanggalKedaluwarsa || Number.isNaN(tanggalKedaluwarsa.getTime()) || tanggalKedaluwarsa.toISOString().slice(0, 10) !== rawExpiry) {
          throw new ApiError("Nomor batch dan tanggal kedaluwarsa untuk batch baru wajib valid.");
        }
        const numberKey = nomorBatch.toLocaleLowerCase("id-ID");
        if (submittedNumbers.has(numberKey) || currentBatches.some((batch) => batch.nomorBatch.toLocaleLowerCase("id-ID") === numberKey)) {
          throw new ApiError(`Nomor batch ${nomorBatch} sudah tercatat untuk produk ini.`);
        }
        submittedNumbers.add(numberKey);
        return { nomorBatch, tanggalKedaluwarsa, jumlahFisik };
      });

      for (const batch of currentBatches) {
        if (batch.jumlah > 0 && !submittedIds.has(batch.id)) {
          throw new ApiError("Semua batch dengan stok harus dicantumkan dalam stock opname.");
        }
      }

      const selisih = stokFisik - product.stok;
      const created = await tx.stockOpname.create({
        data: { produkId, userId: user.id, stokSistem: product.stok, stokFisik, selisih, alasan },
      });

      const detailItems = [];
      for (const item of normalizedItems) {
        if (item.batch) {
          const updatedBatch = await tx.batchProduk.updateMany({
            where: { id: item.batch.id, produkId, jumlah: item.batch.jumlah },
            data: { jumlah: item.jumlahFisik },
          });
          if (updatedBatch.count !== 1) throw new ApiError("Stok batch berubah. Muat ulang data dan ulangi stock opname.", 409);
          detailItems.push({
            stockOpnameId: created.id,
            batchProdukId: item.batch.id,
            nomorBatch: item.batch.nomorBatch,
            tanggalKedaluwarsa: item.batch.tanggalKedaluwarsa,
            jumlahSebelum: item.batch.jumlah,
            jumlahFisik: item.jumlahFisik,
          });
        } else {
          const batch = await tx.batchProduk.create({
            data: {
              produkId,
              nomorBatch: item.nomorBatch,
              tanggalKedaluwarsa: item.tanggalKedaluwarsa,
              jumlah: item.jumlahFisik,
            },
          });
          detailItems.push({
            stockOpnameId: created.id,
            batchProdukId: batch.id,
            nomorBatch: batch.nomorBatch,
            tanggalKedaluwarsa: batch.tanggalKedaluwarsa,
            jumlahSebelum: 0,
            jumlahFisik: item.jumlahFisik,
          });
        }
      }
      if (detailItems.length) await tx.detailStockOpname.createMany({ data: detailItems });

      const updated = await tx.produk.updateMany({
        where: { id: produkId, aktif: true, stok: product.stok },
        data: { stok: stokFisik },
      });
      if (updated.count !== 1) throw new ApiError("Stok berubah. Muat ulang data dan ulangi stock opname.", 409);
      return tx.stockOpname.findUnique({ where: { id: created.id }, include });
    });
    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
