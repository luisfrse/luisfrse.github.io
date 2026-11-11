/* ============================================================
   Corrector de tests · pestaña «Alumnado»: tabla, importación, códigos, listas («mis clases»)
   ============================================================ */
(() => {
  'use strict';
  const C = window.CORR, K = window.AppKit, esc = K.esc, R = C.roster;
  const X = () => C.ctx, T = (k, p) => K.t(k, p);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ui2 = { stab: 'table', list: null, sortK: 'n', sortDir: 1, onlyNoCode: false };
  const AI_PROMPT = 'Convierte la siguiente lista de alumnos en un CSV con las columnas: apellidos;nombre;grupo (separadas por punto y coma, una persona por línea, con cabecera, sin texto adicional). Pon los apellidos en la primera columna y el nombre de pila en la segunda. Lista:\n\n';

  /* ---------- fuente de datos: examen o lista ---------- */
  function source() {
    const x = X();
    if (ui2.stab === 'lists') {
      const l = R.lists.get(ui2.list);
      return { kind: 'list', ref: l, rows: l ? l.students : [], L: l ? (l.codeLen || 4) : 4, check: l ? !!l.codeCheck : false, mode: l ? l.codeMode || 'random' : 'random', save() { if (l) { R.lists.put(l); } }, add(r) { return R.newStudent(r); }, answers: false };
    }
    const e = x.exam;
    return { kind: 'exam', ref: e, rows: e.students, L: e.codeLen, check: e.codeCheck, mode: e.codeMode, save() { x.changed(); }, add(r) { return { id: K.uid(), name: '', last: R.clean(r.last), first: R.clean(r.first), group: R.clean(r.group), code: r.code || '', version: e.versions[0], answers: Array(e.nq).fill('') }; }, answers: true };
  }
  const setName = (s) => { if (s.last || s.first) s.name = R.display(s); };
  function codeStats(src) {
    const cnt = new Map(); src.rows.forEach(s => { if (s.code) cnt.set(s.code, (cnt.get(s.code) || 0) + 1); });
    let dup = 0, bad = 0, missing = 0;
    src.rows.forEach(s => { if (!s.code) missing++; else { if (cnt.get(s.code) > 1) dup++; if (!R.validCode(s.code, src.L, src.check)) bad++; } });
    return { missing, dup, bad, withCode: src.rows.length - missing, cnt };
  }
  /* ---------- generación de códigos ---------- */
  function assignCodes(src, which) {   // which: 'missing' | 'all'
    const targets = src.rows.filter(s => which === 'all' || !s.code || !R.validCode(s.code, src.L, src.check) || (codeStats(src).cnt.get(s.code) > 1 && which === 'fix'));
    const used = new Set(which === 'all' ? [] : src.rows.filter(s => !targets.includes(s) && s.code).map(s => s.code));
    const codes = R.genCodes(targets.length, { L: src.L, mode: src.mode, check: src.check, used });
    if (!codes) { K.toast(T('codesNoRoom', { max: R.maxStudents(src.L, src.check) }), 4200); return 0; }
    targets.forEach((s, i) => { s.code = codes[i]; });
    return targets.length;
  }

  /* ---------- pestaña ---------- */
  function subTabs() {
    return `<div class="seg" role="group" aria-label="${esc(T('studentsTitle'))}">${[['table', 'stTable'], ['answers', 'stAnswers'], ['lists', 'stLists']].map(([k, l]) => `<button type="button" data-act="x:stab" data-v="${k}" aria-pressed="${ui2.stab === k}">${T(l)}</button>`).join('')}</div>`;
  }
  function render(oldView) {
    if (ui2.stab === 'answers') return `<div class="row">${subTabs()}</div>${oldView()}`;
    const src = source();
    if (ui2.stab === 'lists') return `<div class="row">${subTabs()}</div>${viewLists(src)}`;
    return `<div class="row">${subTabs()}</div>${viewTable(src)}`;
  }
  const sortRows = (rows) => {
    const k = ui2.sortK, d = ui2.sortDir, f = (s) => k === 'code' ? (s.code || '~') : k === 'last' ? R.fold(s.last || s.name) : k === 'first' ? R.fold(s.first) : k === 'group' ? R.fold(s.group) : 0;
    return k === 'n' ? rows.slice() : rows.slice().sort((a, b) => (f(a) < f(b) ? -1 : f(a) > f(b) ? 1 : 0) * d);
  };
  const th = (k, label) => `<th ${ui2.sortK === k ? `aria-sort="${ui2.sortDir === 1 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-act="x:ssort" data-k="${k}">${esc(label)}</button></th>`;

  function viewTable(src) {
    const st = codeStats(src), e = X().exam, multi = e.versions.length > 1, q = (X().ui.filter || '').trim().toLowerCase();
    const legacy = src.rows.some(s => s.name && !s.last && !s.first);
    return `
    <section class="panel stack">
      <div class="row spread"><h2 style="margin:0">${T('studentsTitle')} <span class="chip">${src.rows.length}</span></h2>
        <div class="row"><button class="btn small" data-act="x:import">${T('impBtn')}</button><button class="btn ghost small" data-act="x:fromlist">${T('fromList')}</button><button class="btn ghost small" data-act="x:tolist" ${src.rows.length ? '' : 'disabled'}>${T('toList')}</button></div></div>
      <form class="addrow" data-form="x:add" autocomplete="off">
        <input name="last" placeholder="${esc(T('colLast'))}" aria-label="${esc(T('colLast'))}"><input name="first" placeholder="${esc(T('colFirst'))}" aria-label="${esc(T('colFirst'))}">
        <input name="group" placeholder="${esc(T('colGroup'))}" aria-label="${esc(T('colGroup'))}"><input name="code" inputmode="numeric" placeholder="${esc(T('colCode'))}" aria-label="${esc(T('colCode'))}"><button class="btn small" type="submit">${T('add')}</button></form>
      <div class="row">${src.rows.length > 6 ? `<input type="search" id="sfilter2" class="grow" placeholder="${esc(T('search'))}" aria-label="${esc(T('search'))}" value="${esc(X().ui.filter)}" style="max-width:320px">` : ''}
        ${legacy ? `<button class="btn ghost small" data-act="x:split">${T('splitNames')}</button>` : ''}<button class="btn danger small" data-act="x:delall" ${src.rows.length ? '' : 'disabled'}>${T('deleteAll')}</button></div>
      ${legacy ? `<small class="muted">${T('legacyNote')}</small>` : ''}
      <div class="table-wrap"><table class="kit stbl"><thead><tr><th>#</th>${th('code', T('colCode'))}${th('last', T('colLast'))}${th('first', T('colFirst'))}${th('group', T('colGroup'))}${multi ? `<th>${T('colVersion')}</th>` : ''}<th>${T('colAnswers')}</th><th><span class="sr-only">${T('actions')}</span></th></tr></thead>
      <tbody id="stbody">${rowsHtml(src, q, st, multi)}</tbody></table></div>
      ${src.rows.length ? '' : `<div class="empty">${T('noStudents')}</div>`}
      <small class="muted">🔒 ${T('privacyStudents')}</small>
    </section>
    ${codesPanel(src, st)}`;
  }
  function rowsHtml(src, q, st, multi) {
    const rows = sortRows(src.rows), idx = new Map(src.rows.map((s, i) => [s.id, i + 1]));
    return rows.filter(s => !q || (R.display(s) + ' ' + s.code + ' ' + s.group).toLowerCase().includes(q)).map(s => {
      const dup = s.code && st.cnt.get(s.code) > 1, bad = s.code && !R.validCode(s.code, src.L, src.check);
      const nA = src.answers ? (s.answers || []).filter(Boolean).length : 0;
      const nameLast = s.last || (s.first ? '' : s.name);
      return `<tr data-id="${s.id}"><td class="n" data-l="#">${idx.get(s.id)}</td>
        <td data-l="${esc(T('colCode'))}"><input class="c-code ${dup || bad ? 'bad' : ''}" data-sf="code" inputmode="numeric" value="${esc(s.code || '')}" ${dup ? `title="${esc(T('codeDup'))}"` : bad ? `title="${esc(T('codeBad', { n: src.L }))}"` : ''} aria-label="${esc(T('colCode'))}"></td>
        <td data-l="${esc(T('colLast'))}"><input data-sf="last" value="${esc(nameLast)}" aria-label="${esc(T('colLast'))}"></td>
        <td data-l="${esc(T('colFirst'))}"><input data-sf="first" value="${esc(s.first || '')}" aria-label="${esc(T('colFirst'))}"></td>
        <td data-l="${esc(T('colGroup'))}"><input data-sf="group" value="${esc(s.group || '')}" aria-label="${esc(T('colGroup'))}"></td>
        ${multi && src.answers ? `<td data-l="${esc(T('colVersion'))}"><select data-sf="version" aria-label="${esc(T('colVersion'))}">${X().exam.versions.map(v => `<option ${v === s.version ? 'selected' : ''}>${v}</option>`).join('')}</select></td>` : multi ? '<td></td>' : ''}
        <td data-l="${esc(T('colAnswers'))}">${src.answers ? `<span class="pill">${nA}/${X().exam.nq}</span>${s.scanned ? `<span class="pill g-ok" title="${esc(T('scannedAt', { d: new Date(s.scanned).toLocaleString(K.locale()) }))}">📷</span>` : ''}` : ''}</td>
        <td class="act">${src.answers ? `<button class="btn ghost small" data-act="x:edans" data-id="${s.id}">${T('answersBtn')}</button>` : ''}<button class="btn ghost small" data-act="x:del" data-id="${s.id}" aria-label="${esc(T('removeStudent'))}">✕</button></td></tr>`;
    }).join('');
  }
  function codesPanel(src, st) {
    return `<section class="panel stack"><h2 style="margin:0">${T('codesTitle')}</h2><p class="muted" style="margin:0">${T('codesHelp')}</p>
      <div class="grid cols-3">
        <label class="field">${T('codeLen')}<select data-sf2="codeLen">${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option ${n === src.L ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="field"><span style="font-weight:600">${T('codeMode')}</span><div class="seg">${[['random', 'codeRandom'], ['seq', 'codeSeq']].map(([v, l]) => `<button type="button" data-act="x:cmode" data-v="${v}" aria-pressed="${src.mode === v}">${T(l)}</button>`).join('')}</div></div>
        <label class="check" style="align-self:end"><input type="checkbox" data-sf2="codeCheck" ${src.check ? 'checked' : ''}> ${T('codeCheck')}</label></div>
      <small class="muted">${T('codeCheckHelp')}</small>
      <div class="row"><span class="chip ${st.missing ? 'warn' : 'accent'}">${T('codesWith', { a: st.withCode, n: src.rows.length })}</span>${st.dup ? `<span class="chip warn">${T('codesDup', { n: st.dup })}</span>` : ''}${st.bad ? `<span class="chip warn">${T('codesBad', { n: st.bad })}</span>` : ''}</div>
      <div class="row"><button class="btn small" data-act="x:gen" data-v="missing" ${src.rows.length ? '' : 'disabled'}>${T('genMissing')}</button><button class="btn ghost small" data-act="x:gen" data-v="all" ${src.rows.length ? '' : 'disabled'}>${T('genAll')}</button>
        ${src.kind === 'exam' ? `<button class="btn ghost small" data-act="pv-codes" ${src.rows.length ? '' : 'disabled'}>${T('codesList')}</button><button class="btn ghost small" data-act="pv-cards" ${src.rows.length ? '' : 'disabled'}>${T('codesCards')}</button><button class="btn ghost small" data-act="x:codescsv" ${src.rows.length ? '' : 'disabled'}>${T('codesCsv')}</button>` : ''}</div>
      <small class="muted">${T('codesPrivacy')}</small></section>`;
  }

  /* ---------- listas («mis clases») ---------- */
  function viewLists(src) {
    const all = R.lists.all(); if (!ui2.list || !all.some(l => l.id === ui2.list)) ui2.list = all[0] ? all[0].id : null;
    const cur = R.lists.get(ui2.list), s2 = cur ? source() : null;
    return `<section class="panel stack"><div class="row spread"><h2 style="margin:0">${T('listsTitle')}</h2><div class="row"><button class="btn small" data-act="x:lnew">+ ${T('listNew')}</button></div></div>
      <p class="muted" style="margin:0">${T('listsHelp')}</p>
      ${all.length ? `<div class="row"><label class="sr-only" for="listsel">${T('listsTitle')}</label><select id="listsel" class="grow" style="max-width:340px">${all.map(l => `<option value="${l.id}" ${l.id === ui2.list ? 'selected' : ''}>${esc(l.name || T('untitled'))} (${l.students.length})</option>`).join('')}</select>
        <button class="btn ghost small" data-act="x:lren">${T('rename')}</button><button class="btn ghost small" data-act="x:ldup">${T('duplicate')}</button><button class="btn danger small" data-act="x:ldel">${T('delete')}</button>
        <button class="btn small" data-act="x:luse" ${cur && cur.students.length ? '' : 'disabled'}>${T('listUse')}</button></div>` : `<div class="empty">${T('noLists')}</div>`}</section>
      ${cur ? `<section class="panel stack"><div class="row spread"><h2 style="margin:0">${esc(cur.name || T('untitled'))} <span class="chip">${cur.students.length}</span></h2><div class="row"><button class="btn small" data-act="x:import">${T('impBtn')}</button></div></div>
        <form class="addrow" data-form="x:add" autocomplete="off"><input name="last" placeholder="${esc(T('colLast'))}"><input name="first" placeholder="${esc(T('colFirst'))}"><input name="group" placeholder="${esc(T('colGroup'))}"><input name="code" inputmode="numeric" placeholder="${esc(T('colCode'))}"><button class="btn small" type="submit">${T('add')}</button></form>
        <div class="table-wrap"><table class="kit stbl"><thead><tr><th>#</th>${th('code', T('colCode'))}${th('last', T('colLast'))}${th('first', T('colFirst'))}${th('group', T('colGroup'))}<th></th><th></th></tr></thead><tbody id="stbody">${rowsHtml(s2, '', codeStats(s2), false)}</tbody></table></div></section>${codesPanel(s2, codeStats(s2))}` : ''}`;
  }

  /* ---------- diálogos ---------- */
  function dlg(html, wide) {
    const d = document.createElement('dialog'); d.className = 'kit-dialog wide'; if (wide) d.style.width = 'min(760px,96vw)';
    d.innerHTML = html; d.addEventListener('close', () => d.remove()); document.body.append(d); d.showModal(); return d;
  }
  function prompt(title, value, okText) {
    return new Promise(res => {
      const d = dlg(`<h2>${esc(title)}</h2><input type="text" value="${esc(value || '')}" style="width:100%"><div class="row" style="margin-top:12px"><button class="btn ghost" data-r="0">${T('cancel')}</button><button class="btn" data-r="1">${esc(okText || T('ok'))}</button></div>`);
      const i = $('input', d); i.focus(); i.select();
      const done = (v) => { d.close(); res(v); };
      d.addEventListener('click', ev => { const r = ev.target.dataset && ev.target.dataset.r; if (r === '1') done(i.value.trim()); else if (r === '0') done(null); });
      i.addEventListener('keydown', ev => { if (ev.key === 'Enter') done(i.value.trim()); });
    });
  }
  /* importar: texto / CSV / Excel */
  function importDialog() {
    const src = source(), S = { rows: [], roles: [], header: false, mode: 'auto', name: '', err: '', skipDup: true, assign: true };
    const d = dlg(`<h2>${T('impTitle')}</h2><p class="muted" style="margin-top:0">${T('impHelp')}</p>
      <label class="field">${T('impPaste')}<textarea id="imp-text" rows="5" style="font-family:monospace" placeholder="${esc(T('impPh'))}"></textarea></label>
      <div class="row"><label class="btn ghost small" style="cursor:pointer">${T('impFile')}<input type="file" id="imp-file" accept=".csv,.tsv,.txt,.xlsx,.xls,text/csv,text/plain" hidden></label><span class="muted" id="imp-fn"></span>
        <button class="btn ghost small" data-r="tpl">${T('impTemplate')}</button></div>
      <div id="imp-err" class="fb bad" role="alert"></div><div id="imp-prev"></div>
      <details style="margin-top:8px"><summary style="cursor:pointer;font-weight:600">${T('impAI')}</summary><p class="muted">${T('impAIHelp')}</p><textarea readonly rows="4" style="font-size:.85rem">${esc(AI_PROMPT)}</textarea><button class="btn ghost small" data-r="aicopy">${T('copy')}</button></details>
      <div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn ghost" data-r="0">${T('cancel')}</button><button class="btn" data-r="go" id="imp-go" disabled>${T('impGo')}</button></div>`, true);
    const roles = ['skip', 'last', 'first', 'full', 'code', 'group'];
    const L = src.L;
    const compute = () => {
      const recs = R.toRecords(S.rows, S.roles, { header: S.header, mode: S.mode });
      recs.forEach(r => { if (r.code && r.code.length < L && /^\d+$/.test(r.code)) r.code = r.code.padStart(L, '0'); });
      return R.analyze(recs, src.rows, L, src.check);
    };
    const preview = () => {
      const box = $('#imp-prev', d), go = $('#imp-go', d);
      if (!S.rows.length) { box.innerHTML = ''; go.disabled = true; return; }
      const nc = Math.max(...S.rows.map(r => r.length)), an = compute();
      const dupN = an.filter(a => a.flags.includes('dupName') || a.flags.includes('dupCode')).length, badC = an.filter(a => a.flags.includes('badCode')).length;
      const n = an.length - (S.skipDup ? dupN : 0);
      box.innerHTML = `<h3 style="margin:10px 0 6px">${T('impPreview')}</h3>
        <label class="check"><input type="checkbox" data-o="header" ${S.header ? 'checked' : ''}> ${T('impHeader')}</label>
        <div class="table-wrap" style="max-height:230px"><table class="kit"><thead><tr>${Array.from({ length: nc }, (_, i) => `<th><select data-col="${i}" aria-label="${esc(T('impCol', { n: i + 1 }))}">${roles.map(r => `<option value="${r}" ${S.roles[i] === r ? 'selected' : ''}>${T('role_' + r)}</option>`).join('')}</select></th>`).join('')}</tr></thead>
        <tbody>${S.rows.slice(0, 8).map((r, ri) => `<tr class="${ri === 0 && S.header ? 'hdr' : ''}">${Array.from({ length: nc }, (_, i) => `<td>${esc(r[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        ${S.roles.includes('full') ? `<label class="field">${T('impMode')}<select data-o="mode">${[['auto', 'modeAuto'], ['comma', 'modeComma'], ['fl1', 'modeFl1'], ['fl2', 'modeFl2'], ['lf1', 'modeLf1'], ['lf2', 'modeLf2']].map(([v, l]) => `<option value="${v}" ${S.mode === v ? 'selected' : ''}>${T(l)}</option>`).join('')}</select></label>` : ''}
        <div class="fb good">${T('impFound', { n: an.length })}${dupN ? ' · ' + T('impDup', { n: dupN }) : ''}${badC ? ' · ' + T('impBadCode', { n: badC }) : ''}</div>
        <div class="row"><label class="check"><input type="checkbox" data-o="skipDup" ${S.skipDup ? 'checked' : ''}> ${T('impSkipDup')}</label><label class="check"><input type="checkbox" data-o="assign" ${S.assign ? 'checked' : ''}> ${T('impAssign')}</label></div>
        <small class="muted">${T('impExamples')}: ${an.slice(0, 3).map(a => esc(R.display(a.rec) + (a.rec.code ? ' (' + a.rec.code + ')' : ''))).join(' · ')}</small>`;
      go.disabled = n <= 0; go.textContent = T('impGoN', { n: Math.max(0, n) });
    };
    const setRows = (rows) => {
      S.rows = rows; const g = R.guessColumns(rows); S.roles = g.roles; S.header = g.header; S.mode = R.guessMode(rows.slice(g.header ? 1 : 0), g.roles); preview();
    };
    d.addEventListener('input', ev => { if (ev.target.id === 'imp-text') { $('#imp-err', d).textContent = ''; setRows(R.textToRows(ev.target.value)); } });
    d.addEventListener('change', async ev => {
      const el = ev.target;
      if (el.id === 'imp-file' && el.files[0]) {
        const f = el.files[0]; $('#imp-fn', d).textContent = f.name; $('#imp-err', d).textContent = '';
        try {
          if (/\.xls$/i.test(f.name)) throw new Error('xls');
          if (/\.xlsx$/i.test(f.name)) setRows((await C.xlsx.readXlsx(await f.arrayBuffer())).rows);
          else { const txt = await K.readFile(f); setRows(/[;\t]/.test(txt.split(/\r?\n/)[0] || '') || /,/.test(txt.split(/\r?\n/)[0] || '') && txt.split(/\r?\n/)[0].split(',').length > 2 ? K.parseCSV(txt) : R.textToRows(txt)); }
        } catch (e) { $('#imp-err', d).textContent = e.message === 'xls' ? T('impXls') : e.message === 'nostream' ? T('impNoStream') : T('impBadFile'); }
        el.value = ''; return;
      }
      if (el.dataset.col !== undefined) { S.roles[+el.dataset.col] = el.value; preview(); }
      else if (el.dataset.o === 'header') { S.header = el.checked; preview(); }
      else if (el.dataset.o === 'mode') { S.mode = el.value; preview(); }
      else if (el.dataset.o === 'skipDup') { S.skipDup = el.checked; preview(); }
      else if (el.dataset.o === 'assign') { S.assign = el.checked; preview(); }
    });
    d.addEventListener('click', async ev => {
      const r = ev.target.dataset && ev.target.dataset.r; if (r === undefined) return;
      if (r === '0') d.close();
      else if (r === 'tpl') K.download('plantilla-alumnado.csv', '﻿' + K.toCSV([[T('colLast'), T('colFirst'), T('colGroup'), T('colCode')], ['García López', 'Ana', '1A', ''], ['Martí Soler', 'Pau', '1A', '']]), 'text/csv;charset=utf-8');
      else if (r === 'aicopy') { K.toast(await C.ctx.copyText(AI_PROMPT) ? T('copied') : T('error')); }
      else if (r === 'go') {
        const an = compute().filter(a => !(S.skipDup && (a.flags.includes('dupName') || a.flags.includes('dupCode'))));
        const s0 = source(); let added = 0;
        an.forEach(a => { const rec = Object.assign({}, a.rec); if (a.flags.includes('dupCode') || a.flags.includes('badCode')) rec.code = ''; if (rec.code && s0.rows.some(x => x.code === rec.code)) rec.code = ''; const s = s0.add(rec); setName(s); s0.rows.push(s); added++; });
        if (S.assign && s0.rows.some(s => !s.code)) assignCodes(s0, 'missing');
        s0.save(); d.close(); X().renderView(); K.toast(T('impDone', { n: added }), 3000);
      }
    });
    setTimeout(() => $('#imp-text', d).focus(), 30);
  }

  async function splitDialog() {
    const src = source(), sample = src.rows.filter(s => s.name && !s.last && !s.first).slice(0, 4);
    const d = dlg(`<h2>${T('splitTitle')}</h2><p class="muted">${T('splitHelp')}</p><label class="field">${T('impMode')}<select id="sp-mode">${[['auto', 'modeAuto'], ['comma', 'modeComma'], ['fl1', 'modeFl1'], ['fl2', 'modeFl2'], ['lf1', 'modeLf1'], ['lf2', 'modeLf2']].map(([v, l]) => `<option value="${v}">${T(l)}</option>`).join('')}</select></label><div id="sp-prev" class="muted"></div>
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-r="0">${T('cancel')}</button><button class="btn" data-r="1">${T('splitGo')}</button></div>`);
    const pv = () => { $('#sp-prev', d).innerHTML = sample.map(s => { const p = R.splitName(s.name, $('#sp-mode', d).value); return `${esc(s.name)} → <b>${esc(p.last)}</b> | ${esc(p.first)}`; }).join('<br>'); };
    pv(); d.addEventListener('change', pv);
    d.addEventListener('click', ev => {
      const r = ev.target.dataset && ev.target.dataset.r; if (r === undefined) return;
      if (r === '1') { const m = $('#sp-mode', d).value; src.rows.forEach(s => { if (s.name && !s.last && !s.first) { const p = R.splitName(s.name, m); s.last = p.last; s.first = p.first; setName(s); } }); src.save(); X().renderView(); }
      d.close();
    });
  }
  function fromListDialog() {
    const all = R.lists.all(); if (!all.length) { K.toast(T('noLists'), 2800); return; }
    const d = dlg(`<h2>${T('fromList')}</h2><p class="muted">${T('fromListHelp')}</p><select id="fl-sel" style="width:100%">${all.map(l => `<option value="${l.id}">${esc(l.name || T('untitled'))} (${l.students.length})</option>`).join('')}</select>
      <div class="row" style="margin-top:12px"><button class="btn ghost" data-r="0">${T('cancel')}</button><button class="btn" data-r="1">${T('add')}</button></div>`);
    d.addEventListener('click', ev => { const r = ev.target.dataset && ev.target.dataset.r; if (r === undefined) return; if (r === '1') useList($('#fl-sel', d).value); d.close(); });
  }
  function useList(id) {
    const l = R.lists.get(id), x = X(), e = x.exam; if (!l) return; let n = 0, dropped = 0;
    l.students.forEach(ls => {
      if (e.students.some(s => s.rid === ls.id || (ls.code && s.code === ls.code && R.keyName(s) === R.keyName(ls)) || R.keyName(s) === R.keyName(ls))) return;
      const s = { id: K.uid(), rid: ls.id, name: '', last: ls.last, first: ls.first, group: ls.group, code: ls.code || '', version: e.versions[0], answers: Array(e.nq).fill('') };
      if (s.code && e.students.some(o => o.code === s.code)) { s.code = ''; dropped++; }
      setName(s); e.students.push(s); n++;
    });
    e.rosterId = id; x.changed(); x.renderView(); K.toast(T('listAdded', { n }) + (dropped ? ' ' + T('listDropped', { n: dropped }) : ''), 3600);
  }

  /* ---------- eventos ---------- */
  function act(act, b, ev) {
    const x = X(), e = x.exam;
    switch (act) {
      case 'x:stab': ui2.stab = b.dataset.v; x.renderView(); return true;
      case 'x:ssort': ui2.sortDir = ui2.sortK === b.dataset.k ? -ui2.sortDir : 1; ui2.sortK = b.dataset.k; x.renderView(); return true;
      case 'x:import': importDialog(); return true;
      case 'x:split': splitDialog(); return true;
      case 'x:fromlist': fromListDialog(); return true;
      case 'x:tolist': prompt(T('listName'), e.name, T('save')).then(nm => { if (nm == null) return; R.lists.create(nm, e.students.map(s => ({ id: K.uid(), last: s.last || s.name, first: s.first || '', group: s.group || '', code: s.code || '' }))); K.toast(T('listSaved')); }); return true;
      case 'x:lnew': prompt(T('listName'), '').then(nm => { if (nm == null) return; const l = R.lists.create(nm || T('untitled')); ui2.list = l.id; x.renderView(); }); return true;
      case 'x:lren': { const l = R.lists.get(ui2.list); if (l) prompt(T('listName'), l.name).then(nm => { if (nm == null) return; l.name = nm; R.lists.put(l); x.renderView(); }); return true; }
      case 'x:ldup': { const l = R.lists.get(ui2.list); if (l) { const c = R.lists.create((l.name || '') + ' (2)', JSON.parse(JSON.stringify(l.students)).map(s => (s.id = K.uid(), s))); ui2.list = c.id; x.renderView(); } return true; }
      case 'x:ldel': { const l = R.lists.get(ui2.list); if (l) K.confirm(T('listDelQ', { name: l.name }), { danger: true, okText: T('delete') }).then(ok => { if (ok) { R.lists.remove(l.id); ui2.list = null; x.renderView(); } }); return true; }
      case 'x:luse': useList(ui2.list); return true;
      case 'x:cmode': { const s = source(); if (s.kind === 'exam') e.codeMode = b.dataset.v; else s.ref.codeMode = b.dataset.v; s.save(); x.renderView(); return true; }
      case 'x:gen': {
        const s = source(), go = () => { const n = assignCodes(s, b.dataset.v); if (n) { s.save(); x.renderView(); K.toast(T('genDone', { n })); } };
        if (b.dataset.v === 'all' && s.rows.some(r => r.code)) K.confirm(T('genAllQ'), { danger: true }).then(ok => { if (ok) go(); }); else go();
        return true;
      }
      case 'x:codescsv': K.download(x.fileName('codigos.csv'), '﻿' + K.toCSV([[T('colLast'), T('colFirst'), T('colGroup'), T('colCode')], ...e.students.map(s => [s.last || s.name, s.first || '', s.group || '', s.code || ''])]), 'text/csv;charset=utf-8'); return true;
      case 'x:edans': x.ui.sel = b.dataset.id; x.ui.tab = 'students'; ui2.stab = 'answers'; x.renderView(); return true;
      case 'x:del': { const s = source(), i = s.rows.findIndex(r => r.id === b.dataset.id); if (i >= 0) { s.rows.splice(i, 1); s.save(); x.renderView(); } return true; }
      case 'x:delall': { const s = source(); K.confirm(T('confirmDeleteAll', { n: s.rows.length }), { danger: true, okText: T('deleteAll') }).then(ok => { if (ok) { s.rows.length = 0; s.save(); x.renderView(); } }); return true; }
      default: return false;
    }
  }

  function onInput(ev) {
    const el = ev.target, sf = el.dataset.sf; if (!sf || !el.closest('#stbody')) { if (el.id === 'sfilter2') { X().ui.filter = el.value; const s = source(); $('#stbody').innerHTML = rowsHtml(s, el.value.trim().toLowerCase(), codeStats(s), s.kind === 'exam' && X().exam.versions.length > 1); } return; }
    const s0 = source(), s = s0.rows.find(r => r.id === el.closest('tr').dataset.id); if (!s) return;
    if (sf === 'code') { el.value = el.value.replace(/\D/g, '').slice(0, s0.L); s.code = el.value; }
    else if (sf === 'version') s.version = el.value;
    else { s[sf] = el.value; if (sf === 'last' || sf === 'first') { if (s.name && !s.last && !s.first) { /* nombre antiguo se sustituye */ } setName(s); if (!s.last && !s.first) s.name = ''; } }
    s0.save();
  }
  function onChange(ev) {
    const el = ev.target;
    if (el.id === 'listsel') { ui2.list = el.value; X().renderView(); return; }
    if (el.dataset.sf === 'code' && el.closest('#stbody')) { const s = source(), st = codeStats(s); $$('#stbody tr').forEach(tr => { const r = s.rows.find(z => z.id === tr.dataset.id), inp = $('.c-code', tr); if (!r || !inp) return; const bad = r.code && (st.cnt.get(r.code) > 1 || !R.validCode(r.code, s.L, s.check)); inp.classList.toggle('bad', !!bad); }); return; }
    if (el.dataset.sf2) {
      const s = source(), tgt = s.kind === 'exam' ? s.ref : s.ref;
      if (el.dataset.sf2 === 'codeLen') tgt.codeLen = +el.value; else if (el.dataset.sf2 === 'codeCheck') tgt.codeCheck = el.checked;
      s.save(); X().renderView();
    }
  }
  function onSubmit(ev) {
    if (ev.target.dataset.form !== 'x:add') return; ev.preventDefault();
    const f = ev.target, v = (n) => f.elements[n].value.trim(), s0 = source();
    if (!v('last') && !v('first')) { f.elements.last.focus(); return; }
    const s = s0.add({ last: v('last'), first: v('first'), group: v('group'), code: v('code').replace(/\D/g, '') }); setName(s);
    if (s.code && s0.rows.some(o => o.code === s.code)) { K.toast(T('codeDup'), 3000); s.code = ''; }
    s0.rows.push(s);
    if (!s.code && s0.rows.some(o => o !== s && o.code)) { const c = R.genCodes(1, { L: s0.L, mode: s0.mode, check: s0.check, used: new Set(s0.rows.map(o => o.code).filter(Boolean)) }); if (c) s.code = c[0]; }
    s0.save(); X().renderView(); const nf = $('form[data-form="x:add"] input[name="last"]'); if (nf) nf.focus();
  }
  function init() {
    const app = $('#app');
    app.addEventListener('click', (ev) => { const b = ev.target.closest('[data-act]'); if (b && b.dataset.act.startsWith('x:')) act(b.dataset.act, b, ev); });
    app.addEventListener('input', onInput); app.addEventListener('change', onChange); app.addEventListener('submit', onSubmit);
  }
  C.uiStudents = { render, init, ui2, importDialog, assignCodes, codeStats, setName };
})();
