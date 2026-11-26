if (typeof process.loadEnvFile === "function") process.loadEnvFile();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function checkBatches() {
  const batchCount = await prisma.batchProduk.count();
  console.log(`Total BatchProduk in DB: ${batchCount}`);
}

checkBatches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
