import { NPM_REGISTRY_URL, CACHE_TTL } from "../utils/constants.js";
import { fetchJson } from "../utils/fetch.js";
import { FileCache } from "../cache/file-cache.js";
import type { RegistryMetadata } from "./types.js";

interface NpmPackageResponse {
  homepage?: string;
  repository?: { type?: string; url?: string } | string;
  description?: string;
}

function extractRepoUrl(
  repo: NpmPackageResponse["repository"],
): string | undefined {
  if (!repo) return undefined;
  const url = typeof repo === "string" ? repo : repo.url;
  if (!url) return undefined;
  // Normalize git+https://github.com/foo/bar.git → https://github.com/foo/bar
  return url
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git:\/\//, "https://");
}

export async function resolveRegistry(
  packageName: string,
  cache: FileCache,
): Promise<RegistryMetadata | null> {
  const cached = await cache.get<RegistryMetadata>("registry", packageName);
  if (cached) return cached;

  const result = await fetchJson<NpmPackageResponse>(
    `${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`,
  );

  if (!result.ok || !result.data) return null;

  const meta: RegistryMetadata = {
    homepage: result.data.homepage || undefined,
    repository: extractRepoUrl(result.data.repository),
    description: result.data.description,
  };

  await cache.set("registry", packageName, meta, CACHE_TTL.registry);
  return meta;
}
