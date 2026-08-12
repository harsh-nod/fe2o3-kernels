// DESIGN ONLY: online softmax state for one query row.
for key_tile in key_tiles {
    let tile_max = row_max(q_times_k_transpose(q, key_tile));
    let next_max = max(running_max, tile_max);
    let correction = exp(running_max - next_max);
    let tile_exp = exp(scores - next_max);

    running_sum = correction * running_sum + row_sum(tile_exp);
    output = correction * output + tile_exp * value_tile;
    running_max = next_max;
}
output /= running_sum;
