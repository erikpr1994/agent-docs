import { parseDependencies } from "../parsers/package-json.js";
import { detectAgentFile } from "../parsers/detect-agent-file.js";
import { resolveRegistry } from "../resolvers/registry.js";
import { resolveLlmsTxt } from "../resolvers/llms-txt.js";
import { resolveContext7, resetRateLimiter } from "../resolvers/context7.js";
import { resolveMcp } from "../resolvers/mcp.js";
import { generateIndexContent, writeIndex } from "../generators/index-file.js";
import { injectPointer } from "../generators/injection.js";
import { FileCache } from "../cache/file-cache.js";
import { loadConfig, saveConfig } from "../config/config-manager.js";
import { createLimiter } from "../utils/concurrency.js";
import { DEFAULT_CONCURRENCY } from "../utils/constants.js";
import { log, debug } from "../utils/logger.js";
import type {
  ResolvedDependency,
  DocSource,
  Config,
} from "../resolvers/types.js";

export interface InitOptions {
  projectDir: string;
  noCache?: boolean;
  agentFile?: string;
  dryRun?: boolean;
}

export async function resolveDependencies(
  projectDir: string,
  config: Config,
  cache: FileCache,
): Promise<ResolvedDependency[]> {
  const deps = await parseDependencies(projectDir, config.exclude);
  log(`Scanning ${deps.length} dependencies...`);

  const concurrency = config.concurrency ?? DEFAULT_CONCURRENCY;
  const limit = createLimiter(concurrency);
  resetRateLimiter();

  const resolved = await Promise.all(
    deps.map((dep) =>
      limit(async () => {
        const sources: DocSource[] = [];

        // Step 1: npm registry metadata (others depend on this)
        const meta = await resolveRegistry(dep.name, cache);
        const homepage = meta?.homepage;

        // Step 2: all other resolvers in parallel
        const resolverPromises: Promise<DocSource | null>[] = [];

        if (config.resolvers?.llmsTxt !== false) {
          resolverPromises.push(resolveLlmsTxt(dep.name, homepage, cache));
        }
        if (config.resolvers?.context7 !== false) {
          resolverPromises.push(
            resolveContext7(dep.name, cache, config.context7ApiKey),
          );
        }
        if (config.resolvers?.mcp !== false) {
          resolverPromises.push(resolveMcp(dep.name, cache));
        }

        const results = await Promise.all(resolverPromises);
        for (const result of results) {
          if (result) sources.push(result);
        }

        // Fallback: use homepage as docs URL if nothing else found
        if (sources.length === 0 && homepage) {
          sources.push({ type: "docs-url", url: homepage });
        }

        const resolved: ResolvedDependency = {
          info: dep,
          sources,
          homepage,
          repository: meta?.repository,
        };

        const sourceTypes = sources.map((s) => s.type).join(", ");
        debug(
          `${dep.name}: ${sources.length > 0 ? sourceTypes : "no docs found"}`,
        );

        return resolved;
      }),
    ),
  );

  return resolved;
}

export async function runInit(options: InitOptions): Promise<void> {
  const { projectDir, noCache, agentFile, dryRun } = options;

  const config = await loadConfig(projectDir);
  const cache = new FileCache(projectDir, noCache);

  const resolved = await resolveDependencies(projectDir, config, cache);

  const content = generateIndexContent(resolved, config.resources);

  if (dryRun) {
    log("\n--- Dry run output ---\n");
    log(content);
    return;
  }

  // Write index
  const indexPath = await writeIndex(projectDir, content);
  const withDocs = resolved.filter((d) => d.sources.length > 0).length;
  log(`\nWrote ${indexPath}`);
  log(`  ${resolved.length} dependencies scanned, ${withDocs} with docs found`);

  if (config.resources?.length) {
    log(`  ${config.resources.length} manual resources`);
  }

  // Save config (creates .agent-docs/config.json if missing)
  await saveConfig(projectDir, config);

  // Inject pointer into agent file
  const target = await detectAgentFile(projectDir, agentFile);
  await injectPointer(target.path, target.isNew);
  log(
    `  Pointer ${target.isNew ? "created in" : "injected into"} ${target.path}`,
  );
}
