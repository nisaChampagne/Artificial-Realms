/* ─────────────────────────────────────────────────────────────
   journal.js — Campaign Memory & Journal System
───────────────────────────────────────────────────────────── */
class JournalSystem {
  constructor() {
    this.npcs      = {};  // { name: { role, attitude, mentions } }
    this.lore      = [];  // [{ text, turn }]
    this.decisions = [];  // [{ text, turn }]
    this._turn     = 0;
  }

  reset() {
    this.npcs      = {};
    this.lore      = [];
    this.decisions = [];
    this._turn     = 0;
  }

  incTurn() { this._turn++; }

  addNPC(name, role, attitude) {
    if (!name) return;
    const key = name.trim();
    if (this.npcs[key]) {
      this.npcs[key].mentions++;
      if (role)     this.npcs[key].role     = role.trim();
      if (attitude) this.npcs[key].attitude = attitude.trim();
    } else {
      this.npcs[key] = { role: (role || 'Unknown').trim(), attitude: (attitude || 'Neutral').trim(), mentions: 1 };
    }
  }

  addLore(text) {
    if (!text) return;
    const t = text.trim();
    if (this.lore.some(l => l.text === t)) return;
    this.lore.push({ text: t, turn: this._turn });
  }

  addDecision(text) {
    if (!text) return;
    this.decisions.push({ text: text.trim(), turn: this._turn });
  }

  // Compact memory block injected into the AI context window
  buildMemoryBlock() {
    const parts = [];
    const npcEntries = Object.entries(this.npcs);
    if (npcEntries.length > 0) {
      const lines = npcEntries.map(([n, d]) => `• ${n} — ${d.role}, attitude: ${d.attitude}`).join('\n');
      parts.push(`NPCs encountered:\n${lines}`);
    }
    if (this.lore.length > 0) {
      const lines = this.lore.slice(-10).map(l => `• ${l.text}`).join('\n');
      parts.push(`Key lore discovered:\n${lines}`);
    }
    if (this.decisions.length > 0) {
      const lines = this.decisions.slice(-6).map(d => `• ${d.text}`).join('\n');
      parts.push(`Key player decisions:\n${lines}`);
    }
    if (parts.length === 0) return null;
    return '═══ CAMPAIGN MEMORY ═══\n' + parts.join('\n\n');
  }

  // ── Modal ────────────────────────────────────────────────────
  open() {
    this._render();
    document.getElementById('modal-journal').classList.remove('hidden');
  }

  close() {
    document.getElementById('modal-journal').classList.add('hidden');
  }

  _render() {
    const npcKeys = Object.keys(this.npcs);

    // NPCs tab
    const npcEl = document.getElementById('journal-npcs');
    npcEl.innerHTML = npcKeys.length === 0
      ? '<div class="journal-empty">No NPCs encountered yet.</div>'
      : npcKeys.map(name => {
          const d = this.npcs[name];
          const attClass = 'jatt-' + (d.attitude || 'neutral').toLowerCase().replace(/\s+/g, '');
          return `<div class="journal-card">
            <div class="jcard-top">
              <span class="jcard-name">${name}</span>
              <span class="jcard-attitude ${attClass}">${d.attitude}</span>
            </div>
            <div class="jcard-role">${d.role}</div>
          </div>`;
        }).join('');

    // Lore tab
    const loreEl = document.getElementById('journal-lore');
    loreEl.innerHTML = this.lore.length === 0
      ? '<div class="journal-empty">No lore discovered yet.</div>'
      : this.lore.map(l => `<div class="journal-card"><span class="jcard-icon">📜</span> ${l.text}</div>`).join('');

    // Decisions tab
    const decEl = document.getElementById('journal-decisions');
    decEl.innerHTML = this.decisions.length === 0
      ? '<div class="journal-empty">No key decisions recorded yet.</div>'
      : this.decisions.map(d => `<div class="journal-card"><span class="jcard-icon">⚔</span> ${d.text}</div>`).join('');
  }

  // ── Serialization ────────────────────────────────────────────
  serialize() {
    return { npcs: this.npcs, lore: this.lore, decisions: this.decisions, turn: this._turn };
  }

  restore(data) {
    if (!data) return;
    this.npcs      = data.npcs      || {};
    this.lore      = data.lore      || [];
    this.decisions = data.decisions || [];
    this._turn     = data.turn      || 0;
  }
}

window.journalSystem = new JournalSystem();
