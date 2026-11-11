/* ============================================================
   Corrector de tests · MODO CAMPUS (solo cuando se sirve desde el campus con ?assessment=<id>)
   Carga la prueba en papel y su lista de clase con códigos, guarda la clave, imprime hojas personalizadas
   y envía los resultados (solo códigos y letras, nunca imágenes). El modo independiente no cambia.
   ============================================================ */
(() => {
  'use strict';
  const C = window.CORR, K = window.AppKit, esc = K.esc;
  const T = (k, p) => K.t(k, p);
  const $ = (s, r = document) => r.querySelector(s);

  const D = window.CORR_I18N;
  Object.assign(D.es, {
    tab_campus: 'Campus', cpTitle: 'Prueba del campus', cpHelp: 'Esta prueba en papel se corrige aquí y solo se envían al campus los códigos y las respuestas, nunca imágenes.',
    cpLoading: 'Cargando la prueba del campus…', cpErr401: 'No hay sesión de administrador. Entra en el campus y vuelve a abrir el corrector desde la prueba.', cpErrNot: 'Esta prueba no es de papel o no existe.', cpErrGen: 'No se ha podido contactar con el campus: {m}',
    cpReload: 'Recargar del campus', cpLoaded: 'Prueba cargada: {n} alumnos con código.', cpNoKey: 'La prueba aún no tiene clave en el campus. Defínela en la pestaña Clave y guárdala aquí.',
    cpKeyBtn: 'Guardar clave en el campus', cpKeyOk: 'Clave guardada. Notas ya existentes recalculadas: {n}.', cpKeyEmpty: 'Rellena antes la clave de respuestas (pestaña Clave).',
    cpSheets: 'Hojas personalizadas', cpSheetsHelp: 'Una hoja por alumno con nombre, apellidos, código y versión ya impresos. Imprímelas o guárdalas como PDF desde el diálogo de impresión.', cpVersions: 'Las versiones se reparten alternando por orden alfabético.',
    cpPreview: 'Vista previa', cpPrint: 'Imprimir / PDF', cpSend: 'Enviar resultados al campus', cpSendHelp: '{n} hojas escaneadas listas para enviar de {t} alumnos.', cpSendBtn: 'Enviar resultados',
    cpConfirm: '¿Enviar al campus {n} resultados de «{name}»? Solo se envían códigos, versión y letras marcadas; las notas existentes de esos alumnos se actualizarán.', cpNothing: 'Aún no hay hojas escaneadas.',
    cpSent: 'Enviado: {s} guardados.', cpUnmatched: 'Sin emparejar', cpDup: 'Duplicados', cpErrors: 'Con errores', cpLast: 'Último envío: {d} ({s} guardados)', cpSending: 'Enviando…', cpNoCode: 'Alumnos sin código: {n}', cpPrivacy: 'La lista de clase y los resultados se guardan también en este navegador.',
    cpScanned: '{n} escaneadas'    ,cpSaved: 'Clave guardada en el campus ✓ {t}', cpUnsaved: 'Sin guardar en el campus', cpSaving: 'Guardando en el campus…', cpFail: 'No se pudo guardar en el campus (se reintenta). Tus cambios siguen aquí.', cpSaveNow: 'Guardar en el campus', cpNoKeyYet: 'Clave aún no guardada en el campus'
  });
  Object.assign(D.ca, {
    tab_campus: 'Campus', cpTitle: 'Prova del campus', cpHelp: "Aquesta prova en paper es corregeix aquí i només s'envien al campus els codis i les respostes, mai imatges.",
    cpLoading: 'Carregant la prova del campus…', cpErr401: "No hi ha sessió d'administrador. Entra al campus i torna a obrir el corrector des de la prova.", cpErrNot: 'Aquesta prova no és de paper o no existeix.', cpErrGen: "No s'ha pogut contactar amb el campus: {m}",
    cpReload: 'Recarrega del campus', cpLoaded: 'Prova carregada: {n} alumnes amb codi.', cpNoKey: "La prova encara no té clau al campus. Defineix-la a la pestanya Clau i desa-la aquí.",
    cpKeyBtn: 'Desa la clau al campus', cpKeyOk: 'Clau desada. Notes existents recalculades: {n}.', cpKeyEmpty: 'Omple abans la clau de respostes (pestanya Clau).',
    cpSheets: 'Fulls personalitzats', cpSheetsHelp: "Un full per alumne amb nom, cognoms, codi i versió ja impresos. Imprimeix-los o desa'ls com a PDF des del diàleg d'impressió.", cpVersions: "Les versions es reparteixen alternant per ordre alfabètic.",
    cpPreview: 'Previsualització', cpPrint: 'Imprimeix / PDF', cpSend: 'Envia resultats al campus', cpSendHelp: '{n} fulls escanejats llestos per enviar de {t} alumnes.', cpSendBtn: 'Envia resultats',
    cpConfirm: "Enviar al campus {n} resultats de «{name}»? Només s'envien codis, versió i lletres marcades; les notes existents d'aquests alumnes s'actualitzaran.", cpNothing: 'Encara no hi ha fulls escanejats.',
    cpSent: 'Enviat: {s} desats.', cpUnmatched: 'Sense emparellar', cpDup: 'Duplicats', cpErrors: 'Amb errors', cpLast: 'Darrer enviament: {d} ({s} desats)', cpSending: 'Enviant…', cpNoCode: 'Alumnes sense codi: {n}', cpPrivacy: 'La llista de classe i els resultats es desen també en aquest navegador.',
    cpScanned: '{n} escanejats'    ,cpSaved: 'Clau desada al campus ✓ {t}', cpUnsaved: 'Sense desar al campus', cpSaving: 'Desant al campus…', cpFail: "No s'ha pogut desar al campus (es reintenta). Els teus canvis són aquí.", cpSaveNow: 'Desa al campus', cpNoKeyYet: 'Clau encara no desada al campus'
  });
  Object.assign(D.en, {
    tab_campus: 'Campus', cpTitle: 'Campus exam', cpHelp: 'This paper exam is graded here and only codes and answers are sent to the campus, never images.',
    cpLoading: 'Loading the campus exam…', cpErr401: 'No administrator session. Sign in to the campus and open the marker again from the exam.', cpErrNot: 'This exam is not a paper exam or does not exist.', cpErrGen: 'Could not reach the campus: {m}',
    cpReload: 'Reload from campus', cpLoaded: 'Exam loaded: {n} students with a code.', cpNoKey: 'The exam has no key in the campus yet. Define it in the Key tab and save it here.',
    cpKeyBtn: 'Save key to the campus', cpKeyOk: 'Key saved. Existing grades recalculated: {n}.', cpKeyEmpty: 'Fill in the answer key first (Key tab).',
    cpSheets: 'Personalised sheets', cpSheetsHelp: 'One sheet per student with first and last name, code and version already printed. Print them or save as PDF from the print dialog.', cpVersions: 'Versions are assigned alternately in alphabetical order.',
    cpPreview: 'Preview', cpPrint: 'Print / PDF', cpSend: 'Send results to the campus', cpSendHelp: '{n} scanned sheets ready to send out of {t} students.', cpSendBtn: 'Send results',
    cpConfirm: 'Send {n} results of "{name}" to the campus? Only codes, version and marked letters are sent; existing grades of those students will be updated.', cpNothing: 'No scanned sheets yet.',
    cpSent: 'Sent: {s} saved.', cpUnmatched: 'Unmatched', cpDup: 'Duplicates', cpErrors: 'With errors', cpLast: 'Last send: {d} ({s} saved)', cpSending: 'Sending…', cpNoCode: 'Students without a code: {n}', cpPrivacy: 'The class list and results are also stored in this browser.',
    cpScanned: '{n} scanned'    ,cpSaved: 'Key saved in the campus ✓ {t}', cpUnsaved: 'Not saved in the campus', cpSaving: 'Saving to the campus…', cpFail: 'Could not save to the campus (retrying). Your changes are kept here.', cpSaveNow: 'Save to the campus', cpNoKeyYet: 'Key not saved in the campus yet'
  });

  const Y = { id: new URLSearchParams(location.search).get('assessment'), state: 'off', err: '', busy: false, res: null, noKey: false };
  const X = () => C.ctx;
  async function api(path, opt = {}) {
    const o = { credentials: 'same-origin', headers: {} };
    if (opt.method && opt.method !== 'GET') { o.method = opt.method; o.headers['X-Requested-With'] = 'campus'; o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(opt.body); }
    const r = await fetch(path, o); let j = null; try { j = await r.json(); } catch (_) { /* nada */ }
    if (!r.ok) { const e = new Error((j && (j.msg || j.error)) || ('HTTP ' + r.status)); e.status = r.status; e.code = j && j.error; throw e; }
    return j;
  }

  /* respuesta del campus → examen del corrector (conserva respuestas ya escaneadas, emparejando por código) */
  function toExam(data, prev) {
    const a = data.assessment || {}, cfg = data.config, id = 'campus-' + Y.id;
    const nq = cfg ? cfg.nq : (prev ? prev.nq : 20), nopt = cfg ? Math.min(5, cfg.nopt) : 4;
    const versions = cfg ? cfg.versions.filter(v => 'ABCD'.includes(v)) : ['A'];
    const e = { id, name: a.title || 'Campus', date: a.date || undefined, nq, nopt, versions: versions.length ? versions : ['A'], keys: {}, maps: {}, annul: [], students: [], codeLen: 6, codeCheck: false, codeMode: 'random', sheet: {} };
    if (cfg) {
      e.versions.forEach(v => { const k = cfg.keys && cfg.keys[v]; e.keys[v] = typeof k === 'string' ? k.split('').map(x => (x === '*' || x === '-' ? '' : x.toUpperCase())) : (k || []).map(x => (x === '*' ? '' : String(x || '').toUpperCase())); });
      Object.keys(cfg.maps || {}).forEach(v => { if (e.versions.includes(v)) e.maps[v] = (cfg.maps[v] || []).map(n => n - 1); });
      (cfg.annulled || []).forEach(n => { e.annul[n - 1] = true; }); e.annulMode = 'exclude';
      if (cfg.weights && cfg.weights.length) { e.weightsOn = true; e.weights = cfg.weights.map(Number); }
      const pen = cfg.penalty_own != null ? cfg.penalty_own : (cfg.penalty != null ? cfg.penalty : a.penalty || 0);
      e.scoring = { maxGrade: 10, pass: 5, correct: 1, preset: pen > 0 ? 'custom' : 'none', penaltyCustom: pen };
    } else if (prev) { e.keys = prev.keys; e.maps = prev.maps; e.annul = prev.annul; e.scoring = prev.scoring; }
    const old = new Map(((prev && prev.students) || []).map(s => [s.code, s]));
    e.students = (data.students || []).map(s => {
      const o = old.get(s.code), last = [s.ap1, s.ap2].filter(Boolean).join(' ');
      return { id: 'c' + s.id, name: '', last, first: s.nombre || '', group: [s.group, s.subgroup].filter(Boolean).join(' '), code: String(s.code || ''), version: (o && o.version) || e.versions[0], answers: o ? o.answers : [], scanned: o ? o.scanned : undefined };
    });
    e.campus = Object.assign({ id: Y.id, subject: a.subject, subjectTitle: a.subject_title }, prev && prev.campus ? { last: prev.campus.last } : {});
    return e;
  }

  const hashTab = () => ({ '#key': 'key', '#clave': 'key', '#scan': 'scan', '#escanear': 'scan', '#sheets': 'campus', '#hojas': 'campus' }[location.hash] || 'campus');
  async function load(quiet) {
    Y.state = 'loading'; Y.err = ''; redraw();
    try {
      const data = await api('/api/corrector/exam?assessment=' + encodeURIComponent(Y.id));
      const prev = JSON.parse(localStorage.getItem('corrector:exam:campus-' + Y.id) || 'null');
      const e = toExam(data, prev); Y.noKey = !data.config || !data.config.has_key;
      X().openExamObject(e); Y.state = 'ok'; S.base = sig(); S.at = 0; if (data.config && data.config.has_key) S.at = data.config.updated_at ? +new Date(data.config.updated_at) || Date.now() : Date.now(); S.fail = false;
      if (!quiet) K.toast(T('cpLoaded', { n: e.students.filter(s => s.code).length }), 3000);
      X().showTab(hashTab());
    } catch (err) {
      Y.state = 'error'; Y.err = err.status === 401 ? T('cpErr401') : (err.status === 409 || err.status === 404 || err.code === 'not-paper' || err.code === 'notfound') ? T('cpErrNot') : T('cpErrGen', { m: err.message });
      redraw();
    }
  }
  const redraw = () => { if (X() && X().ui.tab === 'campus') { const v = $('#view'); if (v) { v.innerHTML = render(); } } };

  function keyBody() {
    const e = X().exam;
    const body = { nq: e.nq, nopt: e.nopt, versions: e.versions, keys: {}, annulled: [], weights: e.weightsOn ? e.weights.map(Number) : [], penalty: null };
    e.versions.forEach(v => { body.keys[v] = (e.keys[v] || []).map(x => x || ''); if (v !== 'A' || (e.maps[v] || []).some((m, i) => m !== i)) body.maps = Object.assign(body.maps || {}, { [v]: (e.maps[v] || []).map(m => m + 1) }); });
    e.annul.forEach((a, i) => { if (a) body.annulled.push(i + 1); });
    return body;
  }
  const sig = () => { try { return JSON.stringify(keyBody()); } catch (_) { return ''; } };
  const hhmm = (d) => new Date(d).toLocaleTimeString(K.locale(), { hour: '2-digit', minute: '2-digit' });
  /* indicador fijo + guardado automatico de la clave en el campus */
  const S = { base: null, at: 0, saving: false, fail: false, chg: 0, try: 0, dd: false };
  function badge() {
    let el = $('#cpbadge');
    if (!el) { el = document.createElement('div'); el.id = 'cpbadge'; el.className = 'cpbadge'; el.setAttribute('role', 'status'); document.body.appendChild(el); el.addEventListener('click', (ev) => { if (ev.target.closest('button')) saveKey(true); }); }
    return el;
  }
  function paint() {
    if (!Y.id || Y.state !== 'ok') { const o = $('#cpbadge'); if (o) o.hidden = true; return; }
    const el = badge(); el.hidden = false;
    const dirty = sig() !== S.base, cls = S.fail ? 'bad' : S.saving ? 'wait' : dirty ? 'warn' : 'ok';
    const txt = S.fail ? T('cpFail') : S.saving ? T('cpSaving') : dirty ? T('cpUnsaved') : (S.at ? T('cpSaved', { t: hhmm(S.at) }) : T('cpNoKeyYet'));
    const html = `<span class="cpdot ${cls}"></span><span>${esc(txt)}</span>${dirty || S.fail ? `<button type="button" class="btn small">${T('cpSaveNow')}</button>` : ''}`;
    if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html; }
  }
  async function saveKey(manual) {
    if (S.saving) return;
    const e = X().exam, filled = e.versions.some(v => (e.keys[v] || []).some(Boolean));
    if (!filled) { if (manual) K.toast(T('cpKeyEmpty'), 3500); return; }
    if (manual === true && !e.versions.every(v => (e.keys[v] || []).some(Boolean))) { K.toast(T('cpKeyEmpty'), 3500); return; }
    const body = keyBody(), mine = JSON.stringify(body);
    S.saving = true; paint();
    try {
      const r = await api('/api/corrector/exam?assessment=' + encodeURIComponent(Y.id), { method: 'PUT', body });
      Y.noKey = !r.has_key; S.base = mine; S.at = Date.now(); S.fail = false;
      if (manual) K.toast(T('cpKeyOk', { n: r.regraded || 0 }), 3600); redraw();
    } catch (err) { S.fail = true; if (manual) K.toast(T('cpErrGen', { m: err.message }), 5000); }
    S.saving = false; paint();
  }
  function watch() {
    setInterval(() => {
      if (Y.state !== 'ok' || S.saving || S.base === null) return;
      const d = sig() !== S.base;
      if (d && (S.fail ? Date.now() - S.try > 8000 : Date.now() - S.chg > 1500)) { S.try = Date.now(); saveKey(false); }
      if (d && !S.dd) S.chg = Date.now(); S.dd = d;
      paint();
    }, 700);
  }
  const ready = () => X().exam.students.filter(s => s.scanned && s.code);
  async function send() {
    const e = X().exam, list = ready();
    if (!list.length) { K.toast(T('cpNothing'), 2800); return; }
    if (!(await K.confirm(T('cpConfirm', { n: list.length, name: e.name })))) return;
    Y.busy = true; redraw();
    try {
      const results = list.map(s => ({ code: s.code, version: s.version, answers: e.versions.length ? s.answers.slice(0, e.nq).map(a => a || '') : [] }));
      const r = await api('/api/corrector/results', { method: 'POST', body: { assessment_id: +Y.id, results } });
      Y.res = r; e.campus.last = { at: Date.now(), saved: r.saved }; X().changed(); K.toast(T('cpSent', { s: r.saved }), 3500);
    } catch (err) { Y.res = { fail: err.message }; K.toast(T('cpErrGen', { m: err.message }), 5000); }
    Y.busy = false; redraw();
  }

  function render() {
    if (Y.state === 'loading' || Y.state === 'off') return `<section class="panel"><p>${T('cpLoading')}</p></section>`;
    if (Y.state === 'error') return `<section class="panel stack"><h2 style="margin:0">${T('cpTitle')}</h2><div class="banner-warn" role="alert">${esc(Y.err)}</div><div class="row"><button class="btn" data-act="c:reload">${T('cpReload')}</button></div></section>`;
    const e = X().exam, n = ready().length, noCode = e.students.filter(s => !s.code).length, last = e.campus && e.campus.last, r = Y.res;
    const lst = (t, a) => a && a.length ? `<div class="fb bad"><b>${T(t)} (${a.length})</b><br>${a.slice(0, 30).map(x => esc(typeof x === 'string' ? x : (x.msg ? `#${x.row} ${x.code || ''} ${x.msg}` : JSON.stringify(x)))).join('<br>')}</div>` : '';
    return `
    <section class="panel stack"><div class="row spread"><h2 style="margin:0">${T('cpTitle')}: ${esc(e.name)}</h2><button class="btn ghost small" data-act="c:reload">⟳ ${T('cpReload')}</button></div>
      <p class="muted" style="margin:0">${T('cpHelp')}</p>
      <div class="row"><span class="chip accent">${e.students.length} ${T('studentsN')}</span><span class="chip">${e.nq} ${T('qs')} · ${e.versions.join('/')}</span>${noCode ? `<span class="chip warn">${T('cpNoCode', { n: noCode })}</span>` : ''}</div>
      ${Y.noKey ? `<div class="banner-warn">${T('cpNoKey')}</div>` : ''}
      <div class="row"><button class="btn" data-act="c:key">${T('cpKeyBtn')}</button><button class="btn ghost" data-tab="key">${T('tab_key')}</button></div>
    </section>
    <section class="panel stack"><h2 style="margin:0">${T('cpSheets')}</h2><p class="muted" style="margin:0">${T('cpSheetsHelp')}${e.versions.length > 1 ? ' ' + T('cpVersions') : ''}</p>
      <div class="row"><button class="btn" data-act="c:pv" ${e.students.length ? '' : 'disabled'}>${T('cpPreview')}</button><button class="btn ghost" data-act="c:pr" ${e.students.length ? '' : 'disabled'}>${T('cpPrint')}</button><button class="btn ghost" data-tab="scan">${T('tab_scan')}</button></div></section>
    <section class="panel stack"><h2 style="margin:0">${T('cpSend')}</h2><p class="muted" style="margin:0">${n ? T('cpSendHelp', { n, t: e.students.length }) : T('cpNothing')}</p>
      <div class="row"><button class="btn big" data-act="c:send" ${n && !Y.busy ? '' : 'disabled'}>${Y.busy ? T('cpSending') : T('cpSendBtn')}</button></div>
      ${last ? `<small class="muted">${T('cpLast', { d: new Date(last.at).toLocaleString(K.locale()), s: last.saved })}</small>` : ''}
      ${r && r.fail ? `<div class="banner-warn" role="alert">${esc(r.fail)}</div>` : ''}
      ${r && !r.fail ? `<div class="fb good" role="status">${T('cpSent', { s: r.saved })}</div>${lst('cpUnmatched', r.unmatched)}${lst('cpDup', r.duplicates)}${lst('cpErrors', r.errors)}` : ''}
      <small class="muted">${T('cpPrivacy')}</small></section>`;
  }
  function init() {
    if (!Y.id) return;
    $('#app').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-act^="c:"]'); if (!b) return; const a = b.dataset.act;
      if (a === 'c:reload') load(false); else if (a === 'c:key') saveKey(true); else if (a === 'c:send') send();
      else if (a === 'c:pv') X().openPreview('personal'); else if (a === 'c:pr') X().doPrint(X().docFor('personal'));
    });
  }
  function start() {
    if (!Y.id || !/^\d+$/.test(Y.id)) return;
    X().TABS.splice(X().TABS.indexOf('scan') + 1, 0, 'campus'); X().showTab('campus'); load(true); watch();
  }
  C.uiCampus = { render, mount() { /* nada */ }, init, start, toExam, state: Y };
})();
