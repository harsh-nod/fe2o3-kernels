// DESIGN ONLY at fe2o3 acb3d275: this is proof-oriented pseudocode.
for phase in 0..ceil_div(K, TILE_K) {
    // Every lane copies a disjoint, in-bounds fragment into LDS.
    load_a_tile_with_witness(a, a_tile, phase);
    load_b_tile_with_witness(b, b_tile, phase);
    workgroup_barrier();

    // Invariant: acc == sum over all completed K phases.
    acc = mfma_bf16_f32(a_tile, b_tile, acc);
    workgroup_barrier();
}
store_tile_with_disjoint_witness(c, acc);
