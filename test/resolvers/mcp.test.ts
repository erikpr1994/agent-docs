import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveMcp } from "../../src/resolvers/mcp.js";
import { FileCache } from "../../src/cache/file-cache.js";

let tempDir: string;
let cache: FileCache;

async function setup() {
  tempDir = await mkdtemp(join(tmpdir(), "agent-docs-mcp-"));
  cache = new FileCache(tempDir, true); // no-cache mode for tests
}

async function cleanup() {
  await rm(tempDir, { recursive: true, force: true });
}

describe("resolveMcp", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("returns MCP source for known packages", async () => {
    const result = await resolveMcp("better-auth", cache);
    assert.ok(result);
    assert.equal(result.type, "mcp");
    assert.ok(result.endpoint?.includes("better-auth"));
    assert.ok(result.command?.includes("auth"));
  });

  it("returns MCP source for playwright", async () => {
    const result = await resolveMcp("@playwright/test", cache);
    assert.ok(result);
    assert.equal(result.type, "mcp");
    assert.ok(result.command?.includes("playwright"));
  });

  it("returns MCP source for prisma", async () => {
    const result = await resolveMcp("prisma", cache);
    assert.ok(result);
    assert.equal(result.type, "mcp");
    assert.ok(result.command?.includes("prisma"));
  });

  it("returns MCP source for stripe", async () => {
    const result = await resolveMcp("stripe", cache);
    assert.ok(result);
    assert.equal(result.type, "mcp");
    assert.ok(result.command?.includes("stripe"));
  });

  it("returns null for unknown packages", async () => {
    const result = await resolveMcp("some-random-package", cache);
    assert.equal(result, null);
  });

  it("returns MCP source for sentry variants", async () => {
    for (const pkg of ["@sentry/node", "@sentry/react", "@sentry/nextjs"]) {
      const result = await resolveMcp(pkg, cache);
      assert.ok(result, `expected MCP for ${pkg}`);
      assert.ok(result.endpoint?.includes("sentry"));
    }
  });

  it("returns MCP source for notion", async () => {
    const result = await resolveMcp("@notionhq/client", cache);
    assert.ok(result);
    assert.ok(result.command?.includes("notion"));
  });

  it("returns MCP source for redis", async () => {
    const result = await resolveMcp("redis", cache);
    assert.ok(result);
    assert.ok(result.command?.includes("redis"));
  });
});
