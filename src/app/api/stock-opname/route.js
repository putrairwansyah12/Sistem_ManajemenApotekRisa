import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const include = { produk: { select: { namaProduk: true } }, user: { select: { nama: true } } };

export async function GET() {
  try {
    await requireUser();
    const records = await prisma.stockOpname.findMany({
      include,
      orderBy: { tanggal: "desc" },
      take: 100,
    });
    return Response.json({ records });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    const produkId = Number(body.produkId);
    const stokFisik = Number(body.stokFisik);
    const alasan = typeof body.alasan === "string" ? body.alasan.trim() : "";
    if (!Number.isInteger(produkId) || produkId < 1 || !Number.isInteger(stokFisik) || stokFisik < 0 || !alasan || alasan.length > 255) {
      throw new ApiError("Produk, stok fisik, dan alasan wajib valid.");
    }

    const record = await prisma.$transaction(async (tx) => {
      const product = await tx.produk.findFirst({ where: { id: produkId, aktif: true } });
      if (!product) throw new ApiError("Produk tidak ditemukan.", 404);
      const selisih = stokFisik - product.stok;
      const created = await tx.stockOpname.create({
        data: { produkId, userId: user.id, stokSistem: product.stok, stokFisik, selisih, alasan },
      });
      await tx.produk.update({ where: { id: produkId }, data: { stok: stokFisik } });
      return tx.stockOpname.findUnique({ where: { id: created.id }, include });
    });
    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
