import { AlertTriangle, CircleDot, Eye } from "lucide-react";
import {
  functionalCorrectnessEntry,
  type FunctionalCorrectnessDisposition,
} from "../content/functional-correctness-catalog";

const dispositionLabels = {
  incomplete: "Incomplete",
  "model-only": "Model only",
  "observation-only": "Observation only",
} satisfies Record<FunctionalCorrectnessDisposition, string>;

const dispositionIcons = {
  incomplete: AlertTriangle,
  "model-only": CircleDot,
  "observation-only": Eye,
} satisfies Record<FunctionalCorrectnessDisposition, typeof AlertTriangle>;

function relationText(relations: readonly string[]): string {
  return relations.join(" + ");
}

export function FunctionalCorrectnessPanel({
  lessonId,
}: {
  lessonId: string;
}) {
  const entry = functionalCorrectnessEntry(lessonId);
  if (!entry) return null;

  const StatusIcon = dispositionIcons[entry.disposition];

  return (
    <section
      className="functional-correctness-panel"
      aria-labelledby="functional-correctness-heading"
    >
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Compiler contract</p>
          <h2 id="functional-correctness-heading">
            Functional-correctness catalog
          </h2>
        </div>
        <span
          className={`functional-disposition functional-disposition-${entry.disposition}`}
        >
          <StatusIcon size={15} aria-hidden="true" />
          {dispositionLabels[entry.disposition]}
        </span>
      </div>

      <p className="functional-correctness-intro">
        {entry.kernel}. A safe CPU oracle is a specification, not proof that
        this GPU compilation implements it.
      </p>

      <dl className="functional-contract-rows">
        <div>
          <dt>Safe Rust reference</dt>
          <dd>
            <code>{entry.referenceSourcePath}</code>
            <span>{entry.referenceContract}</span>
          </dd>
        </div>
        <div>
          <dt>Admitted MIR subset</dt>
          <dd>{entry.admittedMirSubset}</dd>
        </div>
        <div>
          <dt>Output relation</dt>
          <dd><code>{relationText(entry.outputRelations)}</code></dd>
        </div>
        <div>
          <dt>Schedule relation</dt>
          <dd><code>{relationText(entry.scheduleRelations)}</code></dd>
        </div>
        <div>
          <dt>Numerical policy</dt>
          <dd>{entry.numericalPolicy}</dd>
        </div>
        {entry.cooperativeTensor ? (
          <div>
            <dt>Cooperative tensor</dt>
            <dd>{entry.cooperativeTensor}</dd>
          </div>
        ) : null}
        <div>
          <dt>GPU hierarchy</dt>
          <dd>{entry.hierarchyCoverage}</dd>
        </div>
        <div>
          <dt>Production gate</dt>
          <dd>{entry.productionPipeline}</dd>
        </div>
        <div>
          <dt>Per-compilation Verus</dt>
          <dd>{entry.perCompilationVerus}</dd>
        </div>
        <div>
          <dt>Incomplete / trusted boundary</dt>
          <dd>{entry.boundary}</dd>
        </div>
      </dl>
    </section>
  );
}
