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
    this.items  = [];   // [{ id, name, type, slot, rarity, desc, reqAtune, equipped, qty }]
    this._uid   = 1;
    this.gold   = 0;
  }

  reset() {
    this.items = [];
    this._uid  = 1;
    this.gold  = 0;
    this._updateBadge();
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

  // ── Gold ────────────────────────────────────────────────────
  addGold(amount) {
    this.gold = Math.max(0, (this.gold || 0) + amount);
    this._renderGold();
  }

  _renderGold() {
    const el = document.getElementById('inv-gold-amount');
    if (el) el.textContent = this.gold.toLocaleString();
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
    this._renderGold();
    document.getElementById('modal-inventory').classList.remove('hidden');
  }

  close() {
    document.getElementById('modal-inventory').classList.add('hidden');
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

    document.getElementById('modal-item').classList.remove('hidden');
  }

  // ── Serialize / Restore ─────────────────────────────────────
  serialize() {
    return { items: this.items, uid: this._uid, gold: this.gold };
  }

  restore(data) {
    if (!data) return;
    this.items = data.items || [];
    this._uid  = data.uid   || (this.items.length + 1);
    this.gold  = data.gold  || 0;
    this._updateBadge();
  }
}

window.inventorySystem = new InventorySystem();
