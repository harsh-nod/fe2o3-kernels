import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FinalNativeRegisterRoles } from "../src/components/FinalNativeRegisterRoles";
import { buildDeclaredRegisterUseGrid } from "../src/content/final-native-register-roles.mjs";

// These are synthetic presentation inputs, not new accepted native observations.
const grid = (offset = 96) => buildDeclaredRegisterUseGrid([4, 5, 0, 1, 2], [
  { output: 4, inputs: [0, 1], fileOffset: offset },
  { output: 4, inputs: [4, 2], fileOffset: offset + 4 },
  { output: 5, inputs: [1, 4], fileOffset: offset + 8 },
]);
afterEach(() => { vi.unstubAllGlobals(); });

describe("declared role versus static instruction-use grid", () => {
  it("shows distinct named roles and non-color use cells with honest unavailable semantics", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    render(<FinalNativeRegisterRoles grid={grid()} />);
    const table = screen.getByRole("table", { name: "Declared VGPR roles by retained instruction" });
    expect(within(table).getAllByRole("button")).toHaveLength(5);
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    expect(within(table).getByText("Read + write")).toBeInTheDocument();
    expect(within(table).getByText("Payload offset 96")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inspect VGPR3" })).not.toBeInTheDocument();
    expect(screen.getByText(/no runtime mask is displayed/u)).toBeInTheDocument();
    expect(screen.getByText(/do not establish live ranges/u)).toBeInTheDocument();
    expect(screen.getByText(/No explicit use does not mean free/u)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("supports keyboard role selection and drops selection immediately on a new case grid", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FinalNativeRegisterRoles grid={grid()} />);
    const scratch = screen.getByRole("button", { name: "Inspect VGPR4 scratch" });
    scratch.focus(); await user.keyboard(" ");
    expect(scratch).toHaveFocus(); expect(scratch).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/instruction 2: read \+ write/u)).toBeInTheDocument();
    rerender(<FinalNativeRegisterRoles grid={grid(200)} />);
    expect(screen.getByRole("button", { name: "Inspect VGPR4 scratch" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Select a declared role to highlight its static uses.")).toBeInTheDocument();
    expect(screen.queryByText("Payload offset 96")).not.toBeInTheDocument();
    expect(screen.getByText("Payload offset 200")).toBeInTheDocument();
  });

  it("retains synthetic declared-but-unused roles without treating them as free", async () => {
    const user = userEvent.setup();
    const unused = buildDeclaredRegisterUseGrid([4, 5, 0, 1, 2],
      [{ output: 5, inputs: [0], fileOffset: 96 }]);
    render(<FinalNativeRegisterRoles grid={unused} />);
    await user.click(screen.getByRole("button", { name: "Inspect VGPR4 scratch" }));
    expect(screen.getByText(/declared, with no explicit uses in this selected region/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inspect VGPR2 input2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /step|continue|run|compile|free/u })).not.toBeInTheDocument();
  });
});
