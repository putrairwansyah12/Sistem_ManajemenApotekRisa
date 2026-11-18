import { describe, expect, it } from "vitest";
import { isValidPassword } from "./user-validation";

describe("isValidPassword", () => {
  it("accepts passwords of at least 8 characters", () => {
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("a".repeat(200))).toBe(true);
  });

  it("rejects passwords that are too short, too long, or not strings", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("a".repeat(201))).toBe(false);
    expect(isValidPassword(null)).toBe(false);
  });
});
