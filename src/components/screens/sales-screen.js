import { motion } from "framer-motion";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { TableSearch } from "../form-controls";
import { itemVariants } from "../motion-presets";

export function SalesScreen({
  filtered,
  money,
  query,
  onQueryChange,
  salesPageProducts,
  busy,
  setCart,
  salesPageStart,
  pageSize,
  activeSalesPage,
  salesPageCount,
  setSalesPage,
  cart,
  saleSettings,
  changeSaleSetting,
  checkout,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Product Picker */}
      <motion.div
        variants={itemVariants}
        className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pilih Obat</h2>
            <p className="text-xs text-slate-500">{filtered.length} produk siap dijual.</p>
          </div>
          <div className="w-full sm:w-60">
            <TableSearch
              value={query}
              onChange={onQueryChange}
              placeholder="Cari nama obat..."
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 pr-1">
          {salesPageProducts.map((product) => (
            <div
              key={product.id}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 block">{product.namaProduk}</span>
                <span className="text-[11px] text-slate-400">
                  {product.kodeBarang || "Tanpa kode"} · Stok: {product.stok} {product.satuan.kode}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-800">{money(product.hargaJual)}</span>
                <button
                  disabled={!product.stok || busy}
                  onClick={() =>
                    setCart((items) => {
                      const found = items.find((item) => item.id === product.id);
                      if (found) {
                        return items.map((item) =>
                          item.id === product.id
                            ? { ...item, quantity: Math.min(item.quantity + 1, product.stok) }
                            : item
                        );
                      }
                      return [...items, { id: product.id, quantity: 1, product }];
                    })
                  }
                  className="w-8 h-8 rounded-xl bg-purple-50 hover:bg-[#5936A8] text-[#5936A8] hover:text-white flex items-center justify-center transition-all disabled:opacity-40"
                  title="Tambah ke keranjang"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada obat yang cocok dengan pencarian.
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-500">
              Menampilkan {salesPageStart + 1}–{Math.min(salesPageStart + pageSize, filtered.length)} dari {filtered.length} obat
            </span>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <button
                type="button"
                disabled={activeSalesPage === 1}
                onClick={() => setSalesPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="min-w-[88px] text-center text-[11px] font-medium text-slate-600">
                Halaman {activeSalesPage} / {salesPageCount}
              </span>
              <button
                type="button"
                disabled={activeSalesPage === salesPageCount}
                onClick={() => setSalesPage((page) => Math.min(salesPageCount, page + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Right Column: Cart Panel */}
      <motion.div
        variants={itemVariants}
        className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 sticky top-24"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Keranjang Transaksi</h3>
            <p className="text-xs text-slate-400">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} item dipilih
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-[11px] text-rose-600 hover:underline font-semibold"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
          {cart.map((item) => (
            <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800 block truncate">
                  {item.product.namaProduk}
                </span>
                <span className="text-[11px] text-slate-400">{money(item.product.hargaJual)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() =>
                      setCart((items) =>
                        items
                          .map((entry) =>
                            entry.id === item.id ? { ...entry, quantity: entry.quantity - 1 } : entry
                          )
                          .filter((entry) => entry.quantity > 0)
                      )
                    }
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      setCart((items) =>
                        items.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, quantity: Math.min(entry.quantity + 1, entry.product.stok) }
                            : entry
                        )
                      )
                    }
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!cart.length && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Keranjang kosong. Pilih obat dari daftar sebelah kiri.
            </div>
          )}
        </div>

        {/* Transaction Options */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Transaksi</label>
            <select
              name="jenis"
              value={saleSettings.jenis}
              onChange={changeSaleSetting}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Diskon / Potongan</label>
            <input
              name="potongan"
              type="number"
              min="0"
              step="0.01"
              value={saleSettings.potongan}
              onChange={changeSaleSetting}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Total Amount */}
        <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-500">Total Pembayaran</span>
          <span className="text-xl font-bold text-slate-900">
            {money(
              Math.max(
                0,
                cart.reduce(
                  (sum, item) => sum + Number(item.product.hargaJual) * item.quantity,
                  0
                ) - Number(saleSettings.potongan || 0)
              )
            )}
          </span>
        </div>

        <button
          disabled={!cart.length || busy}
          onClick={checkout}
          className="w-full py-2.5 bg-[#5936A8] hover:bg-[#472985] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <ShoppingCart size={15} />
          <span>{busy ? "Memproses Transaksi..." : "Selesaikan Transaksi"}</span>
        </button>
      </motion.div>
    </div>
  );
}
