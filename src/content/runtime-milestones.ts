import { deepFreeze } from "./registry";

export type RuntimeMilestoneId =
  | "runtime-ownership-pipeline-v2"
  | "public-vecadd-sync-v1"
  | "current-v2-mi300x-requalification-v1"
  | "compiler-generated-cov6-kfd-bridge-v1"
  | "kernel-ir-v1-c454-compiler-convergence-v1"
  | "bounded-persistent-lifecycle-verus-v1"
  | "same-source-bounded-decision-kernel-v2"
  | "operation-typed-runtime-effect-plans-v3";

export interface RuntimeMilestoneOutcome {
  name: "Completed" | "DefinitelyNotPublished" | "RetainedTerminal";
  detail: string;
}

export interface RuntimeHardwareExample {
  command: string;
  requirement: string;
}

export interface RuntimeEvidenceRecord {
  path: string;
  sha256: string;
  classification:
    "Measured,one-bounded-isolated-run,accepted-with-post-validator-limitation";
}

export interface RuntimeMilestone {
  id: RuntimeMilestoneId;
  number: string;
  title: string;
  state: "implemented";
  status:
    | "implementation-checked"
    | "formal-model-verified"
    | "evidence-reviewed";
  measurement: "unmeasured" | "bounded-mi300x-observation";
  summary: string;
  why: readonly string[];
  enables: readonly string[];
  pipeline?: readonly string[];
  pipelineKicker?: string;
  pipelineTitle?: string;
  outcomes?: readonly RuntimeMilestoneOutcome[];
  commands: readonly string[];
  expected: readonly string[];
  hardwareExample?: RuntimeHardwareExample;
  limitations: readonly string[];
  commit: string;
  tree: string;
  manifest?: string;
  evidenceRecord?: RuntimeEvidenceRecord;
  sourceAvailability?: "github" | "local-branch";
  sourcePaths: readonly string[];
}

