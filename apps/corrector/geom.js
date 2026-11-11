/* ============================================================
   Corrector de tests · geometría de la hoja de respuestas (mm, A4 vertical)
   ÚNICA fuente de verdad: la usan el generador de la hoja (hoja.js) y el escáner (omr.js).
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {});
  const W = 210, H = 297;
  const MK = 10;                                   // lado de los marcadores de esquina
  const MARKS = [[12, 12], [198, 12], [198, 285], [12, 285]];   // centros TL, TR, BR, BL
  const ORIENT = { cx: 22.5, cy: 12, s: 4 };       // marcador pequeño junto a la esquina superior izquierda
  const FIRST_Y = 99, LAST_Y = 275;

  /* p = { nq, nopt, nver, codeLen }  → disposición completa */
  function layout(p) {
    const nq = Math.max(1, Math.min(100, p.nq | 0)), nopt = p.nopt === 5 ? 5 : 4;
    const nver = Math.max(1, Math.min(4, p.nver | 0 || 1)), L = Math.max(3, Math.min(10, p.codeLen | 0 || 4));
    /* cuadrícula del código: columnas alineadas a la derecha */
    const cpx = L > 8 ? 5.4 : 6.0, cr = 1.9, rowY0 = 37.5, rowDy = 4.9;
    const code = { L, r: cr, boxY: 27.5, boxS: 5, cols: [], rowY: Array.from({ length: 10 }, (_, i) => rowY0 + i * rowDy), pitch: cpx, x0: 198 - cpx * L, y0: 24 };
    for (let j = 0; j < L; j++) code.cols.push(198 - cpx * (L - j - 0.5));
    /* versión */
    const ver = { r: 2.1, y: 59, items: [], x0: 26 };
    if (nver > 1) for (let i = 0; i < nver; i++) ver.items.push({ l: 'ABCD'[i], x: 52 + i * 9, y: 59 });
    /* preguntas */
    const cols = Math.min(5, Math.max(nq > 10 ? 2 : 1, Math.ceil(nq / 20)));
    const rows = Math.ceil(nq / cols);
    const bw = 180 / cols;                          // ancho de cada bloque
    const px = Math.min(7, (bw - 10) / nopt), r = Math.min(2.1, px * 0.37);
    const dy = rows > 1 ? Math.min(9, (LAST_Y - FIRST_Y) / (rows - 1)) : 9;
    const q = [];
    for (let i = 0; i < nq; i++) {
      const c = Math.floor(i / rows), rr = i % rows;
      const bx = 15 + c * bw, y = FIRST_Y + rr * dy;
      q.push({ n: i, y, nx: bx + 7, sh: Math.floor(rr / 5) % 2 === 0, opts: Array.from({ length: nopt }, (_, o) => ({ l: 'ABCDE'[o], x: bx + 10 + px * (o + 0.5), y })) });
    }
    const blocks = Array.from({ length: cols }, (_, c) => ({ x: 15 + c * bw, w: bw, y: 94.5, rows: Math.min(rows, nq - c * rows), dy, r0: c * rows }));
    return { W, H, MK, markers: MARKS.map(([cx, cy]) => ({ cx, cy, s: MK })), orient: ORIENT, nq, nopt, nver, L, code, ver, q, r, px, dy, rows, cols, blocks };
  }
  C.geom = { layout, W, H, MK, MARKS, ORIENT };
})();
