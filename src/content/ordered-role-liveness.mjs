// Bounded static analysis of one admitted finite ordered region. No execution or authority.
// Intermediate versions are analysis labels, never invented canonical SSA definitions.
import { check, keys, rows, integer, freeze } from './repeat-native-core.mjs';
const ROLES = Object.freeze(['input0', 'input1', 'input2', 'scratch', 'output']);
const OPCODES = Object.freeze(['move', 'add', 'subtract', 'and', 'or', 'xor']);
export const ORDERED_ROLE_LIVENESS_LIMITS = Object.freeze({ steps: 16, values: 19, boundaries: 17, operandSlots: 32 });

/** Call only after the owning source/native profile has checked all exact joins.
 * Every declared read counts, including reads by a subsequently unused definition.
 * This deliberately performs no dead-code elimination or surrounding-CFG analysis. */
export function buildOrderedRoleLiveness(input) {
  keys(input, ['descriptors', 'inputValueIds', 'resultValueId', 'coordinate', 'rawBlockId']);
  check(Array.isArray(input.descriptors) && input.descriptors.length >= 1 && input.descriptors.length <= 16,
    'Logical region must contain 1..16 declared instructions.');
  const descriptors = rows(input.descriptors, input.descriptors.length).map(word => integer(word, 1023));
  const inputs = rows(input.inputValueIds, 3).map(id => integer(id, 8192));
  const resultId = integer(input.resultValueId, 8192);
  check(new Set([...inputs, resultId]).size === 4, 'Canonical input/result SSA identities overlap.');
  const coordinate = rows(input.coordinate, 3).map(part => integer(part, 8192));
  const rawBlockId = integer(input.rawBlockId, 8192);
  const versions = [], current = Array(5).fill(null), instructions = [];
  function define(role, step, canonicalInput) {
    const value = { key: step === null ? ROLES[role] : 'definition:' + step, role: ROLES[role],
      definitionStep: step, canonicalInputSsa: canonicalInput, canonicalResultSsa: null,
      bornBoundary: step === null ? 0 : step + 1, readOperands: [], overwrittenAtStep: null,
      returned: false, lastReadStep: null, endBoundaryExclusive: 0, unused: false };
    versions.push(value); current[role] = value; return value;
  }
  for (let role = 0; role < 3; role++) define(role, null, inputs[role]);
  for (const [step, word] of descriptors.entries()) {
    const opcode = word & 7, destination = 3 + ((word >> 3) & 1);
    const left = (word >> 4) & 7, right = (word >> 7) & 7;
    check(opcode <= 5 && left <= 4 && right <= 4 && (opcode !== 0 || right === 0),
      'Unsupported closed ordered-program descriptor.');
    const sourceRoles = opcode === 0 ? [left] : [left, right];
    // Snapshot all read operands before changing the destination, including self-reads.
    const readKeys = sourceRoles.map((role, operand) => {
      const value = current[role];
      check(value !== null, 'Declared instruction reads an undefined logical role.');
      value.readOperands.push({ step, operand }); return value.key;
    });
    if (current[destination] !== null) current[destination].overwrittenAtStep = step;
    const written = define(destination, step, null);
    instructions.push({ step, opcode: OPCODES[opcode], descriptor: word,
      reads: readKeys, writes: written.key, destination: ROLES[destination] });
  }
  check(current[4] !== null, 'The selected region never defines its result role.');
  current[4].returned = true; current[4].canonicalResultSsa = resultId;
  const count = descriptors.length;
  for (const value of versions) {
    value.lastReadStep = value.readOperands.length ? value.readOperands[value.readOperands.length - 1].step : null;
    value.unused = value.lastReadStep === null && !value.returned;
    value.endBoundaryExclusive = value.returned ? count + 1 :
      value.lastReadStep === null ? value.bornBoundary : value.lastReadStep + 1;
  }
  const boundaries = Array.from({ length: count + 1 }, (_, boundary) => {
    const live = versions.filter(value => value.bornBoundary <= boundary && boundary < value.endBoundaryExclusive)
      .map(value => value.key);
    return { boundary, live, count: live.length };
  });
  const steps = instructions.map(instruction => {
    const operandWrite = [...new Set([...instruction.reads, instruction.writes])];
    const transient = [...new Set([...boundaries[instruction.step].live,
      ...boundaries[instruction.step + 1].live, ...operandWrite])];
    return { ...instruction, operandWrite, operandWriteCount: operandWrite.length,
      transient, transientCount: transient.length };
  });
  return freeze({ interpretation: 'static_finite_region_logical_def_use_v1', coordinate, rawBlockId,
    inputValueIds: inputs, resultValueId: resultId, values: versions, steps, boundaries,
    liveIn: boundaries[0].live, liveOut: boundaries[count].live,
    peakBoundaryLive: Math.max(...boundaries.map(row => row.count)),
    peakTransient: Math.max(...steps.map(row => row.transientCount)),
    unavailable: ['Surrounding CFG and caller live sets', 'Intermediate canonical SSA IDs',
      'Captured intermediate values or instruction microsteps', 'Physical register lifetimes or allocator replay',
      'Occupancy, timing and performance'] });
}
