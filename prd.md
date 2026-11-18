PRD: Sistem Informasi Manajemen Apotek Risa
Versi 1.1 · 18 November 2026 · Tim Apotek Risa (Irwansyah Putra, Dafie Fauzan Anzadi, Rifqi Julian)
1. Ringkasan
Sistem informasi berbasis web untuk mengelola persediaan obat, barang masuk, kedaluwarsa, stock opname, transaksi penjualan, biaya operasional, dan penetapan harga jual di Apotek Risa. Data disimpan terpusat di PostgreSQL. Versi 1 memuat modul yang tercantum dalam proposal revisi. Impor PDF berada di luar versi 1.
2. Latar belakang dan masalah
Pencatatan stok, barang masuk, kedaluwarsa, dan harga di Apotek Risa masih dilakukan secara manual. Obat dengan batch berbeda sering tercatat ganda, dan obat yang mendekati kedaluwarsa tidak terpantau. Perhitungan harga jual untuk e-commerce dilakukan dengan alat sederhana yang memerlukan input satu per satu, sehingga rawan salah dan tidak mencatat riwayat harga beli.
3. Tujuan dan indikator keberhasilan
• Peringatan kedaluwarsa muncul pada 6 bulan (preventif) dan 3 bulan (batas retur ke supplier) sebelum tanggal kedaluwarsa.
• Stok sistem sama dengan stok fisik setelah stock opname, dengan selisih dan alasan tercatat.
• Harga jual e-commerce dihitung dari HPP, biaya admin, pengemasan, layanan, dan target laba, dengan laba kotor dan laba bersih per item.
• Setiap transaksi penjualan mengurangi stok dan menambah satu jumlah kunjungan.
• Laporan harian, bulanan, dan tahunan tersedia untuk omzet, jumlah transaksi, jumlah kunjungan, laba kotor, dan laba bersih.
4. Pengguna
Peran
Akses
Tanggung jawab utama
Pengelola Apotek
Penuh
Mengelola pengguna dan hak akses, produk, barang masuk, kedaluwarsa, stock opname, biaya operasional, kalkulator harga, impor dan ekspor Excel, riwayat harga, laporan, serta backup dan restore
Kasir
Terbatas
Login, mencatat transaksi penjualan offline dan online, dan logout
5. Ruang lingkup
Termasuk versi 1
• Login dan hak akses sesuai peran.
• Manajemen produk obat, termasuk HPP, harga beli, harga jual, dan batas stok menipis.
• Barang masuk dari supplier per batch, dengan tanggal kedaluwarsa dan pembaruan stok.
• Pemantauan kedaluwarsa pada 6 dan 3 bulan, serta deteksi overlap batch.
• Peringatan stok minimum (reorder point).
• Stock opname dan penyesuaian stok.
• Transaksi penjualan offline dan online, dengan pengurangan stok dan penambahan jumlah kunjungan.
• Biaya operasional dan potongan penjualan.
• Kalkulator harga jual, estimasi laba kotor, dan laba bersih.
• Riwayat harga beli dan harga jual.
• Laporan dan rekapitulasi harian, bulanan, dan tahunan.
• Impor dan ekspor data produk melalui Excel.
• Backup dan restore database.
• Manajemen pengguna dan hak akses.
Di luar versi 1
• Impor data dari PDF. Masih tercantum di proposal, tetapi dijadwalkan setelah impor Excel selesai.
• Pembukuan akuntansi lanjut, seperti jurnal umum, buku besar, dan neraca.
• Manajemen SDM, seperti presensi dan penggajian.
• Integrasi API marketplace dan sinkronisasi stok ke platform pihak ketiga.
• Pengelolaan pesanan online dari marketplace. Transaksi online dicatat sebagai penjualan yang diinput kasir.
• Modul pasien rawat jalan; tabel dan datanya dihapus dari sistem.
6. Kebutuhan fungsional
ID
Kebutuhan
Peran
Prioritas
FR-01
Pengguna login dengan username dan password. Menu yang tampil mengikuti peran.
Semua
Wajib
FR-02
Pengelola dapat membuat, mengubah, dan menonaktifkan akun serta mengatur hak akses.
Pengelola
Wajib
FR-03
Pengelola dapat menambah dan mengubah obat: nama, kode, kategori, satuan, HPP, harga beli, harga jual, stok awal, tanggal kedaluwarsa, dan batas stok menipis.
Pengelola
Wajib
FR-04
Sistem menampilkan daftar obat dengan pencarian berdasarkan nama dan kode.
Semua
Wajib
FR-05
Barang masuk dari supplier membuat batch dengan nomor batch dan tanggal kedaluwarsa, lalu menambah stok. Perubahan HPP atau harga dicatat ke riwayat.
Pengelola
Wajib
FR-06
Sistem mendeteksi obat yang sama dengan batch berbeda yang tumpang tindih, dan memberi peringatan sebelum data disimpan.
Pengelola
Wajib
FR-07
Sistem menandai batch yang kedaluwarsanya dalam 6 bulan (preventif) dan 3 bulan (batas retur), dengan urutan FEFO.
Pengelola
Wajib
FR-08
Sistem menampilkan obat yang stoknya sama dengan atau di bawah batas minimum.
Semua
Wajib
FR-09
Pengelola mencatat stok fisik dan alasan untuk setiap batch. Sistem menghitung selisih, menyimpan rincian batch, dan memperbarui stok batch serta produk dalam satu transaksi.
Pengelola
Wajib
FR-10
Transaksi penjualan offline dan online tercatat. Stok berkurang dan jumlah kunjungan bertambah satu.
Semua
Wajib
FR-11
Transaksi ditolak jika jumlah melebihi stok yang tersedia.
Semua
Wajib
FR-12
Pengelola mencatat biaya operasional dan potongan penjualan sebagai komponen laba.
Pengelola
Penting
FR-13
Pengelola menghitung harga jual, laba kotor, dan laba bersih dari HPP, biaya admin platform, pengemasan, layanan, gratis ongkir, pajak, dan target laba.
Pengelola
Wajib
FR-14
Hasil kalkulator dapat disimpan dan langsung memperbarui harga jual. Perubahan dicatat ke riwayat harga.
Pengelola
Wajib
FR-15
Sistem menampilkan riwayat harga beli dan harga jual secara kronologis, termasuk pengguna yang mengubahnya.
Pengelola
Penting
FR-16
Sistem menyajikan laporan harian, bulanan, dan tahunan: omzet, jumlah transaksi, jumlah kunjungan, laba kotor, dan laba bersih.
Pengelola
Penting
FR-17
Pengelola dapat mengimpor data produk dari Excel, dengan pratinjau dan validasi baris sebelum disimpan.
Pengelola
Penting
FR-18
Pengelola dapat mengekspor data ke Excel.
Pengelola
Penting
FR-19
Pengelola dapat melakukan backup dan restore database.
Pengelola
Penting
7. Aturan bisnis
• Stok tidak boleh negatif. Database menolak nilai di bawah nol.
• Peringatan kedaluwarsa memakai dua ambang: 6 bulan sebagai peringatan preventif dan 3 bulan sebagai batas retur ke supplier.
• Batch dikeluarkan dengan FEFO, yaitu batch dengan tanggal kedaluwarsa terdekat lebih dulu.
• Setiap transaksi yang berhasil disimpan menambah satu catatan pada rekapitulasi jumlah kunjungan.
• Laba kotor sama dengan harga jual dikurangi HPP. Laba bersih mengurangi laba kotor dengan biaya admin, pajak, pengemasan, layanan, gratis ongkir, potongan transaksi, dan biaya operasional pada periode laporan.
• Biaya admin dan pajak dihitung sebagai persentase harga jual. Pengemasan, layanan, dan subsidi gratis ongkir adalah biaya tetap per unit.
• Harga jual kalkulator = ceil((HPP + pengemasan + layanan + subsidi gratis ongkir) / (1 - persen admin - persen pajak - persen target laba)).
• Jumlah persen biaya admin, pajak, dan target laba harus kurang dari 100 persen.
• Setiap perubahan HPP atau harga jual, dari barang masuk maupun kalkulator, dicatat ke riwayat harga beserta pengguna dan waktunya.
• Obat yang diarsipkan tidak bisa dipilih untuk transaksi baru, tetapi riwayatnya tetap tersimpan.
8. Kebutuhan nonfungsional
• Usability: antarmuka sederhana dan intuitif bagi pengelola dan kasir.
• Performance: penyimpanan, pencarian, dan perhitungan selesai dalam waktu wajar, dengan minimal 4.400 produk di database.
• Security: akses dibatasi berdasarkan akun dan peran. Password disimpan dalam bentuk hash.
• Reliability: data stok, harga, dan transaksi tersimpan konsisten. Operasi yang mengubah beberapa tabel berjalan dalam satu transaksi.
• Maintainability: logika perhitungan dipisahkan dari tampilan dan memiliki unit test.
• Compatibility: dapat diakses dengan browser modern di komputer atau laptop.
9. Teknologi
• Frontend dan backend: Next.js (App Router) dengan JavaScript.
• Tampilan: Tailwind CSS.
• Database: PostgreSQL.
• ORM: Prisma.
• Autentikasi: session dengan password hash bcrypt.
• Pengujian: Vitest untuk logika bisnis, pengujian manual untuk UAT.
• Versi kontrol: Git dan GitHub.
10. Data utama
Entitas utama: pengguna, kategori obat, satuan, produk, batch produk, barang masuk, stock opname, transaksi penjualan beserta detailnya, biaya operasional, kalkulasi harga, riwayat harga, dan impor data. Jumlah kunjungan dihitung dari transaksi penjualan, sehingga tidak memerlukan tabel terpisah. Skema lengkap ada di prisma/schema.prisma.
11. Alur utama
Barang masuk: pengelola mencatat penerimaan dari supplier per batch, lengkap dengan nomor batch dan tanggal kedaluwarsa. Sistem menambah stok dan mencatat setiap perubahan HPP atau harga ke riwayat.
Transaksi penjualan: kasir atau pengelola memilih obat dan jumlahnya. Sistem memeriksa stok, menyimpan transaksi, mengurangi stok, dan menambah satu jumlah kunjungan dalam satu transaksi database.
Stock opname: pengelola memasukkan stok fisik per batch dan alasan. Sistem menghitung selisih, menyimpan rincian batch, dan memperbarui stok batch serta produk secara atomik.
Kalkulator harga: pengelola memilih obat dan mengisi biaya. Hasil dapat disimpan untuk menerapkan harga jual baru, dan perubahannya dicatat ke riwayat harga.
Laporan: pengelola memilih periode harian, bulanan, atau tahunan. Sistem menghitung omzet, jumlah transaksi, jumlah kunjungan, laba kotor, dan laba bersih.
12. Asumsi dan ketergantungan
• HPP dan harga jual belum tersedia di sumber PDF, sehingga harus diisi manual sebelum kalkulator diuji.
• Stok awal diambil dari daftar item per 9 November 2026. Item dengan stok negatif dibulatkan ke nol dan perlu dicek ulang.
• Kode barang di sumber berupa nama yang terpotong, sehingga kode barang diisi kemudian.
• Akun pengelola awal dibuat lewat seed, dan password diganti setelah login pertama.
• Variabel biaya kalkulator (listrik, potongan platform, gratis ongkir, pajak, target margin) belum final.
13. Risiko
Risiko
Dampak
Mitigasi
Waktu tiga minggu tidak cukup untuk semua modul
Modul penting tidak selesai
Kerjakan modul wajib lebih dulu. Modul yang belum selesai dijelaskan di laporan.
Stok awal tidak akurat (178 item bernilai negatif di sumber)
Stok awal salah dan selisih stock opname pertama besar
Cek ulang item di perlu_dicek.csv sebelum sistem dipakai
HPP belum lengkap
Hasil kalkulator tidak akurat
Lengkapi HPP sebelum demo kalkulator
Formula kalkulator belum disepakati
Harga jual dan laba tidak sesuai harapan pengelola
Sepakati formula dan variabel biaya dengan pengelola sebelum UAT
Ruang lingkup bertambah dari proposal revisi
Jadwal tidak tercapai
Barang masuk, biaya operasional, dan laporan dikerjakan setelah modul inti
Kesalahan AI saat membuat kode
Kode berantakan atau tidak sesuai pola
Commit sebelum setiap permintaan, periksa diff, jalankan build dan test
14. Rencana kerja
• Minggu 1: pengaturan proyek, skema database, seed data, login dan hak akses, serta daftar obat.
• Minggu 2: barang masuk dan kedaluwarsa, stock opname, transaksi penjualan, serta biaya operasional.
• Minggu 3: kalkulator harga, riwayat harga, laporan, impor dan ekspor Excel, pengujian, deployment, dan dokumentasi.
• Backup dan restore dikerjakan setelah modul inti selesai, dan dapat ditunda ke versi berikutnya jika waktu tidak cukup.
Tanggal setiap minggu disesuaikan dengan tenggat pengumpulan dari dosen.
15. Pertanyaan terbuka
• Bagaimana formula kalkulator dan variabel biaya (listrik, potongan platform, gratis ongkir, pajak, target margin) disepakati dengan pengelola?
• Apakah batas 6 dan 3 bulan sudah sesuai kebijakan apotek?
• Apakah kasir boleh melakukan stock opname, atau hanya pengelola?
• Apakah impor PDF tetap masuk versi 1, atau cukup Excel?
• Apakah kebijakan password selain panjang minimal 12 karakter sudah ditetapkan?
16. Referensi
• Proposal revisi Apotek Risa (PROPOSAL_SI_TERBARU_revisi).
• Use case diagram dan use case specification UC-01 sampai UC-15.
• Class diagram dan sequence diagram login, stock opname, dan harga e-commerce.
• Skema database dan data awal produk dari database.pdf.
17. Catatan perubahan dari versi 1.0
• Modul pasien rawat jalan dihapus karena tidak lagi tercantum di proposal revisi.
• Peringatan kedaluwarsa diubah dari 90 hari menjadi 6 bulan dan 3 bulan.
• Barang masuk, biaya operasional, laporan, ekspor Excel, serta backup dan restore ditambahkan.
• Overlap batch dan laba kotor per item menjadi kebutuhan eksplisit.
• Istilah aktor disamakan dengan proposal menjadi Pengelola Apotek dan Kasir.
• Impor PDF dicatat sebagai pertanyaan terbuka, bukan kebutuhan pasti versi 1.