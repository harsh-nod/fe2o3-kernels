import sourceLadderUtf8 from '../../examples/ordered_region_source_v31_r5.json?raw';
import usedDebuggerUtf8 from '../../examples/ordered_region_used_debugger_v31_r5.json?raw';
import unusedDebuggerUtf8 from '../../examples/ordered_region_unused_debugger_v31_r5.json?raw';
import type { OrderedRegionObservationInput } from './ordered-region-observation';

// Exact working-tree source-r5 output, not a committed compiler/release claim.
// These independent pins check retained bytes; they grant no capture authority.
export const ORDERED_REGION_RETAINED_INPUT: OrderedRegionObservationInput = {
  sourceLadderUtf8,
  expectedSourceLadderSha256: 'f74f36cd1576f532fdabf3d923a439c0dee4829a6df4cc3e5a353edabc80949d',
  variants: [
    {
      feature: 'ordered-region-v31',
      debuggerUtf8: usedDebuggerUtf8,
      expectedDebuggerSha256: '890be3a6c88fc6be0b642c67eeb65b673cf7dae1253febd4b07d3228b10f4a04',
    },
    {
      feature: 'ordered-region-unused-v31',
      debuggerUtf8: unusedDebuggerUtf8,
      expectedDebuggerSha256: 'cf0db0905d580c61911c9c94b3ff343079496bf20a0213dfad8be87b0dc601ce',
    },
  ],
};
