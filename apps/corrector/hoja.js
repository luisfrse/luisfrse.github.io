/* ============================================================
   Corrector de tests · hoja de respuestas escaneable (SVG en mm), lista y tarjetas de códigos
   ============================================================ */
(() => {
  'use strict';
  const C = window.CORR, K = window.AppKit, esc = K.esc;

  /* parámetros de la hoja a partir del examen */
  function params(exam) {
    const sh = exam.sheet || {};
    const nq = sh.nq ? Math.max(sh.nq, exam.nq) : exam.nq;
    return { nq: Math.min(100, nq), nopt: exam.nopt, nver: exam.versions.length, codeLen: sh.codeLen || exam.codeLen || 4 };
  }
  const layoutOf = (exam) => C.geom.layout(params(exam));

  function sheetSVG(exam, o = {}) {
    const t = K.t, g = layoutOf(exam), sh = exam.sheet || {}, s = [];
    const n = (v) => +v.toFixed(2);
    const title = o.title != null ? o.title : (exam.name || t('untitled'));
    const fs = Math.min(6.2, 140 / (Math.max(8, title.length) * 0.52));
    s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" width="210mm" height="297mm" font-family="'Source Sans 3',Arial,Helvetica,sans-serif" fill="#000"><rect width="210" height="297" fill="#fff"/>`);
    g.markers.forEach(m => s.push(`<rect x="${m.cx - m.s / 2}" y="${m.cy - m.s / 2}" width="${m.s}" height="${m.s}"/>`));
    s.push(`<rect x="${g.orient.cx - g.orient.s / 2}" y="${g.orient.cy - g.orient.s / 2}" width="${g.orient.s}" height="${g.orient.s}"/>`);
    /* cabecera */
    s.push(`<text x="28" y="${n(12 + fs * 0.35)}" font-size="${n(fs)}" font-weight="700">${esc(title)}</text>`);
    const sub = [K.fmtDate(exam.date), `${exam.nq} ${t('qs')}`, o.sub].filter(Boolean).join(' · ');
    s.push(`<text x="28" y="20" font-size="3.4" fill="#333">${esc(sub)}</text>`);
    const field = (label, y, x2) => `<text x="26" y="${y}" font-size="3">${esc(label)}</text><line x1="26" y1="${y + 2}" x2="${x2}" y2="${y + 2}" stroke="#000" stroke-width=".3"/>`;
    s.push(field(t('hjLast'), 31, 140), field(t('hjFirst'), 40.5, 140), field(t('hjGroup'), 50, 112));
    const who = o.who;
    if (who) { const nm = (y, v) => `<text x="46" y="${y - 0.4}" font-size="4.2" font-weight="700">${esc(v)}</text>`; s.push(nm(31, who.last || ''), nm(40.5, who.first || ''), nm(50, who.group || '')); }
    s.push(`<text x="26" y="${nVerLabelY(g)}" font-size="3" font-weight="700">${g.ver.items.length ? esc(t('hjVersion')) : ''}</text>`);
    g.ver.items.forEach(it => s.push(`<text x="${it.x}" y="${it.y - 3.4}" font-size="3" text-anchor="middle" font-weight="700">${it.l}</text>${circ(it.x, it.y, g.ver.r, who && who.version === it.l)}`));
    /* código */
    const c = g.code;
    s.push(`<text x="${n(c.x0)}" y="${c.y0 + 0.5}" font-size="3" font-weight="700">${esc(t('hjCode'))}</text>`);
    c.cols.forEach(x => s.push(`<rect x="${n(x - c.boxS / 2)}" y="${c.boxY}" width="${c.boxS}" height="${c.boxS}" fill="none" stroke="#000" stroke-width=".3"/>`));
    if (who && who.code) c.cols.forEach((x, j) => s.push(`<text x="${n(x)}" y="${n(c.boxY + 3.9)}" font-size="3.8" font-weight="700" text-anchor="middle">${esc(who.code[j] || '')}</text>`));
    c.rowY.forEach((y, d) => {
      s.push(`<text x="${n(c.x0 - 1.2)}" y="${n(y + 1)}" font-size="3" text-anchor="end" fill="#333">${d}</text>`);
      c.cols.forEach((x, j) => s.push(circ(x, y, c.r, !!(who && who.code && who.code[j] === String(d)))));
    });
    if (exam.codeCheck) s.push(`<text x="${n(c.x0)}" y="${c.rowY[9] + 6.5}" font-size="2.3" fill="#555">${esc(t('hjCheckNote'))}</text>`);
    /* instrucciones */
    const iy = 66;
    s.push(`<rect x="26" y="${iy}" width="${n(c.x0 - 6 - 26 + 0)}" height="19" rx="1.5" fill="none" stroke="#000" stroke-width=".25"/>`);
    const lines = wrap(t('hjInstr'), Math.round((c.x0 - 36) / 1.45));
    lines.slice(0, 4).forEach((l, i) => s.push(`<text x="28.5" y="${iy + 4.2 + i * 3.3}" font-size="2.7">${esc(l)}</text>`));
    const ex = c.x0 - 26;
    const ey = iy + 15.2;
    s.push(`<circle cx="${ex - 38}" cy="${ey}" r="1.7" fill="#000"/><text x="${ex - 35}" y="${ey + 1}" font-size="2.4">${esc(t('hjOk'))}</text>`);
    [[0, 'x'], [1, 'half'], [2, 'tick']].forEach(([i, k]) => {
      const x = ex - 18 + i * 8;
      s.push(circ(x, ey, 1.7) + (k === 'x' ? `<path d="M${x - 1.2} ${ey - 1.2}L${x + 1.2} ${ey + 1.2}M${x + 1.2} ${ey - 1.2}L${x - 1.2} ${ey + 1.2}" stroke="#000" stroke-width=".35"/>` : k === 'half' ? `<path d="M${x - 1.7} ${ey}A1.7 1.7 0 0 1 ${x + 1.7} ${ey}Z" fill="#000"/>` : `<path d="M${x - 1.3} ${ey}l1 1.1l1.8 -2.4" fill="none" stroke="#000" stroke-width=".35"/>`));
    });
    s.push(`<text x="${ex + 6}" y="${ey + 1}" font-size="2.4">${esc(t('hjBad'))}</text>`);
    /* preguntas */
    g.blocks.forEach(b => {
      for (let i = 0; i < b.rows; i += 1) if (Math.floor(i / 5) % 2 === 0) s.push(`<rect x="${n(b.x - 1)}" y="${n(g.q[b.r0].y + i * b.dy - b.dy / 2)}" width="${n(b.w - 2)}" height="${n(b.dy)}" fill="#efefef"/>`);
      g.q[b.r0].opts.forEach(op => s.push(`<text x="${n(op.x)}" y="${b.y}" font-size="3" text-anchor="middle" font-weight="700">${op.l}</text>`));
    });
    g.q.forEach(q => {
      s.push(`<text x="${n(q.nx)}" y="${n(q.y + 1.1)}" font-size="3.2" text-anchor="end" font-weight="700">${q.n + 1}</text>`);
      q.opts.forEach(op => s.push(circ(op.x, op.y, g.r)));
    });
    s.push(`<text x="105" y="290.5" font-size="2.4" text-anchor="middle" fill="#555">${esc(t('hjFoot', { n: g.nq, l: g.L }))}</text>`);
    s.push('</svg>');
    return s.join('');
    function circ(x, y, r, on) { return `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${on ? '#000' : '#fff'}" stroke="#000" stroke-width=".3"/>`; }
  }
  const nVerLabelY = (g) => g.ver.y + 1;
  function wrap(text, max) {
    const out = []; let cur = '';
    String(text).split(/\s+/).forEach(w => { if ((cur + ' ' + w).trim().length > max) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) out.push(cur); return out;
  }

  /* ---- documentos imprimibles (HTML para vista previa / impresión) ---- */
  const page = (svg) => `<div class="page raw">${svg}</div>`;
  const docSheet = (exam) => page(sheetSVG(exam));
  const docBlank = (exam, id) => {
    const nq = +id || exam.nq, ex = Object.assign({}, exam, { nq: Math.min(100, nq), sheet: { nq: +id || 0 } });
    return page(sheetSVG(ex, { title: K.t('hjBlankTitle'), sub: K.t('hjBlankSub', { n: Math.min(100, nq) }) }));
  };

  /* una hoja por alumno con nombre, código y versión ya impresos; id = alumno concreto (si no, todos). o.vmode: 'student' | 'alt' */
  function docPersonal(exam, id) {
    const L = sortedStudents(exam).filter(s => !id || s.id === id), nv = exam.versions.length;
    if (!L.length) return '';
    const all = sortedStudents(exam);
    return L.map(s => {
      const i = all.indexOf(s), v = exam.versions.includes(s.version) && (s.vfixed || nv === 1) ? s.version : exam.versions[i % nv];
      return page(sheetSVG(exam, { who: { last: s.last || s.name, first: s.first, group: s.group, code: s.code, version: nv > 1 ? v : '' } }));
    }).join('');
  }
  const nm = (s) => C.roster.display(s);
  function sortedStudents(exam) {
    return exam.students.slice().sort((a, b) => (a.last || a.name || '').localeCompare(b.last || b.name || '', K.locale()) || (a.first || '').localeCompare(b.first || '', K.locale()));
  }
  function docCodes(exam) {
    const t = K.t, L = sortedStudents(exam), per = 38, out = [];
    for (let i = 0; i < Math.max(1, L.length); i += per) {
      const rows = L.slice(i, i + per).map(s => `<tr><td>${esc(s.last || (s.first ? '' : s.name))}</td><td>${esc(s.first)}</td><td>${esc(s.group)}</td><td class="c mono"><b>${esc(s.code || '—')}</b></td></tr>`).join('');
      out.push(`<div class="page"><div class="sub">${esc(exam.name || t('untitled'))} · ${esc(K.fmtDate(exam.date))}</div><h1>${esc(t('codesTitle'))}</h1>
        <p class="sub">${esc(t('codesPrivacyPrint'))}</p>
        <table class="rt"><thead><tr><th>${esc(t('colLast'))}</th><th>${esc(t('colFirst'))}</th><th>${esc(t('colGroup'))}</th><th class="c">${esc(t('colCode'))}</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="foot"><span>${esc(t('generatedBy'))}</span><span></span></div></div>`);
    }
    return out.join('');
  }
  function docCards(exam) {
    const t = K.t, L = sortedStudents(exam), per = 12, out = [];
    for (let i = 0; i < Math.max(1, L.length); i += per) {
      const cards = L.slice(i, i + per).map(s => `<div class="card"><div class="cn">${esc(s.last || (s.first ? '' : s.name))}${s.first ? ', ' + esc(s.first) : ''}</div><div class="cg">${esc(s.group)}</div>
        <div class="cc">${(s.code || '—').split('').map(d => `<span>${esc(d)}</span>`).join('')}</div><div class="ch">${esc(t('cardHint'))}</div><div class="ce">${esc(exam.name || '')}</div></div>`).join('');
      out.push(`<div class="page"><div class="cards">${cards}</div></div>`);
    }
    return out.join('');
  }
  C.hoja = { params, layoutOf, sheetSVG, docs: { personal: docPersonal, sheet: docSheet, blank: docBlank, codes: docCodes, cards: docCards } };
  C.docs = Object.assign(C.docs || {}, C.hoja.docs);
})();
