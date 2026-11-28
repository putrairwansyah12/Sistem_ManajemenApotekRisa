import { motion } from "framer-motion";
import { ArrowUpRight, DollarSign, RefreshCw, Sparkles, TrendingDown, Users, X } from "lucide-react";
import { ReportMetricTable, ReportTable, reportMetricLabels } from "../data-tables";
import { MetricCard } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function ReportsScreen({
  reportFilter,
  setReportFilter,
  refreshReport,
  busy,
  report,
  money,
  reportDetail,
  setReportDetail,
}) {
  return (
    <div className="space-y-6">
      {/* Filter Form */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs"
      >
        <form onSubmit={refreshReport} className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Periode Laporan</label>
            <select
              value={reportFilter.period}
              onChange={(e) => setReportFilter((c) => ({ ...c, period: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            >
              <option value="day">Harian</option>
              <option value="month">Bulanan</option>
              <option value="year">Tahunan</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Acuan</label>
            <input
              type="date"
              value={reportFilter.date}
              onChange={(e) => setReportFilter((c) => ({ ...c, date: e.target.value }))}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            <span>Tampilkan Laporan</span>
          </button>
        </form>
      </motion.div>

      {/* Financial Metrics Cards */}
      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Omzet Penjualan"
              value={money(report.omzet)}
              note={`${report.jumlahTransaksi} transaksi`}
              icon={DollarSign}
              selected={reportDetail === "omzet"}
              onClick={() => setReportDetail((c) => (c === "omzet" ? null : "omzet"))}
            />
            <MetricCard
              title="Jumlah Kunjungan"
              value={report.jumlahKunjungan}
              note="Sesuai transaksi"
              icon={Users}
              selected={reportDetail === "jumlahKunjungan"}
              onClick={() => setReportDetail((c) => (c === "jumlahKunjungan" ? null : "jumlahKunjungan"))}
            />
            <MetricCard
              title="Laba Kotor"
              value={money(report.labaKotor)}
              note="Harga jual - HPP"
              icon={ArrowUpRight}
              selected={reportDetail === "labaKotor"}
              onClick={() => setReportDetail((c) => (c === "labaKotor" ? null : "labaKotor"))}
            />
            <MetricCard
              title="Biaya Operasional"
              value={money(report.biayaOperasional)}
              note="Pada periode terpilih"
              icon={TrendingDown}
              warning
              selected={reportDetail === "biayaOperasional"}
              onClick={() => setReportDetail((c) => (c === "biayaOperasional" ? null : "biayaOperasional"))}
            />
            <MetricCard
              title="Laba Bersih"
              value={money(report.labaBersih)}
              note="Setelah biaya & pajak"
              icon={Sparkles}
              selected={reportDetail === "labaBersih"}
              onClick={() => setReportDetail((c) => (c === "labaBersih" ? null : "labaBersih"))}
            />
          </div>

          {/* Detail Table */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
          >
            {reportDetail ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Rincian {reportMetricLabels[reportDetail]}
                    </h2>
                    <p className="text-xs text-slate-500">Nilai untuk setiap sub-periode laporan.</p>
                  </div>
                  <button
                    onClick={() => setReportDetail(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>
                <ReportMetricTable rows={report.data} metric={reportDetail} money={money} />
              </>
            ) : (
              <>
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900">Rincian Per Periode</h2>
                  <p className="text-xs text-slate-500">Rekapitulasi lengkap omzet, biaya, dan laba.</p>
                </div>
                <ReportTable rows={report.data} money={money} />
              </>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
