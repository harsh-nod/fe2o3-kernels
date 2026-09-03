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

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_pair_array")]
pub fn aggregate_pair_array(value: [u64; 2], mut output: DisjointSlice<u64>, scale: u64) {
    let _scale = scale;
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = value[1];
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

#[cfg(feature = "aggregate_nested")]
#[repr(C)]
pub struct AggregateNested {
    pub pair: (u32, u64),
    pub values: [u16; 2],
}

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_nested")]
pub fn aggregate_nested(value: AggregateNested, mut output: DisjointSlice<u64>, scale: u64) {
    let _scale = scale;
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = value.pair.1;
    }
}

#[cfg(feature = "aggregate_enum")]
pub enum AggregateEnum {
    First(u64),
    Second(u64),
}

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_enum")]
pub fn aggregate_enum(_value: AggregateEnum, mut output: DisjointSlice<u64>, scale: u64) {
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = scale;
    }
}

#[cfg(feature = "aggregate_pointer")]
#[repr(C)]
pub struct AggregatePointer {
    pub pointer: *const u64,
}

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_pointer")]
pub fn aggregate_pointer(_value: AggregatePointer, mut output: DisjointSlice<u64>, scale: u64) {
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = scale;
    }
}

#[cfg(feature = "aggregate_drop")]
pub struct AggregateDrop {
    pub value: u64,
}

#[cfg(feature = "aggregate_drop")]
impl Drop for AggregateDrop {
    fn drop(&mut self) {}
}

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "aggregate_drop")]
pub fn aggregate_drop(_value: AggregateDrop, mut output: DisjointSlice<u64>, scale: u64) {
    if let Some(slot) = output.get_mut(thread::index_1d()) {
        *slot = scale;
    }
}

#[kernel(
    typed,
    launch(required = [64, 1, 1], max = [64, 1, 1]),
)]
#[cfg(feature = "wave_reduce_f32")]
pub fn wave_reduce_f32(value: f32, mut output: DisjointSlice<f32>) {
    let lane = thread::index_1d();
    let subgroup = Gfx950Subgroup::current();
    let reduced = subgroup.reduce_sum_f32::<64>(value);
    if let Some(element) = output.get_mut(lane) {
        *element = reduced;
    }
}
