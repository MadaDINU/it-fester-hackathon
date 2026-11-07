import type { TBrandDNA } from "@/lib/contracts";

// Code-level backstop for the Community prompt: a reply that promises an offer, discount,
// price or freebie is dropped unless the brand DNA itself mentions it.
const OFFER_TERMS = [
  "discount",
  "promo",
  "coupon",
  "voucher",
  "% off",
  "free",
  "offer",
  "deal",
  "giveaway",
  "reducere",
  "ofert",
  "gratuit",
  "gratis",
  "cod de",
  "concurs",
];
const PRICE = /(?:[€$£]\s?\d|\d+(?:[.,]\d+)?\s?(?:€|eur|euro|lei|ron|usd|\$))/i;
const DM_FOR_SOMETHING =
  /\b(dm|direct message|message me|send me a message|inbox|mesaj privat|scrie-?mi)\b[^.!?]*\b(offer|deal|discount|code|send you|get you|ofert|reducere|cod|trimit)/i;

export function unsupportedPromise(reply: string, dna: TBrandDNA): string | null {
  const text = reply.toLowerCase();
  const dnaText = JSON.stringify(dna).toLowerCase();
  if (DM_FOR_SOMETHING.test(reply)) return "asks for a DM to receive something";
  const term = OFFER_TERMS.find((t) => text.includes(t) && !dnaText.includes(t));
  if (term) return `mentions "${term}", which is not in the brand DNA`;
  const price = reply.match(PRICE)?.[0];
  if (price && !dnaText.includes(price.toLowerCase())) return `mentions price "${price}"`;
  return null;
}
