import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { CACHE_DIR } from "../utils/constants.js";
import { debug } from "../utils/logger.js";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class FileCache {
  private cacheDir: string;
  private noCache: boolean;

  constructor(projectDir: string, noCache = false) {
    this.cacheDir = join(projectDir, CACHE_DIR);
    this.noCache = noCache;
  }

  async get<T>(resolver: string, key: string): Promise<T | null> {
    if (this.noCache) return null;

    const path = this.path(resolver, key);
    try {
      const raw = await readFile(path, "utf-8");
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > entry.ttl) {
        debug(`cache expired: ${resolver}/${key}`);
        return null;
      }
      debug(`cache hit: ${resolver}/${key}`);
      return entry.data;
    } catch {
      return null;
    }
  }

  async set<T>(resolver: string, key: string, data: T, ttl: number) {
    const path = this.path(resolver, key);
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(entry), "utf-8");
  }

  private path(resolver: string, key: string): string {
    // Sanitize key for filesystem
    const safeKey = key.replace(/[/@]/g, "_");
    return join(this.cacheDir, resolver, `${safeKey}.json`);
  }
}
