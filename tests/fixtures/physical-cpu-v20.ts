// Synthetic HTTP/correlation controls around retained actual CLI rows; not a live server.
import { createHash } from "node:crypto";
import retainedText from "../../examples/physical-entry-debug-v20/one-selector0.responses.jsonl?raw";
import { parseProgramJson } from "../../src/content/ordered-program-observation.mjs";
import type { Row } from "../../src/content/physical-entry-debug-v20-shapes";
import { PHYSICAL_BRIDGE_V20 } from "../../src/lib/physical-cpu-v20-protocol";
import { lossless } from "./cpu-debug-bridge";
export { lossless };
export const PHYSICAL_URL = "http://127.0.0.1:8742", PHYSICAL_SECRET = "3".repeat(64);
const lines = retainedText.trim().split("\n"), INDEX = { capabilities: 0, checkpoint: 80, values: 86, memory: 85 };
export function retainedPhysical(name: keyof typeof INDEX): Row {
  return parseProgramJson(lines[INDEX[name]], 65536) as Row;
}
export function physicalQuery(config: string, event: number, revision: number): string {
  const integers = Buffer.alloc(16); integers.writeBigUInt64LE(BigInt(event)); integers.writeBigUInt64LE(BigInt(revision), 8);
  return createHash("sha256").update("fe2o3-debug-physical-v20-ssa-page-v1\0").update(Buffer.from(config, "hex")).update(integers).digest("hex");
}
export class SyntheticPhysicalBridgeV20 {
  calls: { url: string; init: RequestInit; body: Row }[] = [];
  event = 0; revision = 0; nonce = ""; position = 0; limit = 0;
  mutate: ((outer: Row) => void) | null = null;
  refusal = false;
  private view(): Row {
    const base = retainedPhysical("capabilities").session as Row;
    return { ...base, state: this.event === 0 ? "created" : "stopped", revision: this.revision,
      cursor: { configuration_identity: base.configuration_identity, event_sequence: this.event, state_revision: this.revision } };
  }
  private anchor(view: Row): Row {
    const root = (retainedPhysical("checkpoint").result as Row).snapshot as Row;
    return { ...((root.snapshot as Row).anchor as Row), cursor: view.cursor };
  }
  private snapshot(view: Row): Row {
    return this.event === 2181 ? { status: "captured", snapshot: { anchor: this.anchor(view), values: [],
      stop: { reason: "step", outcome: "active", exact: true } } } : { status: "unavailable", reason: "not_captured" };
  }
  fetch = async (url: string, init: RequestInit): Promise<Response> => {
    const body = JSON.parse(String(init.body)) as Row; this.calls.push({ url, init, body });
    if (body.schema !== PHYSICAL_BRIDGE_V20) throw new Error("wrong test profile");
    if (body.action === "connect") { this.nonce = String(body.connection_id); this.event = 0; this.revision = 0; }
    if (body.action === "disconnect") return this.response({ schema: PHYSICAL_BRIDGE_V20, status: "disconnected",
      connection_id: this.nonce, closed: true });
    let operation = "discover_capabilities", result = retainedPhysical("capabilities").result as Row;
    let capability = "";
    if (body.action === "command") {
      const words = String(body.command).split(" "), old = this.event;
      if (["step", "reverse", "seek"].includes(words[0])) {
        operation = words[0] === "seek" ? "seek" : "step";
        this.event = words[0] === "seek" ? Number(words[1]) : words[0] === "step"
          ? Math.min(2753, old + Number(words[1])) : Math.max(0, old - Number(words[1]));
        this.revision++;
        result = { result: "control", stop: { reason: this.event === 2753 ? "completed" : this.event === 0 ? "entry" : "step",
          outcome: this.event === 2753 ? "completed" : "active", exact: true },
          events_advanced: Math.abs(Math.min(this.event, 2752) - Math.min(old, 2752)), snapshot: this.snapshot(this.view()) };
      } else if (words[0] === "state") { operation = "get_state"; result = { result: "state", snapshot: this.snapshot(this.view()) }; }
      else if (words[0] === "values") {
        operation = "inspect_values"; capability = "kir_ssa_values";
        if (words[1] === "next") this.position += this.limit; else { this.position = 0; this.limit = Number(words[1]); }
        const rows = (retainedPhysical("values").result as Row).values as Row[];
        result = { result: "values", snapshot: this.anchor(this.view()), values: rows.slice(this.position, this.position + this.limit) };
        if (this.position + this.limit < rows.length) result.next_cursor = {
          query_identity: physicalQuery(String(this.view().configuration_identity), this.event, this.revision),
          position: this.position + this.limit };
      } else if (words[0] === "memory") {
        operation = "read_memory"; capability = "allocation_relative_memory";
        result = { ...(retainedPhysical("memory").result as Row), snapshot: this.anchor(this.view()) };
        if (words[1] !== "0" || words[2] !== "4") this.refusal = true;
      } else throw new Error("unsupported synthetic command");
    }
    const view = this.view(), sequence = body.action === "connect" ? 0 : Number(body.sequence);
    const inner: Row = { schema: "fe2o3-debug-response-v1", status: "ok", request_id: sequence + 1,
      operation, session: view, result };
    if (this.refusal) {
      delete inner.result; inner.status = "unavailable"; inner.unavailable = { capability, reason: "outside_capture_scope",
        state_changed: false, detail: "diagnostic physical-entry V20 exposes bounded CPU observations only" };
    }
    const outer: Row = { schema: PHYSICAL_BRIDGE_V20, status: "ok", connection_id: this.nonce, bridge_session: "e".repeat(64),
      sequence: String(sequence), session: { ...view, revision: String(view.revision), cursor: { ...(view.cursor as Row),
        event_sequence: String(this.event), state_revision: String(this.revision) } }, response_json: lossless(inner), closed: false };
    this.mutate?.(outer); return this.response(outer);
  };
  private response(row: Row): Response {
    return new Response(lossless(row), { headers: { "Content-Type": "application/json" } });
  }
}
