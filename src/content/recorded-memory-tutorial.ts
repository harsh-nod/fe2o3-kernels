/** Reference recipes, not a new capture format, admission rule or producer attestation. */
export const RECORDED_MEMORY_TUTORIAL_PIN = "5f7374401f98bcff67c4a3a990dd6bc87c39613f";
export const RECORDED_MEMORY_TUTORIAL_URL = "https://github.com/harsh-nod/fe2o3-kernels/blob/" + RECORDED_MEMORY_TUTORIAL_PIN + "/";
export const RECORDED_MEMORY_TUTORIAL_DOCS = "https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/";
export const recordedMemoryExercises = [
  {
    id: "global", title: "1. A changed word and a repeated event",
    selection: "6,11p;14,18p;21p", ids: [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21],
    requests: "examples/resource-query-v6/debug-requests.jsonl",
    responses: "examples/resource-query-v6/debug-responses.jsonl",
    requestBytes: 6469, responseBytes: 33708,
    requestSha256: "c553afd680d7f3f0381f572be5d06c95909bd1cc67369cbaf4518175fa9292a1",
    responseSha256: "1f1bd63c5960d9ba89b7ac96bbd669cc866ab665787c88d7adc129c7b1202bca",
    fullRequestSha256: "fef1e368e24fc3ce4e0922bd2a7ef2d54636c59e7a0231fad973b65496db72b6",
    fullResponseSha256: "aea9e0ffa792ae1b8cf97992bca0799b335e63c99641d1388d4ddbceb04f0845",
    source: "crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs",
    sourceSha256: "f6cdd5fc4a937979fd5d12e7fa199fd3590fae9cb8f303b680781f9ca5b7df5e",
    evidence: "examples/resource_query_v6.json",
    prediction: "A little-endian u32 write of 469 replaces four initialized 0xa5 bytes. Predict storage and initialization differences separately.",
    steps: [
      "Import global.requests.jsonl and global.responses.jsonl below. Leave current checkpoint Request 6 and memory Request 11 selected. No baseline is chosen for you.",
      "Explicitly choose baseline Request 15 (checkpoint 14). Inspect the first dword, then use Byte cells and the arrow keys to inspect individual bytes.",
      "Choose baseline Request 21. Compare event 33 at revisions 4 and 6: the event repeats, but its revision is not the same.",
      "Change the current checkpoint to Request 14. The baseline must clear. Reimporting or replacing either file also clears the previous comparison.",
    ],
    answers: [
      "Request 11 versus 15: 4 storage-byte differences and 0 initialization differences in the 24-byte window. 469 is 0x000001d5: stored d5 01 00 00, not a5 a5 a5 a5.",
      "Request 11 versus 21: 0 storage-byte and 0 initialization differences. Current event 33 / revision 4 and baseline event 33 / revision 6 stay distinct.",
      "These are retained reverse/repeated checkpoints, not a live reverse command, writer attribution or evidence of GPU state. The eight canary bytes are equal in these selected windows, not a proof of all execution.",
    ],
  },
  {
    id: "lds", title: "2. Equal zero bytes can have different initialization",
    selection: "11,18p", ids: [11, 12, 13, 14, 15, 16, 17, 18],
    requests: "examples/source_lds_resource_v1.requests.jsonl",
    responses: "examples/source_lds_resource_v1.responses.jsonl",
    requestBytes: 4581, responseBytes: 18138,
    requestSha256: "ce1fc9640acc454cf8584efa9d87619fe5d822ff78b454d8367cc0d3ecbac7cf",
    responseSha256: "e1b8d646649ccb4d3233cbe2f173553b35ec52fa99e9414c8bbcb60bd009b06c",
    fullRequestSha256: "61444b1cc24569444b272840821ebad63818d117bda948b9b011c87d59dbf29b",
    fullResponseSha256: "8d8a0d11ded7607b72eb58edcb065ae243883e96d2def6ce47ea9af78f9082e1",
    source: "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
    sourceSha256: "1c34832c031f2e84f27f022ccdea6b9cdf7966dfc1bbf186f441a236bc068425",
    evidence: "examples/source_lds_resource_v1.json",
    prediction: "The first LDS write stores the u32 value 2 into four previously uninitialized zero storage bytes. How many bytes change, and how many become initialized?",
    steps: [
      "Import lds.requests.jsonl and lds.responses.jsonl. Leave current checkpoint Request 11 and memory Request 13 selected; explicitly choose baseline Request 17 (checkpoint 16).",
      "Choose Byte cells. Offset 0 shows B+I. Offsets 1, 2 and 3 show I even though both raw storage bytes are zero. Select one and read the textual byte details.",
      "Read the 256-byte window and distinguish uninitialized storage from a program value. A storage snapshot alone is not a captured uninitialized-read fault.",
    ],
    answers: [
      "Request 13 versus 17: 1 storage-byte difference and 4 initialization differences across 256 bytes. The write is 02 00 00 00; all four bytes become initialized.",
      "B means raw storage differs; I means initialization differs; = means both recorded facts equal; ? means bytes were not captured on both sides. These meanings do not depend on color.",
      "The remaining raw zeros are still uninitialized storage, not 252 meaningful zero-valued program bytes. This lesson does not exercise a fault stop, watchpoint or hardware LDS access.",
    ],
  },
  {
    id: "scope", title: "3. Missing memory is not zero or proven reuse",
    selection: "79,89p", ids: [79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    requests: "examples/source_lds_multi_workgroup_v1.requests.jsonl",
    responses: "examples/source_lds_multi_workgroup_v1.responses.jsonl",
    requestBytes: 3988, responseBytes: 48276,
    requestSha256: "a020e3db676384ab4c2f7f323c7de8985f4197386b64dd10c9110c29672249bd",
    responseSha256: "cdf743f5d51ebb53a4c2f4bb1394eb7faaf1bac61fdfa3f1e27274c2bec3e204",
    fullRequestSha256: "642d2a8ed206d59ad4dcab2c1c894f54fbe136e3b95d0e85d05fdd9a732cf4ea",
    fullResponseSha256: "cde141bb942c96d8ad91c8d2f143fbd389846bf01ccc62d60a290dd10de314bc",
    source: "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
    sourceSha256: "1c34832c031f2e84f27f022ccdea6b9cdf7966dfc1bbf186f441a236bc068425",
    evidence: "examples/source_lds_multi_workgroup_v1.json",
    prediction: "An old recorded allocation is not represented at two later checkpoints. Can you compare its bytes, call them zero, or prove a new allocation reused its storage?",
    steps: [
      "Import scope.requests.jsonl and scope.responses.jsonl. Initial checkpoint 79 has 94 SSA rows, beyond the independent values panel's 64-row display profile; that panel's refusal does not block memory inspection. Select current checkpoint Request 83 (event 16079 / revision 10); its memory Request 85 is unavailable.",
      "Explicitly choose baseline Request 89 (checkpoint 86). Read both not_represented reasons. No byte grid or zero-filled comparison should appear.",
      "Choose baseline Request 81 instead. Although both memory requests name allocation 2:g0, their workgroup/lane/source anchors differ. Read the incompatible-scope refusal.",
      "Select current checkpoint Request 86 and memory Request 88. It contains allocation 3:g0, uninitialized zero storage. The baseline clears; selecting Request 85 refuses the different allocation. Selecting memory Request 89 again clears the baseline.",
    ],
    answers: [
      "Requests 85 and 89: unavailable / not_represented on both sides. Zero returned bytes do not mean a captured array of zeros, and do not establish equality.",
      "Request 85 versus 81: incompatible recorded scope/source. Only event and revision may differ for this comparison, not workgroup, lane, source/site or other anchor facts.",
      "Request 88 versus 85: different allocation identities (3:g0 and 2:g0), so no comparison. Generation zero, absence, and a new ordinal do not prove lifetime, release, ownership or physical reuse.",
    ],
  },
] as const;

export type RecordedMemoryExercise = (typeof recordedMemoryExercises)[number];

/** Writes only excerpts in the reader's fresh directory; original lines stay unchanged. */
export function recordedMemoryExcerptCommands(exercise: RecordedMemoryExercise): string {
  return [
    "lab_dir=$(mktemp -d)",
    `sed -n '${exercise.selection}' ${exercise.requests} > "$lab_dir/${exercise.id}.requests.jsonl"`,
    `sed -n '${exercise.selection}' ${exercise.responses} > "$lab_dir/${exercise.id}.responses.jsonl"`,
    `sha256sum "$lab_dir/${exercise.id}.requests.jsonl" "$lab_dir/${exercise.id}.responses.jsonl"`,
  ].join("\n");
}
