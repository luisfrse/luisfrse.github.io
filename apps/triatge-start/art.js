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

  /* ---------- escenaris nous ---------- */
  function slab(x, y, w, h, a, cls) { return rect(-w / 2, -h / 2, w, h, cls || 'm-slab', 3, { transform: rot(x, y, a) }); }
  function building(x, y, w, h, cols, rows, cls, crack) {
    const k = [rect(x + 8, y + 8, w, h, 'm-shadow', 4), rect(x, y, w, h, cls || 'm-build', 4)];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) k.push(rect(x + 14 + c * ((w - 28) / cols), y + 14 + r * ((h - 28) / rows), (w - 28) / cols - 10, (h - 28) / rows - 12, 'm-win', 2));
    if (crack) k.push(path(crack, 'm-crack'));
    return g('d-bld', k);
  }
  function road(y, h, dashY) { const k = [rect(0, y, 1180, h, 'm-asphalt')]; for (let x = 20; x < 1180; x += 90) k.push(rect(x, dashY || y + h / 2 - 3, 50, 6, 'm-line', 2)); return k; }
  function vehicle(x, y, a, len, w, cls, extra) { return g('d-veh', [rect(-len / 2 + 5, -w / 2 + 5, len, w, 'm-shadow', 8), rect(-len / 2, -w / 2, len, w, cls, 8), rect(len / 2 - 24, -w / 2 + 4, 16, w - 8, 'm-glass', 3)].concat(extra || []), { transform: rot(x, y, a) }); }
  function fireTruck(x, y, a) { return vehicle(x, y, a, 150, 46, 'm-firetruck', [rect(-60, -6, 100, 12, 'm-ladder', 2), circ(-66, -14, 4, 'm-beacon1'), circ(-66, 14, 4, 'm-beacon2')]); }
  function flames(x, y, n) { const out = []; for (let i = 0; i < n; i++) out.push(path('M' + (x + i * 30) + ' ' + y + ' q 10 -30 0 -50 q 22 18 16 50 z', 'm-fire a-flame', { style: 'animation-delay:' + (-i * 0.3) + 's' })); return g('d-fire', out); }
  function policeCar(x, y, a) { return vehicle(x, y, a, 84, 40, 'm-police', [rect(-8, -16, 10, 32, 'm-policestripe', 2), circ(-2, -10, 4, 'm-beacon1'), circ(-2, 10, 4, 'm-beacon2')]); }
  function rubbleAt(poly, seed) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    const R = prng(seed), k = [s('polygon', { points: poly.map((p) => p.join(',')).join(' '), class: 'm-rubble' })];
    for (let i = 0; i < 7; i++) k.push(slab(Math.round(x0 + 60 + R() * (x1 - x0 - 120)), Math.round(y0 + 50 + R() * (y1 - y0 - 100)), 90 + R() * 90, 26 + R() * 10, Math.round(R() * 70 - 35)));
    k.push(debris(seed + 3, x0, y0, x1 - x0, y1 - y0, 60));
    return g('d-rubble', k);
  }
  Object.assign(SCENES, {
    sismo: function () {
      const k = [rect(0, 0, 2400, 1500, 'm-ground')];
      [[0, 500, 1980, 80], [0, 1000, 1980, 80]].forEach((r) => { k.push(rect(r[0], r[1], r[2], r[3], 'm-asphalt')); for (let x = 20; x < 1980; x += 90) k.push(rect(x, r[1] + r[3] / 2 - 3, 50, 6, 'm-line', 2)); });
      k.push(rect(900, 0, 80, 1500, 'm-asphalt'));
      k.push(rubbleAt([[200, 120], [640, 120], [660, 440], [180, 440]], 61));
      k.push(rubbleAt([[1100, 620], [1600, 620], [1620, 960], [1080, 960]], 67));
      k.push(rubbleAt([[160, 1120], [640, 1120], [660, 1420], [140, 1420]], 71));
      k.push(building(1100, 120, 300, 280, 3, 3, 'm-build', 'M1220 120 L1250 220 L1230 300 L1260 400'));
      k.push(building(1520, 110, 380, 190, 4, 2, 'm-build2', 'M1700 110 L1690 200 L1720 300'));
      k.push(building(700, 640, 160, 300, 2, 3, 'm-build2'));
      k.push(rect(1080, 1120, 860, 330, 'm-grass2', 10));
      k.push(trees([[1150, 1200], [1350, 1300], [1550, 1180], [1750, 1320], [1880, 1420], [60, 640], [60, 900]], 73));
      k.push(vehicle(400, 540, 2, 90, 40, 'm-car')); k.push(vehicle(1300, 1040, 180, 90, 40, 'm-car2')); k.push(vehicle(940, 760, 90, 150, 46, 'm-firetruck'));
      k.push(smoke(420, 260, 5)); k.push(smoke(1350, 760, 5)); k.push(smoke(400, 1250, 4));
      return k;
    },
    avion: function () {
      const k = [rect(0, 0, 2400, 1500, 'm-ground')];
      k.push(rect(0, 300, 1980, 140, 'm-asphalt'));
      for (let x = 40; x < 1980; x += 120) k.push(rect(x, 366, 70, 8, 'm-line', 2));
      k.push(rect(0, 1130, 1980, 60, 'm-asphalt'));
      k.push(path('M300 380 C 500 420 600 520 700 590', 'm-skid'));
      /* avió partit en tres trams */
      const fus = (x, y, a, len, nose) => g('', [rect(-len / 2 + 8, -38, len, 76, 'm-shadow', 30), rect(-len / 2, -42, len, 84, 'm-plane', nose ? 40 : 20)].concat(Array.from({ length: Math.floor(len / 40) - 1 }, (u, i) => rect(-len / 2 + 30 + i * 40, -30, 16, 10, 'm-glass', 3))), { transform: rot(x, y, a) });
      k.push(fus(690, 600, 32, 420, true));
      k.push(fus(1200, 690, 12, 340, false));
      k.push(g('', [path('M-260 0 L120 -40 L180 0 L120 40 Z', 'm-wing')], { transform: rot(1200, 690, 80) }));
      k.push(fus(1620, 940, -18, 300, false));
      k.push(g('', [path('M130 0 L230 -80 L250 -80 L190 0 Z M130 0 L230 80 L250 80 L190 0 Z', 'm-wing')], { transform: rot(1620, 940, -18) }));
      k.push(puddle(1620, 980, 160, 60, 'm-fuel'));
      k.push(g('', [circ(840, 990, 40, 'm-engine'), circ(840, 990, 20, 'm-dark')]));
      k.push(debris(83, 420, 460, 1400, 620, 120));
      k.push(flames(560, 600, 5)); k.push(flames(1530, 960, 4));
      k.push(rect(60, 1180, 460, 260, 'm-build', 8)); k.push(text(290, 1320, 'T1', 'm-label m-center m-faint'));
      [[300, 520, 30], [1000, 520, -10], [1820, 760, 60]].forEach((p) => k.push(fireTruck(p[0], p[1], p[2])));
      k.push(smoke(700, 560, 6)); k.push(smoke(1600, 900, 6));
      return k;
    },
    tiroteo: function () {
      const k = [rect(0, 0, 1600, 1000, 'm-ground')];
      k.push(rect(30, 580, 1150, 400, 'm-plaza', 8));
      /* aparcament */
      k.push(rect(780, 40, 390, 540, 'm-asphalt'));
      for (let i = 0; i < 7; i++) { k.push(rect(800, 70 + i * 70, 90, 4, 'm-line')); k.push(rect(1060, 70 + i * 70, 90, 4, 'm-line')); }
      [[850, 140, 'm-car'], [1110, 210, 'm-car2'], [850, 350, 'm-car2'], [1110, 420, 'm-car'], [1110, 70, 'm-car']].forEach((c) => k.push(car(c[0], c[1], 0, c[2])));
      /* centre comercial (vista de coberta) */
      k.push(rect(130, 130, 640, 440, 'm-shadow', 6));
      k.push(rect(120, 120, 640, 440, 'm-mall', 6));
      for (let i = 0; i < 3; i++) k.push(rect(180 + i * 200, 180, 120, 60, 'm-skylight', 6));
      k.push(rect(140, 300, 600, 3, 'm-roofrib')); k.push(rect(440, 140, 3, 400, 'm-roofrib'));
      [[260, 548], [590, 548]].forEach((p) => k.push(rect(p[0], p[1], 90, 14, 'm-door', 3)));
      k.push(text(440, 370, 'C.C.', 'm-label m-center m-faint'));
      /* cordó policial al voltant de l'edifici */
      k.push(s('rect', { x: 100, y: 100, width: 680, height: 480, rx: 10, class: 'm-cordon' }));
      k.push(policeCar(330, 620, 10)); k.push(policeCar(640, 615, -8)); k.push(policeCar(90, 340, 90));
      [[220, 700], [480, 720], [760, 700], [300, 880], [600, 860], [900, 840]].forEach((p) => { k.push(rect(p[0] - 30, p[1] - 8, 60, 16, 'm-bench', 4)); });
      k.push(trees([[60, 60], [60, 960], [1150, 980], [960, 640], [1140, 640]], 59));
      return k;
    },
    terremoto: function () {
      const k = [rect(0, 0, 1600, 1000, 'm-ground')];
      k.push(rect(0, 570, 1180, 40, 'm-sidewalk')); k.push(rect(0, 720, 1180, 40, 'm-sidewalk'));
      road(610, 110).forEach((x) => k.push(x));
      k.push(path('M0 664 L240 660 L260 690 L330 650 L520 668', 'm-crackroad'));
      /* edifici esfondrat: munt de runa i lloses */
      k.push(path('M230 560 L250 300 L330 210 L460 190 L600 230 L700 200 L740 380 L730 560 Z', 'm-rubble'));
      [[330, 300, 150, 30, 18], [470, 260, 180, 34, -12], [600, 340, 160, 30, 30], [420, 430, 210, 36, -6], [560, 470, 150, 30, 14], [320, 470, 120, 28, -24]].forEach((s) => k.push(slab(s[0], s[1], s[2], s[3], s[4])));
      k.push(rect(240, 180, 30, 160, 'm-wallstub', 2)); k.push(rect(690, 170, 26, 120, 'm-wallstub', 2));
      k.push(debris(41, 230, 200, 520, 380, 70));
      k.push(building(920, 110, 230, 190, 3, 2, 'm-build', 'M1000 110 L1022 170 L1006 220 L1032 300'));
      k.push(building(40, 60, 170, 110, 3, 1, 'm-build2'));
      k.push(vehicle(340, 640, 4, 90, 40, 'm-car')); k.push(vehicle(860, 690, 178, 90, 40, 'm-car2', [slab(0, 0, 50, 24, 20, 'm-slab')]));
      k.push(vehicle(1060, 650, 0, 110, 44, 'm-firetruck'));
      k.push(trees([[80, 820], [300, 860], [540, 840], [780, 860], [1020, 840]], 31));
      k.push(smoke(480, 300, 5));
      return k;
    },
    incendio: function () {
      const k = [rect(0, 0, 1600, 1000, 'm-ground')];
      k.push(rect(0, 470, 1180, 40, 'm-sidewalk'));
      road(510, 140).forEach((x) => k.push(x));
      k.push(rect(0, 650, 1180, 30, 'm-sidewalk'));
      k.push(building(300, 110, 460, 360, 5, 4, 'm-build'));
      k.push(rect(500, 400, 70, 70, 'm-dark', 3));
      [[330, 380], [460, 290], [640, 200], [690, 380]].forEach((p) => k.push(rect(p[0], p[1], 50, 50, 'm-firewin', 3)));
      k.push(flames(330, 470, 7));
      k.push(building(770, 110, 240, 320, 3, 3, 'm-build2'));
      k.push(building(60, 120, 200, 300, 2, 3, 'm-build2'));
      k.push(fireTruck(560, 560, 0)); k.push(fireTruck(900, 600, 180));
      k.push(path('M600 545 C 580 500 560 480 535 470', 'm-hose')); k.push(path('M860 590 C 800 520 720 500 700 470', 'm-hose'));
      k.push(rect(60, 690, 1100, 290, 'm-grass2', 10));
      k.push(trees([[120, 760], [300, 820], [480, 760], [700, 830], [900, 770], [1100, 840], [220, 940], [620, 950], [1000, 940]], 37));
      k.push(smoke(520, 170, 7)); k.push(smoke(380, 230, 5));
      return k;
    },
    atropello: function () {
      const k = [rect(0, 0, 1600, 1000, 'm-ground')];
      road(240, 120).forEach((x) => k.push(x));
      for (let i = 0; i < 6; i++) k.push(rect(880 + i * 26, 244, 14, 112, 'm-zebra', 1));
      k.push(rect(0, 360, 1180, 300, 'm-sidewalk'));
      k.push(g('d-shelter', [rect(560, 372, 180, 40, 'm-shadow', 4), rect(552, 366, 180, 40, 'm-shelter', 4), rect(552, 366, 180, 8, 'm-dark', 2)]));
      k.push(path('M420 300 C 470 330 520 380 560 420', 'm-skid'));
      k.push(vehicle(620, 480, 24, 150, 64, 'm-van', [rect(-40, -26, 70, 52, 'm-vanroof', 4)]));
      k.push(puddle(640, 560, 80, 30, 'm-fuel'));
      k.push(debris(53, 480, 400, 300, 220, 30));
      /* terrassa del bar amb tendal */
      k.push(rect(800, 560, 290, 250, 'm-terrace', 6));
      k.push(rect(800, 560, 290, 40, 'm-awning2', 4));
      [[850, 650], [940, 640], [1030, 660], [870, 740], [970, 750], [1050, 760]].forEach((p, i) => { k.push(circ(p[0], p[1], 18, 'm-table')); if (i % 2) k.push(rect(p[0] - 8, p[1] + 22, 16, 10, 'm-chair', 2)); });
      /* plaça pavimentada amb jardineres */
      k.push(rect(30, 680, 1120, 300, 'm-plaza', 8));
      [[300, 860], [520, 860], [750, 850]].forEach((p) => { k.push(rect(p[0] - 40, p[1] - 22, 80, 44, 'm-planter', 8)); k.push(circ(p[0], p[1], 16, 'm-tree')); });
      k.push(vehicle(200, 300, 0, 90, 40, 'm-car')); k.push(vehicle(1020, 290, 180, 130, 48, 'm-bus'));
      k.push(trees([[100, 60], [300, 90], [520, 60], [760, 80], [1000, 60], [1140, 120]], 47));
      return k;
    }
  });

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
    const hots = S.hots ? S.hots.map((z) => z.poly) : [S.hot];
    return [defs,
      s('polygon', { points: S.warm.map((p) => p.join(',')).join(' '), class: 'm-warm' })].concat(
      hots.map((poly) => s('polygon', { points: poly.map((p) => p.join(',')).join(' '), class: 'm-hot', fill: 'url(#' + prefix + '-hatch)' })));
  }
  function drawMap(D, settingId) {
    const prefix = 'mp' + (++uid);
    const S = D.SETTINGS[settingId];
    const bg = g('map-bg', (SCENES[settingId] || SCENES.bus)());
    const zg = g('map-zones', zones(S, prefix));
    if (!S.cold) return g('map-static', [bg, zg, g('map-cold', coldZone(D, prefix))]);
    /* mapa gran: la zona freda comuna es desplaça i s'allarga a tota l'alçada */
    const o = S.cold, W = S.map.w, H = S.map.h;
    const coldBase = rect(D.COLD.x + o.dx, 0, W - D.COLD.x - o.dx, H, 'm-coldbase');
    const road = rect(D.COLD.x + o.dx + 60, o.dy + 800, W - D.COLD.x - o.dx - 60, 140, 'm-asphalt');
    const labels = g('map-sectors', (S.sectors || []).map((sec, i) => text(sec.x, sec.y - 70, String.fromCharCode(65 + i), 'm-label m-center m-sector')));
    return g('map-static', [bg, zg, labels, coldBase, road, g('map-cold', coldZone(D, prefix), { transform: 'translate(' + o.dx + ' ' + o.dy + ')' })]);
  }

  /* ---------- peligros visibles i resposta dels equips d'emergència ---------- */
  /* Tot el color surt de classes CSS (hv-*). Animació només amb CSS (pocs nodes); sense moviment, cada estat és estàtic. */
  function bbox(poly) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: Math.round((x0 + x1) / 2), cy: Math.round((y0 + y1) / 2) };
  }
  const atF = (b, f) => [Math.round(b.x0 + f[0] * b.w), Math.round(b.y0 + f[1] * b.h)];
  const polyPts = (pl) => pl.map((p) => p[0] + ',' + p[1]).join(' ');
  const GLYPH = {
    flame: 'M0 15c-8 0-11-6-8-13 2 3 4 3 4-3 5 4 12 6 12 16-2 1-5 0-8 0z',
    bolt: 'M3 -13L-8 4H-1L-3 15L8 -4H1z',
    crack: 'M-10 -12L-2 -2L-8 5L3 15',
    gas: 'M-9 -10c5 4-5 8 0 12M0 -10c5 4-5 8 0 12M9 -10c5 4-5 8 0 12M-9 8h18',
    excl: 'M0 -11V3M0 10v.5',
    tilt: 'M-10 13L-10 -3L8 -12M8 -12l-2 8M8 -12l-8 2'
  };
  function hvFlames(x, y, n, sc) {
    const R = prng(x * 31 + y * 7 + n), out = [];
    for (let i = 0; i < n; i++) {
      const px = Math.round(x + (i - (n - 1) / 2) * 30 * sc), hh = Math.round((46 + R() * 42) * sc), w = Math.round(15 * sc);
      out.push(g('hv-flame', [
        path('M' + (px - w) + ' ' + y + ' Q' + (px - w * 1.4) + ' ' + (y - hh * 0.5) + ' ' + px + ' ' + (y - hh) + ' Q' + (px + w * 1.4) + ' ' + (y - hh * 0.45) + ' ' + (px + w) + ' ' + y + ' Z', 'hv-fire1'),
        path('M' + (px - w * 0.55) + ' ' + y + ' Q' + (px - w * 0.7) + ' ' + (y - hh * 0.3) + ' ' + px + ' ' + (y - hh * 0.62) + ' Q' + (px + w * 0.7) + ' ' + (y - hh * 0.28) + ' ' + (px + w * 0.55) + ' ' + y + ' Z', 'hv-fire2')
      ], { style: 'animation-delay:' + (-i * 0.31).toFixed(2) + 's' }));
    }
    return g('hv-fire hv-out', out);
  }
  function hvSparks(x, y, sc) {
    const k = [circ(x, y, Math.round(24 * sc), 'hv-glow')];
    [20, 95, 170, 255, 320].forEach(function (deg, i) {
      const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), r = (14 + (i % 2) * 8) * sc;
      const p1 = [x + ca * r, y + sa * r], p2 = [x + ca * r * 1.8 - sa * 7, y + sa * r * 1.8 + ca * 7], p3 = [x + ca * r * 2.6 + sa * 5, y + sa * r * 2.6 - ca * 5];
      k.push(path('M' + x + ' ' + y + ' L' + Math.round(p1[0]) + ' ' + Math.round(p1[1]) + ' L' + Math.round(p2[0]) + ' ' + Math.round(p2[1]) + ' L' + Math.round(p3[0]) + ' ' + Math.round(p3[1]), 'hv-spark'));
    });
    return g('hv-sparks hv-out', k, { style: 'animation-delay:' + (-((x + y) % 7) * 0.13).toFixed(2) + 's' });
  }
  function hvCable(a, b2) {
    const mx = (a[0] + b2[0]) / 2, my = (a[1] + b2[1]) / 2, dx = b2[0] - a[0], dy = b2[1] - a[1];
    const d = 'M' + a[0] + ' ' + a[1] + ' C' + Math.round(a[0] + dx * 0.25 - dy * 0.12) + ' ' + Math.round(a[1] + dy * 0.25 + dx * 0.12 + 40) + ' ' + Math.round(mx + dy * 0.1) + ' ' + Math.round(my - dx * 0.1 - 30) + ' ' + Math.round(b2[0] - dx * 0.2) + ' ' + Math.round(b2[1] - dy * 0.2 + 30) + ' S ' + b2[0] + ' ' + b2[1] + ' ' + b2[0] + ' ' + b2[1];
    return g('hv-cablegrp', [path(d, 'hv-cable'), path(d, 'hv-cableh')]);
  }
  function hvSpill(x, y, rx, ry) {
    return g('hv-spillgrp', [puddle(x, y, rx, ry, 'hv-spill'), path('M' + Math.round(x - rx * 0.55) + ' ' + Math.round(y - ry * 0.25) + ' q ' + Math.round(rx * 0.45) + ' ' + Math.round(-ry * 0.5) + ' ' + Math.round(rx * 0.95) + ' ' + Math.round(-ry * 0.1), 'hv-sheen'), path('M' + Math.round(x - rx * 0.3) + ' ' + Math.round(y + ry * 0.15) + ' q ' + Math.round(rx * 0.4) + ' ' + Math.round(-ry * 0.35) + ' ' + Math.round(rx * 0.8) + ' ' + Math.round(-ry * 0.05), 'hv-sheen hv-sheen2')]);
  }
  function hvFumes(x, y) {
    return g('hv-fumes hv-out', [-34, 0, 34].map((o, i) => path('M' + (x + o) + ' ' + y + ' c 10 -14 -10 -28 0 -44 c 10 -14 -10 -28 0 -44', 'hv-fume', { style: 'animation-delay:' + (-i * 0.8) + 's' })));
  }
  function hvCracks(x, y, sc, seed) {
    const R = prng(seed || x + y), d = [];
    [-150, -20, 70, 160].forEach(function (deg) {
      let px = x, py = y, a = deg * Math.PI / 180, str = 'M' + x + ' ' + y;
      for (let i = 0; i < 5; i++) { a += (R() - 0.5) * 1.1; const l = (22 + R() * 22) * sc; px += Math.cos(a) * l; py += Math.sin(a) * l; str += ' L' + Math.round(px) + ' ' + Math.round(py); }
      d.push(str);
    });
    return g('hv-cracks', [path(d.join(' '), 'hv-crack'), path(d.join(' '), 'hv-crackhi')]);
  }
  function hvDust(x, y, n) {
    const out = []; for (let i = 0; i < n; i++) out.push(circ(x + (i % 3) * 30 - 30, y + (i % 2) * 20, 26 + i * 6, 'hv-dust', { style: 'animation-delay:' + (-i * 1.1) + 's' }));
    return g('hv-dustgrp hv-out', out);
  }
  function hvTilt(x, y, sc) {
    const w = 150 * sc, h2 = 84 * sc;
    return g('hv-tiltgrp hv-out', [
      rect(-w / 2, -h2 / 2, w, h2, 'hv-tiltbox', 6, { transform: rot(x, y, -9) }),
      path('M' + Math.round(x - w / 2 - 16) + ' ' + Math.round(y + h2 / 2) + ' q -6 ' + Math.round(-h2 * 0.6) + ' ' + Math.round(h2 * 0.15) + ' ' + Math.round(-h2 * 0.8) + ' m 0 0 l -2 14 m 2 -14 l 12 8', 'hv-tiltarrow'),
      g('', [rect(-6, -4, 12, 8, 'hv-fall', 1)], { transform: 'translate(' + Math.round(x - w * 0.2) + ' ' + Math.round(y + h2 / 2 + 6) + ')' }),
      g('', [rect(-5, -3, 10, 6, 'hv-fall hv-fall2', 1)], { transform: 'translate(' + Math.round(x + w * 0.25) + ' ' + Math.round(y + h2 / 2 + 6) + ')' })
    ]);
  }
  function hvWarn(x, y, sym) {
    return g('hv-warn', [g('hv-warnin', [poly([[0, -36], [34, 24], [-34, 24]], 'hv-warnbg'), path(GLYPH[sym] || GLYPH.excl, 'hv-glyph')], { style: 'animation-delay:' + (-((x * 3 + y) % 5) * 0.4).toFixed(1) + 's' })], { transform: 'translate(' + x + ' ' + y + ') scale(1.2)' });
  }
  function hvCones(x, y, n) {
    const out = []; for (let i = 0; i < n; i++) { const cx = x + i * 34; out.push(g('', [rect(cx - 15, y + 8, 30, 8, 'hv-conebase', 2), poly([[cx, y - 22], [cx + 13, y + 10], [cx - 13, y + 10]], 'hv-cone'), rect(cx - 8, y - 4, 16, 5, 'hv-coneband', 1)])); }
    return g('hv-cones', out);
  }
  function hvThreat(x, y) {
    const body = 'M' + (x - 28) + ' ' + (y + 32) + ' q 0 -30 28 -30 q 28 0 28 30 z';
    return g('hv-threat', [
      g('thr-on', [circ(x, y, 52, 'hv-thr-pulse'), circ(x, y, 52, 'hv-thr-pulse hv-thr-pulse2'), circ(x, y, 47, 'hv-thr-dash'), circ(x, y - 16, 14, 'hv-thr-body'), path(body, 'hv-thr-body'), g('', [circ(x + 36, y - 40, 14, 'hv-thr-badge'), text(x + 36, y - 33, '!', 'hv-thr-bang m-center')])]),
      g('thr-off', [circ(x, y, 47, 'hv-thr-okring'), circ(x, y - 16, 14, 'hv-thr-calm'), path(body, 'hv-thr-calm'), g('', [circ(x + 36, y - 40, 14, 'hv-thr-okbadge'), path('M' + (x + 29) + ' ' + (y - 40) + ' l5 6 l10 -12', 'hv-thr-check')])])
    ]);
  }
  function hvMotif(m, b) {
    const p = m.at ? atF(b, m.at) : [0, 0];
    switch (m.m) {
      case 'flames': return hvFlames(p[0], p[1], m.n || 3, m.s || 1);
      case 'smoke': return g('hv-smk hv-out', [smoke(p[0], p[1], m.n || 4)]);
      case 'sparks': return hvSparks(p[0], p[1], m.s || 1);
      case 'cable': return hvCable(atF(b, m.from), atF(b, m.to));
      case 'spill': return hvSpill(p[0], p[1], m.rx || 100, m.ry || 34);
      case 'fumes': return hvFumes(p[0], p[1]);
      case 'cracks': return hvCracks(p[0], p[1], m.s || 1, p[0] * 3 + p[1]);
      case 'dust': return hvDust(p[0], p[1], m.n || 3);
      case 'tilt': return hvTilt(p[0], p[1], m.s || 1);
      case 'warn': return hvWarn(p[0], p[1], m.sym);
      case 'cones': return hvCones(p[0], p[1], m.n || 3);
      case 'threat': return hvThreat(p[0], p[1]);
      default: return null;
    }
  }
  /* vehicles i agents (vista des de dalt, orientats cap a la dreta) */
  function hvUnit(kind) {
    const bk = (x, y, c) => circ(x, y, 5, c);
    if (kind === 'police') return g('hv-unit hv-u-police', [rect(-38, -16, 84, 40, 'm-shadow', 8), rect(-42, -20, 84, 40, 'm-police', 8), rect(-8, -20, 10, 40, 'm-policestripe', 2), rect(12, -16, 18, 32, 'm-glass', 3), rect(-5, -9, 7, 18, 'hv-lightbar', 2), bk(-1, -9, 'hv-bk1'), bk(-1, 9, 'hv-bk2')]);
    if (kind === 'tech') return g('hv-unit hv-u-tech', [rect(-50, -18, 110, 46, 'm-shadow', 8), rect(-55, -23, 110, 46, 'hv-techvan', 8), rect(32, -19, 18, 38, 'm-glass', 3), path('M-6 -13L-16 3H-9L-11 13L0 -3H-7Z', 'hv-vanbolt'), bk(-46, -12, 'hv-bkamber'), bk(-46, 12, 'hv-bkamber hv-bkb')]);
    if (kind === 'usar') return g('hv-unit hv-u-usar', [rect(-70, -19, 150, 48, 'm-shadow', 9), rect(-75, -24, 150, 48, 'hv-usar', 9), rect(-62, -3, 80, 6, 'hv-usarstripe', 1), rect(-58, -17, 62, 9, 'hv-crane', 2), rect(44, -19, 22, 38, 'm-glass', 3), bk(-66, -15, 'hv-bk1'), bk(-66, 15, 'hv-bk2')]);
    return g('hv-unit hv-u-fire', [rect(-70, -19, 150, 48, 'm-shadow', 9), rect(-75, -24, 150, 48, 'm-firetruck', 9), rect(-60, -7, 86, 14, 'm-ladder', 2), circ(30, 0, 8, 'hv-turret'), rect(44, -19, 22, 38, 'm-glass', 3), bk(-66, -15, 'hv-bk1'), bk(-66, 15, 'hv-bk2')]);
  }
  function hvAgent(kind) {
    return g('hv-agent', [g('', [ell(2, 3, 14, 9, 'm-shadow'), ell(0, 0, 13, 9, 'hv-a-body hv-a-' + kind), circ(0, 0, 6.5, 'hv-a-helm hv-a-' + kind)], { transform: 'scale(1.6)' })]);
  }
  function hvActs(r, b, units) {
    const T = atF(b, r.target), out = [];
    const noz = (u) => [u.to.x + (u.to.a === -90 ? 0 : -80), u.to.y + (u.to.a === -90 ? -80 : 0)];
    (r.acts || []).forEach(function (a) {
      if (a === 'water' || (a === 'foam' && (r.acts || []).indexOf('water') < 0)) {
        units.filter((u) => u.kind === 'fire').slice(0, 2).forEach(function (u, i) {
          const n = noz(u), tx = T[0] + (i ? 40 : -30), ty = T[1] + (i ? 28 : -10);
          out.push(path('M' + n[0] + ' ' + n[1] + ' Q' + Math.round((n[0] + tx) / 2) + ' ' + Math.round(Math.min(n[1], ty) - 70) + ' ' + tx + ' ' + ty, 'hv-jet' + (a === 'foam' ? ' hv-jetfoam' : '')));
        });
      }
      if (a === 'water') { for (let i = 0; i < 3; i++) out.push(circ(T[0] - 30 + i * 28, T[1] - 6 + (i % 2) * 14, 7, 'hv-drop', { style: 'animation-delay:' + (-i * 0.3) + 's' })); }
      if (a === 'foam') { [[-50, 12, 30], [10, -10, 38], [60, 18, 28], [-10, 40, 34], [40, -30, 24]].forEach(function (o, i) { out.push(circ(T[0] + o[0], T[1] + o[1], o[2], 'hv-foam', { style: 'animation-delay:' + (i * 0.35) + 's' })); }); }
      if (a === 'props') { [[-60, 14, -32], [0, -18, 24], [60, 12, 38]].forEach(function (o) { out.push(rect(-46, -5, 92, 10, 'hv-prop', 2, { transform: rot(T[0] + o[0], T[1] + o[1], o[2]) })); }); }
      if (a === 'vent') { [-24, 0, 24].forEach(function (dy, i) { out.push(path('M' + (T[0] - 50) + ' ' + (T[1] + dy) + ' h 70 m -16 -12 l 16 12 l -16 12', 'hv-vent', { style: 'animation-delay:' + (-i * 0.4) + 's' })); }); }
      if (a === 'cut') { out.push(g('hv-cut', [circ(T[0], T[1], 34, 'hv-cutbg'), path('M' + (T[0] + 4) + ' ' + (T[1] - 18) + ' L' + (T[0] - 10) + ' ' + (T[1] + 4) + ' H' + (T[0] - 1) + ' L' + (T[0] - 4) + ' ' + (T[1] + 18) + ' L' + (T[0] + 10) + ' ' + (T[1] - 6) + ' H' + (T[0] + 1) + 'Z', 'hv-cutbolt'), line(T[0] - 26, T[1] - 26, T[0] + 26, T[1] + 26, 'hv-cutslash')])); }
      if (a === 'secure') { out.push(line(b.x1 + 28, b.y0, b.x1 + 28, b.y1, 'hv-pcordon')); }
      if (a === 'police') { out.push(s('polygon', { points: polyPts([[b.x0 - 14, b.y0 - 14], [b.x1 + 14, b.y0 - 14], [b.x1 + 14, b.y1 + 14], [b.x0 - 14, b.y1 + 14]]), class: 'hv-pcordon' })); }
    });
    return g('hv-act', out);
  }
  function responseArt(r, poly, b, o) {
    const entry = o.entry || { x: 1660, y: 900 };
    const kinds = []; for (let i = 0; i < (r.n || 1); i++) kinds.push(r.unit); if (r.units2) kinds.push(r.units2);
    const m = kinds.length;
    const units = kinds.map(function (k, i) {
      const off = i - (m - 1) / 2;
      const to = r.park === 's' ? { x: Math.round(b.cx + off * 130), y: b.y1 + 110, a: -90 } : { x: b.x1 + 84, y: Math.round(b.cy + off * 80), a: -180 };
      const legs = [{ x: to.x, y: entry.y, a: 180 }, { x: to.x, y: to.y, a: -90 }];
      if (to.a !== -90) legs.push({ x: to.x, y: to.y, a: to.a });
      const inner = g('hv-mvr', [hvUnit(k)]), outer = g('hv-mv hv-unitwrap', [inner]);
      return { kind: k, outer: outer, inner: inner, from: { x: entry.x, y: entry.y }, legs: legs, to: to };
    });
    const T = atF(b, r.target);
    const ring = [[-90, 70], [90, 70], [-48, -66], [48, -66], [0, 96]];
    const crewKind = (u) => (u.kind === 'fire' ? 'fire' : u.kind === 'police' ? 'police' : u.kind === 'tech' ? 'tech' : 'usar');
    const crewN = Math.min(4, Math.max(2, units.length * 2));
    const crew = [];
    for (let i = 0; i < crewN; i++) {
      const u = units[i % units.length], w = r.work && r.work.length ? atF(b, r.work[i % r.work.length]) : [T[0] + ring[i % ring.length][0], T[1] + ring[i % ring.length][1]];
      const sx = u.to.x + (u.to.a === -90 ? (i - 1.5) * 20 : -40), sy = u.to.y + (u.to.a === -90 ? -50 : (i % 2 ? 22 : -22));
      crew.push({ outer: g('hv-mv hv-crew', [hvAgent(crewKind(u))]), from: { x: sx, y: sy }, to: { x: w[0] + (r.work ? (i % 2 ? 22 : -22) : 0), y: w[1] + (r.work && i > 1 ? 18 : 0) }, delay: i * 0.18 });
    }
    const acts = hvActs(r, b, units);
    const el = g('dz-resp', [acts].concat(units.map((u) => u.outer)).concat(crew.map((c) => c.outer)));
    return { el: el, units: units, crew: crew };
  }
  /* zona de perill: franja groga i negra, símbols del perill, rètol i (si en té) la resposta dels equips. spec: {key, poly, def, label, state, entry} */
  function hazardZone(spec) {
    const b = bbox(spec.poly), def = spec.def || {};
    const tape = g('dz-tape', [s('polygon', { points: polyPts(spec.poly), class: 'hv-tape-b' }), s('polygon', { points: polyPts(spec.poly), class: 'hv-tape-y' })]);
    const art = g('dz-art', (def.motifs || []).map((m) => hvMotif(m, b)).filter(Boolean));
    const label = text(b.cx, b.y0 - 18, spec.label || '', 'm-label m-center hv-label');
    const resp = def.resp ? responseArt(def.resp, spec.poly, b, { entry: spec.entry }) : null;
    const el = g('dz' + (def.shake ? ' dz-shake' : ''), [tape, art, label].concat(resp ? [resp.el] : []), { 'data-key': spec.key, 'data-state': spec.state || 'on' });
    return { el: el, label: label, resp: resp, bbox: b };
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
  /* la teva ambulància (unitat de primera resposta) amb l'altaveu al sostre, ones sonores i rètol dinàmic (últim fill) */
  function speakerUnit(o) {
    const waves = g('spk-waves', [0, 1, 2].map((i) => circ(0, 0, 300, 'spk-wave', { style: 'animation-delay:' + (i * 0.45) + 's' })));
    const veh = g('spk-veh', vehicleTop('SVB').concat([
      rect(2, -9, 16, 18, 'spk-horn-base', 3),
      path('M16 -5 L34 -14 L34 14 L16 5 Z', 'spk-horn')
    ]), { transform: 'rotate(180)' });
    return g('spk', [
      waves,
      circ(0, 0, 50, 'spk-pad'),
      veh,
      text(0, 48, o.label || '', 'm-label m-center m-small spk-cap'),
      text(0, -46, '', 'm-label m-center spk-label')
    ], { transform: 'translate(' + Math.round(o.x) + ' ' + Math.round(o.y) + ') scale(1.35)', 'aria-hidden': 'true' });
  }

  /* ---------- figura lateral (panell de la víctima) ---------- */
  /* state: {post, skin, cloth, hair, ped, bleed:'none|minor|major', ctrl:'none|pressure|tourniquet', site, pale, cyan, dead, breathing, rr, airwayOpen, positioned, tag, walking} */
  function figure(st) {
    const sk = SKIN[(st.skin || 0) % 4], cl = CLOTH[(st.cloth || 0) % 6], hr = 'h' + ((st.hair || 0) % 4);
    const cls = ['fig'];
    if (st.pale) cls.push('is-pale'); if (st.cyan) cls.push('is-cyan'); if (st.dead) cls.push('is-dead'); if (!st.breathing) cls.push('no-breath');
    const kids = [rect(0, 168, 420, 52, 'fg-ground'), ell(210, 172, 170, 10, 'm-shadow')];
    /* vista ampliada (exact): període real de 60/FR segons, sense arrodonir a límits */
    const dur = st.breathing && st.rr ? (st.exact ? (60 / st.rr) : Math.max(0.9, Math.min(6, 60 / st.rr))).toFixed(2) + 's' : '0s';
    if (st.pattern) cls.push('br-' + st.pattern);
    const eye = (x, y) => st.eyes === 'closed' ? path('M' + (x - 3) + ' ' + y + ' l6 0', 'fg-eyeclosed') : st.eyes === 'lost' ? g('', [circ(x, y, 3.2, 'fg-eyewhite'), circ(x + 1.6, y - 1.2, 1.6, 'fg-eye')]) : circ(x, y, 2, 'fg-eye');
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
        g('fg-head', [circ(212, 32, 20, 'fg-skin ' + sk), path('M192 30 a 20 20 0 0 1 40 0 q -20 -10 -40 0', 'fg-hair ' + hr), eye(205, 33), eye(219, 33), path('M206 43 q 6 3 12 0', 'fg-mouth')])
      ], { transform: 'translate(' + (212 - 212 * sc) + ' ' + (170 - 170 * sc) + ') scale(' + sc + ')' });
    } else if (st.post === 'sit' && !st.dead) {
      body = g('fg-body', [
        rect(200, 142, 110, 18, 'fg-legs', 8), rect(290, 142, 18, 28, 'fg-legs', 6),
        g('fg-chest', [rect(170, 70, 46, 82, 'fg-cloth ' + cl, 16)], { style: '--br:' + dur }),
        rect(206, 92, 60, 13, 'fg-cloth ' + cl, 6), circ(270, 98, 7, 'fg-skin ' + sk),
        g('fg-head', [circ(192, 50, 21, 'fg-skin ' + sk), path('M171 48 a 21 21 0 0 1 42 0 q -21 -11 -42 0', 'fg-hair ' + hr), eye(200, 51), path('M196 62 q 6 3 10 0', 'fg-mouth')])
      ], { transform: 'translate(' + (240 - 240 * sc) + ' ' + (170 - 170 * sc) + ') scale(' + sc + ')' });
    } else {
      const bent = st.positioned;
      body = g('fg-body', [
        bent ? path('M250 150 L300 120 L345 150', 'fg-legline') : rect(250, 142, 120, 15, 'fg-legs', 7),
        rect(250, 152, 120, 15, 'fg-legs', 7),
        g('fg-chest', [rect(130, 128, 128, 38, 'fg-cloth ' + cl, 16)], { style: '--br:' + dur }),
        rect(150, 112, 70, 13, 'fg-cloth ' + cl, 6), circ(224, 118, 7, 'fg-skin ' + sk),
        g('fg-head' + (st.airwayOpen ? ' is-tilted' : ''), [circ(100, 145, 22, 'fg-skin ' + sk), path('M78 146 a 22 22 0 0 1 22 -22 q -10 12 -22 22', 'fg-hair ' + hr), st.eyes && st.eyes !== 'closed' ? eye(111, 139) : path('M108 139 l6 0', 'fg-eyeclosed'), path('M112 153 q 4 2 7 -1', 'fg-mouth')]),
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
    /* capes de símptomes (vista ampliada): suor, sutge, cremades, deformitat, soroll respiratori, respiració paradoxal */
    const pose = st.post === 'stand' || st.walking ? 'stand' : st.post === 'sit' && !st.dead ? 'sit' : 'lie';
    const head = { stand: [212, 32], sit: [192, 50], lie: [100, 145] }[pose];
    const chest = { stand: [212, 76], sit: [193, 105], lie: [194, 147] }[pose];
    if (st.sweat) kids.push(g('fg-sweat', [0, 1, 2].map((i) => path('M' + (head[0] - 14 + i * 12) + ' ' + (head[1] - 6 + (i % 2) * 6) + ' q 3 6 0 8 q -3 -2 0 -8', 'fg-drop'))));
    if (st.soot) kids.push(g('fg-soot', [ell(head[0] + 6, head[1] + 6, 9, 4, 'fg-sootmark'), ell(head[0] - 6, head[1] - 2, 6, 3, 'fg-sootmark')]));
    if (st.burns) { const b = { arm: [190, 128], leg: [300, 150], head: head, trunk: chest }[st.burns] || chest; kids.push(g('fg-burns', [ell(b[0], b[1], 22, 9, 'fg-burn'), ell(b[0] + 10, b[1] - 3, 9, 5, 'fg-blister'), ell(b[0] - 10, b[1] + 2, 7, 4, 'fg-blister')])); }
    if (st.deform) { const d = woundAt; kids.push(path('M' + (d[0] - 16) + ' ' + (d[1] - 4) + ' l10 -10 l10 14 l10 -10', 'fg-deform')); }
    if (st.noisy) kids.push(g('fg-noise', [path('M' + (head[0] + 26) + ' ' + (head[1] - 6) + ' q 6 6 0 12', 'fg-wave'), path('M' + (head[0] + 34) + ' ' + (head[1] - 10) + ' q 9 10 0 20', 'fg-wave fg-wave2')]));
    if (st.pattern === 'paradoxical' && st.breathing) kids.push(ell(chest[0] + 18, chest[1], 14, 9, 'fg-para', { style: '--br:' + dur }));
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
    soundAlerts: 'M4 9v6h4l5 4V5L8 9zM18 7v6M18 16.5v.5',
    quake: 'M2 12h4l2-4 3 9 2-6 2 3 2-2h5M4 20h16M6 4l2 2M18 4l-2 2',
    fire: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-2 4-3 5-1-2-1-4-3-6-1 4-4 6-4 11 0 4 3 7 7 7zM12 22c-2 0-3-1.5-3-3.5S12 14 12 14s3 2.5 3 4.5-1 3.5-3 3.5z',
    van: 'M2 17V7h12l4 4h4v6M2 17h20M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 7v4h4',
    bus: 'M4 4h16v13H4zM4 11h16M7 20v-3M17 20v-3M7 14h.01M17 14h.01',
    factory: 'M2 21V10l6 4V10l6 4V6h8v15zM6 17h2M12 17h2M18 17h2',
    stage: 'M3 20h18M5 20V9h14v11M3 9l9-5 9 5M9 13h6',
    train: 'M6 3h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM4 10h16M8 21l-2 2M16 21l2 2M8 14h.01M16 14h.01',
    gun: 'M3 9h15l3-2v6h-6l-1 2h-3l-1 3H6l1-4H3zM9 13v2',
    plane: 'M2 13l8-2 4-8h2l-2 8 6 1 2-2h2l-1 4 1 4h-2l-2-2-6 1 2 8h-2l-4-8-8-2z',
    filter: 'M3 5h18l-7 8v6l-4 2v-8z',
    speaker: 'M3 10v4h2l7 5V5L5 10zM15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12M21.5 3.5a12 12 0 0 1 0 17',
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

  /* canell amb pols que batega (vista ampliada) i ungla per al reompliment capil·lar */
  function wrist(o) {
    return s('svg', { viewBox: '0 0 160 90', class: 'wrist' + (o.present ? ' on' : ' off') + (o.weak ? ' weak' : ''), 'aria-hidden': 'true', focusable: 'false' }, [
      rect(0, 30, 160, 34, 'wr-arm ' + (o.skin || 'sk0'), 16), rect(120, 26, 40, 42, 'wr-hand ' + (o.skin || 'sk0'), 14),
      path('M10 44 C 50 40 80 50 118 46', 'wr-artery'), g('wr-beat', [circ(78, 46, 12, 'wr-ring'), circ(78, 46, 6, 'wr-dot')], { style: '--hb:' + (o.period || 1) + 's' }),
      g('wr-fingers', [rect(68, 52, 34, 10, 'fg-glove', 5), rect(66, 40, 34, 10, 'fg-glove', 5)])]);
  }
  const A = { s: s, icon: icon, drawMap: drawMap, hazardZone: hazardZone, wrist: wrist, victimMarker: victimMarker, rescuer: rescuer, ambulance: ambulance, speakerUnit: speakerUnit, figure: figure, hero: hero, ICONS: Object.keys(IC) };
  if (typeof module !== 'undefined' && module.exports) module.exports = A; else root.TriageArt = A;
})(typeof window !== 'undefined' ? window : this);
