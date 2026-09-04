const reviewRows = [
  [
    "1. Contract",
    "Validate shapes, strides, launch dimensions, and buffer extents before the first barrier, subgroup collective, or MFMA.",
    "Can any subset of lanes return while peers continue into a collective?",
  ],
  [
    "2. Ownership",
    "Name the mapping from global thread to workgroup, wave, lane, tile, row, and output elements.",
    "Is every read in bounds and every final write owned exactly once?",
  ],
  [
    "3. Typed views",
    "Construct strided matrix views and output capabilities once; keep raw offset arithmetic out of the compute loop.",
    "Do the types expose layout and disjointness instead of relying on comments alone?",
  ],
  [
    "4. Uniform compute",
    "Keep barriers, pipeline epochs, MFMAs, broadcasts, and reductions in uniform order; mask inactive values with the operation's identity.",
    "Do all physical participants execute the same collective sequence?",
  ],
  [
    "5. Numerical state",
    "Accumulate and normalize in FP32, subtract maxima before exponentiation, and document padding, sentinels, and tie order.",
    "Is the independent CPU reference using the same mathematical contract without reusing device helpers?",
  ],
  [
    "6. Commit",
    "Finish through `DisjointSlice`, `Blocked`, `Tiled2D`, or `RowStriped2D`; compute a complete owned result before publishing it.",
    "Does the capability match the ownership mapping and suppress every logical edge?",
  ],
] as const;

export function KernelWritingGuide() {
  return (
    <div className="lesson-sections kernel-writing-guide">
      <section aria-labelledby="kernel-writing-guide-heading">
        <p className="section-kicker">Source review</p>
        <h2 id="kernel-writing-guide-heading">Writing clear fe2o3 kernels</h2>
        <p>
          Read the Rust kernel in the phase order below. The source comments mark
          these boundaries and explain invariants or non-obvious scheduling choices;
          they do not restate ordinary Rust syntax.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Phase</th>
                <th>What good source makes visible</th>
                <th>Review question</th>
              </tr>
            </thead>
            <tbody>
              {reviewRows.map(([phase, practice, question]) => (
                <tr key={phase}>
                  <td>{phase}</td>
                  <td>{practice}</td>
                  <td>{question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul>
          <li>
            Put the operator contract and fixed-shape boundary in rustdoc on the
            entry point; put the recommended reading order in module docs.
          </li>
          <li>
            Comment why a mapping, mask, reduction order, pipeline stage, or
            accumulator lifetime exists. Prefer names and types for what the code does.
          </li>
          <li>
            Keep ablations to one changed decision. Label compiler-rejected experiments
            as counterexamples, with no runtime or performance claim.
          </li>
          <li>
            Treat source tests, compiler lowering, ISA inspection, numerical checks,
            and performance measurements as separate evidence gates.
          </li>
        </ul>
      </section>
    </div>
  );
}
