import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const lesson = readFileSync("docs/physical-lds-exchange-source-v22.md", "utf8");
const example = readFileSync("examples/physical-lds-exchange-v22.rs", "utf8");

it("retains the complete source-owned two-wave kernel without omitted instructions", () => {
  expect(createHash("sha256").update(example).digest("hex")).toBe("431e6ecad872f25925ba38b4ef6de6fb5537514261173aec33e51cd86577400b");
  expect(lesson).toContain(example.trimEnd().split("\n").map(line => "    " + line).join("\n"));
  const instructions = example.split("\n").filter(line => /^\s+(?:s_|v_|global_|ds_)\w+\(/u.test(line));
  expect(instructions).toHaveLength(32);
  expect(example.indexOf("s_waitcnt_lgkmcnt0();", example.indexOf("ds_write_b32"))).toBeLessThan(example.indexOf("s_barrier();"));
  expect(example.indexOf("s_barrier();")).toBeLessThan(example.indexOf("ds_read_b32"));
  expect(example.indexOf("global_load_dword")).toBeLessThan(example.indexOf("s_and_saveexec_b64"));
  expect(example).toContain("lds=static_u32_frame(0, 512, 4, 1)");
  expect(example).toContain("v_xor_b32_e32(v(17), v(0), 64)");
});

it("separates public wrappers, historical CPU recordings, static native and hardware claims", () => {
  for (const phrase of [
    "MIR39", "KIR22", "scripts/physical-lds-exchange-source-v22.mjs",
    "scripts/physical-lds-exchange-checked-v22.mjs", "LLVM remains in the pipeline",
    "38 commands / 57 stages", "51 exact negative stages", "sourceR7-derived",
    "physical-lds-recorded-debug-v22.md", "128 invocations must participate",
    "not GPU execution", "runtime-condition", "milestones remain open",
  ]) expect(lesson).toContain(phrase);
  expect(lesson).toContain("ff49f53944d9e546cd738b0f38848ff2fc815e45b9ab460720ef6f35a7240aca");
});
