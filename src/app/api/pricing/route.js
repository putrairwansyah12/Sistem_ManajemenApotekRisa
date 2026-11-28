import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { calculatePrice } from "../../../lib/pricing";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("Format data kalkulasi tidak valid.");
    }

    // -------------------------------------------------------------
    // 1. BULK / MASSAL MODE
    // -------------------------------------------------------------
    if (body.bulk === true) {
      if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 1000) {
        throw new ApiError("Daftar item untuk kalkulasi massal tidak valid (maksimal 1.000 produk per batch).");
      }

      const params = body.parameters || {};
      const simpan = body.simpan === true;
      const simpanHpp = body.simpanHpp === true;

      const productIds = body.items.map((item) => Number(item.produkId));
      if (productIds.some((id) => !Number.isInteger(id) || id < 1)) {
        throw new ApiError("Terdapat produk yang tidak valid dalam daftar massal.");
      }

      // If only previewing without saving
      if (!simpan) {
        const previewResults = body.items.map((item) => {
          const calc = calculatePrice({
            hpp: Number(item.hpp || 0),
            persenBiayaAdmin: params.persenBiayaAdmin,
            persenPajak: params.persenPajak,
            biayaPengemasan: params.biayaPengemasan,
            biayaLayanan: params.biayaLayanan,
            biayaGratisOngkir: params.biayaGratisOngkir,
            persenTargetLaba: params.persenTargetLaba,
          });
          return { produkId: item.produkId, calculation: calc };
        });
        return Response.json({ calculations: previewResults });
      }

      // Save bulk prices in transaction
      const result = await prisma.$transaction(async (tx) => {
        const currentProducts = await tx.produk.findMany({
          where: { id: { in: productIds }, aktif: true },
          select: { id: true, hargaJual: true, hpp: true, namaProduk: true },
        });
        const currentMap = new Map(currentProducts.map((p) => [p.id, p]));

        let updatedCount = 0;

        for (const item of body.items) {
          const current = currentMap.get(item.produkId);
          if (!current) continue;

          let calc;
          try {
            calc = calculatePrice({
              hpp: Number(item.hpp || 0),
              persenBiayaAdmin: params.persenBiayaAdmin,
              persenPajak: params.persenPajak,
              biayaPengemasan: params.biayaPengemasan,
              biayaLayanan: params.biayaLayanan,
              biayaGratisOngkir: params.biayaGratisOngkir,
              persenTargetLaba: params.persenTargetLaba,
            });
          } catch {
            continue; // Skip items that fail calculation constraints
          }

          const savedCalc = await tx.kalkulasiHarga.create({
            data: {
              produkId: item.produkId,
              userId: user.id,
              ...calc,
            },
          });

          await tx.produk.update({
            where: { id: item.produkId },
            data: {
              ...(simpanHpp ? { hpp: calc.hpp } : {}),
              hargaJual: calc.hargaJual,
            },
          });

          if (Number(current.hargaJual) !== calc.hargaJual) {
            await tx.riwayatHarga.create({
              data: {
                produkId: item.produkId,
                userId: user.id,
                kalkulasiId: savedCalc.id,
                jenisHarga: "JUAL",
                hargaLama: current.hargaJual,
                hargaBaru: calc.hargaJual,
              },
            });
          }

          if (simpanHpp && Number(current.hpp) !== calc.hpp) {
            await tx.riwayatHarga.create({
              data: {
                produkId: item.produkId,
                userId: user.id,
                kalkulasiId: savedCalc.id,
                jenisHarga: "HPP",
                hargaLama: current.hpp,
                hargaBaru: calc.hpp,
              },
            });
          }

          updatedCount++;
        }

        return { count: updatedCount };
      });

      return Response.json({ success: true, count: result.count });
    }

    // -------------------------------------------------------------
    // 2. SINGLE MODE (Original Behavior)
    // -------------------------------------------------------------
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
