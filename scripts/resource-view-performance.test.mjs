import assert from "node:assert/strict";
import test from "node:test";
import { distribution } from "./resource-view-performance.mjs";

test("diagnostic quantiles use nearest ranks and do not mutate inputs", () => {
  const values = [3, 0, 2, 1];
  assert.deepEqual(distribution(values), { samples: 4, min: 0, p50: 1, p95: 3, max: 3, mean: 1.5 });
  assert.deepEqual(values, [3, 0, 2, 1]);
});
test("measurement sample budgets reject invalid or oversized data", () => {
  for (const values of [[], Array(3), Array(101).fill(1), [-1], [NaN], [Infinity]]) assert.throws(() => distribution(values));
});
