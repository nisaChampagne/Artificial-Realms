/* ─────────────────────────────────────────────────────────────
   achievements.js — Milestone unlock system
───────────────────────────────────────────────────────────── */
const ACHIEVEMENT_CATEGORIES = [
  {
    id: 'combat',
    name: 'Combat',
    icon: '⚔️',
    achievements: [
      { id: 'first_blood',  name: 'First Blood',      icon: '⚔',  desc: 'Defeat your first enemy in combat' },
      { id: 'boss_slayer',  name: 'Boss Slayer',      icon: '🐲', desc: 'Defeat a boss-level enemy' },
      { id: 'crit_success', name: 'Critical Success', icon: '🎯', desc: 'Roll a natural 20 in combat' },
      { id: 'crit_fail',    name: 'Critical Failure', icon: '💔', desc: 'Roll a natural 1 in combat' },
      { id: 'lucky_streak', name: 'Lucky Streak',     icon: '🍀', desc: 'Roll 3 natural 20s',            threshold: 3,  stat: 'nat_20s' },
      { id: 'battle_scar',  name: 'Battle Scarred',   icon: '⚔️',  desc: 'Win 10 combat encounters',     threshold: 10, stat: 'combats_won' },
    ]
  },
  {
    id: 'survival',
    name: 'Survival',
    icon: '💀',
    achievements: [
      { id: 'survivor',     name: 'Survivor',          icon: '💀', desc: 'Succeed on a Death Saving Throw' },
      { id: 'iron_will',    name: 'Iron Will',         icon: '❤',  desc: 'Survive with 3 HP or less' },
      { id: 'near_death',   name: 'Near Death',        icon: '💀', desc: 'Survive with exactly 1 HP' },
      { id: 'tough_nails',  name: 'Tough as Nails',   icon: '🛡️',  desc: 'Reach 50 or more max HP' },
      { id: 'well_rested',  name: 'Well Rested',      icon: '🌙', desc: 'Take a Long Rest' },
    ]
  },
  {
    id: 'progression',
    name: 'Character Progression',
    icon: '⭐',
    achievements: [
      { id: 'rising_star',  name: 'Rising Star',      icon: '⭐', desc: 'Reach Level 2' },
      { id: 'champion',     name: 'Champion',         icon: '🏆', desc: 'Reach Level 5' },
      { id: 'hero',         name: 'Hero of Legend',   icon: '👑', desc: 'Reach Level 10' },
      { id: 'inspired',     name: 'Inspired',         icon: '✨', desc: 'Spend Inspiration on a roll' },
    ]
  },
  {
    id: 'wealth',
    name: 'Wealth & Commerce',
    icon: '💰',
    achievements: [
      { id: 'first_coin',   name: 'First Coin',       icon: '🪙', desc: 'Earn your first gold piece' },
      { id: 'merchant',     name: 'Merchant Prince',  icon: '💰', desc: 'Accumulate 100 gold pieces' },
      { id: 'big_spender',  name: 'Big Spender',      icon: '🛒', desc: 'Spend 50 gold at the market',   threshold: 50, stat: 'gold_spent' },
      { id: 'bargain_hunt', name: 'Bargain Hunter',   icon: '💸', desc: 'Sell 20 items at the market',   threshold: 20, stat: 'items_sold' },
    ]
  },
  {
    id: 'items',
    name: 'Inventory & Items',
    icon: '🎒',
    achievements: [
      { id: 'pack_rat',     name: 'Pack Rat',         icon: '🎒', desc: 'Carry 10 or more items at once' },
      { id: 'hoarder',      name: 'Hoarder',          icon: '📦', desc: 'Carry 25 or more items at once' },
      { id: 'fully_armed',  name: 'Fully Armed',      icon: '⚔️',  desc: 'Equip items in 5 different slots' },
      { id: 'potion_user',  name: 'Potion Addict',    icon: '🧪', desc: 'Use 10 consumables',            threshold: 10, stat: 'consumables_used' },
      { id: 'magic_item',   name: 'Enchanted',        icon: '🔮', desc: 'Obtain a magical item (uncommon or better)' },
    ]
  },
  {
    id: 'exploration',
    name: 'Exploration',
    icon: '🗺️',
    achievements: [
      { id: 'explorer',     name: 'Explorer',         icon: '🗺️',  desc: 'Visit 3 different locations',   threshold: 3,  stat: 'locations_visited' },
      { id: 'cartographer', name: 'Cartographer',     icon: '🧭', desc: 'Visit 10 different locations',  threshold: 10, stat: 'locations_visited' },
      { id: 'dungeon_delve',name: 'Dungeon Delver',   icon: '🏰', desc: 'Enter a dungeon or ruins' },
    ]
  },
  {
    id: 'narrative',
    name: 'Narrative & Quests',
    icon: '📖',
    achievements: [
      { id: 'lore_hunter',  name: 'Lore Hunter',      icon: '📜', desc: 'Discover 5 pieces of lore',     threshold: 5,  stat: 'lore_count' },
      { id: 'quest_master', name: 'Quest Master',     icon: '📋', desc: 'Complete 3 quests',             threshold: 3,  stat: 'quests_done' },
      { id: 'storyteller',  name: 'Storyteller',      icon: '📖', desc: 'Play through 50 narrative turns', threshold: 50, stat: 'turns' },
      { id: 'epic_tale',    name: 'Epic Tale',        icon: '📚', desc: 'Play through 100 narrative turns', threshold: 100, stat: 'turns' },
    ]
  }
];

// Flatten all achievements for easy iteration
const ACHIEVEMENT_LIST = ACHIEVEMENT_CATEGORIES.flatMap(cat => cat.achievements);

