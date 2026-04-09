import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "bin/agent-docs": "bin/agent-docs.ts",
    "src/index": "src/index.ts",
    "src/mcp": "src/mcp.ts",
  },
  format: "esm",
  target: "node18",
  splitting: true,
  clean: true,
  dts: true,
  sourcemap: true,
  banner: ({ format }) => {
    // Add shebang only to the CLI entry point
    return {};
  },
});
