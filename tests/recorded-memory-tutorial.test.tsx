import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { RecordedMemoryTutorial } from "../src/components/RecordedMemoryTutorial";
import { recordedMemoryExercises, RECORDED_MEMORY_TUTORIAL_PIN } from "../src/content/recorded-memory-tutorial";

afterEach(() => vi.unstubAllGlobals());

it("offers three prediction-first reference exercises without importing, fetching or issuing commands", () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  render(<RecordedMemoryTutorial />);
  const guide = screen.getByRole("region", { name: "Guided retained-memory reference lab" });
  expect(guide).toHaveTextContent("No live debugger, GPU execution, command replay, capture export or cross-compiler comparison");
  expect(guide).toHaveTextContent("save a local view bookmark");
  expect(guide).toHaveTextContent("This guide does not import anything automatically");
  expect(guide).toHaveTextContent(RECORDED_MEMORY_TUTORIAL_PIN);
  expect(within(guide).queryByRole("combobox")).not.toBeInTheDocument();
  expect(within(guide).queryByRole("button")).not.toBeInTheDocument();
  for (const exercise of recordedMemoryExercises) {
    const region = within(guide).getByRole("region", { name: exercise.title });
    expect(region).toHaveTextContent(exercise.prediction);
    expect(within(region).getByLabelText(exercise.id + " observation steps")).toHaveTextContent("baseline");
    expect(within(region).getByText("Check predictions: " + exercise.id).parentElement).not.toHaveAttribute("open");
  }
  expect(fetch).not.toHaveBeenCalled();
});

it("exposes byte-pinned preparation and independent answers through native details", async () => {
  const user = userEvent.setup(); render(<RecordedMemoryTutorial />);
  for (const exercise of recordedMemoryExercises) {
    const prepare = screen.getByText("Prepare " + exercise.id + " excerpt and check byte identities");
    // Native Enter activation is checked in every real-browser exercise; JSDOM
    // does not implement that default action for summary keyboard events.
    await user.click(prepare);
    expect(prepare.parentElement).toHaveAttribute("open");
    expect(screen.getByLabelText(exercise.id + " excerpt commands")).toHaveTextContent("mktemp -d");
    expect(screen.getByLabelText(exercise.id + " excerpt byte identities")).toHaveTextContent(exercise.responseSha256);
    expect(screen.getByRole("link", { name: "Original " + exercise.id + " responses" })).toHaveAttribute("href",
      "https://github.com/harsh-nod/fe2o3-kernels/blob/" + RECORDED_MEMORY_TUTORIAL_PIN + "/" + exercise.responses);
    await user.click(screen.getByText("Check predictions: " + exercise.id));
    expect(screen.getByLabelText(exercise.id + " expected observations")).toBeVisible();
  }
  expect(screen.getByLabelText("lds expected observations")).toHaveTextContent("1 storage-byte difference and 4 initialization differences");
  expect(screen.getByLabelText("scope expected observations")).toHaveTextContent("do not establish equality");
});

it("states unavailable provenance, unchanged bounds and outstanding fault/lifetime limitations", () => {
  render(<RecordedMemoryTutorial />);
  const boundary = screen.getByRole("region", { name: "Reference lab limits and next steps" });
  expect(boundary).toHaveTextContent("The site record pin is not a compiler pin");
  expect(boundary).toHaveTextContent("original compiler-build closure is unavailable");
  expect(boundary).toHaveTextContent("No fault/watchpoint exercise");
  expect(boundary).toHaveTextContent("256 KiB per imported file, 64 KiB per line, 128 pairs, 32 checkpoints");
  expect(boundary).toHaveTextContent("4096 bytes");
  expect(boundary).toHaveTextContent("256 bytes");
  expect(boundary).toHaveTextContent("Unknown targets stay unknown");
});
