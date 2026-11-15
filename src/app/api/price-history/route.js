import { apiError, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    await requireUser(["PEMILIK"]);
    const history = await prisma.riwayatHarga.findMany({
      include: {
        produk: { select: { namaProduk: true, kodeBarang: true } },
        user: { select: { nama: true } },
      },
      orderBy: { tanggal: "desc" },
      take: 100,
    });
    return Response.json({ history });
  } catch (error) {
    return apiError(error);
  }
}
