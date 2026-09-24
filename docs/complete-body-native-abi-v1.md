# Follow a complete assembly body through LLVM and native ABI checks

This contributor walkthrough demonstrates the bounded renderer and native
checker. It is separate from the [V19 source recipe](complete-body-source-v19.md)
and [logical-debugger recipe](complete-body-debug-v19.md). Their bounded
source ladder has its own [qualification record](complete-body-source-qualification-20260924.md);
the public scripts and four actual-source canonical-prefix native checks are
qualified there. Descriptor-bearing worker-module native qualification and
functional execution remain separate. This fixture is not the authenticated whole-body source route,
a runnable GPU lesson or M2 acceptance. The
[qualification record](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/complete-body-native-abi-20260923.md)
records five plans at O0/O3 and 352 negative checks without GPU execution.

## Author a checked body

The [const builder](complete-body-const-builder-v1.md) prepares device-side
data. The host-side checked model additionally validates control flow,
initialization, register conflicts and resources before rendering. For example:

~~~rust
use fe2o3_amdgcn_model::{
    Gfx942CompleteBodyBlockV1 as Block,
    Gfx942CompleteBodyBoundaryV1 as Boundary,
    Gfx942CompleteBodyPlanV1 as Plan,
    Gfx942CompleteBodyResourcesV1 as Resources,
    Gfx942CompleteBodySymbolV1 as Symbol,
    render_gfx942_complete_body_llvm_v1,
};
use fe2o3_kernel_ir::{
    CanonicalKernelIrWorkBudgetV1 as Work,
    Gfx942CompleteBodyLabelV1 as Label,
    Gfx942CompleteBodyTerminatorV1 as End,
    Gfx942OrderedProgramRegistersV1 as Registers,
    Gfx942ProgramDestinationV1 as Destination,
    Gfx942ProgramInstructionV1 as Instruction,
    Gfx942ProgramRoleV1 as Role,
};

let registers = Registers::new(32, 33, [34, 35, 36])?;
let instructions = [Instruction::Move {
    destination: Destination::Output,
    source: Role::Input0,
}];
let blocks = [Block {
    label: Label(255),
    instructions: &instructions,
    terminator: End::GuardedStoreOutputAndEnd,
}];
let plan = Plan::check(
    Boundary::PROFILE, registers, Resources::required(registers),
    &blocks, &mut Work::new(512),
)?;
let rendered = render_gfx942_complete_body_llvm_v1(
    &plan, Symbol::new("complete_body_fixture")?,
    &mut Work::new(65_536),
)?;
println!("{}", rendered.llvm_ir());
~~~

This excerpt belongs inside a fallible Rust function. The checked-in
[ordinary example](https://github.com/harsh-nod/fe2o3/blob/main/crates/fe2o3-amdgcn-model/examples/diagnostic_complete_body_gfx942.rs)
contains executable code and five independently checked profile choices.

The body uses at most eight forward blocks and sixteen typed integer steps.
Here scratch/output/input roles select v32/v33/v34-v36. A uniform selector may
choose branch paths; it arrives in s22. The compiler retains ABI/index setup
and the guarded output-store tail. Labels are logical IDs, never machine PCs.

## Inspect the actual representation

Build and test the existing example with fe2o3's pinned toolchain:

~~~sh
cargo test --offline --locked -p fe2o3-amdgcn-model \
  --example diagnostic_complete_body_gfx942
cargo build --offline --locked -p fe2o3-amdgcn-model \
  --example diagnostic_complete_body_gfx942
~~~

Run diagnostic_complete_body_gfx942 with one of: one, output_diamond,
scratch_diamond, two_terminals or maximum. Retain its LLVM stdout as a fresh
absolute file, requiring success and empty stderr.

The result is LLVM IR containing one side-effecting assembly body with explicit
register constraints and clobbers. This mechanism does not bypass LLVM IR.
A renderer result is only text: it cannot become a source, launch or proof owner.

## Check O0 and O3

Follow the pinned worker/SDK configuration in the
[complete-body fixture README](https://github.com/harsh-nod/fe2o3/tree/main/tools/fe2o3-llvm-link-worker/tests/complete-body-abi).
Then invoke the built fixture twice per profile:

~~~text
complete-body-abi-candidate one O0 /absolute/one.ll /absolute/fresh-one-O0.hsaco
complete-body-abi-candidate one O3 /absolute/one.ll /absolute/fresh-one-O3.hsaco
~~~

The output file must not already exist. Each invocation uses the existing
LLVM/LLD worker and decoder. Successful bounded reports include exact LLVM and
artifact identities, complete native instructions/CFG, slot/resource observations,
selector provenance and negative-case refusal phases.

A refused check can still leave its exact emitted artifact for diagnosis.
The presence of a file is not success. Do not dispatch these diagnostic objects
or present their synthetic request identities as authenticated compilation.

Six explicit slots remain fixed: pointer at byte 0, length at 8, inputs at
16/20/24 and selector at 28. Both optimization levels reserve 288 kernarg bytes.
O0 describes nineteen hidden entries; O3 describes thirteen. The checker
requires the exact roster for each level, rather than assuming identical
metadata or accepting arbitrary omissions.

## What mistakes this catches

The model rejects unsupported control flow, undefined values, invalid registers
and inconsistent resource intent. The native fixture catches drift in explicit
argument slots, selector loading, direct branch targets, instruction operands,
clobbers, tail operations, waits and descriptor capacities. Its controls mutate
real output bytes and rerun the relevant parser/decoder.

These are static checks—not kernel-output comparison, memory-race proof,
physical-register lifetime measurement or stopped-wave debugging. The
[logical lifetime viewer](ordered-role-liveness-v1.md) and
[checked-device walkthrough](gfx950-checked-artifact-v1.md) retain their distinct
evidence boundaries.

This documentation does not advance a curriculum compiler pin or label the
example compiler-produced. The newer normal-source/canonical-owner route and its separately scoped qualification,
small and tiled optimization lessons, hardware cells and measured curriculum
cost gates remain separate work.
