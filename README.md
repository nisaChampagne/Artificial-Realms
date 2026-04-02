# ![Artificial Realms](./title.png)

> *An AI-powered Dungeons & Dragons interactive experience built with Electron.*

[![Build and Release](https://github.com/nisaChampagne/Artificial-Realms/actions/workflows/release.yaml/badge.svg)](https://github.com/nisaChampagne/Artificial-Realms/actions/workflows/release.yaml)
[![Version](https://img.shields.io/github/v/release/nisaChampagne/Artificial-Realms?color=gold&label=version)](https://github.com/nisaChampagne/Artificial-Realms/releases/latest)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/electron-28-47848F)

<div align="center">

### ⚔️ *The Adventure Awaits* ⚔️

*Create your hero. Roll the dice. Let an AI Dungeon Master guide you through limitless adventures.*

</div>

---

## 📖 Table of Contents

- [What is Artificial Realms?](#-what-is-artificial-realms)
- [Core Features](#-core-features)
- [Premade Heroes](#-premade-heroes)
- [Requirements](#-requirements)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Release Notes](#-release-notes)

---

## 🎲 What is Artificial Realms?

Artificial Realms brings the tabletop experience to your desktop. Powered by OpenAI's Chat Completions API (or a fully scripted demo mode), it delivers **authentic D&D 5th Edition mechanics** with the narrative freedom of a human Dungeon Master.

Create characters, explore atmospheric dungeons, engage in tactical combat, cast powerful spells, and make choices that shape your story — all narrated by an AI that never cancels game night.

---

## ⚔️ Core Features

### 🧙 **Character Creation & Customization**
- **8-step character wizard** — name, race, class, background, appearance, proficiencies, ability scores, and final review
- **8 premade heroes** — instantly playable characters covering all major archetypes (Fighter, Wizard, Rogue, Cleric, etc.)
- **Layered SVG portraits** — procedurally generated character art based on your appearance choices
- **Character import/export** — save characters as JSON files to share, backup, or import into new campaigns
- **Full D&D 5e mechanics** — accurate ability scores, saving throws, skill proficiencies, and class features

### ⚔️ **Combat & Dice**
- **Initiative system** — roll initiative at combat start; turn order tracked automatically with action reset per turn
- **Action economy** — action, bonus action, and **reaction** tracking with visual indicators; click any pill to manually mark it used or available (reactions trigger on *enemy* turns — Shield, Opportunity Attack, Counterspell, Hellish Rebuke)
- **Death saving throws** — three strikes and you're out (or revived!)
- **Attack rolls vs AC** — realistic 1d20 + modifiers against enemy Armor Class
- **Critical hits** — double dice damage (RAW D&D 5e rules)
- **Quick combat actions** — Attack, Dodge, Hide, Help, Assess, Persuade (no typing required)
- **Animated dice roller** — roll d4, d6, d8, d10, d12, d20, d100 with advantage/disadvantage support

### ✨ **Magic & Spellcasting**
- **Spell slots** — accurate D&D 5e progression for all 9 spellcaster classes
- **Spell consumption** — slots automatically consumed when casting; restored on long rest
- **Ritual casting** — cast ritual-tagged spells without consuming a slot (10 minutes, no combat); DM uses `[RITUAL:SpellName]` to log it clearly
- **Concentration tracking** — cast a concentration spell and take damage? Roll a CON save or lose the spell
- **Spell Save DC** — auto-calculated (8 + proficiency bonus + spellcasting modifier)
- **Class resources** — Second Wind (Fighter), Rage (Barbarian), Ki Points (Monk), Channel Divinity (Cleric), Lay on Hands (Paladin), Bardic Inspiration (Bard)

### 🛡️ **Conditions & Status Effects**
- **D&D 5e conditions** — Poisoned, Stunned, Frightened, Blinded, Paralyzed, Restrained, etc.
- **Duration tracking** — conditions expire automatically based on turn count
- **Temporary HP** — damage absorption shield (doesn't stack, absorbed before real HP)
- **Inspiration** — DM-awarded for excellent roleplay; spend for advantage on any d20 roll

### 📜 **Campaign Memory & Journal**
- **NPC tracking** — automatically logs NPCs with roles and attitudes (Friendly, Hostile, Neutral)
- **Lore discoveries** — world facts and secret knowledge revealed through exploration
- **Key decisions** — narrative choices that shaped your journey
- **Quest system** — quests are logged only when you *accept* them (not when offered); tracks active/completed/failed status
- **AI memory integration** — journal context is fed to the AI so it remembers your story

### 🏆 **Achievements**
- **Per-character milestones** — unlock achievements like "First Blood," "Boss Slayer," "Lore Hunter," "Quest Master"
- **Progress tracking** — each saved character maintains separate achievement progress
- **29+ achievements** — across 7 categories: Combat, Survival, Progression, Wealth, Inventory, Exploration, and Narrative

### 🌍 **World State**
- **Time of day** — Dawn, Morning, Afternoon, Dusk, Evening, Night with gameplay and audio effects
- **Dynamic weather** — Clear, Cloudy, Rain, Storm, Fog, Snow with mechanical consequences (disadvantage on perception in rain, difficult terrain in snow)
- **Day tracking** — campaign day counter fed to the AI for narrative continuity
- **Weather audio** — dynamic rain and storm ambient sounds

### 🎮 **Quality of Life**
- **Character sheets** — parchment-styled stat blocks with subclass badge, level-tagged abilities, portrait, skills, equipment, proficiencies, XP bar, **Passive Perception**, and **Passive Investigation**
- **Passive scores** — Passive Perception and Passive Investigation displayed on sheet and sent to the AI; the DM uses them automatically to reveal traps, hidden creatures, and environmental clues without a roll when the DC is low enough
- **Attunement system** — magic items requiring attunement now enforce the 3-slot cap; Attune/Unattune button in the item inspector; attunement counter in the inventory header
- **Short rest** — hit dice controls expand automatically when the rest modal opens; no extra click required
- **Subclass display** — chosen subclass appears in the sheet meta grid once selected; class features sorted by subclass → level gained → background traits
- **Mini HP bar** — always-visible health indicator in the game toolbar
- **Keyboard shortcuts** — `1`-`9` (choices), `W/A/S/D` & arrow keys (map movement), `M` (minimap toggle), `C` (character sheet), `J` (journal), `I` (inventory), `Esc` (close modals)
- **Scene-aware audio** — ambient music shifts dynamically (dungeon, tavern, forest, combat, boss fight, rest)
- **Minimap** — living top-down canvas map that reacts to the story: named location labels, WASD/arrow movement, fog of war, footprint trail, NPC wander, weather overlay, room labels, wall collision effects, and a red pulsing combat border while enemies are active
- **Floating combat text** — damage and healing numbers float above characters in real time
- **Auto-update** — in-app notifications when new versions are available

### 🤖 **AI Dungeon Master**
- **Multi-provider support** — OpenAI, Azure OpenAI, Ollama, or any OpenAI-compatible endpoint
- **Live streaming responses** — watch the story unfold word-by-word as the AI narrates
- **Demo mode** — fully scripted adventure (no API key required) from tavern to boss fight
- **Campaign types** — Quick (~1 hour), Standard (3–4 hours), Epic (8+ hours), or Custom
- **Difficulty settings** — Cozy (3d6 stats), Adventure (2d6), Hard (1d6)
- **Scene-synced transitions** — map and audio wait for AI response before updating location
- **Optional TTS narration** — text-to-speech with configurable voice and speed
- **Connection test** — verify your API key and model before starting a campaign

### 💾 **Save System**
- **Multiple save slots** — Slot 1, Slot 2, Slot 3, plus auto-save
- **Auto-save** — game state saved every 5 minutes
- **Full save/load** — character, story progress, journal, inventory, achievements, world state
- **Import/export** — share saves as JSON files or transfer between computers

---

## 🛡️ Premade Heroes

Select a hero on the Campaign screen for instant adventure — no character creation required.

| 🎭 **Hero** | 🧬 **Race** | ⚔️ **Class** | 🎯 **Playstyle** |
|-------------|-------------|---------------|-------------------|
| **Thorin Ironwall** | Dwarf | Fighter | Tank / frontline protector |
| **Seraphina Dawnwhisper** | Aasimar | Cleric | Divine healer / support caster |
| **Zara Nightshade** | Tiefling | Warlock | Eldritch blaster / dark trickster |
| **Elaryn Swiftstep** | Elf | Rogue | Stealth assassin / skill master |
| **Grak Stonehide** | Half-Orc | Barbarian | Raging berserker / brutal striker |
| **Pip Tumblebottom** | Halfling | Bard | Charismatic face / party buffer |
| **Aldric Spellweave** | Human | Wizard | Arcane controller / ritual caster |
| **Sylvara Moonbow** | Half-Elf | Ranger | Precision archer / wilderness scout |

---

## 📋 Requirements

| **Component** | **Version** |
|---------------|-------------|
| Node.js | 20 LTS or later |
| npm | 9+ |
| Windows | 10 / 11 (x64) |

---

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/nisaChampagne/Artificial-Realms.git
cd Artificial-Realms

# Install dependencies
npm install

# Run in development mode
npm start
```

### Demo Mode (No API Key)

1. Launch the app
2. Go to **Settings**
3. Enable **Demo Mode**
4. Start a new campaign

Experience a fully scripted adventure from tavern briefing through dungeon exploration to an epic boss fight — completely free, no API key required.

### Using Your Own AI

1. Open **Settings** from the main menu
2. Paste your [OpenAI API key](https://platform.openai.com/api-keys)
3. Select a model (`gpt-4o` recommended for best results)
4. Disable **Demo Mode**
5. Test your connection (optional but recommended)
6. Start your campaign and enjoy limitless AI-powered adventures!

**Supported Providers:**
- OpenAI (gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
- Azure OpenAI
- Ollama (local LLM hosting)
- Any OpenAI-compatible endpoint

---

## 🗂️ Project Structure

```
Artificial-Realms/
├── main.js                    # Electron main process & IPC handlers
├── preload.js                 # Context bridge for secure IPC
├── forge.config.js            # Electron Forge build configuration
├── package.json               # Dependencies & build scripts
├── src/
│   ├── index.html             # App shell & all modal HTML
│   ├── css/
│   │   └── styles.css         # Complete dark fantasy theme
│   └── js/
│       ├── app.js             # Screen management, shortcuts, lifecycle
│       ├── ai.js              # AI integration, demo mode, response parser
│       ├── character.js       # Character wizard, sheet, combat system
│       ├── dice.js            # Animated dice roller (Canvas API)
│       ├── audio.js           # Scene-aware ambient music controller
│       ├── map.js             # Dynamic minimap renderer
│       ├── inventory.js       # Item & currency management
│       ├── journal.js         # Campaign memory (NPCs, lore, quests)
│       ├── achievements.js    # Milestone tracking system
│       ├── worldstate.js      # Time, weather, world conditions
│       ├── open5e.js          # Open5e API (spells, monsters, items)
│       └── save.js            # Save/load system with import/export
├── assets/
│   ├── icon.png               # App icon (256×256)
│   └── icon.ico               # Windows installer icon
├── scripts/
│   ├── generate-icon.js       # Icon generation utility
│   └── generate-ico.js        # ICO format converter
└── .github/
    └── workflows/
        └── release.yaml       # Automated build & release CI/CD
```

---

## 📦 Release Notes

### **Latest Release: v3.2.0**

**v3.2.0 — Core 5e Systems Update**

Five D&D 5e mechanics that were previously implicit are now explicit and surfaced in the UI:

- **Reaction tracking** — Action economy pills (Action / Bonus / Reaction) are now clickable. Click any pill to manually mark it used or available. Critical for reactions like Shield, Opportunity Attack, Counterspell, and Hellish Rebuke, which trigger on *enemy* turns outside the normal turn flow.
- **Ritual casting** — Spellcasters can cast ritual-tagged spells (Detect Magic, Identify, Find Familiar, Alarm, etc.) without consuming a spell slot. The DM uses a new `[RITUAL:SpellName]` tag; the chat log records it clearly with a distinct icon and "no slot consumed" note.
- **Attunement system** — Magic items requiring attunement now enforce the RAW 3-slot cap. Inspect any magic item to see an Attune / Unattune button. The inventory header shows a live count (`✨ Attunement: 2/3`), turning red when all slots are full.
- **Short rest UX** — The hit dice controls in the rest modal now auto-expand when opened (no second click required). The description shows exactly how many dice you have available. Controls collapse automatically if you have none remaining.
- **Passive Perception & Investigation** — Both passive scores (10 + modifier) are now displayed on the character sheet and included in the AI's system prompt on every message. New DM instructions teach the AI to use them automatically — if a trap's detection DC is at or below your Passive Perception, you notice it without rolling.

---

### **v3.1.0**
- Map enhancements and minimap improvements

### **v3.0.0**
- Subclass system — choose your archetype at the right level; shown on character sheet with gold badge and sorted feature display
- Living minimap — named location labels, combat pulse border, attitude-colored NPC labels, enemy cleanup on combat end
- Demo mode stability — scenes only change on true location transitions, not on every narrative choice
- Wall collision interactions — bump animation, thud sound, screen flash, dust particles
- WASD/arrow key movement with fog of war reveal; M key toggles minimap
- Floating damage and healing text above map entities
- Room labels via BFS flood fill; atmospheric particles per scene; weather, footprint trail, enemy/NPC wander
- `[LOCATION:Name]` tag — AI can name the specific place ("The Tarnished Flagon") not just the scene type ("tavern")

Releases are built automatically via GitHub Actions when you create a new release tag.

**Build Process:**
1. Checkout repository on `windows-latest`
2. Install dependencies (`npm ci`)
3. Build with Electron Forge (`npm run make`)
4. Upload `ArtificialRealms-{version}-Setup.exe` as release asset

**To Cut a New Release:**
```bash
# 1. Update version in package.json
npm version patch  # or minor, or major

# 2. Push and tag
git push && git push --tags

# 3. Create GitHub Release with the new tag
# The workflow triggers automatically and builds the installer
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Electron 28** | Cross-platform desktop framework |
| **Vanilla JavaScript (ES6+)** | No React/Vue — pure DOM manipulation for speed |
| **Canvas API** | Animated dice physics and rendering |
| **Web Audio API** | Scene-aware ambient music system |
| **SVG** | Procedurally generated character portraits |
| **OpenAI API** | AI Dungeon Master integration |
| **Open5e API** | D&D 5e spell/monster/item lookups |
| **Electron Forge** | Build tooling & Squirrel installer |
| **GitHub Actions** | Automated CI/CD pipeline |

---

## 🎯 Advanced Features Guide

### 📜 Quest System

The quest system respects your narrative agency — quests are only added to your journal when you **accept** them, not when they're mentioned.

**How It Works:**
1. **Quest Offered** — An NPC or situation presents a quest opportunity
   - *Example: "Will you help me find my missing daughter?"*
   - **No quest logged yet** — it's just dialogue
2. **You Choose** — Select an action that commits you to the quest
   - *Example: Choose option "I'll help you find her"*
3. **Quest Accepted** — A gold-bordered notification card appears after the DM's response finishes
   - Quest is added to your Campaign Journal under the **Quests** tab
   - Quest appears in the AI's memory for future responses

**Quest States:**
- **◉ Active** — Currently in progress
- **✔ Completed** — Successfully finished (awards achievement progress)
- **✘ Failed** — Quest no longer achievable

**AI Integration:**
All active quests are fed back to the AI in every request, so the Dungeon Master remembers your commitments and can reference them naturally in the story.

---

### 📖 Campaign Journal

Your journal automatically tracks your adventure's story elements:

#### **NPCs Tab (👥)**
- **Automatic tracking** — NPCs are logged when introduced by the DM
- **Roles** — innkeeper, guard, merchant, villain, ally, etc.
- **Attitudes** — Friendly, Hostile, Neutral, Unknown
- **Mentions** — Counter tracks how many times an NPC appears in the story

#### **Lore Tab (📜)**
- **World knowledge** — Important facts discovered through exploration
- **Secret information** — Hidden truths revealed through investigation
- **Cultural details** — Traditions, history, legends
- **Turn tracking** — Each lore entry is timestamped to the turn it was discovered

#### **Decisions Tab (⚔)**
- **Narrative choices** — Key decisions that shaped your story
- **Moral dilemmas** — Choices with lasting consequences
- **Strategic moves** — Combat tactics and exploration decisions

#### **Quests Tab (📋)**
- **Active quests** — What you're currently working on
- **Completed quests** — Your victories and achievements
- **Failed quests** — Opportunities lost or objectives that can no longer be completed

**Opening the Journal:**
- Press `J` key during gameplay
- Click the journal icon in the toolbar
- All journal data is saved with your game and fed to the AI for story continuity

---

### 🏆 Achievement System

Unlock milestones as you play. Achievements are **per-character** — each saved game maintains separate progress.

**Combat Achievements:**
- ⚔ **First Blood** — Defeat your first enemy in combat
- 🐲 **Boss Slayer** — Defeat a boss-level enemy
- 🎯 **Critical Success** — Land a natural 20
- 🎲 **Lucky Streak** — Roll three natural 20s in a campaign
- 🏅 **Battle Scarred** — Win 10 combat encounters

**Survival Achievements:**
- 💀 **Survivor** — Succeed on a Death Saving Throw
- ❤ **Iron Will** — Survive with 3 HP or less
- 💔 **Near Death** — Survive with exactly 1 HP
- 🛡️ **Tough as Nails** — Reach 50 or more max HP
- 🌙 **Well Rested** — Take a Long Rest

**Progression Achievements:**
- ⭐ **Rising Star** — Reach Level 2
- 🏆 **Champion** — Reach Level 5
- 👑 **Hero of Legend** — Reach Level 10
- ✨ **Inspired** — Spend Inspiration on a roll

**Wealth Achievements:**
- 🪙 **First Coin** — Earn your first gold piece
- 💰 **Merchant Prince** — Accumulate 100 GP
- 💸 **Big Spender** — Spend 50 GP
- 🛍️ **Bargain Hunter** — Sell 20 items

**Inventory & Items Achievements:**
- 🎒 **Pack Rat** — Carry 10 or more items at once
- 📦 **Hoarder** — Carry 25 or more items
- ⚔ **Fully Armed** — Fill 5 equipment slots
- 🧪 **Potion Addict** — Acquire 10 consumables
- ✨ **Enchanted** — Obtain a magic item

**Exploration Achievements:**
- 🗺️ **Explorer** — Visit 3 different locations
- 🧭 **Cartographer** — Visit 10 different locations
- ⛏️ **Dungeon Delver** — Enter a dungeon

**Narrative Achievements:**
- 📜 **Lore Hunter** — Discover 5 pieces of lore
- 📋 **Quest Master** — Complete 3 quests
- 📖 **Storyteller** — Play through 50 narrative turns
- 📚 **Epic Tale** — Play through 100 narrative turns

**Viewing Achievements:**
- Open Campaign Journal (`J` key)
- Navigate to the **Feats** tab (trophy icon)
- See progress bars for achievements not yet unlocked

---

### 🗺️ Living Minimap

The minimap is a top-down canvas renderer that reacts dynamically to the story as it unfolds.

**Navigation:**
- Move your character with `W`/`A`/`S`/`D` or arrow keys
- Fog of war lifts as you explore — tiles stay revealed
- Press `M` to toggle the minimap panel on or off
- Collision with walls produces a thud sound, directional screen flash, and dust particles

**Story Connection:**
- **Named locations** — when the AI (or demo) knows the place name, the map header shows it: "The Tarnished Flagon," "Cave Beneath the Mill," "Ritual Chamber, Greyvast Keep" instead of generic labels
- **NPC markers** — narrative characters appear on the map with attitude-colored labels: green (Friendly), red (Hostile), amber (Captive); disappear when defeated
- **Enemy sprites** — combat enemies wander the map; enemies and hostile NPCs are cleared automatically when `[ENEMY:clear]` fires
- **Combat pulse** — a red vignette ring breathes around the map edges whenever an active enemy is present; vanishes when combat ends
- **Weather overlay** — rain, storm, fog, and snow render as canvas overlays driven by world state
- **Time of day** — dawn and dusk tints, evening and night darkness applied to the canvas

**Map Layers (from bottom to top):**
1. Terrain tiles (walls, floors, water, trees) with scene-palette colors and depth edges
2. Map objects inferred from narrative prose (altars, tables, chests)
3. Named landmarks and quest markers
4. Footprint trail showing where the player has walked
5. Enemies and NPCs with role icons and attitude glows
6. Player sprite with bump-animation offset on wall collision
7. Atmospheric particles (dust, embers, leaves, drips, fireflies, spirits)
8. Weather overlay + time-of-day tint
9. Vignette + combat pulse border
10. Compass rose (top-right corner)

**Room Labels:**
Room detection uses BFS flood fill to identify connected floor regions. Each room is labeled based on its contents: "Treasure Room" (chest present), "Boss Chamber" (large room with enemy), "Entrance Hall" (near player start), etc.

---

### ⬆️ Leveling Up & Subclasses

When your character gains enough XP to level up, the **Level Up modal** opens automatically.

**HP Roll:**
- Click **🎲 Roll HP** to roll your class hit die + CON modifier (up to 2 rolls)
- Click **Take Average** for the guaranteed average result
- You must confirm HP before the level is applied

**Feature Choices (Subclasses & Styles):**
- Features with choices (Martial Archetype, Sacred Oath, Druid Circle, etc.) appear as selectable cards
- Click a card to choose your subclass or fighting style
- Confirm is locked until all required choices are made

**Character Sheet Display:**
- **Subclass** appears as its own row in the identity grid (between Class and Level), hidden until chosen
- Class features gained at level up show a **Lvl N** badge
- Subclass abilities show a gold **Subclass** badge and a left-border highlight
- Features are sorted: subclass abilities first → class features by level → background traits

---

### 💾 Character Import/Export

Share characters across campaigns or back them up as JSON files.

#### **Exporting a Character**

1. **During Gameplay:**
   - Open Save/Load menu
   - Click **📤 Export Character**
   - Choose save location and filename
   - Character exported as `{CharacterName}.json`

2. **What Gets Exported:**
   ```json
   {
     "version": "3.2.0",
     "exportedAt": "2026-04-01T15:30:00.000Z",
     "character": {
       "name": "Thorin Ironwall",
       "race": "Dwarf",
       "class": "Fighter",
       "level": 5,
       "stats": { "str": 16, "dex": 12, "con": 15, ... },
       "hp": 45,
       "maxHp": 45,
       "appearance": { ... },
       "proficiencies": [ ... ],
       "inventory": [ ... ],
       // ... all character data
     }
   }
   ```

#### **Importing a Character**

1. **How to Import:**
   - Open Save/Load menu
   - Click **📥 Import Character**
   - Select a `.json` character file
   - Character is loaded into memory

2. **When to Use:**
   - Start a new campaign with an existing character
   - Share character builds with friends
   - Transfer characters between computers
   - Recover characters from backups

3. **Compatibility:**
   - Automatically normalizes fields from older versions
   - Adds missing attributes (conditions, concentration, tempHP, etc.)
   - Validates character data before import

**Note:** Importing a character loads **only** the character data, not their story progress, journal, or achievements. Use **Import Save** to restore a complete game state.

---

### 🎲 Keyboard Shortcuts

Master these hotkeys for lightning-fast gameplay:

| Key | Action | Context |
|-----|--------|---------|
| **1**–**9** | Select choice | Choice selection |
| **W A S D** | Move player on map | Map exploration |
| **Arrow keys** | Move player on map | Map exploration |
| **M** | Toggle minimap | Show / hide map panel |
| **R** | Roll dice | Open dice roller modal |
| **C** | Character sheet | View full stat block |
| **J** | Journal | Campaign memory & quests |
| **I** | Inventory | Item management |
| **Escape** | Close modal | Return to game |
| **Ctrl+S** | Quick save | Save to last used slot |
| **F11** | Fullscreen | Toggle fullscreen mode |

**Pro Tips:**
- WASD and arrow keys move your character on the map and reveal fog of war — movement is blocked when a modal or input field is active
- Wall collisions produce a thud sound, a screen flash, and a small dust burst
- Choices can be selected by number key *before* the DM finishes typing
- Press `Escape` repeatedly to close nested modals

---

## 🛡️ Gameplay Tips & Best Practices

### **Combat Strategy**
- **Initiative matters** — Higher DEX = better turn order
- **Save resources** — Don't blow all spell slots in the first fight
- **Use terrain** — The AI narrates the environment; use it creatively
- **Quick Actions are free** — No typing required for Attack/Dodge/Hide
- **Track conditions** — Poisoned, Frightened, etc. expire automatically but matter

### **Quest Management**
- **Read dialogue carefully** — Quests aren't logged until you accept
- **Check journal often** — Active quests remind you of objectives
- **Multiple quests** — You can have several active quests simultaneously
- **Quest completion** — The AI determines when objectives are met

### **Character Progression**
- **Level up carefully** — Roll or take average for HP (can't undo)
- **Track XP** — Bar in character sheet shows progress to next level
- **Plan spell slots** — Casters need to manage resources between rests
- **Use class features** — Second Wind, Rage, Ki Points recharge on rest

### **Narrative Choices**
- **Decisions matter** — The AI remembers your choices
- **Roleplay rewards** — Inspiration awarded for excellent in-character actions
- **Multiple approaches** — Combat isn't always the answer
- **Save often** — Auto-save runs every 5 minutes, but manual saves are instant

---

## 🔧 Troubleshooting

### **Quest doesn't appear in journal**
- **Cause:** Quest not yet accepted (only offered)
- **Solution:** Make a choice that commits you to the quest objective
- **Example:** NPC asks for help → Choose "I'll do it" → Quest logs

### **Achievements not unlocking**
- **Cause:** Achievement may be locked to specific character/save
- **Solution:** Check Feats tab in journal for progress
- **Note:** Achievements reset when starting new character

### **Character import shows "Invalid file"**
- **Cause:** JSON file is corrupted or not a character export
- **Solution:** Re-export character or check file contents
- **Format:** Must have `{ "character": { ... } }` structure

### **Journal doesn't remember NPCs/Lore**
- **Cause:** Loading an old save without journal data
- **Solution:** Journal starts fresh; new discoveries will be tracked
- **Note:** AI still has conversation history, just not structured journal

### **Quest completed but still showing active**
- **Cause:** AI hasn't sent `[QUEST_DONE:...]` tag yet
- **Solution:** Continue playing; AI will mark complete when narratively appropriate
- **Manual:** Can't manually complete quests (AI-driven)

---

## ❓ Frequently Asked Questions

### General

**Q: Do I need an OpenAI account to play?**  
A: No! Demo Mode provides a complete scripted adventure (tavern → dungeon → boss fight → epilogue) without any API key. For unlimited AI-generated adventures, you'll need an API key from OpenAI, Azure, Ollama, or compatible providers.

**Q: How much does it cost to use OpenAI API?**  
A: Pricing varies by model:
- **gpt-3.5-turbo**: ~$0.001/1K tokens (~$0.01–$0.05 per session)
- **gpt-4o**: ~$0.005/1K input tokens (~$0.05–$0.25 per session)
- **Ollama**: Free (runs locally after model download)

A typical 1-hour session uses 10,000–50,000 tokens depending on story complexity.

**Q: Can I play completely offline?**  
A: Yes! Demo Mode works offline. For AI mode, install Ollama locally to run models without internet (after initial model download).

**Q: What D&D edition is this based on?**  
A: **D&D 5th Edition (5e)**. We implement core mechanics from the Player's Handbook including spell slots, action economy, ability checks, saving throws, death saves, concentration, conditions, and class features.

### Characters & Progression

**Q: Can I import D&D Beyond characters?**  
A: Not currently. Character import only works with JSON files exported from Artificial Realms. Manual recreation is required for external characters.

**Q: Do multiclassing and feats work?**  
A: Not yet. Current version supports single-class characters. Multiclassing and feats are on the roadmap.

**Q: How do I export my character?**  
A: Open Save/Load menu (`Ctrl+S` or Settings), click **📤 Export Character**, choose location, and save as JSON. Use **📥 Import Character** to load it into a new campaign.

**Q: Are premade characters balanced?**  
A: Yes! All 8 premade heroes are level 1 characters built with standard D&D 5e rules (point buy or standard array) and appropriate starting equipment.

### Quests & Journal

**Q: Why doesn't every quest show up in my journal?**  
A: **By design!** Quests are only logged when you **accept** them, not when an NPC mentions them. This gives you narrative control — you choose your commitments.

**Q: Can I manually add quests to my journal?**  
A: No, quest logging is AI-driven. The DM adds quests with a special tag when you commit to an objective.

**Q: How do I complete a quest?**  
A: Complete the objective naturally through gameplay. The AI will mark it complete when appropriate (you'll see ✅ notification and achievement progress).

**Q: Can I abandon or fail quests?**  
A: Yes! If you ignore a quest or circumstances make it impossible, the AI can mark it as **✘ Failed**. Failed quests remain in your journal as story artifacts.

**Q: Does the journal affect the AI's responses?**  
A: **Absolutely!** Your journal (NPCs, lore, decisions, active quests) is sent with every AI request. The DM remembers your story and references it naturally.

### Achievements

**Q: Are achievements account-wide or per-character?**  
A: **Per-character!** Each save slot maintains separate achievement progress. Your barbarian's achievements don't carry over to your wizard.

**Q: Can I unlock achievements in Demo Mode?**  
A: **Yes!** Demo Mode supports full achievement tracking. Complete quests, defeat enemies, and discover lore to unlock milestones.

**Q: Do achievements do anything?**  
A: Currently they're purely cosmetic milestones (badges of honor). Future versions may grant rewards or unlock content.

**Q: I unlocked an achievement on a previous version but it's gone?**  
A: Achievements are saved per-character/save. If starting a new character, achievements reset. Loading old saves restores their achievement progress.

### Saves & Import/Export

**Q: What's the difference between "Export Character" and "Export Save"?**  
A:
- **Export Character** — Only character data (stats, inventory, appearance). Use to start new campaigns with same character.
- **Export Save** — Complete game state (character + story + journal + achievements). Use for backups or transferring progress.

**Q: Can I transfer saves between computers?**  
A: Yes! Export save file, transfer JSON to another computer, then Import Save. Character also works for character-only transfers.

**Q: Where are saves stored?**  
A: `%APPDATA%\artificial-realms\saves\` on Windows. Each slot is a separate JSON file.

**Q: Can I edit save files manually?**  
A: **Advanced users only!** Save files are JSON format. You can edit them, but invalid data may cause crashes or corruption. Export a backup first.

### AI & Providers

**Q: Which AI model works best?**  
A: Recommended order:
1. **gpt-4o** — Best balance of quality and speed
2. **gpt-4-turbo** — Highest quality, slower
3. **gpt-3.5-turbo** — Fastest, cheaper, less creative
4. **Ollama mixtral** — Best local/free option

**Q: Can I use custom system prompts?**  
A: Not currently exposed in UI. The system prompt is carefully tuned for D&D 5e mechanics. Modifying requires code changes.

**Q: Does the AI track what happened in previous sessions?**  
A: The entire message history is sent with each request (conversation + journal context). Very long campaigns may hit token limits, requiring save file pruning.

**Q: Can I use Claude or Gemini?**  
A: Only if they provide OpenAI-compatible API endpoints. Most providers don't, so Anthropic/Google models aren't directly supported yet.

---

## 📜 License

**MIT License** — Open source and free to use, modify, and distribute.

D&D is built on shared imagination. This project embodies that spirit. Fork it, mod it, learn from it, or build something even better.

---

## 🎲 Credits

Built with ⚔️ by the D&D community, for the D&D community.

**Special Thanks:**
- Wizards of the Coast for D&D 5th Edition
- Open5e for the incredible open-source D&D API
- OpenAI for making AI Dungeon Masters possible
- The Electron team for desktop app tooling

---

<div align="center">

### ⚔️ *Roll for Initiative* ⚔️

*Your adventure begins now.*

[Download Latest Release](https://github.com/nisaChampagne/Artificial-Realms/releases/latest) • [Report a Bug](https://github.com/nisaChampagne/Artificial-Realms/issues) • [Request a Feature](https://github.com/nisaChampagne/Artificial-Realms/issues)

</div>
