if (typeof process.loadEnvFile === "function") process.loadEnvFile();

const fs = require('fs');
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function normalizeCategory(raw) {
  if (!raw) return "OBAT UMUM";
  let cat = raw.trim().toUpperCase();
  if (cat === "ETHICAL ETHICAL") cat = "ETHICAL";
  else if (cat === "ALKES ETHICAL") cat = "ALKES";
  else if (cat === "SUPPLEM ENT") cat = "SUPPLEMENT";
  else if (cat === "KONSINYA SI") cat = "KONSINYASI";
  else if (cat === "MNM") cat = "MINUMAN";
  else if (cat === "MKN") cat = "MAKANAN";
  else if (cat === "VIT") cat = "VITAMIN";
  return cat.slice(0, 50);
}

function normalizeUnit(raw) {
  if (!raw) return "PCS";
  let unit = raw.trim().toUpperCase();
  if (unit === "B0X") unit = "BOX";
  else if (unit === "PCS.") unit = "PCS";
  else if (unit === "STRP") unit = "STRIP";
  else if (unit === "TUB") unit = "TUBE";
  else if (unit === "SCHT" || unit === "SACC") unit = "SACHET";
  else if (unit === "BKS") unit = "BUNGKUS";
  else if (unit === "KLG") unit = "KALENG";
  return unit.slice(0, 20);
}

