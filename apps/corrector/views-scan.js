/* ============================================================
   Corrector de tests · pestaña «Escanear»: cámara en vivo con superposición, fotos/galería,
   revisión de incidencias y modo lote. Todo el procesado ocurre en el navegador.
   ============================================================ */
(() => {
  'use strict';
  const C = window.CORR, K = window.AppKit, esc = K.esc, R = C.roster, O = C.omr;
  const X = () => C.ctx, T = (k, p) => K.t(k, p);
  const $ = (s, r = document) => r.querySelector(s);
  const store = K.storage('corrector');
  const S = { live: false, stream: null, video: null, raf: 0, busy: false, paused: false, last: null, stable: 0, sig: '', cool: false, lost: 0, lastScan: 0, log: [], bad: 0, torch: false, work: null, audio: null, msg: '',
    opts: Object.assign({ auto: true, sound: true, vib: true, overlay: true }, store.get('scanopts', {})) };
  const saveOpts = () => store.set('scanopts', S.opts);
  const COL = { ok: '74,222,128', bad: '248,113,113', warn: '245,184,46', info: '176,139,224' };

  /* ---------- interpretación de un resultado del OMR ---------- */
  const gOf = () => C.hoja.layoutOf(X().exam);
  function interpret(res, img) {
    const x = X(), e = x.exam, nq = e.nq;
    const rec = { res, img, answers: res.q.slice(0, nq).map(q => (q.st === 'ok' || q.st === 'doubt') ? q.a : ''), fixed: Array(nq).fill(false), version: res.version || '', student: null, cands: [], code: res.code, newName: null, ts: Date.now() };
    rec.checkFail = !!(res.code && e.codeCheck && !R.validCode(res.code, e.codeLen, true));
    if (e.versions.length > 1 && !e.versions.includes(rec.version)) rec.version = '';
    if (e.versions.length === 1) rec.version = e.versions[0];
    lookup(rec); return rec;
  }
  function lookup(rec) {
    const e = X().exam; rec.cands = rec.code ? e.students.filter(s => s.code === rec.code) : [];
    rec.student = rec.cands.length === 1 && !rec.checkFail ? rec.cands[0] : (rec.student && e.students.includes(rec.student) && !rec.autoStudent ? rec.student : null);
    rec.autoStudent = !!(rec.student && rec.cands.length === 1);
  }
  const ver = (rec) => (rec.version || X().exam.versions[0]);
  const keyFor = (rec) => (X().exam.keys[ver(rec)] || []);
  const gradeOf = (rec) => X().score({ version: ver(rec), answers: rec.answers });
  function issuesOf(rec) {
    const e = X().exam, out = [], r = rec.res;
    if (!rec.student && !rec.newName) out.push({ k: 'student', sev: 'bad', text: rec.code ? (rec.cands.length > 1 ? T('isDupCode', { c: rec.code }) : rec.checkFail ? T('isCheckFail', { c: rec.code }) : T('isNoStudent', { c: rec.code })) : T('isCodeUnread', { c: r.codeRaw }) });
    if (rec.student && rec.student.scanned && !rec.replaceOk) out.push({ k: 'dupscan', sev: 'warn', text: T('isAlready', { d: new Date(rec.student.scanned).toLocaleString(K.locale()) }) });
    if (e.versions.length > 1 && !rec.version) out.push({ k: 'version', sev: 'bad', text: T('isVersion') });
    r.q.slice(0, e.nq).forEach((q, i) => {
      if (rec.fixed[i]) return;
      if (q.st === 'multi') out.push({ k: 'q', i, sev: 'warn', text: T('isMulti', { c: q.cands.join(', ') }) });
      else if (q.st === 'doubt') out.push({ k: 'q', i, sev: 'warn', text: q.a ? T('isDoubt', { a: q.a }) : T('isDoubtNone') });
    });
    return out;
  }
  const isClean = (rec) => issuesOf(rec).length === 0 && rec.res.level !== 'bad';

  /* ---------- superposición (revisión y directo) ---------- */
  function drawOverlay(c, map, k, rec, opts = {}) {
    const g = gOf(), key = keyFor(rec), nq = X().exam.nq, r = g.r * k, glyph = r > 6;
    const dot = (x, y, col, alpha, ch) => {
      const [px, py] = map(x, y); c.beginPath(); c.arc(px, py, r * 0.98, 0, 7); c.fillStyle = `rgba(${col},${alpha})`; c.fill();
      c.lineWidth = Math.max(1, r * 0.18); c.strokeStyle = `rgb(${col})`; c.stroke();
      if (ch && glyph) { c.fillStyle = '#08131f'; c.font = `700 ${r * 1.3}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, px, py + r * 0.05); }
    };
    const ring = (x, y, col, dash) => { const [px, py] = map(x, y); c.beginPath(); c.arc(px, py, r * 1.3, 0, 7); c.lineWidth = Math.max(1.5, r * 0.22); c.strokeStyle = `rgb(${col})`; c.setLineDash(dash ? [r * .5, r * .4] : []); c.stroke(); c.setLineDash([]); };
    for (let i = 0; i < nq; i++) {
      const q = g.q[i], rq = rec.res.q[i], a = rec.answers[i], kk = key[i] || '', opt = (L) => q.opts['ABCDE'.indexOf(L)];
      if (rq.st === 'multi' && !rec.fixed[i]) { rq.cands.forEach(L => { const o = opt(L); if (o) dot(o.x, o.y, COL.warn, 0.8, '?'); }); continue; }
      if (a) {
        const o = opt(a); if (!o) continue;
        if (!kk) dot(o.x, o.y, COL.info, 0.7);
        else if (a === kk) dot(o.x, o.y, COL.ok, 0.78, '✓');
        else { dot(o.x, o.y, COL.bad, 0.8, '✗'); const ko = opt(kk); if (ko) ring(ko.x, ko.y, COL.ok, false); }
        if (rq.st === 'doubt' && !rec.fixed[i]) ring(o.x, o.y, COL.warn, true);
      } else if (kk) { const ko = opt(kk); if (ko) ring(ko.x, ko.y, COL.warn, true); }
    }
    rec.res.cd.forEach((d, j) => {
      const x = g.code.cols[j];
      if (d.st === 'ok' || d.st === 'doubt') dot(x, g.code.rowY[+d.a], COL.info, 0.75);
      else { const [x0, y0] = map(x - g.code.pitch / 2, g.code.rowY[0] - 3), [x1, y1] = map(x + g.code.pitch / 2, g.code.rowY[9] + 3); c.lineWidth = 2; c.strokeStyle = `rgb(${d.st === 'multi' ? COL.warn : COL.bad})`; c.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); }
    });
    if (g.ver.items.length) {
      const it = g.ver.items['ABCD'.indexOf(rec.version)]; if (it) dot(it.x, it.y, COL.info, 0.75);
      else g.ver.items.forEach(v => ring(v.x, v.y, COL.bad, true));
    }
  }

  /* ---------- imágenes ---------- */
  function toCanvas(src, w, h, maxDim) {
    const k = Math.min(1, maxDim / Math.max(w, h)), cw = Math.round(w * k), ch = Math.round(h * k), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const c = cv.getContext('2d', { willReadFrequently: true }); c.imageSmoothingQuality = 'high'; c.drawImage(src, 0, 0, cw, ch); return cv;
  }
  async function loadBitmap(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* respaldo */ }
    return new Promise((res, rej) => { const im = new Image(), u = URL.createObjectURL(file); im.onload = () => { res(im); setTimeout(() => URL.revokeObjectURL(u), 3000); }; im.onerror = rej; im.src = u; });
  }
  function analyzeCanvas(cv) {
    const id = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cv.width, cv.height), img = { data: id.data, width: id.width, height: id.height };
    const res = O.scan(img, gOf(), Object.assign({ nq: X().exam.nq }, C.omrLearn.opts())); return { res, img };
  }

  /* ---------- sonido y vibración ---------- */
  function beep(kind) {
    if (S.opts.vib && navigator.vibrate) { try { navigator.vibrate(kind === 'ok' ? 60 : [50, 60, 50]); } catch (_) { /* nada */ } }
    if (!S.opts.sound) return;
    try {
      S.audio = S.audio || new (window.AudioContext || window.webkitAudioContext)();
      const a = S.audio, o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = kind === 'ok' ? 988 : 330; g.gain.value = 0.12;
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + (kind === 'ok' ? 0.12 : 0.25));
    } catch (_) { /* nada */ }
  }

  /* ---------- guardar / deshacer ---------- */
  function commit(rec) {
    const x = X(), e = x.exam; let s = rec.student, created = false;
    if (!s) {
      s = { id: K.uid(), name: '', last: rec.newName.last, first: rec.newName.first, group: '', code: '', version: e.versions[0], answers: Array(e.nq).fill('') };
      C.uiStudents.setName(s); e.students.push(s); created = true;
    }
    const prev = { answers: s.answers.slice(), version: s.version, scanned: s.scanned, code: s.code };
    s.answers = rec.answers.slice(0, e.nq).map(a => (a && 'ABCDE'.slice(0, e.nopt).includes(a) ? a : ''));
    s.version = e.versions.includes(rec.version) ? rec.version : e.versions[0]; s.scanned = Date.now();
    if (!s.code && rec.code && R.validCode(rec.code, e.codeLen, e.codeCheck) && !e.students.some(o => o !== s && o.code === rec.code)) s.code = rec.code;
    x.changed(); C.omrLearn.record(rec);
    const g = x.score(s), fixed = rec.fixed.filter(Boolean).length;
    S.log.push({ id: s.id, prev, created, name: R.display(s) || T('unnamed'), code: s.code, grade: g.grade, c: g.c, w: g.w, b: g.b, flagged: issuesOf(rec).length + fixed, conf: rec.res.level, ts: Date.now() });
    renderSession(); return s;
  }
  function undoLast() {
    const x = X(), l = S.log.pop(); if (!l) return; const e = x.exam, i = e.students.findIndex(s => s.id === l.id);
    if (i >= 0) { if (l.created) e.students.splice(i, 1); else Object.assign(e.students[i], l.prev); }
    x.changed(); renderSession(); K.toast(T('undone', { n: l.name }));
  }

  /* ---------- revisión ---------- */
  function openReview(rec, ctxInfo = {}) {
    return new Promise(resolve => {
      const x = X(), e = x.exam, d = document.createElement('dialog'); d.className = 'kit-dialog scan-review'; let result = 'discard';
      d.innerHTML = `<div class="rv-head"><h2>${T('rvTitle')}${ctxInfo.pos ? ` <small class="muted">${esc(ctxInfo.pos)}</small>` : ''}</h2><span class="chip" id="rv-conf"></span><button class="btn ghost small" data-rv="discard" aria-label="${esc(T('close'))}">✕</button></div>
        <div class="rv-body"><div class="rv-img"><canvas id="rv-cv" role="img" aria-label="${esc(T('rvTitle'))}"></canvas><div class="rv-legend"><span class="lg ok">✓ ${T('lgOk')}</span><span class="lg bad">✗ ${T('lgBad')}</span><span class="lg warn">? ${T('lgDoubt')}</span><span class="lg info">● ${T('lgNoKey')}</span></div></div>
        <div class="rv-side"><div id="rv-tips"></div><div id="rv-stud" class="stack"></div><div id="rv-grade"></div><div id="rv-issues" class="stack"></div>
          <details class="rv-all"><summary>${T('rvAll')}</summary><div id="rv-grid" class="stack"></div></details></div></div>
        <div class="rv-bar"><button class="btn ghost" data-rv="discard">${T('rvDiscard')}</button><button class="btn big" data-rv="save" id="rv-save">${T('rvSave')}</button></div>`;
      document.body.append(d); d.showModal();
      const cv = $('#rv-cv', d), rect = O.rectify(rec.res.img || rec.img, rec.res.H, 4), base = document.createElement('canvas'); base.width = rect.width; base.height = rect.height;
      base.getContext('2d').putImageData(new ImageData(rect.data, rect.width, rect.height), 0, 0); cv.width = rect.width; cv.height = rect.height;
      const draw = () => { const c = cv.getContext('2d'); c.drawImage(base, 0, 0); drawOverlay(c, (px, py) => [px * 4, py * 4], 4, rec); };
      const studOpts = () => e.students.slice().sort((a, b) => R.display(a).localeCompare(R.display(b), K.locale())).map(s => `<option value="${s.id}" ${rec.student === s ? 'selected' : ''}>${esc(R.display(s) || T('unnamed'))}${s.code ? ' · ' + s.code : ''}</option>`).join('');
      const bubbles = (i, cur) => `<div class="opts">${'ABCDE'.slice(0, e.nopt).split('').map(L => `<button type="button" class="bub ${cur === L ? 'on' : ''}" data-rv="ans" data-q="${i}" data-o="${L}" aria-pressed="${cur === L}" aria-label="${esc(T('questionN', { n: i + 1 }))}: ${L}">${L}</button>`).join('')}<button type="button" class="bub ${!cur ? 'on' : ''}" data-rv="ans" data-q="${i}" data-o="" aria-pressed="${!cur}" aria-label="${esc(T('questionN', { n: i + 1 }))}: ${esc(T('blank'))}">–</button></div>`;
      const render = () => {
        const g = gOf(), r = rec.res, iss = issuesOf(rec), gr = gradeOf(rec);
        $('#rv-conf', d).className = 'chip ' + (r.level === 'good' ? 'accent' : 'warn'); $('#rv-conf', d).textContent = T('conf_' + r.level) + ' · ' + Math.round(r.conf * 100) + ' %';
        $('#rv-tips', d).innerHTML = r.level !== 'good' ? `<div class="banner-warn"><b>${T('tipsTitle')}</b><ul><li>${T('tip1')}</li><li>${T('tip2')}</li><li>${T('tip3')}</li></ul></div>` : '';
        const codeTxt = rec.code || r.codeRaw;
        $('#rv-stud', d).innerHTML = `<div class="row"><label class="field" style="flex:1;min-width:130px">${T('rvCode')}<input id="rv-code" inputmode="numeric" value="${esc(rec.code || '')}" placeholder="${esc(r.codeRaw)}" aria-describedby="rv-codehint"></label>
          <label class="field" style="flex:2;min-width:170px">${T('rvStudent')}<select id="rv-sel"><option value="">${T('rvPick')}</option><option value="+" ${rec.newName ? 'selected' : ''}>+ ${T('rvNew')}</option>${studOpts()}</select></label></div>
          <small id="rv-codehint" class="muted">${T('rvRead')}: <b class="mono">${esc(codeTxt)}</b></small>
          ${rec.newName ? `<div class="row"><input id="rv-nl" placeholder="${esc(T('colLast'))}" value="${esc(rec.newName.last)}" style="flex:1;min-width:120px"><input id="rv-nf" placeholder="${esc(T('colFirst'))}" value="${esc(rec.newName.first)}" style="flex:1;min-width:120px"></div>` : ''}
          ${e.versions.length > 1 ? `<div class="field"><span style="font-weight:600">${T('studentVersion')}</span><div class="seg">${e.versions.map(v => `<button type="button" data-rv="ver" data-v="${v}" aria-pressed="${rec.version === v}">${v}</button>`).join('')}</div></div>` : ''}`;
        $('#rv-grade', d).innerHTML = `<div class="rv-gr"><span class="big ${gr.grade == null ? '' : gr.passed ? 'badge-ok' : 'badge-bad'}">${gr.grade == null ? '—' : K.fmt(gr.grade, 2)}</span><span>${T('lineStats', { c: gr.c, w: gr.w, b: gr.b })}</span></div>${!keyFor(rec).some(Boolean) ? `<small class="muted">${T('rvNoKey')}</small>` : ''}`;
        $('#rv-issues', d).innerHTML = iss.length ? `<h3 style="margin:4px 0">${T('rvIssues', { n: iss.length })}</h3>` + iss.map(it => it.k === 'q' ? `<div class="iss ${it.sev}"><b>${T('questionN', { n: it.i + 1 })}</b> <span>${esc(it.text)}</span>${bubbles(it.i, rec.answers[it.i])}</div>` : `<div class="iss ${it.sev}"><span>${esc(it.text)}</span>${it.k === 'dupscan' ? `<button class="btn small" data-rv="replace">${T('rvReplace')}</button>` : ''}</div>`).join('') : `<div class="fb good">${T('rvNoIssues')}</div>`;
        const fx = r.q.slice(0, e.nq).map((q, i) => i).filter(i => rec.fixed[i]);
        if (fx.length) $('#rv-issues', d).innerHTML += `<small class="muted">${T('rvFixed', { n: fx.length })}</small>`;
        $('#rv-grid', d).innerHTML = rec.answers.map((a, i) => `<div class="qrow" style="padding:4px 8px"><span class="qn">${i + 1}</span>${bubbles(i, a)}</div>`).join('');
        draw();
      };
      render();
      d.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-rv]'); if (!b) return; const a = b.dataset.rv;
        if (a === 'discard') d.close();
        else if (a === 'ans') { const i = +b.dataset.q; rec.answers[i] = b.dataset.o; rec.fixed[i] = true; render(); }
        else if (a === 'ver') { rec.version = b.dataset.v; render(); }
        else if (a === 'replace') { rec.replaceOk = true; render(); }
        else if (a === 'save') {
          if (!rec.student && !(rec.newName && (rec.newName.last || rec.newName.first))) { K.toast(T('rvNeedStudent'), 3000); const s = $('#rv-sel', d); if (s) s.focus(); return; }
          if (e.versions.length > 1 && !rec.version) { K.toast(T('isVersion'), 3000); return; }
          result = 'saved'; d.close();
        }
      });
      d.addEventListener('input', (ev) => {
        if (ev.target.id === 'rv-code') { rec.code = ev.target.value.replace(/\D/g, ''); rec.checkFail = !!(rec.code && e.codeCheck && !R.validCode(rec.code, e.codeLen, true)); rec.res.codeRaw = rec.res.codeRaw; lookup(rec); rec.student = rec.cands.length === 1 ? rec.cands[0] : rec.student; if (rec.student) rec.newName = null; const keep = ev.target; render(); const n = $('#rv-code', d); n.focus(); n.setSelectionRange(keep.selectionStart, keep.selectionStart); }
        if (ev.target.id === 'rv-nl' && rec.newName) rec.newName.last = ev.target.value;
        if (ev.target.id === 'rv-nf' && rec.newName) rec.newName.first = ev.target.value;
      });
      d.addEventListener('change', (ev) => {
        if (ev.target.id === 'rv-sel') {
          const v = ev.target.value; rec.autoStudent = false;
          if (v === '+') { rec.student = null; rec.newName = { last: '', first: '' }; } else { rec.newName = null; rec.student = e.students.find(s => s.id === v) || null; }
          render(); if (v === '+') { const n = $('#rv-nl', d); if (n) n.focus(); }
        }
      });
      d.addEventListener('cancel', () => { result = 'discard'; });
      d.addEventListener('close', () => { d.remove(); resolve(result); });
    });
  }

  /* ---------- flujo común ---------- */
  function failMsg(res) { return res.reason === 'noMarkers' ? T('failMarkers') : T('failOrient'); }
  /* devuelve 'saved' | 'discard' | 'auto' | 'fail' */
  async function handle(cv, { live = false, pos = '' } = {}) {
    const { res, img } = analyzeCanvas(cv);
    if (!res.ok) { beep('bad'); if (!live) K.toast(failMsg(res) + ' ' + T('failTips'), 5200); return 'fail'; }
    const rec = interpret(res, img);
    if (S.opts.auto && isClean(rec)) {
      const s = commit(rec); beep('ok'); flash(s, rec); return 'auto';
    }
    if (live) beep('bad');
    const r = await openReview(rec, { pos });
    if (r === 'saved') { const s = commit(rec); X().renderView(); flash(s, rec, true); return 'saved'; }
    return 'discard';
  }
  function flash(s, rec, quiet) {
    const g = gradeOf(rec), msg = `${R.display(s) || T('unnamed')} · ${g.grade == null ? '—' : K.fmt(g.grade, 2)}`;
    S.msg = '✔ ' + msg; const el = $('#liveflash'); if (el) { el.textContent = '✔ ' + msg; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 1600); }
    if (!S.live || quiet) K.toast('✔ ' + msg, 2200);
  }
  async function scanFiles(files) {
    files = [...files].filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic)$/i.test(f.name)); if (!files.length) return;
    let n = 0, saved = 0, fail = 0, disc = 0; const box = $('#scan-progress');
    for (const f of files) {
      n++; if (box) box.textContent = T('scanProg', { a: n, b: files.length });
      try {
        const bmp = await loadBitmap(f), cv = toCanvas(bmp, bmp.width || bmp.naturalWidth, bmp.height || bmp.naturalHeight, 2400);
        await new Promise(r => setTimeout(r, 20));
        const r = await handle(cv, { pos: files.length > 1 ? `${n}/${files.length}` : '' });
        if (r === 'fail') fail++; else if (r === 'discard') disc++; else saved++;
      } catch (e) { console.error(e); fail++; }
    }
    if (box) box.textContent = '';
    X().renderView(); K.toast(T('scanBatchDone', { s: saved, f: fail + disc }), 4200);
  }

  /* ---------- cámara en vivo ---------- */
  async function startLive() {
    if (S.live) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) { setErr(T('camInsecure')); return; }
    try {
      S.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    } catch (e) { setErr(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? T('camDenied') : e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') ? T('camNone') : T('camFail')); return; }
    setErr('');
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.srcObject = S.stream; S.video = v;
    try { await v.play(); } catch (_) { /* se reintenta con el bucle */ }
    S.live = true; S.paused = false; S.stable = 0; S.cool = false; S.last = null; S.sig = '';
    $('#live').hidden = false; $('#scan-start').hidden = true; K.keepAwake(true);
    const tr = S.stream.getVideoTracks()[0], caps = tr.getCapabilities ? tr.getCapabilities() : {}; $('#btn-torch').hidden = !caps.torch;
    S.work = document.createElement('canvas'); S.raf = requestAnimationFrame(loop);
    $('#live').scrollIntoView({ block: 'start', behavior: S.reduced ? 'auto' : 'smooth' });
  }
  function stopLive() {
    if (!S.live && !S.stream) return;
    S.live = false; cancelAnimationFrame(S.raf); if (S.stream) S.stream.getTracks().forEach(t => t.stop()); S.stream = null; S.video = null; K.keepAwake(false);
    const l = $('#live'); if (l) l.hidden = true; const s = $('#scan-start'); if (s) s.hidden = false;
  }
  const setErr = (m) => { const el = $('#scan-err'); if (el) { el.textContent = m; el.hidden = !m; } };
  function loop(ts) {
    if (!S.live) return;
    const v = S.video, cv = $('#livecv'); if (!cv) return;
    if (v.readyState >= 2 && v.videoWidth) {
      if (cv.width !== v.videoWidth) { cv.width = v.videoWidth; cv.height = v.videoHeight; }
      const c = cv.getContext('2d'); c.drawImage(v, 0, 0);
      if (!S.paused && !S.busy && ts - S.lastScan > 150) { S.lastScan = ts; analyzeLive(v); }
      drawLive(c, cv);
    }
    S.raf = requestAnimationFrame(loop);
  }
  function analyzeLive(v) {
    const k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight)), w = Math.round(v.videoWidth * k), h = Math.round(v.videoHeight * k), wc = S.work; wc.width = w; wc.height = h;
    const c = wc.getContext('2d', { willReadFrequently: true }); c.drawImage(v, 0, 0, w, h);
    const id = c.getImageData(0, 0, w, h), res = O.scan({ data: id.data, width: w, height: h }, gOf(), Object.assign({ nq: X().exam.nq }, C.omrLearn.opts()));
    if (!res.ok) {
      S.last = { res, f: 1 / k }; S.stable = 0; S.lost++; if (S.lost > 2) S.cool = false; return;
    }
    S.lost = 0; const rec = interpret(res, null); rec.f = 1 / k; S.last = { res, rec, f: 1 / k, ts: performance.now() };
    if (S.cool) {   // tras guardar, espera a que cambie de hoja (otro código legible) o desaparezca la hoja
      S.stable = 0; if (rec.code && res.codeSt === 'ok' && rec.code !== S.coolCode) S.cool = false; else return;
    }
    const sig = rec.code + '|' + rec.version + '|' + rec.answers.join('') + '|' + res.q.map(q => q.st[0]).join('');
    S.stable = (sig === S.sig && res.level !== 'bad') ? S.stable + 1 : 0; S.sig = sig;
    const need = res.codeSt === 'ok' ? 4 : 10;
    if (S.stable >= need) { S.stable = 0; capture(v); }
  }
  async function capture(v) {
    if (S.busy) return; S.busy = true; S.paused = true;
    try {
      const cv = toCanvas(v, v.videoWidth, v.videoHeight, 2200), r = await handle(cv, { live: true });
      S.cool = true; S.coolCode = S.last && S.last.rec ? S.last.rec.code : ''; if (r === 'fail') S.cool = false;
    } catch (e) { console.error(e); }
    S.busy = false; S.paused = false; S.stable = 0; S.sig = ''; S.lost = 0; renderSession();
  }
  function drawLive(c, cv) {
    const L = S.last, W = cv.width, H = cv.height, lw = Math.max(2, W / 400), info = $('#liveinfo'), gr = $('#livegrade'); let msg = T('liveFrame'), cls = '';
    if (!L) { guide(c, W, H, lw); }
    else if (!L.res.ok) {
      if (L.res.quad) { c.strokeStyle = `rgb(${COL.warn})`; c.lineWidth = lw; c.beginPath(); L.res.quad.forEach((p, i) => (i ? c.lineTo(p.x * L.f, p.y * L.f) : c.moveTo(p.x * L.f, p.y * L.f))); c.closePath(); c.stroke(); msg = T('liveOrient'); } else guide(c, W, H, lw);
      if (gr) gr.hidden = true;
    } else {
      const f = L.f, rec = L.rec, res = L.res, map = (x, y) => { const [u, v] = O.mapH(res.H, x, y); return [u * f, v * f]; };
      c.strokeStyle = `rgb(${S.cool ? COL.info : COL.ok})`; c.lineWidth = lw; c.beginPath(); res.quad.forEach((p, i) => (i ? c.lineTo(p.x * f, p.y * f) : c.moveTo(p.x * f, p.y * f))); c.closePath(); c.stroke();
      if (S.opts.overlay) drawOverlay(c, map, res.pxmm * f, rec);
      const g = gradeOf(rec), s = rec.student; cls = res.level;
      msg = S.cool ? T('liveNext') : res.codeSt !== 'ok' ? T('liveCode') : S.stable > 0 ? T('liveHold') : T('liveReading');
      if (gr) { gr.hidden = false; gr.className = 'live-hud grade ' + (g.grade == null ? '' : g.passed ? 'okc' : 'badc'); gr.innerHTML = `<b>${g.grade == null ? '—' : K.fmt(g.grade, 2)}</b><span>${esc(s ? R.display(s) : (rec.code ? T('isNoStudent', { c: rec.code }) : T('rvPick')))}</span><small>✓${g.c} ✗${g.w} –${g.b}</small>`; }
    }
    if (info) { info.textContent = msg; info.className = cls; }
    const bar = $('#livebar'); if (bar) bar.style.width = Math.min(100, S.stable / 4 * 100) + '%';
  }
  function guide(c, W, H, lw) {
    const h = H * 0.9, w = Math.min(W * 0.9, h / 1.414), x = (W - w) / 2, y = (H - h) / 2, r = w * 0.05;
    c.save(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = lw; c.setLineDash([lw * 5, lw * 3]); c.beginPath();
    c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.stroke(); c.setLineDash([]);
    [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].forEach(([px, py]) => { c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(px - lw * 4, py - lw * 4, lw * 8, lw * 8); }); c.restore();
  }
  async function toggleTorch() {
    const tr = S.stream && S.stream.getVideoTracks()[0]; if (!tr) return; S.torch = !S.torch;
    try { await tr.applyConstraints({ advanced: [{ torch: S.torch }] }); } catch (_) { S.torch = false; }
    $('#btn-torch').setAttribute('aria-pressed', String(S.torch));
  }

  /* ---------- vista ---------- */
  function readiness() {
    const e = X().exam, rows = [], key = e.versions.every(v => (e.keys[v] || []).some(Boolean)), nCode = e.students.filter(s => s.code).length;
    rows.push([key, key ? T('rdKey') : T('rdNoKey'), 'key']);
    rows.push([nCode > 0, nCode ? T('rdCodes', { a: nCode, n: e.students.length }) : T('rdNoCodes'), 'students']);
    rows.push([true, T('rdSheet', { n: C.hoja.params(e).nq, l: e.codeLen }), 'sheet']);
    return rows.map(([ok, txt, tab]) => `<li class="${ok ? 'ok' : 'warn'}"><span aria-hidden="true">${ok ? '✓' : '!'}</span> ${esc(txt)} ${ok ? '' : `<button class="btn ghost small" data-tab="${tab}">${T('tab_' + tab)}</button>`}</li>`).join('');
  }
  function render() {
    const o = S.opts, cam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext);
    return `
    <section class="live" id="live" hidden aria-label="${esc(T('scLive'))}"><div class="live-stage"><canvas id="livecv" aria-label="${esc(T('scLive'))}"></canvas>
        <div class="live-hud top"><span id="liveinfo" role="status" aria-live="polite"></span><div class="progress"><i id="livebar"></i></div></div><div class="live-hud grade" id="livegrade" hidden></div><div class="live-flash" id="liveflash" role="status" aria-live="polite"></div></div>
      <div class="live-bar"><button class="btn big" data-act="x:snap">${T('scSnap')}</button><button class="btn ghost" id="btn-torch" data-act="x:torch" aria-pressed="false" hidden>🔦</button><button class="btn danger" data-act="x:stoplive">${T('scStop')}</button><span class="chip accent" id="livecount"></span></div></section>
    <section class="panel stack"><h2 style="margin:0">${T('scTitle')}</h2><p class="muted" style="margin:0">${T('scHelp')}</p>
      <ul class="ready">${readiness()}</ul>
      <div id="scan-start" class="scan-actions">
        <button class="btn big" data-act="x:live" ${cam ? '' : 'aria-disabled="true"'}>📷 ${T('scLive')}</button>
        <label class="btn big alt" tabindex="0">🖼 ${T('scPhoto')}<input type="file" id="scan-cam" accept="image/*" capture="environment" hidden></label>
        <label class="btn big alt" tabindex="0">🗂 ${T('scGallery')}<input type="file" id="scan-gal" accept="image/*" multiple hidden></label>
      </div>
      <div id="scan-err" class="banner-warn" role="alert" hidden></div><div id="scan-progress" class="muted" aria-live="polite"></div>
      ${cam ? '' : `<div class="banner-warn">${T('camInsecure')}</div>`}
      <div class="row" style="gap:6px 18px"><label class="check"><input type="checkbox" data-so="auto" ${o.auto ? 'checked' : ''}> ${T('optAuto')}</label><label class="check"><input type="checkbox" data-so="overlay" ${o.overlay ? 'checked' : ''}> ${T('optOverlay')}</label>
        <label class="check"><input type="checkbox" data-so="sound" ${o.sound ? 'checked' : ''}> ${T('optSound')}</label><label class="check"><input type="checkbox" data-so="vib" ${o.vib ? 'checked' : ''}> ${T('optVib')}</label></div>
      <small class="muted">${T('scPrivacy')}</small>
      <div class="row" style="gap:8px;align-items:center"><small class="muted" id="ol-status"><b>${T('olTitle')}:</b> ${esc(C.omrLearn.status())}</small><button class="btn ghost small" data-act="x:olreset">${T('olReset')}</button></div>
    </section>
    <section class="panel stack" id="sessionbox"></section>`;
  }
  function renderSession() {
    const box = $('#sessionbox'), cnt = $('#livecount'); if (cnt) cnt.textContent = T('scCount', { n: S.log.length });
    if (!box) return;
    const bad = S.log.filter(l => l.flagged).length;
    box.innerHTML = `<div class="row spread"><h2 style="margin:0">${T('scSession')} <span class="chip">${S.log.length}</span></h2><div class="row"><button class="btn ghost small" data-act="x:undo" ${S.log.length ? '' : 'disabled'}>↶ ${T('scUndo')}</button><button class="btn ghost small" data-act="x:clearlog" ${S.log.length ? '' : 'disabled'}>${T('scClear')}</button></div></div>
      ${S.log.length ? `<div class="fb ${bad ? 'bad' : 'good'}">${T('scSummary', { n: S.log.length, b: bad })}</div>
      <ul class="slog">${S.log.slice().reverse().slice(0, 40).map(l => `<li><button type="button" data-act="x:edans" data-id="${l.id}"><b>${esc(l.name)}</b><span class="muted">${l.code ? esc(l.code) : ''}</span><span class="pill ${l.grade == null ? '' : l.grade >= X().exam.scoring.pass ? 'g-ok' : 'g-bad'}">${l.grade == null ? '—' : K.fmt(l.grade, 2)}</span>${l.flagged ? `<span class="pill">⚑ ${l.flagged}</span>` : ''}</button></li>`).join('')}</ul>` : `<div class="empty">${T('scEmpty')}</div>`}`;
  }
  function mount() { renderSession(); }
  function init() {
    S.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const app = $('#app');
    app.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'x:live') startLive(); else if (a === 'x:stoplive') stopLive();
      else if (a === 'x:snap') { if (S.video && !S.busy) capture(S.video); }
      else if (a === 'x:torch') toggleTorch(); else if (a === 'x:undo') undoLast(); else if (a === 'x:olreset') { if (await K.confirm(T('olResetQ'))) { C.omrLearn.reset(); const st = $('#ol-status'); if (st) st.innerHTML = '<b>' + T('olTitle') + ':</b> ' + esc(C.omrLearn.status()); K.toast(T('olDone'), 2400); } }
      else if (a === 'x:clearlog') { S.log = []; renderSession(); }
    });
    app.addEventListener('change', (ev) => {
      const el = ev.target;
      if (el.id === 'scan-cam' || el.id === 'scan-gal') { const fs = [...el.files]; el.value = ''; scanFiles(fs); }
      else if (el.dataset.so) { S.opts[el.dataset.so] = el.checked; saveOpts(); }
    });
    app.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('label.btn')) { ev.preventDefault(); ev.target.click(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopLive(); });
  }
  C.uiScan = { render, mount, init, stopLive, S, drawOverlay, interpret, handle };
})();
