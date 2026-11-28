import { motion } from "framer-motion";
import { CheckCircle2, Download, Eye, FileSpreadsheet, Upload } from "lucide-react";
import { ExcelImportTable } from "../data-tables";
import { itemVariants } from "../motion-presets";

export function ExcelScreen({
  busy,
  exportProductsExcel,
  previewProductsExcel,
  excelDropActive,
  setExcelDropActive,
  dropExcelFile,
  excelFile,
  selectExcelFiles,
  excelPreview,
  commitProductsExcel,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Export Excel Card */}
      <motion.div
        variants={itemVariants}
        className="h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between"
      >
        <div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center mb-4">
            <Download size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Ekspor Katalog Produk (.xlsx)</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Unduh seluruh katalog obat aktif ke format file Excel (.xlsx) untuk kebutuhan arsip, laporan stok fisik, atau rekonsiliasi berkala.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={exportProductsExcel}
          className="w-full py-2.5 px-4 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Download size={15} />
          <span>Unduh File Excel</span>
        </button>
      </motion.div>

      {/* Import Excel Card */}
      <motion.div
        variants={itemVariants}
        className="h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between"
      >
        <div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center mb-4">
            <Upload size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Impor Produk dari Excel</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Perbarui atau tambahkan produk dari file Excel. Periksa pratinjau sebelum menyimpan perubahan.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Perubahan stok produk lama dicatat sebagai stock opname. Stok batch tetap; nilai stok Excel tidak boleh lebih kecil dari total stok batch.
          </p>
        </div>
        <form onSubmit={previewProductsExcel} className="space-y-4">
          <label
            htmlFor="excel-import-file"
            onDragEnter={(event) => {
              event.preventDefault();
              setExcelDropActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setExcelDropActive(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setExcelDropActive(false);
            }}
            onDrop={dropExcelFile}
            className={`flex min-h-[76px] items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors focus-within:ring-2 cursor-pointer ${
              excelDropActive
                ? "border-[#5936A8] bg-purple-50 ring-2 ring-purple-100"
                : "border-slate-300 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/50 focus-within:border-[#5936A8] focus-within:ring-purple-100"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5936A8]">
              <FileSpreadsheet size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-xs font-semibold ${excelFile ? "text-slate-800" : "text-slate-600"}`}>
                {excelFile?.name || "Pilih file Excel (.xlsx)"}
              </span>
              <span className="mt-1 block text-[11px] text-slate-500">
                {excelFile
                  ? `${(excelFile.size / (1024 * 1024)).toFixed(2)} MB · Maksimal 5 MB`
                  : "Lepas file di sini atau pilih · .xlsx · Maksimal 5 MB"}
              </span>
            </span>
            <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-[#5936A8] shadow-sm">
              {excelFile ? "Ganti file" : "Pilih file"}
            </span>
            <input
              id="excel-import-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                selectExcelFiles(e.target.files);
                e.currentTarget.value = "";
              }}
              className="sr-only"
            />
          </label>
          {excelFile?.size > 5 * 1024 * 1024 && (
            <p className="text-xs font-medium text-rose-600" role="alert">
              File melebihi batas maksimal 5 MB. Pilih file yang lebih kecil.
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !excelFile || excelFile.size > 5 * 1024 * 1024}
            className="w-full py-2.5 px-4 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Eye size={15} />
            <span>{busy ? "Memproses pratinjau..." : excelFile ? "Pratinjau Impor" : "Pilih file untuk melihat pratinjau"}</span>
          </button>
        </form>

        {excelPreview && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{excelPreview.rowCount || 0} baris terbaca</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#5936A8] font-bold">
                {excelPreview.counts?.errors || 0} Perlu Perbaikan
              </span>
            </div>
            {excelPreview.audit?.status === "BERHASIL" && (
              <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Impor berhasil disimpan.</p>
                  <p className="mt-1 text-[11px]">
                    {excelPreview.counts.create} produk ditambahkan, {excelPreview.counts.update} diperbarui, dan {excelPreview.stockAdjustments} perubahan stok tercatat sebagai stock opname.
                  </p>
                </div>
              </div>
            )}
            <ExcelImportTable rows={excelPreview.rows || []} />
            {excelPreview.audit?.status === "BERHASIL" ? (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-600">
                Data impor sudah tersimpan. Pilih file lain untuk memulai impor baru.
              </div>
            ) : (
              <button
                type="button"
                disabled={busy || !excelFile || Boolean(excelPreview.counts?.errors)}
                onClick={commitProductsExcel}
                className="w-full py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40"
              >
                Simpan Perubahan ke Database
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
