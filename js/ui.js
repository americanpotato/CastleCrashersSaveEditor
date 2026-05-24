let blowfish = null;
let rawEncrypted = null;

// Hex editor state
let hexSelStart = -1;
let hexSelEnd   = -1;
let hexDragging = false;

const savedSteamId = localStorage.getItem('steamId');
if (savedSteamId) {
  document.getElementById('steamIdInput').value = savedSteamId;
}

document.addEventListener('mouseup', () => { hexDragging = false; });

// ─── Status ───────────────────────────────────────────────────────────────────

function setStatus(msg, type) {
  document.getElementById('statusText').textContent = msg;
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot' + (type === 'ok' ? ' loaded' : type === 'err' ? ' error' : '');
}

// ─── File I/O ─────────────────────────────────────────────────────────────────

function handleFileLoad(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  const steamId = document.getElementById('steamIdInput').value.trim();
  if (!steamId || steamId.length < 10) {
    setStatus('Enter a valid Steam ID64 first', 'err');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      rawEncrypted = new Uint8Array(ev.target.result);
      const key = buildKey(steamId);
      blowfish = new BlowfishJS(key);
      saveData = blowfish.decrypt(rawEncrypted);

      addBackup(rawEncrypted);
      setStatus(`Loaded & decrypted ${file.name} (${rawEncrypted.length} bytes)`, 'ok');
      localStorage.setItem('steamId', steamId);
      document.getElementById('btnDownload').disabled = false;
      selectedChar = -1;
      hexSelStart = -1;
      hexSelEnd   = -1;
      renderCharGrid();
      renderEditor();
    } catch(err) {
      setStatus('Decryption failed: ' + err.message, 'err');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function validateSteamId() {
  const el = document.getElementById('steamIdInput');
  const val = el.value.trim();
  const valid = val.length === 17 && /^\d+$/.test(val);
  el.classList.toggle('warn', !valid && val.length > 0);
}

// ─── Backup History ────────────────────────────────────────────────────────────

let saveBackups = [];

function loadBackups() {
  try {
    const raw = localStorage.getItem('saveBackups');
    saveBackups = raw ? JSON.parse(raw) : [];
  } catch { saveBackups = []; }
}

function persistBackups() {
  localStorage.setItem('saveBackups', JSON.stringify(saveBackups));
}

function addBackup(encryptedBytes) {
  const data = Array.from(encryptedBytes);
  saveBackups.unshift({ id: Date.now(), time: new Date().toISOString(), data });
  if (saveBackups.length > 100) saveBackups.length = 100;
  persistBackups();
}

function toggleBackups() {
  const dd = document.getElementById('backupsDropdown');
  const open = dd.classList.toggle('open');
  if (open) renderBackups();
}

function renderBackups() {
  const dd = document.getElementById('backupsDropdown');
  if (!saveBackups.length) {
    dd.innerHTML = '<div class="backups-empty">No backups yet</div>';
    return;
  }
  let html = `<div class="backups-header">
    <span>${saveBackups.length} backup${saveBackups.length === 1 ? '' : 's'}</span>
    <button class="backup-btn danger" onclick="deleteAllBackups()">Clear all</button>
  </div>`;
  for (const b of saveBackups) {
    const d = new Date(b.time);
    const pad = n => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    html += `<div class="backup-entry">
      <span class="backup-time">${ts}</span>
      <div class="backup-actions">
        <button class="backup-btn" onclick="downloadBackup(${b.id})">Download</button>
        <button class="backup-btn danger" onclick="deleteBackup(${b.id})">✕</button>
      </div>
    </div>`;
  }
  dd.innerHTML = html;
}

function downloadBackup(id) {
  const b = saveBackups.find(x => x.id === id);
  if (!b) return;
  const encrypted = new Uint8Array(b.data);
  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date(b.time);
  const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
  a.download = `cc_save_backup_${ts}.dat`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function deleteBackup(id) {
  saveBackups = saveBackups.filter(x => x.id !== id);
  persistBackups();
  renderBackups();
}

function deleteAllBackups() {
  saveBackups = [];
  persistBackups();
  renderBackups();
}

loadBackups();

function downloadSave() {
  if (!saveData || !blowfish) return;
  const checksumValue = blowfish.ccChecksum(saveData, saveData.length - 4);
  const dv = new DataView(saveData.buffer, saveData.byteOffset);
  dv.setUint32(saveData.length - 4, checksumValue, true);
  const encrypted = blowfish.encrypt(saveData);
  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cc_save.dat';
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus('Encrypted save downloaded as cc_save.dat', 'ok');
}

// ─── Character Grid ───────────────────────────────────────────────────────────

function renderCharGrid() {
  const grid = document.getElementById('charGrid');
  grid.innerHTML = '';

  for (let i = 0; i < NUM_CHARS; i++) {
    const off = charOffset(i);
    const unlocked = readU8(off + OFF.UNLOCK) !== 0;
    const level = readU8(off + OFF.LEVEL) + 1;
    const skull = readU8(off + OFF.SKULL);

    const card = document.createElement('div');
    card.className = 'char-card' + (unlocked ? '' : ' locked') + (i === selectedChar ? ' selected' : '');
    card.onclick = () => { selectedChar = i; renderCharGrid(); renderEditor(); };

    let skullBadge = '';
    if (skull === 1) skullBadge = '<img class="skull-badge" src="images/skulls/whiteskull.png" alt="White Skull">';
    else if (skull === 255) skullBadge = '<img class="skull-badge" src="images/skulls/goldskull.png" alt="Gold Skull">';

    card.innerHTML = `
      <div class="char-img">${CHARACTER_IMAGES[i] ? `<img src="${CHARACTER_IMAGES[i]}" alt="${CHARACTER_NAMES[i] || 'Unknown'}">` : '❓'}</div>
      <div class="char-name">${CHARACTER_NAMES[i] || 'Unknown'}</div>
      <div class="char-level">Lv.${level}</div>
      ${skullBadge}
      ${!unlocked ? '<div class="lock-badge">🔒</div>' : ''}
    `;
    grid.appendChild(card);
  }

  // Global card at the bottom
  const globalCard = document.createElement('div');
  globalCard.className = 'char-card global' + (selectedChar === -2 ? ' selected' : '');
  globalCard.onclick = () => { selectedChar = -2; renderCharGrid(); renderEditor(); };
  globalCard.innerHTML = `
    <div class="char-img" style="font-size:24px;line-height:48px">⚙</div>
    <div class="char-name">Global</div>
    <div class="char-level">64 bytes</div>
  `;
  grid.appendChild(globalCard);
}

// ─── Editor dispatch ──────────────────────────────────────────────────────────

function renderEditor() {
  const panel = document.getElementById('editorPanel');

  if (!saveData) {
    panel.className = 'editor-panel empty';
    panel.innerHTML = '<div class="editor-empty-msg">Click a character to edit</div>';
    return;
  }

  if (selectedChar === -2) return renderGlobalEditor();

  if (selectedChar < 0) {
    panel.className = 'editor-panel empty';
    panel.innerHTML = '<div class="editor-empty-msg">Click a character to edit</div>';
    return;
  }

  panel.className = 'editor-panel';
  const i = selectedChar;
  const off = charOffset(i);

  const unlocked = readU8(off + OFF.UNLOCK) !== 0;
  const level = readU8(off + OFF.LEVEL) + 1;
  const xp = readI32BE(off + OFF.XP);
  const gold = readI32BE(off + OFF.GOLD);
  const str = readU8(off + OFF.STR);
  const def = readU8(off + OFF.DEF);
  const mag = readU8(off + OFF.MAG);
  const agi = readU8(off + OFF.AGI);
  const weapon = readU8(off + OFF.WEAPON);
  const pet = readU8(off + OFF.PET);
  const normalLvl = countBits3Bytes(off + OFF.NORMAL_LVL);
  const insaneUnlocked = readU8(off + OFF.INSANE_UNLOCKED) !== 0;
  const insaneLvl = countBits3Bytes(off + OFF.INSANE_LVL);
  const skull = readU8(off + OFF.SKULL);
  const potions = readU8(off + OFF.POTIONS);
  const bombs = readU8(off + OFF.BOMBS);
  const sandwiches = readU8(off + OFF.SANDWICHES);
  const ncFlags = readU8(off + OFF.NON_CONSUMABLE);

  const canToggleUnlock = i >= 4 && i < 28;

  panel.innerHTML = `
    <div class="editor-header">
      <div class="char-icon">${CHARACTER_IMAGES[i] ? `<img src="${CHARACTER_IMAGES[i]}" alt="${CHARACTER_NAMES[i] || 'Unknown'}">` : '❓'}</div>
      <div class="char-info">
        <h3>${CHARACTER_NAMES[i] || 'Unknown'}</h3>
        <div class="char-id">Character #${i + 1}</div>
      </div>
    </div>

    ${canToggleUnlock ? `
    <div class="check-row">
      <input type="checkbox" id="edUnlock" ${unlocked ? 'checked' : ''} onchange="editUnlock(this.checked)">
      <label for="edUnlock">Unlocked</label>
    </div>` : ''}

    <div class="field-group-title">General</div>
    <div class="field-group">
      <div class="field-row">
        <span class="field-label">Level</span>
        <input class="field-input" type="number" min="1" max="99" value="${level}" onchange="editLevel(this.value)">
      </div>
      <div class="field-row">
        <span class="field-label">XP</span>
        <input class="field-input" type="number" value="${xp}" onchange="editXP(this.value)">
      </div>
      <div class="field-row">
        <span class="field-label">Gold</span>
        <input class="field-input" type="number" value="${gold}" onchange="editGold(this.value)">
      </div>
    </div>

    <div class="field-group-title">Stats</div>
    <div class="field-group">
      <div class="slider-row">
        <span class="slider-label">Strength</span>
        <input type="range" min="0" max="25" value="${str}" oninput="editStat(${OFF.STR}, this.value, this)">
        <span class="slider-val">${str}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Defense</span>
        <input type="range" min="0" max="25" value="${def}" oninput="editStat(${OFF.DEF}, this.value, this)">
        <span class="slider-val">${def}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Magic</span>
        <input type="range" min="0" max="25" value="${mag}" oninput="editStat(${OFF.MAG}, this.value, this)">
        <span class="slider-val">${mag}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Agility</span>
        <input type="range" min="0" max="25" value="${agi}" oninput="editStat(${OFF.AGI}, this.value, this)">
        <span class="slider-val">${agi}</span>
      </div>
    </div>

    <div class="field-group-title">Equipment</div>
    <div class="field-group">
      <div class="field-row">
        <span class="field-label">Weapon</span>
        <select class="field-select" onchange="editByte(${OFF.WEAPON}, this.value)">
          ${WEAPONS.map((w, idx) => `<option value="${idx}" ${idx === weapon ? 'selected' : ''}>${idx}: ${w}</option>`).join('')}
        </select>
      </div>
      <div class="field-row">
        <span class="field-label">Pet</span>
        <select class="field-select" onchange="editByte(${OFF.PET}, this.value)">
          ${PETS.map((p, idx) => `<option value="${idx}" ${idx === pet ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field-group-title">Items</div>
    <div class="field-group">
      <div class="field-row">
        <span class="field-label">Potions</span>
        <input class="field-input" type="number" min="0" max="255" value="${potions}" onchange="editByte(${OFF.POTIONS}, this.value)">
      </div>
      <div class="field-row">
        <span class="field-label">Bombs</span>
        <input class="field-input" type="number" min="0" max="255" value="${bombs}" onchange="editByte(${OFF.BOMBS}, this.value)">
      </div>
      <div class="field-row">
        <span class="field-label">Sandwiches</span>
        <input class="field-input" type="number" min="0" max="255" value="${sandwiches}" onchange="editByte(${OFF.SANDWICHES}, this.value)">
      </div>
      ${NON_CONSUMABLE_ITEMS.map((name, bit) => `
      <div class="check-row">
        <input type="checkbox" id="nc${bit}" ${(ncFlags >> bit) & 1 ? 'checked' : ''} onchange="editNonConsumable(${bit}, this.checked)">
        <label for="nc${bit}">${name}</label>
      </div>`).join('')}
    </div>

    <div class="field-group-title">Progress</div>
    <div class="field-group">
      <div class="field-row">
        <span class="field-label">Normal Mode</span>
        <select class="field-select" onchange="editLevelBits(${OFF.NORMAL_LVL}, this.value)">
          ${LEVELS.map((l, idx) => `<option value="${idx}" ${idx === normalLvl ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="check-row">
        <input type="checkbox" id="edInsane" ${insaneUnlocked ? 'checked' : ''} onchange="editInsaneUnlock(this.checked)">
        <label for="edInsane">Insane Mode Unlocked</label>
      </div>
      <div class="field-row">
        <span class="field-label">Insane Mode</span>
        <select class="field-select" onchange="editLevelBits(${OFF.INSANE_LVL}, this.value)">
          ${LEVELS.map((l, idx) => `<option value="${idx}" ${idx === insaneLvl ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="field-row">
        <span class="field-label">Skull</span>
        <select class="field-select" onchange="editByte(${OFF.SKULL}, this.value)">
          <option value="0" ${skull === 0 ? 'selected' : ''}>None</option>
          <option value="1" ${skull === 1 ? 'selected' : ''}>White Skull</option>
          <option value="255" ${skull === 255 ? 'selected' : ''}>Gold Skull</option>
        </select>
      </div>
    </div>
  `;
}

// ─── Global Hex Editor ────────────────────────────────────────────────────────

function unlockAllPets() {
  if (!saveData) return;
  saveData[8] = 0xFE;
  for (let i = 9; i <= 11; i++) saveData[i] = 0xFF;
  renderGlobalEditor();
  setStatus('All pets unlocked', 'ok');
}

function enableItems() {
  if (!saveData) return;
  saveData[12] = 0x4E;
  renderGlobalEditor();
  setStatus('Bow, boomerang, and shovel enabled', 'ok');
}

function unlockAllWeapons() {
  if (!saveData) return;
  for (let i = 18; i <= 30; i++) saveData[i] = 0xFF;
  renderGlobalEditor();
  setStatus('All weapons unlocked', 'ok');
}

function renderGlobalEditor() {
  const panel = document.getElementById('editorPanel');
  panel.className = 'editor-panel';

  const lo = (hexSelStart >= 0 && hexSelEnd >= 0) ? Math.min(hexSelStart, hexSelEnd) : -1;
  const hi = (hexSelStart >= 0 && hexSelEnd >= 0) ? Math.max(hexSelStart, hexSelEnd) : -1;

  // Header row
  let gridHtml = `<div class="hex-header-row">
    <span class="hex-addr"></span>
    ${Array.from({length: 8}, (_, i) => `<span class="hex-col-hdr">+${i}</span>`).join('')}
  </div>`;

  for (let row = 0; row < 8; row++) {
    const base = row * 8;
    gridHtml += `<div class="hex-row">`;
    gridHtml += `<span class="hex-addr">${base.toString(16).padStart(2, '0').toUpperCase()}</span>`;
    for (let col = 0; col < 8; col++) {
      const idx = base + col;
      const val = saveData ? saveData[idx] : 0;
      const hex = val.toString(16).padStart(2, '0').toUpperCase();
      const inSel = idx >= lo && idx <= hi;
      const cls = ['hex-byte', inSel ? 'selected' : ''].filter(Boolean).join(' ');
      gridHtml += `<span class="${cls}" data-idx="${idx}"
        onmousedown="hexOnMouseDown(event,${idx})"
        onmouseenter="hexOnMouseEnter(event,${idx})">${hex}</span>`;
    }
    gridHtml += `</div>`;
  }

  panel.innerHTML = `
    <div class="editor-header">
      <div class="char-info">
        <h3>Global Data</h3>
        <div class="char-id">64 bytes — click or drag to select</div>
      </div>
    </div>

    <div class="global-actions">
      <button class="btn btn-secondary" onclick="unlockAllPets()">🐾 Unlock All Pets</button>
      <button class="btn btn-secondary" onclick="enableItems()">🏹 Enable Bow, Boomerang &amp; Shovel</button>
      <button class="btn btn-secondary" onclick="unlockAllWeapons()">⚔️ Unlock All Weapons</button>
    </div>

    <div class="hex-editor" id="hexEditorGrid">${gridHtml}</div>

    <div id="hexEditPanel"></div>
  `;

  renderHexEditPanel();
}

// ─── Hex editor interaction ───────────────────────────────────────────────────

function hexOnMouseDown(e, idx) {
  e.preventDefault();
  hexDragging = true;
  if (e.shiftKey && hexSelStart >= 0) {
    hexSelEnd = idx;
  } else {
    hexSelStart = idx;
    hexSelEnd   = idx;
  }
  hexUpdateSelection();
}

function hexOnMouseEnter(e, idx) {
  if (hexDragging) {
    hexSelEnd = idx;
    hexUpdateSelection();
  }
}

function hexUpdateSelection() {
  const lo = (hexSelStart >= 0 && hexSelEnd >= 0) ? Math.min(hexSelStart, hexSelEnd) : -1;
  const hi = (hexSelStart >= 0 && hexSelEnd >= 0) ? Math.max(hexSelStart, hexSelEnd) : -1;

  document.querySelectorAll('.hex-byte').forEach(el => {
    const idx = parseInt(el.dataset.idx);
    el.classList.toggle('selected', idx >= lo && idx <= hi);
  });

  renderHexEditPanel();
}

function renderHexEditPanel() {
  const panel = document.getElementById('hexEditPanel');
  if (!panel || !saveData) return;

  if (hexSelStart < 0) {
    panel.innerHTML = '';
    return;
  }

  const lo = Math.min(hexSelStart, hexSelEnd);
  const hi = Math.max(hexSelStart, hexSelEnd);

  if (lo === hi) {
    // Single byte
    const v = saveData[lo];
    panel.innerHTML = `
      <div class="hex-edit-panel">
        <div class="hex-edit-title">Byte 0x${lo.toString(16).padStart(2,'0').toUpperCase()} &nbsp;(offset ${lo})</div>
        <div class="hex-input-row">
          <span class="hex-input-label">HEX</span>
          <input class="hex-input" id="hxHex" maxlength="2" value="${v.toString(16).padStart(2,'0').toUpperCase()}"
            oninput="hexSyncFrom('hex', this.value, ${lo})">
        </div>
        <div class="hex-input-row">
          <span class="hex-input-label">DEC</span>
          <input class="hex-input" id="hxDec" type="number" min="0" max="255" value="${v}"
            oninput="hexSyncFrom('dec', this.value, ${lo})">
        </div>
        <div class="hex-input-row">
          <span class="hex-input-label">BIN</span>
          <input class="hex-input" id="hxBin" maxlength="8" value="${v.toString(2).padStart(8,'0')}"
            oninput="hexSyncFrom('bin', this.value, ${lo})">
        </div>
      </div>`;
  } else {
    // Range
    const bytes = Array.from(saveData.slice(lo, hi + 1));
    const hexStr = bytes.map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
    panel.innerHTML = `
      <div class="hex-edit-panel">
        <div class="hex-edit-title">
          0x${lo.toString(16).padStart(2,'0').toUpperCase()}–0x${hi.toString(16).padStart(2,'0').toUpperCase()}
          &nbsp;(${hi - lo + 1} bytes)
        </div>
        <div class="hex-input-row" style="flex-direction:column;align-items:stretch;gap:6px">
          <span class="hex-input-label" style="width:auto">Hex bytes (space-separated)</span>
          <input class="hex-input" id="hxRange" value="${hexStr}"
            oninput="hexWriteRange(this.value, ${lo}, ${hi})">
        </div>
      </div>`;
  }
}

function hexSyncFrom(src, rawVal, idx) {
  if (!saveData) return;
  let v = src === 'hex' ? parseInt(rawVal, 16)
        : src === 'bin' ? parseInt(rawVal, 2)
        : parseInt(rawVal, 10);
  if (isNaN(v)) return;
  v = Math.max(0, Math.min(255, v));
  saveData[idx] = v;

  if (src !== 'hex') { const el = document.getElementById('hxHex'); if (el) el.value = v.toString(16).padStart(2,'0').toUpperCase(); }
  if (src !== 'dec') { const el = document.getElementById('hxDec'); if (el) el.value = v; }
  if (src !== 'bin') { const el = document.getElementById('hxBin'); if (el) el.value = v.toString(2).padStart(8,'0'); }

  const byteEl = document.querySelector(`.hex-byte[data-idx="${idx}"]`);
  if (byteEl) byteEl.textContent = v.toString(16).padStart(2,'0').toUpperCase();
}

function hexWriteRange(rawVal, lo, hi) {
  if (!saveData) return;
  const parts = rawVal.trim().split(/\s+/);
  for (let i = lo; i <= hi && (i - lo) < parts.length; i++) {
    const v = parseInt(parts[i - lo], 16);
    if (!isNaN(v)) saveData[i] = Math.max(0, Math.min(255, v));
  }
  for (let i = lo; i <= hi; i++) {
    const el = document.querySelector(`.hex-byte[data-idx="${i}"]`);
    if (el) el.textContent = saveData[i].toString(16).padStart(2,'0').toUpperCase();
  }
}

document.addEventListener('click', function(e) {
  const dd = document.getElementById('backupsDropdown');
  const wrap = document.querySelector('.backups-wrap');
  if (dd && dd.classList.contains('open') && wrap && !wrap.contains(e.target)) {
    dd.classList.remove('open');
  }
});
