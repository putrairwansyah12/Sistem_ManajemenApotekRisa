import Image from "next/image";
import { Printer, X } from "lucide-react";

const receiptNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function ReceiptModal({ sale, onPrint, onClose }) {
  const details = sale.detail || [];
  const subtotal = details.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const otherFees =
    Number(sale.biayaAdmin || 0) +
    Number(sale.biayaPengemasan || 0) +
    Number(sale.biayaLayanan || 0) +
    Number(sale.biayaGratisOngkir || 0);
  const transactionDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(sale.tanggal));

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between no-print border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800">Pratinjau Struk Kasir</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="px-3 py-1.5 bg-[#5936A8] hover:bg-[#472985] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 72mm Monospace Thermal Paper Format */}
        <article className="font-mono text-[11px] text-slate-800 bg-[#FFFDF7] p-4 rounded-xl border border-dashed border-slate-300 leading-tight space-y-3">
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-1">
              <Image src="/apotek.jpg" alt="Logo" width={48} height={48} className="rounded-lg object-contain" />
            </div>
            <h2 className="font-bold text-xs uppercase tracking-wide">APOTEK RISA</h2>
            <p className="text-[10px] uppercase">JL. TEROPONG PERUM GRIYA MASMUR 1 BLOK B KAVLING NO 7</p>
            <p className="text-[10px]">Telp: 0882-7145-7114</p>
            <p className="text-slate-400">==============================</p>
          </div>

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>No. Transaksi</span>
              <span className="font-bold">{sale.kodeTransaksi}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{transactionDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>UMUM</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
            {details.map((item) => (
              <div key={item.id} className="space-y-0.5">
                <span className="block font-bold truncate uppercase">{item.produk?.namaProduk || "Produk"}</span>
                <div className="flex justify-between text-[10px]">
                  <span>
                    {item.jumlah} {item.produk?.satuan?.kode || ""} x {receiptNumber.format(Number(item.hargaSatuan || 0))}
                  </span>
                  <span className="font-bold">{receiptNumber.format(Number(item.subtotal || 0))}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{receiptNumber.format(subtotal)}</span>
            </div>
            {Number(sale.potongan || 0) > 0 && (
              <div className="flex justify-between">
                <span>Potongan</span>
                <span>-{receiptNumber.format(Number(sale.potongan || 0))}</span>
              </div>
            )}
            {Number(sale.biayaPajak || 0) > 0 && (
              <div className="flex justify-between">
                <span>Pajak</span>
                <span>{receiptNumber.format(Number(sale.biayaPajak || 0))}</span>
              </div>
            )}
            {otherFees > 0 && (
              <div className="flex justify-between">
                <span>Biaya Lain</span>
                <span>{receiptNumber.format(otherFees)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-slate-400 pt-1 flex justify-between font-bold text-xs">
              <span>TOTAL</span>
              <span>{receiptNumber.format(Number(sale.total || 0))}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px]">
            <p className="text-slate-400">==============================</p>
            <p className="mt-1 font-medium">Terima kasih atas kunjungan Anda</p>
          </div>
        </article>
      </div>
    </div>
  );
}
