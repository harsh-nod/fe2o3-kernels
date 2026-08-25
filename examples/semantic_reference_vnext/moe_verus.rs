// WORKLOAD SPECIFICATION: not compiler-generated or authenticated per compilation.
verus! {
    proof fn grouped_moe_refines_safe_reference(
        spec: MoeSpec,
        routes: PermutationContract,
        expert_effects: EffectSet<F32Bits>,
        combined_effects: EffectSet<F32Bits>,
    )
        requires
            spec.routing_is_deterministic(),
            spec.route_and_fold_domains_are_finite(),
            spec.arithmetic_is_defined(),
            routes.bijection(spec.accepted_routes(), spec.compact_slots()),
            expert_effects.total_final_view(spec.expert_output_domain()),
            expert_effects.each_value_matches(spec.expert_fold()),
            combined_effects.total_final_view(spec.token_output_domain()),
            combined_effects.each_value_matches(spec.ordered_weighted_combine()),
            combined_effects.no_unmodeled_observable_writes(),
            spec.numeric_contract().is_explicit(),
            spec.numeric_contract_is_proved(),
        ensures
            combined_effects.observable_output()
                == spec.safe_rust_reference_output(),
    {
        // The compiler knows generic domains and effects; MoeSpec owns the math.
    }
}
