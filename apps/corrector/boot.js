/* ============================================================
   Corrector de tests · carga de los scripts
   En la web pública se cargan todos seguidos. En el campus (<html data-mode="campus">) primero se baja del servidor la memoria del
   Corrector (store-campus.js) y solo entonces arranca el resto, para que ya encuentre ahí los exámenes y las listas de clase.
   ============================================================ */
(() => {
  'use strict';
  const V = '?v=7';
  const LIST = ['i18n.js', 'i18n-ext.js', 'geom.js', 'hoja.js', 'omr.js', 'roster.js', 'xlsx.js', 'omrlearn.js', 'qr.js', 'sync.js', 'views-students.js', 'views-sheet.js', 'views-scan.js', 'views-sync.js', 'campus.js', 'picker.js', 'corrector.js'];
  /* async=false: se descargan a la vez pero se ejecutan en orden */
  const load = (src) => new Promise((ok, ko) => { const s = document.createElement('script'); s.async = false; s.src = src + V; s.onload = ok; s.onerror = () => ko(new Error('No se pudo cargar ' + src)); document.body.appendChild(s); });
  const fail = (e) => { const a = document.getElementById('app'); if (a) a.innerHTML = '<div class="panel banner-warn" role="alert">' + String(e && e.message || e).replace(/[<>&]/g, '') + '</div>'; };
  (async () => {
    const campus = document.documentElement.dataset.mode === 'campus';
    if (campus) { await load('store-campus.js'); if (window.CorrServer) await window.CorrServer.ready; }
    await Promise.all(LIST.map(load));
    if (campus && window.CorrServer) window.CorrServer.start();
  })().catch(fail);
})();
