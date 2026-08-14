import { describe, expect, it } from "vitest";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { FE2O3_PIN, evidenceLabels } from "../src/content/model";
import {
  developmentCheckpoints,
  kernelProgress,
  progressSnapshot,
  validateProgress,
} from "../src/content/progress";
import { validateCurriculum } from "../src/content/validate";

describe("curriculum integrity", () => {
  it("covers modules zero through eight in order", () => {
    expect(curriculum.map((module) => module.number)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(lessons).toHaveLength(18);
    expect(validateCurriculum(curriculum)).toEqual([]);
  });

  it("uses every evidence label", () => {
    const kinds = new Set(
      lessons.flatMap((lesson) => lesson.claims.map((claim) => claim.kind)),
    );
    expect(kinds).toEqual(new Set(Object.keys(evidenceLabels)));
  });

  it("pins every evidenced claim to exact source and commands", () => {
    for (const lesson of lessons) {
      for (const claim of lesson.claims) {
        if (claim.kind === "design-only") {
          expect(claim.reference).toBeUndefined();
          continue;
        }

        expect(claim.reference?.commit).toBe(FE2O3_PIN.commit);
        expect(claim.reference?.commands.length).toBeGreaterThan(0);
        expect(claim.reference?.sourcePaths.length).toBeGreaterThan(0);
        for (const path of claim.reference?.sourcePaths ?? []) {
          expect(path).not.toMatch(/^\//);
          expect(path).not.toContain("..");
        }
      }
    }
  });

  it("makes every glossary item searchable and navigable", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));
    expect(glossary.length).toBeGreaterThan(50);
    for (const entry of glossary) {
      expect(entry.term.trim()).not.toBe("");
      expect(entry.definition.length).toBeGreaterThan(20);
      expect(lessonIds.has(entry.lessonId)).toBe(true);
    }
  });

  it("labels advanced source snippets as explanatory", () => {
    for (const lesson of lessons.filter((entry) => entry.module >= 4)) {
      const runnable = lesson.claims.some(
        (claim) => claim.kind === "runnable-now",
      );
      expect(runnable).toBe(false);
      expect(lesson.tabs.find((tab) => tab.kind === "kernel")?.explanatory).toBe(
        true,
      );
    }
  });
});

