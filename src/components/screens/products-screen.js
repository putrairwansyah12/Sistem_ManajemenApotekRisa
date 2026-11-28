import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import {
  InputField,
  InventoryTabs,
  TableSearch,
} from "../form-controls";
import { ProductsTable } from "../data-tables";
import { itemVariants } from "../motion-presets";

const PRODUCTS_PER_PAGE = 50;

export function ProductsScreen({
  user,
  summaryDetail,
  onSelectInventoryTab,
  busy,
  onCreateProduct,
  editingProduct,
  editFormRef,
  onSaveProductEdit,
  onCancelEdit,
  filtered,
  query,
  onQueryChange,
  money,
  onArchive,
  onPriceChange,
  onEdit,
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const activePage = Math.min(page, pageCount);
  const pageStart = (activePage - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = filtered.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  function handleQueryChange(value) {
    setPage(1);
    onQueryChange(value);
  }

  return (
    <div className="space-y-6">
      <InventoryTabs activeTab="products" onSelect={onSelectInventoryTab} />

      {/* Add Product Form */}
      {user.role === "PEMILIK" && !summaryDetail && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs"
        >
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tambah Obat Baru</h2>
              <p className="text-xs text-slate-500">
                Masukkan detail produk dan persediaan awal ke katalog.
              </p>
            </div>
          </div>
          <form onSubmit={onCreateProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <InputField name="namaProduk" label="Nama Obat" required />
              <InputField name="kodeBarang" label="Kode Barang" placeholder="Contoh: OB-001" />
              <InputField name="kategori" label="Kategori" placeholder="Contoh: Obat Bebas" required />
              <InputField name="satuan" label="Satuan" placeholder="Contoh: Strip, Botol" required />
              <InputField name="hargaBeli" label="Harga Beli / HPP" type="number" min="0" required />
              <InputField name="hargaJual" label="Harga Jual" type="number" min="0" required />
              <InputField name="stok" label="Stok Awal" type="number" min="0" required />
              <InputField name="stokMinimum" label="Batas Stok Menipis" type="number" min="0" required />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60"
              >
                <Plus size={15} />
                <span>Simpan Obat</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Edit Product Form */}
      {editingProduct && (
        <motion.div
          ref={editFormRef}
          variants={itemVariants}
          className="bg-purple-50/50 border border-purple-200 rounded-2xl p-6 shadow-xs"
        >
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-purple-100">
            <div>
              <h2 className="text-sm font-bold text-purple-900">Ubah Data Obat</h2>
              <p className="text-xs text-purple-700">{editingProduct.namaProduk}</p>
            </div>
          </div>
          <form onSubmit={onSaveProductEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <InputField name="namaProduk" label="Nama Obat" defaultValue={editingProduct.namaProduk} required />
              <InputField name="kodeBarang" label="Kode Barang" defaultValue={editingProduct.kodeBarang || ""} />
              <InputField name="kategori" label="Kategori" defaultValue={editingProduct.kategori.nama} required />
              <InputField name="satuan" label="Satuan" defaultValue={editingProduct.satuan.kode} required />
              <InputField name="hargaBeli" label="Harga Beli" type="number" min="0" step="0.01" defaultValue={editingProduct.hargaBeli} required />
              <InputField name="hpp" label="HPP" type="number" min="0" step="0.01" defaultValue={editingProduct.hpp} required />
              <InputField name="hargaJual" label="Harga Jual" type="number" min="0" step="0.01" defaultValue={editingProduct.hargaJual} required />
              <InputField name="stokMinimum" label="Batas Stok Menipis" type="number" min="0" step="1" defaultValue={editingProduct.stokMinimum} required />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60"
              >
                <Check size={15} />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Catalog Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {summaryDetail === "lowStock" ? "Produk Stok Menipis" : "Katalog Obat & Persediaan"}
            </h2>
            <p className="text-xs text-slate-500">Tersedia {filtered.length} produk di sistem.</p>
          </div>
          <div className="w-full sm:w-64">
            <TableSearch value={query} onChange={handleQueryChange} placeholder="Cari nama atau kode obat..." />
          </div>
        </div>

        <ProductsTable
          products={pageProducts}
          money={money}
          onArchive={onArchive}
          onPriceChange={onPriceChange}
          onEdit={onEdit}
          owner={user.role === "PEMILIK"}
        />

        {filtered.length > PRODUCTS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-500">
              Menampilkan {pageStart + 1}–{Math.min(pageStart + PRODUCTS_PER_PAGE, filtered.length)} dari {filtered.length} obat
            </span>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="min-w-[88px] text-center text-[11px] font-medium text-slate-600">
                Halaman {activePage} / {pageCount}
              </span>
              <button
                type="button"
                disabled={activePage === pageCount}
                onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
