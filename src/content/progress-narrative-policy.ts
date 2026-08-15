import { deepFreeze } from "./registry";

// Registry additions require an explicit ID, checkpoint binding, and reviewed SHA-256.
export const progressNarrativeIds = deepFreeze([
  "progress/last-audited-public-baseline",
  "progress/production-s09-rustc-invocation",
  "progress/authenticated-verus-v2",
  "progress/cargo-acknowledgement-repair",
  "progress/formal-evidence-isolation-v11",
  "progress/protected-evidence-publisher",
  "progress/gfx942-scalar-control-flow",
  "progress/collected-rust-scalar-admission",
  "progress/gfx942-wave64-lds-reduction",
  "progress/scalar-gemm-v1",
  "progress/scalar-gemm-proof-profile",
  "progress/scalar-gemm-physical-effects",
  "progress/tiled-gemm-layout-frontend"
] as const);

export type ProgressNarrativeId = (typeof progressNarrativeIds)[number];

export const progressNarrativeFingerprints = deepFreeze({
  "progress/last-audited-public-baseline": "e1e6c3c7c92857aa439bdc6730b24b841c913ad80d7a961bcb5264145d93d89c",
  "progress/production-s09-rustc-invocation": "d7fa0990f834630741d0a069578cabc79fd95c7b758e33a8ef1ed08d29cea8fb",
  "progress/authenticated-verus-v2": "f4e644ff77c50f896b9f61851052e1e2235c13cd648fefa864be7f9efdda17f2",
  "progress/cargo-acknowledgement-repair": "b85f47f58651996ae0cb5807274fe384318f405d72c36cf1d3418892475611c7",
  "progress/formal-evidence-isolation-v11": "d8539f3e5f97f26a157d12a67a0704e8a004f7702a2852564b7f89f909f37c2b",
  "progress/protected-evidence-publisher": "6a8aada65d0cb79d4334f9630fadcf643680c747ca87a948a9b8c26e17e209ad",
  "progress/gfx942-scalar-control-flow": "d85cbbdf04a70d9a06228bbcfd2597ff2de18967bce006f02cc188d0cb4bd02d",
  "progress/collected-rust-scalar-admission": "b7aea4b2500b3e8950bcb3df00a4dfdc3ac89ce0733081c6829e7e0d07b6612d",
  "progress/gfx942-wave64-lds-reduction": "0ff9e79e0d9273d4a114e18dceade5dedd0115ca8cc0f49473d3e32339687a6d",
  "progress/scalar-gemm-v1": "da83866695d23c3fc1c7a4f335153c3112e92d12f8f538f45735eca5240eeb60",
  "progress/scalar-gemm-proof-profile": "537ff56d6904ac5e65be9e9cd8b31bcce9a36d662eda48245a027afda51d279a",
  "progress/scalar-gemm-physical-effects": "e5f66a29804312a75b33a16d1db208cc56b313409afb76dda1b7c7635e1eb40b",
  "progress/tiled-gemm-layout-frontend": "78e9e69d0fe40274589cd25e14524c962e68edd961047f585ade7fa2f1f32090"
} satisfies Record<ProgressNarrativeId, string>);
