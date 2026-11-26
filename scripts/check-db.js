if (typeof process.loadEnvFile === "function") process.loadEnvFile();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function checkDb() {
  const total = await prisma.produk.count();
  const active = await prisma.produk.count({ where: { aktif: true } });
  const stockGtZero = await prisma.produk.count({ where: { aktif: true, stok: { gt: 0 } } });
  const stockZero = await prisma.produk.count({ where: { aktif: true, stok: { lte: 0 } } });

  console.log(`Total: ${total}, Active: ${active}, With stock > 0: ${stockGtZero}, With stock <= 0: ${stockZero}`);
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
