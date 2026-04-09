import { addResource } from "../config/config-manager.js";
import { log, error } from "../utils/logger.js";
import type { ManualResource } from "../resolvers/types.js";

export interface AddOptions {
  projectDir: string;
  name: string;
  type: string;
  url?: string;
  path?: string;
}

export async function runAdd(options: AddOptions): Promise<void> {
  const { projectDir, name, type, url, path } = options;

  if (!["skill", "docs", "file"].includes(type)) {
    error(`Invalid type "${type}". Must be one of: skill, docs, file`);
    process.exit(1);
  }

  if (type === "file" && !path) {
    error("--path is required for type 'file'");
    process.exit(1);
  }

  if ((type === "skill" || type === "docs") && !url) {
    error("--url is required for type 'skill' or 'docs'");
    process.exit(1);
  }

  const resource: ManualResource = {
    name,
    type: type as ManualResource["type"],
    url,
    path,
  };

  await addResource(projectDir, resource);
  log(`Added resource "${name}" (${type})`);
  log(`Run 'agent-docs update' to regenerate the index.`);
}
