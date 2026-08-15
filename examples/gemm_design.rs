// REVIEWED SOURCE EXCERPT at fe2o3 7337a2b87dffa0845d092c13399b012f884de90b.
// #[kernel] is the canonical user form. The authenticated compiler path reaches
// canonical Kernel IR, an exact compiler-owned descriptor, and a single-use inert
// Worker V2 handoff. Finalization, HSACO publication, loading, and launch remain open.
#[kernel(
    typed,
    namespace = "c09558e16157fec495e78bc32a23b082213fa4a6ddabe48445a54cb3de591295",
    launch(required = [64, 1, 1], max = [64, 1, 1])
)]
pub fn tiled_gemm_lds_slice1(a: &[u16], b: &[u16], mut c: DisjointSlice<f32>) {
    let lane_index = thread::index_1d().get();
    if lane_index >= 64 || a.len() != 256 || b.len() != 256 || c.len() != 256 {
        fe2o3_device::trap();
        return;
    }

    let lane_column = lane_index % 16;
    let depth_base = (lane_index / 16) * 4;
    let a_row_base = lane_column * 16;

    let a_global = Bf16MfmaFragment::from_bits([
        a[a_row_base + depth_base],
        a[a_row_base + depth_base + 1],
        a[a_row_base + depth_base + 2],
        a[a_row_base + depth_base + 3],
    ]);
    let b_global = Bf16MfmaFragment::from_bits([
        b[depth_base * 16 + lane_column],
        b[(depth_base + 1) * 16 + lane_column],
        b[(depth_base + 2) * 16 + lane_column],
        b[(depth_base + 3) * 16 + lane_column],
    ]);

    let Some(lane) = (unsafe { WaveLane::<Wave64>::from_raw(lane_index as u32) }) else {
        fe2o3_device::trap();
        return;
    };
    let (mut a_lds, mut b_lds) = unsafe { gfx942_lds_bf16_tile_pair_m16x16_v1() };

    let a_staged = unsafe { a_lds.write_mfma_fragment(&lane, a_global) };
    let b_staged = unsafe { b_lds.write_mfma_fragment(&lane, b_global) };
    if !a_staged || !b_staged {
        fe2o3_device::trap();
        return;
    }
    unsafe { sync::syncthreads() };

    let a_lds = unsafe { a_lds.assume_init() };
    let b_lds = unsafe { b_lds.assume_init() };
    let Some(lhs) = a_lds.read_mfma_fragment(lane_index) else {
        fe2o3_device::trap();
        return;
    };
    let Some(rhs) = b_lds.read_mfma_fragment(lane_index) else {
        fe2o3_device::trap();
        return;
    };
    let matrix = unsafe { DeviceMatrix::from_compiler() };
    let result =
        unsafe { matrix.multiply_accumulate(lhs, rhs, F32AccumulatorFragment::ZERO) }.into_values();

    if let Some(output) = unsafe { c.get_mut_at(depth_base * 16 + lane_column) } {
        *output = result[0];
    }
    if let Some(output) = unsafe { c.get_mut_at((depth_base + 1) * 16 + lane_column) } {
        *output = result[1];
    }
    if let Some(output) = unsafe { c.get_mut_at((depth_base + 2) * 16 + lane_column) } {
        *output = result[2];
    }
    if let Some(output) = unsafe { c.get_mut_at((depth_base + 3) * 16 + lane_column) } {
        *output = result[3];
    }
}
