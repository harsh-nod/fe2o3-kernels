/** Historical presentation only. Decode one reported EXEC bit mask, never a live wave owner. */
import { parseHardwareResourceCapture, type HardwareCapture } from "./hardware-resource-capture";

export type HardwareExecUnavailableReason = "capture_unavailable" | "missing_exec" | "ambiguous_exec" |
  "unsupported_exec_class" | "exec_unavailable" | "unsupported_exec_width";
export type HardwareExecView = Readonly<{
  status: "ready"; bindingKey: string; registerIdentity: string; evidenceIdentity: string;
  maskHex: string; enabledLanes: number; lanes: readonly Readonly<{ lane: number; enabled: boolean }>[];
}> | Readonly<{
  status: "unavailable"; bindingKey: string | null; registerIdentity: string | null;
  reason: HardwareExecUnavailableReason; reportedReason: string | null;
}>;
export type HardwareExecCapture = Readonly<{ capture: HardwareCapture; exec: HardwareExecView }>;

function project(capture: HardwareCapture): HardwareExecView {
  if (capture.status === "unavailable") return Object.freeze({
    status: "unavailable", bindingKey: null, registerIdentity: null, reason: "capture_unavailable",
    reportedReason: capture.stage + " / " + capture.reason,
  });
  const projection = capture.projection;
  const unavailable = (reason: HardwareExecUnavailableReason, registerIdentity: string | null = null,
    reportedReason: string | null = null): HardwareExecView => Object.freeze({
      status: "unavailable", bindingKey: projection.bindingKey, registerIdentity, reason, reportedReason,
    });
  // Scan the whole bounded roster, not the currently visible page. Equal bits do not disambiguate names.
  const candidates = projection.registers.filter(row => row.name === "exec");
  if (candidates.length === 0) return unavailable("missing_exec");
  if (candidates.length !== 1) return unavailable("ambiguous_exec");
  const register = candidates[0];
  if (register.registerClass !== "predicate") return unavailable("unsupported_exec_class", register.identity, register.reason);
  if (register.status !== "available") return unavailable("exec_unavailable", register.identity, register.reason);
  if (register.bitWidth !== 64) return unavailable("unsupported_exec_width", register.identity);
  // The unchanged parser already checked exactly sixteen lowercase hex digits, class and observation identity.
  const mask = BigInt(register.representation);
  const lanes = Object.freeze(Array.from({ length: 64 }, (_, lane) => Object.freeze({
    lane, enabled: ((mask >> BigInt(lane)) & 1n) === 1n,
  })));
  return Object.freeze({
    status: "ready", bindingKey: projection.bindingKey, registerIdentity: register.identity,
    evidenceIdentity: register.evidenceIdentity!, maskHex: register.representation,
    enabledLanes: lanes.filter(lane => lane.enabled).length, lanes,
  });
}

/** One bounded unchanged whole-record parse before presentation. No DTO admission or provider is accepted here. */
export function parseHardwareResourceExecCapture(raw: string): HardwareExecCapture {
  const capture = parseHardwareResourceCapture(raw);
  return Object.freeze({ capture, exec: project(capture) });
}
