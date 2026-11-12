/* Codi Silenci · motor del joc. Tot el text visible és en català (vegeu content.js). */
(function () {
  'use strict';
  const Q = window.QX, A = window.QX_ANS, FX = window.ESC_FX, sha = window.sha256, XOR = window.QX_XOR;
  const KEY = 'quirofan-silenci-v1';
  const FAIL_PEN = 20, HINT_PEN = 30;
  const NP = Q.proves.length, NT = NP + 1;                     // 6 proves + clau final
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), tray = $('#tray'), logEl = $('#log'), toastEl = $('#toast'), timerEl = $('#timer');

  const qs = new URLSearchParams(location.search);
  const tmin = qs.has('temps') ? parseFloat(qs.get('temps')) : 45;
  const LIMIT = isFinite(tmin) && tmin > 0 ? Math.round(tmin * 60) : 0;   // 0 = compta endavant

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const imgTag = (id, alt) => '<img src="img/' + esc(id) + '.jpg" alt="' + esc(alt || '') + '" loading="lazy">';

  const ICO = {
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
  };

  /* ---------- Estat ---------- */
  function fresh() {
    return { stage: 'intro', name: '', start: 0, end: 0, penalty: 0, checks: 0, fails: 0, hints: 0, sel: {}, done: {}, hu: {}, flag: {}, line: [], sound: false, over: false };
  }
  let S = fresh();
  if (window.CampusAct && CampusAct.fresh) { try { localStorage.removeItem(KEY); } catch (e) { /* res */ } }
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.stage) S = Object.assign(fresh(), r); } catch (e) { /* sense emmagatzematge */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* res */ } }
  let fb = null;                                               // missatge transitori { msg, cls }

  const pidx = () => (/^p\d+$/.test(S.stage) ? parseInt(S.stage.slice(1), 10) - 1 : -1);
  const solvedN = () => Q.proves.filter(p => S.done[p.id]).length + (S.stage === 'done' ? 1 : 0);

  /* ---------- Temps ---------- */
  function elapsed() {
    if (!S.start) return 0;
    return Math.max(0, Math.floor(((S.end || Date.now()) - S.start) / 1000)) + S.penalty;
  }
  const mmss = t => { t = Math.max(0, t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  function tick() {
    const wrap = $('#timer-wrap');
    let txt, over = false;
    if (LIMIT) {
      const rem = LIMIT - elapsed();
      over = rem <= 0 && !!S.start;
      txt = mmss(S.start ? rem : LIMIT);
    } else txt = mmss(elapsed());
    if (timerEl.textContent !== txt) timerEl.textContent = txt;
    wrap.classList.toggle('over', over && S.stage !== 'done');
    if (over && !S.over) { S.over = true; save(); }
  }
  setInterval(tick, 500);

  /* ---------- Ambient: de magenta infectat a blanc quirúrgic ---------- */
  function ambient() {
    const f = Math.min(1, solvedN() / NT);
    const r = document.documentElement.style;
    r.setProperty('--g', (1 - f).toFixed(3));
    r.setProperty('--h', (335 - 163 * f).toFixed(1));
    document.body.classList.toggle('calm', f >= 4 / NT);
  }

  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  const sfx = n => { if (S.sound && FX[n]) FX[n](); };

  /* ---------- Safata ---------- */
  function renderTray() {
    const trays = Q.tray.concat([Q.final.tray]);
    const now = S.stage === 'final' ? NP : pidx();
    let h = '<ol>';
    for (let i = 0; i < NT; i++) {
      const done = i < NP ? !!S.done[Q.proves[i].id] : S.stage === 'done';
      h += '<li class="tslot' + (done ? ' done' : '') + (i === now && !done ? ' now' : '') + '" title="' + (i < NP ? esc(Q.proves[i].titol) : 'Clau final') + '"><span class="k">' + (i + 1) + '</span>' + (done ? imgTag(trays[i], '') : '') + '</li>';
    }
    tray.innerHTML = h + '</ol><div class="pct">' + solvedN() + '/' + NT + '<small>instruments a la safata</small></div>';
  }

  /* ---------- Intro ---------- */
  let skipType = null;
  function viewIntro() {
    const T = Q.texts.intro;
    stage.innerHTML =
      '<section class="ransom"><div class="top"><span>' + esc(T.badge) + '</span><span>ID&nbsp;SILENCI</span></div><div class="in">' +
      '<b class="big-clock gl" aria-hidden="true">' + mmss(LIMIT || 0) + '</b>' +
      '<div class="term" id="term"></div>' +
      '<div class="form-row" id="intro-form" hidden>' +
      '<p class="dim" style="margin:0">' + esc(T.ask) + '</p>' +
      '<div class="field"><label for="in-name">Nom de l’equip</label><input type="text" id="in-name" autocomplete="off" maxlength="40" placeholder="Equip de quiròfan" value="' + esc(S.name) + '"></div>' +
      '<div class="actions"><button type="button" class="btn" data-act="to-brief">Activar mode manual</button></div></div>' +
      '</div></section>';
    const term = $('#term'), form = $('#intro-form');
    const lines = T.lines.slice();
    let i = 0, stopped = false;
    function next() {
      if (stopped) return;
      if (i >= lines.length) { form.hidden = false; return; }
      const p = document.createElement('p'); p.className = 'cursor'; term.appendChild(p);
      skipType = FX.type(p, lines[i++], 14, () => { p.classList.remove('cursor'); setTimeout(next, 220); });
    }
    skipType = null;
    next();
    stage.addEventListener('click', function once(e) {
      if (e.target.closest('button,input')) return;
      stage.removeEventListener('click', once);
      stopped = true;
      if (skipType) skipType();
      term.innerHTML = lines.map(l => '<p>' + esc(l) + '</p>').join('');
      form.hidden = false;
    });
  }

  function viewBrief() {
    const T = Q.texts.brief;
    stage.innerHTML =
      '<section class="ransom"><div class="top"><span>' + esc(T.title) + '</span><span>MODE&nbsp;MANUAL</span></div><div class="in stack">' +
      '<h2 class="prova gl" style="font-size:clamp(1.8rem,5vw,2.8rem)">' + esc(T.title) + '</h2>' +
      T.lines.map(l => '<p class="task">' + l + '</p>').join('') +
      '<div class="actions"><button type="button" class="btn" data-act="begin">Començar la primera prova</button></div></div></section>';
  }

  /* ---------- Proves ---------- */
  function rowHtml(p, r, i) {
    const sel = (S.sel[p.id] || [])[i] || '';
    const flag = S.flag[p.id] === i ? ' flag' : '';
    const opts = '<option value="">Tria…</option>' + r.options.map(o => '<option value="' + esc(o.id) + '"' + (o.id === sel ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    const aria = 'Pregunta ' + (i + 1) + (r.title ? ': ' + r.title : r.prompt ? ': ' + r.prompt : '');
    const select = '<select data-i="' + i + '" aria-label="' + esc(aria) + '" class="' + (sel ? '' : 'empty') + '">' + opts + '</select>';
    const num = '<span class="num">' + (i + 1) + '</span>';
    const fig = r.img ? '<figure>' + imgTag(r.img, '') + '</figure>' : '';
    const words = r.words ? '<div class="words">' + r.words.map(w => '<span>' + esc(w) + '</span>').join('') + '</div>' : '';
    const title = r.title ? '<div class="t">' + esc(r.title) + '</div>' : '';
    const prompt = r.prompt && !(p.layout === 'cards' && !r.title) ? '<div class="' + (r.title || r.words ? 'dim' : 't') + '">' + esc(r.prompt) + '</div>' : '';
    if (p.layout === 'sets') {
      return '<div class="q set' + flag + '" data-row="' + i + '">' + num +
        '<div class="imgs">' + r.imgs.map(m => '<figure>' + imgTag(m.img, m.label) + '<figcaption>' + esc(m.label) + '</figcaption></figure>').join('') + '</div>' +
        '<div style="display:grid;gap:8px">' + prompt + select + '</div></div>';
    }
    if (p.layout === 'rows') {
      return '<div class="q row' + flag + '" data-row="' + i + '">' + num + '<div style="display:grid;gap:8px;min-width:0">' + fig + title + words + prompt + '</div>' + select + '</div>';
    }
    return '<div class="q' + flag + '" data-row="' + i + '">' + num + fig + title + words + prompt + select + '</div>';
  }

  function unlockedHtml(p) {
    const d = decryptProva(p);
    if (!d) return '<p class="fb err">No s’han pogut recuperar les fitxes d’aquesta prova. Reinicieu la partida des de la bitàcola.</p>';
    return '<div class="unlocked"><h3>Fragment recuperat</h3>' +
      '<div class="frag" aria-label="Fragment de la clau">' + d.frag.split('').map((c, k) => '<span style="animation-delay:' + (k * 0.12) + 's">' + esc(c) + '</span>').join('') + '</div>' +
      '<p class="dim" style="margin:0">Guardeu-lo: a la clau final haureu d’ordenar tots els fragments.</p></div>' +
      '<details class="repas" open><summary>Fitxes de repàs (' + d.fitxes.length + ' instruments)</summary><div class="fitxes">' +
      d.fitxes.map(f => '<article class="fitxa"><figure>' + imgTag(f.id, f.nom) + '</figure><div><b>' + esc(f.nom) + '</b><span class="tp">' + esc(f.tipus) + '</span><p>' + esc(f.funcio) + '</p></div></article>').join('') +
      '</div></details>';
  }

  function viewProva() {
    const p = Q.proves[pidx()], solved = !!S.done[p.id];
    const hu = S.hu[p.id] || 0;
    let h = '<div class="stack"><header><h2 class="prova gl"><span class="n">' + esc(p.titol) + ' de ' + NP + '</span><span class="z">' + esc(p.zona) + '</span></h2>' +
      '<blockquote class="quote">' + esc(p.quote) + '</blockquote></header>';
    if (solved) {
      h += unlockedHtml(p) + '<div class="actions"><button type="button" class="btn" data-act="next">' + (pidx() + 1 < NP ? 'Següent prova' : 'Anar a la clau final') + '</button></div></div>';
      stage.innerHTML = h; return;
    }
    h += '<p class="task">' + esc(p.task) + '</p>';
    h += '<div class="' + (p.layout === 'cards' ? 'qgrid' : p.layout === 'sets' ? 'sets' : 'rows') + '" id="qs">' + p.rows.map((r, i) => rowHtml(p, r, i)).join('') + '</div>';
    for (let k = 0; k < hu && k < p.hints.length; k++) h += '<div class="hint-box"><b>Pista ' + (k + 1) + '.</b> ' + esc(p.hints[k]) + '</div>';
    const textLeft = hu < p.hints.length;
    h += '<div class="actions"><button type="button" class="btn" data-act="check">Comprovar</button>' +
      '<button type="button" class="btn ghost" data-act="hint">' + (textLeft ? 'Demanar pista (−' + HINT_PEN + ' s)' : 'Assenyalar una fila errònia (−' + HINT_PEN + ' s)') + '</button></div>' +
      '<p class="fb' + (fb ? ' ' + fb.cls : '') + '" id="fb" role="status">' + (fb ? esc(fb.msg) : '') + '</p></div>';
    stage.innerHTML = h;
  }

  function tokensOf(p) { return p.rows.map((r, i) => (S.sel[p.id] || [])[i] || ''); }
  const cellOk = (p, i, tok) => !!tok && sha(A.salt + '|' + p.id + '|' + i + '|' + tok) === A.cells[p.id][i];
  function decryptProva(p) {
    const t = tokensOf(p);
    if (t.some((x, i) => !cellOk(p, i, x))) return null;
    const txt = XOR.dec(A.enc[p.id], sha(A.salt + '|key|' + p.id + '|' + t.join('|')));
    try { return JSON.parse(txt); } catch (e) { return null; }
  }

  function setFb(msg, cls) {
    fb = { msg: msg, cls: cls };
    const el = $('#fb'); if (el) { el.textContent = msg; el.className = 'fb ' + cls; }
  }

  function penalize(sec, why) {
    S.penalty += sec; save(); tick();
    toast('−' + sec + ' s · ' + why);
  }

  function check() {
    const p = Q.proves[pidx()], t = tokensOf(p);
    const empty = t.filter(x => !x).length;
    if (empty) { sfx('click'); setFb('Falten ' + empty + (empty === 1 ? ' resposta' : ' respostes') + ' per triar. No es resta temps.', 'info'); return; }
    S.checks++;
    const bad = t.map((x, i) => (cellOk(p, i, x) ? -1 : i)).filter(i => i >= 0);
    if (bad.length) {
      S.fails++; sfx('buzz'); penalize(FAIL_PEN, 'comprovació fallida');
      setFb('Hi ha errors a les respostes. Reviseu-les o demaneu una pista.', 'err');
      stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
      return;
    }
    fb = null; S.done[p.id] = true; delete S.flag[p.id]; save();
    sfx('unlock'); ambient(); renderTray(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    FX.confetti($('#fx'), 40);
  }

  function hint() {
    const p = Q.proves[pidx()], hu = S.hu[p.id] || 0;
    if (hu < p.hints.length) { S.hu[p.id] = hu + 1; S.hints++; save(); sfx('click'); penalize(HINT_PEN, 'pista'); fb = null; render(); updHints(); return; }
    const t = tokensOf(p), bad = t.map((x, i) => (cellOk(p, i, x) ? -1 : i)).filter(i => i >= 0);
    if (!bad.length) return;
    S.flag[p.id] = bad[Math.floor(Math.random() * bad.length)]; S.hints++; save();
    sfx('click'); penalize(HINT_PEN, 'pista'); updHints(); render();
    const el = document.querySelector('[data-row="' + S.flag[p.id] + '"]'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setFb('Aquesta fila és errònia o encara no l’heu contestat.', 'info');
  }
  function updHints() { $('#hint-count').textContent = S.hints; }

  /* ---------- Clau final ---------- */
  function fragOf(i) { const d = decryptProva(Q.proves[i]); return d ? d.frag : ''; }
  function viewFinal() {
    const used = S.line;
    let h = '<div class="stack"><header><h2 class="prova gl"><span class="n">Clau final</span><span class="z">' + esc(Q.final.titol) + '</span></h2>' +
      '<blockquote class="quote">' + esc(Q.texts.final.quote) + '</blockquote></header><p class="task">' + esc(Q.texts.final.task) + '</p>' +
      '<div class="line" aria-label="Clau en construcció">' + (used.length ? used.map(k => '<span class="p">' + esc(fragOf(k)) + '</span>').join('') : '<span class="none">Toqueu els fragments perquè apareguin aquí.</span>') + '</div>' +
      '<div class="chips">' + Q.final.order.map(k => '<button type="button" class="chipbtn" data-act="chip" data-k="' + k + '"' + (used.includes(k) ? ' disabled' : '') + '>' + esc(fragOf(k)) + '</button>').join('') + '</div>' +
      '<div class="actions"><button type="button" class="btn ghost sm" data-act="undo"' + (used.length ? '' : ' disabled') + '>Desfer l’últim</button><button type="button" class="btn ghost sm" data-act="clear"' + (used.length ? '' : ' disabled') + '>Esborrar tot</button></div>';
    const hu = S.hu.final || 0;
    for (let k = 0; k < hu && k < Q.final.hints.length; k++) h += '<div class="hint-box"><b>Pista ' + (k + 1) + '.</b> ' + esc(Q.final.hints[k]) + '</div>';
    if (hu < Q.final.hints.length) h += '<div class="actions"><button type="button" class="btn ghost" data-act="fhint">Demanar pista (−' + HINT_PEN + ' s)</button></div>';
    h += '<p class="fb' + (fb ? ' ' + fb.cls : '') + '" id="fb" role="status">' + (fb ? esc(fb.msg) : '') + '</p></div>';
    stage.innerHTML = h;
  }
  function finalCheck() {
    const word = S.line.map(fragOf).join('');
    S.checks++;
    if (sha(A.salt + '|code|final|' + word) === A.final) { S.end = Date.now(); S.stage = 'done'; fb = null; save(); sfx('finale'); FX.siren(false); render(); if (window.CampusAct) CampusAct.finish({ errors: S.fails, hints: S.hints, checks: S.checks }); return; }
    S.fails++; S.line = []; sfx('buzz'); penalize(FAIL_PEN, 'clau incorrecta');
    fb = { msg: 'La clau no és correcta. Els fragments s’han tornat a la safata.', cls: 'err' }; render();
  }

  /* ---------- Final ---------- */
  function summaryText() {
    const t = elapsed();
    return 'Codi Silenci' + (S.name ? ' · ' + S.name : '') + ': temps ' + mmss(t) + (LIMIT ? ' (límit ' + mmss(LIMIT) + ')' : '') + ', ' + S.hints + ' pistes, ' + S.fails + ' errors, ' + S.penalty + ' s de penalització.';
  }
  function viewDone() {
    const T = Q.texts.done, ids = Object.keys(Q.inst);
    const d = i => ' style="--d:' + (0.3 + i * 0.5).toFixed(2) + '"';
    stage.innerHTML = '<section class="done-wrap"><span class="done-status gl">' + esc(T.status) + '</span><h1 class="gl">' + esc(T.title) + '</h1>' +
      '<div class="console"><div class="reveal"' + d(0) + '>' + T.lines.map(l => '<p>' + esc(l) + '</p>').join('') + '</div>' +
      '<div class="st reveal"' + d(3) + '>' + T.screens.map(s => '<span>' + esc(s) + '</span>').join('') + '</div>' +
      '<p class="reveal"' + d(5) + '><b>' + esc(T.closing) + '</b></p></div>' +
      '<div class="summary"><div><b>' + mmss(elapsed()) + '</b><span>Temps' + (LIMIT && elapsed() > LIMIT ? ' (fora de límit)' : '') + '</span></div><div><b>' + S.hints + '</b><span>Pistes</span></div><div><b>' + S.fails + '</b><span>Errors</span></div><div><b>' + S.penalty + ' s</b><span>Penalització</span></div></div>' +
      '<div class="mosaic" aria-label="Safata completa">' + ids.map((id, i) => imgTag(id, Q.inst[id]).replace('<img ', '<img style="--d:' + (1 + i * 0.04).toFixed(2) + '" ')).join('') + '</div>' +
      '<div class="actions" style="justify-content:center;margin-top:26px"><button type="button" class="btn" data-act="copy">Copiar el resum</button><button type="button" class="btn ghost" data-act="restart">Tornar a jugar</button></div>' +
      '</section>';
    FX.confetti($('#fx'), 110);
  }

  /* ---------- Bitàcola ---------- */
  function renderLog() {
    let h = '<h3>Bitàcola</h3><p class="dim" style="margin-top:0">Fragments recuperats i estat de les proves.</p>';
    Q.proves.forEach((p, i) => {
      h += '<div class="item"><span>' + esc(p.titol) + '<br><small class="dim">' + esc(p.zona) + '</small></span><span class="fr">' + (S.done[p.id] ? esc(fragOf(i)) : '—') + '</span></div>';
    });
    h += '<div class="foot"><button type="button" class="btn ghost sm" data-act="restart-log" id="rs">Reiniciar la partida</button><button type="button" class="btn ghost sm" data-act="log">Tancar</button></div>';
    logEl.innerHTML = h;
  }

  /* ---------- Render principal ---------- */
  function render() {
    document.body.dataset.stage = S.stage;
    ambient(); renderTray(); updHints(); tick(); renderLog();
    if (S.stage === 'intro') viewIntro();
    else if (S.stage === 'brief') viewBrief();
    else if (S.stage === 'final') viewFinal();
    else if (S.stage === 'done') viewDone();
    else viewProva();
    stage.classList.remove('shake');
    if (S.stage !== 'done' && S.stage !== 'intro' && S.stage !== 'brief') { if (S.sound && solvedN() === 0) FX.siren(true); else FX.siren(false); } else FX.siren(false);
  }

  /* ---------- Esdeveniments ---------- */
  stage.addEventListener('change', e => {
    const s = e.target.closest('select[data-i]'); if (!s) return;
    const p = Q.proves[pidx()], i = +s.dataset.i;
    S.sel[p.id] = S.sel[p.id] || []; S.sel[p.id][i] = s.value;
    if (S.flag[p.id] === i) { delete S.flag[p.id]; s.closest('.q').classList.remove('flag'); }
    s.classList.toggle('empty', !s.value); if (fb) { fb = null; const f = $('#fb'); if (f) { f.textContent = ''; f.className = 'fb'; } } save(); sfx('click');
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'log') { const o = !logEl.classList.contains('open'); logEl.classList.toggle('open', o); $('#btn-log').setAttribute('aria-expanded', o); if (o) renderLog(); return; }
    if (a === 'sound') { S.sound = !S.sound; FX.set(S.sound); b.setAttribute('aria-pressed', S.sound); b.innerHTML = S.sound ? ICO.on : ICO.off; save(); if (S.sound) { FX.click(); if (/^p/.test(S.stage) && solvedN() === 0) FX.siren(true); } return; }
    if (a === 'to-brief') { S.name = ($('#in-name').value || '').trim(); S.stage = 'brief'; save(); sfx('click'); render(); return; }
    if (a === 'begin') { S.stage = 'p1'; S.start = Date.now(); if (window.CampusAct) CampusAct.begin(); save(); sfx('unlock'); render(); return; }
    if (a === 'check') return check();
    if (a === 'hint') return hint();
    if (a === 'next') { fb = null; S.stage = pidx() + 1 < NP ? 'p' + (pidx() + 2) : 'final'; save(); sfx('click'); render(); window.scrollTo({ top: 0 }); return; }
    if (a === 'chip') { S.line.push(+b.dataset.k); save(); sfx('tick'); render(); if (S.line.length === NP) finalCheck(); return; }
    if (a === 'undo') { S.line.pop(); save(); render(); return; }
    if (a === 'clear') { S.line = []; save(); render(); return; }
    if (a === 'fhint') { S.hu.final = (S.hu.final || 0) + 1; S.hints++; save(); penalize(HINT_PEN, 'pista'); render(); return; }
    if (a === 'copy') { const t = summaryText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Resum copiat'), () => toast(t)); return; }
    if (a === 'restart-log') {
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Segur? Torneu a clicar'; return; }
    }
    if (a === 'restart' || a === 'restart-log') {
      const snd = S.sound; S = fresh(); S.sound = snd; fb = null; save(); logEl.classList.remove('open');
      $('#btn-log').setAttribute('aria-expanded', 'false'); FX.siren(false); FX.rearm(); render(); window.scrollTo({ top: 0 });
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { logEl.classList.remove('open'); $('#btn-log').setAttribute('aria-expanded', 'false'); }
    if (e.key === 'Enter' && e.target.id === 'in-name') { e.preventDefault(); const b = document.querySelector('[data-act="to-brief"]'); if (b) b.click(); }
  });

  /* ---------- Inici ---------- */
  $('#btn-log').innerHTML = ICO.log;
  $('#btn-sound').innerHTML = S.sound ? ICO.on : ICO.off;
  $('#btn-sound').setAttribute('aria-pressed', S.sound);
  FX.set(S.sound);
  if (S.stage === 'p0') S.stage = 'p1';
  render();
})();
