/* ============================================================
   Mapa de puntos (dot density) del simulador de epidemias (sin dependencias).
   Cada punto representa N personas, repartidas al azar dentro de su territorio y
   coloreadas según el estado (S, E, I, R, V, D). Capas: data/geo/*.json, ya proyectadas
   a un lienzo de ancho 1000 (ver data/geo/creditos.json).
   ============================================================ */
(function (root) {
  'use strict';
  const COL = { S: '#7fb2ea', E: '#f5b82e', I: '#ff5d73', R: '#4ade80', V: '#b08be0', D: '#7d8ca2' };

  function pathOf(feat) {
    const p = new Path2D();
    for (const poly of feat.geom) for (const ring of poly) {
      p.moveTo(ring[0], ring[1]); for (let i = 2; i < ring.length; i += 2) p.lineTo(ring[i], ring[i + 1]); p.closePath();
    }
    return p;
  }
  function polyArea(ring) { let a = 0; const n = ring.length / 2; for (let i = 0, j = n - 1; i < n; j = i++) a += ring[j * 2] * ring[i * 2 + 1] - ring[i * 2] * ring[j * 2 + 1]; return Math.abs(a) / 2; }
  function inPoly(poly, x, y) {          // regla par-impar sobre todos los anillos del polígono
    let c = false;
    for (const ring of poly) {
      const n = ring.length / 2;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = ring[i * 2], yi = ring[i * 2 + 1], xj = ring[j * 2], yj = ring[j * 2 + 1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
    }
    return c;
  }
  function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const nicePer = (v) => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))); for (const m of [1, 2, 5, 10]) if (m * p >= v) return m * p; return 10 * p; };

  /* construye la vista: caminos, puntos (posiciones fijas) y rango de rangos */
  function build(geo, opts) {
    opts = opts || {};
    const n = geo.features.length, W = geo.bbox[2], H = geo.bbox[3];
    let total = 0; for (const f of geo.features) total += f.pop;
    const target = opts.dots || (n === 1 ? 4000 : n <= 12 ? 2500 : n <= 60 ? 3200 : 4200);
    const perDot = nicePer(total / target);
    const rnd = mulberry(12345);
    const feats = [];
    let nd = 0;
    for (const f of geo.features) {
      const cnt = Math.max(1, Math.round(f.pop / perDot));
      // reparto por polígono según área
      const areas = f.geom.map(p => polyArea(p[0])); const at = areas.reduce((a, b) => a + b, 0) || 1;
      const bb = f.geom.map(p => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const r = p[0]; for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } return [x0, y0, x1, y1]; });
      const xy = new Float32Array(cnt * 2);
      for (let k = 0; k < cnt; k++) {
        let u = rnd() * at, pi = 0; while (pi < areas.length - 1 && u > areas[pi]) { u -= areas[pi]; pi++; }
        const b = bb[pi], poly = f.geom[pi]; let x = (b[0] + b[2]) / 2, y = (b[1] + b[3]) / 2, tries = 0;
        do { x = b[0] + rnd() * (b[2] - b[0]); y = b[1] + rnd() * (b[3] - b[1]); tries++; } while (!inPoly(poly, x, y) && tries < 80);
        xy[k * 2] = x; xy[k * 2 + 1] = y;
      }
      const rank = new Float32Array(cnt); const perm = Array.from({ length: cnt }, (_, i) => i);
      for (let i = cnt - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
      for (let k = 0; k < cnt; k++) rank[k] = (perm[k] + 0.5) / cnt;
      feats.push({ path: pathOf(f), xy, rank, n: cnt });
      nd += cnt;
    }
    return { geo, feats, perDot, dots: nd, W, H, total };
  }

  function layout(view, cw, ch) {
    const pad = 6, s = Math.min((cw - 2 * pad) / view.W, (ch - 2 * pad) / view.H);
    return { s, ox: (cw - view.W * s) / 2, oy: (ch - view.H * s) / 2 };
  }

  /* dibuja el mapa; meta = EpiMeta.Meta; o = { sel, hover, time, reduce, tint } */
  function draw(ctx, cw, ch, view, meta, o) {
    o = o || {};
    ctx.clearRect(0, 0, cw, ch);
    const bg = ctx.createRadialGradient(cw * .5, ch * .45, cw * .05, cw * .5, ch * .5, cw * .8);
    bg.addColorStop(0, '#133354'); bg.addColorStop(.6, '#0a1b30'); bg.addColorStop(1, '#040a14');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
    const L = layout(view, cw, ch), n = view.feats.length;
    ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
    ctx.lineJoin = 'round';
    // territorios: relleno según prevalencia
    for (let i = 0; i < n; i++) {
      const T = meta.territory(i), prev = (T.E + T.I) / T.pop;
      ctx.fillStyle = 'rgba(30,58,92,.55)'; ctx.fill(view.feats[i].path, 'evenodd');
      if (prev > 0 && o.tint !== false) { ctx.fillStyle = `rgba(255,93,115,${Math.min(0.26, 0.05 + Math.sqrt(prev) * 1.6).toFixed(3)})`; ctx.fill(view.feats[i].path, 'evenodd'); }
    }
    ctx.lineWidth = Math.max(0.5, 0.9 / L.s); ctx.strokeStyle = 'rgba(176,139,224,.45)';
    for (let i = 0; i < n; i++) ctx.stroke(view.feats[i].path);
    if (o.hover != null && o.hover >= 0) { ctx.lineWidth = 2.2 / L.s; ctx.strokeStyle = '#fff'; ctx.stroke(view.feats[o.hover].path); }
    if (o.sel != null && o.sel >= 0) { ctx.lineWidth = 2.6 / L.s; ctx.strokeStyle = '#f5b82e'; ctx.stroke(view.feats[o.sel].path); }
    ctx.restore();
    // puntos
    const rad = Math.max(1.1, Math.min(3.6, cw / 330 * (view.dots > 3000 ? 1 : 1.3)));
    const groups = { S: [], V: [], R: [], D: [], E: [], I: [] };
    for (let i = 0; i < n; i++) {
      const T = meta.territory(i), f = view.feats[i], cnt = f.n, pop = T.pop;
      let fv = T.V / pop, fe = T.E / pop, fi = T.I / pop, fr = T.R / pop, fd = T.D / pop;
      const minw = 1 / cnt;
      if (T.E > 0 && fe < minw) fe = minw; if (T.I > 0 && fi < minw) fi = minw; if (T.D > 0 && fd < minw * 0.5) fd = minw * 0.5; if (T.V > 0 && fv < minw && fv > 0) fv = minw;
      const fs = Math.max(0, 1 - fv - fe - fi - fr - fd);
      // orden a lo largo del rango: V | S | E | I | R | D
      const c1 = fv, c2 = c1 + fs, c3 = c2 + fe, c4 = c3 + fi, c5 = c4 + fr;
      for (let k = 0; k < cnt; k++) {
        const r = f.rank[k], g = r < c1 ? 'V' : r < c2 ? 'S' : r < c3 ? 'E' : r < c4 ? 'I' : r < c5 ? 'R' : 'D';
        groups[g].push(f.xy[k * 2], f.xy[k * 2 + 1]);
      }
    }
    const X = (x) => L.ox + x * L.s, Y = (y) => L.oy + y * L.s;
    const dots = (arr, r) => { ctx.beginPath(); for (let i = 0; i < arr.length; i += 2) { const px = X(arr[i]), py = Y(arr[i + 1]); ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, 6.2832); } ctx.fill(); };
    ctx.fillStyle = COL.S; dots(groups.S, rad);
    ctx.fillStyle = COL.V; dots(groups.V, rad);
    ctx.fillStyle = COL.R; dots(groups.R, rad);
    ctx.fillStyle = COL.D; dots(groups.D, rad * 0.9);
    ctx.fillStyle = 'rgba(245,184,46,.95)'; dots(groups.E, rad * 1.1);
    const pulse = o.reduce ? 0.6 : 0.5 + 0.5 * Math.sin((o.time || 0) * 5);
    ctx.fillStyle = `rgba(255,93,115,${(0.18 + 0.16 * pulse).toFixed(2)})`; dots(groups.I, rad * (2.2 + pulse * 0.7));
    ctx.fillStyle = COL.I; dots(groups.I, rad * 1.25);
    // marca del origen
    const of = meta.origin; if (of != null) {
      const c = view.geo.features[of].c; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), rad * 3.4, 0, 6.2832); ctx.stroke();
    }
  }

  /* territorio bajo el puntero (coordenadas CSS del lienzo) */
  function hit(ctx, view, cw, ch, px, py, dpr) {
    const L = layout(view, cw, ch), x = (px - L.ox) / L.s, y = (py - L.oy) / L.s;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    let found = -1;
    for (let i = 0; i < view.feats.length; i++) if (ctx.isPointInPath(view.feats[i].path, x, y, 'evenodd')) { found = i; break; }
    ctx.restore();
    if (found < 0) { // tolerancia: territorio con centroide más cercano (< 12 px)
      let bd = 144; view.geo.features.forEach((f, i) => { const dx = f.c[0] * L.s + L.ox - px, dy = f.c[1] * L.s + L.oy - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; found = i; } });
    }
    return found;
  }

  /* silueta de un municipio para el modelo de agentes: transformación al cuadrado unidad y máscara raster */
  function unitMap(geo) { const S = Math.max(geo.bbox[2], geo.bbox[3]) * 1.08; return { S, cx: geo.bbox[2] / 2, cy: geo.bbox[3] / 2 }; }
  function domain(geo, n) {
    n = n || 256;
    const cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d', { willReadFrequently: true });
    const u = unitMap(geo); c.fillStyle = '#000'; c.setTransform(n / u.S, 0, 0, n / u.S, n / 2 - u.cx * n / u.S, n / 2 - u.cy * n / u.S);
    for (const f of geo.features) c.fill(pathOf(f), 'evenodd');
    const d = c.getImageData(0, 0, n, n).data, m = new Uint8Array(n * n);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0;
    let cnt = 0; for (let i = 0; i < m.length; i++) cnt += m[i];
    return { n, data: m, frac: cnt / m.length };
  }
  /* dibuja la silueta en un lienzo cuadrado de lado W */
  function drawSilhouette(ctx, W, geo) {
    const u = unitMap(geo), s = W / u.S;
    ctx.save(); ctx.setTransform(ctx.getTransform().a, 0, 0, ctx.getTransform().d, 0, 0);
    ctx.restore();
    ctx.save(); ctx.translate(W / 2 - u.cx * s, W / 2 - u.cy * s); ctx.scale(s, s);
    for (const f of geo.features) { const p = pathOf(f); ctx.fillStyle = 'rgba(30,58,92,.55)'; ctx.fill(p, 'evenodd'); ctx.lineWidth = 2 / s; ctx.strokeStyle = 'rgba(176,139,224,.6)'; ctx.stroke(p); }
    ctx.restore();
  }

  root.EpiMap = { build, draw, hit, domain, drawSilhouette, unitMap, layout, COL, nicePer };
})(window);
