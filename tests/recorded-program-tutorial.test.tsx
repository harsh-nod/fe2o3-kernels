import { webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecordedProgramTutorial } from "../src/components/RecordedProgramTutorial";
import { ORDERED_PROGRAM_RETAINED_INPUT } from "../src/content/ordered-program-retained-input";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());

it("uses the existing real capture and pinned complete fixture without a compiler action", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  render(<RecordedProgramTutorial />);
  expect(await screen.findByText("Retained public diagnostic CPU observations; not a qualified compiler release.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Complete source fixture at the qualified compiler pin" }))
    .toHaveAttribute("href", "https://github.com/harsh-nod/fe2o3/blob/f5e81f985ff3e2771ad0f132d483f5cf74976ad6/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/ordered_program_v32.rs");
  expect(screen.getByLabelText("Three-instruction source excerpt")).toHaveTextContent("xor(out, input1, scratch)");
  expect(screen.getByRole("region", { name: "CPU and native evidence boundaries" })).toHaveTextContent("LLVM IR is not bypassed");
  expect(screen.queryByRole("button", { name: /compile|launch|connect/iu })).not.toBeInTheDocument();
  expect(screen.queryByText(/Synthetic test-only input/u)).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it("keeps independent arithmetic answers distinct from observed program values", async () => {
  const user = userEvent.setup();
  render(<RecordedProgramTutorial />);
  await screen.findByRole("combobox", { name: "Recorded program variant" });
  await user.click(screen.getByText("Expected arithmetic answers"));
  const answers = screen.getByRole("table", { name: "Independent arithmetic expectations" });
  expect(answers).toHaveTextContent("not a memory-observation table");
  expect(within(answers).getAllByRole("row")).toHaveLength(4);
  expect(within(answers).getByRole("row", { name: "Three instructions 23 23 19" })).toBeInTheDocument();
  expect(within(answers).getByRole("row", { name: "Sixteen instructions 12 12 19" })).toBeInTheDocument();
  const viewer = screen.getByRole("region", { name: "Recorded ordered-program observations" });
  expect(within(viewer).queryByRole("table", { name: "Independent arithmetic expectations" })).not.toBeInTheDocument();
  expect(screen.getByText(/output-store columns are source expectations/u)).toBeInTheDocument();
});

it("supports the guided unused-result and reverse exercise using actual lane-zero records", async () => {
  const user = userEvent.setup();
  render(<RecordedProgramTutorial />);
  await user.selectOptions(await screen.findByRole("combobox", { name: "Recorded program variant" }), "3");
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded program request case" }), "5");
  const phase = screen.getByRole("combobox", { name: "Recorded whole-program checkpoint" });
  const values = screen.getByRole("table", { name: "Recorded program logical values" });
  expect(values).toHaveTextContent("Unavailable: not_in_scope");
  await user.selectOptions(phase, "1");
  expect(values).toHaveTextContent("0x00000017 (23)");
  expect(within(values).getAllByText("Not queried at this checkpoint")).toHaveLength(3);
  await user.selectOptions(phase, "2");
  expect(values).toHaveTextContent("0x00000013 (19)");
  await user.selectOptions(screen.getByRole("combobox", { name: "Recorded program variant" }), "5");
  expect(screen.getByRole("combobox", { name: "Recorded whole-program checkpoint" })).toHaveValue("0");
  expect(screen.getByRole("combobox", { name: "Recorded program request case" })).toHaveValue("0");
  expect(within(screen.getByRole("list", { name: "Declared instruction sequence" })).getAllByRole("listitem")).toHaveLength(16);
  expect(screen.queryByRole("combobox", { name: /lane/iu })).not.toBeInTheDocument();
});

it("retains the inherited missing-input refusal instead of presenting answer text as capture", async () => {
  render(<RecordedProgramTutorial input={null} />);
  const viewer = screen.getByRole("region", { name: "Recorded ordered-program observations" });
  expect(await within(viewer).findByText(/Retained V17 capture pending/u)).toHaveAttribute("data-state", "unavailable");
  expect(within(viewer).queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

it("clears prior observations immediately when a replacement capture has an invalid byte pin", async () => {
  const { rerender } = render(<RecordedProgramTutorial />);
  await screen.findByRole("table", { name: "Recorded program logical values" });
  rerender(<RecordedProgramTutorial input={{ ...ORDERED_PROGRAM_RETAINED_INPUT, expectedCaptureSha256: "f".repeat(64) }} />);
  expect(screen.queryByRole("table", { name: "Recorded program logical values" })).not.toBeInTheDocument();
  const viewer = screen.getByRole("region", { name: "Recorded ordered-program observations" });
  expect(await within(viewer).findByText("Retained identities or observations disagree.")).toHaveAttribute("data-state", "invalid");
  expect(within(viewer).queryByRole("table")).not.toBeInTheDocument();
});
