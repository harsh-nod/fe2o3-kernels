# Live runtime/storage and native-role qualification — 2026-09-23

The [ordinary-source call/storage lab](runtime-observations-source-lab-v1.md) now
connects real bounded CPU observations through the debugger bridge to this site.
The [compiler qualification report](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/runtime-identity-storage-20260923.md)
contains the exact acceptance matrix, source/build identities and retained failures.
This satisfies bounded V2, not hardware capture, physical-register values/lifetimes
or all debugger/tutorial milestones. The accepted combined ledger is4/18.

Code-check site base: `a7b66c499522a1b1077f7aa47ac0a1b7c22a5ec8`.
The full post-layout browser regression and fresh actual-browser gate share a
710-file/17,162,252-byte working-tree census, SHA-256
`c0510d44cfc28b9ee1f81542b7689f30b2d8f65c6225c2d09f93804f5b25dbb2`.
This report was finalized afterward; it is not a clean-commit or hermetic
closure attestation. Earlier 709-file layout/browser checks retain their
`1ba49e248a786960907cd0231370d78437dc60ea33b188bd504e92db2c42f6c0` census.

Earlier checks passed 1,129 unit tests/84 files, 21 lab tests and 170 browser
regressions. After the table fix, unit/lab/lint/types/build passed again, followed
by two targeted 320px synthetic cases and the complete **172-case desktop/mobile
regression suite**. That complete suite also validated retained evidence; it did
not rerun unit/lab checks or qualify a live backend, and checked zero remote issue
states. The scoped CSS fix preserves local scrolling without inheriting the
global 620px table minimum.

Latest compiler integration exposed an allocation-metadata memory-budget
regression. The compiler now keeps optional descriptors out of default allocation
buckets and explicitly charges enabled descriptor storage, without raising any
limits. The fresh compiler gate passed **769 Rust tests, 5 ignored**, builds,
strict Clippy and formatting. Earlier backend receipts are retained below as
history, not reused as qualification of that fix.

Fresh ordinary-source acceptance then passed eight reuse-on/eight reuse-off runs,
32 helper activations and four same-build admissions. Fresh HTTP loop/workgroup
acceptance passed. Fresh actual loop/helper and workgroup browser sessions each
passed desktop/mobile with two newly observed and reaped debugger children.
They compare displayed values with bounded real HTTP replies and check stale
selection clearing. Final lint/types/build/evidence validation passed in the same
fresh browser gate. The separate source runner establishes completed output,
guard and initialization correctness; browser runs do not claim all outputs
completed.

## Fixed-backend qualification receipts

Paths are relative to /home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr/logs/;
each row identifies its complete receipt.json. All ten runs passed, with their
individual source/input scopes preserved.

| Run directory | Bytes | SHA-256 |
| --- | ---: | --- |
| phase28-resume-r2-compiler-observed-resident-fix-build-r2 | 25121 | `da9a65fdf639abd61b3c4944f8d387c396c338d319cb34b20f82f0dcbdf69c01` |
| phase28-resume-r2-compiler-observed-resident-fix-source-r2 | 21585 | `3f8b0f6c87f0a9d182c5ec706c7f8cb2481d98cb137c0cea85b2c6d617c65705` |
| phase28-observed-source-resident-fix-r1 | 702370 | `551a826f4ce70923c1e40b56b39ffe043d7a98e1f413a7c07aa6da4c11cc9e2a` |
| phase28-resume-r2-compiler-observed-resident-fix-http-r1 | 121876 | `d93079abe96240612da124e7a11f940ff4c2d5f3e88be5669e29d3ec541c39fb` |
| phase28-resident-fix-runtime-http-loop-r1 | 209426 | `7d612e37c9da0064384bfbb3a85537178d407ab3bca6922bcc11126b13595ff3` |
| phase28-resident-fix-runtime-http-workgroup-r1 | 318105 | `4d3d1c7945374c39851191f2f6604743bbcfaa28dd1725ca688d343a5cb4d56f` |
| phase28-resume-r2-site-observed-final-browser-regressions-r1 | 26391 | `37e5d94355c1c40112661d3b8e1d5e263716f2ca750be1c368ec3f996d1806af` |
| phase28-resume-r2-site-observed-resident-fix-actual-browser-r1 | 153717 | `74de372601d276435b27e639f391d1cce1fe477e91768bbfdb79ab14d195ae66` |
| phase28-resident-fix-runtime-browser-loop-r1 | 15454 | `bc9e947bdb41e34364af99c7112b8eb74ca5efcec6e9d148e22c9dcdd7ee0748` |
| phase28-resident-fix-runtime-browser-workgroup-r1 | 15773 | `be99fa62c0c2f46756976c58ce3671582ec0582b4da8e49ef19f7d64e1e3151a` |

