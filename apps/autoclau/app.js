'use strict';
/* Interfície del simulador d'autoclau de vapor. La lògica (física, avaluació) és a logic.js; els textos tècnics, a data.js.
   Sense paràmetres: mode pràctica (lliure i guiat, amb pistes i retroacció). Amb ?campus=<token>: mode avaluable (sorteig, sense retroacció, nota única al campus). */
(function () {
  const L = window.ToolLogic;
  const D = window.SimData;

  /* ======================= Textos de la interfície ======================= */
  const UI = {
    ca: {
      back: '← Tornar', home: 'Inici', langbtn: 'Castellano',
      note: 'Eina d\'estudi i consulta; segueix sempre el protocol del teu centre.',
      examBar: 'Mode avaluable: la nota final s\'envia al campus una sola vegada.', mockBar: 'Simulacre d\'avaluació: la nota no s\'envia enlloc.', linkFail: 'No s\'ha pogut connectar amb el campus: pots fer l\'activitat, però la nota no s\'enviarà.',
      homeIntro: 'Tria un escenari. En els d\'execució prepares l\'equip, carregues el material, programes i fas funcionar l\'autoclau, i revises els controls. En els de diagnòstic interpretes un tiquet, una full de Bowie-Dick, uns indicadors o un biològic i decideixes què cal fer.',
      runList: 'Preparar i executar un cicle', diagList: 'Diagnosticar i decidir', level: 'Nivell',
      freeLab: 'Laboratori lliure', freeLabD: 'Munta la teva càrrega amb tot el catàleg i experimenta amb programes, temps i errors.',
      mock: 'Simulacre d\'avaluació', mockD: '5 escenaris a l\'atzar, sense pistes gratuïtes ni retroacció fins al final, amb nota sobre 10 (no s\'envia).',
      examTitle: 'Activitat avaluable: autoclau de vapor', start: 'Comença', startExam: 'Comença l\'avaluació',
      examRules: ['Faràs 5 escenaris triats a l\'atzar: 2 d\'execució completa i 3 de diagnòstic.', 'No hi ha retroacció fins al final. Pots demanar una pista per escenari a canvi de −0,5 punts (màxim 2).', 'Cada escenari es puntua sobre 10: càrrega i envasat, paràmetres, procediment, controls i decisió final. Els errors greus de seguretat resten 3 punts, i alliberar material no estèril anul·la l\'escenari (0).', 'La nota final és la mitjana i s\'envia al campus una sola vegada en acabar.'],
      best: (b) => 'Millor nota en simulacre o avaluació: ' + b + '/10',
      steps: { checks: 'Comprovacions', load: 'Càrrega', program: 'Programa', cycle: 'Cicle', unload: 'Descàrrega', controls: 'Controls', decision: 'Decisió' },
      scen: (i, n) => 'Escenari ' + i + ' de ' + n,
      hint: 'Pista', hintExam: 'Pista (−0,5)', hintUsed: 'Pista',
      cont: 'Continua', finish: 'Finalitza l\'escenari', nextSc: 'Escenari següent', toResults: 'Veure el resultat final',
      /* comprovacions */
      chkTitle: 'Comprovacions prèvies de l\'equip', chkLead: 'Abans de carregar, posa l\'autoclau a punt. Fes només el que cal i en l\'ordre adequat.',
      water: 'Dipòsit d\'aigua', waterBtn: 'Comprovar el nivell', waterOk: 'Nivell correcte (entre el mínim i el màxim).', waterLow: 'Nivell per sota del mínim!', fillDemin: 'Omplir amb aigua desmineralitzada', fillTap: 'Omplir amb aigua de l\'aixeta', filled: (k) => 'Dipòsit omplert amb ' + (k === 'tap' ? 'aigua de l\'aixeta' : 'aigua desmineralitzada') + '.',
      clean: 'Cambra, junta i filtre', cleanBtn: 'Netejar la cambra i revisar la junta i el filtre del desguàs', cleanDone: 'Cambra neta, junta sense esquerdes i filtre lliure.',
      preheat: 'Precalentament', preheatBtn: 'Engegar i esperar el precalentament de la camisa', preheatDone: 'Camisa a temperatura: l\'equip està calent.', preheatNo: 'L\'equip ja ha treballat avui: està calent.',
      leak: 'Test de buit (estanquitat) · opcional', leakD: 'Fa el buit a la cambra buida i mesura quant puja la pressió en 10 min. Límit orientatiu: 1,3 mbar/min.', leakBtn: 'Fer el test de buit', leakQ: 'Resultat del test de buit:',
      bd: 'Test de Bowie-Dick', bdD: 'Comprova l\'eliminació de l\'aire i la penetració del vapor en un autoclau de prebuit. Es fa al començament de la jornada.', bdDone: 'Fet a primera hora: correcte.',
      bdWhyLoad: 'El paquet de prova va sol, a la cambra buida i a la safata inferior, a prop del desguàs: amb càrrega el test no és vàlid i surt malament. Torna-ho a provar triant la posició correcta.', bdPlace: 'On poses el paquet de prova?', bdEmpty: 'Cambra buida, safata inferior, a prop del desguàs', bdLoad: 'Amb la càrrega del dia, al mig de la cambra',
      bdBtn: 'Fer el Bowie-Dick (134 °C · 3,5 min)', bdBtn2: 'Repetir el Bowie-Dick', bdQ: 'Com interpretes la full de prova?', bdSheet: (i) => 'Full de Bowie-Dick ' + i,
      bdNext: 'La prova ha fallat. Què fas ara?', bdRepeat: 'Repetir la prova', bdContinue: 'Continuar i carregar el material', bdStop: 'Deixar l\'equip fora de servei i no carregar res',
      stoppedMsg: 'Equip aturat: no es processa cap càrrega. Ves a la decisió final.',
      pass: 'Correcta (viratge uniforme)', fail: 'Fallida (zona més clara o irregular)', leakPass: 'Correcte (≤ 1,3 mbar/min)', leakFail: 'Incorrecte (> 1,3 mbar/min)',
      running: 'Cicle de prova en marxa…',
      /* càrrega */
      loadTitle: 'Preparació i càrrega', loadLead: 'Obre cada element per inspeccionar-lo i decideix què en fas. Si va a l\'autoclau, tria l\'envàs, prepara\'l i col·loca\'l a la cambra.',
      fill: (p) => 'Ocupació de la cambra: ' + p + ' % (màxim 80 %)', inspect: 'Inspecció', dest: 'Destinació', pack: 'Envàs', prep: 'Preparació', place: 'Col·locació a la cambra',
      open: 'Instrumental obert, sense travar', fill34: 'Bossa omplerta com a màxim fins a 3/4', airOut: 'Aire tret abans de segellar', label: 'Etiqueta: data, contingut, lot, caducitat i operari', biTg: 'Indicador biològic (dins d\'un dispositiu de prova, PCD)', ci: 'Indicador químic intern', wall: 'Toca la paret de la cambra',
      shelf: 'Safata', pos: 'Posició', pending: 'Pendent', toSteam: 'A l\'autoclau', elsewhere: 'Fora d\'aquest cicle',
      addItem: 'Afegir material', addBtn: 'Afegir', removeBtn: 'Treure del carro', emptyCart: 'El carro és buit: afegeix material del catàleg.',
      fbOk: 'Correcte.', needDest: 'Falta decidir la destinació d\'algun element.', needOne: 'Cal carregar almenys un element a l\'autoclau.',
      /* programa */
      progTitle: 'Selecció del programa', progLead: 'Tria un programa validat o ajusta els paràmetres a mà segons el material carregat.', manual: 'Ajust manual', type: 'Tipus de cicle', typeB: 'Prebuit fraccionat (classe B)', typeN: 'Gravitatori (classe N)', typeL: 'Líquids', T: 'Temperatura (°C)', hold: 'Temps d\'esterilització (min)', dry: 'Assecat (min)', apply: 'Aplicar l\'ajust manual', closeDoor: 'Tancar la porta i anar al cicle', progSel: 'Programa seleccionat:', satRef: 'Referència: vapor saturat',
      /* cicle */
      cycTitle: 'Cicle d\'esterilització', cycLead: 'Prem INICI al panell. Vigila la pantalla, els manòmetres i la gràfica. Pots accelerar el temps o fer pausa.', cycEnd: 'Cicle acabat. Obre la porta quan es desbloquegi per descarregar.', alarmMsg: 'ALARMA: el cicle s\'ha avortat. L\'equip descomprimeix sol; no obris fins que la pressió sigui 0.',
      doorLocked: 'Bloqueig de seguretat: la porta no s\'obre amb pressió ni durant el cicle.', doorLockedPr: 'Intentar obrir la porta amb pressió o temperatura és un error greu (risc de cremades i d\'explosió de vapor). L\'intent queda registrat.',
      estopArm: 'Torna a prémer per confirmar l\'aturada', estopDone: 'Aturada d\'emergència: el cicle s\'ha interromput i l\'equip descomprimeix.',
      log: 'Registre d\'esdeveniments',
      /* aparell */
      mStart: 'INICI', mDoor: 'PORTA', mStop: 'ATURADA', mPause: 'Pausa', mPlay: 'Continua', mSpeed: 'Temps', machineLbl: 'Panell frontal de l\'autoclau', gaugeP: 'Manòmetre (bar)', gaugeT: 'Temperatura (°C)',
      lcdReady: 'EN ESPERA', lcdProg: 'PROG', lcdPhase: 'FASE', lcdTime: 'TEMPS', lcdLeft: 'MESETA RESTANT', lcdEnd: 'FI DE CICLE · PORTA', lcdLocked: 'BLOQUEJADA', lcdFree: 'DESBLOQUEJADA', lcdAlarm: 'ALARMA', lcdDoorOpen: 'PORTA OBERTA', lcdCold: 'FRED', lcdHot: 'CALENT',
      chartT: 'Temperatura cambra', chartP: 'Pressió (bar rel.)', noTicket: 'Sense tiquet: la impressora s\'ha quedat sense paper i la memòria no conserva el cicle.', ticket: 'Tiquet del cicle',
      /* descàrrega */
      unTitle: 'Descàrrega segura', unLead: 'Marca les accions que fas en descarregar (n\'hi ha d\'incorrectes).', packsTitle: 'Estat dels paquets en sortir',
      obsWet: 'Humit: gotes o taques', obsBurst: 'Envàs obert o trencat', obsDamage: 'Material deformat o malmès', obsExtOk: 'Indicador extern virat', obsExtNo: 'Indicador extern sense virar', obsDry: 'Sec i íntegre', obsNaked: 'Sense envàs',
      /* controls */
      ctlTitle: 'Controls i interpretació', ctlLead: 'Revisa el control físic (tiquet i gràfica), els indicadors químics i, si n\'hi ha, el biològic.',
      physQ: 'Control físic: com és el registre del cicle?', phys: { ok: 'Conforme: meseta completa, temperatura dins de la banda i pressió coherent', short: 'No conforme: temps de meseta insuficient', air: 'No conforme: pressió massa alta per a la temperatura (aire o gasos no condensables)', abort: 'No conforme: cicle avortat o incomplet', nonstd: 'No conforme: programa no validat' },
      ciQ: (n) => 'Indicador intern de «' + n + '»:', ciPass: 'Virat: zona d\'acceptació', ciFail: 'No virat: rebutjar el paquet', accept: 'ACCEPTAR', reject: 'REBUTJAR',
      biPreQ: 'Càrrega amb implants: què fas amb el lot mentre s\'incuba el biològic?', biPre: { release: 'Alliberar-lo ja: el tiquet és correcte', quarantine: 'Retenir-lo en quarantena fins al resultat', reprocess_all: 'Reprocessar-lo per seguretat' },
      biTempQ: 'A quina temperatura incubes el Geobacillus stearothermophilus?', biTemp: { 57: '55-60 °C (segons fabricant)', 37: '37 °C (com la majoria de bacteris)' }, biInc: 'Activar l\'ampolla i incubar amb el control (mateix lot, no processat)',
      biRead: 'Lectura del biològic (temps segons el fabricant):', biQ: 'Interpretació del biològic:', bi: { neg: 'Negatiu: no hi ha creixement (correcte)', pos: 'Positiu: hi ha creixement (fallada d\'esterilització)', inv: 'No vàlid: el control no ha crescut' }, vTest: 'Processat', vCtrl: 'Control',
      sheetCap: 'Full de prova després del cicle',
      /* decisió */
      decTitle: 'Decisió final', decLead: 'Decideix què fas amb cada paquet i quines accions prens (pots marcar-ne diverses).', dispTitle: 'Destinació de cada paquet', actTitle: 'Accions', storeTitle: 'Paquets del magatzem',
      /* resultat */
      resTitle: 'Resultat de l\'escenari', score: 'Nota', outOf: 'sobre 10', cats: { load: 'Càrrega i envasat', params: 'Paràmetres del cicle', proc: 'Procediment', ctrl: 'Controls i interpretació', dec: 'Decisió final i seguretat' },
      graves: 'Errors greus de seguretat', annul: 'Escenari anul·lat (0): s\'ha alliberat material no estèril.', errors: 'Errors i bona pràctica', noErrors: 'Cap error: procediment impecable.', expected: 'Decisió correcta', yourAns: 'Has respost', correctAns: 'Correcte', missed: 'Et va faltar', forbidden: 'Contraindicat', extra: 'Innecessari', disp: 'Paquet', hintsUsed: (n) => 'Pistes utilitzades: ' + n,
      grade: { excellent: 'Excel·lent', good: 'Bé', pass: 'Aprovat', fail: 'Cal repassar' },
      again: 'Repetir l\'escenari (nova variant)', toList: 'Tornar als escenaris', finalTitle: 'Resultat de l\'avaluació', perScen: 'Per escenari', sending: 'Enviant la nota al campus…', sent: 'Nota enviada al campus.', notSent: 'Simulacre: la nota no s\'ha enviat.',
      scoring: 'Puntuació de cada escenari: càrrega i envasat 25 %, paràmetres 15 %, procediment 20 %, controls 20 %, decisió 20 % (escenaris de diagnòstic: controls 50 % i decisió 50 %). Error greu de seguretat: −3. Alliberar material no estèril: 0.',
      grv: { door_open: 'Intent d\'obrir la porta amb pressió o durant el cicle', liquid_grave: 'Líquid en un cicle de sòlids', flam_grave: 'Producte inflamable dins l\'autoclau', grave_release: 'Material no estèril alliberat' },
      q: 'Pregunta', phase: 'Fase', min: 'min'
    },
    es: {
      back: '← Volver', home: 'Inicio', langbtn: 'Català',
      note: 'Herramienta de estudio y consulta; sigue siempre el protocolo de tu centro.',
      examBar: 'Modo evaluable: la nota final se envía al campus una sola vez.', mockBar: 'Simulacro de evaluación: la nota no se envía a ninguna parte.', linkFail: 'No se ha podido conectar con el campus: puedes hacer la actividad, pero la nota no se enviará.',
      homeIntro: 'Elige un escenario. En los de ejecución preparas el equipo, cargas el material, programas y haces funcionar el autoclave, y revisas los controles. En los de diagnóstico interpretas un tique, una hoja de Bowie-Dick, unos indicadores o un biológico y decides qué hay que hacer.',
      runList: 'Preparar y ejecutar un ciclo', diagList: 'Diagnosticar y decidir', level: 'Nivel',
      freeLab: 'Laboratorio libre', freeLabD: 'Monta tu carga con todo el catálogo y experimenta con programas, tiempos y errores.',
      mock: 'Simulacro de evaluación', mockD: '5 escenarios al azar, sin pistas gratuitas ni retroacción hasta el final, con nota sobre 10 (no se envía).',
      examTitle: 'Actividad evaluable: autoclave de vapor', start: 'Empieza', startExam: 'Empieza la evaluación',
      examRules: ['Harás 5 escenarios elegidos al azar: 2 de ejecución completa y 3 de diagnóstico.', 'No hay retroacción hasta el final. Puedes pedir una pista por escenario a cambio de −0,5 puntos (máximo 2).', 'Cada escenario se puntúa sobre 10: carga y envasado, parámetros, procedimiento, controles y decisión final. Los errores graves de seguridad restan 3 puntos, y liberar material no estéril anula el escenario (0).', 'La nota final es la media y se envía al campus una sola vez al terminar.'],
      best: (b) => 'Mejor nota en simulacro o evaluación: ' + b + '/10',
      steps: { checks: 'Comprobaciones', load: 'Carga', program: 'Programa', cycle: 'Ciclo', unload: 'Descarga', controls: 'Controles', decision: 'Decisión' },
      scen: (i, n) => 'Escenario ' + i + ' de ' + n,
      hint: 'Pista', hintExam: 'Pista (−0,5)', hintUsed: 'Pista',
      cont: 'Continuar', finish: 'Finalizar el escenario', nextSc: 'Escenario siguiente', toResults: 'Ver el resultado final',
      chkTitle: 'Comprobaciones previas del equipo', chkLead: 'Antes de cargar, pon el autoclave a punto. Haz solo lo necesario y en el orden adecuado.',
      water: 'Depósito de agua', waterBtn: 'Comprobar el nivel', waterOk: 'Nivel correcto (entre el mínimo y el máximo).', waterLow: '¡Nivel por debajo del mínimo!', fillDemin: 'Llenar con agua desmineralizada', fillTap: 'Llenar con agua del grifo', filled: (k) => 'Depósito llenado con ' + (k === 'tap' ? 'agua del grifo' : 'agua desmineralizada') + '.',
      clean: 'Cámara, junta y filtro', cleanBtn: 'Limpiar la cámara y revisar la junta y el filtro del desagüe', cleanDone: 'Cámara limpia, junta sin grietas y filtro libre.',
      preheat: 'Precalentamiento', preheatBtn: 'Encender y esperar el precalentamiento de la camisa', preheatDone: 'Camisa a temperatura: el equipo está caliente.', preheatNo: 'El equipo ya ha trabajado hoy: está caliente.',
      leak: 'Test de vacío (estanqueidad) · opcional', leakD: 'Hace el vacío en la cámara vacía y mide cuánto sube la presión en 10 min. Límite orientativo: 1,3 mbar/min.', leakBtn: 'Hacer el test de vacío', leakQ: 'Resultado del test de vacío:',
      bd: 'Test de Bowie-Dick', bdD: 'Comprueba la eliminación del aire y la penetración del vapor en un autoclave de prevacío. Se hace al empezar la jornada.', bdDone: 'Hecho a primera hora: correcto.',
      bdWhyLoad: 'El paquete de prueba va solo, en la cámara vacía y en la bandeja inferior, cerca del desagüe: con carga el test no es válido y sale mal. Vuelve a probar eligiendo la posición correcta.', bdPlace: '¿Dónde pones el paquete de prueba?', bdEmpty: 'Cámara vacía, bandeja inferior, cerca del desagüe', bdLoad: 'Con la carga del día, en medio de la cámara',
      bdBtn: 'Hacer el Bowie-Dick (134 °C · 3,5 min)', bdBtn2: 'Repetir el Bowie-Dick', bdQ: '¿Cómo interpretas la hoja de prueba?', bdSheet: (i) => 'Hoja de Bowie-Dick ' + i,
      bdNext: 'La prueba ha fallado. ¿Qué haces ahora?', bdRepeat: 'Repetir la prueba', bdContinue: 'Continuar y cargar el material', bdStop: 'Dejar el equipo fuera de servicio y no cargar nada',
      stoppedMsg: 'Equipo parado: no se procesa ninguna carga. Ve a la decisión final.',
      pass: 'Correcta (viraje uniforme)', fail: 'Fallida (zona más clara o irregular)', leakPass: 'Correcto (≤ 1,3 mbar/min)', leakFail: 'Incorrecto (> 1,3 mbar/min)',
      running: 'Ciclo de prueba en marcha…',
      loadTitle: 'Preparación y carga', loadLead: 'Abre cada elemento para inspeccionarlo y decide qué haces con él. Si va al autoclave, elige el envase, prepáralo y colócalo en la cámara.',
      fill: (p) => 'Ocupación de la cámara: ' + p + ' % (máximo 80 %)', inspect: 'Inspección', dest: 'Destino', pack: 'Envase', prep: 'Preparación', place: 'Colocación en la cámara',
      open: 'Instrumental abierto, sin trabar', fill34: 'Bolsa llenada como máximo hasta 3/4', airOut: 'Aire sacado antes de sellar', label: 'Etiqueta: fecha, contenido, lote, caducidad y operario', biTg: 'Indicador biológico (dentro de un dispositivo de prueba, PCD)', ci: 'Indicador químico interno', wall: 'Toca la pared de la cámara',
      shelf: 'Bandeja', pos: 'Posición', pending: 'Pendiente', toSteam: 'Al autoclave', elsewhere: 'Fuera de este ciclo',
      addItem: 'Añadir material', addBtn: 'Añadir', removeBtn: 'Quitar del carro', emptyCart: 'El carro está vacío: añade material del catálogo.',
      fbOk: 'Correcto.', needDest: 'Falta decidir el destino de algún elemento.', needOne: 'Hay que cargar al menos un elemento en el autoclave.',
      progTitle: 'Selección del programa', progLead: 'Elige un programa validado o ajusta los parámetros a mano según el material cargado.', manual: 'Ajuste manual', type: 'Tipo de ciclo', typeB: 'Prevacío fraccionado (clase B)', typeN: 'Gravitatorio (clase N)', typeL: 'Líquidos', T: 'Temperatura (°C)', hold: 'Tiempo de esterilización (min)', dry: 'Secado (min)', apply: 'Aplicar el ajuste manual', closeDoor: 'Cerrar la puerta e ir al ciclo', progSel: 'Programa seleccionado:', satRef: 'Referencia: vapor saturado',
      cycTitle: 'Ciclo de esterilización', cycLead: 'Pulsa INICIO en el panel. Vigila la pantalla, los manómetros y la gráfica. Puedes acelerar el tiempo o hacer pausa.', cycEnd: 'Ciclo terminado. Abre la puerta cuando se desbloquee para descargar.', alarmMsg: 'ALARMA: el ciclo se ha abortado. El equipo descomprime solo; no abras hasta que la presión sea 0.',
      doorLocked: 'Bloqueo de seguridad: la puerta no se abre con presión ni durante el ciclo.', doorLockedPr: 'Intentar abrir la puerta con presión o temperatura es un error grave (riesgo de quemaduras y de explosión de vapor). El intento queda registrado.',
      estopArm: 'Vuelve a pulsar para confirmar la parada', estopDone: 'Parada de emergencia: el ciclo se ha interrumpido y el equipo descomprime.',
      log: 'Registro de eventos',
      mStart: 'INICIO', mDoor: 'PUERTA', mStop: 'PARADA', mPause: 'Pausa', mPlay: 'Seguir', mSpeed: 'Tiempo', machineLbl: 'Panel frontal del autoclave', gaugeP: 'Manómetro (bar)', gaugeT: 'Temperatura (°C)',
      lcdReady: 'EN ESPERA', lcdProg: 'PROG', lcdPhase: 'FASE', lcdTime: 'TIEMPO', lcdLeft: 'MESETA RESTANTE', lcdEnd: 'FIN DE CICLO · PUERTA', lcdLocked: 'BLOQUEADA', lcdFree: 'DESBLOQUEADA', lcdAlarm: 'ALARMA', lcdDoorOpen: 'PUERTA ABIERTA', lcdCold: 'FRÍO', lcdHot: 'CALIENTE',
      chartT: 'Temperatura cámara', chartP: 'Presión (bar rel.)', noTicket: 'Sin tique: la impresora se ha quedado sin papel y la memoria no conserva el ciclo.', ticket: 'Tique del ciclo',
      unTitle: 'Descarga segura', unLead: 'Marca las acciones que haces al descargar (hay algunas incorrectas).', packsTitle: 'Estado de los paquetes al salir',
      obsWet: 'Húmedo: gotas o manchas', obsBurst: 'Envase abierto o roto', obsDamage: 'Material deformado o dañado', obsExtOk: 'Indicador externo virado', obsExtNo: 'Indicador externo sin virar', obsDry: 'Seco e íntegro', obsNaked: 'Sin envase',
      ctlTitle: 'Controles e interpretación', ctlLead: 'Revisa el control físico (tique y gráfica), los indicadores químicos y, si lo hay, el biológico.',
      physQ: 'Control físico: ¿cómo es el registro del ciclo?', phys: { ok: 'Conforme: meseta completa, temperatura dentro de la banda y presión coherente', short: 'No conforme: tiempo de meseta insuficiente', air: 'No conforme: presión demasiado alta para la temperatura (aire o gases no condensables)', abort: 'No conforme: ciclo abortado o incompleto', nonstd: 'No conforme: programa no validado' },
      ciQ: (n) => 'Indicador interno de «' + n + '»:', ciPass: 'Virado: zona de aceptación', ciFail: 'No virado: rechazar el paquete', accept: 'ACEPTAR', reject: 'RECHAZAR',
      biPreQ: 'Carga con implantes: ¿qué haces con el lote mientras se incuba el biológico?', biPre: { release: 'Liberarlo ya: el tique es correcto', quarantine: 'Retenerlo en cuarentena hasta el resultado', reprocess_all: 'Reprocesarlo por seguridad' },
      biTempQ: '¿A qué temperatura incubas el Geobacillus stearothermophilus?', biTemp: { 57: '55-60 °C (según fabricante)', 37: '37 °C (como la mayoría de bacterias)' }, biInc: 'Activar la ampolla e incubar con el control (mismo lote, no procesado)',
      biRead: 'Lectura del biológico (tiempo según el fabricante):', biQ: 'Interpretación del biológico:', bi: { neg: 'Negativo: no hay crecimiento (correcto)', pos: 'Positivo: hay crecimiento (fallo de esterilización)', inv: 'No válido: el control no ha crecido' }, vTest: 'Procesado', vCtrl: 'Control',
      sheetCap: 'Hoja de prueba después del ciclo',
      decTitle: 'Decisión final', decLead: 'Decide qué haces con cada paquete y qué acciones tomas (puedes marcar varias).', dispTitle: 'Destino de cada paquete', actTitle: 'Acciones', storeTitle: 'Paquetes del almacén',
      resTitle: 'Resultado del escenario', score: 'Nota', outOf: 'sobre 10', cats: { load: 'Carga y envasado', params: 'Parámetros del ciclo', proc: 'Procedimiento', ctrl: 'Controles e interpretación', dec: 'Decisión final y seguridad' },
      graves: 'Errores graves de seguridad', annul: 'Escenario anulado (0): se ha liberado material no estéril.', errors: 'Errores y buena práctica', noErrors: 'Ningún error: procedimiento impecable.', expected: 'Decisión correcta', yourAns: 'Has respondido', correctAns: 'Correcto', missed: 'Te faltó', forbidden: 'Contraindicado', extra: 'Innecesario', disp: 'Paquete', hintsUsed: (n) => 'Pistas utilizadas: ' + n,
      grade: { excellent: 'Excelente', good: 'Bien', pass: 'Aprobado', fail: 'Hay que repasar' },
      again: 'Repetir el escenario (nueva variante)', toList: 'Volver a los escenarios', finalTitle: 'Resultado de la evaluación', perScen: 'Por escenario', sending: 'Enviando la nota al campus…', sent: 'Nota enviada al campus.', notSent: 'Simulacro: la nota no se ha enviado.',
      scoring: 'Puntuación de cada escenario: carga y envasado 25 %, parámetros 15 %, procedimiento 20 %, controles 20 %, decisión 20 % (escenarios de diagnóstico: controles 50 % y decisión 50 %). Error grave de seguridad: −3. Liberar material no estéril: 0.',
      grv: { door_open: 'Intento de abrir la puerta con presión o durante el ciclo', liquid_grave: 'Líquido en un ciclo de sólidos', flam_grave: 'Producto inflamable dentro del autoclave', grave_release: 'Material no estéril liberado' },
      q: 'Pregunta', phase: 'Fase', min: 'min'
    }
  };

  /* ======================= Estat ======================= */
  function readLang() {
    let l = null;
    try { l = localStorage.getItem('campus-lang'); } catch (e) { /* sense emmagatzematge */ }
    if (l === 'ca' || l === 'es') return l;
    return /^es/i.test(navigator.language || '') ? 'es' : 'ca';
  }
  let lang = readLang();
  const li = () => (lang === 'es' ? 1 : 0);
  const t = () => UI[lang];
  const pk = (pair) => (pair ? pair[li()] : '');
  const $ = (id) => document.getElementById(id);
  const fmt = (x, d) => (d == null ? String(x) : Number(x).toFixed(d)).replace('.', ',');
  const rng = Math.random;

  /* mode avaluable: només si la URL porta ?campus= ; l'enllaç amb el campus es carrega dinàmicament */
  const campusParam = /[?&]campus=([^&#]+)/.exec(location.search || '');
  const examReal = !!campusParam;
  let linkFailed = false;
  if (examReal) {
    try {
      const s = document.createElement('script');
      s.src = '../campus-link/link.js';
      s.onerror = function () { linkFailed = true; renderHeader(); };
      document.head.appendChild(s);
    } catch (e) { linkFailed = true; }
  }

  let view = examReal ? 'examIntro' : 'home';
  let run = null;             /* partida en curs */
  let exam = null;            /* { ids, idx, results, real, sent } */
  let lastResult = null;
  let ui = {};                /* estat efímer de la interfície per partida */
  let M = null;               /* referències del panell de l'aparell */
  const pb = { sim: null, kind: null, t: 0, speed: 60, playing: false, onEnd: null, last: 0, raf: 0 };

  function h(tag, attrs, kids) {
    const e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'on') Object.keys(v).forEach((ev) => e.addEventListener(ev, v[ev]));
      else e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function svg(str) { const d = document.createElement('div'); d.innerHTML = str.trim(); return d.firstElementChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function bestKey() { return 'campus-sim-best-' + D.slug; }
  function getBest() { try { const v = parseFloat(localStorage.getItem(bestKey())); return isNaN(v) ? null : v; } catch (e) { return null; } }
  function setBest(v) { try { const b = getBest(); if (b === null || v > b) localStorage.setItem(bestKey(), String(v)); } catch (e) { /* ignora */ } }
  function order(key, arr) { ui.ord = ui.ord || {}; if (!ui.ord[key]) ui.ord[key] = L.shuffle(rng, arr); return ui.ord[key]; }
  const isExam = () => !!exam;
  const itemName = (id) => pk(D.items[id].n);
  function chip(label, pressed, onClick, extra) {
    return h('button', Object.assign({ type: 'button', class: 'chip', 'aria-pressed': pressed ? 'true' : 'false', on: { click: onClick } }, extra || {}), [label]);
  }
  function msg(code) { const m = D.M[code]; return m ? { err: m[li()], good: m[2 + li()] } : { err: code, good: '' }; }

  /* ======================= Capçalera ======================= */
  function renderHeader() {
    document.documentElement.lang = lang;
    document.title = pk(D.meta.title);
    $('title').textContent = pk(D.meta.title);
    $('lead').textContent = pk(D.meta.lead);
    $('note').textContent = t().note;
    $('src').textContent = pk(D.meta.src);
    $('back').textContent = t().back;
    $('lang').textContent = t().langbtn;
    $('home').textContent = t().home;
    $('home').hidden = examReal;
    const mb = $('modebar');
    if (exam || examReal) { mb.hidden = false; mb.textContent = (examReal && (!exam || exam.real)) ? (linkFailed ? t().linkFail : t().examBar) : t().mockBar; }
    else mb.hidden = true;
  }

  /* ======================= Pantalles d'inici ======================= */
  function levelDots(n) { return h('span', { class: 'lvl', 'aria-label': t().level + ' ' + n, text: '●'.repeat(n) + '○'.repeat(3 - n) }); }
  function renderHome(root) {
    const intro = h('div', { class: 'card' }, [h('p', { text: t().homeIntro }), h('p', { class: 'muted small', text: t().scoring })]);
    const b = getBest(); if (b !== null) intro.appendChild(h('p', { class: 'small', text: t().best(fmt(b)) }));
    root.appendChild(intro);
    const g = h('div', { class: 'grid2' });
    ['run', 'diag'].forEach(function (kind) {
      const c = h('div', { class: 'card' }, [h('h2', { text: kind === 'run' ? t().runList : t().diagList })]);
      const list = h('div', { class: 'sclist' });
      D.scenarios.filter((s) => s.kind === kind).sort((a, b2) => a.level - b2.level).forEach(function (s) {
        list.appendChild(h('button', { type: 'button', class: 'scbtn', on: { click: () => startScenario(s.id, 'practice') } }, [h('span', { text: pk(s.t) }), levelDots(s.level)]));
      });
      c.appendChild(list); g.appendChild(c);
    });
    root.appendChild(g);
    const g2 = h('div', { class: 'grid2' });
    g2.appendChild(h('div', { class: 'card' }, [h('h2', { text: t().freeLab }), h('p', { class: 'muted', text: t().freeLabD }), h('button', { type: 'button', class: 'btn primary', on: { click: startFree } }, [t().start])]));
    g2.appendChild(h('div', { class: 'card' }, [h('h2', { text: t().mock }), h('p', { class: 'muted', text: t().mockD }), h('button', { type: 'button', class: 'btn primary', on: { click: () => startExam(false) } }, [t().start])]));
    root.appendChild(g2);
  }
  function renderExamIntro(root) {
    const c = h('div', { class: 'card' }, [h('h2', { text: t().examTitle })]);
    const ul = h('ul', { class: 'list' }); t().examRules.forEach((r) => ul.appendChild(h('li', { text: r }))); c.appendChild(ul);
    if (linkFailed) c.appendChild(h('div', { class: 'fb warn', text: t().linkFail }));
    c.appendChild(h('button', { type: 'button', class: 'btn primary', id: 'go', on: { click: () => startExam(true) } }, [t().startExam]));
    root.appendChild(c);
  }

  /* ======================= Inici de partides ======================= */
  function resetPb() { if (pb.raf) cancelAnimationFrame(pb.raf); pb.raf = 0; pb.sim = null; pb.kind = null; pb.t = 0; pb.playing = false; pb.onEnd = null; }
  function startScenario(id, mode) {
    resetPb();
    run = L.createRun(D, id, { mode: mode || 'practice', rng: rng });
    ui = { open: null, log: [], alarmShown: false, doorOpen: false, msg: null };
    if (run.sc.kind === 'diag') { const bds = run.checks.bd; if (bds.length) { pb.sim = bds[bds.length - 1].sim; pb.kind = 'bd'; pb.t = pb.sim.total; } else if (run.sim) { pb.sim = run.sim; pb.kind = 'cycle'; pb.t = run.sim.total; } }
    view = 'scenario'; render(true);
  }
  function startFree() {
    const sc = { id: 'free', kind: 'run', level: 0, firstOfDay: true, free: true, t: [UI.ca.freeLab, UI.es.freeLab], brief: [UI.ca.freeLabD, UI.es.freeLabD], hint: D.scenarios[0].hint, cart: [], vary: { water: ['ok', 'low'] } };
    resetPb();
    run = L.createRun(D, sc, { mode: 'practice', rng: rng });
    ui = { open: null, log: [], alarmShown: false, doorOpen: false, msg: null };
    view = 'scenario'; render(true);
  }
  function startExam(real) {
    exam = { ids: L.drawExam(D, rng, 5), idx: 0, results: [], real: real, sent: false };
    startScenario(exam.ids[0], 'exam');
  }
  function nextExamScenario() {
    exam.idx++;
    if (exam.idx >= exam.ids.length) { view = 'examFinal'; resetPb(); render(true); return; }
    startScenario(exam.ids[exam.idx], 'exam');
  }

  /* ======================= Panell de l'aparell ======================= */
  const PHASE_COL = { pre: '--ph-pre', vac: '--ph-vac', purge: '--ph-purge', heat: '--ph-heat', hold: '--ph-hold', exh: '--ph-exh', cool: '--ph-cool', dry: '--ph-dry', vent: '--ph-vent', leak: '--ph-leak', end: '--ph-end' };
  function gaugeSVG(min, max, major, unit, color) {
    let ticks = '';
    for (let v = min; v <= max + 1e-9; v += major) {
      const a = (-135 + ((v - min) / (max - min)) * 270) * Math.PI / 180;
      const x1 = 50 + Math.sin(a) * 38, y1 = 50 - Math.cos(a) * 38, x2 = 50 + Math.sin(a) * 44, y2 = 50 - Math.cos(a) * 44;
      const tx = 50 + Math.sin(a) * 29, ty = 50 - Math.cos(a) * 29 + 3;
      ticks += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#333" stroke-width="1.4"/>';
      ticks += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" font-size="7.5" text-anchor="middle" fill="#333" font-family="system-ui">' + v + '</text>';
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + ticks +
      '<text x="50" y="72" font-size="8" text-anchor="middle" fill="#555" font-family="system-ui" font-weight="700">' + unit + '</text>' +
      '<text class="gval" x="50" y="85" font-size="9" text-anchor="middle" fill="#111" font-family="ui-monospace,monospace" font-weight="700"></text>' +
      '<g class="needle"><line x1="50" y1="56" x2="50" y2="12" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round"/></g>' +
      '<circle cx="50" cy="50" r="5" fill="#333"/></svg>';
  }
  function buildMachine(col) {
    M = {};
    const m = h('div', { class: 'machine', role: 'group', 'aria-label': t().machineLbl });
    M.status = h('span', { text: '' });
    m.appendChild(h('div', { class: 'mtop' }, [h('span', { text: 'AC-2 · ' + (lang === 'es' ? 'CLASE B · PREVACÍO' : 'CLASSE B · PREBUIT') }), M.status]));
    M.door = h('div', { class: 'door' });
    M.chamber = h('div', { class: 'chamberwrap' });
    M.door.appendChild(M.chamber);
    M.lock = h('div', { class: 'lock', 'aria-hidden': 'true', text: '🔒' });
    M.door.appendChild(M.lock);
    M.steam = h('div', { class: 'steam', 'aria-hidden': 'true' }, [h('i'), h('i'), h('i')]);
    M.door.appendChild(M.steam);
    M.lcd = h('div', { class: 'lcd', 'aria-hidden': 'true' });
    M.sr = h('div', { class: 'sr', 'aria-live': 'polite' });
    M.gP = h('div', { class: 'gauge', role: 'img', 'aria-label': t().gaugeP, html: gaugeSVG(-1, 3, 1, 'bar', '#1c7ed6') });
    M.gT = h('div', { class: 'gauge', role: 'img', 'aria-label': t().gaugeT, html: gaugeSVG(0, 150, 25, '°C', '#d9480f') });
    M.leds = h('div', { class: 'leds' });
    const ctrl = h('div', { class: 'ctrl' }, [M.lcd, h('div', { class: 'gauges' }, [M.gP, M.gT]), M.leds]);
    m.appendChild(h('div', { class: 'mbody' }, [M.door, ctrl]));
    M.bStart = h('button', { type: 'button', class: 'mbtn go', on: { click: onStart } }, [t().mStart]);
    M.bDoor = h('button', { type: 'button', class: 'mbtn', on: { click: onDoor } }, [t().mDoor]);
    M.bStop = h('button', { type: 'button', class: 'mbtn stop', 'aria-label': t().mStop, on: { click: onEstop } }, [t().mStop]);
    M.bPause = h('button', { type: 'button', class: 'mbtn', on: { click: () => { if (!pb.sim) return; if (pb.playing) pb.playing = false; else if (pb.t < pb.sim.total) { pb.playing = true; pb.last = 0; loop(); } updateMachine(); } } }, [t().mPause]);
    const sp = h('div', { class: 'speed', role: 'group', 'aria-label': t().mSpeed }, [h('span', { text: t().mSpeed + ' ' })]);
    M.speedBtns = [1, 10, 60, 240].map(function (v) { const b = h('button', { type: 'button', 'aria-pressed': pb.speed === v ? 'true' : 'false', on: { click: () => { pb.speed = v; updateMachine(); } } }, ['×' + v]); sp.appendChild(b); return { v: v, b: b }; });
    m.appendChild(h('div', { class: 'mbtns' }, [M.bStart, M.bDoor, M.bPause, sp, M.bStop]));
    M.chart = h('div', { class: 'chart' });
    m.appendChild(M.chart);
    m.appendChild(h('div', { class: 'legend' }, [h('span', {}, [h('i', { style: 'background:var(--temp)' }), t().chartT]), h('span', {}, [h('i', { style: 'background:var(--press)' }), t().chartP])]));
    M.ticket = h('pre', { class: 'ticket', 'aria-label': t().ticket, tabindex: '0' });
    m.appendChild(M.ticket);
    m.appendChild(M.sr);
    col.appendChild(m);
    M.chartSim = undefined; M.lastPh = undefined;
    drawChamber();
    updateMachine();
  }

  /* interior de la cambra (finestra de la porta) */
  function drawChamber() {
    if (!M) return;
    const items = run ? L.loaded(run) : [];
    let s = '<svg viewBox="0 0 200 200" role="img" aria-label="' + esc(lang === 'es' ? 'Interior de la cámara' : 'Interior de la cambra') + '"><defs><radialGradient id="cg" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#e9edf1"/><stop offset="1" stop-color="#8b95a1"/></radialGradient><clipPath id="cc"><circle cx="100" cy="100" r="96"/></clipPath></defs>';
    s += '<circle cx="100" cy="100" r="98" fill="url(#cg)" stroke="#5c6670" stroke-width="3"/><g clip-path="url(#cc)">';
    s += '<rect x="14" y="88" width="172" height="5" fill="#6c757d"/><rect x="14" y="152" width="172" height="5" fill="#6c757d"/>';
    const shelves = { up: [], low: [] };
    items.forEach((it) => shelves[it.ch.shelf === 'up' ? 'up' : 'low'].push(it));
    ['up', 'low'].forEach(function (sh) {
      const base = sh === 'up' ? 88 : 152;
      let x = 22;
      shelves[sh].forEach(function (it) {
        const d = D.items[it.id], ch = it.ch;
        const w = Math.max(8, Math.min(46, d.vol * 9));
        const xx = ch.wall ? (x < 100 ? 16 : 184 - w) : x;
        const col = ch.pack === 'cont' || ch.pack === 'box' ? '#8a96a3' : ch.pack === 'foil' ? '#ced4da' : ch.pack === 'crepe' ? '#74c0fc' : ch.pack === 'sms' ? '#63e6be' : ch.pack === 'cloth' ? '#e9ecef' : ch.pack === 'bag' ? '#f3ead7' : '#adb5bd';
        if (d.concave && ch.pos !== 'down') s += '<path d="M' + xx + ' ' + (base - 16) + ' Q' + (xx + w / 2) + ' ' + (base + 4) + ' ' + (xx + w) + ' ' + (base - 16) + '" fill="' + col + '" stroke="#495057"/>';
        else if (d.concave) s += '<path d="M' + xx + ' ' + base + ' Q' + (xx + w / 2) + ' ' + (base - 22) + ' ' + (xx + w) + ' ' + base + ' Z" fill="' + col + '" stroke="#495057"/>';
        else if (ch.pack === 'bag' && ch.pos === 'vert') s += '<rect x="' + xx + '" y="' + (base - 34) + '" width="6" height="34" fill="#f3ead7" stroke="#8d7b5a"/><rect x="' + (xx + 3) + '" y="' + (base - 34) + '" width="3" height="34" fill="#a5d8ff" opacity=".7"/>';
        else if (ch.pack === 'bag' && ch.pos === 'pp') s += '<rect x="' + xx + '" y="' + (base - 34) + '" width="6" height="34" fill="#a5d8ff" stroke="#4dabf7"/>';
        else if (ch.pos === 'flat' || ch.pos === 'stack') s += '<rect x="' + xx + '" y="' + (base - 10) + '" width="' + w + '" height="5" fill="' + col + '" stroke="#495057"/><rect x="' + (xx + 3) + '" y="' + (base - 16) + '" width="' + (w - 4) + '" height="6" fill="' + col + '" stroke="#495057"/>';
        else s += '<rect x="' + xx + '" y="' + (base - Math.min(40, 14 + d.vol * 5)) + '" width="' + w + '" height="' + Math.min(40, 14 + d.vol * 5) + '" rx="2" fill="' + col + '" stroke="#495057"/>';
        if (ch.bi) s += '<circle cx="' + (xx + 4) + '" cy="' + (base - 4) + '" r="3" fill="#7048e8"/>';
        x += (ch.pack === 'bag' && ch.pos === 'vert' ? 9 : w + 5);
      });
    });
    if (ui.doorOpen === false && run && run.sim && pb.kind === 'cycle' && pb.t < run.sim.total) s += '<rect x="0" y="0" width="200" height="200" fill="#fff" opacity=".18"/>';
    s += '</g></svg>';
    M.chamber.innerHTML = s;
    const svgEl = M.chamber.firstElementChild;
    if (svgEl) { svgEl.style.position = 'absolute'; svgEl.style.inset = '9%'; svgEl.style.width = '82%'; svgEl.style.height = '82%'; }
  }

  function phaseList(type) {
    if (type === 'N') return ['pre', 'purge', 'heat', 'hold', 'exh', 'dry', 'end'];
    if (type === 'L') return ['pre', 'purge', 'heat', 'hold', 'exh', 'cool', 'end'];
    if (type === 'LEAK') return ['pre', 'leak', 'vent', 'end'];
    return ['pre', 'vac', 'heat', 'hold', 'exh', 'dry', 'end'];
  }
  function drawChartBase() {
    if (!M) return;
    const sim = pb.sim;
    M.chartSim = sim;
    const W = 600, H = 220, x0 = 38, x1 = 562, y0 = 14, y1 = 190;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t().chartT + ' / ' + t().chartP) + '">';
    if (sim) {
      sim.phases.forEach(function (p) {
        const a = x0 + (p.t0 / sim.total) * (x1 - x0), b = x0 + (p.t1 / sim.total) * (x1 - x0);
        if (b - a > 0.3) s += '<rect x="' + a.toFixed(1) + '" y="' + y0 + '" width="' + (b - a).toFixed(1) + '" height="' + (y1 - y0) + '" fill="var(' + (PHASE_COL[p.id] || '--ph-pre') + ')" opacity=".22"/>';
      });
    }
    for (let v = 0; v <= 140; v += 20) { const y = y1 - (v / 140) * (y1 - y0); s += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--grid)"/><text x="' + (x0 - 4) + '" y="' + (y + 3).toFixed(1) + '" font-size="9" text-anchor="end" fill="var(--temp)">' + v + '</text>'; }
    for (let v = -1; v <= 3; v++) { const y = y1 - ((v + 1) / 4) * (y1 - y0); s += '<text x="' + (x1 + 4) + '" y="' + (y + 3).toFixed(1) + '" font-size="9" fill="var(--press)">' + v + '</text>'; }
    if (sim) { const mins = sim.total / 60; const step = mins > 40 ? 10 : 5; for (let m = 0; m <= mins; m += step) { const x = x0 + (m * 60 / sim.total) * (x1 - x0); s += '<text x="' + x.toFixed(1) + '" y="' + (y1 + 13) + '" font-size="9" text-anchor="middle" fill="var(--muted)">' + m + ' min</text>'; } }
    s += '<polyline class="pT" fill="none" stroke="var(--temp)" stroke-width="2"/><polyline class="pP" fill="none" stroke="var(--press)" stroke-width="2"/><line class="cur" y1="' + y0 + '" y2="' + y1 + '" stroke="var(--text)" stroke-dasharray="3 3" opacity=".5"/></svg>';
    M.chart.innerHTML = s;
    M.pT = M.chart.querySelector('.pT'); M.pP = M.chart.querySelector('.pP'); M.cur = M.chart.querySelector('.cur');
    M.geo = { x0: x0, x1: x1, y0: y0, y1: y1 };
  }
  function updateChart() {
    const sim = pb.sim;
    if (M.chartSim !== sim) drawChartBase();
    if (!sim) { M.pT.setAttribute('points', ''); M.pP.setAttribute('points', ''); return; }
    const g = M.geo; let a = '', b = '';
    for (const p of sim.series) {
      if (p.t > pb.t) break;
      const x = g.x0 + (p.t / sim.total) * (g.x1 - g.x0);
      a += x.toFixed(1) + ',' + (g.y1 - (Math.max(0, p.T) / 140) * (g.y1 - g.y0)).toFixed(1) + ' ';
      b += x.toFixed(1) + ',' + (g.y1 - ((p.P + 1) / 4) * (g.y1 - g.y0)).toFixed(1) + ' ';
    }
    M.pT.setAttribute('points', a); M.pP.setAttribute('points', b);
    const cx = g.x0 + (Math.min(pb.t, sim.total) / sim.total) * (g.x1 - g.x0);
    M.cur.setAttribute('x1', cx.toFixed(1)); M.cur.setAttribute('x2', cx.toFixed(1));
  }
  function setNeedle(g, v, min, max, txt) {
    const ang = -135 + clamp01((v - min) / (max - min)) * 270;
    const n = g.querySelector('.needle'); if (n) n.style.transform = 'rotate(' + ang.toFixed(1) + 'deg)';
    const tv = g.querySelector('.gval'); if (tv) tv.textContent = txt;
  }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function progLabel() {
    if (pb.kind === 'bd') return 'BOWIE-DICK';
    if (pb.kind === 'leak') return lang === 'es' ? 'TEST VACÍO' : 'TEST BUIT';
    if (run && run.prog) { const p = D.programs.find((x) => x.id === run.prog.id); return p ? p.n[li()].split(' · ')[0] + ' ' + run.prog.T + '°C ' + fmt(run.prog.hold) + "'" : 'MAN ' + run.prog.T + '°C ' + fmt(run.prog.hold) + "'"; }
    return '—';
  }
  function updateMachine() {
    if (!M || !run) return;
    const sim = pb.sim;
    let T = run.checks.preheat || run.preheatedStart ? 72 : 22, P = 0, ph = null;
    if (sim) { const s = L.at(sim, pb.t); T = s.T; P = s.P; ph = L.phaseAt(sim, pb.t); }
    setNeedle(M.gP, P, -1, 3, fmt(P, 2));
    setNeedle(M.gT, T, 0, 150, fmt(T, 1));
    const running = sim && pb.t < sim.total;
    const locked = sim && running ? true : (sim ? L.doorLocked(sim, pb.t) : false);
    M.lock.classList.toggle('on', !!locked);
    M.door.classList.toggle('open', !!ui.doorOpen);
    M.steam.classList.toggle('on', ph === 'exh' || ph === 'vent');
    const alarmOn = sim && sim.aborted && sim.alarmT != null && pb.t >= sim.alarmT && sim.alarm !== 'manual';
    let lcd = '<div class="dim">' + t().lcdProg + ' ' + esc(progLabel()) + '</div>';
    if (!sim) lcd += '<div class="big">' + t().lcdReady + '</div><div class="dim">' + fmt(T, 1) + ' °C · ' + fmt(P, 2) + ' bar · ' + (T > 60 ? t().lcdHot : t().lcdCold) + '</div>';
    else {
      lcd += '<div class="big">' + esc(running ? pk(D.phases[ph]).toUpperCase() : t().lcdEnd) + '</div>';
      if (!running) lcd += '<div>' + (locked ? t().lcdLocked : (ui.doorOpen ? t().lcdDoorOpen : t().lcdFree)) + '</div>';
      lcd += '<div>' + fmt(T, 1) + ' °C  ' + fmt(P, 2) + ' bar  ' + t().lcdTime + ' ' + mmss(pb.t) + '</div>';
      if (ph === 'hold' && sim.holdInfo && running) lcd += '<div>' + t().lcdLeft + ' ' + mmss(Math.max(0, sim.holdInfo.end - pb.t)) + '</div>';
      if (alarmOn) lcd += '<div class="alarm"></div>';
    }
    M.lcd.innerHTML = lcd;
    if (alarmOn) { const al = M.lcd.querySelector('.alarm'); if (al) al.textContent = '⚠ ' + t().lcdAlarm + ': ' + (D.ticket[lang]['al_' + sim.alarm] || sim.alarm); }
    if (ph !== M.lastPh) { M.lastPh = ph; M.sr.textContent = ph ? pk(D.phases[ph]) : ''; }
    /* llums de fase */
    const list = phaseList(sim ? sim.type : (run.prog ? run.prog.type : 'B'));
    M.leds.textContent = '';
    list.forEach(function (id) {
      let cls = 'led';
      if (sim) {
        const pdef = sim.phases.find((p) => p.id === id);
        if (ph === id && running) cls += ' on'; else if (pdef && pb.t >= pdef.t1) cls += ' done';
        if (id === 'hold' && alarmOn) cls += ' err';
      }
      M.leds.appendChild(h('span', { class: cls }, [h('b'), pk(D.phases[id])]));
    });
    M.status.textContent = sim ? (running ? '● ' + (pb.playing ? '' : '❚❚ ') + '×' + pb.speed : (alarmOn ? '⚠ ' + t().lcdAlarm : '✓')) : '';
    /* botons */
    M.bStart.disabled = !(run.stage === 'cycle' && !run.sim);
    M.bStop.disabled = !(pb.kind === 'cycle' && running);
    M.bPause.disabled = !running;
    M.bPause.textContent = pb.playing ? t().mPause : t().mPlay;
    M.bDoor.disabled = !(run.stage === 'cycle' && run.sim) && !(pb.kind === 'cycle' && running);
    M.speedBtns.forEach((x) => x.b.setAttribute('aria-pressed', pb.speed === x.v ? 'true' : 'false'));
    updateChart();
    updateTicket();
  }
  function updateTicket() {
    const sim = pb.sim;
    if (!sim) { M.ticket.textContent = ''; M.ticket.classList.add('empty'); return; }
    if (run.noRecord && pb.kind === 'cycle') { M.ticket.textContent = t().noTicket; M.ticket.classList.add('empty'); return; }
    M.ticket.classList.remove('empty');
    let lines;
    if (pb.kind === 'bd') lines = L.ticket(D, run, sim, lang, 'bd');
    else if (pb.kind === 'leak') lines = L.ticket(D, run, sim, lang, 'leak');
    else lines = L.ticket(D, run, sim, lang);
    if (run.machineOk && pb.kind === 'cycle') lines = lines.map((x) => x.indexOf('***') === 0 ? '*** ' + D.ticket[lang].good + ' ***' : x);
    if (pb.t < sim.total) {
      const head = lines.indexOf(D.ticket[lang].cols) + 1;
      const started = sim.phases.filter((p) => p.t0 <= pb.t).length;
      lines = lines.slice(0, head + started);
    }
    const txt = lines.join('\n');
    if (M.ticket.textContent !== txt) M.ticket.textContent = txt;
  }

  /* ======================= Reproducció ======================= */
  function play(sim, kind, onEnd, speed) {
    if (pb.raf) cancelAnimationFrame(pb.raf);
    pb.sim = sim; pb.kind = kind; pb.t = 0; pb.playing = true; pb.onEnd = onEnd || null; pb.last = 0;
    if (speed) pb.speed = speed;
    if (M) drawChartBase();
    loop();
  }
  function loop() { if (!pb.raf) pb.raf = requestAnimationFrame(frame); }
  function frame(ts) {
    pb.raf = 0;
    if (!pb.playing || !pb.sim) return;
    const dt = pb.last ? Math.min(0.25, (ts - pb.last) / 1000) : 0;
    pb.last = ts;
    pb.t = Math.min(pb.sim.total, pb.t + dt * pb.speed);
    if (pb.kind === 'cycle' && run && run.sim && run.sim.aborted && run.sim.alarm !== 'manual' && pb.t >= run.sim.alarmT && !ui.alarmShown) {
      ui.alarmShown = true; addLog('⚠ ' + t().alarmMsg, true); renderStage();
    }
    updateMachine();
    if (pb.t >= pb.sim.total) { pb.playing = false; const cb = pb.onEnd; pb.onEnd = null; drawChamber(); updateMachine(); if (cb) cb(); return; }
    loop();
  }
  function addLog(text, alarm) { ui.log.push({ t: pb.t, text: text, alarm: !!alarm }); }

  /* botons del panell */
  function onStart() {
    if (!run || run.stage !== 'cycle' || run.sim) return;
    L.startCycle(D, run);
    ui.doorOpen = false;
    addLog(t().mStart + ' · ' + progLabel());
    play(run.sim, 'cycle', function () { addLog(t().cycEnd); renderStage(); });
    renderStage();
  }
  function onDoor() {
    if (!run || !run.sim || pb.kind !== 'cycle') return;
    const r = L.doorAttempt(run, pb.t);
    if (r.locked) { ui.msg = { cls: 'bad', text: t().doorLocked + (isExam() ? '' : ' ' + t().doorLockedPr) }; addLog('🔒 ' + t().doorLocked, true); renderStage(); return; }
    ui.doorOpen = true;
    L.finishCycle(D, run);
    ui.msg = null;
    renderStage(true); updateMachine();
  }
  let estopArmed = 0;
  function onEstop() {
    if (!run || pb.kind !== 'cycle' || !pb.sim || pb.t >= pb.sim.total) return;
    const now = Date.now();
    if (now - estopArmed > 3000) { estopArmed = now; M.status.textContent = t().estopArm; return; }
    estopArmed = 0;
    L.emergencyStop(D, run, pb.t);
    pb.sim = run.sim; drawChartBase();
    addLog('⛔ ' + t().estopDone, true);
    ui.msg = { cls: 'warn', text: t().estopDone };
    renderStage();
  }

  /* ======================= Il·lustracions SVG ======================= */
  const ICON = {
    instr: '<circle cx="12" cy="30" r="5" fill="none" stroke="#495057" stroke-width="2"/><circle cx="22" cy="32" r="5" fill="none" stroke="#495057" stroke-width="2"/><path d="M15 26 L33 6 M20 27 L32 8" stroke="#868e96" stroke-width="3"/>',
    bowl: '<path d="M4 16 Q20 40 36 16 Z" fill="#ced4da" stroke="#495057" stroke-width="2"/>',
    glass: '<rect x="11" y="8" width="18" height="26" rx="3" fill="#d0ebff" stroke="#495057" stroke-width="2"/>',
    set: '<rect x="4" y="12" width="32" height="20" rx="3" fill="#adb5bd" stroke="#495057" stroke-width="2"/><path d="M8 18h24M8 24h24" stroke="#495057"/>',
    cont: '<rect x="3" y="10" width="34" height="24" rx="3" fill="#868e96" stroke="#343a40" stroke-width="2"/><circle cx="12" cy="16" r="3" fill="#dee2e6"/><circle cx="28" cy="16" r="3" fill="#dee2e6"/>',
    implant: '<rect x="3" y="10" width="34" height="24" rx="3" fill="#868e96" stroke="#343a40" stroke-width="2"/><path d="M14 16v12M18 16v12M24 20h8" stroke="#f8f9fa" stroke-width="2"/>',
    textile: '<path d="M5 12 h30 v18 h-30 z" fill="#f8f9fa" stroke="#495057" stroke-width="2"/><path d="M5 18h30M5 24h30" stroke="#ced4da"/>',
    lumen: '<path d="M4 30 L36 10" stroke="#495057" stroke-width="6" stroke-linecap="round"/><path d="M4 30 L36 10" stroke="#e9ecef" stroke-width="2"/>',
    silicone: '<path d="M6 30 C12 4 28 36 34 10" fill="none" stroke="#91a7ff" stroke-width="5"/>',
    rubber: '<path d="M6 30 C12 4 28 36 34 10" fill="none" stroke="#e8590c" stroke-width="5"/>',
    pp: '<path d="M10 10 h20 l-3 24 h-14 z" fill="#fff3bf" stroke="#495057" stroke-width="2"/>',
    tl: '<path d="M6 20h10l4-6 4 12 4-6h6" fill="none" stroke="#20c997" stroke-width="3"/>',
    endo: '<circle cx="14" cy="22" r="9" fill="none" stroke="#343a40" stroke-width="3"/><path d="M23 22 h12" stroke="#343a40" stroke-width="5"/>',
    oil: '<rect x="10" y="12" width="20" height="22" rx="4" fill="#ffe066" stroke="#495057" stroke-width="2"/><rect x="12" y="7" width="16" height="6" fill="#495057"/>',
    powder: '<rect x="11" y="10" width="18" height="24" rx="3" fill="#fff" stroke="#495057" stroke-width="2"/><circle cx="16" cy="7" r="1.5" fill="#495057"/><circle cx="20" cy="6" r="1.5" fill="#495057"/><circle cx="24" cy="7" r="1.5" fill="#495057"/>',
    single: '<rect x="6" y="17" width="22" height="7" fill="#e7f5ff" stroke="#495057" stroke-width="2"/><path d="M28 20.5h8M2 20.5h4" stroke="#495057" stroke-width="2"/>',
    liquid: '<path d="M14 6h12v6l4 6v16h-20v-16l4-6z" fill="#d0ebff" stroke="#495057" stroke-width="2"/><rect x="10" y="24" width="20" height="10" fill="#74c0fc"/>',
    flam: '<path d="M14 6h12v6l4 6v16h-20v-16l4-6z" fill="#fff" stroke="#495057" stroke-width="2"/><path d="M20 30 c-5 -4 0 -8 0 -12 c4 4 6 8 0 12z" fill="#fa5252"/>'
  };
  function itemIcon(id) { return '<svg class="ico" viewBox="0 0 40 40" aria-hidden="true">' + (ICON[D.items[id].k] || ICON.instr) + '</svg>'; }
  /* paquet a la sortida: p = { id, pkg, ext, wet[], burst, damage } */
  function packSVG(p) {
    const turned = p.ext !== false;
    const ind = turned ? '#4a3426' : '#e599f7';
    let s = '<svg viewBox="0 0 120 84" aria-hidden="true">';
    const pkg = p.pkg;
    if (pkg === 'bag' || pkg === 'poly') {
      s += '<rect x="8" y="8" width="104" height="66" rx="2" fill="' + (pkg === 'poly' ? '#e7f5ff' : '#f3ead7') + '" stroke="#8d7b5a"/>';
      s += '<rect x="8" y="8" width="104" height="66" fill="#a5d8ff" opacity=".28"/><path d="M8 16 h104" stroke="#8d7b5a" stroke-dasharray="4 3"/>';
      s += '<path d="M30 46 l40 -14" stroke="#868e96" stroke-width="4" stroke-linecap="round"/><circle cx="28" cy="48" r="5" fill="none" stroke="#868e96" stroke-width="2"/>';
      if (pkg === 'bag') s += '<rect x="86" y="54" width="20" height="10" rx="2" fill="' + ind + '"/><path d="M90 59 h12" stroke="#fff" stroke-width="1.5"/>';
    } else if (pkg === 'cont' || pkg === 'box') {
      s += '<rect x="8" y="18" width="104" height="56" rx="4" fill="' + (pkg === 'box' ? '#5c6670' : '#8a96a3') + '" stroke="#343a40" stroke-width="2"/><rect x="6" y="12" width="108" height="10" rx="3" fill="' + (pkg === 'box' ? '#495057' : '#adb5bd') + '" stroke="#343a40"/>';
      if (pkg === 'cont') s += '<circle cx="34" cy="17" r="3.5" fill="#f8f9fa"/><circle cx="86" cy="17" r="3.5" fill="#f8f9fa"/>';
      s += '<rect x="44" y="36" width="34" height="12" fill="#fff" stroke="#adb5bd"/><path d="M48 46 l6 -8 M56 46 l6 -8 M64 46 l6 -8" stroke="' + (turned ? '#212529' : '#e9ecef') + '" stroke-width="2"/>';
    } else if (pkg === 'crepe' || pkg === 'sms' || pkg === 'cloth') {
      const c = pkg === 'crepe' ? '#74c0fc' : pkg === 'sms' ? '#63e6be' : '#f1f3f5';
      s += '<rect x="10" y="10" width="100" height="64" rx="6" fill="' + c + '" stroke="#495057"/><path d="M10 10 L60 42 L110 10 M10 74 L60 42 L110 74" stroke="#495057" opacity=".35" fill="none"/>';
      s += '<rect x="40" y="36" width="40" height="11" fill="#fff" stroke="#adb5bd"/><path d="M44 45 l6 -7 M53 45 l6 -7 M62 45 l6 -7 M71 45 l6 -7" stroke="' + (turned ? '#212529' : '#e9ecef') + '" stroke-width="2"/>';
    } else if (pkg === 'foil') {
      s += '<path d="M12 18 L40 8 L72 14 L108 10 L104 70 L70 76 L36 72 L14 66 Z" fill="#dee2e6" stroke="#868e96"/><path d="M30 20 L44 60 M70 18 L80 66" stroke="#fff" opacity=".7"/>';
      s += '<rect x="40" y="36" width="40" height="11" fill="#fff" stroke="#adb5bd"/><path d="M44 45 l6 -7 M53 45 l6 -7 M62 45 l6 -7 M71 45 l6 -7" stroke="' + (turned ? '#212529' : '#e9ecef') + '" stroke-width="2"/>';
    } else {
      s += '<g transform="translate(40 22) scale(1)">' + (ICON[D.items[p.id].k] || ICON.instr) + '</g>';
    }
    if (p.wet && p.wet.length) s += '<ellipse cx="44" cy="58" rx="20" ry="9" fill="#1c7ed6" opacity=".18"/><path d="M30 30 q3 6 0 8 q-3 -2 0 -8z M52 24 q3 6 0 8 q-3 -2 0 -8z M80 40 q3 6 0 8 q-3 -2 0 -8z M64 60 q3 6 0 8 q-3 -2 0 -8z" fill="#339af0"/>';
    if (p.burst) s += '<path d="M60 8 l6 10 l-8 6 l8 8 l-6 8" fill="none" stroke="#e03131" stroke-width="3"/>';
    if (p.damage) s += '<path d="M92 4 l12 22 h-24 z" fill="#ffd43b" stroke="#e67700"/><text x="92" y="22" font-size="12" text-anchor="middle" font-weight="700" fill="#5c3d00">!</text>';
    return s + '</svg>';
  }
  function ciSVG(cls, pass, idx) {
    if (cls === 5) {
      const len = pass ? 92 : 46;
      return '<svg viewBox="0 0 170 50" role="img" aria-label="' + esc(t().ci) + '"><rect x="2" y="6" width="166" height="38" rx="4" fill="#fff" stroke="#adb5bd"/><rect x="12" y="18" width="104" height="12" fill="#f1f3f5" stroke="#868e96"/><rect x="66" y="18" width="50" height="12" fill="#d3f9d8" opacity=".9"/>' +
        '<rect x="12" y="18" width="' + len + '" height="12" fill="#212529"/><text x="40" y="15" font-size="7" fill="#c92a2a" font-family="system-ui" font-weight="700">' + esc(t().reject) + '</text><text x="74" y="15" font-size="7" fill="#2b8a3e" font-family="system-ui" font-weight="700">' + esc(t().accept) + '</text><text x="124" y="28" font-size="8" fill="#495057" font-family="system-ui">CL 5 · ' + idx + '</text></svg>';
    }
    const col = pass ? '#212529' : '#c8a96a';
    return '<svg viewBox="0 0 170 50" role="img" aria-label="' + esc(t().ci) + '"><rect x="2" y="6" width="166" height="38" rx="4" fill="#fff" stroke="#adb5bd"/><rect x="14" y="14" width="40" height="22" rx="3" fill="' + col + '"/><rect x="62" y="14" width="40" height="22" rx="3" fill="#212529"/><text x="66" y="44" font-size="6" fill="#495057" font-family="system-ui">REF</text><text x="112" y="29" font-size="8" fill="#495057" font-family="system-ui">CL ' + cls + ' · ' + idx + '</text></svg>';
  }
  function bdSVG(pale, i) {
    const id = 'bdg' + i;
    const center = mix('#3b2f2f', '#efe0b0', pale);
    return '<svg viewBox="0 0 160 160" role="img" aria-label="' + esc(t().bdSheet(i)) + '"><defs><radialGradient id="' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + center + '"/><stop offset="' + (0.25 + pale * 0.5).toFixed(2) + '" stop-color="' + mix('#3b2f2f', '#c9b48a', pale * 0.6) + '"/><stop offset="1" stop-color="#3b2f2f"/></radialGradient>' +
      '<pattern id="' + id + 'p" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0 L10 10 M10 0 L0 10" stroke="#000" stroke-width=".6" opacity=".25"/></pattern></defs>' +
      '<rect x="6" y="6" width="148" height="148" fill="url(#' + id + ')" stroke="#adb5bd"/><rect x="6" y="6" width="148" height="148" fill="url(#' + id + 'p)"/><text x="80" y="152" font-size="8" text-anchor="middle" fill="#fff" font-family="system-ui">BOWIE-DICK · 134 °C 3,5 min</text></svg>';
  }
  function mix(a, b, k) {
    const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16)), pbb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pbb[i] - v) * clamp01(k)).toString(16).padStart(2, '0')).join('');
  }
  function vialSVG(res, label) {
    const col = res === 'pos' ? '#fcc419' : '#7048e8';
    return '<svg viewBox="0 0 60 150" role="img" aria-label="' + esc(label) + '"><rect x="18" y="4" width="24" height="18" rx="3" fill="#495057"/><rect x="20" y="22" width="20" height="108" rx="10" fill="#f8f9fa" stroke="#868e96" stroke-width="2"/><rect x="22" y="70" width="16" height="58" rx="8" fill="' + col + '"/>' + (res === 'pos' ? '<path d="M24 90 h12 M25 100 h10 M24 110 h12" stroke="#e67700" opacity=".5"/>' : '') + '<text x="30" y="146" font-size="9" text-anchor="middle" fill="currentColor" font-family="system-ui">' + esc(label) + '</text></svg>';
  }
  function waterSVG(level) {
    const h0 = level === 'low' ? 14 : 62;
    return '<svg viewBox="0 0 60 100" width="48" height="80" aria-hidden="true"><rect x="16" y="6" width="28" height="88" rx="6" fill="#f1f3f5" stroke="#495057" stroke-width="2"/><rect x="18" y="' + (92 - h0) + '" width="24" height="' + h0 + '" rx="4" fill="#4dabf7"/><path d="M10 74 h8 M10 22 h8" stroke="#c92a2a" stroke-width="2"/><text x="2" y="77" font-size="7" fill="#c92a2a">min</text><text x="2" y="25" font-size="7" fill="#c92a2a">max</text></svg>';
  }

  /* ======================= Escenari: estructura ======================= */
  function stagesOf() {
    if (run.sc.kind === 'diag') return ['controls', 'decision'];
    return ['checks', 'load', 'program', 'cycle', 'unload', 'controls', 'decision'];
  }
  function renderScenario(root) {
    const sc = run.sc;
    const head = h('div', { class: 'card' });
    const top = h('div', { class: 'row between' }, [h('h2', { text: pk(sc.t) }), exam ? h('span', { class: 'pill', text: t().scen(exam.idx + 1, exam.ids.length) }) : (sc.level ? levelDots(sc.level) : null)]);
    head.appendChild(top);
    head.appendChild(h('p', { text: pk(sc.brief) }));
    const hintBox = h('div');
    const hb = h('button', { type: 'button', class: 'btn sm', on: { click: function () {
      if (isExam()) { if (run.hints >= 2) return; L.useHint(run); }
      ui.hintShown = true; hintBox.textContent = ''; hintBox.appendChild(h('div', { class: 'fb info' }, [h('strong', { text: t().hintUsed + ': ' }), pk(sc.hint)])); hb.disabled = isExam() && run.hints >= 2;
    } } }, [isExam() ? t().hintExam : t().hint]);
    if (ui.hintShown) hintBox.appendChild(h('div', { class: 'fb info' }, [h('strong', { text: t().hintUsed + ': ' }), pk(sc.hint)]));
    head.appendChild(h('div', { class: 'row' }, [hb]));
    head.appendChild(hintBox);
    root.appendChild(head);
    const steps = h('ol', { class: 'steps', 'aria-label': 'Etapes' });
    const st = stagesOf(); const cur = st.indexOf(run.stage === 'done' ? 'decision' : run.stage);
    st.forEach((s, i) => steps.appendChild(h('li', { class: i === cur ? 'on' : i < cur ? 'done' : '', 'aria-current': i === cur ? 'step' : null, text: t().steps[s] })));
    root.appendChild(steps);
    const station = h('div', { class: 'station' });
    const mc = h('div', { class: 'machine-col' }); const scol = h('div', { class: 'stage-col', id: 'stagecol' });
    station.appendChild(mc); station.appendChild(scol);
    root.appendChild(station);
    buildMachine(mc);
    renderStage();
  }
  function renderStage(focus) {
    const col = $('stagecol'); if (!col) return;
    col.textContent = '';
    const steps = document.querySelector('.steps');
    if (steps) { const st = stagesOf(); const cur = st.indexOf(run.stage); Array.prototype.forEach.call(steps.children, (li2, i) => { li2.className = i === cur ? 'on' : i < cur ? 'done' : ''; if (i === cur) li2.setAttribute('aria-current', 'step'); else li2.removeAttribute('aria-current'); }); }
    const card = h('div', { class: 'card stage' });
    col.appendChild(card);
    ({ checks: stChecks, load: stLoad, program: stProgram, cycle: stCycle, unload: stUnload, controls: stControls, decision: stDecision })[run.stage](card);
    drawChamber(); updateMachine();
    if (focus) { const hd = card.querySelector('h2'); if (hd) { hd.setAttribute('tabindex', '-1'); try { hd.focus({ preventScroll: true }); } catch (e) { hd.focus(); } } }
  }
  function nextBtn(label, onClick, disabled) { return h('div', { class: 'sticky' }, [h('button', { type: 'button', class: 'btn primary', disabled: !!disabled, on: { click: onClick } }, [label])]); }
  function fbBox(ok, text) { return h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') }, [text]); }
  const practice = () => !isExam();

  /* ---------- 1. comprovacions ---------- */
  function stChecks(card) {
    const ch = run.checks, sc = run.sc;
    card.appendChild(h('h2', { text: t().chkTitle }));
    card.appendChild(h('p', { class: 'muted small', text: t().chkLead }));
    const box = h('div', { class: 'chk' });
    /* aigua */
    const w = h('div', { class: 'chkitem' + (ch.water && (run.water === 'ok') ? ' done' : '') }, [h('h3', { text: t().water })]);
    if (!ch.water) w.appendChild(h('button', { type: 'button', class: 'btn sm', on: { click: () => { L.check(run, 'water'); renderStage(); } } }, [t().waterBtn]));
    else {
      w.appendChild(h('div', { class: 'row' }, [svg(waterSVG(run.water)), h('span', { text: run.water === 'low' ? t().waterLow : (ch.refill ? t().filled(ch.refill) : t().waterOk) })]));
      if (run.water === 'low') w.appendChild(h('div', { class: 'chips' }, [chip(t().fillDemin, false, () => { L.refill(run, 'demin'); renderStage(); }), chip(t().fillTap, false, () => { L.refill(run, 'tap'); renderStage(); })]));
      if (ch.refill && practice()) w.appendChild(fbBox(ch.refill === 'demin', ch.refill === 'demin' ? msg('water_tap').good : msg('water_tap').err));
    }
    box.appendChild(w);
    /* neteja */
    const c = h('div', { class: 'chkitem' + (ch.clean ? ' done' : '') }, [h('h3', { text: t().clean })]);
    c.appendChild(ch.clean ? h('p', { class: 'small', text: '✓ ' + t().cleanDone }) : h('button', { type: 'button', class: 'btn sm', on: { click: () => { L.check(run, 'clean'); renderStage(); } } }, [t().cleanBtn]));
    box.appendChild(c);
    /* precalentament */
    const p = h('div', { class: 'chkitem' + (ch.preheat || run.preheatedStart ? ' done' : '') }, [h('h3', { text: t().preheat })]);
    if (run.preheatedStart) p.appendChild(h('p', { class: 'small muted', text: t().preheatNo }));
    else p.appendChild(ch.preheat ? h('p', { class: 'small', text: '✓ ' + t().preheatDone }) : h('button', { type: 'button', class: 'btn sm', on: { click: () => { L.check(run, 'preheat'); renderStage(); } } }, [t().preheatBtn]));
    box.appendChild(p);
    /* test de buit */
    const lk = h('div', { class: 'chkitem' + (ch.leak ? ' done' : '') }, [h('h3', { text: t().leak }), h('p', { class: 'small muted', text: t().leakD })]);
    if (!ch.leak) lk.appendChild(h('button', { type: 'button', class: 'btn sm', disabled: !!ui.testing, on: { click: () => { const r = L.runLeak(D, run); ui.testing = true; play(r.sim, 'leak', () => { ui.testing = false; renderStage(); }, 240); renderStage(); } } }, [t().leakBtn]));
    else if (!ui.testing) lk.appendChild(question('leak', t().leakQ, [['pass', t().leakPass], ['fail', t().leakFail]]));
    box.appendChild(lk);
    /* Bowie-Dick */
    const bd = h('div', { class: 'chkitem' + (ch.bd.length && ch.bd[ch.bd.length - 1].pass ? ' done' : '') }, [h('h3', { text: t().bd }), h('p', { class: 'small muted', text: t().bdD })]);
    if (!sc.firstOfDay) bd.appendChild(h('p', { class: 'small', text: '✓ ' + t().bdDone }));
    else {
      ch.bd.forEach(function (b, i) {
        if (ui.testing && i === ch.bd.length - 1) return;
        bd.appendChild(h('div', { class: 'artifacts' }, [h('div', { class: 'art' }, [svg(bdSVG(b.pale, i + 1)), h('div', { class: 'cap', text: t().bdSheet(i + 1) })])]));
        bd.appendChild(question('bd' + (i + 1), t().bdQ, [['pass', t().pass], ['fail', t().fail]]));
      });
      const last = ch.bd[ch.bd.length - 1];
      const canRun = !ui.testing && (!ch.bd.length || (!last.pass && ch.bdActions[ch.bdActions.length - 1] === 'repeat' && ch.bdActions.length === ch.bd.length));
      if (canRun) {
        ui.bdPlace = ui.bdPlace || null;
        {
          bd.appendChild(h('div', { class: 'lbl', text: t().bdPlace }));
          bd.appendChild(h('div', { class: 'chips' }, [chip(t().bdEmpty, ui.bdPlace === 'empty', () => { ui.bdPlace = 'empty'; renderStage(); }), chip(t().bdLoad, ui.bdPlace === 'load', () => { ui.bdPlace = 'load'; renderStage(); })]));
        }
        bd.appendChild(h('button', { type: 'button', class: 'btn sm primary', disabled: !ui.bdPlace, on: { click: () => {
          const r = L.runBD(D, run, ui.bdPlace);
          ui.testing = true; play(r.sim, 'bd', () => { ui.testing = false; renderStage(); }, 240); renderStage();
        } } }, [ch.bd.length ? t().bdBtn2 : t().bdBtn]));
      }
      if (last && !last.pass && !ui.testing && last.place === 'load' && run.mode === 'practice') bd.appendChild(h('p', { class: 'small err', text: t().bdWhyLoad }));
      if (ui.testing) bd.appendChild(h('p', { class: 'small', text: t().running }));
      if (last && !last.pass && !ui.testing && ch.bdActions.length < ch.bd.length && !ch.stopped) {
        bd.appendChild(h('div', { class: 'lbl', text: t().bdNext }));
        const acts = [['repeat', t().bdRepeat], ['continue', t().bdContinue], ['stop', t().bdStop]].filter((a) => !(a[0] === 'repeat' && ch.bd.length >= 2));
        bd.appendChild(h('div', { class: 'chips' }, acts.map((a) => chip(a[1], false, () => { L.bdAction(run, a[0]); if (a[0] === 'stop') { addLog(t().stoppedMsg, true); renderStage(true); } else renderStage(); }))));
      }
      if (practice() && last && !last.pass && !ui.testing && ch.bdActions.length) { const lastA = ch.bdActions[ch.bdActions.length - 1]; if (lastA === 'continue') bd.appendChild(fbBox(false, msg('bd_ignored').err + ' ' + msg('bd_ignored').good)); }
      if (practice() && ch.bd.length && ch.bd[0].place === 'load') bd.appendChild(fbBox(false, msg('bd_place').err + ' ' + msg('bd_place').good));
    }
    box.appendChild(bd);
    card.appendChild(box);
    const lastBd = ch.bd[ch.bd.length - 1];
    const blocked = ui.testing || (lastBd && !lastBd.pass && ch.bdActions.length < ch.bd.length);
    card.appendChild(nextBtn(t().cont + ': ' + t().steps.load, () => { run.stage = 'load'; renderStage(true); }, blocked));
  }

  /* pregunta d'opció única (controls) */
  function question(id, text, opts) {
    const wrap = h('div', { class: 'q' }, [h('p', { text: text })]);
    const cur = run.answers[id];
    const qdef = L.questions(D, run).find((q) => q.id === id);
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': text });
    opts.forEach(function (o) {
      const pressed = cur !== undefined && String(cur) === String(o[0]);
      const extra = {};
      if (practice() && cur !== undefined && qdef) { if (String(o[0]) === String(qdef.correct)) extra.class = 'chip good'; else if (pressed) extra.class = 'chip wrong'; }
      chips.appendChild(chip(o[1], pressed, () => { L.answer(run, id, o[0]); renderStage(); }, extra));
    });
    wrap.appendChild(chips);
    if (practice() && cur !== undefined && qdef) wrap.appendChild(h('div', { class: 'small ' + (String(cur) === String(qdef.correct) ? 'muted' : ''), text: String(cur) === String(qdef.correct) ? '✓ ' + t().fbOk : '✗ ' + t().correctAns + ': ' + (opts.find((o) => String(o[0]) === String(qdef.correct)) || ['', ''])[1] }));
    return wrap;
  }

  /* ---------- 2. càrrega ---------- */
  function stLoad(card) {
    card.appendChild(h('h2', { text: t().loadTitle }));
    card.appendChild(h('p', { class: 'muted small', text: t().loadLead }));
    const fill = L.fill(D, run);
    const pct = Math.round(fill * 100);
    const fb = h('div', { class: 'fillbar' + (fill > D.chamber.maxFill ? ' over' : ''), role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': t().fill(pct) }, [h('i'), h('s')]);
    fb.firstChild.style.width = Math.min(100, pct) + '%';
    card.appendChild(h('div', { class: 'small', text: t().fill(pct) }));
    card.appendChild(fb);
    if (run.sc.free) {
      const sel = h('select', { id: 'addsel', 'aria-label': t().addItem, class: 'chip' });
      Object.keys(D.items).forEach((k) => sel.appendChild(h('option', { value: k, text: itemName(k) })));
      card.appendChild(h('div', { class: 'row' }, [h('label', { for: 'addsel', class: 'small', text: t().addItem }), sel, h('button', { type: 'button', class: 'btn sm', on: { click: () => { const it = L.newItem(run, sel.value, 'ok'); ui.open = it.uid; renderStage(); } } }, [t().addBtn])]));
      if (!run.items.length) card.appendChild(h('p', { class: 'muted', text: t().emptyCart }));
    }
    const list = h('div', { class: 'items' });
    run.items.forEach((it) => list.appendChild(itemCard(it)));
    card.appendChild(list);
    const undecided = run.items.some((it) => !it.ch.dest);
    const none = !L.loaded(run).length;
    if (undecided) card.appendChild(h('p', { class: 'small muted', text: t().needDest }));
    else if (none) card.appendChild(h('p', { class: 'small muted', text: t().needOne }));
    card.appendChild(nextBtn(t().cont + ': ' + t().steps.program, () => { run.stage = 'program'; renderStage(true); }, undecided || none));
  }
  function itemCard(it) {
    const d = D.items[it.id], ch = it.ch, open = ui.open === it.uid;
    const status = !ch.dest ? t().pending : pk(D.dests[ch.dest]);
    const card = h('div', { class: 'item' + (open ? ' open' : '') });
    const head = h('button', { type: 'button', class: 'head', 'aria-expanded': open ? 'true' : 'false', on: { click: () => { ui.open = open ? null : it.uid; it.seen = true; renderStage(); } } });
    head.appendChild(svg(itemIcon(it.id)));
    head.appendChild(h('span', { class: 'nm', text: itemName(it.id) }));
    head.appendChild(h('span', { class: 'pill' + (ch.dest === 'steam' ? ' ok' : ch.dest ? '' : ' warn'), text: status }));
    card.appendChild(head);
    if (!open) return card;
    const body = h('div', { class: 'body' });
    body.appendChild(h('div', { class: 'lbl', text: t().inspect }));
    body.appendChild(h('div', { class: 'state' + (it.st !== 'ok' ? ' alert' : ''), text: pk(D.states[it.st]) }));
    const set = (k, v) => { ch[k] = v; renderStage(); };
    body.appendChild(h('div', { class: 'lbl', text: t().dest }));
    body.appendChild(h('div', { class: 'chips' }, Object.keys(D.dests).map((k) => chip(pk(D.dests[k]), ch.dest === k, () => {
      ch.dest = k;
      if (k === 'steam' && !ch.pack && D.items[it.id].k !== 'liquid') { /* sense valors per defecte: l'alumne tria */ }
      renderStage();
    }))));
    if (ch.dest === 'steam' && d.k !== 'liquid') {
      body.appendChild(h('div', { class: 'lbl', text: t().pack }));
      body.appendChild(h('div', { class: 'chips' }, Object.keys(D.packs).map((k) => chip(pk(D.packs[k].n), ch.pack === k, () => { ch.pack = k; if (ch.pos && L.posOptions(D, it.id, k).indexOf(ch.pos) < 0) ch.pos = null; renderStage(); }))));
      body.appendChild(h('div', { class: 'lbl', text: t().prep }));
      const tg = (key, label) => { const id = 'tg_' + it.uid + '_' + key; const inp = h('input', { type: 'checkbox', id: id }); inp.checked = !!ch[key]; inp.addEventListener('change', () => set(key, inp.checked)); return h('label', { class: 'toggle', for: id }, [inp, label]); };
      if (d.art) body.appendChild(tg('open', t().open));
      if (ch.pack === 'bag') { body.appendChild(tg('fill34', t().fill34)); body.appendChild(tg('airOut', t().airOut)); }
      body.appendChild(tg('label', t().label));
      body.appendChild(h('div', { class: 'small', text: t().ci }));
      body.appendChild(h('div', { class: 'chips' }, [0, 1, 4, 5, 6].map((c) => chip(pk(D.ciClasses[c]), Number(ch.ci) === c, () => set('ci', c)))));
      body.appendChild(tg('bi', t().biTg));
      body.appendChild(h('div', { class: 'lbl', text: t().place }));
      body.appendChild(h('div', { class: 'small', text: t().shelf }));
      body.appendChild(h('div', { class: 'chips' }, ['low', 'up'].map((s) => chip(pk(D.shelves[s]), ch.shelf === s, () => set('shelf', s)))));
      if (ch.pack) {
        body.appendChild(h('div', { class: 'small', text: t().pos }));
        body.appendChild(h('div', { class: 'chips' }, L.posOptions(D, it.id, ch.pack).map((p) => chip(pk(D.pos[p]), ch.pos === p, () => set('pos', p)))));
      }
      body.appendChild(tg('wall', t().wall));
    } else if (ch.dest === 'steam') {
      const id = 'tg_' + it.uid + '_label'; const inp = h('input', { type: 'checkbox', id: id }); inp.checked = !!ch.label; inp.addEventListener('change', () => set('label', inp.checked));
      body.appendChild(h('label', { class: 'toggle', for: id }, [inp, t().label]));
    }
    if (practice() && ch.dest) {
      const bad = L.evalItem(D, run, it).filter((c) => c.ok < 1);
      if (!bad.length) body.appendChild(fbBox(true, '✓ ' + t().fbOk));
      else bad.forEach((c) => { const m = msg(c.code); body.appendChild(h('div', { class: 'fb ' + (c.ok > 0 ? 'warn' : 'bad') }, [m.err + (m.good ? ' → ' + m.good : '')])); });
    }
    if (run.sc.free) body.appendChild(h('button', { type: 'button', class: 'btn sm danger', on: { click: () => { run.items = run.items.filter((x) => x !== it); ui.open = null; renderStage(); } } }, [t().removeBtn]));
    card.appendChild(body);
    return card;
  }

  /* ---------- 3. programa ---------- */
  function stProgram(card) {
    card.appendChild(h('h2', { text: t().progTitle }));
    card.appendChild(h('p', { class: 'muted small', text: t().progLead }));
    const pr = h('div', { class: 'prog' });
    D.programs.forEach(function (p) {
      const on = run.prog && run.prog.id === p.id;
      pr.appendChild(h('button', { type: 'button', class: 'progbtn', 'aria-pressed': on ? 'true' : 'false', on: { click: () => { L.setProgram(D, run, { id: p.id }); renderStage(); } } }, [h('strong', { text: pk(p.n) }), h('small', { text: pk(p.d) })]));
    });
    card.appendChild(pr);
    const cur = run.prog || { type: 'B', T: 134, hold: 5, dry: 20 };
    const det = h('details', { open: run.prog && run.prog.id === 'manual' ? true : null }, [h('summary', { text: t().manual })]);
    const sel = h('select', { id: 'm_type' }); [['B', t().typeB], ['N', t().typeN], ['L', t().typeL]].forEach((o) => { const op = h('option', { value: o[0], text: o[1] }); if (cur.type === o[0]) op.selected = true; sel.appendChild(op); });
    const num = (id, v, min, max, step) => h('input', { id: id, type: 'number', inputmode: 'decimal', min: String(min), max: String(max), step: String(step), value: String(v) });
    const iT = num('m_T', cur.T, 105, 137, 1), iH = num('m_h', cur.hold, 1, 60, 0.5), iD = num('m_d', cur.dry, 0, 40, 1);
    const err = h('div');
    det.appendChild(h('div', { class: 'manual' }, [h('label', { for: 'm_type' }, [t().type, sel]), h('label', { for: 'm_T' }, [t().T, iT]), h('label', { for: 'm_h' }, [t().hold, iH]), h('label', { for: 'm_d' }, [t().dry, iD])]));
    det.appendChild(err);
    det.appendChild(h('button', { type: 'button', class: 'btn sm', on: { click: () => {
      const T = parseFloat(iT.value), H = parseFloat(String(iH.value).replace(',', '.')), Dr = parseFloat(iD.value);
      if (!(T >= 105 && T <= 137) || !(H >= 1 && H <= 60) || !(Dr >= 0 && Dr <= 40)) { err.textContent = ''; err.appendChild(fbBox(false, lang === 'es' ? 'Valores fuera de rango: T 105-137 °C, tiempo 1-60 min, secado 0-40 min.' : 'Valors fora de rang: T 105-137 °C, temps 1-60 min, assecat 0-40 min.')); return; }
      L.setProgram(D, run, { id: 'manual', type: sel.value, T: Math.round(T), hold: H, dry: Dr }); renderStage();
    } } }, [t().apply]));
    card.appendChild(det);
    /* referència de vapor saturat */
    const ref = h('details', {}, [h('summary', { text: t().satRef })]);
    const tb = h('table', { class: 'sat' }); tb.appendChild(h('tr', {}, [h('th', { text: 'T (°C)' }), h('th', { text: 'P abs (bar)' }), h('th', { text: 'P rel (bar)' })]));
    [100, 115, 121, 126, 130, 134].forEach((T) => { const P = L.satP(T); tb.appendChild(h('tr', {}, [h('td', { text: String(T) }), h('td', { text: fmt(P, 2) }), h('td', { text: fmt(P - L.PATM, 2) })])); });
    ref.appendChild(tb); card.appendChild(ref);
    if (run.prog) {
      card.appendChild(h('p', { class: 'small' }, [h('strong', { text: t().progSel + ' ' }), (run.prog.type === 'N' ? t().typeN : run.prog.type === 'L' ? t().typeL : t().typeB) + ' · ' + run.prog.T + ' °C · ' + fmt(run.prog.hold) + ' min · ' + t().dry.toLowerCase() + ' ' + run.prog.dry + ' min']));
      if (practice()) {
        const bad = L.evalProgram(D, run).filter((c) => c.ok < 1);
        if (!bad.length) card.appendChild(fbBox(true, '✓ ' + msg('prog_ok').good));
        bad.forEach((c) => { const m = msg(c.code); card.appendChild(h('div', { class: 'fb ' + (c.ok > 0 ? 'warn' : 'bad') }, [m.err + (m.good ? ' → ' + m.good : '')])); });
      }
    }
    card.appendChild(nextBtn(t().closeDoor, () => { run.stage = 'cycle'; ui.doorOpen = false; renderStage(true); }, !run.prog));
  }

  /* ---------- 4. cicle ---------- */
  function stCycle(card) {
    card.appendChild(h('h2', { text: t().cycTitle }));
    card.appendChild(h('p', { class: 'muted small', text: t().cycLead }));
    if (!run.sim) card.appendChild(h('button', { type: 'button', class: 'btn primary', on: { click: onStart } }, ['▶ ' + t().mStart]));
    if (ui.msg) card.appendChild(h('div', { class: 'fb ' + ui.msg.cls, role: 'status', text: ui.msg.text }));
    if (ui.alarmShown) card.appendChild(h('div', { class: 'fb bad', role: 'alert', text: t().alarmMsg }));
    if (run.sim && pb.t >= run.sim.total) {
      card.appendChild(h('div', { class: 'fb ok', role: 'status', text: t().cycEnd }));
      card.appendChild(h('button', { type: 'button', class: 'btn primary', on: { click: onDoor } }, ['🚪 ' + t().mDoor]));
    } else if (run.sim) {
      card.appendChild(h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn sm', on: { click: onDoor } }, ['🚪 ' + t().mDoor]), h('button', { type: 'button', class: 'btn sm danger', on: { click: onEstop } }, ['⛔ ' + t().mStop])]));
    }
    if (ui.log.length) {
      card.appendChild(h('h3', { text: t().log }));
      const lg = h('div', { class: 'log' });
      ui.log.forEach((e) => lg.appendChild(h('div', { class: e.alarm ? 'a' : '', text: mmss(e.t) + '  ' + e.text })));
      card.appendChild(lg);
    }
  }

  /* ---------- 5. descàrrega ---------- */
  function packObs(p) {
    const o = [];
    if (p.pkg === 'none') o.push(t().obsNaked);
    if (p.wet && p.wet.length) o.push(t().obsWet);
    if (p.burst) o.push(t().obsBurst);
    if (p.damage) o.push(t().obsDamage);
    if (p.ext === true) o.push(t().obsExtOk); else if (p.ext === false) o.push(t().obsExtNo);
    if (!o.length || (o.length === 1 && p.ext)) o.push(t().obsDry);
    return o.join(' · ');
  }
  function packsGrid(packs, extra) {
    const g = h('div', { class: 'packs' });
    packs.forEach(function (p) {
      const c = h('div', { class: 'pack' }, [svg(packSVG(p)), h('div', { class: 'nm', text: itemName(p.id) }), h('div', { class: 'obs', text: (p.pkg !== 'none' ? pk(D.packs[p.pkg].n) + ' · ' : '') + packObs(p) })]);
      if (extra) extra(c, p);
      g.appendChild(c);
    });
    return g;
  }
  function stUnload(card) {
    card.appendChild(h('h2', { text: t().unTitle }));
    card.appendChild(h('p', { class: 'muted small', text: t().unLead }));
    const box = h('div', { class: 'chk' });
    order('unload', D.unload.map((u) => u.id)).forEach(function (id) {
      const u = D.unload.find((x) => x.id === id);
      const iid = 'un_' + id; const inp = h('input', { type: 'checkbox', id: iid }); inp.checked = !!run.unload[id];
      inp.addEventListener('change', () => { L.toggleUnload(run, id, inp.checked); renderStage(); });
      const row = h('label', { class: 'toggle', for: iid }, [inp, pk(u.t)]);
      box.appendChild(row);
      if (practice() && run.unload[id]) box.appendChild(h('div', { class: 'small', text: u.ok ? '✓ ' + t().fbOk : '✗ ' + msg('unload_bad').err }));
    });
    card.appendChild(box);
    card.appendChild(h('h3', { text: t().packsTitle }));
    card.appendChild(packsGrid(run.out.packs));
    card.appendChild(nextBtn(t().cont + ': ' + t().steps.controls, () => { run.stage = 'controls'; renderStage(true); }));
  }

  /* ---------- 6. controls ---------- */
  function stControls(card) {
    card.appendChild(h('h2', { text: t().ctlTitle }));
    card.appendChild(h('p', { class: 'muted small', text: t().ctlLead }));
    const qs = L.questions(D, run);
    const sc = run.sc;
    /* diagnòstic de Bowie-Dick */
    if (sc.kind === 'diag' && run.checks.bd.length) {
      const arts = h('div', { class: 'artifacts' });
      run.checks.bd.forEach((b, i) => arts.appendChild(h('div', { class: 'art' }, [svg(bdSVG(b.pale, i + 1)), h('div', { class: 'cap', text: t().bdSheet(i + 1) + (run.checks.bd.length > 1 && i === 0 ? ' (1a)' : '') })])));
      card.appendChild(arts);
      run.checks.bd.forEach((b, i) => card.appendChild(question('bd' + (i + 1), t().bdSheet(i + 1) + ' · ' + t().bdQ, [['pass', t().pass], ['fail', t().fail]])));
    }
    /* magatzem */
    if (run.storage) {
      card.appendChild(h('h3', { text: t().storeTitle }));
      const g = h('div', { class: 'packs' });
      run.storage.forEach((p) => g.appendChild(h('div', { class: 'pack' }, [svg(packSVG({ id: p.item, pkg: p.pack, ext: p.st !== 'noturn', wet: p.st === 'wetstain' ? ['x'] : [], burst: p.st === 'torn' })), h('div', { class: 'nm', text: itemName(p.item) }), h('div', { class: 'obs', text: pk(D.storageStates[p.st]) })])));
      card.appendChild(g);
    }
    if (run.out) {
      if (sc.kind === 'diag') { card.appendChild(h('h3', { text: t().packsTitle })); card.appendChild(packsGrid(run.out.packs)); }
      if (run.noRecord) card.appendChild(h('div', { class: 'fb warn', text: t().noTicket }));
      else card.appendChild(question('phys', t().physQ, ['ok', 'short', 'air', 'abort', 'nonstd'].map((k) => [k, t().phys[k]])));
      const cis = qs.filter((q) => q.type === 'ci');
      if (cis.length) {
        const arts = h('div', { class: 'artifacts' });
        cis.forEach(function (q, i) {
          const p = run.out.packs.find((x) => x.uid === q.uid);
          arts.appendChild(h('div', { class: 'art' }, [svg(ciSVG(p.ci, p.intPass, i + 1)), h('div', { class: 'cap', text: itemName(p.id) })]));
        });
        card.appendChild(arts);
        cis.forEach(function (q) { const p = run.out.packs.find((x) => x.uid === q.uid); card.appendChild(question(q.id, t().ciQ(itemName(p.id)), [['pass', t().ciPass], ['fail', t().ciFail]])); });
      }
      if (qs.some((q) => q.id === 'ext')) {
        const c = D.concepts.ext; const opts = order('ext', [0, 1, 2, 3]).map((i) => [i, pk(c.o[i])]);
        card.appendChild(question('ext', pk(c.q), opts));
      }
      if (run.out.bi) {
        if (qs.some((q) => q.id === 'bipre')) card.appendChild(question('bipre', t().biPreQ, ['release', 'quarantine', 'reprocess_all'].map((k) => [k, t().biPre[k]])));
        const needInc = sc.kind === 'run';
        if (needInc) {
          const preOk = !qs.some((q) => q.id === 'bipre') || run.answers.bipre !== undefined;
          if (preOk) card.appendChild(question('bitemp', t().biTempQ, [57, 37].map((k) => [k, t().biTemp[k]])));
          if (preOk && run.answers.bitemp !== undefined && !(run.bi && run.bi.incubated)) card.appendChild(h('button', { type: 'button', class: 'btn sm primary', on: { click: () => { L.incubate(run, Number(run.answers.bitemp)); renderStage(); } } }, ['🧪 ' + t().biInc]));
        }
        if (run.bi && run.bi.incubated) {
          const rd = L.biReading(run);
          card.appendChild(h('p', { class: 'small', text: t().biRead }));
          card.appendChild(h('div', { class: 'artifacts' }, [h('div', { class: 'art' }, [svg(vialSVG(rd.test, t().vTest))]), h('div', { class: 'art' }, [svg(vialSVG(rd.ctrl, t().vCtrl))])]));
          card.appendChild(question('bi', t().biQ, ['neg', 'pos', 'inv'].map((k) => [k, t().bi[k]])));
        }
      }
    }
    (sc.q || []).forEach(function (q) { const opts = order('x_' + q.id, q.o.map((_, i) => i)).map((i) => [i, pk(q.o[i])]); card.appendChild(question('x_' + q.id, pk(q.q), opts)); });
    const biPending = run.out && run.out.bi && sc.kind === 'run' && !(run.bi && run.bi.incubated);
    card.appendChild(nextBtn(t().cont + ': ' + t().steps.decision, () => { run.stage = 'decision'; renderStage(true); }, biPending));
  }

  /* ---------- 7. decisió ---------- */
  function stDecision(card) {
    card.appendChild(h('h2', { text: t().decTitle }));
    card.appendChild(h('p', { class: 'muted small', text: t().decLead }));
    if (run.checks.stopped) card.appendChild(h('div', { class: 'fb warn', text: t().stoppedMsg }));
    const packs = run.storage ? run.storage.map((p) => ({ uid: p.uid, id: p.item, label: pk(D.storageStates[p.st]) })) : (run.out ? run.out.packs.map((p) => ({ uid: p.uid, id: p.id, label: packObs(p) })) : []);
    if (packs.length) {
      card.appendChild(h('h3', { text: t().dispTitle }));
      packs.forEach(function (p) {
        const row = h('div', { class: 'q' }, [h('p', { class: 'small' }, [h('strong', { text: itemName(p.id) }), ' — ' + p.label])]);
        row.appendChild(h('div', { class: 'chips', role: 'group', 'aria-label': itemName(p.id) }, ['store', 'reprocess', 'withdraw'].map((k) => chip(pk(D.packDisp[k]), run.disp[p.uid] === k, () => { L.setDisp(run, p.uid, k); renderStage(); }))));
        card.appendChild(row);
      });
    }
    card.appendChild(h('h3', { text: t().actTitle }));
    const box = h('div', { class: 'chk' });
    order('dec', Object.keys(D.decisions)).forEach(function (k) {
      const id = 'dec_' + k; const inp = h('input', { type: 'checkbox', id: id }); inp.checked = run.decision.indexOf(k) >= 0;
      inp.addEventListener('change', () => { const s = new Set(run.decision); if (inp.checked) s.add(k); else s.delete(k); L.setDecision(run, Array.from(s)); });
      box.appendChild(h('label', { class: 'toggle', for: id }, [inp, pk(D.decisions[k])]));
    });
    card.appendChild(box);
    const missingDisp = packs.some((p) => !run.disp[p.uid]);
    card.appendChild(nextBtn(t().finish, finishScenario, missingDisp));
  }

  /* ======================= Resultats ======================= */
  function finishScenario() {
    const r = L.score(D, run);
    r.id = run.sc.id; r.title = run.sc.t; r.run = run;
    lastResult = r;
    run.stage = 'done';
    if (pb.raf) cancelAnimationFrame(pb.raf); pb.raf = 0; pb.playing = false;
    if (exam) { exam.results.push(r); nextExamScenario(); return; }
    view = 'result'; render(true);
  }
  function catBars(cats) {
    const b = h('div', { class: 'bars' });
    ['load', 'params', 'proc', 'ctrl', 'dec'].forEach(function (k) {
      const c = cats[k]; if (!c || c.pct === null || c.max === 0) return;
      const bar = h('div', { class: 'b' }, [h('i')]); bar.firstChild.style.width = c.pct + '%';
      b.appendChild(h('div', { class: 'barrow' }, [h('span', { text: t().cats[k] }), bar, h('span', { text: c.pct + ' %' })]));
    });
    return b;
  }
  function qLabel(run2, qid, val) {
    const qs = L.questions(D, run2); const q = qs.find((x) => x.id === qid); if (!q) return String(val);
    if (val === undefined) return '—';
    if (q.type === 'phys') return t().phys[val];
    if (q.type === 'bd' || q.type === 'ci' || q.type === 'leak') return val === 'pass' ? (q.type === 'ci' ? t().ciPass : q.type === 'leak' ? t().leakPass : t().pass) : (q.type === 'ci' ? t().ciFail : q.type === 'leak' ? t().leakFail : t().fail);
    if (q.type === 'bi') return t().bi[val];
    if (q.type === 'bipre') return t().biPre[val];
    if (q.type === 'bitemp') return t().biTemp[val];
    if (q.type === 'concept') return pk(D.concepts.ext.o[val]);
    if (q.type === 'extra') return pk(q.q.o[val]);
    return String(val);
  }
  function qText(run2, qid) {
    const q = L.questions(D, run2).find((x) => x.id === qid); if (!q) return qid;
    if (q.type === 'phys') return t().physQ;
    if (q.type === 'bd') return t().bdSheet(q.idx + 1) + ' · ' + t().bdQ;
    if (q.type === 'leak') return t().leakQ;
    if (q.type === 'ci') { const p = run2.out.packs.find((x) => x.uid === q.uid); return t().ciQ(itemName(p.id)); }
    if (q.type === 'bi') return t().biQ;
    if (q.type === 'bipre') return t().biPreQ;
    if (q.type === 'bitemp') return t().biTempQ;
    if (q.type === 'concept') return pk(D.concepts.ext.q);
    if (q.type === 'extra') return pk(q.q.q);
    return qid;
  }
  function packName(run2, uid) {
    if (run2.storage) { const p = run2.storage.find((x) => x.uid === uid); return p ? itemName(p.item) : uid; }
    const it = run2.items.find((x) => x.uid === uid); return it ? itemName(it.id) : uid;
  }
  function resultDetail(r, root) {
    const run2 = r.run;
    const c = h('div', { class: 'card' }, [h('h2', { text: t().errors })]);
    let n = 0;
    const err = (title, code, minor, extraTxt) => { const m = msg(code); n++; c.appendChild(h('div', { class: 'err' + (minor ? ' minor' : '') }, [title ? h('strong', { text: title + ': ' }) : null, extraTxt || m.err, m.good ? h('span', { class: 'gp', text: '→ ' + m.good }) : null])); };
    if (r.graves.length) {
      c.appendChild(h('h3', { text: t().graves }));
      r.graves.forEach((g) => { const m = msg(g); n++; c.appendChild(h('div', { class: 'err' }, [h('strong', { text: (t().grv[g] || g) + '. ' }), m.err, m.good ? h('span', { class: 'gp', text: '→ ' + m.good }) : null])); });
    }
    const cats = r.cats;
    if (cats.load.items.length) {
      cats.load.items.forEach(function (i) {
        if (i.ok >= 1) return;
        if (i.item) (i.codes || [i.code]).forEach((code) => err(itemName(i.item), code, false));
        else err(null, i.code, false);
      });
    }
    cats.params.items.forEach((i) => { if (i.ok < 1) err(t().cats.params, i.code, i.ok > 0); });
    cats.proc.items.forEach(function (i) {
      if (i.ok >= 1) return;
      if (i.code === 'unload_miss' || i.code === 'unload_bad') { const u = D.unload.find((x) => x.id === i.ref); n++; c.appendChild(h('div', { class: 'err' + (i.code === 'unload_miss' ? ' minor' : '') }, [h('strong', { text: msg(i.code).err + ' ' }), pk(u.t)])); }
      else err(t().cats.proc, i.code, false);
    });
    cats.ctrl.items.forEach(function (i) {
      if (i.ok >= 1) return; n++;
      c.appendChild(h('div', { class: 'err' }, [h('strong', { text: qText(run2, i.q) }), h('br'), t().yourAns + ': ' + qLabel(run2, i.q, i.given), h('span', { class: 'gp', text: '→ ' + t().correctAns + ': ' + qLabel(run2, i.q, i.correct) })]));
    });
    cats.dec.items.forEach(function (i) {
      if (i.ok >= 1) return; n++;
      if (i.code === 'disp') c.appendChild(h('div', { class: 'err' }, [h('strong', { text: t().disp + ' «' + packName(run2, i.ref) + '»: ' }), t().yourAns + ': ' + (i.given ? pk(D.packDisp[i.given]) : '—'), h('span', { class: 'gp', text: '→ ' + pk(D.packDisp[i.correct]) })]));
      else {
        const lbl = i.code === 'dec_miss' ? t().missed : i.code === 'dec_forb' ? t().forbidden : t().extra;
        c.appendChild(h('div', { class: 'err' + (i.code === 'dec_extra' ? ' minor' : '') }, [h('strong', { text: lbl + ': ' }), pk(D.decisions[i.ref]), h('span', { class: 'gp', text: pk(D.decWhy[i.ref]) })]));
      }
    });
    if (!n) c.appendChild(h('p', { class: 'fb ok', text: t().noErrors }));
    root.appendChild(c);
    const e = h('div', { class: 'card' }, [h('h2', { text: t().expected })]);
    const ul = h('ul', { class: 'list' });
    r.expected.req.forEach((k) => ul.appendChild(h('li', {}, [h('strong', { text: pk(D.decisions[k]) + '. ' }), pk(D.decWhy[k])])));
    e.appendChild(ul);
    root.appendChild(e);
  }
  function scoreCard(r, title) {
    const c = h('div', { class: 'card' }, [h('h2', { text: title })]);
    c.appendChild(h('div', { class: 'score', text: fmt(r.score10) + ' / 10' }));
    c.appendChild(h('p', {}, [h('strong', { text: t().grade[L.grade(r.score10)] })]));
    if (r.annul) c.appendChild(h('div', { class: 'fb bad', text: t().annul }));
    c.appendChild(catBars(r.cats));
    if (r.hints && r.run && r.run.mode === 'exam') c.appendChild(h('p', { class: 'small muted', text: t().hintsUsed(r.hints) }));
    return c;
  }
  function renderResult(root) {
    const r = lastResult;
    root.appendChild(scoreCard(r, t().resTitle + ' · ' + pk(r.title)));
    resultDetail(r, root);
    const id = r.id;
    root.appendChild(h('div', { class: 'row' }, [
      h('button', { type: 'button', class: 'btn primary', on: { click: () => (id === 'free' ? startFree() : startScenario(id, 'practice')) } }, [t().again]),
      h('button', { type: 'button', class: 'btn', on: { click: () => { view = 'home'; resetPb(); render(true); } } }, [t().toList])
    ]));
  }
  function renderExamFinal(root) {
    const sum = L.examSummary(exam.results);
    setBest(sum.score10);
    const c = scoreCard({ score10: sum.score10, cats: sum.cats, annul: false }, t().finalTitle);
    const status = h('p', { class: 'small', role: 'status' });
    if (exam.real) {
      if (!exam.sent) {
        status.textContent = linkFailed ? t().linkFail : t().sending;
        L.reportOnce(exam, window.CampusLink, sum.score10);
        if (!linkFailed && window.CampusLink) status.textContent = t().sent;
      } else status.textContent = t().sent;
    } else status.textContent = t().notSent;
    c.appendChild(status);
    c.appendChild(h('h3', { text: t().perScen }));
    const ul = h('ul', { class: 'list' });
    exam.results.forEach((r, i) => ul.appendChild(h('li', { text: (i + 1) + '. ' + pk(r.title) + ': ' + fmt(r.score10) + ' / 10' + (r.annul ? ' (' + t().annul.split(':')[0] + ')' : '') })));
    c.appendChild(ul);
    root.appendChild(c);
    exam.results.forEach(function (r, i) {
      const det = h('details', { class: 'card' }, [h('summary', { text: (i + 1) + '. ' + pk(r.title) + ' — ' + fmt(r.score10) + ' / 10' })]);
      det.appendChild(catBars(r.cats));
      resultDetail(r, det);
      root.appendChild(det);
    });
    if (!exam.real) root.appendChild(h('button', { type: 'button', class: 'btn', on: { click: () => { exam = null; view = 'home'; render(true); } } }, [t().toList]));
  }

  /* ======================= Render general ======================= */
  function render(focus) {
    renderHeader();
    const root = $('app');
    root.textContent = '';
    M = null;
    if (view === 'home') renderHome(root);
    else if (view === 'examIntro') renderExamIntro(root);
    else if (view === 'scenario') renderScenario(root);
    else if (view === 'result') renderResult(root);
    else if (view === 'examFinal') renderExamFinal(root);
    if (focus) { const f = $('title'); try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } try { window.scrollTo(0, 0); } catch (e) { /* ignora */ } }
  }

  $('back').addEventListener('click', function () { history.back(); });
  $('home').addEventListener('click', function () { if (exam && !exam.real) exam = null; if (examReal) return; resetPb(); view = 'home'; render(true); });
  $('lang').addEventListener('click', function () {
    lang = lang === 'ca' ? 'es' : 'ca';
    try { localStorage.setItem('campus-lang', lang); } catch (e) { /* ignora */ }
    const playing = pb.playing;
    render();
    if (playing && pb.sim) { pb.playing = true; pb.last = 0; loop(); }
  });
  render();
})();
