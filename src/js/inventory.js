/* ─────────────────────────────────────────────────────────────
   inventory.js — Player Inventory System
───────────────────────────────────────────────────────────── */

// Wearable slot definitions
const EQUIP_SLOTS = ['weapon','armor','shield','head','cloak','feet','hands','ring','amulet'];

const SLOT_ICONS = {
  weapon:'⚔', armor:'🛡', shield:'🛡', head:'🪖',
  cloak:'🧥', feet:'👢', hands:'🧤', ring:'💍', amulet:'📿',
};

const TYPE_ICONS = {
  Weapon:'⚔', Armor:'🛡', Shield:'🛡', Head:'🪖', Cloak:'🧥',
  Feet:'👢', Hands:'🧤', Ring:'💍', Amulet:'📿',
  Consumable:'🧪', Scroll:'📜', Wondrous:'✨',
  Map:'🗺', Key:'🗝', Gem:'💎', Document:'📄', Curiosity:'🪨', Misc:'📦',
};

// Types that stack when added with the same name
const STACKABLE_TYPES = new Set(['Consumable', 'Scroll']);

class InventorySystem {
  constructor() {
    this.items    = [];   // [{ id, name, type, slot, rarity, desc, reqAtune, equipped, qty }]
    this._uid     = 1;
    this.currency = 0;   // total in copper pieces (1 gp = 100 cp, 1 sp = 10 cp)
    this._shopStock = null; // Track shop inventory
    this._marketSortBy = 'default'; // 'default', 'price-asc', 'price-desc'
  }

  reset() {
    this.items    = [];
    this._uid     = 1;
    this.currency = 0;
    this._shopStock = null;
    this._marketSortBy = 'default';
    this._updateBadge();
    this._renderCurrency();
  }

  // ── Item Classification ─────────────────────────────────────
  _classify(name) {
    const n = name.toLowerCase();
    if (/\b(sword|blade|axe|spear|mace|bow|dagger|staff|wand|club|hammer|rapier|scimitar|flail|lance|pike|halberd|glaive|whip|sling|crossbow|morningstar|trident|shortsword|longsword|greatsword|greataxe|handaxe)\b/.test(n))
      return { type: 'Weapon', slot: 'weapon' };
    if (/\b(armor|armour|mail|plate|breastplate|chain|leather|scale|studded|half.?plate|full.?plate)\b/.test(n))
      return { type: 'Armor', slot: 'armor' };
    if (/\bshield\b/.test(n))
      return { type: 'Shield', slot: 'shield' };
    if (/\b(helmet|helm|crown|hood|circlet|hat|cap)\b/.test(n))
      return { type: 'Head', slot: 'head' };
    if (/\b(cloak|mantle|cape|robe)\b/.test(n))
      return { type: 'Cloak', slot: 'cloak' };
    if (/\b(boots|greaves|shoes|sandals|slippers)\b/.test(n))
      return { type: 'Feet', slot: 'feet' };
    if (/\b(gloves|gauntlets|bracers|bracer|mitts)\b/.test(n))
      return { type: 'Hands', slot: 'hands' };
    if (/\bring\b/.test(n))
      return { type: 'Ring', slot: 'ring' };
    if (/\b(amulet|necklace|pendant|talisman|locket)\b/.test(n))
      return { type: 'Amulet', slot: 'amulet' };
    if (/\b(potion|elixir|vial|flask|draught|brew)\b/.test(n))
      return { type: 'Consumable', slot: null };
    if (/\bscroll\b/.test(n))
      return { type: 'Scroll', slot: null };
    if (/\b(map|chart|blueprint|schematic)\b/.test(n))
      return { type: 'Map', slot: null };
    if (/\b(key|keystone|passkey|skeleton key)\b/.test(n))
      return { type: 'Key', slot: null };
    if (/\b(gem|gemstone|diamond|ruby|sapphire|emerald|opal|pearl|amethyst|topaz|crystal|jewel|shard|orb)\b/.test(n))
      return { type: 'Gem', slot: null };
    if (/\b(letter|note|parchment|document|tome|book|journal|diary|report|contract|seal|cipher|codex|manifest|missive)\b/.test(n))
      return { type: 'Document', slot: null };
    if (/\b(stone|rock|fragment|rune|totem|idol|fetish|tooth|bone|feather|claw|eye|venom|dust|ash|powder|coin|insignia|badge|token|medallion|signet|shard|splinter|chip|cube|prism|sphere|artifact|relic|curiosity|trinket|charm|effigy)\b/.test(n))
      return { type: 'Curiosity', slot: null };
    return { type: 'Wondrous', slot: null };
  }

