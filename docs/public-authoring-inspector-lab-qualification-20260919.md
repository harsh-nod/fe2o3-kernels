# Public authoring lab: current-host qualification — 2026-09-19

The [lab](public-authoring-inspector-lab-v1.md) passed its complete 36-stage
semantic ladder on mi350-2 using current measured host tools and two fresh
source-only worktrees at public compiler commit
`0b0e6c0d22f4aa5b10ddae702575eb85c7250ca7`.
This is NOT a clean-public-0b host-build reproduction. That build sequence in
the guide remains a recipe; current tools and public fixture revisions are
separate provenance domains.

Host tools came from primary compiler parent HEAD
`123363584d329bb4d6aa2d528e0515d5eea04361` plus reviewed lifecycle/console
changes. The successful locked/offline host build r19 had an unchanged
Rust/Cargo/crate-README census, joined to current source using its original
hash framing. Its receipt contains no binary hashes or HEAD: the qualification
measures selected binaries separately, not authenticated build attestation.

## Actual results

- Two fresh exports from original/edited Rust source, two inspections.
- Twelve simulations: all 768 output words, 96 guard bytes and exact
  initialization bits checked against independent BigInt arithmetic.
- Two diagnostic LLVM outputs joined to canonical identity, raw input bytes,
  descriptors and the five-register plan; no HSACO or GPU run.
- Two actual debugger sessions, 34 commands each, with all 64 output lanes
  and their write histories checked.
- Two real source refusals: aliasing physical roles and incompatible required/
  maximum workgroup bounds. Each had the exact extraction-stage diagnostic,
  exit 1, no signal/timeout and no emitted KIR.

The single active edit changes XOR to OR. This deliberately changes the
algorithm, not an optimization-equivalence claim. The six expected words are
`[0, 1, 3, 2147483648, 1431677625, 23]` for original and the same list ending
in `21` for edited. Descriptors change from `[133,307,413]` to `[132,307,413]`;
register plan stays `[32,33,34,35,36]`.

| Domain | Original | Edited |
| --- | --- | --- |
| KIR17 canonical identity | `0952d7fef9f05aaa15bf31243ca4eaac3572e026596d1a0b8daa8ddea1c7ed07` | `c3638cd2864063f120257610915ab0c5d753b09782b10a9e4d33cb9e1372a5dd` |
| Raw KIR file SHA-256 | `4f00f63022187b7e7b5fd65a0537207a5845e29e880e695a63424bd2afc1ebe5` | `6ecb24844a54aa8b2af7b7b193923b6c9846d8b3bd50062dfe7310959c7e78ff` |

Each KIR is 1,397 bytes. Raw file digests and typed canonical identities must
not be interchanged. The public helper joins result identities to inspection
and checks KIR length; it alone does not detect a same-size KIR substitution.
The retained qualification additionally pins and rechecks actual source, KIR,
inspection, request, lowering and debugger files.

## Exact evidence and retained failures

Under `/home/harmenon/fe2o3-authoring-280-282.FEW3gj/`:

- `rebuildable-cache-phase10.fpFy5o/secondary/phase11-public-authoring-lab-r2/receipt.json`:
  46,241 bytes; SHA-256
  `882a805ae4bc1a8a5660629ab2c9cebde2f530e39169cc9aaba73b3d41691743`.
- Its `worker.json`: 369,366 bytes; SHA-256
  `b9ff1dd6ca9c46e4071dd8520d6846bf6a73957d4d1db7447b5905976b960c53`.

All 42 output artifacts and 36 stage records were rechecked. Before/after
compiler census: 5,982 files, 91,658,600 bytes, SHA-256
`b6462e977e63d9c7e5b9b827897cddca5ad7eb78a7d07978a07fc668929dce66`.
Site parent HEAD `31317dd8bf33a354f4fbc1894a9a250c04c31b94` plus four lab files:
508 files, 14,409,247 bytes, full-tree SHA-256
`47f11f25f41f1287b539d569e13812563cf51857191df6d9119c637873e21436`.
These are the runner's full-tree hash domains, not the site's differently
framed validation census. Later qualification prose is not in that snapshot.

Original r1 retains a failed harness check after the alias refusal: it
incorrectly expected a rustc `error:` prefix. The corrected copy accepts
exactly one full owner-specific extraction diagnostic and rejects duplicates,
wrong profiles, suffixes and setup/crash outcomes. Five pure harness controls
passed before the fresh complete r2 rerun. No r1 failure was converted to pass.
An earlier outer-wrapper timeout-bound refusal happened before launching r1;
its attempt record is also retained.

Two build jobs, separate source-only worktrees/device targets, offline/locked
compilation, 20 GiB combined storage, 40 GiB free disk and 64 GiB available RAM
guards remained enabled. Combined charged storage ended at 18,477,180,566 bytes.
Outer gate time was 130,622 ms, not an approved performance budget. Bounds are
observations, not quotas or complete process-tree/loader-closure guarantees.

The helper has five independent pure tests, now included by
`npm run test:authoring-lab` in `npm run validate`. No curriculum pin, maturity
label, source authentication, physical VGPR contents, allocation reuse, final
machine artifact, protected proof or whole M2/V2/U2/U4 milestone is claimed.
