import { motion } from "framer-motion";
import { PriceHistoryTable } from "../data-tables";
import { TableSearch } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function PricesScreen({
  query,
  setQuery,
  filtered,
  money,
  date,
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Riwayat Perubahan Harga</h2>
          <p className="text-xs text-slate-500">Log audit historis perubahan harga beli, HPP, dan harga jual obat.</p>
        </div>
        <div className="w-full sm:w-60">
          <TableSearch value={query} onChange={setQuery} placeholder="Cari obat..." />
        </div>
      </div>
      <PriceHistoryTable history={filtered} money={money} date={date} />
    </motion.div>
  );
}
