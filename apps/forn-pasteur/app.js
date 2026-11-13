'use strict';
/* Interfície del simulador de forn Pasteur / estufa Poupinel. Tota la lògica de càlcul és a logic.js (window.ToolLogic)
   i les dades i textos a data.js (window.SimData). Sense dependències externes. */
(function () {
  const L = window.ToolLogic;
  const DATA = window.SimData;
  const CAT = DATA.catalog;
  const SEARCH = (window.location && window.location.search) || '';
  const HAS_CAMPUS = /[?&]campus=/.test(SEARCH);
  const EXAM = /[?&]campus=[a-f0-9]{48}/.test(SEARCH) || /[?&]mode=exam(?:&|$)/.test(SEARCH);

  /* ---------- Enllaç amb el campus: només si la URL porta ?campus= (càrrega dinàmica, opcional) ---------- */
  let linkPending = null;
  const report = L.reporter(function () { return window.CampusLink; });
  function loadCampusLink() {
    try {
      const s = document.createElement('script');
      s.src = '../campus-link/link.js';
      s.onload = function () { if (linkPending !== null) { report(linkPending); linkPending = null; } };
      s.onerror = function () { /* sense campus: la simulació continua igualment */ };
      document.head.appendChild(s);
    } catch (e) { /* ignora */ }
  }
  if (HAS_CAMPUS) loadCampusLink();
  function sendScore(score10) { if (!report(score10)) linkPending = score10; }

  /* ---------- Textos de la interfície ---------- */
  const UI = {
    ca: {
      back: '← Tornar', langbtn: 'Castellano', home: 'Menú', note: 'Eina d\'estudi i consulta; segueix sempre el protocol del teu centre.',
      modePractice: 'Mode pràctica', modeExam: 'Mode avaluable',
      homePracticeIntro: 'Tria un escenari. En mode pràctica tens avisos, pistes i explicacions a cada pas, i pots repetir tantes vegades com vulguis.',
      prepGroup: 'Preparar i executar un cicle', diagGroup: 'Diagnosticar un cicle ja fet', freeGroup: 'Exploració',
      level: (n) => 'Nivell ' + n, guide: 'Guia ràpida', guideClose: 'Tanca la guia',
      examIntro: 'Avaluació: es sortegen 5 escenaris (2 de preparar i executar un cicle i 3 de diagnòstic). No hi ha pistes, les accions tenen conseqüències i la nota sobre 10 s\'envia al campus en acabar.',
      examStart: 'Comença l\'avaluació', examScoring: 'Cada escenari puntua sobre 10 (càrrega i envasat, paràmetres, procediment, controls, decisió) amb penalitzacions per errors de seguretat. La nota final és la mitjana.',
      best: (b) => 'Millor nota: ' + b + '/10',
      scenOf: (i, n) => 'Escenari ' + i + ' de ' + n,
      steps: { order: 'Ordre', prep: 'Preparació', checks: 'Comprovacions', cycle: 'Cicle', unload: 'Descàrrega', controls: 'Controls', decision: 'Decisió', 'case': 'Cas', diagnosis: 'Diagnòstic' },
      next: 'Següent', prev: 'Enrere', restartScen: 'Reinicia l\'escenari', hint: 'Pista', check: 'Comprova',
      protocolTitle: 'Protocol del centre (fictici, orientatiu)', workOrder: 'Ordre de treball', incoming: 'Material que arriba',
      itemsTray: 'Safata d\'entrada', controlsTray: 'Elements de control', prepTable: 'Taula de preparació', selectItem: 'Tria una peça de la safata per preparar-la.',
      accept: 'Va al forn', reject: 'No va al forn', reasonQ: 'Destí del material retirat', packQ: 'Envàs', artQ: 'Articulació', open: 'Oberta', closed: 'Tancada',
      layerQ: 'Quantitat / capa', thin: 'Capa fina, poca quantitat', thick: 'Capa gruixuda, molta quantitat', ciExtQ: 'Indicador químic extern', ciIntQ: 'Indicador químic intern',
      labelQ: 'Etiqueta (data, contingut, lot, operador)', labelOn: 'Etiquetat', placeQ: 'Col·loca\'l a la cambra', unplace: 'Treu-lo de la cambra',
      placeCtrl: 'Col·loca a la cambra', keepOut: 'Deixa fora del forn', inOven: 'A la cambra', outOven: 'Fora del forn',
      st: { pending: 'Pendent', rejected: 'Retirat', ready: 'Preparat', placed: 'A la cambra', stacked: 'Apilat!' },
      occ: (p) => 'Ocupació de la cambra: ' + p + ' % (límit 80 %)', dropHint: 'Pots arrossegar les peces fins a una reixeta, o triar la reixeta amb els botons.',
      chamberLbl: 'Interior de la cambra', condLbl: 'Estat', feedback: 'Revisió de la peça',
      checksTitle: 'Comprovacions abans d\'iniciar', checksIntro: 'Marca les comprovacions que fas abans de posar en marxa el forn. Compte: no totes corresponden a un forn de calor seca.',
      cycleTitle: 'Programa i cicle', startNeeds: 'Per iniciar: porta tancada, programa triat i inici del recompte definit.',
      prog: 'Programa', manual: 'Manual', tempLbl: 'Temperatura de consigna', timeLbl: 'Temps d\'exposició', countLbl: 'Inici del recompte d\'exposició',
      countProbe: 'Sonda de càrrega', countChamber: 'Temperatura de cambra', startBtn: 'INICI', stopBtn: 'ATURA', emergBtn: 'Aturada d\'emergència',
      doorOpen: 'Obre la porta', doorClose: 'Tanca la porta', speed: 'Velocitat de simulació', pause: 'Pausa', resume: 'Continua', skip: 'Avança fins al canvi de fase',
      phase: { idle: 'EN ESPERA', heat: 'ESCALFAMENT', equil: 'ESTABILITZACIÓ', expo: 'ESTERILITZACIÓ', cool: 'REFREDAMENT', end: 'FI DE CICLE', abort: 'CICLE AVORTAT' },
      phaseInfo: {
        idle: 'Forn aturat. Revisa la càrrega, tanca la porta i programa el cicle.',
        heat: 'La resistència escalfa l\'aire de la cambra fins a la consigna; el ventilador uniformitza la temperatura.',
        equil: 'La cambra ja és a temperatura, però la càrrega encara s\'escalfa per conducció. El temps encara no compta.',
        expo: 'Tota la càrrega és a temperatura: compta el temps d\'exposició. No obris la porta.',
        cool: 'Resistència apagada. El forn es refreda amb la porta tancada fins a la temperatura segura.',
        end: 'Cicle acabat. Ja pots preparar la descàrrega.',
        abort: 'El cicle s\'ha interromput: la càrrega no és estèril.'
      },
      leds: ['Escalfament', 'Estabilització', 'Esterilització', 'Refredament', 'Fi'],
      heaterLed: 'Resistència', alarmLed: 'Alarma', doorLed: 'Porta calenta',
      lcdCh: 'CAMBRA', lcdPr: 'SONDA', lcdExp: 'EXPOSICIÓ', lcdSet: 'CONSIGNA',
      dialCh: 'Cambra °C', dialPr: 'Sonda °C', chartTitle: 'Gràfic del cicle: temperatura (°C) – temps (min)', chartCh: 'Cambra', chartPr: 'Sonda de càrrega', chartSet: 'Consigna', chartNoP: 'El forn de calor seca no treballa a pressió: només es registren temperatura i temps.',
      minutes: 'min', ticketTitle: 'Registre imprès del cicle', notices: 'Avisos', noNotices: 'Sense avisos.',
      tk: {
        head: 'FORN POUPINEL HP-60 · CALOR SECA', logger: 'REGISTRADOR DE TEMPERATURA INDEPENDENT', cycle: 'Cicle núm.', date: 'Data', lot: 'Lot', op: 'Operador', sign: 'Signatura',
        prog: 'Programa', count: 'Inici recompte', probe: 'SONDA DE CÀRREGA', chamber: 'CAMBRA', mech: 'TEMPORITZADOR MECÀNIC',
        start: 'INICI DE CICLE', chamberReached: 'CAMBRA A TEMPERATURA', loadReached: 'CÀRREGA A TEMPERATURA', expoStart: 'INICI EXPOSICIÓ',
        doorOpen: '!! PORTA OBERTA', doorClose: 'PORTA TANCADA', drop: '!! CAIGUDA DE TEMPERATURA', expoReset: '!! TEMPERATURA BAIXA: EXPOSICIÓ REINICIADA', expoEnd: 'FI EXPOSICIÓ',
        cycleEnd: 'FI DE CICLE (porta desbloquejable)', stop: '!! ATURADA MANUAL', emergency: '!! ATURADA D\'EMERGÈNCIA', alarm: '!! ALARMA', heatFail: 'TEMPERATURA NO ASSOLIDA - CICLE AVORTAT', equilFail: 'CÀRREGA NO ARRIBA A TEMPERATURA - CICLE AVORTAT',
        powerCut: '!! TALL DE CORRENT', abortCooled: 'CICLE AVORTAT · REFREDAT', resultOk: 'RESULTAT: CICLE COMPLETAT', resultBad: 'RESULTAT: CICLE NO COMPLETAT', done: 'fets', blank: '________'
      },
      interruptTitle: 'Algú et demana una cosa', fire: 'ALARMA: vapors inflamables dins la cambra. Aturada d\'emergència!', fireBody: 'Has posat en marxa el forn amb un producte inflamable a dins. En un cas real hi hauria risc d\'incendi o explosió.',
      seeResult: 'Veure el resultat', flamWarn: 'Avís (mode pràctica): hi ha un producte inflamable a la cambra. Vols iniciar igualment?',
      openWarn: (T) => 'Avís (mode pràctica): la temperatura és de ' + T + ' °C. Obrir ara pot causar cremades i trencar el vidre. Obrir igualment?',
      openDuringWarn: 'Si obres ara, la temperatura baixarà i el temps d\'exposició s\'haurà de tornar a comptar. Obrir igualment?',
      confirmOpen: 'Confirmes que obres la porta del forn?',
      unloadTitle: 'Descàrrega', epiQ: 'Protecció per descarregar', postQ: 'Com fas la descàrrega?', unloadBtn: 'Obre la porta i descarrega', unloaded: (T) => 'Descarregat a ' + T + ' °C.',
      tempNow: 'Temperatura màxima (cambra/càrrega)', waitCool: 'Espera que el forn es refredi; pots accelerar la simulació.',
      unloadTable: 'Material descarregat',
      physQ: '1. Control físic: el registre demostra que tota la càrrega ha estat a la temperatura de consigna durant tot el temps d\'exposició?', yes: 'Sí, correcte', no: 'No, incorrecte', causeQ: 'Causa principal',
      pkgQ: '2. Revisió dels paquets (indicador extern, integritat i identificació)', conform: 'Conforme', nonconform: 'No conforme',
      pcdQ: '3. Integrador químic del paquet de control (PCD)', pcdPass: 'Acceptat', pcdFail: 'No acceptat',
      biQ: '4. Control biològic', incubQ: 'Temperatura d\'incubació', incubate: 'Incuba 48 h (orientatiu, segons fabricant)', incubating: 'Incubant…', biRead: 'Lectura', biNeg: 'Negatiu (sense creixement)', biPos: 'Positiu (creixement)', biInv: 'No vàlid',
      tubeTest: 'Prova (processat)', tubeCtrl: 'Control (no processat)', biNotPlaced: 'No hi ha cap indicador biològic processat en aquesta càrrega.',
      extLbl: 'Indicador extern', intLbl: 'Intern (es llegeix en obrir-lo per fer-lo servir)', labelLbl: 'Etiqueta', noLabel: 'Sense etiqueta', noExt: 'Sense indicador', steamTape: 'cinta de VAPOR',
      accZone: 'ACCEPTAT', rejZone: 'REBUTJAT', colorsNote: 'Colors orientatius: cada fabricant indica el seu viratge.',
      decisionQ: 'Què fas amb aquesta càrrega? Marca totes les accions que corresponen.', confirm: 'Confirma la decisió',
      diagQ: 'Quina és la causa principal del que has trobat?', caseData: 'Dades del cicle',
      scoreTitle: 'Resultat de l\'escenari', score: 'Nota', outOf: 'sobre 10', cats: { load: 'Càrrega i envasat', params: 'Paràmetres del cicle', proc: 'Procediment', ctrl: 'Controls i interpretació', dec: 'Decisió final' },
      catsDiag: { params: 'Diagnòstic de la causa' }, safetyT: 'Seguretat', noSafety: 'Cap error greu de seguretat.', errorsT: 'Errors i com fer-ho bé', goodT: 'Bona pràctica d\'aquest escenari', noErrors: 'Cap error. Excel·lent!',
      expectedDec: 'Decisió correcta', expectedProg: (p) => 'Programa del protocol per a aquesta càrrega: ' + p, annulled: 'Escenari anul·lat per un error greu de seguretat.', capped: (c) => 'Nota limitada a ' + c + ' per un error greu.',
      againSame: 'Repeteix amb una altra variant', menu: 'Torna al menú', nextScen: 'Escenari següent', finalBtn: 'Veure la nota final',
      finalTitle: 'Nota final de l\'avaluació', perScen: 'Per escenari', perCat: 'Per apartat', sentNote: 'La nota s\'envia al campus una sola vegada.', review: 'Revisió detallada',
      grade: (s) => s >= 9 ? 'Excel·lent' : s >= 7 ? 'Notable' : s >= 5 ? 'Aprovat' : 'Cal repassar',
      undecidedWarn: 'Hi ha peces sense decidir o sense col·locar. Vols continuar igualment?', noProgWarn: 'Tria primer el programa i l\'inici del recompte.',
      mustEnd: 'Has d\'esperar que acabi el cicle (o aturar-lo) per continuar.', mustUnload: 'Primer has d\'obrir la porta i descarregar.', mustAnswer: 'Respon totes les preguntes per continuar.',
      tips: {
        order: 'Llegeix el protocol: el programa depèn del material més delicat de la càrrega.',
        prep: 'Metall resistent, vidre, olis i pols: sí. Plàstic, goma, tèxtil, paper, líquids, òptiques, un sol ús i inflamables: no. Envasos metàl·lics o d\'alumini; articulats oberts; capa fina; indicador de calor seca i etiqueta; PCD al centre.',
        checks: 'El forn de calor seca no fa servir aigua, ni buit, ni pressió.',
        cycle: 'El temps s\'ha de comptar quan tota la càrrega és a temperatura (sonda). No obris la porta durant el cicle.',
        unload: 'Espera la temperatura segura (orientatiu ≤ 60 °C), guants tèrmics secs i res d\'aigua freda sobre el vidre.',
        controls: 'Extern virat = processat, no estèril. Mira el registre de la sonda, l\'integrador i, si n\'hi ha, el control del biològic primer.',
        decision: 'Davant del dubte no s\'allibera. Un biològic positiu obliga a retirar tot el que s\'ha processat des de l\'últim negatiu.',
        'case': 'Llegeix el ticket línia a línia i mira el gràfic: quan arriba la sonda a la consigna? quant de temps s\'hi queda?',
        diagnosis: 'Pensa quin control t\'ha donat la pista.'
      },
      practiceFb: 'Correcció (mode pràctica)', correct: 'Correcte', incorrect: 'Incorrecte', expected: 'Esperat',
      shelfShort: ['Superior', 'Central', 'Inferior', 'Base'], added: 'afegit a mig cicle', variant: 'Variant'
    },
    es: {
      back: '← Volver', langbtn: 'Català', home: 'Menú', note: 'Herramienta de estudio y consulta; sigue siempre el protocolo de tu centro.',
      modePractice: 'Modo práctica', modeExam: 'Modo evaluable',
      homePracticeIntro: 'Elige un escenario. En modo práctica tienes avisos, pistas y explicaciones en cada paso, y puedes repetir tantas veces como quieras.',
      prepGroup: 'Preparar y ejecutar un ciclo', diagGroup: 'Diagnosticar un ciclo ya hecho', freeGroup: 'Exploración',
      level: (n) => 'Nivel ' + n, guide: 'Guía rápida', guideClose: 'Cierra la guía',
      examIntro: 'Evaluación: se sortean 5 escenarios (2 de preparar y ejecutar un ciclo y 3 de diagnóstico). No hay pistas, las acciones tienen consecuencias y la nota sobre 10 se envía al campus al terminar.',
      examStart: 'Empieza la evaluación', examScoring: 'Cada escenario puntúa sobre 10 (carga y envasado, parámetros, procedimiento, controles, decisión) con penalizaciones por errores de seguridad. La nota final es la media.',
      best: (b) => 'Mejor nota: ' + b + '/10',
      scenOf: (i, n) => 'Escenario ' + i + ' de ' + n,
      steps: { order: 'Orden', prep: 'Preparación', checks: 'Comprobaciones', cycle: 'Ciclo', unload: 'Descarga', controls: 'Controles', decision: 'Decisión', 'case': 'Caso', diagnosis: 'Diagnóstico' },
      next: 'Siguiente', prev: 'Atrás', restartScen: 'Reinicia el escenario', hint: 'Pista', check: 'Comprueba',
      protocolTitle: 'Protocolo del centro (ficticio, orientativo)', workOrder: 'Orden de trabajo', incoming: 'Material que llega',
      itemsTray: 'Bandeja de entrada', controlsTray: 'Elementos de control', prepTable: 'Mesa de preparación', selectItem: 'Elige una pieza de la bandeja para prepararla.',
      accept: 'Va al horno', reject: 'No va al horno', reasonQ: 'Destino del material retirado', packQ: 'Envase', artQ: 'Articulación', open: 'Abierta', closed: 'Cerrada',
      layerQ: 'Cantidad / capa', thin: 'Capa fina, poca cantidad', thick: 'Capa gruesa, mucha cantidad', ciExtQ: 'Indicador químico externo', ciIntQ: 'Indicador químico interno',
      labelQ: 'Etiqueta (fecha, contenido, lote, operador)', labelOn: 'Etiquetado', placeQ: 'Colócalo en la cámara', unplace: 'Sácalo de la cámara',
      placeCtrl: 'Coloca en la cámara', keepOut: 'Deja fuera del horno', inOven: 'En la cámara', outOven: 'Fuera del horno',
      st: { pending: 'Pendiente', rejected: 'Retirado', ready: 'Preparado', placed: 'En la cámara', stacked: '¡Apilado!' },
      occ: (p) => 'Ocupación de la cámara: ' + p + ' % (límite 80 %)', dropHint: 'Puedes arrastrar las piezas hasta una rejilla, o elegir la rejilla con los botones.',
      chamberLbl: 'Interior de la cámara', condLbl: 'Estado', feedback: 'Revisión de la pieza',
      checksTitle: 'Comprobaciones antes de iniciar', checksIntro: 'Marca las comprobaciones que haces antes de poner en marcha el horno. Cuidado: no todas corresponden a un horno de calor seco.',
      cycleTitle: 'Programa y ciclo', startNeeds: 'Para iniciar: puerta cerrada, programa elegido e inicio del recuento definido.',
      prog: 'Programa', manual: 'Manual', tempLbl: 'Temperatura de consigna', timeLbl: 'Tiempo de exposición', countLbl: 'Inicio del recuento de exposición',
      countProbe: 'Sonda de carga', countChamber: 'Temperatura de cámara', startBtn: 'INICIO', stopBtn: 'PARO', emergBtn: 'Paro de emergencia',
      doorOpen: 'Abre la puerta', doorClose: 'Cierra la puerta', speed: 'Velocidad de simulación', pause: 'Pausa', resume: 'Continúa', skip: 'Avanza hasta el cambio de fase',
      phase: { idle: 'EN ESPERA', heat: 'CALENTAMIENTO', equil: 'ESTABILIZACIÓN', expo: 'ESTERILIZACIÓN', cool: 'ENFRIAMIENTO', end: 'FIN DE CICLO', abort: 'CICLO ABORTADO' },
      phaseInfo: {
        idle: 'Horno parado. Revisa la carga, cierra la puerta y programa el ciclo.',
        heat: 'La resistencia calienta el aire de la cámara hasta la consigna; el ventilador uniformiza la temperatura.',
        equil: 'La cámara ya está a temperatura, pero la carga todavía se calienta por conducción. El tiempo aún no cuenta.',
        expo: 'Toda la carga está a temperatura: cuenta el tiempo de exposición. No abras la puerta.',
        cool: 'Resistencia apagada. El horno se enfría con la puerta cerrada hasta la temperatura segura.',
        end: 'Ciclo terminado. Ya puedes preparar la descarga.',
        abort: 'El ciclo se ha interrumpido: la carga no es estéril.'
      },
      leds: ['Calentamiento', 'Estabilización', 'Esterilización', 'Enfriamiento', 'Fin'],
      heaterLed: 'Resistencia', alarmLed: 'Alarma', doorLed: 'Puerta caliente',
      lcdCh: 'CÁMARA', lcdPr: 'SONDA', lcdExp: 'EXPOSICIÓN', lcdSet: 'CONSIGNA',
      dialCh: 'Cámara °C', dialPr: 'Sonda °C', chartTitle: 'Gráfico del ciclo: temperatura (°C) – tiempo (min)', chartCh: 'Cámara', chartPr: 'Sonda de carga', chartSet: 'Consigna', chartNoP: 'El horno de calor seco no trabaja a presión: solo se registran temperatura y tiempo.',
      minutes: 'min', ticketTitle: 'Registro impreso del ciclo', notices: 'Avisos', noNotices: 'Sin avisos.',
      tk: {
        head: 'HORNO POUPINEL HP-60 · CALOR SECO', logger: 'REGISTRADOR DE TEMPERATURA INDEPENDIENTE', cycle: 'Ciclo n.º', date: 'Fecha', lot: 'Lote', op: 'Operador', sign: 'Firma',
        prog: 'Programa', count: 'Inicio recuento', probe: 'SONDA DE CARGA', chamber: 'CÁMARA', mech: 'TEMPORIZADOR MECÁNICO',
        start: 'INICIO DE CICLO', chamberReached: 'CÁMARA A TEMPERATURA', loadReached: 'CARGA A TEMPERATURA', expoStart: 'INICIO EXPOSICIÓN',
        doorOpen: '!! PUERTA ABIERTA', doorClose: 'PUERTA CERRADA', drop: '!! CAÍDA DE TEMPERATURA', expoReset: '!! TEMPERATURA BAJA: EXPOSICIÓN REINICIADA', expoEnd: 'FIN EXPOSICIÓN',
        cycleEnd: 'FIN DE CICLO (puerta desbloqueable)', stop: '!! PARO MANUAL', emergency: '!! PARO DE EMERGENCIA', alarm: '!! ALARMA', heatFail: 'TEMPERATURA NO ALCANZADA - CICLO ABORTADO', equilFail: 'LA CARGA NO LLEGA A TEMPERATURA - CICLO ABORTADO',
        powerCut: '!! CORTE DE CORRIENTE', abortCooled: 'CICLO ABORTADO · ENFRIADO', resultOk: 'RESULTADO: CICLO COMPLETADO', resultBad: 'RESULTADO: CICLO NO COMPLETADO', done: 'hechos', blank: '________'
      },
      interruptTitle: 'Alguien te pide algo', fire: 'ALARMA: vapores inflamables dentro de la cámara. ¡Paro de emergencia!', fireBody: 'Has puesto en marcha el horno con un producto inflamable dentro. En un caso real habría riesgo de incendio o explosión.',
      seeResult: 'Ver el resultado', flamWarn: 'Aviso (modo práctica): hay un producto inflamable en la cámara. ¿Quieres iniciar igualmente?',
      openWarn: (T) => 'Aviso (modo práctica): la temperatura es de ' + T + ' °C. Abrir ahora puede causar quemaduras y romper el vidrio. ¿Abrir igualmente?',
      openDuringWarn: 'Si abres ahora, la temperatura bajará y el tiempo de exposición se tendrá que volver a contar. ¿Abrir igualmente?',
      confirmOpen: '¿Confirmas que abres la puerta del horno?',
      unloadTitle: 'Descarga', epiQ: 'Protección para descargar', postQ: '¿Cómo haces la descarga?', unloadBtn: 'Abre la puerta y descarga', unloaded: (T) => 'Descargado a ' + T + ' °C.',
      tempNow: 'Temperatura máxima (cámara/carga)', waitCool: 'Espera a que el horno se enfríe; puedes acelerar la simulación.',
      unloadTable: 'Material descargado',
      physQ: '1. Control físico: ¿el registro demuestra que toda la carga ha estado a la temperatura de consigna durante todo el tiempo de exposición?', yes: 'Sí, correcto', no: 'No, incorrecto', causeQ: 'Causa principal',
      pkgQ: '2. Revisión de los paquetes (indicador externo, integridad e identificación)', conform: 'Conforme', nonconform: 'No conforme',
      pcdQ: '3. Integrador químico del paquete de control (PCD)', pcdPass: 'Aceptado', pcdFail: 'No aceptado',
      biQ: '4. Control biológico', incubQ: 'Temperatura de incubación', incubate: 'Incuba 48 h (orientativo, según fabricante)', incubating: 'Incubando…', biRead: 'Lectura', biNeg: 'Negativo (sin crecimiento)', biPos: 'Positivo (crecimiento)', biInv: 'No válido',
      tubeTest: 'Prueba (procesado)', tubeCtrl: 'Control (no procesado)', biNotPlaced: 'No hay ningún indicador biológico procesado en esta carga.',
      extLbl: 'Indicador externo', intLbl: 'Interno (se lee al abrirlo para usarlo)', labelLbl: 'Etiqueta', noLabel: 'Sin etiqueta', noExt: 'Sin indicador', steamTape: 'cinta de VAPOR',
      accZone: 'ACEPTADO', rejZone: 'RECHAZADO', colorsNote: 'Colores orientativos: cada fabricante indica su viraje.',
      decisionQ: '¿Qué haces con esta carga? Marca todas las acciones que corresponden.', confirm: 'Confirma la decisión',
      diagQ: '¿Cuál es la causa principal de lo que has encontrado?', caseData: 'Datos del ciclo',
      scoreTitle: 'Resultado del escenario', score: 'Nota', outOf: 'sobre 10', cats: { load: 'Carga y envasado', params: 'Parámetros del ciclo', proc: 'Procedimiento', ctrl: 'Controles e interpretación', dec: 'Decisión final' },
      catsDiag: { params: 'Diagnóstico de la causa' }, safetyT: 'Seguridad', noSafety: 'Ningún error grave de seguridad.', errorsT: 'Errores y cómo hacerlo bien', goodT: 'Buena práctica de este escenario', noErrors: 'Ningún error. ¡Excelente!',
      expectedDec: 'Decisión correcta', expectedProg: (p) => 'Programa del protocolo para esta carga: ' + p, annulled: 'Escenario anulado por un error grave de seguridad.', capped: (c) => 'Nota limitada a ' + c + ' por un error grave.',
      againSame: 'Repite con otra variante', menu: 'Vuelve al menú', nextScen: 'Escenario siguiente', finalBtn: 'Ver la nota final',
      finalTitle: 'Nota final de la evaluación', perScen: 'Por escenario', perCat: 'Por apartado', sentNote: 'La nota se envía al campus una sola vez.', review: 'Revisión detallada',
      grade: (s) => s >= 9 ? 'Sobresaliente' : s >= 7 ? 'Notable' : s >= 5 ? 'Aprobado' : 'Hay que repasar',
      undecidedWarn: 'Hay piezas sin decidir o sin colocar. ¿Quieres continuar igualmente?', noProgWarn: 'Elige primero el programa y el inicio del recuento.',
      mustEnd: 'Tienes que esperar a que termine el ciclo (o pararlo) para continuar.', mustUnload: 'Primero tienes que abrir la puerta y descargar.', mustAnswer: 'Responde todas las preguntas para continuar.',
      tips: {
        order: 'Lee el protocolo: el programa depende del material más delicado de la carga.',
        prep: 'Metal resistente, vidrio, aceites y polvos: sí. Plástico, goma, textil, papel, líquidos, ópticas, un solo uso e inflamables: no. Envases metálicos o de aluminio; articulados abiertos; capa fina; indicador de calor seco y etiqueta; PCD en el centro.',
        checks: 'El horno de calor seco no usa agua, ni vacío, ni presión.',
        cycle: 'El tiempo se debe contar cuando toda la carga está a temperatura (sonda). No abras la puerta durante el ciclo.',
        unload: 'Espera la temperatura segura (orientativo ≤ 60 °C), guantes térmicos secos y nada de agua fría sobre el vidrio.',
        controls: 'Externo virado = procesado, no estéril. Mira el registro de la sonda, el integrador y, si lo hay, el control del biológico primero.',
        decision: 'Ante la duda no se libera. Un biológico positivo obliga a retirar todo lo procesado desde el último negativo.',
        'case': 'Lee el ticket línea a línea y mira el gráfico: ¿cuándo llega la sonda a la consigna? ¿cuánto tiempo se queda?',
        diagnosis: 'Piensa qué control te ha dado la pista.'
      },
      practiceFb: 'Corrección (modo práctica)', correct: 'Correcto', incorrect: 'Incorrecto', expected: 'Esperado',
      shelfShort: ['Superior', 'Central', 'Inferior', 'Base'], added: 'añadido a mitad de ciclo', variant: 'Variante'
    }
  };

  /* ---------- Estat ---------- */
  function readLang() {
    let l = null;
    try { l = localStorage.getItem('campus-lang'); } catch (e) { /* sense emmagatzematge */ }
    if (l === 'ca' || l === 'es') return l;
    return /^es/i.test(navigator.language || '') ? 'es' : 'ca';
  }
  let lang = readLang();
  const t = () => UI[lang];
  const pick = (pair) => (Array.isArray(pair) ? pair[lang === 'es' ? 1 : 0] : '');
  const msg = (code) => (DATA.msgs[code] ? DATA.msgs[code][lang] : { t: code, w: '', g: '' });
  const $ = (id) => document.getElementById(id);
  const fmt1 = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
  const fmt0 = (x) => String(Math.round(x));
  const rnd = (n) => Math.floor(Math.random() * n);

  const S = { view: 'home', exam: null, cur: null, guide: false, speed: 60, paused: false, loop: false, lastTs: 0, chartTs: 0 };
  /* Ganxo només per als tests automàtics (DOM simulat): no s'activa en ús normal. */
  try { if (window.__SIM_TEST__) window.__SIM_TEST__.S = S; } catch (e) { /* ignora */ }
  const PREP_STEPS = ['order', 'prep', 'checks', 'cycle', 'unload', 'controls', 'decision'];
  const DIAG_STEPS = ['case', 'controls', 'diagnosis', 'decision'];

  /* ---------- Utilitats DOM ---------- */
  function h(tag, attrs, kids) {
    const e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'css') Object.assign(e.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function btn(text, cls, fn, extra) { return h('button', Object.assign({ type: 'button', class: 'btn ' + (cls || ''), text: text, onclick: fn }, extra || {})); }
  function radioGroup(name, opts, value, onchange, cls) {
    const g = h('div', { class: 'choices ' + (cls || ''), role: 'radiogroup' });
    opts.forEach(function (o) {
      const id = name + '-' + o.v;
      const inp = h('input', { type: 'radio', name: name, id: id, value: o.v });
      if (value === o.v) inp.checked = true;
      inp.addEventListener('change', function () { onchange(o.v); });
      g.appendChild(h('label', { class: 'choice', for: id }, [inp, h('span', { text: o.t })]));
    });
    return g;
  }
  function checkList(name, opts, values, onchange) {
    const g = h('div', { class: 'checks' });
    opts.forEach(function (o) {
      const id = name + '-' + o.v;
      const inp = h('input', { type: 'checkbox', id: id, value: o.v });
      if (values.indexOf(o.v) >= 0) inp.checked = true;
      inp.addEventListener('change', function () { onchange(o.v, inp.checked); });
      g.appendChild(h('label', { class: 'choice', for: id }, [inp, h('span', { text: o.t })]));
    });
    return g;
  }
  function ask(text) { try { return window.confirm(text); } catch (e) { return true; } }

  /* ---------- Icones (SVG senzills, 24×24) ---------- */
  const ICONS = {
    scissors: [['circle', { cx: 6, cy: 18, r: 3 }], ['circle', { cx: 18, cy: 18, r: 3 }], ['path', { d: 'M8 16 L19 3 M16 16 L5 3' }]],
    forceps: [['circle', { cx: 7, cy: 19, r: 2.6 }], ['circle', { cx: 17, cy: 19, r: 2.6 }], ['path', { d: 'M8.5 17 L12 9 L11 2 M15.5 17 L12 9 L13 2' }]],
    scalpel: [['path', { d: 'M3 21 L13 11 M13 11 L20 4 Q22 6 18 10 L13 11' }]],
    box: [['rect', { x: 3, y: 7, width: 18, height: 12, rx: 1.5 }], ['path', { d: 'M3 10 H21 M9 13 H15' }]],
    tray: [['path', { d: 'M2 9 H22 L19 18 H5 Z' }]],
    syringe: [['path', { d: 'M4 20 L7 17 M7 17 L16 8 L19 11 L10 20 Z M14 6 L21 13 M18 3 L21 6' }]],
    pipette: [['path', { d: 'M5 21 L15 7 M13 5 L19 11 M17 3 L21 7 M15 7 L17 9' }]],
    petri: [['ellipse', { cx: 12, cy: 14, rx: 9, ry: 4 }], ['path', { d: 'M3 14 V11 Q12 5 21 11 V14' }]],
    tube: [['path', { d: 'M9 2 H15 M10 2 V18 Q12 23 14 18 V2' }], ['path', { d: 'M10 13 H14' }]],
    jar: [['rect', { x: 6, y: 7, width: 12, height: 14, rx: 2 }], ['rect', { x: 7, y: 3, width: 10, height: 4, rx: 1 }]],
    ointment: [['rect', { x: 6, y: 9, width: 12, height: 12, rx: 2 }], ['path', { d: 'M6 13 H18' }], ['rect', { x: 8, y: 5, width: 8, height: 4 }]],
    oil: [['path', { d: 'M12 3 Q6 11 6 15 A6 6 0 0 0 18 15 Q18 11 12 3 Z' }]],
    powder: [['path', { d: 'M4 20 Q12 8 20 20 Z' }], ['circle', { cx: 9, cy: 7, r: 1 }], ['circle', { cx: 14, cy: 5, r: 1 }], ['circle', { cx: 17, cy: 9, r: 1 }]],
    gauze: [['rect', { x: 4, y: 5, width: 16, height: 14 }], ['path', { d: 'M4 10 H20 M4 14 H20 M9 5 V19 M15 5 V19' }]],
    cloth: [['path', { d: 'M4 6 Q8 4 12 6 T20 6 V18 Q16 20 12 18 T4 18 Z' }]],
    hose: [['path', { d: 'M4 20 Q4 8 12 8 T20 4' }]],
    kidney: [['path', { d: 'M3 12 Q3 5 10 6 Q12 9 14 6 Q21 5 21 12 Q21 18 12 18 Q3 18 3 12 Z' }]],
    glove: [['path', { d: 'M7 21 V11 L5 8 M7 11 V4 M10 11 V3 M13 11 V3 M16 11 V5 M16 11 Q19 12 17 21 Z' }]],
    flame: [['path', { d: 'M12 2 Q18 9 16 14 Q20 12 18 8 Q22 16 16 21 H8 Q3 17 6 11 Q8 14 10 13 Q8 7 12 2 Z' }]],
    drop: [['path', { d: 'M12 3 Q5 12 5 15 A7 7 0 0 0 19 15 Q19 12 12 3 Z' }], ['path', { d: 'M9 15 Q9 18 12 18' }]],
    scope: [['circle', { cx: 6, cy: 6, r: 3 }], ['path', { d: 'M8 8 Q14 14 10 18 Q6 22 14 21 Q21 20 20 13' }]],
    pcd: [['rect', { x: 4, y: 6, width: 16, height: 12, rx: 2 }], ['rect', { x: 7, y: 10, width: 10, height: 4 }]],
    bi: [['path', { d: 'M9 2 H15 M10 2 V18 Q12 23 14 18 V2' }], ['circle', { cx: 12, cy: 15, r: 1.5 }]]
  };
  function icon(name, cls) {
    const g = s('svg', { viewBox: '0 0 24 24', class: 'ico ' + (cls || ''), 'aria-hidden': 'true', focusable: 'false' });
    (ICONS[name] || ICONS.box).forEach(function (p) { g.appendChild(s(p[0], p[1])); });
    return g;
  }

  /* ---------- Sessions ---------- */
  function bestKey() { return 'campus-sim-best-' + DATA.slug; }
  function getBest() { try { const v = parseFloat(localStorage.getItem(bestKey())); return isNaN(v) ? null : v; } catch (e) { return null; } }
  function setBest(v) { try { const b = getBest(); if (b === null || v > b) localStorage.setItem(bestKey(), String(v)); } catch (e) { /* ignora */ } }
  function scenById(id) { return DATA.scenarios.find(function (x) { return x.id === id; }); }

  function newMeta() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'), yy = d.getFullYear();
    const n = 100 + rnd(800);
    return { cycleNo: n, lot: 'FP-' + yy + mm + dd + '-' + String(n).padStart(3, '0'), date: dd + '/' + mm + '/' + yy, op: 'TCAI ' + ['A. Puig', 'M. Soler', 'J. Vidal', 'L. Ferrer', 'N. Roca'][rnd(5)], clock0: 8 * 60 + rnd(90) };
  }
  function startScenario(scen, vIdx) {
    stopLoop();
    const variant = scen.variants[vIdx % scen.variants.length];
    const cur = { scen: scen, vIdx: vIdx % scen.variants.length, type: scen.type, meta: newMeta(), ans: { pkgs: {} }, decision: [], cause: null, notices: [], noticed: {}, fb: {} };
    if (scen.type === 'prep') {
      const ctrl = ['pcd'].concat(scen.bi ? ['bi', 'biWrong', 'biCtrl'] : []);
      cur.entries = L.expandItems(variant.items.concat(ctrl.map(function (m) { return { mat: m }; })), CAT, false);
      cur.step = 'order';
      cur.params = { prog: null, T: null, t: null, mode: null };
      cur.pre = []; cur.post = []; cur.epi = null; cur.openTemp = null; cur.sel = null; cur.orderSeq = 0;
      cur.oven = L.createOven({ tau: 8, mass: 0, items: [] }, {});
    } else {
      cur.built = L.buildDiag(scen, variant, CAT);
      cur.flags = Object.assign({}, scen, cur.built.v);
      cur.entries = cur.built.entries;
      cur.oven = cur.built.oven;
      cur.outcome = cur.built.outcome;
      if (cur.flags.recordIncomplete) cur.meta.op = '';
      cur.step = 'case';
    }
    S.cur = cur; S.view = 'scen'; S.paused = false;
    render(true);
  }
  function stepsOf(cur) { return cur.type === 'prep' ? PREP_STEPS : DIAG_STEPS; }
  function goStep(step) { S.cur.step = step; render(true); if (step === 'cycle' || step === 'unload') ensureLoop(); }

  /* ---------- Avaluació de l'escenari ---------- */
  function biResult(cur) {
    if (!cur.outcome || !cur.outcome.bi || !cur.ans.incubDone) return null;
    return L.biRead(cur.outcome, cur.ans.incub);
  }
  /* Per puntuar: si hi ha biològic però l'alumne no l'ha incubat, es puntua contra el resultat real (i perd els punts de la lectura). */
  function biForScore(cur) {
    if (!cur.outcome || !cur.outcome.bi) return null;
    return cur.ans.incubDone ? L.biRead(cur.outcome, cur.ans.incub) : L.biRead(cur.outcome, '30');
  }
  function scoreCurrent() {
    const cur = S.cur;
    if (!cur.ans.incubDone) { cur.ans.incub = undefined; cur.ans.bi = undefined; }
    if (cur.type === 'prep') {
      const proc = procRecord(cur);
      return L.scorePrep(cur.scen, { entries: cur.entries.filter(function (e) { return !e.added; }), params: cur.params, proc: proc, outcome: cur.outcome, ans: cur.ans, biRes: biForScore(cur), decision: cur.decision, oven: cur.oven }, CAT);
    }
    return L.scoreDiag(cur.flags, { ans: cur.ans, cause: cur.cause, decision: cur.decision }, cur.outcome, biForScore(cur));
  }
  function procRecord(cur) {
    const running = ['heat', 'equil', 'expo'];
    const openedDuring = cur.oven.doorOpens.some(function (d) { return running.indexOf(d.phase) >= 0 && !d.byInterrupt; });
    return { pre: cur.pre, post: cur.post, epi: cur.epi, openTemp: cur.openTemp, interruptChoice: cur.interruptChoice || null, openedDuring: openedDuring };
  }
  function finishScenario() {
    stopLoop();
    const cur = S.cur;
    cur.result = scoreCurrent();
    if (S.exam) {
      S.exam.results[S.exam.idx] = { id: cur.scen.id, title: cur.scen.title, score10: cur.result.score10, cats: cur.result.cats, safety: cur.result.safety, res: cur.result, cur: cur };
    }
    S.view = 'scenResult';
    render(true);
  }

  /* ---------- Bucle de simulació ---------- */
  function ovenActive(st) { return st && st.started && !(st.phase === 'end' && st.door === 'open') && !(st.phase === 'abort' && st.abortCooled && st.door === 'open'); }
  function ensureLoop() {
    if (S.loop) return;
    S.loop = true; S.lastTs = 0;
    window.requestAnimationFrame(tick);
  }
  function stopLoop() { S.loop = false; }
  function tick(ts) {
    if (!S.loop) return;
    const cur = S.cur;
    if (!cur || S.view !== 'scen' || (cur.step !== 'cycle' && cur.step !== 'unload')) { S.loop = false; return; }
    const dt = S.lastTs ? Math.min(0.25, (ts - S.lastTs) / 1000) : 0;
    S.lastTs = ts;
    if (!S.paused && !cur.modal && cur.oven.started && !cur.unloaded) advance(dt * S.speed / 60);
    updateLive();
    window.requestAnimationFrame(tick);
  }
  /* Avança el forn en trossos petits per poder aturar-se als esdeveniments (interrupció, inflamable, danys). */
  function advance(simMin) {
    const cur = S.cur, st = cur.oven;
    let left = simMin;
    while (left > 1e-9) {
      const d = Math.min(0.5, left);
      L.step(st, d);
      left -= d;
      if (checkTriggers()) break;
    }
  }
  function checkTriggers() {
    const cur = S.cur, st = cur.oven;
    /* inflamable: alarma i aturada d'emergència */
    if (!cur.fire && st.started && st.Tc >= 60 && cur.entries.some(function (e) { return e.accepted && e.shelf !== null && CAT.mats[e.mat].kind === 'flam'; })) {
      cur.fire = true; L.stop(st, true); cur.modal = 'fire'; render(); return true;
    }
    /* interrupció (P6) a mitja exposició */
    if (cur.scen.interrupt && !cur.interruptShown && st.phase === 'expo' && st.count >= Math.min(10, st.expo * 0.35)) {
      cur.interruptShown = true; cur.modal = 'interrupt'; render(); return true;
    }
    /* avisos de danys visibles */
    st.items.forEach(function (it) {
      const e = cur.entries.find(function (x) { return x.key === it.key; });
      if (!e) return;
      const m = CAT.mats[e.mat];
      const d = L.damageOf(m, CAT.packs[e.pack], it.T, e.cond);
      if (d && !cur.noticed[e.key + d]) {
        cur.noticed[e.key + d] = true;
        cur.notices.push({ t: st.t, code: 'dm_' + d, item: e.mat });
      }
    });
    return false;
  }
  function skipPhase() {
    const cur = S.cur, st = cur.oven;
    const ph = st.phase;
    let guard = 0;
    while (st.phase === ph && guard++ < 2000) { L.step(st, 0.5); if (checkTriggers()) break; if (st.phase === 'end' || (st.phase === 'abort' && st.abortCooled)) break; }
    updateLive();
  }

  /* ---------- Forn: construcció i actualització en viu ---------- */
  function gauge(id, label) {
    const g = s('svg', { viewBox: '0 0 120 120', class: 'gauge', role: 'img', 'aria-label': label });
    g.appendChild(s('circle', { cx: 60, cy: 60, r: 56, class: 'g-rim' }));
    g.appendChild(s('circle', { cx: 60, cy: 60, r: 50, class: 'g-face' }));
    const a = (T) => (-135 + (Math.min(250, Math.max(0, T)) / 250) * 270) * Math.PI / 180;
    const arc = (T1, T2, r) => { const p1 = [60 + r * Math.sin(a(T1)), 60 - r * Math.cos(a(T1))], p2 = [60 + r * Math.sin(a(T2)), 60 - r * Math.cos(a(T2))]; return 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); };
    g.appendChild(s('path', { d: arc(160, 200, 44), class: 'g-ok' }));
    g.appendChild(s('path', { d: arc(200, 250, 44), class: 'g-hot' }));
    for (let T = 0; T <= 250; T += 10) {
      const big = T % 50 === 0, r1 = big ? 38 : 42;
      g.appendChild(s('line', { x1: 60 + r1 * Math.sin(a(T)), y1: 60 - r1 * Math.cos(a(T)), x2: 60 + 47 * Math.sin(a(T)), y2: 60 - 47 * Math.cos(a(T)), class: big ? 'g-tick big' : 'g-tick' }));
      if (big) g.appendChild(s('text', { x: 60 + 29 * Math.sin(a(T)), y: 60 - 29 * Math.cos(a(T)) + 3, class: 'g-num', 'text-anchor': 'middle', text: String(T) }));
    }
    g.appendChild(s('text', { x: 60, y: 86, class: 'g-lbl', 'text-anchor': 'middle', text: label }));
    const nd = s('line', { x1: 60, y1: 60, x2: 60, y2: 18, class: 'g-needle', id: id });
    nd.style.transform = 'rotate(' + (-135 + (L.AMB / 250) * 270).toFixed(1) + 'deg)';
    g.appendChild(nd);
    g.appendChild(s('circle', { cx: 60, cy: 60, r: 5, class: 'g-hub' }));
    return g;
  }
  function setNeedle(id, T) {
    const n = $(id);
    if (!n) return;
    const ang = -135 + (Math.min(250, Math.max(0, T)) / 250) * 270;
    n.style.transform = 'rotate(' + ang.toFixed(1) + 'deg)';
  }
  function pkgClass(e) {
    const m = CAT.mats[e.mat];
    if (m.ctrl) return 'pk-ctrl';
    return 'pk-' + (e.pack || 'bare');
  }
  /* Interior de la cambra amb les reixetes i els paquets. interactive: permet col·locar (preparació). */
  function chamberView(cur, interactive) {
    const lay = L.layout(cur.entries, CAT);
    const ch = h('div', { class: 'chamber', id: 'chamber', 'aria-label': t().chamberLbl });
    ch.appendChild(h('div', { class: 'heater top' }));
    ch.appendChild(h('div', { class: 'fan', 'aria-hidden': 'true' }, [h('i'), h('i'), h('i')]));
    for (let i = 0; i < 4; i++) {
      const sh = h('div', { class: 'shelf' + (i === 3 ? ' base' : ''), 'data-shelf': String(i) });
      sh.appendChild(h('span', { class: 'shelf-lbl', text: t().shelfShort[i] }));
      const row = h('div', { class: 'shelf-row' });
      lay.shelves[i].keys.forEach(function (k) {
        const e = cur.entries.find(function (x) { return x.key === k; });
        const m = CAT.mats[e.mat];
        const st = lay.stacked[k];
        const pk = h('button', { type: 'button', class: 'pkg ' + pkgClass(e) + (st ? ' stacked' : '') + (m.vol >= 2 ? ' w2' : '') + (cur.sel === k ? ' sel' : ''), title: pick(m.name), 'aria-label': pick(m.name) + (st ? ' · ' + t().st.stacked : ''), 'data-key': k }, [icon(m.icon)]);
        if (interactive) pk.addEventListener('click', function () { cur.sel = k; render(); });
        else pk.disabled = true;
        row.appendChild(pk);
      });
      sh.appendChild(row);
      if (interactive) {
        sh.addEventListener('dragover', function (ev) { ev.preventDefault(); sh.classList.add('drop'); });
        sh.addEventListener('dragleave', function () { sh.classList.remove('drop'); });
        sh.addEventListener('drop', function (ev) {
          ev.preventDefault(); sh.classList.remove('drop');
          let k = null; try { k = ev.dataTransfer.getData('text/plain'); } catch (e2) { k = null; }
          if (k) placeEntry(k, i);
        });
      }
      ch.appendChild(sh);
    }
    ch.appendChild(h('div', { class: 'heater bottom' }));
    return ch;
  }
  function ovenView(cur, opts) {
    opts = opts || {};
    const st = cur.oven;
    const ov = h('div', { class: 'oven', id: 'oven' });
    const panel = h('div', { class: 'oven-panel' });
    panel.appendChild(h('div', { class: 'brand' }, [h('b', { text: 'POUPINEL' }), h('small', { text: 'HP-60 · ' + (lang === 'es' ? 'calor seco' : 'calor seca') })]));
    const lcd = h('div', { class: 'lcd', id: 'lcd', role: 'status', 'aria-live': 'off' }, [
      h('div', { class: 'lcd-row' }, [h('span', { text: t().lcdCh }), h('b', { id: 'lcd-ch', text: '--' })]),
      h('div', { class: 'lcd-row' }, [h('span', { text: t().lcdPr }), h('b', { id: 'lcd-pr', text: '--' })]),
      h('div', { class: 'lcd-row' }, [h('span', { text: t().lcdExp }), h('b', { id: 'lcd-ex', text: '--' })]),
      h('div', { class: 'lcd-row' }, [h('span', { text: t().lcdSet }), h('b', { id: 'lcd-set', text: '--' })]),
      h('div', { class: 'lcd-phase', id: 'lcd-ph', text: t().phase.idle })
    ]);
    panel.appendChild(lcd);
    panel.appendChild(h('div', { class: 'dials' }, [gauge('needle-ch', t().dialCh), gauge('needle-pr', t().dialPr)]));
    const leds = h('div', { class: 'leds' });
    ['heat', 'equil', 'expo', 'cool', 'end'].forEach(function (p, i) { leds.appendChild(h('div', { class: 'led-w' }, [h('span', { class: 'led', id: 'led-' + p }), h('small', { text: t().leds[i] })])); });
    leds.appendChild(h('div', { class: 'led-w' }, [h('span', { class: 'led amber', id: 'led-heater' }), h('small', { text: t().heaterLed })]));
    leds.appendChild(h('div', { class: 'led-w' }, [h('span', { class: 'led amber', id: 'led-door' }), h('small', { text: t().doorLed })]));
    leds.appendChild(h('div', { class: 'led-w' }, [h('span', { class: 'led red', id: 'led-alarm' }), h('small', { text: t().alarmLed })]));
    panel.appendChild(leds);
    ov.appendChild(panel);
    const body = h('div', { class: 'oven-body' });
    body.appendChild(chamberView(cur, !!opts.interactive));
    const door = h('div', { class: 'door', id: 'door', 'aria-hidden': 'true' }, [h('div', { class: 'door-win' }), h('div', { class: 'door-handle' }), h('div', { class: 'door-plate', text: 'Tmax 250 °C' })]);
    body.appendChild(door);
    ov.appendChild(body);
    ov.appendChild(h('div', { class: 'oven-feet' }, [h('i'), h('i')]));
    if (opts.forceOpen) ov.classList.add('door-open');
    return ov;
  }
  function updateLive() {
    const cur = S.cur;
    if (!cur) return;
    const st = cur.oven;
    const ov = $('oven');
    if (ov) {
      const dc = L.disp(st, st.Tc), dp = L.disp(st, st.Tp);
      const ripple = (st.phase === 'expo' || st.phase === 'equil') ? 0.3 * Math.sin(st.t * 1.7) : 0;
      if ($('lcd-ch')) $('lcd-ch').textContent = st.started ? fmt1(dc + ripple) + ' °C' : fmt1(L.AMB) + ' °C';
      if ($('lcd-pr')) $('lcd-pr').textContent = fmt1(dp) + ' °C';
      if ($('lcd-ex')) $('lcd-ex').textContent = st.phase === 'expo' ? mmss(st.count) + ' / ' + mmss(st.expo) : (st.started ? '--:-- / ' + mmss(st.expo) : '--');
      if ($('lcd-set')) $('lcd-set').textContent = cur.params && cur.params.T && !st.started ? cur.params.T + ' °C · ' + cur.params.t + ' min' : (st.started ? st.set + ' °C · ' + st.expo + ' min' : '--');
      if ($('lcd-ph')) $('lcd-ph').textContent = t().phase[st.phase] + (st.started ? ' · t ' + mmss(st.t) : '');
      setNeedle('needle-ch', st.started ? dc + ripple : L.AMB);
      setNeedle('needle-pr', dp);
      ['heat', 'equil', 'expo', 'cool', 'end'].forEach(function (p) { const l = $('led-' + p); if (l) l.classList.toggle('on', st.phase === p); });
      const lh = $('led-heater'); if (lh) lh.classList.toggle('on', !!st.heater && st.door === 'closed' && (st.Tc < st.set - (st.faults.offset || 0) - 0.2 || Math.sin(st.t * 3) > 0.3));
      const la = $('led-alarm'); if (la) la.classList.toggle('on', st.phase === 'abort' || !!cur.fire);
      const ld = $('led-door'); if (ld) ld.classList.toggle('on', st.started && Math.max(dc, dp) > L.SAFE_OPEN);
      ov.classList.toggle('door-open', st.door === 'open');
      ov.classList.toggle('running', L.isRunning(st));
      ov.classList.toggle('alarm', st.phase === 'abort' || !!cur.fire);
      const heat = Math.max(0, Math.min(1, (st.Tc - 30) / 200));
      ov.style.setProperty('--heat', heat.toFixed(3));
      ov.style.setProperty('--glow', (st.heater && st.door === 'closed' ? 0.35 + 0.65 * heat : 0).toFixed(3));
    }
    const pi = $('phase-info'); if (pi) pi.textContent = t().phaseInfo[st.phase];
    updateControlsState();
    const now = (window.performance && performance.now()) || Date.now();
    if (now - S.chartTs > 200) { S.chartTs = now; updateChart('chart-live', st); }
    updateTicket('ticket-live', cur);
    updateNotices();
    const ut = $('unload-temp'); if (ut) ut.textContent = fmt1(Math.max(L.disp(st, st.Tc), L.disp(st, st.Tp))) + ' °C';
    const nx = $('btn-next'); if (nx) nx.disabled = !canLeave(cur);
  }
  function mmss(min) { const sec = Math.max(0, Math.round(min * 60)); const hh = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60; return (hh ? hh + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); }
  function clock(cur, tmin) { const m = Math.round(cur.meta.clock0 + tmin); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }

  /* ---------- Gràfic temperatura-temps ---------- */
  const PH_COL = { heat: 'ph-heat', equil: 'ph-equil', expo: 'ph-expo', cool: 'ph-cool', end: 'ph-end', abort: 'ph-abort', idle: 'ph-end' };
  function chartView(id) {
    const W = 640, H = 240;
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', id: id, role: 'img', 'aria-label': t().chartTitle });
    svg.appendChild(s('g', { class: 'bands' }));
    svg.appendChild(s('g', { class: 'grid' }));
    svg.appendChild(s('path', { class: 'l-set', d: '' }));
    svg.appendChild(s('polyline', { class: 'l-ch', points: '' }));
    svg.appendChild(s('polyline', { class: 'l-pr', points: '' }));
    return svg;
  }
  function updateChart(id, st) {
    const svg = $(id);
    if (!svg) return;
    const W = 640, H = 240, x0 = 40, y0 = 12, w = W - x0 - 10, hh = H - y0 - 28;
    const tmax = Math.max(60, Math.ceil(((st.series.length ? st.series[st.series.length - 1].t : 0) + 5) / 30) * 30);
    const X = (tm) => x0 + (tm / tmax) * w, Y = (T) => y0 + hh - (Math.max(0, Math.min(250, T)) / 250) * hh;
    const grid = svg.querySelector('.grid'), bands = svg.querySelector('.bands');
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    while (bands.firstChild) bands.removeChild(bands.firstChild);
    for (let T = 0; T <= 250; T += 50) {
      grid.appendChild(s('line', { x1: x0, x2: x0 + w, y1: Y(T), y2: Y(T) }));
      grid.appendChild(s('text', { x: x0 - 6, y: Y(T) + 4, 'text-anchor': 'end', text: String(T) }));
    }
    const stepT = tmax > 240 ? 60 : 30;
    for (let tm = 0; tm <= tmax; tm += stepT) {
      grid.appendChild(s('line', { x1: X(tm), x2: X(tm), y1: y0, y2: y0 + hh, class: 'v' }));
      grid.appendChild(s('text', { x: X(tm), y: y0 + hh + 16, 'text-anchor': 'middle', text: String(tm) }));
    }
    /* bandes de fase */
    let segStart = null, segPh = null;
    st.series.forEach(function (p, i) {
      if (segPh === null) { segPh = p.ph; segStart = p.t; }
      const last = i === st.series.length - 1;
      if (p.ph !== segPh || last) {
        const end = last ? p.t : p.t;
        bands.appendChild(s('rect', { x: X(segStart), y: y0, width: Math.max(0, X(end) - X(segStart)), height: hh, class: PH_COL[segPh] || '' }));
        segPh = p.ph; segStart = p.t;
      }
    });
    const pts = (k) => st.series.map(function (p) { return X(p.t).toFixed(1) + ',' + Y(p[k]).toFixed(1); }).join(' ');
    svg.querySelector('.l-ch').setAttribute('points', pts('c'));
    svg.querySelector('.l-pr').setAttribute('points', pts('p'));
    svg.querySelector('.l-set').setAttribute('d', st.started ? 'M' + x0 + ' ' + Y(st.set) + ' H' + (x0 + w) : '');
  }
  function chartBlock(id, st) {
    const fig = h('figure', { class: 'chart-wrap' });
    fig.appendChild(h('figcaption', { text: t().chartTitle }));
    fig.appendChild(chartView(id));
    fig.appendChild(h('div', { class: 'legend' }, [
      h('span', { class: 'lg ch', text: t().chartCh }), h('span', { class: 'lg pr', text: t().chartPr }), h('span', { class: 'lg set', text: t().chartSet }),
      h('span', { class: 'lg b ph-heat', text: t().phase.heat.toLowerCase() }), h('span', { class: 'lg b ph-equil', text: t().phase.equil.toLowerCase() }), h('span', { class: 'lg b ph-expo', text: t().phase.expo.toLowerCase() }), h('span', { class: 'lg b ph-cool', text: t().phase.cool.toLowerCase() })
    ]));
    fig.appendChild(h('p', { class: 'muted small', text: t().chartNoP }));
    setTimeout(function () { updateChart(id, st); }, 0);
    return fig;
  }

  /* ---------- Tiquet ---------- */
  function ticketLines(cur) {
    const st = cur.oven, T = t().tk, logger = !!(st.faults && st.faults.noReset);
    const out = [];
    out.push({ c: 'hd', x: logger ? T.logger : T.head });
    out.push({ c: '', x: T.cycle + ' ' + cur.meta.cycleNo + '   ' + T.date + ' ' + cur.meta.date });
    out.push({ c: '', x: T.lot + ': ' + (cur.flags && cur.flags.recordIncomplete ? T.blank : cur.meta.lot) });
    if (st.started) {
      const prog = L.programOf(st.set, st.expo);
      out.push({ c: '', x: T.prog + ': ' + (prog ? prog.toUpperCase() + ' ' : 'MANUAL ') + st.set + ' °C / ' + st.expo + ' min' });
      out.push({ c: '', x: T.count + ': ' + (logger ? T.mech : (st.mode === 'probe' ? T.probe : T.chamber)) });
      out.push({ c: 'sep', x: '' });
    }
    st.events.forEach(function (e) {
      const ck = clock(cur, e.t) + '  ';
      let x = null, c = '';
      switch (e.type) {
        case 'start': x = T.start; break;
        case 'chamberReached': x = T.chamberReached + ' (' + fmt1(e.Tc) + ' °C)'; break;
        case 'loadReached': x = T.loadReached + ' (' + fmt1(e.Tp) + ' °C)'; break;
        case 'expoStart': x = T.expoStart; break;
        case 'doorOpen': { const during = ['heat', 'equil', 'expo'].indexOf(e.data && e.data.phase) >= 0; x = logger ? T.drop : (during ? T.doorOpen : T.doorOpen.replace('!! ', '')) + ' (' + fmt1(e.Tc) + ' °C)'; c = during || logger ? 'warn' : ''; break; }
        case 'doorClose': x = logger ? null : T.doorClose; break;
        case 'expoReset': x = T.expoReset + ' (' + fmt1(e.data.done) + ' min ' + T.done + ')'; c = 'warn'; break;
        case 'expoEnd': x = T.expoEnd + ' (' + fmt1(e.data.done) + ' min) · Tmin ' + fmt1(st.expoMin !== null ? st.expoMin : e.Tc) + ' / Tmax ' + fmt1(st.expoMax !== null ? st.expoMax : e.Tc) + ' °C'; break;
        case 'cycleEnd': x = T.cycleEnd + ' (' + fmt1(Math.max(e.Tc, e.Tp)) + ' °C)'; break;
        case 'stop': x = T.stop; c = 'warn'; break;
        case 'emergency': x = T.emergency; c = 'warn'; break;
        case 'alarm': x = T.alarm + ': ' + (T[e.data.why] || e.data.why); c = 'warn'; break;
        case 'powerCut': x = T.powerCut + ' (' + e.data.dur + ' min)'; c = 'warn'; break;
        case 'abortCooled': x = T.abortCooled; break;
        default: x = null;
      }
      if (x) out.push({ c: c, x: ck + x });
    });
    if (st.phase === 'end' || (st.phase === 'abort' && st.abortCooled)) {
      out.push({ c: 'sep', x: '' });
      const completed = st.events.some(function (e) { return e.type === 'expoEnd'; }) && !st.aborted;
      out.push({ c: completed ? 'res' : 'res bad', x: completed ? T.resultOk : T.resultBad });
      const op = cur.flags && cur.flags.recordIncomplete ? T.blank : cur.meta.op;
      out.push({ c: '', x: T.op + ': ' + op });
      out.push({ c: '', x: T.sign + ': ' + (cur.flags && cur.flags.recordIncomplete ? T.blank : '✓ ' + cur.meta.op.split(' ').slice(-1)[0]) });
    }
    return out;
  }
  function ticketView(id, cur) {
    const tk = h('div', { class: 'ticket-wrap' }, [h('div', { class: 'ticket-title', text: t().ticketTitle }), h('pre', { class: 'ticket', id: id, tabindex: '0', 'aria-label': t().ticketTitle })]);
    setTimeout(function () { updateTicket(id, cur, true); }, 0);
    return tk;
  }
  function updateTicket(id, cur, force) {
    const el = $(id);
    if (!el) return;
    const lines = ticketLines(cur);
    const sig = lines.length + ':' + (lines.length ? lines[lines.length - 1].x : '');
    if (!force && el.getAttribute('data-sig') === sig) return;
    el.setAttribute('data-sig', sig);
    el.textContent = '';
    lines.forEach(function (l, i) {
      const sp = h('span', { class: 'tl ' + l.c + (i >= (parseInt(el.getAttribute('data-n') || '0', 10)) ? ' new' : ''), text: l.x || ' ' });
      el.appendChild(sp);
      el.appendChild(document.createTextNode('\n'));
    });
    el.setAttribute('data-n', String(lines.length));
    el.scrollTop = el.scrollHeight;
  }
  function updateNotices() {
    const box = $('notices');
    const cur = S.cur;
    if (!box || !cur) return;
    if (box.getAttribute('data-n') === String(cur.notices.length)) return;
    box.setAttribute('data-n', String(cur.notices.length));
    box.textContent = '';
    if (!cur.notices.length) { box.appendChild(h('li', { class: 'muted', text: t().noNotices })); return; }
    cur.notices.forEach(function (n) { box.appendChild(h('li', { class: 'notice' }, [h('b', { text: clock(cur, n.t) + ' ' }), msg(n.code).t + ' — ' + pick(CAT.mats[n.item].name)])); });
  }

  /* ---------- Capçalera i navegació d'escenari ---------- */
  function scenHeader(root, cur) {
    const steps = stepsOf(cur);
    const top = h('div', { class: 'scen-top' });
    const left = h('div', {}, [
      h('div', { class: 'row' }, [
        h('span', { class: 'pill ' + (S.exam ? 'exam' : 'practice'), text: S.exam ? t().modeExam : t().modePractice }),
        S.exam ? h('span', { class: 'pill', text: t().scenOf(S.exam.idx + 1, S.exam.list.length) }) : null,
        h('span', { class: 'tag', text: cur.type === 'prep' ? t().prepGroup : t().diagGroup })
      ]),
      h('h2', { class: 'scen-title', text: pick(cur.scen.title) })
    ]);
    top.appendChild(left);
    const tools = h('div', { class: 'btns' });
    if (!S.exam) {
      tools.appendChild(btn(t().hint, 'sm', function () { cur.showTip = !cur.showTip; render(); }, { 'aria-expanded': cur.showTip ? 'true' : 'false' }));
      tools.appendChild(btn(t().guide, 'sm', function () { S.guide = true; render(); }));
      tools.appendChild(btn(t().restartScen, 'sm', function () { startScenario(cur.scen, cur.vIdx); }));
    }
    top.appendChild(tools);
    root.appendChild(top);
    const ol = h('ol', { class: 'stepper' });
    const idx = steps.indexOf(cur.step);
    steps.forEach(function (stp, i) {
      ol.appendChild(h('li', { class: i < idx ? 'done' : i === idx ? 'now' : '', 'aria-current': i === idx ? 'step' : null }, [h('span', { class: 'n', text: String(i + 1) }), h('span', { class: 'l', text: t().steps[stp] })]));
    });
    root.appendChild(ol);
    if (cur.showTip && !S.exam) root.appendChild(h('div', { class: 'fb tip' }, [h('strong', { text: t().hint + ': ' }), t().tips[cur.step] || '']));
  }
  function canLeave(cur) {
    switch (cur.step) {
      case 'cycle': return cur.oven.started && (cur.oven.phase === 'cool' || cur.oven.phase === 'end' || cur.oven.phase === 'abort');
      case 'unload': return !!cur.unloaded;
      default: return true;
    }
  }
  function navBar(root, cur, onNext, nextLabel) {
    const steps = stepsOf(cur);
    const idx = steps.indexOf(cur.step);
    const bar = h('div', { class: 'nav' });
    const backAllowed = !S.exam && idx > 0 && (cur.type === 'diag' || !cur.oven.started || idx > steps.indexOf('unload'));
    if (backAllowed) bar.appendChild(btn(t().prev, '', function () { goStep(steps[idx - 1]); }));
    else bar.appendChild(h('span'));
    const nb = btn(nextLabel || t().next, 'primary', onNext, { id: 'btn-next' });
    nb.disabled = !canLeave(cur);
    bar.appendChild(nb);
    root.appendChild(bar);
  }
  function nextStep() { const steps = stepsOf(S.cur); const i = steps.indexOf(S.cur.step); if (i < steps.length - 1) goStep(steps[i + 1]); }

  /* ---------- Pas: ordre de treball ---------- */
  function protocolCard() {
    const c = h('div', { class: 'card protocol' }, [h('h3', { text: t().protocolTitle })]);
    const ul = h('ul', { class: 'list' });
    DATA.protocol.forEach(function (p) { ul.appendChild(h('li', { text: pick(p.t) })); });
    c.appendChild(ul);
    return c;
  }
  function stepOrder(root, cur) {
    const card = h('div', { class: 'card order' });
    card.appendChild(h('div', { class: 'order-head' }, [h('span', { text: t().workOrder }), h('span', { class: 'mono', text: cur.meta.lot })]));
    card.appendChild(h('p', { text: pick(cur.scen.brief) }));
    card.appendChild(h('h3', { text: t().incoming }));
    const ul = h('ul', { class: 'incoming' });
    cur.entries.filter(function (e) { return !CAT.mats[e.mat].ctrl; }).forEach(function (e) {
      const m = CAT.mats[e.mat];
      ul.appendChild(h('li', {}, [icon(m.icon), h('span', { text: pick(m.name) }), e.cond !== 'ok' ? h('span', { class: 'cond ' + e.cond, text: pick(CAT.conds[e.cond]) }) : null]));
    });
    card.appendChild(ul);
    root.appendChild(card);
    root.appendChild(protocolCard());
    navBar(root, cur, nextStep);
  }

  /* ---------- Pas: preparació i càrrega ---------- */
  function entryStatus(e, lay) {
    if (e.accepted === false) return CAT.mats[e.mat].ctrl ? 'outOven' : 'rejected';
    if (e.accepted && e.shelf !== null) return lay.stacked[e.key] ? 'stacked' : 'placed';
    if (e.accepted) return 'ready';
    return 'pending';
  }
  function placeEntry(key, shelf) {
    const cur = S.cur;
    if (cur.oven.started) return;
    const e = cur.entries.find(function (x) { return x.key === key; });
    if (!e) return;
    e.accepted = true; e.reason = null; e.shelf = shelf; e.order = ++cur.orderSeq;
    cur.sel = key;
    render();
  }
  function stepPrep(root, cur) {
    const locked = cur.oven.started;
    const lay = L.layout(cur.entries, CAT);
    const grid = h('div', { class: 'prep-grid' });
    /* safata */
    const tray = h('div', { class: 'card tray' }, [h('h3', { text: t().itemsTray })]);
    const ctrlTray = h('div', { class: 'card tray' }, [h('h3', { text: t().controlsTray })]);
    cur.entries.forEach(function (e) {
      if (e.added) return;
      const m = CAT.mats[e.mat];
      const stt = entryStatus(e, lay);
      const label = stt === 'outOven' ? t().outOven : stt === 'placed' ? t().st.placed + ' · ' + t().shelfShort[e.shelf] : stt === 'stacked' ? t().st.stacked : (t().st[stt] || '');
      const card = h('button', { type: 'button', 'data-key': e.key, class: 'item ' + stt + (cur.sel === e.key ? ' sel' : ''), draggable: locked ? null : 'true', 'aria-pressed': cur.sel === e.key ? 'true' : 'false' }, [
        icon(m.icon),
        h('span', { class: 'iname', text: pick(m.name) }),
        h('span', { class: 'imeta' }, [e.cond !== 'ok' ? h('span', { class: 'cond ' + e.cond, text: pick(CAT.conds[e.cond]) }) : null, h('span', { class: 'istat', text: label })])
      ]);
      card.addEventListener('click', function () { cur.sel = e.key; render(); });
      card.addEventListener('dragstart', function (ev) { try { ev.dataTransfer.setData('text/plain', e.key); ev.dataTransfer.effectAllowed = 'move'; } catch (er) { /* ignora */ } });
      (m.ctrl ? ctrlTray : tray).appendChild(card);
    });
    const colA = h('div', { class: 'col' }, [tray, ctrlTray]);
    grid.appendChild(colA);
    /* taula de preparació */
    const colB = h('div', { class: 'col' });
    colB.appendChild(prepTable(cur, lay, locked));
    grid.appendChild(colB);
    /* forn obert */
    const colC = h('div', { class: 'col' });
    const occP = Math.round(lay.occ * 100);
    colC.appendChild(h('div', { class: 'occ' + (lay.overload ? ' over' : '') }, [h('div', { class: 'occ-bar', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(occP), 'aria-label': t().occ(occP) }, [h('i', { css: { width: Math.min(100, occP) + '%' } }), h('b', { class: 'occ-lim' })]), h('span', { class: 'small', text: t().occ(occP) })]));
    colC.appendChild(ovenView(cur, { interactive: !locked, forceOpen: true }));
    colC.appendChild(h('p', { class: 'muted small', text: t().dropHint }));
    grid.appendChild(colC);
    root.appendChild(grid);
    navBar(root, cur, function () {
      const pending = cur.entries.some(function (e) { return !e.added && !CAT.mats[e.mat].ctrl && (e.accepted === null || (e.accepted && e.shelf === null)); });
      if (pending && !ask(t().undecidedWarn)) return;
      nextStep();
    });
  }
  function prepTable(cur, lay, locked) {
    const card = h('div', { class: 'card table' }, [h('h3', { text: t().prepTable })]);
    const e = cur.entries.find(function (x) { return x.key === cur.sel; });
    if (!e) { card.appendChild(h('p', { class: 'muted', text: t().selectItem })); return card; }
    const m = CAT.mats[e.mat];
    const upd = function (fn) { if (locked) return; fn(); render(); };
    card.appendChild(h('div', { class: 'sel-head' }, [icon(m.icon, 'big'), h('div', {}, [h('strong', { text: pick(m.name) }), h('div', { class: 'small' }, [t().condLbl + ': ', h('span', { class: 'cond ' + e.cond, text: pick(CAT.conds[e.cond]) })])])]));
    if (m.ctrl) {
      card.appendChild(radioGroup('ctrl-' + e.key, [{ v: 'in', t: t().placeCtrl }, { v: 'out', t: t().keepOut }], e.accepted ? 'in' : 'out', function (v) {
        upd(function () { if (v === 'in') { e.accepted = true; if (e.shelf === null) { e.shelf = 1; e.order = ++cur.orderSeq; } } else { e.accepted = false; e.shelf = null; } });
      }));
      if (e.accepted) card.appendChild(shelfButtons(cur, e, locked));
    } else {
      card.appendChild(radioGroup('acc-' + e.key, [{ v: 'yes', t: t().accept }, { v: 'no', t: t().reject }], e.accepted === true ? 'yes' : e.accepted === false ? 'no' : null, function (v) {
        upd(function () { e.accepted = v === 'yes'; if (!e.accepted) { e.shelf = null; } else e.reason = null; });
      }, 'two'));
      if (e.accepted === false) {
        card.appendChild(h('h4', { text: t().reasonQ }));
        card.appendChild(radioGroup('rs-' + e.key, CAT.reasonOrder.map(function (r) { return { v: r, t: pick(CAT.reasons[r]) }; }), e.reason, function (v) { upd(function () { e.reason = v; }); }));
      } else if (e.accepted) {
        card.appendChild(h('h4', { text: t().packQ }));
        const packs = h('div', { class: 'packs' });
        CAT.packOrder.forEach(function (pid) {
          const pk = CAT.packs[pid];
          const b = h('button', { type: 'button', id: 'pack-' + pid, class: 'packchip' + (e.pack === pid ? ' on' : ''), 'aria-pressed': e.pack === pid ? 'true' : 'false' }, [h('i', { class: 'sw pk-' + pid }), h('span', { text: pick(pk.name) })]);
          b.addEventListener('click', function () { upd(function () { e.pack = pid; }); });
          b.disabled = locked;
          packs.appendChild(b);
        });
        card.appendChild(packs);
        if (m.artic) { card.appendChild(h('h4', { text: t().artQ })); card.appendChild(radioGroup('op-' + e.key, [{ v: 'o', t: t().open }, { v: 'c', t: t().closed }], e.open ? 'o' : (e.openSet ? 'c' : null), function (v) { upd(function () { e.open = v === 'o'; e.openSet = true; }); }, 'two')); }
        if (m.kind === 'oil' || m.kind === 'powder') { card.appendChild(h('h4', { text: t().layerQ })); card.appendChild(radioGroup('ly-' + e.key, [{ v: 'thin', t: t().thin }, { v: 'thick', t: t().thick }], e.layer, function (v) { upd(function () { e.layer = v; }); }, 'two')); }
        const ci = ['dry', 'steam', 'none'].map(function (k) { return { v: k, t: pick(CAT.ciTypes[k]) }; });
        card.appendChild(h('h4', { text: t().ciExtQ })); card.appendChild(radioGroup('ce-' + e.key, ci, e.ciExt, function (v) { upd(function () { e.ciExt = v; }); }, 'three'));
        card.appendChild(h('h4', { text: t().ciIntQ })); card.appendChild(radioGroup('ci-' + e.key, ci, e.ciInt, function (v) { upd(function () { e.ciInt = v; }); }, 'three'));
        card.appendChild(checkList('lb-' + e.key, [{ v: 'l', t: t().labelQ }], e.label ? ['l'] : [], function (v, on) { upd(function () { e.label = on; }); }));
        if (e.label) card.appendChild(labelPreview(cur, e));
        card.appendChild(shelfButtons(cur, e, locked));
      }
    }
    if (!S.exam) card.appendChild(entryFeedback(cur, e, lay));
    if (locked) Array.prototype.forEach.call(card.querySelectorAll('input,button'), function (x) { x.disabled = true; });
    return card;
  }
  function labelPreview(cur, e) {
    return h('div', { class: 'label-prev mono' }, [cur.meta.date + ' · ' + cur.meta.lot, h('br'), pick(CAT.mats[e.mat].name), h('br'), cur.meta.op]);
  }
  function shelfButtons(cur, e, locked) {
    const w = h('div', { class: 'shelfbtns' }, [h('h4', { text: t().placeQ })]);
    const row = h('div', { class: 'row' });
    [0, 1, 2, 3].forEach(function (i) {
      const b = btn(t().shelfShort[i], 'sm' + (e.shelf === i ? ' on' : ''), function () { placeEntry(e.key, i); }, { id: 'shelf-' + i, 'aria-pressed': e.shelf === i ? 'true' : 'false' });
      b.disabled = locked;
      row.appendChild(b);
    });
    if (e.shelf !== null && !CAT.mats[e.mat].ctrl) row.appendChild(btn(t().unplace, 'sm ghost', function () { if (!locked) { e.shelf = null; render(); } }));
    w.appendChild(row);
    return w;
  }
  /* Revisió immediata de la peça (només mode pràctica) */
  function entryFeedback(cur, e, lay) {
    const ctx = L.loadContext(cur.entries, CAT, cur.scen);
    const ev = L.evalLoad([e], CAT, cur.scen);
    const box = h('div', { class: 'fbbox' }, [h('h4', { text: t().feedback })]);
    const m = CAT.mats[e.mat];
    const chs = ev.checks.filter(function (c) { return c.item === e.key; });
    /* reavaluació amb el context real (cal dividir?) i la disposició real */
    const real = L.evalLoad(cur.entries, CAT, cur.scen).checks.filter(function (c) { return c.item === e.key; });
    (real.length ? real : chs).forEach(function (c) {
      const mm = msg(c.code);
      const extra = (!c.ok && (c.code === 'l_mat_no' || c.code === 'l_mat_single' || c.code === 'l_mat_flam' || c.code === 'l_rejectedApt') && m.why) ? pick(m.why) : '';
      box.appendChild(h('div', { class: 'fb ' + (c.ok ? 'ok' : 'bad') }, [h('strong', { text: (c.ok ? '✓ ' : '✗ ') + mm.t }), mm.w || extra ? h('div', { class: 'small', text: (extra || mm.w) }) : null, !c.ok && mm.g ? h('div', { class: 'small', text: '→ ' + mm.g }) : null]));
    });
    if (e.accepted === false && !m.ctrl && L.isLoadable(m, e.cond) && !ctx.mustSplit && e.reason === 'later') { /* ja explicat */ }
    if (e.accepted === false && !L.isLoadable(m, e.cond) && m.why) box.appendChild(h('p', { class: 'small muted', text: pick(m.why) }));
    return box;
  }

  /* ---------- Pas: comprovacions prèvies ---------- */
  function stepChecks(root, cur) {
    const card = h('div', { class: 'card' }, [h('h3', { text: t().checksTitle }), h('p', { class: 'muted small', text: t().checksIntro })]);
    card.appendChild(checkList('pre', CAT.preChecks.map(function (c) { return { v: c.id, t: pick(c.t) }; }), cur.pre, function (v, on) {
      cur.pre = cur.pre.filter(function (x) { return x !== v; }); if (on) cur.pre.push(v); if (cur.fb.pre) render();
    }));
    if (!S.exam) {
      card.appendChild(btn(t().check, 'sm', function () { cur.fb.pre = true; render(); }));
      if (cur.fb.pre) card.appendChild(listFeedback(CAT.preChecks, cur.pre));
    }
    root.appendChild(card);
    navBar(root, cur, nextStep);
  }
  function listFeedback(list, chosen) {
    const box = h('div', { class: 'fbbox' }, [h('h4', { text: t().practiceFb })]);
    list.forEach(function (c) {
      const on = chosen.indexOf(c.id) >= 0;
      const ok = c.ok ? on : !on;
      box.appendChild(h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') + ' small' }, [(ok ? '✓ ' : '✗ ') + pick(c.t) + ' — ' + (c.ok ? (lang === 'es' ? 'sí corresponde' : 'sí que correspon') : (lang === 'es' ? 'no corresponde' : 'no correspon'))]));
    });
    return box;
  }

  /* ---------- Pas: programa i cicle ---------- */
  function stepCycle(root, cur) {
    const st = cur.oven;
    const grid = h('div', { class: 'cycle-grid' });
    const left = h('div', { class: 'col' });
    left.appendChild(ovenView(cur, {}));
    left.appendChild(h('p', { class: 'phase-info', id: 'phase-info', role: 'status', text: t().phaseInfo[st.phase] }));
    grid.appendChild(left);
    const right = h('div', { class: 'col' });
    right.appendChild(controlPanel(cur));
    right.appendChild(simBar());
    grid.appendChild(right);
    root.appendChild(grid);
    root.appendChild(chartBlock('chart-live', st));
    const lower = h('div', { class: 'two-col' });
    lower.appendChild(ticketView('ticket-live', cur));
    lower.appendChild(h('div', { class: 'card notices-card' }, [h('h3', { text: t().notices }), h('ul', { class: 'list', id: 'notices', 'aria-live': 'polite' })]));
    root.appendChild(lower);
    if (!S.exam && !st.started) root.appendChild(h('div', { class: 'fb tip small' }, [protocolHint(cur)]));
    navBar(root, cur, nextStep);
    if (cur.modal) root.appendChild(modalView(cur));
    setTimeout(updateLive, 0);
    ensureLoop();
  }
  function protocolHint(cur) {
    const p = L.programById(L.protocolFor(cur.entries, CAT));
    return t().expectedProg(p.T + ' °C · ' + p.t + ' min');
  }
  function controlPanel(cur) {
    const st = cur.oven, P = cur.params, locked = st.started;
    const pn = h('div', { class: 'ctrl-panel', role: 'group', 'aria-label': t().cycleTitle });
    pn.appendChild(h('div', { class: 'cp-title', text: t().cycleTitle }));
    /* programes */
    const progs = h('div', { class: 'progs' });
    L.PROGRAMS.forEach(function (p, i) {
      const b = h('button', { type: 'button', class: 'progbtn' + (P.prog === p.id ? ' on' : ''), 'aria-pressed': P.prog === p.id ? 'true' : 'false', id: 'prog-' + p.id }, [h('b', { text: 'P' + (i + 1) }), h('span', { text: p.T + ' °C' }), h('span', { text: p.t + ' min' })]);
      b.addEventListener('click', function () { if (locked) return; P.prog = p.id; P.T = p.T; P.t = p.t; render(); });
      b.disabled = locked;
      progs.appendChild(b);
    });
    const mb = h('button', { type: 'button', class: 'progbtn' + (P.prog === 'manual' ? ' on' : ''), 'aria-pressed': P.prog === 'manual' ? 'true' : 'false', id: 'prog-manual' }, [h('b', { text: 'M' }), h('span', { text: t().manual })]);
    mb.addEventListener('click', function () { if (locked) return; P.prog = 'manual'; if (!P.T) { P.T = 150; P.t = 20; } render(); });
    mb.disabled = locked;
    progs.appendChild(mb);
    pn.appendChild(h('div', { class: 'cp-lbl', text: t().prog }));
    pn.appendChild(progs);
    if (P.prog === 'manual') {
      pn.appendChild(stepper('man-T', t().tempLbl, P.T, '°C', 100, 250, 5, function (v) { P.T = v; }, locked));
      pn.appendChild(stepper('man-t', t().timeLbl, P.t, 'min', 5, 240, 5, function (v) { P.t = v; }, locked));
    }
    pn.appendChild(h('div', { class: 'cp-lbl', text: t().countLbl }));
    const cm = radioGroup('count', [{ v: 'probe', t: t().countProbe }, { v: 'chamber', t: t().countChamber }], P.mode, function (v) { if (!locked) { P.mode = v; render(); } }, 'two dark');
    if (locked) Array.prototype.forEach.call(cm.querySelectorAll('input'), function (x) { x.disabled = true; });
    pn.appendChild(cm);
    const actions = h('div', { class: 'cp-actions' });
    const doorBtn = btn(st.door === 'open' ? t().doorClose : t().doorOpen, 'door-btn', function () { toggleDoor(); }, { id: 'btn-door' });
    const startB = btn(t().startBtn, 'start-btn', function () { startCycle(); }, { id: 'btn-start' });
    const stopB = btn(t().stopBtn, 'stop-btn', function () { if (L.stop(cur.oven, false)) render(); }, { id: 'btn-stop' });
    const emB = h('button', { type: 'button', class: 'emerg', id: 'btn-emerg', 'aria-label': t().emergBtn, title: t().emergBtn }, [h('span', { text: 'STOP' })]);
    emB.addEventListener('click', function () { if (L.stop(cur.oven, true)) render(); });
    actions.appendChild(doorBtn); actions.appendChild(startB); actions.appendChild(stopB); actions.appendChild(emB);
    pn.appendChild(actions);
    pn.appendChild(h('p', { class: 'cp-note', id: 'cp-note', text: t().startNeeds }));
    return pn;
  }
  function stepper(id, label, val, unit, min, max, stp, onset, locked) {
    const w = h('div', { class: 'stepper-in' });
    const lab = h('label', { for: id, text: label });
    const inp = h('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(stp), value: String(val), inputmode: 'numeric' });
    inp.disabled = locked;
    inp.addEventListener('change', function () { let v = parseInt(inp.value, 10); if (isNaN(v)) v = min; v = Math.max(min, Math.min(max, v)); onset(v); render(); });
    const minus = btn('−', 'sm', function () { onset(Math.max(min, val - stp)); render(); }, { 'aria-label': label + ' −' + stp });
    const plus = btn('+', 'sm', function () { onset(Math.min(max, val + stp)); render(); }, { 'aria-label': label + ' +' + stp });
    minus.disabled = locked; plus.disabled = locked;
    w.appendChild(lab);
    w.appendChild(h('div', { class: 'row nowrap' }, [minus, inp, h('span', { class: 'unit', text: unit }), plus]));
    return w;
  }
  function updateControlsState() {
    const cur = S.cur;
    if (!cur) return;
    const st = cur.oven, P = cur.params;
    const sp = $('btn-pause'); if (sp) sp.textContent = S.paused ? t().resume : t().pause;
    const sk = $('btn-skip'); if (sk) sk.disabled = !st.started || st.phase === 'end' || (st.phase === 'abort' && st.abortCooled) || !!cur.unloaded;
    if (!$('btn-start')) return;
    const ready = !st.started && st.door === 'closed' && P.prog && P.T && P.mode;
    $('btn-start').disabled = !ready;
    $('btn-stop').disabled = !L.isRunning(st);
    $('btn-emerg').disabled = !L.isRunning(st);
    const db = $('btn-door');
    db.textContent = st.door === 'open' ? t().doorClose : t().doorOpen;
    db.disabled = !!cur.unloaded || cur.step === 'unload';
    const note = $('cp-note');
    if (note) note.textContent = st.started ? '' : t().startNeeds;
  }
  function simBar() {
    const bar = h('div', { class: 'simbar', role: 'group', 'aria-label': t().speed });
    bar.appendChild(h('span', { class: 'small', text: t().speed }));
    const row = h('div', { class: 'row' });
    [1, 10, 60, 240].forEach(function (v) {
      const b = btn('×' + v, 'sm' + (S.speed === v ? ' on' : ''), function () { S.speed = v; Array.prototype.forEach.call(row.querySelectorAll('.spd'), function (x) { x.classList.toggle('on', x.getAttribute('data-v') === String(v)); x.setAttribute('aria-pressed', x.getAttribute('data-v') === String(v) ? 'true' : 'false'); }); }, { 'data-v': String(v), 'aria-pressed': S.speed === v ? 'true' : 'false' });
      b.classList.add('spd');
      row.appendChild(b);
    });
    row.appendChild(btn(S.paused ? t().resume : t().pause, 'sm', function () { S.paused = !S.paused; updateControlsState(); }, { id: 'btn-pause' }));
    row.appendChild(btn(t().skip, 'sm', function () { skipPhase(); }, { id: 'btn-skip' }));
    bar.appendChild(row);
    return bar;
  }
  function startCycle() {
    const cur = S.cur, P = cur.params;
    if (!P.prog || !P.T || !P.mode) { window.alert(t().noProgWarn); return; }
    const flam = cur.entries.some(function (e) { return e.accepted && e.shelf !== null && CAT.mats[e.mat].kind === 'flam'; });
    if (flam && !S.exam && !ask(t().flamWarn)) return;
    const load = L.thermalLoad(cur.entries, CAT, {});
    const st = L.createOven(load, {});
    L.setParams(st, { T: P.T, t: P.t, mode: P.mode });
    st.door = cur.oven.door;
    cur.oven = st;
    L.start(st);
    S.paused = false;
    render();
    ensureLoop();
  }
  function toggleDoor() {
    const cur = S.cur, st = cur.oven;
    if (st.door === 'open') { L.closeDoor(st); updateLive(); return; }
    const hot = Math.max(L.disp(st, st.Tc), L.disp(st, st.Tp));
    if (L.isRunning(st)) { if (!ask(S.exam ? t().confirmOpen : t().openDuringWarn)) return; }
    else if (st.started && hot > L.SAFE_OPEN && !S.exam) { if (!ask(t().openWarn(fmt0(hot)))) return; }
    L.openDoor(st);
    updateLive();
  }
  function modalView(cur) {
    const ov = h('div', { class: 'modal-bg' });
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-t', tabindex: '-1', id: 'modal' });
    if (cur.modal === 'fire') {
      box.classList.add('fire');
      box.appendChild(h('h3', { id: 'modal-t', text: t().fire }));
      box.appendChild(h('p', { text: t().fireBody }));
      box.appendChild(btn(t().seeResult, 'primary', function () { cur.modal = null; cur.outcome = L.outcome(cur.oven, cur.entries, CAT, {}, {}); finishScenario(); }, { id: 'btn-fire' }));
    } else if (cur.modal === 'interrupt') {
      box.appendChild(h('h3', { id: 'modal-t', text: t().interruptTitle }));
      box.appendChild(h('p', { text: pick(DATA.interrupt.q) }));
      const opts = h('div', { class: 'opts' });
      L.shuffle(DATA.interrupt.o.map(function (o, i) { return i; })).forEach(function (i) {
        const o = DATA.interrupt.o[i];
        opts.appendChild(btn(pick(o.t), 'opt', function () { resolveInterrupt(o.w); }, { id: 'int-' + o.w }));
      });
      box.appendChild(opts);
    }
    ov.appendChild(box);
    setTimeout(function () { const m = $('modal'); if (m) m.focus(); }, 0);
    return ov;
  }
  function resolveInterrupt(w) {
    const cur = S.cur, st = cur.oven;
    cur.interruptChoice = w;
    cur.modal = null;
    if (w !== 'f') {
      L.openDoor(st);
      st.doorOpens[st.doorOpens.length - 1].byInterrupt = true;
      L.step(st, w === 'p' ? 1 : 0.5);
      /* les pinces afegides entren fredes; si s'hi posen sense preparar, sortiran sense envàs ni indicador */
      const key = 'add' + cur.entries.length;
      const prepped = w === 'p';
      cur.entries.push({ key: key, mat: 'kocher', cond: 'ok', added: true, accepted: true, pack: prepped ? 'foil' : 'none', open: prepped, layer: null, ciExt: prepped ? 'dry' : 'none', ciInt: prepped ? 'dry' : 'none', label: prepped, shelf: 0, order: 99 });
      st.items.push({ key: key, kf: 0.8, ctrl: null, shelf: 0, T: L.AMB, F: 0, Tmax: L.AMB });
      L.closeDoor(st);
    }
    render();
    ensureLoop();
  }

  /* ---------- Pas: descàrrega ---------- */
  function stepUnload(root, cur) {
    const st = cur.oven;
    const grid = h('div', { class: 'cycle-grid' });
    const left = h('div', { class: 'col' });
    left.appendChild(ovenView(cur, { forceOpen: !!cur.unloaded }));
    left.appendChild(h('p', { class: 'phase-info', id: 'phase-info', role: 'status', text: t().phaseInfo[st.phase] }));
    grid.appendChild(left);
    const right = h('div', { class: 'col' });
    const card = h('div', { class: 'card' }, [h('h3', { text: t().unloadTitle })]);
    card.appendChild(h('div', { class: 'temp-now' }, [h('span', { text: t().tempNow + ': ' }), h('b', { id: 'unload-temp', text: '--' })]));
    if (!cur.unloaded) {
      card.appendChild(h('p', { class: 'muted small', text: t().waitCool }));
      card.appendChild(simBar());
    }
    card.appendChild(h('h4', { text: t().epiQ }));
    card.appendChild(radioGroup('epi', CAT.epiOrder.map(function (k) { return { v: k, t: pick(CAT.epi[k]) }; }), cur.epi, function (v) { if (!cur.unloaded) cur.epi = v; }));
    card.appendChild(h('h4', { text: t().postQ }));
    card.appendChild(checkList('post', CAT.postChecks.map(function (c) { return { v: c.id, t: pick(c.t) }; }), cur.post, function (v, on) {
      cur.post = cur.post.filter(function (x) { return x !== v; }); if (on) cur.post.push(v); if (cur.fb.post) render();
    }));
    if (!cur.unloaded) card.appendChild(btn(t().unloadBtn, 'primary', function () { doUnload(); }, { id: 'btn-unload' }));
    else card.appendChild(h('p', { class: 'fb ' + (cur.openTemp > L.SAFE_OPEN ? 'bad' : 'ok'), text: t().unloaded(fmt1(cur.openTemp)) }));
    if (!S.exam && cur.unloaded) {
      card.appendChild(btn(t().check, 'sm', function () { cur.fb.post = true; render(); }));
      if (cur.fb.post) card.appendChild(listFeedback(CAT.postChecks, cur.post));
    }
    right.appendChild(card);
    grid.appendChild(right);
    root.appendChild(grid);
    if (cur.unloaded) root.appendChild(unloadedTable(cur));
    root.appendChild(h('div', { class: 'card notices-card' }, [h('h3', { text: t().notices }), h('ul', { class: 'list', id: 'notices', 'aria-live': 'polite' })]));
    navBar(root, cur, nextStep);
    setTimeout(updateLive, 0);
    ensureLoop();
  }
  function doUnload() {
    const cur = S.cur, st = cur.oven;
    const hot = Math.max(L.disp(st, st.Tc), L.disp(st, st.Tp));
    if (!S.exam && hot > L.SAFE_OPEN && !ask(t().openWarn(fmt0(hot)))) return;
    if (st.door !== 'open') L.openDoor(st);
    cur.openTemp = Math.round(hot * 10) / 10;
    cur.unloaded = true;
    cur.outcome = L.outcome(st, cur.entries, CAT, { openTemp: cur.openTemp }, {});
    cur.outcome.packages.forEach(function (p) { if (p.damage && !cur.noticed[p.key + p.damage]) { cur.noticed[p.key + p.damage] = true; cur.notices.push({ t: st.t, code: 'dm_' + p.damage, item: p.mat }); } });
    render();
  }
  function unloadedTable(cur) {
    const card = h('div', { class: 'card' }, [h('h3', { text: t().unloadTable })]);
    const g = h('div', { class: 'pkg-grid' });
    cur.outcome.packages.forEach(function (p) {
      const e = cur.entries.find(function (x) { return x.key === p.key; });
      g.appendChild(h('div', { class: 'pkg-card' }, [pkgSVG(e, p, cur), h('div', { class: 'small', text: pick(CAT.mats[e.mat].name) + (e.added ? ' (' + t().added + ')' : '') }), p.damage ? h('div', { class: 'cond dirty', text: msg('dm_' + p.damage).t }) : null]));
    });
    card.appendChild(g);
    return card;
  }

  /* ---------- Dibuixos: paquet, indicadors, integrador, tubs ---------- */
  function pkgSVG(e, p, cur) {
    const g = s('svg', { viewBox: '0 0 160 100', class: 'pkgsvg', role: 'img', 'aria-label': pick(CAT.mats[e.mat].name) });
    const pack = e.pack || 'none';
    const body = { metalbox: 'M14 26 H146 V86 H14 Z', foil: 'M12 30 Q30 22 50 30 T90 28 T148 32 L144 84 Q120 92 80 86 T16 84 Z', metaltube: 'M20 36 H140 A10 25 0 0 1 140 76 H20 A10 25 0 0 1 20 36 Z', jar: 'M50 30 H110 V88 H50 Z', paperfilm: 'M14 22 H146 V88 H14 Z', crepe: 'M14 24 L146 24 L140 88 L20 88 Z', cloth: 'M14 26 Q80 16 146 26 V86 Q80 96 14 86 Z', plasticbox: 'M16 28 H144 V86 H16 Z', steamcont: 'M14 28 H146 V86 H14 Z', none: '' };
    if (pack !== 'none') g.appendChild(s('path', { d: body[pack] || body.metalbox, class: 'pb pb-' + pack }));
    if (pack === 'metalbox' || pack === 'steamcont') g.appendChild(s('rect', { x: 10, y: 20, width: 140, height: 10, rx: 2, class: 'pb-lid' }));
    if (pack === 'jar') g.appendChild(s('path', { d: 'M46 22 Q80 14 114 22 L112 32 H48 Z', class: 'pb pb-foil' }));
    if (pack === 'none') { const ic = icon(CAT.mats[e.mat].icon); ic.setAttribute('x', '50'); ic.setAttribute('y', '20'); ic.setAttribute('width', '60'); ic.setAttribute('height', '60'); g.appendChild(ic); }
    /* indicador extern */
    if (e.ciExt === 'dry' || e.ciExt === 'steam') {
      const turned = p.ext === 'turned';
      const tape = s('g', { class: 'tape ' + (e.ciExt === 'steam' ? 'steam' : 'dry') + (turned ? ' turned' : '') });
      tape.appendChild(s('rect', { x: 22, y: 44, width: 72, height: 14, rx: 1, class: 'tape-bg' }));
      for (let i = 0; i < 6; i++) tape.appendChild(s('rect', { x: 26 + i * 11, y: 46, width: 6, height: 10, class: 'tape-st' }));
      if (e.ciExt === 'steam') tape.appendChild(s('text', { x: 58, y: 70, 'text-anchor': 'middle', class: 'tape-t', text: t().steamTape }));
      g.appendChild(tape);
    }
    /* etiqueta */
    if (e.label) {
      g.appendChild(s('rect', { x: 100, y: 40, width: 46, height: 30, rx: 2, class: 'lab' }));
      g.appendChild(s('text', { x: 104, y: 51, class: 'lab-t', text: cur.meta.date.slice(0, 5) }));
      g.appendChild(s('text', { x: 104, y: 63, class: 'lab-t', text: cur.meta.lot.slice(-7) }));
    }
    /* danys */
    if (p.damage === 'scorch' || p.damage === 'burn') { g.appendChild(s('path', { d: 'M30 70 Q50 56 70 72 T120 70 Q110 86 80 84 T30 70 Z', class: 'dmg-scorch' + (p.damage === 'burn' ? ' burn' : '') })); g.appendChild(s('circle', { cx: 120, cy: 34, r: 9, class: 'dmg-scorch' })); }
    if (p.damage === 'melt') g.appendChild(s('path', { d: 'M20 84 Q30 96 40 86 Q48 98 58 86 Q70 99 82 86 Q96 97 108 86 Q120 98 140 84 L140 70 Q80 64 20 74 Z', class: 'dmg-melt' }));
    if (p.damage === 'crack') g.appendChild(s('path', { d: 'M60 30 L70 46 L62 56 L76 72 M70 46 L86 50', class: 'dmg-crack' }));
    return g;
  }
  function tapeLegend() { return h('p', { class: 'muted small', text: t().colorsNote }); }
  function integratorSVG(progress, pass) {
    const W = 240, H = 46;
    const g = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'integ', role: 'img', 'aria-label': t().pcdQ });
    g.appendChild(s('rect', { x: 2, y: 8, width: W - 4, height: 26, rx: 4, class: 'in-strip' }));
    g.appendChild(s('rect', { x: 8, y: 14, width: W - 16, height: 14, rx: 2, class: 'in-track' }));
    const accX = 8 + (W - 16) * 0.8;
    g.appendChild(s('rect', { x: accX, y: 12, width: (W - 16) * 0.2, height: 18, class: 'in-acc' }));
    const front = pass ? 0.9 : Math.min(0.78, progress * 0.78);
    g.appendChild(s('rect', { x: 8, y: 14, width: (W - 16) * front, height: 14, rx: 2, class: 'in-front' }));
    g.appendChild(s('text', { x: 10, y: 44, class: 'in-t', text: t().rejZone }));
    g.appendChild(s('text', { x: W - 8, y: 44, 'text-anchor': 'end', class: 'in-t acc', text: t().accZone }));
    return g;
  }
  function tubesSVG(res) {
    const g = s('svg', { viewBox: '0 0 200 130', class: 'tubes', role: 'img', 'aria-label': t().biQ });
    [[50, res ? res.test : null, t().tubeTest], [150, res ? res.control : null, t().tubeCtrl]].forEach(function (tb) {
      const x = tb[0], grown = tb[1];
      const cls = grown === null ? 'tb-pre' : grown ? 'tb-pos' : 'tb-neg';
      g.appendChild(s('rect', { x: x - 12, y: 6, width: 24, height: 10, rx: 2, class: 'tb-cap' }));
      g.appendChild(s('path', { d: 'M' + (x - 10) + ' 16 V92 Q' + x + ' 108 ' + (x + 10) + ' 92 V16 Z', class: 'tb-glass' }));
      g.appendChild(s('path', { d: 'M' + (x - 9) + ' 40 V92 Q' + x + ' 106 ' + (x + 9) + ' 92 V40 Z', class: 'tb-med ' + cls }));
      if (grown) for (let i = 0; i < 9; i++) g.appendChild(s('circle', { cx: x - 6 + (i * 37 % 13), cy: 52 + (i * 23 % 40), r: 1.2, class: 'tb-turb' }));
      g.appendChild(s('rect', { x: x - 3, y: 70, width: 6, height: 18, class: 'tb-strip' }));
      g.appendChild(s('text', { x: x, y: 124, 'text-anchor': 'middle', class: 'tb-t', text: tb[2] }));
    });
    return g;
  }

  /* ---------- Pas: controls ---------- */
  function stepControls(root, cur) {
    const o = cur.outcome;
    if (cur.type === 'prep' && !o) { root.appendChild(h('p', { text: t().mustUnload })); navBar(root, cur, nextStep); return; }
    const fbOn = !S.exam && cur.fb.ctrl;
    const biRes = biResult(cur);
    const ev = fbOn ? L.evalControls(o, cur.ans, biRes, { noCause: cur.type === 'diag' }) : null;
    const fbFor = (code0) => { if (!ev) return null; const c = ev.checks.filter(function (x) { return x.code.indexOf(code0) === 0; }); return c; };
    /* 1 físic */
    const c1 = h('div', { class: 'card' }, [h('h3', { text: t().physQ })]);
    const two = h('div', { class: 'two-col' });
    two.appendChild(ticketView('ticket-ctrl', cur));
    two.appendChild(chartBlock('chart-ctrl', cur.oven));
    c1.appendChild(two);
    c1.appendChild(radioGroup('phys', [{ v: 'ok', t: t().yes }, { v: 'bad', t: t().no }], cur.ans.phys, function (v) { cur.ans.phys = v; render(); }, 'two'));
    if (cur.ans.phys === 'bad' && cur.type === 'prep') {
      c1.appendChild(h('h4', { text: t().causeQ }));
      c1.appendChild(radioGroup('cause', CAT.physCauses.filter(function (k) { return k !== 'k_none'; }).map(function (k) { return { v: k, t: pick(CAT.causes[k]) }; }), cur.ans.cause, function (v) { cur.ans.cause = v; if (fbOn) render(); }));
    }
    if (ev) fbFor('c_phys').concat(fbFor('c_cause')).forEach(function (c) { c1.appendChild(checkFb(c, c.code === 'c_physBad' ? (o.phys.valid ? t().yes : t().no) : null)); });
    root.appendChild(c1);
    /* 2 paquets */
    const c2 = h('div', { class: 'card' }, [h('h3', { text: t().pkgQ })]);
    const g = h('div', { class: 'pkg-grid' });
    o.packages.forEach(function (p) {
      const e = cur.entries.find(function (x) { return x.key === p.key; });
      const box = h('div', { class: 'pkg-card' }, [
        pkgSVG(e, p, cur),
        h('div', { class: 'small strong', text: pick(CAT.mats[e.mat].name) + (e.added ? ' (' + t().added + ')' : '') }),
        h('div', { class: 'small' }, [t().extLbl + ': ', e.ciExt === 'none' || !e.ciExt ? h('b', { text: t().noExt }) : h('span', { text: pick(CAT.ciTypes[e.ciExt]) })]),
        h('div', { class: 'small' }, [t().labelLbl + ': ', e.label ? '✓' : h('b', { text: t().noLabel })]),
        p.damage ? h('div', { class: 'cond dirty', text: msg('dm_' + p.damage).t }) : null
      ]);
      box.appendChild(radioGroup('pk-' + p.key, [{ v: 'ok', t: t().conform }, { v: 'nc', t: t().nonconform }], cur.ans.pkgs[p.key], function (v) { cur.ans.pkgs[p.key] = v; if (fbOn) render(); }, 'two compact'));
      if (ev) ev.checks.filter(function (c) { return c.item === p.key; }).forEach(function (c) { box.appendChild(checkFb(c, p.conform ? t().conform : t().nonconform)); });
      g.appendChild(box);
    });
    c2.appendChild(g);
    c2.appendChild(tapeLegend());
    root.appendChild(c2);
    /* 3 PCD */
    if (o.pcd) {
      const c3 = h('div', { class: 'card' }, [h('h3', { text: t().pcdQ })]);
      c3.appendChild(integratorSVG(o.pcd.progress, o.pcd.pass));
      c3.appendChild(radioGroup('pcd', [{ v: 'pass', t: t().pcdPass }, { v: 'fail', t: t().pcdFail }], cur.ans.pcd, function (v) { cur.ans.pcd = v; if (fbOn) render(); }, 'two'));
      if (ev) fbFor('c_pcd').forEach(function (c) { c3.appendChild(checkFb(c, o.pcd.pass ? t().pcdPass : t().pcdFail)); });
      root.appendChild(c3);
    }
    /* 4 BI */
    if (o.bi || (cur.type === 'prep' && cur.scen.bi)) {
      const c4 = h('div', { class: 'card' }, [h('h3', { text: t().biQ })]);
      if (!o.bi) c4.appendChild(h('p', { class: 'fb warn', text: t().biNotPlaced }));
      else {
        c4.appendChild(h('h4', { text: t().incubQ }));
        const ig = radioGroup('incub', CAT.incubOrder.map(function (k) { return { v: k, t: pick(CAT.incub[k]) }; }), cur.ans.incub, function (v) { if (!cur.ans.incubDone) cur.ans.incub = v; }, 'three');
        if (cur.ans.incubDone) Array.prototype.forEach.call(ig.querySelectorAll('input'), function (x) { x.disabled = true; });
        c4.appendChild(ig);
        const incubBox = h('div', { class: 'incubator' + (cur.incubating ? ' busy' : '') }, [tubesSVG(cur.ans.incubDone ? biRes : null)]);
        c4.appendChild(incubBox);
        if (!cur.ans.incubDone) {
          const ib = btn(cur.incubating ? t().incubating : t().incubate, 'primary', function () {
            if (!cur.ans.incub) { window.alert(t().incubQ); return; }
            cur.incubating = true; render();
            setTimeout(function () { cur.incubating = false; cur.ans.incubDone = true; if (S.cur === cur) render(); }, 1800);
          });
          ib.disabled = !!cur.incubating;
          ib.id = 'btn-incub';
          c4.appendChild(ib);
        } else {
          c4.appendChild(h('h4', { text: t().biRead }));
          c4.appendChild(radioGroup('bi', [{ v: 'neg', t: t().biNeg }, { v: 'pos', t: t().biPos }, { v: 'invalid', t: t().biInv }], cur.ans.bi, function (v) { cur.ans.bi = v; if (fbOn) render(); }, 'three'));
        }
        if (ev) fbFor('c_incub').concat(fbFor('c_bi')).forEach(function (c) { c4.appendChild(checkFb(c, c.code.indexOf('c_bi') === 0 && biRes ? ({ neg: t().biNeg, pos: t().biPos, invalid: t().biInv })[biRes.verdict] : null)); });
      }
      root.appendChild(c4);
    }
    if (!S.exam) root.appendChild(btn(t().check, '', function () { cur.fb.ctrl = true; render(); }));
    navBar(root, cur, function () {
      const missing = !cur.ans.phys || o.packages.some(function (p) { return !cur.ans.pkgs[p.key]; }) || (o.pcd && !cur.ans.pcd) || (o.bi && (!cur.ans.incubDone || !cur.ans.bi));
      if (missing && !ask(t().mustAnswer + ' ' + t().undecidedWarn.split('.').slice(-1)[0])) return;
      nextStep();
    });
  }
  function checkFb(c, expectedTxt) {
    const mm = msg(c.code);
    return h('div', { class: 'fb small ' + (c.ok ? 'ok' : 'bad') }, [h('strong', { text: (c.ok ? '✓ ' : '✗ ') + mm.t }), !c.ok && expectedTxt ? h('div', { text: t().expected + ': ' + expectedTxt }) : null, !c.ok && mm.w ? h('div', { text: mm.w }) : null]);
  }

  /* ---------- Pas: cas (diagnòstic) ---------- */
  function stepCase(root, cur) {
    const card = h('div', { class: 'card order' });
    card.appendChild(h('div', { class: 'order-head' }, [h('span', { text: t().caseData }), h('span', { class: 'mono', text: cur.meta.lot })]));
    card.appendChild(h('p', { text: pick(cur.scen.brief) }));
    root.appendChild(card);
    const grid = h('div', { class: 'cycle-grid' });
    grid.appendChild(h('div', { class: 'col' }, [ovenView(cur, { forceOpen: true })]));
    grid.appendChild(h('div', { class: 'col' }, [ticketView('ticket-case', cur)]));
    root.appendChild(grid);
    root.appendChild(chartBlock('chart-case', cur.oven));
    setTimeout(function () { staticOven(cur); }, 0);
    navBar(root, cur, nextStep);
  }
  /* Panell estàtic del forn en els casos de diagnòstic: mostra l'estat final. */
  function staticOven(cur) {
    const st = cur.oven;
    if ($('lcd-ch')) $('lcd-ch').textContent = fmt1(L.disp(st, st.Tc)) + ' °C';
    if ($('lcd-pr')) $('lcd-pr').textContent = fmt1(L.disp(st, st.Tp)) + ' °C';
    if ($('lcd-ex')) $('lcd-ex').textContent = mmss(st.count) + ' / ' + mmss(st.expo);
    if ($('lcd-set')) $('lcd-set').textContent = st.set + ' °C · ' + st.expo + ' min';
    if ($('lcd-ph')) $('lcd-ph').textContent = t().phase[st.phase];
    setNeedle('needle-ch', L.disp(st, st.Tc)); setNeedle('needle-pr', L.disp(st, st.Tp));
    const le = $('led-' + st.phase); if (le) le.classList.add('on');
    const la = $('led-alarm'); if (la) la.classList.toggle('on', st.phase === 'abort');
  }

  /* ---------- Pas: diagnòstic de la causa ---------- */
  function stepDiagnosis(root, cur) {
    const card = h('div', { class: 'card' }, [h('h3', { text: t().diagQ })]);
    card.appendChild(radioGroup('dcause', CAT.diagCauses.map(function (k) { return { v: k, t: pick(CAT.causes[k]) }; }), cur.cause, function (v) { cur.cause = v; if (cur.fb.cause) render(); }));
    if (!S.exam) {
      card.appendChild(btn(t().check, 'sm', function () { cur.fb.cause = true; render(); }));
      if (cur.fb.cause) {
        const ok = (cur.flags.causes || []).indexOf(cur.cause) >= 0;
        card.appendChild(h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') }, [h('strong', { text: ok ? t().correct : t().incorrect }), ok ? null : h('div', { text: t().expected + ': ' + cur.flags.causes.map(function (k) { return pick(CAT.causes[k]); }).join(' / ') })]));
      }
    }
    root.appendChild(card);
    navBar(root, cur, nextStep);
  }

  /* ---------- Pas: decisió ---------- */
  function stepDecision(root, cur) {
    const card = h('div', { class: 'card' }, [h('h3', { text: t().decisionQ })]);
    card.appendChild(checkList('dec', CAT.decisionOrder.map(function (k) { return { v: k, t: pick(CAT.decisions[k]) }; }), cur.decision, function (v, on) {
      cur.decision = cur.decision.filter(function (x) { return x !== v; }); if (on) cur.decision.push(v);
    }));
    root.appendChild(card);
    navBar(root, cur, function () { finishScenario(); }, t().confirm);
  }

  /* ---------- Resultat d'escenari ---------- */
  function catBars(res, type) {
    const wrap = h('div', { class: 'cats' });
    Object.keys(res.cats).forEach(function (k) {
      const c = res.cats[k];
      if (c.f === null || c.f === undefined) return;
      const pct = Math.round(c.f * 100);
      const name = (type === 'diag' && t().catsDiag[k]) || t().cats[k];
      wrap.appendChild(h('div', { class: 'catrow' }, [h('span', { class: 'cn', text: name + ' (' + c.w + ' %)' }), h('span', { class: 'cb', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': name }, [h('i', { class: pct >= 80 ? 'hi' : pct >= 50 ? 'mid' : 'lo', css: { width: pct + '%' } })]), h('b', { text: pct + ' %' })]));
    });
    return wrap;
  }
  function itemName(cur, key) { const e = cur.entries.find(function (x) { return x.key === key; }); return e ? pick(CAT.mats[e.mat].name) : ''; }
  function errorsList(cur, res) {
    const box = h('div', {});
    const bad = res.checks.filter(function (c) { return !c.ok; });
    if (!bad.length) { box.appendChild(h('p', { class: 'fb ok', text: t().noErrors })); return box; }
    const ul = h('ul', { class: 'errs' });
    bad.forEach(function (c) {
      const mm = msg(c.code);
      let extra = '';
      if (c.item) extra = itemName(cur, c.item);
      if (c.extra && c.extra.opt) extra = pick(CAT.decisions[c.extra.opt]);
      if (c.extra && c.extra.id) { const li = CAT.preChecks.concat(CAT.postChecks).find(function (x) { return x.id === c.extra.id; }); if (li) extra = pick(li.t); }
      if (c.extra && c.extra.shelf !== undefined) extra = t().shelfShort[c.extra.shelf];
      if (c.extra && c.extra.causes) extra = t().expected + ': ' + c.extra.causes.map(function (k) { return pick(CAT.causes[k]); }).join(' / ');
      if (c.extra && c.extra.expected && c.code === 'p_notProtocol') { const p = L.programById(c.extra.expected); extra = t().expectedProg(p.T + ' °C · ' + p.t + ' min'); }
      let why = mm.w;
      if (c.item && (c.code === 'l_mat_no' || c.code === 'l_mat_single' || c.code === 'l_mat_flam')) { const e = cur.entries.find(function (x) { return x.key === c.item; }); if (e && CAT.mats[e.mat].why) why = pick(CAT.mats[e.mat].why); }
      ul.appendChild(h('li', { class: 'err' }, [h('span', { class: 'ecat', text: (t().cats[c.cat] || '') }), h('strong', { text: mm.t }), extra ? h('span', { class: 'muted', text: ' — ' + extra }) : null, why ? h('div', { class: 'small', text: why }) : null, mm.g ? h('div', { class: 'small good', text: '→ ' + mm.g }) : null]));
    });
    box.appendChild(ul);
    return box;
  }
  function scenResultCard(cur, res, full) {
    const card = h('div', { class: 'card result' });
    card.appendChild(h('div', { class: 'res-head' }, [h('div', {}, [h('div', { class: 'muted small', text: t().scoreTitle }), h('h2', { text: pick(cur.scen.title) })]), h('div', { class: 'score' + (res.score10 >= 5 ? ' pass' : ' fail') }, [h('b', { text: fmt1(res.score10) }), h('small', { text: ' / 10' })])]));
    if (res.annulled) card.appendChild(h('p', { class: 'fb bad', text: t().annulled }));
    else if (res.cap !== null && res.cap !== undefined && res.raw10 > res.cap) card.appendChild(h('p', { class: 'fb bad', text: t().capped(res.cap) }));
    card.appendChild(catBars(res, cur.type));
    card.appendChild(h('h3', { text: t().safetyT }));
    if (!res.safety.length) card.appendChild(h('p', { class: 'small muted', text: t().noSafety }));
    else { const ul = h('ul', { class: 'errs' }); res.safety.forEach(function (sx) { const mm = msg(sx); ul.appendChild(h('li', { class: 'err safety' }, [h('strong', { text: mm.t }), mm.w ? h('div', { class: 'small', text: mm.w }) : null, mm.g ? h('div', { class: 'small good', text: '→ ' + mm.g }) : null])); }); card.appendChild(ul); }
    if (full) {
      card.appendChild(h('h3', { text: t().errorsT }));
      card.appendChild(errorsList(cur, res));
      card.appendChild(h('h3', { text: t().goodT }));
      const gp = h('div', { class: 'goodp' });
      if (cur.type === 'diag' && DATA.diagExplain[cur.scen.id]) gp.appendChild(h('p', { text: pick(DATA.diagExplain[cur.scen.id]) }));
      if (cur.type === 'prep' && res.expProg) { const p = L.programById(res.expProg); gp.appendChild(h('p', { text: t().expectedProg(p.T + ' °C · ' + p.t + ' min') + ' · ' + t().countProbe + '.' })); }
      if (res.expected) gp.appendChild(h('p', {}, [h('strong', { text: t().expectedDec + ': ' }), res.expected.req.map(function (k) { return pick(CAT.decisions[k]); }).join(' · ')]));
      card.appendChild(gp);
    }
    return card;
  }
  function viewScenResult(root) {
    const cur = S.cur, res = cur.result;
    root.appendChild(scenResultCard(cur, res, !S.exam));
    const row = h('div', { class: 'nav' });
    if (S.exam) {
      const last = S.exam.idx >= S.exam.list.length - 1;
      row.appendChild(h('span'));
      row.appendChild(btn(last ? t().finalBtn : t().nextScen, 'primary', function () {
        if (last) { S.view = 'final'; render(true); }
        else { S.exam.idx++; const it = S.exam.list[S.exam.idx]; startScenario(it.scen, it.v); }
      }, { id: 'btn-continue' }));
    } else {
      row.appendChild(btn(t().menu, '', function () { S.view = 'home'; S.cur = null; render(true); }, { id: 'btn-menu' }));
      row.appendChild(btn(t().againSame, 'primary', function () { startScenario(cur.scen, cur.vIdx + 1); }, { id: 'btn-again' }));
    }
    root.appendChild(row);
  }

  /* ---------- Nota final (avaluació) ---------- */
  function viewFinal(root) {
    const ex = S.exam;
    const fg = L.finalGrade(ex.results);
    if (!ex.reported) { ex.reported = true; setBest(fg.score10); sendScore(fg.score10); }
    const card = h('div', { class: 'card result' });
    card.appendChild(h('div', { class: 'res-head' }, [h('div', {}, [h('div', { class: 'muted small', text: t().finalTitle }), h('h2', { text: t().grade(fg.score10) })]), h('div', { class: 'score big' + (fg.score10 >= 5 ? ' pass' : ' fail') }, [h('b', { text: fmt1(fg.score10) }), h('small', { text: ' / 10' })])]));
    card.appendChild(h('h3', { text: t().perCat }));
    const cats = h('div', { class: 'cats' });
    Object.keys(fg.cats).forEach(function (k) { const pct = fg.cats[k]; cats.appendChild(h('div', { class: 'catrow' }, [h('span', { class: 'cn', text: t().cats[k] }), h('span', { class: 'cb' }, [h('i', { class: pct >= 80 ? 'hi' : pct >= 50 ? 'mid' : 'lo', css: { width: pct + '%' } })]), h('b', { text: pct + ' %' })])); });
    card.appendChild(cats);
    card.appendChild(h('h3', { text: t().perScen }));
    const ol = h('ol', { class: 'list' });
    ex.results.forEach(function (r) { ol.appendChild(h('li', { text: pick(r.title) + ': ' + fmt1(r.score10) + ' / 10' + (r.safety.length ? ' · ⚠ ' + r.safety.map(function (x) { return msg(x).t; }).join(', ') : '') })); });
    card.appendChild(ol);
    card.appendChild(h('p', { class: 'muted small', text: t().sentNote }));
    const b = getBest(); if (b !== null) card.appendChild(h('p', { class: 'muted small', text: t().best(fmt1(b)) }));
    root.appendChild(card);
    root.appendChild(h('h2', { text: t().review }));
    ex.results.forEach(function (r) {
      const det = h('details', { class: 'card' }, [h('summary', { text: pick(r.title) + ' — ' + fmt1(r.score10) + ' / 10' })]);
      det.appendChild(scenResultCard(r.cur, r.res, true));
      root.appendChild(det);
    });
  }

  /* ---------- Menú inicial ---------- */
  function viewHome(root) {
    if (EXAM) {
      const card = h('div', { class: 'card hero' });
      card.appendChild(h('span', { class: 'pill exam', text: t().modeExam }));
      card.appendChild(h('p', { text: t().examIntro }));
      card.appendChild(h('p', { class: 'muted small', text: t().examScoring }));
      const b = getBest(); if (b !== null) card.appendChild(h('p', { class: 'muted small', text: t().best(fmt1(b)) }));
      card.appendChild(btn(t().examStart, 'primary', function () {
        const list = L.pickExam(DATA.scenarios, Math.random).map(function (sc) { return { scen: sc, v: rnd(sc.variants.length) }; });
        S.exam = { list: list, idx: 0, results: [], reported: false };
        startScenario(list[0].scen, list[0].v);
      }, { id: 'btn-exam-start' }));
      root.appendChild(card);
      return;
    }
    const intro = h('div', { class: 'card hero' }, [h('span', { class: 'pill practice', text: t().modePractice }), h('p', { text: t().homePracticeIntro }), btn(t().guide, 'sm', function () { S.guide = true; render(); })]);
    root.appendChild(intro);
    [['prep', t().prepGroup], ['diag', t().diagGroup]].forEach(function (grp) {
      const sec = h('section', { class: 'group' }, [h('h2', { text: grp[1] })]);
      const g = h('div', { class: 'scen-grid' });
      DATA.scenarios.filter(function (sc) { return sc.type === grp[0] && !sc.free; }).forEach(function (sc) {
        const b = h('button', { type: 'button', class: 'scen-card', 'data-id': sc.id }, [h('span', { class: 'lvl l' + sc.level, text: t().level(sc.level) }), h('strong', { text: pick(sc.title) }), h('span', { class: 'small muted', text: pick(sc.brief) })]);
        b.addEventListener('click', function () { startScenario(sc, rnd(sc.variants.length)); });
        g.appendChild(b);
      });
      sec.appendChild(g);
      root.appendChild(sec);
    });
    const free = DATA.scenarios.find(function (x) { return x.free; });
    if (free) {
      const sec = h('section', { class: 'group' }, [h('h2', { text: t().freeGroup })]);
      const b = h('button', { type: 'button', class: 'scen-card free' }, [h('strong', { text: pick(free.title) }), h('span', { class: 'small muted', text: pick(free.brief) })]);
      b.addEventListener('click', function () { startScenario(free, 0); });
      sec.appendChild(b);
      root.appendChild(sec);
    }
  }
  function guideView() {
    const bg = h('div', { class: 'modal-bg' });
    const box = h('div', { class: 'modal guide', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'guide-t', tabindex: '-1', id: 'guide' });
    box.appendChild(h('h2', { id: 'guide-t', text: t().guide }));
    DATA.guide.forEach(function (sec) { box.appendChild(h('h3', { text: pick(sec.h) })); const ul = h('ul', { class: 'list' }); sec.p.forEach(function (p) { ul.appendChild(h('li', { text: pick(p) })); }); box.appendChild(ul); });
    box.appendChild(protocolCard());
    box.appendChild(btn(t().guideClose, 'primary', function () { S.guide = false; render(); }));
    bg.appendChild(box);
    bg.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { S.guide = false; render(); } });
    setTimeout(function () { const g = $('guide'); if (g) g.focus(); }, 0);
    return bg;
  }

  /* ---------- Render ---------- */
  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = pick(DATA.meta.title);
    $('title').textContent = pick(DATA.meta.title);
    $('lead').textContent = pick(DATA.meta.lead);
    $('note').textContent = t().note;
    $('src').textContent = pick(DATA.meta.src);
    $('back').textContent = t().back;
    $('lang').textContent = t().langbtn;
    $('home').textContent = t().home;
    $('home').hidden = S.view === 'home' || !!S.exam;
  }
  function render(focus) {
    applyStatic();
    const root = $('app');
    const keepScroll = !focus ? window.scrollY : 0;
    root.textContent = '';
    if (S.view === 'home') viewHome(root);
    else if (S.view === 'scenResult') viewScenResult(root);
    else if (S.view === 'final') viewFinal(root);
    else {
      const cur = S.cur;
      scenHeader(root, cur);
      const body = h('div', { class: 'step-body' });
      root.appendChild(body);
      ({ order: stepOrder, prep: stepPrep, checks: stepChecks, cycle: stepCycle, unload: stepUnload, controls: stepControls, decision: stepDecision, 'case': stepCase, diagnosis: stepDiagnosis })[cur.step](body, cur);
    }
    if (S.guide) root.appendChild(guideView());
    if (focus) {
      const f = $('title');
      try { window.scrollTo(0, 0); } catch (e) { /* ignora */ }
      if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
    } else if (keepScroll) { try { window.scrollTo(0, keepScroll); } catch (e) { /* ignora */ } }
  }

  $('back').addEventListener('click', function () { history.back(); });
  $('home').addEventListener('click', function () { stopLoop(); S.view = 'home'; S.cur = null; render(true); });
  $('lang').addEventListener('click', function () {
    lang = lang === 'ca' ? 'es' : 'ca';
    try { localStorage.setItem('campus-lang', lang); } catch (e) { /* ignora */ }
    render();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && S.guide) { S.guide = false; render(); } });
  render();
})();
