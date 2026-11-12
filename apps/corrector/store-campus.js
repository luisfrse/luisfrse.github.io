/* ============================================================
   Corrector de tests · memoria en el servidor (solo cuando se sirve desde el campus: <html data-mode="campus">)
   Sustituye AppKit.storage('corrector') por una versión que guarda los exámenes («exam:<id>») y las listas de clase («rosters»)
   en el servidor del campus (/api/corrector/store), de modo que se ven igual desde cualquier dispositivo y no dependen de la
   memoria del navegador. Lo propio de cada dispositivo (pestaña abierta, ajustes de cámara, carpeta enlazada…) sigue en local.
   - Lectura síncrona desde memoria (se hidrata al arrancar) y escritura diferida con reintentos.
   - Control de concurrencia por examen: si otro dispositivo lo cambió, se avisa y se elige qué versión conservar (nunca se pisa en silencio).
   - Si no hay conexión: se trabaja con la última copia local y se envía todo al volver.
   En la web pública (data-mode="local") este archivo no hace nada.
   ============================================================ */
(() => {
  'use strict';
  const K = window.AppKit, NS = 'corrector';
  const CAMPUS = document.documentElement.dataset.mode === 'campus';
  if (!CAMPUS) { window.CorrServer = null; return; }

  const MSG = {
    es: { saved: 'Guardado en el campus ✓ {t}', saving: 'Guardando en el campus…', offline: 'Sin conexión con el campus: tus cambios se guardan en este dispositivo y se enviarán al volver.', auth: 'La sesión del campus ha caducado. Vuelve a entrar y pulsa «Reintentar».', retry: 'Reintentar', login: 'Abrir el campus',
      conflict: 'Otro dispositivo ha modificado «{n}».', useServer: 'Cargar la versión del campus', keepMine: 'Conservar la mía', remote: 'Esto se ha modificado desde otro dispositivo.', failBoot: 'No se pudo cargar tu memoria del campus.', copyName: '{n} (copia local)', tooBig: 'Un examen es demasiado grande para guardarse en el campus.', untitled: 'Sin nombre' },
    ca: { saved: 'Desat al campus ✓ {t}', saving: 'Desant al campus…', offline: "Sense connexió amb el campus: els canvis es desen en aquest dispositiu i s'enviaran en tornar.", auth: "La sessió del campus ha caducat. Torna a entrar i prem «Reintenta».", retry: 'Reintenta', login: 'Obre el campus',
      conflict: 'Un altre dispositiu ha modificat «{n}».', useServer: 'Carrega la versió del campus', keepMine: 'Conserva la meva', remote: "Això s'ha modificat des d'un altre dispositiu.", failBoot: "No s'ha pogut carregar la teva memòria del campus.", copyName: '{n} (còpia local)', tooBig: "Un examen és massa gran per desar-se al campus.", untitled: 'Sense nom' },
    en: { saved: 'Saved in the campus ✓ {t}', saving: 'Saving to the campus…', offline: 'No connection to the campus: your changes are kept on this device and will be sent when it is back.', auth: 'The campus session has expired. Sign in again and press “Retry”.', retry: 'Retry', login: 'Open the campus',
      conflict: 'Another device has changed “{n}”.', useServer: 'Load the campus version', keepMine: 'Keep mine', remote: 'This was changed from another device.', failBoot: 'Could not load your campus memory.', copyName: '{n} (local copy)', tooBig: 'An exam is too large to be saved in the campus.', untitled: 'Untitled' }
  };
  const lang = () => { const l = (document.documentElement.lang || 'es').slice(0, 2); return MSG[l] ? l : 'es'; };
  const m = (k, p) => String(MSG[lang()][k] || MSG.es[k] || k).replace(/\{(\w+)\}/g, (x, n) => (p && n in p ? p[n] : x));

  const orig = K.storage, local = orig(NS);
  const SYNCED = (k) => /^exam:[\w\-]{1,60}$/.test(k) || k === 'rosters' || k === 'omrlearn';
  const mem = new Map();        // clave -> texto JSON (lo del servidor + los cambios locales aún sin enviar)
  const T = {};                 // clave -> marca (ms) del servidor que conocemos: es la «base» al escribir
  const dirty = new Map();      // clave -> 'set' | 'remove' (pendiente de enviar)
  const conflicts = new Map();  // clave -> { v, t, why } versión del servidor distinta de la nuestra: se pregunta al usuario
  const frozen = new Set();     // claves cuyo guardado se ignora (se va a recargar la página con la versión del servidor)
  const st = { state: 'boot', at: 0, err: '' };
  let current = null, timer = 0, flushing = false, again = false, snapTimer = 0;

  const ls = {
    get(k) { try { return localStorage.getItem(NS + ':' + k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(NS + ':' + k, v); return true; } catch (_) { return false; } },
    del(k) { try { localStorage.removeItem(NS + ':' + k); } catch (_) { /* nada */ } }
  };
  const nameOf = (txt) => { try { const e = JSON.parse(txt); return (e && e.name) || m('untitled'); } catch (_) { return m('untitled'); } };

  async function api(method, path, body, keepalive) {
    const o = { method, credentials: 'same-origin', headers: {} };
    if (method !== 'GET') { o.headers['X-Requested-With'] = 'campus'; o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); if (keepalive) o.keepalive = true; }
    const r = await fetch(path, o); let j = null; try { j = await r.json(); } catch (_) { /* nada */ }
    if (!r.ok && r.status !== 409) { const e = new Error((j && (j.msg || j.error)) || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return Object.assign({ status: r.status }, j || {});
  }

  /* ---------- copia local (arranque sin conexión) y cambios pendientes ---------- */
  function snapshot() {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const items = {}; mem.forEach((v, k) => { if (T[k] !== undefined && !dirty.has(k)) items[k] = { v, t: T[k] }; });
      ls.set('__snap', JSON.stringify({ items, at: Date.now() }));
    }, 2500);
  }
  function savePending() {
    if (!dirty.size) { ls.del('__pending'); return; }
    const p = {}; dirty.forEach((how, k) => { p[k] = { v: how === 'set' ? mem.get(k) : null, base: T[k] === undefined ? null : T[k] }; });
    ls.set('__pending', JSON.stringify(p));
  }

  /* ---------- envío ---------- */
  const schedule = (ms = 900) => { clearTimeout(timer); timer = setTimeout(() => flush(), ms); paint(); };
  function buildBody(keys) {
    const set = {}, remove = {};
    keys.forEach((k) => { if (dirty.get(k) === 'set') set[k] = { v: mem.get(k), base: T[k] === undefined ? null : T[k] }; else remove[k] = T[k] === undefined ? null : T[k]; });
    return { set, remove };
  }
  function applyResult(j, sent) {
    Object.keys(j.t || {}).forEach((k) => { T[k] = j.t[k]; if (dirty.get(k) === 'set' && mem.get(k) === sent.set[k].v) dirty.delete(k); });
    (j.removed || []).forEach((k) => { delete T[k]; if (dirty.get(k) === 'remove' && !mem.has(k)) dirty.delete(k); });
    Object.keys(j.conflicts || {}).forEach((k) => {
      const c = j.conflicts[k];
      if (c.error === 'conflict') { conflicts.set(k, { v: c.v, t: c.t, why: 'write' }); } else { dirty.delete(k); st.err = m('tooBig'); }
    });
  }
  async function flush() {
    if (flushing) { again = true; return; }
    const keys = [...dirty.keys()].filter((k) => !conflicts.has(k));
    if (!keys.length || st.state === 'auth') return paint();
    flushing = true; clearTimeout(timer); paint();
    const body = buildBody(keys);
    try {
      const j = await api('PUT', '/api/corrector/store', body);
      applyResult(j, body); st.state = 'ok'; st.at = Date.now(); st.err = ''; snapshot();
    } catch (e) {
      st.state = e.status === 401 ? 'auth' : 'offline'; st.err = e.message; savePending();
      if (st.state === 'offline') timer = setTimeout(() => flush(), 8000);
    }
    flushing = false; savePending(); paint();
    if (again || ([...dirty.keys()].some((k) => !conflicts.has(k)) && st.state === 'ok')) { again = false; schedule(300); }
  }

  /* ---------- arranque: cargar del servidor ---------- */
  function migrateLegacy() {
    if (st.state !== 'ok' || ls.get('__migrated')) return;
    try { Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).forEach((full) => { if (!full.startsWith(NS + ':')) return; const k = full.slice(NS.length + 1); if (!SYNCED(k) || mem.has(k)) return; const v = localStorage.getItem(full); try { JSON.parse(v); } catch (_) { return; } mem.set(k, v); dirty.set(k, 'set'); }); } catch (_) { /* nada */ }
    ls.set('__migrated', '1');
  }
  function applyPending() {
    let p = null; try { p = JSON.parse(ls.get('__pending') || 'null'); } catch (_) { /* nada */ }
    if (!p) return;
    Object.keys(p).forEach((k) => {
      if (!SYNCED(k)) return; const it = p[k] || {};
      const srv = T[k] === undefined ? null : T[k];
      if (it.v === null) { if (mem.has(k) && srv === it.base) { mem.delete(k); dirty.set(k, 'remove'); } return; }
      if (mem.get(k) === it.v) return;                                    // ya está en el servidor tal cual
      if (srv === it.base) { mem.set(k, it.v); dirty.set(k, 'set'); return; }
      /* otro dispositivo lo cambió mientras tanto: no se pierde nada, la copia de aquí se guarda como un examen aparte */
      try { const e = JSON.parse(it.v); if (k === 'rosters') return; e.id = 'loc' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); e.name = m('copyName', { n: e.name || m('untitled') }); mem.set('exam:' + e.id, JSON.stringify(e)); dirty.set('exam:' + e.id, 'set'); } catch (_) { /* nada */ }
    });
    ls.del('__pending');
  }
  async function hydrate() {
    try {
      const j = await api('GET', '/api/corrector/store');
      mem.clear(); Object.keys(T).forEach((k) => delete T[k]);
      Object.keys(j.items || {}).forEach((k) => { mem.set(k, j.items[k].v); T[k] = j.items[k].t; });
      st.state = 'ok'; st.at = Date.now();
    } catch (e) {
      st.state = e.status === 401 ? 'auth' : 'offline'; st.err = e.message;
      try { const s = JSON.parse(ls.get('__snap') || 'null'); if (s && s.items) Object.keys(s.items).forEach((k) => { mem.set(k, s.items[k].v); T[k] = s.items[k].t; }); } catch (_) { /* nada */ }
    }
    migrateLegacy(); applyPending();
    if (dirty.size) schedule(400); else snapshot();
    paint();
  }

  /* ---------- cambios hechos desde otro dispositivo ---------- */
  async function poll() {
    if (document.hidden || st.state === 'boot' || st.state === 'auth' || flushing) return;
    try {
      const s = await api('GET', '/api/corrector/store/stamps'); const t = s.t || {};
      const wasOff = st.state === 'offline'; st.state = 'ok';
      const changed = Object.keys(t).filter((k) => T[k] !== t[k]);
      const gone = [...mem.keys()].filter((k) => T[k] !== undefined && !(k in t));
      if (changed.length || gone.length) {
        const full = await api('GET', '/api/corrector/store');
        changed.forEach((k) => {
          const it = (full.items || {})[k]; if (!it) return;
          if (dirty.has(k)) { if (mem.get(k) !== it.v) conflicts.set(k, { v: it.v, t: it.t, why: 'remote' }); return; }
          const isCur = current && k === 'exam:' + current;
          if (isCur && mem.get(k) !== it.v) { conflicts.set(k, { v: it.v, t: it.t, why: 'remote' }); return; }   // el que tengo abierto: se pregunta
          mem.set(k, it.v); T[k] = it.t;
        });
        gone.forEach((k) => { if (dirty.has(k)) return; if (current && k === 'exam:' + current) { conflicts.set(k, { v: null, t: undefined, why: 'remote' }); return; } mem.delete(k); delete T[k]; });
        snapshot();
      }
      if (wasOff && dirty.size) schedule(200);
    } catch (e) { st.state = e.status === 401 ? 'auth' : 'offline'; }
    paint();
  }

  /* ---------- API de almacenamiento (la misma que AppKit.storage) ---------- */
  const store = {
    get(key, def = null) {
      if (key === 'index') return [...mem.keys()].filter((k) => k.startsWith('exam:')).map((k) => k.slice(5));
      if (!SYNCED(key)) return local.get(key, def);
      if (!mem.has(key)) return def;
      try { return JSON.parse(mem.get(key)); } catch (_) { return def; }
    },
    set(key, val) {
      if (key === 'index') return true;                 // el índice sale de los propios exámenes
      if (!SYNCED(key)) { if (key === 'current') current = val; return local.set(key, val); }
      if (frozen.has(key)) return true;
      const s = JSON.stringify(val); if (mem.get(key) === s && !(dirty.get(key) === 'remove')) return true;
      mem.set(key, s); dirty.set(key, 'set'); if (!conflicts.has(key)) schedule(); return true;
    },
    remove(key) {
      if (!SYNCED(key)) return local.remove(key);
      if (frozen.has(key) || (!mem.has(key) && dirty.get(key) !== 'set')) return;
      mem.delete(key); conflicts.delete(key);
      if (T[key] === undefined) dirty.delete(key); else dirty.set(key, 'remove');
      schedule();
    },
    keys() { return [...mem.keys()].concat(local.keys()); }
  };
  K.storage = (ns) => (ns === NS ? store : orig(ns));
  current = local.get('current');

  /* ---------- indicador y avisos ---------- */
  const el = () => {
    let e = document.getElementById('csbadge');
    if (!e) {
      e = document.createElement('div'); e.id = 'csbadge'; e.className = 'cpbadge csbadge'; e.setAttribute('role', 'status'); e.hidden = true; document.body.appendChild(e);
      e.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-cs]'); if (b) act(b.dataset.cs); });
    }
    return e;
  };
  const hhmm = (d) => new Date(d).toLocaleTimeString(K.locale ? K.locale() : undefined, { hour: '2-digit', minute: '2-digit' });
  function paint() {
    if (!document.body || st.state === 'boot') return;
    const e = el(), c = [...conflicts.entries()][0];
    let cls = 'ok', txt, btns = '';
    if (c) {
      cls = 'warn'; txt = c[1].why === 'remote' && !dirty.has(c[0]) ? m('remote') : m('conflict', { n: nameOf(mem.get(c[0]) || c[1].v) });
      btns = `<button type="button" class="btn small" data-cs="server">${esc(m('useServer'))}</button><button type="button" class="btn ghost small" data-cs="mine">${esc(m('keepMine'))}</button>`;
    } else if (st.state === 'auth') { cls = 'bad'; txt = m('auth'); btns = `<button type="button" class="btn small" data-cs="login">${esc(m('login'))}</button><button type="button" class="btn ghost small" data-cs="retry">${esc(m('retry'))}</button>`; }
    else if (st.state === 'offline') { cls = 'bad'; txt = m('offline'); btns = `<button type="button" class="btn ghost small" data-cs="retry">${esc(m('retry'))}</button>`; }
    else if (st.err) { cls = 'bad'; txt = st.err; }
    else if (flushing || dirty.size) { cls = 'wait'; txt = m('saving'); }
    else txt = m('saved', { t: st.at ? hhmm(st.at) : '' });
    const html = `<span class="cpdot ${cls}"></span><span>${esc(txt)}</span>${btns}`;
    if (e.dataset.h !== html) { e.dataset.h = html; e.innerHTML = html; }
    e.hidden = false;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  async function act(a) {
    if (a === 'retry') { st.state = 'ok'; st.err = ''; paint(); if (!mem.size && !Object.keys(T).length) location.reload(); else { await flush(); poll(); } return; }
    if (a === 'login') { window.open('/admin', '_blank', 'noopener'); return; }
    const c = [...conflicts.entries()][0]; if (!c) return; const [k, v] = c;
    if (a === 'mine') { if (v.t !== undefined) T[k] = v.t; else delete T[k]; conflicts.delete(k); if (!mem.has(k)) dirty.set(k, 'remove'); else dirty.set(k, 'set'); await flush(); }
    else if (a === 'server') {
      frozen.add(k); conflicts.delete(k); dirty.delete(k);
      if (v.v === null) { mem.delete(k); delete T[k]; } else { mem.set(k, v.v); T[k] = v.t; }
      await flush(); location.reload();
    }
    paint();
  }

  /* ---------- cierre de página ---------- */
  function beacon() {
    savePending();
    const keys = [...dirty.keys()].filter((k) => !conflicts.has(k)); if (!keys.length) return;
    const body = buildBody(keys); if (JSON.stringify(body).length > 58000) return;      // keepalive admite ~64 KB; si no cabe, lo recoge el arranque siguiente
    try { api('PUT', '/api/corrector/store', body, true).catch(() => {}); } catch (_) { /* nada */ }
  }

  window.CorrServer = {
    ready: hydrate(),
    start() {            // lo llama boot.js cuando el Corrector ya ha cargado (su propio «pagehide» va antes que este)
      window.addEventListener('pagehide', beacon);
      document.addEventListener('visibilitychange', () => { if (document.hidden) beacon(); else poll(); });
      setInterval(poll, 20000); paint();
    },
    get state() { return st.state; }, flush, poll, store
  };
})();
