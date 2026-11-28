import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ExpensesTable } from "../data-tables";
import { InputField, TableSearch } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function ExpensesScreen({
  filtered,
  query,
  setQuery,
  createExpense,
  expenseDate,
  setExpenseDate,
  busy,
  money,
  date,
  deleteExpense,
}) {
  return (
    <div className="space-y-6">
      {/* Expense Form */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs"
      >
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-sm font-bold text-slate-900">Catat Biaya Operasional</h2>
          <p className="text-xs text-slate-500">
            Biaya yang dicatat akan mengurangi laba bersih pada laporan keuangan periode terkait.
          </p>
        </div>
        <form onSubmit={createExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <InputField
              name="tanggal"
              label="Tanggal"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
            <InputField name="kategori" label="Kategori Biaya" placeholder="Contoh: Listrik, Sewa, Gaji" required />
            <InputField name="deskripsi" label="Keterangan Pengeluaran" placeholder="Contoh: Tagihan Listrik PLN" required />
            <InputField name="jumlah" label="Jumlah Biaya (Rp)" type="number" min="0.01" step="0.01" required />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Simpan Biaya</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Expense Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar Biaya Operasional</h2>
            <p className="text-xs text-slate-500">{filtered.length} catatan biaya tersimpan.</p>
          </div>
          <div className="w-full sm:w-60">
            <TableSearch value={query} onChange={setQuery} placeholder="Cari keterangan..." />
          </div>
        </div>
        <ExpensesTable expenses={filtered} money={money} date={date} onDelete={deleteExpense} />
      </motion.div>
    </div>
  );
}
