import type {
  PerformanceComparison,
  PerformanceMeasurementStatus,
  PerformanceStudy,
} from "../content/model";

const statusLabels: Record<PerformanceMeasurementStatus, string> = {
  baseline: "Baseline",
  retained: "Retained",
  rejected: "Rejected",
  inconclusive: "Inconclusive",
  external: "External result; protocol unmatched",
};

function MatchedComparison({ comparison }: { comparison: PerformanceComparison }) {
  const maximum = Math.max(
    ...comparison.measurements.map((entry) => entry.value),
  );
  return (
    <figure className="performance-comparison">
      <figcaption>
        <strong>{comparison.title}</strong>
        <span>{comparison.protocol}</span>
      </figcaption>
      <ul
        className="performance-comparison-bars"
        aria-label={comparison.title + " in " + comparison.unit}
      >
        {comparison.measurements.map((entry) => (
          <li key={entry.label}>
            <div>
              <strong>{entry.label}</strong>
              <span>{entry.implementation === "fe2o3" ? "fe2o3" : "Matched comparator"}</span>
            </div>
            <span className="performance-bar-track" aria-hidden="true">
              <span
                className={"performance-bar performance-comparison-" + entry.implementation}
                style={{ width: (entry.value / maximum) * 100 + "%" }}
              />
            </span>
            <output>{entry.value.toFixed(4)} {comparison.unit}</output>
            <p>{entry.note}</p>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function PerformanceStudyPanel({ study }: { study: PerformanceStudy }) {
  const internalMeasurements = study.measurements.filter(
    (entry) => entry.status !== "external",
  );
  const externalMeasurements = study.measurements.filter(
    (entry) => entry.status === "external",
  );
  const maximum = Math.max(...internalMeasurements.map((entry) => entry.value));

  return (
    <section className="performance-study" aria-labelledby="performance-study-heading">
      <header>
        <p className="section-kicker">Measured optimization study</p>
        <h2 id="performance-study-heading">Latency and ablation evidence</h2>
        <p>
          Lower is better. Internal bars share a linear scale within this exact
          teaching contract; rejected and inconclusive variants are context,
          not wins.
        </p>
      </header>

      <figure className="performance-plot">
        <figcaption>Median kernel latency ({study.unit})</figcaption>
        <ul
          className="performance-bars"
          aria-label={"Median latency comparison in " + study.unit}
        >
          {internalMeasurements.map((entry) => (
            <li className="performance-bar-row" key={entry.label}>
              <div className="performance-bar-label">
                <strong>{entry.label}</strong>
                <span>{statusLabels[entry.status]}</span>
              </div>
              <div className="performance-bar-track" aria-hidden="true">
                <span
                  className={"performance-bar performance-bar-" + entry.status}
                  style={{ width: (entry.value / maximum) * 100 + "%" }}
                />
              </div>
              <output>{entry.value.toFixed(study.unit === "ms" ? 6 : 3)} {study.unit}</output>
              <p>{entry.note}</p>
            </li>
          ))}
        </ul>
      </figure>

      {study.comparisons && study.comparisons.length > 0 && (
        <section
          className="performance-matched-study"
          aria-labelledby="performance-matched-heading"
        >
          <header>
            <h3 id="performance-matched-heading">Matched implementation comparison</h3>
            <p>
              Same inputs, outputs, cache state, stream, timer, warmups, and
              alternating run order. Each value is the median of three fresh
              process medians.
            </p>
          </header>
          <div className="performance-comparison-grid">
            {study.comparisons.map((comparison) => (
              <MatchedComparison comparison={comparison} key={comparison.title} />
            ))}
          </div>
          {study.comparisonEvidencePath && (
            <p className="performance-comparison-evidence">
              Raw samples and protocol: {study.comparisonEvidencePath}
            </p>
          )}
        </section>
      )}

      {externalMeasurements.length > 0 && (
        <section
          className="performance-external-results"
          aria-labelledby="performance-external-heading"
        >
          <h3 id="performance-external-heading">Protocol-unmatched external result</h3>
          <p>
            Diagnostic context only. These values are excluded from the plot
            because their timer, cache state, or run order does not match.
          </p>
          <dl>
            {externalMeasurements.map((entry) => (
              <div key={entry.label}>
                <dt>{entry.label}</dt>
                <dd>
                  <strong>{entry.value.toFixed(study.unit === "ms" ? 6 : 3)} {study.unit}</strong>
                  <span>{statusLabels[entry.status]}</span>
                  <p>{entry.note}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="table-scroll performance-ablation-table">
        <table aria-label="Optimization ablation decisions">
          <thead>
            <tr>
              <th>Optimization</th>
              <th>Class</th>
              <th>Decision</th>
              <th>Measured impact</th>
            </tr>
          </thead>
          <tbody>
            {study.optimizations.map((entry) => (
              <tr key={entry.category}>
                <td>{entry.optimization}</td>
                <td>{entry.category}</td>
                <td><span className={"performance-decision performance-decision-" + entry.decision.replace(" ", "-")}>{entry.decision}</span></td>
                <td>{entry.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="performance-boundary-grid">
        <div>
          <dt>Theoretical floor</dt>
          <dd>{study.theoreticalFloor}</dd>
        </div>
        <div>
          <dt>Comparator verdict</dt>
          <dd>{study.comparatorVerdict}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{study.evidencePath}<br />{study.frontierAuditPath}</dd>
        </div>
      </dl>
    </section>
  );
}
