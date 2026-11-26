import { describe, expect, it } from "vitest";
import { assertBatchStockFitsProductStock, getStockAvailability } from "./inventory";

describe("assertBatchStockFitsProductStock", () => {
  it("allows stock changes that preserve all recorded batch quantities", () => {
    expect(() => assertBatchStockFitsProductStock(12, 8)).not.toThrow();
    expect(() => assertBatchStockFitsProductStock(8, 8)).not.toThrow();
  });

  it("rejects stock changes below the recorded batch quantity", () => {
    expect(() => assertBatchStockFitsProductStock(7, 8)).toThrow(/total stok batch/);
  });
});

describe("getStockAvailability", () => {
  const now = new Date("2026-11-18T12:00:00.000Z");

  it("counts legacy unbatched stock and non-expired batches as sellable", () => {
    expect(getStockAvailability(12, [
      { jumlah: 5, tanggalKedaluwarsa: "2026-12-01T00:00:00.000Z" },
      { jumlah: 2, tanggalKedaluwarsa: "2026-10-01T00:00:00.000Z" },
    ], now)).toEqual({ unbatchedStock: 5, sellableBatchStock: 5, sellableStock: 10 });
  });

  it("rejects batch balances that exceed aggregate product stock", () => {
    expect(() => getStockAvailability(4, [
      { jumlah: 5, tanggalKedaluwarsa: "2026-12-01T00:00:00.000Z" },
    ], now)).toThrow(RangeError);
  });

  it("rejects batches with invalid expiry dates", () => {
    expect(() => getStockAvailability(1, [
      { jumlah: 1, tanggalKedaluwarsa: "invalid" },
    ], now)).toThrow(/Tanggal kedaluwarsa/);
  });
});
