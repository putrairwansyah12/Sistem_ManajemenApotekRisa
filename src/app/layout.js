import "./globals.css";

export const metadata = {
  title: "Apotek Risa | Sistem Informasi Manajemen",
  description: "Pengelolaan persediaan, transaksi, dan laporan Apotek Risa.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
