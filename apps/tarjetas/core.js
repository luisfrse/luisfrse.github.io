/* ============================================================
   Tarjetas de estudio · motor (datos, planificación, estadísticas, importación)
   Sin dependencias de interfaz: se puede probar en Node.
   Algoritmo: variante de SM-2 con pasos de aprendizaje (estilo Anki).
   ============================================================ */
(function (G) {
  'use strict';
  const TJ = G.TJ = G.TJ || {};
  const MIN = 60000, DAY = 86400000, ROLLOVER = 4;      // el «día» cambia a las 4:00
  const MAX_IVL = 36500, MATURE = 21;
  const DEFAULTS = { newPerDay: 20, maxReviews: 200, steps: [1, 10], relearn: [10], graduate: 1, easy: 4, startEase: 2500, lapseMult: 0, learnAhead: 20 };

  const uid = () => (G.AppKit && G.AppKit.uid) ? G.AppKit.uid() : Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---------- días ---------- */
  function dayIndex(ts) { const d = new Date(ts - ROLLOVER * 3600000); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY); }
  function dayStartTs(idx) { const d = new Date(idx * DAY); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), ROLLOVER).getTime(); }
  const keyOf = (idx) => new Date(idx * DAY).toISOString().slice(0, 10);

  /* ---------- modelos ---------- */
  const settingsOf = (deck) => Object.assign({}, DEFAULTS, deck && deck.set || {});
  const isCloze = (card) => /\{\{c\d+::/.test(card.q || '');
  function newCard(q, a, topic, hint) {
    return { id: uid(), q: String(q || '').trim(), a: String(a || '').trim(), topic: String(topic || '').trim(), hint: String(hint || '').trim(),
      st: 0, step: 0, ease: 0, ivl: 0, due: 0, reps: 0, lapses: 0, last: 0, created: Date.now() };
  }
  function newDeck(name, lang) {
    return { id: uid(), name: String(name || '').trim() || '—', lang: lang || 'es', created: Date.now(), cards: [], days: {}, set: {}, sample: null, v: 1 };
  }
  function normalizeDeck(o) {
    if (!o || typeof o !== 'object') return null;
    const d = newDeck(o.name, ['es', 'ca', 'en'].includes(o.lang) ? o.lang : 'es');
    d.id = String(o.id || d.id); d.created = +o.created || d.created; d.sample = o.sample || null;
    d.set = {};
    const s = o.set || {};
    const num = (v, a, b, def) => { v = Number(v); return Number.isFinite(v) ? clamp(v, a, b) : def; };
    const steps = (v, def) => { const arr = (Array.isArray(v) ? v : []).map(Number).filter(x => x > 0 && x <= 60 * 24 * 7); return arr.length ? arr.slice(0, 8) : def; };
    if ('newPerDay' in s) d.set.newPerDay = Math.round(num(s.newPerDay, 0, 9999, DEFAULTS.newPerDay));
    if ('maxReviews' in s) d.set.maxReviews = Math.round(num(s.maxReviews, 0, 99999, DEFAULTS.maxReviews));
    if ('steps' in s) d.set.steps = steps(s.steps, DEFAULTS.steps);
    if ('relearn' in s) d.set.relearn = steps(s.relearn, DEFAULTS.relearn);
    if ('graduate' in s) d.set.graduate = Math.round(num(s.graduate, 1, 365, DEFAULTS.graduate));
    if ('easy' in s) d.set.easy = Math.round(num(s.easy, 1, 365, DEFAULTS.easy));
    if ('startEase' in s) d.set.startEase = Math.round(num(s.startEase, 1300, 4000, DEFAULTS.startEase));
    if ('lapseMult' in s) d.set.lapseMult = Math.round(num(s.lapseMult, 0, 100, DEFAULTS.lapseMult));
    d.days = {};
    Object.keys(o.days || {}).forEach(k => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return; const v = o.days[k] || {};
      d.days[k] = { n: +v.n || 0, ok: +v.ok || 0, rv: +v.rv || 0, rvOk: +v.rvOk || 0, nw: +v.nw || 0, ms: +v.ms || 0 };
    });
    d.cards = (Array.isArray(o.cards) ? o.cards : []).map(c => {
      if (!c || typeof c.q !== 'string' || !c.q.trim()) return null;
      const n = newCard(c.q, c.a, c.topic, c.hint);
      n.id = String(c.id || n.id); n.created = +c.created || n.created;
      n.st = [0, 1, 2, 3].includes(c.st) ? c.st : 0; n.step = Math.max(0, +c.step || 0); n.ease = +c.ease || 0;
      n.ivl = Math.max(0, +c.ivl || 0); n.due = +c.due || 0; n.reps = +c.reps || 0; n.lapses = +c.lapses || 0; n.last = +c.last || 0;
      return n;
    }).filter(Boolean);
    return d;
  }

  /* ---------- planificación ---------- */
  const R = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };
  function learnDelay(arr, step, rating) {
    if (rating === R.AGAIN) return arr[0];
    if (rating === R.HARD) { if (arr.length === 1) return arr[0] * 1.5; return step === 0 ? (arr[0] + arr[1]) / 2 : arr[step]; }
    return arr[Math.min(step, arr.length - 1)];
  }
  /* Devuelve los campos nuevos de la tarjeta tras puntuarla. No modifica la original. */
  function nextState(card, rating, set, now) {
    const c = { st: card.st, step: card.step, ease: card.ease || set.startEase, ivl: card.ivl, due: card.due, lapses: card.lapses };
    const today = dayIndex(now);
    const graduate = (ivl) => { c.st = 2; c.step = 0; c.ivl = clamp(Math.round(ivl), 1, MAX_IVL); c.due = dayStartTs(today + c.ivl); };
    if (c.st === 0) { c.st = 1; c.step = 0; }
    if (c.st === 1 || c.st === 3) {
      const relearn = c.st === 3, arr = relearn ? set.relearn : set.steps;
      if (rating === R.EASY) { graduate(relearn ? Math.max(1, card.ivl) + 1 : set.easy); return c; }
      if (rating === R.AGAIN) { c.step = 0; c.due = now + arr[0] * MIN; return c; }
      if (rating === R.HARD) { c.due = now + learnDelay(arr, c.step, rating) * MIN; return c; }
      if (c.step + 1 < arr.length) { c.step += 1; c.due = now + arr[c.step] * MIN; return c; }
      graduate(relearn ? Math.max(1, card.ivl) : set.graduate); return c;
    }
    /* repaso */
    const ivl = Math.max(1, card.ivl);
    if (rating === R.AGAIN) {
      c.lapses = card.lapses + 1; c.ease = Math.max(1300, c.ease - 200);
      c.ivl = clamp(Math.round(ivl * set.lapseMult / 100), 1, MAX_IVL); c.st = 3; c.step = 0; c.due = now + set.relearn[0] * MIN; return c;
    }
    if (rating === R.HARD) { c.ease = Math.max(1300, c.ease - 150); c.ivl = clamp(Math.max(ivl + 1, Math.round(ivl * 1.2)), 1, MAX_IVL); }
    else if (rating === R.GOOD) { c.ivl = clamp(Math.max(ivl + 1, Math.round(ivl * c.ease / 1000)), 1, MAX_IVL); }
    else { c.ease = c.ease + 150; const good = Math.max(ivl + 1, Math.round(ivl * (c.ease - 150) / 1000)); c.ivl = clamp(Math.max(good + 1, Math.round(ivl * c.ease / 1000 * 1.3)), 1, MAX_IVL); }
    c.due = dayStartTs(today + c.ivl);
    return c;
  }
  /* Vista previa de los 4 botones: {ms} (aprendizaje) o {days} (repaso) */
  function preview(card, set, now) {
    return [1, 2, 3, 4].map(r => { const n = nextState(card, r, set, now); return n.st === 2 ? { days: Math.max(1, dayIndex(n.due) - dayIndex(now)) } : { ms: Math.max(MIN, n.due - now) }; });
  }
  /* Aplica la respuesta a la tarjeta y a las estadísticas del día. Devuelve datos para deshacer. */
  function applyAnswer(deck, card, rating, now, ms) {
    const set = settingsOf(deck), key = keyOf(dayIndex(now));
    const snap = { card: clone(card), key, day: deck.days[key] ? clone(deck.days[key]) : null };
    const day = deck.days[key] || (deck.days[key] = { n: 0, ok: 0, rv: 0, rvOk: 0, nw: 0, ms: 0 });
    if (card.st === 0) day.nw++;
    if (card.st === 2) { day.rv++; if (rating > 1) day.rvOk++; }
    day.n++; if (rating > 1) day.ok++; day.ms += clamp(ms || 0, 0, 60000);
    Object.assign(card, nextState(card, rating, set, now)); card.reps++; card.last = now;
    return snap;
  }
  function undoAnswer(deck, snap) {
    const i = deck.cards.findIndex(c => c.id === snap.card.id); if (i >= 0) deck.cards[i] = snap.card;
    if (snap.day) deck.days[snap.key] = snap.day; else delete deck.days[snap.key];
    return deck.cards[i];
  }

  /* ---------- sesiones de estudio ---------- */
  function interleave(a, b) {
    const out = []; let i = 0, j = 0; const total = a.length + b.length;
    for (let k = 0; k < total; k++) {
      if (j >= b.length || (i < a.length && (i / (a.length || 1)) <= (j / (b.length || 1)))) out.push(a[i++]); else out.push(b[j++]);
    }
    return out;
  }
  function buildSession(deck, opts, now) {
    const set = settingsOf(deck), today = dayIndex(now), day = deck.days[keyOf(today)] || {};
    const pool = deck.cards.filter(c => !opts.topic || c.topic === opts.topic);
    const s = { deckId: deck.id, mode: opts.mode || 'daily', topic: opts.topic || '', shuffle: !!opts.shuffle, reverse: !!opts.reverse, main: [], learning: [], cram: [], undo: [],
      start: now, answered: 0, again: 0, newSeen: 0, ms: 0, ratings: [0, 0, 0, 0] };
    if (s.mode === 'all') { let ids = pool.map(c => c.id); if (s.shuffle) ids = shuffle(ids); s.cram = ids; s.total = ids.length; return s; }
    s.learning = pool.filter(c => c.st === 1 || c.st === 3).map(c => c.id);
    let rev = pool.filter(c => c.st === 2 && dayIndex(c.due) <= today).sort((a, b) => a.due - b.due);
    let fresh = pool.filter(c => c.st === 0);
    rev = rev.slice(0, Math.max(0, set.maxReviews - (day.rv || 0)));
    fresh = fresh.slice(0, Math.max(0, set.newPerDay - (day.nw || 0) + (opts.extraNew || 0)));
    let r = rev.map(c => c.id), f = fresh.map(c => c.id);
    if (s.shuffle) { r = shuffle(r); f = shuffle(f); }
    s.main = interleave(r, f);
    s.total = s.main.length + s.learning.length;
    return s;
  }
  const byId = (deck, id) => deck.cards.find(c => c.id === id);
  function pickNext(s, deck, now) {
    if (s.mode === 'all') return s.cram.length ? s.cram[0] : null;
    const set = settingsOf(deck);
    const L = s.learning.map(id => byId(deck, id)).filter(c => c && (c.st === 1 || c.st === 3)).sort((a, b) => a.due - b.due);
    const ready = L.find(c => c.due <= now); if (ready) return ready.id;
    while (s.main.length) { const c = byId(deck, s.main[0]); if (c) return c.id; s.main.shift(); }
    if (L[0] && L[0].due <= now + set.learnAhead * MIN) return L[0].id;
    return null;
  }
  /* Actualiza la cola tras puntuar. */
  function afterAnswer(s, deck, card, rating) {
    s.answered++; s.ratings[rating - 1]++; if (rating === 1) s.again++;
    if (s.mode === 'all') {
      s.cram.shift();
      if (rating <= 2) s.cram.splice(Math.min(s.cram.length, rating === 1 ? 3 : 7), 0, card.id);
      return;
    }
    if (s.main[0] === card.id) s.main.shift();
    const inL = s.learning.indexOf(card.id);
    if (card.st === 1 || card.st === 3) { if (inL < 0) s.learning.push(card.id); } else if (inL >= 0) s.learning.splice(inL, 1);
  }
  function remaining(s, deck) {
    if (s.mode === 'all') return { n: s.cram.length, learn: 0, rev: 0, all: s.cram.length };
    let n = 0, rev = 0;
    s.main.forEach(id => { const c = byId(deck, id); if (!c) return; if (c.st === 0) n++; else rev++; });
    const learn = s.learning.filter(id => { const c = byId(deck, id); return c && (c.st === 1 || c.st === 3); }).length;
    return { n, learn, rev, all: n + learn + rev };
  }

  /* ---------- recuentos y estadísticas ---------- */
  function counts(deck, now) {
    const set = settingsOf(deck), today = dayIndex(now), day = deck.days[keyOf(today)] || {};
    const endToday = dayStartTs(today + 1);
    let nNew = 0, learn = 0, rev = 0;
    deck.cards.forEach(c => {
      if (c.st === 0) nNew++;
      else if (c.st === 1 || c.st === 3) { if (c.due < endToday) learn++; }
      else if (dayIndex(c.due) <= today) rev++;
    });
    const newAvail = Math.min(nNew, Math.max(0, set.newPerDay - (day.nw || 0)));
    const revAvail = Math.min(rev, Math.max(0, set.maxReviews - (day.rv || 0)));
    return { total: deck.cards.length, nNew, newAvail, learn, rev, revAvail, due: newAvail + learn + revAvail };
  }
  function aggDays(decks) {
    const out = {};
    decks.forEach(d => Object.keys(d.days).forEach(k => { const v = d.days[k], o = out[k] || (out[k] = { n: 0, ok: 0, rv: 0, rvOk: 0, nw: 0, ms: 0 }); Object.keys(o).forEach(f => { o[f] += v[f] || 0; }); }));
    return out;
  }
  function streak(decks, now) {
    const days = aggDays(decks), today = dayIndex(now);
    const has = (i) => (days[keyOf(i)] || {}).n > 0;
    const studiedToday = has(today); let i = studiedToday ? today : today - 1, n = 0;
    while (has(i)) { n++; i--; }
    return { streak: n, studiedToday };
  }
  function deckStats(decks, now) {
    decks = Array.isArray(decks) ? decks : [decks];
    const today = dayIndex(now), cards = decks.flatMap(d => d.cards), days = aggDays(decks);
    const st = { total: cards.length, nNew: 0, learning: 0, young: 0, mature: 0, suspended: 0 };
    cards.forEach(c => { if (c.st === 0) st.nNew++; else if (c.st === 1 || c.st === 3) st.learning++; else if (c.ivl >= MATURE) st.mature++; else st.young++; });
    const rev30 = [], fore = Array.from({ length: 14 }, (_, i) => ({ key: keyOf(today + i), n: 0 }));
    let rv = 0, rvOk = 0, ms = 0, n = 0;
    for (let i = 29; i >= 0; i--) {
      const k = keyOf(today - i), v = days[k] || {};
      rev30.push({ key: k, n: v.n || 0, ok: v.ok || 0, bad: (v.n || 0) - (v.ok || 0) });
      rv += v.rv || 0; rvOk += v.rvOk || 0; ms += v.ms || 0; n += v.n || 0;
    }
    cards.forEach(c => {
      if (c.st === 2) { const i = Math.max(0, dayIndex(c.due) - today); if (i < 14) fore[i].n++; }
      else if (c.st === 1 || c.st === 3) { if (dayIndex(c.due) <= today) fore[0].n++; else { const i = dayIndex(c.due) - today; if (i < 14) fore[i].n++; } }
    });
    const weeks = 18, dow = (new Date(today * DAY).getUTCDay() + 6) % 7, start = today - dow - (weeks - 1) * 7, heat = [];
    for (let k = 0; k < weeks * 7; k++) { const idx = start + k; heat.push(idx > today ? null : { key: keyOf(idx), n: (days[keyOf(idx)] || {}).n || 0 }); }
    const totalReviews = Object.keys(days).reduce((a, k) => a + days[k].n, 0);
    return Object.assign(st, { rev30, fore, heat, weeks, retention: rv ? rvOk / rv : null, rv30: rv, avgMs: n ? ms / n : null, totalReviews,
      avgEase: (() => { const r = cards.filter(c => c.st === 2); return r.length ? r.reduce((a, c) => a + (c.ease || DEFAULTS.startEase), 0) / r.length / 1000 : null; })() });
  }
  function nextDue(deck, now) {
    const today = dayIndex(now); let best = null;
    deck.cards.forEach(c => { if (c.st === 2 && dayIndex(c.due) > today) { const i = dayIndex(c.due) - today; if (best === null || i < best) best = i; } });
    return best;
  }
  const topicsOf = (deck) => Array.from(new Set(deck.cards.map(c => c.topic).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  /* ---------- texto con formato ligero ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* cloze: 'hide' (oculta los huecos), 'show' (los resalta) o null (sin cloze) */
  function fmtRich(s, cloze) {
    let h = esc(s);
    h = h.replace(/\{\{c\d+::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g, (m, txt, hint) => cloze === 'hide' ? `<span class="cl cl-h">[${hint || '…'}]</span>` : `<span class="cl cl-s">${txt}</span>`);
    h = h.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>');
    return h.replace(/\r?\n/g, '<br>');
  }
  function plain(s, cloze) {
    return String(s ?? '').replace(/\{\{c\d+::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g, (m, txt) => cloze === 'hide' ? ' … ' : txt).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  }

  /* ---------- importación / exportación ---------- */
  const HEAD = { q: ['pregunta', 'question', 'q', 'anvers', 'anverso', 'frente', 'front', 'pregunta/frente'], a: ['respuesta', 'resposta', 'answer', 'a', 'reverso', 'revers', 'back'], topic: ['tema', 'topic', 'etiqueta', 'tag', 'tags'], hint: ['pista', 'hint', 'ayuda'] };
  function parseImport(text, parse) {
    const rows = (parse || G.AppKit.parseCSV)(String(text || ''));
    if (!rows.length) return { cards: [], skipped: 0, header: false };
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-zà-ú/]/g, '');
    let map = { q: 0, a: 1, topic: 2, hint: 3 }, header = false;
    const first = rows[0].map(norm);
    const hits = {}; Object.keys(HEAD).forEach(k => { const i = first.findIndex(c => HEAD[k].includes(c)); if (i >= 0) hits[k] = i; });
    if (Object.keys(hits).length >= 2 && 'q' in hits) { header = true; map = { q: hits.q, a: 'a' in hits ? hits.a : -1, topic: 'topic' in hits ? hits.topic : -1, hint: 'hint' in hits ? hits.hint : -1 }; }
    let skipped = 0; const cards = [];
    rows.slice(header ? 1 : 0).forEach(r => {
      const q = (r[map.q] || '').trim(), a = map.a >= 0 ? (r[map.a] || '').trim() : '';
      if (!q || (!a && !/\{\{c\d+::/.test(q))) { skipped++; return; }
      cards.push({ q: q.replace(/\\n/g, '\n'), a: a.replace(/\\n/g, '\n'), topic: map.topic >= 0 ? (r[map.topic] || '').trim() : '', hint: map.hint >= 0 ? (r[map.hint] || '').trim() : '' });
    });
    return { cards, skipped, header };
  }
  const deckRows = (deck, head) => [head].concat(deck.cards.map(c => [c.q.replace(/\n/g, '\\n'), c.a.replace(/\n/g, '\\n'), c.topic, c.hint]));

  Object.assign(TJ, { MIN, DAY, MATURE, DEFAULTS, R, uid, clone, clamp, shuffle, dayIndex, dayStartTs, keyOf, settingsOf, isCloze, newCard, newDeck, normalizeDeck,
    nextState, preview, applyAnswer, undoAnswer, buildSession, pickNext, afterAnswer, remaining, byId, counts, aggDays, streak, deckStats, nextDue, topicsOf,
    esc, fmtRich, plain, parseImport, deckRows });
  if (typeof module !== 'undefined' && module.exports) module.exports = TJ;
})(typeof window !== 'undefined' ? window : globalThis);
