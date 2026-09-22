# Lab: compare source edits with retained final-native bytes

This read-only comparison follows the [instruction-edit lab](source-promotion-instruction-edit-lab-v1.md)
from exact Rust and LLVM inputs to four complete retained HSACO code objects:
default and edited source, each at O0 and O3. It is a separate evidence profile
from the existing CPU-only source-variant comparison.

The new viewer has passed real-capsule, full-site and desktop/mobile checks.
The underlying source/native observations and the separate viewer qualification
are recorded below; neither establishes hardware execution or proof authority.

## 1. Know which source change you are comparing

The original prefix-free Rust initializer is:

```rust
let selected = b ^ ((a ^ b) & mask);
```

The public source publisher produced an ordered XOR / AND / XOR expression.
The edited source changes only its last instruction:

```rust
let selected = fe2o3_device::amdgpu_ordered_program! {
    gfx942_xnack_off_wave64;
    scratch(4); out(5);
    in(0) = a;
    in(1) = b;
    in(2) = mask;
    xor(scratch, input0, input1);
    and(scratch, scratch, input2);
    or(out, input1, scratch);
};
```

The default has `xor(out, input1, scratch);` in the final line instead.
All register roles, the first two instructions, input bindings, kernel
signature, launch bounds and checked store are unchanged. This view does not
cover the earlier live-prefix or high-register variants.

| Variant | Independent u32 formula |
| --- | --- |
| Default XOR / AND / XOR | `(a & mask) \| (b & !mask)` |
| Edited XOR / AND / OR | `b \| (a & mask)` |

This is an intentional algorithm change, not an equivalent optimization.
For `a=0`, `b=0xffffffff`, `mask=0xffffffff`, default produces zero while
edited produces `0xffffffff`. The source acceptance used the corresponding
independent oracle; observing the expected native opcode alone does not
establish that either formula matches your application's intent.

## 2. Understand the exact 14-artifact input

The new schema is `fe2o3-final-native-comparison-example-v1`. Its contents are:

| Artifact group | Count | Purpose |
| --- | ---: | --- |
| Original strict source/native join | 1 | Selected identities, native cases and interpretation limits. |
| Original source acceptance receipt | 1 | Three exports, source/semantic/KIR identities and reported CPU checks. |
| Original, generated-default and instruction-edited Rust texts | 3 | Exact publication/edit boundary and source bytes. |
| Default, edited and repeated-edited LLVM texts | 3 | Exact inputs selected by the source run; repeat identity check. |
| Default and edited native observer reports | 2 | Original schemas, O0/O3 observations, offsets and resource fields. |
| Complete default/edited × O0/O3 HSACO payloads | 4 | Whole-file hashes and exact instruction/descriptor byte slices. |

That is 14 selected artifacts, not the whole compiler/dependency closure.
The original strict join's larger pin ledger remains recorded, but its other
named files are not fetched by a browser. The view reports the retained
three-export/90-CPU-simulation result; it does not replay raw simulator
transcripts or execute native code.

Three LLVM inputs do not imply six native cases: only default and edited were
compiled by the retained native observer. Repeated edited source/semantic/KIR/
LLVM agreement is checked, while separate repeat-native execution stays false.

The adapter must hash every selected text and every complete payload before
showing a comparison. It checks the original schemas and false authority flags,
the exact one-initializer publication and one-opcode source edit, changed
body-sensitive identities and repeated-edited agreement. The fixed
target/function/root/contract inventory stays equal; it is not an opcode digest.

## 3. Read declared registers and encoded capacities separately

In the website, open **Debugger → Cross-layer inspection → Open final native
comparison**. The four case buttons select one source/LLVM/native observation
together. The component heading is **Source instruction edit → retained
final-native bytes**. This is an offline retained comparison, not a live debugger
or a production compilation route.

The retained resource observations are:

