/* ============================================================
   Corrector de tests · el lector aprende de lo que validas
   Cada vez que guardas una hoja revisada se anotan, SOLO como números (nunca imágenes ni nombres), los casos dudosos o con riesgo y lo que
   decidiste: «me quedo con la marca más fuerte» o «era otra cosa». Con suficientes casos se ajustan dos umbrales del escáner, siempre dentro
   de límites seguros y a la vista (con botón de restablecer):
     · manchas   — a partir de qué proporción (marca secundaria / marca firme) una segunda marca deja de ser un resto y va a revisión;
     · tenues    — a partir de qué proporción (marca / marca típica de la hoja) una marca suelta es una respuesta y no una mancha.
   En el campus este aprendizaje se guarda en el servidor (el mismo en todos tus dispositivos); en la web pública, en el navegador.
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {}), K = window.AppKit;
  const store = K.storage('corrector');
  const D = window.CORR_I18N, add = (lang, o) => Object.assign(D[lang], o);
  add('es', { olTitle: 'Aprendizaje del lector', olNone: 'Aún aprende: {n} casos validados (hacen falta {m} para ajustarse).', olOn: '{n} casos validados · manchas: {s} · marcas tenues: {f}', olReset: 'Restablecer', olResetQ: '¿Olvidar lo aprendido y volver a los valores de fábrica del lector?', olDone: 'Lector restablecido.' });
  add('ca', { olTitle: 'Aprenentatge del lector', olNone: 'Encara aprèn: {n} casos validats (en calen {m} per ajustar-se).', olOn: '{n} casos validats · taques: {s} · marques tènues: {f}', olReset: 'Restableix', olResetQ: 'Oblidar el que ha après i tornar als valors de fàbrica del lector?', olDone: 'Lector restablert.' });
  add('en', { olTitle: 'Reader learning', olNone: 'Still learning: {n} validated cases ({m} needed to adjust).', olOn: '{n} validated cases · smudges: {s} · faint marks: {f}', olReset: 'Reset', olResetQ: 'Forget what it learned and go back to the reader’s default values?', olDone: 'Reader reset.' });

  const KEY = 'omrlearn', MAXS = 500, MIN = 20;
  const DEF = { smudge: 0.45, faint: 0.5 }, LIM = { smudge: [0.35, 0.55], faint: [0.3, 0.65] };
  const clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));
  const load = () => { const d = store.get(KEY, null); return d && Array.isArray(d.samples) ? d : { v: 1, samples: [], th: {} }; };

  /* elige el umbral t que mejor separa «me quedo con la marca fuerte» (keep) de «era otra cosa».
     Coste: aceptar sin revisar algo que estaba mal pesa 3; revisar de más algo que estaba bien pesa 0,5. */
  function best(points, lim, def, step = 0.01) {
    const pos = points.filter(p => p.keep).length, neg = points.length - pos;
    if (points.length < MIN || pos < 3 || neg < 3) return def;            // sin datos de ambos tipos no se mueve nada
    let bt = def, bs = -Infinity;
    for (let t = lim[0]; t <= lim[1] + 1e-9; t += step) {
      let sc = 0; points.forEach(p => { const accept = p.x < t; sc += accept ? (p.keep ? 1 : -3) : (p.keep ? -0.5 : 1); });
      if (sc > bs + 1e-9 || (Math.abs(sc - bs) < 1e-9 && Math.abs(t - def) < Math.abs(bt - def))) { bs = sc; bt = t; }
    }
    return +bt.toFixed(2);
  }
  /* smudge: se decide con r = 2.ª marca / marca firme (solo si la firme es firme: f ≥ faint). faint: con f = marca / marca típica (solo si no hay segunda marca relevante) */
  function calibrate(samples) {
    const sm = samples.filter(s => s.r >= 0.2 && s.r <= 0.9 && s.f >= 0.5).map(s => ({ x: s.r, keep: s.keep }));
    const fa = samples.filter(s => s.r < 0.45 && s.f > 0.15 && s.f < 1.1).map(s => ({ x: -s.f, keep: s.keep }));   // x negativo: «aceptar si f ≥ t» ≡ «−f < −t»
    const smudge = best(sm, LIM.smudge, DEF.smudge);
    const fb = best(fa.map(p => ({ x: p.x, keep: p.keep })), [-LIM.faint[1], -LIM.faint[0]], -DEF.faint);
    return { smudge: clamp(smudge, LIM.smudge), faint: clamp(-fb, LIM.faint), nSmudge: sm.length, nFaint: fa.length };
  }

  /* anota una hoja guardada: por cada pregunta con marca firme y algo que decidir (duda, o aceptada sola con riesgo) */
  function record(rec) {
    try {
      const res = rec.res; if (!res || !res.q || !res.mk) return;
      const d = load(); let added = 0;
      res.q.slice(0, rec.answers.length).forEach((q, i) => {
        if (!q || !q.s || q.s.length < 2 || !q.a) return;
        const sorted = q.s.slice().sort((a, b) => b - a), top = sorted[0], sec = sorted[1];
        if (!(top > 0)) return;
        const r = Math.max(0, sec) / top, f = top / res.mk;
        const border = q.st === 'doubt' || (q.st === 'ok' && (r >= 0.2 || f < 0.75));       // casos de frontera (los claros no enseñan nada)
        if (!border || q.st === 'multi') return;
        const keep = rec.answers[i] === q.a;                                                    // ¿acabó siendo la marca que el lector veía como más fuerte?
        d.samples.push({ r: +r.toFixed(3), f: +f.toFixed(3), keep }); added++;
      });
      if (!added) return;
      if (d.samples.length > MAXS) d.samples = d.samples.slice(-MAXS);
      const c = calibrate(d.samples); d.th = { smudge: c.smudge, faint: c.faint, nSmudge: c.nSmudge, nFaint: c.nFaint, at: Date.now() };
      store.set(KEY, d);
    } catch (_) { /* el aprendizaje nunca debe romper el guardado */ }
  }
  const opts = () => { const d = load(), t = d.th || {}; return (d.samples.length >= MIN && t.smudge) ? { smudge: t.smudge, faint: t.faint } : {}; };
  const status = () => { const d = load(), t = d.th || {}, T = (k, p) => K.t(k, p); return d.samples.length >= MIN && t.smudge ? T('olOn', { n: d.samples.length, s: K.fmt ? K.fmt(t.smudge, 2) : t.smudge, f: K.fmt ? K.fmt(t.faint, 2) : t.faint }) : T('olNone', { n: d.samples.length, m: MIN }); };
  const reset = () => { store.remove(KEY); };

  C.omrLearn = { record, opts, status, reset, calibrate, DEF, LIM, MIN };
})();
