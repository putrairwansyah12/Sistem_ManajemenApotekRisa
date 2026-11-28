"use client";

import { useCallback, useEffect, useMemo, useState, useId, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Calculator,
  History,
  ShoppingCart,
  ReceiptText,
  DollarSign,
  TrendingDown,
  FileText,
  FileSpreadsheet,
  ClipboardCheck,
  Database,
  Users,
  LogOut,
  Search,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Archive,
  Eye,
  EyeOff,
  Download,
  Upload,
  Printer,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Bell,
  RefreshCw,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Menu,
  X,
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Box,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { calculatePrice, getCalculatorHpp } from "../lib/pricing";
import { MIN_PASSWORD_LENGTH } from "../lib/user-validation";

// Original menu items preserved exactly with their original Indonesian titles
const menuGroups = [
  {
    title: "MENU UTAMA",
    items: [
      { id: "dashboard", label: "Ringkasan", icon: LayoutDashboard },
      { id: "products", label: "Obat & Persediaan", icon: Package },
      { id: "sales", label: "Transaksi Penjualan", icon: ShoppingCart },
      { id: "history", label: "Riwayat Penjualan", icon: History },
    ],
  },
  {
    title: "MANAJEMEN & SISTEM",
    items: [
      { id: "calculator", label: "Kalkulator Harga", icon: Calculator, role: "PEMILIK" },
      { id: "prices", label: "Riwayat Harga", icon: DollarSign, role: "PEMILIK" },
      { id: "expenses", label: "Biaya Operasional", icon: TrendingDown, role: "PEMILIK" },
      { id: "reports", label: "Laporan", icon: FileText, role: "PEMILIK" },
      { id: "excel", label: "Impor/Ekspor Excel", icon: FileSpreadsheet, role: "PEMILIK" },
      { id: "stock", label: "Stock Opname", icon: ClipboardCheck, role: "PEMILIK" },
      { id: "backup", label: "Backup & Restore", icon: Database, role: "PEMILIK" },
      { id: "users", label: "Pengguna", icon: Users, role: "PEMILIK" },
    ],
  },
];

const menuSections = [
  { title: "MENU UTAMA", ids: ["dashboard", "products", "sales", "history"] },
  { title: "MANAJEMEN & SISTEM", ids: ["calculator", "prices", "expenses", "reports", "excel", "stock", "backup", "users"] },
];

const reportMetricLabels = {
  omzet: "Omzet",
  jumlahKunjungan: "Jumlah kunjungan",
  labaKotor: "Laba kotor",
  biayaOperasional: "Biaya operasional",
  labaBersih: "Laba bersih",
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const receiptNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const SALES_PAGE_SIZE = 25;

function money(value) {
  return currency.format(Number(value || 0));
}

function dateInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function date(value) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

async function downloadFile(url, filename, fallbackMessage) {
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || fallbackMessage);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function request(url, options) {
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || result.message || "Permintaan gagal.");
    error.payload = result;
    throw error;
  }
  return result;
}

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const cardHoverProps = {
  whileHover: { y: -3, transition: { duration: 0.18, ease: "easeOut" } },
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [screen, setScreen] = useState("dashboard");
  const [summaryDetail, setSummaryDetail] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [data, setData] = useState([]);
  const [stockProducts, setStockProducts] = useState([]);
  const [stockProductId, setStockProductId] = useState("");
  const [stockBatchItems, setStockBatchItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [reportFilter, setReportFilter] = useState({ period: "month", date: "" });
  const [historyFilter, setHistoryFilter] = useState({ period: "month", date: "" });
  const [appliedHistoryFilter, setAppliedHistoryFilter] = useState({ period: "month", date: "" });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [expenseDate, setExpenseDate] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelDropActive, setExcelDropActive] = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [query, setQuery] = useState("");
  const [salesPage, setSalesPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [saleSettings, setSaleSettings] = useState({
    jenis: "OFFLINE",
    potongan: "0",
    persenBiayaAdmin: "0",
    persenPajak: "0",
    biayaPengemasan: "0",
    biayaLayanan: "0",
    biayaGratisOngkir: "0",
  });
  const [priceForm, setPriceForm] = useState({
    produkId: "",
    hpp: "",
    hppSumber: "hpp",
    persenBiayaAdmin: "0",
    persenPajak: "0",
    biayaPengemasan: "0",
    biayaLayanan: "0",
    biayaGratisOngkir: "0",
    persenTargetLaba: "0",
  });
  const [priceResult, setPriceResult] = useState(null);
  const [priceDraft, setPriceDraft] = useState(null);
  const [priceError, setPriceError] = useState("");
  const [priceMode, setPriceMode] = useState("single");
  const [selectedBulkProductIds, setSelectedBulkProductIds] = useState([]);
  const [bulkCategoryFilter, setBulkCategoryFilter] = useState("all");
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");
  const [bulkSimpanHpp, setBulkSimpanHpp] = useState(false);
  const [bulkPage, setBulkPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const editProductFormRef = useRef(null);
  const historyRequestIdRef = useRef(0);
  const [receiptSale, setReceiptSale] = useState(null);
  const [userEditor, setUserEditor] = useState(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditorPassword, setShowEditorPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (editingProduct) {
      editProductFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingProduct]);

  function recalculatePrice(nextForm) {
    if (!nextForm.produkId) {
      setPriceDraft(null);
      setPriceResult(null);
      setPriceError("");
      return;
    }
    const draft = {
      ...nextForm,
      produkId: Number(nextForm.produkId),
      simpanHpp: nextForm.hppSumber !== "hargaBeli",
    };
    try {
      const calculation = calculatePrice(draft);
      setPriceDraft(draft);
      setPriceResult(calculation);
      setPriceError("");
    } catch (error) {
      setPriceDraft(null);
      setPriceResult(null);
      setPriceError(error instanceof Error ? error.message : "Input kalkulasi tidak valid.");
    }
  }

  const flash = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }, []);

  const loadScreen = useCallback(
    async (currentScreen, options = {}) => {
      let historyRequestId = null;
      if (currentScreen === "history") {
        historyRequestId = ++historyRequestIdRef.current;
      } else {
        historyRequestIdRef.current += 1;
      }
      setLoading(true);
      if (currentScreen !== "history") setData([]);
      setStockProducts([]);
      setStockProductId("");
      setStockBatchItems([]);
      try {
        if (currentScreen === "dashboard") {
          setDashboard(await request("/api/dashboard"));
        } else if (currentScreen === "products") {
          setData((await request("/api/products")).products);
        } else if (currentScreen === "calculator") {
          setData((await request("/api/products")).products);
        } else if (currentScreen === "history") {
          const filter = options.historyFilter || { period: "month", date: dateInputValue() };
          const params = new URLSearchParams({
            period: filter.period,
            date: filter.date,
            page: String(options.historyPage || 1),
          });
          if (options.query?.trim()) params.set("q", options.query.trim());
          const result = await request(`/api/sales?${params.toString()}`);
          if (historyRequestId === historyRequestIdRef.current) {
            setData(result.sales);
            setHistoryTotal(result.total);
            setHistoryPage(result.page);
          }
        } else if (currentScreen === "expenses") {
          setExpenseDate(dateInputValue());
          setData((await request("/api/expenses")).expenses);
        } else if (currentScreen === "reports") {
          const date = dateInputValue();
          setReportFilter({ period: "month", date });
          setReport(await request(`/api/reports?period=month&date=${date}`));
          setReportDetail(null);
        } else if (currentScreen === "prices") {
          setData((await request("/api/price-history")).history);
        } else if (currentScreen === "stock") {
          const stockData = await request("/api/stock-opname");
          setData(stockData.records);
          setStockProducts(stockData.products);
          setStockProductId("");
          setStockBatchItems([]);
        } else if (currentScreen === "expiry") {
          const [expiryData, productData] = await Promise.all([
            request("/api/expiry"),
            request("/api/products"),
          ]);
          setData(expiryData.batches);
          setStockProducts(productData.products);
        } else if (currentScreen === "users") {
          setData((await request("/api/users")).users);
        } else if (currentScreen === "sales") {
          setSalesPage(1);
          setData((await request("/api/products?untukPenjualan=true")).products);
        }
      } catch (error) {
        if (historyRequestId === null || historyRequestId === historyRequestIdRef.current) {
          flash(error.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [flash]
  );

  useEffect(() => {
    request("/api/auth/session")
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        const defaultHistoryFilter = { period: "month", date: dateInputValue() };
        setHistoryFilter(defaultHistoryFilter);
        setAppliedHistoryFilter(defaultHistoryFilter);
        return loadScreen("dashboard");
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [loadScreen]);

  const filtered = useMemo(() => {
    let result = data;
    if (screen === "products" && summaryDetail === "lowStock") {
      result = result.filter((item) => item.stok <= item.stokMinimum);
    } else if (screen === "history" && summaryDetail === "todayRevenue") {
      const today = dateInputValue();
      result = result.filter((item) => dateInputValue(new Date(item.tanggal)) === today);
    } else if (screen === "expiry" && summaryDetail === "expiring") {
      result = result.filter((item) => item.status !== "KEDALUWARSA");
    }

    const term = query.trim().toLocaleLowerCase("id-ID");
    if (!term) return result;
    return result.filter((item) =>
      JSON.stringify(item).toLocaleLowerCase("id-ID").includes(term)
    );
  }, [data, query, screen, summaryDetail]);

  const salesPageCount = Math.max(1, Math.ceil(filtered.length / SALES_PAGE_SIZE));
  const activeSalesPage = Math.min(salesPage, salesPageCount);
  const salesPageStart = (activeSalesPage - 1) * SALES_PAGE_SIZE;
  const salesPageProducts = filtered.slice(salesPageStart, salesPageStart + SALES_PAGE_SIZE);
  const historyPageCount = Math.max(1, Math.ceil(historyTotal / SALES_PAGE_SIZE));

  function openSummaryDetail(detail) {
    const targetScreen =
      detail === "todayRevenue" ? "history" : detail === "expiring" ? "expiry" : "products";
    const todayFilter = { period: "day", date: dateInputValue() };
    setSummaryDetail(detail);
    setQuery("");
    setScreen(targetScreen);
    setMobileNavOpen(false);
    if (targetScreen === "history") {
      setHistoryFilter(todayFilter);
      setAppliedHistoryFilter(todayFilter);
      setHistoryPage(1);
      loadScreen(targetScreen, { historyFilter: todayFilter, historyPage: 1, query: "" });
    } else {
      loadScreen(targetScreen);
    }
  }

  function applyHistoryFilter(event) {
    event.preventDefault();
    setAppliedHistoryFilter(historyFilter);
    setSummaryDetail(null);
    setQuery("");
    setHistoryPage(1);
    loadScreen("history", { historyFilter, historyPage: 1, query: "" });
  }

  function selectInventoryTab(tab) {
    setSummaryDetail(null);
    setQuery("");
    setScreen(tab);
    setMobileNavOpen(false);
    loadScreen(tab);
  }

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { user: currentUser } = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      setUser(currentUser);
      const defaultHistoryFilter = { period: "month", date: dateInputValue() };
      setHistoryFilter(defaultHistoryFilter);
      setAppliedHistoryFilter(defaultHistoryFilter);
      setSummaryDetail(null);
      setScreen("dashboard");
      await loadScreen("dashboard");
      flash(`Selamat datang, ${currentUser.nama}.`);
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
      setUser(null);
      setData([]);
      setCart([]);
      setDashboard(null);
    } catch (error) {
      flash(error.message);
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      await request("/api/products", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      form.reset();
      flash("Obat berhasil ditambahkan.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveStocktake(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!stockProductId || !stockBatchItems.length) {
      flash("Pilih obat dan cantumkan setidaknya satu batch fisik.");
      return;
    }
    setBusy(true);
    try {
      await request("/api/stock-opname", {
        method: "POST",
        body: JSON.stringify({
          produkId: stockProductId,
          alasan: new FormData(form).get("alasan"),
          items: stockBatchItems,
        }),
      });
      form.reset();
      setStockProductId("");
      setStockBatchItems([]);
      flash("Stock opname tersimpan dan stok diperbarui.");
      await loadScreen("stock");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function receiveBatch(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      try {
        await request("/api/expiry", { method: "POST", body: JSON.stringify(body) });
      } catch (error) {
        if (error.payload?.code !== "BATCH_EXPIRY_OVERLAP") throw error;
        const detail = error.payload.overlaps
          .map((batch) => `${batch.nomorBatch} (${batch.jumlah} unit)`)
          .join(", ");
        if (!window.confirm(`${error.message}\nBatch terkait: ${detail}\nLanjutkan penerimaan?`))
          return;
        await request("/api/expiry", {
          method: "POST",
          body: JSON.stringify({ ...body, konfirmasiOverlap: true }),
        });
      }
      form.reset();
      flash("Batch diterima dan stok bertambah.");
      await loadScreen("expiry");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      await request("/api/users", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      form.reset();
      setShowCreatePassword(false);
      flash("Pengguna berhasil dibuat.");
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createExpense(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      await request("/api/expenses", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      form.reset();
      flash("Biaya operasional berhasil dicatat.");
      await loadScreen("expenses");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteExpense(expense) {
    if (!window.confirm(`Hapus biaya "${expense.deskripsi}"?`)) return;
    try {
      await request(`/api/expenses/${expense.id}`, { method: "DELETE" });
      flash("Biaya operasional berhasil dihapus.");
      await loadScreen("expenses");
    } catch (error) {
      flash(error.message);
    }
  }

  async function archiveSale(sale) {
    if (!window.confirm(`Sembunyikan transaksi ${sale.kodeTransaksi} dari riwayat? Transaksi tetap memengaruhi stok dan laporan.`)) return;
    setBusy(true);
    try {
      await request(`/api/sales/${sale.id}`, { method: "DELETE" });
      flash("Transaksi disembunyikan dari riwayat. Stok dan laporan tidak berubah.");
      await loadScreen("history");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshReport(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const params = new URLSearchParams(reportFilter);
      setReport(await request(`/api/reports?${params}`));
      setReportDetail(null);
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function downloadBackup() {
    setBusy(true);
    try {
      await downloadFile(
        "/api/backup",
        `apotekrisa-backup-${dateInputValue()}.json`,
        "Unduhan backup gagal."
      );
      flash("Backup berhasil diunduh. Simpan file dengan aman.");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function restoreBackup(event) {
    event.preventDefault();
    if (!backupFile || backupFile.size > 25 * 1024 * 1024) {
      flash("Pilih file backup JSON dengan ukuran maksimal 25 MB.");
      return;
    }
    if (restoreConfirmation !== "RESTORE") {
      flash("Ketik RESTORE untuk mengonfirmasi penggantian seluruh data.");
      return;
    }
    if (
      !window.confirm(
        "Restore akan mengganti seluruh data saat ini. Pastikan Anda memiliki backup terbaru. Lanjutkan?"
      )
    )
      return;
    setBusy(true);
    try {
      let backup;
      try {
        backup = JSON.parse(await backupFile.text());
      } catch {
        throw new Error("File backup bukan JSON yang valid.");
      }
      await request("/api/backup", {
        method: "POST",
        body: JSON.stringify({ ...backup, confirmation: "RESTORE" }),
      });
      await request("/api/auth/logout", { method: "POST" });
      setUser(null);
      setData([]);
      setCart([]);
      setBackupFile(null);
      setRestoreConfirmation("");
      flash("Restore berhasil. Silakan masuk kembali.");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function exportProductsExcel() {
    setBusy(true);
    try {
      await downloadFile("/api/products/export", "produk.xlsx", "Ekspor produk gagal.");
      flash("Ekspor produk berhasil diunduh.");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  function selectExcelFiles(files) {
    if (!files?.length) return;
    setExcelPreview(null);
    if (files.length !== 1 || !files[0].name.toLowerCase().endsWith(".xlsx")) {
      setExcelFile(null);
      flash("Pilih tepat satu file dengan format .xlsx.");
      return;
    }
    setExcelFile(files[0]);
  }

  function dropExcelFile(event) {
    event.preventDefault();
    setExcelDropActive(false);
    selectExcelFiles(event.dataTransfer.files);
  }

  async function previewProductsExcel(event) {
    event.preventDefault();
    if (!excelFile || excelFile.size > 5 * 1024 * 1024) {
      flash("Pilih file .xlsx dengan ukuran maksimal 5 MB.");
      return;
    }
    const formData = new FormData();
    formData.set("file", excelFile);
    formData.set("mode", "preview");
    setBusy(true);
    try {
      setExcelPreview(await request("/api/products/import", { method: "POST", body: formData }));
    } catch (error) {
      if (error.payload?.rows) setExcelPreview(error.payload);
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function commitProductsExcel() {
    if (!excelFile || !excelPreview || excelPreview.counts?.errors) return;
    const formData = new FormData();
    formData.set("file", excelFile);
    formData.set("mode", "commit");
    setBusy(true);
    try {
      const result = await request("/api/products/import", { method: "POST", body: formData });
      setExcelPreview(result);
      setExcelFile(null);
      flash(
        `${result.counts.create} produk ditambahkan, ${result.counts.update} diperbarui, dan ${result.stockAdjustments} perubahan stok tercatat.`
      );
    } catch (error) {
      if (error.payload?.rows) setExcelPreview(error.payload);
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProductEdit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      await request(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      setEditingProduct(null);
      flash("Perubahan produk berhasil disimpan.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSuggestedPrice() {
    if (!priceDraft) return;
    setBusy(true);
    try {
      await request("/api/pricing", {
        method: "POST",
        body: JSON.stringify({ ...priceDraft, simpan: true }),
      });
      setPriceResult(null);
      setPriceDraft(null);
      setPriceError("");
      flash("Kalkulasi disimpan dan harga jual produk diperbarui.");
      await loadScreen("calculator");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  const pricingCategories = useMemo(() => {
    if (!Array.isArray(data)) return ["all"];
    const cats = new Set(data.map((p) => p.kategori?.nama).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [data]);

  const bulkAvailableProducts = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let list = data;
    if (bulkCategoryFilter !== "all") {
      list = list.filter((p) => p.kategori?.nama === bulkCategoryFilter);
    }
    if (bulkSearchQuery.trim()) {
      const q = bulkSearchQuery.trim().toLowerCase();
      list = list.filter((p) =>
        (p.namaProduk && p.namaProduk.toLowerCase().includes(q)) ||
        (p.kodeBarang && p.kodeBarang.toLowerCase().includes(q))
      );
    }
    return list;
  }, [data, bulkCategoryFilter, bulkSearchQuery]);

  const bulkCalculations = useMemo(() => {
    if (priceMode !== "bulk" || !selectedBulkProductIds.length || !Array.isArray(data)) return [];
    return selectedBulkProductIds
      .map((id) => {
        const product = data.find((p) => p.id === id);
        if (!product) return null;
        const cost = getCalculatorHpp(product);
        try {
          const calc = calculatePrice({
            hpp: cost.value,
            persenBiayaAdmin: priceForm.persenBiayaAdmin,
            persenPajak: priceForm.persenPajak,
            biayaPengemasan: priceForm.biayaPengemasan,
            biayaLayanan: priceForm.biayaLayanan,
            biayaGratisOngkir: priceForm.biayaGratisOngkir,
            persenTargetLaba: priceForm.persenTargetLaba,
          });
          return { product, cost, calc, error: null };
        } catch (err) {
          return { product, cost, calc: null, error: err instanceof Error ? err.message : "Gagal" };
        }
      })
      .filter(Boolean);
  }, [priceMode, selectedBulkProductIds, data, priceForm]);

  async function saveBulkSuggestedPrices() {
    const validItems = bulkCalculations.filter((item) => item.calc);
    if (!validItems.length) return;
    setBusy(true);
    try {
      const payload = {
        bulk: true,
        simpan: true,
        simpanHpp: bulkSimpanHpp,
        parameters: {
          persenBiayaAdmin: priceForm.persenBiayaAdmin,
          persenPajak: priceForm.persenPajak,
          biayaPengemasan: priceForm.biayaPengemasan,
          biayaLayanan: priceForm.biayaLayanan,
          biayaGratisOngkir: priceForm.biayaGratisOngkir,
          persenTargetLaba: priceForm.persenTargetLaba,
        },
        items: validItems.map((item) => ({
          produkId: item.product.id,
          hpp: item.cost.value,
        })),
      };
      const res = await request("/api/pricing", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      flash(`Berhasil memperbarui harga jual untuk ${res.count || validItems.length} produk.`);
      setSelectedBulkProductIds([]);
      await loadScreen("calculator");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  function changePriceInput(event) {
    const { name, value } = event.target;
    let nextForm;
    if (name === "hpp") {
      nextForm = { ...priceForm, hpp: value, hppSumber: "manual" };
    } else if (name === "produkId") {
      const product = data.find((item) => item.id === Number(value));
      const cost = getCalculatorHpp(product);
      nextForm = { ...priceForm, produkId: value, hpp: String(cost.value), hppSumber: cost.source };
    } else {
      nextForm = { ...priceForm, [name]: value };
    }
    setPriceForm(nextForm);
    recalculatePrice(nextForm);
  }

  function openCashierEditor(cashier, mode) {
    setUserEditor({ id: cashier.id, mode, nama: cashier.nama, username: cashier.username });
    setShowEditorPassword(false);
  }

  async function saveCashier(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const body =
      userEditor.mode === "edit"
        ? { nama: values.nama, username: values.username }
        : userEditor.mode === "owner-name"
        ? { nama: values.nama }
        : { password: values.password };
    setBusy(true);
    try {
      await request(`/api/users/${userEditor.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (userEditor.mode === "owner-name")
        setUser((current) => ({ ...current, nama: values.nama.trim() }));
      setUserEditor(null);
      setShowEditorPassword(false);
      const message =
        userEditor.mode === "edit"
          ? "Data pengguna diperbarui."
          : userEditor.mode === "owner-name"
          ? "Nama pemilik diperbarui."
          : "Kata sandi pengguna diperbarui.";
      flash(message);
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleCashier(cashier) {
    const aktif = !cashier.aktif;
    const message = aktif ? "Aktifkan kembali akun ini?" : "Nonaktifkan akun ini?";
    if (!window.confirm(message)) return;
    try {
      await request(`/api/users/${cashier.id}`, {
        method: "PATCH",
        body: JSON.stringify({ aktif }),
      });
      flash(aktif ? "Akun kasir diaktifkan." : "Akun kasir diarsipkan.");
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    }
  }

  async function deleteCashier(cashier) {
    if (
      !window.confirm(
        `Hapus permanen akun ${cashier.nama}? Akun dengan riwayat aktivitas hanya dapat diarsipkan.`
      )
    )
      return;
    try {
      await request(`/api/users/${cashier.id}`, { method: "DELETE" });
      flash("Akun pengguna berhasil dihapus.");
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    }
  }

  async function checkout() {
    setBusy(true);
    try {
      const { sale } = await request("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          ...saleSettings,
          items: cart.map(({ id, quantity }) => ({ produkId: id, jumlah: quantity })),
        }),
      });
      setReceiptSale(sale);
      setCart([]);
      setSaleSettings({
        jenis: "OFFLINE",
        potongan: "0",
        persenBiayaAdmin: "0",
        persenPajak: "0",
        biayaPengemasan: "0",
        biayaLayanan: "0",
        biayaGratisOngkir: "0",
      });
      flash("Transaksi berhasil. Stok sudah diperbarui.");
      const currentMonthFilter = { period: "month", date: dateInputValue() };
      setHistoryFilter(currentMonthFilter);
      setAppliedHistoryFilter(currentMonthFilter);
      setHistoryPage(1);
      setQuery("");
      setSummaryDetail(null);
      setScreen("history");
      await loadScreen("history", {
        historyFilter: currentMonthFilter,
        historyPage: 1,
        query: "",
      });
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  function changeSaleSetting(event) {
    const { name, value } = event.target;
    setSaleSettings((current) => ({ ...current, [name]: value }));
  }

  async function archiveProduct(productId) {
    if (!window.confirm("Arsipkan obat ini? Obat tidak akan bisa dipilih untuk transaksi baru."))
      return;
    try {
      await request(`/api/products/${productId}`, { method: "DELETE" });
      flash("Obat berhasil diarsipkan.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    }
  }

  async function changePrice(product) {
    const value = window.prompt(
      `Harga jual baru untuk ${product.namaProduk}:`,
      String(product.hargaJual)
    );
    if (value === null) return;
    const hargaJual = Number(value);
    if (!Number.isFinite(hargaJual) || hargaJual < 0) {
      flash("Masukkan harga jual berupa angka nol atau lebih.");
      return;
    }
    try {
      await request(`/api/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ hargaJual }),
      });
      flash("Harga diperbarui dan dicatat ke riwayat.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    }
  }

  // Loading Screen
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-500">
        <div className="w-9 h-9 border-3 border-[#5936A8]/20 border-t-[#5936A8] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold tracking-wide text-slate-600">Memuat Apotek Risa...</p>
      </div>
    );
  }

  // Login Screen (Refined Professional SaaS Card)
  if (!user) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] bg-white rounded-2xl p-8 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-200"
        >
          <div className="flex items-center gap-3.5 mb-7">
            <div className="w-11 h-11 rounded-xl bg-[#320080] border border-[#320080] flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/apotek.jpg" alt="Logo Apotek Risa" width={34} height={34} className="object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">Apotek Risa</h1>
              <p className="text-xs text-slate-500 font-medium">Sistem Informasi Manajemen Apotek</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500 mt-1">Gunakan akun yang telah didaftarkan pemilik apotek.</p>
          </div>

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                name="username"
                autoComplete="username"
                required
                placeholder="Masukkan username"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5936A8] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan kata sandi"
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5936A8] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showLoginPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-2.5 px-4 bg-[#5936A8] hover:bg-[#472985] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memeriksa kredensial...</span>
                </>
              ) : (
                "Masuk ke Sistem"
              )}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>© Apotek Risa</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sistem Online
            </span>
          </div>
        </motion.div>

        {notice && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg flex items-center gap-2">
            <span>{notice}</span>
          </div>
        )}
      </main>
    );
  }

  // Dashboard Shell
  const allItems = menuGroups.flatMap((g) => g.items);
  const activeItem = allItems.find((i) => i.id === screen);
  const summaryDetailTitles = {
    todayRevenue: "Omzet Hari Ini",
    activeProducts: "Katalog Obat Aktif",
    lowStock: "Stok Menipis",
    expiring: "Batch Kedaluwarsa ≤ 6 Bulan",
  };
  const heading =
    summaryDetailTitles[summaryDetail] ||
    (screen === "expiry" ? "Kedaluwarsa Obat" : activeItem?.label || "Ringkasan");

  const selectedPriceProduct = data.find((item) => item.id === Number(priceForm.produkId));
  const priceSourceNote =
    priceForm.hppSumber === "hargaBeli"
      ? "HPP produk masih 0; kalkulasi memakai harga beli database. HPP database tidak diubah saat simpan."
      : priceForm.hppSumber === "manual"
      ? "HPP yang dimasukkan manual akan disimpan ke produk."
      : "HPP diambil dari database.";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar - Clean Pure White with Purple Active Pill */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-[#E2E8F0] z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-[#F1F5F9]">
          <button
            onClick={() => {
              setSummaryDetail(null);
              setScreen("dashboard");
              loadScreen("dashboard");
              setMobileNavOpen(false);
            }}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#320080] border border-[#320080] flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/apotek.jpg" alt="Logo" width={28} height={28} className="object-cover" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight block">Apotek Risa</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Sistem Apotek
              </span>
            </div>
          </button>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menus with Original Titles and Grouping */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {menuGroups.map((group) => {
            const accessibleItems = group.items.filter((item) => !item.role || item.role === user.role);
            if (!accessibleItems.length) return null;

            return (
              <div key={group.title}>
                <p className="px-3 text-[10px] font-bold text-[#806EAA] tracking-wider uppercase mb-2">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {accessibleItems.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected =
                      screen === item.id || (item.id === "products" && screen === "expiry");

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSummaryDetail(null);
                          setReportDetail(null);
                          setQuery("");
                          setScreen(item.id);
                          setMobileNavOpen(false);
                          if (item.id === "history") {
                            setHistoryFilter(appliedHistoryFilter);
                            setHistoryPage(1);
                            loadScreen(item.id, {
                              historyFilter: appliedHistoryFilter,
                              historyPage: 1,
                              query: "",
                            });
                          } else {
                            loadScreen(item.id);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-[#320080] text-white shadow-xs"
                            : "text-slate-600 hover:text-[#320080] hover:bg-[#F4F0FF]"
                        }`}
                      >
                        <IconComponent
                          size={17}
                          className={isSelected ? "text-[#FFE000]" : "text-[#8D7AAE]"}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Database Connection Pill */}
        <div className="p-4 border-t border-[#F1F5F9]">
          <div className="px-3 py-2 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center gap-2 text-[11px] font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database Terhubung</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-18 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3.5 flex-1 max-w-xl">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
              aria-label="Buka navigasi"
            >
              <Menu size={20} />
            </button>

            {/* Clean Global Search Input */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari obat, transaksi, atau nomor batch..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#5936A8] focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-xs font-bold text-[#5936A8] uppercase">
                {user.nama.slice(0, 1)}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight">{user.nama}</span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {user.role === "PEMILIK" ? "Pemilik Apotek" : "Kasir"}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors ml-1"
                title="Keluar dari akun"
                aria-label="Keluar"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Title with Subtitle & Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{heading}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {summaryDetail
                  ? "Detail data ringkasan operasional apotek."
                  : screen === "dashboard"
                  ? "Pantau performa penjualan, kondisi persediaan, dan transaksi apotek secara real-time."
                  : `Kelola ${heading.toLocaleLowerCase("id-ID")} dengan data akurat dari database.`}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
                <Calendar size={13} className="text-[#5936A8]" />
                <span>
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date())}
                </span>
              </div>
            </div>
          </div>

          {/* SCREEN ROUTING */}
          <AnimatePresence mode="wait">
            <motion.div
              key={screen + (summaryDetail || "")}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              {screen === "dashboard" && (
                <DashboardView
                  dashboard={dashboard}
                  money={money}
                  date={date}
                  onMetricClick={openSummaryDetail}
                  onGoToSales={() => {
                    setScreen("sales");
                    loadScreen("sales");
                  }}
                  onReceipt={setReceiptSale}
                />
              )}

              {screen === "products" && (
                <div className="space-y-6">
                  <InventoryTabs activeTab="products" onSelect={selectInventoryTab} />

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
                      <form onSubmit={createProduct} className="space-y-4">
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
                      ref={editProductFormRef}
                      variants={itemVariants}
                      className="bg-purple-50/50 border border-purple-200 rounded-2xl p-6 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-purple-100">
                        <div>
                          <h2 className="text-sm font-bold text-purple-900">Ubah Data Obat</h2>
                          <p className="text-xs text-purple-700">{editingProduct.namaProduk}</p>
                        </div>
                      </div>
                      <form onSubmit={saveProductEdit} className="space-y-4">
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
                            onClick={() => setEditingProduct(null)}
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
                        <TableSearch value={query} onChange={setQuery} placeholder="Cari nama atau kode obat..." />
                      </div>
                    </div>

                    <ProductsTable
                      products={filtered}
                      money={money}
                      onArchive={archiveProduct}
                      onPriceChange={changePrice}
                      onEdit={setEditingProduct}
                      owner={user.role === "PEMILIK"}
                    />
                  </motion.div>
                </div>
              )}

              {screen === "calculator" && user.role === "PEMILIK" && (
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
              )}

              {screen === "sales" && (
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
                          onChange={(value) => {
                            setQuery(value);
                            setSalesPage(1);
                          }}
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
                          Menampilkan {salesPageStart + 1}–{Math.min(salesPageStart + SALES_PAGE_SIZE, filtered.length)} dari {filtered.length} obat
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
                            <span className="text-[11px] text-slate-400">
                              {money(item.product.hargaJual)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                              <button
                                onClick={() =>
                                  setCart((items) =>
                                    items
                                      .map((e) => (e.id === item.id ? { ...e, quantity: e.quantity - 1 } : e))
                                      .filter((e) => e.quantity > 0)
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
                                    items.map((e) =>
                                      e.id === item.id
                                        ? { ...e, quantity: Math.min(e.quantity + 1, e.product.stok) }
                                        : e
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
              )}

              {screen === "history" && (
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {summaryDetail === "todayRevenue" ? "Transaksi Hari Ini" : "Riwayat Semua Transaksi"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {summaryDetail === "todayRevenue"
                          ? `${historyTotal} transaksi · Total omzet ${money(dashboard?.todayRevenue)}`
                          : `${historyTotal} transaksi ditemukan pada periode ini.`}
                      </p>
                    </div>
                    <div className="w-full sm:w-64">
                      <TableSearch
                        value={query}
                        onChange={(value) => {
                          setQuery(value);
                          setHistoryPage(1);
                          loadScreen("history", {
                            historyFilter: appliedHistoryFilter,
                            historyPage: 1,
                            query: value,
                          });
                        }}
                        placeholder="Cari transaksi, obat, atau kasir..."
                      />
                    </div>
                  </div>

                  <form
                    onSubmit={applyHistoryFilter}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] items-end gap-3 rounded-xl bg-slate-50 p-4"
                  >
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="history-period">
                        Tampilkan berdasarkan
                      </label>
                      <select
                        id="history-period"
                        value={historyFilter.period}
                        onChange={(event) =>
                          setHistoryFilter((current) => ({ ...current, period: event.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800"
                      >
                        <option value="day">Tanggal</option>
                        <option value="month">Bulan</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="history-date">
                        {historyFilter.period === "day" ? "Pilih tanggal" : "Pilih bulan"}
                      </label>
                      <input
                        id="history-date"
                        type={historyFilter.period === "day" ? "date" : "month"}
                        value={
                          historyFilter.period === "month"
                            ? historyFilter.date.slice(0, 7)
                            : historyFilter.date
                        }
                        onChange={(event) =>
                          setHistoryFilter((current) => ({
                            ...current,
                            date:
                              current.period === "month"
                                ? event.target.value
                                  ? `${event.target.value}-01`
                                  : ""
                                : event.target.value,
                          }))
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5936A8] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#472985]"
                    >
                      <Search size={14} />
                      Tampilkan
                    </button>
                  </form>

                  <SalesTable sales={filtered} money={money} date={date} onReceipt={setReceiptSale} />
                  {historyTotal > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[11px] text-slate-500">
                        Menampilkan {(historyPage - 1) * SALES_PAGE_SIZE + 1}–
                        {Math.min(historyPage * SALES_PAGE_SIZE, historyTotal)} dari {historyTotal} transaksi
                      </span>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <button
                          type="button"
                          disabled={historyPage <= 1}
                          onClick={() => {
                            const nextPage = historyPage - 1;
                            setHistoryPage(nextPage);
                            loadScreen("history", {
                              historyFilter: appliedHistoryFilter,
                              historyPage: nextPage,
                              query,
                            });
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Sebelumnya
                        </button>
                        <span className="min-w-[88px] text-center text-[11px] font-medium text-slate-600">
                          Halaman {historyPage} / {historyPageCount}
                        </span>
                        <button
                          type="button"
                          disabled={historyPage >= historyPageCount}
                          onClick={() => {
                            const nextPage = historyPage + 1;
                            setHistoryPage(nextPage);
                            loadScreen("history", {
                              historyFilter: appliedHistoryFilter,
                              historyPage: nextPage,
                              query,
                            });
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {screen === "expenses" && user.role === "PEMILIK" && (
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
              )}

              {screen === "reports" && user.role === "PEMILIK" && (
                <div className="space-y-6">
                  {/* Filter Form */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs"
                  >
                    <form onSubmit={refreshReport} className="flex flex-col sm:flex-row sm:items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Periode Laporan</label>
                        <select
                          value={reportFilter.period}
                          onChange={(e) => setReportFilter((c) => ({ ...c, period: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        >
                          <option value="day">Harian</option>
                          <option value="month">Bulanan</option>
                          <option value="year">Tahunan</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Acuan</label>
                        <input
                          type="date"
                          value={reportFilter.date}
                          onChange={(e) => setReportFilter((c) => ({ ...c, date: e.target.value }))}
                          required
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-5 py-2 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
                        <span>Tampilkan Laporan</span>
                      </button>
                    </form>
                  </motion.div>

                  {/* Financial Metrics Cards */}
                  {report && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <MetricCard
                          title="Omzet Penjualan"
                          value={money(report.omzet)}
                          note={`${report.jumlahTransaksi} transaksi`}
                          icon={DollarSign}
                          selected={reportDetail === "omzet"}
                          onClick={() => setReportDetail((c) => (c === "omzet" ? null : "omzet"))}
                        />
                        <MetricCard
                          title="Jumlah Kunjungan"
                          value={report.jumlahKunjungan}
                          note="Sesuai transaksi"
                          icon={Users}
                          selected={reportDetail === "jumlahKunjungan"}
                          onClick={() => setReportDetail((c) => (c === "jumlahKunjungan" ? null : "jumlahKunjungan"))}
                        />
                        <MetricCard
                          title="Laba Kotor"
                          value={money(report.labaKotor)}
                          note="Harga jual - HPP"
                          icon={ArrowUpRight}
                          selected={reportDetail === "labaKotor"}
                          onClick={() => setReportDetail((c) => (c === "labaKotor" ? null : "labaKotor"))}
                        />
                        <MetricCard
                          title="Biaya Operasional"
                          value={money(report.biayaOperasional)}
                          note="Pada periode terpilih"
                          icon={TrendingDown}
                          warning
                          selected={reportDetail === "biayaOperasional"}
                          onClick={() => setReportDetail((c) => (c === "biayaOperasional" ? null : "biayaOperasional"))}
                        />
                        <MetricCard
                          title="Laba Bersih"
                          value={money(report.labaBersih)}
                          note="Setelah biaya & pajak"
                          icon={Sparkles}
                          selected={reportDetail === "labaBersih"}
                          onClick={() => setReportDetail((c) => (c === "labaBersih" ? null : "labaBersih"))}
                        />
                      </div>

                      {/* Detail Table */}
                      <motion.div
                        variants={itemVariants}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
                      >
                        {reportDetail ? (
                          <>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                  Rincian {reportMetricLabels[reportDetail]}
                                </h2>
                                <p className="text-xs text-slate-500">Nilai untuk setiap sub-periode laporan.</p>
                              </div>
                              <button
                                onClick={() => setReportDetail(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <ReportMetricTable rows={report.data} metric={reportDetail} money={money} />
                          </>
                        ) : (
                          <>
                            <div className="border-b border-slate-100 pb-3">
                              <h2 className="text-sm font-bold text-slate-900">Rincian Per Periode</h2>
                              <p className="text-xs text-slate-500">Rekapitulasi lengkap omzet, biaya, dan laba.</p>
                            </div>
                            <ReportTable rows={report.data} money={money} />
                          </>
                        )}
                      </motion.div>
                    </>
                  )}
                </div>
              )}

              {screen === "excel" && user.role === "PEMILIK" && (
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
              )}

              {screen === "prices" && user.role === "PEMILIK" && (
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
              )}

              {screen === "stock" && user.role === "PEMILIK" && (
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
              )}

              {screen === "expiry" && (
                <div className="space-y-6">
                  <InventoryTabs activeTab="expiry" onSelect={selectInventoryTab} />

                  {/* Receive Batch Form */}
                  {user.role === "PEMILIK" && !summaryDetail && (
                    <motion.div
                      variants={itemVariants}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
                    >
                      <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-sm font-bold text-slate-900">Terima Barang Masuk / Batch Baru</h2>
                        <p className="text-xs text-slate-500">
                          Catat nomor batch dan tanggal kedaluwarsa fisik obat yang diterima dari distributor.
                        </p>
                      </div>
                      <form onSubmit={receiveBatch} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Obat</label>
                            <select
                              name="produkId"
                              required
                              defaultValue=""
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                            >
                              <option value="" disabled>Pilih obat dari katalog</option>
                              {stockProducts.map((p) => (
                                <option value={p.id} key={p.id}>
                                  {p.namaProduk}
                                </option>
                              ))}
                            </select>
                          </div>
                          <InputField name="nomorBatch" label="Nomor Batch" required />
                          <InputField name="tanggalKedaluwarsa" label="Tanggal Kedaluwarsa" type="date" required />
                          <InputField name="jumlah" label="Jumlah Unit Diterima" type="number" min="1" required />
                          <InputField name="hargaBeli" label="Harga Beli Terbaru (Opsional)" type="number" min="0" step="0.01" />
                          <InputField name="hpp" label="HPP Terbaru (Opsional)" type="number" min="0" step="0.01" />
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={busy}
                            className="px-5 py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            <Plus size={15} />
                            <span>Simpan Barang Masuk</span>
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Expiry Table */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Monitoring Batch & Batas Retur</h2>
                        <p className="text-xs text-slate-500">{filtered.length} batch dalam pemantauan sistem.</p>
                      </div>
                      <div className="w-full sm:w-60">
                        <TableSearch value={query} onChange={setQuery} placeholder="Cari nama atau batch..." />
                      </div>
                    </div>
                    <ExpiryTable batches={filtered} date={date} />
                  </motion.div>
                </div>
              )}

              {screen === "backup" && user.role === "PEMILIK" && (
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
              )}

              {screen === "users" && user.role === "PEMILIK" && (
                <div className="space-y-6">
                  {/* Create Cashier Form */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
                  >
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-sm font-bold text-slate-900">Tambah Akun Kasir Baru</h2>
                      <p className="text-xs text-slate-500">
                        Buat akun login kasir untuk melayani transaksi di kasir Apotek Risa.
                      </p>
                    </div>
                    <form onSubmit={createUser} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField name="nama" label="Nama Lengkap Kasir" required />
                        <InputField
                          name="username"
                          label="Username"
                          minLength={3}
                          maxLength={50}
                          pattern="[a-zA-Z0-9._-]+"
                          required
                        />
                        <PasswordField
                          name="password"
                          label={`Kata Sandi (min. ${MIN_PASSWORD_LENGTH} karakter)`}
                          minLength={MIN_PASSWORD_LENGTH}
                          required
                          show={showCreatePassword}
                          onToggle={() => setShowCreatePassword((v) => !v)}
                        />
                        <input type="hidden" name="role" value="KASIR" />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={busy}
                          className="px-5 py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <Plus size={15} />
                          <span>Buat Akun Kasir</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>

                  {/* User Editor Modal */}
                  {userEditor && (
                    <motion.div
                      variants={itemVariants}
                      className="bg-purple-50/70 border border-purple-200 rounded-2xl p-6 shadow-xs space-y-4"
                    >
                      <div className="border-b border-purple-100 pb-3">
                        <h2 className="text-sm font-bold text-purple-900">
                          {userEditor.mode === "edit"
                            ? "Edit Profil Kasir"
                            : userEditor.mode === "owner-name"
                            ? "Ubah Nama Pemilik"
                            : "Ubah Kata Sandi"}
                        </h2>
                      </div>
                      <form onSubmit={saveCashier} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userEditor.mode === "edit" ? (
                            <>
                              <InputField name="nama" label="Nama Lengkap" defaultValue={userEditor.nama} required />
                              <InputField
                                name="username"
                                label="Username"
                                defaultValue={userEditor.username}
                                minLength={3}
                                maxLength={50}
                                pattern="[a-zA-Z0-9._-]+"
                                required
                              />
                            </>
                          ) : userEditor.mode === "owner-name" ? (
                            <InputField name="nama" label="Nama Pemilik" defaultValue={userEditor.nama} required />
                          ) : (
                            <PasswordField
                              name="password"
                              label={`Kata Sandi Baru (min. ${MIN_PASSWORD_LENGTH} karakter)`}
                              minLength={MIN_PASSWORD_LENGTH}
                              required
                              show={showEditorPassword}
                              onToggle={() => setShowEditorPassword((v) => !v)}
                            />
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setUserEditor(null)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={busy}
                            className="px-5 py-2 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                          >
                            Simpan Perubahan
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Users Table */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Daftar Pengguna Sistem</h2>
                        <p className="text-xs text-slate-500">{filtered.length} pengguna terdaftar.</p>
                      </div>
                      <div className="w-full sm:w-60">
                        <TableSearch value={query} onChange={setQuery} placeholder="Cari nama atau username..." />
                      </div>
                    </div>
                    <UsersTable
                      users={filtered}
                      ownerId={user.id}
                      onEdit={openCashierEditor}
                      onToggle={toggleCashier}
                      onDelete={deleteCashier}
                    />
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Printable Thermal Receipt Modal */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          onPrint={() => window.print()}
          onClose={() => setReceiptSale(null)}
        />
      )}

      {/* Floating Notice Toast */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 border border-slate-800">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------
// REAL DASHBOARD VIEW (NO FAKE CHARTS / NO AI SLOP)
// -------------------------------------------------------------------------
function DashboardView({ dashboard, money: formatMoney, date: formatDate, onMetricClick, onGoToSales, onReceipt }) {
  if (!dashboard) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-[#5936A8] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Memuat data ringkasan dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Real Metric Cards with Framer Motion hover & enter animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("todayRevenue")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-[#8B6AD9] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Hari Ini
              </span>
              <span className="text-slate-300 group-hover:text-[#5936A8] transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center mb-3">
              <TrendingDown className="rotate-180" size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Omzet Penjualan</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {formatMoney(dashboard.todayRevenue)}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>{dashboard.todayTransactions} Transaksi berhasil</span>
            <span className="text-[#5936A8] font-bold group-hover:underline">Detail →</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("activeProducts")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-[#8B6AD9] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Katalog
              </span>
              <span className="text-slate-300 group-hover:text-[#5936A8] transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-3">
              <Package size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Obat Aktif Terdaftar</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {dashboard.productCount} <span className="text-sm font-normal text-slate-400">Obat</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Siap dijual di kasir</span>
            <span className="text-[#5936A8] font-bold group-hover:underline">Buka katalog →</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("lowStock")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-amber-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                Perlu Restock
              </span>
              <span className="text-slate-300 group-hover:text-amber-600 transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <AlertTriangle size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Stok Menipis</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {dashboard.lowStockCount} <span className="text-sm font-normal text-slate-400">Item</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Di bawah stok minimum</span>
            <span className="text-amber-600 font-bold group-hover:underline">Periksa stok →</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          {...cardHoverProps}
          onClick={() => onMetricClick("expiring")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cursor-pointer group hover:border-[#8B6AD9] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                Monitoring
              </span>
              <span className="text-slate-300 group-hover:text-[#5936A8] transition-colors">•••</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center mb-3">
              <Clock size={18} />
            </div>
            <p className="text-xs text-slate-500 font-medium">Kedaluwarsa ≤ 6 Bulan</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {dashboard.expiringCount} <span className="text-sm font-normal text-slate-400">Batch</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>≤ 3 bln retur: {dashboard.returnWindowCount} batch</span>
            <span className="text-[#5936A8] font-bold group-hover:underline">Kelola batch →</span>
          </div>
        </motion.div>
      </div>

      {/* Real Operations Grid: Transaksi Terkini & Stok Perlu Perhatian */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Real Transactions */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaksi Terkini</h3>
              <p className="text-xs text-slate-500">Aktivitas penjualan kasir yang tercatat di database.</p>
            </div>
            <button
              onClick={onGoToSales}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#5936A8] text-xs font-bold rounded-xl transition-colors"
            >
              <span>+ Kasir Baru</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {dashboard.recentSales?.map((sale) => (
              <div
                key={sale.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-50 text-[#5936A8] flex items-center justify-center shrink-0">
                    <ArrowDownLeft size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {sale.kodeTransaksi}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDate(sale.tanggal)} · Kasir: {sale.user?.nama || "Umum"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Selesai
                  </span>
                  <span className="text-xs font-bold text-slate-900 text-right">
                    + {formatMoney(sale.total)}
                  </span>
                  {onReceipt && (
                    <button
                      onClick={() => onReceipt(sale)}
                      className="p-1.5 text-slate-400 hover:text-[#5936A8] hover:bg-purple-50 rounded-lg transition-colors"
                      title="Cetak Struk"
                    >
                      <ReceiptText size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(!dashboard.recentSales || !dashboard.recentSales.length) && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi tersimpan.
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Real Low Stock Urgent List */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stok Perlu Perhatian</h3>
              <p className="text-xs text-slate-500">
                {dashboard.lowStockProducts?.length || 0} obat di bawah batas aman
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
          </div>

          <div className="space-y-3">
            {dashboard.lowStockProducts?.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {product.namaProduk}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Sisa: <b className="text-rose-600">{product.stok}</b> {product.satuan.kode} (Min: {product.stokMinimum})
                  </span>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  Restock
                </span>
              </div>
            ))}
            {(!dashboard.lowStockProducts || !dashboard.lowStockProducts.length) && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Semua persediaan obat berada di atas batas minimum.
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onMetricClick("lowStock")}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Lihat Seluruh Stok Menipis</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Inventory Health & Quick Navigation Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5936A8] flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Integritas Operasional Apotek Risa</h4>
              <p className="text-xs text-slate-500">
                Data inventaris, riwayat harga, dan laporan keuangan tersimpan aman secara terpusat di server.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onGoToSales}
              className="px-4 py-2 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Buka Kasir Penjualan
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------------------
// REUSABLE UI COMPONENTS
// -------------------------------------------------------------------------
function MetricCard({ title, value, note, icon: IconComponent, warning, selected, onClick }) {
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

function InputField({ label, name, type = "text", ...props }) {
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

function PasswordField({ label, name, minLength, required, show, onToggle }) {
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

function TableSearch({ value, onChange, placeholder = "Cari data..." }) {
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

function InventoryTabs({ activeTab, onSelect }) {
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

// -------------------------------------------------------------------------
// TABLES
// -------------------------------------------------------------------------
function ProductsTable({ products, money: formatMoney, onArchive, onPriceChange, onEdit, owner }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Obat</th>
            <th className="py-3 px-3">Kategori</th>
            <th className="py-3 px-3">HPP</th>
            <th className="py-3 px-3">Harga Jual</th>
            <th className="py-3 px-3">Stok</th>
            <th className="py-3 px-3">Status</th>
            {owner && <th className="py-3 px-3 text-right">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {products.map((p) => {
            const isLow = p.stok <= p.stokMinimum;
            return (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3">
                  <span className="font-bold text-slate-900 block">{p.namaProduk}</span>
                  <span className="text-[11px] text-slate-400">
                    {p.kodeBarang || "Tanpa kode"} · {p.satuan.kode}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-600">{p.kategori.nama}</td>
                <td className="py-3 px-3 text-slate-600">{formatMoney(p.hpp)}</td>
                <td className="py-3 px-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span>{formatMoney(p.hargaJual)}</span>
                    {owner && (
                      <button
                        type="button"
                        onClick={() => onPriceChange(p)}
                        className="text-[#5936A8] hover:text-[#472985] p-1 rounded"
                        title="Ubah harga jual"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 font-bold text-slate-800">{p.stok}</td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isLow ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isLow ? "Menipis" : "Tersedia"}
                  </span>
                </td>
                {owner && (
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-[#5936A8] hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit data obat"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchive(p.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Arsipkan obat"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {!products.length && (
            <tr>
              <td colSpan={owner ? 7 : 6} className="py-8 text-center text-slate-400">
                Tidak ada data obat untuk ditampilkan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SalesTable({ sales, money: formatMoney, date: formatDate, onReceipt }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">No. Transaksi</th>
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Jenis</th>
            <th className="py-3 px-3">Kasir</th>
            <th className="py-3 px-3">Jumlah Item</th>
            <th className="py-3 px-3">Total Pembayaran</th>
            {onReceipt && <th className="py-3 px-3 text-right">Struk</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {sales.map((sale) => (
            <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{sale.kodeTransaksi}</td>
              <td className="py-3 px-3 text-slate-500">{formatDate(sale.tanggal)}</td>
              <td className="py-3 px-3">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {sale.jenis === "ONLINE" ? "Online" : "Offline"}
                </span>
              </td>
              <td className="py-3 px-3 font-medium text-slate-700">{sale.user?.nama || "—"}</td>
              <td className="py-3 px-3 text-slate-600">
                {sale.detail?.reduce((sum, d) => sum + d.jumlah, 0) ?? 0}
              </td>
              <td className="py-3 px-3 font-bold text-slate-900">{formatMoney(sale.total)}</td>
              {onReceipt && (
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onReceipt(sale)}
                    className="p-1.5 text-slate-500 hover:text-[#5936A8] hover:bg-purple-50 rounded-lg transition-colors"
                    title="Cetak struk kasir"
                  >
                    <Printer size={15} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {!sales.length && (
            <tr>
              <td colSpan={onReceipt ? 7 : 6} className="py-8 text-center text-slate-400">
                Tidak ada transaksi yang sesuai dengan filter ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StockTable({ records, date: formatDate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Obat / Rincian Batch</th>
            <th className="py-3 px-3">Stok Sistem</th>
            <th className="py-3 px-3">Stok Fisik</th>
            <th className="py-3 px-3">Selisih</th>
            <th className="py-3 px-3">Petugas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 text-slate-500">{formatDate(r.tanggal)}</td>
              <td className="py-3 px-3">
                <span className="font-bold text-slate-900 block">{r.produk.namaProduk}</span>
                <span className="text-[11px] text-slate-400 block">{r.alasan}</span>
              </td>
              <td className="py-3 px-3 font-medium text-slate-700">{r.stokSistem}</td>
              <td className="py-3 px-3 font-bold text-slate-900">{r.stokFisik}</td>
              <td className="py-3 px-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.selisih < 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {r.selisih > 0 ? `+${r.selisih}` : r.selisih}
                </span>
              </td>
              <td className="py-3 px-3 text-slate-600">{r.user.nama}</td>
            </tr>
          ))}
          {!records.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada data penyesuaian stok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ExpiryTable({ batches, date: formatDate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Obat</th>
            <th className="py-3 px-3">No. Batch</th>
            <th className="py-3 px-3">Tanggal Kedaluwarsa</th>
            <th className="py-3 px-3">Sisa Stok</th>
            <th className="py-3 px-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {batches.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">
                {b.produk?.namaProduk || "Produk tidak tersedia"}
              </td>
              <td className="py-3 px-3 text-slate-600 font-mono">{b.nomorBatch}</td>
              <td className="py-3 px-3 text-slate-700">{formatDate(b.tanggalKedaluwarsa)}</td>
              <td className="py-3 px-3 font-bold text-slate-900">{b.jumlah}</td>
              <td className="py-3 px-3">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    b.status === "KEDALUWARSA"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : b.status === "BATAS_RETUR"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-purple-50 text-purple-700 border border-purple-200"
                  }`}
                >
                  {b.status === "KEDALUWARSA"
                    ? "Kedaluwarsa"
                    : b.status === "BATAS_RETUR"
                    ? "Batas Retur ≤ 3 bln"
                    : "Preventif ≤ 6 bln"}
                </span>
              </td>
            </tr>
          ))}
          {!batches.length && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400">
                Tidak ada batch yang mendekati kedaluwarsa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ users, ownerId, onEdit, onToggle, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Nama</th>
            <th className="py-3 px-3">Username</th>
            <th className="py-3 px-3">Peran</th>
            <th className="py-3 px-3">Status</th>
            <th className="py-3 px-3">Dibuat</th>
            <th className="py-3 px-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{u.nama}</td>
              <td className="py-3 px-3 text-slate-600">{u.username}</td>
              <td className="py-3 px-3">
                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                  {u.role === "PEMILIK" ? "Pemilik" : "Kasir"}
                </span>
              </td>
              <td className="py-3 px-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    u.aktif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              <td className="py-3 px-3 text-slate-400">
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(u.dibuatPada))}
              </td>
              <td className="py-3 px-3 text-right">
                {u.role === "KASIR" ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onEdit(u, "edit")}
                      className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                      title="Edit kasir"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(u, "password")}
                      className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                      title="Ubah sandi"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => onToggle(u)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                      title={u.aktif ? "Arsipkan" : "Aktifkan"}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(u)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  u.id === ownerId && (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onEdit(u, "owner-name")}
                        className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                        title="Ubah nama"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(u, "password")}
                        className="p-1.5 text-slate-500 hover:text-[#5936A8] rounded-lg hover:bg-purple-50"
                        title="Atur sandi"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  )
                )}
              </td>
            </tr>
          ))}
          {!users.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada pengguna terdaftar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PriceHistoryTable({ history, money: formatMoney, date: formatDate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Obat</th>
            <th className="py-3 px-3">Jenis Harga</th>
            <th className="py-3 px-3">Harga Lama</th>
            <th className="py-3 px-3">Harga Baru</th>
            <th className="py-3 px-3">Diubah Oleh</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {history.map((h) => (
            <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 text-slate-500">{formatDate(h.tanggal)}</td>
              <td className="py-3 px-3 font-bold text-slate-900">
                {h.produk.namaProduk}
                <span className="text-[11px] text-slate-400 block font-normal">
                  {h.produk.kodeBarang || "Tanpa kode"}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-[#5936A8]">
                  {h.jenisHarga === "JUAL" ? "Harga Jual" : h.jenisHarga === "HPP" ? "HPP" : "Harga Beli"}
                </span>
              </td>
              <td className="py-3 px-3 text-slate-500">{formatMoney(h.hargaLama)}</td>
              <td className="py-3 px-3 font-bold text-slate-900">{formatMoney(h.hargaBaru)}</td>
              <td className="py-3 px-3 text-slate-600">{h.user.nama}</td>
            </tr>
          ))}
          {!history.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada riwayat perubahan harga.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ExpensesTable({ expenses, money: formatMoney, date: formatDate, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Tanggal</th>
            <th className="py-3 px-3">Kategori</th>
            <th className="py-3 px-3">Keterangan</th>
            <th className="py-3 px-3">Jumlah</th>
            <th className="py-3 px-3">Dicatat Oleh</th>
            <th className="py-3 px-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {expenses.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 text-slate-500">{formatDate(e.tanggal)}</td>
              <td className="py-3 px-3 font-semibold text-slate-800">{e.kategori}</td>
              <td className="py-3 px-3 text-slate-600">{e.deskripsi}</td>
              <td className="py-3 px-3 font-bold text-rose-600">{formatMoney(e.jumlah)}</td>
              <td className="py-3 px-3 text-slate-500">{e.user?.nama || "—"}</td>
              <td className="py-3 px-3 text-right">
                <button
                  onClick={() => onDelete(e)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Hapus biaya"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          {!expenses.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada biaya operasional tercatat.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function reportPeriodLabel(period) {
  const value = new Date(`${period.length === 7 ? `${period}-01` : period}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("id-ID", {
    ...(period.length === 7 ? { month: "long", year: "numeric" } : { dateStyle: "medium" }),
    timeZone: "UTC",
  }).format(value);
}

function ReportTable({ rows, money: formatMoney }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Periode</th>
            <th className="py-3 px-3">Omzet</th>
            <th className="py-3 px-3">Transaksi / Kunjungan</th>
            <th className="py-3 px-3">Laba Kotor</th>
            <th className="py-3 px-3">Biaya Operasional</th>
            <th className="py-3 px-3">Laba Bersih</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.periode} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{reportPeriodLabel(row.periode)}</td>
              <td className="py-3 px-3 font-semibold text-slate-800">{formatMoney(row.omzet)}</td>
              <td className="py-3 px-3 text-slate-600">
                {row.jumlahTransaksi} / {row.jumlahKunjungan}
              </td>
              <td className="py-3 px-3 text-emerald-600 font-semibold">{formatMoney(row.labaKotor)}</td>
              <td className="py-3 px-3 text-rose-600">{formatMoney(row.biayaOperasional)}</td>
              <td className="py-3 px-3 font-extrabold text-[#5936A8]">{formatMoney(row.labaBersih)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                Belum ada rekapitulasi data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportMetricTable({ rows, metric, money: formatMoney }) {
  const countMetric = metric === "jumlahKunjungan";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-3">Periode</th>
            <th className="py-3 px-3">{reportMetricLabels[metric].toLocaleUpperCase("id-ID")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.periode} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3 font-bold text-slate-900">{reportPeriodLabel(row.periode)}</td>
              <td className="py-3 px-3 font-bold text-[#5936A8]">
                {countMetric ? row[metric] : formatMoney(row[metric])}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={2} className="py-8 text-center text-slate-400">
                Tidak ada data rincian.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ExcelImportTable({ rows }) {
  const actionLabels = {
    create: "Baru",
    update: "Perbarui",
    ambiguous: "Ambigu",
    invalid: "Tidak valid",
  };
  return (
    <div className="overflow-x-auto max-h-60">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-2 px-2">Baris</th>
            <th className="py-2 px-2">Kode</th>
            <th className="py-2 px-2">Nama Produk</th>
            <th className="py-2 px-2">Aksi</th>
            <th className="py-2 px-2">Validasi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.row}>
              <td className="py-2 px-2 text-slate-400 font-mono">{row.row}</td>
              <td className="py-2 px-2 font-mono text-slate-600">{row.product?.kodeBarang || "—"}</td>
              <td className="py-2 px-2 font-medium text-slate-900">{row.product?.namaProduk || "—"}</td>
              <td className="py-2 px-2 font-semibold text-[#5936A8]">{actionLabels[row.action] || row.action}</td>
              <td className="py-2 px-2 text-[11px] text-slate-500">
                {row.errors.length ? row.errors.join("; ") : "Siap disimpan"}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400">
                Belum ada data pratinjau.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// -------------------------------------------------------------------------
// PRINTABLE RECEIPT MODAL
// -------------------------------------------------------------------------
function ReceiptModal({ sale, onPrint, onClose }) {
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
