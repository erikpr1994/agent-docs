import { CACHE_TTL } from "../utils/constants.js";
import { fetchHead } from "../utils/fetch.js";
import { FileCache } from "../cache/file-cache.js";
import type { DocSource } from "./types.js";

function normalizeHomepage(homepage: string): string {
  try {
    const url = new URL(homepage);
    // Only use origin + pathname (drop hash fragments like #readme)
    const base = url.origin + url.pathname;
    return base.replace(/\/+$/, "");
  } catch {
    return homepage.replace(/\/+$/, "");
  }
}

function isLikelyValidLlmsTxt(url: string): boolean {
  // Skip GitHub repo URLs — they return 200 for anything
  // llms.txt should be on the library's own domain
  try {
    const parsed = new URL(url);
    return !parsed.hostname.includes("github.com");
  } catch {
    return true;
  }
}

export async function resolveLlmsTxt(
  packageName: string,
  homepage: string | undefined,
  cache: FileCache,
): Promise<DocSource | null> {
  if (!homepage) return null;

  const cached = await cache.get<DocSource | null>("llms-txt", packageName);
  if (cached !== null) return cached;

  const base = normalizeHomepage(homepage);
  const url = `${base}/llms.txt`;

  if (!isLikelyValidLlmsTxt(url)) return null;

  const result = await fetchHead(url, { timeout: 5000 });
  if (result.ok) {
    const source: DocSource = { type: "llms-txt", url };
    await cache.set("llms-txt", packageName, source, CACHE_TTL.llmsTxt);
    return source;
  }

  // Cache the miss too so we don't re-check
  await cache.set("llms-txt", packageName, null, CACHE_TTL.llmsTxt);
  return null;
}
