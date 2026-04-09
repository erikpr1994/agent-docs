import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { DependencyInfo } from "../resolvers/types.js";

export async function parseDependencies(
  projectDir: string,
  exclude: string[] = [],
): Promise<DependencyInfo[]> {
  const path = join(projectDir, "package.json");
  const raw = await readFile(path, "utf-8");
  const pkg = JSON.parse(raw);

  const allDeps: Record<string, string> = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const excludePatterns = exclude.map((p) => {
    if (p.includes("*")) {
      const regex = p.replace(/\*/g, ".*");
      return new RegExp(`^${regex}$`);
    }
    return p;
  });

  function isExcluded(name: string): boolean {
    return excludePatterns.some((p) =>
      typeof p === "string" ? p === name : p.test(name),
    );
  }

  return Object.keys(allDeps)
    .filter((name) => !isExcluded(name))
    .sort()
    .map((name) => ({ name }));
}
