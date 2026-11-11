/* Voz guiada con speechSynthesis (la usan el metrónomo, el sensor y el simulador de DEA).
   - Elige la mejor voz disponible para el idioma de la web (las voces cargan de forma asíncrona).
   - Interruptor, volumen y velocidad guardados. Si el navegador no tiene voces, oculta los controles y lo explica.
   - En iOS/Chrome la voz solo se activa tras un gesto del usuario: se desbloquea con el primer toque. */
(() => {
  'use strict';
  const R = window.RCP, store = AppKit.storage('rcp'), esc = AppKit.esc;

  R.addI18N({
    es: {
      voiceTitle: 'Voz guiada', voiceOn: 'Avisos hablados', voiceOnHint: 'Dice «comprime», «dos insuflaciones», «cambio de reanimador»…', voiceVol: 'Volumen de la voz', voiceRate: 'Velocidad de la voz',
      voiceTest: 'Probar voz', voiceSample: 'Voz activada. Empieza las compresiones.', voiceChoose: 'Voz', voiceUsing: 'Voz: {name}', voiceNone: 'No hay ninguna voz instalada para este idioma; se usará la voz por defecto del navegador, que puede sonar con acento extranjero.',
      voiceLoading: 'Cargando voces…', voiceGesture: 'Tu navegador solo permite hablar tras tocar un botón: pulsa «Probar voz» para activarla.',
      voiceUnsupported: 'Voz no disponible: este navegador no incluye síntesis de voz (speechSynthesis) o no tiene voces instaladas. La aplicación sigue funcionando con sonidos y textos en pantalla.',
      vo_start: 'Empieza las compresiones', vo_comp: 'Comprime', vo_breaths: 'Dos insuflaciones', vo_init: 'Cinco insuflaciones iniciales', vo_resume: 'Continúa', vo_swap: 'Cambio de reanimador', vo_pause: 'Pausa', vo_end: 'Fin',
      vo_faster: 'Más rápido', vo_slower: 'Más despacio', vo_dontstop: 'No pares, sigue comprimiendo'
    },
    ca: {
      voiceTitle: 'Veu guiada', voiceOn: 'Avisos parlats', voiceOnHint: 'Diu «comprimeix», «dues insuflacions», «canvi de reanimador»…', voiceVol: 'Volum de la veu', voiceRate: 'Velocitat de la veu',
      voiceTest: 'Prova la veu', voiceSample: 'Veu activada. Comença les compressions.', voiceChoose: 'Veu', voiceUsing: 'Veu: {name}', voiceNone: 'No hi ha cap veu instal·lada per a aquest idioma; s\'utilitzarà la veu per defecte del navegador, que pot sonar amb accent estranger.',
      voiceLoading: 'Carregant veus…', voiceGesture: 'El teu navegador només permet parlar després de tocar un botó: prem «Prova la veu» per activar-la.',
      voiceUnsupported: 'Veu no disponible: aquest navegador no inclou síntesi de veu (speechSynthesis) o no té veus instal·lades. L\'aplicació continua funcionant amb sons i textos a la pantalla.',
      vo_start: 'Comença les compressions', vo_comp: 'Comprimeix', vo_breaths: 'Dues insuflacions', vo_init: 'Cinc insuflacions inicials', vo_resume: 'Continua', vo_swap: 'Canvi de reanimador', vo_pause: 'Pausa', vo_end: 'Fi',
      vo_faster: 'Més ràpid', vo_slower: 'Més a poc a poc', vo_dontstop: 'No pares, continua comprimint'
    },
    en: {
      voiceTitle: 'Voice guidance', voiceOn: 'Spoken prompts', voiceOnHint: 'Says "push", "two breaths", "switch rescuers"…', voiceVol: 'Voice volume', voiceRate: 'Voice speed',
      voiceTest: 'Test voice', voiceSample: 'Voice on. Start compressions.', voiceChoose: 'Voice', voiceUsing: 'Voice: {name}', voiceNone: 'No voice is installed for this language; the browser\'s default voice will be used and may sound foreign.',
      voiceLoading: 'Loading voices…', voiceGesture: 'Your browser only lets pages speak after a tap on a button: press "Test voice" to enable it.',
      voiceUnsupported: 'Voice not available: this browser has no speech synthesis (speechSynthesis) or no voices installed. The app keeps working with sounds and on-screen text.',
      vo_start: 'Start compressions', vo_comp: 'Push', vo_breaths: 'Two breaths', vo_init: 'Five initial breaths', vo_resume: 'Continue', vo_swap: 'Switch rescuers', vo_pause: 'Paused', vo_end: 'Stopped',
      vo_faster: 'Faster', vo_slower: 'Slower', vo_dontstop: 'Don\'t stop, keep pushing'
    }
  });

  const synth = window.speechSynthesis, UTT = window.SpeechSynthesisUtterance;
  const supported = !!(synth && UTT);
  const V = Object.assign({ on: true, vol: 1, rate: 1, pick: {} }, store.get('voice', {}));
  const save = () => store.set('voice', V);
  let voices = [], loaded = false, needGesture = false;
  const live = new Set();                                       // referencias para que no se recojan antes de terminar
  const boxes = new Set();

  const norm = (l) => String(l || '').replace('_', '-').toLowerCase();
  const forLang = () => {
    const loc = norm(AppKit.locale()), pre = loc.slice(0, 2);
    return voices.filter(v => norm(v.lang).startsWith(pre)).map(v => {
      const n = norm(v.lang); let s = 0;
      if (n === loc) s += 10;
      if (/natural|neural|online|premium|enhanced|google|siri/i.test(v.name)) s += 3;
      if (v.localService) s += 1;
      if (v.default) s += 0.5;
      return { v, s };
    }).sort((a, b) => b.s - a.s).map(x => x.v);
  };
  const current = () => {
    const list = forLang(); if (!list.length) return null;
    const sel = V.pick[AppKit.lang]; return list.find(v => v.voiceURI === sel) || list[0];
  };

  function readVoices() {
    if (!supported) return;
    voices = synth.getVoices() || [];
    if (voices.length) loaded = true;
    renderAll();
  }

  function say(text, o = {}) {
    if (!supported || !V.on || !text) return Promise.resolve();
    return new Promise(resolve => {
      try {
        if (o.cancel !== false) synth.cancel();
        const u = new UTT(text);
        u.lang = AppKit.locale();
        const v = current(); if (v) { u.voice = v; u.lang = v.lang; }
        u.volume = AppKit.clamp(V.vol * (o.gain || 1), 0, 1); u.rate = AppKit.clamp(V.rate * (o.rate || 1), 0.5, 2); u.pitch = 1;
        let done = false;
        const fin = () => { if (done) return; done = true; live.delete(u); resolve(); };
        u.onend = fin;
        u.onerror = (e) => { if (e && e.error === 'not-allowed') { needGesture = true; renderAll(); } fin(); };
        live.add(u);
        synth.speak(u);
        setTimeout(fin, 2500 + text.length * 110);              // por si el navegador nunca avisa del final
      } catch (_) { resolve(); }
    });
  }
  const sayKey = (key, params, o) => say(AppKit.t(key, params), o);
  const cancel = () => { if (supported) { try { synth.cancel(); } catch (_) { /* nada */ } } };

  /* desbloqueo con el primer gesto del usuario (iOS/Chrome) */
  function unlock() {
    if (!supported) return;
    try { const u = new UTT(' '); u.volume = 0; synth.speak(u); needGesture = false; } catch (_) { /* nada */ }
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => document.addEventListener(ev, function once() { unlock(); document.removeEventListener(ev, once, true); }, true));

  /* ---------- controles ---------- */
  function html() {
    if (!supported) return `<h2>${esc(AppKit.t('voiceTitle'))}</h2><p class="voice-note warn" role="status">${esc(AppKit.t('voiceUnsupported'))}</p>`;
    const list = forLang(), cur = current();
    let note = '';
    if (!loaded) note = AppKit.t('voiceLoading');
    else if (needGesture) note = AppKit.t('voiceGesture');
    else if (!cur) note = AppKit.t('voiceNone');
    else note = AppKit.t('voiceUsing', { name: cur.name });
    return `
      <h2>${esc(AppKit.t('voiceTitle'))}</h2>
      <div class="field-row"><div><b>${esc(AppKit.t('voiceOn'))}</b><small>${esc(AppKit.t('voiceOnHint'))}</small></div>
        <label class="check"><input type="checkbox" data-v="on" ${V.on ? 'checked' : ''}><span class="sr-only">${esc(AppKit.t('voiceOn'))}</span></label></div>
      <div class="field-row"><div><b>${esc(AppKit.t('voiceVol'))}</b></div><div class="row"><input type="range" data-v="vol" min="0.1" max="1" step="0.05" value="${V.vol}" aria-label="${esc(AppKit.t('voiceVol'))}"></div></div>
      <div class="field-row"><div><b>${esc(AppKit.t('voiceRate'))}</b></div><div class="row"><input type="range" data-v="rate" min="0.7" max="1.4" step="0.05" value="${V.rate}" aria-label="${esc(AppKit.t('voiceRate'))}"><span class="val" data-v="rateVal">${V.rate.toFixed(2)}×</span></div></div>
      ${list.length > 1 ? `<div class="field-row"><div><b>${esc(AppKit.t('voiceChoose'))}</b></div><select data-v="voice" aria-label="${esc(AppKit.t('voiceChoose'))}">${list.map(v => `<option value="${esc(v.voiceURI)}" ${cur && cur.voiceURI === v.voiceURI ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div>` : ''}
      <div class="field-row"><button type="button" class="btn ghost small" data-v="test">${esc(AppKit.t('voiceTest'))}</button><small class="voice-note ${(!loaded || needGesture || !cur) ? 'warn' : ''}" role="status">${esc(note)}</small></div>`;
  }
  function renderBox(el) {
    el.innerHTML = html();
    if (!supported) return;
    el.querySelector('[data-v="on"]').addEventListener('change', e => { V.on = e.target.checked; save(); if (V.on) unlock(); else cancel(); syncBoxes(el); });
    el.querySelector('[data-v="vol"]').addEventListener('input', e => { V.vol = +e.target.value; save(); syncBoxes(el); });
    el.querySelector('[data-v="rate"]').addEventListener('input', e => { V.rate = +e.target.value; save(); syncBoxes(el); });
    const sel = el.querySelector('[data-v="voice"]');
    if (sel) sel.addEventListener('change', () => { V.pick[AppKit.lang] = sel.value; save(); renderAll(); });
    el.querySelector('[data-v="test"]').addEventListener('click', () => { unlock(); if (!V.on) { V.on = true; save(); renderAll(); } say(AppKit.t('voiceSample')); });
  }
  function syncBoxes(src) {                                     // refleja los cambios en los otros paneles sin perder el foco
    boxes.forEach(el => {
      const set = (k, f) => { const n = el.querySelector(`[data-v="${k}"]`); if (n) f(n); };
      set('rateVal', n => { n.textContent = V.rate.toFixed(2) + '×'; });
      if (el === src) return;
      set('on', n => { n.checked = V.on; }); set('vol', n => { n.value = V.vol; }); set('rate', n => { n.value = V.rate; });
    });
  }
  function renderAll() { boxes.forEach(el => { if (el.isConnected) renderBox(el); else boxes.delete(el); }); }
  function mount(el) { boxes.add(el); renderBox(el); }

  if (supported) {
    readVoices();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', readVoices); else synth.onvoiceschanged = readVoices;
    setTimeout(readVoices, 600); setTimeout(readVoices, 2000);   // Chrome/Android cargan tarde
  }
  AppKit.onLang(() => { if (supported) readVoices(); renderAll(); });
  const mountAll = () => document.querySelectorAll('[data-voice-ctl]').forEach(mount);      // lo llama app.js cuando los textos ya están listos

  R.voice = { supported, say, sayKey, cancel, unlock, mount, mountAll, get on() { return supported && V.on; }, get state() { return V; } };
})();
