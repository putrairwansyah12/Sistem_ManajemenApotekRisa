export const BACKUP_VERSION = 2;
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
export const MAX_BACKUP_ROWS_PER_TABLE = 100_000;
export const MAX_BACKUP_TOTAL_ROWS = 250_000;

const tables = {
  users: {
    delegate: "user",
    fields: {
      id: "id", nama: ["string", 100], username: ["string", 50], passwordHash: ["string", 255],
      role: ["enum", ["PEMILIK", "KASIR"]], aktif: "boolean", dibuatPada: "date",
    },
  },
  kategoriObat: { delegate: "kategoriObat", fields: { id: "id", nama: ["string", 50] } },
  satuan: { delegate: "satuan", fields: { id: "id", kode: ["string", 20] } },
  produk: {
    delegate: "produk",
    fields: {
      id: "id", kodeBarang: ["nullableString", 30], namaProduk: ["string", 200],
      kategoriId: "id", satuanId: "id", stok: "int", stokMinimum: "int",
      hargaBeli: "decimal", hargaJual: "decimal", hpp: "decimal", aktif: "boolean",
      diperbaruiPada: "date",
    },
  },
  batchProduk: {
    delegate: "batchProduk",
    fields: {
      id: "id", produkId: "id", penerimaId: "nullableId", nomorBatch: ["string", 50],
      tanggalKedaluwarsa: "date", jumlah: "int",
    },
  },
  stockOpname: {
    delegate: "stockOpname",
    fields: {
      id: "id", produkId: "id", userId: "id", tanggal: "date", stokSistem: "int",
      stokFisik: "int", selisih: "int", alasan: ["string", 255],
    },
  },
  transaksiPenjualan: {
    delegate: "transaksiPenjualan",
    fields: {
      id: "id", kodeTransaksi: ["string", 30], tanggal: "date", userId: "id",
      jenis: ["enum", ["OFFLINE", "ONLINE"]], potongan: "decimal", biayaAdmin: "decimal",
      biayaPajak: "decimal", biayaPengemasan: "decimal", biayaLayanan: "decimal",
      biayaGratisOngkir: "decimal", total: "decimal",
    },
  },
  detailPenjualan: {
    delegate: "detailPenjualan",
    fields: {
      id: "id", transaksiId: "id", produkId: "id", jumlah: "int",
      hargaSatuan: "decimal", hppSatuan: "decimal", subtotal: "decimal",
    },
  },
  kalkulasiHarga: {
    delegate: "kalkulasiHarga",
    fields: {
      id: "id", produkId: "id", userId: "id", tanggal: "date", hpp: "decimal",
      persenBiayaAdmin: "decimal", persenPajak: "decimal", biayaPengemasan: "decimal",
      biayaLayanan: "decimal", biayaGratisOngkir: "decimal", persenTargetLaba: "decimal",
      hargaJual: "decimal", labaKotor: "decimal", labaBersih: "decimal",
    },
  },
  riwayatHarga: {
    delegate: "riwayatHarga",
    fields: {
      id: "id", produkId: "id", userId: "id", kalkulasiId: "nullableId",
      jenisHarga: ["enum", ["BELI", "HPP", "JUAL"]], tanggal: "date",
      hargaLama: "decimal", hargaBaru: "decimal",
    },
  },
  imporData: {
    delegate: "imporData",
    fields: {
      id: "id", namaBerkas: ["string", 255], tipeBerkas: ["enum", ["EXCEL", "PDF"]],
      userId: "id", tanggal: "date", jumlahBaris: "int",
      status: ["enum", ["PRATINJAU", "BERHASIL", "GAGAL"]],
    },
  },
  detailStockOpname: {
    delegate: "detailStockOpname",
    fields: {
      id: "id", stockOpnameId: "id", batchProdukId: "nullableId", nomorBatch: ["string", 50],
      tanggalKedaluwarsa: "date", jumlahSebelum: "int", jumlahFisik: "int",
    },
  },
  biayaOperasional: {
    delegate: "biayaOperasional",
    fields: {
      id: "id", userId: "id", tanggal: "date", kategori: ["string", 50],
      deskripsi: ["string", 255], jumlah: "decimal",
    },
  },
};

export const BACKUP_TABLE_NAMES = Object.keys(tables);
const LEGACY_PATIENT_TABLE_NAMES = ["pasien", "kunjunganPasien"];

export class BackupValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackupValidationError";
    this.status = 400;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(message) {
  throw new BackupValidationError(message);
}

