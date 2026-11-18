"use client";

import { useCallback, useEffect, useMemo, useState, useId } from "react";
import { calculatePrice, getCalculatorHpp } from "../lib/pricing";
import { MIN_PASSWORD_LENGTH } from "../lib/user-validation";

const menus = [
  ["dashboard", "Ringkasan", "▦"],
  ["products", "Obat & Persediaan", "▤"],
  ["calculator", "Kalkulator Harga", "∑", "PEMILIK"],
  ["prices", "Riwayat Harga", "◴", "PEMILIK"],
  ["sales", "Transaksi Penjualan", "＋"],
  ["history", "Riwayat Penjualan", "◴"],
  ["expenses", "Biaya Operasional", "−", "PEMILIK"],
  ["reports", "Laporan", "▥", "PEMILIK"],
  ["excel", "Impor/Ekspor Excel", "▧", "PEMILIK"],
  ["stock", "Stock Opname", "▥", "PEMILIK"],
  ["expiry", "Kedaluwarsa", "◷", "PEMILIK"],
  ["backup", "Backup & Restore", "⬇", "PEMILIK"],
  ["users", "Pengguna", "♙", "PEMILIK"],
];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function money(value) {
  return currency.format(Number(value || 0));
}

function dateInputValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
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

export default function Home() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [data, setData] = useState([]);
  const [stockProducts, setStockProducts] = useState([]);
  const [stockProductId, setStockProductId] = useState("");
  const [stockBatchItems, setStockBatchItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState(null);
  const [reportFilter, setReportFilter] = useState({ period: "month", date: "" });
  const [expenseDate, setExpenseDate] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [backupFile, setBackupFile] = useState(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [query, setQuery] = useState("");
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
  const [editingProduct, setEditingProduct] = useState(null);
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

  const loadScreen = useCallback(async (currentScreen) => {
    setLoading(true);
    setData([]);
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
        setData((await request("/api/sales")).sales);
      } else if (currentScreen === "expenses") {
        setExpenseDate(dateInputValue());
        setData((await request("/api/expenses")).expenses);
      } else if (currentScreen === "reports") {
        const date = dateInputValue();
        setReportFilter({ period: "month", date });
        setReport(await request(`/api/reports?period=month&date=${date}`));
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
        setData((await request("/api/products?untukPenjualan=true")).products);
      }
    } catch (error) {
      flash(error.message);
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    request("/api/auth/session")
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        return loadScreen("dashboard");
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [loadScreen]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    if (!term) return data;
    return data.filter((item) =>
      JSON.stringify(item).toLocaleLowerCase("id-ID").includes(term),
    );
  }, [data, query]);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { user: currentUser } = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      setUser(currentUser);
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
        const detail = error.payload.overlaps.map((batch) => `${batch.nomorBatch} (${batch.jumlah} unit)`).join(", ");
        if (!window.confirm(`${error.message}\nBatch terkait: ${detail}\nLanjutkan penerimaan?`)) return;
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

  async function refreshReport(event) {
      event.preventDefault();
      setBusy(true);
      try {
        const params = new URLSearchParams(reportFilter);
        setReport(await request(`/api/reports?${params}`));
      } catch (error) {
        flash(error.message);
      } finally {
        setBusy(false);
      }
  }

  async function downloadBackup() {
      setBusy(true);
      try {
        await downloadFile("/api/backup", `apotekrisa-backup-${dateInputValue()}.json`, "Unduhan backup gagal.");
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
      if (!window.confirm("Restore akan mengganti seluruh data saat ini. Pastikan Anda memiliki backup terbaru. Lanjutkan?")) return;
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
      flash(`${result.counts.create} produk ditambahkan dan ${result.counts.update} produk diperbarui.`);
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
    const body = userEditor.mode === "edit"
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
      if (userEditor.mode === "owner-name") setUser((current) => ({ ...current, nama: values.nama.trim() }));
      setUserEditor(null);
      setShowEditorPassword(false);
      const message = userEditor.mode === "edit"
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
    if (!window.confirm(`Hapus permanen akun ${cashier.nama}? Akun dengan riwayat aktivitas hanya dapat diarsipkan.`)) return;
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
      await request("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          ...saleSettings,
          items: cart.map(({ id, quantity }) => ({ produkId: id, jumlah: quantity })),
        }),
      });
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
      setScreen("history");
      await loadScreen("history");
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
    if (!window.confirm("Arsipkan obat ini? Obat tidak akan bisa dipilih untuk transaksi baru.")) return;
    try {
      await request(`/api/products/${productId}`, { method: "DELETE" });
      flash("Obat berhasil diarsipkan.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    }
  }

  async function changePrice(product) {
    const value = window.prompt(`Harga jual baru untuk ${product.namaProduk}:`, String(product.hargaJual));
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

  if (loading && !user) return <main className="loading">Memuat Apotek Risa…</main>;

  if (!user) {
    return (
      <main className="login-page">
        <section className="login-intro">
          <div className="brand-mark">
            <img src="/apotek.jpg" alt="Logo Apotek Risa" width="48" height="48" />
          </div>
          <p className="eyebrow">SISTEM INFORMASI MANAJEMEN</p>
          <h1>Apotek Risa</h1>
          <p>Persediaan obat, transaksi, dan laporan dalam satu tempat.</p>
          <div className="login-feature"><span>✓</span> Data tersimpan langsung ke database</div>
          <div className="login-feature"><span>✓</span> Hak akses pemilik dan kasir</div>
        </section>
        <form className="login-card" onSubmit={login}>
          <p className="eyebrow">SELAMAT DATANG</p>
          <h2>Masuk ke akun Anda</h2>
          <p className="muted">Gunakan akun yang sudah didaftarkan pemilik.</p>
          <label>Username<input name="username" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button primary full" disabled={busy}>{busy ? "Memeriksa…" : "Masuk ke sistem"} <span>→</span></button>
          <p className="login-foot">Akses hanya untuk pengguna Apotek Risa.</p>
        </form>
        {notice && <div className="toast">{notice}</div>}
      </main>
    );
  }

  const activeMenu = menus.find(([id]) => id === screen);
  const visibleMenus = menus.filter(([, , , role]) => !role || role === user.role);
  const heading = activeMenu?.[1] || "Ringkasan";
  const selectedPriceProduct = data.find((item) => item.id === Number(priceForm.produkId));
  const priceSourceNote = priceForm.hppSumber === "hargaBeli"
    ? "HPP produk masih 0; kalkulasi memakai harga beli database. HPP database tidak diubah saat simpan."
    : priceForm.hppSumber === "manual"
      ? "HPP yang dimasukkan manual akan disimpan ke produk."
      : "HPP diambil dari database.";

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="sidebar-backdrop" type="button" aria-label="Tutup menu navigasi" onClick={() => setMobileNavOpen(false)} />}
      <aside id="main-sidebar" className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setMobileNavOpen(false); setScreen("dashboard"); }}>
          <span className="brand-mark small">
            <img src="/apotek.jpg" alt="Logo Apotek Risa" width="32" height="32" />  
          </span><span><b>APOTEK RISA</b><small>Management System</small></span>
        </a>
        <p className="nav-caption">MENU UTAMA</p>
        <nav>{visibleMenus.map(([id, title, icon]) => (
          <button key={id} className={`nav-item ${screen === id ? "selected" : ""}`} onClick={() => { setQuery(""); setScreen(id); setMobileNavOpen(false); loadScreen(id); }}>
            <span className="nav-icon">{icon}</span>{title}
          </button>
        ))}</nav>
        <div className="sidebar-note"><span className="status-dot" /> Database terhubung melalui server</div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="topbar-start"><button className="menu-toggle" type="button" aria-label={mobileNavOpen ? "Tutup menu navigasi" : "Buka menu navigasi"} aria-controls="main-sidebar" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><span aria-hidden="true">{mobileNavOpen ? "×" : "☰"}</span></button><div className="breadcrumb">Apotek Risa <span>/</span> {heading}</div></div><div className="profile"><span className="avatar">{user.nama.slice(0, 1).toUpperCase()}</span><div><b>{user.nama}</b><small>{user.role === "PEMILIK" ? "Pemilik Apotek" : "Kasir"}</small></div><button className="button ghost logout" onClick={logout}>Keluar</button></div></header>
        <section className="page-heading"><div><p className="eyebrow">APOTEK RISA / OPERASIONAL</p><h1>{heading}</h1><p className="muted">{screen === "dashboard" ? "Pantau aktivitas dan kondisi persediaan apotek." : `Kelola ${heading.toLocaleLowerCase("id-ID")} dengan data dari database.`}</p></div><span className="live-pill"><i /> DATA LANGSUNG</span></section>

        {screen === "dashboard" && <Dashboard dashboard={dashboard} money={money} date={date} />}
        {screen === "products" && <>
          {user.role === "PEMILIK" && <form className="panel product-form" onSubmit={createProduct}>
            <div className="panel-title"><div><h2>Tambah obat</h2><p>Masukkan detail produk dan persediaan awal.</p></div></div>
            <div className="form-grid">
              <Field name="namaProduk" label="Nama obat" required />
              <Field name="kodeBarang" label="Kode barang" />
              <Field name="kategori" label="Kategori" required />
              <Field name="satuan" label="Satuan" required placeholder="Contoh: Strip" />
              <Field name="hargaBeli" label="Harga beli / HPP" type="number" min="0" required />
              <Field name="hargaJual" label="Harga jual" type="number" min="0" required />
              <Field name="stok" label="Stok awal" type="number" min="0" required />
              <Field name="stokMinimum" label="Batas stok menipis" type="number" min="0" required />
            </div><button className="button primary" disabled={busy}>Simpan obat</button>
          </form>}
          {editingProduct && <form className="panel product-form" onSubmit={saveProductEdit}>
            <div className="panel-title"><div><h2>Ubah produk</h2><p>{editingProduct.namaProduk}</p></div></div>
            <div className="form-grid">
              <Field name="namaProduk" label="Nama obat" defaultValue={editingProduct.namaProduk} required />
              <Field name="kodeBarang" label="Kode barang" defaultValue={editingProduct.kodeBarang || ""} />
              <Field name="kategori" label="Kategori" defaultValue={editingProduct.kategori.nama} required />
              <Field name="satuan" label="Satuan" defaultValue={editingProduct.satuan.kode} required />
              <Field name="hargaBeli" label="Harga beli" type="number" min="0" step="0.01" defaultValue={editingProduct.hargaBeli} required />
              <Field name="hpp" label="HPP" type="number" min="0" step="0.01" defaultValue={editingProduct.hpp} required />
              <Field name="hargaJual" label="Harga jual" type="number" min="0" step="0.01" defaultValue={editingProduct.hargaJual} required />
              <Field name="stokMinimum" label="Batas stok menipis" type="number" min="0" step="1" defaultValue={editingProduct.stokMinimum} required />
            </div>
            <button className="button primary" disabled={busy}>Simpan perubahan</button>{" "}
            <button type="button" className="button ghost" onClick={() => setEditingProduct(null)}>Batal</button>
          </form>}
          <div className="panel"><PanelTitle title="Katalog obat" count={`${filtered.length} produk`} /><Search value={query} onChange={setQuery} />
            <ProductsTable products={filtered} money={money} onArchive={archiveProduct} onPriceChange={changePrice} onEdit={setEditingProduct} owner={user.role === "PEMILIK"} />
          </div>
        </>}
        {screen === "calculator" && user.role === "PEMILIK" && <>
          <div className="panel product-form">
            <div className="panel-title"><div><h2>Hitung harga jual</h2><p>Persentase admin dan pajak dihitung dari harga jual; biaya lainnya per unit.</p></div></div>
            <div className="form-grid">
              <label>Obat<select name="produkId" value={priceForm.produkId} onChange={changePriceInput} required><option value="" disabled>Pilih obat</option>{data.map((product) => <option value={product.id} key={product.id}>{product.namaProduk}</option>)}</select>{selectedPriceProduct && <small className="cell-sub">Harga beli: {money(selectedPriceProduct.hargaBeli)} · Harga jual saat ini: {money(selectedPriceProduct.hargaJual)}</small>}</label>
              <Field name="hpp" label="HPP" type="number" min="0" step="0.01" value={priceForm.hpp} onChange={changePriceInput} required />
              <Field name="persenBiayaAdmin" label="Biaya admin (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenBiayaAdmin} onChange={changePriceInput} required />
              <Field name="persenPajak" label="Pajak (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenPajak} onChange={changePriceInput} required />
              <Field name="biayaPengemasan" label="Biaya pengemasan" type="number" min="0" step="0.01" value={priceForm.biayaPengemasan} onChange={changePriceInput} required />
              <Field name="biayaLayanan" label="Biaya layanan" type="number" min="0" step="0.01" value={priceForm.biayaLayanan} onChange={changePriceInput} required />
              <Field name="biayaGratisOngkir" label="Subsidi gratis ongkir" type="number" min="0" step="0.01" value={priceForm.biayaGratisOngkir} onChange={changePriceInput} required />
              <Field name="persenTargetLaba" label="Target laba (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenTargetLaba} onChange={changePriceInput} required />
            </div>
            {selectedPriceProduct && <small className="cell-sub">{priceSourceNote}</small>}
            {priceError && <p className="cell-sub" role="alert">{priceError}</p>}
          </div>
          {priceResult && <div className="panel">
            <PanelTitle title="Hasil kalkulasi" count={data.find((item) => item.id === priceDraft?.produkId)?.namaProduk || "Produk"} />
            <div className="price-result"><span>Harga jual saat ini: <b>{money(selectedPriceProduct?.hargaJual)}</b></span><span>Harga jual yang disarankan</span><strong>{money(priceResult.hargaJual)}</strong><span>Laba kotor per unit: <b>{money(priceResult.labaKotor)}</b></span><span>Estimasi laba bersih per unit: <b>{money(priceResult.labaBersih)}</b></span></div>
            <button className="button primary" disabled={busy || !priceDraft} onClick={saveSuggestedPrice}>{busy ? "Menyimpan…" : "Simpan harga ke produk"}</button>
          </div>}
        </>}
        {screen === "sales" && <div className="sales-layout">
          <div className="panel"><PanelTitle title="Pilih obat" count={`${filtered.length} tersedia`} /><Search value={query} onChange={setQuery} />
            <div className="product-picker">{filtered.map((product) => <div className="picker-row" key={product.id}><div><b>{product.namaProduk}</b><small>{product.kodeBarang || "Tanpa kode"} · Stok {product.stok} {product.satuan.kode}</small></div><div className="picker-action"><b>{money(product.hargaJual)}</b><button className="button secondary" disabled={!product.stok || busy} onClick={() => setCart((items) => {
              const found = items.find((item) => item.id === product.id);
              if (found) return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stok) } : item);
              return [...items, { id: product.id, quantity: 1, product }];
            })}>Tambah</button></div></div>)}</div>
          </div>
          <div className="panel cart-panel"><PanelTitle title="Keranjang" count={`${cart.reduce((sum, item) => sum + item.quantity, 0)} item`} />
            {cart.length ? cart.map((item) => <div className="cart-row" key={item.id}><div><b>{item.product.namaProduk}</b><small>{money(item.product.hargaJual)} × {item.quantity}</small></div><div className="quantity"><button aria-label="Kurangi" onClick={() => setCart((items) => items.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity - 1 } : entry).filter((entry) => entry.quantity > 0))}>−</button><span>{item.quantity}</span><button aria-label="Tambah" onClick={() => setCart((items) => items.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.min(entry.quantity + 1, entry.product.stok) } : entry))}>＋</button></div></div>) : <div className="empty-state">Pilih obat untuk memulai transaksi.</div>}
            <div className="form-grid sale-options">
              <label>Jenis transaksi<select name="jenis" value={saleSettings.jenis} onChange={changeSaleSetting}><option value="OFFLINE">Offline</option><option value="ONLINE">Online</option></select></label>
              <Field name="potongan" label="Potongan transaksi" type="number" min="0" step="0.01" value={saleSettings.potongan} onChange={changeSaleSetting} />
              <Field name="persenBiayaAdmin" label="Admin (%)" type="number" min="0" max="100" step="0.01" value={saleSettings.persenBiayaAdmin} onChange={changeSaleSetting} />
              <Field name="persenPajak" label="Pajak (%)" type="number" min="0" max="100" step="0.01" value={saleSettings.persenPajak} onChange={changeSaleSetting} />
              <Field name="biayaPengemasan" label="Pengemasan / unit" type="number" min="0" step="0.01" value={saleSettings.biayaPengemasan} onChange={changeSaleSetting} />
              <Field name="biayaLayanan" label="Layanan / unit" type="number" min="0" step="0.01" value={saleSettings.biayaLayanan} onChange={changeSaleSetting} />
              <Field name="biayaGratisOngkir" label="Gratis ongkir / unit" type="number" min="0" step="0.01" value={saleSettings.biayaGratisOngkir} onChange={changeSaleSetting} />
            </div>
            <div className="cart-total"><span>Total pembayaran</span><b>{money(Math.max(0, cart.reduce((sum, item) => sum + Number(item.product.hargaJual) * item.quantity, 0) - Number(saleSettings.potongan || 0)))}</b></div>
            <button className="button primary full" disabled={!cart.length || busy} onClick={checkout}>{busy ? "Memproses…" : "Selesaikan transaksi"}</button>
          </div>
        </div>}
        {screen === "history" && <div className="panel"><PanelTitle title="Transaksi terbaru" count={`${filtered.length} transaksi`} /><Search value={query} onChange={setQuery} /><SalesTable sales={filtered} money={money} date={date} /></div>}
        {screen === "expenses" && user.role === "PEMILIK" && <>
          <form className="panel product-form" onSubmit={createExpense}>
            <div className="panel-title"><div><h2>Catat biaya operasional</h2><p>Biaya pada periode ini akan mengurangi laba bersih laporan.</p></div></div>
            <div className="form-grid">
              <Field name="tanggal" label="Tanggal" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} required />
              <Field name="kategori" label="Kategori" maxLength="50" placeholder="Contoh: Listrik" required />
              <Field name="deskripsi" label="Keterangan" maxLength="255" required />
              <Field name="jumlah" label="Jumlah (Rp)" type="number" min="0.01" step="0.01" required />
            </div>
            <button className="button primary" disabled={busy}>Simpan biaya</button>
          </form>
          <div className="panel"><PanelTitle title="Riwayat biaya operasional" count={`${filtered.length} biaya`} /><Search value={query} onChange={setQuery} /><ExpensesTable expenses={filtered} money={money} date={date} onDelete={deleteExpense} /></div>
        </>}
        {screen === "reports" && user.role === "PEMILIK" && <>
          <form className="panel product-form" onSubmit={refreshReport}>
            <div className="panel-title"><div><h2>Rekapitulasi keuangan</h2><p>Jumlah kunjungan mengikuti banyaknya transaksi berhasil.</p></div></div>
            <div className="form-grid">
              <label>Periode<select value={reportFilter.period} onChange={(event) => setReportFilter((current) => ({ ...current, period: event.target.value }))}><option value="day">Harian</option><option value="month">Bulanan</option><option value="year">Tahunan</option></select></label>
              <label>Tanggal acuan<input type="date" value={reportFilter.date} onChange={(event) => setReportFilter((current) => ({ ...current, date: event.target.value }))} required /></label>
            </div>
            <button className="button primary" disabled={busy}>{busy ? "Memuat…" : "Tampilkan laporan"}</button>
          </form>
          {report && <>
            <div className="metric-grid report-metrics">
              <Metric label="Omzet" value={money(report.omzet)} note={`${report.jumlahTransaksi} transaksi`} icon="↗" />
              <Metric label="Jumlah kunjungan" value={report.jumlahKunjungan} note="Satu per transaksi tersimpan" icon="♧" />
              <Metric label="Laba kotor" value={money(report.labaKotor)} note="Harga jual dikurangi HPP" icon="+" />
              <Metric label="Biaya operasional" value={money(report.biayaOperasional)} note="Pada periode terpilih" icon="−" warning />
              <Metric label="Laba bersih" value={money(report.labaBersih)} note="Setelah potongan dan biaya" icon="=" />
            </div>
            <div className="panel"><PanelTitle title="Rincian per periode" count={`${report.data.length} baris`} /><ReportTable rows={report.data} money={money} /></div>
          </>}
        </>}
        {screen === "excel" && user.role === "PEMILIK" && <>
          <div className="panel">
            <div className="panel-title"><div><h2>Ekspor katalog produk</h2><p>Unduh produk aktif sebagai workbook .xlsx untuk arsip atau penyuntingan.</p></div></div>
            <button type="button" className="button primary" disabled={busy} onClick={exportProductsExcel}>Unduh produk.xlsx</button>
          </div>
          <form className="panel product-form" onSubmit={previewProductsExcel}>
            <div className="panel-title"><div><h2>Impor produk Excel</h2><p>Pratinjau dan perbaiki semua validasi sebelum menyimpan. Pembaruan tidak mengubah stok produk yang sudah ada.</p></div></div>
            <div className="form-grid">
              <label>File workbook (.xlsx)<input key={excelFile?.name || "empty"} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => {
                setExcelFile(event.target.files?.[0] || null);
                setExcelPreview(null);
              }} required /></label>
            </div>
            <p className="muted">Maksimal 5 MB dan 5.000 baris. Header harus mengikuti urutan kolom pada workbook ekspor.</p>
            <button className="button primary" disabled={busy || !excelFile}>{busy ? "Memvalidasi…" : "Pratinjau impor"}</button>
            {excelPreview && <div className="excel-preview">
              {excelPreview.error && <p className="badge badge-warning">{excelPreview.error}</p>}
              <div className="panel-title"><div><h2>Hasil pratinjau</h2><p>{excelPreview.filename || excelFile?.name} · {excelPreview.rowCount || 0} baris</p></div><span className="count-pill">{excelPreview.counts?.errors || 0} perlu diperbaiki</span></div>
              <p className="muted">Baru: {excelPreview.counts?.create || 0} · Diperbarui: {excelPreview.counts?.update || 0} · Ambigu: {excelPreview.counts?.ambiguous || 0}</p>
              <ExcelImportTable rows={excelPreview.rows || []} />
              <button type="button" className="button secondary" disabled={busy || !excelFile || Boolean(excelPreview.counts?.errors)} onClick={commitProductsExcel}>Simpan impor</button>
            </div>}
          </form>
        </>}
        {screen === "prices" && user.role === "PEMILIK" && <div className="panel"><PanelTitle title="Riwayat harga beli dan jual" count={`${filtered.length} perubahan`} /><Search value={query} onChange={setQuery} /><PriceHistoryTable history={filtered} money={money} date={date} /></div>}
        {screen === "stock" && <>
          <form className="panel stock-form" onSubmit={saveStocktake}>
            <div className="panel-title"><div><h2>Catat stock opname per batch</h2><p>Hitung setiap batch; stok sistem dan batch diperbarui dalam satu transaksi.</p></div></div>
            <div className="form-grid">
              <label>Obat<select name="produkId" required value={stockProductId} onChange={(event) => {
                const productId = event.target.value;
                const product = stockProducts.find((item) => String(item.id) === productId);
                setStockProductId(productId);
                setStockBatchItems((product?.batch || []).filter((batch) => batch.jumlah > 0).map((batch) => ({
                  batchId: batch.id,
                  nomorBatch: batch.nomorBatch,
                  tanggalKedaluwarsa: new Date(batch.tanggalKedaluwarsa).toISOString().slice(0, 10),
                  jumlahFisik: String(batch.jumlah),
                })));
              }}><option value="" disabled>Pilih obat</option>{stockProducts.map((product) => <option value={product.id} key={product.id}>{product.namaProduk} (stok {product.stok})</option>)}</select></label>
              <Field name="alasan" label="Alasan penyesuaian" required />
            </div>
            {stockProductId && <div className="batch-count-list">
              {stockBatchItems.map((item, index) => <div className="form-grid" key={item.batchId || `new-${index}`}>
                {item.batchId ? <label>Batch / kedaluwarsa<input value={`${item.nomorBatch} · ${item.tanggalKedaluwarsa}`} readOnly /></label> : <>
                  <label>Nomor batch<input required maxLength="50" value={item.nomorBatch} onChange={(event) => setStockBatchItems((items) => items.map((entry, itemIndex) => itemIndex === index ? { ...entry, nomorBatch: event.target.value } : entry))} /></label>
                  <label>Kedaluwarsa<input type="date" required value={item.tanggalKedaluwarsa} onChange={(event) => setStockBatchItems((items) => items.map((entry, itemIndex) => itemIndex === index ? { ...entry, tanggalKedaluwarsa: event.target.value } : entry))} /></label>
                </>}
                <label>Jumlah fisik<input type="number" min="0" max="1000000" required value={item.jumlahFisik} onChange={(event) => setStockBatchItems((items) => items.map((entry, itemIndex) => itemIndex === index ? { ...entry, jumlahFisik: event.target.value } : entry))} /></label>
                {!item.batchId && <button type="button" className="button ghost" onClick={() => setStockBatchItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Hapus batch</button>}
              </div>)}
              {!stockBatchItems.length && <p className="empty-state">Belum ada batch berstok. Tambahkan batch beserta tanggal kedaluwarsa sesuai kemasan fisik.</p>}
              <button type="button" className="button secondary" onClick={() => setStockBatchItems((items) => [...items, { nomorBatch: "", tanggalKedaluwarsa: "", jumlahFisik: "0" }])}>Tambah batch fisik</button>
            </div>}
            <button className="button primary" disabled={busy || !stockProductId || !stockBatchItems.length}>Simpan opname</button>
          </form>
          <div className="panel"><PanelTitle title="Riwayat stock opname" count={`${filtered.length} catatan`} /><Search value={query} onChange={setQuery} /><StockTable records={filtered} date={date} /></div>
        </>}
        {screen === "expiry" && <><form className="panel stock-form" onSubmit={receiveBatch}><div className="panel-title"><div><h2>Terima barang masuk</h2><p>Catat batch baru; jumlahnya otomatis ditambahkan ke stok.</p></div></div><div className="form-grid"><label>Obat<select name="produkId" required defaultValue=""><option value="" disabled>Pilih obat</option>{stockProducts.map((product) => <option value={product.id} key={product.id}>{product.namaProduk}</option>)}</select></label><Field name="nomorBatch" label="Nomor batch" required /><Field name="tanggalKedaluwarsa" label="Tanggal kedaluwarsa" type="date" required /><Field name="jumlah" label="Jumlah diterima" type="number" min="1" required /><Field name="hargaBeli" label="Harga beli terbaru (opsional)" type="number" min="0" step="0.01" /><Field name="hpp" label="HPP terbaru (opsional)" type="number" min="0" step="0.01" /></div><button className="button primary" disabled={busy}>Simpan barang masuk</button></form><div className="panel"><PanelTitle title="Batch kedaluwarsa dan batas retur" count={`${filtered.length} batch`} /><Search value={query} onChange={setQuery} /><ExpiryTable batches={filtered} date={date} /></div></>}
        {screen === "backup" && user.role === "PEMILIK" && <>
          <div className="panel product-form">
            <div className="panel-title"><div><h2>Backup database</h2><p>File mencakup data pengguna untuk memulihkan akun. Simpan terenkripsi dan jangan bagikan.</p></div></div>
            <button className="button primary" disabled={busy} onClick={downloadBackup}>{busy ? "Memproses…" : "Unduh backup JSON"}</button>
          </div>
          <form className="panel product-form" onSubmit={restoreBackup}>
            <div className="panel-title"><div><h2>Restore database</h2><p>Restore akan mengganti seluruh data saat ini, termasuk akun, produk, transaksi, dan riwayat.</p></div></div>
            <div className="form-grid">
              <label>File backup JSON<input type="file" accept=".json,application/json" onChange={(event) => setBackupFile(event.target.files?.[0] || null)} required /></label>
              <Field name="restoreConfirmation" label={'Ketik "RESTORE" untuk mengonfirmasi'} value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value)} required />
            </div>
            <button className="button secondary" disabled={busy || restoreConfirmation !== "RESTORE" || !backupFile}>{busy ? "Memulihkan…" : "Ganti data dengan backup"}</button>
          </form>
        </>}
        {screen === "users" && user.role === "PEMILIK" && <>
          <form className="panel user-form" onSubmit={createUser}>
            <div className="panel-title"><div><h2>Tambah kasir</h2><p>Sandi disimpan sebagai hash dan tidak bisa dilihat kembali. Anda dapat menampilkan sandi saat mengetiknya.</p></div></div>
            <div className="form-grid">
              <Field name="nama" label="Nama lengkap" required />
              <Field name="username" label="Username" minLength="3" maxLength="50" pattern="[a-zA-Z0-9._-]+" required />
              <PasswordField name="password" label={`Kata sandi (min. ${MIN_PASSWORD_LENGTH} karakter)`} minLength={MIN_PASSWORD_LENGTH} required show={showCreatePassword} onToggle={() => setShowCreatePassword((value) => !value)} />
              <input type="hidden" name="role" value="KASIR" />
            </div>
            <button className="button primary" disabled={busy}>Buat pengguna</button>
          </form>
          {userEditor && <form className="panel user-form" onSubmit={saveCashier}>
            <div className="panel-title"><div>
              <h2>{userEditor.mode === "edit" ? "Edit data pengguna" : userEditor.mode === "owner-name" ? "Ubah nama pemilik" : "Atur kata sandi pengguna"}</h2>
              <p>{userEditor.mode === "password" ? "Sandi lama tidak dapat ditampilkan. Buat sandi baru untuk menggantinya." : "Perbarui informasi akun."}</p>
            </div></div>
            <div className="form-grid">
              {userEditor.mode === "edit" ? <>
                <Field name="nama" label="Nama lengkap" defaultValue={userEditor.nama} required />
                <Field name="username" label="Username" defaultValue={userEditor.username} minLength="3" maxLength="50" pattern="[a-zA-Z0-9._-]+" required />
              </> : userEditor.mode === "owner-name"
                ? <Field name="nama" label="Nama pemilik" defaultValue={userEditor.nama} required />
                : <PasswordField name="password" label={`Kata sandi baru (min. ${MIN_PASSWORD_LENGTH} karakter)`} minLength={MIN_PASSWORD_LENGTH} required show={showEditorPassword} onToggle={() => setShowEditorPassword((value) => !value)} />}
            </div>
            <div className="user-form-actions">
              <button className="button primary" disabled={busy}>{userEditor.mode === "edit" ? "Simpan perubahan" : "Perbarui kata sandi"}</button>
              <button type="button" className="button ghost" onClick={() => setUserEditor(null)}>Batal</button>
            </div>
          </form>}
          <div className="panel"><PanelTitle title="Pengguna terdaftar" count={`${filtered.length} pengguna`} /><Search value={query} onChange={setQuery} />
            <UsersTable users={filtered} ownerId={user.id} onEdit={openCashierEditor} onToggle={toggleCashier} onDelete={deleteCashier} />
          </div>
        </>}
        {loading && <div className="loading-bar">Memuat data…</div>}
      </main>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function Field({ name, label, type = "text", ...props }) {
  return <label>{label}<input name={name} type={type} {...props} /></label>;
}

