import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import fs, {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  statSync, symlinkSync, truncateSync, utimesSync, writeFileSync,
} from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { authenticateTrackedTree, publishInventoryExclusive } from "../curriculum-inventory-files.mjs";

function row(path, contents, mode = "100644") {
  const bytes = typeof contents === "string" ? Buffer.from(contents) : contents;
  const hash = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
  return `${mode} blob ${hash}\t${path}\0`;
}

let root;
const realWrite = fs.writeSync;
const realClose = fs.closeSync;
const realRemove = fs.rmSync;
beforeEach(() => {
  mock.method(fs, "writeSync", realWrite);
  mock.method(fs, "closeSync", realClose);
  mock.method(fs, "rmSync", realRemove);
  // Both helper and tests use native ESM bindings, without a Vite transform.
  syncBuiltinESMExports();
  root = mkdtempSync(join(tmpdir(), "fe2o3-inventory-files-test-"));
});
afterEach(() => {
  mock.reset();
  syncBuiltinESMExports();
  if (root !== undefined) realRemove(root, { recursive: true, force: true });
  root = undefined;
});

describe("exact tracked bytes independent of the Git stat cache", { concurrency: false }, () => {
  it("authenticates ordinary UTF-8 and binary blobs with exact executable modes", () => {
    mkdirSync(join(root, "nested"));
    writeFileSync(join(root, "nested", "text"), "hello\n", { mode: 0o644 });
    const binary = Buffer.from([0, 255, 127]);
    writeFileSync(join(root, "run"), binary, { mode: 0o755 });
    chmodSync(join(root, "run"), 0o755);
    assert.deepEqual(authenticateTrackedTree(root, Buffer.from(row("nested/text", "hello\n") + row("run", binary, "100755"))),
      { files: 2, bytes: 9 });
  });

  it("refuses same-size edits even when original modification timestamps are restored", () => {
    const file = join(root, "source");
    writeFileSync(file, "before", { mode: 0o644 });
    const before = statSync(file);
    writeFileSync(file, "mutant");
    utimesSync(file, before.atime, before.mtime);
    assert.equal(statSync(file).size, before.size);
    assert.throws(() => authenticateTrackedTree(root, Buffer.from(row("source", "before"))),
      /tracked bytes differ from HEAD/);
  });

  it("refuses executable-mode changes separately from identical bytes", () => {
    writeFileSync(join(root, "source"), "same", { mode: 0o644 });
    chmodSync(join(root, "source"), 0o755);
    assert.throws(() => authenticateTrackedTree(root, Buffer.from(row("source", "same"))),
      /tracked executable mode differs from HEAD/);
  });

  it("refuses both final-file and parent-directory symlink traversal", () => {
    mkdirSync(join(root, "real"));
    writeFileSync(join(root, "real", "file"), "same", { mode: 0o644 });
    symlinkSync("real/file", join(root, "link"));
    symlinkSync("real", join(root, "alias"));
    assert.throws(() => authenticateTrackedTree(root, Buffer.from(row("link", "same"))), /not ordinary/);
    assert.throws(() => authenticateTrackedTree(root, Buffer.from(row("alias/file", "same"))), /symlink/);
    assert.throws(() => authenticateTrackedTree(join(root, "alias"), Buffer.from(row("file", "same"))), /symlink/);
  });

  it("refuses malformed, lossy, duplicate, unsafe, nonordinary and absent entries", () => {
    writeFileSync(join(root, "source"), "same", { mode: 0o644 });
    for (const listing of [
      Buffer.from(row("source", "same").slice(0, -1)),
      Buffer.from(row("source", "same") + row("source", "same")),
      Buffer.from(row("../source", "same")),
      Buffer.from(row("/source", "same")),
      Buffer.from(row("source", "same").replace("100644", "120000")),
      Buffer.from(row("source", "same").replace(" blob ", " commit ")),
      Buffer.from(row("missing", "same")),
      Buffer.concat([Buffer.from(row("source", "same").slice(0, -1)), Buffer.from([255, 0])]),
    ]) assert.throws(() => authenticateTrackedTree(root, listing));
  });

  it("enforces entry and per-file bounds before reading oversized contents", () => {
    writeFileSync(join(root, "large"), "", { mode: 0o644 });
    truncateSync(join(root, "large"), 64 * 1024 * 1024 + 1);
    assert.throws(() => authenticateTrackedTree(root, Buffer.from(row("large", ""))), /byte bound/);
    assert.throws(() => authenticateTrackedTree(root, Buffer.from(row("large", "").repeat(20_001))), /file bound/);
  });

  it("rechecks bytes after the simulated runtime load rather than trusting earlier success", () => {
    const file = join(root, "source");
    writeFileSync(file, "before", { mode: 0o644 });
    const listing = Buffer.from(row("source", "before"));
    assert.deepEqual(authenticateTrackedTree(root, listing), { files: 1, bytes: 6 });
    writeFileSync(file, "mutant");
    assert.throws(() => authenticateTrackedTree(root, listing), /tracked bytes differ from HEAD/);
  });

  it("preserves an earlier validation failure when close also fails and refuses a first close failure", () => {
    writeFileSync(join(root, "source"), "actual", { mode: 0o644 });
    fs.closeSync.mock.resetCalls();
    const closing = new Error("injected close failure");
    for (const expected of ["mutant", "actual"]) {
      fs.closeSync.mock.mockImplementationOnce((fd) => {
        realClose(fd);
        throw closing;
      });
      assert.throws(() => authenticateTrackedTree(root, Buffer.from(row("source", expected))),
        expected === "actual" ? error => error === closing : /tracked bytes differ from HEAD/);
    }
    assert.equal(fs.closeSync.mock.calls.length, 2);
  });
});

