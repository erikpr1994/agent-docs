export const NPM_REGISTRY_URL = "https://registry.npmjs.org";
export const CONTEXT7_API_URL = "https://context7.com/api/v2";
export const CONTEXT7_MAX_REQUESTS_PER_HOUR = 60;
export const CONTEXT7_PAUSE_THRESHOLD = 55;

export const INDEX_DIR = ".agent-docs";
export const INDEX_FILE = ".agent-docs/index.md";
export const CONFIG_FILE = ".agent-docs/config.json";
export const CACHE_DIR = ".agent-docs/.cache";

export const SENTINEL_START = "<!-- agent-docs:start -->";
export const SENTINEL_END = "<!-- agent-docs:end -->";

export const AGENT_FILES = [
  "CLAUDE.md",
  "AGENTS.md",
  ".cursorrules",
  ".github/copilot-instructions.md",
] as const;

export const CACHE_TTL = {
  registry: 24 * 60 * 60 * 1000, // 24 hours
  llmsTxt: 7 * 24 * 60 * 60 * 1000, // 7 days
  context7: 7 * 24 * 60 * 60 * 1000, // 7 days
  mcp: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

export const DEFAULT_CONCURRENCY = 10;
export const FETCH_TIMEOUT_MS = 10_000;
export const MAX_RETRIES = 2;

export const USER_AGENT = "agent-docs/0.1.0";
