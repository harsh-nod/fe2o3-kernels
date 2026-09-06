import { ExternalLink, ShieldCheck } from "lucide-react";
import tutorialKernelManifest from "../../config/tutorial-kernel-manifest-v1.json";
import {
  currentSourceUrl,
  currentState,
} from "../content/current-state";
import { FE2O3_PIN } from "../content/model";
import { LessonDiagram } from "../diagrams/LessonDiagram";
import { ProductionPipelinePanel } from "./ProductionPipelinePanel";

const compilerCorpus = tutorialKernelManifest as {
  baseline: { status: "migration" | "qualified" };
  productionContract: { requiredPolicyVersion: number };
  compilerFixtures: { target: string }[];
  entries: { classification: string }[];
};

export function ArchitecturePage() {
  return (
    <article className="reference-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / architecture</p>
        <h1>Evidence pipeline and authority boundaries</h1>
        <p>
          The immutable published compiler evidence baseline, the issue #271 V4
          qualification migration, and historical lesson evidence are shown
          separately. Public main may point to a descendant of an evidence commit;
          none of these statuses is inferred from another.
        </p>
      </header>

      <LessonDiagram kind="evidence" />

      <ProductionPipelinePanel />

      <section>
        <p className="section-kicker">Authority rule</p>
        <h2>No single layer declares a launch safe</h2>
        <div className="architecture-rows">
          {[
            ["rustc", "Enforces Rust moves, borrows, lifetimes, visibility, local typestate, and Result control flow."],
            ["Fe2O3 capabilities", "Extend affine ownership to invocation partitions, subgroup participation, LDS epochs, matrix contexts, and launch-scoped resources."],
            ["Kernel IR", "Records types, regions, effects, synchronization, and unsupported obligations."],
            ["Production optimizer V4", "Runs the closed nine-phase target-neutral policy: initial scalar/CFG cleanup, private SROA, global value numbering, interprocedural optimization, post-interprocedural cleanup, loop canonicalization, memory/guard optimization, bounded unrolling, and final cleanup. Each phase is bounded and the complete input/report/output transaction is independently re-executed before custody advances."],
            ["AMD target optimizer V2", "Admits zero-offset address folding, integer x2 strength reduction, proved scalar-copy vector packing, redundant LDS-load removal, vector-layout removal/store folding, and MFMA accumulator scheduling. Loop unrolling and generated specialization have separate closed evidence. Wave handling only preserves Wave64 legality, and MFMA selection maps an already-attached tensor profile; it does not rewrite waves, promote LDS, or synthesize MFMA profiles."],
            ["AMD cost and resource policy", "The deterministic gfx942/gfx950 V2 models use add/multiply/address costs 1/4/2 versus 1/3/1, scalar-memory/matrix costs 8/16 versus 7/8, 16- versus 32-byte vector caps, and unroll factors 4 versus 8. Resource V3 replays SSA liveness, 8-dword VGPR and 16-dword SGPR allocation granules, no-spill admission, and 65,536- versus 163,840-byte total LDS-per-CU occupancy inputs. Dynamic LDS leaves only LDS occupancy incomplete; transforms needing a bounded fact fail closed."],
            ["Compiler inspection record", "Writes canonical F2KIRP02 inspection V2 bytes beside the primary LLVM output. The record binds the target, neutral V4, AMD policy/cost V2, resource model V3, before-neutral, after-neutral, and target KIR V12 snapshots, plus the closed 16-pass remarks. AMD replay evidence V9 reconstructs the target transaction and all affected legality analyses before final verification."],
            ["Regression gate", "Binds reviewed integer-ceiling compile-time, size, resource, and work thresholds to the exact baseline report, compiler tree, and corpus manifest. It rejects missing or extra fixtures, target/policy/semantic drift, changed occupancy metadata, and measured ceiling regressions; a null compile-only runtime is not a performance limit."],
            ["V7 simulator", "Consumes either exact KIR or an authority-free bundle exported through the sole production compiler transaction. It runs the supported subset with legal integer atomics and fences plus exact software F16/BF16/F32/F64 scalar bits on a bounded deterministic CPU schedule; it is not an alternate compiler, GPU execution, timing, performance prediction, or proof."],
            ["Compiler analyses", "Run the fixed nine ordered tensor, bounds, atomic, race, hierarchy-ownership, barrier, pipeline-protocol, workgroup-memory, and semantic checks. The pipeline certificate proves epoch lifecycle, modulo slot selection, release-before-reuse, and dynamic prologue/steady-state/drain structure before workgroup-memory verification. Only the admitted static bounded-access fragment has Complete independent raw replay; nonempty tensor flow and every other current stage witness remain Incomplete."],
            ["Target preflight", "Before target-aware verification scans launch facts, a bounded structural inventory accounts the closed ranked function and contains malformed input or verifier failure as FE2O3-TARGET-000."],
            ["Middle-end evidence", "ProductionMiddleEndEvidenceV5 is the sole live producer for the nine stages. The V4 decoder is archival-only, and the caller-declared V1 refinement API has been removed."],
            ["Checked ranked transform", "Folds exact preceding index constants with checked u64 semantics before every downstream consumer. A separate exact typed structural replay admits only the same-site result; every other transformation is unsupported."],
            ["Verus", "After compiler-owned semantic and strict parallel derivation, one generated checker independently replays each supported exact pointwise integer or compiler-side IEEE operator-DAG formula. Status-Checked policy staging grants no authority. PLIRON separately proves structural coverage, separation, and ordered-product identity; the private move-only join is the admission authority and requires both structural and formula results."],
            ["LLVM / LLD", "Produces measured AMDGPU output through the direct-link worker."],
            ["HSACO inspection", "Binds target, symbols, descriptors, ABI, resources, and machine effects."],
            ["Runtime", "Checks actual context, allocations, aliases, geometry, and lifetimes."],
            ["Protected evidence", "The local crash-safe compiler-execution issuer binds a signed ordered journal, but supervised occurrence production and the Worker V3 rollback-ledger join remain open. It grants no compiler, publication, load, or launch authority."],
          ].map(([name, detail], index) => (
            <div className="architecture-row" key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{name}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="section-kicker">Issue #271 migration contract</p>
        <h2>Exact V4 verification is required before corpus promotion</h2>
        <div className="status-summary">
          <div><span>Corpus status</span><code>{compilerCorpus.baseline.status}</code></div>
          <div><span>Required neutral policy</span><code>V{compilerCorpus.productionContract.requiredPolicyVersion}</code></div>
          <div><span>Compiler fixtures</span><code>{compilerCorpus.compilerFixtures.length}</code></div>
          <div><span>Qualified lessons</span><code>{compilerCorpus.baseline.status === "qualified" ? compilerCorpus.entries.length : 0}/{compilerCorpus.entries.length}</code></div>
        </div>
        <p className="status-boundary">
          The shared manifest is the single source of truth for fixture IDs,
          targets, and required gates. Every compiler-produced lesson must resolve
          at least one registered fixture; this includes the ordinary attributed
          MoE top-2 routing source. Qualification is atomic at the top-level
          baseline, so no site-authored per-lesson flag can promote partial
          evidence. The migration has no final compiler SHA, measured baseline, or
          qualified sidecar set yet. Gfx942 and gfx950 compilation and declared
          simulation/reference gates must be rerun against the eventual clean
          compiler tree. The MI300X lane is required for gfx942; gfx950 remains
          compile/simulator-only until target-matched hardware is admitted. Reports bind the manifest
          path, raw SHA-256, and the domain-separated canonical corpus digest that
          excludes only top-level baseline publication metadata. The strict gfx942
          evidence path additionally binds every fixture, command, retained artifact,
          resource summary, host log, and hardware target. No release evidence is
          fabricated or implied by the migration contract.
        </p>
      </section>

      <section>
        <p className="section-kicker">Published implementation baseline</p>
        <h2>Compiler baseline at {currentState.compilerShortCommit}</h2>
        <div className="pin-details">
          <div><span>Commit</span><code>{currentState.compilerCommit}</code></div>
          <div><span>Tree</span><code>{currentState.compilerTree}</code></div>
          <div><span>Pliron</span><code>{currentState.plironCommit}</code></div>
          <div><span>Reviewed</span><code>{currentState.reviewedOn}</code></div>
        </div>
        <div className="architecture-rows">
          {currentState.capabilities.map((capability, index) => (
            <div className="architecture-row" key={capability.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{capability.label}</strong>
              <p>
                <span className={`capability-state capability-state-${capability.status}`}>
                  {capability.status}
                </span>
                {capability.detail}
                {" "}
                <a
                  className="inline-source-link"
                  href={currentSourceUrl(capability.sourcePaths[0])}
                  target="_blank"
                  rel="noreferrer"
                >
                  source <ExternalLink size={12} aria-hidden="true" />
                </a>
              </p>
            </div>
          ))}
        </div>
        <div className="tracked-issues" aria-label="Tracked compiler issues">
          {currentState.issues.map((issue) => (
            <a
              href={`https://github.com/harsh-nod/fe2o3/issues/${issue.number}`}
              key={issue.number}
              target="_blank"
              rel="noreferrer"
            >
              <span>#{issue.number}</span>
              <strong>{issue.label}</strong>
              <small className={`issue-state issue-state-${issue.state}`}>
                {issue.state}
              </small>
            </a>
          ))}
        </div>
        <p className="status-boundary">
          One production route carries supported Rust MIR into ranked PLIRON,
          runs the sealed checked index constant fold, verifies the fixed nine
          workload-neutral stages, and only then constructs KIR lowering input.
          Target-aware entry points first account the bounded ranked structure,
          then invoke recursive PLIRON verification under failure containment.
          Malformed, unsupported, nested, or over-limit input stops as
          FE2O3-TARGET-000 before launch-contract facts are scanned. V5 is the
          sole live middle-end evidence producer; V4 decoding is archival-only.
          Analysis-only stages are protected by a monotonic mutation-attempt
          epoch, exact structural checkpoints, and sealed report custody. Those
          mechanisms detect compiler mutation and report substitution; they do
          not prove report semantics. Independent raw replay is Complete only
          for the documented static bounded-access fragment. Nonempty tensor
          flow remains Incomplete until external roots are tied to operational
          SSA values. Checked tiled and row-striped recipes now carry a
          structural index, checked-success capability, and physical extent;
          typed live validation checks pairing, shape, substitution, and use
          discipline. That carrier does not establish source-semantic custody,
          so raw, textual, and public recipes still fail closed at
          FE2O3-RACE-002. Explicit affine or Presburger maps may separately prove
          supported relations.
          The rejected source/ranked diagnostic sidecar was discarded rather
          than admitted as proof. Same-TyCtxt descriptor identity hardens
          substitution checks but does not supply the missing semantic custody
          or close FE2O3-RACE-002.
          The progress checker accepts canonical single-entry multi-block forwarding loops with a
          positive constant step only when source-width and u64 updates cannot
          wrap. The constant-fold validator keeps one exact typed input clone,
          replays the structural relation, and moves the validated output through
          its private receipt. Canonical hashes remain diagnostic labels rather
          than acceptance authority. These specific guarantees do not
          establish compiler extraction, source-to-KIR refinement, numerical
          intent, LLVM or ISA correctness, artifact identity, launch admission,
          persistent execution, performance, or universal kernel correctness.
        </p>
        <a
          className="source-button"
          href={`https://github.com/harsh-nod/fe2o3/tree/${currentState.compilerCommit}`}
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={17} /> Open pinned compiler source <ExternalLink size={14} />
        </a>
      </section>

      <section>
        <p className="section-kicker">Historical lesson evidence</p>
        <h2>Immutable audit coordinates</h2>
        <p>
          Lessons keep their reproduced commit until their commands, source,
          and claims are audited again. This pin is evidence history, not the
          published compiler capability baseline above.
        </p>
        <div className="pin-details">
          <div><span>Commit</span><code>{FE2O3_PIN.commit}</code></div>
          <div><span>Tree</span><code>{FE2O3_PIN.tree}</code></div>
          <div><span>Rust</span><code>{FE2O3_PIN.rustToolchain}</code></div>
          <div><span>Primary target</span><code>{FE2O3_PIN.target}</code></div>
        </div>
        <a
          className="source-button"
          href={`${FE2O3_PIN.repository}/tree/${FE2O3_PIN.commit}`}
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={17} /> Open historical lesson source <ExternalLink size={14} />
        </a>
      </section>
    </article>
  );
}
