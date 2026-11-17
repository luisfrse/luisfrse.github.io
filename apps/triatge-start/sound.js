'use strict';
/* Triatge START · paisatge sonor sintetitzat amb Web Audio (sense fitxers externs).
   - Tres modes: 'off' (per defecte), 'alerts' (només avisos importants) i 'all' (ambient, accions i avisos).
   - Volum de 0 a 1, amb un sostre fix (MAX_GAIN) i un compressor-limitador al final de la cadena: res no pot sonar fort.
   - Sons sobris: sirena que s'acosta, altaveu de l'ambulància, ràdio, cinta, clic, encert/error, rèpliques, trets llunyans…
   - Ambient de fons per escenari ('road', 'industrial', 'crowd', 'rail', 'fire', 'quake', 'shooting', 'airport').
   - Sense AudioContext (proves, navegadors antics) tot és una operació nul·la.
   El so mai és l'única senyal: l'app mostra sempre el text de cada avís. */
(function (root) {
  const MAX_GAIN = 0.32;                 /* sostre del guany mestre (volum 100 %) */
  const ALERTS = { siren: 1, alert: 1, radio: 1, hazard: 1, quake: 1, death: 1, worsen: 1, timeUp: 1, hotClear: 1 };
  const MODES = ['off', 'alerts', 'all'];

  function create(win) {
    win = win || (typeof window !== 'undefined' ? window : {});
    const AC = win.AudioContext || win.webkitAudioContext || null;
    const st = { mode: 'off', volume: 0.6, ctx: null, master: null, comp: null, noise: null, brown: null, amb: null, ambKind: null, threat: false, timers: [] };

    function ensure() {
      if (!AC || st.mode === 'off') return null;
      try {
        if (!st.ctx) {
          st.ctx = new AC();
          st.comp = st.ctx.createDynamicsCompressor();
          setP(st.comp.threshold, -20); setP(st.comp.knee, 12); setP(st.comp.ratio, 8); setP(st.comp.attack, 0.004); setP(st.comp.release, 0.25);
          st.master = st.ctx.createGain(); setP(st.master.gain, gainOf());
          st.master.connect(st.comp); st.comp.connect(st.ctx.destination);
        }
        if (st.ctx.state === 'suspended' && st.ctx.resume) st.ctx.resume();
        return st.ctx;
      } catch (e) { return null; }
    }
    function setP(p, v) { try { if (p && p.setValueAtTime && st.ctx) p.setValueAtTime(v, st.ctx.currentTime); else if (p) p.value = v; } catch (e) { /* res */ } }
    const gainOf = () => Math.max(0, Math.min(1, st.volume)) * MAX_GAIN;
    function noiseBuf(brown) {
      const ctx = st.ctx, len = Math.floor(ctx.sampleRate * 2), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
      return b;
    }
    function src(brown, loop) {
      const ctx = st.ctx; if (brown) st.brown = st.brown || noiseBuf(true); else st.noise = st.noise || noiseBuf(false);
      const s = ctx.createBufferSource(); s.buffer = brown ? st.brown : st.noise; s.loop = !!loop; return s;
    }
    function filt(type, f, q) { const n = st.ctx.createBiquadFilter(); n.type = type; setP(n.frequency, f); if (q) setP(n.Q, q); return n; }
    function gainNode(v) { const n = st.ctx.createGain(); setP(n.gain, v); return n; }
    /* envolupant: 0 → pic (atac) → manté → 0 (alliberament) */
    function env(g, t0, a, peak, hold, rel) { const p = g.gain; p.setValueAtTime(0.0001, t0); p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a); p.setValueAtTime(Math.max(0.0002, peak), t0 + a + hold); p.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel); return t0 + a + hold + rel; }
    function tone(type, f, t0, dur, peak, dest, f2) {
      const ctx = st.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      const end = env(g, t0, Math.min(0.02, dur / 4), peak, Math.max(0, dur - 0.08), 0.06);
      o.connect(g); g.connect(dest || st.master); o.start(t0); o.stop(end + 0.05); return o;
    }
    function burst(t0, dur, peak, type, f, q, dest, brown) {
      const s = src(brown, false), fl = filt(type, f, q), g = st.ctx.createGain();
      const end = env(g, t0, 0.004, peak, 0, dur);
      s.connect(fl); fl.connect(g); g.connect(dest || st.master); s.start(t0, Math.random() * 1.5); s.stop(end + 0.05);
    }
    /* «veu» de megafonia o de ràdio: síl·labes sintètiques (sense paraules), molt filtrades */
    function voice(t0, dur, peak, lo, hi, dest) {
      const ctx = st.ctx, o = ctx.createOscillator(), f1 = filt('bandpass', lo, 4), f2 = filt('bandpass', hi, 5), g = ctx.createGain(), am = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t0);
      const syl = Math.max(3, Math.round(dur * 4.5));
      for (let i = 0; i < syl; i++) { const ts = t0 + i * dur / syl; o.frequency.setValueAtTime(130 + Math.random() * 60, ts); }
      am.gain.setValueAtTime(0.0001, t0);
      for (let i = 0; i < syl; i++) { const ts = t0 + i * dur / syl, len = dur / syl; am.gain.exponentialRampToValueAtTime(1, ts + len * 0.3); am.gain.exponentialRampToValueAtTime(0.05, ts + len * 0.95); }
      am.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.1);
      setP(g.gain, peak);
      o.connect(f1); o.connect(f2); f1.connect(am); f2.connect(am); am.connect(g); g.connect(dest || st.master);
      o.start(t0); o.stop(t0 + dur + 0.2);
    }
    /* eco curt (sensació d'espai obert) */
    function echo(delay, fb) {
      const ctx = st.ctx, inp = ctx.createGain(), d = ctx.createDelay(1), f = ctx.createGain(), lp = filt('lowpass', 1800);
      setP(d.delayTime, delay); setP(f.gain, fb);
      inp.connect(st.master); inp.connect(d); d.connect(lp); lp.connect(f); f.connect(d); lp.connect(st.master);
      return inp;
    }

    const FX = {
      click: (t) => tone('sine', 1500, t, 0.03, 0.05),
      tag: (t) => { burst(t, 0.09, 0.09, 'bandpass', 2600, 1.2); tone('triangle', 520, t + 0.06, 0.08, 0.05); },
      ok: (t) => { tone('triangle', 660, t, 0.12, 0.09); tone('triangle', 880, t + 0.11, 0.18, 0.08); },
      bad: (t) => { tone('sine', 230, t, 0.28, 0.13, null, 180); tone('sine', 115, t, 0.28, 0.06); },
      alert: (t) => { tone('triangle', 880, t, 0.12, 0.08); tone('triangle', 880, t + 0.22, 0.12, 0.08); },
      breath: (t) => burst(t, 0.12, 0.035, 'bandpass', 700, 0.8),
      /* tic suau del pols (vista ampliada) */
      pulse: (t) => tone('sine', 90, t, 0.09, 0.12, null, 60),
      worsen: (t) => { tone('triangle', 740, t, 0.14, 0.08); tone('triangle', 560, t + 0.18, 0.2, 0.08); },
      death: (t) => { tone('sine', 196, t, 0.5, 0.09); tone('sine', 147, t + 0.25, 0.7, 0.07); },
      timeUp: (t) => { tone('triangle', 523, t, 0.2, 0.08); tone('triangle', 392, t + 0.25, 0.35, 0.08); },
      /* sirena de dos tons que s'acosta (puja de volum, lleuger efecte Doppler) i s'atura en arribar */
      siren: (t) => {
        const ctx = st.ctx, o = ctx.createOscillator(), lp = filt('lowpass', 900), g = ctx.createGain(), dur = 3.6;
        o.type = 'triangle';
        for (let i = 0; i < 8; i++) o.frequency.setValueAtTime((i % 2 ? 460 : 615) * (1.02 - i * 0.004), t + i * 0.45);
        lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(1700, t + dur * 0.85);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.02, t + 0.3); g.gain.exponentialRampToValueAtTime(0.11, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); g.connect(st.master); o.start(t); o.stop(t + dur + 0.05);
        burst(t + dur - 0.1, 0.5, 0.02, 'lowpass', 300, 0.7, null, true);   /* motor que s'atura */
      },
      /* sirena que s'allunya (ambulància que surt cap a l'hospital) */
      sirenOut: (t) => {
        const ctx = st.ctx, o = ctx.createOscillator(), lp = filt('lowpass', 1500), g = ctx.createGain(), dur = 2.8;
        o.type = 'triangle';
        for (let i = 0; i < 7; i++) o.frequency.setValueAtTime((i % 2 ? 460 : 615) * (0.99 - i * 0.006), t + i * 0.42);
        lp.frequency.setValueAtTime(1500, t); lp.frequency.linearRampToValueAtTime(500, t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); g.connect(st.master); o.start(t); o.stop(t + dur + 0.05);
      },
      /* altaveu de l'ambulància: carilló de dos tons i una «veu» llunyana amb eco */
      speaker: (t) => {
        const e = echo(0.18, 0.28);
        tone('sine', 659, t, 0.45, 0.08, e); tone('sine', 1318, t, 0.3, 0.015, e);
        tone('sine', 523, t + 0.45, 0.6, 0.08, e); tone('sine', 1046, t + 0.45, 0.4, 0.015, e);
        voice(t + 1.2, 1.9, 0.11, 650, 1250, e);
      },
      /* ràdio: soroll de squelch, missatge filtrat i bip final */
      radio: (t) => {
        burst(t, 0.12, 0.05, 'highpass', 1800, 0.7);
        voice(t + 0.12, 1.0, 0.09, 900, 1900);
        burst(t + 1.18, 0.1, 0.045, 'highpass', 1800, 0.7);
        tone('sine', 1250, t + 1.3, 0.07, 0.04);
      },
      hotClear: (t) => { FX.radio(t); FX.ok(t + 1.5); },
      /* rèplica o esfondrament: retruny greu i runa que cau */
      quake: (t) => {
        const s = src(true, false), lp = filt('lowpass', 110), g = st.ctx.createGain();
        env(g, t, 0.6, 0.5, 1.2, 1.4); s.connect(lp); lp.connect(g); g.connect(st.master); s.start(t); s.stop(t + 3.4);
        for (let i = 0; i < 7; i++) burst(t + 0.5 + Math.random() * 2, 0.05 + Math.random() * 0.08, 0.025, 'bandpass', 1800 + Math.random() * 2000, 2);
      },
      /* perill nou (amenaça, foc, segon incident): avís greu i ràdio */
      hazard: (t) => { tone('triangle', 587, t, 0.18, 0.09); tone('triangle', 587, t + 0.25, 0.18, 0.09); tone('triangle', 440, t + 0.5, 0.35, 0.09); FX.radio(t + 1.0); },
      /* tret llunyà: esclat curt, molt filtrat, amb cua i eco */
      shot: (t) => { const e = echo(0.23, 0.22); burst(t, 0.35, 0.16, 'lowpass', 900, 0.8, e); burst(t, 0.06, 0.06, 'bandpass', 2400, 1, e); }
    };

    /* ---------- ambient ---------- */
    function after(ms, f) { const id = (win.setTimeout || setTimeout)(function () { st.timers = st.timers.filter((x) => x !== id); f(); }, ms); st.timers.push(id); return id; }
    function every(minMs, maxMs, f) { const loop = () => after(minMs + Math.random() * (maxMs - minMs), () => { if (!st.amb) return; try { f(st.ctx.currentTime + 0.05); } catch (e) { /* res */ } loop(); }); loop(); }
    function bed(brown, type, f, q, level, out) { const s = src(brown, true), fl = filt(type, f, q), g = gainNode(level); s.connect(fl); fl.connect(g); g.connect(out); s.start(); return s; }
    function lfoTo(param, rate, depth) { const o = st.ctx.createOscillator(), g = gainNode(depth); o.frequency.value = rate; o.connect(g); g.connect(param); o.start(); return o; }
    function startAmb(kind) {
      const ctx = ensure(); if (!ctx) return;
      const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, ctx.currentTime); out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2.5); out.connect(st.master);
      const nodes = [];
      const crowd = (lvl) => { [380, 760, 1500].forEach((f, i) => { const g = gainNode(lvl); const s = src(false, true), b = filt('bandpass', f, 3); s.connect(b); b.connect(g); g.connect(out); s.start(); nodes.push(s, lfoTo(g.gain, 0.15 + i * 0.11, lvl * 0.6)); }); };
      const crackle = (rate, lvl) => every(1000 / rate * 0.5, 1000 / rate * 1.5, (t) => burst(t, 0.006 + Math.random() * 0.02, lvl * (0.5 + Math.random()), 'highpass', 1800 + Math.random() * 2500, 0.7, out));
      switch (kind) {
        case 'road': nodes.push(bed(true, 'lowpass', 380, 0.7, 0.07, out)); every(9000, 20000, (t) => { const s = src(false, false), b = filt('bandpass', 300, 1.5), g = gainNode(0.0001); b.frequency.setValueAtTime(260, t); b.frequency.linearRampToValueAtTime(900, t + 1.6); b.frequency.linearRampToValueAtTime(280, t + 3.4); env(g, t, 1.4, 0.05, 0.3, 1.8); s.connect(b); b.connect(g); g.connect(out); s.start(t); s.stop(t + 3.6); }); break;
        case 'industrial': nodes.push(bed(true, 'lowpass', 220, 0.7, 0.08, out)); every(7000, 16000, (t) => tone('sine', 310, t, 1.6, 0.025, out, 240)); crackle(1.5, 0.012); break;
        case 'fire': nodes.push(bed(true, 'lowpass', 320, 0.7, 0.08, out)); crackle(7, 0.03); break;
        case 'crowd': crowd(0.035); nodes.push(bed(true, 'lowpass', 250, 0.7, 0.03, out)); break;
        case 'rail': nodes.push(bed(true, 'lowpass', 260, 0.7, 0.06, out)); every(4000, 11000, (t) => { if (st.threat) { burst(t, 0.12, 0.035, 'highpass', 3000, 0.7, out); burst(t + 0.18, 0.06, 0.025, 'highpass', 3500, 0.7, out); } }); break;
        case 'quake': nodes.push(bed(true, 'lowpass', 95, 0.7, 0.12, out)); every(6000, 14000, (t) => { for (let i = 0; i < 5; i++) burst(t + Math.random() * 1.2, 0.04, 0.015, 'bandpass', 1500 + Math.random() * 2500, 2, out); }); break;
        case 'shooting': crowd(0.02); nodes.push(bed(true, 'lowpass', 300, 0.7, 0.04, out)); every(6500, 15000, (t) => { if (!st.threat) return; const k = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < k; i++) FX.shot(t + i * (0.25 + Math.random() * 0.35)); }); break;
        case 'airport': nodes.push(bed(false, 'bandpass', 2600, 4, 0.012, out)); nodes.push(bed(true, 'lowpass', 300, 0.7, 0.07, out)); crackle(4, 0.02); break;
        default: nodes.push(bed(true, 'lowpass', 300, 0.7, 0.06, out));
      }
      st.amb = { out: out, nodes: nodes }; st.ambKind = kind;
    }
    function stopAmb() {
      st.timers.forEach((id) => { try { (win.clearTimeout || clearTimeout)(id); } catch (e) { /* res */ } }); st.timers = [];
      const a = st.amb; st.amb = null; st.ambKind = null;
      if (!a || !st.ctx) return;
      try { const t = st.ctx.currentTime; a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(Math.max(0.0001, a.out.gain.value || 0.5), t); a.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); } catch (e) { /* res */ }
      after(700, function () { a.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* res */ } }); try { a.out.disconnect(); } catch (e) { /* res */ } });
    }

    const api = {
      MODES: MODES, MAX_GAIN: MAX_GAIN,
      get available() { return !!AC; },
      get mode() { return st.mode; }, get volume() { return st.volume; }, get ambKind() { return st.ambKind; }, get threat() { return st.threat; },
      /* o: {mode, volume}. Canviar de mode atura l'ambient si ja no correspon. */
      configure: function (o) {
        o = o || {};
        if (MODES.indexOf(o.mode) >= 0) st.mode = o.mode;
        if (typeof o.volume === 'number' && isFinite(o.volume)) st.volume = Math.max(0, Math.min(1, o.volume));
        if (st.master) setP(st.master.gain, gainOf());
        if (st.mode !== 'all' && st.amb) stopAmb();
        if (st.mode === 'off' && st.ctx && st.ctx.suspend) { try { st.ctx.suspend(); } catch (e) { /* res */ } }
        return api;
      },
      /* reprodueix un efecte; retorna true si ha sonat */
      play: function (name, delay) {
        if (st.mode === 'off' || !FX[name]) return false;
        if (st.mode === 'alerts' && !ALERTS[name]) return false;
        const ctx = ensure(); if (!ctx) return false;
        try { FX[name](ctx.currentTime + 0.02 + (delay || 0)); return true; } catch (e) { return false; }
      },
      allowed: function (name) { return st.mode === 'all' || (st.mode === 'alerts' && !!ALERTS[name]); },
      ambience: function (kind) {
        if (!kind || st.mode !== 'all') { if (st.amb) stopAmb(); return false; }
        if (st.ambKind === kind && st.amb) return true;
        if (st.amb) stopAmb();
        try { startAmb(kind); } catch (e) { st.amb = null; }
        return !!st.amb;
      },
      setThreat: function (on) { st.threat = !!on; },
      stop: function () { stopAmb(); },
      suspend: function () { if (st.ctx && st.ctx.suspend) { try { st.ctx.suspend(); } catch (e) { /* res */ } } },
      resume: function () { if (st.ctx && st.ctx.resume && st.mode !== 'off') { try { st.ctx.resume(); } catch (e) { /* res */ } } },
      FX: Object.keys(FX), ALERTS: Object.keys(ALERTS)
    };
    return api;
  }
  const M = { create: create, MAX_GAIN: MAX_GAIN, MODES: MODES };
  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.TriageSound = M;
})(typeof window !== 'undefined' ? window : this);
