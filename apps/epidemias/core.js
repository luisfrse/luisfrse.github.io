/* ============================================================
   Núcleo común del simulador de epidemias (sin dependencias).
   - Carga y normaliza los datos (patógenos, vacunas, medidas).
   - Efecto combinado de las medidas de control según la vía de transmisión,
     con rendimientos decrecientes (no es una multiplicación ingenua).
   - Parámetros de vacunación (fuga, decaimiento, protección frente a muerte).
   Se usa en el navegador (window.EpiCore) o en Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  const RHO = 0.75;          // cada medida adicional sobre la misma vía cuenta ρ veces la anterior (ordenadas de mayor a menor efecto)
  const CAP = 0.97;          // ninguna medida suelta supera este efecto
  const LEAK = 0.05;         // contagio residual de un caso aislado
  const ISO_DELAY = 1;       // días entre aparición de síntomas y aislamiento
  const TEST_DELAY = 3;      // días medios hasta detectar un caso en un cribado
  const TEST_REACH = 0.6;    // sensibilidad × cobertura máximas del cribado
  const QUAR_BASE = 0.25;    // fracción de contactos que se localizan sin rastreo organizado
  const QUAR_FULL = 0.6;     // ... y con rastreo al 100 %
  const QUAR_DELAY = 2;      // días tras el inicio de la infecciosidad hasta la cuarentena
  const ROUTES = ['air', 'drop', 'contact', 'fecal', 'fluid'];
  const DEF_RF = { air: 1, drop: 1, contact: 1, fecal: 0.6, fluid: 0.6 };

  const core = { RHO, CAP, LEAK, ISO_DELAY, TEST_DELAY, TEST_REACH, QUAR_BASE, QUAR_FULL, QUAR_DELAY, ROUTES };
  core.data = { pat: [], pathogens: {}, vac: [], vaccines: {}, med: [], measures: {}, geo: {}, credits: null, pops: null };

  /* Combina efectos independientes con rendimientos decrecientes: A = Σ ρ^k · (−ln(1−r_k)), total = 1 − e^(−A) */
  function combine(list) {
    const a = [];
    for (const r of list) if (r > 0) a.push(-Math.log(1 - Math.min(r, CAP)));
    a.sort((x, y) => y - x);
    let A = 0, w = 1;
    for (const x of a) { A += w * x; w *= RHO; }
    return 1 - Math.exp(-A);
  }

  function setData(pat, vac, med) {
    core.data.pat = pat.pathogens; core.data.vac = vac.vaccines; core.data.med = med.measures;
    core.data.cats = med.cats;
    for (const p of pat.pathogens) core.data.pathogens[p.id] = p;
    for (const v of vac.vaccines) core.data.vaccines[v.id] = v;
    for (const m of med.measures) core.data.measures[m.id] = m;
  }

  /* ---------- patógeno → parámetros base y compactos ---------- */
  function scenOf(p) {
    return { id: p.id, R0: p.R0.v, range: p.R0.r, latent: p.latent.v, infect: p.infect.v, cfr: p.cfr.v, src: p.sources.join(' · ') };
  }
  /* campos del patógeno que necesita el motor (se guardan en P.path) */
  function pathOf(p) {
    if (!p) return { routes: { air: 0.6, drop: 0.3, contact: 0.1, fecal: 0, fluid: 0 }, ctx: { home: 1 }, pre: 0.3, asym: 0.2, relAsym: 0.5, wane: 0, hosp: 0.02, season: null, av: null };
    return { routes: p.routes, ctx: p.ctx, pre: p.pre, asym: p.asym, relAsym: p.relAsym, wane: p.wane || 0, hosp: p.hosp, season: p.season || null, av: p.antiviral || null };
  }
  function vaccinesFor(pid) {
    return core.data.vac.filter(v => v.ve[pid] || v.ve['*']);
  }
  function measuresFor() { return core.data.med; }

  /* ---------- efecto de las medidas en el instante t ---------- */
  function ctxRed(def, ctx) { let s = 0, tot = 0; for (const k in ctx) tot += ctx[k]; if (!(tot > 0)) return 0; for (const k in def.ctx) s += (ctx[k] || 0) / tot * def.ctx[k]; return s; }

  function active(P, t) {
    const out = [];
    for (const m of (P.sel || [])) {
      const def = core.data.measures[m.id]; if (!def) continue;
      const st = +m.start || 0, du = +m.dur || 0;
      if (t >= st && (du <= 0 || t < st + du)) out.push({ def, adh: Math.max(0, Math.min(1, (+m.adh) / 100)), m });
    }
    return out;
  }

  /* devuelve { Mroute, C, mult, mv, travel, sev, kinds:{iso,trace,quar,test,av}, per:{id→reducción} } */
  function controlAt(P, t, only) {
    const path = P.path || pathOf(null);
    let act = active(P, t);
    if (only) act = act.filter(a => only(a.def));
    const w = path.routes;
    const lists = { air: [], drop: [], contact: [], fecal: [], fluid: [] };
    const mv = [], tr = [], caseR = [];
    const kinds = { iso: 0, trace: 0, quar: 0, test: 0, av: 0 };
    const D = Math.max(0.1, +P.infect || 1), L = +P.latent || 0, pre = path.pre, asym = path.asym, rel = path.relAsym;
    const symW = (1 - asym) / (asym * rel + 1 - asym);
    for (const { def, adh } of act) {
      if (def.move) mv.push(def.move * adh);
      if (def.travel) tr.push(def.travel * adh);
      if (def.case) {
        if (def.case === 'isolation') { kinds.iso = adh; caseR.push(adh * symW * Math.max(0, 1 - (pre * D + ISO_DELAY) / D) * (1 - LEAK)); }
        else if (def.case === 'trace') kinds.trace = adh;
        else if (def.case === 'quarantine') kinds.quar = adh;
        else if (def.case === 'test') { kinds.test = adh; caseR.push(adh * TEST_REACH * Math.max(0, 1 - TEST_DELAY / D) * (1 - LEAK)); }
        else if (def.case === 'antiviral' && path.av) { kinds.av = adh; caseR.push(adh * path.av.trans * symW); }
        continue;
      }
      const rf = def.rf || DEF_RF;
      const cr = def.ctx ? ctxRed(def, path.ctx) : 0;
      for (const r of ROUTES) {
        const v = def.e ? (def.e[r] || 0) : cr * (rf[r] ?? 1);
        if (v > 0) lists[r].push(v * adh);
      }
    }
    if (kinds.quar > 0) caseR.push(kinds.quar * (QUAR_BASE + (QUAR_FULL - QUAR_BASE) * kinds.trace) * Math.max(0, 1 - (pre * D + QUAR_DELAY) / D) * (1 - LEAK));
    let Mroute = 0; for (const r of ROUTES) Mroute += (w[r] || 0) * (1 - combine(lists[r]));
    const C = combine(caseR);
    const sev = kinds.av > 0 ? 1 - kinds.av * path.av.sev : 1;
    return { Mroute, C, mult: Mroute * (1 - C), mv: combine(mv), travel: combine(tr), sev, kinds, nAct: act.length };
  }

  /* efecto de cada medida elegida sobre R (en el instante en que empieza): solo ella y marginal respecto al conjunto */
  function measureEffects(P) {
    const res = {};
    for (const m of (P.sel || [])) {
      const t = Math.max(0, +m.start || 0) + 0.01;
      const all = controlAt(P, t), without = controlAt(Object.assign({}, P, { sel: P.sel.filter(x => x !== m) }), t);
      const alone = controlAt(Object.assign({}, P, { sel: [m] }), t);
      res[m.id] = { alone: 1 - alone.mult, marginal: 1 - all.mult / (without.mult || 1), tAt: t };
    }
    return res;
  }

  /* ---------- vacunas ---------- */
  /* [{id, share, inf, dis, sev, half, sevCond}] para el patógeno P.pid (solo las compatibles) */
  function vaxList(P) {
    const out = [];
    for (const id of (P.vsel || [])) {
      const v = core.data.vaccines[id]; if (!v) continue;
      let e = v.ve[P.pid] || v.ve['*']; if (!e) continue;
      let o = Object.assign({ id }, e);
      if (v.adjustable) { const x = (+P.hypEff || 60) / 100; o.inf = x; o.dis = x; o.sev = 1 - (1 - x) * 0.5; }
      o.sevCond = o.inf < 1 ? Math.max(0, Math.min(1, 1 - (1 - o.sev) / (1 - o.inf))) : 1;
      out.push(o);
    }
    const n = out.length; out.forEach(o => { o.share = 1 / n; });
    return out;
  }
  const veAt = (o, age) => o.inf * (o.half > 0 ? Math.pow(0.5, Math.max(0, age) / o.half) : 1);
  /* protección media inmediatamente después de completar la pauta */
  function veMean(P) { const l = vaxList(P); return l.length ? l.reduce((s, o) => s + o.share * o.inf, 0) : 0; }

  /* ---------- magnitudes derivadas / teoría ---------- */
  function derive(P, t) {
    t = t || 0;
    const ctl = controlAt(P, t);
    const Dd = Math.max(0.1, +P.infect), L = Math.max(0, +P.latent);
    const prior = (P.prior || 0) / 100, vac = (P.vacc || 0) / 100, ve = veMean(P);
    const R0eff = P.R0 * ctl.mult;
    const s0 = Math.max(0, 1 - prior - vac * ve * (1 - prior));
    const prot = 1 - s0;
    return {
      D: Dd, L, ctl, R0eff, prot, s0, ve, cfr: P.cfr / 100,
      hit: P.R0 > 1 ? 1 - 1 / P.R0 : 0,
      hitEff: R0eff > 1 ? 1 - 1 / R0eff : 0,
      cover: ve > 0 ? (P.R0 > 1 ? (1 - 1 / P.R0 - prior) / (ve * (1 - prior)) : 0) : Infinity,
      coverEff: ve > 0 ? (R0eff > 1 ? (1 - 1 / R0eff - prior) / (ve * (1 - prior)) : 0) : Infinity
    };
  }
  function finalSize(R0eff, s0) {
    if (R0eff * s0 <= 1) return 0;
    let z = s0;
    for (let i = 0; i < 500; i++) z = s0 * (1 - Math.exp(-R0eff * z));
    return z;
  }
  const season = (P, t) => { const s = P.path && P.path.season; return s ? 1 + s.amp * Math.cos(2 * Math.PI * ((+P.doy || 288) + t - s.peak) / 365) : 1; };

  /* ---------- modelo determinista SEIR(S) con vacunación, medidas, estacionalidad e importación ---------- */
  const ERL = 3;
  function seir(P, N, horizon, opts) {
    opts = opts || {};
    horizon = horizon || 365;
    const Q = opts.noControl ? Object.assign({}, P, { sel: [], vsel: [], vacc: 0 }) : P;
    const Dd = Math.max(0.1, +Q.infect), L = Math.max(0, +Q.latent);
    const gam = ERL / Dd, sig = L > 0 ? ERL / L : 0, wane = Q.path && Q.path.wane > 0 ? 1 / Q.path.wane : 0;
    const cfr0 = Q.cfr / 100, prior = (Q.prior || 0) / 100, seeds = Math.min(Q.seeds, N) / N;
    const vl = vaxList(Q), vac = (Q.vacc || 0) / 100 * (1 - prior), vstart = +Q.vstart || 0, vperday = (+Q.vrate || 0) / 100 / 7;
    const instant = !(vperday > 0);
    const tvm = vl.length ? (instant ? vstart : vstart + vac / vperday / 2) : 0;
    const impDay = (Q.imp || 0) / 7 / 1e4;
    const beta0 = Q.R0 / Dd;
    // multiplicador de control precalculado cada 0,5 días
    const nC = Math.ceil(horizon / 0.5) + 2, ctlA = new Float64Array(nC), trA = new Float64Array(nC), svA = new Float64Array(nC);
    for (let i = 0; i < nC; i++) { const c = controlAt(Q, i * 0.5); ctlA[i] = c.mult; trA[i] = 1 - c.travel; svA[i] = c.sev; }
    const y = new Float64Array(13);
    y[0] = Math.max(0, 1 - prior - seeds); y[8] = prior; y[5] = seeds; y[10] = seeds;
    let vDone = false;
    const f = (yy, out, t) => {
      const k = Math.min(nC - 1, (t / 0.5) | 0);
      let sigma = 1, sc = 0;
      if (vl.length) { sigma = 0; for (const o of vl) { sigma += o.share * (1 - veAt(o, t - tvm)); sc += o.share * o.sevCond; } }
      const lam = beta0 * ctlA[k] * season(Q, t) * (yy[5] + yy[6] + yy[7]);
      const infU = lam * yy[0], infV = lam * sigma * yy[1], inf = infU + infV;
      const imp = impDay * trA[k] * (yy[0] > 0 ? yy[0] : 0);
      let vf = 0;
      if (vl.length && !instant && t >= vstart && yy[12] < vac) vf = Math.min(vperday, yy[0]);
      out[0] = -infU - imp - vf + wane * yy[8];
      out[1] = -infV + vf;
      const into = inf + imp;
      if (L > 0) { out[2] = into - sig * yy[2]; out[3] = sig * (yy[2] - yy[3]); out[4] = sig * (yy[3] - yy[4]); out[5] = sig * yy[4] - gam * yy[5]; }
      else { out[2] = out[3] = out[4] = 0; out[5] = into - gam * yy[5]; }
      out[6] = gam * (yy[5] - yy[6]); out[7] = gam * (yy[6] - yy[7]);
      const mix = (yy[10] > 1e-12) ? (yy[10] - yy[11] + (1 - sc) * yy[11]) / yy[10] : 1;
      const dth = gam * yy[7] * Math.min(1, cfr0 * svA[k] * mix);
      out[9] = dth; out[8] = gam * yy[7] - dth - wane * yy[8];
      out[10] = inf + imp; out[11] = infV; out[12] = vf;
    };
    const h = 0.1, K = [0, 1, 2, 3].map(() => new Float64Array(13)), tmp = new Float64Array(13);
    const out = { t: [], S: [], E: [], I: [], R: [], V: [], D: [], cum: [], Re: [], peak: 0, peakDay: 0, final: 0 };
    const rec = (t) => {
      out.t.push(t); out.S.push(y[0]); out.V.push(y[1]); out.E.push(y[2] + y[3] + y[4]); const iv = y[5] + y[6] + y[7]; out.I.push(iv);
      out.R.push(y[8]); out.D.push(y[9]); out.cum.push(y[10]);
      const kk = Math.min(nC - 1, (t / 0.5) | 0); let sg = 0; if (vl.length) for (const o of vl) sg += o.share * (1 - veAt(o, t - tvm));
      out.Re.push(Q.R0 * ctlA[kk] * season(Q, t) * (y[0] + sg * y[1]));
      if (iv > out.peak) { out.peak = iv; out.peakDay = t; }
    };
    rec(0);
    const steps = Math.round(horizon / h);
    for (let s = 1; s <= steps; s++) {
      const t = (s - 1) * h;
      if (vl.length && instant && !vDone && t >= vstart) { const mv = Math.min(y[0], vac); y[0] -= mv; y[1] += mv; y[12] += mv; vDone = true; }
      f(y, K[0], t); for (let i = 0; i < 13; i++) tmp[i] = y[i] + h / 2 * K[0][i];
      f(tmp, K[1], t + h / 2); for (let i = 0; i < 13; i++) tmp[i] = y[i] + h / 2 * K[1][i];
      f(tmp, K[2], t + h / 2); for (let i = 0; i < 13; i++) tmp[i] = y[i] + h * K[2][i];
      f(tmp, K[3], t + h); for (let i = 0; i < 13; i++) y[i] += h / 6 * (K[0][i] + 2 * K[1][i] + 2 * K[2][i] + K[3][i]);
      if (s % 5 === 0) rec(s * h);
    }
    out.final = y[10];
    return out;
  }

  Object.assign(core, { combine, setData, scenOf, pathOf, vaccinesFor, measuresFor, controlAt, measureEffects, vaxList, veAt, veMean, derive, finalSize, seir, season, ERL });

  /* carga en el navegador */
  core.load = function (base) {
    base = base || 'data/';
    const j = (f) => fetch(base + f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
    return Promise.all([j('patogenos.json'), j('vacunas.json'), j('medidas.json')]).then(([p, v, m]) => { setData(p, v, m); return core; });
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = core; else root.EpiCore = core;
})(typeof window !== 'undefined' ? window : globalThis);
