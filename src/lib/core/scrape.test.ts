import { describe, expect, it } from "vitest";
import { assertPublicUrl, extractText, isPrivateAddress, UnreachableUrlError } from "@/lib/core/scrape";

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254",
    "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1",
    "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:169.254.169.254", "64:ff9b::a00:1", "ff02::1",
  ])("blocks %s", (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(["8.8.8.8", "172.32.0.1", "93.184.216.34", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "allows %s",
    (ip) => expect(isPrivateAddress(ip)).toBe(false),
  );
});

describe("assertPublicUrl", () => {
  it.each([
    "ftp://example.com/",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "not a url",
    "http://localhost:3000/",
    "http://foo.localhost/",
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://10.0.0.5/admin",
    "http://169.254.169.254/latest/meta-data/",
    "http://2130706433/", // decimal form of 127.0.0.1, normalised by URL
    "http://user:pass@example.com/",
  ])("refuses %s", async (url) => {
    await expect(assertPublicUrl(url)).rejects.toBeInstanceOf(UnreachableUrlError);
  });

  it("accepts a public IP literal", async () => {
    expect((await assertPublicUrl("https://8.8.8.8/")).hostname).toBe("8.8.8.8");
  });
});

describe("extractText", () => {
  it("drops scripts and caps the length", () => {
    const html = `<html><head><title>Cafe</title><meta name="description" content="Good coffee"></head>
      <body><script>evil()</script><p>${"word ".repeat(3000)}</p></body></html>`;
    const text = extractText(html);
    expect(text.startsWith("Title: Cafe Description: Good coffee")).toBe(true);
    expect(text).not.toContain("evil");
    expect(text.length).toBeLessThanOrEqual(6000);
  });
});
