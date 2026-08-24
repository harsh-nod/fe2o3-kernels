import { Check, Copy, ExternalLink, Info } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { sourceUrl, type CodeTab } from "../content/model";
import { HighlightedCode } from "./HighlightedCode";

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const activeIndex = active < tabs.length ? active : 0;
  const current = tabs[activeIndex];

  const copy = async () => {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeIndex + delta + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`code-tab-${next}`)?.focus();
  };

  return (
    <section className="code-tool" aria-label="Lesson code">
      <div className="code-tabs" role="tablist" onKeyDown={handleKeys}>
        {tabs.map((tab, index) => (
          <button
            id={`code-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls="lesson-code-panel"
            tabIndex={activeIndex === index ? 0 : -1}
            className={activeIndex === index ? "active" : ""}
            onClick={() => setActive(index)}
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
        aria-labelledby={`code-tab-${activeIndex}`}
      >
        <HighlightedCode code={current.code} language={current.language} />
      </pre>
      <span className="sr-only" aria-live="polite">
        {copied ? "Code copied" : ""}
      </span>
    </section>
  );
}
