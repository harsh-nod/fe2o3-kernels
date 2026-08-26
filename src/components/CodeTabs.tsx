import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { sourceUrl, type CodeTab } from "../content/model";
import { HighlightedCode } from "./HighlightedCode";

function isProofDetail(tab: CodeTab): boolean {
  return tab.kind === "spec" || tab.kind === "verus";
}

export function CodeTabs({
  tabs,
  proofDetailsInitiallyOpen = false,
}: {
  tabs: CodeTab[];
  proofDetailsInitiallyOpen?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showProofDetails, setShowProofDetails] = useState(
    proofDetailsInitiallyOpen,
  );
  const hasProofDetails = tabs.some(isProofDetail);
  const visibleTabs = tabs
    .map((tab, sourceIndex) => ({ tab, sourceIndex }))
    .filter(({ tab }) => showProofDetails || !isProofDetail(tab));
  const activeVisibleIndex = visibleTabs.findIndex(
    ({ sourceIndex }) => sourceIndex === active,
  );
  const currentVisibleIndex = activeVisibleIndex >= 0 ? activeVisibleIndex : 0;
  const currentEntry = visibleTabs[currentVisibleIndex];
  const current = currentEntry.tab;

  const copy = async () => {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next =
      (currentVisibleIndex + delta + visibleTabs.length) % visibleTabs.length;
    const nextSourceIndex = visibleTabs[next].sourceIndex;
    setActive(nextSourceIndex);
    document.getElementById(`code-tab-${nextSourceIndex}`)?.focus();
  };

  return (
    <section className="code-tool" aria-label="Lesson code">
      {hasProofDetails && (
        <div className="proof-detail-control">
          <button
            type="button"
            aria-expanded={showProofDetails}
            onClick={() => {
              if (
                showProofDetails &&
                tabs[active] &&
                isProofDetail(tabs[active])
              ) {
                setActive(0);
              }
              setShowProofDetails((shown) => !shown);
            }}
          >
            <ShieldCheck size={15} aria-hidden="true" />
            {showProofDetails ? "Hide proof details" : "Show proof details"}
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="code-tabs" role="tablist" onKeyDown={handleKeys}>
        {visibleTabs.map(({ tab, sourceIndex }) => (
          <button
            id={`code-tab-${sourceIndex}`}
            type="button"
            role="tab"
            aria-selected={currentEntry.sourceIndex === sourceIndex}
            aria-controls="lesson-code-panel"
            tabIndex={currentEntry.sourceIndex === sourceIndex ? 0 : -1}
            className={currentEntry.sourceIndex === sourceIndex ? "active" : ""}
            onClick={() => setActive(sourceIndex)}
            key={tab.kind}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="code-toolbar">
        <span>{current.language}</span>
        <div>
          {current.sourcePath && (
            <a
              href={sourceUrl(current.sourcePath, current.sourceCommit)}
              target="_blank"
              rel="noreferrer"
              title="Open pinned source"
            >
              Source <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={() => void copy()}
            aria-label="Copy code"
            title="Copy code"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
      {(current.explanatory || current.notice) && (
        <div className="code-status">
          <Info size={14} aria-hidden="true" />
          {current.notice ??
            "Explanatory source. It is not a runnable fe2o3 GPU kernel at the pinned commit."}
        </div>
      )}
      <pre
        id="lesson-code-panel"
        role="tabpanel"
        aria-labelledby={`code-tab-${currentEntry.sourceIndex}`}
      >
        <HighlightedCode code={current.code} language={current.language} />
      </pre>
      <span className="sr-only" aria-live="polite">
        {copied ? "Code copied" : ""}
      </span>
    </section>
  );
}
