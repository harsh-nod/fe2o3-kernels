// Bounded presentation math only. This helper does not admit artifacts or establish liveness.
// The existing final-native owner supplies the already-checked plan and opcode effects.
const ROLE_NAMES = Object.freeze(['scratch', 'output', 'input0', 'input1', 'input2']);
const MAX_STEPS = 16, MAX_REGISTER = 63, MAX_PAYLOAD_OFFSET = 65532;
function check(value, message) { if (!value) throw new Error(message); }
function integer(value, maximum) {
  check(Number.isSafeInteger(value) && value >= 0 && value <= maximum, 'Invalid static register-use integer.');
  return value;
}
function array(value, minimum, maximum) {
  check(Array.isArray(value) && value.length >= minimum && value.length <= maximum &&
    Array.from({ length: value.length }, (_, at) => Object.hasOwn(value, at)).every(Boolean),
  'Invalid bounded static register-use array.');
  return value;
}
/** One closed role roster and explicit instruction effects; no source/native authority.
 * Duplicate reads become one cell. Unused declared roles are retained, never called free. */
export function buildDeclaredRegisterUseGrid(plan, steps) {
  const registers = array(plan, 5, 5).map(value => integer(value, MAX_REGISTER));
  check(new Set(registers).size === 5, 'Declared register roles overlap.');
  let firstOffset = 0;
  const copied = array(steps, 1, MAX_STEPS).map((step, at) => {
    check(step !== null && typeof step === 'object' && !Array.isArray(step) &&
      Object.keys(step).length === 3 && ['output', 'inputs', 'fileOffset'].every(key => Object.hasOwn(step, key)),
    'Invalid explicit instruction-use fields.');
    const output = integer(step.output, MAX_REGISTER);
    check(output === registers[0] || output === registers[1], 'An explicit write escapes the declared output/scratch roles.');
    const inputs = array(step.inputs, 1, 2).map(value => integer(value, MAX_REGISTER));
    check(inputs.every(value => registers.includes(value)), 'An explicit read has no declared register role.');
    const fileOffset = integer(step.fileOffset, MAX_PAYLOAD_OFFSET);
    if (at === 0) firstOffset = fileOffset;
    else check(fileOffset === firstOffset + 4 * at, 'Static instruction offsets are not contiguous.');
    return { output, inputs, fileOffset };
  });
  const roles = registers.map((register, at) => Object.freeze({
    role: ROLE_NAMES[at], register,
    uses: Object.freeze(copied.map(step => {
      const read = step.inputs.includes(register), write = step.output === register;
      return read ? (write ? 'read-write' : 'read') : (write ? 'write' : 'none');
    })),
  }));
  return Object.freeze({
    interpretation: 'static_explicit_instruction_uses_only',
    declaredHighWater: Math.max(...registers) + 1,
    instructionOffsets: Object.freeze(copied.map(step => step.fileOffset)),
    roles: Object.freeze(roles),
  });
}
