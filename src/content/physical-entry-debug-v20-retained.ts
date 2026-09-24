/** Exact retained bytes; these imports do not run or authenticate a debugger. */
import oneRequests from "../../examples/physical-entry-debug-v20/one-selector0.requests.jsonl?raw";
import oneResponses from "../../examples/physical-entry-debug-v20/one-selector0.responses.jsonl?raw";
import zeroRequests from "../../examples/physical-entry-debug-v20/diamond-selector0.requests.jsonl?raw";
import zeroResponses from "../../examples/physical-entry-debug-v20/diamond-selector0.responses.jsonl?raw";
import oneDiamondRequests from "../../examples/physical-entry-debug-v20/diamond-selector1.requests.jsonl?raw";
import oneDiamondResponses from "../../examples/physical-entry-debug-v20/diamond-selector1.responses.jsonl?raw";
import editedRequests from "../../examples/physical-entry-debug-v20/registers-selector1.requests.jsonl?raw";
import editedResponses from "../../examples/physical-entry-debug-v20/registers-selector1.responses.jsonl?raw";
import provenance from "../../examples/physical-entry-debug-v20/provenance.json";
import { PHYSICAL_DEBUG_SELECTOR_V20, type PhysicalDebugInputV20 } from "./physical-entry-debug-v20";
const bytes = [[oneRequests, oneResponses], [zeroRequests, zeroResponses], [oneDiamondRequests, oneDiamondResponses], [editedRequests, editedResponses]];
export const PHYSICAL_DEBUG_RETAINED_V20: readonly { readonly label: string; readonly input: PhysicalDebugInputV20 }[] =
  provenance.recordings.map((row, index) => Object.freeze({
    label: row.name,
    input: Object.freeze({ selector: PHYSICAL_DEBUG_SELECTOR_V20, requestsUtf8: bytes[index][0], responsesUtf8: bytes[index][1],
      expected: Object.freeze({ requests: row.requests.sha256, responses: row.responses.sha256 }) }),
  }));
