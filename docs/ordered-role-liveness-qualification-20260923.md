# Logical assembly-region lifetimes — 2026-09-23

The retained source/native workbench now derives a bounded logical def/use view
from its already checked ordered-region descriptors. This advances #281 V3 and
#280 M5; it does not complete either milestone. Accepted original exits remain
M1/V1/V2/U1/U2/U3 (6/18).

## Implemented scope

Each instruction read resolves before its write. Writes create analysis-only
versions, including dead and self-writes; duplicate operand occurrences remain
visible while live sets count each value once. Half-open boundary intervals,
last reads, overwrites, unused definitions and final output are explicit.

Boundary pressure, transient read/write footprint and operand/write count have
separate definitions. They are logical u32 quantities, not physical VGPR
requirements, allocator free/reuse events, occupancy, cycles or performance.
Only the three inputs and final result have retained canonical SSA IDs.
Intermediate labels are not invented canonical SSA definitions.

Bounds are 16 steps, 19 versions, 17 boundaries and 32 read-operand slots.
Only one selected case is rendered. Exact export/source/canonical/origin/LLVM/
report/HSACO/path/case bindings reset selection; returning A→B→A does not revive
an earlier logical selection. No surrounding-function liveness is inferred.

## Retained inputs and tests

The unchanged 1,105,533-byte source/native capsule has SHA-256
`da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d`
and independent join
`7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115`.
Its eight one/two/fifteen/repeat × O0/O3 cases stay separately selected.
For these exact cases the peak boundary count is two, transient footprint is
three, and the third region input is unused. The 23-artifact capsule, importer
bounds and legacy 14-artifact path are unchanged.

New tests comprise 30 synthetic analysis cases, three retained-input checks and
four presentation cases. Synthetic controls cover read-before-write, duplicate
reads, dead writes, unused inputs, exact bounds and immutable model/selection
replacement. Actual retained-input tests do not rerun Rust or GPU compilation.

The full site gate passed TypeScript, all 1,517 unit tests in 104 files, ESLint,
production build, evidence validation, 21 existing lab tests and all 186 browser
cases on desktop/mobile. Its receipt is 28,614 bytes, SHA-256
`896d11810838d91100eae0b88d71f1e9a9ec96ae84e4bdec15e5f6f49b55695c`.
The frozen source was 792 files / 19,868,016 bytes, SHA-256
`b8a02c3c7ebea49c0978d68575f7d2376299b7ead4f69307d2df62a52cec7b8c`.
The existing production-build large-chunk warning remains.

## Mobile correction and final focused gate

Pixel review found excessively narrow text columns even though page-overflow
assertions passed. Tables now retain a readable minimum width inside two named,
focusable local scroll regions. A narrow-screen hint explains horizontal and
Left/Right-key navigation. The browser test focuses the overflowing region,
presses ArrowRight and observes actual horizontal movement.

After this correction and addition of the const-builder tutorial/README links,
TypeScript, all 1,517 unit tests, ESLint, build, evidence and 21 lab tests passed
again. Both focused liveness browser cases passed. This is a two-case rerun,
not a second complete 186-case run. Counts from overlapping gates are not added.

The final focused receipt is 23,356 bytes, SHA-256
`b7338ba144ac2dc154dcc5f166702529dfce55ea6ad3c634a961b692f2f88c31`.
The frozen source was 793 files / 19,877,036 bytes, SHA-256
`aeaf9d095cb5c7f6355f0ed5e61ef28cb0a5e9237243b77e46c06d068b6a47e0`.
Both final viewport screenshots were visually reviewed; they are visible crops,
not evidence that every off-screen row was pixel-inspected. Browser assertions
cover all eight cases, exact SSA mappings, case/reimport/reset invalidation,
panel/page bounds and no requests during local import/inspection.

Root-owned SSH MI350 logs are retained under
`logs/phase28-resume-r4-site-ordered-role-liveness-full-r1` and
`logs/phase28-resume-r4-site-ordered-role-liveness-responsive-r2`.
Receipts distinguish command observations from production/hardware authority;
source and selected tools were checked before and after execution. This report
and the tutorial qualification link were added after those executable gates.

## Remaining exits

No physical register values/lifetimes, native allocator replay, per-instruction
source ancestry, new live debugger stop, source authentication or protected
compilation authority are supplied. V3/M5, V4 hardware qualification and V5
complete curriculum/scale/accessibility exits remain open. The separate
[const-builder tutorial](complete-body-const-builder-v1.md) explains inert data
construction, not newly admitted complete-body kernels.
