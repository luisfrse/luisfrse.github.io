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
  /* ajust de nivell per escena (bus de l'ambient) */
  const TRIM = { road: 0.55, industrial: 0.35, fire: 1, crowd: 1, rail: 0.55, quake: 0.25, shooting: 0.5, airport: 0.45 };

  /* opts (només proves i mesuraments): rng() → [0,1) per fer el sorteig determinista; clock() → segons per programar els
     esdeveniments (per defecte, ctx.currentTime); onEvent(tipus, t, ambient) per comptar els esdeveniments programats. */
  function create(win, opts) {
    win = win || (typeof window !== 'undefined' ? window : {});
    opts = opts || {};
    const AC = win.AudioContext || win.webkitAudioContext || null;
    const st = { mode: 'off', volume: 0.6, ctx: null, master: null, comp: null, noise: null, brown: null, clack: null, amb: null, ambKind: null, ambT0: 0, threat: false, timers: [], keep: [] };
    const R = typeof opts.rng === 'function' ? opts.rng : Math.random;
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length) % arr.length];
    const now = () => (typeof opts.clock === 'function' ? opts.clock() : st.ctx.currentTime);
    const ev = (kind, t) => { if (opts.onEvent) { try { opts.onEvent(kind, t, st.ambKind); } catch (e) { /* res */ } } };

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
      for (let i = 0; i < len; i++) { const w = R() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
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
      s.connect(fl); fl.connect(g); g.connect(dest || st.master); s.start(t0, R() * 1.5); s.stop(end + 0.05);
    }
    /* «veu» de megafonia o de ràdio: síl·labes sintètiques (sense paraules), molt filtrades */
    function voice(t0, dur, peak, lo, hi, dest) {
      const ctx = st.ctx, o = ctx.createOscillator(), f1 = filt('bandpass', lo, 4), f2 = filt('bandpass', hi, 5), g = ctx.createGain(), am = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t0);
      const syl = Math.max(3, Math.round(dur * 4.5));
      for (let i = 0; i < syl; i++) { const ts = t0 + i * dur / syl; o.frequency.setValueAtTime(130 + R() * 60, ts); }
      am.gain.setValueAtTime(0.0001, t0);
      for (let i = 0; i < syl; i++) { const ts = t0 + i * dur / syl, len = dur / syl; am.gain.exponentialRampToValueAtTime(1, ts + len * 0.3); am.gain.exponentialRampToValueAtTime(0.05, ts + len * 0.95); }
      am.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.1);
      setP(g.gain, peak);
      o.connect(f1); o.connect(f2); f1.connect(am); f2.connect(am); am.connect(g); g.connect(dest || st.master);
      o.start(t0); o.stop(t0 + dur + 0.2);
    }
    /* eco curt (sensació d'espai obert) */
    function echo(delay, fb, dest, life, keep) {
      const ctx = st.ctx, inp = ctx.createGain(), d = ctx.createDelay(1), f = ctx.createGain(), lp = filt('lowpass', 1800), out = dest || st.master;
      setP(d.delayTime, delay); setP(f.gain, fb);
      inp.connect(out); inp.connect(d); d.connect(lp); lp.connect(f); f.connect(d); lp.connect(out);
      if (life) after(life * 1000, function () { [inp, d, lp, f].forEach((n) => { try { n.disconnect(); } catch (e) { /* res */ } }); }, keep);
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
        const e = echo(0.18, 0.28, null, 6, true);
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
        for (let i = 0; i < 7; i++) burst(t + 0.5 + R() * 2, 0.05 + R() * 0.08, 0.025, 'bandpass', 1800 + R() * 2000, 2);
      },
      /* perill nou (amenaça, foc, segon incident): avís greu i ràdio */
      hazard: (t) => { tone('triangle', 587, t, 0.18, 0.09); tone('triangle', 587, t + 0.25, 0.18, 0.09); tone('triangle', 440, t + 0.5, 0.35, 0.09); FX.radio(t + 1.0); },
      /* tret llunyà: esclat curt, molt filtrat, amb cua i eco */
      shot: (t) => shotAt(t, echo(0.31, 0.3, null, 4, true), 1)
    };

    /* ---------- ambient ----------
       Principi de disseny: res de soroll ample i continu (sonava a vent). Cada escena és una suma de
       (1) llits molt baixos, estrets i amb sentit (brum, ralentí, rugit greu de flama) i
       (2) esdeveniments discrets reconeixibles programats amb temporitzadors: veus (síntesi formàntica), crits, plors,
       sirenes amb efecte Doppler, cotxes, clàxons, alarmes, cruiximents, vidres, gotes, espurnes, crepitar…
       Tot passa per un bus (out) que s'esvaeix en parar-lo; els ecos de l'escena són compartits (no s'acumulen nodes). */
    function after(ms, f, keep) { const arr = keep ? st.keep : st.timers; const id = (win.setTimeout || setTimeout)(function () { const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); f(); }, ms); arr.push(id); return id; }
    /* en pausa (pestanya oculta, context suspès) el temps d'àudio no avança: no s'acumulen esdeveniments per soltar-los tots en reprendre */
    const live = () => typeof opts.clock === 'function' || !st.ctx || st.ctx.state !== 'suspended';
    /* esdeveniment periòdic amb interval aleatori; first (ms) = espera fins al primer (per defecte, una part de l'interval) */
    function every(minMs, maxMs, f, first) {
      const loop = (ms) => after(ms, () => { if (!st.amb) return; if (live()) { try { f(now() + 0.05); } catch (e) { /* res */ } } loop(minMs + R() * (maxMs - minMs)); });
      loop(first === undefined ? R() * minMs : first);
    }
    function lfoTo(param, rate, depth) { const o = st.ctx.createOscillator(), g = gainNode(depth); o.frequency.value = rate; o.connect(g); g.connect(param); o.start(); return o; }
    /* campana de volum: s'acosta, passa i s'allunya */
    function bell(g, t0, dur, peak, floor) {
      const p = g.gain, lo = Math.max(0.0001, peak * (floor || 0.12));
      p.setValueAtTime(0.0001, t0); p.exponentialRampToValueAtTime(lo, t0 + dur * 0.12); p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + dur * 0.5);
      p.exponentialRampToValueAtTime(lo * 1.4, t0 + dur * 0.8); p.exponentialRampToValueAtTime(0.0001, t0 + dur);
    }
    /* efecte Doppler (en cents): s'acosta (agut), passa i s'allunya (greu); canvi brusc al punt de màxima proximitat */
    function doppler(o, t0, dur, cents) {
      if (!o || !o.detune) return;
      o.detune.setValueAtTime(cents, t0); o.detune.linearRampToValueAtTime(cents * 0.8, t0 + dur * 0.44); o.detune.linearRampToValueAtTime(-cents * 0.8, t0 + dur * 0.56); o.detune.linearRampToValueAtTime(-cents, t0 + dur);
    }
    /* veu humana sintètica: oscil·lador de ploma (vibrato) amb tres filtres de formants vocàlics i envolupant sil·làbica */
    const VOW = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240], [650, 1100, 2600]];
    function out0() { return st.amb ? st.amb.out : st.master; }
    function vocal(t0, o) {
      const ctx = st.ctx, osc = ctx.createOscillator(), am = ctx.createGain(), lp = filt('lowpass', o.lp || 2600, 0.7), sc = o.scale || 1, fl = [], lfo = ctx.createOscillator(), lg = ctx.createGain();
      osc.type = 'sawtooth';
      [1, 0.55, 0.25].forEach((w, i) => { const b = filt('bandpass', VOW[o.syl[0].v][i] * sc, [6, 8, 10][i]), g = gainNode(w); osc.connect(b); b.connect(g); g.connect(am); fl.push(b); });
      let t = t0, prev = VOW[o.syl[0].v];
      am.gain.setValueAtTime(0.0001, t0);
      o.syl.forEach((s, k) => {
        const a = s.a || 0.04, v = VOW[s.v], last = k === o.syl.length - 1, pk = Math.max(0.0002, o.level * (s.w || 1));
        fl.forEach((b, i) => { if (k) { b.frequency.setValueAtTime(prev[i] * sc, t); b.frequency.linearRampToValueAtTime(v[i] * sc, t + 0.05); } });
        osc.frequency.setValueAtTime(o.f0 * s.m0, t); osc.frequency.linearRampToValueAtTime(o.f0 * s.m1, t + s.len);
        if (!s.cont) { am.gain.setValueAtTime(0.0001, t); am.gain.exponentialRampToValueAtTime(pk, t + a); }
        if (!s.tie || last) { am.gain.setValueAtTime(pk, t + Math.max(a, s.len * 0.62)); am.gain.exponentialRampToValueAtTime(0.0001, t + s.len); }
        prev = v; t += s.len + (s.gap || 0);
      });
      const tgt = osc.detune || osc.frequency, depth = o.vib ? (osc.detune ? o.vib[1] : o.f0 * o.vib[1] * 0.00058) : 0;
      lfo.frequency.value = o.vib ? o.vib[0] : 5; setP(lg.gain, depth); lfo.connect(lg); lg.connect(tgt);
      am.connect(lp); lp.connect(o.dest || out0());
      osc.start(t0); lfo.start(t0); osc.stop(t + 0.1); lfo.stop(t + 0.1);
      return t - t0;
    }
    function talk(t, f0, level, scale, dest, lp, nSyl, len) {
      const n = nSyl || 2 + Math.floor(R() * 4), syl = [], base = rr(0.93, 1.07);
      for (let i = 0; i < n; i++) { const e = i === n - 1; syl.push({ len: rr(0.13, 0.26) * (len || 1) * (e ? 1.25 : 1), v: pick([0, 0, 1, 3, 3, 4, 2]), m0: base * rr(0.94, 1.06), m1: base * (e ? rr(0.82, 0.94) : rr(0.95, 1.07)), gap: rr(0.02, 0.1), w: rr(0.6, 1) }); }
      return vocal(t, { f0: f0, level: level, scale: scale, lp: lp, dest: dest, vib: [5.2, 12], syl: syl });
    }
    /* crit llunyà (breu, agut, amb vibrato i ruptura de to) */
    function scream(t, f0, level, scale, dest) {
      const L1 = rr(0.18, 0.28), L2 = rr(0.3, 0.55);
      return vocal(t, { f0: f0, level: level, scale: scale * 1.12, lp: 3200, dest: dest, vib: [6.5, 28], syl: [{ len: L1, v: 0, m0: 0.88, m1: 1.4, a: 0.03, tie: true }, { len: L2, v: pick([0, 5]), m0: 1.4, m1: rr(1.05, 1.25), cont: true }] });
    }
    /* plor (nen o adult): polsos sil·làbics que baixen de to */
    function wail(t, f0, level, scale, dest) {
      const n = 2 + Math.floor(R() * 3), syl = [];
      for (let i = 0; i < n; i++) syl.push({ len: rr(0.32, 0.5), v: i % 2 ? 1 : 0, m0: 1.12 - i * 0.03, m1: 0.86 - i * 0.02, gap: rr(0.1, 0.2), a: 0.06, w: 1 - i * 0.12 });
      return vocal(t, { f0: f0, level: level, scale: scale, lp: 2800, dest: dest, vib: [6, 22], syl: syl });
    }
    function bark(t, f0, level, dest) {
      const n = 2 + Math.floor(R() * 4), syl = [];
      for (let i = 0; i < n; i++) syl.push({ len: rr(0.13, 0.2), v: 5, m0: 1.22, m1: 0.8, a: 0.008, gap: rr(0.16, 0.3), w: rr(0.7, 1) });
      return vocal(t, { f0: f0 * rr(0.92, 1.08), level: level, scale: 1, lp: 2300, dest: dest, syl: syl });
    }
    /* sirena que passa: 'hilo' (dos tons), 'wail' (oscil·lant) o 'yelp' (ràpida) amb Doppler i volum en campana */
    function sirenPass(t, o) {
      const ctx = st.ctx, osc = ctx.createOscillator(), lp = filt('lowpass', 1500, 0.7), g = ctx.createGain(), dur = o.dur, f = o.f;
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, t);
      if (o.kind === 'hilo') { for (let x = 0, i = 0; x < dur; x += 0.55, i++) osc.frequency.setValueAtTime(i % 2 ? f * 0.75 : f, t + x); }
      else if (o.kind === 'wail') { for (let x = 0; x < dur; x += 3.6) { osc.frequency.linearRampToValueAtTime(f * 1.85, t + x + 1.6); osc.frequency.linearRampToValueAtTime(f, t + x + 3.6); } }
      else { for (let x = 0; x < dur; x += 0.36) { osc.frequency.setValueAtTime(f, t + x); osc.frequency.linearRampToValueAtTime(f * 1.8, t + x + 0.33); } }
      lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2300, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(900, t + dur);
      doppler(osc, t, dur, o.doppler || 110); bell(g, t, dur, o.level, 0.1);
      osc.connect(lp); lp.connect(g); g.connect(o.dest); osc.start(t); osc.stop(t + dur + 0.1);
    }
    /* cotxe/camió que passa: motor greu + rodament, amb Doppler */
    function carPass(t, level, dest) {
      const ctx = st.ctx, dur = rr(3.4, 5.5), osc = ctx.createOscillator(), lp = filt('lowpass', 520, 0.7), g = ctx.createGain(), n = src(false, false), bp = filt('bandpass', 750, 0.8), gn = gainNode(0.5);
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(rr(62, 105), t); doppler(osc, t, dur, 160); bell(g, t, dur, level, 0.1);
      bp.frequency.setValueAtTime(950, t); bp.frequency.linearRampToValueAtTime(520, t + dur);
      osc.connect(lp); lp.connect(g); n.connect(bp); bp.connect(gn); gn.connect(g); g.connect(dest);
      osc.start(t); osc.stop(t + dur + 0.1); n.start(t, R() * 1.5); n.stop(t + dur + 0.1);
    }
    function horn(t, level, dest) {
      const ctx = st.ctx, lp = filt('lowpass', 1700, 0.7), g = ctx.createGain(), d = rr(0.25, 0.7), f = rr(380, 470);
      [f, f * 1.25].forEach((x) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(x, t); o.connect(lp); o.start(t); o.stop(t + d + 0.15); });
      env(g, t, 0.01, level, d, 0.08); lp.connect(g); g.connect(dest);
    }
    function klaxon(t, level, dest) {
      const ctx = st.ctx, n = 4 + Math.floor(R() * 4), lp = filt('lowpass', 1500, 0.7), g = ctx.createGain(), f = pick([740, 880]);
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(f, t); o.connect(lp); lp.connect(g); g.connect(dest);
      g.gain.setValueAtTime(0.0001, t);
      for (let i = 0; i < n; i++) { const ts = t + i * 0.5; g.gain.setValueAtTime(0.0001, ts); g.gain.exponentialRampToValueAtTime(level, ts + 0.02); g.gain.setValueAtTime(level, ts + 0.27); g.gain.exponentialRampToValueAtTime(0.0001, ts + 0.32); }
      o.start(t); o.stop(t + n * 0.5 + 0.1);
    }
    function alarmCar(t, level, dest) {
      const ctx = st.ctx, dur = rr(6, 11), o = ctx.createOscillator(), lp = filt('lowpass', 2300, 0.7), g = ctx.createGain();
      o.type = 'square';
      for (let x = 0; x < dur; x += 0.9) { o.frequency.setValueAtTime(700, t + x); o.frequency.linearRampToValueAtTime(1750, t + x + 0.42); o.frequency.setValueAtTime(1750, t + x + 0.45); o.frequency.linearRampToValueAtTime(700, t + x + 0.88); }
      env(g, t, 0.05, level, dur, 0.1); o.connect(lp); lp.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.3);
    }
    /* cruiximent metàl·lic o de fusta (fricció a salts) */
    function creak(t, level, dest, f0, lenS) {
      const ctx = st.ctx, d = lenS || rr(0.5, 1.4), o = ctx.createOscillator(), bp = filt('bandpass', rr(600, 1100), 5), g = ctx.createGain(), base = f0 || rr(70, 130);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(base, t);
      for (let x = 0.03; x < d; x += 0.03) o.frequency.setValueAtTime(base * (0.85 + R() * 0.3) * (1 - 0.25 * x / d), t + x);
      env(g, t, 0.08, level, d * 0.6, d * 0.4); o.connect(bp); bp.connect(g); g.connect(dest); o.start(t); o.stop(t + d + 0.3);
    }
    function clang(t, level, dest) {
      const f = rr(300, 520); [1, 2.76, 5.4, 8.93].forEach((m, i) => tone('sine', f * m, t, 0.9 - i * 0.18, level / (1 + i * 1.3), dest));
    }
    function drip(t, level, dest) { const f = rr(1300, 2500); tone('sine', f * 0.8, t, 0.07, level, dest, f * 1.35); tone('sine', f * 0.8, t + 0.19, 0.06, level * 0.35, dest, f * 1.3); }
    function sparks(t, level, dest) { const n = 6 + Math.floor(R() * 8); for (let i = 0; i < n; i++) burst(t + R() * 0.45, 0.004 + R() * 0.01, level * (0.4 + R() * 0.6), 'highpass', 3500 + R() * 2500, 0.7, dest); }
    /* crepitar: molts xocs curts d'energia desigual (distribució exponencial) i algun espetec */
    function crackleBatch(t, span, rate, lvl, dest) {
      for (let x = -Math.log(1 - R()) / rate; x < span; x += -Math.log(1 - R()) / rate) {
        const e = Math.min(1, -Math.log(1 - R()) * 0.45), k = R();
        if (k < 0.6) burst(t + x, 0.003 + R() * 0.011, lvl * (0.12 + e), 'highpass', 2400 + R() * 3200, 0.7, dest);
        else if (k < 0.93) burst(t + x, 0.008 + R() * 0.018, lvl * (0.2 + e), 'bandpass', 1100 + R() * 1500, 1.2, dest);
        else burst(t + x, 0.03 + R() * 0.05, lvl * (0.6 + e), 'lowpass', 1300 + R() * 900, 0.8, dest);
      }
    }
    function pop(t, level, dest) { burst(t, 0.025, level, 'bandpass', 2200 + R() * 1200, 1.2, dest); burst(t, 0.09, level * 0.7, 'lowpass', 600, 0.8, dest); }
    function newGain() { return st.ctx.createGain(); }
    /* retrum: soroll marró molt greu amb tremolor (la terra) més un cruiximent de runa a la franja baixa-mitjana */
    function rumble(t, dur, level, dest) {
      const s = src(true, false), lp = filt('lowpass', rr(85, 125), 0.7), g = newGain(), sh = st.ctx.createOscillator(), sg = gainNode(level * 0.35);
      env(g, t, dur * 0.3, level, dur * 0.3, dur * 0.4);
      sh.frequency.value = rr(7, 11); sh.connect(sg); sg.connect(g.gain);
      s.connect(lp); lp.connect(g); g.connect(dest); s.start(t, R() * 1.5); s.stop(t + dur + 0.1); sh.start(t); sh.stop(t + dur + 0.1);
      const s2 = src(true, false), bp = filt('bandpass', rr(160, 230), 1.2), g2 = newGain();
      env(g2, t, dur * 0.3, level * 0.8, dur * 0.3, dur * 0.4); s2.connect(bp); bp.connect(g2); g2.connect(dest); s2.start(t, R() * 1.5); s2.stop(t + dur + 0.1);
    }
    function debris(t, n, level, dest) {
      for (let i = 0; i < n; i++) {
        const x = t + R() * 2.6;
        if (R() < 0.55) burst(x, 0.05 + R() * 0.12, level * (0.4 + R()), 'lowpass', 450 + R() * 600, 0.8, dest);
        else { const f = rr(2800, 6200); tone('sine', f, x, 0.05 + R() * 0.1, level * 0.35 * (0.4 + R()), dest); tone('sine', f * 1.51, x, 0.04, level * 0.15, dest); }
      }
    }
    function whistle(t, level, dest) {
      const ctx = st.ctx, o = ctx.createOscillator(), g = ctx.createGain(), lg = ctx.createGain(), f = rr(1900, 2300);
      o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.06, t + 0.12);
      const l = ctx.createOscillator(); l.frequency.value = 38; setP(lg.gain, f * 0.025); l.connect(lg); lg.connect(o.frequency);
      env(g, t, 0.03, level, 0.5, 0.15); o.connect(g); g.connect(dest); o.start(t); l.start(t); o.stop(t + 0.8); l.stop(t + 0.8);
    }
    function trainHorn(t, level, dest) {
      const ctx = st.ctx, lp = filt('lowpass', 1100, 0.7), g = ctx.createGain(), d = rr(1.1, 1.9), f = rr(330, 370);
      [f, f * 1.26].forEach((x) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(x * 1.04, t); o.frequency.linearRampToValueAtTime(x, t + 0.15); o.connect(lp); o.start(t); o.stop(t + d + 0.4); });
      env(g, t, 0.08, level, d, 0.25); lp.connect(g); g.connect(dest);
    }
    /* tren que passa: bucle de repic de rodes («ta-tak ta-tak») amb Doppler a la velocitat, ronc de via i corneta */
    function clackBuf() {
      if (st.clack) return st.clack;
      const ctx = st.ctx, sr = ctx.sampleRate, len = Math.floor(sr * 0.9), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      [0, 0.2, 0.45, 0.65].forEach((at, i) => {
        const s0 = Math.floor(at * sr), amp = i % 2 ? 0.7 : 1;
        for (let k = 0; k < sr * 0.09 && s0 + k < len; k++) { const tt = k / sr; d[s0 + k] += amp * (Math.sin(2 * Math.PI * 140 * tt) * Math.exp(-tt / 0.03) * 0.8 + (R() * 2 - 1) * Math.exp(-tt / 0.006) * 0.5); }
      });
      st.clack = b; return b;
    }
    function trainPass(t, dur, level, dest) {
      const ctx = st.ctx, s = ctx.createBufferSource(), bp = filt('bandpass', 480, 0.8), g = ctx.createGain();
      s.buffer = clackBuf(); s.loop = true;
      if (s.playbackRate) { s.playbackRate.setValueAtTime(1.08, t); s.playbackRate.linearRampToValueAtTime(1.07, t + dur * 0.44); s.playbackRate.linearRampToValueAtTime(0.93, t + dur * 0.56); s.playbackRate.linearRampToValueAtTime(0.92, t + dur); }
      bell(g, t, dur, level, 0.08); s.connect(bp); bp.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.1);
      rumble(t, dur, level * 0.5, dest);
    }
    function heli(t, dur, level, dest) {
      const ctx = st.ctx, s = src(false, false), bp = filt('bandpass', 190, 0.9), am = gainNode(0.5), g = ctx.createGain(), l = ctx.createOscillator(), lg = gainNode(0.5), o = ctx.createOscillator(), og = gainNode(0.15);
      l.type = 'sawtooth'; l.frequency.setValueAtTime(10.5, t); l.frequency.linearRampToValueAtTime(11.5, t + dur); l.connect(lg); lg.connect(am.gain);
      o.type = 'sine'; o.frequency.setValueAtTime(930, t); doppler(o, t, dur, 90); o.connect(og); og.connect(g);
      bell(g, t, dur, level, 0.1); s.connect(bp); bp.connect(am); am.connect(g); g.connect(dest);
      s.start(t, R() * 1.5); s.stop(t + dur + 0.1); l.start(t); l.stop(t + dur + 0.1); o.start(t); o.stop(t + dur + 0.1);
    }
    function truck(t, dur, level, dest) {
      const ctx = st.ctx, o = ctx.createOscillator(), lp = filt('lowpass', 340, 0.7), am = gainNode(0.55), g = ctx.createGain(), l = ctx.createOscillator(), lg = gainNode(0.45);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(rr(40, 52), t); l.type = 'square'; l.frequency.value = rr(12, 16); l.connect(lg); lg.connect(am.gain);
      bell(g, t, dur, level, 0.2); o.connect(lp); lp.connect(am); am.connect(g); g.connect(dest);
      o.start(t); l.start(t); o.stop(t + dur + 0.1); l.stop(t + dur + 0.1);
      burst(t + dur * 0.9, 0.35, level * 0.3, 'highpass', 3600, 0.7, dest);
    }
    /* tret llunyà amb eco: espetec sord + cos greu */
    function shotAt(t, dest, k) {
      burst(t, 0.014, 0.1 * k, 'bandpass', 1500, 0.9, dest); burst(t, 0.3, 0.16 * k, 'lowpass', 650, 0.8, dest);
    }
    /* megafonia o altaveu d'estació/aeroport: carilló + veu inintel·ligible */
    function pa(t, level, dest) {
      tone('sine', 659, t, 0.4, level * 0.7, dest); tone('sine', 523, t + 0.42, 0.55, level * 0.7, dest);
      talk(t + 1.3, pick([112, 128, 205]), level, 0.98, dest, 2800, 6 + Math.floor(R() * 6), 1.1);
    }

    function startAmb(kind) {
      const ctx = ensure(); if (!ctx) return;
      const trim = TRIM[kind] || 1, out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, ctx.currentTime); out.gain.exponentialRampToValueAtTime(trim, ctx.currentTime + 2.5); out.connect(st.master);
      const nodes = [];
      st.amb = { out: out, nodes: nodes }; st.ambKind = kind; st.ambT0 = now();
      let space = null;                      /* eco compartit de l'escena: sensació de lluny / espai obert */
      const sp = (d, fb) => { if (!space) space = echo(d || 0.29, fb || 0.3, out); return space; };
      /* llit tonal estret (no soroll ample): oscil·ladors amb tremolor lent */
      const tonal = (type, f, lp, level, trem) => { const o = ctx.createOscillator(), l = filt('lowpass', lp, 0.7), g = gainNode(level); o.type = type; o.frequency.setValueAtTime(f, ctx.currentTime); o.connect(l); l.connect(g); g.connect(out); o.start(); nodes.push(o); if (trem) nodes.push(lfoTo(g.gain, trem, level * 0.35)); return o; };
      /* grup de veus que parlen a estones, de lluny */
      const crowd = (n, level, gapMin, gapMax, lp, fear) => {
        for (let i = 0; i < n; i++) {
          const cls = pick(fear ? ['f', 'f', 'm', 'c'] : ['m', 'm', 'f', 'f', 'c']), f0 = (cls === 'm' ? rr(100, 145) : cls === 'f' ? rr(190, 250) : rr(290, 350)) * (fear ? 1.12 : 1), sc = cls === 'm' ? 1 : cls === 'f' ? 1.17 : 1.3, lv = level * rr(0.7, 1.15);
          every(gapMin, gapMax, (t) => { talk(t, f0, lv * rr(0.5, 1.1), sc, out, lp); ev('voice', t); });
        }
      };
      const sirenFar = (min, max, kinds, level, f, first) => every(min, max, (t) => { const d = rr(9, 15); sirenPass(t, { kind: pick(kinds), f: f * rr(0.92, 1.1), dur: d, level: level, dest: sp() }); ev('siren', t); }, first);
      switch (kind) {
        case 'road':
          tonal('sawtooth', 47, 210, 0.016, 0.28);
          every(4500, 10000, (t) => { carPass(t, rr(0.022, 0.04), out); ev('car', t); }, 1200);
          every(28000, 70000, (t) => { horn(t, 0.012, sp()); ev('horn', t); });
          sirenFar(60000, 130000, ['hilo', 'wail'], 0.03, 620);
          crowd(3, 0.012, 3500, 9000, 2300, false);
          every(40000, 90000, (t) => { talk(t, rr(110, 140), 0.03, 1, sp(0.2, 0.25), 2800, 6, 1.3); ev('call', t); });
          break;
        case 'industrial':
          tonal('sawtooth', 100, 800, 0.012, 0.2); tonal('sine', 100, 300, 0.012);
          every(24000, 48000, (t) => { klaxon(t, 0.03, sp(0.33, 0.38)); ev('alarm', t); }, 5000);
          every(3000, 8000, (t) => { drip(t, 0.018, sp()); ev('drip', t); }, 1000);
          every(10000, 24000, (t) => { sparks(t, 0.016, out); ev('spark', t); }, 3000);
          every(7000, 18000, (t) => { creak(t, 0.014, sp(), rr(70, 120)); ev('creak', t); }, 2500);
          every(26000, 55000, (t) => { clang(t, 0.018, sp(0.33, 0.35)); ev('clang', t); });
          break;
        case 'fire':
          { const s = src(true, true), lp = filt('lowpass', 210, 0.7), g = gainNode(0.07); s.connect(lp); lp.connect(g); g.connect(out); s.start(ctx.currentTime, R() * 1.5); nodes.push(s, lfoTo(g.gain, 0.23, 0.025), lfoTo(g.gain, 0.61, 0.015)); }
          every(500, 500, (t) => crackleBatch(t, 0.5, 9, 0.11, out), 100);
          every(3000, 7000, (t) => { const s = src(false, false), bp = filt('bandpass', rr(280, 520), 1.1), g = newGain(), d = rr(1.4, 3); env(g, t, d * 0.4, 0.028, d * 0.1, d * 0.5); s.connect(bp); bp.connect(g); g.connect(out); s.start(t, R() * 1.5); s.stop(t + d + 0.1); ev('flame', t); }, 1500);
          every(6000, 14000, (t) => { pop(t, 0.12, out); ev('pop', t); });
          every(14000, 30000, (t) => { creak(t, 0.03, out, rr(60, 110), rr(0.6, 1.3)); pop(t + 0.9, 0.16, out); ev('wood', t); });
          break;
        case 'crowd':
          crowd(8, 0.028, 1300, 4200, 2500, false);
          every(35000, 80000, (t) => { wail(t, rr(330, 440), 0.022, 1.25, sp(0.27, 0.3)); ev('cry', t); }, 15000);
          every(40000, 90000, (t) => { scream(t, rr(420, 620), 0.013, 1.17, sp(0.3, 0.33)); ev('scream', t); }, 25000);
          every(45000, 90000, (t) => { pa(t, 0.022, sp(0.3, 0.35)); ev('pa', t); }, 12000);
          sirenFar(70000, 150000, ['hilo'], 0.019, 600, 30000);
          break;
        case 'rail':
          every(22000, 45000, (t) => { const d = rr(10, 15); trainPass(t, d, 0.032, out); ev('train', t); }, 3000);
          every(45000, 100000, (t) => { if (R() < 0.6) trainHorn(t, 0.022, sp(0.35, 0.3)); else whistle(t, 0.009, sp(0.35, 0.3)); ev('whistle', t); }, 20000);
          every(30000, 65000, (t) => { pa(t, 0.03, sp(0.32, 0.38)); ev('pa', t); }, 9000);
          every(4000, 10000, (t) => { drip(t, 0.016, sp()); ev('drip', t); }, 1500);
          crowd(3, 0.014, 5000, 11000, 2300, false);
          break;
        case 'quake':
          every(13000, 30000, (t) => { const d = rr(2.5, 4.5); rumble(t, d, rr(0.11, 0.17), out); ev('rumble', t); debris(t + d * 0.4, 8 + Math.floor(R() * 10), 0.03, sp(0.26, 0.28)); ev('debris', t); if (R() < 0.5) { creak(t + d * 0.6, 0.02, sp(), rr(60, 110), 1.2); ev('creak', t); } }, 2500);
          every(30000, 70000, (t) => { alarmCar(t, 0.022, sp(0.3, 0.35)); ev('caralarm', t); }, 9000);
          every(18000, 45000, (t) => { bark(t, rr(280, 420), 0.045, sp(0.32, 0.3)); ev('dog', t); }, 7000);
          crowd(2, 0.016, 6000, 14000, 2300, true);
          sirenFar(70000, 140000, ['wail', 'hilo'], 0.028, 600, 40000);
          break;
        case 'shooting': {
          crowd(5, 0.016, 2500, 7000, 2200, true);
          every(12000, 30000, (t) => { if (!st.threat) return; scream(t, rr(430, 640), 0.022, 1.15, sp(0.28, 0.3)); ev('scream', t); }, 9000);
          every(60000, 120000, (t) => { wail(t, rr(340, 450), 0.02, 1.25, sp(0.27, 0.3)); ev('cry', t); }, 35000);
          sirenFar(25000, 55000, ['yelp', 'wail', 'hilo'], 0.032, 640, 12000);
          /* trets: rars, en ràfegues d'1 a 3, cada cop més espaiats (×1 al principi, ×3 als 4 min) i només si la zona calenta no és neta */
          const fire = () => { if (!st.threat || !live()) return; const t = now() + 0.05, k = 1 + Math.floor(R() * 3); for (let i = 0; i < k; i++) { const ts = t + i * rr(0.3, 0.7); shotAt(ts, sp(0.33, 0.32), 1); ev('shot', ts); } };
          const next = () => after(rr(25000, 60000) * (1 + Math.max(0, now() - st.ambT0) / 120), () => { if (!st.amb) return; fire(); next(); });
          after(rr(15000, 30000), () => { if (!st.amb) return; fire(); next(); });
          break;
        }
        case 'airport':
          sirenFar(25000, 55000, ['hilo', 'wail'], 0.04, 480, 5000);
          every(45000, 90000, (t) => { heli(t, rr(14, 22), 0.05, out); ev('heli', t); }, 12000);
          every(20000, 45000, (t) => { truck(t, rr(8, 18), 0.05, out); ev('truck', t); }, 6000);
          every(30000, 70000, (t) => { pa(t, 0.03, sp(0.34, 0.4)); ev('pa', t); }, 15000);
          every(500, 500, (t) => crackleBatch(t, 0.5, 3, 0.012, out), 100);
          every(14000, 30000, (t) => { pop(t, 0.025, out); ev('pop', t); });
          break;
        default:
          tonal('sine', 220, 600, 0.014, 0.11); tonal('sine', 329.6, 700, 0.009, 0.17);
      }
    }
    function stopAmb() {
      st.timers.forEach((id) => { try { (win.clearTimeout || clearTimeout)(id); } catch (e) { /* res */ } }); st.timers = [];
      const a = st.amb; st.amb = null; st.ambKind = null;
      if (!a || !st.ctx) return;
      try { const t = st.ctx.currentTime; a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(Math.max(0.0001, a.out.gain.value || 0.5), t); a.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); } catch (e) { /* res */ }
      after(700, function () { a.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* res */ } }); try { a.out.disconnect(); } catch (e) { /* res */ } }, true);
    }

    const api = {
      MODES: MODES, MAX_GAIN: MAX_GAIN,
      get available() { return !!AC; },
      get mode() { return st.mode; }, get volume() { return st.volume; }, get ambKind() { return st.ambKind; }, get threat() { return st.threat; }, get pending() { return st.timers.length; }, get tails() { return st.keep.length; },
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
  const M = { create: create, MAX_GAIN: MAX_GAIN, MODES: MODES, AMB_TRIM: TRIM };
  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.TriageSound = M;
})(typeof window !== 'undefined' ? window : this);
