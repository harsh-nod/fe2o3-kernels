// WORKLOAD SPECIFICATION: not compiler-generated or authenticated per compilation.
verus! {
    spec fn softmax_point(spec: SoftmaxSpec, row: int, col: int) -> F32Bits {
        let maximum = reduce(spec.active_columns(row), spec.neg_inf(), spec.max_op());
        let denominator = reduce(
            spec.active_columns(row),
            spec.zero(),
            |sum, j| spec.add(sum, spec.exp(spec.input(row, j) - maximum)),
        );
        spec.exp(spec.input(row, col) - maximum) / denominator
    }

    proof fn gpu_refines_safe_reference(
        spec: SoftmaxSpec,
        effects: EffectSet<F32Bits>,
        contributions: ContributionSet<F32Bits>,
    )
        requires
            spec.numeric_contract().is_explicit(),
            spec.numeric_contract_is_proved(),
            spec.active_domains_are_finite(),
            spec.arithmetic_is_defined(),
            contributions.exactly_once_per_active_element(),
            contributions.refines_declared_reductions(),
            effects.total_final_view(spec.output_domain()),
            effects.each_value_matches(|row, col| softmax_point(spec, row, col)),
        ensures effects.observable_output() == spec.safe_rust_reference_output(),
    {}
}
