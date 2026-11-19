import "./globals.css";

export const metadata = {
  title: "Apotek Risa | Sistem Informasi Manajemen",
  description: "Pengelolaan persediaan, transaksi, dan laporan Apotek Risa.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
