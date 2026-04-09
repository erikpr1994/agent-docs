import {
  CONTEXT7_API_URL,
  CONTEXT7_PAUSE_THRESHOLD,
  CACHE_TTL,
} from "../utils/constants.js";
import { fetchJson } from "../utils/fetch.js";
import { debug, warn } from "../utils/logger.js";
import { FileCache } from "../cache/file-cache.js";
import type { DocSource } from "./types.js";

interface Context7SearchResponse {
  libraries?: Array<{
    id: string;
    name?: string;
    description?: string;
  }>;
}

// Simple in-memory rate limiter
let requestTimestamps: number[] = [];
let rateLimited = false;

function canRequest(): boolean {
  if (rateLimited) return false;
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  requestTimestamps = requestTimestamps.filter((t) => t > oneHourAgo);
  return requestTimestamps.length < CONTEXT7_PAUSE_THRESHOLD;
}

function recordRequest() {
  requestTimestamps.push(Date.now());
}

export function resetRateLimiter() {
  requestTimestamps = [];
  rateLimited = false;
}

export async function resolveContext7(
  packageName: string,
  cache: FileCache,
  apiKey?: string,
): Promise<DocSource | null> {
  const cached = await cache.get<DocSource | null>("context7", packageName);
  if (cached !== null) return cached;

  if (!canRequest()) {
    debug(`context7: skipping ${packageName} (rate limit approaching)`);
    return null;
  }

  const url = `${CONTEXT7_API_URL}/libs/search?libraryName=${encodeURIComponent(packageName)}`;
  const headers: Record<string, string> = {};
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  recordRequest();
  const result = await fetchJson<Context7SearchResponse>(url);

  if (result.status === 429) {
    warn("context7: rate limited, skipping remaining lookups");
    rateLimited = true;
    return null;
  }

  if (!result.ok || !result.data?.libraries?.length) {
    await cache.set("context7", packageName, null, CACHE_TTL.context7);
    return null;
  }

  const lib = result.data.libraries[0];
  const source: DocSource = {
    type: "context7",
    identifier: lib.id,
  };

  await cache.set("context7", packageName, source, CACHE_TTL.context7);
  return source;
}
