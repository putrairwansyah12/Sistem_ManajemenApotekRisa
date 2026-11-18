import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { calculatePrice } from "../../../lib/pricing";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Format data kalkulasi tidak valid.");
    const produkId = Number(body.produkId);
    if (!Number.isInteger(produkId) || produkId < 1) throw new ApiError("Produk tidak valid.");

    let calculation;
    try {
      calculation = calculatePrice(body);
    } catch (error) {
      if (error instanceof TypeError || error instanceof RangeError) throw new ApiError(error.message);
      throw error;
    }

    const product = await prisma.produk.findFirst({
      where: { id: produkId, aktif: true },
      select: { id: true, hargaJual: true, hpp: true },
    });
    if (!product) throw new ApiError("Produk tidak ditemukan.", 404);

    if (body.simpan !== true) return Response.json({ calculation });
    const simpanHpp = body.simpanHpp !== false;

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.produk.findFirst({ where: { id: produkId, aktif: true } });
      if (!current) throw new ApiError("Produk tidak ditemukan.", 404);

      const saved = await tx.kalkulasiHarga.create({
        data: {
          produkId,
          userId: user.id,
          ...calculation,
        },
      });
      const updatedProduct = await tx.produk.update({
        where: { id: produkId },
        data: { ...(simpanHpp ? { hpp: calculation.hpp } : {}), hargaJual: calculation.hargaJual },
        include: { kategori: true, satuan: true },
      });

      if (Number(current.hargaJual) !== calculation.hargaJual) {
        await tx.riwayatHarga.create({
          data: {
            produkId,
            userId: user.id,
            kalkulasiId: saved.id,
            jenisHarga: "JUAL",
            hargaLama: current.hargaJual,
            hargaBaru: calculation.hargaJual,
          },
        });
      }
      if (simpanHpp && Number(current.hpp) !== calculation.hpp) {
        await tx.riwayatHarga.create({
          data: {
            produkId,
            userId: user.id,
            kalkulasiId: saved.id,
            jenisHarga: "HPP",
            hargaLama: current.hpp,
            hargaBaru: calculation.hpp,
          },
        });
      }

      return { calculation: saved, product: updatedProduct };
    });

    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
