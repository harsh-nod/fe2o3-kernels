import { createHash, webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import retainedUtf8 from "../examples/source_lds_multi_workgroup_v1.json?raw";
import oldUtf8 from "../examples/source_lds_resource_v1.json?raw";
import { ResourceLdsMultiCaptureView } from "../src/components/ResourceLdsMultiCaptureView";
import { ResourceLdsCaptureView } from "../src/components/ResourceLdsCaptureView";
import { DebuggerWorkbench } from "../src/components/DebuggerWorkbench";
import { debuggerWorkbenchFixture } from "../src/content/debugger-workbench";

afterEach(() => vi.unstubAllGlobals());
it("keeps old LDS bytes/pin and every independent timeline selection isolated", async () => {
  const oldPin = "1d1ab41c25693745d233af08f856834d123f8abbb8888f418b1cf5db4a63b494";
  expect(createHash("sha256").update(oldUtf8).digest("hex")).toBe(oldPin);
  vi.stubGlobal("crypto", webcrypto); const user = userEvent.setup();
  render(<><DebuggerWorkbench fixture={debuggerWorkbenchFixture} /><ResourceLdsCaptureView retainedUtf8={oldUtf8} expectedSha256={oldPin} />
    <ResourceLdsMultiCaptureView retainedUtf8={retainedUtf8} expectedSha256="13165393fd04bb857f80886984b0e7a31262209cc2546d117d650cc2179fe441" /></>);
  // Keep all views mounted together, but query each view's own controls so a
  // sibling's large memory grid does not participate in accessible-name scans.
  const current = screen.getByTestId("retained-lds-multi-workgroup-example");
  const old = screen.getByTestId("retained-lds-resource-example");
  const workbench = within(screen.getByRole("region", { name: "Inspect one deterministic semantic trace" }));
  const selector = await within(current).findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
  await user.selectOptions(selector, "4");
  const text = current.textContent;
  await user.selectOptions(await within(old).findByRole("combobox", { name: "Retained LDS checkpoint" }), "2");
  await user.click(workbench.getByRole("button", { name: "Lane 1 active" }));
  await user.click(workbench.getByRole("button", { name: "Reverse one semantic event" }));
  expect(current.textContent).toBe(text);
  const oldText = old.textContent;
  await user.selectOptions(selector, "1"); expect(old.textContent).toBe(oldText);
  expect(within(current).queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(within(old).getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
});