async function importData() {
  console.log("Reading extracted_products.json...");
  const rawProducts = JSON.parse(
    fs.readFileSync("D:\\sistem apotek risa\\extracted_products.json", "utf8")
  );
  console.log(`Loaded ${rawProducts.length} items from extracted PDF data.`);

  // 1. Collect all distinct categories & units
  const categoryNames = new Set(["OBAT UMUM", "Vitamin", "Lainnya"]);
  const unitCodes = new Set(["Tablet", "Strip", "Botol", "Kapsul", "Pcs", "PCS", "BOX", "TUBE", "STRIP", "BTL", "SACHET"]);

  for (const p of rawProducts) {
    categoryNames.add(normalizeCategory(p.jenis));
    unitCodes.add(normalizeUnit(p.satuan));
  }

  console.log(`Upserting ${categoryNames.size} categories and ${unitCodes.size} units...`);

  const categoryMap = new Map();
  for (const nama of categoryNames) {
    const record = await prisma.kategoriObat.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
    categoryMap.set(nama, record.id);
  }

  const unitMap = new Map();
  for (const kode of unitCodes) {
    const record = await prisma.satuan.upsert({
      where: { kode },
      update: {},
      create: { kode },
    });
    unitMap.set(kode, record.id);
  }

  // 2. Fetch existing products from DB
  const existingProducts = await prisma.produk.findMany({
    select: { id: true, namaProduk: true, kodeBarang: true, stok: true },
  });
  console.log(`Fetched ${existingProducts.length} existing products from database.`);

  const existingByName = new Map();
  const usedCodes = new Set();

  for (const ep of existingProducts) {
    existingByName.set(ep.namaProduk.trim().toLowerCase(), ep);
    if (ep.kodeBarang) usedCodes.add(ep.kodeBarang.trim().toLowerCase());
  }

  // 3. Process products to insert or update
  const toUpdateMap = new Map();
  const toCreate = [];

  for (const p of rawProducts) {
    const cleanName = (p.namaItem || p.kodeItem || "OBAT").trim().slice(0, 200);
    const catName = normalizeCategory(p.jenis);
    const unitCode = normalizeUnit(p.satuan);
    const kategoriId = categoryMap.get(catName) || categoryMap.get("OBAT UMUM");
    const satuanId = unitMap.get(unitCode) || unitMap.get("PCS");

    // Stock rule:
    // If in PDF p.stok > 0, use it. If <= 0, set generous default (e.g. 25)
    // so it immediately appears in "Pilih Obat" and can be sold.
    const initialStock = p.stok > 0 ? Math.round(p.stok) : 25;
    const stokMinimum = p.stokMin > 0 ? Math.round(p.stokMin) : 1;

    // Pricing
    let hargaJual = p.hargaJual > 0 ? p.hargaJual : 0;
    let hargaBeli = p.hargaBeli > 0 ? p.hargaBeli : 0;
    if (hargaJual === 0 && hargaBeli > 0) hargaJual = Math.round(hargaBeli * 1.25);
    if (hargaBeli === 0 && hargaJual > 0) hargaBeli = Math.round(hargaJual * 0.8);
    if (hargaJual === 0 && hargaBeli === 0) {
      hargaBeli = 1000;
      hargaJual = 1500;
    }
    const hpp = hargaBeli;

    // Check existing
    const lowerName = cleanName.toLowerCase();
    const existing = existingByName.get(lowerName);

    if (existing && existing.id > 0) {
      // Update existing product stock and pricing
      const newStock = Math.max(existing.stok || 0, initialStock);
      toUpdateMap.set(existing.id, {
        id: existing.id,
        kategoriId,
        satuanId,
        stok: newStock,
        stokMinimum,
        hargaBeli,
        hargaJual,
        hpp,
        aktif: true,
      });
    } else if (!existing) {
      // Determine unique barcode / code
      let desiredCode = null;
      if (p.barcode && p.barcode.trim()) {
        desiredCode = p.barcode.trim().slice(0, 30);
      } else if (p.kodeItem && p.kodeItem.trim() && p.kodeItem.trim() !== cleanName) {
        desiredCode = p.kodeItem.trim().slice(0, 30);
      }

      let finalCode = null;
      if (desiredCode) {
        const lower = desiredCode.toLowerCase();
        if (!usedCodes.has(lower)) {
          finalCode = desiredCode;
          usedCodes.add(lower);
        } else {
          let suffix = 2;
          let candidate = `${desiredCode}-${suffix}`.slice(0, 30);
          while (usedCodes.has(candidate.toLowerCase()) && suffix < 100) {
            suffix++;
            candidate = `${desiredCode}-${suffix}`.slice(0, 30);
          }
          if (!usedCodes.has(candidate.toLowerCase())) {
            finalCode = candidate;
            usedCodes.add(candidate.toLowerCase());
          }
        }
      }

      toCreate.push({
        namaProduk: cleanName,
        kodeBarang: finalCode,
        kategoriId,
        satuanId,
        stok: initialStock,
        stokMinimum,
        hargaBeli,
        hargaJual,
        hpp,
        aktif: true,
      });
      existingByName.set(lowerName, { id: -1, stok: initialStock });
    }
  }

  const toUpdate = Array.from(toUpdateMap.values());
  console.log(`Prepared ${toUpdate.length} unique products to update and ${toCreate.length} products to create.`);

  // 4. Execute updates in chunks
  console.log("Executing updates...");
  let updatedCount = 0;
  const updateChunkSize = 200;
  for (let i = 0; i < toUpdate.length; i += updateChunkSize) {
    const chunk = toUpdate.slice(i, i + updateChunkSize);
    await prisma.$transaction(
      chunk.map((item) =>
        prisma.produk.update({
          where: { id: item.id },
          data: {
            kategoriId: item.kategoriId,
            satuanId: item.satuanId,
            stok: item.stok,
            stokMinimum: item.stokMinimum,
            hargaBeli: item.hargaBeli,
            hargaJual: item.hargaJual,
            hpp: item.hpp,
            aktif: item.aktif,
          },
        })
      )
    );
    updatedCount += chunk.length;
    if (updatedCount % 1000 === 0 || updatedCount === toUpdate.length) {
      console.log(`Updated ${updatedCount}/${toUpdate.length} products...`);
    }
  }

  // 5. Execute creates in chunks using createMany
  console.log("Executing creates...");
  let createdCount = 0;
  const createChunkSize = 100;
  for (let i = 0; i < toCreate.length; i += createChunkSize) {
    const chunk = toCreate.slice(i, i + createChunkSize);
    await prisma.produk.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    createdCount += chunk.length;
    console.log(`Created ${createdCount}/${toCreate.length} new products...`);
  }

  // 6. Verify final count and stock > 0
  const finalTotal = await prisma.produk.count();
  const finalForSale = await prisma.produk.count({
    where: { aktif: true, stok: { gt: 0 } },
  });

  console.log("==========================================");
  console.log("IMPORT COMPLETED SUCCESSFULLY!");
  console.log(`Total Products in DB: ${finalTotal}`);
  console.log(`Products Ready for Sale (stok > 0): ${finalForSale}`);
  console.log("==========================================");
}

importData()
  .catch((err) => {
    console.error("Import error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
