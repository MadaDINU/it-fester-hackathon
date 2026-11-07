import { describe, expect, it } from "vitest";
import { formatCount, formatHours, formatMoney, formatMultiple, formatPercent, formatR2, formatScore } from "./format";

describe("format helpers", () => {
  it("rounds scores", () => {
    expect(formatScore(58.00000000000001)).toBe("58");
    expect(formatScore((0.1 + 0.2) * 100)).toBe("30");
    expect(formatScore(0)).toBe("0");
    expect(formatScore(-3.6)).toBe("-4");
  });
  it("formats percentages with at most one decimal", () => {
    expect(formatPercent(0.082)).toBe("8.2%");
    expect(formatPercent(0.08)).toBe("8%");
    expect(formatPercent(0.1 + 0.2)).toBe("30%");
    expect(formatPercent(8.2, "en-US", { alreadyPercent: true })).toBe("8.2%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(-0.05)).toBe("-5%");
  });
  it("formats money", () => {
    expect(formatMoney(221)).toBe("€221");
    expect(formatMoney(19.5)).toBe("€19.50");
    expect(formatMoney(0.93)).toBe("€0.93");
    expect(formatMoney(0.039)).toBe("€0.039");
    expect(formatMoney(0)).toBe("€0");
  });
  it("formats hours, counts, R² and multiples", () => {
    expect(formatHours(48.0)).toBe("48 h");
    expect(formatHours(1.5)).toBe("1.5 h");
    expect(formatCount(134585)).toBe("134,585");
    expect(formatCount(134585, "ro-RO")).toBe("134.585");
    expect(formatR2(0.8912)).toBe("0.89");
    expect(formatMultiple(1533.4)).toBe("×1,533");
  });
  it("shows a dash for missing or invalid numbers", () => {
    for (const f of [formatScore, formatPercent, formatMoney, formatHours, formatCount, formatR2]) {
      expect(f(null)).toBe("—"); expect(f(undefined)).toBe("—"); expect(f(Number.NaN)).toBe("—");
    }
  });
});
