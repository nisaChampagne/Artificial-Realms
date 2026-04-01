/* ─────────────────────────────────────────────────────────────
   save.js — Save / Load system
───────────────────────────────────────────────────────────── */
class SaveSystem {
  constructor() {
    this._autoTimer = null;
    this._mode      = 'save'; // 'save' | 'load'
  }

  // ── State Snapshot ───────────────────────────────────────────
  snapshot() {
    return {
      character:        window.characterSystem?.character           || null,
      messages:         window.aiSystem?.messages                   || [],
      currentScene:     window.mapSystem?.currentScene              || 'dungeon',
      currentMusic:     window.audioSystem?.currentScene            || 'dungeon',
      perceptionCache:  window.mapSystem?._perceptionCache          || {},
      campaignType:     window.app?.gameState?.campaignType         || 'standard',
      customDesc:       window.app?.gameState?.customDesc           || '',
      journal:          window.journalSystem?.serialize()           || null,
      inventory:        window.inventorySystem?.serialize()         || null,
      worldState:       window.worldState?.serialize()              || null,
      savedAt:          new Date().toLocaleString(),
    };
  }

  // ── Write ────────────────────────────────────────────────────
  async save(slot) {
    try {
      const data = this.snapshot();
      await window.electronAPI.saveGame(slot, data);
      window.app.showToast(`Game saved to Slot ${slot}`, 'success');
      document.getElementById('autosave-label').textContent = `Last save: ${data.savedAt}`;
      return true;
    } catch (err) {
      window.app.showToast('Save failed: ' + err, 'error');
      return false;
    }
  }

  // ── Read ─────────────────────────────────────────────────────
  async load(slot) {
    try {
      const data = await window.electronAPI.loadGame(slot);
      if (!data) { window.app.showToast('No save found in that slot.', 'error'); return false; }

      // Restore character
      window.characterSystem.character = data.character;

      // Normalize fields added in later versions (safe for older saves)
      const ch = window.characterSystem.character;
      if (ch) {
        ch.conditions    = ch.conditions    ?? [];
        ch.inspiration   = ch.inspiration   ?? false;
        ch.initiative    = ch.initiative    ?? { active: false, order: [], currentIndex: 0, playerRoll: 0 };
        ch.concentration = ch.concentration ?? null;
        ch.tempHp        = ch.tempHp        ?? 0;
      }

      // Restore AI conversation
      window.aiSystem.messages  = data.messages || [];
      window.aiSystem.apiKey    = window.app._getActiveApiKey();
      window.aiSystem.model     = window.app.settings.model;
      window.aiSystem.provider  = window.app.settings.provider || 'openai';
      window.aiSystem.textSpeed = window.app.settings.textSpeed ?? 15;
      window.aiSystem.demoMode  = window.app.settings.demoMode || false;

      // Restore journal
      window.journalSystem?.restore(data.journal || null);

      // Restore inventory
      window.inventorySystem?.restore(data.inventory || null);

      // Restore world state
      window.worldState?.restore(data.worldState || null);

      // Restore scene — must show screen first so canvas has dimensions
      window.app.showScreen('game');
      window.app.gameState.campaignType = data.campaignType;
      window.app.gameState.customDesc   = data.customDesc;

      // Init subsystems (in case this is the first time entering game screen)
      window.audioSystem.init();
      window.audioSystem.setScene(data.currentMusic || 'dungeon');
      window.audioSystem.setVolume((parseInt(window.app.settings.volume) || 70) / 100);

      window.mapSystem.init();
      window.mapSystem._perceptionCache = data.perceptionCache || {};
      window.mapSystem.setScene(data.currentScene || 'dungeon');
      window.mapSystem.updateSprite(window.characterSystem.character?.appearance || {});

      window.characterSystem.updateHUD();
      window.aiSystem.rebuildLog();

      // Resume auto-save
      window.saveSystem.startAutoSave(5 * 60 * 1000);

      this.close();
      window.app.showToast('Game loaded!', 'success');
      return true;
    } catch (err) {
      window.app.showToast('Load failed: ' + err, 'error');
      return false;
    }
  }

