/* ─────────────────────────────────────────────────────────────
   dice.js — Dice Roller with Canvas Animation
───────────────────────────────────────────────────────────── */
class DiceSystem {
  constructor() {
    this.selectedDie  = 20;
    this.count        = 1;
    this.modifier     = 0;
    this.mode         = 'normal'; // normal | advantage | disadvantage
    this.history      = [];
    this.isAnimating  = false;
    this._canvas      = null;
    this._ctx         = null;
    this._pendingCallback = null;
    this._pendingDC   = null;
    this._promptMode  = 'normal';
  }

  // ── Init ─────────────────────────────────────────────────────
  init() {
    this._canvas = document.getElementById('dice-canvas');
    this._ctx    = this._canvas.getContext('2d');

    // Die pick buttons
    document.getElementById('die-picks').addEventListener('click', e => {
      const btn = e.target.closest('.die-pick');
      if (!btn) return;
      document.querySelectorAll('.die-pick').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.selectedDie = parseInt(btn.dataset.die);
    });

    // Count buttons
    document.getElementById('cnt-minus').onclick = () => {
      if (this.count > 1) { this.count--; document.getElementById('cnt-display').textContent = this.count; }
    };
    document.getElementById('cnt-plus').onclick = () => {
      if (this.count < 10) { this.count++; document.getElementById('cnt-display').textContent = this.count; }
    };

    // Modifier
    document.getElementById('dice-mod').addEventListener('change', e => {
      this.modifier = parseInt(e.target.value) || 0;
    });

    // Advantage buttons
    document.getElementById('modal-dice').addEventListener('click', e => {
      const btn = e.target.closest('.adv-btn');
      if (!btn) return;
      document.querySelectorAll('.adv-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.mode = btn.dataset.mode;
    });

    // Roll button
    document.getElementById('btn-do-roll').onclick = () => this.roll();

    // prompted roll button
    document.getElementById('btn-roll-prompted').addEventListener('click', () => {
      const spec = document.getElementById('dice-prompt-text').dataset.spec || 'd20';
      const dc = this._pendingDC;
      const mode = this._promptMode;
      this.rollSpecWithMode(spec, mode, dc, (result) => {
        const cb = this._pendingCallback;
        this._pendingCallback = null;
        this._pendingDC = null;
        this._promptMode = 'normal';
        document.getElementById('dice-prompt').classList.add('hidden');
        // Hide prompt advantage controls
        document.getElementById('dice-prompt-adv').classList.add('hidden');
        // Callback handles the result
        cb?.(result);
      });
    });

    // Prompt advantage buttons
    document.getElementById('dice-prompt-adv').addEventListener('click', e => {
      const btn = e.target.closest('.prompt-adv-btn');
      if (!btn) return;
      document.querySelectorAll('.prompt-adv-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this._promptMode = btn.dataset.mode;
    });

    // Modal open/close
    document.getElementById('close-modal-dice').onclick = () => this.closeModal();
    document.getElementById('modal-dice').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-dice')) this.closeModal();
    });

    this._drawIdle();
  }

  // ── Modal ─────────────────────────────────────────────────────
  openModal() {
    document.getElementById('roll-result').classList.add('hidden');
    document.getElementById('modal-dice').classList.remove('hidden');
    this._drawIdle();
  }
  closeModal() { document.getElementById('modal-dice').classList.add('hidden'); }

  // ── Core Roll Logic ──────────────────────────────────────────
  _rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

  roll() {
    if (this.isAnimating) return;
    const sides = this.selectedDie;
    let rolls;

    if (this.mode === 'advantage' || this.mode === 'disadvantage') {
      const r1 = this._rollDie(sides), r2 = this._rollDie(sides);
      rolls = this.mode === 'advantage' ? [Math.max(r1, r2)] : [Math.min(r1, r2)];
      rolls._adv = [r1, r2];
    } else {
      rolls = Array.from({ length: this.count }, () => this._rollDie(sides));
    }

    const sum   = rolls.reduce((s, v) => s + v, 0);
    const total = sum + this.modifier;
    const breakdown = rolls.join(' + ') + (this.modifier !== 0 ? ` + (${this.modifier})` : '') + ` = ${total}`;

    this._animateRoll(sides, total, () => {
      this._showResult(rolls, total, breakdown, sides);
      this._addHistory(sides, rolls, this.modifier, total);
    });

    return { total, rolls, breakdown };
  }

