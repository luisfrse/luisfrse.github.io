/* Instalación (PWA) y uso sin conexión: registro del service worker (solo https o localhost),
   botón «Instalar», instrucciones para iOS, indicador de «listo sin conexión», aviso de falta de red
   y actualización controlada de la aplicación. */
(() => {
  'use strict';
  const R = window.RCP, esc = AppKit.esc, T = (k, p) => AppKit.t(k, p);

  R.addI18N({
    es: {
      pwaReady: 'Listo para funcionar sin conexión', pwaPreparing: 'Preparando el uso sin conexión…', pwaOffline: 'Sin conexión: la aplicación sigue funcionando.', pwaOfflineNoCache: 'Sin conexión: algunas funciones o la tipografía pueden no cargar.',
      pwaInstall: 'Instalar', pwaInstallAria: 'Instalar la aplicación en este dispositivo', pwaUpdate: 'Hay una versión nueva', pwaUpdateBtn: 'Actualizar',
      pwaIosTitle: 'Instalar en iPhone o iPad', pwaIosSteps: ['Abre esta página en Safari.', 'Toca el botón Compartir (el cuadrado con la flecha hacia arriba).', 'Elige «Añadir a pantalla de inicio» y confirma.'], pwaClose: 'Entendido',
      pwaNoInstall: 'Si no ves el botón, usa el menú del navegador: «Instalar aplicación» o «Añadir a pantalla de inicio».'
    },
    ca: {
      pwaReady: 'A punt per funcionar sense connexió', pwaPreparing: 'Preparant l\'ús sense connexió…', pwaOffline: 'Sense connexió: l\'aplicació continua funcionant.', pwaOfflineNoCache: 'Sense connexió: algunes funcions o la tipografia poden no carregar.',
      pwaInstall: 'Instal·la', pwaInstallAria: 'Instal·la l\'aplicació en aquest dispositiu', pwaUpdate: 'Hi ha una versió nova', pwaUpdateBtn: 'Actualitza',
      pwaIosTitle: 'Instal·lar a l\'iPhone o l\'iPad', pwaIosSteps: ['Obre aquesta pàgina al Safari.', 'Toca el botó Comparteix (el quadrat amb la fletxa cap amunt).', 'Tria «Afegeix a la pantalla d\'inici» i confirma.'], pwaClose: 'Entesos',
      pwaNoInstall: 'Si no veus el botó, fes servir el menú del navegador: «Instal·la l\'aplicació» o «Afegeix a la pantalla d\'inici».'
    },
    en: {
      pwaReady: 'Ready to work offline', pwaPreparing: 'Getting ready for offline use…', pwaOffline: 'Offline: the app keeps working.', pwaOfflineNoCache: 'Offline: some features or the typography may not load.',
      pwaInstall: 'Install', pwaInstallAria: 'Install the app on this device', pwaUpdate: 'A new version is available', pwaUpdateBtn: 'Update',
      pwaIosTitle: 'Install on iPhone or iPad', pwaIosSteps: ['Open this page in Safari.', 'Tap the Share button (the square with an arrow pointing up).', 'Choose "Add to Home Screen" and confirm.'], pwaClose: 'Got it',
      pwaNoInstall: 'If you do not see the button, use the browser menu: "Install app" or "Add to Home Screen".'
    }
  });

  const bar = document.getElementById('pwaBar');
  const P = { reg: null, ready: false, caching: false, online: navigator.onLine, prompt: null, waiting: null, supported: false };
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const secure = () => location.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  function render() {
    if (!bar) return;
    const parts = [];
    if (P.ready) parts.push(`<span class="pwa-chip ok" role="status">✓ ${esc(T('pwaReady'))}</span>`);
    else if (P.caching) parts.push(`<span class="pwa-chip" role="status">${esc(T('pwaPreparing'))}</span>`);
    if (!P.online) parts.push(`<span class="pwa-chip warn" role="status">${esc(P.ready ? T('pwaOffline') : T('pwaOfflineNoCache'))}</span>`);
    if (P.waiting) parts.push(`<span class="pwa-chip upd">${esc(T('pwaUpdate'))} <button type="button" class="btn small" id="pwaUpd">${esc(T('pwaUpdateBtn'))}</button></span>`);
    if (!standalone() && (P.prompt || ios())) parts.push(`<button type="button" class="btn ghost small" id="pwaInst" aria-label="${esc(T('pwaInstallAria'))}">⤓ ${esc(T('pwaInstall'))}</button>`);
    bar.hidden = !parts.length;
    bar.innerHTML = parts.join('');
    const u = document.getElementById('pwaUpd'); if (u) u.addEventListener('click', () => { if (P.waiting) P.waiting.postMessage({ type: 'SKIP_WAITING' }); });
    const i = document.getElementById('pwaInst'); if (i) i.addEventListener('click', install);
  }

  async function install() {
    if (P.prompt) {
      const p = P.prompt; P.prompt = null; render();
      try { await p.prompt(); await p.userChoice; } catch (_) { /* cancelado */ }
      return;
    }
    const d = document.createElement('dialog'); d.className = 'kit-dialog';
    d.innerHTML = `<h2>${esc(T('pwaIosTitle'))}</h2><ol class="plain-steps">${T('pwaIosSteps').map(s => `<li>${esc(s)}</li>`).join('')}</ol><p class="muted">${esc(T('pwaNoInstall'))}</p><div class="row"><button class="btn" data-r="1">${esc(T('pwaClose'))}</button></div>`;
    d.addEventListener('click', e => { if (e.target.dataset && e.target.dataset.r) d.close(); });
    d.addEventListener('close', () => d.remove());
    document.body.append(d); d.showModal();
  }

  /* ---- estado de la caché ---- */
  let polls = 0;
  function askStatus() {
    const sw = (P.reg && (P.reg.active || P.reg.waiting || P.reg.installing)) || navigator.serviceWorker.controller;
    if (sw) sw.postMessage({ type: 'STATUS' });
  }
  function onMsg(e) {
    const d = e.data || {};
    if (d.type !== 'STATUS') return;
    P.ready = !!d.complete; P.caching = !d.complete; P.status = d; render();
    if (!d.complete && polls++ < 20) setTimeout(askStatus, 1000);
  }

  function track(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) { P.waiting = reg.waiting; render(); }
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing; if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) { P.waiting = nw; render(); }
        if (nw.state === 'activated') { polls = 0; askStatus(); }
      });
    });
  }

  async function init() {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); P.prompt = e; render(); });
    window.addEventListener('appinstalled', () => { P.prompt = null; render(); });
    window.addEventListener('online', () => { P.online = true; render(); });
    window.addEventListener('offline', () => { P.online = false; render(); });
    AppKit.onLang(render);
    render();
    if (!('serviceWorker' in navigator) || !secure()) return;
    P.supported = true; P.caching = true; render();
    navigator.serviceWorker.addEventListener('message', onMsg);
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading || !P.hadController) return; reloading = true; location.reload(); });
    P.hadController = !!navigator.serviceWorker.controller;
    try {
      P.reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
      track(P.reg);
      await navigator.serviceWorker.ready;
      P.hadController = !!navigator.serviceWorker.controller || P.hadController;
      askStatus();
    } catch (err) { P.caching = false; P.error = String(err); render(); }
  }

  R.pwa = { state: P, askStatus };
  init();
})();
