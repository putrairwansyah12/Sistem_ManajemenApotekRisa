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
    for (const field of ["hargaBeli", "hpp", "hargaJual"]) {
      if (body[field] === undefined) continue;
      const price = Number(body[field]);
      if (!Number.isFinite(price) || price < 0 || price > 9999999999.99) throw new ApiError(`${field} tidak valid.`);
      data[field] = price;
    }
    if (body.kategori !== undefined) {
      if (typeof body.kategori !== "string" || !body.kategori.trim() || body.kategori.trim().length > 50) {
        throw new ApiError("Kategori tidak valid.");
      }
      data.kategoriId = body.kategori.trim();
    }
    if (body.satuan !== undefined) {
      if (typeof body.satuan !== "string" || !body.satuan.trim() || body.satuan.trim().length > 20) {
        throw new ApiError("Satuan tidak valid.");
      }
      data.satuanId = body.satuan.trim();
    }
    if (!Object.keys(data).length) throw new ApiError("Tidak ada perubahan yang dikirim.");
    const product = await prisma.$transaction(async (tx) => {
      const existing = await tx.produk.findUnique({ where: { id } });
      if (!existing) throw new ApiError("Produk tidak ditemukan.", 404);
      const updateData = { ...data };
      if (typeof updateData.kategoriId === "string") {
        const kategori = await tx.kategoriObat.upsert({
          where: { nama: updateData.kategoriId },
          update: {},
          create: { nama: updateData.kategoriId },
        });
        updateData.kategoriId = kategori.id;
      }
      if (typeof updateData.satuanId === "string") {
        const satuan = await tx.satuan.upsert({
          where: { kode: updateData.satuanId },
          update: {},
          create: { kode: updateData.satuanId },
        });
        updateData.satuanId = satuan.id;
      }
      const updated = await tx.produk.update({ where: { id }, data: updateData });
      for (const [field, jenisHarga] of [["hargaBeli", "BELI"], ["hpp", "HPP"], ["hargaJual", "JUAL"]]) {
        if (data[field] === undefined || Number(existing[field]) === data[field]) continue;
        await tx.riwayatHarga.create({
          data: {
            produkId: id,
            userId: user.id,
            jenisHarga,
            hargaLama: existing[field],
            hargaBaru: data[field],
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