| Case | Declared VGPR high-water | Encoded VGPR capacity | Architected boundary | Whole HSACO bytes |
| --- | ---: | ---: | ---: | ---: |
| Default O0 | 6 | 24 | 8 | 6152 |
| Default O3 | 6 | 8 | 8 | 5384 |
| Edited O0 | 6 | 24 | 8 | 6152 |
| Edited O3 | 6 | 8 | 8 | 5384 |

The source uses five distinct roles in VGPRs `0,1,2,4,5`; its high-water is
`max(register)+1 = 6`, not a claim that it uses exactly six registers.
LLVM still compiles the surrounding kernel. A descriptor capacity of 24 or 8
is a static encoding for the whole kernel, not a measured count of live values
inside the selected three-instruction region.

The view independently hashes the exact 64-byte descriptor and reads its
little-endian `compute_pgm_rsrc1` and `compute_pgm_rsrc3` words at byte offsets
48 and 44 inside that descriptor. For this closed gfx942 Wave64 profile, it
recomputes the retained interpretation:

```text
encoded_capacity = ((rsrc1 & 63) + 1) * 8
architected_boundary = ((rsrc3 & 63) + 1) * 4
encoded_capacity >= architected_boundary >= declared_high_water
```

O0 records `rsrc1=11468930`, O3 records `rsrc1=11468928`, and both use
`rsrc3=1`. These values do not establish occupancy, performance, register
liveness, allocation correctness or runtime physical-register values.
The formulas are this profile's retained interpretation, not a generic decoder
for every AMD target or wave mode.

## 4. Inspect exact complete-file byte offsets

The selected program keeps these operands in both source variants:

| Step | Machine bytes | Explicit register operands |
| --- | --- | --- |
| XOR | `0003082a` | `v4, v0, v1` |
| AND | `04050826` | `v4, v4, v2` |
| Final default XOR | `01090a2a` | `v5, v1, v4` |
| Final edited OR | `01090a28` | `v5, v1, v4` |

The retained reports name `V_XOR_B32_e32_vi`, `V_AND_B32_e32_vi` and, for
the edited last step, `V_OR_B32_e32_vi`. Each reads EXEC and has no implicit
writes in these observations.

| Optimization, both variants | Three instruction file offsets | Descriptor file offset |
| --- | --- | ---: |
| O0 | `2692, 2696, 2700` | 2368 |
| O3 | `2340, 2344, 2348` | 2048 |

These are offsets from byte zero of the **complete HSACO file**, not offsets
inside a text section or a result of searching for a matching byte sequence.
The adapter requires contiguous four-byte instructions within the reported
entry range, exact profile/opcode/operand/effect fields and matching slices
at those offsets. The descriptor must be in bounds and disjoint from entry code.

The whole-file hash covers bytes outside those selected slices too. However,
hashing a whole code object does not prove the semantics of all its instructions
or the stability of whole-kernel instruction order. Opcode names and offset
locations come from the retained observer report; the browser is not a new
ELF decoder or disassembler.

## 5. Treat refusals and trust boundaries as part of the comparison

A changed join selection immediately clears the old source and native rows.
An old asynchronous completion must not replace a newer refusal. The adapter
copies bounded primitive fields before its first hash; unavailable WebCrypto
produces an unavailable state, not a synthetic substitute.

Expected refusals include a stale selected join, substituted/reordered payloads,
a changed whole-file byte, mismatched instruction or descriptor slices,
unsupported effects, stale source/LLVM identities, impossible resource claims
and fabricated proof/source/runtime authority. Refusal means no comparison
is shown; it does not authorize changing the checks to accept the payload.

The caller-selected expected join SHA is an integrity pin, **not trusted
compiler provenance**. If a caller also selects a fabricated, self-consistent
record's digest, hash consistency cannot discover its fabricated origin.
Synthetic control inputs remain visibly synthetic. The original native report
authority is `unauthenticated-test-transport`; source authentication and
compiler/runtime closure attestation remain unavailable.

