import { ApiError, apiError, requireUser } from "../../../../lib/auth";
import { assertBatchStockFitsProductStock } from "../../../../lib/inventory";
import { prisma } from "../../../../lib/prisma";
import {
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  parseProductWorkbook,
  planProductImport,
} from "../../../../lib/product-excel";

const MAX_MULTIPART_BYTES = MAX_IMPORT_BYTES + 64 * 1024;
const PRODUCT_INCLUDE = { kategori: true, satuan: true };

async function readBoundedMultipart(request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    throw new ApiError("Permintaan harus menggunakan multipart/form-data.");
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    throw new ApiError("Ukuran workbook maksimal 5 MB.", 413);
  }
  if (!request.body) throw new ApiError("Berkas impor wajib diunggah.");

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        throw new ApiError("Ukuran workbook maksimal 5 MB.", 413);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  try {
    const boundedRequest = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": contentType },
      body: Buffer.concat(chunks, total),
    });
    return await boundedRequest.formData();
  } catch {
    throw new ApiError("Format multipart atau workbook tidak valid.");
  }
}

async function readImport(request) {
  const form = await readBoundedMultipart(request);
  const files = form.getAll("file");
  const modes = form.getAll("mode");
  if (files.length !== 1 || modes.length !== 1 || typeof modes[0] !== "string") {
    throw new ApiError("Kirim tepat satu file pada field file dan satu mode.");
  }
  const file = files[0];
  if (typeof file === "string" || !file.name) throw new ApiError("Berkas workbook wajib diisi.");
  if (!["preview", "commit"].includes(modes[0])) {
    throw new ApiError("Mode harus preview atau commit.");
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new ApiError("Format berkas harus .xlsx.");
  }
  if (file.size > MAX_IMPORT_BYTES) throw new ApiError("Ukuran workbook maksimal 5 MB.", 413);

  let rows;
  try {
    rows = await parseProductWorkbook(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    throw new ApiError(error.message || "Workbook tidak valid.", 422);
  }
  if (rows.length > MAX_IMPORT_ROWS) throw new ApiError(`Workbook maksimal berisi ${MAX_IMPORT_ROWS} baris data.`, 422);
  if (rows.length === 0) throw new ApiError("Workbook harus memiliki setidaknya satu baris data.", 422);
  return { file, mode: modes[0], rows };
}

async function planImport(client, parsedRows) {
  const products = await client.produk.findMany({
    include: { ...PRODUCT_INCLUDE, batch: { select: { jumlah: true } } },
  });
  return planProductImport(parsedRows, products);
}

function importSummary(rows) {
  return {
    rowCount: rows.length,
    counts: {
      create: rows.filter((row) => row.action === "create").length,
      update: rows.filter((row) => row.action === "update").length,
      stokDiperbarui: rows.filter((row) =>
        row.action === "update" && row.stokSebelum !== row.product.stok).length,
      ambiguous: rows.filter((row) => row.action === "ambiguous").length,
      errors: rows.filter((row) => row.errors.length > 0).length,
    },
    rows,
  };
}

async function upsertMasterData(tx, product) {
  const kategori = await tx.kategoriObat.upsert({
    where: { nama: product.kategori },
    update: {},
    create: { nama: product.kategori },
  });
  const satuan = await tx.satuan.upsert({
    where: { kode: product.satuan },
    update: {},
    create: { kode: product.satuan },
  });
  return { kategoriId: kategori.id, satuanId: satuan.id };
}

export async function POST(request) {
  try {
    const user = await requireUser(["PEMILIK"]);
    const { file, mode, rows: parsedRows } = await readImport(request);

    if (mode === "preview") {
      const rows = await planImport(prisma, parsedRows);
      return Response.json({ mode, filename: file.name, ...importSummary(rows) });
    }

    const result = await prisma.$transaction(async (tx) => {
      const rows = await planImport(tx, parsedRows);
      const summary = importSummary(rows);
      if (summary.counts.errors > 0) return { invalid: true, summary };

      for (const row of rows) {
        const masterData = await upsertMasterData(tx, row.product);
        const data = {
          kodeBarang: row.product.kodeBarang || null,
          namaProduk: row.product.namaProduk,
          kategoriId: masterData.kategoriId,
          satuanId: masterData.satuanId,
          hargaBeli: row.product.hargaBeli,
          hpp: row.product.hpp,
          hargaJual: row.product.hargaJual,
          stok: row.product.stok,
          stokMinimum: row.product.stokMinimum,
        };

        if (row.action === "create") {
          const created = await tx.produk.create({
            data,
            select: { id: true },
          });
          row.productId = created.id;
        } else {
          const existing = await tx.produk.findUnique({
            where: { id: row.productId },
            select: { stok: true, hargaBeli: true, hpp: true, hargaJual: true },
          });
          if (!existing) throw new ApiError(`Produk pada baris ${row.row} tidak lagi tersedia.`, 409);
          const batchStock = await tx.batchProduk.aggregate({
            where: { produkId: row.productId },
            _sum: { jumlah: true },
          });
          try {
            assertBatchStockFitsProductStock(row.product.stok, batchStock._sum.jumlah ?? 0);
          } catch (error) {
            if (error instanceof RangeError) throw new ApiError(`Baris ${row.row}: ${error.message}`, 409);
            throw error;
          }
          const updated = await tx.produk.updateMany({
            where: { id: row.productId, stok: existing.stok },
            data,
          });
          if (updated.count !== 1) throw new ApiError(`Stok produk pada baris ${row.row} berubah. Muat ulang data dan ulangi impor.`, 409);
          if (existing.stok !== row.product.stok) {
            await tx.stockOpname.create({
              data: {
                produkId: row.productId,
                userId: user.id,
                stokSistem: existing.stok,
                stokFisik: row.product.stok,
                selisih: row.product.stok - existing.stok,
                alasan: `Impor Excel: ${file.name}`.slice(0, 255),
              },
            });
          }
          for (const [field, jenisHarga] of [["hargaBeli", "BELI"], ["hpp", "HPP"], ["hargaJual", "JUAL"]]) {
            if (Number(existing[field]) === row.product[field]) continue;
            await tx.riwayatHarga.create({
              data: {
                produkId: row.productId,
                userId: user.id,
                jenisHarga,
                hargaLama: existing[field],
                hargaBaru: row.product[field],
              },
            });
          }
        }
      }

      const audit = await tx.imporData.create({
        data: {
          namaBerkas: file.name.slice(0, 255),
          tipeBerkas: "EXCEL",
          userId: user.id,
          jumlahBaris: rows.length,
          status: "BERHASIL",
        },
        select: { id: true, jumlahBaris: true, status: true, tanggal: true },
      });
      return { invalid: false, summary: importSummary(rows), audit };
    }, {
      isolationLevel: "Serializable",
      maxWait: 10_000,
      timeout: 120_000,
    });

    if (result.invalid) {
      return Response.json({
        error: "Workbook memiliki baris yang tidak valid; tidak ada perubahan yang disimpan.",
        mode,
        filename: file.name,
        ...result.summary,
      }, { status: 422 });
    }
    return Response.json({
      mode,
      filename: file.name,
      ...result.summary,
      audit: result.audit,
    });
  } catch (error) {
    return apiError(error);
  }
}
