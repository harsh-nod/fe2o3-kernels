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
  const selector = await screen.findByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
  await user.selectOptions(selector, "4");
  const current = screen.getByTestId("retained-lds-multi-workgroup-example"), text = current.textContent;
  await user.selectOptions(await screen.findByRole("combobox", { name: "Retained LDS checkpoint" }), "2");
  await user.click(screen.getByRole("button", { name: "Lane 1 active" }));
  await user.click(screen.getByRole("button", { name: "Reverse one semantic event" }));
  expect(current.textContent).toBe(text);
  const old = screen.getByTestId("retained-lds-resource-example"), oldText = old.textContent;
  await user.selectOptions(selector, "1"); expect(old.textContent).toBe(oldText);
  expect(within(current).queryByRole("group", { name: "Captured memory cells" })).not.toBeInTheDocument();
  expect(within(old).getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
});
