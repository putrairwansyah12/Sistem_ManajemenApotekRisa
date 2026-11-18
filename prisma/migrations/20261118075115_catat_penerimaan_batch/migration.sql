-- AlterTable
ALTER TABLE "batch_produk" ADD COLUMN     "penerima_id" INTEGER;

-- AddForeignKey
ALTER TABLE "batch_produk" ADD CONSTRAINT "batch_produk_penerima_id_fkey" FOREIGN KEY ("penerima_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
