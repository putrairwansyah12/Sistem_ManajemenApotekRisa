import { describe, expect, it } from "vitest";
import { calculatePrice, getCalculatorHpp } from "./pricing";

describe("calculatePrice", () => {
  it("uses the saved HPP before purchase price", () => {
    expect(getCalculatorHpp({ hpp: "1200.00", hargaBeli: "1000.00" })).toEqual({
      value: 1200,
      source: "hpp",
    });
  });

  it("falls back to purchase price when saved HPP is zero", () => {
    expect(getCalculatorHpp({ hpp: "0", hargaBeli: "1000.00" })).toEqual({
      value: 1000,
      source: "hargaBeli",
    });
  });

  it("calculates a whole-rupiah selling price and net profit", () => {
    expect(calculatePrice({
      hpp: 100,
      persenBiayaAdmin: 10,
      persenPajak: 0,
      biayaPengemasan: 20,
      biayaLayanan: 10,
      biayaGratisOngkir: 0,
      persenTargetLaba: 20,
    })).toEqual({
      hpp: 100,
      persenBiayaAdmin: 10,
      persenPajak: 0,
      biayaPengemasan: 20,
      biayaLayanan: 10,
      biayaGratisOngkir: 0,
      persenTargetLaba: 20,
      hargaJual: 186,
      labaKotor: 86,
      labaBersih: 37.4,
    });
  });

  it("includes tax and shipping in price and profit calculations", () => {
    expect(calculatePrice({
      hpp: 100,
      persenBiayaAdmin: 10,
      persenPajak: 5,
      biayaPengemasan: 10,
      biayaLayanan: 5,
      biayaGratisOngkir: 15,
      persenTargetLaba: 20,
    })).toEqual({
      hpp: 100,
      persenBiayaAdmin: 10,
      persenPajak: 5,
      biayaPengemasan: 10,
      biayaLayanan: 5,
      biayaGratisOngkir: 15,
      persenTargetLaba: 20,
      hargaJual: 200,
      labaKotor: 100,
      labaBersih: 40,
    });
  });

  it("rejects combined admin, tax, and profit target of 100 percent", () => {
    expect(() => calculatePrice({
      hpp: 100,
      persenBiayaAdmin: 80,
      persenPajak: 0,
      biayaPengemasan: 0,
      biayaLayanan: 0,
      biayaGratisOngkir: 0,
      persenTargetLaba: 20,
    })).toThrow(/kurang dari 100%/);
  });

  it("rejects negative values and percentages with excess precision", () => {
    const input = {
      hpp: 100,
      persenBiayaAdmin: 10,
      persenPajak: 0,
      biayaPengemasan: 0,
      biayaLayanan: 0,
      biayaGratisOngkir: 0,
      persenTargetLaba: 10,
    };
    expect(() => calculatePrice({ ...input, hpp: -1 })).toThrow(/HPP/);
    expect(() => calculatePrice({ ...input, persenBiayaAdmin: 1.234 })).toThrow(/dua angka desimal/);
  });
});
