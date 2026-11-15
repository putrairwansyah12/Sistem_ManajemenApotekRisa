"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const menus = [
  ["dashboard", "Ringkasan", "▦"],
  ["products", "Obat & Persediaan", "▤"],
  ["prices", "Riwayat Harga", "◴", "PEMILIK"],
  ["sales", "Transaksi Penjualan", "＋"],
  ["history", "Riwayat Penjualan", "◴"],
  ["stock", "Stock Opname", "▥", "PEMILIK"],
  ["expiry", "Kedaluwarsa", "◷", "PEMILIK"],
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

function date(value) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Permintaan gagal.");
  return result;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [data, setData] = useState([]);
  const [stockProducts, setStockProducts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const flash = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }, []);

  const loadScreen = useCallback(async (currentScreen) => {
    setLoading(true);
    try {
      if (currentScreen === "dashboard") {
        setDashboard(await request("/api/dashboard"));
      } else if (currentScreen === "products") {
        setData((await request("/api/products")).products);
      } else if (currentScreen === "history") {
        setData((await request("/api/sales")).sales);
      } else if (currentScreen === "prices") {
        setData((await request("/api/price-history")).history);
      } else if (currentScreen === "stock") {
        const [stockData, productData] = await Promise.all([
          request("/api/stock-opname"),
          request("/api/products"),
        ]);
        setData(stockData.records);
        setStockProducts(productData.products);
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
        setData((await request("/api/products")).products);
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
    await request("/api/auth/logout", { method: "POST" });
    setUser(null);
    setData([]);
    setDashboard(null);
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
    setBusy(true);
    try {
      await request("/api/stock-opname", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      form.reset();
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
    setBusy(true);
    try {
      await request("/api/expiry", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
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
      flash("Pengguna berhasil dibuat.");
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    setBusy(true);
    try {
      await request("/api/sales", {
        method: "POST",
        body: JSON.stringify({ items: cart.map(({ id, quantity }) => ({ produkId: id, jumlah: quantity })) }),
      });
      setCart([]);
      flash("Transaksi berhasil. Stok sudah diperbarui.");
      setScreen("history");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
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
          <div className="brand-mark">R</div>
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setScreen("dashboard"); }}>
          <span className="brand-mark small">R</span><span><b>APOTEK RISA</b><small>Management System</small></span>
        </a>
        <p className="nav-caption">MENU UTAMA</p>
        <nav>{visibleMenus.map(([id, title, icon]) => (
          <button key={id} className={`nav-item ${screen === id ? "selected" : ""}`} onClick={() => { setQuery(""); setScreen(id); loadScreen(id); }}>
            <span className="nav-icon">{icon}</span>{title}
          </button>
        ))}</nav>
        <div className="sidebar-note"><span className="status-dot" /> Database terhubung melalui server</div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">Apotek Risa <span>/</span> {heading}</div><div className="profile"><span className="avatar">{user.nama.slice(0, 1).toUpperCase()}</span><div><b>{user.nama}</b><small>{user.role === "PEMILIK" ? "Pemilik Apotek" : "Kasir"}</small></div><button className="button ghost logout" onClick={logout}>Keluar</button></div></header>
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
          <div className="panel"><PanelTitle title="Katalog obat" count={`${filtered.length} produk`} /><Search value={query} onChange={setQuery} />
            <ProductsTable products={filtered} money={money} onArchive={archiveProduct} onPriceChange={changePrice} owner={user.role === "PEMILIK"} />
          </div>
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
            <div className="cart-total"><span>Total pembayaran</span><b>{money(cart.reduce((sum, item) => sum + Number(item.product.hargaJual) * item.quantity, 0))}</b></div>
            <button className="button primary full" disabled={!cart.length || busy} onClick={checkout}>{busy ? "Memproses…" : "Selesaikan transaksi"}</button>
          </div>
        </div>}
        {screen === "history" && <div className="panel"><PanelTitle title="Transaksi terbaru" count={`${filtered.length} transaksi`} /><Search value={query} onChange={setQuery} /><SalesTable sales={filtered} money={money} date={date} /></div>}
        {screen === "prices" && user.role === "PEMILIK" && <div className="panel"><PanelTitle title="Perubahan harga jual" count={`${filtered.length} perubahan`} /><Search value={query} onChange={setQuery} /><PriceHistoryTable history={filtered} money={money} date={date} /></div>}
        {screen === "stock" && <><form className="panel stock-form" onSubmit={saveStocktake}><div className="panel-title"><div><h2>Catat stock opname</h2><p>Stok sistem diperbarui sesuai hasil hitung fisik.</p></div></div><div className="form-grid"><label>Obat<select name="produkId" required defaultValue=""><option value="" disabled>Pilih obat</option>{stockProducts.map((product) => <option value={product.id} key={product.id}>{product.namaProduk} (stok {product.stok})</option>)}</select></label><Field name="stokFisik" label="Jumlah stok fisik" type="number" min="0" required /><Field name="alasan" label="Alasan penyesuaian" required /></div><button className="button primary" disabled={busy}>Simpan opname</button></form><div className="panel"><PanelTitle title="Riwayat stock opname" count={`${filtered.length} catatan`} /><Search value={query} onChange={setQuery} /><StockTable records={filtered} date={date} /></div></>}
        {screen === "expiry" && <><form className="panel stock-form" onSubmit={receiveBatch}><div className="panel-title"><div><h2>Terima barang masuk</h2><p>Catat batch baru; jumlahnya otomatis ditambahkan ke stok.</p></div></div><div className="form-grid"><label>Obat<select name="produkId" required defaultValue=""><option value="" disabled>Pilih obat</option>{stockProducts.map((product) => <option value={product.id} key={product.id}>{product.namaProduk}</option>)}</select></label><Field name="nomorBatch" label="Nomor batch" required /><Field name="tanggalKedaluwarsa" label="Tanggal kedaluwarsa" type="date" required /><Field name="jumlah" label="Jumlah diterima" type="number" min="1" required /></div><button className="button primary" disabled={busy}>Simpan barang masuk</button></form><div className="panel"><PanelTitle title="Batch kedaluwarsa terdekat" count={`${filtered.length} batch`} /><Search value={query} onChange={setQuery} /><ExpiryTable batches={filtered} date={date} /></div></>}
        {screen === "users" && user.role === "PEMILIK" && <><form className="panel user-form" onSubmit={createUser}><div className="panel-title"><div><h2>Tambah pengguna</h2><p>Buat akun kasir dengan kata sandi sementara yang aman.</p></div></div><div className="form-grid"><Field name="nama" label="Nama lengkap" required /><Field name="username" label="Username" required /><Field name="password" label="Kata sandi (min. 12 karakter)" type="password" minLength="12" required /><label>Peran<select name="role" defaultValue="KASIR"><option value="KASIR">Kasir</option><option value="PEMILIK">Pemilik</option></select></label></div><button className="button primary" disabled={busy}>Buat pengguna</button></form><div className="panel"><PanelTitle title="Pengguna terdaftar" count={`${filtered.length} pengguna`} /><UsersTable users={filtered} /></div></>}
        {loading && <div className="loading-bar">Memuat data…</div>}
      </main>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function Field({ name, label, type = "text", ...props }) {
  return <label>{label}<input name={name} type={type} {...props} /></label>;
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
      <Metric label="Kedaluwarsa ≤ 30 hari" value={dashboard.expiringCount} note="Batch aktif" icon="◷" warning />
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

function ProductsTable({ products, money: formatMoney, onArchive, onPriceChange, owner }) {
  return <div className="table-wrap"><table><thead><tr><th>OBAT</th><th>KATEGORI</th><th>HPP</th><th>HARGA JUAL</th><th>STOK</th><th>STATUS</th>{owner && <th />}</tr></thead><tbody>
    {products.map((product) => <tr key={product.id}><td><b>{product.namaProduk}</b><small className="cell-sub">{product.kodeBarang || "Tanpa kode"} · {product.satuan.kode}</small></td><td>{product.kategori.nama}</td><td>{formatMoney(product.hpp)}</td><td>{formatMoney(product.hargaJual)} {owner && <button className="text-button" onClick={() => onPriceChange(product)}>Ubah</button>}</td><td>{product.stok}</td><td><span className={`badge ${product.stok <= product.stokMinimum ? "badge-warning" : ""}`}>{product.stok <= product.stokMinimum ? "Menipis" : "Tersedia"}</span></td>{owner && <td><button className="text-button" onClick={() => onArchive(product.id)}>Arsipkan</button></td>}</tr>)}
    {!products.length && <EmptyRow colSpan={owner ? 7 : 6} />}
  </tbody></table></div>;
}

function SalesTable({ sales, money: formatMoney, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>NO. TRANSAKSI</th><th>TANGGAL</th><th>KASIR</th><th>ITEM</th><th>TOTAL</th></tr></thead><tbody>
    {sales.map((sale) => <tr key={sale.id}><td><b>{sale.kodeTransaksi}</b></td><td>{formatDate(sale.tanggal)}</td><td>{sale.user?.nama || "—"}</td><td>{sale.detail?.reduce((sum, detail) => sum + detail.jumlah, 0) ?? 0}</td><td><b>{formatMoney(sale.total)}</b></td></tr>)}
    {!sales.length && <EmptyRow colSpan={5} />}
  </tbody></table></div>;
}

function StockTable({ records, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>OBAT</th><th>STOK SISTEM</th><th>STOK FISIK</th><th>SELISIH</th><th>PETUGAS</th></tr></thead><tbody>
    {records.map((record) => <tr key={record.id}><td>{formatDate(record.tanggal)}</td><td><b>{record.produk.namaProduk}</b><small className="cell-sub">{record.alasan}</small></td><td>{record.stokSistem}</td><td>{record.stokFisik}</td><td><span className={`badge ${record.selisih < 0 ? "badge-warning" : ""}`}>{record.selisih > 0 ? "+" : ""}{record.selisih}</span></td><td>{record.user.nama}</td></tr>)}
    {!records.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function ExpiryTable({ batches, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>OBAT</th><th>NO. BATCH</th><th>KEDALUWARSA</th><th>SISA STOK</th><th>STATUS</th></tr></thead><tbody>
    {batches.map((batch) => <tr key={batch.id}><td><b>{batch.produk.namaProduk}</b></td><td>{batch.nomorBatch}</td><td>{formatDate(batch.tanggalKedaluwarsa)}</td><td>{batch.jumlah}</td><td><span className="badge badge-warning">Perlu diperiksa</span></td></tr>)}
    {!batches.length && <EmptyRow colSpan={5} />}
  </tbody></table></div>;
}

function UsersTable({ users }) {
  return <div className="table-wrap"><table><thead><tr><th>NAMA</th><th>USERNAME</th><th>PERAN</th><th>STATUS</th><th>DIBUAT</th></tr></thead><tbody>
    {users.map((item) => <tr key={item.id}><td><b>{item.nama}</b></td><td>{item.username}</td><td>{item.role === "PEMILIK" ? "Pemilik" : "Kasir"}</td><td><span className={`badge ${item.aktif ? "" : "badge-warning"}`}>{item.aktif ? "Aktif" : "Nonaktif"}</span></td><td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.dibuatPada))}</td></tr>)}
    {!users.length && <EmptyRow colSpan={5} />}
  </tbody></table></div>;
}

function PriceHistoryTable({ history, money: formatMoney, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>OBAT</th><th>JENIS</th><th>HARGA LAMA</th><th>HARGA BARU</th><th>DIUBAH OLEH</th></tr></thead><tbody>
    {history.map((item) => <tr key={item.id}><td>{formatDate(item.tanggal)}</td><td><b>{item.produk.namaProduk}</b><small className="cell-sub">{item.produk.kodeBarang || "Tanpa kode"}</small></td><td>{item.jenisHarga === "JUAL" ? "Harga jual" : "Harga beli"}</td><td>{formatMoney(item.hargaLama)}</td><td><b>{formatMoney(item.hargaBaru)}</b></td><td>{item.user.nama}</td></tr>)}
    {!history.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function EmptyRow({ colSpan }) {
  return <tr><td colSpan={colSpan} className="empty-cell">Belum ada data untuk ditampilkan.</td></tr>;
}
