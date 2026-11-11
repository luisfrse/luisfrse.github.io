/* ============================================================
   Simulador de epidemias · interfaz
   Usa core.js (datos y teoría), sim.js (agentes), meta.js (metapoblaciones),
   mapa.js (mapa de puntos), panels.js (paneles) y ../shared/app.js (AppKit).
   ============================================================ */
(() => {
  'use strict';
  const K = AppKit, Core = window.EpiCore, { Sim, finalSize, seir } = window.EpiSim, { Meta } = window.EpiMeta, Map_ = window.EpiMap;
  const $ = (s, r = document) => r.querySelector(s);
  const store = K.storage('epidemias');
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = K.i18n(window.EPI_TXT);
  K.mount({ titleKey: 'title' });

  const COL = { S: '#7fb2ea', E: '#f5b82e', I: '#ff5d73', R: '#4ade80', V: '#b08be0', D: '#7d8ca2' };
  const STATES = ['S', 'E', 'I', 'R', 'V', 'D'];
  const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 4, 8, 16];
  const DPS = 6;                                   // días simulados por segundo a velocidad ×1
  const PLACES = ['abstract', 'mataro', 'barcelona', 'catalunya', 'espana', 'europa', 'mundo'];
  const PLACE_DEF = {                              // valores por defecto de cada lugar
    abstract: { N: 600 },
    mataro: { N: 3000, seeds: 10 },
    barcelona: { mob: 0.15, air: 0, gamma: 2, d0: 4, mseeds: 20, origin: 'bcn-02' },
    catalunya: { mob: 0.1, air: 0, gamma: 1.8, d0: 40, mseeds: 20, origin: 'cat-13' },
    espana: { mob: 0.05, air: 0, gamma: 1.8, d0: 150, mseeds: 20, origin: 'ES-M' },
    europa: { mob: 0.03, air: 0.01, gamma: 1.8, d0: 500, mseeds: 50, origin: 'ESP' },
    mundo: { mob: 0.01, air: 0.01, gamma: 1.8, d0: 2500, mseeds: 100, origin: 'CHN' }
  };
  const BASE_KEYS = ['R0', 'latent', 'infect', 'cfr'];
  const RESET_KEYS = ['N', 'seeds', 'seed', 'prior', 'kdisp', 'mseeds', 'gamma'];
  const FIRST_DOY = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
  const STAY = 8;                                  // días medios de hospitalización
  const CHALS = {
    measles: { pid: 'measles', goal: 3 },
    flat: { pid: 'flu1918' },
    cap: { pid: 'covid_wt', cap: 5 },
    eff: { pid: 'flu1918', goal: 10, vsel: ['hyp'], hypEff: 60 },
    ebola: { pid: 'ebola', goal: 10 }
  };
  const CHAL_ORDER = ['measles', 'flat', 'cap', 'eff', 'ebola'];

  let P = null, scenId = 'measles', speedIdx = K.clamp(store.get('speed', 3), 0, SPEEDS.length - 1);
  let showRadius = !!store.get('radius', false), showSEIR = store.get('seir', true) !== false, showCF = store.get('cf', true) !== false;
  let done = store.get('done', {});
  let sim = null, ode = null, cf = null, dBase = null, view = null, domain = null;
  const geoCache = {};
  let ref = null, cursor = null, challenge = null, chalResult = null, capLine = null, bands = null, hoverT = -1, selT = -1;
  let playing = false, raf = 0, lastTs = 0, acc = 0, resumeOnVisible = false, lastStamp = '', bandsBusy = false;
  const els = {};

  /* ================= estado y utilidades ================= */
  const pat = (id) => Core.data.pathogens[id || P.pid];
  const mode = () => (P.place === 'abstract' || P.place === 'mataro' ? 'agents' : 'meta');
  const isMap = () => mode() === 'meta';
  const geo = () => geoCache[P.place] || null;
  const geoPop = (g) => g.features.reduce((a, f) => a + f.pop, 0);
  const popReal = () => (P.place === 'abstract' ? P.N : geo() ? geoPop(geo()) : P.N);
  const pct = (x, d = 1) => K.fmt(x * 100, d);
  function fmtN(n) {
    if (!Number.isFinite(n)) return '—';
    const a = Math.abs(n);
    if (a >= 1e9) return K.fmt(n / 1e9, 2) + ' ' + t('u_bn');
    if (a >= 1e6) return K.fmt(n / 1e6, 2) + ' M';
    if (a >= 1e4) return K.fmt(Math.round(n), 0);
    return K.fmt(Math.round(n), 0);
  }
  const L = (o) => (o && (o[K.lang] || o.es)) || '';

  function baseP() {
    return { pid: 'measles', N: 600, seeds: 3, seed: 1, days: 365, prior: 0, sel: [], vsel: [], vacc: 0, vrate: 0, vstart: 0, hypEff: 60, imp: 0, doy: 305,
      kdisp: 0, place: 'abstract', origin: 'ESP', mob: 0.1, air: 0, gamma: 1.8, d0: 60, mseeds: 20, beds: 0.5, varOn: false, varDay: 120, varEsc: 40, varR0: 1.3 };
  }
  function applyPathogen(id, keep) {
    const p = Core.data.pathogens[id]; if (!p) return;
    P.pid = id; P.R0 = p.R0.v; P.latent = p.latent.v; P.infect = p.infect.v; P.cfr = p.cfr.v; P.prior = p.prior || 0; P.path = Core.pathOf(p);
    if (!keep) { P.sel = []; P.vsel = []; P.vacc = 0; }
    fixCompat();
  }
  function fixCompat() {
    const ok = new Set(Core.vaccinesFor(P.pid).map(v => v.id));
    P.vsel = (P.vsel || []).filter(id => ok.has(id));
    if (!P.path.av) P.sel = (P.sel || []).filter(m => Core.data.measures[m.id] && Core.data.measures[m.id].case !== 'antiviral');
    P.sel = (P.sel || []).filter(m => Core.data.measures[m.id]);
  }
  const serial = () => { const o = Object.assign({}, P); delete o.path; o.wane = P.path.wane || 0; return o; };
  function restoreP(o) {
    P = Object.assign(baseP(), o || {});
    if (!Core.data.pathogens[P.pid]) P.pid = 'measles';
    const w = P.wane; delete P.wane;
    applyPathogen(P.pid, true);
    const p = pat(); P.R0 = o && o.R0 > 0 ? o.R0 : p.R0.v; P.latent = o && o.latent >= 0 ? o.latent : p.latent.v; P.infect = o && o.infect > 0 ? o.infect : p.infect.v; P.cfr = o && o.cfr >= 0 ? o.cfr : p.cfr.v;
    if (w >= 0) P.path.wane = w;
    if (!PLACES.includes(P.place)) P.place = 'abstract';
    P.days = K.clamp(+P.days || 365, 30, 1095);
  }
  const saveP = K.debounce(() => store.set('P2', serial()), 300);
  const encodeCfg = () => btoa(unescape(encodeURIComponent(JSON.stringify(serial()))));
  function readCfg() {
    try { const c = new URLSearchParams(location.search).get('c'); if (c) return JSON.parse(decodeURIComponent(escape(atob(c)))); } catch (_) { /* enlace dañado */ }
    return null;
  }

  const refreshDerive = () => { dBase = Core.derive(P, 0); };
  function odeP() { return Object.assign({}, P, { seeds: isMap() ? P.mseeds : P.seeds, doy: P.doy }); }
  const recomputeODE = K.debounce(() => {
    const N = isMap() && geo() ? geoPop(geo()) : P.N, q = odeP(), h = Math.min(P.days, 1095);
    ode = seir(q, N, h); cf = (P.sel.length || P.vsel.length) ? seir(q, N, h, { noControl: true }) : null;
    drawCharts();
  }, 120);

  /* ================= dibujo ================= */
  function sizeCanvas(cv, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth;
    if (!w) return null;
    const hh = h || cv.clientHeight || w;
    const bw = Math.round(w * dpr), bh = Math.round(hh * dpr);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h: hh };
  }
  function worldAspect() { return isMap() && view ? view.W / view.H : 1; }

  function drawAgents(ctx, W, time) {
    const s = sim, N = s.N, x = s.x, y = s.y, st = s.st;
    const bg = ctx.createRadialGradient(W * .5, W * .42, W * .04, W * .5, W * .5, W * .78);
    bg.addColorStop(0, '#133354'); bg.addColorStop(.55, '#0a1b30'); bg.addColorStop(1, '#040a14');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W);
    if (P.place === 'mataro' && geo()) Map_.drawSilhouette(ctx, W, geo());
    const dr = K.clamp(W * 0.0105 * Math.sqrt(600 / N), 1.15, 7);
    const dot = (list, rad) => { ctx.beginPath(); for (let k = 0; k < list.length; k++) { const i = list[k], px = x[i] * W, py = y[i] * W; ctx.moveTo(px + rad, py); ctx.arc(px, py, rad, 0, 6.2832); } };
    const by = [[], [], [], [], [], []], iso = [];
    for (let i = 0; i < N; i++) { by[st[i]].push(i); if (st[i] === 2 && s.iso[i]) iso.push(i); }
    if (showRadius && by[2].length && by[2].length < 400) {
      ctx.strokeStyle = 'rgba(255,93,115,.32)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const i of by[2]) { const px = x[i] * W, py = y[i] * W; ctx.moveTo(px + s.r * W, py); ctx.arc(px, py, s.r * W, 0, 6.2832); }
      ctx.stroke();
    }
    if (by[5].length) {
      ctx.strokeStyle = COL.D; ctx.lineWidth = Math.max(1, dr * .38); ctx.beginPath();
      for (const i of by[5]) { const px = x[i] * W, py = y[i] * W, q = dr * .85; ctx.moveTo(px - q, py - q); ctx.lineTo(px + q, py + q); ctx.moveTo(px + q, py - q); ctx.lineTo(px - q, py + q); }
      ctx.stroke();
    }
    ctx.fillStyle = COL.S; dot(by[0], dr); ctx.fill();
    ctx.fillStyle = COL.R; dot(by[3], dr * .92); ctx.fill();
    ctx.fillStyle = COL.V; dot(by[4], dr); ctx.fill();
    if (dr > 2.2) { ctx.fillStyle = 'rgba(255,255,255,.85)'; dot(by[4], dr * .36); ctx.fill(); }
    ctx.fillStyle = 'rgba(245,184,46,.28)'; dot(by[1], dr); ctx.fill();
    ctx.strokeStyle = COL.E; ctx.lineWidth = Math.max(1.2, dr * .42); dot(by[1], dr * .9); ctx.stroke();
    if (by[2].length) {
      const pulse = RM ? 0 : Math.sin(time * 5) * .35;
      ctx.fillStyle = 'rgba(255,93,115,.20)'; dot(by[2], dr * (2.3 + pulse)); ctx.fill();
      ctx.fillStyle = COL.I; dot(by[2], dr * 1.18); ctx.fill();
      if (dr > 2.2) { ctx.fillStyle = 'rgba(255,255,255,.75)'; dot(by[2], dr * .34); ctx.fill(); }
      if (iso.length) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.3; ctx.setLineDash([2.5, 2.5]); dot(iso, dr * 2.1); ctx.stroke(); ctx.setLineDash([]); }
    }
    const vg = ctx.createRadialGradient(W / 2, W / 2, W * .42, W / 2, W / 2, W * .74);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, W);
  }
  function drawWorld(time) {
    els.world.style.aspectRatio = String(worldAspect());
    const c = sizeCanvas(els.world, els.world.clientWidth / worldAspect()); if (!c) return;
    if (isMap()) { if (view && sim.territory) Map_.draw(c.ctx, c.w, c.h, view, sim, { sel: selT, hover: hoverT, time, reduce: RM }); }
    else drawAgents(c.ctx, c.w, time);
  }

  /* gráficos (áreas apiladas e infecciosos) */
  const niceMax = (v) => { for (const s of [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60, 80, 100]) if (v <= s) return s; return 100; };
  const niceStep = (span) => { for (const s of [5, 10, 20, 25, 50, 100, 200, 250]) if (span / s <= 8) return s; return 365; };
  function drawStack(o) {
    const { ctx, w, h, hist, N, xmax } = o, fs = o.fs || 12;
    const m = { l: fs * 3.3, r: 12, t: fs * 1.3, b: fs * 3.2 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
    if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h); } else ctx.clearRect(0, 0, w, h);
    ctx.font = `${fs}px "Source Sans 3",system-ui,sans-serif`; ctx.textBaseline = 'middle';
    const X = (tt) => m.l + tt / xmax * pw, Y = (v) => m.t + ph - v / N * ph;
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.fillStyle = 'rgba(185,198,214,.9)'; ctx.lineWidth = 1; ctx.textAlign = 'right';
    for (const v of [0, 25, 50, 75, 100]) { const yy = Y(v / 100 * N); ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke(); ctx.fillText(v + '%', m.l - 6, yy); }
    ctx.textAlign = 'center'; const step = niceStep(xmax);
    for (let d = 0; d <= xmax; d += step) ctx.fillText(String(d), X(d), m.t + ph + fs * 1.1);
    ctx.fillStyle = 'rgba(142,160,181,.95)'; ctx.fillText(t('x_days'), m.l + pw / 2, m.t + ph + fs * 2.3);
    const n = hist.t.length; if (!n) return;
    const order = ['V', 'R', 'D', 'I', 'E', 'S'], cum = new Array(n).fill(0), prev = new Array(n).fill(0);
    for (const k of order) {
      const arr = hist[k]; for (let i = 0; i < n; i++) cum[i] = prev[i] + arr[i];
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const px = X(hist.t[i]), py = Y(cum[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(X(hist.t[i]), Y(prev[i]));
      ctx.closePath(); ctx.fillStyle = COL[k]; ctx.globalAlpha = .92; ctx.fill(); ctx.globalAlpha = 1;
      for (let i = 0; i < n; i++) prev[i] = cum[i];
    }
    if (o.hit > 0) {
      const yy = Y(o.hit * N); ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke(); ctx.restore();
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(`${t('hit_line')} ${K.fmt(o.hit * 100, 0)}%`, m.l + 8, Math.max(m.t + fs * .7, yy - fs * .8));
    }
    if (o.vday != null && o.vday <= xmax) { const xx = X(o.vday); ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = '#7fd3ff'; ctx.beginPath(); ctx.moveTo(xx, m.t); ctx.lineTo(xx, m.t + ph); ctx.stroke(); ctx.restore(); }
    if (o.cursor != null && o.cursor < n) { const xx = X(hist.t[o.cursor]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xx, m.t); ctx.lineTo(xx, m.t + ph); ctx.stroke(); }
  }
  function drawInc(o) {
    const { ctx, w, h, hist, N, xmax } = o, fs = o.fs || 12;
    const m = { l: fs * 3.3, r: 12, t: fs * 1.3, b: fs * 3.2 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${fs}px "Source Sans 3",system-ui,sans-serif`; ctx.textBaseline = 'middle';
    const agent = hist.I.map(v => v / N * 100);
    let peakV = Math.max(...agent, 0);
    const series = [];
    if (o.ode && o.showSEIR) series.push({ t: o.ode.t, v: o.ode.I.map(v => v * 100), css: 'rgba(255,255,255,.9)', dash: [7, 5] });
    if (o.cf && o.showCF) series.push({ t: o.cf.t, v: o.cf.I.map(v => v * 100), css: '#f5b82e', dash: [2, 4] });
    if (o.ref) series.push({ t: o.ref.t, v: o.ref.I.map(v => v * 100), css: '#5eead4', dash: [3, 4] });
    for (const sr of series) for (let i = 0; i < sr.t.length; i++) if (sr.t[i] <= xmax) peakV = Math.max(peakV, sr.v[i]);
    if (o.bands) for (let i = 0; i < o.bands.t.length; i++) if (o.bands.t[i] <= xmax) peakV = Math.max(peakV, o.bands.hi[i] * 100);
    if (o.cap) peakV = Math.max(peakV, o.cap * 1.25);
    const ymax = niceMax(Math.max(peakV * 1.12, 3));
    const X = (tt) => m.l + tt / xmax * pw, Y = (v) => m.t + ph - v / ymax * ph;
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.fillStyle = 'rgba(185,198,214,.9)'; ctx.lineWidth = 1; ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) { const v = ymax * i / 4, yy = Y(v); ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke(); ctx.fillText(K.fmt(v, v < 10 ? 1 : 0) + '%', m.l - 6, yy); }
    ctx.textAlign = 'center'; const step = niceStep(xmax);
    for (let d = 0; d <= xmax; d += step) ctx.fillText(String(d), X(d), m.t + ph + fs * 1.1);
    ctx.fillStyle = 'rgba(142,160,181,.95)'; ctx.fillText(t('x_days'), m.l + pw / 2, m.t + ph + fs * 2.3);
    if (o.bands) {
      const b = o.bands; ctx.beginPath(); let first = true;
      for (let i = 0; i < b.t.length; i++) { if (b.t[i] > xmax) break; const px = X(b.t[i]), py = Y(b.hi[i] * 100); first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false; }
      for (let i = b.t.length - 1; i >= 0; i--) if (b.t[i] <= xmax) ctx.lineTo(X(b.t[i]), Y(b.lo[i] * 100));
      ctx.closePath(); ctx.fillStyle = 'rgba(127,211,255,.2)'; ctx.fill();
      ctx.beginPath(); first = true;
      for (let i = 0; i < b.t.length; i++) { if (b.t[i] > xmax) break; const px = X(b.t[i]), py = Y(b.mid[i] * 100); first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false; }
      ctx.strokeStyle = '#7fd3ff'; ctx.lineWidth = 1.6; ctx.stroke();
    }
    const n = hist.t.length;
    if (n) {
      const g = ctx.createLinearGradient(0, m.t, 0, m.t + ph); g.addColorStop(0, 'rgba(255,93,115,.55)'); g.addColorStop(1, 'rgba(255,93,115,.04)');
      ctx.beginPath(); ctx.moveTo(X(hist.t[0]), Y(0));
      for (let i = 0; i < n; i++) ctx.lineTo(X(hist.t[i]), Y(agent[i]));
      ctx.lineTo(X(hist.t[n - 1]), Y(0)); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); for (let i = 0; i < n; i++) { const px = X(hist.t[i]), py = Y(agent[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.strokeStyle = '#ff5d73'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
    }
    for (const sr of series) {
      ctx.beginPath(); let first = true;
      for (let i = 0; i < sr.t.length; i++) { if (sr.t[i] > xmax) break; const px = X(sr.t[i]), py = Y(sr.v[i]); first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false; }
      ctx.save(); ctx.setLineDash(sr.dash); ctx.strokeStyle = sr.css; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
    }
    if (o.cap) { const yy = Y(o.cap); ctx.strokeStyle = '#f5b82e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke(); ctx.textAlign = 'left'; ctx.fillStyle = '#f5b82e'; ctx.fillText(`${t('k_cap')} ${o.cap}%`, m.l + 8, yy - fs * .8); }
    if (o.vday != null && o.vday <= xmax) { const xx = X(o.vday); ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = '#7fd3ff'; ctx.beginPath(); ctx.moveTo(xx, m.t); ctx.lineTo(xx, m.t + ph); ctx.stroke(); ctx.restore(); }
    if (n && o.peakDay != null && peakV > 0 && hist.t[n - 1] > 3) {
      const pv = Math.max(...agent); if (pv > 0) {
        const pxx = X(o.peakDay), pyy = Y(pv); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pxx, pyy, 3.5, 0, 6.2832); ctx.fill();
        ctx.textAlign = pxx > w * .7 ? 'right' : 'left'; ctx.fillStyle = '#fff'; ctx.fillText(t('peak_lbl', { p: K.fmt(pv, pv < 10 ? 2 : 1), d: K.fmt(o.peakDay, 1) }), pxx + (pxx > w * .7 ? -8 : 8), Math.max(m.t + fs * .7, pyy - fs * .9));
      }
    }
  }
  function xmaxNow() {
    const tmax = Math.max(sim.t, ref ? ref.t[ref.t.length - 1] : 0, bands ? bands.t[bands.t.length - 1] : 0);
    return Math.min(Math.max(60, Math.ceil((tmax + 3) / 10) * 10), Math.max(60, P.days));
  }
  const vDay = () => (P.varOn && sim && sim.variantAt != null ? sim.variantAt : (P.varOn && !sim.finished ? P.varDay : null));
  function drawCharts() {
    if (!sim) return;
    const xmax = xmaxNow(), vd = P.varOn ? P.varDay : null;
    const a = sizeCanvas(els.stack, els.stack.clientHeight);
    if (a) drawStack({ ctx: a.ctx, w: a.w, h: a.h, hist: sim.h, N: sim.N, xmax, cursor, hit: dBase.hitEff, vday: vd });
    const b = sizeCanvas(els.inc, els.inc.clientHeight);
    if (b) drawInc({ ctx: b.ctx, w: b.w, h: b.h, hist: sim.h, N: sim.N, xmax, ode, showSEIR, cf, showCF, ref, bands, cap: capLine, peakDay: sim.peakDay, vday: vd });
    updateAria();
  }

  /* ================= cifras ================= */
  /* ocupación hospitalaria aproximada: ingresos = infecciones × fracción hospitalizada, estancia media STAY días */
  function hospCalc() {
    const h = sim.h, hp = pat() ? pat().hosp : 0.02, scale = popReal() / sim.N, n = h.t.length, w = Math.round(STAY / 0.5);
    let sumWin = 0, peak = 0, peakDay = 0;
    for (let i = 0; i < n; i++) { sumWin += h.inc[i]; if (i >= w) sumWin -= h.inc[i - w]; const o = sumWin * hp * scale; if (o > peak) { peak = o; peakDay = h.t[i]; } }
    return { peak, peakDay, total: sim.cum * hp * scale };
  }
  function updateResults() {
    const s = sim.summary(), scale = popReal() / sim.N, pop = popReal(), H = hospCalc();
    const cap = P.beds / 1000 * pop, sat = H.peak > cap && cap >= 0;
    const tiles = [
      { b: fmtN(pop), l: t('r_pop') }, { b: fmtN(s.infected * scale), l: t('r_cases', { p: pct(s.attack, 1) }) },
      { b: '≈ ' + fmtN(H.total), l: t('r_hosp') }, { b: '≈ ' + fmtN(H.peak), l: t('r_hosp_peak', { d: K.fmt(H.peakDay, 0) }), cls: sat ? 'bad' : '' },
      { b: fmtN(s.D * scale), l: t('r_dead', { p: pct(s.D / sim.N, 3) }) }, { b: fmtN(cap), l: t('r_beds', { b: K.fmt(P.beds, 1) }) }
    ];
    els.results.innerHTML = `<div class="stats">${tiles.map(x => `<div class="stat ${x.cls || ''}"><b>${x.b}</b><span>${K.esc(x.l)}</span></div>`).join('')}</div>` +
      (sat ? `<div class="banner lose" role="status">${K.esc(t('r_sat', { n: fmtN(H.peak), c: fmtN(cap) }))}</div>` : (H.peak > 0 ? `<p class="small muted">${K.esc(t('r_ok'))}</p>` : '')) +
      `<p class="small muted">${K.esc(t('r_note', { s: STAY }))}</p>`;
  }
  /* R(t) estimado a partir del crecimiento de la incidencia (Wallinga-Lipsitch con etapas gamma) */
  function rEstimate() {
    const h = sim.h, n = h.t.length; if (n < 30) return null;
    let a = 0, b = 0; for (let i = n - 14; i < n; i++) a += h.inc[i]; for (let i = n - 28; i < n - 14; i++) b += h.inc[i];
    if (a < 8 || b < 8) return null;
    const r = Math.log(a / b) / 7, D = Math.max(0.1, P.infect), Lt = Math.max(0, P.latent);
    return Math.pow(1 + r * D / 3, 3) * (Lt > 0 ? Math.pow(1 + r * Lt / 3, 3) : 1);
  }
  function updateStats() {
    const s = sim.summary(), d = dBase, N = sim.N;
    const Re = sim.reNow ? sim.reNow() : d.R0eff, re2 = rEstimate();
    const theory = finalSize(d.R0eff, d.s0), hit = d.hitEff;
    const tiles = [
      { b: K.fmt(s.t, 1), l: t('s_day') },
      { b: K.fmt(d.R0eff, 2), l: t('s_r0eff'), cls: d.R0eff < 1 ? 'ok' : '' },
      { b: K.fmt(Re, 2), l: t('s_re'), cls: Re < 1 ? 'ok' : (s.I > 0 ? 'bad' : ''), hl: true },
      { b: re2 == null ? '—' : K.fmt(re2, 2), l: t('s_rest') },
      { b: hit > 0 ? pct(hit, 0) + ' %' : '—', l: t('s_hit') },
      { b: pct(s.attack, 1) + ' %', l: t('s_inf_th', { v: pct(theory, 0) }) },
      { b: pct(s.peak, 2) + ' %', l: t('s_peak_day', { d: K.fmt(s.peakDay, 1) }) }
    ];
    els.stats.innerHTML = tiles.map(x => `<div class="stat ${x.hl ? 'hl' : ''} ${x.cls || ''}"><b>${x.b}</b><span>${K.esc(x.l)}</span></div>`).join('');
  }
  function updateLegend() {
    const stamp = sim.cnt.join(',');
    if (stamp === lastStamp) return; lastStamp = stamp;
    els.legend.querySelectorAll('[data-s]').forEach(e => { e.querySelector('em').textContent = fmtN(sim.cnt[STATES.indexOf(e.dataset.s)]); });
  }
  function renderLegend() {
    els.legend.innerHTML = STATES.map(s => `<span class="chip" data-s="${s}" title="${K.esc(t('sd_' + s))}"><i style="background:${COL[s]}"></i>${K.esc(t('st_' + s))}<em>0</em></span>`).join('');
    lastStamp = ''; if (sim) updateLegend();
  }
  function updateReadout() {
    const h = sim.h, i = cursor != null ? Math.min(cursor, h.t.length - 1) : h.t.length - 1, f = fmtN;
    els.readout.textContent = t('readout', { d: K.fmt(h.t[i], 1), S: f(h.S[i]), E: f(h.E[i]), I: f(h.I[i]), R: f(h.R[i]), V: f(h.V[i]), D: f(h.D[i]) });
  }
  function updateAria() {
    const s = sim.summary(), f = fmtN;
    const summ = t('sum_now', { d: K.fmt(s.t, 1), I: f(s.I), S: f(s.S), p: K.fmt(s.peak * 100, 2), pd: K.fmt(s.peakDay, 1) });
    els.stack.setAttribute('aria-label', t('stack_aria', { s: summ }));
    els.inc.setAttribute('aria-label', t('inc_aria', { s: summ }));
    els.world.setAttribute('aria-label', t(isMap() ? 'map_aria' : 'world_aria', { d: K.fmt(s.t, 1), S: f(s.S), E: f(s.E), I: f(s.I), R: f(s.R), V: f(s.V), D: f(s.D), pl: t('pl_' + P.place) }));
  }
  function announce() { els.live.textContent = t('sum_now', { d: K.fmt(sim.t, 0), I: fmtN(sim.cnt[2]), S: fmtN(sim.cnt[0]), p: K.fmt(sim.peak / sim.N * 100, 2), pd: K.fmt(sim.peakDay, 1) }); }
  function updateRatio() {
    let txt;
    if (P.place === 'abstract') txt = t('ratio_abs', { n: K.fmt(P.N, 0) });
    else if (P.place === 'mataro') txt = t('ratio_agents', { k: K.fmt(popReal() / P.N, 1), pop: fmtN(popReal()), n: K.fmt(P.N, 0), pl: t('pl_mataro') });
    else txt = view ? t('ratio_map', { k: fmtN(view.perDot), dots: K.fmt(view.dots, 0), pop: fmtN(popReal()) }) : '';
    els.ratio.textContent = txt;
  }
  function updateMapInfo() {
    if (!isMap() || !sim.territory || !geo()) { els.mapinfo.hidden = true; return; }
    const i = hoverT >= 0 ? hoverT : selT; els.mapinfo.hidden = false;
    if (i < 0) { els.mapinfo.textContent = t('map_hint'); return; }
    const T = sim.territory(i), f = geo().features[i];
    els.mapinfo.textContent = t('terr_info', { n: L(f.n), pop: fmtN(T.pop), att: pct(T.cum / T.pop, 1), I: fmtN(T.I), D: fmtN(T.D), first: T.first >= 0 ? K.fmt(T.first, 0) : '—' });
  }

  /* ================= bucle ================= */
  function setPlayLabel() { els.play.textContent = playing ? t('btn_pause') : (sim.t > 0 && !sim.finished ? t('btn_resume') : t('btn_play')); }
  function render(ts) {
    drawWorld((ts || performance.now()) / 1000);
    const len = sim.h.t.length;
    if (len !== render.len) { render.len = len; updateStats(); updateResults(); drawCharts(); updateReadout(); if (isMap()) { Panels.updateRank(); updateMapInfo(); } if (Math.round(sim.t) % 10 === 0) announce(); }
    updateLegend();
  }
  function maybeVariant(s) {
    if (P.varOn && s.applyVariant && s.variantAt == null && s.t >= P.varDay) {
      s.applyVariant(P.varEsc / 100, P.varR0, isMap() ? P.mseeds : P.seeds);
      if (s === sim) K.toast(t('var_arrived'));
    }
  }
  function advance(ticks) {
    const t0 = performance.now();
    while (ticks > 0 && !sim.finished) {
      const k = Math.min(ticks, 10); sim.step(k); ticks -= k; maybeVariant(sim);
      if (performance.now() - t0 > 11) break;
    }
    return ticks;
  }
  function frame(ts) {
    if (!playing) return;
    const real = Math.min(0.1, (ts - lastTs) / 1000); lastTs = ts;
    acc += real * DPS * SPEEDS[speedIdx];
    const ticks = Math.floor(acc / 0.1);
    if (ticks > 0) { acc -= ticks * 0.1; const left = advance(ticks); if (left > 0) acc = 0; }
    render(ts);
    if (sim.finished) { pause(); onFinished(); return; }
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (sim.finished) restart(false);
    playing = true; lastTs = performance.now(); acc = 0; els.msg.hidden = true; setPlayLabel(); K.keepAwake(false);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function pause() { playing = false; cancelAnimationFrame(raf); setPlayLabel(); }
  function stepDays(d) {
    if (playing) pause(); if (sim.finished) return;
    let n = Math.round(d / 0.1); while (n > 0 && !sim.finished) { const k = Math.min(n, 10); sim.step(k); n -= k; maybeVariant(sim); }
    render(); if (sim.finished) onFinished(); setPlayLabel();
  }
  function makeSim(p) {
    if (mode() === 'meta') return new Meta(p, geo());
    return new Sim(p, { domain: P.place === 'mataro' ? domain : null });
  }
  let dirty = false;
  function restart(autoplay) {
    pause();
    if (isMap() && !geo()) return;
    if (isMap() && !geo().features.some(f => f.id === P.origin)) P.origin = defaultOrigin(geo());
    sim = makeSim(P); cursor = null; chalResult = null; bands = null; dirty = false; hoverT = -1; selT = -1;
    els.dirty.hidden = true; els.apply.hidden = true; els.msg.hidden = true; render.len = -1;
    refreshDerive(); updateRatio(); render(); setPlayLabel(); renderBanner(); els.bandout.textContent = '';
    if (isMap()) { Panels.renderMapSide(); updateMapInfo(); }
    if (autoplay && !RM) play(); else if (RM) { els.msg.textContent = t('world_msg_rm'); els.msg.hidden = false; }
  }
  const applyReset = K.debounce(() => restart(false), 280);
  function needReset() { if (!sim || sim.t === 0 || sim.finished) applyReset(); else { dirty = true; els.dirty.hidden = false; els.apply.hidden = false; } }
  function onFinished() {
    const s = sim.summary();
    els.msg.textContent = t('world_msg_done', { d: K.fmt(sim.finishedAt ?? s.t, 1), p: pct(s.attack, 1) }); els.msg.hidden = false;
    announce(); if (challenge) evaluateChallenge();
  }
  const defaultOrigin = (g) => { const d = PLACE_DEF[P.place]; return d && d.origin && g.features.some(f => f.id === d.origin) ? d.origin : g.features.slice().sort((a, b) => b.pop - a.pop)[0].id; };

  /* ================= lugares y patógenos ================= */
  function ensureGeo(id) {
    if (id === 'abstract' || geoCache[id]) return Promise.resolve(geoCache[id] || null);
    return fetch('data/geo/' + id + '.json').then(r => { if (!r.ok) throw new Error(id); return r.json(); }).then(g => { geoCache[id] = g; return g; });
  }
  function prepareGeo() {
    view = null; domain = null; const g = geo(); if (!g) return;
    if (isMap()) view = Map_.build(g); else if (P.place === 'mataro') domain = Map_.domain(g, 256);
  }
  function setPlace(id, opts = {}) {
    if (!PLACES.includes(id)) id = 'abstract';
    ensureGeo(id).then(() => {
      pause(); const d = PLACE_DEF[id] || {};
      P.place = id;
      if (!opts.keep) { Object.assign(P, d); if (id === 'mataro' && P.N < 1500) P.N = 3000; if (id === 'abstract') P.N = Math.min(P.N, 2000); }
      if (isMap() && geo() && !geo().features.some(f => f.id === P.origin)) P.origin = defaultOrigin(geo());
      prepareGeo(); saveP();
      Panels.renderPlaces(); Panels.renderMapSide(); $('#map-panel').hidden = !isMap();
      renderControls(); recomputeODE(); restart(!opts.noplay);
    }).catch(() => K.toast(t('err_geo')));
  }
  function loadPathogen(id) {
    if (id === 'custom') { scenId = 'custom'; Panels.renderPathogens(); return; }
    scenId = id; applyPathogen(id, true);
    if (!challenge) { capLine = null; } challenge = null; capLine = null; saveP(); store.set('scen', scenId);
    refreshDerive(); Panels.renderPathogens(); Panels.renderMeasures(); Panels.renderVaccines(); renderControls(); renderChallenges(); recomputeODE(); restart(true);
  }

  /* ================= retos ================= */
  function renderChallenges() {
    $('#challenges').innerHTML = CHAL_ORDER.map(id => {
      const base = challengeBase(id);
      return `<article class="chal ${challenge === id ? 'active' : ''}"><h3>${K.esc(t('ch_' + id + '_t'))}${done[id] ? `<span class="done">✓ ${K.esc(t('chal_done'))}</span>` : ''}</h3>
        <p>${K.esc(t('ch_' + id + '_g', { v: K.fmt(base.peak * 100, 0), a: K.fmt(base.attack * 100, 0), c: CHALS[id].cap || 0 }))}</p><p class="hint" hidden data-hint="${id}">${K.esc(t('ch_' + id + '_h'))}</p>
        <div class="row"><button class="btn small" type="button" data-load="${id}">${K.esc(t('chal_load'))}</button><button class="btn ghost small" type="button" data-showhint="${id}">${K.esc(t('chal_hint'))}</button></div></article>`;
    }).join('');
  }
  const chalCache = {};
  function challengeBase(id) {
    if (chalCache[id]) return chalCache[id];
    const p = pat(CHALS[id].pid), q = { pid: p.id, R0: p.R0.v, latent: p.latent.v, infect: p.infect.v, cfr: p.cfr.v, path: Core.pathOf(p), seeds: 3, prior: p.prior || 0, sel: [], vsel: [], vacc: 0, doy: P.doy };
    const o = seir(q, 600, 365); return (chalCache[id] = { peak: o.peak, attack: o.final });
  }
  function loadChallenge(id) {
    const def = CHALS[id];
    challenge = id; capLine = def.cap || null;
    P.place = 'abstract'; Object.assign(P, { N: 800, seeds: 3, days: 365, varOn: false, imp: 0, kdisp: 0 });
    applyPathogen(def.pid, false); scenId = def.pid;
    if (def.vsel) { P.vsel = def.vsel.slice(); P.hypEff = def.hypEff || 60; }
    prepareGeo(); store.set('P2', serial()); refreshDerive();
    Panels.renderPlaces(); Panels.renderPathogens(); Panels.renderMeasures(); Panels.renderVaccines(); Panels.renderMapSide(); $('#map-panel').hidden = true;
    renderControls(); renderChallenges(); recomputeODE(); restart(false);
    $('#app').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }
  function renderBanner() {
    const b = els.banner;
    if (!challenge) { b.hidden = true; return; }
    const base = challengeBase(challenge), ex = { v: K.fmt(base.peak * 100, 0), a: K.fmt(base.attack * 100, 0), c: CHALS[challenge].cap || 0 };
    b.hidden = false;
    if (chalResult) {
      b.className = 'banner challenge-banner ' + (chalResult.win ? 'win' : 'lose');
      b.innerHTML = `<b>${K.esc(t(chalResult.win ? 'chal_win' : 'chal_lose'))}</b> ${K.esc(chalResult.text)}<div class="row"><button class="btn small ghost" type="button" data-exit="1">${K.esc(t('chal_clear'))}</button></div>`;
    } else {
      b.className = 'banner challenge-banner';
      b.innerHTML = `<b>${K.esc(t('chal_active'))}: ${K.esc(t('ch_' + challenge + '_t'))}.</b> ${K.esc(t('ch_' + challenge + '_g', ex))}<div class="row"><button class="btn small ghost" type="button" data-exit="1">${K.esc(t('chal_clear'))}</button></div>`;
    }
  }
  function evaluateChallenge() {
    const s = sim.summary(), def = CHALS[challenge], noMeas = !P.sel.length, noVac = !(P.vsel.length && P.vacc > 0);
    let win = false, text = '';
    if (challenge === 'measles' || challenge === 'eff') {
      if (!noMeas) text = t('res_nomeas'); else if (noVac) text = t('res_needvac'); else { win = s.attack * 100 < def.goal; text = t(win ? 'res_attack_win' : 'res_attack_lose', { p: pct(s.attack, 1), g: def.goal }); }
    } else if (!noVac) text = t('res_novacc');
    else if (challenge === 'flat') {
      const baseP = seir(Object.assign(odeP(), { sel: [], vsel: [], vacc: 0 }), sim.N, 365).peak;
      win = s.peak < baseP * 0.5; text = t(win ? 'res_flat_win' : 'res_flat_lose', { p: pct(s.peak, 1), b: pct(baseP, 1), g: pct(baseP * .5, 1) });
    } else if (challenge === 'cap') {
      win = s.peak * 100 <= def.cap; text = t(win ? 'res_cap_win' : 'res_cap_lose', { p: pct(s.peak, 1), c: def.cap });
    } else if (challenge === 'ebola') {
      win = s.attack * 100 < def.goal; text = t(win ? 'res_attack_win' : 'res_attack_lose', { p: pct(s.attack, 1), g: def.goal });
    }
    chalResult = { win, text }; if (win) { done[challenge] = true; store.set('done', done); renderChallenges(); }
    renderBanner();
  }

  /* ================= controles ================= */
  const num = (u, d = 0) => v => K.fmt(v, d) + (u ? ' ' + u : '');
  const CTL = [
    { g: 'g_disease', items: [
      { k: 'R0', min: 0.5, max: 20, step: 0.1, f: num('', 1) }, { k: 'latent', min: 0, max: 21, step: 0.5, f: num('d', 1) },
      { k: 'infect', min: 1, max: 30, step: 0.5, f: num('d', 1) }, { k: 'cfr', min: 0, max: 30, step: 0.05, f: v => K.fmt(v, v < 0.1 ? 3 : 2) + ' %' },
      { k: 'prior', min: 0, max: 95, step: 1, f: num('%') }, { k: 'wane', min: 0, max: 1500, step: 10, f: v => (v > 0 ? K.fmt(v, 0) + ' d' : t('imm_life')), get: () => P.path.wane || 0, set: v => { P.path.wane = v; } }] },
    { g: 'g_pop', items: [
      { k: 'N', min: 100, max: 20000, step: 100, f: num('', 0), show: () => !isMap() },
      { k: 'seeds', min: 1, max: 50, step: 1, f: num('', 0), show: () => !isMap() },
      { k: 'days', min: 30, max: 1095, step: 5, f: num('d', 0) },
      { k: 'seed', seed: true }] },
    { g: 'g_extra', items: [
      { k: 'doy', month: true },
      { k: 'imp', min: 0, max: 50, step: 1, f: num('', 0) },
      { k: 'kdisp', min: 0, max: 5, step: 0.1, f: v => (v > 0 ? K.fmt(v, 1) : t('off')), show: () => !isMap() },
      { k: 'beds', min: 0, max: 5, step: 0.1, f: num('', 1) }] },
    { g: 'g_variant', items: [
      { k: 'varOn', check: true },
      { k: 'varDay', min: 5, max: 1000, step: 5, f: num('d', 0) },
      { k: 'varEsc', min: 0, max: 100, step: 5, f: num('%') },
      { k: 'varR0', min: 0.5, max: 3, step: 0.1, f: v => '×' + K.fmt(v, 1) }] }
  ];
  const ctlItems = () => CTL.flatMap(g => g.items);
  function renderControls() {
    els.controls.innerHTML = CTL.map(grp => `<div class="ctl-group"><h3>${K.esc(t(grp.g))}</h3>${grp.items.filter(it => !it.show || it.show()).map(it => {
      if (it.seed) return `<div class="ctl"><label class="top" for="c-seed"><span>${K.esc(t('c_seed'))}</span></label><div class="seed-row"><input type="number" id="c-seed" data-k="seed" min="1" max="999999" step="1" value="${P.seed}"><button class="icon-btn" type="button" data-dice="1" title="${K.esc(t('dice'))}" aria-label="${K.esc(t('dice'))}">🎲</button></div><small>${K.esc(t('c_seed_h'))}</small></div>`;
      if (it.month) return `<div class="ctl"><label class="top" for="c-doy"><span>${K.esc(t('c_doy'))}</span></label><select id="c-doy" data-k="doy">${FIRST_DOY.map((d, i) => `<option value="${d}" ${(() => { let b = 0; FIRST_DOY.forEach((x, j) => { if (P.doy >= x) b = j; }); return b === i; })() ? 'selected' : ''}>${K.esc(new Date(2025, i, 1).toLocaleDateString(K.locale(), { month: 'long' }))}</option>`).join('')}</select><small>${K.esc(t('c_doy_h'))}</small></div>`;
      if (it.check) return `<label class="check"><input type="checkbox" data-k="varOn" ${P.varOn ? 'checked' : ''}><span>${K.esc(t('c_varOn'))}</span></label><small class="muted">${K.esc(t('c_varOn_h'))}</small>`;
      const val = it.get ? it.get() : P[it.k];
      return `<div class="ctl"><label class="top" for="c-${it.k}"><span>${K.esc(t('c_' + it.k))}</span><output id="o-${it.k}">${it.f(val)}</output></label>
        <input type="range" id="c-${it.k}" data-k="${it.k}" min="${it.min}" max="${it.max}" step="${it.step}" value="${val}"><small>${K.esc(t('c_' + it.k + '_h'))}</small></div>`;
    }).join('')}</div>`).join('') + `<div class="ctl-group"><h3>${K.esc(t('g_runs'))}</h3><p class="small muted">${K.esc(t('runs_p'))}</p><div class="row"><button class="btn small" type="button" id="btn-bands">${K.esc(t('runs_btn'))}</button><button class="btn ghost small" type="button" id="btn-bandsx" ${bands ? '' : 'hidden'}>${K.esc(t('runs_clear'))}</button></div><p class="small" id="bandout" aria-live="polite"></p></div>`;
    els.bandout = $('#bandout'); if (bands && bands.text) els.bandout.textContent = bands.text;
  }
  function onControl(k, raw) {
    const it = ctlItems().find(i => i.k === k) || {};
    const v = k === 'seed' ? Math.max(1, Math.round(+raw) || 1) : (it.check ? !!raw : +raw);
    if (it.set) it.set(v); else P[k] = v;
    saveP();
    const out = $('#o-' + k); if (out && it.f) out.textContent = it.f(v);
    refreshDerive();
    if (BASE_KEYS.includes(k) && scenId !== 'custom') { scenId = 'custom'; store.set('scen', scenId); }
    Panels.renderCard(); Panels.renderPathogens(); Panels.updateMeasureSummary(); Panels.updateVaxInfo(); recomputeODE();
    if (k === 'days') { sim.setParams({ days: P.days }); render.len = -1; if (!playing) render(); return; }
    if (k === 'varOn') { sim.setParams({ varOn: P.varOn }); }
    if (RESET_KEYS.includes(k)) needReset();
    else { sim.setParams(P); render.len = -1; if (!playing) render(); }
  }
  function renderStatic() {
    document.title = `${t('title')} · Luis Franco Serrano`;
    $('#speed').innerHTML = SPEEDS.map((s, i) => `<button type="button" data-speed="${i}" aria-pressed="${i === speedIdx}">×${K.fmt(s, 2)}</button>`).join('');
    $('#t-stack').textContent = t('t_stack'); $('#t-inc').textContent = t('t_inc');
    $('#inc-key').innerHTML = `<span class="chip" style="color:#ff5d73"><i></i>${K.esc(t('k_agents'))}</span><span class="chip dash" style="color:#fff"><i></i>${K.esc(t('k_seir'))}</span><span class="chip dash" style="color:#f5b82e"><i></i>${K.esc(t('k_cf'))}</span>${ref ? `<span class="chip dash" style="color:#5eead4"><i></i>${K.esc(t('k_ref'))}</span>` : ''}${bands ? `<span class="chip" style="color:#7fd3ff"><i></i>${K.esc(t('k_bands'))}</span>` : ''}`;
    els.ref.textContent = ref ? t('ref_clear') : t('ref_set');
    $('#opt-radius').checked = showRadius; $('#opt-seir').checked = showSEIR; $('#opt-cf').checked = showCF;
    $('#explain-body').innerHTML = `<h2>${K.esc(t('ex_h'))}</h2><div class="banner disc">${K.esc(t('disc'))}</div>` +
      ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6'].map((k, i) => `<details ${i === 0 ? 'open' : ''}><summary>${K.esc(t(k + '_t'))}</summary>${k === 'ex1' ? `<ul>${STATES.map(s => `<li><span class="sw" style="background:${COL[s]}"></span><b>${K.esc(t('st_' + s))}</b>: ${K.esc(t('sd_' + s))}</li>`).join('')}</ul>` : ''}<p>${K.esc(t(k + '_p'))}</p></details>`).join('');
    renderLegend(); Panels.renderAll(); renderControls(); renderChallenges(); renderBanner(); updateRatio(); updateMapInfo();
    if (sim) { setPlayLabel(); K.applyDom(); render.len = -1; render(); if (sim.finished) { els.msg.textContent = t('world_msg_done', { d: K.fmt(sim.finishedAt ?? sim.t, 1), p: pct(sim.summary().attack, 1) }); els.msg.hidden = false; } }
    else K.applyDom();
  }

  /* ================= varias ejecuciones (bandas de incertidumbre) ================= */
  async function runBands() {
    if (bandsBusy) return; bandsBusy = true;
    const runs = isMap() ? 8 : 15, btn = $('#btn-bands'); btn.disabled = true;
    const series = [], attacks = []; let tmax = 0;
    const tick = () => new Promise(r => setTimeout(r, 0));
    for (let r = 0; r < runs; r++) {
      const p2 = Object.assign({}, P, { seed: P.seed * 97 + r * 7919 + 1 }); if (!isMap()) p2.N = Math.min(P.N, 1500);
      const s = mode() === 'meta' ? new Meta(p2, geo()) : new Sim(p2, { domain: P.place === 'mataro' ? domain : null });
      let t0 = performance.now();
      while (!s.finished) { s.step(10); maybeVariant(s); if (performance.now() - t0 > 25) { await tick(); t0 = performance.now(); } }
      series.push({ t: s.h.t, I: s.h.I.map(v => v / s.N) }); attacks.push(s.cum / s.N); tmax = Math.max(tmax, s.t);
      els.bandout.textContent = t('runs_prog', { a: r + 1, b: runs });
    }
    const T = [], lo = [], mid = [], hi = [];
    for (let k = 0; k * 0.5 <= tmax; k++) {
      const vals = series.map(sr => sr.I[Math.min(k, sr.I.length - 1)]).sort((a, b) => a - b);
      T.push(k * 0.5); lo.push(vals[Math.floor(0.1 * (runs - 1))]); mid.push(vals[Math.floor(0.5 * (runs - 1))]); hi.push(vals[Math.ceil(0.9 * (runs - 1))]);
    }
    attacks.sort((a, b) => a - b);
    bands = { t: T, lo, mid, hi, text: t('runs_res', { n: runs, a: pct(attacks[0], 1), b: pct(attacks[Math.floor((runs - 1) / 2)], 1), c: pct(attacks[runs - 1], 1) }) };
    btn.disabled = false; bandsBusy = false; renderControls(); renderStatic(); drawCharts();
  }

  /* ================= exportar y compartir ================= */
  function exportCSV() {
    const h = sim.h, nl = '\r\n', sc = popReal() / sim.N;
    const head = [`# ${t('title')} · ${pat() ? L(pat().name) : ''} · ${t('pl_' + P.place)}`, `# R0=${P.R0}; latent=${P.latent}; infect=${P.infect}; cfr=${P.cfr}%; days=${P.days}; place=${P.place}; N=${P.N}; vacc=${P.vacc}%; vaccines=${P.vsel.join('+')}; measures=${P.sel.map(m => m.id + ':' + m.adh + '%@' + m.start + '+' + m.dur).join(' ')}; seeds=${P.seeds}; seed=${P.seed}; scale=${sc.toFixed(3)}`];
    const rows = [[t('csv_day'), 'S', 'E', 'I', 'R', 'V', 'D', t('csv_new'), t('csv_cum')]];
    for (let i = 0; i < h.t.length; i++) rows.push([h.t[i].toFixed(1).replace('.', ','), ...[h.S[i], h.E[i], h.I[i], h.R[i], h.V[i], h.D[i], h.inc[i], h.cum[i]].map(v => Math.round(v * sc))]);
    K.download(`epidemia-${P.pid}-${P.place}-semilla${P.seed}.csv`, '﻿' + head.join(nl) + nl + K.toCSV(rows), 'text/csv;charset=utf-8');
  }
  function exportPNG() {
    const W = 1280, H = 720, c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0d1a2a'); g.addColorStop(1, '#1c3a5c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = '700 40px "Bricolage Grotesque",system-ui,sans-serif'; ctx.fillText(`${t('title')} · ${pat() ? L(pat().name) : ''}`, 48, 70);
    ctx.font = '400 20px "Source Sans 3",system-ui,sans-serif'; ctx.fillStyle = '#b9c6d6';
    ctx.fillText(`${t('pl_' + P.place)} · R0 ${K.fmt(P.R0, 1)} · ${t('c_vacc')} ${K.fmt(P.vacc, 0)} % (${P.vsel.length}) · ${t('measures_h')}: ${P.sel.length} · ${t('png_ill')}`, 48, 104);
    ctx.save(); ctx.translate(48, 130); drawStack({ ctx, w: 1184, h: 470, hist: sim.h, N: sim.N, xmax: xmaxNow(), cursor: null, hit: dBase.hitEff, fs: 16, bg: '#08131f' }); ctx.restore();
    let lx = 48; ctx.font = '600 18px "Source Sans 3",system-ui,sans-serif';
    for (const s of STATES) { ctx.fillStyle = COL[s]; ctx.beginPath(); ctx.arc(lx + 8, 640, 8, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(t('st_' + s), lx + 24, 646); lx += 40 + ctx.measureText(t('st_' + s)).width + 18; }
    ctx.textAlign = 'right'; ctx.fillStyle = '#8ea0b5'; ctx.fillText('luisfs.com', W - 48, 686);
    c.toBlob(async blob => {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); K.toast(t('png_copied')); }
      catch (_) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'epidemia.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); K.toast(t('png_saved')); }
    }, 'image/png');
  }
  async function shareLink() {
    const url = location.origin + location.pathname + '?c=' + encodeURIComponent(encodeCfg());
    try { history.replaceState(null, '', url); } catch (_) { /* sin historial */ }
    try { await navigator.clipboard.writeText(url); K.toast(t('link_copied')); } catch (_) { K.toast(t('link_bar')); }
  }

  /* ================= host de paneles ================= */
  const host = {
    K, t, Core, geoCache, fmtN, get P() { return P; }, get sim() { return sim; }, get scenId() { return scenId; }, get derive() { return dBase; },
    isMap, setPlace: (id) => { challenge = null; capLine = null; renderBanner(); renderChallenges(); setPlace(id); },
    pickScenario: loadPathogen,
    measuresChanged() { refreshDerive(); sim.setParams(P); saveP(); Panels.updateMeasureSummary(); Panels.renderCard(); recomputeODE(); render.len = -1; if (!playing) render(); },
    vaccinesChanged() { refreshDerive(); saveP(); Panels.updateVaxInfo(); Panels.renderCard(); recomputeODE(); needReset(); },
    mapParamChanged(k, reset) { saveP(); sim.setParams(P); if (reset) needReset(); else { render.len = -1; if (!playing) render(); } },
    setOrigin(id) { P.origin = id; saveP(); restart(true); }
  };
  const Panels = window.EpiPanels;

  /* ================= eventos ================= */
  function wire() {
    els.play.addEventListener('click', () => (playing ? pause() : play()));
    $('#btn-step').addEventListener('click', () => stepDays(1));
    $('#btn-week').addEventListener('click', () => stepDays(7));
    $('#btn-reset').addEventListener('click', () => restart(false));
    els.apply.addEventListener('click', () => restart(true));
    $('#speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (!b) return; speedIdx = +b.dataset.speed; store.set('speed', speedIdx); $('#speed').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.speed === speedIdx))); });
    $('#opt-radius').addEventListener('change', e => { showRadius = e.target.checked; store.set('radius', showRadius); render.len = -1; render(); });
    $('#opt-seir').addEventListener('change', e => { showSEIR = e.target.checked; store.set('seir', showSEIR); drawCharts(); });
    $('#opt-cf').addEventListener('change', e => { showCF = e.target.checked; store.set('cf', showCF); drawCharts(); });
    els.ref.addEventListener('click', () => {
      if (ref) ref = null; else { ref = { t: sim.h.t.slice(), I: sim.h.I.map(v => v / sim.N) }; K.toast(t('ref_ok')); }
      renderStatic();
    });
    $('#btn-csv').addEventListener('click', exportCSV);
    $('#btn-png').addEventListener('click', exportPNG);
    $('#btn-share').addEventListener('click', shareLink);
    $('#challenges').addEventListener('click', e => {
      const l = e.target.closest('[data-load]'); if (l) { loadChallenge(l.dataset.load); return; }
      const h = e.target.closest('[data-showhint]'); if (h) { const p = $(`[data-hint="${h.dataset.showhint}"]`); p.hidden = !p.hidden; }
    });
    els.banner.addEventListener('click', e => { if (e.target.closest('[data-exit]')) { challenge = null; capLine = null; chalResult = null; renderBanner(); renderChallenges(); drawCharts(); } });
    els.controls.addEventListener('input', e => { const d = e.target.dataset; if (d && d.k && e.target.type === 'range') onControl(d.k, e.target.value); });
    els.controls.addEventListener('change', e => {
      const d = e.target.dataset; if (!d || !d.k) return;
      if (d.k === 'seed') onControl('seed', e.target.value); else if (d.k === 'doy') onControl('doy', e.target.value); else if (d.k === 'varOn') onControl('varOn', e.target.checked);
    });
    els.controls.addEventListener('click', e => {
      if (e.target.closest('[data-dice]')) { const s = 1 + Math.floor(Math.random() * 99999); $('#c-seed').value = s; onControl('seed', s); }
      else if (e.target.closest('#btn-bands')) runBands();
      else if (e.target.closest('#btn-bandsx')) { bands = null; renderControls(); renderStatic(); drawCharts(); }
    });
    /* clic en el mundo / mapa: introducir casos */
    const pos = (e) => { const r = els.world.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
    els.world.addEventListener('pointerdown', e => {
      const [px, py, r] = pos(e);
      if (isMap()) {
        const i = Map_.hit(els.world.getContext('2d'), view, r.width, r.height, px, py, 1); if (i < 0) return;
        selT = i; sim.introduce(i, Math.max(1, Math.round(P.mseeds))); announceIntro(i);
      } else if (sim.introduce(px / r.width, py / r.height) < 0) return;
      render.len = -1; els.msg.hidden = true; render(); setPlayLabel();
    });
    els.world.addEventListener('pointermove', e => {
      if (!isMap() || !view) return; const [px, py, r] = pos(e);
      const i = Map_.hit(els.world.getContext('2d'), view, r.width, r.height, px, py, 1); if (i !== hoverT) { hoverT = i; updateMapInfo(); if (!playing) render(); }
    });
    els.world.addEventListener('pointerleave', () => { if (hoverT >= 0) { hoverT = -1; updateMapInfo(); if (!playing) render(); } });
    els.world.addEventListener('keydown', e => {
      if (isMap()) {
        const n = sim.n;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') selT = (selT + 1 + n) % n; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') selT = (selT - 1 + n) % n;
        else if (e.key === 'Enter' || e.key === ' ') { if (selT >= 0) { sim.introduce(selT, Math.max(1, Math.round(P.mseeds))); announceIntro(selT); } } else return;
        e.preventDefault(); render.len = -1; updateMapInfo(); render();
      } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sim.introduce(Math.random(), Math.random()); render.len = -1; render(); }
    });
    const announceIntro = (i) => { els.live.textContent = t('intro_live', { n: L(geo().features[i].n) }); };
    const setCursorFromX = (clientX) => {
      const r = els.stack.getBoundingClientRect(), fs = 12, ml = fs * 3.3, pw = r.width - ml - 12;
      const tt = (clientX - r.left - ml) / pw * xmaxNow(); cursor = K.clamp(Math.round(tt / 0.5), 0, sim.h.t.length - 1); drawCharts(); updateReadout();
    };
    els.stack.addEventListener('pointermove', e => setCursorFromX(e.clientX));
    els.stack.addEventListener('pointerleave', () => { cursor = null; drawCharts(); updateReadout(); });
    els.stack.addEventListener('keydown', e => {
      const n = sim.h.t.length, cur = cursor == null ? n - 1 : cursor; let c = cur;
      if (e.key === 'ArrowLeft') c = cur - (e.shiftKey ? 10 : 1); else if (e.key === 'ArrowRight') c = cur + (e.shiftKey ? 10 : 1); else if (e.key === 'Home') c = 0; else if (e.key === 'End') c = n - 1; else if (e.key === 'Escape') { cursor = null; drawCharts(); updateReadout(); return; } else return;
      e.preventDefault(); cursor = K.clamp(c, 0, n - 1); drawCharts(); updateReadout();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && playing) { pause(); resumeOnVisible = true; } else if (!document.hidden && resumeOnVisible) { resumeOnVisible = false; play(); }
    });
    window.addEventListener('beforeunload', () => store.set('P2', serial()));
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(K.debounce(() => { if (sim) { render.len = -1; render(); } }, 60)); [els.world, els.stack, els.inc].forEach(c => ro.observe(c)); }
    else window.addEventListener('resize', K.debounce(() => { if (sim) { render.len = -1; render(); } }, 100));
    K.onLang(() => { renderStatic(); });
  }

  /* ================= arranque ================= */
  function boot() {
    Object.assign(els, { world: $('#world'), stack: $('#cv-stack'), inc: $('#cv-inc'), legend: $('#legend'), stats: $('#stats'), play: $('#btn-play'), ref: $('#btn-ref'), msg: $('#world-msg'),
      readout: $('#readout'), live: $('#live'), controls: $('#controls'), dirty: $('#dirty'), apply: $('#btn-apply'), banner: $('#challenge-banner'), results: $('#results'),
      ratio: $('#ratio'), mapinfo: $('#map-info') });
    Panels.init(host); wire();
    const fromUrl = readCfg();
    restoreP(fromUrl || store.get('P2', null));
    scenId = fromUrl ? (P.pid || 'measles') : store.get('scen', P.pid);
    if (scenId !== 'custom' && !Core.data.pathogens[scenId]) scenId = P.pid;
    const wanted = P.place;
    Promise.all(PLACES.filter(p => p !== 'abstract').map(ensureGeo).map(p => p.catch(() => null))).then(() => {
      if (!geoCache[wanted] && wanted !== 'abstract') P.place = 'abstract';
      prepareGeo(); if (isMap() && !geo().features.some(f => f.id === P.origin)) P.origin = defaultOrigin(geo());
      $('#map-panel').hidden = !isMap(); refreshDerive(); sim = makeSim(P);
      renderStatic(); restart(false); recomputeODE();
      Panels.renderPlaces();
    });
    window.__epi = { get sim() { return sim; }, get P() { return P; }, play, pause, stepDays, restart, setPlace, loadPathogen, loadChallenge, onControl, host, Core, fmtN, get bands() { return bands; }, runBands, hospCalc, get state() { return { playing, scenId, challenge, chalResult, mode: mode() }; } };
  }
  Core.load('data/').then(boot).catch(err => {
    console.error(err);
    $('#app').insertAdjacentHTML('afterbegin', `<div class="banner lose" role="alert">${K.esc(t('err_data'))}</div>`);
  });
})();
