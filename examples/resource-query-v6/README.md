# Recorded source-backed resource queries

These are the unmodified request/response JSONL bytes from the actual CPU debugger
run used by `../resource_query_v6.json`. The fixture selects exact responses from
this transcript; it is not a reconstructed execution. Validate it with:

```sh
node scripts/validate-resource-query-observation.mjs
```

The source is the compiler fixture named in the projection; its exact SHA-256 is
retained. The executable bundle, source map and stopped-checkpoint identities are
bound in the responses. The run used a work-in-progress compiler build; an exact
exporter/compiler commit and protected artifact are unavailable. Committing these
files does not retroactively attest that build or make this a qualified curriculum
release. The transcripts contain CPU logical state, not observed GPU registers,
allocation lifetimes, instruction latency or GPU timing.

Reproduce from fresh ordinary Rust using the compiler scripts documented in
`../../docs/resource-memory-windows.md`; new sessions can have new process-local
cursors. Query tokens in this retained transcript are inert observations, never
capabilities for a different live session.
