/* ============================================================
   AppKit: utilidades comunes de las aplicaciones (apps/*)
   - Idioma (es/ca/en) compartido con la web a través de localStorage('lang')
   - i18n con diccionario por aplicación y atributos data-i18n*
   - Barra superior con enlace de vuelta y selector de idioma
   - Almacenamiento local con espacio de nombres, avisos, descargas, etc.
   Todo funciona en el navegador; no se envía nada a ningún servidor.
   ============================================================ */
(() => {
  'use strict';
  const LANGS = ['es', 'ca', 'en'];
  const LOCALES = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };

  /* ---------- idioma ---------- */
  const fromBrowser = () => { const n = (navigator.language || '').toLowerCase().slice(0, 2); return LANGS.includes(n) ? n : 'es'; };
  let lang = fromBrowser();
  try { const s = localStorage.getItem('lang'); if (LANGS.includes(s)) lang = s; } catch (_) { /* sin almacenamiento */ }
  const listeners = [];

  /* textos de la propia barra y de los botones comunes */
  const KIT = {
    es: { back: 'Aplicaciones', lang: 'Idioma', ok: 'Aceptar', cancel: 'Cancelar', close: 'Cerrar', export: 'Exportar', import: 'Importar', delete: 'Borrar', print: 'Imprimir', copy: 'Copiar', copied: 'Copiado', save: 'Guardar', saved: 'Guardado', edit: 'Editar', add: 'Añadir', reset: 'Reiniciar', start: 'Empezar', stop: 'Parar', next: 'Siguiente', prev: 'Anterior', yes: 'Sí', no: 'No', error: 'Algo ha fallado', foot: 'Herramienta didáctica de Luis Franco Serrano. Funciona en tu navegador: no se envía ni se guarda nada en ningún servidor.' },
    ca: { back: 'Aplicacions', lang: 'Idioma', ok: 'Accepta', cancel: 'Cancel·la', close: 'Tanca', export: 'Exporta', import: 'Importa', delete: 'Esborra', print: 'Imprimeix', copy: 'Copia', copied: 'Copiat', save: 'Desa', saved: 'Desat', edit: 'Edita', add: 'Afegeix', reset: 'Reinicia', start: 'Comença', stop: 'Para', next: 'Següent', prev: 'Anterior', yes: 'Sí', no: 'No', error: 'Alguna cosa ha fallat', foot: 'Eina didàctica de Luis Franco Serrano. Funciona al teu navegador: no s\'envia ni es desa res a cap servidor.' },
    en: { back: 'Apps', lang: 'Language', ok: 'OK', cancel: 'Cancel', close: 'Close', export: 'Export', import: 'Import', delete: 'Delete', print: 'Print', copy: 'Copy', copied: 'Copied', save: 'Save', saved: 'Saved', edit: 'Edit', add: 'Add', reset: 'Reset', start: 'Start', stop: 'Stop', next: 'Next', prev: 'Previous', yes: 'Yes', no: 'No', error: 'Something went wrong', foot: 'Teaching tool by Luis Franco Serrano. It runs in your browser: nothing is sent to or stored on any server.' }
  };

  /* i18n: const t = AppKit.i18n({ es:{...}, ca:{...}, en:{...} });  t('clave', {n: 3}) */
  function i18n(dict) {
    const get = (k) => (dict[lang] && k in dict[lang]) ? dict[lang][k]
      : (dict.es && k in dict.es) ? dict.es[k]
      : (KIT[lang] && k in KIT[lang]) ? KIT[lang][k] : (KIT.es[k] ?? k);
    const t = (k, params) => {
      let v = get(k);
      if (typeof v === 'function') return v(params || {});
      if (params && typeof v === 'string') v = v.replace(/\{(\w+)\}/g, (m, p) => (p in params ? params[p] : m));
      return v;
    };
    t.dict = dict;
    api.t = t;                       // la última creada es la de la aplicación
    return t;
  }

  function applyDom(root = document) {
    const t = api.t || ((k) => KIT[lang][k] ?? k);
    root.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach(e => { e.innerHTML = t(e.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = t(e.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
    document.documentElement.lang = lang;
    document.querySelectorAll('.kit-lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    const bk = document.querySelector('.kit-back .lbl'); if (bk) bk.textContent = KIT[lang].back;
    const ft = document.querySelector('.kit-foot [data-kit="foot"]'); if (ft) ft.textContent = KIT[lang].foot;
  }

  function setLang(l) {
    if (!LANGS.includes(l) || l === lang) return;
    lang = l;
    try { localStorage.setItem('lang', l); } catch (_) { /* sin almacenamiento */ }
    applyDom();
    listeners.forEach(f => { try { f(l); } catch (e) { console.error(e); } });
  }
  const onLang = (f) => { listeners.push(f); };

  /* ---------- barra superior y pie ---------- */
  function mount({ titleKey, titleText, home = '../../#/aplicaciones', actions = '' } = {}) {
    const top = document.createElement('header');
    top.className = 'kit-top';
    top.innerHTML = `
      <a class="kit-back" href="${home}" aria-label="${KIT[lang].back}"><span aria-hidden="true">←</span><span class="lbl">${KIT[lang].back}</span></a>
      <h1 class="kit-title" ${titleKey ? `data-i18n="${titleKey}"` : ''}>${titleText || ''}</h1>
      <div class="kit-actions">${actions}
        <div class="kit-lang" role="group" aria-label="${KIT[lang].lang}">
          <button type="button" data-lang="es" lang="es" title="Castellano">ES</button>
          <button type="button" data-lang="ca" lang="ca" title="Català">CA</button>
          <button type="button" data-lang="en" lang="en" title="English">EN</button>
        </div>
      </div>`;
    document.body.prepend(top);
    top.querySelectorAll('.kit-lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    const foot = document.createElement('footer');
    foot.className = 'kit-foot';
    foot.innerHTML = '<span data-kit="foot"></span>';
    document.body.append(foot);
    applyDom();
  }

  /* ---------- almacenamiento local ---------- */
  function storage(ns) {
    const k = (key) => `${ns}:${key}`;
    return {
      get(key, def = null) { try { const v = localStorage.getItem(k(key)); return v === null ? def : JSON.parse(v); } catch (_) { return def; } },
      set(key, val) { try { localStorage.setItem(k(key), JSON.stringify(val)); return true; } catch (_) { return false; } },
      remove(key) { try { localStorage.removeItem(k(key)); } catch (_) { /* nada */ } },
      keys() { try { return Object.keys(localStorage).filter(x => x.startsWith(ns + ':')).map(x => x.slice(ns.length + 1)); } catch (_) { return []; } }
    };
  }

  /* ---------- avisos, diálogos y ficheros ---------- */
  let toastEl, toastTimer;
  function toast(msg, ms = 2200) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'kit-toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  /* Diálogo de confirmación: await AppKit.confirm('¿Seguro?', {okText:'Borrar', danger:true}) */
  function confirmDialog(message, { okText, cancelText, danger = false, title = '' } = {}) {
    return new Promise(res => {
      const d = document.createElement('dialog'); d.className = 'kit-dialog';
      d.innerHTML = `${title ? `<h2>${title}</h2>` : ''}<p></p><div class="row"><button class="btn ghost" data-r="0"></button><button class="btn ${danger ? 'danger' : ''}" data-r="1"></button></div>`;
      d.querySelector('p').textContent = message;
      d.querySelector('[data-r="0"]').textContent = cancelText || KIT[lang].cancel;
      d.querySelector('[data-r="1"]').textContent = okText || KIT[lang].ok;
      d.addEventListener('click', e => { const r = e.target.dataset && e.target.dataset.r; if (r !== undefined) d.close(r); });
      d.addEventListener('close', () => { res(d.returnValue === '1'); d.remove(); });
      document.body.append(d); d.showModal();
    });
  }

  function download(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const readFile = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsText(file); });

  /* ---------- utilidades ---------- */
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const fmt = (n, digits = 1) => (Number.isFinite(n) ? n.toLocaleString(LOCALES[lang], { maximumFractionDigits: digits, minimumFractionDigits: 0 }) : '—');
  const fmtDate = (d, opts = { year: 'numeric', month: 'short', day: 'numeric' }) => new Date(d).toLocaleDateString(LOCALES[lang], opts);
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const debounce = (f, ms = 200) => { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => f(...a), ms); }; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* CSV sencillo con separador automático (; , tabulador) y comillas */
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/).find(l => l.trim()) || '';
    const sep = [';', '\t', ','].map(s => [s, (first.match(new RegExp(s === '\t' ? '\\t' : '\\' + s, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = []; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== '')).map(r => r.map(c => c.trim()));
  }
  const toCSV = (rows, sep = ';') => rows.map(r => r.map(c => { c = String(c ?? ''); return /["\n;,\t]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(sep)).join('\r\n');

  /* Mantener la pantalla encendida (si el navegador lo permite) */
  let wake = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator) { wake = await navigator.wakeLock.request('screen'); }
      else if (wake) { await wake.release(); wake = null; }
    } catch (_) { /* no disponible */ }
  }
  document.addEventListener('visibilitychange', () => { if (wake && document.visibilityState === 'visible') keepAwake(true); });

  const api = {
    LANGS, get lang() { return lang; }, locale: () => LOCALES[lang],
    t: (k) => KIT[lang][k] ?? k,
    i18n, applyDom, setLang, onLang, mount, storage, toast, confirm: confirmDialog, download, readFile,
    clamp, uid, fmt, fmtDate, mmss, mulberry, shuffle, debounce, esc, parseCSV, toCSV, keepAwake
  };
  window.AppKit = api;
})();
