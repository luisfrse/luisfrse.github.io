/* ============================================================
   Corrector de tests · lógica
   Todo se ejecuta y se guarda en el navegador (localStorage).
   ============================================================ */
(() => {
  'use strict';
  const K = window.AppKit;
  const t = K.i18n(window.CORR_I18N);
  const store = K.storage('corrector');
  const esc = K.esc;
  const LET = ['A', 'B', 'C', 'D', 'E'];
  const VERS = ['A', 'B', 'C', 'D'];
  const CAMPUS = document.documentElement.dataset.mode === 'campus';
  const TABS = ['exam', 'key', 'students', 'sheet', 'scan', 'results', 'print', 'sync'];
  /* en el campus todo se guarda ya en el servidor: la pestaña de sincronizar con carpetas/archivos sobra */
  if (document.documentElement.dataset.mode === 'campus') TABS.splice(TABS.indexOf('sync'), 1);
  const C = window.CORR, R = C.roster;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fit = (a, n, fill) => { a = Array.isArray(a) ? a.slice(0, n) : []; while (a.length < n) a.push(fill); return a; };
  const today = () => new Date().toISOString().slice(0, 10);
  const num = (v, d = 0) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : d; };
  const letters = () => LET.slice(0, exam.nopt);

  /* ---------------------------------------------------------- modelo */
  let exam = null;
  const ui = Object.assign({ tab: 'exam', kv: 'A', sel: null, sortK: 'name', sortDir: 1, showCorr: true, autoNext: true, cur: 0, filter: '', onlyFlags: false,
    sheet: { cols: 0, name: true, date: true, group: true, version: true, grade: false, instr: true } }, store.get('ui', {}));
  let saveFailed = false, savedTime = 0;

  function fix(e) {
    e.id = e.id || K.uid();
    e.name = String(e.name || '');
    e.date = e.date || today();
    e.nq = K.clamp(parseInt(e.nq, 10) || 20, 1, 100);
    e.nopt = e.nopt === 5 ? 5 : 4;
    e.versions = (Array.isArray(e.versions) ? e.versions : ['A']).filter(v => VERS.includes(v));
    if (!e.versions.length) e.versions = ['A'];
    e.keys = e.keys || {}; e.annul = e.annul || {};
    e.versions.forEach(v => { e.keys[v] = fit(e.keys[v], e.nq, ''); });
    Object.keys(e.keys).forEach(v => { if (!e.versions.includes(v)) delete e.keys[v]; });
    // anuladas: una lista por pregunta de la versión A (valen para todas las versiones); se aceptan copias antiguas por versión
    let an = e.annul;
    if (!Array.isArray(an)) { const merged = []; Object.values(an || {}).forEach(arr => (arr || []).forEach((x, i) => { if (x) merged[i] = true; })); an = merged; }
    e.annul = fit(an, e.nq, false).map(Boolean);
    // correspondencia: posición en la versión → número de pregunta en la versión A
    const isPerm = (m) => Array.isArray(m) && m.length === e.nq && m.every(x => Number.isInteger(x) && x >= 0 && x < e.nq) && new Set(m).size === e.nq;
    e.maps = e.maps || {};
    e.versions.forEach(v => { e.maps[v] = (v !== 'A' && isPerm(e.maps[v])) ? e.maps[v].slice() : Array.from({ length: e.nq }, (_, i) => i); });
    Object.keys(e.maps).forEach(v => { if (!e.versions.includes(v)) delete e.maps[v]; });
    /* opciones desordenadas por versión: opts[v][i][letra nueva] = letra de la A (índices) */
    const isOpt = (a) => Array.isArray(a) && a.length === e.nopt && a.every(x => Number.isInteger(x) && x >= 0 && x < e.nopt) && new Set(a).size === e.nopt;
    e.opts = e.opts || {};
    Object.keys(e.opts).forEach(v => { const o = e.opts[v]; if (v === 'A' || !e.versions.includes(v) || !Array.isArray(o) || o.length !== e.nq || !o.every(isOpt)) delete e.opts[v]; });
    e.annulMode = e.annulMode === 'exclude' ? 'exclude' : 'credit';
    e.weightsOn = !!e.weightsOn;
    e.weights = fit(e.weights, e.nq, 1).map(w => (Number.isFinite(+w) ? +w : 1));
    e.scoring = Object.assign({ maxGrade: 10, pass: 5, correct: 1, preset: 'chance', penaltyCustom: 0.25 }, e.scoring || {});
    e.scoring.maxGrade = Math.max(0.01, num(e.scoring.maxGrade, 10));
    e.scoring.pass = Math.max(0, num(e.scoring.pass, 5));
    e.scoring.correct = Math.max(0.01, num(e.scoring.correct, 1));
    if (!['none', 'chance', 'quarter', 'custom'].includes(e.scoring.preset)) e.scoring.preset = 'chance';
    e.students = (Array.isArray(e.students) ? e.students : []).map(s => {
      const o = { id: s.id || K.uid(), name: String(s.name || ''), last: String(s.last || ''), first: String(s.first || ''), group: String(s.group || ''), code: String(s.code || '').replace(/\D/g, ''),
        version: e.versions.includes(s.version) ? s.version : e.versions[0], answers: fit(s.answers, e.nq, '').map(a => (letters2(e).includes(a) ? a : '')) };
      if (s.rid) o.rid = s.rid; if (s.scanned) o.scanned = s.scanned;
      if (o.last || o.first) o.name = R.display(o);
      return o;
    });
    e.codeLen = K.clamp(parseInt(e.codeLen, 10) || 4, 3, 10); e.codeCheck = !!e.codeCheck; e.codeMode = e.codeMode === 'seq' ? 'seq' : 'random';
    e.sheet = { nq: [20, 50, 100].includes(+(e.sheet && e.sheet.nq)) ? +e.sheet.nq : 0 };
    e.updated = e.updated || Date.now();
    e.created = e.created || e.updated;
    return e;
  }
  const letters2 = (e) => LET.slice(0, e.nopt);
  const newExam = (name = '') => fix({ id: K.uid(), name, date: today(), nq: 20, nopt: 4, versions: ['A'], keys: {}, annul: [], maps: {}, students: [] });

  /* ---------------------------------------------------------- persistencia */
  let dirty = false;
  function persist() {
    if (!exam) return;
    const wasDirty = dirty; if (dirty) { exam.updated = Date.now(); dirty = false; }
    let ok = store.set('exam:' + exam.id, exam);
    const idx = store.get('index', []);
    if (!idx.includes(exam.id)) idx.push(exam.id);
    ok = store.set('index', idx) && ok;
    store.set('current', exam.id); examsCache = null;
    store.set('ui', { tab: ui.tab, kv: ui.kv, showCorr: ui.showCorr, autoNext: ui.autoNext, sheet: ui.sheet, sortK: ui.sortK, sortDir: ui.sortDir });
    saveFailed = !ok; savedTime = Date.now();
    renderStatus();
    if (wasDirty && C.sync.link.handle) { C.sync.link.markDirty(); C.uiSync.refreshChips(); C.sync.link.autoDebounced(); }
  }
  const save = K.debounce(persist, 300);
  const changed = () => { dirty = true; save(); renderHead(); };
  window.addEventListener('pagehide', persist);

  function examIndex() {
    return store.get('index', []).map(id => store.get('exam:' + id)).filter(Boolean).sort((a, b) => (b.created || b.updated || 0) - (a.created || a.updated || 0));
  }
  const isBlank = (e) => !!e && !e.name && !(e.students || []).length && Object.values(e.keys || {}).every(k => !(k || []).some(Boolean)) && !(e.annul || []).some(Boolean);
  /* Al salir de un examen completamente vacío no se guarda: así no se acumulan «Examen sin nombre». */
  function dropIfBlank() {
    if (!exam || !isBlank(exam)) return false;
    store.remove('exam:' + exam.id); store.set('index', store.get('index', []).filter(x => x !== exam.id)); examsCache = null;
    return true;
  }
  let examsCache = null;
  const examList = () => {
    if (!examsCache) examsCache = examIndex().map(e => ({ id: e.id, name: e.name, date: e.date }));
    const l = examsCache.map(e => (e.id === exam.id ? { id: exam.id, name: exam.name, date: exam.date } : e));
    return l.some(e => e.id === exam.id) ? l : [{ id: exam.id, name: exam.name, date: exam.date }].concat(l);
  };
  function announceOpen() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    K.toast(t('opened', { name: exam.name || t('untitled') }), 2600);
  }
  function openExam(id) {
    const e = store.get('exam:' + id);
    if (!e) return false;
    if (!dropIfBlank()) persist();
    exam = fix(e); ui.kv = exam.versions[0]; ui.sel = exam.students[0] ? exam.students[0].id : null; ui.cur = 0;
    store.set('current', exam.id);
    return true;
  }

  /* ---------------------------------------------------------- puntuación */
  const penFrac = () => { const s = exam.scoring; return s.preset === 'none' ? 0 : s.preset === 'chance' ? 1 / (exam.nopt - 1) : s.preset === 'quarter' ? 0.25 : Math.max(0, num(s.penaltyCustom)); };
  const masterOf = (v, i) => ((exam.maps[v] || [])[i] ?? i);
  const wOf = (i) => (exam.weightsOn ? Math.max(0, num(exam.weights[i], 1)) : 1);

  function score(st) {
    const key = exam.keys[st.version] || [];
    const pf = penFrac(), pc = exam.scoring.correct;
    let c = 0, w = 0, b = 0, raw = 0, max = 0, unscored = 0; const per = [];
    for (let i = 0; i < exam.nq; i++) {
      const k = key[i], m = masterOf(st.version, i), wt = wOf(m);
      if (!k) { per.push('n'); unscored++; continue; }
      if (exam.annul[m]) {
        if (exam.annulMode === 'credit') { per.push('a'); c++; raw += wt * pc; max += wt * pc; } else per.push('x');
        continue;
      }
      max += wt * pc;
      const a = st.answers[i];
      if (!a) { per.push('b'); b++; }
      else if (a === k) { per.push('c'); c++; raw += wt * pc; }
      else { per.push('w'); w++; raw -= wt * pc * pf; }
    }
    const grade = max > 0 ? K.clamp(raw / max, 0, 1) * exam.scoring.maxGrade : null;
    return { c, w, b, raw, max, grade, passed: grade != null && grade >= exam.scoring.pass - 1e-9, per, unscored };
  }
  const results = () => exam.students.map(s => ({ s, r: score(s) }));
  const answered = (s) => s.answers.filter(Boolean).length;

  function stats(rs) {
    const g = rs.map(x => x.r.grade).filter(x => x != null).sort((a, b) => a - b);
    const n = g.length; if (!n) return null;
    const mean = g.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 ? g[(n - 1) / 2] : (g[n / 2 - 1] + g[n / 2]) / 2;
    const sd = n > 1 ? Math.sqrt(g.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1)) : 0;
    const bins = Array(10).fill(0), mg = exam.scoring.maxGrade;
    g.forEach(x => { bins[Math.min(9, Math.floor(x / mg * 10))]++; });
    return { n, mean, median, sd, min: g[0], max: g[n - 1], passPct: g.filter(x => x >= exam.scoring.pass - 1e-9).length / n * 100, bins };
  }

  function itemAnalysis(rs) {
    const n = rs.length;
    const sorted = rs.slice().sort((a, b) => b.r.raw - a.r.raw);
    const k = n >= 6 ? Math.max(2, Math.round(n * 0.27)) : 0;
    const upper = k ? sorted.slice(0, k) : [], lower = k ? sorted.slice(-k) : [];
    const skip = (st) => st === 'n' || st === 'x' || st === 'a';
    const inv = {}; exam.versions.forEach(v => { inv[v] = []; (exam.maps[v] || []).forEach((m, i) => { inv[v][m] = i; }); });
    const canon = (v, i, L) => { const o = exam.opts[v] && exam.opts[v][i]; const x = LET.indexOf(L); return o && x >= 0 ? LET[o[x]] : L; };
    const at = (s, r, m) => { const i = inv[s.version][m]; return { i, st: r.per[i], a: canon(s.version, i, s.answers[i] || ''), key: canon(s.version, i, exam.keys[s.version][i]) }; };
    const out = [];
    for (let m = 0; m < exam.nq; m++) {
      const cnt = {}; letters().forEach(L => { cnt[L] = 0; }); cnt['-'] = 0;
      const wrong = {}; let considered = 0, correct = 0; const keys = new Set();
      rs.forEach(({ s, r }) => {
        const x = at(s, r, m); if (skip(x.st)) return;
        considered++; keys.add(x.key); const a = x.a || '-'; cnt[a] = (cnt[a] || 0) + 1;
        if (x.st === 'c') correct++; else if (x.st === 'w') wrong[a] = (wrong[a] || 0) + 1;
      });
      const p = considered ? correct / considered : null;
      const grp = (g) => { let c = 0, mm = 0; const w = {}; g.forEach(({ s, r }) => { const x = at(s, r, m); if (skip(x.st)) return; mm++; if (x.st === 'c') c++; else if (x.st === 'w') w[x.a] = (w[x.a] || 0) + 1; }); return { c, m: mm, w }; };
      let D = null, uTopW = 0, uN = 0, uC = 0;
      if (k && considered) {
        const U = grp(upper), Lw = grp(lower);
        if (U.m && Lw.m) D = U.c / U.m - Lw.c / Lw.m;
        uN = U.m; uC = U.c; uTopW = Math.max(0, ...Object.values(U.w));
      }
      let topW = null, topWn = 0; Object.keys(wrong).forEach(L => { if (wrong[L] > topWn) { topWn = wrong[L]; topW = L; } });
      const flags = [];
      if (considered >= 5) {
        if (p < 0.25) flags.push('hard'); else if (p > 0.9) flags.push('easy');
        if (D != null) { if (D < 0) flags.push('negD'); else if (D < 0.2 && p > 0.1 && p < 0.9) flags.push('lowD'); }
        // posible clave errónea: los mejores alumnos eligen una opción incorrecta más que la correcta
        const keyBad = k ? (uN >= 2 && uTopW > uC && uTopW / uN >= 0.5) : (topWn > correct && topWn / considered >= 0.5);
        if (keyBad) flags.push('key');
        if (cnt['-'] / considered > 0.4) flags.push('blank');
      }
      out.push({ i: m, keys: [...keys], considered, correct, p, D, cnt, topW, topWn, flags });
    }
    return out;
  }
  const flagText = { hard: 'flagHard', easy: 'flagEasy', lowD: 'flagLowD', negD: 'flagNegD', key: 'flagKey', blank: 'flagBlank' };
  const flagRed = (f) => f === 'negD' || f === 'key';

  /* ---------------------------------------------------------- cambios de estructura */
  async function setNq(n) {
    n = K.clamp(parseInt(n, 10) || exam.nq, 1, 100);
    if (n < exam.nq) {
      const lost = exam.students.some(s => s.answers.slice(n).some(Boolean)) || exam.versions.some(v => exam.keys[v].slice(n).some(Boolean));
      if (lost && !(await K.confirm(t('nqShrink')))) { renderView(); return; }
    }
    exam.nq = n; fix(exam); ui.cur = K.clamp(ui.cur, 0, n); changed(); renderView();
  }
  function setNopt(n) {
    if (n === exam.nopt) return;
    let cleared = 0;
    if (n === 4) {
      exam.versions.forEach(v => { exam.keys[v] = exam.keys[v].map(k => (k === 'E' ? (cleared++, '') : k)); });
      exam.students.forEach(s => { s.answers = s.answers.map(a => (a === 'E' ? (cleared++, '') : a)); });
    }
    exam.nopt = n; fix(exam); changed(); renderView();
    if (cleared) K.toast(t('optShrink', { n: cleared }), 3200);
  }
  async function setVersions(n) {
    const vs = VERS.slice(0, n);
    if (vs.length === exam.versions.length) return;
    if (vs.length < exam.versions.length && exam.students.some(s => !vs.includes(s.version))) {
      if (!(await K.confirm(t('verShrink')))) { renderView(); return; }
    }
    exam.versions = vs; exam.students.forEach(s => { if (!vs.includes(s.version)) s.version = 'A'; });
    fix(exam); if (!exam.versions.includes(ui.kv)) ui.kv = 'A'; changed(); renderView();
  }

  /* ---------------------------------------------------------- cadenas de respuestas */
  function parseAns(str) {
    const chars = [...String(str).toUpperCase().replace(/[\s,;|]+/g, '')];
    const valid = letters(); let invalid = 0;
    const arr = chars.map(ch => {
      if (valid.includes(ch)) return ch;
      if (/^[1-5]$/.test(ch) && +ch <= exam.nopt) return LET[+ch - 1];
      if (!'-._?*0X'.includes(ch)) invalid++;
      return '';
    });
    return { arr, invalid };
  }
  const ansString = (arr) => arr.map(a => a || '-').join('');

  /* ---------------------------------------------------------- cabecera y estado */
  function renderHead() {
    const rs = results(), st = stats(rs);
    $('#head').innerHTML = `
      <div>
        <h2>${esc(exam.name || t('untitled'))}</h2>
        <div class="meta">
          ${exam.campus && exam.campus.subjectTitle ? `<span class="chip accent">${CAMPUS ? '☁ ' : ''}${esc(exam.campus.subjectTitle)}</span>` : ''}
          <span class="chip">${exam.nq} ${t('qs')} · ${exam.nopt} ${t('opts')}</span>
          <span class="chip">${exam.students.length} ${t('studentsN')}</span>
          ${st ? `<span class="chip accent">${t('sMean')}: ${K.fmt(st.mean, 2)} / ${K.fmt(exam.scoring.maxGrade, 2)}</span>` : ''}
          <span class="chip" id="savechip"></span>${C.uiSync.chipHtml()}
          <span class="chip lock">${CAMPUS ? '☁' : '🔒'} ${t(CAMPUS ? 'privacyCampus' : 'privacy')}</span>
        </div>
      </div>
      <div class="exam-switch no-print">
        <button type="button" class="btn exam-pick" data-act="pick" aria-haspopup="dialog">⇄ ${t('pickChange')}</button>
      </div>`;
    renderStatus();
    $$('.tabs [data-tab="students"] .n').forEach(n => { n.textContent = exam.students.length || ''; });
    const filled = exam.versions.reduce((a, v) => a + exam.keys[v].filter(Boolean).length, 0), tot = exam.nq * exam.versions.length;
    $$('.tabs [data-tab="key"] .n').forEach(n => { n.textContent = `${filled}/${tot}`; });
  }
  function renderStatus() {
    const c = $('#savechip'); if (c) {
      c.className = 'chip' + (saveFailed ? ' warn' : ''); c.textContent = saveFailed ? '⚠ ' + t('saveFail').split('(')[0].trim() : (savedTime ? '✓ ' + t('savedAt') : '');
    }
    const b = $('#savewarn'); if (b) { b.hidden = !saveFailed; b.textContent = t('saveFail'); }
  }

  /* ---------------------------------------------------------- vistas */
  const seg = (act, items, cur, attr = 'data-v') => `<div class="seg" role="group">${items.map(([v, label]) => `<button type="button" data-act="${act}" ${attr}="${v}" aria-pressed="${String(v) === String(cur)}">${esc(label)}</button>`).join('')}</div>`;

  function viewExam() {
    const s = exam.scoring, pf = penFrac(), maxPts = exam.nq * s.correct;
    const sum = pf > 0 ? t('sumScoring', { c: K.fmt(s.correct, 2), p: K.fmt(pf * s.correct, 3), m: K.fmt(maxPts, 2), g: K.fmt(s.maxGrade, 2) }) : t('sumNoPen', { c: K.fmt(s.correct, 2), m: K.fmt(maxPts, 2), g: K.fmt(s.maxGrade, 2) });
    const list = examIndex();
    return `
    <div class="grid cols-2">
      <section class="panel stack">
        <h2>${t('examData')}</h2>
        <label class="field">${t('name')}<input type="text" data-f="name" value="${esc(exam.name)}" placeholder="${esc(t('untitled'))}"></label>
        <div class="grid cols-2">
          <label class="field">${t('date')}<input type="date" data-f="date" value="${esc(exam.date)}"></label>
          <label class="field">${t('nq')}<input type="number" data-f="nq" min="1" max="100" value="${exam.nq}"><small>${t('nqHelp')}</small></label>
        </div>
        <div class="field"><span style="font-weight:600">${t('nopt')}</span>${seg('nopt', [[4, t('optsAD')], [5, t('optsAE')]], exam.nopt)}</div>
        <div class="field"><span style="font-weight:600">${t('versions')}</span>${seg('nver', [[1, t('nver1')], [2, t('nver2')], [3, t('nver3')], [4, t('nver4')]], exam.versions.length)}<small>${t('versionsHelp')}</small></div>
      </section>
      <section class="panel stack">
        <h2>${t('scoring')}</h2>
        <div class="grid cols-2">
          <label class="field">${t('maxGrade')}<input type="number" step="any" min="0.01" data-f="maxGrade" value="${s.maxGrade}"></label>
          <label class="field">${t('pass')}<input type="number" step="any" min="0" data-f="pass" value="${s.pass}"></label>
        </div>
        <label class="field">${t('pointsCorrect')}<input type="number" step="any" min="0.01" data-f="correct" value="${s.correct}"></label>
        <div class="field"><span style="font-weight:600">${t('penalty')}</span>${seg('preset', [['none', t('penNone')], ['chance', t('penChance')], ['quarter', t('penQuarter')], ['custom', t('penCustom')]], s.preset)}
          ${s.preset === 'custom' ? `<label class="field" style="margin-top:6px">${t('penCustomValue')}<input type="number" step="any" min="0" data-f="penaltyCustom" value="${s.penaltyCustom}"></label>` : ''}
          <small>${t('penaltyNote')}</small></div>
        <div class="field"><span style="font-weight:600">${t('annulMode')}</span>${seg('annulMode', [['credit', t('annulCredit')], ['exclude', t('annulExclude')]], exam.annulMode)}</div>
        <label class="check"><input type="checkbox" data-f="weightsOn" ${exam.weightsOn ? 'checked' : ''}> ${t('weights')}</label>
        ${exam.weightsOn ? `<small class="muted">${t('weightsHelp')}</small>` : ''}
        <p class="disclaimer" id="scoresum">${sum}</p>
      </section>
    </div>
    ${C.uiCampus.listPanel()}
    <section class="panel stack">
      <div class="row spread"><h2 style="margin:0">${t('myExams')}</h2>
        <div class="row"><button class="btn ghost small" data-act="demo">${t('demo')}</button></div></div>
      <div class="grid cols-2">${list.map(e => `
        <div class="stat" ${e.id === exam.id ? 'data-act="gotop"' : `data-act="openExam" data-id="${e.id}"`} style="cursor:pointer;${e.id === exam.id ? 'border-color:var(--accent)' : ''}">
          <b style="font-size:1.15rem">${esc(e.name || t('untitled'))}</b>
          <span>${esc(K.fmtDate(e.date))} · ${t('examMeta', { q: e.nq, s: (e.students || []).length })}</span>
          <div class="row" style="margin-top:10px">
            ${e.id === exam.id ? `<span class="chip accent">${t('current')}</span>` : `<button class="btn ghost small" data-act="openExam" data-id="${e.id}">${t('open')}</button>`}
            <button class="btn ghost small" data-act="dupExam" data-id="${e.id}">${t('duplicate')}</button>
            <button class="btn danger small" data-act="delExam" data-id="${e.id}">${t('delete')}</button>
          </div>
        </div>`).join('')}</div>
    </section>
    ${CAMPUS ? '' : `<section class="panel stack">
      <h2>${t('backup')}</h2><p class="muted">${t('backupNote')}</p>
      <div class="row"><button class="btn small" data-act="exportBackup">${t('exportBackup')}</button><button class="btn ghost small" data-act="importBackup">${t('importBackup')}</button>
        <input type="file" id="bfile" accept="application/json,.json" hidden></div>
    </section>`}`;
  }

  function bubbleRow(cls, q, cur, keyL, showCorr) {
    return letters().map(L => {
      let c = 'bub';
      if (cur === L) { c += showCorr && keyL ? (L === keyL ? ' ok' : ' bad') : ' on'; }
      else if (showCorr && keyL && cur !== keyL && L === keyL) c += ' key';
      return `<button type="button" class="${c}" data-act="${cls}" data-q="${q}" data-o="${L}" aria-pressed="${cur === L}" aria-label="${esc(t('questionN', { n: q + 1 }))}: ${L}">${L}</button>`;
    }).join('');
  }

  /* ---------- generar una versión desordenando la A ---------- */
  function genVersion(v, shufQ, shufO) {
    const rnd = Math.random, ident = Array.from({ length: exam.nq }, (_, i) => i);
    const map = shufQ ? K.shuffle(ident.slice(), rnd) : ident.slice();
    const opts = [], key = [];
    map.forEach((m, i) => {
      const p = shufO ? K.shuffle(Array.from({ length: exam.nopt }, (_, j) => j), rnd) : Array.from({ length: exam.nopt }, (_, j) => j);   // p[letra nueva] = letra de la A
      opts.push(p); const kA = exam.keys.A[m]; key[i] = kA ? LET[p.indexOf(LET.indexOf(kA))] : '';
    });
    exam.maps[v] = map; exam.keys[v] = key; if (shufO) exam.opts[v] = opts; else delete exam.opts[v];
  }
  function genTableText(v) {
    const map = exam.maps[v] || [], o = exam.opts[v];
    const rows = map.map((m, i) => t('genRow', { v, n: i + 1, m: m + 1 }) + (o ? '   (' + o[i].map((a, j) => LET[j].toLowerCase() + '=' + LET[a]).join(' ') + ')' : ''));
    return rows.concat(['', t('genKeyLine', { v, k: ansString(exam.keys[v]) })]).join('\n');
  }
  function genPanel(v) {
    const moved = (exam.maps[v] || []).some((m, i) => m !== i) || !!exam.opts[v];
    return `<section class="panel stack"><h2 style="margin:0">${t('genTitle')}</h2><p class="muted" style="margin:0">${t('genHelp')}</p>
      <label class="check"><input type="checkbox" id="genq" checked> ${t('genQ')}</label>
      <label class="check"><input type="checkbox" id="geno" checked> ${t('genO')}</label>
      <div class="row"><button class="btn" data-act="kgen">${t('genBtn', { v })}</button></div>
      ${moved ? `<details class="stack" open><summary>${t('genTable', { v })}</summary><small class="muted">${t('genTableHelp', { v })}</small><pre style="white-space:pre-wrap;font-size:.85rem;max-height:320px;overflow:auto;margin:6px 0">${esc(genTableText(v))}</pre><div class="row"><button class="btn ghost small" data-act="kgentab">${t('genCopy')}</button></div></details>` : ''}
    </section>`;
  }
  function viewKey() {
    const v = ui.kv, key = exam.keys[v], an = exam.annul;
    const filled = key.filter(Boolean).length;
    return `
    <section class="panel stack">
      <div class="row spread"><h2 style="margin:0">${t('keyTitle')}</h2><span class="chip ${filled === exam.nq ? 'accent' : ''}" id="kfilled">${t('keyFilled', { n: filled, nq: exam.nq })}</span></div>
      ${exam.versions.length > 1 ? `<div class="field"><span style="font-weight:600">${t('keyVersion')}</span>${seg('vsel', exam.versions.map(x => [x, x]), v)}</div>` : ''}
      <div class="keybar">
        <label class="field">${t('keyPaste')}<input type="text" id="kstr" value="${esc(ansString(key))}" placeholder="${esc(t('keyPastePh'))}" autocomplete="off" spellcheck="false" style="font-family:monospace;letter-spacing:.06em"><small>${t('keyHint')}</small></label>
        <button class="btn" data-act="kapply">${t('apply')}</button>
      </div>
      <div class="fb" id="kfb" aria-live="polite"></div>
      <div class="row">
        <button class="btn ghost small" data-act="kcopy">${t('copyKey')}</button>
        <button class="btn danger small" data-act="kclear">${t('clearKey')}</button>
        ${exam.versions.length > 1 ? `<span class="row" style="gap:6px"><select id="kfrom" aria-label="${esc(t('copyFrom'))}">${exam.versions.filter(x => x !== v).map(x => `<option value="${x}">${t('copyFrom')}: ${x}</option>`).join('')}</select><button class="btn ghost small" data-act="kfrom">${t('copyFromBtn')}</button></span>` : ''}
      </div>
    </section>
    ${v !== 'A' ? `<section class="panel stack"><div class="keybar"><label class="field">${t('mapTitle')}<input type="text" id="kmap" value="${exam.maps[v].map(x => x + 1).join(' ')}" autocomplete="off" spellcheck="false" style="font-family:monospace"><small>${t('mapHelp')}</small></label>
      <div class="row"><button class="btn" data-act="kmap">${t('apply')}</button><button class="btn ghost" data-act="kmapreset">${t('mapReset')}</button></div></div><div class="fb" id="kmapfb" aria-live="polite"></div></section>` : ''}
    ${v !== 'A' ? genPanel(v) : ''}
    ${filled === 0 ? `<div class="empty">${t('keyNone')}</div>` : ''}
    <section class="panel"><div class="qgrid" id="kgrid">${key.map((k, q) => { const m = masterOf(v, q); return `
      <div class="qrow ${an[m] ? 'annulled' : ''}" data-q="${q}"><span class="qn">${q + 1}</span>${m !== q ? `<span class="chip" title="${esc(t('mapTitle'))}" style="padding:1px 7px;font-size:.72rem">=A${m + 1}</span>` : ''}${bubbleRow('kpick', q, k, null, false)}
        <span class="qx">${exam.weightsOn ? `<input class="w" type="number" step="any" min="0" data-f="w" data-q="${q}" value="${wOf(m)}" aria-label="${esc(t('weightQ'))} ${q + 1}">` : ''}
        <button type="button" class="annul-btn" data-act="kannul" data-q="${q}" aria-pressed="${!!an[m]}" title="${esc(t('annulQ'))}" aria-label="${esc(t('annulQ'))} ${q + 1}">⊘</button></span></div>`; }).join('')}</div></section>`;
  }

  const curStudent = () => exam.students.find(s => s.id === ui.sel) || null;
  const filtered = () => { const q = ui.filter.trim().toLowerCase(); return exam.students.filter(s => !q || (nm(s) + ' ' + s.code).toLowerCase().includes(q)); };
  const viewStudents = () => C.uiStudents.render(viewStudentsOld);

  const nm = (s) => R.display(s) || '';
  function viewStudentsOld() {
    return `
    <div class="stud-layout">
      <section class="panel stack">
        <div class="row spread"><h2 style="margin:0">${t('studentsTitle')} <span class="chip">${exam.students.length}</span></h2></div>
        <form class="row" data-form="addstudent" style="flex-wrap:nowrap"><input id="newname" type="text" class="grow" placeholder="${esc(t('addPh'))}" aria-label="${esc(t('addStudent'))}" autocomplete="off"><button class="btn small" type="submit">${t('add')}</button></form>
        <div class="row"><button class="btn ghost small" data-act="pastelist">${t('pasteList')}</button><button class="btn danger small" data-act="delall" ${exam.students.length ? '' : 'disabled'}>${t('deleteAll')}</button></div>
        ${exam.students.length > 7 ? `<input type="search" id="sfilter" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}" value="${esc(ui.filter)}">` : ''}
        <div id="slist" class="slist" role="listbox" aria-label="${esc(t('studentsTitle'))}"></div>
      </section>
      <section class="panel stack" id="editor"></section>
    </div>`;
  }

  function renderStudentList() {
    const box = $('#slist'); if (!box) return;
    const rs = new Map(results().map(x => [x.s.id, x.r]));
    const list = filtered();
    box.innerHTML = list.length ? list.map(s => {
      const r = rs.get(s.id), a = answered(s);
      return `<button type="button" class="sitem ${s.id === ui.sel ? 'sel' : ''}" role="option" aria-selected="${s.id === ui.sel}" data-act="selstud" data-id="${s.id}">
        <span class="sname">${esc(nm(s) || t('unnamed'))}${s.code ? ` <small class="muted">${esc(s.code)}</small>` : ''}</span>
        <span class="smeta">${exam.versions.length > 1 ? `<span class="pill">${s.version}</span>` : ''}<span>${t('answeredOf', { a, n: exam.nq })}</span>${a && r.grade != null ? `<span class="pill ${r.passed ? 'g-ok' : 'g-bad'}">${K.fmt(r.grade, 2)}</span>` : ''}</span></button>`;
    }).join('') : `<div class="empty">${t('noStudents')}</div>`;
  }

  function renderEditor() {
    const box = $('#editor'); if (!box) return;
    const s = curStudent();
    if (!s) { box.innerHTML = `<div class="empty">${exam.students.length ? t('selectStudent') : t('noStudents')}</div>`; return; }
    const key = exam.keys[s.version], r = score(s);
    box.innerHTML = `
      <div class="row spread">
        ${(s.last || s.first) ? `<div class="field grow" style="min-width:200px"><span style="font-weight:600">${t('studentName')}</span><b style="font-size:1.1rem">${esc(nm(s))}</b><small>${s.code ? t('colCode') + ': ' + esc(s.code) + ' · ' : ''}${t('editInTable')}</small></div>` : `<label class="field grow" style="min-width:200px">${t('studentName')}<input type="text" data-f="sname" value="${esc(s.name)}" placeholder="${esc(t('unnamed'))}"></label>`}
        ${exam.versions.length > 1 ? `<div class="field"><span style="font-weight:600">${t('studentVersion')}</span>${seg('sver', exam.versions.map(x => [x, x]), s.version)}</div>` : ''}
      </div>
      <div class="fastbox">
        <label class="field" for="fast">${t('fastEntry')} <small>${t('fastHelp')}</small></label>
        <input id="fast" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${esc(t('fastPh'))}">
        <div class="fastpos"><span id="fpos"></span><span><button class="btn ghost small" data-act="sprev">← ${t('prevStudent')}</button> <button class="btn ghost small" data-act="snext">${t('nextStudent')} →</button></span></div>
      </div>
      <div class="row"><label class="check"><input type="checkbox" data-f="showCorr" ${ui.showCorr ? 'checked' : ''}> ${t('showCorr')}</label>
        <label class="check"><input type="checkbox" data-f="autoNext" ${ui.autoNext ? 'checked' : ''}> ${t('autoNext')}</label></div>
      <div class="qgrid" id="agrid">${s.answers.map((a, q) => `
        <div class="qrow" data-q="${q}"><button type="button" class="qn" data-act="setcur" data-q="${q}" title="${esc(t('fastEntry'))}">${q + 1}</button>${bubbleRow('apick', q, a, key[q] || null, ui.showCorr)}</div>`).join('')}</div>
      <div class="keybar"><label class="field">${t('answerString')}<input type="text" id="astr" value="${esc(ansString(s.answers))}" autocomplete="off" spellcheck="false" style="font-family:monospace;letter-spacing:.06em"></label>
        <button class="btn" data-act="aapply">${t('apply')}</button></div>
      <div class="row spread"><div class="statline" id="sline"></div>
        <div class="row"><button class="btn ghost small" data-act="aclear">${t('clearAnswers')}</button><button class="btn danger small" data-act="sremove">${t('removeStudent')}</button></div></div>`;
    updateLine(); updateCursor();
  }
  function updateLine() {
    const s = curStudent(), el = $('#sline'); if (!s || !el) return;
    const r = score(s);
    el.innerHTML = `<span>${t('lineStats', { c: r.c, w: r.w, b: r.b })}</span>${r.grade != null ? `<span class="big ${r.passed ? 'badge-ok' : 'badge-bad'}">${K.fmt(r.grade, 2)}</span>` : `<span class="chip warn">${t('noGrade')}</span>`}`;
  }
  function updateCursor() {
    const s = curStudent(); if (!s) return;
    $$('#agrid .qrow').forEach(r => r.classList.toggle('cur', +r.dataset.q === ui.cur));
    const f = $('#fpos'); if (f) f.innerHTML = ui.cur >= exam.nq ? esc(t('fastDone')) : `${t('fastPos', { q: `<b>${ui.cur + 1}</b>`, n: exam.nq })}`;
    const row = $(`#agrid .qrow[data-q="${ui.cur}"]`); if (row) row.scrollIntoView({ block: 'nearest' });
  }
  function refreshAnsRow(q) {
    const s = curStudent(), row = $(`#agrid .qrow[data-q="${q}"]`); if (!s || !row) return;
    const btns = row.querySelectorAll('.bub'); const tmp = document.createElement('div');
    tmp.innerHTML = bubbleRow('apick', q, s.answers[q], exam.keys[s.version][q] || null, ui.showCorr);
    btns.forEach((b, i) => { b.className = tmp.children[i].className; b.setAttribute('aria-pressed', tmp.children[i].getAttribute('aria-pressed')); });
    const as = $('#astr'); if (as) as.value = ansString(s.answers);
    updateLine(); renderStudentList();
  }

  function sortedResults(rs) {
    const { sortK: k, sortDir: d } = ui;
    const val = { name: x => R.fold(x.s.last || x.s.name), last: x => R.fold(x.s.last || x.s.name), first: x => R.fold(x.s.first), code: x => x.s.code || '~', group: x => R.fold(x.s.group), ver: x => x.s.version, c: x => x.r.c, w: x => x.r.w, b: x => x.r.b, raw: x => x.r.raw, grade: x => (x.r.grade == null ? -1 : x.r.grade), res: x => (x.r.grade == null ? -1 : x.r.passed ? 1 : 0) }[k] || (x => nm(x.s));
    return rs.slice().sort((a, b) => { const A = val(a), B = val(b); return (A < B ? -1 : A > B ? 1 : nm(a.s).localeCompare(nm(b.s))) * d; });
  }
  const th = (k, label, cls = '') => `<th class="${cls}" ${ui.sortK === k ? `aria-sort="${ui.sortDir === 1 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-act="sort" data-k="${k}">${esc(label)}</button></th>`;

  const hasSplit = (rs) => rs.some(x => x.s.last || x.s.first);
  function viewResults() {
    const rs = results();
    if (!rs.length) return `<div class="empty">${t('noResults')}</div>`;
    const st = stats(rs), items = itemAnalysis(rs), unsc = rs[0].r.unscored;
    const mg = exam.scoring.maxGrade, passPos = K.clamp(exam.scoring.pass / mg, 0, 1) * 100;
    const maxBin = st ? Math.max(1, ...st.bins) : 1;
    const flagged = items.filter(x => x.flags.length);
    return `
    ${unsc ? `<div class="banner-warn">${t('unscored', { n: unsc })}</div>` : ''}
    <section class="panel stack">
      <div class="row spread"><h2 style="margin:0">${t('resultsTitle')}</h2>
        <div class="row"><button class="btn small" data-act="csv">${t('exportCsv')}</button><button class="btn ghost small" data-act="copytable">${t('copyTable')}</button></div></div>
      <div class="table-wrap"><table class="kit"><thead><tr>${hasSplit(rs) ? th('last', t('colLast')) + th('first', t('colFirst')) : th('name', t('colName'))}${rs.some(x => x.s.code) ? th('code', t('colCode')) : ''}${rs.some(x => x.s.group) ? th('group', t('colGroup')) : ''}${exam.versions.length > 1 ? th('ver', t('colVersion')) : ''}${th('c', t('colCorrect'), 'num')}${th('w', t('colWrong'), 'num')}${th('b', t('colBlank'), 'num')}${th('raw', t('colPoints'), 'num')}${th('grade', t('colGrade'), 'num')}${th('res', t('colResult'))}<th></th></tr></thead>
      <tbody>${sortedResults(rs).map(({ s, r }) => `<tr class="${r.grade == null ? '' : r.passed ? 'passed' : 'failed'}">${hasSplit(rs) ? `<td>${esc(s.last || (s.first ? '' : s.name) || t('unnamed'))}</td><td>${esc(s.first)}</td>` : `<td>${esc(s.name || t('unnamed'))}</td>`}${rs.some(x => x.s.code) ? `<td class="mono">${esc(s.code)}</td>` : ''}${rs.some(x => x.s.group) ? `<td>${esc(s.group)}</td>` : ''}${exam.versions.length > 1 ? `<td>${s.version}</td>` : ''}<td class="num">${r.c}</td><td class="num">${r.w}</td><td class="num">${r.b}</td><td class="num">${K.fmt(r.raw, 2)}</td><td class="num"><b>${r.grade == null ? '—' : K.fmt(r.grade, 2)}</b></td>
        <td>${r.grade == null ? `<span class="tag-nogr">${t('noGrade')}</span>` : r.passed ? `<span class="tag-pass">${t('passed')}</span>` : `<span class="tag-fail">${t('failed')}</span>`}</td>
        <td><button class="btn ghost small" data-act="repstud" data-id="${s.id}">${t('report')}</button></td></tr>`).join('')}</tbody></table></div>
    </section>
    ${st ? `<section class="panel stack"><h2 style="margin:0">${t('statsTitle')}</h2>
      <div class="stats-grid">
        <div class="stat"><b>${st.n}</b><span>${t('sN')}</span></div><div class="stat"><b>${K.fmt(st.mean, 2)}</b><span>${t('sMean')}</span></div>
        <div class="stat"><b>${K.fmt(st.median, 2)}</b><span>${t('sMedian')}</span></div><div class="stat"><b>${K.fmt(st.sd, 2)}</b><span>${t('sSd')}</span></div>
        <div class="stat"><b>${K.fmt(st.max, 2)}</b><span>${t('sMax')}</span></div><div class="stat"><b>${K.fmt(st.min, 2)}</b><span>${t('sMin')}</span></div>
        <div class="stat ${st.passPct >= 50 ? 'ok' : 'bad'}"><b>${K.fmt(st.passPct, 0)} %</b><span>${t('sPass')}</span></div></div>
      <h3 style="margin:8px 0 0">${t('histo')}</h3>
      <div class="histo" role="img" aria-label="${esc(t('histo'))}">
        <div class="passline" style="left:${passPos}%"><span>${esc(t('histoPass', { n: K.fmt(exam.scoring.pass, 2) }))}</span></div>
        ${st.bins.map((n, i) => `<div class="col"><span class="cnt">${n || ''}</span><div class="bar ${(i + 1) / 10 * mg <= exam.scoring.pass ? 'low' : ''}" style="height:${n / maxBin * 78}%"></div></div>`).join('')}</div>
      <div class="histo-axis">${st.bins.map((_, i) => `<span>${K.fmt(i * mg / 10, 1)}–${K.fmt((i + 1) * mg / 10, 1)}</span>`).join('')}</div></section>` : ''}
    <section class="panel stack"><div class="row spread"><h2 style="margin:0">${t('items')}</h2>
      <div class="seg" role="group"><button type="button" data-act="onlyflags" data-v="0" aria-pressed="${!ui.onlyFlags}">${t('allQuestions')}</button><button type="button" data-act="onlyflags" data-v="1" aria-pressed="${ui.onlyFlags}">${t('onlyProblems')}${flagged.length ? ` (${flagged.length})` : ''}</button></div></div>
      <p class="muted" style="font-size:.92rem;margin:0">${t('itemsHelp')}</p>
      ${rs.length < 5 ? `<div class="banner-warn">${t('needMore')}</div>` : flagged.length ? `<div class="fb bad">${t('problems', { list: flagged.map(x => x.i + 1).join(', ') })}</div>` : `<div class="fb good">${t('noProblems')}</div>`}
      <div class="items">${items.filter(x => !ui.onlyFlags || x.flags.length).map(x => itemRow(x)).join('')}</div>
    </section>`;
  }
  function itemRow(x) {
    const maxC = Math.max(1, ...Object.values(x.cnt));
    const single = x.keys.length === 1 ? x.keys[0] : null;
    return `<div class="itm ${x.flags.length ? 'flag' : ''}"><span class="qn">${x.i + 1}</span>
      <span class="kc" title="${esc(t('theKey'))}">${x.keys.length ? (single || t('keysMany')) : '—'}</span>
      <div class="pbar" title="${esc(t('difficulty'))}"><i style="width:${x.p == null ? 0 : x.p * 100}%"></i><b>${x.p == null ? '—' : K.fmt(x.p * 100, 0) + ' %'}</b></div>
      <span title="${esc(t('discrimination'))}" class="${x.D != null && x.D < 0 ? 'badge-bad' : ''}">${x.D == null ? '—' : (x.D > 0 ? '+' : '') + K.fmt(x.D, 2)}</span>
      <div class="dist" title="${esc(t('distribution'))}">${Object.keys(x.cnt).map(L => `<span class="${L === single ? 'k' : ''}"><i style="height:${x.cnt[L] / maxC * 100}%"></i>${L}</span>`).join('')}</div>
      <div class="flags">${x.flags.length ? x.flags.map(f => `<span class="flag-chip ${flagRed(f) ? 'red' : ''}">${t(flagText[f])}</span>`).join('') : `<span class="ok-chip">${x.considered >= 5 ? t('itemsOk') : ''}</span>`}</div></div>`;
  }

  function viewPrint() {
    const o = ui.sheet;
    const chk = (f, label) => `<label class="check"><input type="checkbox" data-f="sh_${f}" ${o[f] ? 'checked' : ''}> ${t(label)}</label>`;
    return `
    <div class="print-cards">
      <section class="panel stack"><h2>${t('sheetTitle')}</h2><p class="muted">${t('sheetMoved')}</p><div class="row"><button class="btn" data-tab="sheet">${t('tab_sheet')}</button></div></section>
      <section class="panel stack"><h2>${t('classReport')}</h2><p class="muted">${t('classReportHelp')}</p>
        <div class="row"><button class="btn" data-act="pv-class" ${exam.students.length ? '' : 'disabled'}>${t('preview')}</button><button class="btn ghost" data-act="pr-class" ${exam.students.length ? '' : 'disabled'}>${t('printBtn')}</button></div></section>
      <section class="panel stack"><h2>${t('studentReports')}</h2><p class="muted">${t('studentReportsHelp')}</p>
        <div class="row"><button class="btn" data-act="pv-students" ${exam.students.length ? '' : 'disabled'}>${t('preview')}</button><button class="btn ghost" data-act="pr-students" ${exam.students.length ? '' : 'disabled'}>${t('printBtn')}</button></div>
        ${exam.students.length ? '' : `<small>${t('noStudentsPrint')}</small>`}</section>
      <section class="panel stack"><h2>CSV</h2><div class="row"><button class="btn" data-act="csv" ${exam.students.length ? '' : 'disabled'}>${t('exportCsv')}</button><button class="btn ghost" data-act="copytable" ${exam.students.length ? '' : 'disabled'}>${t('copyTable')}</button></div></section>
    </div>`;
  }

  /* ---------------------------------------------------------- documentos imprimibles */
  const nf = (n, d = 2) => K.fmt(n, d);
  function docSheet() {
    const o = ui.sheet, L = letters();
    const cols = o.cols || (exam.nq <= 28 ? 1 : exam.nq <= 56 ? 2 : exam.nq <= 84 ? 3 : 4);
    const rh = Math.min(11, Math.max(7.2, 185 / Math.ceil(exam.nq / cols))), bs = Math.min(6.6, 5.3 * rh / 7.2);
    const rows = Array.from({ length: exam.nq }, (_, i) => `<div class="pq"><span class="pn">${i + 1}</span>${L.map(l => `<span class="pb">${l}</span>`).join('')}</div>`).join('');
    return `<div class="page">
      <div class="sh-head"><div><h1>${esc(exam.name || t('untitled'))}</h1><div class="sub">${esc(K.fmtDate(exam.date))} · ${exam.nq} ${t('qs')}</div></div>
        ${o.grade ? `<div class="sh-grade">${t('sheetGrade')}</div>` : '<span></span>'}</div>
      <div class="sh-fields">${o.name ? `<div class="sh-field">${t('sheetName')}<i></i></div>` : '<span></span>'}${o.group ? `<div class="sh-field">${t('sheetGroup')}<i></i></div>` : '<span></span>'}
        ${o.date ? `<div class="sh-field">${t('sheetDate')}<i></i></div>` : '<span></span>'}
        ${o.version && exam.versions.length > 1 ? `<div class="sh-ver">${t('sheetVersion')} ${exam.versions.map(v => `<span class="pb">${v}</span>`).join('')}</div>` : '<span></span>'}</div>
      ${o.instr ? `<div class="sh-instr">${t('sheetInstr')}</div>` : ''}
      <div class="sh-cols" style="column-count:${cols};--rh:${rh.toFixed(2)}mm;--bs:${bs.toFixed(2)}mm">${rows}</div>
      <div class="foot"><span>${t('generatedBy')}</span><span></span></div></div>`;
  }
  function pageStudent(s, r, st) {
    const key = exam.keys[s.version], mark = { c: ['✓', 'm-ok'], a: ['✓', 'm-ok'], w: ['✗', 'm-bad'], b: ['–', 'm-blank'], n: ['·', 'm-blank'], x: ['·', 'm-blank'] };
    const rows = r.per.map((p, i) => `<tr><td class="c">${i + 1}</td><td class="c">${esc(s.answers[i] || '–')}</td><td class="c">${esc(key[i] || '–')}</td><td class="c ${mark[p][1]}">${mark[p][0]}${p === 'a' ? ' ' + t('annulledTag') : p === 'x' ? ' ' + t('annulledTag') : p === 'n' ? ' ' + t('unscoredTag') : ''}</td></tr>`).join('');
    const half = Math.ceil(exam.nq / 2), thead = `<thead><tr><th class="c">#</th><th class="c">${t('answer')}</th><th class="c">${t('theKey')}</th><th class="c">${t('rightWrong')}</th></tr></thead>`;
    const body = rows.split('</tr>').filter(Boolean).map(x => x + '</tr>');
    return `<div class="page"><div class="sub">${esc(exam.name || t('untitled'))} · ${esc(K.fmtDate(exam.date))}${exam.versions.length > 1 ? ` · ${t('sheetVersion')} ${s.version}` : ''}</div>
      <h1>${esc(nm(s) || t('unnamed'))}</h1>${s.code || s.group ? `<div class="sub">${[s.group, s.code ? t('colCode') + ' ' + s.code : ''].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
      <div class="rp-grade"><b>${r.grade == null ? '—' : nf(r.grade)}</b><span>/ ${nf(exam.scoring.maxGrade)}</span>${r.grade == null ? '' : `<span class="rp-tag">${r.passed ? t('passed') : t('failed')}</span>`}</div>
      <div class="rp-stats"><span>${t('colCorrect')}: <b>${r.c}</b></span><span>${t('colWrong')}: <b>${r.w}</b></span><span>${t('colBlank')}: <b>${r.b}</b></span><span>${t('pointsOf', { r: nf(r.raw), m: nf(r.max) })}</span>${st ? `<span>${t('classMean')}: <b>${nf(st.mean)}</b></span>` : ''}</div>
      <div class="rp-cols"><table class="rt">${thead}<tbody>${body.slice(0, half).join('')}</tbody></table>
        <table class="rt">${thead}<tbody>${body.slice(half).join('')}</tbody></table></div>
      <div class="foot"><span>${t('generatedBy')}</span><span></span></div></div>`;
  }
  function docStudents(list) { const rs = results(), st = stats(rs), map = new Map(rs.map(x => [x.s.id, x.r])); return (list || exam.students).map(s => pageStudent(s, map.get(s.id), st)).join(''); }
  function docClass() {
    const rs = results(), st = stats(rs), items = itemAnalysis(rs), mg = exam.scoring.maxGrade; if (!st) return '';
    const maxBin = Math.max(1, ...st.bins), flagged = items.filter(x => x.flags.length);
    const sorted = sortedResults(rs);
    return `<div class="page"><div class="sub">${esc(K.fmtDate(exam.date))}</div><h1>${esc(exam.name || t('untitled'))}</h1>
      <div class="rp-sum"><div><b>${st.n}</b><span>${t('sN')}</span></div><div><b>${nf(st.mean)}</b><span>${t('sMean')}</span></div><div><b>${nf(st.median)}</b><span>${t('sMedian')}</span></div><div><b>${nf(st.passPct, 0)} %</b><span>${t('sPass')}</span></div>
        <div><b>${nf(st.sd)}</b><span>${t('sSd')}</span></div><div><b>${nf(st.max)}</b><span>${t('sMax')}</span></div><div><b>${nf(st.min)}</b><span>${t('sMin')}</span></div><div><b>${nf(exam.scoring.pass)}</b><span>${t('pass')}</span></div></div>
      <h3>${t('histo')}</h3><div class="rp-histo">${st.bins.map((n, i) => `<div>${n || ''}<i class="${(i + 1) / 10 * mg <= exam.scoring.pass ? 'low' : ''}" style="height:${n / maxBin * 80}%"></i></div>`).join('')}</div>
      <div class="rp-axis">${st.bins.map((_, i) => `<span>${nf(i * mg / 10, 1)}–${nf((i + 1) * mg / 10, 1)}</span>`).join('')}</div>
      <h3>${t('resultsTitle')}</h3>
      <table class="rt"><thead><tr><th>${t('colName')}</th>${exam.versions.length > 1 ? `<th class="c">${t('colVersion')}</th>` : ''}<th class="r">${t('colCorrect')}</th><th class="r">${t('colWrong')}</th><th class="r">${t('colBlank')}</th><th class="r">${t('colGrade')}</th><th>${t('colResult')}</th></tr></thead>
      <tbody>${sorted.map(({ s, r }) => `<tr><td>${esc(nm(s) || t('unnamed'))}</td>${exam.versions.length > 1 ? `<td class="c">${s.version}</td>` : ''}<td class="r">${r.c}</td><td class="r">${r.w}</td><td class="r">${r.b}</td><td class="r"><b>${r.grade == null ? '—' : nf(r.grade)}</b></td><td>${r.grade == null ? '—' : r.passed ? t('passed') : t('failed')}</td></tr>`).join('')}</tbody></table>
      <div class="foot"><span>${t('generatedBy')}</span><span></span></div></div>
    <div class="page"><h2>${t('items')}</h2><div class="sub">${t('itemsHelp')}</div>
      ${rs.length < 5 ? `<p>${t('needMore')}</p>` : ''}
      <table class="rt" style="margin-top:3mm"><thead><tr><th class="c">${t('colQ')}</th><th class="c">${t('theKey')}</th><th class="r">${t('difficulty')}</th><th class="r">${t('discrimination')}</th><th>${t('distribution')}</th><th></th></tr></thead>
      <tbody>${items.map(x => `<tr><td class="c">${x.i + 1}</td><td class="c">${x.keys.length === 1 ? x.keys[0] : x.keys.length ? t('keysMany') : '—'}</td><td class="r">${x.p == null ? '—' : nf(x.p * 100, 0) + ' %'}</td><td class="r">${x.D == null ? '—' : (x.D > 0 ? '+' : '') + nf(x.D)}</td><td>${Object.keys(x.cnt).map(L => `${L}: ${x.cnt[L]}`).join(' · ')}</td><td>${x.flags.map(f => t(flagText[f])).join('; ')}</td></tr>`).join('')}</tbody></table>
      ${flagged.length ? `<p><b>${t('problems', { list: flagged.map(x => x.i + 1).join(', ') })}</b></p>` : ''}
      <div class="foot"><span>${t('generatedBy')}</span><span></span></div></div>`;
  }
  const docFor = (kind, id) => ({ class: docClass, students: () => docStudents(), student: () => docStudents(exam.students.filter(s => s.id === id)) }[kind] || (() => C.docs[kind](exam, id)))();

  function openPreview(kind, id) {
    const html = docFor(kind, id); if (!html) return;
    const d = document.createElement('dialog'); d.className = 'kit-dialog preview';
    d.innerHTML = `<div class="pv-bar"><h2>${t('previewOf')}</h2><div class="row"><button class="btn small" data-x="print">${t('printBtn')}</button><button class="btn ghost small" data-x="close">${t('close')}</button></div></div><div class="pv-body"><div class="pv printdoc">${html}</div></div>`;
    d.addEventListener('click', e => { const x = e.target.dataset && e.target.dataset.x; if (x === 'close') d.close(); if (x === 'print') doPrint(html); if (e.target === d) d.close(); });
    d.addEventListener('close', () => d.remove());
    document.body.append(d); d.showModal();
    const body = $('.pv-body', d), z = Math.min(1, (body.clientWidth - 32) / (210 * 3.7795)); $('.pv', d).style.setProperty('--z', z.toFixed(3));
  }
  function doPrint(html) {
    const root = $('#print-root'); root.innerHTML = `<div class="printdoc">${html}</div>`; document.body.dataset.print = '1';
    setTimeout(() => window.print(), 60);
  }
  window.addEventListener('afterprint', () => { delete document.body.dataset.print; $('#print-root').innerHTML = ''; });

  /* ---------------------------------------------------------- CSV, copiar, copia de seguridad */
  function tableRows() {
    const head = [t('colLast'), t('colFirst'), t('colCode'), t('colGroup'), t('colVersion'), t('colCorrect'), t('colWrong'), t('colBlank'), t('colPoints'), t('colGrade'), t('colResult'), t('csvAnswers')];
    const rows = sortedResults(results()).map(({ s, r }) => [s.last || (s.first ? '' : s.name), s.first || '', s.code || '', s.group || '', s.version, r.c, r.w, r.b, nf(r.raw), r.grade == null ? '' : nf(r.grade), r.grade == null ? '' : r.passed ? t('passed') : t('failed'), ansString(s.answers)]);
    return [head, ...rows];
  }
  const fileName = (ext) => (exam.name || 'examen').toLowerCase().replace(/[^a-z0-9áéíóúüñç]+/gi, '-').replace(/^-+|-+$/g, '') + '.' + ext;
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (__) { /* nada */ } ta.remove(); return ok;
    }
  }
  function exportBackup() {
    persist();
    const data = C.sync.buildPackage(C.sync.readLocal(), {}); store.set('lastExport', Date.now());
    K.download('corrector-copia-' + today() + '.json', JSON.stringify(data, null, 1), 'application/json');
  }
  async function importBackup(file) {
    try { const data = JSON.parse(await K.readFile(file)); if (C.sync.validatePackage(data)) throw new Error('bad'); persist(); C.uiSync.mergePackages([data], { source: file.name }); }
    catch (_) { K.toast(t('backupBad'), 3000); }
  }

  /* ---------------------------------------------------------- ejemplo */
  function demoExam() {
    const rnd = K.mulberry(2026), e = newExam(t('demoName'));
    e.nq = 20; e.nopt = 4; e.versions = ['A', 'B']; e.scoring.preset = 'chance';
    const pick = () => LET[Math.floor(rnd() * 4)];
    const keyA = Array.from({ length: 20 }, pick);
    const perm = K.shuffle([...Array(20).keys()], rnd);
    const keyB = perm.map(i => keyA[i]);
    const ease = Array.from({ length: 20 }, () => (rnd() - 0.4) * 3);
    ease[4] = 2.6; ease[8] = -3; ease[13] = 6;
    const storedA = keyA.slice(), storedB = keyB.slice();
    const bad = LET.filter(l => l !== keyA[4])[0]; storedA[4] = bad; storedB.forEach((k, i) => { if (perm[i] === 4) storedB[i] = bad; });
    e.keys = { A: storedA, B: storedB }; e.annul = []; e.maps = { A: Array.from({ length: 20 }, (_, i) => i), B: perm };
    e.students = Array.from({ length: 16 }, (_, i) => {
      const th = 0.18 + 0.78 * (i / 15) + (rnd() - 0.5) * 0.1, ver = i % 2 ? 'B' : 'A', tk = ver === 'A' ? keyA : keyB;
      const answers = tk.map((k, q) => {
        const qi = ver === 'A' ? q : perm[q];
        const p = 1 / (1 + Math.exp(-(6 * (th - 0.5) + ease[qi])));
        if (rnd() < p) return k;
        if (rnd() < 0.05) return '';
        const w = LET.filter(l => l !== k); return w[Math.floor(rnd() * 3)];
      });
      return { id: K.uid(), name: t('demoStudent', { n: i + 1 }), version: ver, answers };
    });
    { const cs = R.genCodes(e.students.length, { L: 4 }); e.students.forEach((s, i) => { s.code = cs[i]; }); }
    return fix(e);
  }

  /* ---------------------------------------------------------- render general */
  /* paso siguiente del flujo: examen → clave → alumnado → hoja → escanear → resultados */
  const FLOW = ['exam', 'key', 'students', 'sheet', 'scan', 'results'];
  function nextBtn() {
    const i = FLOW.indexOf(ui.tab); if (i < 0 || i === FLOW.length - 1) return '';
    const nx = FLOW[i + 1]; if (!TABS.includes(nx)) return '';
    return `<div class="row next-step no-print"><button type="button" class="btn" data-tab="${nx}">${t('nextStep', { n: t('tab_' + nx) })}</button></div>`;
  }
  function renderView() {
    if (ui.tab !== 'scan') C.uiScan.stopLive();
    if (ui.tab === 'campus' && !(exam && exam.campus)) ui.tab = 'exam';
    const v = $('#view'), f = { exam: viewExam, key: viewKey, students: viewStudents, sheet: C.uiSheet.render, scan: C.uiScan.render, results: viewResults, print: viewPrint, sync: C.uiSync.render, campus: () => C.uiCampus.render() }[ui.tab];
    v.innerHTML = f() + (ui.tab === 'scan' ? '' : nextBtn());
    if (ui.tab === 'students' && C.uiStudents.ui2.stab === 'answers') { renderStudentList(); renderEditor(); }
    if (ui.tab === 'scan') C.uiScan.mount();
    if (ui.tab === 'sync') C.uiSync.mount();
    if (ui.tab === 'campus') C.uiCampus.mount();
    if (ui.tab === 'exam') C.uiCampus.mountList();
    renderHead();
    $$('.tabs [role="tab"]').forEach(b => { const on = b.dataset.tab === ui.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  }
  function renderShell() {
    document.title = t('title') + ' · Luis Franco Serrano';
    $('#app').innerHTML = `
      <div class="banner-warn" id="savewarn" hidden></div>
      <details class="panel help"><summary>${t('helpTitle')}</summary><ol><li>${t('help1')}</li><li>${t('help2')}</li><li>${t('help3')}</li><li>${t('help4')}</li><li>${t('help5')}</li></ol></details>
      <div class="panel corr-head" id="head"></div>
      <div class="tabs" role="tablist">${TABS.filter(x => x !== 'campus' || (exam && exam.campus)).map(x => `<button type="button" role="tab" data-tab="${x}" aria-selected="false">${t('tab_' + x)}<span class="n"></span></button>`).join('')}</div>
      <div id="view" role="tabpanel"></div>`;
    renderView();
    C.uiCampus.followExam();
    C.uiPicker.touch(exam);
  }

  /* ---------------------------------------------------------- eventos */
  const app = $('#app');
  app.addEventListener('click', async (ev) => {
    const tab = ev.target.closest('[data-tab]'); if (tab) { ui.tab = tab.dataset.tab; renderView(); save(); if (tab.classList.contains('btn')) window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, q = b.dataset.q !== undefined ? +b.dataset.q : null, id = b.dataset.id, v = b.dataset.v;
    switch (act) {
      case 'nopt': setNopt(+b.dataset.v); break;
      case 'nver': setVersions(+b.dataset.v); break;
      case 'preset': exam.scoring.preset = v; changed(); renderView(); break;
      case 'annulMode': exam.annulMode = v; changed(); renderView(); break;
      case 'cols': ui.sheet.cols = +v; save(); renderView(); break;
      case 'pick': C.uiPicker.open(); break;
      case 'newExam': {
        if (isBlank(exam)) { ui.tab = 'exam'; renderView(); window.scrollTo({ top: 0, behavior: 'smooth' }); K.toast(t('blankKept'), 3200); const nm = $('[data-f="name"]'); if (nm) nm.focus(); break; }
        persist(); exam = newExam(); persist(); ui.kv = 'A'; ui.sel = null; ui.tab = 'exam'; renderView(); announceOpen();
        const nm = $('[data-f="name"]'); if (nm) nm.focus({ preventScroll: true }); break;
      }
      case 'gotop': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
      case 'demo': if (!dropIfBlank()) persist(); exam = demoExam(); persist(); ui.kv = 'A'; ui.sel = exam.students[0].id; ui.tab = 'results'; renderView(); break;
      case 'openExam': if (openExam(id)) { renderView(); announceOpen(); } break;
      case 'dupExam': { persist(); const src = store.get('exam:' + id); if (!src) break; const c = fix(JSON.parse(JSON.stringify(src))); c.id = K.uid(); c.name = t('copyOf', { name: c.name || t('untitled') }); c.students.forEach(s => { s.id = K.uid(); }); store.set('exam:' + c.id, c); const idx = store.get('index', []); idx.push(c.id); store.set('index', idx); renderView(); break; }
      case 'delExam': {
        const e = store.get('exam:' + id); if (!e) break;
        if (!(await K.confirm(t('confirmDelExam', { name: e.name || t('untitled'), n: (e.students || []).length }), { danger: true, okText: t('delete') }))) break;
        store.remove('exam:' + id); store.set('index', store.get('index', []).filter(x => x !== id));
        if (id === exam.id) { const rest = examIndex(); exam = rest[0] ? fix(rest[0]) : newExam(); persist(); ui.kv = exam.versions[0]; ui.sel = null; }
        renderView(); break;
      }
      case 'exportBackup': exportBackup(); break;
      case 'importBackup': $('#bfile').click(); break;
      /* clave */
      case 'vsel': ui.kv = v; renderView(); break;
      case 'kpick': {
        const key = exam.keys[ui.kv], o = b.dataset.o; key[q] = key[q] === o ? '' : o;
        const row = b.closest('.qrow'); row.querySelectorAll('.bub').forEach(x => { const on = key[q] === x.dataset.o; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
        $('#kstr').value = ansString(key); $('#kfilled').textContent = t('keyFilled', { n: key.filter(Boolean).length, nq: exam.nq }); changed(); break;
      }
      case 'kannul': { const m = masterOf(ui.kv, q), an = exam.annul; an[m] = !an[m]; b.setAttribute('aria-pressed', String(an[m])); b.closest('.qrow').classList.toggle('annulled', an[m]); changed(); break; }
      case 'kapply': {
        const { arr, invalid } = parseAns($('#kstr').value), len = arr.length;
        exam.keys[ui.kv] = fit(arr, exam.nq, ''); const filled = exam.keys[ui.kv].filter(Boolean).length;
        changed(); renderView(); const fb = $('#kfb');
        fb.className = 'fb ' + (invalid || len !== exam.nq ? 'bad' : 'good');
        fb.textContent = [t('keyRead', { n: Math.min(len, exam.nq), b: exam.nq - filled }), len !== exam.nq ? t('keyAdjust', { len, nq: exam.nq }) : '', invalid ? t('keyInvalid', { n: invalid }) : ''].filter(Boolean).join(' '); break;
      }
      case 'kcopy': K.toast((await copyText(ansString(exam.keys[ui.kv]))) ? t('keyCopied') : t('error')); break;
      case 'kclear': if (await K.confirm(t('clearKeyQ', { v: ui.kv }), { danger: true, okText: t('delete') })) { exam.keys[ui.kv] = fit([], exam.nq, ''); changed(); renderView(); } break;
      case 'kmap': {
        const nums = $('#kmap').value.split(/[\s,;.\-]+/).filter(Boolean).map(x => parseInt(x, 10) - 1), ok = nums.length === exam.nq && new Set(nums).size === exam.nq && nums.every(x => x >= 0 && x < exam.nq);
        const fb = $('#kmapfb'); if (!ok) { fb.className = 'fb bad'; fb.textContent = t('mapBad', { n: exam.nq }); break; }
        exam.maps[ui.kv] = nums; delete exam.opts[ui.kv]; changed(); renderView(); { const f2 = $('#kmapfb'); f2.className = 'fb good'; f2.textContent = t('mapOk'); } break;
      }
      case 'kmapreset': exam.maps[ui.kv] = Array.from({ length: exam.nq }, (_, i) => i); delete exam.opts[ui.kv]; changed(); renderView(); break;
      case 'kgen': {
        const q = $('#genq').checked, o = $('#geno').checked;
        if (!q && !o) { K.toast(t('genNone')); break; }
        if (!exam.keys.A.some(Boolean)) { K.toast(t('genNeedA')); break; }
        if (exam.keys[ui.kv].some(Boolean) && !(await K.confirm(t('genOverwrite', { v: ui.kv })))) break;
        genVersion(ui.kv, q, o); changed(); renderView(); K.toast(t('genDone', { v: ui.kv }), 3000); break;
      }
      case 'kgentab': K.toast((await copyText(genTableText(ui.kv))) ? t('keyCopied') : t('error')); break;
      case 'kfrom': { const from = $('#kfrom').value; exam.keys[ui.kv] = exam.keys[from].slice(); changed(); renderView(); break; }
      /* alumnado */
      case 'selstud': ui.sel = id; ui.cur = 0; renderStudentList(); renderEditor(); { const f = $('#fast'); if (f && matchMedia('(hover:hover)').matches) f.focus(); } break;
      case 'sver': { const s = curStudent(); if (s) { s.version = v; changed(); renderEditor(); renderStudentList(); } break; }
      case 'apick': { const s = curStudent(), o = b.dataset.o; if (!s) break; s.answers[q] = s.answers[q] === o ? '' : o; ui.cur = Math.min(exam.nq, q + 1); refreshAnsRow(q); updateCursor(); changed(); break; }
      case 'setcur': ui.cur = q; updateCursor(); { const f = $('#fast'); if (f) f.focus(); } break;
      case 'sprev': gotoStudent(-1); break;
      case 'snext': gotoStudent(1); break;
      case 'aapply': { const s = curStudent(); if (!s) break; const { arr } = parseAns($('#astr').value); s.answers = fit(arr, exam.nq, ''); changed(); renderEditor(); renderStudentList(); K.toast(t('answersRead', { n: Math.min(arr.length, exam.nq) })); break; }
      case 'aclear': { const s = curStudent(); if (!s) break; s.answers = fit([], exam.nq, ''); ui.cur = 0; changed(); renderEditor(); renderStudentList(); break; }
      case 'sremove': { const s = curStudent(); if (s && await K.confirm(t('confirmRemove', { name: s.name || t('unnamed') }), { danger: true, okText: t('removeStudent') })) { const i = exam.students.indexOf(s); exam.students.splice(i, 1); const n = exam.students[Math.min(i, exam.students.length - 1)]; ui.sel = n ? n.id : null; ui.cur = 0; changed(); renderView(); } break; }
      case 'delall': if (await K.confirm(t('confirmDeleteAll', { n: exam.students.length }), { danger: true, okText: t('deleteAll') })) { exam.students = []; ui.sel = null; changed(); renderView(); } break;
      case 'pastelist': pasteList(); break;
      /* resultados */
      case 'sort': if (ui.sortK === b.dataset.k) ui.sortDir *= -1; else { ui.sortK = b.dataset.k; ui.sortDir = b.dataset.k === 'name' || b.dataset.k === 'ver' ? 1 : -1; } renderView(); save(); break;
      case 'onlyflags': ui.onlyFlags = v === '1'; renderView(); break;
      case 'repstud': openPreview('student', id); break;
      case 'csv': K.download(fileName('csv'), '﻿' + K.toCSV(tableRows()), 'text/csv;charset=utf-8'); break;
      case 'copytable': K.toast((await copyText(tableRows().map(r => r.join('\t')).join('\n'))) ? t('copiedTable') : t('error'), 2800); break;
      /* imprimir */
      default:
        if (act.startsWith('pv-')) openPreview(act.slice(3));
        else if (act.startsWith('pr-')) doPrint(docFor(act.slice(3)));
    }
  });

  app.addEventListener('input', (ev) => {
    const el = ev.target, f = el.dataset.f; if (!f) { if (el.id === 'sfilter') { ui.filter = el.value; renderStudentList(); } return; }
    switch (f) {
      case 'name': exam.name = el.value; changed(); break;
      case 'maxGrade': case 'pass': case 'correct': case 'penaltyCustom': exam.scoring[f] = num(el.value, f === 'pass' ? 0 : 1); fix(exam); changed(); updateSum(); break;
      case 'sname': { const s = curStudent(); if (s) { s.name = el.value; changed(); renderStudentList(); } break; }
      case 'w': exam.weights[masterOf(ui.kv, +el.dataset.q)] = Math.max(0, num(el.value, 1)); changed(); break;
      default:
    }
  });
  function updateSum() {
    const s = exam.scoring, pf = penFrac(), el = $('#scoresum'); if (!el) return; const maxPts = exam.nq * s.correct;
    el.textContent = pf > 0 ? t('sumScoring', { c: K.fmt(s.correct, 2), p: K.fmt(pf * s.correct, 3), m: K.fmt(maxPts, 2), g: K.fmt(s.maxGrade, 2) }) : t('sumNoPen', { c: K.fmt(s.correct, 2), m: K.fmt(maxPts, 2), g: K.fmt(s.maxGrade, 2) });
  }
  app.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'examsel') { if (el.value !== exam.id && openExam(el.value)) { renderView(); announceOpen(); } return; }
    if (el.id === 'bfile') { if (el.files[0]) importBackup(el.files[0]); el.value = ''; return; }
    const f = el.dataset.f; if (!f) return;
    if (f === 'date') { exam.date = el.value || today(); changed(); }
    else if (f === 'nq') setNq(el.value);
    else if (f === 'weightsOn') { exam.weightsOn = el.checked; changed(); renderView(); }
    else if (f === 'showCorr') { ui.showCorr = el.checked; renderEditor(); save(); }
    else if (f === 'autoNext') { ui.autoNext = el.checked; save(); }
    else if (f.startsWith('sh_')) { ui.sheet[f.slice(3)] = el.checked; save(); }
  });
  app.addEventListener('submit', (ev) => {
    if (ev.target.dataset.form !== 'addstudent') return;
    ev.preventDefault();
    const inp = $('#newname'), name = inp.value.trim();
    const s = { id: K.uid(), name: name || t('studentDefault', { n: exam.students.length + 1 }), version: exam.versions[0], answers: fit([], exam.nq, '') };
    exam.students.push(s); ui.sel = s.id; ui.cur = 0; changed(); renderView(); const f = $('#fast'); (f || $('#newname')).focus();
  });

  /* teclado: pestañas con flechas y entrada ágil */
  app.addEventListener('keydown', (ev) => {
    if (ev.target.matches('[role="tab"]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
      const i = TABS.indexOf(ui.tab) + (ev.key === 'ArrowRight' ? 1 : -1); ui.tab = TABS[(i + TABS.length) % TABS.length]; renderView(); $(`.tabs [data-tab="${ui.tab}"]`).focus(); return;
    }
    if (ev.target.id === 'fast') fastKey(ev);
    if (ev.target.id === 'kstr' && ev.key === 'Enter') { ev.preventDefault(); $('[data-act="kapply"]').click(); }
    if (ev.target.id === 'astr' && ev.key === 'Enter') { ev.preventDefault(); $('[data-act="aapply"]').click(); }
  });
  app.addEventListener('beforeinput', (ev) => {   // teclados móviles que no emiten keydown útil
    if (ev.target.id !== 'fast' || !ev.data) return;
    ev.preventDefault(); [...ev.data].forEach(ch => fastChar(ch));
  });
  app.addEventListener('focusin', (ev) => { if (ev.target.id === 'fast') updateCursor(); });

  function fastChar(ch) {
    const up = ch.toUpperCase();
    if (letters().includes(up)) return fastPut(up);
    if (/^[1-5]$/.test(ch) && +ch <= exam.nopt) return fastPut(LET[+ch - 1]);
    if (' -._0'.includes(ch)) return fastPut('');
  }
  function fastKey(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key;
    if (k.length === 1) { ev.preventDefault(); fastChar(k); }
    else if (k === 'Backspace') { ev.preventDefault(); const s = curStudent(); if (!s) return; if (ui.cur > 0) { ui.cur--; s.answers[ui.cur] = ''; refreshAnsRow(ui.cur); updateCursor(); changed(); } }
    else if (k === 'ArrowLeft') { ev.preventDefault(); ui.cur = Math.max(0, ui.cur - 1); updateCursor(); }
    else if (k === 'ArrowRight') { ev.preventDefault(); ui.cur = Math.min(exam.nq, ui.cur + 1); updateCursor(); }
    else if (k === 'Enter') { ev.preventDefault(); gotoStudent(1, true); }
  }
  function fastPut(v) {
    const s = curStudent(); if (!s || ui.cur >= exam.nq) return;
    const i = ui.cur; s.answers[i] = v; ui.cur = i + 1; refreshAnsRow(i); updateCursor(); changed();
    if (ui.cur >= exam.nq && ui.autoNext) setTimeout(() => gotoStudent(1, true, true), 180);
  }
  function gotoStudent(dir, focus, quiet) {
    const list = filtered(), i = list.findIndex(s => s.id === ui.sel), n = list[i + dir];
    if (!n) { if (!quiet) K.toast(t('noMore')); return; }
    ui.sel = n.id; ui.cur = 0; renderStudentList(); renderEditor();
    const f = $('#fast'); if (f && (focus || document.activeElement === document.body)) f.focus();
  }

  /* pegar lista de alumnado */
  function pasteList() {
    const d = document.createElement('dialog'); d.className = 'kit-dialog'; d.style.width = 'min(560px,92vw)';
    d.innerHTML = `<h2>${t('pasteListTitle')}</h2><p class="muted">${t('pasteListHelp')}</p><textarea rows="9" style="font-family:monospace" placeholder="${esc(t('pasteListPh'))}"></textarea>
      <div class="row"><button class="btn ghost" data-r="0">${t('cancel')}</button><button class="btn" data-r="1">${t('add')}</button></div>`;
    d.addEventListener('click', e => {
      const r = e.target.dataset && e.target.dataset.r; if (r === undefined) return;
      if (r === '1') {
        let n = 0;
        $('textarea', d).value.split(/\r?\n/).forEach(line => {
          if (!line.trim()) return;
          const parts = line.split(/;|\t/).map(x => x.trim()); const s = { id: K.uid(), name: parts[0], version: exam.versions[0], answers: fit([], exam.nq, '') };
          parts.slice(1).forEach(p => {
            if (/^[A-D]$/i.test(p) && exam.versions.includes(p.toUpperCase())) s.version = p.toUpperCase();
            else if (/^[A-Ea-e1-5\-._?*\s]{3,}$/.test(p)) s.answers = fit(parseAns(p).arr, exam.nq, '');
          });
          exam.students.push(s); n++;
        });
        if (n) { if (!ui.sel) ui.sel = exam.students[0].id; changed(); renderView(); K.toast(t('pasteAdded', { n })); }
      }
      d.close();
    });
    d.addEventListener('close', () => d.remove());
    document.body.append(d); d.showModal(); $('textarea', d).focus();
  }

  /* ---------------------------------------------------------- arranque */
  const fire = (act) => { const b = document.createElement('button'); b.dataset.act = act; b.hidden = true; app.append(b); b.click(); b.remove(); };
  C.ctx = { get exam() { return exam; }, ui, changed, TABS,
    /* para el selector de examen */
    listExams() { return examIndex().map(e => ({ id: e.id, name: e.name, date: e.date, nq: e.nq, students: (e.students || []).length, scanned: (e.students || []).filter(x => x.scanned).length, campusId: e.campus && e.campus.id != null ? e.campus.id : null })); },
    openLocal(id) { if (openExam(id)) { renderShell(); announceOpen(); } },
    newExam() { fire('newExam'); }, demo() { fire('demo'); },
    /* abre (o crea) un examen completo a partir de un objeto; lo usa el modo Campus */
    openExamObject(o) { if (exam && exam.id !== o.id) { if (!dropIfBlank()) persist(); } exam = fix(o); examsCache = null; ui.kv = exam.versions[0]; ui.sel = exam.students[0] ? exam.students[0].id : null; persist(); renderShell(); },
    showTab(tb) { ui.tab = tb; renderShell(); }, renderView, fix, flush: persist, score, fileName, copyText, openPreview, doPrint, docFor,
    reloadCurrent() { const e = store.get('exam:' + exam.id); exam = e ? fix(e) : (examIndex()[0] ? fix(examIndex()[0]) : newExam()); examsCache = null; ui.kv = exam.versions[0]; ui.sel = exam.students[0] ? exam.students[0].id : null; persist(); renderShell(); } };
  K.mount({ titleKey: 'title' });
  const cur = store.get('current'); const e0 = cur && store.get('exam:' + cur);
  exam = e0 ? fix(e0) : null;
  if (!exam) { const first = examIndex()[0]; exam = first ? fix(first) : newExam(); }
  if (!TABS.includes(ui.tab)) ui.tab = 'exam';
  if (!exam.versions.includes(ui.kv)) ui.kv = exam.versions[0];
  if (!ui.sel || !curStudent()) ui.sel = exam.students[0] ? exam.students[0].id : null;
  renderShell(); persist();
  [C.uiStudents, C.uiSheet, C.uiScan, C.uiSync, C.uiCampus].forEach(m => m.init());
  K.onLang(() => { C.uiScan.stopLive(); renderShell(); });
  C.uiSync.start();
  C.uiCampus.start();
})();
