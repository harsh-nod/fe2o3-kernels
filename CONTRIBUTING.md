# Contributing

Contributions should improve a kernel lesson without weakening the distinction
between proof, compiler evidence, and runtime observation.

## Before editing content

1. Check out the fe2o3 commit named in `FE2O3_PIN`.
2. Read the implementation, tests, and relevant documentation at that commit.
3. Reproduce every command you intend to cite.
4. Choose the narrowest maturity label supported by the evidence.
5. Record what is proved, trusted, and not proved in the lesson.

Do not update `FE2O3_PIN` as part of an unrelated lesson change. A baseline
update is its own review and must re-audit all non-design claims.

## Adding a kernel lesson

Add reusable snippets under `examples/` and import them into structured content
rather than duplicating large code blocks. A complete evidence packet contains:

- kernel source and an independent host-side oracle;
- positive tests plus boundary, aliasing, and canary cases;
- expected-negative compiler or verifier fixtures;
- Verus specifications with assumptions and trusted boundaries;
- compiler and Kernel IR checks for the intended operations;
- linked HSACO metadata and machine-effect inspection;
- exact `gfx942:xnack-` hardware commands and observed target identity; and
- an immutable binding among source, proof, toolchain, artifact, and result.

Only include the pieces that exist. Missing evidence belongs in the lesson's
"not proved" section, not behind a stronger badge.

## Status review

Use these promotion rules:

- Promote to **Runnable now** only when the current frontend builds and executes
  the exact source path with the cited command.
- Add **Verus model** only when the checked property and expected-negative cases
  are explicit. Describe source-model results as source-model results.
- Add **HSACO mechanics** for focused compiler, linker, ABI, metadata, or
  machine-effect evidence. Do not use it as an execution badge.
- Add **GPU observed** only with a target-specific campaign and independent
  result check.
- Keep **Design only** until the claimed capability is present. Design-only
  claims intentionally have no execution reference in the schema.

## Validation

```bash
npm ci
npx playwright install chromium
npm run test:all
```

Inspect the Playwright desktop and mobile screenshots when changing layout,
diagrams, long commands, navigation, or status labels. Check both themes and
keyboard focus. No page should acquire horizontal overflow.

Commits should be small and explain one content, implementation, or evidence
change. Do not combine a baseline upgrade with unrelated visual work.
