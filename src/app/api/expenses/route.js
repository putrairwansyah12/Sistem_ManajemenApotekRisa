import { ApiError, apiError, jsonBody, requireUser } from "../../../lib/auth";
import { getFinancePeriodRange, parseBusinessDate } from "../../../lib/finance";
import { prisma } from "../../../lib/prisma";

const MAX_AMOUNT = 999999999999.99;

function expenseAmount(value) {
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !value.trim())) {
    throw new ApiError("Jumlah biaya wajib berupa angka.");
  }
  const jumlah = Number(value);
  const validPrecision = typeof value === "string"
    ? /^\d+(?:\.\d{1,2})?$/.test(value.trim())
    : Number.isFinite(jumlah) && Math.abs(jumlah - Number(jumlah.toFixed(2))) <= 0.0001;
  if (!Number.isFinite(jumlah) || jumlah <= 0 || jumlah > MAX_AMOUNT || !validPrecision) {
    throw new ApiError("Jumlah biaya harus lebih dari nol dan maksimal dua angka desimal.");
  }
  return jumlah;
}

function requestDate(value) {
  try {
    if (value === null) throw new RangeError("Tanggal tidak valid.");
    return parseBusinessDate(value);
  } catch (error) {
    throw new ApiError(error.message);
  }
}

export async function GET(request) {
  try {
    await requireUser(["PEMILIK"]);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    let where = {};
    if (period !== null || searchParams.has("date")) {
      try {
        const range = getFinancePeriodRange(period || "day", searchParams.get("date"));
        where = { tanggal: { gte: range.start, lt: range.end } };
      } catch (error) {
        throw new ApiError(error.message);
      }
    }
    const expenses = await prisma.biayaOperasional.findMany({
      where,
      include: { user: { select: { nama: true } } },
      orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    });
    return Response.json({ expenses });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("Format data biaya operasional tidak valid.");
    }
    const kategori = typeof body.kategori === "string" ? body.kategori.trim() : "";
    const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim() : "";
    if (!kategori || kategori.length > 50) throw new ApiError("Kategori wajib diisi (maksimal 50 karakter).");
    if (!deskripsi || deskripsi.length > 255) throw new ApiError("Deskripsi wajib diisi (maksimal 255 karakter).");

    let tanggal;
    try {
      const date = requestDate(body.tanggal);
      tanggal = getFinancePeriodRange("day", date).start;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.message);
    }
    const expense = await prisma.biayaOperasional.create({
      data: { userId: user.id, tanggal, kategori, deskripsi, jumlah: expenseAmount(body.jumlah) },
      include: { user: { select: { nama: true } } },
    });
    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
