# Draft: navigate ordinary Rust and canonical KIR

This bounded, read-only example navigates the ordinary `bitwise_chain` fixture
from retained Rust text to actual canonical KIR. Open **Debugger → Cross-layer
inspection → Open ordinary source navigation**. It is separate from the
synthetic Characteristic archive and does not change the curriculum baseline,
maturity labels or `FE2O3_PIN`.

The compiler capture was produced at
[70b3fe0057e18e16eaa568301d2743b1ca6c252a](https://github.com/harsh-nod/fe2o3/commit/70b3fe0057e18e16eaa568301d2743b1ca6c252a)
with the existing pinned nightly and `gfx942:xnack-` diagnostic profile.
The source has 453 bytes, twelve retained operations and six eliminated-source
spans reported by the existing inspector. No body or value is invented for an
unavailable stage.

## What selecting source means

One source expression can be attributed to several KIR operations. In the
existing ordinary fixture, `low | 256` is attributed to both the constant and
the OR. A source click must list all matching operation occurrences. It must
not silently choose one, merge the occurrences, infer a Rust variable's SSA
owner, or authorize replacing that expression.

The preview supports two directions:

1. Select an attributed, half-open UTF-8 byte range to list every overlapping
   operation. Ambiguous matches require an explicit operation choice.
2. Select an exact KIR roster coordinate to highlight all its retained source
   ranges. An operation without a source origin remains inspectable, with no
   nearest-line fallback.

Only the one OR selection with a retained compiler `select` response has a
structural-boundary panel. That panel uses the returned live-ins, live-outs,
types and local-effect contract. Other operations' inputs/results do not create
unobserved region boundaries. The structural selection covers contiguous
operations in one block and no terminator; source insertion remains unavailable.

## Available facts and explicit gaps

| Level | This preview can display | Not supplied |
| --- | --- | --- |
| Ordinary Rust | Exact retained text/hash and census file identity | Typed HIR, variable ownership, editable source boundary |
| Canonical SIMT KIR V11 | Exact operations, coordinates and one retained structural selection | A reusable compiler owner or resumed compilation |
| Semantic MIR | Retained identity | MIR body navigation |
| Scheduled/tile Rust and neutral/target lineage | Explicit unavailability | Invented intermediate snapshots or transformations |
| LLVM and final ISA | Explicit unavailability | Compiler-handoff text, final artifact or machine mapping |
| Resources and execution | Declared local effects/completeness | Physical registers, lifetimes, selected runtime values, hardware observations |

Traps and convergence remain `not_analyzed`. Empty listed effects do not mean a
complete summary unless the retained completeness flag says so. No UI action
edits, materializes, builds, simulates, launches, fetches or resumes anything.

## Capture and integrity boundaries

The compiler-side maintainer runner captures a new ordinary-source Bundle V6,
same-invocation diagnostic source census, and existing `fe2o3-author` inspect,
paged operations and select responses. Its validator checks command, input,
census, page, snapshot and exact boundary joins before exposing a frozen private
display projection. This is not a new compiler protocol.

The website exporter accepts that bounded capture plus an exact SHA-256 and an
explicitly trusted path to the compiler validator module. It writes a new
display-only file and never overwrites an earlier capture. The validator path
is executable trusted code, not something supplied by the capture JSON; this
exporter is not a sandbox for untrusted modules. Publication requires the real
runner to pass before this step.

This example retains the following exact observations:

| Observation | Value |
| --- | --- |
| Private source-capture SHA-256 | `14d3f430b9d6a394de4874d02142c33c1edc29e4ba8fa338f8c424fd85aa0556` |
| [Display input](../examples/ordinary_authoring_navigation_v1.json) SHA-256 | `957b7a0ece3aaea5e474c3124bced44e28a73b616e8cddd0e663a8fa7380d6c1` |
| Source bytes SHA-256 | `cf7485d9f4ad6d892530ef9787a3ffd3ec9ab279c9900d90d7e05cc80c855c3d` |
| Source range | bytes `325..334`, `low \| 256` |
| Distinct attributed occurrences | `0:0:3` constant and `0:0:4` OR |
| Selected boundary | OR; live-ins `%14, %15`, live-out `%16`, all u32 |

These SSA labels and roster coordinates belong only to this retained snapshot.
The two occurrences do not mean that either one owns a replaceable Rust range.

The browser verifies its pinned display bytes, source hash, exact target and
snapshot/selection identities, operation order, every attribution and the
retained boundary. Its limits are 512 KiB of display input, 16 KiB source,
64 operations, 16 spans per operation and 16 boundary values. Source offsets
must be valid UTF-8 endpoints with no CR/BOM normalization in this initial
profile. Limits reject rather than truncate. The census file identity is not
the source-content SHA-256, and paths are not identity substitutes.

Hashes establish consistency with caller-selected bytes, not source or compiler
authentication. The static viewer does not independently re-run the compiler
validator or re-admit a bundle. A new input clears old selections immediately;
an old asynchronous result cannot overwrite the new selection.

## Development preview and validation

After the site's locked dependencies are available, the development entry is
`/fe2o3-kernels/drafts/authoring-navigation.html` on the local Vite server. It is
not a separate production-build or curriculum route. The same component is
lazy-loaded by the existing cross-layer inspector. The separate synthetic
browser harness is only for keyboard, layout and theme controls.

Pure adapter, component and browser tests exercise source/OR ambiguity,
byte-pin substitution, stale snapshots, malformed inputs, exact boundaries,
both-theme desktop/mobile layout and keyboard selection. Publication also
requires full-site and evidence gates. This bounded preview does not complete the full
multi-level authoring workflow in [#282](https://github.com/harsh-nod/fe2o3/issues/282).

## Reproduce the capture

Use a checkout at the compiler pin above, its built `fe2o3-export-sim`,
`fe2o3-rustc-extract`, `fe2o3-author` and backend library, and the direct pinned
nightly rustc/Cargo binaries. The runner takes explicit absolute paths:

```text
node scripts/authoring-navigation-v1-smoke.mjs \
  --output NEW_ABSOLUTE_OUTPUT \
  --bin-dir ABSOLUTE_COMPILER_BIN_DIRECTORY \
  --rustc ABSOLUTE_PINNED_RUSTC \
  --cargo ABSOLUTE_PINNED_CARGO \
  --rustc-driver ABSOLUTE_PINNED_DRIVER_LIBRARY \
  --cargo-home ABSOLUTE_OFFLINE_CARGO_CACHE \
  --cache-root ABSOLUTE_PRIMARY_CACHE_ROOT \
  --secondary-cache-root ABSOLUTE_SECONDARY_CACHE_ROOT
```

It creates a fresh source-build target, uses offline Cargo with two jobs,
requires 40 GiB free disk and 64 GiB available RAM, and checks a combined
20 GiB cache/output ceiling. Repository, output and cache roots must be disjoint.
Each subprocess has bounded duration and output. Failure is retained without
synthetic fallback. Re-running changes path/run identities; do not expect the
archived capture SHA-256 to repeat across independent source compilations.

The new `capture.json` can be passed to this website's
`scripts/export-authoring-navigation.mjs` with the trusted compiler validator
path, the independently measured capture SHA-256, and a fresh output path.
Inspect and pin the generated display file explicitly. This does not update
the main curriculum's publication pin or authorize compilation from a snapshot.
