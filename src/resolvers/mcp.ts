import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CACHE_TTL } from "../utils/constants.js";
import { debug } from "../utils/logger.js";
import { FileCache } from "../cache/file-cache.js";
import type { DocSource } from "./types.js";

interface KnownMcp {
  command?: string;
  endpoint?: string;
}

let knownMcps: Record<string, KnownMcp> | null = null;

async function loadKnownMcps(): Promise<Record<string, KnownMcp>> {
  if (knownMcps) return knownMcps;

  try {
    // Try multiple paths: dist layout and source layout
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const candidates = [
      join(thisDir, "..", "..", "data", "known-mcps.json"), // source: src/resolvers/ → data/
      join(thisDir, "..", "data", "known-mcps.json"),        // dist: dist/src/ → data/ (sibling)
      join(thisDir, "..", "..", "..", "data", "known-mcps.json"), // dist chunk: dist/chunk → data/
    ];
    let raw: string | undefined;
    for (const candidate of candidates) {
      try {
        raw = await readFile(candidate, "utf-8");
        break;
      } catch {}
    }
    if (!raw) throw new Error("not found");
    knownMcps = JSON.parse(raw);
    return knownMcps!;
  } catch {
    debug("could not load known-mcps.json, using empty registry");
    knownMcps = {};
    return knownMcps;
  }
}

export async function resolveMcp(
  packageName: string,
  cache: FileCache,
): Promise<DocSource | null> {
  const cached = await cache.get<DocSource | null>("mcp", packageName);
  if (cached !== null) return cached;

  const registry = await loadKnownMcps();
  const entry = registry[packageName];

  if (!entry) {
    await cache.set("mcp", packageName, null, CACHE_TTL.mcp);
    return null;
  }

  const source: DocSource = {
    type: "mcp",
    command: entry.command,
    endpoint: entry.endpoint,
  };

  await cache.set("mcp", packageName, source, CACHE_TTL.mcp);
  return source;
}
