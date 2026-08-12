import { ExternalLink, ShieldCheck } from "lucide-react";
import { FE2O3_PIN } from "../content/model";
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
        <p className="section-kicker">Current pin</p>
        <h2>Audit coordinates</h2>
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
