import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, ArrowDownLeft, ArrowRight, Clock, Package, ReceiptText, ShieldCheck, TrendingDown } from "lucide-react";
import { cardHoverProps, itemVariants } from "./motion-presets";

export function DashboardView({ dashboard, money: formatMoney, date: formatDate, onMetricClick, onGoToSales, onReceipt }) {
  if (!dashboard) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-[#5936A8] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Memuat data ringkasan dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Real Metric Cards with Framer Motion hover & enter animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("todayRevenue")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-[#8B6AD9] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Hari Ini
              </span>
              <span className="text-slate-300 group-hover:text-[#5936A8] transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center mb-3">
              <TrendingDown className="rotate-180" size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Omzet Penjualan</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {formatMoney(dashboard.todayRevenue)}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>{dashboard.todayTransactions} Transaksi berhasil</span>
            <span className="text-[#5936A8] font-bold group-hover:underline">Detail →</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("activeProducts")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-[#8B6AD9] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Katalog
              </span>
              <span className="text-slate-300 group-hover:text-[#5936A8] transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-3">
              <Package size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Obat Aktif Terdaftar</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {dashboard.productCount} <span className="text-sm font-normal text-slate-400">Obat</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Siap dijual di kasir</span>
            <span className="text-[#5936A8] font-bold group-hover:underline">Buka katalog →</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("lowStock")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-amber-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                Perlu Restock
              </span>
              <span className="text-slate-300 group-hover:text-amber-600 transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <AlertTriangle size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Stok Menipis</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {dashboard.lowStockCount} <span className="text-sm font-normal text-slate-400">Item</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Di bawah stok minimum</span>
            <span className="text-amber-600 font-bold group-hover:underline">Periksa stok →</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("expiring")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-[#8B6AD9] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                Monitoring
              </span>
              <span className="text-slate-300 group-hover:text-[#5936A8] transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center mb-3">
              <Clock size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Kedaluwarsa ≤ 6 Bulan</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {dashboard.expiringCount} <span className="text-sm font-normal text-slate-400">Batch</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>≤ 3 bln retur: {dashboard.returnWindowCount} batch</span>
            <span className="text-[#5936A8] font-bold group-hover:underline">Kelola batch →</span>
          </div>
        </motion.div>
      </div>

      {/* Real Operations Grid: Transaksi Terkini & Stok Perlu Perhatian */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Real Transactions */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaksi Terkini</h3>
              <p className="text-xs text-slate-500">Aktivitas penjualan kasir yang tercatat di database.</p>
            </div>
            <button
              onClick={onGoToSales}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#5936A8] text-xs font-bold rounded-xl transition-colors"
            >
              <span>+ Kasir Baru</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {dashboard.recentSales?.map((sale) => (
              <div
                key={sale.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-50 text-[#5936A8] flex items-center justify-center shrink-0">
                    <ArrowDownLeft size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {sale.kodeTransaksi}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDate(sale.tanggal)} · Kasir: {sale.user?.nama || "Umum"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Selesai
                  </span>
                  <span className="text-xs font-bold text-slate-900 text-right">
                    + {formatMoney(sale.total)}
                  </span>
                  {onReceipt && (
                    <button
                      onClick={() => onReceipt(sale)}
                      className="p-1.5 text-slate-400 hover:text-[#5936A8] hover:bg-purple-50 rounded-lg transition-colors"
                      title="Cetak Struk"
                    >
                      <ReceiptText size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(!dashboard.recentSales || !dashboard.recentSales.length) && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi tersimpan.
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Real Low Stock Urgent List */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stok Perlu Perhatian</h3>
              <p className="text-xs text-slate-500">
                {dashboard.lowStockProducts?.length || 0} obat di bawah batas aman
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
          </div>

          <div className="space-y-3">
            {dashboard.lowStockProducts?.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {product.namaProduk}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Sisa: <b className="text-rose-600">{product.stok}</b> {product.satuan.kode} (Min: {product.stokMinimum})
                  </span>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  Restock
                </span>
              </div>
            ))}
            {(!dashboard.lowStockProducts || !dashboard.lowStockProducts.length) && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Semua persediaan obat berada di atas batas minimum.
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onMetricClick("lowStock")}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Lihat Seluruh Stok Menipis</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Inventory Health & Quick Navigation Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Integritas Operasional Apotek Risa</h4>
              <p className="text-xs text-slate-500">
                Data inventaris, riwayat harga, dan laporan keuangan tersimpan aman secara terpusat di server.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onGoToSales}
              className="px-4 py-2 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Buka Kasir Penjualan
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
