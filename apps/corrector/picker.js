/* ============================================================
   Corrector de tests · selector de examen
   Un solo sitio para cambiar de examen: botón «Cambiar examen» de la cabecera → ventana con buscador, el examen abierto, los recientes,
   las pruebas en papel del campus agrupadas por asignatura (solo en el campus) y los exámenes libres. Un clic abre el examen; si es
   una prueba del campus con clave se abre directamente en «Escanear» (lo que se hace al corregir).
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {}), K = window.AppKit, esc = K.esc;
  const store = K.storage('corrector');
  const D = window.CORR_I18N;
  const add = (lang, o) => Object.assign(D[lang], o);
  add('es', { pickChange: 'Cambiar examen', pickTitle: 'Elegir examen', pickSearch: 'Buscar por nombre o asignatura…', pickNow: 'Abierto ahora', pickRecent: 'Recientes', pickCampus: 'Pruebas en papel del campus', pickFree: 'Mis exámenes (libres)', pickNone: 'Nada coincide con la búsqueda.', pickLoading: 'Cargando las pruebas del campus…', pickMeta: '{q} preg. · {s} alumnado', pickScanned: '{n} escaneadas', pickNewCampus: '+ Nueva prueba en el campus', pickNewFree: '+ Examen libre', pickClose: 'Cerrar', pickEmptyFree: 'Aún no tienes exámenes libres.' });
  add('ca', { pickChange: 'Canvia d’examen', pickTitle: 'Tria examen', pickSearch: 'Cerca per nom o assignatura…', pickNow: 'Obert ara', pickRecent: 'Recents', pickCampus: 'Proves en paper del campus', pickFree: 'Els meus exàmens (lliures)', pickNone: 'Res no coincideix amb la cerca.', pickLoading: 'Carregant les proves del campus…', pickMeta: '{q} preg. · {s} alumnat', pickScanned: '{n} escanejades', pickNewCampus: '+ Nova prova al campus', pickNewFree: '+ Examen lliure', pickClose: 'Tanca', pickEmptyFree: 'Encara no tens exàmens lliures.' });
  add('en', { pickChange: 'Change exam', pickTitle: 'Choose an exam', pickSearch: 'Search by name or subject…', pickNow: 'Open now', pickRecent: 'Recent', pickCampus: 'Paper exams in the campus', pickFree: 'My exams (free)', pickNone: 'Nothing matches the search.', pickLoading: 'Loading the campus exams…', pickMeta: '{q} q. · {s} students', pickScanned: '{n} scanned', pickNewCampus: '+ New exam in the campus', pickNewFree: '+ Free exam', pickClose: 'Close', pickEmptyFree: 'You have no free exams yet.' });
  const t = (k, p) => K.t(k, p);
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const X = () => C.ctx, U = () => C.uiCampus;

  /* ---------- recientes (solo de este dispositivo) ---------- */
  const recent = () => { const r = store.get('recent', []); return Array.isArray(r) ? r : []; };
  function touch(exam) {
    if (!exam || !exam.id) return;
    const e = { id: exam.id, name: exam.name || '', campusId: exam.campus && exam.campus.id != null ? exam.campus.id : null, subject: exam.campus && exam.campus.subjectTitle || '' };
    const cur = recent();
    if (cur[0] && cur[0].id === e.id && cur[0].name === e.name) return;
    store.set('recent', [e].concat(cur.filter(x => x.id !== e.id)).slice(0, 8));
  }

  /* ---------- datos ---------- */
  let campusCache = null, campusAt = 0;
  async function campusExams(force) {
    if (!U() || !U().mode) return [];
    if (!force && campusCache && Date.now() - campusAt < 15000) return campusCache;
    campusCache = await U().listExams(); campusAt = Date.now(); return campusCache;
  }
  const countScanned = (e) => (e.students || []).filter(s => s.scanned).length;

  /* ---------- ventana ---------- */
  let dlg = null;
  function open() {
    if (dlg) return;
    const ex = X().exam;
    dlg = document.createElement('dialog'); dlg.className = 'kit-dialog pick';
    dlg.innerHTML = `<div class="row spread"><h2 style="margin:0">${t('pickTitle')}</h2><button class="btn ghost small" data-pk="close">${t('pickClose')}</button></div>
      <input type="search" id="pk-q" placeholder="${esc(t('pickSearch'))}" aria-label="${esc(t('pickSearch'))}" autocomplete="off">
      <div class="pk-list" id="pk-list" role="listbox"></div>
      <div class="row pk-foot">${U() && U().mode ? `<button class="btn small" data-pk="newc">${t('pickNewCampus')}</button>` : ''}<button class="btn ghost small" data-pk="newf">${t('pickNewFree')}</button><button class="btn ghost small" data-pk="demo">${t('demo')}</button></div>`;
    document.body.append(dlg); dlg.showModal();
    const q = dlg.querySelector('#pk-q'); let camp = null, loading = !!(U() && U().mode);
    const draw = () => {
      const term = fold(q.value.trim()); const match = (...a) => !term || fold(a.join(' ')).includes(term);
      const used = new Set(); const items = [];
      const local = X().listExams();
      const cur = local.find(e => e.id === ex.id) || { id: ex.id, name: ex.name, date: ex.date, nq: ex.nq, students: ex.students.length, scanned: countScanned(ex), campusId: ex.campus && ex.campus.id };
      const row = (o) => `<button type="button" class="pk-row${o.cur ? ' cur' : ''}" role="option" data-pk="open" data-kind="${o.kind}" data-id="${esc(o.id)}" ${o.cur ? 'aria-selected="true"' : ''}>
        <b>${esc(o.name || t('untitled'))}</b><span class="pk-sub">${o.sub ? esc(o.sub) + ' · ' : ''}${o.date ? esc(K.fmtDate(o.date)) + ' · ' : ''}${esc(o.meta)}</span>${o.chips || ''}</button>`;
      const sec = (title, rows, empty) => rows.length ? `<h3 class="pk-h">${title}</h3>${rows.join('')}` : (empty ? `<h3 class="pk-h">${title}</h3><p class="muted pk-empty">${empty}</p>` : '');
      let html = '';
      /* abierto ahora */
      if (match(cur.name, ex.campus && ex.campus.subjectTitle)) {
        html += sec(t('pickNow'), [row({ cur: true, kind: cur.campusId != null ? 'c' : 'l', id: cur.campusId != null ? cur.campusId : cur.id, name: cur.name, sub: ex.campus && ex.campus.subjectTitle || '', date: cur.date, meta: t('pickMeta', { q: cur.nq, s: cur.students }) + (cur.scanned ? ' · ' + t('pickScanned', { n: cur.scanned }) : '') })]);
      }
      used.add(ex.id);
      /* recientes */
      const rec = recent().filter(r => r.id !== ex.id && match(r.name, r.subject)).filter(r => r.campusId != null || local.some(e => e.id === r.id)).slice(0, 5);
      rec.forEach(r => used.add(r.id));
      html += sec(t('pickRecent'), rec.map(r => row({ kind: r.campusId != null ? 'c' : 'l', id: r.campusId != null ? r.campusId : r.id, name: r.name, sub: r.subject, meta: r.campusId != null ? '' : (() => { const e = local.find(x => x.id === r.id); return e ? t('pickMeta', { q: e.nq, s: e.students }) : ''; })() }).replace(' · </span>', '</span>')));
      /* campus, por asignatura */
      if (U() && U().mode) {
        if (loading) html += `<h3 class="pk-h">${t('pickCampus')}</h3><p class="muted pk-empty">${t('pickLoading')}</p>`;
        else if (camp) {
          const list = camp.filter(a => String(a.id) !== String(ex.campus && ex.campus.id) && match(a.title, a.subject_title));
          const by = new Map(); list.forEach(a => { if (!by.has(a.subject_title)) by.set(a.subject_title, []); by.get(a.subject_title).push(a); });
          const subs = [...by.keys()].sort((x, y) => x.localeCompare(y, K.locale()));
          if (subs.length) html += `<h3 class="pk-h">${t('pickCampus')}</h3>` + subs.map(n => `<div class="pk-subj">${esc(n)}</div>` + by.get(n).map(a => row({ kind: 'c', id: a.id, name: a.title, date: a.date, meta: (a.nq ? a.nq + ' ' + t('qs') : ''), chips: `<span class="pk-chips"><span class="chip ${a.has_key ? 'accent' : 'warn'}">${t(a.has_key ? 'cpKeyYes' : 'cpKeyNo')}</span>${a.scanned ? `<span class="chip">${t('cpCorrN', { n: a.scanned })}</span>` : ''}</span>` }).replace(' · </span>', '</span>')).join('')).join('');
        }
      }
      /* libres */
      const free = local.filter(e => !String(e.id).startsWith('campus-') && e.id !== ex.id && match(e.name));
      html += sec(t('pickFree'), free.map(e => row({ kind: 'l', id: e.id, name: e.name, date: e.date, meta: t('pickMeta', { q: e.nq, s: e.students }) + (e.scanned ? ' · ' + t('pickScanned', { n: e.scanned }) : '') })), term ? '' : (local.some(e => !String(e.id).startsWith('campus-') && e.id !== ex.id) ? '' : t('pickEmptyFree')));
      if (!html.trim() || (term && !/pk-row/.test(html))) html = `<p class="muted pk-empty">${t('pickNone')}</p>` + html;
      dlg.querySelector('#pk-list').innerHTML = html;
    };
    draw(); q.focus();
    if (U() && U().mode) campusExams().then(r => { camp = r; loading = false; if (dlg) draw(); }).catch(() => { camp = []; loading = false; if (dlg) draw(); });
    q.addEventListener('input', draw);
    q.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const f = dlg.querySelector('.pk-row:not(.cur)'); if (f) f.click(); } });
    const close = () => { try { dlg.close(); } catch (_) { /* nada */ } };
    dlg.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-pk]'); if (!b) { if (ev.target === dlg) close(); return; }
      const a = b.dataset.pk;
      if (a === 'close') close();
      else if (a === 'open') {
        const id = b.dataset.id, kind = b.dataset.kind; close();
        if (b.classList.contains('cur')) { X().showTab(X().ui.tab); return; }
        if (kind === 'c') { const info = (camp || campusCache || []).find(x => String(x.id) === String(id)); U().openAssessment(id, info && info.has_key ? 'scan' : 'key'); }
        else X().openLocal(id);
      } else if (a === 'newc') { close(); U().newAssessment(); }
      else if (a === 'newf') { close(); X().newExam(); }
      else if (a === 'demo') { close(); X().demo(); }
    });
    dlg.addEventListener('close', () => { dlg.remove(); dlg = null; });
  }

  C.uiPicker = { open, touch, init() { /* el clic sobre [data-act="pick"] lo recoge corrector.js */ } };
})();