function PasswordField({ name, label, minLength, required, show, onToggle }) {
  const inputId = useId();
  return <div className="password-field">
    <label htmlFor={inputId}>{label}</label>
    <div className="password-input">
      <input id={inputId} name={name} type={show ? "text" : "password"} minLength={minLength} maxLength="200" autoComplete="new-password" required={required} />
      <button type="button" className="button ghost" aria-pressed={show} onClick={onToggle}>{show ? "Sembunyikan" : "Tampilkan"}</button>
    </div>
  </div>;
}

function PanelTitle({ title, count }) {
  return <div className="panel-title"><div><h2>{title}</h2><p>Data tersimpan di sistem Apotek Risa.</p></div><span className="count-pill">{count}</span></div>;
}

function Search({ value, onChange }) {
  return <div className="search-wrap"><span>⌕</span><input aria-label="Cari data" placeholder="Cari nama, kode, atau informasi…" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function Dashboard({ dashboard, money: formatMoney, date: formatDate }) {
  if (!dashboard) return <div className="loading-bar">Memuat ringkasan…</div>;
  return <>
    <div className="metric-grid">
      <Metric label="Omzet hari ini" value={formatMoney(dashboard.todayRevenue)} note={`${dashboard.todayTransactions} transaksi`} icon="↗" />
      <Metric label="Produk aktif" value={dashboard.productCount} note="Jenis obat dalam katalog" icon="▤" />
      <Metric label="Stok menipis" value={dashboard.lowStockCount} note="Perlu segera diperiksa" icon="!" warning />
      <Metric label="Kedaluwarsa ≤ 6 bulan" value={dashboard.expiringCount} note={`≤ 3 bulan: ${dashboard.returnWindowCount} · 3–6 bulan: ${Math.max(0, dashboard.expiringCount - dashboard.returnWindowCount)}`} icon="◷" warning />
    </div>
    <div className="dashboard-grid">
      <div className="panel"><PanelTitle title="Transaksi terkini" count="Terbaru" /><SalesTable sales={dashboard.recentSales} money={formatMoney} date={formatDate} /></div>
      <div className="panel"><PanelTitle title="Stok perlu perhatian" count={`${dashboard.lowStockProducts.length} obat`} />
        {dashboard.lowStockProducts.length ? dashboard.lowStockProducts.map((product) => <div className="attention-row" key={product.id}><span className="attention-icon">!</span><div><b>{product.namaProduk}</b><small>{product.stok} {product.satuan.kode} tersedia · minimum {product.stokMinimum}</small></div></div>) : <div className="empty-state">Semua stok berada di atas batas minimum.</div>}
      </div>
    </div>
  </>;
}

function Metric({ label, value, note, icon, warning }) {
  return <article className="metric-card"><div className={`metric-icon ${warning ? "warning" : ""}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function ProductsTable({ products, money: formatMoney, onArchive, onPriceChange, onEdit, owner }) {
  return <div className="table-wrap"><table><thead><tr><th>OBAT</th><th>KATEGORI</th><th>HPP</th><th>HARGA JUAL</th><th>STOK</th><th>STATUS</th>{owner && <th />}</tr></thead><tbody>
    {products.map((product) => <tr key={product.id}><td><b>{product.namaProduk}</b><small className="cell-sub">{product.kodeBarang || "Tanpa kode"} · {product.satuan.kode}</small></td><td>{product.kategori.nama}</td><td>{formatMoney(product.hpp)}</td><td>{formatMoney(product.hargaJual)} {owner && <button className="text-button" onClick={() => onPriceChange(product)}>Ubah harga</button>}</td><td>{product.stok}</td><td><span className={`badge ${product.stok <= product.stokMinimum ? "badge-warning" : ""}`}>{product.stok <= product.stokMinimum ? "Menipis" : "Tersedia"}</span></td>{owner && <td><button className="text-button" onClick={() => onEdit(product)}>Edit</button>{" · "}<button className="text-button" onClick={() => onArchive(product.id)}>Arsipkan</button></td>}</tr>)}
    {!products.length && <EmptyRow colSpan={owner ? 7 : 6} />}
  </tbody></table></div>;
}

function SalesTable({ sales, money: formatMoney, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>NO. TRANSAKSI</th><th>TANGGAL</th><th>JENIS</th><th>KASIR</th><th>ITEM</th><th>TOTAL</th></tr></thead><tbody>
    {sales.map((sale) => <tr key={sale.id}><td><b>{sale.kodeTransaksi}</b></td><td>{formatDate(sale.tanggal)}</td><td>{sale.jenis === "ONLINE" ? "Online" : "Offline"}</td><td>{sale.user?.nama || "—"}</td><td>{sale.detail?.reduce((sum, detail) => sum + detail.jumlah, 0) ?? 0}</td><td><b>{formatMoney(sale.total)}</b></td></tr>)}
    {!sales.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function StockTable({ records, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>OBAT / RINCIAN BATCH</th><th>STOK SISTEM</th><th>STOK FISIK</th><th>SELISIH</th><th>PETUGAS</th></tr></thead><tbody>
    {records.map((record) => <tr key={record.id}><td>{formatDate(record.tanggal)}</td><td><b>{record.produk.namaProduk}</b><small className="cell-sub">{record.alasan}</small>{record.detailBatch?.map((item) => <small className="cell-sub" key={item.id}>{item.nomorBatch} · {item.jumlahSebelum} → {item.jumlahFisik}</small>)}</td><td>{record.stokSistem}</td><td>{record.stokFisik}</td><td><span className={`badge ${record.selisih < 0 ? "badge-warning" : ""}`}>{record.selisih > 0 ? "+" : ""}{record.selisih}</span></td><td>{record.user.nama}</td></tr>)}
    {!records.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function ExpiryTable({ batches, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>OBAT</th><th>NO. BATCH</th><th>KEDALUWARSA</th><th>SISA STOK</th><th>STATUS</th></tr></thead><tbody>
    {batches.map((batch) => <tr key={batch.id}><td><b>{batch.produk?.namaProduk || "Produk tidak tersedia"}</b></td><td>{batch.nomorBatch}</td><td>{formatDate(batch.tanggalKedaluwarsa)}</td><td>{batch.jumlah}</td><td><span className="badge badge-warning">{batch.status === "KEDALUWARSA" ? "Kedaluwarsa" : batch.status === "BATAS_RETUR" ? "Batas retur ≤ 3 bulan" : "Preventif ≤ 6 bulan"}</span></td></tr>)}
    {!batches.length && <EmptyRow colSpan={5} />}
  </tbody></table></div>;
}

function UsersTable({ users, ownerId, onEdit, onToggle, onDelete }) {
  return <div className="table-wrap"><table><thead><tr><th>NAMA</th><th>USERNAME</th><th>PERAN</th><th>STATUS</th><th>DIBUAT</th><th>AKSI</th></tr></thead><tbody>
    {users.map((item) => <tr key={item.id}><td><b>{item.nama}</b></td><td>{item.username}</td><td>{item.role === "PEMILIK" ? "Pemilik" : "Kasir"}</td><td><span className={`badge ${item.aktif ? "" : "badge-warning"}`}>{item.aktif ? "Aktif" : "Nonaktif"}</span></td><td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.dibuatPada))}</td><td>{item.role === "KASIR" ? <><button className="text-button" onClick={() => onEdit(item, "edit")}>Edit</button>{" · "}<button className="text-button" onClick={() => onEdit(item, "password")}>Atur sandi</button>{" · "}<button className="text-button" onClick={() => onToggle(item)}>{item.aktif ? "Arsipkan" : "Aktifkan"}</button>{" · "}<button className="text-button" onClick={() => onDelete(item)}>Hapus</button></> : item.id === ownerId && <><button className="text-button" onClick={() => onEdit(item, "owner-name")}>Ubah nama</button>{" · "}<button className="text-button" onClick={() => onEdit(item, "password")}>Atur sandi</button></>}</td></tr>)}
    {!users.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function PriceHistoryTable({ history, money: formatMoney, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>OBAT</th><th>JENIS</th><th>HARGA LAMA</th><th>HARGA BARU</th><th>DIUBAH OLEH</th></tr></thead><tbody>
    {history.map((item) => <tr key={item.id}><td>{formatDate(item.tanggal)}</td><td><b>{item.produk.namaProduk}</b><small className="cell-sub">{item.produk.kodeBarang || "Tanpa kode"}</small></td><td>{item.jenisHarga === "JUAL" ? "Harga jual" : item.jenisHarga === "HPP" ? "HPP" : "Harga beli"}</td><td>{formatMoney(item.hargaLama)}</td><td><b>{formatMoney(item.hargaBaru)}</b></td><td>{item.user.nama}</td></tr>)}
    {!history.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function EmptyRow({ colSpan }) {
  return <tr><td colSpan={colSpan} className="empty-cell">Belum ada data untuk ditampilkan.</td></tr>;
}

function ExpensesTable({ expenses, money: formatMoney, date: formatDate, onDelete }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>KATEGORI</th><th>KETERANGAN</th><th>JUMLAH</th><th>DICATAT OLEH</th><th>AKSI</th></tr></thead><tbody>
    {expenses.map((expense) => <tr key={expense.id}><td>{formatDate(expense.tanggal)}</td><td>{expense.kategori}</td><td>{expense.deskripsi}</td><td><b>{formatMoney(expense.jumlah)}</b></td><td>{expense.user?.nama || "—"}</td><td><button className="text-button" onClick={() => onDelete(expense)}>Hapus</button></td></tr>)}
    {!expenses.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function ReportTable({ rows, money: formatMoney }) {
  function label(period) {
    const value = new Date(`${period.length === 7 ? `${period}-01` : period}T00:00:00.000Z`);
    return new Intl.DateTimeFormat("id-ID", {
      ...(period.length === 7 ? { month: "long", year: "numeric" } : { dateStyle: "medium" }),
      timeZone: "UTC",
    }).format(value);
  }

  return <div className="table-wrap"><table><thead><tr><th>PERIODE</th><th>OMZET</th><th>TRANSAKSI / KUNJUNGAN</th><th>LABA KOTOR</th><th>BIAYA OPERASIONAL</th><th>LABA BERSIH</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.periode}><td>{label(row.periode)}</td><td>{formatMoney(row.omzet)}</td><td>{row.jumlahTransaksi} / {row.jumlahKunjungan}</td><td>{formatMoney(row.labaKotor)}</td><td>{formatMoney(row.biayaOperasional)}</td><td><b>{formatMoney(row.labaBersih)}</b></td></tr>)}
    {!rows.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function ExcelImportTable({ rows }) {
  const actionLabels = { create: "Baru", update: "Perbarui", ambiguous: "Ambigu", invalid: "Tidak valid" };
  return <div className="table-wrap"><table><thead><tr><th>BARIS</th><th>KODE</th><th>NAMA PRODUK</th><th>AKSI</th><th>VALIDASI</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.product?.kodeBarang || "—"}</td><td>{row.product?.namaProduk || "—"}</td><td>{actionLabels[row.action] || row.action}</td><td>{row.errors.length ? row.errors.join("; ") : "Siap disimpan"}</td></tr>)}
    {!rows.length && <EmptyRow colSpan={5} />}
  </tbody></table></div>;
}
