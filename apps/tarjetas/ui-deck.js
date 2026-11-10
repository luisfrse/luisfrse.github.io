/* ============================================================
   Tarjetas de estudio · página del mazo, editor, estadísticas,
   ajustes y sesión de estudio
   ============================================================ */
(function () {
  'use strict';
  const TJ = window.TJ, U = TJ.ui, K = U.K, t = U.t, S = U.S, $ = U.$, $$ = U.$$, esc = U.esc, A = U.ACT, ICONS = U.ICONS;
  const SAMPLES = window.TJ_SAMPLES || [];
  const BCP = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };
  S.cv = { q: '', topic: '', order: 'created', view: 'list', limit: 100 };      // estado de la pestaña «Tarjetas»

  U.go = (path) => { const h = '#/' + path; if (location.hash === h) U.render(); else location.hash = h; };
  const deckOf = () => S.decks.get(U.route().id);
  const STATE = { 0: 'new', 1: 'learning', 2: 'review', 3: 'learning' };

  /* =====================================================================
     PÁGINA DEL MAZO
     ===================================================================== */
  U.renderDeck = (route) => {
    const d = S.decks.get(route.id); if (!d) return U.go('');
    const tabs = [['study', t('deck.tabStudy')], ['cards', `${t('deck.tabCards')} (${d.cards.length})`], ['stats', t('deck.tabStats')], ['settings', t('deck.tabSettings')]];
    U.root().innerHTML = `
      <div class="deck-head"><a class="back-link" href="#/">← ${t('deck.all')}</a>
        <div class="row spread"><h2>${esc(d.name)}</h2><span class="chip">${t('lib.cards', { n: d.cards.length })} · ${d.lang.toUpperCase()}</span></div></div>
      ${U.banners()}
      <nav class="tabs" role="tablist" aria-label="${esc(d.name)}">${tabs.map(([k, l]) => `<a role="tab" href="#/d/${d.id}/${k}" aria-selected="${k === route.tab}">${l}</a>`).join('')}</nav>
      <div id="tabbody" role="tabpanel"></div>`;
    ({ study: studyTab, cards: cardsTab, stats: statsTab, settings: settingsTab })[route.tab](d, $('#tabbody'));
  };

  /* ---------- pestaña: estudiar ---------- */
  function studyTab(d, box) {
    const now = Date.now(), c = TJ.counts(d, now), o = S.opts, topics = TJ.topicsOf(d), next = TJ.nextDue(d, now);
    const stt = TJ.deckStats(d, now), last7 = stt.rev30.slice(-7), max7 = Math.max(1, ...last7.map(x => x.n));
    const nothing = !d.cards.length, caught = !nothing && c.due === 0;
    const canStart = o.mode === 'all' ? d.cards.length > 0 : c.due > 0;
    box.innerHTML = `<div class="grid cols-2 study-grid">
      <section class="panel start">
        <h3>${t('study.today')}</h3>
        <div class="big-counts"><div class="bc cn"><b>${c.newAvail}</b><span>${t('study.new')}</span></div><div class="bc cl"><b>${c.learn}</b><span>${t('study.learning')}</span></div><div class="bc cr"><b>${c.revAvail}</b><span>${t('study.review')}</span></div></div>
        ${nothing ? `<div class="empty">${t('study.empty')}<div class="row" style="justify-content:center;margin-top:12px"><a class="btn small" href="#/d/${d.id}/cards">${t('study.addCards')}</a><button type="button" class="btn small ghost" data-act="import-here">${t('lib.import')}</button></div></div>` : ''}
        ${caught && o.mode === 'daily' ? `<p class="allDone"><strong>${t('study.caughtUp')}</strong> ${next != null ? t('study.nextDue', { when: U.relDays(next) }) : ''}</p>` : ''}
        ${nothing ? '' : `<div class="stack opts">
          <div class="seg" role="group" aria-label="${esc(t('study.mode'))}"><button type="button" data-mode="daily" aria-pressed="${o.mode === 'daily'}">${t('study.modeDaily')}</button><button type="button" data-mode="all" aria-pressed="${o.mode === 'all'}">${t('study.modeAll')}</button></div>
          <p class="muted mode-help">${o.mode === 'daily' ? t('study.helpDaily') : t('study.helpAll')}</p>
          ${topics.length ? `<label class="field">${t('study.topic')}<select id="so-topic"><option value="">${t('study.allTopics')}</option>${topics.map(x => `<option value="${esc(x)}" ${o.topic === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>` : ''}
          <label class="check"><input type="checkbox" id="so-rev" ${o.reverse ? 'checked' : ''}> ${t('study.reverse')}</label>
          <label class="check"><input type="checkbox" id="so-shuf" ${o.shuffle ? 'checked' : ''}> ${t('study.shuffle')}</label>
          <label class="check"><input type="checkbox" id="so-speak" ${S.prefs.autoSpeak ? 'checked' : ''}> ${t('study.autoSpeak')}</label>
        </div>
        <div class="row"><button type="button" class="btn big" id="so-go" ${canStart ? '' : 'disabled'}>${t('study.start')}</button>
          ${o.mode === 'daily' && c.nNew > c.newAvail ? `<button type="button" class="btn ghost" id="so-more">${t('study.moreNew', { n: Math.min(10, c.nNew - c.newAvail) })}</button>` : ''}</div>`}
      </section>
      <section class="panel">
        <h3>${t('study.last7')}</h3>
        <div class="mini-bars" role="img" aria-label="${esc(t('study.last7'))}: ${last7.map(x => x.n).join(', ')}">${last7.map(x => `<div title="${x.key}: ${x.n}"><i style="height:${Math.round(x.n / max7 * 100)}%"></i><span>${x.key.slice(8)}</span></div>`).join('')}</div>
        <div class="grid cols-2 mini-stats"><div class="stat"><b>${stt.total}</b><span>${t('stats.total')}</span></div><div class="stat"><b>${U.pct(stt.retention)}</b><span>${t('stats.retention')}</span></div></div>
        ${topics.length ? `<h3 style="margin-top:16px">${t('study.topics')}</h3><div class="row">${topics.map(x => `<span class="chip">${esc(x)} · ${d.cards.filter(cc => cc.topic === x).length}</span>`).join('')}</div>` : ''}
      </section></div>`;
    const redo = () => studyTab(d, box);
    $$('[data-mode]', box).forEach(b => b.addEventListener('click', () => { o.mode = b.dataset.mode; U.savePrefs(); redo(); }));
    const on = (id, f) => { const e = $(id, box); if (e) e.addEventListener('change', f); };
    on('#so-topic', e => { o.topic = e.target.value; });
    on('#so-rev', e => { o.reverse = e.target.checked; U.savePrefs(); });
    on('#so-shuf', e => { o.shuffle = e.target.checked; U.savePrefs(); });
    on('#so-speak', e => { S.prefs.autoSpeak = e.target.checked; U.savePrefs(); });
    const go = $('#so-go', box); if (go) go.addEventListener('click', () => U.startSession(d.id, { mode: o.mode, topic: o.topic, shuffle: o.shuffle, reverse: o.reverse }));
    const more = $('#so-more', box); if (more) more.addEventListener('click', () => U.startSession(d.id, { mode: 'daily', topic: o.topic, shuffle: o.shuffle, reverse: o.reverse, extraNew: 10 }));
  }
  A['import-here'] = () => U.runImport(deckOf());

  /* =====================================================================
     PESTAÑA: TARJETAS (editor)
     ===================================================================== */
  function cardStatus(c) {
    if (c.st === 0) return { k: 'new', label: t('st.new') };
    if (c.st === 1 || c.st === 3) return { k: 'learning', label: t('st.learning') };
    return { k: 'review', label: t('st.review', { d: c.ivl }), due: c.due };
  }
  function filterCards(d) {
    const v = S.cv, q = v.q.trim().toLowerCase();
    let list = d.cards.filter(c => (!v.topic || c.topic === v.topic) && (!q || (c.q + ' ' + c.a + ' ' + c.topic).toLowerCase().includes(q)));
    if (v.order === 'due') list = list.slice().sort((a, b) => (a.st === 0) - (b.st === 0) || a.due - b.due);
    else if (v.order === 'lapses') list = list.slice().sort((a, b) => b.lapses - a.lapses || b.reps - a.reps);
    else if (v.order === 'alpha') list = list.slice().sort((a, b) => TJ.plain(a.q, 'show').localeCompare(TJ.plain(b.q, 'show'), K.lang));
    return list;
  }
  function cardsTab(d, box) {
    const v = S.cv, topics = TJ.topicsOf(d);
    box.innerHTML = `<div class="panel">
      <div class="toolbar row">
        <input type="search" id="cq" class="grow" placeholder="${esc(t('cards.search'))}" value="${esc(v.q)}" aria-label="${esc(t('cards.search'))}">
        ${topics.length ? `<select id="ct" aria-label="${esc(t('study.topic'))}"><option value="">${t('study.allTopics')}</option>${topics.map(x => `<option value="${esc(x)}" ${v.topic === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>` : ''}
        <select id="co" aria-label="${esc(t('cards.order'))}">${['created', 'due', 'lapses', 'alpha'].map(o => `<option value="${o}" ${v.order === o ? 'selected' : ''}>${t('cards.o_' + o)}</option>`).join('')}</select>
        <div class="seg" role="group"><button type="button" data-view="list" aria-pressed="${v.view === 'list'}">${t('cards.list')}</button><button type="button" data-view="table" aria-pressed="${v.view === 'table'}">${t('cards.table')}</button></div>
      </div>
      <div class="row spread toolbar2"><span class="muted" id="ccount"></span>
        <span class="row"><button type="button" class="btn small" data-act="add-card">${ICONS.plus}<span>${t('cards.add')}</span></button><button type="button" class="btn small ghost" data-act="import-here">${t('lib.import')}</button><button type="button" class="btn small ghost" data-act="csv" data-id="${d.id}">${t('lib.exportCsv')}</button></span></div>
      <div id="clist"></div></div>`;
    const paint = () => {
      const list = filterCards(d), shown = list.slice(0, v.limit), now = Date.now();
      $('#ccount', box).textContent = t('cards.count', { n: list.length, t: d.cards.length });
      const status = (c) => { const s = cardStatus(c); return `<span class="st st-${s.k}">${esc(s.label)}</span>${s.due ? `<small class="muted"> · ${esc(U.relDays(TJ.dayIndex(s.due) - TJ.dayIndex(now)))}</small>` : ''}`; };
      let html;
      if (!d.cards.length) html = `<div class="empty">${t('cards.empty')}</div>`;
      else if (!list.length) html = `<div class="empty">${t('cards.noMatch')}</div>`;
      else if (v.view === 'table') {
        html = `<div class="table-wrap"><table class="kit"><thead><tr><th>${t('csv.q')}</th><th>${t('csv.a')}</th><th>${t('csv.topic')}</th><th>${t('cards.status')}</th></tr></thead><tbody>${shown.map(c => `<tr class="clickable" tabindex="0" data-act="edit-card" data-cid="${c.id}"><td>${esc(TJ.plain(c.q, 'show').slice(0, 120))}</td><td>${esc(TJ.plain(c.a).slice(0, 120))}</td><td>${esc(c.topic)}</td><td>${status(c)}</td></tr>`).join('')}</tbody></table></div>`;
      } else {
        html = `<ul class="clist">${shown.map(c => `<li><button type="button" class="citem" data-act="edit-card" data-cid="${c.id}"><span class="cq">${TJ.fmtRich(c.q, TJ.isCloze(c) ? 'show' : null)}</span><span class="ca">${c.a ? TJ.fmtRich(c.a) : ''}</span><span class="cm">${c.topic ? `<span class="chip">${esc(c.topic)}</span>` : ''}${TJ.isCloze(c) ? `<span class="chip">${t('cards.cloze')}</span>` : ''}${status(c)}</span></button></li>`).join('')}</ul>`;
      }
      if (list.length > shown.length) html += `<div class="row" style="justify-content:center;margin-top:14px"><button type="button" class="btn ghost" id="cmore">${t('cards.more', { n: Math.min(100, list.length - shown.length) })}</button></div>`;
      $('#clist', box).innerHTML = html;
      const m = $('#cmore', box); if (m) m.addEventListener('click', () => { v.limit += 100; paint(); });
    };
    paint();
    $('#cq', box).addEventListener('input', K.debounce(e => { v.q = e.target.value; v.limit = 100; paint(); }, 150));
    const ct = $('#ct', box); if (ct) ct.addEventListener('change', e => { v.topic = e.target.value; v.limit = 100; paint(); });
    $('#co', box).addEventListener('change', e => { v.order = e.target.value; paint(); });
    $$('[data-view]', box).forEach(b => b.addEventListener('click', () => { v.view = b.dataset.view; cardsTab(d, box); }));
    box.onkeydown = e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('tr.clickable')) e.target.click(); };
  }
  A['add-card'] = () => U.cardEditor(deckOf(), null);
  A['edit-card'] = (el) => { const d = deckOf(); U.cardEditor(d, d.cards.find(c => c.id === el.dataset.cid)); };

  /* ---------- editor de una tarjeta ---------- */
  U.cardEditor = async (deck, card) => {
    const topics = TJ.topicsOf(deck), isNew = !card;
    const buttons = [{ v: 'cancel', label: t('cancel'), cls: 'ghost' }];
    if (!isNew) buttons.push({ v: 'reset', label: t('cards.resetOne'), cls: 'ghost' }, { v: 'delete', label: t('delete'), cls: 'danger' });
    else buttons.push({ v: 'again', label: t('cards.saveNew'), cls: 'ghost' });
    buttons.push({ v: 'save', label: t('save') });
    const { v, el } = await U.modal({
      title: isNew ? t('cards.newTitle') : t('cards.editTitle'), wide: true, cls: 'editor', buttons,
      body: `<div class="stack">
        <div class="row ed-tools" role="toolbar" aria-label="${esc(t('cards.format'))}">
          <button type="button" class="btn small ghost" data-fmt="b" title="${esc(t('cards.bold'))}"><b>B</b></button>
          <button type="button" class="btn small ghost" data-fmt="i" title="${esc(t('cards.italic'))}"><i>I</i></button>
          <button type="button" class="btn small ghost" data-fmt="c" title="${esc(t('cards.clozeTip'))}">{{…}} ${t('cards.cloze')}</button>
          <small class="muted">${t('cards.formatHelp')}</small></div>
        <label class="field"><span id="lq">${t('cards.front')}</span><textarea id="eq" rows="3" maxlength="2000">${esc(card ? card.q : '')}</textarea></label>
        <label class="field"><span id="la">${t('cards.back')}</span><textarea id="ea" rows="3" maxlength="4000">${esc(card ? card.a : '')}</textarea></label>
        <div class="grid cols-2">
          <label class="field">${t('csv.topic')}<input type="text" id="et" list="topics" maxlength="60" value="${esc(card ? card.topic : S.cv.topic)}"><datalist id="topics">${topics.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
          <label class="field">${t('csv.hint')}<input type="text" id="eh" maxlength="200" value="${esc(card ? card.hint : '')}"></label></div>
        <div class="ed-prev grid cols-2"><div><small class="muted">${t('cards.previewFront')}</small><div class="pv" id="pf"></div></div><div><small class="muted">${t('cards.previewBack')}</small><div class="pv" id="pb"></div></div></div>
        <p class="badge-bad" id="eerr" hidden></p></div>`,
      validate: (d, val) => {
        if (val === 'delete' || val === 'reset') return true;
        const q = d.querySelector('#eq').value.trim(), a = d.querySelector('#ea').value.trim(), err = d.querySelector('#eerr');
        const cl = /\{\{c\d+::/.test(q);
        if (!q) { err.textContent = t('cards.errFront'); err.hidden = false; d.querySelector('#eq').focus(); return false; }
        if (!cl && !a) { err.textContent = t('cards.errBack'); err.hidden = false; d.querySelector('#ea').focus(); return false; }
        return true;
      },
      onOpen: (d) => {
        const q = d.querySelector('#eq'), a = d.querySelector('#ea');
        const upd = () => {
          const cl = /\{\{c\d+::/.test(q.value);
          d.querySelector('#la').textContent = cl ? t('cards.extra') : t('cards.back');
          d.querySelector('#pf').innerHTML = TJ.fmtRich(q.value || '…', cl ? 'hide' : null);
          d.querySelector('#pb').innerHTML = cl ? TJ.fmtRich(q.value || '…', 'show') + (a.value ? `<div class="extra">${TJ.fmtRich(a.value)}</div>` : '') : TJ.fmtRich(a.value || '…');
        };
        q.addEventListener('input', upd); a.addEventListener('input', upd); upd();
        d.querySelectorAll('[data-fmt]').forEach(b => b.addEventListener('click', () => {
          const ta = document.activeElement === a ? a : q, s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e), k = b.dataset.fmt;
          let n = 1; (ta.value.match(/\{\{c(\d+)::/g) || []).forEach(m => { n = Math.max(n, parseInt(m.slice(3), 10) + 1); });
          const ins = k === 'b' ? `**${sel || '…'}**` : k === 'i' ? `*${sel || '…'}*` : `{{c${n}::${sel || '…'}}}`;
          ta.setRangeText(ins, s, e, 'select'); ta.focus(); upd();
        }));
      }
    });
    if (v === 'cancel') return;
    const g = (id) => $(id, el).value.trim();
    if (v === 'delete') { if (await U.confirm(t('cards.deleteConfirm'), { okText: t('delete'), danger: true })) { deck.cards = deck.cards.filter(c => c !== card); U.saveDeck(deck); K.toast(t('cards.deleted')); U.render(); } return; }
    if (v === 'reset') { Object.assign(card, { st: 0, step: 0, ease: 0, ivl: 0, due: 0, reps: 0, lapses: 0, last: 0 }); U.saveDeck(deck); K.toast(t('cards.resetDone')); U.render(); return; }
    const data = { q: g('#eq'), a: g('#ea'), topic: g('#et'), hint: g('#eh') };
    if (isNew) { deck.cards.push(TJ.newCard(data.q, data.a, data.topic, data.hint)); } else Object.assign(card, data);
    U.saveDeck(deck); K.toast(t('saved')); U.render();
    if (v === 'again') U.cardEditor(deck, null);
  };

  /* =====================================================================
     PESTAÑA: ESTADÍSTICAS
     ===================================================================== */
  function barsSVG(data, o) {
    const W = 640, H = 190, pl = 34, pb = 24, pt = 10, bw = (W - pl - 8) / data.length;
    const max = Math.max(1, ...data.map(x => x.a + (x.b || 0))), ch = H - pb - pt;
    const ticks = [0, Math.ceil(max / 2), max];
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.label)}" preserveAspectRatio="xMidYMid meet">`;
    ticks.forEach(tk => { const y = pt + ch - tk / max * ch; s += `<line x1="${pl}" x2="${W - 4}" y1="${y}" y2="${y}" class="gl"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end" class="gt">${tk}</text>`; });
    data.forEach((x, i) => {
      const bx = pl + i * bw + bw * .14, w = bw * .72, ha = x.a / max * ch, hb = (x.b || 0) / max * ch;
      s += `<g><title>${esc(x.title)}</title>`;
      if (x.a) s += `<rect x="${bx}" y="${pt + ch - ha}" width="${w}" height="${ha}" rx="2" fill="${o.ca}"/>`;
      if (x.b) s += `<rect x="${bx}" y="${pt + ch - ha - hb}" width="${w}" height="${hb}" rx="2" fill="${o.cb}"/>`;
      s += '</g>';
      if (i % o.every === 0 || i === data.length - 1) s += `<text x="${bx + w / 2}" y="${H - 6}" text-anchor="middle" class="gt">${esc(x.lbl)}</text>`;
    });
    return s + '</svg>';
  }
  function heatSVG(st) {
    const cell = 14, gap = 3, W = st.weeks * (cell + gap) + 4, H = 7 * (cell + gap) + 4, vals = st.heat.filter(Boolean).map(x => x.n), mx = Math.max(1, ...vals);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="heat" role="img" aria-label="${esc(t('stats.activity'))}">`;
    st.heat.forEach((c, i) => {
      if (!c) return; const col = Math.floor(i / 7), row = i % 7, lv = c.n === 0 ? 0 : Math.min(4, 1 + Math.floor(c.n / mx * 3.999));
      s += `<rect x="${2 + col * (cell + gap)}" y="${2 + row * (cell + gap)}" width="${cell}" height="${cell}" rx="3" class="h${lv}"><title>${c.key}: ${c.n}</title></rect>`;
    });
    return s + '</svg>';
  }
  function statsTab(d, box) {
    const now = Date.now(), st = TJ.deckStats(d, now), c = TJ.counts(d, now), sk = TJ.streak([d], now);
    const tot = Math.max(1, st.total), seg = (n, cls, lbl) => n ? `<i class="${cls}" style="width:${n / tot * 100}%" title="${esc(lbl)}: ${n}"></i>` : '';
    const dayLbl = (k) => k.slice(8) + '/' + k.slice(5, 7);
    const rev = st.rev30.map(x => ({ a: x.ok, b: x.bad, lbl: dayLbl(x.key), title: `${x.key}: ${x.n} (${x.bad} ${t('stats.again')})` }));
    const fore = st.fore.map((x, i) => ({ a: x.n, lbl: i === 0 ? t('rel.todayShort') : dayLbl(x.key), title: `${x.key}: ${x.n}` }));
    box.innerHTML = `
      <div class="grid cols-4 tiles">
        <div class="stat"><b>${c.due}</b><span>${t('lib.dueToday')}</span></div><div class="stat"><b>${U.pct(st.retention)}</b><span>${t('stats.retention')}</span></div>
        <div class="stat"><b>${sk.streak}</b><span>${t('lib.streak')}</span></div><div class="stat"><b>${st.totalReviews}</b><span>${t('stats.totalReviews')}</span></div></div>
      <div class="panel"><h3>${t('stats.maturity')}</h3>
        <div class="stack-bar" role="img" aria-label="${esc(t('stats.maturity'))}">${seg(st.mature, 'm4', t('stats.mature'))}${seg(st.young, 'm3', t('stats.young'))}${seg(st.learning, 'm2', t('stats.learning'))}${seg(st.nNew, 'm1', t('stats.new'))}</div>
        <ul class="legend"><li><i class="m4"></i>${t('stats.mature')} <b>${st.mature}</b></li><li><i class="m3"></i>${t('stats.young')} <b>${st.young}</b></li><li><i class="m2"></i>${t('stats.learning')} <b>${st.learning}</b></li><li><i class="m1"></i>${t('stats.new')} <b>${st.nNew}</b></li></ul>
        <small class="muted">${t('stats.matureHelp')}${st.avgEase ? ' · ' + t('stats.avgEase', { e: K.fmt(st.avgEase, 2) }) : ''}${st.avgMs ? ' · ' + t('stats.avgTime', { s: K.fmt(st.avgMs / 1000, 1) }) : ''}</small></div>
      <div class="grid cols-2">
        <div class="panel"><h3>${t('stats.reviews30')}</h3>${st.rev30.some(x => x.n) ? barsSVG(rev, { label: t('stats.reviews30'), ca: '#7fb2ea', cb: '#f87171', every: 5 }) : `<div class="empty">${t('stats.noData')}</div>`}
          <ul class="legend"><li><i style="background:#7fb2ea"></i>${t('stats.correct')}</li><li><i style="background:#f87171"></i>${t('stats.again')}</li></ul></div>
        <div class="panel"><h3>${t('stats.forecast')}</h3>${barsSVG(fore, { label: t('stats.forecast'), ca: '#b08be0', every: 2 })}<small class="muted">${t('stats.forecastHelp')}</small></div></div>
      <div class="panel"><h3>${t('stats.activity')}</h3><div class="heat-wrap">${heatSVG(st)}</div>
        <ul class="legend heat-leg"><li>${t('stats.less')}</li>${[0, 1, 2, 3, 4].map(i => `<li><svg width="14" height="14"><rect width="14" height="14" rx="3" class="h${i}"/></svg></li>`).join('')}<li>${t('stats.more')}</li></ul></div>`;
  }

  /* =====================================================================
     PESTAÑA: AJUSTES
     ===================================================================== */
  function settingsTab(d, box) {
    const s = TJ.settingsOf(d);
    box.innerHTML = `<div class="grid cols-2">
      <section class="panel"><h3>${t('set.general')}</h3><div class="stack">
        <label class="field">${t('dlg.deckName')}<input type="text" id="s-name" maxlength="80" value="${esc(d.name)}"></label>
        <label class="field">${t('dlg.deckLang')}<small>${t('dlg.deckLangHelp')}</small><select id="s-lang"><option value="es">Castellano</option><option value="ca">Català</option><option value="en">English</option></select></label></div></section>
      <section class="panel"><h3>${t('set.daily')}</h3><div class="grid cols-2">
        <label class="field">${t('set.newPerDay')}<input type="number" id="s-new" min="0" max="9999" value="${s.newPerDay}"></label>
        <label class="field">${t('set.maxReviews')}<input type="number" id="s-rev" min="0" max="99999" value="${s.maxReviews}"></label></div></section>
      <section class="panel"><h3>${t('set.algo')}</h3><p class="muted">${t('set.algoHelp')}</p><div class="grid cols-2">
        <label class="field">${t('set.steps')}<small>${t('set.stepsHelp')}</small><input type="text" id="s-steps" value="${s.steps.join(' ')}"></label>
        <label class="field">${t('set.relearn')}<small>${t('set.stepsHelp')}</small><input type="text" id="s-relearn" value="${s.relearn.join(' ')}"></label>
        <label class="field">${t('set.graduate')}<small>${t('set.days')}</small><input type="number" id="s-grad" min="1" max="365" value="${s.graduate}"></label>
        <label class="field">${t('set.easy')}<small>${t('set.days')}</small><input type="number" id="s-easy" min="1" max="365" value="${s.easy}"></label>
        <label class="field">${t('set.startEase')}<small>${t('set.percent')}</small><input type="number" id="s-ease" min="130" max="400" step="5" value="${Math.round(s.startEase / 10)}"></label>
        <label class="field">${t('set.lapse')}<small>${t('set.lapseHelp')}</small><input type="number" id="s-lapse" min="0" max="100" value="${s.lapseMult}"></label></div>
        <div class="row"><button type="button" class="btn small ghost" id="s-defaults">${t('set.defaults')}</button></div></section>
      <section class="panel"><h3>${t('set.data')}</h3><div class="stack">
        <div class="row"><button type="button" class="btn small ghost" data-act="csv" data-id="${d.id}">${t('lib.exportCsv')}</button><button type="button" class="btn small ghost" data-act="dup" data-id="${d.id}">${t('lib.duplicate')}</button></div>
        <hr class="sep"><p class="muted">${t('set.dangerHelp')}</p>
        <div class="row"><button type="button" class="btn small danger" id="s-reset">${t('set.reset')}</button><button type="button" class="btn small danger" id="s-del">${t('lib.delete')}</button></div></div></section></div>`;
    $('#s-lang', box).value = d.lang;
    const save = () => { U.saveDeck(d); K.toast(t('saved'), 1200); };
    const steps = (str, def) => { const a = String(str).split(/[\s,;]+/).map(Number).filter(x => x > 0 && x <= 10080); return a.length ? a.slice(0, 8) : def; };
    const num = (id, a, b, def) => { const v = parseFloat($(id, box).value); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : def; };
    const bind = (id, f) => $(id, box).addEventListener('change', () => { f(); save(); });
    bind('#s-name', () => { const n = $('#s-name', box).value.trim(); if (n) d.name = n; $('#s-name', box).value = d.name; $('.deck-head h2').textContent = d.name; });
    bind('#s-lang', () => { d.lang = $('#s-lang', box).value; });
    bind('#s-new', () => { d.set.newPerDay = Math.round(num('#s-new', 0, 9999, TJ.DEFAULTS.newPerDay)); $('#s-new', box).value = d.set.newPerDay; });
    bind('#s-rev', () => { d.set.maxReviews = Math.round(num('#s-rev', 0, 99999, TJ.DEFAULTS.maxReviews)); $('#s-rev', box).value = d.set.maxReviews; });
    bind('#s-steps', () => { d.set.steps = steps($('#s-steps', box).value, TJ.DEFAULTS.steps); $('#s-steps', box).value = d.set.steps.join(' '); });
    bind('#s-relearn', () => { d.set.relearn = steps($('#s-relearn', box).value, TJ.DEFAULTS.relearn); $('#s-relearn', box).value = d.set.relearn.join(' '); });
    bind('#s-grad', () => { d.set.graduate = Math.round(num('#s-grad', 1, 365, 1)); $('#s-grad', box).value = d.set.graduate; });
    bind('#s-easy', () => { d.set.easy = Math.round(num('#s-easy', 1, 365, 4)); $('#s-easy', box).value = d.set.easy; });
    bind('#s-ease', () => { d.set.startEase = Math.round(num('#s-ease', 130, 400, 250)) * 10; $('#s-ease', box).value = d.set.startEase / 10; });
    bind('#s-lapse', () => { d.set.lapseMult = Math.round(num('#s-lapse', 0, 100, 0)); $('#s-lapse', box).value = d.set.lapseMult; });
    $('#s-defaults', box).addEventListener('click', () => { d.set = {}; save(); settingsTab(d, box); });
    $('#s-reset', box).addEventListener('click', async () => {
      if (!await U.confirm(t('set.resetConfirm'), { okText: t('set.reset'), danger: true })) return;
      d.cards.forEach(c => Object.assign(c, { st: 0, step: 0, ease: 0, ivl: 0, due: 0, reps: 0, lapses: 0, last: 0 })); d.days = {}; U.saveDeck(d); K.toast(t('cards.resetDone')); U.render();
    });
    $('#s-del', box).addEventListener('click', async () => { if (!await U.confirm(t('lib.deleteConfirm', { name: d.name, n: d.cards.length }), { okText: t('delete'), danger: true })) return; U.removeDeck(d.id); K.toast(t('lib.deleted')); U.go(''); });
  }

  /* =====================================================================
     SESIÓN DE ESTUDIO
     ===================================================================== */
  U.startSession = (deckId, opts) => {
    const d = S.decks.get(deckId), s = TJ.buildSession(d, opts, Date.now());
    if ((opts.mode === 'all' && !s.cram.length) || (opts.mode !== 'all' && !s.main.length && !s.learning.length)) { K.toast(t('study.nothing')); return; }
    if (TJ.pickNext(s, d, Date.now()) === null) { K.toast(t('study.nothing')); return; }
    s.extraNew = opts.extraNew || 0; S.session = s; U.go('d/' + deckId + '/session');
  };
  const snapSession = (s) => ({ main: s.main.slice(), learning: s.learning.slice(), cram: s.cram.slice(), answered: s.answered, again: s.again, newSeen: s.newSeen, ms: s.ms, ratings: s.ratings.slice() });
  const restoreSession = (s, x) => Object.assign(s, { main: x.main.slice(), learning: x.learning.slice(), cram: x.cram.slice(), answered: x.answered, again: x.again, newSeen: x.newSeen, ms: x.ms, ratings: x.ratings.slice() });
  const speakLang = () => BCP[(deckOf() || {}).lang || K.lang];
  function speak(text) {
    if (!('speechSynthesis' in window)) { K.toast(t('study.noSpeech')); return; }
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = speakLang(); u.rate = .95; speechSynthesis.speak(u);
  }

  U.renderSession = (route) => {
    const s = S.session, d = S.decks.get(route.id);
    if (!s || !d || s.deckId !== d.id) { S.session = null; return U.go('d/' + route.id + '/study'); }
    U.root().innerHTML = `<section class="study" id="study" aria-label="${esc(d.name)}">
      <div class="study-bar">
        <button type="button" class="btn ghost small" data-act="exit">← <span>${t('study.exit')}</span></button>
        <div class="counters" aria-live="polite" aria-label="${esc(t('study.remaining'))}"><span class="cn" data-c="n" title="${esc(t('study.new'))}">0</span><span class="cl" data-c="l" title="${esc(t('study.learning'))}">0</span><span class="cr" data-c="r" title="${esc(t('study.review'))}">0</span></div>
        <div class="row tools"><button type="button" class="icon-btn" data-act="undo" aria-label="${esc(t('study.undo'))}" title="${esc(t('study.undo'))} (Z)">${ICONS.undo}</button>
          <button type="button" class="icon-btn" data-act="hint" aria-label="${esc(t('study.hint'))}" title="${esc(t('study.hint'))} (H)">${ICONS.bulb}</button>
          <button type="button" class="icon-btn" data-act="speak" aria-label="${esc(t('study.speak'))}" title="${esc(t('study.speak'))} (S)">${ICONS.speaker}</button>
          <button type="button" class="icon-btn" data-act="rev" aria-label="${esc(t('study.reverse'))}" title="${esc(t('study.reverse'))}" aria-pressed="${s.reverse}">${ICONS.swap}</button></div></div>
      <div class="progress"><i id="pbar"></i></div>
      <div class="stage" id="stage" tabindex="-1"><div class="flip" id="flip" role="group"><div class="face front" id="front"></div><div class="face back" id="back" aria-hidden="true"></div></div>
        <span class="sw sw-l" aria-hidden="true">${t('rate.again')}</span><span class="sw sw-r" aria-hidden="true">${t('rate.good')}</span></div>
      <div class="controls" id="controls"></div>
      <p class="tip muted">${t('study.tip')}</p></section>`;
    bindSwipe();
    if (s.done) summary(); else showCard();
  };

  function current() {
    const s = S.session, d = S.decks.get(s.deckId);
    if (s.force) { const c = TJ.byId(d, s.force); s.force = null; if (c) return c; }
    const id = TJ.pickNext(s, d, Date.now()); return id ? TJ.byId(d, id) : null;
  }
  function counters() {
    const s = S.session, d = S.decks.get(s.deckId), r = TJ.remaining(s, d), c = s.card;
    const cn = (k, v, on) => { const e = $(`[data-c="${k}"]`); if (e) { e.textContent = v; e.classList.toggle('cur', on); } };
    if (s.mode === 'all') { cn('n', 0, false); cn('l', 0, false); cn('r', r.n, true); }
    else cn('n', r.n, c && c.st === 0), cn('l', r.learn, c && (c.st === 1 || c.st === 3)), cn('r', r.rev, c && c.st === 2);
    const total = s.answered + r.all; const bar = $('#pbar'); if (bar) bar.style.width = total ? Math.round(s.answered / total * 100) + '%' : '0%';
  }
  function showCard() {
    const s = S.session, d = S.decks.get(s.deckId), card = current();
    s.card = card;
    if (!card) return finish();
    s.flipped = false; s.hint = false; s.shownAt = Date.now();
    const cloze = TJ.isCloze(card), rev = s.reverse && !cloze, st = STATE[card.st];
    const meta = `<div class="meta"><span class="dot st-${st}" title="${esc(t('st.' + st + 'T'))}"></span>${card.topic ? `<span class="chip">${esc(card.topic)}</span>` : ''}${cloze ? `<span class="chip">${t('cards.cloze')}</span>` : ''}</div>`;
    const frontHtml = cloze ? TJ.fmtRich(card.q, 'hide') : TJ.fmtRich(rev ? card.a : card.q);
    const backMain = cloze ? TJ.fmtRich(card.q, 'show') + (card.a ? `<div class="extra">${TJ.fmtRich(card.a)}</div>` : '') : `<div class="qdim">${TJ.fmtRich(rev ? card.a : card.q)}</div><hr class="sep"><div class="ans">${TJ.fmtRich(rev ? card.q : card.a)}</div>`;
    $('#front').innerHTML = `${meta}<div class="content">${frontHtml}</div><div class="hintbox" id="hintbox" hidden>${card.hint ? TJ.fmtRich(card.hint) : ''}</div>`;
    $('#back').innerHTML = `${meta}<div class="content">${backMain}</div>`;
    const fl = $('#flip'); fl.classList.remove('flipped'); $('#back').setAttribute('aria-hidden', 'true'); $('#front').removeAttribute('aria-hidden');
    fl.style.removeProperty('--dx'); fl.className = 'flip';
    $('#controls').innerHTML = `<button type="button" class="btn big show" data-act="flip">${t('study.show')} <kbd>Space</kbd></button>`;
    const hb = $('[data-act="hint"]'); if (hb) hb.disabled = !card.hint;
    const ub = $('[data-act="undo"]'); if (ub) ub.disabled = !s.undo.length;
    counters();
    if (S.prefs.autoSpeak) speak(TJ.plain(cloze ? card.q : (rev ? card.a : card.q), 'hide'));
    const st0 = $('#stage'); if (st0) st0.focus({ preventScroll: true });
  }
  function ratingHTML(card, d, s) {
    const keys = ['again', 'hard', 'good', 'easy'], pv = s.mode === 'daily' ? TJ.preview(card, TJ.settingsOf(d), Date.now()) : null;
    return keys.map((k, i) => `<button type="button" class="rate r${i + 1}" data-rate="${i + 1}"><span class="lbl">${t('rate.' + k)}</span><small>${pv ? U.fmtIvl(pv[i]) : t('rate.free' + (i + 1))}</small><kbd>${i + 1}</kbd></button>`).join('');
  }
  function flip() {
    const s = S.session; if (!s || !s.card || s.flipped) return;
    const d = S.decks.get(s.deckId); s.flipped = true;
    $('#flip').classList.add('flipped'); $('#back').removeAttribute('aria-hidden'); $('#front').setAttribute('aria-hidden', 'true');
    $('#controls').innerHTML = ratingHTML(s.card, d, s);
    if (S.prefs.autoSpeak) { const c = s.card, cl = TJ.isCloze(c), rev = s.reverse && !cl; speak(TJ.plain(cl ? c.q : (rev ? c.q : c.a), 'show')); }
  }
  function answer(r) {
    const s = S.session; if (!s || !s.card || !s.flipped) return;
    const d = S.decks.get(s.deckId), card = s.card, now = Date.now(), ms = now - s.shownAt;
    const entry = { cardId: card.id, ss: snapSession(s), snap: null };
    if (card.st === 0) s.newSeen++;
    if (s.mode === 'daily') { entry.snap = TJ.applyAnswer(d, card, r, now, ms); U.saveDeck(d); S.prefs.since = (S.prefs.since || 0) + 1; U.savePrefs(); }
    s.undo.push(entry); if (s.undo.length > 30) s.undo.shift();
    s.ms += Math.min(ms, 60000); TJ.afterAnswer(s, d, card, r);
    showCard();
  }
  function undo() {
    const s = S.session; if (!s || !s.undo.length) return;
    const d = S.decks.get(s.deckId), e = s.undo.pop();
    if (e.snap) { TJ.undoAnswer(d, e.snap); U.saveDeck(d); S.prefs.since = Math.max(0, (S.prefs.since || 0) - 1); }
    restoreSession(s, e.ss); s.force = e.cardId; s.done = false;
    if ($('#study') && !$('#flip')) U.render(); else showCard();
  }
  function finish() {
    const s = S.session; s.done = true; summary();
  }
  function summary() {
    const s = S.session, d = S.decks.get(s.deckId), now = Date.now(), c = TJ.counts(d, now), next = TJ.nextDue(d, now);
    const good = s.answered - s.again, rate = s.answered ? good / s.answered : null;
    const fl = $('.stage'), ctl = $('#controls'), tip = $('.tip'); if (fl) fl.hidden = true; if (ctl) ctl.hidden = true; if (tip) tip.hidden = true;
    const pb = $('#pbar'); if (pb) pb.style.width = '100%';
    const wrap = document.createElement('div'); wrap.className = 'panel summary'; wrap.id = 'summary';
    const waiting = d.cards.filter(x => (x.st === 1 || x.st === 3)).length;
    wrap.innerHTML = s.answered === 0
      ? `<h2>${t('sum.nothing')}</h2><p class="muted">${t('sum.nothingText')}</p>`
      : `<h2>${t('sum.title')}</h2>
        <div class="grid cols-4 tiles"><div class="stat"><b>${s.answered}</b><span>${t('sum.cards')}</span></div><div class="stat"><b>${U.pct(rate)}</b><span>${t('sum.correct')}</span></div><div class="stat"><b>${K.mmss(s.ms / 1000)}</b><span>${t('sum.time')}</span></div><div class="stat"><b>${s.newSeen}</b><span>${t('sum.newSeen')}</span></div></div>
        <div class="rate-dist" role="img" aria-label="${esc(t('sum.dist'))}">${s.ratings.map((n, i) => n ? `<i class="r${i + 1}" style="flex:${n}" title="${esc(t('rate.' + ['again', 'hard', 'good', 'easy'][i]))}: ${n}">${n}</i>` : '').join('')}</div>
        ${s.mode === 'daily' ? `<p class="muted">${waiting ? t('sum.learningLeft', { n: waiting }) + ' ' : ''}${next != null ? t('study.nextDue', { when: U.relDays(next) }) : ''}</p>` : `<p class="muted">${t('sum.freeNote')}</p>`}`;
    wrap.innerHTML += `<div class="row sum-actions"><button type="button" class="btn" data-act="exit">${t('sum.back')}</button>
      ${s.mode === 'daily' && c.nNew > c.newAvail ? `<button type="button" class="btn ghost" data-act="more-new">${t('study.moreNew', { n: Math.min(10, c.nNew - c.newAvail) })}</button>` : ''}
      ${s.mode === 'daily' && d.cards.length ? `<button type="button" class="btn ghost" data-act="free">${t('sum.free')}</button>` : ''}
      <a class="btn ghost" href="#/d/${d.id}/stats">${t('deck.tabStats')}</a></div>`;
    const old = $('#summary'); if (old) old.remove(); $('#study').append(wrap);
    wrap.querySelector('.btn').focus({ preventScroll: true });
  }

  /* ---------- gestos táctiles ---------- */
  function bindSwipe() {
    const fl = $('#flip'), stage = $('#stage'); if (!fl) return;
    let sx = 0, sy = 0, dx = 0, drag = false, moved = false;
    fl.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; dx = 0; drag = true; moved = false; });
    fl.addEventListener('pointermove', e => {
      if (!drag) return; dx = e.clientX - sx; const dy = e.clientY - sy;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { moved = true; if (S.session && S.session.flipped) { fl.style.setProperty('--dx', dx + 'px'); stage.classList.toggle('to-l', dx < -40); stage.classList.toggle('to-r', dx > 40); fl.classList.add('dragging'); } }
    });
    const end = () => {
      if (!drag) return; drag = false; fl.classList.remove('dragging'); stage.classList.remove('to-l', 'to-r'); fl.style.removeProperty('--dx');
      const s = S.session; if (!s || !s.card) return;
      if (!moved) { flip(); return; }
      if (s.flipped && Math.abs(dx) > 90) answer(dx < 0 ? 1 : 3);
    };
    fl.addEventListener('pointerup', end); fl.addEventListener('pointercancel', () => { drag = false; fl.classList.remove('dragging'); stage.classList.remove('to-l', 'to-r'); fl.style.removeProperty('--dx'); });
    fl.addEventListener('click', e => { if (e.pointerType !== 'touch' && e.detail !== 0) flip(); });
  }

  /* ---------- acciones de la sesión ---------- */
  A.flip = () => flip();
  A.undo = () => undo();
  A.hint = () => { const s = S.session; if (!s || !s.card || !s.card.hint || s.flipped) return; const h = $('#hintbox'); if (h) h.hidden = !h.hidden; };
  A.speak = () => { const s = S.session; if (!s || !s.card) return; const c = s.card, cl = TJ.isCloze(c), rev = s.reverse && !cl; speak(s.flipped ? TJ.plain(cl ? c.q : (rev ? c.q : c.a), 'show') : TJ.plain(cl ? c.q : (rev ? c.a : c.q), 'hide')); };
  A.rev = (el) => { const s = S.session; if (!s) return; s.reverse = !s.reverse; S.opts.reverse = s.reverse; U.savePrefs(); el.setAttribute('aria-pressed', String(s.reverse)); const was = s.card; s.force = was && was.id; showCard(); };
  A.exit = () => { const id = S.session && S.session.deckId; if (window.speechSynthesis) speechSynthesis.cancel(); S.session = null; U.go('d/' + id + '/study'); };
  A['more-new'] = () => { const s = S.session, o = { mode: 'daily', topic: s.topic, shuffle: s.shuffle, reverse: s.reverse, extraNew: (s.extraNew || 0) + 10 }; S.session = null; U.startSession(s.deckId, o); };
  A.free = () => { const s = S.session, o = { mode: 'all', topic: s.topic, shuffle: true, reverse: s.reverse }; S.session = null; U.startSession(s.deckId, o); };
  document.addEventListener('click', e => { const b = e.target.closest('[data-rate]'); if (b && S.session) answer(parseInt(b.dataset.rate, 10)); });
  document.addEventListener('keydown', e => {
    if (U.route().view !== 'session' || !S.session || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]') || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const s = S.session, k = e.key;
    if (s.done) { if (k === 'Escape') A.exit(); return; }
    if (k === ' ' || k === 'Enter') { const btn = e.target.closest && e.target.closest('button'); if (btn && (btn.dataset.rate || (btn.dataset.act && btn.dataset.act !== 'flip'))) return; e.preventDefault(); if (!s.flipped) flip(); else answer(3); }
    else if (/^[1-4]$/.test(k)) { if (s.flipped) answer(+k); }
    else if (k === 'z' || k === 'Z') undo();
    else if (k === 'h' || k === 'H') A.hint();
    else if (k === 's' || k === 'S') A.speak();
    else if (k === 'Escape') A.exit();
  });
})();
