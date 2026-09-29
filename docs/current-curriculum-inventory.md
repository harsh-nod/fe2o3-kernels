# Current curriculum inventory

The historical compiler evidence pin and current compiler source validation are
separate checks. `config/curriculum-source-contract.json` continues to identify
the exact historical manifest used by normal evidence validation. Exporting a
current runtime inventory does not advance that pin or qualify pending kernels.

## Requirements

- A clean, committed website checkout with `npm ci` completed using the repository's
  Node version. Commit candidate exporter/test changes locally before the CLI tests:
  those tests use fresh private clones of the exact committed source.
- A clean, committed compiler checkout containing both its current source manifest
  and the Git object named by the historical website evidence pin. CI's existing
  full-history compiler checkout supplies both; missing objects fail without fetch.
- Python 3.11 or newer, Git, and a POSIX filesystem supporting no-follow opens and
  same-filesystem hard links. The workflow uses its existing Linux runner.
- Current compiler source/lock/fixture bindings must validate independently. A
  stale current manifest is an error to repair in the compiler repository, not a
  reason to silently use the historical manifest as current input.

## Run the checks

Use an absolute compiler path:

```sh
export FE2O3_CURRICULUM_COMPILER_REPOSITORY=/absolute/compiler/checkout
npm run typecheck
npm run lint
npm test -- tests/curriculum-inventory.test.ts
node --test scripts/tests/curriculum-inventory-files.test.mjs scripts/tests/curriculum-inventory-cli.test.mjs
node scripts/validate-current-curriculum.mjs --compiler-repository "$FE2O3_CURRICULUM_COMPILER_REPOSITORY"
```

The final command loads the real Vite runtime lessons, exports their ordered
author-facing code and source fragments, and calls the current compiler's existing
`validate-tutorial-kernel-manifest.py` with `--require-curriculum --site-inventory`
and `--emit-kernel-pairs --site-inventory`. It requires the V2 report's exact runtime
site identity and a validated occurrence census, then prints compiler commit/tree,
manifest/projection/report digests and the consumer's coverage/qualification fields.
Both CI and Pages run the real CLI controls and this same command. They keep the
existing historical evidence and dual-repository publication gates.

To retain the raw projection for separate compiler work, choose a fresh absolute
output path outside the website checkout:

```sh
node scripts/export-curriculum-inventory.mjs \
  --compiler-repository "$FE2O3_CURRICULUM_COMPILER_REPOSITORY" \
  --output /absolute/fresh/runtime-curriculum.json
```

## Boundaries

The exporter checks every tracked website file's bytes and executable mode against
the exact Git tree before and after Vite loading/shutdown. Dirty/untracked source,
hidden index flags, tracked symlinks/submodules, stale historical pins, and changing
source fail. Vite uses a fresh owned cache. A fully written/fsynced report is
published create-only with mode 0600; existing files and output symlinks are never
overwritten. Cleanup failures prevent command success; if staging cleanup fails
after the hard link, the complete report may already exist and is not deleted.
The first operation/cleanup failure is preserved. The current-compiler wrapper owns
and removes its temporary projection, even when either consumer refuses it.

The CLI tests mutate only their fresh private clones, share the already installed
dependencies read-only, and remove their own clones/cache/output on all paths.
The twelve CLI parents cover real runtime loading, dirty/hidden/symlink inputs, missing and stale
compiler pins, existing/relative/in-tree outputs, runtime failure and mutation
during loading, and the real current compiler's census consumer. One parent uses
clearly synthetic current-consumer replies to test stale schema, false census,
site substitution, malformed output, refusal and input mutation. Those negative
controls are protocol tests, not compiler execution evidence. Six Vitest parents
cover the runtime projection. Fifteen native Node filesystem parents cover exact
tracked bytes, partial/stalled writes and combined operation/cleanup failures.
The filesystem suite deliberately uses native ESM throughout so its restored
builtin spies reach the actual helper imports without a Vite transform boundary.

These are before/after checks, not an atomic snapshot against a concurrent hostile
writer or a protected-execution attestation. The compiler wrapper checks clean Git
state and unchanged commit/tree/manifest; it relies on the existing compiler
validator for bounded physical source/lock/selection correspondence. It does not
independently hash every compiler implementation file.

A validated runtime occurrence census is not a complete source-bound inventory.
Missing kernel/variant/source joins remain explicit; `inventoryComplete` and
`qualified` are copied from the compiler report, not inferred from command success.
Fixture count, known kernel-identity count and known variant count are different
quantities. No kernel build, optimizer qualification, simulation, GPU execution,
formal proof, launch authority or historical receipt promotion occurs here.
