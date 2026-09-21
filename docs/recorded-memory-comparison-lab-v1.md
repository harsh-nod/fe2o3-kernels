# Compare retained bytes, initialization, and missing memory

This reference lab uses unchanged excerpts from existing **source-produced CPU
recordings**. Open `#/debugger/source-isa-agent`, then **Open retained memory
reference lab** and **Open local resource recording**. No recorded command is
executed or uploaded. You choose the current window and every baseline explicitly.

This is not a published curriculum lesson, live debugger, selection exporter,
GPU test or compiler-variant comparison. All imported claims remain caller-supplied
and unverified. It does not change the curriculum pin or complete V2/V5.

## Prepare the files

Use a `fe2o3-kernels` checkout at the immutable **recordings** pin
`5f7374401f98bcff67c4a3a990dd6bc87c39613f`; run these shell commands from its root.
This pin identifies existing recordings and comparison code, not this newer guide
or an original compiler build. The current site supplies the guide.

Each command creates a new temporary directory, copies complete original JSONL
lines and prints their hashes. Keep the files byte-for-byte; no JSON reserialization,
renumbering or replay. Match both hashes before using the two file inputs. The
displayed hash identifies file bytes, not a producer or authenticated build.

### 1. A changed word, then a repeated event

```sh
lab_dir=$(mktemp -d)
sed -n '6,11p;14,18p;21p' examples/resource-query-v6/debug-requests.jsonl > "$lab_dir/global.requests.jsonl"
sed -n '6,11p;14,18p;21p' examples/resource-query-v6/debug-responses.jsonl > "$lab_dir/global.responses.jsonl"
sha256sum "$lab_dir/global.requests.jsonl" "$lab_dir/global.responses.jsonl"
```

Requests: 6,469 bytes, SHA-256
`c553afd680d7f3f0381f572be5d06c95909bd1cc67369cbaf4518175fa9292a1`.
Responses: 33,708 bytes, SHA-256
`1f1bd63c5960d9ba89b7ac96bbd669cc866ab665787c88d7adc129c7b1202bca`.

Predict: storing little-endian u32 **469** over four initialized `0xa5` bytes
changes how many storage bytes? How many initialization bits?

1. Import these two files. Keep current checkpoint **Request 6**, memory **Request 11**.
   The baseline starts empty. Choose **Request 15**, checkpoint 14, explicitly.
2. Inspect the first dword: **4 storage-byte differences, 0 initialization
   differences** in the 24-byte window. Independently, 469 = `0x000001d5`, so the
   bytes `d5 01 00 00` all differ from `a5 a5 a5 a5`.
3. Choose baseline **Request 21**. Expect **0 storage and 0 initialization
   differences**. Both events are 33, but current revision is 4 and baseline
   revision is 6. Do not collapse these into one snapshot identity.
4. Change current checkpoint to **Request 14**: the baseline clears. Replacing a
   file also clears old data. Reimporting never restores the previous baseline.

The eight canary bytes `de ad be ef ca fe ba be` agree in these selected windows.
This is neither a whole-execution proof nor attribution of a particular writer.
Browsing recorded reverse/repeated stops does not issue reverse execution.

### 2. One changed storage byte, four initialized bytes

```sh
lab_dir=$(mktemp -d)
sed -n '11,18p' examples/source_lds_resource_v1.requests.jsonl > "$lab_dir/lds.requests.jsonl"
sed -n '11,18p' examples/source_lds_resource_v1.responses.jsonl > "$lab_dir/lds.responses.jsonl"
sha256sum "$lab_dir/lds.requests.jsonl" "$lab_dir/lds.responses.jsonl"
```

Requests: 4,581 bytes, SHA-256
`ce1fc9640acc454cf8584efa9d87619fe5d822ff78b454d8367cc0d3ecbac7cf`.
Responses: 18,138 bytes, SHA-256
`e1b8d646649ccb4d3233cbe2f173553b35ec52fa99e9414c8bbcb60bd009b06c`.

Predict: a u32 write of **2** stores `02 00 00 00` over four previously
uninitialized zero storage bytes.

1. Import this pair. Keep checkpoint **Request 11**, memory **Request 13**.
   Explicitly choose baseline **Request 17**, checkpoint 16.
2. Expect **1 storage-byte difference and 4 initialization differences** across
   256 bytes. Choose **Byte** cells: offset 0 is **B+I**; offsets 1–3 are **I**.
