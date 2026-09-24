# Browse a global-copy kernel's recorded CPU state

Open **Debugger → Source / ISA agent**, then **Open V21 recorded CPU viewer**.
This opt-in viewer reads retained V21 command recordings locally. It does not
connect to a debugger, compile a kernel, dispatch a GPU or replay execution.

The existing V19 and V20 routes are unchanged. The V20 live bridge does not
accept this V21 profile. Compiler pin and milestone maturity defaults are unchanged.

## Follow load readiness without inventing an address

Choose an original or register-edited retained session, then:

1. Select **Recorded pending value**. SSA root `0:1:26` is unavailable with
   `not_represented`. It is not zero, a guessed pointer address or a ready word.
2. Select **Recorded ready value**. The same root at the captured wait checkpoint
   is a `u32`, `0x80000001`.
3. Select **Recorded reverse to pending**. A later recorded reverse command
   selects the earlier checkpoint, where that same SSA is unavailable again.

The viewer joins actual request IDs, configuration, event/revision cursors,
KIR sites, lane scopes, root IDs and response anchors. The load/wait stage names
and before/after labels are *declared locator metadata*: their selected indexes
and sites must match captured observations, but they are not an authenticated
source map. This is observational navigation, not a resumable checkpoint or
deterministic re-execution. Physical registers and hardware addresses remain
unavailable even in the register-edited example.

Use the observation selector to inspect the actual accepted continuation page,
then the later stale-page refusal. A continuation is tied to its recorded
configuration, event and revision. A refused response cannot change the selected
producer session or borrow an SSA table from the previous response. The browser
does not fetch a page that is absent from the recording.

## Compare input and output separately

**Recorded final input** displays allocation 1, the read-only input.
**Recorded final output** displays allocation 2, the writable output. These
roles are declared by the exact simulation request and joined to captured global
pointer roots `0:1:0` and `0:1:1`, including allocation generation and offset.
Every observation containing either parameter root must retain that exact
captured global-pointer role and offset, including at later captured sites.
An omitted root on a bounded page is not an observation of that root.
Allocation-relative coordinates are not native addresses or host ownership proof.

The complete final recorded pages cover 528 input bytes and 532 output bytes.
Input remains unchanged. Depending on the selected session, 64, 128, zero or
33 words are copied. The unchanged bytes outside that write extent include
the output's prefix, suffix and any masked-off elements. Initialization is
shown separately: a stored byte with an unset initialization bit is not a valid
scalar value.

The declared V21 profile requires all resident lanes to perform the
full-EXEC input read before the output mask. This is a profile premise, not an all-lane
access trace observed by this viewer. Its checks cover the declared input
prerequisites, selected first-lane readiness observations and complete final bytes.
The zero-output case still requires valid, initialized input for all 128 lanes.
The partial-output case writes 33 words but does not reduce those input
requirements. A short output does not justify a missing or uninitialized input
read. The selected recordings are bounded CPU observations, not discharged host
bounds or alias obligations.

## What the bundled examples establish

Six containers preserve the exact UTF-8 simulation request and request/response
JSONL from the successful public CLI qualification:

| Source label | Workitems | Output elements |
| --- | ---: | ---: |
| Original | 64 | 129 |
| Original | 128 | 129 |
| Register-edited | 64 | 129 |
| Register-edited | 128 | 129 |
| Original | 128 | 0 |
| Original | 128 | 33 |

Each container contains 48 recorded pairs, including four correlated errors and
ten unavailable responses. The single-row continuation and its stale-revision
refusal are actual captured replies. Terminal malformed-request children belong
to separate qualification controls and are not spliced into these sessions.

[Provenance and exact byte hashes](../examples/physical-global-copy-debug-v21/provenance.json)
pin the retained source report and gate receipt. The source report is
`phase28-global-copy-cpu-debug-cli-source-r2/report.json`, SHA-256
`c75e81d345805893adeb3b6f1842b882ad4de257504f7a92fb5653a00cb62c59`.
Its qualification gate receipt is SHA-256
`ab3b199347b601ae81480eb3c66a575104817571a1820bd187a4c4e1a956bf20`.
These identify the prior CLI qualification; they do not claim that a new browser
import came from that producer or transfer source custody into the browser.

