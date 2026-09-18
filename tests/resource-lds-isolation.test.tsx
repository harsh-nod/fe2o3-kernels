import { webcrypto } from "node:crypto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import retainedUtf8 from "../examples/source_lds_resource_v1.json?raw";
import { ResourceLdsCaptureView } from "../src/components/ResourceLdsCaptureView";
import { DebuggerWorkbench } from "../src/components/DebuggerWorkbench";
import { debuggerWorkbenchFixture } from "../src/content/debugger-workbench";

afterEach(() => vi.unstubAllGlobals());
it("keeps a retained LDS selection independent of raw-KIR and the existing source example", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const user = userEvent.setup();
  render(<><DebuggerWorkbench fixture={debuggerWorkbenchFixture} /><ResourceLdsCaptureView
    retainedUtf8={retainedUtf8} expectedSha256="1d1ab41c25693745d233af08f856834d123f8abbb8888f418b1cf5db4a63b494" /></>);
  const selector = await screen.findByRole("combobox", { name: "Retained LDS checkpoint" });
  await user.selectOptions(selector, "2");
  const lds = screen.getByTestId("retained-lds-resource-example"), expected = lds.textContent;
  const source = screen.getByTestId("assembly-resource-example");
  await user.click(within(source).getByRole("button", { name: "Open assembly resource example" }));
  await user.click(screen.getByRole("button", { name: "Lane 1 active" }));
  await user.click(screen.getByRole("button", { name: "Reverse one semantic event" }));
  expect(lds.textContent).toBe(expected);
  expect(within(source).getByRole("group", { name: "Captured memory cells" })).toBeInTheDocument();
  await user.selectOptions(selector, "3");
  expect(within(source).getByRole("button", { name: "Byte offset 0, 1 byte, 0xd5, initialized" })).toBeInTheDocument();
});
