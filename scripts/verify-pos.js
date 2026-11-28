if (typeof process.loadEnvFile === "function") process.loadEnvFile();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function verify() {
  const productInclude = { kategori: true, satuan: true };

  // Exactly what /api/products?untukPenjualan=true queries
  const forSaleProducts = await prisma.produk.findMany({
    where: { aktif: true, stok: { gt: 0 } },
    include: productInclude,
    orderBy: { namaProduk: "asc" },
  });

  console.log(`\nVerified /api/products?untukPenjualan=true:`);
  console.log(`Found ${forSaleProducts.length} items ready for sale.`);
  console.log(`Sample first 10 items:`);
  for (const p of forSaleProducts.slice(0, 10)) {
    console.log(`- [${p.kodeBarang || 'NO CODE'}] ${p.namaProduk} | ${p.kategori.nama} | Stok: ${p.stok} ${p.satuan.kode} | Rp ${Number(p.hargaJual).toLocaleString('id-ID')}`);
  }

  // Check some specific items from the PDF
  const testNames = ["ACDAT", "ACETYLCYSTEINE", "ACTIFED", "ADEM SARI", "AKILEN", "BODREX", "PARACETAMOL", "AMOXICILLIN"];
  console.log(`\nChecking specific search terms in POS list:`);
  for (const term of testNames) {
    const matched = forSaleProducts.filter(p => p.namaProduk.toLowerCase().includes(term.toLowerCase()));
    console.log(`Query "${term}": found ${matched.length} items. First match: ${matched[0]?.namaProduk} (Stok: ${matched[0]?.stok}, Rp ${Number(matched[0]?.hargaJual || 0).toLocaleString('id-ID')})`);
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
