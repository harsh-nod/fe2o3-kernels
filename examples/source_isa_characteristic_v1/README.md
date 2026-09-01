# Source/ISA characteristic tutorial fixture

This directory is the byte-exact website copy of the compiler fixture at commit
`861e8a9027bffa4dc5bf61d149eb2277dbefe692`, tree
`0233d541ffb8c2a573444eda76683bc4adca2cb9`.

The fixture is synthetic, canonical, self-claimed, unexecuted, and
unauthenticated. It is useful for demonstrating the read-only protocol, but it
is not authenticated producer evidence and is not a result from the protected
3x2 `gfx942`/`gfx950` acceptance matrix. Issue #215 remains open.

`collection.hex` decodes to the exact 1424-byte canonical self-claimed archive.
The SHA-256 of those raw canonical bytes is
`ad395666f9a036a259ce6a8f6e47a568693dbfe1c923c3eb6bd062492627b3b4`.
The decoded collection's separate, domain-separated identity is
`5595821cf85ebc8cb5018f68a7ac07e938af0b4ed424e9f4039201581db23a7c`.
Neither value authenticates a producer.

Run the transcript from a checkout containing `cargo-fe2o3`:

```text
xxd -r -p examples/source_isa_characteristic_v1/collection.hex > characteristics.bin
cargo fe2o3 inspect --format source-isa-characteristic-v1 \
  --output agent-json-v1 characteristics.bin \
  < examples/source_isa_characteristic_v1/requests.jsonl
```

The exact stdout is `responses.jsonl`. Its four canonical records cover
capability discovery plus target, fact, and separately paged sparse-interval
queries. The archive contains one source-anchored plain global-store target with
two duplicate-equivalent facts at distinct catalog ordinals and occurrence
identities. Both equal sparse intervals retain distinct ordinals and identities.
A second guarded global-store target has zero correlations, so structural target
discovery does not fabricate source or ISA facts.

Every response keeps archive authenticity, producer evidence, compiler, proof,
publication, runtime, hardware, LLVM classification, final ISA opcode
classification, decoded ISA, complete machine coverage, scheduling, and semantic
refinement authority false. Sparse final-HSACO intervals are compiler lineage
anchors only. The fixture is not a live debugger session, ROCgdb replacement,
rocprofv3/ATT trace, decoded instruction stream, or performance record.
