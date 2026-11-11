/* ============================================================
   Orden de pasos: lavado de manos, EPI y 5 momentos de la OMS.
   Todo se ejecuta en el navegador. El contenido está en data/secuencias.json.
   ============================================================ */
(() => {
  'use strict';
  const K = window.AppKit;
  const store = K.storage('pasos');

  /* ---------- textos de la interfaz ---------- */
  const I18N = {
    es: {
      title: 'Orden de pasos', homeTitle: 'Aprende y practica el orden correcto',
      homeLead: 'Higiene de manos, EPI, tipos de mascarilla y los 5 momentos de la OMS: ordena los pasos, practica con el cronómetro y repasa los errores más frecuentes.',
      all: 'Todas las secuencias', stepsN: '{n} pasos', momentsN: '{n} momentos', best: 'Mejor: {s} %', noBest: 'Sin intentos todavía', secs: '{a}–{b} s',
      modeConsulta: 'Consulta', modeOrdenar: 'Ordenar', modeSiguiente: 'Siguiente paso', modePrueba: 'Prueba', modeGuia: 'Guía', modePracticar: 'Practicar',
      howTitle: 'Cómo usar',
      how1: 'Elige una secuencia y empieza por «Consulta» para ver los pasos con su porqué.',
      how2: 'En «Ordenar» arrastra las tarjetas por el asa (o usa las flechas ▲▼, o el teclado: Espacio para coger y flechas para mover) y pulsa «Comprobar».',
      how3: '«Siguiente paso» te pregunta qué va ahora; «Prueba» mide tu puntuación y tu tiempo.',
      how4: '«Guía» te acompaña paso a paso, con cronómetro en el lavado de manos, para practicar de verdad.',
      how5: 'Tus mejores puntuaciones se guardan solo en este navegador.',
      sourcesTitle: 'Fuentes y aviso',
      sourcesText: 'Higiene de manos y 5 momentos: OMS (Directrices de la OMS sobre higiene de las manos en la atención de la salud, 2009). EPI: secuencias basadas en las de los CDC (EE. UU.) y coherentes con las recomendaciones de la OMS. Mascarillas: Ministerio de Sanidad (30/04/2020, a través de Risk XXI), normas UNE-EN 14683 y UNE-EN 149. Se han consultado también la guía de la EAPN de Asturias y el vídeo de OpenWHO. Los protocolos varían entre centros y niveles de riesgo: es una herramienta didáctica y no sustituye el protocolo de tu centro ni la formación acreditada. Ilustraciones propias.',
      source: 'Fuente', whyLabel: 'Por qué', mistakeLabel: 'Error frecuente', note: 'Nota',
      print: 'Imprimir cartel (A4)', practiceNow: 'Practicar ordenando', imagesOpt: 'Imágenes', textOpt: 'Texto',
      check: 'Comprobar', shuffle: 'Mezclar de nuevo', solution: 'Ver solución', submit: 'Entregar', startTest: 'Empezar la prueba', retry: 'Repetir',
      dragHint: 'Ordena los pasos de arriba (el primero) a abajo (el último).', kbdHint: 'Arrastra por el asa, usa ▲▼ o el teclado: Espacio para coger un paso, ↑ ↓ para moverlo y Espacio para soltarlo.',
      drag: 'Arrastrar', moveUp: 'Subir', moveDown: 'Bajar', stepWord: 'Paso',
      posOf: '«{t}»: posición {n} de {m}', grabbed: '«{t}» cogido: usa las flechas arriba y abajo', dropped: '«{t}» soltado en la posición {n}',
      scoreLine: '{c} de {n} pasos en su sitio', goesAt: 'Va en el puesto {n}', correctTag: 'Correcto', solutionShown: 'Solución mostrada',
      allOk: '¡Orden perfecto!', almost: 'Casi: corrige los pasos marcados en rojo.', keepTrying: 'Sigue practicando: revisa los motivos de cada paso.',
      whyOrder: '¿Por qué este orden?', attempts: 'Intentos: {n}',
      testTitle: 'Prueba cronometrada', testLead: 'Ordena la secuencia completa lo mejor y más rápido que puedas. Tu mejor resultado se guarda en este navegador.',
      yourTime: 'Tiempo', yourScore: 'Puntuación', bestBadge: '¡Nuevo récord!', yourBest: 'Tu mejor resultado: {s} % en {t}',
      reviewTitle: 'Repaso', yourPlace: 'Tu puesto: {n}', rightPlace: 'Puesto correcto: {n}',
      excellent: 'Excelente', great: 'Muy bien', practice: 'A seguir practicando',
      nextTitle: '¿Qué paso va ahora?', done: 'Pasos ya hechos:', qOf: 'Pregunta {i} de {n}', nextBtn: 'Siguiente', finishBtn: 'Ver resultado',
      right: '¡Correcto!', wrong: 'No es ese', itWas: 'Era: «{t}»', resultTitle: 'Resultado', correctOf: '{c} de {n} correctas',
      guideLead: 'Practica de verdad: sigue el cronómetro y haz el gesto con tus manos.',
      pace: 'Ritmo', paceFast: 'Rápido', paceNormal: 'Normal', paceSlow: 'Lento', paceTotal: '{s} s en total',
      start: 'Empezar', pause: 'Pausa', resume: 'Seguir', prev: 'Anterior', nextStep: 'Siguiente', restart: 'Reiniciar',
      stepOf: 'Paso {i} de {n}', remaining: 'Quedan', elapsed: 'Transcurrido', sound: 'Sonido', speak: 'Leer en voz alta',
      finishedTitle: '¡Listo!', finishedTime: 'Has tardado {t}.', againBtn: 'Otra vez',
      manualHint: 'Haz cada paso con calma y pulsa «Hecho» al terminarlo.', doneBtn: 'Hecho: siguiente', allDone: 'Secuencia completada',
      examples: 'Ejemplos', whichMoment: '¿A qué momento corresponde esta situación?', practiceRound: 'Ronda de práctica', streak: 'Racha: {n}', again: 'Otra ronda',
      yourAnswer: 'Tu respuesta', rightAnswer: 'Respuesta correcta',
      errLoad: 'No se han podido cargar las secuencias. Si has abierto el archivo directamente desde el disco, el navegador lo bloquea: abre la web publicada o usa un servidor local.'
    },
    ca: {
      title: 'Ordre dels passos', homeTitle: 'Aprèn i practica l\'ordre correcte',
      homeLead: 'Higiene de mans, EPI, tipus de mascareta i els 5 moments de l\'OMS: ordena els passos, practica amb el cronòmetre i repassa els errors més freqüents.',
      all: 'Totes les seqüències', stepsN: '{n} passos', momentsN: '{n} moments', best: 'Millor: {s} %', noBest: 'Cap intent encara', secs: '{a}–{b} s',
      modeConsulta: 'Consulta', modeOrdenar: 'Ordenar', modeSiguiente: 'Pas següent', modePrueba: 'Prova', modeGuia: 'Guia', modePracticar: 'Practicar',
      howTitle: 'Com fer-ho servir',
      how1: 'Tria una seqüència i comença per «Consulta» per veure els passos amb el seu perquè.',
      how2: 'A «Ordenar» arrossega les targetes per l\'ansa (o fes servir les fletxes ▲▼, o el teclat: Espai per agafar i fletxes per moure) i prem «Comprova».',
      how3: '«Pas següent» et pregunta què toca ara; «Prova» mesura la teva puntuació i el teu temps.',
      how4: '«Guia» t\'acompanya pas a pas, amb cronòmetre en el rentat de mans, per practicar de debò.',
      how5: 'Les teves millors puntuacions es desen només en aquest navegador.',
      sourcesTitle: 'Fonts i avís',
      sourcesText: 'Higiene de mans i 5 moments: OMS (Directrius de l\'OMS sobre higiene de les mans en l\'atenció sanitària, 2009). EPI: seqüències basades en les dels CDC (EUA) i coherents amb les recomanacions de l\'OMS. Mascaretes: Ministeri de Sanitat (30/04/2020, a través de Risk XXI), normes UNE-EN 14683 i UNE-EN 149. S\'han consultat també la guia de l\'EAPN d\'Astúries i el vídeo d\'OpenWHO. Els protocols varien entre centres i nivells de risc: és una eina didàctica i no substitueix el protocol del teu centre ni la formació acreditada. Il·lustracions pròpies.',
      source: 'Font', whyLabel: 'Per què', mistakeLabel: 'Error freqüent', note: 'Nota',
      print: 'Imprimeix cartell (A4)', practiceNow: 'Practicar ordenant', imagesOpt: 'Imatges', textOpt: 'Text',
      check: 'Comprova', shuffle: 'Barreja de nou', solution: 'Mostra la solució', submit: 'Lliura', startTest: 'Comença la prova', retry: 'Repeteix',
      dragHint: 'Ordena els passos de dalt (el primer) a baix (l\'últim).', kbdHint: 'Arrossega per l\'ansa, fes servir ▲▼ o el teclat: Espai per agafar un pas, ↑ ↓ per moure\'l i Espai per deixar-lo anar.',
      drag: 'Arrossega', moveUp: 'Puja', moveDown: 'Baixa', stepWord: 'Pas',
      posOf: '«{t}»: posició {n} de {m}', grabbed: '«{t}» agafat: fes servir les fletxes amunt i avall', dropped: '«{t}» deixat a la posició {n}',
      scoreLine: '{c} de {n} passos al seu lloc', goesAt: 'Va al lloc {n}', correctTag: 'Correcte', solutionShown: 'Solució mostrada',
      allOk: 'Ordre perfecte!', almost: 'Gairebé: corregeix els passos marcats en vermell.', keepTrying: 'Segueix practicant: revisa els motius de cada pas.',
      whyOrder: 'Per què aquest ordre?', attempts: 'Intents: {n}',
      testTitle: 'Prova cronometrada', testLead: 'Ordena la seqüència completa el millor i el més de pressa que puguis. El teu millor resultat es desa en aquest navegador.',
      yourTime: 'Temps', yourScore: 'Puntuació', bestBadge: 'Nou rècord!', yourBest: 'El teu millor resultat: {s} % en {t}',
      reviewTitle: 'Repàs', yourPlace: 'El teu lloc: {n}', rightPlace: 'Lloc correcte: {n}',
      excellent: 'Excel·lent', great: 'Molt bé', practice: 'A seguir practicant',
      nextTitle: 'Quin pas toca ara?', done: 'Passos ja fets:', qOf: 'Pregunta {i} de {n}', nextBtn: 'Següent', finishBtn: 'Mostra el resultat',
      right: 'Correcte!', wrong: 'No és aquest', itWas: 'Era: «{t}»', resultTitle: 'Resultat', correctOf: '{c} de {n} correctes',
      guideLead: 'Practica de debò: segueix el cronòmetre i fes el gest amb les mans.',
      pace: 'Ritme', paceFast: 'Ràpid', paceNormal: 'Normal', paceSlow: 'Lent', paceTotal: '{s} s en total',
      start: 'Comença', pause: 'Pausa', resume: 'Continua', prev: 'Anterior', nextStep: 'Següent', restart: 'Reinicia',
      stepOf: 'Pas {i} de {n}', remaining: 'Queden', elapsed: 'Transcorregut', sound: 'So', speak: 'Llegeix en veu alta',
      finishedTitle: 'Llest!', finishedTime: 'Has trigat {t}.', againBtn: 'Una altra vegada',
      manualHint: 'Fes cada pas amb calma i prem «Fet» quan l\'acabis.', doneBtn: 'Fet: següent', allDone: 'Seqüència completada',
      examples: 'Exemples', whichMoment: 'A quin moment correspon aquesta situació?', practiceRound: 'Ronda de pràctica', streak: 'Ratxa: {n}', again: 'Una altra ronda',
      yourAnswer: 'La teva resposta', rightAnswer: 'Resposta correcta',
      errLoad: 'No s\'han pogut carregar les seqüències. Si has obert l\'arxiu directament des del disc, el navegador ho bloqueja: obre la web publicada o fes servir un servidor local.'
    },
    en: {
      title: 'Step order', homeTitle: 'Learn and practise the right order',
      homeLead: 'Hand hygiene, PPE, types of mask and the WHO 5 Moments: put the steps in order, practise with the timer and review the most common mistakes.',
      all: 'All sequences', stepsN: '{n} steps', momentsN: '{n} moments', best: 'Best: {s} %', noBest: 'No attempts yet', secs: '{a}–{b} s',
      modeConsulta: 'Reference', modeOrdenar: 'Order', modeSiguiente: 'Next step', modePrueba: 'Test', modeGuia: 'Guide', modePracticar: 'Practise',
      howTitle: 'How to use',
      how1: 'Pick a sequence and start with "Reference" to see the steps and the reason for each.',
      how2: 'In "Order", drag the cards by the handle (or use the ▲▼ arrows, or the keyboard: Space to pick up and arrows to move) and press "Check".',
      how3: '"Next step" asks what comes next; "Test" measures your score and your time.',
      how4: '"Guide" walks you through step by step, with a timer for handwashing, so you can really practise.',
      how5: 'Your best scores are saved only in this browser.',
      sourcesTitle: 'Sources and notice',
      sourcesText: 'Hand hygiene and the 5 Moments: WHO (WHO Guidelines on Hand Hygiene in Health Care, 2009). PPE: sequences based on the US CDC ones and consistent with WHO recommendations. Masks: Spanish Ministry of Health (30/04/2020, via Risk XXI), standards UNE-EN 14683 and UNE-EN 149. The EAPN Asturias guide and the OpenWHO video were also consulted. Protocols vary between centres and risk levels: this is a teaching tool and does not replace your centre\'s protocol or accredited training. Original illustrations.',
      source: 'Source', whyLabel: 'Why', mistakeLabel: 'Common mistake', note: 'Note',
      print: 'Print poster (A4)', practiceNow: 'Practise ordering', imagesOpt: 'Images', textOpt: 'Text',
      check: 'Check', shuffle: 'Shuffle again', solution: 'Show solution', submit: 'Submit', startTest: 'Start the test', retry: 'Try again',
      dragHint: 'Put the steps in order from top (first) to bottom (last).', kbdHint: 'Drag by the handle, use ▲▼ or the keyboard: Space to pick up a step, ↑ ↓ to move it and Space to drop it.',
      drag: 'Drag', moveUp: 'Move up', moveDown: 'Move down', stepWord: 'Step',
      posOf: '"{t}": position {n} of {m}', grabbed: '"{t}" picked up: use the up and down arrows', dropped: '"{t}" dropped at position {n}',
      scoreLine: '{c} of {n} steps in place', goesAt: 'Belongs in place {n}', correctTag: 'Correct', solutionShown: 'Solution shown',
      allOk: 'Perfect order!', almost: 'Almost: fix the steps marked in red.', keepTrying: 'Keep practising: read the reason behind each step.',
      whyOrder: 'Why this order?', attempts: 'Attempts: {n}',
      testTitle: 'Timed test', testLead: 'Put the whole sequence in order as well and as fast as you can. Your best result is saved in this browser.',
      yourTime: 'Time', yourScore: 'Score', bestBadge: 'New record!', yourBest: 'Your best result: {s} % in {t}',
      reviewTitle: 'Review', yourPlace: 'Your place: {n}', rightPlace: 'Correct place: {n}',
      excellent: 'Excellent', great: 'Very good', practice: 'Keep practising',
      nextTitle: 'Which step comes next?', done: 'Steps already done:', qOf: 'Question {i} of {n}', nextBtn: 'Next', finishBtn: 'See result',
      right: 'Correct!', wrong: 'Not that one', itWas: 'It was: "{t}"', resultTitle: 'Result', correctOf: '{c} of {n} correct',
      guideLead: 'Really practise: follow the timer and do the movement with your hands.',
      pace: 'Pace', paceFast: 'Fast', paceNormal: 'Normal', paceSlow: 'Slow', paceTotal: '{s} s in total',
      start: 'Start', pause: 'Pause', resume: 'Resume', prev: 'Previous', nextStep: 'Next', restart: 'Restart',
      stepOf: 'Step {i} of {n}', remaining: 'Left', elapsed: 'Elapsed', sound: 'Sound', speak: 'Read aloud',
      finishedTitle: 'Done!', finishedTime: 'It took you {t}.', againBtn: 'Again',
      manualHint: 'Do each step calmly and press "Done" when you finish it.', doneBtn: 'Done: next', allDone: 'Sequence completed',
      examples: 'Examples', whichMoment: 'Which moment does this situation match?', practiceRound: 'Practice round', streak: 'Streak: {n}', again: 'Another round',
      yourAnswer: 'Your answer', rightAnswer: 'Correct answer',
      errLoad: 'The sequences could not be loaded. If you opened the file directly from disk the browser blocks it: open the published site or use a local server.'
    }
  };
  const t = K.i18n(I18N);
  K.mount({ titleKey: 'title' });

  /* ---------- utilidades ---------- */
  const app = document.getElementById('app'), poster = document.getElementById('poster'), live = document.getElementById('live');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = K.esc;
  const L = (o) => (o == null ? '' : (typeof o === 'string' || Array.isArray(o)) ? o : (o[K.lang] ?? o.es ?? ''));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const say = (msg) => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30); };
  let DATA = null, cleanup = null, lastRoute = '';

  const P = {
    up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', grip: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01', check: 'M5 12.5l5 5 9-11',
    x: 'M6 6l12 12M18 6L6 18', play: 'M8 5v14l11-7z', pause: 'M9 5v14M15 5v14', next: 'M6 5v14l9-7zM19 5v14', prev: 'M18 5v14l-9-7zM5 5v14',
    print: 'M7 9V3h10v6M6 18H4v-7h16v7h-2M7 14h10v7H7z', refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5', speaker: 'M4 9v6h4l5 4V5L8 9zM16.5 9a4 4 0 0 1 0 6', bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4'
  };
  const ico = (n, w = 2.2) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="${n === 'grip' ? 3.6 : w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;
  const img = (name, alt = '') => `<img src="img/${name}.svg" alt="${esc(alt)}" loading="lazy" decoding="async">`;

  const opts = () => Object.assign({ img: true, text: true, sound: true, speak: false, pace: {} }, store.get('opts', {}));
  const setOpt = (k, v) => { const o = store.get('opts', {}); o[k] = v; store.set('opts', o); };
  const bestOf = (id, kind) => (store.get('best', {})[id] || {})[kind] || null;
  function saveBest(id, kind, rec) {
    const all = store.get('best', {}); all[id] = all[id] || {};
    const prev = all[id][kind];
    const better = !prev || rec.score > prev.score || (rec.score === prev.score && rec.time < prev.time);
    if (better) { all[id][kind] = { ...rec, date: Date.now() }; store.set('best', all); }
    return better;
  }
  const medal = (s) => (s >= 90 ? t('excellent') : s >= 70 ? t('great') : t('practice'));
  const durationText = (seq) => (seq.durationSec ? t('secs', { a: seq.durationSec[0], b: seq.durationSec[1] }) : '');
  const nItems = (seq) => (seq.type === 'order' ? t('stepsN', { n: seq.steps.length }) : (seq.labels && seq.labels.itemsN ? L(seq.labels.itemsN).replace('{n}', seq.moments.length) : t('momentsN', { n: seq.moments.length })));
  const modesOf = (seq) => (seq.type === 'order' ? ['consulta', 'ordenar', 'siguiente', 'prueba', 'guia'] : ['consulta', 'practicar', 'prueba']);

  const explain = (seq) => seq.steps.map((s, i) => `<div class="r ok"><i>${i + 1}</i><div><b>${esc(L(s.title))}</b>
      <p><span class="tag-why">${esc(t('whyLabel'))}:</span> ${esc(L(s.why))}</p>
      <p><span class="tag-bad">${esc(t('mistakeLabel'))}:</span> ${esc(L(s.mistake))}</p></div></div>`).join('');

  /* ---------- rutas ---------- */
  const parseHash = () => { const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); return { seq: p[0] || null, mode: p[1] || null }; };
  const go = (seq, mode) => { location.hash = '#/' + [seq, mode].filter(Boolean).join('/'); };

  function render() {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    document.title = t('title') + ' · Luis Franco Serrano';
    if (!DATA) return;
    const r = parseHash();
    const seq = r.seq && DATA.sequences.find(s => s.id === r.seq);
    const route = seq ? seq.id + '/' + (modesOf(seq).includes(r.mode) ? r.mode : 'consulta') : 'home';
    if (!seq) renderHome(); else renderSeq(seq, modesOf(seq).includes(r.mode) ? r.mode : 'consulta');
    if (route !== lastRoute) { window.scrollTo(0, 0); lastRoute = route; }
  }

  /* ---------- portada ---------- */
  function renderHome() {
    poster.innerHTML = '';
    app.innerHTML = `
      <section class="stack"><h2 class="app-title" style="margin:0">${esc(t('homeTitle'))}</h2><p class="lead">${esc(t('homeLead'))}</p></section>
      <div class="seq-grid">${DATA.sequences.map(s => {
        const b = bestOf(s.id, 'prueba');
        return `<a class="seq-card" href="#/${s.id}">${img(s.cover)}<div class="body"><h3>${esc(L(s.title))}</h3><p>${esc(L(s.subtitle))}</p>
          <div class="chips"><span class="chip">${esc(nItems(s))}</span>${s.durationSec ? `<span class="chip">${esc(durationText(s))}</span>` : ''}<span class="chip ${b ? 'accent' : ''}">${esc(b ? t('best', { s: b.score }) : t('noBest'))}</span></div></div></a>`;
      }).join('')}</div>
      <details class="panel help"><summary>${esc(t('howTitle'))}</summary><ul>${[1, 2, 3, 4, 5].map(i => `<li>${esc(t('how' + i))}</li>`).join('')}</ul></details>
      <section class="panel"><h2>${esc(t('sourcesTitle'))}</h2><p class="disclaimer">${esc(t('sourcesText'))}</p></section>`;
  }

  /* ---------- cabecera de secuencia ---------- */
  function renderSeq(seq, mode) {
    const modes = modesOf(seq);
    app.innerHTML = `
      <nav class="crumbs"><a href="#/">← ${esc(t('all'))}</a></nav>
      <header class="seq-head">${img(seq.cover)}<div><h2>${esc(L(seq.title))}</h2><p class="lead">${esc(L(seq.subtitle))}</p>
        <div class="chips"><span class="chip">${esc(nItems(seq))}</span>${seq.durationSec ? `<span class="chip accent">${esc(durationText(seq))}</span>` : ''}</div></div></header>
      <div class="tabs" role="tablist">${modes.map(m => `<button role="tab" data-mode="${m}" aria-selected="${m === mode}">${esc(t('mode' + cap(m)))}</button>`).join('')}</div>
      <div id="mode-root"></div>`;
    $$('.tabs button').forEach(b => b.addEventListener('click', () => go(seq.id, b.dataset.mode)));
    buildPoster(seq);
    const root = $('#mode-root');
    const M = seq.type === 'order'
      ? { consulta: consultaOrder, ordenar: (s, r) => sortMode(s, r, 'practice'), siguiente: nextMode, prueba: (s, r) => sortMode(s, r, 'test'), guia: guideMode }
      : { consulta: consultaMatch, practicar: (s, r) => matchMode(s, r, 'practice'), prueba: (s, r) => matchMode(s, r, 'test') };
    M[mode](seq, root);
  }

  /* ---------- cartel imprimible ---------- */
  function buildPoster(seq) {
    const order = seq.type === 'order';
    const items = order
      ? seq.steps.map((s, i) => ({ n: i + 1, img: s.img, title: L(s.title), text: seq.baseSec ? '' : L(s.text) }))
      : seq.moments.map(m => ({ n: m.id, img: m.img, title: L(m.title), text: (L(m.examples) || []).join(' · ') }));
    const cols = items.length >= 9 ? 4 : 3;
    poster.innerHTML = `<h1>${esc(L(seq.title))}</h1><p class="ps">${esc(L(seq.subtitle))}${seq.durationSec ? ' · ' + esc(durationText(seq)) : ''}</p>
      <div class="pgrid" style="--cols:${cols}">${items.map(it => `<div class="pstep"><img src="img/${it.img}.svg" alt=""><div><b>${it.n}. ${esc(it.title)}</b>${esc(it.text)}</div></div>`).join('')}</div>
      <div class="pfoot"><b>${esc(t('source'))}:</b> ${esc(L(seq.source))}<br><b>${esc(t('note'))}:</b> ${esc(L(seq.note))}</div>`;
  }

  /* ---------- consulta ---------- */
  function consultaOrder(seq, root) {
    root.innerHTML = `
      <section class="panel note"><div><b>${esc(t('note'))}:</b> ${esc(L(seq.note))}</div><small class="muted"><b>${esc(t('source'))}:</b> ${esc(L(seq.source))}</small></section>
      <div class="row"><button class="btn" id="pr">${ico('print')} ${esc(t('print'))}</button><button class="btn ghost" id="pl">${esc(t('practiceNow'))}</button></div>
      <ol class="steps-grid">${seq.steps.map((s, i) => `<li class="step-card"><figure>${img(s.img)}<span class="n">${i + 1}</span></figure><div class="sc-body">
        <h3>${esc(L(s.title))}</h3><p>${esc(L(s.text))}</p>
        <details><summary>${esc(t('whyLabel'))}</summary><p><span class="tag-why">${esc(t('whyLabel'))}:</span> ${esc(L(s.why))}</p><p><span class="tag-bad">${esc(t('mistakeLabel'))}:</span> ${esc(L(s.mistake))}</p></details></div></li>`).join('')}</ol>`;
    $('#pr', root).onclick = () => window.print();
    $('#pl', root).onclick = () => go(seq.id, 'ordenar');
  }
  function consultaMatch(seq, root) {
    root.innerHTML = `
      <section class="panel note"><div><b>${esc(t('note'))}:</b> ${esc(L(seq.note))}</div><small class="muted"><b>${esc(t('source'))}:</b> ${esc(L(seq.source))}</small></section>
      <div class="row"><button class="btn" id="pr">${ico('print')} ${esc(t('print'))}</button><button class="btn ghost" id="pl">${esc(t('practiceNow'))}</button></div>
      <div class="stack">${seq.moments.map(m => `<article class="moment-card">${img(m.img)}<div class="mc-body"><h3>${m.id}. ${esc(L(m.title))}</h3><p style="margin:0">${esc(L(m.text))}</p>
        <p style="margin:0"><span class="tag-why">${esc(t('whyLabel'))}:</span> ${esc(L(m.why))}</p>
        <b>${esc(seq.labels && seq.labels.examples ? L(seq.labels.examples) : t('examples'))}</b><ul>${(L(m.examples) || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div></article>`).join('')}</div>`;
    $('#pr', root).onclick = () => window.print();
    $('#pl', root).onclick = () => go(seq.id, 'practicar');
  }

  /* ============================================================
     ORDENAR y PRUEBA (misma tabla de ordenación)
     ============================================================ */
  function sortMode(seq, root, kind) {
    const steps = seq.steps, n = steps.length, test = kind === 'test';
    let o = opts(), order = [], checked = false, attempts = 0, t0 = 0, clockId = null, grabbed = null;
    const best = bestOf(seq.id, 'prueba');
    const newOrder = () => { let a; do { a = K.shuffle(steps.map((_, i) => i)); } while (n > 1 && a.every((v, i) => v === i)); return a; };
    cleanup = () => { clearInterval(clockId); };

    const optsHtml = () => `<label class="check"><input type="checkbox" id="o-img" ${o.img ? 'checked' : ''}> ${esc(t('imagesOpt'))}</label><label class="check"><input type="checkbox" id="o-txt" ${o.text ? 'checked' : ''}> ${esc(t('textOpt'))}</label>`;
    function bindOpts(after) {
      const i = $('#o-img', root), x = $('#o-txt', root);
      const upd = () => { if (!o.img && !o.text) { o.text = true; x.checked = true; } setOpt('img', o.img); setOpt('text', o.text); after && after(); };
      i.onchange = () => { o.img = i.checked; upd(); };
      x.onchange = () => { o.text = x.checked; upd(); };
    }

    function intro() {
      root.innerHTML = `<div class="panel start-card">${img(seq.cover)}<h2>${esc(t('testTitle'))}</h2><p class="lead" style="margin:0">${esc(t('testLead'))}</p>
        ${best ? `<span class="chip accent">${esc(t('yourBest', { s: best.score, t: K.mmss(best.time) }))}</span>` : ''}
        <div class="toolbar">${optsHtml()}</div><button class="btn big" id="go">${esc(t('startTest'))}</button></div>`;
      bindOpts(); $('#go', root).onclick = begin;
    }
    function begin() {
      order = newOrder(); checked = false; attempts = 0; t0 = performance.now(); board();
      if (test) { clearInterval(clockId); clockId = setInterval(() => { const c = $('#clock', root); if (c) c.textContent = K.mmss((performance.now() - t0) / 1000); }, 250); }
    }

    const row = (i, k) => {
      const s = steps[i], title = esc(L(s.title));
      return `<li class="sort-item" data-i="${i}" tabindex="0" aria-roledescription="${esc(t('stepWord'))}" aria-label="${k + 1}. ${o.text ? title : esc(t('stepWord'))}">
        <button class="grip" type="button" aria-label="${esc(t('drag'))}" tabindex="-1">${ico('grip')}</button><span class="pos">${k + 1}</span>
        ${o.img ? img(s.img) : ''}<span class="txt">${o.text ? title : esc(t('stepWord'))}</span>
        <span class="mv"><button class="icon-btn" type="button" data-mv="-1" aria-label="${esc(t('moveUp'))}">${ico('up')}</button><button class="icon-btn" type="button" data-mv="1" aria-label="${esc(t('moveDown'))}">${ico('down')}</button></span><span class="mark"></span></li>`;
    };

    function board() {
      root.innerHTML = `
        <div class="toolbar">${test ? `<span class="clock" id="clock" role="timer" aria-live="off">0:00</span>` : ''}${optsHtml()}<span class="sp"></span>
          ${test ? `<button class="btn" id="submit">${ico('check')} ${esc(t('submit'))}</button>`
                 : `<button class="btn" id="check">${ico('check')} ${esc(t('check'))}</button><button class="btn ghost" id="shuf">${ico('refresh', 2)} ${esc(t('shuffle'))}</button><button class="btn ghost" id="sol">${esc(t('solution'))}</button>`}</div>
        <p class="muted" style="margin:0">${esc(t('dragHint'))} <small>${esc(t('kbdHint'))}</small></p>
        <ol class="sort-list" id="list">${order.map((i, k) => row(i, k)).join('')}</ol><div id="out"></div>`;
      bindOpts(() => { readOrder(); board(); });
      const list = $('#list', root);
      list.addEventListener('click', e => { const b = e.target.closest('[data-mv]'); if (!b) return; const li = b.closest('.sort-item'); moveItem(li, +b.dataset.mv); const nb = $(`[data-mv="${b.dataset.mv}"]`, li); nb && nb.focus(); });
      list.addEventListener('keydown', e => onKey(e, list));
      enableDrag(list);
      if (test) $('#submit', root).onclick = finishTest;
      else {
        $('#check', root).onclick = check;
        $('#shuf', root).onclick = () => { order = newOrder(); checked = false; board(); say(t('shuffle')); };
        $('#sol', root).onclick = showSolution;
      }
    }

    const listEl = () => $('#list', root);
    function readOrder() { order = $$('.sort-item', listEl()).map(li => +li.dataset.i); }
    function renumber() {
      $$('.sort-item', listEl()).forEach((li, k) => { $('.pos', li).textContent = k + 1; const s = steps[+li.dataset.i]; li.setAttribute('aria-label', `${k + 1}. ${o.text ? L(s.title) : t('stepWord')}`); });
    }
    function clearMarks() { checked = false; $$('.sort-item', listEl()).forEach(li => li.classList.remove('ok', 'bad')); const out = $('#out', root); if (out) out.innerHTML = ''; }
    function moveItem(li, dir) {
      const list = listEl(), sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!sib || sib.classList.contains('sort-ph')) return;
      if (dir < 0) list.insertBefore(li, sib); else list.insertBefore(sib, li);
      readOrder(); renumber(); if (checked) clearMarks();
      const k = order.indexOf(+li.dataset.i);
      say(t('posOf', { t: L(steps[+li.dataset.i].title), n: k + 1, m: n }));
    }
    function onKey(e, list) {
      const li = e.target.closest('.sort-item'); if (!li || e.target !== li) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (grabbed === li) { grabbed = null; li.dataset.grab = '0'; say(t('dropped', { t: L(steps[+li.dataset.i].title), n: order.indexOf(+li.dataset.i) + 1 })); }
        else { grabbed = li; li.dataset.grab = '1'; say(t('grabbed', { t: L(steps[+li.dataset.i].title) })); }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const d = e.key === 'ArrowUp' ? -1 : 1;
        if (grabbed === li) { moveItem(li, d); li.focus(); }
        else { const sib = d < 0 ? li.previousElementSibling : li.nextElementSibling; sib && sib.focus(); }
      } else if (e.key === 'Escape' && grabbed) { grabbed.dataset.grab = '0'; grabbed = null; }
    }
    /* arrastrar con puntero (ratón y táctil) desde el asa */
    function enableDrag(list) {
      list.addEventListener('pointerdown', e => {
        const grip = e.target.closest('.grip'); if (!grip) return;
        const item = grip.closest('.sort-item'); if (!item) return;
        e.preventDefault();
        const rect = item.getBoundingClientRect(), offsetY = e.clientY - rect.top;
        const ph = document.createElement('li'); ph.className = 'sort-ph'; ph.style.height = rect.height + 'px';
        item.after(ph);
        item.classList.add('dragging'); Object.assign(item.style, { position: 'fixed', width: rect.width + 'px', left: rect.left + 'px', top: rect.top + 'px', margin: '0' });
        try { grip.setPointerCapture(e.pointerId); } catch (_) { /* sin captura: el arrastre sigue funcionando sobre el asa */ }
        const move = ev => {
          item.style.top = (ev.clientY - offsetY) + 'px';
          let target = null;
          for (const s of [...list.children]) { if (s === item || s === ph) continue; const r = s.getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { target = s; break; } }
          list.insertBefore(ph, target);
          if (ev.clientY < 70) window.scrollBy(0, -14); else if (ev.clientY > innerHeight - 70) window.scrollBy(0, 14);
        };
        const up = () => {
          grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
          try { grip.releasePointerCapture(e.pointerId); } catch (_) { /* ya liberado */ }
          item.removeAttribute('style'); item.classList.remove('dragging');
          list.insertBefore(item, ph); ph.remove();
          readOrder(); renumber(); if (checked) clearMarks();
          say(t('dropped', { t: L(steps[+item.dataset.i].title), n: order.indexOf(+item.dataset.i) + 1 }));
        };
        grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
      });
    }

    function check() {
      readOrder(); attempts++; checked = true; let c = 0;
      $$('.sort-item', listEl()).forEach((li, k) => {
        const i = +li.dataset.i, ok = i === k; if (ok) c++;
        li.classList.toggle('ok', ok); li.classList.toggle('bad', !ok);
        $('.mark', li).textContent = ok ? t('correctTag') : t('goesAt', { n: i + 1 });
      });
      const msg = c === n ? t('allOk') : c >= n - 2 ? t('almost') : t('keepTrying');
      $('#out', root).innerHTML = `<section class="panel result"><div class="big">${c}<small>/ ${n}</small></div><p style="margin:0"><b>${esc(msg)}</b> ${esc(t('scoreLine', { c, n }))}</p>
        <div class="meta"><span class="chip">${esc(t('attempts', { n: attempts }))}</span></div>
        <details ${c === n ? 'open' : ''}><summary style="cursor:pointer;font-weight:700;color:var(--accent)">${esc(t('whyOrder'))}</summary><div class="review" style="margin-top:10px">${explain(seq)}</div></details></section>`;
      say(`${c} / ${n}. ${msg}`);
      $('#out', root).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    }
    function showSolution() {
      order = steps.map((_, i) => i); board();
      $$('.sort-item', listEl()).forEach(li => li.classList.add('ok'));
      $('#out', root).innerHTML = `<section class="panel result"><b>${esc(t('solutionShown'))}</b><div class="review">${explain(seq)}</div></section>`;
    }
    function finishTest() {
      readOrder(); clearInterval(clockId);
      const time = (performance.now() - t0) / 1000;
      const correct = order.filter((v, k) => v === k).length, score = Math.round(100 * correct / n);
      const isBest = saveBest(seq.id, 'prueba', { score, time });
      const nb = bestOf(seq.id, 'prueba');
      root.innerHTML = `
        <section class="panel result"><div class="big">${score} %<small>${esc(t('scoreLine', { c: correct, n }))}</small></div>
          <div class="meta"><span class="chip accent">${esc(medal(score))}</span><span class="chip">${esc(t('yourTime'))}: ${K.mmss(time)}</span>${isBest ? `<span class="chip" style="background:var(--green);color:var(--night)">${esc(t('bestBadge'))}</span>` : `<span class="chip">${esc(t('yourBest', { s: nb.score, t: K.mmss(nb.time) }))}</span>`}</div>
          <div class="row"><button class="btn" id="again">${ico('refresh', 2)} ${esc(t('retry'))}</button><button class="btn ghost" id="cons">${esc(t('modeConsulta'))}</button></div></section>
        <section class="panel"><h2>${esc(t('reviewTitle'))}</h2><div class="review">${steps.map((s, i) => {
          const ok = order[i] === i, where = order.indexOf(i) + 1;
          return `<div class="r ${ok ? 'ok' : 'bad'}"><i>${ok ? '✓' : '✗'}</i><div><b>${i + 1}. ${esc(L(s.title))}</b><p>${esc(ok ? t('correctTag') : `${t('yourPlace', { n: where })} · ${t('rightPlace', { n: i + 1 })}`)}</p><p>${esc(L(s.why))}</p></div></div>`;
        }).join('')}</div></section>`;
      $('#again', root).onclick = () => begin(); $('#cons', root).onclick = () => go(seq.id, 'consulta');
      say(`${score} %`);
    }

    if (test) intro(); else begin();
  }

  /* ============================================================
     SIGUIENTE PASO
     ============================================================ */
  function nextMode(seq, root) {
    const steps = seq.steps, n = steps.length, o = opts();
    let qs = [], qi = 0, score = 0, t0 = 0, wrong = [], answered = false;
    const keyH = (e) => {
      if (/^[1-4]$/.test(e.key)) { const b = $$('.opt', root)[+e.key - 1]; b && !b.disabled && b.click(); }
      else if (e.key === 'Enter') { const nb = $('#nx', root); nb && nb.click(); }
    };
    document.addEventListener('keydown', keyH);
    cleanup = () => document.removeEventListener('keydown', keyH);

    function start() {
      const idx = K.shuffle(steps.map((_, i) => i).slice(1)).slice(0, Math.min(8, n - 1));
      qs = idx.map(i => { const others = steps.map((_, j) => j).filter(j => j !== i); return { i, opts: K.shuffle([i, ...K.shuffle(others).slice(0, 3)]) }; });
      qi = 0; score = 0; wrong = []; t0 = performance.now(); ask();
    }
    function ask() {
      answered = false;
      const q = qs[qi], ctx = steps.slice(0, q.i), shown = ctx.slice(-4), more = ctx.length - shown.length;
      root.innerHTML = `
        <div class="qhead"><b>${esc(t('qOf', { i: qi + 1, n: qs.length }))}</b><div class="progress"><i style="width:${(qi / qs.length) * 100}%"></i></div><span class="chip">✓ ${score}</span></div>
        <section class="panel"><h2>${esc(t('nextTitle'))}</h2><p class="muted" style="margin:0 0 8px">${esc(t('done'))}</p>
          <ol class="mini">${more > 0 ? `<li class="more">… +${more}</li>` : ''}${shown.map((s, k) => `<li><b>${q.i - shown.length + k + 1}</b>${esc(L(s.title))}</li>`).join('')}</ol></section>
        <div class="opt-grid">${q.opts.map((j, k) => `<button class="opt" data-j="${j}" type="button">${o.img ? img(steps[j].img) : ''}<span class="t"><span class="k">${k + 1}</span><span>${esc(L(steps[j].title))}</span></span></button>`).join('')}</div>
        <div id="fb"></div>`;
      $$('.opt', root).forEach(b => b.addEventListener('click', () => answer(b)));
    }
    function answer(b) {
      if (answered) return; answered = true;
      const q = qs[qi], j = +b.dataset.j, ok = j === q.i;
      if (ok) score++; else wrong.push(q.i);
      $$('.opt', root).forEach(x => { x.disabled = true; if (+x.dataset.j === q.i) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
      const last = qi === qs.length - 1;
      $('#fb', root).innerHTML = `<section class="panel feedback ${ok ? 'ok' : 'bad'}"><b class="s">${esc(ok ? t('right') : t('wrong'))}</b>${ok ? '' : `<span>${esc(t('itWas', { t: L(steps[q.i].title) }))}</span>`}
        <p style="margin:0"><span class="tag-why">${esc(t('whyLabel'))}:</span> ${esc(L(steps[q.i].why))}</p>
        <div><button class="btn" id="nx" type="button">${esc(last ? t('finishBtn') : t('nextBtn'))}</button></div></section>`;
      say(`${ok ? t('right') : t('wrong')}. ${L(steps[q.i].why)}`);
      $('#nx', root).onclick = () => { qi++; if (qi >= qs.length) finish(); else ask(); };
      $('#nx', root).focus();
    }
    function finish() {
      const time = (performance.now() - t0) / 1000, pct = Math.round(100 * score / qs.length);
      const isBest = saveBest(seq.id, 'siguiente', { score: pct, time });
      root.innerHTML = `<section class="panel result"><div class="big">${pct} %<small>${esc(t('correctOf', { c: score, n: qs.length }))}</small></div>
        <div class="meta"><span class="chip accent">${esc(medal(pct))}</span><span class="chip">${esc(t('yourTime'))}: ${K.mmss(time)}</span>${isBest ? `<span class="chip" style="background:var(--green);color:var(--night)">${esc(t('bestBadge'))}</span>` : ''}</div>
        <div class="row"><button class="btn" id="again">${ico('refresh', 2)} ${esc(t('retry'))}</button><button class="btn ghost" id="cons">${esc(t('modeConsulta'))}</button></div></section>
        ${wrong.length ? `<section class="panel"><h2>${esc(t('reviewTitle'))}</h2><div class="review">${[...new Set(wrong)].sort((a, b) => a - b).map(i => `<div class="r bad"><i>${i + 1}</i><div><b>${esc(L(steps[i].title))}</b><p>${esc(L(steps[i].why))}</p></div></div>`).join('')}</div></section>` : ''}`;
      $('#again', root).onclick = start; $('#cons', root).onclick = () => go(seq.id, 'consulta');
    }
    start();
  }

  /* ============================================================
     GUÍA (con cronómetro si la secuencia lleva tiempos)
     ============================================================ */
  function guideMode(seq, root) {
    const steps = seq.steps, n = steps.length, timed = seq.baseSec > 0, o = opts();
    const paces = timed ? [{ k: 'fast', s: seq.durationSec[0] }, { k: 'normal', s: seq.baseSec }, { k: 'slow', s: seq.durationSec[1] }] : [];
    let paceKey = (o.pace || {})[seq.id] || 'normal', durs = [], idx = 0, remain = 0, running = false, finished = false, last = 0, tickId = null, elapsed = 0, doneSet = new Set();
    let audioCtx = null, sound = o.sound, speakOn = o.speak;
    const computeDurs = () => { const target = paces.find(p => p.k === paceKey).s, f = target / seq.baseSec; durs = steps.map(s => Math.max(1, Math.round(s.seconds * f * 10) / 10)); };
    if (timed) computeDurs();
    cleanup = () => { clearInterval(tickId); K.keepAwake(false); try { speechSynthesis.cancel(); } catch (_) { /* sin voz */ } try { audioCtx && audioCtx.close(); } catch (_) { /* nada */ } };

    function beep(freq = 660, ms = 130, when = 0) {
      if (!sound) return;
      if (!audioCtx && navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // el audio solo se abre tras un gesto del usuario
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + when;
        osc.frequency.value = freq; osc.type = 'sine'; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.25, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + ms / 1000);
        osc.connect(g).connect(audioCtx.destination); osc.start(t0); osc.stop(t0 + ms / 1000 + .02);
      } catch (_) { /* sin audio */ }
    }
    function speak(text) {
      if (!speakOn) return;
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = ({ es: 'es-ES', ca: 'ca-ES', en: 'en-GB' })[K.lang]; speechSynthesis.speak(u); } catch (_) { /* sin voz */ }
    }
    const totalLeft = () => remain + durs.slice(idx + 1).reduce((a, b) => a + b, 0);
    const totalAll = () => durs.reduce((a, b) => a + b, 0);

    function scaffold() {
      const s = steps[idx];
      root.innerHTML = finished ? finishHtml() : `
        <div class="toolbar">
          ${timed ? `<span class="seg" role="group" aria-label="${esc(t('pace'))}">${paces.map(p => `<button type="button" data-pace="${p.k}" aria-pressed="${p.k === paceKey}" ${running ? 'disabled' : ''}>${esc(t('pace' + cap(p.k)))} · ${p.s} s</button>`).join('')}</span>` : `<small class="muted">${esc(t('manualHint'))}</small>`}
          <span class="sp"></span>
          ${timed ? `<label class="check"><input type="checkbox" id="snd" ${sound ? 'checked' : ''}> ${ico('bell', 2)} ${esc(t('sound'))}</label>` : ''}
          <label class="check"><input type="checkbox" id="spk" ${speakOn ? 'checked' : ''}> ${ico('speaker', 2)} ${esc(t('speak'))}</label></div>
        <section class="panel guide">
          <figure><span class="badge">${esc(t('stepOf', { i: idx + 1, n }))}</span>${img(s.img)}</figure>
          <div class="info"><h3>${esc(L(s.title))}</h3><p class="txt">${esc(L(s.text))}</p>
            ${timed ? `<div class="ringwrap"><div class="ring"><svg viewBox="0 0 128 128"><circle class="bg" cx="64" cy="64" r="54"/><circle class="fg" id="fg" cx="64" cy="64" r="54" stroke-dasharray="339.3" stroke-dashoffset="0"/></svg><b id="rn">${Math.ceil(remain || durs[idx])}</b></div>
              <div class="totals"><span>${esc(t('remaining'))}: <b id="tl">${K.mmss(totalLeft() || totalAll())}</b></span><span>${esc(t('elapsed'))}: <b id="te">${K.mmss(elapsed)}</b></span><small>${esc(t('paceTotal', { s: Math.round(totalAll()) }))}</small></div></div>`
              : `<ul class="checks">${steps.map((x, k) => `<li class="${doneSet.has(k) ? 'done' : ''} ${k === idx ? 'cur' : ''}" data-k="${k}"><b>${k + 1}</b>${esc(L(x.title))}</li>`).join('')}</ul>`}
            <div class="segbar" role="group">${steps.map((x, k) => `<button type="button" data-k="${k}" class="${k < idx || doneSet.has(k) ? 'done' : ''} ${k === idx ? 'cur' : ''}" aria-label="${k + 1}. ${esc(L(x.title))}"></button>`).join('')}</div>
            <div class="ctrls">
              ${timed ? `<button class="btn big" id="pp" type="button">${running ? ico('pause') + ' ' + esc(t('pause')) : ico('play') + ' ' + esc(idx === 0 && !elapsed ? t('start') : t('resume'))}</button>`
                      : `<button class="btn big" id="dn" type="button">${ico('check')} ${esc(t('doneBtn'))}</button>`}
              <button class="btn ghost" id="pv" type="button" ${idx === 0 ? 'disabled' : ''}>${ico('prev', 2)} ${esc(t('prev'))}</button>
              <button class="btn ghost" id="nx" type="button">${esc(t('nextStep'))} ${ico('next', 2)}</button>
              <button class="btn ghost small" id="rs" type="button">${ico('refresh', 2)} ${esc(t('restart'))}</button></div></div></section>`;
      bind();
    }
    function finishHtml() {
      const doneImg = timed ? 'manos-limpias' : seq.cover;
      return `<section class="panel finish">${img(doneImg)}<h2>${esc(t('finishedTitle'))}</h2><p style="margin:0"><b>${esc(L(seq.finish) || t('allDone'))}</b></p>
        ${timed ? `<p class="muted" style="margin:0">${esc(t('finishedTime', { t: K.mmss(elapsed) }))}</p>` : `<p class="muted" style="margin:0;max-width:60ch">${esc(L(seq.note))}</p>`}
        <div class="row"><button class="btn" id="ag" type="button">${ico('refresh', 2)} ${esc(t('againBtn'))}</button><button class="btn ghost" id="pt" type="button">${esc(t('modePrueba'))}</button></div></section>`;
    }
    function bind() {
      if (finished) { $('#ag', root).onclick = restart; $('#pt', root).onclick = () => go(seq.id, 'prueba'); return; }
      $$('[data-pace]', root).forEach(b => b.onclick = () => { paceKey = b.dataset.pace; const p = o.pace || {}; p[seq.id] = paceKey; setOpt('pace', p); computeDurs(); remain = 0; scaffold(); });
      const sn = $('#snd', root); if (sn) sn.onchange = () => { sound = sn.checked; setOpt('sound', sound); if (sound) beep(); };
      const sp = $('#spk', root); sp.onchange = () => { speakOn = sp.checked; setOpt('speak', speakOn); if (speakOn) speak(`${L(steps[idx].title)}. ${L(steps[idx].text)}`); else try { speechSynthesis.cancel(); } catch (_) { /* nada */ } };
      $$('.segbar button', root).forEach(b => b.onclick = () => jump(+b.dataset.k));
      $$('.checks li', root).forEach(li => li.onclick = () => jump(+li.dataset.k));
      $('#pv', root).onclick = () => jump(idx - 1); $('#nx', root).onclick = () => advance(true); $('#rs', root).onclick = restart;
      if (timed) $('#pp', root).onclick = toggle; else $('#dn', root).onclick = () => { doneSet.add(idx); advance(true); };
    }
    function jump(k) { if (k < 0 || k >= n) return; idx = k; remain = timed ? durs[idx] : 0; scaffold(); speak(`${L(steps[idx].title)}. ${L(steps[idx].text)}`); if (running) last = performance.now(); }
    function advance(manual) {
      if (idx >= n - 1) { finish(); return; }
      idx++; remain = timed ? durs[idx] : 0; if (!manual) beep(660, 130); scaffold();
      speak(`${L(steps[idx].title)}. ${L(steps[idx].text)}`); say(t('stepOf', { i: idx + 1, n }) + '. ' + L(steps[idx].title));
    }
    function finish() { finished = true; running = false; clearInterval(tickId); K.keepAwake(false); beep(880, 160); beep(880, 160, .22); beep(1100, 260, .44); scaffold(); say(t('finishedTitle')); }
    function restart() { clearInterval(tickId); running = false; finished = false; idx = 0; elapsed = 0; doneSet = new Set(); remain = timed ? durs[0] : 0; K.keepAwake(false); scaffold(); }
    function toggle() {
      if (running) { running = false; clearInterval(tickId); K.keepAwake(false); scaffold(); return; }
      running = true; if (!remain) remain = durs[idx]; last = performance.now(); K.keepAwake(true); beep(520, 90);
      if (!elapsed) speak(`${L(steps[idx].title)}. ${L(steps[idx].text)}`);
      clearInterval(tickId); tickId = setInterval(tick, 100); scaffold();
    }
    function tick() {
      const now = performance.now(), dt = (now - last) / 1000; last = now; remain -= dt; elapsed += dt;
      if (remain <= 0) { const over = -remain; advance(false); if (!finished) { remain = Math.max(0.1, durs[idx] - over); } return; }
      const fg = $('#fg', root), rn = $('#rn', root), tl = $('#tl', root), te = $('#te', root);
      if (fg) fg.style.strokeDashoffset = String(339.3 * (1 - remain / durs[idx]));
      if (rn) rn.textContent = String(Math.ceil(remain));
      if (tl) tl.textContent = K.mmss(totalLeft()); if (te) te.textContent = K.mmss(elapsed);
    }
    remain = timed ? durs[0] : 0;
    scaffold();
  }

  /* ============================================================
     EMPAREJAR (5 momentos): práctica con feedback y prueba cronometrada
     ============================================================ */
  function matchMode(seq, root, kind) {
    const test = kind === 'test', sits = seq.situations, N = Math.min(10, sits.length);
    let deck = [], qi = 0, score = 0, streak = 0, t0 = 0, ans = [], clockId = null, locked = false;
    const best = bestOf(seq.id, 'prueba');
    const keyH = (e) => { if (/^[1-5]$/.test(e.key)) { const b = $$('.mopt', root)[+e.key - 1]; b && !b.disabled && b.click(); } else if (e.key === 'Enter') { const nb = $('#nx', root); nb && nb.click(); } };
    document.addEventListener('keydown', keyH);
    cleanup = () => { clearInterval(clockId); document.removeEventListener('keydown', keyH); };

    function intro() {
      root.innerHTML = `<div class="panel start-card">${img(seq.cover)}<h2>${esc(t('testTitle'))}</h2><p class="lead" style="margin:0">${esc(t('testLead'))}</p>
        ${best ? `<span class="chip accent">${esc(t('yourBest', { s: best.score, t: K.mmss(best.time) }))}</span>` : ''}<button class="btn big" id="go">${esc(t('startTest'))}</button></div>`;
      $('#go', root).onclick = start;
    }
    function start() {
      deck = K.shuffle(sits).slice(0, N); qi = 0; score = 0; streak = 0; ans = []; t0 = performance.now(); ask();
      if (test) { clearInterval(clockId); clockId = setInterval(() => { const c = $('#clock', root); if (c) c.textContent = K.mmss((performance.now() - t0) / 1000); }, 250); }
    }
    function ask() {
      locked = false; const q = deck[qi];
      root.innerHTML = `
        <div class="qhead"><b>${esc(t('qOf', { i: qi + 1, n: deck.length }))}</b><div class="progress"><i style="width:${(qi / deck.length) * 100}%"></i></div>
          ${test ? `<span class="clock" id="clock" role="timer" aria-live="off">${K.mmss((performance.now() - t0) / 1000)}</span>` : `<span class="chip">${esc(t('streak', { n: streak }))}</span>`}</div>
        <section class="panel situation">${esc(L(q.text))}</section>
        <h3 style="margin:0">${esc(seq.labels && seq.labels.which ? L(seq.labels.which) : t('whichMoment'))}</h3>
        <div class="mgrid">${seq.moments.map(m => `<button class="mopt" data-m="${m.id}" type="button"><span class="k">${m.id}</span>${img(m.img)}<span><b>${esc(L(m.short))}</b></span></button>`).join('')}</div><div id="fb"></div>`;
      $$('.mopt', root).forEach(b => b.addEventListener('click', () => pick(b)));
    }
    function pick(b) {
      if (locked) return; locked = true;
      const q = deck[qi], m = +b.dataset.m, ok = m === q.moment, last = qi === deck.length - 1;
      ans.push({ q, m, ok }); if (ok) { score++; streak++; } else streak = 0;
      $$('.mopt', root).forEach(x => x.disabled = true);
      if (test) { b.classList.add('picked'); setTimeout(() => { qi++; if (qi >= deck.length) finish(); else ask(); }, 280); return; }
      $$('.mopt', root).forEach(x => { if (+x.dataset.m === q.moment) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
      const mm = seq.moments.find(x => x.id === q.moment);
      $('#fb', root).innerHTML = `<section class="panel feedback ${ok ? 'ok' : 'bad'}"><b class="s">${esc(ok ? t('right') : t('wrong'))}</b><span><b>${mm.id}. ${esc(L(mm.title))}</b></span>
        <p style="margin:0"><span class="tag-why">${esc(t('whyLabel'))}:</span> ${esc(L(mm.why))}</p><div><button class="btn" id="nx" type="button">${esc(last ? t('finishBtn') : t('nextBtn'))}</button></div></section>`;
      say(`${ok ? t('right') : t('wrong')}. ${mm.id}. ${L(mm.title)}`);
      $('#nx', root).onclick = () => { qi++; if (qi >= deck.length) finish(); else ask(); }; $('#nx', root).focus();
    }
    function finish() {
      clearInterval(clockId);
      const time = (performance.now() - t0) / 1000, pct = Math.round(100 * score / deck.length);
      const isBest = test ? saveBest(seq.id, 'prueba', { score: pct, time }) : false;
      const wrongs = ans.filter(a => !a.ok);
      root.innerHTML = `<section class="panel result"><div class="big">${pct} %<small>${esc(t('correctOf', { c: score, n: deck.length }))}</small></div>
        <div class="meta"><span class="chip accent">${esc(medal(pct))}</span><span class="chip">${esc(t('yourTime'))}: ${K.mmss(time)}</span>${isBest ? `<span class="chip" style="background:var(--green);color:var(--night)">${esc(t('bestBadge'))}</span>` : ''}</div>
        <div class="row"><button class="btn" id="again" type="button">${ico('refresh', 2)} ${esc(test ? t('retry') : t('again'))}</button><button class="btn ghost" id="cons" type="button">${esc(t('modeConsulta'))}</button></div></section>
        ${wrongs.length ? `<section class="panel"><h2>${esc(t('reviewTitle'))}</h2><div class="review">${wrongs.map(a => {
          const mine = seq.moments.find(x => x.id === a.m), right = seq.moments.find(x => x.id === a.q.moment);
          return `<div class="r bad"><i>✗</i><div><b>${esc(L(a.q.text))}</b><p>${esc(t('yourAnswer'))}: ${mine.id}. ${esc(L(mine.short))}</p><p>${esc(t('rightAnswer'))}: ${right.id}. ${esc(L(right.title))}</p><p>${esc(L(right.why))}</p></div></div>`;
        }).join('')}</div></section>` : ''}`;
      $('#again', root).onclick = test ? intro : start; $('#cons', root).onclick = () => go(seq.id, 'consulta');
    }
    if (test) intro(); else start();
  }

  /* ---------- arranque ---------- */
  K.onLang(render);
  window.addEventListener('hashchange', render);
  fetch('data/secuencias.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => { DATA = d; render(); })
    .catch(e => { console.error(e); app.innerHTML = `<div class="panel empty">${esc(t('errLoad'))}</div>`; });
})();
