import { ApiError, apiError, requireUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(request, { params }) {
  try {
    await requireUser(["PEMILIK"]);
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError("ID biaya tidak valid.");
    const result = await prisma.biayaOperasional.deleteMany({ where: { id } });
    if (result.count !== 1) throw new ApiError("Biaya operasional tidak ditemukan.", 404);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
