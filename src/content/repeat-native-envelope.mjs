// Allocation-free length preflight for this fixed capsule shape; no shared parser change.
const OUTER_BYTES = 4194304;
function check(value, message) { if (!value) throw new Error(message); }
const over = 'Repeat-native outer JSON cap exceeded.';
function stringBytes(value, quoted, remaining) {
  check(typeof value === 'string' && value.length <= remaining, over);
  let bytes = quoted ? 2 : 0;
  check(bytes <= remaining, over);
  for (let at = 0; at < value.length; at++) {
    const c = value.charCodeAt(at);
    if (quoted && (c === 0x22 || c === 0x5c)) bytes += 2;
    else if (quoted && c < 0x20) bytes += (c === 8 || c === 9 || c === 10 || c === 12 || c === 13) ? 2 : 6;
    else if (c < 0x80) bytes++;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      const next = value.charCodeAt(++at);
      check(next >= 0xdc00 && next <= 0xdfff, 'Invalid retained Unicode.');
      bytes += 4;
    } else {
      check(c < 0xdc00 || c > 0xdfff, 'Invalid retained Unicode.');
      bytes += 3;
    }
    check(bytes <= remaining, over);
  }
  return bytes;
}
/** Reject excessive code units AND actual UTF-8 bytes before the shared parser allocates its encoding. */
export function assertRepeatNativeOuterText(value) {
  stringBytes(value, false, OUTER_BYTES);
}
/** Count JSON bytes without constructing the JSON string or a whole-envelope UTF-8 buffer.
 * Only the already-copied fixed primitive envelope calls this in production. Independent
 * graph/array/depth checks also bound accidental direct use; these are not parser extensions. */
export function repeatNativeEnvelopeBytes(value) {
  let bytes = 0, nodes = 0;
  const add = n => { bytes += n; check(bytes <= OUTER_BYTES, over); };
  const quote = s => add(stringBytes(s, true, OUTER_BYTES - bytes));
  function visit(current, depth) {
    check(++nodes <= 256 && depth <= 4, 'Repeat-native envelope shape exceeds bounds.');
    if (typeof current === 'string') { quote(current); return; }
    if (typeof current === 'number') {
      check(Number.isSafeInteger(current) && current >= 0, 'Invalid repeat-native envelope number.');
      add(String(current).length); return;
    }
    if (current === null) { add(4); return; }
    if (typeof current === 'boolean') { add(current ? 4 : 5); return; }
    check(current && typeof current === 'object', 'Invalid repeat-native envelope value.');
    if (Array.isArray(current)) {
      check(current.length <= 23, 'Repeat-native envelope array exceeds bounds.'); add(1);
      for (let at = 0; at < current.length; at++) {
        check(Object.hasOwn(current, at), 'Sparse repeat-native envelope array.');
        if (at) add(1); visit(current[at], depth + 1);
      }
      add(1); return;
    }
    const names = Object.keys(current);
    check(names.length <= 8, 'Repeat-native envelope object exceeds bounds.'); add(1);
    names.forEach((name, at) => {
      if (at) add(1); quote(name); add(1); visit(current[name], depth + 1);
    });
    add(1);
  }
  visit(value, 0); return bytes;
}
