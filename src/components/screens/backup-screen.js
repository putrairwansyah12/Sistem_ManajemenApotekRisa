import { motion } from "framer-motion";
import { AlertTriangle, Database, Download } from "lucide-react";
import { InputField } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function BackupScreen({
  busy,
  downloadBackup,
  restoreBackup,
  setBackupFile,
  restoreConfirmation,
  setRestoreConfirmation,
  backupFile,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Backup Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between"
      >
        <div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center mb-4">
            <Database size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Backup Database Sistem</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Unduh salinan cadangan lengkap database mencakup produk, batch, transaksi, riwayat harga, dan akun pengguna dalam format JSON.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={downloadBackup}
          className="w-full py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download size={15} />
          <span>Unduh File Cadangan Database</span>
        </button>
      </motion.div>

      {/* Restore Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Restore Database</h2>
          <p className="text-xs text-rose-600 font-semibold mt-1 leading-relaxed">
            Peringatan: Pemulihan akan menimpa seluruh data sistem saat ini. Pastikan file JSON yang digunakan adalah yang terbaru.
          </p>
        </div>
        <form onSubmit={restoreBackup} className="space-y-4">
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
            required
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
          />
          <InputField
            name="restoreConfirmation"
            label={'Ketik "RESTORE" untuk konfirmasi:'}
            value={restoreConfirmation}
            onChange={(e) => setRestoreConfirmation(e.target.value)}
            placeholder="Ketik RESTORE"
            required
          />
          <button
            type="submit"
            disabled={busy || restoreConfirmation !== "RESTORE" || !backupFile}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40"
          >
            Timpa & Pulihkan Database
          </button>
        </form>
      </motion.div>
    </div>
  );
}
