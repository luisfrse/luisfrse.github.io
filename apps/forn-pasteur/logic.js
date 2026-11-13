'use strict';
/* Lògica pura del simulador de forn Pasteur / estufa Poupinel (esterilització per calor seca).
   Sense DOM: model tèrmic de la cambra i de la càrrega, màquina d'estats del cicle, validació de la càrrega,
   controls (físics, químics, biològics), decisió esperada i puntuació desglossada sobre 10.
   Tots els valors numèrics del model són ORIENTATIUS i didàctics (vegeu les constants). */
(function (root) {
  /* ---------- Constants del model (orientatives) ---------- */
  const AMB = 22;            /* °C ambient de la sala */
  const TOL = 1;             /* °C: la càrrega es considera «a temperatura» quan la sonda arriba a consigna − 1 °C */
  const SAFE_OPEN = 60;      /* °C: obertura segura (orientatiu, segons fabricant/protocol) */
  const HOT_OPEN = 80;       /* °C: per sobre, obrir és un error greu (cremades, xoc tèrmic del vidre) */
  const MAX_SAFE_T = 200;    /* °C: per sobre, deteriorament del material i risc de combustió (orientatiu) */
  const MIN_T = 160;         /* °C: temperatura mínima dels binomis validats del temari */
  const SHELF_W = 6;         /* amplada útil de cada reixeta (unitats de volum) */
  const SHELVES = 3;         /* reixetes: 0 superior, 1 central, 2 inferior; 3 = base de la cambra (incorrecte) */
  const CAP = SHELF_W * SHELVES;
  const OVERLOAD = 0.8;      /* no superar el 80 % de la capacitat */
  const CI_PASS = 0.9;       /* integrador químic intern: viratge complet si F ≥ 0,9 */
  const BI_KILL = 0.75;      /* indicador biològic: esporulació inactivada si F ≥ 0,75 (sobremort del cicle validat) */
  const EXT_TURN = 140;      /* indicador de procés extern (classe 1): vira quan l'envàs supera ≈140 °C */
  const SHELF_F = [0.95, 1.05, 0.95, 0.7];   /* factor de retard tèrmic per posició (la central és la més desfavorable) */
  const PROGRAMS = [
    { id: 'p180', T: 180, t: 30 },
    { id: 'p170', T: 170, t: 60 },
    { id: 'p160', T: 160, t: 120 }
  ];
  const PROT_ORDER = ['p160', 'p170', 'p180'];  /* prioritat quan la càrrega és mixta: el més restrictiu mana */

  /* Temps d'exposició necessari a una temperatura T (min). Coincideix exactament amb els binomis del temari
     (180 °C 30 min, 170 °C 60 min, 160 °C 120 min): el temps es duplica per cada 10 °C menys. */
  function reqTime(T) { return T < 150 ? Infinity : 30 * Math.pow(2, (180 - T) / 10); }
  /* Letalitat acumulada per minut a la temperatura T (fracció del cicle validat). Per sota de 150 °C no compta. */
  function lethRate(T) { return T < 150 ? 0 : 1 / reqTime(T); }
  function programOf(T, t) { const p = PROGRAMS.find(function (x) { return x.T === T && x.t === t; }); return p ? p.id : null; }
  function programById(id) { return PROGRAMS.find(function (x) { return x.id === id; }) || null; }

  /* ---------- Utilitats ---------- */
  function seeded(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const round1 = (x) => Math.round(x * 10) / 10;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  /* ---------- Protocol (programa esperat segons la càrrega) ---------- */
  /* Material apte i en condicions que s'ha de carregar. */
  function isLoadable(mat, cond) { return !!mat && mat.suit === 'ok' && (cond || 'ok') === 'ok'; }
  /* Programa que fixa el protocol (fictici, orientatiu) del centre per a un conjunt d'entrades de material. */
  function protocolFor(entries, cat) {
    let best = null;
    (entries || []).forEach(function (e) {
      const m = cat.mats[e.mat];
      if (!isLoadable(m, e.cond) || !m.prot) return;
      if (best === null || PROT_ORDER.indexOf(m.prot) < PROT_ORDER.indexOf(best)) best = m.prot;
    });
    return best || 'p180';
  }

  /* Converteix la llista compacta d'un escenari en entrades completes. preset = true: ja preparades i col·locades (diagnòstic). */
  function expandItems(items, cat, preset) {
    return (items || []).map(function (it, i) {
      const m = cat.mats[it.mat] || {};
      const e = { key: 'k' + i, mat: it.mat, cond: it.cond || 'ok', order: i, accepted: null, reason: null, pack: null, open: false, layer: null, ciExt: null, ciInt: null, label: false, shelf: null };
      if (m.ctrl) { e.accepted = false; }
      if (preset) {
        e.accepted = it.accepted === undefined ? true : it.accepted;
        e.pack = it.pack !== undefined ? it.pack : (m.packs ? m.packs[0] : null);
        e.open = it.open === undefined ? true : it.open;
        e.layer = it.layer || 'thin';
        e.ciExt = it.ciExt || 'dry';
        e.ciInt = it.ciInt || 'dry';
        e.label = it.label === undefined ? true : it.label;
        e.shelf = it.shelf === undefined ? 1 : it.shelf;
        if (m.ctrl) { e.pack = null; e.ciExt = null; e.ciInt = null; }
      }
      return e;
    });
  }

  /* ---------- Paràmetres ---------- */
  /* params = { T, t, mode: 'probe' | 'chamber' }. Retorna comprovacions amb pes i el resum. */
  function evalParams(params, expectedProg) {
    const T = Number(params.T), t = Number(params.t);
    const checks = [];
    const lethal = T >= MIN_T && t >= reqTime(T) - 1e-9;
    const prog = programOf(T, t);
    let binCode = null;
    if (T < MIN_T) binCode = 'p_tempLow';
    else if (T > MAX_SAFE_T) binCode = 'p_tempHigh';
    else if (!lethal) binCode = 'p_timeShort';
    checks.push({ cat: 'params', code: binCode || 'p_binomi', ok: !binCode, w: 2 });
    let protOk = false, protCode = 'p_protocol';
    if (!binCode) {
      if (!prog) protCode = t > reqTime(T) * 1.5 ? 'p_timeExcess' : 'p_nonStandard';
      else if (expectedProg && prog !== expectedProg) protCode = 'p_notProtocol';
      else protOk = true;
    } else protCode = 'p_protocolNA';
    checks.push({ cat: 'params', code: protOk ? 'p_protocol' : protCode, ok: protOk, w: 1, extra: { expected: expectedProg } });
    checks.push({ cat: 'params', code: params.mode === 'probe' ? 'p_modeProbe' : 'p_modeChamber', ok: params.mode === 'probe', w: 1 });
    return { checks: checks, lethal: lethal, prog: prog };
  }

  /* ---------- Disposició a la cambra ---------- */
  /* entries: [{ key, mat, accepted, shelf (0–3 o null), order }]. Les entrades de control (pcd, bi…) no ocupen volum. */
  function layout(entries, cat) {
    const shelves = [0, 1, 2, 3].map(function () { return { used: 0, keys: [], stacked: [] }; });
    const stacked = {};
    let vol = 0;
    const placed = (entries || []).filter(function (e) { return e.accepted && e.shelf !== null && e.shelf !== undefined; })
      .slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    placed.forEach(function (e) {
      const m = cat.mats[e.mat];
      const v = m ? (m.vol || 0) : 0;
      const sh = shelves[e.shelf];
      if (!sh) return;
      vol += v;
      if (e.shelf < SHELVES && v > 0 && sh.used + v > SHELF_W) { stacked[e.key] = true; sh.stacked.push(e.key); }
      else sh.used += v;
      sh.keys.push(e.key);
    });
    const full = [0, 1, 2].filter(function (i) { return shelves[i].used >= SHELF_W; });
    return { shelves: shelves, stacked: stacked, vol: vol, occ: vol / CAP, overload: vol / CAP > OVERLOAD + 1e-9, full: full };
  }

  /* ---------- Avaluació de la preparació (càrrega i envasat) ---------- */
  /* Comprovacions d'una entrada de material. lay = layout(); sc = escenari (per a «later»). */
  function evalEntry(e, cat, lay, ctx) {
    const m = cat.mats[e.mat];
    const checks = [];
    const safety = [];
    const ck = (code, ok, w) => checks.push({ cat: 'load', code: code, ok: !!ok, w: w || 1, item: e.key });
    if (!m) return { checks: checks, safety: safety };
    if (m.ctrl) return evalControlEntry(e, m, ctx, checks);
    const cond = e.cond || 'ok';
    const shouldReject = !isLoadable(m, cond);
    if (e.accepted === null || e.accepted === undefined) { ck('l_undecided', false, 2); return { checks: checks, safety: safety }; }
    if (shouldReject) {
      if (e.accepted) {
        const code = cond !== 'ok' ? 'l_cond_' + cond : 'l_mat_' + m.suit;
        ck(code, false, 3);
        if (m.suit === 'flam' && e.shelf !== null && e.shelf !== undefined) safety.push('s_flammable');
        if (m.kind === 'liquid' && e.shelf !== null && e.shelf !== undefined) safety.push('s_liquid');
        return { checks: checks, safety: safety };
      }
      const reasons = cond !== 'ok' ? ['wash'] : (m.reject || []);
      ck('l_rejectOk', true, 2);
      ck(reasons.indexOf(e.reason) >= 0 ? 'l_reasonOk' : 'l_reasonBad', reasons.indexOf(e.reason) >= 0, 1);
      return { checks: checks, safety: safety };
    }
    if (!e.accepted) {
      const ok = e.reason === 'later' && ctx && ctx.mustSplit;
      ck(ok ? 'l_laterOk' : (e.reason === 'later' ? 'l_laterNo' : 'l_rejectedApt'), ok, 2);
      return { checks: checks, safety: safety };
    }
    /* material apte i acceptat */
    const pk = cat.packs[e.pack];
    let pcode = 'l_packOk';
    if (!pk) pcode = 'l_packMissing';
    else if (pk.mixed) pcode = 'l_packMixed';
    else if (pk.burn) pcode = 'l_packBurn';
    else if (pk.melt) pcode = 'l_packMelt';
    else if (pk.id === 'none') pcode = 'l_packNone';
    else if (pk.notValid) pcode = 'l_packNotValid';
    else if ((m.packs || []).indexOf(pk.id) < 0) pcode = 'l_packMismatch';
    ck(pcode, pcode === 'l_packOk', 2);
    if (m.artic) ck(e.open ? 'l_openOk' : 'l_closed', !!e.open, 1);
    if (m.kind === 'oil' || m.kind === 'powder') ck(e.layer === 'thin' ? 'l_thinOk' : 'l_thick', e.layer === 'thin', 1);
    ck(e.ciExt === 'dry' ? 'l_ciExtOk' : 'l_ciExt_' + (e.ciExt || 'none'), e.ciExt === 'dry', 1);
    ck(e.ciInt === 'dry' ? 'l_ciIntOk' : 'l_ciInt_' + (e.ciInt || 'none'), e.ciInt === 'dry', 1);
    ck(e.label ? 'l_labelOk' : 'l_noLabel', !!e.label, 1);
    if (e.shelf === null || e.shelf === undefined) ck('l_notPlaced', false, 2);
    else {
      ck(e.shelf === 3 ? 'l_floor' : 'l_shelfOk', e.shelf !== 3, 1);
      ck(lay.stacked[e.key] ? 'l_stacked' : 'l_notStacked', !lay.stacked[e.key], 1);
    }
    return { checks: checks, safety: safety };
  }
  /* Elements de control: pcd (paquet de control amb integrador), bi (B. atrophaeus), biWrong (G. stearothermophilus), biCtrl (control positiu). */
  function evalControlEntry(e, m, ctx, checks) {
    const ck = (code, ok, w) => checks.push({ cat: 'load', code: code, ok: !!ok, w: w || 1, item: e.key });
    const inOven = e.accepted && e.shelf !== null && e.shelf !== undefined;
    if (m.ctrl === 'pcd') {
      if (!inOven) ck('l_pcdMissing', false, 1);
      else ck(e.shelf === 1 ? 'l_pcdOk' : 'l_pcdPos', e.shelf === 1, 1);
    } else if (m.ctrl === 'bi') {
      if (ctx && ctx.needBI) {
        if (!inOven) ck('l_biMissing', false, 2);
        else ck(e.shelf === 1 ? 'l_biOk' : 'l_biPos', e.shelf === 1, 2);
      }
    } else if (m.ctrl === 'biWrong') {
      ck(inOven ? 'l_biWrong' : 'l_biWrongOk', !inOven, 1);
    } else if (m.ctrl === 'biCtrl') {
      if (ctx && ctx.needBI) ck(inOven ? 'l_ctrlInOven' : 'l_ctrlKept', !inOven, 1);
      else if (inOven) ck('l_ctrlInOven', false, 1);
    }
    return { checks: checks, safety: [] };
  }
  /* Context de la càrrega: cal dividir-la en dos cicles? cal indicador biològic? */
  function loadContext(entries, cat, scen) {
    let vol = 0;
    (entries || []).forEach(function (e) { const m = cat.mats[e.mat]; if (m && !m.ctrl && isLoadable(m, e.cond)) vol += m.vol || 0; });
    return { mustSplit: vol > CAP * OVERLOAD + 1e-9, needBI: !!(scen && scen.bi), aptVol: vol };
  }
  function evalLoad(entries, cat, scen) {
    const lay = layout(entries, cat);
    const ctx = loadContext(entries, cat, scen);
    let checks = [], safety = [];
    (entries || []).forEach(function (e) { const r = evalEntry(e, cat, lay, ctx); checks = checks.concat(r.checks); safety = safety.concat(r.safety); });
    checks.push({ cat: 'load', code: lay.overload ? 'l_overload' : 'l_capOk', ok: !lay.overload, w: 3 });
    lay.full.forEach(function (i) { checks.push({ cat: 'load', code: 'l_fullShelf', ok: false, w: 1, extra: { shelf: i } }); });
    return { checks: checks, safety: uniq(safety), layout: lay, ctx: ctx };
  }

  /* ---------- Model tèrmic ---------- */
  /* Construeix els paràmetres tèrmics de la càrrega a partir de les entrades col·locades. */
  function thermalLoad(entries, cat, faults) {
    faults = faults || {};
    const lay = layout(entries, cat);
    let mass = 0;
    const items = [];
    (entries || []).forEach(function (e) {
      if (!e.accepted || e.shelf === null || e.shelf === undefined) return;
      const m = cat.mats[e.mat];
      if (!m) return;
      mass += m.mass || 0;
      let kf = m.kf || 1;
      if ((m.kind === 'oil' || m.kind === 'powder') && e.layer !== 'thin') kf *= 2.6;
      if (lay.stacked[e.key]) kf *= 1.6;
      if (e.pack === 'none') kf *= 0.85;
      kf *= SHELF_F[e.shelf] || 1;
      if (faults.centreLag && e.shelf === 1) kf *= faults.centreLag;
      items.push({ key: e.key, kf: kf, shelf: e.shelf, ctrl: m.ctrl || null });
    });
    let tau = 6 + 0.9 * mass;
    if (lay.overload) tau *= 1.4;
    if (lay.full.length) tau *= 1.1;
    if (faults.fanFail) tau *= 1.6;
    return { tau: tau, mass: mass, items: items, layout: lay };
  }

  /* ---------- Forn: màquina d'estats ---------- */
  /* Fases: idle → heat (escalfament) → equil (estabilització: la càrrega arriba a temperatura) → expo (exposició) → cool (refredament) → end.
     abort: aturada (manual, emergència o alarma). Els valors «display» inclouen la desviació d'un termòstat descalibrat (avaria). */
  function createOven(load, faults) {
    load = load || { tau: 8, mass: 0, items: [] };
    faults = faults || {};
    return {
      t: 0, Tc: AMB, Tp: AMB, Fp: 0, set: 180, expo: 30, mode: 'probe', phase: 'idle', door: 'closed', heater: false,
      count: 0, phaseT0: 0, started: false, startT: null, endT: null, aborted: false, abortWhy: null, emergency: false,
      tau: load.tau, mass: load.mass || 0, faults: faults,
      items: (load.items || []).map(function (i) { return { key: i.key, kf: i.kf, ctrl: i.ctrl || null, shelf: i.shelf, T: AMB, F: 0, Tmax: AMB }; }),
      events: [], series: [], nextSample: 0, doorOpens: [], expoMin: null, expoMax: null, resetPending: false, powerCut: null,
      interruptions: 0
    };
  }
  function disp(st, T) { return T + (st.faults.offset || 0); }
  function ev(st, type, data) { const e = { t: round1(st.t), type: type, Tc: round1(disp(st, st.Tc)), Tp: round1(disp(st, st.Tp)) }; if (data) e.data = data; st.events.push(e); return e; }
  function setParams(st, p) {
    if (st.started) return false;
    if (p.T !== undefined) st.set = Number(p.T);
    if (p.t !== undefined) st.expo = Number(p.t);
    if (p.mode) st.mode = p.mode;
    return true;
  }
  function isRunning(st) { return st.phase === 'heat' || st.phase === 'equil' || st.phase === 'expo'; }
  function start(st) {
    if (st.started || st.door !== 'closed') return false;
    st.started = true; st.startT = st.t; st.phase = 'heat'; st.phaseT0 = st.t; st.heater = true;
    ev(st, 'start', { set: st.set, expo: st.expo, mode: st.mode });
    sample(st, true);
    return true;
  }
  function stop(st, emergency) {
    if (!isRunning(st)) return false;
    st.heater = false; st.aborted = true; st.abortWhy = emergency ? 'emergency' : 'manual'; st.emergency = !!emergency;
    st.phase = 'abort'; st.phaseT0 = st.t;
    ev(st, emergency ? 'emergency' : 'stop');
    return true;
  }
  function alarm(st, why) {
    st.heater = false; st.aborted = true; st.abortWhy = why; st.phase = 'abort'; st.phaseT0 = st.t;
    ev(st, 'alarm', { why: why });
  }
  function openDoor(st) {
    if (st.door === 'open') return null;
    st.door = 'open';
    const info = { phase: st.phase, Tc: round1(disp(st, st.Tc)), Tp: round1(disp(st, st.Tp)), t: round1(st.t), hot: Math.max(st.Tc, st.Tp) };
    st.doorOpens.push(info);
    if (isRunning(st)) st.interruptions++;
    ev(st, 'doorOpen', { phase: st.phase });
    return info;
  }
  function closeDoor(st) { if (st.door === 'closed') return false; st.door = 'closed'; ev(st, 'doorClose'); return true; }
  function sample(st, force) {
    if (force || st.t >= st.nextSample - 1e-9) {
      st.series.push({ t: round1(st.t), c: round1(disp(st, st.Tc)), p: round1(disp(st, st.Tp)), ph: st.phase });
      st.nextSample = Math.floor(st.t / 0.5 + 1e-9) * 0.5 + 0.5;
    }
  }
  /* Avança el model dt minuts (subpassos de 0,05 min). */
  function step(st, dt) {
    let left = dt;
    while (left > 1e-9) {
      const h = Math.min(0.05, left);
      sub(st, h);
      left -= h;
    }
  }
  function sub(st, h) {
    const f = st.faults;
    st.t += h;
    const off = f.offset || 0;
    const target = st.set - off;
    const maxEff = f.maxT ? f.maxT : 300;
    const cut = st.powerCut && st.t >= st.powerCut.at && st.t < st.powerCut.at + st.powerCut.dur;
    if (st.powerCut && !st.powerCut.logged && st.t >= st.powerCut.at && st.started) { st.powerCut.logged = true; st.interruptions++; ev(st, 'powerCut', { dur: st.powerCut.dur }); }
    /* cambra */
    if (st.door === 'open') st.Tc += (AMB - st.Tc) * (h / 4);
    else if (st.heater && !cut) {
      const rate = 9 / (1 + 0.04 * st.mass) * Math.max(0, (maxEff - st.Tc) / (maxEff - AMB));
      if (st.Tc < target) st.Tc = Math.min(target, st.Tc + rate * h);
      else st.Tc = Math.max(target, st.Tc + (AMB - st.Tc) * (h / 45));
    } else st.Tc += (AMB - st.Tc) * (h / 45);
    /* càrrega */
    const tauEff = st.tau * (st.door === 'open' ? 0.7 : 1);
    st.Tp += (st.Tc - st.Tp) * (h / tauEff);
    st.Fp += h * lethRate(st.Tp);
    st.items.forEach(function (it) {
      it.T += (st.Tc - it.T) * (h / (tauEff * it.kf));
      it.F += h * lethRate(it.T);
      if (it.T > it.Tmax) it.Tmax = it.T;
    });
    /* control */
    const dc = disp(st, st.Tc), dp = disp(st, st.Tp);
    if (st.phase === 'heat') {
      if (dc >= st.set - 0.5 && st.door === 'closed') {
        if (!st.reachedOnce) { st.reachedOnce = true; ev(st, 'chamberReached'); }
        if (st.mode === 'chamber') { st.phase = 'expo'; st.phaseT0 = st.t; if (!st.noResetStarted) st.count = 0; ev(st, 'expoStart'); }
        else { st.phase = 'equil'; st.phaseT0 = st.t; }
      } else if (st.t - st.phaseT0 > 120) alarm(st, 'heatFail');
    } else if (st.phase === 'equil') {
      if (dp >= st.set - TOL && st.door === 'closed') { st.phase = 'expo'; st.phaseT0 = st.t; st.count = 0; ev(st, 'loadReached'); ev(st, 'expoStart'); }
      else if (dc < st.set - 0.5) { st.phase = 'heat'; st.phaseT0 = st.t; }
      else if (st.t - st.phaseT0 > 180) alarm(st, 'equilFail');
    } else if (st.phase === 'expo') {
      const ref = st.mode === 'probe' ? dp : dc;
      const ok = ref >= st.set - TOL && st.door === 'closed';
      if (ok || f.noReset) {
        st.count += h;
        st.expoMin = st.expoMin === null ? dc : Math.min(st.expoMin, dc);
        st.expoMax = st.expoMax === null ? dc : Math.max(st.expoMax, dc);
        if (f.noReset) st.noResetStarted = true;
      } else {
        ev(st, 'expoReset', { done: round1(st.count) });
        st.count = 0; st.phase = dc < st.set - 0.5 ? 'heat' : 'equil'; st.phaseT0 = st.t;
      }
      if (st.count >= st.expo - 1e-9) { st.phase = 'cool'; st.phaseT0 = st.t; st.heater = false; ev(st, 'expoEnd', { done: round1(st.count) }); }
    } else if (st.phase === 'cool') {
      if (Math.max(disp(st, st.Tc), disp(st, st.Tp)) <= SAFE_OPEN) { st.phase = 'end'; st.endT = st.t; ev(st, 'cycleEnd'); }
    } else if (st.phase === 'abort') {
      if (!st.abortCooled && Math.max(disp(st, st.Tc), disp(st, st.Tp)) <= SAFE_OPEN) { st.abortCooled = true; st.endT = st.t; ev(st, 'abortCooled'); }
    }
    if (st.started) sample(st);
  }
  /* Executa un cicle complet de manera automàtica (escenaris de diagnòstic i tests).
     script: [{ when: 'expo'|'heat'|…, after: minuts dins de la fase o del comptatge, action: 'open'|'stop'|'emergency', dur }] */
  function runCycle(load, faults, params, script, opts) {
    opts = opts || {};
    const st = createOven(load, faults);
    setParams(st, params);
    if (faults && faults.powerCut) st.powerCut = { at: faults.powerCut.at, dur: faults.powerCut.dur };
    start(st);
    const todo = (script || []).map(function (s) { return Object.assign({ done: false }, s); });
    let guard = 0;
    while (guard++ < 20000) {
      step(st, 0.25);
      todo.forEach(function (s) {
        if (s.done) return;
        const inPhase = st.phase === s.when;
        const progress = s.when === 'expo' ? st.count : st.t - st.phaseT0;
        if (inPhase && progress >= (s.after || 0)) {
          s.done = true;
          if (s.action === 'open') { openDoor(st); s.closeAt = st.t + (s.dur || 1); }
          else if (s.action === 'stop') stop(st, false);
          else if (s.action === 'emergency') stop(st, true);
        }
        if (s.closeAt !== undefined && st.t >= s.closeAt && st.door === 'open') { closeDoor(st); s.closeAt = undefined; }
      });
      todo.forEach(function (s) { if (s.closeAt !== undefined && st.t >= s.closeAt && st.door === 'open') { closeDoor(st); s.closeAt = undefined; } });
      if (st.phase === 'end' || (st.phase === 'abort' && st.abortCooled)) break;
      if (opts.until && opts.until(st)) break;
    }
    return st;
  }

  /* ---------- Control físic (lectura del registre) ---------- */
  /* Tram continu més llarg de la fase d'exposició amb la sonda de càrrega a temperatura (consigna − 1 °C).
     És el que l'operador ha de llegir al registre: el temps real que TOTA la càrrega ha estat a temperatura. */
  function longestAtTemp(st) {
    let best = 0, cur = 0, prev = null;
    const thr = st.set - TOL;
    st.series.forEach(function (s) {
      if (prev !== null) {
        if (s.ph === 'expo' && prev.ph === 'expo' && s.p >= thr && prev.p >= thr) cur += s.t - prev.t;
        else cur = 0;
        if (cur > best) best = cur;
      }
      prev = s;
    });
    return round1(best);
  }
  function physical(st) {
    const causes = [];
    const req = reqTime(st.set);
    const stretch = longestAtTemp(st);
    const opened = st.doorOpens.some(function (d) { return d.phase === 'heat' || d.phase === 'equil' || d.phase === 'expo'; });
    if (st.aborted) causes.push(st.abortWhy === 'heatFail' || st.abortWhy === 'equilFail' ? 'k_tempLow' : 'k_aborted');
    if (st.set < MIN_T) causes.push('k_tempLow');
    else if (st.expo < req - 1e-9) causes.push('k_timeShort');
    const short = !(stretch >= Math.min(req, st.expo) - 0.6);
    const interrupted = opened || st.interruptions > 0;
    if (short && !st.aborted && st.set >= MIN_T) {
      if (interrupted) causes.push('k_interrupt');
      if (st.mode === 'chamber') causes.push('k_chamberCount');
      if (!causes.length) causes.push('k_timeShort');
    }
    const valid = !st.aborted && st.started && st.set >= MIN_T && st.expo >= req - 1e-9 && !short && (st.phase === 'end' || st.phase === 'cool');
    return { valid: valid && !causes.length, causes: uniq(causes), stretch: stretch, req: req, interrupted: interrupted };
  }

  /* ---------- Resultat de la càrrega: indicadors, danys, biològic ---------- */
  function damageOf(m, pk, Tmax, cond) {
    if (!m) return null;
    if (m.kind === 'flam' && Tmax >= 60) return 'fire';
    if (m.kind === 'liquid' && Tmax >= 100) return 'boil';
    if ((m.kind === 'plastic' || m.kind === 'single' || (pk && pk.melt)) && Tmax >= 120) return 'melt';
    if (m.kind === 'rubber' && Tmax >= 120) return 'rubber';
    if (m.kind === 'optic' && Tmax >= 100) return 'optic';
    if ((m.kind === 'textile' || (pk && pk.burn)) && Tmax >= 160) return Tmax >= 200 ? 'burn' : 'scorch';
    if (m.kind === 'glass' && cond === 'wet' && Tmax >= 120) return 'crack';
    return null;
  }
  /* Resultat per paquet, PCD i BI. unload = { openTemp, epi }; force = forçats d'escenari ({ bi:'pos', ctrlDead:true }). */
  function outcome(st, entries, cat, unload, force) {
    force = force || {};
    unload = unload || {};
    const byKey = {};
    st.items.forEach(function (it) { byKey[it.key] = it; });
    const pk = [];
    let pcd = null, bi = null, biWrong = false;
    const openHot = unload.openTemp !== undefined && unload.openTemp > HOT_OPEN;
    (entries || []).forEach(function (e) {
      const it = byKey[e.key];
      if (!it) return;
      const m = cat.mats[e.mat];
      if (m.ctrl === 'pcd') { pcd = { F: it.F, progress: clamp01(it.F / CI_PASS), pass: it.F >= CI_PASS }; return; }
      if (m.ctrl === 'bi') { bi = { F: it.F }; return; }
      if (m.ctrl === 'biWrong') { biWrong = true; return; }
      if (m.ctrl) return;
      const pack = cat.packs[e.pack];
      let damage = damageOf(m, pack, it.Tmax, e.cond);
      if (!damage && m.kind === 'glass' && openHot) damage = 'crack';
      const ext = e.ciExt === 'dry' ? (it.Tmax >= EXT_TURN ? 'turned' : 'unturned') : (e.ciExt === 'steam' ? 'invalid' : 'none');
      const intP = e.ciInt === 'dry' ? clamp01(it.F / CI_PASS) : null;
      const conform = ext === 'turned' && !damage && !!e.label && (!pack || (!pack.burn && !pack.melt && pack.id !== 'none'));
      pk.push({ key: e.key, mat: e.mat, F: it.F, Tmax: it.Tmax, ext: ext, ciInt: e.ciInt, intProgress: intP, intPass: e.ciInt === 'dry' ? it.F >= CI_PASS : null, damage: damage, label: !!e.label, pack: e.pack, conform: conform });
    });
    if (force.pcd === 'fail' && pcd) { pcd.pass = false; pcd.progress = Math.min(pcd.progress, 0.6); }
    return { packages: pk, pcd: pcd, bi: bi, biWrong: biWrong, phys: physical(st), forceBI: force.bi || null, ctrlDead: !!force.ctrlDead };
  }
  /* Lectura del biològic després d'incubar: incub = '30' (30–37 °C, correcte per a B. atrophaeus) | '56' | 'room'. */
  function biRead(o, incub) {
    if (!o || !o.bi) return null;
    const rightT = incub === '30';
    let testGrowth = o.forceBI === 'pos' ? true : (o.forceBI === 'neg' ? false : o.bi.F < BI_KILL);
    const ctrlGrowth = rightT && !o.ctrlDead;
    if (!rightT) testGrowth = false;
    if (o.biWrong) return { test: testGrowth, control: ctrlGrowth, verdict: 'invalid', why: 'organism' };
    const verdict = !ctrlGrowth ? 'invalid' : (testGrowth ? 'pos' : 'neg');
    return { test: testGrowth, control: ctrlGrowth, verdict: verdict, why: !rightT ? 'incubT' : (!ctrlGrowth ? 'control' : null) };
  }

  /* Escenari de diagnòstic: munta la càrrega, executa el cicle amb les avaries/errors definits i en calcula el resultat. */
  function buildDiag(scen, variant, cat) {
    const v = Object.assign({}, scen.base || {}, variant || {});
    const entries = expandItems(v.items, cat, true);
    const faults = Object.assign({}, v.faults || {});
    const load = thermalLoad(entries, cat, faults);
    const st = runCycle(load, faults, v.params || { T: 180, t: 30, mode: 'probe' }, v.script || []);
    const o = outcome(st, entries, cat, { openTemp: SAFE_OPEN - 5 }, v.force || {});
    return { entries: entries, oven: st, outcome: o, v: v };
  }

  /* ---------- Decisió esperada ---------- */
  /* biVerdict = 'pos' | 'neg' | 'invalid' | null */
  function expectedDecision(o, biVerdict, scen) {
    scen = scen || {};
    let req = [], forb = [];
    const pcdFail = o.pcd ? !o.pcd.pass : false;
    const loadFail = !o.phys.valid || pcdFail;
    const nonconf = o.packages.filter(function (p) { return !p.conform; }).length;
    const damage = o.packages.some(function (p) { return !!p.damage; });
    if (biVerdict === 'pos') { req = ['recall', 'outService', 'notify', 'reprocess', 'register']; forb = ['release', 'partial']; }
    else if (loadFail) {
      req = ['reprocess', 'register']; forb = ['release', 'partial'];
      if (scen.equip) req.push('outService', 'notify');
    } else if (nonconf > 0) {
      if (nonconf === o.packages.length) { req = ['reprocess', 'register']; forb = ['release', 'partial']; }
      else { req = ['partial', 'register']; forb = ['release']; }
    } else if (biVerdict === 'invalid') {
      /* càrrega correcta (físic i químic), però la prova biològica no és interpretable: l'alliberament queda a criteri del protocol */
      req = ['repeatBI', 'register']; forb = ['recall', 'outService'];
    } else { req = ['release', 'register']; forb = ['reprocess', 'recall', 'outService']; }
    if (damage) req.push('discardItems');
    if (biVerdict === 'invalid' && req.indexOf('repeatBI') < 0) { req.push('repeatBI'); forb.push('recall'); }
    if (scen.recordIncomplete) { req.push('fixRecord'); }
    const unsafe = biVerdict === 'pos' || loadFail || (nonconf > 0 && nonconf === o.packages.length);
    return { req: uniq(req), forb: uniq(forb).filter(function (x) { return req.indexOf(x) < 0; }), unsafe: unsafe, loadFail: loadFail, nonconf: nonconf };
  }
  function evalDecision(chosen, exp) {
    chosen = chosen || [];
    const checks = [];
    exp.req.forEach(function (r) { checks.push({ cat: 'dec', code: chosen.indexOf(r) >= 0 ? 'd_ok' : 'd_missing', ok: chosen.indexOf(r) >= 0, w: 1, extra: { opt: r } }); });
    exp.forb.forEach(function (r) { if (chosen.indexOf(r) >= 0) checks.push({ cat: 'dec', code: 'd_wrong', ok: false, w: 1, extra: { opt: r } }); });
    const safety = [];
    if (exp.unsafe && (chosen.indexOf('release') >= 0 || chosen.indexOf('partial') >= 0)) safety.push('s_releaseUnsafe');
    return { checks: checks, safety: safety };
  }

  /* ---------- Controls: avaluació de la interpretació de l'alumne ---------- */
  /* ans = { phys: 'ok'|'bad', cause, pkgs: {key: 'ok'|'nc'}, pcd: 'pass'|'fail', incub, bi: 'neg'|'pos'|'invalid' } */
  function evalControls(o, ans, biRes, opts) {
    opts = opts || {};
    ans = ans || {};
    const checks = [];
    const physOk = o.phys.valid;
    checks.push({ cat: 'ctrl', code: (ans.phys === 'ok') === physOk && ans.phys ? 'c_physOk' : 'c_physBad', ok: !!ans.phys && (ans.phys === 'ok') === physOk, w: 2, extra: { valid: physOk } });
    if (!opts.noCause && !physOk) {
      const okCause = o.phys.causes.indexOf(ans.cause) >= 0;
      checks.push({ cat: 'ctrl', code: okCause ? 'c_causeOk' : 'c_causeBad', ok: okCause, w: 1, extra: { causes: o.phys.causes } });
    }
    const n = o.packages.length;
    o.packages.forEach(function (p) {
      const a = (ans.pkgs || {})[p.key];
      const ok = !!a && (a === 'ok') === p.conform;
      checks.push({ cat: 'ctrl', code: ok ? 'c_pkgOk' : 'c_pkgBad', ok: ok, w: n ? 2 / n : 0, item: p.key, extra: { conform: p.conform } });
    });
    if (o.pcd) {
      const ok = !!ans.pcd && (ans.pcd === 'pass') === o.pcd.pass;
      checks.push({ cat: 'ctrl', code: ok ? 'c_pcdOk' : 'c_pcdBad', ok: ok, w: 1, extra: { pass: o.pcd.pass } });
    }
    if (biRes) {
      checks.push({ cat: 'ctrl', code: ans.incub === '30' ? 'c_incubOk' : 'c_incubBad', ok: ans.incub === '30', w: 1 });
      checks.push({ cat: 'ctrl', code: ans.bi === biRes.verdict ? 'c_biOk' : 'c_biBad', ok: ans.bi === biRes.verdict, w: 2, extra: { verdict: biRes.verdict } });
    }
    return { checks: checks };
  }

  /* ---------- Procediment ---------- */
  /* proc = { pre: [ids], post: [ids], epi, openTemp, interruptChoice: 'f'|'p'|'w'|null, openedDuring: bool } */
  function evalProcedure(proc, cat, scen) {
    proc = proc || {};
    const checks = [], safety = [];
    (cat.preChecks || []).forEach(function (c) {
      const on = (proc.pre || []).indexOf(c.id) >= 0;
      checks.push({ cat: 'proc', code: c.ok ? (on ? 'pr_preOk' : 'pr_preMissing') : (on ? 'pr_preWrong' : 'pr_preAvoid'), ok: c.ok ? on : !on, w: 0.5, extra: { id: c.id } });
    });
    if (scen && scen.interrupt) {
      const ch = proc.interruptChoice;
      checks.push({ cat: 'proc', code: ch === 'f' ? 'pr_intOk' : (ch === 'p' ? 'pr_intPart' : 'pr_intBad'), ok: ch === 'f', w: 2, score: ch === 'f' ? 1 : (ch === 'p' ? 0.5 : 0) });
    }
    checks.push({ cat: 'proc', code: proc.openedDuring ? 'pr_openedDuring' : 'pr_doorOk', ok: !proc.openedDuring, w: 2 });
    const T = proc.openTemp;
    if (T === undefined || T === null) checks.push({ cat: 'proc', code: 'pr_noUnload', ok: false, w: 2 });
    else if (T <= SAFE_OPEN) checks.push({ cat: 'proc', code: 'pr_coolOk', ok: true, w: 2 });
    else { checks.push({ cat: 'proc', code: T > HOT_OPEN ? 'pr_openHot' : 'pr_openWarm', ok: false, w: 2, extra: { T: round1(T) } }); if (T > HOT_OPEN) safety.push('s_openHot'); }
    const epiOk = proc.epi === 'thermal';
    checks.push({ cat: 'proc', code: epiOk ? 'pr_epiOk' : 'pr_epi_' + (proc.epi || 'none'), ok: epiOk, w: 1 });
    if (!epiOk && T !== undefined && T !== null && T > 40) safety.push('s_noEPI');
    (cat.postChecks || []).forEach(function (c) {
      const on = (proc.post || []).indexOf(c.id) >= 0;
      checks.push({ cat: 'proc', code: c.ok ? (on ? 'pr_postOk' : 'pr_postMissing') : (on ? 'pr_postWrong' : 'pr_postAvoid'), ok: c.ok ? on : !on, w: 0.5, extra: { id: c.id } });
    });
    return { checks: checks, safety: uniq(safety) };
  }

  /* ---------- Puntuació ---------- */
  const WEIGHTS = {
    prep: { load: 30, params: 15, proc: 20, ctrl: 15, dec: 20 },
    diag: { params: 20, ctrl: 45, dec: 35 }
  };
  /* Penalitzacions de seguretat (punts sobre 10) i límits. annul = escenari anul·lat (0). */
  const SAFETY = {
    s_flammable: { annul: true },
    s_openHot: { pen: 3 },
    s_noEPI: { pen: 1 },
    s_liquid: { pen: 1 },
    s_releaseUnsafe: { cap: 3 }
  };
  function catScore(checks, cat) {
    let w = 0, s = 0;
    checks.forEach(function (c) { if (c.cat !== cat) return; w += c.w; s += c.w * (c.score !== undefined ? c.score : (c.ok ? 1 : 0)); });
    return w > 0 ? s / w : null;
  }
  /* Combina comprovacions i seguretat en una nota de l'escenari (0–10) amb desglossament. */
  function scoreChecks(type, checks, safety) {
    const W = WEIGHTS[type] || WEIGHTS.prep;
    const cats = {};
    let tw = 0, ts = 0;
    Object.keys(W).forEach(function (k) {
      const f = catScore(checks, k);
      cats[k] = { f: f, w: W[k] };
      if (f !== null) { tw += W[k]; ts += W[k] * f; }
    });
    let score = tw > 0 ? 10 * ts / tw : 0;
    const raw = round1(score);
    let pen = 0, cap = 10, annul = false;
    uniq(safety || []).forEach(function (s) { const r = SAFETY[s]; if (!r) return; if (r.pen) pen += r.pen; if (r.cap !== undefined) cap = Math.min(cap, r.cap); if (r.annul) annul = true; });
    score = annul ? 0 : Math.min(cap, score - pen);
    score = Math.max(0, Math.min(10, round1(score)));
    return { score10: score, raw10: raw, cats: cats, penalty: pen, cap: cap < 10 ? cap : null, annulled: annul, safety: uniq(safety || []) };
  }
  /* Puntuació completa d'un escenari de preparació. rec = { entries, params, proc, ans, decision, unload, oven(st), biRes } */
  function scorePrep(scen, rec, cat) {
    const lo = evalLoad(rec.entries, cat, scen);
    const expProg = protocolFor(rec.entries, cat);
    const pa = evalParams(rec.params || {}, expProg);
    const pr = evalProcedure(rec.proc, cat, scen);
    let checks = lo.checks.concat(pa.checks, pr.checks);
    let safety = lo.safety.concat(pr.safety);
    const o = rec.outcome;
    let exp = null;
    if (o) {
      const ct = evalControls(o, rec.ans, rec.biRes);
      exp = expectedDecision(o, rec.biRes ? rec.biRes.verdict : null, scen);
      const de = evalDecision(rec.decision, exp);
      checks = checks.concat(ct.checks, de.checks);
      safety = safety.concat(de.safety);
    } else {
      checks.push({ cat: 'ctrl', code: 'c_notDone', ok: false, w: 1 });
      checks.push({ cat: 'dec', code: 'd_notDone', ok: false, w: 1 });
    }
    const flamStarted = safety.indexOf('s_flammable') >= 0 && rec.oven && rec.oven.started;
    if (!flamStarted) safety = safety.filter(function (s) { return s !== 's_flammable'; });
    const sc = scoreChecks('prep', checks, safety);
    sc.checks = checks; sc.expected = exp; sc.expProg = expProg;
    return sc;
  }
  /* Escenari de diagnòstic: rec = { ans, cause, decision }, o = outcome precalculat, biRes si escau. */
  function scoreDiag(scen, rec, o, biRes) {
    const ct = evalControls(o, rec.ans, biRes, { noCause: true });
    const causeOk = (scen.causes || []).indexOf(rec.cause) >= 0;
    const checks = ct.checks.concat([{ cat: 'params', code: causeOk ? 'g_causeOk' : 'g_causeBad', ok: causeOk, w: 1, extra: { causes: scen.causes } }]);
    const exp = expectedDecision(o, biRes ? biRes.verdict : null, scen);
    const de = evalDecision(rec.decision, exp);
    const sc = scoreChecks('diag', checks.concat(de.checks), de.safety);
    sc.checks = checks.concat(de.checks); sc.expected = exp;
    return sc;
  }

  /* ---------- Sessió d'examen ---------- */
  /* Tria 2 escenaris de preparació i 3 de diagnòstic (com a mínim un de biològic i un de paràmetres físics). */
  function pickExam(scens, rng, nPrep, nDiag) {
    rng = rng || Math.random;
    nPrep = nPrep === undefined ? 2 : nPrep; nDiag = nDiag === undefined ? 3 : nDiag;
    const prep = shuffle(scens.filter(function (s) { return s.type === 'prep' && !s.free; }), rng);
    const diag = shuffle(scens.filter(function (s) { return s.type === 'diag'; }), rng);
    const out = [];
    /* preparació: una de nivell bàsic i una altra de més exigent */
    const basic = prep.find(function (s) { return s.level <= 1; });
    if (basic) out.push(basic);
    prep.forEach(function (s) { if (out.length < nPrep && out.indexOf(s) < 0 && (!basic || s.level >= 2)) out.push(s); });
    prep.forEach(function (s) { if (out.length < nPrep && out.indexOf(s) < 0) out.push(s); });
    const d = [];
    const biD = diag.find(function (s) { return (s.tags || []).indexOf('bi') >= 0; });
    if (biD) d.push(biD);
    const phD = diag.find(function (s) { return (s.tags || []).indexOf('phys') >= 0 && d.indexOf(s) < 0; });
    if (phD && d.length < nDiag) d.push(phD);
    diag.forEach(function (s) { if (d.length < nDiag && d.indexOf(s) < 0) d.push(s); });
    const ordered = [];
    const pd = out.slice(0, nPrep).sort(function (a, b) { return a.level - b.level; });
    const dd = d.slice(0, nDiag).sort(function (a, b) { return a.level - b.level; });
    /* intercalat: P D P D D */
    while (pd.length || dd.length) { if (pd.length) ordered.push(pd.shift()); if (dd.length) ordered.push(dd.shift()); }
    return ordered;
  }
  /* Nota final: mitjana de les notes d'escenari i percentatge per categoria (ponderat pels pesos). */
  function finalGrade(results) {
    if (!results.length) return { score10: 0, cats: {} };
    const sum = results.reduce(function (a, r) { return a + r.score10; }, 0);
    const cats = {};
    results.forEach(function (r) {
      Object.keys(r.cats || {}).forEach(function (k) {
        const c = r.cats[k];
        if (c.f === null || c.f === undefined) return;
        if (!cats[k]) cats[k] = { s: 0, w: 0 };
        cats[k].s += c.f * c.w; cats[k].w += c.w;
      });
    });
    const out = {};
    Object.keys(cats).forEach(function (k) { out[k] = Math.round(100 * cats[k].s / cats[k].w); });
    const safety = [];
    results.forEach(function (r) { (r.safety || []).forEach(function (s) { safety.push(s); }); });
    return { score10: round1(sum / results.length), cats: out, safety: safety };
  }

  /* Enviament de la nota al campus una sola vegada. getLink() retorna window.CampusLink (o res si encara no s'ha carregat).
     Retorna true si s'ha enviat ara; false si ja s'havia enviat o si l'enllaç no és disponible (es pot tornar a provar). */
  function reporter(getLink) {
    let sent = false;
    return function (score10) {
      if (sent) return false;
      let link = null;
      try { link = getLink(); } catch (e) { link = null; }
      if (!link || typeof link.finish !== 'function') return false;
      sent = true;
      try { link.finish(Math.max(0, Math.min(10, round1(Number(score10) || 0)))); } catch (e) { /* sense xarxa: el campus ho gestiona */ }
      return true;
    };
  }

  /* ---------- Validació de dades ---------- */
  function validateData(D) {
    const errs = [];
    const two = (x) => Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string' && x[0].length > 0 && x[1].length > 0;
    Object.keys(D.catalog.mats).forEach(function (k) {
      const m = D.catalog.mats[k];
      if (m.id !== k) errs.push('mat id ' + k);
      if (!two(m.name)) errs.push('mat name ' + k);
      if (!m.ctrl && ['ok', 'no', 'single', 'flam'].indexOf(m.suit) < 0) errs.push('mat suit ' + k);
      if (m.suit === 'ok' && !m.ctrl && !(m.packs || []).length) errs.push('mat packs ' + k);
      if (m.suit === 'ok' && !m.ctrl && !m.prot) errs.push('mat prot ' + k);
      if (m.suit !== 'ok' && !m.ctrl && !(m.reject || []).length) errs.push('mat reject ' + k);
      (m.packs || []).forEach(function (p) { if (!D.catalog.packs[p]) errs.push('mat pack ' + k + ':' + p); });
      (m.reject || []).forEach(function (r) { if (!D.catalog.reasons[r]) errs.push('mat reason ' + k + ':' + r); });
    });
    Object.keys(D.catalog.packs).forEach(function (k) { if (!two(D.catalog.packs[k].name)) errs.push('pack name ' + k); });
    const ids = {};
    D.scenarios.forEach(function (s) {
      if (ids[s.id]) errs.push('dup ' + s.id); ids[s.id] = 1;
      if (!two(s.title) || !two(s.brief)) errs.push('scen text ' + s.id);
      if (s.type === 'prep') (s.variants || []).forEach(function (v, i) { (v.items || []).forEach(function (it) { if (!D.catalog.mats[it.mat]) errs.push('scen mat ' + s.id + '/' + i + ':' + it.mat); }); });
      if (s.type === 'diag') {
        if (!(s.causes || []).length) errs.push('diag causes ' + s.id);
        (s.causes || []).forEach(function (c) { if (!D.msgs[c]) errs.push('diag cause msg ' + s.id + ':' + c); });
        (s.variants || []).forEach(function (v, i) { (v.items || []).forEach(function (it) { if (!D.catalog.mats[it.mat]) errs.push('diag mat ' + s.id + '/' + i + ':' + it.mat); }); });
      }
    });
    return errs;
  }

  const L = {
    AMB: AMB, TOL: TOL, SAFE_OPEN: SAFE_OPEN, HOT_OPEN: HOT_OPEN, MAX_SAFE_T: MAX_SAFE_T, MIN_T: MIN_T, SHELF_W: SHELF_W, SHELVES: SHELVES, CAP: CAP,
    OVERLOAD: OVERLOAD, CI_PASS: CI_PASS, BI_KILL: BI_KILL, EXT_TURN: EXT_TURN, PROGRAMS: PROGRAMS, WEIGHTS: WEIGHTS, SAFETY: SAFETY,
    expandItems: expandItems, reqTime: reqTime, lethRate: lethRate, programOf: programOf, programById: programById, isLoadable: isLoadable, protocolFor: protocolFor,
    evalParams: evalParams, layout: layout, evalLoad: evalLoad, loadContext: loadContext, thermalLoad: thermalLoad,
    createOven: createOven, setParams: setParams, start: start, stop: stop, openDoor: openDoor, closeDoor: closeDoor, step: step, isRunning: isRunning,
    runCycle: runCycle, buildDiag: buildDiag, disp: disp, physical: physical, longestAtTemp: longestAtTemp, damageOf: damageOf, outcome: outcome, biRead: biRead,
    expectedDecision: expectedDecision, evalDecision: evalDecision, evalControls: evalControls, evalProcedure: evalProcedure,
    scoreChecks: scoreChecks, scorePrep: scorePrep, scoreDiag: scoreDiag, pickExam: pickExam, finalGrade: finalGrade,
    validateData: validateData, reporter: reporter, seeded: seeded, shuffle: shuffle, round1: round1
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  else root.ToolLogic = L;
})(this);
