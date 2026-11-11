/* Sección «Encontrar un desfibrilador (DEA) cercano» (pestaña 112).
   - Solo enlaza a servicios externos y, si se pulsa el botón, consulta Overpass (datos de OpenStreetMap, emergency=defibrillator) desde el navegador.
   - Las coordenadas NO pasan por ningún servidor propio: solo se envían a esos servicios externos cuando la persona pulsa un botón o abre un enlace.
   - Necesita internet (la aplicación funciona sin conexión, esta sección no). El registro de OSM puede estar incompleto. */
(() => {
  'use strict';
  const R = window.RCP, esc = AppKit.esc, $ = R.$, T = (k, p) => AppKit.t(k, p);

  R.addI18N({
    es: {
      dcTitle: 'Encontrar un desfibrilador (DEA) cercano',
      dcWarn: 'Ante una parada cardiorrespiratoria llama primero al 112: el operador sabe dónde hay un DEA cerca y te lo indicará. Usa esta sección solo si te lo dicen o si estás preparando un plan.',
      dcPartial: 'Los mapas colaborativos pueden estar incompletos o desactualizados: un DEA que no aparece puede existir y otro que aparece puede no estar accesible.',
      dcNet: 'Esta sección necesita conexión a internet; el resto de la aplicación funciona sin conexión.',
      dcPriv: 'Tu ubicación solo se usa en tu navegador. Se envía a un servicio externo (OpenStreetMap / Overpass u otro mapa) únicamente cuando pulsas «Buscar» o abres uno de los enlaces; esta web no la recibe ni la guarda.',
      dcLocBtn: 'Usar mi ubicación', dcLocBusy: 'Obteniendo tu posición…', dcSearch: 'Buscar DEA cercanos (OpenStreetMap)', dcSearching: 'Buscando…', dcRadius: 'Radio de búsqueda',
      dcR: { 500: '500 m', 1000: '1 km', 2000: '2 km', 5000: '5 km' },
      dcOffline: 'No hay conexión a internet: no se puede buscar. Llama al 112 y pregunta dónde está el DEA más cercano.',
      dcFail: 'No se pudo consultar el servicio de mapas (sin conexión o saturado). Prueba de nuevo o abre uno de los mapas de abajo.',
      dcNone: 'No hay DEA registrados en OpenStreetMap a menos de {r}. Amplía el radio, abre los mapas externos o pregunta al 112.',
      dcFound: '{n} DEA en OpenStreetMap a menos de {r}', dcMore: 'Se muestran los {n} más cercanos.',
      dcNoPos: 'Primero pulsa «Usar mi ubicación».', dcAccess: 'Acceso restringido', dcInside: 'En interior', dcOpen: 'Horario: {h}', dcOsm: 'Ver en OpenStreetMap', dcRoute: 'Cómo llegar a pie', dcUnnamed: 'Desfibrilador (sin nombre)',
      dcLinks: 'Mapas externos (se abren en otra pestaña)',
      dcLinkAed: 'OpenAEDMap: mapa mundial de DEA (datos de OpenStreetMap)', dcLinkOsm: 'OpenStreetMap centrado en mi posición', dcLinkG: 'Buscar «desfibrilador» en Google Maps cerca de mí', dcLinkCat: 'Catalunya: app 061 Salut Respon (mapa de DEA cercanos, SEM)',
      dcLinkNote: 'En OpenStreetMap, cada DEA aparece como «emergency=defibrillator». Si conoces uno que falta, puedes añadirlo desde openaedmap.org.',
      dcLocDenied: 'Permiso de ubicación denegado. Actívalo en el candado del navegador, o abre los mapas externos y busca tu zona a mano.', dcLocFail: 'No se pudo obtener tu posición. Prueba al aire libre o abre los mapas externos.', dcLocUnsupported: 'Este navegador no ofrece ubicación; abre los mapas externos.'
    },
    ca: {
      dcTitle: 'Trobar un desfibril·lador (DEA) proper',
      dcWarn: 'Davant d\'una aturada cardiorespiratòria truca primer al 112: l\'operador sap on hi ha un DEA a prop i t\'ho indicarà. Fes servir aquesta secció només si t\'ho diuen o si estàs preparant un pla.',
      dcPartial: 'Els mapes col·laboratius poden estar incomplets o desactualitzats: un DEA que no apareix pot existir i un altre que apareix pot no ser accessible.',
      dcNet: 'Aquesta secció necessita connexió a internet; la resta de l\'aplicació funciona sense connexió.',
      dcPriv: 'La teva ubicació només s\'usa al navegador. S\'envia a un servei extern (OpenStreetMap / Overpass o un altre mapa) únicament quan prems «Cerca» o obres un dels enllaços; aquesta web no la rep ni la desa.',
      dcLocBtn: 'Fes servir la meva ubicació', dcLocBusy: 'Obtenint la teva posició…', dcSearch: 'Cerca DEA propers (OpenStreetMap)', dcSearching: 'Cercant…', dcRadius: 'Radi de cerca',
      dcR: { 500: '500 m', 1000: '1 km', 2000: '2 km', 5000: '5 km' },
      dcOffline: 'No hi ha connexió a internet: no es pot cercar. Truca al 112 i pregunta on és el DEA més proper.',
      dcFail: 'No s\'ha pogut consultar el servei de mapes (sense connexió o saturat). Torna-ho a provar o obre un dels mapes de sota.',
      dcNone: 'No hi ha DEA registrats a OpenStreetMap a menys de {r}. Amplia el radi, obre els mapes externs o pregunta al 112.',
      dcFound: '{n} DEA a OpenStreetMap a menys de {r}', dcMore: 'Es mostren els {n} més propers.',
      dcNoPos: 'Primer prem «Fes servir la meva ubicació».', dcAccess: 'Accés restringit', dcInside: 'A l\'interior', dcOpen: 'Horari: {h}', dcOsm: 'Mira a OpenStreetMap', dcRoute: 'Com arribar a peu', dcUnnamed: 'Desfibril·lador (sense nom)',
      dcLinks: 'Mapes externs (s\'obren en una altra pestanya)',
      dcLinkAed: 'OpenAEDMap: mapa mundial de DEA (dades d\'OpenStreetMap)', dcLinkOsm: 'OpenStreetMap centrat a la meva posició', dcLinkG: 'Cerca «desfibril·lador» a Google Maps a prop meu', dcLinkCat: 'Catalunya: app 061 Salut Respon (mapa de DEA propers, SEM)',
      dcLinkNote: 'A OpenStreetMap, cada DEA apareix com a «emergency=defibrillator». Si en coneixes un que falta, pots afegir-lo des d\'openaedmap.org.',
      dcLocDenied: 'Permís d\'ubicació denegat. Activa\'l al cadenat del navegador, o obre els mapes externs i cerca la teva zona a mà.', dcLocFail: 'No s\'ha pogut obtenir la teva posició. Prova a l\'aire lliure o obre els mapes externs.', dcLocUnsupported: 'Aquest navegador no ofereix ubicació; obre els mapes externs.'
    },
    en: {
      dcTitle: 'Find a nearby defibrillator (AED)',
      dcWarn: 'In a cardiac arrest call 112 first: the call-taker knows where a nearby AED is and will tell you. Use this section only if they ask you to, or when planning ahead.',
      dcPartial: 'Community maps can be incomplete or out of date: an AED that is not shown may exist, and one that is shown may not be accessible.',
      dcNet: 'This section needs an internet connection; the rest of the app works offline.',
      dcPriv: 'Your location is only used in your browser. It is sent to an external service (OpenStreetMap / Overpass or another map) only when you press "Search" or open one of the links; this website does not receive or store it.',
      dcLocBtn: 'Use my location', dcLocBusy: 'Getting your position…', dcSearch: 'Search nearby AEDs (OpenStreetMap)', dcSearching: 'Searching…', dcRadius: 'Search radius',
      dcR: { 500: '500 m', 1000: '1 km', 2000: '2 km', 5000: '5 km' },
      dcOffline: 'No internet connection: cannot search. Call 112 and ask where the nearest AED is.',
      dcFail: 'Could not reach the map service (offline or busy). Try again or open one of the maps below.',
      dcNone: 'No AEDs registered in OpenStreetMap within {r}. Widen the radius, open the external maps or ask 112.',
      dcFound: '{n} AEDs in OpenStreetMap within {r}', dcMore: 'Showing the {n} nearest.',
      dcNoPos: 'First press "Use my location".', dcAccess: 'Restricted access', dcInside: 'Indoors', dcOpen: 'Hours: {h}', dcOsm: 'View on OpenStreetMap', dcRoute: 'Walking directions', dcUnnamed: 'Defibrillator (unnamed)',
      dcLinks: 'External maps (open in a new tab)',
      dcLinkAed: 'OpenAEDMap: worldwide AED map (OpenStreetMap data)', dcLinkOsm: 'OpenStreetMap centred on my position', dcLinkG: 'Search "defibrillator" on Google Maps near me', dcLinkCat: 'Catalonia: 061 Salut Respon app (nearby AED map, SEM)',
      dcLinkNote: 'In OpenStreetMap each AED is tagged "emergency=defibrillator". If you know of one that is missing, you can add it from openaedmap.org.',
      dcLocDenied: 'Location permission denied. Enable it from the browser padlock, or open the external maps and look up your area by hand.', dcLocFail: 'Could not get your position. Try outdoors or open the external maps.', dcLocUnsupported: 'This browser does not offer location; open the external maps.'
    }
  });

  const S = { pos: null, state: 'idle', err: '', radius: 1000, sstate: 'idle', serr: '', res: null };   // solo en memoria
  const MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

  const dist = (a, b, c, d) => {          // haversine, metros
    const r = Math.PI / 180, p = (c - a) * r, q = (d - b) * r, h = Math.sin(p / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(q / 2) ** 2;
    return 12742000 * Math.asin(Math.sqrt(h));
  };
  const fmtDist = (m) => (m < 1000 ? Math.round(m / 10) * 10 + ' m' : AppKit.fmt(m / 1000, 1) + ' km');
  const num = (v) => (+v).toFixed(5);

  /* enlaces a mapas externos (con o sin ubicación) */
  function links() {
    const p = S.pos, ll = p ? `${num(p.lat)}/${num(p.lon)}` : null;
    const out = [
      { k: 'dcLinkAed', u: p ? `https://openaedmap.org/#map=16/${ll}` : 'https://openaedmap.org/' },
      { k: 'dcLinkOsm', u: p ? `https://www.openstreetmap.org/?mlat=${num(p.lat)}&mlon=${num(p.lon)}#map=17/${ll}` : 'https://www.openstreetmap.org/' },
      { k: 'dcLinkG', u: p ? `https://www.google.com/maps/search/desfibrilador/@${num(p.lat)},${num(p.lon)},16z` : 'https://www.google.com/maps/search/desfibrilador' }
    ];
    if (AppKit.lang !== 'en') out.push({ k: 'dcLinkCat', u: 'https://sem.gencat.cat/ca/061-salut-respon/app-061/' });
    return out;
  }

  async function overpass(lat, lon, rad) {
    const q = `[out:json][timeout:20];nwr["emergency"="defibrillator"](around:${rad},${lat},${lon});out center tags 60;`;
    let last = null;
    for (const url of MIRRORS) {
      const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 22000);
      try {
        const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ac.signal, referrerPolicy: 'no-referrer', credentials: 'omit' });
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json();
        return (j.elements || []).map(e => {
          const la = e.lat !== undefined ? e.lat : e.center && e.center.lat, lo = e.lon !== undefined ? e.lon : e.center && e.center.lon;
          return la === undefined ? null : { type: e.type, id: e.id, lat: la, lon: lo, tags: e.tags || {}, d: dist(lat, lon, la, lo) };
        }).filter(Boolean).sort((a, b) => a.d - b.d);
      } catch (err) { last = err; } finally { clearTimeout(tm); }
    }
    throw last || new Error('fail');
  }

  function locate() {
    if (!('geolocation' in navigator)) { S.state = 'error'; S.err = T('dcLocUnsupported'); return paint(); }
    S.state = 'busy'; paint();
    navigator.geolocation.getCurrentPosition(p => { S.pos = { lat: p.coords.latitude, lon: p.coords.longitude }; S.state = 'ok'; S.res = null; S.sstate = 'idle'; paint(); },
      e => { S.state = 'error'; S.err = T(e.code === 1 ? 'dcLocDenied' : 'dcLocFail'); paint(); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 });
  }
  async function search() {
    if (!S.pos) { S.sstate = 'error'; S.serr = T('dcNoPos'); return paint(); }
    if (navigator.onLine === false) { S.sstate = 'error'; S.serr = T('dcOffline'); return paint(); }
    S.sstate = 'busy'; S.res = null; paint();
    try { S.res = await overpass(S.pos.lat, S.pos.lon, S.radius); S.sstate = 'ok'; }
    catch (_) { S.sstate = 'error'; S.serr = navigator.onLine === false ? T('dcOffline') : T('dcFail'); }
    paint();
  }

  function itemHtml(x) {
    const t = x.tags, name = t.name || t['defibrillator:location'] || t.description || t['operator'] || T('dcUnnamed');
    const restricted = ['private', 'no', 'customers', 'permit'].includes(t.access);
    const meta = [t.indoor === 'yes' ? T('dcInside') : '', t.opening_hours ? T('dcOpen', { h: t.opening_hours }) : '', t['addr:street'] ? t['addr:street'] + (t['addr:housenumber'] ? ' ' + t['addr:housenumber'] : '') : ''].filter(Boolean);
    const p = S.pos;
    return `<li class="dc-item"><div class="grow"><b>${esc(String(name))}</b>${restricted ? ` <span class="chip warn">${esc(T('dcAccess'))}</span>` : ''}
      ${meta.length ? `<small class="muted" style="display:block">${esc(meta.join(' · '))}</small>` : ''}
      <span class="dc-links"><a href="https://www.openstreetmap.org/${x.type}/${x.id}" target="_blank" rel="noopener noreferrer">${esc(T('dcOsm'))}</a>
      <a href="https://www.google.com/maps/dir/?api=1&amp;origin=${num(p.lat)},${num(p.lon)}&amp;destination=${num(x.lat)},${num(x.lon)}&amp;travelmode=walking" target="_blank" rel="noopener noreferrer">${esc(T('dcRoute'))}</a></span></div>
      <span class="chip accent">${esc(fmtDist(x.d))}</span></li>`;
  }

  function bodyHtml() {
    const locBusy = S.state === 'busy', sBusy = S.sstate === 'busy', rl = T('dcR')[S.radius];
    let res = '';
    if (S.sstate === 'error') res = `<p class="callout warn" role="alert">${esc(S.serr)}</p>`;
    else if (S.sstate === 'ok' && S.res) {
      res = S.res.length
        ? `<p role="status"><b>${esc(T('dcFound', { n: S.res.length, r: rl }))}</b>${S.res.length > 10 ? ' ' + esc(T('dcMore', { n: 10 })) : ''}</p><ul class="hist-list dc-list">${S.res.slice(0, 10).map(itemHtml).join('')}</ul>`
        : `<p class="callout" role="status">${esc(T('dcNone', { r: rl }))}</p>`;
    }
    return `
      <p class="callout danger" role="note"><b>${esc(T('dcWarn'))}</b></p>
      <p class="muted">${esc(T('dcPartial'))} ${esc(T('dcNet'))}</p>
      <p class="muted">${esc(T('dcPriv'))}</p>
      <div class="row">
        <button type="button" class="btn" id="dcLoc"${locBusy ? ' disabled' : ''}>${esc(locBusy ? T('dcLocBusy') : T('dcLocBtn'))}</button>
        <label class="field" style="margin:0"><span class="sr-only">${esc(T('dcRadius'))}</span><select id="dcRad" aria-label="${esc(T('dcRadius'))}">${[500, 1000, 2000, 5000].map(r => `<option value="${r}"${S.radius === r ? ' selected' : ''}>${esc(T('dcR')[r])}</option>`).join('')}</select></label>
        <button type="button" class="btn ghost" id="dcGo"${!S.pos || sBusy ? ' disabled' : ''}>${esc(sBusy ? T('dcSearching') : T('dcSearch'))}</button>
      </div>
      ${S.state === 'error' ? `<p class="callout warn" role="alert">${esc(S.err)}</p>` : ''}
      ${res}
      <h3>${esc(T('dcLinks'))}</h3>
      <ul class="tip-list dc-ext">${links().map(l => `<li><a href="${esc(l.u)}" target="_blank" rel="noopener noreferrer">${esc(T(l.k))}</a></li>`).join('')}</ul>
      <small class="muted">${esc(T('dcLinkNote'))}</small>`;
  }

  function paint() {
    const box = $('#dcBox'); if (!box) return;
    box.innerHTML = bodyHtml();
    $('#dcLoc', box).addEventListener('click', locate);
    $('#dcGo', box).addEventListener('click', search);
    $('#dcRad', box).addEventListener('change', e => { S.radius = +e.target.value; S.res = null; S.sstate = 'idle'; paint(); });
  }

  /* se engancha a la pestaña 112 sin tocar su código */
  const base = R.tabs.call;
  R.tabs.call = Object.assign({}, base, {
    render() {
      base.render();
      const loc = $('#locBox'), host = loc && loc.closest('.panel');
      if (!host) return;
      const p = document.createElement('div'); p.className = 'panel'; p.id = 'dcPanel';
      p.innerHTML = `<h2>${esc(T('dcTitle'))}</h2><div id="dcBox"></div>`;
      host.after(p); paint();
    }
  });
})();
