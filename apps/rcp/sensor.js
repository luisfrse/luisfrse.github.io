/* Pestaña «Sensor»: feedback de frecuencia y pausas con el acelerómetro (DeviceMotionEvent).
   NO mide profundidad. Todo se procesa en el dispositivo. El algoritmo está en sensor-core.js. */
(() => {
  'use strict';
  const R = window.RCP, esc = AppKit.esc, $ = R.$, T = (k, p) => AppKit.t(k, p);

  R.addI18N({
    es: {
      tabSensor: 'Sensor', snTitle: 'Feedback con el acelerómetro', snIntro: 'Con el móvil sobre la mano de compresión, la aplicación detecta cada compresión y te dice si vas lento, rápido o has hecho pausas largas.',
      snDepthTitle: 'La profundidad NO se puede medir de forma fiable con un móvil', snDepthText: 'Esta herramienta solo evalúa el ritmo (compresiones por minuto) y las pausas. Un buen ritmo no garantiza compresiones de 5–6 cm ni que el pecho se reexpanda: no te dé una falsa seguridad. Úsala solo para entrenar; en una emergencia real, céntrate en comprimir fuerte y rápido y sigue al operador del 112.',
      snPlaceTitle: 'Cómo colocar el móvil', snPlace: ['Pon el móvil plano, con la pantalla hacia arriba, sobre el dorso de la mano con la que comprimes (o fíjalo en el pecho de un maniquí).', 'Sujétalo con la otra mano o con una banda para que se mueva con tu cuerpo y no se caiga.', 'Pulsa «Empezar»; al pedirlo, concede el permiso de movimiento y quédate quieto 2 segundos (calibración).', 'Cuando oigas el pitido, empieza a comprimir. Para terminar, pulsa «Parar».'],
      snStart: 'Empezar', snStop: 'Parar', snDemo: 'Modo demostración', snDemoStop: 'Parar demostración', snDemoHint: 'Sin sensor (por ejemplo en un ordenador) puedes ver cómo funciona con una señal simulada.',
      snAsk: 'Pidiendo permiso…', snWait: 'Buscando el sensor…', snCalib: 'Calibrando: mantén el móvil quieto sobre la mano ({n} s)', snGo: '¡Comprime!', snDemoOn: 'Demostración: señal simulada (110/min con tramos lentos, rápidos y una pausa)',
      snUnavailable: 'No se detecta el acelerómetro en este dispositivo (es normal en un ordenador). Prueba en un móvil o tableta, o usa el modo demostración.',
      snDenied: 'No se ha concedido el permiso de movimiento. En iPhone: Ajustes → Safari → Movimiento y orientación; después recarga la página y vuelve a pulsar «Empezar».',
      snInsecure: 'Los sensores de movimiento solo funcionan en páginas seguras (https). Usa el modo demostración o abre la página con https.',
      snRate: 'compresiones/min', snCount: 'Compresiones', snReg: 'Regularidad', snSince: 'Sin comprimir', snPause: 'Tiempo en pausas', snCcf: 'Fracción de compresión',
      snCcfHint: 'Porcentaje del tiempo que llevas comprimiendo (objetivo: lo más alto posible).', snMeterLbl: 'Frecuencia, objetivo 100–120', snIdleRate: 'Sin datos todavía',
      snOk: 'Ritmo correcto, sigue así', snSlow: 'Ritmo lento: sube a 100–120', snFast: 'Ritmo rápido: baja a 100–120', snLongPause: 'Pausa larga: ¡sigue comprimiendo!', snStarting: 'Empieza a comprimir',
      snSumTitle: 'Resumen', snSumDur: 'Duración', snSumCount: 'Compresiones', snSumAvg: 'Frecuencia media', snSumBand: 'Compresiones en 100–120/min', snSumReg: 'Regularidad', snSumPauses: 'Pausas de más de 2 s', snSumPauseTot: 'Tiempo total en pausas', snSumLongest: 'Pausa más larga', snSumCcf: 'Fracción de compresión',
      snSumNone: 'No se detectaron compresiones. Comprueba que el móvil se mueve con tu mano y repite.', snSumVerdictOk: 'Ritmo medio dentro del objetivo de 100–120/min.', snSumVerdictSlow: 'Ritmo medio por debajo de 100/min.', snSumVerdictFast: 'Ritmo medio por encima de 120/min.',
      snSumDepth: 'Recuerda: no se ha medido la profundidad (5–6 cm en adultos) ni la reexpansión del pecho.', snCopy: 'Copiar resumen', snCsv: 'Descargar CSV', snAgain: 'Nueva medición', snCopied: 'Resumen copiado',
      snLimits: 'Límites: depende del móvil y de cómo lo sujetes; con mucho ruido o movimiento ajeno puede contar de más o de menos.', snSeconds: '{n} s', snFile: 'rcp-sensor', snCsvMetric: 'metrica', snCsvValue: 'valor', snCsvComp: 'compresion_t_s'
    },
    ca: {
      tabSensor: 'Sensor', snTitle: 'Feedback amb l\'acceleròmetre', snIntro: 'Amb el mòbil sobre la mà de compressió, l\'aplicació detecta cada compressió i et diu si vas lent, ràpid o has fet pauses llargues.',
      snDepthTitle: 'La profunditat NO es pot mesurar de manera fiable amb un mòbil', snDepthText: 'Aquesta eina només avalua el ritme (compressions per minut) i les pauses. Un bon ritme no garanteix compressions de 5–6 cm ni que el pit es reexpandeixi: que no et doni una falsa seguretat. Fes-la servir només per entrenar; en una emergència real, centra\'t a comprimir fort i ràpid i segueix l\'operador del 112.',
      snPlaceTitle: 'Com col·locar el mòbil', snPlace: ['Posa el mòbil pla, amb la pantalla cap amunt, sobre el dors de la mà amb la qual comprimeixes (o fixa\'l al pit d\'un maniquí).', 'Subjecta\'l amb l\'altra mà o amb una banda perquè es mogui amb el teu cos i no caigui.', 'Prem «Comença»; quan ho demani, concedeix el permís de moviment i queda\'t quiet 2 segons (calibratge).', 'Quan sentis el xiulet, comença a comprimir. Per acabar, prem «Para».'],
      snStart: 'Comença', snStop: 'Para', snDemo: 'Mode demostració', snDemoStop: 'Para la demostració', snDemoHint: 'Sense sensor (per exemple en un ordinador) pots veure com funciona amb un senyal simulat.',
      snAsk: 'Demanant permís…', snWait: 'Cercant el sensor…', snCalib: 'Calibrant: mantén el mòbil quiet sobre la mà ({n} s)', snGo: 'Comprimeix!', snDemoOn: 'Demostració: senyal simulat (110/min amb trams lents, ràpids i una pausa)',
      snUnavailable: 'No es detecta l\'acceleròmetre en aquest dispositiu (és normal en un ordinador). Prova en un mòbil o tauleta, o fes servir el mode demostració.',
      snDenied: 'No s\'ha concedit el permís de moviment. A l\'iPhone: Ajustos → Safari → Moviment i orientació; després recarrega la pàgina i torna a prémer «Comença».',
      snInsecure: 'Els sensors de moviment només funcionen en pàgines segures (https). Fes servir el mode demostració o obre la pàgina amb https.',
      snRate: 'compressions/min', snCount: 'Compressions', snReg: 'Regularitat', snSince: 'Sense comprimir', snPause: 'Temps en pauses', snCcf: 'Fracció de compressió',
      snCcfHint: 'Percentatge del temps que portes comprimint (objectiu: el més alt possible).', snMeterLbl: 'Freqüència, objectiu 100–120', snIdleRate: 'Encara sense dades',
      snOk: 'Ritme correcte, continua així', snSlow: 'Ritme lent: puja a 100–120', snFast: 'Ritme ràpid: baixa a 100–120', snLongPause: 'Pausa llarga: continua comprimint!', snStarting: 'Comença a comprimir',
      snSumTitle: 'Resum', snSumDur: 'Durada', snSumCount: 'Compressions', snSumAvg: 'Freqüència mitjana', snSumBand: 'Compressions a 100–120/min', snSumReg: 'Regularitat', snSumPauses: 'Pauses de més de 2 s', snSumPauseTot: 'Temps total en pauses', snSumLongest: 'Pausa més llarga', snSumCcf: 'Fracció de compressió',
      snSumNone: 'No s\'han detectat compressions. Comprova que el mòbil es mou amb la teva mà i repeteix.', snSumVerdictOk: 'Ritme mitjà dins de l\'objectiu de 100–120/min.', snSumVerdictSlow: 'Ritme mitjà per sota de 100/min.', snSumVerdictFast: 'Ritme mitjà per sobre de 120/min.',
      snSumDepth: 'Recorda: no s\'ha mesurat la profunditat (5–6 cm en adults) ni la reexpansió del pit.', snCopy: 'Copia el resum', snCsv: 'Descarrega CSV', snAgain: 'Nova mesura', snCopied: 'Resum copiat',
      snLimits: 'Límits: depèn del mòbil i de com el subjectis; amb molt de soroll o moviment aliè pot comptar de més o de menys.', snSeconds: '{n} s', snFile: 'rcp-sensor', snCsvMetric: 'metrica', snCsvValue: 'valor', snCsvComp: 'compressio_t_s'
    },
    en: {
      tabSensor: 'Sensor', snTitle: 'Accelerometer feedback', snIntro: 'With your phone on your compressing hand, the app detects each compression and tells you if you are too slow, too fast or have paused for long.',
      snDepthTitle: 'Depth can NOT be measured reliably with a phone', snDepthText: 'This tool only assesses rate (compressions per minute) and pauses. A good rate does not guarantee 5–6 cm compressions or full chest recoil: do not let it give you false reassurance. Use it for training only; in a real emergency, focus on pushing hard and fast and follow the 112 call-taker.',
      snPlaceTitle: 'Where to put the phone', snPlace: ['Lay the phone flat, screen up, on the back of the hand you compress with (or fix it to the chest of a manikin).', 'Hold it with your other hand or a strap so it moves with your body and does not fall.', 'Press "Start"; when asked, allow motion access and stay still for 2 seconds (calibration).', 'When you hear the beep, start compressing. To finish, press "Stop".'],
      snStart: 'Start', snStop: 'Stop', snDemo: 'Demo mode', snDemoStop: 'Stop demo', snDemoHint: 'With no sensor (for example on a computer) you can see how it works with a simulated signal.',
      snAsk: 'Asking permission…', snWait: 'Looking for the sensor…', snCalib: 'Calibrating: keep the phone still on your hand ({n} s)', snGo: 'Push!', snDemoOn: 'Demo: simulated signal (110/min with slow, fast and paused stretches)',
      snUnavailable: 'No accelerometer detected on this device (normal on a computer). Try a phone or tablet, or use demo mode.',
      snDenied: 'Motion permission was not granted. On iPhone: Settings → Safari → Motion & Orientation; then reload the page and press "Start" again.',
      snInsecure: 'Motion sensors only work on secure pages (https). Use demo mode or open the page over https.',
      snRate: 'compressions/min', snCount: 'Compressions', snReg: 'Regularity', snSince: 'Not compressing', snPause: 'Time paused', snCcf: 'Compression fraction',
      snCcfHint: 'Percentage of time you have been compressing (aim as high as possible).', snMeterLbl: 'Rate, target 100–120', snIdleRate: 'No data yet',
      snOk: 'Good rate, keep going', snSlow: 'Too slow: speed up to 100–120', snFast: 'Too fast: slow down to 100–120', snLongPause: 'Long pause: keep compressing!', snStarting: 'Start compressing',
      snSumTitle: 'Summary', snSumDur: 'Duration', snSumCount: 'Compressions', snSumAvg: 'Average rate', snSumBand: 'Compressions at 100–120/min', snSumReg: 'Regularity', snSumPauses: 'Pauses over 2 s', snSumPauseTot: 'Total time paused', snSumLongest: 'Longest pause', snSumCcf: 'Compression fraction',
      snSumNone: 'No compressions detected. Check that the phone moves with your hand and try again.', snSumVerdictOk: 'Average rate within the 100–120/min target.', snSumVerdictSlow: 'Average rate below 100/min.', snSumVerdictFast: 'Average rate above 120/min.',
      snSumDepth: 'Remember: depth (5–6 cm in adults) and chest recoil were not measured.', snCopy: 'Copy summary', snCsv: 'Download CSV', snAgain: 'New measurement', snCopied: 'Summary copied',
      snLimits: 'Limits: it depends on the phone and how you hold it; with a lot of noise or outside movement it may over- or under-count.', snSeconds: '{n} s', snFile: 'rcp-sensor', snCsvMetric: 'metric', snCsvValue: 'value', snCsvComp: 'compression_t_s'
    }
  });

  const S = { state: 'idle', src: null, det: null, t0: 0, listener: null, tick: 0, demo: 0, calibEnd: 0, summary: null, error: '', lastCue: 0, lastState: '', startedAt: 0, calibTimer: 0 };
  const now = () => performance.now() / 1000;
  const fmtN = (n, d = 0) => (Number.isFinite(n) ? AppKit.fmt(n, d) : '—');
  const mmss = (s) => AppKit.mmss(s);

  const placeSvg = () => `
<svg class="ill" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs><linearGradient id="snbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16304f"/><stop offset="1" stop-color="#2a2a63"/></linearGradient></defs>
<rect width="320" height="200" rx="16" fill="url(#snbg)"/><circle cx="276" cy="26" r="92" fill="#b08be0" opacity=".10"/>
<path d="M14 172H306" stroke="rgba(255,255,255,.2)" stroke-width="2" stroke-linecap="round"/>
<path d="M40 160H270" stroke="#c9b6ea" stroke-width="26" stroke-linecap="round"/><circle cx="288" cy="152" r="14" fill="#e2d4f7"/>
<path d="M90 60V108" stroke="#7fb2ea" stroke-width="15" stroke-linecap="round"/><path d="M130 60V108" stroke="#7fb2ea" stroke-width="15" stroke-linecap="round"/>
<circle cx="70" cy="36" r="17" fill="#7fb2ea"/><path d="M70 52L110 58" stroke="#5a93d1" stroke-width="30" stroke-linecap="round"/>
<rect x="84" y="112" width="52" height="14" rx="6" fill="#e2d4f7"/>
<rect x="78" y="96" width="64" height="16" rx="5" fill="#0d1a2a" stroke="#b08be0" stroke-width="2"/><rect x="84" y="99" width="40" height="10" rx="2" fill="#4ade80" opacity=".85"/>
<path d="M190 52V90" stroke="#f5b82e" stroke-width="4" stroke-linecap="round"/><path d="M180 80L190 92L200 80" stroke="#f5b82e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M196 56V92" stroke="#f5b82e" stroke-width="0"/><path d="M180 40a22 22 0 0 1 28 0" stroke="#b08be0" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="2 6"/>
</svg>`;

  /* ---------- registro de muestras ---------- */
  function feed(t, x, y, z) { if (S.det && (S.state === 'calib' || S.state === 'run')) S.det.push(t, x, y, z); }
  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    S.gotSample = true; feed(now(), a.x, a.y, a.z);
  }

  /* generador para el modo demostración: 40 s en bucle */
  function demoStart() {
    let phase = 0, last = now(), seed = 7; const t0 = last;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    S.demo = setInterval(() => {
      const t = now(), dt = t - last; last = t;
      const e = (t - t0 - 1.5) % 40;                          // 1,5 s de calibración inicial
      const cpm = e < 0 ? 0 : e < 12 ? 110 : e < 20 ? 92 : e < 28 ? 130 : e < 32 ? 0 : 110;
      let a = 0;
      if (cpm) { phase += 2 * Math.PI * (cpm / 60) * dt; a = 4.5 * (Math.sin(phase) + 0.35 * Math.sin(2 * phase + 0.8)); }
      const n = 0.3 * (rnd() + rnd() + rnd() - 1.5);
      feed(t, 0.2 * n, 0.2 * n, 9.81 + a + n);
    }, 20);
  }

  /* ---------- flujo ---------- */
  async function start(src) {
    stopAll(true);
    S.src = src; S.error = ''; S.summary = null; S.gotSample = false;
    S.det = RCPSensor.createDetector();
    if (src === 'sensor') {
      if (!('DeviceMotionEvent' in window)) return fail('snUnavailable');
      if (window.isSecureContext === false) return fail('snInsecure');
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        S.state = 'ask'; render();
        try { const r = await DeviceMotionEvent.requestPermission(); if (r !== 'granted') return fail('snDenied'); } catch (_) { return fail('snDenied'); }
      }
      S.state = 'wait'; render();
      S.listener = onMotion; window.addEventListener('devicemotion', S.listener);
      await new Promise(r => setTimeout(r, 1800));
      if (S.state !== 'wait') return;
      if (!S.gotSample) return fail('snUnavailable');
    } else demoStart();
    S.state = 'calib'; S.det.beginCalibration(); S.calibEnd = now() + (src === 'demo' ? 1.5 : 2.5);
    AppKit.keepAwake(true);
    S.tick = setInterval(update, 100);
    render();
  }
  function fail(key) { stopAll(true); S.state = 'idle'; S.error = key; render(); }

  function stopAll(quiet) {
    clearInterval(S.tick); clearInterval(S.demo);
    if (S.listener) { window.removeEventListener('devicemotion', S.listener); S.listener = null; }
    AppKit.keepAwake(false);
    if (!quiet && S.det && S.state === 'run') { S.summary = S.det.summary(); S.state = 'done'; }
    else if (!quiet) S.state = 'idle';
  }

  function beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = new AC(), o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.4, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.4); o.onended = () => c.close();
    } catch (_) { /* sin audio */ }
  }

  function verdict(s) {
    if (S.state === 'calib') return { k: 'wait', msg: T('snCalib', { n: Math.max(0, Math.ceil(S.calibEnd - now())) }) };
    if (s.ongoingPause > 0) return { k: 'pause', msg: T('snLongPause') };
    if (!Number.isFinite(s.rate)) return { k: 'wait', msg: T('snStarting') };
    if (s.rate < 100) return { k: 'slow', msg: T('snSlow') };
    if (s.rate > 120) return { k: 'fast', msg: T('snFast') };
    return { k: 'ok', msg: T('snOk') };
  }

  function update() {
    if (S.state === 'calib' && now() >= S.calibEnd) {
      S.det.endCalibration(); S.state = 'run'; S.startedAt = now(); S.lastCue = now() + 4; beep(); R.voice.sayKey('vo_start'); render(); return;
    }
    const s = S.det.snapshot(now()), v = verdict(s);
    const set = (id, txt) => { const e = $('#' + id); if (e) e.textContent = txt; };
    if (S.state === 'calib') { const e = $('#snAlert'); if (e) { e.textContent = v.msg; e.className = 'verdict wait'; } return; }
    set('snRateV', Number.isFinite(s.rate) ? Math.round(s.rate) : '—');
    set('snCnt', s.count); set('snReg2', Number.isFinite(s.regularity) ? s.regularity + '%' : '—');
    set('snSince2', s.count ? T('snSeconds', { n: fmtN(s.sinceLast, 1) }) : '—');
    set('snPause2', T('snSeconds', { n: fmtN(s.pauseTotal, 1) })); set('snCcf2', Number.isFinite(s.ccf) ? s.ccf + '%' : '—');
    const al = $('#snAlert'); if (al) { al.textContent = v.msg; al.className = 'verdict ' + v.k; }
    const mk = $('#snMarker'); if (mk) { const r = Number.isFinite(s.rate) ? s.rate : 60; mk.style.left = (AppKit.clamp((r - 60) / 100, 0, 1) * 100).toFixed(1) + '%'; mk.classList.toggle('off', !Number.isFinite(s.rate)); }
    const meter = $('#snMeter'); if (meter) { meter.setAttribute('aria-valuenow', Number.isFinite(s.rate) ? Math.round(s.rate) : 0); }
    /* avisos hablados (como máximo uno cada 8 s) */
    if (S.state === 'run' && now() - S.lastCue > 8 && (v.k === 'slow' || v.k === 'fast' || v.k === 'pause')) {
      S.lastCue = now(); R.voice.sayKey(v.k === 'slow' ? 'vo_faster' : v.k === 'fast' ? 'vo_slower' : 'vo_dontstop');
    }
  }

  /* ---------- resumen ---------- */
  const rows = (m) => [
    ['snSumDur', mmss(m.duration)], ['snSumCount', m.count], ['snSumAvg', Number.isFinite(m.avgRate) ? fmtN(m.avgRate, 0) + ' /min' : '—'],
    ['snSumBand', Number.isFinite(m.pctInBand) ? m.pctInBand + '%' : '—'], ['snSumReg', Number.isFinite(m.regularity) ? m.regularity + '%' : '—'],
    ['snSumPauses', m.pauseCount], ['snSumPauseTot', T('snSeconds', { n: fmtN(m.pauseTotal, 1) })], ['snSumLongest', T('snSeconds', { n: fmtN(m.longestPause, 1) })],
    ['snSumCcf', Number.isFinite(m.ccf) ? m.ccf + '%' : '—']
  ];
  const summaryText = (m) => `${T('snTitle')}\n` + rows(m).map(([k, v]) => `${T(k)}: ${v}`).join('\n') + `\n${T('snSumDepth')}`;
  const verdictOf = (m) => (!Number.isFinite(m.avgRate) ? '' : m.avgRate < 100 ? T('snSumVerdictSlow') : m.avgRate > 120 ? T('snSumVerdictFast') : T('snSumVerdictOk'));

  function summaryHtml() {
    const m = S.summary;
    if (!m.count) return `<div class="panel"><h2>${esc(T('snSumTitle'))}</h2><p class="callout warn">${esc(T('snSumNone'))}</p><button type="button" class="btn" id="snAgain">${esc(T('snAgain'))}</button></div>`;
    return `<div class="panel"><h2>${esc(T('snSumTitle'))}</h2>
      <div class="sum-grid">${rows(m).map(([k, v]) => `<div class="stat"><b>${esc(String(v))}</b><span>${esc(T(k))}</span></div>`).join('')}</div>
      <p><b>${esc(verdictOf(m))}</b></p>
      <p class="callout warn">${esc(T('snSumDepth'))}</p>
      <div class="row"><button type="button" class="btn" id="snCopy">${esc(T('snCopy'))}</button><button type="button" class="btn ghost" id="snCsv">${esc(T('snCsv'))}</button><button type="button" class="btn ghost" id="snAgain">${esc(T('snAgain'))}</button></div></div>`;
  }

  /* ---------- pintado ---------- */
  function render() {
    const root = $('#sensorRoot'); if (!root) return;
    const active = S.state === 'calib' || S.state === 'run', busy = active || S.state === 'ask' || S.state === 'wait';
    const status = S.state === 'ask' ? T('snAsk') : S.state === 'wait' ? T('snWait') : '';
    const live = active ? `
      <div class="panel live">
        <div class="rate-box"><div class="big" id="snRateV">—</div><small>${esc(T('snRate'))}</small></div>
        <div class="meter2" id="snMeter" role="meter" aria-label="${esc(T('snMeterLbl'))}" aria-valuemin="60" aria-valuemax="160" aria-valuenow="0"><div class="band"></div><i class="marker off" id="snMarker"></i>
          <div class="ticks" aria-hidden="true"><span style="left:0">60</span><span style="left:40%">100</span><span style="left:60%">120</span><span style="left:100%">160</span></div></div>
        <div class="row" style="justify-content:center"><span class="verdict wait" id="snAlert" role="status" aria-live="polite">${esc(S.state === 'calib' ? T('snCalib', { n: 3 }) : T('snStarting'))}</span></div>
        <div class="live-stats">
          <div class="stat"><b id="snCnt">0</b><span>${esc(T('snCount'))}</span></div>
          <div class="stat"><b id="snReg2">—</b><span>${esc(T('snReg'))}</span></div>
          <div class="stat"><b id="snSince2">—</b><span>${esc(T('snSince'))}</span></div>
          <div class="stat"><b id="snPause2">0 s</b><span>${esc(T('snPause'))}</span></div>
          <div class="stat wide"><b id="snCcf2">—</b><span>${esc(T('snCcf'))}</span><small>${esc(T('snCcfHint'))}</small></div>
        </div>
        ${S.src === 'demo' ? `<p class="callout">${esc(T('snDemoOn'))}</p>` : ''}
        <div class="row" style="justify-content:center"><button type="button" class="btn big" id="snStop2">${esc(T('snStop'))}</button></div>
      </div>` : '';
    root.innerHTML = `
      <div class="callout danger" role="note"><b>${esc(T('snDepthTitle'))}</b><span>${esc(T('snDepthText'))}</span></div>
      <div class="sensor-grid ${active || S.state === 'done' ? 'running' : ''}">
        <div class="stack">
          <div class="panel">
            <h2>${esc(T('snTitle'))}</h2><p class="muted">${esc(T('snIntro'))}</p>
            ${placeSvg()}
            <h3 style="margin-top:14px">${esc(T('snPlaceTitle'))}</h3>
            <ol class="plain-steps">${T('snPlace').map(x => `<li>${esc(x)}</li>`).join('')}</ol>
            <div class="row">
              <button type="button" class="btn big" id="snStart" ${S.state === 'ask' || S.state === 'wait' ? 'disabled' : ''}>${esc(active && S.src === 'sensor' ? T('snStop') : T('snStart'))}</button>
              <button type="button" class="btn ghost" id="snDemo" ${busy && !(active && S.src === 'demo') ? 'disabled' : ''}>${esc(active && S.src === 'demo' ? T('snDemoStop') : T('snDemo'))}</button>
            </div>
            <p class="muted" style="margin:10px 0 0" role="status" id="snStatus">${esc(status)}</p>
            ${S.error ? `<p class="callout warn" role="alert">${esc(T(S.error))}</p>` : ''}
            <small class="muted">${esc(T('snDemoHint'))} ${esc(T('snLimits'))}</small>
          </div>
        </div>
        <div class="stack">${live}${S.state === 'done' && S.summary ? summaryHtml() : ''}${!active && S.state !== 'done' ? `<div class="panel empty-live"><p class="muted" style="margin:0">${esc(T('snIdleRate'))}</p></div>` : ''}</div>
      </div>`;
    $('#snStart').addEventListener('click', () => { if (active && S.src === 'sensor') finish(); else start('sensor'); });
    $('#snDemo').addEventListener('click', () => { if (active && S.src === 'demo') finish(); else start('demo'); });
    const s2 = $('#snStop2'); if (s2) s2.addEventListener('click', finish);
    const again = $('#snAgain'); if (again) again.addEventListener('click', () => { S.state = 'idle'; S.summary = null; render(); });
    const cp = $('#snCopy'); if (cp) cp.addEventListener('click', async () => { if (await R.copy(summaryText(S.summary))) AppKit.toast(T('snCopied')); });
    const cs = $('#snCsv'); if (cs) cs.addEventListener('click', () => {
      const m = S.summary;
      const lines = [[T('snCsvMetric'), T('snCsvValue')], ...rows(m).map(([k, v]) => [T(k), v]), [], [T('snCsvComp')], ...m.peaks.map(p => [(p - m.peaks[0]).toFixed(2)])];
      AppKit.download(T('snFile') + '.csv', AppKit.toCSV(lines), 'text/csv;charset=utf-8');
    });
    if (active) update();
  }
  function finish() { R.voice.cancel(); const wasRun = S.state === 'run'; stopAll(false); if (!wasRun) S.state = 'idle'; render(); R.voice.sayKey('vo_end'); }

  R.tabs.sensor = { render, leave() { if (S.state === 'calib' || S.state === 'run' || S.state === 'ask' || S.state === 'wait') { stopAll(true); S.state = 'idle'; } } };
  R.sensor = { feed, get state() { return S.state; }, get summary() { return S.summary; }, finish };      // gancho de pruebas
})();
