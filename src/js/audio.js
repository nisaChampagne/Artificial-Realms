/* ─────────────────────────────────────────────────────────────
   audio.js — Procedural Lofi Music via Web Audio API
   Each scene triggers a distinct ambient/lofi atmosphere.
───────────────────────────────────────────────────────────── */

// Musical note frequencies (Hz)
const NOTE = {
  C2:65.4, D2:73.4, Eb2:77.8, F2:87.3, G2:98.0, Ab2:103.8, Bb2:116.5,
  C3:130.8, D3:146.8, Eb3:155.6, E3:164.8, F3:174.6, G3:196.0, Ab3:207.7, A3:220.0, Bb3:233.1, B3:246.9,
  C4:261.6, D4:293.7, Eb4:311.1, E4:329.6, F4:349.2, G4:392.0, Ab4:415.3, A4:440.0, Bb4:466.2, B4:493.8,
  C5:523.3, D5:587.3, Eb5:622.3, E5:659.3, F5:698.5, G5:784.0,
};

// Scene configurations
const SCENES = {
  dungeon: {
    label:  'Dungeon Depths',
    bpm:    55,
    chords: [
      [NOTE.C3, NOTE.Eb3, NOTE.G3, NOTE.Bb3],
      [NOTE.F3, NOTE.Ab3, NOTE.C4, NOTE.Eb4],
      [NOTE.Bb2, NOTE.D3, NOTE.F3, NOTE.Ab3],
      [NOTE.G2, NOTE.Bb2, NOTE.D3, NOTE.F3],
    ],
    bass:       [NOTE.C2, NOTE.F2, NOTE.Bb2, NOTE.G2],
    droneNote:  NOTE.C2,
    filterFreq: 600,
    filterQ:    1.2,
    melody:     [NOTE.G3, NOTE.Eb3, NOTE.F3, NOTE.C3, NOTE.D3, NOTE.Eb3],
    reverbWet:  0.55,
    crackle:    true,
  },
  tavern: {
    label:  'Tavern Lofi',
    bpm:    80,
    chords: [
      [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.E4],
      [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.B3],
      [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.F4],
      [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4],
    ],
    bass:       [NOTE.F2, NOTE.C3, NOTE.G2, NOTE.A2],
    droneNote:  NOTE.F2,
    filterFreq: 900,
    filterQ:    0.8,
    melody:     [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.E4],
    reverbWet:  0.25,
    crackle:    true,
  },
  forest: {
    label:  'Forest Ambience',
    bpm:    62,
    chords: [
      [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.F4],
      [NOTE.D3, NOTE.F3, NOTE.A3, NOTE.C4],
      [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4],
      [NOTE.E3, NOTE.G3, NOTE.B3, NOTE.D4],
    ],
    bass:       [NOTE.G2, NOTE.D3, NOTE.A2, NOTE.E3],
    droneNote:  NOTE.G2,
    filterFreq: 800,
    filterQ:    0.7,
    melody:     [NOTE.D4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4],
    reverbWet:  0.5,
    crackle:    false,
  },
  cave: {
    label:  'Cave Echoes',
    bpm:    48,
    chords: [
      [NOTE.A2, NOTE.C3, NOTE.E3, NOTE.G3],
      [NOTE.D2, NOTE.F2, NOTE.A2, NOTE.C3],
      [NOTE.E2, NOTE.G2, NOTE.B2, NOTE.D3],
      [NOTE.A2, NOTE.Eb3, NOTE.G3, NOTE.B3],
    ],
    bass:       [NOTE.A2, NOTE.D2, NOTE.E2, NOTE.A2],
    droneNote:  NOTE.A2,
    filterFreq: 500,
    filterQ:    1.5,
    melody:     [NOTE.A3, NOTE.G3, NOTE.E3, NOTE.F3, NOTE.E3],
    reverbWet:  0.75,
    crackle:    false,
  },
  castle: {
    label:  'Castle Hall',
    bpm:    58,
    chords: [
      [NOTE.D3, NOTE.F3, NOTE.A3, NOTE.C4],
      [NOTE.G2, NOTE.Bb2, NOTE.D3, NOTE.F3],
      [NOTE.C3, NOTE.Eb3, NOTE.G3, NOTE.Bb3],
      [NOTE.A2, NOTE.C3, NOTE.E3, NOTE.G3],
    ],
    bass:       [NOTE.D2, NOTE.G2, NOTE.C2, NOTE.A2],
    droneNote:  NOTE.D2,
    filterFreq: 680,
    filterQ:    1.0,
    melody:     [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.D4, NOTE.C4, NOTE.A3],
    reverbWet:  0.6,
    crackle:    true,
  },
  town: {
    label:  'Town Square',
    bpm:    76,
    chords: [
      [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.B3],
      [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.E4],
      [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.F4],
      [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4],
    ],
    bass:       [NOTE.C2, NOTE.F2, NOTE.G2, NOTE.A2],
    droneNote:  NOTE.C2,
    filterFreq: 1000,
    filterQ:    0.6,
    melody:     [NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.D4, NOTE.E4],
    reverbWet:  0.15,
    crackle:    false,
  },
  combat: {
    label:  'Battle Theme',
    bpm:    100,
    chords: [
      [NOTE.A2, NOTE.C3, NOTE.E3, NOTE.G3],
      [NOTE.E2, NOTE.G2, NOTE.B2, NOTE.D3],
      [NOTE.D2, NOTE.F2, NOTE.A2, NOTE.C3],
      [NOTE.A2, NOTE.Eb3, NOTE.F3, NOTE.A3],
    ],
    bass:       [NOTE.A2, NOTE.E2, NOTE.D2, NOTE.A2],
    droneNote:  NOTE.A2,
    filterFreq: 1200,
    filterQ:    2.0,
    melody:     [NOTE.A3, NOTE.E3, NOTE.G3, NOTE.F3, NOTE.E3, NOTE.A3, NOTE.B3, NOTE.A3],
    reverbWet:  0.2,
    crackle:    false,
  },
  boss: {
    label:  'Boss Encounter',
    bpm:    88,
    chords: [
      [NOTE.D2, NOTE.F2, NOTE.Ab2, NOTE.C3],
      [NOTE.Ab2, NOTE.C3, NOTE.Eb3, NOTE.Bb3],
      [NOTE.E2, NOTE.G2, NOTE.Bb2, NOTE.D3],
      [NOTE.D2, NOTE.Ab2, NOTE.C3, NOTE.Eb3],
    ],
    bass:       [NOTE.D2, NOTE.Ab2, NOTE.E2, NOTE.D2],
    droneNote:  NOTE.D2,
    filterFreq: 1400,
    filterQ:    1.8,
    melody:     [NOTE.D3, NOTE.F3, NOTE.Ab3, NOTE.C4, NOTE.Bb3, NOTE.Ab3],
    reverbWet:  0.35,
    crackle:    false,
  },
  rest: {
    label:  'Campfire Rest',
    bpm:    46,
    chords: [
      [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.F4],
      [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.B3],
      [NOTE.D3, NOTE.F3, NOTE.A3, NOTE.C4],
      [NOTE.G3, NOTE.B3, NOTE.D4],
    ],
    bass:       [NOTE.G2, NOTE.C2, NOTE.D2, NOTE.G2],
    droneNote:  NOTE.G2,
    filterFreq: 550,
    filterQ:    0.5,
    melody:     [NOTE.B3, NOTE.D4, NOTE.G4, NOTE.F4, NOTE.D4, NOTE.B3, NOTE.A3],
    reverbWet:  0.65,
    crackle:    true,
  },
  victory: {
    label:  'Victory Fanfare',
    bpm:    100,
    chords: [
      [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.C4],
      [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4],
      [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4],
      [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.C4],
    ],
    bass:       [NOTE.C2, NOTE.G2, NOTE.F2, NOTE.C2],
    droneNote:  NOTE.C2,
    filterFreq: 1500,
    filterQ:    0.5,
    melody:     [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5, NOTE.B4, NOTE.G4, NOTE.E4, NOTE.C4],
    reverbWet:  0.3,
    crackle:    false,
  },
};

