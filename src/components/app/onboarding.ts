import { AnalyzeBrandRequest } from "@/lib/contracts";

export function websiteRequest(name: string, url: string, description: string) {
  return AnalyzeBrandRequest.parse({ name: name.trim(), ...(url.trim() ? { url: url.trim() } : {}), ...(description.trim() ? { description: description.trim() } : {}) });
}
