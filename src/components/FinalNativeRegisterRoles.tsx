import { useState } from "react";
import type { DeclaredRegisterUseGrid, StaticRegisterUse } from "../content/final-native-register-roles.mjs";
import "./FinalNativeRegisterRoles.css";

const USE_LABELS: Record<StaticRegisterUse, string> = {
  none: "No explicit use", read: "Read", write: "Write", "read-write": "Read + write",
};

export function FinalNativeRegisterRoles({ grid }: { grid: DeclaredRegisterUseGrid }) {
  const [selection, setSelection] = useState<{ grid: DeclaredRegisterUseGrid; register: number } | null>(null);
  const selected = selection?.grid === grid
    ? grid.roles.find(role => role.register === selection.register) : undefined;
  return <section className="final-native-register-roles" aria-label="Declared register roles and static uses">
    <p>Declared roles → static instruction uses. Explicit reads and writes follow the closed instruction profile,
      whose physical operands were checked against the retained native report and payload bytes.</p>
    <div className="final-native-scroll">
      <table aria-label="Declared VGPR roles by retained instruction">
        <caption>Five declared VGPR roles, not a live register map</caption>
        <thead><tr><th scope="col">Declared role</th>
          {grid.instructionOffsets.map((offset, index) => <th scope="col" key={offset}>
            Instruction {index + 1}<span className="final-native-register-offset">Payload offset {offset}</span>
          </th>)}
        </tr></thead>
        <tbody>{grid.roles.map(role => <tr key={role.register} data-selected={selected?.register === role.register}>
          <th scope="row"><button type="button" aria-pressed={selected?.register === role.register}
            aria-label={"Inspect VGPR" + role.register + " " + role.role}
            onClick={() => setSelection(selected?.register === role.register ? null : { grid, register: role.register })}>
            <code>v{role.register}</code> {role.role}
          </button></th>
          {role.uses.map((use, index) => <td key={grid.instructionOffsets[index]} data-use={use}>
            {USE_LABELS[use]}
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <p aria-live="polite" className="final-native-register-selection">
      {selected ? <><code>v{selected.register}</code> ({selected.role}): {
        selected.uses.every(use => use === "none")
          ? "declared, with no explicit uses in this selected region."
          : selected.uses.map((use, index) => "instruction " + (index + 1) + ": " + USE_LABELS[use].toLowerCase()).join("; ") + "."
      }</> : "Select a declared role to highlight its static uses."}
    </p>
    <p>EXEC is reported as an implicit read by each instruction, with no implicit writes; no runtime mask is displayed.
      Registers absent from this role roster, including gaps below high-water {grid.declaredHighWater}, have no
      whole-kernel allocation status here. No explicit use does not mean free, dead, or uninitialized.</p>
    <p>These cells do not establish live ranges, dynamic values, instruction microsteps, occupancy, or physical-register lifetime safety.</p>
  </section>;
}