  // ── Add Item ────────────────────────────────────────────────
  addItem(name, open5eData = null) {
    if (!name) return;
    const { type, slot } = this._classify(name);

    // Stackable types: increment qty on duplicate name
    if (STACKABLE_TYPES.has(type)) {
      const existing = this.items.find(i => i.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
        this._updateBadge();
        return;
      }
    } else {
      // Non-stackable: skip true duplicates
      if (this.items.some(i => i.name.toLowerCase() === name.toLowerCase())) return;
    }

    const item = {
      id:        this._uid++,
      name:      name.trim(),
      type,
      slot,
      qty:       1,
      rarity:    open5eData?.rarity || '',
      desc:      open5eData?.desc   || '',
      reqAtune:  !!(open5eData?.requires_attunement || '').includes('requires'),
      equipped:  false,
    };
    this.items.push(item);
    this._updateBadge();
  }

  // ── Drop Item ───────────────────────────────────────────────
  dropItem(id) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return;
    const item = this.items[idx];
    // Unequip first so AC recalculates
    if (item.equipped) { item.equipped = false; this._applyEquipEffects(); }
    this.items.splice(idx, 1);
    this._updateBadge();
    this._render();
    // Close inspect modal if open and was showing this item
    const itemModal = document.getElementById('modal-item');
    if (itemModal && !itemModal.classList.contains('hidden')) {
      itemModal.classList.add('hidden');
    }
    const charName = window.characterSystem?.character?.name || 'You';
    window.aiSystem?._addSystemEntry(`🗑 ${charName} dropped <strong>${item.name}</strong>.`);
  }

  // ── Use Consumable ──────────────────────────────────────────
  useConsumable(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    const hp = this._rollConsumableHeal(item.name);
    const charName = window.characterSystem?.character?.name || 'You';

    if (hp > 0) {
      window.characterSystem?.applyHPChange(hp);
      window.aiSystem?._addSystemEntry(`🧪 ${charName} uses <strong>${item.name}</strong> and restores <strong>${hp} HP</strong>!`);
    } else {
      window.aiSystem?._addSystemEntry(`🧪 ${charName} uses <strong>${item.name}</strong>.`);
    }

    // Decrement qty; remove if spent
    item.qty = (item.qty || 1) - 1;
    if (item.qty <= 0) {
      this.items.splice(this.items.indexOf(item), 1);
    }
    this._updateBadge();
    this._render();
    document.getElementById('modal-item')?.classList.add('hidden');
  }

  _rollConsumableHeal(name) {
    const n = name.toLowerCase();
    const roll = (num, die, bonus = 0) => {
      let total = bonus;
      for (let i = 0; i < num; i++) total += Math.floor(Math.random() * die) + 1;
      return total;
    };
    if (/supreme/.test(n))  return roll(10, 4, 20);
    if (/superior/.test(n)) return roll(8, 4, 8);
    if (/greater/.test(n))  return roll(4, 4, 4);
    if (/potion of healing|healing potion/.test(n)) return roll(2, 4, 2);
    if (/potion|elixir|draught/.test(n))            return roll(1, 4, 1);
    return 0; // potions with no healing (e.g. Potion of Speed)
  }

  // ── Currency ─────────────────────────────────────────────────
  addGold(amount)   { this.currency = Math.max(0, this.currency + Math.round(amount * 100));  this._renderCurrency(); }
  addSilver(amount) { this.currency = Math.max(0, this.currency + Math.round(amount * 10));   this._renderCurrency(); }
  addCopper(amount)  { this.currency = Math.max(0, this.currency + Math.round(amount));        this._renderCurrency(); }

  _renderCurrency() {
    const total = Math.max(0, Math.round(this.currency));
    const gp    = Math.floor(total / 100);
    const sp    = Math.floor((total % 100) / 10);
    const cp    = total % 10;
    const gEl = document.getElementById('inv-gold-amount');
    const sEl = document.getElementById('inv-silver-amount');
    const bEl = document.getElementById('inv-copper-amount');
    if (gEl) gEl.textContent = gp.toLocaleString();
    if (sEl) sEl.textContent = sp;
    if (bEl) bEl.textContent = cp;
    // Show/hide market button based on current scene
    const scene     = window.mapSystem?.currentScene || '';
    const marketBtn = document.getElementById('btn-open-market');
    if (marketBtn) marketBtn.classList.toggle('hidden', !['town', 'tavern'].includes(scene));
  }

  _formatCurrency(copper) {
    const gp = Math.floor(copper / 100);
    const sp = Math.floor((copper % 100) / 10);
    const cp = copper % 10;
    const parts = [];
    if (gp) parts.push(`${gp} gp`);
    if (sp) parts.push(`${sp} sp`);
    if (cp) parts.push(`${cp} cp`);
    return parts.length ? parts.join(' ') : '0 cp';
  }

  // ── Equip / Unequip ─────────────────────────────────────────
  toggleEquip(id) {
    const item = this.items.find(i => i.id === id);
    if (!item || !item.slot) return;
    if (!item.equipped) {
      this.items.forEach(i => { if (i.slot === item.slot && i.id !== id) i.equipped = false; });
      item.equipped = true;
    } else {
      item.equipped = false;
    }
    this._applyEquipEffects();
    this._render();
  }

  // Recalculate AC from equipped armor / shield
  _applyEquipEffects() {
    const c = window.characterSystem?.character;
    if (!c) return;
    const dexMod = Math.floor((c.stats.dex - 10) / 2);
    let ac = 10 + dexMod;
    this.items.forEach(item => {
      if (!item.equipped) return;
      const acMatch = item.desc.match(/\barmor class\s+(?:of\s+)?(\d+)|\bAC\s+(\d+)/i);
      if (item.slot === 'armor') {
        ac = acMatch ? (parseInt(acMatch[1] || acMatch[2]) + dexMod) : ac;
      }
      if (item.slot === 'shield') ac += 2;
    });
    c.ac = ac;
    const acEl = document.getElementById('s-ac');
    if (acEl) acEl.textContent = ac;
  }

  // ── Badge ───────────────────────────────────────────────────
  _updateBadge() {
    const badge = document.getElementById('inventory-badge');
    if (!badge) return;
    const total = this.items.reduce((s, i) => s + (i.qty || 1), 0);
    badge.textContent = total;
    badge.classList.toggle('hidden', total === 0);
  }

  // ── Modal ───────────────────────────────────────────────────
  open() {
    this._render();
    this._renderCurrency();
    document.getElementById('modal-inventory').classList.remove('hidden');
  }

  close() {
    document.getElementById('modal-inventory').classList.add('hidden');
  }

  init() {
    document.getElementById('close-modal-market')?.addEventListener('click', () => {
      document.getElementById('modal-market').classList.add('hidden');
    });
    document.getElementById('btn-open-market')?.addEventListener('click', () => {
      this.close();
      this.openMarket();
    });
    document.getElementById('market-sell-all')?.addEventListener('click', () => this.sellAll());
  }

  // ── Render Item List ────────────────────────────────────────
  _render() {
    const container = document.getElementById('inventory-items');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '<div class="inventory-empty">Your pack is empty. Find items on your adventure.</div>';
      return;
    }

    // Group: equipped first, then by type
    const sorted = [...this.items].sort((a, b) => {
      if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
      return a.type.localeCompare(b.type);
    });

    const renderItemHtml = item => {
      const rarityClass   = (item.rarity || 'common').toLowerCase().replace(/\s+/g, '-');
      const equippedClass = item.equipped ? 'inv-item-equipped' : '';
      const icon = TYPE_ICONS[item.type] || '📦';
      const isConsumable = item.type === 'Consumable' || item.type === 'Scroll';
      const actionBtn = item.slot
        ? `<button class="inv-btn inv-btn-equip" data-id="${item.id}">${item.equipped ? 'Unequip' : 'Equip'}</button>`
        : isConsumable
          ? `<button class="inv-btn inv-btn-use" data-id="${item.id}">Use</button>`
          : '';
      const dropBtn     = `<button class="inv-btn inv-btn-drop" data-id="${item.id}" title="Drop item">🗑</button>`;
      const equippedTag = item.equipped ? '<span class="inv-equipped-tag">Equipped</span>' : '';
      const qtyTag      = (item.qty || 1) > 1 ? `<span class="inv-qty-tag">×${item.qty}</span>` : '';
      const rarityTag   = item.rarity
        ? `<span class="inv-rarity inv-rarity-${rarityClass}">${item.rarity}</span>`
        : `<span class="inv-rarity">${item.type}</span>`;
      return `
        <div class="inv-item ${equippedClass}" data-id="${item.id}">
          <div class="inv-item-icon">${icon}</div>
          <div class="inv-item-info">
            <div class="inv-item-name">${item.name}${qtyTag}</div>
            <div class="inv-item-tags">${rarityTag}${equippedTag}</div>
          </div>
          <div class="inv-item-actions">
            <button class="inv-btn inv-btn-inspect" data-id="${item.id}">Inspect</button>
            ${actionBtn}
            ${dropBtn}
          </div>
        </div>`;
    };

    const equippedItems = sorted.filter(i => i.equipped);
    const packItems     = sorted.filter(i => !i.equipped);
    let html = '';
    if (equippedItems.length) {
      html += `<div class="inv-section-head">⚔ Equipped</div>`;
      html += equippedItems.map(renderItemHtml).join('');
    }
    if (packItems.length) {
      html += `<div class="inv-section-head">🎒 Pack</div>`;
      html += packItems.map(renderItemHtml).join('');
    }
    container.innerHTML = html;

    container.querySelectorAll('.inv-btn-inspect').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); this._inspect(parseInt(btn.dataset.id)); }));
    container.querySelectorAll('.inv-btn-equip').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); this.toggleEquip(parseInt(btn.dataset.id)); }));
    container.querySelectorAll('.inv-btn-use').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); this.useConsumable(parseInt(btn.dataset.id)); }));
    container.querySelectorAll('.inv-btn-drop').forEach(btn =>
      btn.addEventListener('click', e => { e.stopPropagation(); this.dropItem(parseInt(btn.dataset.id)); }));
  }

  // ── Inspect (reuses modal-item) ─────────────────────────────
  _inspect(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('modal-item').classList.remove('hidden');
    this._renderInspect(item);

    // If no description stored yet, fetch live and update (once per item)
    if (!item.desc && !item._descFetched) {
      item._descFetched = true;
      document.getElementById('item-body').querySelector('.spell-card-desc')
        .innerHTML = '<em style="color:var(--text-dim)">Looking up item details…</em>';
      window.open5e?.enrichItem(item.name).then(result => {
        const stillOpen = document.getElementById('item-title').textContent === item.name;
        if (!result) {
          if (stillOpen) {
            const el = document.getElementById('item-body')?.querySelector('.spell-card-desc');
            if (el) el.innerHTML = '<em style="color:var(--text-dim)">No description found. The item is yours to interpret.</em>';
          }
          return;
        }
        const { data } = result;
        item.rarity   = item.rarity   || data.rarity   || '';
        item.desc     = data.desc     || '';
        item.reqAtune = item.reqAtune || !!(data.requires_attunement || '').toString().includes('requires');
        if (stillOpen) this._renderInspect(item);
      }).catch(() => {
        item._descFetched = false; // allow retry on next inspect after network error
        const el = document.getElementById('item-body')?.querySelector('.spell-card-desc');
        if (el) el.innerHTML = '<em style="color:var(--text-dim)">No description found. The item is yours to interpret.</em>';
      });
    }
  }

  _renderInspect(item) {
    const id = item.id;
    document.getElementById('item-title').textContent = item.name;

    const rarityTag  = item.rarity   ? `<span class="spell-card-tag">${item.rarity}</span>` : '';
    const typeTag    = item.type     ? `<span class="spell-card-tag">${item.type}</span>` : '';
    const atuneTag   = item.reqAtune ? `<span class="spell-card-tag warn">Attunement</span>` : '';
    const slotTag    = item.slot     ? `<span class="spell-card-tag">Slot: ${item.slot}</span>` : '';
    const desc       = item.desc
      ? item.desc.replace(/\n/g, '<br>')
      : '<em style="color:var(--text-dim)">No description available. The item is yours to interpret.</em>';

    const isConsumable = item.type === 'Consumable' || item.type === 'Scroll';
    const primaryBtn = item.slot
      ? `<button class="btn btn-outline btn-sm" id="inspect-equip-btn">${item.equipped ? '✕ Unequip' : '⚔ Equip'}</button>`
      : isConsumable
        ? `<button class="btn btn-primary btn-sm" id="inspect-use-btn">🧪 Use</button>`
        : '';
    const dropBtn = `<button class="btn btn-outline btn-sm" id="inspect-drop-btn" style="border-color:#8b3a3a;color:#c97a7a;">🗑 Drop</button>`;

    document.getElementById('item-body').innerHTML = `
      <div class="spell-card-meta">${rarityTag}${typeTag}${slotTag}${atuneTag}</div>
      <div class="spell-card-desc">${desc}</div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
        ${primaryBtn}
        ${dropBtn}
      </div>`;

    document.getElementById('inspect-equip-btn')?.addEventListener('click', () => {
      this.toggleEquip(id);
      const updated = this.items.find(i => i.id === id);
      if (updated) document.getElementById('inspect-equip-btn').textContent = updated.equipped ? '✕ Unequip' : '⚔ Equip';
    });
    document.getElementById('inspect-use-btn')?.addEventListener('click', () => this.useConsumable(id));
    document.getElementById('inspect-drop-btn')?.addEventListener('click', () => this.dropItem(id));
  }

  // ── Market ──────────────────────────────────────────────────
  _itemValue(item) {
    // Base sell price in copper (50% of typical market value)
    const base = {
      'common':    100,    // 1 gp base  → sell 50 cp
      'uncommon':  1000,   // 10 gp base → sell 5 gp
      'rare':      5000,   // 50 gp base → sell 25 gp
      'very rare': 20000,  // 200 gp     → sell 100 gp
      'legendary': 100000, // 1000 gp    → sell 500 gp
      'artifact':  0,      // priceless — not sellable
    }[(item.rarity || '').toLowerCase()] ?? 50; // default ~5 sp
    return Math.floor(base / 2);
  }

  // Shop catalog with items for purchase (prices in copper pieces)
  _shopCatalog() {
    return [
      // Consumables
      { name: 'Potion of Healing', type: 'Consumable', price: 500, stock: 5, desc: 'Restores 2d4+2 hit points when consumed.' },
      { name: 'Potion of Greater Healing', type: 'Consumable', price: 2000, stock: 2, desc: 'Restores 4d4+4 hit points when consumed.' },
      { name: 'Antitoxin', type: 'Consumable', price: 300, stock: 3, desc: 'Grants advantage on saving throws against poison for 1 hour.' },
      { name: 'Holy Water', type: 'Consumable', price: 250, stock: 4, desc: 'As an action, you can splash this on a creature. Deals 2d6 radiant damage to fiends and undead.' },
      // Tools & Gear
      { name: "Healer's Kit", type: 'Misc', price: 50, stock: 3, desc: 'Contains bandages, salves, and splints. Has 10 uses for stabilizing dying creatures.' },
      { name: "Thieves' Tools", type: 'Misc', price: 500, stock: 2, desc: 'Essential for picking locks and disarming traps. Proficiency required for best results.' },
      { name: 'Rope (50 feet)', type: 'Misc', price: 10, stock: 8, desc: 'Hemp rope that can support up to 600 lbs. Essential for climbing and securing.' },
      { name: 'Torches (10)', type: 'Misc', price: 5, stock: 12, desc: 'Each torch burns for 1 hour, providing bright light in a 20-foot radius.' },
      { name: 'Rations (7 days)', type: 'Misc', price: 35, stock: 10, desc: 'Dried meats, hardtack, and preserved food for one week of travel.' },
      { name: 'Bedroll', type: 'Misc', price: 10, stock: 6, desc: 'A warm sleeping roll for comfortable rest during long journeys.' },
      // Weapons (common)
      { name: 'Dagger', type: 'Weapon', price: 20, stock: 8, desc: 'Simple melee weapon. 1d4 piercing damage. Finesse, light, thrown (20/60).' },
      { name: 'Shortsword', type: 'Weapon', price: 100, stock: 4, desc: 'Martial melee weapon. 1d6 piercing damage. Finesse, light.' },
      { name: 'Longsword', type: 'Weapon', price: 150, stock: 3, desc: 'Martial melee weapon. 1d8 slashing damage (1d10 two-handed). Versatile.' },
      { name: 'Shortbow', type: 'Weapon', price: 250, stock: 3, desc: 'Simple ranged weapon. 1d6 piercing damage. Ammunition (80/320), two-handed.' },
      { name: 'Longbow', type: 'Weapon', price: 500, stock: 2, desc: 'Martial ranged weapon. 1d8 piercing damage. Ammunition (150/600), heavy, two-handed.' },
      { name: 'Arrows (20)', type: 'Consumable', price: 10, stock: 15, desc: 'Standard arrows for bows. Required for ranged attacks.' },
      // Armor
      { name: 'Leather Armor', type: 'Armor', price: 100, stock: 4, desc: 'Light armor. AC 11 + Dex modifier. Worn by rogues and rangers.' },
      { name: 'Chain Shirt', type: 'Armor', price: 500, stock: 2, desc: 'Medium armor. AC 13 + Dex modifier (max 2). Discreet under clothing.' },
      { name: 'Shield', type: 'Shield', price: 100, stock: 5, desc: 'Wooden or metal shield. +2 bonus to AC while wielded.' },
      // Spell scrolls
      { name: 'Scroll of Identify', type: 'Scroll', price: 300, stock: 2, desc: 'Reveals magical properties of one item or creature when read.' },
      { name: 'Scroll of Cure Wounds', type: 'Scroll', price: 300, stock: 3, desc: 'Heals 1d8 + spellcasting modifier hit points when cast.' },
      // Curiosities & useful items
      { name: 'Spyglass', type: 'Wondrous', price: 10000, stock: 1, desc: 'Objects viewed through a spyglass are magnified to twice their size.' },
      { name: 'Lantern (Hooded)', type: 'Misc', price: 50, stock: 6, desc: 'Casts bright light in a 30-foot radius. Burns oil for 6 hours.' },
      { name: 'Flask of Oil', type: 'Consumable', price: 1, stock: 20, desc: 'Burns for 6 hours in a lantern. Can be thrown and ignited (1d6 fire damage).' },
      { name: 'Crowbar', type: 'Misc', price: 20, stock: 4, desc: 'Grants advantage on Strength checks where leverage can be applied.' },
      { name: 'Grappling Hook', type: 'Misc', price: 20, stock: 5, desc: 'Secures rope for climbing. Can be thrown up to 50 feet with a check.' },
      { name: 'Tinderbox', type: 'Misc', price: 5, stock: 8, desc: 'Flint, steel, and tinder for lighting fires and torches.' },
    ];
  }

  openMarket() {
    // Initialize shop stock on first visit
    if (!this._shopStock) {
      this._shopStock = this._shopCatalog().map(item => ({ ...item }));
    }
    this._marketTab = this._marketTab || 'buy';
    this._renderMarket();
    document.getElementById('modal-market').classList.remove('hidden');
  }

  _renderMarket() {
    const wallet   = document.getElementById('market-wallet');
    const list     = document.getElementById('market-items');
    const sellAll  = document.getElementById('market-sell-all');

    // Render currency
    if (wallet) {
      const total = Math.max(0, Math.round(this.currency));
      const gp = Math.floor(total / 100);
      const sp = Math.floor((total % 100) / 10);
      const cp = total % 10;
      wallet.innerHTML =
        `<span class="market-purse-label">Your Purse</span>` +
        `<span class="market-purse-coins"><span class="market-coin market-coin-gp">🪙 ${gp.toLocaleString()} gp</span>` +
        `<span class="market-coin market-coin-sp">🥈 ${sp} sp</span>` +
        `<span class="market-coin market-coin-cp">🟤 ${cp} cp</span></span>`;
    }

    // Render tabs and sort controls
    const subtitle = document.querySelector('.market-subtitle');
    if (subtitle) {
      subtitle.innerHTML = `
        <div class="market-tabs">
          <button class="market-tab ${this._marketTab === 'buy' ? 'active' : ''}" data-tab="buy">🛒 Buy</button>
          <button class="market-tab ${this._marketTab === 'sell' ? 'active' : ''}" data-tab="sell">💰 Sell</button>
        </div>
        <div class="market-sort">
          <span class="market-sort-label">Sort:</span>
          <button class="market-sort-btn ${this._marketSortBy === 'default' ? 'active' : ''}" data-sort="default">Default</button>
          <button class="market-sort-btn ${this._marketSortBy === 'price-asc' ? 'active' : ''}" data-sort="price-asc">Price ↑</button>
          <button class="market-sort-btn ${this._marketSortBy === 'price-desc' ? 'active' : ''}" data-sort="price-desc">Price ↓</button>
        </div>`;
      subtitle.querySelectorAll('.market-tab').forEach(btn =>
        btn.addEventListener('click', () => {
          this._marketTab = btn.dataset.tab;
          this._renderMarket();
        }));
      subtitle.querySelectorAll('.market-sort-btn').forEach(btn =>
        btn.addEventListener('click', () => {
          this._marketSortBy = btn.dataset.sort;
          this._renderMarket();
        }));
    }

    if (this._marketTab === 'buy') {
      // BUY TAB
      if (sellAll) sellAll.style.display = 'none';
      let catalog = this._shopStock || this._shopCatalog();
      
      // Apply sorting
      catalog = this._sortMarketItems([...catalog], 'price');

      list.innerHTML = catalog.map((item, idx) => {
        // Need to find original index for buying
        const origIdx = (this._shopStock || this._shopCatalog()).findIndex(orig => 
          orig.name === item.name && orig.type === item.type);
        const icon = TYPE_ICONS[item.type] || '📦';
        const priceStr = this._formatCurrency(item.price);
        const canAfford = this.currency >= item.price;
        const inStock = (item.stock || 0) > 0;
        const stockLabel = item.stock ? ` (${item.stock} in stock)` : ' (Out of stock)';
        return `
          <div class="market-item" data-idx="${origIdx}">
            <span class="market-item-icon">${icon}</span>
            <div class="market-item-info">
              <span class="market-item-name">${item.name}<span class="market-stock">${stockLabel}</span></span>
              <span class="market-item-desc">${item.desc}</span>
            </div>
            <div class="market-item-price">${priceStr}</div>
            <button class="inv-btn inv-btn-buy ${canAfford && inStock ? '' : 'inv-btn-disabled'}" data-idx="${origIdx}" ${canAfford && inStock ? '' : 'disabled'}>Buy</button>
          </div>`;
      }).join('');

      list.querySelectorAll('.inv-btn-buy').forEach(btn =>
        btn.addEventListener('click', () => this.buyItem(parseInt(btn.dataset.idx))));

    } else {
      // SELL TAB
      let sellable = this.items.filter(i => !i.equipped && this._itemValue(i) > 0);

      if (!sellable.length) {
        list.innerHTML = `<div class="market-empty">Nothing in your pack to sell.</div>`;
        if (sellAll) { sellAll.disabled = true; sellAll.style.display = ''; }
        return;
      }
      if (sellAll) { sellAll.disabled = false; sellAll.style.display = ''; }

      // Apply sorting
      sellable = this._sortMarketItems(sellable, 'value');

      list.innerHTML = sellable.map(item => {
        const icon       = TYPE_ICONS[item.type] || '📦';
        const price      = this._itemValue(item);
        const priceStr   = this._formatCurrency(price);
        const totalPrice = this._formatCurrency(price * (item.qty || 1));
        const rarityClass = (item.rarity || 'common').toLowerCase().replace(/\s+/g, '-');
        const qtyStr = (item.qty || 1) > 1 ? ` ×${item.qty}` : '';
        return `
          <div class="market-item" data-id="${item.id}">
            <span class="market-item-icon">${icon}</span>
            <div class="market-item-info">
              <span class="market-item-name">${item.name}${qtyStr}</span>
              <span class="inv-rarity inv-rarity-${rarityClass}">${item.rarity || item.type}</span>
            </div>
            <div class="market-item-price">${(item.qty||1)>1?totalPrice:priceStr}<span class="market-each">${(item.qty||1)>1?` (${priceStr} ea.)`:''}</span></div>
            <button class="inv-btn inv-btn-sell" data-id="${item.id}">Sell</button>
          </div>`;
      }).join('');

      list.querySelectorAll('.inv-btn-sell').forEach(btn =>
        btn.addEventListener('click', () => this.sellItem(parseInt(btn.dataset.id))));
    }
  }

  buyItem(catalogIdx) {
    if (!this._shopStock) this._shopStock = this._shopCatalog().map(item => ({ ...item }));
    const shopItem = this._shopStock[catalogIdx];
    if (!shopItem) return;
    
    // Check stock
    if (!shopItem.stock || shopItem.stock <= 0) {
      const charName = window.characterSystem?.character?.name || 'You';
      window.aiSystem?._addSystemEntry(`⚠️ The merchant is out of ${shopItem.name}.`);
      return;
    }
    
    // Check if player can afford it
    if (this.currency < shopItem.price) {
      const charName = window.characterSystem?.character?.name || 'You';
      window.aiSystem?._addSystemEntry(`⚠️ ${charName} cannot afford ${shopItem.name}. Need ${this._formatCurrency(shopItem.price - this.currency)} more.`);
      return;
    }

    // Deduct currency, reduce stock, and add item
    this.currency = Math.max(0, this.currency - shopItem.price);
    shopItem.stock = Math.max(0, shopItem.stock - 1);
    this.addItem(shopItem.name, { desc: shopItem.desc });

    const charName = window.characterSystem?.character?.name || 'You';
    window.aiSystem?._addSystemEntry(
      `🛒 ${charName} purchased <strong>${shopItem.name}</strong> for <strong>${this._formatCurrency(shopItem.price)}</strong>.`
    );

    this._updateBadge();
    this._renderCurrency();
    this._renderMarket();
  }

  sellItem(id) {
    const item = this.items.find(i => i.id === id);
    if (!item || item.equipped) return;
    const price = this._itemValue(item);
    if (price <= 0) return;
    const qty   = item.qty || 1;
    const total = price * qty;
    this.currency = Math.max(0, this.currency + total);
    this.items.splice(this.items.indexOf(item), 1);
    const charName = window.characterSystem?.character?.name || 'You';
    window.aiSystem?._addSystemEntry(
      `🏪 ${charName} sold <strong>${item.name}${qty>1?` ×${qty}`:''}</strong> for <strong>${this._formatCurrency(total)}</strong>.`
    );
    this._updateBadge();
    this._renderCurrency();
    this._renderMarket();
  }

  sellAll() {
    const sellable = this.items.filter(i => !i.equipped && this._itemValue(i) > 0);
    if (!sellable.length) return;
    const total = sellable.reduce((sum, i) => sum + this._itemValue(i) * (i.qty || 1), 0);
    this.items = this.items.filter(i => i.equipped || this._itemValue(i) <= 0);
    this.currency = Math.max(0, this.currency + total);
    const charName = window.characterSystem?.character?.name || 'You';
    window.aiSystem?._addSystemEntry(
      `🏪 ${charName} sold everything for <strong>${this._formatCurrency(total)}</strong>.`
    );
    this._updateBadge();
    this._renderCurrency();
    this._renderMarket();
  }

  _sortMarketItems(items, priceKey) {
    // priceKey can be 'price' (for buy catalog) or 'value' (for sell items)
    if (this._marketSortBy === 'default') {
      return items; // Keep original order
    }
    
    const sorted = [...items];
    sorted.sort((a, b) => {
      const priceA = priceKey === 'price' ? a.price : this._itemValue(a);
      const priceB = priceKey === 'price' ? b.price : this._itemValue(b);
      
      if (this._marketSortBy === 'price-asc') {
        return priceA - priceB;
      } else if (this._marketSortBy === 'price-desc') {
        return priceB - priceA;
      }
      return 0;
    });
    
    return sorted;
  }

  // ── Serialize / Restore ─────────────────────────────────────
  serialize() {
    return { items: this.items, uid: this._uid, currency: this.currency, shopStock: this._shopStock };
  }

  restore(data) {
    if (!data) return;
    this.items    = data.items || [];
    this._uid     = data.uid   || (this.items.length + 1);
    // Migrate old saves that stored gold in gp
    this.currency = data.currency ?? ((data.gold || 0) * 100);
    this._shopStock = data.shopStock || null;
    this._updateBadge();
    this._renderCurrency();
  }
}

window.inventorySystem = new InventorySystem();
