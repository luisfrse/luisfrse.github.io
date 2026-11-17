(() => {
  'use strict';
  const T = {
    es: { all: '← Todos los cursos', access: '1 año de acceso desde la activación, ampliable', contact: 'Pedir información o acceso', preview: 'Ver la parte abierta del curso',
      pics: 'Así se ve', syl: 'Temario completo', sylNote: 'Todos los temas y apartados del curso. Pulsa en cada tema para ver sus apartados.', tema: 'Tema', items: 'apartados', inc: 'Qué incluye', how: 'Cómo se usa', tools: 'Herramientas gratuitas para probar', toolsNote: 'Son herramientas abiertas de mi web, no el curso: te dan una idea del tipo de actividades.',
      not: 'Lo que no es', faq: 'Preguntas frecuentes', other: 'Otros cursos', foot: '© Luis Franco Serrano',
      faqs: [['¿Cuánto dura el acceso?', 'Un año desde la activación, y se puede ampliar.'], ['¿En qué idioma está?', 'En castellano y en catalán. Cambias de idioma con un botón.'], ['¿Desde qué dispositivo se usa?', 'Desde el móvil o el ordenador, con el navegador y sin instalar nada.'], ['¿Puedo probarlo antes?', 'Sí: hay una parte abierta del curso en el campus y varias herramientas gratuitas en esta página. Si quieres ver algo más concreto, escríbeme.'], ['¿Cómo consigo el acceso?', 'Escríbeme por el formulario de contacto. Te doy de alta una cuenta personal en el campus y recibes tu acceso.'], ['¿Da algún título o certificado?', 'No. Es material de estudio, no una titulación oficial.']] },
    ca: { all: '← Tots els cursos', access: '1 any d’accés des de l’activació, ampliable', contact: 'Demanar informació o accés', preview: 'Veure la part oberta del curs',
      pics: 'Així es veu', syl: 'Temari complet', sylNote: 'Tots els temes i apartats del curs. Prem cada tema per veure’n els apartats.', tema: 'Tema', items: 'apartats', inc: 'Què inclou', how: 'Com s’utilitza', tools: 'Eines gratuïtes per provar', toolsNote: 'Són eines obertes de la meva web, no el curs: et donen una idea del tipus d’activitats.',
      not: 'El que no és', faq: 'Preguntes freqüents', other: 'Altres cursos', foot: '© Luis Franco Serrano',
      faqs: [['Quant dura l’accés?', 'Un any des de l’activació, i es pot ampliar.'], ['En quin idioma està?', 'En castellà i en català. Canvies d’idioma amb un botó.'], ['Des de quin dispositiu s’utilitza?', 'Des del mòbil o l’ordinador, amb el navegador i sense instal·lar res.'], ['Ho puc provar abans?', 'Sí: hi ha una part oberta del curs al campus i diverses eines gratuïtes en aquesta pàgina. Si vols veure alguna cosa més concreta, escriu-me.'], ['Com aconsegueixo l’accés?', 'Escriu-me pel formulari de contacte. Et dono d’alta un compte personal al campus i rebràs el teu accés.'], ['Dóna algun títol o certificat?', 'No. És material d’estudi, no una titulació oficial.']] }
  };
  const C = window.CURSOS, id = document.documentElement.dataset.course;
  const c = C.find((x) => x.page === id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  let lang = 'es';
  try { const s = localStorage.getItem('lang'); if (s === 'ca' || s === 'es') lang = s; else if ((navigator.language || '').toLowerCase().startsWith('ca')) lang = 'ca'; } catch (_) {}
  const $ = (i) => document.getElementById(i);

  const SY = (window.SYLLABUS || {})[id] || [];
  const syl = (t) => {
    if (!SY.length) return '';
    const flat = SY.every((x) => x.items.length === 1);
    const body = flat
      ? `<details open><summary>${esc(t.syl)} (${SY.length})</summary><ol start="0" style="columns:2 320px;margin:.6em 0 0;padding-left:1.6em">${SY.map((x) => `<li style="break-inside:avoid;margin:0 0 .35em">${esc(x[lang])}</li>`).join('')}</ol></details>`
      : SY.map((x) => `<details><summary>${esc(t.tema)} ${x.n} · ${esc(x[lang])} ${x.items.length > 1 ? `<span style="color:var(--soft);font-weight:400">(${x.items.length} ${esc(t.items)})</span>` : ''}</summary><ul class="inc" style="margin-top:.6em">${x.items.map((i) => `<li>${esc(i[lang])}</li>`).join('')}</ul></details>`).join('');
    return `<section class="blk"><h2>${esc(t.syl)}</h2><p style="color:var(--soft);margin-top:0">${esc(t.sylNote)}</p>${body}</section>`;
  };

  function render() {
    const t = T[lang], d = c[lang];
    document.documentElement.lang = lang;
    document.title = d.name + ' · Luis Franco Serrano';
    $('back').textContent = t.all;
    $('h1').textContent = d.name; $('lead').textContent = d.lead;
    $('price').innerHTML = `<b>${c.price} €</b><span>${esc(t.access)}</span>`;
    $('acts').innerHTML = `<a class="btn" href="../../#/contacto">${esc(t.contact)}</a><a class="btn ghost" href="https://campus.luisfs.com/asignatura/${c.slug}" target="_blank" rel="noopener">${esc(t.preview)}</a>`;
    const imgs = Array.from({ length: c.imgs }, (_, i) => `../img/${c.page}/${String(i + 1).padStart(2, '0')}.jpg`);
    $('app').innerHTML = `
      <section class="blk"><h2>${esc(t.pics)}</h2><div class="gal">${imgs.map((u, i) => `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="${esc(d.name)} (${i + 1})" width="1080" height="1080" loading="lazy"></a>`).join('')}</div></section>
      ${syl(t)}
      <section class="blk"><h2>${esc(t.inc)}</h2><ul class="inc">${d.inc.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="blk"><h2>${esc(t.how)}</h2><ul class="inc">${c.how[lang].map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="blk"><h2>${esc(t.tools)}</h2><p style="color:var(--soft);margin-top:0">${esc(t.toolsNote)}</p><div class="apps">${c.apps.map((a) => `<a href="${a.url}" target="_blank" rel="noopener">${esc(a[lang])}</a>`).join('')}</div></section>
      <section class="blk"><h2>${esc(t.not)}</h2><p class="not">${esc(d.not)}</p></section>
      <section class="blk"><h2>${esc(t.faq)}</h2>${t.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
      <section class="blk"><div class="acts"><a class="btn" href="../../#/contacto">${esc(t.contact)}</a><a class="btn ghost" href="https://campus.luisfs.com/asignatura/${c.slug}" target="_blank" rel="noopener">${esc(t.preview)}</a></div></section>
      <section class="blk"><h2>${esc(t.other)}</h2><div class="more">${C.filter((x) => x.page !== id).map((x) => `<a href="../${x.page}/">${esc(x[lang].name)}<span>${x.price} €</span></a>`).join('')}</div></section>`;
    $('foot').textContent = t.foot;
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; try { localStorage.setItem('lang', lang); } catch (_) {} render(); }));
  render();
})();
