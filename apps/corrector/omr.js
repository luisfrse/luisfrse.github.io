/* ============================================================
   Corrector de tests · reconocimiento óptico de marcas (OMR) en JavaScript propio
   Imagen → gris → binarización adaptativa (imagen integral) → 4 marcadores de esquina →
   homografía → muestreo de burbujas con umbral adaptativo por hoja.
   Sin dependencias; usable en el navegador y en Node (sin DOM).
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {});

  /* ---------- imagen ---------- */
  function toGray(rgba, w, h) {
    const g = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (77 * rgba[j] + 150 * rgba[j + 1] + 29 * rgba[j + 2]) >> 8;
    return g;
  }
  function binarize(g, w, h, ratio = 0.82) {
    const W1 = w + 1, I = new Float64Array(W1 * (h + 1));
    for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += g[y * w + x]; I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + row; } }
    const r = Math.max(10, Math.round(Math.min(w, h) / 9)), b = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        const s = I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0];
        const mean = s / ((x1 - x0) * (y1 - y0));
        b[y * w + x] = g[y * w + x] < mean * ratio ? 1 : 0;
      }
    }
    return b;
  }

  /* ---------- componentes conexas (8-vecindad) ---------- */
  function components(b, w, h, minA, maxA) {
    const seen = new Uint8Array(w * h), stack = new Int32Array(w * h), out = [];
    for (let s = 0; s < b.length; s++) {
      if (!b[s] || seen[s]) continue;
      let sp = 0, n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
      stack[sp++] = s; seen[s] = 1;
      while (sp) {
        const p = stack[--sp], x = p % w, y = (p - x) / w;
        n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= w) continue;
            const q = yy * w + xx; if (b[q] && !seen[q]) { seen[q] = 1; stack[sp++] = q; }
          }
        }
      }
      if (n < minA || n > maxA) continue;
      const cx = sx / n, cy = sy / n, m20 = sxx / n - cx * cx, m02 = syy / n - cy * cy, m11 = sxy / n - cx * cy;
      const tr = m20 + m02, det = Math.sqrt(Math.max(0, (m20 - m02) ** 2 + 4 * m11 * m11)), l1 = (tr + det) / 2, l2 = (tr - det) / 2;
      out.push({ x: cx, y: cy, area: n, bw: x1 - x0 + 1, bh: y1 - y0 + 1, fill: n / ((x1 - x0 + 1) * (y1 - y0 + 1)), iso: l1 > 0 ? l2 / l1 : 0 });
    }
    return out;
  }

  /* ---------- 4 marcadores de esquina ---------- */
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  function orderCW(pts) {
    const cx = pts.reduce((a, p) => a + p.x, 0) / 4, cy = pts.reduce((a, p) => a + p.y, 0) / 4;
    return pts.slice().sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
  }
  function findQuad(gray, w, h) {
    const bin = binarize(gray, w, h), minA = Math.max(40, w * h * 0.00008), maxA = w * h * 0.03;
    let cand = components(bin, w, h, minA, maxA).filter(c => c.iso > 0.55 && c.fill > 0.42 && c.bw / c.bh < 2.2 && c.bh / c.bw < 2.2);
    cand.sort((a, b) => b.area - a.area); cand = cand.slice(0, 14);
    let best = null, bestScore = 0;
    for (let a = 0; a < cand.length; a++) for (let b = a + 1; b < cand.length; b++) for (let c = b + 1; c < cand.length; c++) for (let d = c + 1; d < cand.length; d++) {
      const set = [cand[a], cand[b], cand[c], cand[d]], areas = set.map(p => p.area);
      const amin = Math.min(...areas), amax = Math.max(...areas); if (amax / amin > 2.6) continue;
      const q = orderCW(set);
      let convex = true; for (let i = 0; i < 4; i++) if (cross(q[i], q[(i + 1) % 4], q[(i + 2) % 4]) <= 0) convex = false;
      if (!convex) continue;
      const side = (i) => Math.hypot(q[(i + 1) % 4].x - q[i].x, q[(i + 1) % 4].y - q[i].y);
      const s0 = side(0), s1 = side(1), s2 = side(2), s3 = side(3);
      if (Math.max(s0, s2) / Math.min(s0, s2) > 1.8 || Math.max(s1, s3) / Math.min(s1, s3) > 1.8) continue;
      const lo = Math.min((s0 + s2) / 2, (s1 + s3) / 2), hi = Math.max((s0 + s2) / 2, (s1 + s3) / 2), ratio = hi / lo;
      if (ratio < 1.15 || ratio > 1.95) continue;
      const area = 0.5 * Math.abs(cross(q[0], q[1], q[2]) + cross(q[0], q[2], q[3]));
      const score = area * (amin / amax) / (1 + Math.abs(ratio - 1.468));
      if (score > bestScore) { bestScore = score; best = q; }
    }
    return best ? { pts: best, area: bestScore } : null;
  }

  /* ---------- homografía mm → píxeles ---------- */
  function solveH(src, dst) {   // src: [{x,y}] en mm, dst: [{x,y}] en px; devuelve [h0..h7]
    const A = [], B = [];
    for (let i = 0; i < 4; i++) {
      const { x, y } = src[i], { x: u, y: v } = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v);
    }
    const n = 8; for (let i = 0; i < n; i++) A[i].push(B[i]);
    for (let i = 0; i < n; i++) {
      let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      if (Math.abs(A[p][i]) < 1e-12) return null;
      [A[i], A[p]] = [A[p], A[i]];
      for (let r = 0; r < n; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; }
    }
    return A.map((row, i) => row[n] / row[i]);
  }
  const mapH = (H, x, y) => { const d = H[6] * x + H[7] * y + 1; return [(H[0] * x + H[1] * y + H[2]) / d, (H[3] * x + H[4] * y + H[5]) / d]; };

  /* ---------- muestreo ---------- */
  function sampler(g, w, h) {
    return (x, y) => {
      if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return 255;
      const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0, x1 = x0 + 1 < w ? 1 : 0, y1 = y0 + 1 < h ? w : 0;
      return (g[i] * (1 - fx) + g[i + x1] * fx) * (1 - fy) + (g[i + y1] * (1 - fx) + g[i + y1 + x1] * fx) * fy;
    };
  }
  /* oscuridad de un disco (mm) frente al papel de su entorno */
  function measure(smp, H, cx, cy, r, step) {
    const rin = r * 0.62, pap = [];
    for (let a = 0; a < 16; a++) {
      const ang = a * Math.PI / 8;
      for (const rr of [1.4, 1.6]) { const [u, v] = mapH(H, cx + Math.cos(ang) * r * rr, cy + Math.sin(ang) * r * rr); pap.push(smp(u, v)); }
    }
    pap.sort((a, b) => a - b); const paper = Math.max(40, pap[Math.floor(pap.length * 0.75)]);
    let sum = 0, n = 0, dark = 0;
    for (let y = -rin; y <= rin + 1e-6; y += step) for (let x = -rin; x <= rin + 1e-6; x += step) {
      if (x * x + y * y > rin * rin) continue;
      const [u, v] = mapH(H, cx + x, cy + y), gv = smp(u, v); sum += gv; n++; if (gv < paper * 0.6) dark++;
    }
    const m = n ? sum / n : paper, d = Math.max(0, Math.min(1, 1 - m / paper)), fr = n ? dark / n : 0;
    return { s: 0.6 * d + 0.4 * fr, d, fr, paper };
  }

  /* ---------- escaneo completo ---------- */
  /* img = { data:RGBA|null, gray?:Uint8Array, width, height }; g = geometría (CORR.geom.layout)
     opts: { nq, weak } */
  function scan(img, g, opts = {}) {
    const w = img.width, h = img.height, gray = img.gray || toGray(img.data, w, h);
    const quad = findQuad(gray, w, h);
    if (!quad) return { ok: false, reason: 'noMarkers' };
    const smp = sampler(gray, w, h), M = C.geom.MARKS.map(([x, y]) => ({ x, y }));
    /* orientación: probar las 4 rotaciones y quedarse con la que tenga oscuro el marcador pequeño */
    let best = null;
    for (let rot = 0; rot < 4; rot++) {
      const src = [0, 1, 2, 3].map(i => quad.pts[(i + rot) % 4]), H = solveH(M, src); if (!H) continue;
      const dk = (x, y) => {   // oscuridad del centro (r 1.2 mm) frente al papel de su entorno (anillo a 3.2 mm)
        const ring = []; for (let a = 0; a < 12; a++) { const [u, v] = mapH(H, x + Math.cos(a * Math.PI / 6) * 3.2, y + Math.sin(a * Math.PI / 6) * 3.2); ring.push(smp(u, v)); }
        ring.sort((p, q) => p - q); const paper = Math.max(40, ring[8]); let sum = 0, n = 0;
        for (let yy = -1.2; yy <= 1.21; yy += 0.3) for (let xx = -1.2; xx <= 1.21; xx += 0.3) { if (xx * xx + yy * yy > 1.44) continue; const [u, v] = mapH(H, x + xx, y + yy); sum += smp(u, v); n++; }
        return Math.max(0, 1 - (sum / n) / paper);
      };
      const o = dk(g.orient.cx, g.orient.cy);
      const others = [[g.W - g.orient.cx, g.orient.cy], [g.W - g.orient.cx, g.H - g.orient.cy], [g.orient.cx, g.H - g.orient.cy]].map(([x, y]) => dk(x, y));
      const sc = o - Math.max(...others);
      if (!best || sc > best.sc) best = { sc, H, rot, src };
    }
    if (!best || best.sc < 0.35) return { ok: false, reason: 'noOrient', quad: quad.pts };
    const H = best.H, [u0, v0] = mapH(H, 105, 148.5), [u1] = mapH(H, 106, 148.5), [, v1] = mapH(H, 105, 149.5);
    const pxmm = Math.sqrt(Math.abs((u1 - u0) * (v1 - v0))) || Math.hypot(u1 - u0, v1 - v0);
    const step = Math.max(0.17, 0.8 / Math.max(pxmm, 1));

    /* medir todas las burbujas */
    const qs = g.q.map(q => q.opts.map(o => measure(smp, H, o.x, o.y, g.r, step)));
    const vs = g.ver.items.map(it => measure(smp, H, it.x, it.y, g.ver.r, step));
    const cs = g.code.cols.map(x => g.code.rowY.map(y => measure(smp, H, x, y, g.code.r, step)));
    const all = [].concat(...qs, vs, ...cs).map(m => m.s);

    /* nivel base y ruido de la hoja: mediana y MAD del 60 % más claro (la mayoría de burbujas están vacías) */
    const sorted = all.slice().sort((a, b) => a - b), base = sorted[Math.floor(sorted.length * 0.5)];
    const adj = (m) => Math.max(0, m.s - base);
    const vals = all.map(v => Math.max(0, v - base));
    const low = vals.slice().sort((a, b) => a - b).slice(0, Math.floor(vals.length * 0.6)), med = low.length ? low[Math.floor(low.length / 2)] : 0;
    const dev = low.map(v => Math.abs(v - med)).sort((a, b) => a - b), sigma = 1.4826 * (dev[Math.floor(dev.length / 2)] || 0);
    /* marca firme típica → umbral de «marca» proporcional; umbral de «duda» por encima del ruido */
    const strong = vals.filter(v => v > 0.3).sort((a, b) => a - b), mk = strong.length ? strong[Math.floor(strong.length / 2)] : 0.6;
    const weak = Math.max(opts.weak || 0.05, med + 6 * sigma);
    const T = Math.max(weak * 1.6, Math.min(0.26, Math.max(0.12, 0.3 * mk)));

    const decide = (ms, letters) => {
      const sc = ms.map(adj), order = sc.map((v, i) => i).sort((i, j) => sc[j] - sc[i]), top = sc[order[0]];
      const marked = order.filter(i => sc[i] >= T), strongM = marked.filter(i => sc[i] >= 0.5 * top);
      let a = '', st = 'blank', cands = [];
      if (strongM.length > 1) { st = 'multi'; cands = strongM.map(i => letters[i]); }
      else if (marked.length >= 1) {
        a = letters[order[0]];
        const ghost = order.filter(i => sc[i] >= Math.max(weak * 1.4, 0.11));   // marca firme + otra más débil (borrado, roce)
        if (ghost.length === 1) st = 'ok'; else { st = 'doubt'; cands = ghost.map(i => letters[i]); }
      } else if (top >= weak) {
        a = letters[order[0]]; st = 'doubt'; cands = order.filter(i => sc[i] >= weak).map(i => letters[i]);
        if (cands.length > 1 && sc[order[1]] >= 0.5 * top) st = 'multi';
      }
      return { a, st, cands, s: sc.map(v => +v.toFixed(3)) };
    };
    const LET = ['A', 'B', 'C', 'D', 'E'];
    const q = qs.map(ms => decide(ms, LET));
    let version = 'A', versionSt = 'ok';
    if (vs.length) { const d = decide(vs, 'ABCD'); version = d.st === 'ok' || d.st === 'doubt' ? d.a : ''; versionSt = d.st === 'ok' ? 'ok' : d.st === 'blank' ? 'blank' : d.st === 'multi' ? 'multi' : 'doubt'; }
    const cd = cs.map(ms => decide(ms, '0123456789'.split('')));
    const codeRaw = cd.map(d => (d.st === 'ok' || d.st === 'doubt') ? d.a : '?').join('');
    const codeSt = cd.some(d => d.st === 'multi') ? 'multi' : cd.some(d => d.st === 'blank') ? (cd.every(d => d.st === 'blank') ? 'blank' : 'incomplete') : cd.some(d => d.st === 'doubt') ? 'doubt' : 'ok';
    const code = /^\d+$/.test(codeRaw) ? codeRaw : null;
    /* confianza */
    const nq = opts.nq || g.nq, flagged = q.slice(0, nq).filter(x => x.st === 'multi' || x.st === 'doubt').length + (versionSt !== 'ok' ? 1 : 0) + (codeSt === 'ok' ? 0 : 1);
    const markedV = vals.filter(v => v >= T), unmarkedV = vals.filter(v => v < T).sort((a, b) => a - b);
    const hiU = unmarkedV[Math.floor(unmarkedV.length * 0.97)] || 0, loM = markedV.length ? markedV.slice().sort((a, b) => a - b)[Math.floor(markedV.length * 0.1)] : 0;
    const sep = markedV.length ? Math.max(0, Math.min(1, (loM - hiU) / 0.35)) : 0;
    const conf = Math.max(0, Math.min(1, 0.55 * sep + 0.45 * (1 - Math.min(1, flagged / (0.08 * nq + 2))))) * (markedV.length ? 1 : 0.3);
    return { ok: true, H, quad: best.src, pxmm, T, weak, base, q, version, versionSt, code, codeRaw, codeSt, cd, conf, level: conf >= 0.75 ? 'good' : conf >= 0.45 ? 'fair' : 'bad', flagged, nMarked: markedV.length, w, h };
  }

  /* hoja rectificada (RGBA) para la pantalla de revisión */
  function rectify(img, H, ppm = 4) {
    const W = Math.round(210 * ppm), Hh = Math.round(297 * ppm), out = new Uint8ClampedArray(W * Hh * 4), { data, width: w, height: h } = img;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const [u, v] = mapH(H, x / ppm, y / ppm), o = (y * W + x) * 4;
      if (u < 0 || v < 0 || u > w - 1 || v > h - 1) { out[o] = out[o + 1] = out[o + 2] = 255; out[o + 3] = 255; continue; }
      const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0, i = (y0 * w + x0) * 4, i2 = i + (x0 + 1 < w ? 4 : 0), i3 = i + (y0 + 1 < h ? w * 4 : 0), i4 = i3 + (i2 - i);
      for (let c = 0; c < 3; c++) out[o + c] = (data[i + c] * (1 - fx) + data[i2 + c] * fx) * (1 - fy) + (data[i3 + c] * (1 - fx) + data[i4 + c] * fx) * fy;
      out[o + 3] = 255;
    }
    return { data: out, width: W, height: Hh, ppm };
  }
  C.omr = { toGray, findQuad, scan, rectify, mapH, solveH };
})();
