function buildKey(steamId64Str) {
  const sid = BigInt(steamId64Str);
  const lo = Number(sid & 0xFFFFFFFFn);
  const hi = Number((sid >> 32n) & 0xFFFFFFFFn);

  const key = new Uint8Array(24);
  const kv = new DataView(key.buffer);
  kv.setUint32(0, 0xb9128343, true);
  kv.setUint32(4, 0x7e636609, true);
  kv.setUint32(8, 0x127aac36, true);
  kv.setUint32(12, 0x563e6167, true);
  const qlo = Number(BigInt("0x019fd45372723839") & 0xFFFFFFFFn);
  const qhi = Number((BigInt("0x019fd45372723839") >> 32n) & 0xFFFFFFFFn);
  kv.setUint32(16, qlo, true);
  kv.setUint32(20, qhi, true);

  kv.setUint16(0, (hi >>> 16) & 0xFFFF, true);
  kv.setUint16(5, (lo >>> 16) & 0xFFFF, true);
  kv.setUint16(15, lo & 0xFFFF, true);
  kv.setUint16(19, hi & 0xFFFF, true);

  return key;
}

function charOffset(charIndex) {
  return GLOBAL_SIZE + charIndex * CHAR_SIZE;
}

function readU8(off) { return saveData[off]; }
function writeU8(off, v) { saveData[off] = v & 0xFF; }

function readU32BE(off) {
  return (saveData[off] << 24 | saveData[off+1] << 16 | saveData[off+2] << 8 | saveData[off+3]) >>> 0;
}
function writeU32BE(off, v) {
  saveData[off] = (v >>> 24) & 0xFF;
  saveData[off+1] = (v >>> 16) & 0xFF;
  saveData[off+2] = (v >>> 8) & 0xFF;
  saveData[off+3] = v & 0xFF;
}

function readI32BE(off) {
  const u = readU32BE(off);
  return u > 0x7FFFFFFF ? u - 0x100000000 : u;
}
function writeI32BE(off, v) {
  if (v < 0) v = v + 0x100000000;
  writeU32BE(off, v >>> 0);
}

function readU32LE(off) {
  return (saveData[off] | saveData[off+1] << 8 | saveData[off+2] << 16 | saveData[off+3] << 24) >>> 0;
}
function writeU32LE(off, v) {
  saveData[off]   = v & 0xFF;
  saveData[off+1] = (v >>> 8) & 0xFF;
  saveData[off+2] = (v >>> 16) & 0xFF;
  saveData[off+3] = (v >>> 24) & 0xFF;
}

function readBit(off, bit) {
  return (saveData[off + (bit >> 3)] >> (bit & 7)) & 1;
}
function writeBit(off, bit, val) {
  const b = off + (bit >> 3);
  if (val) saveData[b] |= 1 << (bit & 7);
  else saveData[b] &= ~(1 << (bit & 7));
}

function countBits3Bytes(off) {
  let count = 0;
  for (let i = 0; i < 3; i++) {
    let b = saveData[off + i];
    while (b) { count += b & 1; b >>= 1; }
  }
  return count;
}

function writeBits3Bytes(off, total) {
  for (let i = 0; i < 3; i++) {
    if (total >= 8) { saveData[off + i] = 0xFF; total -= 8; }
    else if (total > 0) { saveData[off + i] = (1 << total) - 1; total = 0; }
    else { saveData[off + i] = 0; }
  }
}
