import { useId } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Search } from "lucide-react";
import { cardHoverProps, itemVariants } from "./motion-presets";

export function MetricCard({ title, value, note, icon: IconComponent, warning, selected, onClick }) {
  return (
    <motion.button
      type="button"
      variants={itemVariants}
      {...cardHoverProps}
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left bg-white transition-all flex flex-col justify-between ${
        selected
          ? "border-[#5936A8] ring-2 ring-purple-500/20 shadow-xs"
          : "border-slate-200 hover:border-[#8B6AD9] shadow-2xs"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400">{title}</span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            warning ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-[#5936A8]"
          }`}
        >
          <IconComponent size={15} />
        </div>
      </div>
      <div>
        <span className="text-xl font-bold text-slate-900 block tracking-tight">{value}</span>
        <span className="text-[11px] text-slate-400 block mt-0.5">{note}</span>
      </div>
    </motion.button>
  );
}

export function InputField({ label, name, type = "text", ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        {...props}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#5936A8] focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition-all placeholder:text-slate-400"
      />
    </div>
  );
}

export function PasswordField({ label, name, minLength, required, show, onToggle }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          minLength={minLength}
          maxLength="200"
          autoComplete="new-password"
          required={required}
          className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#5936A8] focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition-all placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? "Sembunyikan password" : "Lihat password"}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export function TableSearch({ value, onChange, placeholder = "Cari data..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#5936A8] focus:bg-white transition-all"
      />
    </div>
  );
}

export function InventoryTabs({ activeTab, onSelect }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
      <button
        onClick={() => onSelect("products")}
        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
          activeTab === "products"
            ? "border-[#5936A8] text-[#5936A8]"
            : "border-transparent text-slate-500 hover:text-slate-800"
        }`}
      >
        Katalog Obat
      </button>
      <button
        onClick={() => onSelect("expiry")}
        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
          activeTab === "expiry"
            ? "border-[#5936A8] text-[#5936A8]"
            : "border-transparent text-slate-500 hover:text-slate-800"
        }`}
      >
        Monitoring Kedaluwarsa
      </button>
    </div>
  );
}
