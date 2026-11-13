/* Lògica pura del simulador d'autoclau de vapor (sense DOM; UMD).
   - Model físic didàctic: vapor saturat (equació d'Antoine), pressions parcials d'aire i vapor (Dalton),
     escalfament de cada paquet amb retard de 1r ordre, letalitat equivalent a 121 °C (z = 10 °C).
   - Motor d'escenari: comprovacions prèvies, càrrega, programa, cicle, descàrrega, controls i decisió.
   - Puntuació desglossada: càrrega i envasat, paràmetres, procediment, controls, decisió i seguretat. */
(function (root) {
  'use strict';
  const PATM = 1.013;            /* bar absoluts */
  const D121 = 1.5;              /* min, orientatiu (Geobacillus stearothermophilus) */
  const LOG_N0 = 6;              /* població de l'indicador biològic: 10^6 espores */
  const F_BI = D121 * LOG_N0;    /* F mínim (min equivalents a 121 °C) per inactivar el BI */
  const F_CI5 = 7;               /* integrador de classe 5: llindar orientatiu (per sota del BI) */
  const CAT_W = { load: 0.25, params: 0.15, proc: 0.2, ctrl: 0.2, dec: 0.2 };
  const L = { PATM: PATM, F_BI: F_BI, D121: D121, CAT_W: CAT_W };

  /* ---------- utilitats ---------- */
  L.seeded = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const r1 = (x) => Math.round(x * 10) / 10;
  const r2 = (x) => Math.round(x * 100) / 100;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
  function shuffle(rng, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  L.pick = pick; L.shuffle = shuffle;

  /* ---------- vapor saturat (Antoine, aigua): T en °C, P en bar absoluts ---------- */
  const ANT_LO = [8.07131, 1730.63, 233.426], ANT_HI = [8.14019, 1810.94, 244.485];
  L.satP = function (T) { const c = T < 100 ? ANT_LO : ANT_HI; return Math.pow(10, c[0] - c[1] / (c[2] + T)) / 750.062; };
  L.satT = function (P) { const p = Math.max(P, 0.005); const c = p < PATM ? ANT_LO : ANT_HI; return c[1] / (c[0] - Math.log10(p * 750.062)) - c[2]; };
  L.rel = (Pabs) => Pabs - PATM;
  /* Temperatures de meseta validades i temps (orientatiu). La norma (UNE-EN 285) fixa 121 °C 15 min, 126 °C 10 min i 134 °C 3 min;
     els cicles de 130-133 °C (≈ 5-6 min) depenen de l'equip i del fabricant. «rec» = temps habitual de protocol. Fora d'aquestes franges, no validat. */
  const BANDS = [[121, 124, 15, 15], [126, 129, 10, 10], [130, 133, 5, 6], [134, 137, 3, 5]];
  const band = (T) => BANDS.find((b) => T >= b[0] && T <= b[1]) || null;
  L.minHold = function (T) { const b = band(T); return b ? b[2] : null; };
  L.recHold = function (T) { const b = band(T); return b ? b[3] : null; };
  L.isStdT = (T) => !!band(T);

  /* ---------- simulació d'un cicle ----------
     cfg: { type B|N|L|BD|LEAK, T, hold (min), dry (min), preheated, water ok|low, fill (0-1),
            packs: [{uid, tau, trapN, amp, extra, steam}], faults: {leak mbar/min, pump, cut (fracció de meseta)},
            abortAt (s), abortDry (s des de l'inici de l'assecat) } */
  L.simulate = function (cfg) {
    const f = cfg.faults || {};
    const type = cfg.type, Tset = cfg.T;
    const leak = ((f.leak || 0) + 0.3) / 1000 / 60;            /* bar/s (0,3 mbar/min de base) */
    const fill = cfg.fill || 0;
    let t = 0, Pa = PATM, Ps = 0, Tc = cfg.preheated ? 72 : 22;
    let ph = null, phStart = 0, stop = false, aborted = false, alarm = null, alarmT = null;
    const series = [], phases = [];
    const hold = { start: null, end: null, Tmin: 999, Tmax: 0, Pmin: 99, Pmax: -1, dTheo: 0, acc: 0, airSum: 0, n: 0 };
    let dryDone = 0, leakRate = null;
    const packs = (cfg.packs || []).map((p) => Object.assign({}, p, { Tp: Tc, F: 0, t1: 0, t2: 0, maxT: Tc, air: 0, airMax: 0 }));
    const P = () => Pa + Ps;
    function enter(id) { if (ph !== null) phases.push({ id: ph, t0: phStart, t1: t }); ph = id; phStart = t; }
    function abort(code) {
      if (!aborted) { aborted = true; alarm = code; alarmT = t; }
      if (ph !== 'exh' && ph !== 'vent' && ph !== 'cool' && ph !== 'end') stop = true;   /* en descompressió el cicle continua fins a pressió atmosfèrica */
    }
    function tick(tcTarget, lag) {
      Tc += (tcTarget - Tc) / Math.max(1, lag);
      const steamOn = Ps > 0.3 && P() > 0.9;
      const ac = Pa / P();
      for (const p of packs) {
        let target = Tc;
        if (p.steam && steamOn) {
          const ap = (type === 'N' || type === 'L') ? Math.min(0.9, ac + p.trapN + p.extra) : Math.min(0.9, ac * p.amp + p.extra * 0.3);
          p.air = ap; if (ph === 'hold') p.airMax = Math.max(p.airMax, ap);
          target = Math.min(Tc, L.satT(P() * (1 - ap)));
        }
        const tau = p.steam ? p.tau : p.tau * 3;
        p.Tp += (target - p.Tp) / tau;
        p.maxT = Math.max(p.maxT, p.Tp);
        if (p.steam && steamOn) {
          if (p.Tp >= 100) p.F += Math.pow(10, (p.Tp - 121.1) / 10) / 60;
          if (p.Tp >= Tset - 1) p.t1 += 1;
          if (p.Tp >= Tset - 2) p.t2 += 1;
        }
      }
      if (ph === 'hold') {
        hold.Tmin = Math.min(hold.Tmin, Tc); hold.Tmax = Math.max(hold.Tmax, Tc);
        hold.Pmin = Math.min(hold.Pmin, P() - PATM); hold.Pmax = Math.max(hold.Pmax, P() - PATM);
        hold.dTheo = Math.max(hold.dTheo, L.satT(P()) - Tc); hold.airSum += ac; hold.n++;
      }
      if (t % 2 === 0) series.push({ t: t, T: r1(Tc), P: r2(P() - PATM), ph: ph });
      t += 1;
      if (cfg.abortAt != null && t >= cfg.abortAt && !aborted && ph !== 'end') abort('manual');
      if (t > 4 * 3600) stop = true;
    }
    function loopUntil(cond, upd) { let guard = 0; while (!stop && !cond() && guard++ < 20000) { const r = upd(); tick(r[0], r[1]); } }

    /* precalentament */
    enter('pre');
    const preS = cfg.preheated ? 40 : 420;
    loopUntil(() => t >= preS, () => [82, 160]);

    if (type === 'LEAK') {
      enter('leak');
      loopUntil(() => P() <= 0.07, () => { const k = Math.max(0, P() - 0.012) / P(); Pa *= k; Ps *= k; return [Math.max(55, Tc - 0.02), 60]; });
      const t0 = t + 300; loopUntil(() => t >= t0, () => { Pa += leak; return [Tc, 60]; });
      const p0 = P(), t1 = t + 600; loopUntil(() => t >= t1, () => { Pa += leak; return [Tc, 60]; });
      leakRate = r1((P() - p0) * 1000 / 10);
      enter('vent'); loopUntil(() => P() >= PATM - 0.002, () => { Pa = Math.min(PATM - Ps, Pa + 0.02); return [Tc, 200]; });
      enter('end'); tick(Tc, 200); phases.push({ id: 'end', t0: phStart, t1: t });
      return { type: type, series: series, phases: phases, total: t, aborted: false, alarm: null, leakRate: leakRate, packs: [] };
    }

    /* eliminació de l'aire */
    if (type === 'B' || type === 'BD') {
      enter('vac');
      const plow = f.pump ? 0.6 : 0.15, phigh = 1.6;
      for (let i = 0; i < 3 && !stop; i++) {
        loopUntil(() => P() <= plow, () => { const k = Math.max(0, P() - 0.012) / P(); Pa = Pa * k + leak; Ps *= k; return [Math.max(55, L.satT(Math.max(Ps, 0.12))), 12]; });
        loopUntil(() => P() >= phigh, () => { Ps += 0.02; return [L.satT(Ps), 10]; });
      }
    } else {
      enter('purge');
      const t0 = t + 240;
      loopUntil(() => t >= t0, () => { Pa *= Math.exp(-1 / 60); Ps = Math.max(Ps, 1.06 - Pa); return [L.satT(Math.max(Ps, 0.3)), 10]; });
    }

    /* admissió de vapor i escalfament */
    enter('heat');
    if (cfg.water === 'low') abort('water');
    const rate = 0.008 * (cfg.preheated ? 1 : 0.75) * (fill > 0.6 ? 0.8 : 1);
    let ncg = 0;   /* gasos no condensables arrossegats pel vapor (fallada d'alimentació) */
    loopUntil(() => Tc >= Tset + 0.3, () => { Ps += rate; if (f.ncg && ncg < f.ncg) { const d = f.ncg / 150; Pa += d; ncg += d; } return [L.satT(Ps), 8]; });

    /* meseta */
    if (!stop) {
      enter('hold'); hold.start = t;
      const holdS = (cfg.hold || 0) * 60;
      const cutAt = f.cut != null ? holdS * f.cut : null;
      let low = 0;
      loopUntil(() => hold.acc >= holdS, () => {
        const el = t - hold.start;
        if (cutAt != null && el >= cutAt) { Ps *= 0.996; if (Tc < Tset - 1) low++; if (low > 10) abort('steam'); }
        else { const tgt = L.satP(Tset + 0.8 + 0.25 * Math.sin(t / 37)); Ps += (tgt - Ps) / 10; }
        if (Tc >= Tset - 0.5) hold.acc++;
        return [L.satT(Ps), 6];
      });
      hold.end = t;
    }
    const holdInfo = hold.start != null ? { start: hold.start, end: hold.end, dur: r2((hold.end - hold.start) / 60), Tmin: r1(hold.Tmin), Tmax: r1(hold.Tmax), Pmin: r2(hold.Pmin), Pmax: r2(hold.Pmax), dTheo: r1(hold.dTheo), air: hold.n ? hold.airSum / hold.n : 0 } : null;

    /* descompressió (també després d'un avortament) */
    const wasAborted = aborted; stop = false;
    enter('exh');
    const exRate = type === 'L' ? 0.0025 : 0.02;
    loopUntil(() => P() <= PATM + 0.003, () => { const k = Math.max(PATM, P() - exRate) / P(); Pa *= k; Ps *= k; return [Math.max(L.satT(Math.max(Ps, 0.3)), 99), 15]; });
    if (type === 'L') { enter('cool'); loopUntil(() => Tc <= 80, () => [60, 300]); }

    /* assecat */
    if (!wasAborted && (cfg.dry || 0) > 0 && type !== 'L') {
      enter('dry');
      const dryS = cfg.dry * 60; const t0 = t;
      if (type === 'B' || type === 'BD') {
        loopUntil(() => P() <= 0.12 || (cfg.abortDry != null && t - t0 >= cfg.abortDry), () => { const k = Math.max(0, P() - 0.012) / P(); Pa = Pa * k + leak; Ps *= k; return [100, 120]; });
        loopUntil(() => t - t0 >= dryS || (cfg.abortDry != null && t - t0 >= cfg.abortDry), () => { Pa += leak; const k = Math.max(0.1, P() - 0.002) / P(); Ps *= k; return [100, 120]; });
      } else {
        loopUntil(() => t - t0 >= dryS || (cfg.abortDry != null && t - t0 >= cfg.abortDry), () => [95, 200]);
      }
      dryDone = r1((t - t0) / 60);
      if (cfg.abortDry != null && t - t0 >= cfg.abortDry && dryDone < cfg.dry) { aborted = true; alarm = 'manual'; alarmT = t; }
    }
    stop = false;
    /* entrada d'aire filtrat i fi */
    enter('vent');
    loopUntil(() => P() >= PATM - 0.003, () => { const need = PATM - P(); Pa += Math.min(0.02, need); Ps *= 0.98; return [Math.min(Tc, 95), 200]; });
    enter('end'); tick(Tc, 300);
    phases.push({ id: 'end', t0: phStart, t1: t });
    return {
      type: type, T: Tset, hold: cfg.hold, dry: cfg.dry, series: series, phases: phases, total: t, aborted: aborted, alarm: alarm, alarmT: alarmT,
      holdInfo: holdInfo, dryDone: dryDone, leakRate: leakRate,
      packs: packs.map((p) => ({ uid: p.uid, F: r2(p.F), t1: r2(p.t1 / 60), t2: r2(p.t2 / 60), maxT: r1(p.maxT), air: r2(p.airMax), steam: p.steam }))
    };
  };

  /* estat en un instant (per reproduir el cicle a la interfície) */
  L.at = function (sim, t) {
    const s = sim.series; if (!s.length) return { T: 22, P: 0, ph: 'pre' };
    if (t <= s[0].t) return s[0];
    if (t >= s[s.length - 1].t) return s[s.length - 1];
    let lo = 0, hi = s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m].t <= t) lo = m; else hi = m; }
    const a = s[lo], b = s[hi], k = (t - a.t) / Math.max(1, b.t - a.t);
    return { t: t, T: a.T + (b.T - a.T) * k, P: a.P + (b.P - a.P) * k, ph: a.ph };
  };
  L.phaseAt = function (sim, t) { for (const p of sim.phases) if (t >= p.t0 && t < p.t1) return p.id; return 'end'; };
  /* porta: bloquejada mentre el cicle no ha acabat, amb pressió > 0,05 bar o (líquids) T > 80 °C */
  L.doorLocked = function (sim, t) {
    if (!sim) return false;
    if (t < sim.total) return true;
    const s = L.at(sim, t); return s.P > 0.05 || (sim.type === 'L' && s.T > 80);
  };

  /* ---------- material: destinació correcta ---------- */
  function itemDef(D, id) { return D.items[id]; }
  L.correctDests = function (D, run, it) {
    const d = itemDef(D, it.id);
    if (it.st === 'dirty' || it.st === 'wet') return ['clean'];
    if (it.st === 'rust') return ['withdraw'];
    if (d.k === 'single') return ['discard'];
    if (d.k === 'flam') return ['withdraw'];
    if (d.k === 'oil' || d.k === 'powder') return ['dry'];
    if (d.k === 'tl' || d.k === 'endo') return ['lowtemp'];
    if (d.k === 'liquid') return run.items.some((x) => x.ch.dest === 'steam' && itemDef(D, x.id).k !== 'liquid') ? ['later'] : ['later', 'steam'];
    const out = ['steam'];
    if (d.maxT <= 121 || L.overloadCart(D, run)) out.push('later');
    return out;
  };
  /* el carro amb tot el material apte supera el 80 %? */
  L.overloadCart = function (D, run) {
    let v = 0;
    for (const it of run.items) { const d = itemDef(D, it.id); if (d.maxT > 0 && it.st === 'ok') v += d.vol; }
    return v > D.chamber.cap * D.chamber.maxFill;
  };
  function wrapped(pkg) { return pkg && pkg !== 'none'; }
  function posType(d, pkg) { if (d.concave) return 'bowl'; if (pkg === 'bag') return 'bag'; return 'pack'; }
  L.posType = posType;
  L.posOptions = function (D, id, pkg) { const t = posType(itemDef(D, id), pkg); return t === 'bowl' ? ['down', 'up'] : t === 'bag' ? ['vert', 'pp', 'flat'] : ['sep', 'stack']; };
  L.needsInternalCI = (pkg) => pkg === 'cont' || pkg === 'crepe' || pkg === 'sms' || pkg === 'cloth' || pkg === 'box' || pkg === 'foil';
  L.loaded = (run) => run.items.filter((it) => it.ch.dest === 'steam');
  L.fill = function (D, run) { let v = 0; for (const it of L.loaded(run)) v += itemDef(D, it.id).vol; return v / D.chamber.cap; };

  /* criteris d'un element del carro: [{k, ok (0-1), w, code}] */
  L.evalItem = function (D, run, it) {
    const d = itemDef(D, it.id), ch = it.ch, out = [];
    const good = L.correctDests(D, run, it);
    const dest = ch.dest;
    if (!dest) { out.push({ k: 'dest', ok: 0, w: 2, code: 'dest_none' }); return out; }
    if (good.indexOf(dest) < 0) {
      let code = 'dest_steam';
      if (it.st === 'dirty') code = 'dest_dirty'; else if (it.st === 'wet') code = 'dest_wet'; else if (it.st === 'rust') code = 'dest_rust';
      else if (d.k === 'single') code = 'dest_single'; else if (d.k === 'flam') code = 'dest_flam'; else if (d.k === 'oil' || d.k === 'powder') code = 'dest_oil';
      else if (d.k === 'tl' || d.k === 'endo') code = 'dest_tl'; else if (d.k === 'liquid') code = 'dest_liquid';
      else if (dest === 'later') code = 'dest_later';
      out.push({ k: 'dest', ok: 0, w: 2, code: code });
      return out;
    }
    out.push({ k: 'dest', ok: 1, w: 2, code: 'dest_ok' });
    if (dest !== 'steam') return out;
    if (d.k === 'liquid') { out.push({ k: 'label', ok: ch.label ? 1 : 0, w: 0.5, code: ch.label ? 'ok' : 'label_no' }); return out; }
    const pk = D.packs[ch.pack];
    if (!ch.pack) out.push({ k: 'pack', ok: 0, w: 1.5, code: 'pack_none' });
    else if (!pk.ok) out.push({ k: 'pack', ok: 0, w: 1.5, code: 'pack_' + ch.pack });
    else if (d.packs.indexOf(ch.pack) < 0) out.push({ k: 'pack', ok: 0.5, w: 1.5, code: 'pack_size' });
    else out.push({ k: 'pack', ok: 1, w: 1.5, code: 'pack_ok' });
    if (d.art) out.push({ k: 'open', ok: ch.open ? 1 : 0, w: 1, code: ch.open ? 'ok' : 'open_no' });
    if (ch.pack === 'bag') {
      out.push({ k: 'fill', ok: ch.fill34 ? 1 : 0, w: 0.5, code: ch.fill34 ? 'ok' : 'fill_no' });
      out.push({ k: 'air', ok: ch.airOut ? 1 : 0, w: 0.5, code: ch.airOut ? 'ok' : 'air_no' });
    }
    if (L.needsInternalCI(ch.pack)) {
      const c = Number(ch.ci) || 0;
      out.push({ k: 'ci', ok: c >= 4 ? 1 : 0, w: 1, code: c >= 4 ? 'ok' : c === 1 ? 'ci_class1' : 'ci_missing' });
    } else if (Number(ch.ci) === 1) out.push({ k: 'ci', ok: 0, w: 0.5, code: 'ci_class1' });
    out.push({ k: 'label', ok: ch.label ? 1 : 0, w: 0.5, code: ch.label ? 'ok' : 'label_no' });
    const pt = posType(d, ch.pack);
    const pos = ch.pos;
    let pc = 'ok', pok = 1;
    if (!pos) { pc = pt === 'bowl' ? 'pos_up' : pt === 'bag' ? 'pos_flat' : 'pos_stack'; pok = 0; }
    else if (pt === 'bowl' && pos !== 'down') { pc = 'pos_up'; pok = 0; }
    else if (pt === 'bag' && pos === 'pp') { pc = 'pos_pp'; pok = 0; }
    else if (pt === 'bag' && pos !== 'vert') { pc = 'pos_flat'; pok = 0; }
    else if (pt === 'pack' && pos !== 'sep') { pc = 'pos_stack'; pok = 0; }
    out.push({ k: 'pos', ok: pok, w: 1, code: pc });
    let sc = 'ok', sok = 1;
    if (d.heavy && ch.shelf !== 'low') { sc = 'shelf_heavy'; sok = 0; }
    else if (d.porous && ch.shelf !== 'up') { sc = 'shelf_textile'; sok = 0; }
    else if (!ch.shelf) { sc = 'shelf_heavy'; sok = 0; }
    out.push({ k: 'shelf', ok: sok, w: 0.5, code: sc });
    out.push({ k: 'wall', ok: ch.wall ? 0 : 1, w: 0.5, code: ch.wall ? 'wall' : 'ok' });
    return out;
  };

  /* ---------- efectes de la càrrega sobre la simulació ---------- */
  const TAU = { instr: 30, bowl: 45, glass: 60, set: 100, cont: 130, implant: 120, textile: 90, lumen: 70, silicone: 50, rubber: 45, pp: 50, liquid: 400 };
  L.packEffects = function (D, run, prog) {
    const fill = L.fill(D, run);
    const T = prog ? prog.T : 134, type = prog ? prog.type : 'B';
    const res = [];
    for (const it of L.loaded(run)) {
      const d = itemDef(D, it.id), ch = it.ch, pkg = ch.pack || 'none';
      const steamOkPack = !!(D.packs[pkg] && D.packs[pkg].ok) || pkg === 'none';
      const p = { uid: it.uid, id: it.id, pkg: pkg, ci: Number(ch.ci) || 0, bi: !!ch.bi, label: !!ch.label, shelf: ch.shelf, pos: ch.pos, wall: !!ch.wall,
        steam: steamOkPack && d.k !== 'oil' && d.k !== 'powder', tau: (TAU[d.k] || 60) * (pkg === 'crepe' || pkg === 'sms' || pkg === 'cloth' ? 1.3 : 1),
        trapN: d.porous ? 0.3 : d.lumen ? 0.35 : wrapped(pkg) ? 0.2 : 0.02, amp: d.porous ? 4 : d.lumen ? 3 : 2, extra: 0,
        wet: [], burst: null, damage: null, hidden: [], grave: null, ciForce: ch.ciForce };
      if (ch.pos === 'pp') { p.extra += 0.1; p.tau *= 1.4; p.wet.push('pos_pp'); }
      if (ch.pos === 'flat') { p.extra += 0.1; p.tau *= 1.5; p.wet.push('pos_flat'); }
      if (ch.pos === 'stack') { p.extra += 0.08; p.tau *= 1.4; p.wet.push('pos_stack'); }
      if (ch.pos === 'up') { p.extra += 0.2; p.wet.push('pos_up'); }
      if (ch.wall) p.wet.push('wall');
      if (d.porous && ch.shelf === 'low') p.wet.push('shelf_textile');
      if (d.heavy && ch.shelf === 'up') p.wet.push('shelf_heavy');
      if (d.art && !ch.open) p.hidden.push('open_no');
      if (it.st === 'dirty') p.hidden.push('dest_dirty');
      if (it.st === 'wet') p.wet.push('dest_wet');
      if (it.st === 'rust') p.damage = 'dest_rust';
      if (d.maxT > 0 && d.maxT <= 121 && T > 125) p.damage = 'T_rubber';
      if (d.k === 'tl' || d.k === 'endo') p.damage = 'dest_tl';
      if (d.k === 'single') p.damage = 'dest_single';
      if (d.k === 'liquid' && type !== 'L') { p.damage = 'liquid_grave'; p.grave = 'liquid_grave'; }
      if (d.k === 'flam') { p.damage = 'flam_grave'; p.grave = 'flam_grave'; }
      if (pkg === 'bag' && !ch.fill34) p.burst = 'fill_no';
      else if (pkg === 'bag' && !ch.airOut && (type === 'B')) p.burst = 'air_no';
      if (!steamOkPack || d.k === 'oil' || d.k === 'powder') p.hidden.push(pkg === 'foil' || pkg === 'box' || pkg === 'poly' ? 'pack_' + pkg : 'dest_oil');
      if (fill > D.chamber.maxFill) { p.tau *= 2.2; p.extra += 0.05; if (wrapped(pkg)) p.wet.push('overload'); }
      res.push(p);
    }
    return res;
  };
  /* minuts d'assecat necessaris (orientatiu) */
  L.dryNeeded = function (D, run) {
    const ld = L.loaded(run); if (!ld.some((it) => wrapped(it.ch.pack))) return 0;
    let n = 8;
    if (ld.some((it) => itemDef(D, it.id).porous)) n += 4;
    if (ld.some((it) => ['set', 'cont', 'implant'].indexOf(itemDef(D, it.id).k) >= 0)) n += 5;
    if (L.fill(D, run) > 0.6) n += 3;
    return n;
  };

  /* ---------- programa: criteris ---------- */
  L.evalProgram = function (D, run) {
    const p = run.prog, ld = L.loaded(run), out = [];
    if (!ld.length) return out;
    if (!p) { out.push({ k: 'prog', ok: 0, w: 5, code: 'prog_none' }); return out; }
    const defs = ld.map((it) => itemDef(D, it.id));
    const hasLiq = defs.some((d) => d.k === 'liquid');
    const allLiq = defs.every((d) => d.k === 'liquid');
    const needB = ld.some((it) => wrapped(it.ch.pack) || itemDef(D, it.id).porous || itemDef(D, it.id).lumen);
    let tc = 'ok', tok = 1;
    if (hasLiq && p.type !== 'L') { tc = 'type_needL'; tok = 0; }
    else if (p.type === 'L' && !allLiq) { tc = 'type_L'; tok = 0; }
    else if (p.type === 'N' && needB) { tc = 'type_N'; tok = 0; }
    out.push({ k: 'type', ok: tok, w: 2, code: tc });
    const has121 = defs.some((d) => d.maxT > 0 && d.maxT <= 121);
    const prion = !!run.sc.prion;
    let Tc = 'ok', Tok = 1;
    if (!L.isStdT(p.T)) { Tc = 'T_nonstd'; Tok = 0; }
    else if (prion && p.T !== 134) { Tc = 'T_prion'; Tok = 0; }
    else if (has121 && p.T > 125) { Tc = 'T_rubber'; Tok = 0; }
    out.push({ k: 'T', ok: Tok, w: 1.5, code: Tc });
    let hc = 'ok', hok = 1;
    if (!L.isStdT(p.T)) { hc = 'T_nonstd'; hok = 0; }
    else if (prion && p.T === 134) { if (p.hold < 18) { hc = 'hold_prion'; hok = 0; } }
    else {
      const mh = L.minHold(p.T), rh = L.recHold(p.T);
      if (p.hold < mh) { hc = 'hold_short'; hok = 0; }
      else if (p.hold < rh) { hc = 'hold_low'; hok = 0.5; }
      else if (p.hold > 2 * rh) { hc = 'hold_long'; hok = 0.5; }
    }
    out.push({ k: 'hold', ok: hok, w: 1.5, code: hc });
    const need = L.dryNeeded(D, run);
    const dok = p.type === 'L' || (p.dry || 0) >= need;
    out.push({ k: 'dry', ok: dok ? 1 : 0, w: 1, code: dok ? 'ok' : 'dry_short' });
    return out;
  };

  /* ---------- creació d'una partida ---------- */
  L.findScenario = (D, id) => D.scenarios.find((s) => s.id === id);
  const DEF_CH = () => ({ dest: null, pack: null, open: false, fill34: false, airOut: false, ci: 0, bi: false, label: false, shelf: null, pos: null, wall: false });
  function defaultChoice(D, id, o) {
    const d = itemDef(D, id);
    const ch = { dest: 'steam', pack: (o && o.pack) || d.packs[0] || 'bag', open: true, fill34: true, airOut: true, ci: 0, bi: false, label: true, shelf: d.heavy ? 'low' : d.porous ? 'up' : 'low', pos: null, wall: false };
    const pt = posType(d, ch.pack); ch.pos = pt === 'bowl' ? 'down' : pt === 'bag' ? 'vert' : 'sep';
    return Object.assign(ch, o || {});
  }
  L.newItem = function (run, id, st) { const it = { uid: 'i' + (++run._n), id: id, st: st || 'ok', ch: DEF_CH(), seen: false }; run.items.push(it); return it; };

  L.createRun = function (D, scOrId, opts) {
    opts = opts || {};
    const sc = typeof scOrId === 'string' ? L.findScenario(D, scOrId) : scOrId;
    if (!sc) throw new Error('scenario');
    const rng = opts.rng || Math.random;
    const v = {};
    Object.keys(sc.vary || {}).forEach((k) => { v[k] = opts.vary && k in opts.vary ? opts.vary[k] : pick(rng, sc.vary[k]); });
    const now = opts.date || new Date();
    const dd = String(now.getDate()).padStart(2, '0'), mm = String(now.getMonth() + 1).padStart(2, '0'), yy = String(now.getFullYear()).slice(2);
    const cyc = 100 + Math.floor(rng() * 800);
    const run = {
      sc: sc, mode: opts.mode || 'practice', v: v, _n: 0,
      meta: { date: dd + '/' + mm + '/20' + yy, cycle: String(cyc).padStart(4, '0'), lot: 'L' + yy + mm + dd + '-' + String(cyc).padStart(4, '0'), op: 'TCAI-' + String(1 + Math.floor(rng() * 9)).padStart(2, '0'), start: 7 * 3600 + 30 * 60 + Math.floor(rng() * 3 * 3600) },
      stage: sc.kind === 'diag' ? 'controls' : 'checks',
      checks: { water: null, refill: null, clean: false, preheat: false, leak: null, bd: [], bdActions: [], stopped: false },
      items: [], prog: null, sim: null, out: null,
      events: { door: 0, estop: null }, unload: {}, bi: null, answers: {}, decision: [], disp: {}, hints: 0, faults: Object.assign({}, sc.faults || {})
    };
    if (sc.kind === 'run') {
      (sc.cart || []).forEach((c) => L.newItem(run, c[0], c[1]));
      if (v.extra) L.newItem(run, v.extra, 'ok');
      run.water = v.water || 'ok';
      run.preheatedStart = !sc.firstOfDay;
    } else {
      buildDiag(D, run, rng);
    }
    return run;
  };

  function buildDiag(D, run, rng) {
    const s = run.sc.setup || {};
    run.water = 'ok';
    if (s.bd) {
      run.faults = { leak: s.bd.fault || 0 };
      L.runBD(D, run, 'empty');
      if (run.v.repeat) { run.checks.bdActions.push('repeat'); L.runBD(D, run, 'empty'); }
      run.checks.preheat = true; run.checks.clean = true; run.checks.water = 'ok';
      return;
    }
    if (s.storage) { run.storage = D.storage.map((x, i) => Object.assign({ uid: 's' + i }, x)); return; }
    const ld = D.loads[s.load] || [];
    ld.forEach((c) => { const it = L.newItem(run, c[0], 'ok'); it.ch = defaultChoice(D, c[0], c[1]); it.seen = true; });
    run.faults = Object.assign({}, s.faults || {});
    run.prog = Object.assign({ id: 'manual' }, run.v.prog || s.prog);
    run.preheatedStart = true; run.checks.preheat = true; run.checks.water = 'ok'; run.checks.clean = true;
    const sim = simulateRun(D, run, s.abortDry ? { abortDry: 90 } : null);
    run.sim = sim;
    run.noRecord = !!s.noRecord; run.machineOk = !!s.machineOk;
    if (s.bi) run.bi = { forced: s.bi, incubated: true, temp: 57 };
    else if (run.items.some((it) => it.ch.bi)) run.bi = { incubated: true, temp: 57 };
    L.finishCycle(D, run);
  }

  function simulateRun(D, run, extra) {
    const prog = run.prog;
    const eff = L.packEffects(D, run, prog);
    run.effects = eff;
    const cfg = Object.assign({ type: prog.type, T: prog.T, hold: prog.hold, dry: prog.dry, preheated: run.preheatedStart || run.checks.preheat || run.checks.bd.length > 0,
      water: run.water === 'low' && !run.checks.refill ? 'low' : 'ok', fill: L.fill(D, run), packs: eff, faults: run.faults }, extra || {});
    return L.simulate(cfg);
  }

  /* ---------- accions: comprovacions prèvies ---------- */
  L.check = function (run, key) {
    if (key === 'water') run.checks.water = run.water;
    else if (key === 'clean') run.checks.clean = true;
    else if (key === 'preheat') run.checks.preheat = true;
    return run.checks;
  };
  L.refill = function (run, kind) { run.checks.refill = kind; run.checks.water = run.checks.water || run.water; run.water = 'ok'; return run.checks; };
  L.runBD = function (D, run, place) {
    const bdp = D.testPrograms.bd;
    const sim = L.simulate({ type: 'BD', T: bdp.T, hold: bdp.hold, dry: bdp.dry, preheated: run.preheatedStart || run.checks.preheat || run.checks.bd.length > 0, water: 'ok',
      packs: [{ uid: 'bd', tau: 60, trapN: 0.4, amp: 25, extra: place === 'load' ? 0.08 : 0, steam: true }], faults: run.faults });
    const air = sim.packs[0].air;
    const pass = air < 0.03 && place === 'empty';
    const res = { place: place, sim: sim, air: air, pass: pass, pale: clamp((air - 0.02) / 0.25, 0, 1) };
    run.checks.bd.push(res);
    return res;
  };
  L.bdAction = function (run, act) {
    run.checks.bdActions.push(act);
    if (act === 'stop') { run.checks.stopped = true; run.stage = 'decision'; }
    return run.checks.bdActions;
  };
  L.runLeak = function (D, run) {
    const sim = L.simulate({ type: 'LEAK', preheated: true, faults: run.faults });
    run.checks.leak = { sim: sim, rate: sim.leakRate, pass: sim.leakRate <= 1.3 };
    return run.checks.leak;
  };

  /* ---------- programa i cicle ---------- */
  L.setProgram = function (D, run, p) {
    if (p.id && p.id !== 'manual') { const pr = D.programs.find((x) => x.id === p.id); run.prog = { id: pr.id, type: pr.type, T: pr.T, hold: pr.hold, dry: pr.dry }; }
    else run.prog = { id: 'manual', type: p.type, T: Number(p.T), hold: Number(p.hold), dry: Number(p.dry) };
    return run.prog;
  };
  L.startCycle = function (D, run) {
    if (!run.prog) throw new Error('program');
    run.sim = simulateRun(D, run);
    run.stage = 'cycle';
    return run.sim;
  };
  L.doorAttempt = function (run, t) {
    const locked = L.doorLocked(run.sim, t);
    if (locked) run.events.door++;
    return { locked: locked };
  };
  L.emergencyStop = function (D, run, t) {
    const hadAlarm = run.sim && run.sim.alarm && run.sim.alarmT != null && run.sim.alarmT <= t;
    run.events.estop = { t: t, reason: hadAlarm ? 'alarm' : 'none' };
    if (!hadAlarm && t < run.sim.total) run.sim = simulateRun(D, run, { abortAt: Math.max(1, Math.floor(t)) });
    return run.sim;
  };

  /* ---------- resultat del cicle ---------- */
  L.physical = function (run) {
    const sim = run.sim, p = run.prog;
    if (!sim) return 'none';
    if (sim.aborted) return 'abort';
    const h = sim.holdInfo;
    if (!h) return 'abort';
    if (h.dur < p.hold * 0.98) return 'short';
    if (!L.isStdT(p.T)) return 'nonstd';
    const mh = L.minHold(p.T);
    if (mh != null && h.dur < mh) return 'short';
    if (h.dTheo > 2) return 'air';
    return 'ok';
  };
  L.finishCycle = function (D, run) {
    const sim = run.sim, phys = L.physical(run);
    const eff = run.effects || [];
    const wrappedAny = eff.some((p) => wrapped(p.pkg));
    const glob = [];
    if (run.prog.type === 'N' && wrappedAny) glob.push('type_N');
    if (run.prog.type === 'L' && wrappedAny) glob.push('dry_short');
    if (run.prog.type === 'B' && !sim.aborted && (run.prog.dry || 0) < L.dryNeeded(D, run)) glob.push('dry_short');
    if (sim.aborted && (sim.dryDone || 0) < (run.prog.dry || 0)) glob.push('abort');
    if (run.sc.firstOfDay && !run.checks.preheat && !run.checks.bd.length) glob.push('preheat_no');
    const extOk = sim.series.some((s) => s.T >= 118);
    const globalFail = phys !== 'ok' || !!run.noRecord;
    const packs = eff.map((e) => {
      const sp = sim.packs.find((x) => x.uid === e.uid) || { F: 0, t1: 0, t2: 0, steam: false };
      const wet = e.wet.slice();
      if (wrapped(e.pkg) && e.pkg !== 'box' && e.pkg !== 'foil') glob.forEach((g) => { if (g !== 'preheat_no' || (itemDef(D, e.id).porous || itemDef(D, e.id).heavy)) wet.push(g); });
      let intPass = null;
      if (e.ci >= 4) {
        if (!sp.steam) intPass = false;
        else if (e.ci === 5) intPass = sp.F >= F_CI5;
        else if (e.ci === 4) intPass = sp.t2 >= Math.max(1.5, 0.6 * run.prog.hold);
        else intPass = sp.t1 >= (run.prog.T >= 130 ? (L.minHold(run.prog.T) || 3) + 0.5 : (L.minHold(run.prog.T) || 15));
        if (e.ciForce === 0) intPass = false;
        if (e.ciForce === 1) intPass = true;
      } else if (e.ci === 1) intPass = extOk;
      const ext = wrapped(e.pkg) ? extOk : null;
      const visible = [];
      if (wet.length) visible.push('wet');
      if (e.burst) visible.push('burst');
      if (e.damage) visible.push('damage');
      if (e.ci >= 4 && intPass === false) visible.push('ci');
      if (ext === false) visible.push('ext');
      if (e.pkg === 'none' && itemDef(D, e.id).k !== 'liquid') visible.push('nobarrier');
      const exp = e.damage ? 'withdraw' : (globalFail || visible.length ? 'reprocess' : 'store');
      const sterile = sp.steam && sp.F >= F_BI && !e.hidden.length && !visible.length && !globalFail;
      return { uid: e.uid, id: e.id, pkg: e.pkg, ci: e.ci, bi: e.bi, label: e.label, F: sp.F, t1: sp.t1, air: sp.air, steam: sp.steam, wet: wet, burst: e.burst, damage: e.damage, hidden: e.hidden, grave: e.grave, ext: ext, intPass: intPass, visible: visible, exp: exp, sterile: sterile };
    });
    let bi = null;
    const biPack = packs.find((p) => p.bi);
    if (run.bi && run.bi.forced) bi = { res: run.bi.forced.res, ctrl: run.bi.forced.ctrl };
    else if (biPack) bi = { res: biPack.F >= F_BI ? 'neg' : 'pos', ctrl: 1 };
    run.out = { phys: phys, machineOk: run.machineOk || !sim.aborted, packs: packs, fill: L.fill(D, run), bi: bi, globalFail: globalFail, extOk: extOk };
    if (run.sc.kind === 'run') run.stage = 'unload';
    return run.out;
  };
  /* incubació del biològic: temperatura 57 (55-60 °C) o 37 */
  L.incubate = function (run, temp) {
    run.bi = Object.assign(run.bi || {}, { incubated: true, temp: temp });
    return L.biReading(run);
  };
  L.biReading = function (run) {
    const b = run.out && run.out.bi; if (!b) return null;
    if (run.bi && run.bi.temp === 37) return { test: 'neg', ctrl: 'neg', correct: 'inv' };
    const test = b.res === 'pos' ? 'pos' : 'neg';
    const ctrl = b.ctrl ? 'pos' : 'neg';
    return { test: test, ctrl: ctrl, correct: !b.ctrl ? 'inv' : test };
  };

  /* ---------- preguntes de control ---------- */
  L.questions = function (D, run) {
    const qs = [];
    const sc = run.sc;
    run.checks.bd.forEach((b, i) => qs.push({ id: 'bd' + (i + 1), type: 'bd', idx: i, opts: ['pass', 'fail'], correct: b.pass ? 'pass' : 'fail', w: 1 }));
    if (run.checks.leak) qs.push({ id: 'leak', type: 'leak', opts: ['pass', 'fail'], correct: run.checks.leak.pass ? 'pass' : 'fail', w: 1 });
    if (run.out) {
      if (!run.noRecord) qs.push({ id: 'phys', type: 'phys', opts: ['ok', 'short', 'air', 'abort', 'nonstd'], correct: run.out.phys, w: 1.5 });
      const cis = run.out.packs.filter((p) => p.ci >= 4 && p.steam !== undefined);
      cis.forEach((p) => qs.push({ id: 'ci_' + p.uid, type: 'ci', uid: p.uid, opts: ['pass', 'fail'], correct: p.intPass ? 'pass' : 'fail', w: cis.length ? 2 / cis.length : 1 }));
      if (sc.askExt) qs.push({ id: 'ext', type: 'concept', key: 'ext', opts: [0, 1, 2, 3], correct: 0, w: 1 });
      if (run.out.bi) {
        if (sc.needBI) qs.push({ id: 'bipre', type: 'bipre', opts: ['release', 'quarantine', 'reprocess_all'], correct: 'quarantine', w: 1 });
        if (sc.kind === 'run') qs.push({ id: 'bitemp', type: 'bitemp', opts: [57, 37], correct: 57, w: 1 });
        const rd = L.biReading(run);
        qs.push({ id: 'bi', type: 'bi', opts: ['neg', 'pos', 'inv'], correct: rd ? rd.correct : 'neg', w: 1.5 });
      }
    }
    (sc.q || []).forEach((q) => qs.push({ id: 'x_' + q.id, type: 'extra', q: q, opts: q.o.map((_, i) => i), correct: q.c, w: 1.5 }));
    return qs;
  };
  L.answer = function (run, id, val) { run.answers[id] = val; return run.answers; };

  /* ---------- decisió esperada ---------- */
  L.expected = function (D, run) {
    const req = new Set(['register']), ok = new Set(['notify']), forb = new Set();
    const bds = run.checks.bd, bdFails = bds.filter((b) => !b.pass).length;
    const disp = {};
    const add = (s, arr) => arr.forEach((x) => s.add(x));
    if (run.storage) {
      add(req, ['reprocess_some']); add(forb, ['recall', 'out_of_service', 'use_equipment']);
      run.storage.forEach((p) => { disp[p.uid] = p.exp; });
      return { req: req, ok: ok, forb: forb, disp: disp };
    }
    const noLoad = !run.out;
    if (noLoad) {
      if (!bdFails) { add(req, ['use_equipment']); add(forb, ['out_of_service', 'recall', 'release', 'reprocess_all', 'reprocess_some']); }
      else if (bdFails === 1) { add(req, ['repeat_test']); add(ok, ['out_of_service']); add(forb, ['use_equipment', 'release', 'recall']); }
      else { add(req, ['out_of_service', 'notify']); add(ok, ['repeat_test']); add(forb, ['use_equipment', 'release', 'recall']); }
      return { req: req, ok: ok, forb: forb, disp: disp };
    }
    const o = run.out, rd = L.biReading(run);
    const biPos = rd && rd.correct === 'pos', biInv = rd && rd.correct === 'inv';
    const bdContinued = bdFails > 0;
    if (biPos) {
      add(req, ['out_of_service', 'notify']); add(ok, ['repeat_test', 'quarantine']); add(forb, ['release', 'use_equipment']);
      if (run.sc.kind === 'diag') { req.add('recall'); ok.add('reprocess_all'); } else { req.add('reprocess_all'); ok.add('recall'); }
    } else if (o.phys === 'abort') { add(req, ['reprocess_all', 'notify']); add(ok, ['out_of_service', 'repeat_test']); add(forb, ['release', 'recall']); }
    else if (o.phys === 'air') { add(req, ['reprocess_all', 'out_of_service', 'notify']); add(ok, ['repeat_test']); add(forb, ['release', 'use_equipment', 'recall']); }
    else if (o.phys === 'short' || o.phys === 'nonstd') { add(req, ['reprocess_all']); add(forb, ['release', 'recall']); }
    else if (run.noRecord) { add(req, ['reprocess_all']); add(ok, ['quarantine']); add(forb, ['release', 'recall']); }
    else if (biInv) { add(req, ['repeat_test']); add(ok, ['quarantine']); add(forb, ['recall', 'out_of_service']); if (run.sc.kind === 'run') { req.add('quarantine'); forb.add('release'); } else ok.add('release'); }
    else {
      const bad = o.packs.some((p) => p.exp !== 'store');
      if (bad) { add(req, ['reprocess_some']); add(ok, ['release']); add(forb, ['recall', 'out_of_service']); }
      else { add(req, ['release']); add(forb, ['recall', 'out_of_service']); }
    }
    if (bdContinued) { req.delete('release'); add(req, ['out_of_service', 'notify', 'reprocess_all']); forb.add('release'); ok.delete('release'); }
    if (forb.has('release') && req.has('reprocess_all')) ok.add('reprocess_some');
    o.packs.forEach((p) => { disp[p.uid] = p.damage ? 'withdraw' : (forb.has('release') ? 'reprocess' : p.exp); });
    return { req: req, ok: ok, forb: forb, disp: disp };
  };
  L.setDecision = function (run, codes) { run.decision = codes.slice(); return run.decision; };
  L.setDisp = function (run, uid, v) { run.disp[uid] = v; return run.disp; };
  L.toggleUnload = function (run, id, on) { run.unload[id] = on == null ? !run.unload[id] : !!on; return run.unload; };
  L.useHint = function (run) { run.hints++; return run.hints; };

  /* ---------- puntuació ---------- */
  function cat() { return { pts: 0, max: 0, items: [] }; }
  function addCrit(c, crit, extra) { c.pts += crit.ok * crit.w; c.max += crit.w; c.items.push(Object.assign({ ok: crit.ok, w: crit.w, code: crit.code, k: crit.k }, extra || {})); }

  L.score = function (D, run) {
    const C = { load: cat(), params: cat(), proc: cat(), ctrl: cat(), dec: cat() };
    const graves = [];
    let annul = false;
    const sc = run.sc, isRun = sc.kind === 'run';
    const processed = !!run.out && isRun;

    /* càrrega i envasat */
    if (processed || (isRun && !run.checks.stopped)) {
      run.items.forEach((it) => {
        const crits = L.evalItem(D, run, it);
        const max = crits.reduce((s, c) => s + c.w, 0), got = crits.reduce((s, c) => s + c.ok * c.w, 0);
        const bad = crits.filter((c) => c.ok < 1);
        C.load.pts += got; C.load.max += max;
        C.load.items.push({ ok: max ? got / max : 1, w: max, code: bad.length ? bad[0].code : 'ok', codes: bad.map((c) => c.code), item: it.id, uid: it.uid });
      });
      const fill = L.fill(D, run);
      addCrit(C.load, { k: 'fill', ok: fill <= D.chamber.maxFill ? 1 : 0, w: 1.5, code: fill <= D.chamber.maxFill ? 'fill_ok' : 'overload' }, { val: fill });
      if (sc.needBI) addCrit(C.load, { k: 'bi', ok: L.loaded(run).some((it) => it.ch.bi) ? 1 : 0, w: 1.5, code: L.loaded(run).some((it) => it.ch.bi) ? 'ok' : 'bi_missing' });
      L.evalProgram(D, run).forEach((c) => addCrit(C.params, c));
    }
    /* procediment */
    if (isRun) {
      const ch = run.checks;
      addCrit(C.proc, { k: 'water', ok: ch.water ? 1 : 0, w: 1, code: ch.water ? 'ok' : 'water_no' });
      if (run.v.water === 'low' || ch.refill) {
        let ok = 1, code = 'ok';
        if (ch.refill === 'tap') { ok = 0; code = 'water_tap'; }
        else if (!ch.refill) { ok = 0; code = 'water_low'; }
        addCrit(C.proc, { k: 'refill', ok: ok, w: 1, code: code });
      }
      addCrit(C.proc, { k: 'clean', ok: ch.clean ? 1 : 0, w: 1, code: ch.clean ? 'ok' : 'clean_no' });
      if (sc.firstOfDay) {
        addCrit(C.proc, { k: 'preheat', ok: ch.preheat ? 1 : 0, w: 1, code: ch.preheat ? 'ok' : 'preheat_no' });
        const bd = ch.bd;
        let ok = 0, code = 'bd_missing';
        if (bd.length) { ok = bd[0].place === 'empty' ? 1 : 0.5; code = bd[0].place === 'empty' ? 'ok' : 'bd_place'; }
        addCrit(C.proc, { k: 'bd', ok: ok, w: 2, code: code });
        if (bd.some((b) => !b.pass)) {
          const acts = ch.bdActions;
          let aok = 1, acode = 'ok';
          if (acts.indexOf('continue') >= 0 || (!ch.stopped && run.out)) { aok = 0; acode = 'bd_ignored'; }
          else if (acts[0] === 'stop') { aok = 0.5; acode = 'bd_norepeat'; }
          else if (!ch.stopped) { aok = 0; acode = 'bd_ignored'; }
          addCrit(C.proc, { k: 'bdact', ok: aok, w: 2, code: acode });
        }
      }
      if (run.sim) {
        const es = run.events.estop;
        addCrit(C.proc, { k: 'estop', ok: es && es.reason === 'none' ? 0 : 1, w: 0.5, code: es && es.reason === 'none' ? 'estop' : 'ok' });
      }
      if (processed) {
        let got = 0; const need = D.unload.filter((u) => u.ok);
        need.forEach((u) => { if (run.unload[u.id]) got += 0.5; else C.proc.items.push({ ok: 0, w: 0, code: 'unload_miss', ref: u.id }); });
        D.unload.filter((u) => !u.ok).forEach((u) => { if (run.unload[u.id]) { got -= 0.5; C.proc.items.push({ ok: 0, w: 0, code: 'unload_bad', ref: u.id }); } });
        C.proc.pts += Math.max(0, got); C.proc.max += need.length * 0.5;
      }
      if (run.events.door > 0) graves.push('door_open');
      (run.out ? run.out.packs : []).forEach((p) => { if (p.grave && graves.indexOf(p.grave) < 0) graves.push(p.grave); });
    }
    /* controls */
    L.questions(D, run).forEach((q) => {
      const a = run.answers[q.id];
      const ok = a !== undefined && String(a) === String(q.correct) ? 1 : 0;
      addCrit(C.ctrl, { k: q.id, ok: ok, w: q.w, code: ok ? 'ok' : 'ans' }, { q: q.id, given: a, correct: q.correct });
    });
    /* decisió i seguretat */
    const ex = L.expected(D, run);
    const chosen = new Set(run.decision);
    let dp = 0;
    const reqArr = Array.from(ex.req);
    reqArr.forEach((c) => { if (chosen.has(c)) dp += 3 / reqArr.length; else C.dec.items.push({ ok: 0, w: 0, code: 'dec_miss', ref: c }); });
    chosen.forEach((c) => {
      if (ex.forb.has(c)) { dp -= 1.5; C.dec.items.push({ ok: 0, w: 0, code: 'dec_forb', ref: c }); }
      else if (!ex.req.has(c) && !ex.ok.has(c)) { dp -= 0.25; C.dec.items.push({ ok: 0, w: 0, code: 'dec_extra', ref: c }); }
    });
    C.dec.pts += Math.max(0, dp); C.dec.max += 3;
    if (chosen.has('release') && ex.forb.has('release')) annul = true;
    const dispKeys = Object.keys(ex.disp);
    dispKeys.forEach((uid) => {
      const given = run.disp[uid], want = ex.disp[uid];
      const ok = given === want ? 1 : 0;
      addCrit(C.dec, { k: 'disp', ok: ok, w: 0.5, code: ok ? 'ok' : 'disp' }, { ref: uid, given: given, correct: want });
      if (given === 'store' && want !== 'store') {
        const p = run.out ? run.out.packs.find((x) => x.uid === uid) : null;
        if (!p || p.visible.length || ex.forb.has('release')) annul = true;
      }
    });
    if (annul) graves.unshift('grave_release');

    const W = isRun ? CAT_W : { ctrl: 0.5, dec: 0.5, load: 0, params: 0, proc: 0 };
    let sw = 0, acc = 0;
    Object.keys(C).forEach((k) => { if (C[k].max > 0 && W[k] > 0) { sw += W[k]; acc += W[k] * (C[k].pts / C[k].max); } });
    let s10 = sw ? (acc / sw) * 10 : 0;
    const graveN = graves.filter((g) => g !== 'grave_release').length;
    s10 -= 3 * graveN;
    if (run.mode === 'exam') s10 -= 0.5 * run.hints;
    if (annul) s10 = 0;
    s10 = r1(clamp(s10, 0, 10));
    const cats = {};
    Object.keys(C).forEach((k) => { cats[k] = { pts: r2(C[k].pts), max: r2(C[k].max), pct: C[k].max ? Math.round((C[k].pts / C[k].max) * 100) : null, items: C[k].items }; });
    return { score10: s10, cats: cats, graves: graves, annul: annul, expected: { req: Array.from(ex.req), ok: Array.from(ex.ok), forb: Array.from(ex.forb), disp: ex.disp }, hints: run.hints };
  };

  L.grade = function (s) { return s >= 9 ? 'excellent' : s >= 7 ? 'good' : s >= 5 ? 'pass' : 'fail'; };

  /* ---------- examen: sorteig equilibrat i nota global ---------- */
  L.drawExam = function (D, rng, n) {
    n = n || 5;
    const runs = shuffle(rng, D.scenarios.filter((s) => s.kind === 'run'));
    const pickRuns = [];
    for (const s of runs) { if (pickRuns.length >= 2) break; if (s.level === 3 && pickRuns.some((x) => x.level === 3)) continue; pickRuns.push(s); }
    const groups = ['equip', 'pack', 'bio'];
    const diags = groups.map((g) => pick(rng, D.scenarios.filter((s) => s.kind === 'diag' && s.group === g)));
    const order = [pickRuns[0], diags[0], pickRuns[1], diags[1], diags[2]].filter(Boolean);
    return order.slice(0, n).map((s) => s.id);
  };
  L.examSummary = function (results) {
    const cats = {};
    let sum = 0;
    results.forEach((r) => {
      sum += r.score10;
      Object.keys(r.cats).forEach((k) => { cats[k] = cats[k] || { pts: 0, max: 0 }; cats[k].pts += r.cats[k].pts; cats[k].max += r.cats[k].max; });
    });
    Object.keys(cats).forEach((k) => { cats[k].pct = cats[k].max ? Math.round((cats[k].pts / cats[k].max) * 100) : null; });
    return { score10: results.length ? r1(sum / results.length) : 0, cats: cats, graves: results.reduce((a, r) => a.concat(r.graves), []) };
  };
  /* envia la nota al campus una sola vegada */
  L.reportOnce = function (holder, link, score10) {
    if (!holder || holder.sent || !link || typeof link.finish !== 'function') return false;
    holder.sent = true;
    try { link.finish(score10); } catch (e) { /* sense enllaç */ }
    return true;
  };

  /* ---------- tiquet d'impressora ---------- */
  function hms(s) { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600) % 24, m = Math.floor((s % 3600) / 60), x = s % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); }
  function mmss(min) { const s = Math.round(min * 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  L.hms = hms; L.mmss = mmss;
  L.ticket = function (D, run, sim, lang, kind) {
    const T = D.ticket[lang === 'es' ? 'es' : 'ca'];
    const ph = D.phases;
    const li = lang === 'es' ? 1 : 0;
    const m = run.meta, st = m.start;
    const lines = [];
    const fmt = (x, d) => (lang === 'es' || lang === 'ca' ? x.toFixed(d).replace('.', ',') : x.toFixed(d));
    lines.push(T.head); lines.push(D.meta.equip[li].split(' · ').slice(0, 2).join(' · ').toUpperCase());
    lines.push(T.date + ' ' + m.date + '   ' + T.cycle + ' ' + m.cycle);
    let progName = T.manual;
    if (kind === 'bd') progName = D.testPrograms.bd.n[li];
    else if (kind === 'leak') progName = D.testPrograms.leak.n[li];
    else if (run.prog && run.prog.id !== 'manual') { const pr = D.programs.find((x) => x.id === run.prog.id); if (pr) progName = pr.n[li]; }
    lines.push(T.prog + ' ' + progName);
    if (kind !== 'leak') {
      const p = kind === 'bd' ? D.testPrograms.bd : run.prog;
      lines.push(T.set + ' ' + p.T + ' °C · ' + mmss(p.hold) + ' min · ' + T.dry + ' ' + p.dry + ' min · ' + (p.type === 'N' ? T.typeN : p.type === 'L' ? T.typeL : T.typeB));
    }
    lines.push(T.op + ' ' + m.op + (kind ? '' : '   ' + T.lot + ' ' + m.lot));
    lines.push('--------------------------------------');
    lines.push(T.cols);
    sim.phases.forEach((p) => {
      const s = L.at(sim, p.t0);
      lines.push(hms(st + p.t0) + '  ' + (ph[p.id] ? ph[p.id][li] : p.id).slice(0, 22).padEnd(22) + ' ' + fmt(s.T, 1).padStart(6) + ' ' + fmt(s.P, 2).padStart(6));
    });
    lines.push('--------------------------------------');
    if (kind === 'leak') {
      lines.push(T.leakRate + ' ' + fmt(sim.leakRate, 1) + ' mbar/min (' + T.limit + ' 1,3)');
      lines.push(sim.leakRate <= 1.3 ? T.okLeak : T.badLeak);
      return lines;
    }
    const h = sim.holdInfo;
    if (h) {
      lines.push(T.plateau + ' ' + hms(st + h.start) + ' → ' + hms(st + h.end));
      lines.push('  ' + T.tminmax + ' ' + fmt(h.Tmin, 1) + ' / ' + fmt(h.Tmax, 1) + ' °C');
      lines.push('  ' + T.pminmax + ' ' + fmt(h.Pmin, 2) + ' / ' + fmt(h.Pmax, 2) + ' bar');
      lines.push('  ' + T.dur + ' ' + mmss(h.dur) + ' min');
    }
    if (sim.dryDone) lines.push(T.dryDone + ' ' + mmss(sim.dryDone) + ' min');
    lines.push(T.end + ' ' + hms(st + sim.total));
    if (sim.aborted) lines.push('*** ' + T.bad + ' · ' + T.alarm + ': ' + (T['al_' + sim.alarm] || sim.alarm) + ' ***');
    else lines.push('*** ' + T.good + ' ***');
    if (kind === 'bd') lines.push(T.bdNote);
    lines.push(T.sign);
    return lines;
  };

  /* validació de dades (tests) */
  L.validateData = function (D) {
    const errs = [];
    const has2 = (x) => Array.isArray(x) && x.length === 2 && x.every((s) => typeof s === 'string' && s.length > 0);
    Object.keys(D.items).forEach((k) => { if (!has2(D.items[k].n)) errs.push('item ' + k); (D.items[k].packs || []).forEach((p) => { if (!D.packs[p]) errs.push('pack ' + k + ' ' + p); }); });
    D.scenarios.forEach((s) => {
      if (!has2(s.t) || !has2(s.brief) || !has2(s.hint)) errs.push('scenario text ' + s.id);
      (s.cart || []).forEach((c) => { if (!D.items[c[0]]) errs.push('cart ' + s.id + ' ' + c[0]); });
      if (s.kind === 'diag' && s.setup && s.setup.load && !D.loads[s.setup.load]) errs.push('load ' + s.id);
      (s.q || []).forEach((q) => { if (!has2(q.q) || !q.o.every(has2)) errs.push('q ' + s.id); });
    });
    Object.keys(D.M).forEach((k) => { if (!Array.isArray(D.M[k]) || D.M[k].length !== 4) errs.push('M ' + k); });
    Object.keys(D.decisions).forEach((k) => { if (!has2(D.decisions[k]) || !has2(D.decWhy[k])) errs.push('dec ' + k); });
    const ids = D.scenarios.map((s) => s.id); if (new Set(ids).size !== ids.length) errs.push('dup ids');
    return errs;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  else root.ToolLogic = L;
})(this);
