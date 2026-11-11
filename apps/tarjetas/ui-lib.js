/* ============================================================
   Tarjetas de estudio · interfaz común y biblioteca de mazos
   ============================================================ */
(function () {
  'use strict';
  const TJ = window.TJ, K = window.AppKit, SAMPLES = window.TJ_SAMPLES || [];
  const t = K.i18n(window.TJ_I18N);
  const store = K.storage('tarjetas');
  const U = TJ.ui = { t, K, store };
  const S = U.S = { decks: new Map(), prefs: {}, session: null, storageOk: true, opts: { mode: 'daily', shuffle: false, reverse: false, topic: '' } };
  const $ = U.$ = (s, r = document) => r.querySelector(s);
  const $$ = U.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = U.esc = TJ.esc;
  U.root = () => document.getElementById('app');
  U.ACT = {};                                   // acciones de data-act="..."

  /* ---------- iconos ---------- */
  const SVG = (inner) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const ICONS = U.ICONS = {
    shield: SVG('<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'),
    body: SVG('<circle cx="12" cy="5" r="2.2"/><path d="M12 8v6M7 10l5-2 5 2M9 21l3-7 3 7"/>'),
    bacteria: SVG('<rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M8 5.5l-1-1.5M11 4l-.5-2M5.5 9l-2-.5M16 19.5l1 1.5M13 21l.5 2M18.5 15l2 .5"/>'),
    cross: SVG('<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>'),
    cards: SVG('<rect x="3" y="6" width="14" height="14" rx="2.5"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>'),
    plus: SVG('<path d="M12 5v14M5 12h14"/>'),
    speaker: SVG('<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6M18.8 6.5a7.5 7.5 0 0 1 0 11"/>'),
    undo: SVG('<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12" transform="translate(0 -5)"/>'),
    bulb: SVG('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
    dots: SVG('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
    check: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    swap: SVG('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>')
  };
  const HUES = [265, 210, 165, 330, 35, 140];
  U.hueOf = (id) => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return HUES[h % HUES.length]; };

  /* ---------- formatos ---------- */
  U.fmtIvl = (p) => {
    if (p.ms != null) { const m = Math.round(p.ms / 60000); if (m < 60) return `${m} ${t('u.min')}`; const h = Math.round(m / 60); if (h < 24) return `${h} ${t('u.h')}`; return `${Math.round(h / 24)} ${t('u.d')}`; }
    const d = p.days; if (d < 30) return `${d} ${t('u.d')}`; if (d < 365) return `${K.fmt(d / 30, 1)} ${t('u.mo')}`; return `${K.fmt(d / 365, 1)} ${t('u.y')}`;
  };
  U.relDays = (n) => (n <= 0 ? t('rel.today') : n === 1 ? t('rel.tomorrow') : t('rel.in', { n }));
  U.pct = (x) => (x == null ? '—' : `${K.fmt(x * 100, 0)} %`);
  U.slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'mazo';
  U.go = (path) => { location.hash = '#/' + path; };

  /* ---------- persistencia ---------- */
  U.load = () => {
    S.decks.clear();
    store.get('index', []).forEach(id => { const d = TJ.normalizeDeck(store.get('deck:' + id)); if (d) S.decks.set(d.id, d); });
    S.prefs = Object.assign({ autoSpeak: false, lastBackup: 0, since: 0, opts: null, helpSeen: false }, store.get('prefs', {}));
    if (S.prefs.opts) Object.assign(S.opts, S.prefs.opts, { topic: '' });
    S.storageOk = store.set('probe', 1);
    store.remove('probe');
  };
  U.storageWarn = () => { if (S.storageOk) { S.storageOk = false; K.toast(t('warn.storage'), 5000); const b = $('#storageBanner'); if (b) b.hidden = false; } };
  U.saveIndex = () => { if (!store.set('index', [...S.decks.keys()])) U.storageWarn(); };
  U.saveDeck = (d) => { if (!store.set('deck:' + d.id, d)) U.storageWarn(); U.saveIndex(); };
  U.savePrefs = () => { S.prefs.opts = { mode: S.opts.mode, shuffle: S.opts.shuffle, reverse: S.opts.reverse }; store.set('prefs', S.prefs); };
  U.removeDeck = (id) => { store.remove('deck:' + id); S.decks.delete(id); U.saveIndex(); };
  const uniqueName = (name, ignoreId) => { const names = new Set([...S.decks.values()].filter(d => d.id !== ignoreId).map(d => d.name)); if (!names.has(name)) return name; let i = 2; while (names.has(`${name} (${i})`)) i++; return `${name} (${i})`; };

  /* ---------- diálogos ---------- */
  U.modal = ({ title, body, buttons, wide, onOpen, validate, cls = '' }) => new Promise(res => {
    const d = document.createElement('dialog');
    d.className = 'kit-dialog tj-dialog ' + cls + (wide ? ' wide' : '');
    d.innerHTML = `<form method="dialog" novalidate>${title ? `<h2>${title}</h2>` : ''}<div class="dlg-body">${body}</div><div class="row dlg-actions">${buttons.map(b => `<button type="button" class="btn ${b.cls || ''}" data-v="${b.v}">${b.label}</button>`).join('')}</div></form>`;
    if (title) d.setAttribute('aria-label', String(title).replace(/<[^>]+>/g, ''));
    let value = null, done = false;
    const finish = () => { if (done) return; done = true; res({ v: value || 'cancel', el: d }); setTimeout(() => d.remove(), 0); };
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-v]'); if (!b || !d.contains(b)) return;
      const v = b.dataset.v;
      if (validate && v !== 'cancel' && validate(d, v) === false) return;
      value = v; d.close(); finish();
    });
    d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { const p = d.querySelector('.btn:not(.ghost):not(.danger)'); if (p) { e.preventDefault(); p.click(); } } });
    d.addEventListener('close', finish);   // Esc u otro cierre del navegador
    document.body.append(d); d.showModal();
    if (onOpen) onOpen(d);
    const first = d.querySelector('input:not([type=file]),textarea,select'); if (first) first.focus();
  });
  U.confirm = async (message, o = {}) => {
    const r = await U.modal({ title: o.title || '', body: `<p>${esc(message)}</p>`, cls: 'confirm',
      buttons: [{ v: 'cancel', label: o.cancelText || t('cancel'), cls: 'ghost' }, { v: 'ok', label: o.okText || t('ok'), cls: o.danger ? 'danger' : '' }] });
    return r.v === 'ok';
  };

  /* diálogo de crear / renombrar mazo */
  U.deckDialog = async (deck) => {
    const lang = deck ? deck.lang : K.lang;
    const { v, el } = await U.modal({
      title: deck ? t('dlg.renameDeck') : t('dlg.newDeck'),
      body: `<div class="stack"><label class="field">${t('dlg.deckName')}<input type="text" id="dn" maxlength="80" value="${esc(deck ? deck.name : '')}" placeholder="${esc(t('dlg.deckNamePh'))}"></label>
        <label class="field">${t('dlg.deckLang')}<small>${t('dlg.deckLangHelp')}</small><select id="dl"><option value="es">Castellano</option><option value="ca">Català</option><option value="en">English</option></select></label></div>`,
      buttons: [{ v: 'cancel', label: t('cancel'), cls: 'ghost' }, { v: 'ok', label: deck ? t('save') : t('dlg.create') }],
      onOpen: d => { d.querySelector('#dl').value = lang; },
      validate: d => { const n = d.querySelector('#dn'); if (!n.value.trim()) { n.focus(); n.style.borderColor = 'var(--red)'; return false; } }
    });
    if (v !== 'ok') return null;
    return { name: $('#dn', el).value.trim(), lang: $('#dl', el).value };
  };

  /* ---------- importar ---------- */
  U.importDialog = async (target /* mazo actual o null */) => {
    const { v, el } = await U.modal({
      title: t('imp.title'), wide: true,
      body: `<div class="stack">
        <p class="muted">${t('imp.intro')}</p>
        <div class="imp-tools row">
          <button type="button" class="btn ghost small" data-imp="tpl">${t('imp.tplBtn')}</button>
          <button type="button" class="btn ghost small" data-imp="tplcopy">${t('imp.tplCopy')}</button>
          <button type="button" class="btn ghost small" data-imp="file">⭳ ${t('imp.tplFileBtn')}</button>
        </div>
        <details class="imp-ai"><summary>${t('imp.ai.title')}</summary>
          <div class="stack" style="margin-top:10px">
            <p class="muted">${t('imp.ai.intro')}</p>
            <div class="grid cols-2">
              <label class="field">${t('imp.ai.topic')}<input type="text" id="ai-topic" maxlength="120" placeholder="${esc(t('imp.ai.topicPh'))}"></label>
              <label class="field">${t('imp.ai.n')}<input type="number" id="ai-n" min="3" max="200" value="20"></label>
              <label class="field">${t('imp.ai.level')}<select id="ai-level">${[1, 2, 3, 4, 5].map(i => `<option value="${i}"${i === 4 ? ' selected' : ''}>${esc(t('imp.lv' + i))}</option>`).join('')}</select></label>
              <label class="field">${t('imp.ai.lang')}<select id="ai-lang">${['es', 'ca', 'en'].map(l => `<option value="${l}"${l === K.lang ? ' selected' : ''}>${esc(t('imp.lname.' + l))}</option>`).join('')}</select></label>
            </div>
            <label class="field">${t('imp.ai.out')}<textarea id="ai-out" rows="9" readonly spellcheck="false"></textarea></label>
            <div class="row"><button type="button" class="btn small" data-imp="aicopy">${t('imp.ai.copy')}</button></div>
            <p class="disclaimer">${t('imp.ai.warn')}</p>
          </div></details>
        <div class="grid cols-2">
          <label class="field">${t('imp.file')}<input type="file" id="if" accept=".csv,.tsv,.txt,text/csv,text/plain"></label>
          <label class="field">${t('imp.deckName')}<input type="text" id="in" maxlength="80" placeholder="${esc(t('dlg.deckNamePh'))}"></label>
        </div>
        <label class="field">${t('imp.paste')}<textarea id="it" rows="7" spellcheck="false" placeholder="${esc(t('imp.ph'))}"></textarea></label>
        ${target ? `<div class="seg" role="group"><button type="button" data-tg="cur" aria-pressed="true">${t('imp.toCurrent', { name: esc(target.name) })}</button><button type="button" data-tg="new" aria-pressed="false">${t('imp.toNew')}</button></div>` : ''}
        <div id="ip" class="imp-prev muted" aria-live="polite">${t('imp.waiting')}</div></div>`,
      buttons: [{ v: 'cancel', label: t('cancel'), cls: 'ghost' }, { v: 'ok', label: t('imp.do'), id: 'ok' }],
      onOpen: d => {
        let mode = target ? 'cur' : 'new'; const ta = d.querySelector('#it'), prev = d.querySelector('#ip'), ok = d.querySelector('[data-v="ok"]');
        const nameField = d.querySelector('#in').closest('label');
        const upd = () => {
          nameField.style.display = mode === 'cur' ? 'none' : '';
          const r = TJ.parseImport(ta.value); d._res = r;
          if (!ta.value.trim()) { prev.textContent = t('imp.waiting'); ok.disabled = true; return; }
          if (!r.cards.length) { prev.innerHTML = `<span class="badge-bad">${t('imp.none')}</span>`; ok.disabled = true; return; }
          ok.disabled = false;
          prev.innerHTML = `<strong class="badge-ok">${t('imp.found', { n: r.cards.length })}</strong>${r.skipped ? ` · <span class="badge-warn">${t('imp.skipped', { n: r.skipped })}</span>` : ''}${r.header ? ` · ${t('imp.header')}` : ''}
            <ul>${r.cards.slice(0, 3).map(c => `<li><b>${esc(c.q.slice(0, 70))}</b> → ${esc(c.a.slice(0, 60))}</li>`).join('')}</ul>`;
        };
        d._mode = () => mode; d._upd = upd;
        ta.addEventListener('input', upd);
        d.querySelector('#if').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { ta.value = await K.readFile(f); const n = d.querySelector('#in'); if (!n.value) n.value = f.name.replace(/\.[^.]+$/, ''); upd(); } catch (_) { K.toast(t('error')); } });
        d.querySelectorAll('[data-tg]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.tg; d.querySelectorAll('[data-tg]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); upd(); }));
        /* ayudas de importación: plantilla de texto, plantilla de archivo y sugerencia para una IA */
        const copyText = async (s, msg) => { try { await navigator.clipboard.writeText(s); K.toast(msg || t('copied')); } catch (_) { K.toast(s.split('\n')[0], 3000); } };
        d.querySelector('[data-imp="tpl"]').addEventListener('click', () => {
          if (ta.value.trim()) { K.toast(t('imp.tplNotEmpty'), 3200); return; }
          ta.value = t('imp.tpl'); upd(); K.toast(t('imp.tplInserted'), 3500);
        });
        d.querySelector('[data-imp="tplcopy"]').addEventListener('click', () => copyText(t('imp.tpl')));
        d.querySelector('[data-imp="file"]').addEventListener('click', () => {
          K.download(t('imp.tplFileName'), '\ufeff' + t('imp.tpl').replace(/\n/g, '\r\n'), 'text/csv;charset=utf-8'); K.toast(t('imp.tplFileDone'), 4000);
        });
        const ai = { topic: d.querySelector('#ai-topic'), n: d.querySelector('#ai-n'), level: d.querySelector('#ai-level'), lang: d.querySelector('#ai-lang'), out: d.querySelector('#ai-out') };
        const buildAI = () => {
          const rep = { '<<topic>>': ai.topic.value.trim() || t('imp.ai.topicDefault'), '<<n>>': String(K.clamp(parseInt(ai.n.value, 10) || 20, 3, 200)), '<<level>>': t('imp.lv' + ai.level.value), '<<lang>>': t('imp.lname.' + ai.lang.value) };
          ai.out.value = Object.keys(rep).reduce((s, k) => s.split(k).join(rep[k]), t('imp.ai.prompt'));
        };
        ['input', 'change'].forEach(ev => [ai.topic, ai.n, ai.level, ai.lang].forEach(el => el.addEventListener(ev, buildAI)));
        d.querySelector('[data-imp="aicopy"]').addEventListener('click', () => copyText(ai.out.value, t('imp.ai.copied')));
        buildAI();
        upd();
      }
    });
    if (v !== 'ok') return null;
    const r = el._res; if (!r || !r.cards.length) return null;
    return { cards: r.cards, mode: el._mode(), name: ($('#in', el).value || '').trim() };
  };
  U.runImport = async (target) => {
    const r = await U.importDialog(target); if (!r) return;
    let deck = target;
    if (!deck || r.mode === 'new') { deck = TJ.newDeck(uniqueName(r.name || t('imp.defaultName')), K.lang); S.decks.set(deck.id, deck); }
    r.cards.forEach(c => deck.cards.push(TJ.newCard(c.q, c.a, c.topic, c.hint)));
    U.saveDeck(deck); K.toast(t('imp.done', { n: r.cards.length }));
    if (!target) U.go('d/' + deck.id + '/study'); else U.render();
  };

  /* ---------- exportar y copia de seguridad ---------- */
  U.exportCSV = (deck) => {
    const rows = TJ.deckRows(deck, [t('csv.q'), t('csv.a'), t('csv.topic'), t('csv.hint')]);
    K.download(U.slug(deck.name) + '.csv', '﻿' + K.toCSV(rows), 'text/csv;charset=utf-8'); K.toast(t('exp.done'));
  };
  U.exportBackup = () => {
    const data = { app: 'tarjetas', v: 1, exported: new Date().toISOString(), decks: [...S.decks.values()] };
    K.download('tarjetas-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(data), 'application/json');
    S.prefs.lastBackup = Date.now(); S.prefs.since = 0; U.savePrefs(); K.toast(t('bak.done')); if (U.route().view === 'library') U.render();
  };
  U.restoreBackup = async (file) => {
    let data; try { data = JSON.parse(await K.readFile(file)); } catch (_) { K.toast(t('bak.invalid'), 3500); return; }
    if (!data || data.app !== 'tarjetas' || !Array.isArray(data.decks)) { K.toast(t('bak.invalid'), 3500); return; }
    const decks = data.decks.map(TJ.normalizeDeck).filter(Boolean);
    if (!decks.length) { K.toast(t('bak.invalid'), 3500); return; }
    const cards = decks.reduce((a, d) => a + d.cards.length, 0);
    if (!await U.confirm(t('bak.confirm', { d: decks.length, c: cards }), { okText: t('bak.restore') })) return;
    decks.forEach(d => { S.decks.set(d.id, d); U.saveDeck(d); });
    K.toast(t('bak.restored', { d: decks.length })); U.render();
  };

  /* ---------- ayuda ---------- */
  U.help = () => U.modal({
    title: t('help.title'), wide: true,
    body: `<div class="help">${['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(k => `<section><h3>${t('help.' + k)}</h3><p>${t('help.' + k + 'b')}</p></section>`).join('')}
      <section><h3>${t('help.keys')}</h3><ul class="keys"><li><kbd>Space</kbd> / <kbd>Enter</kbd> ${t('help.k1')}</li><li><kbd>1</kbd>–<kbd>4</kbd> ${t('help.k2')}</li><li><kbd>Z</kbd> ${t('help.k3')}</li><li><kbd>H</kbd> ${t('help.k4')}</li><li><kbd>S</kbd> ${t('help.k5')}</li><li><kbd>Esc</kbd> ${t('help.k6')}</li></ul></section></div>`,
    buttons: [{ v: 'ok', label: t('close') }]
  });

  /* ---------- tarjeta de mazo ---------- */
  function deckCard(d, now) {
    const c = TJ.counts(d, now), stt = TJ.deckStats(d, now);
    const mastered = stt.total ? stt.mature / stt.total : 0, learned = stt.total ? (stt.mature + stt.young) / stt.total : 0;
    const topic = d.sample && SAMPLES.find(s => s.id === d.sample);
    return `<article class="deck" data-id="${d.id}" style="--h:${U.hueOf(d.id)}">
      <div class="deck-top">
        <span class="deck-ico">${ICONS[(topic && topic.icon) || 'cards']}</span>
        <div class="grow"><h3><a href="#/d/${d.id}/study">${esc(d.name)}</a></h3><small class="muted">${t('lib.cards', { n: c.total })} · ${d.lang.toUpperCase()}</small></div>
        <details class="menu"><summary class="icon-btn" aria-label="${esc(t('lib.menu'))}">${ICONS.dots}</summary>
          <div class="menu-pop" role="menu">
            <button type="button" data-act="rename" data-id="${d.id}" role="menuitem">${t('lib.rename')}</button>
            <button type="button" data-act="dup" data-id="${d.id}" role="menuitem">${t('lib.duplicate')}</button>
            <button type="button" data-act="csv" data-id="${d.id}" role="menuitem">${t('lib.exportCsv')}</button>
            <button type="button" data-act="delete" data-id="${d.id}" role="menuitem" class="danger">${t('lib.delete')}</button>
          </div></details>
      </div>
      <div class="deck-counts" role="group" aria-label="${esc(t('lib.pending'))}">
        <span class="cnt cn"><b>${c.newAvail}</b>${t('study.new')}</span><span class="cnt cl"><b>${c.learn}</b>${t('study.learning')}</span><span class="cnt cr"><b>${c.revAvail}</b>${t('study.review')}</span>
      </div>
      <div class="progress" role="img" aria-label="${esc(t('lib.progress', { p: K.fmt(learned * 100, 0) }))}"><i style="width:${Math.round(learned * 100)}%"></i></div>
      <small class="muted">${t('lib.mastered', { p: K.fmt(mastered * 100, 0), l: K.fmt(learned * 100, 0) })}</small>
      <div class="row deck-actions">
        <button type="button" class="btn ${c.due ? '' : 'ghost'}" data-act="study" data-id="${d.id}">${c.due ? t('lib.study', { n: c.due }) : t('lib.upToDate')}</button>
        <a class="btn ghost small" href="#/d/${d.id}/cards">${t('deck.tabCards')}</a><a class="btn ghost small" href="#/d/${d.id}/stats">${t('deck.tabStats')}</a>
      </div></article>`;
  }

  U.banners = () => {
    let h = `<div class="panel warn" id="storageBanner" ${S.storageOk ? 'hidden' : ''}><strong>${t('warn.storageTitle')}</strong> ${t('warn.storage')}</div>`;
    const total = [...S.decks.values()].reduce((a, d) => a + d.cards.length, 0);
    if (S.storageOk && total && S.prefs.since >= 30) h += `<div class="panel note row spread"><span>${t('bak.remind')}</span><span class="row"><button type="button" class="btn small" data-act="backup-export">${t('bak.export')}</button><button type="button" class="btn small ghost" data-act="backup-later">${t('bak.later')}</button></span></div>`;
    return h;
  };

  U.renderLibrary = () => {
    const now = Date.now(), decks = [...S.decks.values()].sort((a, b) => a.created - b.created);
    const due = decks.reduce((a, d) => a + TJ.counts(d, now).due, 0), cards = decks.reduce((a, d) => a + d.cards.length, 0);
    const st = TJ.streak(decks, now), today = (TJ.aggDays(decks)[TJ.keyOf(TJ.dayIndex(now))] || { n: 0 }).n;
    const samplesHtml = SAMPLES.map(s => {
      const added = [...S.decks.values()].some(d => d.sample === s.id);
      return `<article class="deck sample" style="--h:${U.hueOf(s.id)}"><div class="deck-top"><span class="deck-ico">${ICONS[s.icon] || ICONS.cards}</span><div class="grow"><h3>${esc(s.name[K.lang])}</h3><small class="muted">${t('lib.cards', { n: s.cards.length })}</small></div></div>
        <p class="muted">${esc(s.desc[K.lang])}</p>
        <div class="row"><button type="button" class="btn ${added ? 'ghost' : ''} small" data-act="sample" data-id="${s.id}">${added ? t('lib.addAgain') : t('lib.addSample')}</button></div></article>`;
    }).join('');
    U.root().innerHTML = `
      <section class="lib-head">
        <div class="grow"><h2>${t('lib.title')}</h2><p class="muted">${t('lib.sub')}</p></div>
        <div class="row">
          <button type="button" class="btn" data-act="new-deck">${ICONS.plus}<span>${t('lib.newDeck')}</span></button>
          <button type="button" class="btn ghost" data-act="import">${t('lib.import')}</button>
          <details class="menu"><summary class="btn ghost">${t('bak.menu')}</summary><div class="menu-pop right" role="menu">
            <button type="button" data-act="backup-export" role="menuitem">${t('bak.export')}</button>
            <label class="menu-item" role="menuitem" tabindex="0">${t('bak.restoreFile')}<input type="file" id="restoreFile" accept=".json,application/json" hidden></label></div></details>
          <button type="button" class="btn ghost" data-act="help">${t('help.btn')}</button>
        </div>
      </section>
      ${U.banners()}
      ${cards ? `<section class="grid cols-4 tiles">
        <div class="stat"><b>${due}</b><span>${t('lib.dueToday')}</span></div>
        <div class="stat"><b>${st.streak}</b><span>${t('lib.streak')}</span></div>
        <div class="stat"><b>${today}</b><span>${t('lib.reviewedToday')}</span></div>
        <div class="stat"><b>${cards}</b><span>${t('lib.totalCards')}</span></div></section>` : ''}
      ${decks.length ? `<section><h3 class="sec">${t('lib.myDecks')}</h3><div class="decks">${decks.map(d => deckCard(d, now)).join('')}</div></section>`
        : `<section class="panel empty-lib"><h3>${t('lib.emptyTitle')}</h3><p class="muted">${t('lib.emptyText')}</p></section>`}
      <section><h3 class="sec">${t('lib.samples')}</h3><p class="muted">${t('lib.samplesSub')}</p><div class="decks">${samplesHtml}</div></section>
      <section class="panel privacy"><h3>${t('priv.title')}</h3><p>${t('priv.text')}</p></section>`;
    const rf = $('#restoreFile'); if (rf) rf.addEventListener('change', e => { if (e.target.files[0]) U.restoreBackup(e.target.files[0]); e.target.value = ''; });
  };

  /* ---------- acciones de la biblioteca ---------- */
  const A = U.ACT;
  A['new-deck'] = async () => { const r = await U.deckDialog(null); if (!r) return; const d = TJ.newDeck(uniqueName(r.name), r.lang); S.decks.set(d.id, d); U.saveDeck(d); U.go('d/' + d.id + '/cards'); K.toast(t('dlg.created')); };
  A.import = () => U.runImport(null);
  A.help = () => U.help();
  A['backup-export'] = () => U.exportBackup();
  A['backup-later'] = () => { S.prefs.since = 0; U.savePrefs(); U.render(); };
  A.study = (el) => { const d = S.decks.get(el.dataset.id); if (!d) return; if (TJ.counts(d, Date.now()).due > 0 && d.cards.length) { U.startSession(d.id, { mode: 'daily', topic: '', shuffle: S.opts.shuffle, reverse: S.opts.reverse }); } else U.go('d/' + d.id + '/study'); };
  A.rename = async (el) => { const d = S.decks.get(el.dataset.id); const r = await U.deckDialog(d); if (!r) return; d.name = uniqueName(r.name, d.id); d.lang = r.lang; U.saveDeck(d); U.render(); };
  A.dup = (el) => { const d = S.decks.get(el.dataset.id); const n = TJ.normalizeDeck(JSON.parse(JSON.stringify(d))); n.id = TJ.uid(); n.name = uniqueName(d.name + ' (' + t('lib.copy') + ')'); n.cards.forEach(c => { c.id = TJ.uid(); Object.assign(c, { st: 0, step: 0, ease: 0, ivl: 0, due: 0, reps: 0, lapses: 0, last: 0 }); }); n.days = {}; S.decks.set(n.id, n); U.saveDeck(n); K.toast(t('lib.duplicated')); U.render(); };
  A.csv = (el) => U.exportCSV(S.decks.get(el.dataset.id));
  A.delete = async (el) => { const d = S.decks.get(el.dataset.id); if (!await U.confirm(t('lib.deleteConfirm', { name: d.name, n: d.cards.length }), { okText: t('delete'), danger: true })) return; U.removeDeck(d.id); K.toast(t('lib.deleted')); U.render(); };
  A.sample = (el) => {
    const s = SAMPLES.find(x => x.id === el.dataset.id), L = K.lang; if (!s) return;
    const d = TJ.newDeck(uniqueName(s.name[L]), L); d.sample = s.id;
    s.cards.forEach(cd => { const x = cd[L]; d.cards.push(TJ.newCard(x[0], x[1], s.topics[cd.t][L])); });
    S.decks.set(d.id, d); U.saveDeck(d); K.toast(t('lib.sampleAdded', { name: d.name })); U.render();
  };
  document.addEventListener('click', e => {
    $$('details.menu[open]').forEach(m => { if (!m.contains(e.target)) m.open = false; });
    const el = e.target.closest('[data-act]'); if (!el) return;
    const f = A[el.dataset.act]; if (!f) return;
    const m = el.closest('details.menu'); if (m) m.open = false;
    e.preventDefault(); f(el, e);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('details.menu[open]').forEach(m => { m.open = false; }); if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('label.menu-item')) { e.preventDefault(); e.target.querySelector('input').click(); } });
})();
