/* SHA-256 síncrono (para comprobar respuestas sin guardarlas en claro). */
(function () {
  'use strict';
  const K = [], H0 = [];
  (function () {
    let n = 2, c = 0;
    while (c < 64) {
      let p = true;
      for (let i = 2; i * i <= n; i++) if (n % i === 0) { p = false; break; }
      if (p) {
        if (c < 8) H0.push(Math.floor((Math.sqrt(n) % 1) * 4294967296) >>> 0);
        K.push(Math.floor((Math.cbrt(n) % 1) * 4294967296) >>> 0);
        c++;
      }
      n++;
    }
  })();
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  function utf8(s) {
    if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(s));
    const e = unescape(encodeURIComponent(s)), o = [];
    for (let i = 0; i < e.length; i++) o.push(e.charCodeAt(i));
    return o;
  }
  function sha256(str) {
    const b = utf8(str), l = b.length * 8;
    b.push(0x80);
    while (b.length % 64 !== 56) b.push(0);
    const hi = Math.floor(l / 4294967296), lo = l >>> 0;
    [hi, lo].forEach(w => { b.push((w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255); });
    const H = H0.slice(), w = new Array(64);
    for (let o = 0; o < b.length; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, bb, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const mj = (a & bb) ^ (a & c) ^ (bb & c);
        const t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  if (typeof window !== 'undefined') window.sha256 = sha256;
  if (typeof module !== 'undefined' && module.exports) module.exports = sha256;
})();
