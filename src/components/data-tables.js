import { Archive, Edit2, Eye, Printer, Trash2 } from "lucide-react";

export const reportMetricLabels = {
  omzet: "Omzet",
  jumlahKunjungan: "Jumlah kunjungan",
  labaKotor: "Laba kotor",
  biayaOperasional: "Biaya operasional",
  labaBersih: "Laba bersih",
};

export function ProductsTable({ products, money: formatMoney, onArchive, onPriceChange, onEdit, owner }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Obat</th>
            <th className="py-3 px-3">Kategori</th>
            <th className="py-3 px-3">HPP</th>
            <th className="py-3 px-3">Harga Jual</th>
            <th className="py-3 px-3">Stok</th>
            <th className="py-3 px-3">Status</th>
            {owner && <th className="py-3 px-3 text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {products.map((p) => {
            const isLow = p.stok <= p.stokMinimum;
            return (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3">
                  <span className="font-bold text-slate-900 block">{p.namaProduk}</span>
                  <span className="text-[11px] text-slate-400">
                    {p.kodeBarang || "Tanpa kode"} · {p.satuan.kode}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-600">{p.kategori.nama}</td>
                <td className="py-3 px-3 text-slate-600">{formatMoney(p.hpp)}</td>
                <td className="py-3 px-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span>{formatMoney(p.hargaJual)}</span>
                    {owner && (
                      <button
                        type="button"
                        onClick={() => onPriceChange(p)}
                        className="text-[#5936A8] hover:text-[#472985] p-1 rounded"
                        title="Ubah harga jual"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 font-bold text-slate-800">{p.stok}</td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isLow ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isLow ? "Menipis" : "Tersedia"}
                  </span>
                </td>
                {owner && (
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-[#5936A8] hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit data obat"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchive(p.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Arsipkan obat"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {!products.length && (
            <tr>
              <td colSpan={owner ? 7 : 6} className="py-8 text-center text-slate-400">
                Tidak ada data obat untuk ditampilkan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function SalesTable({ sales, money: formatMoney, date: formatDate, onReceipt }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">No. Transaksi</th>
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Jenis</th>
            <th className="py-3 px-3">Kasir</th>
            <th className="py-3 px-3">Jumlah Item</th>
            <th className="py-3 px-3">Total Pembayaran</th>
            {onReceipt && <th className="py-3 px-3 text-right">Struk</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {sales.map((sale) => (
            <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{sale.kodeTransaksi}</td>
              <td className="py-3 px-3 text-slate-500">{formatDate(sale.tanggal)}</td>
              <td className="py-3 px-3">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {sale.jenis === "ONLINE" ? "Online" : "Offline"}
                </span>
              </td>
              <td className="py-3 px-3 font-medium text-slate-700">{sale.user?.nama || "—"}</td>
              <td className="py-3 px-3 text-slate-600">
                {sale.detail?.reduce((sum, d) => sum + d.jumlah, 0) ?? 0}
              </td>
              <td className="py-3 px-3 font-bold text-slate-900">{formatMoney(sale.total)}</td>
              {onReceipt && (
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onReceipt(sale)}
                    className="p-1.5 text-slate-500 hover:text-[#5936A8] hover:bg-purple-50 rounded-lg transition-colors"
                    title="Cetak struk kasir"
                  >
                    <Printer size={15} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {!sales.length && (
            <tr>
              <td colSpan={onReceipt ? 7 : 6} className="py-8 text-center text-slate-400">
                Tidak ada transaksi yang sesuai dengan filter ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StockTable({ records, date: formatDate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Obat / Rincian Batch</th>
            <th className="py-3 px-3">Stok Sistem</th>
            <th className="py-3 px-3">Stok Fisik</th>
            <th className="py-3 px-3">Selisih</th>
            <th className="py-3 px-3">Petugas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 text-slate-500">{formatDate(r.tanggal)}</td>
              <td className="py-3 px-3">
                <span className="font-bold text-slate-900 block">{r.produk.namaProduk}</span>
                <span className="text-[11px] text-slate-400 block">{r.alasan}</span>
              </td>
              <td className="py-3 px-3 font-medium text-slate-700">{r.stokSistem}</td>
              <td className="py-3 px-3 font-bold text-slate-900">{r.stokFisik}</td>
              <td className="py-3 px-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.selisih < 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {r.selisih > 0 ? `+${r.selisih}` : r.selisih}
                </span>
              </td>
              <td className="py-3 px-3 text-slate-600">{r.user.nama}</td>
            </tr>
          ))}
          {!records.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada data penyesuaian stok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ExpiryTable({ batches, date: formatDate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Obat</th>
            <th className="py-3 px-3">No. Batch</th>
            <th className="py-3 px-3">Tanggal Kedaluwarsa</th>
            <th className="py-3 px-3">Sisa Stok</th>
            <th className="py-3 px-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {batches.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">
                {b.produk?.namaProduk || "Produk tidak tersedia"}
              </td>
              <td className="py-3 px-3 text-slate-600 font-mono">{b.nomorBatch}</td>
              <td className="py-3 px-3 text-slate-700">{formatDate(b.tanggalKedaluwarsa)}</td>
              <td className="py-3 px-3 font-bold text-slate-900">{b.jumlah}</td>
              <td className="py-3 px-3">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    b.status === "KEDALUWARSA"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : b.status === "BATAS_RETUR"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-purple-50 text-purple-700 border border-purple-200"
                  }`}
                >
                  {b.status === "KEDALUWARSA"
                    ? "Kedaluwarsa"
                    : b.status === "BATAS_RETUR"
                    ? "Batas Retur ≤ 3 bln"
                    : "Preventif ≤ 6 bln"}
                </span>
              </td>
            </tr>
          ))}
          {!batches.length && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400">
                Tidak ada batch yang mendekati kedaluwarsa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTable({ users, ownerId, onEdit, onToggle, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Nama</th>
            <th className="py-3 px-3">Username</th>
            <th className="py-3 px-3">Peran</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3">Dibuat</th>
            <th className="py-3 px-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{u.nama}</td>
              <td className="py-3 px-3 text-slate-600">{u.username}</td>
              <td className="py-3 px-3">
                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                  {u.role === "PEMILIK" ? "Pemilik" : "Kasir"}
                </span>
              </td>
              <td className="py-3 px-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    u.aktif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td className="py-3 px-3 text-slate-400">
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(u.dibuatPada))}
              </td>
              <td className="py-3 px-3 text-right">
                {u.role === "KASIR" ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onEdit(u, "edit")}
                      className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                      title="Edit kasir"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(u, "password")}
                      className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                      title="Ubah sandi"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => onToggle(u)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                      title={u.aktif ? "Arsipkan" : "Aktifkan"}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(u)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  u.id === ownerId && (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onEdit(u, "owner-name")}
                        className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                        title="Ubah nama"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(u, "password")}
                        className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                        title="Atur sandi"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  )
                )}
              </td>
            </tr>
          ))}
          {!users.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada pengguna terdaftar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PriceHistoryTable({ history, money: formatMoney, date: formatDate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Obat</th>
            <th className="py-3 px-3">Jenis Harga</th>
            <th className="py-3 px-3">Harga Lama</th>
            <th className="py-3 px-3">Harga Baru</th>
            <th className="py-3 px-3">Diubah Oleh</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {history.map((h) => (
            <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 text-slate-500">{formatDate(h.tanggal)}</td>
              <td className="py-3 px-3 font-bold text-slate-900">
                {h.produk.namaProduk}
                <span className="text-[11px] text-slate-400 block font-normal">
                  {h.produk.kodeBarang || "Tanpa kode"}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-[#5936A8]">
                  {h.jenisHarga === "JUAL" ? "Harga Jual" : h.jenisHarga === "HPP" ? "HPP" : "Harga Beli"}
                </span>
              </td>
              <td className="py-3 px-3 text-slate-500">{formatMoney(h.hargaLama)}</td>
              <td className="py-3 px-3 font-bold text-slate-900">{formatMoney(h.hargaBaru)}</td>
              <td className="py-3 px-3 text-slate-600">{h.user.nama}</td>
            </tr>
          ))}
          {!history.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada riwayat perubahan harga.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ExpensesTable({ expenses, money: formatMoney, date: formatDate, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Kategori</th>
            <th className="py-3 px-3">Keterangan</th>
            <th className="py-3 px-3">Jumlah</th>
            <th className="py-3 px-3">Dicatat Oleh</th>
            <th className="py-3 px-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {expenses.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 text-slate-500">{formatDate(e.tanggal)}</td>
              <td className="py-3 px-3 font-semibold text-slate-800">{e.kategori}</td>
              <td className="py-3 px-3 text-slate-600">{e.deskripsi}</td>
              <td className="py-3 px-3 font-bold text-rose-600">{formatMoney(e.jumlah)}</td>
              <td className="py-3 px-3 text-slate-500">{e.user?.nama || "—"}</td>
              <td className="py-3 px-3 text-right">
                <button
                  onClick={() => onDelete(e)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Hapus biaya"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          {!expenses.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada biaya operasional tercatat.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function reportPeriodLabel(period) {
  const value = new Date(`${period.length === 7 ? `${period}-01` : period}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("id-ID", {
    ...(period.length === 7 ? { month: "long", year: "numeric" } : { dateStyle: "medium" }),
    timeZone: "UTC",
  }).format(value);
}

export function ReportTable({ rows, money: formatMoney }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Periode</th>
            <th className="py-3 px-3">Omzet</th>
            <th className="py-3 px-3">Transaksi / Kunjungan</th>
            <th className="py-3 px-3">Laba Kotor</th>
            <th className="py-3 px-3">Biaya Operasional</th>
            <th className="py-3 px-3">Laba Bersih</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.periode} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{reportPeriodLabel(row.periode)}</td>
              <td className="py-3 px-3 font-semibold text-slate-800">{formatMoney(row.omzet)}</td>
              <td className="py-3 px-3 text-slate-600">
                {row.jumlahTransaksi} / {row.jumlahKunjungan}
              </td>
              <td className="py-3 px-3 text-emerald-600 font-semibold">{formatMoney(row.labaKotor)}</td>
              <td className="py-3 px-3 text-rose-600">{formatMoney(row.biayaOperasional)}</td>
              <td className="py-3 px-3 font-extrabold text-[#5936A8]">{formatMoney(row.labaBersih)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada rekapitulasi data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ReportMetricTable({ rows, metric, money: formatMoney }) {
  const countMetric = metric === "jumlahKunjungan";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Periode</th>
            <th className="py-3 px-3">{reportMetricLabels[metric].toLocaleUpperCase("id-ID")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.periode} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{reportPeriodLabel(row.periode)}</td>
              <td className="py-3 px-3 font-bold text-[#5936A8]">
                {countMetric ? row[metric] : formatMoney(row[metric])}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={2} className="py-8 text-center text-slate-400">
                Tidak ada data rincian.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ExcelImportTable({ rows }) {
  const actionLabels = {
    create: "Baru",
    update: "Perbarui",
    ambiguous: "Ambigu",
    invalid: "Tidak valid",
  };
  return (
    <div className="overflow-x-auto max-h-60">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-2 px-2">Baris</th>
            <th className="py-2 px-2">Kode</th>
            <th className="py-2 px-2">Nama Produk</th>
            <th className="py-2 px-2">Aksi</th>
            <th className="py-2 px-2">Validasi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.row}>
              <td className="py-2 px-2 text-slate-400 font-mono">{row.row}</td>
              <td className="py-2 px-2 font-mono text-slate-600">{row.product?.kodeBarang || "—"}</td>
              <td className="py-2 px-2 font-medium text-slate-900">{row.product?.namaProduk || "—"}</td>
              <td className="py-2 px-2 font-semibold text-[#5936A8]">{actionLabels[row.action] || row.action}</td>
              <td className="py-2 px-2 text-[11px] text-slate-500">
                {row.errors.length ? row.errors.join("; ") : "Siap disimpan"}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400">
                Belum ada data pratinjau.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
