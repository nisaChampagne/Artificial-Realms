/* ─────────────────────────────────────────────────────────────
   achievements.js — Milestone unlock system
───────────────────────────────────────────────────────────── */
const ACHIEVEMENT_LIST = [
  { id: 'first_blood',  name: 'First Blood',    icon: '⚔',  desc: 'Defeat your first enemy in combat' },
  { id: 'boss_slayer',  name: 'Boss Slayer',     icon: '🐲', desc: 'Defeat a boss-level enemy' },
  { id: 'survivor',     name: 'Survivor',        icon: '💀', desc: 'Succeed on a Death Saving Throw' },
  { id: 'iron_will',    name: 'Iron Will',       icon: '❤',  desc: 'Survive with 3 HP or less' },
  { id: 'well_rested',  name: 'Well Rested',     icon: '🌙', desc: 'Take a Long Rest' },
  { id: 'inspired',     name: 'Inspired',        icon: '✨', desc: 'Spend Inspiration on a roll' },
  { id: 'rising_star',  name: 'Rising Star',     icon: '⭐', desc: 'Reach Level 2' },
  { id: 'champion',     name: 'Champion',        icon: '🏆', desc: 'Reach Level 5' },
  { id: 'lore_hunter',  name: 'Lore Hunter',     icon: '📜', desc: 'Discover 5 pieces of lore',     threshold: 5,  stat: 'lore_count' },
  { id: 'quest_master', name: 'Quest Master',    icon: '📋', desc: 'Complete 3 quests',             threshold: 3,  stat: 'quests_done' },
  { id: 'storyteller',  name: 'Storyteller',     icon: '📖', desc: 'Play through 50 narrative turns', threshold: 50, stat: 'turns' },
  { id: 'pack_rat',     name: 'Pack Rat',        icon: '🎒', desc: 'Carry 10 or more items at once' },
];

class AchievementSystem {
  constructor() {
    this._unlocked = new Set();
    this._stats    = {};
  }

  // ── Reset ────────────────────────────────────────────────────
  reset() {
    this._unlocked = new Set();
    this._stats    = {};
    this._persist();
  }

  // ── Load / Save ──────────────────────────────────────────────
  load(data) {
    if (!data) return;
    this._unlocked = new Set(data.unlocked || []);
    this._stats    = data.stats || {};
  }

  serialize() {
    return { unlocked: [...this._unlocked], stats: { ...this._stats } };
  }

  // ── Event tracking ───────────────────────────────────────────
  track(event, value) {
    switch (event) {
      case 'enemy_defeated':  this._try('first_blood'); break;
      case 'boss_defeated':   this._try('boss_slayer'); break;
      case 'death_save_success': this._try('survivor'); break;
      case 'low_hp':          this._try('iron_will'); break;
      case 'long_rest':       this._try('well_rested'); break;
      case 'inspiration_used': this._try('inspired'); break;
      case 'level_up':
        if (value >= 2) this._try('rising_star');
        if (value >= 5) this._try('champion');
        break;
      case 'lore_discovered':
        this._stats.lore_count = (this._stats.lore_count || 0) + 1;
        if (this._stats.lore_count >= 5) this._try('lore_hunter');
        break;
      case 'quest_completed':
        this._stats.quests_done = (this._stats.quests_done || 0) + 1;
        if (this._stats.quests_done >= 3) this._try('quest_master');
        break;
      case 'turn':
        this._stats.turns = (this._stats.turns || 0) + 1;
        if (this._stats.turns >= 50) this._try('storyteller');
        break;
      case 'inventory_count':
        if (value >= 10) this._try('pack_rat');
        break;
    }
    this._persist();
  }

  isUnlocked(id) { return this._unlocked.has(id); }

  // ── Internal ─────────────────────────────────────────────────
  _try(id) {
    if (this._unlocked.has(id)) return;
    const ach = ACHIEVEMENT_LIST.find(a => a.id === id);
    if (!ach) return;
    this._unlocked.add(id);
    window.app?.showToast(`🏅 Achievement unlocked: ${ach.name}`, 'success');
    // Refresh panel if open
    const panel = document.getElementById('journal-panel-achievements');
    if (panel && !panel.classList.contains('hidden')) this._render();
  }

  _persist() {
    if (!window.app || !window.electronAPI) return;
    const s = { ...window.app.settings, achievements: this.serialize() };
    window.electronAPI.saveSettings(s).catch(() => {});
  }

  // ── Render (journal achievements tab) ────────────────────────
  _render() {
    const el = document.getElementById('journal-achievements');
    if (!el) return;
    const unlockCount = this._unlocked.size;
    el.innerHTML = `<div class="ach-summary">${unlockCount} / ${ACHIEVEMENT_LIST.length} unlocked</div>` +
      ACHIEVEMENT_LIST.map(ach => {
        const done = this._unlocked.has(ach.id);
        let progress = '';
        if (!done && ach.threshold && ach.stat) {
          const cur = this._stats[ach.stat] || 0;
          progress = `<span class="ach-progress">${cur}/${ach.threshold}</span>`;
        }
        return `<div class="journal-card ach-card${done ? ' ach-unlocked' : ' ach-locked'}">
          <span class="ach-icon">${ach.icon}</span>
          <div class="ach-info">
            <div class="ach-name">${ach.name}</div>
            <div class="ach-desc">${ach.desc}${progress}</div>
          </div>
          ${done ? '<span class="ach-check">✓</span>' : ''}
        </div>`;
      }).join('');
  }

  open() { this._render(); }
}

window.achievementSystem = new AchievementSystem();
