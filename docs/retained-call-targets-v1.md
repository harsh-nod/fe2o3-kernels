# Lab: inspect exact static kernel-to-helper calls

This follow-on to the [const-u32 helper lab](const-u32-helper-promotion-v1.md)
answers a narrower question than simulation: which retained helper does this
particular canonical Call target, and how do its operands bind to that helper's
formal parameters?

The additive API/CLI passed fresh source and call-query qualification on
2026-09-22 on both compiler forks. Use a newly built `fe2o3-author` that
implements `call-target`; the historical Phase20 binary and receipts did not
expose this query. The exact observations and their limits are recorded below.

## 1. Discover a Call in one exact bundle

Use a normal Bundle V6 export from the const-u32 workflow. Preserve its source,
bundle and existing receipts. Work in the matching compiler checkout; this
documentation repository does not build the author tool.

With the matching pinned toolchain and loader environment already configured:

```sh
AUTHOR_BIN=/absolute/path/to/newly-built/fe2o3-author
CALL_BUNDLE=/absolute/path/to/variant-v6.fe2sim
"$AUTHOR_BIN" inspect < "$CALL_BUNDLE"
```

Retain `bundle_identity`, `canonical_kir_digest` and `target` from that exact
response. Use the returned bundle identity to page the actual operation roster:

```sh
CALL_BUNDLE_ID='REPLACE_WITH_INSPECT_BUNDLE_IDENTITY'
"$AUTHOR_BIN" operations --bundle-identity "$CALL_BUNDLE_ID" --start 0 --limit 64 < "$CALL_BUNDLE"
```

Replace the uppercase slot before running. Continue with each returned
`next_start` until it is null. Select exactly one row with `kind: "call"`;
copy its complete `coordinate`. Do not guess the coordinate from the helper's
name, constant bits, displayed source range or a previous compilation.

Construct `CALL_SELECTOR` as one JSON string with these four fields:

```text
{
  "bundle_identity": "<inspect.bundle_identity>",
  "canonical_kir_digest": "<inspect.canonical_kir_digest>",
  "target": "<inspect.target>",
  "operations": [<selected operation.coordinate>]
}
```

This is a replacement template, not literal input. The coordinate must be the
actual JSON object containing numeric `function`, `block` and `operation`
ordinals. Pass the completed JSON as one quoted argument:

```sh
"$AUTHOR_BIN" call-target --selector "$CALL_SELECTOR" < "$CALL_BUNDLE"
```

The equivalent Rust API is
`snapshot.inspect_call_target_v1(&selector)`, where `snapshot` is an immutable
`AuthoringSnapshotV1` created from the exact verified Bundle V6. Neither form
accepts a caller-supplied callee override.

## 2. Read the static binding without mixing identity scopes

A successful response has schema `fe2o3-authoring-call-target-v1`. Its `call`
is the unchanged legacy operation view; the extra correspondence lives in this
separate query, not new fields silently added to `operations`.

| Field | What it identifies |
| --- | --- |
| `caller.function`, `caller.function_id`, `caller.role` | The selected operation's actual canonical function ordinal, opaque FunctionId and role. |
| `caller.kernel_registrations[]` | Every same-owner Kernel record whose retained entry equals that caller FunctionId, within the query bounds. |
| `callee.function`, `callee.function_id` | The function selected by exact equality with the retained Call target, not by matching a display name. |
| `arguments[i]` | Caller operand and callee formal at signature position `i`, after actual type and formal-definition checks. |
| `results[i]` | Caller SSA result and matching callee result-signature type at position `i`. |

A registration has `kernel` (its module-local ordinal), `kernel_id` and
`entry_function_id`. A KernelId and a FunctionId are distinct fields, even
when they happen to print the same text. For a kernel-entry call, require
`caller.role == "kernel_entry"` and find an actual registration whose
`kernel_id` equals the kernel selector in your preserved simulator request.
Its `entry_function_id` must equal `caller.function_id`. Do not assume
function zero, kernel zero or the first registration; keep any additional
matching registrations visible. The query reports retained canonical
registration, not authenticated Rust source registration.

The supported callee is a defined `internal_helper`. A caller may be a
registered kernel entry or a defined internal helper. A helper has no kernel
registrations and must not be presented as a kernel entry. Device-FFI export
roles are not representable in the current Bundle V6 canonical V11 payload;
they and external-import callers are unsupported by this query.

An operand's SSA number belongs to `caller.function`; a formal's number
belongs to `callee.function`. Equal numbers do not identify the same value
across those scopes. Repeated caller operands are allowed and remain separate
positional bindings. Conversely, `results[i]` does **not** identify a callee
`Return` operand: a result-signature slot is not a returned SSA definition,
and different control-flow paths may return different definitions.

## 3. Join the const-specialized bodies

The source workflow explicitly creates separate default, edited and repeated
variants, then a two-specialization kernel:

