/* ============================================================
   Calculadora de goteo y dosis · interfaz y pestañas 1-5
   (la pestaña de ejercicios está en ejercicios.js)
   ============================================================ */
(() => {
  'use strict';
  const K = AppKit, C = GoteoCalc, E = K.esc;
  const t = K.i18n(window.GOTEO_I18N);
  const store = K.storage('goteo');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fm = (x, d = 2) => K.fmt(x, d);
  const num = (path) => C.parseNum(get(path));

  /* ---------- estado ---------- */
  const DEF = () => ({
    tab: 'inf',
    inf: { v: '500', h: '4', m: '', f: '20', fc: '' },
    inv: { mode: 'time', v: '500', g: '', h: '', m: '', start: '' },
    cnt: { dur: 15 },
    dose: { mode: 'liq', dv: '', du: 'mg', cv: '', cu: 'mg/mL', av: '', au: 'mg', avol: '', tv: '', tu: 'mg' },
    kg: { mode: 'dose', w: '', wu: 'kg', pk: '', pku: 'mg', per: 'dose', n: '3', md: '', mdu: 'mg', mday: '', mdayu: 'mg', cv: '', cu: 'mg/mL', rv: '', ru: 'mcg/kg/min', rmday: '', rmdayu: 'mg' },
    pump: { mode: 'rate', rv: '', ru: 'mcg/kg/min', w: '', cmode: 'known', cv: '', cu: 'mg/mL', av: '', au: 'mg', avol: '', mlh: '', pcv: '', pcu: 'mg/mL', pfv: '', pav: '', pau: 'mg', pavol: '' },
    conv: { cat: 'mass', v: '', from: 'g', to: 'mg' },
    rule: { a: '', b: '', c: '', inv: false },
    ex: { level: 1, score: 0, tries: 0, ok: 0, streak: 0, best: 0, fails: [], byLevel: { 1: { t: 0, o: 0 }, 2: { t: 0, o: 0 }, 3: { t: 0, o: 0 } } }
  });
  const merge = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else if (k in a) a[k] = b[k]; } return a; };
  const S = merge(DEF(), store.get('state', {}) || {});
  const save = K.debounce(() => store.set('state', S), 300);
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
  const set = (path, v) => { const ks = path.split('.'); let o = S; for (const k of ks.slice(0, -1)) o = o[k]; o[ks[ks.length - 1]] = v; save(); };

  /* ---------- etiquetas de unidades ---------- */
  const UI = () => t('u_ui');
  const unitLabel = (u) => ({ ui: UI(), 'ui/mL': UI() + '/mL', 'ui/h': UI() + '/h', 'ui/kg/h': UI() + '/kg/h', pct: '%', uL: 'µL', day: t('u_day'), ratio: '1 : x', C: '°C', F: '°F' }[u] || u);
  const doseOpts = () => ['mg', 'g', 'mcg', 'ui'].map(u => [u, unitLabel(u)]);
  const concOpts = () => ['mg/mL', 'mcg/mL', 'pct', 'g/L', 'ui/mL'].map(u => [u, unitLabel(u)]);
  const rateOpts = () => ['mg/h', 'mcg/min', 'mcg/kg/min', 'mg/kg/h', 'ui/h', 'ui/kg/h'].map(u => [u, unitLabel(u)]);
  const baseUnit = (fam) => (fam === 'ui' ? UI() : 'mg');
  const dispDose = (base, fam) => {
    if (fam === 'ui') return `${fm(base, 2)} ${UI()}`;
    if (base >= 1000) return `${fm(base / 1000, 3)} g`;
    if (base > 0 && base < 1) return `${fm(base * 1000, 1)} mcg`;
    return `${fm(base, 2)} mg`;
  };
  const hm = (hours) => { const m = Math.round(hours * 60); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };

  /* ---------- piezas de interfaz ---------- */
  function nf(path, label, o = {}) {
    const right = o.units
      ? `<select data-s="${o.unitPath}" aria-label="${E(label)} · ${E(t('unit'))}">${o.units.map(([v, l]) => `<option value="${E(v)}">${E(l)}</option>`).join('')}</select>`
      : (o.unit ? `<span class="unit">${E(o.unit)}</span>` : '');
    return `<label class="field"><span>${E(label)}</span><span class="inp"><input class="num" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-s="${path}" placeholder="${E(o.ph || '')}">${right}</span>${o.hint ? `<small>${E(o.hint)}</small>` : ''}</label>`;
  }
  const seg = (path, opts, cur) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" aria-pressed="${String(cur) === String(v)}" data-set="${path}=${v}" data-rerender>${E(l)}</button>`).join('')}</div>`;
  const chips = (items) => `<div class="chips">${items.map(([q, l]) => `<button type="button" class="chip q" data-quick="${q}">${E(l)}</button>`).join('')}</div>`;
  const big = (val, unit, label, sub = '') => `<div class="big${String(val).length > 7 ? ' long' : ''}"><span class="lab">${E(label)}</span><span class="val"><b>${val}</b> <span class="u">${E(unit)}</span></span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const stepsBox = (steps, note = '') => `<details class="how" open><summary>${E(t('how'))}</summary><ol class="steps">${steps.map(s => `<li><span>${E(s.text)}</span>${s.expr ? `<code>${E(s.expr)}</code>` : ''}</li>`).join('')}</ol>${note ? `<p class="note">${E(note)}</p>` : ''}</details>`;
  const msg = (txt, kind = 'warn') => `<p class="msg ${kind}" role="${kind === 'bad' ? 'alert' : 'status'}">${E(txt)}</p>`;
  const emptyRes = (txt) => `<div class="empty">${E(txt)}</div>`;
  const err = (e) => msg(t('err_' + e), 'bad');
  const disclaimer = () => `<p class="disclaimer" role="note"><b>${E(t('disc_t'))}</b> ${E(t('disc'))}</p>`;

  /* ---------- enlaces con el estado ---------- */
  function validate(root) {
    $$('input.num', root).forEach(i => {
      const bad = i.value.trim() !== '' && Number.isNaN(C.parseNum(i.value));
      i.classList.toggle('bad', bad); i.setAttribute('aria-invalid', String(bad));
    });
  }
  function bind(root, onInput) {
    $$('[data-s]', root).forEach(el => {
      const v = get(el.dataset.s);
      if (el.type === 'checkbox') el.checked = !!v; else if (v !== undefined) el.value = v;
      const ev = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'time') ? 'change' : 'input';
      el.addEventListener(ev, () => { set(el.dataset.s, el.type === 'checkbox' ? el.checked : el.value); validate(root); onInput && onInput(); });
    });
    $$('[data-set]', root).forEach(b => b.addEventListener('click', () => {
      const i = b.dataset.set.indexOf('='); const path = b.dataset.set.slice(0, i); let val = b.dataset.set.slice(i + 1);
      if (val === 'true') val = true; else if (val === 'false') val = false; else if (/^\d+$/.test(val) && path === 'cnt.dur') val = Number(val);
      set(path, val); if (b.hasAttribute('data-rerender')) show(S.tab);
    }));
    $$('[data-quick]', root).forEach(b => b.addEventListener('click', () => {
      b.dataset.quick.split(';').forEach(p => {
        const i = p.indexOf('='); const path = p.slice(0, i), val = p.slice(i + 1); set(path, val);
        const el = root.querySelector(`[data-s="${path}"]`); if (el) el.value = val;
      });
      validate(root); onInput && onInput();
    }));
    validate(root);
  }

  /* ============================================================
     1 · VELOCIDAD DE INFUSIÓN
     ============================================================ */
  const sound = { on: false, ac: null, timer: 0, period: 0 };
  function tick() {
    if (!sound.ac) return;
    const a = sound.ac, o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.16, a.currentTime + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.09);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.1);
  }
  function setTick() {
    clearInterval(sound.timer); sound.timer = 0;
    if (sound.on && sound.period >= 0.25 && document.visibilityState === 'visible') sound.timer = setInterval(tick, sound.period * 1000);
  }
  document.addEventListener('visibilitychange', setTick);
  const getF = () => (S.inf.f === 'custom' ? C.parseNum(S.inf.fc) : Number(S.inf.f));
  let target = null; // goteo objetivo (gotas/min) para el contador

  function dripSvg() {
    return `<svg class="drip" viewBox="0 0 120 230" role="img" aria-label="${E(t('drip_alt'))}">
      <defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2ea" stop-opacity=".9"/><stop offset="1" stop-color="#3b6ea5"/></linearGradient>
      <linearGradient id="gc" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient></defs>
      <path d="M52 0h16v20l-6 8h-4l-6-8z" fill="#b9c6d6" fill-opacity=".85"/>
      <rect x="30" y="28" width="60" height="150" rx="14" fill="url(#gc)" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>
      <path d="M32 150h56v14a12 12 0 0 1-12 12H44a12 12 0 0 1-12-12z" fill="url(#gl)"/>
      <ellipse class="ripple" cx="60" cy="152" rx="20" ry="3.4" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>
      <path class="drop" d="M60 40c-5.5 8-9 13.5-9 18a9 9 0 0 0 18 0c0-4.500-3.500-10-9-18z" fill="#9fd0ff" stroke="#fff" stroke-opacity=".6"/>
      <rect x="54" y="178" width="12" height="40" rx="4" fill="#b9c6d6" fill-opacity=".8"/>
    </svg>`;
  }

  function stInfusion(V, hrs, f, r, hText) {
    const steps = [];
    if (hText) steps.push({ text: t('st_hours'), expr: `${hText} = ${fm(hrs, 3)} h` });
    steps.push({ text: t('st_mlh'), expr: `${fm(V)} ÷ ${fm(hrs, 3)} = ${fm(r.mlh, 2)} mL/h` });
    if (r.gpm != null) {
      steps.push({ text: t('st_gpm'), expr: `(${fm(V)} × ${fm(f)}) ÷ (${fm(hrs, 3)} × 60) = ${fm(r.gpm, 2)} ${t('drops_min')}` });
      steps.push({ text: t('st_round_int'), expr: `${fm(r.gpm, 2)} → ${r.gpmR} ${t('drops_min')}` });
      steps.push({ text: t('st_spd'), expr: `60 ÷ ${r.gpmR} = ${fm(60 / r.gpmR, 2)} s` });
    }
    return steps;
  }

  function infRes() {
    const box = $('#inf-res'); if (!box) return;
    const V = num('inf.v'), h = num('inf.h'), m = num('inf.m');
    const hrs = (Number.isFinite(h) ? h : 0) + (Number.isFinite(m) ? m / 60 : 0);
    const f = getF();
    target = null; sound.period = 0; setTick();
    if (!(V > 0) || !(hrs > 0)) { box.innerHTML = `<h2>${E(t('result'))}</h2>${emptyRes(t('need_data'))}`; $('#cnt-target') && ($('#cnt-target').textContent = '—'); return; }
    const r = C.infusion(V, hrs, f);
    const hText = (Number.isFinite(m) && m > 0) ? `${fm(Number.isFinite(h) ? h : 0, 2)} h + ${fm(m, 0)} min ÷ 60` : '';
    let html = `<h2>${E(t('result'))}</h2><div class="results">`;
    html += big(fm(r.mlh, 1), 'mL/h', t('r_pump'), E(t('r_pump_sub')));
    if (r.gpm != null) {
      target = r.gpmR; sound.period = r.spdR;
      html += big(fm(r.gpmR, 0), t('drops_min'), t('r_manual'), `≈ ${fm(r.gpm, 1)} → ${E(t('round_int'))}`);
      html += big(fm(r.spdR, 2), 's', t('r_spd'), E(t('r_spd_sub', { n: fm(r.spdR, 1) })));
    }
    html += '</div>';
    if (r.gpm == null) html += msg(t('need_factor'), 'warn');
    if (r.gpm != null && r.gpmR > 150) html += msg(t('w_fast'), 'warn');
    if (r.gpm != null && r.gpmR < 5) html += msg(t('w_slow'), 'warn');
    const d = C.dropsDivisor(f);
    const note = (Number.isFinite(d) && r.gpm != null) ? t('shortcut', { f: fm(f, 0), d: fm(d, 2), mlh: fm(r.mlh, 1), gpm: fm(r.gpm, 1) }) : '';
    html += stepsBox(stInfusion(V, hrs, f, r, hText), note);
    if (r.gpm != null) {
      const spd = Math.max(0.2, r.spdR);
      html += `<div class="dripbox" style="--spd:${spd}s">${dripSvg()}<div class="stack"><p class="muted">${E(t('drip_help', { n: fm(r.gpmR, 0) }))}</p>
        <button type="button" class="btn ghost small" id="snd" aria-pressed="${sound.on}">${E(sound.on ? t('snd_off') : t('snd_on'))}</button></div></div>`;
    }
    box.innerHTML = html;
    const sb = $('#snd', box); if (sb) sb.addEventListener('click', () => {
      sound.on = !sound.on;
      if (sound.on && !sound.ac) { try { sound.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { sound.on = false; K.toast(t('snd_na')); } }
      if (sound.ac && sound.ac.state === 'suspended') sound.ac.resume();
      sb.setAttribute('aria-pressed', String(sound.on)); sb.textContent = sound.on ? t('snd_off') : t('snd_on'); setTick();
    });
    $('#cnt-target') && ($('#cnt-target').textContent = target != null ? `${fm(target, 0)} ${t('drops_min')}` : '—');
  }

  function invRes() {
    const box = $('#inv-res'); if (!box) return;
    const f = getF(); const I = S.inv;
    if (!(f > 0)) { box.innerHTML = msg(t('need_factor')); return; }
    if (I.mode === 'time') {
      const V = num('inv.v'), g = num('inv.g');
      if (!(V > 0) || !(g > 0)) { box.innerHTML = emptyRes(t('need_data')); return; }
      const r = C.timeFromDrops(V, g, f);
      let endTxt = '';
      const st = /^(\d{1,2}):(\d{2})$/.exec(I.start || '');
      if (st) { const total = (+st[1]) * 60 + (+st[2]) + Math.round(r.min); const day = Math.floor(total / 1440); const mm = ((total % 1440) + 1440) % 1440; endTxt = `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}${day > 0 ? ` (+${day} ${t('u_day_short')})` : ''}`; }
      box.innerHTML = `<div class="results">${big(hm(r.hours), '', t('inv_total'), `${fm(r.min, 0)} min`)}${big(fm(r.mlh, 1), 'mL/h', t('inv_mlh'))}${endTxt ? big(endTxt, '', t('inv_end')) : ''}</div>`
        + stepsBox([{ text: t('st_inv_time'), expr: `(${fm(V)} × ${fm(f)}) ÷ ${fm(g)} = ${fm(r.min, 1)} min = ${hm(r.hours)}` }, { text: t('st_inv_mlh'), expr: `(${fm(g)} × 60) ÷ ${fm(f)} = ${fm(r.mlh, 1)} mL/h` }]);
    } else {
      const g = num('inv.g'), h = num('inv.h'), m = num('inv.m');
      const min = (Number.isFinite(h) ? h * 60 : 0) + (Number.isFinite(m) ? m : 0);
      if (!(g > 0) || !(min > 0)) { box.innerHTML = emptyRes(t('need_data')); return; }
      const r = C.volFromDrops(g, min, f);
      box.innerHTML = `<div class="results">${big(fm(r.ml, 1), 'mL', t('inv_vol'))}${big(fm(r.mlh, 1), 'mL/h', t('inv_mlh'))}</div>`
        + stepsBox([{ text: t('st_inv_vol'), expr: `(${fm(g)} × ${fm(min, 1)}) ÷ ${fm(f)} = ${fm(r.ml, 1)} mL` }, { text: t('st_inv_mlh'), expr: `(${fm(g)} × 60) ÷ ${fm(f)} = ${fm(r.mlh, 1)} mL/h` }]);
    }
  }

  /* Contador de gotas (práctica de la cuenta de 15 s) */
  const cnt = { run: false, taps: 0, t0: 0, id: 0 };
  function cntReset() { clearInterval(cnt.id); cnt.run = false; cnt.taps = 0; cntPaint(); const r = $('#cnt-out'); if (r) r.innerHTML = ''; }
  function cntPaint(done) {
    const left = $('#cnt-left'), tp = $('#cnt-taps'); if (!left) return;
    const dur = S.cnt.dur; const el = cnt.run ? (performance.now() - cnt.t0) / 1000 : 0;
    left.textContent = cnt.run ? fm(Math.max(0, dur - el), 1) : String(dur); tp.textContent = String(cnt.taps);
  }
  function cntTap() {
    const dur = S.cnt.dur;
    if (!cnt.run) {
      cnt.run = true; cnt.taps = 0; cnt.t0 = performance.now(); $('#cnt-out').innerHTML = '';
      cnt.id = setInterval(() => { if ((performance.now() - cnt.t0) / 1000 >= dur) cntEnd(); else cntPaint(); }, 100);
    }
    cnt.taps++; cntPaint();
  }
  function cntEnd() {
    clearInterval(cnt.id); cnt.run = false; cntPaint();
    const dur = S.cnt.dur; const est = cnt.taps * 60 / dur;
    let html = `<div class="results">${big(fm(est, 0), t('drops_min'), t('cnt_est'), E(t('cnt_formula', { n: cnt.taps, s: dur, f: 60 / dur })))}</div>`;
    if (target) { const diff = est - target; const pct = Math.abs(diff) / target * 100; html += msg(t(pct <= 10 ? 'cnt_ok' : 'cnt_off', { t: fm(target, 0), d: fm(pct, 0) }), pct <= 10 ? 'ok' : 'warn'); }
    $('#cnt-out').innerHTML = html;
  }

  const tabs = {};
  tabs.inf = {
    render(el) {
      const f = S.inf.f;
      el.innerHTML = `
      <div class="grid cols-2">
        <section class="panel stack"><h2>${E(t('inf_title'))}</h2>
          ${nf('inf.v', t('f_vol'), { unit: 'mL', ph: '500' })}
          ${chips([100, 250, 500, 1000].map(x => [`inf.v=${x}`, `${x} mL`]))}
          <div class="row2">${nf('inf.h', t('f_hours'), { unit: 'h', ph: '4' })}${nf('inf.m', t('f_minutes'), { unit: 'min', ph: '0' })}</div>
          ${chips([['inf.h=;inf.m=30', '30 min'], ['inf.h=1;inf.m=', '1 h'], ['inf.h=2;inf.m=', '2 h'], ['inf.h=4;inf.m=', '4 h'], ['inf.h=6;inf.m=', '6 h'], ['inf.h=8;inf.m=', '8 h'], ['inf.h=12;inf.m=', '12 h'], ['inf.h=24;inf.m=', '24 h']])}
          <div class="stack"><span class="lbl">${E(t('f_factor'))}</span>
            ${seg('inf.f', [['20', t('fac20')], ['15', t('fac15')], ['60', t('fac60')], ['custom', t('fac_other')]], f)}
            ${f === 'custom' ? nf('inf.fc', t('f_factor_custom'), { unit: `${t('drops')}/mL`, ph: '10' }) : ''}
            <small class="muted">${E(t('f_factor_hint'))}</small></div>
        </section>
        <section class="panel" id="inf-res" aria-live="polite"></section>
      </div>
      <section class="panel stack"><h2>${E(t('inv_title'))}</h2><p class="muted">${E(t('inv_help'))}</p>
        ${seg('inv.mode', [['time', t('inv_m_time')], ['vol', t('inv_m_vol')]], S.inv.mode)}
        ${S.inv.mode === 'time'
          ? `<div class="row2">${nf('inv.v', t('f_vol'), { unit: 'mL', ph: '500' })}${nf('inv.g', t('inv_gpm'), { unit: t('drops_min'), ph: '42' })}</div>
             <label class="field"><span>${E(t('inv_start'))}</span><span class="inp"><input type="time" data-s="inv.start"></span><small>${E(t('inv_start_hint'))}</small></label>`
          : `<div class="row2">${nf('inv.g', t('inv_gpm'), { unit: t('drops_min'), ph: '42' })}</div><div class="row2">${nf('inv.h', t('f_hours'), { unit: 'h', ph: '2' })}${nf('inv.m', t('f_minutes'), { unit: 'min', ph: '30' })}</div>`}
        <div id="inv-res" aria-live="polite"></div>
      </section>
      <section class="panel stack"><h2>${E(t('cnt_title'))}</h2><p class="muted">${E(t('cnt_help'))}</p>
        <div class="row spread"><div class="seg" role="group" aria-label="${E(t('cnt_dur'))}">${[15, 30, 60].map(d => `<button type="button" aria-pressed="${S.cnt.dur === d}" data-set="cnt.dur=${d}" data-rerender>${d} s</button>`).join('')}</div>
          <span class="chip">${E(t('cnt_goal'))}: <b id="cnt-target">—</b></span></div>
        <div class="cnt-grid"><button type="button" class="tapper" id="tap" aria-label="${E(t('cnt_tap_aria'))}"><span>${E(t('cnt_tap'))}</span><small>${E(t('cnt_tap_sub'))}</small></button>
          <div class="stack"><div class="stat"><b id="cnt-left">${S.cnt.dur}</b><span>${E(t('cnt_left'))}</span></div><div class="stat"><b id="cnt-taps">0</b><span>${E(t('cnt_taps'))}</span></div>
          <button type="button" class="btn ghost small" id="cnt-reset">${E(t('reset'))}</button></div></div>
        <div id="cnt-out" aria-live="polite"></div>
      </section>
      ${disclaimer()}`;
      const upd = () => { infRes(); invRes(); };
      bind(el, upd); upd();
      cntReset(); $('#tap').addEventListener('click', cntTap); $('#cnt-reset').addEventListener('click', cntReset);
    },
    leave() { sound.period = 0; setTick(); cntReset(); }
  };

  /* ============================================================
     2 · DOSIS → VOLUMEN / UNIDADES
     ============================================================ */
  const stDoseBase = (v, u) => (u === 'mg' || u === 'ui' ? null : { text: t('st_to_base', { u: baseUnit(C.famDose(u)) }), expr: `${fm(v, 3)} ${unitLabel(u)} = ${fm(C.doseBase(v, u), 3)} ${baseUnit(C.famDose(u))}` });
  const stConcBase = (v, u) => (u === 'mg/mL' || u === 'ui/mL' ? null : { text: t('st_conc_base', { u: C.famConc(u) === 'ui' ? UI() + '/mL' : 'mg/mL' }), expr: `${fm(v, 3)} ${unitLabel(u)} = ${fm(C.concBase(v, u), 3)} ${C.famConc(u) === 'ui' ? UI() + '/mL' : 'mg/mL'}` });
  const compact = (arr) => arr.filter(Boolean);

  function doseRes() {
    const box = $('#dose-res'); if (!box) return;
    const D = S.dose; const dv = num('dose.dv');
    let html = `<h2>${E(t('result'))}</h2>`;
    if (D.mode === 'tab') {
      const tv = num('dose.tv');
      if (!(dv > 0) || !(tv > 0)) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      const r = C.unitsFromDose(dv, D.du, tv, D.tu);
      if (r.error) { box.innerHTML = html + err(r.error); return; }
      html += `<div class="results">${big(fm(r.n, 2), t('u_units'), t('r_units'), r.nearWhole ? '' : (r.nearHalf ? E(t('w_half_ok')) : ''))}</div>`;
      if (!r.nearWhole && !r.nearHalf) html += msg(t('w_tab_frac', { n: fm(r.n, 2) }), 'warn');
      html += stepsBox(compact([stDoseBase(dv, D.du), stDoseBase(tv, D.tu), { text: t('st_units'), expr: `${fm(C.doseBase(dv, D.du), 3)} ÷ ${fm(C.doseBase(tv, D.tu), 3)} = ${fm(r.n, 3)} ${t('u_units')}` }]), t('note_tab'));
      box.innerHTML = html; return;
    }
    let cb, steps = [], vialMl = NaN, concTxt = '';
    if (D.mode === 'vial') {
      const av = num('dose.av'), avol = num('dose.avol');
      if (!(dv > 0) || !(av > 0) || !(avol > 0)) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      const c = C.concFromVial(av, D.au, avol);
      if (!C.compatible(D.du, C.famDose(D.au) === 'ui' ? 'ui/mL' : 'mg/mL')) { box.innerHTML = html + err('units'); return; }
      vialMl = avol; cb = c.mgMl;
      steps = compact([stDoseBase(av, D.au), { text: t('st_vial_conc'), expr: `${fm(C.doseBase(av, D.au), 3)} ÷ ${fm(avol, 2)} = ${fm(cb, 3)} ${baseUnit(c.fam)}/mL` }]);
      concTxt = `${fm(cb, 3)} ${baseUnit(c.fam)}/mL`;
    } else {
      const cv = num('dose.cv');
      if (!(dv > 0) || !(cv > 0)) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      if (!C.compatible(D.du, D.cu)) { box.innerHTML = html + err('units'); return; }
      cb = C.concBase(cv, D.cu); steps = compact([stConcBase(cv, D.cu)]); concTxt = `${fm(cb, 3)} ${baseUnit(C.famConc(D.cu))}/mL`;
    }
    const db = C.doseBase(dv, D.du); const ml = db / cb; const famD = C.famDose(D.du);
    steps = compact([stDoseBase(dv, D.du)]).concat(steps, [{ text: t('st_ml'), expr: `${fm(db, 3)} ÷ ${fm(cb, 3)} = ${fm(ml, 3)} mL` }]);
    const shown = ml < 1 ? C.round(ml, 2) : C.round(ml, 1);
    html += `<div class="results">${big(fm(shown, 2), 'mL', t('r_ml'), E(t('round_syr')))}`;
    const sy = C.syringe(ml); if (sy) html += big(`${sy.cap}`, 'mL', t('r_syringe'), E(t('r_syringe_sub')));
    html += '</div>';
    if (ml < 0.05) html += msg(t('w_tiny'), 'warn');
    if (ml > 20) html += msg(t('w_big'), 'warn');
    if (D.mode === 'vial' && ml > vialMl + 1e-9) html += msg(t('w_vial', { n: Math.ceil(ml / vialMl - 1e-9) }), 'warn');
    html += `<p class="muted">${E(t('conc_is', { c: concTxt }))}</p>`;
    html += stepsBox(steps, t('note_ml'));
    box.innerHTML = html;
  }
  tabs.dose = {
    render(el) {
      const D = S.dose;
      let conc;
      if (D.mode === 'liq') conc = `<div class="row2">${nf('dose.cv', t('d_conc'), { units: concOpts(), unitPath: 'dose.cu', ph: '50' })}</div><small class="muted">${E(t('d_pct_hint'))}</small>`;
      else if (D.mode === 'vial') conc = `<div class="row2">${nf('dose.av', t('d_vial_amount'), { units: doseOpts(), unitPath: 'dose.au', ph: '100' })}${nf('dose.avol', t('d_vial_vol'), { unit: 'mL', ph: '2' })}</div>`;
      else conc = `<div class="row2">${nf('dose.tv', t('d_tab_content'), { units: doseOpts(), unitPath: 'dose.tu', ph: '250' })}</div>`;
      el.innerHTML = `<div class="grid cols-2"><section class="panel stack"><h2>${E(t('dose_title'))}</h2><p class="muted">${E(t('dose_help'))}</p>
        ${seg('dose.mode', [['liq', t('d_m_liq')], ['vial', t('d_m_vial')], ['tab', t('d_m_tab')]], D.mode)}
        ${nf('dose.dv', t('d_dose'), { units: doseOpts(), unitPath: 'dose.du', ph: '250' })}
        <h3>${E(t(D.mode === 'tab' ? 'd_have_tab' : 'd_have'))}</h3>${conc}</section>
        <section class="panel" id="dose-res" aria-live="polite"></section></div>${disclaimer()}`;
      bind(el, doseRes); doseRes();
    }
  };

  /* ============================================================
     3 · DOSIS POR PESO
     ============================================================ */
  function kgRes() {
    const box = $('#kg-res'); if (!box) return;
    const P = S.kg; const w = num('kg.w');
    let html = `<h2>${E(t('result'))}</h2>`;
    const kg = C.toKg(w, P.wu);
    const wStep = (P.wu === 'lb' && w > 0) ? [{ text: t('st_lb'), expr: `${fm(w, 2)} lb × 0,4536 = ${fm(kg, 2)} kg` }] : [];
    if (P.mode === 'dose') {
      const pk = num('kg.pk'), n = num('kg.n'), md = num('kg.md'), mday = num('kg.mday');
      if (!(kg > 0) || !(pk > 0)) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      const perDay = P.per === 'day';
      if (perDay && !(n >= 1)) { box.innerHTML = html + emptyRes(t('need_doses')); return; }
      const r = C.weightDose(pk, P.pku, kg, { perDay, doses: perDay ? n : 1, maxDose: md, maxDoseUnit: P.mdu, maxDay: mday, maxDayUnit: P.mdayu });
      if (r.error) { box.innerHTML = html + err(r.error); return; }
      const fam = C.famDose(P.pku);
      html += '<div class="results">' + big(dispDose(r.perDose, fam), '', t('r_perdose'), perDay ? E(t('r_perdose_sub', { n: fm(n, 0) })) : '');
      if (perDay || n > 1) html += big(dispDose(r.daily, fam), '', t('r_daily'));
      html += '</div>';
      if (r.maxDoseBase != null) html += msg(t(r.overDose ? 'w_over_dose' : 'ok_dose', { v: dispDose(r.perDose, fam), m: dispDose(r.maxDoseBase, fam) }), r.overDose ? 'bad' : 'ok');
      if (r.maxDayBase != null) html += msg(t(r.overDay ? 'w_over_day' : 'ok_day', { v: dispDose(r.daily, fam), m: dispDose(r.maxDayBase, fam) }), r.overDay ? 'bad' : 'ok');
      const cv = num('kg.cv');
      if (cv > 0) {
        if (!C.compatible(P.pku, P.cu)) html += err('units');
        else { const m = C.mlFromDose(r.perDose, fam === 'ui' ? 'ui' : 'mg', cv, P.cu); html += `<div class="results">${big(fm(m.ml < 1 ? C.round(m.ml, 2) : C.round(m.ml, 1), 2), 'mL', t('r_ml_dose'), E(t('round_syr')))}</div>`; }
      }
      const base = C.doseBase(pk, P.pku);
      const steps = wStep.concat(compact([stDoseBase(pk, P.pku) && { text: t('st_perkg_base'), expr: `${fm(pk, 3)} ${unitLabel(P.pku)}/kg = ${fm(base, 3)} ${baseUnit(fam)}/kg` }]),
        [{ text: t(perDay ? 'st_daily' : 'st_perdose'), expr: `${fm(base, 3)} × ${fm(kg, 2)} kg = ${fm(base * kg, 3)} ${baseUnit(fam)}` }],
        perDay ? [{ text: t('st_split'), expr: `${fm(base * kg, 3)} ÷ ${fm(n, 0)} = ${fm(r.perDose, 3)} ${baseUnit(fam)}` }] : []);
      html += stepsBox(steps, t('note_kg'));
    } else {
      const rv = num('kg.rv'), mday = num('kg.rmday');
      if (!(kg > 0) || !(rv > 0)) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      const r = C.weightRate(rv, P.ru, kg, { maxDay: mday, maxDayUnit: P.rmdayu });
      if (r.error) { box.innerHTML = html + err(r.error); return; }
      const fam = P.ru.startsWith('ui') ? 'ui' : 'mass';
      html += '<div class="results">';
      if (fam === 'mass') html += big(fm(r.mcgMin, 2), 'mcg/min', t('r_mcgmin'));
      html += big(fm(r.mgH, 3), `${baseUnit(fam)}/h`, t('r_mgh')) + big(dispDose(r.day, fam), '', t('r_day24')) + '</div>';
      if (r.maxDayBase != null) html += msg(t(r.overDay ? 'w_over_day' : 'ok_day', { v: dispDose(r.day, fam), m: dispDose(r.maxDayBase, fam) }), r.overDay ? 'bad' : 'ok');
      const f = { 'mcg/kg/min': `${fm(rv, 3)} × ${fm(kg, 2)} × 60 ÷ 1000`, 'mg/kg/h': `${fm(rv, 3)} × ${fm(kg, 2)}`, 'mcg/kg/h': `${fm(rv, 3)} × ${fm(kg, 2)} ÷ 1000`, 'ui/kg/h': `${fm(rv, 3)} × ${fm(kg, 2)}` }[P.ru];
      html += stepsBox(wStep.concat([{ text: t('st_rate_h'), expr: `${f} = ${fm(r.mgH, 3)} ${baseUnit(fam)}/h` }, { text: t('st_rate_day'), expr: `${fm(r.mgH, 3)} × 24 = ${fm(r.day, 2)} ${baseUnit(fam)}` }]), t('note_rate'));
    }
    box.innerHTML = html;
  }
  tabs.kg = {
    render(el) {
      const P = S.kg;
      const weight = nf('kg.w', t('k_weight'), { units: [['kg', 'kg'], ['lb', 'lb']], unitPath: 'kg.wu', ph: '70' });
      let body;
      if (P.mode === 'dose') {
        body = `${nf('kg.pk', t('k_perkg'), { units: [['mg', 'mg/kg'], ['mcg', 'mcg/kg'], ['g', 'g/kg'], ['ui', UI() + '/kg']], unitPath: 'kg.pku', ph: '15' })}
          <div class="stack"><span class="lbl">${E(t('k_period'))}</span>${seg('kg.per', [['dose', t('k_per_dose')], ['day', t('k_per_day')]], P.per)}</div>
          ${P.per === 'day' ? nf('kg.n', t('k_doses'), { unit: t('k_doses_u'), ph: '3' }) : ''}
          <h3>${E(t('k_limits'))}</h3><p class="muted">${E(t('k_limits_help'))}</p>
          <div class="row2">${nf('kg.md', t('k_max_dose'), { units: doseOpts(), unitPath: 'kg.mdu', ph: t('optional') })}${nf('kg.mday', t('k_max_day'), { units: doseOpts(), unitPath: 'kg.mdayu', ph: t('optional') })}</div>
          <h3>${E(t('k_conc_opt'))}</h3>${nf('kg.cv', t('d_conc'), { units: concOpts(), unitPath: 'kg.cu', ph: t('optional') })}`;
      } else {
        body = `${nf('kg.rv', t('k_rate'), { units: [['mcg/kg/min', 'mcg/kg/min'], ['mg/kg/h', 'mg/kg/h'], ['mcg/kg/h', 'mcg/kg/h'], ['ui/kg/h', UI() + '/kg/h']], unitPath: 'kg.ru', ph: '5' })}
          <h3>${E(t('k_limits'))}</h3>${nf('kg.rmday', t('k_max_day'), { units: doseOpts(), unitPath: 'kg.rmdayu', ph: t('optional') })}`;
      }
      el.innerHTML = `<div class="grid cols-2"><section class="panel stack"><h2>${E(t('kg_title'))}</h2>
        ${seg('kg.mode', [['dose', t('k_m_dose')], ['rate', t('k_m_rate')]], P.mode)}${weight}${body}</section>
        <section class="panel" id="kg-res" aria-live="polite"></section></div>${disclaimer()}`;
      bind(el, kgRes); kgRes();
    }
  };

  /* ============================================================
     4 · BOMBA DE PERFUSIÓN Y DILUCIÓN
     ============================================================ */
  function readConc() {
    const P = S.pump;
    if (P.cmode === 'known') {
      const cv = num('pump.cv'); if (!(cv > 0)) return null;
      const mg = C.concBase(cv, P.cu), fam = C.famConc(P.cu);
      return { mgMl: mg, fam, vol: NaN, steps: compact([stConcBase(cv, P.cu)]), txt: `${fm(mg, 3)} ${baseUnit(fam)}/mL` };
    }
    const av = num('pump.av'), vol = num('pump.avol'); const d = C.dilutionConc(av, P.au, vol);
    if (d.error) return null;
    return { mgMl: d.mgMl, fam: d.fam, vol, steps: compact([stDoseBase(av, P.au), { text: t('st_dil_conc'), expr: `${fm(C.doseBase(av, P.au), 3)} ÷ ${fm(vol, 1)} = ${fm(d.mgMl, 3)} ${baseUnit(d.fam)}/mL` }]), txt: `${fm(d.mgMl, 3)} ${baseUnit(d.fam)}/mL` };
  }
  const concBlock = () => {
    const P = S.pump;
    return `<h3>${E(t('p_conc'))}</h3>${seg('pump.cmode', [['known', t('p_c_known')], ['amount', t('p_c_amount')]], P.cmode)}
      ${P.cmode === 'known' ? nf('pump.cv', t('d_conc'), { units: concOpts(), unitPath: 'pump.cu', ph: '1,6' })
        : `<div class="row2">${nf('pump.av', t('p_amount'), { units: doseOpts(), unitPath: 'pump.au', ph: '400' })}${nf('pump.avol', t('p_final_vol'), { unit: 'mL', ph: '250' })}</div>`}`;
  };

  function pumpRes() {
    const box = $('#pump-res'); if (!box) return;
    const P = S.pump; let html = `<h2>${E(t('result'))}</h2>`;
    if (P.mode === 'prep') {
      const tcv = num('pump.pcv'), fv = num('pump.pfv'), av = num('pump.pav'), avol = num('pump.pavol');
      if (!(tcv > 0) || !(fv > 0) || !(av > 0) || !(avol > 0)) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      const tb = C.concBase(tcv, P.pcu), fam = C.famConc(P.pcu);
      const r = C.dilutionPrep(tb, fam, fv, av, P.pau, avol);
      if (r.error) { box.innerHTML = html + err(r.error); return; }
      html += `<div class="results">${big(fm(C.round(r.drugMl, 2), 2), 'mL', t('r_drugml'))}${big(fm(Math.max(0, C.round(r.diluent, 1)), 1), 'mL', t('r_diluent'))}${big(fm(r.ampules, 2), t('u_amps'), t('r_amps'))}</div>`;
      if (!r.fits) html += msg(t('w_nofit', { n: fm(-r.diluent, 1) }), 'bad');
      if (r.fits && Math.abs(r.ampules - Math.round(r.ampules)) > 1e-9) html += msg(t('w_partial_amp'), 'warn');
      html += stepsBox(compact([stConcBase(tcv, P.pcu),
        { text: t('st_prep_need'), expr: `${fm(tb, 3)} × ${fm(fv, 1)} = ${fm(r.drugNeeded, 3)} ${baseUnit(fam)}` },
        stDoseBase(av, P.pau),
        { text: t('st_amp_conc'), expr: `${fm(C.doseBase(av, P.pau), 3)} ÷ ${fm(avol, 2)} = ${fm(r.ampConc, 3)} ${baseUnit(fam)}/mL` },
        { text: t('st_prep_ml'), expr: `${fm(r.drugNeeded, 3)} ÷ ${fm(r.ampConc, 3)} = ${fm(r.drugMl, 3)} mL` },
        { text: t('st_prep_dil'), expr: `${fm(fv, 1)} − ${fm(r.drugMl, 2)} = ${fm(r.diluent, 2)} mL` }]), t('note_prep'));
      box.innerHTML = html; return;
    }
    const conc = readConc(); const w = num('pump.w');
    if (P.mode === 'rate') {
      const rv = num('pump.rv');
      if (!(rv > 0) || !conc) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      const r = C.pumpRate(rv, P.ru, w, conc.mgMl, conc.fam);
      if (r.error) { box.innerHTML = html + err(r.error); return; }
      const fam = C.RATE_UNITS[P.ru].fam;
      html += `<div class="results">${big(fm(C.round(r.mlh, 1), 1), 'mL/h', t('r_pump'), E(t('round_pump')))}${big(fm(r.baseH, 3), `${baseUnit(fam)}/h`, t('r_dose_h'))}`;
      if (conc.vol > 0) html += big(hm(conc.vol / r.mlh), '', t('r_bag'), E(t('r_bag_sub', { v: fm(conc.vol, 0) })));
      html += '</div>';
      const ru = C.RATE_UNITS[P.ru];
      const toH = { 'mg/h': `${fm(rv, 3)}`, 'mcg/min': `${fm(rv, 3)} × 60 ÷ 1000`, 'mcg/kg/min': `${fm(rv, 3)} × ${fm(w, 2)} kg × 60 ÷ 1000`, 'mg/kg/h': `${fm(rv, 3)} × ${fm(w, 2)} kg`, 'ui/h': `${fm(rv, 3)}`, 'ui/kg/h': `${fm(rv, 3)} × ${fm(w, 2)} kg` }[P.ru];
      html += stepsBox(conc.steps.concat([{ text: t('st_rate_to_h', { u: baseUnit(fam) }), expr: `${toH} = ${fm(r.baseH, 3)} ${baseUnit(fam)}/h` }, { text: t('st_pump_ml'), expr: `${fm(r.baseH, 3)} ÷ ${fm(conc.mgMl, 3)} = ${fm(r.mlh, 3)} mL/h` }, { text: t('st_round_pump'), expr: `${fm(r.mlh, 3)} → ${fm(C.round(r.mlh, 1), 1)} mL/h` }]), t('note_pump'));
    } else {
      const mlh = num('pump.mlh');
      if (!(mlh > 0) || !conc) { box.innerHTML = html + emptyRes(t('need_data')); return; }
      const r = C.pumpCheck(mlh, conc.mgMl, conc.fam, w);
      if (r.error) { box.innerHTML = html + err(r.error); return; }
      html += `<div class="results">${big(fm(r.baseH, 3), `${baseUnit(conc.fam)}/h`, t('r_dose_h'))}`;
      if (r.mcgMin != null) html += big(fm(r.mcgMin, 2), 'mcg/min', t('r_mcgmin'));
      if (r.mcgKgMin != null) html += big(fm(r.mcgKgMin, 2), 'mcg/kg/min', t('r_mcgkgmin'));
      if (r.uiKgH != null) html += big(fm(r.uiKgH, 2), `${UI()}/kg/h`, t('r_uikgh'));
      html += '</div>';
      const steps = conc.steps.concat([{ text: t('st_check_h'), expr: `${fm(mlh, 2)} × ${fm(conc.mgMl, 3)} = ${fm(r.baseH, 3)} ${baseUnit(conc.fam)}/h` }]);
      if (r.mcgMin != null) steps.push({ text: t('st_check_min'), expr: `${fm(r.baseH, 3)} × 1000 ÷ 60 = ${fm(r.mcgMin, 2)} mcg/min` });
      if (r.mcgKgMin != null) steps.push({ text: t('st_check_kg'), expr: `${fm(r.mcgMin, 2)} ÷ ${fm(w, 2)} kg = ${fm(r.mcgKgMin, 2)} mcg/kg/min` });
      html += stepsBox(steps, t('note_check'));
    }
    box.innerHTML = html;
  }
  tabs.pump = {
    render(el) {
      const P = S.pump; let form;
      if (P.mode === 'rate') {
        form = `${nf('pump.rv', t('p_rate'), { units: rateOpts(), unitPath: 'pump.ru', ph: '5' })}
          ${C.rateNeedsKg(P.ru) ? nf('pump.w', t('k_weight'), { unit: 'kg', ph: '70' }) : ''}${concBlock()}`;
      } else if (P.mode === 'check') {
        form = `${nf('pump.mlh', t('p_mlh'), { unit: 'mL/h', ph: '13,1' })}${concBlock()}${nf('pump.w', t('p_weight_opt'), { unit: 'kg', ph: t('optional') })}`;
      } else {
        form = `<p class="muted">${E(t('p_prep_help'))}</p>${nf('pump.pcv', t('p_target'), { units: concOpts(), unitPath: 'pump.pcu', ph: '1' })}${nf('pump.pfv', t('p_final_vol'), { unit: 'mL', ph: '50' })}
          <h3>${E(t('p_ampoule'))}</h3><div class="row2">${nf('pump.pav', t('p_amp_amount'), { units: doseOpts(), unitPath: 'pump.pau', ph: '100' })}${nf('pump.pavol', t('p_amp_vol'), { unit: 'mL', ph: '2' })}</div>`;
      }
      el.innerHTML = `<div class="grid cols-2"><section class="panel stack"><h2>${E(t('pump_title'))}</h2>
        ${seg('pump.mode', [['rate', t('p_m_rate')], ['check', t('p_m_check')], ['prep', t('p_m_prep')]], P.mode)}${form}</section>
        <section class="panel" id="pump-res" aria-live="polite"></section></div>${disclaimer()}`;
      bind(el, pumpRes); pumpRes();
    }
  };

  /* ============================================================
     5 · UNIDADES Y REGLA DE TRES
     ============================================================ */
  const catUnits = {
    mass: ['kg', 'g', 'mg', 'mcg', 'lb', 'oz'], volume: ['L', 'dL', 'cL', 'mL', 'cc', 'uL'], time: ['day', 'h', 'min', 's'],
    conc: ['mg/mL', 'mcg/mL', 'g/L', 'g/dL', 'mg/dL', 'pct', 'ratio'], temp: ['C', 'F', 'K']
  };
  const catDefault = { mass: ['g', 'mg'], volume: ['L', 'mL'], time: ['h', 'min'], conc: ['pct', 'mg/mL'], temp: ['F', 'C'] };
  function convRes() {
    const box = $('#conv-res'); if (!box) return;
    const P = S.conv; const v = num('conv.v');
    if (!Number.isFinite(v)) { box.innerHTML = emptyRes(t('need_data')); return; }
    const r = C.convert(P.cat, v, P.from, P.to);
    if (r.error) { box.innerHTML = err('positive'); return; }
    const c = C.CATS[P.cat]; const L = unitLabel;
    let steps;
    if (P.cat === 'temp') {
      const f = { 'C>F': `${fm(v, 2)} × 9 ÷ 5 + 32`, 'F>C': `(${fm(v, 2)} − 32) × 5 ÷ 9`, 'C>K': `${fm(v, 2)} + 273,15`, 'K>C': `${fm(v, 2)} − 273,15`, 'F>K': `(${fm(v, 2)} − 32) × 5 ÷ 9 + 273,15`, 'K>F': `(${fm(v, 2)} − 273,15) × 9 ÷ 5 + 32` }[P.from + '>' + P.to];
      steps = P.from === P.to ? [{ text: t('st_same') }] : [{ text: t('st_temp'), expr: `${f} = ${fm(r.value, 2)} ${L(P.to)}` }];
    } else if (P.cat === 'conc' && (P.from === 'ratio' || P.to === 'ratio')) {
      steps = [];
      if (P.from === 'ratio') steps.push({ text: t('st_ratio_in'), expr: `1 g ÷ ${fm(v, 0)} mL = ${fm(r.base, 4)} mg/mL` }); else steps.push({ text: t('st_to_base2', { u: 'mg/mL' }), expr: `${fm(v, 3)} ${L(P.from)} × ${fm(c.units[P.from], 4)} = ${fm(r.base, 4)} mg/mL` });
      if (P.to === 'ratio') steps.push({ text: t('st_ratio_out'), expr: `1000 ÷ ${fm(r.base, 4)} = ${fm(r.value, 2)} → 1 : ${fm(r.value, 0)}` });
    } else if (P.from === P.to) steps = [{ text: t('st_same') }];
    else steps = [{ text: t('st_to_base2', { u: c.base }), expr: `${fm(v, 4)} ${L(P.from)} × ${fm(c.units[P.from], 6)} = ${fm(r.base, 6)} ${c.base}` }, { text: t('st_from_base', { u: L(P.to) }), expr: `${fm(r.base, 6)} ÷ ${fm(c.units[P.to], 6)} = ${fm(r.value, 6)} ${L(P.to)}` }];
    const shown = P.to === 'ratio' ? `1 : ${fm(r.value, 0)}` : fm(r.value, 6);
    box.innerHTML = `<div class="results">${big(shown, P.to === 'ratio' ? '' : L(P.to), P.from === 'ratio' ? `1 : ${fm(v, 0)} =` : `${fm(v, 6)} ${L(P.from)} =`)}</div>${stepsBox(steps, P.cat === 'volume' ? t('note_cc') : (P.cat === 'conc' ? t('note_conc') : ''))}`;
  }
  function ruleRes() {
    const box = $('#rule-res'); if (!box) return;
    const R = S.rule; const a = num('rule.a'), b = num('rule.b'), c = num('rule.c');
    if (![a, b, c].every(Number.isFinite)) { box.innerHTML = emptyRes(t('need_data')); return; }
    const r = C.ruleOfThree(a, b, c, R.inv);
    if (r.error) { box.innerHTML = err('zero'); return; }
    const expr = R.inv ? `(${fm(a, 4)} × ${fm(b, 4)}) ÷ ${fm(c, 4)} = ${fm(r.x, 4)}` : `(${fm(b, 4)} × ${fm(c, 4)}) ÷ ${fm(a, 4)} = ${fm(r.x, 4)}`;
    box.innerHTML = `<div class="results">${big(fm(r.x, 4), '', 'x')}</div>${stepsBox([{ text: t(R.inv ? 'st_rule_inv' : 'st_rule_dir'), expr }], t(R.inv ? 'note_rule_inv' : 'note_rule_dir'))}`;
  }
  tabs.conv = {
    render(el) {
      const P = S.conv; const opts = catUnits[P.cat].map(u => [u, unitLabel(u)]);
      const catSeg = `<div class="seg" role="group">${Object.keys(catUnits).map(c => `<button type="button" aria-pressed="${P.cat === c}" data-cat="${c}">${E(t('cat_' + c))}</button>`).join('')}</div>`;
      const sel = (path) => `<select data-s="${path}" aria-label="${E(t('unit'))}">${opts.map(([v, l]) => `<option value="${E(v)}">${E(l)}</option>`).join('')}</select>`;
      const ref = [['1 g', '1000 mg'], ['1 mg', '1000 mcg'], ['1 kg', '≈ 2,2 lb'], ['1 L', '1000 mL'], ['1 mL', '1 cc'], ['1 %', '10 mg/mL'], ['0,9 %', '9 mg/mL'], ['1 : 1000', '1 mg/mL'], ['1 mL', `≈ 20 ${t('drops')} · 60 ${t('microdrops')}`], ['1 h', '60 min']];
      el.innerHTML = `<div class="grid cols-2"><section class="panel stack"><h2>${E(t('conv_title'))}</h2>${catSeg}
        <label class="field"><span>${E(t('c_value'))}</span><span class="inp"><input class="num" type="text" inputmode="decimal" autocomplete="off" data-s="conv.v" placeholder="0,5"></span></label>
        <div class="row conv-row"><label class="field grow"><span>${E(t('c_from'))}</span>${sel('conv.from')}</label>
          <button type="button" class="icon-btn" id="swap" aria-label="${E(t('c_swap'))}" title="${E(t('c_swap'))}">⇄</button>
          <label class="field grow"><span>${E(t('c_to'))}</span>${sel('conv.to')}</label></div>
        <div id="conv-res" aria-live="polite"></div></section>
        <section class="panel stack"><h2>${E(t('ref_title'))}</h2><table class="kit ref"><tbody>${ref.map(([a, b]) => `<tr><td>${E(a)}</td><td>=</td><td>${E(b)}</td></tr>`).join('')}</tbody></table></section></div>
        <section class="panel stack"><h2>${E(t('rule_title'))}</h2><p class="muted">${E(t('rule_help'))}</p>
          <div class="seg" role="group"><button type="button" aria-pressed="${!S.rule.inv}" data-set="rule.inv=false" data-rerender>${E(t('rule_dir'))}</button><button type="button" aria-pressed="${S.rule.inv}" data-set="rule.inv=true" data-rerender>${E(t('rule_inv'))}</button></div>
          <div class="rule"><div class="rule-row"><span>${E(t('rule_if'))}</span>${nf('rule.a', 'A', { ph: '3' })}<span>${E(t(S.rule.inv ? 'rule_then_inv' : 'rule_is'))}</span>${nf('rule.b', 'B', { ph: '12' })}</div>
          <div class="rule-row"><span>${E(t('rule_so'))}</span>${nf('rule.c', 'C', { ph: '5' })}<span>${E(t('rule_is_x'))}</span><b class="x">x</b></div></div>
          <div id="rule-res" aria-live="polite"></div></section>${disclaimer()}`;
      $$('[data-cat]', el).forEach(b => b.addEventListener('click', () => { const c = b.dataset.cat; set('conv.cat', c); set('conv.from', catDefault[c][0]); set('conv.to', catDefault[c][1]); show('conv'); }));
      $('#swap', el).addEventListener('click', () => { const f = S.conv.from; set('conv.from', S.conv.to); set('conv.to', f); show('conv'); });
      bind(el, () => { convRes(); ruleRes(); }); convRes(); ruleRes();
    }
  };

  /* ---------- exponer lo necesario para ejercicios.js ---------- */
  window.GoteoApp = { K, C, t, S, save, store, tabs, fm, big, stepsBox, msg, emptyRes, disclaimer, unitLabel, UI, E, $, $$, show: (n) => show(n) };

  /* ============================================================
     NAVEGACIÓN DE PESTAÑAS
     ============================================================ */
  const ORDER = ['inf', 'dose', 'kg', 'pump', 'conv', 'ex'];
  function show(name) {
    if (!tabs[name]) name = 'inf';
    if (tabs[S.tab] && tabs[S.tab].leave && S.tab !== name) tabs[S.tab].leave();
    S.tab = name; save();
    $$('#tablist button').forEach(b => { const on = b.dataset.tab === name; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    const panel = $('#panel'); panel.setAttribute('aria-labelledby', 'tab-' + name);
    tabs[name].render(panel);
  }
  function build() {
    $('#intro').textContent = t('intro');
    $('#tablist').innerHTML = ORDER.map(k => `<button type="button" role="tab" id="tab-${k}" data-tab="${k}" aria-controls="panel">${E(t('tab_' + k))}</button>`).join('');
    $$('#tablist button').forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
    $('#tablist').addEventListener('keydown', (e) => {
      const i = ORDER.indexOf(S.tab); let n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % ORDER.length; else if (e.key === 'ArrowLeft') n = (i - 1 + ORDER.length) % ORDER.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = ORDER.length - 1;
      if (n >= 0) { e.preventDefault(); show(ORDER[n]); $('#tab-' + ORDER[n]).focus(); }
    });
    document.title = `${t('title')} · Luis Franco Serrano`;
    show(S.tab);
  }
  K.mount({ titleKey: 'title' });
  K.onLang(build);
  window.addEventListener('DOMContentLoaded', build);
  if (document.readyState !== 'loading') build();
})();
