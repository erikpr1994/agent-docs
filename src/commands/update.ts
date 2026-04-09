import { resolveDependencies } from "./init.js";
import { generateIndexContent, writeIndex } from "../generators/index-file.js";
import { FileCache } from "../cache/file-cache.js";
import { loadConfig } from "../config/config-manager.js";
import { log } from "../utils/logger.js";

export interface UpdateOptions {
  projectDir: string;
  noCache?: boolean;
  quiet?: boolean;
}

export async function runUpdate(options: UpdateOptions): Promise<void> {
  const { projectDir, noCache, quiet } = options;

  const config = await loadConfig(projectDir);
  const cache = new FileCache(projectDir, noCache);

  const resolved = await resolveDependencies(projectDir, config, cache);
  const content = generateIndexContent(resolved, config.resources);
  const indexPath = await writeIndex(projectDir, content);

  if (!quiet) {
    const withDocs = resolved.filter((d) => d.sources.length > 0).length;
    log(`Updated ${indexPath} (${withDocs}/${resolved.length} with docs)`);
  }
}
