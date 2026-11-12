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
  /* aproximación afín local de la homografía en (x, y) mm: [u, v, ∂u/∂x, ∂v/∂x, ∂u/∂y, ∂v/∂y] */
  function local(H, x, y) { const [u, v] = mapH(H, x, y), [ux, vx] = mapH(H, x + 0.5, y), [uy, vy] = mapH(H, x, y + 0.5); return [u, v, (ux - u) * 2, (vx - v) * 2, (uy - u) * 2, (vy - v) * 2]; }

  /* ---------- registro fino con los propios círculos impresos ----------
     La homografía de 4 esquinas no absorbe una hoja combada, la distorsión de la lente ni el error de los marcadores.
     Para unas burbujas de muestra (3 por fila) se calcula un mapa de respuesta: cuánto coincide el aro impreso al
     desplazar el centro (±1,9 mm). El desplazamiento de cada burbuja es el pico de la suma de los mapas de las
     muestras cercanas (campo de deformación suave), con interpolación subpaso. */
  const SS = 0.32, NS = 13, HS = 6, CS = [], SN = [];
  for (let a = 0; a < 8; a++) { CS.push(Math.cos(a * Math.PI / 4 + 0.3)); SN.push(Math.sin(a * Math.PI / 4 + 0.3)); }
  function ringMap(smp, H, p, dl) {
    const map = new Float32Array(NS * NS), L = local(H, p.x, p.y), r = p.r, at = (x, y) => smp(L[0] + x * L[2] + y * L[4], L[1] + x * L[3] + y * L[5]);
    const pap = Math.max(40, at(0, -r * 1.5), at(0, r * 1.5), at(-r * 1.5, 0), at(r * 1.5, 0)) * 8;
    for (let j = 0, k = 0; j < NS; j++) for (let i = 0; i < NS; i++, k++) {
      const ox = (i - HS) * SS, oy = (j - HS) * SS; let acc = 0;
      for (let a = 0; a < 8; a++) {
        const c = CS[a], s = SN[a], ring = at(ox + c * r, oy + s * r), mn = Math.min(at(ox + c * (r - dl), oy + s * (r - dl)), at(ox + c * (r + dl), oy + s * (r + dl)));
        if (mn > ring) acc += mn - ring;   // solo cuenta una línea fina oscura entre dos zonas claras (no el borde de un relleno)
      }
      map[k] = acc / pap;
    }
    return map;
  }
  function register(smp, H, groups, dl) {
    const units = [], pts = [], S2 = 100;
    for (const G of groups) { const n = G.length, pick = n <= 3 ? G : [G[0], G[n >> 1], G[n - 1]]; for (const p of G) pts.push(p); for (const p of pick) { p.map = ringMap(smp, H, p, dl); units.push(p); } }
    const sm = new Float32Array(NS * NS), sub = (m, c, p) => { const den = m - 2 * c + p; return den < 0 ? Math.max(-0.5, Math.min(0.5, 0.5 * (m - p) / den)) : 0; };
    for (const p of pts) {
      sm.fill(0); let ws = 0;
      for (const q of units) { const d2 = (p.x - q.x) ** 2 + (p.y - q.y) ** 2; if (d2 > 4.5 * S2) continue; const w = Math.exp(-d2 / (2 * S2)), m = q.map; ws += w; for (let k = 0; k < sm.length; k++) sm[k] += w * m[k]; }
      let b = 0; for (let k = 1; k < sm.length; k++) if (sm[k] > sm[b]) b = k;
      const i = b % NS, j = (b - i) / NS;
      p.dx = (i - HS + (i > 0 && i < NS - 1 ? sub(sm[b - 1], sm[b], sm[b + 1]) : 0)) * SS; p.dy = (j - HS + (j > 0 && j < NS - 1 ? sub(sm[b - NS], sm[b], sm[b + NS]) : 0)) * SS; p.pk = ws ? sm[b] / ws : 0;
    }
    /* sin aro visible alrededor (reflejo, zona toda rellena): hereda el desplazamiento de los vecinos fiables */
    const hs = pts.map(p => p.pk).sort((x, y) => x - y), lim = 0.4 * (hs[hs.length >> 1] || 0), good = pts.filter(p => p.pk >= lim);
    for (const p of pts) if (p.pk < lim) {
      let ws = 0, dx = 0, dy = 0;
      for (const q of good) { const w = Math.exp(-((p.x - q.x) ** 2 + (p.y - q.y) ** 2) / 3200); ws += w; dx += w * q.dx; dy += w * q.dy; }
      p.fx = ws > 1e-12 ? dx / ws : 0; p.fy = ws > 1e-12 ? dy / ws : 0;
    }
    for (const p of pts) { if (p.pk < lim) { p.dx = p.fx; p.dy = p.fy; } p.map = null; }
  }

  /* medida de una burbuja (mm) frente al papel de su entorno:
     d = oscuridad media, fr = fracción de puntos muy oscuros, dq = oscuridad del cuartil más oscuro (trazos finos),
     vis = contraste del aro impreso (0 si lo tapa un reflejo o el desenfoque) */
  function measure(smp, H, cx, cy, r, step, dl) {
    const L = local(H, cx, cy), at = (x, y) => smp(L[0] + x * L[2] + y * L[4], L[1] + x * L[3] + y * L[5]);
    /* papel: pares opuestos del anillo (su media anula el gradiente de una sombra), percentil 75;
       su diferencia da el gradiente local de luz (gx, gy por mm), que se descuenta dentro del disco */
    const pap = [], pr = [];
    for (let a = 0; a < 8; a++) {
      const c = Math.cos(a * Math.PI / 8), s = Math.sin(a * Math.PI / 8);
      for (const k of [1.4, 1.6]) { const p1 = at(c * r * k, s * r * k), p2 = at(-c * r * k, -s * r * k); pap.push((p1 + p2) / 2); pr.push([c, s, (p1 + p2) / 2, (p1 - p2) / (2 * r * k)]); }
    }
    pap.sort((a, b) => a - b); const paper = Math.max(40, pap[12]);
    let scc = 0, sss = 0, scs = 0, bc = 0, bs = 0, gx = 0, gy = 0;
    for (const [c, s, m, dv] of pr) if (m > 0.88 * paper) { scc += c * c; sss += s * s; scs += c * s; bc += c * dv; bs += s * dv; }
    const det = scc * sss - scs * scs; if (det > 1) { gx = (bc * sss - bs * scs) / det; gy = (bs * scc - bc * scs) / det; }
    const rin = r * RIN, v = []; let sum = 0, dark = 0;
    for (let y = -rin; y <= rin + 1e-6; y += step) for (let x = -rin; x <= rin + 1e-6; x += step) {
      if (x * x + y * y > rin * rin) continue;
      const gv = at(x, y) - gx * x - gy * y; v.push(gv); sum += gv; if (gv < paper * 0.6) dark++;
    }
    const n = v.length || 1; v.sort((a, b) => a - b);
    const nq = Math.max(1, Math.round(n * 0.25)); let sq = 0; for (let i = 0; i < nq; i++) sq += v[i];
    let vis = 0;
    for (let a = 0; a < 12; a++) { const c = Math.cos(a * Math.PI / 6), s = Math.sin(a * Math.PI / 6), ring = at(c * r, s * r), mn = Math.min(at(c * (r - dl), s * (r - dl)), at(c * (r + dl), s * (r + dl))); if (mn > ring) vis += mn - ring; }
    const d = Math.max(-0.3, 1 - sum / n / paper), fr = dark / n, dq = Math.max(-0.3, 1 - sq / nq / paper);
    return { s: WD * d + WF * fr + WQ * dq, d, fr, dq, paper, vis: vis / 12 / paper };
  }
  let RIN = 0.62, WD = 0.5, WF = 0, WQ = 0.5;

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

    /* registro fino por grupos (fila de opciones / fila de dígitos / versión) y medida de todas las burbujas */
    if (opts.tune) ({ RIN = RIN, WD = WD, WF = WF, WQ = WQ, LO = LO, HI = HI, KS = KS, MKF = MKF } = opts.tune);
    const dl = Math.max(0.45, 1.1 / Math.max(pxmm, 1)), grp = (pts) => pts.map(p => ({ x: p.x, y: p.y, r: p.r, dx: 0, dy: 0 }));
    const gq = g.q.map(q => grp(q.opts.map(o => ({ x: o.x, y: o.y, r: g.r }))));
    const gv = g.ver.items.length ? [grp(g.ver.items.map(it => ({ x: it.x, y: it.y, r: g.ver.r })))] : [];
    const gc = g.code.rowY.map(y => grp(g.code.cols.map(x => ({ x, y, r: g.code.r }))));
    const groups = gq.concat(gv, gc); if (!opts.noRegister) register(smp, H, groups, dl);
    const ms = (G) => G.map(p => measure(smp, H, p.x + p.dx, p.y + p.dy, p.r, step, dl));
    const qs = gq.map(ms), vs = gv.length ? ms(gv[0]) : [], cr = gc.map(ms), cs = g.code.cols.map((_, j) => cr.map(row => row[j]));
    const sets = qs.concat(vs.length ? [vs] : [], cs), all = [].concat(...sets);

    /* nivel base por fila (2.º valor más bajo: casi todas las burbujas de una fila están vacías) acotado por el de la hoja */
    const srt = (a) => a.slice().sort((x, y) => x - y), medOf = (a) => (a.length ? srt(a)[a.length >> 1] : 0);
    const base = medOf(all.map(m => m.s)), visS = srt(all.map(m => m.vis)), visMed = visS[visS.length >> 1], visRef = visS[Math.floor(visS.length * 0.9)];
    const rel = (ms) => { const s = srt(ms.map(m => m.s)), b = ms.length >= 4 ? Math.min(s[1], base + 0.03) : base; return ms.map(m => m.s - b); };
    const rels = sets.map(rel);
    /* sesgo sistemático por columna de opción (p. ej. la banda gris que acaba a media burbuja): se resta, acotado */
    const bias = {}, bkey = (i, j) => Math.floor(i / g.rows) + '|' + j + '|' + (g.q[i].sh ? 1 : 0);
    qs.forEach((_, i) => rels[i].forEach((v, j) => { const k = bkey(i, j); (bias[k] = bias[k] || []).push(v); }));
    for (const k in bias) { const a = srt(bias[k]); bias[k] = a.length >= 4 ? Math.max(-0.05, Math.min(0.05, a[Math.floor(a.length * 0.25)])) : 0; }
    qs.forEach((_, i) => { rels[i] = rels[i].map((v, j) => v - bias[bkey(i, j)]); });
    const flat = srt([].concat(...rels)), low = flat.slice(0, Math.floor(flat.length * 0.6)), med = medOf(low);
    const sigma = 1.4826 * medOf(low.map(v => Math.abs(v - med)));
    /* umbrales: «hay tinta» (weak, sobre el ruido de la hoja) y «marca firme» (T) */
    const strong = flat.filter(v => v > 0.15), mk = strong.length ? strong[strong.length >> 1] : 0.6;
    const weak = Math.max(opts.weak || LO, med + KS * sigma), T = Math.max(HI, 2 * weak, MKF * mk), wb = 0.6 * weak;

    const decide = (ms, sc, letters, tolLow) => {
      const order = sc.map((v, i) => i).sort((i, j) => sc[j] - sc[i]), top = sc[order[0]], sec = sc.length > 1 ? sc[order[1]] : 0;
      const ink = order.filter(i => sc[i] >= weak).map(i => letters[i]);
      let a = '', st = 'blank', cands = [];
      if (top >= T) {
        a = letters[order[0]];
        if (sec >= Math.max(T, 0.5 * top)) { st = 'multi'; cands = order.filter(i => sc[i] >= Math.max(T, 0.5 * top)).map(i => letters[i]); }
        else if (sec >= SMUDGE * top) { st = 'doubt'; cands = ink; }   // marca firme + otra a medias (> 45 % de la firme): no se sabe cuál es la buena → revisión
        else st = top < 0.5 * mk ? 'doubt' : 'ok';                   // marca firme + restos pequeños (mancha, roce, goma, tipex a medias): se queda la bien pintada; si la «firme» es mucho más clara que las demás de la hoja (mancha suelta), a revisión
        if (st === 'doubt' && sec < SMUDGE * top) cands = [letters[order[0]]];
      } else if (top >= wb) {   // sin marca firme: cualquier rastro de tinta (umbral más bajo) va a revisión, nunca «en blanco» en silencio
        a = letters[order[0]]; st = 'doubt'; cands = order.filter(i => sc[i] >= wb).map(i => letters[i]);
        if (sec >= weak && sec >= 0.5 * top) st = 'multi';
      }
      /* zona ilegible (reflejo, desenfoque local): si falta el aro de alguna burbuja clara, no se da por buena */
      const low = ms.some((m, i) => sc[i] < T && m.vis < 0.35 * visRef);
      if (low && (st === 'blank' || (st === 'ok' && !tolLow))) { st = 'doubt'; cands = ink; }   // con marca firme, un aro tapado suelto (tipex) no invalida la pregunta si es un caso aislado en la hoja
      const c = st === 'ok' ? Math.min(1, (top - T) / T, (1 - Math.max(0, sec) / top) * 1.5) : st === 'blank' ? Math.min(1, (weak - Math.max(0, top)) / weak * 2) : 0;
      return { a, st, cands, low, c: +Math.max(0, c).toFixed(2), s: sc.map(v => +v.toFixed(3)) };
    };
    const LET = ['A', 'B', 'C', 'D', 'E'];
    /* zonas ilegibles: si son pocas y sueltas (tipex sobre una burbuja) no pesan; si son muchas (reflejo, desenfoque) sí */
    const nLow0 = qs.filter((ms, i) => decide(ms, rels[i], LET).low).length, tolLow = nLow0 <= Math.max(4, Math.round(0.12 * g.nq));
    const q = qs.map((ms, i) => decide(ms, rels[i], LET, tolLow));
    let version = 'A', versionSt = 'ok';
    if (vs.length) { const d = decide(vs, rels[qs.length], 'ABCD'); version = d.st === 'ok' || d.st === 'doubt' ? d.a : ''; versionSt = d.st === 'ok' ? 'ok' : d.st === 'blank' ? 'blank' : d.st === 'multi' ? 'multi' : 'doubt'; }
    const cd = cs.map((ms, j) => decide(ms, rels[qs.length + (vs.length ? 1 : 0) + j], '0123456789'.split('')));
    const codeRaw = cd.map(d => (d.st === 'ok' || d.st === 'doubt') ? d.a : '?').join('');
    const codeSt = cd.some(d => d.st === 'multi') ? 'multi' : cd.some(d => d.st === 'blank') ? (cd.every(d => d.st === 'blank') ? 'blank' : 'incomplete') : cd.some(d => d.st === 'doubt') ? 'doubt' : 'ok';
    const code = /^\d+$/.test(codeRaw) ? codeRaw : null;
    /* confianza de la hoja: nitidez (aro impreso visible), ruido de las burbujas vacías y proporción de avisos */
    const nq = opts.nq || g.nq, qq = q.slice(0, nq), flagged = qq.filter(x => x.st === 'multi' || x.st === 'doubt').length + (versionSt !== 'ok' ? 1 : 0) + (codeSt === 'ok' ? 0 : 1);
    const nMarked = flat.filter(v => v >= T).length, nLow = qq.filter(x => x.low).length;
    const sharp = Math.max(0, Math.min(1, visMed / VIS)), quiet = Math.max(0, Math.min(1, 1.5 - weak / (2 * LO)));
    const conf = Math.max(0, Math.min(1, (0.4 * sharp + 0.3 * quiet + 0.3 * (1 - Math.min(1, flagged / (0.15 * nq + 2)))) * (nLow > 0.1 * nq ? 0.5 : 1))) * (nMarked ? 1 : 0.3);
    const out = { ok: true, H, quad: best.src, pxmm, T, weak, base, sigma, sharp: visMed, q, version, versionSt, code, codeRaw, codeSt, cd, conf, level: conf >= 0.75 ? 'good' : conf >= 0.45 ? 'fair' : 'bad', flagged, nMarked, nLow, w, h };
    if (opts.debug) out.raw = { qs, off: gq.map(G => G.map(p => [p.dx, p.dy])) };
    return out;
  }
  let LO = 0.035, HI = 0.08, KS = 6, MKF = 0.2, VIS = 0.1, SMUDGE = 0.45;

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
