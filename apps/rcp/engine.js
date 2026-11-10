/* ============================================================
   Motor de ritmo de la RCP (sin DOM, sin audio): genera, en orden
   cronológico, los eventos de un ciclo de compresiones/ventilaciones.
   Se puede probar con Node:  node apps/rcp/engine.js
   Eventos:
     { type:'init',  i, of, t }                insuflación inicial (niños/lactantes)
     { type:'comp',  n, of, cycle, total, accent, t }   compresión n de «of»
     { type:'vent',  cycle, dur, t }           empieza la pausa para ventilar
     { type:'breath', i, of:2, cycle, t }      insuflación i dentro de la pausa
   ============================================================ */
(function (root) {
  'use strict';

  function createEngine(cfg) {
    const c = Object.assign({ bpm: 110, comps: 30, pause: 5, handsOnly: false, initBreaths: 0, initGap: 2, startAt: 0, state: null }, cfg);
    let bpm = c.bpm;
    let t = c.startAt;
    let n = 0, cycle = 1, total = 0;
    let phase = c.initBreaths > 0 ? 'init' : 'comp';
    let initI = 0;
    let queue = [];                       // eventos ya calculados pero no entregados (breaths)

    if (c.state) {                        // reanudar a mitad de un ciclo
      n = c.state.n || 0; cycle = c.state.cycle || 1; total = c.state.total || 0;
      phase = (!c.handsOnly && n >= c.comps) ? 'vent' : 'comp';
      if (!c.handsOnly && n >= c.comps) { /* se hará la pausa de ventilación primero */ }
    }

    const interval = () => 60 / bpm;

    function next() {
      if (queue.length) return queue.shift();

      if (phase === 'init') {
        initI++;
        const ev = { type: 'init', i: initI, of: c.initBreaths, t };
        t += c.initGap;
        if (initI >= c.initBreaths) { phase = 'comp'; t += 1; }      // un segundo de aire antes de comprimir
        return ev;
      }

      if (phase === 'comp') {
        n++; total++;
        const of = c.comps;
        const ev = { type: 'comp', n, of, cycle, total, accent: n === 1 || n % 10 === 0, t };
        t += interval();
        if (n >= of) {
          if (c.handsOnly) { n = 0; cycle++; }                        // solo compresiones: grupos de «of», sin pausa
          else phase = 'vent';
        }
        return ev;
      }

      /* phase === 'vent' */
      const ev = { type: 'vent', cycle, dur: c.pause, t };
      const b1 = t + c.pause * 0.15, b2 = t + c.pause * 0.55;
      queue.push({ type: 'breath', i: 1, of: 2, cycle, t: b1 }, { type: 'breath', i: 2, of: 2, cycle, t: b2 });
      t += c.pause;
      n = 0; cycle++; phase = 'comp';
      return ev;
    }

    return {
      next,
      setBpm(b) { bpm = b; },
      get bpm() { return bpm; },
      get time() { return t; },       // instante del próximo evento «nuevo» (aprox.)
      peekTime() { return queue.length ? queue[0].t : t; }
    };
  }

  const api = { createEngine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RCPEngine = api;

  /* ---------- autotest (solo con Node) ---------- */
  if (typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module) {
    const assert = require('assert');
    const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
    const take = (eng, k) => Array.from({ length: k }, () => eng.next());

    // 1) adulto 30:2 a 120/min: 30 compresiones cada 0,5 s, pausa de 5 s, siguiente ciclo
    let e = createEngine({ bpm: 120, comps: 30, pause: 5, startAt: 10 });
    let ev = take(e, 30);
    assert.strictEqual(ev[0].type, 'comp'); near(ev[0].t, 10); near(ev[29].t, 10 + 29 * 0.5);
    assert.strictEqual(ev[29].n, 30); assert.strictEqual(ev[0].accent, true); assert.strictEqual(ev[1].accent, false); assert.strictEqual(ev[9].accent, true);
    const vent = e.next(); assert.strictEqual(vent.type, 'vent'); near(vent.t, 10 + 30 * 0.5); assert.strictEqual(vent.cycle, 1);
    const b = take(e, 2); assert.deepStrictEqual(b.map(x => x.type), ['breath', 'breath']); near(b[0].t, vent.t + 0.75); near(b[1].t, vent.t + 2.75);
    const c2 = e.next(); assert.strictEqual(c2.type, 'comp'); assert.strictEqual(c2.n, 1); assert.strictEqual(c2.cycle, 2); near(c2.t, vent.t + 5);
    assert.strictEqual(c2.total, 31);

    // 2) niño 15:2 con 5 insuflaciones iniciales
    e = createEngine({ bpm: 100, comps: 15, pause: 5, initBreaths: 5, startAt: 0 });
    ev = take(e, 5); assert.ok(ev.every(x => x.type === 'init')); near(ev[4].t, 8);
    const first = e.next(); assert.strictEqual(first.type, 'comp'); near(first.t, 8 + 2 + 1);
    take(e, 14); assert.strictEqual(e.next().type, 'vent');

    // 3) solo compresiones: sin pausas, grupos de 30 que se reinician
    e = createEngine({ bpm: 100, comps: 30, handsOnly: true, startAt: 0 });
    ev = take(e, 65); assert.ok(ev.every(x => x.type === 'comp')); assert.strictEqual(ev[30].n, 1); assert.strictEqual(ev[30].cycle, 2); assert.strictEqual(ev[64].total, 65);

    // 4) cambio de ritmo en marcha y reanudación
    e = createEngine({ bpm: 100, comps: 30, startAt: 0 }); take(e, 3); e.setBpm(120); const prev = e.next(); const nxt = e.next(); near(nxt.t - prev.t, 0.5);
    e = createEngine({ bpm: 110, comps: 30, startAt: 5, state: { n: 12, cycle: 3, total: 100 } }); const r = e.next(); assert.strictEqual(r.n, 13); assert.strictEqual(r.cycle, 3); assert.strictEqual(r.total, 101);
    e = createEngine({ bpm: 110, comps: 30, startAt: 5, state: { n: 30, cycle: 3, total: 100 } }); assert.strictEqual(e.next().type, 'vent');

    console.log('engine.js: todas las pruebas correctas');
  }
})(typeof window !== 'undefined' ? window : globalThis);
