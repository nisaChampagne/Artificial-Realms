/* ─────────────────────────────────────────────────────────────
   app.js — Screen management & global application controller
───────────────────────────────────────────────────────────── */
class App {
  constructor() {
    this.currentScreen = 'menu';
    this.settings = { apiKey: '', model: 'gpt-4o', demoMode: false, volume: 70, textSpeed: 15 };
    this.gameState  = { campaignType: null, customDesc: '' };
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

    // Animated menu background
    this._startMenuCanvas();

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
    this._applySettingsToUI();
  }

  async persistSettings() {
    this.settings.apiKey    = document.getElementById('api-key-input').value.trim();
    this.settings.model     = document.getElementById('model-select').value;
    this.settings.demoMode  = document.getElementById('demo-mode-toggle').checked;
    this.settings.volume    = parseInt(document.getElementById('settings-volume').value);
    this.settings.textSpeed = parseInt(document.getElementById('text-speed').value);
    await window.electronAPI.saveSettings(this.settings);
    this.showToast('Settings saved', 'success');
    this.showScreen('menu');
  }

  _applySettingsToUI() {
    document.getElementById('api-key-input').value       = this.settings.apiKey    || '';
    document.getElementById('settings-volume').value     = this.settings.volume    ?? 70;
    document.getElementById('text-speed').value          = this.settings.textSpeed ?? 15;
    document.getElementById('vol-label').textContent     = `${this.settings.volume ?? 70}%`;
    document.getElementById('model-select').value        = this.settings.model     || 'gpt-4o';
    document.getElementById('demo-mode-toggle').checked  = this.settings.demoMode  ?? false;
    this._applyDemoModeUI(this.settings.demoMode ?? false);
  }

  // ── Menu Buttons ─────────────────────────────────────────────
  _bindMenuButtons() {
    document.getElementById('btn-new-game').onclick = () => {
      window.characterSystem.reset();
      this.showScreen('character');
    };
    document.getElementById('btn-load-game').onclick = () => {
      window.saveSystem.open('load');
    };
    document.getElementById('btn-settings').onclick = () => {
      this._applySettingsToUI();
      this.showScreen('settings');
    };
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
    document.getElementById('link-provider').onclick = (e) => {
      e.preventDefault();
      window.open('https://platform.openai.com/settings/billing', '_blank');
    };
  }

  _applyDemoModeUI(on) {
    const apiGroup   = document.getElementById('api-key-input').closest('.form-group');
    const modelGroup = document.getElementById('model-select').closest('.form-group');
    [apiGroup, modelGroup].forEach(g => {
      g.style.opacity        = on ? '0.35' : '1';
      g.style.pointerEvents  = on ? 'none' : '';
    });
  }

  // ── Campaign Buttons ─────────────────────────────────────────
  _bindCampaignButtons() {
    document.getElementById('btn-back-campaign').onclick = () => this.showScreen('character');

    document.querySelectorAll('.campaign-card').forEach(card => {
      card.querySelector('.btn')?.addEventListener('click', () => {
        this.startCampaign(card.dataset.type, '');
      });
    });

    document.getElementById('btn-custom-campaign').onclick = () => {
      const desc = document.getElementById('custom-campaign-desc').value.trim();
      if (!desc) { this.showToast('Please describe your adventure first.', 'error'); return; }
      this.startCampaign('custom', desc);
    };
  }

  // ── Game Buttons ─────────────────────────────────────────────
  _bindGameButtons() {
    document.getElementById('btn-quit-game').onclick = () => {
      if (confirm('Return to main menu? (Unsaved progress will be lost)')) {
        window.audioSystem?.stopAll();
        window.saveSystem.stopAutoSave();
        this.showScreen('menu');
      }
    };

    document.getElementById('btn-open-dice').onclick = () => window.diceSystem.openModal();
    document.getElementById('btn-open-char').onclick = () => window.characterSystem.openSheet();

    // Quick action buttons
    document.getElementById('quick-actions').addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-btn');
      if (!btn || window.aiSystem.isTyping) return;
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
  }

  _onPlayerSend() {
    const input = document.getElementById('player-input');
    const text  = input.value.trim();
    if (!text || window.aiSystem.isTyping) return;
    input.value = '';
    document.getElementById('input-hints').innerHTML = '';
    window.aiSystem.sendMessage(text);
  }

  // ── Start Campaign ───────────────────────────────────────────
  async startCampaign(type, customDesc) {
    const demo = this.settings.demoMode;
    if (!demo && !this.settings.apiKey) {
      this.showToast('Please set your OpenAI API key in Settings first.', 'error');
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

    // Init audio
    window.audioSystem.init();
    window.audioSystem.setScene('dungeon');
    window.audioSystem.setVolume(this.settings.volume / 100);

    // Init map
    window.mapSystem.init();
    window.mapSystem.setScene('dungeon');

    // Update header HUD
    window.characterSystem.updateHUD();

    // Start AI
    window.aiSystem.start(
      window.characterSystem.character,
      type,
      customDesc,
      this.settings.apiKey,
      this.settings.model,
      parseInt(this.settings.textSpeed),
      this.settings.demoMode ?? false
    );

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
