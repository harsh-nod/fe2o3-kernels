# Read a declared target for one observed LDS access

This optional live CPU view joins a verified simulation bundle's target declaration to the current debugger owner and complete cursor. It then applies the existing bounded LDS bank arithmetic to one explicitly selected retained workgroup access.

It is not a GPU debugger or conflict detector. A bundle's target declaration is not hardware detection, source authentication, a compiler-execution receipt or evidence of physical allocation placement.

## Before starting

Use the normal local CPU bridge setup from [the runtime/storage lab](runtime-observations-source-lab-v1.md). The bridge owner must explicitly select `--runtime-observations v1` and an already admitted simulation bundle. The browser cannot set a binary path, override its target, change capture limits or enable hardware execution.

The normal four/six-request storage collection is unchanged. This feature has a separate button and one additional read-only command; mounting a panel, selecting an access or changing an arithmetic assumption sends no request.

## Walk through the view

1. Open the live CPU debugger, connect to the owner-selected bridge and stop at an actual captured record.
2. Refresh runtime and storage. Select an allocation from the current inventory using its exact allocation / storage-slot / generation triple.
3. Read a bounded memory window. The independent first access page is limited to 16 returned rows / 64 scanned records. Missing rows are not proof that no access happened.
4. Click **Read bundle-declared target**. The reply must match the same connection, bridge session, backend session, capture instance, complete session and full cursor. It reports original envelope version/identity, subject identity, admitted module identity/length and logical CPU wave width. It does not move execution.
5. Select one retained workgroup access with an available actual operation producer. The selection includes its full invocation, occurrence, schedule/site and activation/attempt, not only an instruction location or frame depth.
6. Inspect the modeled bank footprint. The allocation-base residue is explicitly an assumption, initially zero. Changing it changes only arithmetic, never the captured bytes or declared target.

The model covers one complete access of at most 256 bytes, at most 65 dwords and at most 64 modeled banks. Larger accesses are unavailable, not clipped. The named profiles use 4-byte dword interleaving: 32 banks for gfx942:xnack- and 64 for gfx950:xnack-. This does not establish native instruction transaction geometry.

## What clears the view

A new control operation, connection, runtime record, target reply, storage generation/range or access selection clears the appropriate derived selection. A target request hides prior values while pending. Only a valid same-stop reply can restore the exact preceding collection; invalid, late or replaced-connection replies cannot restore it.

A changed access resets the assumed residue. Editing the storage fields immediately hides old access/memory/model results. Disconnecting leaves no selected target model.

## Explicitly unavailable

Raw KIR contains no verified bundle declaration; its response is `raw_input_has_no_declared_gpu_target`. A logical simulation width of 32 or 64 cannot supply a missing GPU target. There is no target override in this view.

Unavailable producer identity, non-workgroup storage, a changed workgroup/generation, a stale cursor or no returned access row produces no bank grid. The first page is not silently expanded.

Physical base addresses, participating hardware lanes, shared native transaction/phase identifiers, multicast, conflict counts, GPU timing and physical/native register lifetimes remain unavailable. A CPU logical wave is not a hardware issue group. Multiple rows with equal source sites or invocation-local attempt numbers are not grouped into a transaction.

## Limits and evidence

Each declared-target protocol line including LF and its complete HTTP wrapper is limited to 4096 bytes. The existing collection byte/row/page limits remain independent. These are parser and request-profile limits, not an allocator/RSS guarantee.

The checked-in target-view client/component/browser tests use explicitly synthetic transport fixtures to exercise correlation, clearing, bounds and responsive layout. They are not ordinary-source execution or hardware qualification. The separate [actual desktop/mobile qualification](declared-target-bank-qualification-20260923.md) now records 112 real HTTP requests across two fresh CPU sessions, with exact selected input pins, full cursor/producer joins, independent bank arithmetic and cleared stale state. Its actual workgroup witness does not turn the synthetic controls into source execution or establish hardware behavior.

This is a one-access arithmetic adapter. It does not prove absence of races or bank conflicts and does not close the hardware visualization milestone.
