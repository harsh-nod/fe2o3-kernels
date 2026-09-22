# Lab: change one instruction after promoting ordinary Rust

Start with the [source-promotion lab](source-promotion-lab-v1.md). This follow-on
exercise changes the last XOR of its generated three-instruction expression to
OR, then compiles the actual edited source through the ordinary diagnostic
exporter. It is a deliberately different computation, not a bitselect
optimization or an equivalence-preserving register edit.

This lab describes a closed workflow and the observed 2026-09-22 run below.
That run completed normal public publication, three fresh diagnostic exports,
90 whole-kernel CPU simulations and a strict join to four native observations
with complete retained binaries. It does not extend the publisher's eligibility
grammar or qualify arbitrary instruction changes. Historical register-only or
live-prefix results do not qualify this edit.

## Recorded run and evidence boundary

The run used compiler base `dc48d876cd5434e5d8e409a53177f8d43fe5a839`
plus the measured Phase19 candidate changes, not the base commit alone.
The unchanged R4 input census before/after execution was 6,542 files,
99,471,766 bytes, SHA-256
`5d495fd39a493ca96453d3eb16dab926bc14ed7b48ed1c1ad84b982a8985ff31`.
This task census is not compiler/runtime closure attestation.

Evidence is retained on SSH host `mi350` under
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr`.
Paths below are relative to that private task root, not public fixture URLs.

| Retained evidence | Bytes | SHA-256 |
| --- | ---: | --- |
| `logs/phase19b-source-instruction-edit-r1/receipt.json` | 248601 | `cee8b86f0d4c7f22cb0e868ebd0ca7dadf6f1f2740ad4a1ba7befc2239b8f6e9` |
| `logs/phase19b-instruction-source-r1/receipt.json` (supervisor) | 36853 | `2a5324746ef8cd82460b874c18cdd1a94a096e6bc1f38a98950cf709e11cfdfc` |
| `logs/phase19b-instruction-native-join-r1/join.json` | 140747 | `5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162` |
| `logs/phase19b-instruction-native-join-r1/receipt.json` (supervisor) | 64140 | `9e3c77907c37abce49febe91db7c6b20f67967b27d8f600ad7ed41c6c8e766f5` |

The source receipt records 100 stages, three exports, 90 simulations and
287 retained pins totaling 136,603,451 bytes. The strict join completed with
`status: joined_observation`, 294 pins totaling 136,893,241 bytes, four native
optimization cases and four complete HSACO payloads. Its separate pure suite
passed 18/18 groups, zero skipped; those synthetic checks do not supply the
actual compilation or public-publication evidence.

The first source-run failure is preserved at
`logs/phase19-source-instruction-edit-r1/failure.json` (87,210 bytes,
SHA-256 `661a8e84dedd931677ffde334f99d97cd010b405a9eda99ff3edb8ab29be5066`).
It failed an incorrect `retained_source_inventory` inequality assertion.
The production inventory owner hashes function/root/contract identity, not
body opcodes: this fixed-root XOR-to-OR edit must preserve that census.
The corrected run used a fresh preparation, fresh output directory and the
explicit equality checks described below. The failure was not relabeled,
reused as a successful receipt or hidden by hash normalization.

These results are diagnostic observations, not source authentication,
ranked/protected proof, production resume or hardware qualification.
They do not close broad M2 or establish a general multi-level editing workflow.

## 1. Understand the two computations

The original Rust initializer is:

~~~rust
let selected = b ^ ((a ^ b) & mask);
~~~

The public publisher creates the corresponding low-register ordered expression.
Keep that candidate and the original source. In a distinct edited source copy,
change only the final operation:

~~~rust
let selected = fe2o3_device::amdgpu_ordered_program! {
    gfx942_xnack_off_wave64;
    scratch(4); out(5);
    in(0) = a;
    in(1) = b;
    in(2) = mask;
    xor(scratch, input0, input1);
    and(scratch, scratch, input2);
    or(out, input1, scratch); // The only change: xor -> or.
};
~~~

All five register roles, the first two instructions, input expressions, kernel
signature, launch bounds and checked output store stay unchanged. The smoke
script requires the exact prefix-free fixture; the optional live-prefix kernel
from the earlier lab is a different qualification subject.

| Source variant | Independent u32 oracle | a=0, b=0xffffffff, mask=0xffffffff |
| --- | --- | --- |
| Original Rust / generated XOR-AND-XOR | `(a & mask) | (b & !mask)` | `0x00000000` |
| Edited XOR-AND-OR | `b | (a & mask)` | `0xffffffff` |

The last OR retains every bit already set in `b`; it cannot implement the
original selector for all inputs. A successful compiler or inspector result
does not mean an algorithmic change is correct for the application's intended
formula. Decide whether the new formula is wanted, and check the matching
independent oracle. The runner uses bounded 32-bit BigInt arithmetic, not the
instruction descriptor interpreter, to compute expected outputs.

## 2. Prepare a genuinely current public seed

Work in the companion compiler checkout, using its pinned
`nightly-2026-04-03`, rustc-dev/rust-src components, retained lockfiles and
offline dependencies. Build the backend, `fe2o3-export-sim`,
`fe2o3-rustc-extract`, `fe2o3-program-inspect`, `fe2o3-kir-sim` and the existing
`lower_diagnostic_ordered_program_v17` example as one matching tool build.
The exporter needs its sibling extraction binary. Select measured executable
paths with the exact libraries from that build.

Build the external normal `fe2o3-source-bitselect-promote-once` consumer against
that final backend library and its matching `fe2o3_kernel_ir` dependency.
The recorded successful clients were compiled directly by pinned `rustc`,
without `--test` or `--cfg test`, into a separate new client-output directory.
Their explicit `--extern` paths selected the final tool build's backend DSO
and matching kernel-IR rlib; `-L dependency` selected that same dependency
directory. The matching toolchain library directory was supplied at link time
with `-L native`, and the toolchain/backend directories at load time.
The earlier client build without the native LLVM library search path failed;
its `logs/phase19-normal-client-build-r1` evidence remains a failure.

Do not sequentially build incompatible standalone-consumer and workspace
dependency graphs into the same Cargo target and then mix the resulting
clients, DSO or extraction tools. Sharing a revision or filename does not prove
their dependency identities match. Either use the recorded direct-rustc
linkage pattern with measured current artifacts, or isolate a fully matching
tool-and-client build. Do not copy the hashed rlib basename into a different
build; resolve and pin its actual matching artifact.

Selected successful-run inputs were:

| Input | Bytes | SHA-256 |
| --- | ---: | --- |
| Final `librustc_codegen_fe2o3.so` | 244562728 | `f2a3d9b5069f12b3f934ab0a29c081223649ab0b1b9501e538c3a005d4be6cf3` |
| Matching `libfe2o3_kernel_ir-3fb32cafa47078a3.rlib` | 47245236 | `c6777d1fbf835b61b8ebae86811618eaba2700e74b7cb6093786518e36742c44` |
| Normal `fe2o3-source-bitselect-promote-once` | 78656 | `32b971f7338b266c6ead91f2ba98e892612591bff854d8bc43e0c172773030a1` |
| `fe2o3-export-sim` | 736480 | `bd5c148cdd3c5ad69b1fc12c4690ef447a4d890c8a4e27063bda5dd8a54ab504` |
| `fe2o3-rustc-extract` | 209064 | `3c8007c0ee7be6ba5b8d718c969aabf175bf1ddb4fcf2ec53feada3744c517b1` |
| `lower_diagnostic_ordered_program_v17` | 30910952 | `f6a7398452b6923d2dea5d82fd7096108298c4626e7917586416f7a01ef46f6a` |

These selected pins are not the complete dependency closure; the retained
supervisor and build receipts preserve the wider measured input selections.
Tests prepare inputs or check refusals; they never substitute for the external
normal consumer's positive public publication. Its sources living under a
fixture directory do not turn its ordinary library calls into test callbacks.

The separate preparation helper runs in a freshly built Linux backend test
harness. It obtains actual provider/Cargo metadata and dependencies; it does not
publish the candidate. Set
`FE2O3_TEST_SOURCE_INSTRUCTION_PREPARE_OUTPUT` to a new absolute directory with
an existing task-owned parent and a safe ASCII basename of at most 96 bytes.
Invoke that harness with:

~~~text
--exact production_rustc_driver_v1::source_bitselect_feasibility_v1_tests::roundtrip::instruction_prepare::actual_source_instruction_edit_prepare --ignored --nocapture --test-threads=1
~~~

Require an actually executed successful test, not an empty filter or ignored
test. Retain its fresh `positive/headless-normal.invocation.json`, dependency
artifacts and provider records. Do not invent the argv, copy an old invocation
record, or substitute a coherent record from another preparation directory.

Preparation places `original.rs` and its loader under the compiler repository's
`target/source-bitselect-candidate-roundtrip/PREPARED_BASENAME/positive`.
The runner's normal consumer creates the new `instruction-default.rs` there.
Include that exact generated subtree in the task's write/resource scope;
the original source remains unchanged.

## 3. Run fresh compilation and simulation

These are the runner's exact option names. The capitalized values below are
replacement placeholders, not usable paths; supply current absolute real paths.
`NEW_OUTPUT` must not exist and must be outside the compiler repository.

~~~text
node scripts/source-promotion-instruction-edit-smoke.mjs
  --repo COMPILER_REPOSITORY
  --prepared-root FRESH_PREPARATION_DIRECTORY
  --seed-record FRESH_PREPARATION_DIRECTORY/positive/headless-normal.invocation.json
  --consumer CURRENT_NORMAL_PROMOTE_ONCE_BINARY
  --bin-dir CURRENT_COMPILER_BIN_DIRECTORY
  --emitter CURRENT_LOWER_DIAGNOSTIC_ORDERED_PROGRAM_V17_BINARY
  --output NEW_OUTPUT
  --semantic required
~~~

This display describes argv, not a directly runnable multiline shell command.
Use `--semantic required` only with the reviewed normal exporter diagnostic that
reports semantic MIR and canonical KIR identities from the same live owner.
Older exporters without that diagnostic require `--semantic unavailable`; that mode records
`semantic_identity: null` and does not qualify semantic-identity change.
The retained source preflight/inventory hashes cannot fill that gap.

The runner must:

- Invoke the normal public consumer to obtain the seed and verify its actual
  return against exact original/candidate bytes.
- Preserve every byte outside the promoted initializer, then change exactly
  one final XOR to OR. Retain original, public-candidate and edited source.
- Export default, edited and repeated-edited source in separate fresh Cargo
  targets. The repeat uses the same unchanged edited source directory.
- Inspect XOR/AND/XOR versus XOR/AND/OR with unchanged declared VGPR bindings.
  The listing is declared syntax, not machine disassembly.
- Require the target/function/root/contract inventory to be identical for
  default, edited and repeat. Refuse any drift, including a coherently changed
  edited/repeat pair. An unchanged inventory is not unchanged semantics.
- Require body-sensitive preflight, semantic, canonical KIR, raw KIR-file,
  source, LLVM and statement identities to differ between default and edited;
  edited/repeat must agree exactly. No substitution, normalization or missing
  semantic-identity fallback is allowed. Raw file SHA-256 is not canonical KIR
  identity.
- Check the complete backing buffer, initialized bytes, output words, both
  guards and request/launch contracts against each variant's independent oracle.

The recorded run executed five input triples, lengths 0/1/65 and two CPU
replays for each of three source exports: 90 simulations. A new run must execute
that matrix again; reading this guide does not qualify another artifact.
The script's pure tests validate its checks; they do not compile source.

The actual inventory was identical across all three fresh observations:
`610ced53986d1cef3ff7a309719e17a4983c59730019ffa58781273e9f37f852`.
The default and edited source/semantic/KIR/LLVM pins were:

| Identity | Default | Edited and repeat |
| --- | --- | --- |
| Source SHA-256 | `a3835695aa1b7685646b69a1bdb0fd4e2842ca6f7d0bad8aeef44506e56064d4` | `27ffd7a9381b26d4b79d952924eff7cbfccee863b5197a9ca5e1bd99fce3b03a` |
| Semantic identity | `49be92e8711f80f27105896a7c85af7f71c995233cdc4946603396c8d12ce7e9` | `397887111c6025de0e00df7d8682360eb645da60e7236fb3f1f21ba4fac5e63b` |
| Canonical KIR identity (993 bytes each) | `bd24d1fc942ca247fc258f3f29af3c64fdee65a624731188a1c1ce6da30877de` | `57fcb93e5af78855f44da324572f38fdcbdbaa41a886d4b556a1446e0c11f63e` |
| LLVM SHA-256 | `f6c5e9363aeb66b39c2bae53bc289683fe2be039537e0ca97ded534857912155` | `123495688260bc4ad38215b59b991bf5bbda421ad36c45d84d6da751a0572b8f` |
| LLVM bytes | 1994 | 1993 |

The unchanged original Rust source SHA-256 was
`5072283b41b4c8dc2e364c13e95971d8fdfdb8d8993c6a95d3440665d720c33b`;
the public candidate was 1,481 bytes. The strict join also rechecked the exact
original/candidate/edited source relationship, fresh stage logs, complete
simulation results, body-sensitive preflight and declared statement joins.

Run under an external bounded supervisor with serialized builds, current
source/tool/library pins, and storage/RAM/deadline accounting. The runner has
selected-file and stream limits and a free-disk reserve, but those are not whole
process-tree memory or generated-target-storage bounds. Keep a failed run and
its first diagnostic; a candidate may already exist. Do not overwrite it or
reuse its directory as a fresh success.

## 4. Check native output separately

The runner emits actual `default.ll`, `edited.ll` and `repeat.ll`, but its
receipt deliberately reports `native_qualified: false`. A separate reviewed
native observer must consume those exact fresh LLVM bytes and join its reports
to the source/KIR/LLVM pins of the same successful run.

At O0 and O3, require the correct three-instruction sequence, e32 encodings,
explicit and implicit operands, unchanged low-register roles, result use and
kernel descriptor capacity. Reject the wrong final opcode, hidden extra inline
assembly, unused results and stale inputs. A fixed XOR/AND/XOR checker that
rejects OR is not evidence against the new source; weakening that checker to
silently accept arbitrary operations is not qualification either.

### Observed native cases and complete-payload join

The native report files are `command.stdout` under
`logs/phase19b-instruction-native-default-r1` (9,061 bytes,
SHA-256 `7cdfd7f2aa951f74ae016a31204b53bcfdb557ad12cd1353fc3db71434f05bd8`)
and `logs/phase19b-instruction-native-edited-r1` (9,056 bytes,
SHA-256 `28b2156b3ef2b2d0a464ea36616f00ea7bd21abbcb70775301cb44cee0838557`).
Each directory retains complete `payloads/O0.hsaco` and `payloads/O3.hsaco`:

| Profile / optimization | Payload bytes | Complete payload SHA-256 | Instruction file offsets | Descriptor file offset |
| --- | ---: | --- | --- | ---: |
| Default / O0 | 6152 | `0786de8ada4300d144018ac871fe384065b0f225b8e25dc423bc6c8a3454ba41` | 2692 / 2696 / 2700 | 2368 |
| Default / O3 | 5384 | `9484ee4d7f5f75730367a49ed960e4608ce07fb76c3415bb91e302f1ddea49c7` | 2340 / 2344 / 2348 | 2048 |
| Edited / O0 | 6152 | `f39f619d9db7dc56f72b31dae527b926f9cf65004c2dd8e92092e77331f11a04` | 2692 / 2696 / 2700 | 2368 |
| Edited / O3 | 5384 | `e37254dc428d1bdb680fccd3c3f52769caa6b85d24e070aba0d4935c780709cd` | 2340 / 2344 / 2348 | 2048 |

These are actual full-file offsets, not section-relative offsets or locations
found by scanning for attractive bytes. The first two encodings were
`0003082a` and `04050826`; the final encoding was `01090a2a` for XOR
and `01090a28` for OR. The explicit registers were
`[v4,v0,v1]`, `[v4,v4,v2]`, `[v5,v1,v4]`; each reads EXEC and has
no implicit writes. The reports and raw payload slices agree.

The 64-byte descriptors at the stated offsets also joined exactly:

| Optimization, both profiles | Descriptor SHA-256 | rsrc1 / rsrc3 | Encoded VGPR capacity |
| --- | --- | --- | ---: |
| O0 | `5e139ffe6e70a3b53f5553f80e13cc2a6f41aea3f6bbeb4ea106e8929403e38a` | 11468930 / 1 | 24 |
| O3 | `bfa9cf8710b52ecadef754b0793267707be2a27430f97c294c1b841f3d42604d` | 11468928 / 1 | 8 |

Both report an architected boundary of 8 covering the authored high-water
mark of 6. This is encoded capacity, not a claim of exactly six allocated
registers, liveness correctness or final register usage. Both post-link
profiles report wave64, required workgroup `[64,1,1]`, zero private/group
segments and an observed 288-byte kernarg segment.

Each native invocation reported 4 positive/48 negative typed-shape controls,
1 positive/3 negative input-identity controls and 1 positive/9 negative file
snapshot controls. Each actual O0/O3 case retained 7 decoded-field refusals and
one each for stale identity, a gap, raw-byte mismatch and redecoded opposite
opcode. Synthetic mutations were not executed on hardware and did not replace
the original retained payloads.

The strict join is now complete, not merely planned: it re-read the selected
source LLVM, both native reports and all four complete HSACO files, checked
hashes/sizes plus exact instruction/descriptor slices, and retained the
observation-only report pinned above. Repeat agrees with edited source,
semantic/KIR/LLVM identities; no separate repeat native execution is claimed.

The native reports use LLVM build claim
`rocm7.2.1-packages-sha256:eb02c62693d6697017195f0abf5ebcf7e58f60e4d2acf8356de2e944bceec540`
and worker build claim
`fe2o3-worker-v1-sha256-f5fee9cf41ca39587c47114f112b70681084dba62dd61e3cc79484ed66c7646d`.
These measured selections are not whole toolchain closure authentication.

LLVM IR remains in the pipeline. The ordered program is a constrained inline
assembly unit inside an ordinarily compiled kernel. Exact native instruction
survival and full-payload retention do not establish physical register
lifetimes, protected artifact admission, hardware execution, whole-kernel
native correctness or an all-input functional proof. All those authority
flags remain false or unavailable; the source runner itself still reports
`native_qualified: false` because native evidence is a separate joined
observation, not a mutation of that earlier receipt.

## 5. Invalidate observations, not just editor caches

Changing source requires a fresh owner and fresh observations. The separate
public-seeded debug/inspection regression tests an old typed inspection identity
against the new current owner, requires exact `StaleIdentity`, and then inspects
again using that owner's current identity on the same accounting ledger.
This checks stale borrowed inspection rejection without modifying owner bytes.
It is not a serialized identity import API or a compiler-resume mechanism.

That regression uses its own register-edited pair; it is not evidence that the
instruction-edit runner performed debugger captures. Similarly, the
[helper source-variable lab](resource-helper-source-values-v2.md) is a different
ordinary Rust fixture, not a trace of this ordered program.

Keep the evidence distinctions explicit:

| Evidence | What it establishes |
| --- | --- |
| Fresh source export and CPU oracle | This admitted diagnostic variant matches its tested whole-kernel outputs. |
| Current-owner inspection / stale refusal | The inspected view belongs to this owner; an old identity cannot select it. |
| Separate native observer | The checked emitted artifact has the required instruction/operand/resource shape. |
| Production analysis or proof invalidation | Not supplied by these diagnostic checks; requires its applicable production owner and proof route. |

Returning manually to the saved high-level Rust is useful, but assembly-to-Rust
decompilation, automatic merging of edits, lossless round trips and continued
compilation from historical raw IR are not provided.
