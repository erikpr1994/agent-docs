import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { detectAgentFile } from "../../src/parsers/detect-agent-file.js";

let tempDir: string;

async function setup() {
  tempDir = await mkdtemp(join(tmpdir(), "agent-docs-test-"));
}

async function cleanup() {
  await rm(tempDir, { recursive: true, force: true });
}

describe("detectAgentFile", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("returns CLAUDE.md when it exists", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "# Project\nSome content");
    const result = await detectAgentFile(tempDir);
    assert.equal(result.path, join(tempDir, "CLAUDE.md"));
    assert.equal(result.isNew, false);
  });

  it("follows @AGENTS.md reference in CLAUDE.md", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "@AGENTS.md\n");
    await writeFile(join(tempDir, "AGENTS.md"), "# Agents");
    const result = await detectAgentFile(tempDir);
    assert.equal(result.path, join(tempDir, "AGENTS.md"));
    assert.equal(result.isNew, false);
  });

  it("follows @docs/AGENTS.md reference in CLAUDE.md", async () => {
    await mkdir(join(tempDir, "docs"), { recursive: true });
    await writeFile(join(tempDir, "CLAUDE.md"), "@docs/AGENTS.md\n");
    await writeFile(join(tempDir, "docs", "AGENTS.md"), "# Agents");
    const result = await detectAgentFile(tempDir);
    assert.equal(result.path, join(tempDir, "docs", "AGENTS.md"));
    assert.equal(result.isNew, false);
  });

  it("marks referenced file as new if it doesn't exist", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "@AGENTS.md\n");
    const result = await detectAgentFile(tempDir);
    assert.equal(result.path, join(tempDir, "AGENTS.md"));
    assert.equal(result.isNew, true);
  });

  it("falls back to AGENTS.md when no CLAUDE.md", async () => {
    await writeFile(join(tempDir, "AGENTS.md"), "# Agents");
    const result = await detectAgentFile(tempDir);
    assert.equal(result.path, join(tempDir, "AGENTS.md"));
    assert.equal(result.isNew, false);
  });

  it("falls back to .cursorrules", async () => {
    await writeFile(join(tempDir, ".cursorrules"), "rules");
    const result = await detectAgentFile(tempDir);
    assert.equal(result.path, join(tempDir, ".cursorrules"));
    assert.equal(result.isNew, false);
  });

  it("creates AGENTS.md when nothing exists", async () => {
    const result = await detectAgentFile(tempDir);
    assert.equal(result.path, join(tempDir, "AGENTS.md"));
    assert.equal(result.isNew, true);
  });

  it("uses override when provided", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "# Project");
    const result = await detectAgentFile(tempDir, "custom.md");
    assert.equal(result.path, join(tempDir, "custom.md"));
    assert.equal(result.isNew, true);
  });
});
