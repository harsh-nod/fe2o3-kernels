import requests from "../../examples/source_lds_resource_v1.requests.jsonl?raw";
import responses from "../../examples/source_lds_resource_v1.responses.jsonl?raw";

/** Unchanged original pairs: post-write, an empty scanned page, then reverse.
 * The full recording is deliberately larger than the import cap. */
export function retainedLdsImportExcerpt(ids: readonly number[] = [11, 12, 13, 14, 15, 16, 17, 18]) {
  function select(raw: string) {
    const lines = raw.trimEnd().split("\n").filter(line => ids.includes(JSON.parse(line).request_id));
    if (lines.length !== ids.length) throw new Error("Exact LDS excerpt roster changed.");
    return lines.join("\n") + "\n";
  }
  return { requests: select(requests), responses: select(responses) };
}
