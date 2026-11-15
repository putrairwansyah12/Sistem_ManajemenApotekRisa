import { ApiError, apiError, jsonBody, requireUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError("ID produk tidak valid.");
    const body = await jsonBody(request);
    const data = {};
    if (body.namaProduk !== undefined) {
      if (typeof body.namaProduk !== "string" || !body.namaProduk.trim() || body.namaProduk.trim().length > 200) {
        throw new ApiError("Nama obat tidak valid.");
      }
      data.namaProduk = body.namaProduk.trim();
    }
    if (body.kodeBarang !== undefined) {
      if (typeof body.kodeBarang !== "string" || body.kodeBarang.trim().length > 30) throw new ApiError("Kode barang tidak valid.");
      data.kodeBarang = body.kodeBarang.trim() || null;
    }
    if (body.aktif !== undefined) {
      if (typeof body.aktif !== "boolean") throw new ApiError("Status produk tidak valid.");
      data.aktif = body.aktif;
    }
    if (body.stokMinimum !== undefined) {
      const stokMinimum = Number(body.stokMinimum);
      if (!Number.isInteger(stokMinimum) || stokMinimum < 0) throw new ApiError("Stok minimum tidak valid.");
      data.stokMinimum = stokMinimum;
    }
    if (body.hargaJual !== undefined) {
      const hargaJual = Number(body.hargaJual);
      if (!Number.isFinite(hargaJual) || hargaJual < 0) throw new ApiError("Harga jual tidak valid.");
      data.hargaJual = hargaJual;
    }
    if (!Object.keys(data).length) throw new ApiError("Tidak ada perubahan yang dikirim.");
    const product = await prisma.$transaction(async (tx) => {
      const existing = await tx.produk.findUnique({ where: { id } });
      if (!existing) throw new ApiError("Produk tidak ditemukan.", 404);
      const updated = await tx.produk.update({ where: { id }, data });
      if (data.hargaJual !== undefined && Number(existing.hargaJual) !== data.hargaJual) {
        await tx.riwayatHarga.create({
          data: {
            produkId: id,
            userId: user.id,
            jenisHarga: "JUAL",
            hargaLama: existing.hargaJual,
            hargaBaru: data.hargaJual,
          },
        });
      }
      return updated;
    });
    return Response.json({ product });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireUser(["PEMILIK"]);
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError("ID produk tidak valid.");
    await prisma.produk.update({ where: { id }, data: { aktif: false } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
