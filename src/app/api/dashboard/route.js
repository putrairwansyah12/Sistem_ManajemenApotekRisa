import { apiError, requireUser } from "../../../lib/auth";
import { getExpiryThresholds } from "../../../lib/expiry";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    await requireUser();
    const { start, returEnd, preventifEnd } = getExpiryThresholds();
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const [todaySales, activeProducts, expiringCount, returnWindowCount, recentSales] = await Promise.all([
      prisma.transaksiPenjualan.aggregate({
        where: { tanggal: { gte: start, lt: end } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.produk.findMany({
        where: { aktif: true },
        select: { id: true, namaProduk: true, stok: true, stokMinimum: true, satuan: { select: { kode: true } } },
      }),
      prisma.batchProduk.count({
        where: { jumlah: { gt: 0 }, tanggalKedaluwarsa: { gte: start, lte: preventifEnd }, produk: { aktif: true } },
      }),
      prisma.batchProduk.count({
        where: { jumlah: { gt: 0 }, tanggalKedaluwarsa: { gte: start, lte: returEnd }, produk: { aktif: true } },
      }),
      prisma.transaksiPenjualan.findMany({
        include: { user: { select: { nama: true } }, detail: true },
        orderBy: { tanggal: "desc" },
        take: 6,
      }),
    ]);

    return Response.json({
      todayRevenue: todaySales._sum.total || 0,
      todayTransactions: todaySales._count._all,
      productCount: activeProducts.length,
      lowStockCount: activeProducts.filter((product) => product.stok <= product.stokMinimum).length,
      lowStockProducts: activeProducts
        .filter((product) => product.stok <= product.stokMinimum)
        .sort((a, b) => a.stok - b.stok)
        .slice(0, 8),
      expiringCount,
      returnWindowCount,
      recentSales,
    });
  } catch (error) {
    return apiError(error);
  }
}
