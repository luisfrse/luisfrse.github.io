/* Base común de los módulos de la aplicación de RCP: registro de pestañas,
   ampliación del diccionario de textos y utilidades pequeñas. */
(() => {
  'use strict';
  const R = window.RCP = window.RCP || {};
  R.tabs = {};                                   // nombre → { render(), leave() }
  R.addI18N = (d) => { ['es', 'ca', 'en'].forEach(l => Object.assign(window.RCP_I18N[l], d[l] || {})); };
  R.$ = (s, r = document) => r.querySelector(s);
  R.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  R.REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  R.go = (name, opts) => { if (R._go) R._go(name, opts); };      // lo define app.js
  R.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* alternativa */ }
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (_) { return false; }
  };
  R.svgNS = 'http://www.w3.org/2000/svg';
})();