This is read-only. There are no compiler, source-edit, native execution,
load/launch, fetch or production-resume controls. Source/KIR identity matching
is not protected proof-cache invalidation. No hardware result, native
whole-kernel correctness, lifetime proof, final allocation proof or performance
claim follows from the display.

## Reproduce the capsule without rebuilding the kernels

The website's `scripts/export-final-native-comparison.mjs` takes six explicit
options:

```text
PINNED_NODE scripts/export-final-native-comparison.mjs
  --join ABSOLUTE_ORIGINAL_JOIN_JSON
  --expected-join-sha256 INDEPENDENTLY_SELECTED_JOIN_SHA256
  --source-root ABSOLUTE_ORIGINAL_SOURCE_RUN_DIRECTORY
  --default-native-root ABSOLUTE_ORIGINAL_DEFAULT_NATIVE_DIRECTORY
  --edited-native-root ABSOLUTE_ORIGINAL_EDITED_NATIVE_DIRECTORY
  --output NEW_ABSOLUTE_JSON_FILE
```

These capitalized values describe argv replacement slots. The output parent
must exist, and the output must be absent and outside the original input
directories. The exporter reads only those explicit original files; it checks
their regular-file/no-symlink identities, full hashes and strict-join metadata,
then rechecks all selected inputs before exclusive output creation. Copying
inputs to new paths or changing their metadata is not silently accepted as the
same retained original. It does not invoke a compiler or native observer.

Bounds are 14 selected artifacts, exactly four payloads, 256 KiB per join/source
receipt, 64 KiB per source/LLVM/native report/payload, and 2 MiB total decoded
selected bytes and serialized output. Hex is bounded to twice the exact byte
count. The shared parser rejects duplicate keys and over-limit depth, nodes,
strings and integers. Parent-directory custody, process/RSS/storage and external
deadlines remain supervisor responsibilities, not properties of the browser.
An output failure may leave a partial new file; no rollback is promised.

Use a new capsule and new validation receipts. Do not relabel the old CPU-only
comparison schema or reuse a failed output as a successful export.

## Underlying retained evidence: 2026-09-22

These originals establish the earlier finite source/native observation.
The new viewer qualification is recorded separately below.
The source and strict-join supervisors both report `command-passed` with zero
exit; the source receipt reports three normal exports and 90 CPU simulations;
the strict join reports four native cases and four complete retained payloads.

