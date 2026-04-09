import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateIndexContent } from "../../src/generators/index-file.js";
import type { ResolvedDependency, ManualResource } from "../../src/resolvers/types.js";

describe("generateIndexContent", () => {
  it("generates markdown for dependencies with sources", () => {
    const deps: ResolvedDependency[] = [
      {
        info: { name: "react" },
        sources: [
          { type: "llms-txt", url: "https://react.dev/llms.txt" },
          { type: "context7", identifier: "/facebook/react" },
        ],
      },
      {
        info: { name: "zod" },
        sources: [{ type: "context7", identifier: "/colinhacks/zod" }],
      },
    ];

    const content = generateIndexContent(deps);

    assert.ok(content.includes("### react"));
    assert.ok(content.includes("**llms.txt**: https://react.dev/llms.txt"));
    assert.ok(content.includes("**Context7**: `/facebook/react`"));
    assert.ok(content.includes("### zod"));
    assert.ok(content.includes("2 dependencies scanned, 2 with documentation sources found."));
  });

  it("shows 'No documentation sources found' for deps without sources", () => {
    const deps: ResolvedDependency[] = [
      { info: { name: "internal-lib" }, sources: [] },
    ];

    const content = generateIndexContent(deps);
    assert.ok(content.includes("**No documentation sources found**"));
    assert.ok(content.includes("1 dependencies scanned, 0 with documentation sources found."));
  });

  it("renders MCP sources with endpoint and command", () => {
    const deps: ResolvedDependency[] = [
      {
        info: { name: "better-auth" },
        sources: [
          {
            type: "mcp",
            endpoint: "https://mcp.better-auth.com/mcp",
            command: "npx auth@latest mcp --claude-code",
          },
        ],
      },
    ];

    const content = generateIndexContent(deps);
    assert.ok(content.includes("**MCP**: endpoint `https://mcp.better-auth.com/mcp`"));
    assert.ok(content.includes("**MCP**: `npx auth@latest mcp --claude-code`"));
  });

  it("renders docs-url sources", () => {
    const deps: ResolvedDependency[] = [
      {
        info: { name: "typescript" },
        sources: [{ type: "docs-url", url: "https://www.typescriptlang.org/" }],
      },
    ];

    const content = generateIndexContent(deps);
    assert.ok(content.includes("**Docs**: https://www.typescriptlang.org/"));
  });

  it("includes manual resources section", () => {
    const deps: ResolvedDependency[] = [];
    const resources: ManualResource[] = [
      { name: "humanizer", type: "skill", url: "https://skills.sh/humanizer" },
      { name: "conventions", type: "file", path: "./docs/conventions.md" },
      { name: "design-system", type: "docs", url: "https://company.com/design/llms.txt" },
    ];

    const content = generateIndexContent(deps, resources);
    assert.ok(content.includes("## Resources"));
    assert.ok(content.includes("### humanizer"));
    assert.ok(content.includes("**Skill**: https://skills.sh/humanizer"));
    assert.ok(content.includes("### conventions"));
    assert.ok(content.includes("**File**: ./docs/conventions.md"));
    assert.ok(content.includes("### design-system"));
    assert.ok(content.includes("**Docs**: https://company.com/design/llms.txt"));
    assert.ok(content.includes("3 manual resources."));
  });

  it("omits resources section when empty", () => {
    const deps: ResolvedDependency[] = [
      { info: { name: "zod" }, sources: [] },
    ];

    const content = generateIndexContent(deps, []);
    assert.ok(!content.includes("## Resources"));
  });

  it("includes header with refresh instructions", () => {
    const content = generateIndexContent([]);
    assert.ok(content.includes("# Documentation Index"));
    assert.ok(content.includes("npx agent-docs update"));
    assert.ok(content.includes("npx agent-docs init"));
  });
});
