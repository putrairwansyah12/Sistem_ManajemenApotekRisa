import { describe, expect, it } from "vitest";
import { BACKUP_TABLE_NAMES, BACKUP_VERSION, validateBackup } from "./backup";

function emptyBackup() {
  const data = Object.fromEntries(BACKUP_TABLE_NAMES.map((name) => [name, []]));
  data.users.push({
    id: 1,
    nama: "Pemilik",
    username: "pemilik",
    passwordHash: "hash",
    role: "PEMILIK",
    aktif: true,
    dibuatPada: "2026-11-18T00:00:00.000Z",
  });
  return {
    version: BACKUP_VERSION,
    createdAt: "2026-11-18T00:00:00.000Z",
    data,
  };
}

describe("validateBackup", () => {
  it("accepts a versioned backup with every required table array", () => {
    expect(validateBackup(emptyBackup())).toEqual(emptyBackup().data);
  });

  it("rejects unsupported versions and missing table arrays", () => {
    const wrongVersion = emptyBackup();
    wrongVersion.version = 3;
    expect(() => validateBackup(wrongVersion)).toThrow("Versi backup tidak didukung");

    const missingTable = emptyBackup();
    delete missingTable.data.produk;
    expect(() => validateBackup(missingTable)).toThrow("tepat semua tabel aplikasi");
  });

  it("restores version 1 backups without restoring legacy patient data", () => {
    const legacyBackup = emptyBackup();
    legacyBackup.version = 1;
    legacyBackup.data.pasien = [{ id: 1, nama: "Pasien lama" }];
    legacyBackup.data.kunjunganPasien = [{ id: 1, pasienId: 1 }];

    const restoredData = validateBackup(legacyBackup);

    expect(restoredData).not.toHaveProperty("pasien");
    expect(restoredData).not.toHaveProperty("kunjunganPasien");
    expect(Object.keys(restoredData)).toEqual(BACKUP_TABLE_NAMES);
  });

  it("rejects rows with missing, extra, or invalidly typed fields", () => {
    const wrongShape = emptyBackup();
    wrongShape.data.users[0] = { id: 1, username: "owner" };
    expect(() => validateBackup(wrongShape)).toThrow("Bentuk baris 1 pada users");

    const wrongType = emptyBackup();
    wrongType.data.satuan.push({ id: 1, kode: 42 });
    expect(() => validateBackup(wrongType)).toThrow("kolom kode yang tidak valid");
  });

  it("rejects a restore that would leave the system without an active owner", () => {
    const noActiveOwner = emptyBackup();
    noActiveOwner.data.users[0].aktif = false;
    expect(() => validateBackup(noActiveOwner)).toThrow("akun pemilik aktif");
  });
});
