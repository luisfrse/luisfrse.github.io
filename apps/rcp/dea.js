/* Simulador didáctico de DEA (desfibrilador externo automático) genérico.
   Habla con la voz del navegador (voice.js) y suena con WebAudio (pitidos, tono de carga, descarga, metrónomo).
   No imita a ningún fabricante: mensajes y tiempos genéricos. No sustituye la formación práctica acreditada. */
(() => {
  'use strict';
  const R = window.RCP, esc = AppKit.esc, $ = R.$, $$ = R.$$, T = (k, p) => AppKit.t(k, p), store = AppKit.storage('rcp');

  /* ============================== textos ============================== */
  R.addI18N({
    es: {
      tabAed: 'Simulador DEA', deaTitle: 'Simulador de DEA', deaIntro: 'Practica con un desfibrilador automático que habla, analiza el ritmo y te guía. Coloca los parches en el paciente, no lo toques durante el análisis y aléjate antes de la descarga.',
      deaDisclaimer: 'Simulador didáctico genérico: los DEA reales varían según el fabricante (mensajes, tiempos, botones y parches). No sustituye la formación práctica acreditada en soporte vital básico y uso del DEA.',
      deaModel: 'Modelo', deaSemi: 'Semiautomático', deaAuto: 'Automático', deaModelHint: 'Semiautomático: tú pulsas el botón de descarga. Automático: descarga sola tras el aviso.',
      deaScenario: 'Ritmo del paciente', deaScRandom: 'Aleatorio', deaScVF: 'Fibrilación ventricular', deaScAsys: 'Asistolia', deaScHint: 'Marca uno o varios. Si marcas varios, el simulador elige uno al azar y no te dice cuál: lo sabrás en la evaluación.',
      deaAge: 'Paciente', deaAdult: 'Adulto', deaChild: 'Niño (parches pediátricos)', deaMode: 'Modo', deaGuided: 'Guiado', deaExam: 'Examen', deaModeHint: 'Guiado: con ayudas visibles. Examen: sin ayudas y con evaluación final.',
      deaSound: 'Pitidos y sonidos del DEA', deaCprLen: 'Duración de la RCP', deaCpr2: '2 minutos (real)', deaCpr30: '30 segundos (práctica rápida)',
      deaStart: 'Empezar simulacro', deaFinish: 'Terminar y evaluar', deaRestart: 'Nuevo simulacro', deaToSetup: 'Cambiar ajustes',
      deaSceneA: 'Un adulto se ha desplomado: no responde y no respira con normalidad. Ya has llamado al 112 y te traen el DEA.', deaSceneC: 'Un niño se ha desplomado: no responde y no respira con normalidad. Ya has llamado al 112 y te traen el DEA.',
      deaSteps: 'Enciende el DEA y sigue sus instrucciones.', deaBtnTouch: 'Tocar al paciente', deaBtnClear: 'Aparté a todos', deaBtnCpr: 'Empiezo la RCP',
      deaBtnTouchHint: 'Simula que tocas o das compresiones', deaBtnClearHint: 'Confirma que nadie toca al paciente',
      aOn: 'Botón de encendido del DEA', aShock: 'Botón de descarga del DEA', aPlug: 'Conector de parches: conectar o desconectar', aShirt: 'Ropa del paciente: retirar para descubrir el pecho', aPad: 'Parche {n}: arrástralo al pecho del paciente, o usa las flechas del teclado',
      deaLights: { ready: 'LISTO', pads: 'PARCHES', ana: 'ANÁLISIS', child: 'NIÑO' }, deaPatient: 'Paciente', deaBag: 'PARCHES', deaBagChild: 'PARCHES PEDIÁTRICOS', deaPlugLbl: 'CONECTOR', deaOnLbl: 'ENCENDIDO', deaShockLbl: 'DESCARGA', deaNoSignal: 'SIN SEÑAL',
      zoneR: 'Bajo la clavícula derecha', zoneL: 'Costado izquierdo, bajo la axila',
      scr: { off: 'DEA APAGADO', on: 'ENCENDIDO', undress: 'DESCUBRA EL PECHO', pads: 'COLOQUE LOS PARCHES', connect: 'CONECTE EL CABLE', check: 'COMPRUEBE PARCHES', lost: 'REVISE LOS PARCHES', analyze: 'ANALIZANDO…', motion: 'NO TOQUE AL PACIENTE', charging: 'CARGANDO…', clear: 'ALÉJESE DEL PACIENTE', press: 'PULSE DESCARGA', auto: 'DESCARGA EN {n}', shocked: 'DESCARGA ADMINISTRADA', noshock: 'DESCARGA NO RECOMENDADA', cpr: 'RCP', cprend: 'PREPARE EL ANÁLISIS', cancelled: 'DESCARGA CANCELADA', done: 'FIN' },
      say: {
        breaths: '{n} compresiones. Dé dos insuflaciones.', resume: 'Reanude las compresiones.', padsInfant: 'Use parches pediátricos. Coloque un parche en el centro del pecho y otro en el centro de la espalda del bebé.', 
        on: 'Equipo encendido. Siga las instrucciones.', undress: 'Retire la ropa del pecho del paciente.', pads: 'Coloque los parches adhesivos en el pecho desnudo del paciente, como indican los dibujos.',
        padsChild: 'Use parches pediátricos. Colóquelos en el pecho desnudo del niño, como indican los dibujos.', check: 'Compruebe la colocación de los parches.', lost: 'Parches desconectados o despegados. Compruébelos.', connect: 'Conecte el cable de los parches al desfibrilador.',
        analyze: 'Analizando el ritmo. No toque al paciente.', motion: 'Movimiento detectado. No toque al paciente.', shockAdv: 'Descarga recomendada. Cargando.', clear: 'Aléjese del paciente. Compruebe que nadie lo toca.', press: 'Pulse el botón de descarga ahora.',
        auto: 'Aléjese del paciente. La descarga se administrará en tres, dos, uno.', shocked: 'Descarga administrada. Inicie la RCP.', noshock: 'Descarga no recomendada. Compruebe al paciente.', cancelled: 'Descarga cancelada. Inicie la RCP.',
        cpr: 'Continúe con la RCP.', push: 'Comprima fuerte y rápido.', cprend: 'Prepárese para detener la RCP.'
      },
      hint: { on: 'Pulsa el botón verde para encender el DEA.', undress: 'Toca la ropa del paciente para retirarla.', pads: 'Arrastra cada parche a una zona marcada del pecho.', connect: 'Toca el conector del DEA para enchufar el cable.', wait: 'Espera sin tocar al paciente.', clear: 'Pulsa «Aparté a todos» y después el botón naranja.', clearAuto: 'Pulsa «Aparté a todos» antes de que termine la cuenta atrás.', cpr: 'Comprueba al paciente: si no respira, comprime y da las insuflaciones; si respira con normalidad, colócalo en posición lateral de seguridad.', cprOn: 'Comprueba al paciente: si no respira, comprime y da las insuflaciones; si respira con normalidad, colócalo en posición lateral de seguridad.', cprBreath: 'Da dos insuflaciones (botón «Insuflación» o tecla B).', padsInfant: 'Lactante: un parche en el centro del pecho y el otro en el centro de la espalda (recuadro «Espalda»).' },
      fbOk: 'Parche {n} bien colocado', fbBad: 'Parche {n} mal colocado: {why}', fbShirt: 'Retira antes la ropa del pecho', fbNoShock: 'No hay ninguna descarga cargada',
      why: { out: 'fuera de la zona del tórax', abd: 'demasiado bajo', side: 'lejos de la zona indicada', same: 'los dos parches están en el mismo lado' },
      ev: {
        cycle: 'Ciclo {i}: {c} compresiones a {r}/min', recov: 'Paciente recuperado: posición lateral de seguridad', recovWrong: 'Posición lateral de seguridad con el paciente en parada', cprRosc: 'Comprimió a un paciente que respiraba', pause: 'Pausa de más de 10 s sin comprimir', 
        start: 'Comienza el simulacro', on: 'DEA encendido', undress: 'Ropa retirada del pecho', padOk: 'Parche {n} colocado ({zone})', padBad: 'Parche {n} mal colocado: {why}', padOff: 'Parche {n} retirado', plug: 'Cable conectado', unplug: 'Cable desconectado',
        analysis: 'Análisis {n} del ritmo', touchAna: 'Tocó al paciente durante el análisis', touchCh: 'Tocó al paciente con la descarga cargada', shockAdv: 'Descarga recomendada', noShock: 'Descarga no recomendada', clear: 'Confirmó que todos estaban apartados',
        shock: 'Descarga administrada', shockNoClear: 'Descarga administrada sin confirmar que todos estaban apartados', shockEarly: 'Pulsó descarga sin descarga cargada', cancel: 'Descarga cancelada por tiempo', cprPrompt: 'El DEA indica iniciar la RCP', cprStart: 'Inicia la RCP ({s} s tras el aviso)', cprEnd: 'Fin del periodo de RCP', finish: 'Fin del simulacro'
      },
      evTitle: 'Evaluación', evScore: 'Puntuación didáctica', evTimes: 'Tiempos', evOn: 'Hasta encender el DEA', evShock: 'Hasta la primera descarga', evNoShockNeeded: 'No estaba indicada', evNoShockDone: 'No se llegó a descargar', evCprDelay: 'Retraso medio en empezar la RCP', evErrors: 'Errores', evNoErrors: 'Sin errores: muy bien.', evLog: 'Registro cronológico', evCopy: 'Copiar registro', evCopied: 'Registro copiado', evSlow: 'Consejo: en una emergencia real, la descarga debe llegar lo antes posible; practica a encender, poner los parches y apartarte con fluidez.', evScoreNote: 'Puntuación orientativa solo para este simulador.',
      evVerdict: { good: 'Muy bien: secuencia correcta y segura.', ok: 'Bien, con puntos que mejorar.', low: 'Repite el simulacro con el modo guiado.' },
      err: { irreg: 'Ritmo irregular entre compresiones', fewComp: 'Pocas compresiones por minuto (demasiadas pausas)', cycle: 'Ciclos con compresiones o insuflaciones incorrectas', rate: 'Ritmo medio fuera de 100–120/min', cprRosc: 'Comprimió a un paciente que respiraba', recovWrong: 'Posición de seguridad con el paciente en parada', pause: 'Pausas de más de 10 s sin comprimir', noRecov: 'No reconoció la recuperación del paciente', pad: 'Parches mal colocados', touch: 'Tocó al paciente durante el análisis', noclear: 'No se apartó antes de la descarga', touchch: 'Tocó al paciente con la descarga cargada', cprdelay: 'Retraso en empezar la RCP (más de 10 s)', nocpr: 'No inició la RCP', timeout: 'No administró la descarga a tiempo', noshock: 'No llegó a administrar la descarga indicada' },
      deaScenarios: 'Ritmos posibles', deaInfant: 'Lactante (<1 año, parches pediátricos)', deaSceneI: 'Un lactante se ha desplomado: no responde y no respira con normalidad. Ya has llamado al 112 y te traen el DEA.', deaRatio: 'Relación compresiones:insuflaciones', deaRatioAuto: 'Según la edad', deaRatioComp: 'Solo compresiones', deaRatioHint: 'Según la edad: 30:2 en adultos y 15:2 en niños y lactantes (quien tiene deber de asistencia; un testigo sin formación puede usar 30:2).', deaMetro: 'Metrónomo durante la RCP (solo en modo guiado)', deaBtnRecov: 'Comprobar y poner en posición lateral de seguridad', deaBack: 'ESPALDA', zoneF: 'Centro del pecho (delante)', zoneB: 'Centro de la espalda', cpTap: 'COMPRIMIR', cpBreathNow: '¡{n} hechas! Da 2 insuflaciones', cpBreath: 'Insuflación', cpBreathK: 'Insuflación {k}/2', cpFirst: 'Empieza con las compresiones.', cpCycleBad: 'Ciclo incorrecto: lo correcto son {n} compresiones y 2 insuflaciones.', cpKeys: 'Toca el botón grande en cada compresión (o barra espaciadora). Insuflación: botón o tecla B.', cpFast: 'demasiado rápido', cpSlow: 'demasiado lento', cpGood: 'ritmo correcto', cpTotal: 'Compresiones: {n}', obsDead: 'Compruebas al paciente: no responde, no se mueve y no respira con normalidad.', obsAlive: 'Compruebas al paciente: se mueve, abre los ojos y respira con normalidad.', evRhythm: 'Ritmo real del paciente', evCprTitle: 'Calidad de la RCP', evComp: 'Compresiones', evRate: 'Ritmo medio', evInRange: 'Dentro de 100–120/min', evCycles: 'Ciclos correctos', evBreaths: 'Insuflaciones', deaRatio30: '30:2', deaRatio15: '15:2', sc: { vf: 'Fibrilación ventricular', vt: 'Taquicardia ventricular sin pulso', asys: 'Asistolia', pea: 'Actividad eléctrica sin pulso (AESP)', rosc: 'FV con recuperación tras algunas descargas' }, tech: { adult: 'Adulto: dos manos en el centro del pecho, hunde 5–6 cm, 100–120/min; 30 compresiones y 2 insuflaciones.', child: 'Niño: una o dos manos en la mitad inferior del esternón, hunde 1/3 del tórax (≈5 cm), 100–120/min; 15 compresiones y 2 insuflaciones.', infant: 'Lactante: dos dedos (o los pulgares rodeando el tórax) en la mitad inferior del esternón, hunde 1/3 del tórax (≈4 cm), 100–120/min; 15 compresiones y 2 insuflaciones.' }, deaEcg: 'Mostrar el ECG en la pantalla del DEA (revela el ritmo)', deaClearDone: 'Todos apartados: ya puedes descargar', evEff: 'Compresiones efectivas por minuto (con pausas)', evReg: 'Variación entre compresiones (menos es mejor)', scenesTitle: 'Escenario'
    },
    ca: {
      tabAed: 'Simulador DEA', deaTitle: 'Simulador de DEA', deaIntro: 'Practica amb un desfibril·lador automàtic que parla, analitza el ritme i et guia. Col·loca els pegats al pacient, no el toquis durant l\'anàlisi i allunya\'t abans de la descàrrega.',
      deaDisclaimer: 'Simulador didàctic genèric: els DEA reals varien segons el fabricant (missatges, temps, botons i pegats). No substitueix la formació pràctica acreditada en suport vital bàsic i ús del DEA.',
      deaModel: 'Model', deaSemi: 'Semiautomàtic', deaAuto: 'Automàtic', deaModelHint: 'Semiautomàtic: tu prems el botó de descàrrega. Automàtic: descarrega sol després de l\'avís.',
      deaScenario: 'Ritme del pacient', deaScRandom: 'Aleatori', deaScVF: 'Fibril·lació ventricular', deaScAsys: 'Asistòlia', deaScHint: "Marca'n un o diversos. Si en marques diversos, el simulador en tria un a l'atzar i no et diu quin: ho sabràs a l'avaluació.",
      deaAge: 'Pacient', deaAdult: 'Adult', deaChild: 'Infant (pegats pediàtrics)', deaMode: 'Mode', deaGuided: 'Guiat', deaExam: 'Examen', deaModeHint: 'Guiat: amb ajudes visibles. Examen: sense ajudes i amb avaluació final.',
      deaSound: 'Xiulets i sons del DEA', deaCprLen: 'Durada de la RCP', deaCpr2: '2 minuts (real)', deaCpr30: '30 segons (pràctica ràpida)',
      deaStart: 'Comença el simulacre', deaFinish: 'Acaba i avalua', deaRestart: 'Nou simulacre', deaToSetup: 'Canvia els ajustos',
      deaSceneA: 'Un adult s\'ha desplomat: no respon i no respira amb normalitat. Ja has trucat al 112 i et porten el DEA.', deaSceneC: 'Un infant s\'ha desplomat: no respon i no respira amb normalitat. Ja has trucat al 112 i et porten el DEA.',
      deaSteps: 'Encén el DEA i segueix les seves instruccions.', deaBtnTouch: 'Tocar el pacient', deaBtnClear: 'M\'he apartat i tothom també', deaBtnCpr: 'Començo la RCP',
      deaBtnTouchHint: 'Simula que toques o fas compressions', deaBtnClearHint: 'Confirma que ningú toca el pacient',
      aOn: 'Botó d\'encesa del DEA', aShock: 'Botó de descàrrega del DEA', aPlug: 'Connector de pegats: connectar o desconnectar', aShirt: 'Roba del pacient: retira-la per descobrir el pit', aPad: 'Pegat {n}: arrossega\'l al pit del pacient, o fes servir les fletxes del teclat',
      deaLights: { ready: 'A PUNT', pads: 'PEGATS', ana: 'ANÀLISI', child: 'INFANT' }, deaPatient: 'Pacient', deaBag: 'PEGATS', deaBagChild: 'PEGATS PEDIÀTRICS', deaPlugLbl: 'CONNECTOR', deaOnLbl: 'ENCESA', deaShockLbl: 'DESCÀRREGA', deaNoSignal: 'SENSE SENYAL',
      zoneR: 'Sota la clavícula dreta', zoneL: 'Costat esquerre, sota l\'aixella',
      scr: { off: 'DEA APAGAT', on: 'ENCÈS', undress: 'DESCOBREIXI EL PIT', pads: 'COL·LOQUI ELS PEGATS', connect: 'CONNECTI EL CABLE', check: 'COMPROVI ELS PEGATS', lost: 'REVISI ELS PEGATS', analyze: 'ANALITZANT…', motion: 'NO TOQUI EL PACIENT', charging: 'CARREGANT…', clear: 'ALLUNYI\'S DEL PACIENT', press: 'PREMI DESCÀRREGA', auto: 'DESCÀRREGA EN {n}', shocked: 'DESCÀRREGA ADMINISTRADA', noshock: 'DESCÀRREGA NO RECOMANADA', cpr: 'RCP', cprend: 'PREPARI L\'ANÀLISI', cancelled: 'DESCÀRREGA CANCEL·LADA', done: 'FI' },
      say: {
        breaths: '{n} compressions. Faci dues insuflacions.', resume: 'Reprengui les compressions.', padsInfant: "Utilitzi pegats pediàtrics. Col·loqui un pegat al centre del pit i un altre al centre de l'esquena del bebè.", 
        on: 'Equip encès. Segueixi les instruccions.', undress: 'Tregui la roba del pit del pacient.', pads: 'Col·loqui els pegats adhesius al pit nu del pacient, com indiquen els dibuixos.',
        padsChild: 'Utilitzi pegats pediàtrics. Col·loqui\'ls al pit nu de l\'infant, com indiquen els dibuixos.', check: 'Comprovi la col·locació dels pegats.', lost: 'Pegats desconnectats o despegats. Comprovi\'ls.', connect: 'Connecti el cable dels pegats al desfibril·lador.',
        analyze: 'Analitzant el ritme. No toqui el pacient.', motion: 'Moviment detectat. No toqui el pacient.', shockAdv: 'Descàrrega recomanada. Carregant.', clear: 'Allunyi\'s del pacient. Comprovi que ningú el toca.', press: 'Premi el botó de descàrrega ara.',
        auto: 'Allunyi\'s del pacient. La descàrrega s\'administrarà en tres, dos, un.', shocked: 'Descàrrega administrada. Iniciï la RCP.', noshock: 'Descàrrega no recomanada. Comprovi el pacient.', cancelled: 'Descàrrega cancel·lada. Iniciï la RCP.',
        cpr: 'Continuï amb la RCP.', push: 'Comprimeixi fort i ràpid.', cprend: 'Prepari\'s per aturar la RCP.'
      },
      hint: { on: 'Prem el botó verd per encendre el DEA.', undress: 'Toca la roba del pacient per retirar-la.', pads: 'Arrossega cada pegat a una zona marcada del pit.', connect: 'Toca el connector del DEA per endollar el cable.', wait: 'Espera sense tocar el pacient.', clear: 'Prem «M\'he apartat…» i després el botó taronja.', clearAuto: 'Prem «M\'he apartat…» abans que acabi el compte enrere.', cpr: "Comprova el pacient: si no respira, comprimeix i fes les insuflacions; si respira amb normalitat, posa'l en posició lateral de seguretat.", cprOn: "Comprova el pacient: si no respira, comprimeix i fes les insuflacions; si respira amb normalitat, posa'l en posició lateral de seguretat.", cprBreath: 'Fes dues insuflacions (botó «Insuflació» o tecla B).', padsInfant: "Lactant: un pegat al centre del pit i l'altre al centre de l'esquena (requadre «Esquena»)." },
      fbOk: 'Pegat {n} ben col·locat', fbBad: 'Pegat {n} mal col·locat: {why}', fbShirt: 'Retira abans la roba del pit', fbNoShock: 'No hi ha cap descàrrega carregada',
      why: { out: 'fora de la zona del tòrax', abd: 'massa baix', side: 'lluny de la zona indicada', same: 'els dos pegats són al mateix costat' },
      ev: {
        cycle: 'Cicle {i}: {c} compressions a {r}/min', recov: 'Pacient recuperat: posició lateral de seguretat', recovWrong: 'Posició lateral de seguretat amb el pacient en parada', cprRosc: 'Va comprimir un pacient que respirava', pause: 'Pausa de més de 10 s sense comprimir', 
        start: 'Comença el simulacre', on: 'DEA encès', undress: 'Roba retirada del pit', padOk: 'Pegat {n} col·locat ({zone})', padBad: 'Pegat {n} mal col·locat: {why}', padOff: 'Pegat {n} retirat', plug: 'Cable connectat', unplug: 'Cable desconnectat',
        analysis: 'Anàlisi {n} del ritme', touchAna: 'Va tocar el pacient durant l\'anàlisi', touchCh: 'Va tocar el pacient amb la descàrrega carregada', shockAdv: 'Descàrrega recomanada', noShock: 'Descàrrega no recomanada', clear: 'Va confirmar que tothom era apartat',
        shock: 'Descàrrega administrada', shockNoClear: 'Descàrrega administrada sense confirmar que tothom era apartat', shockEarly: 'Va prémer descàrrega sense descàrrega carregada', cancel: 'Descàrrega cancel·lada per temps', cprPrompt: 'El DEA indica iniciar la RCP', cprStart: 'Inicia la RCP ({s} s després de l\'avís)', cprEnd: 'Fi del període de RCP', finish: 'Fi del simulacre'
      },
      evTitle: 'Avaluació', evScore: 'Puntuació didàctica', evTimes: 'Temps', evOn: 'Fins a encendre el DEA', evShock: 'Fins a la primera descàrrega', evNoShockNeeded: 'No estava indicada', evNoShockDone: 'No es va arribar a descarregar', evCprDelay: 'Retard mitjà a començar la RCP', evErrors: 'Errors', evNoErrors: 'Sense errors: molt bé.', evLog: 'Registre cronològic', evCopy: 'Copia el registre', evCopied: 'Registre copiat', evSlow: 'Consell: en una emergència real, la descàrrega ha d\'arribar el més aviat possible; practica a encendre, posar els pegats i apartar-te amb fluïdesa.', evScoreNote: 'Puntuació orientativa només per a aquest simulador.',
      evVerdict: { good: 'Molt bé: seqüència correcta i segura.', ok: 'Bé, amb punts a millorar.', low: 'Repeteix el simulacre amb el mode guiat.' },
      err: { irreg: 'Ritme irregular entre compressions', fewComp: 'Poques compressions per minut (massa pauses)', cycle: 'Cicles amb compressions o insuflacions incorrectes', rate: 'Ritme mitjà fora de 100–120/min', cprRosc: 'Va comprimir un pacient que respirava', recovWrong: 'Posició de seguretat amb el pacient en parada', pause: 'Pauses de més de 10 s sense comprimir', noRecov: 'No va reconèixer la recuperació del pacient', pad: 'Pegats mal col·locats', touch: 'Va tocar el pacient durant l\'anàlisi', noclear: 'No es va apartar abans de la descàrrega', touchch: 'Va tocar el pacient amb la descàrrega carregada', cprdelay: 'Retard a començar la RCP (més de 10 s)', nocpr: 'No va iniciar la RCP', timeout: 'No va administrar la descàrrega a temps', noshock: 'No va arribar a administrar la descàrrega indicada' },
      deaScenarios: 'Ritmes possibles', deaInfant: 'Lactant (<1 any, pegats pediàtrics)', deaSceneI: "Un lactant s'ha desplomat: no respon i no respira amb normalitat. Ja has trucat al 112 i et porten el DEA.", deaRatio: 'Relació compressions:insuflacions', deaRatioAuto: "Segons l'edat", deaRatioComp: 'Només compressions', deaRatioHint: "Segons l'edat: 30:2 en adults i 15:2 en infants i lactants (qui té deure d'assistència; un testimoni sense formació pot fer servir 30:2).", deaMetro: 'Metrònom durant la RCP (només en mode guiat)', deaBtnRecov: 'Comprovar i posar en posició lateral de seguretat', deaBack: 'ESQUENA', zoneF: 'Centre del pit (davant)', zoneB: "Centre de l'esquena", cpTap: 'COMPRIMEIX', cpBreathNow: '{n} fetes! Fes 2 insuflacions', cpBreath: 'Insuflació', cpBreathK: 'Insuflació {k}/2', cpFirst: 'Comença amb les compressions.', cpCycleBad: 'Cicle incorrecte: el correcte són {n} compressions i 2 insuflacions.', cpKeys: 'Toca el botó gran a cada compressió (o barra espaiadora). Insuflació: botó o tecla B.', cpFast: 'massa ràpid', cpSlow: 'massa lent', cpGood: 'ritme correcte', cpTotal: 'Compressions: {n}', obsDead: 'Comproves el pacient: no respon, no es mou i no respira amb normalitat.', obsAlive: 'Comproves el pacient: es mou, obre els ulls i respira amb normalitat.', evRhythm: 'Ritme real del pacient', evCprTitle: 'Qualitat de la RCP', evComp: 'Compressions', evRate: 'Ritme mitjà', evInRange: 'Dins de 100–120/min', evCycles: 'Cicles correctes', evBreaths: 'Insuflacions', deaRatio30: '30:2', deaRatio15: '15:2', sc: { vf: 'Fibril·lació ventricular', vt: 'Taquicàrdia ventricular sense pols', asys: 'Asistòlia', pea: 'Activitat elèctrica sense pols (AESP)', rosc: 'FV amb recuperació després d\'algunes descàrregues' }, tech: { adult: 'Adult: dues mans al centre del pit, enfonsa 5–6 cm, 100–120/min; 30 compressions i 2 insuflacions.', child: 'Infant: una o dues mans a la meitat inferior de l\'estern, enfonsa 1/3 del tòrax (≈5 cm), 100–120/min; 15 compressions i 2 insuflacions.', infant: 'Lactant: dos dits (o els polzes envoltant el tòrax) a la meitat inferior de l\'estern, enfonsa 1/3 del tòrax (≈4 cm), 100–120/min; 15 compressions i 2 insuflacions.' }, deaEcg: 'Mostra l\'ECG a la pantalla del DEA (revela el ritme)', deaClearDone: 'Tothom apartat: ja pots descarregar', evEff: 'Compressions efectives per minut (amb pauses)', evReg: 'Variació entre compressions (menys és millor)', scenesTitle: 'Escenari'
    },
    en: {
      tabAed: 'AED simulator', deaTitle: 'AED simulator', deaIntro: 'Practise with an automated external defibrillator that speaks, analyses the rhythm and guides you. Place the pads on the patient, do not touch them during analysis and stand clear before the shock.',
      deaDisclaimer: 'Generic teaching simulator: real AEDs differ by manufacturer (prompts, timings, buttons and pads). It does not replace accredited hands-on training in basic life support and AED use.',
      deaModel: 'Model', deaSemi: 'Semi-automatic', deaAuto: 'Fully automatic', deaModelHint: 'Semi-automatic: you press the shock button. Automatic: it shocks by itself after the warning.',
      deaScenario: 'Patient rhythm', deaScRandom: 'Random', deaScVF: 'Ventricular fibrillation', deaScAsys: 'Asystole', deaScHint: 'Tick one or several. With several, the simulator picks one at random and does not tell you which: you will find out in the assessment.',
      deaAge: 'Patient', deaAdult: 'Adult', deaChild: 'Child (paediatric pads)', deaMode: 'Mode', deaGuided: 'Guided', deaExam: 'Exam', deaModeHint: 'Guided: with visible help. Exam: no help and a final assessment.',
      deaSound: 'AED beeps and sounds', deaCprLen: 'CPR duration', deaCpr2: '2 minutes (real)', deaCpr30: '30 seconds (quick practice)',
      deaStart: 'Start simulation', deaFinish: 'Finish and assess', deaRestart: 'New simulation', deaToSetup: 'Change settings',
      deaSceneA: 'An adult has collapsed: unresponsive and not breathing normally. You have already called 112 and the AED is brought to you.', deaSceneC: 'A child has collapsed: unresponsive and not breathing normally. You have already called 112 and the AED is brought to you.',
      deaSteps: 'Switch the AED on and follow its instructions.', deaBtnTouch: 'Touch the patient', deaBtnClear: 'I and everyone stand clear', deaBtnCpr: 'I start CPR',
      deaBtnTouchHint: 'Simulates touching or doing compressions', deaBtnClearHint: 'Confirms nobody is touching the patient',
      aOn: 'AED power button', aShock: 'AED shock button', aPlug: 'Pad connector: plug or unplug', aShirt: 'Patient\'s clothing: remove to bare the chest', aPad: 'Pad {n}: drag it onto the patient\'s chest, or use the arrow keys',
      deaLights: { ready: 'READY', pads: 'PADS', ana: 'ANALYSIS', child: 'CHILD' }, deaPatient: 'Patient', deaBag: 'PADS', deaBagChild: 'PAEDIATRIC PADS', deaPlugLbl: 'CONNECTOR', deaOnLbl: 'POWER', deaShockLbl: 'SHOCK', deaNoSignal: 'NO SIGNAL',
      zoneR: 'Below the right collarbone', zoneL: 'Left side, below the armpit',
      scr: { off: 'AED OFF', on: 'POWER ON', undress: 'BARE THE CHEST', pads: 'APPLY THE PADS', connect: 'CONNECT THE CABLE', check: 'CHECK THE PADS', lost: 'CHECK THE PADS', analyze: 'ANALYSING…', motion: 'DO NOT TOUCH PATIENT', charging: 'CHARGING…', clear: 'STAND CLEAR', press: 'PRESS SHOCK', auto: 'SHOCK IN {n}', shocked: 'SHOCK DELIVERED', noshock: 'NO SHOCK ADVISED', cpr: 'CPR', cprend: 'PREPARE TO ANALYSE', cancelled: 'SHOCK CANCELLED', done: 'END' },
      say: {
        breaths: '{n} compressions. Give two breaths.', resume: 'Resume compressions.', padsInfant: "Use paediatric pads. Apply one pad to the centre of the baby's chest and the other to the centre of the back.", 
        on: 'Unit on. Follow the instructions.', undress: 'Remove clothing from the patient\'s chest.', pads: 'Apply the adhesive pads to the patient\'s bare chest, as shown in the pictures.',
        padsChild: 'Use paediatric pads. Apply them to the child\'s bare chest, as shown in the pictures.', check: 'Check the position of the pads.', lost: 'Pads disconnected or loose. Check them.', connect: 'Connect the pad cable to the defibrillator.',
        analyze: 'Analysing the rhythm. Do not touch the patient.', motion: 'Movement detected. Do not touch the patient.', shockAdv: 'Shock advised. Charging.', clear: 'Stand clear of the patient. Make sure nobody is touching them.', press: 'Press the shock button now.',
        auto: 'Stand clear of the patient. A shock will be delivered in three, two, one.', shocked: 'Shock delivered. Start CPR.', noshock: 'No shock advised. Check the patient.', cancelled: 'Shock cancelled. Start CPR.',
        cpr: 'Continue CPR.', push: 'Push hard and fast.', cprend: 'Get ready to stop CPR.'
      },
      hint: { on: 'Press the green button to switch the AED on.', undress: 'Tap the patient\'s clothing to remove it.', pads: 'Drag each pad to a marked area of the chest.', connect: 'Tap the AED connector to plug in the cable.', wait: 'Wait without touching the patient.', clear: 'Press "I and everyone stand clear", then the orange button.', clearAuto: 'Press "I and everyone stand clear" before the countdown ends.', cpr: 'Check the patient: if not breathing, compress and give breaths; if breathing normally, place them in the recovery position.', cprOn: 'Check the patient: if not breathing, compress and give breaths; if breathing normally, place them in the recovery position.', cprBreath: 'Give two breaths (the «Breath» button or the B key).', padsInfant: 'Infant: one pad on the centre of the chest and the other on the centre of the back (the «Back» box).' },
      fbOk: 'Pad {n} placed correctly', fbBad: 'Pad {n} misplaced: {why}', fbShirt: 'Remove the clothing from the chest first', fbNoShock: 'No shock is charged',
      why: { out: 'outside the chest area', abd: 'too low', side: 'away from the marked area', same: 'both pads are on the same side' },
      ev: {
        cycle: 'Cycle {i}: {c} compressions at {r}/min', recov: 'Patient recovered: recovery position', recovWrong: 'Recovery position with the patient in arrest', cprRosc: 'Compressed a breathing patient', pause: 'Pause of over 10 s without compressing', 
        start: 'Simulation starts', on: 'AED switched on', undress: 'Chest bared', padOk: 'Pad {n} placed ({zone})', padBad: 'Pad {n} misplaced: {why}', padOff: 'Pad {n} removed', plug: 'Cable connected', unplug: 'Cable disconnected',
        analysis: 'Rhythm analysis {n}', touchAna: 'Touched the patient during analysis', touchCh: 'Touched the patient while the shock was charged', shockAdv: 'Shock advised', noShock: 'No shock advised', clear: 'Confirmed everyone was clear',
        shock: 'Shock delivered', shockNoClear: 'Shock delivered without confirming everyone was clear', shockEarly: 'Pressed shock with no shock charged', cancel: 'Shock cancelled (timed out)', cprPrompt: 'The AED tells you to start CPR', cprStart: 'Starts CPR ({s} s after the prompt)', cprEnd: 'End of the CPR period', finish: 'Simulation ends'
      },
      evTitle: 'Assessment', evScore: 'Teaching score', evTimes: 'Times', evOn: 'To switch the AED on', evShock: 'To the first shock', evNoShockNeeded: 'Not indicated', evNoShockDone: 'No shock was delivered', evCprDelay: 'Mean delay starting CPR', evErrors: 'Errors', evNoErrors: 'No errors: well done.', evLog: 'Chronological log', evCopy: 'Copy log', evCopied: 'Log copied', evSlow: 'Tip: in a real emergency the shock must come as soon as possible; practise switching on, applying the pads and standing clear fluently.', evScoreNote: 'Indicative score for this simulator only.',
      evVerdict: { good: 'Very good: correct and safe sequence.', ok: 'Good, with points to improve.', low: 'Repeat the simulation in guided mode.' },
      err: { irreg: 'Irregular rhythm between compressions', fewComp: 'Too few compressions per minute (too many pauses)', cycle: 'Cycles with wrong compressions or breaths', rate: 'Mean rate outside 100–120/min', cprRosc: 'Compressed a breathing patient', recovWrong: 'Recovery position with the patient in arrest', pause: 'Pauses of over 10 s without compressing', noRecov: "Did not recognise the patient's recovery", pad: 'Misplaced pads', touch: 'Touched the patient during analysis', noclear: 'Did not stand clear before the shock', touchch: 'Touched the patient while the shock was charged', cprdelay: 'Delay starting CPR (over 10 s)', nocpr: 'Did not start CPR', timeout: 'Did not deliver the shock in time', noshock: 'Did not deliver the indicated shock' },
      deaScenarios: 'Possible rhythms', deaInfant: 'Infant (<1 year, paediatric pads)', deaSceneI: 'An infant has collapsed: unresponsive and not breathing normally. You have already called 112 and the AED is brought to you.', deaRatio: 'Compression:breath ratio', deaRatioAuto: 'By age', deaRatioComp: 'Compressions only', deaRatioHint: 'By age: 30:2 for adults and 15:2 for children and infants (for those with a duty to respond; an untrained bystander may use 30:2).', deaMetro: 'Metronome during CPR (guided mode only)', deaBtnRecov: 'Check and place in the recovery position', deaBack: 'BACK', zoneF: 'Centre of the chest (front)', zoneB: 'Centre of the back', cpTap: 'COMPRESS', cpBreathNow: '{n} done! Give 2 breaths', cpBreath: 'Breath', cpBreathK: 'Breath {k}/2', cpFirst: 'Start with compressions.', cpCycleBad: 'Wrong cycle: the correct one is {n} compressions and 2 breaths.', cpKeys: 'Tap the big button for each compression (or the space bar). Breath: button or the B key.', cpFast: 'too fast', cpSlow: 'too slow', cpGood: 'good rate', cpTotal: 'Compressions: {n}', obsDead: 'You check the patient: unresponsive, not moving and not breathing normally.', obsAlive: 'You check the patient: moving, opening their eyes and breathing normally.', evRhythm: 'Actual rhythm', evCprTitle: 'CPR quality', evComp: 'Compressions', evRate: 'Mean rate', evInRange: 'Within 100–120/min', evCycles: 'Correct cycles', evBreaths: 'Breaths', deaRatio30: '30:2', deaRatio15: '15:2', sc: { vf: 'Ventricular fibrillation', vt: 'Pulseless ventricular tachycardia', asys: 'Asystole', pea: 'Pulseless electrical activity (PEA)', rosc: 'VF recovering after a few shocks' }, tech: { adult: 'Adult: two hands on the centre of the chest, press 5–6 cm deep, 100–120/min; 30 compressions and 2 breaths.', child: 'Child: one or two hands on the lower half of the breastbone, press one third of the chest depth (≈5 cm), 100–120/min; 15 compressions and 2 breaths.', infant: 'Infant: two fingers (or both thumbs encircling the chest) on the lower half of the breastbone, press one third of the chest depth (≈4 cm), 100–120/min; 15 compressions and 2 breaths.' }, deaEcg: 'Show the ECG on the AED screen (reveals the rhythm)', deaClearDone: 'Everyone clear: you can shock now', evEff: 'Effective compressions per minute (with pauses)', evReg: 'Variation between compressions (lower is better)', scenesTitle: 'Scenario'
    }
  });

  /* ============================== ajustes y estado ============================== */
  const CFG = Object.assign({ model: 'semi', scenarios: null, age: 'adult', mode: 'guided', sound: true, cprLen: 120, ratio: 'auto', metro: true, ecg: true }, store.get('dea', {}));
  if (!Array.isArray(CFG.scenarios) || !CFG.scenarios.length) CFG.scenarios = CFG.scenario === 'vf' ? ['vf'] : CFG.scenario === 'asys' ? ['asys'] : ['vf', 'asys', 'rosc'];
  if (!['adult', 'child', 'infant'].includes(CFG.age)) CFG.age = 'adult';
  const saveCfg = () => store.set('dea', CFG);
  const TIM = { analysis: 8, charge: 4, armedTimeout: 30, autoCount: 6, cprDelayOk: 10, reprompt: 15, bpm: 110 };      // modificables en pruebas
  const PAD_W = 64, PAD_H = 46;
  let view = 'setup';                                            // setup | sim | eval
  let G = null, timer = 0, ecgTimer = 0, layoutWide = true, evalData = null;

  const newCp = () => ({ count: 0, breaths: 0, state: 'comp', last: 0, idle: performance.now(), cyc: [], short: false, pauseFlag: false, roscErr: false, bT: 0, nudged: false });
  /* Guion de análisis del ritmo (S = descarga indicada, N = no indicada, R = el paciente se ha recuperado). El último análisis cierra el simulacro. */
  const scriptFor = (sc) => (sc === 'vf' || sc === 'vt') ? ['S', 'S', 'N'] : sc === 'rosc' ? Array(1 + Math.floor(Math.random() * 3)).fill('S').concat('R') : ['N', 'N', 'N'];
  const ratioN = () => { const r = CFG.ratio === 'auto' ? (CFG.age === 'adult' ? '30' : '15') : CFG.ratio; return r === 'comp' ? 0 : +r; };
  const metroOn = () => CFG.metro && CFG.mode !== 'exam';
  const newG = () => {
    const pool = CFG.scenarios.length ? CFG.scenarios : ['vf'];
    const sc = pool[Math.floor(Math.random() * pool.length)];
    return {
      sc, script: scriptFor(sc), simT: 0, running: false, phase: 'off', phaseT: 0, powered: false, shirt: false, plug: false, clear: false, analysisN: 0, shocks: 0, finalCycle: false,
      pads: [1, 2].map(id => ({ id, inBag: true, x: 0, y: 0, zone: null, ok: false })), msg: { type: 'scr', key: 'off' }, say: null, lastPrompt: 0, step: null,
      events: [], errs: { pad: 0, touch: 0, noclear: 0, touchch: 0, cprdelay: 0, nocpr: 0, timeout: 0, noshock: 0, cycle: 0, rate: 0, cprRosc: 0, recovWrong: 0, pause: 0, noRecov: 0, irreg: 0, fewComp: 0 },
      tOn: null, tShock: null, cprPromptT: 0, cprStarted: true, cprDelays: [], ecg: [], touchFx: 0, clearFx: 0, flash: 0, lastBeep: 0, lastCue: 0, fb: '', obs: null, rosc: false, recovered: false, cp: newCp(), cpTot: { total: 0, ivs: [], cycles: [], breaths: 0 }, sayP: null, cprSecs: 0, compTs: [], shockPerf: 0, noshockPerf: 0
    };
  };

  const young = () => CFG.age !== 'adult';
  const infant = () => CFG.age === 'infant';
  const mmss = (s) => AppKit.mmss(s);
  const logEv = (key, params, err) => { G.events.push({ t: G.simT, key, params: params || {}, err: !!err }); };
  const evText = (e) => { const p = Object.assign({}, e.params); if (p.why) p.why = T('why')[p.why] || p.why; if (p.zoneKey) p.zone = T(p.zoneKey); return T('ev')[e.key].replace(/\{(\w+)\}/g, (m, k) => (k in p ? p[k] : m)); };
  const addErr = (k, guidedMsg) => { G.errs[k]++; if (CFG.mode === 'guided' && guidedMsg) toast(guidedMsg, true); };

  /* ============================== audio ============================== */
  const Snd = (() => {
    let ctx = null, master = null, metro = 0, nextClick = 0;
    const ensure = () => {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination); }
      master.gain.value = 0.5 * (R.voice.state ? R.voice.state.vol : 1);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return true;
    };
    const tone = (t, f, d, g, type = 'sine', f2) => {
      if (!CFG.sound || !ctx) return;
      const o = ctx.createOscillator(), a = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(a); a.connect(master); o.start(t); o.stop(t + d + 0.03);
    };
    return {
      ensure,
      beep(f = 880, d = 0.18, g = 0.5) { if (ensure()) tone(ctx.currentTime, f, d, g, 'sine'); },
      charge(d) { if (ensure()) tone(ctx.currentTime, 300, d, 0.35, 'sawtooth', 1900); },
      armed() { if (ensure()) { tone(ctx.currentTime, 1500, 0.09, 0.4, 'square'); } },
      thump() { if (ensure()) { tone(ctx.currentTime, 140, 0.35, 0.9, 'sine', 40); tone(ctx.currentTime, 2400, 0.05, 0.25, 'square'); } },
      error() { if (ensure()) { tone(ctx.currentTime, 330, 0.22, 0.4, 'square'); } },
      metro(on) {
        clearInterval(metro); metro = 0;
        if (!on || !ensure()) return;
        nextClick = ctx.currentTime + 0.1;
        metro = setInterval(() => { while (nextClick < ctx.currentTime + 0.3) { tone(nextClick, 1250, 0.05, 0.5, 'triangle'); nextClick += 60 / TIM.bpm; } }, 40);
      },
      stop() { clearInterval(metro); metro = 0; }
    };
  })();

  /* ============================== voz y rótulos ============================== */
  function speak(key, params, o = {}) {
    G.say = key; G.sayP = params || null; G.msg = { type: 'say', key, params };
    G.lastPrompt = G.simT;
    R.voice.say(sayText(key, params), { cancel: o.cancel !== false });
    paintCaption();
  }
  function screenMsg(key, params) { G.msg = { type: 'scr', key, params }; }
  const sayText = (key, params) => (T('say')[key] || '').replace(/\{(\w+)\}/g, (m, k) => (params && k in params ? params[k] : m));
  const caption = () => (G.say ? sayText(G.say, G.sayP) : '');

  /* ============================== geometría ============================== */
  const DEA_W = 360, DEA_H = 420, PAT_W = 400, PAT_H = 440, BAG = { w: 300, h: 64 };
  const LAY = {
    wide: { vb: '0 0 820 490', dea: [0, 0], bag: [30, 424], pat: [420, 10] },
    tall: { vb: '0 0 400 944', dea: [20, 0], bag: [50, 424], pat: [0, 500] }
  };
  const lay = () => (layoutWide ? LAY.wide : LAY.tall);
  const AGE_S = { adult: 1, child: 0.72, infant: 0.5 };
  const kid = () => AGE_S[CFG.age] || 1;
  const loc = (x, y) => [200 + (x - 200) * kid(), 20 + (y - 20) * kid()];           // coordenadas del paciente → escena (relativas al grupo)
  /* Adulto y niño: parche bajo la clavícula derecha y otro en el costado izquierdo. Lactante: uno en el centro del pecho y otro en el centro de la espalda (recuadro «Espalda»). */
  const ZONES_A = { R: { cx: 136, cy: 152, rx: 34, ry: 25 }, L: { cx: 280, cy: 248, rx: 28, ry: 34 } };
  const ZONES_I = { F: { cx: 200, cy: 196, rx: 38, ry: 30 }, B: { abs: true, cx: 200, cy: 350, rx: 56, ry: 42 } };
  const zonesDef = () => (infant() ? ZONES_I : ZONES_A);
  const zoneKeys = () => Object.keys(zonesDef());
  const zoneScene = (k) => {
    const z = zonesDef()[k], [px, py] = lay().pat;
    if (z.abs) return { x: px + z.cx, y: py + z.cy, rx: z.rx, ry: z.ry };
    const [cx, cy] = loc(z.cx, z.cy), s = kid(); return { x: px + cx, y: py + cy, rx: z.rx * s, ry: z.ry * s };
  };
  const padScale = () => Math.max(kid(), 0.6);
  const slot = (i) => { const [bx, by] = lay().bag; return { x: bx + (i === 0 ? 92 : 208), y: by + 26 }; };
  const plugPos = () => { const [dx, dy] = lay().dea; return G && G.plug ? { x: dx + 180, y: dy + 366 } : { x: dx + 282, y: dy + 392 }; };
  const torsoBox = () => { const [px, py] = lay().pat, a = loc(70, 96), b = loc(330, 345); return { x1: px + a[0], y1: py + a[1], x2: px + b[0], y2: py + b[1] }; };

  /* ============================== dibujo (SVG) ============================== */
  const INK = '#0d1a2a';
  function deaSvg() {
    const L = T('deaLights');
    return `
<g id="deaG">
  <defs>
    <linearGradient id="dBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f6fb"/><stop offset="1" stop-color="#cdd6e4"/></linearGradient>
    <radialGradient id="dOn" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#6ff0a0"/><stop offset="1" stop-color="#16a34a"/></radialGradient>
    <radialGradient id="dShock" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffb066"/><stop offset="1" stop-color="#ea580c"/></radialGradient>
  </defs>
  <path d="M112 46C112 2 248 2 248 46" fill="none" stroke="#aab6c8" stroke-width="16" stroke-linecap="round"/>
  <path d="M112 46C112 8 248 8 248 46" fill="none" stroke="#dfe5ee" stroke-width="7" stroke-linecap="round"/>
  <rect x="20" y="40" width="320" height="370" rx="34" fill="url(#dBody)" stroke="#a8b4c6" stroke-width="2"/>
  <rect x="30" y="50" width="300" height="350" rx="26" fill="none" stroke="#fff" stroke-opacity=".7"/>
  <g font-family="Source Sans 3,system-ui,sans-serif" font-size="10.5" font-weight="700" fill="#44546a" text-anchor="middle">
    <circle id="ledReady" cx="62" cy="68" r="8" fill="#9aa8bb"/><text x="62" y="92">${esc(L.ready)}</text>
    <circle id="ledPads" cx="118" cy="68" r="8" fill="#9aa8bb"/><text x="118" y="92">${esc(L.pads)}</text>
    <circle id="ledAna" cx="174" cy="68" r="8" fill="#9aa8bb"/><text x="174" y="92">${esc(L.ana)}</text>
    <circle id="ledChild" cx="230" cy="68" r="8" fill="#9aa8bb"/><text x="230" y="92">${esc(L.child)}</text>
  </g>
  <g fill="#7a8aa0">${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c => `<circle cx="${272 + c * 11}" cy="${58 + r * 11}" r="2.6"/>`).join('')).join('')}</g>
  <rect x="40" y="104" width="280" height="118" rx="12" fill="#08121f" stroke="#2a3b55" stroke-width="3"/>
  <text id="scrMsg" x="180" y="126" text-anchor="middle" font-family="Source Sans 3,system-ui,sans-serif" font-weight="700" font-size="14" fill="#7be8a6"></text>
  <line x1="48" y1="170" x2="312" y2="170" stroke="#17324f" stroke-width="1"/>
  <polyline id="ecg" points="" fill="none" stroke="#4ade80" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <text id="scrSub" x="180" y="214" text-anchor="middle" font-family="Source Sans 3,system-ui,sans-serif" font-weight="600" font-size="12.5" fill="#9fc4ee"></text>
  <g id="onBtn" role="button" tabindex="0" class="svg-btn" aria-label="${esc(T('aOn'))}">
    <circle cx="110" cy="276" r="44" fill="#16a34a" opacity=".25" class="halo"/>
    <circle cx="110" cy="276" r="38" fill="url(#dOn)" stroke="#0f7a37" stroke-width="3"/>
    <path d="M110 258v20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M97 266a18 18 0 1 0 26 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <g id="shockBtn" role="button" tabindex="0" class="svg-btn" aria-label="${esc(T('aShock'))}" aria-disabled="true">
    <circle cx="250" cy="276" r="46" fill="#f97316" opacity=".0" class="halo"/>
    <circle cx="250" cy="276" r="39" fill="url(#dShock)" stroke="#b44409" stroke-width="3"/>
    <path d="M256 252l-20 28h13l-5 24 22-31h-14z" fill="#fff"/>
  </g>
  <g font-family="Source Sans 3,system-ui,sans-serif" font-size="11" font-weight="700" fill="#44546a" text-anchor="middle"><text x="110" y="334">${esc(T('deaOnLbl'))}</text><text x="250" y="334">${esc(T('deaShockLbl'))}</text></g>
  <rect x="132" y="346" width="96" height="40" rx="8" fill="#1f2d44" stroke="#0b1626" stroke-width="2"/>
  <g fill="#3d526f"><rect x="146" y="354" width="68" height="6" rx="3"/><rect x="146" y="366" width="68" height="6" rx="3"/></g>
  <text x="180" y="402" text-anchor="middle" font-family="Source Sans 3,system-ui,sans-serif" font-size="10.5" font-weight="700" fill="#44546a">${esc(T('deaPlugLbl'))}</text>
</g>`;
  }
  const plugSvg = () => `<g id="plugG" role="button" tabindex="0" class="svg-btn" aria-label="${esc(T('aPlug'))}"><rect x="-30" y="-17" width="60" height="34" rx="9" fill="#f2b84b" stroke="#a9780f" stroke-width="2.5"/><rect x="-18" y="-9" width="36" height="18" rx="4" fill="#fde2a1"/><path d="M-6 0h12M0 -5v10" stroke="#a9780f" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="0" r="40" fill="none" class="halo" stroke="#fbbf24" stroke-width="3" opacity="0"/></g>`;

  function bagSvg() {
    return `<g id="bagG"><rect x="0" y="0" width="${BAG.w}" height="${BAG.h}" rx="14" fill="#16304f" stroke="#7fb2ea" stroke-width="2" stroke-dasharray="6 5"/>
      <text x="${BAG.w / 2}" y="${BAG.h - 6}" text-anchor="middle" font-family="Source Sans 3,system-ui,sans-serif" font-size="10.5" font-weight="700" fill="#9fc4ee">${esc(T(young() ? 'deaBagChild' : 'deaBag'))}</text></g>`;
  }

  function patientSvg() {
    const V = '#e2d4f7', V2 = '#c9b6ea', S = '#7fb2ea', S2 = '#5a93d1';
    const body = `
      <path d="M84 112L50 304" stroke="${V2}" stroke-width="42" stroke-linecap="round"/><path d="M316 112L350 304" stroke="${V2}" stroke-width="42" stroke-linecap="round"/>
      <ellipse cx="200" cy="52" rx="34" ry="40" fill="${V}"/><path d="M185 52q6 4 12 0M203 52q6 4 12 0M194 70q6 3 12 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="186" y="84" width="28" height="26" fill="${V2}"/>
      <path d="M82 122Q82 104 112 102L288 102Q318 104 318 122L308 336L92 336Z" fill="${V}"/>
      <path d="M92 336L308 336L318 414L82 414Z" fill="#3b6ea5"/><path d="M92 340L308 340" stroke="#27507d" stroke-width="5"/>
      <g stroke="${V2}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M126 126Q164 112 194 130M274 126Q236 112 206 130M200 134V252"/><path d="M122 196Q160 212 196 204M278 196Q240 212 204 204M126 226Q160 240 196 232M274 226Q240 240 204 232"/></g>
      <circle cx="152" cy="206" r="4.5" fill="${V2}"/><circle cx="248" cy="206" r="4.5" fill="${V2}"/><circle cx="200" cy="304" r="3.5" fill="${V2}"/>`;
    const zoneEl = (k) => { const z = zonesDef()[k]; return `<g class="zone" data-z="${k}"><ellipse cx="${z.cx}" cy="${z.cy}" rx="${z.rx}" ry="${z.ry}" fill="rgba(74,222,128,.14)" stroke="#4ade80" stroke-width="2.5" stroke-dasharray="6 5"/></g>`; };
    const zones = zoneKeys().filter(k => !zonesDef()[k].abs).map(zoneEl).join('');
    const backBox = infant() ? `<g><rect x="100" y="262" width="200" height="170" rx="18" fill="rgba(127,178,234,.10)" stroke="#7fb2ea" stroke-width="2"/><text x="200" y="283" text-anchor="middle" font-family="Source Sans 3,system-ui,sans-serif" font-size="11" font-weight="700" fill="#9fc4ee">${esc(T('deaBack'))}</text><ellipse cx="200" cy="352" rx="82" ry="66" fill="${V}"/></g>${zoneKeys().filter(k => zonesDef()[k].abs).map(zoneEl).join('')}` : '';
    const shirt = `<g id="shirt" role="button" tabindex="0" class="svg-btn shirt" aria-label="${esc(T('aShirt'))}">
      <path d="M62 120Q62 98 108 96L160 96Q200 124 240 96L292 96Q338 98 338 120L330 346L70 346Z" fill="${S}" stroke="${S2}" stroke-width="3"/><path d="M160 96Q200 124 240 96" fill="none" stroke="${S2}" stroke-width="4"/><path d="M200 118V346" stroke="${S2}" stroke-width="2.5" stroke-dasharray="3 7"/>
      <circle cx="200" cy="170" r="3.5" fill="${S2}"/><circle cx="200" cy="218" r="3.5" fill="${S2}"/><circle cx="200" cy="266" r="3.5" fill="${S2}"/></g>`;
    const hands = `<g id="hands" class="fx" opacity="0"><ellipse cx="196" cy="196" rx="34" ry="20" fill="#f0c9a8" stroke="#b98a64" stroke-width="3"/><ellipse cx="206" cy="188" rx="32" ry="18" fill="#f5d6ba" stroke="#b98a64" stroke-width="3"/></g>`;
    const ring = `<ellipse id="clearFx" class="fx" cx="200" cy="230" rx="176" ry="212" fill="none" stroke="#4ade80" stroke-width="5" stroke-dasharray="14 10" opacity="0"/>`;
    const inner = young() ? `translate(200 20) scale(${kid()}) translate(-200 -20)` : '';
    return `<g id="patG"><g transform="${inner}"><g class="breathe">${body}</g>${zones}${shirt}${hands}${ring}</g>${backBox}<rect id="flash" x="0" y="0" width="${PAT_W}" height="${PAT_H}" rx="20" fill="#fff" opacity="0" pointer-events="none"/></g>`;
  }

  function padSvg(p) {
    return `<g class="pad" data-id="${p.id}" role="button" tabindex="0" aria-label="${esc(T('aPad', { n: p.id }))}">
      <rect x="${-PAD_W / 2}" y="${-PAD_H / 2}" width="${PAD_W}" height="${PAD_H}" rx="11" fill="#f4f7fb" stroke="#8b99ad" stroke-width="2.5" class="padbody"/>
      <rect x="${-PAD_W / 2 + 8}" y="${-PAD_H / 2 + 8}" width="${PAD_W - 16}" height="${PAD_H - 16}" rx="6" fill="#1b3050"/>
      <path d="M3 -12l-10 14h7l-3 11 11-15h-7z" fill="#f5b82e"/><text x="${PAD_W / 2 - 5}" y="${PAD_H / 2 - 3}" text-anchor="end" font-family="Bricolage Grotesque,sans-serif" font-size="11" font-weight="700" fill="#fff">${p.id}</text></g>`;
  }

  function sceneHtml() {
    return `<svg id="deaScene" viewBox="${lay().vb}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${esc(T('deaTitle'))}" class="dea-scene">
      ${deaSvg()}${patientSvg()}${bagSvg()}<g id="wires" fill="none" stroke="#f2b84b" stroke-width="3.5" stroke-linecap="round" opacity=".95"></g>${plugSvg()}<g id="padsG">${G.pads.map(padSvg).join('')}</g></svg>`;
  }

  /* ============================== layout y pintado dinámico ============================== */
  let patOff = [0, 0];
  function applyLayout() {
    const svg = $('#deaScene'); if (!svg) return;
    const l = lay();
    svg.setAttribute('viewBox', l.vb);
    $('#deaG').setAttribute('transform', `translate(${l.dea[0]} ${l.dea[1]})`);
    $('#bagG').setAttribute('transform', `translate(${l.bag[0]} ${l.bag[1]})`);
    $('#patG').setAttribute('transform', `translate(${l.pat[0]} ${l.pat[1]})`);
    const dx = l.pat[0] - patOff[0], dy = l.pat[1] - patOff[1];
    G.pads.forEach((p, i) => { if (p.inBag) { const s = slot(i); p.x = s.x; p.y = s.y; } else { p.x += dx; p.y += dy; } });
    patOff = [l.pat[0], l.pat[1]];
  }

  function zoneHit(p) {
    const k = zoneKeys().find(z => { const s = zoneScene(z); return ((p.x - s.x) / (s.rx * 1.3)) ** 2 + ((p.y - s.y) / (s.ry * 1.3)) ** 2 <= 1; });
    return k || null;
  }
  const inTorso = (p) => { const b = torsoBox(); return p.x > b.x1 && p.x < b.x2 && p.y > b.y1 && p.y < b.y2; };
  function whyBad(p) {
    if (!inTorso(p)) return 'out';
    const b = torsoBox();
    if (p.y > b.y1 + (b.y2 - b.y1) * 0.78) return 'abd';
    return 'side';
  }
  const padsValid = () => G.pads.every(p => !p.inBag && p.ok) && G.pads[0].zone !== G.pads[1].zone;

  function paint() {
    if (!G || view !== 'sim' || !$('#deaScene')) return;
    const exam = CFG.mode === 'exam';
    const on = G.powered, ph = G.phase;
    $('#deaG').classList.toggle('powered', on);
    const led = (id, c) => { const e = $('#' + id); if (e) e.setAttribute('fill', c); };
    led('ledReady', on ? '#22c55e' : '#9aa8bb');
    const padsLit = on && G.shirt && !padsValid() && ph === 'setup';
    led('ledPads', padsLit ? '#f59e0b' : (on && padsValid() ? '#22c55e' : '#9aa8bb'));
    led('ledAna', ph === 'analyzing' ? '#38bdf8' : '#9aa8bb');
    led('ledChild', on && young() ? '#f0a6d8' : '#9aa8bb');
    /* pantalla */
    const m = G.msg;
    let line = '';
    if (!on) line = T('scr').off;
    else if (m.type === 'scr') line = T('scr')[m.key].replace('{n}', m.params && m.params.n);
    else line = T('scr')[scrKeyForSay(m.key)] || T('scr').on;
    if (ph === 'armed' && CFG.model === 'auto') line = T('scr').auto.replace('{n}', Math.max(1, Math.ceil(TIM.autoCount - G.phaseT)));
    const sm = $('#scrMsg'); if (sm) { sm.textContent = line; sm.setAttribute('fill', /NO TOQUE|NO TOUCH|TOCH|ALÉJ|ALLUNY|STAND|CANCEL|REVIS|CHECK|COMPRO/i.test(line) && ph !== 'cpr' ? '#fbbf24' : '#7be8a6'); }
    let sub = '';
    if (ph === 'analyzing') sub = Math.max(0, Math.ceil(TIM.analysis - G.phaseT)) + ' s';
    else if (ph === 'cpr') sub = mmss(Math.max(0, CFG.cprLen - G.phaseT));
    else if (ph === 'armed' && CFG.model === 'semi') sub = Math.max(0, Math.ceil(TIM.armedTimeout - G.phaseT)) + ' s';
    const ss = $('#scrSub'); if (ss) ss.textContent = sub;
    /* botón de descarga */
    const armed = ph === 'armed';
    const sb = $('#shockBtn'); if (sb) { sb.classList.toggle('armed', armed); sb.setAttribute('aria-disabled', String(!armed)); }
    /* botón de encendido y resaltes de ayuda */
    const hl = exam ? null : helpTarget();
    $('#onBtn').classList.toggle('hl', hl === 'on');
    $('#plugG').classList.toggle('hl', hl === 'plug');
    $('#shirt').classList.toggle('hl', hl === 'shirt');
    $('#shirt').classList.toggle('off', G.shirt);
    $$('.zone').forEach(z => { z.style.display = (!exam && G.shirt && hl === 'pads') ? '' : 'none'; });
    /* enchufe y cables */
    const pp = plugPos(); $('#plugG').setAttribute('transform', `translate(${pp.x} ${pp.y})`);
    let w = '';
    G.pads.forEach(p => { if (!p.inBag) w += `<path d="M${p.x.toFixed(1)} ${p.y.toFixed(1)}C${p.x.toFixed(1)} ${(p.y + 90).toFixed(1)},${pp.x.toFixed(1)} ${(pp.y + 100).toFixed(1)},${pp.x.toFixed(1)} ${pp.y.toFixed(1)}"/>`; });
    $('#wires').innerHTML = w;
    /* parches */
    const s = padScale();
    $$('#padsG .pad').forEach(el => {
      const p = G.pads[+el.dataset.id - 1];
      el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${s})`);
      el.classList.toggle('bad', !exam && !p.inBag && G.shirt && !p.ok);
      el.classList.toggle('good', !exam && !p.inBag && p.ok);
    });
    /* efectos */
    const fx = (id, v) => { const e = $(id); if (e) e.setAttribute('opacity', v); };
    fx('#hands', G.touchFx > 0 ? 1 : 0); fx('#clearFx', G.clearFx > 0 ? 0.95 : 0); fx('#flash', G.flash > 0 ? Math.min(0.9, G.flash) : 0);
    /* barra de acciones y ayuda */
    const cprBtn = $('#aCpr'); if (cprBtn) cprBtn.disabled = !(ph === 'cpr' && !G.cprStarted);
    const clr = $('#aClear'); if (clr) clr.disabled = !(ph === 'charging' || ph === 'armed' || ph === 'analyzing' || ph === 'cpr');
    const hint = $('#deaHint'); if (hint) { const k = exam ? null : hintKey(); hint.textContent = k ? T('hint')[k === 'pads' && infant() ? 'padsInfant' : k] : ''; hint.hidden = !k; }
    const c2 = $('#aClear2'); if (c2) { const need = (ph === 'charging' || ph === 'armed'); c2.hidden = !need; c2.classList.toggle('done', G.clear); c2.textContent = G.clear ? '✓ ' + T('deaClearDone') : '🙌 ' + T('deaBtnClear'); }
    const rc = $('#aRecov'); if (rc) rc.disabled = ph !== 'cpr';
    const ob = $('#deaObs'); const showObs = !!G.obs && ph === 'cpr' && G.phaseT > 3;
    if (ob) { ob.hidden = !showObs; if (showObs) ob.textContent = T(G.obs === 'alive' ? 'obsAlive' : 'obsDead'); }
    const pg = $('#patG'); if (pg) pg.classList.toggle('alive', showObs && G.obs === 'alive');
    paintCpr();
    paintCaption();
  }
  function paintCpr() {
    const box = $('#cprBox'); if (!box) return;
    const show = G.phase === 'cpr'; box.hidden = !show; if (!show) return;
    const c = G.cp, n = ratioN(), guided = CFG.mode === 'guided';
    $('#cpCount').textContent = n ? `${c.count}/${n}` : String(G.cpTot.total);
    $('#cpLbl').textContent = c.state === 'breath' ? T('cpBreathNow', { n }) : T('cpTap');
    box.classList.toggle('breath', c.state === 'breath');
    const br = $('#cpBreath'); br.hidden = !n; br.textContent = c.state === 'breath' ? T('cpBreathK', { k: Math.min(2, c.breaths + 1) }) : T('cpBreath');
    br.classList.toggle('pulse', c.state === 'breath');
    $('#cpBar').style.width = n ? Math.min(100, c.count / n * 100) + '%' : '0';
    $('#cpTech').textContent = guided ? T('tech')[CFG.age] + ' ' + T('cpKeys') : '';
    const rb = $('#cpBpm'); const iv = c.cyc.slice(-6);
    if (guided && iv.length >= 3 && c.state === 'comp') {
      const bpm = Math.round(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length)), ok = bpm >= 100 && bpm <= 120;
      rb.textContent = `${bpm}/min · ${T(ok ? 'cpGood' : bpm < 100 ? 'cpSlow' : 'cpFast')}`; rb.className = 'cpr-bpm ' + (ok ? 'ok' : 'bad');
    } else { rb.textContent = guided ? '' : T('cpTotal', { n: G.cpTot.total }); rb.className = 'cpr-bpm'; }
  }
  const scrKeyForSay = (k) => ({ on: 'on', undress: 'undress', pads: 'pads', padsChild: 'pads', padsInfant: 'pads', check: 'check', lost: 'lost', connect: 'connect', analyze: 'analyze', motion: 'motion', shockAdv: 'charging', clear: 'clear', press: 'press', auto: 'auto', shocked: 'shocked', noshock: 'noshock', cancelled: 'cancelled', cpr: 'cpr', push: 'cpr', cprend: 'cprend' }[k] || 'on');
  function paintCaption() { const c = $('#deaCaption'); if (c) c.textContent = caption(); }

  function helpTarget() {
    if (!G.powered) return 'on';
    if (G.phase !== 'setup') return null;
    if (!G.shirt) return 'shirt';
    if (!padsValid()) return 'pads';
    if (!G.plug) return 'plug';
    return null;
  }
  function hintKey() {
    if (!G.powered) return 'on';
    const ph = G.phase;
    if (ph === 'setup') return helpTarget();
    if (ph === 'analyzing') return 'wait';
    if (ph === 'charging') return 'wait';
    if (ph === 'armed') return CFG.model === 'auto' ? 'clearAuto' : 'clear';
    if (ph === 'cpr') return G.cp.state === 'breath' ? 'cprBreath' : (G.cprStarted ? 'cprOn' : 'cpr');
    return null;
  }

  /* ============================== ECG ============================== */
  /* ECG sintético: ritmo sinusal (P-QRS-T), FV, TV sin pulso, asistolia y AESP; las compresiones añaden artefacto a la señal. */
  const gau = (u, m, s) => Math.exp(-0.5 * ((u - m) / s) ** 2);
  const sinus = (t, bpm, k) => {
    const p = 60 / bpm, u = (t % p);
    return k * (0.13 * gau(u, 0.12 * p / 0.8 * 0.8, 0.045) - 0.12 * gau(u, 0.255, 0.014) + 1.0 * gau(u, 0.285, 0.016) - 0.22 * gau(u, 0.315, 0.016) + 0.30 * gau(u, 0.52, 0.075));
  };
  const rhythmNow = (tn) => {
    const base = G.sc === 'vt' ? 'vt' : (G.sc === 'asys' ? 'asys' : (G.sc === 'pea' ? 'pea' : 'vf'));
    if (G.phase === 'cpr') {
      if (G.rosc) return 'sinus';
      if (G.shockPerf && G.shockPerf > G.noshockPerf) {                        // tras una descarga: breve línea plana y después lo que corresponda
        const since = tn - G.shockPerf, nx = G.script[G.analysisN] || 'N';
        if (since < 1.8) return 'flat';
        if (nx === 'R') return since > 3 ? 'sinus' : 'flat';
        return nx === 'S' ? base : 'asys';
      }
      return base === 'vf' || base === 'vt' ? 'asys' : base;                    // RCP tras «no descarga» en un ritmo desfibrilable que degeneró
    }
    return base;
  };
  function ecgY(t) {
    if (!CFG.ecg || !G.powered || !G.plug || !padsValid() || !G.shirt) return null;
    const r = rhythmNow(t); let y;
    if (r === 'sinus') y = sinus(t, 78, 0.8);
    else if (r === 'vt') y = 0.75 * Math.sin(2 * Math.PI * 3.1 * t) + 0.25 * Math.sin(2 * Math.PI * 6.2 * t + 0.6);
    else if (r === 'vf') y = (0.5 + 0.28 * Math.sin(2 * Math.PI * 0.4 * t)) * (0.6 * Math.sin(2 * Math.PI * 4.7 * t + 1.6 * Math.sin(2 * Math.PI * 0.7 * t)) + 0.4 * Math.sin(2 * Math.PI * 7.3 * t + 2.2 * Math.sin(2 * Math.PI * 0.45 * t)) + 0.25 * Math.sin(2 * Math.PI * 3.1 * t + 1.1));
    else if (r === 'pea') y = sinus(t, 38, 0.32) * 1 + 0.015 * (Math.random() - 0.5);
    else if (r === 'asys') y = 0.04 * Math.sin(2 * Math.PI * 0.25 * t) + 0.025 * (Math.random() - 0.5);
    else y = 0.012 * (Math.random() - 0.5);
    if (G.compTs && G.compTs.length) {                                         // artefacto de compresión
      for (const tc of G.compTs) { const d = t - tc; if (d >= 0 && d < 0.5) y += 1.05 * Math.exp(-d * 7) * Math.cos(d * 22); }
    }
    return Math.max(-1.4, Math.min(1.4, y));
  }
  function ecgTick() {
    if (!G || view !== 'sim') return;
    const N = 240, y = ecgY(performance.now() / 1000);
    G.ecg.push(y === null ? null : y); if (G.ecg.length > N) G.ecg.shift();
    const el = $('#ecg'); if (!el) return;
    const x0 = 48, w = 264, mid = 146, amp = 22;
    el.setAttribute('points', G.ecg.map((v, i) => `${(x0 + i * (w / (N - 1))).toFixed(1)},${(mid - (v === null ? 0 : v * amp)).toFixed(1)}`).join(' '));
    el.setAttribute('stroke', y === null ? '#3d526f' : (G.phase === 'cpr' ? '#7fb2ea' : '#4ade80'));
    el.setAttribute('stroke-dasharray', y === null ? '4 6' : '');
  }

  /* ============================== simulación ============================== */
  function stepNeeded() {
    if (!G.shirt) return 'undress';
    if (!padsValid()) return 'pads';
    if (!G.plug) return 'connect';
    return null;
  }
  function promptStep(force) {
    if (!G.powered || G.phase !== 'setup') return;
    const s = stepNeeded();
    if (s === null) { startAnalysis(); return; }
    if (s === G.step && !force) return;
    G.step = s;
    const key = s === 'pads' ? (G.pads.every(p => !p.inBag) ? 'check' : (infant() ? 'padsInfant' : young() ? 'padsChild' : 'pads')) : s;
    speak(key, null, { cancel: true });
    screenMsg(scrKeyForSay(key));
  }

  function powerOn() {
    if (!G || G.powered || !G.running) return;
    G.powered = true; G.tOn = G.simT; G.phase = 'setup'; G.step = null; logEv('on'); Snd.beep(1000, 0.2);
    speak('on'); screenMsg('on');
    setTimeout(() => { if (G && G.running && G.phase === 'setup') promptStepAfterOn(); }, 1400);
    paint();
  }
  function promptStepAfterOn() {
    const s = stepNeeded();
    if (s === null) { startAnalysis(); return; }
    G.step = s;
    const key = s === 'pads' ? (G.pads.every(p => !p.inBag) ? 'check' : (infant() ? 'padsInfant' : young() ? 'padsChild' : 'pads')) : s;
    speak(key, null, { cancel: false }); screenMsg(scrKeyForSay(key)); paint();
  }

  function startAnalysis() {
    G.analysisN++; G.phase = 'analyzing'; G.phaseT = 0; G.clear = false; G.cprStarted = true; G.step = null; G.obs = null; G.rosc = false;
    logEv('analysis', { n: G.analysisN }); Snd.metro(false); Snd.beep(660, 0.12);
    speak('analyze'); screenMsg('analyze'); paint();
  }
  function analysisResult() {
    const out = G.script[G.analysisN - 1] || 'N';
    G.finalCycle = G.analysisN >= G.script.length;
    G.noshockPerf = out === 'S' ? (G.noshockPerf || 0) : performance.now() / 1000;
    if (out === 'S') {
      G.phase = 'charging'; G.phaseT = 0; logEv('shockAdv'); speak('shockAdv'); screenMsg('charging'); Snd.charge(TIM.charge);
    } else {
      logEv('noShock'); startCpr('noshock');
      G.obs = out === 'R' ? 'alive' : 'dead'; G.rosc = out === 'R';        // el DEA dice lo mismo en ambos casos: hay que comprobar al paciente
    }
    paint();
  }
  function armShock() {
    G.phase = 'armed'; G.phaseT = 0; G.clear = false; G.lastBeep = 0; G.lastCue = 0;
    if (CFG.model === 'auto') speak('auto'); else speak('clear');
    screenMsg('clear'); paint();
  }
  function deliverShock() {
    const clear = G.clear;
    if (clear) logEv('shock'); else { logEv('shockNoClear', null, true); addErr('noclear', T('ev').shockNoClear); }
    G.shocks++; if (G.tShock === null) G.tShock = G.simT; G.shockPerf = performance.now() / 1000;
    G.flash = 1; Snd.thump(); startCpr('shock');
  }
  function startCpr(kind) {
    G.phase = 'cpr'; G.phaseT = 0; G.cprPromptT = G.simT; G.cprStarted = false; G.clear = false; G.lastCue = 0; G.cp = newCp(); G.obs = null; G.rosc = false;
    logEv('cprPrompt');
    speak(kind === 'shock' ? 'shocked' : kind === 'cancel' ? 'cancelled' : 'noshock');
    screenMsg(kind === 'shock' ? 'shocked' : kind === 'cancel' ? 'cancelled' : 'noshock');
    Snd.metro(metroOn()); paint();
  }
  function pressShock() {
    if (!G || !G.running || CFG.model === 'auto') return;
    if (G.phase === 'armed') { deliverShock(); return; }
    Snd.error(); logEv('shockEarly'); if (CFG.mode === 'guided') toast(T('fbNoShock'));
  }
  function touch() {
    if (!G || !G.running || !G.powered) return;
    G.touchFx = 1.2; G.clear = false;
    if (G.phase === 'analyzing') {
      logEv('touchAna', null, true); addErr('touch', T('ev').touchAna); G.phaseT = 0; Snd.error(); speak('motion'); screenMsg('motion');
    } else if (G.phase === 'charging' || G.phase === 'armed') {
      logEv('touchCh', null, true); addErr('touchch', T('ev').touchCh); Snd.error();
    }
    paint();
  }
  function clearAll() {
    if (!G || !G.running || !G.powered) return;
    G.clear = true; G.clearFx = 1.4;
    if (G.phase === 'charging' || G.phase === 'armed') logEv('clear');
    paint();
  }
  const roscErr = () => { if (G.cp.roscErr) return; G.cp.roscErr = true; addErr('cprRosc', T('err').cprRosc); logEv('cprRosc', null, true); Snd.error(); };
  function startCprBtn() {
    if (!G || G.phase !== 'cpr' || G.cprStarted) return;
    G.cprStarted = true;
    if (G.rosc) { roscErr(); paint(); return; }
    const d = G.simT - G.cprPromptT; G.cprDelays.push(d);
    logEv('cprStart', { s: Math.round(d) });
    if (d > TIM.cprDelayOk) { G.events[G.events.length - 1].err = true; addErr('cprdelay', T('err').cprdelay); }
    paint();
  }

  /* ---- compresiones e insuflaciones medidas con los toques ---- */
  function closeCycle(ok) {
    const c = G.cp, n = ratioN();
    const rate = c.cyc.length >= 3 ? Math.round(60000 / (c.cyc.reduce((a, b) => a + b, 0) / c.cyc.length)) : null;
    G.cpTot.cycles.push({ c: c.count, ok, rate });
    logEv('cycle', { i: G.cpTot.cycles.length, c: c.count, r: rate === null ? '—' : rate }, !ok);
    if (!ok) { G.errs.cycle++; if (CFG.mode === 'guided') toast(T('cpCycleBad', { n }), true); }
    Object.assign(c, { count: 0, breaths: 0, state: 'comp', cyc: [], short: false, last: 0, idle: performance.now(), pauseFlag: false, nudged: false });
  }
  function compress() {
    if (!G || !G.running || G.phase !== 'cpr') return;
    G.touchFx = 0.18; Snd.beep(760, 0.04, 0.22);
    G.compTs.push(performance.now() / 1000); if (G.compTs.length > 8) G.compTs.shift();
    if (G.rosc) { G.cprStarted = true; roscErr(); paint(); return; }
    if (!G.cprStarted) startCprBtn();
    const c = G.cp, n = ratioN(), now = performance.now();
    if (c.state === 'breath') { closeCycle(false); Snd.metro(metroOn()); }
    if (c.last && c.count > 0 && now - c.last < 2000) { const iv = now - c.last; c.cyc.push(iv); G.cpTot.ivs.push(iv); }
    c.last = now; c.pauseFlag = false; c.count++; G.cpTot.total++;
    if (n && c.count === n) { c.state = 'breath'; c.bT = G.simT; c.nudged = false; Snd.metro(false); Snd.beep(1100, 0.25, 0.5); speak('breaths', { n }); }
    paint();
  }
  function breath() {
    if (!G || !G.running || G.phase !== 'cpr') return;
    const c = G.cp, n = ratioN(); if (!n) return;
    if (G.rosc) { G.cprStarted = true; return; }
    if (c.state === 'comp') {
      if (c.count === 0) { toast(T('cpFirst')); return; }
      c.short = c.count < n; c.state = 'breath'; c.breaths = 0; c.bT = G.simT; Snd.metro(false);
    }
    c.breaths++; G.cpTot.breaths++; Snd.beep(520, 0.35, 0.45);
    if (c.breaths >= 2) {
      closeCycle(!c.short && c.count === n);
      speak('resume', null, { cancel: false }); Snd.metro(metroOn());
    }
    paint();
  }
  function recovery() {
    if (!G || !G.running || G.phase !== 'cpr') return;
    if (G.rosc) { G.recovered = true; logEv('recov'); finish(); return; }
    G.errs.recovWrong++; logEv('recovWrong', null, true); Snd.error(); if (CFG.mode === 'guided') toast(T('ev').recovWrong, true);
    paint();
  }

  function tick(dt) {
    if (!G || !G.running) return;
    G.simT += dt; G.phaseT += dt; if (G.phase === 'cpr' && G.cprStarted && !G.rosc) G.cprSecs += dt;
    G.touchFx = Math.max(0, G.touchFx - dt); G.clearFx = Math.max(0, G.clearFx - dt); G.flash = Math.max(0, G.flash - dt * 1.6);
    const ph = G.phase;
    if (ph === 'setup' && G.simT - G.lastPrompt > TIM.reprompt && G.powered) promptStep(true);
    else if (ph === 'analyzing') {
      if (!(G.powered && padsValid() && G.plug && G.shirt)) { G.phase = 'setup'; G.step = null; speak('lost'); screenMsg('lost'); }
      else if (G.phaseT >= TIM.analysis) analysisResult();
    } else if (ph === 'charging') {
      if (G.phaseT >= TIM.charge) armShock();
    } else if (ph === 'armed') {
      if (CFG.model === 'auto') {
        const left = Math.ceil(TIM.autoCount - G.phaseT);
        if (left !== G.lastBeep) { G.lastBeep = left; Snd.armed(); }
        if (G.phaseT >= TIM.autoCount) deliverShock();
      } else {
        if (Math.floor(G.phaseT) !== G.lastBeep) { G.lastBeep = Math.floor(G.phaseT); Snd.armed(); }
        if (G.phaseT - G.lastCue > 9) { G.lastCue = G.phaseT; if (G.phaseT > 1) speak('press', null, { cancel: false }); }
        if (G.phaseT >= TIM.armedTimeout) { logEv('cancel', null, true); addErr('timeout', T('ev').cancel); startCpr('cancel'); }
      }
    } else if (ph === 'cpr') {
      const len = CFG.cprLen, left = len - G.phaseT;
      if (G.cprStarted && !G.rosc) {
        const c = G.cp, np = performance.now();
        if (c.state === 'comp' && !c.pauseFlag && np - Math.max(c.last, c.idle) > 10000) { c.pauseFlag = true; G.errs.pause++; logEv('pause', null, true); if (CFG.mode === 'guided') toast(T('ev').pause, true); }
        if (c.state === 'breath' && !c.nudged && G.simT - c.bT > 10) { c.nudged = true; speak('breaths', { n: ratioN() }, { cancel: false }); }
      }
      if (G.cprStarted && !G.rosc && G.lastCue < 1 && G.phaseT > len * 0.25) { G.lastCue = 1; speak('push', null, { cancel: false }); }
      else if (!G.rosc && G.lastCue < 2 && G.phaseT > len * 0.5) { G.lastCue = 2; speak('cpr', null, { cancel: false }); }
      else if (G.lastCue < 3 && left <= Math.min(10, len * 0.2)) { G.lastCue = 3; speak('cprend', null, { cancel: false }); screenMsg('cprend'); }
      if (left <= 0) {
        logEv('cprEnd');
        if (!G.cprStarted && !G.rosc) { G.errs.nocpr++; G.events[G.events.length - 1].err = true; }
        if (G.finalCycle) finish(); else startAnalysis();
      }
    }
    paint();
  }

  /* ============================== parches (arrastrar) ============================== */
  function svgPoint(ev) {
    const svg = $('#deaScene'), pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }
  const clampScene = (p) => { const vb = lay().vb.split(' ').map(Number); p.x = AppKit.clamp(p.x, 20, vb[2] - 20); p.y = AppKit.clamp(p.y, 20, vb[3] - 20); };

  function dropPad(p, quiet) {
    const i = G.pads.indexOf(p);
    const bag = lay().bag;
    if (p.y > bag[1] - 8 && p.x < bag[0] + BAG.w + 10 && p.x > bag[0] - 10) { const wasOut = !p.inBag; p.inBag = true; p.zone = null; p.ok = false; const s = slot(i); p.x = s.x; p.y = s.y; if (wasOut && !quiet) logEv('padOff', { n: p.id }); onPadsChanged(); return; }
    p.inBag = false;
    if (!G.shirt) {                                           // sin descubrir el pecho: vuelve a la bolsa
      const s = slot(i); p.inBag = true; p.x = s.x; p.y = s.y; p.zone = null; p.ok = false; toast(T('fbShirt')); if (G.powered && G.phase === 'setup') speak('undress'); paint(); return;
    }
    const z = zoneHit(p), other = G.pads.find(q => q !== p && !q.inBag);
    let why = null;
    if (!z) why = whyBad(p); else if (other && other.zone === z) why = 'same';
    p.zone = z; p.ok = !why;
    if (!why) { logEv('padOk', { n: p.id, zoneKey: 'zone' + z }); if (CFG.mode === 'guided') toast(T('fbOk', { n: p.id })); }
    else { logEv('padBad', { n: p.id, why }, true); addErr('pad', T('fbBad', { n: p.id, why: T('why')[why] })); Snd.error(); }
    onPadsChanged();
  }
  function onPadsChanged() {
    if (G.powered && G.running) {
      if (G.phase === 'analyzing' || G.phase === 'charging' || G.phase === 'armed') { if (!padsValid()) { G.phase = 'setup'; G.step = null; Snd.stop(); speak('lost'); screenMsg('lost'); } }
      else if (G.phase === 'setup') {
        const s = stepNeeded();
        if (s === null) startAnalysis();
        else if (s === 'pads' && G.pads.every(q => !q.inBag)) { G.step = 'pads'; speak('check'); screenMsg('check'); }
        else if (s !== G.step) promptStep(false);
      }
    }
    paint();
  }

  function bindScene() {
    const svg = $('#deaScene'); if (!svg) return;
    const act = (el, fn) => { el.addEventListener('click', fn); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); };
    act($('#onBtn'), () => { Snd.ensure(); R.voice.unlock(); powerOn(); });
    act($('#shockBtn'), pressShock);
    act($('#plugG'), () => {
      if (!G.running) return;
      G.plug = !G.plug; logEv(G.plug ? 'plug' : 'unplug'); Snd.beep(G.plug ? 900 : 500, 0.1);
      if (G.powered && G.phase === 'setup') { if (G.plug) { const s = stepNeeded(); if (s === null) startAnalysis(); else promptStep(true); } }
      else if (!G.plug && ['analyzing', 'charging', 'armed'].includes(G.phase)) { G.phase = 'setup'; G.step = null; Snd.stop(); speak('lost'); screenMsg('lost'); }
      paint();
    });
    act($('#shirt'), () => { if (!G.running || G.shirt) return; G.shirt = true; logEv('undress'); if (G.powered && G.phase === 'setup') promptStep(false); paint(); });
    $$('#padsG .pad').forEach(el => {
      const p = G.pads[+el.dataset.id - 1];
      let off = null;
      const mv = (e) => { if (!off) return; const q = svgPoint(e); p.x = q.x + off.dx; p.y = q.y + off.dy; clampScene(p); p.inBag = false; paint(); };
      const end = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); if (!off) return; off = null; el.classList.remove('drag'); dropPad(p); };
      el.addEventListener('pointerdown', e => {
        if (!G.running) return; e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (_) { /* sin captura: se escucha en window */ }
        const q = svgPoint(e); off = { dx: p.x - q.x, dy: p.y - q.y }; el.classList.add('drag');
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
      });
      el.addEventListener('keydown', e => {
        if (!G.running) return;
        const st = e.shiftKey ? 24 : 10, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
        if (mv) { e.preventDefault(); p.x += mv[0]; p.y += mv[1]; clampScene(p); p.inBag = false; paint(); clearTimeout(p.kt); p.kt = setTimeout(() => dropPad(p), 600); }
        else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (CFG.mode === 'guided' && G.shirt) { const k = zoneKeys().find(z => !G.pads.some(q => q !== p && q.zone === z)); const s = zoneScene(k); p.x = s.x; p.y = s.y; dropPad(p); }
          else { p.y -= 30; clampScene(p); paint(); clearTimeout(p.kt); p.kt = setTimeout(() => dropPad(p), 600); }
        }
      });
    });
  }

  /* ============================== evaluación ============================== */
  function finish() {
    if (!G) return;
    G.running = false; G.phase = 'done'; clearInterval(timer); clearInterval(ecgTimer); Snd.stop(); R.voice.cancel();
    logEv('finish');
    const e = G.errs;
    if (G.script.includes('S') && G.shocks === 0 && G.powered) e.noshock++;
    const ivs = G.cpTot.ivs; let avgRate = null, inRange = null, cv = null, eff = null;
    if (ivs.length >= 5) {
      avgRate = Math.round(60000 / (ivs.reduce((a, b) => a + b, 0) / ivs.length));
      inRange = Math.round(100 * ivs.filter(v => { const b = 60000 / v; return b >= 100 && b <= 120; }).length / ivs.length);
      if (avgRate < 100 || avgRate > 120) e.rate++;
      const m = ivs.reduce((a, b) => a + b, 0) / ivs.length; cv = Math.round(100 * Math.sqrt(ivs.reduce((a, b) => a + (b - m) ** 2, 0) / ivs.length) / m);
      if (cv > 25) e.irreg++;
    }
    if (G.cprSecs >= 15) { eff = Math.round(G.cpTot.total / G.cprSecs * 60); if (eff < 70) e.fewComp++; }
    if (G.rosc && !G.recovered) e.noRecov++;
    let pen = 5 * Math.min(e.pad, 4) + 10 * Math.min(e.touch, 3) + 20 * Math.min(e.noclear, 2) + 15 * Math.min(e.touchch, 2) + 10 * Math.min(e.cprdelay, 3) + 15 * Math.min(e.nocpr, 2) + 10 * Math.min(e.timeout, 2) + 30 * Math.min(e.noshock, 1) + 5 * Math.min(e.cycle, 4) + 10 * Math.min(e.rate, 1) + 20 * Math.min(e.cprRosc, 1) + 10 * Math.min(e.recovWrong, 2) + 5 * Math.min(e.pause, 3) + 5 * Math.min(e.irreg, 1) + 10 * Math.min(e.fewComp, 1) + 30 * Math.min(e.noRecov, 1);
    const score = G.tOn === null ? 0 : Math.max(0, 100 - pen);
    const slow = G.tShock !== null && G.tShock - G.tOn > 90;
    const avgDelay = G.cprDelays.length ? G.cprDelays.reduce((a, b) => a + b, 0) / G.cprDelays.length : null;
    evalData = { score, tOn: G.tOn, tShock: G.tShock, shockable: G.script.includes('S'), sc: G.sc, cpr: { total: G.cpTot.total, avgRate, inRange, cv, eff, cyc: G.cpTot.cycles.slice(), breaths: G.cpTot.breaths }, avgDelay, errs: Object.assign({}, e), slow, events: G.events.slice() };
    view = 'eval'; render();
  }

  /* ============================== pantallas ============================== */
  const toastEl = () => $('#deaToast');
  let toastT = 0;
  function toast(msg, bad) {
    const t = toastEl(); if (!t) return;
    t.textContent = msg; t.className = 'dea-toast show' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  const seg = (id, key, opts) => `<div class="seg" id="${id}" role="group">${opts.map(([v, lbl]) => `<button type="button" data-v="${v}" aria-pressed="${CFG[key] === v}">${esc(T(lbl))}</button>`).join('')}</div>`;
  function setupHtml() {
    return `
      <div class="dea-grid">
        <div class="panel dea-cfg">
          <h2>${esc(T('deaTitle'))}</h2>
          <p class="muted">${esc(T('deaIntro'))}</p>
          <div class="field-row"><div><b>${esc(T('deaModel'))}</b><small>${esc(T('deaModelHint'))}</small></div>${seg('cModel', 'model', [['semi', 'deaSemi'], ['auto', 'deaAuto']])}</div>
          <div class="field-row"><div><b>${esc(T('deaScenarios'))}</b><small>${esc(T('deaScHint'))}</small></div><div class="seg" id="cScen" role="group">${['vf', 'vt', 'asys', 'pea', 'rosc'].map(k => `<button type="button" data-v="${k}" aria-pressed="${CFG.scenarios.includes(k)}">${esc(T('sc')[k])}</button>`).join('')}</div></div>
          <div class="field-row"><div><b>${esc(T('deaAge'))}</b></div>${seg('cAge', 'age', [['adult', 'deaAdult'], ['child', 'deaChild'], ['infant', 'deaInfant']])}</div>
          <div class="field-row"><div><b>${esc(T('deaMode'))}</b><small>${esc(T('deaModeHint'))}</small></div>${seg('cMode', 'mode', [['guided', 'deaGuided'], ['exam', 'deaExam']])}</div>
          <div class="field-row"><div><b>${esc(T('deaCprLen'))}</b></div>${seg('cCpr', 'cprLen', [[120, 'deaCpr2'], [30, 'deaCpr30']])}</div>
          <div class="field-row"><div><b>${esc(T('deaRatio'))}</b><small>${esc(T('deaRatioHint'))}</small></div>${seg('cRatio', 'ratio', [['auto', 'deaRatioAuto'], ['30', 'deaRatio30'], ['15', 'deaRatio15'], ['comp', 'deaRatioComp']])}</div>
          <div class="field-row"><div><b>${esc(T('deaMetro'))}</b></div><label class="check"><input type="checkbox" id="cMetro" ${CFG.metro ? 'checked' : ''}><span class="sr-only">${esc(T('deaMetro'))}</span></label></div>
          <div class="field-row"><div><b>${esc(T('deaEcg'))}</b></div><label class="check"><input type="checkbox" id="cEcg" ${CFG.ecg ? 'checked' : ''}><span class="sr-only">${esc(T('deaEcg'))}</span></label></div>
          <div class="field-row"><div><b>${esc(T('deaSound'))}</b></div><label class="check"><input type="checkbox" id="cSound" ${CFG.sound ? 'checked' : ''}><span class="sr-only">${esc(T('deaSound'))}</span></label></div>
          <div class="row" style="margin-top:12px"><button type="button" class="btn big" id="deaGo">${esc(T('deaStart'))}</button></div>
          <p class="disclaimer" style="margin-top:14px">${esc(T('deaDisclaimer'))}</p>
        </div>
        <div class="panel settings voice-panel" data-voice-ctl id="deaVoice"></div>
      </div>`;
  }
  function simHtml() {
    return `
      <div class="panel dea-top">
        <div class="row spread"><p class="grow" style="margin:0"><b>${esc(T(infant() ? 'deaSceneI' : young() ? 'deaSceneC' : 'deaSceneA'))}</b> <span class="muted">${esc(T('deaSteps'))}</span></p>
          <div class="row"><span class="chip">${esc(T(CFG.model === 'semi' ? 'deaSemi' : 'deaAuto'))} · ${esc(T(CFG.mode === 'guided' ? 'deaGuided' : 'deaExam'))}</span><button type="button" class="btn ghost small" id="deaEnd">${esc(T('deaFinish'))}</button></div></div>
      </div>
      <div class="dea-stage panel">
        <div class="dea-msgbar"><div class="dea-cap" role="status" aria-live="polite"><span id="deaCaption"></span></div>
        <p class="dea-hint" id="deaHint" role="note"></p><p class="dea-obs" id="deaObs" role="status" hidden></p><p class="cpr-tech muted" id="cpTech"></p>
        <button type="button" class="btn big dea-clear2" id="aClear2" hidden>🙌 ${esc(T('deaBtnClear'))}</button></div>
        <div class="dea-svgwrap">${sceneHtml()}<div id="deaToast" class="dea-toast" role="status" aria-live="polite"></div></div>
        <div class="dea-dock">
        <div class="cpr-box" id="cprBox" hidden>
          <div class="cpr-row">
            <button type="button" class="cpr-tap" id="cpTap"><b id="cpCount">0</b><span id="cpLbl"></span></button>
            <div class="cpr-side"><div class="cpr-bpm" id="cpBpm" aria-live="off"></div><div class="cpr-bar" aria-hidden="true"><i id="cpBar"></i></div><button type="button" class="btn" id="cpBreath"></button></div>
          </div>
        </div>
        <div class="dea-actions">
          <button type="button" class="btn ghost" id="aTouch" title="${esc(T('deaBtnTouchHint'))}">✋ ${esc(T('deaBtnTouch'))}</button>
          <button type="button" class="btn" id="aClear" title="${esc(T('deaBtnClearHint'))}">🙌 ${esc(T('deaBtnClear'))}</button>
          <button type="button" class="btn ghost" id="aRecov" title="${esc(T('deaBtnRecov'))}">🛌 ${esc(T('deaBtnRecov'))}</button>
          <button type="button" class="btn ghost" id="aCpr">❤ ${esc(T('deaBtnCpr'))}</button>
        </div>
        </div>
      </div>
      <div class="panel settings voice-panel" data-voice-ctl id="deaVoice"></div>
      <p class="disclaimer">${esc(T('deaDisclaimer'))}</p>`;
  }
  function evalHtml() {
    const d = evalData, errs = Object.keys(d.errs).filter(k => d.errs[k] > 0);
    const verdict = d.score >= 90 ? 'good' : d.score >= 70 ? 'ok' : 'low';
    const cy = d.cpr.cyc, cyOk = cy.filter(x => x.ok).length;
    const cprBlock = d.cpr.total ? `<h3>${esc(T('evCprTitle'))}</h3><div class="eval-stats">
          <div class="stat"><b>${d.cpr.total}</b><span>${esc(T('evComp'))}</span></div>
          <div class="stat"><b>${d.cpr.avgRate !== null ? d.cpr.avgRate + '/min' : '—'}</b><span>${esc(T('evRate'))}</span></div>
          <div class="stat"><b>${d.cpr.inRange !== null ? d.cpr.inRange + ' %' : '—'}</b><span>${esc(T('evInRange'))}</span></div>
          <div class="stat"><b>${cy.length ? cyOk + '/' + cy.length : '—'}</b><span>${esc(T('evCycles'))}</span></div>
          <div class="stat"><b>${d.cpr.breaths}</b><span>${esc(T('evBreaths'))}</span></div>
          <div class="stat"><b>${d.cpr.eff !== null ? d.cpr.eff + '/min' : '—'}</b><span>${esc(T('evEff'))}</span></div>
          <div class="stat"><b>${d.cpr.cv !== null ? d.cpr.cv + ' %' : '—'}</b><span>${esc(T('evReg'))}</span></div></div>` : '';
    const timeShock = d.tShock !== null ? mmss(d.tShock) : (d.shockable ? T('evNoShockDone') : T('evNoShockNeeded'));
    return `
      <div class="panel eval">
        <div class="row spread"><h2 style="margin:0">${esc(T('evTitle'))}</h2><span class="chip">${esc(T(CFG.model === 'semi' ? 'deaSemi' : 'deaAuto'))} · ${esc(T(CFG.mode === 'guided' ? 'deaGuided' : 'deaExam'))}</span></div>
        <div class="eval-top">
          <div class="score ${verdict}"><b>${d.score}</b><span>/ 100</span><small>${esc(T('evScore'))}</small></div>
          <div class="grow"><p><b>${esc(T('evVerdict')[verdict])}</b></p><small class="muted">${esc(T('evScoreNote'))}</small>${d.slow ? `<p class="callout">${esc(T('evSlow'))}</p>` : ''}</div>
        </div>
        <h3>${esc(T('evTimes'))}</h3>
        <div class="eval-stats">
          <div class="stat"><b>${d.tOn !== null ? mmss(d.tOn) : '—'}</b><span>${esc(T('evOn'))}</span></div>
          <div class="stat"><b>${esc(String(timeShock))}</b><span>${esc(T('evShock'))}</span></div>
          <div class="stat"><b>${d.avgDelay !== null ? Math.round(d.avgDelay) + ' s' : '—'}</b><span>${esc(T('evCprDelay'))}</span></div>
          <div class="stat"><b style="font-size:1.05rem">${esc(T('sc')[d.sc])}</b><span>${esc(T('evRhythm'))}</span></div>
        </div>
        ${cprBlock}
        <h3>${esc(T('evErrors'))}</h3>
        ${errs.length ? `<ul class="mistakes">${errs.map(k => `<li><span aria-hidden="true">✕</span>${esc(T('err')[k])}${d.errs[k] > 1 ? ` <b>×${d.errs[k]}</b>` : ''}</li>`).join('')}</ul>` : `<p class="callout ok">${esc(T('evNoErrors'))}</p>`}
        <h3>${esc(T('evLog'))}</h3>
        <ol class="evlog">${d.events.map(e => `<li class="${e.err ? 'err' : ''}"><time>${mmss(e.t)}</time><span>${esc(evText(e))}</span></li>`).join('')}</ol>
        <div class="row" style="margin-top:14px"><button type="button" class="btn" id="deaAgain">${esc(T('deaRestart'))}</button><button type="button" class="btn ghost" id="deaCfg">${esc(T('deaToSetup'))}</button><button type="button" class="btn ghost" id="deaCopy">${esc(T('evCopy'))}</button></div>
      </div>
      <p class="disclaimer">${esc(T('deaDisclaimer'))}</p>`;
  }

  function begin() {
    Snd.ensure(); R.voice.unlock();
    G = newG(); G.running = true; view = 'sim';
    patOff = [0, 0]; logEv('start');
    render();
    clearInterval(timer); clearInterval(ecgTimer);
    let last = performance.now();
    timer = setInterval(() => { const n = performance.now(), dt = Math.min(0.25, (n - last) / 1000); last = n; tick(dt); }, 100);
    ecgTimer = setInterval(ecgTick, R.REDUCED ? 1000 : 33);
  }

  function render() {
    const root = $('#aedRoot'); if (!root) return;
    if (view === 'sim' && G && G.running === false && G.phase !== 'done') { G.running = true; }            // al volver a la pestaña se reanuda
    root.innerHTML = view === 'setup' ? setupHtml() : view === 'sim' ? simHtml() : evalHtml();
    $$('[data-voice-ctl]', root).forEach(R.voice.mount);
    if (view === 'setup') {
      const bindSeg = (id, key, num) => $$('#' + id + ' button').forEach(b => b.addEventListener('click', () => { CFG[key] = num ? +b.dataset.v : b.dataset.v; saveCfg(); render(); }));
      bindSeg('cModel', 'model'); bindSeg('cRatio', 'ratio'); $$('#cScen button').forEach(b => b.addEventListener('click', () => { const v = b.dataset.v, i = CFG.scenarios.indexOf(v); if (i >= 0) { if (CFG.scenarios.length > 1) CFG.scenarios.splice(i, 1); } else CFG.scenarios.push(v); saveCfg(); render(); })); $('#cEcg').addEventListener('change', e => { CFG.ecg = e.target.checked; saveCfg(); }); $('#cMetro').addEventListener('change', e => { CFG.metro = e.target.checked; saveCfg(); }); bindSeg('cAge', 'age'); bindSeg('cMode', 'mode'); bindSeg('cCpr', 'cprLen', true);
      $('#cSound').addEventListener('change', e => { CFG.sound = e.target.checked; saveCfg(); });
      $('#deaGo').addEventListener('click', begin);
    } else if (view === 'sim') {
      layoutWide = $('.dea-svgwrap').clientWidth >= 640;
      applyLayout(); bindScene();
      $('#aTouch').addEventListener('click', touch); $('#aClear').addEventListener('click', clearAll); $('#aClear2').addEventListener('click', clearAll); $('#aCpr').addEventListener('click', startCprBtn); $('#aRecov').addEventListener('click', recovery);
      $('#cpTap').addEventListener('pointerdown', e => { e.preventDefault(); compress(); });
      $('#cpBreath').addEventListener('pointerdown', e => { e.preventDefault(); breath(); });
      $('#deaEnd').addEventListener('click', finish);
      paint(); watch(); if (G.running && G.phase === 'cpr') Snd.metro(metroOn() && G.cp.state === 'comp');
    } else {
      $('#deaAgain').addEventListener('click', begin);
      $('#deaCfg').addEventListener('click', () => { view = 'setup'; render(); });
      $('#deaCopy').addEventListener('click', async () => {
        const txt = `${T('evTitle')} · ${T('deaTitle')}\n${T('evScore')}: ${evalData.score}/100\n` + evalData.events.map(e => `${mmss(e.t)}  ${e.err ? '[!] ' : ''}${evText(e)}`).join('\n');
        if (await R.copy(txt)) AppKit.toast(T('evCopied'));
      });
    }
  }

  /* Teclado: barra espaciadora = comprimir, B = insuflar (solo durante la RCP del simulador) */
  document.addEventListener('keydown', (e) => {
    if (view !== 'sim' || !G || !G.running || G.phase !== 'cpr' || e.repeat) return;
    const tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (tg && tg !== document.body && tg.id !== 'cpTap' && tg.id !== 'cpBreath') return;
    if (e.code === 'Space') { e.preventDefault(); compress(); } else if (e.code === 'KeyB') { e.preventDefault(); breath(); }
  });

  let ro = null;
  if (window.ResizeObserver) ro = new ResizeObserver(() => {
    if (view !== 'sim' || !G) return;
    const w = $('.dea-svgwrap'); if (!w) return;
    const wide = w.clientWidth >= 640;
    if (wide !== layoutWide) { layoutWide = wide; applyLayout(); $('#deaScene').setAttribute('viewBox', lay().vb); paint(); }
  });
  const watch = () => { if (ro) { const w = $('.dea-svgwrap'); if (w) ro.observe(w); } };

  R.tabs.aed = {
    render() { render(); watch(); },
    leave() { if (view === 'sim' && G && G.running) { G.running = false; Snd.stop(); R.voice.cancel(); } }
  };
  R.dea = { CFG, TIM, get G() { return G; }, get view() { return view; }, get evalData() { return evalData; }, begin, tick, powerOn, touch, clearAll, pressShock, startCprBtn, finish, compress, breath, recovery, ratioN, ecgY, rhythmNow, dropPad, padsValid, zoneScene, lay };      // gancho de pruebas
})();
