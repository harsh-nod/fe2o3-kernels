import { recordedMemoryExercises, recordedMemoryExcerptCommands,
  RECORDED_MEMORY_TUTORIAL_PIN, RECORDED_MEMORY_TUTORIAL_URL, RECORDED_MEMORY_TUTORIAL_DOCS } from "../content/recorded-memory-tutorial";
import "./RecordedMemoryTutorial.css";

export function RecordedMemoryTutorial() {
  return <section className="recorded-memory-tutorial" aria-label="Guided retained-memory reference lab">
    <header>
      <h3>Compare bytes, initialization, and missing memory</h3>
      <p>Predict first, then inspect unchanged excerpts from existing source-produced CPU recordings.
        This guide does not import anything automatically. Use <strong>Open local resource recording</strong> below
        and select each baseline yourself.</p>
      <p>Reference lab only: caller-supplied / unverified data, not a published curriculum lesson.
        No live debugger, GPU execution, command replay, selection export or cross-compiler comparison.</p>
    </header>
    <section aria-label="Prepare the retained recording files">
      <h4>Prepare the original files</h4>
      <p>Use a checkout of <code>harsh-nod/fe2o3-kernels</code> at site record pin <code>{RECORDED_MEMORY_TUTORIAL_PIN}</code>.
        Run each exercise&apos;s commands from that checkout&apos;s root. Each creates a fresh temporary directory
        and copies complete original lines; it does not execute their recorded commands.
        Match both SHA-256 values before choosing the files in the importer.</p>
      <p>Files stay local. The full transcripts contain unsupported operations or exceed import limits;
        use only the listed excerpts. Do not edit responses or replay their process-local revisions and tokens.</p>
      <p><a href={RECORDED_MEMORY_TUTORIAL_DOCS + "recorded-memory-comparison-lab-v1.md"}>Complete reference lab and commands</a>
        {" · "}<a href={RECORDED_MEMORY_TUTORIAL_DOCS + "recorded-resource-import-v1.md"}>Existing importer contract</a></p>
    </section>
    {recordedMemoryExercises.map(exercise => <section key={exercise.id} className="recorded-memory-tutorial-exercise"
      aria-label={exercise.title}>
      <h4>{exercise.title}</h4>
      <p className="recorded-memory-tutorial-prediction"><strong>Predict:</strong> {exercise.prediction}</p>
      <details>
        <summary>Prepare {exercise.id} excerpt and check byte identities</summary>
        <pre tabIndex={0} aria-label={exercise.id + " excerpt commands"}><code>{recordedMemoryExcerptCommands(exercise)}</code></pre>
        <dl aria-label={exercise.id + " excerpt byte identities"}>
          <dt>Requests ({exercise.requestBytes} bytes)</dt><dd><code>{exercise.requestSha256}</code></dd>
          <dt>Responses ({exercise.responseBytes} bytes)</dt><dd><code>{exercise.responseSha256}</code></dd>
        </dl>
        <p><a href={RECORDED_MEMORY_TUTORIAL_URL + exercise.requests}>Original {exercise.id} requests</a>
          {" · "}<a href={RECORDED_MEMORY_TUTORIAL_URL + exercise.responses}>Original {exercise.id} responses</a>
          {" · "}<a href={RECORDED_MEMORY_TUTORIAL_URL + exercise.evidence}>Retained {exercise.id} source evidence</a></p>
        <p>Recorded source path: <code>{exercise.source}</code><br />
          Recorded source SHA-256: <code>{exercise.sourceSha256}</code>.
          This identifies a recorded claim, not a newly authenticated source/build join.</p>
      </details>
      <ol aria-label={exercise.id + " observation steps"}>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <details>
        <summary>Check predictions: {exercise.id}</summary>
        <ul aria-label={exercise.id + " expected observations"}>{exercise.answers.map(answer => <li key={answer}>{answer}</li>)}</ul>
      </details>
    </section>)}
    <section className="recorded-memory-tutorial-boundary" aria-label="Reference lab limits and next steps">
      <h4>What this comparison cannot establish</h4>
      <p>Byte hashes identify files, not their producer. The source path, source association and target remain
        recorded claims; the original compiler-build closure is unavailable. The global run has no exact original
        compiler commit. The site record pin is not a compiler pin.</p>
      <p>No fault/watchpoint exercise, live reverse execution, dynamic-frame or allocation-reuse proof,
        physical registers, native timing, GPU equivalence or milestone completion is claimed here.
        Unknown targets stay unknown; no hypothetical target is needed for these exercises.</p>
      <p>Existing bounds stay unchanged: 256 KiB per imported file, 64 KiB per line, 128 pairs, 32 checkpoints;
        memory inputs up to 4096 bytes and comparison viewports up to 256 bytes.
        Missing or partial bytes are not zero-filled. B/I/=/ ? labels and byte details work without color;
        use arrows, Home and End inside the comparison cells.</p>
      <p>For separate fresh source export and CPU capture prerequisites, see the
        {" "}<a href={RECORDED_MEMORY_TUTORIAL_DOCS + "resource-memory-windows.md"}>source-produced resource walkthrough</a>.
        Fresh captures can have different session identities and are not replacements for these byte-pinned excerpts.</p>
    </section>
  </section>;
}
