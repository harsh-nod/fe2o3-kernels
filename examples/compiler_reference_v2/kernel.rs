#![no_std]
#![forbid(unsafe_code)]

use fe2o3_device::{DisjointSlice, kernel, thread};

fn cpu_reference(_point: usize, output: &mut u32) {
    *output = 17;
}

#[kernel(
    typed,
    reference = cpu_reference,
    launch(required = [64, 1, 1], max = [64, 1, 1])
)]
pub fn fill(mut output: DisjointSlice<u32>) {
    let index = thread::index_1d();
    if let Some(element) = output.get_mut(index) {
        *element = 17;
    }
}