describe("create-only complete report publication", { concurrency: false }, () => {
  it("publishes exact bytes with private mode and removes its staging directory", () => {
    const output = join(root, "report.json");
    const bytes = Buffer.from('{"complete":true}\n');
    fs.writeSync.mock.mockImplementationOnce((fd, buffer, offset) => realWrite(fd, buffer, offset, 3));
    publishInventoryExclusive(output, bytes);
    assert.equal(fs.writeSync.mock.calls.length, 2);
    assert.equal(fs.writeSync.mock.calls[0].result, 3);
    assert.deepEqual(readFileSync(output), bytes);
    assert.equal(statSync(output).mode & 0o777, 0o600);
    assert.deepEqual(readdirSync(root), ["report.json"]);
  });

  it("never overwrites an existing report or follows an existing output symlink", () => {
    const output = join(root, "report.json");
    writeFileSync(output, "original");
    assert.throws(() => publishInventoryExclusive(output, Buffer.from("new")));
    assert.equal(readFileSync(output, "utf8"), "original");
    symlinkSync("report.json", join(root, "alias.json"));
    assert.throws(() => publishInventoryExclusive(join(root, "alias.json"), Buffer.from("new")));
    assert.equal(readFileSync(output, "utf8"), "original");
    assert.deepEqual(readdirSync(root).sort(), ["alias.json", "report.json"]);
  });

  it("does not publish or retain staging after a partial write followed by failure", () => {
    const output = join(root, "report.json");
    const selected = new Error("selected partial write failure");
    fs.writeSync.mock.mockImplementationOnce((fd, bytes, offset) => realWrite(fd, bytes, offset, 3), 0);
    fs.writeSync.mock.mockImplementationOnce(() => { throw selected; }, 1);
    assert.throws(() => publishInventoryExclusive(output, Buffer.from("complete report\n")), error => error === selected);
    assert.equal(fs.writeSync.mock.calls.length, 2);
    assert.equal(fs.writeSync.mock.calls[0].result, 3);
    assert.equal(existsSync(output), false);
    assert.deepEqual(readdirSync(root), []);
  });

  it("rejects stalled writes and oversized reports without a final report", () => {
    const output = join(root, "report.json");
    fs.writeSync.mock.mockImplementationOnce(() => 0);
    assert.throws(() => publishInventoryExclusive(output, Buffer.from("x")), /invalid progress/);
    assert.throws(() => publishInventoryExclusive(output, Buffer.alloc(16 * 1024 * 1024 + 1)), /oversized report/);
    assert.equal(fs.writeSync.mock.calls.length, 1);
    assert.equal(existsSync(output), false);
    assert.deepEqual(readdirSync(root), []);
  });

  it("preserves the write refusal while still attempting both failing cleanup operations", () => {
    const output = join(root, "report.json");
    const selected = new Error("selected write refusal");
    fs.writeSync.mock.mockImplementationOnce(() => { throw selected; });
    fs.closeSync.mock.mockImplementationOnce((fd) => {
      realClose(fd);
      throw new Error("later close refusal");
    });
    fs.rmSync.mock.mockImplementationOnce((path, options) => {
      realRemove(path, options);
      throw new Error("later cleanup refusal");
    });
    assert.throws(() => publishInventoryExclusive(output, Buffer.from("complete report\n")), error => error === selected);
    assert.equal(fs.closeSync.mock.calls.length, 1);
    assert.equal(fs.rmSync.mock.calls.length, 1);
    assert.equal(existsSync(output), false);
    assert.deepEqual(readdirSync(root), []);
  });

  it("reports a first post-link cleanup failure without deleting the complete published report", () => {
    const output = join(root, "report.json");
    const selected = new Error("post-link cleanup refusal");
    const bytes = Buffer.from("complete report\n");
    fs.rmSync.mock.mockImplementationOnce((path, options) => {
      realRemove(path, options);
      throw selected;
    });
    assert.throws(() => publishInventoryExclusive(output, bytes), error => error === selected);
    assert.deepEqual(readFileSync(output), bytes);
    assert.deepEqual(readdirSync(root), ["report.json"]);
  });

  it("does not retry a failed close before removing unpublished staging", () => {
    const output = join(root, "report.json");
    const selected = new Error("first close refusal");
    fs.closeSync.mock.mockImplementationOnce((fd) => {
      realClose(fd);
      throw selected;
    });
    assert.throws(() => publishInventoryExclusive(output, Buffer.from("complete report\n")), error => error === selected);
    assert.equal(fs.closeSync.mock.calls.length, 1);
    assert.equal(fs.rmSync.mock.calls.length, 1);
    assert.equal(existsSync(output), false);
    assert.deepEqual(readdirSync(root), []);
  });
});
