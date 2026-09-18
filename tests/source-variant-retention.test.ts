import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import retained from "../examples/ordinary_bitwise_promotion_v1.json";

const script = resolve("scripts/export-source-variant-comparison.mjs");
const receipt = "908100a406d336cfc5bc28b6c584e5830293a951cf7b3e8f9245130520603142";
describe("source comparison artifact retention", () => {
  it("reproduces the exact wrapper from retained bytes without manufacturing results", () => {
    const temporary = mkdtempSync(join(tmpdir(), "fe2o3-source-comparison-"));
    const directory = join(temporary, "ordinary-bitwise-promotion-r1");
    mkdirSync(directory);
    function save(path: string, bytes: string | Buffer) { writeFileSync(join(directory, path), bytes); }
    const run = (expected = receipt) => spawnSync(process.execPath, [script, directory, expected], { encoding: "utf8", timeout: 10_000, maxBuffer: 1_048_576 });
    try {
      save("receipt.json", retained.receipt.utf8);
      save("generated-helper.json", retained.materialization.utf8);
      for (const variant of retained.variants) {
        if (variant.id !== "ordinary") mkdirSync(join(directory, `${variant.id}-source/src`), { recursive: true });
        save(variant.id === "ordinary" ? "original-source.rs" : `${variant.id}-source/src/lib.rs`, variant.source.utf8);
        save(`${variant.id}-inspect.stdout`, variant.snapshot.utf8);
        save(`${variant.id}-operations-0.stdout`, variant.operations.utf8);
        save(`${variant.id}-simulation.stdout`, variant.simulation.utf8);
        if (variant.change) save(`${variant.id}-source-change.json`, variant.change.utf8);
      }
      const copied = run();
      expect(copied.status, copied.stderr).toBe(0);
      expect(JSON.parse(copied.stdout)).toEqual(retained);
      const wrong = run("1".repeat(64));
      expect(wrong.status).not.toBe(0); expect(wrong.stdout).toBe("");
      save("ordinary-operations-0.stdout", Buffer.alloc(65_537, 32));
      const oversized = run();
      expect(oversized.status).not.toBe(0); expect(oversized.stdout).toBe("");
      save("ordinary-operations-0.stdout", retained.variants[0].operations.utf8);
      save("original-source.rs", Buffer.from([0xff]));
      const invalid = run();
      expect(invalid.status).not.toBe(0); expect(invalid.stdout).toBe("");
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  });
});
