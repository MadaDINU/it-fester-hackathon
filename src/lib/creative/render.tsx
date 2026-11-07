import React from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { TBrand, TVariant } from "@/lib/contracts";

export function renderCreative(brand: Pick<TBrand, "name" | "dna"> & { instagram: { username: string } | null }, variant: TVariant) {
  const headline = variant.format === "reel" ? variant.reelScript?.coverText || variant.imageHeadline : variant.imageHeadline;
  const el = React.createElement;
  return new ImageResponse(
    el("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 90, color: "white", background: `linear-gradient(145deg, ${brand.dna.colors[0]}, ${brand.dna.colors[1]})`, fontFamily: "sans-serif" } },
      el("div", { style: { display: "flex", fontSize: 32, fontWeight: 700, background: "#171324", padding: "18px 28px", borderRadius: 50, alignSelf: "flex-start" } }, brand.instagram ? `@${brand.instagram.username}` : brand.name),
      el("div", { style: { display: "flex", flexDirection: "column", background: "rgba(12,8,28,0.78)", borderRadius: 32, padding: 48 } },
        el("div", { style: { display: "flex", fontSize: headline.length > 70 ? 64 : 90, fontWeight: 700, lineHeight: 1.08, letterSpacing: -3, overflowWrap: "break-word" } }, headline.slice(0, 220)),
        el("div", { style: { display: "flex", marginTop: 40, fontSize: 28, lineHeight: 1.4 } }, brand.dna.valueProposition.slice(0, 180))),
      el("div", { style: { display: "flex", background: "white", color: "#21172f", borderRadius: 50, padding: "24px 32px", fontSize: 28, fontWeight: 700, alignSelf: "flex-start" } }, variant.cta.slice(0, 100))),
    { width: 1080, height: 1350 },
  );
}

export async function toCreativeJpeg(input: Buffer | string) {
  let bytes: Buffer;
  if (typeof input === "string") {
    const match = /^(?:data:image\/(?:png|jpeg|webp);base64,)?([A-Za-z0-9+/]+={0,2})$/.exec(input);
    if (!match || match[1].length % 4 !== 0 || match[1].length > 14_000_000) throw new Error("Invalid imageBase64");
    bytes = Buffer.from(match[1], "base64");
  } else bytes = input;
  if (bytes.length > 10_000_000) throw new Error("Image exceeds 10 MB");
  const image = sharp(bytes, { limitInputPixels: 20_000_000, animated: false });
  const metadata = await image.metadata();
  if (!metadata.format || !["png", "jpeg", "webp"].includes(metadata.format)) throw new Error("Unsupported image format");
  return image.rotate().resize(1080, 1350, { fit: "cover" }).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
}
