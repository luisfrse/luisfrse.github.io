'use strict';
/* Triatge START · lògica de la simulació (UMD, sense DOM; provada amb node:test).
   - Algorisme START (adults) i JumpSTART (infants d'1 a 8 anys aprox.).
   - Generador determinista d'escenaris amb llavor (mulberry32 + FNV-1a).
   - Motor de joc per accions amb cost de temps (segons simulats), deteriorament, morts evitables,
     arribada d'ambulàncies, càrrega, destinació i evacuació.
   - Avaluació: matriu de confusió, infratriatge/sobretriatge, competències i nota sobre 10, assoliments.
   Llindars orientatius (varien segons la font): FR > 30/min; reompliment capil·lar > 2 s o sense pols radial;
   JumpSTART: FR < 15 o > 45; sense pols perifèric; AVPU «P» inadequat o «U». */
(function (root) {
  const CATS = ['red', 'yellow', 'green', 'black'];
  const PRIO = { red: 0, yellow: 1, green: 2, black: 3 };
  const RANK = { green: 0, yellow: 1, red: 2 };
  const RR_LIMIT = 30, CRT_LIMIT = 2, J_RR_LOW = 15, J_RR_HIGH = 45;
  /* Cost de cada acció en segons simulats */
  const COST = {
    walk: 5, breath: 10, airway: 5, rr15: 15, rr30: 30, radial: 5, crt: 5, mental: 5, rescue: 10,
    tag: 5, pressure: 20, tourniquet: 30, position: 20, cpr: 120, secondary: 120,
    walkCall: 45, load: 5, dispatch: 15, protect: 15, alert: 45, hazards: 20, rushIn: 0, moveAll: 60
  };
  const CHECKS = ['walk', 'breath', 'rr15', 'rr30', 'radial', 'crt', 'mental'];
  const DOS = ['airway', 'rescue', 'pressure', 'tourniquet', 'position', 'cpr', 'secondary'];
  const SAFETY_GOOD = ['protect', 'alert', 'hazards'];
  const SAFETY_BAD = ['rushIn', 'moveAll'];
  const WALK_SPEED = 1.4, TORTUOSITY = 1.2, M_PER_UNIT = 0.1;
  const WEIGHTS = { algorithm: 0.40, speed: 0.15, interventions: 0.15, organization: 0.20, safety: 0.10 };
  const DEATH_PENALTY = 0.75;
  const CAT_WEIGHT = { red: 2, yellow: 1.5, green: 1, black: 1 };
  const DEAD = { walk: false, br: false, airwayFix: false, rr: 0, radial: false, crt: 6, obeys: false, avpu: 'U', rescueFix: false };
  const DIFF = {
    easy: { first: 360, gap: 120, spare: 3, bleedDeath: 600, airwayDeath: 900, redMargin: 900, yellowWorsen: 1320, worsenDeath: 1080, greenHidden: false, hiddenAt: 0, hotClear: 180, tMax: 2400, near: false, hotCount: 1, card: 15 },
    normal: { first: 480, gap: 150, spare: 2, bleedDeath: 480, airwayDeath: 720, redMargin: 600, yellowWorsen: 1200, worsenDeath: 900, greenHidden: true, hiddenAt: 960, hotClear: 300, tMax: 2700, near: false, hotCount: 2, card: 10 },
    hard: { first: 600, gap: 180, spare: 1, bleedDeath: 420, airwayDeath: 600, redMargin: 420, yellowWorsen: 900, worsenDeath: 720, greenHidden: true, hiddenAt: 840, hotClear: 420, tMax: 3000, near: true, hotCount: 3, card: 6 }
  };
  const ACHIEVEMENTS = ['noDeaths', 'noUnder', 'perfect', 'fast', 'megaphone', 'bleeds', 'airway', 'evac', 'retriage', 'safe'];

  /* ---------- utilitats ---------- */
  function hashSeed(s) {
    s = String(s); let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function seeded(seed) {
    let a = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0 || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rint = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const round1 = (x) => Math.round(x * 10) / 10;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function median(a) { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  /* segons per recórrer una distància (unitats del mapa) caminant amb precaució entre restes */
  const travelSec = (d) => Math.max(3, Math.round(d * M_PER_UNIT * TORTUOSITY / WALK_SPEED));
  function seedCode(rng) {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
    for (let i = 0; i < 6; i++) { s += A[Math.floor(rng() * A.length)]; if (i === 2) s += '-'; }
    return s;
  }

  /* ---------- algorismes ---------- */
  /* START (adults). p: {walk, br, airwayFix, rr, radial, crt, obeys}. Retorna {cat, step, path} */
  function classifyStart(p) {
    if (p.walk) return { cat: 'green', step: 'walk', path: ['walk'] };
    const path = ['walk', 'breath'];
    if (!p.br) { path.push('airway'); return p.airwayFix ? { cat: 'red', step: 'airway', path: path } : { cat: 'black', step: 'noBreath', path: path }; }
    path.push('rr');
    if (p.rr > RR_LIMIT) return { cat: 'red', step: 'rr', path: path };
    path.push('perf');
    if (!p.radial || p.crt > CRT_LIMIT) return { cat: 'red', step: 'perf', path: path };
    path.push('mental');
    if (!p.obeys) return { cat: 'red', step: 'mental', path: path };
    return { cat: 'yellow', step: 'stable', path: path };
  }
  /* JumpSTART (infants). p: {walk, br, airwayFix, radial (pols perifèric), rescueFix, rr, avpu} */
  function classifyJump(p) {
    if (p.walk) return { cat: 'green', step: 'walk', path: ['walk'] };
    const path = ['walk', 'breath'];
    if (!p.br) {
      path.push('airway');
      if (p.airwayFix) return { cat: 'red', step: 'airway', path: path };
      path.push('pulse');
      if (!p.radial) return { cat: 'black', step: 'noPulse', path: path };
      path.push('rescue');
      return p.rescueFix ? { cat: 'red', step: 'rescue', path: path } : { cat: 'black', step: 'noBreath', path: path };
    }
    path.push('rr');
    if (p.rr < J_RR_LOW || p.rr > J_RR_HIGH) return { cat: 'red', step: 'rr', path: path };
    path.push('perf');
    if (!p.radial) return { cat: 'red', step: 'perf', path: path };
    path.push('mental');
    if (p.avpu === 'U' || p.avpu === 'Pi') return { cat: 'red', step: 'mental', path: path };
    return { cat: 'yellow', step: 'stable', path: path };
  }
  /* Classificació actual d'una víctima del joc (té en compte la via aèria ja oberta i la mort) */
  function classify(v) {
    if (v.st && v.st.dead) return { cat: 'black', step: v.ped ? 'noBreath' : 'noBreath', path: ['walk', 'breath', 'airway'] };
    if (v.st && v.st.rescueEver) return { cat: 'red', step: 'rescue', path: ['walk', 'breath', 'airway', 'pulse', 'rescue'] };
    if (v.st && v.st.airwayEver) return { cat: 'red', step: 'airway', path: ['walk', 'breath', 'airway'] };
    return v.ped ? classifyJump(v.phys) : classifyStart(v.phys);
  }
  /* Crèdit d'una etiqueta respecte de la real: encert 1; sobretriatge d'un nivell 0,5, de dos 0,25;
     negre real etiquetat vermell 0,25; infratriatge (o negre a una víctima viva) 0. */
  function creditOf(truth, tag) {
    if (!tag) return 0;
    if (tag === truth) return 1;
    if (truth === 'black') return tag === 'red' ? 0.25 : 0;
    if (tag === 'black') return 0;
    const d = RANK[tag] - RANK[truth];
    return d === 1 ? 0.5 : d === 2 ? 0.25 : 0;
  }
  /* 'under' (infratriatge), 'over' (sobretriatge), 'ok' o null */
  function errorKind(truth, tag) {
    if (!tag) return null;
    if (tag === truth) return 'ok';
    if (truth === 'black') return 'over';
    if (tag === 'black') return 'under';
    return RANK[tag] > RANK[truth] ? 'over' : 'under';
  }

  /* ---------- generador ---------- */
  function composition(n) {
    const black = n >= 16 ? 2 : 1;
    const red = Math.round(n * 0.28);
    const yellow = Math.round(n * 0.25);
    return { black: black, red: red, yellow: yellow, green: n - black - red - yellow };
  }
  const RED_ROUTES = ['bleed', 'airway', 'rr', 'mental', 'shock', 'rr', 'bleed'];
  function physFor(route, rng, near) {
    const base = { walk: false, br: true, airwayFix: false, rr: 18, rrAfter: 0, radial: true, crt: 1, obeys: true, avpu: 'A', rescueFix: false };
    const p = Object.assign({}, base);
    switch (route) {
      case 'walk': p.walk = true; p.rr = rint(rng, 14, 24); p.crt = rint(rng, 1, 2); break;
      case 'yellow': p.rr = near && rng() < 0.6 ? rint(rng, 27, 29) : rint(rng, 14, 26); p.crt = near && rng() < 0.5 ? 2 : rint(rng, 1, 2); break;
      case 'airway': p.br = false; p.airwayFix = true; p.rr = 0; p.rrAfter = rint(rng, 8, 16); p.crt = 2; p.obeys = false; p.avpu = 'U'; break;
      case 'rr': p.rr = near && rng() < 0.6 ? rint(rng, 31, 33) : rint(rng, 32, 42); p.crt = rint(rng, 1, 2); p.obeys = rng() < 0.6; p.avpu = p.obeys ? 'A' : 'V'; break;
      case 'bleed': case 'bleedJunction': p.rr = rint(rng, 20, 28); if (rng() < 0.6) { p.radial = false; p.crt = rint(rng, 3, 4); } else { p.crt = near ? 3 : rint(rng, 3, 4); } break;
      case 'shock': p.rr = rint(rng, 20, 28); if (rng() < 0.5) { p.radial = false; p.crt = rint(rng, 3, 4); } else { p.crt = 3; } break;
      case 'mental': p.rr = rint(rng, 14, 26); p.crt = rint(rng, 1, 2); p.obeys = false; p.avpu = 'V'; break;
      case 'black': Object.assign(p, DEAD); p.rrAfter = 0; break;
      case 'jWalk': p.walk = true; p.rr = rint(rng, 20, 30); break;
      case 'jRr': p.rr = rng() < 0.75 ? rint(rng, 48, 56) : rint(rng, 9, 12); p.avpu = 'V'; break;
      case 'jRescue': p.br = false; p.rr = 0; p.rrAfter = rint(rng, 14, 20); p.rescueFix = true; p.obeys = false; p.avpu = 'U'; break;
      case 'jMental': p.rr = rint(rng, 20, 34); p.avpu = rng() < 0.5 ? 'U' : 'Pi'; p.obeys = false; break;
      case 'jYellow': p.rr = rint(rng, 20, 34); p.avpu = 'A'; break;
      default: throw new Error('via desconeguda: ' + route);
    }
    if (p.rr === 30) p.rr = 29;   /* el valor límit exacte no surt: amb comptatge de 15 s seria ambigu */
    return p;
  }
  const TPL_OF = { walk: 'walk', yellow: 'yellow', airway: 'airway', rr: 'rr', bleed: 'bleed', bleedJunction: 'bleedJunction', shock: 'shock', mental: 'mental', black: 'black', jWalk: 'jWalk', jRr: 'jRr', jRescue: 'jRescue', jMental: 'jMental', jYellow: 'jYellow' };
  const isPedRoute = (r) => r.charAt(0) === 'j';

  function normOpts(D, opts) {
    opts = opts || {};
    const keys = Object.keys(D.SETTINGS);
    const difficulty = DIFF[opts.difficulty] ? opts.difficulty : 'normal';
    const n = Math.max(10, Math.min(20, Math.round(Number(opts.n) || 14)));
    const seed = opts.seed !== undefined && opts.seed !== null && String(opts.seed).trim() ? String(opts.seed).trim().toUpperCase() : seedCode(seeded(Date.now() ^ Math.floor(Math.random() * 1e9)));
    let setting = opts.setting;
    if (keys.indexOf(setting) < 0) setting = keys[hashSeed('S|' + seed) % keys.length];
    return { setting: setting, seed: seed, n: n, difficulty: difficulty, kids: !!opts.kids, guided: !!opts.guided };
  }

  /* Genera un escenari complet (objecte pla i serialitzable) */
  function generate(D, opts) {
    const o = normOpts(D, opts);
    const S = D.SETTINGS[o.setting], C = D.COLD, df = DIFF[o.difficulty];
    const rng = seeded([o.seed, o.setting, o.n, o.difficulty, o.kids ? 'k' : '-'].join('|'));
    const comp = composition(o.n);
    let routes = [];
    const reds = RED_ROUTES.slice(0, comp.red);
    if (o.difficulty === 'hard' && comp.red >= 5) reds[4] = 'bleedJunction';
    reds.forEach((r) => routes.push(r));
    for (let i = 0; i < comp.yellow; i++) routes.push('yellow');
    for (let i = 0; i < comp.green; i++) routes.push('walk');
    for (let i = 0; i < comp.black; i++) routes.push('black');
    if (o.kids) {
      const swap = (from, to) => { const i = routes.indexOf(from); if (i >= 0) routes[i] = to; };
      swap('walk', 'jWalk'); swap('yellow', 'jYellow');
      const lastRr = routes.lastIndexOf('rr'); if (lastRr >= 0) routes[lastRr] = rng() < 0.5 ? 'jRr' : 'jRescue';
      if (o.n >= 16) swap('mental', 'jMental');
    }
    routes = shuffle(routes, rng);
    /* marques de deteriorament */
    const yIdx = routes.indexOf('yellow');
    const gIdx = df.greenHidden ? routes.indexOf('walk') : -1;

    /* posicions */
    const spots = S.spots.map((s) => ({ x: s[0], y: s[1], hot: inPoly(s[0], s[1], S.hot) }));
    const hotSpots = shuffle(spots.filter((s) => s.hot), rng), warmSpots = shuffle(spots.filter((s) => !s.hot), rng);
    const hotEligible = shuffle(routes.map((r, i) => i).filter((i) => ['yellow', 'rr', 'mental', 'black', 'walk'].indexOf(routes[i]) >= 0 && i !== gIdx), rng);
    const hotSet = {}; hotEligible.slice(0, Math.min(df.hotCount, hotSpots.length)).forEach((i) => { hotSet[i] = true; });

    const victims = routes.map(function (route, i) {
      const ped = isPedRoute(route);
      const tplList = D.TEMPLATES[TPL_OF[route]];
      const ti = Math.floor(rng() * tplList.length), tpl = tplList[ti];
      const spot = hotSet[i] ? hotSpots.shift() : warmSpots.shift();
      const phys = physFor(route, rng, df.near);
      const v = {
        id: 'v' + (i + 1), num: i + 1, route: route, ped: ped,
        age: ped ? rint(rng, 3, 8) : rint(rng, 18, 84), sex: rng() < 0.5 ? 'f' : 'm',
        x: spot.x + rint(rng, -12, 12), y: spot.y + rint(rng, -12, 12), hot: !!hotSet[i],
        tpl: TPL_OF[route] + ':' + ti, desc: tpl.d, site: tpl.site || 'trunk', post: tpl.post || 'lie', bleed: tpl.bleed || 'none',
        look: { skin: rint(rng, 0, 3), cloth: rint(rng, 0, 5), hair: rint(rng, 0, 3), angle: rint(rng, -50, 50) },
        phys: phys, course: [], needsAirway: route === 'airway' || route === 'jRescue',
        worsen: i === yIdx, hidden: i === gIdx
      };
      v.cat0 = (ped ? classifyJump(phys) : classifyStart(phys)).cat;
      return v;
    });

    /* ambulàncies */
    const nAmb = comp.red + comp.yellow + df.spare;
    const ambulances = [];
    for (let k = 0; k < nAmb; k++) {
      const kind = k % 3 === 0 ? 'SVA' : 'SVB';
      ambulances.push({ id: 'A' + (k + 1), kind: kind, at: df.first + df.gap * k, stretchers: 1, seats: kind === 'SVB' ? 1 : 0 });
    }
    ambulances.push({ id: 'BUS', kind: 'BUS', at: df.first + df.gap * 4 + 120, stretchers: 0, seats: 12 });
    ambulances.sort((a, b) => a.at - b.at);

    /* curs clínic */
    const redVictims = victims.filter((v) => v.cat0 === 'red');
    /* Termini sense evacuació: prou ampli perquè, si els vermells surten primer (en qualsevol ordre), tots arribin a temps */
    const stretcherAmbs = ambulances.filter((a) => a.stretchers > 0);
    const redDeadline = (stretcherAmbs[Math.min(stretcherAmbs.length - 1, comp.red + 1)] || stretcherAmbs[stretcherAmbs.length - 1]).at + df.redMargin;
    redVictims.forEach(function (v) {
      if (v.route === 'bleed' || v.route === 'bleedJunction') v.course.push({ at: df.bleedDeath + rint(rng, 0, 60), kind: 'die', unless: 'bleedCtrl', cause: 'bleed' });
      if (v.needsAirway) v.course.push({ at: df.airwayDeath, kind: 'die', unless: 'airwayEver', cause: 'airway' });
      v.course.push({ at: redDeadline + rint(rng, 0, 120), kind: 'die', cause: 'untreated' });
    });
    victims.forEach(function (v) {
      if (v.worsen) {
        v.course.push({ at: df.yellowWorsen, kind: 'worsen', set: { radial: false, crt: 3, rr: rint(rng, 24, 28) }, cause: 'shock' });
        v.course.push({ at: df.yellowWorsen + df.worsenDeath, kind: 'die', cause: 'untreated' });
      }
      if (v.hidden) {
        v.course.push({ at: df.hiddenAt, kind: 'worsen', set: { walk: false, radial: false, crt: 3, rr: rint(rng, 22, 28) }, cause: 'hidden' });
        v.course.push({ at: df.hiddenAt + df.worsenDeath + 120, kind: 'die', cause: 'untreated' });
      }
      v.course.sort((a, b) => a.at - b.at);
    });

    const caps = { H1: Math.max(2, comp.red - 1), H2: comp.yellow + 3, H3: 99 };
    return {
      v: 2, setting: o.setting, seed: o.seed, n: o.n, difficulty: o.difficulty, kids: o.kids, guided: o.guided,
      composition: comp, hotClearAt: df.hotClear, tMax: df.tMax,
      start: { x: C.start.x, y: C.start.y },
      ambulances: ambulances,
      hospitals: D.HOSPITALS.map((h) => ({ id: h.id, kind: h.kind, cap: caps[h.id] })),
      victims: victims
    };
  }
  function bankScenario(D, i) { const b = D.BANK[((i % D.BANK.length) + D.BANK.length) % D.BANK.length]; return generate(D, b); }
  /* Tria justa: tots els escenaris del banc tenen la mateixa composició; elecció uniforme */
  function pickBank(D, rng) { const i = Math.floor((rng || Math.random)() * D.BANK.length); return { index: i, scenario: bankScenario(D, i) }; }

  /* ---------- motor de joc ---------- */
  function createGame(sc, opts) {
    opts = opts || {};
    const s = clone(sc);
    const g = {
      sc: s, mode: opts.mode || 'practice', t: 0, over: false, endReason: null,
      rescuer: { x: s.start.x, y: s.start.y, at: null },
      walkCallT: null, firstIndivT: null, safety: null, hotCleared: s.hotClearAt <= 0, hotAttempts: 0,
      victims: s.victims.map(function (v) {
        v.st = { tags: [], firstTag: null, done: {}, results: {}, airwayOpen: false, airwayEver: false, airwayTried: false, rescueEver: false, positioned: false,
          bleedCtrl: false, unatt: 0, apneaSince: null, dead: false, diedAt: null, cause: null, worsened: [], atStation: false, stationAt: null,
          atCCP: false, evac: null, loadedIn: null, arrivedAt: null, timeSpent: 0, interventions: [] };
        v.course.forEach((e) => { e.done = false; });
        return v;
      }),
      ambs: s.ambulances.map((a) => Object.assign({}, a, { status: 'scheduled', load: [], idle: 0, arrivedT: null, leftT: null, dest: null })),
      hosp: {}, idle: 0, log: [], dispatches: [], route: [{ t: 0, x: s.start.x, y: s.start.y, at: null }],
      flags: { cpr: 0, secondary: 0, unneeded: 0 }, ccpCount: 0, stationCount: { red: 0, yellow: 0, green: 0, black: 0 }
    };
    s.hospitals.forEach((h) => { g.hosp[h.id] = { id: h.id, kind: h.kind, cap: h.cap, used: 0 }; });
    return g;
  }
  const vById = (g, id) => g.victims.find((v) => v.id === id) || null;
  const lastTag = (v) => (v.st.tags.length ? v.st.tags[v.st.tags.length - 1].cat : null);
  const truthOf = (v) => classify(v).cat;
  function ccpSlot(g, k, D) {
    const c = (D && D.COLD && D.COLD.ccp) || { x: 1400, y: 495, w: 320, h: 150 };
    const cols = 6, col = k % cols, row = Math.floor(k / cols) % 4;
    return { x: c.x - c.w / 2 + 30 + col * ((c.w - 60) / (cols - 1)), y: c.y - c.h / 2 + 28 + row * 32 };
  }
  const STATION_POS = { red: { x: 1315, y: 340, w: 150, h: 100 }, yellow: { x: 1485, y: 340, w: 150, h: 100 }, green: { x: 1400, y: 495, w: 320, h: 150 }, black: { x: 1520, y: 660, w: 120, h: 80 } };
  function stationSlot(cat, k) {
    const s = STATION_POS[cat]; const cols = cat === 'green' ? 6 : 3;
    const col = k % cols, row = Math.floor(k / cols) % 3;
    return { x: s.x - s.w / 2 + 24 + col * ((s.w - 48) / Math.max(1, cols - 1)), y: s.y - s.h / 2 + 24 + row * 26 };
  }
  function ev(events, g, type, o) { const e = Object.assign({ t: g.t, type: type }, o || {}); events.push(e); return e; }

  function die(g, v, cause, events) {
    v.st.dead = true; v.st.diedAt = g.t; v.st.cause = cause;
    v.phys = Object.assign({}, v.phys, DEAD);
    if (v.st.loadedIn) { const a = g.ambs.find((x) => x.id === v.st.loadedIn); if (a) a.load = a.load.filter((l) => l.id !== v.id); v.st.loadedIn = null; }
    ev(events, g, 'die', { id: v.id, cause: cause, preventable: v.cat0 !== 'black' });
  }
  function readyForEvac(g, v) { return v.st.atStation && !v.st.evac && !v.st.dead && !v.st.loadedIn && v.st.tags.length && lastTag(v) !== 'black'; }
  function freeSlots(a) { const st = a.load.filter((l) => l.slot === 'stretcher').length, se = a.load.filter((l) => l.slot === 'seat').length; return { stretcher: a.stretchers - st, seat: a.seats - se }; }

  function tick(g, events) {
    g.t += 1; const t = g.t;
    if (!g.hotCleared && t >= g.sc.hotClearAt) { g.hotCleared = true; ev(events, g, 'hotClear'); }
    g.ambs.forEach(function (a) { if (a.status === 'scheduled' && a.at <= t) { a.status = 'waiting'; a.arrivedT = t; ev(events, g, 'ambArrive', { amb: a.id, kind: a.kind }); } });
    g.victims.forEach(function (v) {
      const st = v.st; if (st.evac || st.dead) return;
      for (let i = 0; i < v.course.length; i++) {
        const e = v.course[i]; if (e.done || e.at > t) continue; e.done = true;
        if (e.unless && st[e.unless]) continue;
        if (e.kind === 'worsen') { Object.assign(v.phys, e.set); st.worsened.push(t); ev(events, g, 'worsen', { id: v.id, cause: e.cause }); }
        else if (e.kind === 'die') { die(g, v, e.cause, events); return; }
      }
      if (st.airwayEver) {
        const attended = g.rescuer.at === v.id || st.atStation;
        if (st.airwayOpen && !st.positioned && !attended) {
          st.unatt += 1;
          if (st.unatt >= 180) { st.airwayOpen = false; v.phys.br = false; st.apneaSince = t; st.unatt = 0; ev(events, g, 'airwayLost', { id: v.id }); }
        }
        if (!st.airwayOpen && st.apneaSince !== null && t - st.apneaSince >= 240) { die(g, v, 'airway', events); return; }
      }
      if (st.stationAt !== null && !st.atStation && t >= st.stationAt) {
        const cat = lastTag(v); st.atStation = true;
        if (!st.atCCP || cat !== 'green') { const p = stationSlot(cat, g.stationCount[cat]++); v.x = p.x; v.y = p.y; }
        ev(events, g, 'toStation', { id: v.id, cat: cat });
      }
    });
    g.ambs.forEach(function (a) {
      if (a.status !== 'waiting') return;
      const f = freeSlots(a);
      const need = g.victims.some((v) => readyForEvac(g, v) && (lastTag(v) === 'red' || lastTag(v) === 'yellow') && (f.stretcher > 0 || (f.seat > 0 && v.phys.walk)));
      if (need) { a.idle += 1; g.idle += 1; }
    });
    if (t >= g.sc.tMax && !g.over) { g.over = true; g.endReason = 'time'; ev(events, g, 'timeUp'); }
  }
  function advance(g, sec) {
    const events = []; sec = Math.max(0, Math.round(sec || 0));
    for (let i = 0; i < sec && !g.over; i++) tick(g, events);
    return events;
  }
  function logEntry(g, o) { const e = Object.assign({ t: g.t, rx: g.rescuer.x, ry: g.rescuer.y }, o); g.log.push(e); return e; }
  function rescuerAt(g, v) { return v.st.atCCP && !v.st.atStation ? g.rescuer.at === 'ccp' : g.rescuer.at === v.id; }
  function pointOf(g, target, D) {
    if (target === 'ccp') { const c = (D && D.COLD.ccp) || STATION_POS.green; return { x: c.x, y: c.y }; }
    if (target === 'pma') return { x: 1390, y: 210 };
    const v = vById(g, target); if (!v) return null;
    if (v.st.atCCP && !v.st.atStation) { const c = (D && D.COLD.ccp) || STATION_POS.green; return { x: c.x, y: c.y }; }
    return { x: v.x, y: v.y };
  }
  function markIndiv(g, v) { if (g.firstIndivT === null && !v.st.atCCP) g.firstIndivT = g.t; }
  function spend(g, v, cost) { if (v && !v.st.firstTag) v.st.timeSpent += cost; }

  /* Acció principal: retorna {ok, reason, cost, result, events} */
  function act(g, a, D) {
    const fail = (reason, extra) => Object.assign({ ok: false, reason: reason, cost: 0, events: [] }, extra || {});
    if (!a || !a.type) return fail('bad');
    if (g.over && a.type !== 'end') return fail('over');
    const done = (cost, result, extra) => { const events = advance(g, cost); return Object.assign({ ok: true, cost: cost, result: result, events: events }, extra || {}); };
    let v = null;
    switch (a.type) {
      case 'safety': {
        if (g.safety) return fail('done');
        const items = (a.items || []).filter((x) => SAFETY_GOOD.indexOf(x) >= 0 || SAFETY_BAD.indexOf(x) >= 0);
        g.safety = { items: items.slice(), t: g.t };
        const cost = items.reduce((s, x) => s + (COST[x] || 0), 0);
        logEntry(g, { type: 'safety', items: items, cost: cost, ok: items.filter((x) => SAFETY_GOOD.indexOf(x) >= 0).length === 3 && !items.some((x) => SAFETY_BAD.indexOf(x) >= 0) });
        return done(cost, { items: items });
      }
      case 'walkCall': {
        if (g.walkCallT !== null) return fail('done');
        const moved = [];
        g.victims.forEach(function (x) {
          if (x.phys.walk && !x.st.dead && !x.st.evac && !x.st.atStation && !x.st.atCCP) {
            const p = ccpSlot(g, g.ccpCount++, D); x.st.atCCP = true; x.x = p.x; x.y = p.y; x.hot = false; moved.push(x.id);
            if (g.rescuer.at === x.id) g.rescuer.at = null;
          }
        });
        g.walkCallT = g.t;
        logEntry(g, { type: 'walkCall', moved: moved.length, ok: g.firstIndivT === null });
        return done(COST.walkCall, { moved: moved });
      }
      case 'move': {
        const target = a.target;
        if (target !== 'ccp' && target !== 'pma') {
          v = vById(g, target); if (!v) return fail('bad');
          if (v.st.evac) return fail('gone');
          if (v.hot && !g.hotCleared && !v.st.atCCP) { g.hotAttempts += 1; logEntry(g, { type: 'hotBlocked', id: v.id, ok: false }); return fail('hot'); }
        }
        const p = pointOf(g, target, D);
        if (g.rescuer.at === target && Math.abs(g.rescuer.x - p.x) < 1 && Math.abs(g.rescuer.y - p.y) < 1) return { ok: true, cost: 0, result: { already: true }, events: [] };
        const cost = travelSec(dist(g.rescuer, p));
        g.rescuer.at = null;
        const events = advance(g, cost);
        g.rescuer.x = p.x; g.rescuer.y = p.y; g.rescuer.at = target;
        g.route.push({ t: g.t, x: p.x, y: p.y, at: target });
        if (v && v.st.arrivedAt === null) v.st.arrivedAt = g.t;
        logEntry(g, { type: 'move', id: target, cost: cost });
        return { ok: true, cost: cost, result: { x: p.x, y: p.y }, events: events };
      }
      case 'check': {
        v = vById(g, a.id); if (!v) return fail('bad');
        if (CHECKS.indexOf(a.check) < 0) return fail('bad');
        if (v.st.evac) return fail('gone');
        if (!rescuerAt(g, v)) return fail('far');
        const p = v.phys, c = a.check; let r;
        if (c === 'walk') r = { walks: !!p.walk };
        else if (c === 'breath') r = { breathing: !!p.br };
        else if (c === 'rr15' || c === 'rr30') { const win = c === 'rr15' ? 15 : 30; const count = p.br ? Math.round(p.rr * win / 60) : 0; r = { count: count, window: win, rr: count * (60 / win) }; }
        else if (c === 'radial') r = { present: !!p.radial };
        else if (c === 'crt') r = { sec: p.radial || p.crt <= 4 ? p.crt : 5 };
        else if (c === 'mental') r = v.ped ? { avpu: p.br ? p.avpu : 'U' } : { obeys: !!(p.br && p.obeys) };
        const key = c === 'rr15' || c === 'rr30' ? 'rr' : c === 'radial' || c === 'crt' ? 'perf' : c;
        v.st.done[key] = true; v.st.done[c] = true; v.st.results[c] = r;
        markIndiv(g, v); spend(g, v, COST[c]);
        logEntry(g, { type: 'check', id: v.id, check: c, result: r, cost: COST[c] });
        return done(COST[c], r);
      }
      case 'do': {
        v = vById(g, a.id); if (!v) return fail('bad');
        if (DOS.indexOf(a.what) < 0) return fail('bad');
        if (v.st.evac) return fail('gone');
        if (!rescuerAt(g, v)) return fail('far');
        const p = v.phys, st = v.st, w = a.what; let res, cost = COST[w], good = null;
        if (w === 'airway') {
          st.airwayTried = true; st.done.airway = true;
          if (p.br) res = 'already';
          else if (p.airwayFix && !st.dead) { p.br = true; p.rr = p.rrAfter || 12; st.airwayOpen = true; st.airwayEver = true; st.apneaSince = null; st.unatt = 0; res = 'breathes'; good = true; }
          else res = 'noBreath';
        } else if (w === 'rescue') {
          if (!v.ped) return fail('notPed');
          if (p.br) { res = 'already'; }
          else if (!st.airwayTried) return fail('airwayFirst');
          else if (!p.radial) { res = 'noPulse'; g.flags.unneeded += 1; good = false; }
          else if (p.rescueFix && !st.dead) { p.br = true; p.rr = p.rrAfter || 16; st.rescueEver = true; st.airwayEver = true; st.airwayOpen = true; st.apneaSince = null; res = 'breathes'; good = true; }
          else res = 'noBreath';
          st.done.rescue = true;
        } else if (w === 'pressure') {
          if (v.bleed === 'major' && !st.bleedCtrl && !st.dead) { st.bleedCtrl = true; res = 'controlled'; good = true; }
          else if (st.bleedCtrl) { res = 'already'; }
          else if (v.bleed === 'minor') res = 'minorOk';
          else { res = 'noBleed'; g.flags.unneeded += 1; good = false; }
        } else if (w === 'tourniquet') {
          if (v.bleed === 'major' && (v.site === 'arm' || v.site === 'leg') && !st.bleedCtrl && !st.dead) { st.bleedCtrl = true; res = 'controlled'; good = true; }
          else if (v.bleed === 'major' && !(v.site === 'arm' || v.site === 'leg')) { res = 'notLimb'; cost = 5; good = false; }
          else if (st.bleedCtrl) { res = 'already'; cost = 0; }
          else { res = 'notNeeded'; g.flags.unneeded += 1; good = false; }
        } else if (w === 'position') {
          if (!st.positioned && !st.dead && p.br && (st.airwayEver || (!p.obeys && !p.walk))) { st.positioned = true; res = 'ok'; good = true; }
          else if (st.positioned) { res = 'already'; cost = 0; }
          else { res = 'notNeeded'; g.flags.unneeded += 1; good = false; }
        } else if (w === 'cpr') { g.flags.cpr += 1; res = 'mciNoCpr'; good = false; }
        else if (w === 'secondary') { g.flags.secondary += 1; res = 'notStart'; good = false; }
        st.interventions.push({ t: g.t, what: w, res: res });
        markIndiv(g, v); spend(g, v, cost);
        logEntry(g, { type: 'do', id: v.id, what: w, result: res, cost: cost, ok: good });
        return done(cost, { res: res });
      }
      case 'tag': {
        v = vById(g, a.id); if (!v) return fail('bad');
        if (CATS.indexOf(a.cat) < 0) return fail('bad');
        if (v.st.evac) return fail('gone');
        if (!rescuerAt(g, v)) return fail('far');
        const c = classify(v);
        const entry = { t: g.t, cat: a.cat, truth: c.cat, step: c.step, retag: v.st.tags.length > 0 };
        v.st.tags.push(entry);
        markIndiv(g, v);
        if (!v.st.firstTag) { v.st.timeSpent += COST.tag; v.st.firstTag = entry; }
        if (a.cat !== 'black' && !v.st.atStation && v.st.stationAt === null) v.st.stationAt = g.t + COST.tag + (v.st.atCCP || v.phys.walk ? 30 : 150);
        const prev = entry.retag ? v.st.tags[v.st.tags.length - 2].cat : null;
        if (v.st.atStation && prev && prev !== a.cat && a.cat !== 'black' && !(a.cat === 'green' && v.st.atCCP)) { /* reubicació a la nova estació */ const p = stationSlot(a.cat, g.stationCount[a.cat]++); v.x = p.x; v.y = p.y; v.st.atCCP = false; if (g.rescuer.at === v.id) g.rescuer.at = null; }
        const kind = errorKind(c.cat, a.cat);
        logEntry(g, { type: 'tag', id: v.id, cat: a.cat, truth: c.cat, step: c.step, retag: entry.retag, ok: kind === 'ok', kind: kind, credit: creditOf(c.cat, a.cat) });
        return done(COST.tag, { cat: a.cat, truth: c.cat, step: c.step, kind: kind, path: c.path });
      }
      case 'tagCCP': {
        if (g.rescuer.at !== 'ccp') return fail('far');
        const list = g.victims.filter((x) => x.st.atCCP && !x.st.atStation && !x.st.tags.length && !x.st.evac && !x.st.dead);
        if (!list.length) return fail('none');
        const results = [], events = [];
        list.forEach(function (x) { const r = act(g, { type: 'tag', id: x.id, cat: 'green' }, D); results.push({ id: x.id, kind: r.result && r.result.kind }); Array.prototype.push.apply(events, r.events); });
        return { ok: true, cost: list.length * COST.tag, result: { tagged: results }, events: events };
      }
      case 'load': {
        const am = g.ambs.find((x) => x.id === a.amb); v = vById(g, a.id);
        if (!am || !v) return fail('bad');
        if (am.status !== 'waiting') return fail('noAmb');
        if (!v.st.tags.length) return fail('untagged');
        if (lastTag(v) === 'black') return fail('black');
        if (v.st.dead) return fail('dead');
        if (!v.st.atStation) return fail('notReady');
        if (v.st.evac || v.st.loadedIn) return fail('loaded');
        const f = freeSlots(am);
        const slot = v.phys.walk && f.seat > 0 ? 'seat' : f.stretcher > 0 ? 'stretcher' : null;
        if (!slot) return fail('full');
        am.load.push({ id: v.id, slot: slot }); v.st.loadedIn = am.id;
        logEntry(g, { type: 'load', id: v.id, amb: am.id, slot: slot, cost: COST.load });
        return done(COST.load, { slot: slot });
      }
      case 'unload': {
        const am = g.ambs.find((x) => x.id === a.amb); v = vById(g, a.id);
        if (!am || !v || v.st.loadedIn !== am.id) return fail('bad');
        am.load = am.load.filter((l) => l.id !== v.id); v.st.loadedIn = null;
        return { ok: true, cost: 0, result: {}, events: [] };
      }
      case 'dispatch': {
        const am = g.ambs.find((x) => x.id === a.amb); const h = g.hosp[a.dest];
        if (!am || !h) return fail('bad');
        if (am.status !== 'waiting') return fail('noAmb');
        if (!am.load.length) return fail('empty');
        if (h.cap - h.used < am.load.length) return fail('hospFull');
        const loadedReds = am.load.filter((l) => lastTag(vById(g, l.id)) === 'red').length;
        const traumaFree = g.hosp.H1 ? g.hosp.H1.cap - g.hosp.H1.used >= Math.max(1, loadedReds) : false;
        const waiting = g.victims.filter((x) => readyForEvac(g, x));
        const items = am.load.map(function (l) {
          const x = vById(g, l.id), cat = lastTag(x);
          const violation = waiting.some((w) => PRIO[lastTag(w)] < PRIO[cat] && (l.slot === 'stretcher' || w.phys.walk));
          return { id: x.id, tag: cat, truth: truthOf(x), slot: l.slot, violation: violation, destScore: destScore(cat, h.kind, traumaFree) };
        });
        items.forEach(function (it) { const x = vById(g, it.id); x.st.evac = { t: g.t, amb: am.id, dest: h.id }; x.st.loadedIn = null; });
        h.used += items.length; am.status = 'gone'; am.leftT = g.t; am.dest = h.id;
        const rec = { t: g.t, amb: am.id, kind: am.kind, dest: h.id, items: items };
        g.dispatches.push(rec);
        logEntry(g, { type: 'dispatch', amb: am.id, dest: h.id, items: items, cost: COST.dispatch, ok: items.every((i) => !i.violation && i.destScore >= 1) });
        return done(COST.dispatch, rec);
      }
      case 'wait': return done(Math.max(1, Math.min(600, Math.round(a.sec || 30))), {});
      case 'end': { g.over = true; g.endReason = g.endReason || 'player'; return { ok: true, cost: 0, result: {}, events: [] }; }
      default: return fail('bad');
    }
  }
  function destScore(cat, kind, traumaFree) {
    if (cat === 'red') return kind === 'trauma' ? 1 : kind === 'general' ? (traumaFree ? 0.5 : 1) : 0;
    if (cat === 'yellow') return kind === 'general' ? 1 : kind === 'trauma' ? 0.5 : 0.25;
    if (cat === 'green') return kind === 'cuap' ? 1 : kind === 'general' ? 0.75 : 0.25;
    return 0;
  }
  /* Comprovacions que justifiquen la categoria segons l'algorisme (per a l'adherència) */
  function requiredChecks(ped, step) {
    const R = { walk: ['walk'], noBreath: ['walk', 'breath', 'airway'], airway: ['walk', 'breath', 'airway'], rr: ['walk', 'breath', 'rr'], perf: ['walk', 'breath', 'rr', 'perf'], mental: ['walk', 'breath', 'rr', 'perf', 'mental'], stable: ['walk', 'breath', 'rr', 'perf', 'mental'] };
    const J = { walk: ['walk'], airway: ['walk', 'breath', 'airway'], noPulse: ['walk', 'breath', 'airway', 'radial'], rescue: ['walk', 'breath', 'airway', 'radial', 'rescue'], noBreath: ['walk', 'breath', 'airway', 'radial', 'rescue'], rr: ['walk', 'breath', 'rr'], perf: ['walk', 'breath', 'rr', 'radial'], mental: ['walk', 'breath', 'rr', 'radial', 'mental'], stable: ['walk', 'breath', 'rr', 'radial', 'mental'] };
    return ((ped ? J : R)[step] || ['walk']).slice();
  }
  function adherenceOf(g, v) {
    const f = v.st.firstTag; if (!f) return 0;
    const req = requiredChecks(v.ped, f.step);
    const knowsWalk = v.st.done.walk || (g.walkCallT !== null && g.walkCallT <= f.t);
    const ok = req.filter((k) => (k === 'walk' ? knowsWalk : !!v.st.done[k])).length;
    return ok / req.length;
  }
  /* Pas següent recomanat (mode guiat) segons el que ja s'ha comprovat */
  function nextStep(g, v) {
    const st = v.st, p = v.phys, r = st.results;
    if (st.dead && !st.tags.length) return { kind: 'tag', cat: 'black' };
    if (v.bleed === 'major' && !st.bleedCtrl) return { kind: 'do', what: (v.site === 'arm' || v.site === 'leg') ? 'tourniquet' : 'pressure' };
    const knowsWalk = st.done.walk || g.walkCallT !== null;
    if (!knowsWalk) return { kind: 'check', check: 'walk' };
    if (p.walk && (st.done.walk || st.atCCP)) return st.tags.length ? null : { kind: 'tag', cat: 'green' };
    if (!st.done.breath) return { kind: 'check', check: 'breath' };
    if (r.breath && !r.breath.breathing && !st.airwayEver) {
      if (!st.airwayTried) return { kind: 'do', what: 'airway' };
      if (v.ped && !st.done.radial) return { kind: 'check', check: 'radial' };
      if (v.ped && p.radial && !st.done.rescue) return { kind: 'do', what: 'rescue' };
      if (!p.br) return lastTag(v) === 'black' ? null : { kind: 'tag', cat: 'black' };
    }
    if (st.airwayEver) {
      if (!st.positioned) return { kind: 'do', what: 'position' };
      return lastTag(v) === 'red' ? null : { kind: 'tag', cat: 'red' };
    }
    if (!st.done.rr) return { kind: 'check', check: 'rr15' };
    const c = classify(v);
    if (c.step === 'rr') return lastTag(v) === 'red' ? null : { kind: 'tag', cat: 'red' };
    if (!st.done.perf || (v.ped && !st.done.radial)) return { kind: 'check', check: 'radial' };
    if (!v.ped && st.done.radial && r.radial && r.radial.present && !st.done.crt && c.step === 'perf') return { kind: 'check', check: 'crt' };
    if (c.step === 'perf') return lastTag(v) === 'red' ? null : { kind: 'tag', cat: 'red' };
    if (!st.done.mental) return { kind: 'check', check: 'mental' };
    return lastTag(v) === c.cat ? null : { kind: 'tag', cat: c.cat };
  }

  /* ---------- avaluació ---------- */
  function evaluate(g) {
    const per = g.victims.map(function (v) {
      const f = v.st.firstTag, fin = v.st.tags.length ? v.st.tags[v.st.tags.length - 1] : null;
      const truthNow = truthOf(v);
      const firstTruth = f ? f.truth : (v.st.dead ? v.cat0 : truthNow);
      const deteriorated = v.st.worsened.length > 0;
      let retriageOk = null;
      if (deteriorated && !v.st.dead) {
        const wt = v.st.worsened[v.st.worsened.length - 1];
        retriageOk = v.st.tags.some((tg) => tg.t >= wt && tg.cat === tg.truth) || (!!v.st.evac && v.st.evac.t < wt);
      } else if (deteriorated && v.st.dead) retriageOk = false;
      return {
        id: v.id, num: v.num, ped: v.ped, route: v.route, cat0: v.cat0, age: v.age, sex: v.sex,
        firstTag: f ? f.cat : null, firstTruth: firstTruth, firstStep: f ? f.step : classify(Object.assign({}, v, { st: Object.assign({}, v.st, { dead: false }) })).step,
        finalTag: fin ? fin.cat : null, truthNow: truthNow,
        credit: f ? creditOf(f.truth, f.cat) : 0, kind: f ? errorKind(f.truth, f.cat) : 'missed',
        dead: v.st.dead, preventable: v.st.dead && v.cat0 !== 'black', cause: v.st.cause, diedAt: v.st.diedAt,
        evac: v.st.evac, timeSpent: f ? v.st.timeSpent : null, viaCCP: v.st.atCCP, adherence: adherenceOf(g, v),
        deteriorated: deteriorated, retriageOk: retriageOk, bleed: v.bleed, needsAirway: v.needsAirway,
        bleedCtrl: v.st.bleedCtrl, airwayEver: v.st.airwayEver, positioned: v.st.positioned
      };
    });
    /* matriu de confusió [real][etiqueta|none] */
    const confusion = {}; CATS.forEach((r) => { confusion[r] = { red: 0, yellow: 0, green: 0, black: 0, none: 0 }; });
    per.forEach((r) => { confusion[r.firstTruth][r.firstTag || 'none'] += 1; });
    const under = per.filter((r) => r.kind === 'under').length, over = per.filter((r) => r.kind === 'over').length;
    const tagged = per.filter((r) => r.firstTag).length;
    /* algorisme */
    let wSum = 0, wPts = 0; per.forEach((r) => { const w = CAT_WEIGHT[r.firstTruth]; wSum += w; wPts += w * r.credit; });
    const acc = wSum ? wPts / wSum : 0;
    const adh = per.length ? per.reduce((s, r) => s + r.adherence, 0) / per.length : 0;
    const algorithm = clamp01(0.85 * acc + 0.15 * adh);
    /* rapidesa */
    const times = per.filter((r) => r.timeSpent !== null && !r.viaCCP).map((r) => r.timeSpent);
    const med = median(times);
    const speed = med === null ? 0 : clamp01((120 - med) / 75) * (tagged / per.length);
    /* intervencions */
    let iMax = 0, iPts = 0;
    per.forEach(function (r) {
      if (r.bleed === 'major') { iMax += 1; if (r.bleedCtrl && !(r.dead && r.cause === 'bleed')) iPts += 1; }
      if (r.needsAirway) { iMax += 1.5; if (r.airwayEver) iPts += 1; if (r.positioned) iPts += 0.5; }
    });
    const interventions = clamp01((iMax ? iPts / iMax : 1) - 0.25 * g.flags.cpr - 0.1 * g.flags.secondary - 0.03 * g.flags.unneeded);
    /* organització i evacuació */
    const arrived = g.ambs.some((a) => a.status !== 'scheduled');
    const loadedItems = g.dispatches.reduce((a, d) => a.concat(d.items), []);
    const orgParts = {
      walkCall: g.walkCallT === null ? 0 : (g.firstIndivT === null || g.walkCallT <= g.firstIndivT ? 1 : 0.5),
      priority: loadedItems.length ? 1 - loadedItems.filter((i) => i.violation).length / loadedItems.length : (arrived ? 0 : 1),
      destination: loadedItems.length ? loadedItems.reduce((s, i) => s + i.destScore, 0) / loadedItems.length : (arrived ? 0 : 1),
      redsEvac: (function () { const reds = g.victims.filter((v) => v.st.tags.some((tg) => tg.cat === 'red') && (v.st.evac || !v.st.dead)); return reds.length ? reds.filter((v) => v.st.evac).length / reds.length : 1; })(),
      idle: 1 - Math.min(1, g.idle / 900),
      retriage: (function () { const d = per.filter((r) => r.retriageOk !== null); return d.length ? d.filter((r) => r.retriageOk).length / d.length : 1; })()
    };
    const organization = clamp01(Object.keys(orgParts).reduce((s, k) => s + orgParts[k], 0) / 6);
    /* seguretat */
    const sItems = g.safety ? g.safety.items : [];
    const safety = clamp01((sItems.filter((x) => SAFETY_GOOD.indexOf(x) >= 0).length - sItems.filter((x) => SAFETY_BAD.indexOf(x) >= 0).length) / 3 - 0.15 * g.hotAttempts);
    const comps = { algorithm: algorithm, speed: speed, interventions: interventions, organization: organization, safety: safety };
    const deaths = per.filter((r) => r.preventable).length;
    const raw = Object.keys(WEIGHTS).reduce((s, k) => s + WEIGHTS[k] * comps[k], 0) * 10;
    const score10 = round1(Math.max(0, Math.min(10, raw - DEATH_PENALTY * deaths)));
    const evacuated = per.filter((r) => r.evac).length;
    const res = {
      score10: score10, grade: grade(score10), comps: comps, orgParts: orgParts, accuracy: acc, adherence: adh,
      per: per, confusion: confusion, under: under, over: over, tagged: tagged, total: per.length,
      medianSec: med, totalSec: g.t, deaths: deaths, evacuated: evacuated, flags: Object.assign({}, g.flags), hotAttempts: g.hotAttempts,
      idleSec: g.idle, dispatches: g.dispatches.length
    };
    res.achievements = achievementsOf(g, res);
    return res;
  }
  const grade = (sc) => (sc >= 9 ? 'excellent' : sc >= 7 ? 'good' : sc >= 5 ? 'pass' : 'fail');
  function achievementsOf(g, r) {
    const all = r.tagged === r.total;
    const bleeders = r.per.filter((p) => p.bleed === 'major'), airways = r.per.filter((p) => p.needsAirway);
    const det = r.per.filter((p) => p.retriageOk !== null);
    const s = g.safety ? g.safety.items : [];
    const got = {
      noDeaths: all && r.deaths === 0,
      noUnder: all && r.under === 0,
      perfect: all && r.per.every((p) => p.kind === 'ok'),
      fast: r.medianSec !== null && r.medianSec <= 40 && all,
      megaphone: r.orgParts.walkCall === 1,
      bleeds: bleeders.length > 0 && bleeders.every((p) => p.bleedCtrl && !(p.dead && p.cause === 'bleed')),
      airway: airways.length > 0 && airways.every((p) => p.airwayEver && p.positioned),
      evac: r.dispatches > 0 && r.orgParts.priority === 1 && r.orgParts.destination >= 0.9 && r.orgParts.redsEvac === 1,
      retriage: det.length > 0 && det.every((p) => p.retriageOk),
      safe: SAFETY_GOOD.every((x) => s.indexOf(x) >= 0) && !s.some((x) => SAFETY_BAD.indexOf(x) >= 0) && g.hotAttempts === 0
    };
    return ACHIEVEMENTS.filter((k) => got[k]);
  }

  /* ---------- targeta ràpida ---------- */
  const CARD_ROUTES = [['walk', 1], ['yellow', 2], ['airway', 1], ['rr', 2], ['bleed', 1], ['shock', 1], ['mental', 2], ['black', 1]];
  const CARD_PED = ['jWalk', 'jRr', 'jRescue', 'jMental', 'jYellow'];
  function makeCard(D, rng, opts) {
    opts = opts || {};
    const df = DIFF[opts.difficulty] || DIFF.normal;
    let route;
    if (opts.kids && rng() < 0.2) route = pick(rng, CARD_PED);
    else { const tot = CARD_ROUTES.reduce((s, r) => s + r[1], 0); let x = rng() * tot; route = CARD_ROUTES[0][0]; for (let i = 0; i < CARD_ROUTES.length; i++) { x -= CARD_ROUTES[i][1]; if (x < 0) { route = CARD_ROUTES[i][0]; break; } } }
    const ped = isPedRoute(route);
    const phys = physFor(route, rng, df.near);
    const list = D.TEMPLATES[TPL_OF[route]], tpl = pick(rng, list);
    const c = ped ? classifyJump(phys) : classifyStart(phys);
    return { route: route, ped: ped, phys: phys, truth: c.cat, step: c.step, path: c.path, desc: tpl.d, site: tpl.site, post: tpl.post, bleed: tpl.bleed || 'none', age: ped ? rint(rng, 3, 8) : rint(rng, 18, 84), sex: rng() < 0.5 ? 'f' : 'm', look: { skin: rint(rng, 0, 3), cloth: rint(rng, 0, 5), hair: rint(rng, 0, 3) }, limit: df.card };
  }
  function scoreCards(results) {
    let pts = 0, streak = 0, best = 0, correct = 0, under = 0, over = 0, timeouts = 0;
    results.forEach(function (r) {
      const k = r.chosen ? errorKind(r.truth, r.chosen) : null;
      if (!r.chosen) timeouts += 1;
      if (k === 'ok') { correct += 1; streak += 1; best = Math.max(best, streak); } else streak = 0;
      if (k === 'under') under += 1; if (k === 'over') over += 1;
      pts += creditOf(r.truth, r.chosen);
    });
    const n = results.length || 1;
    return { score10: round1(10 * pts / n), correct: correct, under: under, over: over, timeouts: timeouts, bestStreak: best, total: results.length };
  }

  /* ---------- validació de dades ---------- */
  function validateData(D) {
    const errs = [];
    const pair = (o, w) => { if (!o || typeof o.ca !== 'string' || typeof o.es !== 'string' || !o.ca.trim() || !o.es.trim()) errs.push('ca/es incomplet: ' + w); };
    Object.keys(D.SETTINGS).forEach(function (k) {
      const s = D.SETTINGS[k];
      ['name', 'short', 'brief', 'hazard', 'hotClear'].forEach((f) => pair(s[f], k + '.' + f));
      const hot = s.spots.filter((p) => inPoly(p[0], p[1], s.hot)).length;
      if (hot < 3) errs.push(k + ': calen 3 punts calents o més');
      if (s.spots.length - hot < 20) errs.push(k + ': calen 20 punts no calents o més');
      s.spots.forEach((p) => { if (p[0] < 30 || p[0] > 1170 || p[1] < 30 || p[1] > 990) errs.push(k + ': punt fora de la zona d\'incident ' + p); });
    });
    Object.keys(D.TEMPLATES).forEach((k) => D.TEMPLATES[k].forEach((t, i) => pair(t.d, 'plantilla ' + k + '/' + i)));
    D.HOSPITALS.forEach((h) => { pair(h.name, h.id); pair(h.short, h.id); });
    return errs;
  }

  const L = {
    CATS: CATS, PRIO: PRIO, RANK: RANK, RR_LIMIT: RR_LIMIT, CRT_LIMIT: CRT_LIMIT, J_RR_LOW: J_RR_LOW, J_RR_HIGH: J_RR_HIGH,
    COST: COST, CHECKS: CHECKS, DOS: DOS, SAFETY_GOOD: SAFETY_GOOD, SAFETY_BAD: SAFETY_BAD, WEIGHTS: WEIGHTS, DEATH_PENALTY: DEATH_PENALTY,
    CAT_WEIGHT: CAT_WEIGHT, DIFF: DIFF, ACHIEVEMENTS: ACHIEVEMENTS,
    hashSeed: hashSeed, seeded: seeded, shuffle: shuffle, seedCode: seedCode, inPoly: inPoly, travelSec: travelSec, dist: dist,
    classifyStart: classifyStart, classifyJump: classifyJump, classify: classify, creditOf: creditOf, errorKind: errorKind,
    composition: composition, physFor: physFor, normOpts: normOpts, generate: generate, bankScenario: bankScenario, pickBank: pickBank,
    createGame: createGame, act: act, advance: advance, vById: vById, lastTag: lastTag, truthOf: truthOf, readyForEvac: readyForEvac,
    freeSlots: freeSlots, destScore: destScore, requiredChecks: requiredChecks, nextStep: nextStep, rescuerAt: rescuerAt, pointOf: pointOf,
    evaluate: evaluate, grade: grade, makeCard: makeCard, scoreCards: scoreCards, validateData: validateData, median: median
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.TriageLogic = L;
})(this);
