/* ============================================================
   Corrector de tests · lector mínimo de .xlsx (ZIP + DecompressionStream), sin librerías
   Lee sharedStrings y la primera hoja; devuelve filas de texto.
   ============================================================ */
(() => {
  'use strict';
  const C = (window.CORR = window.CORR || {});

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('nostream');
    const ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }
  /* lee el directorio central del ZIP → { nombre: {method, csize, offset} } */
  function zipEntries(buf) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let e = -1; for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65600); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('notzip');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = {};
    for (let i = 0; i < n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('badzip');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      out[new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl))] = { method, csize, off };
      p += 46 + nl + el + cl;
    }
    return out;
  }
  async function readEntry(buf, ent) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), nl = dv.getUint16(ent.off + 26, true), el = dv.getUint16(ent.off + 28, true), start = ent.off + 30 + nl + el;
    const raw = buf.subarray(start, start + ent.csize);
    return ent.method === 0 ? raw : inflateRaw(raw);
  }
  const text = (u8) => new TextDecoder('utf-8').decode(u8);
  const colIndex = (ref) => { const m = /^([A-Z]+)/.exec(ref || ''); if (!m) return 0; let n = 0; for (const ch of m[1]) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

  /* devuelve { rows, sheetName } */
  async function readXlsx(arrayBuffer) {
    const buf = new Uint8Array(arrayBuffer);
    if (buf[0] === 0xD0 && buf[1] === 0xCF) throw new Error('xls');          // .xls antiguo (OLE2)
    if (!(buf[0] === 0x50 && buf[1] === 0x4B)) throw new Error('notzip');
    const ents = zipEntries(buf), get = async (n) => (ents[n] ? text(await readEntry(buf, ents[n])) : null);
    const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
    const ss = [], sst = await get('xl/sharedStrings.xml');
    if (sst) xml(sst).querySelectorAll('si').forEach(si => { ss.push([...si.querySelectorAll('t')].filter(t => !t.closest('rPh')).map(t => t.textContent).join('')); });
    let path = 'xl/worksheets/sheet1.xml', name = '';
    const wb = await get('xl/workbook.xml'), rels = await get('xl/_rels/workbook.xml.rels');
    if (wb && rels) {
      const sh = xml(wb).querySelector('sheet');
      if (sh) {
        name = sh.getAttribute('name') || '';
        const rid = sh.getAttribute('r:id') || sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
        const rel = [...xml(rels).querySelectorAll('Relationship')].find(r => r.getAttribute('Id') === rid);
        if (rel) { let tg = rel.getAttribute('Target'); tg = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg; path = tg; }
      }
    }
    if (!ents[path]) { const alt = Object.keys(ents).find(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)); if (!alt) throw new Error('nosheet'); path = alt; }
    const sheet = xml(await get(path)), rows = [];
    sheet.querySelectorAll('sheetData > row').forEach(row => {
      const r = [];
      row.querySelectorAll('c').forEach(c => {
        const i = colIndex(c.getAttribute('r')), t = c.getAttribute('t'), v = c.querySelector('v');
        let val = '';
        if (t === 's') val = ss[+(v ? v.textContent : -1)] ?? '';
        else if (t === 'inlineStr') val = [...c.querySelectorAll('t')].map(x => x.textContent).join('');
        else if (v) { val = v.textContent; if (/^-?\d+\.0+$/.test(val)) val = val.replace(/\.0+$/, ''); if (/^-?\d+(\.\d+)?E\+?\d+$/i.test(val)) val = String(Number(val)); }
        while (r.length < i) r.push('');
        r[i] = String(val).trim();
      });
      if (r.some(x => x !== '')) rows.push(r);
    });
    return { rows, sheetName: name };
  }
  C.xlsx = { readXlsx };
})();
