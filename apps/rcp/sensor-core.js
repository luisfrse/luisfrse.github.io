/* Detector de compresiones a partir del acelerómetro (sin DOM; se puede probar con Node).
   Entrada: muestras (t en segundos, ax, ay, az) en m/s². Salida: compresiones detectadas, frecuencia,
   regularidad, pausas (> 2 s) y fracción de compresión.
   Método: módulo del vector → quitar la gravedad con un paso alto (~0,6 Hz) → paso bajo (~4 Hz, dos etapas)
   → picos con umbral adaptativo (40 % de la amplitud reciente, con suelo absoluto) e intervalo mínimo
   adaptativo (55 % del intervalo habitual, nunca menos de 0,30 s).
   NO mide profundidad: un acelerómetro de móvil no permite integrar la posición de forma fiable. */
(function (root) {
  'use strict';

  function createDetector(opts) {
    const o = Object.assign({ floor: 0.8, minFloor: 0.7, hpHz: 0.6, lpHz: 4, minInt: 0.30, pauseSec: 2.0, band: [100, 120], onCompression: null }, opts);
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
      env = env ? 0.7 * env + 0.3 * h : h;
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
      if (env && lastPeak !== null && t - lastPeak > 2.5) env *= Math.exp(-dt / 2);
      // y1 es la muestra anterior: ¿es un máximo local?
      if (init && y1 > y2 && y1 >= y) {
        const thr = Math.max(o.floor, 0.4 * env);
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
      calib = null; o.floor = Math.max(o.minFloor, 4 * sd); return o.floor;
    }

    return { push, snapshot, summary, beginCalibration, endCalibration, get peaks() { return peaks; }, setFloor(f) { o.floor = f; }, get floor() { return o.floor; } };
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

  const api = { createDetector, synth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RCPSensor = api;
})(typeof window !== 'undefined' ? window : globalThis);
