import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileCache } from "../../src/cache/file-cache.js";

let tempDir: string;

async function setup() {
  tempDir = await mkdtemp(join(tmpdir(), "agent-docs-cache-"));
}

async function cleanup() {
  await rm(tempDir, { recursive: true, force: true });
}

describe("FileCache", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("returns null for cache miss", async () => {
    const cache = new FileCache(tempDir);
    const result = await cache.get("test", "nonexistent");
    assert.equal(result, null);
  });

  it("stores and retrieves values", async () => {
    const cache = new FileCache(tempDir);
    await cache.set("test", "key1", { hello: "world" }, 60_000);
    const result = await cache.get<{ hello: string }>("test", "key1");
    assert.deepEqual(result, { hello: "world" });
  });

  it("returns null for expired entries", async () => {
    const cache = new FileCache(tempDir);
    // Set with 1ms TTL — will be expired immediately
    await cache.set("test", "key2", "data", 1);
    // Wait a tiny bit to ensure expiration
    await new Promise((r) => setTimeout(r, 10));
    const result = await cache.get("test", "key2");
    assert.equal(result, null);
  });

  it("skips cache reads in no-cache mode", async () => {
    const cache = new FileCache(tempDir, true);
    await cache.set("test", "key3", "data", 60_000);
    const result = await cache.get("test", "key3");
    assert.equal(result, null);
  });

  it("still writes in no-cache mode", async () => {
    const noCache = new FileCache(tempDir, true);
    await noCache.set("test", "key4", "written", 60_000);

    // Read with a normal cache instance
    const normalCache = new FileCache(tempDir, false);
    const result = await normalCache.get("test", "key4");
    assert.equal(result, "written");
  });

  it("handles scoped package names", async () => {
    const cache = new FileCache(tempDir);
    await cache.set("registry", "@sentry/node", { test: true }, 60_000);
    const result = await cache.get<{ test: boolean }>("registry", "@sentry/node");
    assert.deepEqual(result, { test: true });
  });

  it("can store null values", async () => {
    const cache = new FileCache(tempDir);
    await cache.set("test", "null-val", null, 60_000);
    // null is stored but get returns null for both miss and stored-null
    // This is by design — null means "checked, nothing found"
    const result = await cache.get("test", "null-val");
    assert.equal(result, null);
  });
});
