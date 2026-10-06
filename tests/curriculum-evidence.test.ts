import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { lessons } from "../src/content/curriculum";
import type { Lesson } from "../src/content/model";
import { projectCurriculumTab, sourceItemContractSha256, validateCurriculumEvidence, validateCurriculumSourcePin } from "../scripts/curriculum-evidence";

function fixture(current: readonly Lesson[] = lessons) {
  return {
    schema: "fe2o3-tutorial-kernel-source-contract-v1",
    entries: current.map((lesson) => ({
      lessonId: lesson.id,
      sourcePaths: lesson.tabs.flatMap((tab) => tab.kind === "kernel" && tab.language === "rust" && tab.sourcePath ? [tab.sourcePath] : []),
      compilerFixtureIds: [] as string[],
    })),
    compilerFixtures: [] as { fixtureId: string; compilerInput: { sourcePaths: string[] } }[],
    curriculum: {
      schema: "fe2o3-tutorial-curriculum-obligations-v1",
      site: { repository: "harsh-nod/fe2o3-kernels", commit: "a".repeat(40), tree: "b".repeat(40) },
      status: "pending",
      lessons: current.map((lesson, index) => ({
        lessonId: lesson.id,
        role: "executable",
        roleReason: "Fixture source obligation",
        sourceEntryIds: [lesson.id],
        sourceBindingGap: null as string | null,
        variants: (index === 0 ? ["simt", "tile", "mixed"] : ["simt", "tile"]).map((kind) => ({
          kind, status: "pending", sourceItems: [] as string[], reason: "Source implementation pending",
        })),
        codeTabs: lesson.tabs.map((tab, ordinal) => ({
          ...projectCurriculumTab(tab, ordinal),
          sourceItem: null as unknown,
          sourceItemStatus: tab.kind === "kernel" && tab.language === "rust" ? "pending" : "not-applicable",
        })),
      })),
    },
  };
}

function encoded(value: unknown) {
  const bytes = Buffer.from(JSON.stringify(value));
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}

function validate(value: unknown, current: readonly Lesson[] = lessons) {
  const { bytes, sha256 } = encoded(value);
  return validateCurriculumEvidence(bytes, sha256, current);
}

function sourceDriverFixture() {
  const current = structuredClone(lessons);
  const fragments = ["#[kernel]\npub fn first() {}\n", "#[kernel]\npub fn second() {}\n"];
  current[0].tabs[0] = {
    kind: "kernel", label: "Kernel", language: "rust", code: fragments.join("\n\n"),
    sourcePath: "crates/source-fixture/src/lib.rs", sourceCommit: "a".repeat(40),
    sourceDigestScope: "displayed", sourceFragments: fragments,
    sourceSha256: createHash("sha256").update(fragments.join("\n\n")).digest("hex"),
  };
  const manifest = fixture(current);
  manifest.curriculum.schema = "fe2o3-tutorial-curriculum-obligations-v2";
  const item = {
    kind: "source-driver",
    compilerInput: {
      packageManifest: "crates/source-fixture/Cargo.toml", packageManifestSha256: "a".repeat(64),
      cargoLockPath: "Cargo.lock", cargoLockSha256: "b".repeat(64),
      sourcePaths: [current[0].tabs[0].sourcePath], sourceClosureSha256: "c".repeat(64),
      cargoTarget: { kind: "lib", name: "source_fixture", sourcePath: "src/lib.rs" },
      defaultFeatures: false,
    },
    driver: { package: "source-driver", target: "source_test", path: "crates/source-driver/tests/source_test.rs" },
    sourceRanges: [
      { byteOffset: 100, byteLength: Buffer.byteLength(fragments[0]) },
      { byteOffset: 0, byteLength: Buffer.byteLength(fragments[1]) },
    ],
    cases: [
      { features: ["first"], kernelSymbol: "first", target: "gfx942", displayedFragmentOrdinal: 0, testFunction: "source_test",
        expectation: { kind: "verified-bundle-export", bundleVersion: 1 } },
      { features: ["second"], kernelSymbol: "second", target: "gfx950", displayedFragmentOrdinal: 1, testFunction: "refusal_test",
        expectation: { kind: "rejected", bundleVersion: 4, diagnosticContains: "specific source refusal", outputArtifact: "absent" } },
    ],
    contractSha256: "",
  };
  const retained = manifest.curriculum.lessons[0].codeTabs[0];
  retained.sourceItem = item;
  retained.sourceItemStatus = "contract-bound";
  const repin = () => { item.contractSha256 = sourceItemContractSha256(current[0].id, current[0].tabs[0], 0, item); };
  repin();
  return { current, manifest, item, repin };
}

