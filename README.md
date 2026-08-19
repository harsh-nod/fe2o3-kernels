# fe2o3 kernels curriculum

A technical tutorial workbench for writing Rust GPU kernels with
[fe2o3](https://github.com/harsh-nod/fe2o3) and reasoning about their source
models with Verus. The curriculum starts with scalar fill and vector addition,
then develops the contracts needed for collectives, tiled GEMM, online softmax,
flash attention, and mixture-of-experts routing.

This site is evidence-led. It distinguishes what the current stack runs from
what it verifies, what it observes in compiler or hardware tests, and what is
still a design. It does not present advanced tutorial pseudocode as a working
kernel.

## Audited lesson baseline

Lesson evidence claims are based on one immutable fe2o3 snapshot. This pin does
not cover the separately gated implementation-progress snapshot described
below:

| Field | Value |
| --- | --- |
| Repository | `harsh-nod/fe2o3` |
| Commit | `acb3d2752e4e50e4f4a99ebfc4b180eb79160930` |
| Tree | `f53fdf76950e392d74c17c20e0999a7727305d49` |
| Rust toolchain | `nightly-2026-04-03` |
| Primary target | `gfx942:xnack-` |

The lesson baseline was audited from source, documentation, test fixtures, Verus
runners, compiler tests, direct-link tooling, and the signed evidence model.
Commands shown in lessons that exercise fe2o3 are run from a checkout of that
exact commit, not from this documentation repository.

The deployed workbench also has an **Implementation status** reference page.
It reports a last-audited public baseline, implementation checkpoints, a
publication-gated snapshot, known blockers, and separate run/verify/evidence gates
for every kernel in the curriculum. That progress view does not silently repin
or upgrade lesson claims.

The checked-in publication gate is pinned to public-main implementation commit
`2f7c4fd1dfef7b9056caab0880700e3da7eeef03`, tree
`96d4275e7efde8ef594ef34b1c28f95d3000c8dc`. Deployment requires
`harsh-nod/fe2o3@refs/heads/main` and
`powderluv/fe2o3@refs/heads/main` to resolve to that exact commit and tree. Until
both refs match, the live publication gate fails closed. This descendant contains
the exact protected Slice 1
implementation and measured evidence pinned to commit
`c4fcb4d980cf979c0527dfa135a7b9f4fe72a811`, tree
`c65c6ab567409afaaef6ea39c8befcac21d47119`: attributed source-to-IR
correspondence, canonical matrix Kernel IR V5 bytes, an exact compiler-owned
descriptor and single-use inert Worker V2 handoff, an authority-free sealed
exact-profile import, direct LLVM/LLD API finalization, generated borrowed host
preparation, the one-shot protected lifecycle, and one bounded protected mi300x
measurement. It also retains the separate Slice 3 and Slice 4 upstream
LLVM/COV6 inspections and bounded Slice 1 source/model correspondence. The
newer snapshot also adds source/oracle/formal Phase A packages for masked
Wave64 collectives and workgroup synchronization. The latter uses a typed
`DeviceGlobalMutPtr` kernel argument, an exclusive generated `GlobalMut` host
capability, and an exact linear `DynamicLds` capability. Exact compiler profiles
and opaque upstream LLVM target-machine plus in-process LLD finalization now
exist for its fixed WG64 LDS-reduction and system-scope relaxed-atomic forms.
The exact fixed profiles now also have typed arguments, profile-bound host
admission, private non-Clone `Joined -> Loaded -> Completed -> Unloaded`
lifecycles, exact COV6 packing, dynamic-LDS AQL binding, and protected harness
vectors. Combined debug and release host/runtime suites pass. A subsequent fix
derives the canonical layout through upstream LLVM 22
`TargetMachine::createDataLayout()`, binds its identity into both handoffs, and
rejects stale, missing, reordered, and substituted layouts. The normal pinned
MI300X lifecycle then passed both exact kernels in debug and release with
canaries, unchanged inputs, exact oracles, bounded completion, and terminal
unload. This is a bounded observation, not compiler-origin or
source/compiler/machine refinement authority. The
lesson snapshots for those source-only milestones remain byte-pinned to commit
`d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8`, tree
`cdec8448a300aa71d17565ca50fd4d893932f602`, rather than silently following the
newer publication gate. A later exact Wave64 increment now reaches deterministic
in-process upstream LLVM target emission and LLD library linking with exact
post-link metadata, resource, relocation, dependency, and machine-call checks.
Its typed one-shot HSA lifecycle also completed one protected gfx942 observation
over four exact masks with canaries, unchanged inputs, exact-bit outputs, and
terminal unload. That bounded observation is not a generalized compiler or
Verus-to-machine refinement result. Commit
`43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4` adds bounded
source-model-to-canonical-Kernel-IR correspondence for that exact masked Wave64
profile. The package passes 38 tests with one existing hardware test ignored,
Verus discharges 22 positive obligations, all eight expected-negative fixtures
are rejected, and the executable checker records 4,359 deterministic mask
observations while symbolically checking contributor sets for every `u64` mask.
The receipt does not hash the CPU oracle or refinement implementation, so the
outer commit remains part of the evidence identity. KIR order is validated but
not operationally executed, and Verus relates internal mathematical definitions
without computing SHA-256. This result establishes no source-to-model,
compiler, LLVM/ISA, GPU, generalized safety or race-freedom, or parity
authority. The snapshot also carries the row-softmax V1 inert verification
certificate and makes `examples/row_softmax_v1/src/kernel.rs` the sole ordinary
example-owned attributed source. Complete `syn` AST structural admission runs
before a fixed reviewed interpreter/model, while digests and the certificate
bind the exact source, model, and authenticated 64-element memory preconditions.
This is not Rust semantic refinement and does not establish compiler/GPU
causality or runtime satisfaction of the preconditions. The certificate has 18
Verus obligations and seven named negative fixtures bind exact reviewed source,
policy, proof, compiler-profile, Kernel IR, target, and tool identities. The
certificate itself grants no compiler, artifact, launch, or hardware authority. The
same publication-gated snapshot now contains an exact typed 64-element row-softmax host
adapter and a private linear HSA load/dispatch/wait/unload lifecycle. G3 binds
the attributed source, compiler descriptor, Worker V2 handoff, OCML import
closure, finalization, typed host mechanics, and a staged receipt for all 25
release pins at historical commit
`aca28306fe89c036dc0129349ef9ed685a43c7bb`, tree
`37f1a92e0be0a4b48c5cef1b1a48327e0ea4c828`. That checkpoint remains separate
from the later LLVM release pair: implementation commit A
`31bf96a21c0a2bbfb55c44f9a22b7350cabcfcb1`, tree
`293c6d39e47d64f5949d450d6041dc598aafd0fe`, and manifest commit B
`fd89390788adc5670c54ecc2517b9720f2f80113`, tree
`af0156687517c0e71eb0d607917964b7c375af43`. B pins
`tools/fe2o3-llvm-link-worker/row-softmax-v1-release-manifest.txt` at SHA-256
`9c7dc4a08f2f972b581ffa0f88bf8834d2098f21ff57b1a8594dd4dfca03759c`.
Two fresh complete MI300X runs passed, and independent review accepted the
evidence package. The runs reproduced the retained compiler, closure, worker,
probe, and single retained HSACO identity, SHA-256
`0864047320a7ade5eba29d3fbb3ef9efefcf2a1378097061010d163af461db93`.
They did not dispatch a GPU and establish only bounded
compiler/code-object reproducibility and operator-selected reviewed integrity,
not runtime or GPU results, authentication, generalized memory safety or race
freedom, or source/model/Verus-to-machine refinement. The GPU code-object path
remains pinned upstream LLVM target-machine APIs plus in-process LLD. W0 is now
accepted only as the bounded ancestor described below. A durable broker
prepared-session consume foundation now exists, but it remains
`AUTHORITY=none`; anti-rollback, key provenance, hostile same-UID resistance,
multiwriter coordination, cross-system atomicity, and publication/runtime/GPU
authority remain open. No production row-softmax hardware run is claimed. The
publication-gated snapshot also
contains exact B=1, H=1, N=8,
D=16 FlashAttention compiler
admission. It binds ordinary attributed source, FnAbi, compiler configuration,
complete reachable portable MIR, semantic Kernel IR, and V3 provider identity,
with hostile substitution coverage. G4 now carries those authenticated compiler
inputs through a single-use Worker V2 handoff and structural finalization using
upstream LLVM target-machine APIs plus in-process LLD. It checks the pinned OCML
provider closure and exact gfx942:xnack-/COV6 profile, and returns an opaque,
non-Clone receipt with deterministic raw and finalized output identities. The
receipt exposes no bytes, replay, publication, load, or launch path. This is
compiler-handoff and finalizer evidence only: it grants no publication, load,
launch, runtime, GPU, numerical, performance, compiler-refinement,
OCML-semantics, general memory-safety, race-freedom, or source/model-to-machine
authority. It also contains no measured proof of no-COMGR linkage; that would
require a separately measured worker manifest. A subsequent exact
B=1, H=1, N=8, D=16 FlashAttention checkpoint adds a typed four-buffer host
binding with shared query/key/value input leases, unique output ownership, and
alias rejection. The opaque receipt enters a private non-Clone `Joined ->
Loaded -> Completed -> Unloaded` lifecycle that binds reviewed HSA executable,
kernel, group-segment, and private-segment observations. Nine compile-fail
cases enforce the ownership and typestate boundaries, and an independent
strict-F32 CPU oracle covers nominal, equal-score, dominant-score, causal-mask,
exceptional-input, unchanged-input, and canary cases. At that checkpoint the
protected MI300X test failed closed before HSA load pending W0 and W1; the
current tip closes the bounded W0 prerequisite and adds local durable
prepared-session consume mechanics with `AUTHORITY=none`, while real
anti-rollback, key provenance, multiwriter coordination, publication authority,
and subsequent linear receipt injection remain open.
Artifact-path and raw-byte fallbacks are refused. This is host/runtime mechanics,
compile-fail, resource-observation,
and CPU-oracle evidence only. It grants no protected GPU dispatch or numerical
GPU result, compiler or OCML semantics, source/model/Verus-to-machine
refinement, general memory safety, or race freedom. A later bounded memory/effect
checkpoint adds an exhaustive fixed-domain Rust checker plus a pinned Verus
source for B1/H1/N8/D16 index bounds, causal reads, byte-region bounds, output
ownership, disjoint writes, and phase ordering. Verus reports 13 verified
obligations and the runner rejects eight named mutations. Its copyable expected-
evidence descriptor is explicitly inert, and the checker reports no authenticated
Verus receipt. Compiler, Kernel-IR, LLVM/ISA, logical-address, final-artifact,
machine-safety, generalized race-freedom, and GPU-execution joins remain absent.
Exact T=8, E=4, K=2, C=4 MoE
routing compiler admission now
similarly binds attributed source, FnAbi, complete reachable portable MIR,
semantic Kernel IR, target/ABI/resources, and V3 provider identity. G5 carries
that authenticated compiler handoff through a single-use Worker V2 exchange,
upstream LLVM target-machine emission, in-process LLD, and exact structural
ELF, machine, metadata, descriptor, and resource checks. The resulting
non-Clone receipt is opaque, deterministic, and identity-only. The measured
direct worker passed in debug and release with identical raw and finalized
output identities. This grants no publication, load, launch, runtime, GPU
numerical, performance, compiler-refinement, Verus-to-machine, general
memory-safety, or race-freedom authority. The GPU device code-object path uses
upstream LLVM target-machine APIs plus in-process LLD and exposes no COMGR or
shell GPU linker, but no measured worker manifest proves no-COMGR linkage.
Bounded MoE V2 is integrated at this publication-gated checkpoint. Its exact
E4/C4/routes16/width16/tile256 compact-plan model reports 19 verified
obligations, rejects seven expected-failure mutations, and exhaustively covers
all 625 expert-count vectors. Its host bridge validates one caller-supplied
routing snapshot and uploads and reads back offsets plus inverse mappings on
gfx942. That upload/readback test is no kernel dispatch. It provides no router
or expert GPU execution, generalized source-to-machine refinement, numerical
or performance result, memory-safety authority, or race-freedom authority; the
MoE rows remain Partial. The public
snapshot also isolates the 64-connection broker-capacity test from the
separate concurrent executable-authentication and descriptor-transfer test, so
hosted CI exercises each bounded property without coupling their deadlines. The
publication workflow continues to require both public refs to resolve exactly
to the gated commit and tree before deployment. The historical audited public
baseline remains
`96b9890c3ad33ad8c6b4239a9b567728a176d65f`, tree
`f911f0c693238830ad6070b2674fb863857bfec1`.

The public history also records the rejected W0-B candidate
`2e5ad53bcb20f2a46e91128a42e838d918d61581`, tree
`892f014381cd3e34f81cb05df3b9bbda4a412478`. That candidate is not integrated,
accepted, or public. On MI300X it crossed the static binding-wrapper, Cargo,
rustc, backend, and kernel-collection boundaries, then failed closed because
the broker lacked an authenticated `cargo-fe2o3` executable identity. It ran
zero Workers and reached no artifact admission, load, dispatch, or GPU result;
it opened no COMGR path. Review also found that its dynamically linked host
`rust-lld` left the ELF loader and system DSOs, CRTs, archives and objects,
search roots, and forwarded Cargo target artifacts outside the authenticated
closure. `env_clear` reduces ambient configuration but is not dependency
authentication. The accepted successor is rooted at ancestor commit
`9f40bbff39156f8b5f05868377ee12a2c4f74207`, tree
`fd05530d3728aa928090b8e7beb372eaaf22b477`. Its dedicated genuinely static
`fe2o3-host-lld` is built from pinned upstream LLVM/LLD archives and consumed by
descriptor-sealed `HostLinkClosureV1`. Two fresh guarded MI300X builds produced
the same 85,597,472-byte tool with SHA-256
`7c1a7429e93896393eb743ed54ead78ec6d492e3ed887183e67737b3872d7bf9`;
the secure-protocol CTest and a separate real closure link slice passed. This is
measured/no-authority evidence only. W0 grants no protected publication, broker
or durable artifact handoff, runtime, load, launch, or GPU authority or evidence;
it proves neither memory safety nor race freedom and establishes no
source-to-machine or Verus-to-machine refinement.

Ancestor commit
`66393d3ca7a6805633ed94e12c707a6d22bdf1ad`, tree
`f39f9c76d964bafe9e8a12a0b48099766490b366`, adds an inert Broker V4 protocol
foundation. Its canonical binding, frames,
transcript validator, replay claim, and registry interface all carry
`AUTHORITY=none`; there is no production registry implementation or session
capability. W1 remains the next blocker: the broker must durably and atomically
reserve a unique session before host linking, issue an unforgeable move-only
capability, bind completion to the exact reservation and transcript, persist
replay exclusion across restart, and consume that capability once at durable
publication. Device code-object linking remains pinned upstream LLVM
target-machine APIs plus in-process LLD, with no COMGR or shell GPU linker.
Neither W0 nor inert Broker V4 promotes a parity or tutorial evidence row.

Commit `b8daeb2bc953924a424542820bed566e52d57290`, tree
`ee06e94d6c5b5f5f447127a6c497e5a3e84ba417`, adds only an inert
protected-service descriptor-admission foundation. It reports
`AUTHORITY=none`. Its 27
unit tests and two compile-fail doctests pass; two privileged/root-only
positive tests remain ignored and were not executed. The retained descriptor
and connection-time credential checks establish no liveness, PID-reuse
protection, endpoint exclusivity, or storage provenance, and grant no storage,
replay, link, publication, load, or launch authority.

Commit
`e874da2083c2a1eb192048ea5f88a053c28d0ee2`, tree
`0e504b3be16b4dfaf3c997eefac8a6d24313e1b8`, adds an accepted reviewed
attributed-source structural correspondence checkpoint for the exact Wave64
kernel. An exact `syn` AST gate admits
the complete reviewed source shape before a fixed interpreter runs. The checker
records 17,436 observations; Verus adds 13 positive obligations and six
expected-negative fixtures. Both paths report
`proves_source_to_model_refinement=false`. Independent review limits the result
to structural and model-internal/definitional correspondence: digest constants
are not a verified SHA computation, the interpreter is fixed after AST
admission rather than derived from source semantics, and no operational Rust
semantics is proved. It grants no compiler, GPU, generalized safety, or parity
authority.

Ancestor commit `4aed8d4d394783362e289a558b6d94cc28ecda36` adds an accepted
static pre-exec containment foundation
at commit `4aed8d4d394783362e289a558b6d94cc28ecda36`, tree
`3996f269dad3e88748c50a24c98439c1422c1e3b`, with `AUTHORITY=none`. Its
freestanding syscall-only `_start` revalidates exact descriptor objects and
process controls, installs exact descriptor closure, and executes a fixed
one-element `argv` with an empty target environment. Post-exec parent-death
coverage confirms inherited `PDEATHSIG(SIGKILL)`. Fourteen tests and the Cargo
integration pass; three builds reproduced a 17,488-byte static executable with
SHA-256
`db65ee057a8a9d10f8c8e54087e46c4d34c7040b5b34e1732c42da2872b91c52`.
The boundary still trusts the supervisor and inherited process state. A
preattached ptrace tracer, `CAP_SYS_PTRACE`, or inherited seccomp user
notification can invalidate checks; descriptor state is coarse, parent-start
provenance relies on trusted procfs mount state, and target exec resets
dumpability. It grants no broker replay, publication, link, load, launch, GPU,
or parity authority.

Commit `4639ff36c8651a859495da86ea2c75e735377440` adds the independently
accepted bounded external anti-rollback anchor protocol, tree
`f0d91caaf705a7542135226c20cdb794dbc4f542`, with `AUTHORITY=none`.
Canonical fixed-width advance and recovery challenges bind an exact nonzero
caller nonce, expected sequence, prior head, transaction, proposed head, and
derived anchor-key identity. Strict Ed25519 verification against a
caller-supplied pinned public-key value is required before the move-only state
machine can produce a commit observation. Fifteen adversarial/property-style
tests and three compile-fail doctests pass locally and on `mi300x`. Key
provenance, durable nonce freshness, transport, persistence, a monotonic anchor
implementation, protected-service integration, and atomic publication remain
absent. This checkpoint changes no parity row or tutorial evidence claim.

Commit `091bf3c080a516396a24650f52c8e41fddf699f6`, tree
`ae42880843e34564fbbe408ddb5f05eab029783c`, freezes independently
reconstructed cross-implementation vectors for both 184-byte challenges and
all four 288-byte signed observations. It also adds a bounded,
domain-separated transaction-digest derivation over caller-canonical bytes.
Callers still own that canonical transaction encoding. This remains
`AUTHORITY=none` and supplies no key provenance, nonce freshness, persistence,
transport, anchor implementation, atomic publication, service integration,
GPU authority, or parity claim.

Commit `d9ae1e95957d28a17afdcfa1a5173d40b89e65a6`, tree
`a7a5fe7a94331a1354679eea1977b1fa3d0c1218`, adds an independently
accepted typed/cooperative broker lifecycle with `AUTHORITY=none`. A move-only
permit gates formation of a reservation-bound W0 request; the reservation,
fresh request nonce, process PID plus start time, V4 transcript, admitted host
output, anchor transaction, and publication plan are checked as one logical
identity. This is an in-memory state-machine foundation only. It provides no
persistence, durable uniqueness, real anti-rollback, atomic disk publication,
hostile-process enforcement, continuous liveness, runtime, GPU, or parity
authority, and it still requires a compatible trusted procfs mount.

Commit `c703eaa271040b7c297e0d3b9ea8cc9fa470f327`, tree
`c75b6cb9d70c6984bb375d09f095580eb2f7581a`, isolates production-deadline
Worker V2 application-ACK fixtures behind one exclusive process lane. The
default 28-test and all-features 35-test suites pass on MI300X. This changes test
harness determinism only, not production authority or tutorial evidence.

Commit `f4dcafb8b95345a5203a7f2c9886f9600345405f`, tree
`9eae0bfcbe6017fd16a02acdcb7b401f1dbd80df`, moves the exact 1,289-byte
row-softmax source to `examples/row_softmax_v1/src/kernel.rs` and leaves the
compiler fixture as a re-export facade. Its SHA-256 remains
`c4e2d6bb6eebe01eb6ae7c0da1a524113819a37b4ec2d0a5167f32cc3134e6f4`.
Complete AST admission, a fixed reviewed interpreter/model, and
digest/certificate binding provide bounded structural evidence only. They prove
neither Rust semantics, compiler/GPU causality, OCML/IEEE behavior, execution,
general memory or race safety, protected dispatch, nor parity.

Commit `7139ccfd01e0ab8b0fc521613ac4356134d2e0c5`, tree
`aef7f32c4dc3fe0087006e880cb535d8c8adaf1a`, adds a descriptor-relative
durable broker prepared-session consume and crash-recovery foundation. It stages
exact W0 bytes, obtains a service-owned random nonce, commits Prepared before
exposing the challenge, and re-establishes a retained-directory durability
barrier during recovery. It remains strictly `AUTHORITY=none`: there is no
anti-rollback, key provenance, hostile same-UID resistance, multiwriter
coordination, cross-system atomicity, publication, runtime, GPU, or parity
authority.

Commit `5a3f057b915b0cb21c3a0ac54094fd7e5e5ce6a4`, tree
`37dc2765f30c50f99a3fb3f5b8e56d03a511c33e`, splits hosted generic CI into
one core job, eight rustc-codegen shards covering all 19 current Cargo test
targets exactly once, and a fail-closed aggregate. Locked Cargo metadata is the
authoritative target inventory. All shards and policy checks passed in isolated
MI300X worktrees. At the later `86c4ca67a` public checkpoint, the complete `powderluv/fe2o3`
GitHub-hosted generic run, including all eight shards and the fail-closed
aggregate, also passed. The complete serial generic gate remains intact.

Ancestor public commit `86c4ca67a673bfec966f79e6c701104db872d8ea`, tree
`28f0ef6525290eb1be2ddcad72a785816502f547`, integrates 34 descendants of
that sharding checkpoint. The bounded delta canonicalizes provider identities
and paths, completes the Wave64 and workgroup MIR V3 inputs, repins the exact
FlashAttention and MoE MIR closures, reconciles architecture and evidence
boundaries, makes stale-artifact cleanup ownership-aware, and rebuilds each
ROCm example before checking its generated artifacts. The hosted row-softmax
lineage test now receives complete checkout history, and the
authenticated-Verus fixture closure is repinned after the ordinary row-softmax
source changed its owning verifier package. The final commits isolate temporary
clean-CLI projects from a workflow-wide `CARGO_TARGET_DIR` while preserving the
dedicated environment-target test, then give an already-killed orphan a bounded
host-reaping interval before the timeout test requires `ESRCH`. A still-live
descendant remains a hard failure. The exact clean generic-core gate passed on
MI300X, as did all 18 runnable tests in the affected control-flow target and a
100-run stress loop for the timeout case; the ancestor release candidate's
gfx942 ROCm compile/artifact lanes also passed there. All 14 debug and 13 release
reviewed-host tests passed serially with the new exact fixture, runtime-closure,
and executable-page identities. These are compiler identity, documentation,
test-determinism, and release-order changes only; they do not
promote a parity row or grant source-to-machine, memory-safety, race-freedom,
protected-runtime, or GPU authority.

That ancestor starts issue #134 Wave 0 with a normative Rust-first Pliron
architecture and proof-boundary decision, fixed-width Pliron-independent
`KernelItemId` and `KernelInstId` V1 records, and frozen V1-V5 Kernel IR
compatibility guards. The contracts suite passes 44 tests plus one doctest, and
the new compatibility suite passes six focused tests alongside 67 existing
wire tests. This is identity, compatibility, and architecture infrastructure;
no Pliron dependency or production selector has landed, and no executable
Pliron lowering or #135 persistent-service implementation is claimed.

Public checkpoint `2f7c4fd1dfef7b9056caab0880700e3da7eeef03`, tree
`96d4275e7efde8ef594ef34b1c28f95d3000c8dc`, advances the issue #134/#135
compiler architecture while making the Pliron ownership limit explicit. Stable
Pliron-independent MIR and AMDGCN models remain below compatibility dialect
facades. Upstream Pliron v0.17.0 commit
`2610651306ea3ba670f68d5d8b1e1159bcd521ed` is integrated through a private
process-local identity anchor that registers and verifies contexts. Its bounded
`PassPlan` is deliberately non-executing: generic pass execution remains
withheld until issue #140 provides owner-aware upstream handles. There is no
`pliron-llvm` path.

The exact-byte KIR V1-V5 bridge is now opaque and context-bound. It checks the
originating context before any operation dereference and rejects same-slot
foreign contexts, transplanted identity markers, substitution, stale handles,
and erased state. MIR-to-kernel and kernel-to-GPU are detached context-bound
services rather than Pliron `Pass` implementations. Their results retain
context identity, unsupported input and exhausted bounds remain terminal typed
errors, and failure cannot return a result or fall back to another backend.

The same checkpoint extends the `fe2o3-drm-uapi`, `fe2o3-kfd-uapi`,
`fe2o3-kfd`, and `fe2o3-runtime-model` pure-Rust foundations through KFD 1.18
and reviewed DRM identity UAPI bindings, strict sysfs topology discovery,
firmware and partition observations, and device-generation Verus models. On
MI300X, the audit, 78 focused tests, strict Clippy, warning-free rustdoc, six
Verus obligations, four rejected proof mutations, all-eight-device topology
discovery, and one checked gfx942 identity admission passed. The concrete
observation is not sealed runtime authority, does not detect a GPU reset, and
does not provide production queues, persistent execution, or a replacement for
HIP/HSA. The ancestor generic-core and gfx942 ROCm compile gates also passed;
the full workspace strict-Clippy run still has pre-existing fixture and
`kernel_ir_lowering.rs` lint debt.

Issues #134, #135, and #140 remain open. This checkpoint changes no kernel
functionality, performance, evidence, tutorial run/verify/evidence gate,
explanatory-source label, or cuda-oxide parity row. Device-code finalization
remains pinned upstream LLVM target-machine APIs plus in-process LLD, with no
COMGR path.

Ancestor commit `bf3f471a97a0e64c74f5e9b13821e455c8fe2e53`, tree
`6636f342efa8d2caf40a9bed253330972090326f`, adds an independently accepted
point-in-time process-leader pidfd identity foundation with `AUTHORITY=none`.
Forty-six unit tests and six compile-fail doctests pass; three privileged or
helper fixtures remain ignored. Linux 6.12 thread-pidfd and Linux 6.13
`PIDFD_GET_INFO` paths were not executed on the available Linux 6.6/6.8 hosts,
and procfs fallback requires a compatible trusted procfs mount for the active
PID namespace. This grants no endpoint exclusivity, replay, publication,
linking, loading, launch, runtime, GPU, or parity authority.

The Wave64 checkpoints, descriptor admission, static pre-exec foundation,
external-anchor protocol, pidfd identity foundation, Worker V2 harness repair,
ordinary row-softmax source, durable broker foundation, and CI sharding do not
promote a parity row. The matrix remains **0 Complete / 97 Partial / 0 Missing /
12 N/A**: normative **0/82/0/12** and supplemental **0/15/0**. All tutorial
run/verify/evidence states and unrelated explanatory-source labels are
unchanged.

The pinned snapshot retains the production S09
checkpoint that canonically captures the
production rustc invocation descriptor, admits exactly
`/proc/./self/fd/198` as the backend capability, and enforces one final managed
codegen-backend selector. A real `cargo-fe2o3`/Worker test published a COV6
`gfx942:xnack-` HSACO containing exactly `alpha`, decoded and bound its durable
publication record to the inspected bytes, and retained a reproducible mi300x
observation. These are inert observations: they prove no compiler origin and
grant no loading, execution, or verification authority. Canonical cwd pathname
capture does not bind that pathname to the separately pinned cwd object, and
the scalar profile establishes no general source or output-object association.

The staged tiled-GEMM facts are defined once as atomic, typed evidence records
in [`src/content/staged-evidence.ts`](src/content/staged-evidence.ts). Claims,
lesson tables, progress checkpoints, exact commands, source paths, and limited
authority labels are rendered from those records and rejected if they drift.
The earlier hardware entry records one bounded observation through a raw
harness; it is not protected execution evidence or a source-to-HSACO result.
The later #100 entry is a distinct bounded protected route measurement and does
not retroactively strengthen that earlier record.

The previous WG64/288-byte build-scoped fragment probe remains separate from
both the 320-byte four-slice direct-global profile and the independent
WG256/384-byte mutation. Four newer commits add bounded LDS Slice 1 evidence:
canonical two-tile Kernel IR at `4c79c58de`, a Verus model reporting 93
verified and 0 errors at
`97373b781`, fail-closed ordinary `#[kernel(typed, ...)]` Rust source at
`ee76cedcd`, and upstream LLVM/LLD plus final-HSACO machine inspection at
`50902b6fc`. These are separate records, not a functional or production kernel.

Slice 2 at `aba53376b` verifies one through four complete K phases with 196
verified and 0 errors, rejects missing-reuse and accumulator-reset mutations,
and exhaustively runs integer event models for 1, 2, and 4 phases. This is
proof/model evidence only. It establishes no attributed multi-phase GPU source,
protected runtime, or hardware result, and grants no authority to the later
backend artifact.

Slice 1 hardware evidence at `79ad22986` is a separate observation. An ignored
opt-in harness generated HSACO from the canonical Kernel IR using SHA-pinned
upstream LLVM 22 `llc`, `ld.lld`, and `llvm-objdump`, without COMGR. On MI300X,
six cases checked 1,536 outputs, unchanged A/B values, and prefix/suffix
canaries around A, B, and C; one hardware test passed in 33.72 seconds. This
does not bind the IR to attributed Rust source or Verus proofs, grant publisher
or protected launch authority, or prove general memory safety or race freedom.

K32 Slice 2 backend evidence at `b94bd7d78` lowers the canonical graph to a
real two-trip SSA loop with carried FP32 accumulators, two barriers, reused
1,024-byte LDS, and one static loop-body BF16 MFMA. Its upstream LLVM 22 final
artifact machine test passed; the full dialect suite passed 120 tests and
strict Clippy passed. This remains backend and machine-shape evidence only: it
has no attributed multi-phase source, hardware run, protected authority, or
LLVM refinement proof.

Commit `280995762` moves the exact WG64 launch contract into the general typed
`#[kernel]` macro path. Required-only WG64 and WG256 remain compatible while
fixed WG256 profiles reject WG64, and tiled Slice 1 no longer contains a
handwritten frontend sidecar. Commit `dc31f23eb` then authenticates the exact
ordinary attributed source, reachable portable MIR, trusted device items,
FnAbi, launch contract, target, and compiler-derived 1,024-byte LDS profile to
select only the verified canonical Slice 1 Kernel IR. Removed-barrier,
A-index-drift, and same-spelling-helper mutations fail before selection. At
that commit this was reviewed source-to-IR correspondence, not compiler
refinement, and the receipt deliberately stopped before descriptor construction
and Worker V2.

Commit `1429ed6ae` adds canonical Kernel IR V5 bytes for every current matrix
operand and profile field while leaving V1 through V4 frozen. Commit
`7337a2b87` then carries the original source-authenticated pre-section LLVM body
through an exact compiler descriptor into one single-use inert Worker V2
handoff. The handoff binds source authority, V5 Kernel IR, descriptor, resources,
LLVM body, symbol manifest, target, COV6, and envelope. It authenticates no
compiler origin and grants no worker, linker, final-HSACO, loading, launch,
hardware-execution, or production proof-certificate authority.

Commit `89ebe69bb` adds a stable closed registry with distinct Slice 1,
K-phase, Grid, and Edges slots. Only exact M16 N16 K16 Slice 1 admission is
enabled; the other three slots fail closed as reserved. Slice 1 reconstructs
canonical Kernel IR V5, independently re-lowers it with upstream
`dialect-amdgcn`, and requires exact LLVM, descriptor, source-authority,
resource-transcript, target, COV6, ABI, grid, WG64, 1,024-byte LDS, typed effect,
and role-separated length bindings. The retained compiler import is non-Clone
and authority-free: it grants no compiler-origin, finalizer, Worker V2, linker,
publication, load, launch, hardware, numerical, or Verus proof authority.

Commits `6a3f7afe9`, `bb2c2100f`, and `bfe9dfeef` complete #97 by
implementing, admitting, and integrating the exact Slice 1 upstream LLVM
target-machine plus LLD library API Worker V2 finalizer. The public API has no
COMGR, shell `llc`, or shell `ld.lld` escape hatch. It closes the exact
`gfx942:xnack-` COV6 WG64 symbol, 48-byte explicit and 304-byte complete ABI,
1,024-byte LDS, zero-private-segment, and relocation-free artifact profile while
retaining deterministic compiler-handoff, worker, LLVM, descriptor, and output
lineage. The finalized receipt remains inert: it authenticates no compiler
origin, proves no Verus or compiler/LLVM/machine refinement result, and grants no
publication, protected load, dispatch, or launch authority.

Commit `278a41afb` completes #99 with the generated exact BF16/F32 Slice 1
host adapter. A and B are 256-element `u16` BF16-bit shared read views, C is a
256-element `f32` unique read/write view, A/B overlap is allowed, and any C
overlap is rejected. Preparation constructs the exact 48-byte explicit and
304-byte complete COV6 ABI and copies the sealed import, profile, contract,
descriptor, and role-separated length identities. It then releases the compiler
import borrow so finalization can consume that non-Clone import while all three
device buffers remain borrowed by the adapter. The adapter exposes no raw
kernarg or launch operation. The final gated snapshot contains both the #97 and
#99 increments. Subsequent runtime feature-gating maintenance makes default and
`hardware-test-hooks` strict all-target runtime Clippy pass and adds no
functional claim by itself.

The protected implementation checkpoint at
`c4fcb4d980cf979c0527dfa135a7b9f4fe72a811`
completes #100 resource observation, production-adapter integration, metadata
hardening, and protected hardware validation. Private, non-Clone states consume
ownership in the fixed `Joined -> Loaded -> Completed -> Unloaded` order. The
join consumes the #97 finalized artifact and #99 borrowed adapter, and no state
exposes finalized bytes, native handles, or a generic or raw launch operation.

Admission checks the exact retained context identity and the physical device,
agent, HIP ordinal, runtime instance, `gfx942:xnack-` target, executable, and
`tiled_gemm_lds_v1` kernel identities. It also checks the exact grid 1,
WG64/wave64 geometry, 1,024-byte static LDS, zero private and dynamic segments,
the 48-byte explicit plus 256-byte implicit 304-byte complete COV6 ABI, and the
descriptor and HSA staging alignments. The finalized artifact and borrowed
A/B/C views remain owned through the single synchronous dispatch; only a
validated completion releases those borrows, leaving `Completed` with terminal
unload authority and `Unloaded` as an inert identity receipt.

On failure before packet publication, the production adapter cancels the
prepared dispatch and releases its queue and kernarg before the selected kernel
is released and the executable is unloaded. Failures after proven quiescence
and dropping `Loaded` or `Completed` also perform one checked unload. Adapter
unwind, unload failure, or ambiguous unload observation aborts. A post-submit
queue error or
completion deadline is process-terminal: submitted resources are retained
because GPU quiescence is unknown, and the process aborts instead of returning
or attempting an ordinary unload. Fake-adapter tests, now in
`crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs`, continue to cover
substitution, cleanup, and terminal paths.

The actual public protected route passed 1/1 in 14.36 seconds on mi300x gfx942
with `HSA_XNACK=0`. It used Worker ID
`fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db`
and LLVM build
`upstream-llvmorg-22.1.8-ca7933e47d3a3451d81e72ac174dcb5aa28b59d1`.
The test compared all 256 output bit patterns with the CPU reference, required A
and B to remain unchanged, and checked all A/B/C guard canaries. It emitted:

```text
FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0 finalizer=078e9b523164b679ff7af3b4e819ad041713c53c6841399ac7cea95090f09774 unload=df2f77ee798444a9e1fe5e27f219bdf720386eb8603a9a74fccc0df8efb3921c
```

The `gemm-tiling` and `gemm-proof-plan` lessons now expose that bounded Slice 1
increment directly. Their Kernel tabs reproduce the complete ordinary
`#[kernel(typed, ...)]` file from `examples/tiled_gemm_v1/src/kernel.rs` at
`c4fcb4d980cf979c0527dfa135a7b9f4fe72a811` byte for byte. Their Verus tabs
link the exact bounded source/model proof at `5a45239ae` and show its pinned
replay command. Their Host tabs link and show the protected Worker V2 hardware
test command at `c4fcb4d9`; the Result tabs record the exact marker, worker and
LLVM identities, 256 bitwise oracle matches, immutable A/B checks, all A/B/C
guard canaries, and the 14.36-second result. This is a real fixed-shape source
and measured route, not tutorial pseudocode. Each promoted Kernel, Verus, and
Host tab also names the canonical evidence record that covers its exact source
path and commit; curriculum validation rejects missing or mismatched links.

The `gemm-tiling` lesson also records the implementation contract from
[fe2o3 #138](https://github.com/harsh-nod/fe2o3/issues/138). The target is one
safe-Rust user kernel for dynamic dimensions and strides, multiple 16-wide K
phases, M/N/K tails with zero-filled LDS slots, unconditional publish/reuse
barriers, disjoint lane and workgroup ownership, and the runtime `alpha/beta`
epilogue. It catalogs 15 canonical semantic mutations and assigns each an
honest source-enforcement owner plus a required structured-Kernel-IR result.
The current checkpoint separates three enforcement layers.
Ten safe companion UI fixtures fail under rustc: three are fully owned by local
Rust typestate and seven reject sealed-surface escape attempts while retaining
dynamic verifier obligations. The other five canonical mutations remain
well-typed and verifier-only. None of those rustc UI errors is a fe2o3 proof
diagnostic.

Independently, canonical bounded structured Kernel IR rejects all 15 mutations
with their exact property, stage, and `0x464701xx` code, and the compiler driver
transaction emits no artifact. This is structured-IR evidence, not source
derivation. A separate exact mutation-oracle corpus now makes each of the 15
safe Rust files one reversible edit of the same full baseline. Individual
managed MI300X builds authenticate each file through optimized MIR and reject it
at compiler preflight with the expected property, stage, `0x464701xx` code, root
symbol, source and terminal spans, reachable call chain, and no artifact.

Those compile-time failures are bounded mutation-oracle source-to-diagnostic
evidence. The positive production source reaches only a structural,
non-authoritative frontend correspondence. A private owner-retaining final join
for the reference and vectorized schedules is compiled but is not called by the
production preflight. Verus proof execution remains fail-closed pending the
pinned root-owned runtime closure, and no qualified protected general-GEMM
hardware launch exists. Complete-family `SOURCE_TO_IR=false`, `LOWERING=false`,
and `PROTECTED_EXECUTION=false` therefore remain unchanged.

This is one exact bounded Slice 1 protected hardware observation. It does not
authenticate compiler origin, consume a Verus certificate, establish
MIR-to-Kernel-IR or Kernel-IR-to-LLVM/ISA refinement, generally prove
illegal-access or race freedom, generalize GEMM, or cover protected Slice 3 or
Slice 4. The earlier observational MI300X tiled-GEMM run remains separate.

Commit `5a45239ae` adds a bounded Verus relation for the exact Slice 1 source
model. It reports 96 verified and 0 errors for exact lengths, same-epoch LDS
initialization, publish-barrier ordering, unique C ownership, and correspondence
among the attributed profile, portable-MIR receipt, reviewed correspondence,
and canonical module identities. Four targeted mutations are rejected. Clean
MI300X validation passed 76 debug tests, 76 release tests, 7 doctests in each
lane, strict Clippy, all six positive proof groups, and all 21 expected
rejections. This is identity-bound source/model correspondence only. It does
not prove rustc/MIR-to-IR semantics, LLVM, linking, emitted machine behavior,
Worker V2 integrity, certificate consumption, loading, or launch authority.

Slice 3 at `5bc57587b` adds a fixed-K16 grid/stride source model for positive
tile-aligned M and N. Verus reports 101 verified and 0 errors for padded
lda/ldb/ldc bounds, exact and injective workgroup-to-tile mapping, four bounded
stores per lane, and global disjointness of C ownership. The aggregate runner
now checks positive summaries of 73, 93, 196, and 101 obligations and requires
12 expected negative rejections. Ordinary models exhaust 1x1 through 3x3 grids
with representative padding and a 64x48 case with lda=33, ldb=79, and ldc=96.
Commit `f38fe82ca` separately lowers the exact M=64, N=48, K=16, lda=33,
ldb=79, ldc=96, 3x4-grid graph through upstream LLVM 22. The final-object test
observes gfx942:xnack- COV6, WG64, workgroup X/Y, 1,024-byte LDS, one barrier,
one BF16 MFMA, and no spills, scratch, calls, atomics, or COMGR. This is exact
IR-derived machine-shape evidence, not protected execution, hardware numerics,
or compiler refinement.

Slice 4 at `f24063534` seals an exact M=17, N=19, K=18 Kernel IR graph over a
2x2 WG64 grid. It carries FP32 accumulators across two K16 phases, zero-fills
BF16 tails into reusable XOR4 LDS, uses unconditional publish and reuse
barriers, and predicates C reads and writes for alpha=2 and beta=-1. Nine tests
exhaust the valid/tail coordinate and ownership domains and reject barrier,
access, phase, accumulator, coefficient, target, resource, and layout drift.
Commit `35575cc32` lowers only that exact graph through upstream LLVM 22 and
passes final gfx942:xnack- COV6 machine inspection. The object has WG64/wave64,
1,024-byte fixed LDS, zero private segment and spills, LDS traffic, two static
barriers, one static loop-body BF16 MFMA, and no scratch, calls, atomics, or
COMGR. Clean current-main validation passed 5 active focused tests with 1
intentional ignore, the exact ignored machine test, 129 active dialect tests
with 23 intentional ignores, strict Clippy, and 362 active Kernel IR tests with
1 intentional ignore. This remains IR-derived machine-shape evidence, not
attributed-source lowering, protected execution, hardware numerics, or compiler
refinement.

The missing production chain is still material. Source receipt to the inert
descriptor and Worker V2 boundary is complete in closed
[`#85`](https://github.com/harsh-nod/fe2o3/issues/85), and canonical matrix wire
V5 is complete in closed [`#93`](https://github.com/harsh-nod/fe2o3/issues/93).
The sealed exact-profile registry in
[`#96`](https://github.com/harsh-nod/fe2o3/issues/96), direct LLVM/LLD API
finalizer in [`#97`](https://github.com/harsh-nod/fe2o3/issues/97), and generated
host adapter in [`#99`](https://github.com/harsh-nod/fe2o3/issues/99) are
complete. Under [`#94`](https://github.com/harsh-nod/fe2o3/issues/94), the exact
one-shot `Joined -> Loaded -> Completed -> Unloaded` implementation in
[`#100`](https://github.com/harsh-nod/fe2o3/issues/100) is also complete. Its
fake-adapter suite is joined by one exact protected mi300x hardware measurement.
That bounded result is not compiler-origin authentication, source-to-HSACO or
Verus authority, general illegal-access or race-freedom proof, generalized
GEMM, or protected Slice 3/4 execution.
Exact Slice 4 lowering is complete and
[#86](https://github.com/harsh-nod/fe2o3/issues/86) is closed. Protected Slice
3 and Slice 4 execution remain open in
[#88](https://github.com/harsh-nod/fe2o3/issues/88) and
[#89](https://github.com/harsh-nod/fe2o3/issues/89), and generalized dimensions,
strides, tails, and coefficients in
[#90](https://github.com/harsh-nod/fe2o3/issues/90). Bounded #87 groundwork is
integrated, but production certificate consumption remains open in
[#91](https://github.com/harsh-nod/fe2o3/issues/91), relation extension through
K-phase, grid, and edge profiles in [#92](https://github.com/harsh-nod/fe2o3/issues/92),
and MIR-to-Kernel-IR semantic refinement in
[#106](https://github.com/harsh-nod/fe2o3/issues/106). This synchronization pass
is tracked in
[`fe2o3-kernels#2`](https://github.com/harsh-nod/fe2o3-kernels/issues/2).
Compiler and Verus-to-machine refinement and an IEEE BF16/F32 numerical
contract also remain open. No production LDS GEMM source execution is claimed.

The latest head also adds authenticated Verus execution V2 for Linux x86_64
against pinned local runtime and tool snapshots. It uses `clone3` pidfds and
ptrace-unresumable checkpoints, denies process creation with seccomp, compares
the live executable to its backing, pins the runtime closure, baseline, and
vDSO, and returns immutable sealed results. Its artifact policy rejects
compressed and alternate debug sections. Package-scoped debug stripping makes
the debug artifact reproducible, with a bounded two-root SHA-256, size, and
Build-ID gate. On the pinned local host, debug V2 integration passed 14/14,
release passed 13/13, and the full verifier debug/release suites plus 22 doctests
passed. The same run on MI300X correctly failed closed against a different vDSO
and runtime baseline.

Authenticated V2 does not integrate stock Verus or Z3, establish semantic proof
validity, guarantee exclusive measured-image execution between checkpoints,
prove compiler refinement, or grant GPU authority.

Earlier commit `027ab901bef7007d0e8da3370470556ed28baad1` remains the source
of the exact official gfx942 A/B/C/D register maps pinned to AMD Matrix
Instruction Calculator commit
`2ef91896bcdc4d26624f952e5c905c787cd9bc9e`, executable XOR4 A and
transposed-B staging, exhaustive 64-lane x 4-component goldens, exact
source-level Rust-Verus correspondence, pinned Verus executable bytes, 23
public proof functions covering 73 obligations, and five rejected formula
mutations. Workflow-only descendant
`a51c78322e264c06abdb6dc21817aced09653830` installs Rust 1.97.1 for the
hosted Verus job and changes no proof or kernel semantics. The layout packet
remains source-level evidence. Later tiled checkpoints and their authority
limits are intentionally not restated here; the typed staged-evidence records
are the canonical source rendered by the site.

## Maturity labels

Every technical claim uses one of five labels. A non-design claim is invalid
unless it includes the exact fe2o3 commit and tree, at least one command, and at
least one source path. Staged progress references additionally require explicit
claim and limited-authority labels. Runtime claims also require a target
identity.

| Label | Meaning | Does not imply |
| --- | --- | --- |
| Runnable now | A current fe2o3 path builds and executes the named kernel. | Formal correctness or a fully safe host ABI. |
| Verus model | Verus checks a source or source-model property. | Refinement from Rust/MIR through the emitted machine code. |
| HSACO mechanics | A compiler, LLVM, linker, or code-object mechanism has focused tests. | End-to-end kernel correctness on hardware. |
| GPU observed | A documented hardware campaign ran a pinned target and command. | A proof for all inputs, targets, or compiler versions. |
| Design only | The lesson is an implementation and proof plan. | Compilability or runtime support in the audited stack. |

The schema enforcing these rules lives in
[`src/content/model.ts`](src/content/model.ts) and
[`src/content/validate.ts`](src/content/validate.ts). Unit tests reject missing
evidence and advanced lessons that claim runnable status.

## Current boundary

At the audited pin:

- Scalar fill is runnable, with a legacy raw launch boundary called out in the
  lesson.
- Typed vector addition is the strongest current single-source runnable path.
- The associated Verus models cover bounds, initialization, overflow
  obligations, and injective ownership arguments at the modeled source level.
- Exact ordinary attributed Rust sources now exist for one masked Wave64
  reduction/scan profile, one LDS reduction, and a separate scoped atomic add.
  Their CPU oracles, mutation suites, and Verus models are public. The atomic
  source carries global address-space identity through `DeviceGlobalMutPtr`,
  generated host admission uses an exclusive `GlobalMut`, and LDS scratch
  consumes an exact linear `DynamicLds` capability. Exact compiler profiles and
  opaque direct upstream LLVM/LLD finalization now cover the fixed LDS-reduction
  and scoped-atomic forms. Typed profile-bound host/runtime lifecycle mechanics,
  exact dynamic-LDS dispatch binding, and protected harness vectors are public.
  Both exact kernels subsequently passed the normal pin-gated MI300X lifecycle
  in debug and release after canonical target-machine layout binding replaced
  the stale spelling. Source/compiler/machine refinement, generalized memory
  safety, and generalized race freedom remain open for synchronization.
  Wave64 has subsequently
  reached an exact source-derived compiler profile, direct upstream LLVM/LLD
  finalizer, typed one-shot runtime lifecycle, and a four-mask protected gfx942
  observation. It still lacks compiler and Verus-to-machine refinement joins.
- The tiled-GEMM checkpoint now has source-authenticated selection of the
  canonical direct-global one-tile Kernel IR, a guarded gfx942 hardware harness
  for separately supplied bytes, and structural Worker V2 artifact admission.
  One exact externally supplied 6,672-byte artifact has now passed the guarded
  MI300X run, bitwise oracle, A/B/C unchanged-value comparison, adjacent
  canaries, and unload checks. The observation is non-authoritative and does not
  join the Rust source to those bytes.
- LDS Slice 1 now has canonical Kernel IR and V5 matrix wire bytes, a separate
  Verus source model, authenticated attributed Rust source-to-IR correspondence,
  bounded identity-bound source/model proof, an exact compiler-owned descriptor,
  a single-use Worker V2 handoff, exact direct LLVM/LLD API finalization, an
  inert generated host adapter, a one-shot `Joined -> Loaded -> Completed ->
  Unloaded` lifecycle implementation, LLVM lowering, and final-HSACO
  machine-shape evidence. The exact production route also has one bounded
  protected mi300x run over 256 outputs with unchanged A/B values, A/B/C guard
  canaries, bitwise CPU-reference agreement, and terminal unload identity.
  An independent six-case MI300X run observed the IR-derived HSACO over 1,536
  outputs with allocation canaries. That hardware run remains independent of the
  source-bound finalization and host-preparation records, so it is neither
  protected source execution nor a source-to-hardware refinement result.
- LDS Slice 2 has a bounded exact-real K-phase Verus model, executable integer
  event models for 1, 2, and 4 phases, and an independent K32 backend/final
  machine-shape record. It has no attributed multi-phase GPU source, runtime
  hardware execution, protected authority, or LLVM refinement proof.
- LDS Slice 3 has a bounded fixed-K16 Verus grid/stride model plus exact
  upstream LLVM/LLD and COV6 machine-shape inspection for one padded 3x4 grid.
  It has no attributed source, protected execution, hardware numerical, or
  refinement result.
- LDS Slice 4 has exact tail-safe two-phase Kernel IR and upstream LLVM/COV6
  machine-shape inspection for one 17x19x18 profile, including alpha/beta and
  predicated edge access. It has no attributed source, protected runtime or
  hardware numerical execution, compiler refinement, or general profile.
- `#[kernel]` is the canonical user form. The procedural attribute marks an
  ordinary Rust function for fe2o3's frontend and generated typed API, including
  exact WG64/WG256 launch contracts. Slice 1 now reaches canonical Kernel IR, an
  exact descriptor, a one-shot inert final HSACO receipt, and generated typed
  host preparation, then enters a fixed one-shot lifecycle with exact context,
  resource, ABI, completion, and terminal-unload checks. This implementation
  exposes no generic or raw launch. One exact bounded protected Slice 1 run has
  passed; it does not authenticate compiler origin or establish source-to-HSACO,
  Verus, compiler-refinement, generalized-safety, or generalized-GEMM authority.
- `macro_rules!` is optional declarative compile-time token expansion. Vecadd
  uses it to share a small body with Verus; it is not the GPU kernel marker,
  creates no runtime mechanism, and proves nothing by itself. Production kernel
  algorithms should remain ordinary attributed Rust and do not require it.
- Tiled GEMM's exact fixed `16x16x16` Slice 1 Kernel, Host, and Result tabs are
  real and pinned. Its generalized dimensions, K phases, grids, tails,
  coefficients, and complete authority chain remain a design-level curriculum.
  Row softmax now displays its exact ordinary example-owned attributed source,
  with complete AST structural admission before a fixed reviewed
  interpreter/model and digest/certificate binding. It also has an exact typed
  host adapter, private linear HSA lifecycle, exact
  source/compiler/Worker/finalizer handoffs, a historical staged 25-pin
  release receipt, and a separate A/B LLVM release pair for which two fresh
  complete MI300X runs passed and independent review accepted the evidence
  package. Those runs dispatched no GPU and grant no runtime,
  authentication, refinement, generalized memory-safety, or race-freedom
  authority. W0's measured/no-authority host-link prerequisite is accepted, and
  a durable prepared-session consume foundation exists with `AUTHORITY=none`.
  Anti-rollback, key provenance, hostile same-UID resistance, multiwriter and
  cross-system coordination, publication/runtime/GPU authority, and protected
  hardware evidence remain open.
  FlashAttention Phase A now has exact ordinary
  attributed B=1, H=1, N=8, D=16 causal source, an independent two-pass FP64
  oracle, executable proof-facing models, debug/release mutation suites, and a
  pinned Verus proof of its exact rational online recurrence. The latest public
  snapshot also authenticates its exact attributed source, FnAbi, complete
  reachable portable MIR, semantic Kernel IR, compiler configuration, and V3
  provider identity. G4 carries that exact profile through a single-use Worker
  V2 handoff, upstream LLVM target-machine APIs, in-process LLD, structural
  checks, and an opaque deterministic finalization receipt. That receipt grants
  no publication, load, launch, runtime, GPU, numerical, performance,
  compiler-refinement, OCML-semantics, general memory-safety, or race-freedom
  authority, and it contains no measured proof of no-COMGR linkage. The exact
  profile now also has a typed four-buffer adapter that retains three input
  leases and unique output ownership, rejects aliases, and feeds a private
  linear join/load/dispatch-wait/unload lifecycle with reviewed HSA resource
  observation. Nine compile-fail boundaries and an independent strict-F32 CPU
  oracle pass. A separate pinned Verus memory/effect source verifies 13 exact
  fixed-domain obligations and rejects eight mutations, while its public
  expected-evidence descriptor remains inert and creates no proof receipt. The
  historical protected gate fails closed before HSA load. The current public
  path has accepted bounded W0 but still lacks W1 durable replay/session
  authority and subsequent linear receipt injection. No protected GPU dispatch
  or numerical GPU output is claimed, and
  compiler/OCML semantics, authenticated proof consumption, source/model/Verus-
  to-machine refinement, machine memory safety, generalized race freedom, and
  GPU execution remain open. MoE routing
  Phase A now has exact ordinary attributed T8/E4/K2/C4 source, an independent
  oracle, stable capacity/permutation/inverse contracts, a 6,561-case bounded
  corpus, debug/release mutation suites, a pinned Verus proof of the exact
  mathematical routing policy, and separate exact compiler admission binding
  source, FnAbi, complete reachable portable MIR, semantic Kernel IR, target,
  ABI/resources, and V3 provider identity. G5 carries that exact profile through
  a single-use Worker V2 handoff, upstream LLVM target-machine APIs, in-process
  LLD, exact structural checks, and an opaque deterministic non-Clone receipt.
  The measured direct worker passed in debug and release with identical raw and
  finalized identities. Publication, load, launch, runtime, GPU numerical,
  performance, compiler-refinement, Verus-to-machine, general memory-safety,
  and race-freedom authority remain open. A separate exact bounded
  memory/effect checkpoint verifies 16 Verus obligations over the eight-buffer
  logical source model and rejects eight named mutations. Its expected-evidence
  descriptor is copyable and inert: it cannot mint or join an authenticated
  receipt and proves no compiler, logical-address, machine-memory, generalized
  race-freedom, or GPU-execution join. The exact host-scheduled expert slice
  now has two ordinary attributed kernels, a four-expert
  compaction/GEMM/inverse/combine host model, an independent direct oracle,
  debug/release canary coverage, and a pinned Verus model with 15 verified
  obligations and six rejected mutations. This is source, host-model, oracle,
  and bounded logical-proof evidence only: compiler admission, finalization,
  typed runtime, protected GPU execution, numerical refinement, and
  source/model-to-machine joins remain open. Grouped or persistent expert
  scheduling remains separate work. The GPU device code-object path uses
  upstream LLVM target-machine APIs plus in-process LLD with no COMGR or shell
  GPU linker, but this is not a measured no-COMGR claim.
- The production path described by the audited repository is Rust to Kernel IR
  to direct LLVM/LLD to HSACO, followed by machine-effect inspection and
  protected evidence. The #97 path uses direct LLVM target-machine and LLD
  library APIs, never COMGR linking.

Verus proves the specifications encoded in its source models under their stated
assumptions. It does not by itself prove LLVM lowering, linker behavior, the
HSACO machine effects, the ROCm runtime, numerical error beyond the stated
model, or physical hardware. Those gaps require compiler validation,
code-object inspection, differential tests, canaries, and target-specific GPU
evidence.

CUDA and HIP kernels can also be analyzed or verified with external tools. The
fe2o3 direction explored here is different: keep the kernel in Rust and bind
explicit source proof, compiler evidence, artifact identity, and hardware
observations to the same reviewed unit. This repository makes no claim that
other GPU languages are inherently unverifiable.

## Curriculum

The documentation app contains 18 lessons across nine modules:

0. Evidence orientation and an MI300X/gfx942 setup.
1. Fill, typed vector addition, indexing, `DisjointSlice`, and launch shape.
2. Verus contracts, negative tests, overflow freedom, initialization, and
   injective writes.
3. Bounded reduction/scan semantics, wave64, barriers, atomics, and LDS.
4. Tiled GEMM invariants, phase ownership, numerical specifications, and proof
   decomposition.
5. Row-softmax runtime contracts plus exact FlashAttention Phase A source,
   online invariants, masking, and numerical contracts.
6. Exact MoE top-2 Phase A source, scans, permutation and capacity bounds,
   followed by expert GEMM and deterministic-dispatch design work.
7. Rust-to-HSACO evidence, machine-effect checks, protected evidence, and the
   Verus trust boundary.
8. Exercises and the contribution evidence packet for a new kernel.

The first screen is the tutorial workbench: desktop curriculum tree or mobile
drawer, lesson progress, evidence labels, four code tabs, exercises, glossary,
search, architecture view, and light/dark themes.

## Local development

Prerequisites are Node.js `22.22.1` or newer and npm. Dependencies are locked in
`package-lock.json`.

```bash
nvm use
npm ci
npm run dev
```

Vite prints the local URL. The production build uses the GitHub Pages base path
`/fe2o3-kernels/` and hash routes so lesson links work from a static host.

## Tests

Install the Playwright Chromium binary once, then run the complete suite:

```bash
npx playwright install chromium
npm run test:all
```

The gates are also available separately:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Vitest validates the content schema, status labels, evidence pins, glossary,
search, navigation, tabs, copy behavior, theme, and progress state. Playwright
checks every internal lesson route plus the glossary and architecture pages,
desktop and mobile navigation, keyboard search, code tabs, persisted progress,
theme behavior, screenshots, and page-level horizontal overflow.

Tutorial snippets live in `examples/`. Runnable-looking advanced snippets carry
an explicit `DESIGN ONLY` marker. They are not compiled against fe2o3 because
the audited frontend does not expose those end-to-end source paths; treating
them as compile tests would create false authority.

## Content structure

```text
examples/                 Snippet sources imported into lessons
src/content/model.ts      Evidence and lesson schema
src/content/validate.ts   Runtime schema validation
src/content/modules-*.ts  Structured lesson content
src/components/           Tutorial workbench views
src/diagrams/             Code-native technical diagrams
tests/                    Schema and interaction tests
e2e/                      Responsive route and browser tests
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before adding a lesson or changing a
maturity label.

## Deployment

On a push to `main`, GitHub Actions builds and deploys `dist/` only after
authenticated Git resolution confirms that both required fe2o3 public refs
equal the checked-in publication commit and tree. Workflow permissions are
scoped per job, deployment is serialized, and actions are pinned to immutable
commit SHAs.

Pull requests and pushes also run lint, type checking, unit tests, the production
build, and Chromium browser tests. A green site build is not evidence that a GPU
claim is true; the content evidence rules remain a separate gate.

## Honesty policy

1. Never infer a stronger status from a weaker one. A passing Verus model is not
   a GPU run; an HSACO inspection is not a source proof.
2. Never label an example runnable without an exact command, immutable fe2o3
   commit and tree, source paths, and target where execution is involved.
3. Keep expected-negative verification tests next to positive proof claims.
4. State assumptions, trusted components, and unproved obligations in the
   lesson itself.
5. Downgrade stale claims when the pinned source or command can no longer be
   reproduced. Do not silently move the lesson evidence baseline.
6. Treat design code as explanatory material until a real frontend path,
   compiler test, code-object check, and appropriate hardware test exist.

## License

This tutorial site is available under the [MIT License](LICENSE). Source links
and evidence references point to fe2o3, which retains its own licensing and
copyright notices.
