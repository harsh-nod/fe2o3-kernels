import { useEffect, useRef, useState } from "react";
import { RepeatNativeComparison } from "./RepeatNativeComparison";
import { readRepeatNativeFile } from "../content/repeat-native-file";
import "./RepeatNativeImport.css";

export interface RepeatNativeImportProps {
  /** Selected independently of the uploaded capsule; changing it clears the import. */
  expectedJoinSha256: string;
}
type ImportState = { status: "empty" | "reading" | "refused" } | { status: "ready"; evidence: string };

function SelectedImport({ expectedJoinSha256 }: RepeatNativeImportProps) {
  const [state, setState] = useState<ImportState>({ status: "empty" });
  const pending = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, []);
  const clear = () => {
    pending.current?.abort(); pending.current = null;
    setState({ status: "empty" });
    if (input.current) input.current.value = "";
  };
  const choose = (file: File | undefined) => {
    pending.current?.abort(); pending.current = null;
    if (!file) { setState({ status: "empty" }); return; }
    const controller = new AbortController(); pending.current = controller;
    setState({ status: "reading" });
    void readRepeatNativeFile(file, controller.signal).then(evidence => {
      if (!controller.signal.aborted && pending.current === controller) {
        pending.current = null; setState({ status: "ready", evidence });
      }
    }, () => {
      if (!controller.signal.aborted && pending.current === controller) {
        pending.current = null; setState({ status: "refused" });
      }
    });
  };
  return <section className="repeat-native-import" aria-label="Local repeat-native capsule import">
    <p>Optional local developer preview. Select a previously prepared 23-artifact capsule;
      this panel does not export, compile, or fetch one. No example is loaded automatically.</p>
    <p>Independent expected join SHA-256: <code>{expectedJoinSha256}</code>.
      This application-selected historical content pin is not a signature or producer authentication.
      Digests advertised by the uploaded file cannot replace it.</p>
    <label>Repeat-native capsule (local JSON)
      <input ref={input} type="file" accept=".json,application/json"
        onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; choose(file); }} />
    </label>
    <button type="button" onClick={clear}>Clear repeat-native import</button>
    <p>Import bounds: one nonempty UTF-8 file up to 4 MiB, exactly 23 artifacts, at most 2 MiB decoded
      artifact bytes and eight whole HSACO payloads. These are profile/import bounds, not process-memory limits.</p>
    {state.status === "ready" ? <RepeatNativeComparison evidence={state.evidence} expectedJoinSha256={expectedJoinSha256} />
      : <p role="status">{state.status === "empty" ? "No local repeat-native capsule selected."
        : state.status === "reading" ? "Reading the bounded local file; previous case and role selections are cleared."
          : "Local file refused: use one nonempty UTF-8 JSON capsule of at most 4 MiB. No previous case is shown."}</p>}
  </section>;
}

export function RepeatNativeImport(props: RepeatNativeImportProps) {
  return <SelectedImport key={props.expectedJoinSha256} {...props} />;
}
