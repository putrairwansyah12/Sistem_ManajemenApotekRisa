if (typeof process.loadEnvFile === "function") process.loadEnvFile();

const fs = require('fs');
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function compare() {
  const extracted = JSON.parse(fs.readFileSync('D:\\sistem apotek risa\\extracted_products.json', 'utf8'));
  const dbProducts = await prisma.produk.findMany({ select: { id: true, namaProduk: true, kodeBarang: true, stok: true, hargaJual: true } });

  const dbByName = new Map();
  for (const p of dbProducts) {
    dbByName.set(p.namaProduk.toLowerCase(), p);
  }

  let matchCount = 0;
  let missingCount = 0;

  for (const ext of extracted) {
    const key = ext.namaItem.toLowerCase();
    if (dbByName.has(key)) {
      matchCount++;
    } else {
      missingCount++;
    }
  }

  console.log(`Matched existing DB products: ${matchCount}`);
  console.log(`Missing in DB: ${missingCount}`);
}

compare()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