function validateValue(value, type, tableName, index, fieldName) {
  const invalid = () => fail(`Baris ${index + 1} pada ${tableName} memiliki kolom ${fieldName} yang tidak valid.`);
  if (type === "id") {
    if (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) invalid();
  } else if (type === "nullableId") {
    if (value !== null && (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647)) invalid();
  } else if (type === "int") {
    if (!Number.isSafeInteger(value) || value < -2_147_483_648 || value > 2_147_483_647) invalid();
  } else if (type === "boolean") {
    if (typeof value !== "boolean") invalid();
  } else if (type === "date") {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) invalid();
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.toISOString() !== value) invalid();
  } else if (type === "decimal") {
    if (typeof value !== "string" || !/^-?\d+(?:\.\d+)?$/.test(value)) invalid();
  } else if (Array.isArray(type) && type[0] === "enum") {
    if (!type[1].includes(value)) invalid();
  } else if (Array.isArray(type) && (type[0] === "string" || type[0] === "nullableString")) {
    const nullable = type[0] === "nullableString";
    if (nullable && value === null) return;
    if (typeof value !== "string" || value.length > type[1]) invalid();
  }
}

export function validateBackup(backup) {
  if (!isRecord(backup)) fail("Format backup tidak valid.");

  const allowedRootKeys = ["version", "createdAt", "data", "confirmation"];
  if (Object.keys(backup).some((key) => !allowedRootKeys.includes(key))) {
    fail("Backup memuat kolom yang tidak dikenal.");
  }
  if (backup.version !== 1 && backup.version !== BACKUP_VERSION) fail("Versi backup tidak didukung.");
  if (typeof backup.createdAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(backup.createdAt) ||
      Number.isNaN(new Date(backup.createdAt).getTime()) ||
      new Date(backup.createdAt).toISOString() !== backup.createdAt) {
    fail("Tanggal backup tidak valid.");
  }
  if (!isRecord(backup.data)) fail("Bagian data backup tidak valid.");

  const names = Object.keys(tables);
  const legacyNames = backup.version === 1 ? [...names, ...LEGACY_PATIENT_TABLE_NAMES] : names;
  if (legacyNames.some((name) => !Object.hasOwn(backup.data, name)) ||
      Object.keys(backup.data).some((name) => !legacyNames.includes(name))) {
    fail("Backup harus memuat tepat semua tabel aplikasi.");
  }

  let totalRows = 0;
  if (backup.version === 1) {
    for (const tableName of LEGACY_PATIENT_TABLE_NAMES) {
      const rows = backup.data[tableName];
      if (!Array.isArray(rows)) fail(`Data ${tableName} harus berupa array.`);
      if (rows.length > MAX_BACKUP_ROWS_PER_TABLE) fail(`Jumlah baris ${tableName} melebihi batas.`);
      totalRows += rows.length;
    }
  }
  if (totalRows > MAX_BACKUP_TOTAL_ROWS) fail("Jumlah total baris backup melebihi batas.");
  for (const [tableName, table] of Object.entries(tables)) {
    const rows = backup.data[tableName];
    if (!Array.isArray(rows)) fail(`Data ${tableName} harus berupa array.`);
    if (rows.length > MAX_BACKUP_ROWS_PER_TABLE) fail(`Jumlah baris ${tableName} melebihi batas.`);
    totalRows += rows.length;
    if (totalRows > MAX_BACKUP_TOTAL_ROWS) fail("Jumlah total baris backup melebihi batas.");

    const expectedFields = Object.keys(table.fields).sort();
    for (const [index, row] of rows.entries()) {
      if (!isRecord(row)) fail(`Baris ${index + 1} pada ${tableName} harus berupa objek.`);
      const actualFields = Object.keys(row).sort();
      if (actualFields.length !== expectedFields.length ||
          expectedFields.some((field, fieldIndex) => actualFields[fieldIndex] !== field)) {
        fail(`Bentuk baris ${index + 1} pada ${tableName} tidak sesuai schema.`);
      }
      for (const [fieldName, type] of Object.entries(table.fields)) {
        validateValue(row[fieldName], type, tableName, index, fieldName);
      }
    }
  }

  if (!backup.data.users.some((user) => user.role === "PEMILIK" && user.aktif)) {
    fail("Backup harus memuat setidaknya satu akun pemilik aktif.");
  }

  return Object.fromEntries(names.map((name) => [name, backup.data[name]]));
}

export const BACKUP_TABLES = tables;
