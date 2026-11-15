-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PEMILIK', 'KASIR');

-- CreateEnum
CREATE TYPE "JenisJual" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "JenisHarga" AS ENUM ('BELI', 'JUAL');

-- CreateEnum
CREATE TYPE "TipeBerkas" AS ENUM ('EXCEL', 'PDF');

-- CreateEnum
CREATE TYPE "StatusImpor" AS ENUM ('PRATINJAU', 'BERHASIL', 'GAGAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori_obat" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(50) NOT NULL,

    CONSTRAINT "kategori_obat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satuan" (
    "id" SERIAL NOT NULL,
    "kode" VARCHAR(20) NOT NULL,

    CONSTRAINT "satuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk" (
    "id" SERIAL NOT NULL,
    "kode_barang" VARCHAR(30),
    "nama_produk" VARCHAR(200) NOT NULL,
    "kategori_id" INTEGER NOT NULL,
    "satuan_id" INTEGER NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "stok_minimum" INTEGER NOT NULL DEFAULT 0,
    "harga_beli" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "harga_jual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hpp" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_produk" (
    "id" SERIAL NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "nomor_batch" VARCHAR(50) NOT NULL,
    "tanggal_kedaluwarsa" DATE NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "batch_produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pasien" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "alamat" VARCHAR(255),
    "kontak" VARCHAR(20),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pasien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kunjungan_pasien" (
    "id" SERIAL NOT NULL,
    "pasien_id" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keluhan" TEXT,

    CONSTRAINT "kunjungan_pasien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname" (
    "id" SERIAL NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stok_sistem" INTEGER NOT NULL,
    "stok_fisik" INTEGER NOT NULL,
    "selisih" INTEGER NOT NULL,
    "alasan" VARCHAR(255) NOT NULL,

    CONSTRAINT "stock_opname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi_penjualan" (
    "id" SERIAL NOT NULL,
    "kode_transaksi" VARCHAR(30) NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "jenis" "JenisJual" NOT NULL,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "transaksi_penjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_penjualan" (
    "id" SERIAL NOT NULL,
    "transaksi_id" INTEGER NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga_satuan" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "detail_penjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kalkulasi_harga" (
    "id" SERIAL NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hpp" DECIMAL(12,2) NOT NULL,
    "persen_biaya_admin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "biaya_pengemasan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "biaya_layanan" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "persen_target_laba" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "harga_jual" DECIMAL(12,2) NOT NULL,
    "laba_bersih" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "kalkulasi_harga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_harga" (
    "id" SERIAL NOT NULL,
    "produk_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kalkulasi_id" INTEGER,
    "jenis_harga" "JenisHarga" NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "harga_lama" DECIMAL(12,2) NOT NULL,
    "harga_baru" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "riwayat_harga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impor_data" (
    "id" SERIAL NOT NULL,
    "nama_berkas" VARCHAR(255) NOT NULL,
    "tipe_berkas" "TipeBerkas" NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlah_baris" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusImpor" NOT NULL DEFAULT 'PRATINJAU',

    CONSTRAINT "impor_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "kategori_obat_nama_key" ON "kategori_obat"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "satuan_kode_key" ON "satuan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "produk_kode_barang_key" ON "produk"("kode_barang");

-- CreateIndex
CREATE INDEX "produk_nama_produk_idx" ON "produk"("nama_produk");

-- CreateIndex
CREATE INDEX "batch_produk_tanggal_kedaluwarsa_idx" ON "batch_produk"("tanggal_kedaluwarsa");

-- CreateIndex
CREATE UNIQUE INDEX "batch_produk_produk_id_nomor_batch_key" ON "batch_produk"("produk_id", "nomor_batch");

-- CreateIndex
CREATE INDEX "kunjungan_pasien_tanggal_idx" ON "kunjungan_pasien"("tanggal");

-- CreateIndex
CREATE INDEX "stock_opname_tanggal_idx" ON "stock_opname"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_penjualan_kode_transaksi_key" ON "transaksi_penjualan"("kode_transaksi");

-- CreateIndex
CREATE INDEX "transaksi_penjualan_tanggal_idx" ON "transaksi_penjualan"("tanggal");

-- CreateIndex
CREATE INDEX "riwayat_harga_tanggal_idx" ON "riwayat_harga"("tanggal");

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori_obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_satuan_id_fkey" FOREIGN KEY ("satuan_id") REFERENCES "satuan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_produk" ADD CONSTRAINT "batch_produk_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kunjungan_pasien" ADD CONSTRAINT "kunjungan_pasien_pasien_id_fkey" FOREIGN KEY ("pasien_id") REFERENCES "pasien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname" ADD CONSTRAINT "stock_opname_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname" ADD CONSTRAINT "stock_opname_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_penjualan" ADD CONSTRAINT "transaksi_penjualan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_penjualan" ADD CONSTRAINT "detail_penjualan_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi_penjualan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_penjualan" ADD CONSTRAINT "detail_penjualan_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalkulasi_harga" ADD CONSTRAINT "kalkulasi_harga_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalkulasi_harga" ADD CONSTRAINT "kalkulasi_harga_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_harga" ADD CONSTRAINT "riwayat_harga_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_harga" ADD CONSTRAINT "riwayat_harga_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_harga" ADD CONSTRAINT "riwayat_harga_kalkulasi_id_fkey" FOREIGN KEY ("kalkulasi_id") REFERENCES "kalkulasi_harga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impor_data" ADD CONSTRAINT "impor_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "produk" ADD CONSTRAINT chk_stok CHECK (stok >= 0);
ALTER TABLE "stock_opname" ADD CONSTRAINT chk_stok_fisik CHECK (stok_fisik >= 0);