The **Declared origin** panel deliberately differs from **Facts checked across
the recorded observations**. The configuration digest binds a *claimed*
canonical identity and byte length plus exact request bytes to the session.
It does not verify canonical bytes, establish source ownership or authenticate
an arbitrary caller-supplied transcript. A consistent forged recording can
remain consistent; this viewer is not a source-authority verifier.

## Import a bounded unverified recording

Open **Display your own complete V21 recording**, select the explicit
`--diagnostic-kir-v21` checkbox, choose one JSON file and press
**Read local V21 recording**. Replacement, read failure or clearing immediately
removes previous values. Files stay local and no imported command is sent.

The closed outer format is `fe2o3-recorded-physical-global-copy-cpu-v21` and
requires exactly:

- `schema` and `selector` (`--diagnostic-kir-v21`);
- `declared`: canonical identity/byte length, the supported source label/entry
  and declared typed locator metadata;
- `simulationRequestUtf8`: the unchanged simulation-request document;
- `requestsUtf8` and `responsesUtf8`: complete, paired LF JSONL strings with
  discovery first and termination last.

Use a bundled container as a structural example. Preserve inner strings exactly;
do not parse and reserialize them through JavaScript `Number`. The viewer's
lossless parser retains the full u64 resident mask
`18446744073709551615`, which is distinct from physical EXEC. Unknown keys,
duplicate keys, unknown profiles, inconsistent hashes, stale successful queries,
false state changes and contradictory allocation histories are refused.
A declaration that claims source, hardware, runtime, protected or resumable
authority is refused.

## Import and presentation limits

| Limit | Closed maximum | Measured retained maximum |
| --- | ---: | ---: |
| Entire container before read/parser/hash | 256 KiB | 119,035 bytes |
| Simulation request | 16,384 bytes | 2,960 bytes |
| Paired commands | 256 | 48 |
| One request / response line | 8,192 / 65,536 bytes | 333 / 9,746 bytes |
| Capture records (not imported commands) | 8,192 | 6,400 |
| SSA rows per page | 64 | 39 |
| Bytes per memory page | 256 | 256 |
| Bytes per backing allocation | 4,096 | 532 |
| Total projected SSA rows | 16,384 | 175 |
| Total projected memory cells | 65,536 | 1,072 |

The file cap applies before `FileReader` and again before parsing or hashing.
UTF-8 bytes, not just string length, are checked. Frame/page/row/cell bounds
apply before typed per-page projection and accumulated display-map growth.
Only the currently selected page is rendered; earlier tables are not silently
carried into errors or unavailable responses. These are bounded browser
presentation limits, not the compiler's owned verification ledger or a measured
JavaScript heap-byte guarantee.

Source maps and variables, physical registers, native addresses, host
alias/bounds discharge, GPU behavior, protected execution and live V21 control
remain unavailable. This lesson closes no milestone by itself.

## Root qualification: 2026-09-24

Qualified on `mi350` against compiler main `07547cd4b33639863c9b8e8ef9f17514a040b169` and site base `2b2a504abd33f05a932b5c85d14d94aebd9d555c`. The six bundled request/reply/simulation-request strings were compared byte-for-byte with the retained actual CLI output; their declared locations were compared with the original locator files. This is a join to historical observations, not a new source-custody or GPU claim.

The focused gate passed 82 unit/UI/content tests, repository lint and type checking, production build and eight browser executions (four viewport/theme cases under both configured browser projects). The full regression passed 1,821 tests in 126 files, 21 authoring-lab checks and all 204 browser executions, with zero retries. Browser checks exercise recorded-data presentation; they do not execute a kernel or authenticate an imported recording.

Retained focused receipt: `logs/phase28-resume-r11-site-global-copy-viewer-v21-focused-r1/receipt.json`, 24,159 bytes, SHA256 `2a754d0b9b3a7ec02496230841806cfeb36733167fcb5550d39b97716e51242d`. Full-regression receipt: `logs/phase28-resume-r11-site-global-copy-viewer-v21-regression-r1/receipt.json`, 26,347 bytes, SHA256 `93ff5ec2eb7cbb91fec26c546495ffe68cadb9e4b79296cf5d7e5e71a42f4575`.

The cross-site parameter identity controls reject later input/output role, offset, availability or scalar substitutions. The UI separately labels the full-EXEC input requirement as a declared profile premise, not an observed all-lane access trace. Compiler pin, live V21 availability and milestone maturity remain unchanged.
