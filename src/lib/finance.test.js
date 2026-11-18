import { describe, expect, it } from "vitest";
import { calculateFinanceReport, getFinancePeriodRange, parseBusinessDate } from "./finance";

describe("finance date helpers", () => {
  it("uses Jakarta midnight boundaries, including month and year rollover", () => {
    const day = getFinancePeriodRange("day", "2026-01-01");
    expect(day.start.toISOString()).toBe("2025-12-31T17:00:00.000Z");
    expect(day.end.toISOString()).toBe("2026-01-01T17:00:00.000Z");

    const month = getFinancePeriodRange("month", "2024-02-18");
    expect(month.startDate).toBe("2024-02-01");
    expect(month.endDate).toBe("2024-03-01");
    expect(month.bucketKeys).toHaveLength(29);

    const year = getFinancePeriodRange("year", "2026-11-18");
    expect(year.startDate).toBe("2026-01-01");
    expect(year.endDate).toBe("2027-01-01");
    expect(year.bucketKeys).toHaveLength(12);
  });

  it("rejects malformed or impossible business dates", () => {
    expect(() => parseBusinessDate("2026-2-01")).toThrow(RangeError);
    expect(() => parseBusinessDate("2026-02-30")).toThrow(RangeError);
    expect(() => getFinancePeriodRange("week", "2026-02-01")).toThrow(RangeError);
  });
});

describe("calculateFinanceReport", () => {
  it("sums line gross profit, transaction deductions, and operating costs by date", () => {
    const range = getFinancePeriodRange("month", "2026-04-15");
    const report = calculateFinanceReport(
      range,
      [
        {
          tanggal: new Date("2026-04-15T16:59:59.999Z"),
          total: "110.00",
          potongan: "5",
          biayaAdmin: "2",
          biayaPajak: "1",
          biayaPengemasan: "3",
          biayaLayanan: "4",
          biayaGratisOngkir: "5",
          detail: [
            { hargaSatuan: "60", hppSatuan: "40", jumlah: 2 },
            { hargaSatuan: "10", hppSatuan: "4", jumlah: 1 },
          ],
        },
      ],
      [{ tanggal: new Date("2026-04-15T16:59:59.999Z"), jumlah: "10" }],
    );

    expect(report.omzet).toBe(110);
    expect(report.jumlahTransaksi).toBe(1);
    expect(report.jumlahKunjungan).toBe(1);
    expect(report.labaKotor).toBe(46);
    expect(report.biayaOperasional).toBe(10);
    expect(report.labaBersih).toBe(16);
    expect(report.data.find(({ periode }) => periode === "2026-04-15").labaBersih).toBe(16);
  });
});
