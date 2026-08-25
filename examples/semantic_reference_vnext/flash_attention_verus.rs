// MILESTONE SPECIFICATION: explanatory until the site manifest is published-current.
verus! {
    spec fn attention_state(spec: AttentionSpec, query: int, phases: int)
        -> OnlineSoftmaxState
        decreases phases
    {
        if phases == 0 {
            spec.initial_state()
        } else {
            spec.advance(
                attention_state(spec, query, phases - 1),
                spec.score_tile(query, phases - 1),
                spec.value_tile(phases - 1),
            )
        }
    }

    proof fn gpu_refines_safe_reference(
        spec: AttentionSpec,
        recurrence: RecurrenceTrace<OnlineSoftmaxState>,
        effects: EffectSet<F32Bits>,
    )
        requires
            spec.numeric_contract().is_explicit(),
            spec.numeric_contract_is_proved(),
            spec.phase_domains_are_finite(),
            spec.arithmetic_is_defined(),
            recurrence.refines(|q, p| attention_state(spec, q, p)),
            effects.total_final_view(spec.output_domain()),
            effects.no_unmodeled_observable_writes(),
            effects.matches_final_recurrence(recurrence),
        ensures effects.observable_output() == spec.safe_rust_reference_output(),
    {}
}
