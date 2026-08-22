// Current safe kernel excerpt; legacy host launch plumbing is omitted.
#[kernel]
pub fn fill(mut out: DisjointSlice<f32>) {
    let idx = thread::index_1d();
    let Some(value) = out.get_mut(idx) else {
        return;
    };
    *value = 42.5;
}
