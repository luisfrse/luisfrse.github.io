/* ============================================================
   Paneles de la interfaz del simulador de epidemias: ficha del patógeno ("cómo se transmite"),
   medidas de control con casillas, vacunas, mapa (origen, movilidad, ranking) y créditos.
   Se comunica con app.js mediante el objeto `host`.
   ============================================================ */
(function (root) {
  'use strict';
  const RCOL = { air: '#7fd3ff', drop: '#b08be0', contact: '#f5b82e', fecal: '#c9955f', fluid: '#ff5d73' };
  const ROUTES = ['air', 'drop', 'contact', 'fecal', 'fluid'];
  const PRESETS = {
    cases: ['iso', 'trace', 'quarantine', 'test'],
    contacts: ['distance', 'mask_surg', 'gatherings', 'hospitality'],
    lockdown: ['lockdown', 'school_closure', 'telework', 'shops'],
    ebola: ['iso', 'trace', 'quarantine', 'ppe', 'burial'],
    airborne: ['mask_ffp2', 'ventilation', 'gatherings', 'test']
  };
  let H = null;
  const $ = (s, r = document) => r.querySelector(s);
  const L = (o) => (o && (o[H.K.lang] || o.es)) || '';
  const esc = (s) => H.K.esc(s);
  const pc = (x, d = 0) => H.K.fmt(x * 100, d) + ' %';
  const range = (r, f) => r ? `${f(r[0])}–${f(r[1])}` : '';
  const tt = (k, p) => H.t(k, p);

  /* ---------- lugares ---------- */
  function renderPlaces() {
    const P = H.P;
    $('#place-chips').innerHTML = ['abstract', 'mataro', 'barcelona', 'catalunya', 'espana', 'europa', 'mundo'].map(id => {
      const g = H.geoCache[id], sub = g ? `<span class="r0">${H.fmtN(g.features.reduce((a, f) => a + f.pop, 0))}</span>` : '';
      return `<button type="button" data-place="${id}" aria-pressed="${id === P.place}">${esc(tt('pl_' + id))}${sub}</button>`;
    }).join('');
  }

  /* ---------- patógenos ---------- */
  function renderPathogens() {
    const D = H.Core.data, P = H.P;
    const groups = ['airborne', 'droplet', 'fecal', 'fluid'];
    $('#scen-chips').innerHTML = groups.map(g => {
      const list = D.pat.filter(p => p.group === g);
      return `<div class="pgroup" role="group" aria-label="${esc(tt('grp_' + g))}"><span class="pg-h">${esc(tt('grp_' + g))}</span>${list.map(p => `<button type="button" data-scen="${p.id}" aria-pressed="${p.id === H.scenId}">${esc(L(p.name))}<span class="r0">R0 ${H.K.fmt(p.R0.v, 1)}</span></button>`).join('')}</div>`;
    }).join('') + `<div class="pgroup"><button type="button" data-scen="custom" aria-pressed="${H.scenId === 'custom'}">${esc(tt('custom'))}</button></div>`;
    renderCard();
  }
  const APPROX_LBL = { R0: 'R0', latent: 'f_latent', infect: 'f_infect', cfr: 'f_cfr', asym: 'f_asym', pre: 'f_pre', hosp: 'f_hosp', wane: 'f_imm', relAsym: 'f_relasym', prior: 'f_prior' };
  function renderCard() {
    const P = H.P, p = H.Core.data.pathogens[P.pid], K = H.K, f = K.fmt;
    const custom = H.scenId === 'custom';
    const fact = (b, l, w) => `<div class="${w ? 'wide' : ''}"><b>${b}</b><span>${esc(l)}</span></div>`;
    const dd = H.derive;
    const need = Number.isFinite(dd.cover) ? (dd.cover <= 1 ? f(dd.cover * 100, 0) + ' %' : '> 100 %') : '—';
    const wane = p.wane > 0 ? tt('imm_wane', { d: f(p.wane, 0) }) : tt('imm_life');
    const bar = ROUTES.filter(r => p.routes[r] > 0).map(r => `<span class="seg-r" style="flex:${p.routes[r]};background:${RCOL[r]}" title="${esc(tt('route_' + r))} ${pc(p.routes[r])}">${p.routes[r] >= 0.12 ? pc(p.routes[r]) : ''}</span>`).join('');
    const legend = ROUTES.filter(r => p.routes[r] > 0).map(r => `<span><i style="background:${RCOL[r]}"></i>${esc(tt('route_' + r))} ${pc(p.routes[r])}</span>`).join('');
    const routeAria = ROUTES.filter(r => p.routes[r] > 0).map(r => `${tt('route_' + r)} ${pc(p.routes[r])}`).join(', ');
    const apx = (p.approx || []).map(k => tt(APPROX_LBL[k] || k)).join(', ');
    const facts = [
      fact(f(P.R0, 1), tt('f_r0')), fact(range(p.R0.r, v => f(v, 1)), tt('f_range')),
      fact(f(P.latent, 1) + ' d', tt('f_latent')), fact(f(P.infect, 1) + ' d', tt('f_infect')),
      fact(f(P.cfr, P.cfr < 0.1 ? 3 : 2) + ' %', tt('f_cfr_' + p.cfr.kind)), fact(range(p.cfr.r, v => f(v, v < 0.1 ? 3 : 2)) + ' %', tt('f_cfr_range')),
      fact(pc(p.asym), tt('f_asym')), fact(pc(p.pre), tt('f_pre')),
      fact(Number.isFinite(dd.cover) ? need : '—', tt('f_need'))
    ].join('');
    $('#scen-card').innerHTML = `<div class="pc-main">
      <h3>${esc(L(p.name))}${p.hypothetical ? ` <span class="badge warn">${esc(tt('badge_hyp'))}</span>` : ''}${p.updatable ? ` <span class="badge">${esc(tt('badge_upd', { d: p.asOf }))}</span>` : ''}${p.verified === false ? ` <span class="badge warn">${esc(tt('badge_unver'))}</span>` : p.verified === 'approx' ? ` <span class="badge">${esc(tt('badge_approx'))}</span>` : ''}</h3>
      ${custom ? `<p class="muted">${esc(tt('custom_d'))}</p>` : ''}
      <p>${esc(L(p.desc))}</p>
      <div class="how">
        <h4>${esc(tt('how_h'))}</h4>
        <div class="rbar" role="img" aria-label="${esc(tt('routes_aria', { r: routeAria }))}">${bar}</div>
        <div class="rleg">${legend}</div>
        <p>${esc(L(p.transmission))}</p>
        <p class="why"><b>${esc(tt('why_h'))}</b> ${esc(L(p.why))}</p>
        <p class="muted small"><b>${esc(tt('f_imm'))}:</b> ${esc(L(p.immunity))}${p.season ? ` ${esc(tt('seasonal'))}` : ''}</p>
      </div>
      <p class="src"><b>${esc(tt('f_src'))}:</b> ${esc(p.sources.join(' · '))}.</p>
      ${apx ? `<p class="src unver"><b>${esc(tt('unver_h'))}:</b> ${esc(apx)}. ${esc(tt('unver_p'))}</p>` : ''}
      <p class="src">${esc(tt('f_note'))}</p></div>
      <div class="facts">${facts}</div>`;
  }

  /* ---------- medidas ---------- */
  function effAlone(def) {
    const P = H.P, m = { id: def.id, adh: def.def.adh, start: 0, dur: 0 };
    return 1 - H.Core.controlAt(Object.assign({}, P, { sel: [m] }), 0.01).mult;
  }
  function renderMeasures() {
    const D = H.Core.data, P = H.P, path = P.path;
    const cats = D.cats;
    const html = cats.map(c => {
      const list = D.med.filter(m => m.cat === c);
      return `<div class="mcat"><h3>${esc(tt('cat_' + c))}</h3>${list.map(def => {
        const sel = (P.sel || []).find(x => x.id === def.id), on = !!sel, ef = effAlone(def);
        const na = def.case === 'antiviral' && !path.av;
        const cls = na ? 'na' : ef < 0.01 && !def.travel && !def.move && def.case !== 'trace' ? 'none' : '';
        const av = def.case === 'antiviral' && path.av ? ` (${esc(L(path.av.name))})` : '';
        return `<div class="meas ${cls}" data-id="${def.id}">
          <div class="mhead"><label class="check"><input type="checkbox" data-m="${def.id}" ${on ? 'checked' : ''} ${na ? 'disabled' : ''}><span>${esc(L(def.name))}${av}</span></label><span class="eff" data-eff="${def.id}">${effBadge(def, ef, na)}</span></div>
          <p class="muted small">${esc(L(def.desc))}</p>
          <div class="mopts" ${on ? '' : 'hidden'}>
            <label class="mo"><span>${esc(tt('m_adh'))} <output data-o="adh">${sel ? sel.adh : def.def.adh} %</output></span><input type="range" min="10" max="100" step="5" value="${sel ? sel.adh : def.def.adh}" data-madh="${def.id}"></label>
            <label class="mo"><span>${esc(tt('m_start'))}</span><input type="number" min="0" max="1500" step="1" value="${sel ? sel.start : 0}" data-mstart="${def.id}"></label>
            <label class="mo"><span>${esc(tt('m_dur'))}</span><input type="number" min="0" max="1500" step="1" value="${sel ? sel.dur : 0}" data-mdur="${def.id}"></label>
          </div>
          <details><summary>${esc(tt('m_src'))}</summary><p class="small muted">${esc(def.src)}. ${esc(tt('ev_' + def.ev))} · ${esc(tt('cost_l'))}: ${'●'.repeat(def.cost)}${'○'.repeat(5 - def.cost)}</p></details>
        </div>`;
      }).join('')}</div>`;
    }).join('');
    $('#measures').innerHTML = `<div class="mpre row"><span class="muted small">${esc(tt('presets'))}</span>${Object.keys(PRESETS).map(k => `<button type="button" class="btn ghost small" data-preset="${k}">${esc(tt('pre_' + k))}</button>`).join('')}<button type="button" class="btn ghost small" data-preset="none">${esc(tt('pre_none'))}</button></div>
      <div class="msum" id="msum" aria-live="polite"></div><div class="mgrid">${html}</div>`;
    updateMeasureSummary();
  }
  function effBadge(def, ef, na) {
    if (na) return esc(tt('m_na'));
    const parts = [];
    if (def.case === 'trace') parts.push(tt('m_trace'));
    else if (ef >= 0.01) parts.push(tt('m_eff', { v: H.K.fmt(ef * 100, 0) }));
    else if (!def.travel && !def.move) parts.push(tt('m_none'));
    if (def.travel || def.move) parts.push(tt('m_mob'));
    return esc(parts.join(' · '));
  }
  function updateMeasureSummary() {
    const P = H.P, el = $('#msum'); if (!el) return;
    const C = H.Core, sel = P.sel || [];
    const tAt = sel.length ? Math.max(...sel.map(m => +m.start || 0)) + 0.01 : 0;
    const c = C.controlAt(P, tAt), all = c.mult;
    let naive = 1; const eff = C.measureEffects(P);
    for (const m of sel) naive *= 1 - eff[m.id].alone;
    const r0 = P.R0, rAll = r0 * all, rNaive = r0 * naive;
    el.innerHTML = sel.length ? `<div class="msum-grid"><div><b>${H.K.fmt(r0, 2)}</b><span>${esc(tt('ms_r0'))}</span></div><div class="${rAll < 1 ? 'ok' : ''}"><b>${H.K.fmt(rAll, 2)}</b><span>${esc(tt('ms_rall', { d: H.K.fmt(tAt, 0) }))}</span></div><div><b>${H.K.fmt(rNaive, 2)}</b><span>${esc(tt('ms_naive'))}</span></div></div><p class="small muted">${esc(tt('ms_expl', { r: C.RHO }))}</p>${rAll < 1 ? `<p class="small ok">${esc(tt('ms_below'))}</p>` : ''}`
      : `<p class="small muted">${esc(tt('ms_none'))}</p>`;
    // etiquetas de efecto marginal
    for (const m of sel) { const e = $(`[data-eff="${m.id}"]`); if (e) { const def = C.data.measures[m.id]; e.innerHTML = effBadge(def, effAlone(def), false) + (eff[m.id] ? ` <i class="marg" title="${esc(tt('m_marg_t'))}">${esc(tt('m_marg', { v: H.K.fmt(eff[m.id].marginal * 100, 0) }))}</i>` : ''); } }
    for (const def of C.data.med) if (!sel.find(m => m.id === def.id)) { const e = $(`[data-eff="${def.id}"]`); if (e) e.innerHTML = effBadge(def, effAlone(def), def.case === 'antiviral' && !P.path.av); }
  }

  /* ---------- vacunas ---------- */
  const fv = (x, ap) => (ap ? '≈ ' : '') + H.K.fmt(x * 100, 0) + ' %';
  function renderVaccines() {
    const P = H.P, C = H.Core, list = C.vaccinesFor(P.pid);
    const el = $('#vaccines');
    if (!list.length) { el.innerHTML = `<p class="muted">${esc(tt('v_none'))}</p>`; return; }
    const rows = list.map(v => {
      const e = v.ve[P.pid] || v.ve['*'], on = (P.vsel || []).includes(v.id), ap = new Set(e.approx || []);
      const adj = v.adjustable;
      return `<div class="vac" data-id="${v.id}"><label class="check"><input type="checkbox" data-v="${v.id}" ${on ? 'checked' : ''}><span>${esc(L(v.name))}</span></label>
        <div class="vstats">${adj ? `<span class="chip">${esc(tt('v_eff'))}: <b data-hyp>${P.hypEff} %</b></span>` : `<span class="chip" title="${esc(tt('v_inf_t'))}">${esc(tt('v_inf'))} <b>${fv(e.inf, ap.has('inf'))}</b></span><span class="chip" title="${esc(tt('v_dis_t'))}">${esc(tt('v_dis'))} <b>${fv(e.dis, ap.has('dis'))}</b></span><span class="chip" title="${esc(tt('v_sev_t'))}">${esc(tt('v_sev'))} <b>${fv(e.sev, ap.has('sev'))}</b></span>`}
          <span class="chip">${esc(tt('v_wane'))} <b>${e.half > 0 ? tt('v_half', { d: H.K.fmt(e.half, 0) }) : tt('v_nowane')}${ap.has('half') ? ' ≈' : ''}</b></span><span class="chip">${esc(tt('v_doses', { n: v.doses }))}</span></div>
        <p class="muted small">${esc(L(v.platform))}. ${esc(L(v.note))}</p>
        ${adj ? `<label class="mo hyp" ${on ? '' : 'hidden'}><span>${esc(tt('v_eff'))} <output>${P.hypEff} %</output></span><input type="range" min="10" max="100" step="5" value="${P.hypEff}" data-hyp></label>` : ''}
        <details><summary>${esc(tt('m_src'))}</summary><ul class="small muted">${v.src.map(s => `<li>${esc(s)}</li>`).join('')}</ul>${e.range ? `<p class="small muted">${esc(tt('v_range'))}: ${range(e.range, v => H.K.fmt(v * 100, 0))} %</p>` : ''}${ap.size ? `<p class="small unver">${esc(tt('unver_h'))}: ${esc([...ap].map(k => tt('v_f_' + k)).join(', '))}</p>` : ''}</details></div>`;
    }).join('');
    const mean = C.veMean(P);
    el.innerHTML = `<div class="vctl">
      <label class="mo"><span>${esc(tt('c_vacc'))} <output id="o-vacc">${H.K.fmt(P.vacc, 0)} %</output></span><input type="range" min="0" max="100" step="1" value="${P.vacc}" data-vk="vacc" class="vr"></label>
      <label class="mo"><span>${esc(tt('c_vrate'))}</span><select data-vk="vrate">${[0, 1, 2, 5, 10, 25].map(v => `<option value="${v}" ${+P.vrate === v ? 'selected' : ''}>${v === 0 ? esc(tt('vrate0')) : esc(tt('vrate_n', { v }))}</option>`).join('')}</select></label>
      <label class="mo"><span>${esc(tt('c_vstart'))}</span><input type="number" min="0" max="1500" step="1" value="${P.vstart}" data-vk="vstart"></label></div>
      <p class="small muted" id="vinfo"></p>
      <div class="vlist">${rows}</div>
      <p class="small muted">${esc(tt('v_model'))}</p>`;
    updateVaxInfo();
  }
  function updateVaxInfo() {
    const el = $('#vinfo'); if (!el) return;
    const P = H.P, d = H.derive, C = H.Core, vl = C.vaxList(P);
    if (!vl.length) { el.textContent = tt('v_pick'); return; }
    const cov = Number.isFinite(d.cover) ? (d.cover <= 1 ? H.K.fmt(d.cover * 100, 0) + ' %' : '> 100 %') : '—';
    el.innerHTML = esc(tt('v_info', { p: H.K.fmt(d.prot * 100, 0), c: cov, v: H.K.fmt(d.ve * 100, 0) }));
  }

  /* ---------- mapa: origen, movilidad, ranking ---------- */
  function renderMapSide() {
    const el = $('#map-side'), P = H.P;
    if (!H.isMap()) { el.hidden = true; return; }
    el.hidden = false;
    const geo = H.geoCache[P.place]; if (!geo) return;
    const opts = geo.features.slice().sort((a, b) => L(a.n).localeCompare(L(b.n), H.K.lang)).map(f => `<option value="${f.id}" ${f.id === P.origin ? 'selected' : ''}>${esc(L(f.n))}</option>`).join('');
    const showAir = geo.features.length > 12;
    el.innerHTML = `<div class="mside-grid">
      <label class="mo"><span>${esc(tt('c_origin'))}</span><select id="sel-origin">${opts}</select></label>
      <label class="mo"><span>${esc(tt('c_mob'))} <output id="o-mob">${H.K.fmt(P.mob * 100, 1)} %</output></span><input type="range" min="0" max="40" step="0.5" value="${P.mob * 100}" data-mk="mob"></label>
      ${showAir ? `<label class="mo"><span>${esc(tt('c_air'))} <output id="o-air">${H.K.fmt(P.air * 100, 1)} %</output></span><input type="range" min="0" max="10" step="0.1" value="${P.air * 100}" data-mk="air"></label>` : ''}
      <label class="mo"><span>${esc(tt('c_gamma'))} <output id="o-gamma">${H.K.fmt(P.gamma, 1)}</output></span><input type="range" min="0.5" max="3" step="0.1" value="${P.gamma}" data-mk="gamma"></label>
      <label class="mo"><span>${esc(tt('c_mseeds'))} <output id="o-mseeds">${H.K.fmt(P.mseeds, 0)}</output></span><input type="range" min="1" max="1000" step="1" value="${P.mseeds}" data-mk="mseeds"></label></div>
      <p class="small muted">${esc(tt('mob_help'))}</p><div id="rank"></div>`;
    updateRank();
  }
  function updateRank() {
    const el = $('#rank'), s = H.sim; if (!el || !H.isMap() || !s.territory) return;
    const rows = []; for (let i = 0; i < s.n; i++) rows.push(s.territory(i));
    rows.sort((a, b) => b.cum / b.pop - a.cum / a.pop);
    const top = rows.slice(0, 7), geo = H.geoCache[H.P.place], sc = 1;
    el.innerHTML = `<h4>${esc(tt('rank_h', { r: s.reached(), n: s.n }))}</h4><table class="rank"><thead><tr><th>${esc(tt('rk_ter'))}</th><th>${esc(tt('rk_pop'))}</th><th>${esc(tt('rk_att'))}</th><th>${esc(tt('rk_first'))}</th><th>${esc(tt('rk_dead'))}</th></tr></thead><tbody>${top.map(r => `<tr><td>${esc(L(geo.features[r.i].n))}</td><td>${H.fmtN(r.pop)}</td><td>${H.K.fmt(r.cum / r.pop * 100, 1)} %</td><td>${r.first >= 0 ? H.K.fmt(r.first, 0) : '—'}</td><td>${H.fmtN(r.D)}</td></tr>`).join('')}</tbody></table>`;
  }

  /* ---------- créditos ---------- */
  function renderCredits() {
    const el = $('#credits'), cr = H.Core.data.credits; if (!el) return;
    if (!cr) { el.innerHTML = `<p class="muted">${esc(tt('cr_wait'))}</p>`; return; }
    const rows = cr.layers.map(l => `<tr><td><b>${esc(L(l.name))}</b><br><span class="small muted">${esc(l.file)}</span></td><td>${esc(l.source)}${l.url ? ` <a href="${esc(l.url)}" rel="noopener" target="_blank">↗</a>` : ''}</td><td>${esc(l.license)}</td><td>${esc(l.year)}</td><td>${esc(l.popSource || '')} ${l.popYear ? `(${esc(l.popYear)})` : ''}${l.verified === false ? ` <span class="badge warn">${esc(tt('badge_unver'))}</span>` : ''}<br><span class="small muted">${esc(L(l.notes) || '')}</span></td></tr>`).join('');
    el.innerHTML = `<p class="muted">${esc(tt('cr_p'))}</p><div class="tablewrap"><table class="rank cr"><thead><tr><th>${esc(tt('cr_layer'))}</th><th>${esc(tt('cr_source'))}</th><th>${esc(tt('cr_lic'))}</th><th>${esc(tt('cr_year'))}</th><th>${esc(tt('cr_pop'))}</th></tr></thead><tbody>${rows}</tbody></table></div><p class="small muted">${esc(tt('cr_foot'))}</p>`;
  }

  /* ---------- eventos ---------- */
  function wire() {
    $('#place-chips').addEventListener('click', e => { const b = e.target.closest('[data-place]'); if (b) H.setPlace(b.dataset.place); });
    $('#scen-chips').addEventListener('click', e => { const b = e.target.closest('[data-scen]'); if (b) H.pickScenario(b.dataset.scen); });
    const M = $('#measures');
    M.addEventListener('change', e => {
      const id = e.target.dataset.m; if (!id) return;
      const P = H.P, def = H.Core.data.measures[id];
      if (e.target.checked) P.sel = (P.sel || []).concat([{ id, adh: def.def.adh, start: 0, dur: 0 }]); else P.sel = (P.sel || []).filter(m => m.id !== id);
      e.target.closest('.meas').querySelector('.mopts').hidden = !e.target.checked;
      H.measuresChanged();
    });
    M.addEventListener('input', e => {
      const d = e.target.dataset; const P = H.P;
      const id = d.madh || d.mstart || d.mdur; if (!id) return;
      const m = (P.sel || []).find(x => x.id === id); if (!m) return;
      if (d.madh) { m.adh = +e.target.value; e.target.closest('.mo').querySelector('output').textContent = m.adh + ' %'; }
      if (d.mstart) m.start = Math.max(0, +e.target.value || 0);
      if (d.mdur) m.dur = Math.max(0, +e.target.value || 0);
      H.measuresChanged();
    });
    M.addEventListener('click', e => {
      const b = e.target.closest('[data-preset]'); if (!b) return;
      const P = H.P, k = b.dataset.preset, C = H.Core;
      P.sel = k === 'none' ? [] : PRESETS[k].filter(id => !(C.data.measures[id].case === 'antiviral' && !P.path.av)).map(id => ({ id, adh: C.data.measures[id].def.adh, start: 0, dur: 0 }));
      renderMeasures(); H.measuresChanged();
    });
    const V = $('#vaccines');
    V.addEventListener('change', e => {
      const P = H.P, d = e.target.dataset;
      if (d.v) { const s = new Set(P.vsel || []); e.target.checked ? s.add(d.v) : s.delete(d.v); P.vsel = [...s]; if (e.target.checked && !(P.vacc > 0)) P.vacc = 70; const h = e.target.closest('.vac').querySelector('.hyp'); if (h) h.hidden = !e.target.checked; H.vaccinesChanged(true); }
      else if (d.vk === 'vrate' || d.vk === 'vstart') { P[d.vk] = +e.target.value || 0; H.vaccinesChanged(false); }
    });
    V.addEventListener('input', e => {
      const P = H.P, d = e.target.dataset;
      if (d.vk === 'vacc') { P.vacc = +e.target.value; $('#o-vacc').textContent = H.K.fmt(P.vacc, 0) + ' %'; H.vaccinesChanged(false); }
      else if ('hyp' in d) { P.hypEff = +e.target.value; e.target.closest('.hyp').querySelector('output').textContent = P.hypEff + ' %'; const b = V.querySelector('b[data-hyp]'); if (b) b.textContent = P.hypEff + ' %'; H.vaccinesChanged(false); }
    });
    $('#map-side').addEventListener('input', e => {
      const k = e.target.dataset.mk; if (!k) return; const P = H.P, v = +e.target.value;
      if (k === 'mob' || k === 'air') { P[k] = v / 100; $('#o-' + k).textContent = H.K.fmt(v, 1) + ' %'; H.mapParamChanged(k, false); }
      else if (k === 'gamma') { P.gamma = v; $('#o-gamma').textContent = H.K.fmt(v, 1); H.mapParamChanged(k, true); }
      else if (k === 'mseeds') { P.mseeds = v; $('#o-mseeds').textContent = H.K.fmt(v, 0); H.mapParamChanged(k, true); }
    });
    $('#map-side').addEventListener('change', e => { if (e.target.id === 'sel-origin') H.setOrigin(e.target.value); });
  }

  const api = {
    init(host) { H = host; wire(); },
    renderAll() { renderPlaces(); renderPathogens(); renderMeasures(); renderVaccines(); renderMapSide(); renderCredits(); },
    renderPlaces, renderPathogens, renderCard, renderMeasures, renderVaccines, renderMapSide, renderCredits,
    updateMeasureSummary, updateVaxInfo, updateRank
  };
  root.EpiPanels = api;
})(window);
