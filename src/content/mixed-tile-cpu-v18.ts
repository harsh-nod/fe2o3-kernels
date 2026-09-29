import type { Claim, CodeTab } from "./model";
import { qualificationReference } from "./model";
import type { NarrativeRegistryEntry } from "./narrative-registry";
import source from "../../examples/mixed_tile_u32.rs?raw";
import oracle from "../../examples/mixed_tile_oracle.rs?raw";
import workflow from "../../examples/mixed-tile-cpu-v18/workflow.sh?raw";

export const mixedTileCpuV18Evidence = {
  compilerRef: "ae162efd2bc8df7a061108a126333c378ac980d9",
  sourceSha256: "e8aad7f11d63371e7d97e915dcbb5e35a6f44b885750a621696895f7d8810ee5",
  oracleSha256: "e7f6db79016e7fa1f559294c292817802c0466b608f060448e5e5e58601230cf",
  batch: "v18-public-example-cli-mir0-ae162efd2bc8df7a061108a126333c378ac980d9-20260929203358-887257",
  summarySha256: "a24a67fa0fbfda70909a0747c086668bee131885f34e3026830f45d06c4bc738",
  blockedResponsesSha256: "624936067e9cab1d522542b3c636bb73e6070c243299eaaaec45e611832b9b24",
  stripedResponsesSha256: "50d54fda2a67962cb76e2b632b8895e5e95005cd227741045b983da76e367a7f",
  fixtureSourceInjection: false,
  hostOracleTests: 6,
  inventories: 2,
  simulations: 52,
  debuggerSessions: 2,
  negativeControls: 10,
} as const;

