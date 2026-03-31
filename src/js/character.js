/* ─────────────────────────────────────────────────────────────
   character.js — D&D 5e Character Creation & Sheet
───────────────────────────────────────────────────────────── */

const RACES = [
  { id:'human',      name:'Human',      icon:'👤', tag:'+1 All',           bonus:{str:1,dex:1,con:1,int:1,wis:1,cha:1},  speed:30, lang:'Common + 1', desc:'Versatile and adaptive. Gain +1 to all ability scores.' },
  { id:'elf',        name:'Elf',         icon:'🌿', tag:'+2 DEX · +1 INT',  bonus:{dex:2,int:1},                          speed:35, lang:'Common, Elvish', desc:'Graceful and perceptive. Proficient in Perception. Fey ancestry.' },
  { id:'dwarf',      name:'Dwarf',       icon:'⛏',  tag:'+2 CON · +1 WIS',  bonus:{con:2,wis:1},                          speed:25, lang:'Common, Dwarvish', desc:'Sturdy and resilient. Resistant to poison. Darkvision 60ft.' },
  { id:'halfling',   name:'Halfling',    icon:'🍀', tag:'+2 DEX · +1 CHA',  bonus:{dex:2,cha:1},                          speed:25, lang:'Common, Halfling', desc:'Lucky and nimble. Reroll 1s on attacks and saving throws.' },
  { id:'halforc',    name:'Half-Orc',    icon:'💪', tag:'+2 STR · +1 CON',  bonus:{str:2,con:1},                          speed:30, lang:'Common, Orc', desc:'Fierce and tenacious. Relentless Endurance. Savage Attacks.' },
  { id:'tiefling',   name:'Tiefling',    icon:'😈', tag:'+2 CHA · +1 INT',  bonus:{cha:2,int:1},                          speed:30, lang:'Common, Infernal', desc:'Infernal heritage grants Hellish Rebuke and Darkness spells.' },
  { id:'dragonborn', name:'Dragonborn',  icon:'🐉', tag:'+2 STR · +1 CHA',  bonus:{str:2,cha:1},                          speed:30, lang:'Common, Draconic', desc:'Draconic ancestry. Breath weapon attack. Damage resistance.' },
  { id:'gnome',      name:'Gnome',       icon:'⚙',  tag:'+2 INT · +1 CON',  bonus:{int:2,con:1},                          speed:25, lang:'Common, Gnomish', desc:'Clever inventors. Gnome Cunning grants advantage on mental saves.' },
  { id:'halfelf',    name:'Half-Elf',    icon:'⭐', tag:'+2 CHA · +1×2',    bonus:{cha:2},                                speed:30, lang:'Common, Elvish + 1', desc:'Charismatic and skilled. Gain proficiency in two extra skills.' },
  { id:'aasimar',    name:'Aasimar',     icon:'✨', tag:'+2 CHA · +1 WIS',  bonus:{cha:2,wis:1},                          speed:30, lang:'Common, Celestial', desc:'Celestial origin. Healing Hands and Light cantrip. Emissary of Dawn.' },
];

const CLASSES = [
  { id:'fighter',   name:'Fighter',   icon:'⚔',  tag:'Martial',      hpDie:10, primary:'STR/DEX', saves:['str','con'], desc:'Master of weapons and combat techniques. Extra Attack, Action Surge.' },
  { id:'wizard',    name:'Wizard',    icon:'📚', tag:'Arcane Magic',  hpDie:6,  primary:'INT',     saves:['int','wis'], desc:'Versatile spellcaster with spellbooks. Arcane Recovery. Spell variety.' },
  { id:'rogue',     name:'Rogue',     icon:'🗡',  tag:'Stealth',      hpDie:8,  primary:'DEX',     saves:['dex','int'], desc:'Stealthy and skilful. Sneak Attack, Cunning Action, Uncanny Dodge.' },
  { id:'cleric',    name:'Cleric',    icon:'⛪', tag:'Divine Magic',  hpDie:8,  primary:'WIS',     saves:['wis','cha'], desc:'Divine spellcaster and healer. Channel Divinity, Turn Undead.' },
  { id:'ranger',    name:'Ranger',    icon:'🏹', tag:'Nature',        hpDie:10, primary:'DEX/WIS', saves:['str','dex'], desc:'Hunter and tracker. Favored Enemy, Natural Explorer, Spellcasting.' },
  { id:'paladin',   name:'Paladin',   icon:'🛡',  tag:'Holy Warrior',  hpDie:10, primary:'STR/CHA', saves:['wis','cha'], desc:'Holy warrior with auras and smites. Divine Smite, Lay on Hands.' },
  { id:'druid',     name:'Druid',     icon:'🌳', tag:'Nature Magic',  hpDie:8,  primary:'WIS',     saves:['int','wis'], desc:'Nature shaper. Wild Shape into beasts. Druidcraft and nature spells.' },
  { id:'bard',      name:'Bard',      icon:'🎵', tag:'Performance',   hpDie:8,  primary:'CHA',     saves:['dex','cha'], desc:'Magical performer. Bardic Inspiration, Jack of All Trades, spells.' },
  { id:'warlock',   name:'Warlock',   icon:'🌑', tag:'Pact Magic',    hpDie:8,  primary:'CHA',     saves:['wis','cha'], desc:'Pact with a patron. Eldritch Blast, short-rest spell recovery.' },
  { id:'sorcerer',  name:'Sorcerer',  icon:'🔥', tag:'Innate Magic',  hpDie:6,  primary:'CHA',     saves:['con','cha'], desc:'Magic in the blood. Metamagic, Font of Magic, Sorcery Points.' },
  { id:'monk',      name:'Monk',      icon:'🥋', tag:'Martial Arts',  hpDie:8,  primary:'DEX/WIS', saves:['str','dex'], desc:'Disciplined warrior. Ki points, Flurry of Blows, Unarmored Defense.' },
  { id:'barbarian', name:'Barbarian', icon:'🪓', tag:'Rage',          hpDie:12, primary:'STR',     saves:['str','con'], desc:'Primal fury. Rage for bonus damage, Reckless Attack, Unarmored Defense.' },
];

const BACKGROUNDS = [
  { id:'acolyte',    name:'Acolyte',       icon:'⛪', tag:'Insight · Religion',          skills:['Insight','Religion'],         desc:'Served in a temple. Shelter of the Faithful.' },
  { id:'criminal',   name:'Criminal',      icon:'🗝',  tag:'Deception · Stealth',         skills:['Deception','Stealth'],        desc:'Life of crime. Criminal Contact feature.' },
  { id:'folk_hero',  name:'Folk Hero',     icon:'🌾', tag:'Animal Handling · Survival',  skills:['Animal Handling','Survival'], desc:'Champion of common folk. Rustic Hospitality.' },
  { id:'noble',      name:'Noble',         icon:'👑', tag:'History · Persuasion',         skills:['History','Persuasion'],       desc:'Privileged upbringing. Position of Privilege.' },
  { id:'sage',       name:'Sage',          icon:'📖', tag:'Arcana · History',             skills:['Arcana','History'],           desc:'Scholar and researcher. Researcher feature.' },
  { id:'soldier',    name:'Soldier',       icon:'⚔',  tag:'Athletics · Intimidation',    skills:['Athletics','Intimidation'],   desc:'Military service. Military Rank feature.' },
  { id:'outlander',  name:'Outlander',     icon:'🌲', tag:'Athletics · Survival',        skills:['Athletics','Survival'],       desc:'Far from civilization. Wanderer feature.' },
  { id:'entertainer',name:'Entertainer',   icon:'🎭', tag:'Acrobatics · Performance',    skills:['Acrobatics','Performance'],   desc:'Performer by trade. By Popular Demand.' },
  { id:'artisan',    name:'Guild Artisan', icon:'⚙',  tag:'Insight · Persuasion',        skills:['Insight','Persuasion'],       desc:'Trade guild member. Guild Membership.' },
  { id:'hermit',     name:'Hermit',        icon:'🕯',  tag:'Medicine · Religion',         skills:['Medicine','Religion'],        desc:'Secluded meditation. Discovery feature.' },
];

