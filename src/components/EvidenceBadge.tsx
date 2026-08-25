import {
  BookOpenCheck,
  CircuitBoard,
  FileCode2,
  FlaskConical,
  Play,
  Route,
  ShieldCheck,
} from "lucide-react";
import { evidenceLabels, type EvidenceKind } from "../content/model";

const icons = {
  "runnable-now": Play,
  "source-tested": FileCode2,
  "source-model-verified": BookOpenCheck,
  "compiler-checked": ShieldCheck,
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