3. Select offset 1 and read the textual details. Raw zero equals raw zero, but one
   side is uninitialized storage and the other is initialized.
4. The remaining 252 raw zeros are still uninitialized, not meaningful program
   values. A stored-byte snapshot is not a captured uninitialized-read fault.

Cells have non-color labels: **B** storage differs, **I** initialization differs,
**=** both recorded facts equal, **?** bytes not captured on both sides. Arrow keys,
Home and End navigate cells. Unknown targets remain unknown; no LDS bank-model
assumption is needed.

### 3. Unavailable storage and incompatible anchors

```sh
lab_dir=$(mktemp -d)
sed -n '79,89p' examples/source_lds_multi_workgroup_v1.requests.jsonl > "$lab_dir/scope.requests.jsonl"
sed -n '79,89p' examples/source_lds_multi_workgroup_v1.responses.jsonl > "$lab_dir/scope.responses.jsonl"
sha256sum "$lab_dir/scope.requests.jsonl" "$lab_dir/scope.responses.jsonl"
```

Requests: 3,988 bytes, SHA-256
`a020e3db676384ab4c2f7f323c7de8985f4197386b64dd10c9110c29672249bd`.
Responses: 48,276 bytes, SHA-256
`cdf743f5d51ebb53a4c2f4bb1394eb7faaf1bac61fdfa3f1e27274c2bec3e204`.

Predict: does an old allocation's absence establish zero bytes, equality, a
release event or physical reuse by the new allocation? **None of these.**

1. Import the pair. Initial checkpoint 79 has 94 SSA rows, beyond the independent
   values panel's 64-row display profile. That panel's refusal is expected; the
   memory windows remain usable.
2. Select current checkpoint **Request 83**, event 16079 / revision 10. Its
   memory **Request 85** reports allocation 2:g0 as unavailable.
3. Choose baseline **Request 89**, checkpoint 86. Both sides report
   `unavailable: not_represented`; no zero-filled byte grid or equality appears.
4. Choose baseline **Request 81**. Both requests name allocation 2:g0, but
   workgroup/lane **and source/site** differ: the comparison refuses.
5. Select current checkpoint **Request 86**, whose default memory **Request 88**
   is allocation 3:g0, captured zero storage with all bytes uninitialized.
   The baseline clears. Choosing **Request 85** refuses the different allocation.
   Selecting memory **Request 89** again clears the baseline; choose **Request 85**
   to see the unavailable/unavailable result in the opposite direction.

Generation zero is a producer-profile identity, not lifetime evidence. The
inventories do not represent owning scope, lifetime or physical base; a changed
ordinal does not establish physical reuse. Comparison permits only event/revision
differences, not different configuration, scope/mask, source/site, frame/occurrence,
allocation or requested range.

## Provenance, limits and separate reproduction

The global recording names source
`crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs`,
SHA-256 `f6cdd5fc4a937979fd5d12e7fa199fd3590fae9cb8f303b680781f9ca5b7df5e`.
Its original work-in-progress compiler commit is unavailable. Both LDS recordings
name `crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs`,
SHA-256 `1c34832c031f2e84f27f022ccdea6b9cdf7966dfc1bbf186f441a236bc068425`.
Their original compiler-build closure is unavailable. The guide does not create
an authenticated source/build join from these recorded hashes.

Full original JSONL is linked by the guide at the immutable site record pin.
The [source-produced resource walkthrough](resource-memory-windows.md) documents
separate fresh export/capture prerequisites and compiler scripts; this lab does
not run them. Fresh sessions need their own identities and cannot reuse inert
query tokens from these files. No arbitrary source/helper/loop coverage, real
fault/watchpoint, dynamic-frame/reuse proof, physical registers or GPU timing is claimed.

Existing [importer limits](recorded-resource-import-v1.md) remain 256 KiB/file,
64 KiB/line, 128 pairs and 32 checkpoints; memory inputs are capped at 4096 bytes
with 256-byte comparison viewports. Full transcripts are deliberately not valid
imports (unsupported records or size). Missing and partial storage stays absent.

From the site checkout, ordinary validation is:

```sh
npm run validate
npm run validate:evidence
npm run validate:resource-lds
npm run validate:resource-lds-multi
npm run test:e2e -- --workers=2
```

These check the website, exact excerpts and retained observations, not native
execution, hardware correctness or completion of the broader debugger milestones.
