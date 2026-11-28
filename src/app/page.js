"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardView } from "../components/dashboard-view";
import {
  InputField,
  InventoryTabs,
  MetricCard,
  PasswordField,
  TableSearch,
} from "../components/form-controls";
import {
  ExpensesTable,
  ExcelImportTable,
  ExpiryTable,
  PriceHistoryTable,
  ProductsTable,
  ReportMetricTable,
  ReportTable,
  SalesTable,
  StockTable,
  UsersTable,
  reportMetricLabels,
} from "../components/data-tables";
import { ReceiptModal } from "../components/receipt-modal";
import { containerVariants, itemVariants } from "../components/motion-presets";
import { CalculatorScreen } from "../components/screens/calculator-screen";
import { HistoryScreen } from "../components/screens/history-screen";
import { ProductsScreen } from "../components/screens/products-screen";
import { SalesScreen } from "../components/screens/sales-screen";
import { ExpensesScreen } from "../components/screens/expenses-screen";
import { ReportsScreen } from "../components/screens/reports-screen";
import { ExcelScreen } from "../components/screens/excel-screen";
import { PricesScreen } from "../components/screens/prices-screen";
import { StockScreen } from "../components/screens/stock-screen";
import { ExpiryScreen } from "../components/screens/expiry-screen";
import { BackupScreen } from "../components/screens/backup-screen";
import { UsersScreen } from "../components/screens/users-screen";
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

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

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
                <ProductsScreen
                  user={user}
                  summaryDetail={summaryDetail}
                  onSelectInventoryTab={selectInventoryTab}
                  busy={busy}
                  onCreateProduct={createProduct}
                  editingProduct={editingProduct}
                  editFormRef={editProductFormRef}
                  onSaveProductEdit={saveProductEdit}
                  onCancelEdit={() => setEditingProduct(null)}
                  filtered={filtered}
                  query={query}
                  onQueryChange={setQuery}
                  money={money}
                  onArchive={archiveProduct}
                  onPriceChange={changePrice}
                  onEdit={setEditingProduct}
                />
              )}

              {screen === "calculator" && user.role === "PEMILIK" && (
                <CalculatorScreen
                  priceMode={priceMode}
                  setPriceMode={setPriceMode}
                  selectedBulkProductIds={selectedBulkProductIds}
                  priceForm={priceForm}
                  changePriceInput={changePriceInput}
                  data={data}
                  selectedPriceProduct={selectedPriceProduct}
                  money={money}
                  bulkSearchQuery={bulkSearchQuery}
                  setBulkSearchQuery={setBulkSearchQuery}
                  bulkAvailableProducts={bulkAvailableProducts}
                  setSelectedBulkProductIds={setSelectedBulkProductIds}
                  bulkCategoryFilter={bulkCategoryFilter}
                  setBulkCategoryFilter={setBulkCategoryFilter}
                  pricingCategories={pricingCategories}
                  priceSourceNote={priceSourceNote}
                  priceError={priceError}
                  priceResult={priceResult}
                  priceDraft={priceDraft}
                  busy={busy}
                  saveSuggestedPrice={saveSuggestedPrice}
                  bulkCalculations={bulkCalculations}
                  saveBulkSuggestedPrices={saveBulkSuggestedPrices}
                />
              )}

              {screen === "sales" && (
                <SalesScreen
                  filtered={filtered}
                  money={money}
                  query={query}
                  onQueryChange={(value) => {
                    setQuery(value);
                    setSalesPage(1);
                  }}
                  salesPageProducts={salesPageProducts}
                  busy={busy}
                  setCart={setCart}
                  salesPageStart={salesPageStart}
                  pageSize={SALES_PAGE_SIZE}
                  activeSalesPage={activeSalesPage}
                  salesPageCount={salesPageCount}
                  setSalesPage={setSalesPage}
                  cart={cart}
                  saleSettings={saleSettings}
                  changeSaleSetting={changeSaleSetting}
                  checkout={checkout}
                />
              )}

              {screen === "history" && (
                <HistoryScreen
                  summaryDetail={summaryDetail}
                  historyTotal={historyTotal}
                  dashboard={dashboard}
                  money={money}
                  query={query}
                  onSearchChange={(value) => {
                    setQuery(value);
                    setHistoryPage(1);
                    loadScreen("history", {
                      historyFilter: appliedHistoryFilter,
                      historyPage: 1,
                      query: value,
                    });
                  }}
                  historyFilter={historyFilter}
                  onHistoryFilterChange={setHistoryFilter}
                  onApplyFilter={applyHistoryFilter}
                  filtered={filtered}
                  date={date}
                  onReceipt={setReceiptSale}
                  historyPage={historyPage}
                  historyPageCount={historyPageCount}
                  pageSize={SALES_PAGE_SIZE}
                  onPageChange={(nextPage) => {
                    setHistoryPage(nextPage);
                    loadScreen("history", {
                      historyFilter: appliedHistoryFilter,
                      historyPage: nextPage,
                      query,
                    });
                  }}
                />
              )}

              {screen === "expenses" && user.role === "PEMILIK" && (
                <ExpensesScreen
                  filtered={filtered}
                  query={query}
                  setQuery={setQuery}
                  createExpense={createExpense}
                  expenseDate={expenseDate}
                  setExpenseDate={setExpenseDate}
                  busy={busy}
                  money={money}
                  date={date}
                  deleteExpense={deleteExpense}
                />
              )}

              {screen === "reports" && user.role === "PEMILIK" && (
                <ReportsScreen
                  reportFilter={reportFilter}
                  setReportFilter={setReportFilter}
                  refreshReport={refreshReport}
                  busy={busy}
                  report={report}
                  money={money}
                  reportDetail={reportDetail}
                  setReportDetail={setReportDetail}
                />
              )}

              {screen === "excel" && user.role === "PEMILIK" && (
                <ExcelScreen
                  busy={busy}
                  exportProductsExcel={exportProductsExcel}
                  previewProductsExcel={previewProductsExcel}
                  excelDropActive={excelDropActive}
                  setExcelDropActive={setExcelDropActive}
                  dropExcelFile={dropExcelFile}
                  excelFile={excelFile}
                  selectExcelFiles={selectExcelFiles}
                  excelPreview={excelPreview}
                  commitProductsExcel={commitProductsExcel}
                />
              )}

              {screen === "prices" && user.role === "PEMILIK" && (
                <PricesScreen
                  query={query}
                  setQuery={setQuery}
                  filtered={filtered}
                  money={money}
                  date={date}
                />
              )}

              {screen === "stock" && user.role === "PEMILIK" && (
                <StockScreen
                  filtered={filtered}
                  query={query}
                  setQuery={setQuery}
                  date={date}
                  saveStocktake={saveStocktake}
                  stockProductId={stockProductId}
                  setStockProductId={setStockProductId}
                  stockProducts={stockProducts}
                  setStockBatchItems={setStockBatchItems}
                  stockBatchItems={stockBatchItems}
                  busy={busy}
                />
              )}

              {screen === "expiry" && (
                <ExpiryScreen
                  user={user}
                  summaryDetail={summaryDetail}
                  selectInventoryTab={selectInventoryTab}
                  stockProducts={stockProducts}
                  receiveBatch={receiveBatch}
                  busy={busy}
                  filtered={filtered}
                  query={query}
                  setQuery={setQuery}
                  date={date}
                />
              )}

              {screen === "backup" && user.role === "PEMILIK" && (
                <BackupScreen
                  busy={busy}
                  downloadBackup={downloadBackup}
                  restoreBackup={restoreBackup}
                  setBackupFile={setBackupFile}
                  restoreConfirmation={restoreConfirmation}
                  setRestoreConfirmation={setRestoreConfirmation}
                  backupFile={backupFile}
                />
              )}

              {screen === "users" && user.role === "PEMILIK" && (
                <UsersScreen
                  user={user}
                  createUser={createUser}
                  busy={busy}
                  showCreatePassword={showCreatePassword}
                  setShowCreatePassword={setShowCreatePassword}
                  userEditor={userEditor}
                  saveCashier={saveCashier}
                  showEditorPassword={showEditorPassword}
                  setShowEditorPassword={setShowEditorPassword}
                  setUserEditor={setUserEditor}
                  filtered={filtered}
                  query={query}
                  setQuery={setQuery}
                  openCashierEditor={openCashierEditor}
                  toggleCashier={toggleCashier}
                  deleteCashier={deleteCashier}
                />
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
