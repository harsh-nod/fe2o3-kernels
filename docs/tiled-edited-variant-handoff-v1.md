# Compare evidence for an edited tiled kernel

This guide explains the proposed handoff between kernel authoring, compiler
resource observations and the debugger. It is contract and navigation guidance,
not a runnable edited-tile workflow. It introduces no command, wire schema,
identifier allocation or source authority.

The goal is to compare one original kernel with a freshly compiled edit using
the compiler's actual observations. The editor, resource panel and tutorial
should consume that same producer output. They must not reconstruct a kernel
or invent missing register, source or artifact mappings.

## Start with genuine source observations

The [normal continuation lesson](https://github.com/harsh-nod/fe2o3-kernels/blob/6d5232d9675dbf346e740480712e2c1eb3ed24b0/docs/tiled-region-normal-continuation-v1.md)
follows a real BF16 Rust fixture through ordinary compiler stages into an inert
handoff. Its [source](https://github.com/harsh-nod/fe2o3/blob/2af2a8d7dc75d8edac3da50325c91ea1911f8324/crates/rustc-codegen-fe2o3/tests/fixtures/tiled-region-inspection-v1/src/lib.rs)
stores only result component 0. The recorded normal result retains one runtime
bounds requirement and two runtime alias requirements; it is not a GPU launch.

The separate [helper CPU lesson](https://github.com/harsh-nod/fe2o3-kernels/blob/6d5232d9675dbf346e740480712e2c1eb3ed24b0/docs/bf16-helper-source-cpu-observation-v1.md)
uses [hand-authored Rust](https://github.com/harsh-nod/fe2o3/blob/b629317dc3288c9393a9a515d60b58535bf5ba2b/crates/rustc-codegen-fe2o3/tests/fixtures/bf16-tile-promotion-v1/src/lib.rs).
Identity returns components `[0, 1, 2, 3]`; Swap01 returns `[1, 0, 2, 3]`.
Because the caller stores returned component 0, the permutation changes the
result that reaches memory. These are two real source variants, not a
demonstration of generated tiled-source promotion or equivalent schedules.

That helper lesson observes the source-produced graph with an independent
integer oracle, actual helper/caller values, input preservation and output
canaries. Its numerical domain is a bounded gfx942 BF16/F32 profile, not general
BF16 arithmetic or gfx950 qualification. Follow the pinned lesson for its
existing contributor commands and exact evidence.

The normal fixture and helper fixture are different subjects. Their reports
cannot be joined into one successful source-to-GPU result. Numerical CPU
success does not discharge the other run's runtime conditions, create final
machine instructions, or make an edited variant current.

## Keep each variant bound to its own evidence

The following table describes information to retain when a real producer
supports it. The row labels are explanatory categories, not a new wire format.
An unavailable field stays unavailable; an expected value is not an observation.

| Evidence | Original variant | Edited variant |
| --- | --- | --- |
| Source and helper closure | Exact source bytes/revision, concrete specialization and authenticated helper closure | New source bytes and fresh frontend admission, retaining the original for comparison |
| Selected region | Actual function/operation occurrences, live-ins/live-outs, effects and representable insertion boundary | Fresh selection and checked correspondence; do not reuse stale coordinates |
| Recipe and target | Exact policy, recipe applicability, target/features, launch and numerical contract | Checked replay or explicit rebinding; a rejected recipe remains rejected |
| Numerical observations | This variant's actual CPU observations and independent expected result | New observations and an oracle appropriate to the intended edit, including inputs, tails and canaries |
| Resources | Distinct author requests, compiler plans, final machine resources and captured values where available | New observations for each supported layer; logical components are not physical VGPR assignments |
| Artifact and instruction map | The actual artifact and supported source/expansion/instruction correspondence | Fresh artifact evidence and mapping, or unavailable if compilation did not reach that stage |
| Capture and selection | Exact source/artifact bindings, revision, occurrence, allocation generation and query cursor where represented | Its own compatible capture and selection; never relabel the original recording |

For the published helper CPU example, helper/caller values and actual memory
observations are available. Generated edited-tile source, successful normal
helper completion, final physical register assignments and a physical capture
are not supplied by that lesson. The
[retained source engine checkpoint](https://github.com/harsh-nod/fe2o3/blob/4fb8ae500e38ad22475861aae7c3b3ef238068f6/docs/retained-shared-source-engine-qualification-20260929.md)
and [genuine capability prefix checkpoint](https://github.com/harsh-nod/fe2o3/blob/4fb8ae500e38ad22475861aae7c3b3ef238068f6/docs/genuine-capability-prefix-qualification-20260929.md)
describe newer source/accounting prerequisites, not a completed edited-tile
producer. Their individual qualification records keep their original scope.

## Follow the future producer handoff

Once the compiler supports the selected tiled boundary, the intended sequence
is:

1. Select an eligible region from the actual source-owned program and validate
   its complete boundary, helper closure and concrete specialization.
2. Materialize a create-new typed Rust candidate, preserving the original
   source. A source span or copied IR report alone cannot authorize this step.
3. Make an explicit instruction or resource edit, then re-enter the ordinary
   frontend and fixed compilation policy. Recheck the recipe or explicitly
   rebind it; do not resume a detached snapshot.
4. Establish fresh source, semantic, numerical and applicable machine/resource
   evidence. Preserve every required refusal, unresolved condition and failed
   attempt. An edit may intentionally change the algorithm, as Swap01 does.
5. Let the read-only comparison consume those exact original and edited
   observations. Show unavailable or ambiguous mappings rather than filling
   them from names, geometry or an earlier capture.

This sequence is the intended integration boundary, not instructions for a
currently available tiled materializer. There is no new public tiled command
in this guide. Restoring the original Rust is not semantic lifting of later
assembly edits back into high-level Rust.

## Check the comparison before trusting it

These are acceptance exercises for the eventual producer and consumer, not
claims that new tests or kernel executions ran for this guide.

- Change the original source after selection: the old selection must refuse
  rather than silently target the same-looking line.
- Pair edited source with the original capture: reject the incompatible
  binding; do not display the old values as results of the edit.
- Keep an old recipe after changing its target or applicability: require
  checked replay or explicit rebinding, preserving an invalid-precondition
  refusal.
- Supply two possible source occurrences for one instruction range: preserve
  ambiguity; do not choose one by source text or register number.
- Omit final artifact or physical-register evidence: display unavailable,
  not zero registers, inferred occupancy, or measured hardware behavior.

Passing documentation checks cannot establish any of these compiler or capture
properties. The compiler supplies facts, the query layer checks compatibility,
and the viewer presents the supported observations; it does not mutate compiler
state or manufacture proof, artifact or launch authority.

The shared example belongs to the compiler resource, debugger comparison and
tiled authoring work in
[#280 M5](https://github.com/harsh-nod/fe2o3/issues/280),
[#281 V3](https://github.com/harsh-nod/fe2o3/issues/281) and
[#282 U4](https://github.com/harsh-nod/fe2o3/issues/282).
An assembly or promoted variant is additional to the required SIMT/tile pair,
not a replacement for it. This guide changes no global `FE2O3_PIN`, route,
lab maturity or milestone acceptance, and claims no GPU execution, physical
capture or performance improvement.
