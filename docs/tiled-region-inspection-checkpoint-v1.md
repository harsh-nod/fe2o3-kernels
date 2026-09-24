# Follow a tiled region without losing its source owner

This contributor checkpoint separates three boundaries: source-owned inspection,
logical CPU behavior and debugger/native execution. The first P0 BF16 inspection
path now passes its genuine four-session source core. Control-flow shape
qualification, numerical simulation and edited-tile promotion remain unfinished.
It adds no public command or source-promotion action.

## Read the actual region, not a reconstructed recipe

The separate finite fixture declares no_std, WG64 and exactly one workgroup.
This body excerpt shows its nominal inputs and zero accumulator:

```rust
let lane = WaveLane::<Wave64>::current();
let Ok(a_matrix) = Bf16MfmaAMatrix::row_major(a, 0, 16, 16, 16) else {
    fe2o3_device::trap();
};
let Ok(b_matrix) = Bf16MfmaBMatrix::row_major(b, 0, 16, 16, 16) else {
    fe2o3_device::trap();
};
let lhs = a_matrix.load_m16k16(&lane, 0, 0);
let rhs = b_matrix.load_k16n16(&lane, 0, 0);
let accumulator = F32AccumulatorFragment::zero(&lane);
let matrix = DeviceMatrix::current();
```

The following multiply_accumulate call consumes those actual nominal values.
The borrowed pre-ranked view joins the current source spans and raw/semantic
call mappings to the same SSA producers, consumed components, canonical
operation and real result uses. Inspection runs inside the original
materialization callback using its retained phase budget. It is not a single
compiler-wide meter, a repeatable post-ranked inspector or an exported owner.
A digest, JSON row or rendered snippet cannot recreate that custody.

The fixture keeps just one result-component output use. It is **not a complete
GEMM implementation or numerical correctness result**. A source-level move,
branch or array does not prove an alias, phi or retained-memory edge survived
optimization; genuine-source controls must inspect the actual imported graph.
The measured root has twenty blocks and thirty-two locals; whole-root scans
are capped at thirty-two blocks while sparse source mappings remain sixteen.
These scan caps remain bounded refusals, not general tiled coverage.
Later mandatory ranked, formal and target validation remains unchanged.

## Keep each observation in its own scope

[Ordered composition and promotion](ordered-composition-promotion-v1.md) already
has a completed fresh source-role ladder: actual callbacks retain source and
argument/call roles through their own normal outputs. Its CPU observations are
not proof that arbitrary edited tiled kernels compile. A separate six-case
O0/O3 static matrix now follows finite machine data roles; full O0 caller ABI,
address/predicate correctness and runtime conditions remain unproved. Tiled helper extraction, editing, fresh checked compilation and a
before/after resource comparison remain future workflow work.

The [one-stop CPU lesson](gfx950-one-stop-cpu-v1.md) describes a different,
unsafe native boundary. The closed MI2 controller's 72 CPU/parser controls
check stop/resume/exit ordering, deadlines and cleanup facts, including refusing
late running notifications. Mock streams and a static debugger build are **not
an actual GPU stop or physical sample**. Native activation remains disabled;
the published Rust package passed 20 additional source-package controls.
Actual same-client ACK, checkpoint consumption and family cleanup still require
separate qualification. This lesson contains no native replay command.

## Publication checkpoint

Compiler implementation checkpoint:
[1b2e5dd364e63c5d107115f379e9c21a6a84236e](https://github.com/harsh-nod/fe2o3/commit/1b2e5dd364e63c5d107115f379e9c21a6a84236e),
published to both compiler repositories' main branches. The compiler's
[qualification record](https://github.com/harsh-nod/fe2o3/blob/1b2e5dd364e63c5d107115f379e9c21a6a84236e/docs/source-transport-tiled-debugger-qualification-20260924.md)
separates exact source, static-native and CPU-only observations.

The fresh source-role ladder passed 26 actual compiler children. Its six-case
typed static native matrix passed all cases. The separately rebuilt fourteen-case
legacy matrix preserved byte-identical GPU binaries using retained historical
source/artifacts; it was not a fresh run of the current frontend.

The tiled core passed 62 lowerer and 18 frontend controls plus four genuine
compiler sessions: direct inspection, wrong launch, callback error and callback
panic. The inspection callback was reached with the original owner and ledger.
All four result definitions are joined; legitimately unused components do not
need fabricated uses. Wrong launch refuses before the callback.

The separate shape gate correctly refused its first case: a Rust-spelled alias
did not survive as an admitted SSA alias. No alias/phi/loop/retained-memory
coverage follows from that failed gate, and the remaining children did not run.
Normal ranked/formal/target continuation, numerical simulation, promotion and
fresh edited-tile compilation remain pending.

The disabled GPL debugger package passed source checks, 47 Node controls and
an inert C++ fixture. A distinct private selection-enabled debugger built and
passed 33 static placement/layout controls, but was not launched. Startup-only
MI2 source passed 54 Rust and 20 Node controls; a two-control cleanup-record
correction passed separately. Neither establishes an actual GPU stop.

The merged compiler regression passed 5,810 test executions in 44 groups,
with 256 ignored tests, unsafe-source inventory and a backend build. Counts
overlap focused configurations and belong to their exact recorded snapshots.

Accepted exits remain **M1/V1/V2/U1/U2/U3 (6/18)**. M2/U4/V4 remain open.
No global FE2O3_PIN, lab maturity, live route, GPU result or support claim changes.
