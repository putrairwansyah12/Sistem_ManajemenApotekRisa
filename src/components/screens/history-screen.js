import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { SalesTable } from "../data-tables";
import { TableSearch } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function HistoryScreen({
  summaryDetail,
  historyTotal,
  dashboard,
  money,
  query,
  onSearchChange,
  historyFilter,
  onHistoryFilterChange,
  onApplyFilter,
  filtered,
  date,
  onReceipt,
  historyPage,
  historyPageCount,
  pageSize,
  onPageChange,
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {summaryDetail === "todayRevenue" ? "Transaksi Hari Ini" : "Riwayat Semua Transaksi"}
          </h2>
          <p className="text-xs text-slate-500">
            {summaryDetail === "todayRevenue"
              ? `${historyTotal} transaksi · Total omzet ${money(dashboard?.todayRevenue)}`
              : `${historyTotal} transaksi ditemukan pada periode ini.`}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <TableSearch
            value={query}
            onChange={onSearchChange}
            placeholder="Cari transaksi, obat, atau kasir..."
          />
        </div>
      </div>

      <form
        onSubmit={onApplyFilter}
        className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] items-end gap-3 rounded-xl bg-slate-50 p-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="history-period">
            Tampilkan berdasarkan
          </label>
          <select
            id="history-period"
            value={historyFilter.period}
            onChange={(event) =>
              onHistoryFilterChange((current) => ({ ...current, period: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800"
          >
            <option value="day">Tanggal</option>
            <option value="month">Bulan</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="history-date">
            {historyFilter.period === "day" ? "Pilih tanggal" : "Pilih bulan"}
          </label>
          <input
            id="history-date"
            type={historyFilter.period === "day" ? "date" : "month"}
            value={
              historyFilter.period === "month"
                ? historyFilter.date.slice(0, 7)
                : historyFilter.date
            }
            onChange={(event) =>
              onHistoryFilterChange((current) => ({
                ...current,
                date:
                  current.period === "month"
                    ? event.target.value
                      ? `${event.target.value}-01`
                      : ""
                    : event.target.value,
              }))
            }
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5936A8] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#472985]"
        >
          <Search size={14} />
          Tampilkan
        </button>
      </form>

      <SalesTable sales={filtered} money={money} date={date} onReceipt={onReceipt} />
      {historyTotal > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] text-slate-500">
            Menampilkan {(historyPage - 1) * pageSize + 1}–
            {Math.min(historyPage * pageSize, historyTotal)} dari {historyTotal} transaksi
          </span>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              disabled={historyPage <= 1}
              onClick={() => onPageChange(historyPage - 1)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="min-w-[88px] text-center text-[11px] font-medium text-slate-600">
              Halaman {historyPage} / {historyPageCount}
            </span>
            <button
              type="button"
              disabled={historyPage >= historyPageCount}
              onClick={() => onPageChange(historyPage + 1)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