class AudioSystem {
  constructor() {
    this._ctx         = null;
    this._master      = null;
    this._nodes       = [];
    this._schedulers  = [];
    this.currentScene = null;
    this.volume       = 0.7;
    this.muted        = false;
    this._initialized = false;
  }

  // ── Bootstrap (requires user gesture) ────────────────────────
  init() {
    if (this._initialized) return;
    try {
      this._ctx    = new (window.AudioContext || window.webkitAudioContext)();
      this._master = this._ctx.createGain();
      this._master.connect(this._ctx.destination);
      this._master.gain.value = this.volume;
      this._initialized = true;
    } catch (e) { console.warn('Web Audio not available:', e); }
  }

  // ── Public API ────────────────────────────────────────────────
  setScene(name) {
    if (!this._initialized) this.init();
    if (!this._ctx) return;
    if (name === this.currentScene) return;
    this.stopAll();
    this.currentScene = name;
    const config = SCENES[name] || SCENES.dungeon;
    document.getElementById('music-now').textContent = config.label;

    // Short crossfade in
    this._master.gain.setValueAtTime(0, this._ctx.currentTime);
    this._master.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume, this._ctx.currentTime + 2);

    this._buildTrack(config);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this._master && !this.muted) {
      this._master.gain.setTargetAtTime(this.volume, this._ctx.currentTime, 0.1);
    }
  }

  toggle() {
    this.muted = !this.muted;
    document.getElementById('btn-mute').textContent = this.muted ? '🔇' : '🔊';
    if (this._master) {
      this._master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this._ctx.currentTime, 0.1);
    }
  }

  stopAll() {
    this._schedulers.forEach(id => clearTimeout(id));
    this._schedulers = [];
    this._nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch {} });
    this._nodes = [];
  }

  // ── Track Builder ─────────────────────────────────────────────
  _buildTrack(config) {
    if (!this._ctx) return;
    const ctx = this._ctx;

    // Reverb impulse (simple convolver approximation)
    const reverb = this._makeReverb(config.reverbWet);

    // Low-pass filter for lofi sound
    const loFilter = ctx.createBiquadFilter();
    loFilter.type           = 'lowpass';
    loFilter.frequency.value = config.filterFreq;
    loFilter.Q.value        = config.filterQ;
    loFilter.connect(reverb);
    reverb.connect(this._master);

    // High-shelf cut (knock out harsh highs)
    const hiCut = ctx.createBiquadFilter();
    hiCut.type           = 'highshelf';
    hiCut.frequency.value = 4000;
    hiCut.gain.value     = -18;
    hiCut.connect(loFilter);

    // Bass drone (atmospheric low hum)
    this._drone(config.droneNote, hiCut);

    // Vinyl crackle
    if (config.crackle) this._vinylCrackle();

    // Schedule chord + melody loop
    this._scheduleLoop(config, hiCut, 0);
  }

  _scheduleLoop(config, destination, startDelay) {
    if (!this._ctx) return;
    const ctx  = this._ctx;
    const bps  = config.bpm / 60;
    const beat = 1 / bps;
    const barLen = beat * 4;
    const totalBars = config.chords.length;
    const totalDuration = totalBars * barLen;
    const now = ctx.currentTime + startDelay;

    config.chords.forEach((chord, ci) => {
      const barStart = now + ci * barLen;
      const bass     = config.bass?.[ci];

      // Bass note
      if (bass) this._note(bass, barStart, barLen * 0.9, 'sine', 0.09, destination);

      // Chord notes (arpeggiated softly)
      chord.forEach((freq, ni) => {
        const noteStart = barStart + ni * (barLen / chord.length) * 0.5;
        this._note(freq, noteStart, barLen * 0.85, 'triangle', 0.05, destination);
      });
    });

    // Melody notes (sparse, every 2 beats)
    if (config.melody) {
      config.melody.forEach((freq, mi) => {
        const t = now + mi * beat * 2;
        if (t < now + totalDuration) this._note(freq, t, beat * 1.6, 'sine', 0.04, destination);
      });
    }

    // Reschedule
    const id = setTimeout(() => {
      this._scheduleLoop(config, destination, 0);
    }, (totalDuration - 0.3) * 1000);
    this._schedulers.push(id);
  }

  _note(freq, startTime, duration, type, gainVal, destination) {
    if (!this._ctx || startTime < this._ctx.currentTime - 0.01) return;
    const ctx  = this._ctx;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    // Slight detune for warmth
    osc.type      = type;
    osc.frequency.value = freq;
    osc.detune.value    = (Math.random() - 0.5) * 8;

    // ADSR-like envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.08);
    gain.gain.setValueAtTime(gainVal, startTime + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    this._nodes.push(osc, gain);
    // Clean up old stopped nodes periodically
    if (this._nodes.length > 300) this._nodes = this._nodes.filter(n => n.context?.state !== 'closed');
  }

  _drone(freq, destination) {
    if (!this._ctx) return;
    const ctx  = this._ctx;
    const osc  = ctx.createOscillator();
    const lfo  = ctx.createOscillator();
    const lfog = ctx.createGain();
    const gain = ctx.createGain();

    osc.type          = 'sine';
    osc.frequency.value = freq;
    lfo.type          = 'sine';
    lfo.frequency.value = 0.08;
    lfog.gain.value   = 1.5;
    gain.gain.value   = 0.07;

    lfo.connect(lfog);
    lfog.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(destination);

    osc.start();
    lfo.start();
    this._nodes.push(osc, lfo, lfog, gain);
  }

  _vinylCrackle() {
    if (!this._ctx) return;
    const ctx        = this._ctx;
    const sampleRate = ctx.sampleRate;
    const bufLen     = 4 * sampleRate;
    const buffer     = ctx.createBuffer(1, bufLen, sampleRate);
    const data       = buffer.getChannelData(0);

    for (let i = 0; i < bufLen; i++) {
      // Mostly silence with occasional pops
      if (Math.random() < 0.0006) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.003;
      }
    }

    const src    = ctx.createBufferSource();
    const hpf    = ctx.createBiquadFilter();
    const gain   = ctx.createGain();

    src.buffer = buffer;
    src.loop   = true;
    hpf.type              = 'highpass';
    hpf.frequency.value   = 2000;
    gain.gain.value       = 0.06;

    src.connect(hpf);
    hpf.connect(gain);
    gain.connect(this._master);
    src.start();
    this._nodes.push(src, hpf, gain);
  }

  _makeReverb(wet) {
    if (!this._ctx) return this._master;
    const ctx   = this._ctx;
    const dry   = ctx.createGain();
    const wetG  = ctx.createGain();
    const mix   = ctx.createGain();

    dry.gain.value  = 1 - wet * 0.5;
    wetG.gain.value = wet;

    // Impulse response (synthetic)
    const len    = ctx.sampleRate * 2.5;
    const buf    = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;

    dry.connect(mix);
    wetG.connect(conv);
    conv.connect(mix);
    mix.connect(this._master);

    this._nodes.push(dry, wetG, conv, mix);

    // Return the input gain (nodes connect to `dry`)
    return dry;
  }
}

window.audioSystem = new AudioSystem();
