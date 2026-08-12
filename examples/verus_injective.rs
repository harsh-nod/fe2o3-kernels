// Source-model proof shape; this does not prove compiled machine code.
pub proof fn distinct_threads_have_disjoint_fill_outputs(
    left: nat,
    right: nat,
    thread_count: nat,
)
    requires
        left < thread_count,
        right < thread_count,
        left != right,
    ensures
        output_index(left) != output_index(right),
{
}
