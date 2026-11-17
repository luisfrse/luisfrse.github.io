'use strict';
/* Triatge START · interfície. Depèn de logic.js (TriageLogic), data.js (TriageData), i18n.js (TriageI18n) i art.js (TriageArt).
   Enllaç amb el campus: ../campus-link/link.js es carrega dinàmicament NOMÉS si la URL porta ?campus=<token>;
   si no es pot carregar, l'eina continua funcionant. La nota del mode avaluable s'envia una sola vegada. */
(function () {
  const W = window, doc = W.document;
  const L = W.TriageLogic, D = W.TriageData, A = W.TriageArt, I = W.TriageI18n;
  const MODES = ['guided', 'practice', 'challenge', 'cards'];
  const KEY_BEST = 'triatge-start-best', KEY_PREFS = 'triatge-start-prefs', KEY_LANG = 'campus-lang';

  /* ---------- emmagatzematge segur ---------- */
  function lsGet(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { W.localStorage.setItem(k, v); } catch (e) { /* sense emmagatzematge */ } }
  function jsonGet(k, def) { try { const v = JSON.parse(lsGet(k) || 'null'); return v && typeof v === 'object' ? v : def; } catch (e) { return def; } }

  /* ---------- estat ---------- */
  const qm = /[?&]campus=([^&#]+)/.exec((W.location && W.location.search) || '');
  const S = {
    lang: initLang(), screen: 'home', campus: !!qm, sent: false, evalDone: false,
    prefs: normPrefs(jsonGet(KEY_PREFS, {})),
    best: jsonGet(KEY_BEST, {}),
    setup: { setting: 'random', n: 14, difficulty: 'normal', kids: false, seed: '' },
    mode: null, sc: null, game: null, sel: null, tab: 'victim', busy: false, anim: null, flash: {},
    cam: { x: 0, y: 0, w: 1600, h: 1000 }, report: null, safetySel: {}, realLeft: null, timer: null,
    cards: null, replayT: 0, replayTimer: null, lastFeedback: null, dom: {}
  };
  const reduced = (function () { try { return W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  function initLang() {
    const s = lsGet(KEY_LANG); if (I.LANGS.indexOf(s) >= 0) return s;
    const n = String((W.navigator && (W.navigator.language || '')) || '').toLowerCase();
    return n.indexOf('ca') === 0 ? 'ca' : 'es';
  }
  if (S.campus) loadCampusLink();
  function loadCampusLink() {
    try {
      if (W.CampusLink) return;
      const sc = doc.createElement('script'); sc.src = '../campus-link/link.js'; sc.async = true;
      sc.onerror = function () { /* sense campus: l'eina segueix funcionant */ };
      (doc.head || doc.body).appendChild(sc);
    } catch (e) { /* ignora */ }
  }

  /* ---------- i18n ---------- */
  function t(key, p) {
    let v = I.get(S.lang, key);
    if (v === undefined || v === null) v = key;
    if (p) Object.keys(p).forEach(function (k) { v = String(v).split('{' + k + '}').join(p[k]); });
    return v;
  }
  const tx = (o) => (o ? (o[S.lang] || o.es || o.ca || '') : '');
  const catName = (c) => t('cat.' + c);
  const fmtT = (sec) => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; };
  const fmtNum = (x, d) => { const s = (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toString(); return S.lang === 'en' ? s : s.replace('.', ','); };

  /* ---------- DOM ---------- */
  function h(tag, attrs) {
    const e = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      const v = attrs[k]; if (v === undefined || v === null || v === false) return;
      if (k === 'text') e.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { e.addEventListener(ev, v[ev]); });
      else if (k === 'class') e.setAttribute('class', v);
      else e.setAttribute(k, v === true ? '' : String(v));
    });
    for (let i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, k) { if (k === null || k === undefined || k === false) return; if (Array.isArray(k)) { k.forEach((x) => add(e, x)); return; } e.appendChild(typeof k === 'string' || typeof k === 'number' ? doc.createTextNode(String(k)) : k); }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }
  const ic = (n, c) => A.icon(n, c);
  function btn(label, onClick, o) {
    o = o || {};
    return h('button', { type: 'button', class: 'btn ' + (o.cls || ''), id: o.id, 'aria-label': o.aria, title: o.title, disabled: o.disabled, 'aria-pressed': o.pressed === undefined ? null : String(!!o.pressed), 'data-act': o.act, on: { click: onClick } }, o.icon ? ic(o.icon) : null, label ? h('span', { class: 'btn-l' }, label) : null, o.after || null);
  }
  const $ = (id) => doc.getElementById(id);
  function wait(ms) { return new Promise(function (res) { W.setTimeout(res, reduced ? 0 : ms); }); }
  /* pausa real també amb moviment reduït (per llegir els rètols «Cridant…») */
  function pause(ms) { return new Promise(function (res) { W.setTimeout(res, ms); }); }
  function announce(msg) { const lv = $('live'); if (lv) { lv.textContent = ''; W.setTimeout(function () { lv.textContent = msg; }, 30); } }

  /* ---------- so (Web Audio sintetitzat a sound.js; desactivat per defecte) ---------- */
  /* Preferències: soundMode 'off' | 'alerts' | 'all' i volum 0–1. Les preferències antigues {sound: true/false} es migren. */
  function normPrefs(p) {
    p = Object.assign({ sound: false, theme: 'auto' }, p || {});
    if (['off', 'alerts', 'all'].indexOf(p.soundMode) < 0) p.soundMode = p.sound ? 'all' : 'off';
    const vol = Number(p.volume); p.volume = isFinite(vol) && p.volume !== null && p.volume !== '' ? Math.max(0, Math.min(1, vol)) : 0.6;
    p.sound = p.soundMode !== 'off';
    return p;
  }
  const NOSND = { available: false, configure() { return NOSND; }, play() { return false; }, ambience() { return false; }, setThreat() {}, stop() {}, suspend() {}, resume() {}, allowed() { return false; } };
  const SND = (function () { try { return W.TriageSound ? W.TriageSound.create(W) : NOSND; } catch (e) { return NOSND; } })();
  SND.configure({ mode: S.prefs.soundMode, volume: S.prefs.volume });
  const sfx = {
    tap: () => SND.play('click'), tag: () => SND.play('tag'), ok: () => SND.play('ok'), bad: () => SND.play('bad'),
    siren: () => SND.play('siren'), sirenOut: () => SND.play('sirenOut'), alert: () => SND.play('alert'), breath: () => SND.play('breath'),
    speaker: () => SND.play('speaker'), radio: () => SND.play('radio'), hotClear: () => SND.play('hotClear'), hazard: () => SND.play('hazard'),
    quake: () => SND.play('quake'), death: () => SND.play('death'), worsen: () => SND.play('worsen'), timeUp: () => SND.play('timeUp')
  };
  function ambienceFor(g) { const St = g && D.SETTINGS[g.sc.setting]; return St ? (St.ambience || 'road') : null; }
  function syncAmbience() {
    const g = S.game;
    if (S.screen === 'game' && g && !g.over) { SND.setThreat(!g.hotCleared); SND.ambience(ambienceFor(g)); } else SND.ambience(null);
  }
  try { doc.addEventListener('visibilitychange', function () { if (doc.hidden) SND.suspend(); else SND.resume(); }); } catch (e) { /* res */ }
  function setSound(mode, volume) {
    if (mode !== undefined) S.prefs.soundMode = mode;
    if (volume !== undefined) S.prefs.volume = Math.max(0, Math.min(1, volume));
    S.prefs.sound = S.prefs.soundMode !== 'off';
    savePrefs(); SND.configure({ mode: S.prefs.soundMode, volume: S.prefs.volume }); syncAmbience(); renderTop();
  }
  function openSound() {
    const p = S.prefs, on = p.soundMode !== 'off';
    const body = [];
    if (!SND.available) body.push(h('p', { class: 'fb warn' }, t('ui.soundUnavailable')));
    const sw = h('input', { type: 'checkbox', id: 'snd-on', role: 'switch', checked: on, 'aria-checked': String(on), on: { change: function (e) { setSound(e.target.checked ? (S.prefs.lastMode || 'all') : 'off'); if (e.target.checked) sfx.ok(); openSound(); } } });
    body.push(h('label', { class: 'switch big', for: 'snd-on' }, sw, h('span', null, h('b', null, t('ui.soundEnable')), h('small', null, t('ui.soundState.' + p.soundMode)))));
    const modes = h('div', { class: 'snd-modes', role: 'radiogroup', 'aria-labelledby': 'snd-mode-l' });
    ['all', 'alerts'].forEach(function (m) {
      const sel = p.soundMode === m || (!on && (p.lastMode || 'all') === m);
      modes.appendChild(h('button', { type: 'button', role: 'radio', 'aria-checked': String(sel), class: 'snd-mode' + (sel ? ' on' : ''), id: 'snd-' + m, disabled: !on,
        on: { click: function () { S.prefs.lastMode = m; setSound(m); sfx.alert(); openSound(); } } },
      h('b', null, t('ui.sound.' + m)), h('small', null, t('ui.sound.' + m + 'D'))));
    });
    body.push(h('p', { class: 'lbl', id: 'snd-mode-l' }, t('ui.soundWhat')), modes);
    const out = h('output', { id: 'snd-vol-o', for: 'snd-vol' }, Math.round(p.volume * 100) + ' %');
    body.push(h('label', { class: 'lbl', for: 'snd-vol' }, t('ui.soundVol'), ' ', out),
      h('input', { type: 'range', id: 'snd-vol', min: '0', max: '100', step: '5', value: String(Math.round(p.volume * 100)), disabled: !on,
        on: { input: function (e) { const v = Number(e.target.value) / 100; S.prefs.volume = v; SND.configure({ volume: v }); out.textContent = Math.round(v * 100) + ' %'; }, change: function (e) { setSound(undefined, Number(e.target.value) / 100); sfx.siren(); } } }),
      h('div', { class: 'row' }, btn(t('ui.soundTest'), function () { if (S.prefs.soundMode === 'all') sfx.speaker(); else sfx.siren(); }, { cls: 'ghost', icon: 'soundOn', id: 'snd-test', disabled: !on })),
      h('p', { class: 'note' }, ic('info'), h('span', null, t('ui.soundNote'))));
    modal(t('ui.soundTitle'), body, [[t('ui.close'), null, 'primary', 'b-sound-close']], true);
  }

  /* ---------- tema ---------- */
  function applyTheme() { const r = doc.documentElement; if (S.prefs.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.prefs.theme); }
  function savePrefs() { lsSet(KEY_PREFS, JSON.stringify(S.prefs)); }
  function saveBest(mode, score) {
    if (!(mode in S.best) || score > S.best[mode]) { S.best[mode] = score; lsSet(KEY_BEST, JSON.stringify(S.best)); return true; }
    return false;
  }

  /* ---------- capçalera ---------- */
  function renderTop() {
    const top = $('topbar'); if (!top) return; clear(top);
    const canBack = S.campus || (W.history && W.history.length > 1);
    top.appendChild(h('div', { class: 'tb-left' },
      canBack ? btn('', function () { try { W.history.back(); } catch (e) { /* res */ } }, { icon: 'back', cls: 'ghost icon', aria: t('ui.back'), title: t('ui.back'), id: 'b-back' }) : null,
      h('button', { type: 'button', class: 'brand', 'aria-label': t('ui.home'), on: { click: function () { if (S.screen === 'game' && S.game && !S.game.over) confirmLeave(); else go('home'); } } },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, h('i', { class: 'bm r' }), h('i', { class: 'bm y' }), h('i', { class: 'bm g' }), h('i', { class: 'bm k' })),
        h('span', { class: 'brand-t' }, h('b', null, t('app.name')), h('small', null, t('app.tag'))))));
    const themeIcon = S.prefs.theme === 'dark' ? 'moon' : S.prefs.theme === 'light' ? 'sun' : 'auto';
    top.appendChild(h('div', { class: 'tb-right' },
      btn(I.LANG_LABEL[I.LANGS[(I.LANGS.indexOf(S.lang) + 1) % I.LANGS.length]], function () { S.lang = I.LANGS[(I.LANGS.indexOf(S.lang) + 1) % I.LANGS.length]; lsSet(KEY_LANG, S.lang); doc.documentElement.setAttribute('lang', S.lang); renderAll(); }, { cls: 'ghost', id: 'b-lang', aria: t('ui.langAria') }),
      btn('', function () { S.prefs.theme = S.prefs.theme === 'auto' ? 'light' : S.prefs.theme === 'light' ? 'dark' : 'auto'; savePrefs(); applyTheme(); renderTop(); }, { icon: themeIcon, cls: 'ghost icon', aria: t('ui.theme.' + S.prefs.theme), title: t('ui.theme.' + S.prefs.theme) }),
      btn('', openSound, { icon: S.prefs.soundMode === 'off' ? 'soundOff' : S.prefs.soundMode === 'alerts' ? 'soundAlerts' : 'soundOn', cls: 'ghost icon', aria: t('ui.soundBtn', { state: t('ui.soundState.' + S.prefs.soundMode) }), title: t('ui.soundBtn', { state: t('ui.soundState.' + S.prefs.soundMode) }), id: 'b-sound' }),
      btn('', openAbout, { icon: 'info', cls: 'ghost icon', aria: t('ui.about'), title: t('ui.about'), id: 'b-about' })));
  }

  /* ---------- navegació ---------- */
  function go(screen) {
    stopTimers(); closeCloseup();
    S.screen = screen;
    if (screen !== 'game') S.dom = {};
    renderAll();
    syncAmbience();
    const m = $('main'); if (m && m.focus) { try { m.focus({ preventScroll: true }); } catch (e) { m.focus(); } }
    try { W.scrollTo(0, 0); } catch (e) { /* res */ }
  }
  function stopTimers() { if (S.timer) { W.clearInterval(S.timer); S.timer = null; } if (S.replayTimer) { W.clearInterval(S.replayTimer); S.replayTimer = null; } if (S.cards && S.cards.timer) { W.clearInterval(S.cards.timer); S.cards.timer = null; } }
  function renderAll() {
    doc.documentElement.setAttribute('lang', S.lang);
    doc.title = t('app.title');
    renderTop();
    const m = $('main'); if (!m) return;
    m.setAttribute('class', 'scr scr-' + S.screen);
    if (S.screen === 'game') { S.dom = {}; clear(m); buildGame(m); return; }
    clear(m);
    const fn = { home: viewHome, setup: viewSetup, brief: viewBrief, warn: viewWarn, results: viewResults, cards: viewCards }[S.screen] || viewHome;
    m.appendChild(fn());
  }

  /* ---------- inici ---------- */
  function viewHome() {
    const wrap = h('div', { class: 'home' });
    wrap.appendChild(h('section', { class: 'hero-wrap' },
      h('div', { class: 'hero-txt' },
        h('p', { class: 'eyebrow' }, t('home.eyebrow')),
        h('h1', { id: 'h1', tabindex: '-1' }, t('app.title')),
        h('p', { class: 'lead' }, t('home.lead')),
        h('ul', { class: 'chips' }, ['red', 'yellow', 'green', 'black'].map((c) => h('li', { class: 'chip tape-' + c }, catName(c))))),
      h('div', { class: 'hero-art' }, A.hero())));
    if (S.campus) {
      wrap.appendChild(h('section', { class: 'card eval-card' },
        h('div', { class: 'eval-ic' }, ic('grad')),
        h('div', null, h('h2', null, t('home.evalTitle')), h('p', null, t(S.evalDone ? 'home.evalDone' : 'home.evalText'))),
        S.evalDone ? null : btn(t('home.evalStart'), startEval, { cls: 'primary lg', icon: 'next', id: 'b-eval' })));
    }
    const modes = h('section', { class: 'modes', 'aria-label': t('home.modes') });
    const info = {
      guided: { icon: 'grad', meta: t('home.guidedMeta') }, practice: { icon: 'dice', meta: t('home.practiceMeta') },
      challenge: { icon: 'timer', meta: t('home.challengeMeta') }, cards: { icon: 'cards', meta: t('home.cardsMeta') }
    };
    MODES.forEach(function (m) {
      const best = S.best[m];
      modes.appendChild(h('button', { type: 'button', class: 'mode mode-' + m, id: 'mode-' + m, on: { click: function () { pickMode(m); } } },
        h('span', { class: 'mode-ic' }, ic(info[m].icon)),
        h('span', { class: 'mode-t' }, t('mode.' + m)),
        h('span', { class: 'mode-d' }, t('mode.' + m + 'Desc')),
        h('span', { class: 'mode-m' }, info[m].meta, best !== undefined ? h('b', { class: 'best' }, ic('trophy'), ' ' + fmtNum(best, 1)) : null),
        S.campus ? h('span', { class: 'mode-pr' }, t('home.practiceOnly')) : null));
    });
    wrap.appendChild(h('h2', { class: 'sec-t' }, t('home.modes')));
    wrap.appendChild(modes);
    wrap.appendChild(h('section', { class: 'card how' },
      h('div', { class: 'how-txt' }, h('h2', null, t('home.howTitle')), h('p', null, t('home.how1')), h('p', null, t('home.how2')), h('p', { class: 'muted small' }, t('home.how3'))),
      h('div', { class: 'how-dia' }, startDiagram({ ped: false }))));
    wrap.appendChild(footNote());
    return wrap;
  }
  function footNote() {
    return h('footer', { class: 'foot' }, h('p', { class: 'note' }, ic('warn'), h('span', null, t('app.note'))), h('p', { class: 'src' }, t('app.sources')),
      h('p', { class: 'src' }, t('app.credit'), ' · ', h('button', { type: 'button', class: 'linkbtn', on: { click: openAbout } }, t('ui.about'))));
  }
  function pickMode(m) {
    S.mode = m;
    if (m === 'guided') { prepare(L.generate(D, D.GUIDED)); return; }
    if (m === 'cards') { S.cards = null; go('cards'); return; }
    if (m === 'challenge') { S.setup.difficulty = 'hard'; S.setup.n = D.CHALLENGE.n; }
    go('setup');
  }
  function startEval() {
    S.mode = 'eval';
    const pk = L.pickBank(D, Math.random);
    S.evalIndex = pk.index;
    prepare(pk.scenario);
  }

  /* ---------- configuració ---------- */
  function viewSetup() {
    const su = S.setup, ch = S.mode === 'challenge';
    const wrap = h('div', { class: 'setup narrow' });
    wrap.appendChild(h('h1', { id: 'h1', tabindex: '-1' }, t('mode.' + S.mode)));
    wrap.appendChild(h('p', { class: 'lead' }, t(ch ? 'setup.challengeLead' : 'setup.practiceLead')));
    const keys = ['random'].concat(Object.keys(D.SETTINGS).filter((k) => !(ch && D.SETTINGS[k].big)));
    if (ch && su.setting !== 'random' && D.SETTINGS[su.setting] && D.SETTINGS[su.setting].big) su.setting = 'random';
    const NR = L.nRange(D.SETTINGS[su.setting]);
    if (su.n < NR.min || su.n > NR.max) su.n = NR.def;
    const grid = h('div', { class: 'scen-grid', role: 'radiogroup', 'aria-label': t('setup.scenario') });
    keys.forEach(function (k) {
      const on = su.setting === k;
      grid.appendChild(h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: 'scen' + (on ? ' on' : ''), on: { click: function () { su.setting = k; go('setup'); } } },
        h('span', { class: 'scen-ic' }, ic(k === 'random' ? 'dice' : (A.ICONS.indexOf(D.SETTINGS[k].icon) >= 0 ? D.SETTINGS[k].icon : 'map'))), h('span', null, k === 'random' ? t('setup.random') : tx(D.SETTINGS[k].short), k !== 'random' && D.SETTINGS[k].contentWarning ? h('small', { class: 'scen-cw' }, t('cw.badge')) : null, k !== 'random' && D.SETTINGS[k].big ? h('small', { class: 'scen-big' }, t('setup.bigBadge')) : null)));
    });
    wrap.appendChild(h('fieldset', { class: 'card fs' }, h('legend', null, t('setup.scenario')), grid));
    if (!ch) {
      const nIn = h('input', { type: 'range', min: String(NR.min), max: String(NR.max), step: String(NR.step), value: String(su.n), id: 'in-n', on: { input: function (e) { su.n = Number(e.target.value); const o = $('out-n'); if (o) o.textContent = String(su.n); } } });
      wrap.appendChild(h('div', { class: 'card fs' },
        h('label', { for: 'in-n', class: 'lbl' }, t('setup.victims'), ' ', h('output', { id: 'out-n' }, String(su.n))), nIn,
        NR.max > 20 ? h('p', { class: 'muted small' }, t('setup.bigHelp', { min: NR.min, max: NR.max, step: NR.step })) : null,
        h('div', { class: 'lbl', id: 'lbl-diff' }, t('setup.difficulty')),
        h('div', { class: 'seg', role: 'radiogroup', 'aria-labelledby': 'lbl-diff' }, L.LEVELS.map((d) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(su.difficulty === d), class: 'seg-b' + (su.difficulty === d ? ' on' : ''), on: { click: function () { su.difficulty = d; go('setup'); } } }, t('diff.' + d)))),
        h('p', { class: 'muted small' }, t('diff.' + su.difficulty + 'Desc')),
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', id: 'in-kids', checked: su.kids, on: { change: function (e) { su.kids = !!e.target.checked; } } }), h('span', null, t('setup.kids'))),
        h('p', { class: 'muted small' }, t('setup.kidsHelp'))));
    } else {
      wrap.appendChild(h('div', { class: 'card fs' }, h('p', null, t('setup.challengeRules', { n: D.CHALLENGE.n, min: Math.round(D.CHALLENGE.realSeconds / 60) }))));
    }
    const seedIn = h('input', { type: 'text', id: 'in-seed', value: su.seed, maxlength: '24', autocomplete: 'off', spellcheck: 'false', placeholder: t('setup.seedPh'), on: { input: function (e) { su.seed = e.target.value; } } });
    wrap.appendChild(h('div', { class: 'card fs' },
      h('label', { for: 'in-seed', class: 'lbl' }, t('setup.seed')),
      h('div', { class: 'row' }, seedIn, btn(t('setup.newSeed'), function () { su.seed = L.seedCode(L.seeded(Date.now() ^ Math.floor(Math.random() * 1e9))); seedIn.value = su.seed; }, { icon: 'dice', cls: 'ghost' })),
      h('p', { class: 'muted small' }, t('setup.seedHelp'))));
    wrap.appendChild(h('div', { class: 'row end' }, btn(t('ui.back'), function () { go('home'); }, { cls: 'ghost', icon: 'back' }), btn(t('setup.go'), function () {
      const o = ch ? { setting: su.setting, seed: su.seed, n: D.CHALLENGE.n, difficulty: D.CHALLENGE.difficulty, kids: false } : { setting: su.setting, seed: su.seed, n: su.n, difficulty: su.difficulty, kids: su.kids };
      prepare(L.generate(D, o));
    }, { cls: 'primary lg', icon: 'next', id: 'b-go' })));
    return wrap;
  }

  /* ---------- briefing i seguretat ---------- */
  function prepare(sc) {
    S.sc = sc; S.game = null; S.safetySel = {}; S.report = null;
    /* escenaris amb contingut sensible (tiroteig): advertència prèvia que cal acceptar, amb opció de triar-ne un altre */
    if (D.SETTINGS[sc.setting].contentWarning && !S.cwOk) { go('warn'); return; }
    go('brief');
  }
  function viewWarn() {
    const St = D.SETTINGS[S.sc.setting];
    const wrap = h('div', { class: 'setup narrow cw' });
    wrap.appendChild(h('section', { class: 'card cw-card', role: 'alertdialog', 'aria-labelledby': 'h1', 'aria-describedby': 'cw-txt' },
      h('div', { class: 'cw-ic' }, ic('warn')),
      h('h1', { id: 'h1', tabindex: '-1' }, t('cw.title')),
      h('p', { class: 'lead', id: 'cw-txt' }, t('cw.text', { name: tx(St.name) })),
      h('ul', { class: 'list' }, ['cw.l1', 'cw.l2', 'cw.l3'].map((k) => h('li', null, t(k)))),
      h('p', { class: 'muted small' }, t('cw.help')),
      h('div', { class: 'row end' },
        btn(t('cw.other'), function () { S.sc = null; go(S.mode === 'practice' || S.mode === 'challenge' ? 'setup' : 'home'); }, { cls: 'ghost', icon: 'back', id: 'b-cw-back' }),
        btn(t('cw.accept'), function () { S.cwOk = true; go('brief'); }, { cls: 'primary lg', icon: 'next', id: 'b-cw-ok' }))));
    return wrap;
  }
  function viewBrief() {
    const sc = S.sc, St = D.SETTINGS[sc.setting], guided = S.mode === 'guided';
    const wrap = h('div', { class: 'brief' });
    const prev = A.s('svg', { viewBox: '0 0 ' + mapW(sc) + ' ' + mapH(sc), class: 'map preview', role: 'img', 'aria-label': tx(St.name) + '. ' + t('hv.prefix') + ': ' + tx(St.hazard) }, [A.drawMap(D, sc.setting)].concat(hvZoneDefs(sc).filter((z) => z.type === 'hot').map((z) => A.hazardZone(hvSpec(sc, z, 'on')).el)));
    const first = sc.ambulances[0];
    wrap.appendChild(h('div', { class: 'brief-head' },
      h('div', null,
        h('p', { class: 'eyebrow' }, t('mode.' + S.mode), ' · ', t('diff.' + sc.difficulty), ' · ', t('brief.seed'), ' ', h('code', null, sc.seed)),
        h('h1', { id: 'h1', tabindex: '-1' }, tx(St.name)),
        h('p', { class: 'lead' }, tx(St.brief)),
        h('ul', { class: 'facts' },
          h('li', null, ic('users'), t('brief.victims', { n: sc.n })),
          h('li', null, ic('warn'), tx(St.hazard)),
          h('li', null, ic('ambulance'), t('brief.firstAmb', { t: fmtT(first.at), n: sc.ambulances.filter((a) => a.kind !== 'BUS').length })),
          h('li', null, ic('clock'), t('brief.tmax', { t: Math.round(sc.tMax / 60) })),
          sc.difficulty === 'vhard' ? h('li', { class: 'fact-warn' }, ic('secondary'), t('brief.vhard')) : null)),
      h('figure', { class: 'brief-map' }, prev, h('figcaption', { class: 'legend' },
        h('span', { class: 'lg lg-hot' }, t('zone.hot')), h('span', { class: 'lg lg-warm' }, t('zone.warm')), h('span', { class: 'lg lg-cold' }, t('zone.cold')), h('span', { class: 'lg lg-haz' }, t('hv.legend'))))));
    /* checklist de seguretat */
    const items = ['protect', 'alert', 'hazards', 'rushIn', 'moveAll'];
    const list = h('div', { class: 'safety', role: 'group', 'aria-label': t('brief.safetyTitle') });
    items.forEach(function (k) {
      const on = !!S.safetySel[k];
      list.appendChild(h('button', { type: 'button', class: 'sitem' + (on ? ' on' : ''), 'aria-pressed': String(on), id: 'saf-' + k, on: { click: function () { S.safetySel[k] = !S.safetySel[k]; sfx.tap(); const b = $('saf-' + k); if (b) { b.classList.toggle('on', S.safetySel[k]); b.setAttribute('aria-pressed', String(S.safetySel[k])); } } } },
        h('span', { class: 'sbox', 'aria-hidden': 'true' }, ic('check')),
        h('span', { class: 'st' }, h('b', null, t('safety.' + k)), h('small', null, t('safety.' + k + 'D'))),
        h('span', { class: 'scost' }, L.COST[k] ? '+' + L.COST[k] + ' s' : '0 s')));
    });
    wrap.appendChild(h('section', { class: 'card' },
      h('h2', null, ic('shield'), ' ', t('brief.safetyTitle')),
      h('p', { class: 'muted' }, t(guided ? 'brief.safetyGuided' : 'brief.safetyHelp')), list,
      h('div', { class: 'row end' },
        btn(t('ui.back'), function () { go(S.mode === 'guided' || S.mode === 'eval' ? 'home' : 'setup'); }, { cls: 'ghost', icon: 'back' }),
        btn(t('brief.enter'), startGame, { cls: 'primary lg', icon: 'next', id: 'b-enter' }))));
    if (S.mode === 'eval') wrap.appendChild(h('p', { class: 'note' }, ic('grad'), h('span', null, t('brief.evalNote'))));
    return wrap;
  }
  function startGame() {
    const g = L.createGame(S.sc, { mode: S.mode });
    S.game = g; S.sel = null; S.tab = 'victim'; S.flash = {}; S.destSel = {}; S.lastFeedback = null; S.cam = initCam(g.sc);
    const items = Object.keys(S.safetySel).filter((k) => S.safetySel[k]);
    const r = L.act(g, { type: 'safety', items: items }, D);
    go('game');
    handleEvents(r.events);
    if (items.indexOf('rushIn') >= 0) toast(t('safety.rushInFb'), 'bad');
    if (S.mode === 'challenge') {
      S.realLeft = D.CHALLENGE.realSeconds;
      S.timer = W.setInterval(realTick, 1000);
    }
    if (S.mode === 'guided') toast(t('coach.welcome'), 'info', 6000);
  }
  function realTick() {
    if (S.screen !== 'game' || !S.game || S.game.over) return;
    S.realLeft -= 1;
    if (!S.busy) { const ev = L.advance(S.game, 1); if (ev.length) { S.dirty = true; handleEvents(ev); } }
    if (S.realLeft <= 0) { toast(t('game.realTimeUp'), 'bad'); finishGame(); return; }
    if (S.game.over) { finishGame(); return; }
    const ck = $('hud-time'), rl = $('hud-real');
    if (ck && rl && !S.dirty) { ck.textContent = fmtT(S.game.t); rl.lastChild.textContent = fmtT(S.realLeft); rl.setAttribute('class', 'real' + (S.realLeft < 60 ? ' low' : '')); }
    else { S.dirty = false; refreshGame(); }
  }

  /* ---------- joc ---------- */
  function buildGame(m) {
    const g = S.game, sc = g.sc;
    const root = h('div', { class: 'game' });
    const hud = h('div', { class: 'hud', id: 'hud' });
    const svg = A.s('svg', { class: 'map live', id: 'map', viewBox: '0 0 ' + mapW(sc) + ' ' + mapH(sc), role: 'application', 'aria-label': t('game.mapAria'), tabindex: '0', preserveAspectRatio: 'xMidYMid meet' }, []);
    svg.appendChild(A.drawMap(D, sc.setting));
    const hv = hvBuild(sc); svg.appendChild(hv.layer);
    const layerAmb = A.s('g', { class: 'layer-amb' }), layerV = A.s('g', { class: 'layer-v' }), layerR = A.s('g', { class: 'layer-r' });
    const layerCalls = A.s('g', { class: 'layer-calls', 'aria-hidden': 'true' });
    /* perills que apareixen a mitja partida: polígons amagats fins que s'activen */
    const layerHaz = A.s('g', { class: 'layer-haz', 'aria-hidden': 'true' }, (sc.hazards || []).map((hz, i) => A.s('polygon', { points: hz.poly.map((p) => p.join(',')).join(' '), class: 'hz-poly', 'data-i': String(i) })));
    svg.appendChild(layerHaz);
    const pathLine = A.s('polyline', { class: 'route', points: '' });
    /* la teva ambulància amb l'altaveu (unitat de primera resposta), aparcada a la vora de la zona freda */
    const sp = speakerPos(sc);
    const spk = A.speakerUnit({ x: sp.x, y: sp.y, label: t('game.speakerUnit') });
    svg.appendChild(pathLine); svg.appendChild(layerAmb); svg.appendChild(spk); svg.appendChild(layerCalls); svg.appendChild(layerV); svg.appendChild(layerR);
    const markers = {};
    g.victims.forEach(function (v) {
      const mk = A.victimMarker(v);
      mk.setAttribute('tabindex', '0'); mk.setAttribute('role', 'button');
      mk.addEventListener('click', function (e) { if (S.panMoved) return; onMarker(v.id); });
      mk.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMarker(v.id); } });
      place(mk, v.x, v.y, false);
      layerV.appendChild(mk); markers[v.id] = mk;
    });
    const ccpBtn = A.s('g', { class: 'ccp-hit', tabindex: '0', role: 'button' }, [A.s('rect', { x: 1240 + coldOff(sc).dx, y: 420 + coldOff(sc).dy, width: 320, height: 150, rx: 10, class: 'ccp-rect' }), A.s('text', { x: 1400 + coldOff(sc).dx, y: 562 + coldOff(sc).dy, class: 'm-label m-center m-small ccp-t' }, [''])]);
    ccpBtn.addEventListener('click', function () { if (!S.panMoved) onCCP(); });
    ccpBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCCP(); } });
    layerV.insertBefore ? layerV.insertBefore(ccpBtn, layerV.firstChild) : layerV.appendChild(ccpBtn);
    const rs = A.rescuer(); place(rs, g.rescuer.x, g.rescuer.y, false); layerR.appendChild(rs);
    const ambs = {};
    g.ambs.forEach(function (a) { const am = A.ambulance(a.kind); am.setAttribute('data-id', a.id); place(am, 1660 + coldOff(sc).dx, 880 + coldOff(sc).dy, false); layerAmb.appendChild(am); ambs[a.id] = am; });
    const ctl = h('div', { class: 'mapctl' },
      btn('', function () { zoom(0.8); }, { icon: 'plus', cls: 'icon', aria: t('game.zoomIn'), title: t('game.zoomIn') }),
      btn('', function () { zoom(1.25); }, { icon: 'minus', cls: 'icon', aria: t('game.zoomOut'), title: t('game.zoomOut') }),
      btn('', function () { const sc2 = S.game.sc; S.cam = { x: 0, y: 0, w: mapW(sc2), h: mapH(sc2) }; applyCam(); }, { icon: 'map', cls: 'icon', aria: t('game.fit'), title: t('game.fit') }),
      btn('', function () { centerOn(S.game.rescuer.x, S.game.rescuer.y, 700); }, { icon: 'target', cls: 'icon', aria: t('game.center'), title: t('game.center') }));
    const legend = h('div', { class: 'maplegend', 'aria-hidden': 'true' }, h('span', { class: 'lg lg-hot' }, t('zone.hot')), h('span', { class: 'lg lg-warm' }, t('zone.warm')), h('span', { class: 'lg lg-cold' }, t('zone.cold')), h('span', { class: 'lg lg-haz' }, t('hv.legend')));
    const mapwrap = h('div', { class: 'mapwrap', id: 'mapwrap' }, svg, ctl, hv.bar, legend, h('div', { class: 'maptoast', id: 'maptoast', 'aria-hidden': 'true' }));
    const side = h('aside', { class: 'side', id: 'side', 'aria-label': t('game.panel') });
    root.appendChild(hud);
    root.appendChild(h('div', { class: 'stage' }, mapwrap, side));
    m.appendChild(root);
    S.dom = { hud: hud, svg: svg, markers: markers, rescuer: rs, ambs: ambs, side: side, route: pathLine, ccp: ccpBtn, spk: spk, calls: layerCalls, haz: layerHaz };
    bindMap(svg);
    applyCam();
    hvSync();
    refreshGame();
  }
  function coldOff(sc) { return (sc && sc.cold) || { dx: 0, dy: 0 }; }
  function speakerPos(sc) { const o = coldOff(sc); return { x: 1300 + o.dx, y: 700 + o.dy }; }
  function place(node, x, y, animate, dur, delay) {
    if (!node || !node.style) return;
    if (node.style.setProperty) { node.style.setProperty('transition-duration', animate ? (dur || 0.8) + 's' : '0s'); node.style.setProperty('transition-delay', animate && delay ? delay + 's' : '0s'); }
    node.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }
  /* càmera: zoom i desplaçament */
  function applyCam() { const c = S.cam, svg = S.dom.svg; if (svg) svg.setAttribute('viewBox', [c.x, c.y, c.w, c.h].map(Math.round).join(' ')); }
  function clampCam() { const sc = S.game && S.game.sc, W0 = mapW(sc), H0 = mapH(sc); const c = S.cam; c.w = Math.max(320, Math.min(W0, c.w)); c.h = c.w * 0.625; c.x = Math.max(-100, Math.min(W0 + 100 - c.w, c.x)); c.y = Math.max(-60, Math.min(H0 + 60 - c.h, c.y)); }
  /* mida del mapa (gran catàstrofe: 2400 × 1500) i càmera inicial (als mapes grans, apropada a la zona freda i l'entrada) */
  function mapW(sc) { return sc && sc.map ? sc.map.w : 1600; }
  function mapH(sc) { return sc && sc.map ? sc.map.h : 1000; }
  function initCam(sc) { if (!sc || !sc.map) return { x: 0, y: 0, w: 1600, h: 1000 }; const w = 1500, h = w * 0.625; return { x: Math.max(0, sc.start.x - w * 0.78), y: Math.max(0, sc.start.y - h / 2), w: w, h: h }; }
  function zoom(f, cx, cy) { const c = S.cam; cx = cx === undefined ? c.x + c.w / 2 : cx; cy = cy === undefined ? c.y + c.h / 2 : cy; const nw = c.w * f; c.x = cx - (cx - c.x) * (nw / c.w); c.y = cy - (cy - c.y) * (nw / c.w); c.w = nw; clampCam(); applyCam(); }
  function centerOn(x, y, w) { const c = S.cam; c.w = w || c.w; c.h = c.w * 0.625; c.x = x - c.w / 2; c.y = y - c.h / 2; clampCam(); applyCam(); }
  function bindMap(svg) {
    const pts = {}; let start = null, pinch = null;
    const rectOf = () => (svg.getBoundingClientRect ? svg.getBoundingClientRect() : { width: 1600, height: 1000, left: 0, top: 0 });
    const toMap = (cx, cy) => { const r = rectOf(); const sc = Math.max(S.cam.w / (r.width || 1), S.cam.h / (r.height || 1)); return { x: S.cam.x + (cx - r.left) * sc - ((r.width * sc - S.cam.w) / 2), y: S.cam.y + (cy - r.top) * sc - ((r.height * sc - S.cam.h) / 2), sc: sc }; };
    svg.addEventListener('pointerdown', function (e) { pts[e.pointerId] = { x: e.clientX, y: e.clientY }; S.panMoved = false; const ids = Object.keys(pts); if (ids.length === 1) start = { x: e.clientX, y: e.clientY, cam: Object.assign({}, S.cam) }; else if (ids.length === 2) { const a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), w: S.cam.w }; } });
    svg.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      const ids = Object.keys(pts);
      if (ids.length === 2 && pinch) { const a = pts[ids[0]], b = pts[ids[1]]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d > 10) { const c = S.cam, cx = c.x + c.w / 2, cy = c.y + c.h / 2; c.w = pinch.w * pinch.d / d; clampCam(); c.x = cx - c.w / 2; c.y = cy - c.h / 2; clampCam(); applyCam(); S.panMoved = true; } return; }
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!S.panMoved && Math.hypot(dx, dy) < 7) return;
      S.panMoved = true; const r = rectOf(); const sc = Math.max(start.cam.w / (r.width || 1), start.cam.h / (r.height || 1));
      S.cam.x = start.cam.x - dx * sc; S.cam.y = start.cam.y - dy * sc; clampCam(); applyCam();
    });
    const up = function (e) { delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; if (!Object.keys(pts).length) { start = null; W.setTimeout(function () { S.panMoved = false; }, 0); } };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up); svg.addEventListener('pointerleave', up);
    svg.addEventListener('wheel', function (e) { e.preventDefault(); const p = toMap(e.clientX, e.clientY); zoom(e.deltaY > 0 ? 1.15 : 0.87, p.x, p.y); }, { passive: false });
    svg.addEventListener('keydown', function (e) {
      if (e.target !== svg) return;
      const st = S.cam.w * 0.12;
      const k = e.key;
      if (k === '+' || k === '=') zoom(0.8); else if (k === '-') zoom(1.25);
      else if (k === 'ArrowLeft') { S.cam.x -= st; clampCam(); applyCam(); } else if (k === 'ArrowRight') { S.cam.x += st; clampCam(); applyCam(); }
      else if (k === 'ArrowUp') { S.cam.y -= st; clampCam(); applyCam(); } else if (k === 'ArrowDown') { S.cam.y += st; clampCam(); applyCam(); }
      else return;
      e.preventDefault();
    });
  }

  /* refresc de l'estat visual */
  function refreshGame() { refreshHud(); refreshMap(); refreshSide(); }
  function counts(g) {
    const c = { none: 0, red: 0, yellow: 0, green: 0, black: 0, evac: 0, dead: 0 };
    g.victims.forEach(function (v) { if (v.st.evac) c.evac++; const l = L.lastTag(v); if (l) c[l]++; else if (L.isSeen(v)) c.none++; if (v.st.dead && S.mode !== 'eval') c.dead++; });
    return c;
  }
  function refreshHud() {
    const hud = S.dom.hud; if (!hud) return; const g = S.game; clear(hud);
    const c = counts(g), waiting = g.ambs.filter((a) => a.status === 'waiting').length;
    const next = g.ambs.filter((a) => a.status === 'scheduled').sort((a, b) => a.at - b.at)[0];
    hud.appendChild(h('div', { class: 'hud-clock', role: 'timer', 'aria-label': t('game.clockAria', { t: fmtT(g.t) }) }, ic('clock'), h('b', { id: 'hud-time' }, fmtT(g.t)), S.mode === 'challenge' && S.realLeft !== null ? h('span', { class: 'real' + (S.realLeft < 60 ? ' low' : ''), id: 'hud-real' }, ic('timer'), h('span', null, fmtT(S.realLeft))) : null));
    hud.appendChild(h('ul', { class: 'hud-counts', 'aria-label': t('game.countsAria') },
      h('li', { class: 'cnt cnt-none', title: t('game.untriaged') }, h('i', null, '?'), h('b', null, String(c.none))),
      ['red', 'yellow', 'green', 'black'].map((k) => h('li', { class: 'cnt cnt-' + k, title: catName(k) }, h('i', { class: 'tape-' + k }), h('b', null, String(c[k])))),
      h('li', { class: 'cnt cnt-evac', title: t('game.evacuated') }, ic('ambulance'), h('b', null, String(c.evac))),
      S.mode !== 'eval' && c.dead ? h('li', { class: 'cnt cnt-dead', title: t('game.deaths') }, ic('cross'), h('b', null, String(c.dead))) : null));
    const hz = activeHazards(g);
    if (hz.length) hud.appendChild(h('div', { class: 'hud-haz', role: 'status' }, ic('warn'), h('span', null, hz.map((x) => x.label).join(' · '))));
    hud.appendChild(h('div', { class: 'hud-amb' + (waiting ? ' on' : '') }, ic('ambulance'), h('span', null, waiting ? t('game.ambWaiting', { n: waiting }) : next ? t('game.ambNext', { t: fmtT(next.at) }) : t('game.ambNone'))));
    const used = g.walkCallT !== null, calling = !!S.calling;
    hud.appendChild(h('div', { class: 'hud-act' },
      h('button', { type: 'button', id: 'b-walk', class: 'btn speakbtn' + (used ? ' used' : ' accent') + (calling ? ' calling' : ''), disabled: used || S.busy, title: t('game.megaphoneHelp'), 'aria-describedby': 'b-walk-sub', on: { click: doWalkCall } },
        ic('speaker'), h('span', { class: 'btn-l' }, h('b', null, calling ? t('game.calling') : used ? t('game.speakerUsed') : t('game.megaphone')), h('small', { id: 'b-walk-sub' }, used && !calling ? t('game.speakerUsedSub') : t('game.speakerSub')))),
      btn(t('game.wait'), function () { run({ type: 'wait', sec: 30 }); }, { icon: 'wait', cls: 'sm ghost', disabled: S.busy, id: 'b-wait', title: t('game.waitHelp') }),
      btn(t('game.end'), confirmEnd, { icon: 'flag', cls: 'sm ghost', id: 'b-end' })));
  }
  function refreshMap() {
    const g = S.game, d = S.dom; if (!d.svg) return;
    const coach = S.mode === 'guided', showDeath = S.mode !== 'eval';
    g.victims.forEach(function (v) {
      const mk = d.markers[v.id]; if (!mk) return;
      const tg = L.lastTag(v);
      const cls = ['vm'];
      cls.push(tg ? 'tag-' + tg : 'untagged');
      if (v.phys.walk && !v.st.dead) cls.push('standing');
      if (v.bleed === 'major' && !v.st.bleedCtrl) cls.push('has-bleed'); else if (v.bleed === 'major') cls.push('bleed-ctrl');
      if (L.isLocked(g, v)) cls.push('locked');
      if (!L.isSeen(v)) cls.push('unseen');
      if (S.sel === v.id) cls.push('sel');
      if (g.rescuer.at === v.id) cls.push('here');
      if (v.st.evac) cls.push('gone');
      if (v.st.loadedIn) cls.push('loaded');
      if (showDeath && v.st.dead) cls.push('dead');
      if (coach && tg && tg !== L.truthOf(v) && !v.st.evac) cls.push('alert');
      if (S.flash[v.id]) cls.push('flash');
      if (S.walkingIds && S.walkingIds[v.id]) cls.push('walking');
      mk.setAttribute('class', cls.join(' '));
      mk.setAttribute('aria-label', markerLabel(v));
      if (L.isSeen(v)) { mk.setAttribute('tabindex', '0'); mk.removeAttribute('aria-hidden'); } else { mk.setAttribute('tabindex', '-1'); mk.setAttribute('aria-hidden', 'true'); }
      const key = Math.round(v.x) + ',' + Math.round(v.y);
      if (mk.getAttribute('data-pos') !== key) { const moving = mk.getAttribute('data-pos') !== null; place(mk, v.x, v.y, moving, v.st.atStation ? 1.6 : 2.4); mk.setAttribute('data-pos', key); }
    });
    const ccpN = g.victims.filter((v) => v.st.atCCP && !v.st.atStation && !v.st.tags.length && !v.st.evac).length;
    const ct = d.ccp && d.ccp.lastChild; if (ct) ct.textContent = ccpN ? t('game.ccpPending', { n: ccpN }) : t('zone.ccp');
    if (d.ccp) d.ccp.setAttribute('aria-label', t('zone.ccp') + (ccpN ? ' · ' + t('game.ccpPending', { n: ccpN }) : ''));
    /* ambulàncies */
    const bayIdx = {};
    g.ambs.forEach(function (a) {
      const am = d.ambs[a.id]; if (!am) return;
      const o = coldOff(g.sc);
      let x = 1680 + o.dx, y = 880 + o.dy;
      if (a.status === 'waiting') { const k = (bayIdx.n = (bayIdx.n || 0) + 1) - 1; x = 1290 + (k % 4) * 82 + o.dx; y = 840 + Math.floor(k / 4) * 50 + o.dy; }
      else if (a.status === 'gone') { x = 1720 + o.dx; y = 880 + o.dy; }
      const key = x + ',' + y;
      if (am.getAttribute('data-pos') !== key) { place(am, x, y, true, 1.4); am.setAttribute('data-pos', key); }
      am.setAttribute('class', 'amb amb-' + a.kind + ' st-' + a.status);
    });
    const r = g.rescuer; place(d.rescuer, r.x, r.y, true, S.anim ? S.anim.dur : 0.6);
    if (d.route) d.route.setAttribute('points', g.route.slice(-6).map((p) => Math.round(p.x) + ',' + Math.round(p.y)).join(' '));
  }
  /* perills actius per al HUD (zona calenta amb amenaça o perill nou) */
  function activeHazards(g) {
    const out = [], St = D.SETTINGS[g.sc.setting];
    if (g.haz) g.sc.hazards.forEach(function (hz, i) { if (g.haz[i].on && !g.haz[i].over) out.push({ label: t('game.hazardActive') }); });
    if (St.threatLabel && !g.hotCleared) out.push({ label: tx(St.threatLabel) });
    return out;
  }
  function refreshHazards() {
    const g = S.game, lay = S.dom.haz; if (!g || !lay || !g.haz) return;
    (lay.childNodes ? Array.prototype.slice.call(lay.childNodes) : []).forEach(function (p) { const s = g.haz[Number(p.getAttribute('data-i'))]; p.setAttribute('class', 'hz-poly' + (s && s.on && !s.over ? ' on' : '')); });
  }
  function refreshHazardsAll() { refreshHazards(); hvSync(); }
  function lockMsg(g, v) {
    const St = D.SETTINGS[g.sc.setting];
    if (L.hazLocked(g, v)) return t('game.hazardLocked');
    return t('game.lockedHelp', { hz: lockName(g, v) });
  }
  function lockName(g, v) { const St = D.SETTINGS[g.sc.setting]; const zone = St.hots && v && v.hz !== undefined ? St.hots[v.hz] : null; return zone ? tx(zone.name) : tx(St.hazard); }
  function markerLabel(v) {
    const g = S.game, tg = L.lastTag(v);
    const parts = [t('victimN', { n: v.num }), who(v)];
    parts.push(tg ? t('game.tagged', { cat: catName(tg) }) : t('game.untriaged'));
    if (v.st.evac) parts.push(t('game.evacuated'));
    if (L.isLocked(g, v)) parts.push(L.hazLocked(g, v) ? t('game.hazardZone') : t('zone.hot'));
    if (g.rescuer.at !== v.id) parts.push(t('game.distance', { m: Math.round(L.dist(g.rescuer, v) * 0.1), s: L.travelSec(L.dist(g.rescuer, v)) }));
    return parts.join(' · ');
  }
  function who(v) { return t((v.ped ? 'who.child' : 'who.adult') + v.sex, { age: v.age }); }

  /* ---------- interaccions del mapa ---------- */
  function onMarker(id) {
    if (S.busy) return;
    const g = S.game, v = L.vById(g, id); if (!v) return;
    if (S.sel === id && !L.rescuerAt(g, v)) { if (L.isLocked(g, v)) { toast(lockMsg(g, v), 'warn'); return; } goTo(id); return; }
    S.sel = id; S.tab = 'victim'; sfx.tap();
    refreshMap(); refreshSide();
  }
  function onCCP() { if (S.busy) return; S.sel = 'ccp'; S.tab = 'victim'; refreshMap(); refreshSide(); }
  async function goTo(target) {
    const g = S.game; if (S.busy || g.over) return;
    const r = L.act(g, { type: 'move', target: target }, D);
    if (!r.ok) {
      if (r.reason === 'hot') { const v = L.vById(g, target); toast(t('game.hotBlocked', { hz: lockName(g, v) }), 'bad'); sfx.bad(); refreshSide(); }
      else if (r.reason === 'hazard') { toast(t('game.hazardLocked'), 'bad'); sfx.bad(); handleEvents(r.events); if (!checkOver()) refreshGame(); }
      return;
    }
    S.sel = target; S.tab = 'victim';
    const dur = reduced ? 0 : Math.max(0.35, Math.min(1.6, r.cost / 40));
    S.anim = { dur: dur }; S.busy = true;
    refreshMap(); refreshHud();
    await wait(dur * 1000);
    S.busy = false; S.anim = null;
    handleEvents(r.events);
    if (!checkOver()) refreshGame();
  }
  /* Altaveu de l'ambulància: ones sonores animades, rètol «Cridant…» i els que caminen es desplacen cap a la zona verda */
  async function doWalkCall() {
    const g = S.game; if (S.busy || g.walkCallT !== null) return;
    const from = {}; g.victims.forEach(function (v) { from[v.id] = { x: v.x, y: v.y }; });
    S.busy = true; S.calling = true;
    const r = L.act(g, { type: 'walkCall' }, D);
    const moved = r.result.moved || [];
    sfx.speaker();
    announce(t('game.callingAria'));
    mapToast(t('game.walkCallSay'));
    const spk = S.dom.spk; if (spk) { spk.classList.add('calling'); const lb = spk.lastChild; if (lb) lb.textContent = t('game.calling'); }
    /* rastres de cada persona que camina: de la posició inicial a la zona verda */
    const calls = S.dom.calls;
    if (calls) {
      clear(calls);
      moved.forEach(function (id, i) {
        const v = L.vById(g, id), a = from[id]; if (!v || !a) return;
        calls.appendChild(A.s('g', { class: 'walk-trail', style: 'animation-delay:' + (reduced ? 0 : i * 0.12) + 's' }, [
          A.s('line', { x1: Math.round(a.x), y1: Math.round(a.y), x2: Math.round(v.x), y2: Math.round(v.y), class: 'wt-line' }),
          A.s('circle', { cx: Math.round(a.x), cy: Math.round(a.y), r: 9, class: 'wt-from' }),
          A.s('circle', { cx: Math.round(v.x), cy: Math.round(v.y), r: 7, class: 'wt-to' })]));
      });
    }
    refreshHud();
    /* primer s'escolta la crida (ones), després es mouen de manera esglaonada */
    await pause(reduced ? 600 : 900);
    const mk = S.dom.markers || {};
    S.walkingIds = {}; moved.forEach(function (id) { S.walkingIds[id] = true; });
    moved.forEach(function (id, i) { const v = L.vById(g, id), m = mk[id]; if (v && m) { place(m, v.x, v.y, !reduced, 2.6, reduced ? 0 : Math.min(1.2, i * 0.12)); m.setAttribute('data-pos', Math.round(v.x) + ',' + Math.round(v.y)); } });
    refreshMap();
    await pause(reduced ? 1400 : 2600 + Math.min(1200, moved.length * 120));
    S.busy = false; S.calling = false; S.walkingIds = null;
    if (spk) { spk.classList.remove('calling'); const lb = spk.lastChild; if (lb) lb.textContent = ''; }
    W.setTimeout(function () { if (calls && S.screen === 'game') clear(calls); }, reduced ? 4000 : 2500);
    toast(t('game.walkCallDone', { n: moved.length }), 'info');
    handleEvents(r.events);
    if (!checkOver()) refreshGame();
  }
  function mapToast(msg) { const m = $('maptoast'); if (!m) return; m.textContent = msg; m.classList.remove('show'); W.setTimeout(function () { m.classList.add('show'); }, 10); W.setTimeout(function () { m.classList.remove('show'); }, 2600); }

  /* executa una acció genèrica amb animació opcional */
  async function run(a, anim) {
    const g = S.game; if (S.busy || !g || g.over) return null;
    const r = L.act(g, a, D);
    if (!r.ok) { toast(t('err.' + r.reason), 'bad'); return r; }
    S.busy = true; refreshHud();
    if (anim) { try { await anim(r); } catch (e) { /* animació opcional */ } }
    S.busy = false;
    handleEvents(r.events);
    if (!checkOver()) refreshGame();
    return r;
  }
  function checkOver() { if (S.game && S.game.over) { finishGame(); return true; } return false; }
  function handleEvents(evs) {
    const g = S.game; if (!evs || !evs.length || !g) return;
    const live = S.mode !== 'eval';
    evs.forEach(function (e) {
      const v = e.id ? L.vById(g, e.id) : null;
      const St = D.SETTINGS[g.sc.setting];
      if (e.type === 'hotClear') { const z = e.zone !== undefined && St.hots ? St.hots[e.zone] : null, doneTxt = z ? tx(z.clear) : tx(St.hotClear); sfx.hotClear(); SND.setThreat(!g.hotCleared); if (!hvResolve('z' + (e.zone !== undefined ? e.zone : 0), doneTxt)) toast(doneTxt, 'info', 5000); refreshHazardsAll(); }
      else if (e.type === 'hazard') { toast(tx(St.hazard2.text) + (e.retreat ? ' ' + t('ev.retreat') : ''), 'bad', 8000); if (St.hazard2.kind === 'quake' || St.hazard2.kind === 'collapse') sfx.quake(); sfx.hazard(); hvAppear(e.idx); refreshHazardsAll(); }
      else if (e.type === 'hazardClear') { sfx.radio(); if (!hvResolve('h' + e.idx, tx(St.hazard2.clear))) toast(tx(St.hazard2.clear), 'info', 5000); refreshHazardsAll(); }
      else if (e.type === 'found') { toast(e.how === 'report' ? t('ev.foundReport', { n: v.num }) : t('ev.found', { n: v.num }), 'warn', 5000); sfx.alert(); flash(v.id); }
      else if (e.type === 'ambArrive') { toast(t('ev.amb', { kind: t('amb.' + e.kind), id: e.amb }), 'amb', 5000); sfx.siren(); }
      else if (e.type === 'worsen' && S.mode === 'guided') { toast(t('ev.worsen', { n: v.num }), 'warn', 6000); sfx.worsen(); flash(v.id); }
      else if (e.type === 'airwayLost' && live) { toast(t('ev.airwayLost', { n: v.num }), 'bad', 6000); sfx.worsen(); flash(v.id); }
      else if (e.type === 'die' && live && e.preventable) { toast(t('ev.die', { n: v.num }), 'bad', 6000); sfx.death(); }
      else if (e.type === 'timeUp') { toast(t('ev.timeUp'), 'warn'); sfx.timeUp(); }
    });
  }
  function flash(id) { S.flash[id] = true; W.setTimeout(function () { delete S.flash[id]; if (S.screen === 'game') refreshMap(); }, 2400); }

  /* ---------- peligros visibles y respuesta de los equipos de emergencia (solo presentación) ----------
     No interviene en reglas, tiempos, puntuación ni semillas: dibuja el peligro de cada zona caliente mientras el motor la
     mantiene cerrada y, cuando el motor emite hotClear / hazardClear, anima unos segundos reales la llegada y la actuación
     de los equipos. El juego no se bloquea (no usa S.busy) ni se toca el reloj: es turnos (el reloj avanza con las acciones),
     así que no hay pausa ni velocidad que respetar; la animación es solo visual y se completa aunque el jugador siga actuando.
     Con prefers-reduced-motion no hay desplazamientos: peligro → equipo actuando (estático, con texto) → despejada. */
  function hvSnd(name) { try { if (SND.FX && SND.FX.indexOf(name) >= 0) SND.play(name); } catch (e) { /* hook de sonido opcional */ } }
  function hvZoneDefs(sc) {
    const St = D.SETTINGS[sc.setting], V = D.HAZVIS.settings[sc.setting] || { zones: [] }, out = [];
    const hots = St.hots || [{ poly: St.hot }];
    hots.forEach(function (z, i) {
      const def = V.zones[Math.min(i, V.zones.length - 1)]; if (!def) return;
      out.push({ key: 'z' + i, type: 'hot', idx: i, poly: z.poly, def: Object.assign({ shake: !!V.shake }, def), multi: !!St.hots, zone: z, sector: St.sectors && St.sectors[i] ? St.sectors[i] : null, clear: z.clear || St.hotClear, threat: !!(def.resp && def.resp.threat) });
    });
    (sc.hazards || []).forEach(function (hz, i) {
      const k = D.HAZVIS.kinds[hz.kind]; if (!k) return;
      out.push({ key: 'h' + i, type: 'haz', idx: i, poly: hz.poly, def: k, clear: St.hazard2.clear, text: St.hazard2.text, threat: !!(k.resp && k.resp.threat), kindLabel: k.label });
    });
    return out;
  }
  const hvName = (z) => z.type === 'haz' ? t('hv.new') + ': ' + tx(z.kindLabel) : (z.multi && z.zone ? tx(z.zone.name) + ' · ' : '') + tx(D.SETTINGS[S.game ? S.game.sc.setting : S.sc.setting].hazard);
  const hvMapLabel = (z) => z.type === 'haz' ? t('hv.new') + ': ' + tx(z.kindLabel) : z.threat ? t('hv.threat') : t('hv.prefix') + (z.sector ? ' · ' + tx(z.sector.name) : '');
  function hvSay(z, which) {
    const r = z.def.resp, o = r && r.say ? r.say[which] : null, nm = z.zone && z.zone.name ? tx(z.zone.name).toLowerCase() : '';
    return o ? tx(o).split('{zone}').join(nm) : '';
  }
  function hvStateOf(g, z) {
    if (z.type === 'hot') return (g.hotZ ? g.hotZ[z.idx] : g.hotCleared) ? 'done' : 'on';
    const s = g.haz && g.haz[z.idx]; return !s || !s.on ? 'off' : s.over ? 'done' : 'on';
  }
  function hvSpec(sc, z, state) { const o = coldOff(sc); return { key: z.key, poly: z.poly, def: z.def, label: hvMapLabel(z), state: state, entry: { x: D.COLD.entry.x + 60 + o.dx, y: D.COLD.entry.y + o.dy } }; }
  function hvBuild(sc) {
    const g = S.game, layer = A.s('g', { class: 'layer-danger', 'aria-hidden': 'true' }, []);
    const hv = { zones: {}, order: [], layer: layer, open: false, detail: {}, bar: h('div', { class: 'hzbar', id: 'hzbar', role: 'group', 'aria-label': t('hv.title'), hidden: true }) };
    hvZoneDefs(sc).forEach(function (z) {
      const node = A.hazardZone(hvSpec(sc, z, g ? hvStateOf(g, z) : 'on'));
      layer.appendChild(node.el);
      hv.zones[z.key] = { z: z, node: node, state: g ? hvStateOf(g, z) : 'on', seq: [], anim: false, token: 0, secured: false };
      hv.order.push(z.key);
    });
    S.hv = hv;
    return hv;
  }
  function hvSet(rec, st, sub) {
    rec.state = st; rec.seq.push(st);
    rec.node.el.setAttribute('data-state', st);
    if (sub !== undefined) rec.node.el.setAttribute('data-sub', sub);
    hvBar();
  }
  /* sincroniza el dibujo con el estado del motor (sin animar) */
  function hvSync() {
    const hv = S.hv, g = S.game; if (!hv || !g) return;
    hv.order.forEach(function (k) { const rec = hv.zones[k]; if (rec.anim) return; const s = hvStateOf(g, rec.z); if (rec.state !== s) { if (s === 'on') { rec.secured = false; rec.node.label.textContent = hvMapLabel(rec.z); } hvSet(rec, s, ''); } });
    hvBar();
  }
  function hvStateText(rec) {
    const z = rec.z;
    if (rec.state === 'arrive') return t('hv.state.arrive');
    if (rec.state === 'act') return t('hv.state.act') + (z.def.resp ? ': ' + hvSay(z, 'act') : '');
    if (rec.state === 'done') return t('hv.state.done');
    return t('hv.state.on');
  }
  function hvBar() {
    const hv = S.hv; if (!hv || !hv.bar) return;
    const fid = doc.activeElement && /^hz-/.test(doc.activeElement.id || '') ? doc.activeElement.id : null;
    const recs = hv.order.map((k) => hv.zones[k]).filter((r) => r.state !== 'off');
    clear(hv.bar);
    if (!recs.length) { hv.bar.setAttribute('hidden', ''); return; }
    hv.bar.removeAttribute('hidden');
    const active = recs.filter((r) => r.state !== 'done').length;
    const sum = active === 0 ? t('hv.sum.none') : active === 1 ? t('hv.sum.one') : t('hv.sum.many', { n: active });
    hv.bar.appendChild(h('button', { type: 'button', class: 'hzsum' + (active ? '' : ' ok'), id: 'hz-sum', 'aria-expanded': String(!!hv.open), 'aria-controls': 'hzlist', title: t('hv.toggleAria'), 'aria-label': t('hv.toggleAria') + '. ' + sum,
      on: { click: function () { hv.open = !hv.open; hvBar(); const b = $('hz-sum'); if (b && b.focus) b.focus(); } } }, ic(active ? 'warn' : 'check'), h('span', null, sum)));
    if (hv.open) {
      const ul = h('ul', { class: 'hzlist', id: 'hzlist', 'aria-label': t('hv.listAria') });
      recs.forEach(function (r) {
        const z = r.z, name = hvName(z), on = !!hv.detail[z.key];
        const desc = z.type === 'haz' ? tx(z.text) : tx(z.def.desc);
        const who = z.def.resp ? hvSay(z, 'act') : '';
        ul.appendChild(h('li', { class: 'hzi st-' + r.state },
          h('button', { type: 'button', class: 'hzname', id: 'hz-d-' + z.key, 'aria-expanded': String(on), title: t('hv.moreAria', { name: name }), 'aria-label': name + '. ' + hvStateText(r) + '. ' + t('hv.moreAria', { name: name }),
            on: { click: function () { hv.detail[z.key] = !hv.detail[z.key]; if (S.game && S.game.sc.map && hv.detail[z.key]) { const bb = r.node.bbox; centerOn(bb.cx, bb.cy, Math.max(1100, bb.w + 500)); } hvBar(); const b = $('hz-d-' + z.key); if (b && b.focus) b.focus(); } } },
          ic(r.state === 'done' ? 'check' : 'warn'), h('span', { class: 'hzt' }, name), h('span', { class: 'hzs' }, hvStateText(r))),
          h('p', { class: 'hzd', hidden: !on }, desc, who ? h('span', null, ' ', h('b', null, t('hv.who') + ': '), who) : null)));
      });
      hv.bar.appendChild(ul);
      hv.bar.appendChild(h('p', { class: 'hzhelp small' }, t('hv.help')));
    }
    if (fid) { const el = $(fid); if (el && el.focus) el.focus(); }
  }
  /* aparece un peligro nuevo (muy difícil / réplica): se dibuja y se avisa en el mapa */
  function hvAppear(idx) {
    const hv = S.hv, rec = hv && hv.zones['h' + idx]; if (!rec) return;
    rec.secured = false; rec.node.label.textContent = hvMapLabel(rec.z);
    hvSet(rec, 'on', '');
    mapToast(t('hv.new') + ': ' + tx(rec.z.kindLabel));
    hvSnd('hvNew');
  }
  /* despeje: anima la llegada y la actuación del equipo; devuelve true si ha tomado a su cargo el mensaje final */
  function hvResolve(key, doneText) {
    const hv = S.hv, g = S.game, rec = hv && hv.zones[key];
    if (!rec || !g || S.screen !== 'game' || !rec.node.resp || rec.state === 'done' || rec.anim) return false;
    rec.anim = true; rec.token += 1;
    hvRun(rec, hv, g, rec.token, doneText).catch(function () { /* animación opcional */ }).then(function () { if (S.hv === hv) { rec.anim = false; if (rec.state !== 'done') hvSet(rec, 'done', ''); } });
    return true;
  }
  async function hvRun(rec, hv, g, tok, doneText) {
    const ok = () => S.hv === hv && S.game === g && S.screen === 'game' && rec.token === tok;
    const z = rec.z, resp = rec.node.resp, say = hvSay(z, 'arrive');
    announce(say); mapToast(hvSay(z, 'act')); hvSnd('hvArrive');
    const flip = (n, deg, dur) => { if (n.style && n.style.setProperty) n.style.setProperty('transition-duration', dur + 's'); n.style.transform = 'rotate(' + deg + 'deg)'; };
    const secure = () => { if (!z.def.resp.threat) return; rec.secured = true; const tx2 = z.type === 'hot' ? t('hv.threatDone') : t('hv.threatClear'); rec.node.label.textContent = tx2; rec.node.el.setAttribute('data-sub', 'secured'); announce(tx2); hvBar(); };
    if (reduced) {
      /* estados estáticos: peligro → equipo actuando (texto) → despejada */
      resp.units.forEach(function (u) { place(u.outer, u.to.x, u.to.y, false); flip(u.inner, u.to.a, 0); });
      resp.crew.forEach(function (c) { place(c.outer, c.to.x, c.to.y, false); });
      hvSet(rec, 'act', '');
      await pause(3600); if (!ok()) return; secure();
      await pause(2400); if (!ok()) return;
    } else {
      hvSet(rec, 'arrive', '');
      resp.units.forEach(function (u) { place(u.outer, u.from.x, u.from.y, false); flip(u.inner, 180, 0); });
      await pause(80); if (!ok()) return;
      await Promise.all(resp.units.map(async function (u, i) {
        if (i) await pause(i * 450);
        let cur = u.from;
        for (let k = 0; k < u.legs.length; k++) {
          const leg = u.legs[k], d = Math.hypot(leg.x - cur.x, leg.y - cur.y), dur = d < 1 ? 0.5 : Math.max(0.5, Math.min(2.2, d / 520));
          if (!ok()) return;
          flip(u.inner, leg.a, 0.35); place(u.outer, leg.x, leg.y, true, dur); cur = leg;
          await pause(dur * 1000);
        }
      }));
      if (!ok()) return;
      hvSet(rec, 'act', '');
      resp.crew.forEach(function (c) { place(c.outer, c.from.x, c.from.y, false); });
      await pause(80); if (!ok()) return;
      resp.crew.forEach(function (c) { place(c.outer, c.to.x, c.to.y, true, 1.8, c.delay); });
      await pause(3200); if (!ok()) return; secure();
      await pause(2000); if (!ok()) return;
    }
    hvSet(rec, 'done', '');
    toast(doneText, 'info', 6000); announce(t('hv.cleared', { txt: doneText })); hvSnd('hvDone');
  }

  /* ---------- panell lateral ---------- */
  function refreshSide() {
    const side = S.dom.side; if (!side) return; clear(side);
    const g = S.game;
    const waiting = g.ambs.filter((a) => a.status === 'waiting').length;
    const tabs = [['victim', 'tab.victim', 'users'], ['algo', 'tab.algo', 'list'], ['evac', 'tab.evac', 'ambulance'], ['log', 'tab.log', 'clock']];
    const tl = h('div', { class: 'tabs', role: 'tablist', 'aria-label': t('game.panel') });
    tabs.forEach(function (tb) {
      const on = S.tab === tb[0];
      tl.appendChild(h('button', { type: 'button', role: 'tab', id: 'tab-' + tb[0], 'aria-selected': String(on), 'aria-controls': 'pane', tabindex: on ? '0' : '-1', class: 'tab' + (on ? ' on' : ''),
        on: { click: function () { S.tab = tb[0]; refreshSide(); const b = $('tab-' + tb[0]); if (b && b.focus) b.focus(); }, keydown: function (e) { const i = tabs.findIndex((x) => x[0] === S.tab); if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); S.tab = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length][0]; refreshSide(); const b = $('tab-' + S.tab); if (b && b.focus) b.focus(); } } } },
        ic(tb[2]), h('span', null, t(tb[1])), tb[0] === 'evac' && waiting ? h('i', { class: 'badge' }, String(waiting)) : null));
    });
    side.appendChild(tl);
    if (L.phase2(g)) side.appendChild(h('div', { class: 'phase2', id: 'phase2', role: 'note' }, h('b', null, t('p2.title')), h('p', null, t('p2.body'))));
    const pane = h('div', { class: 'pane', id: 'pane', role: 'tabpanel', 'aria-labelledby': 'tab-' + S.tab });
    if (S.tab === 'victim') paneVictim(pane);
    else if (S.tab === 'algo') paneAlgo(pane);
    else if (S.tab === 'evac') paneEvac(pane);
    else paneLog(pane);
    side.appendChild(pane);
  }
  function coachBox(text, kind) { return h('div', { class: 'coach ' + (kind || '') }, h('span', { class: 'coach-av', 'aria-hidden': 'true' }, 'M'), h('div', null, h('b', null, t('coach.name')), h('p', null, text))); }
  function generalCoach() {
    const g = S.game;
    if (g.walkCallT === null) return t('coach.start');
    if (g.ambs.some((a) => a.status === 'waiting') && g.victims.some((v) => L.readyForEvac(g, v))) return t('coach.amb');
    const field = g.victims.filter((v) => !v.st.tags.length && !v.st.atCCP && !v.st.evac);
    if (field.some((v) => v.bleed === 'major' && !v.st.bleedCtrl)) return t('coach.bleedFirst');
    if (field.length) return t('coach.pick');
    if (g.victims.some((v) => v.st.atCCP && !v.st.tags.length)) return t('coach.ccp');
    if (g.victims.some((v) => !v.st.evac && L.lastTag(v) && L.lastTag(v) !== L.truthOf(v))) return t('coach.retriage');
    return t('coach.evacAll');
  }
  function paneVictim(p) {
    const g = S.game;
    if (S.sel === 'ccp') { paneCCP(p); return; }
    const v = S.sel ? L.vById(g, S.sel) : null;
    if (!v) {
      if (S.mode === 'guided') p.appendChild(coachBox(generalCoach()));
      p.appendChild(h('div', { class: 'empty' }, ic('map', 'big'), h('h2', null, t('game.pickTitle')), h('p', null, t('game.pickHelp'))));
      p.appendChild(victimList());
      return;
    }
    const here = L.rescuerAt(g, v);
    const tg = L.lastTag(v);
    p.appendChild(h('div', { class: 'vhead' },
      h('div', { class: 'vnum' + (tg ? ' tape-' + tg : '') }, String(v.num)),
      h('div', { class: 'vwho' }, h('h2', null, t('victimN', { n: v.num })), h('p', null, who(v), v.ped ? h('span', { class: 'pill ped' }, t('game.pedPill')) : null)),
      tg ? h('span', { class: 'pill tape-' + tg }, catName(tg)) : h('span', { class: 'pill' }, t('game.untriaged'))));
    if (v.st.evac) { p.appendChild(h('p', { class: 'fb info' }, t('game.evacTo', { h: hospName(v.st.evac.dest), t: fmtT(v.st.evac.t) }))); p.appendChild(btn(t('ui.close'), function () { S.sel = null; refreshSide(); refreshMap(); }, { cls: 'ghost' })); return; }
    if (!here) {
      const locked = L.isLocked(g, v);
      p.appendChild(h('p', { class: 'desc' }, ic('secondary'), h('span', null, tx(v.desc))));
      if (locked) p.appendChild(h('p', { class: 'fb bad' }, ic('lock'), h('span', null, t('game.lockedHelp', { hz: tx(D.SETTINGS[g.sc.setting].hazard) }))));
      const d = L.dist(g.rescuer, L.pointOf(g, v.id, D));
      p.appendChild(h('div', { class: 'go-row' },
        h('div', { class: 'go-meta' }, ic('run'), h('span', null, t('game.distance', { m: Math.round(d * 0.1), s: L.travelSec(d) }))),
        btn(t('game.goTo'), function () { goTo(v.id); }, { cls: 'primary', icon: locked ? 'lock' : 'run', id: 'b-goto', disabled: S.busy || locked })));
      if (S.mode === 'guided') p.appendChild(coachBox(v.bleed === 'major' && !v.st.bleedCtrl ? t('coach.bleedSeen') : t('coach.goThere')));
      p.appendChild(h('div', { class: 'sep' }));
      p.appendChild(victimList());
      return;
    }
    /* a peu de víctima */
    p.appendChild(h('p', { class: 'desc' }, tx(v.desc)));
    const figWrap = h('div', { class: 'figwrap', id: 'figwrap' }, A.figure(figState(v)), h('div', { class: 'overlay', id: 'overlay', 'aria-live': 'polite' }));
    p.appendChild(figWrap);
    p.appendChild(h('div', { class: 'row closeup-row' }, btn(t('cl.open'), function () { openCloseup(v); }, { cls: 'closeup-btn', icon: 'secondary', id: 'b-closeup', disabled: S.busy }), h('small', { class: 'muted' }, t('cl.openHelp'))));
    if (v.relative && !v.st.relCalm && !v.st.dead) p.appendChild(h('div', { class: 'fb warn relbox', role: 'note' }, h('b', null, t('game.relTitle')), h('p', null, t('game.relHelp', { s: L.REL_EXTRA }))));
    p.appendChild(findings(v));
    const nx = S.mode === 'guided' ? L.nextStep(g, v) : null;
    if (S.mode === 'guided') {
      if (S.lastFeedback && S.lastFeedback.id === v.id) p.appendChild(feedbackBox(S.lastFeedback));
      p.appendChild(coachBox(nx ? coachText(v, nx) : t('coach.doneVictim')));
    } else if (S.mode === 'practice' && S.lastFeedback && S.lastFeedback.id === v.id) p.appendChild(feedbackBox(S.lastFeedback));
    p.appendChild(toolbelt(v, nx));
    p.appendChild(tapeBar(v, nx));
    p.appendChild(h('div', { class: 'row between mt' }, btn(t('game.listAll'), function () { S.sel = null; refreshSide(); refreshMap(); }, { cls: 'ghost sm', icon: 'list' }), h('span', { class: 'muted small' }, t('game.timeHere', { s: Math.round(v.st.timeSpent) }))));
  }
  /* sense ajudes: mode avaluable, repte i nivell molt difícil (sense correcció immediata ni colors als resultats) */
  /* nota didàctica del perfil (embaràs, persona sorda, gent gran, lesió oculta…) */
  function profNote(v) { const k = v && v.profile ? 'prof.' + v.profile : null; const s = k ? I.get(S.lang, k) : null; return s ? ' ' + s : ''; }
  function noHelp() { return S.mode === 'eval' || S.mode === 'challenge' || !!(S.game && S.game.sc.difficulty === 'vhard' && S.mode !== 'guided'); }
  /* ---------- vista ampliada de la víctima: pistes visuals i respiració / pols en temps real ----------
     Només llegeix l'estat (L.cues): obrir-la, comptar amb el cronòmetre o mirar el pols no costa temps de joc ni canvia res.
     Les accions que costen temps (comptar FR, pols, reompliment…) es continuen fent amb els botons del panell. */
  function explicitCues() { const g = S.game; return !!g && (S.mode === 'guided' || S.mode === 'practice') && (g.sc.difficulty === 'easy' || g.sc.difficulty === 'normal'); }
  function cueList(v, c) {
    const out = [];
    const site = (s) => t('site.' + (s || 'trunk'));
    out.push(t('cue.posture.' + c.posture) + (c.moving === 'still' ? ' ' + t('cue.still') : ''));
    out.push(!c.breath.on ? t('cue.breath.none') : t('cue.breath.' + c.breath.pattern) + (c.breath.showRate ? ' ' + t('cue.breath.rate', { rr: c.breath.rr }) : ' ' + t('cue.breath.count')));
    if (c.breath.noisy) out.push(t('cue.noisy'));
    if (c.bleed.kind !== 'none') out.push(t(c.bleed.controlled ? 'cue.bleed.ctrl' : 'cue.bleed.' + c.bleed.kind, { site: site(c.bleed.site) }));
    if (c.skin.cyan) out.push(t('cue.cyan'));
    if (c.skin.pale) out.push(t('cue.pale'));
    else if (!c.pulse.known && c.breath.on) out.push(t('cue.paleUnknown'));
    if (c.skin.sweat) out.push(t('cue.sweat'));
    if (c.skin.soot) out.push(t('cue.soot'));
    if (c.skin.burns) out.push(t('cue.burns', { site: site(c.skin.burns) }));
    if (c.deform) out.push(t('cue.deform', { site: site(c.site) }));
    out.push(t('cue.eyes.' + c.eyes));
    if (c.mental) out.push(t('cue.mental.' + c.mental));
    out.push(!c.pulse.known ? t('cue.pulse.unknown') : !c.pulse.present ? t('cue.pulse.absent') : t('cue.pulse.' + c.pulse.strength) + (c.explicit ? ' ' + t('cue.pulse.rate', { hr: c.pulse.rate }) : ''));
    out.push(c.crt.known ? t('cue.crt.sec', { s: c.crt.sec > 4 ? '> 4' : c.crt.sec }) : t('cue.crt.unknown'));
    return out;
  }
  function closeCloseup() {
    const cl = S.closeup; if (!cl) return;
    if (cl.beat) W.clearInterval(cl.beat); if (cl.sw) W.clearInterval(cl.sw);
    try { if (W.navigator && W.navigator.vibrate) W.navigator.vibrate(0); } catch (e) { /* res */ }
    if (cl.el && cl.el.parentNode) cl.el.parentNode.removeChild(cl.el);
    S.closeup = null; if (cl.prev && cl.prev.focus) cl.prev.focus();
  }
  function startBeat() {
    const cl = S.closeup; if (!cl) return; if (cl.beat) { W.clearInterval(cl.beat); cl.beat = null; }
    const c = cl.c; if (!c.pulse.known || !c.pulse.present || doc.hidden) return;
    const hapt = !!S.prefs.haptic && S.prefs.soundMode !== 'off' && W.navigator && typeof W.navigator.vibrate === 'function';
    const tick = S.prefs.soundMode === 'all' && !!S.prefs.pulseTick;
    if (!hapt && !tick) return;
    cl.beat = W.setInterval(function () { if (doc.hidden) return; if (hapt) { try { W.navigator.vibrate(c.pulse.strength === 'weak' ? 12 : 25); } catch (e) { /* res */ } } if (tick) SND.play('pulse'); }, Math.round(60000 / Math.max(30, c.pulse.rate)));
  }
  function openCloseup(v) {
    closeCloseup();
    const g = S.game, explicit = explicitCues();
    const c = L.cues(v, { explicit: explicit }, D);
    const base = figState(v);
    const fig = A.figure(Object.assign({}, base, { exact: true, pattern: c.breath.pattern, eyes: c.eyes, sweat: c.skin.sweat, soot: c.skin.soot, burns: c.skin.burns, deform: c.deform, noisy: c.breath.noisy,
      pale: c.skin.pale, cyan: c.skin.cyan, dead: base.dead && !!v.st.dead, breathing: c.breath.on, rr: c.breath.rr }));
    fig.setAttribute('aria-hidden', 'true');
    const items = cueList(v, c);
    const sw = h('b', { class: 'mono', id: 'cl-sw' }, '15'), swBtn = btn(t('cl.stopwatch'), function () {
      const cl = S.closeup; if (!cl) return; if (cl.sw) { W.clearInterval(cl.sw); cl.sw = null; }
      let left = 15; sw.textContent = '15'; swBtn.classList.add('on');
      cl.sw = W.setInterval(function () { if (doc.hidden) return; left -= 1; sw.textContent = String(Math.max(0, left)); if (left <= 0) { W.clearInterval(cl.sw); cl.sw = null; swBtn.classList.remove('on'); announce(t('cl.swDone')); } }, 1000);
    }, { cls: 'sm', icon: 'timer', id: 'cl-sw-btn' });
    const period = c.breath.on ? (60 / c.breath.rr).toFixed(2) + 's' : '0s';
    const pulseKnown = c.pulse.known;
    const wr = A.wrist({ present: pulseKnown && c.pulse.present, weak: c.pulse.strength === 'weak', period: c.pulse.rate ? (60 / c.pulse.rate).toFixed(3) : 1, skin: 'sk' + (v.look.skin % 4) });
    const nail = h('div', { class: 'nail cl-nail', id: 'cl-nail' }, h('i', { class: 'nail-bed' }));
    const crtBtn = btn(t('cl.crtShow'), async function () {
      if (!c.crt.known) return;
      nail.classList.remove('refill'); nail.classList.add('press'); await pause(reduced ? 300 : 900); nail.classList.remove('press'); nail.classList.add('refill');
      if (nail.style && nail.style.setProperty) nail.style.setProperty('--refill', Math.min(c.crt.sec, 5) + 's');
      await pause(Math.min(c.crt.sec, 5) * 1000); announce(t('cue.crt.sec', { s: c.crt.sec > 4 ? '> 4' : c.crt.sec }));
    }, { cls: 'sm', icon: 'crt', id: 'cl-crt', disabled: !c.crt.known });
    const rhythm = h('button', { type: 'button', class: 'btn sm ghost', id: 'cl-rhythm', 'aria-pressed': 'false',
      on: { pointerdown: function () { el.classList.add('play'); }, pointerup: function () { el.classList.remove('play'); }, pointerleave: function () { el.classList.remove('play'); },
        keydown: function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); el.classList.add('play'); } }, keyup: function () { el.classList.remove('play'); } } }, ic('play'), h('span', { class: 'btn-l' }, t('cl.rhythm')));
    const hapticOk = W.navigator && typeof W.navigator.vibrate === 'function';
    const prefs = h('div', { class: 'cl-prefs' },
      hapticOk ? h('label', { class: 'switch' }, h('input', { type: 'checkbox', id: 'cl-haptic', checked: !!S.prefs.haptic, disabled: S.prefs.soundMode === 'off', on: { change: function (e) { S.prefs.haptic = !!e.target.checked; savePrefs(); startBeat(); } } }), h('span', null, t('cl.haptic'))) : null,
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', id: 'cl-tick', checked: !!S.prefs.pulseTick, disabled: S.prefs.soundMode !== 'all', on: { change: function (e) { S.prefs.pulseTick = !!e.target.checked; savePrefs(); startBeat(); } } }), h('span', null, t('cl.tick'))),
      S.prefs.soundMode === 'off' ? h('small', { class: 'muted' }, t('cl.needSound')) : null);
    const tg = L.lastTag(v), here = L.rescuerAt(g, v);
    const tapes = h('div', { class: 'tape-row' }, ['red', 'yellow', 'green', 'black'].map((cat) => h('button', { type: 'button', class: 'tapebtn tape-' + cat + (tg === cat ? ' cur' : ''), id: 'cl-tape-' + cat, disabled: !here || g.over || S.busy, 'aria-label': t('game.tagAria', { cat: catName(cat) }), on: { click: function () { closeCloseup(); doTag(v, cat); } } }, h('b', null, catName(cat)), h('small', null, t('cat.' + cat + 'Sub')))));
    const el = h('div', { class: 'sheet-root' + (doc.hidden ? ' paused' : ''), id: 'closeup' },
      h('div', { class: 'scrim', on: { click: closeCloseup } }),
      h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cl-title', on: { keydown: function (e) { if (e.key === 'Escape') closeCloseup(); } } },
        h('header', { class: 'sheet-h' }, h('div', { class: 'vnum' + (tg ? ' tape-' + tg : '') }, String(v.num)), h('div', null, h('h2', { id: 'cl-title' }, t('cl.title', { n: v.num })), h('p', { class: 'muted small' }, who(v), ' · ', t(explicit ? 'cl.modeExplicit' : 'cl.modeSubtle'))),
          btn('', closeCloseup, { icon: 'cross', cls: 'icon ghost', aria: t('ui.close'), id: 'cl-close' })),
        h('div', { class: 'sheet-b' },
          h('div', { class: 'cl-fig', style: '--br:' + period }, fig),
          h('div', { class: 'cl-side' },
            h('h3', null, t('cl.see')), h('ul', { class: 'cl-cues', id: 'cl-cues', 'aria-label': t('cl.see') }, items.map((x) => h('li', null, x))),
            h('div', { class: 'cl-box' }, h('h3', null, ic('rr'), ' ', t('cl.breathing')), h('p', { class: 'small' }, t('cl.countHelp')), h('div', { class: 'row' }, swBtn, sw, h('small', { class: 'muted' }, 's'), reduced ? rhythm : null)),
            h('div', { class: 'cl-box' }, h('h3', null, ic('radial'), ' ', t('cl.pulse')), wr, h('p', { class: 'small muted' }, pulseKnown ? (c.pulse.present ? t(c.explicit ? 'cl.pulseKnownRate' : 'cl.pulseKnown', { hr: c.pulse.rate }) : t('cue.pulse.absent')) : t('cl.pulseNeedCheck'))),
            h('div', { class: 'cl-box' }, h('h3', null, ic('crt'), ' ', t('cl.crt')), h('div', { class: 'row' }, nail, crtBtn), h('p', { class: 'small muted' }, c.crt.known ? t('cl.crtHelp') : t('cl.crtNeedCheck'))),
            prefs)),
        h('footer', { class: 'sheet-f' }, h('h3', null, here ? (tg ? t('game.retag') : t('game.tag')) : t('cl.goFirst')), tapes,
          h('p', { class: 'muted small' }, t('cl.note')))));
    (doc.body || doc.documentElement).appendChild(el);
    S.closeup = { el: el, c: c, v: v.id, prev: doc.activeElement, beat: null, sw: null };
    startBeat();
    const cb = $('cl-close'); if (cb && cb.focus) cb.focus();
  }
  try { doc.addEventListener('visibilitychange', function () { const cl = S.closeup; if (!cl) return; if (doc.hidden) { cl.el.classList.add('paused'); if (cl.beat) { W.clearInterval(cl.beat); cl.beat = null; } } else { cl.el.classList.remove('paused'); startBeat(); } }); } catch (e) { /* res */ }
  function hospName(id) { const hh = D.HOSPITALS.find((x) => x.id === id); return hh ? tx(hh.short) : id; }
  function figState(v, extra) {
    const p = v.phys, st = v.st;
    return Object.assign({
      post: st.positioned ? 'lie' : (p.walk && !st.dead ? 'stand' : v.post === 'stand' ? 'sit' : v.post), skin: v.look.skin, cloth: v.look.cloth, hair: v.look.hair, ped: v.ped,
      bleed: v.bleed, site: v.site, ctrl: st.bleedCtrl ? (st.interventions.some((i) => i.what === 'tourniquet' && i.res === 'controlled') ? 'tourniquet' : 'pressure') : null,
      pale: !p.radial || p.crt > 2, cyan: !p.br, dead: st.dead && S.mode !== 'eval' ? true : (!p.br && !p.airwayFix && !(v.ped && p.rescueFix)),
      breathing: p.br, rr: p.rr, airwayOpen: st.airwayOpen, positioned: st.positioned, tag: L.lastTag(v), walking: p.walk && !st.dead
    }, extra || {});
  }
  function findings(v) {
    const r = v.st.results, rows = [], neutral = noHelp();
    const row = (icn, label, val, bad) => h('li', { class: 'fd' + (neutral ? '' : bad === true ? ' bad' : bad === false ? ' good' : '') }, ic(icn), h('span', { class: 'fd-l' }, label), h('b', null, val));
    if (r.walk) rows.push(row('walk', t('chk.walk'), r.walk.walks ? t(r.walk.deaf ? 'r.walkDeaf' : 'r.walkYes') : t('r.walkNo'), null));
    else if (v.st.atCCP) rows.push(row('walk', t('chk.walk'), t('r.walkedCCP'), null));
    if (r.breath) rows.push(row('breath', t('chk.breath'), r.breath.breathing ? t('r.yes') : t('r.no'), !r.breath.breathing));
    v.st.interventions.forEach(function (it) { if (it.what === 'airway' || it.what === 'rescue') rows.push(row(it.what === 'airway' ? 'airway' : 'rescue', t('do.' + it.what), t('res.' + it.what + '.' + it.res), it.res === 'noBreath')); });
    ['rr30', 'rr15'].forEach(function (k) { if (r[k]) { const lim = v.ped ? (r[k].rr < L.J_RR_LOW || r[k].rr > L.J_RR_HIGH) : r[k].rr > L.RR_LIMIT; rows.push(row('rr', t('chk.rrShort'), t('r.rr', { c: r[k].count, w: r[k].window, rr: r[k].rr }), lim)); } });
    if (r.radial) rows.push(row('radial', t(v.ped ? 'chk.pulsePed' : 'chk.radial'), r.radial.present ? t('r.present') : t('r.absent'), !r.radial.present));
    if (r.crt) rows.push(row('crt', t('chk.crt'), r.crt.sec > 4 ? '> 4 s' : r.crt.sec + ' s', r.crt.sec > 2));
    if (r.mental) rows.push(v.ped ? row('mental', t('chk.avpu'), t('avpu.' + r.mental.avpu), r.mental.avpu === 'U' || r.mental.avpu === 'Pi') : row('mental', t('chk.mental'), r.mental.obeys ? t('r.obeys') : t('r.notObeys'), !r.mental.obeys));
    v.st.interventions.forEach(function (it) { if (['pressure', 'tourniquet', 'position', 'cpr', 'secondary'].indexOf(it.what) >= 0) rows.push(row(it.what, t('do.' + it.what), t('res.' + it.res), it.res === 'mciNoCpr' || it.res === 'phase2Cpr' || it.res === 'notStart' ? true : null)); });
    return rows.length ? h('ul', { class: 'findings', 'aria-label': t('game.findings') }, rows) : h('p', { class: 'muted small findings-empty' }, t('game.noFindings'));
  }
  function coachText(v, nx) {
    if (nx.kind === 'tag') return t('coach.tag', { cat: catName(nx.cat) }) + ' ' + t((v.ped ? 'whyJ.' : 'why.') + L.classify(v).step, { rr: v.phys.rr });
    return t('coach.' + nx.kind + '.' + (nx.check || nx.what) + (v.ped && (nx.check === 'radial' || nx.check === 'mental' || nx.check === 'rr15') ? 'Ped' : ''));
  }
  function feedbackBox(f) {
    return h('div', { class: 'fb ' + (f.kind === 'ok' ? 'ok' : f.kind === 'over' ? 'warn' : 'bad'), role: 'status' },
      h('b', null, f.kind === 'ok' ? t('fb.ok') : f.kind === 'over' ? t('fb.over', { cat: catName(f.truth) }) : t('fb.under', { cat: catName(f.truth) })),
      h('p', null, f.why));
  }
  const CHECK_ICON = { walk: 'walk', breath: 'breath', rr15: 'rr', rr30: 'rr', radial: 'radial', crt: 'crt', mental: 'mental' };
  function toolbelt(v, nx) {
    const g = S.game;
    const mk = (kind, id, icn, label, cost, extra) => {
      const hint = nx && nx.kind === kind && (nx.check === id || nx.what === id);
      return h('button', { type: 'button', class: 'tool' + (hint ? ' hint' : '') + (extra && extra.trap ? ' trap' : ''), disabled: S.busy || g.over, id: 'tool-' + id, 'data-act': kind + ':' + id,
        on: { click: function () { if (kind === 'check') doCheck(v, id); else doIntervention(v, id); } } },
        ic(icn), h('span', { class: 'tool-l' }, label), h('small', null, cost + ' s'));
    };
    const checks = h('div', { class: 'tools' },
      mk('check', 'walk', 'walk', t('chk.walkQ'), L.COST.walk),
      mk('check', 'breath', 'breath', t('chk.breathQ'), L.COST.breath),
      mk('check', 'rr15', 'rr', t('chk.rr15'), L.COST.rr15),
      mk('check', 'rr30', 'rr', t('chk.rr30'), L.COST.rr30),
      mk('check', 'radial', 'radial', t(v.ped ? 'chk.pulsePed' : 'chk.radial'), L.COST.radial),
      mk('check', 'crt', 'crt', t('chk.crt'), L.COST.crt),
      mk('check', 'mental', 'mental', t(v.ped ? 'chk.avpu' : 'chk.mentalQ'), L.COST.mental));
    const dos = h('div', { class: 'tools' },
      mk('do', 'airway', 'airway', t('do.airway'), L.COST.airway),
      v.ped ? mk('do', 'rescue', 'rescue', t('do.rescue'), L.COST.rescue) : null,
      mk('do', 'pressure', 'pressure', t('do.pressure'), L.COST.pressure),
      mk('do', 'tourniquet', 'tourniquet', t('do.tourniquet'), L.COST.tourniquet),
      mk('do', 'position', 'position', t('do.position'), L.COST.position),
      v.relative ? mk('do', 'delegate', 'users', t('do.delegate'), L.COST.delegate) : null,
      mk('do', 'cpr', 'cpr', t(L.phase2(g) ? 'do.cprP2' : 'do.cpr'), L.COST.cpr, { trap: true }),
      mk('do', 'secondary', 'secondary', t(L.phase2(g) ? 'do.secondaryP2' : 'do.secondary'), L.COST.secondary, { trap: !L.phase2(g) }));
    return h('div', { class: 'belt' }, h('h3', null, t('game.assess')), checks, h('h3', null, t('game.intervene')), dos);
  }
  function tapeBar(v, nx) {
    const g = S.game, cur = L.lastTag(v);
    return h('div', { class: 'tapes' }, h('h3', null, cur ? t('game.retag') : t('game.tag')),
      h('div', { class: 'tape-row' }, ['red', 'yellow', 'green', 'black'].map(function (c) {
        const hint = nx && nx.kind === 'tag' && nx.cat === c;
        return h('button', { type: 'button', class: 'tapebtn tape-' + c + (hint ? ' hint' : '') + (cur === c ? ' cur' : ''), id: 'tape-' + c, disabled: S.busy || g.over, 'aria-label': t('game.tagAria', { cat: catName(c) }),
          on: { click: function () { doTag(v, c); } } }, h('b', null, catName(c)), h('small', null, t('cat.' + c + 'Sub')));
      })));
  }
  function overlay(content, cls) { const o = $('overlay'); if (!o) return null; clear(o); o.setAttribute('class', 'overlay show ' + (cls || '')); add(o, content); return o; }
  function hideOverlay() { const o = $('overlay'); if (o) { o.setAttribute('class', 'overlay'); clear(o); } }
  function progress(label, ms, icn) {
    const bar = h('i', { class: 'pbar' });
    overlay([h('div', { class: 'ov-box' }, ic(icn || 'clock'), h('b', null, label), h('div', { class: 'prog' }, bar))]);
    if (bar.style && bar.style.setProperty) { bar.style.setProperty('animation-duration', (reduced ? 0 : ms) + 'ms'); }
    return wait(ms);
  }
  async function doCheck(v, c) {
    const g = S.game;
    await run({ type: 'check', id: v.id, check: c }, async function (r) {
      sfx.tap();
      if (c === 'rr15' || c === 'rr30') {
        const total = r.result.window, speed = 3, ms = total / speed * 1000;
        const cnt = h('b', { class: 'big' }, '0'), clock = h('span', { class: 'mono' }, '0 s');
        const fig = $('figwrap'); if (fig && fig.firstChild) fig.firstChild.classList.add('counting');
        overlay([h('div', { class: 'ov-box rr' }, ic('rr'), h('span', null, t('anim.counting')), cnt, clock, h('small', null, t('anim.countHelp')))], 'clear');
        const breaths = r.result.count;
        if (!reduced && breaths > 0) {
          const step = ms / breaths;
          for (let i = 1; i <= breaths; i++) { await wait(step); cnt.textContent = String(i); clock.textContent = Math.round(i * total / breaths) + ' s'; sfx.breath(); }
        } else { await wait(reduced ? 0 : ms); cnt.textContent = String(breaths); clock.textContent = total + ' s'; }
        await wait(500);
      } else if (c === 'crt') {
        const sec = r.result.sec;
        const nail = h('div', { class: 'nail' }, h('i', { class: 'nail-bed' }));
        overlay([h('div', { class: 'ov-box' }, ic('crt'), h('b', null, t('anim.crt')), nail, h('small', { class: 'mono', id: 'crt-s' }, '…'))], 'clear');
        await wait(600); nail.classList.add('press'); await wait(700); nail.classList.remove('press'); nail.classList.add('refill');
        if (nail.style && nail.style.setProperty) nail.style.setProperty('--refill', Math.min(sec, 5) * 0.6 + 's');
        await wait(Math.min(sec, 5) * 600); const cs = $('crt-s'); if (cs) cs.textContent = sec > 4 ? '> 4 s' : sec + ' s'; await wait(500);
      } else if (c === 'radial') {
        const present = r.result.present;
        overlay([h('div', { class: 'ov-box' }, ic('radial'), h('b', null, t(v.ped ? 'anim.pulsePed' : 'anim.radial')), h('div', { class: 'pulse ' + (present ? 'on' : 'off') }, h('i', null)))], 'clear');
        await wait(1500);
      } else if (c === 'mental') {
        overlay([h('div', { class: 'ov-box talk' }, h('p', { class: 'bubble me' }, t(v.ped ? 'anim.avpuSay' : 'anim.mentalSay')), h('p', { class: 'bubble them' }, v.ped ? t('anim.avpu.' + r.result.avpu) : r.result.obeys ? t('anim.squeeze') : t('anim.noSqueeze')))], 'clear');
        await wait(1500);
      } else if (c === 'walk') {
        overlay([h('div', { class: 'ov-box talk' }, h('p', { class: 'bubble me' }, t('anim.walkSay')), h('p', { class: 'bubble them' }, r.result.walks ? t(r.result.deaf ? 'anim.walkDeaf' : 'anim.walkYes') : t('anim.walkNo')))], 'clear');
        await wait(1200);
      } else {
        await progress(t('anim.breath'), 1300, 'breath');
      }
      hideOverlay();
      S.lastFeedback = null;
      announce(t('chk.' + (c === 'rr15' || c === 'rr30' ? 'rrShort' : c)) + ': ' + resultText(v, c, r.result));
    });
  }
  function resultText(v, c, r) {
    if (c === 'walk') return r.walks ? t(r.deaf ? 'r.walkDeaf' : 'r.walkYes') : t('r.walkNo');
    if (c === 'breath') return r.breathing ? t('r.yes') : t('r.no');
    if (c === 'rr15' || c === 'rr30') return t('r.rr', { c: r.count, w: r.window, rr: r.rr });
    if (c === 'radial') return r.present ? t('r.present') : t('r.absent');
    if (c === 'crt') return r.sec > 4 ? '> 4 s' : r.sec + ' s';
    if (c === 'mental') return v.ped ? t('avpu.' + r.avpu) : r.obeys ? t('r.obeys') : t('r.notObeys');
    return '';
  }
  async function doIntervention(v, w) {
    const res = await run({ type: 'do', id: v.id, what: w }, async function (r) {
      sfx.tap();
      await progress(t('do.' + w), w === 'cpr' || w === 'secondary' ? 1800 : 1000, w === 'airway' ? 'airway' : w);
      hideOverlay();
    });
    if (!res) return;
    if (!res.ok) return;
    const rr = res.result.res;
    const kind = ['controlled', 'breathes', 'ok', 'minorOk', 'phase2Exam', 'delegated', 'delegatedAirway'].indexOf(rr) >= 0 ? 'ok' : ['mciNoCpr', 'phase2Cpr', 'notStart', 'notLimb', 'noBleed', 'notNeeded', 'noPulse', 'noRelative'].indexOf(rr) >= 0 ? 'bad' : 'info';
    const msg = t((w === 'airway' || w === 'rescue') ? 'res.' + w + '.' + rr : 'res.' + rr);
    if (noHelp()) toast(msg, 'info');
    else { toast(msg + (kind === 'bad' ? ' ' + t('why.do.' + rr) : ''), kind, kind === 'bad' ? 6000 : 3500); if (kind === 'bad') sfx.bad(); else if (kind === 'ok') sfx.ok(); }
  }
  async function doTag(v, cat) {
    const g = S.game;
    const r = await run({ type: 'tag', id: v.id, cat: cat }, async function () { sfx.tag(); await wait(450); });
    if (!r || !r.ok) return;
    const res = r.result;
    const why = t((v.ped ? 'whyJ.' : 'why.') + res.step, { rr: v.phys.rr }) + profNote(v);
    if (!noHelp()) {
      S.lastFeedback = { id: v.id, kind: res.kind, truth: res.truth, why: why };
      if (res.kind === 'ok') { sfx.ok(); toast(t('fb.okShort', { n: v.num, cat: catName(cat) }), 'ok'); }
      else { sfx.bad(); toast(res.kind === 'over' ? t('fb.over', { cat: catName(res.truth) }) : t('fb.under', { cat: catName(res.truth) }), res.kind === 'over' ? 'warn' : 'bad', 5000); }
      if (S.mode === 'practice' && res.kind === 'ok') { S.sel = null; }
      refreshSide();
    } else {
      toast(t('fb.tagged', { n: v.num, cat: catName(cat) }), 'tag');
      S.sel = null; refreshSide(); refreshMap();
    }
    announce(t('fb.tagged', { n: v.num, cat: catName(cat) }));
  }
  function victimList() {
    const g = S.game;
    const St = D.SETTINGS[g.sc.setting];
    const all = g.victims.slice().filter((v) => !v.st.evac && L.isSeen(v)).sort(function (a, b) { const ta = L.lastTag(a) ? 1 : 0, tb = L.lastTag(b) ? 1 : 0; return ta - tb || L.dist(g.rescuer, a) - L.dist(g.rescuer, b); });
    /* filtres (útils amb moltes víctimes, sobretot al mòbil) */
    const F = { all: () => true, none: (v) => !L.lastTag(v), red: (v) => L.lastTag(v) === 'red', yellow: (v) => L.lastTag(v) === 'yellow', green: (v) => L.lastTag(v) === 'green', locked: (v) => L.isLocked(g, v) };
    const cur = F[S.vfilter] ? S.vfilter : 'all';
    const chips = h('div', { class: 'vfilters', role: 'group', 'aria-label': t('game.filter') }, ['all', 'none', 'red', 'yellow', 'green', 'locked'].map(function (k) {
      const n = all.filter(F[k]).length; if (!n && k !== 'all' && k !== cur) return null;
      return h('button', { type: 'button', class: 'vf' + (cur === k ? ' on' : '') + (['red', 'yellow', 'green'].indexOf(k) >= 0 ? ' vf-' + k : ''), id: 'vf-' + k, 'aria-pressed': String(cur === k), on: { click: function () { S.vfilter = k; refreshSide(); } } }, t('vf.' + k), h('b', null, String(n)));
    }));
    const next = all.find((v) => !L.lastTag(v) && !v.st.atCCP && !L.isLocked(g, v));
    const nextBtn = next ? btn(t('game.nextUntriaged', { n: next.num }), function () { onMarker(next.id); centerOn(next.x, next.y, Math.min(S.cam.w, 900)); }, { cls: 'sm ghost', icon: 'target', id: 'b-next-untriaged' }) : null;
    const list = all.filter(F[cur]);
    const row = function (v) {
      const tg = L.lastTag(v), d = L.dist(g.rescuer, L.pointOf(g, v.id, D));
      const locked = L.isLocked(g, v);
      return h('li', null, h('button', { type: 'button', class: 'vrow' + (S.sel === v.id ? ' on' : ''), on: { click: function () { onMarker(v.id); } } },
        h('span', { class: 'vnum sm' + (tg ? ' tape-' + tg : '') }, String(v.num)),
        h('span', { class: 'vrow-t' }, h('b', null, who(v)), h('small', null, v.st.atCCP && !v.st.atStation ? t('zone.ccp') : tg ? catName(tg) : t('game.untriaged'))),
        locked ? ic('lock') : null, v.bleed === 'major' && !v.st.bleedCtrl && !(v.st.dead && S.mode !== 'eval') ? h('span', { class: 'dot-bleed', title: t('game.bleedSeen') }) : null,
        h('small', { class: 'vrow-d' }, L.rescuerAt(g, v) ? t('game.here') : Math.round(d * 0.1) + ' m')));
    };
    const head = h('div', { class: 'vlist-head' }, h('h3', null, t('game.allVictims') + ' (' + all.length + ')'), nextBtn);
    if (!St.sectors) return h('div', { class: 'vlist' }, head, all.length > 8 ? chips : null, h('ul', null, list.map(row)));
    /* gran catàstrofe: agrupades per sector (el més proper); la zona verda i les estacions, a part */
    const groups = St.sectors.map((s, i) => ({ key: 's' + i, label: String.fromCharCode(65 + i) + ' · ' + tx(s.name), items: [] }));
    const cold = { key: 'cold', label: t('zone.cold'), items: [] };
    list.forEach(function (v) {
      if (v.st.atCCP || v.st.atStation) { cold.items.push(v); return; }
      let bi = 0, bd = Infinity; St.sectors.forEach((s, i) => { const dd = Math.hypot(v.x - s.x, v.y - s.y); if (dd < bd) { bd = dd; bi = i; } });
      groups[bi].items.push(v);
    });
    return h('div', { class: 'vlist' }, head, chips, groups.concat([cold]).filter((gr) => gr.items.length).map(function (gr) {
      const pend = gr.items.filter((v) => !L.lastTag(v)).length;
      return h('details', { class: 'vgroup', open: S.closedGroups && S.closedGroups[gr.key] ? null : true, on: { toggle: function (e) { S.closedGroups = S.closedGroups || {}; S.closedGroups[gr.key] = !e.target.open; } } },
        h('summary', null, h('b', null, gr.label), h('span', { class: 'muted small' }, t('game.groupCount', { n: gr.items.length, p: pend }))),
        h('ul', null, gr.items.map(row)));
    }));
  }
  function paneCCP(p) {
    const g = S.game, here = g.rescuer.at === 'ccp';
    const list = g.victims.filter((v) => v.st.atCCP && !v.st.evac && !(v.st.atStation && L.lastTag(v) !== 'green'));
    const pending = list.filter((v) => !v.st.tags.length);
    p.appendChild(h('div', { class: 'vhead' }, h('div', { class: 'vnum tape-green' }, ic('users')), h('div', { class: 'vwho' }, h('h2', null, t('zone.ccp')), h('p', null, t('game.ccpHelp')))));
    if (!here) p.appendChild(h('div', { class: 'go-row' }, h('div', { class: 'go-meta' }, ic('run'), h('span', null, t('game.distance', { m: Math.round(L.dist(g.rescuer, L.pointOf(g, 'ccp', D)) * 0.1), s: L.travelSec(L.dist(g.rescuer, L.pointOf(g, 'ccp', D))) }))), btn(t('game.goTo'), function () { goTo('ccp'); }, { cls: 'primary', icon: 'run', id: 'b-goccp' })));
    if (S.mode === 'guided') p.appendChild(coachBox(t('coach.ccpPanel')));
    if (here && pending.length) p.appendChild(btn(t('game.tagAllGreen', { n: pending.length, s: pending.length * L.COST.tag }), function () { run({ type: 'tagCCP' }, async function () { sfx.tag(); await wait(500); }).then(function (r) { if (r && r.ok) { const bad = r.result.tagged.filter((x) => x.kind !== 'ok').length; if (S.mode === 'guided' || S.mode === 'practice') toast(bad ? t('fb.ccpBad', { n: bad }) : t('fb.ccpOk'), bad ? 'bad' : 'ok', 5000); } }); }, { cls: 'primary', icon: 'tag', id: 'b-tagccp', disabled: S.busy }));
    p.appendChild(h('ul', { class: 'vlist-ul' }, list.map(function (v) {
      const tg = L.lastTag(v);
      return h('li', null, h('button', { type: 'button', class: 'vrow', on: { click: function () { S.sel = v.id; refreshSide(); refreshMap(); } } }, h('span', { class: 'vnum sm' + (tg ? ' tape-' + tg : '') }, String(v.num)), h('span', { class: 'vrow-t' }, h('b', null, who(v)), h('small', null, tx(v.desc)))));
    })));
    if (!list.length) p.appendChild(h('p', { class: 'muted' }, g.walkCallT === null ? t('game.ccpEmptyNoCall') : t('game.ccpEmpty')));
  }
  function paneAlgo(p) {
    const g = S.game, v = S.sel && S.sel !== 'ccp' ? L.vById(g, S.sel) : null;
    const showPath = v && (S.mode === 'guided' || S.mode === 'practice');
    let pathNodes = [];
    if (v) {
      const d = v.st.done;
      pathNodes = ['walk'].concat(d.breath ? ['breath'] : [], v.st.airwayTried ? ['airway'] : [], d.rr ? ['rr'] : [], d.perf ? ['perf'] : [], d.radial && v.ped ? ['pulse'] : [], d.mental ? ['mental'] : [], d.rescue ? ['rescue'] : []);
    }
    const nx = v && S.mode === 'guided' ? L.nextStep(g, v) : null;
    const tg = v ? L.lastTag(v) : null;
    p.appendChild(h('h2', null, v && v.ped ? t('algo.jumpTitle') : t('algo.title')));
    p.appendChild(h('p', { class: 'muted small' }, v && v.ped ? t('algo.jumpHelp') : t('algo.help')));
    p.appendChild(startDiagram({ ped: !!(v && v.ped), path: pathNodes, result: showPath && tg ? L.classify(v).cat : null, next: nx ? nodeOfStep(nx) : null }));
    p.appendChild(h('div', { class: 'card mini' }, h('h3', null, t('algo.mciTitle')), h('ul', { class: 'list' }, ['algo.mci1', 'algo.mci2', 'algo.mci3', 'algo.mci4'].map((k) => h('li', null, t(k))))));
  }
  function nodeOfStep(nx) {
    if (nx.kind === 'check') return { walk: 'walk', breath: 'breath', rr15: 'rr', rr30: 'rr', radial: 'perf', crt: 'perf', mental: 'mental' }[nx.check];
    if (nx.kind === 'do') return nx.what === 'airway' ? 'airway' : nx.what === 'rescue' ? 'rescue' : null;
    return null;
  }
  /* Diagrama START / JumpSTART (HTML accessible) */
  function startDiagram(o) {
    o = o || {}; const ped = !!o.ped, path = o.path || [];
    const N = ped
      ? [['walk', 'algo.walk', 'green', 'algo.yes'], ['breath', 'algo.breath', null, null], ['airway', 'algo.airwayJ', 'red', 'algo.yes'], ['pulse', 'algo.pulseJ', 'black', 'algo.no'], ['rescue', 'algo.rescueJ', 'red', 'algo.yes'], ['rr', 'algo.rrJ', 'red', 'algo.yes'], ['perf', 'algo.perfJ', 'red', 'algo.no'], ['mental', 'algo.mentalJ', 'red', 'algo.yes']]
      : [['walk', 'algo.walk', 'green', 'algo.yes'], ['breath', 'algo.breath', null, null], ['airway', 'algo.airway', 'red', 'algo.yes'], ['rr', 'algo.rr', 'red', 'algo.yes'], ['perf', 'algo.perf', 'red', 'algo.yes'], ['mental', 'algo.mental', 'red', 'algo.no']];
    const ol = h('ol', { class: 'algo' + (ped ? ' ped' : '') });
    N.forEach(function (n, i) {
      const on = path.indexOf(n[0]) >= 0, nxt = o.next === n[0];
      const side = n[0] === 'breath' ? h('span', { class: 'algo-side' }, h('em', null, t('algo.no')), ' → ', t(ped ? 'algo.toAirwayJ' : 'algo.toAirway')) :
        n[0] === 'airway' && !ped ? h('span', { class: 'algo-side' }, h('em', null, t('algo.yes')), ' → ', h('i', { class: 'chip tape-red' }, catName('red')), ' · ', h('em', null, t('algo.no')), ' → ', h('i', { class: 'chip tape-black' }, catName('black'))) :
        n[2] ? h('span', { class: 'algo-side' }, h('em', null, t(n[3])), ' → ', h('i', { class: 'chip tape-' + n[2] + (o.result === n[2] && on && path[path.length - 1] === n[0] ? ' hit' : '') }, catName(n[2]))) : null;
      ol.appendChild(h('li', { class: 'algo-n' + (on ? ' on' : '') + (nxt ? ' next' : '') }, h('span', { class: 'algo-i' }, String(i + 1)), h('span', { class: 'algo-q' }, t(n[1])), side));
    });
    ol.appendChild(h('li', { class: 'algo-n end' + (o.result === 'yellow' ? ' on' : '') }, h('span', { class: 'algo-i' }, '✓'), h('span', { class: 'algo-q' }, t(ped ? 'algo.restJ' : 'algo.rest')), h('span', { class: 'algo-side' }, h('i', { class: 'chip tape-yellow' + (o.result === 'yellow' ? ' hit' : '') }, catName('yellow')))));
    return h('div', { class: 'algo-wrap' }, ol);
  }
  function paneEvac(p) {
    const g = S.game;
    p.appendChild(h('h2', null, t('evac.title')));
    p.appendChild(h('p', { class: 'muted small' }, t('evac.help')));
    p.appendChild(h('ul', { class: 'hosps' }, g.sc.hospitals.map(function (hs) { const st = g.hosp[hs.id]; const hh = D.HOSPITALS.find((x) => x.id === hs.id); return h('li', { class: 'hosp k-' + hs.kind }, h('b', null, tx(hh.name)), h('small', null, hs.cap >= 99 ? t('evac.used', { u: st.used }) : t('evac.cap', { u: st.used, c: st.cap }))); })));
    const waiting = g.ambs.filter((a) => a.status === 'waiting');
    const ready = g.victims.filter((v) => L.readyForEvac(g, v)).sort((a, b) => L.PRIO[L.lastTag(a)] - L.PRIO[L.lastTag(b)] || a.num - b.num);
    if (!waiting.length) {
      const next = g.ambs.filter((a) => a.status === 'scheduled').sort((a, b) => a.at - b.at).slice(0, 3);
      p.appendChild(h('div', { class: 'empty sm' }, ic('ambulance', 'big'), h('p', null, next.length ? t('evac.noneWaiting') : t('evac.noMore'))));
      if (next.length) p.appendChild(h('ul', { class: 'eta' }, next.map((a) => h('li', null, h('b', null, t('amb.' + a.kind) + ' ' + a.id), h('span', null, t('evac.eta', { t: fmtT(a.at) }))))));
    }
    /* ¿cabe esta víctima en esta ambulancia? (camilla o asiento; el autobús solo lleva a quien camina) */
    const canLoad = (a, v) => { const f = L.freeSlots(a), canSeat = v.phys.walk && f.seat > 0; return (f.stretcher > 0 || canSeat) && !(a.kind === 'BUS' && !v.phys.walk); };
    waiting.forEach(function (a) {
      const f = L.freeSlots(a);
      const slots = [];
      a.load.forEach(function (l) { const v = L.vById(g, l.id); slots.push(h('li', { class: 'slot full' }, h('span', { class: 'vnum sm tape-' + L.lastTag(v) }, String(v.num)), h('span', null, who(v), ' · ', t('evac.slot.' + l.slot)), btn('', function () { run({ type: 'unload', amb: a.id, id: v.id }); }, { icon: 'cross', cls: 'icon ghost sm', aria: t('evac.unload') }))); });
      for (let i = 0; i < f.stretcher; i++) slots.push(h('li', { class: 'slot' }, ic('ambulance'), t('evac.slot.stretcher')));
      for (let i = 0; i < f.seat; i++) slots.push(h('li', { class: 'slot' }, ic('users'), t('evac.slot.seat')));
      const destSel = S.destSel && S.destSel[a.id] || suggestDest(a);
      const dests = h('div', { class: 'seg sm', role: 'radiogroup', 'aria-label': t('evac.dest') }, g.sc.hospitals.map(function (hs) { const st = g.hosp[hs.id]; const on = destSel === hs.id; const hh = D.HOSPITALS.find((x) => x.id === hs.id); return h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: 'seg-b' + (on ? ' on' : ''), disabled: st.cap - st.used < Math.max(1, a.load.length), on: { click: function () { S.destSel = S.destSel || {}; S.destSel[a.id] = hs.id; refreshSide(); } } }, tx(hh.short)); }));
      p.appendChild(h('section', { class: 'ambcard' },
        h('header', null, ic('ambulance'), h('b', null, t('amb.' + a.kind) + ' · ' + a.id), h('small', null, t('evac.waitingFor', { t: fmtT(g.t - a.arrivedT) }))),
        h('p', { class: 'muted small' }, t('amb.' + a.kind + 'Desc')),
        h('ul', { class: 'slots' }, slots),
        h('div', { class: 'lbl' }, t('evac.dest')), dests,
        btn(t('evac.dispatch'), function () { run({ type: 'dispatch', amb: a.id, dest: destSel }, async function () { sfx.sirenOut(); await wait(500); }).then(function (r) { if (r && r.ok && S.mode !== 'eval' && S.mode !== 'challenge') { const v = r.result.items.some((i) => i.violation), dd = r.result.items.some((i) => i.destScore < 1); if (v || dd) toast((v ? t('fb.prioViol') + ' ' : '') + (dd ? t('fb.destMeh') : ''), 'warn', 6000); else toast(t('fb.dispatchOk'), 'ok'); } }); }, { cls: 'primary', icon: 'next', disabled: !a.load.length || S.busy, id: 'b-dispatch-' + a.id })));
    });
    /* una sola lista de víctimas listas, agrupadas por cinta; cada fila tiene un botón por ambulancia que espera */
    if (waiting.length && ready.length) {
      const wrap = h('div', { class: 'ready-wrap' }, h('h3', { class: 'ready-h' }, t('evac.readyTitle', { n: ready.length })));
      ['red', 'yellow', 'green'].forEach(function (tag) {
        const grp = ready.filter((v) => L.lastTag(v) === tag); if (!grp.length) return;
        wrap.appendChild(h('h4', { class: 'ready-g tape-' + tag }, catName(tag) + ' (' + grp.length + ')'));
        wrap.appendChild(h('ul', { class: 'ready' }, grp.map(function (v) {
          const btns = waiting.map(function (a) {
            const lbl = waiting.length > 1 ? t('evac.loadTo', { amb: a.id }) : t('evac.load');
            return btn(lbl, function () { run({ type: 'load', amb: a.id, id: v.id }); }, { cls: 'sm', icon: 'plus', disabled: !canLoad(a, v) || S.busy, id: 'b-load-' + a.id + '-' + v.id });
          });
          return h('li', null, h('span', { class: 'vnum sm tape-' + L.lastTag(v) }, String(v.num)), h('span', { class: 'r-t' }, h('b', null, who(v)), h('small', null, (v.phys.walk ? t('evac.walks') : t('evac.stretcher')))), h('span', { class: 'r-btns' }, btns));
        })));
      });
      p.appendChild(wrap);
    }
    if (waiting.length && !ready.length) p.appendChild(h('p', { class: 'muted small' }, t('evac.noReady')));
    const moving = g.victims.filter((v) => v.st.stationAt !== null && !v.st.atStation && !v.st.dead && !v.st.evac);
    if (moving.length) p.appendChild(h('p', { class: 'muted small' }, ic('run'), ' ', t('evac.moving', { n: moving.length })));
    const gone = g.dispatches.slice().reverse();
    if (gone.length) p.appendChild(h('details', { class: 'gone' }, h('summary', null, t('evac.gone', { n: gone.length })), h('ul', null, gone.map((d) => h('li', null, fmtT(d.t), ' · ', d.amb, ' → ', hospName(d.dest), ': ', d.items.map((i) => '#' + L.vById(g, i.id).num).join(', '))))));
  }
  function suggestDest(a) {
    const g = S.game; const ids = a.load.map((l) => L.lastTag(L.vById(g, l.id)));
    const want = ids.indexOf('red') >= 0 ? 'H1' : ids.indexOf('yellow') >= 0 ? 'H2' : 'H3';
    if (S.mode === 'eval' || S.mode === 'challenge') return 'H2';
    const hs = g.hosp[want]; return hs && hs.cap - hs.used >= Math.max(1, a.load.length) ? want : 'H2';
  }
  function paneLog(p) {
    const g = S.game;
    p.appendChild(h('h2', null, t('tab.log')));
    const items = g.log.slice().reverse().slice(0, 80).map((e) => h('li', { class: 'log-' + e.type }, h('span', { class: 'mono' }, fmtT(e.t)), h('span', null, logText(e, false))));
    p.appendChild(items.length ? h('ol', { class: 'log' }, items) : h('p', { class: 'muted' }, t('log.empty')));
  }
  function logText(e, reveal) {
    const g = S.game, v = e.id && e.id !== 'ccp' && e.id !== 'pma' ? L.vById(g, e.id) : null, n = v ? v.num : '';
    switch (e.type) {
      case 'safety': return t('log.safety', { list: e.items.length ? e.items.map((k) => t('safety.' + k)).join(', ') : t('log.nothing') });
      case 'walkCall': return t('log.walkCall', { n: e.moved });
      case 'move': return e.id === 'ccp' ? t('log.moveCCP') : t('log.move', { n: n, s: e.cost });
      case 'hotBlocked': return t('log.hot', { n: n });
      case 'check': return t('log.check', { n: n, what: t('chk.' + (e.check === 'rr15' || e.check === 'rr30' ? 'rrShort' : e.check)), r: resultText(v, e.check, e.result) });
      case 'do': return t('log.do', { n: n, what: t('do.' + e.what), r: t(e.what === 'airway' || e.what === 'rescue' ? 'res.' + e.what + '.' + e.result : 'res.' + e.result) });
      case 'tag': return t(e.retag ? 'log.retag' : 'log.tag', { n: n, cat: catName(e.cat) }) + (reveal && e.kind !== 'ok' ? ' — ' + t(e.kind === 'over' ? 'fb.over' : 'fb.under', { cat: catName(e.truth) }) : '');
      case 'load': return t('log.load', { n: n, amb: e.amb });
      case 'dispatch': return t('log.dispatch', { amb: e.amb, h: hospName(e.dest), list: e.items.map((i) => '#' + L.vById(g, i.id).num).join(', ') });
      default: return e.type;
    }
  }

  /* ---------- finalització ---------- */
  function confirmEnd() {
    const g = S.game, c = counts(g);
    modal(t('end.title'), [h('p', null, c.none ? t('end.untriaged', { n: c.none }) : t('end.allTriaged')), h('p', { class: 'muted small' }, t('end.help'))],
      [[t('end.cancel'), null, 'ghost'], [t('end.confirm'), function () { L.act(g, { type: 'end' }, D); finishGame(); }, 'primary', 'b-confirm-end']]);
  }
  function confirmLeave() { modal(t('leave.title'), [h('p', null, t('leave.text'))], [[t('end.cancel'), null, 'ghost'], [t('leave.confirm'), function () { stopTimers(); S.game = null; go('home'); }, 'primary']]); }
  function finishGame() {
    const g = S.game; if (!g) return;
    if (!g.over) L.act(g, { type: 'end' }, D);
    stopTimers();
    S.report = L.evaluate(g);
    S.reportMode = S.mode;
    if (S.mode === 'eval') {
      S.evalDone = true;
      if (!S.sent) { S.sent = true; try { if (W.CampusLink && typeof W.CampusLink.finish === 'function') W.CampusLink.finish(S.report.score10); } catch (e) { /* campus no disponible */ } }
    } else S.newBest = saveBest(S.mode, S.report.score10);
    S.replayT = g.t;
    go('results');
  }

  /* ---------- resultats ---------- */
  function viewResults() {
    const r = S.report, g = S.game, sc = g.sc;
    const wrap = h('div', { class: 'results' });
    const ring = scoreRing(r.score10);
    wrap.appendChild(h('section', { class: 'res-head card' }, ring,
      h('div', { class: 'res-sum' },
        h('p', { class: 'eyebrow' }, t('mode.' + S.reportMode), ' · ', tx(D.SETTINGS[sc.setting].short), ' · ', t('brief.seed'), ' ', h('code', null, sc.seed)),
        h('h1', { id: 'h1', tabindex: '-1' }, t('grade.' + r.grade)),
        h('p', { class: 'lead' }, t('gradeMsg.' + r.grade)),
        S.reportMode === 'eval' ? h('p', { class: 'fb info' }, ic('grad'), ' ', W.CampusLink && W.CampusLink.active ? t('res.evalSent') : t('res.evalLocal')) : S.newBest ? h('p', { class: 'fb ok' }, ic('trophy'), ' ', t('res.newBest')) : null,
        r.deaths ? h('p', { class: 'fb bad' }, t('res.deathPenalty', { n: r.deaths, p: fmtNum(r.deaths * L.DEATH_PENALTY, 2) })) : null)));
    /* xifres */
    wrap.appendChild(h('section', { class: 'tiles' },
      tile('clock', t('res.total'), fmtT(r.totalSec)),
      tile('timer', t('res.median'), r.medianSec === null ? '—' : Math.round(r.medianSec) + ' s'),
      tile('tag', t('res.tagged'), r.tagged + '/' + r.total),
      tile('warn', t('res.under'), String(r.under), r.under ? 'bad' : 'good'),
      tile('plus', t('res.over'), String(r.over), r.over ? 'warn' : 'good'),
      tile('cross', t('res.deaths'), String(r.deaths), r.deaths ? 'bad' : 'good'),
      tile('ambulance', t('res.evacuated'), r.evacuated + '/' + r.total)));
    /* competències */
    const comps = h('section', { class: 'card' }, h('h2', null, t('res.comps')));
    Object.keys(L.WEIGHTS).forEach(function (k) {
      const v = r.comps[k];
      comps.appendChild(h('div', { class: 'comp' }, h('div', { class: 'comp-h' }, h('b', null, t('comp.' + k)), h('span', null, Math.round(v * 100) + ' %'), h('small', { class: 'muted' }, t('res.weight', { w: Math.round(L.WEIGHTS[k] * 100) }))),
        h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(v * 100)), 'aria-label': t('comp.' + k) }, h('i', { class: v >= 0.8 ? 'good' : v >= 0.5 ? 'mid' : 'low', style: 'width:' + Math.round(v * 100) + '%' })),
        h('p', { class: 'muted small' }, t('comp.' + k + 'Desc'))));
    });
    comps.appendChild(h('p', { class: 'muted small' }, t('res.formula')));
    wrap.appendChild(comps);
    /* matriu de confusió */
    const St = D.SETTINGS[sc.setting];
    if (St.lessons) wrap.appendChild(h('section', { class: 'card lessons' }, h('h2', null, ic('grad'), ' ', t('res.lessons')), h('ul', { class: 'list' }, St.lessons.map((x) => h('li', null, tx(x)))), St.sources ? h('p', { class: 'src' }, tx(St.sources)) : null));
    wrap.appendChild(h('section', { class: 'card' }, h('h2', null, t('res.matrix')), h('p', { class: 'muted small' }, t('res.matrixHelp')), confusionTable(r.confusion)));
    /* repetició */
    wrap.appendChild(replaySection());
    /* revisió per víctima */
    wrap.appendChild(h('section', { class: 'card' }, h('h2', null, t('res.review')), reviewTable(r)));
    /* assoliments */
    wrap.appendChild(h('section', { class: 'card' }, h('h2', null, t('res.achievements')), h('ul', { class: 'achs' }, L.ACHIEVEMENTS.map(function (k) {
      const got = r.achievements.indexOf(k) >= 0;
      return h('li', { class: 'ach' + (got ? ' got' : '') }, h('span', { class: 'ach-ic' }, ic(got ? 'award' : 'lock')), h('b', null, t('ach.' + k)), h('small', null, t('ach.' + k + 'D')));
    }))));
    const btns = h('div', { class: 'row end' });
    if (S.reportMode !== 'eval') btns.appendChild(btn(t('res.repeat'), function () { S.mode = S.reportMode; prepare(S.game.sc); }, { cls: 'ghost', icon: 'replay', id: 'b-repeat' }));
    if (S.reportMode === 'practice' || S.reportMode === 'challenge') btns.appendChild(btn(t('res.newScen'), function () { S.mode = S.reportMode; S.setup.seed = ''; go('setup'); }, { cls: 'ghost', icon: 'dice' }));
    btns.appendChild(btn(t('res.menu'), function () { go('home'); }, { cls: 'primary', icon: 'next', id: 'b-menu' }));
    wrap.appendChild(btns);
    wrap.appendChild(footNote());
    return wrap;
  }
  function tile(icn, label, val, cls) { return h('div', { class: 'tile ' + (cls || '') }, ic(icn), h('b', null, val), h('small', null, label)); }
  function scoreRing(score) {
    const R = 52, C = 2 * Math.PI * R, f = Math.max(0, Math.min(1, score / 10));
    return h('div', { class: 'ring', role: 'img', 'aria-label': t('res.scoreAria', { s: fmtNum(score, 1) }) }, A.s('svg', { viewBox: '0 0 120 120' }, [A.s('circle', { cx: 60, cy: 60, r: R, class: 'ring-bg' }), A.s('circle', { cx: 60, cy: 60, r: R, class: 'ring-fg ' + (score >= 7 ? 'good' : score >= 5 ? 'mid' : 'low'), 'stroke-dasharray': C.toFixed(1), 'stroke-dashoffset': (C * (1 - f)).toFixed(1), transform: 'rotate(-90 60 60)' })]),
      h('div', { class: 'ring-t' }, h('b', null, fmtNum(score, 1)), h('small', null, t('res.outOf'))));
  }
  function confusionTable(cm) {
    const cols = ['red', 'yellow', 'green', 'black', 'none'];
    const tbl = h('table', { class: 'cm' });
    tbl.appendChild(h('thead', null, h('tr', null, h('th', { scope: 'col' }, t('res.realVsTag')), cols.map((c) => h('th', { scope: 'col' }, c === 'none' ? t('res.noTag') : h('i', { class: 'chip tape-' + c }, catName(c)))))));
    tbl.appendChild(h('tbody', null, ['red', 'yellow', 'green', 'black'].map(function (rw) {
      return h('tr', null, h('th', { scope: 'row' }, h('i', { class: 'chip tape-' + rw }, catName(rw))), cols.map(function (c) {
        const n = cm[rw][c], k = c === 'none' ? 'miss' : L.errorKind(rw, c);
        return h('td', { class: n ? 'n ' + k : '' }, n ? String(n) : '·');
      }));
    })));
    return h('div', { class: 'tbl-wrap' }, tbl);
  }
  function reviewTable(r) {
    const g = S.game;
    const rows = r.per.slice().sort((a, b) => a.num - b.num).map(function (p) {
      const v = L.vById(g, p.id);
      const out = p.dead ? (p.preventable ? t('rev.diedPrev', { t: fmtT(p.diedAt) }) : t('rev.dead')) : p.evac ? t('rev.evac', { h: hospName(p.evac.dest) }) : t('rev.onScene');
      const why = t((p.ped ? 'whyJ.' : 'why.') + p.firstStep, { rr: v.phys.rr || '' }) + profNote(v) + (p.unseen ? ' ' + (p.foundAt === null ? t('rev.neverFound') : t('rev.found', { t: fmtT(p.foundAt) })) : '');
      return h('tr', { class: 'k-' + (p.kind || 'missed') },
        h('td', null, h('span', { class: 'vnum sm' + (p.firstTag ? ' tape-' + p.firstTag : '') }, String(p.num))),
        h('td', null, h('b', null, who(v)), h('small', null, tx(v.desc))),
        h('td', null, h('i', { class: 'chip tape-' + p.firstTruth }, catName(p.firstTruth)), h('small', null, why)),
        h('td', null, p.firstTag ? h('i', { class: 'chip tape-' + p.firstTag }, catName(p.firstTag)) : '—', p.finalTag && p.finalTag !== p.firstTag ? h('small', null, '→ ' + catName(p.finalTag)) : null, h('small', { class: 'kind' }, t('kind.' + (p.kind || 'missed')))),
        h('td', null, p.timeSpent === null ? '—' : Math.round(p.timeSpent) + ' s'),
        h('td', null, out, p.bleed === 'major' ? h('small', null, p.bleedCtrl ? t('rev.bleedOk') : t('rev.bleedNo')) : null, p.needsAirway ? h('small', null, p.airwayEver ? (p.positioned ? t('rev.airwayOk') : t('rev.airwayNoPos')) : t('rev.airwayNo')) : null, p.deteriorated ? h('small', null, p.retriageOk ? t('rev.retriageOk') : t('rev.retriageNo')) : null));
    });
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'rev' }, h('thead', null, h('tr', null, ['#', t('rev.victim'), t('rev.truth'), t('rev.tag'), t('rev.time'), t('rev.outcome')].map((x) => h('th', { scope: 'col' }, x)))), h('tbody', null, rows)));
  }
  /* repetició sobre el mapa */
  function replaySection() {
    const g = S.game;
    const svg = A.s('svg', { class: 'map replay', viewBox: '0 0 ' + mapW(g.sc) + ' ' + mapH(g.sc), role: 'img', 'aria-label': t('res.replayAria') }, [A.drawMap(D, g.sc.setting)]);
    const routeAll = A.s('polyline', { class: 'route all', points: g.route.map((p) => Math.round(p.x) + ',' + Math.round(p.y)).join(' ') });
    const routeNow = A.s('polyline', { class: 'route now', points: '' });
    svg.appendChild(routeAll); svg.appendChild(routeNow);
    const lay = A.s('g', { class: 'layer-v' }); svg.appendChild(lay);
    const mks = {};
    g.victims.forEach(function (v) { const mk = A.victimMarker(Object.assign({}, v, { x: v.x, y: v.y })); place(mk, v.x, v.y, false); lay.appendChild(mk); mks[v.id] = mk; });
    const rs = A.rescuer(); svg.appendChild(rs);
    const tagEvents = g.log.filter((e) => e.type === 'tag' || e.type === 'dispatch' || e.type === 'walkCall' || (e.type === 'do' && e.ok !== null && e.ok !== undefined) || e.type === 'hotBlocked');
    const list = h('ol', { class: 'tl' });
    const slider = h('input', { type: 'range', min: '0', max: String(g.t), step: '1', value: String(S.replayT), id: 'replay-t', 'aria-label': t('res.replayTime') });
    const clock = h('b', { class: 'mono' }, fmtT(S.replayT));
    function posAt(tt) {
      const r = g.route; let p = r[0];
      for (let i = 1; i < r.length; i++) { if (r[i].t > tt) { const a = r[i - 1], b = r[i]; const dur = b.t - a.t || 1; const startT = b.t - (L.travelSec(L.dist(a, b)) || 1); if (tt <= startT) return a; const f = Math.min(1, (tt - startT) / Math.max(1, b.t - startT)); return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; } p = r[i]; }
      return p;
    }
    function upd(tt) {
      S.replayT = tt; clock.textContent = fmtT(tt);
      const p = posAt(tt); place(rs, p.x, p.y, false);
      routeNow.setAttribute('points', g.route.filter((q) => q.t <= tt).map((q) => Math.round(q.x) + ',' + Math.round(q.y)).concat([Math.round(p.x) + ',' + Math.round(p.y)]).join(' '));
      g.victims.forEach(function (v) {
        const tags = v.st.tags.filter((x) => x.t <= tt); const last = tags[tags.length - 1];
        const cls = ['vm', last ? 'tag-' + last.cat : 'untagged'];
        if (last && last.cat !== last.truth) cls.push('wrong');
        if (v.st.dead && v.st.diedAt <= tt) cls.push('dead');
        if (v.st.evac && v.st.evac.t <= tt) cls.push('gone');
        if (v.bleed === 'major' && !(v.st.bleedCtrl && v.st.interventions.some((i) => (i.what === 'pressure' || i.what === 'tourniquet') && i.res === 'controlled' && i.t <= tt))) cls.push('has-bleed');
        mks[v.id].setAttribute('class', cls.join(' '));
      });
      (list.childNodes ? Array.prototype.slice.call(list.childNodes) : []).forEach(function (li) { const et = Number(li.getAttribute('data-t')); li.setAttribute('class', 'tl-i ' + (li.getAttribute('data-k') || '') + (et <= tt ? ' past' : '')); });
    }
    tagEvents.forEach(function (e) {
      const k = e.ok === true ? 'ok' : e.ok === false ? (e.kind === 'over' ? 'warn' : 'bad') : 'info';
      list.appendChild(h('li', { class: 'tl-i ' + k, 'data-t': String(e.t), 'data-k': k }, h('button', { type: 'button', class: 'tl-b', on: { click: function () { slider.value = String(e.t); upd(e.t); } } }, h('span', { class: 'mono' }, fmtT(e.t)), ic(e.ok === true ? 'check' : e.ok === false ? 'cross' : 'info'), h('span', null, logText(e, true), e.type === 'tag' && e.kind !== 'ok' ? h('small', null, t((L.vById(g, e.id).ped ? 'whyJ.' : 'why.') + e.step, { rr: L.vById(g, e.id).phys.rr || '' })) : null))));
    });
    slider.addEventListener('input', function () { upd(Number(slider.value)); });
    const play = btn(t('res.play'), function () {
      if (S.replayTimer) { W.clearInterval(S.replayTimer); S.replayTimer = null; return; }
      let tt = Number(slider.value); if (tt >= g.t) tt = 0;
      S.replayTimer = W.setInterval(function () { tt = Math.min(g.t, tt + Math.max(5, Math.round(g.t / 240))); slider.value = String(tt); upd(tt); if (tt >= g.t) { W.clearInterval(S.replayTimer); S.replayTimer = null; } }, 60);
    }, { icon: 'play', cls: 'sm', id: 'b-play' });
    const sec = h('section', { class: 'card replay-card' }, h('h2', null, t('res.replay')), h('p', { class: 'muted small' }, t('res.replayHelp')),
      h('div', { class: 'replay-grid' }, h('div', { class: 'replay-map' }, svg, h('div', { class: 'replay-ctl' }, play, slider, clock)), h('div', { class: 'replay-list' }, list)));
    upd(S.replayT);
    return sec;
  }

  /* ---------- targeta ràpida ---------- */
  function viewCards() {
    const C = S.cards;
    const wrap = h('div', { class: 'cards narrow' });
    if (!C) {
      S.cardsSetup = S.cardsSetup || { difficulty: 'normal', kids: false };
      const cs = S.cardsSetup;
      wrap.appendChild(h('h1', { id: 'h1', tabindex: '-1' }, t('mode.cards')));
      wrap.appendChild(h('p', { class: 'lead' }, t('cards.lead')));
      wrap.appendChild(h('div', { class: 'card fs' },
        h('div', { class: 'lbl', id: 'lbl-cd' }, t('setup.difficulty')),
        h('div', { class: 'seg', role: 'radiogroup', 'aria-labelledby': 'lbl-cd' }, L.LEVELS.map((d) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(cs.difficulty === d), class: 'seg-b' + (cs.difficulty === d ? ' on' : ''), on: { click: function () { cs.difficulty = d; go('cards'); } } }, t('diff.' + d) + ' · ' + L.DIFF[d].card + ' s'))),
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: cs.kids, on: { change: function (e) { cs.kids = !!e.target.checked; } } }), h('span', null, t('setup.kids')))));
      wrap.appendChild(h('div', { class: 'row end' }, btn(t('ui.back'), function () { go('home'); }, { cls: 'ghost', icon: 'back' }), btn(t('cards.start'), startCards, { cls: 'primary lg', icon: 'next', id: 'b-cards' })));
      return wrap;
    }
    if (C.i >= C.n) return cardsSummary(wrap);
    const card = C.cur;
    const remain = Math.max(0, C.left);
    wrap.appendChild(h('div', { class: 'cards-top' }, h('span', null, t('cards.progress', { i: C.i + 1, n: C.n })), h('span', { class: 'streak' }, ic('trophy'), ' ', t('cards.streak', { n: C.streak })),
      h('span', { class: 'cd' + (remain <= 3 ? ' low' : ''), id: 'cd', role: 'timer' }, ic('timer'), ' ', h('b', { id: 'cd-n' }, String(Math.ceil(remain))))));
    wrap.appendChild(h('div', { class: 'cbar' }, h('i', { id: 'cbar', style: 'width:' + Math.round(100 * remain / card.limit) + '%' })));
    const p = card.phys;
    const facts = [
      [t('chk.walk'), p.walk ? t('r.walkYes') : t('r.walkNo')],
      [t('chk.breath'), p.br ? t('r.yes') : t('r.no')]
    ];
    if (!p.br) {
      facts.push([t('do.airway'), p.airwayFix ? t('res.airway.breathes') : t('res.airway.noBreath')]);
      if (card.ped && !p.airwayFix) { facts.push([t('chk.pulsePed'), p.radial ? t('r.present') : t('r.absent')]); if (p.radial) facts.push([t('do.rescue'), p.rescueFix ? t('res.rescue.breathes') : t('res.rescue.noBreath')]); }
    } else if (!p.walk) {
      facts.push([t('chk.rrShort'), p.rr + ' /min']);
      facts.push([t(card.ped ? 'chk.pulsePed' : 'chk.radial'), p.radial ? t('r.present') : t('r.absent')]);
      if (!card.ped) facts.push([t('chk.crt'), (p.radial ? p.crt : Math.max(3, p.crt)) + ' s']);
      facts.push(card.ped ? [t('chk.avpu'), t('avpu.' + p.avpu)] : [t('chk.mental'), p.obeys ? t('r.obeys') : t('r.notObeys')]);
    }
    const fig = A.figure({ post: p.walk ? 'stand' : card.post === 'stand' ? 'sit' : card.post, skin: card.look.skin, cloth: card.look.cloth, hair: card.look.hair, ped: card.ped, bleed: card.bleed, site: card.site, pale: !p.radial || p.crt > 2, cyan: !p.br, dead: !p.br && !p.airwayFix && !p.rescueFix, breathing: p.br, rr: p.rr, walking: p.walk, tag: C.answered ? C.answered.chosen : null });
    wrap.appendChild(h('article', { class: 'card vcard' + (C.answered ? ' done' : '') },
      h('div', { class: 'vcard-fig' }, fig),
      h('div', { class: 'vcard-body' }, h('p', { class: 'eyebrow' }, t((card.ped ? 'who.child' : 'who.adult') + card.sex, { age: card.age }), card.ped ? h('span', { class: 'pill ped' }, 'JumpSTART') : null), h('p', { class: 'desc' }, tx(card.desc)),
        h('dl', { class: 'facts2' }, facts.map((f, i) => [h('dt', { style: 'animation-delay:' + (i * 0.08) + 's' }, f[0]), h('dd', { style: 'animation-delay:' + (i * 0.08) + 's' }, f[1])])))));
    if (!C.answered) {
      wrap.appendChild(h('div', { class: 'tape-row big' }, ['red', 'yellow', 'green', 'black'].map((c, i) => h('button', { type: 'button', class: 'tapebtn tape-' + c, id: 'card-' + c, on: { click: function () { answerCard(c); } } }, h('b', null, catName(c)), h('small', null, (i + 1) + ' · ' + t('cat.' + c + 'Sub'))))));
      wrap.appendChild(h('p', { class: 'muted small center' }, t('cards.keys')));
    } else {
      const a = C.answered, k = a.chosen ? L.errorKind(card.truth, a.chosen) : 'timeout';
      wrap.appendChild(h('div', { class: 'fb ' + (k === 'ok' ? 'ok' : k === 'over' ? 'warn' : 'bad'), role: 'status' },
        h('b', null, k === 'ok' ? t('fb.ok') : k === 'timeout' ? t('cards.timeout', { cat: catName(card.truth) }) : k === 'over' ? t('fb.over', { cat: catName(card.truth) }) : t('fb.under', { cat: catName(card.truth) })),
        h('p', null, t((card.ped ? 'whyJ.' : 'why.') + card.step, { rr: p.rr }))));
      wrap.appendChild(startDiagram({ ped: card.ped, path: card.path, result: card.truth }));
      wrap.appendChild(h('div', { class: 'row end' }, btn(C.i + 1 >= C.n ? t('cards.results') : t('cards.next'), nextCard, { cls: 'primary lg', icon: 'next', id: 'b-next' })));
    }
    return wrap;
  }
  function startCards() {
    const cs = S.cardsSetup || { difficulty: 'normal', kids: false };
    const rng = L.seeded(Date.now() ^ Math.floor(Math.random() * 1e9));
    S.cards = { n: 10, i: 0, rng: rng, opts: cs, results: [], streak: 0, cur: null, left: 0, answered: null, timer: null };
    dealCard();
  }
  function dealCard() {
    const C = S.cards; C.cur = L.makeCard(D, C.rng, C.opts); C.left = C.cur.limit; C.answered = null; C.t0 = Date.now();
    go('cards');
    C.timer = W.setInterval(function () {
      if (S.screen !== 'cards' || C.answered) return;
      C.left -= 0.25;
      const n = $('cd-n'), b = $('cbar'), cd = $('cd');
      if (n) n.textContent = String(Math.max(0, Math.ceil(C.left)));
      if (b && b.style) b.style.width = Math.max(0, Math.round(100 * C.left / C.cur.limit)) + '%';
      if (cd && C.left <= 3) cd.classList.add('low');
      if (C.left <= 0) answerCard(null);
    }, 250);
  }
  function answerCard(cat) {
    const C = S.cards; if (!C || C.answered) return;
    if (C.timer) { W.clearInterval(C.timer); C.timer = null; }
    C.answered = { chosen: cat, ms: Date.now() - C.t0 };
    C.results.push({ truth: C.cur.truth, chosen: cat, ms: C.answered.ms });
    const k = cat ? L.errorKind(C.cur.truth, cat) : 'timeout';
    if (k === 'ok') { C.streak += 1; sfx.ok(); } else { C.streak = 0; sfx.bad(); }
    renderAll();
    const b = $('b-next'); if (b && b.focus) b.focus();
  }
  function nextCard() { const C = S.cards; C.i += 1; if (C.i >= C.n) { const sc = L.scoreCards(C.results); C.summary = sc; C.newBest = saveBest('cards', sc.score10); go('cards'); } else dealCard(); }
  function cardsSummary(wrap) {
    const C = S.cards, r = C.summary || L.scoreCards(C.results);
    wrap.appendChild(h('section', { class: 'res-head card' }, scoreRing(r.score10), h('div', { class: 'res-sum' }, h('h1', { id: 'h1', tabindex: '-1' }, t('cards.done')), h('p', { class: 'lead' }, t('cards.summary', { c: r.correct, n: r.total, s: r.bestStreak })), C.newBest ? h('p', { class: 'fb ok' }, ic('trophy'), ' ', t('res.newBest')) : null)));
    wrap.appendChild(h('section', { class: 'tiles' }, tile('check', t('cards.correct'), String(r.correct), 'good'), tile('warn', t('res.under'), String(r.under), r.under ? 'bad' : 'good'), tile('plus', t('res.over'), String(r.over), r.over ? 'warn' : 'good'), tile('timer', t('cards.timeouts'), String(r.timeouts), r.timeouts ? 'warn' : 'good')));
    wrap.appendChild(h('div', { class: 'row end' }, btn(t('cards.again'), startCards, { cls: 'ghost', icon: 'replay', id: 'b-cards-again' }), btn(t('res.menu'), function () { go('home'); }, { cls: 'primary', icon: 'next' })));
    return wrap;
  }

  /* ---------- modal, avisos ---------- */
  function modal(title, body, actions, reuse) {
    const root = $('modal-root'); if (!root) return;
    const open = root.getAttribute('class') === 'open';
    const keepId = reuse && open && doc.activeElement ? doc.activeElement.getAttribute && doc.activeElement.getAttribute('id') : null;
    const prev = reuse && open && S.modalPrev ? S.modalPrev : doc.activeElement;
    S.modalPrev = prev;
    clear(root);
    const close = function () { clear(root); root.setAttribute('class', ''); S.modalPrev = null; if (prev && prev.focus) prev.focus(); };
    const dlg = h('div', { class: 'dlg', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-t', on: { keydown: function (e) { if (e.key === 'Escape') close(); } } },
      h('h2', { id: 'dlg-t' }, title), h('div', { class: 'dlg-b' }, body),
      h('div', { class: 'row end' }, actions.map((a) => btn(a[0], function () { close(); if (a[1]) a[1](); }, { cls: a[2], id: a[3] }))));
    root.appendChild(h('div', { class: 'scrim', on: { click: close } }));
    root.appendChild(dlg); root.setAttribute('class', 'open');
    const again = keepId ? $(keepId) : null;
    if (again && again.focus) again.focus();
    else { const first = dlg.lastChild && dlg.lastChild.lastChild; if (first && first.focus) first.focus(); }
  }
  function openAbout() {
    modal(t('about.title'), [
      h('p', null, t('about.p1')), h('p', null, t('about.p2')),
      h('dl', { class: 'about' }, h('dt', null, t('about.author')), h('dd', null, D.author), h('dt', null, t('about.course')), h('dd', null, t('about.courseV')), h('dt', null, t('about.version')), h('dd', null, D.version)),
      h('h3', null, t('about.keysTitle')), h('ul', { class: 'list small' }, ['about.k1', 'about.k2', 'about.k3', 'about.k4'].map((k) => h('li', null, t(k)))),
      h('p', { class: 'src' }, t('app.sources')), h('p', { class: 'note' }, ic('warn'), h('span', null, t('app.note'))),
      h('p', { class: 'muted small' }, '© 2026 ' + D.author)
    ], [[t('ui.close'), null, 'primary', 'b-about-close']]);
  }
  function toast(msg, kind, ms) {
    const box = $('toasts'); if (!box || !msg) return;
    const el = h('div', { class: 'toast ' + (kind || 'info'), role: kind === 'bad' ? 'alert' : 'status' }, ic(kind === 'ok' ? 'check' : kind === 'bad' ? 'warn' : kind === 'amb' ? 'ambulance' : kind === 'tag' ? 'tag' : 'info'), h('span', null, msg));
    box.appendChild(el);
    while (box.childNodes && box.childNodes.length > 4) box.removeChild(box.firstChild);
    W.setTimeout(function () { el.classList.add('out'); W.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400); }, ms || 3200);
  }

  /* ---------- teclat global ---------- */
  doc.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target && e.target.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (S.screen === 'cards' && S.cards && !S.cards.answered && ['1', '2', '3', '4'].indexOf(e.key) >= 0) { e.preventDefault(); answerCard(['red', 'yellow', 'green', 'black'][Number(e.key) - 1]); }
    else if (S.screen === 'cards' && S.cards && S.cards.answered && e.key === 'Enter' && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); nextCard(); }
  });

  /* ---------- arrencada ---------- */
  applyTheme();
  renderAll();
  /* API per a proves automatitzades (sense efectes en l'ús normal) */
  W.TriageApp = { state: S, go: go, startEval: startEval, pickMode: pickMode, startGame: startGame, finishGame: finishGame, run: run, goTo: goTo, doTag: doTag, doCheck: doCheck, doWalkCall: doWalkCall, renderAll: renderAll, answerCard: answerCard, nextCard: nextCard, startCards: startCards };
})();
