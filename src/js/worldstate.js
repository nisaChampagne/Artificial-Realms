/* ─────────────────────────────────────────────────────────────
   worldstate.js — Time of Day & Weather System
───────────────────────────────────────────────────────────── */
const TIME_META = {
  dawn:      { icon: '🌅', label: 'Dawn',      audioFilter: { brightness: 0.7, fog: false } },
  morning:   { icon: '☀️',  label: 'Morning',   audioFilter: { brightness: 1.0, fog: false } },
  afternoon: { icon: '🌤', label: 'Afternoon', audioFilter: { brightness: 1.0, fog: false } },
  dusk:      { icon: '🌇', label: 'Dusk',      audioFilter: { brightness: 0.6, fog: false } },
  evening:   { icon: '🌆', label: 'Evening',   audioFilter: { brightness: 0.4, fog: false } },
  night:     { icon: '🌙', label: 'Night',     audioFilter: { brightness: 0.2, fog: false } },
};

const WEATHER_META = {
  clear:   { icon: '',   label: 'Clear',    rainVol: 0,   filterNote: '' },
  cloudy:  { icon: '☁️',  label: 'Cloudy',   rainVol: 0,   filterNote: '' },
  rain:    { icon: '🌧', label: 'Rain',     rainVol: 0.3, filterNote: 'Perception (ranged) at disadvantage' },
  storm:   { icon: '⛈', label: 'Storm',    rainVol: 0.6, filterNote: 'Perception (ranged) at disadvantage · Outdoor checks harder' },
  fog:     { icon: '🌫', label: 'Fog',      rainVol: 0,   filterNote: 'Heavily obscured beyond 60ft' },
  snow:    { icon: '❄️',  label: 'Snow',     rainVol: 0.1, filterNote: 'Difficult terrain outdoors' },
};

class WorldStateSystem {
  constructor() {
    this.timeOfDay = 'morning';
    this.weather   = 'clear';
    this.day       = 1;
    this._rainNode  = null;  // Web Audio noise node for weather sounds
    this._rainGain  = null;
  }

  setTime(t) {
    if (!TIME_META[t]) return;
    this.timeOfDay = t;
    this._updateHUD();
  }

  setWeather(w) {
    if (!WEATHER_META[w]) return;
    this.weather = w;
    this._updateHUD();
    this._applyWeatherAudio();
  }

  advanceDay() {
    this.day++;
    this._updateHUD();
  }

  // Returns one-line string injected into the AI's context window
  buildContextString() {
    const t = TIME_META[this.timeOfDay]  || TIME_META.morning;
    const w = WEATHER_META[this.weather] || WEATHER_META.clear;
    let s = `Time: ${t.label}   Weather: ${w.label}   Day ${this.day}`;
    if (w.filterNote) s += `   (${w.filterNote})`;
    return s;
  }

  // ── HUD ──────────────────────────────────────────────────────
  _updateHUD() {
    const el = document.getElementById('world-state-hud');
    if (!el) return;
    const t = TIME_META[this.timeOfDay]  || TIME_META.morning;
    const w = WEATHER_META[this.weather] || WEATHER_META.clear;
    const weatherPart = w.icon ? ` ${w.icon}` : '';
    el.textContent = `${t.icon}${weatherPart}`;
    el.title = this.buildContextString();
  }

  // ── Weather audio layer ──────────────────────────────────────
  _applyWeatherAudio() {
    const audioCtx = window.audioSystem?._ctx;
    if (!audioCtx) return;
    const vol = WEATHER_META[this.weather]?.rainVol ?? 0;

    if (vol > 0) {
      if (!this._rainNode) {
        // White noise buffer
        const bufLen = audioCtx.sampleRate * 2;
        const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        this._rainNode = audioCtx.createBufferSource();
        this._rainNode.buffer = buf;
        this._rainNode.loop = true;

        // Low-pass filter to make it sound like rain, not static
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = this.weather === 'storm' ? 800 : 400;
        filter.Q.value = 0.5;

        this._rainGain = audioCtx.createGain();
        this._rainGain.gain.value = 0;

        this._rainNode.connect(filter);
        filter.connect(this._rainGain);
        this._rainGain.connect(audioCtx.destination);
        this._rainNode.start();
      }
      this._rainGain.gain.setTargetAtTime(vol * 0.08, audioCtx.currentTime, 1.5);
    } else if (this._rainGain) {
      this._rainGain.gain.setTargetAtTime(0, audioCtx.currentTime, 1.5);
    }
  }

  // ── Persistence ──────────────────────────────────────────────
  serialize() {
    return { timeOfDay: this.timeOfDay, weather: this.weather, day: this.day };
  }

  restore(data) {
    if (!data) return;
    this.timeOfDay = data.timeOfDay || 'morning';
    this.weather   = data.weather   || 'clear';
    this.day       = data.day       || 1;
    this._updateHUD();
    this._applyWeatherAudio();
  }
}

window.worldState = new WorldStateSystem();
