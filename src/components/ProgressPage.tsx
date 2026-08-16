import { CheckCircle2, CircleDashed, Clock3, ExternalLink, ShieldAlert } from "lucide-react";
import {
  developmentCheckpoints,
  developmentCheckpointDetail,
  gateLabels,
  kernelProgress,
  progressSnapshot,
  type DeliveryGate,
} from "../content/progress";

const GateIcon = {
  complete: CheckCircle2,
  partial: CircleDashed,
  blocked: ShieldAlert,
  planned: Clock3,
} satisfies Record<DeliveryGate, typeof CheckCircle2>;

function Gate({ state }: { state: DeliveryGate }) {
  const Icon = GateIcon[state];
  const metadata = gateLabels[state];
  return (
    <span className={`delivery-gate delivery-gate-${state}`} title={metadata.description}>
      <Icon size={14} aria-hidden="true" /> {metadata.label}
    </span>
  );
}

export function ProgressPage() {
  return (
    <article className="reference-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / implementation status</p>
        <h1>Kernel delivery and verification progress</h1>
        <p>
          Audited capability, implementation checkpoints, a publication-gated
          snapshot, and tutorial evidence are tracked separately. A
          runnable kernel is not called verified until its proof, compiler,
          artifact, runtime, and review gates also close.
        </p>
      </header>

      <section>
        <p className="section-kicker">Repository state</p>
        <h2>Exact checkpoints</h2>
        <div className="status-summary">
          <div>
            <span>Lesson evidence</span>
            <code>{progressSnapshot.auditedCommit.slice(0, 12)}</code>
          </div>
          <div>
            <span>Historical audited baseline</span>
            <code>{progressSnapshot.lastAuditedPublicCommit.slice(0, 12)}</code>
          </div>
          <div>
            <span>Publication-gated snapshot</span>
            <code>{progressSnapshot.eventualPublicCommit.slice(0, 12)}</code>
          </div>
          <div>
            <span>Reviewed</span>
            <code>{progressSnapshot.reviewedOn}</code>
          </div>
        </div>
        <p className="status-boundary">
          This site build is valid only after the publication workflow verifies
          that harsh-nod/fe2o3 and powderluv/fe2o3 refs/heads/main both resolve
          exactly to commit {progressSnapshot.publicationGate.requiredCommit} and
          tree {progressSnapshot.publicationGate.requiredTree}. Both the commit
          and tree are required. Lessons
          continue to cite their independently audited commits until a repin
          campaign reproduces each claim at one exact tree.
        </p>
        <div className="checkpoint-list">
          {developmentCheckpoints.map((checkpoint) => (
            <article key={checkpoint.id}>
              <div>
                <span className={`checkpoint-state checkpoint-state-${checkpoint.state}`}>
                  {checkpoint.state}
                </span>
                <h3>{checkpoint.name}</h3>
              </div>
              <code>{checkpoint.commit}</code>
              <p>{developmentCheckpointDetail(checkpoint)}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="section-kicker">Kernel ladder</p>
        <h2>Run, verify, and evidence are independent gates</h2>
        <div className="kernel-status-table" role="table" aria-label="Kernel implementation status">
          <div className="kernel-status-head" role="row">
            <span role="columnheader">Kernel</span>
            <span role="columnheader">Run</span>
            <span role="columnheader">Verify</span>
            <span role="columnheader">Evidence</span>
          </div>
          {kernelProgress.map((kernel) => (
            <article role="row" key={kernel.id}>
              <div role="cell" className="kernel-status-name">
                <h3>{kernel.kernel}</h3>
                {kernel.dependsOn.length > 0 && (
                  <p>Depends on: {kernel.dependsOn.join(", ")}</p>
                )}
              </div>
              <div role="cell"><Gate state={kernel.run} /></div>
              <div role="cell"><Gate state={kernel.verify} /></div>
              <div role="cell"><Gate state={kernel.evidence} /></div>
              <p className="kernel-status-next"><strong>Next:</strong> {kernel.next}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="section-kicker">Critical path</p>
        <h2>Implementation order</h2>
        <div className="architecture-rows">
          {[
            ["01", "Frontend", "Structured control flow, helpers, aggregates, and checked multidimensional indexing."],
            ["02", "Collectives", "Wave64 operations followed by LDS ownership epochs and uniform workgroup barriers."],
            ["03", "Dense compute", "Scalar reference GEMM followed by a fixed gfx942 BF16/F32 MFMA tile."],
            ["04", "Attention", "Numerically specified row softmax followed by fixed-shape forward FlashAttention."],
            ["05", "Sparse compute", "Stable top-2 routing, expert GEMM, inverse permutation, and deterministic combine."],
            ["06", "Promotion", "Independent review and protected signed evidence before any Complete claim."],
          ].map(([number, name, detail]) => (
            <div className="architecture-row" key={number}>
              <span>{number}</span><strong>{name}</strong><p>{detail}</p>
            </div>
          ))}
        </div>
        <div className="progress-repositories">
          {progressSnapshot.repositories.map((repository) => (
            <a key={repository} href={repository} target="_blank" rel="noreferrer">
              Open {new URL(repository).pathname.slice(1)} <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