Paths below are relative to
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr` on mi350.
They identify retained task evidence, not web fetch paths.

| Retained record | Bytes | SHA-256 |
| --- | ---: | --- |
| `logs/phase19b-instruction-native-join-r1/join.json` | 140747 | `5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162` |
| `logs/phase19b-instruction-native-join-r1/receipt.json` — supervisor | 64140 | `9e3c77907c37abce49febe91db7c6b20f67967b27d8f600ad7ed41c6c8e766f5` |
| `logs/phase19b-source-instruction-edit-r1/receipt.json` | 248601 | `cee8b86f0d4c7f22cb0e868ebd0ca7dadf6f1f2740ad4a1ba7befc2239b8f6e9` |
| `logs/phase19b-instruction-source-r1/receipt.json` — supervisor | 36853 | `2a5324746ef8cd82460b874c18cdd1a94a096e6bc1f38a98950cf709e11cfdfc` |
| `logs/phase19b-instruction-native-default-r1/command.stdout` | 9061 | `7cdfd7f2aa951f74ae016a31204b53bcfdb557ad12cd1353fc3db71434f05bd8` |
| `logs/phase19b-instruction-native-edited-r1/command.stdout` | 9056 | `28b2156b3ef2b2d0a464ea36616f00ea7bd21abbcb70775301cb44cee0838557` |

The native supervisor receipts also passed: default is 117,403 bytes / SHA
`f854733ba5f3781457fa2758ac6711e381c144bfff5e2e06dfeea7d5e41cfbcb`;
edited is 117,390 bytes / SHA
`0e0302da6da3583a00f8f57515a76f7a8320986ec22a55bfed4b1e0011448a9a`.
Each is `receipt.json` beside its original `command.stdout`.

Complete payloads are `payloads/O0.hsaco` and `payloads/O3.hsaco` under the
corresponding native-run directory:

| Payload | Bytes | Complete-file SHA-256 |
| --- | ---: | --- |
| Default O0 | 6152 | `0786de8ada4300d144018ac871fe384065b0f225b8e25dc423bc6c8a3454ba41` |
| Default O3 | 5384 | `9484ee4d7f5f75730367a49ed960e4608ce07fb76c3415bb91e302f1ddea49c7` |
| Edited O0 | 6152 | `f39f619d9db7dc56f72b31dae527b926f9cf65004c2dd8e92092e77331f11a04` |
| Edited O3 | 5384 | `e37254dc428d1bdb680fccd3c3f52769caa6b85d24e070aba0d4935c780709cd` |

The original input source/semantic/KIR/LLVM identities, failed earlier attempt
and detailed observer controls remain documented in the
[instruction-edit lab](source-promotion-instruction-edit-lab-v1.md) and
[dated qualification](helper-instruction-qualification-20260922.md). Those
records are not replaced or enlarged by this new display profile.

## Viewer qualification: 2026-09-22

The new exporter, adapter and page were independently exercised against the
retained originals. The first export exposed a JavaScript prototype mismatch:
the lossless parser returns null-prototype records, while filesystem pins use
normal objects. The corrected comparison retains every exact own field after
closed-schema validation; it changes no metadata, path, byte or hash requirement.
That failed attempt is retained as `phase20-site-native-export-unit-r1`.

The fresh successful export contains 14 originals / 440,737 decoded bytes.
The checked-in [capsule](../examples/source_instruction_native_comparison_v1.json)
is 503,416 bytes, SHA-256
`0b4a9689524965929d1e9b102d7802e737e068293f74fa28d0148ab49238cc04`.
Its independently selected join pin is unchanged from the table above.

| Fresh check | Result | Supervisor receipt SHA-256 |
| --- | --- | --- |
| `phase20-site-native-export-unit-r2` | Real export, 17 synthetic adapter and 6 mocked UI groups, TypeScript pass | `fedb3d7367979b5b9b73860b78a2db3c846aba2de0d87c8ba1c30a43e7a1bf83` |
| `phase20-site-native-actual-validate-r2` | Stale selected digest and existing-output refusals; lint, typecheck, 939 Vitest tests / 67 files, 21 Node controls, build and unchanged evidence checks pass | `9715026dc4ad7ea57420e883820e7154f686ad2506c7aa148f24dbc44374a387` |
| `phase20-site-native-e2e-r1` | Three cases on desktop and mobile: 6 pass, no skip, retry or flake | `5722d6b8356d55bde90718c72a56dc44051b0853ab5b79d480f07fe10f2a3e8f` |

These `receipt.json` files are under `logs/<label>/` in the qualification
root above. Their byte lengths are 40,332, 45,511 and 45,654 respectively.
The successful full-site run includes seven actual-capsule tests in addition
to the 23 parser/UI controls. They pin every whole artifact, check descriptor
words and exact slices independently, and retain the prototype regression.

Both real exporter refusals left the successful capsule's bytes and filesystem
identity unchanged; the wrong-pin destination remained absent. Browser checks
cover all four cases, exact source/opcode/offset changes, keyboard selection,
light/dark layout, close/reopen clearing and coexistence with the unchanged
CPU-only source view. Synthetic stale-selection and late-completion controls
remain separately identified; no fabricated fixture replaces the real capsule.

The tested pre-documentation site census was 630 files / 16,154,508 bytes,
SHA-256 `4e0c656463ecbcfa1c36e25c4741c41d5b13c7f70f905b4a600059683b703fb7`.
That is a source-content observation, not a published commit or deployment pin.
Later documentation/publication policy checks are separate.

This qualifies only the stated read-only comparison. It neither closes broad
authoring/debugger/multi-level milestones nor changes the curriculum baseline,
proof authority or hardware availability.
