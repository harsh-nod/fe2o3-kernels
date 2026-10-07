import { webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { App } from "../src/App";

const title = "Trace retained whole-region macro origins";
const reportSha = "6f519171ce7ff382a27ed6ef3f260aa190ecb9f888a2ddebf29d7aa5cac1aed6";
const canonicalSha = "c9722c19fe89dd4edb097bb05362ad1e1185db5fad60172ca65da2e832f5bd53";

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("route must not fetch"); }));
});
afterEach(() => vi.unstubAllGlobals());

async function renderRoute() {
  render(<MemoryRouter initialEntries={["/debugger/source-isa-agent"]}><App /></MemoryRouter>);
  return await screen.findByRole("region", { name: title }, { timeout: 15_000 });
}

async function openFrames(user: ReturnType<typeof userEvent.setup>, tutorial: HTMLElement) {
  const open = within(tutorial).getByRole("button", { name: "Open retained macro frames" });
  open.focus();
  await user.keyboard("{Enter}");
  const frames = await within(tutorial).findByRole("region", { name: "Ordered-program macro origins" });
  await within(frames).findByRole("combobox", { name: "Expansion frame" });
  return frames;
}

it("makes the existing route's historical tutorial reachable but closed by default", async () => {
  const tutorial = await renderRoute();
  expect(within(tutorial).getByRole("button", { name: "Open retained macro frames" }))
    .toHaveAttribute("aria-expanded", "false");
  expect(within(tutorial).queryByRole("region", { name: "Ordered-program macro origins" })).toBeNull();
  expect(tutorial).toHaveTextContent("historical compiler capture");
  expect(tutorial).toHaveTextContent("not a run of current main");
  expect(tutorial).toHaveTextContent("do not authenticate its compiler process");
  expect(tutorial).toHaveTextContent("Final artifact association and physical register values remain unavailable");
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it("uses the real capture and independent caller pins for both whole-region frames", async () => {
  const user = userEvent.setup(), tutorial = await renderRoute();
  const frames = await openFrames(user, tutorial);
  expect(within(tutorial).getByRole("button", { name: "Close retained macro frames" }))
    .toHaveAttribute("aria-expanded", "true");
  expect(within(frames).getByRole("heading", { level: 4 })).toHaveTextContent("amdgpu_ordered_program");
  expect(within(frames).getByRole("combobox", { name: "Expansion frame" })).toHaveValue("0");
  expect(within(frames).getAllByRole("option").map(option => option.textContent))
    .toEqual(["0: amdgpu_ordered_program", "1: ordered_program_wrapper"]);
  expect(frames).toHaveTextContent("2 actual retained frames. Whole ordered region only.");
  await user.selectOptions(within(frames).getByRole("combobox", { name: "Expansion frame" }), "1");
  expect(within(frames).getByRole("heading", { level: 4 })).toHaveTextContent("ordered_program_wrapper");
  expect(within(frames).getByRole("region", { name: "Call site" }))
    .toHaveTextContent("ordered_program_wrapper!(a, b, c)");
  const definition = within(frames).getByRole("region", { name: "Definition site" });
  expect(definition).toHaveTextContent("Bytes [290, 558)");
  expect(definition).toHaveTextContent("macro_rules! ordered_program_wrapper");
  expect(definition).toHaveTextContent("amdgpu_ordered_program!");
  const identities = within(frames).getByText("Exact selected variant and baseline");
  // user-event does not synthesize summary Enter activation; the real browser spec does.
  await user.click(identities);
  expect(identities.closest("details")).toHaveAttribute("open");
  expect(within(frames).getByText(reportSha, { exact: true })).toBeVisible();
  expect(within(frames).getByText(canonicalSha, { exact: true })).toBeVisible();
  expect(frames).toHaveTextContent("not an LLVM inline stack or individual instruction stops");
  expect(frames).toHaveTextContent("physical register values and allocation lifetimes: unavailable");
  expect(within(frames).queryByRole("button", { name: /compile|launch|connect|run/iu })).toBeNull();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it("keyboard close and reopen remounts at the innermost frame without retaining stale selection", async () => {
  const user = userEvent.setup(), tutorial = await renderRoute();
  const frames = await openFrames(user, tutorial);
  await user.selectOptions(within(frames).getByRole("combobox", { name: "Expansion frame" }), "1");
  const close = within(tutorial).getByRole("button", { name: "Close retained macro frames" });
  close.focus();
  await user.keyboard("{Enter}");
  expect(within(tutorial).queryByRole("region", { name: "Ordered-program macro origins" })).toBeNull();
  expect(within(tutorial).getByRole("button", { name: "Open retained macro frames" })).toHaveFocus();
  const reopened = await openFrames(user, tutorial);
  expect(within(reopened).getByRole("combobox", { name: "Expansion frame" })).toHaveValue("0");
  expect(within(reopened).getByRole("heading", { level: 4 })).toHaveTextContent("amdgpu_ordered_program");
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it("does not replace an ordinary-source structural selection while macro frames change", async () => {
  const user = userEvent.setup(), tutorial = await renderRoute();
  await user.click(screen.getByRole("button", { name: "Open ordinary source navigation" }));
  const navigation = await screen.findByRole("region", { name: "Read-only authoring navigation" });
  await user.click(await within(navigation).findByRole("button", { name: "Bytes 325–334: low | 256" }));
  const candidates = within(navigation).getByRole("region", { name: "Source attribution candidates" });
  await user.click(within(candidates).getByRole("button", { name: "0:0:4 BitOr" }));
  const boundary = within(navigation).getByRole("region", { name: "Retained structural boundary" });
  expect(boundary).toHaveTextContent("%16: Scalar(U32)");
  const frames = await openFrames(user, tutorial);
  await user.selectOptions(within(frames).getByRole("combobox", { name: "Expansion frame" }), "1");
  expect(boundary).toHaveTextContent("%16: Scalar(U32)");
  expect(within(navigation).getByLabelText("Retained ordinary Rust source").querySelector("mark"))
    .toHaveTextContent("low | 256");
  await user.click(within(tutorial).getByRole("button", { name: "Close retained macro frames" }));
  expect(boundary).toBeVisible();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
