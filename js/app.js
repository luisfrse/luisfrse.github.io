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
  const TIPOS = { articulo: 'Artículo', radio: 'Radio', prensa: 'Prensa', entrevista: 'Entrevista', audio: 'Audio', podcast: 'Podcast', video: 'Vídeo' };
  const tipoLabel = t => TIPOS[(t || '').toLowerCase()] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
  function fecha(f) {
    if (!f) return '';
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(f)) {
      const d = new Date(f.length === 7 ? f + '-01T00:00:00' : f + 'T00:00:00');
      return d.toLocaleDateString('es-ES', f.length === 7 ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: 'long', day: 'numeric' });
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
  const errorBox = () => `<div class="empty error">No se han podido cargar los datos. Si estás abriendo el archivo index.html directamente desde el disco, el navegador lo bloquea: publica la web (ver README) o ábrela con un servidor local.</div>`;

  /* ---------- piezas comunes ---------- */
  const socials = () => (C.redes || []).map(r =>
    `<a class="soc" href="${url(r.url)}" target="_blank" rel="me noopener" aria-label="${esc(r.nombre)}" title="${esc(r.nombre)}"><i class="${esc(r.icono)}" aria-hidden="true"></i></a>`).join('');
  const pageHead = (t, lead) => `<section class="page-head"><div class="wrap"><h1>${t}</h1>${lead ? `<p>${lead}</p>` : ''}</div></section>`;
  const card = c => {
    const inner = `${c.icono ? `<div class="ico"><i class="${esc(c.icono)}" aria-hidden="true"></i></div>` : ''}
      <h3>${esc(c.titulo)}</h3>${c.descripcion ? `<p>${esc(c.descripcion)}</p>` : ''}${c.enlace ? '<span class="more">Ver más →</span>' : ''}`;
    return c.enlace ? `<a class="card reveal" href="${url(c.enlace)}"${ext(c.enlace)}>${inner}</a>` : `<div class="card reveal">${inner}</div>`;
  };
  const IMG_DEFECTO = 'assets/divulgacion-defecto.svg'; // se usa si una entrada no tiene imagen o falla al cargar
  const entryCard = e => `
    <article class="card entry reveal" data-tipo="${esc((e.tipo || '').toLowerCase())}">
      <img class="thumb" loading="lazy" referrerpolicy="no-referrer" src="${e.imagen ? url(e.imagen) : IMG_DEFECTO}" alt="" onerror="this.onerror=null;this.src='${IMG_DEFECTO}'">
      <div class="meta">${e.tipo ? `<span class="badge">${esc(tipoLabel(e.tipo))}</span>` : ''}
        ${e.medio ? `<span class="src">${esc(e.medio)}</span>` : ''}${e.fecha ? `<span class="src">· ${esc(fecha(e.fecha))}</span>` : ''}</div>
      <h3>${esc(e.titulo)}</h3>
      ${e.resumen ? `<p>${esc(e.resumen)}</p>` : ''}
      ${e.audio ? `<audio controls preload="none" src="${url(e.audio)}"></audio>` : ''}
      ${e.enlace ? `<a class="more" href="${url(e.enlace)}"${ext(e.enlace)}>Leer / escuchar →</a>` : ''}
    </article>`;

  /* ---------- páginas ---------- */
  const pages = {};

  pages.inicio = async () => {
    const [div] = await Promise.all([data('divulgacion')]);
    const ultimas = Array.isArray(div) ? div.slice(0, 3) : [];
    const accesos = [
      { icono: 'fa-solid fa-chalkboard-user', titulo: 'Docencia', descripcion: 'Campus: materiales, notas y seguimiento para el alumnado matriculado (Universidad, FP y Formación Continuada).', enlace: 'https://campus.luisfs.com' },
      { icono: 'fa-solid fa-laptop-code', titulo: 'Aplicaciones', descripcion: 'Herramientas y aplicaciones propias.', enlace: '#/aplicaciones' },
      { icono: 'fa-solid fa-dna', titulo: 'Investigación', descripcion: 'Líneas actuales y producción científica.', enlace: '#/investigacion' },
      { icono: 'fa-solid fa-microphone-lines', titulo: 'Divulgación', descripcion: 'Artículos, entrevistas y participaciones en medios.', enlace: '#/divulgacion' },
      { icono: 'fa-solid fa-camera-retro', titulo: 'Fotografía', descripcion: 'Imágenes de aficionado, una a una.', enlace: '#/fotografia' },
      { icono: 'fa-solid fa-hand-holding-heart', titulo: 'Solidaridad', descripcion: 'Bhai Nepal, cooperación internacional.', enlace: '#/solidaridad' }
    ];
    return `
    <section class="hero" id="hero">
      <div class="hero-photo" aria-hidden="true"></div>
      <canvas id="net" aria-hidden="true"></canvas>
      <div class="hero-content">
        <span class="eyebrow">${esc(C.nombre || 'Luis Franco Serrano')}</span>
        <h1>Bienvenida/o a mi <em>espacio personal</em></h1>
        <p class="lead">Un lugar para compartir docencia, investigación científica y solidaridad</p>
        <div class="pills"><span>Investigación</span><span>Docencia</span><span>Solidaridad</span><span>Naturaleza</span></div>
        <div class="cta"><a class="btn btn-primary" href="#/sobre-mi">Conóceme</a><a class="btn btn-ghost" href="#/investigacion">Ver investigación</a></div>
      </div>
      <div class="hero-social"><div class="socials">${socials()}</div></div>
    </section>

    <section class="section"><div class="wrap">
      <span class="kicker">Explora</span><h2>¿Qué encontrarás aquí?</h2>
      <div class="grid" style="margin-top:24px">${accesos.map(card).join('')}</div>
    </div></section>

    ${ultimas.length ? `<section class="section alt"><div class="wrap">
      <span class="kicker">Novedades</span><h2>Lo último en divulgación</h2>
      <div class="grid" style="margin-top:24px">${ultimas.map(entryCard).join('')}</div>
      <p style="margin-top:28px"><a class="btn btn-dark" href="#/divulgacion">Ver toda la divulgación</a></p>
    </div></section>` : ''}`;
  };

  pages['sobre-mi'] = async () => {
    const a = await data('sobre-mi');
    if (!a || Array.isArray(a)) return pageHead('Sobre mí') + `<section class="section"><div class="wrap">${errorBox()}</div></section>`;
    const parrafos = Array.isArray(a.parrafos) ? a.parrafos : [];
    const cifras = Array.isArray(a.cifras) ? a.cifras : [];
    return `
    ${pageHead('Sobre mí', esc(a.subtitulo || ''))}
    <section class="section"><div class="wrap">
      <div class="about-grid">
        <div class="portrait-wrap reveal"><img class="portrait" src="assets/foto-perfil.jpg?v=5" alt="${esc(C.nombre)}" onerror="this.closest('.portrait-wrap').remove()"></div>
        <div class="about-text reveal">
          ${a.titulo ? `<h2>${esc(a.titulo)}</h2>` : ''}
          ${parrafos.map(p => `<p>${esc(p)}</p>`).join('')}
        </div>
      </div>
      ${cifras.length ? `<div class="stats reveal">${cifras.map(c => `<div class="stat"><b>${esc(c.valor)}</b><span>${esc(c.texto)}</span></div>`).join('')}</div>` : ''}
    </div></section>`;
  };

  /* Docencia: cada asignatura/curso tiene su propia página (#/docencia/<bloque>/<id>).
     El <id> sale del título (sin tildes ni espacios) o de un campo "id" opcional. */
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const idDe = a => a.id || slug(a.titulo);
  const BLOQUES = [
    { id: 'universitaria', clave: 'universitaria', titulo: 'Universitaria', lead: 'Profesor en la escuela de Salud de la Universitat Oberta de Catalunya (UOC).' },
    { id: 'formacion-profesional', clave: 'formacionProfesional', titulo: 'Formación Profesional', lead: 'Coordinador de formación profesional en el instituto público Josep Puig i Cadafalch.' },
    { id: 'formacion-continuada', clave: 'formacionContinuada', titulo: 'Formación Continuada', lead: '' }
  ];
  let extraTitle = '';

  const asignatura = (b, a) => {
    extraTitle = a.titulo;
    const parrafos = a.texto ? (Array.isArray(a.texto) ? a.texto : [a.texto]) : [];
    const temas = Array.isArray(a.temas) ? a.temas : [];
    const recursos = Array.isArray(a.recursos) ? a.recursos : [];
    const vacio = !a.descripcion && !parrafos.length && !temas.length && !recursos.length;
    return `${pageHead(esc(a.titulo), `Docencia · ${esc(b.titulo)}`)}
      <section class="section"><div class="wrap subject">
        <a class="back" href="#/docencia/${b.id}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver a ${esc(b.titulo)}</a>
        ${a.descripcion ? `<p class="lead-text reveal">${esc(a.descripcion)}</p>` : ''}
        ${parrafos.map(p => `<p class="reveal">${esc(p)}</p>`).join('')}
        ${temas.length ? `<h2 class="reveal">Temario</h2><ul class="topics reveal">${temas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${recursos.length ? `<h2 class="reveal">Recursos</h2><ul class="resources">${recursos.map(r => `<li class="reveal"><a href="${url(r.enlace)}"${ext(r.enlace)}><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${esc(r.titulo || r.enlace)}</a></li>`).join('')}</ul>` : ''}
        ${vacio ? '<div class="empty">Contenido próximamente.</div>' : ''}
      </div></section>`;
  };

  pages.docencia = async (sub, sub2) => {
    const d = await data('docencia');
    if (!d || Array.isArray(d)) return pageHead('Docencia') + `<section class="section"><div class="wrap">${errorBox()}</div></section>`;
    if (sub2) {
      const b = BLOQUES.find(x => x.id === sub);
      const a = b && (d[b.clave] || []).find(x => idDe(x) === sub2);
      if (a) return asignatura(b, a);
    }
    const bloque = b => {
      const lista = (d[b.clave] || []).map(a => ({ ...a, enlace: a.enlace || `#/docencia/${b.id}/${idDe(a)}` }));
      return `
      <div class="teach-block" id="${b.id}">
        <span class="kicker">Docencia</span><h2>${b.titulo}</h2>
        ${b.lead ? `<p class="lead-text">${b.lead}</p>` : ''}
        ${lista.length ? `<div class="grid">${lista.map(card).join('')}</div>` : '<div class="empty" style="margin-top:24px">Próximamente.</div>'}
      </div>`;
    };
    return `${pageHead('Docencia', 'Formar a futuros profesionales de la salud y del cuidado.')}
      <section class="section"><div class="wrap">
        ${BLOQUES.map(bloque).join('')}
      </div></section>`;
  };

  pages.aplicaciones = async () => {
    const list = await data('aplicaciones');
    return `${pageHead('Aplicaciones')}
      <section class="section"><div class="wrap">
        ${list === null ? errorBox() : list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty">Próximamente.</div>'}
      </div></section>`;
  };

  pages.investigacion = async () => {
    const [inv, pubs] = await Promise.all([data('investigacion'), data('publicaciones')]);
    const lineas = inv && inv.lineas ? inv.lineas : [];
    return `${pageHead('Investigación', 'Líneas actuales de investigación y producción científica.')}
      <section class="section"><div class="wrap">
        <div class="res-intro">
          <div>
            <span class="kicker">Líneas actuales</span><h2>En qué estoy trabajando</h2>
            ${inv ? `<p class="lead-text reveal">${esc(inv.intro)}</p>` : errorBox()}
          </div>
          <figure class="side-photo reveal"><img src="assets/investigacion.jpg" alt="Micrografía en falso color de microorganismos" onerror="this.closest('.side-photo').remove()"></figure>
        </div>
        ${lineas.length ? `<h2 style="margin-top:48px">${esc(inv.tituloLineas || 'Líneas de trabajo')}</h2><div class="grid">${lineas.map(l => card({ titulo: l.titulo, descripcion: l.texto })).join('')}</div>` : ''}
      </div></section>
      <section class="section alt"><div class="wrap">
        <span class="kicker">Publicaciones</span><h2>Producción científica</h2>
        ${pubs === null ? errorBox() : pubs.length ? `<ul class="pubs">${pubs.map(p => `
          <li class="reveal"><a class="pub" href="${url(p.enlace)}"${ext(p.enlace)}>
            <span class="year">${esc(p.anio || '')}</span>
            <span class="t">${esc(p.titulo)}${(p.revista || p.autores) ? `<span class="m">${esc([p.revista, p.autores].filter(Boolean).join(' · '))}</span>` : ''}</span>
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></li>`).join('')}</ul>` : '<div class="empty">Próximamente.</div>'}
      </div></section>`;
  };

  pages.divulgacion = async () => {
    const list = await data('divulgacion');
    const tipos = Array.isArray(list) ? [...new Set(list.map(e => (e.tipo || '').toLowerCase()).filter(Boolean))] : [];
    return `${pageHead('Divulgación', 'Artículos de divulgación, entrevistas y participaciones en radio, prensa y medios.')}
      <section class="section"><div class="wrap">
        ${list === null ? errorBox() : !list.length ? '<div class="empty">Próximamente.</div>' : `
          ${tipos.length > 1 ? `<div class="chips" role="group" aria-label="Filtrar por tipo">
            <button class="chip" aria-pressed="true" data-f="">Todo</button>
            ${tipos.map(t => `<button class="chip" aria-pressed="false" data-f="${esc(t)}">${esc(tipoLabel(t))}</button>`).join('')}</div>` : ''}
          <div class="grid" id="entries">${list.map(entryCard).join('')}</div>`}
      </div></section>`;
  };

  pages.fotografia = async () => {
    const list = await data('fotos');
    return `${pageHead('Fotografía', 'Imágenes de aficionado.')}
      <section class="section"><div class="wrap">
        ${list === null ? errorBox() : !list.length ? '<div class="empty">Próximamente.</div>' : `<div class="photos">${list.map(f => `
          <figure class="photo reveal">
            <img loading="lazy" src="${url(f.src)}" alt="${esc(f.alt || f.titulo || f.frase || 'Fotografía')}">
            <figcaption>${f.titulo ? `<h3>${esc(f.titulo)}</h3>` : ''}${f.frase ? `<p>${esc(f.frase)}</p>` : ''}${(f.lugar || f.fecha) ? `<small>${esc([f.lugar, fecha(f.fecha)].filter(Boolean).join(' · '))}</small>` : ''}</figcaption>
          </figure>`).join('')}</div>`}
      </div></section>`;
  };

  pages.solidaridad = async () => {
    const o = C.ong || {};
    return `${pageHead('Solidaridad', `ONG ${esc(o.nombre || 'Bhai Nepal')}`)}
      <section class="section"><div class="wrap">
        <div class="split">
          <div class="reveal">
            <span class="kicker">Cooperación internacional</span>
            <h2>${esc(o.nombre || 'Bhai Nepal')}</h2>
            <p class="lead-text">Soy presidente y socio fundador de la ONG de cooperación internacional ${esc(o.nombre || 'Bhai Nepal')}, un proyecto que me conecta con el mundo de una forma diferente.</p>
            <p><a class="btn btn-primary" href="${url(o.url)}"${ext(o.url)}>Visitar la web de la ONG <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></p>
          </div>
          <div class="card reveal"><div class="ico"><i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i></div>
            <h3>Toda la información, en su web</h3><p>Proyectos, cómo colaborar y novedades de la ONG están en su página oficial.</p></div>
        </div>
        <figure class="wide-photo reveal"><img loading="lazy" src="assets/solidaridad.jpg" alt="Un grupo de niños y niñas sonriendo y haciendo el signo de la victoria" onerror="this.closest('.wide-photo').remove()"></figure>
      </div></section>`;
  };

  pages.contacto = async () => `
    ${pageHead('Contacto', 'Escríbeme y te responderé lo antes posible.')}
    <section class="section"><div class="wrap"><div class="split">
      <div class="reveal">
        <h2>Redes sociales</h2>
        <p class="lead-text">Para cualquier consulta, usa el formulario o escríbeme por mis redes.</p>
        <div class="socials">${socials()}</div>
      </div>
      <form class="form reveal" id="contact" novalidate>
        <h2>Formulario de contacto</h2>
        <label>Nombre<input name="nombre" required autocomplete="name"></label>
        <label>Correo electrónico<input name="email" type="email" required autocomplete="email"></label>
        <label>Mensaje<textarea name="mensaje" required></textarea></label>
        <input class="hp" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">
        ${C.web3formsKey ? '<div class="h-captcha" data-captcha="true"></div>' : ''}
        <button class="btn btn-primary" type="submit">Enviar mensaje</button>
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
      if (!d.nombre || !d.email || !d.mensaje || !/^\S+@\S+\.\S+$/.test(d.email)) { msg.textContent = 'Revisa el nombre, el correo y el mensaje.'; return; }
      if (C.web3formsKey) {
        if (!d['h-captcha-response']) { msg.textContent = 'Marca la casilla «No soy un robot» antes de enviar.'; return; }
        msg.textContent = 'Enviando…';
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
          msg.textContent = 'Mensaje enviado. ¡Gracias!';
        } catch (e) { console.error(e); msg.textContent = 'No se pudo enviar el mensaje. Inténtalo de nuevo más tarde o escríbeme por mis redes.'; }
      } else if (C.formEndpoint) {
        msg.textContent = 'Enviando…';
        try {
          const r = await fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ nombre: d.nombre, email: d.email, mensaje: d.mensaje }) });
          if (!r.ok) throw new Error(r.status);
          f.reset(); msg.textContent = 'Mensaje enviado. ¡Gracias!';
        } catch (e) { msg.textContent = 'No se pudo enviar el mensaje. Inténtalo de nuevo más tarde o escríbeme por mis redes.'; }
      } else if (!C.email) {
        msg.textContent = 'El formulario no está disponible por ahora. Escríbeme por mis redes.';
      } else {
        const body = `${d.mensaje}\n\n— ${d.nombre} (${d.email})`;
        location.href = `mailto:${C.email}?subject=${encodeURIComponent('Contacto desde la web')}&body=${encodeURIComponent(body)}`;
        msg.textContent = 'Se abrirá tu programa de correo para enviar el mensaje.';
      }
    });
  }

  /* ---------- router ---------- */
  const TITLES = { inicio: 'Inicio', 'sobre-mi': 'Sobre mí', docencia: 'Docencia', aplicaciones: 'Aplicaciones', investigacion: 'Investigación', divulgacion: 'Divulgación', fotografia: 'Fotografía', solidaridad: 'Solidaridad', contacto: 'Contacto' };
  const nav = $('#nav'), menu = $('#menu'), burger = $('#burger');
  let route = 'inicio';
  const setNav = () => nav.classList.toggle('solid', route !== 'inicio' || scrollY > 40);
  addEventListener('scroll', setNav, { passive: true });
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : '';
  });

  let token = 0;
  async function render() {
    const [p, sub, sub2] = location.hash.replace(/^#\/?/, '').split('/');
    extraTitle = '';
    route = pages[p] ? p : 'inicio';
    const my = ++token;
    if (cleanup) { cleanup(); cleanup = null; }
    menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    $$('#menu a[data-r]').forEach(a => a.classList.toggle('active', a.dataset.r === route));
    document.title = route === 'inicio' ? 'Luis Franco Serrano · Investigación, docencia y solidaridad' : `${TITLES[route]} · Luis Franco Serrano`;
    let html;
    try { html = await pages[route](sub, sub2); } catch (e) { console.error(e); html = pageHead('Error') + `<section class="section"><div class="wrap">${errorBox()}</div></section>`; }
    if (my !== token) return;
    if (extraTitle) document.title = `${extraTitle} · Docencia · Luis Franco Serrano`;
    app.innerHTML = html;
    setNav();
    observeReveals();
    if (route === 'inicio') initHero();
    if (route === 'divulgacion') initDivulgacion();
    if (route === 'contacto') initContact();
    const target = route === 'docencia' && sub ? document.getElementById(sub) : null;
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    else window.scrollTo(0, 0);
  }

  $('#footer-social').innerHTML = socials();
  $('#year').textContent = new Date().getFullYear();
  addEventListener('hashchange', render);
  render();
})();
