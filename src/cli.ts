import { setVerbose, error } from "./utils/logger.js";
import { runInit } from "./commands/init.js";
import { runUpdate } from "./commands/update.js";
import { runScan } from "./commands/scan.js";
import { runAdd } from "./commands/add.js";
import { runConfig } from "./commands/config.js";

function parseArgs(argv: string[]) {
  const command = argv[0];
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  return { command, flags, positionals };
}

const HELP = `agent-docs — Auto-discover library documentation for AI coding agents

Usage:
  agent-docs init     [--no-cache] [--agent-file <path>] [--verbose]
  agent-docs update   [--no-cache] [--quiet] [--verbose]
  agent-docs scan     [--no-cache] [--verbose]
  agent-docs add <name> --type <skill|docs|file> [--url <url>] [--path <path>]
  agent-docs config   [<key>] [<value>]

Commands:
  init      Scan dependencies, generate index, inject pointer into agent file
  update    Re-scan and regenerate index (for postinstall hooks)
  scan      Dry run — print what would be generated
  add       Add a manual resource (skill, docs URL, or local file)
  config    View or modify configuration

Options:
  --no-cache        Skip cache reads (still writes for future use)
  --agent-file      Override agent file detection (e.g., --agent-file CLAUDE.md)
  --quiet           Minimal output (for postinstall hooks)
  --verbose         Show detailed resolver activity
  --non-interactive Same as default behavior (CLI is always non-interactive)
`;

export async function run(argv: string[]) {
  const { command, flags, positionals } = parseArgs(argv);

  if (flags.verbose) setVerbose(true);

  const projectDir = process.cwd();

  try {
    switch (command) {
      case "init":
        await runInit({
          projectDir,
          noCache: flags["no-cache"] === true,
          agentFile: typeof flags["agent-file"] === "string" ? flags["agent-file"] : undefined,
        });
        break;

      case "update":
        await runUpdate({
          projectDir,
          noCache: flags["no-cache"] === true,
          quiet: flags.quiet === true,
        });
        break;

      case "scan":
        await runScan({
          projectDir,
          noCache: flags["no-cache"] === true,
        });
        break;

      case "add": {
        const name = positionals[0];
        if (!name) {
          error("Usage: agent-docs add <name> --type <skill|docs|file>");
          process.exit(1);
        }
        await runAdd({
          projectDir,
          name,
          type: typeof flags.type === "string" ? flags.type : "",
          url: typeof flags.url === "string" ? flags.url : undefined,
          path: typeof flags.path === "string" ? flags.path : undefined,
        });
        break;
      }

      case "config":
        await runConfig({
          projectDir,
          key: positionals[0],
          value: positionals[1],
        });
        break;

      case "help":
      case "--help":
      case "-h":
      case undefined:
        console.log(HELP);
        break;

      default:
        error(`Unknown command: ${command}`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("ENOENT")) {
      error("No package.json found in current directory");
      process.exit(1);
    }
    throw err;
  }
}
