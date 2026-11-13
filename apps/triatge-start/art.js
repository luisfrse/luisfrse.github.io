'use strict';
/* Triatge START · il·lustració SVG pròpia (mapes, víctimes, rescatador, ambulàncies, figura lateral i icones).
   Tots els colors surten de classes CSS (tema clar/fosc a style.css). Sense dependències. */
(function (root) {
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;
  function s(tag, attrs, kids) {
    const e = root.document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, String(attrs[k])); });
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? root.document.createTextNode(k) : k); });
    return e;
  }
  const g = (cls, kids, extra) => s('g', Object.assign({ class: cls }, extra || {}), kids);
  const rect = (x, y, w, h, cls, rx, extra) => s('rect', Object.assign({ x: x, y: y, width: w, height: h, rx: rx || 0, class: cls }, extra || {}));
  const circ = (cx, cy, r, cls, extra) => s('circle', Object.assign({ cx: cx, cy: cy, r: r, class: cls }, extra || {}));
  const ell = (cx, cy, rx, ry, cls, extra) => s('ellipse', Object.assign({ cx: cx, cy: cy, rx: rx, ry: ry, class: cls }, extra || {}));
  const path = (d, cls, extra) => s('path', Object.assign({ d: d, class: cls }, extra || {}));
  const poly = (pts, cls) => s('polygon', { points: pts.map((p) => p[0] + ',' + p[1]).join(' '), class: cls });
  const line = (x1, y1, x2, y2, cls) => s('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: cls });
  const text = (x, y, str, cls, extra) => s('text', Object.assign({ x: x, y: y, class: cls }, extra || {}), [str]);
  const rot = (x, y, a) => 'translate(' + x + ' ' + y + ') rotate(' + a + ')';
  /* pseudoaleatori estable per a la decoració */
  function prng(seed) { let a = seed >>> 0 || 7; return function () { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

  /* ---------- elements de decoració ---------- */
  function tree(x, y, r, v) { return g('d-tree', [ell(x + 4, y + 6, r, r * 0.8, 'm-shadow'), circ(x, y, r, v ? 'm-tree2' : 'm-tree'), circ(x - r * 0.3, y - r * 0.3, r * 0.45, 'm-treehi')]); }
  function trees(list, seed) { const R = prng(seed); return g('', list.map((p) => tree(p[0], p[1], p[2] || 22 + R() * 14, R() < 0.4))); }
  function car(x, y, a, cls) {
    return g('d-car', [rect(-34, -17, 68, 34, 'm-shadow', 9, { transform: 'translate(4 4)' }), rect(-34, -17, 68, 34, cls || 'm-car', 9), rect(-14, -14, 26, 28, 'm-glass', 4), rect(18, -13, 8, 26, 'm-glass', 3)], { transform: rot(x, y, a) });
  }
  function vehicleTop(kind) {
    /* ambulància vista des de dalt, centrada a 0,0, orientada cap a la dreta */
    const body = kind === 'BUS' ? 'm-bus' : 'm-amb';
    const len = kind === 'BUS' ? 120 : 70, w = kind === 'BUS' ? 36 : 30;
    const kids = [rect(-len / 2 + 4, -w / 2 + 4, len, w, 'm-shadow', 7), rect(-len / 2, -w / 2, len, w, body, 7)];
    if (kind === 'BUS') { for (let i = 0; i < 6; i++) kids.push(rect(-len / 2 + 10 + i * 17, -w / 2 + 4, 12, w - 8, 'm-glass', 2)); }
    else {
      kids.push(rect(len / 2 - 20, -w / 2 + 3, 14, w - 6, 'm-glass', 3));
      kids.push(rect(-len / 2 + 8, -3, 34, 6, 'm-ambstripe', 1));
      kids.push(rect(-len / 2 + 22, -w / 2 + 2, 6, w - 4, 'm-ambstripe', 1));
      kids.push(rect(len / 2 - 26, -w / 2 + 2, 5, 9, 'm-beacon1', 2)); kids.push(rect(len / 2 - 26, w / 2 - 11, 5, 9, 'm-beacon2', 2));
      if (kind === 'SVA') kids.push(text(-10, 4, 'SVA', 'm-ambtxt'));
    }
    return kids;
  }
  function puddle(x, y, rx, ry, cls) { return path('M' + (x - rx) + ' ' + y + ' q ' + rx * 0.3 + ' ' + -ry * 1.2 + ' ' + rx + ' ' + -ry + ' t ' + rx + ' ' + ry * 0.4 + ' q ' + -rx * 0.2 + ' ' + ry * 1.4 + ' ' + -rx * 0.9 + ' ' + ry * 1.2 + ' t ' + -rx * 1.1 + ' ' + -ry * 0.6 + 'z', cls); }
  function debris(seed, x0, y0, w, h, n) {
    const R = prng(seed), out = [];
    for (let i = 0; i < n; i++) { const x = x0 + R() * w, y = y0 + R() * h, a = R() * 180, sz = 4 + R() * 9; out.push(rect(-sz / 2, -sz / 3, sz, sz * 0.6, R() < 0.5 ? 'm-debris' : 'm-debris2', 1, { transform: rot(Math.round(x), Math.round(y), Math.round(a)) })); }
    return g('d-debris', out);
  }
  function smoke(x, y, n) { const out = []; for (let i = 0; i < n; i++) out.push(circ(x + (i % 3) * 26 - 26, y - i * 34, 30 + i * 7, 'm-smoke a-smoke', { style: 'animation-delay:' + (-i * 0.9) + 's' })); return g('d-smoke', out); }
  function tent(x, y, w, h, cls) { return g('d-tent', [rect(x + 5, y + 5, w, h, 'm-shadow', 4), rect(x, y, w, h, cls || 'm-tent', 4), line(x, y + h / 2, x + w, y + h / 2, 'm-tentseam')]); }

  /* ---------- fons de cada escenari ---------- */
  const SCENES = {
    bus: function () {
      const k = [];
      k.push(rect(0, 0, 1600, 1000, 'm-ground'));
      k.push(path('M0 300 C 300 250 700 330 1180 280 L1180 0 L0 0 Z', 'm-grass2'));
      k.push(rect(0, 815, 1600, 110, 'm-asphalt'));
      for (let x = 20; x < 1600; x += 90) k.push(rect(x, 866, 50, 7, 'm-line', 2));
      k.push(rect(0, 808, 470, 6, 'm-rail', 2)); k.push(rect(720, 808, 460, 6, 'm-rail', 2));
      k.push(path('M470 812 l40 -22 M720 812 l-26 -30', 'm-railbent'));
      k.push(path('M540 815 C 560 760 600 720 640 700', 'm-skid'));
      k.push(puddle(560, 745, 110, 40, 'm-fuel'));
      k.push(trees([[80, 120], [190, 90], [320, 150], [460, 80], [600, 130], [740, 70], [880, 140], [1010, 90], [1120, 160], [60, 980], [1160, 980]], 3));
      k.push(debris(11, 420, 560, 520, 300, 46));
      /* autobús bolcat */
      k.push(g('d-bus', [rect(-220, -60, 440, 120, 'm-shadow', 18, { transform: 'translate(10 12)' }), rect(-220, -60, 440, 120, 'm-busside', 18),
        rect(-210, -52, 420, 30, 'm-busroof', 12), rect(-206, 18, 412, 10, 'm-busstripe', 3)].concat(
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => rect(-196 + i * 50, -14, 40, 26, i === 3 ? 'm-glassbroken' : 'm-glass', 4))).concat([circ(-150, 60, 22, 'm-tyre'), circ(140, 60, 22, 'm-tyre'), circ(-150, 60, 9, 'm-hub'), circ(140, 60, 9, 'm-hub')]),
      { transform: rot(620, 650, -12) }));
      k.push(car(935, 765, 28, 'm-car2'));
      k.push(car(260, 880, -4, 'm-car'));
      return k;
    },
    nave: function () {
      const k = [];
      k.push(rect(0, 0, 1600, 1000, 'm-ground'));
      k.push(rect(740, 600, 440, 400, 'm-asphalt'));
      for (let i = 0; i < 6; i++) k.push(rect(770 + i * 70, 640, 4, 90, 'm-line'));
      for (let i = 0; i < 6; i++) k.push(rect(770 + i * 70, 880, 4, 90, 'm-line'));
      k.push(car(820, 685, 90, 'm-car')); k.push(car(1030, 920, 92, 'm-car2'));
      k.push(rect(60, 600, 680, 400, 'm-dirt'));
      /* nau */
      k.push(rect(130, 130, 600, 440, 'm-shadow', 4));
      k.push(rect(120, 120, 600, 440, 'm-build', 4));
      for (let i = 0; i < 9; i++) k.push(rect(120, 140 + i * 48, 600, 3, 'm-roofrib'));
      k.push(path('M300 210 L420 170 L520 230 L560 330 L470 420 L340 390 L280 300 Z', 'm-hole'));
      k.push(debris(5, 280, 190, 300, 240, 40));
      k.push(rect(716, 300, 14, 120, 'm-dark', 2));
      k.push(rect(800, 160, 180, 70, 'm-cont1', 3)); k.push(rect(800, 250, 180, 70, 'm-cont2', 3));
      for (let i = 0; i < 8; i++) { k.push(rect(808 + i * 21, 166, 3, 58, 'm-contrib')); k.push(rect(808 + i * 21, 256, 3, 58, 'm-contrib')); }
      k.push(g('d-fork', [rect(-30, -18, 60, 36, 'm-fork', 5), rect(30, -14, 22, 4, 'm-dark'), rect(30, 10, 22, 4, 'm-dark'), rect(-18, -12, 22, 24, 'm-glass', 3)], { transform: rot(930, 560, -20) }));
      for (let i = 0; i < 5; i++) k.push(rect(220 + i * 46, 640 + (i % 2) * 18, 38, 30, 'm-pallet', 2));
      k.push(trees([[60, 40], [1140, 40], [1150, 120]], 9));
      k.push(smoke(430, 240, 6));
      return k;
    },
    festival: function () {
      const k = [];
      k.push(rect(0, 0, 1600, 1000, 'm-ground'));
      k.push(path('M120 380 C 400 420 700 430 900 700 C 700 900 300 900 120 760 Z', 'm-trampled'));
      /* escenari */
      k.push(rect(150, 110, 520, 240, 'm-shadow', 6));
      k.push(rect(140, 100, 520, 240, 'm-stage', 6));
      k.push(rect(150, 110, 500, 18, 'm-stage2', 3));
      k.push(rect(110, 120, 40, 90, 'm-speaker', 4)); k.push(rect(650, 120, 40, 90, 'm-speaker', 4));
      /* barrera */
      for (let x = 120; x < 700; x += 26) { if (x > 360 && x < 520) continue; k.push(rect(x, 372, 22, 8, 'm-barrier', 2)); }
      /* estructura caiguda */
      const truss = (x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI; const kids = [rect(0, -11, len, 22, 'm-truss', 2)]; for (let i = 0; i < len; i += 22) kids.push(path('M' + i + ' -11 L' + (i + 11) + ' 11 L' + (i + 22) + ' -11', 'm-trussx')); return g('', kids, { transform: rot(x1, y1, a) }); };
      k.push(truss(330, 250, 770, 520));
      k.push(truss(560, 190, 600, 560));
      [[420, 300], [520, 370], [640, 440], [720, 490]].forEach((p) => { k.push(circ(p[0], p[1], 12, 'm-lamp')); });
      k.push(debris(17, 300, 300, 500, 300, 38));
      k.push(g('', [rect(870, 115, 150, 70, 'm-truck', 8), rect(880, 125, 50, 20, 'm-glass', 3), rect(940, 150, 70, 10, 'm-awning', 2)]));
      k.push(g('', [rect(1035, 115, 130, 70, 'm-truck2', 8), rect(1045, 125, 40, 20, 'm-glass', 3)]));
      k.push(tent(850, 780, 150, 110, 'm-tent')); k.push(tent(1020, 830, 120, 90, 'm-tent2'));
      k.push(g('', [rect(790, 410, 20, 20, 'm-dark', 3), circ(800, 420, 30, 'm-glow')]));
      const R = prng(23); for (let i = 0; i < 40; i++) k.push(circ(Math.round(150 + R() * 900), Math.round(420 + R() * 520), 3, 'm-cup'));
      k.push(trees([[60, 60], [70, 960], [1150, 980]], 4));
      return k;
    },
    tren: function () {
      const k = [];
      k.push(rect(0, 0, 1600, 1000, 'm-ground'));
      k.push(path('M0 470 L1240 -40 L1240 120 L0 650 Z', 'm-ballast'));
      /* via */
      const A = [-20, 600], B = [1240, -20];
      const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const sl = []; for (let i = 0; i < len; i += 26) sl.push(rect(i, -26, 8, 52, 'm-sleeper', 1));
      k.push(g('', sl.concat([rect(0, -16, len, 5, 'm-rail'), rect(0, 12, len, 5, 'm-rail')]), { transform: rot(A[0], A[1], ang) }));
      const carriage = (x, y, a, cls) => g('', [rect(-150, -34, 300, 68, 'm-shadow', 10, { transform: 'translate(8 10)' }), rect(-150, -34, 300, 68, cls, 10), rect(-140, -26, 280, 14, 'm-trainroof', 6)].concat([0, 1, 2, 3, 4, 5].map((i) => rect(-130 + i * 45, 2, 32, 20, 'm-glass', 3))), { transform: rot(x, y, a) });
      k.push(carriage(250, 465, ang, 'm-train'));
      k.push(carriage(570, 430, -2, 'm-trainside'));
      k.push(carriage(880, 175, ang + 6, 'm-train'));
      /* catenària */
      for (let x = 60; x < 1180; x += 160) { k.push(circ(x, Math.round(600 + (x + 20) * dy / dx) - 46, 7, 'm-pole')); }
      k.push(path('M420 330 C 470 420 560 380 600 470 S 690 520 730 500', 'm-wire a-spark'));
      k.push(debris(29, 380, 320, 380, 240, 34));
      k.push(rect(0, 860, 1600, 80, 'm-asphalt'));
      for (let x = 20; x < 1600; x += 90) k.push(rect(x, 896, 50, 6, 'm-line', 2));
      k.push(trees([[80, 800], [300, 780], [520, 790], [760, 760], [980, 780], [140, 160], [380, 120], [620, 60]], 12));
      return k;
    }
  };

  /* zona freda comuna */
  function coldZone(D, prefix) {
    const C = D.COLD, k = [];
    k.push(rect(C.x, 0, 1600 - C.x, 1000, 'm-coldbase'));
    k.push(rect(1200, 800, 400, 120, 'm-asphalt'));
    k.push(path('M1600 860 L1600 940 L1240 940 L1240 800 L1600 800 Z', 'm-asphalt'));
    k.push(text(1240, 790, '', 'm-label'));
    /* PMA */
    const p = C.pma;
    k.push(g('d-pma', [rect(p.x - 125, p.y - 65, 250, 130, 'm-shadow', 8, { transform: 'translate(6 6)' }), rect(p.x - 125, p.y - 65, 250, 130, 'm-pma', 8), rect(p.x - 125, p.y - 65, 250, 22, 'm-pmaroof', 8),
      rect(p.x - 9, p.y - 24, 18, 52, 'm-cross', 2), rect(p.x - 26, p.y - 7, 52, 18, 'm-cross', 2), text(p.x, p.y + 52, 'PMA', 'm-label m-center')]));
    /* estacions */
    ['red', 'yellow', 'green', 'black'].forEach(function (c) {
      const st = C.stations[c];
      k.push(g('d-station', [rect(st.x - st.w / 2, st.y - st.h / 2, st.w, st.h, 'm-tarp m-tarp-' + c, 10)]));
    });
    k.push(g('d-cp', [rect(1500, 210, 74, 40, 'm-cpvan', 8), rect(1550, 214, 18, 32, 'm-glass', 3), text(1537, 270, 'PC', 'm-label m-center m-small')]));
    k.push(path('M1600 880 l-50 -18 v10 h-40 v16 h40 v10 z', 'm-arrow'));
    return k;
  }
  function zones(S, prefix) {
    const hatch = s('pattern', { id: prefix + '-hatch', width: 18, height: 18, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, [rect(0, 0, 18, 18, 'm-hotbg'), rect(0, 0, 6, 18, 'm-hotline')]);
    const defs = s('defs', null, [hatch]);
    return [defs,
      s('polygon', { points: S.warm.map((p) => p.join(',')).join(' '), class: 'm-warm' }),
      s('polygon', { points: S.hot.map((p) => p.join(',')).join(' '), class: 'm-hot', fill: 'url(#' + prefix + '-hatch)' })];
  }
  function drawMap(D, settingId) {
    const prefix = 'mp' + (++uid);
    const S = D.SETTINGS[settingId];
    const bg = g('map-bg', (SCENES[settingId] || SCENES.bus)());
    const zg = g('map-zones', zones(S, prefix));
    const cold = g('map-cold', coldZone(D, prefix));
    return g('map-static', [bg, zg, cold]);
  }

  /* ---------- marcadors ---------- */
  const SKIN = ['sk0', 'sk1', 'sk2', 'sk3'], CLOTH = ['cl0', 'cl1', 'cl2', 'cl3', 'cl4', 'cl5'];
  function victimMarker(v) {
    const lk = v.look || { skin: 0, cloth: 0, hair: 0, angle: 0 };
    const sk = SKIN[lk.skin % 4], cl = CLOTH[lk.cloth % 6], sc = v.ped ? 0.78 : 1;
    const lying = g('vm-lying', [
      ell(3, 4, 26, 12, 'm-shadow'),
      rect(-24, -9, 30, 18, 'vm-cloth ' + cl, 8),
      rect(4, -8, 20, 7, 'vm-legs', 3), rect(4, 1, 20, 7, 'vm-legs', 3),
      rect(-20, -15, 18, 6, 'vm-cloth ' + cl, 3), rect(-20, 9, 18, 6, 'vm-cloth ' + cl, 3),
      circ(-30, 0, 8, 'vm-skin ' + sk), path('M-36 -4 a 8 8 0 0 1 10 -4', 'vm-hair h' + (lk.hair % 4))
    ], { transform: 'rotate(' + (lk.angle || 0) + ') scale(' + sc + ')' });
    const standing = g('vm-standing', [ell(3, 5, 15, 9, 'm-shadow'), ell(0, 0, 15, 9, 'vm-cloth ' + cl), circ(0, 0, 7.5, 'vm-skin ' + sk), path('M-6 -3 a 7 7 0 0 1 12 0', 'vm-hair h' + (lk.hair % 4))], { transform: 'scale(' + sc + ')' });
    const blood = ell(4, 6, 30, 18, 'vm-blood');
    return g('vm', [
      circ(0, 0, 36, 'vm-hit'),
      circ(0, 0, 30, 'vm-halo'),
      blood, lying, standing,
      g('vm-badge', [circ(22, -22, 13, 'vm-badgebg'), text(22, -17.5, String(v.num), 'vm-num')]),
      g('vm-alert', [circ(-24, -24, 9, 'vm-alertbg'), text(-24, -20, '!', 'vm-alerttxt')]),
      g('vm-lock', [circ(-24, -24, 10, 'vm-lockbg'), path('M-28 -24 v-3 a4 4 0 0 1 8 0 v3', 'vm-lockline'), rect(-30, -25, 12, 8, 'vm-lockbody', 2)])
    ], { 'data-id': v.id });
  }
  function rescuer() {
    return g('rescuer', [circ(0, 0, 34, 'rs-ring'), ell(3, 5, 16, 10, 'm-shadow'), ell(0, 0, 16, 10, 'rs-vest'), rect(-12, -2, 24, 4, 'rs-stripe', 1), circ(0, 0, 8, 'rs-helmet'), text(0, -24, '', 'rs-label')]);
  }
  function ambulance(kind) { return g('amb amb-' + kind, vehicleTop(kind)); }

  /* ---------- figura lateral (panell de la víctima) ---------- */
  /* state: {post, skin, cloth, hair, ped, bleed:'none|minor|major', ctrl:'none|pressure|tourniquet', site, pale, cyan, dead, breathing, rr, airwayOpen, positioned, tag, walking} */
  function figure(st) {
    const sk = SKIN[(st.skin || 0) % 4], cl = CLOTH[(st.cloth || 0) % 6], hr = 'h' + ((st.hair || 0) % 4);
    const cls = ['fig'];
    if (st.pale) cls.push('is-pale'); if (st.cyan) cls.push('is-cyan'); if (st.dead) cls.push('is-dead'); if (!st.breathing) cls.push('no-breath');
    const kids = [rect(0, 168, 420, 52, 'fg-ground'), ell(210, 172, 170, 10, 'm-shadow')];
    const dur = st.breathing && st.rr ? Math.max(0.9, Math.min(6, 60 / st.rr)).toFixed(2) + 's' : '0s';
    const sc = st.ped ? 0.78 : 1;
    let body;
    const site = st.site || 'trunk';
    const woundAt = { leg: [300, 150], arm: [190, 128], groin: [255, 146], trunk: [215, 140], head: [96, 132] }[site] || [215, 140];
    const pool = st.bleed === 'major' ? ell(woundAt[0], 170, st.ctrl ? 46 : 70, st.ctrl ? 7 : 11, 'fg-blood a-pool') : st.bleed === 'minor' ? ell(woundAt[0], 169, 18, 4, 'fg-blood') : null;
    if (pool) kids.push(pool);
    if (st.post === 'stand' || st.walking) {
      body = g('fg-body', [
        rect(196, 112, 14, 58, 'fg-legs', 6), rect(214, 112, 14, 58, 'fg-legs', 6),
        rect(190, 50, 44, 70, 'fg-cloth ' + cl, 16),
        g('fg-chest', [rect(192, 56, 40, 40, 'fg-cloth ' + cl, 14)], { style: '--br:' + dur }),
        rect(180, 58, 12, 52, 'fg-cloth ' + cl, 6), rect(232, 58, 12, 52, 'fg-cloth ' + cl, 6),
        circ(186, 114, 7, 'fg-skin ' + sk), circ(238, 114, 7, 'fg-skin ' + sk),
        g('fg-head', [circ(212, 32, 20, 'fg-skin ' + sk), path('M192 30 a 20 20 0 0 1 40 0 q -20 -10 -40 0', 'fg-hair ' + hr), circ(205, 33, 2, 'fg-eye'), circ(219, 33, 2, 'fg-eye'), path('M206 43 q 6 3 12 0', 'fg-mouth')])
      ], { transform: 'translate(' + (212 - 212 * sc) + ' ' + (170 - 170 * sc) + ') scale(' + sc + ')' });
    } else if (st.post === 'sit' && !st.dead) {
      body = g('fg-body', [
        rect(200, 142, 110, 18, 'fg-legs', 8), rect(290, 142, 18, 28, 'fg-legs', 6),
        g('fg-chest', [rect(170, 70, 46, 82, 'fg-cloth ' + cl, 16)], { style: '--br:' + dur }),
        rect(206, 92, 60, 13, 'fg-cloth ' + cl, 6), circ(270, 98, 7, 'fg-skin ' + sk),
        g('fg-head', [circ(192, 50, 21, 'fg-skin ' + sk), path('M171 48 a 21 21 0 0 1 42 0 q -21 -11 -42 0', 'fg-hair ' + hr), circ(200, 51, 2, 'fg-eye'), path('M196 62 q 6 3 10 0', 'fg-mouth')])
      ], { transform: 'translate(' + (240 - 240 * sc) + ' ' + (170 - 170 * sc) + ') scale(' + sc + ')' });
    } else {
      const bent = st.positioned;
      body = g('fg-body', [
        bent ? path('M250 150 L300 120 L345 150', 'fg-legline') : rect(250, 142, 120, 15, 'fg-legs', 7),
        rect(250, 152, 120, 15, 'fg-legs', 7),
        g('fg-chest', [rect(130, 128, 128, 38, 'fg-cloth ' + cl, 16)], { style: '--br:' + dur }),
        rect(150, 112, 70, 13, 'fg-cloth ' + cl, 6), circ(224, 118, 7, 'fg-skin ' + sk),
        g('fg-head' + (st.airwayOpen ? ' is-tilted' : ''), [circ(100, 145, 22, 'fg-skin ' + sk), path('M78 146 a 22 22 0 0 1 22 -22 q -10 12 -22 22', 'fg-hair ' + hr), path('M108 139 l6 0', 'fg-eyeclosed'), path('M112 153 q 4 2 7 -1', 'fg-mouth')]),
        st.airwayOpen && !st.positioned ? g('fg-hand', [circ(93, 122, 8, 'fg-glove'), circ(121, 162, 7, 'fg-glove')]) : null
      ], { transform: 'translate(' + (240 - 240 * sc) + ' ' + (170 - 170 * sc) + ') scale(' + sc + ')' });
    }
    kids.push(body);
    /* ferida i control */
    if (st.bleed !== 'none' && st.bleed) {
      kids.push(circ(woundAt[0], woundAt[1], st.bleed === 'major' ? 9 : 5, 'fg-wound'));
      if (st.bleed === 'major' && !st.ctrl && !st.dead) kids.push(g('fg-drip', [circ(woundAt[0] + 4, woundAt[1] + 12, 3, 'fg-blood a-drip'), circ(woundAt[0] - 3, woundAt[1] + 12, 2.5, 'fg-blood a-drip2')]));
    }
    if (st.ctrl === 'tourniquet') kids.push(g('fg-tq', [rect(woundAt[0] - 30, woundAt[1] - 14, 10, 30, 'fg-tqband', 2), rect(woundAt[0] - 40, woundAt[1] - 18, 30, 5, 'fg-tqrod', 2)]));
    if (st.ctrl === 'pressure') kids.push(g('fg-pad', [rect(woundAt[0] - 14, woundAt[1] - 12, 28, 18, 'fg-gauze', 4), circ(woundAt[0], woundAt[1] - 18, 10, 'fg-glove')]));
    if (st.tag) kids.push(g('fg-tag a-tag', [rect(st.post === 'stand' ? 178 : 216, st.post === 'stand' ? 104 : 110, 16, 18, 'fg-tape tape-' + st.tag, 3)]));
    return s('svg', { viewBox: '0 0 420 220', class: cls.join(' '), role: 'img', focusable: 'false' }, kids);
  }

  /* ---------- icones (24×24, traç) ---------- */
  const IC = {
    walk: 'M13 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M10 8l-3 4 3 1 1 3-2 5M10 8l4 2 2 3M11 13l3 3 1 5',
    breath: 'M12 4v7M12 11c-3 0-7 1-7 6v2c0 1 1 2 2 1l5-3M12 11c3 0 7 1 7 6v2c0 1-1 2-2 1l-5-3',
    airway: 'M7 13c0-4 3-8 8-8 3 0 5 2 5 5 0 2-1 3-2 4l1 3h-3v3h-5M4 20l4-4M4 12h3',
    rr: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l3 2M9 2h6',
    radial: 'M3 12h4l2-5 3 10 3-8 2 3h4',
    crt: 'M8 21v-9a2 2 0 0 1 4 0v-2a2 2 0 0 1 4 0v11M8 14H6a2 2 0 0 0 0 4h2M12 6V3M16 6l2-2M8 6L6 4',
    mental: 'M4 5h16v10H9l-5 4zM9 10h.01M12 10h.01M15 10h.01',
    pressure: 'M7 11V6a1.5 1.5 0 0 1 3 0v4M10 9V4a1.5 1.5 0 0 1 3 0v5M13 9V5a1.5 1.5 0 0 1 3 0v6M16 9a1.5 1.5 0 0 1 3 0v4c0 4-3 7-7 7s-6-2-7-5l-1-4a1.5 1.5 0 0 1 3-1l1 2',
    tourniquet: 'M4 9h16v6H4zM9 9v6M12 5v4M12 15v4M10 5h4M10 19h4',
    position: 'M3 18h18M5 18c0-3 2-5 5-5h3l4 3M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M15 16l3-4',
    rescue: 'M5 12a7 7 0 0 1 14 0M8 12c0 2 2 4 4 4s4-2 4-4M12 3v3M3 8l2 1M21 8l-2 1',
    cpr: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10zM12 9v6M9 12h6',
    secondary: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5.5-5.5',
    megaphone: 'M3 10v4h3l7 5V5L6 10zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14',
    wait: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9',
    ambulance: 'M2 16V8h11v8M13 11h4l4 3v2h-8M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.5 9.5v4M5.5 11.5h4',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    soundOn: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
    soundOff: 'M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    auto: 'M12 21a9 9 0 1 0 0-18v18zM12 3a9 9 0 0 1 0 18',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 1v4M12 19v4M1 12h4M19 12h4',
    play: 'M7 4l13 8-13 8z', pause: 'M7 4h4v16H7zM14 4h4v16h-4z',
    check: 'M4 12l5 5L20 6', cross: 'M6 6l12 12M18 6L6 18',
    award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14l-1.5 8 5-3 5 3-1.5-8',
    back: 'M15 18l-6-6 6-6', next: 'M9 18l6-6-6-6',
    tag: 'M20 12l-8 8-9-9V3h8zM7.5 7.5h.01',
    map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
    warn: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    run: 'M13 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M4 21l4-6 3 2 1-5 4 3 4-1M9 9l3-2 3 4',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    cards: 'M4 6h12v14H4zM8 2h12v14',
    trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
    dice: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 15.5h.01M15.5 8.5h.01M8.5 15.5h.01M12 12h.01',
    grad: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
    timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4M9 2h6M19 6l1.5-1.5',
    lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
    replay: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5'
  };
  function icon(name, cls) {
    const d = IC[name] || IC.info;
    return s('svg', { viewBox: '0 0 24 24', class: 'ic' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true', focusable: 'false' }, [path(d, '')]);
  }
  /* il·lustració d'inici: cintes de triatge */
  function hero() {
    const k = [rect(0, 0, 360, 200, 'hero-bg', 24)];
    const tapes = [['red', -14, 40], ['yellow', -6, 80], ['green', 4, 120], ['black', 12, 160]];
    tapes.forEach(function (t, i) { k.push(g('hero-tape a-tape', [rect(-150, -14, 300, 28, 'tape-' + t[0], 6), text(0, 6, ['I', 'II', 'III', '✝'][i], 'hero-tapetxt')], { transform: rot(180, t[2] - 10, t[1]), style: 'animation-delay:' + (i * 0.12) + 's' })); });
    k.push(g('hero-cross', [circ(300, 44, 26, 'hero-crossbg'), rect(294, 30, 12, 28, 'hero-crossfg', 2), rect(286, 38, 28, 12, 'hero-crossfg', 2)]));
    return s('svg', { viewBox: '0 0 360 200', class: 'hero', 'aria-hidden': 'true', focusable: 'false' }, k);
  }

  const A = { s: s, icon: icon, drawMap: drawMap, victimMarker: victimMarker, rescuer: rescuer, ambulance: ambulance, figure: figure, hero: hero, ICONS: Object.keys(IC) };
  if (typeof module !== 'undefined' && module.exports) module.exports = A; else root.TriageArt = A;
})(typeof window !== 'undefined' ? window : this);
