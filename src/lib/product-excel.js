import ExcelJS from "exceljs";

export const PRODUCT_COLUMNS = [
  "kodeBarang",
  "namaProduk",
  "kategori",
  "satuan",
  "hargaBeli",
  "hpp",
  "hargaJual",
  "stok",
  "stokMinimum",
];

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;
const MAX_UNCOMPRESSED_BYTES = 32 * 1024 * 1024;

const TEXT_LIMITS = { kodeBarang: 30, namaProduk: 200, kategori: 50, satuan: 20 };
const PRICE_COLUMNS = ["hargaBeli", "hpp", "hargaJual"];

function cellValue(cell) {
  const value = cell?.value;
  return value === null || value === undefined ? "" : value;
}

function isBlankRow(values) {
  return values.every((value) => value === "" || value === null || value === undefined);
}

function textValue(value, column, required) {
  if (typeof value !== "string") {
    return { error: `${column} harus berupa teks.` };
  }
  const result = value.trim();
  if (required && !result) return { error: `${column} wajib diisi.` };
  if (result.length > TEXT_LIMITS[column]) {
    return { error: `${column} maksimal ${TEXT_LIMITS[column]} karakter.` };
  }
  return { value: result };
}

function numberValue(value, column, integer) {
  const text = typeof value === "string" ? value.trim() : "";
  const validTextNumber = integer ? /^\d+$/.test(text) : /^\d+(?:\.\d{1,2})?$/.test(text);
  const number = typeof value === "number" ? value : validTextNumber ? Number(text) : Number.NaN;
  if (!Number.isFinite(number) || number < 0) {
    return { error: `${column} harus berupa angka nol atau lebih.` };
  }
  if (integer && (!Number.isInteger(number) || number > 2147483647)) {
    return { error: `${column} harus berupa bilangan bulat maksimal 2147483647.` };
  }
  if (!integer) {
    const rounded = Math.round(number * 100) / 100;
    if (number > 9999999999.99 || Math.abs(number - rounded) > 1e-8) {
      return { error: `${column} maksimal 9999999999.99 dengan dua angka desimal.` };
    }
    return { value: rounded };
  }
  return { value: number };
}

export function normalizeProductText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

function matchKey(row) {
  return [row.namaProduk, row.kategori, row.satuan].map(normalizeProductText).join("\u0000");
}

function validateZipSize(buffer) {
  const searchStart = Math.max(0, buffer.length - 65557);
  let endOffset = -1;
  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new Error("Berkas bukan workbook Excel .xlsx yang valid.");

  const entries = buffer.readUInt16LE(endOffset + 10);
  const directorySize = buffer.readUInt32LE(endOffset + 12);
  const directoryOffset = buffer.readUInt32LE(endOffset + 16);
  if (entries === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff
    || directoryOffset + directorySize > endOffset) {
    throw new Error("Workbook Excel tidak valid atau memakai format arsip yang tidak didukung.");
  }

  let offset = directoryOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > directoryOffset + directorySize || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Berkas bukan workbook Excel .xlsx yang valid.");
    }
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error("Workbook Excel terlalu besar atau memakai format arsip yang tidak didukung.");
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("Ukuran workbook setelah dibuka maksimal 32 MB.");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
}

