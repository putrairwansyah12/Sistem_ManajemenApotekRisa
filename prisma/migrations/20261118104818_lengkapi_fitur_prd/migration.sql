-- AlterEnum
ALTER TYPE "JenisHarga" ADD VALUE 'HPP';

-- AlterTable
ALTER TABLE "detail_penjualan" ADD COLUMN     "hpp_satuan" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "kalkulasi_harga" ADD COLUMN     "biaya_gratis_ongkir" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "laba_kotor" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "persen_pajak" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transaksi_penjualan" ADD COLUMN     "biaya_admin" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "biaya_gratis_ongkir" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "biaya_layanan" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "biaya_pajak" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "biaya_pengemasan" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "potongan" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "detail_stock_opname" (
    "id" SERIAL NOT NULL,
    "stock_opname_id" INTEGER NOT NULL,
    "batch_produk_id" INTEGER,
    "nomor_batch" VARCHAR(50) NOT NULL,
    "tanggal_kedaluwarsa" DATE NOT NULL,
    "jumlah_sebelum" INTEGER NOT NULL,
    "jumlah_fisik" INTEGER NOT NULL,

    CONSTRAINT "detail_stock_opname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biaya_operasional" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kategori" VARCHAR(50) NOT NULL,
    "deskripsi" VARCHAR(255) NOT NULL,
    "jumlah" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "biaya_operasional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "biaya_operasional_tanggal_idx" ON "biaya_operasional"("tanggal");

-- AddForeignKey
ALTER TABLE "detail_stock_opname" ADD CONSTRAINT "detail_stock_opname_stock_opname_id_fkey" FOREIGN KEY ("stock_opname_id") REFERENCES "stock_opname"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_stock_opname" ADD CONSTRAINT "detail_stock_opname_batch_produk_id_fkey" FOREIGN KEY ("batch_produk_id") REFERENCES "batch_produk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biaya_operasional" ADD CONSTRAINT "biaya_operasional_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
