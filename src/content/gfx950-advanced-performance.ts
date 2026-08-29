import type { CodeTab } from "./model";

interface AdvancedPerformanceRecord {
  lessonId: string;
  evidencePath: string;
  lines: string[];
}

const boundedClaim = [
  "CLAIM BOUNDARY",
  "These are fixed-shape MI350X measurements, not universal state-of-the-art claims.",
  "A fastest statement applies only to the exact admitted artifacts and protocol named below.",
  "Framework, full-model, multi-workgroup, and differently shaped implementations are not comparable here.",
];

const mi350SystemProtocol = [
  "MI350X PROTOCOL",
  "Host: smci350-rck-g03-b19-03; physical GPU 6; gfx950; ROCm 7.2.1",
  "Timer: ROCr HSA dispatch timestamps at 1 GHz",
  "One process; 200 warmups; 5 blocks x 50 samples; 10 untimed block-rewarm dispatches",
  "Correctness gate: existing CPU oracle, immutable-input checks, and output canaries",
  "Statistical limit: bounded single-process ablation; publishable fastest-kernel claim=false",
];

const records: AdvancedPerformanceRecord[] = [
  {
    lessonId: "gfx950-advanced-moe",
    evidencePath:
      "examples/gfx950_advanced_systems/optimization-evidence-v1.json",
    lines: [
      "OPTIMIZATION STACK AND CONTRIBUTION",
      "Route: compute each token route once per wave, broadcast the choices, and reuse a packed route map.",
      "  Performance contribution: unavailable; production lowering is blocked by ConstantIndex projection.",
      "Expert rank: one Wave64 with four-element blocked ownership and three mixed FP4/FP8 MFMAs.",
      "  Performance contribution: unavailable; production lowering is blocked by checked-index effect validation.",
      "Combine: a one-wave blocked mapping was rejected after proof failure; the exact 256-thread mapping was retained.",
      "  Baseline 5.00 us [4.96, 5.00]; retained 5.00 us [4.96, 5.00]; contribution 0 ns, 1.00x.",
      "  Static ISA is unchanged: 291 instructions, 5 VGPRs, 22 SGPRs.",
      "",
      ...mi350SystemProtocol,
      "",
      "THEORETICAL RESOURCE FLOORS",
      "Formula: max(logical bytes / 8 TB/s, FP32 ops / 144.2 TFLOP/s, mixed FP4/FP8 ops / 4.6 PFLOP/s).",
      "Route: max(4,880 B / 8 TB/s, 16,384 FP32 ops / 144.2 TFLOP/s) = 0.610 ns; measured ratio unavailable.",
      "Expert rank: max(9,472 B / 8 TB/s, 196,608 mixed ops / 4.6 PFLOP/s) = 1.184 ns; measured ratio unavailable.",
      "Combine: max(3,072 B / 8 TB/s, 256 FP32 ops / 144.2 TFLOP/s) = 0.384 ns; retained/floor = 13,021x.",
      "The floors assume fully occupied whole-device resources and exclude dispatch, dependencies, and cache effects.",
      "",
      "ADMITTED COMPARATOR RESULT",
      "Combine ties its one exact admitted baseline. Route and expert rank have no admitted timed Rust artifact.",
      ...boundedClaim,
    ],
  },
  {
    lessonId: "gfx950-attnres-gr-mhc",
    evidencePath:
      "examples/gfx950_advanced_attention/performance-mhc-sinkhorn-v1.json",
    lines: [
      "OPTIMIZATION STACK",
      "1. Assign one rotated 4x4 mixing-matrix element to each lane in four contiguous wave16 groups.",
      "2. Reduce each four-element row inside its subgroup and reuse one reciprocal for all four elements.",
      "3. Replace divergent column selection with four verifier-bounded lane broadcasts.",
      "4. Broadcast final row weights once and reuse them across the four stream loads.",
      "",
      "CONTRIBUTION BREAKDOWN",
      "Distributed lanes: v_exp_f32 16 -> 1 (-93.75%); global dword loads 12 -> 5 (-58.33%).",
      "Row reduction plus reciprocal reuse: expanded divides 96 -> 6 and v_rcp_f32 96 -> 6 (-93.75% each).",
      "Bounded column broadcasts: scalar branches 8 -> 2 (-75%); adds 22 ds_bpermute_b32 instructions.",
      "Combined: instructions 1,750 -> 457 (-73.89%); SGPRs 34 -> 22; VGPRs 34 -> 12.",
      "Only the combined rewrite was timed. Overlapping static deltas are not additive marginal latency speedups.",
      "",
      "MI350X PROTOCOL",
      "Host: smci350-rck-g03-b19-03; physical GPU 6; gfx950:xnack-; ROCm 7.2.1",
      "Timer: hsa_amd_profiling_get_dispatch_time with one persistent profiled queue/executable per process",
      "Five fresh processes per variant in alternating AB/BA order",
      "Per process: 1,000 warmups; 30 blocks x 100 samples; 20 untimed block-rewarm dispatches",
      "15,000 paired samples; 10,000 bootstrap repetitions; seed 950",
      "Correctness: independent CPU mHC/Sinkhorn oracle plus output guard canaries; candidate max abs error 5.960464478e-8 <= 3e-3.",
      "",
      "MEASURED RESULT",
      "Published Rust baseline HSACO 0a42de9c...: median 7.160 us; bootstrap 95% CI [7.160, 7.160] us.",
      "Distributed-wave16 HSACO f463b05e...: median 5.040 us; bootstrap 95% CI [5.000, 5.040] us.",
      "Paired median speedup 1.432x; bootstrap 95% CI [1.4318568, 1.432]; latency reduction 30.1676%.",
      "AttnRes and four-branch residual were not included in this performance campaign.",
      "",
      "THEORETICAL RESOURCE FLOOR",
      "Unique bytes = 64 B logits + 256 B streams + 256 B output = 576 B.",
      "Logical arithmetic = 616 FP32 algebraic ops plus 16 exponentials.",
      "max(576 B / 8 TB/s, 616 ops / 144.2 TFLOP/s) = max(0.072 ns, 0.00427 ns) = 0.072 ns.",
      "Candidate/resource floor = 5,040 ns / 0.072 ns = 70,000x.",
      "This strict whole-device floor omits dispatch latency and an exponential dependency-throughput bound.",
      "",
      "ADMITTED COMPARATOR RESULT",
      "The optimized artifact is fastest among the two exact-semantics Rust mHC artifacts admitted by this campaign.",
      ...boundedClaim,
    ],
  },
  {
    lessonId: "gfx950-speculative-mtp-verification",
    evidencePath:
      "examples/gfx950_advanced_systems/optimization-evidence-v1.json",
    lines: [
      "OPTIMIZATION STACK AND CONTRIBUTION",
      "Compute each candidate's accepted prefix once, broadcast it to the eight state elements, and remove the duplicate acceptance path.",
      "Static contribution: global instructions 16 -> 10; VALU 77 -> 62; VGPRs 27 -> 17; SGPRs 66 -> 62.",
      "Measured combined contribution: 8.00 us [8.00, 8.04] -> 5.68 us [5.68, 5.68], saving 2.32 us; 1.408x.",
      "This is one fused rewrite, so no independent per-stage latency attribution is claimed.",
      "",
      ...mi350SystemProtocol,
      "",
      "THEORETICAL RESOURCE FLOOR",
      "Logical payload = 896 B; counted work = 64 committed-state FP32 adds.",
      "max(896 B / 8 TB/s, 64 ops / 144.2 TFLOP/s) = 0.112 ns.",
      "Retained/resource floor = 5,680 ns / 0.112 ns = 50,714x.",
      "The floor counts proposed deltas read by the two committed candidates and excludes dispatch/cache effects.",
      "",
      "ADMITTED COMPARATOR RESULT",
      "The retained artifact is fastest among the exact baseline and acceptance-reuse artifacts in this campaign.",
      ...boundedClaim,
    ],
  },
  {
    lessonId: "gfx950-ngram-embedding-gather",
    evidencePath:
      "examples/gfx950_advanced_systems/optimization-evidence-v1.json",
    lines: [
      "OPTIMIZATION STACK AND CONTRIBUTION",
      "Tested optimization: short-circuit each probe on hash mismatch before the full three-token key comparison.",
      "Result: rejected. Hash-first median 10.68 us [10.64, 10.68] versus branchless baseline 8.52 us [8.52, 8.56].",
      "Negative contribution: +2.16 us, or 25.35% slower relative to the retained 8.52 us path.",
      "Retained design: branchless full-key probe; 878 instructions, 251 VALU, 66 global, 33 branches, 22 VGPRs, 34 SGPRs.",
      "",
      ...mi350SystemProtocol,
      "",
      "THEORETICAL RESOURCE FLOOR",
      "Logical payload = 576 B; hash and key comparisons are integer work and are not mapped to an FP32 peak.",
      "576 B / 8 TB/s = 0.072 ns; retained/resource floor = 8,520 ns / 0.072 ns = 118,333x.",
      "The whole-device bandwidth floor is not a single-wave latency prediction.",
      "",
      "ADMITTED COMPARATOR RESULT",
      "The retained branchless artifact is fastest among the exact branchless and hash-first variants in this campaign.",
      ...boundedClaim,
    ],
  },
  {
    lessonId: "gfx950-muon-optimizer",
    evidencePath:
      "examples/gfx950_advanced_systems/optimization-evidence-v1.json",
    lines: [
      "OPTIMIZATION STACK AND CONTRIBUTION",
      "Stage: retain the existing one-Wave64 exact copy; 5.00 us -> 5.00 us, 0 ns, 1.00x; 282 instructions.",
      "Muon: assign one 4x4 matrix element per lane and exchange reductions/broadcasts across Wave64.",
      "Muon static contribution: instructions 1,360 -> 593; VALU 969 -> 160; branches 21 -> 3; VGPRs 62 -> 19; SGPRs 58 -> 22.",
      "The distributed form adds 86 ds_bpermute instructions while removing redundant per-lane matrix evaluation.",
      "Muon measured combined contribution: 5.72 us [5.70, 5.76] -> 5.04 us [5.00, 5.04], saving 0.68 us; 1.135x.",
      "Distribution and exchange were timed together; their overlapping static effects are not separate latency contributions.",
      "",
      ...mi350SystemProtocol,
      "",
      "THEORETICAL RESOURCE FLOORS",
      "Stage: 128 B / 8 TB/s = 0.016 ns; retained/floor = 312,500x.",
      "Muon: max(196 B / 8 TB/s, 1,649 FP32 ops / 144.2 TFLOP/s) = 0.0245 ns.",
      "Muon retained/resource floor = 5,040 ns / 0.0245 ns = 205,714x.",
      "These optimistic whole-device floors exclude dispatch, dependencies, cache effects, and host-staged reduction time.",
      "",
      "ADMITTED COMPARATOR RESULT",
      "The distributed Muon artifact is fastest among the two exact Muon artifacts admitted by this campaign; stage ties its baseline.",
      ...boundedClaim,
    ],
  },
];

export const advancedPerformanceLessonIds = records.map(
  (record) => record.lessonId,
);

export function advancedPerformanceTabFor(
  lessonId: string,
): CodeTab | undefined {
  const record = records.find((candidate) => candidate.lessonId === lessonId);
  if (!record) return undefined;
  return {
    kind: "performance",
    label: "Performance",
    language: "text",
    code: [
      "FE2O3 GFX950 BOUNDED PERFORMANCE EVIDENCE",
      `Machine-readable record: ${record.evidencePath}`,
      "",
      ...record.lines,
    ].join("\n"),
    explanatory: true,
    notice:
      "Bounded MI350X ablation evidence. Comparator scope, protocol limits, correctness gates, and resource-floor assumptions are part of the record; no universal state-of-the-art claim is made.",
  };
}
