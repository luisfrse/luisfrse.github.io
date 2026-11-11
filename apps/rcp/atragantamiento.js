/* Pestaña «Atragantamiento»: árbol de decisión ilustrado (adulto, niño, lactante), errores frecuentes y repaso.
   Contenido basado en las guías del ERC (SVB, obstrucción de la vía aérea por cuerpo extraño). */
(() => {
  'use strict';
  const R = window.RCP, esc = AppKit.esc, $ = R.$, $$ = R.$$, T = (k, p) => AppKit.t(k, p);

  R.addI18N({
    es: {
      tabChoke: 'Atragantamiento', chTitle: 'Atragantamiento (obstrucción de la vía aérea)', chIntro: 'Sigue el árbol de decisión: responde a lo que ves y te indicará el siguiente paso.',
      chModeGuide: 'Guía', chModeQuiz: 'Repaso', chAge: 'Edad de la víctima', chAdult: 'Adulto', chChild: 'Niño (más de 1 año)', chInfant: 'Lactante (menos de 1 año)',
      chBack: 'Atrás', chRestart: 'Empezar de nuevo', chStepOf: 'Paso {n}',
      chQ: '¿Qué ves?', chQHint: 'La persona se está atragantando: no puede respirar bien tras comer o con un objeto en la boca.',
      chOptEff: 'Tose con fuerza, puede hablar, llorar o respirar', chOptEffD: 'Tos eficaz', chOptInef: 'No puede hablar ni respirar bien; tos débil o silenciosa', chOptInefD: 'Tos ineficaz', chOptUnc: 'Ha perdido el conocimiento', chOptUncD: 'No responde',
      chNode: { start: 'Inicio', effective: 'Tos eficaz', ineffective: 'Tos ineficaz', unconscious: 'Pierde el conocimiento', resolved: 'Desobstruido' },
      chEffTitle: 'Tos eficaz: anima a toser y vigila', chEffSteps: ['Anímale a seguir tosiendo; la tos es el mejor mecanismo para expulsar el objeto.', 'No le des golpes en la espalda ni compresiones mientras tosa con fuerza: podrías mover el objeto y empeorar la obstrucción.', 'Vigílalo de cerca. Si la tos se debilita, deja de oírse o no puede respirar, pasa a «tos ineficaz».'],
      chOptWorse: 'La tos se ha debilitado o no puede respirar', chOptFree: 'Ya ha expulsado el objeto y respira bien',
      chInefTitle: 'Tos ineficaz y consciente: alterna golpes y compresiones',
      chStepsA: [
        { t: 'Pide ayuda y llama al 112', d: 'Que alguien llame al 112 ya. Si estás solo, empieza las maniobras y llama en cuanto puedas (manos libres) o si pierde el conocimiento.' },
        { t: '5 golpes entre los omóplatos', d: 'Colócate a un lado y ligeramente detrás. Sostén el pecho con una mano e inclínale hacia delante para que el objeto salga por la boca y no descienda. Da hasta 5 golpes secos con el talón de la otra mano entre los omóplatos.' },
        { t: '5 compresiones abdominales', d: 'Si no sale, ponte detrás, rodéale con los brazos a la altura de la cintura, cierra un puño entre el ombligo y el esternón y agárralo con la otra mano. Tira con fuerza hacia dentro y hacia arriba, hasta 5 veces.' },
        { t: 'Alterna hasta que salga', d: 'Repite 5 golpes y 5 compresiones. Pasa a la rama de «pierde el conocimiento» si deja de responder.' }
      ],
      chNoteChild: 'En niños mayores de 1 año las maniobras son las mismas, con la fuerza ajustada a su tamaño. Ponte a su altura (arrodíllate).',
      chNotePreg: 'Embarazadas y personas muy obesas: en lugar de compresiones abdominales, haz compresiones en el centro del pecho (mitad inferior del esternón), como en la RCP, pero más secas.',
      chStepsI: [
        { t: 'Pide ayuda y llama al 112', d: 'Que alguien llame al 112 ya. Si estás solo, empieza las maniobras y llama en cuanto puedas (manos libres) o si pierde el conocimiento.' },
        { t: '5 golpes en la espalda', d: 'Siéntate y apoya el antebrazo en tu muslo. Coloca al lactante boca abajo sobre tu antebrazo, con la cabeza más baja que el tronco, sujetándole la mandíbula sin apretar el cuello. Da hasta 5 golpes secos con el talón de la mano entre los omóplatos.' },
        { t: '5 compresiones en el pecho', d: 'Si no sale, dale la vuelta (boca arriba, cabeza baja) apoyado en tu otro antebrazo. Con dos dedos en la mitad inferior del esternón, haz hasta 5 compresiones: hunde un tercio del tórax, más lentas que en la RCP. Nunca compresiones abdominales.' },
        { t: 'Alterna hasta que salga', d: 'Repite 5 golpes y 5 compresiones. Si deja de responder, pasa a «pierde el conocimiento».' }
      ],
      chMouth: 'Si ves el objeto y puedes sacarlo con facilidad, retíralo. No metas los dedos a ciegas.',
      chOptFreed: 'Se ha desobstruido', chOptFaint: 'Pierde el conocimiento',
      chUncTitle: 'Inconsciente: llama al 112 e inicia la RCP',
      chStepsU: [
        { t: 'Llama al 112', d: 'Pon el teléfono en altavoz (o que alguien llame) y pide un DEA.' },
        { t: 'Túmbale en el suelo', d: 'Boca arriba, sobre una superficie firme, con cuidado.' },
        { t: 'Empieza la RCP', d: 'Inicia las compresiones torácicas sin comprobar el pulso: 30 compresiones y 2 insuflaciones, a 100–120 por minuto. No pierdas tiempo buscando el objeto.' },
        { t: 'Mira la boca al ventilar', d: 'Cada vez que abras la vía aérea para ventilar, mira si ves el objeto y, si es fácil, retíralo.' }
      ],
      chStepsUY: [
        { t: 'Llama al 112', d: 'Pon el teléfono en altavoz (o que alguien llame) y pide un DEA.' },
        { t: 'Túmbale en el suelo', d: 'Boca arriba, sobre una superficie firme, con cuidado.' },
        { t: 'Empieza la RCP', d: 'En niños y lactantes, empieza abriendo la vía aérea y dando 5 insuflaciones; después 15 compresiones y 2 insuflaciones, a 100–120 por minuto.' },
        { t: 'Mira la boca al ventilar', d: 'Cada vez que abras la vía aérea para ventilar, mira si ves el objeto y, si es fácil, retíralo.' }
      ],
      chToCall: 'Ir al 112', chToMetro: 'Abrir el metrónomo de RCP',
      chResTitle: 'Muy bien: ya respira', chResText: 'Sigue vigilándole. Si ha necesitado compresiones abdominales o torácicas, o tose, tiene dolor o dificultad para tragar o respirar, debe valorarlo un médico: las maniobras pueden causar lesiones y puede quedar algún resto del objeto.',
      chMistakesTitle: 'Errores frecuentes',
      chMistakes: [
        { d: 'Dar golpes o compresiones mientras la tos es eficaz: puedes empeorarlo.', a: 'aci' },
        { d: 'Meter los dedos a ciegas en la boca: empuja el objeto hacia dentro.', a: 'aci' },
        { d: 'Dar agua, pan u otros alimentos para «empujar» el objeto.', a: 'aci' },
        { d: 'Dar los golpes con la persona erguida: inclínala hacia delante para que el objeto salga.', a: 'ac' },
        { d: 'Hacer compresiones abdominales en embarazadas o personas muy obesas: usa compresiones en el pecho.', a: 'a' },
        { d: 'Hacer compresiones abdominales en un lactante: nunca; solo golpes en la espalda y compresiones torácicas.', a: 'i' },
        { d: 'Sostener al lactante por los pies o sacudirlo: apóyalo sobre tu antebrazo con la cabeza baja.', a: 'i' },
        { d: 'Tardar en pedir ayuda o dejar de vigilar al principio de la maniobra; si pierde el conocimiento, empezar la RCP sin demora.', a: 'aci' }
      ],
      chSource: 'Fuente: guías del Consejo Europeo de Resucitación (ERC), soporte vital básico, obstrucción de la vía aérea por cuerpo extraño (edición 2021). Comprueba siempre la edición vigente de las guías (hay una edición 2025) antes de usar este contenido en formación. Herramienta didáctica.',
      /* repaso */
      qzTitle: 'Repaso rápido', qzIntro: '7 preguntas cortas. Elige la respuesta correcta.', qzOf: 'Pregunta {i} de {n}', qzNext: 'Siguiente', qzFinish: 'Ver resultado', qzRight: 'Correcto', qzWrong: 'No es esa', qzScore: 'Has acertado {a} de {n}', qzAgain: 'Repetir el repaso', qzStart: 'Empezar',
      qzGood: 'Muy bien: tienes clara la secuencia.', qzMid: 'Bien, repasa la guía y vuelve a intentarlo.', qzLow: 'Repasa la guía paso a paso y repite el test.',
      qz: [
        { q: 'Un adulto se atraganta pero tose con fuerza y puede hablar. ¿Qué haces?', o: ['Le doy 5 golpes en la espalda', 'Le animo a toser y le vigilo', 'Le hago compresiones abdominales'], a: 1, e: 'Mientras la tos sea eficaz, es el mejor mecanismo para expulsar el objeto. Solo se actúa si se debilita.' },
        { q: 'Una persona consciente no puede hablar ni respirar y casi no tose. ¿Qué haces primero?', o: ['Le doy agua', 'Hasta 5 golpes entre los omóplatos, inclinándola hacia delante', 'La tumbo en el suelo y le busco el pulso'], a: 1, e: 'Con tos ineficaz y consciente se empieza por hasta 5 golpes interescapulares.' },
        { q: 'Tras 5 golpes en la espalda en un adulto, el objeto no ha salido. Siguiente paso:', o: ['Hasta 5 compresiones abdominales', 'Esperar y observar', 'Meterle los dedos en la boca'], a: 0, e: 'Se alternan hasta 5 golpes y hasta 5 compresiones abdominales.' },
        { q: 'En un lactante con tos ineficaz, ¿qué NO debes hacer?', o: ['Golpes entre los omóplatos', 'Compresiones torácicas con dos dedos', 'Compresiones abdominales'], a: 2, e: 'En lactantes no se hacen compresiones abdominales por el riesgo de lesión: golpes en la espalda y compresiones torácicas.' },
        { q: 'La persona que se atraganta pierde el conocimiento. ¿Qué haces?', o: ['Sigo dando golpes en la espalda', 'Llamo al 112 e inicio la RCP', 'Le doy de beber cuando despierte'], a: 1, e: 'Se llama al 112 y se empieza la RCP; al ventilar se mira la boca por si el objeto es visible y fácil de retirar.' },
        { q: 'Una embarazada de 8 meses se atraganta con tos ineficaz. En lugar de compresiones abdominales:', o: ['Compresiones en el centro del pecho', 'Más golpes en la espalda y nada más', 'Le doy palmadas en el abdomen'], a: 0, e: 'En embarazadas y personas muy obesas se usan compresiones torácicas.' },
        { q: 'El objeto sale tras compresiones abdominales y la persona respira bien. ¿Qué recomiendas?', o: ['Nada más, ya está', 'Que la valore un médico', 'Que coma despacio y se acueste'], a: 1, e: 'Las maniobras pueden causar lesiones y puede quedar algún resto: conviene una valoración médica.' }
      ]
    },
    ca: {
      tabChoke: 'Ofegament', chTitle: 'Ofegament (obstrucció de la via aèria)', chIntro: 'Segueix l\'arbre de decisió: respon a allò que veus i t\'indicarà el pas següent.',
      chModeGuide: 'Guia', chModeQuiz: 'Repàs', chAge: 'Edat de la víctima', chAdult: 'Adult', chChild: 'Infant (més d\'1 any)', chInfant: 'Lactant (menys d\'1 any)',
      chBack: 'Enrere', chRestart: 'Torna a començar', chStepOf: 'Pas {n}',
      chQ: 'Què veus?', chQHint: 'La persona s\'està ofegant: no pot respirar bé després de menjar o amb un objecte a la boca.',
      chOptEff: 'Tus amb força, pot parlar, plorar o respirar', chOptEffD: 'Tos eficaç', chOptInef: 'No pot parlar ni respirar bé; tos feble o silenciosa', chOptInefD: 'Tos ineficaç', chOptUnc: 'Ha perdut el coneixement', chOptUncD: 'No respon',
      chNode: { start: 'Inici', effective: 'Tos eficaç', ineffective: 'Tos ineficaç', unconscious: 'Perd el coneixement', resolved: 'Desobstruït' },
      chEffTitle: 'Tos eficaç: anima a tossir i vigila', chEffSteps: ['Anima\'l a continuar tossint; la tos és el millor mecanisme per expulsar l\'objecte.', 'No li donis cops a l\'esquena ni compressions mentre tus amb força: podries moure l\'objecte i empitjorar l\'obstrucció.', 'Vigila\'l de prop. Si la tos s\'afebleix, deixa de sentir-se o no pot respirar, passa a «tos ineficaç».'],
      chOptWorse: 'La tos s\'ha afeblit o no pot respirar', chOptFree: 'Ja ha expulsat l\'objecte i respira bé',
      chInefTitle: 'Tos ineficaç i conscient: alterna cops i compressions',
      chStepsA: [
        { t: 'Demana ajuda i truca al 112', d: 'Que algú truqui al 112 ara. Si estàs sol, comença les maniobres i truca tan bon punt puguis (mans lliures) o si perd el coneixement.' },
        { t: '5 cops entre les omòplats', d: 'Col·loca\'t al costat i lleugerament darrere. Sosté-li el pit amb una mà i inclina\'l cap endavant perquè l\'objecte surti per la boca i no baixi. Dóna fins a 5 cops eixuts amb el taló de l\'altra mà entre les omòplats.' },
        { t: '5 compressions abdominals', d: 'Si no surt, posa\'t darrere, envolta\'l amb els braços a l\'alçada de la cintura, tanca un puny entre el melic i l\'estèrnum i agafa\'l amb l\'altra mà. Estira amb força cap endins i cap amunt, fins a 5 vegades.' },
        { t: 'Alterna fins que surti', d: 'Repeteix 5 cops i 5 compressions. Passa a la branca de «perd el coneixement» si deixa de respondre.' }
      ],
      chNoteChild: 'En infants de més d\'1 any les maniobres són les mateixes, amb la força ajustada a la seva mida. Posa\'t a la seva alçada (agenolla\'t).',
      chNotePreg: 'Embarassades i persones molt obeses: en lloc de compressions abdominals, fes compressions al centre del pit (meitat inferior de l\'estèrnum), com a la RCP, però més eixutes.',
      chStepsI: [
        { t: 'Demana ajuda i truca al 112', d: 'Que algú truqui al 112 ara. Si estàs sol, comença les maniobres i truca tan bon punt puguis (mans lliures) o si perd el coneixement.' },
        { t: '5 cops a l\'esquena', d: 'Seu i recolza l\'avantbraç a la cuixa. Posa el lactant de cara avall sobre l\'avantbraç, amb el cap més baix que el tronc, subjectant-li la mandíbula sense pressionar el coll. Dóna fins a 5 cops eixuts amb el taló de la mà entre les omòplats.' },
        { t: '5 compressions al pit', d: 'Si no surt, gira\'l (de cara amunt, cap baix) recolzat a l\'altre avantbraç. Amb dos dits a la meitat inferior de l\'estèrnum, fes fins a 5 compressions: enfonsa un terç del tòrax, més lentes que a la RCP. Mai compressions abdominals.' },
        { t: 'Alterna fins que surti', d: 'Repeteix 5 cops i 5 compressions. Si deixa de respondre, passa a «perd el coneixement».' }
      ],
      chMouth: 'Si veus l\'objecte i el pots treure amb facilitat, treu-lo. No posis els dits a cegues.',
      chOptFreed: 'S\'ha desobstruït', chOptFaint: 'Perd el coneixement',
      chUncTitle: 'Inconscient: truca al 112 i inicia la RCP',
      chStepsU: [
        { t: 'Truca al 112', d: 'Posa el telèfon en altaveu (o que algú truqui) i demana un DEA.' },
        { t: 'Estén-lo a terra', d: 'De cara amunt, sobre una superfície ferma, amb cura.' },
        { t: 'Comença la RCP', d: 'Inicia les compressions toràciques sense comprovar el pols: 30 compressions i 2 insuflacions, a 100–120 per minut. No perdis temps buscant l\'objecte.' },
        { t: 'Mira la boca en ventilar', d: 'Cada vegada que obris la via aèria per ventilar, mira si veus l\'objecte i, si és fàcil, treu-lo.' }
      ],
      chStepsUY: [
        { t: 'Truca al 112', d: 'Posa el telèfon en altaveu (o que algú truqui) i demana un DEA.' },
        { t: 'Estén-lo a terra', d: 'De cara amunt, sobre una superfície ferma, amb cura.' },
        { t: 'Comença la RCP', d: 'En infants i lactants, comença obrint la via aèria i donant 5 insuflacions; després 15 compressions i 2 insuflacions, a 100–120 per minut.' },
        { t: 'Mira la boca en ventilar', d: 'Cada vegada que obris la via aèria per ventilar, mira si veus l\'objecte i, si és fàcil, treu-lo.' }
      ],
      chToCall: 'Ves al 112', chToMetro: 'Obre el metrònom de RCP',
      chResTitle: 'Molt bé: ja respira', chResText: 'Continua vigilant-lo. Si ha necessitat compressions abdominals o toràciques, o tus, té dolor o dificultat per empassar o respirar, l\'ha de valorar un metge: les maniobres poden causar lesions i pot quedar alguna resta de l\'objecte.',
      chMistakesTitle: 'Errors freqüents',
      chMistakes: [
        { d: 'Donar cops o compressions mentre la tos és eficaç: pots empitjorar-ho.', a: 'aci' },
        { d: 'Posar els dits a cegues a la boca: empeny l\'objecte cap endins.', a: 'aci' },
        { d: 'Donar aigua, pa o altres aliments per «empènyer» l\'objecte.', a: 'aci' },
        { d: 'Donar els cops amb la persona dreta: inclina-la cap endavant perquè l\'objecte surti.', a: 'ac' },
        { d: 'Fer compressions abdominals en embarassades o persones molt obeses: fes servir compressions al pit.', a: 'a' },
        { d: 'Fer compressions abdominals en un lactant: mai; només cops a l\'esquena i compressions toràciques.', a: 'i' },
        { d: 'Sostenir el lactant pels peus o sacsejar-lo: recolza\'l sobre l\'avantbraç amb el cap baix.', a: 'i' },
        { d: 'Trigar a demanar ajuda o deixar de vigilar al començament de la maniobra; si perd el coneixement, començar la RCP sense demora.', a: 'aci' }
      ],
      chSource: 'Font: guies del Consell Europeu de Ressuscitació (ERC), suport vital bàsic, obstrucció de la via aèria per cos estrany (edició 2021). Comprova sempre l\'edició vigent de les guies (hi ha una edició 2025) abans d\'utilitzar aquest contingut en formació. Eina didàctica.',
      qzTitle: 'Repàs ràpid', qzIntro: '7 preguntes curtes. Tria la resposta correcta.', qzOf: 'Pregunta {i} de {n}', qzNext: 'Següent', qzFinish: 'Veure el resultat', qzRight: 'Correcte', qzWrong: 'No és aquesta', qzScore: 'Has encertat {a} de {n}', qzAgain: 'Repeteix el repàs', qzStart: 'Comença',
      qzGood: 'Molt bé: tens clara la seqüència.', qzMid: 'Bé, repassa la guia i torna-ho a provar.', qzLow: 'Repassa la guia pas a pas i repeteix el test.',
      qz: [
        { q: 'Un adult s\'ofega però tus amb força i pot parlar. Què fas?', o: ['Li dono 5 cops a l\'esquena', 'L\'animo a tossir i el vigilo', 'Li faig compressions abdominals'], a: 1, e: 'Mentre la tos sigui eficaç, és el millor mecanisme per expulsar l\'objecte. Només s\'actua si s\'afebleix.' },
        { q: 'Una persona conscient no pot parlar ni respirar i gairebé no tus. Què fas primer?', o: ['Li dono aigua', 'Fins a 5 cops entre les omòplats, inclinant-la cap endavant', 'L\'estenc a terra i li busco el pols'], a: 1, e: 'Amb tos ineficaç i conscient es comença per fins a 5 cops interescapulars.' },
        { q: 'Després de 5 cops a l\'esquena en un adult, l\'objecte no ha sortit. Pas següent:', o: ['Fins a 5 compressions abdominals', 'Esperar i observar', 'Posar-li els dits a la boca'], a: 0, e: 'S\'alternen fins a 5 cops i fins a 5 compressions abdominals.' },
        { q: 'En un lactant amb tos ineficaç, què NO has de fer?', o: ['Cops entre les omòplats', 'Compressions toràciques amb dos dits', 'Compressions abdominals'], a: 2, e: 'En lactants no es fan compressions abdominals pel risc de lesió: cops a l\'esquena i compressions toràciques.' },
        { q: 'La persona que s\'ofega perd el coneixement. Què fas?', o: ['Continuo donant cops a l\'esquena', 'Truco al 112 i inicio la RCP', 'Li dono de beure quan es desperti'], a: 1, e: 'Es truca al 112 i es comença la RCP; en ventilar es mira la boca per si l\'objecte és visible i fàcil de treure.' },
        { q: 'Una embarassada de 8 mesos s\'ofega amb tos ineficaç. En lloc de compressions abdominals:', o: ['Compressions al centre del pit', 'Més cops a l\'esquena i res més', 'Li dono cops a l\'abdomen'], a: 0, e: 'En embarassades i persones molt obeses es fan servir compressions toràciques.' },
        { q: 'L\'objecte surt després de compressions abdominals i la persona respira bé. Què recomanes?', o: ['Res més, ja està', 'Que la valori un metge', 'Que mengi a poc a poc i s\'estigui'], a: 1, e: 'Les maniobres poden causar lesions i pot quedar alguna resta: convé una valoració mèdica.' }
      ]
    },
    en: {
      tabChoke: 'Choking', chTitle: 'Choking (foreign-body airway obstruction)', chIntro: 'Follow the decision tree: answer what you see and it tells you the next step.',
      chModeGuide: 'Guide', chModeQuiz: 'Quiz', chAge: 'Age of the casualty', chAdult: 'Adult', chChild: 'Child (over 1 year)', chInfant: 'Infant (under 1 year)',
      chBack: 'Back', chRestart: 'Start again', chStepOf: 'Step {n}',
      chQ: 'What do you see?', chQHint: 'The person is choking: cannot breathe properly after eating or with an object in the mouth.',
      chOptEff: 'Coughing strongly, can speak, cry or breathe', chOptEffD: 'Effective cough', chOptInef: 'Cannot speak or breathe well; weak or silent cough', chOptInefD: 'Ineffective cough', chOptUnc: 'Has become unresponsive', chOptUncD: 'Not responding',
      chNode: { start: 'Start', effective: 'Effective cough', ineffective: 'Ineffective cough', unconscious: 'Unresponsive', resolved: 'Cleared' },
      chEffTitle: 'Effective cough: encourage coughing and watch', chEffSteps: ['Encourage them to keep coughing; coughing is the best way to expel the object.', 'Do not give back blows or thrusts while they cough strongly: you could move the object and make the obstruction worse.', 'Watch closely. If the cough weakens, goes silent or they cannot breathe, move to "ineffective cough".'],
      chOptWorse: 'The cough has weakened or they cannot breathe', chOptFree: 'The object is out and they are breathing well',
      chInefTitle: 'Ineffective cough, conscious: alternate blows and thrusts',
      chStepsA: [
        { t: 'Get help and call 112', d: 'Have someone call 112 now. If you are alone, start the manoeuvres and call as soon as you can (speaker) or if they become unresponsive.' },
        { t: '5 back blows', d: 'Stand to one side and slightly behind. Support the chest with one hand and lean them forward so the object comes out of the mouth rather than going down. Give up to 5 sharp blows with the heel of your other hand between the shoulder blades.' },
        { t: '5 abdominal thrusts', d: 'If it does not clear, stand behind them, put your arms around the waist, make a fist between the navel and the breastbone and grasp it with your other hand. Pull sharply inwards and upwards, up to 5 times.' },
        { t: 'Alternate until it clears', d: 'Repeat 5 blows and 5 thrusts. Go to the "unresponsive" branch if they stop responding.' }
      ],
      chNoteChild: 'In children over 1 year the manoeuvres are the same, with force adjusted to their size. Get down to their level (kneel).',
      chNotePreg: 'Pregnant or very obese people: instead of abdominal thrusts, give chest thrusts at the centre of the chest (lower half of the breastbone), as in CPR but sharper.',
      chStepsI: [
        { t: 'Get help and call 112', d: 'Have someone call 112 now. If you are alone, start the manoeuvres and call as soon as you can (speaker) or if they become unresponsive.' },
        { t: '5 back blows', d: 'Sit and rest your forearm on your thigh. Lay the infant face down along your forearm, head lower than the body, supporting the jaw without squeezing the neck. Give up to 5 sharp blows with the heel of your hand between the shoulder blades.' },
        { t: '5 chest thrusts', d: 'If it does not clear, turn the infant face up, head down, along your other forearm. With two fingers on the lower half of the breastbone give up to 5 thrusts: press down one third of the chest, slower than in CPR. Never abdominal thrusts.' },
        { t: 'Alternate until it clears', d: 'Repeat 5 blows and 5 thrusts. If they stop responding, go to "unresponsive".' }
      ],
      chMouth: 'If you can see the object and remove it easily, take it out. Do not sweep blindly with your fingers.',
      chOptFreed: 'It has cleared', chOptFaint: 'They become unresponsive',
      chUncTitle: 'Unresponsive: call 112 and start CPR',
      chStepsU: [
        { t: 'Call 112', d: 'Put the phone on speaker (or have someone call) and ask for an AED.' },
        { t: 'Lay them on the ground', d: 'Face up, on a firm surface, carefully.' },
        { t: 'Start CPR', d: 'Start chest compressions without checking for a pulse: 30 compressions and 2 breaths, at 100–120 per minute. Do not waste time looking for the object.' },
        { t: 'Look in the mouth when ventilating', d: 'Each time you open the airway to give breaths, look for the object and remove it if it is easy.' }
      ],
      chStepsUY: [
        { t: 'Call 112', d: 'Put the phone on speaker (or have someone call) and ask for an AED.' },
        { t: 'Lay them on the ground', d: 'Face up, on a firm surface, carefully.' },
        { t: 'Start CPR', d: 'In children and infants, start by opening the airway and giving 5 breaths; then 15 compressions and 2 breaths, at 100–120 per minute.' },
        { t: 'Look in the mouth when ventilating', d: 'Each time you open the airway to give breaths, look for the object and remove it if it is easy.' }
      ],
      chToCall: 'Go to 112', chToMetro: 'Open the CPR metronome',
      chResTitle: 'Well done: they are breathing', chResText: 'Keep watching them. If they needed abdominal or chest thrusts, or they cough, have pain or trouble swallowing or breathing, a doctor should check them: the manoeuvres can cause injuries and part of the object may remain.',
      chMistakesTitle: 'Common mistakes',
      chMistakes: [
        { d: 'Giving blows or thrusts while the cough is effective: you can make it worse.', a: 'aci' },
        { d: 'Sweeping blindly with your fingers: it pushes the object further in.', a: 'aci' },
        { d: 'Giving water, bread or food to "push" the object down.', a: 'aci' },
        { d: 'Giving back blows with the person upright: lean them forward so the object can come out.', a: 'ac' },
        { d: 'Abdominal thrusts in pregnant or very obese people: use chest thrusts.', a: 'a' },
        { d: 'Abdominal thrusts in an infant: never; only back blows and chest thrusts.', a: 'i' },
        { d: 'Holding the infant by the feet or shaking them: rest them on your forearm with the head down.', a: 'i' },
        { d: 'Being slow to get help or to keep watching early on; if they become unresponsive, start CPR without delay.', a: 'aci' }
      ],
      chSource: 'Source: European Resuscitation Council (ERC) guidelines, basic life support, foreign-body airway obstruction (2021 edition). Always check the current edition of the guidelines (a 2025 edition exists) before using this content for training. Teaching tool.',
      qzTitle: 'Quick quiz', qzIntro: '7 short questions. Choose the right answer.', qzOf: 'Question {i} of {n}', qzNext: 'Next', qzFinish: 'See result', qzRight: 'Correct', qzWrong: 'Not that one', qzScore: 'You got {a} of {n}', qzAgain: 'Repeat the quiz', qzStart: 'Start',
      qzGood: 'Well done: you know the sequence.', qzMid: 'Good, review the guide and try again.', qzLow: 'Go through the guide step by step and retake the quiz.',
      qz: [
        { q: 'An adult is choking but coughs strongly and can speak. What do you do?', o: ['Give 5 back blows', 'Encourage coughing and watch', 'Give abdominal thrusts'], a: 1, e: 'While the cough is effective it is the best way to expel the object. Act only if it weakens.' },
        { q: 'A conscious person cannot speak or breathe and barely coughs. What first?', o: ['Give water', 'Up to 5 blows between the shoulder blades, leaning them forward', 'Lay them down and feel for a pulse'], a: 1, e: 'With an ineffective cough while conscious, start with up to 5 back blows.' },
        { q: 'After 5 back blows in an adult the object has not come out. Next step:', o: ['Up to 5 abdominal thrusts', 'Wait and watch', 'Put your fingers in their mouth'], a: 0, e: 'Alternate up to 5 blows and up to 5 abdominal thrusts.' },
        { q: 'In an infant with an ineffective cough, what must you NOT do?', o: ['Blows between the shoulder blades', 'Chest thrusts with two fingers', 'Abdominal thrusts'], a: 2, e: 'Abdominal thrusts are not used in infants because of the risk of injury: back blows and chest thrusts.' },
        { q: 'The choking person becomes unresponsive. What do you do?', o: ['Keep giving back blows', 'Call 112 and start CPR', 'Give a drink when they wake'], a: 1, e: 'Call 112 and start CPR; when ventilating, look in the mouth in case the object is visible and easy to remove.' },
        { q: 'A woman 8 months pregnant is choking with an ineffective cough. Instead of abdominal thrusts:', o: ['Chest thrusts at the centre of the chest', 'More back blows and nothing else', 'Slap the abdomen'], a: 0, e: 'In pregnant and very obese people chest thrusts are used.' },
        { q: 'The object comes out after abdominal thrusts and the person breathes well. What do you advise?', o: ['Nothing more, that is all', 'A medical check-up', 'Eat slowly and lie down'], a: 1, e: 'The manoeuvres can cause injuries and part of the object may remain: a medical check is advisable.' }
      ]
    }
  });

  /* ---------- ilustraciones ---------- */
  const V = '#e2d4f7', V2 = '#c9b6ea', RS = '#7fb2ea', R2 = '#5a93d1', A = '#b08be0', Y = '#f5b82e', G = '#4ade80', INK = '#0d1a2a', DEV = '#1b3050';
  let uid = 0;
  const wrap = (inner) => { const id = 'ck' + (++uid); return `<svg class="ill" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16304f"/><stop offset="1" stop-color="#2a2a63"/></linearGradient></defs><rect width="320" height="200" rx="16" fill="url(#${id})"/><circle cx="276" cy="26" r="92" fill="${A}" opacity=".10"/>${inner}</svg>`; };
  const ln = (x1, y1, x2, y2, c, w = 12) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const ci = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const arr = (x1, y1, x2, y2, c = A, w = 3.5) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 10, p = (g) => [(x2 - h * Math.cos(a + g)).toFixed(1), (y2 - h * Math.sin(a + g)).toFixed(1)]; const [ax, ay] = p(0.5), [bx, by] = p(-0.5); return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x2} ${y2}L${ax} ${ay}L${bx} ${by}Z" fill="${c}"/>`; };
  const ground = `<path d="M14 172H306" stroke="rgba(255,255,255,.2)" stroke-width="2" stroke-linecap="round"/>`;
  const person = (hx, hy, bx1, by1, bx2, by2, legs, c1, c2) => ci(hx, hy, 18, c1) + ln(bx1, by1, bx2, by2, c2, 28) + legs.map(l => ln(l[0], l[1], l[2], l[3], c2, 12)).join('');
  const ILL = {
    help: () => `<rect x="124" y="30" width="72" height="128" rx="14" fill="${DEV}" stroke="${A}" stroke-width="3"/><rect x="132" y="46" width="56" height="84" rx="6" fill="#0b1626"/><text x="160" y="98" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="700" font-size="30" fill="${G}">112</text><circle cx="160" cy="144" r="5" fill="${A}"/><path d="M92 70q-18 22 0 44M76 58q-30 34 0 68M228 70q18 22 0 44M244 58q30 34 0 68" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".8"/>`,
    cough: () => ground + person(160, 56, 160, 78, 160, 130, [[152, 130, 150, 168], [168, 130, 170, 168]], V, V2) + ln(146, 92, 136, 80, V2, 10) + ln(136, 80, 152, 70, V2, 10) + ci(154, 69, 6, V) + `<path d="M184 46q10 6 0 12M196 40q14 12 0 24" stroke="${Y}" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="276" cy="48" r="20" fill="${G}"/><path d="M267 48l7 7 12-14" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    back: () => ground + ci(136, 92, 17, V) + ln(198, 126, 158, 96, V2, 28) + ln(198, 130, 192, 168, V2, 12) + ln(210, 130, 214, 168, V2, 12) + ln(164, 106, 152, 142, V2, 10) +
      ci(254, 52, 18, RS) + ln(252, 76, 250, 130, R2, 28) + ln(244, 130, 240, 168, R2, 12) + ln(258, 130, 262, 168, R2, 12) + `<path d="M246 90L208 86L182 98" stroke="${RS}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` + ci(178, 99, 7, RS) +
      `<path d="M168 82l-6-8M176 78l-2-10M184 82l4-9" stroke="${Y}" stroke-width="3.5" stroke-linecap="round"/>` + arr(212, 58, 188, 80, A),
    abd: () => ground + person(128, 56, 132, 78, 138, 130, [[136, 130, 124, 168], [148, 130, 152, 168]], V, V2) + person(168, 48, 172, 76, 172, 130, [[164, 130, 158, 168], [180, 130, 190, 168]], RS, R2) +
      `<path d="M160 92Q142 98 128 116" stroke="${RS}" stroke-width="9" stroke-linecap="round" fill="none"/>` + ci(124, 118, 8, Y) + arr(92, 142, 116, 124, A),
    chest: () => ground + person(128, 56, 132, 78, 138, 130, [[136, 130, 124, 168], [148, 130, 152, 168]], V, V2) + person(168, 48, 172, 76, 172, 130, [[164, 130, 158, 168], [180, 130, 190, 168]], RS, R2) +
      `<path d="M160 88Q142 90 128 96" stroke="${RS}" stroke-width="9" stroke-linecap="round" fill="none"/>` + ci(124, 96, 8, Y) + arr(92, 118, 116, 100, A),
    ibackb: () => ground + ci(40, 56, 17, RS) + ln(42, 78, 46, 130, R2, 28) + ln(46, 142, 150, 142, R2, 14) + ln(150, 142, 150, 168, R2, 12) +
      ln(60, 100, 232, 146, RS, 17) + ln(92, 88, 186, 118, V, 22) + ci(206, 132, 14, V) + ln(92, 88, 72, 78, V, 9) + ci(206, 150, 8, RS) +
      ln(196, 30, 144, 58, RS, 9) + ci(140, 60, 9, RS) + `<path d="M126 72l-8-6M138 76l-1-11M150 76l6-9" stroke="${Y}" stroke-width="3.5" stroke-linecap="round"/>` + arr(176, 22, 150, 52, A),
    ichest: () => ground + ci(40, 56, 17, RS) + ln(42, 78, 46, 130, R2, 28) + ln(46, 142, 150, 142, R2, 14) + ln(150, 142, 150, 168, R2, 12) +
      ln(60, 100, 232, 146, RS, 17) + ln(92, 88, 186, 118, V, 22) + ci(206, 132, 14, V) + ln(92, 88, 72, 78, V, 9) + ci(206, 150, 8, RS) +
      ln(190, 28, 146, 60, RS, 9) + ln(138, 66, 136, 86, RS, 5) + ln(148, 68, 146, 88, RS, 5) + arr(122, 52, 128, 78, A),
    cpr: () => ground + ln(48, 154, 250, 154, V2, 28) + ci(34, 148, 17, V) + ci(170, 44, 18, RS) + ln(170, 66, 172, 106, R2, 28) + ln(172, 108, 150, 130, R2, 16) + ln(150, 130, 150, 150, R2, 12) +
      ln(172, 92, 172, 134, RS, 11) + arr(204, 100, 204, 128, A) + `<rect x="250" y="34" width="46" height="64" rx="9" fill="${DEV}" stroke="${A}" stroke-width="3"/><text x="273" y="72" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="700" font-size="16" fill="${G}">112</text>`,
    alt: () => `<circle cx="104" cy="100" r="38" fill="${RS}"/><text x="104" y="114" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="700" font-size="40" fill="${INK}">5</text><circle cx="216" cy="100" r="38" fill="${Y}"/><text x="216" y="114" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="700" font-size="40" fill="${INK}">5</text>
      <path d="M124 54Q160 28 196 54" stroke="${A}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M196 146Q160 172 124 146" stroke="${A}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M190 44l10 12-14 2z" fill="${A}"/><path d="M130 156l-10-12 14-2z" fill="${A}"/>`
  };
  const ill = (n) => (ILL[n] ? wrap(ILL[n]()) : '');
  const STEP_ILL = { a: ['help', 'back', 'abd', 'alt'], i: ['help', 'ibackb', 'ichest', 'alt'], u: ['help', 'cpr', 'cpr', 'cpr'] };

  /* ---------- estado ---------- */
  const S = { age: 'adult', node: 'start', trail: [], mode: 'guide', qz: null };
  const young = () => S.age !== 'adult';
  const go = (n) => { S.trail.push(S.node); S.node = n; render(); window.scrollTo({ top: 0 }); };

  function stepCards(list, ills, extra) {
    return `<ol class="ck-steps">${list.map((s, i) => `
      <li class="ck-step"><div class="ck-ill">${ills[i] ? ill(ills[i]) : ''}</div>
        <div><div class="step-n">${esc(T('chStepOf', { n: i + 1 }))}</div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>${extra && extra[i] ? extra[i] : ''}</div></li>`).join('')}</ol>`;
  }
  const note = (txt, cls = '') => `<div class="callout ${cls}">${esc(txt)}</div>`;
  const opt = (to, title, sub, cls = '') => `<button type="button" class="ck-opt ${cls}" data-to="${to}"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</button>`;

  function nodeHtml() {
    const n = S.node;
    if (n === 'start') return `<h2>${esc(T('chQ'))}</h2><p class="muted">${esc(T('chQHint'))}</p><div class="ck-opts">${opt('effective', T('chOptEff'), T('chOptEffD'), 'ok')}${opt('ineffective', T('chOptInef'), T('chOptInefD'), 'warn')}${opt('unconscious', T('chOptUnc'), T('chOptUncD'), 'bad')}</div>`;
    if (n === 'effective') return `<h2>${esc(T('chEffTitle'))}</h2><ol class="plain-steps big">${T('chEffSteps').map(x => `<li>${esc(x)}</li>`).join('')}</ol><div class="ck-opts">${opt('ineffective', T('chOptWorse'), '', 'warn')}${opt('resolved', T('chOptFree'), '', 'ok')}</div>`;
    if (n === 'ineffective') {
      const inf = S.age === 'infant', list = T(inf ? 'chStepsI' : 'chStepsA'), ills = STEP_ILL[inf ? 'i' : 'a'];
      const extra = [];
      if (!inf) { extra[2] = note(T('chNotePreg'), 'info') + stepIllChest(); if (S.age === 'child') extra[1] = note(T('chNoteChild'), 'info'); }
      extra[1] = (extra[1] || '') + note(T('chMouth'));
      return `<h2>${esc(T('chInefTitle'))}</h2>${stepCards(list, ills, extra)}<div class="ck-opts">${opt('resolved', T('chOptFreed'), '', 'ok')}${opt('unconscious', T('chOptFaint'), '', 'bad')}</div>`;
    }
    if (n === 'unconscious') {
      const list = T(young() ? 'chStepsUY' : 'chStepsU');
      return `<h2>${esc(T('chUncTitle'))}</h2>${stepCards(list, STEP_ILL.u, [])}<div class="row"><button type="button" class="btn big" id="ckCall">${esc(T('chToCall'))}</button><button type="button" class="btn ghost" id="ckMetro">${esc(T('chToMetro'))}</button></div>`;
    }
    return `<h2>${esc(T('chResTitle'))}</h2><div class="callout ok">${esc(T('chResText'))}</div>`;
  }
  const stepIllChest = () => `<div class="ck-ill small">${ill('chest')}</div>`;

  function mistakesHtml() {
    const k = S.age[0], L = T('chMistakes').filter(m => m.a.includes(k));
    return `<div class="panel"><h2>${esc(T('chMistakesTitle'))}</h2><ul class="mistakes">${L.map(m => `<li><span aria-hidden="true">✕</span>${esc(m.d)}</li>`).join('')}</ul></div>`;
  }

  /* ---------- repaso ---------- */
  function quizHtml() {
    const Q = T('qz'), q = S.qz;
    if (!q) return `<div class="panel"><h2>${esc(T('qzTitle'))}</h2><p class="muted">${esc(T('qzIntro'))}</p><button type="button" class="btn big" id="qzStart">${esc(T('qzStart'))}</button></div>`;
    if (q.i >= q.order.length) {
      const pct = q.score / q.order.length;
      return `<div class="panel"><h2>${esc(T('qzTitle'))}</h2><div class="big-score">${esc(T('qzScore', { a: q.score, n: q.order.length }))}</div><p>${esc(pct >= 0.85 ? T('qzGood') : pct >= 0.55 ? T('qzMid') : T('qzLow'))}</p><button type="button" class="btn" id="qzStart">${esc(T('qzAgain'))}</button></div>`;
    }
    const item = Q[q.order[q.i]], done = q.pick !== null;
    return `<div class="panel"><div class="row spread"><h2 style="margin:0">${esc(T('qzTitle'))}</h2><span class="chip">${esc(T('qzOf', { i: q.i + 1, n: q.order.length }))}</span></div>
      <div class="progress" style="margin:12px 0"><i style="width:${(q.i / q.order.length * 100).toFixed(0)}%"></i></div>
      <p class="qz-q">${esc(item.q)}</p>
      <div class="ck-opts">${item.o.map((o, i) => `<button type="button" class="ck-opt ${done ? (i === item.a ? 'ok' : i === q.pick ? 'bad' : 'dim') : ''}" data-i="${i}" ${done ? 'disabled' : ''}><b>${esc(o)}</b></button>`).join('')}</div>
      <div role="status" aria-live="polite">${done ? `<div class="callout ${q.pick === item.a ? 'ok' : 'warn'}"><b>${esc(q.pick === item.a ? T('qzRight') : T('qzWrong'))}.</b> ${esc(item.e)}</div><button type="button" class="btn" id="qzNext">${esc(q.i + 1 >= q.order.length ? T('qzFinish') : T('qzNext'))}</button>` : ''}</div></div>`;
  }

  function render() {
    const root = $('#chokeRoot'); if (!root) return;
    const crumbs = [...S.trail, S.node].map(n => T('chNode')[n]);
    root.innerHTML = `
      <div class="panel">
        <div class="guide-bar"><div><h2 style="margin:0">${esc(T('chTitle'))}</h2><small class="muted">${esc(T('chIntro'))}</small></div>
          <div class="seg" id="ckMode" role="group"><button type="button" data-m="guide" aria-pressed="${S.mode === 'guide'}">${esc(T('chModeGuide'))}</button><button type="button" data-m="quiz" aria-pressed="${S.mode === 'quiz'}">${esc(T('chModeQuiz'))}</button></div></div>
        <div class="seg ck-age" id="ckAge" role="group" aria-label="${esc(T('chAge'))}">${['adult', 'child', 'infant'].map(a => `<button type="button" data-a="${a}" aria-pressed="${S.age === a}">${esc(T({ adult: 'chAdult', child: 'chChild', infant: 'chInfant' }[a]))}</button>`).join('')}</div>
      </div>
      ${S.mode === 'quiz' ? quizHtml() : `
      <div class="panel ck-main">
        <div class="ck-trail" aria-label="${esc(T('chNode').start)}">${crumbs.map((c, i) => `<span class="${i === crumbs.length - 1 ? 'cur' : ''}">${esc(c)}</span>`).join('<i aria-hidden="true">›</i>')}</div>
        ${nodeHtml()}
        <div class="row ck-nav"><button type="button" class="btn ghost small" id="ckBack" ${S.trail.length ? '' : 'disabled'}>← ${esc(T('chBack'))}</button><button type="button" class="btn ghost small" id="ckRestart">${esc(T('chRestart'))}</button></div>
      </div>
      ${mistakesHtml()}`}
      <p class="disclaimer">${esc(T('chSource'))}</p>`;
    $$('#ckMode button').forEach(b => b.addEventListener('click', () => { S.mode = b.dataset.m; render(); }));
    $$('#ckAge button').forEach(b => b.addEventListener('click', () => { S.age = b.dataset.a; render(); }));
    $$('.ck-main [data-to]').forEach(b => b.addEventListener('click', () => go(b.dataset.to)));
    const bk = $('#ckBack'); if (bk) bk.addEventListener('click', () => { S.node = S.trail.pop() || 'start'; render(); });
    const rs = $('#ckRestart'); if (rs) rs.addEventListener('click', () => { S.node = 'start'; S.trail = []; render(); });
    const c = $('#ckCall'); if (c) c.addEventListener('click', () => R.go('call'));
    const m = $('#ckMetro'); if (m) m.addEventListener('click', () => R.go('metro', { age: S.age }));
    const st = $('#qzStart'); if (st) st.addEventListener('click', () => { S.qz = { order: AppKit.shuffle(T('qz').map((_, i) => i)), i: 0, score: 0, pick: null }; render(); });
    $$('.ck-opts [data-i]').forEach(b => b.addEventListener('click', () => { const q = S.qz, it = T('qz')[q.order[q.i]]; q.pick = +b.dataset.i; if (q.pick === it.a) q.score++; render(); const nx = $('#qzNext'); if (nx) nx.focus(); }));
    const nx = $('#qzNext'); if (nx) nx.addEventListener('click', () => { S.qz.i++; S.qz.pick = null; render(); });
  }

  R.tabs.choke = { render, leave() { /* nada */ } };
})();