describe("implementation progress integrity", () => {
  it("pins public and candidate states without changing lesson authority", () => {
    expect(validateProgress()).toEqual([]);
    expect(progressSnapshot.auditedCommit).toBe(FE2O3_PIN.commit);
    expect(progressSnapshot).toMatchObject({
      reviewedOn: "2026-08-14",
      publicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
      publicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
    });
    expect(progressSnapshot.publicCommit).not.toBe(FE2O3_PIN.commit);
    expect(developmentCheckpoints[0]).toMatchObject({ state: "public" });
  });

  it("tracks every tutorial kernel through three independent gates", () => {
    expect(kernelProgress.map((kernel) => kernel.id)).toEqual([
      "fill",
      "vecadd",
      "scalar-map",
      "wave-collectives",
      "workgroup-reduction",
      "scalar-gemm",
      "tiled-gemm",
      "softmax",
      "flash-attention",
      "moe-routing",
      "moe-experts",
    ]);
    expect(kernelProgress.every((kernel) => kernel.next.length > 0)).toBe(true);
  });

  it("tracks scalar GEMM hardware observation without upgrading authority", () => {
    const scalarCheckpoint =
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.name === "Scalar GEMM V1 vertical slice",
      );
    expect(scalarCheckpoint).toMatchObject({
      commit: progressSnapshot.publicCommit,
      state: "acceptance",
    });
    expect(scalarCheckpoint?.detail).toContain(
      "ac1da70c69a5038b887b459dece40802668c41bcf98f621d7d1273d2f61ba2c9",
    );
    expect(scalarCheckpoint?.detail).toContain(
      "raw smoke deliberately bypasses production prerequisite authentication",
    );
    expect(kernelProgress.find((kernel) => kernel.id === "scalar-gemm")).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: [
        "production protected transaction authenticator",
        "authenticated analyzer-identity binding",
        "compiler and address refinement",
        "protected MI300X launch evidence",
      ],
    });
    expect(
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.name === "Scalar GEMM proof profile",
      )?.detail,
    ).toContain("does not execute Verus");
    const physicalEffectCheckpoint = developmentCheckpoints.find(
      (checkpoint) => checkpoint.name === "Scalar GEMM physical-effect profile",
    );
    expect(physicalEffectCheckpoint).toMatchObject({
      commit: progressSnapshot.publicCommit,
      state: "acceptance",
    });
    expect(physicalEffectCheckpoint?.detail).toContain("upstream LLVM 22");
    expect(physicalEffectCheckpoint?.detail).toContain("exact 60-opcode scalar profile");
    expect(physicalEffectCheckpoint?.detail).toContain(
      "9 address / 8 read / 1 write / 1 return / 0 calls",
    );
    expect(physicalEffectCheckpoint?.detail).toContain("without COMGR");
    expect(physicalEffectCheckpoint?.detail).toContain(
      "static, inert evidence only",
    );
    expect(physicalEffectCheckpoint?.detail).toContain(
      "downstream authenticated evidence must bind the new identity",
    );
  });

  it("tracks production S09 capture without granting compiler or execution authority", () => {
    const s09Checkpoint = developmentCheckpoints.find(
      (checkpoint) => checkpoint.name === "Production S09 rustc invocation capture",
    );
    expect(s09Checkpoint).toMatchObject({
      commit: progressSnapshot.publicCommit,
      state: "public",
    });
    expect(s09Checkpoint?.detail).toContain("RustcInvocationDescriptorV2");
    expect(s09Checkpoint?.detail).toContain("exactly /proc/./self/fd/198");
    expect(s09Checkpoint?.detail).toContain(
      "sole final managed -Zcodegen-backend=<path> selector",
    );
    expect(s09Checkpoint?.detail).toContain("COV6 gfx942:xnack-");
    expect(s09Checkpoint?.detail).toContain("containing exactly alpha");
    expect(s09Checkpoint?.detail).toContain(
      "canonical publication envelope and nested record",
    );
    expect(s09Checkpoint?.detail).toContain(
      "5902632c5c249be05855ae5cef62bb9096a1f9277cfb0c58b4384594d6ee61de",
    );
    expect(s09Checkpoint?.detail).toContain("proves no compiler origin");
    expect(s09Checkpoint?.detail).toContain(
      "no loading, execution, or verification authority",
    );
    expect(s09Checkpoint?.detail).toContain(
      "not a pathname-to-object identity join",
    );
    expect(s09Checkpoint?.detail).toContain(
      "no general source or output-object association",
    );
  });

  it("tracks authenticated Verus V2 without overstating its authority", () => {
    const checkpoint = developmentCheckpoints.find(
      (entry) => entry.name === "Authenticated Verus execution V2",
    );
    expect(checkpoint).toMatchObject({
      commit: progressSnapshot.publicCommit,
      state: "public",
    });
    expect(checkpoint?.detail).toContain("Linux x86_64");
    expect(checkpoint?.detail).toContain(
      "pinned local runtime and tool snapshots",
    );
    expect(checkpoint?.detail).toContain(
      "clone3 pidfds and ptrace-unresumable checkpoints",
    );
    expect(checkpoint?.detail).toContain("seccomp process-creation denial");
    expect(checkpoint?.detail).toContain(
      "exact live executable/backing comparison",
    );
    expect(checkpoint?.detail).toContain(
      "runtime closure and baseline pinning",
    );
    expect(checkpoint?.detail).toContain("vDSO pinning");
    expect(checkpoint?.detail).toContain("immutable sealed results");
    expect(checkpoint?.detail).toContain(
      "compressed and alternate debug-section families",
    );
    expect(checkpoint?.detail).toContain(
      "Package-scoped debug stripping",
    );
    expect(checkpoint?.detail).toContain(
      "bounded two-root gate compares SHA-256, size, and Build ID",
    );
    expect(checkpoint?.detail).toContain("debug V2 integration passed 14/14");
    expect(checkpoint?.detail).toContain("release passed 13/13");
    expect(checkpoint?.detail).toContain(
      "full verifier debug and release suites and 22 doctests passed",
    );
    expect(checkpoint?.detail).toContain(
      "mi300x correctly failed closed on its different vDSO and runtime baseline",
    );
    expect(checkpoint?.detail).toContain(
      "does not integrate stock Verus or Z3",
    );
    expect(checkpoint?.detail).toContain("semantic proof validity");
    expect(checkpoint?.detail).toContain(
      "exclusive measured-image execution between checkpoints",
    );
    expect(checkpoint?.detail).toContain("compiler refinement");
    expect(checkpoint?.detail).toContain("GPU authority");
  });

  it("tracks tiled GEMM IR and build-scoped frontend evidence without claiming GPU closure", () => {
    const tiledCheckpoint = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 host, layout, IR, and frontend ABI",
    );
    expect(tiledCheckpoint).toMatchObject({
      commit: progressSnapshot.publicCommit,
      state: "public",
    });
    expect(tiledCheckpoint?.detail).toContain(
      "2ef91896bcdc4d26624f952e5c905c787cd9bc9e",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "introduced at commit 027ab901bef7007d0e8da3370470556ed28baad1",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "Exhaustive 64-lane x 4-component goldens",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "23 public proof functions discharge 73 obligations",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "five formula mutations are rejected",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "f8a66d3babf764a6f064189e4634da9ee0cb046a separates block counts",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "12 direct global reads",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "four observable F32 stores",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "build-scoped in-process Rust frontend/provider/ABI evidence",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "same-name external providers and copied markers are rejected",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "observed layouts, FnAbi, and provider facts are canonicalized and digested through Kernel IR",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "8 BF16 plus 4 F32 values, 32 explicit bytes plus 256 implicit bytes, 288 total",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "gfx942:xnack-, wave64, and strict FP are bound",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "Genuine LLVM contains the MFMA before final probe compilation",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "opt-in ROCm 7.2.4 MI300X test passed",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "validates final HSACO metadata, not retained MFMA execution or numerical behavior",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "Provenance is intentionally build-scoped",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "hostile layout and FnAbi fixtures currently reject earlier at source-root binding",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "structured matrix evidence lacks an actual matrix Kernel IR wire payload",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "does not establish that the frontend emits the canonical graph",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "dedicated canonical tiled lowering",
    );
    expect(tiledCheckpoint?.detail).toContain(
      "functional final HSACO with audited retained MFMA and stores",
    );
    expect(tiledCheckpoint?.detail).toContain("hardware numerical execution");
    expect(tiledCheckpoint?.detail).toContain("LDS composition");
    expect(tiledCheckpoint?.detail).toContain("memory or race proof");
    expect(tiledCheckpoint?.detail).toContain("protected authority");
    expect(tiledCheckpoint?.detail).toContain(
      "Workflow-only descendant a51c78322e264c06abdb6dc21817aced09653830 installs the Rust 1.97.1 toolchain",
    );
    expect(kernelProgress.find((kernel) => kernel.id === "tiled-gemm")).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
    });
  });
});
