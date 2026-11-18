import { ApiError, requireUser } from "../../../lib/auth";
import {
  BACKUP_TABLES,
  BACKUP_TABLE_NAMES,
  BACKUP_VERSION,
  BackupValidationError,
  MAX_BACKUP_BYTES,
  validateBackup,
} from "../../../lib/backup";
import { prisma } from "../../../lib/prisma";

const deleteOrder = [
  "detailStockOpname",
  "detailPenjualan",
  "riwayatHarga",
  "stockOpname",
  "batchProduk",
  "transaksiPenjualan",
  "kalkulasiHarga",
  "biayaOperasional",
  "imporData",
  "produk",
  "kategoriObat",
  "satuan",
  "users",
];

const insertOrder = [
  "users",
  "kategoriObat",
  "satuan",
  "produk",
  "batchProduk",
  "stockOpname",
  "transaksiPenjualan",
  "kalkulasiHarga",
  "detailPenjualan",
  "riwayatHarga",
  "imporData",
  "detailStockOpname",
  "biayaOperasional",
];

const sequenceQueries = [
  `SELECT setval(pg_get_serial_sequence('"users"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "users"`,
  `SELECT setval(pg_get_serial_sequence('"kategori_obat"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "kategori_obat"`,
  `SELECT setval(pg_get_serial_sequence('"satuan"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "satuan"`,
  `SELECT setval(pg_get_serial_sequence('"produk"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "produk"`,
  `SELECT setval(pg_get_serial_sequence('"batch_produk"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "batch_produk"`,
  `SELECT setval(pg_get_serial_sequence('"stock_opname"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "stock_opname"`,
  `SELECT setval(pg_get_serial_sequence('"transaksi_penjualan"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "transaksi_penjualan"`,
  `SELECT setval(pg_get_serial_sequence('"detail_penjualan"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "detail_penjualan"`,
  `SELECT setval(pg_get_serial_sequence('"kalkulasi_harga"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "kalkulasi_harga"`,
  `SELECT setval(pg_get_serial_sequence('"riwayat_harga"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "riwayat_harga"`,
  `SELECT setval(pg_get_serial_sequence('"impor_data"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "impor_data"`,
  `SELECT setval(pg_get_serial_sequence('"detail_stock_opname"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "detail_stock_opname"`,
  `SELECT setval(pg_get_serial_sequence('"biaya_operasional"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "biaya_operasional"`,
];

function errorResponse(error) {
  if (error instanceof ApiError || error instanceof BackupValidationError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Terjadi kesalahan saat memproses backup." }, { status: 500 });
}

async function readJsonBody(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BACKUP_BYTES) {
    throw new ApiError("Ukuran backup melebihi batas 25 MB.", 413);
  }
  if (!request.body) throw new ApiError("Format JSON tidak valid.");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BACKUP_BYTES) {
        await reader.cancel();
        throw new ApiError("Ukuran backup melebihi batas 25 MB.", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Format JSON tidak valid.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("Format JSON tidak valid.");
  }
}

export async function GET() {
  try {
    await requireUser(["PEMILIK"]);
    const data = await prisma.$transaction(
      BACKUP_TABLE_NAMES.map((tableName) =>
        prisma[BACKUP_TABLES[tableName].delegate].findMany({ orderBy: { id: "asc" } }),
      ),
      { isolationLevel: "RepeatableRead", timeout: 60_000 },
    );
    const backup = {
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      data: Object.fromEntries(BACKUP_TABLE_NAMES.map((name, index) => [name, data[index]])),
    };
    const body = JSON.stringify(backup);
    if (Buffer.byteLength(body, "utf8") > MAX_BACKUP_BYTES) {
      throw new ApiError("Backup melebihi batas ukuran unduhan 25 MB.", 413);
    }

    const date = new Date().toISOString().slice(0, 10);
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="apotekrisa-backup-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    await requireUser(["PEMILIK"]);
    const backup = await readJsonBody(request);
    if (!backup || typeof backup !== "object" || Array.isArray(backup) ||
        backup.confirmation !== "RESTORE") {
      throw new ApiError("Konfirmasi restore wajib bernilai tepat 'RESTORE'.");
    }
    const data = validateBackup(backup);

    await prisma.$transaction(async (tx) => {
      for (const tableName of deleteOrder) {
        await tx[BACKUP_TABLES[tableName].delegate].deleteMany();
      }
      for (const tableName of insertOrder) {
        const rows = data[tableName];
        const delegate = tx[BACKUP_TABLES[tableName].delegate];
        for (let offset = 0; offset < rows.length; offset += 500) {
          await delegate.createMany({ data: rows.slice(offset, offset + 500) });
        }
      }
      for (const query of sequenceQueries) {
        await tx.$queryRawUnsafe(query);
      }
    }, { maxWait: 10_000, timeout: 60_000 });

    return Response.json({
      message: "Restore berhasil.",
      restoredRows: Object.fromEntries(BACKUP_TABLE_NAMES.map((name) => [name, data[name].length])),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
