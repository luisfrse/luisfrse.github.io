/* ============================================================
   Quiz de histología y citología
   Datos: data/imagenes.json  ·  Estado local: AppKit.storage('histologia')
   ============================================================ */
(() => {
  'use strict';
  const K = window.AppKit;
  const S = K.storage('histologia');
  const esc = K.esc;

  /* ------------------------- textos ------------------------- */
  const I18N = {
    es: {
      title: 'Quiz de histología y citología', pageTitle: 'Quiz de histología y citología',
      homeTitle: 'Aprende a reconocer lo que ves al microscopio',
      homeLead: 'Tejidos, órganos, tinciones, células de la sangre, citología y anatomía patológica. Imágenes con licencia abierta, visor con zoom y explicación de cada respuesta.',
      stImages: 'imágenes', stCats: 'categorías', stMastered: 'dominadas', stStreak: 'mejor racha', stErrors: 'por repasar',
      mQuiz: 'Quiz de opciones', mQuizD: 'Cuatro respuestas por imagen: tejido, tinción o rasgo clave.',
      mTyped: 'Respuesta escrita', mTypedD: 'Escribe el nombre de lo que ves, con autocompletado y tolerancia a erratas.',
      mStudy: 'Modo estudio', mStudyD: 'Galería con visor de zoom, rasgos clave y autoevaluación.',
      mReview: 'Repaso de errores', mReviewD: 'Vuelve a las imágenes que has fallado hasta dominarlas.',
      mReviewN: '{n} pendientes', mReviewNone: 'Sin errores guardados',
      setCats: 'Categorías', setAll: 'Todas', setNone: 'Ninguna', setDiff: 'Dificultad', setCount: 'Número de preguntas', setAllQ: 'Todas',
      setTypes: 'Tipos de pregunta', tName: 'Identificar el tejido u órgano', tStain: 'Identificar la tinción', tFeat: 'Reconocer el rasgo clave',
      setTimer: 'Tiempo por pregunta', tmOff: 'Sin límite', setOpts: 'Opciones', optAdaptive: 'Priorizar mis puntos débiles', optMicro: 'Visor tipo microscopio (campo circular)', optAuto: 'Autocompletado en la respuesta escrita',
      diff1: 'Básico', diff2: 'Medio', diff3: 'Difícil',
      mineTitle: 'Mis imágenes (solo esta sesión)', mineHelp: 'Añade fotos de tus prácticas. No se suben a ningún sitio y desaparecen al cerrar la página.', mineAdd: 'Añadir imágenes…', mineName: 'Nombre', mineStain: 'Tinción', mineRemove: 'Quitar', mineCat: 'Mis imágenes', mineNeed: 'Pon nombre a tus imágenes para usarlas.',
      q: 'Pregunta {i} de {n}', qName: '¿Qué tejido, órgano o célula es?', qStain: '¿Con qué tinción se ha teñido?', qFeat: '¿Qué afirmación describe esta imagen?', qTyped: 'Escribe qué es lo que ves',
      answerPh: 'Escribe tu respuesta…', check: 'Comprobar', hint: 'Pista', hintTxt: 'Pista: {cat}, empieza por «{first}» ({len} letras)',
      right: '¡Correcto!', wrong: 'No es esa', almost: 'Casi: lo has escrito con una errata', timeUp: 'Se acabó el tiempo', thisIs: 'Es: {n}', stainIs: 'Tinción: {s}', magIs: 'Aumento: {m}', keyFeat: 'Qué fijarse', nextQ: 'Siguiente', finish: 'Ver resultados', skip: 'Pasar',
      zoomHint: 'Rueda, pellizco o doble clic para ampliar · arrastra para mover', zoomIn: 'Acercar', zoomOut: 'Alejar', zoomReset: 'Encajar', micro: 'Vista de microscopio', fullscreen: 'Pantalla completa', imgFail: 'No se ha podido cargar la imagen',
      score: 'Resultado', ofQ: '{c} de {n} correctas', time: 'Tiempo', avgTime: 'Media por pregunta', streak: 'Racha', bestScore: 'Mejor resultado', newBest: '¡Nuevo récord!',
      byCat: 'Por categoría', weak: 'Para repasar', mistakes: 'Imágenes falladas', allRight: '¡Ni un fallo! Prueba con más dificultad.', again: 'Jugar otra vez', reviewWeak: 'Repasar mis puntos débiles', toHome: 'Volver al inicio', reviewErr: 'Repasar errores',
      studyTitle: 'Modo estudio', search: 'Buscar…', selfTest: 'Autoevaluación (ocultar nombres)', reveal: 'Mostrar respuesta', showFeat: 'Mostrar rasgos clave', hideFeat: 'Ocultar rasgos clave', prevImg: 'Anterior', nextImg: 'Siguiente', noResults: 'Ninguna imagen con estos filtros.',
      emptyPool: 'No hay imágenes con estos filtros. Amplía categorías o dificultad.', emptyErr: 'No tienes errores guardados todavía.', needStain: 'Faltan imágenes con tinción para este tipo de pregunta.',
      credits: 'Créditos', creditsLead: 'Todas las imágenes proceden de Wikimedia Commons y se usan según su licencia. Pulsa en cada una para ver la página de origen.', author: 'Autor', license: 'Licencia', source: 'Origen', mineLic: 'Imagen propia (solo sesión)',
      help: 'Cómo usar', helpHtml: '<ul class="help"><li><b>Quiz de opciones:</b> elige entre cuatro respuestas. Atajos: <kbd>1</kbd>–<kbd>4</kbd> para responder y <kbd>Intro</kbd> para seguir.</li><li><b>Respuesta escrita:</b> escribe el nombre (vale en cualquier idioma). Aceptamos pequeñas erratas y acentos distintos. Con <i>Pista</i> ganas medio punto en lugar de uno.</li><li><b>Modo estudio:</b> explora la galería, amplía y comprueba los rasgos clave. Activa la autoevaluación para ocultar los nombres.</li><li><b>Visor:</b> rueda del ratón, pellizco o doble clic para ampliar; arrastra para mover; <kbd>+</kbd> <kbd>−</kbd> <kbd>0</kbd> y flechas con el teclado. El botón del microscopio recorta el campo en círculo.</li><li><b>Repaso:</b> las imágenes que fallas se guardan en este navegador y salen en el repaso hasta que las aciertes.</li><li><b>Mis imágenes:</b> sube fotos de tus prácticas (solo para esta sesión) y ponles nombre para incluirlas.</li></ul>',
      close: 'Cerrar', resetData: 'Borrar mis datos', resetAsk: '¿Borrar mejores resultados, estadísticas y errores guardados en este navegador?', resetDone: 'Datos borrados', loadErr: 'No se han podido cargar los datos de las imágenes.', loadErrHelp: 'Si abres el archivo directamente desde el disco, el navegador lo bloquea: usa un servidor local o la web publicada.',
      cdot: 'Categoría', seen: 'vista {n} veces'
    },
    ca: {
      title: 'Quiz d\'histologia i citologia', pageTitle: 'Quiz d\'histologia i citologia',
      homeTitle: 'Aprèn a reconèixer el que veus al microscopi',
      homeLead: 'Teixits, òrgans, tincions, cèl·lules de la sang, citologia i anatomia patològica. Imatges amb llicència oberta, visor amb zoom i explicació de cada resposta.',
      stImages: 'imatges', stCats: 'categories', stMastered: 'dominades', stStreak: 'millor ratxa', stErrors: 'per repassar',
      mQuiz: 'Quiz d\'opcions', mQuizD: 'Quatre respostes per imatge: teixit, tinció o tret clau.',
      mTyped: 'Resposta escrita', mTypedD: 'Escriu el nom del que veus, amb autocompletat i tolerància a errates.',
      mStudy: 'Mode estudi', mStudyD: 'Galeria amb visor de zoom, trets clau i autoavaluació.',
      mReview: 'Repàs d\'errors', mReviewD: 'Torna a les imatges que has fallat fins a dominar-les.',
      mReviewN: '{n} pendents', mReviewNone: 'Sense errors desats',
      setCats: 'Categories', setAll: 'Totes', setNone: 'Cap', setDiff: 'Dificultat', setCount: 'Nombre de preguntes', setAllQ: 'Totes',
      setTypes: 'Tipus de pregunta', tName: 'Identificar el teixit o òrgan', tStain: 'Identificar la tinció', tFeat: 'Reconèixer el tret clau',
      setTimer: 'Temps per pregunta', tmOff: 'Sense límit', setOpts: 'Opcions', optAdaptive: 'Prioritzar els meus punts febles', optMicro: 'Visor tipus microscopi (camp circular)', optAuto: 'Autocompletat a la resposta escrita',
      diff1: 'Bàsic', diff2: 'Mitjà', diff3: 'Difícil',
      mineTitle: 'Les meves imatges (només aquesta sessió)', mineHelp: 'Afegeix fotos de les teves pràctiques. No es pugen enlloc i desapareixen en tancar la pàgina.', mineAdd: 'Afegeix imatges…', mineName: 'Nom', mineStain: 'Tinció', mineRemove: 'Treu', mineCat: 'Les meves imatges', mineNeed: 'Posa nom a les teves imatges per fer-les servir.',
      q: 'Pregunta {i} de {n}', qName: 'Quin teixit, òrgan o cèl·lula és?', qStain: 'Amb quina tinció s\'ha tenyit?', qFeat: 'Quina afirmació descriu aquesta imatge?', qTyped: 'Escriu què és el que veus',
      answerPh: 'Escriu la teva resposta…', check: 'Comprova', hint: 'Pista', hintTxt: 'Pista: {cat}, comença per «{first}» ({len} lletres)',
      right: 'Correcte!', wrong: 'No és aquesta', almost: 'Gairebé: ho has escrit amb una errada', timeUp: 'S\'ha acabat el temps', thisIs: 'És: {n}', stainIs: 'Tinció: {s}', magIs: 'Augment: {m}', keyFeat: 'Què cal mirar', nextQ: 'Següent', finish: 'Veure resultats', skip: 'Passa',
      zoomHint: 'Roda, pessigada o doble clic per ampliar · arrossega per moure', zoomIn: 'Acosta', zoomOut: 'Allunya', zoomReset: 'Ajusta', micro: 'Vista de microscopi', fullscreen: 'Pantalla completa', imgFail: 'No s\'ha pogut carregar la imatge',
      score: 'Resultat', ofQ: '{c} de {n} correctes', time: 'Temps', avgTime: 'Mitjana per pregunta', streak: 'Ratxa', bestScore: 'Millor resultat', newBest: 'Nou rècord!',
      byCat: 'Per categoria', weak: 'Per repassar', mistakes: 'Imatges fallades', allRight: 'Ni un error! Prova amb més dificultat.', again: 'Torna a jugar', reviewWeak: 'Repassar els meus punts febles', toHome: 'Torna a l\'inici', reviewErr: 'Repassar errors',
      studyTitle: 'Mode estudi', search: 'Cerca…', selfTest: 'Autoavaluació (amagar noms)', reveal: 'Mostra la resposta', showFeat: 'Mostra els trets clau', hideFeat: 'Amaga els trets clau', prevImg: 'Anterior', nextImg: 'Següent', noResults: 'Cap imatge amb aquests filtres.',
      emptyPool: 'No hi ha imatges amb aquests filtres. Amplia categories o dificultat.', emptyErr: 'Encara no tens errors desats.', needStain: 'Falten imatges amb tinció per a aquest tipus de pregunta.',
      credits: 'Crèdits', creditsLead: 'Totes les imatges provenen de Wikimedia Commons i s\'usen segons la seva llicència. Prem-ne una per veure la pàgina d\'origen.', author: 'Autor', license: 'Llicència', source: 'Origen', mineLic: 'Imatge pròpia (només sessió)',
      help: 'Com fer-ho servir', helpHtml: '<ul class="help"><li><b>Quiz d\'opcions:</b> tria entre quatre respostes. Dreceres: <kbd>1</kbd>–<kbd>4</kbd> per respondre i <kbd>Intro</kbd> per continuar.</li><li><b>Resposta escrita:</b> escriu el nom (val en qualsevol idioma). Acceptem petites errates i accents diferents. Amb <i>Pista</i> guanyes mig punt en lloc d\'un.</li><li><b>Mode estudi:</b> explora la galeria, amplia i comprova els trets clau. Activa l\'autoavaluació per amagar els noms.</li><li><b>Visor:</b> roda del ratolí, pessigada o doble clic per ampliar; arrossega per moure; <kbd>+</kbd> <kbd>−</kbd> <kbd>0</kbd> i fletxes amb el teclat. El botó del microscopi retalla el camp en cercle.</li><li><b>Repàs:</b> les imatges que falles es desen en aquest navegador i surten al repàs fins que les encertes.</li><li><b>Les meves imatges:</b> puja fotos de les teves pràctiques (només per a aquesta sessió) i posa-hi nom per incloure-les.</li></ul>',
      close: 'Tanca', resetData: 'Esborra les meves dades', resetAsk: 'Vols esborrar els millors resultats, estadístiques i errors desats en aquest navegador?', resetDone: 'Dades esborrades', loadErr: 'No s\'han pogut carregar les dades de les imatges.', loadErrHelp: 'Si obres l\'arxiu directament des del disc, el navegador ho bloqueja: fes servir un servidor local o la web publicada.',
      cdot: 'Categoria', seen: 'vista {n} cops'
    },
    en: {
      title: 'Histology & cytology quiz', pageTitle: 'Histology & cytology quiz',
      homeTitle: 'Learn to recognise what you see under the microscope',
      homeLead: 'Tissues, organs, stains, blood cells, cytology and anatomical pathology. Openly licensed images, a zoom viewer and an explanation for every answer.',
      stImages: 'images', stCats: 'categories', stMastered: 'mastered', stStreak: 'best streak', stErrors: 'to review',
      mQuiz: 'Multiple-choice quiz', mQuizD: 'Four answers per image: tissue, stain or key feature.',
      mTyped: 'Typed answer', mTypedD: 'Type the name of what you see, with autocomplete and typo tolerance.',
      mStudy: 'Study mode', mStudyD: 'Gallery with zoom viewer, key features and self-testing.',
      mReview: 'Review mistakes', mReviewD: 'Go back to the images you missed until you master them.',
      mReviewN: '{n} pending', mReviewNone: 'No saved mistakes',
      setCats: 'Categories', setAll: 'All', setNone: 'None', setDiff: 'Difficulty', setCount: 'Number of questions', setAllQ: 'All',
      setTypes: 'Question types', tName: 'Identify the tissue or organ', tStain: 'Identify the stain', tFeat: 'Recognise the key feature',
      setTimer: 'Time per question', tmOff: 'No limit', setOpts: 'Options', optAdaptive: 'Prioritise my weak spots', optMicro: 'Microscope-style viewer (circular field)', optAuto: 'Autocomplete in typed answers',
      diff1: 'Basic', diff2: 'Medium', diff3: 'Hard',
      mineTitle: 'My images (this session only)', mineHelp: 'Add photos from your lab sessions. They are not uploaded anywhere and disappear when you close the page.', mineAdd: 'Add images…', mineName: 'Name', mineStain: 'Stain', mineRemove: 'Remove', mineCat: 'My images', mineNeed: 'Name your images to use them.',
      q: 'Question {i} of {n}', qName: 'Which tissue, organ or cell is this?', qStain: 'Which stain was used?', qFeat: 'Which statement describes this image?', qTyped: 'Type what you see',
      answerPh: 'Type your answer…', check: 'Check', hint: 'Hint', hintTxt: 'Hint: {cat}, starts with “{first}” ({len} letters)',
      right: 'Correct!', wrong: 'Not that one', almost: 'Close: you made a small typo', timeUp: 'Time is up', thisIs: 'It is: {n}', stainIs: 'Stain: {s}', magIs: 'Magnification: {m}', keyFeat: 'What to look for', nextQ: 'Next', finish: 'See results', skip: 'Skip',
      zoomHint: 'Wheel, pinch or double-click to zoom · drag to move', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomReset: 'Fit', micro: 'Microscope view', fullscreen: 'Full screen', imgFail: 'The image could not be loaded',
      score: 'Result', ofQ: '{c} of {n} correct', time: 'Time', avgTime: 'Average per question', streak: 'Streak', bestScore: 'Best result', newBest: 'New record!',
      byCat: 'By category', weak: 'To review', mistakes: 'Missed images', allRight: 'Not a single mistake! Try a harder level.', again: 'Play again', reviewWeak: 'Review my weak spots', toHome: 'Back to start', reviewErr: 'Review mistakes',
      studyTitle: 'Study mode', search: 'Search…', selfTest: 'Self-test (hide names)', reveal: 'Show answer', showFeat: 'Show key features', hideFeat: 'Hide key features', prevImg: 'Previous', nextImg: 'Next', noResults: 'No images match these filters.',
      emptyPool: 'No images match these filters. Widen categories or difficulty.', emptyErr: 'You have no saved mistakes yet.', needStain: 'Not enough images with a stain for this question type.',
      credits: 'Credits', creditsLead: 'All images come from Wikimedia Commons and are used under their licences. Click one to see its source page.', author: 'Author', license: 'Licence', source: 'Source', mineLic: 'Own image (session only)',
      help: 'How to use', helpHtml: '<ul class="help"><li><b>Multiple choice:</b> pick one of four answers. Shortcuts: <kbd>1</kbd>–<kbd>4</kbd> to answer and <kbd>Enter</kbd> to continue.</li><li><b>Typed answer:</b> type the name (any language works). Small typos and different accents are accepted. Using <i>Hint</i> earns half a point instead of one.</li><li><b>Study mode:</b> browse the gallery, zoom in and check the key features. Turn on self-test to hide the names.</li><li><b>Viewer:</b> mouse wheel, pinch or double-click to zoom; drag to move; <kbd>+</kbd> <kbd>−</kbd> <kbd>0</kbd> and arrow keys on the keyboard. The microscope button crops the field to a circle.</li><li><b>Review:</b> images you miss are saved in this browser and come back in the review until you get them right.</li><li><b>My images:</b> add photos from your lab sessions (this session only) and name them to include them.</li></ul>',
      close: 'Close', resetData: 'Delete my data', resetAsk: 'Delete best results, statistics and mistakes saved in this browser?', resetDone: 'Data deleted', loadErr: 'The image data could not be loaded.', loadErrHelp: 'If you open the file straight from your disk the browser blocks it: use a local server or the published site.',
      cdot: 'Category', seen: 'seen {n} times'
    }
  };
  const t = K.i18n(I18N);

  /* ------------------------- estado ------------------------- */
  const app = document.getElementById('app');
  const state = {
    data: null, imgs: [], byId: {}, cats: [], stains: {}, mine: [], view: 'home', session: null, timer: null, viewer: null,
    study: { cat: null, q: '', self: false }
  };
  const DEF = { cats: null, diffs: [1, 2, 3], n: 10, types: ['name', 'stain', 'feat'], timer: 0, adaptive: true, micro: false, auto: true };
  const cfg = Object.assign({}, DEF, S.get('settings', {}));
  const saveCfg = () => S.set('settings', cfg);
  const stats = () => S.get('stats', {});
  const errorsList = () => S.get('errors', []);

  /* ------------------------- utilidades ------------------------- */
  const L = (obj) => (obj ? (obj[K.lang] ?? obj.es ?? '') : '');
  const nameOf = (im) => (im.nombre ? L(im.nombre) : im.name || '');
  const featOf = (im) => (im.rasgos ? (im.rasgos[K.lang] || im.rasgos.es || []) : []);
  const MINE = { id: 'mine', color: '#f0a6d8', nombre: { es: 'Mis imágenes', ca: 'Les meves imatges', en: 'My images' } };
  const catOf = (id) => (id === 'mine' ? MINE : state.cats.find(c => c.id === id) || { id, color: '#b08be0', nombre: { es: id } });
  const catName = (id) => L(catOf(id).nombre);
  const stainName = (key) => (state.stains[key] ? L(state.stains[key]) : key);
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const names = (im) => {
    const out = new Set();
    for (const l of K.LANGS) { if (im.nombre && im.nombre[l]) out.add(im.nombre[l]); ((im.alias && im.alias[l]) || []).forEach(a => out.add(a)); }
    if (im.name) out.add(im.name);
    return [...out];
  };
  const fmtTime = (s) => K.mmss(s);
  const sample = (arr, n) => K.shuffle(arr).slice(0, n);
  const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);

  function attribution(im) {
    if (im.propia) return `<div class="credit">${esc(t('mineLic'))}</div>`;
    const lic = im.licurl ? `<a href="${esc(im.licurl)}" target="_blank" rel="noopener">${esc(im.licencia)}</a>` : esc(im.licencia);
    return `<div class="credit">${esc(im.autor || '—')} · ${lic} · <a href="${esc(im.origen)}" target="_blank" rel="noopener">${esc(t('source'))}</a></div>`;
  }

  /* ------------------------- visor con zoom ------------------------- */
  function createViewer(host, opts = {}) {
    host.classList.add('viewer'); host.tabIndex = 0;
    host.setAttribute('role', 'img');
    host.innerHTML = `<img class="v-img" alt="" draggable="false"><div class="v-vig"></div><div class="v-err">${esc(t('imgFail'))}</div>
      <span class="v-mag" hidden></span><span class="v-hint">${esc(t('zoomHint'))}</span><span class="v-zoom">×1</span>
      <div class="v-ctl"><button type="button" data-a="in" title="${esc(t('zoomIn'))}" aria-label="${esc(t('zoomIn'))}">+</button><button type="button" data-a="out" title="${esc(t('zoomOut'))}" aria-label="${esc(t('zoomOut'))}">−</button><button type="button" data-a="fit" title="${esc(t('zoomReset'))}" aria-label="${esc(t('zoomReset'))}">⤢</button><button type="button" data-a="micro" title="${esc(t('micro'))}" aria-label="${esc(t('micro'))}" aria-pressed="false">◉</button><button type="button" data-a="fs" title="${esc(t('fullscreen'))}" aria-label="${esc(t('fullscreen'))}">⛶</button></div>`;
    const img = host.querySelector('.v-img'), zl = host.querySelector('.v-zoom'), hint = host.querySelector('.v-hint'), mag = host.querySelector('.v-mag');
    let s = 1, tx = 0, ty = 0; const ptrs = new Map(); let pinch = null, last = null, dragged = false;
    const MAX = 10;
    const apply = () => { img.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; zl.textContent = '×' + (Math.round(s * 10) / 10).toString().replace('.', K.lang === 'en' ? '.' : ','); };
    const clampPan = () => { const r = host.getBoundingClientRect(); const mx = r.width * (s - 1) / 2, my = r.height * (s - 1) / 2; tx = K.clamp(tx, -mx, mx); ty = K.clamp(ty, -my, my); };
    const zoomAt = (f, px, py) => {
      const r = host.getBoundingClientRect(); const cx = (px ?? r.left + r.width / 2) - r.left - r.width / 2, cy = (py ?? r.top + r.height / 2) - r.top - r.height / 2;
      const ns = K.clamp(s * f, 1, MAX), k = ns / s; tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; s = ns; if (s === 1) { tx = 0; ty = 0; } clampPan(); apply(); hint.classList.add('gone');
    };
    const reset = () => { s = 1; tx = 0; ty = 0; apply(); };
    host.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0017)), e.clientX, e.clientY); }, { passive: false });
    host.addEventListener('pointerdown', e => { if (e.target.closest('.v-ctl')) return; host.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragged = false; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; } last = { x: e.clientX, y: e.clientY }; });
    host.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt(d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch.d = d; dragged = true; }
      else if (ptrs.size === 1 && s > 1) { tx += e.clientX - last.x; ty += e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; clampPan(); apply(); dragged = true; hint.classList.add('gone'); }
    });
    const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('dblclick', e => { if (e.target.closest('.v-ctl')) return; if (s > 1) reset(); else zoomAt(3, e.clientX, e.clientY); });
    host.addEventListener('keydown', e => {
      const step = 70; let used = true;
      if (e.key === '+' || e.key === '=') zoomAt(1.4);
      else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.4);
      else if (e.key === '0' || e.key === 'Home') reset();
      else if (e.key === 'ArrowLeft' && s > 1) { tx += step; clampPan(); apply(); }
      else if (e.key === 'ArrowRight' && s > 1) { tx -= step; clampPan(); apply(); }
      else if (e.key === 'ArrowUp' && s > 1) { ty += step; clampPan(); apply(); }
      else if (e.key === 'ArrowDown' && s > 1) { ty -= step; clampPan(); apply(); }
      else used = false;
      if (used) { e.preventDefault(); e.stopPropagation(); }
    });
    host.querySelector('.v-ctl').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'in') zoomAt(1.5); else if (a === 'out') zoomAt(1 / 1.5); else if (a === 'fit') reset();
      else if (a === 'micro') { const on = !host.classList.contains('micro'); host.classList.toggle('micro', on); b.setAttribute('aria-pressed', String(on)); cfg.micro = on; saveCfg(); }
      else if (a === 'fs') { if (document.fullscreenElement) document.exitFullscreen(); else if (host.requestFullscreen) host.requestFullscreen(); }
    });
    window.addEventListener('resize', () => { clampPan(); apply(); });
    img.addEventListener('error', () => host.classList.add('fail'));
    img.addEventListener('load', () => host.classList.remove('fail'));
    const micro = (on) => { host.classList.toggle('micro', on); host.querySelector('[data-a="micro"]').setAttribute('aria-pressed', String(on)); };
    micro(!!cfg.micro);
    return {
      set(im) { host.classList.remove('fail'); reset(); hint.classList.remove('gone'); img.src = im.archivo; host.setAttribute('aria-label', im.alt || ''); if (im.aumento && !opts.hideMag) { mag.hidden = false; mag.textContent = im.aumento; } else mag.hidden = true; },
      reset, micro, setAlt(a) { host.setAttribute('aria-label', a); }
    };
  }

  /* ------------------------- selección y preguntas ------------------------- */
  function poolFromCfg() {
    const cats = cfg.cats || state.cats.map(c => c.id);
    return state.imgs.filter(im => im.propia || (cats.includes(im.categoria) && cfg.diffs.includes(im.dificultad || 1)));
  }
  function weightedSample(pool, n) {
    const st = stats(); const items = pool.map(im => { const x = st[im.id]; const w = !cfg.adaptive ? 1 : !x || !x.seen ? 1.6 : 1 + 2.5 * (1 - x.ok / x.seen); return { im, w: w * (0.6 + Math.random() * .8) }; });
    items.sort((a, b) => b.w - a.w); return K.shuffle(items.slice(0, n).map(i => i.im));
  }
  function distractImgs(im, count) {
    const others = state.imgs.filter(o => o.id !== im.id && names(o).every(nm => norm(nm) !== norm(nameOf(im))));
    const same = K.shuffle(others.filter(o => (im.grupo && o.grupo === im.grupo)));
    const sameCat = K.shuffle(others.filter(o => o.categoria === im.categoria && !same.includes(o)));
    const rest = K.shuffle(others.filter(o => !same.includes(o) && !sameCat.includes(o)));
    const out = [], seen = new Set([norm(nameOf(im))]);
    for (const o of [...same, ...sameCat, ...rest]) { const n = norm(nameOf(o)); if (seen.has(n)) continue; seen.add(n); out.push(o); if (out.length >= count) break; }
    return out;
  }
  function makeQuestion(im, mode) {
    if (mode === 'typed') return { im, type: 'typed' };
    const avail = [];
    if (cfg.types.includes('name')) avail.push('name');
    if (cfg.types.includes('stain') && im.tincion && !im.propia) avail.push('stain');
    if (cfg.types.includes('feat') && featOf(im).length && !im.propia) avail.push('feat');
    if (!avail.length) avail.push('name');
    const weights = { name: 3, stain: 1.2, feat: 1.2 };
    let r = Math.random() * avail.reduce((a, k) => a + weights[k], 0), type = avail[0];
    for (const k of avail) { r -= weights[k]; if (r <= 0) { type = k; break; } }
    let options;
    if (type === 'name') options = [{ kind: 'img', id: im.id, ok: true }, ...distractImgs(im, 3).map(o => ({ kind: 'img', id: o.id, ok: false }))];
    else if (type === 'stain') {
      const keys = Object.keys(state.stains).filter(k => k !== im.tincion);
      const sameC = state.imgs.filter(o => o.categoria === im.categoria && o.tincion && o.tincion !== im.tincion).map(o => o.tincion);
      const pick = [...new Set([...K.shuffle(sameC), ...K.shuffle(keys)])].filter(k => k !== im.tincion && state.stains[k]).slice(0, 3);
      options = [{ kind: 'stain', id: im.tincion, ok: true }, ...pick.map(k => ({ kind: 'stain', id: k, ok: false }))];
    } else {
      const fi = Math.floor(Math.random() * featOf(im).length);
      const others = K.shuffle(state.imgs.filter(o => o.id !== im.id && !o.propia && featOf(o).length && o.categoria === im.categoria && o.grupo !== im.grupo));
      const more = K.shuffle(state.imgs.filter(o => o.id !== im.id && !o.propia && featOf(o).length && !others.includes(o)));
      const ds = [...others, ...more].slice(0, 3).map(o => ({ kind: 'feat', id: o.id, fi: Math.floor(Math.random() * featOf(o).length), ok: false }));
      options = [{ kind: 'feat', id: im.id, fi, ok: true }, ...ds];
    }
    if (options.length < 2) { type = 'name'; options = [{ kind: 'img', id: im.id, ok: true }, ...distractImgs(im, 3).map(o => ({ kind: 'img', id: o.id, ok: false }))]; }
    return { im, type, options: K.shuffle(options) };
  }
  const optLabel = (o) => {
    if (o.kind === 'img') return nameOf(state.byId[o.id]);
    if (o.kind === 'stain') return stainName(o.id);
    return featOf(state.byId[o.id])[o.fi] || '';
  };

  function startSession(mode) {
    let pool;
    if (mode === 'review') { const ids = errorsList(); pool = ids.map(id => state.byId[id]).filter(Boolean); if (!pool.length) { K.toast(t('emptyErr')); return; } }
    else pool = poolFromCfg();
    if (mode !== 'review' && state.mine.some(m => !m.name?.trim())) { K.toast(t('mineNeed')); return; }
    if (!pool.length) { K.toast(t('emptyPool')); return; }
    const n = cfg.n === 0 ? pool.length : Math.min(cfg.n, pool.length);
    const chosen = weightedSample(pool, n);
    state.session = { mode, qs: chosen.map(im => makeQuestion(im, mode)), i: 0, answers: [], streak: 0, bestStreak: 0, t0: Date.now(), qStart: Date.now(), cur: null };
    state.view = 'quiz'; render();
  }

  /* ------------------------- estadísticas ------------------------- */
  function record(im, correct, weight = 1) {
    const st = stats(); const x = st[im.id] || { seen: 0, ok: 0 }; x.seen += 1; x.ok += correct ? weight : 0; x.last = Date.now(); st[im.id] = x; S.set('stats', st);
    let errs = errorsList(); if (correct && weight >= 1) errs = errs.filter(id => id !== im.id); else if (!correct && !im.propia && !errs.includes(im.id)) errs.push(im.id); S.set('errors', errs);
  }
  const mastered = () => { const st = stats(); return state.imgs.filter(im => st[im.id] && st[im.id].seen >= 2 && st[im.id].ok / st[im.id].seen >= .8).length; };

  /* ------------------------- vistas ------------------------- */
  const ICONS = {
    quiz: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6M7 17h3"/></svg>',
    typed: '<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M14 7l3 3"/></svg>',
    study: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8v6M8 11h6"/></svg>',
    review: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M20 4v5h-5M4 20v-5h5"/></svg>'
  };
  function chips(items, selected, attr) {
    return items.map(i => `<button type="button" ${attr}="${esc(i.id)}" aria-pressed="${selected.includes(i.id)}" style="--c:${esc(i.color || 'var(--accent)')}">${esc(i.label)}</button>`).join('');
  }

  function viewHome() {
    const nErr = errorsList().filter(id => state.byId[id]).length;
    const cats = state.cats.map(c => ({ id: c.id, label: L(c.nombre), color: c.color }));
    const sel = cfg.cats || cats.map(c => c.id);
    const collage = sample(state.imgs.filter(i => i.miniatura), 4).map(i => `<img src="${esc(i.miniatura)}" alt="" loading="lazy">`).join('');
    app.innerHTML = `
      <section class="hero">
        <div>
          <h2>${esc(t('homeTitle'))}</h2><p>${esc(t('homeLead'))}</p>
          <div class="hero-stats">
            <span class="chip"><b>${state.imgs.filter(i => !i.propia).length}</b> ${esc(t('stImages'))}</span>
            <span class="chip"><b>${state.cats.length}</b> ${esc(t('stCats'))}</span>
            <span class="chip"><b>${mastered()}</b> ${esc(t('stMastered'))}</span>
            <span class="chip"><b>${S.get('bestStreak', 0)}</b> ${esc(t('stStreak'))}</span>
          </div>
        </div>
        <div class="hero-fov" aria-hidden="true"><div class="fov-collage">${collage}</div></div>
      </section>
      <section class="modes" aria-label="${esc(t('help'))}">
        <button class="mode" data-mode="quiz" type="button">${ICONS.quiz}<b>${esc(t('mQuiz'))}</b><span>${esc(t('mQuizD'))}</span></button>
        <button class="mode" data-mode="typed" type="button">${ICONS.typed}<b>${esc(t('mTyped'))}</b><span>${esc(t('mTypedD'))}</span></button>
        <button class="mode" data-mode="study" type="button">${ICONS.study}<b>${esc(t('mStudy'))}</b><span>${esc(t('mStudyD'))}</span></button>
        <button class="mode" data-mode="review" type="button" ${nErr ? '' : 'disabled'}>${ICONS.review}<b>${esc(t('mReview'))}</b><span>${esc(t('mReviewD'))}</span><span class="chip ${nErr ? 'accent' : ''}">${esc(nErr ? t('mReviewN', { n: nErr }) : t('mReviewNone'))}</span></button>
      </section>
      <section class="panel settings">
        <div style="grid-column:1/-1"><h3>${esc(t('setCats'))} <button type="button" class="btn ghost small" data-cats="all">${esc(t('setAll'))}</button> <button type="button" class="btn ghost small" data-cats="none">${esc(t('setNone'))}</button></h3><div class="pick" id="pk-cats">${chips(cats, sel, 'data-cat')}</div></div>
        <div><h3>${esc(t('setDiff'))}</h3><div class="pick plain" id="pk-diff">${chips([1, 2, 3].map(d => ({ id: String(d), label: t('diff' + d) })), cfg.diffs.map(String), 'data-diff')}</div></div>
        <div><h3>${esc(t('setCount'))}</h3><div class="seg" id="sg-n">${[5, 10, 20, 0].map(n => `<button type="button" data-n="${n}" aria-pressed="${cfg.n === n}">${n === 0 ? esc(t('setAllQ')) : n}</button>`).join('')}</div></div>
        <div><h3>${esc(t('setTypes'))}</h3><div class="stack" id="pk-types" style="gap:8px">
          ${[['name', 'tName'], ['stain', 'tStain'], ['feat', 'tFeat']].map(([k, l]) => `<label class="check"><input type="checkbox" data-type="${k}" ${cfg.types.includes(k) ? 'checked' : ''}> ${esc(t(l))}</label>`).join('')}</div></div>
        <div><h3>${esc(t('setTimer'))}</h3><div class="seg" id="sg-timer">${[0, 20, 40, 60].map(s => `<button type="button" data-timer="${s}" aria-pressed="${cfg.timer === s}">${s ? s + ' s' : esc(t('tmOff'))}</button>`).join('')}</div></div>
        <div><h3>${esc(t('setOpts'))}</h3><div class="stack" style="gap:8px">
          <label class="check"><input type="checkbox" data-opt="adaptive" ${cfg.adaptive ? 'checked' : ''}> ${esc(t('optAdaptive'))}</label>
          <label class="check"><input type="checkbox" data-opt="micro" ${cfg.micro ? 'checked' : ''}> ${esc(t('optMicro'))}</label>
          <label class="check"><input type="checkbox" data-opt="auto" ${cfg.auto ? 'checked' : ''}> ${esc(t('optAuto'))}</label></div></div>
        <div style="grid-column:1/-1"><h3>${esc(t('mineTitle'))}</h3><p class="muted" style="margin:0 0 8px;font-size:.92rem">${esc(t('mineHelp'))}</p>
          <label class="btn ghost small" style="cursor:pointer">${esc(t('mineAdd'))}<input type="file" id="mine-file" accept="image/*" multiple hidden></label>
          <div class="mine-list" id="mine-list"></div></div>
      </section>
      <div class="row spread no-print"><button type="button" class="btn ghost small" id="reset-data">${esc(t('resetData'))}</button><span class="muted" style="font-size:.85rem">${esc(t('credits'))}: <a href="#" id="open-credits">Wikimedia Commons</a></span></div>`;
    renderMine();
    bindHome();
  }

  function renderMine() {
    const box = document.getElementById('mine-list'); if (!box) return;
    box.innerHTML = state.mine.map((m, i) => `<div class="mine-item" data-i="${i}"><img src="${esc(m.archivo)}" alt=""><input type="text" data-f="name" value="${esc(m.name || '')}" placeholder="${esc(t('mineName'))}" aria-label="${esc(t('mineName'))}"><input type="text" data-f="stain" value="${esc(m.stainText || '')}" placeholder="${esc(t('mineStain'))}" aria-label="${esc(t('mineStain'))}"><button type="button" class="btn ghost small" data-rm="${i}">${esc(t('mineRemove'))}</button></div>`).join('');
  }

  function bindHome() {
    app.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => {
      const m = b.dataset.mode; if (m === 'study') { state.view = 'study'; render(); } else startSession(m);
    }));
    const catIds = state.cats.map(c => c.id);
    document.getElementById('pk-cats').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const cur = cfg.cats || catIds.slice(); const id = b.dataset.cat;
      cfg.cats = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]; if (cfg.cats.length === catIds.length) cfg.cats = null; saveCfg(); b.setAttribute('aria-pressed', String(!cur.includes(id)));
    });
    app.querySelectorAll('[data-cats]').forEach(b => b.addEventListener('click', () => { cfg.cats = b.dataset.cats === 'all' ? null : []; saveCfg(); render(); }));
    document.getElementById('pk-diff').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const d = Number(b.dataset.diff); const on = cfg.diffs.includes(d);
      if (on && cfg.diffs.length === 1) return; cfg.diffs = on ? cfg.diffs.filter(x => x !== d) : [...cfg.diffs, d].sort(); saveCfg(); b.setAttribute('aria-pressed', String(!on));
    });
    document.getElementById('sg-n').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg.n = Number(b.dataset.n); saveCfg(); document.querySelectorAll('#sg-n button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    document.getElementById('sg-timer').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg.timer = Number(b.dataset.timer); saveCfg(); document.querySelectorAll('#sg-timer button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    document.getElementById('pk-types').addEventListener('change', e => {
      const k = e.target.dataset.type; if (!k) return; let ty = cfg.types.filter(x => x !== k); if (e.target.checked) ty.push(k);
      const empty = !ty.length; if (empty) ty = ['name']; cfg.types = ty; saveCfg(); if (empty) render();
    });
    app.querySelectorAll('[data-opt]').forEach(c => c.addEventListener('change', () => { cfg[c.dataset.opt] = c.checked; saveCfg(); }));
    document.getElementById('mine-file').addEventListener('change', e => {
      for (const f of e.target.files) {
        const url = URL.createObjectURL(f); const base = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        state.mine.push({ id: 'mine-' + K.uid(), propia: true, archivo: url, miniatura: url, categoria: 'mine', name: base, stainText: '', dificultad: 1, rasgos: null });
      }
      e.target.value = ''; syncMine(); renderMine();
    });
    document.getElementById('mine-list').addEventListener('input', e => {
      const row = e.target.closest('.mine-item'); if (!row) return; const m = state.mine[Number(row.dataset.i)]; if (!m) return;
      if (e.target.dataset.f === 'name') m.name = e.target.value; else m.stainText = e.target.value; syncMine();
    });
    document.getElementById('mine-list').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; state.mine.splice(Number(b.dataset.rm), 1); syncMine(); renderMine(); });
    document.getElementById('reset-data').addEventListener('click', async () => { if (await K.confirm(t('resetAsk'), { danger: true, okText: K.t('delete') })) { ['stats', 'errors', 'best', 'bestStreak'].forEach(k => S.remove(k)); K.toast(t('resetDone')); render(); } });
    document.getElementById('open-credits').addEventListener('click', e => { e.preventDefault(); state.view = 'credits'; render(); });
  }
  /* Las imágenes propias entran en el conjunto de trabajo con su nombre */
  function syncMine() {
    state.imgs = state.imgs.filter(i => !i.propia);
    state.mine.forEach(m => { m.nombre = { es: m.name, ca: m.name, en: m.name }; m.alt = m.name; });
    state.imgs.push(...state.mine.filter(m => (m.name || '').trim()));
    state.byId = Object.fromEntries(state.imgs.map(i => [i.id, i]));
  }

  /* ----- partida ----- */
  function viewQuiz() {
    const ss = state.session; if (!ss) { state.view = 'home'; return render(); }
    const q = ss.qs[ss.i]; ss.cur = q; const n = ss.qs.length; const last = ss.i === n - 1;
    const prompt = q.type === 'typed' ? t('qTyped') : q.type === 'stain' ? t('qStain') : q.type === 'feat' ? t('qFeat') : t('qName');
    const correctCount = ss.answers.filter(a => a.correct).length;
    app.innerHTML = `
      <div class="q-top"><button type="button" class="btn ghost small" id="q-quit">✕ ${esc(K.t('close'))}</button><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${ss.i}"><i style="width:${pct(ss.i, n)}%"></i></div>
        <div class="q-meta"><span>${esc(t('q', { i: ss.i + 1, n }))}</span><span>✔ <b>${correctCount}</b></span><span>🔥 <b>${ss.streak}</b></span></div></div>
      ${cfg.timer ? '<div class="timer" aria-hidden="true"><i id="q-timer"></i></div>' : ''}
      <div class="quiz">
        <div><div id="q-view"></div><div class="muted" style="margin-top:8px;font-size:.9rem" id="q-cat"></div></div>
        <div class="panel">
          <p class="q-prompt">${esc(prompt)}</p>
          <div id="q-body"></div>
          <div id="q-fb"></div>
        </div>
      </div>`;
    state.viewer = createViewer(document.getElementById('q-view'), { hideMag: q.type === 'stain' });
    state.viewer.set({ archivo: q.im.archivo, aumento: q.type === 'stain' ? null : q.im.aumento, alt: '' });
    const body = document.getElementById('q-body');
    if (q.type === 'typed') {
      body.innerHTML = `<div class="typed"><div class="row"><input type="text" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t('answerPh'))}" aria-label="${esc(t('qTyped'))}"><button type="button" class="btn" id="ans-ok">${esc(t('check'))}</button></div>
        <div class="row"><button type="button" class="btn ghost small" id="ans-hint">💡 ${esc(t('hint'))}</button><button type="button" class="btn ghost small" id="ans-skip">${esc(t('skip'))}</button><small class="muted" id="hint-txt"></small></div><div class="suggest" id="sug" hidden></div></div>`;
      bindTyped(q);
    } else {
      body.innerHTML = `<div class="opts" role="group" aria-label="${esc(prompt)}">${q.options.map((o, i) => `<button type="button" class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(optLabel(o))}</span></button>`).join('')}</div>`;
      body.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => answerChoice(q, Number(b.dataset.i))));
      body.querySelector('.opt').focus({ preventScroll: true });
    }
    document.getElementById('q-quit').addEventListener('click', async () => { if (await K.confirm(t('toHome') + '?')) { stopTimer(); state.view = 'home'; render(); } });
    ss.qStart = Date.now(); startTimer(q);
    if (q.answered) showFeedback(q);   // al cambiar de idioma a media pregunta
  }

  function startTimer(q) {
    stopTimer(); if (!cfg.timer || q.answered) return;
    const bar = document.getElementById('q-timer'); const total = cfg.timer * 1000; const t0 = Date.now();
    state.timer = setInterval(() => {
      const left = Math.max(0, total - (Date.now() - t0)); if (bar) bar.style.transform = `scaleX(${left / total})`;
      if (left <= 0) { stopTimer(); if (!q.answered) finishAnswer(q, { correct: false, timeout: true }); }
    }, 100);
  }
  const stopTimer = () => { if (state.timer) { clearInterval(state.timer); state.timer = null; } };

  function answerChoice(q, i) {
    if (q.answered) return; const o = q.options[i]; finishAnswer(q, { correct: o.ok, chosen: i });
  }
  function finishAnswer(q, res) {
    const ss = state.session; stopTimer(); const ms = Date.now() - ss.qStart;
    q.answered = Object.assign({ ms }, res);
    const weight = res.hint ? .5 : 1;
    ss.answers.push({ id: q.im.id, cat: q.im.categoria, correct: res.correct, type: q.type, ms, weight: res.correct ? weight : 0 });
    ss.streak = res.correct ? ss.streak + 1 : 0; ss.bestStreak = Math.max(ss.bestStreak, ss.streak);
    record(q.im, res.correct, weight);
    if (ss.bestStreak > S.get('bestStreak', 0)) S.set('bestStreak', ss.bestStreak);
    showFeedback(q);
    const metaStreak = app.querySelector('.q-meta'); if (metaStreak) metaStreak.innerHTML = `<span>${esc(t('q', { i: ss.i + 1, n: ss.qs.length }))}</span><span>✔ <b>${ss.answers.filter(a => a.correct).length}</b></span><span>🔥 <b>${ss.streak}</b></span>`;
  }
  function showFeedback(q) {
    const ss = state.session, a = q.answered, im = q.im, last = ss.i === ss.qs.length - 1;
    const body = document.getElementById('q-body');
    if (q.type !== 'typed') body.querySelectorAll('.opt').forEach((b, i) => { b.disabled = true; const o = q.options[i]; if (o.ok) b.classList.add('ok'); else if (a.chosen === i) b.classList.add('bad'); else b.classList.add('dim'); });
    else { const inp = document.getElementById('ans'); if (inp) { inp.disabled = true; } ['ans-ok', 'ans-hint', 'ans-skip'].forEach(id => { const e = document.getElementById(id); if (e) e.disabled = true; }); const sg = document.getElementById('sug'); if (sg) sg.hidden = true; }
    const feats = featOf(im);
    const head = a.timeout ? t('timeUp') : a.correct ? (a.near ? t('almost') : t('right')) : t('wrong');
    document.getElementById('q-fb').innerHTML = `<div class="fb ${a.correct ? 'ok' : 'bad'}" role="status"><h3>${a.correct ? '✔' : '✖'} ${esc(head)}</h3>
      <div><b>${esc(t('thisIs', { n: nameOf(im) }))}</b>${im.tincion ? ` · ${esc(t('stainIs', { s: stainName(im.tincion) }))}` : im.stainText ? ` · ${esc(t('stainIs', { s: im.stainText }))}` : ''}${im.aumento ? ` · ${esc(t('magIs', { m: im.aumento }))}` : ''}</div>
      <div class="tag-cat" style="--c:${esc(catOf(im.categoria).color)};margin-top:4px">${esc(catName(im.categoria))}</div>
      ${feats.length ? `<div style="margin-top:8px"><b>${esc(t('keyFeat'))}</b><ul>${feats.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
      ${attribution(im)}
      <div class="go"><button type="button" class="btn" id="q-next">${esc(last ? t('finish') : t('nextQ'))}</button></div></div>`;
    const nx = document.getElementById('q-next'); nx.focus({ preventScroll: true });
    nx.addEventListener('click', nextQuestion);
  }
  function nextQuestion() {
    const ss = state.session; if (!ss) return;
    if (ss.i >= ss.qs.length - 1) { finishSession(); return; }
    ss.i += 1; render();
  }

  function bindTyped(q) {
    const inp = document.getElementById('ans'), sug = document.getElementById('sug'); let hinted = false, active = -1;
    inp.focus({ preventScroll: true });
    const allNames = () => [...new Set(state.imgs.filter(i => !i.propia || true).map(nameOf))].sort((a, b) => a.localeCompare(b, K.lang));
    const updateSug = () => {
      if (!cfg.auto) { sug.hidden = true; return; } const v = norm(inp.value); if (v.length < 2) { sug.hidden = true; return; }
      const list = allNames().filter(n => norm(n).includes(v)).slice(0, 6);
      active = -1; sug.hidden = !list.length; sug.innerHTML = list.map((n, i) => `<button type="button" role="option" data-v="${esc(n)}">${esc(n)}</button>`).join('');
    };
    inp.addEventListener('input', updateSug);
    sug.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; inp.value = b.dataset.v; sug.hidden = true; inp.focus(); });
    const submit = () => {
      const v = norm(inp.value); if (!v) return; let best = 99, exact = false;
      for (const nm of names(q.im)) { const tn = norm(nm); if (!tn) continue; if (tn === v) { exact = true; best = 0; break; } const d = lev(v, tn); const allow = tn.length <= 5 ? 0 : tn.length <= 9 ? 1 : 2; if (d <= allow) best = Math.min(best, d); }
      const ok = best < 99; finishAnswer(q, { correct: ok, near: ok && !exact, hint: hinted, typed: inp.value });
    };
    document.getElementById('ans-ok').addEventListener('click', submit);
    inp.addEventListener('keydown', e => {
      const items = [...sug.querySelectorAll('button')];
      if (e.key === 'ArrowDown' && items.length && !sug.hidden) { e.preventDefault(); active = (active + 1) % items.length; items.forEach((b, i) => b.setAttribute('aria-selected', String(i === active))); }
      else if (e.key === 'ArrowUp' && items.length && !sug.hidden) { e.preventDefault(); active = (active - 1 + items.length) % items.length; items.forEach((b, i) => b.setAttribute('aria-selected', String(i === active))); }
      else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0 && items[active] && !sug.hidden) { inp.value = items[active].dataset.v; sug.hidden = true; active = -1; } else submit(); }
      else if (e.key === 'Escape') sug.hidden = true;
    });
    document.getElementById('ans-hint').addEventListener('click', () => {
      hinted = true; const nm = nameOf(q.im); document.getElementById('hint-txt').textContent = t('hintTxt', { cat: catName(q.im.categoria), first: nm.charAt(0).toUpperCase(), len: nm.replace(/\s/g, '').length }); inp.focus();
    });
    document.getElementById('ans-skip').addEventListener('click', () => finishAnswer(q, { correct: false, skipped: true }));
  }

  /* ----- resultados ----- */
  function finishSession() {
    const ss = state.session; stopTimer(); ss.t1 = Date.now(); state.view = 'results'; render();
  }
  function viewResults() {
    const ss = state.session; if (!ss) { state.view = 'home'; return render(); }
    const n = ss.answers.length, pts = ss.answers.reduce((a, x) => a + x.weight, 0), score = pct(pts, n), okN = ss.answers.filter(a => a.correct).length;
    const secs = Math.round((ss.t1 - ss.t0) / 1000);
    const bestKey = ss.mode + ':' + n; const best = S.get('best', {}); const prev = best[bestKey]; const isBest = !prev || score > prev.score || (score === prev.score && secs < prev.secs);
    if (isBest && n >= 3) { best[bestKey] = { score, secs, date: Date.now() }; S.set('best', best); }
    const prevBest = prev && n >= 3 ? prev : null;
    const byCat = {}; ss.answers.forEach(a => { (byCat[a.cat] = byCat[a.cat] || { n: 0, p: 0 }); byCat[a.cat].n++; byCat[a.cat].p += a.weight; });
    const rows = Object.entries(byCat).map(([id, v]) => ({ id, n: v.n, pc: pct(v.p, v.n) })).sort((a, b) => a.pc - b.pc);
    const weak = rows.filter(r => r.pc < 70 && r.n >= 1);
    const wrong = ss.answers.filter(a => !a.correct).map(a => state.byId[a.id]).filter(Boolean);
    const R = 74, C = 2 * Math.PI * R;
    app.innerHTML = `
      <section class="panel res-top">
        <div class="ring"><svg viewBox="0 0 170 170"><circle class="bg" cx="85" cy="85" r="${R}"/><circle class="fg" cx="85" cy="85" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C}" id="ring-fg"/></svg><b>${score}<small>%</small></b></div>
        <div class="stack"><h2 style="margin:0">${esc(t('score'))}: ${esc(t('ofQ', { c: okN, n }))}</h2>
          ${isBest && n >= 3 ? `<span class="chip accent" style="align-self:flex-start">🏆 ${esc(t('newBest'))}</span>` : prevBest ? `<span class="muted">${esc(t('bestScore'))}: ${prevBest.score}% · ${fmtTime(prevBest.secs)}</span>` : ''}
          <div class="stats"><div class="stat"><b>${fmtTime(secs)}</b><span>${esc(t('time'))}</span></div><div class="stat"><b>${fmtTime(secs / Math.max(1, n))}</b><span>${esc(t('avgTime'))}</span></div><div class="stat"><b>${ss.bestStreak}</b><span>${esc(t('streak'))}</span></div></div></div>
      </section>
      <section class="panel"><h2>${esc(t('byCat'))}</h2><div class="bars">${rows.map(r => `<div class="bar-row ${r.pc < 70 ? 'weak' : ''}" style="--c:${esc(catOf(r.id).color)}"><span>${esc(r.id === 'mine' ? t('mineCat') : catName(r.id))}</span><div class="progress"><i style="width:${r.pc}%"></i></div><b>${r.pc}%</b></div>`).join('')}</div></section>
      <section class="panel"><h2>${esc(t('mistakes'))}</h2>${wrong.length ? `<div class="mistakes">${wrong.map(im => `<button type="button" class="mist" data-id="${esc(im.id)}"><img src="${esc(im.miniatura || im.archivo)}" alt=""><span>${esc(nameOf(im))}</span></button>`).join('')}</div>` : `<p class="muted">${esc(t('allRight'))}</p>`}</section>
      <div class="row"><button type="button" class="btn" id="r-again">${esc(t('again'))}</button>${wrong.length ? `<button type="button" class="btn ghost" id="r-review">${esc(t('reviewErr'))}</button>` : ''}${weak.length ? `<button type="button" class="btn ghost" id="r-weak">${esc(t('reviewWeak'))}</button>` : ''}<button type="button" class="btn ghost" id="r-home">${esc(t('toHome'))}</button></div>`;
    requestAnimationFrame(() => { const fg = document.getElementById('ring-fg'); if (fg) fg.style.strokeDashoffset = String(C * (1 - score / 100)); });
    document.getElementById('r-again').addEventListener('click', () => startSession(ss.mode === 'review' ? 'quiz' : ss.mode));
    document.getElementById('r-home').addEventListener('click', () => { state.view = 'home'; render(); });
    const rr = document.getElementById('r-review'); if (rr) rr.addEventListener('click', () => startSession('review'));
    const rw = document.getElementById('r-weak'); if (rw) rw.addEventListener('click', () => { const ids = weak.map(w => w.id).filter(id => id !== 'mine'); if (ids.length) { cfg.cats = ids; saveCfg(); } startSession(ss.mode === 'review' ? 'quiz' : ss.mode); });
    app.querySelectorAll('.mist').forEach(b => b.addEventListener('click', () => openDetail([state.byId[b.dataset.id]], 0)));
  }

  /* ----- estudio ----- */
  function viewStudy() {
    const st = state.study; const cats = state.cats.map(c => ({ id: c.id, label: L(c.nombre), color: c.color }));
    const sel = st.cat || cats.map(c => c.id);
    const q = norm(st.q);
    const list = state.imgs.filter(im => (im.propia || sel.includes(im.categoria)) && cfg.diffs.includes(im.dificultad || 1) && (!q || names(im).some(nm => norm(nm).includes(q)) || (im.tincion && norm(stainName(im.tincion)).includes(q))));
    state.studyList = list;
    app.innerHTML = `
      <div class="row spread"><h2 style="margin:0">${esc(t('studyTitle'))} <span class="muted" style="font-size:.9rem;font-weight:400">(${list.length})</span></h2><button type="button" class="btn ghost small" id="s-home">← ${esc(t('toHome'))}</button></div>
      <section class="panel stack"><div class="pick" id="s-cats">${chips(cats, sel, 'data-cat')}</div>
        <div class="tools"><input type="search" id="s-q" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}" value="${esc(st.q)}"><label class="check"><input type="checkbox" id="s-self" ${st.self ? 'checked' : ''}> ${esc(t('selfTest'))}</label></div></section>
      ${list.length ? `<div class="gallery">${list.map((im, i) => `<button type="button" class="gcard" data-i="${i}" style="--c:${esc(catOf(im.categoria).color)}"><span class="cdot" title="${esc(catName(im.categoria))}"></span><img loading="lazy" src="${esc(im.miniatura || im.archivo)}" alt="${st.self ? '' : esc(nameOf(im))}"><span class="nm ${st.self ? 'blur' : ''}">${esc(nameOf(im))}</span><span class="sm">${esc(im.tincion ? stainName(im.tincion) : im.stainText || '')}</span></button>`).join('')}</div>` : `<div class="empty">${esc(t('noResults'))}</div>`}`;
    document.getElementById('s-home').addEventListener('click', () => { state.view = 'home'; render(); });
    document.getElementById('s-cats').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const cur = st.cat || cats.map(c => c.id); const id = b.dataset.cat; st.cat = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]; if (st.cat.length === cats.length) st.cat = null; viewStudy(); });
    document.getElementById('s-q').addEventListener('input', K.debounce(e => { st.q = e.target.value; const pos = e.target.selectionStart; viewStudy(); const nq = document.getElementById('s-q'); nq.focus(); nq.setSelectionRange(pos, pos); }, 250));
    document.getElementById('s-self').addEventListener('change', e => { st.self = e.target.checked; viewStudy(); });
    app.querySelectorAll('.gcard').forEach(b => b.addEventListener('click', () => openDetail(list, Number(b.dataset.i))));
  }

  function openDetail(list, idx) {
    const d = document.createElement('dialog'); d.className = 'kit-dialog wide';
    let i = idx, showFeat = !state.study.self, revealed = !state.study.self;
    const draw = () => {
      const im = list[i]; const feats = featOf(im);
      d.innerHTML = `<div class="d-head"><div><h2 class="${revealed ? '' : 'blur'}" id="d-name">${esc(nameOf(im))}</h2><div class="tag-cat" style="--c:${esc(catOf(im.categoria).color)}">${esc(im.propia ? t('mineCat') : catName(im.categoria))}${im.tincion ? ' · ' + esc(stainName(im.tincion)) : im.stainText ? ' · ' + esc(im.stainText) : ''}${im.aumento ? ' · ' + esc(im.aumento) : ''}</div></div><button class="icon-btn" id="d-close" aria-label="${esc(t('close'))}">✕</button></div>
        <div class="d-grid"><div id="d-view"></div><div>
          ${!revealed ? `<button class="btn small" id="d-rev">${esc(t('reveal'))}</button>` : ''}
          ${feats.length ? `<button class="btn ghost small" id="d-feat" style="margin-left:${revealed ? 0 : 8}px">${esc(showFeat ? t('hideFeat') : t('showFeat'))}</button>` : ''}
          ${feats.length && showFeat ? `<ul class="feat">${feats.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
          ${attribution(im)}</div></div>
        <div class="d-nav"><button class="btn ghost small" id="d-prev" ${list.length < 2 ? 'disabled' : ''}>← ${esc(t('prevImg'))}</button><span class="muted">${i + 1} / ${list.length}</span><button class="btn ghost small" id="d-next" ${list.length < 2 ? 'disabled' : ''}>${esc(t('nextImg'))} →</button></div>`;
      const v = createViewer(d.querySelector('#d-view')); v.set(im); v.setAlt(revealed ? nameOf(im) : '');
      d.querySelector('#d-close').onclick = () => d.close();
      const r = d.querySelector('#d-rev'); if (r) r.onclick = () => { revealed = true; draw(); };
      const f = d.querySelector('#d-feat'); if (f) f.onclick = () => { showFeat = !showFeat; draw(); };
      d.querySelector('#d-prev').onclick = () => { i = (i - 1 + list.length) % list.length; revealed = !state.study.self; showFeat = !state.study.self; draw(); };
      d.querySelector('#d-next').onclick = () => { i = (i + 1) % list.length; revealed = !state.study.self; showFeat = !state.study.self; draw(); };
    };
    d.addEventListener('keydown', e => { if (e.target.closest('input')) return; if (e.key === 'PageDown' || e.key === ']') { d.querySelector('#d-next')?.click(); } else if (e.key === 'PageUp' || e.key === '[') { d.querySelector('#d-prev')?.click(); } });
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    document.body.append(d); draw(); d.showModal();
  }

  /* ----- créditos y ayuda ----- */
  function viewCredits() {
    const list = state.imgs.filter(i => !i.propia);
    app.innerHTML = `<div class="row spread"><h2 style="margin:0">${esc(t('credits'))}</h2><button type="button" class="btn ghost small" id="c-home">← ${esc(t('toHome'))}</button></div>
      <section class="panel"><p class="muted">${esc(t('creditsLead'))}</p>${list.map(im => `<div class="credit-row"><img loading="lazy" src="${esc(im.miniatura || im.archivo)}" alt=""><div><b>${esc(nameOf(im))}</b><small>${esc(t('author'))}: ${esc(im.autor || '—')} · ${esc(t('license'))}: ${im.licurl ? `<a href="${esc(im.licurl)}" target="_blank" rel="noopener">${esc(im.licencia)}</a>` : esc(im.licencia)} · <a href="${esc(im.origen)}" target="_blank" rel="noopener">${esc(t('source'))}</a></small></div></div>`).join('')}</section>`;
    document.getElementById('c-home').addEventListener('click', () => { state.view = 'home'; render(); });
  }
  function openHelp() {
    const d = document.createElement('dialog'); d.className = 'kit-dialog';
    d.innerHTML = `<h2>${esc(t('help'))}</h2>${t('helpHtml')}<div class="row"><button class="btn" data-x>${esc(t('close'))}</button></div>`;
    d.addEventListener('click', e => { if (e.target === d || e.target.dataset.x !== undefined) d.close(); });
    d.addEventListener('close', () => d.remove()); document.body.append(d); d.showModal();
  }

  /* ------------------------- arranque ------------------------- */
  function render() {
    stopTimer();
    document.title = t('pageTitle') + ' · Luis Franco Serrano';
    ({ home: viewHome, quiz: viewQuiz, results: viewResults, study: viewStudy, credits: viewCredits })[state.view]();
    window.scrollTo({ top: 0 });
  }

  K.mount({ titleKey: 'title', actions: '<button class="icon-btn" id="btn-help" type="button" aria-label="?" title="?">?</button>' });
  document.getElementById('btn-help').addEventListener('click', openHelp);
  const hb = document.getElementById('btn-help'); const setHelpLabel = () => { hb.title = t('help'); hb.setAttribute('aria-label', t('help')); }; setHelpLabel();
  K.onLang(() => { setHelpLabel(); render(); });

  document.addEventListener('keydown', e => {
    if (state.view !== 'quiz' || !state.session || e.target.closest('input,textarea,dialog')) return;
    const q = state.session.cur; if (!q) return;
    if (/^[1-9]$/.test(e.key) && q.type !== 'typed' && !q.answered) { const i = Number(e.key) - 1; if (q.options[i]) answerChoice(q, i); }
    else if ((e.key === 'Enter' || e.key === ' ') && q.answered && e.target.tagName !== 'BUTTON') { e.preventDefault(); nextQuestion(); }
  });

  fetch('data/imagenes.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(data => {
    state.data = data; state.cats = data.categorias || []; state.stains = data.tinciones || {};
    state.imgs = (data.imagenes || []).map(im => Object.assign({}, im, { miniatura: im.miniatura || im.archivo }));
    state.cats = state.cats.filter(x => state.imgs.some(i => i.categoria === x.id));   // solo categorías con imágenes
    state.byId = Object.fromEntries(state.imgs.map(i => [i.id, i]));
    if (cfg.cats) { cfg.cats = cfg.cats.filter(id => state.cats.some(x => x.id === id)); if (!cfg.cats.length) cfg.cats = null; }
    render();
  }).catch(err => {
    console.error(err);
    app.innerHTML = `<div class="empty"><h2>${esc(t('loadErr'))}</h2><p>${esc(t('loadErrHelp'))}</p></div>`;
  });
})();
