# Author a global load, wait and store

Compiler publication: [dbfb61e7](https://github.com/harsh-nod/fe2o3/commit/dbfb61e7186e5fa37dd9d544d85de29c7a1080eb),
also published to powderluv/fe2o3 main. The source/CPU qualification and
native-static matrix retain their original tested snapshots below. This does
not change the curriculum's `FE2O3_PIN`. Section 6 covers normal checked handoff.
Hardware execution is not established by any of these evidence packets.

The [physical entry lesson](physical-entry-source-v20.md) authors setup, register
allocation, indexing, output masking and termination. This separate V21 profile
adds one readonly global load and its explicit readiness wait. It does not widen
the V20 profile or accept arbitrary assembly strings.

## 1. Follow the data through the authored instructions

The complete [Rust example](../examples/physical-global-copy-v21.rs) is the
actual positive compiler fixture, with only its feature-selector attribute
removed. Its signature is `input: &[u32], output: DisjointSlice<u32>`.
The source author chooses every instruction in its single entry block,
including kernarg loads, waits, pointer carry chains and `s_endpgm0()`.

The target is exactly `gfx942:xnack-`, Wave64, code-object version 6.
Required and maximum workgroups are `[64, 1, 1]`, with
`max_grid=[2, 1, 1]`. The two logical slice arguments lower to these four
native components in the 32-byte explicit prefix of an 8-byte-aligned
kernarg segment. Compiler-owned hidden metadata extends the native segment;
the explicit source ABI is not a claim that the complete segment is 32 bytes:

| Offset | Width | Component |
| --- | --- | --- |
| 0 | 8 bytes | readonly input pointer |
| 8 | 8 bytes | input length |
| 16 | 8 bytes | exclusive output pointer |
| 24 | 8 bytes | output length |

The central source sequence is:

```rust
global_load_dword(v(8), v_pair(6));
s_waitcnt_vmcnt0();
// Construct the output address and compare output length with the index.
v_cmp_gt_u64_e32(s_pair(14), v_pair(2));
s_and_saveexec_b64(s_pair(18));
global_store_dword(v_pair(10), v(8));
s_waitcnt_vmcnt0();
s_mov_b64_exec(s_pair(18));
s_endpgm0();
```

This excerpt omits instructions; use the full example when compiling.
The input read runs under full EXEC, before the output guard. An empty or short
output does not make a short or uninitialized input safe: every resident lane
must have a valid, initialized input element. The output mask controls only the
store. Scalar waits, mask restore and termination still execute when that mask
is zero.

The load produces an unreadable pending value until its immediate VM wait.
The store must consume the actual loaded SSA value, not an equal constant or an
unrelated register. Pointer halves and carry state retain symbolic allocation
provenance in the CPU engine; they are not invented GPU address bits.

## 2. Extract the actual source diagnostics

Run these commands in the compiler checkout pinned above,
using its pinned nightly compiler and existing offline dependencies. The output
directories must be fresh absolute paths.

```sh
cargo build --locked --offline -p rustc-codegen-fe2o3 --lib --bin fe2o3-rustc-extract
export RUSTC=/absolute/pinned/rustc
export FE2O3_PHYSICAL_GLOBAL_COPY_BIN_DIR_V21=/absolute/build/debug
node scripts/physical-global-copy-source-v21.mjs one /absolute/new-copy
node scripts/physical-global-copy-source-v21.mjs registers /absolute/new-register-edit
```

The second source changes the loaded/stored value register from `v8` to
`v22`; it does not rename detached LLVM or substitute a sidecar program.
Inspect `diagnostic/canonical-v21.bin`, `diagnostic/canonical.ll` and
`diagnostic/native-observation-input-v21.txt`, plus the command's receipt.

This command follows actual Rust callbacks through MIR38 and the checked KIR21
canonical representation to a same-owner emitter. It is a pre-ranked diagnostic
route, not the normal production handoff. It does not run CPU simulation,
LLVM native compilation or a GPU. LLVM IR is still present: the ordinary kernel
shell carries the authored body while LLVM retains its descriptor/metadata role.

The canonical bytes and diagnostic hashes are inert observations. Reading them
does not recover the source owner's custody, a proof, an artifact admission or
permission to launch. Independently extracted identical source can have
different canonical identities while producing identical LLVM. Compare exact
identities only inside the producer relation that actually established them.

## 3. Read the qualification without overextending it

The [evidence index](evidence/physical-global-copy-source-v21-20260924/index.json)
pins an unchanged tested source-tree census, the original source ladder and all
nine public-command receipts. The observed gate predates the publication
commit; its base commit alone does not identify the tested dirty source.

The ladder completed 18 source sessions: two positive kernels and seven source
refusals, each observed internally and through the public diagnostic output.
The two positives ran 128 CPU cases in total, with six exact CPU negatives.
They covered grids 64 and 128, four input seeds, output lengths
0/1/63/64/65/127/128/129, and unchanged canaries. Full-EXEC input bounds and
initialization checks remained active even with a masked output. The CPU binding
also refused input/output sharing one backing allocation, even for nonoverlapping
views; that conservative rule is not a general alias theorem.

The 14 source-negative sessions check:

| Source edit | Expected refusal |
| --- | --- |
| Change the declared launch | exact authored launch64 and max_grid2 required |
| Remove the kernarg wait | exact initial kernarg loads/wait required |
| Remove the load's VM wait | global read requires immediate VM wait |
| Substitute a pointer carry source | pointer high provenance mismatch |
| Store another value | store must consume actual loaded U32 |
| Repeat a kernarg offset | repeated kernarg component |
| Use a reserved register | instruction outside the closed profile |

The nine public commands independently reproduced the two positive exports and
seven exact refusals. Their receipts correctly say `cpu_simulation_run: false`;
the 128 CPU cases belong to the source ladder, not those commands.
`native_instruction_count: 24` is the authored/emitter count in this packet,
not evidence that a native decoder or GPU accepted the body.

## 4. Keep host conditions and later stages explicit

The later normal checked continuation in section 6 retains the same source
owner, mandatory ranked/formal analysis, actual four-slot ABI, descriptor binding
and ordinary worker handoff. Its evidence is separate from diagnostic output.
The static native matrix below consumes the earlier diagnostic LLVM unchanged;
the later normal LLVM output is byte-identical.

For the declared maximum launch, the conservative formal envelope is 512 bytes
for each input and output. The input must be readable and initialized, output
writable, and input/output disjoint. The compiler-provided kernarg segment must
remain readable and immutable for execution, and disjoint from output.
There is no invented input/kernarg nonalias requirement: both are readonly.
These are unresolved runtime conditions, not facts discharged by the CPU tests.
Ragged or zero-length output CPU tests do not prove the conservative normal
launch admission accepts such a host allocation.

This is a bounded copy profile, not general global-memory assembly.
Multiple outstanding reads, masked input loads, arbitrary wait schedules,
LDS, barriers, atomics, loops, matrix instructions and hardware execution remain
outside this lesson. V21 symbolic pending-load debug sessions are not admitted
by the separate [typed V20 CPU-debugger lesson](physical-entry-cpu-debug-v20.md).
This packet does not close the broad M2/M3/M6/U4 milestone exits.

## 5. Compare unchanged LLVM with final native instructions

The [native-static evidence](evidence/physical-global-copy-native-v21-20260924/index.json)
retains four exact report slices from the later matrix: one/register-edited,
each at O0 and O3 through the ordinary pinned LLVM worker. The input LLVM and
expectation hashes join the original source ladder above. This external
producer join does not turn an inert expectation file into a canonical owner.

All four entries have 24 decoded instructions, 128 entry bytes, one CFG block,
and zero compiler-added prologue or tail instructions. The four explicit
metadata arguments retain offsets 0/8/16/24. The native metadata includes
13 compiler-owned hidden arguments and reports a total kernarg size of
288 bytes; these hidden arguments do not add author instructions to the body.

The unchanged body uses a VGPR minimum of 12 and an emitted capacity of 16;
moving the loaded/stored value to v22 raises these to 23 and 24. Both variants
retain an SGPR minimum of 20 and capacity of 32. O0 and O3 produced the same
HSACO bytes for each variant in this matrix, not a promise for every compiler
or future source edit.

Each case refused 71 instruction/descriptor/metadata mutations, 12 expectation
mutations and two LLVM-input mutations. Controls include wrong kernarg origin
and offset, pointer carry inputs, load destination/address/cache policy,
VM waits, EXEC masking, the actual stored register, descriptor live-ins and
hidden metadata. This is an exact bounded complete-entry check, not a general
hazard model or native functional execution.

The observer deliberately reports source authentication, canonical owner
admission, live Rust source ABI qualification, initialized input, host
input/output disjointness, runtime bounds, protected finalization and hardware
execution as false. Those facts cannot be minted from disassembly. The
matrix supervisor guarded the site tree while independently pinning the
compiler-generated inputs and worker; the site census is not a compiler
source-custody claim.

## 6. Continue through normal checks and an inert worker handoff

The [normal-continuation evidence](evidence/physical-global-copy-checked-v21-20260924/index.json)
is a later, separate gate. It completed 27 source sessions across observe,
normal LLVM and normal handoff modes, including 128 CPU cases, six CPU negatives,
21 source-negative runs, 88 actual-owner ABI mutation refusals, eight resource
denials and six descriptor-extension refusals. These do not retroactively
change the earlier pre-ranked packet.

Using the same pinned tools and environment as section 2:

```sh
node scripts/physical-global-copy-checked-v21.mjs one /absolute/new-checked-copy
node scripts/physical-global-copy-checked-v21.mjs registers /absolute/new-checked-register-edit
```

All nine public cases passed their expected positive or negative outcome through
both normal outputs. The two positive commands write `canonical.ll` and
`handoff-v2.bin`. The script joins the diagnostic relation's LLVM and serialized
handoff hashes; it does not run CPU simulation or native execution itself.

Actual source bindings stay retained through mandatory ranked/formal checks,
the exact two-logical-argument/four-native-slot ABI and descriptor preparation.
The safety-analysis projection is not a second executable: the original
canonical SSA/instructions remain the emitted body. The formal read report keeps
loaded data opaque, attributes the full-EXEC read to input and its exact wait,
and retains the 512-byte input/output bounds and unresolved host conditions.

The checked kernel's LLVM bytes match the earlier diagnostic/native input
exactly. Handoff construction uses the ordinary descriptor serializer extension;
it is not whole-file equality between plain LLVM and the serialized handoff.
The normal ladder checks that extension exactly and refuses malformed variants.
Public diagnostic relations are inert hashes, not source custody or a portable
proof. Separate public extractions have their own canonical and descriptor
identities, even where the emitted LLVM is identical.

Normal worker preparation is now observed for these two source bodies.
Host admission, runtime-condition discharge, protected finalization and GPU
execution remain false. The broad milestone exits remain open.
