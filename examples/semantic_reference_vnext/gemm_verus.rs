// WORKLOAD SPECIFICATION: not compiler-generated or authenticated per compilation.
verus! {
    spec fn gemm_point(spec: GemmSpec, row: int, col: int) -> F32Bits {
        spec.epilogue(
            fold(spec.k_domain(), spec.zero(), |acc, depth| {
                spec.fma(acc, spec.a(row, depth), spec.b(depth, col))
            }),
            spec.old_c(row, col),
        )
    }

    proof fn gpu_refines_safe_reference(
        spec: GemmSpec,
        effects: EffectSet<F32Bits>,
    )
        requires
            spec.numeric_contract().is_explicit(),
            spec.numeric_contract_is_proved(),
            spec.k_domain_is_finite(),
            spec.arithmetic_is_defined(),
            effects.total_final_view(spec.output_domain()),
            effects.no_unmodeled_observable_writes(),
            effects.each_value_matches(|row, col| gemm_point(spec, row, col)),
        ensures
            effects.observable_output()
                == spec.safe_rust_reference_output(),
    {
        // Generic coverage + fold composition closes the workload theorem.
    }
}
