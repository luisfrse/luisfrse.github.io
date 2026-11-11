/* Detector de compresiones a partir del acelerómetro (sin DOM; se puede probar con Node).
   Entrada: muestras (t en segundos, ax, ay, az) en m/s². Salida: compresiones detectadas, frecuencia,
   regularidad, pausas (> 2 s) y fracción de compresión.
   Método: módulo del vector → quitar la gravedad con un paso alto (~0,6 Hz) → paso bajo (~4 Hz, dos etapas)
   → picos con umbral adaptativo (40 % de la amplitud reciente, con suelo absoluto) e intervalo mínimo
   adaptativo (55 % del intervalo habitual, nunca menos de 0,30 s).
   NO mide profundidad: un acelerómetro de móvil no permite integrar la posición de forma fiable. */
(function (root) {
  'use strict';

  /* Perfiles según la superficie: las superficies blandas absorben el golpe y la aceleración medida es mucho menor,
     así que necesitan umbrales más bajos (floor0 = umbral inicial, minFloor = suelo tras calibrar, k = desviaciones típicas
     del ruido, rel = fracción de la amplitud reciente, lpHz = paso bajo, fast = la referencia de amplitud decae antes si se pierde una compresión). */
  const PROFILES = {
    firm:     { floor0: 0.8,  minFloor: 0.7,  k: 4, rel: 0.40, lpHz: 4, fast: false },
    manikin:  { floor0: 0.5,  minFloor: 0.4,  k: 4, rel: 0.35, lpHz: 4, fast: true },
    soft:     { floor0: 0.25, minFloor: 0.18, k: 3, rel: 0.30, lpHz: 5, fast: true },
    verysoft: { floor0: 0.12, minFloor: 0.08, k: 3, rel: 0.25, lpHz: 5, fast: true }
  };

  function createDetector(opts) {
    const o = Object.assign({ floor: 0.8, minFloor: 0.7, hpHz: 0.6, lpHz: 4, minInt: 0.30, pauseSec: 2.0, band: [100, 120], onCompression: null, profile: 'firm', sens: 1, rel: 0.40, k: 4, fast: false }, opts);
    let noise = 0, lastH = 0;
    /* Cambia el perfil o la sensibilidad (sens > 1 = más sensible) sin reiniciar el detector. */
    function setProfile(name, sens) {
      const P = PROFILES[name] || PROFILES.firm;
      o.profile = PROFILES[name] ? name : 'firm'; o.sens = sens > 0 ? sens : 1;
      o.minFloor = P.minFloor; o.k = P.k; o.rel = P.rel; o.lpHz = P.lpHz; o.fast = P.fast;
      if (!noise) noise = P.floor0;
      o.floor = Math.max(o.minFloor, noise) / o.sens;
    }
    let lastT = null, base = 0, lp1 = 0, lp2 = 0, y1 = 0, y2 = 0, t1 = 0, init = false;
    let env = 0, lastPeak = null, firstPeak = null;
    const peaks = [], ivs = [];                         // instantes de compresión e intervalos válidos (≤ pauseSec)
    const pauses = [];                                  // { start, end, len }
    let now = 0, calib = null;

    const alpha = (dt, hz) => { const rc = 1 / (2 * Math.PI * hz); return dt / (rc + dt); };

    function accept(t, h) {
      if (lastPeak !== null) {
        const dt = t - lastPeak;
        if (dt > o.pauseSec) pauses.push({ start: lastPeak, end: t, len: dt });
        else ivs.push({ t, dt });
      } else firstPeak = t;
      lastPeak = t; peaks.push(t);
      env = env ? 0.7 * env + 0.3 * h : h; lastH = h;
      if (o.onCompression) o.onCompression(t, peaks.length);
    }

    function medianInt() {
      const r = ivs.slice(-6).map(x => x.dt).sort((a, b) => a - b);
      return r.length >= 3 ? r[r.length >> 1] : 0;
    }

    function push(t, ax, ay, az) {
      now = t;
      const m = Math.sqrt(ax * ax + ay * ay + az * az);
      if (lastT === null) { lastT = t; base = m; lp1 = lp2 = 0; return; }
      const dt = Math.min(0.2, Math.max(0.001, t - lastT)); lastT = t;
      base += alpha(dt, o.hpHz) * (m - base);
      const x = m - base, a = alpha(dt, o.lpHz);
      lp1 += a * (x - lp1); lp2 += a * (lp1 - lp2);
      const y = lp2;
      if (env && lastPeak !== null) {
        const mi0 = medianInt(), lim = o.fast && mi0 ? Math.max(1.0, 1.6 * mi0) : 2.5;
        if (t - lastPeak > lim) env *= Math.exp(-dt / (o.fast ? 0.8 : 2));
      }
      // y1 es la muestra anterior: ¿es un máximo local?
      if (init && y1 > y2 && y1 >= y) {
        const thr = Math.max(o.floor, o.rel * env);
        const mi = Math.max(o.minInt, 0.55 * medianInt());
        if (y1 > thr && (lastPeak === null || t1 - lastPeak >= mi)) accept(t1, y1);
      }
      if (calib) calib.push(y);
      y2 = y1; y1 = y; t1 = t; init = true;
    }

    const rateFrom = (arr) => { const r = arr.map(x => x.dt).sort((a, b) => a - b); return r.length ? 60 / (r.length % 2 ? r[r.length >> 1] : (r[r.length / 2 - 1] + r[r.length / 2]) / 2) : NaN; };

    function snapshot(tNow) {
      const T = tNow === undefined ? now : tNow;
      const recent = ivs.slice(-6);
      const rate = recent.length >= 3 && (lastPeak !== null && T - lastPeak < 3) ? rateFrom(recent) : NaN;
      const last10 = ivs.slice(-10).map(x => x.dt);
      let reg = NaN;
      if (last10.length >= 4) {
        const mean = last10.reduce((s, v) => s + v, 0) / last10.length, sd = Math.sqrt(last10.reduce((s, v) => s + (v - mean) ** 2, 0) / last10.length);
        reg = Math.round(Math.min(100, Math.max(0, 100 - (sd / mean) * 500)));
      }
      const since = lastPeak === null ? 0 : T - lastPeak;
      const ongoing = lastPeak !== null && since > o.pauseSec ? since : 0;
      const done = pauses.reduce((s, p) => s + p.len, 0);
      const dur = firstPeak === null ? 0 : Math.max(0, T - firstPeak);
      const pauseTotal = done + ongoing;
      const longest = Math.max(ongoing, ...pauses.map(p => p.len), 0);
      return {
        count: peaks.length, rate, regularity: reg, sinceLast: since, ongoingPause: ongoing,
        pauseCount: pauses.length + (ongoing ? 1 : 0), pauseTotal, longestPause: longest,
        duration: dur, ccf: dur > 0 ? Math.round(100 * Math.max(0, 1 - pauseTotal / dur)) : NaN
      };
    }

    /* resumen final: la parte de espera posterior a la última compresión no se cuenta */
    function summary() {
      const end = lastPeak === null ? 0 : lastPeak;
      const s = snapshot(end);
      let inBand = 0, tot = 0;
      for (let i = 0; i < ivs.length; i++) {
        const win = ivs.slice(Math.max(0, i - 2), i + 1), r = rateFrom(win);
        tot++; if (r >= o.band[0] && r <= o.band[1]) inBand++;
      }
      const all = ivs.length ? rateFrom(ivs) : NaN;
      let reg = NaN;
      if (ivs.length >= 4) {
        const d = ivs.map(x => x.dt), mean = d.reduce((a, b) => a + b, 0) / d.length, sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / d.length);
        reg = Math.round(Math.min(100, Math.max(0, 100 - (sd / mean) * 500)));
      }
      return { count: peaks.length, duration: s.duration, avgRate: all, regularity: reg, pctInBand: tot ? Math.round(100 * inBand / tot) : NaN, pauseCount: pauses.length, pauseTotal: s.pauseTotal, longestPause: s.longestPause, ccf: s.ccf, peaks: peaks.slice(), pauses: pauses.slice() };
    }

    /* calibración: con el móvil quieto se mide el ruido y se fija el umbral mínimo (4 desviaciones típicas) */
    function beginCalibration() { calib = []; }
    function endCalibration() {
      if (!calib || calib.length < 10) { calib = null; return o.floor; }
      const sd = Math.sqrt(calib.reduce((a, v) => a + v * v, 0) / calib.length);
      calib = null; noise = o.k * sd; o.floor = Math.max(o.minFloor, noise) / o.sens; return o.floor;
    }

    return { push, snapshot, summary, beginCalibration, endCalibration, get peaks() { return peaks; }, setFloor(f) { o.floor = f; }, setProfile, get floor() { return o.floor; }, get lastHeight() { return lastH; }, get profile() { return o.profile; } };
  }

  /* generador de señales sintéticas (para pruebas y modo demostración) */
  function synth(segments, fs, seed) {
    // segments: [{ dur, cpm, amp }] (cpm = 0 → pausa). Devuelve [{t, ax, ay, az}]
    let s = (seed || 1) >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    const out = []; let t = 0, phase = 0;
    segments.forEach(sg => {
      const n = Math.round(sg.dur * fs);
      for (let i = 0; i < n; i++, t += 1 / fs) {
        let a = 0;
        if (sg.cpm > 0) {
          phase += 2 * Math.PI * (sg.cpm / 60) / fs;
          a = (sg.amp || 4) * (Math.sin(phase) + 0.35 * Math.sin(2 * phase + 0.8));   // con segundo armónico (rebote)
        }
        const noise = (sg.noise === undefined ? 0.4 : sg.noise) * gauss() + 0.15 * Math.sin(2 * Math.PI * 0.2 * t);
        out.push({ t, ax: 0.6 * noise, ay: 0.3 * noise, az: 9.81 + a + noise });
      }
    });
    return out;
  }

  /* Entreno completo: ciclos de n compresiones + 2 insuflaciones (y, en pediatría, 5 insuflaciones iniciales).
     comp(t) y breath(t) devuelven el evento para avisar: 'breath' (toca insuflar), 'cycle' (ciclo cerrado), 'initDone', 'ignored'. */
  function createCycler(o) {
    o = Object.assign({ n: 30, init: 0, lateSec: 10, grace: 0.4 }, o);
    let state = o.init > 0 ? 'init' : 'comp', count = 0, breaths = 0, ib = 0, bT = 0, firstB = null, short = false, cb = 0, lastC = 0, nudged = false, win = null, civ = [];
    const cycles = [], windows = [], errs = { cycle: 0, short: 0, omit: 0, late: 0, compBreath: 0, initOmit: 0, initComp: 0 };
    let total = 0, totalBreaths = 0, initGiven = 0;
    function close(t) {
      const delay = (firstB !== null ? firstB : t) - bT, om = Math.max(0, 2 - breaths), late = delay > o.lateSec;
      const ok = !short && count === o.n && !om && !late && !cb;
      const rate = civ.length >= 3 ? Math.round(60 / (civ.reduce((a, b) => a + b, 0) / civ.length)) : null;
      cycles.push({ c: count, ok, rate, breaths, late, short, omit: om, cb, delay });
      if (short) errs.short++; if (om) errs.omit += om; if (late) errs.late++; if (cb) errs.compBreath += cb;
      count = 0; breaths = 0; firstB = null; short = false; cb = 0; civ = []; nudged = false; state = 'comp';
    }
    function comp(t) {
      if (state === 'init') { errs.initOmit += o.init - ib; errs.initComp++; state = 'comp'; }
      else if (state === 'breath') {
        if (t - bT < o.grace) return 'ignored';
        cb++; close(t);
      }
      if (win) { win.e = t; windows.push(win); win = null; }
      if (lastC && count > 0 && t - lastC < 2) civ.push(t - lastC);
      lastC = t; count++; total++;
      if (o.n && count === o.n) { state = 'breath'; bT = t; breaths = 0; win = { s: t }; return 'breath'; }
      return '';
    }
    function breath(t) {
      if (state === 'init') { ib++; initGiven++; totalBreaths++; if (ib >= o.init) { state = 'comp'; return 'initDone'; } return 'init'; }
      if (state === 'comp') {
        if (!count) return 'ignored';
        short = count < o.n; state = 'breath'; bT = lastC; breaths = 0; win = { s: lastC };
      }
      breaths++; totalBreaths++; if (firstB === null) firstB = t;
      if (breaths >= 2) { close(t); return 'cycle'; }
      return 'first';
    }
    function tick(t) { if (state === 'breath' && !breaths && !nudged && t - bT > o.lateSec) { nudged = true; return 'nudge'; } return ''; }
    function finish(t) {
      if (state === 'breath' && breaths < 2 && t - bT > o.lateSec) close(t);
      if (win) { win.e = t; windows.push(win); win = null; }
      if (state === 'init' && ib > 0 && ib < o.init) errs.initOmit += o.init - ib;
    }
    return { comp, breath, tick, finish, get state() { return state; }, get count() { return count; }, get breaths() { return breaths; }, get ib() { return ib; }, get n() { return o.n; }, get init() { return o.init; },
      result() { return { cycles: cycles.slice(), windows: windows.slice(), errs: Object.assign({}, errs), total, breaths: totalBreaths, initGiven, init: o.init, n: o.n }; } };
  }

  /* Evaluación didáctica 0–100 (ritmo, pausas y, en entreno completo, ciclos). cy = createCycler().result() o null. */
  function evaluate(m, cy) {
    const errs = {}; let pen = 0;
    const add = (k, p, times) => { errs[k] = (errs[k] || 0) + (times || 1); pen += p; };
    if (!m.count) return { score: 0, errs: { none: 1 }, verdict: 'low', pen: 100, pauseCount: 0, longest: 0, pauseTotal: 0, cycles: cy ? cy.cycles : [] };
    // pausas efectivas: se descuenta el tiempo dedicado a las insuflaciones
    const eff = (m.pauses || []).map(p => {
      let ov = 0; if (cy) cy.windows.forEach(w => { ov += Math.max(0, Math.min(p.end, w.e) - Math.max(p.start, w.s)); });
      return Math.max(0, p.len - ov);
    }).filter(x => x > 2);
    const pauseTotal = eff.reduce((a, b) => a + b, 0), longest = Math.max(0, ...eff);
    if (m.count < 20) add('few', 5);
    if (m.avgRate < 100) add('slow', Math.min(25, Math.round(100 - m.avgRate))); else if (m.avgRate > 120) add('fast', Math.min(25, Math.round(m.avgRate - 120)));
    if (m.pctInBand < 80) add('band', Math.min(24, Math.round((80 - m.pctInBand) * 0.3)));
    if (m.regularity < 70) add('irreg', Math.min(15, Math.round((70 - m.regularity) * 0.4)));
    const p10 = eff.filter(x => x > 10).length, p2 = eff.length - p10;
    if (p2) add('pause', Math.min(15, 3 * p2), p2);
    if (p10) add('pause10', Math.min(20, 10 * p10), p10);
    if (m.ccf < 60) add('ccf', Math.min(15, Math.round((60 - m.ccf) * 0.5)));
    if (cy) {
      const e = cy.errs;
      if (e.short) add('short', Math.min(12, 3 * e.short), e.short);
      if (e.compBreath) add('compBreath', Math.min(12, 2 * e.compBreath), e.compBreath);
      if (e.omit) add('omit', Math.min(16, 3 * e.omit), e.omit);
      if (e.late) add('late', Math.min(12, 3 * e.late), e.late);
      if (e.initOmit) add('initOmit', Math.min(10, 2 * e.initOmit), e.initOmit);
      const bad = cy.cycles.filter(c => !c.ok).length; if (bad) { errs.cycle = bad; pen += Math.min(30, 6 * bad); }
    }
    const score = Math.max(0, Math.round(100 - pen));
    return { score, verdict: score >= 90 ? 'good' : score >= 70 ? 'ok' : 'low', errs, pen, pauseCount: eff.length, longest, pauseTotal, cycles: cy ? cy.cycles : [] };
  }

  const api = { createDetector, createCycler, evaluate, synth, PROFILES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RCPSensor = api;
})(typeof window !== 'undefined' ? window : globalThis);
