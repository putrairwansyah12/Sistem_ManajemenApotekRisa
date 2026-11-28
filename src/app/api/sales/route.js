import { randomUUID } from "node:crypto";
import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { getFinancePeriodRange } from "../../../lib/finance";
import { getStockAvailability } from "../../../lib/inventory";
import { prisma } from "../../../lib/prisma";

const HISTORY_PAGE_SIZE = 25;

const saleInclude = {
  user: { select: { nama: true } },
  detail: {
    include: {
      produk: {
        select: {
          namaProduk: true,
          kodeBarang: true,
          satuan: { select: { kode: true } },
        },
      },
    },
  },
};

function moneyInput(value, label) {
  if (value === undefined || value === null || value === "") return 0;
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) {
    throw new ApiError(`${label} tidak valid.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999999999999.99 || Math.round(parsed * 100) / 100 !== parsed) {
    throw new ApiError(`${label} tidak valid.`);
  }
  return parsed;
}

function percentageInput(value, label) {
  const parsed = moneyInput(value, label);
  if (parsed > 100) throw new ApiError(`${label} tidak boleh melebihi 100%.`);
  return parsed;
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}

export async function GET(request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const search = searchParams.get("q")?.trim() || "";

    if (search.length > 100) throw new ApiError("Kata pencarian terlalu panjang.");

    if (!period) {
      const sales = await prisma.transaksiPenjualan.findMany({
        include: saleInclude,
        orderBy: [{ tanggal: "desc" }, { id: "desc" }],
        take: 100,
      });
      return Response.json({ sales });
    }

    if (!["day", "month"].includes(period)) throw new ApiError("Filter periode tidak valid.");
    const selectedDate = searchParams.get("date");
    const rangeDate =
      period === "month" && /^\d{4}-\d{2}$/.test(selectedDate || "")
        ? `${selectedDate}-01`
        : selectedDate;
    let range;
    try {
      range = getFinancePeriodRange(period, rangeDate);
    } catch (error) {
      if (error instanceof RangeError) throw new ApiError(error.message);
      throw error;
    }

    const requestedPage = Number(searchParams.get("page") || 1);
    if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
      throw new ApiError("Halaman riwayat tidak valid.");
    }

    const where = {
      tanggal: { gte: range.start, lt: range.end },
      ...(search
        ? {
            OR: [
              { kodeTransaksi: { contains: search, mode: "insensitive" } },
              { user: { is: { nama: { contains: search, mode: "insensitive" } } } },
              {
                detail: {
                  some: {
                    produk: {
                      is: { namaProduk: { contains: search, mode: "insensitive" } },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [total, sales] = await Promise.all([
      prisma.transaksiPenjualan.count({ where }),
      prisma.transaksiPenjualan.findMany({
        where,
        include: saleInclude,
        orderBy: [{ tanggal: "desc" }, { id: "desc" }],
        skip: (requestedPage - 1) * HISTORY_PAGE_SIZE,
        take: HISTORY_PAGE_SIZE,
      }),
    ]);

    return Response.json({
      sales,
      total,
      page: requestedPage,
      pageSize: HISTORY_PAGE_SIZE,
      period,
      date: range.date,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError("Format transaksi tidak valid.");
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) {
      throw new ApiError("Keranjang transaksi kosong atau melebihi batas.");
    }
    const jenis = body.jenis === undefined ? "OFFLINE" : body.jenis;
    if (jenis !== "OFFLINE" && jenis !== "ONLINE") throw new ApiError("Jenis transaksi tidak valid.");
    const persenBiayaAdmin = percentageInput(body.persenBiayaAdmin, "Biaya admin");
    const persenPajak = percentageInput(body.persenPajak, "Pajak");
    const biayaPengemasanPerUnit = moneyInput(body.biayaPengemasan, "Biaya pengemasan");
    const biayaLayananPerUnit = moneyInput(body.biayaLayanan, "Biaya layanan");
    const biayaGratisOngkirPerUnit = moneyInput(body.biayaGratisOngkir, "Subsidi gratis ongkir");
    const potongan = moneyInput(body.potongan, "Potongan");

    const quantities = new Map();
    for (const item of body.items) {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new ApiError("Item keranjang tidak valid.");
      const id = Number(item.produkId);
      const quantity = Number(item.jumlah);
      if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
        throw new ApiError("Jumlah atau produk pada keranjang tidak valid.");
      }
      const combinedQuantity = (quantities.get(id) || 0) + quantity;
      if (combinedQuantity > 10000) throw new ApiError("Jumlah produk dalam transaksi melebihi batas.");
      quantities.set(id, combinedQuantity);
    }

    const sale = await prisma.$transaction(async (tx) => {
      const products = await tx.produk.findMany({
        where: { id: { in: [...quantities.keys()] }, aktif: true },
      });
      if (products.length !== quantities.size) throw new ApiError("Satu atau lebih produk tidak tersedia.", 404);
      for (const product of products) {
        if (product.stok < quantities.get(product.id)) {
          throw new ApiError(`Stok ${product.namaProduk} tidak mencukupi.`, 409);
        }
      }

      const details = products.map((product) => {
        const jumlah = quantities.get(product.id);
        const hargaSatuan = Number(product.hargaJual);
        const hppSatuan = Number(product.hpp);
        return {
          produkId: product.id,
          jumlah,
          hargaSatuan,
          hppSatuan,
          subtotal: roundMoney(hargaSatuan * jumlah),
        };
      });
      const subtotal = roundMoney(details.reduce((sum, item) => sum + item.subtotal, 0));
      if (potongan > subtotal) throw new ApiError("Potongan tidak boleh melebihi subtotal penjualan.");
      const totalUnit = details.reduce((sum, item) => sum + item.jumlah, 0);
      const biayaAdmin = roundMoney(subtotal * persenBiayaAdmin / 100);
      const biayaPajak = roundMoney(subtotal * persenPajak / 100);
      const biayaPengemasan = roundMoney(biayaPengemasanPerUnit * totalUnit);
      const biayaLayanan = roundMoney(biayaLayananPerUnit * totalUnit);
      const biayaGratisOngkir = roundMoney(biayaGratisOngkirPerUnit * totalUnit);
      const total = roundMoney(subtotal - potongan);
      if ([subtotal, biayaAdmin, biayaPajak, biayaPengemasan, biayaLayanan, biayaGratisOngkir, total].some((value) => value > 999999999999.99)) {
        throw new ApiError("Nilai transaksi melebihi batas database.");
      }
      const created = await tx.transaksiPenjualan.create({
        data: {
          kodeTransaksi: `TRX-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
          userId: user.id,
          jenis,
          potongan,
          biayaAdmin,
          biayaPajak,
          biayaPengemasan,
          biayaLayanan,
          biayaGratisOngkir,
          total,
          detail: { create: details },
        },
      });

      for (const [produkId, jumlah] of quantities) {
        const product = products.find((item) => item.id === produkId);
        const batches = await tx.batchProduk.findMany({
          where: { produkId, jumlah: { gt: 0 } },
          orderBy: { tanggalKedaluwarsa: "asc" },
          select: { id: true, jumlah: true, tanggalKedaluwarsa: true },
        });
        let availability;
        try {
          availability = getStockAvailability(product.stok, batches);
        } catch (error) {
          if (error instanceof RangeError || error instanceof TypeError) throw new ApiError(error.message, 409);
          throw error;
        }
        if (jumlah > availability.sellableStock) {
          throw new ApiError(`Stok batch yang belum kedaluwarsa untuk ${product.namaProduk} tidak mencukupi.`, 409);
        }

        const updated = await tx.produk.updateMany({
          where: { id: produkId, aktif: true, stok: { gte: jumlah } },
          data: { stok: { decrement: jumlah } },
        });
        if (updated.count !== 1) throw new ApiError("Stok berubah atau tidak lagi mencukupi. Muat ulang data.", 409);

        let remaining = Math.min(jumlah, availability.sellableBatchStock);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        for (const batch of batches) {
          if (remaining === 0) break;
          if (new Date(batch.tanggalKedaluwarsa) < today) continue;
          const taken = Math.min(remaining, batch.jumlah);
          const batchUpdate = await tx.batchProduk.updateMany({
            where: { id: batch.id, jumlah: { gte: taken } },
            data: { jumlah: { decrement: taken } },
          });
          if (batchUpdate.count !== 1) throw new ApiError("Stok batch berubah. Muat ulang dan coba lagi.", 409);
          remaining -= taken;
        }
        if (remaining !== 0) throw new ApiError("Stok batch berubah. Muat ulang dan coba lagi.", 409);
      }

      return tx.transaksiPenjualan.findUnique({ where: { id: created.id }, include: saleInclude });
    });
    return Response.json({ sale }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
