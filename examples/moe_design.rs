// DESIGN ONLY: deterministic capacity-bounded routing.
let experts = stable_top_k(router_logits[token], K);
let slots = exclusive_scan(per_expert_token_counts(experts));

for (rank, expert) in experts.enumerate() {
    let slot = slots[expert] + stable_rank(token, expert, rank);
    if slot < expert_capacity {
        // Injectivity goal: no two accepted routes own the same slot.
        permuted_tokens[expert][slot] = tokens[token];
    }
}
