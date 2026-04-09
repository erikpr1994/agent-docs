import { FETCH_TIMEOUT_MS, MAX_RETRIES, USER_AGENT } from "./constants.js";
import { debug, warn } from "./logger.js";

export interface FetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function fetchJson<T>(
  url: string,
  options: { timeout?: number; retries?: number } = {},
): Promise<FetchResult<T>> {
  const timeout = options.timeout ?? FETCH_TIMEOUT_MS;
  const maxRetries = options.retries ?? MAX_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      debug(`fetch ${url} (attempt ${attempt + 1})`);
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        return { ok: false, status: 429, error: "rate limited" };
      }

      if (!res.ok) {
        if (attempt < maxRetries && res.status >= 500) continue;
        return { ok: false, status: res.status, error: `HTTP ${res.status}` };
      }

      const data = (await res.json()) as T;
      return { ok: true, status: res.status, data };
    } catch (err) {
      if (attempt < maxRetries) {
        debug(`retry ${url} after error: ${err}`);
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, status: 0, error: msg };
    }
  }

  return { ok: false, status: 0, error: "max retries exceeded" };
}

export async function fetchHead(
  url: string,
  options: { timeout?: number } = {},
): Promise<{ ok: boolean; status: number }> {
  const timeout = options.timeout ?? FETCH_TIMEOUT_MS;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    debug(`HEAD ${url}`);
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
