import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { AGENT_FILES } from "../utils/constants.js";
import { debug } from "../utils/logger.js";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan a file for `@filename` references (Claude Code convention).
 * Returns the first referenced file path found, or null.
 */
function findReference(content: string): string | null {
  // Match @AGENTS.md, @docs/AGENTS.md, @./some-file.md
  const match = content.match(/^@([\w./_-]+\.(?:md|txt))\s*$/m);
  return match ? match[1] : null;
}

/**
 * Detect the best agent file to inject into.
 *
 * If CLAUDE.md exists and references another file (e.g., @AGENTS.md),
 * follow the reference and inject into that file instead.
 */
export async function detectAgentFile(
  projectDir: string,
  override?: string,
): Promise<{ path: string; isNew: boolean }> {
  if (override) {
    const full = join(projectDir, override);
    return { path: full, isNew: !(await exists(full)) };
  }

  // Check CLAUDE.md first for references
  const claudePath = join(projectDir, "CLAUDE.md");
  if (await exists(claudePath)) {
    const content = await readFile(claudePath, "utf-8");
    const ref = findReference(content);
    if (ref) {
      const refPath = join(projectDir, ref);
      debug(`CLAUDE.md references ${ref}, injecting there`);
      return { path: refPath, isNew: !(await exists(refPath)) };
    }
    return { path: claudePath, isNew: false };
  }

  // Check other agent files
  for (const file of AGENT_FILES.slice(1)) {
    const full = join(projectDir, file);
    if (await exists(full)) {
      return { path: full, isNew: false };
    }
  }

  // None found — create AGENTS.md
  return { path: join(projectDir, "AGENTS.md"), isNew: true };
}
