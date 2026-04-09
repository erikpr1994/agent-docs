import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { SENTINEL_START, SENTINEL_END } from "../utils/constants.js";
import { debug } from "../utils/logger.js";

const INJECTION_BLOCK = `${SENTINEL_START}
## Library Documentation
Before writing or modifying code that uses a project dependency, read \`.agent-docs/index.md\`
for up-to-date documentation sources. Use the linked resources (llms.txt, Context7, library MCPs)
to get current API documentation rather than relying on training data.
If a dependency you're using isn't listed, run \`npx agent-docs init\` to discover its docs.
${SENTINEL_END}`;

export async function injectPointer(
  agentFilePath: string,
  isNew: boolean,
): Promise<boolean> {
  if (isNew) {
    debug(`creating ${agentFilePath} with agent-docs pointer`);
    await mkdir(dirname(agentFilePath), { recursive: true });
    await writeFile(agentFilePath, INJECTION_BLOCK + "\n", "utf-8");
    return true;
  }

  const content = await readFile(agentFilePath, "utf-8");

  // Already has sentinel — replace in-place
  if (content.includes(SENTINEL_START)) {
    const pattern = new RegExp(
      `${escapeRegex(SENTINEL_START)}[\\s\\S]*?${escapeRegex(SENTINEL_END)}`,
    );
    const updated = content.replace(pattern, INJECTION_BLOCK);
    if (updated !== content) {
      await writeFile(agentFilePath, updated, "utf-8");
      debug(`updated existing agent-docs section in ${agentFilePath}`);
    } else {
      debug(`agent-docs section already up-to-date in ${agentFilePath}`);
    }
    return true;
  }

  // Append to end
  const separator = content.endsWith("\n") ? "\n" : "\n\n";
  await writeFile(
    agentFilePath,
    content + separator + INJECTION_BLOCK + "\n",
    "utf-8",
  );
  debug(`appended agent-docs section to ${agentFilePath}`);
  return true;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
