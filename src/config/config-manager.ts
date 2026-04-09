import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { CONFIG_FILE } from "../utils/constants.js";
import type { Config, ManualResource } from "../resolvers/types.js";

const DEFAULT_CONFIG: Config = {
  resolvers: {
    llmsTxt: true,
    context7: true,
    mcp: true,
  },
  concurrency: 10,
  exclude: [],
  resources: [],
};

export async function loadConfig(projectDir: string): Promise<Config> {
  const path = join(projectDir, CONFIG_FILE);
  try {
    const raw = await readFile(path, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(
  projectDir: string,
  config: Config,
): Promise<void> {
  const path = join(projectDir, CONFIG_FILE);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export async function addResource(
  projectDir: string,
  resource: ManualResource,
): Promise<void> {
  const config = await loadConfig(projectDir);
  if (!config.resources) config.resources = [];

  // Replace existing resource with same name
  const idx = config.resources.findIndex((r) => r.name === resource.name);
  if (idx >= 0) {
    config.resources[idx] = resource;
  } else {
    config.resources.push(resource);
  }

  await saveConfig(projectDir, config);
}
