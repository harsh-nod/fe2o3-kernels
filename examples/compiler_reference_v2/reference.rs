#![no_std]
#![forbid(unsafe_code)]

/// Sequential meaning of one logical output coordinate.
fn cpu_reference(_point: usize, output: &mut u32) {
    *output = 17;
}
