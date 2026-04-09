import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDependencies } from "../../src/parsers/package-json.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "fixtures");

describe("parseDependencies", () => {
  it("parses all deps and devDeps from package.json", async () => {
    const deps = await parseDependencies(fixturesDir);
    const names = deps.map((d) => d.name);

    assert.ok(names.includes("react"));
    assert.ok(names.includes("better-auth"));
    assert.ok(names.includes("zod"));
    assert.ok(names.includes("@playwright/test"));
    assert.ok(names.includes("typescript"));
    assert.ok(names.includes("@types/node"));
    assert.equal(deps.length, 6);
  });

  it("returns deps sorted alphabetically", async () => {
    const deps = await parseDependencies(fixturesDir);
    const names = deps.map((d) => d.name);
    const sorted = [...names].sort();
    assert.deepEqual(names, sorted);
  });

  it("excludes packages matching glob patterns", async () => {
    const deps = await parseDependencies(fixturesDir, ["@types/*"]);
    const names = deps.map((d) => d.name);

    assert.ok(!names.includes("@types/node"));
    assert.ok(names.includes("react"));
    assert.equal(deps.length, 5);
  });

  it("excludes packages matching exact names", async () => {
    const deps = await parseDependencies(fixturesDir, ["zod", "react"]);
    const names = deps.map((d) => d.name);

    assert.ok(!names.includes("zod"));
    assert.ok(!names.includes("react"));
    assert.equal(deps.length, 4);
  });

  it("throws on missing package.json", async () => {
    await assert.rejects(() => parseDependencies("/nonexistent/path"));
  });
});
