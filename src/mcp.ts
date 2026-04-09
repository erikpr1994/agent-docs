import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { runInit, resolveDependencies } from "./commands/init.js";
import { runUpdate } from "./commands/update.js";
import { addResource } from "./config/config-manager.js";
import { loadConfig } from "./config/config-manager.js";
import { INDEX_FILE } from "./utils/constants.js";
import type { ManualResource } from "./resolvers/types.js";

const server = new McpServer({
  name: "agent-docs",
  version: "0.1.0",
});

server.tool(
  "init",
  "Scan project dependencies and generate a documentation index. Run this when setting up a new project or when the index is missing/stale.",
  {
    projectDir: z.string().optional().describe("Project directory (defaults to cwd)"),
    agentFile: z.string().optional().describe("Override agent file detection"),
  },
  async ({ projectDir, agentFile }) => {
    const dir = projectDir || process.cwd();
    await runInit({ projectDir: dir, agentFile });
    const indexPath = join(dir, INDEX_FILE);
    const content = await readFile(indexPath, "utf-8");
    return { content: [{ type: "text" as const, text: `Index generated at ${indexPath}:\n\n${content}` }] };
  },
);

server.tool(
  "update",
  "Refresh the documentation index with latest dependency information.",
  {
    projectDir: z.string().optional().describe("Project directory (defaults to cwd)"),
  },
  async ({ projectDir }) => {
    const dir = projectDir || process.cwd();
    await runUpdate({ projectDir: dir });
    const indexPath = join(dir, INDEX_FILE);
    const content = await readFile(indexPath, "utf-8");
    return { content: [{ type: "text" as const, text: `Index updated:\n\n${content}` }] };
  },
);

server.tool(
  "add_resource",
  "Add a manual resource (skill, docs URL, or local file) to the documentation index.",
  {
    projectDir: z.string().optional().describe("Project directory (defaults to cwd)"),
    name: z.string().describe("Resource name"),
    type: z.enum(["skill", "docs", "file"]).describe("Resource type"),
    url: z.string().optional().describe("URL for skill or docs type"),
    path: z.string().optional().describe("File path for file type"),
  },
  async ({ projectDir, name, type, url, path }) => {
    const dir = projectDir || process.cwd();
    const resource: ManualResource = { name, type, url, path };
    await addResource(dir, resource);
    return { content: [{ type: "text" as const, text: `Added resource "${name}" (${type}). Run update to regenerate the index.` }] };
  },
);

server.tool(
  "get_index",
  "Read the current documentation index contents.",
  {
    projectDir: z.string().optional().describe("Project directory (defaults to cwd)"),
  },
  async ({ projectDir }) => {
    const dir = projectDir || process.cwd();
    const indexPath = join(dir, INDEX_FILE);
    try {
      const content = await readFile(indexPath, "utf-8");
      return { content: [{ type: "text" as const, text: content }] };
    } catch {
      return { content: [{ type: "text" as const, text: "No index found. Run the 'init' tool first." }] };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
