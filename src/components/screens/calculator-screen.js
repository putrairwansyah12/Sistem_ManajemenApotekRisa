import { motion } from "framer-motion";
import { Box, Check, Search } from "lucide-react";
import { InputField } from "../form-controls";
import { itemVariants } from "../motion-presets";
import { getCalculatorHpp } from "../../lib/pricing";

export function CalculatorScreen({ priceMode, setPriceMode, selectedBulkProductIds, priceForm, changePriceInput, data, selectedPriceProduct, money, bulkSearchQuery, setBulkSearchQuery, bulkAvailableProducts, setSelectedBulkProductIds, bulkCategoryFilter, setBulkCategoryFilter, pricingCategories, priceSourceNote, priceError, priceResult, priceDraft, busy, saveSuggestedPrice, bulkCalculations, saveBulkSuggestedPrices }) {
  return (
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Form & Product Selection */}
                  <motion.div
                    variants={itemVariants}
                    className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Hitung Harga Jual Optimal</h2>
                        <p className="text-xs text-slate-500">
                          Simulasi margin laba dan kalkulasi struktur biaya e-commerce Shopee.
                        </p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setPriceMode("single")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            priceMode === "single"
                              ? "bg-white text-[#5936A8] shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Satu Obat
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceMode("bulk")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            priceMode === "bulk"
                              ? "bg-white text-[#5936A8] shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <span>Banyak Obat (Massal)</span>
                          {selectedBulkProductIds.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-[#5936A8] text-white rounded-full text-[10px] leading-none font-bold">
                              {selectedBulkProductIds.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Mode Single: Single Product Selection */}
                    {priceMode === "single" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Obat</label>
                          <select
                            name="produkId"
                            value={priceForm.produkId}
                            onChange={changePriceInput}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#5936A8] focus:bg-white transition-all"
                          >
                            <option value="" disabled>Pilih obat dari katalog</option>
                            {data.map((p) => (
                              <option value={p.id} key={p.id}>
                                {p.namaProduk} (Stok: {p.stok})
                              </option>
                            ))}
                          </select>
                          {selectedPriceProduct && (
                            <p className="text-[11px] text-[#5936A8] mt-1 font-semibold">
                              Harga beli saat ini: {money(selectedPriceProduct.hargaBeli)} · Harga jual: {money(selectedPriceProduct.hargaJual)}
                            </p>
                          )}
                        </div>

                        <InputField name="hpp" label="HPP (Harga Pokok)" type="number" min="0" step="0.01" value={priceForm.hpp} onChange={changePriceInput} required />
                        <InputField name="persenTargetLaba" label="Target Margin / Laba (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenTargetLaba} onChange={changePriceInput} required />
                        <InputField name="persenBiayaAdmin" label="Biaya Admin Marketplace (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenBiayaAdmin} onChange={changePriceInput} required />
                        <InputField name="persenPajak" label="Biaya Pajak (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenPajak} onChange={changePriceInput} required />
                        <InputField name="biayaPengemasan" label="Biaya Pengemasan / Unit (Rp)" type="number" min="0" step="0.01" value={priceForm.biayaPengemasan} onChange={changePriceInput} required />
                        <InputField name="biayaLayanan" label="Biaya Layanan / Unit (Rp)" type="number" min="0" step="0.01" value={priceForm.biayaLayanan} onChange={changePriceInput} required />
                        <InputField name="biayaGratisOngkir" label="Subsidi Gratis Ongkir / Unit (Rp)" type="number" min="0" step="0.01" value={priceForm.biayaGratisOngkir} onChange={changePriceInput} required />
                      </div>
                    )}

                    {/* Mode Bulk: Mass Product Selection */}
                    {priceMode === "bulk" && (
                      <div className="space-y-4">
                        {/* Parameters Card */}
                        <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#5936A8] uppercase tracking-wider">
                              Parameter Biaya E-Commerce Terpadu
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Diterapkan serentak ke seluruh obat yang dicentang
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <InputField name="persenTargetLaba" label="Target Laba (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenTargetLaba} onChange={changePriceInput} required />
                            <InputField name="persenBiayaAdmin" label="Biaya Admin (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenBiayaAdmin} onChange={changePriceInput} required />
                            <InputField name="persenPajak" label="Biaya Pajak (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenPajak} onChange={changePriceInput} required />
                            <InputField name="biayaPengemasan" label="Kemasan / Unit (Rp)" type="number" min="0" step="0.01" value={priceForm.biayaPengemasan} onChange={changePriceInput} required />
                            <InputField name="biayaLayanan" label="Layanan / Unit (Rp)" type="number" min="0" step="0.01" value={priceForm.biayaLayanan} onChange={changePriceInput} required />
                            <InputField name="biayaGratisOngkir" label="Gratis Ongkir (Rp)" type="number" min="0" step="0.01" value={priceForm.biayaGratisOngkir} onChange={changePriceInput} required />
                          </div>
                        </div>

                        {/* Search & Category Filter */}
                        <div className="space-y-2.5">
                          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="text"
                                placeholder="Cari obat massal (nama atau barcode)..."
                                value={bulkSearchQuery}
                                onChange={(e) => setBulkSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#5936A8] focus:bg-white transition-all"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const idsToAdd = bulkAvailableProducts.map((p) => p.id);
                                  setSelectedBulkProductIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-100 text-[#5936A8] text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                              >
                                Pilih Semua ({bulkAvailableProducts.length})
                              </button>
                              {selectedBulkProductIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBulkProductIds([])}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                                >
                                  Reset Pilihan
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Category Filter Pills */}
                          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                            {pricingCategories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setBulkCategoryFilter(cat)}
                                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                                  bulkCategoryFilter === cat
                                    ? "bg-[#5936A8] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {cat === "all" ? "Semua Kategori" : cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Product Checkbox Selection List */}
                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto bg-slate-50/50">
                          {bulkAvailableProducts.slice(0, 300).map((product) => {
                            const isSelected = selectedBulkProductIds.includes(product.id);
                            const cost = getCalculatorHpp(product);
                            return (
                              <label
                                key={product.id}
                                className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-purple-50/40 transition-colors ${
                                  isSelected ? "bg-purple-50/60" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBulkProductIds((prev) => [...prev, product.id]);
                                      } else {
                                        setSelectedBulkProductIds((prev) => prev.filter((id) => id !== product.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-[#5936A8] focus:ring-[#5936A8] w-4 h-4 cursor-pointer"
                                  />
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-slate-900 block truncate">
                                      {product.namaProduk}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {product.kategori?.nama || "Umum"} · HPP: {money(cost.value)} · Jual Saat Ini: {money(product.hargaJual)}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-md ${
                                  isSelected ? "bg-[#5936A8] text-white" : "bg-slate-200 text-slate-600"
                                }`}>
                                  {isSelected ? "Terpilih" : "Pilih"}
                                </span>
                              </label>
                            );
                          })}
                          {!bulkAvailableProducts.length && (
                            <div className="py-8 text-center text-slate-400 text-xs">
                              Tidak ada obat yang cocok dengan filter.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                      <span>{priceMode === "single" ? priceSourceNote : "Kalkulasi massal otomatis menggunakan HPP/Harga Beli tersimpan dari tiap obat terpilih."}</span>
                      {priceError && <p className="text-rose-600 font-semibold mt-1">{priceError}</p>}
                    </div>
                  </motion.div>

                  {/* Right Column: Preview & Apply Button */}
                  <motion.div
                    variants={itemVariants}
                    className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    {priceMode === "single" ? (
                      <div>
                        <div className="border-b border-slate-100 pb-3 mb-4">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hasil Rekomendasi Satuan</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {selectedPriceProduct?.namaProduk || "Pilih obat terlebih dahulu"}
                          </p>
                        </div>

                        {priceResult ? (
                          <div className="space-y-4">
                            <div className="p-5 bg-purple-50/70 border border-purple-100 rounded-2xl text-center">
                              <span className="text-[10px] font-bold text-[#5936A8] uppercase tracking-wider block mb-1">
                                Harga Jual Disarankan
                              </span>
                              <span className="text-3xl font-extrabold text-[#5936A8] block tracking-tight">
                                {money(priceResult.hargaJual)}
                              </span>
                            </div>

                            <div className="space-y-2 text-xs divide-y divide-slate-100">
                              <div className="flex justify-between py-1.5 text-slate-600">
                                <span>Harga Jual Saat Ini</span>
                                <span className="font-semibold text-slate-800">{money(selectedPriceProduct?.hargaJual)}</span>
                              </div>
                              <div className="flex justify-between py-1.5 text-slate-600">
                                <span>Laba Kotor per Unit</span>
                                <span className="font-semibold text-emerald-600">{money(priceResult.labaKotor)}</span>
                              </div>
                              <div className="flex justify-between py-1.5 text-slate-600">
                                <span>Estimasi Laba Bersih</span>
                                <span className="font-bold text-[#5936A8]">{money(priceResult.labaBersih)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-slate-400 text-xs">
                            Pilih obat dan tentukan parameter untuk melihat hasil kalkulasi harga.
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={busy || !priceDraft}
                          onClick={saveSuggestedPrice}
                          className="w-full mt-6 py-2.5 px-4 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Check size={15} />
                          <span>Simpan Harga ke Produk</span>
                        </button>
                      </div>
                    ) : (
                      /* Bulk Right Column */
                      <div className="space-y-4 flex flex-col h-full justify-between">
                        <div>
                          <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                            <div>
                              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hasil Rekomendasi Massal</h3>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Pratinjau perhitungan untuk seluruh obat yang dicentang.
                              </p>
                            </div>
                            <span className="px-2.5 py-1 bg-purple-50 text-[#5936A8] font-extrabold text-xs rounded-xl border border-purple-100">
                              {bulkCalculations.length} Obat
                            </span>
                          </div>

                          {bulkCalculations.length > 0 ? (
                            <div className="space-y-3">
                              {/* Preview Table */}
                              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                                    <tr>
                                      <th className="py-2 px-2.5">Produk</th>
                                      <th className="py-2 px-2 text-right">HPP</th>
                                      <th className="py-2 px-2 text-right">Lama</th>
                                      <th className="py-2 px-2.5 text-right text-[#5936A8]">Baru</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                    {bulkCalculations.map((item) => (
                                      <tr key={item.product.id} className="hover:bg-slate-50/60">
                                        <td className="py-2 px-2.5 max-w-[140px] truncate font-medium text-slate-800" title={item.product.namaProduk}>
                                          {item.product.namaProduk}
                                        </td>
                                        <td className="py-2 px-2 text-right text-slate-500">
                                          {money(item.cost.value)}
                                        </td>
                                        <td className="py-2 px-2 text-right text-slate-400 line-through">
                                          {money(item.product.hargaJual)}
                                        </td>
                                        <td className="py-2 px-2.5 text-right font-extrabold text-[#5936A8]">
                                          {item.calc ? money(item.calc.hargaJual) : "Error"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="py-16 text-center text-slate-400 text-xs">
                              <Box size={28} className="mx-auto mb-2 text-slate-300 opacity-80" />
                              <p className="font-semibold text-slate-600">Belum ada obat yang dipilih</p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Centang obat di kolom sebelah kiri untuk menghitung rekomendasi harga serentak.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={busy || bulkCalculations.length === 0}
                            onClick={saveBulkSuggestedPrices}
                            className="w-full py-2.5 px-4 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Check size={15} />
                            <span>Terapkan Harga ke {bulkCalculations.length} Obat Terpilih</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
  );
}
