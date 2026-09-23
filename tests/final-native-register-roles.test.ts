import { describe, expect, it } from "vitest";
import { buildDeclaredRegisterUseGrid } from "../src/content/final-native-register-roles.mjs";

// Pure presentation controls only; none of these rows admits source or native bytes.
const plan = [4, 5, 0, 1, 2];
const steps = () => [
  { output: 4, inputs: [0, 1], fileOffset: 96 },
  { output: 4, inputs: [4, 2], fileOffset: 100 },
  { output: 5, inputs: [1, 4], fileOffset: 104 },
];

describe("bounded declared register role / static use projection", () => {
  it("preserves role ownership and distinguishes read, write and read-write cells", () => {
    const grid = buildDeclaredRegisterUseGrid(plan, steps());
    expect(grid.interpretation).toBe("static_explicit_instruction_uses_only");
    expect(grid.declaredHighWater).toBe(6);
    expect(grid.instructionOffsets).toEqual([96, 100, 104]);
    expect(grid.roles).toEqual([
      { role: "scratch", register: 4, uses: ["write", "read-write", "read"] },
      { role: "output", register: 5, uses: ["none", "none", "write"] },
      { role: "input0", register: 0, uses: ["read", "none", "none"] },
      { role: "input1", register: 1, uses: ["read", "none", "read"] },
      { role: "input2", register: 2, uses: ["none", "read", "none"] },
    ]);
    expect(grid.roles.some(role => role.register === 3)).toBe(false);
    expect(Object.isFrozen(grid)).toBe(true);
    expect(Object.isFrozen(grid.instructionOffsets)).toBe(true);
    expect(Object.isFrozen(grid.roles)).toBe(true);
    for (const role of grid.roles) {
      expect(Object.isFrozen(role)).toBe(true); expect(Object.isFrozen(role.uses)).toBe(true);
    }
  });

  it("keeps synthetic unused declared roles and collapses repeated reads into one cell", () => {
    const unused = buildDeclaredRegisterUseGrid(plan, [{ output: 5, inputs: [0, 0], fileOffset: 96 }]);
    expect(unused.roles).toHaveLength(5);
    expect(unused.roles[0]).toEqual({ role: "scratch", register: 4, uses: ["none"] });
    expect(unused.roles[2]).toEqual({ role: "input0", register: 0, uses: ["read"] });
    expect(unused.roles[3].uses).toEqual(["none"]);
    expect(unused.roles[4].uses).toEqual(["none"]);
    expect(unused.declaredHighWater).toBe(6);
    expect(Object.keys(unused).sort()).toEqual(["declaredHighWater", "instructionOffsets", "interpretation", "roles"]);
  });

  it("copies bounded primitives rather than retaining mutable caller arrays", () => {
    const registers = [...plan], instructions = steps();
    const grid = buildDeclaredRegisterUseGrid(registers, instructions);
    registers[0] = 63; instructions[0].inputs[0] = 2; instructions[0].fileOffset = 400;
    expect(grid.roles[0].register).toBe(4);
    expect(grid.roles[2].uses[0]).toBe("read");
    expect(grid.instructionOffsets[0]).toBe(96);
  });

  it("refuses invalid plans, undeclared reads and writes to an input-only role", () => {
    for (const invalid of [[4, 5, 0, 1, 1], [4, 5, 0, 1], [64, 5, 0, 1, 2],
      [4, 5, 0, -1, 2], [4, 5, 0, 1.5, 2], Array<number>(5)]) {
      expect(() => buildDeclaredRegisterUseGrid(invalid, steps())).toThrow();
    }
    expect(() => buildDeclaredRegisterUseGrid(plan, [{ output: 5, inputs: [3], fileOffset: 96 }])).toThrow();
    expect(() => buildDeclaredRegisterUseGrid(plan, [{ output: 0, inputs: [1], fileOffset: 96 }])).toThrow();
    expect(() => buildDeclaredRegisterUseGrid(plan, [{ output: 5, inputs: [], fileOffset: 96 }])).toThrow();
    expect(() => buildDeclaredRegisterUseGrid(plan, [{ output: 5, inputs: [0, 1, 2], fileOffset: 96 }])).toThrow();
  });

  it("enforces instruction count, field closure, exact offsets and whole-payload bounds", () => {
    expect(() => buildDeclaredRegisterUseGrid(plan, [])).toThrow();
    expect(() => buildDeclaredRegisterUseGrid(plan, Array.from({ length: 17 },
      (_, index) => ({ output: 5, inputs: [0], fileOffset: 4 * index })))).toThrow();
    expect(() => buildDeclaredRegisterUseGrid(plan, Array<ReturnType<typeof steps>[number]>(1))).toThrow();
    const gaps = steps(); gaps[1].fileOffset++;
    expect(() => buildDeclaredRegisterUseGrid(plan, gaps)).toThrow();
    expect(() => buildDeclaredRegisterUseGrid(plan, [{ output: 5, inputs: [0], fileOffset: 65533 }])).toThrow();
    expect(() => buildDeclaredRegisterUseGrid(plan, [{ output: 5, inputs: [0], fileOffset: NaN }])).toThrow();
    const extra = { output: 5, inputs: [0], fileOffset: 96, runtimeValue: 123 };
    expect(() => buildDeclaredRegisterUseGrid(plan, [extra])).toThrow();
    expect(buildDeclaredRegisterUseGrid(plan,
      Array.from({ length: 16 }, (_, index) => ({ output: 5, inputs: [0], fileOffset: 4 * index }))).roles[0].uses)
      .toHaveLength(16);
  });
});
