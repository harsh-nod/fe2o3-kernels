import { describe, expect, it } from "vitest";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { FE2O3_PIN, evidenceLabels } from "../src/content/model";
import {
  developmentCheckpoints,
  kernelProgress,
  progressSnapshot,
  tiledGemmV1Commits,
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

        const reference = claim.reference;
        expect(reference?.commit).toMatch(/^[0-9a-f]{40}$/);
        expect(reference?.tree).toMatch(/^[0-9a-f]{40}$/);
        expect(reference?.commands.length).toBeGreaterThan(0);
        expect(reference?.sourcePaths.length).toBeGreaterThan(0);
        if (reference?.scope === "lesson-evidence") {
          expect(reference.commit).toBe(FE2O3_PIN.commit);
          expect(reference.tree).toBe(FE2O3_PIN.tree);
        } else if (reference?.scope === "staged-progress") {
          expect(reference.claim).toBe(claim.kind);
          expect([
            "source-admission-only",
            "harness-only",
            "structural-admission-only",
          ]).toContain(reference.authority);
        }
        for (const path of reference?.sourcePaths ?? []) {
          expect(path).not.toMatch(/^\//);
          expect(path).not.toContain("..");
        }
      }
    }
  });

  it("requires complete staged evidence references mechanically", () => {
    const mutations: Array<{
      field: string;
      value: unknown;
      message: string;
    }> = [
      {
        field: "commit",
        value: undefined,
        message: "claim has no exact commit",
      },
      { field: "tree", value: undefined, message: "claim has no exact tree" },
      { field: "commands", value: [], message: "claim has no exact command" },
      { field: "sourcePaths", value: [], message: "claim has no source path" },
      {
        field: "claim",
        value: "gpu-observed",
        message: "staged reference claim label does not match its claim",
      },
      {
        field: "authority",
        value: "",
        message: "staged reference has no recognized authority label",
      },
    ];

    for (const mutation of mutations) {
      const changed = structuredClone(curriculum);
      const lesson = changed
        .flatMap((module) => module.lessons)
        .find((entry) => entry.id === "read-the-evidence");
      const reference = lesson?.claims.find(
        (claim) => claim.label === "Staged tiled source bridge",
      )?.reference;
      expect(reference?.scope).toBe("staged-progress");
      const mutable = reference as unknown as Record<string, unknown>;
      if (mutation.value === undefined) {
        delete mutable[mutation.field];
      } else {
        mutable[mutation.field] = mutation.value;
      }
      expect(validateCurriculum(changed)).toContainEqual(
        expect.objectContaining({ message: mutation.message }),
      );
    }
  });

  it("records every staged tiled statement with exact limited authority", () => {
    const lesson = lessons.find((entry) => entry.id === "read-the-evidence");
    const staged = lesson?.claims.filter(
      (claim) => claim.reference?.scope === "staged-progress",
    );
    expect(
      staged?.map((claim) => ({
        label: claim.label,
        kind: claim.kind,
        commit: claim.reference?.commit,
        tree: claim.reference?.tree,
        authority:
          claim.reference?.scope === "staged-progress"
            ? claim.reference.authority
            : undefined,
      })),
    ).toEqual([
      {
        label: "Staged tiled source bridge",
        kind: "compiler-hsaco-observed",
        commit: "fb75e19a73ec0a9acebb203bd9821190b0592c82",
        tree: "0a57b2b6d14121da92dbbb2d7c4f9d8b4df4ce63",
        authority: "source-admission-only",
      },
      {
        label: "Staged Cargo metadata normalization",
        kind: "compiler-hsaco-observed",
        commit: "b904f5b648c7eb249d32d73db427abe72970315a",
        tree: "a5b07af23c9fcf5f04ddcad1c18a6318469e6e06",
        authority: "source-admission-only",
      },
      {
        label: "Staged Cargo root normalization",
        kind: "compiler-hsaco-observed",
        commit: "51bd129c31b08b636545f12229f34aaa431321f2",
        tree: "8be992dee9f145c73f61bb05f0066656298a7c75",
        authority: "source-admission-only",
      },
      {
        label: "Staged tiled hardware harness",
        kind: "compiler-hsaco-observed",
        commit: "b825661ac3f7e332d2cc9723ed1efbb54869fa33",
        tree: "ea96ff13212e02390c881b74e2ea47aaf3018f1b",
        authority: "harness-only",
      },
      {
        label: "Staged tiled structural admission",
        kind: "compiler-hsaco-observed",
        commit: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
        tree: "1396be8ff4947a16ddc6aabae7390cc376992c61",
        authority: "structural-admission-only",
      },
    ]);
    expect(staged?.every((claim) => claim.reference?.commands.length)).toBe(true);
    expect(staged?.every((claim) => claim.reference?.sourcePaths.length)).toBe(true);
    expect(staged?.some((claim) => claim.kind === "gpu-observed")).toBe(false);
  });

  it("scopes the acb3 pin to lesson evidence, not staged progress", () => {
    const lesson = lessons.find((entry) => entry.id === "read-the-evidence");
    const baseline = lesson?.claims.find(
      (claim) => claim.label === "Audited lesson baseline",
    );
    expect(baseline?.detail).toContain("Lesson evidence claims are pinned");
    expect(baseline?.detail).toContain(
      "separately gated implementation-progress snapshot",
    );
    expect(baseline?.reference).toMatchObject({
      scope: "lesson-evidence",
      commit: FE2O3_PIN.commit,
      tree: FE2O3_PIN.tree,
    });
    expect(JSON.stringify(lessons)).not.toMatch(
      /guarded hardware (?:run|result)/iu,
    );
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
  it("gates the eventual public target on both public main refs", () => {
    expect(validateProgress()).toEqual([]);
    expect(progressSnapshot.auditedCommit).toBe(FE2O3_PIN.commit);
    expect(progressSnapshot).toMatchObject({
      reviewedOn: "2026-08-14",
      lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
      lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
      eventualPublicCommit: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
      eventualPublicTree: "1396be8ff4947a16ddc6aabae7390cc376992c61",
      publicationGate: {
        state: "blocked-until-public-refs-match",
        requiredCommit: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
        requiredRefs: [
          "harsh-nod/fe2o3@refs/heads/main",
          "powderluv/fe2o3@refs/heads/main",
        ],
      },
    });
    expect(progressSnapshot.publicationGate.requirement).toContain(
      "Do not publish this site revision until both required public refs",
    );
    expect(developmentCheckpoints[0]).toMatchObject({
      name: "Eventual public main (publication gated)",
      commit: progressSnapshot.eventualPublicCommit,
      state: "queued",
    });
    expect(developmentCheckpoints[0].detail).toContain(
      "not an observation of current remote state",
    );
    expect(developmentCheckpoints[1]).toMatchObject({
      name: "Last audited public baseline",
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
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
      commit: progressSnapshot.lastAuditedPublicCommit,
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
      commit: progressSnapshot.lastAuditedPublicCommit,
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
      commit: progressSnapshot.lastAuditedPublicCommit,
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
      commit: "b704651757a3d46801144277e025f68153cb1ba9",
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

  it("keeps the tiled GEMM fragment probe separate from the four-slice profile", () => {
    const foundation = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 layout and frontend foundations",
    );
    expect(foundation).toMatchObject({
      commit: "286331aab8639dd3707e55cdf51a83f8854d26a5",
      state: "public",
    });
    expect(foundation?.detail).toContain(
      "2ef91896bcdc4d26624f952e5c905c787cd9bc9e",
    );
    expect(foundation?.detail).toContain(
      "commit 027ab901bef7007d0e8da3370470556ed28baad1",
    );
    expect(foundation?.detail).toContain(
      "Exhaustive 64-lane x 4-component goldens",
    );
    expect(foundation?.detail).toContain(
      "23 public Verus proof functions discharge 73 obligations",
    );
    expect(foundation?.detail).toContain(
      "five formula mutations are rejected",
    );
    expect(foundation?.detail).toContain(
      "build-scoped WG64/288-byte fragment probe",
    );
    expect(foundation?.detail).toContain(
      "neither the later four-slice production profile nor the independent WG256/384-byte mutation",
    );
  });

  it("tracks source-authenticated tiled lowering without claiming refinement", () => {
    const sourceBridge = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 source-authenticated compiler bridge",
    );
    expect(sourceBridge).toMatchObject({
      commit: tiledGemmV1Commits.sourceBridge,
      state: "acceptance",
    });
    expect(sourceBridge?.detail).toContain(
      "A:&[u16], B:&[u16], C:&[f32], D:DisjointSlice<f32>",
    );
    expect(sourceBridge?.detail).toContain(
      "portable-MIR identity, compiler profile, gfx942:xnack-, COV6, WG64, zero LDS",
    );
    expect(sourceBridge?.detail).toContain(
      "64-byte explicit plus 256-byte implicit four-slice ABI",
    );
    expect(sourceBridge?.detail).toContain(
      "eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores",
    );
    expect(sourceBridge?.detail).toContain(
      "AMDGCN lowering represents the BF16 carriers with i16 loads",
    );
    expect(sourceBridge?.detail).toContain("private single-use receipt");
    expect(sourceBridge?.detail).toContain(
      "b904f5b648c7eb249d32d73db427abe72970315a normalizes only Cargo-generated metadata in the semantic commitment",
    );
    expect(sourceBridge?.detail).toContain(
      "full observed argv and metadata remain receipt-bound",
    );
    expect(sourceBridge?.detail).toContain(
      "51bd129c31b08b636545f12229f34aaa431321f2 normalizes only the Cargo-generated root shape",
    );
    expect(sourceBridge?.detail).toContain(
      "full observed root remains receipt-bound",
    );
    expect(sourceBridge?.detail).toContain("Worker V2 handoff remains inert");
    expect(sourceBridge?.detail).toContain(
      "not a compiler refinement proof",
    );
    expect(sourceBridge?.detail).toContain(
      "no final-HSACO, publication, loading, or launch authority",
    );
  });

  it("tracks the guarded tiled hardware harness without inventing a run receipt", () => {
    const hardware = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 guarded gfx942 hardware harness",
    );
    expect(hardware).toMatchObject({
      commit: tiledGemmV1Commits.hardwareEvidence,
      state: "acceptance",
    });
    expect(hardware?.detail).toContain("externally supplied digest-pinned bytes");
    expect(hardware?.detail).toContain("COV6/WG64/320-byte metadata");
    expect(hardware?.detail).toContain("bitwise dyadic 16x16 oracle");
    expect(hardware?.detail).toContain(
      "A/B/C inputs remained bitwise unchanged",
    );
    expect(hardware?.detail).not.toMatch(/immutable\s+inputs/);
    expect(hardware?.detail).toContain(
      "contains no committed run receipt",
    );
    expect(hardware?.detail).toContain(
      "exact hardware execution remains uncommitted and non-authoritative",
    );
    expect(hardware?.detail).not.toMatch(/[\d,]+-byte (?:COV6 )?HSACO/);
    expect(hardware?.detail).not.toMatch(/SHA-256 [0-9a-f]{64}/);
    expect(hardware?.detail).not.toMatch(/passed \d+\/\d+ in/);
    expect(hardware?.detail).not.toContain("ROCm");
  });

  it("tracks structural artifact admission without claiming body semantics", () => {
    const structural = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 structural artifact admission",
    );
    expect(structural).toMatchObject({
      commit: tiledGemmV1Commits.structuralAdmission,
      state: "queued",
    });
    expect(structural?.detail).toContain(
      "four slices in 64 explicit bytes, a 256-byte implicit suffix",
    );
    expect(structural?.detail).toContain(
      "separately rejects the WG64/288-byte fragment probe",
    );
    expect(structural?.detail).toContain(
      "independent WG256 and 384-byte structural mutations",
    );
    expect(structural?.detail).toContain("accepts arbitrary .text");
    expect(structural?.detail).toContain(
      "does not inspect machine-body semantics",
    );
    expect(structural?.detail).toContain(
      "no publication, loading, or launch authority",
    );
    expect(structural?.detail).toContain("no COMGR path is added");
  });

  it("keeps tiled GEMM partial until source, body, authority, and race closure", () => {
    expect(
      kernelProgress.find((kernel) => kernel.id === "tiled-gemm"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: [
        "source-derived Worker V2 final HSACO",
        "machine-body semantic admission",
        "protected publication, load, and launch authority",
        "LDS ownership and race proof",
      ],
    });
  });

  it("teaches the staged tiled evidence boundaries without repinning claims", () => {
    const orientation = JSON.stringify(
      lessons.find((lesson) => lesson.id === "read-the-evidence"),
    );
    const mapping = JSON.stringify(
      lessons.find((lesson) => lesson.id === "gemm-tiling"),
    );
    const proofPlan = JSON.stringify(
      lessons.find((lesson) => lesson.id === "gemm-proof-plan"),
    );

    expect(orientation).toContain(tiledGemmV1Commits.structuralAdmission);
    expect(orientation).toContain(
      "must not be published until both harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main",
    );
    expect(orientation).toContain("not a compiler refinement proof");
    expect(orientation).toContain(
      "Exact hardware execution remains uncommitted and non-authoritative",
    );
    expect(orientation).toContain("does not inspect machine-body semantics");

    for (const commit of Object.values(tiledGemmV1Commits)) {
      expect(mapping).toContain(commit);
    }
    expect(mapping).toContain("Worker V2 handoff is inert");
    expect(mapping).toContain(
      "eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores",
    );
    expect(mapping).toContain(
      "WG64/288-byte fragment probe and independent WG256 and 384-byte mutations",
    );
    expect(mapping).toContain("inputs remained bitwise unchanged");
    expect(mapping).not.toMatch(/immutable\s+inputs/);
    expect(mapping).toContain("source-derived, authority-bearing final HSACO");
    expect(mapping).toContain("race freedom remain open");

    expect(proofPlan).toContain(
      "Source-to-canonical lowering is not compiler refinement",
    );
    expect(proofPlan).toContain(
      "exact hardware execution remains uncommitted and non-authoritative",
    );
    expect(proofPlan).toContain(
      "structural admission does not inspect machine-body semantics",
    );
  });
});
