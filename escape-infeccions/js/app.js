/* Escape room: infeccions. Motor del joc (tot al navegador; no s'envia res a cap servidor). */
(function () {
  'use strict';

  const C = window.ESC_CONTENT, A = window.ESC_ANS, FX = window.ESC_FX, sha = window.sha256;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const KEY = 'escape-infeccions-v1';
  const PIDS = C.proves.map(p => p.id);
  const ORDER = ['intro', 'brief'].concat(PIDS, ['final', 'done']);
  const TOTAL = PIDS.length + 1; // sis proves + activació
  const params = new URLSearchParams(location.search);
  const LIMIT = (parseInt(params.get('temps'), 10) || 0) * 60000; // ?temps=40 → compte enrere de 40 min

  /* ---------- Estat i persistència ---------- */
  const fresh = () => ({ stage: 'intro', name: '', start: 0, end: 0, codes: {}, hints: {}, checks: 0, sel: {}, marks: {}, sound: false });
  let S = load();
  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && ORDER.indexOf(o.stage) !== -1) return Object.assign(fresh(), o);
    } catch (e) { /* sense emmagatzematge */ }
    return fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignorar */ } }

  /* ---------- Comprovacions (hash) ---------- */
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cellOk = (pid, i, tok) => sha(A.salt + '|' + pid + '|' + i + '|' + tok) === A.cells[pid][i];
  const codeOk = (pid, code) => sha(A.salt + '|code|' + pid + '|' + norm(code)) === A.codes[pid];

  /* ---------- Utilitats ---------- */
  const pr = pid => C.proves.find(p => p.id === pid);
  const idx = () => ORDER.indexOf(S.stage);
  const solvedCount = () => PIDS.filter(p => S.codes[p]).length + (S.stage === 'done' ? 1 : 0);
  const hintTotal = () => Object.keys(S.hints).reduce((n, k) => n + S.hints[k], 0);
  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    const p = n => String(n).padStart(2, '0');
    return (h ? h + ':' : '') + p(m) + ':' + p(x);
  }
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
  }
  const hl = (label, mark) => {
    const i = label.toLowerCase().indexOf(mark.toLowerCase());
    return i < 0 ? esc(label) : esc(label.slice(0, i)) + '<em>' + esc(label[i]) + '</em>' + esc(label.slice(i + 1));
  };
  const tiles = (code, opts) => {
    opts = opts || {};
    return '<span class="tiles' + (opts.big ? ' big' : '') + '">' + String(code).split('').map((ch, i) =>
      opts.pid
        ? '<button type="button" class="tile" data-act="mark" data-p="' + opts.pid + '" data-i="' + i + '" aria-pressed="' + ((S.marks[opts.pid] || []).indexOf(i) !== -1) + '" aria-label="Lletra ' + (i + 1) + ': ' + esc(ch) + '">' + esc(ch) + '<i>' + (i + 1) + '</i></button>'
        : '<span class="tile" style="--i:' + i + '">' + esc(ch) + '<i>' + (i + 1) + '</i></span>').join('') + '</span>';
  };

  const ICON = {
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
    on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>'
  };

  /* ---------- Cromat: botons, mesurador, to d'ambient ---------- */
  function chrome() {
    document.body.dataset.stage = S.stage.indexOf('p') === 0 && S.stage.length === 2 ? 'prova' : S.stage;
    document.body.dataset.clear = S.stage === 'done' ? '1' : '0';
    const n = solvedCount();
    document.documentElement.style.setProperty('--h', S.stage === 'done' ? 150 : (4 + 146 * (n / TOTAL) * 0.92).toFixed(1));
    $('#hint-count').textContent = hintTotal();
    $('#btn-log').innerHTML = ICON.log;
    $('#btn-sound').innerHTML = FX.on ? ICON.on : ICON.off;
    $('#btn-sound').setAttribute('aria-pressed', String(FX.on));
    $('#btn-sound').title = FX.on ? 'So activat' : 'So desactivat';
    const cur = S.stage === 'final' ? 'final' : S.stage;
    const names = PIDS.map((p, i) => ({ k: p, n: String(i + 1) })).concat([{ k: 'final', n: '★' }]);
    $('#gauge').innerHTML = '<ol>' + names.map(o => {
      const done = o.k === 'final' ? S.stage === 'done' : !!S.codes[o.k];
      return '<li class="' + (done ? 'done' : (o.k === cur ? 'now' : '')) + '"><span class="seg"></span><span class="n">' + o.n + '</span></li>';
    }).join('') + '</ol><div class="pct">' + Math.round(n / TOTAL * 100) + ' %<small>descontaminació</small></div>';
  }

  /* ---------- Plantilles ---------- */
  function tplIntro() {
    return '<div class="alarm-card"><div class="tape"></div><div class="in">' +
      '<div class="badge"><svg width="26" height="26" aria-hidden="true"><use href="#bio"/></svg><span>' + esc(C.intro.badge) + '</span></div>' +
      '<div class="term" id="term" title="Clica per saltar l’animació"></div>' +
      '<form id="f-intro" class="form-row" autocomplete="off" hidden>' +
      '<div class="field"><label for="in-name">Equip o nom (opcional)</label><input type="text" id="in-name" maxlength="40" value="' + esc(S.name) + '" autocomplete="off"></div>' +
      '<div class="field"><label for="in-code">Codi segur de verificació</label><input type="text" class="code" id="in-code" maxlength="24" autocapitalize="characters" autocomplete="off" spellcheck="false"><div class="hint">' + esc(C.rules.note) + '</div></div>' +
      '<div class="actions"><button class="btn" type="submit">Verificar</button></div></form>' +
      '</div></div>';
  }
  function tplBrief() {
    return '<div class="alarm-card"><div class="tape"></div><div class="in stack">' +
      '<h1 class="big">' + esc(C.brief.title) + '</h1>' +
      '<p><b>' + esc(C.brief.lead) + '</b></p>' + C.brief.lines.map(l => '<p>' + l + '</p>').join('') +
      '<div class="actions"><button class="btn" type="button" data-act="begin">Començar la 1a prova</button></div></div></div>';
  }

  function ensureSel(p) {
    if (S.sel[p.id]) return S.sel[p.id];
    const n = p.type === 'order' ? p.items.length : p.type === 'grid' ? p.patients.length * p.antibiotics.length : p.rows.length;
    S.sel[p.id] = new Array(n).fill(p.type === 'grid' ? '0' : '');
    return S.sel[p.id];
  }

  function puzzleHTML(p) {
    const sel = ensureSel(p);
    if (p.type === 'order') {
      const placed = sel.filter(Boolean);
      return '<div class="order"><ol class="slots" style="list-style:none;margin:0;padding:0">' + sel.map((id, i) => {
        const it = p.items.find(x => x.id === id);
        return '<li class="slot' + (it ? ' filled' : '') + '"><span class="k">' + (i + 1) + '</span>' +
          (it ? '<button type="button" data-act="order-clear" data-i="' + i + '" title="Treure">' + hl(it.label, it.mark) + '</button>' : '<span class="empty">Buit</span>') + '</li>';
      }).join('') + '</ol>' +
        '<div class="pool" role="group" aria-label="Eslabons disponibles">' + p.items.filter(it => placed.indexOf(it.id) === -1).map(it =>
          '<button type="button" class="token" data-act="order-pick" data-id="' + it.id + '">' + hl(it.label, it.mark) + '</button>').join('') + '</div></div>';
    }
    if (p.type === 'grid') {
      const nA = p.antibiotics.length;
      return '<ul class="steps">' + p.steps.map(s => '<li><b>' + esc(s.t) + '</b><span>' + esc(s.d) + '</span></li>').join('') + '</ul>' +
        '<ul class="ltr" aria-label="Lletra de cada antibiòtic">' + p.letterRule.map(r => '<li>' + esc(r[0]) + ' <b>' + esc(r[1]) + '</b></li>').join('') + '</ul>' +
        '<div class="tablewrap"><table class="abg"><thead><tr><th></th>' + p.antibiotics.map(a => '<th scope="col">' + esc(a) + '</th>').join('') + '</tr></thead><tbody>' +
        p.patients.map((pt, pi) => '<tr><th scope="row">' + esc(pt.name) + '</th>' + p.antibiotics.map((a, ai) => {
          const i = pi * nA + ai, on = sel[i] === '1';
          return '<td><button type="button" class="cell" data-act="cell" data-i="' + i + '" aria-pressed="' + on + '" aria-label="' + esc(pt.name + ', ' + a + ': ' + (pt.res[ai] === 'S' ? 'sensible' : 'resistent') + (on ? ', triat' : '')) + '">' + pt.res[ai] + '</button></td>';
        }).join('') + '</tr>').join('') + '</tbody></table></div>';
    }
    // select
    let legend = '';
    if (p.legend) {
      legend = '<ul class="legend" aria-label="Vies de transmissió">' + p.legend.map(l => '<li>' + esc(l[0].slice(0, l[1])) + '<b>' + esc(l[0][l[1]]) + '</b>' + esc(l[0].slice(l[1] + 1)) + '</li>').join('') + '</ul><p class="dim" style="margin:0">' + esc(p.legendNote) + '</p>';
    }
    return legend + '<div class="rows">' + p.rows.map((r, i) =>
      '<div class="row"><span class="num">' + (i + 1) + '</span><div class="t">' + esc(r.title) +
      (r.sub ? '<span class="sub">' + r.sub + '</span>' : '') +
      (r.bullets ? '<ul>' + r.bullets.map(b => '<li>' + esc(b) + '</li>').join('') + '</ul>' : '') + '</div>' +
      '<select data-act="sel" data-i="' + i + '" class="' + (sel[i] ? '' : 'empty') + '" aria-label="' + esc(p.prompt + ': ' + r.title) + '"><option value="">' + esc(p.prompt) + '…</option>' +
      p.options.map(o => '<option value="' + o.id + '"' + (sel[i] === o.id ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>' +
      (r.rule ? '<span class="rule">' + esc(r.rule) + '</span>' : '') + '</div>').join('') + '</div>';
  }

  function hintsHTML(pid, list) {
    const n = S.hints[pid] || 0;
    return list.slice(0, n).map((h, i) => '<div class="hint-box"><b>Pista ' + (i + 1) + '.</b> ' + esc(h) + '</div>').join('');
  }
  function actionsHTML(pid, list, withCheck) {
    const n = S.hints[pid] || 0;
    return '<div class="actions">' + (withCheck ? '<button type="button" class="btn ghost" data-act="check">Comprovar respostes</button>' : '') +
      '<button type="button" class="btn ghost" data-act="hint" ' + (n >= list.length ? 'disabled' : '') + '>' + (n >= list.length ? 'Sense més pistes' : 'Demanar pista (' + (list.length - n) + ')') + '</button></div>';
  }
  function codeFormHTML(label) {
    return '<form id="f-code" class="codebox" autocomplete="off"><label class="lab" for="in-code">' + esc(label) + '</label>' +
      '<div class="codeline"><input type="text" class="code" id="in-code" maxlength="24" autocapitalize="characters" autocomplete="off" spellcheck="false">' +
      '<button class="btn" type="submit">Desbloquejar</button></div><div class="fb" id="fb" role="status"></div></form>';
  }

  function tplProve(p) {
    const i = PIDS.indexOf(p.id), solved = S.codes[p.id], next = i === PIDS.length - 1 ? 'final' : PIDS[i + 1];
    let h = '<div class="stack"><header><h2 class="prova">' + esc(p.title) + '</h2><p class="quote">' + esc(p.quote) + '</p></header>';
    if (solved) {
      h += '<section class="unlocked"><h3>Mòdul desbloquejat</h3><div>' + tiles(solved, { big: true }) + '</div>' +
        '<div class="actions"><button type="button" class="btn" data-act="next">' + (next === 'final' ? 'Activar el sistema' : 'Següent prova') + '</button></div></section>';
    }
    h += '<section class="panel stack"' + (solved ? ' inert style="opacity:.55"' : '') + '><p class="task">' + esc(p.task) + '</p>' +
      (p.pista ? '<span class="pista-line">Pista: ' + esc(p.pista) + '</span>' : '') +
      '<div id="puzzle" class="stack">' + puzzleHTML(p) + '</div></section>';
    if (!solved) {
      h += '<div id="hints" class="stack">' + hintsHTML(p.id, p.hints) + '</div><div id="act">' + actionsHTML(p.id, p.hints, true) + '</div><div class="fb info" id="fb2" role="status"></div>' +
        codeFormHTML('Paraula clau de la ' + p.title.toLowerCase());
    }
    return h + '</div>';
  }

  function runs(arr) { // agrupa índexs consecutius: [1,3,4] → [[1],[3,4]]
    const out = [];
    arr.slice().sort((a, b) => a - b).forEach(x => {
      const l = out[out.length - 1];
      if (l && l[l.length - 1] === x - 1) l.push(x); else out.push([x]);
    });
    return out;
  }
  function trayHTML() {
    const frags = [];
    C.final.rules.forEach(r => {
      const code = S.codes[r.p] || '';
      runs(S.marks[r.p] || []).forEach(g => frags.push(g.map(i => code[i] || '?').join('')));
    });
    return frags.length ? frags.map(f => '<span class="frag">' + esc(f) + '</span>').join('') : '<span class="none">Marca les lletres de les paraules clau segons cada regla.</span>';
  }
  function tplFinal() {
    const f = C.final;
    return '<div class="stack"><header><h2 class="prova">' + esc(f.title) + '</h2><p class="quote">' + esc(f.lead) + '</p></header>' +
      '<section class="panel stack"><p class="task">' + esc(f.pista) + '</p>' +
      '<div class="fin-rules">' + f.rules.map((r, i) =>
        '<div class="fin-row"><span class="lt">' + (i + 1) + 'a prova</span>' + tiles(S.codes[r.p] || '', { pid: r.p }) + '<span class="rl">' + esc(r.text) + '</span></div>').join('') + '</div>' +
      '<div><p class="dim" style="margin:0 0 8px">Fragments que has marcat</p><div class="tray" id="tray">' + trayHTML() + '</div></div></section>' +
      '<div id="hints" class="stack">' + hintsHTML('final', f.hints) + '</div><div id="act">' + actionsHTML('final', f.hints, false) + '</div>' +
      codeFormHTML('Codi d’activació') + '</div>';
  }

  function summaryText() {
    const t = (S.end || Date.now()) - S.start;
    return 'Escape room infeccions' + (S.name ? ' · ' + S.name : '') + ': temps ' + fmt(t) + ', pistes ' + hintTotal() + ', comprovacions ' + S.checks + '.';
  }
  function tplDone() {
    const d = C.done, t = (S.end || Date.now()) - S.start;
    let k = 0; const dl = () => (0.5 + (k++) * 0.45).toFixed(2);
    return '<div class="done-wrap stack"><div class="reveal">' +
      '<div class="done-status" style="--d:' + dl() + '"><svg width="22" height="22" aria-hidden="true"><use href="#bio"/></svg>' + esc(d.status) + '</div>' +
      '<h1 style="--d:' + dl() + '">' + esc(d.title) + '</h1></div>' +
      '<div class="console reveal"><p style="--d:' + dl() + '"><i>' + esc(d.online) + '</i></p>' +
      d.lines.map(l => '<p style="--d:' + dl() + '">' + esc(l) + '</p>').join('') +
      '<div class="st">' + d.screens.map(s => '<span style="--d:' + dl() + '">“' + esc(s) + '”</span>').join('') + '</div>' +
      d.outro.map(l => '<p style="--d:' + dl() + '"><b>' + esc(l) + '</b></p>').join('') +
      '<p style="--d:' + dl() + '">✅ ' + esc(d.closing) + '</p></div>' +
      '<div class="summary reveal" style="--d:' + dl() + '"><div><b>' + fmt(t) + '</b><span>Temps</span></div><div><b>' + hintTotal() + '</b><span>Pistes</span></div><div><b>' + S.checks + '</b><span>Comprovacions</span></div>' + (S.name ? '<div><b style="font-size:1.4rem">' + esc(S.name) + '</b><span>Equip</span></div>' : '') + '</div>' +
      '<div class="actions reveal" style="justify-content:center;--d:' + dl() + '"><button type="button" class="btn" data-act="copy">Copiar resum</button><button type="button" class="btn ghost" data-act="restart">Tornar a jugar</button></div></div>';
  }

  /* ---------- Render ---------- */
  let skipTyping = null;
  function render(focus) {
    FX.siren(false);
    chrome();
    const st = $('#stage');
    if (S.stage === 'intro') st.innerHTML = tplIntro();
    else if (S.stage === 'brief') st.innerHTML = tplBrief();
    else if (S.stage === 'final') st.innerHTML = tplFinal();
    else if (S.stage === 'done') st.innerHTML = tplDone();
    else st.innerHTML = tplProve(pr(S.stage));
    st.style.animation = 'none'; void st.offsetWidth; st.style.animation = '';
    if (S.stage === 'intro') { startTyping(); if (FX.on) FX.siren(true); }
    if (S.stage === 'brief' && FX.on) FX.siren(true);
    if (S.stage === 'done') {
      setTimeout(() => { FX.confetti($('#fx'), 90); }, 1600);
      steam();
    } else { const sm = $('.steam'); if (sm) sm.remove(); }
    renderLog();
    if (focus) { window.scrollTo(0, 0); st.focus({ preventScroll: true }); }
  }
  function steam() {
    if ($('.steam')) return;
    const s = document.createElement('div'); s.className = 'steam'; s.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 9; i++) {
      const p = document.createElement('i');
      p.style.left = (i * 12 - 4) + '%'; p.style.animationDelay = (i * 0.7) + 's'; p.style.animationDuration = (6 + (i % 3)) + 's';
      s.appendChild(p);
    }
    document.body.appendChild(s);
  }
  function startTyping() {
    const term = $('#term'), form = $('#f-intro');
    const lines = C.intro.lines.concat([C.intro.ask]);
    let i = 0, cancelled = false;
    const show = () => { form.hidden = false; const n = $('#in-name'); if (n && !n.value) n.focus({ preventScroll: true }); };
    function next() {
      if (cancelled) return;
      $$('.cursor', term).forEach(e => e.classList.remove('cursor'));
      if (i >= lines.length) { show(); return; }
      const p = document.createElement('p'); p.className = 'cursor'; term.appendChild(p);
      const line = lines[i++];
      skipTyping = FX.type(p, line, 13, () => setTimeout(next, 220));
    }
    term.onclick = () => {
      if (cancelled) return;
      cancelled = true; if (skipTyping) skipTyping();
      term.innerHTML = lines.map(l => '<p>' + esc(l) + '</p>').join(''); show();
    };
    next();
  }

  function renderLog() {
    const el = $('#log');
    el.innerHTML = '<h3>Bitàcola</h3><p class="dim" style="margin:0 0 6px">Paraules clau desbloquejades.</p>' +
      PIDS.map(id => '<div class="item"><div class="h">' + esc(pr(id).title) + '<span>' + (S.codes[id] ? S.codes[id].length + ' lletres' : 'pendent') + '</span></div>' +
        (S.codes[id] ? tiles(S.codes[id]) : '<span class="dim">—</span>') + '</div>').join('') +
      '<div class="foot"><button type="button" class="btn ghost sm" data-act="log">Tancar</button><button type="button" class="btn ghost sm" data-act="restart">Reiniciar l’escape room</button></div>';
  }
  function setLog(open) {
    const el = $('#log'); el.classList.toggle('open', open);
    $('#btn-log').setAttribute('aria-expanded', String(open));
    if (open) { const b = $('button', el); if (b) b.focus({ preventScroll: true }); }
  }

  /* ---------- Accions ---------- */
  function go(stage) { S.stage = stage; save(); render(true); }
  function updatePuzzle(p) { $('#puzzle').innerHTML = puzzleHTML(p); }
  function setFb(el, text, cls) { if (!el) return; el.className = 'fb ' + (cls || ''); el.textContent = text; }

  function check() {
    const p = pr(S.stage), sel = ensureSel(p), fb = $('#fb2');
    S.checks++;
    let ok = 0, total = A.cells[p.id].length, wrong = 0;
    if (p.type === 'grid') {
      let expected = 0;
      sel.forEach((tok, i) => {
        const should = cellOk(p.id, i, '1');
        if (should) expected++;
        if (tok === '1' && should) ok++;
        if (tok === '1' && !should) wrong++;
      });
      total = expected;
      if (ok === total && !wrong) setFb(fb, 'Tots els antibiòtics són correctes. Ara extreu la paraula clau.', 'ok');
      else setFb(fb, ok + ' de ' + total + ' antibiòtics ben triats' + (wrong ? ' i ' + wrong + ' de més.' : '.'), 'info');
    } else {
      sel.forEach((tok, i) => { if (tok && cellOk(p.id, i, tok)) ok++; });
      if (ok === total) setFb(fb, 'Totes les respostes són correctes. Ara extreu la paraula clau.', 'ok');
      else setFb(fb, ok + ' de ' + total + ' respostes correctes.', 'info');
    }
    save();
    ok === total && !wrong ? FX.ok() : FX.tick();
  }
  function hint() {
    const id = S.stage, list = id === 'final' ? C.final.hints : pr(id).hints, n = S.hints[id] || 0;
    if (n >= list.length) return;
    S.hints[id] = n + 1; save();
    $('#hints').innerHTML = hintsHTML(id, list);
    $('#act').innerHTML = actionsHTML(id, list, id !== 'final');
    $('#hint-count').textContent = hintTotal();
    FX.tick();
  }
  function wrongCode(msg) {
    const f = $('#f-code'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
    setFb($('#fb'), msg, 'err'); FX.buzz();
    const inp = $('#in-code'); inp.select();
  }
  function submitCode(e) {
    e.preventDefault();
    const val = norm($('#in-code').value);
    if (!val) { wrongCode('Escriu la paraula clau.'); return; }
    if (S.stage === 'final') {
      if (codeOk('final', val)) { S.end = Date.now(); S.stage = 'done'; save(); render(true); FX.finale(); }
      else wrongCode('Codi d’activació incorrecte. Revisa els fragments i l’ordre.');
      return;
    }
    if (codeOk(S.stage, val)) { S.codes[S.stage] = val; save(); render(false); FX.unlock(); const u = $('.unlocked'); if (u) u.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    else wrongCode('Paraula clau incorrecta. Revisa les respostes i la regla de lletres.');
  }

  const actions = {
    begin() { if (!S.start) S.start = Date.now(); FX.click(); go('p1'); },
    next() { const i = idx(); FX.click(); go(ORDER[i + 1]); },
    check, hint,
    sound() {
      FX.set(!FX.on); S.sound = FX.on; save(); chrome();
      if (FX.on) { FX.click(); if (S.stage === 'intro' || S.stage === 'brief') FX.siren(true); }
    },
    log() { setLog(!$('#log').classList.contains('open')); },
    'order-pick'(el) {
      const p = pr('p1'), sel = ensureSel(p), i = sel.indexOf('');
      if (i === -1) return;
      sel[i] = el.dataset.id; save(); FX.click(); updatePuzzle(p);
    },
    'order-clear'(el) { const p = pr('p1'); ensureSel(p)[+el.dataset.i] = ''; save(); FX.click(); updatePuzzle(p); },
    cell(el) {
      const p = pr(S.stage), sel = ensureSel(p), i = +el.dataset.i;
      sel[i] = sel[i] === '1' ? '0' : '1'; save(); FX.click();
      el.setAttribute('aria-pressed', String(sel[i] === '1'));
    },
    mark(el) {
      const p = el.dataset.p, i = +el.dataset.i, m = S.marks[p] = S.marks[p] || [], k = m.indexOf(i);
      if (k === -1) m.push(i); else m.splice(k, 1);
      save(); FX.click();
      el.setAttribute('aria-pressed', String(k === -1));
      $('#tray').innerHTML = trayHTML();
    },
    copy() {
      const t = summaryText();
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Resum copiat.'), () => toast(t));
    },
    restart() {
      if (!window.confirm('Vols reiniciar l’escape room? Es perdrà tot el progrés d’aquest navegador.')) return;
      const snd = S.sound; S = fresh(); S.sound = snd; save(); setLog(false); render(true);
    }
  };

  function bind() {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || el.tagName === 'SELECT') return;
      const fn = actions[el.dataset.act]; if (fn) fn(el);
    });
    document.addEventListener('change', e => {
      const el = e.target;
      if (el.matches && el.matches('select[data-act="sel"]')) {
        const p = pr(S.stage); ensureSel(p)[+el.dataset.i] = el.value; el.classList.toggle('empty', !el.value); save(); FX.tick();
      }
    });
    document.addEventListener('submit', e => {
      if (e.target.id === 'f-intro') {
        e.preventDefault();
        S.name = $('#in-name').value.trim().slice(0, 40); save();
        const card = $('.alarm-card'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        FX.buzz();
        const inp = $('#in-code');
        inp.style.borderColor = 'var(--bad)';
        setTimeout(() => go('brief'), 750);
      } else if (e.target.id === 'f-code') submitCode(e);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#log').classList.contains('open')) { setLog(false); $('#btn-log').focus(); } });
  }

  /* ---------- Temporitzador ---------- */
  let overShown = false;
  function tick() {
    const w = $('#timer'), box = $('#timer-wrap');
    if (!S.start) { w.textContent = LIMIT ? fmt(LIMIT) : '00:00'; return; }
    const el = (S.end || Date.now()) - S.start;
    if (LIMIT) {
      const rem = LIMIT - el;
      w.textContent = fmt(rem);
      box.classList.toggle('over', rem <= 0);
      if (rem <= 0 && !overShown && !S.end) { overShown = true; toast('S’ha esgotat el temps. Podeu continuar, però la contaminació avança.'); FX.buzz(); }
    } else w.textContent = fmt(el);
  }

  function init() {
    FX.set(false);
    bind();
    if (S.stage !== 'intro' && S.stage !== 'brief' && !S.start) S.start = Date.now();
    render(false);
    tick(); setInterval(tick, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