function wholeFileSourceDriverFixture() {
  const value = sourceDriverFixture();
  const tab = value.current[0].tabs[0];
  tab.code = `// retained header: \u03bb\n${tab.code}`;
  tab.sourceDigestScope = "file";
  tab.sourceCommit = "d".repeat(40);
  delete tab.sourceFragments;
  tab.sourceSha256 = createHash("sha256").update(tab.code).digest("hex");
  value.item.sourceRanges = [{ byteOffset: 0, byteLength: Buffer.byteLength(tab.code) }];
  value.item.cases.forEach((row) => { row.displayedFragmentOrdinal = 0; });
  const repin = () => {
    Object.assign(value.manifest.curriculum.lessons[0].codeTabs[0], projectCurriculumTab(tab, 0));
    value.repin();
  };
  repin();
  return { ...value, tab, repin };
}



function originalCpuSourceDriverFixture() {
  const value = wholeFileSourceDriverFixture();
  const previousPath = value.tab.sourcePath;
  value.tab.kind = "host";
  value.tab.label = "Host";
  value.tab.sourcePath = "crates/source-fixture/src/main.rs";
  value.tab.code = '#![cfg_attr(target_arch = "amdgpu", no_std)]\n#[kernel(typed)]\npub fn first() {}\n';
  value.tab.sourceSha256 = createHash("sha256").update(value.tab.code).digest("hex");
  value.item.compilerInput.sourcePaths = [value.tab.sourcePath];
  value.item.compilerInput.cargoTarget = { kind: "bin", name: "source-fixture", sourcePath: "src/main.rs" };
  value.manifest.entries[0].sourcePaths = value.manifest.entries[0].sourcePaths.map((path) =>
    path === previousPath ? value.tab.sourcePath! : path);
  value.item.sourceRanges = [{ byteOffset: 0, byteLength: Buffer.byteLength(value.tab.code) }];
  value.item.cases.splice(1);
  const driver: Record<string, unknown> = {
    package: "source-driver", target: "lib", path: "crates/source-driver/src/source_cpu_tests.rs",
    testFilter: "source_driver::source_test",
  };
  const expectation: Record<string, unknown> = {
    kind: "original-source-cpu", tileLayout: "blocked",
    requestPath: "config/cpu/request.json", requestSha256: "1".repeat(64), requestBytes: 123,
    expectationPath: "config/cpu/expectation.json", expectationSha256: "2".repeat(64), expectationBytes: 456,
  };
  Reflect.set(value.item, "driver", driver);
  Reflect.set(value.item.cases[0], "expectation", expectation);
  value.repin();
  return { ...value, driver, expectation };
}

