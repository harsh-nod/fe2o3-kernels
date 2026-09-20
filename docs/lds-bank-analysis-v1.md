# LDS address-pattern analysis

This is a bounded, read-only model beside a selected recorded CPU access. It is not a bank-conflict detector, a native transaction trace, or a performance predictor. The [site qualification](lds-bank-analysis-qualification-20260920.md) records actual unit and browser checks; no new #281 milestone is closed by this document.

## Try it

1. Open **CPU semantic simulation**, then **Open two-workgroup LDS example**.
2. Choose the retained checkpoint at cursor 16080, revision 15, and the historical WG0 access page.
3. Expand **LDS address-pattern model — assumed layout** beneath the selected retained access.
4. The initial selected row is event 12, allocation 2, generation 0: its recorded byte offset and length are inputs. Its physical placement is unavailable.
5. With assumed allocation-base residue 0, the recorded four-byte range at offset 0 maps to one modeled dword. Set the assumption to 1: the same range touches three bytes of modeled bank 0 and one byte of bank 1. No captured value, event or checkpoint changes.
6. Move to another retained access or checkpoint. The assumed base resets to 0. Empty pages and invalid selections show no modeled footprint; they do not borrow a nearby row.

The page may contain historical accesses to an allocation absent from the current inventory. Modeling one such range does not make the allocation live. Generation 0 remains this CPU producer's profile, not evidence of allocation reuse.

## What the numbers mean

The model uses four-byte interleaving:

```text
normalized_address = assumed_base_residue + allocation_relative_offset
modeled_bank = floor(normalized_address / 4) mod bank_count
```

Every touched four-byte word is counted once, and only bytes inside the selected half-open range are charged. The UI shows distinct modeled words and byte counts per modeled bank. Several distinct words mapping to one bank do not establish a conflict: these are pieces of one recorded range, not simultaneous lane transactions.

The base is a user-selected residue within one interleave period, not an observed physical address. Byte-unaligned residues are permitted as explicit scenarios; alignment is not inferred from access width. A different byte residue can split a word, not merely rotate the bank labels. The current access rows have no allocation alignment field, so no inventory alignment join is claimed.

| Explicit target spellings | Geometry | Allowed assumed base residue |
| --- | --- | --- |
| `gfx942`, `gfx942:xnack-` | CDNA3, 32 modeled banks × 4 bytes | 0–127 |
| `gfx950`, `gfx950:xnack-` | CDNA4, 64 modeled banks × 4 bytes | 0–255 |

Other targets, feature spellings and absent targets are unavailable; there is no family/prefix fallback. The existing caller-owned context selects this profile. It is a stale-state fence, not an attested execution target. In particular, locally imported JSONL recordings have a null target and cannot silently acquire a profile here.

Native instruction identity, actual allocation placement, hardware wave participants, dynamic instruction grouping, transaction phases, multicast behavior, conflicts and timings are unavailable. Logical wave32 labels in these CPU recordings are not evidence of physical AMD wave grouping. The same-word versus different-word helper only classifies arithmetic addresses; it does not report hardware broadcasts.

## Bounds and provenance

- One exact currently selected row from the already-validated Resource V1 page; no additional backend requests or all-history scans.
- Full existing page, source/scope/cursor/revision and caller capture/target/variant fences are retained. Missing explicit events and filtered-out selections are unavailable, never normalized into a different modeled row.
- At most 256 bytes in the selected access, 65 touched four-byte words and 64 bank cells. A larger access is unavailable in full; no prefix is substituted.
- Byte offsets, lengths and checked additions use `bigint`. Canonical u64 decimal strings and the existing conservative exclusive-end bound are preserved. Assumed-base addition is checked separately.
- Existing 64-visible-access-row and 256-visible-memory-byte limits are unchanged. Model state resets synchronously on page/row/target replacement.
- Truncated captures and additional pages remain explicit. Missing accesses cannot establish inactivity.
- No compiler mutation, debugger stepping, network upload, attach, build or launch.

Large-u64 tests are arithmetic controls only. They are not physically realizable LDS allocation examples. This analysis does not check target LDS capacity, native instruction legality, placement, alignment, race freedom or synchronization.

## Primary references

The [AMD Instinct MI300 CDNA3 ISA reference](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/instruction-set-architectures/amd-instinct-mi300-cdna3-instruction-set-architecture.pdf), dated 5 August 2025, §§2.2.1 and 11.1 (printed pages 6 and 84), specifies 32 four-byte LDS banks. The [AMD CDNA4 ISA reference](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/instruction-set-architectures/amd-instinct-cdna4-instruction-set-architecture.pdf), same cover date, §§2.2.1 and 11.1 (printed pages 6 and 95), specifies 64 four-byte banks. Independent bounded SSH reads on mi350-2 measured:

| Reference | Bytes | SHA-256 |
| --- | ---: | --- |
| CDNA3 ISA | 4,440,087 | `0cec4237cd93ce7dd76ee8502771429eb2308ab47dfa389f5bcc34f5903a6e2a` |
| CDNA4 ISA | 4,596,505 | `c459fb8db759006da52df57b5d7b913686ed7a68b52dc76e3f557f553a5d667f` |

The [official GPU architecture table](https://rocm.docs.amd.com/en/latest/reference/gpu-arch-specs.html), independently read through SSH, associates gfx942 with CDNA3 and gfx950 with CDNA4. Reference bytes were read in memory for this review; no PDF was copied into the repository.

The [AMD CK bank-conflict discussion](https://rocm.docs.amd.com/projects/composable_kernel/en/7.13.0-preview/conceptual/ck_tile/hardware/lds_bank_conflicts.html) describes the four-byte modulo interleaving model and shows that transaction grouping depends on the instruction. Its 32-bank examples are not transferred to CDNA4. The geometry alone does not define a phase, conflict, latency or bandwidth model.

The ISA wave-level LDS base granularity does not supply the missing mapping from this logical allocation to its native placement. Neither the documentation nor an assumed residue upgrades the CPU capture into a physical observation.

## Qualification recipe and remaining work

Run the three added Vitest files through the site's unchanged `npm run validate`, then run the focused `e2e/lds-bank-analysis.spec.ts` and full existing browser suite. Tests include fixed independent numeric tables, a separate per-byte bit-mask oracle, partial words, profile boundaries, large-u64/overflow refusals, identical-word versus distinct-word address comparisons, stale/missing selections, target changes, incomplete pages, keyboard controls and unchanged capture state. Test data derived by mutation is labeled synthetic, separate from unchanged recorded positives.

The model and viewer can be useful before live adapters exist. Full #281 V4 still requires reviewed exact target/same-stop bindings, supported hardware/session adapters and real qualification for those supported cells. No new resource protocol, capture schema, instruction-phase authority or milestone exit is introduced here.
