/* ============================================================
   Calculadora de rutas · interfaz
   Usa RutaCalc (calc.js) y AppKit (apps/shared/app.js).
   ============================================================ */
(() => {
  'use strict';
  const RC = window.RutaCalc, K = window.AppKit;
  const store = K.storage('ruta');
  const esc = K.esc;

  /* ============================== textos ============================== */
  const DICT = {
    es: {
      title: 'Calculadora de rutas',
      heroTitle: 'Cuánto tardarás en tu próxima salida',
      heroText: 'Escribe la distancia y el desnivel o carga un track GPX. Compara cuatro métodos clásicos, ajusta el ritmo a tu grupo y comprueba si te da la luz.',
      tryExample: 'Probar con una ruta de ejemplo',
      panelRoute: 'La ruta', panelPace: 'Ritmo y condiciones', panelDay: 'Jornada y luz',
      srcManual: 'Escribir datos', srcGpx: 'Archivo GPX', srcLabel: 'Origen de los datos',
      routeName: 'Nombre de la ruta', routeNamePh: 'Ej. Subida al collado',
      startEle: 'Altitud de salida (m)', startEleHelp: 'Sirve para estimar la altitud media de cada tramo y su efecto en el ritmo.',
      stageN: 'Tramo {n}', stageName: 'Nombre', dist: 'Distancia (km)', up: 'Subida (m)', down: 'Bajada (m)', terrainStage: 'Terreno', terrainGlobal: 'Según ajustes',
      addStage: 'Añadir tramo', moveUp: 'Subir tramo', moveDown: 'Bajar tramo', dupStage: 'Duplicar tramo', delStage: 'Quitar tramo', loopBtn: 'Bajada = subida',
      totalOut: 'Total de la ida',
      itinerary: 'Itinerario', oneWay: 'Solo ida (o circular)', roundTrip: 'Ida y vuelta por el mismo camino',
      roundTripHelp: 'La vuelta repite los tramos al revés: lo que era subida pasa a ser bajada.',
      errDist: 'La distancia de cada tramo debe estar entre 0,1 y 500 km.', errNum: 'Subida y bajada deben estar entre 0 y 30 000 m.', errNoRoute: 'Añade al menos un tramo válido para ver el cálculo.',
      gpxDrop: 'Arrastra aquí un archivo GPX', gpxOr: 'o', gpxChoose: 'Elegir archivo', gpxPrivacy: 'Se lee en tu navegador; no se sube a ningún sitio.', gpxExample: 'Cargar ejemplo ficticio',
      gpxDistance: 'Distancia', gpxUp: 'Subida', gpxDown: 'Bajada', gpxMin: 'Cota mín.', gpxMax: 'Cota máx.', gpxPoints: 'Puntos', gpxRecorded: 'Duración registrada', gpxMoving: '{t} en marcha',
      noise: 'Umbral de ruido de altitud', noiseHelp: 'Los GPS fallan unos metros: solo cuentan los cambios de altitud mayores que este valor. 3 m va bien en la mayoría de casos.',
      useWpt: 'Usar los puntos de interés (waypoints) como tramos', wptFound: '{n} encontrados', splitEvery: 'Dividir cada (km; 0 = no)',
      calibrate: 'Calibrar mi ritmo con este track', calibrated: 'Ritmo calibrado: ×{x}', calibrateHelp: 'Ajusta tu factor personal para que el tiempo estimado coincida con el tiempo en marcha de este track.',
      gpxNoEle: 'Este GPX no incluye altitudes. Indica el desnivel total aproximado:', gpxErr: 'No se ha podido leer ese archivo. ¿Es un GPX con un track o una ruta?', gpxReplace: 'Cambiar archivo', gpxRemove: 'Quitar', gpxTooBig: 'El archivo es demasiado grande (máx. 15 MB).', gpxLoaded: 'GPX cargado',
      level: 'Nivel de la persona más lenta del grupo',
      lv_relaxed: 'Paseo tranquilo', lv_relaxed_d: 'Con calma y paradas', lv_average: 'Medio', lv_average_d: 'Excursionista habitual', lv_fit: 'Ágil', lv_fit_d: 'Buena forma, ritmo vivo', lv_athlete: 'Muy entrenado', lv_athlete_d: 'Montañero fuerte, trail',
      custom: 'Ajuste personal fino', customHelp: '1,00 = sin ajuste. Por debajo vas más rápido que tu nivel; por encima, más despacio.',
      qzOpen: '¿No sabes tu nivel? Responde unas preguntas', qzTitle: 'Descubre tu nivel', qzIntro: 'Seis preguntas rápidas. Si vais en grupo, responde por la persona más lenta. Es solo una orientación: después puedes ajustar el nivel a mano.', qzSee: 'Ver mi nivel', qzMissing: 'Responde todas las preguntas para ver el resultado.', qzRes: 'Te recomendamos: {lvl}', qzScoreTxt: 'Puntuación {pts} de {max}. Ajuste fino sugerido: {adj}.', qzApply: 'Aplicar a mi ruta', qzRetry: 'Repetir', qzNoteRes: 'Es una estimación. Con tus primeras salidas, ajusta el nivel o calibra con un track GPX que ya conozcas.', qzClose: 'Cerrar', qzApplied: 'Nivel aplicado',
      pack: 'Peso de la mochila (kg)', packHelp: 'Hasta 5 kg no penaliza; a partir de ahí, +0,6 % de tiempo por kg.',
      terrain: 'Terreno', tr_path: 'Sendero marcado y bueno', tr_rough: 'Sendero irregular o pedregoso', tr_trackless: 'Sin sendero (campo a través)', tr_blocks: 'Bloques o pedrera', tr_scramble: 'Trepada fácil (grado I–II)',
      snow: 'Nieve y barro', sn_none: 'Sin nieve', sn_mud: 'Barro o suelo mojado', sn_hard: 'Nieve dura (crampones)', sn_soft: 'Nieve blanda (huella)', sn_deep: 'Nieve profunda',
      group: 'Personas en el grupo', groupHelp: 'Cada persona extra añade un 2 % por reagrupamientos (máx. 20 %). El ritmo lo marca la más lenta.',
      altNote: 'Por encima de 1 500 m se suma un 0,7 % de tiempo por cada 100 m de altitud media del tramo.',
      breaks: 'Paradas', breakEvery: 'Parada corta cada (min de marcha; 0 = ninguna)', breakLen: 'Duración de cada parada corta (min)', lunch: 'Comida (min)', extra: 'Otras paradas: cima, fotos… (min)',
      breaksHelp: 'La comida y las paradas extra se colocan en el punto de retorno (ida y vuelta) o hacia la mitad de la marcha.',
      date: 'Fecha', depart: 'Hora de salida', lat: 'Latitud (°N)', lon: 'Longitud (°E)', useLoc: 'Usar mi ubicación', locating: 'Buscando ubicación…', locDenied: 'No se ha podido obtener la ubicación.', locUnsupported: 'Tu navegador no permite obtener la ubicación.', locFromGpx: 'Coordenadas tomadas del inicio del track.',
      places: 'Zonas habituales', margin: 'Margen de seguridad con la luz (min)', marginHelp: 'El tiempo que quieres tener de sobra antes del atardecer.', tzNote: 'Las horas se muestran en la zona horaria de tu dispositivo.',
      sumTitle: 'Resumen', total: 'Tiempo total', marching: '{t} en marcha', stops: '{t} de paradas', noStops: 'sin paradas', depart2: 'Salida', arrive: 'Llegada',
      sDist: 'Distancia', sUp: 'Desnivel +', sDown: 'Desnivel −', sMax: 'Cota máxima', roundTripTag: 'ida y vuelta', approx: 'aprox.',
      sunrise: 'Amanecer', sunset: 'Atardecer', dawn: 'Inicio del crepúsculo', dusk: 'Fin del crepúsculo', daylight: 'Horas de luz',
      lightOk: 'Llegas con {t} de margen antes del atardecer ({sunset}).', lightTight: 'Margen justo: llegas {t} antes del atardecer ({sunset}). Lleva frontal.', lightLate: 'Llegarías {t} después del atardecer ({sunset}). Adelanta la salida o acorta la ruta.',
      lightDark: 'Unos {t} de marcha serían con poca luz o de noche: lleva frontal.', lightPolar: 'A esta latitud el sol no sale o no se pone ese día.', lightNoCoords: 'Indica las coordenadas para calcular el amanecer y el atardecer.',
      latestFinish: 'Hora límite para terminar', latestFinishHelp: 'atardecer menos {m} min de margen', turnHint: '¿Vas a volver por el mismo camino? Activa «Ida y vuelta» para ver la hora límite para dar la vuelta.', turnHintBtn: 'Activar ida y vuelta',
      srcWikiloc: 'Wikiloc', wlTitle: 'Importar desde Wikiloc', wlIntro: 'Otra web no puede leer las rutas de Wikiloc por sí sola, pero hay dos formas de traer sus datos sin descargar ningún archivo.', wlLink: 'Enlace de la ruta en Wikiloc (opcional)', wlLinkHelp: 'Se guarda con la ruta y sale en la ficha y en el resumen.', wlOpen: 'Abrir en Wikiloc', wlLinkBad: 'Ese enlace no parece de wikiloc.com.', wlSeeLink: 'Ver en Wikiloc',
      wlOpt1: 'Opción 1 · Marcador de un clic', wlOpt1Text: 'Arrastra este botón a tu barra de marcadores. Luego, en cualquier ruta de Wikiloc, púlsalo: lee la distancia y el desnivel de la página y abre esta calculadora con los datos rellenados.', wlBm: 'Calcular en luisfs.com', wlBmCopy: 'Copiar el enlace del marcador', wlBmCopied: 'Enlace del marcador copiado', wlBmHint: 'Si no puedes arrastrarlo, copia su enlace y créalo como marcador a mano. En móvil es más incómodo: usa la opción 2.', wlBmDrag: 'Arrástralo a la barra de marcadores', wlBmFail: 'No he encontrado la distancia y el desnivel en esta página. Abre antes una ruta de Wikiloc.',
      wlOpt2: 'Opción 2 · Pegar los datos', wlOpt2Text: 'En la página de la ruta, selecciona el bloque con la distancia y el desnivel (o toda la página), cópialo y pégalo aquí.', wlPaste: 'Pega aquí los datos de la ruta', wlRead: 'He leído', wlNothing: 'No encuentro la distancia en ese texto. Copia también la línea que dice «Distancia».', wlUse: 'Usar estos datos', wlUsed: 'Datos de Wikiloc cargados', wlRoundHint: 'Si la ruta de Wikiloc ya incluye la vuelta, deja «Solo ida (o circular)»: su distancia ya es el total.', wlDist: 'Distancia', wlUp: 'Desnivel +', wlDown: 'Desnivel −', wlMax: 'Altitud máx.', wlMin: 'Altitud mín.', wlTime: 'Tiempo',
      latestDeparture: 'Hora límite de salida', latestDepartureHelp: 'para llegar {m} min antes del atardecer', latestTurn: 'Hora límite para dar la vuelta', turnPlanned: 'Previsto en el punto de retorno: {t}',
      turnLate: 'Llegarías al punto de retorno a las {t}: demasiado tarde. Debes dar la vuelta antes de las {limit}.',
      save: 'Guardar ruta', saved: 'Ruta guardada', copy: 'Copiar resumen', copied: 'Resumen copiado', printSheet: 'Imprimir ficha', share: 'Compartir', saveFail: 'No se ha podido guardar (¿almacenamiento lleno?).',
      profileTitle: 'Perfil de elevación', profileBack: 'Se muestra la ida; la vuelta repite el mismo perfil al revés.',
      schematic: 'Perfil esquemático: con datos escritos se supone que en cada tramo primero se sube y luego se baja. Carga un GPX para ver el perfil real.',
      hoverHint: 'Pasa el cursor (o el dedo) por el perfil', slope: 'pend.', hourAbbr: 'h', mapTitle: 'Trazado', mapNone: 'Carga un archivo GPX para ver el trazado de la ruta.',
      lgFlat: 'suave (<8 %)', lgMed: 'media (8–15 %)', lgSteep: 'fuerte (15–25 %)', lgVery: 'muy fuerte (>25 %)',
      methodsTitle: 'Comparación de métodos', recTitle: 'Tiempo de marcha recomendado', recSrc: 'Mediana de los cuatro métodos en cada tramo × tus factores. La franja marca del más rápido al más lento.',
      baseRef: 'Referencia: {t} (excursionista medio, sin ajustes)',
      m_naismith: 'Regla de Naismith + Langmuir', m_tobler: 'Función de Tobler', m_munter: 'Método Munter', m_din: 'Norma DIN 33466',
      f_naismith: 'T = dist/5 + subida/600 (h). Langmuir: −10 min por cada 300 m de bajada suave (5–12°); +10 min si es más fuerte (>12°)',
      f_tobler: 'v = 6·e^(−3,5·|pendiente + 0,05|) km/h, integrado sobre el perfil (máx. 6 km/h en bajada suave)',
      f_munter: 'T = (km + subida/100 + bajada/200) / 4 unidades por hora',
      f_din: 'T = mayor + ½ menor; horizontal = dist/4; vertical = subida/300 + bajada/500 (h)',
      s_naismith: 'W. W. Naismith (1892) · E. Langmuir (1984)', s_tobler: 'W. Tobler (1993) · tiende a ser optimista', s_munter: 'W. Munter · el descenso sigue la regla suiza bfu (200 m = 1 unidad)', s_din: 'DIN 33466 · la usa el Club Alpino Alemán (DAV)',
      factorsTitle: 'Factores aplicados al tiempo', fl_level: 'Nivel', fl_pack: 'Mochila', fl_terrain: 'Terreno', fl_snow: 'Nieve/barro', fl_group: 'Grupo', fl_alt: 'Altitud', fl_total: 'Total',
      scheduleTitle: 'Horario por tramos', c_stage: 'Tramo', c_dist: 'Dist.', c_up: '↑', c_down: '↓', c_move: 'Marcha', c_stop: 'Paradas', c_arrive: 'Llegada', backTag: 'vuelta', restHere: '+ {t} de parada', totalRow: 'Total',
      savedTitle: 'Rutas guardadas', savedNone: 'Aún no has guardado ninguna ruta. Se quedan solo en este navegador.', open: 'Abrir', del: 'Borrar', exportAll: 'Exportar todas (JSON)', importFile: 'Importar', importOk: '{n} rutas importadas', importErr: 'Ese archivo no es válido.', savedOn: 'Guardada el {d}', confirmDel: '¿Borrar la ruta «{n}»?', loaded: 'Ruta cargada', unnamed: 'Ruta sin nombre',
      safetyTitle: 'Antes de salir',
      safety1: 'Son estimaciones, no garantías: el tiempo real depende de la forma física, el terreno, la meteorología y el estado del camino.',
      safety2: 'Consulta la previsión meteorológica y el estado de la ruta, y comprueba el material y el nivel del grupo.',
      safety3: 'Avisa a alguien de tu recorrido y de tu hora de vuelta. En una emergencia, llama al 112.',
      safety4: 'La hora límite de vuelta es una ayuda para decidir: ante la duda, da la vuelta antes.',
      sheetMargin: 'Margen hasta el atardecer', sheetTitle: 'Ficha de salida', sheetN1: 'Contacto de emergencia', sheetN2: 'Previsión meteorológica', sheetN3: 'Plan B / escapatoria', sheetN4: 'Material y observaciones',
      sheetFoot: 'Estimaciones orientativas (Naismith, Tobler, Munter, DIN 33466) con ajustes personales. Calculadora de Luis Franco Serrano · luisfs.com', sheetTimes: 'Horario previsto', sheetSun: 'Luz del día', sheetProfile: 'Perfil de elevación',
      cpHead: 'Ruta: {name}', cp1: 'Fecha: {date} · Salida {dep} · Llegada prevista {arr}', cp2: 'Distancia {dist} km · Desnivel +{up} m / −{down} m{rt}', cp3: 'Tiempo total {total} ({move} en marcha + {stops} de paradas)', cp4: 'Amanecer {sr} · Atardecer {ss} · Hora límite de salida {ld}', cp5: 'Métodos (marcha): Naismith {a} · Tobler {b} · Munter {c} · DIN {d}', rtTxt: ' (ida y vuelta)',
      dayOfWeek: { weekday: 'long', day: 'numeric', month: 'long' }
    },
    ca: {
      title: 'Calculadora de rutes',
      heroTitle: 'Quant trigaràs en la teva propera sortida',
      heroText: 'Escriu la distància i el desnivell o carrega un track GPX. Compara quatre mètodes clàssics, ajusta el ritme al teu grup i comprova si et dona la llum.',
      tryExample: 'Prova amb una ruta d\'exemple',
      panelRoute: 'La ruta', panelPace: 'Ritme i condicions', panelDay: 'Jornada i llum',
      srcManual: 'Escriure dades', srcGpx: 'Arxiu GPX', srcLabel: 'Origen de les dades',
      routeName: 'Nom de la ruta', routeNamePh: 'Ex. Pujada al coll',
      startEle: 'Altitud de sortida (m)', startEleHelp: 'Serveix per estimar l\'altitud mitjana de cada tram i el seu efecte en el ritme.',
      stageN: 'Tram {n}', stageName: 'Nom', dist: 'Distància (km)', up: 'Pujada (m)', down: 'Baixada (m)', terrainStage: 'Terreny', terrainGlobal: 'Segons els ajustos',
      addStage: 'Afegeix un tram', moveUp: 'Puja el tram', moveDown: 'Baixa el tram', dupStage: 'Duplica el tram', delStage: 'Treu el tram', loopBtn: 'Baixada = pujada',
      totalOut: 'Total de l\'anada',
      itinerary: 'Itinerari', oneWay: 'Només anada (o circular)', roundTrip: 'Anada i tornada pel mateix camí',
      roundTripHelp: 'La tornada repeteix els trams a l\'inrevés: el que era pujada passa a ser baixada.',
      errDist: 'La distància de cada tram ha d\'estar entre 0,1 i 500 km.', errNum: 'La pujada i la baixada han d\'estar entre 0 i 30 000 m.', errNoRoute: 'Afegeix almenys un tram vàlid per veure el càlcul.',
      gpxDrop: 'Arrossega aquí un arxiu GPX', gpxOr: 'o', gpxChoose: 'Tria un arxiu', gpxPrivacy: 'Es llegeix al teu navegador; no es puja enlloc.', gpxExample: 'Carrega l\'exemple fictici',
      gpxDistance: 'Distància', gpxUp: 'Pujada', gpxDown: 'Baixada', gpxMin: 'Cota mín.', gpxMax: 'Cota màx.', gpxPoints: 'Punts', gpxRecorded: 'Durada registrada', gpxMoving: '{t} en marxa',
      noise: 'Llindar de soroll d\'altitud', noiseHelp: 'Els GPS fallen uns metres: només compten els canvis d\'altitud més grans que aquest valor. 3 m va bé en la majoria de casos.',
      useWpt: 'Fes servir els punts d\'interès (waypoints) com a trams', wptFound: '{n} trobats', splitEvery: 'Divideix cada (km; 0 = no)',
      calibrate: 'Calibra el meu ritme amb aquest track', calibrated: 'Ritme calibrat: ×{x}', calibrateHelp: 'Ajusta el teu factor personal perquè el temps estimat coincideixi amb el temps en marxa d\'aquest track.',
      gpxNoEle: 'Aquest GPX no inclou altituds. Indica el desnivell total aproximat:', gpxErr: 'No s\'ha pogut llegir aquest arxiu. És un GPX amb un track o una ruta?', gpxReplace: 'Canvia l\'arxiu', gpxRemove: 'Treu', gpxTooBig: 'L\'arxiu és massa gran (màx. 15 MB).', gpxLoaded: 'GPX carregat',
      level: 'Nivell de la persona més lenta del grup',
      lv_relaxed: 'Passeig tranquil', lv_relaxed_d: 'Amb calma i parades', lv_average: 'Mitjà', lv_average_d: 'Excursionista habitual', lv_fit: 'Àgil', lv_fit_d: 'Bona forma, ritme viu', lv_athlete: 'Molt entrenat', lv_athlete_d: 'Muntanyenc fort, trail',
      custom: 'Ajust personal fi', customHelp: '1,00 = sense ajust. Per sota vas més ràpid que el teu nivell; per sobre, més a poc a poc.',
      qzOpen: 'No saps el teu nivell? Respon unes preguntes', qzTitle: 'Descobreix el teu nivell', qzIntro: 'Sis preguntes ràpides. Si aneu en grup, respon per la persona més lenta. És només una orientació: després pots ajustar el nivell a mà.', qzSee: 'Veure el meu nivell', qzMissing: 'Respon totes les preguntes per veure el resultat.', qzRes: 'Et recomanem: {lvl}', qzScoreTxt: 'Puntuació {pts} de {max}. Ajust fi suggerit: {adj}.', qzApply: 'Aplica-ho a la meva ruta', qzRetry: 'Repeteix', qzNoteRes: 'És una estimació. Amb les primeres sortides, ajusta el nivell o calibra amb un track GPX que ja coneguis.', qzClose: 'Tanca', qzApplied: 'Nivell aplicat',
      pack: 'Pes de la motxilla (kg)', packHelp: 'Fins a 5 kg no penalitza; a partir d\'aquí, +0,6 % de temps per kg.',
      terrain: 'Terreny', tr_path: 'Camí marcat i bo', tr_rough: 'Camí irregular o pedregós', tr_trackless: 'Sense camí (a través)', tr_blocks: 'Blocs o tartera', tr_scramble: 'Grimpada fàcil (grau I–II)',
      snow: 'Neu i fang', sn_none: 'Sense neu', sn_mud: 'Fang o terra mullada', sn_hard: 'Neu dura (grampons)', sn_soft: 'Neu tova (petjada)', sn_deep: 'Neu profunda',
      group: 'Persones al grup', groupHelp: 'Cada persona extra afegeix un 2 % per reagrupaments (màx. 20 %). El ritme el marca la més lenta.',
      altNote: 'Per sobre de 1 500 m se suma un 0,7 % de temps per cada 100 m d\'altitud mitjana del tram.',
      breaks: 'Parades', breakEvery: 'Parada curta cada (min de marxa; 0 = cap)', breakLen: 'Durada de cada parada curta (min)', lunch: 'Dinar (min)', extra: 'Altres parades: cim, fotos… (min)',
      breaksHelp: 'El dinar i les parades extra es posen al punt de tornada (anada i tornada) o cap a la meitat de la marxa.',
      date: 'Data', depart: 'Hora de sortida', lat: 'Latitud (°N)', lon: 'Longitud (°E)', useLoc: 'Fes servir la meva ubicació', locating: 'Cercant la ubicació…', locDenied: 'No s\'ha pogut obtenir la ubicació.', locUnsupported: 'El teu navegador no permet obtenir la ubicació.', locFromGpx: 'Coordenades preses de l\'inici del track.',
      places: 'Zones habituals', margin: 'Marge de seguretat amb la llum (min)', marginHelp: 'El temps que vols tenir de sobra abans de la posta de sol.', tzNote: 'Les hores es mostren en el fus horari del teu dispositiu.',
      sumTitle: 'Resum', total: 'Temps total', marching: '{t} en marxa', stops: '{t} de parades', noStops: 'sense parades', depart2: 'Sortida', arrive: 'Arribada',
      sDist: 'Distància', sUp: 'Desnivell +', sDown: 'Desnivell −', sMax: 'Cota màxima', roundTripTag: 'anada i tornada', approx: 'aprox.',
      sunrise: 'Alba', sunset: 'Posta de sol', dawn: 'Inici del crepuscle', dusk: 'Fi del crepuscle', daylight: 'Hores de llum',
      lightOk: 'Arribes amb {t} de marge abans de la posta de sol ({sunset}).', lightTight: 'Marge just: arribes {t} abans de la posta de sol ({sunset}). Porta frontal.', lightLate: 'Arribaries {t} després de la posta de sol ({sunset}). Avança la sortida o escurça la ruta.',
      lightDark: 'Uns {t} de marxa serien amb poca llum o de nit: porta frontal.', lightPolar: 'A aquesta latitud el sol no surt o no es pon aquell dia.', lightNoCoords: 'Indica les coordenades per calcular l\'alba i la posta de sol.',
      latestFinish: 'Hora límit per acabar', latestFinishHelp: 'posta de sol menys {m} min de marge', turnHint: 'Tornaràs pel mateix camí? Activa «Anada i tornada» per veure l\'hora límit per girar cua.', turnHintBtn: 'Activa anada i tornada',
      srcWikiloc: 'Wikiloc', wlTitle: 'Importar des de Wikiloc', wlIntro: 'Una altra web no pot llegir les rutes de Wikiloc per si sola, però hi ha dues maneres de portar-ne les dades sense descarregar cap arxiu.', wlLink: 'Enllaç de la ruta a Wikiloc (opcional)', wlLinkHelp: 'Es desa amb la ruta i surt a la fitxa i al resum.', wlOpen: 'Obre a Wikiloc', wlLinkBad: 'Aquest enllaç no sembla de wikiloc.com.', wlSeeLink: 'Veure a Wikiloc',
      wlOpt1: 'Opció 1 · Marcador d\'un clic', wlOpt1Text: 'Arrossega aquest botó a la barra de marcadors. Després, en qualsevol ruta de Wikiloc, prem-lo: llegeix la distància i el desnivell de la pàgina i obre aquesta calculadora amb les dades emplenades.', wlBm: 'Calcula a luisfs.com', wlBmCopy: 'Copia l\'enllaç del marcador', wlBmCopied: 'Enllaç del marcador copiat', wlBmHint: 'Si no el pots arrossegar, copia\'n l\'enllaç i crea\'l com a marcador a mà. Al mòbil és més incòmode: fes servir l\'opció 2.', wlBmDrag: 'Arrossega\'l a la barra de marcadors', wlBmFail: 'No he trobat la distància i el desnivell en aquesta pàgina. Obre abans una ruta de Wikiloc.',
      wlOpt2: 'Opció 2 · Enganxar les dades', wlOpt2Text: 'A la pàgina de la ruta, selecciona el bloc amb la distància i el desnivell (o tota la pàgina), copia\'l i enganxa\'l aquí.', wlPaste: 'Enganxa aquí les dades de la ruta', wlRead: 'He llegit', wlNothing: 'No trobo la distància en aquest text. Copia també la línia que diu «Distància».', wlUse: 'Fes servir aquestes dades', wlUsed: 'Dades de Wikiloc carregades', wlRoundHint: 'Si la ruta de Wikiloc ja inclou la tornada, deixa «Només anada (o circular)»: la seva distància ja és el total.', wlDist: 'Distància', wlUp: 'Desnivell +', wlDown: 'Desnivell −', wlMax: 'Altitud màx.', wlMin: 'Altitud mín.', wlTime: 'Temps',
      latestDeparture: 'Hora límit de sortida', latestDepartureHelp: 'per arribar {m} min abans de la posta de sol', latestTurn: 'Hora límit per girar cua', turnPlanned: 'Previst al punt de tornada: {t}',
      turnLate: 'Arribaries al punt de tornada a les {t}: massa tard. Has de girar cua abans de les {limit}.',
      save: 'Desa la ruta', saved: 'Ruta desada', copy: 'Copia el resum', copied: 'Resum copiat', printSheet: 'Imprimeix la fitxa', share: 'Comparteix', saveFail: 'No s\'ha pogut desar (emmagatzematge ple?).',
      profileTitle: 'Perfil d\'elevació', profileBack: 'Es mostra l\'anada; la tornada repeteix el mateix perfil a l\'inrevés.',
      schematic: 'Perfil esquemàtic: amb dades escrites se suposa que en cada tram primer es puja i després es baixa. Carrega un GPX per veure el perfil real.',
      hoverHint: 'Passa el cursor (o el dit) pel perfil', slope: 'pend.', hourAbbr: 'h', mapTitle: 'Traçat', mapNone: 'Carrega un arxiu GPX per veure el traçat de la ruta.',
      lgFlat: 'suau (<8 %)', lgMed: 'mitjana (8–15 %)', lgSteep: 'forta (15–25 %)', lgVery: 'molt forta (>25 %)',
      methodsTitle: 'Comparació de mètodes', recTitle: 'Temps de marxa recomanat', recSrc: 'Mediana dels quatre mètodes a cada tram × els teus factors. La franja va del més ràpid al més lent.',
      baseRef: 'Referència: {t} (excursionista mitjà, sense ajustos)',
      m_naismith: 'Regla de Naismith + Langmuir', m_tobler: 'Funció de Tobler', m_munter: 'Mètode Munter', m_din: 'Norma DIN 33466',
      f_naismith: 'T = dist/5 + pujada/600 (h). Langmuir: −10 min per cada 300 m de baixada suau (5–12°); +10 min si és més forta (>12°)',
      f_tobler: 'v = 6·e^(−3,5·|pendent + 0,05|) km/h, integrat sobre el perfil (màx. 6 km/h en baixada suau)',
      f_munter: 'T = (km + pujada/100 + baixada/200) / 4 unitats per hora',
      f_din: 'T = el major + ½ el menor; horitzontal = dist/4; vertical = pujada/300 + baixada/500 (h)',
      s_naismith: 'W. W. Naismith (1892) · E. Langmuir (1984)', s_tobler: 'W. Tobler (1993) · tendeix a ser optimista', s_munter: 'W. Munter · el descens segueix la regla suïssa bfu (200 m = 1 unitat)', s_din: 'DIN 33466 · la fa servir el Club Alpí Alemany (DAV)',
      factorsTitle: 'Factors aplicats al temps', fl_level: 'Nivell', fl_pack: 'Motxilla', fl_terrain: 'Terreny', fl_snow: 'Neu/fang', fl_group: 'Grup', fl_alt: 'Altitud', fl_total: 'Total',
      scheduleTitle: 'Horari per trams', c_stage: 'Tram', c_dist: 'Dist.', c_up: '↑', c_down: '↓', c_move: 'Marxa', c_stop: 'Parades', c_arrive: 'Arribada', backTag: 'tornada', restHere: '+ {t} de parada', totalRow: 'Total',
      savedTitle: 'Rutes desades', savedNone: 'Encara no has desat cap ruta. Es queden només en aquest navegador.', open: 'Obre', del: 'Esborra', exportAll: 'Exporta-les totes (JSON)', importFile: 'Importa', importOk: '{n} rutes importades', importErr: 'Aquest arxiu no és vàlid.', savedOn: 'Desada el {d}', confirmDel: 'Vols esborrar la ruta «{n}»?', loaded: 'Ruta carregada', unnamed: 'Ruta sense nom',
      safetyTitle: 'Abans de sortir',
      safety1: 'Són estimacions, no garanties: el temps real depèn de la forma física, el terreny, la meteorologia i l\'estat del camí.',
      safety2: 'Consulta la previsió meteorològica i l\'estat de la ruta, i comprova el material i el nivell del grup.',
      safety3: 'Avisa algú del teu recorregut i de la teva hora de tornada. En una emergència, truca al 112.',
      safety4: 'L\'hora límit de tornada és una ajuda per decidir: en cas de dubte, gira cua abans.',
      sheetMargin: 'Marge fins a la posta de sol', sheetTitle: 'Fitxa de sortida', sheetN1: 'Contacte d\'emergència', sheetN2: 'Previsió meteorològica', sheetN3: 'Pla B / escapatòria', sheetN4: 'Material i observacions',
      sheetFoot: 'Estimacions orientatives (Naismith, Tobler, Munter, DIN 33466) amb ajustos personals. Calculadora de Luis Franco Serrano · luisfs.com', sheetTimes: 'Horari previst', sheetSun: 'Llum del dia', sheetProfile: 'Perfil d\'elevació',
      cpHead: 'Ruta: {name}', cp1: 'Data: {date} · Sortida {dep} · Arribada prevista {arr}', cp2: 'Distància {dist} km · Desnivell +{up} m / −{down} m{rt}', cp3: 'Temps total {total} ({move} en marxa + {stops} de parades)', cp4: 'Alba {sr} · Posta de sol {ss} · Hora límit de sortida {ld}', cp5: 'Mètodes (marxa): Naismith {a} · Tobler {b} · Munter {c} · DIN {d}', rtTxt: ' (anada i tornada)',
      dayOfWeek: { weekday: 'long', day: 'numeric', month: 'long' }
    },
    en: {
      title: 'Route time calculator',
      heroTitle: 'How long will your next outing take?',
      heroText: 'Enter the distance and elevation, or load a GPX track. Compare four classic methods, adjust the pace to your group and check whether the daylight will last.',
      tryExample: 'Try an example route',
      panelRoute: 'The route', panelPace: 'Pace and conditions', panelDay: 'Day and daylight',
      srcManual: 'Enter data', srcGpx: 'GPX file', srcLabel: 'Data source',
      routeName: 'Route name', routeNamePh: 'E.g. Climb to the pass',
      startEle: 'Starting altitude (m)', startEleHelp: 'Used to estimate the mean altitude of each stage and its effect on pace.',
      stageN: 'Stage {n}', stageName: 'Name', dist: 'Distance (km)', up: 'Ascent (m)', down: 'Descent (m)', terrainStage: 'Terrain', terrainGlobal: 'As in settings',
      addStage: 'Add stage', moveUp: 'Move stage up', moveDown: 'Move stage down', dupStage: 'Duplicate stage', delStage: 'Remove stage', loopBtn: 'Descent = ascent',
      totalOut: 'Outbound total',
      itinerary: 'Itinerary', oneWay: 'One way (or loop)', roundTrip: 'Out and back by the same route',
      roundTripHelp: 'The return repeats the stages in reverse: what was ascent becomes descent.',
      errDist: 'Each stage distance must be between 0.1 and 500 km.', errNum: 'Ascent and descent must be between 0 and 30,000 m.', errNoRoute: 'Add at least one valid stage to see the calculation.',
      gpxDrop: 'Drop a GPX file here', gpxOr: 'or', gpxChoose: 'Choose file', gpxPrivacy: 'It is read in your browser; nothing is uploaded.', gpxExample: 'Load fictional example',
      gpxDistance: 'Distance', gpxUp: 'Ascent', gpxDown: 'Descent', gpxMin: 'Min. alt.', gpxMax: 'Max. alt.', gpxPoints: 'Points', gpxRecorded: 'Recorded duration', gpxMoving: '{t} moving',
      noise: 'Altitude noise threshold', noiseHelp: 'GPS altitude is off by a few metres: only changes larger than this value are counted. 3 m works well in most cases.',
      useWpt: 'Use waypoints as stages', wptFound: '{n} found', splitEvery: 'Split every (km; 0 = off)',
      calibrate: 'Calibrate my pace with this track', calibrated: 'Pace calibrated: ×{x}', calibrateHelp: 'Sets your personal factor so the estimate matches this track\'s moving time.',
      gpxNoEle: 'This GPX has no elevation data. Enter the approximate total elevation change:', gpxErr: 'That file could not be read. Is it a GPX with a track or a route?', gpxReplace: 'Change file', gpxRemove: 'Remove', gpxTooBig: 'The file is too large (max. 15 MB).', gpxLoaded: 'GPX loaded',
      level: 'Level of the slowest person in the group',
      lv_relaxed: 'Easy stroll', lv_relaxed_d: 'Relaxed, with stops', lv_average: 'Average', lv_average_d: 'Regular hiker', lv_fit: 'Fit', lv_fit_d: 'Good shape, brisk pace', lv_athlete: 'Very fit', lv_athlete_d: 'Strong mountaineer, trail runner',
      custom: 'Personal fine-tuning', customHelp: '1.00 = no adjustment. Below it you are faster than your level; above, slower.',
      qzOpen: 'Not sure of your level? Answer a few questions', qzTitle: 'Find your level', qzIntro: 'Six quick questions. If you travel as a group, answer for the slowest person. It is only a guide: you can adjust the level by hand afterwards.', qzSee: 'See my level', qzMissing: 'Answer all the questions to see the result.', qzRes: 'We recommend: {lvl}', qzScoreTxt: 'Score {pts} of {max}. Suggested fine-tuning: {adj}.', qzApply: 'Apply to my route', qzRetry: 'Start again', qzNoteRes: 'This is an estimate. After your first outings, adjust the level or calibrate with a GPX track you already know.', qzClose: 'Close', qzApplied: 'Level applied',
      pack: 'Pack weight (kg)', packHelp: 'Up to 5 kg has no penalty; beyond that, +0.6% time per kg.',
      terrain: 'Terrain', tr_path: 'Good marked path', tr_rough: 'Rough or stony path', tr_trackless: 'Trackless (cross-country)', tr_blocks: 'Boulders or scree', tr_scramble: 'Easy scramble (grade I–II)',
      snow: 'Snow and mud', sn_none: 'No snow', sn_mud: 'Mud or wet ground', sn_hard: 'Hard snow (crampons)', sn_soft: 'Soft snow (postholing)', sn_deep: 'Deep snow',
      group: 'People in the group', groupHelp: 'Each extra person adds 2% for regrouping (max. 20%). The slowest person sets the pace.',
      altNote: 'Above 1,500 m, 0.7% extra time is added per 100 m of the stage\'s mean altitude.',
      breaks: 'Stops', breakEvery: 'Short break every (min of walking; 0 = none)', breakLen: 'Length of each short break (min)', lunch: 'Lunch (min)', extra: 'Other stops: summit, photos… (min)',
      breaksHelp: 'Lunch and extra stops are placed at the turning point (out and back) or around the middle of the walk.',
      date: 'Date', depart: 'Departure time', lat: 'Latitude (°N)', lon: 'Longitude (°E)', useLoc: 'Use my location', locating: 'Finding location…', locDenied: 'The location could not be obtained.', locUnsupported: 'Your browser cannot provide the location.', locFromGpx: 'Coordinates taken from the start of the track.',
      places: 'Common areas', margin: 'Daylight safety margin (min)', marginHelp: 'How much time you want to spare before sunset.', tzNote: 'Times are shown in your device\'s time zone.',
      sumTitle: 'Summary', total: 'Total time', marching: '{t} walking', stops: '{t} of stops', noStops: 'no stops', depart2: 'Start', arrive: 'Finish',
      sDist: 'Distance', sUp: 'Ascent', sDown: 'Descent', sMax: 'Highest point', roundTripTag: 'out and back', approx: 'approx.',
      sunrise: 'Sunrise', sunset: 'Sunset', dawn: 'Twilight begins', dusk: 'Twilight ends', daylight: 'Daylight',
      lightOk: 'You finish {t} before sunset ({sunset}).', lightTight: 'Tight margin: you finish {t} before sunset ({sunset}). Bring a headlamp.', lightLate: 'You would finish {t} after sunset ({sunset}). Start earlier or shorten the route.',
      lightDark: 'About {t} of walking would be in low light or darkness: bring a headlamp.', lightPolar: 'At this latitude the sun does not rise or set on that day.', lightNoCoords: 'Enter coordinates to calculate sunrise and sunset.',
      latestFinish: 'Finish-by time', latestFinishHelp: 'sunset minus {m} min margin', turnHint: 'Coming back the same way? Switch on "Out and back" to see the turn-around deadline.', turnHintBtn: 'Switch on out and back',
      srcWikiloc: 'Wikiloc', wlTitle: 'Import from Wikiloc', wlIntro: 'Another website cannot read Wikiloc routes on its own, but there are two ways to bring their data in without downloading any file.', wlLink: 'Wikiloc route link (optional)', wlLinkHelp: 'It is saved with the route and appears on the sheet and in the summary.', wlOpen: 'Open on Wikiloc', wlLinkBad: 'That link does not look like wikiloc.com.', wlSeeLink: 'See on Wikiloc',
      wlOpt1: 'Option 1 · One-click bookmarklet', wlOpt1Text: 'Drag this button to your bookmarks bar. Then, on any Wikiloc route, click it: it reads the distance and elevation from the page and opens this calculator with the data filled in.', wlBm: 'Calculate on luisfs.com', wlBmCopy: 'Copy the bookmarklet link', wlBmCopied: 'Bookmarklet link copied', wlBmHint: 'If you cannot drag it, copy its link and create the bookmark by hand. It is clumsier on a phone: use option 2.', wlBmDrag: 'Drag it to the bookmarks bar', wlBmFail: 'I could not find the distance and elevation on this page. Open a Wikiloc route first.',
      wlOpt2: 'Option 2 · Paste the data', wlOpt2Text: 'On the route page, select the block with the distance and elevation (or the whole page), copy it and paste it here.', wlPaste: 'Paste the route data here', wlRead: 'I read', wlNothing: 'I cannot find the distance in that text. Also copy the line that says "Distance".', wlUse: 'Use this data', wlUsed: 'Wikiloc data loaded', wlRoundHint: 'If the Wikiloc route already includes the return, leave "One way (or loop)": its distance is already the total.', wlDist: 'Distance', wlUp: 'Ascent', wlDown: 'Descent', wlMax: 'Max elevation', wlMin: 'Min elevation', wlTime: 'Time',
      latestDeparture: 'Latest start time', latestDepartureHelp: 'to finish {m} min before sunset', latestTurn: 'Turn-around deadline', turnPlanned: 'Planned at the turning point: {t}',
      turnLate: 'You would reach the turning point at {t}: too late. You must turn back before {limit}.',
      save: 'Save route', saved: 'Route saved', copy: 'Copy summary', copied: 'Summary copied', printSheet: 'Print sheet', share: 'Share', saveFail: 'Could not save (storage full?).',
      profileTitle: 'Elevation profile', profileBack: 'The outbound leg is shown; the return repeats the same profile in reverse.',
      schematic: 'Schematic profile: with typed data each stage is assumed to climb first and then descend. Load a GPX to see the real profile.',
      hoverHint: 'Hover (or touch) the profile', slope: 'slope', hourAbbr: '', mapTitle: 'Track', mapNone: 'Load a GPX file to see the route track.',
      lgFlat: 'gentle (<8%)', lgMed: 'moderate (8–15%)', lgSteep: 'steep (15–25%)', lgVery: 'very steep (>25%)',
      methodsTitle: 'Method comparison', recTitle: 'Recommended walking time', recSrc: 'Median of the four methods for each stage × your factors. The band runs from the fastest to the slowest.',
      baseRef: 'Reference: {t} (average hiker, no adjustments)',
      m_naismith: 'Naismith\'s rule + Langmuir', m_tobler: 'Tobler\'s function', m_munter: 'Munter method', m_din: 'DIN 33466',
      f_naismith: 'T = dist/5 + ascent/600 (h). Langmuir: −10 min per 300 m of gentle descent (5–12°); +10 min if steeper (>12°)',
      f_tobler: 'v = 6·e^(−3.5·|slope + 0.05|) km/h, integrated along the profile (max. 6 km/h on a gentle descent)',
      f_munter: 'T = (km + ascent/100 + descent/200) / 4 units per hour',
      f_din: 'T = larger + ½ smaller; horizontal = dist/4; vertical = ascent/300 + descent/500 (h)',
      s_naismith: 'W. W. Naismith (1892) · E. Langmuir (1984)', s_tobler: 'W. Tobler (1993) · tends to be optimistic', s_munter: 'W. Munter · descent follows the Swiss bfu rule (200 m = 1 unit)', s_din: 'DIN 33466 · used by the German Alpine Club (DAV)',
      factorsTitle: 'Factors applied to the time', fl_level: 'Level', fl_pack: 'Pack', fl_terrain: 'Terrain', fl_snow: 'Snow/mud', fl_group: 'Group', fl_alt: 'Altitude', fl_total: 'Total',
      scheduleTitle: 'Stage timetable', c_stage: 'Stage', c_dist: 'Dist.', c_up: '↑', c_down: '↓', c_move: 'Walking', c_stop: 'Stops', c_arrive: 'Arrival', backTag: 'return', restHere: '+ {t} stop', totalRow: 'Total',
      savedTitle: 'Saved routes', savedNone: 'You have not saved any route yet. They stay only in this browser.', open: 'Open', del: 'Delete', exportAll: 'Export all (JSON)', importFile: 'Import', importOk: '{n} routes imported', importErr: 'That file is not valid.', savedOn: 'Saved on {d}', confirmDel: 'Delete the route "{n}"?', loaded: 'Route loaded', unnamed: 'Unnamed route',
      safetyTitle: 'Before you go',
      safety1: 'These are estimates, not guarantees: real time depends on fitness, terrain, weather and trail conditions.',
      safety2: 'Check the weather forecast and route conditions, and make sure the gear and the group\'s level are right.',
      safety3: 'Tell someone your route and your return time. In an emergency, call 112 (or the local emergency number).',
      safety4: 'The turn-around deadline is a decision aid: when in doubt, turn back earlier.',
      sheetMargin: 'Margin before sunset', sheetTitle: 'Outing sheet', sheetN1: 'Emergency contact', sheetN2: 'Weather forecast', sheetN3: 'Plan B / escape route', sheetN4: 'Gear and notes',
      sheetFoot: 'Indicative estimates (Naismith, Tobler, Munter, DIN 33466) with personal adjustments. Calculator by Luis Franco Serrano · luisfs.com', sheetTimes: 'Planned timetable', sheetSun: 'Daylight', sheetProfile: 'Elevation profile',
      cpHead: 'Route: {name}', cp1: 'Date: {date} · Start {dep} · Expected finish {arr}', cp2: 'Distance {dist} km · Elevation +{up} m / −{down} m{rt}', cp3: 'Total time {total} ({move} walking + {stops} of stops)', cp4: 'Sunrise {sr} · Sunset {ss} · Latest start {ld}', cp5: 'Methods (walking): Naismith {a} · Tobler {b} · Munter {c} · DIN {d}', rtTxt: ' (out and back)',
      dayOfWeek: { weekday: 'long', day: 'numeric', month: 'long' }
    }
  };
  const t = K.i18n(DICT);

  /* ============================== utilidades ============================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const num = (v, def = NaN) => { if (v === '' || v == null) return def; const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : def; };
  const pad = (n) => String(n).padStart(2, '0');
  const fx2 = (v) => '×' + Number(v).toLocaleString(K.locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hm = (min) => { min = Math.max(0, Math.round(min)); const h = Math.floor(min / 60), m = min % 60; return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`; };
  const round5 = (min) => Math.round(min / 5) * 5;
  const clock = (d) => { if (!d || isNaN(d)) return '—'; const r = new Date(Math.round(d.getTime() / 300000) * 300000); return `${pad(r.getHours())}:${pad(r.getMinutes())}`; };
  const clockExact = (d) => (d && !isNaN(d)) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
  const addMin = (d, m) => new Date(d.getTime() + m * 60000);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const TERRAINS = ['path', 'rough', 'trackless', 'blocks', 'scramble'], SNOWS = ['none', 'mud', 'hard', 'soft', 'deep'], LEVELS = ['relaxed', 'average', 'fit', 'athlete'];
  const PLACES = [
    ['Pirineu · Pirineos', 42.5, 1.45], ['Montserrat', 41.6, 1.81], ['Sierra Nevada', 37.05, -3.31], ['Picos de Europa', 43.2, -4.85],
    ['Gredos', 40.25, -5.28], ['Teide', 28.27, -16.64], ['Mont Blanc', 45.83, 6.86], ['Dolomiti', 46.41, 11.84], ['Nepal · Annapurna', 28.6, 84.0]
  ];
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  /* ============================== estado ============================== */
  const defaultSettings = () => ({
    level: 'average', custom: 1, pack: 6, terrain: 'path', snow: 'none', group: 1,
    breakEvery: 60, breakLen: 10, lunch: 30, extra: 0, roundTrip: false,
    date: todayISO(), depart: '08:00', lat: 42.5, lon: 1.45, margin: 30
  });
  const newStage = (o = {}) => ({ id: K.uid(), name: '', dist: '10', up: '600', down: '600', terrain: '', ...o });
  const S = {
    source: 'manual', name: '', startEle: '1000', link: '', wlOpen: false,
    stages: [newStage()],
    gpx: null,
    set: { ...defaultSettings(), ...(store.get('settings') || {}) }
  };
  if (!['relaxed', 'average', 'fit', 'athlete'].includes(S.set.level)) S.set.level = 'average';
  S.set.date = todayISO(); // la fecha siempre empieza en hoy

  /* ---------- guardado compacto ---------- */
  const compactProf = (p) => p.map(q => [+q.d.toFixed(4), +q.e.toFixed(1), q.lat === null ? null : +q.lat.toFixed(5), q.lon === null ? null : +q.lon.toFixed(5)]);
  const expandProf = (a) => a.map(r => ({ d: r[0], e: r[1], lat: r[2], lon: r[3] }));
  function exportRoute() {
    const o = { source: S.source, name: S.name, link: S.link, startEle: S.startEle, stages: S.stages.map(s => ({ ...s })), set: { ...S.set } };
    if (S.gpx) {
      const g = S.gpx;
      o.gpx = { fileName: g.fileName, prof: compactProf(g.an.prof), waypoints: g.waypoints, useWpt: g.useWpt, every: g.every, noise: g.an.noise, hasEle: g.an.hasEle, count: g.an.count, recorded: g.an.recorded, mUp: g.mUp, mDown: g.mDown };
    }
    return o;
  }
  function anFromSaved(c) {
    const prof = expandProf(c.prof), es = prof.map(p => p.e), noise = c.noise || 3;
    const z = c.hasEle ? RC.zigzag(es, noise) : { up: 0, down: 0 };
    return { dist: prof[prof.length - 1].d, up: z.up, down: z.down, hasEle: c.hasEle, minEle: c.hasEle ? Math.min(...es) : null, maxEle: c.hasEle ? Math.max(...es) : null, prof, count: c.count || prof.length, recorded: c.recorded || null, noise };
  }
  function importRoute(o) {
    S.source = o.source === 'gpx' && o.gpx ? 'gpx' : 'manual';
    S.name = o.name || ''; S.link = o.link || ''; S.wlOpen = false; S.startEle = o.startEle ?? '1000';
    S.stages = (o.stages && o.stages.length ? o.stages : [newStage()]).map(s => ({ ...newStage(), ...s, id: K.uid() }));
    S.set = { ...defaultSettings(), ...(o.set || {}) }; S.set.date = todayISO();
    S.gpx = o.gpx ? { fileName: o.gpx.fileName, points: null, an: anFromSaved(o.gpx), waypoints: o.gpx.waypoints || [], useWpt: o.gpx.useWpt !== false, every: o.gpx.every || 0, mUp: o.gpx.mUp || '', mDown: o.gpx.mDown || '' } : null;
  }
  let draftTimer;
  const persist = () => { store.set('settings', S.set); clearTimeout(draftTimer); draftTimer = setTimeout(() => store.set('draft', exportRoute()), 500); };

  /* ============================== modelo ============================== */
  function buildSegments() {
    if (S.source === 'gpx') {
      if (!S.gpx) return { segs: [], prof: null };
      const an = S.gpx.an;
      const cps = RC.checkpoints(an, S.gpx.waypoints, { useWpt: S.gpx.useWpt, every: S.gpx.every });
      const segs = RC.trackSegments(an, cps, { label: (i) => t('stageN', { n: i }) });
      const mu = num(S.gpx.mUp, 0), md = num(S.gpx.mDown, 0);
      segs.forEach(g => {
        if (!an.hasEle) { g.up = mu * g.dist / an.dist; g.down = md * g.dist / an.dist; }
        g.alt = an.hasEle ? mean(g.prof.map(p => p.e)) : num(S.startEle, 0);
        g.terrain = '';
      });
      const prof = an.hasEle ? an.prof : RC.schematicProfile(segs, num(S.startEle, 0));
      return { segs, prof, schematic: !an.hasEle, gpx: true };
    }
    const segs = []; let e = num(S.startEle, 0); if (!Number.isFinite(e)) e = 0;
    S.stages.forEach((st, i) => {
      const d = num(st.dist), u = num(st.up, 0), dn = num(st.down, 0);
      st._err = { dist: !(d >= 0.1 && d <= 500), up: !(u >= 0 && u <= 30000), down: !(dn >= 0 && dn <= 30000) };
      if (!st._err.dist && !st._err.up && !st._err.down) {
        segs.push({ name: st.name || t('stageN', { n: i + 1 }), dist: d, up: u, down: dn, terrain: st.terrain || '', alt: e + (u - dn) / 2, e0: e });
        e += u - dn;
      }
    });
    return { segs, prof: segs.length ? RC.schematicProfile(segs, num(S.startEle, 0) || 0) : null, schematic: true };
  }

  function departDate() {
    const [y, m, d] = (S.set.date || todayISO()).split('-').map(Number), [hh, mm] = (S.set.depart || '08:00').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  }

  function lightModel(p, dep) {
    const lat = S.set.lat, lon = S.set.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return { none: true };
    const noon = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate(), 12, 0);
    const st = RC.sunTimes(noon, lat, lon);
    if (!st.sunrise || !st.sunset) return { polar: true };
    const arr = addMin(dep, p.duration), safety = S.set.margin || 0;
    const margin = (st.sunset - arr) / 60000;
    let dark = 0;
    if (st.dawn) dark += Math.max(0, Math.min(arr, st.dawn) - dep) / 60000;
    if (st.dusk) dark += Math.max(0, arr - Math.max(dep, st.dusk)) / 60000;
    const status = margin < 0 ? 'bad' : margin < safety + 30 ? 'warn' : 'ok';
    const out = { st, arr, margin, dark, status, safety, latestDeparture: addMin(st.sunset, -safety - p.duration) };
    if (p.backDuration !== null) {
      out.latestTurn = addMin(st.sunset, -safety - p.backDuration);
      out.plannedTurn = addMin(dep, p.turnaroundAt);
      out.turnLate = out.plannedTurn > out.latestTurn;
    }
    return out;
  }

  let M = null; // último modelo calculado
  function compute() {
    const b = buildSegments();
    if (!b.segs.length) { M = { empty: true, b }; return M; }
    const p = RC.plan(b.segs, S.set, !!S.set.roundTrip);
    const dep = departDate();
    const adj = {}; RC.METHODS.forEach(k => { adj[k] = p.legs.reduce((a, L) => a + L.methods[k] * L.factor.total, 0); });
    const fs = p.legs.map(L => L.factor);
    const fmin = (key) => Math.min(...fs.map(f => f[key])), fmax = (key) => Math.max(...fs.map(f => f[key]));
    let maxAlt = null, approx = false;
    if (b.gpx && S.gpx.an.hasEle) maxAlt = S.gpx.an.maxEle;
    else if (b.prof) { maxAlt = Math.max(...b.prof.map(q => q.e)); approx = true; }
    M = { b, p, dep, adj, fs, fmin, fmax, light: lightModel(p, dep), maxAlt, approx, dist1: b.segs.reduce((a, g) => a + g.dist, 0) };
    return M;
  }

  /* ============================== dibujo: auxiliares ============================== */
  function topoSVG() {
    const W = 1200, H = 300; const paths = [];
    const peaks = [{ x: 880, y: 150, r: 1, s: 1 }, { x: 1060, y: 70, r: .55, s: 2 }, { x: 640, y: 230, r: .5, s: 3 }];
    peaks.forEach(pk => {
      for (let k = 1; k <= 10; k++) {
        const base = k * 21 * pk.r, pts = [];
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) {
          const r = base * (1 + 0.16 * Math.sin(3 * a + k * .35 + pk.s) + 0.09 * Math.sin(5 * a + pk.s * 2) + 0.05 * Math.sin(7 * a + k * .2));
          pts.push(`${(pk.x + Math.cos(a) * r * 1.35).toFixed(1)},${(pk.y + Math.sin(a) * r).toFixed(1)}`);
        }
        paths.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#b08be0" stroke-opacity="${k % 5 === 0 ? .55 : .22}" stroke-width="${k % 5 === 0 ? 1.6 : .9}"/>`);
      }
    });
    return `<svg class="topo" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${paths.join('')}</svg>`;
  }

  const niceStep = (range, target = 5) => { const raw = range / target, mag = 10 ** Math.floor(Math.log10(raw)), n = raw / mag; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag; };
  const gradeClass = (pct) => { const a = Math.abs(pct); return a < 8 ? 1 : a < 15 ? 2 : a < 25 ? 3 : 4; };
  function slopesOf(P) {
    const raw = []; for (let i = 0; i < P.length - 1; i++) { const dd = (P[i + 1].d - P[i].d) * 1000; raw.push(dd > 0 ? (P[i + 1].e - P[i].e) / dd * 100 : 0); }
    if (raw.length < 30) return raw;
    return raw.map((_, i) => mean(raw.slice(Math.max(0, i - 3), i + 4)));
  }
  const runsOf = (P, sl) => {
    const runs = []; let cur = null;
    for (let i = 0; i < sl.length; i++) {
      const c = gradeClass(sl[i]);
      if (!cur || cur.c !== c) { cur = { c, idx: [i] }; runs.push(cur); }
      cur.idx.push(i + 1);
    }
    return runs;
  };

  let VIEW = null; // datos del gráfico para la interacción
  function profileSVG(model, { print = false } = {}) {
    const P = model.b.prof; if (!P || P.length < 2) return '';
    const W = 900, H = 320, m = { l: 66, r: 20, t: 30, b: 44 };
    const dist = P[P.length - 1].d || 1;
    const es = P.map(p => p.e), emin = Math.min(...es), emax = Math.max(...es), pad = Math.max(20, (emax - emin) * .1);
    const ystep = niceStep(Math.max(40, emax - emin + 2 * pad), 5);
    const lo = Math.floor((emin - pad) / ystep) * ystep, hi = Math.ceil((emax + pad) / ystep) * ystep;
    const x = (d) => m.l + d / dist * (W - m.l - m.r), y = (e) => m.t + (1 - (e - lo) / (hi - lo)) * (H - m.t - m.b);
    const sl = slopesOf(P), runs = runsOf(P, sl);
    const id = print ? 'p' : 's';
    let g = `<defs><linearGradient id="ga${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b08be0" stop-opacity="${print ? .35 : .5}"/><stop offset="1" stop-color="#2f8f9d" stop-opacity=".04"/></linearGradient></defs>`;
    g += '<g class="grid axis">';
    for (let v = lo; v <= hi + 1e-6; v += ystep) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${m.l - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${K.fmt(v, 0)} m</text>`;
    const xstep = niceStep(dist, 7);
    for (let v = 0; v <= dist + 1e-6; v += xstep) g += `<line x1="${x(v).toFixed(1)}" x2="${x(v).toFixed(1)}" y1="${m.t}" y2="${H - m.b}" opacity=".5"/><text x="${x(v).toFixed(1)}" y="${H - 14}" text-anchor="middle">${K.fmt(v, xstep < 1 ? 1 : 0)} km</text>`;
    g += '</g>';
    const area = `M${x(P[0].d).toFixed(1)},${y(lo)} ` + P.map(p => `L${x(p.d).toFixed(1)},${y(p.e).toFixed(1)}`).join(' ') + ` L${x(dist).toFixed(1)},${y(lo)} Z`;
    g += `<path d="${area}" fill="url(#ga${id})"/>`;
    runs.forEach(r => { g += `<path class="line c${r.c}" d="` + r.idx.map((i, k) => `${k ? 'L' : 'M'}${x(P[i].d).toFixed(1)},${y(P[i].e).toFixed(1)}`).join(' ') + '"/>'; });
    // separaciones entre tramos
    let acc = 0;
    model.b.segs.forEach((s, i) => {
      if (i > 0) g += `<line class="sep" x1="${x(acc).toFixed(1)}" x2="${x(acc).toFixed(1)}" y1="${m.t - 8}" y2="${H - m.b}"/>`;
      g += `<text x="${(x(acc + s.dist / 2)).toFixed(1)}" y="${m.t - 12}" text-anchor="middle" opacity=".9">${i + 1}</text>`;
      acc += s.dist;
    });
    if (!print) g += `<g class="xh" id="rt-xh" style="display:none"><line id="rt-xl" y1="${m.t}" y2="${H - m.b}"/><circle id="rt-xd" r="5"/></g><rect class="hit" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent"/>`;
    if (!print) VIEW = { P, sl, W, H, m, dist, x, y, lo, hi, model };
    return `<svg class="rt-chart" id="${print ? 'rt-prof-print' : 'rt-prof'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('profileTitle'))}">${g}</svg>`;
  }

  function mapSVG(model) {
    const P = model.b.gpx && S.gpx && S.gpx.an.prof; if (!P || P[0].lat == null) return '';
    const W = 420, H = 330, pd = 30;
    const lat0 = mean(P.map(p => p.lat)), kx = Math.cos(lat0 * Math.PI / 180);
    const pts = P.map(p => ({ x: p.lon * kx, y: -p.lat }));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sc = Math.min((W - 2 * pd) / ((x1 - x0) || 1e-6), (H - 2 * pd) / ((y1 - y0) || 1e-6));
    const ox = (W - (x1 - x0) * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
    const X = (i) => ox + (pts[i].x - x0) * sc, Y = (i) => oy + (pts[i].y - y0) * sc;
    const kmPerPx = 111.19 / sc; // km por unidad de pantalla (1 grado de latitud = 111,19 km)
    let g = '<g class="gridl">';
    const gs = niceStep(Math.max(W, H) * kmPerPx, 8); // paso de la cuadrícula en km
    const stepPx = gs / kmPerPx;
    for (let v = 0; v <= W; v += stepPx) g += `<line x1="${v.toFixed(1)}" x2="${v.toFixed(1)}" y1="0" y2="${H}"/>`;
    for (let v = 0; v <= H; v += stepPx) g += `<line x1="0" x2="${W}" y1="${v.toFixed(1)}" y2="${v.toFixed(1)}"/>`;
    g += '</g>';
    const sl = slopesOf(P), runs = runsOf(P, sl);
    runs.forEach(r => { g += `<path class="line c${r.c}" d="` + r.idx.map((i, k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)},${Y(i).toFixed(1)}`).join(' ') + '"/>'; });
    const last = P.length - 1;
    g += `<circle cx="${X(0).toFixed(1)}" cy="${Y(0).toFixed(1)}" r="6" fill="#4ade80" stroke="#0d1a2a" stroke-width="2"/>`;
    g += `<circle cx="${X(last).toFixed(1)}" cy="${Y(last).toFixed(1)}" r="6" fill="#f87171" stroke="#0d1a2a" stroke-width="2"/>`;
    let acc = 0;
    model.b.segs.forEach((s, i) => {
      acc += s.dist; if (i === model.b.segs.length - 1) return;
      let k = 0; while (k < P.length - 1 && P[k].d < acc) k++;
      g += `<g class="pt"><circle cx="${X(k).toFixed(1)}" cy="${Y(k).toFixed(1)}" r="9"/><text x="${X(k).toFixed(1)}" y="${(Y(k) + 3.5).toFixed(1)}" text-anchor="middle">${i + 1}</text></g>`;
    });
    g += `<circle id="rt-mapdot" r="6" fill="#fff" stroke="#0d1a2a" stroke-width="2.5" style="display:none"/>`;
    // barra de escala y norte
    const barKm = niceStep(W * kmPerPx / 4, 2), barPx = barKm / kmPerPx;
    g += `<g transform="translate(16,${H - 18})"><line x1="0" x2="${barPx.toFixed(1)}" y1="0" y2="0" stroke="#fff" stroke-width="2.5"/><line x1="0" x2="0" y1="-4" y2="4" stroke="#fff" stroke-width="2"/><line x1="${barPx.toFixed(1)}" x2="${barPx.toFixed(1)}" y1="-4" y2="4" stroke="#fff" stroke-width="2"/><text x="0" y="-9">${K.fmt(barKm, barKm < 1 ? 1 : 0)} km</text></g>`;
    g += `<g transform="translate(26,34)"><path d="M0,-16 L7,8 L0,3 L-7,8 Z" fill="#fff"/><text x="0" y="24" text-anchor="middle">N</text></g>`;
    VIEW && (VIEW.map = { X, Y });
    return `<svg class="rt-chart rt-map" id="rt-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('mapTitle'))}">${g}</svg>`;
  }

  function sunBarSVG(L, dep) {
    const W = 600, H = 124, X = (min) => K.clamp(min, 0, 1440) / 1440 * W;
    const mins = (d) => (d - new Date(dep.getFullYear(), dep.getMonth(), dep.getDate())) / 60000;
    const st = L.st, dw = mins(st.dawn || st.sunrise), sr = mins(st.sunrise), ss = mins(st.sunset), dk = mins(st.dusk || st.sunset);
    let g = `<rect x="0" y="34" width="${W}" height="36" rx="10" fill="#0b1626"/>`;
    g += `<rect x="${X(dw)}" y="34" width="${X(sr) - X(dw)}" height="36" fill="#7a5bb0"/>`;
    g += `<rect x="${X(sr)}" y="34" width="${X(ss) - X(sr)}" height="36" fill="#4f86bf"/>`;
    g += `<rect x="${X(ss)}" y="34" width="${X(dk) - X(ss)}" height="36" fill="#7a5bb0"/>`;
    const a = mins(dep), b = mins(L.arr);
    g += `<rect x="${X(a)}" y="40" width="${Math.max(4, X(b) - X(a))}" height="24" rx="7" fill="#fff" fill-opacity=".94"/>`;
    if (b > 1440) g += `<text x="${W - 6}" y="58" text-anchor="end" style="fill:#0d1a2a">▶ +1</text>`;
    g += `<text x="${K.clamp(X(sr), 44, W - 150)}" y="22" text-anchor="middle">☀ ${clockExact(st.sunrise)}</text><text x="${K.clamp(X(ss), 150, W - 44)}" y="22" text-anchor="middle">☾ ${clockExact(st.sunset)}</text>`;
    if (L.latestTurn) { const lt = mins(L.latestTurn); g += `<line x1="${X(lt)}" x2="${X(lt)}" y1="30" y2="78" stroke="#f5b82e" stroke-width="3"/><text x="${K.clamp(X(lt), 40, W - 40)}" y="96" text-anchor="middle" style="fill:#f5b82e">↩ ${clockExact(L.latestTurn)}</text>`; }
    for (let h = 0; h <= 24; h += 6) g += `<text x="${X(h * 60)}" y="118" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}" style="fill:#8ea0b5">${pad(h % 24)}:00</text>`;
    return `<svg class="rt-sunbar" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('panelDay'))}">${g}</svg>`;
  }

  /* ============================== HTML: formulario ============================== */
  const opt = (arr, val, labelFn) => arr.map(v => `<option value="${v}"${v === val ? ' selected' : ''}>${esc(labelFn(v))}</option>`).join('');
  const levelButtons = () => LEVELS.map(l => `<button type="button" class="rt-level" data-level="${l}" aria-pressed="${S.set.level === l}"><b>${esc(t('lv_' + l))}</b><small class="muted">${esc(t('lv_' + l + '_d'))}</small></button>`).join('');

  function stageRow(st, i, n) {
    return `<div class="rt-stage" data-id="${st.id}">
      <label class="cell name"><span class="lbl">${esc(t('stageName'))}</span><input type="text" data-sf="name" value="${esc(st.name)}" placeholder="${esc(t('stageN', { n: i + 1 }))}" maxlength="40"></label>
      <label class="cell"><span class="lbl">${esc(t('dist'))}</span><input type="text" inputmode="decimal" data-sf="dist" value="${esc(st.dist)}" aria-label="${esc(t('dist'))}"></label>
      <label class="cell"><span class="lbl">${esc(t('up'))}</span><input type="text" inputmode="decimal" data-sf="up" value="${esc(st.up)}" aria-label="${esc(t('up'))}"></label>
      <label class="cell"><span class="lbl">${esc(t('down'))}</span><input type="text" inputmode="decimal" data-sf="down" value="${esc(st.down)}" aria-label="${esc(t('down'))}"></label>
      <label class="cell terr"><span class="lbl">${esc(t('terrainStage'))}</span><select data-sf="terrain"><option value="">${esc(t('terrainGlobal'))}</option>${opt(TERRAINS, st.terrain, v => t('tr_' + v))}</select></label>
      <div class="acts">
        <button type="button" class="icon-btn" data-act="loop" title="${esc(t('loopBtn'))}" aria-label="${esc(t('loopBtn'))}">⇄</button>
        <button type="button" class="icon-btn" data-act="up" title="${esc(t('moveUp'))}" aria-label="${esc(t('moveUp'))}"${i === 0 ? ' disabled' : ''}>↑</button>
        <button type="button" class="icon-btn" data-act="downrow" title="${esc(t('moveDown'))}" aria-label="${esc(t('moveDown'))}"${i === n - 1 ? ' disabled' : ''}>↓</button>
        <button type="button" class="icon-btn" data-act="dup" title="${esc(t('dupStage'))}" aria-label="${esc(t('dupStage'))}">⧉</button>
        <button type="button" class="icon-btn" data-act="del" title="${esc(t('delStage'))}" aria-label="${esc(t('delStage'))}"${n === 1 ? ' disabled' : ''}>✕</button>
      </div></div>`;
  }

  function routePanel() {
    const manual = S.source === 'manual';
    let body = '';
    if (S.wlOpen) {
      body = wikilocHTML();
    } else if (manual) {
      body = `<div class="rt-two">
          <label class="field">${esc(t('startEle'))}<input type="text" inputmode="decimal" id="in-startEle" value="${esc(S.startEle)}"><small>${esc(t('startEleHelp'))}</small></label>
        </div>
        <div class="rt-stages" id="rt-stages" style="margin-top:14px">${S.stages.map((s, i) => stageRow(s, i, S.stages.length)).join('')}</div>
        <div class="row spread" style="margin-top:12px"><button type="button" class="btn ghost small" data-act="add">＋ ${esc(t('addStage'))}</button><div class="rt-sum" id="rt-stagesum"></div></div>
        <p class="rt-err" id="rt-stageerr" role="alert" hidden></p>`;
    } else if (!S.gpx) {
      body = `<div class="rt-drop" id="rt-drop">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#b08be0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18l5-8 4 5 3-4 6 7z"/><circle cx="17" cy="6" r="1.8"/></svg>
          <strong>${esc(t('gpxDrop'))}</strong>
          <span class="muted">${esc(t('gpxOr'))}</span>
          <div class="row" style="justify-content:center"><label class="btn small" for="rt-file">${esc(t('gpxChoose'))}</label><button type="button" class="btn ghost small" data-act="example">${esc(t('gpxExample'))}</button></div>
          <input type="file" id="rt-file" accept=".gpx,application/gpx+xml,application/xml,text/xml" class="sr-only">
          <small class="muted">${esc(t('gpxPrivacy'))}</small></div>
        <p class="rt-err" id="rt-gpxerr" role="alert" hidden></p>`;
    } else {
      const g = S.gpx, an = g.an, wn = g.waypoints.length;
      body = `<div class="rt-file"><span class="name">${esc(g.fileName || 'GPX')}</span>
          <label class="btn ghost small" for="rt-file">${esc(t('gpxReplace'))}</label><button type="button" class="btn danger small" data-act="gpxoff">${esc(t('gpxRemove'))}</button>
          <input type="file" id="rt-file" accept=".gpx,application/gpx+xml,application/xml,text/xml" class="sr-only"></div>
        <div class="rt-gpxstats" id="rt-gpxstats"></div>
        <div class="rt-two" style="margin-top:14px">
          <label class="field"><span class="row spread" style="gap:8px"><span>${esc(t('noise'))}</span><b id="rt-noiseval">${an.noise} m</b></span><input type="range" id="rt-noise" min="1" max="15" step="1" value="${an.noise}"><small>${esc(t('noiseHelp'))}</small></label>
          <label class="field">${esc(t('splitEvery'))}<input type="text" inputmode="decimal" id="rt-every" value="${g.every || 0}"></label>
        </div>
        ${wn ? `<label class="check" style="margin-top:12px"><input type="checkbox" id="rt-usewpt"${g.useWpt ? ' checked' : ''}> ${esc(t('useWpt'))} <span class="chip">${esc(t('wptFound', { n: wn }))}</span></label>` : ''}
        ${!an.hasEle ? `<div class="rt-two" style="margin-top:12px"><p class="rt-hint" style="grid-column:1/-1">${esc(t('gpxNoEle'))}</p>
          <label class="field">${esc(t('up'))}<input type="text" inputmode="decimal" id="rt-mup" value="${esc(g.mUp)}"></label><label class="field">${esc(t('down'))}<input type="text" inputmode="decimal" id="rt-mdown" value="${esc(g.mDown)}"></label>
          <label class="field">${esc(t('startEle'))}<input type="text" inputmode="decimal" id="in-startEle" value="${esc(S.startEle)}"></label></div>` : ''}
        ${an.recorded ? `<div class="row" style="margin-top:12px"><button type="button" class="btn ghost small" data-act="calibrate">${esc(t('calibrate'))}</button><small class="muted">${esc(t('calibrateHelp'))}</small></div>` : ''}
        <p class="rt-err" id="rt-gpxerr" role="alert" hidden></p>`;
    }
    return `<h2><span class="ico" aria-hidden="true">⛰</span>${esc(t('panelRoute'))}</h2>
      <div class="stack">
        <label class="field">${esc(t('routeName'))}<input type="text" id="in-name" value="${esc(S.name)}" placeholder="${esc(t('routeNamePh'))}" maxlength="60"></label>${S.link ? `<div><a class="rt-wl-link" href="${esc(S.link)}" target="_blank" rel="noopener">${esc(t('wlSeeLink'))} ↗</a></div>` : ''}
        <div><div class="muted" style="font-weight:600;font-size:.95rem;margin-bottom:6px" id="lb-src">${esc(t('srcLabel'))}</div>
          <div class="seg" role="group" aria-labelledby="lb-src"><button type="button" data-src="manual" aria-pressed="${manual && !S.wlOpen}">${esc(t('srcManual'))}</button><button type="button" data-src="wikiloc" aria-pressed="${!!S.wlOpen}">${esc(t('srcWikiloc'))}</button><button type="button" data-src="gpx" aria-pressed="${!manual}">${esc(t('srcGpx'))}</button></div></div>
        ${body}
        <div><div class="muted" style="font-weight:600;font-size:.95rem;margin-bottom:6px" id="lb-it">${esc(t('itinerary'))}</div>
          <div class="seg" role="group" aria-labelledby="lb-it"><button type="button" data-rt="0" aria-pressed="${!S.set.roundTrip}">${esc(t('oneWay'))}</button><button type="button" data-rt="1" aria-pressed="${!!S.set.roundTrip}">${esc(t('roundTrip'))}</button></div>
          ${S.set.roundTrip ? `<p class="rt-hint">${esc(t('roundTripHelp'))}</p>` : ''}</div>
      </div>`;
  }

  function pacePanel() {
    const s = S.set;
    return `<h2><span class="ico" aria-hidden="true">⏱</span>${esc(t('panelPace'))}</h2>
      <div class="stack">
        <div><div class="muted" style="font-weight:600;font-size:.95rem;margin-bottom:6px">${esc(t('level'))}</div><div class="rt-levels" id="rt-levels">${levelButtons()}</div><div style="margin-top:10px"><button type="button" class="btn ghost small" data-act="quiz">${esc(t('qzOpen'))}</button></div></div>
        <label class="field">${esc(t('custom'))}<span class="rt-range"><input type="range" id="rt-custom" min="0.5" max="1.6" step="0.01" value="${s.custom}" data-set="custom" data-type="num"><output id="rt-customval" for="rt-custom">${fx2(s.custom)}</output></span><small>${esc(t('customHelp'))}</small></label>
        <div class="rt-two">
          <label class="field">${esc(t('pack'))}<input type="text" inputmode="decimal" data-set="pack" data-type="num" value="${s.pack}"><small>${esc(t('packHelp'))}</small></label>
          <label class="field">${esc(t('group'))}<input type="text" inputmode="numeric" data-set="group" data-type="num" value="${s.group}"><small>${esc(t('groupHelp'))}</small></label>
          <label class="field">${esc(t('terrain'))}<select data-set="terrain">${opt(TERRAINS, s.terrain, v => t('tr_' + v))}</select></label>
          <label class="field">${esc(t('snow'))}<select data-set="snow">${opt(SNOWS, s.snow, v => t('sn_' + v))}</select></label>
        </div>
        <p class="rt-hint">${esc(t('altNote'))}</p>
        <h3 style="margin:8px 0 0">${esc(t('breaks'))}</h3>
        <div class="rt-two">
          <label class="field">${esc(t('breakEvery'))}<input type="text" inputmode="numeric" data-set="breakEvery" data-type="num" value="${s.breakEvery}"></label>
          <label class="field">${esc(t('breakLen'))}<input type="text" inputmode="numeric" data-set="breakLen" data-type="num" value="${s.breakLen}"></label>
          <label class="field">${esc(t('lunch'))}<input type="text" inputmode="numeric" data-set="lunch" data-type="num" value="${s.lunch}"></label>
          <label class="field">${esc(t('extra'))}<input type="text" inputmode="numeric" data-set="extra" data-type="num" value="${s.extra}"></label>
        </div>
        <p class="rt-hint">${esc(t('breaksHelp'))}</p>
      </div>`;
  }

  function dayPanel() {
    const s = S.set;
    return `<h2><span class="ico" aria-hidden="true">☀</span>${esc(t('panelDay'))}</h2>
      <div class="stack">
        <div class="rt-two">
          <label class="field">${esc(t('date'))}<input type="date" data-set="date" value="${esc(s.date)}"></label>
          <label class="field">${esc(t('depart'))}<input type="time" data-set="depart" value="${esc(s.depart)}"></label>
          <label class="field">${esc(t('lat'))}<input type="text" inputmode="decimal" id="in-lat" data-set="lat" data-type="num" value="${Number.isFinite(s.lat) ? s.lat : ''}"></label>
          <label class="field">${esc(t('lon'))}<input type="text" inputmode="decimal" id="in-lon" data-set="lon" data-type="num" value="${Number.isFinite(s.lon) ? s.lon : ''}"></label>
        </div>
        <div class="row"><button type="button" class="btn ghost small" data-act="locate">⌖ ${esc(t('useLoc'))}</button><small class="muted" id="rt-locmsg" role="status"></small></div>
        <div><div class="muted" style="font-weight:600;font-size:.9rem;margin-bottom:6px">${esc(t('places'))}</div>
          <div class="rt-chips">${PLACES.map((p, i) => `<button type="button" class="chip" data-place="${i}">${esc(p[0])}</button>`).join('')}</div></div>
        <label class="field">${esc(t('margin'))}<input type="text" inputmode="numeric" data-set="margin" data-type="num" value="${s.margin}"><small>${esc(t('marginHelp'))}</small></label>
        <p class="rt-hint">${esc(t('tzNote'))}</p>
      </div>`;
  }

  /* ============================== HTML: resultados ============================== */
  function summaryHTML() {
    if (M.empty) return `<div class="rt-card"><div class="rt-empty">${esc(S.source === 'gpx' ? t('gpxDrop') : t('errNoRoute'))}</div></div>`;
    const { p, dep, light: L } = M;
    const arr = addMin(dep, p.duration);
    let lightHTML = '';
    if (L.none) lightHTML = `<div class="rt-light"><span class="dot" style="background:var(--faint)"></span><span>${esc(t('lightNoCoords'))}</span></div>`;
    else if (L.polar) lightHTML = `<div class="rt-light warn"><span class="dot"></span><span>${esc(t('lightPolar'))}</span></div>`;
    else {
      const msg = L.status === 'bad' ? t('lightLate', { t: hm(-L.margin), sunset: clockExact(L.st.sunset) }) : L.status === 'warn' ? t('lightTight', { t: hm(L.margin), sunset: clockExact(L.st.sunset) }) : t('lightOk', { t: hm(L.margin), sunset: clockExact(L.st.sunset) });
      lightHTML = `<div class="rt-light ${L.status}"><span class="dot"></span><span>${esc(msg)}${L.dark >= 10 ? '<br>' + esc(t('lightDark', { t: hm(L.dark) })) : ''}</span></div>`;
    }
    let limits = '';
    if (L && L.st) {
      limits += `<div><span>${esc(t('latestDeparture'))}<br><small class="muted">${esc(t('latestDepartureHelp', { m: L.safety }))}</small></span><b>${clock(L.latestDeparture)}</b></div>`;
      limits += `<div><span>${esc(t('latestFinish'))}<br><small class="muted">${esc(t('latestFinishHelp', { m: L.safety }))}</small></span><b>${clock(addMin(L.st.sunset, -L.safety))}</b></div>`;
      if (L.latestTurn) limits += `<div><span>${esc(t('latestTurn'))}<br><small class="muted">${esc(t('turnPlanned', { t: clock(L.plannedTurn) }))}</small></span><b>${clock(L.latestTurn)}</b></div>`;
      limits += `<div><span>${esc(t('sunrise'))} · ${esc(t('sunset'))}</span><b>${clockExact(L.st.sunrise)} · ${clockExact(L.st.sunset)}</b></div>`;
      limits += `<div><span>${esc(t('dawn'))} · ${esc(t('dusk'))}</span><b>${clockExact(L.st.dawn)} · ${clockExact(L.st.dusk)}</b></div>`;
      if (!S.set.roundTrip) limits += `<div class="rt-turnhint"><span>${esc(t('turnHint'))}</span><button type="button" class="btn ghost small" data-rt="1">${esc(t('turnHintBtn'))}</button></div>`;
    }
    const turnWarn = L && L.turnLate ? `<div class="rt-light bad"><span class="dot"></span><span>${esc(t('turnLate', { t: clock(L.plannedTurn), limit: clock(L.latestTurn) }))}</span></div>` : '';
    const rt = S.set.roundTrip;
    return `<div class="rt-card" id="rt-card">
      <div><div class="lbl">${esc(t('total'))}</div>
        <div class="rt-big">${hm(round5(p.duration)).replace(/^(\d+) h/, '$1<small>h</small>').replace(/(\d+) min/, '$1<small>min</small>')}</div>
        <div class="rt-sub">${esc(t('marching', { t: hm(round5(p.moving)) }))} · ${esc(p.breaks > 0 ? t('stops', { t: hm(round5(p.breaks)) }) : t('noStops'))}</div></div>
      <div class="rt-times"><div><span class="lbl">${esc(t('depart2'))}</span><b>${clockExact(dep)}</b></div><span class="arrow" aria-hidden="true">→</span><div style="text-align:right"><span class="lbl">${esc(t('arrive'))}</span><b>${clock(arr)}</b></div></div>
      ${L && L.st ? sunBarSVG(L, dep) : ''}
      ${lightHTML}${turnWarn}
      <div class="rt-facts">
        <div><b>${K.fmt(p.dist, 1)} km</b><span>${esc(t('sDist'))}${rt ? ' · ' + esc(t('roundTripTag')) : ''}</span></div>
        <div><b>${K.fmt(M.maxAlt, 0)} m</b><span>${esc(t('sMax'))}${M.approx ? ' (' + esc(t('approx')) + ')' : ''}</span></div>
        <div><b>+${K.fmt(p.up, 0)} m</b><span>${esc(t('sUp'))}</span></div>
        <div><b>−${K.fmt(p.down, 0)} m</b><span>${esc(t('sDown'))}</span></div>
      </div>
      ${limits ? `<div class="rt-limits">${limits}</div>` : ''}
      <div class="rt-actions no-print">
        <button type="button" class="btn small" data-act="save">${esc(t('save'))}</button>
        <button type="button" class="btn ghost small" data-act="copy">${esc(t('copy'))}</button>
        <button type="button" class="btn ghost small" data-act="print">${esc(t('printSheet'))}</button>
        ${navigator.share ? `<button type="button" class="btn ghost small" data-act="share">${esc(t('share'))}</button>` : ''}
      </div></div>`;
  }

  function clockAtDist(d) {
    if (!M || M.empty) return null;
    let acc = 0;
    for (const L of M.p.legs.filter(l => !l.back)) {
      if (d <= acc + L.dist + 1e-9) return addMin(M.dep, L.tStart + (L.dist ? (d - acc) / L.dist : 0) * L.moving);
      acc += L.dist;
    }
    return addMin(M.dep, M.p.turnaroundAt ?? M.p.duration);
  }

  function chartsHTML() {
    if (M.empty) return '';
    const hasMap = M.b.gpx && S.gpx && S.gpx.an.prof[0].lat != null;
    const prof = profileSVG(M);
    const legend = `<div class="rt-legend"><span><i style="background:var(--g1)"></i>${esc(t('lgFlat'))}</span><span><i style="background:var(--g2)"></i>${esc(t('lgMed'))}</span><span><i style="background:var(--g3)"></i>${esc(t('lgSteep'))}</span><span><i style="background:var(--g4)"></i>${esc(t('lgVery'))}</span></div>`;
    return `<section class="panel rt-panel"><h2><span class="ico" aria-hidden="true">📈</span>${esc(t('profileTitle'))}</h2>
      <div class="rt-charts"><div>
        <div class="rt-tipbar"><span id="rt-tip" class="muted">${esc(t('hoverHint'))}</span>${legend}</div>
        ${prof}
        ${M.b.schematic ? `<p class="rt-note">${esc(t('schematic'))}</p>` : ''}${S.set.roundTrip ? `<p class="rt-note">${esc(t('profileBack'))}</p>` : ''}</div>
        <div><div class="rt-tipbar"><strong>${esc(t('mapTitle'))}</strong></div>
        ${hasMap ? `<div class="rt-mapwrap">${mapSVG(M)}</div>` : `<div class="empty" style="padding:22px">${esc(t('mapNone'))}</div>`}</div></div></section>`;
  }

  function methodsHTML() {
    if (M.empty) return '';
    const { p, adj } = M, keys = RC.METHODS;
    const maxV = Math.max(...keys.map(k => adj[k]), p.moving, p.totals.max) * 1.06;
    const pct = (v) => (v / maxV * 100).toFixed(1) + '%';
    const card = (k) => `<div class="rt-method"><div><h3>${esc(t('m_' + k))}</h3><div class="src">${esc(t('s_' + k))}</div><code>${esc(t('f_' + k))}</code></div>
        <div><div class="rt-bar" aria-hidden="true"><i style="width:${pct(adj[k])}"></i><b>${hm(adj[k])}</b></div><span class="sr-only">${esc(t('m_' + k))}: ${hm(adj[k])}</span>
        <div class="rt-base">${esc(t('baseRef', { t: hm(p.totals[k]) }))}</div></div></div>`;
    const rec = `<div class="rt-method rec"><div><h3>${esc(t('recTitle'))}</h3><div class="src">${esc(t('recSrc'))}</div></div>
      <div><div class="rt-bar" aria-hidden="true"><i style="width:${pct(p.moving)}"></i><span class="band" style="left:${pct(p.totals.min)};width:${((p.totals.max - p.totals.min) / maxV * 100).toFixed(1)}%"></span><b>${hm(round5(p.moving))}</b></div>
      <span class="sr-only">${esc(t('recTitle'))}: ${hm(round5(p.moving))}</span>
      <div class="rt-base">${esc(t('baseRef', { t: hm(p.totals.med) }))} · ${hm(p.totals.min)} – ${hm(p.totals.max)}</div></div></div>`;
    const f = (key) => M.fmin(key) === M.fmax(key) ? fx2(M.fmin(key)) : `${fx2(M.fmin(key))}–${fx2(M.fmax(key)).slice(1)}`;
    const factors = ['level', 'pack', 'terrain', 'snow', 'group', 'alt'].map(k => `<span class="chip">${esc(t('fl_' + k))} <b>${f(k)}</b></span>`).join('') + `<span class="chip accent">${esc(t('fl_total'))} <b>${f('total')}</b></span>`;
    return `<section class="panel rt-panel"><h2><span class="ico" aria-hidden="true">⚖</span>${esc(t('methodsTitle'))}</h2>
      <div class="rt-methods">${rec}${keys.map(card).join('')}</div>
      <h3 style="margin-top:18px">${esc(t('factorsTitle'))}</h3><div class="rt-factors">${factors}</div></section>`;
  }

  function tableHTML() {
    if (M.empty) return '';
    const { p, dep } = M;
    const rows = p.legs.map(L => `<tr class="${L.back ? 'back' : ''}"><td>${L.back ? '↩ ' : ''}${esc(L.name)}${L.back ? ` <span class="muted">(${esc(t('backTag'))})</span>` : ''}</td>
      <td class="num">${K.fmt(L.dist, 1)}</td><td class="num">${K.fmt(L.up, 0)}</td><td class="num">${K.fmt(L.down, 0)}</td>
      <td class="num">${hm(L.moving)}</td><td class="num">${L.breakShort ? hm(L.breakShort) : '—'}</td>
      <td class="num"><b>${clock(addMin(dep, L.tArrive))}</b>${L.restAtEnd ? `<span class="rest">${esc(t('restHere', { t: hm(L.restAtEnd) }))}</span>` : ''}</td></tr>`).join('');
    return `<section class="panel rt-panel"><h2><span class="ico" aria-hidden="true">🕘</span>${esc(t('scheduleTitle'))}</h2>
      <div class="table-wrap"><table class="kit rt-table"><thead><tr><th>${esc(t('c_stage'))}</th><th class="num">${esc(t('c_dist'))}</th><th class="num">${esc(t('c_up'))}</th><th class="num">${esc(t('c_down'))}</th><th class="num">${esc(t('c_move'))}</th><th class="num">${esc(t('c_stop'))}</th><th class="num">${esc(t('c_arrive'))}</th></tr></thead>
      <tbody>${rows}<tr class="total"><td>${esc(t('totalRow'))}</td><td class="num">${K.fmt(p.dist, 1)}</td><td class="num">${K.fmt(p.up, 0)}</td><td class="num">${K.fmt(p.down, 0)}</td><td class="num">${hm(p.moving)}</td><td class="num">${hm(p.breaks)}</td><td class="num">${clock(addMin(dep, p.duration))}</td></tr></tbody></table></div></section>`;
  }

  function savedHTML() {
    const list = store.get('saved', []);
    const items = list.map(r => `<div class="rt-saved-item" data-id="${r.id}"><div><b>${esc(r.name || t('unnamed'))}</b><small>${esc(t('savedOn', { d: K.fmtDate(r.ts) }))} · ${esc(r.summary || '')}</small></div>
      <div class="row"><button type="button" class="btn small" data-act="open">${esc(t('open'))}</button><button type="button" class="btn danger small" data-act="delsaved">${esc(t('del'))}</button></div></div>`).join('');
    return `<section class="panel rt-panel"><h2><span class="ico" aria-hidden="true">💾</span>${esc(t('savedTitle'))}</h2>
      ${list.length ? `<div class="rt-saved">${items}</div>` : `<p class="muted">${esc(t('savedNone'))}</p>`}
      <div class="row" style="margin-top:14px"><button type="button" class="btn ghost small" data-act="exportall"${list.length ? '' : ' disabled'}>${esc(t('exportAll'))}</button>
      <label class="btn ghost small" for="rt-import">${esc(t('importFile'))}</label><input type="file" id="rt-import" accept=".json,application/json" class="sr-only"></div></section>`;
  }

  const safetyHTML = () => `<section class="panel rt-panel"><h2><span class="ico" aria-hidden="true">⚠</span>${esc(t('safetyTitle'))}</h2><div class="stack">${[1, 2, 3, 4].map(i => `<p class="disclaimer" style="margin:0">${esc(t('safety' + i))}</p>`).join('')}</div></section>`;

  function sheetHTML() {
    if (M.empty) return '';
    const { p, dep, light: L } = M;
    const name = S.name || t('unnamed');
    const dstr = dep.toLocaleDateString(K.locale(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const kv = (b, s) => `<div><b>${b}</b><span>${esc(s)}</span></div>`;
    const rows = p.legs.map(l => `<tr><td>${l.back ? '↩ ' : ''}${esc(l.name)}</td><td class="num">${K.fmt(l.dist, 1)}</td><td class="num">${K.fmt(l.up, 0)}</td><td class="num">${K.fmt(l.down, 0)}</td><td class="num">${hm(l.moving)}</td><td class="num"><b>${clock(addMin(dep, l.tArrive))}</b></td></tr>`).join('');
    const sun = L && L.st ? `<h2>${esc(t('sheetSun'))}</h2><div class="kv">${kv(clockExact(L.st.sunrise), t('sunrise'))}${kv(clockExact(L.st.sunset), t('sunset'))}${kv(clockExact(L.st.dawn), t('dawn'))}${kv(clockExact(L.st.dusk), t('dusk'))}</div>
      <div class="kv">${kv(clock(L.latestDeparture), t('latestDeparture'))}${L.latestTurn ? kv(clock(L.latestTurn), t('latestTurn')) : ''}${kv((L.margin < 0 ? '−' : '') + hm(Math.abs(L.margin)), t('sheetMargin'))}</div>` : '';
    return `<h1>${esc(name)}</h1>${S.link ? `<div>${esc(S.link)}</div>` : ''}<div>${esc(dstr)} · ${esc(t('depart2'))} ${clockExact(dep)} → ${esc(t('arrive'))} ${clock(addMin(dep, p.duration))}</div>
      <div class="kv">${kv(hm(round5(p.duration)), t('total'))}${kv(K.fmt(p.dist, 1) + ' km', t('sDist') + (S.set.roundTrip ? ' · ' + t('roundTripTag') : ''))}${kv('+' + K.fmt(p.up, 0) + ' / −' + K.fmt(p.down, 0) + ' m', t('sUp') + ' / ' + t('sDown'))}${kv(hm(round5(p.moving)), t('marching', { t: '' }).trim())}</div>
      <h2>${esc(t('sheetTimes'))}</h2><table><thead><tr><th>${esc(t('c_stage'))}</th><th class="num">${esc(t('c_dist'))}</th><th class="num">${esc(t('c_up'))}</th><th class="num">${esc(t('c_down'))}</th><th class="num">${esc(t('c_move'))}</th><th class="num">${esc(t('c_arrive'))}</th></tr></thead><tbody>${rows}</tbody></table>
      ${sun}<h2>${esc(t('sheetProfile'))}</h2>${profileSVG(M, { print: true })}
      <h2>${esc(t('safetyTitle'))}</h2><div class="notes"><div>${esc(t('sheetN1'))}</div><div>${esc(t('sheetN2'))}</div><div>${esc(t('sheetN3'))}</div><div>${esc(t('sheetN4'))}</div></div>
      <p class="small">${esc(t('safety1'))} ${esc(t('safety3'))}<br>${esc(t('sheetFoot'))}</p>`;
  }

  /* ============================== render ============================== */
  function renderAll() {
    document.title = t('title') + ' · Luis Franco Serrano';
    $('#app').innerHTML = `<div class="rt-screen">
      <section class="rt-hero">${topoSVG()}<h2>${esc(t('heroTitle'))}</h2><p>${esc(t('heroText'))}</p>
        <div class="row"><button type="button" class="btn" data-act="example2">${esc(t('tryExample'))}</button></div></section>
      <div class="rt-grid">
        <div class="rt-form">
          <section class="panel rt-panel" id="p-route">${routePanel()}</section>
          <section class="panel rt-panel" id="p-pace">${pacePanel()}</section>
          <section class="panel rt-panel" id="p-day">${dayPanel()}</section>
        </div>
        <aside class="rt-side" id="rt-side" aria-label="${esc(t('sumTitle'))}"></aside>
      </div>
      <div id="rt-detail" style="display:contents"></div>
      <div id="rt-saved" style="display:contents">${savedHTML()}</div>
      ${safetyHTML()}</div>
      <a class="rt-mini" id="rt-mini" href="#rt-side" hidden></a><div class="rt-sheet" id="rt-sheet"></div>`;
    update();
  }

  function renderRoute() { $('#p-route').innerHTML = routePanel(); update(); }

  function updateStageUI() {
    if (S.source === 'manual') {
      $$('#rt-stages .rt-stage').forEach(row => {
        const st = S.stages.find(s => s.id === row.dataset.id); if (!st || !st._err) return;
        ['dist', 'up', 'down'].forEach(f => { const el = row.querySelector(`[data-sf="${f}"]`); if (el) el.setAttribute('aria-invalid', st._err[f] ? 'true' : 'false'); });
      });
      const bad = S.stages.some(s => s._err && (s._err.dist || s._err.up || s._err.down));
      const msg = $('#rt-stageerr');
      if (msg) { msg.hidden = !bad; msg.textContent = bad ? (S.stages.some(s => s._err && s._err.dist) ? t('errDist') : t('errNum')) : ''; }
      const sum = $('#rt-stagesum');
      if (sum && M && !M.empty) { const ok = M.b.segs; sum.innerHTML = `<span>${esc(t('totalOut'))}:</span> <b>${K.fmt(ok.reduce((a, g) => a + g.dist, 0), 1)} km</b> <b>+${K.fmt(ok.reduce((a, g) => a + g.up, 0), 0)} m</b> <b>−${K.fmt(ok.reduce((a, g) => a + g.down, 0), 0)} m</b>`; }
      else if (sum) sum.textContent = '';
    } else if (S.gpx) {
      const el = $('#rt-gpxstats'), an = S.gpx.an;
      if (el) {
        const st = (b, l, wide) => `<div class="stat${wide ? ' wide' : ''}"><b>${b}</b><span>${esc(l)}</span></div>`;
        el.innerHTML = st(K.fmt(an.dist, 2) + ' km', t('gpxDistance')) + st(an.hasEle ? '+' + K.fmt(an.up, 0) + ' m' : '—', t('gpxUp')) + st(an.hasEle ? '−' + K.fmt(an.down, 0) + ' m' : '—', t('gpxDown')) +
          (an.hasEle ? st(K.fmt(an.minEle, 0) + ' m', t('gpxMin')) + st(K.fmt(an.maxEle, 0) + ' m', t('gpxMax')) : '') + st(K.fmt(an.count, 0), t('gpxPoints')) +
          (an.recorded ? st(hm(an.recorded.elapsedMin), t('gpxRecorded') + ' · ' + t('gpxMoving', { t: hm(an.recorded.movingMin) }), true) : '');
      }
    }
  }

  function update() {
    compute();
    updateStageUI();
    const side = $('#rt-side'); if (!side) return;
    side.innerHTML = summaryHTML();
    $('#rt-detail').innerHTML = M.empty ? '' : chartsHTML() + methodsHTML() + tableHTML();
    $('#rt-sheet').innerHTML = sheetHTML();
    const mini = $('#rt-mini');
    if (mini) { if (M.empty) mini.hidden = true; else { mini.hidden = false; mini.innerHTML = `<b>${hm(round5(M.p.duration))}</b><span>${esc(t('arrive'))} ${clock(addMin(M.dep, M.p.duration))}</span>`; } }
    bindChart();
  }

  /* ============================== interacción de los gráficos ============================== */
  function bindChart() {
    const svg = $('#rt-prof'); if (!svg || !VIEW) return;
    const V = VIEW, xh = $('#rt-xh', svg), xl = $('#rt-xl', svg), xd = $('#rt-xd', svg), tip = $('#rt-tip'), dot = $('#rt-mapdot');
    const hit = $('.hit', svg);
    const at = (clientX) => {
      const r = svg.getBoundingClientRect(), px = (clientX - r.left) / r.width * V.W;
      const d = K.clamp((px - V.m.l) / (V.W - V.m.l - V.m.r), 0, 1) * V.dist;
      let lo = 0, hi = V.P.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (V.P[mid].d <= d) lo = mid; else hi = mid; }
      const i = (d - V.P[lo].d) < (V.P[hi].d - d) ? lo : hi;
      return { d, i };
    };
    const show = (ev) => {
      const { d, i } = at(ev.clientX), p = V.P[i], s = V.sl[Math.min(i, V.sl.length - 1)] || 0;
      xh.style.display = ''; xl.setAttribute('x1', V.x(d)); xl.setAttribute('x2', V.x(d)); xd.setAttribute('cx', V.x(d)); xd.setAttribute('cy', V.y(p.e));
      const ck = clockAtDist(d);
      tip.textContent = `${K.fmt(d, 2)} km · ${K.fmt(p.e, 0)} m · ${t('slope')} ${s > 0 ? '+' : ''}${K.fmt(s, 0)} %${ck ? ' · ' + clock(ck) + (t('hourAbbr') ? ' ' + t('hourAbbr') : '') : ''}`;
      tip.classList.remove('muted');
      if (dot && V.map && p.lat != null) { dot.style.display = ''; dot.setAttribute('cx', V.map.X(i)); dot.setAttribute('cy', V.map.Y(i)); }
    };
    const hide = () => { xh.style.display = 'none'; tip.textContent = t('hoverHint'); tip.classList.add('muted'); if (dot) dot.style.display = 'none'; };
    hit.addEventListener('pointermove', show); hit.addEventListener('pointerdown', show); hit.addEventListener('pointerleave', hide);
  }

  /* ============================== acciones ============================== */
  async function loadGPXText(text, fileName) {
    try {
      const g = RC.parseGPX(text);
      const an = RC.analyzeTrack(g.points, { noise: 3 });
      if (!(an.dist > 0.05)) throw new Error('short');
      S.gpx = { fileName, points: g.points, an, waypoints: g.waypoints, useWpt: g.waypoints.length > 0, every: 0, mUp: '', mDown: '' };
      S.source = 'gpx';
      if (!S.name && g.name) S.name = g.name;
      S.set.lat = +g.points[0].lat.toFixed(4); S.set.lon = +g.points[0].lon.toFixed(4);
      if (!an.hasEle) S.startEle = S.startEle || '0';
      $('#p-day').innerHTML = dayPanel(); $('#rt-locmsg') && ($('#rt-locmsg').textContent = t('locFromGpx'));
      persist(); renderRoute();
      K.toast(t('gpxLoaded'));
    } catch (e) {
      console.warn(e);
      const el = $('#rt-gpxerr'); if (el) { el.hidden = false; el.textContent = t('gpxErr'); } else K.toast(t('gpxErr'));
    }
  }
  async function loadFile(file) {
    if (!file) return;
    const err = $('#rt-gpxerr'); if (err) err.hidden = true;
    if (file.size > 15 * 1024 * 1024) { if (err) { err.hidden = false; err.textContent = t('gpxTooBig'); } return; }
    loadGPXText(await K.readFile(file), file.name);
  }
  async function loadExample() {
    try { const r = await fetch('ejemplo.gpx'); if (!r.ok) throw new Error(r.status); await loadGPXText(await r.text(), 'ejemplo.gpx'); }
    catch (e) { K.toast(t('gpxErr')); }
  }

  function summaryText() {
    if (M.empty) return '';
    const { p, dep, light: L, adj } = M, f = (d) => clock(d);
    const lines = [t('cpHead', { name: S.name || t('unnamed') }),
      t('cp1', { date: dep.toLocaleDateString(K.locale(), { weekday: 'long', day: 'numeric', month: 'long' }), dep: clockExact(dep), arr: f(addMin(dep, p.duration)) }),
      t('cp2', { dist: K.fmt(p.dist, 1), up: K.fmt(p.up, 0), down: K.fmt(p.down, 0), rt: S.set.roundTrip ? t('rtTxt') : '' }),
      t('cp3', { total: hm(round5(p.duration)), move: hm(round5(p.moving)), stops: hm(round5(p.breaks)) })];
    if (L && L.st) lines.push(t('cp4', { sr: clockExact(L.st.sunrise), ss: clockExact(L.st.sunset), ld: f(L.latestDeparture) }));
    lines.push(t('cp5', { a: hm(adj.naismith), b: hm(adj.tobler), c: hm(adj.munter), d: hm(adj.din) }));
    if (S.link) lines.push(S.link);
    return lines.join('\n');
  }

  function saveCurrent() {
    if (M.empty) return;
    const list = store.get('saved', []);
    const entry = { id: K.uid(), name: S.name || '', ts: Date.now(), summary: `${K.fmt(M.p.dist, 1)} km · +${K.fmt(M.p.up, 0)} m · ${hm(round5(M.p.duration))}`, route: exportRoute() };
    list.unshift(entry);
    if (store.set('saved', list)) { K.toast(t('saved')); $('#rt-saved').innerHTML = savedHTML(); } else { list.shift(); K.toast(t('saveFail'), 3200); }
  }


  /* ============================== cuestionario de nivel ============================== */
  const Q = (es, ca, en) => ({ es, ca, en });
  const QUIZ = [
    { q: Q('¿Con qué frecuencia sales a caminar por montaña?', 'Amb quina freqüència surts a caminar per muntanya?', 'How often do you go hill walking?'),
      o: [[Q('Casi nunca (unas pocas veces al año)', 'Quasi mai (unes poques vegades l\'any)', 'Hardly ever (a few times a year)'), 0],
          [Q('Una o dos veces al mes', 'Una o dues vegades al mes', 'Once or twice a month'), 1],
          [Q('Casi todas las semanas', 'Quasi cada setmana', 'Almost every week'), 2],
          [Q('Varias veces por semana', 'Diverses vegades per setmana', 'Several times a week'), 3]] },
    { q: Q('¿Cuál ha sido tu salida más larga en un día, sin llegar al límite?', 'Quina ha estat la teva sortida més llarga en un dia, sense arribar al límit?', 'What is the longest outing you have done in a day, without reaching your limit?'),
      o: [[Q('Menos de 10 km o unas 3 horas', 'Menys de 10 km o unes 3 hores', 'Under 10 km or about 3 hours'), 0],
          [Q('De 10 a 15 km o unas 5 horas', 'De 10 a 15 km o unes 5 hores', '10 to 15 km or about 5 hours'), 1],
          [Q('De 15 a 22 km o unas 8 horas', 'De 15 a 22 km o unes 8 hores', '15 to 22 km or about 8 hours'), 2],
          [Q('Más de 22 km o más de 8 horas', 'Més de 22 km o més de 8 hores', 'Over 22 km or more than 8 hours'), 3]] },
    { q: Q('En una subida larga y constante, ¿cuánto desnivel ganas por hora a un ritmo cómodo?', 'En una pujada llarga i constant, quant desnivell guanyes per hora a un ritme còmode?', 'On a long, steady climb, how much height do you gain per hour at a comfortable pace?'),
      o: [[Q('Menos de 300 m por hora', 'Menys de 300 m per hora', 'Under 300 m per hour'), 0],
          [Q('Entre 300 y 400 m por hora', 'Entre 300 i 400 m per hora', '300 to 400 m per hour'), 1],
          [Q('Entre 400 y 550 m por hora', 'Entre 400 i 550 m per hora', '400 to 550 m per hour'), 2],
          [Q('Más de 550 m por hora', 'Més de 550 m per hora', 'Over 550 m per hour'), 3],
          [Q('No lo sé', 'No ho sé', 'I do not know'), 1]] },
    { q: Q('¿Practicas otros deportes de resistencia (correr, bici, natación…)?', 'Practiques altres esports de resistència (córrer, bici, natació…)?', 'Do you do other endurance sports (running, cycling, swimming…)?'),
      o: [[Q('No', 'No', 'No'), 0],
          [Q('Un día por semana', 'Un dia per setmana', 'One day a week'), 1],
          [Q('Dos o tres días por semana', 'Dos o tres dies per setmana', 'Two or three days a week'), 2],
          [Q('Cuatro o más días por semana', 'Quatre o més dies per setmana', 'Four or more days a week'), 3]] },
    { q: Q('¿Cómo te desenvuelves por terreno irregular o con mucha pendiente?', 'Com te\'n surts per terreny irregular o amb molt de pendent?', 'How do you cope with uneven or very steep ground?'),
      o: [[Q('Con inseguridad: voy muy despacio', 'Amb inseguretat: vaig molt a poc a poc', 'Not confidently: I go very slowly'), 0],
          [Q('Con prudencia: voy despacio', 'Amb prudència: vaig a poc a poc', 'Carefully: I go slowly'), 1],
          [Q('Bien, con soltura', 'Bé, amb soltesa', 'Well, with ease'), 2],
          [Q('Muy bien, también en trepadas y bajadas técnicas', 'Molt bé, també en grimpades i baixades tècniques', 'Very well, including scrambles and technical descents'), 3]] },
    { q: Q('¿Tienes alguna limitación física que te haga ir más despacio (rodillas, espalda, corazón…)?', 'Tens alguna limitació física que et faci anar més a poc a poc (genolls, esquena, cor…)?', 'Do you have any physical limitation that slows you down (knees, back, heart…)?'),
      o: [[Q('Ninguna', 'Cap', 'None'), 0],
          [Q('Leves', 'Lleus', 'Mild'), -1],
          [Q('Importantes', 'Importants', 'Significant'), -2]] }
  ];
  const QZ_MAX = 15, QZ_LEVELS = [['relaxed', 0, 4, 2], ['average', 5, 9, 7], ['fit', 10, 12, 11], ['athlete', 13, 15, 14]];

  function quizResult(points) {
    const pts = Math.max(0, Math.min(QZ_MAX, points));
    const lv = QZ_LEVELS.find(l => pts >= l[1] && pts <= l[2]) || QZ_LEVELS[1];
    const adj = Math.round(Math.max(0.9, Math.min(1.1, 1 - (pts - lv[3]) * 0.03)) * 100) / 100;
    return { pts, level: lv[0], adj };
  }
  function applyQuiz(res) {
    S.set.level = res.level; S.set.custom = res.adj;
    $$('#rt-levels .rt-level').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.level === res.level)));
    const r = $('#rt-custom'); if (r) r.value = res.adj;
    const o = $('#rt-customval'); if (o) o.textContent = fx2(res.adj);
    persist(); update(); K.toast(t('qzApplied') + ': ' + t('lv_' + res.level));
  }
  function openQuiz() {
    const lg = K.lang, pick = (o) => o[lg] || o.es;
    const d = document.createElement('dialog'); d.className = 'kit-dialog rt-quiz';
    d.innerHTML = `<h2>${esc(t('qzTitle'))}</h2><p class="muted">${esc(t('qzIntro'))}</p>
      <form id="qz-form">${QUIZ.map((q, i) => `<fieldset class="rt-q"><legend>${i + 1}. ${esc(pick(q.q))}</legend>${q.o.map((o, j) => `<label class="check"><input type="radio" name="q${i}" value="${o[1]}" data-j="${j}"> <span>${esc(pick(o[0]))}</span></label>`).join('')}</fieldset>`).join('')}</form>
      <div id="qz-res" role="status" aria-live="polite"></div>
      <div class="row"><button type="button" class="btn ghost" data-q="close">${esc(t('qzClose'))}</button><button type="button" class="btn" data-q="see">${esc(t('qzSee'))}</button></div>`;
    const close = () => { try { d.close(); } catch (_) { /* ya cerrado */ } d.remove(); };
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]'); if (!b) return;
      if (b.dataset.q === 'close') return close();
      if (b.dataset.q === 'retry') { d.querySelectorAll('input').forEach(i => { i.checked = false; }); $('#qz-res', d).innerHTML = ''; d.querySelector('[data-q="see"]').hidden = false; d.scrollTop = 0; return; }
      if (b.dataset.q === 'apply') { applyQuiz(d._res); return close(); }
      if (b.dataset.q === 'see') {
        const sel = QUIZ.map((q, i) => d.querySelector(`input[name="q${i}"]:checked`));
        if (sel.some(x => !x)) { $('#qz-res', d).innerHTML = `<p class="badge-warn">${esc(t('qzMissing'))}</p>`; return; }
        const res = quizResult(sel.reduce((s, x) => s + Number(x.value), 0)); d._res = res;
        $('#qz-res', d).innerHTML = `<div class="rt-qres"><h3>${esc(t('qzRes', { lvl: t('lv_' + res.level) }))}</h3><p>${esc(t('lv_' + res.level + '_d'))}</p>
          <p>${esc(t('qzScoreTxt', { pts: res.pts, max: QZ_MAX, adj: fx2(res.adj) }))}</p><p class="disclaimer">${esc(t('qzNoteRes'))}</p>
          <div class="row"><button type="button" class="btn" data-q="apply">${esc(t('qzApply'))}</button><button type="button" class="btn ghost" data-q="retry">${esc(t('qzRetry'))}</button></div></div>`;
        b.hidden = true; $('#qz-res', d).scrollIntoView({ block: 'nearest' });
      }
    });
    d.addEventListener('cancel', () => d.remove());
    document.body.append(d); d.showModal();
  }

  /* ============================== Wikiloc ==============================
     Esta función es AUTOSUFICIENTE (no usa nada de fuera): se reutiliza tal cual dentro
     del marcador (bookmarklet), que la ejecuta en la página de Wikiloc, y para el texto pegado. */
  function wlExtract(text) {
    var t = String(text || '').replace(/[\u00a0\u202f\u2009]/g, ' ');
    function toNum(s, kind) {
      var c = s.indexOf(','), d = s.indexOf('.'), x;
      if (c > -1 && d > -1) x = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
      else if (c > -1 || d > -1) {
        var sep = c > -1 ? ',' : '.', parts = s.split(sep);
        if (parts.length > 2) x = parts.join('');
        else if (kind === 'm' && parts[1].length === 3) x = parts.join('');
        else x = parts.join('.');
      } else x = s;
      return parseFloat(x);
    }
    var NUM = '(\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?)';
    var UD = '(km|kms|mi|miles?|millas?)', UM = '(m|metros?|meters?|metres|ft|feet|pies?)';
    var LABELS = {
      dist: 'distancia|distància|distance|entfernung|distanza|afstand',
      up: 'desnivel\\s+(?:positivo|acumulado)|desnivell\\s+positiu|elevation\\s+gain|total\\s+ascent|ascent|uphill|d[ée]nivel[ée]\\s+positif|aufstieg|anstieg|dislivello\\s+positivo|desn[ií]vel\\s+positivo|subida\\s+acumulada|pujada\\s+acumulada',
      down: 'desnivel\\s+negativo|desnivell\\s+negatiu|elevation\\s+loss|total\\s+descent|descent|downhill|d[ée]nivel[ée]\\s+n[ée]gatif|abstieg|dislivello\\s+negativo|desn[ií]vel\\s+negativo|bajada\\s+acumulada|baixada\\s+acumulada',
      max: 'altitud\\s+m[aá]xima|altitud\\s+màxima|cota\\s+m[aá]xima|max(?:imum)?\\.?\\s+elevation|highest\\s+point|altitude\\s+max(?:imale)?|h[oö]chster\\s+punkt|quota\\s+massima|altitude\\s+m[aá]xima',
      min: 'altitud\\s+m[ií]nima|cota\\s+m[ií]nima|min(?:imum)?\\.?\\s+elevation|lowest\\s+point|altitude\\s+min(?:imale)?|tiefster\\s+punkt|quota\\s+minima|altitude\\s+m[ií]nima'
    };
    var KIND = { dist: 'km', up: 'm', down: 'm', max: 'm', min: 'm' }, UNITS = { dist: UD, up: UM, down: UM, max: UM, min: UM };
    var marks = [];
    Object.keys(LABELS).forEach(function (k) {
      var re = new RegExp('(?:' + LABELS[k] + ')', 'ig'), m;
      while ((m = re.exec(t))) marks.push({ s: m.index, e: m.index + m[0].length, k: k });
    });
    marks.sort(function (a, b) { return a.s - b.s; });
    function conv(v, kind) {
      var n = toNum(v[1], kind), u = v[2].toLowerCase();
      if (!isFinite(n)) return null;
      if (/^(mi|mile|miles|milla|millas)$/.test(u)) n *= 1.609344;
      if (/^(ft|feet|pie|pies)$/.test(u)) n *= 0.3048;
      return n;
    }
    /* Dos disposiciones posibles: «etiqueta valor» (after) o «valor etiqueta» (before).
       Se prueban las dos y se usa la que reconoce más campos. */
    function run(mode) {
      var res = {}, found = 0;
      Object.keys(LABELS).forEach(function (k) {
        res[k] = null;
        for (var i = 0; i < marks.length && res[k] == null; i++) {
          var mk = marks[i]; if (mk.k !== k) continue;
          var re2 = new RegExp(NUM + '\\s*' + UNITS[k] + '\\b', 'ig'), v = null, win, j;
          if (mode === 'after') {
            var end = Math.min(mk.e + 70, t.length);
            for (j = i + 1; j < marks.length; j++) if (marks[j].s >= mk.e) { end = Math.min(end, marks[j].s); break; }
            win = t.slice(mk.e, end); v = re2.exec(win);
          } else {
            var start = Math.max(0, mk.s - 70);
            for (j = i - 1; j >= 0; j--) if (marks[j].e <= mk.s) { start = Math.max(start, marks[j].e); break; }
            win = t.slice(start, mk.s); var last = null, z; while ((z = re2.exec(win))) last = z; v = last;
          }
          if (v) { var n = conv(v, KIND[k]); if (n != null) { res[k] = n; found++; } }
        }
      });
      res._n = found; return res;
    }
    var A = run('after'), B = run('before'), pick = B._n > A._n ? B : A;
    var r = { dist: pick.dist, up: pick.up, down: pick.down, max: pick.max, min: pick.min, time: null };
    var tm = /(?:tiempo|temps|duraci[óo]n?|durada|moving\s+time|recorded\s+time|duration|dur[ée]e|dauer|durata)[^\d]{0,30}(\d{1,3}):(\d{2})(?::\d{2})?/i.exec(t);
    if (tm) r.time = (+tm[1]) * 60 + (+tm[2]);
    if (r.dist != null && (r.dist < 0.05 || r.dist > 1000)) r.dist = null;
    ['up', 'down'].forEach(function (k) { if (r[k] != null && (r[k] < 0 || r[k] > 20000)) r[k] = null; });
    return r;
  }
  const wlOk = (r) => r && (r.dist != null || r.up != null);
  const wlUrlOk = (u) => /^https?:\/\/([a-z0-9-]+\.)*wikiloc\.com\//i.test(String(u || '').trim());

  function wlBookmarkletHref() {
    const app = new URL('./', location.href).href;
    const code = '(function(){var P=' + wlExtract.toString() + ';var r=P(document.body.innerText);' +
      'if(!r||(r.dist==null&&r.up==null)){alert(' + JSON.stringify(t('wlBmFail')) + ');return;}' +
      'r.name=(document.title||"").replace(/\\s*[|]\\s*[Ww]ikiloc.*$/,"").replace(/\\s+-\\s+[^-]*$/,"").trim();r.url=location.href;' +
      'var u=' + JSON.stringify(app) + '+"#wl="+encodeURIComponent(JSON.stringify(r));if(!window.open(u,"_blank"))location.href=u;})()';
    return 'javascript:' + encodeURIComponent(code);
  }

  function wlPreviewHTML(r) {
    if (!wlOk(r)) return '';
    const chip = (k, v, u) => (v == null ? '' : `<span class="chip">${esc(t(k))} <b>${K.fmt(v, u === 'km' ? 2 : 0)} ${u}</b></span>`);
    return `<div class="stack" style="gap:6px"><small class="muted">${esc(t('wlRead'))}:</small><div class="row" style="gap:6px">${chip('wlDist', r.dist, 'km')}${chip('wlUp', r.up, 'm')}${chip('wlDown', r.down, 'm')}${chip('wlMax', r.max, 'm')}${chip('wlMin', r.min, 'm')}${r.time ? `<span class="chip">${esc(t('wlTime'))} <b>${hm(r.time)}</b></span>` : ''}</div></div>`;
  }

  function wikilocHTML() {
    return `<div class="rt-wl">
      <p class="muted">${esc(t('wlIntro'))}</p>
      <label class="field">${esc(t('wlLink'))}<input type="url" id="in-wllink" value="${esc(S.link)}" placeholder="https://www.wikiloc.com/…" autocomplete="off"><small id="wl-linkmsg">${esc(t('wlLinkHelp'))}</small></label>
      <div class="row"><button type="button" class="btn ghost small" data-act="wlopen">${esc(t('wlOpen'))} ↗</button></div>
      <div class="rt-wl-opt"><h3>${esc(t('wlOpt1'))}</h3><p>${esc(t('wlOpt1Text'))}</p>
        <div class="row"><a class="btn rt-wl-bm" id="wl-bm" href="${esc(wlBookmarkletHref())}" onclick="event.preventDefault();return false;" title="${esc(t('wlBmDrag'))}">★ ${esc(t('wlBm'))}</a>
          <button type="button" class="btn ghost small" data-act="wlbmcopy">${esc(t('wlBmCopy'))}</button></div>
        <small class="muted">${esc(t('wlBmHint'))}</small></div>
      <div class="rt-wl-opt"><h3>${esc(t('wlOpt2'))}</h3><p>${esc(t('wlOpt2Text'))}</p>
        <label class="field"><span class="sr-only">${esc(t('wlPaste'))}</span><textarea id="in-wltext" rows="5" placeholder="${esc(t('wlPaste'))}"></textarea></label>
        <div id="wl-prev" aria-live="polite"></div>
        <div class="row"><button type="button" class="btn" id="wl-use" data-act="wluse" disabled>${esc(t('wlUse'))}</button></div></div>
      <p class="disclaimer">${esc(t('wlRoundHint'))}</p></div>`;
  }

  function applyWikiloc(d) {
    const fx = (v) => (v == null || !Number.isFinite(+v) ? '' : String(+(+v).toFixed(2)));
    S.source = 'manual'; S.wlOpen = false;
    if (d.name && !S.name) S.name = String(d.name).slice(0, 60);
    if (d.url && wlUrlOk(d.url)) S.link = String(d.url);
    S.stages = [newStage({ name: '', dist: fx(d.dist) || '10', up: fx(d.up == null ? 0 : Math.round(d.up)), down: fx(d.down == null ? 0 : Math.round(d.down)) })];
    if (d.min != null && Number.isFinite(+d.min)) S.startEle = String(Math.round(d.min));
    persist(); renderAll(); K.toast(t('wlUsed'));
  }
  function takeWikilocHash() {
    const m = location.hash.match(/^#wl=(.+)$/); if (!m) return;
    try { const d = JSON.parse(decodeURIComponent(m[1])); if (wlOk(d)) applyWikiloc(d); } catch (e) { console.warn(e); }
    history.replaceState(null, '', location.pathname + location.search);
  }
  function bindWikiloc() {
    let wlData = null;
    document.addEventListener('input', (e) => {
      const el = e.target;
      if (el.id === 'in-wllink') {
        const v = el.value.trim(), msg = $('#wl-linkmsg');
        if (!v) { S.link = ''; if (msg) msg.textContent = t('wlLinkHelp'); }
        else if (wlUrlOk(v)) { S.link = v; if (msg) msg.textContent = t('wlLinkHelp'); }
        else if (msg) msg.textContent = t('wlLinkBad');
        persist();
      }
      if (el.id === 'in-wltext') {
        const r = wlExtract(el.value); wlData = wlOk(r) ? r : null;
        const prev = $('#wl-prev'), use = $('#wl-use');
        if (prev) prev.innerHTML = el.value.trim() ? (wlData ? wlPreviewHTML(r) : `<p class="badge-warn">${esc(t('wlNothing'))}</p>`) : '';
        if (use) use.disabled = !wlData;
        document.__wlData = wlData;
      }
    });
  }

  const ACTIONS = {
    quiz: () => openQuiz(),
    wlopen() { window.open(S.link && wlUrlOk(S.link) ? S.link : 'https://www.wikiloc.com/', '_blank', 'noopener'); },
    async wlbmcopy() { try { await navigator.clipboard.writeText(wlBookmarkletHref()); K.toast(t('wlBmCopied')); } catch (_) { K.toast(t('wlBmDrag')); } },
    wluse() { if (document.__wlData) applyWikiloc(document.__wlData); },
    add() { S.stages.push(newStage({ dist: '5', up: '300', down: '0' })); persist(); renderRoute(); },
    del(el) { const id = el.closest('.rt-stage').dataset.id; if (S.stages.length > 1) S.stages = S.stages.filter(s => s.id !== id); persist(); renderRoute(); },
    dup(el) { const id = el.closest('.rt-stage').dataset.id, i = S.stages.findIndex(s => s.id === id); S.stages.splice(i + 1, 0, { ...S.stages[i], id: K.uid() }); persist(); renderRoute(); },
    up(el) { const id = el.closest('.rt-stage').dataset.id, i = S.stages.findIndex(s => s.id === id); if (i > 0) { [S.stages[i - 1], S.stages[i]] = [S.stages[i], S.stages[i - 1]]; persist(); renderRoute(); } },
    downrow(el) { const id = el.closest('.rt-stage').dataset.id, i = S.stages.findIndex(s => s.id === id); if (i < S.stages.length - 1) { [S.stages[i + 1], S.stages[i]] = [S.stages[i], S.stages[i + 1]]; persist(); renderRoute(); } },
    loop(el) { const st = S.stages.find(s => s.id === el.closest('.rt-stage').dataset.id); st.down = st.up; persist(); const row = el.closest('.rt-stage'); row.querySelector('[data-sf="down"]').value = st.down; update(); },
    gpxoff() { S.gpx = null; persist(); renderRoute(); },
    example() { loadExample(); }, example2() { S.source = 'gpx'; loadExample(); $('#p-route').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    calibrate() {
      const an = S.gpx && S.gpx.an; if (!an || !an.recorded) return;
      const segs = RC.trackSegments(an, [], { label: () => '' }); segs.forEach(g => { g.alt = mean(g.prof.map(q => q.e)); });
      const base = RC.plan(segs, { ...S.set, breakEvery: 0, lunch: 0, extra: 0 }, false).moving / (S.set.custom || 1);
      const c = K.clamp(an.recorded.movingMin / base, 0.5, 1.6);
      S.set.custom = +c.toFixed(2); $('#rt-custom').value = S.set.custom; $('#rt-customval').textContent = fx2(S.set.custom);
      persist(); update(); K.toast(t('calibrated', { x: fx2(S.set.custom).slice(1) }));
    },
    locate() {
      const msg = $('#rt-locmsg');
      if (!navigator.geolocation) { msg.textContent = t('locUnsupported'); return; }
      msg.textContent = t('locating');
      navigator.geolocation.getCurrentPosition(pos => {
        S.set.lat = +pos.coords.latitude.toFixed(4); S.set.lon = +pos.coords.longitude.toFixed(4);
        $('#in-lat').value = S.set.lat; $('#in-lon').value = S.set.lon; msg.textContent = ''; persist(); update();
      }, () => { msg.textContent = t('locDenied'); }, { timeout: 10000, maximumAge: 600000 });
    },
    save() { saveCurrent(); },
    async copy() { try { await navigator.clipboard.writeText(summaryText()); K.toast(t('copied')); } catch (_) { K.toast(summaryText().split('\n')[0]); } },
    print() { window.print(); },
    async share() { try { await navigator.share({ title: S.name || t('title'), text: summaryText() }); } catch (_) { /* cancelado */ } },
    open(el) {
      const r = (store.get('saved', []).find(x => x.id === el.closest('.rt-saved-item').dataset.id) || {}).route; if (!r) return;
      importRoute(r); persist(); renderAll(); window.scrollTo({ top: 0, behavior: 'smooth' }); K.toast(t('loaded'));
    },
    async delsaved(el) {
      const id = el.closest('.rt-saved-item').dataset.id, list = store.get('saved', []), r = list.find(x => x.id === id); if (!r) return;
      if (await K.confirm(t('confirmDel', { n: r.name || t('unnamed') }), { okText: t('del'), danger: true })) { store.set('saved', list.filter(x => x.id !== id)); $('#rt-saved').innerHTML = savedHTML(); }
    },
    exportall() { K.download('rutas-guardadas.json', JSON.stringify({ app: 'ruta', version: 1, routes: store.get('saved', []) }, null, 1), 'application/json'); }
  };

  function setSetting(el) {
    const k = el.dataset.set; let v = el.value;
    if (el.dataset.type === 'num') {
      v = num(v, k === 'lat' || k === 'lon' ? NaN : 0);
      if (!Number.isFinite(v) && k !== 'lat' && k !== 'lon') v = 0;
      if (k === 'group') v = K.clamp(Math.round(v) || 1, 1, 60);
      if (['pack', 'breakEvery', 'breakLen', 'lunch', 'extra', 'margin'].includes(k)) v = K.clamp(v, 0, k === 'pack' ? 80 : 600);
    }
    S.set[k] = v;
    if (k === 'custom') $('#rt-customval').textContent = fx2(v);
    persist(); update();
  }

  function bindEvents() {
    const app = $('#app');
    app.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.set) return setSetting(el);
      if (el.dataset.sf) {
        const st = S.stages.find(s => s.id === el.closest('.rt-stage').dataset.id); if (!st) return;
        st[el.dataset.sf] = el.value; persist(); return update();
      }
      if (el.id === 'in-name') { S.name = el.value; persist(); return update(); }
      if (el.id === 'in-startEle') { S.startEle = el.value; persist(); return update(); }
      if (el.id === 'rt-noise' && S.gpx) { const v = +el.value; S.gpx.an.noise = v; const z = RC.zigzag(S.gpx.an.prof.map(p => p.e), v); S.gpx.an.up = z.up; S.gpx.an.down = z.down; $('#rt-noiseval').textContent = v + ' m'; persist(); return update(); }
      if (el.id === 'rt-every' && S.gpx) { S.gpx.every = Math.max(0, num(el.value, 0)); persist(); return update(); }
      if (el.id === 'rt-usewpt' && S.gpx) { S.gpx.useWpt = el.checked; persist(); return update(); }
      if (el.id === 'rt-mup' && S.gpx) { S.gpx.mUp = el.value; persist(); return update(); }
      if (el.id === 'rt-mdown' && S.gpx) { S.gpx.mDown = el.value; persist(); return update(); }
    });
    app.addEventListener('change', (e) => {
      const el = e.target;
      if (el.id === 'rt-file') loadFile(el.files[0]);
      if (el.id === 'rt-import') importFile(el.files[0]);
    });
    app.addEventListener('click', (e) => {
      const b = e.target.closest('button, [data-act]'); if (!b) return;
      if (b.dataset.act && ACTIONS[b.dataset.act]) return ACTIONS[b.dataset.act](b);
      if (b.dataset.src) { if (b.dataset.src === 'wikiloc') { S.wlOpen = true; S.source = 'manual'; } else { S.wlOpen = false; S.source = b.dataset.src; } persist(); return renderRoute(); }
      if (b.dataset.rt !== undefined) { S.set.roundTrip = b.dataset.rt === '1'; persist(); return renderRoute(); }
      if (b.dataset.level) { S.set.level = b.dataset.level; $$('#rt-levels .rt-level').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.level === S.set.level))); persist(); return update(); }
      if (b.dataset.place !== undefined) { const p = PLACES[+b.dataset.place]; S.set.lat = p[1]; S.set.lon = p[2]; $('#in-lat').value = p[1]; $('#in-lon').value = p[2]; persist(); return update(); }
    });
    // arrastrar y soltar un GPX
    app.addEventListener('dragover', (e) => { const d = e.target.closest('#rt-drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
    app.addEventListener('dragleave', (e) => { const d = e.target.closest('#rt-drop'); if (d) d.classList.remove('over'); });
    app.addEventListener('drop', (e) => { const d = e.target.closest('#rt-drop'); if (d) { e.preventDefault(); d.classList.remove('over'); loadFile(e.dataTransfer.files[0]); } });
  }

  async function importFile(file) {
    if (!file) return;
    try {
      const o = JSON.parse(await K.readFile(file));
      if (!o || o.app !== 'ruta' || !Array.isArray(o.routes)) throw new Error('bad');
      const list = store.get('saved', []);
      o.routes.forEach(r => { if (r && r.route) list.push({ ...r, id: K.uid() }); });
      store.set('saved', list); $('#rt-saved').innerHTML = savedHTML(); K.toast(t('importOk', { n: o.routes.length }));
    } catch (e) { K.toast(t('importErr')); }
  }

  /* ============================== arranque ============================== */
  K.mount({ titleKey: 'title' });
  const draft = store.get('draft');
  if (draft) { try { const keepSet = { ...S.set }; importRoute(draft); S.set = { ...keepSet, ...S.set, date: todayISO() }; } catch (e) { console.warn(e); } }
  bindEvents();
  bindWikiloc();
  K.onLang(() => renderAll());
  takeWikilocHash();
  renderAll();
})();
