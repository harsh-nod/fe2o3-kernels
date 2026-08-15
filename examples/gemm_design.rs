// ABRIDGED SOURCE SHAPE from fe2o3 ee76cedc.
// This ordinary attributed Rust body is deliberately non-executable today.
#[kernel(
    typed,
    namespace = "67100a64733dabbac624aac230d3ca79ccea4cc307c45ee64d41f3362bc16bbb"
)]
pub fn tiled_gemm_lds_slice1(
    a: &[u16],
    b: &[u16],
    mut c: DisjointSlice<f32>,
) {
    let lane_index = thread::index_1d().get();
    if lane_index >= 64 || a.len() != 256 || b.len() != 256 || c.len() != 256 {
        fe2o3_device::trap();
        return;
    }

    let lane = unsafe { WaveLane::<Wave64>::from_raw(lane_index as u32) }
        .expect("checked Slice 1 lane is in wave64");
    let (mut a_lds, mut b_lds) = acquire_bf16_lds_tiles_v1();

    // The full source computes each lane's four-element A/B fragments here.
    unsafe {
        a_lds.write_mfma_fragment(&lane, a_global);
        b_lds.write_mfma_fragment(&lane, b_global);
        sync::syncthreads();
    }

    let lhs = unsafe { a_lds.assume_init() }.read_mfma_fragment(lane_index).unwrap();
    let rhs = unsafe { b_lds.assume_init() }.read_mfma_fragment(lane_index).unwrap();
    let result = unsafe {
        DeviceMatrix::from_compiler().multiply_accumulate(
            lhs,
            rhs,
            F32AccumulatorFragment::ZERO,
        )
    };

    // The full source performs four disjoint C writes owned by this lane.
    store_owned_fragment(&mut c, lane_index, result);
}

fn acquire_bf16_lds_tiles_v1<'workgroup>() -> (
    LdsTile16x16<'workgroup, Bf16>,
    LdsTile16x16<'workgroup, Bf16>,
) {
    panic!("frontend does not lower compiler-issued BF16 LDS allocations")
}
