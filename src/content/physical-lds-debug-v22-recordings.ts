/** Exact real R3 recordings, derived from source R7; not the later public wrapper run. */
export const LDS_COMPILER_COMMIT: string | null = "851f508787bd6ec02caf267e9211eb7bac0ef616";
export const LDS_RECORDING_EVIDENCE = {
  "schema": "fe2o3-actual-source-lds-public-cli-qualification-v22",
  "report": {
    "bytes": 41158,
    "sha256": "e1042fbc3e0b97afafa0f0aef734556ecdea7bea1baaa5427cf914a9ba40efb8"
  },
  "gate": {
    "bytes": 119040,
    "sha256": "4b98d3542ad5758f70ee24c12cd9d1ee230e323302cc21cd11b4eb7f0b92a5c6"
  },
  "sourceR7": {
    "bytes": 143142,
    "sha256": "f27f7a09778a5b55e0cb44b1bf913085b9c7428681cd6189c5b0d7bc984dd243"
  },
  "binary": {
    "bytes": 64378344,
    "sha256": "fa1ca83760e08afb196952cb3417a1bd4a20043244e7a889faacf5873dd2adca"
  },
  "summary": {
    "sessions": 6,
    "children": 28,
    "transactionalRefusals": 96,
    "bootstrapRefusals": 13,
    "legacyByteExact": 8
  },
  "sourceCustody": false,
  "hardwareObserved": false
} as const;
export const LDS_RECORDINGS = [
  {
    "id": "one-output129",
    "title": "Original registers · 128 writes + tail canary",
    "index": {
      "path": "/diagnostics/physical-lds-v22/one-output129.index.gzip",
      "bytes": 78433,
      "sha256": "c359ea696bf292b811bfdaf6d779d8d21c83f9001e91b11297a93552d6f58dac",
      "raw": {
        "bytes": 3366608,
        "sha256": "2267da3f43ce2c7ac6f9474fef3ddd2153236050790c0dbddec98b95152f79ce"
      }
    },
    "document": {
      "path": "/diagnostics/physical-lds-v22/one-output129.request.json",
      "bytes": 2956,
      "sha256": "32cbeed3bd1ec15c52865ce6a7545f6fa3582349b85e909a8941fb848fa130ce"
    },
    "requests": {
      "path": "/diagnostics/physical-lds-v22/one-output129.requests.jsonl",
      "bytes": 18579,
      "sha256": "563f3ad0588ab9043214729de08ee8bee5ab3356eab5f99a20b59d8c84faab99"
    },
    "responses": {
      "path": "/diagnostics/physical-lds-v22/one-output129.responses.jsonl",
      "bytes": 217526,
      "sha256": "8bc446a61703317370e9cc5f806bb816b11aef24fd6a15c7d7cdb54cf7bbfc99"
    },
    "canonicalFile": {
      "bytes": 3920,
      "sha256": "506fe05730893cd8490057474c78d42e2a438bf4e19a4b11dcdc1cd58f99ea49"
    },
    "canonicalIdentity": "67dd57730cead241475668d0ee3f9dd19246411a64a88719f7a1e871d5f963d3",
    "recordCount": 8833
  },
  {
    "id": "registers-output13",
    "title": "Edited registers · 13 writes + guarded tail",
    "index": {
      "path": "/diagnostics/physical-lds-v22/registers-output13.index.gzip",
      "bytes": 77153,
      "sha256": "b80a69c8acf6bcdec32501db56d65c65e2aa0863541b2a01607e60c73f515bb2",
      "raw": {
        "bytes": 3315627,
        "sha256": "50c5b457cc28515d697ac62b75f21047d5b34228d3162841449504deaea55706"
      }
    },
    "document": {
      "path": "/diagnostics/physical-lds-v22/registers-output13.request.json",
      "bytes": 2961,
      "sha256": "40ca44a29af56bf4b8f547c67fca9a0fa01a9370f2e4caef67b31a8d25ad198b"
    },
    "requests": {
      "path": "/diagnostics/physical-lds-v22/registers-output13.requests.jsonl",
      "bytes": 18576,
      "sha256": "5688d94dbf46a0dee13741a8ebffb52e000b4f50dbba53356c14ebff16eec7c5"
    },
    "responses": {
      "path": "/diagnostics/physical-lds-v22/registers-output13.responses.jsonl",
      "bytes": 217518,
      "sha256": "c2599766e119e26b5586e344c9eb4e9ed6da3884c19658bf9c2a758a2ab7d2cd"
    },
    "canonicalFile": {
      "bytes": 3938,
      "sha256": "50213d169875a43f2956419df15842e3bde673b6435e3e933444300bb2f1eb13"
    },
    "canonicalIdentity": "8613d5e058f6e4ea63d20428c1104bcc17591e1e939a0125477c03f06a3a5ddc",
    "recordCount": 8718
  }
] as const;