```rust
let result = specialized_or::<256u32>(low).0
    ^ specialized_or::<512u32>(a).0;
```

For each exact exported bundle, discover its Call rows afresh and query them
with that bundle's own selector. Join `callee.function` to the same complete
operation roster. Inspect the retained scalar helper operation and its direct
typed constant definition in that function: the intended specializations use
`256` and `512`, respectively. Now the Call target itself supplies the missing
static edge; the constant or function-name spelling is not evidence of an edge
by itself.

Compare the returned operands, formal positions and caller result slots with
the corresponding operation rows. Available source spans remain useful
navigation, but missing spans stay unavailable. Do not turn one direct edge
into a transitive helper-closure claim: this query does not traverse nested
calls. A complete tiny-helper roster can be inspected separately for additional
Calls, with that limited check reported explicitly.

The ordinary baseline need not contain a helper Call. No Call means no
`call-target` result; the absence of a query cannot establish the baseline's
kernel registration or fabricate a helper edge.

## 4. Keep observations, execution and stale identities separate

The query is read-only. It performs no source edit, fresh export, compilation,
simulation, native execution or hardware launch. A static Call identifies a
program location, not a particular invocation, lane, workgroup or debugger
frame. For actual stopped-frame observations, use the separate
[helper-frame source-value walkthrough](resource-helper-source-values-v2.md).

After changing the source, compile it normally and rediscover identities and
coordinates in the new bundle. An old selector must be refused against a
different bundle; stale canonical digests and mismatched targets are refused
too. A constant/non-Call selection, extra `callee` selector field or
`--callee` override must not silently choose another operation or target.
These are diagnostic identity/grammar refusals, not protected-proof
invalidation.

Fresh complete-buffer/canary simulation remains a separate acceptance step for
a changed source. If a new query run only revalidates retained simulator
requests/results, describe it as retained evidence revalidation with **zero new
simulations**, not a newly executed numerical test.

The response states:

```text
correspondence: exact_retained_call_operand_to_formal_position
transitive_helper_closure: not_traversed
dynamic_invocation: unavailable_static_call_site_only
physical_abi: unavailable_logical_canonical_call
```

A scalar helper call and its logical parameter bindings do not establish
physical VGPR assignment, register-save conventions, final machine calls or
native correctness. Reports grant no source/compiler authentication, proof,
production resume, load or launch authority. Stale checks do not change that.

## Bounds and qualification

The query accepts one direct Call, at most 64 arguments/formals/results and at
most 64 matching kernel registrations. Selected identity strings are capped at
4096 bytes, combined identity-comparison work is bounded, and the serialized
report must fit 256 KiB. The CLI also retains its 16 KiB selector limit.
Unsupported callees, missing or inconsistent registrations, invalid typed
bindings and exhausted bounds refuse rather than truncate or guess.

Both compiler forks independently built current tools and passed 164 authoring
tests plus 128 script controls. Each fresh const-u32 source capture performed
five exports and 150 CPU simulations with complete output, initialization and
canary checks (169 command stages, three exact CLI refusals).

Each subsequent call-query capture passed 23 normal CLI stages, five Call
queries and seven exact refusals. It revalidated the source capture's 75 requests
and 150 raw results; the query-only run performed zero new exports/simulations.
The two-specialization kernel exposed two exact registered-entry-to-helper
edges with typed constants 256 and 512. Baseline has no Call.

| Retained receipt | Bytes | SHA-256 |
| --- | ---: | --- |
| Canonical source | 417968 | `bd58e82fcca08d35c8239611b85af8f46ce8090b6ac97ce0f017bc098b66ec4b` |
| Canonical call query | 273153 | `0110e5c6d0e60bb557fd7ae29703e50ac8d7a110df71b51a852cc7578844f905` |
| Mirror source | 424539 | `9e99bc8f6b6133a674a5ccb1f28df10f3cf1d3877c2ddec06c1b9bd374e51840` |
| Mirror call query | 277010 | `8c7394fd9dbdf6afde92cb6abef5f437a43fe44ef3e180fdfdfaf08b352ab700` |

The compiler's [dated qualification](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-call-targets-20260922.md)
records source censuses, regression boundaries and a retained failed initial
fixture that attempted an unsupported V11 device-FFI role. The codec was not
weakened; this query was narrowed to roles actually admitted by the current
payload. This focused Markdown tutorial changes no UI, shared curriculum pin
or maturity label; prior browser results are not new call-query tests.

The [Phase20 const-u32 record](const-u32-helper-promotion-v1.md#recorded-canonical-qualification-2026-09-22)
correctly reported exact call edges as unavailable in its then-current public
projection. Leave that receipt unchanged. A newer tool may query the same
retained bundle and produce a new, separately qualified static observation;
it does not retrospectively add an observation to the old run.

This advances concrete helper/call-site inspection. It does not complete
physical helper/control-flow/ABI acceptance, arbitrary multi-level round trips,
transitive closure, or any broader milestone.
