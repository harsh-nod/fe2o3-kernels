# In-process profiler dispatch import tutorial evidence

These files are deterministic tutorial projections for the
`#/debugger/profiler-import` page. They explain the strict import and durable
publication contracts without pretending that the fixture ran on a GPU.

`dialects.json` is synthetic and unexecuted. Its two process records
intentionally reuse opaque rocprof agent handle `7001`; the handle maps to a
different synthetic KFD node in each process. This demonstrates why the JSON
binding key is `(process_index, source_process_id, opaque_agent_handle)` rather
than the handle alone.

`capture-projection.json` is a readable projection of the Capture embedded in
the Bundle. Production publication does not create a separate Capture file.
`bundle-v4-projection.json`, `receipt-v1-projection.json`, and
`publication-manifest.txt` show the identity chain and manifest-last order.
They are tutorial projections with schematic labels, not protocol wire records,
content identities, signed attestations, or compiler-emitted archives.
`agent-requests.jsonl` and `agent-responses.jsonl` are a deterministic
illustrative query exercise over that projection. They are not a production
protocol, authoritative result, service endpoint, or claim that an agent
operation is available.

The compiler milestone separately qualifies a bounded importer/sealed-loader
checkpoint on MI300X. The exact focused checks and frozen `generic-core` route
passed at soft `nofile=1024`. The installed-loader test directly observes sealed
target, SDK core, and SDK tool mappings with no internal role-variable leakage.
It does not directly observe interpreter, bootstrap, or adapter mappings. The
GPU-gated CLI suite covers KFD target identity, installed rocprof planning and
import policy, and fake collector records; it is not a real GPU-dispatch
rocprofv3-to-import roundtrip and grants no kernel-result or performance
authority. ATT remains unavailable without a mutation-proof sealed decoder
route. The protected source/ISA 3x2 matrix is unrun, T3 is still open, and T5
distributed overlap remains blocked on the issue #182 typed producer. The
config file binds this bounded qualification to the exact compiler checkpoint.
