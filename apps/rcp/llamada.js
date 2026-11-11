/* Pestaña «112»: botón de llamada, guion de la llamada al operador y ubicación.
   La ubicación solo se muestra en pantalla: no se envía a ningún sitio ni se geocodifica. */
(() => {
  'use strict';
  const R = window.RCP, esc = AppKit.esc, $ = R.$, $$ = R.$$, T = (k, p) => AppKit.t(k, p);

  R.addI18N({
    es: {
      callConfirmTitle: '¿Quieres llamar a emergencias?', callConfirmMsg: 'Vas a llamar al 112 de verdad. Si solo estás practicando o probando la aplicación, cancela: una llamada falsa ocupa la línea de emergencias.', callConfirmOk: 'Sí, llamar al 112', callConfirmNo: 'No, cancelar', tabCall: '112', callTitle: 'Llama al 112', callBtn: 'Llamar al 112', callBtnSub: 'Toca para marcar ahora',
      callNote: '112 es el número europeo de emergencias. Si estás en otro país, marca su número local de emergencias.',
      callTips: 'Mientras llamas', callTipList: [
        { t: 'Pon el teléfono en altavoz', d: 'Así puedes comprimir y escuchar al operador a la vez.' },
        { t: 'No cuelgues', d: 'Hasta que el operador te lo indique. Te guiará con las compresiones.' },
        { t: 'Que alguien traiga un DEA', d: 'Pide a una persona concreta, señalándola: «Tú, llama al 112. Tú, trae el desfibrilador».' },
        { t: 'Que alguien espere a la ambulancia', d: 'En la calle o en el portal, para guiar a los sanitarios hasta la víctima.' }
      ],
      scriptTitle: 'Qué decir y qué te preguntarán', scriptHint: 'Marca cada punto según lo vayas diciendo. El operador te irá preguntando.',
      scriptDone: '{a} de {b} puntos', scriptReset: 'Desmarcar todo',
      script: [
        { t: 'Qué ha ocurrido', d: '«Una persona está inconsciente y no respira con normalidad» (o «se está atragantando», «ha tenido un accidente»…).' },
        { t: 'Dónde estás', d: 'Dirección exacta, municipio y referencias: portal, piso y puerta, un comercio cercano, el punto kilométrico… Si no lo sabes, dilo: pueden localizarte por el teléfono.' },
        { t: 'Cuántas personas y qué edad', d: 'Cuántas víctimas hay y la edad aproximada: lactante, niño, adulto o anciano.' },
        { t: '¿Está consciente? ¿Respira?', d: '«No responde y no respira (o respira de forma anormal, como boqueadas)». Si respira con normalidad, díselo.' },
        { t: 'Tu nombre y teléfono', d: 'Tu nombre y el número desde el que llamas, por si hay que volver a contactar.' },
        { t: 'Sigue sus instrucciones', d: 'El operador te dirá cómo comprimir y cuándo usar el DEA. Mantén la llamada abierta.' }
      ],
      addrTitle: 'Dirección y referencias', addrLabel: 'Anota aquí la dirección para leerla al operador', addrPh: 'Calle, número, municipio, portal, piso, referencias…', addrNote: 'Lo que escribes se queda en esta pantalla: no se guarda ni se envía.',
      locTitle: 'Mi ubicación', locBtn: 'Usar mi ubicación', locBusy: 'Buscando tu posición…', locRefresh: 'Actualizar ubicación',
      locPrivacy: 'Las coordenadas solo se muestran aquí para que puedas leerlas al operador. No se envían a ningún sitio ni se consultan en ningún servicio externo.',
      locLat: 'Latitud', locLon: 'Longitud', locDec: 'Decimales', locDms: 'Grados', locAcc: 'Precisión', locAccVal: '±{n} m', locCopy: 'Copiar coordenadas', locCopied: 'Coordenadas copiadas', locCopyFail: 'No se ha podido copiar; léelas desde la pantalla.',
      locNS: { n: 'N', s: 'S' }, locEW: { e: 'E', w: 'O' }, locRead: 'Para leer: «Latitud {lat}, longitud {lon}»',
      locLow: 'La precisión es baja. Sal a un lugar abierto, vuelve a intentarlo y da también referencias (calle, portal, comercio).',
      locDenied: 'Permiso de ubicación denegado. Puedes activarlo en el icono del candado o ajustes del navegador y volver a pulsar; mientras tanto, di la dirección y las referencias.',
      locUnavailable: 'No se ha podido obtener la posición (sin señal GPS o de red). Prueba al aire libre o di la dirección y referencias.',
      locTimeout: 'Se ha agotado el tiempo esperando la posición. Vuelve a intentarlo o di la dirección y referencias.',
      locUnsupported: 'Este navegador no ofrece ubicación. Di la dirección y las referencias al operador.',
      locInsecure: 'La ubicación solo funciona en páginas seguras (https). Di la dirección y las referencias al operador.',
      toMetro: 'Abrir el metrónomo', callRescue: 'Cuando cuelgues o mientras esperas, empieza o continúa la RCP.'
    },
    ca: {
      callConfirmTitle: 'Vols trucar a emergències?', callConfirmMsg: "Estàs a punt de trucar al 112 de debò. Si només estàs practicant o provant l'aplicació, cancel·la: una trucada falsa ocupa la línia d'emergències.", callConfirmOk: 'Sí, truca al 112', callConfirmNo: 'No, cancel·la', tabCall: '112', callTitle: 'Truca al 112', callBtn: 'Truca al 112', callBtnSub: 'Toca per marcar ara',
      callNote: '112 és el número europeu d\'emergències. Si ets en un altre país, marca el seu número local d\'emergències.',
      callTips: 'Mentre truques', callTipList: [
        { t: 'Posa el telèfon en altaveu', d: 'Així pots comprimir i escoltar l\'operador alhora.' },
        { t: 'No pengis', d: 'Fins que l\'operador t\'ho indiqui. Et guiarà amb les compressions.' },
        { t: 'Que algú porti un DEA', d: 'Demana-ho a una persona concreta, assenyalant-la: «Tu, truca al 112. Tu, porta el desfibril·lador».' },
        { t: 'Que algú esperi l\'ambulància', d: 'Al carrer o al portal, per guiar els sanitaris fins a la víctima.' }
      ],
      scriptTitle: 'Què dir i què et preguntaran', scriptHint: 'Marca cada punt a mesura que el vagis dient. L\'operador et farà preguntes.',
      scriptDone: '{a} de {b} punts', scriptReset: 'Desmarca-ho tot',
      script: [
        { t: 'Què ha passat', d: '«Una persona està inconscient i no respira amb normalitat» (o «s\'està ofegant», «ha tingut un accident»…).' },
        { t: 'On ets', d: 'Adreça exacta, municipi i referències: portal, pis i porta, un comerç proper, el punt quilomètric… Si no ho saps, digues-ho: poden localitzar-te pel telèfon.' },
        { t: 'Quantes persones i quina edat', d: 'Quantes víctimes hi ha i l\'edat aproximada: lactant, infant, adult o gran.' },
        { t: 'Està conscient? Respira?', d: '«No respon i no respira (o respira de manera anormal, com boquejades)». Si respira amb normalitat, digues-ho.' },
        { t: 'El teu nom i telèfon', d: 'El teu nom i el número des del qual truques, per si cal tornar a contactar.' },
        { t: 'Segueix les seves instruccions', d: 'L\'operador et dirà com comprimir i quan fer servir el DEA. Mantén la trucada oberta.' }
      ],
      addrTitle: 'Adreça i referències', addrLabel: 'Anota aquí l\'adreça per llegir-la a l\'operador', addrPh: 'Carrer, número, municipi, portal, pis, referències…', addrNote: 'El que escrius es queda en aquesta pantalla: no es desa ni s\'envia.',
      locTitle: 'La meva ubicació', locBtn: 'Fes servir la meva ubicació', locBusy: 'Buscant la teva posició…', locRefresh: 'Actualitza la ubicació',
      locPrivacy: 'Les coordenades només es mostren aquí perquè les puguis llegir a l\'operador. No s\'envien enlloc ni es consulten en cap servei extern.',
      locLat: 'Latitud', locLon: 'Longitud', locDec: 'Decimals', locDms: 'Graus', locAcc: 'Precisió', locAccVal: '±{n} m', locCopy: 'Copia les coordenades', locCopied: 'Coordenades copiades', locCopyFail: 'No s\'ha pogut copiar; llegeix-les de la pantalla.',
      locNS: { n: 'N', s: 'S' }, locEW: { e: 'E', w: 'O' }, locRead: 'Per llegir: «Latitud {lat}, longitud {lon}»',
      locLow: 'La precisió és baixa. Surt a un lloc obert, torna-ho a provar i dóna també referències (carrer, portal, comerç).',
      locDenied: 'Permís d\'ubicació denegat. Pots activar-lo a la icona del cadenat o als ajustos del navegador i tornar a prémer; mentrestant, digues l\'adreça i les referències.',
      locUnavailable: 'No s\'ha pogut obtenir la posició (sense senyal GPS o de xarxa). Prova a l\'aire lliure o digues l\'adreça i referències.',
      locTimeout: 'S\'ha esgotat el temps esperant la posició. Torna-ho a provar o digues l\'adreça i referències.',
      locUnsupported: 'Aquest navegador no ofereix ubicació. Digues l\'adreça i les referències a l\'operador.',
      locInsecure: 'La ubicació només funciona en pàgines segures (https). Digues l\'adreça i les referències a l\'operador.',
      toMetro: 'Obre el metrònom', callRescue: 'Quan pengis o mentre esperes, comença o continua la RCP.'
    },
    en: {
      callConfirmTitle: 'Do you want to call emergency services?', callConfirmMsg: 'You are about to really call 112. If you are only practising or testing the app, cancel: a false call ties up the emergency line.', callConfirmOk: 'Yes, call 112', callConfirmNo: 'No, cancel', tabCall: '112', callTitle: 'Call 112', callBtn: 'Call 112', callBtnSub: 'Tap to dial now',
      callNote: '112 is the European emergency number. If you are in another country, dial its local emergency number.',
      callTips: 'While you call', callTipList: [
        { t: 'Put the phone on speaker', d: 'So you can do compressions and hear the call-taker at the same time.' },
        { t: 'Do not hang up', d: 'Until the call-taker tells you to. They will coach you through compressions.' },
        { t: 'Send someone for an AED', d: 'Ask a specific person, pointing at them: "You, call 112. You, bring the defibrillator".' },
        { t: 'Have someone meet the ambulance', d: 'In the street or at the entrance, to guide the crew to the casualty.' }
      ],
      scriptTitle: 'What to say and what they will ask', scriptHint: 'Tick each point as you say it. The call-taker will ask you questions.',
      scriptDone: '{a} of {b} points', scriptReset: 'Untick all',
      script: [
        { t: 'What has happened', d: '"A person is unconscious and not breathing normally" (or "is choking", "has had an accident"…).' },
        { t: 'Where you are', d: 'Exact address, town and landmarks: building entrance, floor and door, a nearby shop, the kilometre marker… If you do not know, say so: they can locate you from your phone.' },
        { t: 'How many people and what age', d: 'How many casualties and their approximate age: infant, child, adult or elderly.' },
        { t: 'Conscious? Breathing?', d: '"They do not respond and are not breathing (or only gasping)". If they are breathing normally, say so.' },
        { t: 'Your name and phone number', d: 'Your name and the number you are calling from, in case they need to call back.' },
        { t: 'Follow their instructions', d: 'The call-taker will tell you how to do compressions and when to use the AED. Keep the line open.' }
      ],
      addrTitle: 'Address and landmarks', addrLabel: 'Write the address here so you can read it to the call-taker', addrPh: 'Street, number, town, entrance, floor, landmarks…', addrNote: 'What you type stays on this screen: it is not saved or sent.',
      locTitle: 'My location', locBtn: 'Use my location', locBusy: 'Finding your position…', locRefresh: 'Refresh location',
      locPrivacy: 'The coordinates are only shown here so you can read them to the call-taker. They are not sent anywhere or looked up in any external service.',
      locLat: 'Latitude', locLon: 'Longitude', locDec: 'Decimal', locDms: 'Degrees', locAcc: 'Accuracy', locAccVal: '±{n} m', locCopy: 'Copy coordinates', locCopied: 'Coordinates copied', locCopyFail: 'Could not copy; read them from the screen.',
      locNS: { n: 'N', s: 'S' }, locEW: { e: 'E', w: 'W' }, locRead: 'To read out: "Latitude {lat}, longitude {lon}"',
      locLow: 'Accuracy is low. Move to an open area, try again, and also give landmarks (street, entrance, shop).',
      locDenied: 'Location permission denied. You can enable it from the padlock icon or the browser settings and press again; meanwhile, give the address and landmarks.',
      locUnavailable: 'Could not get your position (no GPS or network signal). Try outdoors or give the address and landmarks.',
      locTimeout: 'Timed out waiting for your position. Try again or give the address and landmarks.',
      locUnsupported: 'This browser does not offer location. Give the address and landmarks to the call-taker.',
      locInsecure: 'Location only works on secure pages (https). Give the address and landmarks to the call-taker.',
      toMetro: 'Open the metronome', callRescue: 'When you hang up, or while you wait, start or continue CPR.'
    }
  });

  const S = { checks: {}, addr: '', loc: null, locState: 'idle', locError: '' };   // solo en memoria

  const dms = (v, pos, neg) => {
    const hemi = v >= 0 ? pos : neg, a = Math.abs(v), d = Math.floor(a), mf = (a - d) * 60, m = Math.floor(mf), s = (mf - m) * 60;
    return `${d}° ${m}′ ${s.toFixed(1).replace('.', AppKit.lang === 'en' ? '.' : ',')}″ ${hemi}`;
  };
  const dec = (v) => v.toFixed(5).replace('.', AppKit.lang === 'en' ? '.' : ',');

  function locHtml() {
    const busy = S.locState === 'busy';
    let out = '';
    if (S.loc) {
      const c = S.loc, ns = T('locNS'), ew = T('locEW');
      const latD = dec(c.lat), lonD = dec(c.lon);
      const latG = dms(c.lat, ns.n, ns.s), lonG = dms(c.lon, ew.e, ew.w);
      out = `
        <div class="coords" aria-live="polite">
          <div class="coord"><small>${esc(T('locLat'))}</small><b>${esc(latD)}</b><span>${esc(latG)}</span></div>
          <div class="coord"><small>${esc(T('locLon'))}</small><b>${esc(lonD)}</b><span>${esc(lonG)}</span></div>
          <div class="coord"><small>${esc(T('locAcc'))}</small><b>${esc(T('locAccVal', { n: Math.round(c.acc) }))}</b><span>${new Date(c.ts).toLocaleTimeString(AppKit.locale())}</span></div>
        </div>
        <p class="muted">${esc(T('locRead', { lat: latD, lon: lonD }))}</p>
        ${c.acc > 100 ? `<p class="callout warn">${esc(T('locLow'))}</p>` : ''}
        <button type="button" class="btn ghost" id="locCopy">${esc(T('locCopy'))}</button>`;
    }
    if (S.locState === 'error') out += `<p class="callout warn" role="alert">${esc(S.locError)}</p>`;
    return `
      <p class="muted">${esc(T('locPrivacy'))}</p>
      <div class="row"><button type="button" class="btn" id="locBtn" ${busy ? 'disabled' : ''}>${esc(busy ? T('locBusy') : (S.loc ? T('locRefresh') : T('locBtn')))}</button></div>
      ${out}`;
  }

  function locate() {
    if (!('geolocation' in navigator)) { S.locState = 'error'; S.locError = T('locUnsupported'); return renderLoc(); }
    if (window.isSecureContext === false) { S.locState = 'error'; S.locError = T('locInsecure'); return renderLoc(); }
    S.locState = 'busy'; renderLoc();
    navigator.geolocation.getCurrentPosition(p => {
      S.loc = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, ts: p.timestamp || Date.now() };
      S.locState = 'ok'; renderLoc();
    }, err => {
      S.locState = 'error';
      S.locError = err.code === 1 ? T('locDenied') : err.code === 3 ? T('locTimeout') : T('locUnavailable');
      S.errCode = err.code; renderLoc();
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }

  function renderLoc() {
    const box = $('#locBox'); if (!box) return;
    box.innerHTML = locHtml();
    $('#locBtn', box).addEventListener('click', locate);
    const cp = $('#locCopy', box);
    if (cp) cp.addEventListener('click', async () => {
      const c = S.loc, ok = await R.copy(`${dec(c.lat).replace(',', '.')}, ${dec(c.lon).replace(',', '.')} (${T('locAccVal', { n: Math.round(c.acc) })})`);
      AppKit.toast(ok ? T('locCopied') : T('locCopyFail'));
    });
  }

  function render() {
    const script = T('script'), done = script.filter((_, i) => S.checks[i]).length;
    $('#callRoot').innerHTML = `
      <div class="call-hero">
        <a class="call-btn" href="tel:112" id="call112"><span class="call-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="44" height="44"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.6a1 1 0 01-.25 1z" fill="currentColor"/></svg></span>
          <span class="call-txt"><b>${esc(T('callBtn'))}</b><small>${esc(T('callBtnSub'))}</small></span><span class="call-num" aria-hidden="true">112</span></a>
        <p class="call-note">${esc(T('callNote'))}</p>
      </div>
      <div class="call-grid">
        <div class="stack">
          <div class="panel">
            <div class="row spread"><h2 style="margin:0">${esc(T('scriptTitle'))}</h2><span class="chip" id="scriptCount">${esc(T('scriptDone', { a: done, b: script.length }))}</span></div>
            <p class="muted">${esc(T('scriptHint'))}</p>
            <ol class="check-list script">${script.map((s, i) => `<li><label class="${S.checks[i] ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${S.checks[i] ? 'checked' : ''}><span><b>${i + 1}. ${esc(s.t)}</b><small class="muted">${esc(s.d)}</small></span></label></li>`).join('')}</ol>
            <button type="button" class="btn ghost small" id="scriptReset">${esc(T('scriptReset'))}</button>
          </div>
        </div>
        <div class="stack">
          <div class="panel">
            <h2>${esc(T('addrTitle'))}</h2>
            <label class="field"><span>${esc(T('addrLabel'))}</span><textarea id="addr" rows="3" placeholder="${esc(T('addrPh'))}" autocomplete="off">${esc(S.addr)}</textarea><small>${esc(T('addrNote'))}</small></label>
          </div>
          <div class="panel"><h2>${esc(T('locTitle'))}</h2><div id="locBox"></div></div>
          <div class="panel">
            <h2>${esc(T('callTips'))}</h2>
            <ul class="tip-list">${T('callTipList').map(x => `<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`).join('')}</ul>
            <p class="muted">${esc(T('callRescue'))}</p>
            <button type="button" class="btn ghost small" id="goMetro">${esc(T('toMetro'))}</button>
          </div>
        </div>
      </div>`;
    renderLoc();
    $('#addr').addEventListener('input', e => { S.addr = e.target.value; });
    $('#call112').addEventListener('click', async (e) => {
      e.preventDefault();
      if (await AppKit.confirm(T('callConfirmMsg'), { title: T('callConfirmTitle'), okText: T('callConfirmOk'), cancelText: T('callConfirmNo') })) window.location.href = 'tel:112';
    });
    $('#goMetro').addEventListener('click', () => R.go('metro'));
    $('#scriptReset').addEventListener('click', () => { S.checks = {}; render(); });
    $$('#callRoot .script input').forEach(inp => inp.addEventListener('change', () => {
      S.checks[inp.dataset.i] = inp.checked; inp.closest('label').classList.toggle('done', inp.checked);
      $('#scriptCount').textContent = T('scriptDone', { a: script.filter((_, i) => S.checks[i]).length, b: script.length });
    }));
  }

  R.tabs.call = { render, leave() { /* nada que parar */ } };
})();
