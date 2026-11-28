import { ApiError, apiError, requireUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(_request, { params }) {
  try {
    await requireUser(["PEMILIK"]);
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError("ID transaksi tidak valid.");

    const result = await prisma.transaksiPenjualan.updateMany({
      where: { id, diarsipkan: false },
      data: { diarsipkan: true },
    });
    if (result.count !== 1) throw new ApiError("Transaksi tidak ditemukan atau sudah diarsipkan.", 404);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
