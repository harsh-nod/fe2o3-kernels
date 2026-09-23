# Same-export origin/native qualification — 2026-09-23

This is a separately retained real capture and browser qualification for the
source/ISA page. It does not replace or relabel the historical repeat-native
example. The new preview keeps the existing 23-artifact capsule profile and
loads its four optional compiler-origin reports separately.

## Fresh producer chain

All retained paths below are under
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr` on mi350.

| Actual producer output | Bytes | SHA-256 |
| --- | ---: | --- |
| `phase28-repeat-source-origin-r1/receipt.json` | 347809 | `39ff6cab8d3965670bcbefa57570230460da789ab4a6eed3f915f9cc24ca05ff` |
| `phase28-repeat-llvm-origin-r1/receipt.json` | 204057 | `06ccf4dca4b7b959f3d0e94f0c43b8b137de094e4fda2767a6b89025fb72e1e6` |
| `phase28-repeat-native-origin-r1/receipt.json` | 297546 | `7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115` |

The source runner made four fresh ordinary-source exports and inspections
(one/two/fifteen/repeat), passed 120 whole-kernel CPU cases and eight exact
frontend refusals: 136 stages. Opt-in origin reports were emitted by the same
exporter invocation as each positive KIR output; negatives kept their original
legacy arguments. The LLVM stage made four fresh lowerer calls. The native
stage made four fresh observer calls and retained eight complete O0/O3 HSACOs.
No HSACO was launched.

The exporter/lowerer tools were freshly built and frozen under
`target-milestones-phase28-origin-tools-r1`. Native observation deliberately
reused the unchanged previously qualified observer:
`target-milestones-phase24-compiler-native-r1/ordered-repeat-source-candidate`,
107,660,264 bytes, SHA-256
`17650c67e1f68c6753e310664f0aa28d2935ec0676cc5173ff7b431f30aeb6d0`.
It is not described as freshly rebuilt. SDK verification before and after
covered 2,517 files / 2,279,434,376 bytes, manifest
`75e68a7d7a0a69906dce63ff8417915ded71f9cbe859d869b44e7b65d8f7fff2`.

## Actual importer inputs and identity checks

The [new capsule](../examples/source_repeat_native_origin_comparison_v1.json)
is 1,105,533 bytes, SHA-256
`da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d`.
Its 23 decoded artifacts total 966,534 bytes. Four separate origins total
14,472 bytes. Their exact unmodified producer bytes and individual pins are
listed in the [walkthrough](same-export-origin-native-v1.md).

Construction receipt
`logs/phase28-repeat-native-origin-capsule-actual-r1/receipt.json` is
93,305 bytes, SHA-256
`ffe8aeb6ba37c8614d928bec065ea18922be525dfd68dff6c862c66bbc4a1092`.
It passed eight same-variant joins and eight different-count refusals.
The site's fixed join is the independently selected native receipt digest,
not a digest selected by the imported capsule.

Strict source-profile validation admits either the exact old legacy arguments
or the exact all-four-origin profile. Sidecar and helper pins are bounded and
joined without widening the 23-artifact/4 MiB raw/2 MiB decoded profile.
The historical capsule, old selector and old origin example remain unchanged.

Fifteen and repeat legitimately share source subjects and origin bytes. Their
retained native reports differ because their payload paths differ; the viewer
does not require different semantic hashes for independent captures. Compiler
origins associate whole ordered regions, with call-site/expansion spans and
bounded chain digest/depth. They do not supply per-instruction ancestry,
physical register lifetimes, dynamic values or authenticated provenance.

## Fresh site gates

The final code gate used site base
`2be01a9be27be2b751c4751bedd1a340fa8601bb` plus the integrated worktree:
769 source files / 19,729,224 bytes, source-census SHA-256
`a26f64e92d127e5fd502c83b6593bd56520a074767f993b7efdfbb03930a4a0f`.

- 1,382 unit tests in 98 files passed.
- Lint, TypeScript, production build, evidence validation and 21 tutorial-lab
  tests passed. The existing large-bundle warning remains.
- All **180 desktop/mobile browser tests passed with zero retries**.
  The new actual-upload test runs in both projects: eight matching cases,
  eight wrong-count mismatches, malformed replacement, stale-origin clearing,
  historical wrong-pin refusal, recovery, unmount and narrow-screen checks.
- The new 13-test actual-fixture suite and 63-test strict profile suite are
  included in those unit counts, not additional duplicate executions.

The full gate receipt
`logs/phase28-resume-r3-site-same-export-origin-full-r1/receipt.json` is
28,397 bytes, SHA-256
`6d5b89c8ca906d7b37656437fda81a83c0bdaa4ce1fea10107f578bd5a5e7c62`.

Browser tests use actual uploaded retained files, with no route mocks. The
zero-request listener starts after lazy-module loading and initial native
capsule readiness; it covers origin interactions and later replacements,
not the initial upload. Browser success does not rerun producer stages or
execute native code. Matching identities mean reported-content consistency,
not producer authentication, proof, hardware capture or compiler-resume
authority. This is V3/M5 progress, not by itself their complete acceptance.
