# LDS address-pattern model qualification — 2026-09-20

The [selected-access tutorial](lds-bank-analysis-v1.md) now has executable site
qualification. This is a read-only arithmetic model over one selected retained
CPU range, not a native bank-conflict detector. No original #281 milestone is
closed.

## Exact tested inputs

The working tree was based on published site
`baec79a49dfdcb78cfbc8db70233b8ccaf16bd3c`, with the nine new implementation,
test and tutorial files, the ResourceAccessView hook and README discovery link.
All three gates measured the same unchanged complete site input census:
518 files, 14,461,757 bytes, SHA-256
`33e7d21badeb106ee53787eb7de1c9f91a93f8c7f0b0c434cf30bf84b2b02395`.
This report and its guide link were added afterward; the census is not
relabeled as a later commit identity.

Execution was on SSH host `mi350-2`, Node 22.22.3, using the existing locked
dependencies and unchanged validation commands. Browser workers were limited
to two. Each receipt reports exit 0, no signal/timeout, stable source census
and successful pre/post storage/RAM guards.

| Gate | Result | Receipt bytes / SHA-256 |
| --- | --- | --- |
| `phase11-site-validate-r11` | lint, typecheck, 442 Vitest tests, 5 lab controls, production build passed | 901 / `6a7374b7294b9e96a2efb99020e9f72c9fbd2ae14a58b128590ab78d07bb41e3` |
| `phase11-site-evidence-r10` | unchanged evidence/publication validation passed | 905 / `f279103025c9a43777e0354bc92987e4d606690f15cc224a43886964b8cc000b` |
| `phase11-site-e2e-r8` | all 86 desktop/mobile browser tests passed, including four new LDS cases | 1054 / `b676aec27cab4bbc09dc1f3f36e8fa31d3c5d9fc2bd509adc17db1b4710988a8` |

These are retained task-local observation receipts, not authenticated execution
attestations or copies of artifacts stored in this repository.

## Checks and retained images

The added 27 unit/component cases cover explicit target selection, independent
address tables and per-byte bit-mask oracle, unaligned ranges/base residues,
large-u64 arithmetic, overflow, complete-range caps, same-word versus
different-word comparison, missing/stale/filtered selection, non-LDS access,
unknown target, incomplete pages and synchronous reset. They do not execute
a native instruction.

Browser cases cover keyboard expansion, changing/invalidating assumptions,
selected-event navigation, unchanged checkpoint state, empty continuation,
checkpoint replacement, close behavior and desktop/mobile layout.
The selected-range test records both themes, checks no network request during
its model interactions, and keeps rendered panel descendants below 240.
No performance SLO, heap ceiling or universal accessibility certification is
inferred from these checks.

| Retained screenshot | Bytes | SHA-256 |
| --- | ---: | --- |
| desktop light | 170,854 | `be0a8472e1f8d023372e46f613de8ef8cadfb470b768de5974e236cb40281865` |
| desktop dark | 178,763 | `c0c9b849605a68cfe9c32c34c46516e95a4d778e59f85571d074cc9b473d0e4a` |
| mobile light | 718,948 | `799bd8b5f9d28f1730966e686bb4523f5b642d6b8779e98a2989cb1a01a6a0b2` |
| mobile dark | 729,857 | `954b7845b36d2b0264e381ea010a1dd3113bb6255139cd03150c926410e97f3b` |

Root additionally inspected the desktop dark and mobile light images. The
retained images are not native observations.

## Remaining boundaries

The supported geometry profiles are CDNA3/gfx942 and CDNA4/gfx950; exact
accepted target spellings and AMD references are in the tutorial. The target
remains caller-owned, allocation placement is unavailable, and the base residue
is an explicit assumption. One complete access is bounded to 256 bytes,
65 modeled dwords and 64 banks. Existing access/memory view limits are unchanged.

This does not provide a same-stop hardware adapter, native instruction/lane/
phase grouping, bank-conflict counts, multicast detection, GPU timing,
allocation reuse identity or final-artifact lineage. V2/V4 and the original
contract/end-to-end milestone exits remain open. No curriculum evidence pin,
maturity label, capture schema or compiler publication is advanced.
