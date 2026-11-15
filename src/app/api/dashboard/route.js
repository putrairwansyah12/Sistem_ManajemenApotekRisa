import { apiError, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    await requireUser();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const expiryLimit = new Date(end);
    expiryLimit.setDate(expiryLimit.getDate() + 29);

    const [todaySales, activeProducts, expiringCount, recentSales] = await Promise.all([
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
        where: { jumlah: { gt: 0 }, tanggalKedaluwarsa: { gte: start, lte: expiryLimit }, produk: { aktif: true } },
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
      recentSales,
    });
  } catch (error) {
    return apiError(error);
  }
}
