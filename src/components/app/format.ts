// Display formatting for numbers that come from the API. Rounding happens here, at display time,
// because stored values can carry float noise (e.g. a panel score of 58.00000000000001).
// Every helper returns "—" for null, undefined or non-finite input.
export const EMPTY = "—";
type Num = number | null | undefined;
const ok = (n: Num): n is number => typeof n === "number" && Number.isFinite(n);
const fmt = (n: number, locale: string, opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, { minimumFractionDigits: 0, ...opts }).format(n);

/** Whole-number score: 58.00000000000001 → "58". */
export function formatScore(n: Num, locale = "en-US") { return ok(n) ? fmt(Math.round(n), locale, { maximumFractionDigits: 0 }) : EMPTY; }

/** A ratio as a percentage with at most one decimal: 0.082 → "8.2%", 0.08 → "8%".
 *  Pass `{ alreadyPercent: true }` when the value is already in percent (8.2 → "8.2%"). */
export function formatPercent(n: Num, locale = "en-US", { alreadyPercent = false } = {}) {
  return ok(n) ? fmt(alreadyPercent ? n / 100 : n, locale, { style: "percent", maximumFractionDigits: 1 }) : EMPTY;
}

/** Euros: from €1 up, 0 or 2 decimals (€221, €19.50); below €1, 2–3 significant digits (€0.93, €0.039). */
export function formatMoney(n: Num, locale = "en-US") {
  if (!ok(n)) return EMPTY;
  const base = { style: "currency", currency: "EUR" } as const;
  if (Math.abs(n) >= 1) return fmt(n, locale, { ...base, ...(Number.isInteger(Math.round(n * 100) / 100) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
  if (n === 0) return fmt(0, locale, { ...base, maximumFractionDigits: 0 });
  return fmt(n, locale, { ...base, minimumSignificantDigits: 2, maximumSignificantDigits: 3 });
}

/** Hours with at most one decimal: 48.0 → "48 h", 1.5 → "1.5 h". */
export function formatHours(n: Num, locale = "en-US") { return ok(n) ? `${fmt(n, locale, { maximumFractionDigits: 1 })} h` : EMPTY; }

/** Integer count with grouping: 134585 → "134,585" (en-US) / "134.585" (ro-RO). */
export function formatCount(n: Num, locale = "en-US") { return ok(n) ? fmt(Math.round(n), locale, { maximumFractionDigits: 0, useGrouping: "always" } as Intl.NumberFormatOptions) : EMPTY; }

/** Model fit, always two decimals: 0.8912 → "0.89". */
export function formatR2(n: Num, locale = "en-US") { return ok(n) ? fmt(n, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : EMPTY; }

/** ROI multiple: 1533.4 → "×1,533". */
export function formatMultiple(n: Num, locale = "en-US") { return ok(n) ? `×${formatCount(n, locale)}` : EMPTY; }