## Earlier retained receipt identities

Paths below are relative to /home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr/logs/.
SHA-256 binds the complete retained receipt, not a screenshot or selected excerpt.

| Run directory | Bytes | SHA-256 |
| --- | ---: | --- |
| phase28-resume-r1-compiler-observed-current-main-build-r1 | 25164 | `0ee7d9bd213d6f8681c0155ba36eee23b15de0e68febc6043070cf67172d316a` |
| phase28-resume-r1-compiler-observed-current-main-source-r1 | 21585 | `3ff00a79ed47d5a778a20ff9708770009e1be9be78299369afbce3804857a8f0` |
| phase28-observed-source-current-main-r1 | 702426 | `c57f8e759c5647a9f236be5672370f19bfbb312876908aaed89f5c5fa702aea5` |
| phase28-resume-r1-compiler-observed-current-main-integration-http-r2 | 39935 | `4dc070ad2bcd12eabe8bd690812351dfa19248bedf361d38cbe56654cfcef87f` |
| phase28-current-main-runtime-http-loop-r1 | 209469 | `a977e83e0c05e85c36b0aaf9ad719f3f950fda55e8dd5c61e97e9804a46c0ac6` |
| phase28-current-main-runtime-http-workgroup-r1 | 318119 | `e3c0c4a8f061859d2065df223eadc15bcc95c6e1c1a2516f41205223c9a830aa` |
| phase28-resume-r1-site-observed-current-main-check-r1 | 27559 | `4926dd7b239e6057cb8605e1637fe479d603534dbdcd9ca59d57ff2c464d901b` |
| phase28-resume-r1-site-observed-responsive-targeted-r1 | 21328 | `0b4d0960913167d7a1352e09509cfeb01877318f65f7fbd7bedb734e85cff177` |
| phase28-resume-r1-site-observed-current-main-actual-browser-r4 | 45762 | `4a0d9b680ba1e4137c91a2526142ed320a6e1306084b3f5eb5176b52357cfd4b` |
| phase28-current-main-runtime-browser-loop-r3 | 15470 | `0ba2c1fdca7db6004eb4c8f64c62a5760846c571dc1e66a8256e03b8c0e05f9e` |
| phase28-current-main-runtime-browser-workgroup-r1 | 15788 | `28c367fe4c06f6b3a9a84ef26bf72fce1b33b276f269bc173d6e632e277ef93b` |

The loop exercise covers actual current/suspended SSA frames, distinct repeated
activations, watch stops with unavailable frames, reverse/repeat, and exact
selected memory. The workgroup exercise covers actual A-release/B-create reuse,
same slot/fresh generation, correct workgroup scope, zero/uninitialized new
storage and cleared old selection. A separate real raw-KIR CPU bounds-fault
test supplies fault qualification; neither this lab nor its browser run
claims ordinary-source fault snapshots or terminal bytes.

The [static native grid](final-native-comparison-v1.md) uses the unchanged
14-artifact capsule and exact variant/HSACO identities. Declared VGPR roles and
actual decoded uses are not allocation lifetimes, free registers or runtime values.
The separate repeat-native profile remains an unintegrated draft.

Earlier failed inspector-body and mobile-layout attempts remain retained in the
compiler report; they were not relabeled successful. No global parser/capsule
limits, protected proof/finalizer paths, GPU execution or publication policy
were widened. Full V3-V5 and the other umbrella exits remain open.
