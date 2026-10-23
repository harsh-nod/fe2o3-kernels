import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import { currentGfx950ExcerptNotice, currentGfx950ExcerptSource } from "../src/content/current-gfx950-excerpts";

const expected = [
  ["gfx950-advanced-moe", "gfx950_moe_route_fp4_t16_e4_k2_v1"],
  ["gfx950-indexed-sparse-attention", "gfx950_content_sparse_attention"],
  ["gfx950-compressed-hybrid-attention", "gfx950_compressed_hybrid_attention"],
  ["gfx950-speculative-mtp-verification", "gfx950_speculative_transaction_v1"],
  ["gfx950-ngram-embedding-gather", "gfx950_qwen_ngram_gather_v1"],
  ["gfx950-muon-optimizer", "gfx950_stage_gradient_shard_v1"],
  ["gfx950-fp8-attention", "gfx950_fp8_attention_rust"],
  ["gfx950-fp8-attention-performance-lab", "gfx950_fp8_attention_rust"],
  ["gfx950-content-sparse-performance-lab", "gfx950_content_sparse_attention"],
  ["gfx950-compressed-hybrid-performance-lab", "gfx950_compressed_hybrid_attention"],
  ["gfx950-moe-route-performance-lab", "gfx950_moe_route_fp4_t16_e4_k2_v1"],
  ["gfx950-moe-expert-performance-lab", "gfx950_moe_expert_rank_fp4_fp8_v1"],
  ["gfx950-expert-combine-performance-lab", "gfx950_combine_expert_ranks_v1"],
  ["gfx950-speculative-performance-lab", "gfx950_speculative_transaction_v1"],
  ["gfx950-ngram-performance-lab", "gfx950_qwen_ngram_gather_v1"],
  ["gfx950-gradient-stage-performance-lab", "gfx950_stage_gradient_shard_v1"],
  ["gfx950-muon-performance-lab", "gfx950_muon_update_4x4_v1"],
] as const;

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

describe("current gfx950 excerpts and historical evidence", () => {
  it.each(expected)("binds %s to current physical fragments without transferring claims", (id, symbol) => {
    const lesson = lessons.find((item) => item.id === id)!;
    const tab = lesson.tabs[0];
    const source = currentGfx950ExcerptSource(symbol)!;
    expect(tab.sourceCommit).toBe(source.commit);
    expect(tab.sourcePath).toBe(source.path);
    expect(tab.sourceDigestScope).toBe("displayed");
    expect(tab.sourceSha256).toBe(sha256(tab.code));
    expect(tab.explanatory).toBe(false);
    expect(tab.notice).toContain(currentGfx950ExcerptNotice);
    const fragments = tab.sourceFragments ?? [tab.code];
    expect(fragments.join("\n\n")).toBe(tab.code);
    const spans = fragments.map((fragment) => {
      const start = source.code.indexOf(fragment);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(source.code.indexOf(fragment, start + 1)).toBe(-1);
      return [start, start + fragment.length];
    }).sort((a, b) => a[0] - b[0]);
    for (let index = 1; index < spans.length; index += 1) {
      expect(spans[index][0]).toBeGreaterThanOrEqual(spans[index - 1][1]);
    }
    const claim = lesson.claims.find((item) => item.kind === "gpu-observed")!;
    expect(claim.reference?.commit).toBe(id.endsWith("-performance-lab")
      ? "e5351640e3df3868205bc68eac8d5ff5556352ea"
      : "9006001157e2c3062e44088634e467b0f8963ee0");
    expect(claim.detail).toContain(currentGfx950ExcerptNotice);
  });

  it.each([
    ["advanced_systems", "45b9a7e5198bf274f6814438a230ec22405fde713b39f080bb4045c303f671ab", "0211e451f562b961eea723fd4d5a6c5b188cfaab83ae2354ff8bcf36dd5056d6"],
    ["advanced_attention", "d39afa52a9143033ce4edd58607f2d9897e1293ffe7310c588cb0cc30f029349", "b37d2717079a596f0efac2de38bf670e96364f931b01622fc59b5e2506f11240"],
    ["low_precision", "219691cbccdd6f71ac86a7f54c27f7891e8b022484ca7efffcfc59a12e4b29af", "feebb7e80801c6b5323d19bcdb7908b93a5159c26fe2aa8181fb2de623bf6a5d"],
  ])("retains separate public current and historical %s snapshots", (name, current, historical) => {
    expect(sha256(readFileSync(`examples/gfx950_${name}/src/kernel_current.rs`))).toBe(current);
    expect(sha256(readFileSync(`examples/gfx950_${name}/src/kernel.rs`))).toBe(historical);
  });

  it("does not rebind unrelated symbols", () => {
    expect(currentGfx950ExcerptSource("gfx950_fp4_attention_rust")).toBeUndefined();
    expect(currentGfx950ExcerptSource("gfx950_gpt_oss_120b_decode_megakernel_v1")).toBeUndefined();
  });
});
