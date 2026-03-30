# Artificial Realms

> An AI-powered Dungeons & Dragons interactive experience built with Electron.

![Build and Release](https://github.com/nisaChampagne/Artificial-Realms/actions/workflows/release.yaml/badge.svg)
![Version](https://img.shields.io/badge/version-1.1.1-gold)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/electron-28-47848F)

---

## Overview

Artificial Realms is a desktop RPG powered by OpenAI's Chat Completions API (or a built-in scripted demo). Create a D&D 5e character, step into an atmospheric adventure, and let an AI Dungeon Master narrate the story — complete with dice rolls, combat, inventory, and a full character sheet.

---

## Features

- **7-step character creation** — name, race, class, background, appearance, stats, review
- **Appearance system** — body type, skin tone, hair style/colour, eye colour, distinguishing mark; generates a layered SVG portrait
- **AI Dungeon Master** — live OpenAI streaming or fully scripted demo mode (no API key required)
- **Initiative system** — overlay dice roll required before player attacks and before incoming damage lands
- **Combat mechanics** — death saving throws, quick actions (Attack / Dodge / Hide / Help / Assess / Persuade)
- **Rest system** — short rest (spend hit dice) and long rest (full restore)
- **Level-up HP modal** — roll or take average on level-up
- **Parchment character sheet** — styled full stat block with portrait, skills, equipment, and XP bar
- **Mini HP bar** — always-visible health bar and HP counter in the game toolbar
- **Choice cards** — numbered action cards with stagger animation and keyboard shortcuts
- **Keyboard shortcuts** — `1`–`4` pick choices, `R` to roll, `C` / `D` open sheet / dice, `Escape` closes modals
- **Dice roller** — animated d4–d100, advantage/disadvantage, modifiers
- **Scene-aware audio** — ambient music that shifts with dungeon / combat / tavern / rest scenes
- **Minimap** — top-down scene map that updates as the story progresses
- **Save / load** — multiple save slots with auto-save

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

# Package (no installer)
npm run package

# Build installer + ZIP
npm run make
```

Output is written to `out/make/squirrel.windows/x64/`.

---

## Demo Mode

No OpenAI API key needed. Enable **Demo Mode** in Settings to run the built-in scripted adventure — a full scenario from tavern briefing through dungeon crawl to boss fight and epilogue.

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

**Latest release:** `v1.1.1`

To cut a new release:
1. Bump `version` in `package.json`
2. Push and create a GitHub Release tagged `v{version}`
3. The workflow triggers automatically and attaches the installer

---

## License

MIT
