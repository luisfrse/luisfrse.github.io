/* ============================================================
   Calculadora de goteo y dosis · pestaña 6: ejercicios autocorregidos
   Problemas aleatorios en 3 niveles, solución paso a paso, puntos,
   racha y repaso de fallos. Todo se calcula con calc.js.
   ============================================================ */
(() => {
  'use strict';
  const A = window.GoteoApp; if (!A) return;
  const { K, C, t, S, save, fm, big, stepsBox, msg, E, $, $$, tabs, UI } = A;

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const step = (text, expr) => ({ text, expr });
  const rnd = (n, d) => fm(C.round(n, d), d);

  /* ---------- problemas: gen() → parámetros, solve(p) → {ans, dec, unit, steps} ---------- */
  const EX = {
    rate: { lvl: 1,
      gen: () => ({ V: pick([100, 250, 500, 1000]), T: pick([2, 4, 5, 8, 10, 12, 24]) }),
      solve: (p) => { const ans = p.V / p.T; return { ans, dec: 1, unit: 'mL/h', steps: [step(t('st_mlh'), `${p.V} ÷ ${p.T} = ${fm(ans, 3)} mL/h`), step(t('st_round_n', { n: 1 }), `${fm(ans, 3)} → ${rnd(ans, 1)} mL/h`)] }; } },
    drops: { lvl: 1,
      gen: () => ({ V: pick([100, 250, 500, 1000]), T: pick([1, 2, 4, 6, 8, 12]), f: pick([20, 15, 60]) }),
      solve: (p) => { const ans = p.V * p.f / (p.T * 60); return { ans, dec: 0, unit: t('drops_min'), steps: [step(t('st_gpm'), `(${p.V} × ${p.f}) ÷ (${p.T} × 60) = ${fm(ans, 2)}`), step(t('st_round_int'), `${fm(ans, 2)} → ${Math.round(ans)} ${t('drops_min')}`)] }; } },
    vol: { lvl: 1,
      gen: () => { const c = pick([5, 10, 20, 25, 50, 100, 125, 250]); const k = pick([0.4, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]); return { D: c * k, c }; },
      solve: (p) => { const ans = p.D / p.c; return { ans, dec: 2, unit: 'mL', steps: [step(t('st_ml'), `${fm(p.D, 2)} ÷ ${p.c} = ${fm(ans, 3)} mL`)] }; } },
    unit: { lvl: 1,
      gen: () => pick([{ v: 0.5, a: 'g', b: 'mg', cat: 'mass' }, { v: 0.25, a: 'g', b: 'mg', cat: 'mass' }, { v: 250, a: 'mg', b: 'g', cat: 'mass' }, { v: 2500, a: 'mcg', b: 'mg', cat: 'mass' }, { v: 0.75, a: 'mg', b: 'mcg', cat: 'mass' }, { v: 1.5, a: 'L', b: 'mL', cat: 'volume' }, { v: 750, a: 'mL', b: 'L', cat: 'volume' }, { v: 90, a: 'min', b: 'h', cat: 'time' }, { v: 2.5, a: 'h', b: 'min', cat: 'time' }]),
      solve: (p) => { const f = C.convert(p.cat, 1, p.a, p.b).value; const ans = p.v * f; return { ans, dec: 3, unit: p.b, steps: [step(t('st_convert'), `1 ${p.a} = ${fm(f, 6)} ${p.b}`), step(t('st_ml_eq'), `${fm(p.v, 3)} × ${fm(f, 6)} = ${fm(ans, 4)} ${p.b}`)] }; } },
    perkg: { lvl: 2,
      gen: () => ({ kg: pick([8, 12, 15, 20, 25, 30, 45, 60, 70, 80]), d: pick([5, 10, 12.5, 15, 20, 25]) }),
      solve: (p) => { const ans = p.kg * p.d; return { ans, dec: 1, unit: 'mg', steps: [step(t('st_perdose'), `${fm(p.d, 2)} × ${p.kg} = ${fm(ans, 3)} mg`)] }; } },
    pctA: { lvl: 2,
      gen: () => ({ p: pick([0.5, 1, 2, 5, 10]) }),
      solve: (p) => { const ans = p.p * 10; return { ans, dec: 1, unit: 'mg/mL', steps: [step(t('st_pct'), `${fm(p.p, 2)} % × 10 = ${fm(ans, 2)} mg/mL`)] }; } },
    pctB: { lvl: 2,
      gen: () => { const p = pick([1, 2, 5]); const k = pick([0.5, 1, 2, 2.5, 4]); return { p, D: 10 * p * k }; },
      solve: (p) => { const c = p.p * 10; const ans = p.D / c; return { ans, dec: 2, unit: 'mL', steps: [step(t('st_pct'), `${p.p} % × 10 = ${c} mg/mL`), step(t('st_ml'), `${p.D} ÷ ${c} = ${fm(ans, 3)} mL`)] }; } },
    dropsmin: { lvl: 2,
      gen: () => ({ V: pick([50, 100, 150, 250]), M: pick([20, 30, 45, 60, 90]), f: pick([20, 15]) }),
      solve: (p) => { const ans = p.V * p.f / p.M; return { ans, dec: 0, unit: t('drops_min'), steps: [step(t('st_gpm_min'), `(${p.V} × ${p.f}) ÷ ${p.M} = ${fm(ans, 2)}`), step(t('st_round_int'), `${fm(ans, 2)} → ${Math.round(ans)} ${t('drops_min')}`)] }; } },
    tabs: { lvl: 2,
      gen: () => { const c = pick([50, 100, 250, 500]); const k = pick([0.5, 1, 1.5, 2, 2.5, 3, 4]); return { D: c * k, c }; },
      solve: (p) => { const ans = p.D / p.c; return { ans, dec: 1, unit: t('u_units'), steps: [step(t('st_units'), `${p.D} ÷ ${p.c} = ${fm(ans, 2)} ${t('u_units')}`)] }; } },
    amp: { lvl: 2,
      gen: () => { const X = pick([100, 250, 500, 1000]); const Y = pick([2, 5, 10]); const j = pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]); return { X, Y, D: X * j }; },
      solve: (p) => { const c = p.X / p.Y; const ans = p.D / c; return { ans, dec: 2, unit: 'mL', steps: [step(t('st_amp_conc'), `${p.X} ÷ ${p.Y} = ${fm(c, 3)} mg/mL`), step(t('st_ml'), `${fm(p.D, 2)} ÷ ${fm(c, 3)} = ${fm(ans, 3)} mL`)] }; } },
    pump: { lvl: 3,
      gen: () => ({ kg: pick([50, 60, 70, 80, 90]), r: pick([2, 3, 5, 8, 10]), A: pick([200, 400]), Vf: pick([250, 500]) }),
      solve: (p) => { const mgh = p.r * p.kg * 60 / 1000; const c = p.A / p.Vf; const ans = mgh / c; return { ans, dec: 1, unit: 'mL/h', steps: [step(t('st_rate_to_h', { u: 'mg' }), `${p.r} × ${p.kg} × 60 ÷ 1000 = ${fm(mgh, 3)} mg/h`), step(t('st_dil_conc'), `${p.A} ÷ ${p.Vf} = ${fm(c, 3)} mg/mL`), step(t('st_pump_ml'), `${fm(mgh, 3)} ÷ ${fm(c, 3)} = ${fm(ans, 3)} mL/h`), step(t('st_round_n', { n: 1 }), `${fm(ans, 3)} → ${rnd(ans, 1)} mL/h`)] }; } },
    dilution: { lvl: 3,
      gen: () => ({ c: pick([0.5, 1, 2]), V: pick([50, 100, 250]), X: pick([100, 250, 500]), Y: pick([2, 5, 10]) }),
      solve: (p) => { const need = p.c * p.V; const ac = p.X / p.Y; const ans = need / ac; return { ans, dec: 2, unit: 'mL', steps: [step(t('st_prep_need'), `${p.c} × ${p.V} = ${fm(need, 3)} mg`), step(t('st_amp_conc'), `${p.X} ÷ ${p.Y} = ${fm(ac, 3)} mg/mL`), step(t('st_prep_ml'), `${fm(need, 3)} ÷ ${fm(ac, 3)} = ${fm(ans, 3)} mL`), step(t('st_prep_dil'), `${p.V} − ${fm(ans, 2)} = ${fm(p.V - ans, 2)} mL`)] }; } },
    remaining: { lvl: 3,
      gen: () => ({ V: pick([100, 150, 200, 250, 500]), g: pick([20, 30, 40, 60, 80, 100]), f: pick([20, 15, 60]) }),
      solve: (p) => { const ans = p.V * p.f / p.g; return { ans, dec: 0, unit: 'min', steps: [step(t('st_inv_time'), `(${p.V} × ${p.f}) ÷ ${p.g} = ${fm(ans, 2)} min`), step(t('st_round_int'), `${fm(ans, 2)} → ${Math.round(ans)} min`)] }; } },
    daily: { lvl: 3,
      gen: () => ({ kg: pick([10, 15, 20, 25, 30, 40]), d: pick([20, 30, 40, 50, 60, 100]), n: pick([2, 3, 4]) }),
      solve: (p) => { const tot = p.kg * p.d; const ans = tot / p.n; return { ans, dec: 1, unit: 'mg', steps: [step(t('st_daily'), `${p.d} × ${p.kg} = ${fm(tot, 2)} mg`), step(t('st_split'), `${fm(tot, 2)} ÷ ${p.n} = ${fm(ans, 3)} mg`), step(t('st_round_n', { n: 1 }), `${fm(ans, 3)} → ${rnd(ans, 1)} mg`)] }; } }
  };
  const POINTS = { 1: 10, 2: 15, 3: 20 };

  /* ---------- estado del problema actual ---------- */
  let cur = null; // { type, p, tried, done, shown, review }
  const X = () => S.ex;
  const statementOf = (type, p) => {
    const q = {}; Object.keys(p).forEach(k => { q[k] = typeof p[k] === 'number' ? fm(p[k], 3) : p[k]; });
    if (type === 'unit') { q.a = p.a === 'ui' ? UI() : p.a; q.b = p.b; }
    const s = EX[type].solve(p);
    return `${t('ex_' + type, q)} ${t('ex_round_' + s.dec)}`;
  };
  function newProblem(review = false) {
    const ex = X();
    if (review && ex.fails.length) { const f = ex.fails[0]; cur = { type: f.type, p: f.p, tried: false, done: false, shown: false, review: true }; return; }
    const types = Object.keys(EX).filter(k => EX[k].lvl === ex.level);
    // evita repetir el mismo tipo seguido cuando hay alternativas
    let type = pick(types); if (cur && types.length > 1) { let n = 0; while (type === cur.type && n++ < 6) type = pick(types); }
    cur = { type, p: EX[type].gen(), tried: false, done: false, shown: false, review: false };
  }

  /* ---------- puntuación ---------- */
  function record(correct, firstTime) {
    const ex = X(); const lv = EX[cur.type].lvl;
    if (!firstTime) return 0;
    ex.tries++; ex.byLevel[lv].t++;
    let gained = 0;
    if (correct) {
      ex.ok++; ex.byLevel[lv].o++; ex.streak++; ex.best = Math.max(ex.best, ex.streak);
      gained = POINTS[lv] + Math.min(ex.streak - 1, 5) * 2; ex.score += gained;
      if (cur.review) ex.fails = ex.fails.filter(f => !(f.type === cur.type && JSON.stringify(f.p) === JSON.stringify(cur.p)));
    } else {
      ex.streak = 0;
      if (!ex.fails.some(f => f.type === cur.type && JSON.stringify(f.p) === JSON.stringify(cur.p))) ex.fails.push({ type: cur.type, p: cur.p });
      if (ex.fails.length > 30) ex.fails.shift();
    }
    save(); return gained;
  }

  /* ---------- interfaz ---------- */
  function paintStats() {
    const ex = X(); const box = $('#ex-stats'); if (!box) return;
    const acc = ex.tries ? Math.round(ex.ok / ex.tries * 100) : 0;
    box.innerHTML = `<h2>${E(t('ex_stats'))}</h2>
      <div class="grid cols-3"><div class="stat"><b>${ex.score}</b><span>${E(t('ex_points'))}</span></div><div class="stat"><b>${ex.streak}</b><span>${E(t('ex_streak'))}</span></div>
        <div class="stat"><b>${ex.best}</b><span>${E(t('ex_best'))}</span></div><div class="stat"><b>${ex.tries ? acc + ' %' : '—'}</b><span>${E(t('ex_acc'))}</span></div></div>
      <div class="stack">${[1, 2, 3].map(l => { const b = ex.byLevel[l]; const pc = b.t ? Math.round(b.o / b.t * 100) : 0; return `<div><div class="row spread"><small>${E(t('ex_l' + l))}</small><small>${b.o}/${b.t}</small></div><div class="progress" role="progressbar" aria-valuenow="${pc}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pc}%"></i></div></div>`; }).join('')}</div>
      <div class="row"><button type="button" class="btn ghost small" id="ex-reset">${E(t('ex_reset'))}</button></div>`;
    paintReview();
    $('#ex-reset', box).addEventListener('click', async () => {
      if (await K.confirm(t('ex_reset_q'), { danger: true, okText: t('delete') })) { S.ex = { level: ex.level, score: 0, tries: 0, ok: 0, streak: 0, best: 0, fails: [], byLevel: { 1: { t: 0, o: 0 }, 2: { t: 0, o: 0 }, 3: { t: 0, o: 0 } } }; save(); paintAll(); }
    });
  }
  function paintReview() {
    const b = $('#ex-review'); if (!b) return;
    const n = X().fails.length; b.textContent = t('ex_review', { n }); b.disabled = !n;
  }
  function paintProblem() {
    const box = $('#ex-problem'); if (!box) return;
    const ex = X(); const s = EX[cur.type].solve(cur.p);
    const lv = EX[cur.type].lvl;
    const left = ex.fails.length;
    box.innerHTML = `
      <div class="row spread"><div class="seg" role="group" aria-label="${E(t('ex_level'))}">${[1, 2, 3].map(l => `<button type="button" aria-pressed="${ex.level === l && !cur.review}" data-lv="${l}">${E(t('ex_l' + l))}</button>`).join('')}</div>
        <button type="button" class="btn ghost small" id="ex-review" ${left ? '' : 'disabled'}>${E(t('ex_review', { n: left }))}</button></div>
      <div class="row"><span class="chip accent">${E(t('ex_l' + lv))}</span>${cur.review ? `<span class="chip">${E(t('ex_review_tag'))}</span>` : ''}<span class="chip">+${POINTS[lv]} ${E(t('ex_pts'))}</span></div>
      <p class="ex-q">${E(statementOf(cur.type, cur.p))}</p>
      <label class="field"><span>${E(t('ex_answer'))}</span><span class="inp"><input class="num" id="ex-in" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="${E(t('ex_ph'))}" ${cur.done ? 'disabled' : ''}><span class="unit">${E(s.unit)}</span></span></label>
      <div class="row"><button type="button" class="btn" id="ex-check" ${cur.done ? 'disabled' : ''}>${E(t('ex_check'))}</button><button type="button" class="btn ghost" id="ex-sol" ${cur.done && cur.shown ? 'disabled' : ''}>${E(t('ex_solution'))}</button><button type="button" class="btn ghost" id="ex-next">${E(t('ex_next'))}</button></div>
      <div id="ex-fb" aria-live="polite"></div>`;
    $$('[data-lv]', box).forEach(b => b.addEventListener('click', () => { ex.level = Number(b.dataset.lv); save(); newProblem(false); cur.review = false; paintAll(); }));
    $('#ex-review', box).addEventListener('click', () => { newProblem(true); paintAll(); });
    $('#ex-check', box).addEventListener('click', check);
    $('#ex-sol', box).addEventListener('click', giveUp);
    $('#ex-next', box).addEventListener('click', () => { newProblem(cur.review && X().fails.length > 0); paintAll(); setTimeout(() => $('#ex-in') && $('#ex-in').focus(), 0); });
    const inp = $('#ex-in', box); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cur.done ? $('#ex-next').click() : check(); } });
    if (cur.shown) showSolution();
  }
  function paintAll() { paintProblem(); paintStats(); }

  function solutionHtml(s) {
    return stepsBox(s.steps.concat([step(t('ex_result'), `${fm(C.round(s.ans, Math.max(s.dec, 0)), s.dec)} ${s.unit}`)]), '');
  }
  function showSolution() {
    const s = EX[cur.type].solve(cur.p); cur.shown = true;
    const fb = $('#ex-fb'); if (!fb) return;
    fb.insertAdjacentHTML('beforeend', `<div id="ex-sol-box">${solutionHtml(s)}</div>`);
  }
  function check() {
    if (cur.done) return;
    const inp = $('#ex-in'); const u = C.parseNum(inp.value); const fb = $('#ex-fb');
    if (!Number.isFinite(u)) { fb.innerHTML = msg(t('ex_enter'), 'warn'); inp.focus(); return; }
    const s = EX[cur.type].solve(cur.p);
    const ok = Math.abs(u - s.ans) <= 0.5 * Math.pow(10, -s.dec) + 1e-9;
    const first = !cur.tried; cur.tried = true;
    if (ok) {
      cur.done = true; const g = record(true, first);
      fb.innerHTML = msg(first ? t('ex_correct', { n: g, a: fm(C.round(s.ans, s.dec), s.dec) + ' ' + s.unit }) : t('ex_late'), 'ok');
      inp.disabled = true; $('#ex-check').disabled = true; $('#ex-next').focus();
      showSolution(); paintStats();
    } else {
      record(false, first);
      fb.innerHTML = msg(t('ex_wrong', { a: fm(u, 3) }), 'bad'); paintStats(); inp.select();
    }
  }
  function giveUp() {
    if (cur.done) return;
    const first = !cur.tried; cur.tried = true; cur.done = true;
    record(false, first);
    const inp = $('#ex-in'); inp.disabled = true; $('#ex-check').disabled = true;
    $('#ex-fb').innerHTML = msg(t('ex_given_up'), 'warn'); showSolution(); paintStats(); $('#ex-next').focus();
  }

  // gancho para pruebas automáticas (no cambia el comportamiento)
  A.ex = { EX, current: () => cur, force(type) { cur = { type, p: EX[type].gen(), tried: false, done: false, shown: false, review: false }; paintAll(); } };

  tabs.ex = {
    render(el) {
      if (!cur) newProblem(false);
      else if (!cur.done) { /* conserva el problema; vuelve a pintarlo con el idioma actual */ }
      el.innerHTML = `<div class="grid cols-2"><section class="panel stack" id="ex-problem"></section><section class="panel stack" id="ex-stats"></section></div>${A.disclaimer()}`;
      paintAll();
    }
  };
})();
