/* ============================================================
   Lógica de la web: navegación, carga de datos y portada animada.
   No necesitas tocar este archivo para añadir contenidos.
   ============================================================ */
(() => {
  'use strict';
  const C = window.CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');

  /* ---------- utilidades ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const url = u => (/^\s*(javascript|data|vbscript):/i.test(u || '') ? '#' : esc(u || '#'));
  const ext = u => /^https?:\/\//i.test(u || '') ? ' target="_blank" rel="noopener"' : '';

  /* ---------- idioma (es / ca) ---------- */
  const TX = window.I18N || { es: {} };
  const IDIOMAS = ['es', 'ca', 'en'];
  const LOCALES = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };
  const delNavegador = () => { const n = (navigator.language || '').toLowerCase().slice(0, 2); return IDIOMAS.includes(n) ? n : 'es'; };
  let lang = delNavegador();
  try {
    const guardado = localStorage.getItem('lang');
    if (IDIOMAS.includes(guardado)) lang = guardado;
  } catch (_) { /* sin almacenamiento: se usa el idioma del navegador */ }
  // Texto de la interfaz: t('clave'). Si falta en el idioma activo, se usa el castellano.
  const t = k => (k in TX[lang] ? TX[lang][k] : TX.es[k]);
  // Campo de los datos: L(obj, 'titulo') devuelve obj.titulo_ca / obj.titulo_en según el idioma, o obj.titulo si no existe la traducción.
  const L = (o, k) => {
    if (!o) return undefined;
    if (lang !== 'es') { const v = o[`${k}_${lang}`]; if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) return v; }
    return o[k];
  };
  const tipoLabel = x => t('types')[(x || '').toLowerCase()] || (x ? x.charAt(0).toUpperCase() + x.slice(1) : '');
  function fecha(f) {
    if (!f) return '';
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(f)) {
      const d = new Date(f.length === 7 ? f + '-01T00:00:00' : f + 'T00:00:00');
      return d.toLocaleDateString(LOCALES[lang],f.length === 7 ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return f;
  }

  /* ---------- carga de datos (JSON local o Google Sheets) ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = []; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    if (!rows.length) return [];
    const keys = rows[0].map(h => h.trim().toLowerCase());
    return rows.slice(1).filter(r => r.some(c => c.trim() !== ''))
      .map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()])));
  }

  const cache = {};
  async function getJSON(name) {
    const r = await fetch(`data/${name}.json`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${name}.json: ${r.status}`);
    return r.json();
  }
  async function data(name) {
    if (name in cache) return cache[name];
    let out = null;
    const sheet = C.hojas && C.hojas[name];
    try {
      if (sheet) {
        try {
          const r = await fetch(sheet);
          if (!r.ok) throw new Error(r.status);
          out = parseCSV(await r.text());
        } catch (e) { console.warn('Hoja de Google no disponible, uso data/' + name + '.json', e); out = await getJSON(name); }
      } else out = await getJSON(name);
    } catch (e) { console.error('Error cargando', name, e); out = null; }
    if (Array.isArray(out) && C.invertir && C.invertir[name]) out = out.slice().reverse();
    return (cache[name] = out);
  }
  const errorBox = () => `<div class="empty error">${esc(t('dataError'))}</div>`;

  /* ---------- piezas comunes ---------- */
  const socials = () => (C.redes || []).map(r =>
    `<a class="soc" href="${url(r.url)}" target="_blank" rel="me noopener" aria-label="${esc(r.nombre)}" title="${esc(r.nombre)}"><i class="${esc(r.icono)}" aria-hidden="true"></i></a>`).join('');
  const pageHead = (title, lead) => `<section class="page-head"><div class="wrap"><h1>${title}</h1>${lead ? `<p>${lead}</p>` : ''}</div></section>`;
  const card = c => {
    const inner = `${c.icono ? `<div class="ico"><i class="${esc(c.icono)}" aria-hidden="true"></i></div>` : ''}
      <h3>${esc(L(c, 'titulo'))}</h3>${L(c, 'descripcion') ? `<p>${esc(L(c, 'descripcion'))}</p>` : ''}${c.enlace ? `<span class="more">${esc(t('seeMore'))}</span>` : ''}`;
    return c.enlace ? `<a class="card reveal" href="${url(c.enlace)}"${ext(c.enlace)}>${inner}</a>` : `<div class="card reveal">${inner}</div>`;
  };
  const IMG_DEFECTO = 'assets/divulgacion-defecto.svg'; // se usa si una entrada no tiene imagen o falla al cargar
  const entryCard = e => `
    <article class="card entry reveal" data-tipo="${esc((e.tipo || '').toLowerCase())}">
      <img class="thumb" loading="lazy" referrerpolicy="no-referrer" src="${e.imagen ? url(e.imagen) : IMG_DEFECTO}" alt="" onerror="this.onerror=null;this.src='${IMG_DEFECTO}'">
      <div class="meta">${e.tipo ? `<span class="badge">${esc(tipoLabel(e.tipo))}</span>` : ''}
        ${(e.medio || e.fecha) ? `<span class="src">${esc([e.medio, fecha(e.fecha)].filter(Boolean).join(' · '))}</span>` : ''}</div>
      <h3>${esc(L(e, 'titulo'))}</h3>
      ${L(e, 'resumen') ? `<p>${esc(L(e, 'resumen'))}</p>` : ''}
      ${e.audio ? `<audio controls preload="none" src="${url(e.audio)}"></audio>` : ''}
      ${e.enlace ? `<a class="more" href="${url(e.enlace)}"${ext(e.enlace)}>${esc(t('readListen'))}</a>` : ''}
    </article>`;

  /* ---------- páginas ---------- */
  const pages = {};

  pages.inicio = async () => {
    const [div] = await Promise.all([data('divulgacion')]);
    const ultimas = Array.isArray(div) ? div.slice(0, 3) : [];
    // Tarjeta de acceso con banner: foto si existe (si no carga, queda el degradado de debajo)
    const tile = (icono, clave, enlace, g1, g2, foto) => `
      <a class="card tile reveal" href="${url(enlace)}"${ext(enlace)}>
        <div class="tile-img" style="--g1:${g1};--g2:${g2}">
          <i class="big ${esc(icono)}" aria-hidden="true"></i>
          ${foto ? `<img loading="lazy" referrerpolicy="no-referrer" src="${url(foto)}" alt="" onerror="this.remove()">` : ''}
          <div class="ico"><i class="${esc(icono)}" aria-hidden="true"></i></div>
        </div>
        <div class="tile-body">
          <h3>${esc(t(`nav.${clave}`))}</h3><p>${esc(t('access')[clave])}</p>
          <span class="more">${esc(t('seeMore'))}</span>
        </div>
      </a>`;
    const accesos = [
      tile('fa-solid fa-chalkboard-user', 'docencia', 'https://campus.luisfs.com', '#1c3a5c', '#3b6ea5'),
      tile('fa-solid fa-laptop-code', 'aplicaciones', '#/aplicaciones', '#36005a', '#8f63c9'),
      tile('fa-solid fa-dna', 'investigacion', '#/investigacion', '#0d1a2a', '#3b6ea5', 'assets/investigacion.jpg'),
      tile('fa-solid fa-microphone-lines', 'divulgacion', '#/divulgacion', '#36005a', '#3b6ea5', ultimas[0] && ultimas[0].imagen),
      tile('fa-solid fa-camera-retro', 'fotografia', '#/fotografia', '#0d1a2a', '#5a2d86'),
      tile('fa-solid fa-hand-holding-heart', 'solidaridad', '#/solidaridad', '#1c3a5c', '#b08be0', 'assets/solidaridad.jpg')
    ];
    return `
    <section class="hero" id="hero">
      <div class="hero-photo" aria-hidden="true"></div>
      <canvas id="net" aria-hidden="true"></canvas>
      <div class="hero-content">
        <span class="eyebrow">${esc(C.nombre || 'Luis Franco Serrano')}</span>
        <h1>${t('heroTitle')}</h1>
        <p class="lead">${esc(t('heroLead'))}</p>
        <div class="pills">${t('pills').map(p => `<span>${esc(p)}</span>`).join('')}</div>
        <div class="cta"><a class="btn btn-primary" href="#/sobre-mi">${esc(t('meet'))}</a><a class="btn btn-ghost" href="#/investigacion">${esc(t('seeResearch'))}</a></div>
      </div>
      <div class="hero-social"><div class="socials">${socials()}</div></div>
    </section>

    <section class="section"><div class="wrap">
      <span class="kicker">${esc(t('explore'))}</span><h2>${esc(t('whatHere'))}</h2>
      <div class="grid" style="margin-top:24px">${accesos.join('')}</div>
    </div></section>

    ${ultimas.length ? `<section class="section alt"><div class="wrap">
      <span class="kicker">${esc(t('news'))}</span><h2>${esc(t('latest'))}</h2>
      <div class="grid" style="margin-top:24px">${ultimas.map(entryCard).join('')}</div>
      <p style="margin-top:28px"><a class="btn btn-dark" href="#/divulgacion">${esc(t('seeAllDiv'))}</a></p>
    </div></section>` : ''}`;
  };

  pages['sobre-mi'] = async () => {
    const a = await data('sobre-mi');
    if (!a || Array.isArray(a)) return pageHead(esc(t('nav.sobre-mi'))) + `<section class="section"><div class="wrap">${errorBox()}</div></section>`;
    const parrafos = [].concat(L(a, 'parrafos') || []);
    const cifras = Array.isArray(a.cifras) ? a.cifras : [];
    return `
    ${pageHead(esc(t('nav.sobre-mi')), esc(L(a, 'subtitulo') || ''))}
    <section class="section"><div class="wrap">
      <div class="about-grid">
        <div class="portrait-wrap reveal"><img class="portrait" src="assets/foto-perfil.jpg?v=5" alt="${esc(C.nombre)}" onerror="this.closest('.portrait-wrap').remove()"></div>
        <div class="about-text reveal">
          ${L(a, 'titulo') ? `<h2>${esc(L(a, 'titulo'))}</h2>` : ''}
          ${parrafos.map(p => `<p>${esc(p)}</p>`).join('')}
        </div>
      </div>
      ${cifras.length ? `<div class="stats reveal">${cifras.map(c => `<div class="stat"><b>${esc(c.valor)}</b><span>${esc(L(c, 'texto'))}</span></div>`).join('')}</div>` : ''}
    </div></section>`;
  };

  /* Docencia: cada asignatura/curso tiene su propia página (#/docencia/<bloque>/<id>).
     El <id> sale del título (sin tildes ni espacios) o de un campo "id" opcional. */
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const idDe = a => a.id || slug(a.titulo);
  const BLOQUES = [
    { id: 'universitaria', clave: 'universitaria' },
    { id: 'formacion-profesional', clave: 'formacionProfesional' },
    { id: 'formacion-continuada', clave: 'formacionContinuada' }
  ];
  const bloqueTx = b => t('blocks')[b.id];
  let extraTitle = '';

  const asignatura = (b, a) => {
    extraTitle = L(a, 'titulo');
    const parrafos = [].concat(L(a, 'texto') || []);
    const temas = [].concat(L(a, 'temas') || []);
    const recursos = Array.isArray(a.recursos) ? a.recursos : [];
    const vacio = !L(a, 'descripcion') && !parrafos.length && !temas.length && !recursos.length;
    return `${pageHead(esc(L(a, 'titulo')), `${esc(t('teaching'))} · ${esc(bloqueTx(b).titulo)}`)}
      <section class="section"><div class="wrap subject">
        <a class="back" href="#/docencia/${b.id}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ${esc(t('backTo')(bloqueTx(b).titulo))}</a>
        ${L(a, 'descripcion') ? `<p class="lead-text reveal">${esc(L(a, 'descripcion'))}</p>` : ''}
        ${parrafos.map(p => `<p class="reveal">${esc(p)}</p>`).join('')}
        ${temas.length ? `<h2 class="reveal">${esc(t('syllabus'))}</h2><ul class="topics reveal">${temas.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${recursos.length ? `<h2 class="reveal">${esc(t('resources'))}</h2><ul class="resources">${recursos.map(r => `<li class="reveal"><a href="${url(r.enlace)}"${ext(r.enlace)}><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${esc(L(r, 'titulo') || r.enlace)}</a></li>`).join('')}</ul>` : ''}
        ${vacio ? `<div class="empty">${esc(t('soonContent'))}</div>` : ''}
      </div></section>`;
  };

  pages.docencia = async (sub, sub2) => {
    const d = await data('docencia');
    if (!d || Array.isArray(d)) return pageHead(esc(t('teaching'))) + `<section class="section"><div class="wrap">${errorBox()}</div></section>`;
    if (sub2) {
      const b = BLOQUES.find(x => x.id === sub);
      const a = b && (d[b.clave] || []).find(x => idDe(x) === sub2);
      if (a) return asignatura(b, a);
    }
    const bloque = b => {
      const lista = (d[b.clave] || []).map(a => ({ ...a, enlace: a.enlace || `#/docencia/${b.id}/${idDe(a)}` }));
      const tx = bloqueTx(b);
      return `
      <div class="teach-block" id="${b.id}">
        <span class="kicker">${esc(t('teaching'))}</span><h2>${esc(tx.titulo)}</h2>
        ${tx.lead ? `<p class="lead-text">${esc(tx.lead)}</p>` : ''}
        ${lista.length ? `<div class="grid">${lista.map(card).join('')}</div>` : `<div class="empty" style="margin-top:24px">${esc(t('soon'))}</div>`}
      </div>`;
    };
    return `${pageHead(esc(t('teaching')), esc(t('teachingLead')))}
      <section class="section"><div class="wrap">
        ${BLOQUES.map(bloque).join('')}
      </div></section>`;
  };

  pages.aplicaciones = async () => {
    const list = await data('aplicaciones');
    return `${pageHead(esc(t('nav.aplicaciones')))}
      <section class="section"><div class="wrap">
        ${list === null ? errorBox() : list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty">${esc(t('soon'))}</div>`}
      </div></section>`;
  };

  pages.investigacion = async () => {
    const [inv, pubs] = await Promise.all([data('investigacion'), data('publicaciones')]);
    if (!inv || Array.isArray(inv)) return pageHead(esc(t('nav.investigacion'))) + `<section class="section"><div class="wrap">${errorBox()}</div></section>`;
    const lista = Array.isArray(pubs) ? pubs : [];
    const lineas = Array.isArray(inv.lineas) ? inv.lineas : [];
    const centros = Array.isArray(inv.centros) ? inv.centros : [];
    const rango = ys => (ys.length ? (Math.min(...ys) === Math.max(...ys) ? String(ys[0]) : `${Math.min(...ys)}–${Math.max(...ys)}`) : '');
    const anios = lista.map(p => parseInt(p.anio, 10)).filter(Boolean);
    const stats = [[lista.length, 'statPubs'], [rango(anios), 'statSpan'], [centros.length, 'statCenters']].filter(s => s[0]);
    const palabras = [].concat(L(inv, 'palabras') || []);
    const a = inv.actual;

    const hero = `
      <section class="res-hero">
        <div class="res-hero-img" aria-hidden="true"></div>
        <div class="wrap res-hero-in">
          <span class="eyebrow">${esc(t('nav.investigacion'))}</span>
          <h1>${esc(t('resTitle'))}</h1>
          <p class="lead">${esc(L(inv, 'intro'))}</p>
          ${palabras.length ? `<div class="res-kw">${palabras.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}
          ${stats.length ? `<div class="res-stats">${stats.map(([v, k]) => `<div><b>${esc(v)}</b><span>${esc(t(k))}</span></div>`).join('')}</div>` : ''}
        </div>
      </section>`;

    const actual = a ? `
      <section class="section"><div class="wrap">
        <span class="kicker">${esc(t('currentProject'))}</span>
        <article class="feature reveal">
          <div class="feature-body">
            <h2>${esc(L(a, 'titulo'))}</h2>
            ${[].concat(L(a, 'texto') || []).map(p => `<p>${esc(p)}</p>`).join('')}
            ${[].concat(L(a, 'temas') || []).length ? `<div class="feature-tags">${[].concat(L(a, 'temas')).map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
          </div>
          ${a.imagen ? `<figure class="feature-media"><img src="${url(a.imagen)}" alt="${esc(t('researchImgAlt'))}" onerror="this.closest('.feature-media').remove()"></figure>` : ''}
        </article>
      </div></section>` : '';

    const proyecto = (l, i) => {
      const rel = lista.filter(p => p.proyecto && p.proyecto === l.id).sort((x, y) => (parseInt(y.anio, 10) || 0) - (parseInt(x.anio, 10) || 0));
      const periodo = rango(rel.map(p => parseInt(p.anio, 10)).filter(Boolean));
      return `
        <article class="proj card reveal">
          <div class="proj-top">
            <div class="ico"><i class="${esc(l.icono || 'fa-solid fa-flask')}" aria-hidden="true"></i></div>
            ${periodo ? `<span class="period">${esc(periodo)}</span>` : ''}
          </div>
          <h3>${esc(L(l, 'titulo'))}</h3>
          <p>${esc(L(l, 'texto'))}</p>
          ${rel.length ? `<div class="proj-pubs"><small>${esc(t('relatedPubs'))}</small>
            ${rel.map(p => `<a class="pill" href="${url(p.enlace)}"${ext(p.enlace)} title="${esc(p.titulo)}">${esc(p.anio)} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`).join('')}</div>` : ''}
        </article>`;
    };
    const proyectos = lineas.length ? `
      <section class="section alt"><div class="wrap">
        <span class="kicker">${esc(t('projectsKicker'))}</span><h2>${esc(L(inv, 'tituloLineas') || t('linesDefault'))}</h2>
        <div class="grid proj-grid">${lineas.map(proyecto).join('')}</div>
      </div></section>` : '';

    const centrosHtml = centros.length ? `
      <section class="section"><div class="wrap">
        <span class="kicker">${esc(t('centersKicker'))}</span><h2>${esc(L(inv, 'tituloCentros') || '')}</h2>
        <div class="grid centers">${centros.map(c => `
          <a class="card center reveal" href="${url(c.enlace)}"${ext(c.enlace)}>
            <div class="ico"><i class="${esc(c.icono || 'fa-solid fa-building-columns')}" aria-hidden="true"></i></div>
            <span class="tag${c.tipo === 'grupo' ? ' on' : ''}">${esc(t(c.tipo === 'grupo' ? 'myGroup' : 'collab'))}</span>
            <h3>${esc(L(c, 'nombre'))}</h3>
            <p>${esc(L(c, 'descripcion'))}</p>
            <span class="more">${esc(t('visitWeb'))} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
          </a>`).join('')}</div>
      </div></section>` : '';

    return `${hero}${actual}${proyectos}${centrosHtml}
      <section class="section alt"><div class="wrap">
        <span class="kicker">${esc(t('publications'))}</span><h2>${esc(t('production'))}</h2>
        ${pubs === null ? errorBox() : pubs.length ? `<ul class="pubs">${pubs.map(p => `
          <li class="reveal"><a class="pub" href="${url(p.enlace)}"${ext(p.enlace)}>
            <span class="year">${esc(p.anio || '')}</span>
            <span class="t">${esc(p.titulo)}${(p.revista || p.autores) ? `<span class="m">${esc([p.revista, p.autores].filter(Boolean).join(' · '))}</span>` : ''}</span>
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></li>`).join('')}</ul>` : `<div class="empty">${esc(t('soon'))}</div>`}
      </div></section>`;
  };

  pages.divulgacion = async () => {
    const list = await data('divulgacion');
    const tipos = Array.isArray(list) ? [...new Set(list.map(e => (e.tipo || '').toLowerCase()).filter(Boolean))] : [];
    return `${pageHead(esc(t('nav.divulgacion')), esc(t('outreachLead')))}
      <section class="section"><div class="wrap">
        ${list === null ? errorBox() : !list.length ? `<div class="empty">${esc(t('soon'))}</div>` : `
          ${tipos.length > 1 ? `<div class="chips" role="group" aria-label="${esc(t('filterAria'))}">
            <button class="chip" aria-pressed="true" data-f="">${esc(t('all'))}</button>
            ${tipos.map(t => `<button class="chip" aria-pressed="false" data-f="${esc(t)}">${esc(tipoLabel(t))}</button>`).join('')}</div>` : ''}
          <div class="grid" id="entries">${list.map(entryCard).join('')}</div>`}
      </div></section>`;
  };

  pages.fotografia = async () => {
    const list = await data('fotos');
    return `${pageHead(esc(t('nav.fotografia')), esc(t('photoLead')))}
      <section class="section"><div class="wrap">
        ${list === null ? errorBox() : !list.length ? `<div class="empty">${esc(t('soon'))}</div>` : `<div class="photos">${list.map(f => `
          <figure class="photo reveal">
            <img loading="lazy" src="${url(f.src)}" alt="${esc(L(f, 'alt') || L(f, 'titulo') || L(f, 'frase') || t('photoAlt'))}">
            <figcaption>${L(f, 'titulo') ? `<h3>${esc(L(f, 'titulo'))}</h3>` : ''}${L(f, 'frase') ? `<p>${esc(L(f, 'frase'))}</p>` : ''}${(f.lugar || f.fecha) ? `<small>${esc([L(f, 'lugar'), fecha(f.fecha)].filter(Boolean).join(' · '))}</small>` : ''}</figcaption>
          </figure>`).join('')}</div>`}
      </div></section>`;
  };

  pages.solidaridad = async () => {
    const o = C.ong || {};
    const nom = o.nombre || 'Bhai Nepal';
    return `${pageHead(esc(t('nav.solidaridad')), esc(t('ngo')(nom)))}
      <section class="section"><div class="wrap">
        <div class="split">
          <div class="reveal">
            <span class="kicker">${esc(t('solidarityKicker'))}</span>
            <h2>${esc(nom)}</h2>
            <p class="lead-text">${esc(t('solidarityText')(nom))}</p>
            <p><a class="btn btn-primary" href="${url(o.url)}"${ext(o.url)}>${esc(t('visitNgo'))} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></p>
          </div>
          <div class="card reveal"><div class="ico"><i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i></div>
            <h3>${esc(t('allInfo'))}</h3><p>${esc(t('allInfoText'))}</p></div>
        </div>
        <figure class="wide-photo reveal"><img loading="lazy" src="assets/solidaridad.jpg" alt="${esc(t('solidarityImgAlt'))}" onerror="this.closest('.wide-photo').remove()"></figure>
      </div></section>`;
  };

  pages.contacto = async () => `
    ${pageHead(esc(t('nav.contacto')), esc(t('contactLead')))}
    <section class="section"><div class="wrap"><div class="split">
      <div class="reveal">
        <h2>${esc(t('social'))}</h2>
        <p class="lead-text">${esc(t('contactText'))}</p>
        <div class="socials">${socials()}</div>
      </div>
      <form class="form reveal" id="contact" novalidate>
        <h2>${esc(t('formTitle'))}</h2>
        <label>${esc(t('fName'))}<input name="nombre" required autocomplete="name"></label>
        <label>${esc(t('fEmail'))}<input name="email" type="email" required autocomplete="email"></label>
        <label>${esc(t('fMsg'))}<textarea name="mensaje" required></textarea></label>
        <input class="hp" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">
        ${C.web3formsKey ? `<div class="h-captcha" data-captcha="true"></div>` : ''}
        <button class="btn btn-primary" type="submit">${esc(t('send'))}</button>
        <p class="form-msg" id="form-msg" role="status"></p>
      </form>
    </div></div></section>`;

  /* ---------- comportamientos tras pintar cada página ---------- */
  let cleanup = null;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  const observeReveals = () => $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  function initHero() {
    const hero = $('#hero'), cv = $('#net'); if (!hero || !cv) return;
    const ctx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, nodes = [], raf = 0, running = true, mouse = { x: -999, y: -999 };

    // Imagen de portada propia (opcional): assets/portada.jpg
    const img = new Image();
    img.onload = () => { $('.hero-photo', hero).style.backgroundImage = `url(${img.src})`; hero.classList.add('has-photo'); };
    img.src = 'assets/portada.jpg';

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, Math.max(28, w * h / 15000)));
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h * .72, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() * 1.8 + 1, warm: Math.random() < .18 }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const a of nodes) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h * .74) a.vy *= -1;
        const dx = a.x - mouse.x, dy = a.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 130 && d > 0) { a.x += dx / d * .7; a.y += dy / d * .7; }
      }
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 135) { ctx.strokeStyle = `rgba(150,190,235,${(1 - d / 135) * .38})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const a of nodes) { ctx.fillStyle = a.warm ? 'rgba(176,139,224,.95)' : 'rgba(210,240,242,.85)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill(); }
      if (running && !reduce) raf = requestAnimationFrame(frame);
    }
    const onMove = e => {
      const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      const px = (e.clientX / innerWidth - .5);
      $$('.mountains path', hero).forEach(p => p.style.transform = `translateX(${px * -Number(p.dataset.d)}px)`);
    };
    const onLeave = () => { mouse = { x: -999, y: -999 }; };
    const onResize = () => { size(); if (reduce) frame(); };
    const vis = new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running && !reduce) { cancelAnimationFrame(raf); frame(); } });
    size(); frame(); vis.observe(hero);
    hero.addEventListener('mousemove', onMove); hero.addEventListener('mouseleave', onLeave); addEventListener('resize', onResize);
    cleanup = () => { cancelAnimationFrame(raf); vis.disconnect(); removeEventListener('resize', onResize); };
  }

  function initDivulgacion() {
    const box = $('#entries'); if (!box) return;
    $$('.chip').forEach(ch => ch.addEventListener('click', () => {
      $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === ch)));
      $$('.entry', box).forEach(e => { e.style.display = (!ch.dataset.f || e.dataset.tipo === ch.dataset.f) ? '' : 'none'; });
    }));
  }

  function initContact() {
    const f = $('#contact'); if (!f) return;
    const msg = $('#form-msg');
    // Web3Forms: el script de su captcha (hCaptcha) se vuelve a cargar cada vez para que pinte la casilla
    if (C.web3formsKey) {
      $$('script[data-w3f]').forEach(s => s.remove());
      const s = document.createElement('script');
      s.src = 'https://web3forms.com/client/script.js'; s.async = true; s.defer = true; s.dataset.w3f = '1';
      document.body.appendChild(s);
    }
    f.addEventListener('submit', async ev => {
      ev.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      if (d.web) return; // anti-spam
      if (!d.nombre || !d.email || !d.mensaje || !/^\S+@\S+\.\S+$/.test(d.email)) { msg.textContent = t('fCheck'); return; }
      if (C.web3formsKey) {
        if (!d['h-captcha-response']) { msg.textContent = t('fCaptcha'); return; }
        msg.textContent = t('fSending');
        try {
          const fd = new FormData();
          fd.append('access_key', C.web3formsKey);
          fd.append('subject', 'Contacto desde luisfs.com');
          fd.append('from_name', 'Web luisfs.com');
          fd.append('name', d.nombre);
          fd.append('email', d.email);
          fd.append('message', d.mensaje);
          fd.append('h-captcha-response', d['h-captcha-response']);
          const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || j.success === false) throw new Error(j.message || r.status);
          f.reset(); if (window.hcaptcha) try { window.hcaptcha.reset(); } catch (_) {}
          msg.textContent = t('fOk');
        } catch (e) { console.error(e); msg.textContent = t('fFail'); }
      } else if (C.formEndpoint) {
        msg.textContent = t('fSending');
        try {
          const r = await fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ nombre: d.nombre, email: d.email, mensaje: d.mensaje }) });
          if (!r.ok) throw new Error(r.status);
          f.reset(); msg.textContent = t('fOk');
        } catch (e) { msg.textContent = t('fFail'); }
      } else if (!C.email) {
        msg.textContent = t('fOff');
      } else {
        const body = `${d.mensaje}\n\n— ${d.nombre} (${d.email})`;
        location.href = `mailto:${C.email}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(body)}`;
        msg.textContent = t('fMail');
      }
    });
  }

  /* ---------- router ---------- */
  const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');

  // Pinta en el idioma activo los textos fijos de index.html (menú, pie, selector) y las etiquetas <meta>
  function applyStatic() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('#lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    const meta = (sel, v) => { const m = $(sel); if (m) m.setAttribute('content', v); };
    meta('meta[name="description"]', t('siteDesc')); meta('meta[property="og:description"]', t('ogDesc'));
  }
  function setLang(l) {
    if (!IDIOMAS.includes(l) || l === lang) return;
    lang = l;
    try { localStorage.setItem('lang', l); } catch (_) { /* sin almacenamiento */ }
    applyStatic();
    $('#footer-social').innerHTML = socials();
    render(true);
  }
  $$('#lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  let route = 'inicio';
  const setNav = () => nav.classList.toggle('solid', route !== 'inicio' || scrollY > 40);
  addEventListener('scroll', setNav, { passive: true });
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : '';
  });

  let token = 0;
  async function render(mantenerScroll) {
    const [p, sub, sub2] = location.hash.replace(/^#\/?/, '').split('/');
    extraTitle = '';
    route = pages[p] ? p : 'inicio';
    const my = ++token;
    if (cleanup) { cleanup(); cleanup = null; }
    menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    $$('#menu a[data-r]').forEach(a => a.classList.toggle('active', a.dataset.r === route));
    document.title = route === 'inicio' ? t('siteTitle') : `${t('nav.' + route)} · Luis Franco Serrano`;
    let html;
    try { html = await pages[route](sub, sub2); } catch (e) { console.error(e); html = pageHead(esc(t('error'))) + `<section class="section"><div class="wrap">${errorBox()}</div></section>`; }
    if (my !== token) return;
    if (extraTitle) document.title = `${extraTitle} · ${t('nav.docencia')} · Luis Franco Serrano`;
    app.innerHTML = html;
    setNav();
    observeReveals();
    if (route === 'inicio') initHero();
    if (route === 'divulgacion') initDivulgacion();
    if (route === 'contacto') initContact();
    const target = route === 'docencia' && sub ? document.getElementById(sub) : null;
    if (mantenerScroll === true) return; // cambio de idioma: se queda donde estaba
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    else window.scrollTo(0, 0);
  }

  applyStatic();
  $('#footer-social').innerHTML = socials();
  $('#year').textContent = new Date().getFullYear();
  addEventListener('hashchange', render);
  render();
})();
