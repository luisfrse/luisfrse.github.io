/* ============================================================
   Corrector de tests · pestaña «Sincronizar»: archivos, enlace/QR, carpeta de Drive/OneDrive/Dropbox, asistente
   ============================================================ */
(() => {
  'use strict';
  const C = window.CORR, K = window.AppKit, esc = K.esc, Sy = C.sync, link = Sy.link;
  const X = () => C.ctx, T = (k, p) => K.t(k, p);
  const $ = (s, r = document) => r.querySelector(s);
  const store = K.storage('corrector');
  const Y = { ex: null, ro: null, answers: true, code: '', wiz: store.get('wiz', { p: 'drive', d: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mob' : 'pc' }), mergeOpen: false };

  /* ---------- estado de la carpeta (chip permanente) ---------- */
  const rtf = () => new Intl.RelativeTimeFormat(K.locale(), { numeric: 'auto' });
  function ago(ts) {
    const s = Math.round((Date.now() - ts) / 1000); if (s < 45) return T('syNow');
    const m = Math.round(s / 60); if (m < 60) return rtf().format(-m, 'minute'); const h = Math.round(m / 60); if (h < 36) return rtf().format(-h, 'hour'); return rtf().format(-Math.round(h / 24), 'day');
  }
  function chipInfo() {
    const st = link.st;
    switch (st.state) {
      case 'ok': return { cls: 'accent', txt: T('syOk', { t: ago(st.last) }) };
      case 'idle': return { cls: 'accent', txt: T('syLinked') };
      case 'dirty': return { cls: 'warn', txt: T('syDirty') };
      case 'busy': return { cls: 'accent', txt: T('syBusy') };
      case 'perm': return { cls: 'warn', txt: T('syPerm') };
      case 'missing': return { cls: 'warn', txt: T('syMissing') };
      case 'review': return { cls: 'warn', txt: T('syReview') };
      case 'warn': return { cls: 'warn', txt: T('syWarn') };
      default: return null;
    }
  }
  function chipHtml() { const c = chipInfo(); return c ? `<button type="button" class="chip ${c.cls} syncchip" id="syncchip" data-tab="sync" title="${esc(T('syChipTitle'))}">⇄ ${esc(c.txt)}</button>` : ''; }
  function refreshChips() {
    const c = chipInfo(), el = $('#syncchip');
    if (el) { if (c) { el.className = `chip ${c.cls} syncchip`; el.textContent = '⇄ ' + c.txt; } else el.remove(); }
    else if (c) { const m = $('#head .meta'); if (m) m.insertAdjacentHTML('beforeend', chipHtml()); }
    if (X() && X().ui.tab === 'sync') renderFolderBox();
  }

  /* ---------- ilustraciones sencillas ---------- */
  const P = { cloud: (x, y, c = 'var(--blue)') => `<path d="M${x + 8} ${y + 22}a9 9 0 0 1 1-18a12 12 0 0 1 23 3a8 8 0 0 1-1 15z" fill="${c}" opacity=".9"/>`, folder: (x, y, c = 'var(--amber)') => `<path d="M${x} ${y + 4}h9l3 3h14v18h-26z" fill="${c}"/>`,
    laptop: (x, y) => `<rect x="${x}" y="${y}" width="46" height="30" rx="3" fill="#0d1a2a" stroke="#b9c6d6" stroke-width="1.5"/><path d="M${x - 5} ${y + 33}h56l-4 4h-48z" fill="#b9c6d6"/>`,
    phone: (x, y) => `<rect x="${x}" y="${y}" width="24" height="44" rx="4" fill="#0d1a2a" stroke="#b9c6d6" stroke-width="1.5"/><circle cx="${x + 12}" cy="${y + 39}" r="1.6" fill="#b9c6d6"/>`,
    arrow: (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" marker-end="url(#ah)"/>` };
  function ill(kind) {
    let g = '';
    if (kind === 'folderpc') g = P.laptop(20, 14) + P.folder(60, 38) + P.cloud(86, 6) + P.arrow(66, 36, 90, 24);
    else if (kind === 'link') g = P.laptop(20, 14) + `<rect x="30" y="22" width="26" height="14" rx="2" fill="var(--accent)" opacity=".85"/><text x="43" y="32" font-size="8" text-anchor="middle" fill="#0d1a2a" font-weight="700">⇄</text>` + P.folder(78, 28);
    else if (kind === 'phoneget') g = P.phone(24, 8) + P.cloud(64, 10) + P.arrow(66, 30, 52, 30) + `<rect x="28" y="16" width="16" height="4" rx="1" fill="var(--accent)"/><rect x="28" y="24" width="16" height="4" rx="1" fill="#b9c6d6" opacity=".5"/>`;
    else if (kind === 'phonescan') g = P.phone(24, 8) + `<rect x="64" y="14" width="26" height="34" rx="2" fill="#fff"/>` + [0, 1, 2, 3].map(i => `<circle cx="${72 + i * 5}" cy="${24 + (i % 2) * 5}" r="1.6" fill="${i % 2 ? '#222' : 'none'}" stroke="#222" stroke-width=".6"/>`).join('') + P.arrow(60, 30, 52, 30);
    else if (kind === 'phonesend') g = P.phone(24, 8) + `<rect x="27" y="30" width="18" height="12" rx="2" fill="var(--accent)" opacity=".85"/>` + P.cloud(64, 8) + P.arrow(50, 24, 66, 22);
    else g = P.laptop(14, 14) + P.cloud(70, 4) + P.arrow(64, 24, 76, 20) + P.phone(98, 14).replace(/width="24" height="44"/, 'width="18" height="34"');
    return `<svg viewBox="0 0 130 64" class="ill" role="img" aria-hidden="true"><defs><marker id="ah" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0 0L6 3L0 6z" fill="var(--accent)"/></marker></defs>${g}</svg>`;
  }
  function wizard() {
    const w = Y.wiz, pn = { drive: 'Google Drive', onedrive: 'OneDrive', dropbox: 'Dropbox' }[w.p], p = { p: pn };
    const steps = w.d === 'pc' ? [['folderpc', T('wzPc1', p)], ['link', T('wzPc2')], ['pcsync', T('wzPc3')]] : [['phoneget', T('wzMob1', p)], ['phoneget', T('wzMob2', p)], ['phonescan', T('wzMob3')], ['phonesend', T('wzMob4', p)]];
    return `<div class="row"><div class="seg" role="group">${[['drive', 'Drive'], ['onedrive', 'OneDrive'], ['dropbox', 'Dropbox']].map(([v, l]) => `<button type="button" data-act="x:wz" data-k="p" data-v="${v}" aria-pressed="${w.p === v}">${l}</button>`).join('')}</div>
      <div class="seg" role="group">${[['pc', T('wzPc')], ['mob', T('wzMob')]].map(([v, l]) => `<button type="button" data-act="x:wz" data-k="d" data-v="${v}" aria-pressed="${w.d === v}">${l}</button>`).join('')}</div></div>
      <ol class="wiz">${steps.map(([k, txt], i) => `<li>${ill(k)}<div><b>${T('wzStep', { n: i + 1 })}</b><p>${txt}</p></div></li>`).join('')}</ol>${w.d === 'mob' ? `<div class="banner-warn">${T('wzMobNote')}</div>` : `<small class="muted">${T('wzPcNote')}</small>`}`;
  }

  /* ---------- vista ---------- */
  function ensureSel() {
    const l = Sy.readLocal(); if (!Y.ex) Y.ex = new Set(l.exams.map(e => e.id)); if (!Y.ro) Y.ro = new Set(l.rosters.map(r => r.id)); return l;
  }
  function render() {
    const l = ensureSel(), x = X(), lastExp = store.get('lastExport', 0), old = !lastExp || Date.now() - lastExp > 7 * 864e5, dev = Sy.device();
    const flow = [['pc', T('flow1')], ['pcsync', T('flow2')], ['phonescan', T('flow3')], ['phonesend', T('flow4')]];
    return `
    <section class="panel stack"><div class="banner-warn"><b>${T('syNoAuto')}</b> ${T('syNoAutoText')}</div>
      <h2 style="margin:0">${T('flowTitle')}</h2><ol class="flow">${flow.map(([k, tx], i) => `<li>${ill(k === 'pc' ? 'folderpc' : k)}<span><b>${i + 1}.</b> ${tx}</span></li>`).join('')}</ol></section>

    <section class="panel stack"><h2 style="margin:0">${T('syFolder')}</h2><p class="muted" style="margin:0">${T('syFolderHelp')}</p>
      <div id="folderbox" class="stack"></div>
      <div class="scan-actions"><button class="btn big" data-act="x:send">⬆ ${T('sySend')}</button><label class="btn big alt" tabindex="0">⬇ ${T('syBring')}<input type="file" id="sy-files" accept=".json,application/json" multiple hidden></label></div>
      <small class="muted">${T('syBtnHelp', { f: Sy.deviceFile() })}</small>
      <div class="banner-warn" style="font-size:.93rem">🔒 ${T('syPrivacy')}</div>
      <label class="field" style="max-width:320px">${T('syDevice')}<input type="text" id="sy-dev" value="${esc(dev.name)}" maxlength="24"></label></section>

    <section class="panel stack"><h2 style="margin:0">${T('wzTitle')}</h2>${wizard()}</section>

    <section class="panel stack"><h2 style="margin:0">${T('syExport')}</h2>
      <p class="muted" style="margin:0">${T('syExportHelp')}</p>
      <div class="grid cols-2"><div class="stack"><b>${T('myExams')}</b>${l.exams.map(e => `<label class="check"><input type="checkbox" data-ex="${e.id}" ${Y.ex.has(e.id) ? 'checked' : ''}> ${esc(e.name || T('untitled'))} <small class="muted">(${e.students.length})</small></label>`).join('') || '—'}</div>
        <div class="stack"><b>${T('listsTitle')}</b>${l.rosters.map(r => `<label class="check"><input type="checkbox" data-ro="${r.id}" ${Y.ro.has(r.id) ? 'checked' : ''}> ${esc(r.name || T('untitled'))} <small class="muted">(${r.students.length})</small></label>`).join('') || `<small class="muted">${T('noLists')}</small>`}</div></div>
      <label class="check"><input type="checkbox" id="sy-ans" ${Y.answers ? 'checked' : ''}> ${T('syAnswers')}</label>
      <div class="row"><button class="btn" data-act="x:export">${T('syExportBtn')}</button><button class="btn ghost" data-act="x:linkgen">${T('syLink')}</button>
        <label class="btn ghost" tabindex="0" style="cursor:pointer">${T('syImportBtn')}<input type="file" id="sy-imp" accept=".json,application/json" multiple hidden></label></div>
      <div id="linkbox" class="stack"></div>
      <label class="field">${T('syCodeIn')}<textarea id="sy-code" rows="2" placeholder="${esc(T('syCodePh'))}"></textarea></label><div class="row"><button class="btn ghost small" data-act="x:codein">${T('syCodeGo')}</button></div>
      <div class="${old && l.exams.length ? 'banner-warn' : 'muted'}" style="font-size:.93rem">${lastExp ? T('syLastExp', { d: K.fmtDate(lastExp) }) : T('syNeverExp')} ${old && l.exams.length ? T('syRemind') : ''}</div></section>`;
  }
  function renderFolderBox() {
    const b = $('#folderbox'); if (!b) return; const st = link.st, c = chipInfo();
    if (!link.supported()) { b.innerHTML = `<div class="muted">${T('syNoFsa')}</div>`; return; }
    if (!link.handle) { b.innerHTML = `<button class="btn" data-act="x:link">📁 ${T('syLinkBtn')}</button><small class="muted">${T('syFsaHelp')}</small>`; return; }
    b.innerHTML = `<div class="row"><span class="chip ${c ? c.cls : ''}">⇄ ${esc(c ? c.txt : '')}</span><b>📁 ${esc(link.handle.name || '')}</b></div>
      ${st.state === 'perm' ? `<div class="banner-warn">${T('syPermHelp')} <button class="btn small" data-act="x:regrant">${T('syRegrant')}</button></div>` : ''}
      ${st.state === 'missing' ? `<div class="banner-warn">${T('syMissingHelp')}</div>` : ''}
      ${st.state === 'review' ? `<div class="banner-warn">${T('syReviewHelp')} <button class="btn small" data-act="x:review">${T('syReviewBtn')}</button></div>` : ''}
      ${(st.problems || []).map(p => `<div class="banner-warn" style="font-size:.9rem">⚠ ${esc(p.name)}: ${T('syProb_' + p.why)}</div>`).join('')}
      <div class="row"><button class="btn small" data-act="x:syncnow">⟳ ${T('syNowBtn')}</button><button class="btn ghost small" data-act="x:link">${T('syChange')}</button><button class="btn danger small" data-act="x:unlink">${T('syUnlink')}</button></div>
      <small class="muted">${T('syAutoHelp', { f: Sy.CANON })}</small>`;
  }
  function mount() { renderFolderBox(); }

  /* ---------- diálogo de fusión ---------- */
  function openMerge(items, { problems = [], source = '', after } = {}) {
    if (Y.mergeOpen) return; Y.mergeOpen = true;
    const x = X(), d = document.createElement('dialog'); d.className = 'kit-dialog wide merge'; d.style.width = 'min(780px,96vw)';
    const nNew = items.filter(i => i.state === 'new').length, nImp = items.filter(i => i.state === 'importNewer').length, nLoc = items.filter(i => i.state === 'localNewer').length, nSame = items.filter(i => i.state === 'same').length;
    const date = (ts) => ts ? new Date(ts).toLocaleString(K.locale(), { dateStyle: 'short', timeStyle: 'short' }) : '—';
    const opts = (it) => (it.state === 'new' ? [['import', 'mgImport'], ['keep', 'mgSkip']] : [['merge', 'mgMerge'], ['keep', 'mgKeep'], ['import', 'mgReplace'], ['both', 'mgBoth']]);
    d.innerHTML = `<h2>${T('mgTitle')}</h2><p class="muted" style="margin-top:0">${source ? esc(source) + ' · ' : ''}${T('mgSummary', { a: nNew, b: nImp, c: nLoc, s: nSame })}</p>
      ${problems.map(p => `<div class="banner-warn" style="font-size:.9rem;margin-bottom:6px">⚠ ${esc(p.name)}: ${T('syProb_' + p.why)}</div>`).join('')}
      <div class="mg-list">${items.filter(i => i.state !== 'same').map((it, k) => `<div class="mg-item" data-k="${items.indexOf(it)}"><div class="mg-title"><b>${it.kind === 'exam' ? '📝' : '👥'} ${esc(it.name || T('untitled'))}</b><span class="chip ${it.state === 'new' ? 'accent' : 'warn'}">${T('st_' + it.state)}</span></div>
        <div class="mg-cols"><span>${T('mgLocal')}: ${it.loc ? `${(it.loc.students || []).length} ${T('studentsN')} · ${date(it.loc.updated)}` : '—'}</span><span>${T('mgIncoming')}: ${(it.inc.students || []).length} ${T('studentsN')} · ${date(it.inc.updated)}</span></div>
        <label class="field">${T('mgAction')}<select data-k="${items.indexOf(it)}">${opts(it).map(([v, l]) => `<option value="${v}" ${it.choice === v ? 'selected' : ''}>${T(l)}</option>`).join('')}</select></label></div>`).join('') || `<div class="empty">${T('mgNothing')}</div>`}</div>
      <small class="muted">${T('mgNote')}</small>
      <div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn ghost" data-r="0">${T('cancel')}</button><button class="btn" data-r="1">${T('mgApply')}</button></div>`;
    document.body.append(d); d.showModal();
    d.addEventListener('change', ev => { const s = ev.target.closest('select[data-k]'); if (s) items[+s.dataset.k].choice = s.value; });
    d.addEventListener('click', async ev => {
      const r = ev.target.dataset && ev.target.dataset.r; if (r === undefined) return;
      if (r === '1') {
        x.flush(); const { local, changed } = Sy.applyPlan(Sy.readLocal(), items, x.fix); Sy.writeLocal(local); x.reloadCurrent();
        K.toast(T('mgDone', { n: changed }), 3200);
        if (link.handle && link.st.state !== 'perm') await link.write(Sy.readLocal());
        if (after) after();
      }
      d.close();
    });
    d.addEventListener('close', () => { Y.mergeOpen = false; d.remove(); if (link.st.state === 'review') { link.st.pending = null; link.checkPermission(); } });
  }
  /* abre el diálogo a partir de paquetes ya leídos */
  function mergePackages(pkgs, opts = {}) {
    const items = Sy.plan(Sy.readLocal(), Sy.fold(pkgs));
    if (!items.length) { K.toast(T('mgEmpty')); return; }
    if (!items.some(i => i.state !== 'same')) { K.toast(T('mgAllSame'), 3000); return; }
    openMerge(items, opts);
  }
  async function readFiles(files) {
    const pkgs = [], problems = [];
    for (const f of files) {
      try { const p = JSON.parse(await K.readFile(f)), bad = Sy.validatePackage(p); if (bad) problems.push({ name: f.name, why: bad === 'newer' ? 'newer' : 'format' }); else pkgs.push(p); }
      catch (_) { problems.push({ name: f.name, why: 'unreadable' }); }
    }
    if (!pkgs.length) { K.toast(T('syProb_format') + ' ' + (problems[0] ? problems[0].name : ''), 4200); return; }
    const items = Sy.plan(Sy.readLocal(), Sy.fold(pkgs));
    openMerge(items, { problems, source: files.length > 1 ? T('mgFiles', { n: files.length }) : files[0].name });
  }

  /* ---------- acciones ---------- */
  const selection = () => ({ examIds: [...Y.ex], rosterIds: [...Y.ro], answers: Y.answers });
  async function folderCheck(interactive) {
    try {
      const r = await link.check();
      if (r.items.needsChange) { link.set('review', { pending: r, problems: r.problems }); openMerge(r.items, { problems: r.problems, source: T('syFolderSrc', { f: link.handle.name }) }); return; }
      const bad = r.problems.find(p => p.name === Sy.CANON && p.why === 'unreadable');
      if (bad && !(interactive && await K.confirm(T('syRewriteQ'), { danger: true }))) { link.set('warn', { problems: r.problems }); return; }
      await link.write(r.local); link.st.problems = r.problems; link.emit();
      if (interactive) K.toast(T('syDone'), 2400);
    } catch (e) {
      if (e.message === 'perm') K.toast(T('syPermHelp'), 4000); else if (e.message === 'missing') K.toast(T('syMissingHelp'), 4500); else { console.error(e); K.toast(T('error')); }
    }
  }
  async function act(a, b) {
    const x = X();
    switch (a) {
      case 'x:wz': Y.wiz[b.dataset.k] = b.dataset.v; store.set('wiz', Y.wiz); x.renderView(); return;
      case 'x:link': try { await link.pick(); x.renderView(); await folderCheck(true); } catch (e) { if (e.name !== 'AbortError') { console.error(e); K.toast(T('error')); } } return;
      case 'x:unlink': if (await K.confirm(T('syUnlinkQ'), { danger: true })) { await link.unlink(); x.renderView(); refreshChips(); } return;
      case 'x:regrant': if (await link.regrant()) folderCheck(true); return;
      case 'x:syncnow': folderCheck(true); return;
      case 'x:review': if (link.st.pending) openMerge(link.st.pending.items, { problems: link.st.pending.problems }); else folderCheck(true); return;
      case 'x:send': {
        x.flush(); const pkg = Sy.buildPackage(Sy.readLocal(), { answers: true }), name = Sy.deviceFile(), file = new File([JSON.stringify(pkg)], name, { type: 'application/json' });
        store.set('lastExport', Date.now());
        if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); K.toast(T('sySent'), 2800); return; } catch (e) { if (e.name === 'AbortError') return; } }
        K.download(name, JSON.stringify(pkg), 'application/json'); K.toast(T('syDownloaded', { f: name }), 4200); return;
      }
      case 'x:export': { x.flush(); const pkg = Sy.buildPackage(Sy.readLocal(), selection()); K.download(Sy.deviceFile(), JSON.stringify(pkg), 'application/json'); store.set('lastExport', Date.now()); K.toast(T('syExported'), 2600); return; }
      case 'x:linkgen': {
        x.flush(); const pkg = Sy.buildPackage(Sy.readLocal(), selection()), code = await Sy.encode(pkg), url = Sy.linkFor(code), n = new Blob([url]).size, box = $('#linkbox');
        Y.code = url; const qr = n <= 1000 ? C.qr.make(url, 'L') : null;
        box.innerHTML = `<div class="fb ${n > 8000 ? 'bad' : 'good'}">${T('syLinkSize', { n: (n / 1024).toFixed(1) })} ${n > 8000 ? T('syLinkBig') : ''}</div>
          <textarea readonly rows="3" id="sy-link" style="font-size:.8rem">${esc(url)}</textarea>
          <div class="row"><button class="btn small" data-act="x:copylink">${T('copy')}</button>${navigator.share ? `<button class="btn small ghost" data-act="x:sharelink">${T('syShare')}</button>` : ''}</div>
          <small class="muted">${T('syLinkWarn')}</small>
          ${qr ? `<div class="qrbox">${C.qr.toSVG(qr, 5)}<small class="muted">${T('syQr')}</small></div>` : `<small class="muted">${T('syNoQr')}</small>`}`;
        return;
      }
      case 'x:copylink': K.toast(await x.copyText(Y.code) ? T('copied') : T('error')); return;
      case 'x:sharelink': try { await navigator.share({ title: T('title'), url: Y.code }); } catch (_) { /* cancelado */ } return;
      case 'x:codein': {
        try { const p = await Sy.decode($('#sy-code').value), bad = Sy.validatePackage(p); if (bad) throw new Error(bad); mergePackages([p], { source: T('syCodeSrc') }); }
        catch (e) { K.toast(e.message === 'newer' ? T('syProb_newer') : T('syCodeBad'), 3600); } return;
      }
      default:
    }
  }
  async function fromHash() {
    const m = /^#sync=(.+)$/.exec(location.hash); if (!m) return;
    try { const p = await Sy.decode(m[1]), bad = Sy.validatePackage(p); history.replaceState(null, '', location.pathname + location.search); if (bad) throw new Error(bad); mergePackages([p], { source: T('syLinkSrc') }); }
    catch (e) { history.replaceState(null, '', location.pathname + location.search); K.toast(T('syCodeBad'), 4000); }
  }
  async function start() {
    link.on(refreshChips); setInterval(() => { if (link.st.state === 'ok') refreshChips(); }, 30000);
    await link.init();
    if (link.handle && link.st.state === 'idle' || link.st.state === 'ok') folderCheck(false);
    else if (link.st.state === 'perm') K.toast(T('syPermHelp'), 4500);
    fromHash();
  }
  function init() {
    const app = $('#app');
    app.addEventListener('click', (ev) => { const b = ev.target.closest('[data-act]'); if (b && b.dataset.act.startsWith('x:')) act(b.dataset.act, b); });
    app.addEventListener('change', async (ev) => {
      const el = ev.target;
      if (el.dataset.ex) { el.checked ? Y.ex.add(el.dataset.ex) : Y.ex.delete(el.dataset.ex); }
      else if (el.dataset.ro) { el.checked ? Y.ro.add(el.dataset.ro) : Y.ro.delete(el.dataset.ro); }
      else if (el.id === 'sy-ans') Y.answers = el.checked;
      else if (el.id === 'sy-dev') { const d = Sy.device(); d.name = el.value.trim() || d.name; store.set('device', d); }
      else if (el.id === 'sy-files' || el.id === 'sy-imp') { const fs = [...el.files]; el.value = ''; if (fs.length) readFiles(fs); }
    });
    app.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('label.btn')) { ev.preventDefault(); ev.target.click(); } });
  }
  C.uiSync = { render, mount, init, start, chipHtml, refreshChips, openMerge, mergePackages, folderCheck };
})();
