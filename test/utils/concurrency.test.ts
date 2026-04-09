import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLimiter } from "../../src/utils/concurrency.js";

describe("createLimiter", () => {
  it("runs tasks up to concurrency limit", async () => {
    const limit = createLimiter(2);
    let running = 0;
    let maxRunning = 0;

    const task = () =>
      limit(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise((r) => setTimeout(r, 50));
        running--;
        return maxRunning;
      });

    await Promise.all([task(), task(), task(), task(), task()]);
    assert.ok(maxRunning <= 2, `max concurrent was ${maxRunning}, expected <= 2`);
  });

  it("returns values from tasks", async () => {
    const limit = createLimiter(3);
    const results = await Promise.all([
      limit(async () => "a"),
      limit(async () => "b"),
      limit(async () => "c"),
    ]);
    assert.deepEqual(results, ["a", "b", "c"]);
  });

  it("propagates errors", async () => {
    const limit = createLimiter(2);
    await assert.rejects(() =>
      limit(async () => {
        throw new Error("test error");
      }),
    );
  });

  it("continues processing after an error", async () => {
    const limit = createLimiter(1);
    const results: string[] = [];

    try {
      await limit(async () => {
        throw new Error("fail");
      });
    } catch {}

    results.push(await limit(async () => "success"));
    assert.deepEqual(results, ["success"]);
  });
});
