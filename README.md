# ![Artificial Realms](./title.png)

> An AI-powered Dungeons & Dragons interactive experience built with Electron.

[![Build and Release](https://github.com/nisaChampagne/Artificial-Realms/actions/workflows/release.yaml/badge.svg)](https://github.com/nisaChampagne/Artificial-Realms/actions/workflows/release.yaml)
[![Version](https://img.shields.io/github/v/release/nisaChampagne/Artificial-Realms?color=gold&label=version)](https://github.com/nisaChampagne/Artificial-Realms/releases/latest)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/electron-28-47848F)

---

## Overview

Artificial Realms is a desktop RPG powered by OpenAI's Chat Completions API (or a built-in scripted demo). Create a D&D 5e character, step into an atmospheric adventure, and let an AI Dungeon Master narrate the story — complete with dice rolls, combat, inventory, and a full character sheet.

---

## Features

- **8-step character creation** — name, race, class, background, appearance, proficiencies & skills, stats, review
- **8 premade characters** — one-click Quick Start heroes covering every major archetype
- **Appearance system** — body type, skin tone, hair style/colour, eye colour, distinguishing mark; generates a layered SVG portrait
- **AI Dungeon Master** — live OpenAI / compatible provider streaming or fully scripted demo mode (no API key required)
- **Multi-provider AI** — OpenAI, Azure OpenAI, Ollama, or any OpenAI-compatible endpoint; built-in connection test
- **Text-to-speech** — optional TTS narration with configurable voice and speed
- **Initiative system** — roll initiative at combat start, turn order tracking with automatic action reset
- **Combat mechanics** — death saving throws, attack rolls vs AC, critical hits (2× dice damage), quick actions (Attack / Dodge / Hide / Help / Assess / Persuade)
- **Action economy** — action, bonus action, and reaction tracking per turn with visual indicators
- **Spell slots** — full D&D 5e progression for all 9 caster classes with automatic consumption and restoration
- **Class resources** — Second Wind (Fighter), Rage (Barbarian), Ki Points (Monk), Channel Divinity (Cleric), Lay on Hands (Paladin), Bardic Inspiration (Bard)
- **Concentration** — spell concentration tracking with automatic CON saving throws when taking damage
- **Conditions** — status effects (Poisoned, Stunned, Frightened, etc.) with duration tracking and turn-based expiration
- **Inspiration** — DM-awarded inspiration for excellent roleplay, spend for advantage on any d20 roll
- **Temporary HP** — damage absorption shield following D&D 5e rules (doesn't stack, absorbs damage first)
- **Spell Save DC** — auto-calculated for spellcasters (8 + proficiency + spellcasting modifier)
- **Rest system** — short rest (spend hit dice, restore class resources) and long rest (full restore)
- **Level-up HP modal** — roll or take average on level-up
- **Inventory & gold** — item management with add / remove / equip and gold tracking
- **Parchment character sheet** — styled full stat block with portrait, proficiencies, skills, equipment, and XP bar
- **Mini HP bar** — always-visible health bar and HP counter in the game toolbar
- **Choice cards** — numbered action cards with stagger animation and keyboard shortcuts
- **Keyboard shortcuts** — `1`–`4` pick choices, `R` to roll, `C` / `D` open sheet / dice, `Escape` closes modals
- **Dice roller** — animated d4–d100, advantage/disadvantage, modifiers
- **Scene-aware audio** — ambient music that shifts with dungeon / combat / tavern / rest scenes
- **Minimap** — top-down scene map that updates as the story progresses
- **Auto-update** — in-app notifications when a new release is available
- **Save / load** — multiple save slots with auto-save

---

## Premade Characters

Select a premade hero on the Campaign screen for an instant start — no character creation required.

| Hero | Race | Class | Playstyle |
|---|---|---|---|
| Thorin Ironwall | Dwarf | Fighter | Tank / frontline warrior |
| Seraphina Dawnwhisper | Aasimar | Cleric | Healer / divine support |
| Zara Nightshade | Tiefling | Warlock | Eldritch striker / trickster |
| Elaryn Swiftstep | Elf | Rogue | Stealth / skill monkey |
| Grak Stonehide | Half-Orc | Barbarian | Raging berserker |
| Pip Tumblebottom | Halfling | Bard | Charisma / party support |
| Aldric Spellweave | Human | Wizard | Arcane controller |
| Sylvara Moonbow | Half-Elf | Ranger | Archer / tracker |

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | 20 LTS or later |
| npm | 9+ |
| Windows | 10 / 11 (x64) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run in development
npm start
```


---

## Demo Mode

No API key needed. Enable **Demo Mode** in Settings to run the built-in scripted adventure — a full scenario from tavern briefing through dungeon crawl to boss fight and epilogue.

---

## Using Your Own API Key

1. Open **Settings** from the main menu
2. Paste your [OpenAI API key](https://platform.openai.com/api-keys)
3. Choose a model (`gpt-4o` recommended)
4. Disable Demo Mode and start a campaign

---

## Project Structure

```
main.js              Electron main process
preload.js           Context bridge (IPC)
forge.config.js      Electron Forge packaging config
src/
  index.html         App shell and all modal HTML
  css/styles.css     Full stylesheet (dark fantasy theme)
  js/
    app.js           Screen management, keyboard shortcuts
    ai.js            AI system, demo state machine, response parser
    character.js     Character creation wizard + sheet + combat
    dice.js          Dice roller with canvas animation
    audio.js         Scene-aware ambient audio
    map.js           Minimap renderer
    inventory.js     Inventory & gold management
    journal.js       Session journal / adventure log
    open5e.js        Open5e API integration (spells, monsters, items)
    save.js          Save/load slots
assets/
  icon.png           App icon (256×256)
  icon.ico           Multi-size ICO for installer
scripts/
  generate-icon.js   Generates icon.png (pure Node.js)
  generate-ico.js    Generates icon.ico (pure Node.js)
.github/
  workflows/
    release.yaml     CI/CD — builds and uploads Windows installer on release tag
```

---

## Release

Releases are built automatically via GitHub Actions when a new release is created on GitHub.

The workflow (`release.yaml`):
1. Checks out the repository on `windows-latest`
2. Installs dependencies with `npm ci`
3. Runs `npm run make` (Electron Forge — Squirrel installer + ZIP)
4. Uploads `ArtificialRealms-{version}-Setup.exe` as a release asset

**Latest release:** `v2.2.0`

To cut a new release:
1. Bump `version` in `package.json`
2. Push and create a GitHub Release tagged `v{version}`
3. The workflow triggers automatically and attaches the installer

---

## Screenshots

![Character Creation](./screenshots/character-creation.png)
![Gameplay](./screenshots/gameplay.png)
![Combat](./screenshots/combat.png)
![Character Sheet](./screenshots/character-sheet.png)

---

## AI Provider Setup

### OpenAI (Default)

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Recommended models: `gpt-4o`, `gpt-4-turbo`, or `gpt-3.5-turbo`
3. Paste key in Settings → API Configuration

### Azure OpenAI

1. Deploy a chat completion model in Azure
2. In Settings:
   - Select "Azure OpenAI" as provider
   - Enter your endpoint URL (e.g., `https://your-resource.openai.azure.com`)
   - Paste your API key
   - Enter your deployment name

### Ollama (Local / Self-Hosted)

1. Install [Ollama](https://ollama.ai/)
2. Pull a model: `ollama pull llama2` or `ollama pull mixtral`
3. In Settings:
   - Select "Ollama" as provider
   - Enter endpoint (default: `http://localhost:11434`)
   - Enter model name (e.g., `llama2`)
4. Optionally increase context length: `ollama run llama2 --ctx 4096`

### Custom OpenAI-Compatible Endpoints

Works with any API that implements OpenAI's chat completion format (LocalAI, vLLM, Anthropic's OpenAI compatibility, etc.):

1. Select "Custom" as provider
2. Enter your endpoint URL
3. Paste API key (if required)
4. Enter model name

---

## Advanced Features

### Class Resources Explained

Each class has unique resources that recharge on rest:

- **Fighter** — Second Wind (heal 1d10 + level, 1× short rest)
- **Barbarian** — Rage (advantage on STR checks/saves, damage resistance, 2–6× long rest)
- **Monk** — Ki Points (Flurry of Blows, Patient Defense, Step of the Wind)
- **Cleric** — Channel Divinity (Turn Undead or domain feature, 1–3× short rest)
- **Paladin** — Lay on Hands (heal 5× level HP pool, long rest)
- **Bard** — Bardic Inspiration (d6–d12 bonus die for allies, CHA mod × short rest)

### Concentration & Conditions

Many spells require concentration. When you take damage while concentrating:
- Automatic CON saving throw (DC = 10 or half damage, whichever is higher)
- Losing concentration ends the spell immediately
- Visual indicator shows which spell you're concentrating on

Conditions work like D&D 5e:
- Applied by spells, attacks, or environmental hazards
- Each condition has specific mechanical effects
- Duration tracked per turn
- Expired conditions are automatically removed

### Combat Action Economy

Each turn you have:
- **Action** — Attack, Cast a Spell, Dodge, Hide, Help, Assess (Insight check)
- **Bonus Action** — class-specific (Cunning Action, Flurry of Blows, off-hand attack)
- **Reaction** — Opportunity Attack, Shield spell, etc.

Actions reset at the start of your turn. Used actions are visually indicated in the UI.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `1`–`9` | Select numbered choice |
| `R` | Roll dice |
| `C` | Open character sheet |
| `D` | Open dice roller |
| `I` | Open inventory |
| `J` | Open journal |
| `M` | Toggle minimap |
| `S` | Open settings |
| `Escape` | Close modal / return to game |
| `Ctrl+S` | Quick save |
| `F11` | Toggle fullscreen |

---

## Troubleshooting

### AI responses are slow

- Try a faster model (`gpt-3.5-turbo` instead of `gpt-4`)
- Use Demo Mode for instant responses
- Check your internet connection
- For Ollama, ensure model is fully loaded: `ollama ps`

### Saves don't load

- Navigate to Settings → Save Management
- Check if save files exist in `%APPDATA%/artificial-realms/saves/`
- Export saves as JSON before uninstalling

### Character portrait doesn't show

- Portraits are generated as SVG from appearance choices
- Check browser console for SVG rendering errors
- Try recreating the character

### API key errors

- Verify key is correct: test in OpenAI Playground
- Check for typos or extra spaces
- Ensure billing is enabled on your OpenAI account
- Test connection using the "Test Connection" button in Settings

---

## FAQ

**Q: Do I need an OpenAI account?**  
A: No! Demo Mode provides a full scripted adventure without any API key. For custom AI-driven stories, you'll need an API key (OpenAI, Azure, Ollama, etc.).

**Q: How much does OpenAI API cost?**  
A: Depends on usage and model. `gpt-3.5-turbo` costs ~$0.001/1K tokens. A typical session uses 10–50K tokens ($0.01–$0.05). `gpt-4o` is faster and smarter but costs ~$0.005/1K input tokens.

**Q: Can I play offline?**  
A: Demo Mode works offline. For AI mode, use local Ollama (no internet required after model download).

**Q: Does this support multiplayer?**  
A: Not yet. Currently single-player only. Multiplayer is on the roadmap.

**Q: Can I add custom content (monsters, spells, items)?**  
A: Not yet built-in, but planned. The Open5e API integration is the foundation for future modding support.

**Q: What D&D edition is this based on?**  
A: D&D 5th Edition (5e) rules. Core mechanics like stats, saving throws, spell slots, and action economy follow the Player's Handbook.

**Q: Can I export my character for use in other tools?**  
A: Not yet, but planned. Currently saves are internal JSON format.

**Q: Does it support homebrew content?**  
A: Not yet. Future versions may allow custom races, classes, backgrounds, and subclasses.

---

## Roadmap

🚧 Planned features (not in any particular order):

- [ ] **Multiplayer** — party play with one DM and 2–6 players
- [ ] **Character export/import** — JSON/PDF character sheets
- [ ] **Custom campaigns** — user-created adventures and monsters
- [ ] **Subclasses** — specializations at level 3+ (Battle Master, Arcane Trickster, etc.)
- [ ] **More races** — Dragonborn, Gnome, Tabaxi, custom lineages
- [ ] **Feats** — ASI or feat choice at level 4/8/12/16/19
- [ ] **Magic items** — procedural loot with rarity-based power
- [ ] **World map** — larger-scale travel between regions
- [ ] **NPC party members** — AI-controlled companions
- [ ] **Tactical grid** — optional hex/square grid for combat positioning
- [ ] **Mobile version** — iOS/Android port
- [ ] **Mod workshop** — share custom content with community
- [ ] **Achievements** — unlock badges for milestones
- [ ] **Difficulty settings** — story mode, balanced, hardcore
- [ ] **Permadeath mode** — ironman: one life, no saves

---

## Contributing

Contributions welcome! Here's how to help:

1. **Fork** the repository
2. **Create a feature branch** — `git checkout -b feature/amazing-feature`
3. **Commit your changes** — `git commit -m 'feat: add amazing feature'`
4. **Push to the branch** — `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style

- Use ES6+ JavaScript
- 2-space indentation
- Descriptive variable/function names
- Comment complex logic
- Test your changes in both Demo Mode and AI Mode

### Ideas for Contributions

- Add more premade characters
- Improve AI prompts for better storytelling
- Enhance character portrait system with more options
- Create additional ambient audio tracks
- Add new combat actions
- Improve dice animation
- Write unit tests

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Framework | Electron 28 |
| Frontend | Vanilla JavaScript (ES6+) |
| Styling | CSS3 (dark fantasy theme) |
| Audio | Web Audio API |
| Graphics | Canvas API + SVG |
| AI Integration | OpenAI Chat Completions API |
| Packaging | Electron Forge + Squirrel |
| CI/CD | GitHub Actions |

No heavy frameworks (React, Vue, Angular) — intentionally lightweight for fast load times and simple maintenance.

---

## Architecture

### Main Process (`main.js`)

- Electron app lifecycle
- Window management
- IPC handlers for file system operations (save/load)
- Auto-updater integration

### Renderer Process (`src/`)

- **app.js** — Screen routing, keyboard shortcuts, modal management
- **ai.js** — AI system with streaming, demo mode state machine, response parsing
- **character.js** — Character creation wizard, stats, combat calculations, level-up
- **dice.js** — Dice roller with canvas-based animation and physics
- **audio.js** — Scene-aware audio engine (ambient + SFX)
- **map.js** — Minimap renderer with location tracking
- **inventory.js** — Item management, equipment slots, gold
- **journal.js** — Session log, quest tracking
- **open5e.js** — Open5e API client for D&D 5e content
- **save.js** — Save/load system with multiple slots

### State Management

Global state stored in vanilla JS objects:
- `currentCharacter` — all character data (stats, HP, XP, inventory, spells)
- `gameState` — current scene, turn order, combat status
- `sessionHistory` — message log for journal and save files

No Redux or complex state managers — simple, debuggable, fast.

---

## Credits

**Author:** [@nisaChampagne](https://github.com/nisaChampagne)

**Built with:**
- [Electron](https://www.electronjs.org/) — desktop framework
- [Open5e](https://open5e.com/) — D&D 5e SRD content
- [Squirrel](https://github.com/Squirrel/Squirrel.Windows) — Windows installer
- [GitHub Actions](https://github.com/features/actions) — CI/CD

**Inspiration:**
- Classic tabletop D&D
- [Baldur's Gate 3](https://baldursgate3.game/)

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Star History

If you find this project useful, please give it a ⭐️ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=nisaChampagne/Artificial-Realms&type=Date)](https://star-history.com/#nisaChampagne/Artificial-Realms&Date)

---

**Embark on your adventure today. The realm awaits.**
