import { createHash } from "node:crypto";
import type { GitEvidenceSource } from "../src/content/evidence-catalog";

/** Validate display bytes against the exact Git blob, without normalization. */
export function validateSourceEvidence(source: GitEvidenceSource, pinned: Buffer): void {
  function fail(message: string): never {
    throw new Error(`evidence validation: ${source.label} ${message}`);
  }

  if (source.fileSha256) {
    const observed = createHash("sha256").update(pinned).digest("hex");
    if (observed !== source.fileSha256) {
      fail(`whole-file digest is ${observed}, required ${source.fileSha256}`);
    }
    if (source.displayedSource !== undefined) {
      if (typeof source.displayedSource !== "string") {
        fail("has non-text whole-file displayed source");
      }
      if (!Buffer.from(source.displayedSource, "utf8").equals(pinned)) {
        fail("displayed whole file differs from the pinned source file");
      }
    }
  }

  if (source.displayedSha256) {
    if (typeof source.displayedSource !== "string") {
      fail("has a displayed digest without displayed source");
    }
    const observed = createHash("sha256")
      .update(Buffer.from(source.displayedSource, "utf8"))
      .digest("hex");
    if (observed !== source.displayedSha256) {
      fail(`displayed excerpt digest is ${observed}, required ${source.displayedSha256}`);
    }
    if (!Array.isArray(source.displayedFragments) || source.displayedFragments.length === 0) {
      fail("has no displayed source fragments");
    }
    if (source.displayedFragments.join("\n\n") !== source.displayedSource) {
      fail("displayed fragments do not reconstruct the displayed source");
    }
    for (const fragment of source.displayedFragments) {
      if (typeof fragment !== "string" || fragment.length === 0) {
        fail("has an empty displayed source fragment");
      }
      if (pinned.indexOf(Buffer.from(fragment, "utf8")) < 0) {
        fail("displayed fragment is absent from the pinned source file");
      }
    }
  }
}