export async function parseProductWorkbook(buffer) {
  validateZipSize(buffer);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new Error("Berkas bukan workbook Excel .xlsx yang valid.");
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Workbook tidak memiliki lembar kerja.");
  if (worksheet.columnCount > PRODUCT_COLUMNS.length || worksheet.rowCount > MAX_IMPORT_ROWS + 1) {
    throw new Error(`Workbook maksimal berisi ${MAX_IMPORT_ROWS} baris data dan ${PRODUCT_COLUMNS.length} kolom.`);
  }
  const header = worksheet.getRow(1);
  const actualHeaders = [];
  for (let index = 1; index <= Math.max(header.cellCount, worksheet.columnCount); index += 1) {
    const value = cellValue(header.getCell(index));
    if (value !== "") actualHeaders.push(typeof value === "string" ? value.trim() : value);
  }
  if (actualHeaders.length !== PRODUCT_COLUMNS.length
    || actualHeaders.some((value, index) => value !== PRODUCT_COLUMNS[index])) {
    throw new Error(`Header harus tepat sesuai urutan: ${PRODUCT_COLUMNS.join(", ")}.`);
  }

  const rows = [];
  worksheet.eachRow((worksheetRow, rowNumber) => {
    if (rowNumber === 1) return;
    const values = PRODUCT_COLUMNS.map((_, index) => cellValue(worksheetRow.getCell(index + 1)));
    if (isBlankRow(values)) return;
    rows.push({ row: rowNumber, values });
  });
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Workbook maksimal berisi ${MAX_IMPORT_ROWS} baris data.`);
  }

  return rows.map(({ row, values }) => {
    const product = {};
    const errors = [];
    for (const [index, column] of PRODUCT_COLUMNS.entries()) {
      const value = values[index];
      if (TEXT_LIMITS[column]) {
        const result = textValue(value, column, column !== "kodeBarang");
        if (result.error) errors.push(result.error);
        else product[column] = result.value;
      } else {
        const result = numberValue(value, column, !PRICE_COLUMNS.includes(column));
        if (result.error) errors.push(result.error);
        else product[column] = result.value;
      }
    }
    return { row, product, errors };
  });
}

export function planProductImport(parsedRows, products) {
  const byCode = new Map();
  const byName = new Map();
  for (const product of products) {
    if (product.kodeBarang) byCode.set(product.kodeBarang, product);
    const key = matchKey({
      namaProduk: product.namaProduk,
      kategori: product.kategori.nama,
      satuan: product.satuan.kode,
    });
    const matches = byName.get(key) ?? [];
    matches.push(product);
    byName.set(key, matches);
  }

  const usedProducts = new Set();
  const usedNewIdentifiers = new Set();
  return parsedRows.map(({ row, product, errors: sourceErrors }) => {
    const errors = [...sourceErrors];
    let matchedProduct = null;
    let action = "invalid";
    if (errors.length === 0) {
      if (product.kodeBarang) {
        matchedProduct = byCode.get(product.kodeBarang) ?? null;
      } else {
        const matches = byName.get(matchKey(product)) ?? [];
        if (matches.length > 1) {
          errors.push("Produk yang cocok tidak unik; isi kodeBarang untuk menentukan produk.");
          action = "ambiguous";
        } else {
          matchedProduct = matches[0] ?? null;
        }
      }

      const batchStock = matchedProduct?.batch?.reduce((total, batch) => total + batch.jumlah, 0) ?? 0;
      if (matchedProduct && Number.isInteger(product.stok) && product.stok < batchStock) {
        errors.push(
          `Stok pada Excel (${product.stok}) lebih kecil dari total stok batch tercatat (${batchStock}); sesuaikan stok per batch melalui Stock Opname.`,
        );
      }

      if (errors.length === 0 && matchedProduct) {
        if (usedProducts.has(matchedProduct.id)) {
          errors.push("Produk yang sama sudah dirujuk oleh baris impor lain.");
        } else {
          usedProducts.add(matchedProduct.id);
          action = "update";
        }
      } else if (errors.length === 0) {
        const identifier = product.kodeBarang
          ? `code:${product.kodeBarang}`
          : `name:${matchKey(product)}`;
        if (usedNewIdentifiers.has(identifier)) {
          errors.push("Produk baru yang sama sudah tercantum pada baris impor lain.");
        } else {
          usedNewIdentifiers.add(identifier);
          action = "create";
        }
      }
    }
    return {
      row,
      action: errors.length ? action === "ambiguous" ? action : "invalid" : action,
      productId: matchedProduct?.id ?? null,
      product,
      errors,
    };
  });
}

export function createProductWorkbook(products) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Produk");
  worksheet.addRow(PRODUCT_COLUMNS);
  for (const product of products) {
    worksheet.addRow([
      product.kodeBarang ?? "",
      product.namaProduk,
      product.kategori.nama,
      product.satuan.kode,
      Number(product.hargaBeli),
      Number(product.hpp),
      Number(product.hargaJual),
      product.stok,
      product.stokMinimum,
    ]);
  }
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  return workbook.xlsx.writeBuffer();
}

