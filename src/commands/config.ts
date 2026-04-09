import { loadConfig, saveConfig } from "../config/config-manager.js";
import { log, error } from "../utils/logger.js";

export interface ConfigOptions {
  projectDir: string;
  key?: string;
  value?: string;
}

export async function runConfig(options: ConfigOptions): Promise<void> {
  const { projectDir, key, value } = options;
  const config = await loadConfig(projectDir);

  // No args — show full config
  if (!key) {
    log(JSON.stringify(config, null, 2));
    return;
  }

  // Get
  if (!value) {
    const val = getNestedValue(config, key);
    if (val === undefined) {
      error(`Key "${key}" not found`);
      process.exit(1);
    }
    log(typeof val === "object" ? JSON.stringify(val, null, 2) : String(val));
    return;
  }

  // Set
  setNestedValue(config, key, parseValue(value));
  await saveConfig(projectDir, config);
  log(`Set ${key} = ${value}`);
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function parseValue(s: string): unknown {
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  const num = Number(s);
  if (!isNaN(num) && s.trim() !== "") return num;
  return s;
}