describe("V2 original-source CPU contracts", () => {
  it("binds an explicit host binary and exact library driver without qualification", () => {
    for (const layout of ["blocked", "striped"]) {
      const value = originalCpuSourceDriverFixture();
      value.expectation.tileLayout = layout;
      value.repin();
      const before = structuredClone(value.manifest);
      expect(validate(value.manifest, value.current).status).toBe("pending");
      expect(value.manifest).toEqual(before);
      expect(value.manifest.curriculum.lessons[0].codeTabs[0].sourceItemStatus).toBe("contract-bound");
      expect(value.manifest.curriculum.lessons[0].variants.every((variant) =>
        variant.status === "pending" && variant.sourceItems.length === 0)).toBe(true);
    }
  });

  it("keeps legacy integration drivers and kernel library CPU contracts separate", () => {
    const value = originalCpuSourceDriverFixture();
    value.tab.kind = "kernel";
    const previousPath = value.tab.sourcePath;
    value.tab.sourcePath = "crates/source-fixture/src/lib.rs";
    value.manifest.entries[0].sourcePaths = value.manifest.entries[0].sourcePaths.map((path) =>
      path === previousPath ? value.tab.sourcePath! : path);
    value.item.compilerInput.cargoTarget = { kind: "lib", name: "source_fixture", sourcePath: "src/lib.rs" };
    value.item.compilerInput.sourcePaths = [value.tab.sourcePath];
    value.repin();
    expect(validate(value.manifest, value.current).status).toBe("pending");
    Reflect.deleteProperty(value.driver, "testFilter");
    value.driver.target = "source_test";
    value.driver.path = "crates/source-driver/tests/source_test.rs";
    value.repin();
    expect(validate(value.manifest, value.current).status).toBe("pending");
    const legacy = sourceDriverFixture();
    expect(validate(legacy.manifest, legacy.current).status).toBe("pending");
  });

  it("rejects incomplete or malformed CPU pins even after repinning the contract", () => {
    for (const key of Object.keys(originalCpuSourceDriverFixture().expectation)) {
      const value = originalCpuSourceDriverFixture();
      delete value.expectation[key];
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
    const mutants: Record<string, unknown[]> = {
      kind: ["verified-bundle-export", "original-source-cpu-v2", null],
      tileLayout: ["Blocked", "unknown", true],
      requestPath: ["/absolute", "../escape", "a/../b", "a//b", "a\\b", "C:/drive", ""],
      expectationPath: ["./input", "a/\u0000", false],
      requestSha256: ["a".repeat(63), "A".repeat(64), true],
      expectationSha256: ["z".repeat(64), null],
      requestBytes: [0, -1, 1.5, true, "1", 16 * 1024 * 1024 + 1],
      expectationBytes: [0, null, 16 * 1024 * 1024 + 1],
    };
    for (const [key, values] of Object.entries(mutants)) for (const mutant of values) {
      const value = originalCpuSourceDriverFixture();
      value.expectation[key] = mutant;
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
    for (const extra of [{ qualified: true }, { bundleVersion: 6 }, { authority: "source_authenticated" }]) {
      const value = originalCpuSourceDriverFixture();
      Object.assign(value.expectation, extra);
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow("missing or unknown fields");
    }
  });

  it("refuses substituted drivers, binary identities and non-CPU host contracts", () => {
    for (const [key, values] of Object.entries({
      target: ["source_test", "bin", null], path: ["crates/source-driver/tests/source_test.rs",
        "crates/other/src/source_cpu_tests.rs", "crates/source-driver/src/../source_cpu_tests.rs"],
      testFilter: ["source_test", "module::other", "module::*", null, "a".repeat(4097)],
    })) for (const mutant of values) {
      const value = originalCpuSourceDriverFixture();
      value.driver[key] = mutant;
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
    for (const mutant of [
      { kind: "lib", name: "source_fixture", sourcePath: "src/lib.rs" },
      { kind: "bin", name: "../other", sourcePath: "src/main.rs" },
      { kind: "bin", name: "source-fixture", sourcePath: "../main.rs" },
    ]) {
      const value = originalCpuSourceDriverFixture();
      value.item.compilerInput.cargoTarget = mutant;
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
    for (const host of [false, true]) {
      const value = wholeFileSourceDriverFixture();
      if (host) value.tab.kind = "host";
      else value.item.compilerInput.cargoTarget.kind = "bin";
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
  });

  it("binds request and oracle identities and does not accept stale source digests", () => {
    for (const [key, field] of Object.entries({ requestSha256: "3".repeat(64),
      expectationSha256: "4".repeat(64), tileLayout: "striped" })) {
      const value = originalCpuSourceDriverFixture();
      value.expectation[key] = field;
      expect(() => validate(value.manifest, value.current)).toThrow("contract digest differs");
      value.repin();
      expect(validate(value.manifest, value.current).status).toBe("pending");
    }
    const value = originalCpuSourceDriverFixture();
    value.tab.code += "// unpinned source change\n";
    value.item.sourceRanges[0].byteLength = Buffer.byteLength(value.tab.code);
    value.repin();
    expect(() => validate(value.manifest, value.current)).toThrow("whole-file display differs");
  });
});
function diagnosticSourceDriverFixture(orders = ["blocked", "striped"], wholeFile = false) {
  const value = wholeFile ? wholeFileSourceDriverFixture() : sourceDriverFixture();
  const expectation: Record<string, unknown> = {
    kind: "diagnostic-kir-export-v1", canonicalKirVersion: 18,
    diagnosticTileOrders: orders, authority: "observation_only",
  };
  Reflect.set(value.item.cases[0], "expectation", expectation);
  value.repin();
  return { ...value, expectation };
}

describe("V2 diagnostic KIR source-driver expectations", () => {
  it("accepts only observation-only V18 source contracts without qualification", () => {
    for (const orders of [["blocked"], ["striped"], ["blocked", "striped"]]) {
      for (const wholeFile of [false, true]) {
        const value = diagnosticSourceDriverFixture(orders, wholeFile);
        const before = structuredClone(value.manifest);
        expect(validate(value.manifest, value.current)).toEqual({ lessons: 56, codeTabs: 314, status: "pending" });
        expect(value.manifest).toEqual(before);
        expect(value.manifest.curriculum.lessons[0].codeTabs[0].sourceItemStatus).toBe("contract-bound");
        expect(value.manifest.curriculum.lessons[0].variants.every((variant) =>
          variant.status === "pending" && variant.sourceItems.length === 0)).toBe(true);
      }
    }
  });

  it("preserves exact legacy bundle V1 through V6 and refuses diagnostic fields there", () => {
    for (const bundleVersion of [1, 2, 3, 4, 5, 6]) {
      const value = sourceDriverFixture();
      value.item.cases.forEach((row) => { row.expectation.bundleVersion = bundleVersion; });
      value.repin();
      expect(validate(value.manifest, value.current).status).toBe("pending");
    }
    for (const ordinal of [0, 1]) {
      for (const bundleVersion of [0, 7, 18, true, "1", 1.5, null]) {
        const value = sourceDriverFixture();
        Reflect.set(value.item.cases[ordinal].expectation, "bundleVersion", bundleVersion);
        value.repin();
        expect(() => validate(value.manifest, value.current)).toThrow("bundleVersion must be a bounded integer");
      }
      for (const [key, field] of Object.entries({
        canonicalKirVersion: 18, diagnosticTileOrders: ["blocked"], authority: "observation_only",
      })) {
        const value = sourceDriverFixture();
        Reflect.set(value.item.cases[ordinal].expectation, key, field);
        value.repin();
        expect(() => validate(value.manifest, value.current)).toThrow("missing or unknown fields");
      }
    }
  });

  it("rejects missing, additional and malformed expectation shapes after repinning", () => {
    for (const key of ["kind", "canonicalKirVersion", "diagnosticTileOrders", "authority"]) {
      const value = diagnosticSourceDriverFixture();
      Reflect.deleteProperty(value.expectation, key);
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
    for (const additional of [
      { bundleVersion: 1 }, { bundleVersion: 18 }, { qualified: true },
      { outputArtifact: "present" }, { diagnosticContains: "text" },
    ]) {
      const value = diagnosticSourceDriverFixture();
      Object.assign(value.expectation, additional);
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow("missing or unknown fields");
    }
    for (const shape of [undefined, null, true, [], "diagnostic-kir-export-v1"]) {
      const value = diagnosticSourceDriverFixture();
      Reflect.set(value.item.cases[0], "expectation", shape);
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
  });

  it("rejects every version, order or authority substitution even with a new digest", () => {
    const invalid: Record<string, unknown[]> = {
      kind: [true, null, "diagnostic-kir-export-v2", "verified-bundle-export", "rejected"],
      canonicalKirVersion: [true, false, null, "18", 17, 19, 18.5, -18],
      diagnosticTileOrders: [
        [], null, true, "blocked", ["blocked", "blocked"], ["striped", "striped"],
        ["striped", "blocked"], ["blocked", "striped", "blocked"], ["unknown"],
        ["Blocked"], ["blocked "], ["blocked", 1], [true], [["blocked"]],
      ],
      authority: [true, null, "observation-only", "source_authenticated", "verified", "qualified", "native"],
    };
    for (const [key, fields] of Object.entries(invalid)) {
      for (const field of fields) {
        const value = diagnosticSourceDriverFixture();
        value.expectation[key] = field;
        value.repin();
        expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
      }
    }
  });

  it("binds valid order changes and expectation kind changes into the source digest", () => {
    for (const orders of [["blocked"], ["striped"]]) {
      const value = diagnosticSourceDriverFixture();
      value.expectation.diagnosticTileOrders = orders;
      expect(() => validate(value.manifest, value.current)).toThrow("contract digest");
    }
    const value = diagnosticSourceDriverFixture();
    Reflect.set(value.item.cases[0], "expectation", { kind: "verified-bundle-export", bundleVersion: 1 });
    expect(() => validate(value.manifest, value.current)).toThrow("contract digest");
  });

  it("cannot promote diagnostic metadata into execution or attach it to conceptual content", () => {
    for (const mutate of [
      (value: ReturnType<typeof diagnosticSourceDriverFixture>) => { value.manifest.curriculum.status = "qualified"; },
      (value: ReturnType<typeof diagnosticSourceDriverFixture>) => { value.manifest.curriculum.lessons[0].variants[0].status = "qualified"; },
      (value: ReturnType<typeof diagnosticSourceDriverFixture>) => { value.manifest.curriculum.lessons[0].variants[0].sourceItems = ["diagnostic"]; },
      (value: ReturnType<typeof diagnosticSourceDriverFixture>) => { value.manifest.curriculum.lessons[0].codeTabs[0].sourceItemStatus = "qualified"; },
      (value: ReturnType<typeof diagnosticSourceDriverFixture>) => { value.manifest.curriculum.lessons[0].role = "conceptual"; },
    ]) {
      const value = diagnosticSourceDriverFixture();
      mutate(value);
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
  });


  it("rejects non-integer raw tokens despite valid blob and normalized source digests", () => {
    for (const kindLast of [false, true]) {
      const value = diagnosticSourceDriverFixture();
      if (kindLast) {
        const kind = value.expectation.kind;
        Reflect.deleteProperty(value.expectation, "kind");
        value.expectation.kind = kind;
        value.repin();
      }
      const text = encoded(value.manifest).bytes.toString("utf8");
      const token = '"canonicalKirVersion":18';
      expect(text.split(token)).toHaveLength(2);
      for (const replacement of [
        '"canonicalKirVersion":18.0',
        '"canonicalKirVersion":18e0',
        '"canonicalKirVersion":1.8e1',
        '"canonicalKir\\u0056ersion":18.0',
        '"canonicalKirVersion":18,"canonicalKirVersion":18e0',
      ]) {
        const raw = text.replace(token, replacement);
        expect(JSON.parse(raw)).toEqual(value.manifest);
        const bytes = Buffer.from(raw, "utf8");
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        expect(() => validateCurriculumEvidence(bytes, sha256, value.current))
          .toThrow("diagnostic canonicalKirVersion must use the JSON integer token 18");
      }
    }
  });

  it("refuses diagnostic expectations without source context while preserving legacy parsing", () => {
    const diagnostic = diagnosticSourceDriverFixture();
    const legacy = sourceDriverFixture();
    const parse = JSON.parse;
    const withoutSource = vi.spyOn(JSON, "parse").mockImplementation((text, reviver) =>
      parse(text, reviver ? function (this: unknown, key: string, value: unknown) {
        return reviver.call(this, key, value);
      } : undefined));
    try {
      expect(() => validate(diagnostic.manifest, diagnostic.current))
        .toThrow("diagnostic canonicalKirVersion requires JSON.parse source context");
      expect(validate(legacy.manifest, legacy.current).status).toBe("pending");
    } finally {
      withoutSource.mockRestore();
    }
  });

  it("keeps V1 and unknown curriculum schemas from admitting diagnostic source items", () => {
    for (const schema of ["fe2o3-tutorial-curriculum-obligations-v1", "fe2o3-tutorial-curriculum-obligations-v3"]) {
      const value = diagnosticSourceDriverFixture();
      value.manifest.curriculum.schema = schema;
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
  });
});

describe("V2 whole-file source-driver contracts", () => {
  it("retains the complete header and UTF-8 bytes without qualifying historical source", () => {
    const { current, manifest, item, tab } = wholeFileSourceDriverFixture();
    expect(tab.code).toMatch(/^\/\/ retained header:/u);
    expect(item.sourceRanges).toEqual([{ byteOffset: 0, byteLength: Buffer.byteLength(tab.code) }]);
    expect(Buffer.byteLength(tab.code)).toBeGreaterThan(tab.code.length);
    expect(tab.sourceCommit).not.toBe(manifest.curriculum.site.commit);
    expect(validate(manifest, current)).toEqual({ lessons: 56, codeTabs: 314, status: "pending" });
  });

  it("rejects incomplete ranges and mixed or stale identities even after repinning", () => {
    for (const mutate of [
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.item.sourceRanges[0].byteOffset = 1; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.item.sourceRanges[0].byteLength--; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.item.sourceRanges[0].byteLength++; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => {
        const headerBytes = Buffer.byteLength(value.tab.code.slice(0, value.tab.code.indexOf("\n") + 1));
        value.item.sourceRanges[0].byteOffset = headerBytes;
        value.item.sourceRanges[0].byteLength -= headerBytes;
      },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.item.sourceRanges.push({ ...value.item.sourceRanges[0] }); },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.item.sourceRanges = []; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.tab.sourceFragments = [value.tab.code]; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.tab.sourceFragments = []; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { Reflect.set(value.tab, "sourceFragments", null); },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.tab.sourceSha256 = "0".repeat(64); },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { delete value.tab.sourceSha256; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.tab.sourceCommit = "not-a-commit"; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { delete value.tab.sourceCommit; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.tab.code = value.tab.code.slice(value.tab.code.indexOf("\n") + 1); },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { value.item.cases[0].displayedFragmentOrdinal = 1; },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => { Reflect.set(value.item.sourceRanges[0], "byteLength", true); },
      (value: ReturnType<typeof wholeFileSourceDriverFixture>) => {
        value.tab.code = "\ud800";
        value.tab.sourceSha256 = createHash("sha256").update(value.tab.code).digest("hex");
        value.item.sourceRanges[0].byteLength = Buffer.byteLength(value.tab.code);
      },
    ]) {
      const value = wholeFileSourceDriverFixture();
      mutate(value);
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
  });

  it("rejects substituted retained display hashes and byte counts", () => {
    for (const change of [{ displayedSha256: "0".repeat(64) }, { displayedUtf8Bytes: 1 }]) {
      const value = wholeFileSourceDriverFixture();
      Object.assign(value.manifest.curriculum.lessons[0].codeTabs[0], change);
      expect(() => validate(value.manifest, value.current)).toThrow("source/display binding differs");
    }
  });

  it("binds the rendered whole file instead of certifying pre-projection bytes", () => {
    const value = wholeFileSourceDriverFixture();
    value.tab.code = `#[kernel(\n    typed,\n    namespace = "${"a".repeat(64)}",\n)]\npub fn first() {}\n`;
    value.tab.sourceSha256 = createHash("sha256").update(value.tab.code).digest("hex");
    value.item.sourceRanges[0].byteLength = Buffer.byteLength(value.tab.code);
    value.item.cases = [value.item.cases[0]];
    value.repin();
    expect(() => validate(value.manifest, value.current)).toThrow("whole-file display differs");
  });

  it("does not admit whole-file source items under V1 or unknown schemas", () => {
    for (const schema of ["fe2o3-tutorial-curriculum-obligations-v1", "fe2o3-tutorial-curriculum-obligations-v3"]) {
      const value = wholeFileSourceDriverFixture();
      value.manifest.curriculum.schema = schema;
      expect(() => validate(value.manifest, value.current)).toThrow();
    }
  });
});

describe("V2 displayed source-driver contracts", () => {
  it("matches the Python canonical digest for DEL and supplementary Unicode", () => {
    expect(sourceItemContractSha256("unicode", {
      kind: "kernel", label: "\u007f\u{1f600}", language: "rust", code: "",
    }, 0, { kind: "source-driver", note: "\u007f\u{1f600}", contractSha256: "ignored" }))
      .toBe("8613b6b52a5e6ae7e898a53ac966f236a7612092f0b63582a21bc32cf3bdb764");
  });

  it("retains pending qualification with exact export/refusal rows and reversed source ranges", () => {
    const { current, manifest } = sourceDriverFixture();
    expect(validate(manifest, current)).toEqual({ lessons: 56, codeTabs: 314, status: "pending" });
  });

  it("preserves strict V1 and rejects unknown curriculum versions", () => {
    for (const schema of ["fe2o3-tutorial-curriculum-obligations-v1", "fe2o3-tutorial-curriculum-obligations-v3"]) {
      const { current, manifest } = sourceDriverFixture();
      manifest.curriculum.schema = schema;
      expect(() => validate(manifest, current)).toThrow();
    }
  });

  it("binds source metadata, feature selection, test and outcome into the digest", () => {
    for (const mutate of [
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].features = ["second"]; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].testFunction = "other_test"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].expectation.bundleVersion = 2; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[1].expectation.diagnosticContains = "refusal"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases.reverse(); },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.compilerInput.cargoLockSha256 = "d".repeat(64); },
    ]) {
      const value = sourceDriverFixture();
      mutate(value);
      expect(() => validate(value.manifest, value.current)).toThrow("contract digest");
    }
  });

  it("rejects malformed rows even after their digest is recomputed", () => {
    for (const mutate of [
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases = []; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[1].kernelSymbol = "first"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].features = ["first", "first"]; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].target = "gfx000"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].displayedFragmentOrdinal = 2; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].testFunction = "test --all"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].expectation.kind = "qualified"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[0].expectation.bundleVersion = 7; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[1].expectation.outputArtifact = "present"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.cases[1].expectation.diagnosticContains = ""; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.sourceRanges[0].byteOffset = 0; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.sourceRanges[0].byteLength--; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.sourceRanges.pop(); },
      (value: ReturnType<typeof sourceDriverFixture>) => { Reflect.set(value.item.cases[0].expectation, "bundleVersion", true); },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.compilerInput.sourcePaths = ["other.rs"]; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.item.driver.path = "unrelated.rs"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { Reflect.set(value.item, "qualified", true); },
    ]) {
      const value = sourceDriverFixture();
      mutate(value);
      value.repin();
      expect(() => validate(value.manifest, value.current)).toThrow(/^curriculum evidence:/u);
    }
  });

  it("cannot claim execution or attach a source driver to conceptual content", () => {
    for (const mutate of [
      (value: ReturnType<typeof sourceDriverFixture>) => { value.manifest.curriculum.lessons[0].codeTabs[0].sourceItemStatus = "qualified"; },
      (value: ReturnType<typeof sourceDriverFixture>) => { value.manifest.curriculum.lessons[0].role = "conceptual"; },
    ]) {
      const value = sourceDriverFixture();
      mutate(value);
      expect(() => validate(value.manifest, value.current)).toThrow();
    }
  });
});

