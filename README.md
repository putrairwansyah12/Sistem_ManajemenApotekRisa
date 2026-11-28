# Apotek Risa

Sistem informasi apotek berbasis Next.js dan PostgreSQL. Fitur yang sudah tersambung ke database:

- Login dengan session cookie HTTP-only dan pembatasan peran pemilik/kasir.
- Dashboard omzet, transaksi terbaru, stok menipis, dan batch kedaluwarsa.
- Katalog obat, kategori, satuan, harga, dan arsip produk.
- Transaksi penjualan offline/online dengan potongan, biaya, snapshot HPP, FEFO, dan validasi stok batch.
- Penerimaan batch, peringatan kedaluwarsa 3/6 bulan, serta deteksi batch dengan tanggal kedaluwarsa sama.
- Stock opname per batch dengan riwayat rincian dan pembaruan stok atomik.
- Kalkulator harga dengan laba kotor/bersih dan riwayat harga beli, HPP, serta harga jual.
- Pencatatan biaya operasional dan laporan harian, bulanan, serta tahunan.
- Impor/ekspor produk Excel dan backup/restore database khusus pemilik.
- Riwayat penjualan dan manajemen akun pengguna.

## Persiapan

1. Pastikan PostgreSQL tersedia dan buat database untuk aplikasi.
2. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL`.
3. `.env` juga harus memiliki `APOTEKRISA_DEV_ACCOUNT_EMAIL`, `APOTEKRISA_DEV_ACCOUNT_NAME`, `APOTEKRISA_DEV_ACCOUNT_PASSWORD` (minimal 12 karakter), dan `APOTEKRISA_DEV_ACCOUNT_ROLE` (`PEMILIK` atau `KASIR`) untuk akun uji coba.
4. Buat nilai rahasia sesi. Contoh PowerShell:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Masukkan hasilnya sebagai `AUTH_SECRET` di `.env`. Opsional: atur `OWNER_PASSWORD` untuk membuat akun pemilik awal `pemilik`. Jangan commit `.env`.
5. Pasang dependensi dan siapkan database:

   ```powershell
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

6. Buka `http://localhost:3000` dan gunakan username/password uji coba yang sudah diset di `.env`.

## API utama

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`
- `GET|POST /api/products`, `PATCH|DELETE /api/products/:id`
- `GET|POST /api/sales`
- `GET|POST /api/stock-opname`
- `GET /api/dashboard`, `GET|POST /api/expiry`
- `GET /api/price-history`
- `GET|POST /api/expenses`, `DELETE /api/expenses/:id`
- `GET /api/reports?period=day|month|year&date=YYYY-MM-DD`
- `GET|POST /api/backup` (khusus pemilik)
- `GET|POST /api/users` (khusus pemilik)

### Impor dan ekspor produk Excel

Kedua endpoint hanya dapat digunakan oleh pengguna berperan `PEMILIK`.

- `GET /api/products/export` mengunduh `produk.xlsx` berisi semua produk aktif pada lembar `Produk`.
- `POST /api/products/import` menerima `multipart/form-data` dengan tepat satu file `.xlsx` pada field `file` dan field teks `mode` (`preview` atau `commit`). Batas ukuran file 5 MB, 32 MB setelah dekompresi, dan 5.000 baris data.
- Lembar pertama wajib memakai satu baris header dengan urutan tepat: `kodeBarang,namaProduk,kategori,satuan,hargaBeli,hpp,hargaJual,stok,stokMinimum`. Kolom teks harus berupa teks; nilai harga dan stok harus berupa angka nonnegatif (teks angka dengan titik desimal juga diterima). Harga maksimal dua angka desimal.
- `preview` tidak menyimpan perubahan dan mengembalikan `{ mode, filename, rowCount, counts, rows }`. Tiap entri `rows` memuat nomor `row`, `action` (`create`, `update`, `ambiguous`, atau `invalid`), `productId`, data `product`, dan daftar `errors`.
- `commit` mem-parsing ulang serta mencocokkan ulang data sebelum menyimpan. Jika ada error, respons HTTP 422 memuat daftar baris yang sama dan tidak menyimpan perubahan. Respons sukses juga memuat `audit` dengan status `BERHASIL`.
- Produk dengan `kodeBarang` terisi dicocokkan hanya berdasarkan kode tersebut. Tanpa kode, pencocokan memakai nama+kategori+satuan setelah trim, peringkasan spasi, dan perbandingan tanpa membedakan kapital; beberapa kecocokan dianggap ambigu. Produk baru menerima nilai stok awal dari workbook. Pembaruan produk lama juga memperbarui stok dan mencatat selisih sebagai stock opname; stok batch tidak diubah, sehingga stok Excel tidak boleh lebih kecil dari total stok batch yang tercatat.
- `counts` memuat jumlah `create`, `update`, `ambiguous`, dan `errors`; respons juga menyertakan `rowCount` dan detail semua baris yang tidak kosong.

### Backup dan restore

- `GET /api/backup` mengunduh backup JSON yang mencakup data seluruh tabel aplikasi, termasuk hash sandi untuk mempertahankan akun.
- `POST /api/backup` menerima file backup tersebut dalam JSON dengan properti tambahan `"confirmation": "RESTORE"`. Restore mengganti semua data dan hanya dapat dilakukan pemilik; batas ukuran file 25 MB.
- Simpan file backup dengan aman karena file berisi hash sandi akun. Jangan gunakan backup dari sumber yang tidak dipercaya.

### Biaya dan laporan

- Biaya operasional dibuat dan dihapus melalui endpoint pemilik; laporan menerima periode `day`, `month`, atau `year` serta tanggal acuan.
- Laba bersih laporan mengurangi laba kotor dengan potongan, biaya admin, pajak, pengemasan, layanan, gratis ongkir, dan biaya operasional.
