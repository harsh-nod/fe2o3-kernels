import { deepFreeze } from "./registry";

export type RuntimeMilestoneId =
  | "runtime-ownership-pipeline-v2"
  | "public-vecadd-sync-v1"
  | "current-v2-mi300x-requalification-v1"
  | "compiler-generated-cov6-kfd-bridge-v1"
  | "kernel-ir-v1-c454-compiler-convergence-v1";

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
  status: "implementation-checked" | "evidence-reviewed";
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
