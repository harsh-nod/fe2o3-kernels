import { readFileSync } from "node:fs";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderedOriginImport } from "../src/components/OrderedOriginImport";
import { parseOrderedOriginJson } from "../src/content/ordered-origin-observation.mjs";
import * as reader from "../src/content/ordered-origin-file";

const raw = readFileSync("examples/ordered_program_origin_v1.json", "utf8");
const origin = parseOrderedOriginJson(raw);
// Synthetic exact-match UI subject only; this is not a matching native qualification.
const selected = { canonicalKirSha256: origin.canonicalSha256, semanticSha256: origin.semanticSha256,
  sourceInventorySha256: origin.sourceInventorySha256, sourcePreflightSha256: origin.sourcePreflightSha256,
  originBinding: origin };
const props = { selectionIdentity: "synthetic-join:one-O0", caseLabel: "one O0", selected, synthetic: true };
const file = (name = "origin.json") => new File([raw], name, { type: "application/json" });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("separate optional origin import", () => {
  it("shows exact whole-region spans without paths, fine ancestry, authority or network actions", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    vi.spyOn(reader, "readOrderedOriginFile").mockResolvedValue(raw);
    const user = userEvent.setup(); render(<OrderedOriginImport {...props} />);
    expect(screen.getByText("No ordered-origin report selected.")).toBeInTheDocument();
    await user.upload(screen.getByLabelText("Ordered-origin report (local JSON)"), file());
    const report = await screen.findByRole("region", { name: "Imported whole-region origin" });
    expect(within(report).getByRole("status")).toHaveAttribute("data-state", "matching_reported_identities");
    expect(within(report).getByText(/synthetic test data, not native qualification/u)).toBeInTheDocument();
    const call = within(report).getByRole("region", { name: "Source call-site span" });
    expect(within(call).getByText("351..561")).toBeInTheDocument();
    expect(within(call).getByText("12:18 through 17:6")).toBeInTheDocument();
    expect(screen.getByText(/No filename is inferred/u)).toBeInTheDocument();
    expect(screen.getByText(/Unavailable: per-instruction source spans/u)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /compile|run|launch|resume/u })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("shows an explicit mismatch while keeping imported origin metadata separate", async () => {
    vi.spyOn(reader, "readOrderedOriginFile").mockResolvedValue(raw);
    const user = userEvent.setup(); render(<OrderedOriginImport {...props}
      selected={{ ...selected, canonicalKirSha256: "1".repeat(64) }} />);
    await user.upload(screen.getByLabelText("Ordered-origin report (local JSON)"), file());
    const report = await screen.findByRole("region", { name: "Imported whole-region origin" });
    expect(within(report).getByRole("status")).toHaveAttribute("data-state", "mismatch");
    expect(within(report).getByRole("list", { name: "Origin identity mismatches" })).toHaveTextContent("Canonical KIR identity");
  });
  it("invalid replacement immediately clears the previous report and hides exceptions", async () => {
    vi.spyOn(reader, "readOrderedOriginFile").mockResolvedValueOnce(raw).mockResolvedValueOnce('{"private":"/not-shown"}');
    const user = userEvent.setup(); render(<OrderedOriginImport {...props} />);
    const upload = screen.getByLabelText("Ordered-origin report (local JSON)");
    await user.upload(upload, file()); await screen.findByRole("region", { name: "Imported whole-region origin" });
    await user.upload(upload, file("invalid.json")); await screen.findByText(/Ordered-origin report refused/u);
    expect(screen.queryByRole("region", { name: "Imported whole-region origin" })).not.toBeInTheDocument();
    expect(screen.queryByText("/not-shown")).not.toBeInTheDocument();
  });
  it("discards an older delayed read after newer refusal", async () => {
    let finish!: (text: string) => void; let oldSignal!: AbortSignal;
    vi.spyOn(reader, "readOrderedOriginFile").mockImplementationOnce((_file, signal) => {
      oldSignal = signal; return new Promise(resolve => { finish = resolve; });
    }).mockRejectedValueOnce(new Error("private exception"));
    const user = userEvent.setup(); render(<OrderedOriginImport {...props} />);
    const upload = screen.getByLabelText("Ordered-origin report (local JSON)");
    await user.upload(upload, file("old.json")); await user.upload(upload, file("new.json"));
    await screen.findByText(/Ordered-origin report refused/u);
    await act(async () => { finish(raw); });
    expect(oldSignal.aborted).toBe(true);
    expect(screen.queryByRole("region", { name: "Imported whole-region origin" })).not.toBeInTheDocument();
    expect(screen.queryByText("private exception")).not.toBeInTheDocument();
  });
  it("switching native O0/O3 clears matching origin even with identical source identities", async () => {
    vi.spyOn(reader, "readOrderedOriginFile").mockResolvedValue(raw);
    const user = userEvent.setup(); const { rerender } = render(<OrderedOriginImport {...props} />);
    await user.upload(screen.getByLabelText("Ordered-origin report (local JSON)"), file());
    await screen.findByRole("region", { name: "Imported whole-region origin" });
    rerender(<OrderedOriginImport {...props} selectionIdentity="synthetic-join:one-O3" caseLabel="one O3" />);
    expect(screen.queryByRole("region", { name: "Imported whole-region origin" })).not.toBeInTheDocument();
    expect(screen.getByText("No ordered-origin report selected.")).toBeInTheDocument();
  });
  it.each(["clear", "case", "capsule", "unmount"] as const)("aborts and ignores pending reads on %s", async action => {
    let finish!: (text: string) => void; let signal!: AbortSignal;
    vi.spyOn(reader, "readOrderedOriginFile").mockImplementationOnce((_file, supplied) => {
      signal = supplied; return new Promise(resolve => { finish = resolve; });
    });
    const user = userEvent.setup(); const { rerender, unmount } = render(<OrderedOriginImport {...props} />);
    await user.upload(screen.getByLabelText("Ordered-origin report (local JSON)"), file());
    if (action === "clear") await user.click(screen.getByRole("button", { name: "Clear ordered-origin import" }));
    else if (action === "case") rerender(<OrderedOriginImport {...props} selectionIdentity="synthetic-join:one-O3" />);
    else if (action === "capsule") rerender(<OrderedOriginImport {...props} selectionIdentity="replacement-join:one-O0" />);
    else unmount();
    await act(async () => { finish(raw); });
    expect(signal.aborted).toBe(true);
    expect(screen.queryByRole("region", { name: "Imported whole-region origin" })).not.toBeInTheDocument();
  });
});
