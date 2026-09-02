import { deepFreeze, type DeepReadonly } from "./registry";
import type { OperatorCookbookId } from "./operator-cookbook";

export interface SemanticEquivalenceStage {
  id: string;
  label: string;
  summary: string;
  currentImplementation: string;
  compileTimeFailure: string;
  sourcePaths: readonly string[];
}

export interface WorkedEquivalenceInvariant {
  id: string;
  label: string;
  obligation: string;
  application: string;
  failureMode: string;
}

export interface WorkedEquivalenceSnippet {
  label: string;
  language: "rust" | "bash";
  sourcePath: string;
  code: string;
}

export interface WorkedEquivalenceExample {
  operatorId: OperatorCookbookId;
  lessonId: string;
  title: string;
  summary: string;
  shape: readonly string[];
  whyThisFirst: string;
  snippets: readonly WorkedEquivalenceSnippet[];
  invariants: readonly WorkedEquivalenceInvariant[];
  promotionSteps: readonly string[];
  nonClaims: readonly string[];
}

export interface SemanticEquivalencePageContent {
  status: {
    today: string;
    target: string;
    boundary: string;
  };
  stages: readonly SemanticEquivalenceStage[];
  workedExample: WorkedEquivalenceExample;
}

export const semanticEquivalencePage = deepFreeze({
  status: {
    today:
      "Advanced gfx950 tutorials are runtime CPU-oracle checked today. The compiler already has bounded reference-effect extraction, effect pairing, formula proof receipt admission, and the ranked safety pipeline, but those pieces are not yet synthesized end to end for the advanced kernels.",
    target:
      "The launch target is full compile-time equivalence for a fixed admitted tutorial shape and declared numerical policy: every observable GPU output, state, and metadata effect must refine the safe Rust CPU reference before KIR lowering.",
    boundary:
      "This is not arbitrary Rust-to-GPU equivalence, not source-to-ISA proof, and not hardware correctness. Unsupported loops, effects, barriers, or numerical operations must fail closed.",
  },
  stages: [
    {
      id: "reference-ir",
      label: "Extract the CPU reference",
      summary:
        "rustc MIR for the safe CPU reference is lowered into ReferenceEffectIr: arguments, point coordinates, guards, CFG statements, and observable output writes.",
      currentImplementation:
        "Implemented for a bounded safe-Rust subset with exact rustc function and MIR body identities.",
      compileTimeFailure:
        "Unsupported calls, ambiguous writes, unmodeled loads, unchecked operations, or over-limit expression graphs reject the reference instead of producing authority.",
      sourcePaths: [
        "crates/rustc-codegen-fe2o3/src/reference_effect_v1.rs",
        "docs/functional-refinement-receipt-v2.md",
      ],
    },
    {
      id: "gpu-effects",
      label: "Extract the GPU effects",
      summary:
        "The fe2o3 kernel is projected into ranked PLIRON/KIR effects with output coordinates, path guards, memory regions, execution layout, and synchronization epochs.",
      currentImplementation:
        "The ranked path carries bounded tensor, memory, atomic, race, hierarchy, barrier, workgroup-memory, and semantic-refinement reports.",
      compileTimeFailure:
        "Unknown regions, unresolved dynamic bounds, divergent barriers, races, uninitialized LDS reads, or unsupported target operations stop compilation.",
      sourcePaths: [
        "crates/rustc-codegen-fe2o3/src/production_ranked_projection_v1.rs",
        "docs/general-kernel-check-pipeline-v1.md",
        "docs/production-middle-end-evidence-v5.md",
      ],
    },
    {
      id: "effect-bijection",
      label: "Pair CPU and GPU writes",
      summary:
        "Independently extracted CPU and GPU observable writes are matched by output argument, logical coordinate, and normalized guard.",
      currentImplementation:
        "The one-to-one pairing rejects missing, extra, ambiguous, coordinate-mismatched, and guard-mismatched GPU effects.",
      compileTimeFailure:
        "A GPU write that has no CPU reference write, or a CPU write with no matching GPU effect, cannot enter the functional-refinement join.",
      sourcePaths: [
        "crates/rustc-codegen-fe2o3/src/reference_effect_bijection_v1.rs",
      ],
    },
    {
      id: "parallel-invariants",
      label: "Prove the parallel structure",
      summary:
        "The compiler proves the GPU lane, wavefront, workgroup, barrier, LDS, and atomic structure implements one legal logical effect per reference coordinate or a declared finite collective.",
      currentImplementation:
        "Safety mechanics are target-neutral: bounds, race freedom, atomic legality, barrier convergence, and LDS epoch publication are checked before semantic authority is retained.",
      compileTimeFailure:
        "A barrier reached by only part of its scope, a reused LDS epoch, a colliding output map, or a data-dependent scatter without an injectivity contract is rejected.",
      sourcePaths: [
        "docs/gpu-safety-contract-v1.md",
        "docs/verification-model.md",
      ],
    },
    {
      id: "formula-proof",
      label: "Replay value formulas",
      summary:
        "The compiler builds coordinate, domain, precondition, and RHS value formula pairs and emits the Verus proof internally.",
      currentImplementation:
        "Integer and boolean formulas use interpreted bitvector semantics; floating-point formulas currently use explicit operator-congruence policy unless a stronger model is added.",
      compileTimeFailure:
        "Wrong formula hashes, stale subjects, forged receipts, missing receipts, wrong authority boundary, or non-Proved Verus results reject the build.",
      sourcePaths: [
        "crates/fe2o3-verifier/src/functional_refinement_receipt_v2.rs",
        "crates/rustc-codegen-fe2o3/src/production_reference_effect_join_v2.rs",
      ],
    },
    {
      id: "lowering-gate",
      label: "Lower only after proof admission",
      summary:
        "The imported proof is consumed at the compiler-owned join, the exact graph is rechecked, and KIR lowering input is issued only from the verified typestate.",
      currentImplementation:
        "Production admission accepts SafeReferenceMirToKernelMir receipts and re-runs mandatory ranked analyses before preparing lowering input.",
      compileTimeFailure:
        "Unbound requests, missing receipts, boundary mismatches, or declared/proved counter mismatches prevent lowering.",
      sourcePaths: [
        "crates/fe2o3-pliron/src/production/ranked.rs",
        "crates/fe2o3-pliron/tests/production_ranked_pipeline.rs",
      ],
    },
  ],
  workedExample: {
    operatorId: "kda-gdn",
    lessonId: "gfx950-kda-gdn-linear-attention",
    title: "Worked example: Kimi Delta Attention decode and prefill",
    summary:
      "The KDA tutorial is the public worked example because it exposes the hard parts users care about: recurrence state, multiple observable outputs, Wave16 reductions, ordered chunk prefill, and a numerical policy boundary.",
    shape: [
      "One Kimi Delta Attention/GDN head with K=16 and V=16.",
      "One FP32 16x16 recurrent matrix state, physically stored value-major.",
      "Decode performs one token update and emits final_state plus replicated output.",
      "Prefill performs eight ordered tokens as two C=4 WY/UT chunks.",
      "The MI350X runners compare final state, chunk outputs, canaries, immutable inputs, and finite-value policy against an independent safe CPU reference.",
    ],
    whyThisFirst:
      "It is a realistic advanced tutorial without pretending arbitrary GPU code is proved today. The current KDA kernels are runtime CPU-oracle checked; making this compile-time authoritative requires a closed recurrence contract plus collective-value and multi-output refinement.",
    snippets: [
      {
        label: "Safe CPU reference",
        language: "rust",
        sourcePath: "examples/gfx950_advanced_attention/src/reference.rs",
        code:
          "pub fn kda_prefill_reference_v2(\n    query: &[f32],\n    key: &[f32],\n    value: &[f32],\n    alpha: &[f32],\n    beta: &[f32],\n    initial_state: &[f32],\n) -> Result<KdaPrefillOutputV1, ReferenceErrorV1> {\n    validate_finite_v1(query, PREFILL_TOKENS_V1 * KDA_KEY_DIMENSION_V1)?;\n    validate_finite_v1(key, PREFILL_TOKENS_V1 * KDA_KEY_DIMENSION_V1)?;\n    validate_finite_v1(value, PREFILL_TOKENS_V1 * KDA_VALUE_DIMENSION_V1)?;\n    validate_kda_gates_v2(alpha, beta)?;\n    let mut state = initial_state.iter().map(|entry| f64::from(*entry)).collect::<Vec<_>>();\n    let mut output = vec![0.0_f32; PREFILL_TOKENS_V1 * KDA_VALUE_DIMENSION_V1];\n    let mut chunk_state = Vec::new();\n    for token in 0..PREFILL_TOKENS_V1 {\n        let key_start = token * KDA_KEY_DIMENSION_V1;\n        let value_start = token * KDA_VALUE_DIMENSION_V1;\n        let (next, token_output) = kda_matrix_step_f64_v2(\n            &query[key_start..key_start + KDA_KEY_DIMENSION_V1],\n            &key[key_start..key_start + KDA_KEY_DIMENSION_V1],\n            &value[value_start..value_start + KDA_VALUE_DIMENSION_V1],\n            &alpha[key_start..key_start + KDA_KEY_DIMENSION_V1],\n            beta[token],\n            &state,\n        );\n        state = next;\n        output[value_start..value_start + KDA_VALUE_DIMENSION_V1]\n            .copy_from_slice(&token_output.into_iter().map(|entry| entry as f32).collect::<Vec<_>>());\n        if token + 1 == KDA_CHUNK_TOKENS_V1 {\n            chunk_state = state.iter().map(|entry| *entry as f32).collect();\n        }\n    }\n    Ok(KdaPrefillOutputV1 {\n        chunk_state,\n        final_state: state.into_iter().map(|entry| entry as f32).collect(),\n        output,\n    })\n}",
      },
      {
        label: "fe2o3 kernel core",
        language: "rust",
        sourcePath: "examples/gfx950_advanced_attention/src/kernel.rs",
        code:
          "pub fn gfx950_kda_chunkwise_prefill(\n    query: &[f32], key: &[f32], value: &[f32], alpha: &[f32], beta: &[f32],\n    initial_state: &[f32], mut final_state: DisjointSlice<f32, Index1D>,\n    mut output_chunk0: DisjointSlice<f32, Index1D>,\n    mut output_chunk1: DisjointSlice<f32, Index1D>,\n) {\n    if query.len() != PREFILL_TOKENS_V1 * KDA_KEY_DIMENSION_V1 ||\n       final_state.len() != KDA_STATE_ELEMENTS_V1 ||\n       output_chunk0.len() != KDA_STATE_ELEMENTS_V1 ||\n       output_chunk1.len() != KDA_STATE_ELEMENTS_V1 { return; }\n    let linear = thread::index_1d().get();\n    let key_index = linear & 15;\n    let value_column = linear >> 4;\n    let subgroup = Gfx950Subgroup::current();\n    let mut state = initial_state.load_or(value_column, key_index, 0.0);\n    let mut c00 = 0.0; let mut c01 = 0.0; let mut c02 = 0.0; let mut c03 = 0.0;\n    kda_chunk_wy_v1!(0, query, key, value, alpha, beta, subgroup, key_index, value_column, state, c00, c01, c02, c03);\n    let mut c10 = 0.0; let mut c11 = 0.0; let mut c12 = 0.0; let mut c13 = 0.0;\n    kda_chunk_wy_v1!(4, query, key, value, alpha, beta, subgroup, key_index, value_column, state, c10, c11, c12, c13);\n    let selected0 = if key_index < 4 { c00 } else if key_index < 8 { c01 } else if key_index < 12 { c02 } else { c03 };\n    let selected1 = if key_index < 4 { c10 } else if key_index < 8 { c11 } else if key_index < 12 { c12 } else { c13 };\n    if let Some(slot) = output_chunk0.get_mut(thread::index_1d()) { *slot = selected0; }\n    if let Some(slot) = output_chunk1.get_mut(thread::index_1d()) { *slot = selected1; }\n    if let Some(slot) = final_state.get_mut(thread::index_1d()) { *slot = state; }\n}",
      },
      {
        label: "Runtime oracles today",
        language: "bash",
        sourcePath:
          "examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
        code:
          "bash examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh\nbash examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
      },
    ],
    invariants: [
      {
        id: "domain",
        label: "Domain and Layout",
        obligation:
          "CPU coordinates are token, key, and value indices over the fixed K=16, V=16, T=1/T=8 domain. GPU coordinates are lane-derived key/value pairs over the same logical state.",
        application:
          "The proof must relate logical S[K,V] in the CPU recurrence to physical H[V,K] in the kernel and account for the replicated output layout.",
        failureMode:
          "A transposed state index, wrong lane split, missing shape guard, or extra writer fails coordinate/guard pairing or total-output coverage.",
      },
      {
        id: "recurrence",
        label: "Bounded Recurrence",
        obligation:
          "The GPU state transition must equal the CPU recurrence step D_t = diag(alpha_t)S_(t-1), error e_t = v_t - k_t^T D_t, and S_t = D_t + beta_t k_t e_t^T.",
        application:
          "Decode proves one step. Prefill proves the same recurrence across tokens 0..7 while the GPU implementation evaluates two C=4 WY/UT chunks.",
        failureMode:
          "A stale state read, missing decay, wrong beta application, or reordered token update fails the recurrence contract.",
      },
      {
        id: "chunk-order",
        label: "Chunk Order",
        obligation:
          "The two four-token chunks must compose to the same state and outputs as eight sequential CPU steps under the declared WY/UT transform.",
        application:
          "The first macro call covers tokens 0..3 and produces chunk0 outputs; the second starts from that state and covers tokens 4..7.",
        failureMode:
          "Swapping chunks, dropping a token, using token-3 state for token 4 incorrectly, or mixing output chunks fails the ordered recurrence proof.",
      },
      {
        id: "wave16",
        label: "Wave16 Collectives",
        obligation:
          "Every Wave16 reduction must have the same active participants, expression subject, and reduction order promised by the finite collective contract.",
        application:
          "KDA uses Wave16 reductions for predictions, WY/UT coefficients, base projections, and output projections.",
        failureMode:
          "A partial-lane collective, wrong reduction width, divergent collective path, or changed RHS expression fails collective-value refinement.",
      },
      {
        id: "outputs",
        label: "Observable Outputs",
        obligation:
          "Every CPU observable value must have exactly one corresponding GPU effect, and the GPU must not write any observable value outside the contract.",
        application:
          "Decode writes final_state and output. Prefill writes final_state, output_chunk0, and output_chunk1, each through DisjointSlice ownership.",
        failureMode:
          "A missing final-state lane, duplicated output lane, output written with the wrong token group, or extra metadata write fails the effect bijection.",
      },
      {
        id: "numeric-policy",
        label: "Numerical Policy",
        obligation:
          "The CPU and GPU formulas must use an admitted FP policy: finite inputs, finite outputs, explicit accumulation order, and declared treatment for exp/tanh/sqrt/sigmoid where used.",
        application:
          "The current MI350X runners compare against f64 CPU recurrence within tolerances; compile-time authority needs an operator-congruence or error-bound proof policy.",
        failureMode:
          "Changing normalization scale, reduction association, gate range, or transcendental policy without a matching receipt rejects the proof.",
      },
    ],
    promotionSteps: [
      "Add a closed BoundedRecurrence contract for the KDA/GDN matrix-state step: fixed K, fixed V, finite gate domain, physical/logical layout relation, and declared output projection.",
      "Teach the rustc frontend to synthesize the safe CPU decode and prefill references into that recurrence contract instead of trying to prove arbitrary Rust loops.",
      "Teach the GPU projection to summarize Wave16 reductions and the two C=4 WY/UT chunks into the same recurrence contract with explicit chunk order.",
      "Extend total-output refinement from pointwise single-output cases to final_state plus replicated decode/prefill output buffers, with no missing or extra observable writes.",
      "Define the FP policy for KDA: f32/f64 comparison boundary today, then either operator-congruence or proven error bounds for the compile-time receipt.",
      "Add compile-fail fixtures for swapped chunks, stale state, wrong decay, changed beta, partial Wave16 participation, shifted output replication, missing final-state write, and stale CPU reference identity.",
      "Use N-gram gather as the first smaller integer-only follow-up slice with a closed LinearProbeLookup contract.",
    ],
    nonClaims: [
      "No full Kimi K3 layer, all-head serving backend, KV/cache management path, or arbitrary sequence partitioning is proved.",
      "No arbitrary Rust loop, iterator, Vec, or dynamic scheduling equivalence is admitted.",
      "No universal floating-point equality is claimed; the numerical policy is part of the contract.",
      "No source-to-ISA or hardware semantic authority is created by this page.",
      "Today the advanced KDA tutorial remains runtime CPU-oracle checked until compiler support for a KDA recurrence receipt is implemented and published.",
    ],
  },
} as const satisfies SemanticEquivalencePageContent);

export type ReadonlySemanticEquivalencePage =
  DeepReadonly<SemanticEquivalencePageContent>;