export const runtimeMilestones = deepFreeze([
  {
    id: "runtime-ownership-pipeline-v2",
    number: "00",
    title: "One runtime ownership pipeline",
    state: "implemented",
    status: "implementation-checked",
    measurement: "unmeasured",
    summary:
      "The native KFD runtime now uses one ownership pipeline for queue submission, completion, retirement, and destruction across its supported single- and two-queue compositions.",
    why: [
      "A GPU packet can outlive the CPU call that published it. Linear queue, dispatch, completion, and resource owners prevent a timeout or dropped value from being mistaken for cancellation.",
      "The executable OutstandingDispatchRegistryStateV1 is the canonical projection. Native transitions compute its successor before mutating the concrete authority table, keeping modeled state and retained KFD ownership aligned.",
      "Removing duplicate submit and teardown paths gives later compiler-generated launches one reviewed protocol to target. That refactored protocol has not yet been hardware-measured at this commit.",
    ],
    enables: [
      "A public synchronous launch facade that can preserve ownership without exposing raw addresses or diagnostic environment switches.",
      "Bounded multi-dispatch execution with exact completion identity, per-queue FIFO retirement, and certificate-gated destruction.",
      "Measured optimization of the fixed 64-slot registry without first reconciling competing implementations.",
    ],
    commands: [
      "cargo test -p fe2o3-runtime-model --locked",
      "cargo test -p fe2o3-kfd --features live-validation --locked",
      "cargo clippy -p fe2o3-kfd --all-targets --all-features --locked -- -D warnings",
    ],
    expected: [
      "87 runtime-model tests pass, including 100,000 sequential dispatch retirements without capacity exhaustion.",
      "The KFD live-validation suite passes without opening /dev/kfd or running a GPU kernel.",
      "Strict all-feature Clippy completes with warnings promoted to errors.",
    ],
    limitations: [
      "This commit has source, unit, and retained oracle coverage, but its current V2 runtime identities have not yet been re-observed on MI300X.",
      "Packet submission, one-step polling, release, and retirement remain crate-private until the synchronous facade can preserve the same linear authority.",
      "The historical first-kernel V1 observation remains evidence for its original frozen source only.",
    ],
    commit: "e5c8d66c5520d1bce7cf2db911c200f1cf4c5536",
    tree: "1c694eed427526dc507a129a721237613bafe094",
    sourcePaths: [
      "crates/fe2o3-kfd/ARCHITECTURE.md",
      "crates/fe2o3-kfd/src/queue_live.rs",
      "crates/fe2o3-kfd/src/queue_submit.rs",
      "crates/fe2o3-runtime-model/src/outstanding_dispatch_registry.rs",
    ],
  },
  {
    id: "public-vecadd-sync-v1",
    number: "01",
    title: "Public one-shot synchronous vecadd API",
    state: "implemented",
    status: "implementation-checked",
    measurement: "unmeasured",
    summary:
      "A small public KFD facade now consumes one checked gfx942 device, one exact validated COV6 kernel, and two caller-provided [f32; 256] arrays, then returns a verified [f32; 256] result or one of two ownership-preserving failure outcomes.",
    why: [
      "This is the first public launch boundary over the canonical queue and outstanding-dispatch ownership protocol. Callers do not receive raw addresses, file descriptors, diagnostic environment switches, or arbitrary external-artifact authority.",
      "Publication uncertainty is represented in the type system instead of being collapsed into an ordinary error. Only a failure proven to precede packet publication returns the exact device and request for caller-directed reuse.",
      "The public facade and current-V2 diagnostic adapter use the same nine-resource production core, so documentation, tests, and a later compiler bridge do not introduce a second submit or teardown path.",
    ],
    enables: [
      "A caller can supply two fixed 256-value inputs to the exact validated COV6 vecadd profile and receive all 256 verified output values with redacted verification and teardown counts.",
      "A thin future compiler or host leaf can target one typed synchronous call without making fe2o3-kfd depend on fe2o3-host.",
      "Later persistent, batched, and asynchronous designs can be compared against an explicit one-shot ownership baseline rather than a diagnostic-only command.",
    ],
    pipeline: [
      "Bind the exact COV6 artifact and both caller arrays, then prepare the exact nine-user-resource composition, including its retained Barrier-signal role, plus the three queue resources.",
      "Make code visible with the WC policy and publish the PM4 ACQUIRE predecessor as packet 0; the kernel dispatch cannot publish until that predecessor is confirmed.",
      "Publish the kernel as packet 1, retain its exact dispatch/completion owner, and verify 256 outputs, 512 input values, and allocation canaries after completion.",
      "Release the exact completion owner, retire it in per-queue FIFO order, seal and jointly destroy the queue, then unmap and release user9 + queue3. Success reports released12 and retained0.",
    ],
    pipelineKicker: "One canonical core",
    pipelineTitle: "Nine resources, PM4 predecessor, dispatch, then exact teardown",
    outcomes: [
      {
        name: "Completed",
        detail:
          "Returns verified [f32; 256] output and redacted counts only after completion release, FIFO retirement, sealed queue destruction, unmapping, and resource release. The checked device is consumed and may be closed.",
      },
      {
        name: "DefinitelyNotPublished",
        detail:
          "Returns the exact unchanged device and request only when no packet can have been published. This is the sole outcome from which the caller may decide to retry.",
      },
      {
        name: "RetainedTerminal",
        detail:
          "Returns an opaque, non-Clone, process-lifetime owner after publication uncertainty. It exposes no retry, teardown, raw authority, or cancellation path; Drop performs no native cleanup.",
      },
    ],
    commands: [
      "cargo test --locked -p fe2o3-kfd queue_sync_launch::tests::",
      "cargo test --locked -p fe2o3-kfd --test sync_launch_api",
      "cargo build --locked -p fe2o3-kfd --example kfd-vecadd-sync",
    ],
    expected: [
      "Facade unit tests cover redacted completion, every closed failure class, and process-lifetime retention without opening /dev/kfd.",
      "Compile-fail UI tests reject cloning, cross-thread transfer, retry, teardown, and private-retention access from terminal authority.",
      "The opt-in example builds as a pure-Rust KFD executable; building it does not select a device or execute a GPU packet.",
    ],
    hardwareExample: {
      command: "kfd-vecadd-sync <unique-id> <exact-cov6-hsaco>",
      requirement:
        "Copy only. Running this command is opt-in and requires an MI300X with the exact gfx942:xnack- COV6 artifact and KFD access.",
    },
    limitations: [
      "This public facade identity remains implementation-checked and unmeasured. The separate current-V2 diagnostic observation below exercises the shared core; it does not promote this API identity or establish API-level hardware, latency, throughput, or performance evidence.",
      "The API is a fixed-size, fixed-profile, one-shot synchronous convenience boundary, not a reusable context or a throughput-optimal executor. It performs no automatic retry or cancellation.",
      "A catastrophic backend kernel/VMA containment invariant failure, or inability to discard an unexposed setup VMA, terminates the process and returns none of the three ordinary outcomes.",
      "Persistent contexts, batching, asynchronous progress, futures/wakers/deadlines/executors, general kernel profiles, and the compiler/host leaf bridge remain deferred milestones.",
    ],
    commit: "e9d4adf9240684d39ce877306437d2e9b2de7115",
    tree: "83cb7fb98519f1934af7f263f823363668c41ba7",
    manifest: "ceeaa7cfc973a576004ceaba10f95c4681a90b3edf266d382f6f8021e8083e2c",
    sourcePaths: [
      "crates/fe2o3-kfd/src/queue_sync_launch.rs",
      "crates/fe2o3-kfd/src/queue_vecadd_launch.rs",
      "crates/fe2o3-kfd/examples/kfd-vecadd-sync.rs",
      "crates/fe2o3-kfd/tests/sync_launch_api.rs",
    ],
  },
  {
    id: "current-v2-mi300x-requalification-v1",
    number: "02",
    title: "One bounded MI300X current-V2 requalification",
    state: "implemented",
    status: "evidence-reviewed",
    measurement: "bounded-mi300x-observation",
    summary:
      "One isolated run of the exact e9d4adf9 source snapshot completed the shared current-V2 core on MI300X: PM4 packet 0, dispatch packet 1, exact verification, owner release, FIFO retirement, queue destruction, and resource teardown.",
    why: [
      "This is the first retained hardware observation of the refactored production core, recorded separately from the public API's implementation claim. It establishes one bounded run, not general hardware proof or API-wide promotion.",
      "The additive evidence record binds the executed source commit and tree, release binary, exact COV6 artifact, mode-0444 run log and sidecar, target identity, one-attempt chronology, and reviewed outcome. The record makes no filesystem-immutability claim, was authored after the run, and was not present in the executed binary.",
      "Keeping the measured record separate prevents the runtime manifest from becoming evidence by assertion. The record classifies itself as authority=none and retains the manifest only as an authenticated input binding.",
    ],
    enables: [
      "Future runtime changes can requalify against one exact observed sequence: harmless preflight, PM4 publish/confirm, dispatch publish/confirm, verification, release, FIFO retirement, destroy, unmap, and release.",
      "The successful core result and the failed outer validator are independently visible, so the launcher count defect can be fixed without erasing or rerunning the accepted one-shot attempt.",
      "The exact release and retained counts provide a bounded teardown baseline for the later compiler leaf, persistent-context, batching, and asynchronous milestones.",
    ],
    pipeline: [
      "One admitted attempt created one queue. PM4 packet 0 reached acquired value 0 with counters W=1/R=1 before dispatch publication.",
      "Dispatch packet 1 reached acquired value 0 with counters W=2/R=2; the run recorded two MMIO stores and no surviving process.",
      "The core verified 256 output values and 384 canary bytes, then released the completion owner and retired the dispatch in FIFO order.",
      "The queue was destroyed, nine user resources were unmapped, 12 total resources were released, and retained allocations reached 0.",
    ],
    pipelineKicker: "One observed core run",
    pipelineTitle: "PM4, dispatch, verification, then complete teardown",
    commands: [
      "cargo test --locked -p fe2o3-kfd --test current_v2_live_evidence",
      "cargo run --locked -p fe2o3-kfd --features live-validation --example kfd-current-v2-requalification",
      "cargo run --locked -p fe2o3-kfd --features live-validation --example kfd-current-v2-requalification -- --preflight",
    ],
    expected: [
      "Three CPU-safe evidence tests freeze all 101 canonical record fields, the record digest, exact artifacts, outcome, exclusions, and launcher limitation.",
      "The no-argument example performs harmless preflight only: kfd_opened=false and native_actions=0.",
      "The explicit --preflight form exercises the same harmless path and does not open /dev/kfd or publish a packet.",
    ],
    hardwareExample: {
      command:
        "/usr/bin/timeout --verbose --signal=TERM --kill-after=5s 60s /usr/bin/env -i /absolute/path/kfd-current-v2-requalification --live <unique-id>",
      requirement:
        "Copy only. This is an MI300X-only local requalification shape for the exact pinned binary and artifact. It is one attempt with no automatic retry; any nonzero result is terminal.",
    },
    limitations: [
      "The accepted run had raw runtime status 0 and completed both the core and outer result, but the launcher reported group_status=1 afterward: its ordered-gate validator expected 1 match and counted 2, from the harmless-preflight line and core-completion line.",
      "No rerun was performed. Independent acceptance is based on raw status 0 plus the exact runtime outcomes; wrapper status 0 is explicitly excluded, and the launcher actual2/expected1 defect remains open.",
      "Both zero capability observations are AmbiguousZero, not negative activation evidence. This record grants no general cache-coherence, firmware-fetch, formal hardware-completion, portability, performance, persistent-queue, ROCr-equivalence, or general-dispatch claim.",
      "The record is additive, post-run evidence with authority=none. It was not embedded in the executed binary and does not establish a reproducible build or signed source-to-binary attestation. Publication remains on hold.",
    ],
    commit: "d892b66fe6e300990495e0b7728d5eee152ab66c",
    tree: "33e4d9cf8592c39d831f8e240ebc5c0de4b233e3",
    evidenceRecord: {
      path: "crates/fe2o3-kfd/evidence/current-v2-requalification-mi300x-20260820.record",
      sha256: "7324c8a8457c20298ccac1b7791fe219cf72d83dd982aea145c5b730fa19d6c3",
      classification:
        "Measured,one-bounded-isolated-run,accepted-with-post-validator-limitation",
    },
    sourcePaths: [
      "crates/fe2o3-kfd/evidence/current-v2-requalification-mi300x-20260820.record",
      "crates/fe2o3-kfd/tests/current_v2_live_evidence.rs",
      "crates/fe2o3-kfd/examples/kfd-current-v2-requalification.rs",
      "crates/fe2o3-kfd/src/queue_vecadd_launch.rs",
    ],
  },
  {
    id: "compiler-generated-cov6-kfd-bridge-v1",
    number: "03",
    title: "Compiler-to-KFD compatibility leaf",
    state: "implemented",
    status: "implementation-checked",
    measurement: "unmeasured",
    summary:
      "A Linux/x86_64 leaf now authenticates a compiler-embedded typed vecadd payload and requires the unchanged exact c454 COV6 loader closure before it can delegate to the canonical KFD facade. The current exact-target development payload is deliberately rejected before bridge-owned VM, memory, queue, or packet work.",
    why: [
      "Compatibility must close before bridge-owned VM, memory, queue, or packet work. A mismatch after native effects begin may require process-lifetime retention, while this pure rejection remains definitely not published and preserves every caller-owned input.",
      "The current development payload is SHA-256 556f97ee4e509b4cb3118ff73afae21491506a83077cdac2a3a0a250d56a3c68 and 6104 bytes. It authenticates as a compiler payload, then fails the exact COV6 binder at RequiredWorkgroupSize { actual: None }.",
      "The dependency direction is one-way: the bridge depends on host authentication, the AMDHSA loader, and KFD. None of those lower layers depends on the bridge; KFD still does not depend on the host crate, and the leaf contains no packet, doorbell, ioctl, or raw-file-descriptor implementation.",
    ],
    enables: [
      "A compiler-issued marker can be checked through container authentication, AMDHSA planning, selected-kernel closure, and the exact c454 binder without first constructing a checked device.",
      "Callers that already own a checked gfx942:xnack- device receive that exact device and request back when compatibility or later proven-prepublication KFD setup rejects the attempt.",
      "Once a compiler path emits the exact admitted executable, the leaf can call the existing one-shot facade exactly once instead of introducing another submission or teardown implementation.",
    ],
    pipeline: [
      "Authenticate the embedded typed container, compiler profile, kernel binding, and redacted payload SHA-256 and byte length.",
      "Validate the AMDHSA envelope, select vecadd, and require the unchanged gfx942:xnack- c454 COV6 kernarg, workgroup, resource, image, entry, and artifact closure.",
      "Return DefinitelyNotPublished on any mismatch. The isolated current-development command takes no device input, and syscall calibration recorded zero opens of /dev/kfd or /dev/dri.",
      "Only Compatible may delegate once to launch_vecadd_cov6_sync; the bridge itself owns no VM, allocation, queue, packet, MMIO, or teardown machinery.",
    ],
    pipelineKicker: "Pure compatibility gate",
    pipelineTitle: "Compiler container, exact loader closure, then one canonical facade",
    commands: [
      "FE2O3_TARGET=gfx942:xnack- cargo run --locked -p cargo-fe2o3 -- run --locked --manifest-path crates/fe2o3-kfd-compiler-bridge/examples/compiler-generated-preflight/Cargo.toml",
      "cargo test --locked -p fe2o3-kfd-compiler-bridge",
      "FE2O3_TEST_VECADD_COV6=/absolute/path/to/vecadd-gfx942-xnack-off-cov6.hsaco cargo test --locked -p fe2o3-kfd-compiler-bridge --test real_cov6_compatibility -- --ignored --exact real_c454_payload_reaches_compatible_and_payload_substitution_fails_closed",
    ],
    expected: [
      "The exact-target development command asserts payload 556f97ee... / 6104 bytes and prints definitely-not-published: current dev payload is not exact c454. A syscall-traced calibration of that command recorded zero device-path opens.",
      "The bridge unit, dependency-direction, source-closure, and compile-fail UI tests pass without selecting a device or opening KFD.",
      "The CPU-only c454 fixture reaches Compatible, while a one-bit payload substitution fails closed as DefinitelyNotPublished.",
    ],
    limitations: [
      "This milestone is implementation-checked and unmeasured. No compiler-generated artifact reached CheckedDevice construction, KFD open, VM creation, allocation, queue creation, packet publication, MMIO, completion, or GPU execution.",
      "The c454 positive test wraps the historical raw c454 payload in a test-fixture compiler container. It proves compatibility and mutation rejection, not that the current compiler emitted c454 or that the fixture container has compiler-origin authority.",
      "The isolated development package binds only its independently generated raw payload identity. It does not reproduce the original compiler container identity and makes no release-mode artifact claim.",
      "Compiler convergence and its source-closed c454 reproduction remain the next planned row, not a completed milestone. End-to-end compiler-to-KFD requalification, general kernels, performance, persistence, and publication all remain on hold.",
    ],
    commit: "c7b9b875504c4c5c4a3a05475a3915065360bccc",
    tree: "725496758cb0ce438cb805a8906c1cc922bf1cdd",
    sourcePaths: [
      "crates/fe2o3-kfd-compiler-bridge/README.md",
      "crates/fe2o3-kfd-compiler-bridge/src/linux.rs",
      "crates/fe2o3-kfd-compiler-bridge/examples/compiler-generated-preflight/src/main.rs",
      "crates/fe2o3-kfd-compiler-bridge/tests/real_cov6_compatibility.rs",
      "crates/fe2o3-kfd-compiler-bridge/tests/dependency_direction.rs",
      "crates/fe2o3-kfd-compiler-bridge/tests/source-manifest-v1.txt",
      "scripts/workspace-dependency-policy.json",
    ],
  },
  {
    id: "kernel-ir-v1-c454-compiler-convergence-v1",
    number: "04",
    title: "Exact Kernel IR V1 compiler convergence",
    state: "implemented",
    status: "implementation-checked",
    measurement: "unmeasured",
    summary:
      "Authenticated typed vecadd under the exact gfx942:xnack- KernelIrV1 route now enters a source-closed exact finalizer through audited ROCm 7.2.4 llc -O2 and lld tools, reproduces the admitted c454 COV6 payload, and reaches the existing bridge's Compatible result without opening KFD or DRM.",
    why: [
      "Milestone 03 proved that the bridge would accept c454, but its positive path used a historical test fixture while the then-current compiler emitted 556f. This closes that gap: authenticated compiler input now produces the exact artifact that the unchanged loader closure admits.",
      "The route authenticates exact input, target, typed profile, kernel binding, ROCm version bytes, executable paths, real paths, SHA-256 digests, lengths, modes, link counts, and open-file snapshots. It executes retained llc and lld file descriptors with a cleared environment, then revalidates the object, final HSACO, loader profile, and typed snapshots.",
      "Once authenticated vecadd selects this route, any IR, tool, object, output, or loader mismatch fails without falling back to clang. That makes compiler compatibility a stable boundary instead of an optimization that could silently select different code generation.",
    ],
    enables: [
      "The compiler-generated payload can traverse container authentication and the unchanged exact c454 loader binder to print Compatible while the process remains CPU-only and performs zero device actions.",
      "A separately authorized one-attempt MI300X review can now join compiler origin, the exact admitted payload, and the canonical one-shot KFD facade without weakening either side of the boundary.",
      "The narrow vecadd route provides an auditable baseline for later persistent execution and additional kernel profiles; those expansions must earn their own identities and evidence.",
    ],
    pipeline: [
      "Require one authenticated typed VecAddRustcLayoutV2 root and owner, exact vecadd logical/export names and binding, exact generated IR, and the literal target gfx942:xnack-.",
      "Authenticate the ROCm 7.2.4 version and sealed llc/lld executable snapshots, then finalize IR ec153356f5bd021b5d9a9dd6809eaa53cbfc43d3f3cc00c08c020ccbe1358d73 / 1779 bytes to object 8ade5e0e3807c7ceed3ffbbe8b1d12c489a5079ade2d4e8ebec18af14c8b5dee / 4440 bytes and HSACO c4547fe045f839711f1f022a485f50c7c1eafed7f5e4a7e96598e0d1c825908c / 5640 bytes.",
      "Revalidate the immutable IR, object, HSACO, typed binding, gfx942:xnack- COV6 loader profile, workgroup [256, 1, 1], max-flat 256, wave64, and zero private/group segments. The exact reproduction completes twice with identical identities.",
      "Pass the compiler container to the existing compatibility leaf. It prints Compatible; a syscall trace records zero /dev/kfd or /dev/dri opens and zero ioctl calls.",
    ],
    pipelineKicker: "One exact compiler route",
    pipelineTitle: "Authenticated Kernel IR, sealed ROCm tools, exact c454, then Compatible",
    commands: [
      "FE2O3_TARGET=gfx942:xnack- FE2O3_CODEGEN_PIPELINE=kernel-ir-v1 cargo run --locked -p cargo-fe2o3 -- run --locked --manifest-path crates/fe2o3-kfd-compiler-bridge/examples/compiler-generated-preflight/Cargo.toml",
      "cargo test --locked -p rustc-codegen-fe2o3 kernel_ir_v1_route_facts",
      "cargo test --locked -p rustc-codegen-fe2o3 exact_rocm_route_reproduces_c454_twice -- --ignored",
      "cargo test --locked -p fe2o3-kfd-compiler-bridge",
    ],
    expected: [
      "The custom-backend example prints compatible: compiler-generated Kernel IR V1 payload is exact c454, with payload SHA-256 c4547fe045f839711f1f022a485f50c7c1eafed7f5e4a7e96598e0d1c825908c and length 5640.",
      "The exact ROCm test reproduces IR ec153356f5bd021b5d9a9dd6809eaa53cbfc43d3f3cc00c08c020ccbe1358d73 / 1779 -> object 8ade5e0e3807c7ceed3ffbbe8b1d12c489a5079ade2d4e8ebec18af14c8b5dee / 4440 -> HSACO c4547fe045f839711f1f022a485f50c7c1eafed7f5e4a7e96598e0d1c825908c / 5640 twice; tool or output drift rejects the route.",
      "Hostile route tests reject vecadd authority and target substitutions without fallback. The existing fill path remains a separate explicit legacy-clang route only when its untyped fill facts authenticate exactly.",
    ],
    limitations: [
      "This milestone is implementation-checked, CPU-only, and unmeasured. It establishes no GPU execution, hardware result, numerical result, latency, throughput, or performance claim.",
      "The exact finalizer is intentionally limited to authenticated KernelIrV1 VecAddRustcLayoutV2 on gfx942:xnack-. It does not generalize c454 admission, the ROCm tool closure, fill, or any other kernel profile.",
      "The compatibility example and syscall trace construct no checked device and perform no KFD VM, allocation, queue, packet, MMIO, completion, or teardown action. Compatible is not launch authority or evidence that a GPU packet ran.",
      "One reviewed compiler-generated MI300X launch, persistent or asynchronous execution, general-kernel support, and public deployment remain later milestones. The publication gate is unchanged and remains on hold.",
    ],
    commit: "08af31846f37d715cfde9af67c843761a78c2b71",
    tree: "fc421688a08e5db538ef6729f280553a55e505cf",
    sourcePaths: [
      "crates/rustc-codegen-fe2o3/src/kernel_ir_v1_vecadd_cov6_llc_o2.rs",
      "crates/rustc-codegen-fe2o3/src/lib.rs",
      "crates/rustc-codegen-fe2o3/src/amdgpu_llvm.rs",
      "crates/rustc-codegen-fe2o3/tests/fixtures/kernel-ir-v1-vecadd-cov6-llc-o2.ll",
      "crates/rustc-codegen-fe2o3/tests/fixtures/kernel-ir-v1-vecadd-cov6-llc-o2-identity-v1.txt",
      "crates/fe2o3-kfd-compiler-bridge/examples/compiler-generated-preflight/src/main.rs",
      "crates/fe2o3-kfd-compiler-bridge/tests/source-manifest-v1.txt",
    ],
  },
  {
    id: "bounded-persistent-lifecycle-verus-v1",
    number: "V1",
    title: "Bounded persistent lifecycle proof",
    state: "implemented",
    status: "formal-model-verified",
    measurement: "unmeasured",
    summary:
      "A pinned executable Verus model now proves the bounded create, multi-dispatch, completion-credit, FIFO retirement, quiesce, destroy, and shutdown lifecycle, while a separate capability-safe Rust facade remains unavailable to native KFD construction until source refinement closes.",
    why: [
      "Queue reuse changes the ownership problem from one packet to a protocol: multiple published dispatches, completion credits, mappings, publications, and queue resources can remain live at the same time. The invariant makes early release, non-FIFO retirement, post-quiesce publication, and shutdown with live resources mathematical proof obligations instead of conventions.",
      "The authenticated Verus runner checks 39 persistent-lifecycle obligations and deliberately rejects eight unsafe mutations at their named postconditions. Its full closure counts 93 exact expected-negative checks, and every pinned unsafe mutation must fail before the transcript can remain green.",
      "The proof boundary is explicit. The bounded Verus model is proved; the larger Rust model and KFD facade are Checked, Linux/KFD/GPU effects are Contracted, and no source-level refinement is inferred from matching tests, names, or hashes.",
    ],
    enables: [
      "A reproducible formal regression gate for exact completion identity, retained credit, per-queue FIFO retirement, terminal phase monotonicity, and clean resource-free shutdown.",
      "A checked CPU implementation with 64 bounded in-flight slots, stable Pending polling, whole-context quarantine, authenticated host-coherent completion memory, exact trace replay, and ownership-preserving terminal outcomes.",
      "The next same-source Verus kernel can target a frozen transition vocabulary and replace the current Rust refinement HOLD without requiring a GPU experiment to stand in for proof.",
    ],
    pipeline: [
      "Create one nonzero context, admit generation-bound queue and resource identities, and derive fresh dispatch and completion-credit identities instead of accepting caller substitutions.",
      "Publish two dispatches, observe the later dispatch completing first, retain both credits, and reject non-FIFO retirement until the earlier dispatch releases and retires.",
      "Enter monotonic quiescence, reject new publication, retire the remaining dispatch, destroy the empty queue, discharge abstract resources, and reach terminal revision 13.",
      "Run every proof with the pinned Verus release and source closure; reject stale generation, post-quiesce dispatch, early credit release, non-FIFO retirement, outstanding destroy, live-resource shutdown, completion substitution, and terminal regression.",
    ],
    pipelineKicker: "Executable theorem package",
    pipelineTitle: "Two in flight, FIFO retirement, then resource-free shutdown",
    commands: [
      "cargo test -p fe2o3-runtime-model --locked persistent_runtime",
      "cargo test -p fe2o3-kfd --locked persistent_runtime",
      "crates/fe2o3-runtime-model/verus/verify-verus.sh",
    ],
    expected: [
      "The focused executable model reports 22 passed tests, including 10,000 stable Pending observations, whole-context quarantine, completion-memory rejection cases, exact trace substitutions, and clean shutdown.",
      "The focused KFD facade reports 16 passed unit tests and eight passing compile-fail authority guards; it never opens a device and exposes no native constructor.",
      "The pinned Verus lane reports persistent_runtime_obligations=39 and mutations=93 after all eight new persistent-runtime mutations fail at their intended postconditions and the 190-file verifier closure matches before and after.",
    ],
    limitations: [
      "The proved state machine is bounded to two queue slots and four lifetime dispatch slots. It does not refine the 64-slot Rust implementation, stable Pending coalescing, whole-context quarantine, completion mapping/publication liveness, or cleanup-capacity arithmetic; those Rust properties remain Checked.",
      "The KFD facade intentionally has no public or native queue constructor. It cannot execute a persistent GPU dispatch, and this milestone performed no KFD, DRM, MMIO, packet, compiler-build, application, or GPU action.",
      "Linux ioctl behavior, firmware scheduling, AQL system-scope ordering, completion atomics, reset isolation, compiler lowering, and AMDHSA machine conformance remain external contracts. The proof does not establish HIP/ROCr feature parity or hardware correctness.",
      "A same-source Verus transition kernel or machine-checked refinement is the release blocker before production orchestration can report Proved rather than Checked.",
    ],
    commit: "2e61da988c597d4357bd9a4bfbf9c03604015f90",
    tree: "1fab7ac0a4356b9c8238ebdf514015debc7bd89a",
    sourceAvailability: "local-branch",
    sourcePaths: [
      "docs/verified-persistent-runtime-v1.md",
      "crates/fe2o3-runtime-model/src/persistent_runtime.rs",
      "crates/fe2o3-runtime-model/verus/persistent_runtime_lifecycle_spec_v1.rs",
      "crates/fe2o3-runtime-model/verus/persistent_runtime_lifecycle_v1.rs",
      "crates/fe2o3-kfd/src/persistent_runtime.rs",
      "crates/fe2o3-runtime-model/verus/verify-verus.sh",
    ],
  },
  {
    id: "same-source-bounded-decision-kernel-v2",
    number: "V2",
    title: "Same-source bounded decision kernel",
    state: "implemented",
    status: "formal-model-verified",
    measurement: "unmeasured",
    summary:
      "The exact fe2o3-persistent-runtime-kernel src/lib.rs is now both ordinary executable Rust and the pinned cargo-verus proof input. For its bounded state space, Verus proves the encoded lifecycle contracts and invariant preservation, and seven executable witnesses cover the admitted full lifecycle, two-dispatch FIFO behavior, 64/65 capacity boundary, 10,000 stable Pending observations, terminal variants, exact cancellation restoration, and arithmetic rejection boundary.",
    why: [
      "Using the same executable functions for ordinary Cargo tests and Verus closes one important source-drift channel: the proved transition body is not a separately maintained pseudocode model. That does not prove its callers, operating-system effects, compiler, or machine code; it makes the exact bounded decision-kernel source itself an auditable proof boundary.",
      "Persistent execution has long-lived authority. A publication, completion observation, credit release, retirement, destroy, or resource discharge can be prepared before an external effect and committed afterward. Move-only effect plans, pre-effect capacity reservation, exact cancellation restoration, and absorbing quarantine make the decision about what authority remains a checked state transition rather than an informal cleanup convention.",
      "The invariant binds exact authority and memory-profile identities, monotonically fresh dispatch and completion identities, bounded outstanding and resource ledgers, trace capacity, retained terminal evidence, per-queue FIFO retirement, and ordered teardown. Proof development exposed invariant-admitted identifier-history and prepared-plan placement states that ordinary reachable-path tests did not reveal; closing those states is a concrete reason formal verification matters here.",
      "The verifier lane authenticates the Verus release closure, Rust toolchain, Z3, vstd revision, isolated Cargo lock, kernel/tooling source closure, required proof markers, positive summary, and all 40 pinned expected-negative mutations. A pinned mutation counts only if Verus exits with calibrated proof-failure status 101 and reaches its reviewed function and proof diagnostic with exactly one verification error, so parser, import, type, timeout, signal, crash, or toolchain failures cannot masquerade as a successful negative proof test.",
    ],
    enables: [
      "A proof-backed, CPU-executable decision boundary for prepare, commit, cancel, quarantine, stable Pending coalescing, exact terminal evidence, completion-credit custody, FIFO retirement, and resource-free shutdown within the published bounds.",
      "A same-source regression gate in which changes to executable transition code must preserve the exact contracts and invariants, while the 40 reviewed expected-negative mutations must continue to fail at their pinned obligations. This does not claim that arbitrary unsafe specification weakening must fail; a weakened specification may verify and requires review.",
      "A precise target for the next machine-checked refinement: typed KFD facade states can map raw driver observations and owned native resources into these proved decisions without inventing another lifecycle vocabulary.",
      "A defensible separation between what is proved and what is still contracted. External authority provenance, completion-memory certificates, Linux/KFD effects, and hardware behavior can now be closed by later artifacts instead of being silently included in the decision-kernel claim.",
    ],
    pipeline: [
      "Construct a bounded state from one exact runtime-authority identity and memory-profile identity. Validate exact live-completion certificates and reserve outstanding, resource, revision, and trace capacity before returning a move-only effect plan for an external action.",
      "Consume each plan exactly once through its matching commit, exact no-effect cancellation, or terminal quarantine. Publication uncertainty retains the preallocated identities and capacity instead of relabeling an indeterminate effect as definitely absent.",
      "Advance the oldest dispatch from Published through one revision-producing Pending observation, any number of exactly idempotent repeated Pending observations, exact Completed evidence, completion-credit release, and FIFO retirement. Foreign, stale, replayed, noncanonical, or wrong-identity evidence fails closed.",
      "Enter monotonic quiescence, seal the queue and context with exact certificates, destroy only when outstanding work is empty, discharge completion resources in exact retirement order, and shut down only with no live authority. The seven public executable witnesses inhabit the principal accepted and rejected paths inside the same proved source.",
    ],
    pipelineKicker: "Same executable source",
    pipelineTitle:
      "Reserve before effect, decide exactly once, then retire and tear down in order",
    commands: [
      "cargo test --locked -p fe2o3-persistent-runtime-kernel",
      "cargo test --locked -p fe2o3-persistent-runtime-kernel --test decision_model ten_thousand_pending_observations_are_exactly_idempotent -- --exact",
      "cargo test --locked -p fe2o3-persistent-runtime-kernel --test decision_model sixty_four_lifetime_resources_are_honestly_bounded -- --exact",
      "crates/fe2o3-persistent-runtime-kernel/verus/verify-same-source.sh --verify",
    ],
    expected: [
      "The ordinary CPU suite reports 19 passed integration tests. It covers the seven inhabited executable witnesses plus exact identity, certificate, replay, terminal-reason, wrong-plan, cancellation, quarantine, and ordered-teardown behavior without opening KFD or selecting a GPU.",
      "The focused Pending test reports one passed test after the first exact Pending observation advances once and 10,000 repeated exact Pending observations preserve the same public snapshot, revision, trace length, and retained authority.",
      "The focused capacity test reports one passed test: all 64 bounded lifetime slots can complete and retire under the exact resource ledger, while the 65th admission fails closed without fabricating capacity or reusing an identity.",
      "The authenticated same-source lane reports verification results:: 190 verified, 0 errors for the kernel itself and rejects exactly 40 pinned expected-negative mutations at their reviewed proof obligations. The vstd dependency's separate 2044-verified summary is not the kernel proof result.",
    ],
    limitations: [
      "Formal verification covers only the contracts, invariants, proof lemmas, and seven executable witnesses encoded in the exact bounded decision-kernel source. It is not a proof of the complete fe2o3 runtime, all possible Rust programs, liveness under an uncooperative environment, or equivalence to another implementation.",
      "Runtime-authority identities, live-completion certificates, teardown certificates, and their input values enter this boundary from callers. The kernel checks the encoded identity and state relationships; it does not prove external provenance, key custody, freshness across process loss, host memory coherence, or that a caller truthfully obtained those values.",
      "The proof does not establish that arbitrary safe Rust callers satisfy every Verus precondition. There is no machine-checked refinement from fe2o3-kfd or fe2o3-runtime-model to this kernel yet, so those adapters remain Checked or Contracted rather than inheriting this formal status.",
      "Linux, DRM and KFD ioctls, mappings, allocation and publication effects, AQL and system-scope memory ordering, firmware scheduling, GPU reset and isolation, completion hardware, compiler lowering, rustc/LLVM correctness, linking, and generated machine code are outside this proof.",
      "This is a bounded decision kernel: lifetime and outstanding dispatch/resource histories are capped at 64 and the trace is capped at 2,048 entries. The deterministic ledger-fold receipt is a consistency value, not a cryptographic commitment, collision-resistance result, or proof of external authority.",
      "EffectPlanV1 is move-only, but its public commit surface is not yet variant-typed. Passing a valid plan to the wrong commit method fails closed and consumes that caller token; it can leave the matching active effect stranded and therefore does not prove liveness. Typed plans are required before KFD facade refinement and integration.",
      "This milestone has no hardware example or evidence record and performs no KFD, DRM, MMIO, packet, compiler-build, application, or GPU action. It establishes neither HIP/HSA/ROCr feature parity nor a basis for removing those runtimes from workloads that require their broader APIs, tooling, libraries, or device support.",
    ],
    commit: "b0dd32a662fa618efc5a133901b69af685da4f72",
    tree: "5f2c5a2f408aed456e20ebf7b0e28fa652818152",
    sourceAvailability: "local-branch",
    sourcePaths: [
      "crates/fe2o3-persistent-runtime-kernel/Cargo.toml",
      "crates/fe2o3-persistent-runtime-kernel/src/lib.rs",
      "crates/fe2o3-persistent-runtime-kernel/tests/decision_model.rs",
      "crates/fe2o3-persistent-runtime-kernel/verus/VERIFICATION.md",
      "crates/fe2o3-persistent-runtime-kernel/verus/verify-same-source.sh",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/SOURCE_CLOSURE_V1",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/SOURCE_REQUIREMENTS_V1.toml",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/MUTATIONS_V1.toml",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/POSITIVE_SUMMARY_V1",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/NEGATIVE_COUNT_V1",
    ],
  },
  {
    id: "operation-typed-runtime-effect-plans-v3",
    number: "V3",
    title: "Operation-typed runtime effect plans",
    state: "implemented",
    status: "formal-model-verified",
    measurement: "unmeasured",
    summary:
      "The exact landed kernel replaces the public legacy untyped effect-plan surface with seven operation-typed, move-only same-source adapter plans. Exact operand getters expose only the copyable values needed to perform each external operation, while the plan itself remains the authority required by its matching resolver. Its authenticated Verus sweep proves 253 obligations and rejects all 73 calibrated unsafe mutations; KFD receipt and projection scaffolding remains Checked behind five explicit native-linkage HOLD findings.",
    why: [
      "Operation typing makes publication, Pending observation, completion observation, completion-credit release, retirement, destroy, and resource discharge distinct protocols. A caller cannot accidentally send a publication plan to a retirement resolver, and the legacy untyped EffectPlanV1 prepare/commit/cancel/quarantine surface is private instead of becoming an alternate public implementation that bypasses the typed contract.",
      "Each typed plan has an exact operand getter. The adapter can copy the queue, dispatch, resource, certificate, evidence, and revision values needed for the concrete call without receiving a constructor, plan field, or clone operation that could forge, duplicate, or erase the sealed logical authority.",
      "Resolution records three materially different facts. Confirmed no-effect restores the exact pre-prepare state; a successful effect applies the operation's exact successor; a possibly-effectful result enters absorbing quarantine and retains the reserved identities and custody. If the resolver is called against the wrong state, it returns the same rejected plan instead of consuming or silently dropping it.",
      "Queue identity is split into stable admission and first-use attachment. A redacted admission projection can carry stable, non-authoritative queue facts before submission, while one attachment owner is latched at the first dispatch-bearing cutpoint and cannot be substituted by a later queue, lineage, or revision.",
      "Unexpected completion evidence is exact rather than a fallback bucket: it requires current evidence whose acquired class is Unexpected. Current NotObserved, Pending, or Complete evidence cannot be relabeled Unexpected to advance either model.",
      "KFD-side effect receipts are opaque and operation-typed, bind lineage, revision, request or observation payload, history, and a checked monotonically fresh call identity, and require the result of each scoped driver call to be checked against its corresponding seal. Exhaustion or mismatch retains terminal custody instead of manufacturing success.",
      "The refinement auditor scans every non-test KFD Rust source and authenticates the kernel source, positive summary, and negative count through SOURCE_CLOSURE_V1. Its 24 hostile mutations make child-module native bridges, public receipt authority, freshness loss, mismatch-retention loss, missing result/seal checks, forged green counts, source substitution, and false proof-status promotion fail closed.",
    ],
    enables: [
      "A concrete KFD adapter can be written as prepare, read exact operands, perform one scoped effect, and resolve with the retained typed plan. That is a narrower and more reviewable refinement target than translating an untyped token after the effect.",
      "Confirmed no-effect paths can support an exact retry policy without confusing them with indeterminate effects, while possibly-effectful paths preserve process-lifetime custody and prevent unsafe teardown or identity reuse.",
      "Stable admission plus latched attachment gives the future native bridge a place to bind a real created queue before any dispatch and a separate linear cutpoint for the first dispatch-bearing packet, without exposing the native handle as public authority.",
      "CPU-only ordinary tests, same-source proof checks, and the hostile refinement audit can detect type erasure, evidence laundering, plan loss, forged receipts, and overclaimed status before any KFD device or GPU action is enabled.",
      "The five remaining refinement gaps are now named release blockers rather than hidden assumptions. Closing them can establish an honest native bridge; until then the facade stays Checked and the same-source kernel proof is not transitively a proof of KFD effects.",
    ],
    pipeline: [
      "Capture the redacted queue-admission projection only after queue creation has produced stable admitted facts. Preserve the native queue owner privately; the projection is copyable evidence, not permission to submit, destroy, or invent a kernel identity.",
      "Prepare exactly one operation-specific adapter plan and copy only its exact operands into the matching driver call. Keep the move-only plan outside the driver so unwind, error, and mismatch handling cannot lose logical custody.",
      "Resolve the returned effect with the same typed plan: success commits the exact successor, confirmed no-effect restores the exact origin, and possibly-effectful status quarantines the context while retaining reserved trace and resource authority. A rejected resolution returns its original plan unchanged.",
      "For polling, accept Unexpected only for current acquired-class Unexpected evidence. Then require the operation-typed KFD result to match its opaque fresh seal before projecting the observation into the executable model.",
      "Run the ordinary suites, authenticated same-source verifier, and 24-mutation fail-closed refinement audit in CPU-only CI. The real audit is expected to remain HOLD until all five native-refinement findings below are closed.",
    ],
    pipelineKicker: "Typed adapter cutpoint",
    pipelineTitle:
      "Prepare one operation, retain its authority, then resolve the exact effect",
    commands: [
      "cargo test --locked -p fe2o3-persistent-runtime-kernel",
      "cargo test --locked -p fe2o3-runtime-model persistent_runtime",
      "cargo test --locked -p fe2o3-kfd persistent_runtime",
      "env PYTHONDONTWRITEBYTECODE=1 python3 scripts/tests/persistent_runtime_refinement_audit.py",
      "env PYTHONDONTWRITEBYTECODE=1 python3 scripts/persistent_runtime_refinement_audit.py; status=$?; test \"$status\" -eq 1",
      "crates/fe2o3-persistent-runtime-kernel/verus/verify-same-source.sh --verify",
    ],
    expected: [
      "The ordinary CPU suites exercise all seven typed operation families, exact operand projection, exact no-effect restoration, possibly-effectful quarantine, rejected-plan retention, admission and attachment substitution, exact Unexpected evidence, and teardown without opening /dev/kfd or selecting a GPU.",
      "The audit self-test suite reports 24 passing hostile mutation cases and checks that a real HOLD exits 1 while malformed audit input exits 2. The following real-audit command succeeds only when the current five-finding HOLD is preserved; it must not be read as a GO result.",
      "The authenticated same-source command is CPU-only. At the exact landed source it reports verification results:: 253 verified, 0 errors and rejects exactly 73 calibrated expected-negative mutations at their pinned obligations.",
    ],
    limitations: [
      "CRITICAL NO_KERNEL_FACADE_REFINEMENT: fe2o3-kfd does not yet depend on and consume the verified kernel, so no executable KFD state transition or external effect is linked to the same-source proof.",
      "HIGH NATIVE_BRIDGE_UNAVAILABLE: the persistent effect trait remains private and has no production implementation or public constructor. There is no native KFD persistent driver in this milestone.",
      "HIGH MODEL_EFFECT_CUTPOINT_UNREFINED: facade model commits still precede several concrete effects; confirmed-no-effect, indeterminate, error, and unwind paths are not yet refined through the kernel's exact typed resolution rules.",
      "HIGH CURRENTNESS_CERTIFICATE_UNBOUND: facade lineage and a driver-supplied current bit do not yet construct the kernel's authenticated live-completion certificate, monotonic currentness epoch, admission identity, memory-profile generation, and revision binding.",
      "HIGH TRACE_RESERVE_UNREFINED: facade-local trace arithmetic has no executable mapping to the verified kernel's exact reserve invariant across dispatch, observation, retirement, quarantine, and teardown.",
      "The redacted queue-admission projection is intentionally not native queue, packet, mapping, file-descriptor, doorbell, or teardown authority. The future bridge must privately bind the logical QueueKeyV1 to the kernel-returned native queue identity, including a valid native ID of zero, and consume the one-shot attachment at the actual publication cutpoint.",
      "Formal status applies only to the exact same-source decision kernel, its encoded contracts, and its bounded state space at the commit and tree below. KFD receipt and projection code is implementation-checked; the five audit findings prevent it from inheriting the kernel proof.",
      "The exact commit passed one bounded, isolated MI300X current-V2 regression with queue ID 0, 256 outputs and 384 canary bytes verified, 12 resources released, and nothing retained while remaining classified UnmeasuredRequalification. That pre-existing nonpersistent path neither executes nor measures the V3 persistent adapter, and it establishes neither HIP/HSA/ROCr feature parity nor a basis for removing those runtimes.",
    ],
    commit: "ccd402e3f349fa216ff8ee255eabe2e4bd95ff70",
    tree: "063be2f0356363ad098457fd5880d38c57a568c1",
    sourceAvailability: "local-branch",
    sourcePaths: [
      "crates/fe2o3-persistent-runtime-kernel/src/lib.rs",
      "crates/fe2o3-persistent-runtime-kernel/tests/decision_model.rs",
      "crates/fe2o3-persistent-runtime-kernel/verus/verify-same-source.sh",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/SOURCE_CLOSURE_V1",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/POSITIVE_SUMMARY_V1",
      "crates/fe2o3-persistent-runtime-kernel/verus/pins/NEGATIVE_COUNT_V1",
      "crates/fe2o3-runtime-model/src/outstanding_dispatch_registry.rs",
      "crates/fe2o3-kfd/src/persistent_runtime.rs",
      "crates/fe2o3-kfd/src/persistent_runtime_receipt.rs",
      "scripts/persistent_runtime_refinement_audit.py",
      "scripts/tests/persistent_runtime_refinement_audit.py",
      "scripts/ci-local.sh",
    ],
  },
] satisfies RuntimeMilestone[]);

