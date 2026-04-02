/* ─────────────────────────────────────────────────────────────
   app.js — Screen management & global application controller
───────────────────────────────────────────────────────────── */
class App {
  constructor() {
    this.currentScreen = 'menu';
    this.settings = { apiKeyOpenAI: '', apiKeyAnthropic: '', apiKeyGemini: '', model: 'gpt-4o', provider: 'openai', demoMode: false, volume: 70, textSpeed: 15, ttsEnabled: false, ttsVoice: '' };
    this.gameState  = { campaignType: null, customDesc: '', difficulty: null };
    this._toastTimer = null;
  }

  // ── Init ─────────────────────────────────────────────────────
  async init() {
    await this.loadSettings();
    this._bindMenuButtons();
    this._bindSettingsButtons();
    this._bindCampaignButtons();
    this._bindGameButtons();

    // Sub-systems
    window.saveSystem.init();
    window.diceSystem.init();
    window.characterSystem.init();
    window.inventorySystem.init();
    window.worldState._updateHUD();  // Render initial time/weather icons

    this._bindKeyboard();

    // Animated menu background
    this._startMenuCanvas();

    // Populate version from package.json
    window.electronAPI.getAppVersion().then(v => {
      const el = document.getElementById('app-version');
      if (el) el.textContent = `v${v} — Powered by Gemini`;
    });

    // Check for updates (non-blocking, runs in background)
    this._checkForUpdates();

    // Apply TTS icon from loaded settings
    this._applyTTSIcon();

    // Apply volume from settings
    document.getElementById('vol-slider').value       = this.settings.volume;
    document.getElementById('settings-volume').value  = this.settings.volume;
    document.getElementById('vol-label').textContent  = `${this.settings.volume}%`;

    // Volume slider in game
    document.getElementById('vol-slider').addEventListener('input', (e) => {
      const v = parseInt(e.target.value) / 100;
      window.audioSystem?.setVolume(v);
    });

    document.getElementById('btn-mute').addEventListener('click', () => {
      window.audioSystem?.toggle();
    });
  }

