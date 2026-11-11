/* ============================================================
   Corrector de tests · exportar / importar / sincronizar (sin servidor)
   - paquete JSON, plan de fusión por fecha de modificación y fusión de alumnado
   - enlace/código comprimido (CompressionStream + base64url)
   - carpeta vinculada (File System Access API) y archivos de dispositivo
   Núcleo sin DOM: se puede probar con una carpeta simulada (p. ej. OPFS).
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {});
  const K = window.AppKit;
  const store = K.storage('corrector');
  const VERSION = 2, CANON = 'corrector-sync.json';
  const clone = (x) => JSON.parse(JSON.stringify(x));

  /* ---------- dispositivo ---------- */
  function device() {
    let d = store.get('device');
    if (!d) { d = { id: K.uid(), name: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'movil' : 'ordenador' }; store.set('device', d); }
    return d;
  }
  const slug = (s) => String(s || 'dispositivo').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'dispositivo';
  const deviceFile = () => `corrector-${slug(device().name)}-${new Date().toISOString().slice(0, 10)}.json`;

  /* ---------- estado local ---------- */
  function readLocal() {
    const ex = store.get('index', []).map(id => store.get('exam:' + id)).filter(Boolean).map(e => (C.ctx ? C.ctx.fix(e) : e));
    return { exams: ex, rosters: C.roster.lists.all() };
  }
  function writeLocal(local) {
    const idx = [];
    local.exams.forEach(e => { store.set('exam:' + e.id, e); idx.push(e.id); });
    const old = store.get('index', []); old.forEach(id => { if (!idx.includes(id) && !local.exams.some(e => e.id === id)) idx.push(id); });
    store.set('index', [...new Set(idx)]);
    C.roster.lists.save(local.rosters);
  }
  function buildPackage(local, { examIds, rosterIds, answers = true } = {}) {
    let exams = local.exams.filter(e => !examIds || examIds.includes(e.id)).map(clone), rosters = local.rosters.filter(r => !rosterIds || rosterIds.includes(r.id)).map(clone);
    if (!answers) exams.forEach(e => e.students.forEach(s => { s.answers = []; delete s.scanned; }));
    return { app: 'corrector', version: VERSION, kind: 'sync', device: device(), exported: new Date().toISOString(), exams, rosters };
  }
  /* admite también las copias de seguridad antiguas ({app, version:1, exams}) */
  function validatePackage(p) {
    if (!p || p.app !== 'corrector' || !Array.isArray(p.exams)) return 'bad';
    if ((p.version || 1) > VERSION) return 'newer';
    return null;
  }

  /* ---------- fusión ---------- */
  const sameStudent = (a, b) => a.id === b.id || (a.code && b.code && a.code === b.code) || (C.roster.keyName(a) === C.roster.keyName(b) && C.roster.keyName(a) !== '');
  const hasAns = (s) => (s.answers || []).some(Boolean);
  function mergeStudents(newer, other) {
    const out = (newer || []).map(clone);
    (other || []).forEach(o => {
      const m = out.find(s => sameStudent(s, o));
      if (!m) { out.push(clone(o)); return; }
      if (!hasAns(m) && hasAns(o)) { m.answers = o.answers.slice(); m.version = o.version || m.version; if (o.scanned) m.scanned = o.scanned; }
      ['code', 'group', 'last', 'first'].forEach(f => { if (!m[f] && o[f]) m[f] = o[f]; });
    });
    return out;
  }
  function mergeExam(a, b) {
    const [n, o] = (a.updated || 0) >= (b.updated || 0) ? [a, b] : [b, a], r = clone(n);
    r.students = mergeStudents(n.students, o.students); r.updated = Date.now(); return r;
  }
  function mergeRoster(a, b) {
    const [n, o] = (a.updated || 0) >= (b.updated || 0) ? [a, b] : [b, a], r = clone(n);
    r.students = mergeStudents(n.students, o.students); r.updated = Date.now(); return r;
  }
  /* combina varios paquetes entrantes en uno */
  function fold(pkgs) {
    const ex = new Map(), ro = new Map();
    pkgs.forEach(p => {
      (p.exams || []).forEach(e => { ex.set(e.id, ex.has(e.id) ? mergeExam(ex.get(e.id), e) : e); });
      (p.rosters || []).forEach(r => { ro.set(r.id, ro.has(r.id) ? mergeRoster(ro.get(r.id), r) : r); });
    });
    return { exams: [...ex.values()], rosters: [...ro.values()] };
  }
  const strip = (x) => { const c = Object.assign({}, x); delete c.updated; return JSON.stringify(c); };
  const contentEq = (a, b) => strip(a) === strip(b);
  /* plan: por cada elemento entrante, qué ocurre. state: new | same | localNewer | importNewer */
  function plan(local, incoming) {
    const items = [], mk = (kind, inc, loc) => {
      const it = { kind, id: inc.id, name: inc.name || '', n: (inc.students || []).length, inc, loc };
      if (!loc) { it.state = 'new'; it.choice = 'import'; }
      else if (contentEq(inc, loc) || Math.abs((inc.updated || 0) - (loc.updated || 0)) < 1) { it.state = 'same'; it.choice = 'keep'; }
      else {
        it.state = (inc.updated || 0) > (loc.updated || 0) ? 'importNewer' : 'localNewer'; it.nLoc = (loc.students || []).length;
        it.adds = strip(kind === 'exam' ? mergeExam(loc, inc) : mergeRoster(loc, inc)) !== strip(loc);     // ¿aporta algo la importada aunque sea más antigua?
        it.choice = it.state === 'localNewer' && !it.adds ? 'keep' : 'merge';
      }
      return it;
    };
    (incoming.exams || []).forEach(e => items.push(mk('exam', e, local.exams.find(x => x.id === e.id))));
    (incoming.rosters || []).forEach(r => items.push(mk('roster', r, local.rosters.find(x => x.id === r.id))));
    items.needsChange = items.some(i => i.state === 'new' || i.state === 'importNewer' || (i.state === 'localNewer' && i.adds));
    items.needsReview = items.some(i => i.state !== 'same');
    return items;
  }
  /* aplica las decisiones: devuelve { local, changed } sin tocar el almacenamiento */
  function applyPlan(local, items, fixer) {
    const out = { exams: local.exams.slice(), rosters: local.rosters.slice() }; let changed = 0;
    items.forEach(it => {
      const list = it.kind === 'exam' ? out.exams : out.rosters, i = list.findIndex(x => x.id === it.id);
      if (it.choice === 'keep' || it.state === 'same') return;
      let nv;
      if (it.choice === 'import') nv = clone(it.inc);
      else if (it.choice === 'merge') nv = it.loc ? (it.kind === 'exam' ? mergeExam(it.loc, it.inc) : mergeRoster(it.loc, it.inc)) : clone(it.inc);
      else if (it.choice === 'both') { nv = clone(it.inc); nv.id = K.uid(); nv.name = (nv.name || '') + ' (2)'; nv.students.forEach(s => { s.id = K.uid(); }); list.push(fixer && it.kind === 'exam' ? fixer(nv) : nv); changed++; return; }
      if (!nv) return;
      if (it.kind === 'exam' && fixer) nv = fixer(nv);
      if (i >= 0) list[i] = nv; else list.push(nv); changed++;
    });
    return { local: out, changed };
  }

  /* ---------- enlace / código ---------- */
  const b64u = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  async function pipe(bytes, stream) { const w = stream.writable.getWriter(); w.write(bytes); w.close(); return new Uint8Array(await new Response(stream.readable).arrayBuffer()); }
  async function encode(pkg) {
    const raw = new TextEncoder().encode(JSON.stringify(pkg));
    if (typeof CompressionStream === 'undefined') return 'C0.' + b64u(raw);
    return 'C1.' + b64u(await pipe(raw, new CompressionStream('deflate-raw')));
  }
  async function decode(code) {
    code = String(code).trim(); const i = code.indexOf('#sync='); if (i >= 0) code = code.slice(i + 6);
    const m = /^(C[01])\.([A-Za-z0-9_-]+)$/.exec(code); if (!m) throw new Error('bad');
    const u = unb64u(m[2]);
    const raw = m[1] === 'C0' ? u : await pipe(u, new DecompressionStream('deflate-raw'));
    return JSON.parse(new TextDecoder().decode(raw));
  }
  const linkFor = (code) => location.origin + location.pathname + '#sync=' + code;

  /* ---------- carpeta (File System Access) ---------- */
  const IDB = {
    open() { return new Promise((res, rej) => { const r = indexedDB.open('corrector-sync', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
    async get(k) { const db = await IDB.open(); return new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async set(k, v) { const db = await IDB.open(); return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
    async del(k) { const db = await IDB.open(); return new Promise((res) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = res; }); }
  };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const isSyncName = (n) => /^corrector-.*\.json$/i.test(n);

  /* lee todos los archivos de copia de la carpeta (con reintentos si Drive aún descarga) */
  async function readFolder(dir, { retries = 2, delay = 1500 } = {}) {
    const files = [], problems = [];
    const names = []; for await (const [name, h] of dir.entries()) if (h.kind === 'file' && isSyncName(name)) names.push([name, h]);
    for (const [name, h] of names) {
      let done = false;
      for (let a = 0; a <= retries && !done; a++) {
        try {
          const f = await h.getFile(), txt = await f.text();
          if (!txt.trim()) throw new Error('empty');
          const pkg = JSON.parse(txt), bad = validatePackage(pkg);
          if (bad) { problems.push({ name, why: bad === 'newer' ? 'newer' : 'format' }); done = true; break; }
          files.push({ name, pkg, modified: f.lastModified, size: f.size }); done = true;
        } catch (e) { if (a === retries) problems.push({ name, why: 'unreadable' }); else await wait(delay); }
      }
    }
    return { files, problems };
  }
  async function writeFile(dir, name, text) {
    const fh = await dir.getFileHandle(name, { create: true }), w = await fh.createWritable(); await w.write(text); await w.close();
  }
  async function writeCanonical(dir, local) {
    await writeFile(dir, CANON, JSON.stringify(buildPackage(local), null, 0));
  }
  const sizeOf = (obj) => new Blob([JSON.stringify(obj)]).size;

  /* ---------- controlador de la carpeta vinculada ---------- */
  const listeners = [];
  const link = {
    handle: null, st: { state: 'off', last: store.get('lastSync', 0), msg: '', problems: [], pending: null },
    on(f) { listeners.push(f); }, emit() { listeners.forEach(f => { try { f(link.st); } catch (e) { console.error(e); } }); },
    set(state, extra = {}) { Object.assign(link.st, { state }, extra); link.emit(); },
    supported: () => typeof window.showDirectoryPicker === 'function',
    async init() {
      if (!link.supported()) return;
      try { link.handle = await IDB.get('dir'); } catch (e) { link.handle = null; }
      if (!link.handle) return link.set('off');
      await link.checkPermission();
    },
    async checkPermission() {
      try { const p = await link.handle.queryPermission({ mode: 'readwrite' }); link.set(p === 'granted' ? (link.st.last ? 'ok' : 'idle') : 'perm'); return p === 'granted'; }
      catch (e) { link.set('missing'); return false; }
    },
    async pick() {
      const h = await window.showDirectoryPicker({ id: 'corrector-sync', mode: 'readwrite' });
      link.handle = h; await IDB.set('dir', h); store.set('lastSync', 0); link.set('idle', { last: 0 }); return h;
    },
    async unlink() { link.handle = null; await IDB.del('dir'); link.set('off', { last: 0 }); },
    async regrant() { try { const p = await link.handle.requestPermission({ mode: 'readwrite' }); link.set(p === 'granted' ? 'idle' : 'perm'); return p === 'granted'; } catch (e) { link.set('missing'); return false; } },
    /* lee la carpeta y calcula el plan; no escribe nada */
    async check() {
      if (!link.handle) throw new Error('nolink');
      if (!(await link.checkPermission())) throw new Error('perm');
      link.set('busy');
      let res; try { res = await readFolder(link.handle); } catch (e) { link.set('missing'); throw new Error('missing'); }
      const local = readLocal(), incoming = fold(res.files.map(f => f.pkg)), items = plan(local, incoming);
      return { items, problems: res.problems, files: res.files, local };
    },
    /* guarda el estado consolidado en la carpeta */
    async write(local) {
      try { await writeCanonical(link.handle, local || readLocal()); link.st.last = Date.now(); store.set('lastSync', link.st.last); link.set('ok', { dirty: false }); return true; }
      catch (e) { link.set('missing'); return false; }
    },
    /* guardado automático: no pisa nada si hay cambios de otro dispositivo pendientes de revisar */
    async auto() {
      if (!link.handle || link.st.state === 'perm' || link.st.state === 'missing') return;
      try {
        const r = await link.check();
        if (r.items.needsChange) { link.set('review', { pending: r }); return; }
        if (r.problems.some(p => p.name === CANON && p.why === 'unreadable')) { link.set('warn', { problems: r.problems }); return; }
        await link.write(r.local); link.st.problems = r.problems; link.emit();
      } catch (e) { if (link.st.state === 'busy') link.set('warn'); }
    },
    markDirty() { if (link.handle && link.st.state === 'ok') link.set('dirty'); }
  };
  link.autoDebounced = K.debounce(() => link.auto(), 3500);

  C.sync = { VERSION, CANON, device, deviceFile, slug, readLocal, writeLocal, buildPackage, validatePackage, mergeExam, mergeStudents, fold, plan, applyPlan, encode, decode, linkFor, readFolder, writeFile, writeCanonical, link, sizeOf, isSyncName, clone };
})();
