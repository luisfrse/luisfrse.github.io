/* «Entrena tu ritmo» · modo «RCP completo (evaluación)».
   Evalúa una reanimación completa tocando la pantalla: frecuencia (100–120/min), regularidad, pausas, reparto de ciclos
   (30:2 adulto; 15:2 niño y lactante tras 5 insuflaciones iniciales, ERC 2025) y ventilaciones (momento, número, pausa ≤ 10 s).
   Reutiliza el motor de sensor-core.js (createCycler, evaluate, metricsFromTimes) y el informe de sensor.js (R.sensorUi).
   Con el acelerómetro se hace lo mismo en la pestaña «Sensor» (opción «Entreno completo»). Todo se procesa en el dispositivo. */
(() => {
  'use strict';
  const R = window.RCP, esc = AppKit.esc, $ = R.$, T = (k, p) => AppKit.t(k, p);

  R.addI18N({
    es: {
      trModeRhythm: 'Solo ritmo', trModeFull: 'RCP completo (evaluación)', trModeLbl: 'Modo de entrenamiento',
      trFullTitle: 'Evaluación de RCP completa', trFullIntro: 'Simula una reanimación entera y la aplicación la evalúa: frecuencia y regularidad de las compresiones, pausas, reparto de ciclos (30:2 o 15:2), insuflaciones iniciales en niños y lactantes y tiempo de cada pausa para ventilar. Toca el botón grande en cada compresión y «Insuflación» en cada ventilación.',
      trPatient: 'Paciente', trStart: 'Empezar la evaluación', trFinish: 'Terminar y ver el informe', trAgain: 'Nueva evaluación',
      trSensorTip: '¿Prefieres medir con el acelerómetro del móvil? La pestaña «Sensor» hace esta misma evaluación (activa «Entreno completo»).', trSensorGo: 'Ir a Sensor',
      trInitMsg: 'Da primero las 5 insuflaciones iniciales ({k}/5) y después empieza a comprimir', trInitBtn: 'Insuflación inicial {k}/5',
      trCompStart: 'Empieza a comprimir', trCompOnly: 'Solo compresiones: sin ventilaciones. Toca el botón grande al ritmo de 100–120/min.',
      trNudge: 'Llevas más de 10 s parado: da ya las 2 insuflaciones o sigue comprimiendo', trRun: 'Evaluando…',
      trVentTitle: 'Pausas para ventilar', trVentLine: 'Pausa {i}: {s} s', trVentLong: 'Más larga: {s} s (objetivo ≤ 10 s)', trVentNone: 'No se hizo ninguna pausa para ventilar.',
      trTipsTitle: 'Cómo mejorar', trTipsOk: 'Todo en orden: mantén esta técnica y repite para fijarla. Recuerda que aquí no se mide la profundidad (5–6 cm en adultos).',
      trTips: {
        none: 'No se registró ninguna compresión: toca el botón grande en cada compresión.',
        few: 'Entrena al menos 2 ciclos completos (60 compresiones en adulto, 30 en niño o lactante) para que la evaluación sea fiable.',
        slow: 'Vas por debajo de 100/min: sube el ritmo; ayúdate con la guía sonora del Metrónomo a 110/min.',
        fast: 'Vas por encima de 120/min: baja el ritmo; con prisa se comprime menos hondo y el pecho no se reexpande.',
        band: 'Pasas poco tiempo entre 100 y 120/min: busca un ritmo constante, por ejemplo al compás de 110/min.',
        irreg: 'Ritmo irregular: intenta que el intervalo entre compresiones sea siempre el mismo; practica con la guía sonora.',
        pause: 'Evita las pausas de más de 2 s fuera de las ventilaciones: cada segundo sin comprimir baja la presión de perfusión.',
        pause10: 'Hubo pausas de más de 10 s: las interrupciones deben ser lo más cortas posible (ERC: menos de 10 s).',
        ccf: 'Pasas mucho tiempo sin comprimir: retoma las compresiones inmediatamente después de cada pausa.',
        short: 'Ventilaste antes de completar el ciclo: cuenta en voz alta hasta {n} y solo entonces da las 2 insuflaciones.',
        compBreath: 'Comprimiste mientras tocaba ventilar: al llegar a {n} compresiones para, da las 2 insuflaciones y vuelve a comprimir.',
        omit: 'Faltaron insuflaciones: tras cada serie de {n} compresiones van 2 insuflaciones (o pulsa «Solo compresiones» si no las vas a dar).',
        late: 'Tardaste más de 10 s en empezar a ventilar: prepara la apertura de vía aérea y da las 2 insuflaciones en menos de 10 s en total.',
        initOmit: 'Niño y lactante: antes de comprimir se dan 5 insuflaciones iniciales (ERC 2025). Empieza siempre por ellas.',
        cycle: 'Repasa el registro de ciclos: en cada uno deben sumar {n} compresiones y 2 insuflaciones, sin comprimir durante las insuflaciones.',
        vent: 'Alguna pausa para ventilar superó los 10 s: practica la secuencia «2 insuflaciones y volver a comprimir» para acortarla.'
      },
      trHist: 'Historial de evaluaciones de RCP completa', trHistEmpty: 'Aún no hay evaluaciones completas guardadas.', trHistClear: 'Borrar historial', trHistBest: 'Mejor', trHistCleared: 'Historial borrado', trSaved: 'Evaluación guardada',
      trCycOk: '{a}/{b} ciclos'
    },
    ca: {
      trModeRhythm: 'Només ritme', trModeFull: 'RCP completa (avaluació)', trModeLbl: 'Mode d\'entrenament',
      trFullTitle: 'Avaluació de RCP completa', trFullIntro: 'Simula una reanimació sencera i l\'aplicació l\'avalua: freqüència i regularitat de les compressions, pauses, repartiment de cicles (30:2 o 15:2), insuflacions inicials en infants i lactants i temps de cada pausa per ventilar. Toca el botó gran a cada compressió i «Insuflació» a cada ventilació.',
      trPatient: 'Pacient', trStart: 'Comença l\'avaluació', trFinish: 'Acaba i mira l\'informe', trAgain: 'Nova avaluació',
      trSensorTip: 'Prefereixes mesurar amb l\'acceleròmetre del mòbil? La pestanya «Sensor» fa aquesta mateixa avaluació (activa «Entrenament complet»).', trSensorGo: 'Ves a Sensor',
      trInitMsg: 'Fes primer les 5 insuflacions inicials ({k}/5) i després comença a comprimir', trInitBtn: 'Insuflació inicial {k}/5',
      trCompStart: 'Comença a comprimir', trCompOnly: 'Només compressions: sense ventilacions. Toca el botó gran al ritme de 100–120/min.',
      trNudge: 'Fa més de 10 s que estàs aturat: fes ja les 2 insuflacions o continua comprimint', trRun: 'Avaluant…',
      trVentTitle: 'Pauses per ventilar', trVentLine: 'Pausa {i}: {s} s', trVentLong: 'Més llarga: {s} s (objectiu ≤ 10 s)', trVentNone: 'No s\'ha fet cap pausa per ventilar.',
      trTipsTitle: 'Com millorar', trTipsOk: 'Tot en ordre: mantén aquesta tècnica i repeteix per fixar-la. Recorda que aquí no es mesura la profunditat (5–6 cm en adults).',
      trTips: {
        none: 'No s\'ha registrat cap compressió: toca el botó gran a cada compressió.',
        few: 'Entrena almenys 2 cicles complets (60 compressions en adult, 30 en infant o lactant) perquè l\'avaluació sigui fiable.',
        slow: 'Vas per sota de 100/min: puja el ritme; ajuda\'t amb la guia sonora del Metrònom a 110/min.',
        fast: 'Vas per sobre de 120/min: baixa el ritme; amb pressa es comprimeix menys fons i el pit no es reexpandeix.',
        band: 'Passes poc temps entre 100 i 120/min: busca un ritme constant, per exemple al compàs de 110/min.',
        irreg: 'Ritme irregular: intenta que l\'interval entre compressions sigui sempre el mateix; practica amb la guia sonora.',
        pause: 'Evita les pauses de més de 2 s fora de les ventilacions: cada segon sense comprimir baixa la pressió de perfusió.',
        pause10: 'Hi ha hagut pauses de més de 10 s: les interrupcions han de ser el més curtes possible (ERC: menys de 10 s).',
        ccf: 'Passes molt de temps sense comprimir: reprèn les compressions immediatament després de cada pausa.',
        short: 'Has ventilat abans de completar el cicle: compta en veu alta fins a {n} i només llavors fes les 2 insuflacions.',
        compBreath: 'Has comprimit quan tocava ventilar: en arribar a {n} compressions para, fes les 2 insuflacions i torna a comprimir.',
        omit: 'Han faltat insuflacions: després de cada sèrie de {n} compressions van 2 insuflacions (o marca «Només compressions» si no les faràs).',
        late: 'Has trigat més de 10 s a començar a ventilar: prepara l\'obertura de la via aèria i fes les 2 insuflacions en menys de 10 s en total.',
        initOmit: 'Infant i lactant: abans de comprimir es fan 5 insuflacions inicials (ERC 2025). Comença sempre per elles.',
        cycle: 'Repassa el registre de cicles: a cadascun han de sumar {n} compressions i 2 insuflacions, sense comprimir durant les insuflacions.',
        vent: 'Alguna pausa per ventilar ha superat els 10 s: practica la seqüència «2 insuflacions i tornar a comprimir» per escurçar-la.'
      },
      trHist: 'Historial d\'avaluacions de RCP completa', trHistEmpty: 'Encara no hi ha avaluacions completes desades.', trHistClear: 'Esborra l\'historial', trHistBest: 'Millor', trHistCleared: 'Historial esborrat', trSaved: 'Avaluació desada',
      trCycOk: '{a}/{b} cicles'
    },
    en: {
      trModeRhythm: 'Rhythm only', trModeFull: 'Full CPR (assessment)', trModeLbl: 'Training mode',
      trFullTitle: 'Full CPR assessment', trFullIntro: 'Simulate a whole resuscitation and the app assesses it: compression rate and steadiness, pauses, cycle split (30:2 or 15:2), initial breaths in children and infants, and how long each ventilation pause takes. Tap the big button for each compression and "Breath" for each ventilation.',
      trPatient: 'Patient', trStart: 'Start the assessment', trFinish: 'Finish and see the report', trAgain: 'New assessment',
      trSensorTip: 'Prefer to measure with the phone accelerometer? The "Sensor" tab does this same assessment (turn on "Full training").', trSensorGo: 'Go to Sensor',
      trInitMsg: 'First give the 5 initial breaths ({k}/5), then start compressing', trInitBtn: 'Initial breath {k}/5',
      trCompStart: 'Start compressing', trCompOnly: 'Compressions only: no breaths. Tap the big button at 100–120/min.',
      trNudge: 'You have been stopped for over 10 s: give the 2 breaths now or keep compressing', trRun: 'Assessing…',
      trVentTitle: 'Ventilation pauses', trVentLine: 'Pause {i}: {s} s', trVentLong: 'Longest: {s} s (target ≤ 10 s)', trVentNone: 'No ventilation pause was made.',
      trTipsTitle: 'How to improve', trTipsOk: 'All good: keep this technique and repeat to lock it in. Remember depth (5–6 cm in adults) is not measured here.',
      trTips: {
        none: 'No compressions were recorded: tap the big button for each compression.',
        few: 'Train at least 2 full cycles (60 compressions in an adult, 30 in a child or infant) so the assessment is reliable.',
        slow: 'You are below 100/min: speed up; use the Metronome sound guide at 110/min to help.',
        fast: 'You are above 120/min: slow down; when rushing you press less deeply and the chest does not recoil.',
        band: 'You spend little time between 100 and 120/min: aim for a steady rate, for example to the beat of 110/min.',
        irreg: 'Irregular rhythm: try to keep the interval between compressions identical; practise with the sound guide.',
        pause: 'Avoid pauses over 2 s outside ventilations: every second without compressing lowers perfusion pressure.',
        pause10: 'There were pauses over 10 s: interruptions must be as short as possible (ERC: under 10 s).',
        ccf: 'You spend a lot of time not compressing: restart compressions immediately after every pause.',
        short: 'You ventilated before finishing the cycle: count aloud to {n} and only then give the 2 breaths.',
        compBreath: 'You compressed when it was time to ventilate: at {n} compressions stop, give the 2 breaths and resume compressing.',
        omit: 'Breaths were missing: after every {n} compressions give 2 breaths (or choose "Compressions only" if you will not give them).',
        late: 'You took over 10 s to start ventilating: get the airway opening ready and give the 2 breaths in under 10 s in total.',
        initOmit: 'Child and infant: before compressing, give 5 initial breaths (ERC 2025). Always start with them.',
        cycle: 'Review the cycle log: each cycle must add up to {n} compressions and 2 breaths, with no compressions during the breaths.',
        vent: 'A ventilation pause exceeded 10 s: practise the "2 breaths and straight back to compressions" sequence to shorten it.'
      },
      trHist: 'Full CPR assessment history', trHistEmpty: 'No full assessments saved yet.', trHistClear: 'Clear history', trHistBest: 'Best', trHistCleared: 'History cleared', trSaved: 'Assessment saved',
      trCycOk: '{a}/{b} cycles'
    }
  });

  const store = AppKit.storage('rcp');
  const CFG = Object.assign({ mode: 'rhythm', age: 'adult', comp: false }, store.get('trainFullCfg', {}));
  const saveCfg = () => store.set('trainFullCfg', CFG);
  const hist = () => store.get('trainFullHist', []);
  const S = { state: 'idle', cy: null, times: [], tick: 0, rep: null, nudged: false, lastEv: '' };
  const now = () => performance.now() / 1000;
  const nOf = () => (CFG.comp ? 0 : CFG.age === 'adult' ? 30 : 15);
  const initOf = () => (CFG.comp || CFG.age === 'adult' ? 0 : 5);
  const running = () => S.state === 'run';
  const inFull = () => CFG.mode === 'full';

  /* ---------- modo (barra superior) ---------- */
  function renderBar() {
    const bar = $('#trainModeBar'); if (!bar) return;
    bar.innerHTML = `<div class="seg" role="group" aria-label="${esc(T('trModeLbl'))}">
      <button type="button" data-m="rhythm" aria-pressed="${!inFull()}">${esc(T('trModeRhythm'))}</button>
      <button type="button" data-m="full" aria-pressed="${inFull()}">${esc(T('trModeFull'))}</button></div>`;
    bar.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (running()) stop(true); CFG.mode = b.dataset.m; saveCfg(); render(); }));
  }
  function applyMode() {
    const g = $('.train-grid'), f = $('#trainFullRoot');
    if (g) g.hidden = inFull();
    if (f) f.hidden = !inFull();
  }

  /* ---------- avisos ---------- */
  function beep(freq, vol) { if (R.sensorUi) R.sensorUi.beep(freq, vol); }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (_) { /* sin vibración */ } }

  /* ---------- flujo ---------- */
  function start() {
    R.voice.unlock();
    S.cy = RCPSensor.createCycler({ n: nOf(), init: initOf() });
    S.times = []; S.rep = null; S.nudged = false; S.state = 'run'; S.t0 = now();
    AppKit.keepAwake(true);
    clearInterval(S.tick); S.tick = setInterval(update, 100);
    render();
    R.voice.sayKey(initOf() ? 'vo_init' : 'vo_start');
  }
  function stop(quiet) {
    clearInterval(S.tick); S.tick = 0; AppKit.keepAwake(false); R.voice.cancel();
    if (quiet) { S.state = 'idle'; return; }
    S.cy.finish(now());
    const m = RCPSensor.metricsFromTimes(S.times), cyRes = S.cy.result(), ev = RCPSensor.evaluate(m, cyRes);
    const vent = cyRes.windows.map(w => w.e - w.s).filter(x => x > 0);
    S.rep = { m, ev, cy: cyRes, vent, age: CFG.age, n: S.cy.n };
    S.state = 'done';
    if (m.count) {
      const h = hist(); h.unshift({ ts: Date.now(), score: ev.score, n: m.count, bpm: Math.round(m.avgRate) || 0, age: CFG.age, comp: !S.cy.n, ok: cyRes.cycles.filter(c => c.ok).length, cyc: cyRes.cycles.length }); store.set('trainFullHist', h.slice(0, 30));
      AppKit.toast(T('trSaved'));
    }
    render(); R.voice.sayKey('vo_end');
  }
  function tapComp() {
    if (!running()) return;
    const t = now(), ev = S.cy.comp(t);
    if (ev === 'ignored') return;
    S.times.push(t);
    if (ev === 'breath') { beep(1100); buzz(60); R.voice.sayKey('vo_breaths'); S.nudged = false; }
    update();
  }
  function tapBreath() {
    if (!running() || !S.cy.n && !S.cy.init) return;
    const ev = S.cy.breath(now());
    if (ev === 'ignored') return;
    beep(520, 0.3);
    if (ev === 'cycle') R.voice.sayKey('vo_resume'); else if (ev === 'initDone') R.voice.sayKey('vo_start');
    update();
  }

  /* ---------- pintado en vivo ---------- */
  function update() {
    const c = S.cy; if (!c || !running()) return;
    if (c.tick(now()) === 'nudge') { S.nudged = true; beep(700, 0.4); buzz(120); R.voice.sayKey('vo_breaths'); }
    const box = $('#trBox'); if (!box) return;
    const n = c.n, st = c.state, ivs = S.times.slice(-7).map((v, i, a) => (i ? v - a[i - 1] : 0)).slice(1).filter(d => d < 2);
    box.classList.toggle('breath', st === 'breath' || st === 'init');
    $('#trCount').textContent = st === 'init' ? `${c.ib}/${c.init}` : n ? `${c.count}/${n}` : String(S.times.length);
    $('#trLbl').textContent = st === 'init' ? T('trInitBtn', { k: Math.min(c.init, c.ib + 1) }) : st === 'breath' ? T('cpBreathNow', { n }) : T('cpTap');
    const br = $('#trBreath'); br.hidden = !(n || c.init);
    br.textContent = st === 'init' ? T('trInitBtn', { k: Math.min(c.init, c.ib + 1) }) : st === 'breath' ? T('cpBreathK', { k: Math.min(2, c.breaths + 1) }) : T('cpBreath');
    br.classList.toggle('pulse', st === 'breath' || st === 'init');
    $('#trBar').style.width = (st === 'init' ? c.ib / c.init * 100 : n ? Math.min(100, c.count / n * 100) : 0) + '%';
    const rb = $('#trBpm');
    if (st === 'init') { rb.textContent = T('trInitMsg', { k: Math.min(c.init, c.ib + 1) }); rb.className = 'cpr-bpm'; }
    else if (st === 'breath') { rb.textContent = S.nudged ? T('trNudge') : T('cpBreathNow', { n }); rb.className = 'cpr-bpm bad'; }
    else if (ivs.length >= 3 && performance.now() / 1000 - S.times[S.times.length - 1] < 3) {
      const bpm = Math.round(60 / (ivs.reduce((a, b) => a + b, 0) / ivs.length)), ok = bpm >= 100 && bpm <= 120;
      rb.textContent = `${bpm}/min · ${T(ok ? 'cpGood' : bpm < 100 ? 'cpSlow' : 'cpFast')}`; rb.className = 'cpr-bpm ' + (ok ? 'ok' : 'bad');
    } else { rb.textContent = T('trCompStart'); rb.className = 'cpr-bpm'; }
    $('#trTime').textContent = AppKit.mmss(now() - S.t0);
  }

  /* ---------- informe ---------- */
  function tipsHtml(rep) {
    const ev = rep.ev, tips = T('trTips'), keys = Object.keys(ev.errs).filter(k => ev.errs[k] > 0 && tips[k]);
    if (rep.vent.some(x => x > 10) && !keys.includes('late') && !keys.includes('pause10')) keys.push('vent');
    const n = rep.n || 30;
    return `<h3>${esc(T('trTipsTitle'))}</h3>` + (keys.length
      ? `<ul class="mistakes tips">${keys.map(k => `<li><span aria-hidden="true">→</span>${esc(tips[k].replace('{n}', n))}</li>`).join('')}</ul>`
      : `<p class="callout ok">${esc(T('trTipsOk'))}</p>`);
  }
  function ventHtml(rep) {
    if (!rep.n) return '';
    if (!rep.vent.length) return `<h3>${esc(T('trVentTitle'))}</h3><p class="muted">${esc(T('trVentNone'))}</p>`;
    const mx = Math.max(...rep.vent);
    return `<h3>${esc(T('trVentTitle'))}</h3><ol class="evlog">${rep.vent.map((x, i) => `<li class="${x > 10 ? 'err' : ''}"><time>#${i + 1}</time><span>${esc(T('trVentLine', { i: i + 1, s: AppKit.fmt(x, 1) }))}</span></li>`).join('')}</ol>
      <p class="muted" style="margin:6px 0 0">${esc(T('trVentLong', { s: AppKit.fmt(mx, 1) }))}</p>`;
  }
  function reportText(rep) {
    const U = R.sensorUi, ev = rep.ev;
    return `${T('trFullTitle')} · ${T('tabTrain')}\n${T('evScore')}: ${ev.score}/100 — ${T('evVerdict')[ev.verdict]}\n` + U.rows(rep.m, ev, rep.cy).map(([k, v]) => `${T(k)}: ${v}`).join('\n')
      + (U.errList(ev).length ? `\n${T('evErrors')}:\n` + U.errList(ev).map(k => `✕ ${T('snErr')[k]}${ev.errs[k] > 1 ? ' ×' + ev.errs[k] : ''}`).join('\n') : '')
      + (rep.cy.cycles.length ? `\n${T('snCycTitle')}:\n` + rep.cy.cycles.map(U.cycText).join('\n') : '') + `\n${T('snSumDepth')}`;
  }
  function histHtml() {
    const h = hist();
    if (!h.length) return `<div class="panel"><h2>${esc(T('trHist'))}</h2><p class="muted" style="margin:0">${esc(T('trHistEmpty'))}</p></div>`;
    return `<div class="panel"><div class="row spread"><h2 style="margin:0">${esc(T('trHist'))}</h2><span class="chip">${esc(T('trHistBest'))}: ${Math.max(...h.map(x => x.score))}/100</span></div>
      <ul class="hist-list" style="margin-top:12px">${h.slice(0, 8).map(x => `<li><div>${esc(AppKit.fmtDate(x.ts, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}<small class="muted">${x.n} · ${x.bpm}/min · ${esc(T('snAges')[x.age])}${x.cyc ? ' · ' + esc(T('trCycOk', { a: x.ok, b: x.cyc })) : ''}</small></div>
        <span class="chip ${x.score >= 90 ? 'accent' : ''}">${x.score}/100</span></li>`).join('')}</ul>
      <div class="row" style="margin-top:12px"><button type="button" class="btn ghost small danger" id="trHistClear">${esc(T('trHistClear'))}</button></div></div>`;
  }

  /* ---------- vista ---------- */
  function render() {
    renderBar(); applyMode();
    const root = $('#trainFullRoot'); if (!root || !inFull()) return;
    const run = running(), n = nOf(), init = initOf();
    const cfgPanel = `<div class="panel">
        <h2>${esc(T('trFullTitle'))}</h2><p class="muted">${esc(T('trFullIntro'))}</p>
        <div class="field-row"><div><b>${esc(T('trPatient'))}</b></div>
          <div class="seg" id="trAge" role="group" aria-label="${esc(T('trPatient'))}">${['adult', 'child', 'infant'].map(k => `<button type="button" data-a="${k}" aria-pressed="${CFG.age === k}"${run ? ' disabled' : ''}>${esc(T('snAges')[k])}</button>`).join('')}</div></div>
        <div class="field-row"><div><b>${esc(T('handsOnly'))}</b><small>${esc(T('handsOnlyHint'))}</small></div>
          <label class="check"><input type="checkbox" id="trComp"${CFG.comp ? ' checked' : ''}${run ? ' disabled' : ''}><span class="sr-only">${esc(T('handsOnly'))}</span></label></div>
        <p class="callout info" style="margin:10px 0"><span>${esc(T('tech')[CFG.age])}</span>${CFG.comp ? `<b>${esc(T('trCompOnly'))}</b>` : CFG.age !== 'adult' ? `<b>${esc(T('snRem15'))}</b>` : ''}</p>
        ${run ? '' : `<button type="button" class="btn big" id="trStart">${esc(T('trStart'))}</button>`}
      </div>
      <div class="panel settings voice-panel" data-voice-ctl></div>
      <div class="panel"><small class="muted" style="display:block;margin-bottom:8px">${esc(T('trSensorTip'))}</small><button type="button" class="btn ghost small" id="trSensorGo">${esc(T('trSensorGo'))}</button></div>`;
    const live = run ? `<div class="panel">
        <div class="cpr-box${S.cy.state === 'breath' || S.cy.state === 'init' ? ' breath' : ''}" id="trBox">
          <div class="cpr-row">
            <button type="button" class="cpr-tap" id="trTap"><b id="trCount">0</b><span id="trLbl"></span></button>
            <div class="cpr-side"><div class="cpr-bpm" id="trBpm" aria-live="off"></div><div class="cpr-bar" aria-hidden="true"><i id="trBar"></i></div><button type="button" class="btn" id="trBreath"></button></div>
          </div>
          <p class="cpr-keys muted">${esc(T('cpKeys'))}</p>
        </div>
        <div class="row spread" style="margin-top:12px"><span class="chip" id="trTime">0:00</span><button type="button" class="btn" id="trFinish">${esc(T('trFinish'))}</button></div>
      </div>` : '';
    let res = '';
    if (S.state === 'done' && S.rep) {
      const rep = S.rep;
      res = !rep.m.count
        ? `<div class="panel"><h2>${esc(T('snSumTitle'))}</h2><p class="callout warn">${esc(T('trTips').none)}</p><button type="button" class="btn" id="trAgain">${esc(T('trAgain'))}</button></div>`
        : `<div class="panel eval">${R.sensorUi.reportBody(rep.m, rep.ev, rep.cy, ventHtml(rep) + tipsHtml(rep))}
          <div class="row"><button type="button" class="btn" id="trCopy">${esc(T('snCopy'))}</button><button type="button" class="btn ghost" id="trAgain">${esc(T('trAgain'))}</button></div></div>`;
    }
    root.innerHTML = `<div class="train-grid"><div class="stack">${cfgPanel}</div><div class="stack">${live}${res}${run ? '' : histHtml()}</div></div>`;
    root.querySelectorAll('[data-voice-ctl]').forEach(R.voice.mount);
    root.querySelectorAll('#trAge button').forEach(b => b.addEventListener('click', () => { CFG.age = b.dataset.a; saveCfg(); S.state = 'idle'; S.rep = null; render(); }));
    const cp = $('#trComp'); if (cp) cp.addEventListener('change', () => { CFG.comp = cp.checked; saveCfg(); S.state = 'idle'; S.rep = null; render(); });
    const go = (id, f) => { const e = $(id); if (e) e.addEventListener('click', f); };
    go('#trStart', start); go('#trFinish', () => stop(false)); go('#trSensorGo', () => R.go('sensor'));
    go('#trAgain', () => { S.state = 'idle'; S.rep = null; render(); });
    go('#trCopy', async () => { if (await R.copy(reportText(S.rep))) AppKit.toast(T('snCopied')); });
    go('#trHistClear', async () => { if (await AppKit.confirm(T('trHistClear') + '?', { okText: T('trHistClear'), danger: true })) { store.remove('trainFullHist'); render(); AppKit.toast(T('trHistCleared')); } });
    const tp = $('#trTap'); if (tp) tp.addEventListener('pointerdown', e => { e.preventDefault(); tapComp(); });
    const tb = $('#trBreath'); if (tb) tb.addEventListener('pointerdown', e => { e.preventDefault(); tapBreath(); });
    if (run) update();
  }

  document.addEventListener('keydown', e => {
    if (!inFull() || !running() || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const tp = document.getElementById('tab-train'); if (!tp || tp.hidden) return;
    if (e.target.closest && e.target.closest('input,select,textarea,a,[role="tab"]')) return;
    if (e.code === 'Space') { e.preventDefault(); tapComp(); }
    else if (e.key === 'b' || e.key === 'B') { e.preventDefault(); tapBreath(); }
  });

  R.tabs.train = { render, leave() { if (running()) stop(true); } };
  R.trainFull = { S, CFG, tapComp, tapBreath, start, stop };      // gancho de pruebas
})();
