import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, mkdtempSync,
  openSync, readSync, rmSync, writeSync,
} from "node:fs";
import { dirname, join } from "node:path";

const MAX_FILES = 20_000;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 512 * 1024 * 1024;
const MAX_TREE_BYTES = 8 * 1024 * 1024;
const MAX_REPORT_BYTES = 16 * 1024 * 1024;

function fail(detail) {
  throw new Error(`curriculum inventory: ${detail}`);
}

function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino
    && left.size === right.size && left.mode === right.mode
    && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

function directory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("tracked path traverses a non-directory or symlink");
  return stat;
}

// The listing must come from one exact HEAD commit, not Git's index/stat cache.
export function authenticateTrackedTree(root, treeListing) {
  if (!Number.isInteger(constants.O_NOFOLLOW)) fail("platform lacks no-follow file opens");
  if (!Buffer.isBuffer(treeListing) || treeListing.length > MAX_TREE_BYTES) fail("invalid or oversized tracked tree");
  const text = treeListing.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(treeListing) || !text.endsWith("\0")) fail("tracked tree must be complete UTF-8 records");
  const rows = text.slice(0, -1).split("\0");
  if (rows.length > MAX_FILES) fail("tracked tree exceeds file bound");
  const seen = new Set();
  const chunk = Buffer.alloc(64 * 1024);
  let total = 0;
  for (const row of rows) {
    const match = /^(100644|100755) blob ([0-9a-f]{40})\t([^\0]+)$/u.exec(row);
    if (!match) fail("tracked tree contains a nonordinary file or malformed row");
    const [, mode, expected, path] = match;
    const parts = path.split("/");
    if (parts.some((part) => part === "" || part === "." || part === "..") || seen.has(path)) fail("unsafe or duplicate tracked path");
    seen.add(path);
    let parent = root;
    const parents = [[parent, directory(parent)]];
    for (const part of parts.slice(0, -1)) {
      parent = join(parent, part);
      parents.push([parent, directory(parent)]);
    }
    const file = join(parent, parts.at(-1));
    const before = lstatSync(file);
    if (!before.isFile() || before.isSymbolicLink()) fail("tracked file is not ordinary");
    if (!Number.isSafeInteger(before.size) || before.size > MAX_FILE_BYTES || total + before.size > MAX_TOTAL_BYTES) fail("tracked content exceeds byte bound");
    if (((before.mode & 0o111) !== 0) !== (mode === "100755")) fail("tracked executable mode differs from HEAD");
    total += before.size;
    const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    let failed = false;
    let failure;
    try {
      if (!sameFile(before, fstatSync(fd))) fail("tracked file changed while opening");
      const hash = createHash("sha1").update(`blob ${before.size}\0`);
      let offset = 0;
      while (offset < before.size) {
        const count = readSync(fd, chunk, 0, Math.min(chunk.length, before.size - offset), null);
        if (count === 0) fail("tracked file truncated while reading");
        hash.update(chunk.subarray(0, count));
        offset += count;
      }
      if (readSync(fd, chunk, 0, 1, null) !== 0 || !sameFile(before, fstatSync(fd))) fail("tracked file changed while reading");
      if (hash.digest("hex") !== expected) fail("tracked bytes differ from HEAD");
    } catch (error) {
      failed = true;
      failure = error;
    } finally {
      try {
        closeSync(fd);
      } catch (error) {
        if (!failed) {
          failed = true;
          failure = error;
        }
      }
    }
    if (failed) throw failure;
    if (!sameFile(before, lstatSync(file))) fail("tracked file changed after reading");
    for (const [path_, before_] of parents) {
      const after = directory(path_);
      if (before_.dev !== after.dev || before_.ino !== after.ino) fail("tracked parent changed while reading");
    }
  }
  return { files: seen.size, bytes: total };
}

// A same-filesystem hard link is create-only: no incomplete or overwritten report.
export function publishInventoryExclusive(output, bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length > MAX_REPORT_BYTES) fail("invalid or oversized report");
  const staging = mkdtempSync(join(dirname(output), ".fe2o3-curriculum-inventory-"));
  let fd;
  let failed = false;
  let failure;
  try {
    const staged = join(staging, "report.json");
    fd = openSync(staged, "wx", 0o600);
    let offset = 0;
    while (offset < bytes.length) {
      const count = writeSync(fd, bytes, offset, bytes.length - offset);
      if (!Number.isSafeInteger(count) || count <= 0 || count > bytes.length - offset) fail("report write made invalid progress");
      offset += count;
    }
    fsyncSync(fd);
    const closing = fd;
    fd = undefined;
    closeSync(closing);
    linkSync(staged, output);
  } catch (error) {
    failed = true;
    failure = error;
  } finally {
    try {
      if (fd !== undefined) closeSync(fd);
    } catch (error) {
      if (!failed) {
        failed = true;
        failure = error;
      }
    }
    try {
      rmSync(staging, { recursive: true });
    } catch (error) {
      if (!failed) {
        failed = true;
        failure = error;
      }
    }
  }
  if (failed) throw failure;
}
