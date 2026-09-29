import type { CodeTab } from "./model";
import type { NarrativeRegistryEntry } from "./narrative-registry";

// Unregistered draft. Do not attach it to the lesson before the requirements
// below are met by retained public-CLI evidence at one exact compiler revision.
export const mixedTileCpuV18PublicationRequirements = [
  "Expose actual canonical kernel IDs and argument ABI through production CLI metadata discovery.",
  "Bind a public source crate, its exact displayed source, and independent per-order oracle.",
  "Qualify the same source path through both exports, metadata discovery, request construction, simulator, and debugger.",
  "Retain exact compiler/source/KIR/request identities and measured debugger hierarchy and memory responses.",
  "Replace draft command inputs with the qualified public example paths and exact inventory syntax.",
  "Add a separate qualification reference without advancing historical global or existing lesson pins.",
] as const;

export const mixedTileCpuV18Draft: NarrativeRegistryEntry = {
  sectionId: "mixed-tile-v18",
  title: "A masked tile with ordinary per-lane Rust",
  blocks: [
    {
      type: "callout",
      tone: "boundary",
      title: "Unpublished CPU diagnostic draft",
      text: "The source and command shapes below are prepared for qualification, not a recorded successful run. Canonical metadata discovery, the complete public example, and retained simulator/debugger output must be qualified before this section is registered in the lesson.",
    },
    {
      type: "paragraph",
      text: "This example loads three masked u32 values per logical lane through MaskedTile1D, returns the values and validity bits to ordinary Rust, computes a wrapping weighted sum, and writes through a bounds-checked DisjointSlice using thread::index_1d(). The tile load and SIMT arithmetic belong to the same source kernel. An inactive tile element contributes zero; a lane with no active elements leaves its output untouched.",
    },
    {
      type: "table",
      headers: ["Observation order", "Input index for lane l and element j", "Meaning"],
      rows: [
        ["Blocked", "base + 3*l + j", "Each lane owns three adjacent elements, subject to checked index arithmetic and the input length."],
        ["Striped", "base + 64*j + l", "Each tile element spans the 64 logical lanes; each lane receives values from three stripes."],
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Different mappings can produce different answers",
      text: "The weights 3, 5, and 7 apply to the three per-lane positions. Changing the observation order changes which inputs reach those positions and which lane writes their sum. Compare each order with its own independent oracle; equal source text does not establish equivalent whole-kernel outputs. These diagnostic order choices are not a GPU launch or a general layout-equivalence theorem.",
    },
    {
      type: "steps",
      items: [
        "Build the public exporter, extractor, simulator, and debugger from one qualified compiler checkout. Export both orders from the same source path, with fresh output destinations.",
        "Read the canonical kernel IDs and parameter ABI through the production metadata command. Bind the request to the measured kernel ID, not an assumed spelling of mixed_tile_probe. This command is still pending in the draft.",
        "Construct a request with a 64-lane workgroup, a read-only u32 input, a u64 base scalar, and a read-write u32 output. Preserve exact allocation bounds and initialization state. The exported ABI, rather than the Rust spelling usize, determines the scalar request type.",
        "Run each canonical file with its matching request and compare exact bytes, initialization bits, unchanged input, and canaries with that order's oracle.",
        "Open the same file and request in the JSONL debugger. Discover capabilities, step by operation, inspect the dispatch/workgroup/wave/lane hierarchy, and obtain allocation identities from captured logical pointer values before reading memory.",
      ],
    },
    {
      type: "table",
      headers: ["Inspection", "Question to answer", "Evidence boundary"],
      rows: [
        ["Logical scopes", "Which workgroup, logical Wave64, and lane own the captured state?", "A CPU execution hierarchy, not resident hardware waves or GPU occupancy."],
        ["Logical values", "Which values and pointer identities are captured at this operation?", "Captured KIR values, not physical registers or an authenticated Rust source map."],
        ["Allocation memory", "Which output bytes are initialized, which masked lanes remain untouched, and are the canaries unchanged?", "Measured allocation-relative bytes and initialization bits from this retained execution."],
        ["Independent oracle", "Do the output and untouched regions match the selected mapping?", "A bounded correctness observation for the input cases, not exhaustive verification or cross-order equivalence."],
      ],
    },
    {
      type: "paragraph",
      text: "Useful boundary cases include empty input, lengths around 64 and 192, a shifted base, finite-width base overflow, an output shorter than the launch, and multiple workgroups. Keep output storage initially uninitialized so an omitted write is distinguishable from a valid zero result. Canary checks cover memory around the requested view; they do not replace the simulator's bounds checks.",
    },
    {
      type: "callout",
      tone: "boundary",
      title: "Raw V18 is observation-only",
      text: "This opt-in path executes an admitted scalar diagnostic candidate on the CPU. It does not grant native artifact, GPU launch, hardware validation, performance prediction, protected compiler authentication, or source-to-KIR refinement authority. The source target is not evidence of execution on that GPU. Raw V18 currently requires Wave64 and has no authenticated source map or persisted schedule record/replay. Source stepping and register inspection must report their specific unavailable capabilities instead of inventing data.",
    },
    {
      type: "paragraph",
      text: "The publication record will include the measured canonical identity and kernel ID for each order, the actual simulator target profile, and a retained hierarchy/memory excerpt from the public debugger. No sample responses or success totals are included here because that end-to-end qualification has not yet been recorded.",
    },
  ],
};

export const mixedTileCpuV18DraftTabs: CodeTab[] = [
  {
    kind: "kernel",
    label: "Mixed tile source",
    language: "rust",
    explanatory: true,
    notice: "Unpublished genuine Rust source for the pending public-CLI CPU qualification. This is not a GPU execution claim.",
    code: String.raw`use fe2o3_device::{kernel, thread, DisjointSlice, KernelContext, MaskedTile1D};

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn mixed_tile_probe(
    mut ctx: KernelContext<'_>,
    input: &[u32],
    base: usize,
    mut output: DisjointSlice<u32>,
) {
    let ([x, y, z], [mx, my, mz]) = ctx.with_workgroup(move |workgroup| {
        let tile = MaskedTile1D::<u32, 64, 3, _>::load_masked(&workgroup, input, base);
        tile.into_fragment().into_parts()
    });
    let x = if mx { x.wrapping_mul(3).wrapping_add(11) } else { 0 };
    let y = if my { y.wrapping_mul(5).wrapping_add(13) } else { 0 };
    let z = if mz { z.wrapping_mul(7).wrapping_add(17) } else { 0 };
    if mx || my || mz {
        if let Some(slot) = output.get_mut(thread::index_1d()) {
            *slot = x.wrapping_add(y).wrapping_add(z);
        }
    }
}`,
  },
  {
    kind: "host",
    label: "Public CLI workflow",
    language: "bash",
    explanatory: true,
    notice: "Draft command shapes. Public example paths, inventory syntax, and requests must be supplied by the qualified example before publication.",
    code: String.raw`# Run from the qualified fe2o3 compiler workspace.
cargo build --locked -p rustc-codegen-fe2o3 \
  --bin fe2o3-export-sim --bin fe2o3-rustc-extract
cargo build --locked -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim
cargo build --locked -p fe2o3-debug-cli --bin fe2o3-debug

# FE2O3_BIN contains these exact build outputs. KERNEL_MANIFEST and
# KERNEL_CRATE identify the same source crate for both observation orders.
# OUTPUT_DIR is fresh; EXPORT_TARGET is shared between the two exports.
for order in blocked striped; do
  "$FE2O3_BIN/fe2o3-export-sim" \
    --diagnostic-kir-v18 --diagnostic-tile-order "$order" \
    --crate "$KERNEL_CRATE" --target gfx942 \
    --target-dir "$EXPORT_TARGET" \
    --output "$OUTPUT_DIR/$order.kir" \
    -- --manifest-path "$KERNEL_MANIFEST"
done

# Pending: public inventory of each canonical file, followed by request
# construction using its measured kernel ID and ABI. No guessed kernel ID.
# Each order's request below must come from that qualified workflow.
for order in blocked striped; do
  "$FE2O3_BIN/fe2o3-kir-sim" \
    --diagnostic-kir-v18 "$OUTPUT_DIR/$order.kir" \
    --request "$OUTPUT_DIR/$order.request.json" \
    --output "$OUTPUT_DIR/$order.result.json"
done

"$FE2O3_BIN/fe2o3-debug" sim \
  --diagnostic-kir-v18 "$OUTPUT_DIR/blocked.kir" \
  --request "$OUTPUT_DIR/blocked.request.json" \
  --protocol jsonl --wave-width 64`,
  },
];
