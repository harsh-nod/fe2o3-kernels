# Recorded authoring and resource-view qualification

All execution and browser checks ran on SSH host `mi350-2`. This is a
recorded CPU-observation/UI qualification, not a compiler release attestation,
live GPU capture or curriculum-maturity promotion.

## Existing recorded memory milestone

The #281 V1 recorded-memory exit is met for the supported retained global and
LDS captures. The site renders actual source-produced allocation/access data,
bounded memory windows, initialization, lane filtering, access-event selection
and checkpoint navigation. Historical overlays join exact configuration,
anchor, allocation, generation, address-space and half-open ranges. WG0 history
does not paint WG1 storage; missing, stale, off-window and partial data stay
explicit. Tests cover bounded parsing/paging and desktop/mobile interaction.

The original single-workgroup capture retains 219 command pairs; the separate
two-workgroup capture retains 930 pairs and seven checkpoints. Their original
source/compiler/build pins are unchanged. Generation zero is observed data,
not a claim of allocation release/reuse. Supported import means the reviewed,
bounded retained-capture format, not arbitrary debugger transcripts.

V1 does not require V2 allocation lifetimes/repeated helper identities, V3
physical resources or V4 live hardware. Those remain unfinished. The umbrella
issue and full tutorial/curriculum milestones remain open.

## New bounded instruction-program draft

The new [authoring](ordered-program-authoring-v1.md) and
[debugger](ordered-program-debugger-v1.md) tutorials use compiler
`f5e81f985ff3e2771ad0f132d483f5cf74976ad6`, now reachable from both compiler
repositories' main history. Their separate pin does not change `FE2O3_PIN`.

The development-only preview reads
`examples/ordered_program_observation_v1.json`: 941,567 bytes,
SHA-256 `6ae5be6ed1843aff7c84ab9d57cb5bee740d44c5f2ec254baa5270eb46fce468`.
Its actual source batch contains six exports, eight expected source refusals,
36 independent CPU cases and 15 CLI negative controls. The public debugger
batch contains 36 sessions and 1,224 real request/response pairs; the display
retains nine selected whole pairs per session, not the entire transcript.

Source receipt SHA-256:
`e0efff8694beb6e9decebe3f95f5ba0940aecdc63e06dc58941ef985401dde9f`.
Debugger batch receipt SHA-256:
`7b61dfb1f581830779da2352afbcf3589b437f6d62dd3653abf7809201167893`.
Original full records and task receipts remain on the named host.

The view shows declared instruction/register roles and lane-zero logical
before/after/reverse/repeat observations. The whole program is one CPU
operation. Unqueried values, physical VGPR/EXEC contents, scratch intermediates,
instruction microsteps, allocator lifetimes and hardware timing are unavailable.
Changing a view never edits source, builds, resumes or launches anything.

## Frozen-code checks

The implementation and tutorial candidate, before adding this evidence-only
summary, had fingerprint
`f65aa12850be6df911a4e4db94bb49b5707611df192ffec5742dbf5e1c814557`
(469 files, 14,113,520 bytes). Each gate verified unchanged before/after bytes:

- `npm run validate`: lint, type checking, 384 unit tests and production build.
- `npm run validate:evidence` and both single/multi-workgroup LDS validators.
- All 25 bounded instruction-program parser/export controls, including all
  36 actual cases and retained synthetic/null negatives.
- `npm run test:e2e`: 68 desktop/mobile cases, including actual and synthetic
  instruction-program views, both themes, keyboard focus and selection reset.
- Manual inspection of the actual desktop-light and mobile-dark screenshots.

The pure-control receipt is `phase10-site-pure-r3`; validation/evidence receipts
are `phase8-site-*-r11`; browser receipt is `phase10-site-e2e-all-r3`.
These are separate runs, not an aggregate count of independent tests.
Publication and remote main-ref readback are recorded separately.

No package configuration, curriculum route, shared compiler baseline pin,
existing capture identity or maturity label changed. The draft HTML is a
development preview, not an added deployed lesson route.