const ABILITY_NAMES = ['str','dex','con','int','wis','cha'];
const ABILITY_LABELS = { str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA' };

const SKILLS = [
  { name:'Acrobatics',     ab:'dex' },
  { name:'Animal Handling',ab:'wis' },
  { name:'Arcana',         ab:'int' },
  { name:'Athletics',      ab:'str' },
  { name:'Deception',      ab:'cha' },
  { name:'History',        ab:'int' },
  { name:'Insight',        ab:'wis' },
  { name:'Intimidation',   ab:'cha' },
  { name:'Investigation',  ab:'int' },
  { name:'Medicine',       ab:'wis' },
  { name:'Nature',         ab:'int' },
  { name:'Perception',     ab:'wis' },
  { name:'Performance',    ab:'cha' },
  { name:'Persuasion',     ab:'cha' },
  { name:'Religion',       ab:'int' },
  { name:'Sleight of Hand',ab:'dex' },
  { name:'Stealth',        ab:'dex' },
  { name:'Survival',       ab:'wis' },
];

const BODY_TYPES = [
  { id:'slight',   name:'Slight',   icon:'🪶', desc:'Lean and nimble' },
  { id:'average',  name:'Average',  icon:'⚖',  desc:'Balanced build' },
  { id:'athletic', name:'Athletic', icon:'🏃', desc:'Toned and quick' },
  { id:'muscular', name:'Muscular', icon:'💪', desc:'Powerful and broad' },
  { id:'stocky',   name:'Stocky',   icon:'🪨', desc:'Solid and resilient' },
];

const SKIN_TONES = [
  { name:'Pale',         color:'#f0dfc4' },
  { name:'Fair',         color:'#e3c49a' },
  { name:'Warm Tan',     color:'#c8906a' },
  { name:'Olive',        color:'#a07848' },
  { name:'Tawny',        color:'#8a5c38' },
  { name:'Brown',        color:'#6b3f20' },
  { name:'Dark Brown',   color:'#4a2010' },
  { name:'Ebony',        color:'#2c1408' },
  { name:'Ashen Grey',   color:'#9a9a9c' },
  { name:'Pale Blue',    color:'#8ab8d0' },
];

const HAIR_STYLES = [
  { id:'shaved',  name:'Shaved',  icon:'◻' },
  { id:'short',   name:'Short',   icon:'▭' },
  { id:'medium',  name:'Medium',  icon:'〰' },
  { id:'long',    name:'Long',    icon:'〰〰' },
  { id:'braided', name:'Braided', icon:'🪢' },
  { id:'curly',   name:'Curly',   icon:'🌀' },
  { id:'wild',    name:'Wild',    icon:'⚡' },
];

const HAIR_COLORS = [
  { name:'Jet Black',    color:'#1a1008' },
  { name:'Dark Brown',   color:'#3d2008' },
  { name:'Auburn',       color:'#8b3a10' },
  { name:'Chestnut',     color:'#7a4420' },
  { name:'Blonde',       color:'#d4a640' },
  { name:'Strawberry',   color:'#c8704a' },
  { name:'Silver',       color:'#b0b8c0' },
  { name:'Snow White',   color:'#ece8e0' },
  { name:'Fiery Red',    color:'#c02010' },
  { name:'Midnight Blue',color:'#1a1848' },
  { name:'Forest Green', color:'#1a4820' },
];

const EYE_COLORS = [
  { name:'Dark Brown', color:'#3d2008' },
  { name:'Hazel',      color:'#7a5828' },
  { name:'Amber',      color:'#c89030' },
  { name:'Blue',       color:'#4878b0' },
  { name:'Ice Blue',   color:'#90c0d8' },
  { name:'Green',      color:'#3a7840' },
  { name:'Grey',       color:'#788090' },
  { name:'Violet',     color:'#6848a0' },
  { name:'Silver',     color:'#a0b0c0' },
  { name:'Gold',       color:'#c8a030' },
];

const CLASS_FEATURES = {
  fighter:   [{ name:'Fighting Style', desc:'Choose a combat specialty (Archery, Defense, Dueling, etc.).' }, { name:'Second Wind', desc:'Bonus action to regain 1d10 + fighter level HP once per short rest.' }, { name:'Action Surge', desc:'Take an additional action on your turn (unlocked at level 2).' }],
  wizard:    [{ name:'Spellcasting', desc:'Cast spells from your spellbook using INT as your spellcasting ability.' }, { name:'Arcane Recovery', desc:'Regain expended spell slots on a short rest (half your level, rounded up).' }],
  rogue:     [{ name:'Expertise', desc:'Double your proficiency bonus for two skills of your choice.' }, { name:'Sneak Attack', desc:'Deal extra 1d6 damage when you have advantage or an ally nearby (scales).' }, { name:'Cunning Action', desc:'Bonus action to Dash, Disengage, or Hide.' }],
  cleric:    [{ name:'Spellcasting', desc:'Divine magic fuelled by WIS. Prepare spells from the cleric list each day.' }, { name:'Channel Divinity', desc:'Channel divine energy for effects like Turn Undead (once/short rest).' }],
  ranger:    [{ name:'Favored Enemy', desc:'Advantage on survival checks to track and intelligence checks about your chosen enemy type.' }, { name:'Natural Explorer', desc:'Expertise in navigating your favored terrain; double proficiency for related checks.' }, { name:'Spellcasting', desc:'Cast ranger spells using WIS (access at level 2).' }],
  paladin:   [{ name:'Divine Sense', desc:'Detect the presence of celestials, fiends, and undead within 60 ft.' }, { name:'Lay on Hands', desc:'Healing pool of 5× paladin level HP, restored on long rest.' }, { name:'Divine Smite', desc:'Expend a spell slot to add 2d8 radiant damage per slot level to a melee hit.' }],
  druid:     [{ name:'Druidic', desc:'Secret language known only to druids. You can leave hidden messages in nature.' }, { name:'Spellcasting', desc:'Nature magic using WIS. Ritual casting available.' }, { name:'Wild Shape', desc:'Transform into a beast (unlocked at level 2); limited by CR and type.' }],
  bard:      [{ name:'Bardic Inspiration', desc:'Grant a creature a d6 inspiration die, usable in the next hour.' }, { name:'Jack of All Trades', desc:'Add half your proficiency bonus to any skill you are not proficient in.' }, { name:'Spellcasting', desc:'Magical performance using CHA. Know a set number of spells.' }],
  warlock:   [{ name:'Eldritch Blast', desc:'A beam of crackling energy; your go-to cantrip (d10, CHA modifier).' }, { name:'Otherworldly Patron', desc:'Choose a patron (Archfey, Fiend, Great Old One) for unique expanded spells.' }, { name:'Pact Magic', desc:'Short-rest spell recovery. Fewer slots than other casters, but always at highest level.' }],
  sorcerer:  [{ name:'Sorcerous Origin', desc:'Draconic or Wild Magic bloodline shapes your power and appearance.' }, { name:'Font of Magic', desc:'Pool of Sorcery Points that recharge on long rest.' }, { name:'Metamagic', desc:'Modify spells with effects like Twinned, Quickened, or Empowered.' }],
  monk:      [{ name:'Unarmored Defense', desc:'AC = 10 + DEX mod + WIS mod when wearing no armor.' }, { name:'Martial Arts', desc:'Use DEX for unarmed strikes; deal 1d4 instead of 1 on an unarmed strike.' }, { name:'Ki', desc:'Pool of energy points fuelling Flurry of Blows, Patient Defense, Step of the Wind.' }],
  barbarian: [{ name:'Rage', desc:'Bonus action rage for advantage on STR checks, +2 damage, resistance to physical damage.' }, { name:'Unarmored Defense', desc:'AC = 10 + DEX mod + CON mod when wearing no armor.' }, { name:'Reckless Attack', desc:'Advantage on first ATK roll of your turn; enemies also have advantage until next turn.' }],
};

const CLASS_EQUIPMENT = {
  fighter:   ['Longsword','Shield','Chain Mail','5× Javelin',"Explorer's Pack"],
  wizard:    ['Quarterstaff','Spellbook','Arcane Focus','Scholar\'s Pack','Dagger'],
  rogue:     ['Shortsword','Shortbow + 20 arrows','Thieves\' Tools','Burglar\'s Pack','Leather Armor'],
  cleric:    ['Mace','Scale Mail','Holy Symbol','Shield','Priest\'s Pack'],
  ranger:    ['Longbow + 20 arrows','Shortsword × 2','Leather Armor','Explorer\'s Pack','Dungeoneer\'s Pack'],
  paladin:   ['Longsword','Shield','Chain Mail','Holy Symbol 5× Javelin','Priest\'s Pack'],
  druid:     ['Leather Armor','Wooden Shield','Scimitar','Druidic Focus','Explorer\'s Pack'],
  bard:      ['Rapier','Leather Armor','Lute','Diplomate\'s Pack','Dagger'],
  warlock:   ['Light Crossbow + 20 bolts','Arcane Focus','Scholar\'s Pack','Leather Armor','2× Daggers'],
  sorcerer:  ['Arcane Focus','Dungeoneer\'s Pack','2× Daggers'],
  monk:      ['Shortsword','Dungeoneer\'s Pack','10× Darts'],
  barbarian: ['Greataxe','2× Handaxes','Explorer\'s Pack','4× Javelins'],
};

const CLASS_SKILLS = {
  fighter:   { count:2, skills:['Acrobatics','Animal Handling','Athletics','History','Insight','Intimidation','Perception','Survival'] },
  wizard:    { count:2, skills:['Arcana','History','Insight','Investigation','Medicine','Religion'] },
  rogue:     { count:4, skills:['Acrobatics','Athletics','Deception','Insight','Intimidation','Investigation','Perception','Performance','Persuasion','Sleight of Hand','Stealth'] },
  cleric:    { count:2, skills:['History','Insight','Medicine','Persuasion','Religion'] },
  ranger:    { count:3, skills:['Animal Handling','Athletics','Insight','Investigation','Nature','Perception','Stealth','Survival'] },
  paladin:   { count:2, skills:['Athletics','Insight','Intimidation','Medicine','Persuasion','Religion'] },
  druid:     { count:2, skills:['Arcana','Animal Handling','Insight','Medicine','Nature','Perception','Religion','Survival'] },
  bard:      { count:3, skills:null },
  warlock:   { count:2, skills:['Arcana','Deception','History','Intimidation','Investigation','Nature','Religion'] },
  sorcerer:  { count:2, skills:['Arcana','Deception','Insight','Intimidation','Persuasion','Religion'] },
  monk:      { count:2, skills:['Acrobatics','Athletics','History','Insight','Religion','Stealth'] },
  barbarian: { count:2, skills:['Animal Handling','Athletics','Intimidation','Nature','Perception','Survival'] },
};

// Attacks available by class and race
const CLASS_ATTACKS = {
  fighter:   ['Longsword (1d8 slashing)','Battleaxe (1d8 slashing)','Handaxe (1d6 slashing)','Heavy Crossbow (1d10 piercing)','Greataxe (1d12 slashing)','Maul (2d6 bludgeoning)','Shortsword (1d6 piercing)','Spear (1d6 piercing)'],
  wizard:    ['Quarterstaff (1d6 bludgeoning)','Dagger (1d4 piercing)','Fire Bolt — cantrip (1d10 fire)','Ray of Frost — cantrip (1d8 cold)','Poison Spray — cantrip (1d12 poison)','Shocking Grasp — cantrip (1d8 lightning)'],
  rogue:     ['Shortsword (1d6 piercing)','Rapier (1d8 piercing)','Hand Crossbow (1d6 piercing)','Dagger (1d4 piercing)','Sneak Attack (extra 1d6 piercing)'],
  cleric:    ['Mace (1d6 bludgeoning)','War Pick (1d8 piercing)','Sacred Flame — cantrip (1d8 radiant)','Toll the Dead — cantrip (1d8/1d12 necrotic)','Spiritual Weapon (1d8+WIS bludgeoning)'],
  ranger:    ['Longbow (1d8 piercing)','Shortsword (1d6 piercing)','Handaxe (1d6 slashing)','Hunter\'s Mark (extra 1d6)','Colossus Slayer (extra 1d8)'],
  paladin:   ['Longsword (1d8 slashing)','Warhammer (1d8 bludgeoning)','Divine Smite (2d8 radiant)','Javelin (1d6 piercing)','Lay on Hands'],
  druid:     ['Scimitar (1d6 slashing)','Shillelagh — cantrip (1d8 bludgeoning)','Produce Flame — cantrip (1d8 fire)','Thorn Whip — cantrip (1d6 piercing)','Primal Savagery — cantrip (1d10 acid)'],
  bard:      ['Rapier (1d8 piercing)','Vicious Mockery — cantrip (1d4 psychic)','Dagger (1d4 piercing)','Hand Crossbow (1d6 piercing)'],
  warlock:   ['Eldritch Blast — cantrip (1d10 force)','Dagger (1d4 piercing)','Light Crossbow (1d8 piercing)','Hex (extra 1d6 necrotic)','Hunger of Hadar (2d6 cold/2d6 acid)'],
  sorcerer:  ['Fire Bolt — cantrip (1d10 fire)','Shocking Grasp — cantrip (1d8 lightning)','Ray of Frost — cantrip (1d8 cold)','Chromatic Orb (3d8 elemental)','Magic Missile (3× 1d4+1 force)','Dagger (1d4 piercing)'],
  monk:      ['Unarmed Strike (1d4+DEX bludgeoning)','Shortsword (1d6 piercing)','Flurry of Blows (2× 1d4)','Stunning Strike','10× Dart (1d4+DEX piercing)'],
  barbarian: ['Greataxe (1d12 slashing)','Handaxe (1d6 slashing)','Maul (2d6 bludgeoning)','Reckless Attack','Javelin (1d6 piercing)'],
};
const RACE_ATTACKS = {
  human:      [],
  elf:        ['Longbow (1d8 piercing)','Shortsword (1d6 piercing)'],
  dwarf:      ['Battleaxe (1d8 slashing)','Warhammer (1d8 bludgeoning)'],
  halfling:   ['Sling (1d4 bludgeoning)','Dagger (1d4 piercing)'],
  halforc:    ['Greatclub (1d8 bludgeoning)','Handaxe (1d6 slashing)','Savage Attack (extra die)'],
  tiefling:   ['Hellish Rebuke (2d10 fire)','Thaumaturgy — cantrip'],
  dragonborn: ['Breath Weapon (2d6 elemental)','Claw (1d4 slashing)'],
  gnome:      ['Rock (1d4 bludgeoning)','Dagger (1d4 piercing)'],
  halfelf:    ['Shortsword (1d6 piercing)','Dagger (1d4 piercing)'],
  aasimar:    ['Healing Hands (1d4 per level)','Radiant Soul (extra radiant damage)'],
};

// Starting item pools beyond class equipment — level 1 appropriate only
const CLASS_ITEM_POOL = {
  fighter:   ['Shield','Chain Mail','Longsword','2× Handaxes','Light Crossbow + 20 bolts','Dungeoneer\'s Pack','Flail','Greataxe','Longbow + 20 arrows','Scale Mail','Spear'],
  wizard:    ['Component Pouch','Arcane Tome','Robe of the Scholar','Ink & Quill','Potion of Healing','Spellbook (spare)'],
  rogue:     ['Thieves\' Tools','Grappling Hook & Rope','Disguise Kit','Poisoner\'s Kit','Caltrops','Smoke Bomb ×2','Lockpicks','Dark Cloak','Short Bow + 20 arrows','Weighted Dice'],
  cleric:    ['Holy Water ×2','Prayer Beads','Incense ×5','Silver Symbol','Healing Kit','Potion of Healing','Sacred Candles','Plate Armor','Shield','Bell (warning)'],
  ranger:    ['Hunting Trap','Herbalism Kit','Quiver + 40 arrows','Rope (50 ft)','Camouflage Cloak','Handaxe × 2','Compass','Field Rations ×10','Antitoxin','Mastiff Companion'],
  paladin:   ['Replica Holy Avenger (hilt only)','Plate Armor','Chain Mail','Blessed Oil','Potion of Healing ×2','Warhammer','Lantern','Prayer Book','Silver Mirror','War Horn'],
  druid:     ['Herbalism Kit','Wooden Staff','Seed Pouch','Leather Armor','Druidic Focus (stone)','Rope (50 ft)','Torch ×5','Speak with Animals (scroll)','Sleep (scroll)','Berries ×10'],
  bard:      ['Lute','Panpipes','Drum','Disguise Kit','Tome of Poetry','Ink & Quill','Fine Wine ×2','Rope (50 ft)','Dagger (decorated)','Letter of Introduction'],
  warlock:   ['Eldritch Tome','Amulet of the Pact','Arcane Focus (orb)','Dark Robes','Scroll of Charm Person','Imp Familiar Token','Black Candles ×3','Sigil of the Patron','Shadow Cloak'],
  sorcerer:  ['Arcane Focus (crystal)','Scroll of Burning Hands','Scroll of Shield','Component Bag','Apprentice Robes','Fire Opal','Draconic Scales (trinket)','Potion of Healing','Spellcasting Journal'],
  monk:      ['Prayer Beads','Incense','Meditation Mat','Rope (25 ft)','Shuriken ×10','Climbing Pitons ×5','Iron Wrist Wraps','Herbal Tea ×5','50 ft Silk Rope','Bag of Sand'],
  barbarian: ['Bear Pelt Cloak','Potion of Healing','Trophy Necklace','Climbing Pitons','Torch ×5','Iron Rations ×5','Greatclub','Maul','Metal Shield','Wolf Fang Token'],
};
const RACE_ITEM_POOL = {
  human:      ['Lucky Coin','Signet Ring','Family Heirloom Dagger','Common Clothing','Traveler\'s Map'],
  elf:        ['Elven Cloak','Moonstone Gem','Elven Rope (50 ft)','Star Chart','Elven Bread ×5'],
  dwarf:      ['Smith\'s Tools','Stone Idol','Clan Badge','Dwarven Ale ×2','Iron Ration ×5'],
  halfling:   ['Pipe & Tobacco','Lucky Rabbit\'s Foot','Map of Shire','Cozy Blanket','Friendship Token'],
  halforc:    ['Battle Trophy','War Paint Set','Marching Drums','Iron Ration ×5','Intimidating Mask'],
  tiefling:   ['Infernal Compass','Hellish Red Gem','Dark Mantle','Unholy Symbol','Vial of Brimstone'],
  dragonborn: ['Clan Sigil','Dragon Scale Fragment','Breath Pouch','Firestone Gem','War Banner'],
  gnome:      ['Tinker\'s Tools','Clockwork Toy','Map of Gnomish Tunnels','Magnifying Glass','Bag of Marbles'],
  halfelf:    ['Elvish Trinket','Silver Brooch','Herbal Remedy ×3','Flute','Book of Stories'],
  aasimar:    ['Silver Holy Symbol','Celestial Feather','Prayer Scroll','Vial of Holy Water ×2','Starlight Gem'],
};

// ── Class ──────────────────────────────────────────────────────
class CharacterSystem {
  constructor() {
    this.character  = null;
    this.step       = 0;  // 0=name,1=race,2=class,3=background,4=appearance,5=stats,6=review
    this._statsRolled = false;
    this._statMethod  = 'auto';
    this.stepNames  = ['name','race','class','background','appearance','stats','proficiencies','review'];
    this._selections = { name:'', race:null, cls:null, background:null, appearance:{ bodyType:null, skinTone:null, hairStyle:null, hairColor:null, eyeColor:null, mark:'' }, stats:{str:10,dex:10,con:10,int:10,wis:10,cha:10}, skills:[], skillBonuses:{}, languages:'', acOverride:null, initOverride:null, attacks:[], extraItems:[] };
  }

  // ── Init ─────────────────────────────────────────────────────
  init() {
    this._buildStepBar();
    this._buildGrids();
    this._buildAppearanceStep();
    this._buildStatsGrid();

    document.getElementById('btn-char-next').onclick = () => this.next();
    document.getElementById('btn-char-prev').onclick = () => this.prev();
    document.getElementById('btn-char-back').onclick = () => window.app.showScreen('campaign');
    document.getElementById('btn-roll-stats').onclick = () => this.rollAllStats();

    // Enter key advances to next step (unless focused on a textarea or number input in certain steps)
    document.getElementById('screen-character').addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'TEXTAREA') return;
      // Allow Enter inside number inputs only on the stats step (to confirm a value then advance)
      if (tag === 'INPUT' && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
      e.preventDefault();
      this.next();
    });
    document.getElementById('btn-method-auto')?.addEventListener('click', () => this._setStatMethod('auto'));
    document.getElementById('btn-method-manual')?.addEventListener('click', () => this._setStatMethod('manual'));

    // HP/sheet
    document.getElementById('sh-hp-minus').onclick = () => this._adjustHP(-1);
    document.getElementById('sh-hp-plus').onclick  = () => this._adjustHP(+1);
    document.getElementById('close-modal-char').onclick = () => this.closeSheet();

    // Rest
    document.getElementById('btn-rest').onclick = () => this._openRestModal();
    document.getElementById('close-modal-rest').onclick = () =>
      document.getElementById('modal-rest').classList.add('hidden');
    document.getElementById('rest-short').onclick = () => this._toggleShortRestControls();
    document.getElementById('btn-rest-short-go').onclick = () => this._doShortRest();
    document.getElementById('btn-rest-long-go').onclick  = () => this._doLongRest();
    document.getElementById('rest-hd-minus').onclick = () => this._changeHDSpend(-1);
    document.getElementById('rest-hd-plus').onclick  = () => this._changeHDSpend(+1);

    // Death saves
    document.getElementById('btn-death-roll').onclick = () => this._rollDeathSave();

    // Sheet tabs — Stats vs Spells
    document.getElementById('tab-stats-btn').onclick  = () => this._switchSheetTab('stats');
    document.getElementById('tab-spells-btn').onclick = () => this._switchSheetTab('spells');

    // Condition / Item modal close buttons
    document.getElementById('close-modal-condition').onclick = () =>
      document.getElementById('modal-condition').classList.add('hidden');
    document.getElementById('close-modal-item').onclick = () =>
      document.getElementById('modal-item').classList.add('hidden');
  }

  reset() {
    this.step = 0;
    this._statsRolled = false;
    this._statMethod  = 'auto';
    this._selections = { name:'', race:null, cls:null, background:null, appearance:{ bodyType:null, skinTone:null, hairStyle:null, hairColor:null, eyeColor:null, mark:'' }, stats:{str:10,dex:10,con:10,int:10,wis:10,cha:10}, skills:[], skillBonuses:{}, languages:'', acOverride:null, initOverride:null, attacks:[], extraItems:[] };
    this._buildAppearanceStep();
    this._showStep(0);
    this._updateStepBar();
  }

  // ── Step Navigation ──────────────────────────────────────────
  next() {
    if (!this._canAdvance()) return;
    if (this.step === this.stepNames.length - 1) {
      this._finalize();
      return;
    }
    this.step++;
    if (this.step === this.stepNames.length - 1) this._buildReview();
    this._showStep(this.step);
    this._updateStepBar();
    this._updateNavButtons();
  }

  prev() {
    if (this.step === 0) return;
    this.step--;
    this._showStep(this.step);
    this._updateStepBar();
    this._updateNavButtons();
  }

  _canAdvance() {
    switch(this.step) {
      case 0: {
        const n = document.getElementById('char-name').value.trim();
        if (!n) { window.app.showToast('Enter a name!', 'error'); return false; }
        this._selections.name = n;
        return true;
      }
      case 1: if (!this._selections.race)       { window.app.showToast('Choose a race!', 'error');       return false; } return true;
      case 2: if (!this._selections.cls)        { window.app.showToast('Choose a class!', 'error');      return false; } return true;
      case 3: if (!this._selections.background) { window.app.showToast('Choose a background!', 'error'); return false; } return true;
      case 4: {
        const markEl = document.getElementById('app-mark');
        if (markEl) this._selections.appearance.mark = markEl.value;
        return true;
      }
      case 5: {
        if (this._statMethod === 'manual') {
          const allFilled = ABILITY_NAMES.every(ab => {
            const val = parseInt(document.getElementById(`mi-${ab}`)?.value);
            return val >= 1 && val <= 20;
          });
          if (!allFilled) {
            window.app.showToast('Fill in all six ability scores (1–20)!', 'error');
            return false;
          }
          ABILITY_NAMES.forEach(ab => {
            this._selections.stats[ab] = parseInt(document.getElementById(`mi-${ab}`).value);
          });
          this._statsRolled = true;
          return true;
        }
        if (!this._statsRolled) {
          window.app.showToast('Roll your stats first!', 'error'); return false;
        }
        return true;
      }
      case 6: {
        const classId  = this._selections.cls?.id || 'fighter';
        const cs       = CLASS_SKILLS[classId] || { count:2, skills:[] };
        const allowed  = cs.skills || SKILLS.map(s => s.name);
        const bgSkills = this._selections.background?.skills || [];
        const available = allowed.filter(s => !bgSkills.includes(s));
        const needed    = Math.min(cs.count, available.length);
        if ((this._selections.skills || []).length < needed) {
          window.app.showToast(needed === 1 ? 'Choose 1 class skill' : `Choose ${needed} class skills`, 'error');
          return false;
        }
        const langEl = document.getElementById('prof-languages');
        if (langEl) this._selections.languages = langEl.value.trim() || this._selections.race?.lang || 'Common';
        const acVal   = parseInt(document.getElementById('prof-ac')?.value);
        const initVal = parseInt(document.getElementById('prof-init')?.value);
        this._selections.acOverride   = isNaN(acVal)   ? null : acVal;
        this._selections.initOverride = isNaN(initVal)  ? null : initVal;
        return true;
      }
      default: return true;
    }
  }

  _showStep(idx) {
    this.stepNames.forEach(name => {
      const el = document.getElementById(`step-${name}`);
      if (el) el.classList.toggle('hidden', this.stepNames.indexOf(name) !== idx);
    });
    // Focus the name input on step 0
    if (idx === 0) {
      setTimeout(() => document.getElementById('char-name')?.focus(), 80);
    }
    // Update stats step hint to reflect current difficulty
    if (idx === 5) {
      this._setStatMethod(this._statMethod);
      const diff   = window.app?.gameState?.difficulty || 'adventure';
      const dLabel = { cozy: '3d6', adventure: '2d6', hard: '1d6' };
      const dName  = { cozy: 'Cozy', adventure: 'Adventure', hard: 'Hard' };
      const hintEl = document.querySelector('#step-stats .step-hint');
      if (hintEl) hintEl.textContent =
        `Roll ${dLabel[diff] || '2d6'} — six times. (${dName[diff] || 'Adventure'} difficulty)`;
    }
    if (idx === 6) this._refreshProfStep();
    // swap next button label
    const nextBtn = document.getElementById('btn-char-next');
    nextBtn.textContent = idx === this.stepNames.length - 1 ? '⚔ Begin Adventure!' : 'Next →';
    document.getElementById('btn-char-prev').style.visibility = idx === 0 ? 'hidden' : 'visible';
  }

  // ── Step Bar ─────────────────────────────────────────────────
  _buildStepBar() {
    const bar = document.getElementById('step-bar');
    bar.innerHTML = '';
    const labels = ['Name','Race','Class','Background','Appearance','Stats','Proficiencies','Review'];
    labels.forEach((lbl, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.className = 'step-connector';
        bar.appendChild(conn);
      }
      const node = document.createElement('div');
      node.className = 'step-node';
      node.id = `step-node-${i}`;
      node.title = lbl;
      node.textContent = i + 1;
      bar.appendChild(node);
    });
    this._updateStepBar();
  }

  _updateStepBar() {
    this.stepNames.forEach((_, i) => {
      const node = document.getElementById(`step-node-${i}`);
      if (!node) return;
      node.className = 'step-node' + (i < this.step ? ' done' : i === this.step ? ' active' : '');
    });
  }

  _updateNavButtons() { /* handled in _showStep */ }

  // ── Build Grids ──────────────────────────────────────────────
  _buildGrids() {
    this._buildOptionGrid('race-grid',       RACES,       'race',       d => d.id);
    this._buildOptionGrid('class-grid',      CLASSES,     'cls',        d => d.id);
    this._buildOptionGrid('background-grid', BACKGROUNDS, 'background', d => d.id);
  }

  _buildOptionGrid(containerId, data, key, idFn) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.dataset.id = idFn(item);
      card.innerHTML = `
        <div class="oc-icon">${item.icon}</div>
        <div class="oc-name">${item.name}</div>
        <div class="oc-tag">${item.tag}</div>
        <div class="oc-desc">${item.desc}</div>`;
      card.onclick = () => {
        container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._selections[key] = item;
      };
      container.appendChild(card);
    });
  }

  _buildAppearanceStep() {
    this._selections.appearance = { bodyType:null, skinTone:null, hairStyle:null, hairColor:null, eyeColor:null, mark:'' };
    const container = document.getElementById('appearance-builder');
    container.innerHTML = '';

    const makeButtons = (title, items, key) => {
      const sec = document.createElement('div');
      sec.className = 'appear-section';
      sec.innerHTML = `<div class="appear-label">${title}</div>`;
      const row = document.createElement('div');
      row.className = 'appear-options';
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'appear-opt';
        btn.innerHTML = `<span class="aopt-icon">${item.icon}</span><span class="aopt-name">${item.name}</span>`;
        if (item.desc) btn.title = item.desc;
        btn.onclick = () => {
          row.querySelectorAll('.appear-opt').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this._selections.appearance[key] = item.name;
        };
        row.appendChild(btn);
      });
      sec.appendChild(row);
      return sec;
    };

    const makeSwatches = (title, items, key) => {
      const sec = document.createElement('div');
      sec.className = 'appear-section';
      sec.innerHTML = `<div class="appear-label">${title}</div>`;
      const row = document.createElement('div');
      row.className = 'appear-swatches';
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'appear-swatch';
        btn.style.background = item.color;
        btn.title = item.name;
        btn.innerHTML = `<span class="swatch-check">✓</span>`;
        btn.onclick = () => {
          row.querySelectorAll('.appear-swatch').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this._selections.appearance[key] = { name: item.name, color: item.color };
        };
        row.appendChild(btn);
      });
      sec.appendChild(row);
      return sec;
    };

    container.appendChild(makeButtons('Body Type',  BODY_TYPES,  'bodyType'));
    container.appendChild(makeSwatches('Skin Tone', SKIN_TONES,  'skinTone'));
    container.appendChild(makeButtons('Hair Style', HAIR_STYLES, 'hairStyle'));
    container.appendChild(makeSwatches('Hair Color',HAIR_COLORS, 'hairColor'));
    container.appendChild(makeSwatches('Eye Color', EYE_COLORS,  'eyeColor'));

    const markSec = document.createElement('div');
    markSec.className = 'appear-section';
    markSec.innerHTML = `
      <div class="appear-label">Distinguishing Mark <span class="appear-optional">(optional)</span></div>
      <input class="appear-mark-input" id="app-mark" type="text" maxlength="60" placeholder="A scar, tattoo, birthmark…" />`;
    markSec.querySelector('#app-mark').oninput = e => { this._selections.appearance.mark = e.target.value; };
    container.appendChild(markSec);

    // Portrait generation section
    const genSec = document.createElement('div');
    genSec.className = 'appear-section portrait-gen-section';
    genSec.innerHTML = `
      <div class="appear-label">AI Portrait <span class="appear-optional">(OpenAI key required)</span></div>
      <div class="portrait-gen-row">
        <button class="btn btn-outline btn-sm" id="btn-gen-portrait">🎨 Generate with DALL·E 3</button>
        <span class="portrait-gen-status" id="portrait-gen-status"></span>
      </div>
      <div class="portrait-gen-result hidden" id="portrait-gen-result">
        <img id="portrait-gen-img" src="" alt="Generated portrait" class="gen-portrait-img" />
      </div>`;
    genSec.querySelector('#btn-gen-portrait').onclick = () => this._generatePortrait();
    container.appendChild(genSec);
  }

  // ── AI Portrait Generation ───────────────────────────────────
  _buildPortraitPrompt() {
    const r    = this._selections;
    const a    = r.appearance || {};
    const name = r.name || 'an adventurer';
    const race = r.race?.name  || 'Human';
    const cls  = r.cls?.name   || 'Fighter';
    const body = a.bodyType    || '';
    const skin = a.skinTone?.name || '';
    const hairStyle = a.hairStyle || '';
    const hairColor = a.hairColor?.name || '';
    const eyeColor  = a.eyeColor?.name  || '';
    const mark      = a.mark || '';
    const parts = [
      body && `${body} build`,
      skin && `${skin} skin`,
      (hairStyle && hairColor) ? `${hairStyle.toLowerCase()} ${hairColor.toLowerCase()} hair`
        : hairStyle || hairColor || null,
      eyeColor && `${eyeColor.toLowerCase()} eyes`,
      mark || null,
    ].filter(Boolean);
    return `Fantasy D&D character portrait of ${name}, a ${race} ${cls}.${parts.length ? ' Appearance: ' + parts.join(', ') + '.' : ''} Detailed fantasy oil-painting style, dramatic dark atmospheric background, parchment-toned warm lighting, upper body portrait, heroic and resolute expression. No text.`;
  }

  async _generatePortrait() {
    const apiKey = window.app?.settings?.apiKeyOpenAI;
    if (!apiKey) {
      window.app?.showToast('Portrait generation requires an OpenAI API key in Settings.', 'error');
      return;
    }
    const statusEl = document.getElementById('portrait-gen-status');
    const btn      = document.getElementById('btn-gen-portrait');
    if (!statusEl || !btn) return;
    btn.disabled     = true;
    statusEl.textContent = '⏳ Generating…';
    try {
      const prompt = this._buildPortraitPrompt();
      const url    = await window.electronAPI.generatePortrait(prompt, apiKey);
      if (!url) throw new Error('No image returned');
      this._selections.appearance.portraitUrl = url;
      const img = document.getElementById('portrait-gen-img');
      const res = document.getElementById('portrait-gen-result');
      if (img && res) { img.src = url; res.classList.remove('hidden'); }
      // Also update the creation preview if it exists
      const preview = document.getElementById('portrait-preview');
      if (preview) preview.innerHTML = `<img src="${url}" class="gen-portrait-img" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" />`;
      statusEl.textContent = '✓ Done';
    } catch (err) {
      statusEl.textContent = '';
      window.app?.showToast('Portrait generation failed: ' + err, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async _generatePortraitFromSheet() {
    const c = this.character;
    if (!c) return;
    const apiKey = window.app?.settings?.apiKeyOpenAI;
    if (!apiKey) {
      window.app?.showToast('Portrait generation requires an OpenAI API key in Settings.', 'error');
      return;
    }
    const statusEl = document.getElementById('sheet-portrait-status');
    const btn      = document.getElementById('btn-gen-portrait-sheet');
    if (btn) btn.disabled = true;
    if (statusEl) statusEl.textContent = '⏳ Generating…';
    try {
      const a         = c.appearance || {};
      const parts     = [
        a.bodyType && `${a.bodyType} build`,
        a.skinTone?.name && `${a.skinTone.name} skin`,
        (a.hairStyle && a.hairColor?.name) ? `${a.hairStyle.toLowerCase()} ${a.hairColor.name.toLowerCase()} hair` : null,
        a.eyeColor?.name && `${a.eyeColor.name.toLowerCase()} eyes`,
        a.mark || null,
      ].filter(Boolean);
      const prompt = `Fantasy D&D character portrait of ${c.name}, a ${c.race} ${c.class}.${parts.length ? ' Appearance: ' + parts.join(', ') + '.' : ''} Detailed fantasy oil-painting style, dramatic dark atmospheric background, warm parchment-toned lighting, upper body portrait, heroic expression. No text.`;
      const url    = await window.electronAPI.generatePortrait(prompt, apiKey);
      if (!url) throw new Error('No image returned');
      c.appearance.portraitUrl = url;
      const genImg = document.getElementById('sheet-portrait-img');
      const frame  = document.getElementById('sheet-portrait-frame');
      if (genImg) { genImg.src = url; genImg.classList.remove('hidden'); }
      const svg = frame?.querySelector('svg');
      if (svg) svg.style.display = 'none';
      if (statusEl) statusEl.textContent = '✓ Done';
    } catch (err) {
      if (statusEl) statusEl.textContent = '';
      window.app?.showToast('Portrait generation failed: ' + err, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ── Stats ────────────────────────────────────────────────────
  _buildStatsGrid() {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '';
    ABILITY_NAMES.forEach(ab => {
      const box = document.createElement('div');
      box.className = 'stat-box';
      box.id = `stat-box-${ab}`;
      box.innerHTML = `
        <div class="stat-name">${ABILITY_LABELS[ab]}</div>
        <div class="stat-value" id="sv-${ab}">—</div>
        <div class="stat-mod"  id="sm-${ab}"></div>
        <div class="stat-race-bonus" id="srb-${ab}"></div>`;
      grid.appendChild(box);
    });
  }

  rollAllStats() {
    const diff = window.app?.gameState?.difficulty || 'adventure';
    const n    = diff === 'cozy' ? 3 : diff === 'hard' ? 1 : 2;
    const rollNd6 = () => {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += Math.floor(Math.random() * 6) + 1;
      return sum;
    };
    this._statsRolled = true;
    ABILITY_NAMES.forEach(ab => {
      this._selections.stats[ab] = rollNd6();
      this._updateStatDisplay(ab);
    });
    const total = Object.values(this._selections.stats).reduce((s, v) => s + v, 0);
    document.getElementById('stats-total-info').textContent = `Array total: ${total} (${n}d6 per stat)`;
  }

  _updateStatDisplay(ab) {
    const race  = this._selections.race;
    const base  = this._selections.stats[ab];
    const bonus = race?.bonus?.[ab] || 0;
    const total = base + bonus;
    const mod   = this._mod(total);

    document.getElementById(`sv-${ab}`).textContent  = total;
    document.getElementById(`sm-${ab}`).textContent  = `(${mod >= 0 ? '+' : ''}${mod})`;
    document.getElementById(`srb-${ab}`).textContent = bonus ? `+${bonus} race` : '';
  }

  _mod(score) { return Math.floor((score - 10) / 2); }

  // ── Stat Method Toggle ───────────────────────────────────────
  _setStatMethod(method) {
    this._statMethod = method;
    const autoSec = document.getElementById('stats-auto-section');
    const manSec  = document.getElementById('stats-manual-section');
    const autoBt  = document.getElementById('btn-method-auto');
    const manBt   = document.getElementById('btn-method-manual');
    if (!autoSec || !manSec) return;
    autoSec.classList.toggle('hidden', method === 'manual');
    manSec.classList.toggle('hidden',  method !== 'manual');
    autoBt?.classList.toggle('active', method !== 'manual');
    manBt?.classList.toggle('active',  method === 'manual');
    if (method === 'manual') this._buildManualStatsGrid();
  }

  _buildManualStatsGrid() {
    const grid = document.getElementById('stats-manual-grid');
    if (!grid) return;
    grid.innerHTML = '';
    ABILITY_NAMES.forEach(ab => {
      const bonus   = this._selections.race?.bonus?.[ab] || 0;
      const current = this._selections.stats[ab];
      const prefill = (this._statsRolled && current !== 10) ? current : '';
      const box = document.createElement('div');
      box.className = 'stat-box';
      box.innerHTML = `
        <div class="stat-name">${ABILITY_LABELS[ab]}</div>
        <input type="number" class="stat-manual-input" id="mi-${ab}"
               min="1" max="20" value="${prefill}" placeholder="—" />
        <div class="stat-mod" id="sm-manual-${ab}"></div>
        ${bonus ? `<div class="stat-race-bonus">+${bonus} race</div>` : ''}`;
      const input  = box.querySelector(`#mi-${ab}`);
      const modEl  = box.querySelector(`#sm-manual-${ab}`);
      const refresh = () => {
        let val = parseInt(input.value);
        if (!isNaN(val)) {
          val = Math.max(1, Math.min(20, val));
          input.value = val;
          const mod = this._mod(val + bonus);
          modEl.textContent = `(${mod >= 0 ? '+' : ''}${mod})`;
        } else {
          modEl.textContent = '';
        }
      };
      if (prefill) refresh();
      input.addEventListener('input', refresh);
      grid.appendChild(box);
    });
  }

  // ── Proficiencies Step ───────────────────────────────────────
  async _refreshProfStep() {
    const r       = this._selections;
    const classId = r.cls?.id || 'fighter';
    const raceId  = r.race?.id || 'human';
    const cs      = CLASS_SKILLS[classId] || { count:2, skills:[] };
    const allowed = cs.skills || SKILLS.map(s => s.name);
    if (!r.skills)      r.skills      = [];
    if (!r.skillBonuses) r.skillBonuses = {};
    if (!r.attacks)     r.attacks     = [];
    if (!r.extraItems)  r.extraItems  = [];
    r.skills = r.skills.filter(s => allowed.includes(s));

    const bgSkills  = r.background?.skills || [];
    const available = allowed.filter(s => !bgSkills.includes(s));
    const needed    = Math.min(cs.count, available.length);

    const subEl = document.getElementById('prof-skill-sub');
    const _updateSub = () => {
      if (needed === 0) { if (subEl) subEl.textContent = 'No additional class skills available'; return; }
      if (subEl) subEl.textContent = `${r.skills.length} / ${needed} chosen`;
    };
    _updateSub();

    // Background skill chips (read-only)
    const bgEl = document.getElementById('prof-bg-skills');
    if (bgEl) bgEl.innerHTML = bgSkills.length
      ? bgSkills.map(s => `<span class="prof-bg-chip">${s}</span>`).join('')
      : `<span style="color:var(--text-dim);font-size:12px">None from this background</span>`;

    // Language
    const langEl = document.getElementById('prof-languages');
    if (langEl) {
      if (!r.languages) r.languages = r.race?.lang || 'Common';
      langEl.value  = r.languages;
      langEl.oninput = () => { r.languages = langEl.value; };
    }

    // AC / init overrides
    const stats    = this._computeFinalStats();
    const dexMod   = this._mod(stats.dex);
    const acEl     = document.getElementById('prof-ac');
    const initEl   = document.getElementById('prof-init');
    const acHint   = document.getElementById('prof-ac-hint');
    const initHint = document.getElementById('prof-init-hint');
    if (acHint)   acHint.textContent   = `Default: ${10 + dexMod}`;
    if (initHint) initHint.textContent = `Default: ${dexMod >= 0 ? '+' : ''}${dexMod}`;
    if (acEl)   { acEl.value   = r.acOverride   != null ? r.acOverride   : ''; acEl.oninput   = () => { let v=parseInt(acEl.value);   if(!isNaN(v)){v=Math.max(0,Math.min(20,v));acEl.value=v;}   r.acOverride   = isNaN(v)?null:v; }; }
    if (initEl) { initEl.value = r.initOverride != null ? r.initOverride : ''; initEl.oninput = () => { let v=parseInt(initEl.value); if(!isNaN(v)){v=Math.max(-10,Math.min(20,v));initEl.value=v;} r.initOverride = isNaN(v)?null:v; }; }

    // ── All Skills with proficiency toggle + bonus input ─────
    const skillTableEl = document.getElementById('prof-skill-table');
    if (skillTableEl) {
      skillTableEl.innerHTML = '';
      SKILLS.forEach(sk => {
        const isBg   = bgSkills.includes(sk.name);
        const isAllowed = allowed.includes(sk.name);
        const isSel  = r.skills.includes(sk.name) || isBg;
        const bonus  = r.skillBonuses[sk.name] ?? 0;
        const row = document.createElement('div');
        row.className = 'prof-skill-row' + (isSel ? ' prof-skill-row-active' : '');

        const dot = document.createElement('div');
        dot.className = 'prof-dot prof-skill-toggle' + (isSel ? ' proficient' : '') + (!isAllowed && !isBg ? ' not-allowed' : '');
        if (!isBg) {
          dot.title = isAllowed ? 'Click to toggle class proficiency' : 'Not in your class skill list';
          dot.style.cursor = isAllowed ? 'pointer' : 'default';
          dot.onclick = () => {
            if (!isAllowed) return;
            if (r.skills.includes(sk.name)) {
              r.skills = r.skills.filter(s => s !== sk.name);
              dot.classList.remove('proficient');
              row.classList.remove('prof-skill-row-active');
            } else if (r.skills.length < needed) {
              r.skills.push(sk.name);
              dot.classList.add('proficient');
              row.classList.add('prof-skill-row-active');
            } else {
              window.app.showToast(needed === 1 ? 'You can only choose 1 class skill' : `You can only choose ${needed} class skills`, 'error');
              return;
            }
            _updateSub();
          };
        } else {
          dot.title = 'Background proficiency';
          dot.style.cursor = 'default';
        }

        const label = document.createElement('span');
        label.className = 'prof-skill-name';
        label.innerHTML = `${sk.name} <span class="prof-skill-ab">(${ABILITY_LABELS[sk.ab]})</span>`;

        const bonusInput = document.createElement('input');
        bonusInput.type        = 'number';
        bonusInput.className   = 'prof-skill-bonus-input';
        bonusInput.value       = bonus !== 0 ? bonus : '';
        bonusInput.placeholder = '±0';
        bonusInput.min         = '-10';
        bonusInput.max         = '20';
        bonusInput.title       = 'Extra bonus to this skill';
        bonusInput.oninput = () => {
          let v = parseInt(bonusInput.value);
          if (!isNaN(v)) {
            v = Math.max(-10, Math.min(20, v));
            bonusInput.value = v;
          }
          r.skillBonuses[sk.name] = isNaN(v) ? 0 : v;
        };

        row.append(dot, label, bonusInput);
        skillTableEl.appendChild(row);
      });
    }

    // Class skill chip grid (legacy, used for validation display)
    const grid = document.getElementById('prof-skill-grid');
    if (grid) grid.style.display = 'none';

    // ── Attacks ─────────────────────────────────────────────
    const attackPool  = [...(CLASS_ATTACKS[classId] || []), ...(RACE_ATTACKS[raceId] || [])];
    const atkGrid     = document.getElementById('prof-attack-grid');
    if (atkGrid) {
      atkGrid.innerHTML = '';
      attackPool.forEach(atk => {
        const isSel = r.attacks.includes(atk);
        const chip  = document.createElement('button');
        chip.className = 'prof-skill-chip' + (isSel ? ' selected' : '');
        chip.textContent = atk;
        chip.onclick = () => {
          if (r.attacks.includes(atk)) {
            r.attacks = r.attacks.filter(a => a !== atk);
            chip.classList.remove('selected');
          } else {
            r.attacks.push(atk);
            chip.classList.add('selected');
          }
          const cntEl = document.getElementById('prof-attack-count');
          if (cntEl) cntEl.textContent = `${r.attacks.length} selected`;
        };
        atkGrid.appendChild(chip);
      });
      const cntEl = document.getElementById('prof-attack-count');
      if (cntEl) cntEl.textContent = `${r.attacks.length} selected`;
    }

    // ── Extra Starting Items (pick up to 5) ──────────────────
    const itemPool = [...(CLASS_ITEM_POOL[classId] || []), ...(RACE_ITEM_POOL[raceId] || [])];
    const uniquePool = [...new Set(itemPool)];
    const itemGrid = document.getElementById('prof-item-grid');
    const itemSub  = document.getElementById('prof-item-sub');
    const _updateItemSub = () => {
      if (itemSub) itemSub.textContent = `${r.extraItems.length} / 5 chosen`;
    };
    _updateItemSub();
    if (itemGrid) {
      itemGrid.innerHTML = '';
      uniquePool.forEach(item => {
        const isSel = r.extraItems.includes(item);
        const chip  = document.createElement('button');
        chip.className = 'prof-skill-chip' + (isSel ? ' selected' : '');
        chip.textContent = item;
        chip.onclick = () => {
          if (r.extraItems.includes(item)) {
            r.extraItems = r.extraItems.filter(i => i !== item);
            chip.classList.remove('selected');
          } else if (r.extraItems.length < 5) {
            r.extraItems.push(item);
            chip.classList.add('selected');
          } else {
            window.app.showToast('You can only choose 5 extra items', 'error');
          }
          _updateItemSub();
        };
        itemGrid.appendChild(chip);
      });
    }

    // ── Level 1 Common items from Open5e SRD ─────────────────
    if (itemGrid && window.open5e) {
      const loadEl = document.createElement('span');
      loadEl.className = 'items-loading-hint';
      loadEl.textContent = '⏳ Loading SRD Common items…';
      itemGrid.appendChild(loadEl);
      try {
        const srdItems = await window.open5e.getLevel1Items();
        loadEl.remove();
        srdItems.forEach(srdItem => {
          const name = srdItem.name;
          if (uniquePool.includes(name)) return;
          uniquePool.push(name);
          const isSel = r.extraItems.includes(name);
          const chip  = document.createElement('button');
          chip.className = 'prof-skill-chip' + (isSel ? ' selected' : '');
          chip.textContent = name;
          chip.title = 'Common magic item (Open5e SRD)';
          chip.onclick = () => {
            if (r.extraItems.includes(name)) {
              r.extraItems = r.extraItems.filter(i => i !== name);
              chip.classList.remove('selected');
            } else if (r.extraItems.length < 5) {
              r.extraItems.push(name);
              chip.classList.add('selected');
            } else {
              window.app.showToast('You can only choose 5 extra items', 'error');
            }
            _updateItemSub();
          };
          itemGrid.appendChild(chip);
        });
      } catch (e) {
        loadEl.remove();
        console.warn('[Character] Could not load SRD items:', e.message);
      }
    }
  }

  // ── Review ───────────────────────────────────────────────────
  _buildReview() {
    const r = this._selections;
    const cls = r.cls;
    const stats = this._computeFinalStats();
    const a = r.appearance || {};
    const appearStr = [
      a.bodyType,
      a.skinTone?.name,
      a.hairStyle && a.hairColor?.name ? `${a.hairStyle} ${a.hairColor.name} hair` : (a.hairStyle || null),
      a.eyeColor?.name ? `${a.eyeColor.name} eyes` : null,
      a.mark || null,
    ].filter(Boolean).join(' · ');
    const skinFill     = a.skinTone?.color || '#2a2010';
    const ac           = r.acOverride   != null ? r.acOverride   : (10 + this._mod(stats.dex));
    const initMod      = r.initOverride != null ? r.initOverride  : this._mod(stats.dex);
    const chosenSkills = [...(r.background?.skills || []), ...(r.skills || [])];
    const langs        = r.languages || r.race?.lang || 'Common';

    const sheet = document.getElementById('review-sheet');
    sheet.innerHTML = `
      <div class="review-header">
        <div class="review-portrait">${this._buildPortraitSVG(a, 70)}</div>
        <div>
          <div class="review-name">${r.name}</div>
          <div class="review-sub">${r.race?.name || ''} ${cls?.name || ''} · ${r.background?.name || ''}</div>
          ${appearStr ? `<div class="review-appear">${appearStr}</div>` : ''}
        </div>
      </div>
      <div class="review-grid">
        <div class="rv-item"><div class="rv-label">HIT POINTS</div><div class="rv-value">${cls ? cls.hpDie + this._mod(stats.con) : '—'}</div></div>
        <div class="rv-item"><div class="rv-label">ARMOR CLASS</div><div class="rv-value">${ac}</div></div>
        <div class="rv-item"><div class="rv-label">INITIATIVE</div><div class="rv-value">${initMod >= 0 ? '+' : ''}${initMod}</div></div>
        <div class="rv-item"><div class="rv-label">SPEED</div><div class="rv-value">${r.race?.speed || 30} ft</div></div>
        <div class="rv-item"><div class="rv-label">PROF. BONUS</div><div class="rv-value">+2</div></div>
        <div class="rv-item"><div class="rv-label">HIT DIE</div><div class="rv-value">d${cls?.hpDie || '—'}</div></div>
      </div>
      <div class="review-stats">
        ${ABILITY_NAMES.map(ab => `
          <div class="rv-stat">
            <div class="rv-stat-name">${ABILITY_LABELS[ab]}</div>
            <div class="rv-stat-val">${stats[ab]}</div>
          </div>`).join('')}
      </div>
      <div class="review-profs">
        <div class="rv-prof-label">Skill Proficiencies</div>
        <div class="rv-prof-list">${chosenSkills.length ? chosenSkills.join(' · ') : '<em style="color:var(--text-dim)">None chosen</em>'}</div>
        <div class="rv-prof-label" style="margin-top:8px">Languages</div>
        <div class="rv-prof-list">${langs}</div>
      </div>`;
  }

  _computeFinalStats() {
    const stats = { ...this._selections.stats };
    const bonus = this._selections.race?.bonus || {};
    ABILITY_NAMES.forEach(ab => { stats[ab] = (stats[ab] || 10) + (bonus[ab] || 0); });
    return stats;
  }

  // ── Finalize ─────────────────────────────────────────────────
  _finalize() {
    const r     = this._selections;
    const stats = this._computeFinalStats();
    const cls   = r.cls;
    const maxHp = (cls?.hpDie || 8) + this._mod(stats.con);
    const appearance = { ...r.appearance };
    // Carry over generated portrait URL if one was produced during creation
    if (this._selections.appearance?.portraitUrl) {
      appearance.portraitUrl = this._selections.appearance.portraitUrl;
    }

    this.character = {
      name:       r.name,
      race:       r.race?.name || 'Human',
      class:      cls?.name    || 'Fighter',
      classId:    cls?.id      || 'fighter',
      background:  r.background?.name || 'Acolyte',
      appearance,
      level:       1,
      xp:         0,
      stats,
      maxHp:      Math.max(1, maxHp),
      currentHp:  Math.max(1, maxHp),
      hitDice:    { die: cls?.hpDie || 8, total: 1, spent: 0 },
      ac:         r.acOverride   != null ? r.acOverride   : (10 + this._mod(stats.dex)),
      speed:      r.race?.speed || 30,
      profBonus:  2,
      saves:      cls?.saves || ['str','con'],
      equipment:  CLASS_EQUIPMENT[cls?.id] || [],
      features:   CLASS_FEATURES[cls?.id]  || [],
      bgSkills:       [...(r.background?.skills || []), ...(r.skills || [])],
      notes:          '',
      languages:      r.languages || r.race?.lang || 'Common',
      initBonus:      r.initOverride != null ? r.initOverride : this._mod(stats.dex),
      extraSkillProf: [],
      skillBonuses:   r.skillBonuses || {},
      attacks:        r.attacks || [],
      _extraItems:    r.extraItems  || [],
    };

    // Push appearance to map sprite
    window.mapSystem?.updateSprite(this.character.appearance);
    // Campaign type and difficulty were chosen before character creation
    // (inventory seeding happens in app.js after aiSystem.start() resets inventory)
    window.app.startCampaign(
      window.app.gameState.campaignType || 'standard',
      window.app.gameState.customDesc   || ''
    );
  }

  // ── HUD + Character Sheet ────────────────────────────────────
  updateHUD() {
    const c = this.character;
    if (!c) return;
    document.getElementById('hud-name').textContent    = c.name;
    document.getElementById('hud-class').textContent   = `${c.race} ${c.class}`;
    document.getElementById('hud-level').textContent   = c.level;
    document.getElementById('hud-hp').textContent      = c.currentHp;
    document.getElementById('hud-hp-max').textContent  = c.maxHp;
    const pct = Math.max(0, c.currentHp / c.maxHp);
    const bar = document.getElementById('hud-hp-bar');
    bar.style.width      = `${pct * 100}%`;
    bar.style.background = pct > 0.6 ? 'var(--hp-high)' : pct > 0.3 ? 'var(--hp-mid)' : 'var(--hp-low)';
    // Toolbar mini HP bar
    const tbFill = document.getElementById('toolbar-hp-mini-fill');
    const tbCur  = document.getElementById('toolbar-hp-cur');
    const tbMax  = document.getElementById('toolbar-hp-max');
    if (tbFill) { tbFill.style.width = `${pct * 100}%`; tbFill.style.background = bar.style.background; }
    if (tbCur)  tbCur.textContent = c.currentHp;
    if (tbMax)  tbMax.textContent = c.maxHp;
    // XP bar
    const thr    = CharacterSystem.XP_THRESHOLDS;
    const lvl    = c.level || 1;
    const xpCur  = c.xp || 0;
    const xpThis = thr[lvl]     || 0;
    const xpNext = thr[lvl + 1] || null;
    const xpPct  = xpNext ? Math.min(1, (xpCur - xpThis) / (xpNext - xpThis)) : 1;
    const xpBar  = document.getElementById('hud-xp-bar');
    const xpTxt  = document.getElementById('hud-xp-text');
    if (xpBar) xpBar.style.width = `${xpPct * 100}%`;
    if (xpTxt) xpTxt.textContent = xpNext ? `${xpCur} / ${xpNext} XP` : `${xpCur} XP · Max`;
  }

  openSheet() {
    const c = this.character;
    if (!c) return;
    document.getElementById('sheet-name-title').textContent = c.name;
    document.getElementById('s-race').textContent  = c.race;
    document.getElementById('s-class').textContent = c.class;
    document.getElementById('s-level').textContent = c.level;
    document.getElementById('s-bg').textContent    = c.background;
    // Portrait — show AI-generated image if available, otherwise SVG
    const ap = c.appearance || {};
    const frame   = document.getElementById('sheet-portrait-frame');
    const genImg  = document.getElementById('sheet-portrait-img');
    if (ap.portraitUrl && genImg) {
      genImg.src = ap.portraitUrl;
      genImg.classList.remove('hidden');
      const svg = frame?.querySelector('svg');
      if (svg) svg.style.display = 'none';
    } else {
      if (genImg) genImg.classList.add('hidden');
      frame.innerHTML = this._buildPortraitSVG(ap);
    }
    // Bind sheet portrait generate button
    const genBtn = document.getElementById('btn-gen-portrait-sheet');
    if (genBtn) {
      genBtn.onclick = () => this._generatePortraitFromSheet();
    }
    // Appearance summary
    const sAppear = document.getElementById('s-appearance');
    if (sAppear) {
      const parts = [
        ap.bodyType,
        ap.hairStyle && ap.hairColor?.name ? `${ap.hairStyle} ${ap.hairColor.name} hair` : ap.hairStyle,
        ap.eyeColor?.name ? `${ap.eyeColor.name} eyes` : null,
        ap.mark || null,
      ].filter(Boolean);
      sAppear.textContent = parts.length ? parts.join(' · ') : '—';
    }
    const sLangs = document.getElementById('s-languages');
    if (sLangs) sLangs.textContent = c.languages || 'Common';
    document.getElementById('s-ac').textContent    = c.ac;
    const initVal = c.initBonus ?? this._mod(c.stats.dex);
    document.getElementById('s-init').textContent  = (initVal >= 0 ? '+' : '') + initVal;
    document.getElementById('s-speed').textContent = `${c.speed} ft`;
    document.getElementById('s-prof').textContent  = `+${c.profBonus}`;
    // XP on sheet
    const thr2   = CharacterSystem.XP_THRESHOLDS;
    const xpNext2 = thr2[(c.level || 1) + 1];
    const sXP = document.getElementById('s-xp');
    if (sXP) sXP.textContent = xpNext2 ? `${c.xp || 0} / ${xpNext2}` : `${c.xp || 0} (Max)`;
    const sXPBar = document.getElementById('s-xp-bar');
    if (sXPBar) {
      const xpThis2 = thr2[c.level || 1] || 0;
      const frac = xpNext2 ? Math.min(1, ((c.xp || 0) - xpThis2) / (xpNext2 - xpThis2)) : 1;
      sXPBar.style.width = `${frac * 100}%`;
    }
    document.getElementById('s-hp').textContent    = c.currentHp;
    document.getElementById('s-hp-max').textContent= c.maxHp;
    const pct = Math.max(0, c.currentHp / c.maxHp);
    const bar = document.getElementById('s-hp-bar');
    bar.style.width      = `${pct * 100}%`;
    bar.style.background = pct > 0.6 ? 'var(--hp-high)' : pct > 0.3 ? 'var(--hp-mid)' : 'var(--hp-low)';

    // Ability grid
    const ag = document.getElementById('ability-grid');
    ag.innerHTML = ABILITY_NAMES.map(ab => {
      const score = c.stats[ab], mod = this._mod(score);
      return `<div class="ab-box">
        <div class="ab-name">${ABILITY_LABELS[ab]}</div>
        <div class="ab-score">${score}</div>
        <div class="ab-mod">${mod >= 0 ? '+' : ''}${mod}</div>
      </div>`;
    }).join('');

    // Saving throws
    const sv = document.getElementById('saving-throws');
    sv.innerHTML = ABILITY_NAMES.map(ab => {
      const prof = c.saves.includes(ab);
      const mod  = this._mod(c.stats[ab]) + (prof ? c.profBonus : 0);
      return `<div class="save-row">
        <div class="prof-dot dot-toggle ${prof ? 'proficient' : ''}" data-save="${ab}" title="Click to toggle proficiency"></div>
        <span>${ABILITY_LABELS[ab]}</span>
        <span class="bonus">${mod >= 0 ? '+' : ''}${mod}</span>
      </div>`;
    }).join('');
    sv.querySelectorAll('.dot-toggle[data-save]').forEach(dot => {
      dot.onclick = () => {
        const ab   = dot.dataset.save;
        const wasP = c.saves.includes(ab);
        if (wasP) c.saves = c.saves.filter(s => s !== ab);
        else      c.saves.push(ab);
        dot.classList.toggle('proficient', !wasP);
        const mod2    = this._mod(c.stats[ab]) + (!wasP ? c.profBonus : 0);
        const bonusEl = dot.closest('.save-row')?.querySelector('.bonus');
        if (bonusEl) bonusEl.textContent = (mod2 >= 0 ? '+' : '') + mod2;
      };
    });

    // Skills
    const allProf = new Set([
      ...c.bgSkills,
      ...(c.extraSkillProf || []),
    ]);
    const sl = document.getElementById('skills-list');
    sl.innerHTML = SKILLS.map(sk => {
      const isProf = allProf.has(sk.name);
      const mod    = this._mod(c.stats[sk.ab]) + (isProf ? c.profBonus : 0);
      return `<div class="skill-row">
        <div class="prof-dot dot-toggle ${isProf ? 'proficient' : ''}" data-skill="${sk.name}" title="Click to toggle proficiency"></div>
        <span>${sk.name} <span style="color:var(--text-dim);font-size:11px">(${ABILITY_LABELS[sk.ab]})</span></span>
        <span class="bonus">${mod >= 0 ? '+' : ''}${mod}</span>
      </div>`;
    }).join('');
    sl.querySelectorAll('.dot-toggle[data-skill]').forEach(dot => {
      dot.onclick = () => {
        if (!c.extraSkillProf) c.extraSkillProf = [];
        const name  = dot.dataset.skill;
        const skill = SKILLS.find(s => s.name === name);
        const inBg  = (c.bgSkills || []).includes(name);
        const inEx  = c.extraSkillProf.includes(name);
        const wasP  = inBg || inEx;
        if (wasP) { c.bgSkills = (c.bgSkills||[]).filter(s=>s!==name); c.extraSkillProf = c.extraSkillProf.filter(s=>s!==name); }
        else      { c.extraSkillProf.push(name); }
        dot.classList.toggle('proficient', !wasP);
        if (skill) {
          const mod2    = this._mod(c.stats[skill.ab]) + (!wasP ? c.profBonus : 0);
          const bonusEl = dot.closest('.skill-row')?.querySelector('.bonus');
          if (bonusEl) bonusEl.textContent = (mod2 >= 0 ? '+' : '') + mod2;
        }
      };
    });

    // Features
    const fl = document.getElementById('features-list');
    fl.innerHTML = (c.features || []).map(f =>
      `<div class="feature-item"><div class="feature-name">${f.name}</div><div class="feature-desc">${f.desc}</div></div>`
    ).join('');

    // Equipment
    const el = document.getElementById('equip-list');
    el.innerHTML = (c.equipment || []).map(e =>
      `<div class="equip-item"><span class="equip-icon">⚔</span>${e}</div>`
    ).join('');

    document.getElementById('char-notes').value = c.notes || '';
    // Wire contenteditable fields: select-all on focus, Enter = blur
    ['s-ac', 's-init', 's-speed'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.onfocus   = () => setTimeout(() => {
        const sel = window.getSelection(), r = document.createRange();
        r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);
      }, 0);
      el.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } };
    });
    const hpMaxEl = document.getElementById('s-hp-max');
    if (hpMaxEl) {
      hpMaxEl.onfocus   = () => setTimeout(() => {
        const sel = window.getSelection(), r = document.createRange();
        r.selectNodeContents(hpMaxEl); sel.removeAllRanges(); sel.addRange(r);
      }, 0);
      hpMaxEl.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); hpMaxEl.blur(); } };
      hpMaxEl.onblur    = () => {
        const val = parseInt(hpMaxEl.textContent);
        if (!isNaN(val) && val > 0) {
          c.maxHp = val;
          if (c.currentHp > c.maxHp) c.currentHp = c.maxHp;
          document.getElementById('s-hp').textContent = c.currentHp;
          const pct2  = Math.max(0, c.currentHp / c.maxHp);
          const hpBar = document.getElementById('s-hp-bar');
          if (hpBar) { hpBar.style.width = `${pct2*100}%`; hpBar.style.background = pct2 > 0.6 ? 'var(--hp-high)' : pct2 > 0.3 ? 'var(--hp-mid)' : 'var(--hp-low)'; }
        } else {
          hpMaxEl.textContent = c.maxHp;
        }
      };
    }
    // Ensure Stats tab is shown when sheet opens
    this._switchSheetTab('stats');
    document.getElementById('modal-char').classList.remove('hidden');
  }

  closeSheet() {
    const c = this.character;
    if (c) {
      c.notes = document.getElementById('char-notes').value;
      const acNum  = parseInt(document.getElementById('s-ac')?.textContent);
      if (!isNaN(acNum)) c.ac = acNum;
      const initTxt = (document.getElementById('s-init')?.textContent || '').replace('+', '').trim();
      const initNum = parseInt(initTxt);
      if (!isNaN(initNum)) c.initBonus = initNum;
      const speedTxt = (document.getElementById('s-speed')?.textContent || '').replace(/\s*ft\s*/i, '').trim();
      const speedNum = parseInt(speedTxt);
      if (!isNaN(speedNum) && speedNum > 0) c.speed = speedNum;
      const langs = document.getElementById('s-languages')?.textContent?.trim();
      if (langs) c.languages = langs;
    }
    document.getElementById('modal-char').classList.add('hidden');
  }

  // ── Sheet Tabs ───────────────────────────────────────────────
  _switchSheetTab(tab) {
    // Toggle panels
    document.getElementById('sheet-stats-panel').classList.toggle('hidden', tab !== 'stats');
    document.getElementById('sheet-spells-panel').classList.toggle('hidden', tab !== 'spells');
    // Toggle buttons
    document.getElementById('tab-stats-btn').classList.toggle('active', tab === 'stats');
    document.getElementById('tab-spells-btn').classList.toggle('active', tab === 'spells');
    if (tab === 'spells') this._loadSpellsTab();
  }

  async _loadSpellsTab() {
    const c = this.character;
    if (!c) return;
    const panel   = document.getElementById('sheet-spells-panel');
    const loading = document.getElementById('spells-loading');
    const content = document.getElementById('spells-content');

    // Non-spellcasters
    const spellcasters = new Set(['wizard','sorcerer','bard','cleric','druid','paladin','ranger','warlock']);
    if (!spellcasters.has(c.classId)) {
      loading.style.display = 'none';
      content.innerHTML = `<div class="spells-empty">
        ${c.class} is a non-spellcasting class with no spell list.
      </div>`;
      return;
    }

    // Already loaded for this class at this level
    const cacheKey = `${c.classId}-${c.level === 1 ? 'lv1' : 'all'}`;
    if (panel.dataset.loadedClass === cacheKey) return;

    loading.style.display = '';
    loading.textContent   = `Loading ${c.class} spells from Open5e…`;
    content.innerHTML     = '';

    try {
      await window.open5e.init();
      const isLevel1 = c.level === 1;
      const spells = isLevel1
        ? await window.open5e.getLevel1SpellsForClass(c.classId)
        : await window.open5e.getSpellsForClass(c.classId);
      panel.dataset.loadedClass = cacheKey;
      loading.style.display = 'none';

      if (!spells.length) {
        content.innerHTML = `<div class="spells-empty">No SRD spells found for ${c.class}.</div>`;
        return;
      }

      if (isLevel1) {
        content.innerHTML = `<div class="spells-level-note">⚔ Showing cantrips &amp; 1st-level spells — available at Level 1 (via Open5e SRD)</div>`;
      }

      // Group by level integer
      const byLevel = {};
      spells.forEach(sp => {
        const lvl = sp.level_int ?? 0;
        if (!byLevel[lvl]) byLevel[lvl] = [];
        byLevel[lvl].push(sp);
      });

      const levelLabel = lvl => (lvl === 0 || lvl === '0') ? 'Cantrips' : `Level ${lvl}`;

      const rows = Object.entries(byLevel)
        .sort(([a],[b]) => Number(a) - Number(b))
        .map(([lvl, list]) => {
          list.sort((a,b) => a.name.localeCompare(b.name));
          const spellRows = list.map(sp => {
            const school   = sp.school || '';
            const castTime = sp.casting_time || '';
            const range    = sp.range || '';
            const conc     = sp.concentration === 'yes' || sp.concentration === true ? ' · ⏳ Concentration' : '';
            const ritual   = sp.ritual === 'yes' || sp.ritual === true ? ' · 🔆 Ritual' : '';
            const safeName = (sp.name || '').replace(/"/g, '&quot;');
            const safeDesc = (sp.desc || '').slice(0, 120).replace(/"/g, '&quot;');
            return `<div class="spell-row" data-name="${safeName}" data-desc="${safeDesc}"
                        data-school="${school}" data-cast="${castTime}" data-range="${range}">
              <div class="spell-name">${sp.name}</div>
              <div class="spell-meta">${school}${castTime ? ' · ' + castTime : ''}${range ? ' · ' + range : ''}${conc}${ritual}</div>
            </div>`;
          }).join('');
          return `<div class="spell-level-group">
            <div class="spell-level-header">${levelLabel(lvl)} <span class="spell-level-count">(${list.length})</span></div>
            ${spellRows}
          </div>`;
        }).join('');

      content.innerHTML += rows;

      // Click to expand spell description
      content.querySelectorAll('.spell-row').forEach(row => {
        row.addEventListener('click', () => {
          const name  = row.dataset.name;
          const spell = spells.find(s => s.name === name);
          if (spell) this._showSpellCard(spell);
        });
      });
    } catch (err) {
      loading.style.display = 'none';
      content.innerHTML = `<div class="spells-empty">⚠ Could not load spells: ${err.message}<br><small>Check your internet connection.</small></div>`;
    }
  }

  _showSpellCard(sp) {
    const conc   = sp.concentration === 'yes' || sp.concentration === true;
    const ritual = sp.ritual       === 'yes' || sp.ritual       === true;
    const lvlStr = sp.level_int === 0 ? 'Cantrip' : `Level ${sp.level_int} spell`;
    const desc   = (sp.desc || '').replace(/\n/g, '<br>');
    const higher = sp.higher_level ? `<div class="spell-upcast"><strong>At Higher Levels:</strong> ${sp.higher_level}</div>` : '';
    const comps  = [sp.verbal ? 'V' : null, sp.somatic ? 'S' : null, sp.material ? 'M' : null].filter(Boolean).join(' ');

    // Reuse the item modal as a spell popup
    document.getElementById('item-title').textContent = sp.name;
    document.getElementById('item-body').innerHTML = `
      <div class="spell-card-meta">
        <span class="spell-card-tag">${lvlStr}</span>
        <span class="spell-card-tag">${sp.school || ''}</span>
        ${conc   ? '<span class="spell-card-tag warn">Concentration</span>' : ''}
        ${ritual ? '<span class="spell-card-tag ok">Ritual</span>'          : ''}
      </div>
      <div class="spell-card-grid">
        <div><span class="scd-label">Casting Time</span><span>${sp.casting_time || '—'}</span></div>
        <div><span class="scd-label">Range</span><span>${sp.range || '—'}</span></div>
        <div><span class="scd-label">Duration</span><span>${sp.duration || '—'}</span></div>
        <div><span class="scd-label">Components</span><span>${comps}${sp.material_text ? ' (' + sp.material_text + ')' : ''}</span></div>
      </div>
      <div class="spell-card-desc">${desc}</div>
      ${higher}`;
    document.getElementById('modal-item').classList.remove('hidden');
  }

  _adjustHP(delta) {
    if (!this.character) return;
    const amt   = parseInt(document.getElementById('sh-hp-amt').value) || 1;
    const change = delta > 0 ? amt : -amt;
    this.character.currentHp = Math.max(0, Math.min(this.character.maxHp, this.character.currentHp + change));
    this.openSheet();
    this.updateHUD();
    if (this.character.currentHp === 0) {
      window.app.showToast('⚠ You have fallen! You are at 0 HP.', 'error');
    }
  }

  applyHPChange(delta) {
    if (!this.character) return;
    this.character.currentHp = Math.max(0, Math.min(this.character.maxHp, this.character.currentHp + delta));
    this.updateHUD();
    if (this.character.currentHp === 0) {
      this._openDeathSaves();
    }
  }

  // Returns the total Perception bonus (WIS mod + proficiency if proficient)
  getPerceptionBonus() {
    const c = this.character;
    if (!c) return 0;
    const wisMod = this._mod(c.stats?.wis ?? 10);
    const allProf = new Set([...(c.bgSkills || [])]);
    const proficient = allProf.has('Perception') ||
      // Elves get racial Perception proficiency
      (c.race || '').toLowerCase() === 'elf';
    return wisMod + (proficient ? (c.profBonus || 2) : 0);
  }

  // ── Rest ─────────────────────────────────────────────────────
  _openRestModal() {
    if (!this.character) return;
    const c = this.character;
    const hd = c.hitDice || { die: 8, total: c.level || 1, spent: 0 };
    const avail = hd.total - hd.spent;
    document.getElementById('rest-hd-count').textContent = avail;
    document.getElementById('rest-hd-die').textContent   = `d${hd.die}`;
    document.getElementById('rest-hd-val').textContent   = Math.min(1, avail);
    document.getElementById('rest-short-result').textContent = '';
    document.getElementById('rest-hd-row').classList.add('hidden');
    document.getElementById('modal-rest').classList.remove('hidden');
    this._hdSpend = Math.min(1, avail);
  }

  _toggleShortRestControls() {
    const row = document.getElementById('rest-hd-row');
    row.classList.toggle('hidden');
  }

  _changeHDSpend(delta) {
    if (!this.character) return;
    const hd = this.character.hitDice;
    const avail = (hd.total - hd.spent);
    this._hdSpend = Math.max(1, Math.min(avail, (this._hdSpend || 1) + delta));
    document.getElementById('rest-hd-val').textContent = this._hdSpend;
  }

  _doShortRest() {
    const c = this.character;
    if (!c) return;
    const hd = c.hitDice;
    const avail = hd.total - hd.spent;
    const n = Math.min(this._hdSpend || 1, avail);
    if (n <= 0) { window.app.showToast('No Hit Dice remaining!', 'error'); return; }
    let gain = 0;
    for (let i = 0; i < n; i++) {
      gain += Math.floor(Math.random() * hd.die) + 1;
    }
    gain += this._mod(c.stats.con) * n;
    gain  = Math.max(n, gain); // minimum 1 HP per die
    c.currentHp = Math.min(c.maxHp, c.currentHp + gain);
    hd.spent += n;
    document.getElementById('rest-short-result').textContent = `+${gain} HP`;
    this.updateHUD();
    window.app.showToast(`Short rest: +${gain} HP (${n}d${hd.die} spent)`, 'success');
    window.aiSystem?.addSystemMessage(`🌙 ${c.name} takes a short rest and recovers ${gain} HP.`);
  }

  _doLongRest() {
    const c = this.character;
    if (!c) return;
    const healed = c.maxHp - c.currentHp;
    c.currentHp = c.maxHp;
    c.hitDice.spent = 0; // all hit dice restored
    document.getElementById('modal-rest').classList.add('hidden');
    this.updateHUD();
    window.app.showToast(`Long rest: fully restored!`, 'success');
    window.aiSystem?.addSystemMessage(`🌟 ${c.name} takes a long rest and wakes fully restored.`);
  }

  // ── Death Saves ──────────────────────────────────────────────
  _openDeathSaves() {
    this._deathSuccesses = 0;
    this._deathFailures  = 0;
    this._deathRolls     = 0;
    this._resetDeathDots();
    document.getElementById('death-roll-result').className = 'death-roll-result hidden';
    const rollBtn = document.getElementById('btn-death-roll');
    rollBtn.disabled = false;
    rollBtn.textContent = '🎲 Roll d20 (3 left)';
    document.getElementById('modal-death').classList.remove('hidden');
    window.aiSystem?.addSystemMessage('💀 You drop to 0 HP! Roll death saving throws (3 rolls total)!');
  }

  _resetDeathDots() {
    ['death-success-dots','death-fail-dots'].forEach(id => {
      document.getElementById(id).querySelectorAll('.dt-dot').forEach(d => {
        d.className = 'dt-dot';
      });
    });
  }

  _rollDeathSave() {
    const roll    = Math.floor(Math.random() * 20) + 1;
    const el      = document.getElementById('death-roll-result');
    const rollBtn = document.getElementById('btn-death-roll');
    el.className  = 'death-roll-result';

    if (roll === 20) {
      // Nat 20 — instant revive with 1 HP
      this.character.currentHp = 1;
      document.getElementById('modal-death').classList.add('hidden');
      this.updateHUD();
      rollBtn.textContent = '🎲 Roll d20';
      window.app.showToast('Natural 20! You regain 1 HP!', 'success');
      window.aiSystem?.addSystemMessage(`⚡ Natural 20 on a death save — ${this.character.name} surges back with 1 HP!`);
      return;
    }

    this._deathRolls++;

    if (roll === 1) {
      this._deathFailures += 2;
      el.textContent = `Rolled 1 — Critical Failure! (2 failures)`;
      el.style.color = 'var(--red-lt)';
    } else if (roll >= 10) {
      this._deathSuccesses++;
      el.textContent = `Rolled ${roll} — Success!`;
      el.style.color = 'var(--green-lt)';
    } else {
      this._deathFailures++;
      el.textContent = `Rolled ${roll} — Failure`;
      el.style.color = 'var(--red-lt)';
    }

    // Fill dots
    const fillDots = (containerId, count) => {
      document.getElementById(containerId).querySelectorAll('.dt-dot').forEach((d, i) => {
        d.className = 'dt-dot' + (i < count ? ' filled' : '');
      });
    };
    fillDots('death-success-dots', Math.min(this._deathSuccesses, 3));
    fillDots('death-fail-dots',    Math.min(this._deathFailures,  3));

    const resolved = this._deathSuccesses >= 2 || this._deathFailures >= 2 || this._deathRolls >= 3;

    if (!resolved) {
      const left = 3 - this._deathRolls;
      rollBtn.textContent = `🎲 Roll d20 (${left} left)`;
      return;
    }

    rollBtn.disabled    = true;
    rollBtn.textContent = '🎲 Roll d20';

    setTimeout(() => {
      document.getElementById('modal-death').classList.add('hidden');
      if (this._deathSuccesses >= 2 || this._deathSuccesses > this._deathFailures) {
        this.character.currentHp = 1;
        this.updateHUD();
        window.app.showToast('You survive with 1 HP!', 'success');
        window.aiSystem?.addSystemMessage(`🙏 ${this.character.name} clings to life and stabilises with 1 HP!`);
      } else {
        window.aiSystem?._handleDeath();
      }
    }, 900);
  }

  // ── Portrait SVG ─────────────────────────────────────────────
  _buildPortraitSVG(ap, size = 80) {
    const skin  = ap?.skinTone?.color  || '#3a3020';
    const hair  = ap?.hairColor?.color || '#1a1008';
    const eye   = ap?.eyeColor?.color  || '#3d2008';
    const style = ap?.hairStyle        || 'short';

    // Hair paths by style
    const hairPaths = {
      shaved:  '',
      short:   `<path d="M24 26 Q24 10 40 10 Q56 10 56 26 Q52 16 40 16 Q28 16 24 26" fill="${hair}"/>`,
      medium:  `<path d="M24 26 Q22 10 40 10 Q58 10 56 26 Q54 20 40 20 Q26 20 24 26" fill="${hair}"/>
                <path d="M24 26 Q18 34 20 48 Q22 38 26 34" fill="${hair}"/>
                <path d="M56 26 Q62 34 60 48 Q58 38 54 34" fill="${hair}"/>`,
      long:    `<path d="M24 26 Q22 10 40 10 Q58 10 56 26 Q54 18 40 18 Q26 18 24 26" fill="${hair}"/>
                <path d="M22 30 Q16 50 20 70 Q24 55 24 40" fill="${hair}"/>
                <path d="M58 30 Q64 50 60 70 Q56 55 56 40" fill="${hair}"/>`,
      braided: `<path d="M24 26 Q22 10 40 10 Q58 10 56 26 Q54 18 40 18 Q26 18 24 26" fill="${hair}"/>
                <path d="M36 44 Q34 55 36 66 Q38 55 40 66 Q42 55 44 66 Q46 55 44 44" fill="${hair}" opacity="0.9"/>`,
      curly:   `<circle cx="28" cy="20" r="6" fill="${hair}"/>
                <circle cx="36" cy="14" r="7" fill="${hair}"/>
                <circle cx="44" cy="14" r="7" fill="${hair}"/>
                <circle cx="52" cy="20" r="6" fill="${hair}"/>`,
      wild:    `<path d="M22 28 Q18 6 36 8 Q26 12 28 22" fill="${hair}"/>
                <path d="M40 8 Q40 4 44 8 Q48 4 52 10 Q56 6 58 16" fill="${hair}"/>
                <path d="M58 28 Q62 6 48 8 Q54 14 52 24" fill="${hair}"/>`,
    };
    const hairSVG = hairPaths[style] || hairPaths.short;

    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${hairSVG}
      <circle cx="40" cy="28" r="16" fill="${skin}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
      <ellipse cx="35" cy="27" rx="3" ry="3.5" fill="${eye}"/>
      <ellipse cx="45" cy="27" rx="3" ry="3.5" fill="${eye}"/>
      <ellipse cx="35" cy="27" rx="1.5" ry="1.5" fill="#000" opacity="0.7"/>
      <ellipse cx="45" cy="27" rx="1.5" ry="1.5" fill="#000" opacity="0.7"/>
      <path d="M36 33 Q40 36 44 33" fill="none" stroke="${skin}" stroke-width="1.2" opacity="0.6"/>
      <path d="M10 ${size} Q40 ${size * 0.65} 70 ${size}" fill="${skin}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
    </svg>`;
  }

  // D&D 5e XP thresholds — minimum XP required to reach each level (index = level)
  static get XP_THRESHOLDS() {
    return [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000,
            64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
  }

  static profBonusForLevel(level) {
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9)  return 4;
    if (level >= 5)  return 3;
    return 2;
  }

  gainXP(amount) {
    if (!this.character) return;
    this.character.xp = (this.character.xp || 0) + amount;
    const thr = CharacterSystem.XP_THRESHOLDS;
    let newLevel = 1;
    for (let i = thr.length - 1; i >= 1; i--) {
      if (this.character.xp >= thr[i]) { newLevel = i; break; }
    }
    newLevel = Math.min(newLevel, 20);

    if (newLevel > this.character.level) {
      this.character.level    = newLevel;
      this.character.profBonus = CharacterSystem.profBonusForLevel(newLevel);
      if (this.character.hitDice) this.character.hitDice.total = newLevel;
      this._openLevelUpModal(newLevel);
    } else {
      const nextThr = thr[Math.min(this.character.level + 1, 20)];
      const remaining = nextThr ? nextThr - this.character.xp : 0;
      const msg = remaining > 0
        ? `+${amount} XP · ${remaining} to next level`
        : `+${amount} XP · Max level!`;
      window.app.showToast(msg, 'success');
    }
    this.updateHUD();
  }

  _openLevelUpModal(newLevel) {
    const c = this.character;
    const hpDie  = c.features ? (CLASSES.find(cl => cl.id === c.classId)?.hpDie || 8) : 8;
    const conMod = this._mod(c.stats.con);
    const avg    = Math.floor(hpDie / 2) + 1 + conMod;  // standard avg (e.g. d8 → 5 + con)

    document.getElementById('levelup-badge').textContent  = newLevel;
    document.getElementById('levelup-sub').textContent    = `You have reached Level ${newLevel}!`;
    document.getElementById('levelup-hp-hint').textContent =
      `Roll a d${hpDie}${conMod >= 0 ? ' +' : ' '}${conMod} CON`;
    document.getElementById('levelup-avg-hint').textContent =
      `(${avg} HP guaranteed)`;
    document.getElementById('levelup-hp-result').textContent = '';
    document.getElementById('levelup-hp-result').className  = 'levelup-hp-result hidden';

    const rollBtn   = document.getElementById('btn-levelup-roll');
    rollBtn.disabled    = false;
    rollBtn.textContent = '🎲 Roll HP';
    rollBtn._rollCount  = 0;

    const confirmBtn = document.getElementById('btn-levelup-confirm');
    confirmBtn.disabled = true;
    let hpGain = 0;

    const applyGain = (gain) => {
      hpGain = Math.max(1, gain);
      const el = document.getElementById('levelup-hp-result');
      el.textContent = `+${hpGain} HP`;
      el.className   = 'levelup-hp-result';
      confirmBtn.disabled = false;
    };

    document.getElementById('btn-levelup-roll').onclick = () => {
      const rollBtn = document.getElementById('btn-levelup-roll');
      const rolls   = (rollBtn._rollCount = (rollBtn._rollCount || 0) + 1);
      const roll    = Math.floor(Math.random() * hpDie) + 1;
      applyGain(roll + conMod);
      if (rolls >= 2) {
        rollBtn.disabled    = true;
        rollBtn.textContent = '🎲 No more rolls';
      }
    };

    document.getElementById('btn-levelup-avg').onclick = () => {
      applyGain(avg);
    };

    confirmBtn.onclick = () => {
      c.maxHp     += hpGain;
      c.currentHp += hpGain;
      document.getElementById('modal-levelup').classList.add('hidden');
      this.updateHUD();
      window.app.showToast(`🎉 Level ${newLevel}! +${hpGain} HP`, 'success');
      window.aiSystem?.addSystemMessage(`🎉 ${c.name} reached Level ${newLevel} and gained ${hpGain} HP!`);
    };

    document.getElementById('modal-levelup').classList.remove('hidden');
  }
}

window.characterSystem = new CharacterSystem();

// ── Premade Characters ────────────────────────────────────────────────────────
// 8 ready-to-play characters covering common D&D archetypes.
// stats are BASE values before racial ability bonus is applied.
const PREMADE_CHARACTERS = [
  {
    id: 'thorin',
    name: 'Thorin Ironwall',
    raceId: 'dwarf',
    classId: 'fighter',
    backgroundId: 'soldier',
    icon: '⚔',
    tagline: 'Dwarven Warrior',
    desc: 'A battle-scarred dwarf veteran who has fought in a dozen campaigns. Tough as mountain stone and twice as stubborn.',
    stats: { str:16, dex:10, con:14, int:10, wis:11, cha:8 },
    skills: ['Athletics','Intimidation'],
    attacks: ['Longsword (1d8 slashing)','Handaxe (1d6 slashing)','Heavy Crossbow (1d10 piercing)'],
    extraItems: ['Shield','Chain Mail','Dungeoneer\'s Pack'],
    languages: 'Common, Dwarvish',
    appearance: { bodyType:'muscular', skinTone:'#9a9a9c', hairStyle:'short', hairColor:'#3d2008', eyeColor:'#7a5828', mark:'Battle scar across left cheek' },
  },
  {
    id: 'seraphina',
    name: 'Seraphina Dawnwhisper',
    raceId: 'aasimar',
    classId: 'cleric',
    backgroundId: 'acolyte',
    icon: '✨',
    tagline: 'Celestial Healer',
    desc: 'Born touched by celestial light, Seraphina serves as a conduit for divine grace. Her healing hands have brought many back from death\'s door.',
    stats: { str:8, dex:10, con:13, int:12, wis:15, cha:14 },
    skills: ['Insight','Religion'],
    attacks: ['Mace (1d6 bludgeoning)','Sacred Flame — cantrip (1d8 radiant)','Toll the Dead — cantrip (1d8/1d12 necrotic)'],
    extraItems: ['Holy Water ×2','Prayer Beads','Healing Kit'],
    languages: 'Common, Celestial',
    appearance: { bodyType:'slight', skinTone:'#f0dfc4', hairStyle:'long', hairColor:'#ece8e0', eyeColor:'#a0b0c0', mark:'Faint golden glow at brow' },
  },
  {
    id: 'zara',
    name: 'Zara Nightshade',
    raceId: 'tiefling',
    classId: 'warlock',
    backgroundId: 'criminal',
    icon: '🌑',
    tagline: 'Infernal Pact-Maker',
    desc: 'A tiefling street thief who struck a desperate pact with a fiend. Now she wields eldritch power — but at what cost?',
    stats: { str:8, dex:14, con:13, int:13, wis:10, cha:14 },
    skills: ['Deception','Intimidation'],
    attacks: ['Eldritch Blast — cantrip (1d10 force)','Hex (extra 1d6 necrotic)','Dagger (1d4 piercing)'],
    extraItems: ['Arcane Focus (orb)','Dark Robes','Eldritch Tome'],
    languages: 'Common, Infernal',
    appearance: { bodyType:'slight', skinTone:'#6b3f20', hairStyle:'wild', hairColor:'#1a1848', eyeColor:'#6848a0', mark:'Curved horns, arrow-tipped tail' },
  },
  {
    id: 'elaryn',
    name: 'Elaryn Swiftstep',
    raceId: 'elf',
    classId: 'rogue',
    backgroundId: 'entertainer',
    icon: '🗡',
    tagline: 'Shadow Dancer',
    desc: 'A nimble elven acrobat turned thief. Elaryn moves like smoke and strikes before her target even knows she\'s there.',
    stats: { str:8, dex:16, con:12, int:13, wis:12, cha:12 },
    skills: ['Acrobatics','Stealth','Perception','Deception'],
    attacks: ['Shortsword (1d6 piercing)','Sneak Attack (extra 1d6 piercing)','Hand Crossbow (1d6 piercing)'],
    extraItems: ['Thieves\' Tools','Dark Cloak','Caltrops'],
    languages: 'Common, Elvish',
    appearance: { bodyType:'slight', skinTone:'#e3c49a', hairStyle:'long', hairColor:'#1a1848', eyeColor:'#4878b0', mark:'Delicate silver ear-cuff with a tiny blade charm' },
  },
  {
    id: 'grak',
    name: 'Grak Stonehide',
    raceId: 'halforc',
    classId: 'barbarian',
    backgroundId: 'outlander',
    icon: '🪓',
    tagline: 'Raging Berserker',
    desc: 'Raised among the wild steppes, Grak\'s fury is a force of nature. He charges headlong into battle with a thunderous roar.',
    stats: { str:16, dex:12, con:15, int:8, wis:10, cha:8 },
    skills: ['Athletics','Intimidation'],
    attacks: ['Greataxe (1d12 slashing)','Reckless Attack','Handaxe (1d6 slashing)'],
    extraItems: ['Bear Pelt Cloak','Healing Potion','Trophy Necklace'],
    languages: 'Common, Orc',
    appearance: { bodyType:'muscular', skinTone:'#4a2010', hairStyle:'wild', hairColor:'#1a1008', eyeColor:'#3d2008', mark:'Clan brands on both arms' },
  },
  {
    id: 'pip',
    name: 'Pip Tumblebottom',
    raceId: 'halfling',
    classId: 'bard',
    backgroundId: 'folk_hero',
    icon: '🎵',
    tagline: 'Merry Storyteller',
    desc: 'This cheerful halfling bard has sung in hundred taverns and talked his way out of a thousand scrapes. His luck is almost magical.',
    stats: { str:8, dex:14, con:12, int:12, wis:10, cha:15 },
    skills: ['Performance','Persuasion','Deception'],
    attacks: ['Rapier (1d8 piercing)','Vicious Mockery — cantrip (1d4 psychic)','Dagger (1d4 piercing)'],
    extraItems: ['Lute','Fine Wine ×2','Disguise Kit'],
    languages: 'Common, Halfling',
    appearance: { bodyType:'slight', skinTone:'#c8906a', hairStyle:'curly', hairColor:'#7a4420', eyeColor:'#c89030', mark:'Permanent ink stains on fingers' },
  },
  {
    id: 'aldric',
    name: 'Aldric Spellweave',
    raceId: 'human',
    classId: 'wizard',
    backgroundId: 'sage',
    icon: '📚',
    tagline: 'Arcane Scholar',
    desc: 'A meticulous human scholar who spent decades in the great library before the call of adventure proved too strong. His spellbook is annotated in three languages.',
    stats: { str:7, dex:12, con:13, int:16, wis:12, cha:9 },
    skills: ['Arcana','History'],
    attacks: ['Fire Bolt — cantrip (1d10 fire)','Ray of Frost — cantrip (1d8 cold)','Magic Missile (3× 1d4+1 force)'],
    extraItems: ['Crystal Ball','Arcane Tome','Wand of Magic Missiles'],
    languages: 'Common, Elvish, Dwarvish',
    appearance: { bodyType:'slight', skinTone:'#e3c49a', hairStyle:'medium', hairColor:'#b0b8c0', eyeColor:'#788090', mark:'Arcane sigil tattooed on right palm' },
  },
  {
    id: 'sylvara',
    name: 'Sylvara Moonbow',
    raceId: 'halfelf',
    classId: 'ranger',
    backgroundId: 'outlander',
    icon: '🏹',
    tagline: 'Elven Archer',
    desc: 'Half-elven and wholly at home in the wild, Sylvara can track a ghost through stone. Her arrows rarely miss.',
    stats: { str:12, dex:17, con:13, int:10, wis:14, cha:10 },
    skills: ['Perception','Survival','Stealth'],
    attacks: ['Longbow (1d8 piercing)','Shortsword (1d6 piercing)','Hunter\'s Mark (extra 1d6)'],
    extraItems: ['Hunting Trap','Camouflage Cloak','Compass'],
    languages: 'Common, Elvish, Sylvan',
    appearance: { bodyType:'athletic', skinTone:'#c8906a', hairStyle:'braided', hairColor:'#d4a640', eyeColor:'#3a7840', mark:'Green ivy tattoo winding up left forearm' },
  },
];

// Attach premade data and helper to the system instance
window.characterSystem.PREMADE_CHARACTERS = PREMADE_CHARACTERS;

CharacterSystem.prototype.loadPremade = function(premadeId) {
  const premade = PREMADE_CHARACTERS.find(p => p.id === premadeId);
  if (!premade) return;

  const race       = RACES.find(r => r.id === premade.raceId);
  const cls        = CLASSES.find(c => c.id === premade.classId);
  const background = BACKGROUNDS.find(b => b.id === premade.backgroundId);

  this._selections = {
    name:       premade.name,
    race,
    cls,
    background,
    appearance: { ...premade.appearance, portraitUrl: undefined },
    stats:      { ...premade.stats },
    skills:     [...premade.skills],
    skillBonuses: {},
    languages:  premade.languages || (race?.lang ?? 'Common'),
    acOverride:   null,
    initOverride: null,
    attacks:    [...premade.attacks],
    extraItems: [...premade.extraItems],
  };

  this._finalize();
};
