/* ============================================================
   Corrector de tests · codificador de códigos QR propio (modo byte, correcciones L/M, versiones 1–40)
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {});
  const ECC = [[-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]];
  const BLK = [[-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]];
  const FMT = [1, 0];       // bits de formato: L=1, M=0
  const rawModules = (v) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const a = Math.floor(v / 7) + 2; r -= (25 * a - 10) * a - 55; if (v >= 7) r -= 36; } return r; };
  const dataCw = (v, e) => Math.floor(rawModules(v) / 8) - ECC[e][v] * BLK[e][v];
  const gfMul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; };
  const rsDiv = (d) => { const r = new Array(d).fill(0); r[d - 1] = 1; let root = 1; for (let i = 0; i < d; i++) { for (let j = 0; j < d; j++) { r[j] = gfMul(r[j], root); if (j + 1 < d) r[j] ^= r[j + 1]; } root = gfMul(root, 2); } return r; };
  const rsRem = (data, div) => { const r = new Array(div.length).fill(0); data.forEach(b => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); }); return r; };
  const bit = (x, i) => ((x >>> i) & 1) !== 0;

  function make(text, eccName) {
    const bytes = [...new TextEncoder().encode(text)], e = eccName === 'L' ? 0 : 1;
    let ver = 1;
    for (; ver <= 40; ver++) { const cap = dataCw(ver, e) * 8, need = 4 + (ver <= 9 ? 8 : 16) + bytes.length * 8; if (need <= cap) break; }
    if (ver > 40) return null;
    const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4); put(bytes.length, ver <= 9 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const cap = dataCw(ver, e) * 8; put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    for (let p = 0xEC; data.length < cap / 8; p ^= 0xEC ^ 0x11) data.push(p);
    /* bloques + corrección de errores */
    const nb = BLK[e][ver], el = ECC[e][ver], raw = Math.floor(rawModules(ver) / 8), ns = nb - raw % nb, sl = Math.floor(raw / nb), div = rsDiv(el), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) { const dat = data.slice(k, k + sl - el + (i < ns ? 0 : 1)); k += dat.length; const ec = rsRem(dat, div); if (i < ns) dat.push(0); blocks.push(dat.concat(ec)); }
    const all = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== sl - el || j >= ns) all.push(b[i]); });
    /* matriz */
    const size = ver * 4 + 17, m = Array.from({ length: size }, () => new Array(size).fill(false)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const setF = (x, y, v) => { m[y][x] = v; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const pos = []; if (ver > 1) { const na = Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2; pos.push(6); for (let p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p); }
    pos.forEach((x, i) => pos.forEach((y, j) => { if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
    const fmtBits = (mask) => { const d = (FMT[e] << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); return ((d << 10) | r) ^ 0x5412; };
    const drawFmt = (mask) => {
      const b = fmtBits(mask);
      for (let i = 0; i <= 5; i++) setF(8, i, bit(b, i)); setF(8, 7, bit(b, 6)); setF(8, 8, bit(b, 7)); setF(7, 8, bit(b, 8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(b, i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(b, i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(b, i));
      setF(8, size - 8, true);
    };
    drawFmt(0);
    if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = (ver << 12) | r; for (let i = 0; i < 18; i++) { const c = bit(b, i), a = size - 11 + i % 3, bb = Math.floor(i / 3); setF(a, bb, c); setF(bb, a, c); } }
    let k = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && k < all.length * 8) { m[y][x] = bit(all[k >>> 3], 7 - (k & 7)); k++; }
      }
    }
    const maskFn = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
      (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const apply = (mk) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn[mk](x, y)) m[y][x] = !m[y][x]; };
    const penalty = () => {
      let p = 0;
      for (let a = 0; a < size; a++) for (const rowMode of [true, false]) { let run = 1; for (let b = 1; b < size; b++) { const cur = rowMode ? m[a][b] : m[b][a], pr = rowMode ? m[a][b - 1] : m[b - 1][a]; if (cur === pr) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
      let dark = 0; m.forEach(r => r.forEach(v => { if (v) dark++; })); p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return p;
    };
    let best = 0, bp = Infinity;
    for (let mk = 0; mk < 8; mk++) { apply(mk); drawFmt(mk); const p = penalty(); if (p < bp) { bp = p; best = mk; } apply(mk); }
    apply(best); drawFmt(best);
    return { size, version: ver, get: (x, y) => m[y][x] };
  }
  /* SVG (cadena) con zona de silencio de 4 módulos */
  function toSVG(qr, px = 4) {
    const q = 4, n = qr.size + 2 * q; let d = '';
    for (let y = 0; y < qr.size; y++) { let x = 0; while (x < qr.size) { if (qr.get(x, y)) { let l = 1; while (x + l < qr.size && qr.get(x + l, y)) l++; d += `M${x + q} ${y + q}h${l}v1h-${l}z`; x += l; } else x++; } }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${n * px}" height="${n * px}" shape-rendering="crispEdges" role="img"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  C.qr = { make, toSVG };
})();
