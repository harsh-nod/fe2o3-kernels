/** Unchanged actual CLI strings inside bounded containers; no command execution. */
import one64 from "../../examples/physical-global-copy-debug-v21/one-grid64-output129.json?raw";
import one128 from "../../examples/physical-global-copy-debug-v21/one-grid128-output129.json?raw";
import registers64 from "../../examples/physical-global-copy-debug-v21/registers-grid64-output129.json?raw";
import registers128 from "../../examples/physical-global-copy-debug-v21/registers-grid128-output129.json?raw";
import zero from "../../examples/physical-global-copy-debug-v21/one-grid128-output0.json?raw";
import partial from "../../examples/physical-global-copy-debug-v21/one-grid128-output33.json?raw";
import provenance from "../../examples/physical-global-copy-debug-v21/provenance.json";
import type { PhysicalCopyInputV21 } from "./physical-global-copy-debug-v21-input";
const containers = [one64, one128, registers64, registers128, zero, partial];
export const PHYSICAL_COPY_RETAINED_V21: readonly { readonly label: string; readonly input: PhysicalCopyInputV21 }[] =
  provenance.recordings.map((row, i) => Object.freeze({
    label: row.name,
    input: Object.freeze({ containerUtf8: containers[i], expectedSha256: row.container.sha256 }),
  }));