class AchievementSystem {
  constructor() {
    this._unlocked = new Set();
    this._stats    = {};
    this._initialSetup = false; // Track if we're in initial game setup
  }

  // ── Reset ────────────────────────────────────────────────────
  reset() {
    this._unlocked = new Set();
    this._stats    = {};
    this._initialSetup = true; // Mark that we're starting a new game
    this._persist();
  }

  // ── Load / Save ──────────────────────────────────────────────
  load(data) {
    if (!data) return;
    this._unlocked = new Set(data.unlocked || []);
    this._stats    = data.stats || {};
    this._initialSetup = false; // Loaded games are not in initial setup
    // Handle Set restoration for visited_locations
    if (this._stats.visited_locations && Array.isArray(this._stats.visited_locations)) {
      this._stats.visited_locations = new Set(this._stats.visited_locations);
    }
  }

  serialize() {
    const stats = { ...this._stats };
    // Convert Set to Array for JSON serialization
    if (stats.visited_locations instanceof Set) {
      stats.visited_locations = [...stats.visited_locations];
    }
    return { unlocked: [...this._unlocked], stats };
  }

  // ── Event tracking ───────────────────────────────────────────
  track(event, value) {
    switch (event) {
      case 'enemy_defeated':
        this._try('first_blood');
        this._stats.combats_won = (this._stats.combats_won || 0) + 1;
        if (this._stats.combats_won >= 10) this._try('battle_scar');
        break;
      case 'boss_defeated':   this._try('boss_slayer'); break;
      case 'death_save_success': this._try('survivor'); break;
      case 'low_hp':
        if (value === 1) this._try('near_death');
        if (value <= 3) this._try('iron_will');
        break;
      case 'long_rest':       this._try('well_rested'); break;
      case 'inspiration_used': this._try('inspired'); break;
      case 'nat_20':
        this._stats.nat_20s = (this._stats.nat_20s || 0) + 1;
        this._try('crit_success');
        if (this._stats.nat_20s >= 3) this._try('lucky_streak');
        break;
      case 'nat_1':
        this._try('crit_fail');
        break;
      case 'level_up':
        if (value >= 2) this._try('rising_star');
        if (value >= 5) this._try('champion');
        if (value >= 10) this._try('hero');
        break;
      case 'max_hp':
        if (value >= 50) this._try('tough_nails');
        break;
      case 'gold_earned':
        if (value > 0) this._try('first_coin');
        break;
      case 'gold_total':
        if (value >= 10000) this._try('merchant'); // 100 gp = 10000 cp
        break;
      case 'gold_spent':
        this._stats.gold_spent = (this._stats.gold_spent || 0) + value;
        if (this._stats.gold_spent >= 5000) this._try('big_spender'); // 50 gp
        break;
      case 'item_sold':
        this._stats.items_sold = (this._stats.items_sold || 0) + 1;
        if (this._stats.items_sold >= 20) this._try('bargain_hunt');
        break;
      case 'consumable_used':
        this._stats.consumables_used = (this._stats.consumables_used || 0) + 1;
        if (this._stats.consumables_used >= 10) this._try('potion_user');
        break;
      case 'magic_item_obtained':
        this._try('magic_item');
        break;
      case 'location_visited':
        // value = location name, track unique locations
        if (!this._stats.visited_locations) this._stats.visited_locations = new Set();
        else if (Array.isArray(this._stats.visited_locations)) {
          this._stats.visited_locations = new Set(this._stats.visited_locations);
        }
        this._stats.visited_locations.add(value);
        const count = this._stats.visited_locations.size;
        this._stats.locations_visited = count;
        if (count >= 3) this._try('explorer');
        if (count >= 10) this._try('cartographer');
        break;
      case 'dungeon_entered':
        this._try('dungeon_delve');
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
        if (this._stats.turns >= 100) this._try('epic_tale');
        // Clear initial setup flag after first turn
        if (this._initialSetup) this._initialSetup = false;
        break;
      case 'inventory_count':
        if (value >= 10) this._try('pack_rat');
        if (value >= 25) this._try('hoarder');
        break;
      case 'equipped_slots':
        if (value >= 5) this._try('fully_armed');
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
    
    let html = `<div class="ach-summary">${unlockCount} / ${ACHIEVEMENT_LIST.length} unlocked</div>`;
    
    // Render each category
    ACHIEVEMENT_CATEGORIES.forEach(category => {
      const categoryUnlocked = category.achievements.filter(ach => this._unlocked.has(ach.id)).length;
      const categoryTotal = category.achievements.length;
      
      html += `
        <div class="ach-category">
          <div class="ach-category-header">
            <span class="ach-category-icon">${category.icon}</span>
            <span class="ach-category-name">${category.name}</span>
            <span class="ach-category-count">${categoryUnlocked}/${categoryTotal}</span>
          </div>
          <div class="ach-category-items">`;
      
      category.achievements.forEach(ach => {
        const done = this._unlocked.has(ach.id);
        let progress = '';
        if (!done && ach.threshold && ach.stat) {
          const cur = this._stats[ach.stat] || 0;
          progress = `<span class="ach-progress">${cur}/${ach.threshold}</span>`;
        }
        html += `
          <div class="journal-card ach-card${done ? ' ach-unlocked' : ' ach-locked'}">
            <span class="ach-icon">${ach.icon}</span>
            <div class="ach-info">
              <div class="ach-name">${ach.name}</div>
              <div class="ach-desc">${ach.desc}${progress}</div>
            </div>
            ${done ? '<span class="ach-check">✓</span>' : ''}
          </div>`;
      });
      
      html += `
          </div>
        </div>`;
    });
    
    el.innerHTML = html;
  }

  open() { this._render(); }
}

window.achievementSystem = new AchievementSystem();