  rollSpec(spec, callback) {
    return this.rollSpecWithMode(spec, 'normal', null, callback);
  }

  rollSpecWithMode(spec, mode, dc, callback) {
    // Parse spec like 'd20', 'd20+3', '2d6-1', 'd8+STR'
    const match = spec.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
    if (!match) {
      const result = { total: this._rollDie(20), rolls: [], breakdown: 'd20', dc, success: dc ? this._rollDie(20) >= dc : null };
      callback?.(result); return result;
    }
    const count   = parseInt(match[1] || '1');
    const sides   = parseInt(match[2]);
    const modStr  = match[3] || '+0';
    const mod     = parseInt(modStr) || 0;

    let rolls;
    let advMode = '';
    if (sides === 20 && (mode === 'advantage' || mode === 'disadvantage')) {
      const r1 = this._rollDie(20), r2 = this._rollDie(20);
      const chosen = mode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
      rolls = [chosen];
      advMode = mode === 'advantage' ? ` (ADV: ${r1}, ${r2})` : ` (DIS: ${r1}, ${r2})`;
    } else {
      rolls = Array.from({ length: count }, () => this._rollDie(sides));
    }

    const sum     = rolls.reduce((s, v) => s + v, 0);
    const total   = sum + mod;
    const success = dc ? (total >= dc) : null;
    const breakdown = `${count}d${sides}[${rolls.join(',')}]${advMode}${mod !== 0 ? (mod > 0 ? '+' : '') + mod : ''} = ${total}`;

    this.openModal();
    this._animateRoll(sides, total, () => {
      this._showResult(rolls, total, breakdown, sides, dc, success);
      this._addHistory(sides, rolls, mod, total);
      callback?.({ total, rolls, breakdown, dc, success });
    });

    return { total, rolls, breakdown, dc, success };
  }

  // ── UI ────────────────────────────────────────────────────────
  _showResult(rolls, total, breakdown, sides, dc, success) {
    const el = document.getElementById('roll-result');
    el.classList.remove('hidden');

    const isCrit    = sides === 20 && rolls.includes(20);
    const isFumble  = sides === 20 && rolls.includes(1);
    const color     = isCrit ? '#f0d050' : isFumble ? '#e05050' : 'var(--gold)';
    let label       = isCrit ? '🌟 CRITICAL HIT!' : isFumble ? '💀 CRITICAL MISS!' : '';

    // Add success/fail label if DC was provided
    if (dc !== null && success !== null) {
      const outcomeColor = success ? '#50d050' : '#e05050';
      const outcomeText = success ? '✓ Success' : '✗ Failed';
      label += (label ? '<br>' : '') + `<span style="color:${outcomeColor}">${outcomeText} (DC ${dc})</span>`;
    }

    document.getElementById('roll-breakdown').innerHTML =
      `<span style="color:var(--text-mid)">${breakdown}</span>${label ? `<br>${label}` : ''}`;
    const totalEl = document.getElementById('roll-total');
    totalEl.textContent    = total;
    totalEl.style.color    = color;
    totalEl.style.textShadow = `0 0 20px ${color}88`;
  }

  _addHistory(sides, rolls, mod, total) {
    const entry = {
      label: `${rolls.length}d${sides}${mod !== 0 ? (mod > 0 ? '+' : '') + mod : ''}`,
      rolls, total, time: new Date().toLocaleTimeString()
    };
    this.history.unshift(entry);
    if (this.history.length > 20) this.history.pop();
    this._renderHistory();
  }

  _renderHistory() {
    const div = document.getElementById('roll-history');
    div.innerHTML = this.history.slice(0, 10).map(e =>
      `<div class="history-entry">
        <span>${e.label} [${e.rolls.join(',')}]</span>
        <span class="hist-total">${e.total}</span>
      </div>`
    ).join('');
  }