export function validateRuntimeMilestones(): string[] {
  const exactObject = /^[0-9a-f]{40}$/u;
  const exactDigest = /^[0-9a-f]{64}$/u;
  const ids = new Set<string>();
  const issues: string[] = [];

  for (const milestone of runtimeMilestones) {
    if (ids.has(milestone.id)) {
      issues.push(`${milestone.id}: duplicate milestone ID`);
    }
    ids.add(milestone.id);
    if (!exactObject.test(milestone.commit) || !exactObject.test(milestone.tree)) {
      issues.push(`${milestone.id}: milestone lacks exact commit and tree`);
    }
    if (milestone.manifest && !exactDigest.test(milestone.manifest)) {
      issues.push(`${milestone.id}: milestone manifest is not an exact digest`);
    }
    if (
      milestone.evidenceRecord &&
      (!exactDigest.test(milestone.evidenceRecord.sha256) ||
        milestone.evidenceRecord.path.startsWith("/") ||
        milestone.evidenceRecord.path.includes("..") ||
        !milestone.sourcePaths.includes(milestone.evidenceRecord.path))
    ) {
      issues.push(`${milestone.id}: measured evidence record is not exactly bound`);
    }
    if (
      (milestone.measurement === "bounded-mi300x-observation") !==
      Boolean(milestone.evidenceRecord)
    ) {
      issues.push(`${milestone.id}: measurement and evidence-record authority differ`);
    }
    if (
      (milestone.status === "evidence-reviewed") !==
      (milestone.measurement === "bounded-mi300x-observation")
    ) {
      issues.push(`${milestone.id}: status overstates or understates measurement`);
    }
    if (milestone.commands.length === 0 || milestone.sourcePaths.length === 0) {
      issues.push(`${milestone.id}: milestone is not independently inspectable`);
    }
    if (milestone.commands.some((command) => {
      if (/(?:FE2O3_RUN|\/dev\/kfd)/u.test(command)) return true;
      if (/--live(?:\s|$)/u.test(command)) return true;
      if (!/kfd-vecadd-sync/u.test(command)) return false;
      return command !==
        "cargo build --locked -p fe2o3-kfd --example kfd-vecadd-sync";
    })) {
      issues.push(`${milestone.id}: try-it commands must be hardware-safe`);
    }
    const hardwareCommands = new Set([
      "kfd-vecadd-sync <unique-id> <exact-cov6-hsaco>",
      "/usr/bin/timeout --verbose --signal=TERM --kill-after=5s 60s /usr/bin/env -i /absolute/path/kfd-current-v2-requalification --live <unique-id>",
    ]);
    if (
      milestone.hardwareExample &&
      !hardwareCommands.has(milestone.hardwareExample.command)
    ) {
      issues.push(`${milestone.id}: hardware example is not the reviewed command`);
    }
    if (milestone.outcomes && milestone.outcomes.length !== 3) {
      issues.push(`${milestone.id}: public launch must document exactly three outcomes`);
    }
  }
  return issues;
}
