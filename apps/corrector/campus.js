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
    cpNew: '+ Nueva prueba en papel en el campus', cpNewTitle: 'Nueva prueba en papel', cpNewHelp: 'Se crea en el campus (oculta al alumnado) y se abre aquí para definir la clave y corregir. Las pruebas creadas con «Nuevo examen» de «Mis exámenes» son libres: no están en ninguna asignatura y no envían notas al campus.', cpSubject: 'Asignatura', cpTitleF: 'Título', cpDateF: 'Fecha', cpKindF: 'Tipo', cpExam: 'Examen', cpForm: 'Formativa', cpWeight: 'Peso', cpRa: 'RA / UD (opcional)', cpNoRa: 'Sin RA / UD', cpCreate: 'Crear y abrir', cpCancel: 'Cancelar', cpNewErr: 'No se pudo crear la prueba: {m}',
    cpAuto: 'Enviar cada hoja al campus al guardarla', cpAutoHelp: 'Al guardar una hoja escaneada, su nota se envía sola al campus (la clave tiene que estar guardada). Si algo falla, queda pendiente y se envía con «Enviar resultados».', cpAutoOk: '{n}: nota enviada al campus ✓', cpAutoFail: 'No se pudo enviar la nota de {n}: {m}', cpAutoNoKey: 'La clave aún no está en el campus: guárdala y pulsa «Enviar resultados» para enviar las notas.', cpSentN: '{n} de {t} con nota ya enviada al campus',
    cpUnscanOk: 'Resultado quitado del campus.', cpUnscanFail: 'No se pudo quitar del campus: {m}', cpUnscanManual: 'Esa nota se cambió a mano en el campus. ¿Quitarla igualmente?',
    cpListTitle: 'Pruebas en papel del campus', cpListHelp: 'Abre una para definir su clave, imprimir las hojas personalizadas, escanear y enviar las notas. Todo queda guardado en el campus.', cpOpen: 'Abrir', cpNone: 'Aún no hay pruebas en papel. Créalas en el campus (Evaluación → Pruebas y tareas → «En papel»).', cpKeyYes: 'Con clave', cpKeyNo: 'Sin clave', cpCorrN: '{n} corregidas', cpCurrent: 'Abierta', cpListErr: 'No se pudo cargar la lista de pruebas del campus.',
    cpScanned: '{n} escaneadas'    ,cpSaved: 'Clave guardada en el campus ✓ {t}', cpUnsaved: 'Sin guardar en el campus', cpSaving: 'Guardando en el campus…', cpFail: 'No se pudo guardar en el campus (se reintenta). Tus cambios siguen aquí.', cpSaveNow: 'Guardar en el campus', cpNoKeyYet: 'Clave aún no guardada en el campus',
    notScanned: 'Sin escanear',
    cpScoringNote: 'Prueba del campus: la nota es sobre 10 y las preguntas anuladas no cuentan (ni suman ni restan), igual que en el campus. La penalización que elijas aquí se guarda en el campus junto con la clave.'
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
    cpNew: '+ Nova prova en paper al campus', cpNewTitle: 'Nova prova en paper', cpNewHelp: "Es crea al campus (oculta a l'alumnat) i s'obre aquí per definir la clau i corregir. Les proves creades amb «Nou examen» de «Els meus exàmens» són lliures: no són a cap assignatura i no envien notes al campus.", cpSubject: 'Assignatura', cpTitleF: 'Títol', cpDateF: 'Data', cpKindF: 'Tipus', cpExam: 'Examen', cpForm: 'Formativa', cpWeight: 'Pes', cpRa: 'RA / UD (opcional)', cpNoRa: 'Sense RA / UD', cpCreate: 'Crea i obre', cpCancel: 'Cancel·la', cpNewErr: "No s'ha pogut crear la prova: {m}",
    cpAuto: 'Envia cada full al campus en desar-lo', cpAutoHelp: "En desar un full escanejat, la seva nota s'envia sola al campus (la clau ha d'estar desada). Si alguna cosa falla, queda pendent i s'envia amb «Envia resultats».", cpAutoOk: '{n}: nota enviada al campus ✓', cpAutoFail: "No s'ha pogut enviar la nota de {n}: {m}", cpAutoNoKey: "La clau encara no és al campus: desa-la i prem «Envia resultats» per enviar les notes.", cpSentN: '{n} de {t} amb nota ja enviada al campus',
    cpUnscanOk: 'Resultat tret del campus.', cpUnscanFail: "No s'ha pogut treure del campus: {m}", cpUnscanManual: "Aquesta nota es va canviar a mà al campus. Treure-la igualment?",
    cpListTitle: 'Proves en paper del campus', cpListHelp: "Obre'n una per definir-ne la clau, imprimir els fulls personalitzats, escanejar i enviar les notes. Tot queda desat al campus.", cpOpen: 'Obre', cpNone: "Encara no hi ha proves en paper. Crea-les al campus (Avaluació → Proves i tasques → «En paper»).", cpKeyYes: 'Amb clau', cpKeyNo: 'Sense clau', cpCorrN: '{n} corregides', cpCurrent: 'Oberta', cpListErr: "No s'ha pogut carregar la llista de proves del campus.",
    cpScanned: '{n} escanejats'    ,cpSaved: 'Clau desada al campus ✓ {t}', cpUnsaved: 'Sense desar al campus', cpSaving: 'Desant al campus…', cpFail: "No s'ha pogut desar al campus (es reintenta). Els teus canvis són aquí.", cpSaveNow: 'Desa al campus', cpNoKeyYet: 'Clau encara no desada al campus',
    notScanned: 'Sense escanejar',
    cpScoringNote: "Prova del campus: la nota és sobre 10 i les preguntes anul·lades no compten (ni sumen ni resten), igual que al campus. La penalització que triïs aquí es desa al campus juntament amb la clau."
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
    cpNew: '+ New paper exam in the campus', cpNewTitle: 'New paper exam', cpNewHelp: 'It is created in the campus (hidden from students) and opened here to set the key and grade. Exams made with “New exam” under “My exams” are free: they belong to no subject and do not send grades to the campus.', cpSubject: 'Subject', cpTitleF: 'Title', cpDateF: 'Date', cpKindF: 'Type', cpExam: 'Exam', cpForm: 'Formative', cpWeight: 'Weight', cpRa: 'LO / UD (optional)', cpNoRa: 'No LO / UD', cpCreate: 'Create and open', cpCancel: 'Cancel', cpNewErr: 'Could not create the exam: {m}',
    cpAuto: 'Send each sheet to the campus when saved', cpAutoHelp: 'When a scanned sheet is saved, its grade is sent to the campus automatically (the key must be saved). If something fails it stays pending and goes out with “Send results”.', cpAutoOk: '{n}: grade sent to the campus ✓', cpAutoFail: 'Could not send the grade of {n}: {m}', cpAutoNoKey: 'The key is not in the campus yet: save it and press “Send results” to send the grades.', cpSentN: '{n} of {t} with a grade already sent to the campus',
    cpUnscanOk: 'Result removed from the campus.', cpUnscanFail: 'Could not remove it from the campus: {m}', cpUnscanManual: 'That grade was changed by hand in the campus. Remove it anyway?',
    cpListTitle: 'Paper exams in the campus', cpListHelp: 'Open one to set its key, print the personalised sheets, scan and send the grades. Everything is saved in the campus.', cpOpen: 'Open', cpNone: 'There are no paper exams yet. Create them in the campus (Assessment → Tests and tasks → “On paper”).', cpKeyYes: 'Has a key', cpKeyNo: 'No key', cpCorrN: '{n} graded', cpCurrent: 'Open', cpListErr: 'Could not load the list of campus exams.',
    cpScanned: '{n} scanned'    ,cpSaved: 'Key saved in the campus ✓ {t}', cpUnsaved: 'Not saved in the campus', cpSaving: 'Saving to the campus…', cpFail: 'Could not save to the campus (retrying). Your changes are kept here.', cpSaveNow: 'Save to the campus', cpNoKeyYet: 'Key not saved in the campus yet',
    notScanned: 'Not scanned',
    cpScoringNote: 'Campus exam: the grade is out of 10 and annulled questions do not count (they neither add nor subtract), as in the campus. The penalty you choose here is saved in the campus together with the key.'
  });

  const MODE = document.documentElement.dataset.mode === 'campus';
  const store = K.storage('corrector');
  const Y = { id: MODE ? new URLSearchParams(location.search).get('assessment') : null, state: 'off', err: '', busy: false, res: null, noKey: false };
  const X = () => C.ctx;
  /* la prueba del campus que está abierta ahora mismo (si el examen abierto es uno libre, no hay ninguna) */
  const active = () => !!(Y.id && X() && X().exam && X().exam.campus && String(X().exam.campus.id) === String(Y.id));
  async function api(path, opt = {}) {
    const o = { credentials: 'same-origin', headers: {} };
    if (opt.method && opt.method !== 'GET') { o.method = opt.method; o.headers['X-Requested-With'] = 'campus'; o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(opt.body); }
    const r = await fetch(path, o); let j = null; try { j = await r.json(); } catch (_) { /* nada */ }
    if (!r.ok) { const e = new Error((j && (j.msg || j.error)) || ('HTTP ' + r.status)); e.status = r.status; e.code = j && j.error; throw e; }
    return j;
  }

  /* respuesta del campus → examen del corrector (conserva respuestas ya escaneadas, emparejando por código) */
  function toExam(data, prev) {
    const a = data.assessment || {}, cfg = data.config, id = 'campus-' + Y.id, apen = a.penalty == null ? 0.25 : +a.penalty;
    const nq = cfg ? cfg.nq : (prev ? prev.nq : 20), nopt = cfg ? Math.min(5, cfg.nopt) : 4;
    const versions = cfg ? cfg.versions.filter(v => 'ABCD'.includes(v)) : ['A'];
    const e = { id, name: a.title || 'Campus', center: (prev && prev.center) || '', subject: (prev && prev.subject) || a.subject_title || '', date: a.date || undefined, nq, nopt, versions: versions.length ? versions : ['A'], keys: {}, maps: {}, annul: [], students: [], codeLen: 6, codeCheck: false, codeMode: 'random', sheet: {} };
    if (cfg) {
      e.versions.forEach(v => { const k = cfg.keys && cfg.keys[v]; e.keys[v] = typeof k === 'string' ? k.split('').map(x => (x === '*' || x === '-' ? '' : x.toUpperCase())) : (k || []).map(x => (x === '*' ? '' : String(x || '').toUpperCase())); });
      Object.keys(cfg.maps || {}).forEach(v => { if (e.versions.includes(v)) e.maps[v] = (cfg.maps[v] || []).map(n => n - 1); });
      (cfg.annulled || []).forEach(n => { e.annul[n - 1] = true; });
      if (cfg.weights && cfg.weights.length) { e.weightsOn = true; e.weights = cfg.weights.map(Number); }
      const pen = cfg.penalty_own != null ? cfg.penalty_own : (cfg.penalty != null ? cfg.penalty : apen);
      e.scoring = scoringOf(pen);
    } else if (prev) { e.keys = prev.keys; e.maps = prev.maps; e.annul = prev.annul; e.scoring = prev.scoring; }
    /* la nota que se ve aquí tiene que ser la que guarda el campus: sobre 10, anuladas fuera del cálculo y, sin nada propio, la penalización de la prueba */
    if (!e.scoring) e.scoring = scoringOf(apen);
    e.annulMode = 'exclude';
    const old = new Map(((prev && prev.students) || []).map(s => [s.code, s]));
    e.students = (data.students || []).map(s => {
      const o = old.get(s.code), last = [s.ap1, s.ap2].filter(Boolean).join(' ');
      return { id: 'c' + s.id, name: '', last, first: s.nombre || '', group: [s.group, s.subgroup].filter(Boolean).join(' '), code: String(s.code || ''), version: (o && o.version) || e.versions[0], answers: o ? o.answers : [], scanned: o ? o.scanned : undefined, sent: o ? o.sent : undefined };
    });
    e.campus = Object.assign({ id: Y.id, subject: a.subject, subjectTitle: a.subject_title, apen }, prev && prev.campus ? { last: prev.campus.last, auto: prev.campus.auto } : {});
    return e;
  }
  const scoringOf = (pen) => ({ maxGrade: 10, pass: 5, correct: 1, preset: pen > 0 ? 'custom' : 'none', penaltyCustom: pen });
  /* penalización que aplica el corrector con su ajuste actual (misma regla que penFrac de corrector.js) */
  function penOf(e) {
    const s = e.scoring || {}, n = parseFloat(String(s.penaltyCustom).replace(',', '.'));
    return s.preset === 'none' ? 0 : s.preset === 'chance' ? 1 / Math.max(1, e.nopt - 1) : s.preset === 'quarter' ? 0.25 : Math.max(0, Number.isFinite(n) ? n : 0);
  }

  const hashTab = () => ({ '#key': 'key', '#clave': 'key', '#scan': 'scan', '#escanear': 'scan', '#sheets': 'campus', '#hojas': 'campus' }[location.hash] || 'campus');
  async function load(quiet, tab) {
    const id = Y.id; Y.state = 'loading'; Y.err = ''; redraw();
    try {
      const data = await api('/api/corrector/exam?assessment=' + encodeURIComponent(id));
      if (id !== Y.id) return;                       // mientras tanto se abrió otra prueba
      const prev = store.get('exam:campus-' + id);
      const e = toExam(data, prev); Y.noKey = !data.config || !data.config.has_key;
      X().openExamObject(e); Y.state = 'ok'; S.base = sig(); S.at = 0; if (data.config && data.config.has_key) S.at = data.config.updated_at ? +new Date(data.config.updated_at) || Date.now() : Date.now(); S.fail = false;
      if (!quiet) K.toast(T('cpLoaded', { n: e.students.filter(s => s.code).length }), 3000);
      X().showTab(tab || X().ui.tab);
      /* hojas ya escaneadas y guardadas que aún no llegaron al campus (p. ej. de antes de activar el envío automático): se mandan al abrir la prueba */
      if (autoOn() && !Y.noKey) { const pend = ready().filter(s => !s.sent); if (pend.length) { pend.forEach(s => Q.map.set(s.id, s)); clearTimeout(Q.t); Q.t = setTimeout(flushAuto, 1500); } }
    } catch (err) {
      if (id !== Y.id) return;
      Y.state = 'error'; Y.err = err.status === 401 ? T('cpErr401') : (err.status === 409 || err.status === 404 || err.code === 'not-paper' || err.code === 'notfound') ? T('cpErrNot') : T('cpErrGen', { m: err.message });
      redraw();
    }
  }
  const redraw = () => { if (X() && X().ui.tab === 'campus') { const v = $('#view'); if (v) { v.innerHTML = render(); } } };

  function keyBody() {
    const e = X().exam;
    /* penalización: null = la de la prueba en Notas; si en el corrector se elige otra, se guarda con la clave (si no, el campus calcularía otra nota) */
    const pf = penOf(e), ap = e.campus && e.campus.apen != null ? e.campus.apen : null;
    const penalty = ap != null && Math.abs(pf - ap) < 1e-9 ? null : Math.min(1, Math.round(pf * 1e6) / 1e6);
    const body = { nq: e.nq, nopt: e.nopt, versions: e.versions, keys: {}, annulled: [], weights: e.weightsOn ? e.weights.map(Number) : [], penalty };
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
    if (!Y.id || Y.state !== 'ok' || !active()) { const o = $('#cpbadge'); if (o) o.hidden = true; return; }
    const el = badge(); el.hidden = false;
    const dirty = sig() !== S.base, cls = S.fail ? 'bad' : S.saving ? 'wait' : dirty ? 'warn' : 'ok';
    const txt = S.fail ? T('cpFail') : S.saving ? T('cpSaving') : dirty ? T('cpUnsaved') : (S.at ? T('cpSaved', { t: hhmm(S.at) }) : T('cpNoKeyYet'));
    const html = `<span class="cpdot ${cls}"></span><span>${esc(txt)}</span>${dirty || S.fail ? `<button type="button" class="btn small">${T('cpSaveNow')}</button>` : ''}`;
    if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html; }
  }
  async function saveKey(manual) {
    if (S.saving || !active()) return;
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
      if (Y.state !== 'ok' || S.saving || S.base === null || !active()) return;
      const d = sig() !== S.base;
      if (d && (S.fail ? Date.now() - S.try > 8000 : Date.now() - S.chg > 1500)) { S.try = Date.now(); saveKey(false); }
      if (d && !S.dd) S.chg = Date.now(); S.dd = d;
      paint();
    }, 700);
  }
  const ready = () => X().exam.students.filter(s => s.scanned && s.code);
  /* envío automático de cada hoja al guardarla: se agrupan unos instantes y se mandan juntas; lo que falle queda pendiente (sin «sent») */
  const autoOn = () => !(X().exam.campus && X().exam.campus.auto === false);
  const Q = { map: new Map(), t: 0, warned: false };
  async function flushAuto() {
    Q.t = 0; if (!active() || !Q.map.size) return;
    const e = X().exam, list = [...Q.map.values()].filter(s => s.code && s.scanned); Q.map.clear(); if (!list.length) return;
    if (Y.noKey) { if (!Q.warned) { Q.warned = true; K.toast(T('cpAutoNoKey'), 6000); } return; }
    const name = (s) => [s.last, s.first].filter(Boolean).join(', ') || s.name || s.code;
    try {
      const results = list.map(s => ({ code: s.code, version: s.version, answers: s.answers.slice(0, e.nq).map(a => a || '') }));
      const r = await api('/api/corrector/results', { method: 'POST', body: { assessment_id: +Y.id, results } });
      const bad = new Set(); [].concat(r.unmatched || [], r.errors || [], r.duplicates || []).forEach(x => { const t = typeof x === 'string' ? x : (x.code || '') + ' ' + (x.msg || ''); list.forEach(s => { if (t.includes(s.code)) bad.add(s.id); }); });
      list.forEach(s => { if (!bad.has(s.id) && (r.saved || 0) > 0) s.sent = Date.now(); });
      e.campus.last = { at: Date.now(), saved: r.saved }; X().changed(); Y.res = r;
      const failed = list.filter(s => bad.has(s.id)), okN = list.length - failed.length;
      if (okN === 1 && !failed.length) K.toast(T('cpAutoOk', { n: name(list[0]) }), 2600); else if (okN) K.toast(T('cpSent', { s: okN }), 2600);
      failed.forEach(s => { const m = [].concat(r.unmatched || [], r.errors || []).map(x => (typeof x === 'string' ? x : (x.msg || ''))).find(Boolean) || ''; K.toast(T('cpAutoFail', { n: name(s), m }), 7000); });
    } catch (err) { K.toast(T('cpAutoFail', { n: list.length > 1 ? list.length : name(list[0]), m: err.message }), 6000); }
    redraw();
  }
  /* quitar del campus el resultado de un alumno (ya enviado o no): true si se puede seguir quitándolo en local */
  async function removeResult(s) {
    if (!active() || !s || !s.code) return true;
    const call = (force) => api('/api/corrector/results/remove', { method: 'POST', body: { assessment_id: +Y.id, code: s.code, force: !!force } });
    try { await call(false); }
    catch (err) {
      if (err.code === 'manual') { if (!(await K.confirm(T('cpUnscanManual'), { danger: true }))) return false; try { await call(true); } catch (e2) { K.toast(T('cpUnscanFail', { m: e2.message }), 5000); return false; } }
      else if (err.status === 404) { /* nunca llegó al campus: nada que quitar */ }
      else { K.toast(T('cpUnscanFail', { m: err.message }), 5000); return false; }
    }
    Q.map.delete(s.id); K.toast(T('cpUnscanOk'), 2600); return true;
  }
  /* lo llama el escáner al guardar una hoja (también al corregir una ya guardada) */
  function onSaved(s) { if (!active() || !autoOn() || !s || !s.code) return; delete s.sent; Q.map.set(s.id, s); clearTimeout(Q.t); Q.t = setTimeout(flushAuto, 700); }
  /* otro examen: se mira si es del campus (se recarga su clave y su lista) o libre (se deja de vigilar la clave) */
  function attach(id) { Y.id = id == null ? null : String(id); Y.state = 'off'; Y.res = null; Y.noKey = false; S.base = null; S.at = 0; S.fail = false; if (Y.id) load(true); else paint(); }
  let started = false;
  function followExam() { if (!started || Y.state === 'loading') return; const e = X().exam; if (e && e.campus && e.campus.id != null) { if (String(e.campus.id) !== String(Y.id) || Y.state === 'off') attach(e.campus.id); } else if (Y.id) attach(null); }
  async function send() {
    const e = X().exam, list = ready();
    if (!list.length) { K.toast(T('cpNothing'), 2800); return; }
    if (!(await K.confirm(T('cpConfirm', { n: list.length, name: e.name })))) return;
    Y.busy = true; redraw();
    try {
      const results = list.map(s => ({ code: s.code, version: s.version, answers: e.versions.length ? s.answers.slice(0, e.nq).map(a => a || '') : [] }));
      const r = await api('/api/corrector/results', { method: 'POST', body: { assessment_id: +Y.id, results } });
      Y.res = r; list.forEach(s => { s.sent = Date.now(); }); e.campus.last = { at: Date.now(), saved: r.saved }; X().changed(); K.toast(T('cpSent', { s: r.saved }), 3500);
    } catch (err) { Y.res = { fail: err.message }; K.toast(T('cpErrGen', { m: err.message }), 5000); }
    Y.busy = false; redraw();
  }

  /* lista de pruebas en papel del campus (en la pestaña «Examen») */
  function listPanel() { return MODE ? `<section class="panel stack" id="cpexams"><div class="row spread"><h2 style="margin:0">${T('cpListTitle')}</h2><button class="btn small" data-act="c:new">${T('cpNew')}</button></div><p class="muted" style="margin:0">${T('cpListHelp')}</p><div class="cplist" id="cpexams-body"><small class="muted">${T('cpLoading')}</small></div></section>` : ''; }
  async function mountList() {
    const box = $('#cpexams-body'); if (!box) return;
    try {
      const r = await api('/api/corrector/campus-exams'); if ($('#cpexams-body') !== box) return;
      const cur = active() ? String(Y.id) : '';
      const card = (a) => `
        <div class="stat"><b style="font-size:1.1rem">${esc(a.title)}</b>
          <span>${esc([a.ud, a.tema ? 'Tema ' + a.tema : ''].filter(Boolean).join(' · '))}${(a.ud || a.tema) && a.date ? ' · ' : ''}${a.date ? esc(K.fmtDate(a.date)) : ''}</span>
          <span><span class="chip ${a.has_key ? 'accent' : 'warn'}">${T(a.has_key ? 'cpKeyYes' : 'cpKeyNo')}</span> ${a.nq ? a.nq + ' ' + T('qs') : ''}${a.scanned ? ' · ' + T('cpCorrN', { n: a.scanned }) : ''}</span>
          <div class="row" style="margin-top:10px">${String(a.id) === cur ? `<span class="chip accent">${T('cpCurrent')}</span>` : `<button class="btn small" data-act="c:open" data-id="${a.id}" data-key="${a.has_key ? 1 : 0}">${T('cpOpen')}</button>`}</div></div>`;
      /* agrupadas por asignatura (por orden alfabético); dentro de cada una, la más reciente primero */
      const by = new Map(); r.exams.forEach(a => { if (!by.has(a.subject_title)) by.set(a.subject_title, []); by.get(a.subject_title).push(a); });
      const subs = [...by.keys()].sort((x, y) => x.localeCompare(y, K.locale()));
      box.innerHTML = r.exams.length ? subs.map(n => `<h3 style="margin:14px 0 6px">${esc(n)} <small class="muted">${by.get(n).length}</small></h3><div class="grid cols-2">${by.get(n).map(card).join('')}</div>`).join('') : `<small class="muted">${T('cpNone')}</small>`;
    } catch (_) { box.innerHTML = `<small class="muted">${T('cpListErr')}</small>`; }
  }
  async function newAssessment() {
    let subs; try { subs = (await api('/api/admin/subjects')).subjects.filter(x => !x.archived); } catch (err) { K.toast(T('cpErrGen', { m: err.message }), 4000); return; }
    const d = document.createElement('dialog'); d.className = 'kit-dialog';
    d.innerHTML = `<h2>${T('cpNewTitle')}</h2><p class="muted">${T('cpNewHelp')}</p>
      <label class="field">${T('cpSubject')}<select id="na-s">${subs.map(x => `<option value="${x.id}" data-m="${esc(x.eval_model || '')}">${esc(x.title_es)}</option>`).join('')}</select></label>
      <label class="field">${T('cpTitleF')}<input type="text" id="na-t" maxlength="160"></label>
      <div class="grid cols-2"><label class="field">${T('cpDateF')}<input type="date" id="na-d" value="${new Date().toISOString().slice(0, 10)}"></label>
        <label class="field">${T('cpKindF')}<select id="na-k"><option value="1">${T('cpExam')}</option><option value="0">${T('cpForm')}</option></select></label></div>
      <div class="grid cols-2"><label class="field">${T('cpWeight')}<input type="number" id="na-w" min="0.1" step="0.1" value="1"></label>
        <label class="field" id="na-rw" hidden>${T('cpRa')}<select id="na-r"></select></label></div>
      <div class="row"><button class="btn ghost" data-r="0">${T('cpCancel')}</button><button class="btn" data-r="1">${T('cpCreate')}</button></div>`;
    document.body.append(d); d.showModal();
    const q = (i) => d.querySelector('#' + i);
    const fillRa = async () => {
      const o = q('na-s').selectedOptions[0], m = o && o.dataset.m; q('na-rw').hidden = !(m === 'ra' || m === 'logse'); if (q('na-rw').hidden) return;
      try { const r = await api('/api/admin/ras?subject=' + o.value); q('na-r').innerHTML = `<option value="">${T('cpNoRa')}</option>` + r.ras.map(x => `<option value="${x.id}">${esc((x.code || '') + ' ' + x.title)}</option>`).join(''); } catch (_) { q('na-rw').hidden = true; }
    };
    q('na-s').addEventListener('change', fillRa); fillRa();
    d.addEventListener('click', async (ev) => {
      const r = ev.target.closest('[data-r]'); if (!r) return;
      if (r.dataset.r === '0') { d.close(); return; }
      const title = q('na-t').value.trim(); if (!title) { q('na-t').focus(); return; }
      try {
        const res = await api('/api/admin/assessments', { method: 'POST', body: { subject_id: q('na-s').value, title, date: q('na-d').value, total: 0, modalidad: 'papel', is_exam: q('na-k').value === '1', weight: q('na-w').value, ra_id: q('na-rw').hidden ? '' : q('na-r').value, published: 0 } });
        d.close(); openAssessment(res.id);
      } catch (err) { K.toast(T('cpNewErr', { m: err.message }), 5000); }
    });
    d.addEventListener('close', () => d.remove());
  }
  function openAssessment(id, tab) { tab = tab || 'campus'; if (active() && String(Y.id) === String(id)) { X().showTab(tab); return; } Y.id = String(id); Y.state = 'off'; Y.res = null; S.base = null; S.at = 0; try { history.replaceState(null, '', '?assessment=' + encodeURIComponent(id)); } catch (_) { /* nada */ } load(false, tab); }

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
      <label class="check"><input type="checkbox" data-act="c:auto" ${autoOn() ? 'checked' : ''}> ${T('cpAuto')}</label><small class="muted">${T('cpAutoHelp')}</small>
      ${n ? `<small class="muted">${T('cpSentN', { n: e.students.filter(s => s.sent).length, t: n })}</small>` : ''}
      <div class="row"><button class="btn big" data-act="c:send" ${n && !Y.busy ? '' : 'disabled'}>${Y.busy ? T('cpSending') : T('cpSendBtn')}</button></div>
      ${last ? `<small class="muted">${T('cpLast', { d: new Date(last.at).toLocaleString(K.locale()), s: last.saved })}</small>` : ''}
      ${r && r.fail ? `<div class="banner-warn" role="alert">${esc(r.fail)}</div>` : ''}
      ${r && !r.fail ? `<div class="fb good" role="status">${T('cpSent', { s: r.saved })}</div>${lst('cpUnmatched', r.unmatched)}${lst('cpDup', r.duplicates)}${lst('cpErrors', r.errors)}` : ''}
      <small class="muted">${T('cpPrivacy')}</small></section>`;
  }
  function init() {
    if (!MODE) return;
    $('#app').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-act^="c:"]'); if (!b) return; const a = b.dataset.act;
      if (a === 'c:auto') { const e = X().exam; e.campus.auto = b.checked; X().changed(); if (b.checked) { ready().filter(s => !s.sent).forEach(s => Q.map.set(s.id, s)); clearTimeout(Q.t); Q.t = setTimeout(flushAuto, 300); } return; }
      if (a === 'c:new') newAssessment(); else if (a === 'c:open') openAssessment(b.dataset.id, b.dataset.key === '1' ? 'scan' : 'key'); else if (a === 'c:reload') load(false); else if (a === 'c:key') saveKey(true); else if (a === 'c:send') send();
      else if (a === 'c:pv') X().openPreview('personal'); else if (a === 'c:pr') X().doPrint(X().docFor('personal'));
    });
  }
  function start() {
    if (!MODE) return;
    const back = () => { const l = document.querySelector('.kit-back .lbl'); if (l) l.textContent = T('backCampus'); }; back(); K.onLang(back);
    X().TABS.splice(X().TABS.indexOf('scan') + 1, 0, 'campus'); watch();      // la pestaña solo se muestra cuando el examen abierto es del campus
    /* con ?assessment=… se carga esa prueba (load marca «cargando» al instante, así followExam no la suelta); sin él se sigue el examen abierto */
    if (Y.id && /^\d+$/.test(Y.id)) { load(true, hashTab()); started = true; } else { Y.id = null; started = true; followExam(); }
  }
  C.uiCampus = { render, mount() { /* nada */ }, init, start, toExam, keyBody, state: Y, listPanel, mountList, followExam, active, mode: MODE, onSaved, removeResult, openAssessment, newAssessment, listExams: async () => (await api('/api/corrector/campus-exams')).exams };
})();
