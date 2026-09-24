# Recorded two-wave LDS CPU debugging (V22)

Open [the recorded LDS viewer](https://harsh-nod.github.io/fe2o3-kernels/#/debugger/lds-cpu-recording-v22).
For the complete kernel and checked-compilation path, read the
[two-wave assembly authoring lesson](physical-lds-exchange-source-v22.md).
This additive page reads retained diagnostic files; it never evaluates instructions,
runs a kernel, starts a bridge, or sends a debugger request.

## What the recordings show

The original-register example writes 128 words and preserves a 129th-word tail
canary. The edited-register example writes 13 words and preserves the guarded tail.
Both execute one 128-workitem group as two logical 64-lane waves. They contain three
distinct recorded allocations: read-only input, guarded output and a 512-byte
workgroup LDS frame. Allocation roles are joined to actual recorded root SSA
pointers, not guessed from ordinal order.

The complete index includes 128 distinct barrier arrivals and one release.
The recorded barrier **phase0** is not the authored publication **epoch1**.
The page does not expose a publication bitmap, physical EXEC or hardware wave
state. It displays each logical local-X as wave=floor(local-X/64), lane=local-X%64.

LDS does not exist in the first before-declaration snapshot. The recording retains
that transactional memory refusal, then the frame's first captured after-declaration
checkpoint: its initial storage bytes are zero but uninitialized. The viewer renders
uninitialized bytes as ??, never as valid numeric zero.

Four recorded relations show global-load and LDS-read SSA values pending, ready
after the same-site wait, and pending again after reverse navigation, for local-X 0
and 64. NotRepresented is an opaque value, not a numeric address or zero. Reverse
navigation restores immutable CPU snapshots; it does not resume a device.

## Reproduce the public recording surface

Use the explicit V22 route on actual source-produced canonical output:

```sh
fe2o3-debug sim --diagnostic-kir-v22 canonical-v22.bin \
  --request one-output129.request.json --protocol jsonl --wave-width 64 \
  --capture-index new-index.json \
  < one-output129.requests.jsonl > new-responses.jsonl
```

The index destination must not already exist. Match the request document to the
canonical entry and request stream: this example is bounded to grid/workgroup
[128,1,1], initialized 128-word input and two disjoint logical buffer allocations.
This command is CPU diagnostic tooling, not source authentication or artifact,
host, protected or GPU execution authority.

The browser takes four files: index (raw JSON or gzip), simulation request JSON,
request JSONL and response JSONL. It requires the explicit V22 index schema and
domain, the same request digest/configuration, complete recorded session with
termination, and actual event/snapshot/allocation joins. There is no V20/V21
fallback. Unknown fields, stale/foreign joins, inconsistent refusals, invented
pending numeric values, absent full final memory pages and inconsistent canaries
are refused without displaying partial or prior values.

Index rows contain metadata, not all SSA values or memory bytes. The table shows
at most 64 rows at a time; the independent sparse query selector displays at most 64
SSA rows or 256 memory bytes from one actual response. Selecting a row never
manufactures a missing checkpoint or fetches a new query.

## Exact retained evidence

These built-ins are **sourceR7-derived** recordings, not the separate later fresh
public-wrapper run. The public CLI R3 qualification passed on 2026-09-24:
6 sessions, 28 direct child processes, 96 transactional refusals, 13 bootstrap
refusals and 8 byte-exact legacy V20/V21 stream replays. The cumulative work control
produced 383 responses from 512 submitted requests before the expected denial.

- R3 report: 41158 bytes, SHA-256
  `e1042fbc3e0b97afafa0f0aef734556ecdea7bea1baaa5427cf914a9ba40efb8`.
- Completed gate: 119040 bytes, SHA-256
  `4b98d3542ad5758f70ee24c12cd9d1ee230e323302cc21cd11b4eb7f0b92a5c6`.
- Source R7 observation: 143142 bytes, SHA-256
  `f27f7a09778a5b55e0cb44b1bf913085b9c7428681cd6189c5b0d7bc984dd243`.

The selected files preserve exact raw JSONL integers, including the full u64
logical mask. Index file SHA-256, domain-separated payload identity, declared
canonical identity, raw canonical-file SHA-256 and request/configuration identities
are different fields. The latter canonical-file pin is evidence metadata; the
browser does not import or authenticate a canonical owner from it.

The website passed 53 focused tests and eight focused browser cases, then the
full suite: 1,876 unit tests in 131 files, 21 authoring-lab tests and 212 browser
cases with zero retries. The full-suite completed gate is 26,636 bytes, SHA-256
`b64d942c812ec325dc89a28179f077d2697261b573de9ef7ec4b7037abadb2ca`.
The existing bundle-size warning remains; no blanket warning-free claim is made.

The dedicated compiler publication link is pending. Global FE2O3_PIN and maturity
values remain unchanged.

## Bounds and unavailable capabilities

Bundled gzip bytes use a .gzip suffix so static servers do not interpret .gz as
HTTP Content-Encoding and transparently expand them before the compressed-byte
hash and size checks. Local .gz and .gzip files are both supported.

Gzip input is limited to 1MiB compressed and 8MiB expanded; streaming decompression
rejects an over-limit chunk before retaining it. The index is capped at 16384 rows,
each 16KiB, with depth 24 and at most 8 pending values. Its header and each row use
the existing lossless closed JSON parser; old parser limits are unchanged.
The request document is 16KiB; each JSONL is 1MiB, at most 192 pairs with 8KiB requests
and 64KiB responses. Aggregate input is 11MiB, aggregate queried SSA rows 8192 and
memory cells 8192. Cancellation/generation checks fence stale file, fetch, hash and
projection completions.

Physical registers, physical EXEC, source-variable maps, hardware observations,
runtime control, performance prediction, native addresses, pending-store queues
and publication bitmaps are unavailable. No live V22 bridge is provided.
Recorded direct-child exit is not whole-family cleanup evidence. The page's
consistency checks do not turn uploaded bytes into trusted source custody.
