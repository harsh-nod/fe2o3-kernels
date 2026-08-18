import { ExternalLink, ShieldCheck } from "lucide-react";
import { FE2O3_PIN } from "../content/model";
import { progressSnapshot } from "../content/progress";
import { LessonDiagram } from "../diagrams/LessonDiagram";

export function ArchitecturePage() {
  return (
    <article className="reference-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / architecture</p>
        <h1>Evidence pipeline and authority boundaries</h1>
        <p>
          The intended system binds one Rust kernel body to proof properties,
          compiler output, machine facts, runtime resources, and protected review.
        </p>
      </header>
      <LessonDiagram kind="evidence" />
      <section>
        <p className="section-kicker">Authority rule</p>
        <h2>No single layer declares a launch safe</h2>
        <div className="architecture-rows">
          {[
            ["Rust types", "Prevent local misuse and retain launch-scoped ownership."],
            ["Kernel IR", "Records types, regions, effects, synchronization, and unsupported obligations."],
            ["Verus", "Proves named properties in a versioned source or source-model contract."],
            ["LLVM / LLD", "Produces measured AMDGPU output through the direct-link worker."],
            ["HSACO inspection", "Binds target, symbols, descriptors, ABI, resources, and machine effects."],
            ["Runtime", "Checks actual context, allocations, aliases, geometry, and lifetimes."],
            ["Protected evidence", "Validates signed results and independent review before promotion."],
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
        <p className="section-kicker">Current implementation</p>
        <h2>Pliron ownership and device identity at 2f7c4fd1d</h2>
        <div className="pin-details">
          <div><span>Publication</span><code>{progressSnapshot.eventualPublicCommit}</code></div>
          <div><span>Tree</span><code>{progressSnapshot.eventualPublicTree}</code></div>
          <div><span>Pliron</span><code>2610651306ea3ba670f68d5d8b1e1159bcd521ed</code></div>
          <div><span>Issues</span><code>#134 / #135 / #140 open</code></div>
        </div>
        <div className="architecture-rows">
          {[
            ["Canonical contracts", "Pliron-independent MIR and AMDGCN models plus bounded compiler, proof, service, and host contracts retain stable identities and validation boundaries."],
            ["Pliron ownership", "A private process-local identity anchor registers and verifies contexts. PassPlan is bounded and non-executing; generic pass execution remains withheld until issue #140 provides owner-aware upstream handles."],
            ["Neutral dialects", "Kernel, tile, schedule, autotune, dispatch, GPU, and proof shells register explicitly; the real MIR shell remains feature-gated."],
            ["Context-bound KIR", "The opaque exact-byte KIR V1-V5 envelope verifies its originating context before any dereference and rejects foreign-context substitution, transplanted markers, and stale handles."],
            ["Detached lowerers", "MIR-to-kernel and kernel-to-GPU are context-bound services, not Pliron Pass implementations. Results retain context identity and stale or erased source handles produce typed terminal errors."],
            ["Selector isolation", "Legacy, PlironShadow, and PlironV1 have separate slots, exactly one route runs, failures never fall back, and shadow cannot return an executable candidate."],
            ["Host and service", "Authority-free contracts and typestates describe lifecycle, causality, generations, and borrows without compiling, loading, dispatching, waiting, or executing."],
            ["Checked device identity", "Pure-Rust KFD 1.18 and DRM UAPI bindings, strict sysfs topology discovery, and device-generation models admit the checked gfx942 identity. The observation is not sealed runtime authority and does not detect GPU reset."],
            ["Finalization", "The direction remains pinned upstream LLVM target-machine APIs plus in-process LLD. No COMGR path is introduced."],
          ].map(([name, detail], index) => (
            <div className="architecture-row" key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{name}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </div>
        <p className="status-boundary">
          These services, models, and contracts do not complete issue #134,
          #135, or #140,
          change kernel run/verify/evidence gates, make an explanatory lesson
          kernel functional, establish performance or GPU evidence, or promote
          cuda-oxide parity.
        </p>
        <a
          className="source-button"
          href={`https://github.com/harsh-nod/fe2o3/tree/${progressSnapshot.eventualPublicCommit}`}
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={17} /> Open implementation checkpoint <ExternalLink size={14} />
        </a>
      </section>
      <section>
        <p className="section-kicker">Lesson baseline</p>
        <h2>Lesson evidence audit coordinates</h2>
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
          <ShieldCheck size={17} /> Open pinned source <ExternalLink size={14} />
        </a>
      </section>
    </article>
  );
}