  async deleteSave(slot) {
    await window.electronAPI.deleteSave(slot);
    this.renderSlots();
  }

  // ── Auto-save ────────────────────────────────────────────────
  startAutoSave(intervalMs = 5 * 60 * 1000) {
    this.stopAutoSave();
    this._autoTimer = setInterval(() => this.save('auto'), intervalMs);
  }
  stopAutoSave() {
    if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
  }

  // ── UI ───────────────────────────────────────────────────────
  open(mode = 'save') {
    this._mode = mode;
    this._updateTabs();
    this.renderSlots();
    document.getElementById('modal-save').classList.remove('hidden');
  }
  close() { document.getElementById('modal-save').classList.add('hidden'); }

  setMode(mode) {
    this._mode = mode;
    this._updateTabs();
    this.renderSlots();
  }
  _updateTabs() {
    document.getElementById('tab-save-btn').classList.toggle('active', this._mode === 'save');
    document.getElementById('tab-load-btn').classList.toggle('active', this._mode === 'load');
  }

  async renderSlots() {
    const container = document.getElementById('save-slots');
    container.innerHTML = '';
    const saves = await window.electronAPI.listSaves();
    const slotMap = {};
    saves.forEach(s => { slotMap[s.slot] = s; });

    const slots = ['1', '2', '3', 'auto'];
    slots.forEach(slot => {
      const info = slotMap[slot];
      const el = document.createElement('div');
      el.className = 'save-slot' + (info ? '' : ' empty');

      const label = slot === 'auto' ? 'Auto' : `Slot ${slot}`;

      if (info) {
        el.innerHTML = `
          <div class="slot-num">${slot === 'auto' ? '⟳' : slot}</div>
          <div class="slot-info">
            <div class="slot-name">${info.character} — ${info.race || ''} ${info.class || ''} Lv.${info.level}</div>
            <div class="slot-meta">📍 ${info.scene} · 🕐 ${info.savedAt}</div>
          </div>
          <div class="slot-actions"></div>`;
        const actions = el.querySelector('.slot-actions');

        if (this._mode === 'save') {
          const btn = document.createElement('button');
          btn.className = 'btn btn-primary btn-sm';
          btn.textContent = 'Overwrite';
          btn.onclick = (e) => { e.stopPropagation(); this.save(slot); };
          actions.appendChild(btn);
        } else {
          const btn = document.createElement('button');
          btn.className = 'btn btn-primary btn-sm';
          btn.textContent = 'Load';
          btn.onclick = (e) => { e.stopPropagation(); this.load(slot); };
          actions.appendChild(btn);
        }

        const del = document.createElement('button');
        del.className = 'btn btn-outline btn-sm';
        del.textContent = '✕';
        del.title = 'Delete save';
        del.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete ${label}?`)) this.deleteSave(slot);
        };
        actions.appendChild(del);

      } else {
        el.innerHTML = `
          <div class="slot-num">${slot === 'auto' ? '⟳' : slot}</div>
          <div class="slot-info">
            <div class="slot-name" style="color:var(--text-dim)">${label} — Empty</div>
          </div>`;
        if (this._mode === 'save') {
          const btn = document.createElement('button');
          btn.className = 'btn btn-primary btn-sm';
          btn.textContent = 'Save Here';
          btn.onclick = () => this.save(slot);
          el.style.opacity = '1';
          el.style.cursor = 'pointer';
          el.querySelector('.slot-info').after(btn);
          el.appendChild(btn);
        }
      }
      container.appendChild(el);
    });
  }

  // ── Settings Panel ───────────────────────────────────────────
  async renderManagementSlots() {
    const container = document.getElementById('settings-save-slots');
    if (!container) return;
    container.innerHTML = '<div class="sms-loading">Loading saves…</div>';

    const [saves, savesDir] = await Promise.all([
      window.electronAPI.listSaves(),
      window.electronAPI.getSavesDir(),
    ]);
    const slotMap = {};
    saves.forEach(s => { slotMap[s.slot] = s; });

    container.innerHTML = '';

    // ── Path bar ──────────────────────────────────────────────
    const pathBar = document.createElement('div');
    pathBar.className = 'sms-path-bar';
    pathBar.innerHTML = `
      <span class="sms-path-label">Save location:</span>
      <span class="sms-path-value" title="${savesDir}">${savesDir}</span>
      <button class="btn btn-outline btn-sm sms-open-folder" id="btn-open-saves-folder">Open Folder ↗</button>`;
    pathBar.querySelector('#btn-open-saves-folder').onclick = () => window.electronAPI.openSavesFolder();
    container.appendChild(pathBar);

    // ── Slot rows ─────────────────────────────────────────────
    const slots = ['1', '2', '3', 'auto'];
    slots.forEach(slot => {
      const info = slotMap[slot];
      const label = slot === 'auto' ? 'Auto-Save' : `Slot ${slot}`;
      const el = document.createElement('div');
      el.className = 'sms-row' + (info ? '' : ' sms-row-empty');

      if (info) {
        el.innerHTML = `
          <div class="sms-slot-badge">${slot === 'auto' ? '⟳' : slot}</div>
          <div class="sms-info">
            <div class="sms-name">${info.character} <span class="sms-class">— ${info.race || ''} ${info.class || ''} Lv.${info.level}</span></div>
            <div class="sms-meta">📍 ${info.scene} &nbsp;·&nbsp; 🕐 ${info.savedAt}</div>
          </div>
          <div class="sms-actions"></div>`;

        const actions = el.querySelector('.sms-actions');

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn btn-primary btn-sm';
        loadBtn.textContent = 'Load';
        loadBtn.title = `Load ${label}`;
        loadBtn.onclick = () => window.saveSystem.load(slot);
        actions.appendChild(loadBtn);

        const expBtn = document.createElement('button');
        expBtn.className = 'btn btn-outline btn-sm';
        expBtn.textContent = 'Export';
        expBtn.title = `Export ${label} as JSON`;
        expBtn.onclick = async () => {
          expBtn.disabled = true;
          expBtn.textContent = '…';
          try {
            const result = await window.electronAPI.exportSave(slot);
            if (result.success) window.app?.showToast(`Exported ${label}`, 'success');
          } catch (err) {
            window.app?.showToast('Export failed: ' + err.message, 'error');
          } finally {
            expBtn.disabled = false;
            expBtn.textContent = 'Export';
          }
        };
        actions.appendChild(expBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-outline btn-sm sms-del';
        delBtn.textContent = '✕';
        delBtn.title = `Delete ${label}`;
        delBtn.onclick = async () => {
          if (confirm(`Delete ${label}? This cannot be undone.`)) {
            await window.saveSystem.deleteSave(slot);
            this.renderManagementSlots();
          }
        };
        actions.appendChild(delBtn);
      } else {
        el.innerHTML = `
          <div class="sms-slot-badge sms-slot-empty">${slot === 'auto' ? '⟳' : slot}</div>
          <div class="sms-info">
            <div class="sms-name sms-empty-label">${label}</div>
            <div class="sms-meta">Empty</div>
          </div>`;
      }

      container.appendChild(el);
    });
  }

  init() {
    document.getElementById('close-modal-save').onclick = () => this.close();
    document.getElementById('tab-save-btn').onclick = () => this.setMode('save');
    document.getElementById('tab-load-btn').onclick = () => this.setMode('load');
    document.getElementById('btn-game-save').onclick = () => this.open();
  }
}

window.saveSystem = new SaveSystem();