  // ── Canvas Animation ─────────────────────────────────────────
  _drawIdle() {
    const ctx = this._ctx, w = this._canvas.width, h = this._canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#050404';
    ctx.fillRect(0, 0, w, h);
    this._drawDieShape(ctx, w / 2, h / 2, Math.min(w, h) * 0.33, this.selectedDie, '—', '#505050', '#303030');
  }

  _animateRoll(sides, result, onDone) {
    this.isAnimating = true;
    const ctx = this._ctx, w = this._canvas.width, h = this._canvas.height;
    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(w, h) * 0.34;
    let frame = 0, maxFrames = 40;
    let intermediateValues = Array.from({ length: maxFrames }, () => this._rollDie(sides));

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#050404';
      ctx.fillRect(0, 0, w, h);

      const progress = frame / maxFrames;
      const scale    = 0.85 + 0.15 * Math.sin(frame * 0.5);
      const shake    = (frame < maxFrames * 0.7) ? (Math.random() - 0.5) * 8 * (1 - progress) : 0;
      const spinA    = frame * 0.18 * (1 - progress * 0.8);
      const display  = frame < maxFrames ? intermediateValues[frame] : result;

      ctx.save();
      ctx.translate(cx + shake, cy + shake * 0.5);
      ctx.rotate(spinA);
      ctx.scale(scale, scale);
      const isLanding = frame >= maxFrames - 6;
      const fillColor = isLanding ? '#3a2c08' : '#1a1610';
      const glowColor = isLanding ? '#c9a227' : '#4a4030';
      this._drawDieShape(ctx, 0, 0, maxR, sides, display, fillColor, glowColor);
      ctx.restore();

      frame++;
      if (frame <= maxFrames) {
        requestAnimationFrame(step);
      } else {
        // Final big reveal
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#050404';
        ctx.fillRect(0, 0, w, h);
        this._drawDieShape(ctx, cx, cy, maxR, sides, result, '#2a2208', '#c9a227');
        this.isAnimating = false;
        onDone?.();
      }
    };
    step();
  }

  _drawDieShape(ctx, cx, cy, r, sides, value, fill, stroke) {
    ctx.save();
    ctx.shadowColor = stroke;
    ctx.shadowBlur  = 16;

    ctx.fillStyle   = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth   = 2;

    const pts = this._diePoints(sides, cx, cy, r);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Value
    const isBig = String(value).length > 2;
    ctx.fillStyle    = stroke === '#c9a227' ? '#f0d050' : '#a09050';
    ctx.font         = `bold ${isBig ? r * 0.36 : r * 0.5}px Cinzel, serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), cx, cy + r * 0.06);

    // Die label at bottom
    ctx.fillStyle = stroke === '#c9a227' ? 'rgba(201,162,39,0.5)' : 'rgba(160,144,80,0.35)';
    ctx.font      = `${r * 0.22}px Cinzel, serif`;
    ctx.fillText(`d${sides}`, cx, cy + r * 0.72);

    ctx.restore();
  }

  _diePoints(sides, cx, cy, r) {
    if (sides === 4) {
      return [
        { x: cx, y: cy - r },
        { x: cx - r * 0.866, y: cy + r * 0.5 },
        { x: cx + r * 0.866, y: cy + r * 0.5 },
      ];
    }
    if (sides === 6) {
      const pts = [];
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI / 2) - Math.PI / 4;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      return pts;
    }
    if (sides === 8) {
      return this._polygon(cx, cy, r * 0.9, 4, Math.PI / 4).concat(
        [{ x: cx, y: cy - r }, { x: cx + r, y: cy }, { x: cx, y: cy + r }, { x: cx - r, y: cy }]
      ).slice(4);
    }
    if (sides === 10 || sides === 100) {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI * 2 / 10) - Math.PI / 2;
        const rad = (i % 2 === 0) ? r : r * 0.65;
        pts.push({ x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) });
      }
      return pts;
    }
    if (sides === 12) return this._polygon(cx, cy, r, 5, -Math.PI / 2);
    if (sides === 20) return this._polygon(cx, cy, r, 6, 0);
    // Default: circle as polygon
    return this._polygon(cx, cy, r, Math.min(sides, 8), -Math.PI / 2);
  }

  _polygon(cx, cy, r, n, offset = 0) {
    return Array.from({ length: n }, (_, i) => {
      const a = offset + (i * Math.PI * 2 / n);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
  }

  // ── Request Roll from AI ─────────────────────────────────────
  requestRoll(spec, label, dc, callback) {
    this._pendingCallback = callback;
    this._pendingDC = dc;
    this._promptMode = 'normal';
    const prompt = document.getElementById('dice-prompt');
    const text   = document.getElementById('dice-prompt-text');
    const dcText = dc ? ` (DC ${dc})` : '';
    text.textContent    = `Roll ${spec.toUpperCase()} — ${label}${dcText}`;
    text.dataset.spec   = spec.toLowerCase();
    
    // Show advantage controls if it's a d20 roll
    const advControls = document.getElementById('dice-prompt-adv');
    if (spec.toLowerCase().includes('d20')) {
      advControls.classList.remove('hidden');
      // Reset to normal
      document.querySelectorAll('.prompt-adv-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.prompt-adv-btn[data-mode="normal"]')?.classList.add('active');
      
      // Add inspiration button if player has inspiration
      const hasInspiration = window.characterSystem?.character?.inspiration;
      const inspirationBtn = document.getElementById('btn-use-inspiration');
      if (hasInspiration && inspirationBtn) {
        inspirationBtn.style.display = 'inline-block';
        inspirationBtn.onclick = () => {
          if (window.characterSystem?.spendInspiration()) {
            this._promptMode = 'advantage';
            document.querySelectorAll('.prompt-adv-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.prompt-adv-btn[data-mode="advantage"]')?.classList.add('active');
            inspirationBtn.style.display = 'none';
          }
        };
      } else if (inspirationBtn) {
        inspirationBtn.style.display = 'none';
      }
    } else {
      advControls.classList.add('hidden');
    }
    
    prompt.classList.remove('hidden');
    prompt.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  // ── Request Attack Roll ──────────────────────────────────────
  requestAttackRoll(attackSpec, weaponName, targetAC, enemyName, damageSpec, damageType, callback) {
    const advControls = document.getElementById('dice-prompt-adv');
    advControls.classList.remove('hidden');
    document.querySelectorAll('.prompt-adv-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.prompt-adv-btn[data-mode="normal"]')?.classList.add('active');
    
    this._promptMode = 'normal';
    this._pendingDC = targetAC;
    
    this._pendingCallback = (attackResult) => {
      const hit = attackResult.total >= targetAC;
      const natRoll = attackResult.rolls[0];
      const isCrit = natRoll === 20;
      const isMiss = natRoll === 1;
      
      let hitResult = '';
      if (isCrit) {
        hitResult = `CRITICAL HIT vs ${enemyName} (AC ${targetAC})`;
      } else if (isMiss) {
        hitResult = `Critical Miss`;
      } else if (hit) {
        hitResult = `HIT vs ${enemyName} (AC ${targetAC})`;
      } else {
        hitResult = `Miss (needed ${targetAC})`;
      }
      
      // If hit or crit, roll damage
      if (hit || isCrit) {
        let finalDamageSpec = damageSpec;
        
        // On crit, double the dice (not the modifier)
        if (isCrit) {
          const match = damageSpec.match(/(\d+)d(\d+)([+-]\d+)?/);
          if (match) {
            const count = parseInt(match[1]) || 1;
            const sides = match[2];
            const mod = match[3] || '';
            finalDamageSpec = `${count * 2}d${sides}${mod}`;
          }
        }
        
        // Roll damage
        this.rollSpec(finalDamageSpec, (damageResult) => {
          callback({
            ...attackResult,
            hit: true,
            hitResult,
            wasCrit: isCrit,
            damageTotal: damageResult.total,
            damageRolls: damageResult.rolls,
            damageType
          });
        });
      } else {
        // Miss - no damage
        callback({
          ...attackResult,
          hit: false,
          hitResult,
          wasCrit: false
        });
      }
    };
    
    const prompt = document.getElementById('dice-prompt');
    const text   = document.getElementById('dice-prompt-text');
    text.textContent    = `Attack with ${weaponName} (vs AC ${targetAC})`;
    text.dataset.spec   = attackSpec.toLowerCase();
    
    prompt.classList.remove('hidden');
    prompt.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}

window.diceSystem = new DiceSystem();
