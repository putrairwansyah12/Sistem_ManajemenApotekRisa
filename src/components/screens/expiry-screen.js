import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ExpiryTable } from "../data-tables";
import { InputField, InventoryTabs, TableSearch } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function ExpiryScreen({
  user,
  summaryDetail,
  selectInventoryTab,
  stockProducts,
  receiveBatch,
  busy,
  filtered,
  query,
  setQuery,
  date,
}) {
  return (
    <div className="space-y-6">
      <InventoryTabs activeTab="expiry" onSelect={selectInventoryTab} />

      {/* Receive Batch Form */}
      {user.role === "PEMILIK" && !summaryDetail && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Terima Barang Masuk / Batch Baru</h2>
            <p className="text-xs text-slate-500">
              Catat nomor batch dan tanggal kedaluwarsa fisik obat yang diterima dari distributor.
            </p>
          </div>
          <form onSubmit={receiveBatch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Obat</label>
                <select
                  name="produkId"
                  required
                  defaultValue=""
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="" disabled>Pilih obat dari katalog</option>
                  {stockProducts.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.namaProduk}
                    </option>
                  ))}
                </select>
              </div>
              <InputField name="nomorBatch" label="Nomor Batch" required />
              <InputField name="tanggalKedaluwarsa" label="Tanggal Kedaluwarsa" type="date" required />
              <InputField name="jumlah" label="Jumlah Unit Diterima" type="number" min="1" required />
              <InputField name="hargaBeli" label="Harga Beli Terbaru (Opsional)" type="number" min="0" step="0.01" />
              <InputField name="hpp" label="HPP Terbaru (Opsional)" type="number" min="0" step="0.01" />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={15} />
                <span>Simpan Barang Masuk</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Expiry Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Monitoring Batch & Batas Retur</h2>
            <p className="text-xs text-slate-500">{filtered.length} batch dalam pemantauan sistem.</p>
          </div>
          <div className="w-full sm:w-60">
            <TableSearch value={query} onChange={setQuery} placeholder="Cari nama atau batch..." />
          </div>
        </div>
        <ExpiryTable batches={filtered} date={date} />
      </motion.div>
    </div>
  );
}
