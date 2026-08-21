import { ArrowRight, Braces, CircleX, FileWarning, ShieldCheck } from "lucide-react";
import type { CompileFailureExample } from "../content/model";
import type { DeepReadonly } from "../content/registry";

export function CompileFailureGallery({
  heading,
  intro,
  examples,
}: {
  heading: string;
  intro: string;
  examples: DeepReadonly<CompileFailureExample[]>;
}) {
  return (
    <div className="compile-failure-gallery" aria-labelledby="compile-failure-heading">
      <header className="compile-failure-header">
        <p className="compile-failure-kicker">
          <FileWarning size={16} aria-hidden="true" />
          Rejected before launch
        </p>
        <h3 id="compile-failure-heading">{heading}</h3>
        <p>{intro}</p>
      </header>

      <div className="compile-failure-flow" aria-label="Compile-time rejection path">
        <span><Braces size={15} aria-hidden="true" /> Rust semantic MIR / PLIRON</span>
        <ArrowRight size={15} aria-hidden="true" />
        <span>PLIRON dialect verification</span>
        <ArrowRight size={15} aria-hidden="true" />
        <span><ShieldCheck size={15} aria-hidden="true" /> Fixed generic safety passes</span>
        <ArrowRight size={15} aria-hidden="true" />
        <span><CircleX size={15} aria-hidden="true" /> No lowering or artifact</span>
      </div>

      <div className="compile-failure-list">
        {examples.map((example, index) => (
          <article className="compile-failure-example" key={example.id}>
            <header>
              <span className="compile-failure-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p>{example.id}</p>
                <h4>{example.title}</h4>
              </div>
              <span className="compile-failure-code">{example.code}</span>
            </header>
            <div className="compile-failure-body">
              <div className="compile-failure-source">
                <span>Input excerpt</span>
                <pre><code>{example.source}</code></pre>
              </div>
              <div className="compile-failure-verdict">
                <p className="compile-failure-status">
                  <CircleX size={16} aria-hidden="true" />
                  Compilation stopped
                </p>
                <dl>
                  <div>
                    <dt>Property</dt>
                    <dd>{example.property}</dd>
                  </div>
                  <div>
                    <dt>Stage</dt>
                    <dd>{example.stage}</dd>
                  </div>
                  <div>
                    <dt>Source enforcement</dt>
                    <dd>{example.enforcement}</dd>
                  </div>
                </dl>
                <p>{example.caught}</p>
              </div>
            </div>
            <div className="compile-failure-output">
              <span>Compiler diagnostic</span>
              <pre><code>{example.diagnostic}</code></pre>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
