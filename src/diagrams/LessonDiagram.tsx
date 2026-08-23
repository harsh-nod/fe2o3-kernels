import {
  ArrowDown,
  ArrowRight,
  Binary,
  Boxes,
  Braces,
  CheckCircle2,
  Cpu,
  FileCode2,
  Fingerprint,
  FunctionSquare,
  GitCompareArrows,
  LockKeyhole,
  MemoryStick,
  Network,
  PackageCheck,
  Route,
} from "lucide-react";
import type { DiagramKind } from "../content/model";

export function LessonDiagram({ kind }: { kind: DiagramKind }) {
  switch (kind) {
    case "evidence":
      return <EvidencePipeline />;
    case "indexing":
      return <IndexingMap />;
    case "memory":
      return <MemoryOwnership />;
    case "reduction":
      return <ReductionTree />;
    case "gemm-scalar":
      return <ScalarGemmOwnership />;
    case "gemm":
      return <GemmTiles />;
    case "attention":
      return <AttentionFlow />;
    case "moe":
      return <MoeRouting />;
  }
}

function EvidencePipeline() {
  const stages = [
    { icon: FileCode2, label: "Rust body", sub: "source identity" },
    { icon: Braces, label: "Verus", sub: "property model" },
    { icon: Binary, label: "Kernel IR", sub: "effects + types" },
    { icon: FunctionSquare, label: "LLVM / LLD", sub: "measured worker" },
    { icon: PackageCheck, label: "HSACO", sub: "machine inspection" },
    { icon: Cpu, label: "gfx942", sub: "runtime facts" },
    { icon: LockKeyhole, label: "Evidence", sub: "signed review" },
  ];
  return (
    <figure className="diagram diagram-evidence" aria-label="fe2o3 evidence pipeline">
      <div className="pipeline-flow">
        {stages.map((stage, index) => (
          <div className="pipeline-unit" key={stage.label}>
            <div className="pipeline-node">
              <stage.icon size={21} aria-hidden="true" />
              <strong>{stage.label}</strong>
              <span>{stage.sub}</span>
            </div>
            {index < stages.length - 1 && (
              <ArrowRight className="pipeline-arrow" size={18} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      <figcaption>
        Every arrow is an identity join. A missing join fails closed.
      </figcaption>
    </figure>
  );
}

function IndexingMap() {
  return (
    <figure className="diagram diagram-indexing" aria-label="Thread indexing and rounded tail">
      <div className="index-lanes">
        {Array.from({ length: 12 }, (_, index) => (
          <div className={`index-lane${index >= 9 ? " tail" : ""}`} key={index}>
            <span>t{index}</span>
            <ArrowDown size={14} aria-hidden="true" />
            <strong>{index < 9 ? `out[${index}]` : "None"}</strong>
          </div>
        ))}
      </div>
      <div className="diagram-legend">
        <span><i className="legend-swatch owned" /> in range, one owner</span>
        <span><i className="legend-swatch tail" /> rounded tail, no access</span>
      </div>
      <figcaption>
        The checked output guard dominates every input read and output write.
      </figcaption>
    </figure>
  );
}

function MemoryOwnership() {
  return (
    <figure className="diagram diagram-memory" aria-label="Read and write region ownership">
      <div className="diagram-memory-inner">
        <div className="memory-row">
          <div className="memory-label"><MemoryStick size={17} /> input A</div>
          <div className="memory-cells read-cells">
            {Array.from({ length: 8 }, (_, index) => <span key={index}>r{index}</span>)}
          </div>
        </div>
        <div className="memory-row">
          <div className="memory-label"><MemoryStick size={17} /> input B</div>
          <div className="memory-cells read-cells">
            {Array.from({ length: 8 }, (_, index) => <span key={index}>r{index}</span>)}
          </div>
        </div>
        <div className="mapping-lines" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
        </div>
        <div className="memory-row">
          <div className="memory-label"><Fingerprint size={17} /> output C</div>
          <div className="memory-cells write-cells">
            {Array.from({ length: 8 }, (_, index) => <span key={index}>t{index}</span>)}
          </div>
        </div>
      </div>
      <figcaption>
        Reads may overlap. Each non-atomic output region has one invocation owner.
      </figcaption>
    </figure>
  );
}

function ReductionTree() {
  return (
    <figure className="diagram diagram-reduction" aria-label="Wave reduction and workgroup composition">
      <div className="wave-values">
        {[3, 5, 2, 7, 4, 1, 6, 8].map((value, index) => (
          <span key={index}>{value}</span>
        ))}
      </div>
      <div className="reduction-level pairs">
        {[8, 9, 5, 14].map((value, index) => <span key={index}>{value}</span>)}
      </div>
      <div className="reduction-level">
        {[17, 19].map((value, index) => <span key={index}>{value}</span>)}
      </div>
      <div className="reduction-result">
        <CheckCircle2 size={17} /> wave sum = 36
      </div>
      <figcaption>
        Active-lane values combine in a fixed profile; workgroup composition adds LDS epochs.
      </figcaption>
    </figure>
  );
}

function GemmTiles() {
  return (
    <figure className="diagram diagram-gemm" aria-label="Tiled GEMM memory movement">
      <div className="gemm-flow">
        <div className="matrix-unit">
          <span className="matrix-name">A</span>
          <div className="matrix-grid matrix-a">
            {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
          </div>
          <span>M × K</span>
        </div>
        <div className="math-symbol">×</div>
        <div className="matrix-unit">
          <span className="matrix-name">B</span>
          <div className="matrix-grid matrix-b">
            {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
          </div>
          <span>K × N</span>
        </div>
        <ArrowRight size={24} aria-hidden="true" />
        <div className="lds-stage">
          <Boxes size={22} />
          <strong>LDS phase p</strong>
          <span>load · barrier · MFMA · barrier</span>
        </div>
        <ArrowRight size={24} aria-hidden="true" />
        <div className="matrix-unit">
          <span className="matrix-name">C</span>
          <div className="matrix-grid matrix-c">
            {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
          </div>
          <span>M × N</span>
        </div>
      </div>
      <figcaption>
        The phase invariant covers K tiles already accumulated into one owned C tile.
      </figcaption>
    </figure>
  );
}

function ScalarGemmOwnership() {
  return (
    <figure
      className="diagram diagram-gemm-scalar"
      aria-label="Dynamic GEMM wave tile ownership"
    >
      <div className="scalar-gemm-flow">
        <div className="scalar-gemm-step invocation">
          <strong>workgroup</strong>
          <span>one 16x16 C tile</span>
        </div>
        <ArrowRight size={22} aria-hidden="true" />
        <div className="scalar-gemm-step coordinates">
          <strong>wave64 lanes</strong>
          <span>four outputs per lane</span>
        </div>
        <ArrowRight size={22} aria-hidden="true" />
        <div className="scalar-gemm-step loop">
          <strong>for phase in (0..K).step_by(16)</strong>
          <span>BF16 fragments → MFMA → FP32 accumulators</span>
        </div>
        <ArrowRight size={22} aria-hidden="true" />
        <div className="scalar-gemm-step epilogue">
          <strong>C = alpha * acc + beta * C</strong>
          <span>checked Tiled2D stores</span>
        </div>
      </div>
      <figcaption>
        Edge loads zero-fill. Edge stores return None. The ownership witness is
        independent of the GEMM algorithm.
      </figcaption>
    </figure>
  );
}

function AttentionFlow() {
  const keys = ["K₀ / V₀", "K₁ / V₁", "K₂ / V₂", "K₃ / V₃"];
  return (
    <figure className="diagram diagram-attention" aria-label="Flash attention online tile flow">
      <div className="attention-flow-diagram">
        <div className="query-block">
          <span>Q tile</span>
          <strong>query rows</strong>
        </div>
        <div className="attention-stream">
          {keys.map((key, index) => (
            <div className="attention-step" key={key}>
              <div className="kv-block">{key}</div>
              <ArrowDown size={15} aria-hidden="true" />
              <div className="state-block">
                <span>state {index + 1}</span>
                <strong>m · l · o</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="attention-output">
          <GitCompareArrows size={20} />
          <span>normalize once</span>
          <strong>O = o / l</strong>
        </div>
      </div>
      <figcaption>
        Each key/value tile updates maximum, normalization sum, and output numerator in one frame.
      </figcaption>
    </figure>
  );
}

function MoeRouting() {
  const routes = [
    ["T0", "E0", "slot 0"],
    ["T1", "E2", "slot 0"],
    ["T2", "E0", "slot 1"],
    ["T3", "E1", "slot 0"],
    ["T4", "E2", "slot 1"],
  ];
  return (
    <figure className="diagram diagram-moe" aria-label="Mixture of experts stable routing">
      <div className="moe-flow-diagram">
        <div className="moe-column tokens">
          <strong>Tokens</strong>
          {routes.map(([token]) => <span key={token}>{token}</span>)}
        </div>
        <div className="moe-router">
          <Route size={23} />
          <strong>stable top-k</strong>
          <span>count + scan</span>
        </div>
        <div className="moe-experts">
          {[0, 1, 2].map((expert) => (
            <div className="expert-lane" key={expert}>
              <strong>E{expert}</strong>
              {routes
                .filter(([, id]) => id === `E${expert}`)
                .map(([token, , slot]) => <span key={token}>{slot} · {token}</span>)}
            </div>
          ))}
        </div>
        <div className="moe-combine">
          <Network size={21} />
          <strong>expert GEMM</strong>
          <span>inverse + combine</span>
        </div>
      </div>
      <figcaption>
        Stable ranks make compact expert slots deterministic and injective.
      </figcaption>
    </figure>
  );
}
