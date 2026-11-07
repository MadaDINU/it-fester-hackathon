import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { mockBrand, mockCampaign } from "@/lib/mock/fixtures";
import { renderCreative, toCreativeJpeg } from "./render";

describe("M5 creative renderer", () => {
  it("renders an actual 1080 × 1350 PNG and converts it to JPEG", async () => {
    const response = renderCreative(mockBrand, mockCampaign.variants[0]);
    const png = Buffer.from(await response.arrayBuffer());
    expect(await sharp(png).metadata()).toMatchObject({ format: "png", width: 1080, height: 1350 });
    const jpeg = await toCreativeJpeg(png);
    expect(await sharp(jpeg).metadata()).toMatchObject({ format: "jpeg", width: 1080, height: 1350 });
  }, 20000);
  it("decodes a supported Adobe data URL and rejects malformed or non-image input", async () => {
    const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "white" } }).png().toBuffer();
    const jpeg = await toCreativeJpeg(`data:image/png;base64,${png.toString("base64")}`);
    expect((await sharp(jpeg).metadata()).format).toBe("jpeg");
    await expect(toCreativeJpeg("data:text/plain;base64,aGVsbG8=")).rejects.toThrow();
    await expect(toCreativeJpeg("aGVsbG8=")).rejects.toThrow();
  });
});
