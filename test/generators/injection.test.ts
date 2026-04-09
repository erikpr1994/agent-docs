import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { injectPointer } from "../../src/generators/injection.js";
import { SENTINEL_START, SENTINEL_END } from "../../src/utils/constants.js";

let tempDir: string;

async function setup() {
  tempDir = await mkdtemp(join(tmpdir(), "agent-docs-inject-"));
}

async function cleanup() {
  await rm(tempDir, { recursive: true, force: true });
}

describe("injectPointer", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("creates a new file with the pointer", async () => {
    const path = join(tempDir, "AGENTS.md");
    await injectPointer(path, true);

    const content = await readFile(path, "utf-8");
    assert.ok(content.includes(SENTINEL_START));
    assert.ok(content.includes(SENTINEL_END));
    assert.ok(content.includes(".agent-docs/index.md"));
  });

  it("appends pointer to existing file without sentinels", async () => {
    const path = join(tempDir, "CLAUDE.md");
    await writeFile(path, "# My Project\n\nSome existing content.\n");
    await injectPointer(path, false);

    const content = await readFile(path, "utf-8");
    assert.ok(content.startsWith("# My Project"));
    assert.ok(content.includes(SENTINEL_START));
    assert.ok(content.includes(SENTINEL_END));
  });

  it("replaces existing sentinel block in-place", async () => {
    const path = join(tempDir, "CLAUDE.md");
    const original = `# Project

${SENTINEL_START}
## Old Content
This is old.
${SENTINEL_END}

## Other Section
Keep this.
`;
    await writeFile(path, original);
    await injectPointer(path, false);

    const content = await readFile(path, "utf-8");
    assert.ok(content.includes(".agent-docs/index.md"));
    assert.ok(content.includes("## Other Section"));
    assert.ok(content.includes("Keep this."));
    assert.ok(!content.includes("Old Content"));
    // Only one sentinel pair
    assert.equal(content.split(SENTINEL_START).length, 2);
  });

  it("is idempotent — running twice produces same result", async () => {
    const path = join(tempDir, "AGENTS.md");
    await injectPointer(path, true);
    const first = await readFile(path, "utf-8");

    await injectPointer(path, false);
    const second = await readFile(path, "utf-8");

    assert.equal(first, second);
  });
});
