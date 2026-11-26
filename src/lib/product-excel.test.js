import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  PRODUCT_COLUMNS,
  parseProductWorkbook,
  planProductImport,
} from "./product-excel";

async function workbookBuffer(rows, headers = PRODUCT_COLUMNS) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Produk");
  worksheet.addRow(headers);
  for (const row of rows) worksheet.addRow(row);
  return workbook.xlsx.writeBuffer();
}

const existingProduct = {
  id: 7,
  kodeBarang: "A-7",
  namaProduk: "Vitamin C",
  kategori: { nama: "Vitamin" },
  satuan: { kode: "Botol" },
};

describe("product Excel import", () => {
  it("parses the stable column order and validates each data row", async () => {
    const rows = await parseProductWorkbook(await workbookBuffer([
      ["A-7", "Vitamin C", "Vitamin", "Botol", 100, 110, 150, 12, 2],
      ["", "Produk", "Kategori", "Box", -1, 0, "x", 1.5, 0],
    ]));

    expect(rows[0]).toEqual({
      row: 2,
      product: {
        kodeBarang: "A-7",
        namaProduk: "Vitamin C",
        kategori: "Vitamin",
        satuan: "Botol",
        hargaBeli: 100,
        hpp: 110,
        hargaJual: 150,
        stok: 12,
        stokMinimum: 2,
      },
      errors: [],
    });
    expect(rows[1].errors).toHaveLength(3);
    expect(rows[1].errors.join(" ")).toMatch(/hargaBeli.*hargaJual.*stok/);
  });

  it("rejects a workbook with reordered headers", async () => {
    await expect(parseProductWorkbook(await workbookBuffer([], [...PRODUCT_COLUMNS].reverse())))
      .rejects.toThrow(/Header harus tepat sesuai urutan/);
  });

  it("rejects non-decimal numeric text and accepts decimal text", async () => {
    const rows = await parseProductWorkbook(await workbookBuffer([
      ["", "Produk", "Kategori", "Box", "0x10", "12.50", "1e3", "2", "0"],
    ]));

    expect(rows[0].product.hpp).toBe(12.5);
    expect(rows[0].errors.join(" ")).toMatch(/hargaBeli.*hargaJual/);
  });

  it("uses codes first and flags ambiguous normalized name matches", async () => {
    const parsedRows = [
      {
        row: 2,
        product: {
          kodeBarang: "A-7",
          namaProduk: "Nama Baru",
          kategori: "Lainnya",
          satuan: "Box",
        },
        errors: [],
      },
      {
        row: 3,
        product: {
          kodeBarang: "",
          namaProduk: "  vitamin   c ",
          kategori: "VITAMIN",
          satuan: "botol",
        },
        errors: [],
      },
    ];
    const planned = planProductImport(parsedRows, [
      existingProduct,
      { ...existingProduct, id: 8, kodeBarang: "A-8" },
    ]);

    expect(planned[0]).toMatchObject({ action: "update", productId: 7 });
    expect(planned[1].action).toBe("ambiguous");
    expect(planned[1].errors).toHaveLength(1);
  });

  it("does not allow two rows to update the same product", () => {
    const parsedRows = [2, 3].map((row) => ({
      row,
      product: { kodeBarang: "A-7", namaProduk: "Vitamin C", kategori: "Vitamin", satuan: "Botol" },
      errors: [],
    }));

    expect(planProductImport(parsedRows, [existingProduct]).map((row) => row.action))
      .toEqual(["update", "invalid"]);
  });

  it("rejects imported stock below the total recorded batch stock", () => {
    const planned = planProductImport([{
      row: 2,
      product: {
        kodeBarang: "A-7",
        namaProduk: "Vitamin C",
        kategori: "Vitamin",
        satuan: "Botol",
        stok: 4,
      },
      errors: [],
    }], [{
      ...existingProduct,
      stok: 10,
      batch: [{ jumlah: 5 }, { jumlah: 3 }],
    }]);

    expect(planned[0].action).toBe("invalid");
    expect(planned[0].stokSebelum).toBe(10);
    expect(planned[0].errors).toEqual([
      "Stok Excel tidak boleh lebih kecil dari total stok batch (8).",
    ]);
  });
});
