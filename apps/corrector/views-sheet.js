/* ============================================================
   Corrector de tests · pestaña «Hoja de respuestas»
   ============================================================ */
(() => {
  'use strict';
  const C = window.CORR, K = window.AppKit, esc = K.esc;
  const X = () => C.ctx, T = (k, p) => K.t(k, p);

  function render() {
    const e = X().exam, p = C.hoja.params(e), sh = e.sheet || {}, auto = !sh.nq;
    const tpl = (n) => `<div class="stat"><b style="font-size:1.1rem">${T('tplN', { n })}</b><div class="row" style="margin-top:8px"><button class="btn small" data-act="x:pv" data-kind="blank" data-id="${n}">${T('preview')}</button><button class="btn ghost small" data-act="x:pr" data-kind="blank" data-id="${n}">${T('printBtn')}</button></div></div>`;
    return `
    <div class="grid cols-2 sheet-grid">
      <section class="panel stack">
        <h2>${T('shTitle')}</h2><p class="muted" style="margin:0">${T('shHelp')}</p>
        <div class="field"><span style="font-weight:600">${T('shSize')}</span><div class="seg" role="group">${[[0, T('shAuto', { n: e.nq })], [40, '40'], [50, '50'], [100, '100']].map(([v, l]) => `<button type="button" data-act="x:shsize" data-v="${v}" aria-pressed="${(sh.nq || 0) === v}" ${v && v < e.nq ? 'disabled' : ''}>${esc(l)}</button>`).join('')}</div><small>${T('shSizeHelp')}</small></div>
        <div class="grid cols-2"><label class="field">${T('codeLen')}<select data-sh="codeLen">${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option ${n === e.codeLen ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="check" style="align-self:end"><input type="checkbox" data-sh="codeCheck" ${e.codeCheck ? 'checked' : ''}> ${T('codeCheck')}</label></div>
        <div class="chip accent" style="align-self:flex-start">${T('shFormat', { q: p.nq, o: p.nopt, v: p.nver, l: p.codeLen })}</div>
        <div class="banner-warn" style="font-size:.95rem">${T('shReprint')}</div>
        <div class="row"><button class="btn" data-act="x:pv" data-kind="sheet">${T('preview')}</button><button class="btn ghost" data-act="x:pr" data-kind="sheet">${T('printBtn')}</button><button class="btn ghost" data-act="x:svg">${T('shSvg')}</button></div>
      </section>
      <section class="panel sheet-thumb" aria-label="${esc(T('shPreview'))}"><div class="thumb">${C.hoja.sheetSVG(e).replace(/width="210mm" height="297mm"/, 'width="100%"')}</div></section>
    </div>
    <section class="panel stack"><h2 style="margin:0">${T('shTemplates')}</h2><p class="muted" style="margin:0">${T('shTemplatesHelp')}</p>
      <div class="grid cols-3">${tpl(40)}${tpl(50)}${tpl(100)}</div></section>
    <section class="panel stack"><h2 style="margin:0">${T('shHow')}</h2>
      <ol class="steps"><li>${T('shHow1')}</li><li>${T('shHow2')}</li><li>${T('shHow3')}</li><li>${T('shHow4')}</li></ol>
      <div class="row"><button class="btn ghost small" data-tab="students">${T('tab_students')}</button><button class="btn small" data-tab="scan">${T('tab_scan')}</button></div></section>`;
  }
  function init() {
    const app = document.querySelector('#app');
    app.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-act]'); if (!b) return; const x = X(), a = b.dataset.act;
      if (a === 'x:pv') x.openPreview(b.dataset.kind, b.dataset.id);
      else if (a === 'x:pr') x.doPrint(x.docFor(b.dataset.kind, b.dataset.id));
      else if (a === 'x:shsize') { x.exam.sheet = Object.assign({}, x.exam.sheet, { nq: +b.dataset.v }); x.changed(); x.renderView(); }
      else if (a === 'x:svg') K.download(x.fileName('hoja.svg'), C.hoja.sheetSVG(x.exam), 'image/svg+xml');
    });
    app.addEventListener('change', (ev) => {
      const el = ev.target; if (!el.dataset.sh) return; const x = X();
      if (el.dataset.sh === 'codeLen') x.exam.codeLen = +el.value; else if (el.dataset.sh === 'codeCheck') x.exam.codeCheck = el.checked;
      x.changed(); x.renderView();
    });
  }
  C.uiSheet = { render, init };
})();
