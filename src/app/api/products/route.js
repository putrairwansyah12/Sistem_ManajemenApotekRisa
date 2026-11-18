import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const productInclude = { kategori: true, satuan: true };

export async function GET(request) {
  try {
    await requireUser();
    const forSale = new URL(request.url).searchParams.get("untukPenjualan") === "true";
    const products = await prisma.produk.findMany({
      where: { aktif: true, ...(forSale ? { stok: { gt: 0 } } : {}) },
      include: productInclude,
      orderBy: { namaProduk: "asc" },
    });
    return Response.json({ products });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    const namaProduk = typeof body.namaProduk === "string" ? body.namaProduk.trim() : "";
    const kategoriNama = typeof body.kategori === "string" ? body.kategori.trim() : "";
    const satuanKode = typeof body.satuan === "string" ? body.satuan.trim() : "";
    const kodeBarang = typeof body.kodeBarang === "string" ? body.kodeBarang.trim() : "";
    const numbers = ["hargaBeli", "hargaJual", "stok", "stokMinimum"].map((key) => Number(body[key]));

    if (!namaProduk || namaProduk.length > 200 || !kategoriNama || kategoriNama.length > 50 || !satuanKode || satuanKode.length > 20) {
      throw new ApiError("Nama obat, kategori, dan satuan wajib diisi.");
    }
    if (kodeBarang.length > 30 || numbers.some((value) => !Number.isFinite(value) || value < 0)) {
      throw new ApiError("Kode atau nilai harga/stok tidak valid.");
    }
    if (![numbers[2], numbers[3]].every(Number.isInteger)) throw new ApiError("Stok harus berupa bilangan bulat.");

    const product = await prisma.$transaction(async (tx) => {
      const kategori = await tx.kategoriObat.upsert({
        where: { nama: kategoriNama },
        update: {},
        create: { nama: kategoriNama },
      });
      const satuan = await tx.satuan.upsert({
        where: { kode: satuanKode },
        update: {},
        create: { kode: satuanKode },
      });
      return tx.produk.create({
        data: {
          namaProduk,
          kodeBarang: kodeBarang || null,
          kategoriId: kategori.id,
          satuanId: satuan.id,
          hargaBeli: numbers[0],
          hpp: numbers[0],
          hargaJual: numbers[1],
          stok: numbers[2],
          stokMinimum: numbers[3],
        },
        include: productInclude,
      });
    });
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