  // ── Screen Navigation ────────────────────────────────────────
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${name}`);
    if (target) {
      target.classList.add('active');
      this.currentScreen = name;
    }
  }

  // ── Settings ─────────────────────────────────────────────────
  async loadSettings() {
    try {
      const stored = await window.electronAPI.getSettings();
      this.settings = { ...this.settings, ...stored };
    } catch { /* first run */ }
    // Sanitize: blank/null provider falls back to openai
    if (!this.settings.provider) this.settings.provider = 'openai';
    // Load cross-save achievements from settings
    if (this.settings.achievements) {
      window.achievementSystem?.load(this.settings.achievements);
    }
    this._applySettingsToUI();
  }

  // Returns the API key for the currently selected provider
  _getActiveApiKey() {
    const s = this.settings;
    if (s.provider === 'anthropic') return s.apiKeyAnthropic || '';
    if (s.provider === 'gemini')    return s.apiKeyGemini    || '';
    if (s.provider === 'ollama')    return '';
    return s.apiKeyOpenAI || '';
  }

  async persistSettings() {
    this.settings.apiKeyOpenAI    = document.getElementById('api-key-openai').value.trim();
    this.settings.apiKeyAnthropic = document.getElementById('api-key-anthropic').value.trim();
    this.settings.apiKeyGemini    = document.getElementById('api-key-gemini').value.trim();
    this.settings.provider   = document.getElementById('provider-select').value || 'openai';
    const ollamaInp = document.getElementById('ollama-model-input');
    this.settings.model      = this.settings.provider === 'ollama'
      ? (ollamaInp?.value.trim() || 'llama3')
      : document.getElementById('model-select').value;
    this.settings.demoMode   = document.getElementById('demo-mode-toggle').checked;
    this.settings.volume     = parseInt(document.getElementById('settings-volume').value);
    this.settings.textSpeed  = parseInt(document.getElementById('text-speed').value);
    this.settings.ttsEnabled = document.getElementById('tts-toggle').checked;
    this.settings.ttsVoice   = document.getElementById('tts-voice-select').value;
    await window.electronAPI.saveSettings(this.settings);
    
    // Show appropriate message based on demo mode
    if (this.settings.demoMode) {
      this.showToast('Demo Mode enabled — no API calls will be made', 'success');
    } else {
      this.showToast('Settings saved', 'success');
    }
    
    this.showScreen('menu');
  }

  _applySettingsToUI() {
    // Migrate old single-key settings to per-provider slots
    const legacyKey = this.settings.apiKey || '';
    document.getElementById('api-key-openai').value    = this.settings.apiKeyOpenAI    || legacyKey;
    document.getElementById('api-key-anthropic').value = this.settings.apiKeyAnthropic || '';
    document.getElementById('api-key-gemini').value    = this.settings.apiKeyGemini    || '';
    document.getElementById('settings-volume').value     = this.settings.volume    ?? 70;
    document.getElementById('text-speed').value          = this.settings.textSpeed ?? 15;
    document.getElementById('vol-label').textContent     = `${this.settings.volume ?? 70}%`;
    document.getElementById('provider-select').value     = this.settings.provider  || 'openai';
    document.getElementById('tts-toggle').checked        = this.settings.ttsEnabled ?? false;
    document.getElementById('demo-mode-toggle').checked  = this.settings.demoMode  ?? false;
    this._applyDemoModeUI(this.settings.demoMode ?? false);
    this._applyProviderUI(this.settings.provider || 'openai');
    this._populateTTSVoices();
  }

  _applyProviderUI(provider) {
    const modelGroup  = document.getElementById('model-select-group');
    const ollamaGroup = document.getElementById('ollama-model-group');
    const apiKeyGroup = document.getElementById('api-key-group');
    const modelHint   = document.getElementById('model-select-hint');
    const isOllama    = provider === 'ollama';

    if (modelGroup)  modelGroup.classList.toggle('hidden',  isOllama);
    if (ollamaGroup) ollamaGroup.classList.toggle('hidden', !isOllama);

    // Update model options
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
      const options = {
        openai: [
          ['gpt-4o',        'GPT-4o (Recommended)'],
          ['gpt-4-turbo',   'GPT-4 Turbo'],
          ['gpt-4',         'GPT-4'],
          ['gpt-3.5-turbo', 'GPT-3.5 Turbo (Faster / Cheaper)'],
        ],
        anthropic: [
          ['claude-opus-4-5',          'Claude Opus 4.5 (Most capable)'],
          ['claude-sonnet-4-5',        'Claude Sonnet 4.5 (Recommended)'],
          ['claude-3-haiku-20240307',  'Claude 3 Haiku (Faster / Cheaper)'],
        ],
        gemini: [
          ['gemini-2.5-flash',      'Gemini 2.5 Flash (Recommended, Free)'],
          ['gemini-2.5-pro',        'Gemini 2.5 Pro (Free)'],
          ['gemini-2.5-flash-lite', 'Gemini 2.5 Flash-Lite (Fastest, Free)'],
        ],
      };
      const list = options[provider] || options.openai;
      modelSelect.innerHTML = list.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
      const saved = this.settings.model;
      if (saved && list.some(([v]) => v === saved)) modelSelect.value = saved;
    }

    // Update Ollama model input
    const ollamaInp = document.getElementById('ollama-model-input');
    if (ollamaInp && isOllama && this.settings.model) ollamaInp.value = this.settings.model;

    // Update model hint
    const hints = {
      openai:    'Billing required at platform.openai.com/settings/billing',
      anthropic: 'Usage info at console.anthropic.com',
      gemini:    'Free tier available at Google AI Studio',
    };
    if (modelHint) modelHint.textContent = hints[provider] || '';

    // Dim key group when Ollama is active (no key needed)
    if (apiKeyGroup) {
      apiKeyGroup.style.opacity      = isOllama ? '0.4' : '1';
      apiKeyGroup.style.pointerEvents = isOllama ? 'none' : '';
    }
  }

  _populateTTSVoices() {
    const sel = document.getElementById('tts-voice-select');
    if (!sel || !window.speechSynthesis) return;
    const populate = () => {
      const voices = window.speechSynthesis.getVoices();
      const saved  = this.settings.ttsVoice || '';
      sel.innerHTML = '<option value="">Default System Voice</option>' +
        voices.map(v => `<option value="${v.name}"${v.name === saved ? ' selected' : ''}>${v.name} (${v.lang})</option>`).join('');
    };
    populate();
    window.speechSynthesis.onvoiceschanged = populate;
  }

  // ── Menu Buttons ─────────────────────────────────────────────
  _showDeathScreen() {
    const name = window.characterSystem?.character?.name || 'Adventurer';
    document.getElementById('death-char-name').textContent = name;
    document.getElementById('death-screen').classList.remove('hidden');
  }

  _hideDeathScreen() {
    document.getElementById('death-screen').classList.add('hidden');
  }

  _bindMenuButtons() {
    document.getElementById('btn-new-game').onclick = () => {
      this._resetCampaignScreen();
      this.showScreen('campaign');
    };
    document.getElementById('btn-load-game').onclick = () => {
      window.saveSystem.open('load');
    };
    document.getElementById('btn-settings').onclick = () => {
      this._applySettingsToUI();
      this.showScreen('settings');
      window.saveSystem.renderManagementSlots();
    };
    document.getElementById('btn-death-load').onclick = () => {
      this._hideDeathScreen();
      window.saveSystem.open('load');
    };
    document.getElementById('btn-death-menu').onclick = () => {
      this._hideDeathScreen();
      this.showScreen('menu');
    };

    // Changelog
    document.getElementById('btn-changelog').onclick = () => this._openChangelog();
    document.getElementById('close-modal-changelog').onclick = () =>
      document.getElementById('modal-changelog').classList.add('hidden');
  }

  // ── Changelog ────────────────────────────────────────────────
  static _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static _mapHeadingToType(heading) {
    const h = heading.toLowerCase();
    if (/feat|new|add|what/.test(h)) return 'feat';
    if (/fix|bug|patch|hotfix|change/.test(h)) return 'fix';
    if (/ui|interface|design|style|visual/.test(h)) return 'ui';
    return 'other';
  }

  static _parseReleaseBody(body) {
    if (!body) return [];
    const categories = [];
    let current = null;
    for (const raw of body.split('\n')) {
      const line = raw.trim();
      if (/^#{1,3}\s/.test(line)) {
        const heading = line.replace(/^#+\s*/, '').trim();
        current = { type: App._mapHeadingToType(heading), label: App._escapeHtml(heading), items: [] };
        categories.push(current);
      } else if (/^[-*+]\s/.test(line)) {
        const text = App._escapeHtml(line.replace(/^[-*+]\s+/, '').trim());
        if (text) {
          if (!current) {
            current = { type: 'feat', label: 'Changes', items: [] };
            categories.push(current);
          }
          current.items.push(text);
        }
      }
    }
    return categories.filter(c => c.items.length > 0);
  }

  async _openChangelog() {
    const modal = document.getElementById('modal-changelog');
    const body  = document.getElementById('changelog-body');
    body.innerHTML = '<p class="cl-date" style="padding:1rem 0">Loading release notes…</p>';
    modal.classList.remove('hidden');

    if (!this._releaseCache) {
      try {
        this._releaseCache = await window.electronAPI.getReleases();
      } catch {
        this._releaseCache = [];
      }
    }

    const releases = this._releaseCache;
    if (!releases.length) {
      body.innerHTML = '<p class="cl-date" style="padding:1rem 0">Could not load release notes. Check your connection.</p>';
      return;
    }

    body.innerHTML = releases.map((release, i) => {
      const version  = App._escapeHtml(release.tag_name || '');
      const isLatest = i === 0;
      const badge    = isLatest ? '<span class="cl-latest-badge">Latest</span>' : '';
      const date     = release.published_at
        ? new Date(release.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

      const cats = App._parseReleaseBody(release.body);
      let content;
      if (cats.length) {
        content = cats.map(cat => `
          <div class="cl-category">
            <span class="cl-cat-label ${cat.type}">${cat.label}</span>
            <ul class="cl-items">${cat.items.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>`).join('');
      } else {
        const lines = (release.body || '').split('\n')
          .map(l => App._escapeHtml(l.trim()))
          .filter(l => l && !/^#+/.test(l));
        content = lines.length
          ? `<div class="cl-category"><ul class="cl-items">${lines.map(l => `<li>${l}</li>`).join('')}</ul></div>`
          : '<div class="cl-category"><span class="cl-cat-label">No release notes provided.</span></div>';
      }

      return `
        <div class="cl-release">
          <div class="cl-release-header">
            <span class="cl-version">${version}</span>${badge}
            <span class="cl-date">${date}</span>
          </div>
          ${content}
        </div>`;
    }).join('');
  }

  _openHelp() {
    // Activate first tab by default each time it opens
    document.querySelectorAll('[data-help-tab]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.help-panel').forEach(p => p.classList.add('hidden'));
    const firstTab = document.querySelector('[data-help-tab="gameplay"]');
    if (firstTab) firstTab.classList.add('active');
    document.getElementById('help-panel-gameplay')?.classList.remove('hidden');
    document.getElementById('modal-help').classList.remove('hidden');
  }

  // ── Settings Buttons ─────────────────────────────────────────
  _bindSettingsButtons() {
    document.getElementById('btn-save-settings').onclick   = () => this.persistSettings();
    document.getElementById('btn-back-settings').onclick   = () => this.showScreen('menu');
    document.getElementById('settings-volume').oninput     = (e) => {
      document.getElementById('vol-label').textContent = `${e.target.value}%`;
    };
    document.getElementById('demo-mode-toggle').addEventListener('change', (e) => {
      this._applyDemoModeUI(e.target.checked);
    });
    document.getElementById('provider-select').addEventListener('change', (e) => {
      this._applyProviderUI(e.target.value);
    });
    const keyLinks = {
      'link-openai':    'https://platform.openai.com/api-keys',
      'link-anthropic': 'https://console.anthropic.com/settings/keys',
      'link-gemini':    'https://aistudio.google.com/app/apikey',
      'link-ollama':    'https://ollama.ai',
    };
    Object.entries(keyLinks).forEach(([id, url]) => {
      const el = document.getElementById(id);
      if (el) el.onclick = (e) => { e.preventDefault(); window.open(url, '_blank'); };
    });

    document.getElementById('btn-test-provider').onclick = () => this._testProvider();
  }

  async _testProvider() {
    const btn      = document.getElementById('btn-test-provider');
    const status   = document.getElementById('provider-status');
    const provider = document.getElementById('provider-select').value || 'openai';
    const model    = provider === 'ollama'
      ? (document.getElementById('ollama-model-input').value.trim() || 'llama3')
      : document.getElementById('model-select').value;
    const apiKey   = this._getActiveApiKey();

    btn.disabled       = true;
    status.textContent = '⏳ Checking…';
    status.className   = 'provider-status';
    try {
      const result = await window.electronAPI.pingProvider(provider, apiKey, model);
      if (result.ok) {
        status.textContent = `✓ ${result.detail || 'Connected'}`;
        status.className   = 'provider-status ok';
      } else {
        status.textContent = `✗ ${result.error}`;
        status.className   = provider === 'ollama' && result.error?.includes('not found')
          ? 'provider-status warn' : 'provider-status err';
      }
    } catch (e) {
      status.textContent = `✗ ${e}`;
      status.className   = 'provider-status err';
    } finally {
      btn.disabled = false;
    }
  }

  _applyDemoModeUI(on) {
    // Dim the entire AI provider card when demo mode is on
    const aiCard = document.querySelector('#screen-settings .settings-card');
    if (aiCard) {
      // Find everything except the Demo Mode toggle itself
      aiCard.querySelectorAll('.form-group:not(.form-group-toggle), .settings-section-divider').forEach(el => {
        el.style.opacity       = on ? '0.35' : '1';
        el.style.pointerEvents = on ? 'none' : '';
      });
    }
  }

  // ── Campaign Buttons ─────────────────────────────────────────
  _bindCampaignButtons() {
    document.getElementById('btn-back-campaign').onclick = () => this.showScreen('menu');

    // Campaign type selection
    document.querySelectorAll('#campaign-cards .campaign-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#campaign-cards .campaign-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.gameState.campaignType = card.dataset.type;
        this._updateBeginBtn();
      });
    });

    // Custom adventure toggle
    document.getElementById('btn-custom-toggle').addEventListener('click', () => {
      const section = document.getElementById('custom-campaign-section');
      const arrow   = document.getElementById('custom-toggle-arrow');
      const opening = section.classList.contains('hidden');
      section.classList.toggle('hidden', !opening);
      arrow.textContent = opening ? '▴' : '▾';
    });

    // Difficulty selection
    document.querySelectorAll('#difficulty-cards .difficulty-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#difficulty-cards .difficulty-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.gameState.difficulty = card.dataset.diff;
        this._updateBeginBtn();
      });
    });

    // CTA → go to character creation
    document.getElementById('btn-begin-adventure').addEventListener('click', () => {
      if (!this.gameState.campaignType) {
        this.showToast('Choose a campaign type first!', 'error'); return;
      }
      if (!this.gameState.difficulty) {
        this.showToast('Choose a difficulty first!', 'error'); return;
      }
      const desc = document.getElementById('custom-campaign-desc').value.trim();
      if (desc) {
        this.gameState.campaignType = 'custom';
        this.gameState.customDesc   = desc;
      } else {
        this.gameState.customDesc = '';
      }
      window.characterSystem.reset();
      this.showScreen('character');
    });
  }

  _resetCampaignScreen() {
    this.gameState.campaignType = 'standard';
    this.gameState.difficulty   = 'adventure';
    this.gameState.customDesc   = '';
    document.querySelectorAll('#campaign-cards .campaign-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.type === 'standard');
    });
    document.querySelectorAll('#difficulty-cards .difficulty-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.diff === 'adventure');
    });
    const sect = document.getElementById('custom-campaign-section');
    if (sect) sect.classList.add('hidden');
    const td = document.getElementById('custom-campaign-desc');
    if (td) td.value = '';
    const arrow = document.getElementById('custom-toggle-arrow');
    if (arrow) arrow.textContent = '▾';
    this._updateBeginBtn();
    this._buildPremadeGrid();
  }

  _buildPremadeGrid() {
    const grid    = document.getElementById('premade-grid');
    const premades = window.characterSystem?.PREMADE_CHARACTERS || [];
    if (!grid || !premades.length) return;

    const raceLabelMap = { halforc:'Half-Orc', halfelf:'Half-Elf', dragonborn:'Dragonborn',
      tiefling:'Tiefling', aasimar:'Aasimar', gnome:'Gnome', halfling:'Halfling',
      dwarf:'Dwarf', elf:'Elf', human:'Human' };

    grid.innerHTML = premades.map(p => {
      const raceDisplay  = raceLabelMap[p.raceId]  || (p.raceId.charAt(0).toUpperCase()  + p.raceId.slice(1));
      const classDisplay = p.classId.charAt(0).toUpperCase() + p.classId.slice(1);
      return `
        <div class="premade-card" data-premade="${p.id}">
          <div class="premade-icon">${p.icon}</div>
          <div class="premade-name">${p.name}</div>
          <div class="premade-tagline">${p.tagline}</div>
          <div class="premade-badges">
            <span class="premade-badge">${raceDisplay}</span>
            <span class="premade-badge">${classDisplay}</span>
          </div>
          <div class="premade-desc">${p.desc}</div>
          <button class="premade-play-btn" data-premade="${p.id}">⚡ Play</button>

        </div>
      `;
    }).join('');

    grid.querySelectorAll('.premade-card').forEach(card => {
      card.addEventListener('click', () => this._selectPremade(card.dataset.premade));
    });
    grid.querySelectorAll('.premade-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._launchPremade(btn.dataset.premade);
      });
    });
  }

  _selectPremade(id) {
    document.querySelectorAll('#premade-grid .premade-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.premade === id);
    });
  }

  _launchPremade(id) {
    if (!this.gameState.campaignType) {
      this.showToast('Choose a campaign type first!', 'error'); return;
    }
    if (!this.gameState.difficulty) {
      this.showToast('Choose a difficulty first!', 'error'); return;
    }
    const desc = document.getElementById('custom-campaign-desc').value.trim();
    if (desc) {
      this.gameState.campaignType = 'custom';
      this.gameState.customDesc   = desc;
    } else {
      this.gameState.customDesc = '';
    }
    window.characterSystem.loadPremade(id);
  }

  _updateBeginBtn() {
    const btn = document.getElementById('btn-begin-adventure');
    if (!btn) return;
    btn.disabled = !(this.gameState.campaignType && this.gameState.difficulty);
  }

  // ── Game Buttons ─────────────────────────────────────────────
  _bindGameButtons() {
    document.getElementById('btn-quit-game').onclick = () => {
      if (confirm('Return to main menu? (Unsaved progress will be lost)')) {
        window.speechSynthesis?.cancel();
        window.audioSystem?.stopAll();
        window.saveSystem.stopAutoSave();
        this.showScreen('menu');
      }
    };

    document.getElementById('btn-open-dice').onclick = () => window.diceSystem.openModal();
    document.getElementById('btn-open-char').onclick = () => window.characterSystem.openSheet();
    document.getElementById('btn-msb-close')?.addEventListener('click', () => {
      document.getElementById('monster-stat-panel')?.classList.add('hidden');
    });
    document.getElementById('btn-rules').onclick     = () => this._openRulesPanel();
    document.getElementById('btn-perception-log').onclick = () => this._openPerceptionLog();

    document.getElementById('btn-journal').onclick  = () => window.journalSystem?.open();
    document.getElementById('close-modal-journal').onclick = () => window.journalSystem?.close();

    document.getElementById('btn-inventory').onclick = () => window.inventorySystem?.open();
    document.getElementById('close-modal-inventory').onclick = () => window.inventorySystem?.close();

    document.getElementById('btn-help').onclick = () => this._openHelp();
    document.getElementById('close-modal-help').onclick = () => document.getElementById('modal-help').classList.add('hidden');

    // Help tabs
    document.querySelectorAll('[data-help-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.helpTab;
        document.querySelectorAll('[data-help-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.help-panel').forEach(p => p.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(`help-panel-${tab}`)?.classList.remove('hidden');
      });
    });

    // Journal tabs
    ['npcs','lore','decisions','quests','achievements'].forEach(tab => {
      const btn = document.getElementById(`journal-tab-${tab}`);
      if (!btn) return;
      btn.addEventListener('click', () => {
        document.querySelectorAll('[id^="journal-tab-"]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('[id^="journal-panel-"]').forEach(p => p.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(`journal-panel-${tab}`)?.classList.remove('hidden');
        if (tab === 'achievements') window.achievementSystem?.open();
      });
    });

    // TTS toggle button
    const ttsBtn = document.getElementById('btn-tts');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        this.settings.ttsEnabled = !this.settings.ttsEnabled;
        this._applyTTSIcon();
        if (!this.settings.ttsEnabled) window.speechSynthesis?.cancel();
        window.electronAPI.saveSettings(this.settings).catch(() => {});
      });
    }

    // Quick action buttons
    document.getElementById('quick-actions').addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-btn');
      if (!btn || window.aiSystem.isTyping) return;
      if (btn.id === 'btn-quick-perception') {
        this._rerollPerception(window.mapSystem?.currentScene);
        return;
      }
      const action = btn.dataset.action;
      document.getElementById('player-input').value = '';
      document.getElementById('input-hints').innerHTML = '';
      window.aiSystem.sendMessage(action);
    });

    // Send message on Enter or click
    const sendBtn = document.getElementById('btn-send');
    const input   = document.getElementById('player-input');
    sendBtn.onclick = () => this._onPlayerSend();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._onPlayerSend(); }
    });

    // Rules modal
    document.getElementById('close-modal-rules').onclick = () =>
      document.getElementById('modal-rules').classList.add('hidden');
    document.getElementById('btn-rules-search').onclick  = () => this._searchRules();
    document.getElementById('rules-search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._searchRules();
    });

    // Perception log modal
    document.getElementById('close-modal-perception-log').onclick = () =>
      document.getElementById('modal-perception-log').classList.add('hidden');
  }

  _applyTTSIcon() {
    const icon = document.getElementById('tts-icon');
    if (icon) icon.textContent = this.settings.ttsEnabled ? '🔊' : '🔇';
  }

  _onPlayerSend() {
    const input = document.getElementById('player-input');
    const text  = input.value.trim();
    if (!text || window.aiSystem.isTyping) return;
    input.value = '';
    document.getElementById('input-hints').innerHTML = '';
    window.aiSystem.sendMessage(text);
  }

  // ── Auto-Update ──────────────────────────────────────────────
  _checkForUpdates() {
    window.electronAPI.checkForUpdates().then(info => {
      if (!info?.hasUpdate) return;
      const banner    = document.getElementById('update-banner');
      const text      = document.getElementById('update-banner-text');
      const dlBtn     = document.getElementById('update-banner-btn');
      const dismiss   = document.getElementById('update-banner-dismiss');
      const progressEl = document.getElementById('update-banner-progress');
      const barEl      = document.getElementById('update-banner-bar');

      text.textContent = `New version v${info.latestVersion} is available`;
      dismiss.onclick  = () => banner.classList.add('hidden');

      window.electronAPI.onUpdateProgress(pct => {
        barEl.style.width = `${pct}%`;
        if (pct >= 100) text.textContent = 'Installing…';
      });

      dlBtn.onclick = async () => {
        dlBtn.disabled   = true;
        dlBtn.textContent = 'Downloading…';
        dismiss.disabled = true;
        progressEl.classList.remove('hidden');
        try {
          const filePath = await window.electronAPI.downloadUpdate(info.exeDownloadUrl);
          text.textContent = 'Installing…';
          await window.electronAPI.installUpdate(filePath);
        } catch {
          text.textContent = 'Download failed — try again later';
          dlBtn.disabled   = false;
          dlBtn.textContent = 'Download';
          dismiss.disabled = false;
          progressEl.classList.add('hidden');
        }
      };

      banner.classList.remove('hidden');
    }).catch(() => {});
  }

  // ── Keyboard Shortcuts ───────────────────────────────────────
  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (this.currentScreen !== 'game') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const openModals = () => [...document.querySelectorAll('.modal-overlay')].filter(m => !m.classList.contains('hidden'));

      // 1–4 : pick latest choice card
      if (e.key >= '1' && e.key <= '4' && openModals().length === 0) {
        const allBoxes = document.querySelectorAll('.story-choices');
        const last     = allBoxes[allBoxes.length - 1];
        const btn      = last?.querySelectorAll('.choice-btn:not([disabled])')?.[parseInt(e.key) - 1];
        if (btn) { e.preventDefault(); btn.click(); }
        return;
      }

      // R : roll — initiative overlay takes priority, then inline dice prompt
      if (e.key === 'r' || e.key === 'R') {
        const initOverlay = document.getElementById('modal-initiative');
        if (!initOverlay.classList.contains('hidden')) {
          const rb = document.getElementById('btn-init-roll');
          if (rb && !rb.disabled) { e.preventDefault(); rb.click(); return; }
        }
        const dicePrompt = document.getElementById('dice-prompt');
        if (!dicePrompt.classList.contains('hidden')) {
          e.preventDefault(); document.getElementById('btn-roll-prompted').click(); return;
        }
      }

      // Enter : confirm initiative result after rolling
      if (e.key === 'Enter') {
        const initOverlay = document.getElementById('modal-initiative');
        if (!initOverlay.classList.contains('hidden')) {
          const cb = document.getElementById('btn-init-confirm');
          if (cb && !cb.classList.contains('hidden')) { e.preventDefault(); cb.click(); }
          return;
        }
      }

      // Escape : close dismissible modals (not death/levelup/initiative)
      if (e.key === 'Escape') {
        const skip = new Set(['modal-death', 'modal-levelup', 'modal-initiative']);
        openModals().forEach(m => { if (!skip.has(m.id)) m.classList.add('hidden'); });
        return;
      }

      // C : character sheet (no modal open)
      if ((e.key === 'c' || e.key === 'C') && openModals().length === 0) {
        window.characterSystem?.openSheet(); return;
      }

      // D : dice roller (no modal open)
      if ((e.key === 'd' || e.key === 'D') && openModals().length === 0) {
        window.diceSystem?.openModal(); return;
      }

      // J : journal (no modal open)
      if ((e.key === 'j' || e.key === 'J') && openModals().length === 0) {
        window.journalSystem?.open(); return;
      }

      // P : perception log (no modal open)
      if ((e.key === 'p' || e.key === 'P') && openModals().length === 0) {
        this._openPerceptionLog(); return;
      }
    });
  }

  // ── Perception Log Panel ─────────────────────────────────────
  _openPerceptionLog() {
    const cache   = window.mapSystem?._perceptionCache || {};
    const entries = Object.entries(cache);
    const container = document.getElementById('perception-log-entries');
    const currentScene = window.mapSystem?.currentScene;

    if (entries.length === 0) {
      container.innerHTML = '<div class="rules-hint">No perception checks recorded yet. Enter a location to roll.</div>';
    } else {
      container.innerHTML = entries.map(([scene, data]) => {
        const total  = data.roll + data.bonus;
        const icon   = total >= 20 ? '👁️' : total >= 16 ? '🔍' : total >= 11 ? '👀' : total >= 6 ? '🌫️' : '⚫';
        const bonusStr = data.bonus >= 0 ? `+${data.bonus}` : `${data.bonus}`;
        const tierClass = total >= 20 ? 'perc-tier-exc'
                        : total >= 16 ? 'perc-tier-good'
                        : total >= 11 ? 'perc-tier-mid'
                        : 'perc-tier-low';
        const desc = this._perceptionDesc(total);
        const isCurrent = scene === currentScene;
        const rerollBtn = isCurrent
          ? `<button class="perc-reroll-btn" data-scene="${scene}">🎲 Re-roll</button>`
          : '';
        return `<div class="perc-entry">
          <div class="perc-entry-header">
            <span class="perc-icon">${icon}</span>
            <span class="perc-location">${data.label}${isCurrent ? ' <span class="perc-current-badge">current</span>' : ''}</span>
            <span class="perc-total ${tierClass}">${total}</span>
          </div>
          <div class="perc-breakdown">d20(${data.roll}) ${bonusStr} = <strong>${total}</strong></div>
          <div class="perc-desc">${desc}</div>
          <div class="perc-entry-footer">
            <span class="perc-cached-note">✓ Revisits this location will not require another check.</span>
            ${rerollBtn}
          </div>
        </div>`;
      }).join('');

      container.querySelectorAll('.perc-reroll-btn').forEach(btn => {
        btn.addEventListener('click', () => this._rerollPerception(btn.dataset.scene));
      });
    }

    document.getElementById('modal-perception-log').classList.remove('hidden');
  }

  _rerollPerception(scene) {
    const ms = window.mapSystem;
    if (!ms || scene !== ms.currentScene) return;

    // Clear cache and re-roll immediately, applying new fog reveal
    delete ms._perceptionCache[scene];
    const { radius } = ms._rollPerception(scene);
    ms._revealAround(ms.playerX, ms.playerY, radius);
    ms._dirty = true;

    // Refresh the log
    this._openPerceptionLog();
  }

  _perceptionDesc(total) {
    if (total >= 20) return 'You take in every detail of the surroundings.';
    if (total >= 16) return 'You notice most of the area around you.';
    if (total >= 11) return 'You get a reasonable sense of the space.';
    if (total >= 6)  return 'You can make out the immediate area.';
    return 'Everything beyond arm\'s reach is shrouded in darkness.';
  }

  // ── Rules Reference Panel ────────────────────────────────────
  _openRulesPanel() {
    document.getElementById('rules-search-input').value = '';
    document.getElementById('rules-results').innerHTML =
      '<div class="rules-hint">Type to search the D&amp;D 5e SRD rules via Open5e.</div>';
    document.getElementById('modal-rules').classList.remove('hidden');
    setTimeout(() => document.getElementById('rules-search-input').focus(), 80);
  }

  async _searchRules() {
    const query   = document.getElementById('rules-search-input').value.trim();
    const results = document.getElementById('rules-results');
    results.innerHTML = '<div class="rule-loading">Searching…</div>';
    try {
      await window.open5e.init();
      const sections = await window.open5e.searchRules(query);
      if (!sections.length) {
        results.innerHTML = '<div class="rules-hint">No results found. Try a different search term.</div>';
        return;
      }
      results.innerHTML = sections.map(s => {
        const title   = s.name || s.title || 'Untitled';
        const excerpt = (s.desc || s.description || '').slice(0, 300).replace(/\n/g, ' ');
        return `<div class="rule-item" data-full="${encodeURIComponent(s.desc || s.description || '')}">
          <div class="rule-item-title">${title}</div>
          <div class="rule-item-excerpt">${excerpt}${(s.desc||'').length > 300 ? '…' : ''}</div>
        </div>`;
      }).join('');
      // Click to expand/collapse
      results.querySelectorAll('.rule-item').forEach(el => {
        el.addEventListener('click', () => {
          const expanded = el.classList.toggle('expanded');
          if (expanded) {
            const full = decodeURIComponent(el.dataset.full).replace(/\n/g, '<br>');
            el.querySelector('.rule-item-excerpt').innerHTML = full;
          } else {
            const full = decodeURIComponent(el.dataset.full);
            el.querySelector('.rule-item-excerpt').textContent =
              full.slice(0, 300) + (full.length > 300 ? '…' : '');
          }
        });
      });
    } catch (err) {
      results.innerHTML = `<div class="rules-hint">⚠ Search failed: ${err.message}<br><small>Check your internet connection.</small></div>`;
    }
  }

  // ── Start Campaign ───────────────────────────────────────────
  async startCampaign(type, customDesc) {
    const demo = this.settings.demoMode;
    if (!demo && this.settings.provider !== 'ollama' && !this._getActiveApiKey()) {
      this.showToast('Please set your API key in Settings first.', 'error');
      this.showScreen('settings');
      return;
    }
    if (demo) this.showToast('Demo Mode — scripted responses active', '');
    this.gameState.campaignType = type;
    this.gameState.customDesc   = customDesc;

    // Reset story log
    document.getElementById('story-log').innerHTML = '';
    document.getElementById('input-hints').innerHTML = '';

    this.showScreen('game');

    // Init audio (don't set scene yet - wait for AI to provide it)
    window.audioSystem.init();
    window.audioSystem.setVolume((parseInt(this.settings.volume) || 70) / 100);

    // Init map (don't set scene yet - wait for AI to provide it)
    window.mapSystem.init();

    // Update header HUD
    window.characterSystem.updateHUD();

    // Start AI
    window.aiSystem.start(
      window.characterSystem.character,
      type,
      customDesc,
      this.settings.demoMode ? '' : this._getActiveApiKey(), // Don't pass API key in demo mode
      this.settings.model,
      parseInt(this.settings.textSpeed),
      this.settings.demoMode ?? false
    );

    // Seed inventory AFTER aiSystem.start() (which resets it)
    const c = window.characterSystem.character;
    if (c) {
      (c.equipment || []).forEach(name => window.inventorySystem?.addItem(name));
      (c._extraItems || []).forEach(name => window.inventorySystem?.addItem(name));
      // Restore starting wealth (currency is in copper pieces)
      if (c.startingWealth && window.inventorySystem) {
        window.inventorySystem.currency = c.startingWealth;
        window.inventorySystem._renderCurrency();
      }
    }

    // Auto-save
    window.saveSystem.startAutoSave(5 * 60 * 1000);
  }

  // ── Toast ────────────────────────────────────────────────────
  showToast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className   = `toast ${type} visible`;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.classList.remove('visible');
    }, 3000);
  }

  // ── Animated Menu Background (particle stars) ────────────────
  _startMenuCanvas() {
    const canvas = document.getElementById('menu-canvas');
    const ctx    = canvas.getContext('2d');
    let stars    = [];
    let raf;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        a: Math.random(),
        da: (Math.random() * 0.005 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#07070c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula glow
      const grad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.45, 0,
        canvas.width * 0.5, canvas.height * 0.45, canvas.height * 0.6
      );
      grad.addColorStop(0,   'rgba(50,20,80,0.15)');
      grad.addColorStop(0.4, 'rgba(20,10,40,0.08)');
      grad.addColorStop(1,   'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold glow under title area
      const gold = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.4, 0,
        canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.3
      );
      gold.addColorStop(0,  'rgba(201,162,39,0.04)');
      gold.addColorStop(1,  'transparent');
      ctx.fillStyle = gold;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(s => {
        s.x  = (s.x + s.vx + canvas.width)  % canvas.width;
        s.y  = (s.y + s.vy + canvas.height) % canvas.height;
        s.a += s.da;
        if (s.a > 1 || s.a < 0) s.da *= -1;

        ctx.globalAlpha = Math.max(0, s.a);
        ctx.fillStyle   = '#c9a227';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    // Stop animation when not on menu
    const observer = new MutationObserver(() => {
      if (!document.getElementById('screen-menu').classList.contains('active')) {
        cancelAnimationFrame(raf);
      } else {
        draw();
      }
    });
    observer.observe(document.getElementById('screen-menu'), { attributes: true });
  }
}

window.app = new App();
document.addEventListener('DOMContentLoaded', () => window.app.init());
