import { modules0to2 } from "./modules-0-2";
import { modules3to5 } from "./modules-3-5";
import { modules6to8 } from "./modules-6-8";
import type { GlossaryEntry, Lesson } from "./model";
import { validateCurriculum } from "./validate";

export const curriculum = [
  ...modules0to2,
  ...modules3to5,
  ...modules6to8,
];

const issues = validateCurriculum(curriculum);
if (issues.length > 0) {
  throw new Error(
    `Invalid curriculum:\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`,
  );
}

export const lessons: Lesson[] = curriculum
  .flatMap((module) => module.lessons)
  .sort((left, right) => left.module - right.module || left.order - right.order);

export const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

const definitions: Record<string, string> = {
  "evidence binding": "A canonical identity join between a claim and the exact source, model, artifact, target, and observation that support it.",
  refinement: "A proof or validated relation showing that one representation preserves another representation's specified behavior.",
  authority: "An unforgeable capability to perform or approve an operation, distinct from descriptive evidence.",
  gfx942: "The AMD CDNA 3 processor target used by MI300X; feature modifiers such as xnack remain part of the target identity.",
  HSACO: "An AMD HSA code object containing executable kernels, descriptors, metadata, and ELF identity.",
  "target ID": "A processor plus normalized target features; parsed target text is not hardware attestation.",
  "code object": "A loadable GPU binary and its ABI/resource metadata.",
  ThreadIndex: "A logical invocation index witness used to preserve the association between an invocation and its allowed access mapping.",
  DisjointSlice: "A device view whose safe mutable access is partitioned by a matching thread index space.",
  "rounded tail": "Launched lanes beyond the logical element extent, which must perform no access.",
  "write partition": "A mapping that assigns concurrently executing identities disjoint writable regions.",
  "typed kernel": "A kernel whose generated host API binds a reviewed signature, ABI, artifact, launch, and ownership profile.",
  Prepared: "A launch state retaining validated arguments and borrows until dispatch completes.",
  "source sharing": "Using one algorithmic body from both executable Rust and its proof harness through explicit adapters.",
  "IEEE refinement": "A relation between abstract arithmetic and exact floating-point formats, operations, rounding, and exceptional values.",
  requires: "A Verus precondition that the caller must establish.",
  ensures: "A Verus postcondition established when the function or proof returns.",
  "ghost state": "Proof-only state erased from executable code and unable to authenticate runtime facts by itself.",
  "expected-negative test": "An intentionally invalid theorem or program that must fail at a specified obligation.",
  region: "An allocation identity, address space, byte offset, and byte length describing a memory effect.",
  provenance: "The authorized allocation identity behind an address, not merely its numeric pointer value.",
  initialization: "Evidence that a read region contains a value defined by the model.",
  injectivity: "The property that distinct invocation identities map to distinct outputs.",
  "race freedom": "Absence of unordered conflicting accesses to overlapping regions.",
  wave64: "A 64-lane AMD wavefront profile used by the reviewed gfx942 collective contracts.",
  "active mask": "The participating lanes for a wave operation.",
  reduction: "A scoped combination of participating values into one result.",
  scan: "A scoped prefix computation that returns one result per participant.",
  "participation scope": "The exact wave, workgroup, device, or system participants covered by an operation.",
  LDS: "AMD workgroup-local data share memory.",
  epoch: "A memory-effect phase separated by a synchronization boundary.",
  "barrier convergence": "The requirement that all participants reach matching dynamic barrier instances in the same order.",
  "atomic scope": "The set of agents whose atomic ordering is covered.",
  ordering: "The acquire, release, or sequential relation attached to a memory operation.",
  GEMM: "General matrix multiplication, C = A x B, often implemented with tiled cooperative loads.",
  tile: "A fixed submatrix or region assigned to a workgroup, wave, or lane fragment.",
  MFMA: "AMD matrix fused multiply-add instruction families.",
  "accumulator invariant": "A loop statement relating current accumulators to exactly the K phases processed so far.",
  "edge predicate": "A bounds guard for partial tiles at matrix or sequence boundaries.",
  "property ledger": "A review table mapping each assurance property to positive and negative evidence.",
  "translation validation": "Checking that a compiler output preserves a specific source or IR contract for that compilation.",
  "numerical oracle": "An independent implementation used to evaluate result error under a stated policy.",
  softmax: "A normalized exponential mapping over a specified active row domain.",
  "max subtraction": "Subtracting a row maximum before exponentiation to improve numerical stability.",
  "error budget": "An explicit bound on acceptable numerical deviation and its assumptions.",
  masking: "Excluding specified positions from an operation's semantic domain.",
  "flash attention": "A tiled attention algorithm that combines score computation, online softmax, and value accumulation without materializing the full score matrix.",
  "online softmax": "An incremental max/sum representation that remains equivalent to softmax over the processed domain.",
  "causal mask": "A mask allowing a query to attend only to keys at permitted earlier or equal positions.",
  "numerical refinement": "A proved or tested relation between an abstract numeric model and target operations.",
  "mixture of experts": "A model layer routing each token to a bounded subset of expert networks.",
  "top-k": "Selection of the k greatest candidates under a total tie-breaking policy.",
  capacity: "A maximum accepted route count for an expert.",
  "stable rank": "A deterministic ordinal among accepted routes with the same expert.",
  permutation: "A mapping from token-major routes to compact expert-major storage.",
  "grouped GEMM": "A collection of matrix products with per-group dimensions or operands.",
  "inverse permutation": "A map returning compact expert outputs to original token and route coordinates.",
  "weighted combine": "The ordered sum of routed expert outputs multiplied by router weights.",
  "persistent kernel": "A long-lived kernel that obtains multiple work items dynamically, usually from a device queue.",
  "Kernel IR": "fe2o3's target-neutral canonical kernel representation and verifier boundary.",
  LLVM: "The compiler infrastructure used to lower and optimize AMDGPU IR.",
  LLD: "LLVM's linker, used by the direct-link worker to produce code objects.",
  "machine-effect inspection": "Independent parsing of code-object ABI, resources, and instructions relevant to a claim.",
  "artifact binding": "Joining source, contracts, proofs, ABI, target, payload, and launch metadata to one executable identity.",
  Verified: "The intended label for all required authenticated property evidence plus compiler/runtime checks.",
  Checked: "Static and dynamic checks pass, but complete authenticated proof evidence is absent.",
  Unsafe: "At least one obligation is delegated to a documented unsafe caller.",
  "external body": "A Verus function whose implementation is trusted while its declared contract is assumed.",
  "assumption audit": "A review of premises, axioms, external bodies, abstractions, and trusted joins used by a theorem.",
  "vertical slice": "One bounded kernel path connected through source, compiler, artifact, runtime, and tests.",
  "acceptance contract": "The exact properties and evidence classes required before changing a maturity label.",
  canary: "Memory surrounding an allowed region used to detect out-of-bounds writes.",
  "signed evidence": "Canonical result data authenticated by a trusted signing key.",
  "protected policy": "Promotion rules and verifier inputs obtained from a protected base rather than candidate content.",
  "independent review": "A separate trusted signature over the exact evidence set required for Complete.",
  Complete: "A parity status requiring every row-specific acceptance class and protected signed evidence; absent at this baseline.",
};

export const glossary: GlossaryEntry[] = Array.from(
  new Map(
    lessons.flatMap((lesson) =>
      lesson.glossary.map((term) => [
        term.toLowerCase(),
        {
          term,
          definition:
            definitions[term] ??
            `A curriculum term introduced in ${lesson.title}.`,
          lessonId: lesson.id,
        } satisfies GlossaryEntry,
      ]),
    ),
  ).values(),
).sort((left, right) => left.term.localeCompare(right.term));
