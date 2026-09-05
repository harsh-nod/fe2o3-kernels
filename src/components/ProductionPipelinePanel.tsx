import {
  ArrowRight,
  Braces,
  CheckCircle2,
  FileCode2,
  GitCompareArrows,
} from "lucide-react";

const pipelineStages = [
  [
    "Rust + semantic MIR",
    "Ordinary #[kernel(typed)] source, checked control flow, and source locations.",
  ],
  [
    "Before-neutral KIR",
    "Canonical target-neutral KIR snapshot before optimization; SSA values, effects, regions, and dynamic operands remain explicit.",
  ],
  [
    "Neutral V4",
    "Fixed nine-pass transaction: scalar/CFG cleanup, SROA, GVN, IPO, cleanup, loops, memory/guards, bounded unrolling, final cleanup.",
  ],
  [
    "After-neutral KIR",
    "The exact V4 output, independently replayed from the preceding snapshot with identities, limits, and accounting.",
  ],
  [
    "AMD V2 + resource V3",
    "Target-local legality, cost, and SSA resource replay for the selected AMD profile; unsupported rewrites fail closed.",
  ],
  [
    "Target KIR",
    "Final canonical target KIR V12 after V2 replay and re-admission, immediately before LLVM emission.",
  ],
] as const;

export function ProductionPipelinePanel() {
  return (
    <section className="pipeline-contract" aria-labelledby="production-pipeline-heading">
      <p className="section-kicker">Canonical production route</p>
      <h2 id="production-pipeline-heading">One source, three KIR snapshots, two optimizer policies</h2>
      <p>
        The shipped route is workload-neutral: it does not select a pass because a
        kernel is called GEMM, attention, or MoE. The same checked transaction carries
        ordinary source into target-aware code generation.
      </p>
      <div className="architecture-rows" aria-label="Canonical V4 and V2 production pipeline">
        {pipelineStages.map(([name, detail], index) => (
          <div className="architecture-row" key={name}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{name}</strong>
            <p>{detail}</p>
            {index < pipelineStages.length - 1 && <ArrowRight size={15} aria-hidden="true" />}
          </div>
        ))}
      </div>
      <div className="status-summary">
        <div><FileCode2 size={16} aria-hidden="true" /><span>Authoring</span><code>#[kernel(typed)]</code></div>
        <div><GitCompareArrows size={16} aria-hidden="true" /><span>Dynamic values</span><code>SSA operands</code></div>
        <div><Braces size={16} aria-hidden="true" /><span>Policy</span><code>neutral V4 / AMD V2</code></div>
        <div><CheckCircle2 size={16} aria-hidden="true" /><span>Admission</span><code>target KIR V12</code></div>
      </div>
      <p className="status-boundary">
        Runtime sizes, strides, predicates, and loop bounds stay as typed SSA values.
        A dynamic value is not silently guessed or specialized: a pass may transform it
        only when its required range, ownership, resource, and legality facts are
        proven. Otherwise the operation remains unchanged or receives a typed
        unsupported/incomplete disposition. Reports and KIR snapshots are inspection
        evidence, not proof of compiler semantics, LLVM/ISA refinement, artifact
        identity, launch, hardware execution, or numerical correctness.
      </p>
    </section>
  );
}
