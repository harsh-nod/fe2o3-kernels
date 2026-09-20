import requests from "../../examples/resource-query-v6/debug-requests.jsonl?raw";
import responses from "../../examples/resource-query-v6/debug-responses.jsonl?raw";

/** Exact original lines from an existing actual CPU recording, not a simulated
 * positive fixture. Selection does not reserialize or edit captured fields. */
export const RETAINED_RESOURCE_IDS = [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21] as const;
/** Adds the actual earlier three-value checkpoint; no captured field changes. */
export const RETAINED_RESOURCE_VALUE_IDS = [1, 3, ...RETAINED_RESOURCE_IDS] as const;
export const retainedResourceStreams = { requests, responses };
export function retainedResourceExcerpt(ids: readonly number[] = RETAINED_RESOURCE_IDS) {
  function select(raw: string) {
    const lines = raw.trimEnd().split("\n").filter(line => ids.includes(JSON.parse(line).request_id));
    if (lines.length !== ids.length) throw new Error("Retained fixture selection must preserve exact original pairs.");
    return lines.join("\n") + "\n";
  }
  return { requests: select(requests), responses: select(responses) };
}

// Deliberately schema-invalid mutation controls, not a production DTO or parser.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MutableResourceControl = Record<string, any>;
/** Negative tests only: synthetic mutations must not be called retained data. */
export function mutateResourceLine(raw: string, id: number, edit: (value: MutableResourceControl) => void) {
  return raw.trimEnd().split("\n").map(line => {
    const value = JSON.parse(line);
    if (value.request_id !== id) return line;
    edit(value);
    return JSON.stringify(value);
  }).join("\n") + "\n";
}
