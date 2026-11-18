import { describe, expect, it } from "vitest";
import { getExpiryThresholds, getExpiryWindow } from "./expiry";

describe("getExpiryWindow", () => {
  it("uses UTC day boundaries and calendar-month thresholds", () => {
    const { start, end } = getExpiryWindow(new Date("2026-03-08T16:30:00.000Z"));

    expect(start.toISOString()).toBe("2026-03-08T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-08T00:00:00.000Z");
  });

  it("clamps month-end dates and returns 3- and 6-month thresholds", () => {
    const { start, returEnd, preventifEnd } = getExpiryThresholds(new Date("2026-08-31T12:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-08-31T00:00:00.000Z");
    expect(returEnd.toISOString()).toBe("2026-11-30T00:00:00.000Z");
    expect(preventifEnd.toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });

  it("rejects an invalid month range", () => {
    expect(() => getExpiryWindow(new Date(), -1)).toThrow(RangeError);
  });
});
