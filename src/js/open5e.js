/* ─────────────────────────────────────────────────────────────
   open5e.js — Live D&D 5e SRD data via api.open5e.com
   Docs: https://api.open5e.com/
───────────────────────────────────────────────────────────── */

class Open5eService {
  constructor() {
    this._cache     = new Map();
    this.BASE_V1    = 'https://api.open5e.com/v1';
    this.BASE_V2    = 'https://api.open5e.com/v2';
    this.conditions = null;   // Loaded once at init; Map<name.lower → condition>
    this._initPromise = null;
  }

  // ── Bootstrap — pre-load conditions ──────────────────────────
  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._preloadConditions();
    return this._initPromise;
  }

  async _preloadConditions() {
    try {
      const url = `${this.BASE_V2}/conditions/?limit=50`;
      const results = await this._fetchAll(url);
      this.conditions = new Map();
      results.forEach(c => {
        const desc = (c.descriptions || []).map(d => d.desc).join('\n\n');
        this.conditions.set(c.name.toLowerCase(), { name: c.name, desc });
      });
    } catch (e) {
      console.warn('[Open5e] Could not preload conditions:', e.message);
      this.conditions = new Map();
    }
  }

  // ── Cached Fetch ─────────────────────────────────────────────
  async _fetch(url) {
    if (this._cache.has(url)) return this._cache.get(url);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Open5e HTTP ${resp.status} — ${url}`);
    const data = await resp.json();
    this._cache.set(url, data);
    return data;
  }

  // Fetches up to maxPages pages and returns merged results[]
  async _fetchAll(urlOrBase, maxPages = 5) {
    let results = [];
    let next = urlOrBase;
    let page = 0;
    while (next && page < maxPages) {
      const data = await this._fetch(next);
      results = results.concat(data.results || []);
      next = data.next || null;
      page++;
    }
    return results;
  }

  // ── Spells by Class ───────────────────────────────────────────
  // className: lowercase class id ('wizard', 'bard', etc.)
  async getSpellsForClass(className) {
    // v1 spells have a dnd_class string like "Bard, Cleric, Druid"
    const url = `${this.BASE_V1}/spells/?document__slug=wotc-srd&dnd_class__icontains=${encodeURIComponent(className)}&limit=200`;
    return this._fetchAll(url, 5);
  }

  // Cantrips (level 0) + 1st-level spells only — used for level 1 characters
  async getLevel1SpellsForClass(className) {
    const base = `${this.BASE_V1}/spells/?document__slug=wotc-srd&dnd_class__icontains=${encodeURIComponent(className)}`;
    const [cantrips, level1] = await Promise.all([
      this._fetchAll(`${base}&level_int=0&limit=100`, 2),
      this._fetchAll(`${base}&level_int=1&limit=100`, 2),
    ]);
    return [...cantrips, ...level1];
  }

  // Single spell lookup by (partial) name — returns first match or null
  async searchSpell(name) {
    const url = `${this.BASE_V1}/spells/?document__slug=wotc-srd&name__icontains=${encodeURIComponent(name)}&limit=5`;
    const data = await this._fetch(url);
    return (data.results || [])[0] || null;
  }

  // ── Conditions ────────────────────────────────────────────────
  // Returns Map<name.lower → {name, desc}> — pre-loaded at init
  getConditionMap() {
    return this.conditions || new Map();
  }

  // Lookup a condition by name — returns {name, desc} or null
  getCondition(name) {
    if (!this.conditions) return null;
    return this.conditions.get(name.toLowerCase()) || null;
  }

  // ── Magic Items ───────────────────────────────────────────────  // Level 1-appropriate: Common rarity only (cantrip/1st-level scrolls, basic potions)
  async getLevel1Items() {
    const url = `${this.BASE_V1}/magicitems/?document__slug=wotc-srd&rarity__icontains=common&limit=100`;
    return this._fetchAll(url, 3);
  }
  async searchMagicItem(name) {
    const url = `${this.BASE_V1}/magicitems/?document__slug=wotc-srd&name__icontains=${encodeURIComponent(name)}&limit=5`;
    const data = await this._fetch(url);
    return (data.results || [])[0] || null;
  }

  // ── Rules Reference ───────────────────────────────────────────
  async searchRules(query) {
    if (!query || !query.trim()) {
      // Return popular top-level sections when no query
      const url = `${this.BASE_V1}/sections/?document__slug=wotc-srd&limit=20`;
      return this._fetchAll(url, 2);
    }
    const url = `${this.BASE_V1}/sections/?document__slug=wotc-srd&search=${encodeURIComponent(query.trim())}&limit=15`;
    return this._fetchAll(url, 2);
  }

  // ── Weapon / Armor Info ──────────────────────────────────────
  async searchWeapon(name) {
    const url = `${this.BASE_V2}/weapons/?document__slug=wotc-srd&name__icontains=${encodeURIComponent(name)}&limit=5`;
    const data = await this._fetch(url);
    return (data.results || [])[0] || null;
  }
}

window.open5e = new Open5eService();
