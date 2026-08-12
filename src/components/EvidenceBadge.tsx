import {
  BookOpenCheck,
  CircuitBoard,
  FlaskConical,
  Play,
  Route,
} from "lucide-react";
import { evidenceLabels, type EvidenceKind } from "../content/model";

const icons = {
  "runnable-now": Play,
  "source-model-verified": BookOpenCheck,
  "compiler-hsaco-observed": CircuitBoard,
  "gpu-observed": FlaskConical,
  "design-only": Route,
} satisfies Record<EvidenceKind, typeof Play>;

export function EvidenceBadge({ kind }: { kind: EvidenceKind }) {
  const Icon = icons[kind];
  const metadata = evidenceLabels[kind];
  return (
    <span
      className={`evidence-badge evidence-${kind}`}
      title={metadata.description}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2} />
      {metadata.short}
    </span>
  );
}
