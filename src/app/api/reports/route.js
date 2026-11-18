import { ApiError, apiError, requireUser } from "../../../lib/auth";
import { calculateFinanceReport, getFinancePeriodRange } from "../../../lib/finance";
import { prisma } from "../../../lib/prisma";

export async function GET(request) {
  try {
    await requireUser(["PEMILIK"]);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day";
    let range;
    try {
      range = getFinancePeriodRange(period, searchParams.get("date"));
    } catch (error) {
      throw new ApiError(error.message);
    }

    const [transactions, expenses] = await Promise.all([
      prisma.transaksiPenjualan.findMany({
        where: { tanggal: { gte: range.start, lt: range.end } },
        select: {
          tanggal: true,
          total: true,
          potongan: true,
          biayaAdmin: true,
          biayaPajak: true,
          biayaPengemasan: true,
          biayaLayanan: true,
          biayaGratisOngkir: true,
          detail: { select: { hargaSatuan: true, hppSatuan: true, jumlah: true } },
        },
      }),
      prisma.biayaOperasional.findMany({
        where: { tanggal: { gte: range.start, lt: range.end } },
        select: { tanggal: true, jumlah: true },
      }),
    ]);

    return Response.json({
      period: range.period,
      date: range.date,
      startDate: range.startDate,
      endDate: range.endDate,
      ...calculateFinanceReport(range, transactions, expenses),
    });
  } catch (error) {
    return apiError(error);
  }
}
