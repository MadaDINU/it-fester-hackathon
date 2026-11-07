import { lookup as dnsLookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

export const MAX_TEXT_CHARS = 6000;
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

// Raised when a website cannot be fetched (bad, unsafe or unreachable URL). The route answers 422
// "unreachable_url" so the UI can ask the user for a description instead.
export class UnreachableUrlError extends Error {
  name = "UnreachableUrlError";
}

function isPrivateIPv4(a: number, b: number): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || // link-local, includes the 169.254.169.254 metadata endpoint
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function ipv6Groups(address: string): number[] | null {
  let addr = address.split("%")[0].toLowerCase();
  const tail = addr.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (tail) {
    const [, a, b, c, d] = tail.map(Number);
    addr = addr.slice(0, tail.index) + ((a << 8) | b).toString(16) + ":" + ((c << 8) | d).toString(16);
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const zeros = Array<string>(halves.length === 2 ? missing : 0).fill("0");
  const groups = [...head, ...zeros, ...rest].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => g >= 0 && g <= 0xffff) ? groups : null;
}

// True for loopback, private, link-local, metadata, multicast and otherwise non-public addresses.
export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    return isPrivateIPv4(a, b);
  }
  if (family === 6) {
    const g = ipv6Groups(address);
    if (!g) return true;
    const embedded = (hi: number) => isPrivateIPv4(hi >> 8, hi & 0xff);
    if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) {
      if (g[5] === 0 && g[6] === 0 && g[7] <= 1) return true; // :: and ::1
      return embedded(g[6]); // ::ffff:a.b.c.d (mapped) and ::a.b.c.d (compatible)
    }
    if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return embedded(g[6]); // NAT64
    if (g[0] === 0x2002) return embedded(g[1]); // 6to4
    if ((g[0] & 0xfe00) === 0xfc00) return true; // unique local
    if ((g[0] & 0xffc0) === 0xfe80) return true; // link-local
    if ((g[0] & 0xff00) === 0xff00) return true; // multicast
    return false;
  }
  return true;
}

const BLOCKED_HOST = /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/;

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new UnreachableUrlError("URL points to a private address");
    return;
  }
  if (BLOCKED_HOST.test(host)) throw new UnreachableUrlError("URL points to a private host");
  let addresses: Array<{ address: string }>;
  try {
    addresses = await dnsLookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnreachableUrlError("Website host could not be resolved");
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new UnreachableUrlError("URL resolves to a private address");
  }
}

// Validates scheme and host (including DNS resolution). Throws UnreachableUrlError when unsafe.
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnreachableUrlError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnreachableUrlError("Only http and https URLs are supported");
  }
  if (url.username || url.password) throw new UnreachableUrlError("URLs with credentials are not allowed");
  await assertPublicHost(url.hostname);
  return url;
}

// The connection re-validates the resolved addresses, which closes the DNS-rebinding gap
// between the pre-check and the actual connect.
const safeLookup = ((hostname: string, options: { all?: boolean }, cb: (...args: unknown[]) => void) => {
  dnsLookup(hostname, { all: true, verbatim: true }).then(
    (addresses) => {
      if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
        cb(new UnreachableUrlError("URL resolves to a private address"));
      } else if (options?.all) cb(null, addresses);
      else cb(null, addresses[0].address, addresses[0].family);
    },
    (err) => cb(err),
  );
}) as unknown as NonNullable<http.RequestOptions["lookup"]>;

type Page = { status: number; location: string | null; contentType: string; body: string };

function requestOnce(url: URL, deadline: number): Promise<Page> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new UnreachableUrlError("Website took too long to respond"));
    const client = url.protocol === "https:" ? https : http;
    const req = client.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; LoopwiseBot/1.0)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-encoding": "identity",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = typeof res.headers.location === "string" ? res.headers.location : null;
        const contentType = String(res.headers["content-type"] ?? "");
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, location, contentType, body: "" });
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          chunks.push(chunk);
          if (size > MAX_BYTES) res.destroy(); // keep what we have; 2 MB is plenty of text
        });
        const finish = () =>
          resolve({
            status,
            location,
            contentType,
            body: Buffer.concat(chunks).subarray(0, MAX_BYTES).toString("utf8"),
          });
        res.on("end", finish);
        res.on("close", finish);
        res.on("error", finish);
      },
    );
    const timer = setTimeout(
      () => req.destroy(new UnreachableUrlError("Website took too long to respond")),
      remaining,
    );
    req.on("close", () => clearTimeout(timer));
    req.on("error", (err) =>
      reject(
        err instanceof UnreachableUrlError
          ? err
          : new UnreachableUrlError(`Website could not be fetched: ${err.message}`),
      ),
    );
    req.end();
  });
}

async function fetchHtml(rawUrl: string): Promise<string> {
  const deadline = Date.now() + TIMEOUT_MS;
  let url = await assertPublicUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const page = await requestOnce(url, deadline);
    if (page.status >= 300 && page.status < 400) {
      if (!page.location) throw new UnreachableUrlError("Website redirected without a location");
      if (hop === MAX_REDIRECTS) break;
      url = await assertPublicUrl(new URL(page.location, url).toString());
      continue;
    }
    if (page.status < 200 || page.status >= 300) {
      throw new UnreachableUrlError(`Website answered with status ${page.status}`);
    }
    if (page.contentType && !/html|xml|text\/plain/i.test(page.contentType)) {
      throw new UnreachableUrlError("URL is not a web page");
    }
    return page.body;
  }
  throw new UnreachableUrlError("Website redirected too many times");
}

export function extractText(html: string, maxChars = MAX_TEXT_CHARS): string {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const description = (
    $('meta[name="description"]').attr("content") ??
    $('meta[property="og:description"]').attr("content") ??
    ""
  ).trim();
  $("script, style, noscript, svg, iframe, template, head").remove();
  const text = [title && `Title: ${title}`, description && `Description: ${description}`, $("body").text()]
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxChars);
}

// Fetches a public web page and returns its visible text (at most 6 000 characters).
export async function scrapeWebsite(url: string): Promise<string> {
  return extractText(await fetchHtml(url));
}
