import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import capture from "../examples/source_resource_checkpoint_v1.json";
import { ResourceMemoryView } from "../src/components/ResourceMemoryView";
import { projectResourceMemoryResponse } from "../src/content/resource-memory-view";

describe("ordinary Rust-source resource checkpoint", () => {
  it("retains the exact source-exported CPU response without upgrading its authority", () => {
    const bytes = readFileSync("examples/source_resource_checkpoint_v1.json");
    expect(createHash("sha256").update(bytes).digest("hex")).toBe("cdf1a4fdd2139656bb8399d125fdc3baef01ffb2371fb0763b3f9b5bdbc114a7");
    const projected = projectResourceMemoryResponse(capture.response, capture.expectedSnapshot);
    expect(projected.status).toBe("ready");
    expect(capture.response.session.hardware_observed).toBe(false);
    expect(capture.response.result.snapshot.site.source.location.provenance).toBe("compiler_bundle_bound");
    expect(capture.response.result.memory.availability.bytes).toBe(`0x00002a42${"00".repeat(12)}deadbeefcafebabe`);
    render(<ResourceMemoryView response={capture.response} expectedSnapshot={capture.expectedSnapshot} />);
    expect(screen.getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
    expect(screen.getByText("CPU replay · simulated observation")).toBeInTheDocument();
  });

  it("does not reuse the Rust-source memory for the raw-KIR lesson's cursor", () => {
    const stale = { ...capture.expectedSnapshot, cursor: { ...capture.expectedSnapshot.cursor, event_sequence: 9 } };
    expect(projectResourceMemoryResponse(capture.response, stale).status).toBe("stale");
  });
});
