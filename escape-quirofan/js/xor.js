/* Xifrat simple (XOR amb flux derivat de SHA-256) perquè les fitxes no es puguin llegir fins resoldre cada prova. */
(function () {
  'use strict';
  const sha = typeof window !== 'undefined' ? window.sha256 : require('./sha256.js');
  function ks(key, n) {
    const out = [];
    for (let i = 0; out.length < n; i++) {
      const h = sha(key + '|' + i);
      for (let j = 0; j < 64; j += 2) out.push(parseInt(h.substr(j, 2), 16));
    }
    return out;
  }
  function bytesOf(s) { return Array.from(new TextEncoder().encode(s)); }
  function b64(bytes) {
    let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); });
    return typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
  }
  function unb64(t) {
    const s = typeof atob !== 'undefined' ? atob(t) : Buffer.from(t, 'base64').toString('binary');
    const o = []; for (let i = 0; i < s.length; i++) o.push(s.charCodeAt(i)); return o;
  }
  function enc(text, key) { const b = bytesOf(text), k = ks(key, b.length); return b64(b.map((x, i) => x ^ k[i])); }
  function dec(b64s, key) {
    const b = unb64(b64s), k = ks(key, b.length);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(b.map((x, i) => x ^ k[i]))); } catch (e) { return null; }
  }
  const api = { enc: enc, dec: dec };
  if (typeof window !== 'undefined') window.QX_XOR = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
