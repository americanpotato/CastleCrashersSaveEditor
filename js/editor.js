function editUnlock(checked) {
  const off = charOffset(selectedChar);
  writeU8(off + OFF.UNLOCK, checked ? 0x80 : 0x00);
  renderCharGrid();
}

function editLevel(val) {
  const v = Math.max(1, Math.min(99, parseInt(val) || 1));
  writeU8(charOffset(selectedChar) + OFF.LEVEL, v - 1);
  renderCharGrid();
}

function editXP(val) {
  writeI32BE(charOffset(selectedChar) + OFF.XP, parseInt(val) || 0);
}

function editGold(val) {
  writeI32BE(charOffset(selectedChar) + OFF.GOLD, parseInt(val) || 0);
}

function editStat(statOff, val, el) {
  const v = Math.max(0, Math.min(25, parseInt(val) || 0));
  writeU8(charOffset(selectedChar) + statOff, v);
  el.parentElement.querySelector('.slider-val').textContent = v;
}

function editByte(off, val) {
  writeU8(charOffset(selectedChar) + off, parseInt(val) || 0);
}

function editLevelBits(off, val) {
  writeBits3Bytes(charOffset(selectedChar) + off, parseInt(val) || 0);
}

function editInsaneUnlock(checked) {
  writeU8(charOffset(selectedChar) + OFF.INSANE_UNLOCKED, checked ? 0x01 : 0x00);
}
