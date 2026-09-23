import { describe, expect, it } from "vitest";
import { buildOrderedRoleLiveness as build, ORDERED_ROLE_LIVENESS_LIMITS } from "../src/content/ordered-role-liveness.mjs";
const word = (op: number, destination: 3 | 4, left: number, right = 0) => op | ((destination - 3) << 3) | (left << 4) | (right << 7);
const input = (descriptors = [8, 201]) => ({ descriptors, inputValueIds: [10, 20, 30], resultValueId: 40, coordinate: [2, 3, 4], rawBlockId: 7 });
describe("synthetic finite-region logical def/use math, not physical allocator replay", () => {
  it("keeps half-open boundary intervals and real input/result IDs distinct from derived versions", () => {
    const model = build(input());
    expect(model.boundaries.map(row => row.live)).toEqual([["input0", "input1"], ["input1", "definition:0"], ["definition:1"]]);
    expect(model.liveIn).toEqual(["input0", "input1"]); expect(model.liveOut).toEqual(["definition:1"]);
    expect(model.values.map(row => [row.key, row.bornBoundary, row.endBoundaryExclusive])).toEqual([
      ["input0", 0, 1], ["input1", 0, 2], ["input2", 0, 0], ["definition:0", 1, 2], ["definition:1", 2, 3],
    ]);
    expect(model.values.slice(0, 3).map(row => row.canonicalInputSsa)).toEqual([10, 20, 30]);
    expect(model.values[3]).toMatchObject({ canonicalInputSsa: null, canonicalResultSsa: null, lastReadStep: 1, overwrittenAtStep: 1 });
    expect(model.values[4]).toMatchObject({ canonicalInputSsa: null, canonicalResultSsa: 40, returned: true });
    expect(model.coordinate).toEqual([2, 3, 4]); expect(model.rawBlockId).toBe(7);
  });
  it("separates live boundary count, operand/write footprint and transient union", () => {
    const model = build(input());
    expect(model.peakBoundaryLive).toBe(2); expect(model.peakTransient).toBe(3);
    expect(model.steps.map(row => row.operandWriteCount)).toEqual([2, 3]);
    expect(model.steps.map(row => row.transientCount)).toEqual([3, 3]);
    expect(model.steps[0].transient).toContain("input1"); // Live through, but not this instruction's operand.
    expect(model.steps[0].operandWrite).not.toContain("input1");
  });
  it("retains overwritten unused definitions, without eliminating the input read that produced them", () => {
    const model = build(input([word(0, 4, 0), word(0, 4, 1)]));
    expect(model.values[3]).toMatchObject({ unused: true, bornBoundary: 1, endBoundaryExclusive: 1, overwrittenAtStep: 1 });
    expect(model.liveIn).toEqual(["input0", "input1"]);
    expect(model.boundaries[1].live).toEqual(["input1"]);
    expect(model.steps[0].transient).toContain("definition:0");
  });
  it("retains unused scratch writes and the output returned before the final instruction", () => {
    const model = build(input([word(0, 4, 0), word(0, 3, 1)]));
    expect(model.values[3]).toMatchObject({ returned: true, canonicalResultSsa: 40, bornBoundary: 1, endBoundaryExclusive: 3 });
    expect(model.values[4]).toMatchObject({ role: "scratch", unused: true, bornBoundary: 2, endBoundaryExclusive: 2 });
    expect(model.liveOut).toEqual(["definition:0"]);
    expect(model.steps[1].transient).toContain("definition:1");
  });
  it("keeps repeated operands while counting their single logical value once", () => {
    const model = build(input([word(1, 4, 0, 0)]));
    expect(model.steps[0].reads).toEqual(["input0", "input0"]);
    expect(model.values[0].readOperands).toEqual([{ step: 0, operand: 0 }, { step: 0, operand: 1 }]);
    expect(model.steps[0].operandWriteCount).toBe(2);
    expect(model.peakBoundaryLive).toBe(1); expect(model.peakTransient).toBe(2);
  });
  it("resolves both self-read operands before overwriting output", () => {
    const model = build(input([8, word(1, 4, 4, 4)]));
    expect(model.steps[1].reads).toEqual(["definition:0", "definition:0"]);
    expect(model.steps[1].writes).toBe("definition:1");
    expect(model.values[3].readOperands).toEqual([{ step: 1, operand: 0 }, { step: 1, operand: 1 }]);
    expect(model.boundaries[1].live).toEqual(["definition:0"]);
    expect(model.boundaries[2].live).toEqual(["definition:1"]);
  });
  it("tracks scratch versions independently through a later output move", () => {
    const model = build(input([word(0, 3, 0), word(1, 3, 3, 1), word(0, 4, 3)]));
    expect(model.steps.map(row => row.reads)).toEqual([["input0"], ["definition:0", "input1"], ["definition:1"]]);
    expect(model.values[3].overwrittenAtStep).toBe(1);
    expect(model.values[4].lastReadStep).toBe(2);
    expect(model.liveOut).toEqual(["definition:2"]);
  });
  it.each([0, 1, 2, 3, 4, 5])("handles admitted opcode %s without evaluating any bits", opcode => {
    const model = build(input([word(opcode, 4, 0, opcode === 0 ? 0 : 1)]));
    expect(model.steps[0].opcode).toBe(["move", "add", "subtract", "and", "or", "xor"][opcode]);
    expect(model.steps[0].reads).toHaveLength(opcode === 0 ? 1 : 2);
    expect(model).not.toHaveProperty("valuesBits");
  });
  it("accepts exactly sixteen instructions and keeps the derived roster bounded", () => {
    const model = build(input([8, ...Array(15).fill(201)]));
    expect(model.steps).toHaveLength(16); expect(model.values).toHaveLength(19); expect(model.boundaries).toHaveLength(17);
    expect(model.values[2]).toMatchObject({ role: "input2", unused: true });
    expect(model.values.some(row => row.role === "scratch")).toBe(false);
    expect(ORDERED_ROLE_LIVENESS_LIMITS).toEqual({ steps: 16, values: 19, boundaries: 17, operandSlots: 32 });
  });
  it.each([
    [], Array(17).fill(8), [1024], [-1], [1.5], [Number.NaN], [6], [7],
    [word(0, 4, 5)], [word(1, 4, 0, 5)], [word(0, 4, 0, 1)],
    [word(0, 4, 4)], [word(1, 4, 3, 0)], [word(0, 3, 0)],
  ].map(descriptors => ({ descriptors })))("refuses invalid or undefined descriptor roster $descriptors", ({ descriptors }) => {
    expect(() => build(input(descriptors))).toThrow();
  });
  it("refuses sparse arrays, duplicate SSA identities and widened or unknown input fields", () => {
    const sparse = input(); delete sparse.descriptors[0]; expect(() => build(sparse)).toThrow();
    const duplicate = input(); duplicate.inputValueIds[2] = duplicate.resultValueId;
    expect(() => build(duplicate)).toThrow();
    expect(() => build({ ...input(), rawBlockId: 8193 })).toThrow();
    expect(() => build({ ...input(), coordinate: [0, 1] })).toThrow();
    expect(() => build({ ...input(), inputValueIds: [1, 2, 3, 4] })).toThrow();
    expect(() => build({ ...input(), descriptors: [8], invented: true } as ReturnType<typeof input>)).toThrow();
  });
  it("copies before returning and deeply freezes every retained list", () => {
    const original = input(), model = build(original);
    original.descriptors[0] = 9; original.inputValueIds[0] = 8192; original.coordinate[0] = 8192;
    expect(model.steps[0].descriptor).toBe(8); expect(model.inputValueIds[0]).toBe(10); expect(model.coordinate[0]).toBe(2);
    expect(Object.isFrozen(model)).toBe(true); expect(Object.isFrozen(model.values[0].readOperands[0])).toBe(true);
    expect(Object.isFrozen(model.steps[0].reads)).toBe(true); expect(Object.isFrozen(model.boundaries[0].live)).toBe(true);
  });
});
