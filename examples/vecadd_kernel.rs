// Exact shared-body pattern from fe2o3 at acb3d275.
// macro_rules! is compile-time token expansion used here to share this small
// body with a Verus model. It is not the kernel marker or a GPU runtime feature.
macro_rules! vecadd_kernel_body {
    ($thread:ident, ($($arg:expr),*), $add:ident, $a:ident, $b:ident, $out:ident) => {{
        let idx = $thread::index_1d($($arg),*);
        let i = idx.get();
        if let Some(slot) = $out.get_mut(idx) {
            *slot = $add!($a[i], $b[i]);
        }
    }};
}

// #[kernel] is the procedural attribute that marks an ordinary Rust function
// for fe2o3's kernel frontend and generated typed API. New production kernel
// bodies should remain ordinary attributed Rust; macro_rules! is not required.
#[kernel(
    typed,
    namespace = "7c0e8b256bc76d2d17529f43ca8e2ee3480c40dfd019491bd4fb1fc22c4f5f2d"
)]
pub fn vecadd(a: &[f32], b: &[f32], mut c: DisjointSlice<f32>) {
    vecadd_kernel_body!(thread, (), production_f32_add, a, b, c);
}
