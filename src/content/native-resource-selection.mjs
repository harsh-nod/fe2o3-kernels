// Presentation-only links between already validated, immutable projections.
// Tokens are not serialized authority: only the exact originating objects qualify.
const origins = new WeakMap();
function origin(selection) {
  return selection !== null && typeof selection === "object" ? origins.get(selection) : undefined;
}
export function selectNativeInstruction(projection, caseId, ordinal, fileOffset) {
  if (projection?.status !== "ready" || projection.cases.length > 4 ||
      !Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= 16 ||
      !Number.isSafeInteger(fileOffset) || fileOffset < 0) return null;
  const matches = projection.cases.filter(row => row.id === caseId);
  if (matches.length !== 1) return null;
  const row = matches[0], instruction = row.program[ordinal];
  if (row.program.length > 16 || !Number.isSafeInteger(row.staticInstructions) ||
      row.staticInstructions < row.program.length ||
      !instruction || instruction.fileOffset !== fileOffset ||
      row.registerGrid.instructionOffsets.length !== row.program.length ||
      row.registerGrid.instructionOffsets[ordinal] !== fileOffset) return null;
  const selection = Object.freeze({ caseId, ordinal, fileOffset,
    joinSha256: projection.joinSha256, sourceReceiptSha256: projection.sourceReceiptSha256,
    sourceSha256: row.sourceSha256, semanticSha256: row.semanticSha256,
    canonicalSha256: row.canonicalKirSha256, llvmSha256: row.llvmSha256,
    hsacoSha256: row.hsacoSha256, descriptorSha256: row.descriptorSha256 });
  origins.set(selection, { projection, row });
  return selection;
}
export function matchesNativeInstruction(selection, projection, row) {
  const bound = origin(selection);
  return !!bound && bound.projection === projection && bound.row === row &&
    projection.cases.includes(row) && selection.joinSha256 === projection.joinSha256 &&
    selection.sourceReceiptSha256 === projection.sourceReceiptSha256 &&
    selection.caseId === row.id && selection.sourceSha256 === row.sourceSha256 &&
    selection.semanticSha256 === row.semanticSha256 && selection.canonicalSha256 === row.canonicalKirSha256 &&
    selection.llvmSha256 === row.llvmSha256 && selection.hsacoSha256 === row.hsacoSha256 &&
    selection.descriptorSha256 === row.descriptorSha256 &&
    row.program[selection.ordinal]?.fileOffset === selection.fileOffset &&
    row.registerGrid.instructionOffsets[selection.ordinal] === selection.fileOffset;
}
export function selectedRegisterInstruction(selection, grid) {
  const bound = origin(selection);
  return bound && matchesNativeInstruction(selection, bound.projection, bound.row) &&
    bound.row.registerGrid === grid ? selection.ordinal : null;
}
export function selectedDemandBoundaries(selection, projection, model) {
  const bound = origin(selection);
  if (!bound || !matchesNativeInstruction(selection, bound.projection, bound.row) ||
      projection?.status !== "ready" || !projection.cases.includes(model) ||
      projection.nativeJoinSha256 !== selection.joinSha256 ||
      projection.sourceReceiptSha256 !== selection.sourceReceiptSha256 ||
      model.profile !== bound.row.profile || model.canonicalSha256 !== selection.canonicalSha256 ||
      model.plan.steps !== bound.row.program.length ||
      model.plan.values.length > 19 || model.plan.uses.length > 33 ||
      model.boundaries.length > 34) return null;
  const read = 2 * selection.ordinal + 1, write = read + 1;
  if (!model.boundaries.includes(read) || !model.boundaries.includes(write)) return null;
  return Object.freeze({ read, write, capsuleSha256: projection.capsuleSha256,
    reportSha256: model.reportSha256,
    readValueIds: Object.freeze(model.plan.uses.filter(use => use.at === read).map(use => use.value)),
    writeValueIds: Object.freeze(model.plan.values.filter(value => value.def === write).map(value => value.id)) });
}
