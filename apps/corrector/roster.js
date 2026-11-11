/* ============================================================
   Corrector de tests · alumnado: nombres, importación (texto/CSV/Excel), códigos numéricos
   Funciones puras (sin DOM) + listas reutilizables en localStorage
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {});
  const K = window.AppKit;
  const store = K.storage('corrector');

  const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const display = (s) => (s.last || s.first) ? (s.last && s.first ? `${s.last}, ${s.first}` : (s.last || s.first)) : clean(s.name);
  const fold = (s) => clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const keyName = (s) => fold((s.last || '') + '|' + (s.first || '') || s.name).replace(/\|$/, '') || fold(s.name);

  /* ---------- separar nombre completo ---------- */
  /* modos: comma «Apellidos, Nombre» · fl1 «Nombre Apellidos» (1 palabra de nombre) · fl2 (2 palabras de nombre)
     · lf2 «Apellidos Nombre» (2 palabras de apellidos) · lf1 (1 palabra de apellidos) */
  function splitName(full, mode) {
    full = clean(full); if (!full) return { last: '', first: '' };
    if (mode === 'comma' || (mode === 'auto' && full.includes(','))) { const i = full.indexOf(','); return { last: clean(full.slice(0, i)), first: clean(full.slice(i + 1)) }; }
    const w = full.split(' ');
    if (w.length === 1) return { last: w[0], first: '' };
    const m = mode === 'auto' ? 'fl1' : mode, n = m === 'fl2' ? 2 : m === 'lf2' ? 2 : 1;
    if (m === 'fl1' || m === 'fl2') { const k = Math.min(n, w.length - 1); return { first: w.slice(0, k).join(' '), last: w.slice(k).join(' ') }; }
    const k = Math.min(n, w.length - 1); return { last: w.slice(0, k).join(' '), first: w.slice(k).join(' ') };
  }

  /* ---------- tabla → registros ---------- */
  const HEAD = {
    last: ['apellidos', 'apellido', 'cognoms', 'cognom', 'surname', 'surnames', 'last name', 'lastname', 'family name', 'familyname'],
    first: ['nombre', 'nom', 'name', 'first name', 'firstname', 'given name', 'nombre de pila', 'nom de pila'],
    full: ['alumno', 'alumna', 'alumnado', 'alumne', 'alumnes', 'estudiante', 'student', 'nombre completo', 'nom complet', 'full name', 'apellidos y nombre', 'cognoms i nom', 'nombre y apellidos', 'nom i cognoms'],
    code: ['codigo', 'codi', 'code', 'id', 'identificador', 'identifier', 'dni', 'nia', 'num', 'numero', 'n', 'n.', 'nº', 'matricula'],
    group: ['grupo', 'grup', 'group', 'clase', 'classe', 'class', 'curso', 'curs', 'course', 'aula']
  };
  const headRole = (cell) => { const f = fold(cell).replace(/[:.]+$/, ''); for (const r of Object.keys(HEAD)) if (HEAD[r].includes(f)) return r; return null; };
  /* adivina el rol de cada columna; devuelve { header:boolean, roles:[] } */
  function guessColumns(rows) {
    if (!rows.length) return { header: false, roles: [] };
    const nc = Math.max(...rows.map(r => r.length)), first = rows[0];
    const hr = first.map(headRole), header = hr.filter(Boolean).length >= 1 && hr.filter(Boolean).length >= Math.min(2, nc) - (nc === 1 ? 0 : 0) && !first.some(c => /^\d{3,}$/.test(c));
    if (header) { const used = new Set(); return { header: true, roles: first.map((c, i) => { const r = hr[i]; if (!r || used.has(r)) return 'skip'; used.add(r); return r; }) }; }
    const body = rows.slice(0, 30), roles = Array(nc).fill('skip');
    const numeric = (i) => body.filter(r => /^\d{1,12}$/.test(r[i] || '')).length / body.length;
    const texty = [];
    for (let i = 0; i < nc; i++) { if (numeric(i) > 0.8) { if (!roles.includes('code')) roles[i] = 'code'; } else texty.push(i); }
    if (texty.length === 1) roles[texty[0]] = 'full';
    else if (texty.length >= 2) { roles[texty[0]] = 'last'; roles[texty[1]] = 'first'; if (texty[2] !== undefined) roles[texty[2]] = 'group'; }
    return { header: false, roles };
  }
  /* aplica roles y modo de nombre → registros {last, first, code, group} */
  function toRecords(rows, roles, { header = false, mode = 'auto' } = {}) {
    const out = [];
    rows.slice(header ? 1 : 0).forEach((r) => {
      const rec = { last: '', first: '', code: '', group: '' }; let full = '';
      roles.forEach((role, i) => {
        const v = clean(r[i]); if (!v) return;
        if (role === 'last') rec.last = v; else if (role === 'first') rec.first = v; else if (role === 'full') full = v;
        else if (role === 'code') rec.code = v.replace(/\D/g, ''); else if (role === 'group') rec.group = v;
      });
      if (full && !rec.last && !rec.first) Object.assign(rec, splitName(full, mode));
      if (rec.last || rec.first) out.push(rec);
    });
    return out;
  }
  /* texto pegado → filas */
  function textToRows(text) {
    const lines = String(text).replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return [];
    const cnt = (ch) => lines.filter(l => l.includes(ch)).length;
    if (cnt('\t') >= lines.length * 0.6) return lines.map(l => l.split('\t').map(clean));
    if (cnt(';') >= lines.length * 0.6) return K.parseCSV(lines.join('\n'));
    const commaLines = lines.filter(l => l.includes(','));
    if (commaLines.length >= lines.length * 0.6) {
      const parts = lines.map(l => l.split(',').length);
      if (Math.max(...parts) === 2 && Math.min(...parts) >= 1 && !lines[0].toLowerCase().match(/apellid|cognom|surname|nombre|nom\b|name/)) {
        // «Apellidos, Nombre» una por línea (dos columnas); si hay más comas es CSV con cabecera
        return lines.map(l => { const i = l.indexOf(','); return i < 0 ? [clean(l)] : [clean(l.slice(0, i)), clean(l.slice(i + 1))]; });
      }
      return K.parseCSV(lines.join('\n'));
    }
    return lines.map(l => [clean(l)]);
  }
  /* modo de nombre sugerido para columnas «completo» */
  function guessMode(rows, roles) {
    const i = roles.indexOf('full'); if (i < 0) return 'auto';
    const vals = rows.map(r => r[i] || '').filter(Boolean);
    return vals.filter(v => v.includes(',')).length >= vals.length * 0.5 ? 'comma' : 'fl1';
  }

  /* ---------- códigos ---------- */
  const luhn = (digits) => { let s = 0, alt = true; for (let i = digits.length - 1; i >= 0; i--) { let d = +digits[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return (10 - (s % 10)) % 10; };
  const withCheck = (base) => base + luhn(base);
  const validCode = (code, L, check) => /^\d+$/.test(code) && code.length === L && (!check || luhn(code.slice(0, -1)) === +code.slice(-1));
  /* genera n códigos únicos; mode 'random' (no consecutivos) o 'seq' */
  function genCodes(n, { L = 4, mode = 'random', check = false, used = new Set(), rnd = Math.random } = {}) {
    const bl = check ? L - 1 : L, space = Math.pow(10, bl), out = [], taken = new Set(used);
    if (n > space - taken.size) return null;
    const usedBase = new Set([...taken].map(c => parseInt(check ? c.slice(0, -1) : c, 10)).filter(Number.isFinite));
    const fmt = (v) => { const b = String(v).padStart(bl, '0'); return check ? withCheck(b) : b; };
    if (mode === 'seq') {
      let v = 1; while (out.length < n && v < space) { if (!usedBase.has(v)) { out.push(fmt(v)); usedBase.add(v); } v++; }
      return out.length === n ? out : null;
    }
    const spread = space >= (n + usedBase.size) * 4;
    let guard = 0;
    while (out.length < n && guard++ < n * 200 + 1000) {
      const v = Math.floor(rnd() * space); if (v === 0 && bl > 1) continue;
      if (usedBase.has(v) || (spread && (usedBase.has(v - 1) || usedBase.has(v + 1)))) continue;
      usedBase.add(v); out.push(fmt(v));
    }
    return out.length === n ? out : null;
  }
  const maxStudents = (L, check) => Math.pow(10, check ? L - 1 : L) - 1;

  /* ---------- importación con detección de duplicados ---------- */
  function analyze(recs, existing, L, check) {
    const byCode = new Map(), byName = new Map();
    existing.forEach(s => { if (s.code) byCode.set(s.code, s); byName.set(keyName(s), s); });
    const seenC = new Set(), seenN = new Set();
    return recs.map((r, i) => {
      const k = keyName(r), flags = [];
      if (byName.has(k) || seenN.has(k)) flags.push('dupName');
      if (r.code) {
        if (byCode.has(r.code) || seenC.has(r.code)) flags.push('dupCode');
        else if (!validCode(r.code, L, check)) flags.push('badCode');
      }
      seenN.add(k); if (r.code) seenC.add(r.code);
      return { i, rec: r, flags };
    });
  }

  /* ---------- listas reutilizables («mis clases») ---------- */
  const lists = {
    all() { return (store.get('rosters', []) || []).filter(x => x && x.id); },
    save(arr) { store.set('rosters', arr); },
    get(id) { return lists.all().find(l => l.id === id) || null; },
    put(l) { l.updated = Date.now(); const a = lists.all(), i = a.findIndex(x => x.id === l.id); if (i >= 0) a[i] = l; else a.push(l); lists.save(a); return l; },
    remove(id) { lists.save(lists.all().filter(l => l.id !== id)); },
    create(name, students = []) { return lists.put({ id: K.uid(), name: name || '', students, updated: Date.now() }); }
  };
  const newStudent = (r = {}) => ({ id: K.uid(), last: clean(r.last), first: clean(r.first), group: clean(r.group), code: String(r.code || '') });

  C.roster = { clean, display, fold, keyName, splitName, headRole, guessColumns, toRecords, textToRows, guessMode, luhn, withCheck, validCode, genCodes, maxStudents, analyze, lists, newStudent };
})();
