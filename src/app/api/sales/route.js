import { randomUUID } from "node:crypto";
import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const saleInclude = {
  user: { select: { nama: true } },
  detail: { include: { produk: { select: { namaProduk: true, kodeBarang: true } } } },
};

export async function GET() {
  try {
    await requireUser();
    const sales = await prisma.transaksiPenjualan.findMany({
      include: saleInclude,
      orderBy: { tanggal: "desc" },
      take: 100,
    });
    return Response.json({ sales });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const body = await jsonBody(request);
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) {
      throw new ApiError("Keranjang transaksi kosong atau melebihi batas.");
    }

    const quantities = new Map();
    for (const item of body.items) {
      const id = Number(item.produkId);
      const quantity = Number(item.jumlah);
      if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
        throw new ApiError("Jumlah atau produk pada keranjang tidak valid.");
      }
      quantities.set(id, (quantities.get(id) || 0) + quantity);
    }

    const sale = await prisma.$transaction(async (tx) => {
      const products = await tx.produk.findMany({
        where: { id: { in: [...quantities.keys()] }, aktif: true },
      });
      if (products.length !== quantities.size) throw new ApiError("Satu atau lebih produk tidak tersedia.", 404);
      for (const product of products) {
        if (product.stok < quantities.get(product.id)) {
          throw new ApiError(`Stok ${product.namaProduk} tidak mencukupi.`, 409);
        }
      }

      const details = products.map((product) => {
        const jumlah = quantities.get(product.id);
        const hargaSatuan = product.hargaJual;
        return {
          produkId: product.id,
          jumlah,
          hargaSatuan,
          subtotal: Number(hargaSatuan) * jumlah,
        };
      });
      const total = details.reduce((sum, item) => sum + item.subtotal, 0);
      const created = await tx.transaksiPenjualan.create({
        data: {
          kodeTransaksi: `TRX-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
          userId: user.id,
          jenis: "OFFLINE",
          total,
          detail: { create: details },
        },
      });

      for (const [produkId, jumlah] of quantities) {
        const updated = await tx.produk.updateMany({
          where: { id: produkId, aktif: true, stok: { gte: jumlah } },
          data: { stok: { decrement: jumlah } },
        });
        if (updated.count !== 1) throw new ApiError("Stok berubah atau tidak lagi mencukupi. Muat ulang data.", 409);

        let remaining = jumlah;
        const batches = await tx.batchProduk.findMany({
          where: {
            produkId,
            jumlah: { gt: 0 },
            tanggalKedaluwarsa: { gte: new Date() },
          },
          orderBy: { tanggalKedaluwarsa: "asc" },
          select: { id: true, jumlah: true },
        });
        for (const batch of batches) {
          if (remaining === 0) break;
          const taken = Math.min(remaining, batch.jumlah);
          const batchUpdate = await tx.batchProduk.updateMany({
            where: { id: batch.id, jumlah: { gte: taken } },
            data: { jumlah: { decrement: taken } },
          });
          if (batchUpdate.count !== 1) throw new ApiError("Stok batch berubah. Muat ulang dan coba lagi.", 409);
          remaining -= taken;
        }
      }

      return tx.transaksiPenjualan.findUnique({ where: { id: created.id }, include: saleInclude });
    });
    return Response.json({ sale }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