describe("compiler-owned curriculum evidence", () => {
  it("binds every runtime lesson and ordered code tab without qualification", () => {
    expect(validate(fixture())).toEqual({ lessons: 56, codeTabs: 314, status: "pending" });
  });

  it("accepts a historical site snapshot without requiring current-site HEAD equality", () => {
    const manifest = fixture();
    manifest.curriculum.site.commit = "c".repeat(40);
    manifest.curriculum.site.tree = "d".repeat(40);
    expect(() => validate(manifest)).not.toThrow();
  });

  it("requires the exact pinned blob", () => {
    const { bytes, sha256 } = encoded(fixture());
    expect(() => validateCurriculumEvidence(bytes, "0".repeat(64), lessons)).toThrow("blob SHA256");
    expect(() => validateCurriculumEvidence(Buffer.concat([bytes, Buffer.from(" ")]), sha256, lessons)).toThrow("blob SHA256");
    expect(() => validateCurriculumEvidence(Buffer.alloc(4 * 1024 * 1024 + 1), sha256, lessons)).toThrow("byte bound");
  });

  it("rejects malformed UTF-8 even when its bytes match the pinned digest", () => {
    const bytes = Buffer.concat([Buffer.from('{"text":"'), Buffer.from([0xff]), Buffer.from('"}')]);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    expect(() => validateCurriculumEvidence(bytes, sha256, lessons)).toThrow(/encoded data|encoding|UTF-8/u);
  });

  it.each([undefined, null, [], {}, { schema: "other" }].map((value) => ({ value })))("rejects absent or malformed curriculum: $value", ({ value }) => {
    expect(() => validate({ ...fixture(), curriculum: value })).toThrow();
  });

  it("rejects missing, new, duplicated and reordered runtime lessons", () => {
    const manifest = fixture();
    for (const current of [
      lessons.slice(1),
      [...lessons, { ...lessons[0], id: "new-lesson" }],
      [lessons[0], ...lessons],
      [...lessons].reverse(),
    ]) expect(() => validate(manifest, current)).toThrow("ordered lesson coverage");
  });

  it("rejects missing, added and reordered code tabs", () => {
    const manifest = fixture();
    const lesson = lessons.find((candidate) => candidate.tabs.length > 1)!;
    for (const tabs of [lesson.tabs.slice(1), [...lesson.tabs, lesson.tabs[0]], [...lesson.tabs].reverse()]) {
      const current = lessons.map((candidate) => candidate.id === lesson.id ? { ...candidate, tabs } : candidate);
      expect(() => validate(manifest, current)).toThrow(/code-tab coverage|source\/display binding/u);
    }
  });

  it.each([
    "ordinal", "kind", "label", "language", "displayedUtf8Bytes", "displayedSha256",
    "sourcePath", "sourceCommit", "sourceSha256", "sourceDigestScope", "sourceFragmentsSha256",
    "explanatory", "evidenceId", "sourceItem", "sourceItemStatus",
  ])("rejects a missing explicit tab field: %s", (field) => {
    const manifest = fixture();
    Reflect.deleteProperty(manifest.curriculum.lessons[0].codeTabs[0], field);
    expect(() => validate(manifest)).toThrow("source/display binding");
  });

  it("rejects stale source metadata and display bytes", () => {
    const manifest = fixture();
    for (const changed of [
      { sourcePath: "changed.rs" }, { sourceCommit: "c".repeat(40) },
      { sourceSha256: "d".repeat(64) }, { sourceFragments: ["changed fragment"] },
      { explanatory: !lessons[0].tabs[0].explanatory },
      { code: `${lessons[0].tabs[0].code}\n// changed\n` },
    ]) {
      const current = structuredClone(lessons);
      Object.assign(current[0].tabs[0], changed);
      expect(() => validate(manifest, current)).toThrow(/source\/display binding|source-binding gap/u);
    }
  });

  it("uses exact author-facing UTF-8 rather than the unprojected source", () => {
    const current = structuredClone(lessons);
    current[0].tabs[0] = {
      kind: "kernel", language: "rust", label: "projection",
      code: `#[kernel(\n    typed,\n    namespace = "${"a".repeat(64)}",\n)]\npub fn fill() { /* \u03bb */ }`,
    };
    const manifest = fixture(current);
    const tab = manifest.curriculum.lessons[0].codeTabs[0];
    expect(tab.displayedUtf8Bytes).toBeLessThan(Buffer.byteLength(current[0].tabs[0].code));
    current[0].tabs[0].code = current[0].tabs[0].code.replace("a".repeat(64), "b".repeat(64));
    expect(() => validate(manifest, current)).not.toThrow();
    current[0].tabs[0].code += "\n";
    expect(() => validate(manifest, current)).toThrow("source/display binding");
  });

  it("cannot promote pending variants or source items to qualification", () => {
    for (const mutation of [
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.status = "qualified"; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].variants[0].status = "passed"; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].variants[0].sourceItems = ["unproven"]; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].codeTabs[0].sourceItem = "unproven"; },
    ]) {
      const manifest = fixture();
      mutation(manifest);
      expect(() => validate(manifest)).toThrow();
    }
  });

  it.each([null, [], {}, 1, true].map((value) => ({ value })))("rejects malformed enums through controlled diagnostics: $value", ({ value }) => {
    for (const field of ["role", "variant", "tab"]) {
      const manifest = fixture();
      const binding = manifest.curriculum.lessons[0];
      if (field === "role") Reflect.set(binding, "role", value);
      if (field === "variant") Reflect.set(binding.variants[0], "kind", value);
      if (field === "tab") Reflect.set(binding.codeTabs[0], "kind", value);
      expect(() => validate(manifest)).toThrow(/^curriculum evidence:/u);
    }
  });

  it("retains SIMT/tile, mixed and existing source-entry obligations", () => {
    for (const mutation of [
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].variants.pop(); },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[1].variants.reverse(); },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].sourceEntryIds = []; },
      (manifest: ReturnType<typeof fixture>) => { manifest.curriculum.lessons[0].role = "conceptual"; },
    ]) {
      const manifest = fixture();
      mutation(manifest);
      expect(() => validate(manifest)).toThrow();
    }
  });

  it("retains conceptual lessons and explicit executable source-binding gaps", () => {
    const manifest = fixture();
    const conceptual = manifest.curriculum.lessons[1];
    conceptual.role = "conceptual";
    conceptual.sourceEntryIds = [];
    conceptual.variants = [];
    conceptual.codeTabs.forEach((tab) => { tab.sourceItemStatus = "not-applicable"; });
    const unbound = manifest.curriculum.lessons[2];
    unbound.sourceEntryIds = [];
    unbound.sourceBindingGap = "Source entry implementation remains pending";
    manifest.entries = manifest.entries.filter((entry) => ![conceptual.lessonId, unbound.lessonId].includes(entry.lessonId));
    expect(() => validate(manifest)).not.toThrow();
    unbound.sourceBindingGap = null;
    expect(() => validate(manifest)).toThrow("source-binding gap");
  });

  it("rejects unrelated aliases and admits paths from the selected fixture closure", () => {
    const current = structuredClone(lessons.slice(0, 2));
    current.forEach((lesson, index) => {
      lesson.id = index === 0 ? "source-owner" : "source-alias";
      lesson.tabs = [{ kind: "kernel", language: "rust", label: "kernel", code: "pub fn kernel() {}", sourcePath: `src/${lesson.id}.rs` }];
    });
    const manifest = fixture(current);
    manifest.entries.pop();
    manifest.curriculum.lessons[1].sourceEntryIds = ["source-owner"];
    expect(() => validate(manifest, current)).toThrow("unrelated to its displayed kernel paths");
    manifest.entries[0].compilerFixtureIds = ["alias-fixture"];
    manifest.compilerFixtures.push({ fixtureId: "alias-fixture", compilerInput: { sourcePaths: ["src/source-alias.rs"] } });
    expect(() => validate(manifest, current)).not.toThrow();
    manifest.compilerFixtures[0].compilerInput.sourcePaths = ["src/unrelated.rs"];
    expect(() => validate(manifest, current)).toThrow("unrelated to its displayed kernel paths");
  });

  it("requires a gap for uncovered historical same-ID kernel paths", () => {
    const current = structuredClone(lessons);
    current[0].tabs = [{ kind: "kernel", language: "rust", label: "historical", code: "pub fn kernel() {}", sourcePath: "historical/kernel.rs" }];
    const manifest = fixture(current);
    manifest.entries[0].sourcePaths = ["current/kernel.rs"];
    expect(() => validate(manifest, current)).toThrow("historical/kernel.rs");
    manifest.curriculum.lessons[0].sourceBindingGap = "historical/kernel.rs is not in the current compiler source closure";
    expect(() => validate(manifest, current)).not.toThrow();
    manifest.entries[0].sourcePaths = ["historical/kernel.rs"];
    expect(() => validate(manifest, current)).toThrow("source-binding gap");
  });
});

describe("curriculum source pin", () => {
  const pin = { commit: "a".repeat(40), tree: "b".repeat(40), path: "config/tutorial-kernel-manifest-v1.json", sha256: "c".repeat(64) };
  it("requires exact compiler-owned provenance", () => {
    expect(validateCurriculumSourcePin(pin)).toEqual(pin);
    for (const changed of [
      { commit: null }, { tree: null }, { sha256: null }, { commit: "main" },
      { path: "../other.json" }, { extraInventory: [] },
    ]) expect(() => validateCurriculumSourcePin({ ...pin, ...changed })).toThrow();
  });
});
