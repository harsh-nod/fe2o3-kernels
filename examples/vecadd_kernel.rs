// This is the current shared kernel body and attributed entry point. The same
// guarded memory-access body is expanded by the GPU kernel and its Verus model.
macro_rules! vecadd_kernel_body {
    (
        $thread:ident,
        ($($thread_arg:expr),* $(,)?),
        $add:ident,
        $a:ident,
        $b:ident,
        $output:ident $(,)?
    ) => {{
        let idx = $thread::index_1d($($thread_arg),*);
        let i = idx.get();
        if let Some(out) = $output.get_mut(idx) {
            *out = $add!($a[i], $b[i]);
        }
    }};
}

macro_rules! production_f32_add {
    ($lhs:expr, $rhs:expr) => {{ $lhs + $rhs }};
}

#[kernel(
    typed,
    namespace = "7c0e8b256bc76d2d17529f43ca8e2ee3480c40dfd019491bd4fb1fc22c4f5f2d"
)]
pub fn vecadd(a: &[f32], b: &[f32], mut c: DisjointSlice<f32>) {
    vecadd_kernel_body!(thread, (), production_f32_add, a, b, c);
}
