let blowfish = null;
let rawEncrypted = null;

const savedSteamId = localStorage.getItem('steamId');
if (savedSteamId) {
  document.getElementById('steamIdInput').value = savedSteamId;
}

function setStatus(msg, type) {
  document.getElementById('statusText').textContent = msg;
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot' + (type === 'ok' ? ' loaded' : type === 'err' ? ' error' : '');
}

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

      setStatus(`Loaded & decrypted ${file.name} (${rawEncrypted.length} bytes)`, 'ok');
      localStorage.setItem('steamId', steamId);
      document.getElementById('btnDownload').disabled = false;
      selectedChar = -1;
      renderCharGrid();
      renderEditor();
    } catch(err) {
      setStatus('Decryption failed: ' + err.message, 'err');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

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
      <div class="char-img">${CHARACTER_IMAGES[i] ? `<img src="${CHARACTER_IMAGES[i]}" alt="${CHARACTER_NAMES[i] || 'Unknown'}">` : '❓' || '❓'}</div>
      <div class="char-name">${CHARACTER_NAMES[i] || 'Unknown'}</div>
      <div class="char-level">Lv.${level}</div>
      ${skullBadge}
      ${!unlocked ? '<div class="lock-badge">🔒</div>' : ''}
    `;

    grid.appendChild(card);
  }
}

function renderEditor() {
  const panel = document.getElementById('editorPanel');

  if (selectedChar < 0 || !saveData) {
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

  const canToggleUnlock = i >= 4 && i < 28;

  panel.innerHTML = `
    <div class="editor-header">
      <div class="char-icon">${CHARACTER_IMAGES[i] ? `<img src="${CHARACTER_IMAGES[i]}" alt="${CHARACTER_NAMES[i] || 'Unknown'}">` : '❓' || '❓'}</div>
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
        <span class="slider-val" id="valStr">${str}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Defense</span>
        <input type="range" min="0" max="25" value="${def}" oninput="editStat(${OFF.DEF}, this.value, this)">
        <span class="slider-val" id="valDef">${def}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Magic</span>
        <input type="range" min="0" max="25" value="${mag}" oninput="editStat(${OFF.MAG}, this.value, this)">
        <span class="slider-val" id="valMag">${mag}</span>
      </div>
      <div class="slider-row">
        <span class="slider-label">Agility</span>
        <input type="range" min="0" max="25" value="${agi}" oninput="editStat(${OFF.AGI}, this.value, this)">
        <span class="slider-val" id="valAgi">${agi}</span>
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
