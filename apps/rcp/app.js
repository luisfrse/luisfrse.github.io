/* Metrónomo de RCP, entrenamiento de ritmo y guía de SVB/DEA.
   Todo se ejecuta en el navegador. Ajustes e historial: localStorage ('rcp:*'). */
(() => {
  'use strict';
  const t = AppKit.i18n(window.RCP_I18N);
  const store = AppKit.storage('rcp');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = AppKit.esc;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  AppKit.mount({ titleKey: 'title' });

  /* ============================== ajustes ============================== */
  const DEFAULTS = { age: 'adult', bpm: 110, ratioYoung: 15, handsOnly: false, initBreaths: true, pause: 5, sound: true, volume: 0.7, vibrate: true, swapAlert: true, awake: true };
  const S = Object.assign({}, DEFAULTS, store.get('settings', {}));
  const save = () => store.set('settings', S);
  const AGES = ['adult', 'child', 'infant'];
  const isYoung = () => S.age !== 'adult';
  const comps = () => (isYoung() ? S.ratioYoung : 30);

  /* ============================== audio ============================== */
  const Aud = (() => {
    let ctx = null, master = null, audioClock = false;
    const nodes = new Set();
    const ensure = async () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = S.volume; master.connect(ctx.destination); }
      if (ctx.state !== 'running') { try { await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 400))]); } catch (_) { /* nada */ } }
      audioClock = ctx.state === 'running';
      return audioClock;
    };
    const now = () => (audioClock && ctx ? ctx.currentTime : performance.now() / 1000);
    const tone = (time, freq, dur, gain, type = 'sine', attack = 0.004) => {
      if (!audioClock || !ctx || !S.sound) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(gain, time + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g); g.connect(master); o.start(time); o.stop(time + dur + 0.02);
      nodes.add(o); o.onended = () => { nodes.delete(o); g.disconnect(); };
    };
    return {
      ensure, now,
      get audio() { return audioClock; },
      setVolume(v) { if (master) master.gain.value = v; },
      click(time, accent) { tone(time, accent ? 1900 : 1250, accent ? 0.07 : 0.045, accent ? 1 : 0.7, 'triangle'); if (accent) tone(time, 950, 0.09, 0.5, 'sine'); },
      breath(time, i) { tone(time, i === 1 ? 523 : 659, 0.42, 0.55, 'sine', 0.05); },
      alarm(time) { [0, 0.22, 0.44].forEach(d => tone(time + d, 988, 0.16, 0.8, 'square', 0.005)); },
      stopAll() { nodes.forEach(o => { try { o.stop(); } catch (_) { /* ya parado */ } }); nodes.clear(); }
    };
  })();

  /* ============================== metrónomo ============================== */
  const dial = $('#dial'), ticks = $('#ticks'), pulseEl = $('#pulse'), countEl = $('#count'), countLabel = $('#countLabel');
  const statusEl = $('#status'), dots = $('#breathDots'), swapBox = $('#swapAlert');
  const startBtn = $('#startBtn');

  let voiceSkipUntil = 0;
  const run = { running: false, started: false, accum: 0, t0: 0, swapAccum: 0, swapT0: 0, alertShown: false, lastAlert: 0, timer: 0, raf: 0 };
  let eng = null;
  let uiq = [];
  const ui = { phase: 'idle', n: 0, of: 30, cycle: 1, total: 0, ventEnd: 0 };

  function buildTicks(of) {
    ticks.innerHTML = '';
    for (let i = 0; i < of; i++) {
      const a = (i / of) * 2 * Math.PI - Math.PI / 2, r1 = 108, r2 = of > 20 ? 123 : 126;
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', (r1 * Math.cos(a)).toFixed(2)); l.setAttribute('y1', (r1 * Math.sin(a)).toFixed(2));
      l.setAttribute('x2', (r2 * Math.cos(a)).toFixed(2)); l.setAttribute('y2', (r2 * Math.sin(a)).toFixed(2));
      if (of <= 20) l.setAttribute('stroke-width', '9');
      ticks.append(l);
    }
    ui.of = of;
  }
  const lit = (n) => $$('line', ticks).forEach((l, i) => l.classList.toggle('lit', i < n));

  function pulse(color) {
    const d = Math.max(90, Math.min(230, (60 / S.bpm) * 1000 * 0.55));
    if (REDUCED) pulseEl.animate([{ opacity: 0.45 }, { opacity: 1 }, { opacity: 0.45 }], { duration: d });
    else pulseEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], { duration: d, easing: 'ease-out' });
  }
  const vibrate = (p) => { if (S.vibrate && navigator.vibrate) { try { navigator.vibrate(p); } catch (_) { /* nada */ } } };

  function setPhase(p) { ui.phase = p; dial.dataset.phase = p === 'init' ? 'vent' : p; dots.hidden = !(p === 'vent'); }

  function applyEvent(ev) {
    if (ev.type === 'comp') {
      if (ev.of !== ui.of) buildTicks(ev.of);
      setPhase('comp');
      Object.assign(ui, { n: ev.n, cycle: ev.cycle, total: ev.total });
      countEl.textContent = ev.n; countLabel.textContent = t('compressions');
      lit(ev.n); statusEl.textContent = t('compress');
      pulse(); vibrate(ev.accent ? 35 : 14);
      if (ev.n === 1 && ev.t > voiceSkipUntil) RCP.voice.sayKey('vo_comp');
    } else if (ev.type === 'init') {
      setPhase('init');
      lit(0); countEl.textContent = ev.i; countLabel.textContent = t('initBreathOf', { i: ev.i, of: ev.of });
      statusEl.textContent = t('initNote'); pulse(); vibrate(60);
    } else if (ev.type === 'vent') {
      setPhase('vent'); ui.ventEnd = ev.t + ev.dur; ui.cycle = ev.cycle;
      lit(0); $$('i', dots).forEach(d => d.classList.remove('on'));
      countLabel.textContent = t('ventilating'); statusEl.textContent = t('giveBreaths');
      countEl.textContent = Math.ceil(ev.dur);
      RCP.voice.sayKey('vo_breaths');
    } else if (ev.type === 'breath') {
      $$('i', dots).forEach((d, k) => d.classList.toggle('on', k < ev.i));
      pulse(); vibrate(70);
    }
    refreshStats();
  }

  const elapsed = () => run.accum + (run.running ? Aud.now() - run.t0 : 0);
  const swapElapsed = () => run.swapAccum + (run.running ? Aud.now() - run.swapT0 : 0);

  function refreshStats() {
    $('#stCycle').textContent = ui.phase === 'idle' && !run.started ? 1 : (ui.phase === 'vent' ? ui.cycle : ui.cycle);
    $('#stTotal').textContent = ui.total;
    $('#stTime').textContent = AppKit.mmss(elapsed());
    $('#stSwap').textContent = S.swapAlert ? AppKit.mmss(Math.max(0, 120 - swapElapsed())) : '—';
  }

  function frame() {
    if (!run.running) return;
    const now = Aud.now();
    while (uiq.length && uiq[0].t <= now + 0.005) applyEvent(uiq.shift());
    if (ui.phase === 'vent') countEl.textContent = Math.max(0, Math.ceil(ui.ventEnd - now));
    refreshStats();
    if (S.swapAlert) {
      const left = 120 - swapElapsed();
      if (left <= 0 && !run.alertShown) { showSwap(); }
      else if (run.alertShown && now - run.lastAlert > 20) { Aud.alarm(now + 0.05); vibrate([200, 100, 200]); run.lastAlert = now; }
    }
    run.raf = requestAnimationFrame(frame);
  }
  function showSwap() {
    run.alertShown = true; run.lastAlert = Aud.now();
    swapBox.hidden = false; dial.classList.add('swap');
    Aud.alarm(Aud.now() + 0.05); vibrate([200, 100, 200]);
    RCP.voice.sayKey('vo_swap');
  }
  function hideSwap() { run.alertShown = false; swapBox.hidden = true; dial.classList.remove('swap'); }

  function schedule() {
    const now = Aud.now();
    while (eng && eng.peekTime() < now + 0.4) {
      const ev = eng.next();
      if (ev.type === 'comp') Aud.click(ev.t, ev.accent);
      else if (ev.type === 'breath' || ev.type === 'init') Aud.breath(ev.t, ev.type === 'breath' ? ev.i : 1);
      uiq.push(ev);
    }
  }

  function resumeState() {
    if (!run.started) return null;
    if (ui.phase === 'vent' || ui.phase === 'init') return { n: 0, cycle: ui.phase === 'vent' ? ui.cycle + 1 : 1, total: ui.total };
    return { n: ui.n, cycle: ui.cycle, total: ui.total };
  }

  async function start() {
    const ok = await Aud.ensure();
    $('#noAudio').hidden = ok || !S.sound;
    Aud.setVolume(S.volume);
    const first = !run.started;
    RCP.voice.unlock(); RCP.voice.sayKey(first ? (isYoung() && S.initBreaths ? 'vo_init' : 'vo_start') : 'vo_resume');
    const now = Aud.now();
    voiceSkipUntil = now + 2.5;
    if (first) { ui.n = 0; ui.cycle = 1; ui.total = 0; buildTicks(comps()); }
    const state = resumeState();
    eng = RCPEngine.createEngine({
      bpm: S.bpm, comps: comps(), pause: S.pause, handsOnly: S.handsOnly,
      initBreaths: first && isYoung() && S.initBreaths ? 5 : 0, startAt: now + 0.45, state
    });
    uiq = [];
    run.running = true; run.started = true; run.t0 = now; run.swapT0 = now;
    startBtn.textContent = t('pause');
    lockControls(true);
    if (S.awake) AppKit.keepAwake(true);
    countLabel.textContent = t('getReady'); statusEl.textContent = t('getReady');
    schedule();
    run.timer = setInterval(schedule, 25);
    run.raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (!run.running) return;
    const now = Aud.now();
    run.accum += now - run.t0; run.swapAccum += now - run.swapT0;
    run.running = false;
    clearInterval(run.timer); cancelAnimationFrame(run.raf);
    Aud.stopAll(); uiq = []; eng = null;
    AppKit.keepAwake(false);
    startBtn.textContent = t('resume');
    statusEl.textContent = t('paused');
    RCP.voice.sayKey('vo_pause');
    lockControls(false);
    refreshStats();
  }

  function reset() {
    const was = run.running;
    pause();
    if (was) RCP.voice.sayKey('vo_end');
    Object.assign(run, { running: false, started: false, accum: 0, swapAccum: 0, alertShown: false });
    Object.assign(ui, { phase: 'idle', n: 0, cycle: 1, total: 0, ventEnd: 0 });
    hideSwap(); setPhase('idle');
    buildTicks(comps()); lit(0);
    countEl.textContent = '0'; countLabel.textContent = t('compressions');
    statusEl.textContent = t('ready'); startBtn.textContent = t('start');
    refreshStats();
  }

  function lockControls(on) {
    $$('#ageSeg button, #ratioSeg button, #optHands, #optInit, #optPause').forEach(e => { e.disabled = on; });
  }

  $('#startBtn').addEventListener('click', () => { run.running ? pause() : start(); });
  $('#resetBtn').addEventListener('click', reset);
  $('#swapDone').addEventListener('click', () => { const n = Aud.now(); run.swapAccum = 0; run.swapT0 = n; hideSwap(); });

  /* ---- ritmo ---- */
  function setBpm(v) {
    S.bpm = AppKit.clamp(Math.round(v), 100, 120); save();
    $('#bpm').value = S.bpm; $('#bpmVal').textContent = S.bpm;
    if (eng) eng.setBpm(S.bpm);
  }
  $('#bpm').addEventListener('input', e => setBpm(+e.target.value));
  $('#bpmDown').addEventListener('click', () => setBpm(S.bpm - 1));
  $('#bpmUp').addEventListener('click', () => setBpm(S.bpm + 1));

  /* ---- edad y ajustes ---- */
  function renderParams() {
    const cell = t('ageCells')[S.age], rows = t('rows');
    const ratioTxt = S.age === 'adult' ? '30:2' : `${S.ratioYoung}:2`;
    $('#params').innerHTML = `
      <h2>${esc(t('params'))}</h2>
      <span class="chip accent age-tag">${esc(t(S.age))} · ${esc(t('ageHint')[S.age])}</span>
      <dl>
        <dt>${esc(t('pDepth'))}</dt><dd>${esc(cell.depth)}</dd>
        <dt>${esc(t('pHands'))}</dt><dd>${esc(cell.hands)}</dd>
        <dt>${esc(t('pRate'))}</dt><dd>${esc(cell.rate)}</dd>
        <dt>${esc(t('pRatio'))}</dt><dd>${esc(S.age === 'adult' ? cell.ratio : cell.ratio)}</dd>
        <dt>${esc(t('pInit'))}</dt><dd>${esc(cell.initial)}</dd>
      </dl>`;
    void rows; void ratioTxt;
  }

  function syncControls() {
    $$('#ageSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.age === S.age)));
    $('#ageHint').textContent = t('ageHint')[S.age];
    $$('#ratioSeg button').forEach(b => { b.setAttribute('aria-pressed', String(+b.dataset.ratio === (isYoung() ? S.ratioYoung : 30))); if (!run.running) b.disabled = !isYoung(); });
    $('#ratioNote').textContent = isYoung() ? '' : t('ratioAdultOnly');
    $('#rowInit').hidden = !isYoung();
    $('#optInit').checked = S.initBreaths; $('#optHands').checked = S.handsOnly;
    $('#rowPause').hidden = S.handsOnly;
    $('#optPause').value = S.pause; $('#pauseVal').textContent = t('seconds', { n: S.pause });
    $('#optSound').checked = S.sound; $('#optVol').value = S.volume; $('#optVib').checked = S.vibrate;
    $('#optSwap').checked = S.swapAlert; $('#optAwake').checked = S.awake;
    $('#bpm').value = S.bpm; $('#bpmVal').textContent = S.bpm;
    renderParams();
  }

  $('#ageSeg').addEventListener('click', e => {
    const b = e.target.closest('button[data-age]'); if (!b || run.running) return;
    S.age = b.dataset.age; save(); if (run.started) reset(); else buildTicks(comps()); syncControls();
  });
  $('#ratioSeg').addEventListener('click', e => {
    const b = e.target.closest('button[data-ratio]'); if (!b || !isYoung() || run.running) return;
    S.ratioYoung = +b.dataset.ratio; save(); if (run.started) reset(); else buildTicks(comps()); syncControls();
  });
  const bind = (id, key, isRange) => $(id).addEventListener(isRange ? 'input' : 'change', e => {
    const el = e.target; S[key] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? +el.value : el.value); save();
    if (key === 'volume') Aud.setVolume(S.volume);
    if (key === 'handsOnly' || key === 'initBreaths') { if (run.started) reset(); }
    if (key === 'awake') AppKit.keepAwake(S.awake && run.running);
    syncControls(); refreshStats();
  });
  bind('#optHands', 'handsOnly'); bind('#optInit', 'initBreaths'); bind('#optPause', 'pause', true);
  bind('#optSound', 'sound'); bind('#optVol', 'volume', true); bind('#optVib', 'vibrate'); bind('#optSwap', 'swapAlert'); bind('#optAwake', 'awake');

  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,select,textarea,button,a,[role="tab"]')) return;
    if (tab !== 'metro') return;
    if (e.code === 'Space') { e.preventDefault(); run.running ? pause() : start(); }
    else if (e.key === '+' || e.key === '=') setBpm(S.bpm + 1);
    else if (e.key === '-' || e.key === '_') setBpm(S.bpm - 1);
  });

  /* ============================== entrenamiento ============================== */
  const pad = $('#pad');
  const Train = (() => {
    let taps = [], idle = 0, last = null, guideTimer = 0, guideNext = 0;
    const history = () => store.get('attempts', []);
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
    const ivs = () => taps.slice(1).map((v, i) => v - taps[i]);
    const regOf = (iv) => { const c = sd(iv) / mean(iv); return Math.round(AppKit.clamp(100 - c * 500, 0, 100)); };
    const regLabel = (r) => (r >= 80 ? t('veryRegular') : r >= 60 ? t('regular') : t('irregular'));
    const bpmToDeg = (b) => 180 - AppKit.clamp((b - 60) / 100, 0, 1) * 180;
    const pt = (deg, r) => [130 + r * Math.cos(deg * Math.PI / 180), 130 - r * Math.sin(deg * Math.PI / 180)];
    const arc = (b1, b2, r, w, col) => { const [x1, y1] = pt(bpmToDeg(b1), r), [x2, y2] = pt(bpmToDeg(b2), r); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="butt"/>`; };

    function drawGauge() {
      $('#gauge').innerHTML = arc(60, 100, 100, 16, 'rgba(245,184,46,.55)') + arc(100, 120, 100, 16, '#4ade80') + arc(120, 160, 100, 16, 'rgba(245,184,46,.55)') +
        [60, 80, 100, 110, 120, 140, 160].map(v => { const [x, y] = pt(bpmToDeg(v), 124); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="12" fill="#b9c6d6" font-family="Source Sans 3,sans-serif" font-weight="600">${v}</text>`; }).join('') +
        `<g class="needle" id="needle" style="transform:rotate(-90deg)"><path d="M130 130 L130 52" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="130" cy="130" r="8" fill="#b08be0"/></g>`;
    }
    function setNeedle(bpm) { const n = $('#needle'); if (n) n.style.transform = `rotate(${(AppKit.clamp((bpm - 60) / 100, 0, 1) * 180 - 90).toFixed(1)}deg)`; }

    function drawChart() {
      const iv = ivs().slice(-30), W = 300, H = 120, bw = W / 30, y = (b) => H - AppKit.clamp((b - 60) / 100, 0, 1) * H;
      let s = `<rect x="0" y="${y(120)}" width="${W}" height="${y(100) - y(120)}" fill="rgba(74,222,128,.18)"/>`;
      iv.forEach((d, i) => { const b = 60000 / d, ok = b >= 100 && b <= 120, yy = y(b); s += `<rect x="${(i * bw + 2).toFixed(1)}" y="${yy.toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(H - yy).toFixed(1)}" rx="2" fill="${ok ? '#4ade80' : '#f5b82e'}" opacity=".9"/>`; });
      $('#chart').innerHTML = s;
    }

    function renderLive() {
      const iv = ivs();
      $('#liveTaps').textContent = taps.length;
      const hint = $('#padHint');
      if (iv.length < 4) {
        $('#liveBpm').textContent = '—'; $('#liveReg').textContent = '—';
        $('#verdict').className = 'verdict'; $('#verdict').textContent = taps.length ? t('tapMore', { n: Math.max(1, 5 - taps.length) }) : t('notEnough');
        setNeedle(60); drawChart();
        hint.innerHTML = taps.length ? `${esc(t('taps'))}: ${taps.length}` : `${esc(t('tapHere'))}<small>${esc(t('padKeys'))}</small>`;
        return;
      }
      const recent = iv.slice(-8), b = 60000 / mean(recent), reg = regOf(iv.slice(-12));
      $('#liveBpm').textContent = Math.round(b); $('#liveReg').textContent = reg + '%';
      const v = $('#verdict'); const ok = b >= 100 && b <= 120;
      v.className = 'verdict ' + (ok ? 'ok' : b < 100 ? 'slow' : 'fast');
      v.textContent = ok ? `${t('inRange')} · ${t('keepGoing')}` : (b < 100 ? t('tooSlow') : t('tooFast'));
      setNeedle(b); drawChart();
      hint.innerHTML = `${Math.round(b)}<small>${esc(regLabel(reg))}</small>`;
    }

    function ripple(e) {
      const r = document.createElement('span'); r.className = 'ring';
      const box = pad.getBoundingClientRect();
      r.style.left = (e && e.clientX ? e.clientX - box.left : box.width / 2) + 'px'; r.style.top = (e && e.clientY ? e.clientY - box.top : box.height / 2) + 'px';
      pad.append(r); setTimeout(() => r.remove(), 650);
      pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 90);
    }

    function tap(e) {
      taps.push(performance.now());
      ripple(e); renderLive();
      clearTimeout(idle); idle = setTimeout(finish, 2600);
    }
    function finish() {
      const iv = ivs();
      if (taps.length >= 10) {
        const b = 60000 / mean(iv), pct = Math.round(100 * iv.filter(d => { const x = 60000 / d; return x >= 100 && x <= 120; }).length / iv.length), reg = regOf(iv);
        last = { ts: Date.now(), n: taps.length, bpm: Math.round(b), pct, reg };
        const h = history(); h.unshift(last); store.set('attempts', h.slice(0, 30));
        AppKit.toast(t('attemptSaved'));
        renderLast(); renderHistory();
      }
      taps = []; renderLive();
    }
    function renderLast() {
      const box = $('#lastBox');
      if (!last) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = `<h2>${esc(t('lastAttempt'))}</h2><div class="readout">
        <div><div class="big">${last.bpm}</div><small>${esc(t('avg'))}</small></div>
        <div><div class="big">${last.pct}%</div><small>${esc(t('inRangePct'))}</small></div>
        <div><div class="big">${last.reg}%</div><small>${esc(regLabel(last.reg))}</small></div></div>`;
    }
    function renderHistory() {
      const h = history(), box = $('#histBox');
      if (!h.length) { box.innerHTML = `<h2>${esc(t('history'))}</h2><div class="empty">${esc(t('historyEmpty'))}</div>`; return; }
      const best = Math.max(...h.map(x => x.reg));
      box.innerHTML = `<div class="row spread"><h2 style="margin:0">${esc(t('history'))}</h2><span class="chip">${esc(t('best'))}: ${best}%</span></div>
        <ul class="hist-list" style="margin-top:12px">${h.slice(0, 8).map(x => `<li><div>${esc(AppKit.fmtDate(x.ts, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}<small class="muted">${x.n} ${esc(t('taps').toLowerCase())} · ${x.bpm}/min</small></div>
          <span class="chip ${x.pct >= 70 ? 'accent' : ''}">${x.pct}% ${esc(t('inRangePct').toLowerCase())}</span><span class="chip">${x.reg}%</span></li>`).join('')}</ul>
        <div class="row" style="margin-top:12px"><button type="button" class="btn ghost small danger" id="clearHist">${esc(t('clearHistory'))}</button></div>`;
      $('#clearHist').addEventListener('click', async () => { if (await AppKit.confirm(t('clearHistory') + '?', { okText: t('delete'), danger: true })) { store.remove('attempts'); last = null; renderLast(); renderHistory(); AppKit.toast(t('cleared')); } });
    }

    /* guía sonora (metrónomo sencillo) */
    async function guide(on) {
      clearInterval(guideTimer);
      if (!on) { Aud.stopAll(); return; }
      await Aud.ensure(); Aud.setVolume(S.volume);
      guideNext = Aud.now() + 0.3;
      guideTimer = setInterval(() => { while (guideNext < Aud.now() + 0.4) { Aud.click(guideNext, false); guideNext += 60 / S.bpm; } }, 25);
    }

    pad.addEventListener('pointerdown', e => { e.preventDefault(); tap(e); });
    pad.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) tap(); } });
    document.addEventListener('keydown', e => {
      if (tab !== 'train' || e.code !== 'Space' || e.repeat) return;
      const fr = document.getElementById('trainFullRoot'); if (fr && !fr.hidden) return;      // modo «RCP completo»: lo gestiona entreno.js
      if (e.target.closest && e.target.closest('input,select,textarea,button,a,[role="tab"]')) return;
      e.preventDefault(); tap();
    });
    $('#optGuide').addEventListener('change', e => guide(e.target.checked));

    return {
      render() { drawGauge(); renderLive(); renderLast(); renderHistory(); $('#guideHint').textContent = t('guideHint', { n: S.bpm }); },
      stopGuide() { $('#optGuide').checked = false; guide(false); }
    };
  })();

  /* ============================== guía paso a paso ============================== */
  const SVB = [
    ['seguridad', 'eval', 'seguridad'], ['respuesta', 'eval', 'respuesta'], ['llamar', 'eval', 'llamar'], ['aire', 'eval', 'aire'], ['respira', 'eval', 'respira'],
    ['manos', 'rcp', 'manos'], ['profundidad', 'rcp', 'profundidad'], ['ventilar', 'rcp', 'ventilar'], ['ciclo', 'rcp', 'ciclo'],
    ['dea_on', 'aed', 'dea_on'], ['dea_pads', 'aed', 'dea_pads'], ['dea_analiza', 'aed', 'dea_analiza'], ['dea_descarga', 'aed', 'dea_descarga'],
    ['reanuda', 'keep', 'dosmin'], ['sigue', 'keep', 'corazon']
  ].map(([id, ph, ill]) => ({ id, ph, ill, src: 'steps' }));
  const PLS = ['pls1', 'pls2', 'pls3', 'pls4', 'pls5', 'pls6'].map(id => ({ id, ph: null, ill: id, src: 'plsSteps' }));
  const G = { mode: 'svb', view: 'steps', i: 0, checks: {}, t0: 0, doneAt: 0, tick: 0 };
  const list = () => (G.mode === 'svb' ? SVB : PLS);
  const textOf = (s) => t(s.src)[s.id];
  const PH = { eval: 'phaseEval', rcp: 'phaseRcp', aed: 'phaseAed', keep: 'phaseKeep' };

  function renderGuide() {
    const root = $('#guideRoot'), L = list(), s = L[G.i], x = textOf(s);
    clearInterval(G.tick);
    const header = `
      <div class="panel">
        <div class="guide-bar">
          <div><h2 style="margin:0">${esc(t('guideTitle'))}</h2><small class="muted">${esc(t('guideIntro'))}</small></div>
          <div class="row">
            <div class="seg" id="gMode" role="group"><button type="button" data-m="svb" aria-pressed="${G.mode === 'svb'}">${esc(t('modeSvb'))}</button><button type="button" data-m="pls" aria-pressed="${G.mode === 'pls'}">${esc(t('modePls'))}</button></div>
            <div class="seg" id="gView" role="group"><button type="button" data-v="steps" aria-pressed="${G.view === 'steps'}">${esc(t('modeSteps'))}</button><button type="button" data-v="check" aria-pressed="${G.view === 'check'}">${esc(t('modeCheck'))}</button></div>
          </div>
        </div>
      </div>`;
    let body;
    if (G.view === 'steps') {
      const phases = G.mode === 'svb' ? ['eval', 'rcp', 'aed', 'keep'] : [];
      body = `
      <div class="panel stack">
        ${phases.length ? `<div class="phases">${phases.map(p => `<button type="button" class="phase-chip" data-ph="${p}" aria-current="${s.ph === p}">${esc(t(PH[p]))}</button>`).join('')}</div>` : ''}
        <div class="progress" aria-hidden="true"><i style="width:${((G.i + 1) / L.length * 100).toFixed(1)}%"></i></div>
        <div class="step-card">
          <div>${RCP_ILL.get(s.ill)}</div>
          <div>
            <div class="step-n">${esc(t('stepOf', { i: G.i + 1, n: L.length }))}</div>
            <h3>${esc(x.title)}</h3>
            <p>${esc(x.text)}</p>
            ${x.tip ? `<div class="tip"><b>${esc(t('tipLabel'))}</b><span>${esc(x.tip)}</span></div>` : ''}
          </div>
        </div>
        <div class="dots-nav" role="group">${L.map((_, k) => `<button type="button" data-k="${k}" aria-label="${k + 1}" aria-current="${k === G.i}" class="${k < G.i ? 'done' : ''}"></button>`).join('')}</div>
        <div class="nav-row"><button type="button" class="btn ghost" id="gPrev" ${G.i === 0 ? 'disabled' : ''}>← ${esc(t('prev'))}</button><button type="button" class="btn" id="gNext" ${G.i === L.length - 1 ? 'disabled' : ''}>${esc(t('next'))} →</button></div>
      </div>`;
    } else {
      const done = L.filter(q => G.checks[G.mode + q.id]).length, all = done === L.length;
      let lastPh = null;
      body = `
      <div class="panel stack">
        <div class="check-top"><p class="muted" style="margin:0">${esc(t('checkIntro'))}</p><button type="button" class="btn ghost small" id="cReset">${esc(t('checkReset'))}</button></div>
        <div class="row spread"><span class="chip">${esc(t('checkProgress', { a: done, b: L.length }))}</span><span class="${all ? 'pill-done' : 'muted'}" id="cTime">${all ? esc(t('checkDone', { t: AppKit.mmss((G.doneAt - G.t0) / 1000) })) : (G.t0 ? AppKit.mmss((Date.now() - G.t0) / 1000) : '')}</span></div>
        <div class="progress"><i style="width:${(done / L.length * 100).toFixed(1)}%"></i></div>
        <ul class="check-list">${L.map(q => { const qx = textOf(q); const grp = q.ph && q.ph !== lastPh ? `<li class="grp">${esc(t(PH[q.ph]))}</li>` : ''; lastPh = q.ph || lastPh; const d = !!G.checks[G.mode + q.id];
          return `${grp}<li><label class="${d ? 'done' : ''}"><input type="checkbox" data-id="${q.id}" ${d ? 'checked' : ''}><span><b>${esc(qx.title)}</b><small class="muted">${esc(qx.text)}</small></span></label></li>`; }).join('')}</ul>
      </div>`;
    }
    root.innerHTML = header + body;

    $$('#gMode button').forEach(b => b.addEventListener('click', () => { G.mode = b.dataset.m; G.i = 0; renderGuide(); }));
    $$('#gView button').forEach(b => b.addEventListener('click', () => { G.view = b.dataset.v; renderGuide(); }));
    if (G.view === 'steps') {
      $('#gPrev').addEventListener('click', () => { G.i = Math.max(0, G.i - 1); renderGuide(); });
      $('#gNext').addEventListener('click', () => { G.i = Math.min(L.length - 1, G.i + 1); renderGuide(); });
      $$('.dots-nav button').forEach(b => b.addEventListener('click', () => { G.i = +b.dataset.k; renderGuide(); }));
      $$('.phase-chip').forEach(b => b.addEventListener('click', () => { G.i = Math.max(0, L.findIndex(q => q.ph === b.dataset.ph)); renderGuide(); }));
    } else {
      $$('.check-list input').forEach(inp => inp.addEventListener('change', () => {
        if (!G.t0) G.t0 = Date.now();
        G.checks[G.mode + inp.dataset.id] = inp.checked;
        if (L.every(q => G.checks[G.mode + q.id])) G.doneAt = Date.now();
        const y = window.scrollY; renderGuide(); window.scrollTo(0, y);
      }));
      $('#cReset').addEventListener('click', () => { G.checks = {}; G.t0 = 0; G.doneAt = 0; renderGuide(); });
      if (G.t0 && !L.every(q => G.checks[G.mode + q.id])) G.tick = setInterval(() => { const el = $('#cTime'); if (el) el.textContent = AppKit.mmss((Date.now() - G.t0) / 1000); }, 1000);
    }
  }
  document.addEventListener('keydown', e => {
    if (tab !== 'guide' || G.view !== 'steps') return;
    if (e.target.closest && e.target.closest('input,select,textarea')) return;
    if (e.key === 'ArrowRight') { G.i = Math.min(list().length - 1, G.i + 1); renderGuide(); }
    if (e.key === 'ArrowLeft') { G.i = Math.max(0, G.i - 1); renderGuide(); }
  });

  /* ============================== calidad y edades ============================== */
  function renderQuality() {
    const rows = t('rows'), cells = t('ageCells');
    $('#qualityRoot').innerHTML = `
      <div class="panel"><h2>${esc(t('qualityTitle'))}</h2><div class="tips">${t('qualityTips').map(x => `<article><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p></article>`).join('')}</div></div>
      <div class="panel"><h2>${esc(t('ageTableTitle'))}</h2>
        <div class="table-wrap"><table class="kit ages"><thead><tr><th></th><th>${esc(t('colAdult'))}</th><th>${esc(t('colChild'))}</th><th>${esc(t('colInfant'))}</th></tr></thead><tbody>
        ${Object.keys(rows).map(k => `<tr><td>${esc(rows[k])}</td>${AGES.map(a => `<td>${esc(cells[a][k])}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div></div>`;
  }

  /* ============================== pestañas ============================== */
  let tab = 'metro';
  const TABS = ['metro', 'call', 'aed', 'choke', 'sensor', 'train', 'guide', 'quality'];
  function showTab(name, focus) {
    if (!TABS.includes(name)) name = 'metro';
    tab = name; store.set('tab', name);
    $$('#tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    TABS.forEach(n => { $('#tab-' + n).hidden = n !== name; });
    if (name !== 'train') Train.stopGuide();
    Object.keys(RCP.tabs).forEach(n => { if (n !== name && RCP.tabs[n].leave) RCP.tabs[n].leave(); });
    if (name === 'train') Train.render();
    if (name === 'guide') renderGuide();
    if (name === 'quality') renderQuality();
    if (RCP.tabs[name]) RCP.tabs[name].render();
    const tb = $(`#tabs [data-tab="${name}"]`); if (tb && tb.scrollIntoView) tb.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (focus) window.scrollTo({ top: 0 });
  }
  $$('#tabs [role=tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab, true)));
  $('#tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.indexOf(tab), n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    showTab(n); $(`#tabs [data-tab="${n}"]`).focus();
  });

  /* ============================== idioma ============================== */
  function refreshLang() {
    document.title = t('title') + ' · Luis Franco Serrano';
    syncControls();
    if (!run.started) { statusEl.textContent = t('ready'); countLabel.textContent = t('compressions'); startBtn.textContent = t('start'); }
    else if (!run.running) { statusEl.textContent = t('paused'); startBtn.textContent = t('resume'); countLabel.textContent = ui.phase === 'vent' ? t('ventilating') : t('compressions'); }
    else { startBtn.textContent = t('pause'); countLabel.textContent = ui.phase === 'vent' ? t('ventilating') : t('compressions'); }
    $('#noAudio').hidden = Aud.audio || !S.sound || !run.started;
    if (tab === 'train') Train.render();
    if (tab === 'guide') renderGuide();
    if (tab === 'quality') renderQuality();
    if (RCP.tabs[tab]) RCP.tabs[tab].render();
  }
  AppKit.onLang(refreshLang);

  /* enlaces entre pestañas (los usan los módulos): RCP.go('metro', { age: 'infant' }) */
  RCP._go = (name, opts) => {
    if (opts && opts.age && AGES.includes(opts.age) && !run.running && opts.age !== S.age) { S.age = opts.age; save(); if (run.started) reset(); else buildTicks(comps()); syncControls(); }
    showTab(name, true);
  };

  /* ============================== arranque ============================== */
  buildTicks(comps()); lit(0);
  statusEl.textContent = t('ready'); countLabel.textContent = t('compressions');
  document.title = t('title') + ' · Luis Franco Serrano';
  syncControls(); refreshStats();
  showTab(store.get('tab', 'metro'));
  AppKit.applyDom();
  RCP.voice.mountAll();

  /* gancho de pruebas (solo lectura del estado; no afecta al uso normal) */
  window.__rcp = { S, ui, run, get tab() { return tab; }, showTab, start, pause, reset, setBpm, Aud };
})();
