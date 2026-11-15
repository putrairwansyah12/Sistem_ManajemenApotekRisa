# Apotek Risa

Sistem informasi apotek berbasis Next.js dan PostgreSQL. Fitur yang sudah tersambung ke database:

- Login dengan session cookie HTTP-only dan pembatasan peran pemilik/kasir.
- Dashboard omzet, transaksi terbaru, stok menipis, dan batch kedaluwarsa.
- Katalog obat, kategori, satuan, harga, dan arsip produk.
- Transaksi penjualan dengan validasi stok serta pengurangan stok atomik.
- Penerimaan batch, pemantauan kedaluwarsa, serta pemakaian batch FEFO saat penjualan.
- Stock opname dan riwayat penyesuaian.
- Riwayat penjualan, batch kedaluwarsa, serta pembuatan akun pengguna.

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
- `GET|POST /api/users` (khusus pemilik)

Impor Excel, ekspor laporan produksi, data pemasok/penerimaan, backup database, dan sinkronisasi offline belum termasuk backend MVP ini.
