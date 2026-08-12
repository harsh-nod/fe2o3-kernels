// Exact kernel excerpt from fe2o3 at acb3d275.
#[kernel]
pub fn fill(mut out: DisjointSlice<f32>) {
    let idx = thread::index_1d();
    if let Some(value) = out.get_mut(idx) {
        *value = 42.5;
    }
}
