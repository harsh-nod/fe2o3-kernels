# Helper replay and instruction-edit qualification: 2026-09-22

This is a finite diagnostic qualification for issues #280, #281 and #282,
not a production-proof, hardware or complete-milestone claim.

## Reproducible workflows

- [Helper-frame source values](resource-helper-source-values-v2.md): a genuine
  normal CPU debugger recording with separate caller/helper frames, complete
  source-variable pages, SSA and memory, reverse and repeat.
- [Instruction-changing source promotion](source-promotion-instruction-edit-lab-v1.md):
  a published Rust region whose final XOR is edited to OR, three fresh normal
  source exports and separate O0/O3 final-code inspection.
- The [retained helper example](../examples/helper-source-variable-resource-v2/README.md)
  includes the original excerpt, receipt and provenance, not recreated values.

## Tested content and site checks

The compiler bases were harsh-nod/fe2o3
`dc48d876cd5434e5d8e409a53177f8d43fe5a839` and powderluv/fe2o3
`4a4426669aa73414c7197e7849474b293aebc32c`; the site base was
`1f137395bba2260a5bcf701f2c026212134a8200`.

The site code/example census tested before this documentation-only finalization
was 616 files / 15,485,362 bytes, SHA256
`0dcf8abb22b9e7fb2df6f828e4d81820045a4bcd1749507b4e9014e734d3cd94`.
Censuses hash sorted tracked plus unignored file paths and bytes, separated by
NUL; they are content observations, not source authentication.

On mi350, pinned Node 22.22.3 and retained browser dependencies:

- `npm run validate`: lint, typecheck, build, 909 Vitest tests across 64 files,
  and 21 Node controls passed. Existing bundle-size warning remains.
- `npm run validate:evidence` against the explicit compiler candidate passed:
  44 commits, 109 evidence records, 112 source tabs, seven local artifacts,
  14 getting-started, 23 debugging and three source/ISA checks.
  The 56-lesson / 306-tab curriculum remains pending; zero issue-state checks
  are not milestone closure.
- Desktop/mobile Playwright: 142 passed, zero skipped, flaky or unexpected,
  retries zero, workers two, 219,738 ms. The six actual-helper cases include
  both projects. Replacement/reset clearing and root-frame compatibility passed.
  A mobile light-mode capture was also visually inspected.

The supervisor receipt for validation is 25,127 bytes, SHA256
`d345ad86ffc20b2f95312ce66525578cad0a2dbcdc2fb9a61d89f47c434f8ead`.
The browser receipt is 27,539 bytes, SHA256
`de4edeb7454351b7bed41282dd5808a8c8f3f43cd77becc6ba6ec577c309513d`;
its retained command stdout containing the original Playwright JSON report is
165,428 bytes, SHA256
`34dc243cc21cc26374d8596835a04e880ab02e2b6cada978db9ef59f2a0193ae`.
Task-local retained records use the `phase19b-site-actual-validate-r3` and
`phase19b-site-e2e-r1` labels. These hashes are locators for retained evidence;
the large compiler/browser build products are not bundled into the website.

## Source and final-code observations

The helper capture has 29 full request/response pairs. Its unchanged 15-pair
browser excerpt is 29,813 bytes: events/revisions 3/3, 2/4 and 3/5.
Caller frame 1 stays distinct from helper frame 2; helper SSA row count changes
2 to 1 to 2 while the recorded parameter remains raw f32 bits `0x3f800000`.
The missing local stays unavailable. Five exact refusals leave the checkpoint
unchanged. A separate complete CPU run checks four outputs plus a tail canary.
Neither a source-to-SSA map nor allocation reuse is represented.

The fresh instruction-edit run passed 100 child stages, three normal source
exports and 90 independent whole-buffer CPU checks. The edited/repeated source,
semantic MIR, canonical KIR and LLVM agree; each differs from the default
where appropriate. Target/function/root/contract inventory is intentionally
identical: it is not an instruction-body digest.

Actual final-code observers produced default/edited O0/O3 reports and four
complete HSACO payloads. The strict join re-read those full bytes, source LLVM,
raw stages and receipts; it verified instruction and descriptor offsets, not
just supplied hashes. The join is 140,747 bytes, SHA256
`5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162`.
Its external supervisor receipt is 64,140 bytes, SHA256
`9e3c77907c37abce49febe91db7c6b20f67967b27d8f600ad7ed41c6c8e766f5`.
All detailed payload/identity pins and declared-versus-encoded resource values
are in the instruction-edit tutorial. No GPU execution is inferred from these
native files.

## Refusals and limits

Earlier failed attempts are retained, not overwritten: an inventory-inequality
expectation was wrong because inventory does not hash body opcodes; the corrected
driver requires exact inventory equality, adds negative controls, and passed a
fresh full run. An initial browser-import control expected stale-revision
rejection for an input whose request ID was already invalid; the corrected
test asserts the existing rejection order and separately exercises true stale
revision. The importer behavior was not weakened.

The envelope explicitly increased retained task-root storage from 80 to 96 GiB
before independent mirror qualification, retaining prior failures. It retains
a 40 GiB free-disk reserve, 64 GiB available-RAM reserve and bounded command
deadlines. Sampled resource observations are not hard RSS enforcement or a
transitive toolchain attestation.

M1, V1 and U1 remain the accepted broad milestones (3/18). These changes advance
M2/M5, V2 and U2; they do not close all their exits. Current-owner inspection and
capture rejection are not general proof-cache invalidation. Watch/fault
integration, repeated activation and allocation reuse, wider authored
control/memory/matrix contracts, protected production continuation, checked
recipes and the tiled curriculum retain their existing dependencies.
