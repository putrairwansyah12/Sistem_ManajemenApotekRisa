// prisma/seed.js
if (typeof process.loadEnvFile === "function") process.loadEnvFile();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL wajib diatur sebelum menjalankan seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const devUsername = process.env.APOTEKRISA_DEV_ACCOUNT_EMAIL?.trim();
  const devPassword = process.env.APOTEKRISA_DEV_ACCOUNT_PASSWORD;
  const devName = process.env.APOTEKRISA_DEV_ACCOUNT_NAME?.trim();
  const configuredRole = process.env.APOTEKRISA_DEV_ACCOUNT_ROLE?.trim().toUpperCase();
  const devRole = { ADMIN: "PEMILIK", OWNER: "PEMILIK", CASHIER: "KASIR" }[configuredRole] || configuredRole;
  if (!devUsername || !devPassword || !devName || !devRole) {
    throw new Error("APOTEKRISA_DEV_ACCOUNT_EMAIL, PASSWORD, NAME, dan ROLE harus diatur.");
  }
  if (devUsername.length > 50 || devName.length > 100 || devPassword.length < 12 || devPassword.length > 200) {
    throw new Error("Username/nama terlalu panjang atau password akun uji coba tidak memenuhi syarat.");
  }
  if (!["PEMILIK", "KASIR"].includes(devRole)) {
    throw new Error("APOTEKRISA_DEV_ACCOUNT_ROLE harus bernilai PEMILIK atau KASIR.");
  }

  for (const nama of ["Obat Umum", "Vitamin", "Lainnya"]) {
    await prisma.kategoriObat.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }
  for (const kode of ["Tablet", "Strip", "Botol", "Kapsul", "Pcs"]) {
    await prisma.satuan.upsert({
      where: { kode },
      update: {},
      create: { kode },
    });
  }

  const devPasswordHash = await bcrypt.hash(devPassword, 12);
  await prisma.user.upsert({
    where: { username: devUsername },
    update: {
      nama: devName,
      passwordHash: devPasswordHash,
      role: devRole,
      aktif: true,
    },
    create: {
      nama: devName,
      username: devUsername,
      passwordHash: devPasswordHash,
      role: devRole,
    },
  });

  if (process.env.OWNER_PASSWORD) {
    if (process.env.OWNER_PASSWORD.length < 12 || process.env.OWNER_PASSWORD.length > 200) {
      throw new Error("OWNER_PASSWORD harus memiliki 12–200 karakter.");
    }
    const passwordHash = await bcrypt.hash(process.env.OWNER_PASSWORD, 12);
    await prisma.user.upsert({
      where: { username: "pemilik" },
      update: {},
      create: {
        nama: "Pemilik Apotek",
        username: "pemilik",
        passwordHash,
        role: "PEMILIK",
      },
    });
  }

  console.log(`Kategori, satuan, dan akun uji coba (${devRole}) berhasil disiapkan.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());