export const mixedTileCpuV18: NarrativeRegistryEntry = {
  sectionId: "mixed-tile-v18",
  title: "A masked tile with ordinary per-lane Rust",
  blocks: [
    {
      type: "callout",
      tone: "info",
      title: "An ordinary crate, two measured CPU executions",
      text: "The opt-in mixed-tile-u32-kernel example completed the public exporter, metadata inventory, simulator, and JSONL debugger workflow at compiler ae162efd2bc8df7a061108a126333c378ac980d9. Both orders used the same ordinary Cargo manifest and shared export target directory, with fresh canonical outputs and no source-injection fixture. This is CPU diagnostic evidence, not a completed native SIMT/tile pair.",
    },
    {
      type: "paragraph",
      text: "The kernel loads three masked u32 values per logical lane through MaskedTile1D, returns values and validity bits to ordinary Rust, computes a wrapping weighted sum, and writes through a bounds-checked DisjointSlice using thread::index_1d(). Tile loading and SIMT arithmetic are parts of the same source kernel. An inactive tile element contributes zero; a lane with no active elements leaves its output untouched.",
    },
    {
      type: "table",
      headers: ["Observation order", "Input index for lane l and element j", "Meaning"],
      rows: [
        ["Blocked", "base + 3*l + j", "Three adjacent input elements per lane, subject to checked arithmetic and the input length."],
        ["Striped", "base + 64*j + l", "Three stripes across a 64-lane workgroup, one element from each stripe per lane."],
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Different mappings can produce different answers",
      text: "The weights 3, 5, and 7 apply to the three per-lane positions. Changing the observation order changes which inputs reach those positions and which lane writes their sum. Compare each order with its own independent oracle; equal source text does not establish equivalent whole-kernel outputs. Each workgroup revisits the input tile but writes distinct global output indices.",
    },
    {
      type: "steps",
      items: [
        "Use the exact compiler revision in the qualification reference and build the four public tools. Export the same standalone example manifest once per order, into fresh files.",
        "Read the canonical kernel ID and entry ABI with fe2o3-kir-sim inspect --diagnostic-kir-v18. Metadata inspection does not execute or establish simulator admission.",
        "Bind each request to its measured kernel ID. The exported ABI is a read-only u32 slice, a u64 scalar, and a read-write u32 slice; the Rust spelling usize is not an index request type.",
        "Run the matching canonical file and request. Compare exact bytes and initialization bits with the per-order oracle, including unchanged input and output canaries.",
        "Open the JSONL debugger, discover capabilities, and step by operation. Inspect dispatch, workgroup, logical Wave64, and lane scopes; discover allocation identities from captured pointer values before reading memory.",
      ],
    },
    {
      type: "table",
      headers: ["Inspection", "What the retained session shows", "Boundary"],
      rows: [
        ["Logical hierarchy", "Dispatch, workgroup [0,0,0], Wave64, and individual lanes.", "CPU logical scopes, not resident hardware waves or occupancy."],
        ["Logical values", "Captured KIR values and allocation-relative pointer identities.", "Not physical registers or an authenticated Rust source map."],
        ["Memory and initialization", "Untouched outputs remain uninitialized even when their bytes resemble valid values.", "Measured allocation-relative bytes, not native GPU addresses."],
        ["Reverse operation", "A completed execution can move back to its final captured snapshot for memory inspection.", "In-session retained execution; raw V18 persisted schedule import/export is unavailable."],
      ],
    },
    {
      type: "paragraph",
      text: "The qualification passed six independent host-oracle tests, two public inventories, 52 exact-byte/initialization simulations, two complete 15-command debugger sessions, and ten refusal or unavailable controls. Cases cover empty input, lengths around 64 and 192, shifted and overflowing 64-bit bases, short outputs, and multiple workgroups. The simulator reported amdgpu_64_little_endian_v1 with 64-bit indices, separately from the gfx942 source profile.",
    },
    {
      type: "paragraph",
      text: "The recorded debugger case has 65 boundary-value inputs and eight output elements. At revision 1, captured output pointers identify allocation 2 at byte offset 12. The 52-byte memory view includes three prefix canaries, eight output elements, and two suffix canaries. Initially, output bytes contain the canary pattern but their initialization bits are clear. After exact completion and one reverse operation, all eight outputs are initialized and both canary regions remain unchanged. This makes an omitted write distinguishable from a valid zero result.",
    },
    {
      type: "table",
      headers: ["Measured ordinary-crate observation", "Blocked", "Striped"],
      rows: [
        ["Canonical KIR identity", "b3521f1d58a6ff1d73bfd818c596fa55dd43ba4c1b801d6e2a062fd92bb66dac", "0601648b09e63ac2ccc58e32efbd388c6d54185f31cc0ccf6aeb7631f928b0ce"],
        ["Canonical bytes / storage-layout rows", "4,766 / 15", "4,766 / 15"],
        ["Initial output-view initialization", "0xff0f000000f00f", "0xff0f000000f00f"],
        ["Final captured initialization", "0xffffffffffff0f", "0xffffffffffff0f"],
        ["First output, hexadecimal u32", "0xffffffcc", "0x0000158c"],
        ["Completed event cursor", "8,590", "9,094"],
      ],
    },
    {
      type: "paragraph",
      text: "Both orders retained the same source-semantic and pending identity while their canonical and schedule identities differed. The recorded input repeats selected wrapping-boundary values; it is not the README's separate 1..=65 example. The Public CLI workflow tab reuses this recorded boundary input while discovering the fresh export's kernel ID. Raw request and response files remain byte-exact, including 64-bit active masks.",
    },
    {
      type: "callout",
      tone: "boundary",
      title: "Raw V18 is observation-only",
      text: "The V18 exporter pins opt-level=0 and mir-opt-level=0 with overflow checks enabled; it does not weaken the mutable execution-borrow copy refusal. This route requires Wave64 and has no authenticated source map or persisted schedule record/replay. Source stepping and register inspection report specific unavailable capabilities. CPU execution grants no native artifact, GPU launch, protected compiler authentication, source-to-KIR refinement, hardware validation, or performance prediction. The new displayed kernel retains its own pending curriculum binding and native SIMT/tile obligations.",
    },
  ],
};

export const mixedTileCpuV18Claim: Claim = {
  kind: "runnable-now",
  label: "Mixed tile/SIMT source in the CPU simulator and debugger",
  detail: "The ordinary mixed-tile-u32-kernel crate passed two fresh raw V18 exports, two inventories, 52 oracle simulations and two complete debugger sessions, with ten refusal/unavailable controls. Both orders are independently checked algorithms, not a cross-order equivalence claim. Native SIMT/tile pairs remain pending.",
  reference: qualificationReference(
    mixedTileCpuV18Evidence.compilerRef,
    "24517b56b080037732cabfb37cec85d6c139ca47",
    [
      "cargo test --locked --manifest-path examples/workgroup_sync_v1/Cargo.toml --no-default-features --test mixed_tile",
      "fe2o3-export-sim --diagnostic-kir-v18 --diagnostic-tile-order blocked --crate fe2o3_workgroup_sync_v1 --target gfx942 --target-dir target/mixed-tile-export --output blocked.kir -- --manifest-path examples/workgroup_sync_v1/Cargo.toml --no-default-features --features mixed-tile-u32-kernel",
      "fe2o3-kir-sim inspect --diagnostic-kir-v18 blocked.kir --output blocked.inventory.json",
      "fe2o3-kir-sim --diagnostic-kir-v18 blocked.kir --request blocked.request.json --output blocked.result.json",
      "fe2o3-debug sim --diagnostic-kir-v18 blocked.kir --request blocked.request.json --protocol jsonl --wave-width 64",
    ],
    [
      "examples/workgroup_sync_v1/Cargo.toml",
      "examples/workgroup_sync_v1/src/kernel_mixed_tile_u32.rs",
      "examples/workgroup_sync_v1/src/mixed_tile_oracle.rs",
      "examples/workgroup_sync_v1/tests/mixed_tile.rs",
      "docs/diagnostic-scoped-tile-v18.md",
    ],
    {
      target: "gfx942 source profile; CPU semantic execution only",
      note: "Raw V18 observation-only qualification. No fixture source injection, protected authority, native launch, hardware timing, performance prediction, or completed tutorial pair.",
    },
  ),
};

export const mixedTileCpuV18Tabs: CodeTab[] = [
  {
    kind: "kernel",
    label: "Mixed tile source",
    language: "rust",
    code: source,
    sourcePath: "examples/workgroup_sync_v1/src/kernel_mixed_tile_u32.rs",
    sourceCommit: mixedTileCpuV18Evidence.compilerRef,
    sourceSha256: mixedTileCpuV18Evidence.sourceSha256,
    sourceDigestScope: "file",
    explanatory: false,
    notice: "Exact ordinary source qualified through raw V18 CPU export, simulation and debugging. Native artifact, KFD execution and complete tutorial-pair qualification remain pending.",
  },
  {
    kind: "reference",
    label: "Mixed tile oracle",
    language: "rust",
    code: oracle,
    sourcePath: "examples/workgroup_sync_v1/src/mixed_tile_oracle.rs",
    sourceCommit: mixedTileCpuV18Evidence.compilerRef,
    sourceSha256: mixedTileCpuV18Evidence.oracleSha256,
    sourceDigestScope: "file",
    explanatory: false,
    notice: "Independent u128 specification for each order, including finite-width indexing, wrapping results and untouched-output initialization.",
  },
  {
    kind: "host",
    label: "Public CLI workflow",
    language: "bash",
    code: workflow,
    explanatory: true,
    notice: "Run from the qualified compiler checkout; TUTORIALS names this tutorials checkout. Requests reuse the retained 65-input/eight-output boundary case and bind fresh inventory IDs.",
  },
  {
    kind: "result",
    label: "Recorded mixed CPU observations",
    language: "text",
    explanatory: true,
    notice: "Selected exact fields from ordinary-crate debugger responses at ae162efd. Complete byte-exact requests and responses are retained under examples/mixed-tile-cpu-v18.",
    code: String.raw`workgroup [0,0,0]
  wave 0: width=64, active_mask=18446744073709551615
  interpretation=logical_visualization
  lanes 0..63: individually inspectable

output allocation: ordinal=2, generation=0, view byte offset=12
read_memory: byte_offset=0, requested_bytes=52, returned_bytes=52
initial initialized: 0xff0f000000f00f
final initialized:   0xffffffffffff0f
prefix/suffix canaries: unchanged

blocked output u32 words:
  ffffffcc 800001b0 7ffffffa 00000192
  800006fd ffffffcc 800006ab 7ffffffa
striped output u32 words:
  0000158c ffffffd5 0000000b 8000000e
  000000f8 00000008 ffffffd5 0000000b

request 12 continue: reason=completed, outcome=completed, exact=true
request 13 reverse operation: retained final snapshot
request 14 read_memory: captured, global, truncated=false
request 15 terminate: state=terminated

request 10 source step:
  status=unavailable, capability=source_sites
  reason=requires_authenticated_map, state_changed=false
request 11 register inspection:
  status=unavailable, capability=register_values
  reason=not_represented, state_changed=false

simulated=true
hardware_observed=false
performance_prediction=false`,
  },
];
