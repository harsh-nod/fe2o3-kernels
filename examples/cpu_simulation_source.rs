#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "barrier_before_access")]
pub fn barrier_before_access(mut output: DisjointSlice<f32, Blocked<Index1D, 1, 2>>) {
    syncthreads();
    if let Some(block) = thread::index_1d().checked_block::<1, 2>() {
        if let Some(element) = output.get_block_mut(&block, 1) {
            *element = 1.0;
        }
    }
}

#[cfg(feature = "aggregate_pair_struct")]
#[repr(C)]
pub struct AggregatePairStruct {
    pub first: u32,
    pub second: u64,
}

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_pair_struct")]
pub fn aggregate_pair_struct(
    value: AggregatePairStruct,
    mut output: DisjointSlice<u64>,
    scale: u64,
) {
    let _scale = scale;
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = value.second;
    }
}

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_pair_tuple")]
pub fn aggregate_pair_tuple(value: (u32, u64), mut output: DisjointSlice<u64>, scale: u64) {
    let _scale = scale;
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = value.1;
    }
}

#[cfg(feature = "aggregate_zst")]
pub struct AggregateZst;

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_zst")]
pub fn aggregate_zst(_marker: AggregateZst, mut output: DisjointSlice<u64>, scale: u64) {
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = scale;
    }
}
