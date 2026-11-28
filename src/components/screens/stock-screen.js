import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { StockTable } from "../data-tables";
import { InputField, TableSearch } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function StockScreen({
  filtered,
  query,
  setQuery,
  date,
  saveStocktake,
  stockProductId,
  setStockProductId,
  stockProducts,
  setStockBatchItems,
  stockBatchItems,
  busy,
}) {
  return (
    <div className="space-y-6">
      {/* Stock Opname Form */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Catat Stock Opname per Batch Fisik</h2>
          <p className="text-xs text-slate-500">
            Sesuaikan jumlah fisik obat di apotek dengan stok di sistem.
          </p>
        </div>
        <form onSubmit={saveStocktake} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Obat</label>
              <select
                name="produkId"
                required
                value={stockProductId}
                onChange={(e) => {
                  const productId = e.target.value;
                  const product = stockProducts.find((item) => String(item.id) === productId);
                  setStockProductId(productId);
                  setStockBatchItems(
                    (product?.batch || [])
                      .filter((batch) => batch.jumlah > 0)
                      .map((batch) => ({
                        batchId: batch.id,
                        nomorBatch: batch.nomorBatch,
                        tanggalKedaluwarsa: new Date(batch.tanggalKedaluwarsa).toISOString().slice(0, 10),
                        jumlahFisik: String(batch.jumlah),
                      }))
                  );
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="" disabled>Pilih obat dari katalog</option>
                {stockProducts.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.namaProduk} (Stok sistem: {p.stok})
                  </option>
                ))}
              </select>
            </div>
            <InputField name="alasan" label="Alasan Penyesuaian" placeholder="Contoh: Audit Rutin Bulanan" required />
          </div>

          {stockProductId && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-800">Daftar Batch Terdaftar</p>
              {stockBatchItems.map((item, index) => (
                <div key={item.batchId || `new-${index}`} className="flex items-center gap-3">
                  {item.batchId ? (
                    <input
                      value={`${item.nomorBatch} · Exp: ${item.tanggalKedaluwarsa}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700"
                    />
                  ) : (
                    <>
                      <input
                        placeholder="Nomor batch"
                        required
                        value={item.nomorBatch}
                        onChange={(e) =>
                          setStockBatchItems((items) =>
                            items.map((it, i) => (i === index ? { ...it, nomorBatch: e.target.value } : it))
                          )
                        }
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                      <input
                        type="date"
                        required
                        value={item.tanggalKedaluwarsa}
                        onChange={(e) =>
                          setStockBatchItems((items) =>
                            items.map((it, i) => (i === index ? { ...it, tanggalKedaluwarsa: e.target.value } : it))
                          )
                        }
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </>
                  )}
                  <input
                    type="number"
                    min="0"
                    required
                    value={item.jumlahFisik}
                    onChange={(e) =>
                      setStockBatchItems((items) =>
                        items.map((it, i) => (i === index ? { ...it, jumlahFisik: e.target.value } : it))
                      )
                    }
                    placeholder="Jumlah fisik"
                    className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setStockBatchItems((items) => [
                    ...items,
                    { nomorBatch: "", tanggalKedaluwarsa: "", jumlahFisik: "0" },
                  ])
                }
                className="text-xs text-[#5936A8] font-bold hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Tambah Batch Baru</span>
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={busy || !stockProductId || !stockBatchItems.length}
              className="px-5 py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              Simpan Hasil Opname
            </button>
          </div>
        </form>
      </motion.div>

      {/* Stock Opname Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Riwayat Stock Opname</h2>
            <p className="text-xs text-slate-500">{filtered.length} log penyesuaian tercatat.</p>
          </div>
          <div className="w-full sm:w-60">
            <TableSearch value={query} onChange={setQuery} placeholder="Cari obat..." />
          </div>
        </div>
        <StockTable records={filtered} date={date} />
      </motion.div>
    </div>
  );
}
