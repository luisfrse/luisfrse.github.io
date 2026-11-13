'use strict';
/* Dades del simulador de forn Pasteur / estufa Poupinel: catàleg de materials i envasos, comprovacions,
   opcions de decisió, escenaris (preparació i diagnòstic) i textos explicatius en català i castellà ([ca, es]).
   Paràmetres basats en el temari de C6 (unitat 7, apartat 7.2 i 5) ; el protocol del centre és fictici i orientatiu. */
(function (root) {
  const D = {};
  D.slug = 'sim-forn-pasteur';

  D.meta = {
    title: ['Simulador: forn Pasteur (calor seca)', 'Simulador: horno Pasteur (calor seco)'],
    lead: [
      'Prepara la càrrega, programa el forn Poupinel, vigila el cicle i revisa els controls físics, químics i biològics abans de decidir què fas amb el lot.',
      'Prepara la carga, programa el horno Poupinel, vigila el ciclo y revisa los controles físicos, químicos y biológicos antes de decidir qué haces con el lote.'
    ],
    src: [
      'Fonts: temari C6 (CAI), unitat 7 «L\'esterilització del material» (7.2 calor seca; 5 controls). Binomis del temari: 180 °C 30 min, 170 °C 60 min, 160 °C 120 min. Indicadors químics: ISO 11140-1; biològics: ISO 11138-4 (B. atrophaeus per a calor seca). Model tèrmic, temperatures d\'obertura i protocol del centre: orientatius.',
      'Fuentes: temario C6 (CAI), unidad 7 «La esterilización del material» (7.2 calor seco; 5 controles). Binomios del temario: 180 °C 30 min, 170 °C 60 min, 160 °C 120 min. Indicadores químicos: ISO 11140-1; biológicos: ISO 11138-4 (B. atrophaeus para calor seco). Modelo térmico, temperaturas de apertura y protocolo del centro: orientativos.'
    ]
  };

  /* Protocol (fictici i orientatiu) del centre: binomi segons el material. El més restrictiu mana en càrregues mixtes. */
  D.protocol = [
    { prog: 'p180', t: ['Vidre i metall no articulat: 180 °C · 30 min', 'Vidrio y metal no articulado: 180 °C · 30 min'] },
    { prog: 'p170', t: ['Instrumental articulat o de tall (menys desgast): 170 °C · 60 min', 'Instrumental articulado o de corte (menos desgaste): 170 °C · 60 min'] },
    { prog: 'p160', t: ['Olis, vaselina i pols (capa fina, poca quantitat): 160 °C · 120 min', 'Aceites, vaselina y polvos (capa fina, poca cantidad): 160 °C · 120 min'] },
    { prog: null, t: ['Càrrega mixta: el programa del material més delicat (160 > 170 > 180).', 'Carga mixta: el programa del material más delicado (160 > 170 > 180).'] }
  ];

  const N = (ca, es) => [ca, es];
  D.catalog = {
    mats: {
      /* --- aptes --- */
      tisores: { id: 'tisores', name: N('Tisores quirúrgiques (Mayo)', 'Tijeras quirúrgicas (Mayo)'), icon: 'scissors', kind: 'metal', suit: 'ok', artic: true, sharp: true, kf: 0.85, mass: 0.4, vol: 1, packs: ['foil', 'metalbox'], prot: 'p170' },
      kocher: { id: 'kocher', name: N('Pinces de Kocher', 'Pinzas de Kocher'), icon: 'forceps', kind: 'metal', suit: 'ok', artic: true, kf: 0.85, mass: 0.4, vol: 1, packs: ['foil', 'metalbox'], prot: 'p170' },
      portaagulles: { id: 'portaagulles', name: N('Portaagulles', 'Portaagujas'), icon: 'forceps', kind: 'metal', suit: 'ok', artic: true, kf: 0.85, mass: 0.4, vol: 1, packs: ['foil', 'metalbox'], prot: 'p170' },
      mangbisturi: { id: 'mangbisturi', name: N('Mànec de bisturí reutilitzable', 'Mango de bisturí reutilizable'), icon: 'scalpel', kind: 'metal', suit: 'ok', kf: 0.8, mass: 0.3, vol: 1, packs: ['foil', 'metalbox'], prot: 'p180' },
      caixacures: { id: 'caixacures', name: N('Caixa d\'instrumental de cures (diverses peces)', 'Caja de instrumental de curas (varias piezas)'), icon: 'box', kind: 'metal', suit: 'ok', artic: true, kf: 1.0, mass: 2, vol: 2, packs: ['metalbox'], prot: 'p170' },
      cubeta: { id: 'cubeta', name: N('Cubeta d\'acer inoxidable', 'Cubeta de acero inoxidable'), icon: 'tray', kind: 'metal', suit: 'ok', kf: 0.85, mass: 1, vol: 2, packs: ['foil', 'metalbox'], prot: 'p180' },
      xeringavidre: { id: 'xeringavidre', name: N('Xeringa de vidre reutilitzable (desmuntada)', 'Jeringa de vidrio reutilizable (desmontada)'), icon: 'syringe', kind: 'glass', suit: 'ok', kf: 0.9, mass: 0.4, vol: 1, packs: ['foil', 'metalbox'], prot: 'p180' },
      pipetes: { id: 'pipetes', name: N('Pipetes de vidre', 'Pipetas de vidrio'), icon: 'pipette', kind: 'glass', suit: 'ok', kf: 0.9, mass: 0.6, vol: 1, packs: ['metaltube', 'foil'], prot: 'p180' },
      petri: { id: 'petri', name: N('Plaques de Petri de vidre', 'Placas de Petri de vidrio'), icon: 'petri', kind: 'glass', suit: 'ok', kf: 0.95, mass: 0.8, vol: 1, packs: ['metaltube', 'foil'], prot: 'p180' },
      tubs: { id: 'tubs', name: N('Tubs d\'assaig de vidre', 'Tubos de ensayo de vidrio'), icon: 'tube', kind: 'glass', suit: 'ok', kf: 0.9, mass: 0.6, vol: 1, packs: ['foil', 'metaltube'], prot: 'p180' },
      flasco: { id: 'flasco', name: N('Flascó de vidre buit', 'Frasco de vidrio vacío'), icon: 'jar', kind: 'glass', suit: 'ok', kf: 0.95, mass: 0.7, vol: 1, packs: ['foil'], prot: 'p180' },
      vaselina: { id: 'vaselina', name: N('Vaselina (petrolat)', 'Vaselina (petrolato)'), icon: 'ointment', kind: 'oil', suit: 'ok', kf: 1.3, mass: 0.6, vol: 1, packs: ['jar'], prot: 'p160' },
      oliparafina: { id: 'oliparafina', name: N('Oli de parafina', 'Aceite de parafina'), icon: 'oil', kind: 'oil', suit: 'ok', kf: 1.3, mass: 0.6, vol: 1, packs: ['jar'], prot: 'p160' },
      talc: { id: 'talc', name: N('Talc (pols)', 'Talco (polvo)'), icon: 'powder', kind: 'powder', suit: 'ok', kf: 1.4, mass: 0.5, vol: 1, packs: ['jar'], prot: 'p160' },
      /* --- no aptes per a calor seca --- */
      gases: { id: 'gases', name: N('Gases de cotó', 'Gasas de algodón'), icon: 'gauze', kind: 'textile', suit: 'no', reject: ['steam'], kf: 1, mass: 0.3, vol: 1,
        why: N('Els tèxtils es torren i es poden carbonitzar: el calor sec no és apte. Van a l\'autoclau de vapor.', 'Los textiles se tuestan y pueden carbonizarse: el calor seco no es apto. Van al autoclave de vapor.') },
      talla: { id: 'talla', name: N('Pany / talla de roba', 'Paño / talla de tela'), icon: 'cloth', kind: 'textile', suit: 'no', reject: ['steam'], kf: 1, mass: 0.5, vol: 1,
        why: N('La roba s\'ennegreix i perd la funció de barrera; amb temperatura alta hi ha risc d\'incendi. Autoclau.', 'La tela se ennegrece y pierde la función de barrera; con temperatura alta hay riesgo de incendio. Autoclave.') },
      tubgoma: { id: 'tubgoma', name: N('Tub de goma reutilitzable', 'Tubo de goma reutilizable'), icon: 'hose', kind: 'rubber', suit: 'no', reject: ['steam', 'lowtemp'], kf: 1, mass: 0.3, vol: 1,
        why: N('La goma s\'endureix, s\'esquerda o es deforma a aquestes temperatures. Autoclau a 121 °C o baixa temperatura, segons fabricant.', 'La goma se endurece, se agrieta o se deforma a estas temperaturas. Autoclave a 121 °C o baja temperatura, según fabricante.') },
      ronyonera: { id: 'ronyonera', name: N('Ronyonera de plàstic', 'Riñonera de plástico'), icon: 'kidney', kind: 'plastic', suit: 'no', reject: ['steam', 'lowtemp'], kf: 1, mass: 0.3, vol: 1,
        why: N('El plàstic es fon. Si el fabricant diu que és autoclavable, autoclau; si és termolàbil, baixa temperatura.', 'El plástico se funde. Si el fabricante dice que es autoclavable, autoclave; si es termolábil, baja temperatura.') },
      xeringaus: { id: 'xeringaus', name: N('Xeringa de plàstic d\'un sol ús', 'Jeringa de plástico de un solo uso'), icon: 'syringe', kind: 'single', suit: 'single', reject: ['discard'], kf: 1, mass: 0.1, vol: 1,
        why: N('És d\'un sol ús: no es reprocessa ni es reesterilitza (i, a més, es fondria).', 'Es de un solo uso: no se reprocesa ni se reesteriliza (y, además, se fundiría).') },
      guants: { id: 'guants', name: N('Guants de làtex', 'Guantes de látex'), icon: 'glove', kind: 'rubber', suit: 'single', reject: ['discard'], kf: 1, mass: 0.1, vol: 1,
        why: N('Material d\'un sol ús i termolàbil: no es reprocessa.', 'Material de un solo uso y termolábil: no se reprocesa.') },
      alcohol: { id: 'alcohol', name: N('Flascó d\'alcohol de 70°', 'Frasco de alcohol de 70°'), icon: 'flame', kind: 'flam', suit: 'flam', reject: ['remove'], kf: 1, mass: 0.6, vol: 1,
        why: N('Producte inflamable: els vapors poden encendre\'s o explotar dins del forn. Mai s\'hi introdueix.', 'Producto inflamable: los vapores pueden encenderse o explotar dentro del horno. Nunca se introduce.') },
      aigua: { id: 'aigua', name: N('Flascó d\'aigua destil·lada (líquid aquós)', 'Frasco de agua destilada (líquido acuoso)'), icon: 'drop', kind: 'liquid', suit: 'no', reject: ['steam'], kf: 1, mass: 1, vol: 1,
        why: N('Els líquids aquosos bullen i el recipient pot rebentar. Es tracten a l\'autoclau amb el programa de líquids.', 'Los líquidos acuosos hierven y el recipiente puede reventar. Se tratan en el autoclave con el programa de líquidos.') },
      fibro: { id: 'fibro', name: N('Fibroscopi flexible (òptica)', 'Fibroscopio flexible (óptica)'), icon: 'scope', kind: 'optic', suit: 'no', reject: ['lowtemp'], kf: 1, mass: 0.5, vol: 2,
        why: N('Material termosensible i delicat: no resisteix la calor. Desinfecció d\'alt nivell o esterilització a baixa temperatura.', 'Material termosensible y delicado: no resiste el calor. Desinfección de alto nivel o esterilización a baja temperatura.') },
      /* --- elements de control (no ocupen volum) --- */
      pcd: { id: 'pcd', name: N('Paquet de control (PCD) amb integrador químic per a calor seca', 'Paquete de control (PCD) con integrador químico para calor seco'), icon: 'pcd', ctrl: 'pcd', kf: 1.1, mass: 0.1, vol: 0 },
      bi: { id: 'bi', name: N('Indicador biològic: espores de Bacillus atrophaeus', 'Indicador biológico: esporas de Bacillus atrophaeus'), icon: 'bi', ctrl: 'bi', kf: 1.1, mass: 0, vol: 0 },
      biWrong: { id: 'biWrong', name: N('Indicador biològic: espores de Geobacillus stearothermophilus', 'Indicador biológico: esporas de Geobacillus stearothermophilus'), icon: 'bi', ctrl: 'biWrong', kf: 1.1, mass: 0, vol: 0 },
      biCtrl: { id: 'biCtrl', name: N('Indicador biològic de control (mateix lot, sense processar)', 'Indicador biológico de control (mismo lote, sin procesar)'), icon: 'bi', ctrl: 'biCtrl', kf: 1, mass: 0, vol: 0 }
    },
    packs: {
      metalbox: { id: 'metalbox', name: N('Caixa metàl·lica tancada', 'Caja metálica cerrada'), ok: true },
      foil: { id: 'foil', name: N('Paper d\'alumini', 'Papel de aluminio'), ok: true },
      metaltube: { id: 'metaltube', name: N('Pot / portapipetes metàl·lic', 'Bote / portapipetas metálico'), ok: true },
      jar: { id: 'jar', name: N('Recipient petit de vidre o metall tapat amb alumini', 'Recipiente pequeño de vidrio o metal tapado con aluminio'), ok: true },
      paperfilm: { id: 'paperfilm', name: N('Bossa mixta paper-plàstic', 'Bolsa mixta papel-plástico'), mixed: true, melt: true, burn: true },
      crepe: { id: 'crepe', name: N('Paper crepat', 'Papel crepado'), burn: true },
      cloth: { id: 'cloth', name: N('Roba de cotó', 'Tela de algodón'), burn: true },
      plasticbox: { id: 'plasticbox', name: N('Contenidor de plàstic', 'Contenedor de plástico'), melt: true },
      steamcont: { id: 'steamcont', name: N('Contenidor rígid amb filtre (d\'autoclau)', 'Contenedor rígido con filtro (de autoclave)'), notValid: true },
      none: { id: 'none', name: N('Sense envàs', 'Sin envase') }
    },
    packOrder: ['metalbox', 'foil', 'metaltube', 'jar', 'paperfilm', 'crepe', 'cloth', 'plasticbox', 'steamcont', 'none'],
    reasons: {
      wash: N('Tornar a la zona de rentat / assecat', 'Devolver a la zona de lavado / secado'),
      steam: N('Derivar a l\'autoclau de vapor', 'Derivar al autoclave de vapor'),
      lowtemp: N('Derivar a esterilització a baixa temperatura (plasma, òxid d\'etilè)', 'Derivar a esterilización a baja temperatura (plasma, óxido de etileno)'),
      discard: N('Rebutjar: és d\'un sol ús, no es reprocessa', 'Desechar: es de un solo uso, no se reprocesa'),
      remove: N('Retirar: producte inflamable, no va al forn', 'Retirar: producto inflamable, no va al horno'),
      later: N('Deixar-lo per al cicle següent', 'Dejarlo para el ciclo siguiente')
    },
    reasonOrder: ['wash', 'steam', 'lowtemp', 'discard', 'remove', 'later'],
    ciTypes: {
      dry: N('Específic per a calor seca', 'Específico para calor seco'),
      steam: N('De vapor (autoclau)', 'De vapor (autoclave)'),
      none: N('Cap', 'Ninguno')
    },
    conds: {
      ok: N('Net i sec', 'Limpio y seco'),
      wet: N('Encara humit', 'Todavía húmedo'),
      dirty: N('Amb restes de matèria orgànica', 'Con restos de materia orgánica')
    },
    shelves: [N('Reixeta superior', 'Rejilla superior'), N('Reixeta central', 'Rejilla central'), N('Reixeta inferior', 'Rejilla inferior'), N('Base de la cambra', 'Base de la cámara')],
    preChecks: [
      { id: 'clean', ok: true, t: N('Comprovar que tot el material és net i ben sec', 'Comprobar que todo el material está limpio y bien seco') },
      { id: 'chamber', ok: true, t: N('Cambra neta, reixetes al seu lloc i buida del cicle anterior', 'Cámara limpia, rejillas en su sitio y vacía del ciclo anterior') },
      { id: 'water', ok: false, t: N('Comprovar el nivell d\'aigua desmineralitzada', 'Comprobar el nivel de agua desmineralizada') },
      { id: 'vents', ok: true, t: N('Sortides d\'aire i ventilador lliures (no tapar les reixetes)', 'Salidas de aire y ventilador libres (no tapar las rejillas)') },
      { id: 'bowie', ok: false, t: N('Fer el test de Bowie-Dick de l\'inici de la jornada', 'Hacer el test de Bowie-Dick del inicio de la jornada') },
      { id: 'door', ok: true, t: N('Porta i junta en bon estat; tanca bé', 'Puerta y junta en buen estado; cierra bien') },
      { id: 'register', ok: true, t: N('Obrir el registre del cicle: data, núm. de cicle/lot, operador i contingut', 'Abrir el registro del ciclo: fecha, n.º de ciclo/lote, operador y contenido') },
      { id: 'vacuum', ok: false, t: N('Fer la prova de buit (estanquitat de la cambra)', 'Hacer la prueba de vacío (estanqueidad de la cámara)') },
      { id: 'flam', ok: true, t: N('Cap producte inflamable a dins ni a prop del forn', 'Ningún producto inflamable dentro ni cerca del horno') }
    ],
    postChecks: [
      { id: 'coolInside', ok: true, t: N('Deixar refredar dins el forn, amb la porta tancada, fins a la temperatura segura', 'Dejar enfriar dentro del horno, con la puerta cerrada, hasta la temperatura segura') },
      { id: 'coldWater', ok: false, t: N('Refredar el vidre amb aigua freda per guanyar temps', 'Enfriar el vidrio con agua fría para ganar tiempo') },
      { id: 'dryGloves', ok: true, t: N('Manipular amb guants tèrmics secs (mai amb mans o guants humits)', 'Manipular con guantes térmicos secos (nunca con manos o guantes húmedos)') },
      { id: 'surface', ok: true, t: N('Deixar el vidre calent sobre una superfície seca i aïllant, no freda ni mullada', 'Dejar el vidrio caliente sobre una superficie seca y aislante, no fría ni mojada') },
      { id: 'openPack', ok: false, t: N('Obrir un paquet per comprovar l\'interior abans de desar-lo', 'Abrir un paquete para comprobar el interior antes de guardarlo') },
      { id: 'inspect', ok: true, t: N('Revisar la integritat dels envasos, el viratge dels indicadors i les etiquetes', 'Revisar la integridad de los envases, el viraje de los indicadores y las etiquetas') },
      { id: 'storeHot', ok: false, t: N('Desar els paquets encara calents a l\'armari tancat', 'Guardar los paquetes todavía calientes en el armario cerrado') }
    ],
    epi: {
      thermal: N('Guants tèrmics (resistents a la calor)', 'Guantes térmicos (resistentes al calor)'),
      nitrile: N('Guants de nitril', 'Guantes de nitrilo'),
      wet: N('Un drap humit', 'Un paño húmedo'),
      none: N('Sense protecció', 'Sin protección')
    },
    epiOrder: ['nitrile', 'thermal', 'wet', 'none'],
    decisions: {
      release: N('Alliberar el lot: a l\'emmagatzematge estèril (armari tancat, 18–22 °C, 35–50 % HR, FIFO)', 'Liberar el lote: al almacenamiento estéril (armario cerrado, 18–22 °C, 35–50 % HR, FIFO)'),
      partial: N('Alliberar només els paquets conformes i reprocessar els no conformes', 'Liberar solo los paquetes conformes y reprocesar los no conformes'),
      retain: N('Retenir la càrrega (quarantena) mentre s\'aclareix', 'Retener la carga (cuarentena) mientras se aclara'),
      reprocess: N('Reprocessar: tornar a envasar i esterilitzar la càrrega afectada', 'Reprocesar: volver a envasar y esterilizar la carga afectada'),
      recall: N('Retirar (recuperar) tots els lots processats des de l\'últim biològic negatiu', 'Retirar (recuperar) todos los lotes procesados desde el último biológico negativo'),
      outService: N('Deixar el forn fora de servei', 'Dejar el horno fuera de servicio'),
      notify: N('Avisar la supervisió i el servei de manteniment', 'Avisar a la supervisión y al servicio de mantenimiento'),
      repeatBI: N('Repetir el control biològic (revisar la incubadora i el lot d\'indicadors)', 'Repetir el control biológico (revisar la incubadora y el lote de indicadores)'),
      discardItems: N('Retirar el material danyat (fos, cremat, trencat) i comunicar-ho', 'Retirar el material dañado (fundido, quemado, roto) y comunicarlo'),
      fixRecord: N('Completar el registre que falta (signatura, lot) abans d\'alliberar', 'Completar el registro que falta (firma, lote) antes de liberar'),
      register: N('Registrar el cicle, els controls i la decisió (traçabilitat)', 'Registrar el ciclo, los controles y la decisión (trazabilidad)')
    },
    decisionOrder: ['release', 'partial', 'retain', 'reprocess', 'recall', 'outService', 'notify', 'repeatBI', 'discardItems', 'fixRecord', 'register'],
    causes: {
      k_none: N('Cap: el cicle és correcte', 'Ninguna: el ciclo es correcto'),
      k_tempLow: N('No s\'ha assolit la temperatura (avaria o consigna baixa)', 'No se ha alcanzado la temperatura (avería o consigna baja)'),
      k_timeShort: N('Temps d\'exposició insuficient', 'Tiempo de exposición insuficiente'),
      k_interrupt: N('Interrupció del cicle (porta oberta, tall de corrent) sense tornar a comptar', 'Interrupción del ciclo (puerta abierta, corte de corriente) sin volver a contar'),
      k_chamberCount: N('El temps s\'ha comptat des que la cambra era a temperatura, no tota la càrrega', 'El tiempo se ha contado desde que la cámara estaba a temperatura, no toda la carga'),
      k_aborted: N('Cicle aturat abans d\'acabar', 'Ciclo detenido antes de terminar'),
      k_calib: N('Avaria de l\'equip (termòstat descalibrat o resistència)', 'Avería del equipo (termostato descalibrado o resistencia)'),
      k_pack: N('Envàs no apte per a calor seca', 'Envase no apto para calor seco'),
      k_indicator: N('Indicador químic inadequat per al mètode', 'Indicador químico inadecuado para el método'),
      k_overload: N('Càrrega excessiva o massa densa (mala circulació de l\'aire)', 'Carga excesiva o demasiado densa (mala circulación del aire)'),
      k_bi: N('Fallada detectada pel biològic: cal investigar la causa', 'Fallo detectado por el biológico: hay que investigar la causa'),
      k_biInvalid: N('Prova biològica no vàlida (el control no ha crescut)', 'Prueba biológica no válida (el control no ha crecido)'),
      k_record: N('Registre o identificació incomplets (traçabilitat)', 'Registro o identificación incompletos (trazabilidad)')
    },
    physCauses: ['k_none', 'k_tempLow', 'k_timeShort', 'k_interrupt', 'k_chamberCount', 'k_aborted'],
    diagCauses: ['k_none', 'k_tempLow', 'k_timeShort', 'k_interrupt', 'k_chamberCount', 'k_calib', 'k_pack', 'k_indicator', 'k_overload', 'k_bi', 'k_biInvalid', 'k_record'],
    incub: {
      '30': N('30–37 °C (B. atrophaeus)', '30–37 °C (B. atrophaeus)'),
      '56': N('55–60 °C', '55–60 °C'),
      room: N('Temperatura ambient', 'Temperatura ambiente')
    },
    incubOrder: ['56', '30', 'room']
  };

  /* ---------- Escenaris ---------- */
  /* Preparació: items = material que arriba a la zona neta (cond: ok | wet | dirty). Els controls (pcd, bi…) s'hi afegeixen sols. */
  const I = (mat, cond) => (cond ? { mat: mat, cond: cond } : { mat: mat });
  D.scenarios = [
    { id: 'P1', type: 'prep', level: 1, tags: ['load'],
      title: N('Instrumental i vidre per al Poupinel', 'Instrumental y vidrio para el Poupinel'),
      brief: N('Arriba material net de la zona de rentat. Decideix què pot anar al forn de calor seca, envasa-ho, carrega\'l, tria el programa segons el protocol del centre i fes tot el cicle fins a l\'alliberament.',
        'Llega material limpio de la zona de lavado. Decide qué puede ir al horno de calor seco, envásalo, cárgalo, elige el programa según el protocolo del centro y haz todo el ciclo hasta la liberación.'),
      variants: [
        { items: [I('tisores'), I('kocher'), I('mangbisturi'), I('xeringavidre'), I('gases')] },
        { items: [I('portaagulles'), I('cubeta'), I('pipetes'), I('petri'), I('ronyonera')] },
        { items: [I('caixacures'), I('tubs'), I('flasco'), I('talla')] },
        { items: [I('pipetes'), I('petri'), I('tubs'), I('flasco'), I('gases')] }
      ] },
    { id: 'P2', type: 'prep', level: 2, tags: ['load', 'oil'],
      title: N('Olis, vaselina i pols', 'Aceites, vaselina y polvos'),
      brief: N('La farmàcia del centre demana esterilitzar productes que el vapor no pot penetrar. A la safata també hi ha arribat material que no correspon. Prepara la càrrega amb criteri.',
        'La farmacia del centro pide esterilizar productos que el vapor no puede penetrar. En la bandeja también ha llegado material que no corresponde. Prepara la carga con criterio.'),
      variants: [
        { items: [I('vaselina'), I('talc'), I('oliparafina'), I('alcohol'), I('aigua')] },
        { items: [I('vaselina'), I('talc'), I('xeringavidre'), I('alcohol'), I('guants')] },
        { items: [I('oliparafina'), I('talc'), I('petri'), I('aigua'), I('ronyonera')] }
      ] },
    { id: 'P3', type: 'prep', level: 2, tags: ['load'],
      title: N('Safata mixta: què hi va i què no', 'Bandeja mixta: qué va y qué no'),
      brief: N('Una unitat envia una safata amb material divers. Revisa cada peça: estat, compatibilitat amb la calor seca i destí correcte del que no hi pot anar.',
        'Una unidad envía una bandeja con material diverso. Revisa cada pieza: estado, compatibilidad con el calor seco y destino correcto de lo que no puede ir.'),
      variants: [
        { items: [I('kocher', 'dirty'), I('xeringavidre'), I('tubgoma'), I('ronyonera'), I('xeringaus'), I('fibro'), I('mangbisturi')] },
        { items: [I('tisores', 'wet'), I('pipetes'), I('guants'), I('talla'), I('aigua'), I('petri'), I('fibro')] },
        { items: [I('portaagulles'), I('cubeta', 'dirty'), I('gases'), I('xeringaus'), I('tubs'), I('tubgoma')] }
      ] },
    { id: 'P4', type: 'prep', level: 3, tags: ['load', 'overload'],
      title: N('Molta feina: no hi cap tot', 'Mucho trabajo: no cabe todo'),
      brief: N('Al final del torn arriba molt material apte. Vols acabar d\'una vegada, però la cambra té un límit: decideix què va en aquest cicle i què en el següent.',
        'Al final del turno llega mucho material apto. Quieres acabar de una vez, pero la cámara tiene un límite: decide qué va en este ciclo y qué en el siguiente.'),
      variants: [
        { items: [I('caixacures'), I('caixacures'), I('cubeta'), I('cubeta'), I('pipetes'), I('petri'), I('tubs'), I('xeringavidre'), I('tisores'), I('flasco'), I('kocher'), I('mangbisturi')] },
        { items: [I('caixacures'), I('cubeta'), I('cubeta'), I('caixacures'), I('kocher'), I('portaagulles'), I('petri'), I('pipetes'), I('flasco'), I('tubs'), I('xeringavidre'), I('tisores')] }
      ] },
    { id: 'P5', type: 'prep', level: 3, tags: ['bi'], bi: true,
      title: N('Control biològic mensual', 'Control biológico mensual'),
      brief: N('Avui toca el control biològic periòdic del forn. A més del material, has de col·locar correctament l\'indicador biològic adequat, reservar-ne el control, incubar-los i llegir el resultat abans de decidir.',
        'Hoy toca el control biológico periódico del horno. Además del material, tienes que colocar correctamente el indicador biológico adecuado, reservar su control, incubarlos y leer el resultado antes de decidir.'),
      variants: [
        { items: [I('kocher'), I('tisores'), I('xeringavidre'), I('petri')] },
        { items: [I('caixacures'), I('pipetes'), I('flasco')] },
        { items: [I('portaagulles'), I('mangbisturi'), I('tubs'), I('cubeta')] }
      ] },
    { id: 'P6', type: 'prep', level: 3, tags: ['interrupt'], interrupt: true,
      title: N('Una interrupció durant el cicle', 'Una interrupción durante el ciclo'),
      brief: N('Prepara i executa un cicle normal. Durant l\'exposició, et demanaran una cosa que posarà a prova el procediment.',
        'Prepara y ejecuta un ciclo normal. Durante la exposición, te pedirán algo que pondrá a prueba el procedimiento.'),
      variants: [
        { items: [I('pipetes'), I('petri'), I('flasco'), I('tubs')] },
        { items: [I('kocher'), I('tisores'), I('cubeta')] }
      ] },
    { id: 'P7', type: 'prep', level: 2, tags: ['load'],
      title: N('Vidre acabat de rentar', 'Vidrio recién lavado'),
      brief: N('El laboratori té pressa pel material de vidre que acaba de sortir de la rentadora. Comprova-ho tot abans de carregar-lo.',
        'El laboratorio tiene prisa por el material de vidrio que acaba de salir de la lavadora. Compruébalo todo antes de cargarlo.'),
      variants: [
        { items: [I('tubs', 'wet'), I('pipetes'), I('petri', 'dirty'), I('flasco'), I('cubeta')] },
        { items: [I('xeringavidre', 'wet'), I('petri'), I('pipetes', 'dirty'), I('tubs')] }
      ] },
    { id: 'FREE', type: 'prep', level: 0, free: true, bi: true, tags: [],
      title: N('Laboratori lliure', 'Laboratorio libre'),
      brief: N('Tot el catàleg a la teva disposició, sense ordre de treball. Prova combinacions, envasos i paràmetres i observa\'n les conseqüències.',
        'Todo el catálogo a tu disposición, sin orden de trabajo. Prueba combinaciones, envases y parámetros y observa sus consecuencias.'),
      variants: [{ items: ['tisores', 'kocher', 'caixacures', 'cubeta', 'xeringavidre', 'pipetes', 'petri', 'tubs', 'vaselina', 'talc', 'gases', 'talla', 'tubgoma', 'ronyonera', 'xeringaus', 'alcohol', 'aigua', 'fibro'].map(function (m) { return I(m); }) }] },

    /* ---------- Diagnòstic: cicle ja fet; l'alumne interpreta registre, indicadors i biològic, i decideix ---------- */
    { id: 'D1', type: 'diag', level: 1, tags: ['phys'], causes: ['k_none'],
      title: N('Revisió d\'un cicle rutinari', 'Revisión de un ciclo rutinario'),
      brief: N('Acaba un cicle del forn i et toca validar-lo abans de passar els paquets a la zona estèril.', 'Termina un ciclo del horno y te toca validarlo antes de pasar los paquetes a la zona estéril.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, items: [{ mat: 'pipetes', shelf: 0 }, { mat: 'petri', shelf: 1 }, { mat: 'tubs', shelf: 2 }, { mat: 'flasco', shelf: 1 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{}, { params: { T: 170, t: 60, mode: 'probe' }, items: [{ mat: 'kocher', shelf: 0 }, { mat: 'tisores', shelf: 1 }, { mat: 'caixacures', shelf: 2 }, { mat: 'pcd', shelf: 1 }] }] },
    { id: 'D2', type: 'diag', level: 2, tags: ['phys'], causes: ['k_interrupt', 'k_chamberCount'],
      title: N('El forn antic del consultori', 'El horno antiguo del consultorio'),
      brief: N('Aquest forn té un temporitzador mecànic que comença a comptar quan la cambra arriba a la temperatura i no s\'atura mai. Un registrador de temperatura independent n\'ha gravat el cicle.',
        'Este horno tiene un temporizador mecánico que empieza a contar cuando la cámara llega a la temperatura y no se detiene nunca. Un registrador de temperatura independiente ha grabado el ciclo.'),
      base: { params: { T: 180, t: 30, mode: 'chamber' }, faults: { noReset: true }, items: [{ mat: 'xeringavidre', shelf: 0 }, { mat: 'mangbisturi', shelf: 1 }, { mat: 'cubeta', shelf: 2 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{ script: [{ when: 'expo', after: 8, action: 'open', dur: 2 }] }, { script: [{ when: 'expo', after: 14, action: 'open', dur: 3 }] }, { script: [{ when: 'expo', after: 20, action: 'open', dur: 2 }] }] },
    { id: 'D3', type: 'diag', level: 2, tags: ['phys'], causes: ['k_chamberCount'],
      title: N('Un programa mal configurat', 'Un programa mal configurado'),
      brief: N('Un company ha programat el cicle de les caixes d\'instrumental. El ticket diu «cicle acabat». Revisa-ho tu.', 'Un compañero ha programado el ciclo de las cajas de instrumental. El ticket dice «ciclo terminado». Revísalo tú.'),
      base: { params: { T: 170, t: 60, mode: 'chamber' }, items: [{ mat: 'caixacures', shelf: 1 }, { mat: 'caixacures', shelf: 2 }, { mat: 'kocher', shelf: 0 }, { mat: 'cubeta', shelf: 0 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{}, { params: { T: 180, t: 30, mode: 'chamber' } }] },
    { id: 'D4', type: 'diag', level: 3, tags: ['chem', 'equip'], equip: true, causes: ['k_calib'],
      title: N('Tot sembla correcte… o no', 'Todo parece correcto… o no'),
      brief: N('El registre del forn no mostra cap incidència. Revisa amb atenció tots els controls abans de signar.', 'El registro del horno no muestra ninguna incidencia. Revisa con atención todos los controles antes de firmar.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, faults: { offset: 14 }, items: [{ mat: 'tisores', shelf: 0 }, { mat: 'caixacures', shelf: 1 }, { mat: 'petri', shelf: 2 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{}, { faults: { offset: 16 }, params: { T: 170, t: 60, mode: 'probe' } }] },
    { id: 'D5', type: 'diag', level: 2, tags: ['phys', 'equip'], equip: true, causes: ['k_tempLow', 'k_calib'],
      title: N('Alarma al forn', 'Alarma en el horno'),
      brief: N('En arribar al torn trobes el forn amb una alarma i el ticket imprès. Interpreta què ha passat.', 'Al llegar al turno encuentras el horno con una alarma y el ticket impreso. Interpreta qué ha pasado.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, faults: { maxT: 168 }, items: [{ mat: 'pipetes', shelf: 0 }, { mat: 'xeringavidre', shelf: 1 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{}, { faults: { maxT: 158 }, params: { T: 170, t: 60, mode: 'probe' } }] },
    { id: 'D6', type: 'diag', level: 3, tags: ['bi'], causes: ['k_bi'], hasBI: true,
      title: N('Lectura del biològic', 'Lectura del biológico'),
      brief: N('El lot d\'ahir, amb el control biològic mensual, es va alliberar amb els controls físics i químics correctes. Ara toca incubar i llegir l\'indicador biològic i el seu control.',
        'El lote de ayer, con el control biológico mensual, se liberó con los controles físicos y químicos correctos. Ahora toca incubar y leer el indicador biológico y su control.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, force: { bi: 'pos' }, items: [{ mat: 'pipetes', shelf: 0 }, { mat: 'petri', shelf: 1 }, { mat: 'tubs', shelf: 2 }, { mat: 'pcd', shelf: 1 }, { mat: 'bi', shelf: 1 }] },
      variants: [{}, { params: { T: 170, t: 60, mode: 'probe' }, items: [{ mat: 'kocher', shelf: 0 }, { mat: 'caixacures', shelf: 1 }, { mat: 'pcd', shelf: 1 }, { mat: 'bi', shelf: 1 }] }] },
    { id: 'D7', type: 'diag', level: 3, tags: ['bi'], causes: ['k_biInvalid'], hasBI: true,
      title: N('Un biològic estrany', 'Un biológico extraño'),
      brief: N('Toca llegir el control biològic del cicle de dilluns. Fixa\'t bé en els dos tubs abans de concloure res.', 'Toca leer el control biológico del ciclo del lunes. Fíjate bien en los dos tubos antes de concluir nada.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, force: { ctrlDead: true }, items: [{ mat: 'xeringavidre', shelf: 0 }, { mat: 'flasco', shelf: 1 }, { mat: 'pcd', shelf: 1 }, { mat: 'bi', shelf: 1 }] },
      variants: [{}] },
    { id: 'D8', type: 'diag', level: 2, tags: ['chem'], causes: ['k_indicator'],
      title: N('Les cintes de sempre', 'Las cintas de siempre'),
      brief: N('S\'han acabat les cintes de calor seca i un company ha fet servir «les de sempre» del magatzem. Valida la càrrega.', 'Se han acabado las cintas de calor seco y un compañero ha usado «las de siempre» del almacén. Valida la carga.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, items: [{ mat: 'pipetes', shelf: 0, ciExt: 'steam' }, { mat: 'petri', shelf: 1, ciExt: 'steam' }, { mat: 'xeringavidre', shelf: 2, ciExt: 'steam' }, { mat: 'pcd', shelf: 1 }] },
      variants: [{}] },
    { id: 'D9', type: 'diag', level: 2, tags: ['chem', 'pack'], causes: ['k_pack'],
      title: N('Envasos que no toquen', 'Envases que no tocan'),
      brief: N('En obrir el forn notes olor de cremat. Revisa paquet per paquet.', 'Al abrir el horno notas olor a quemado. Revisa paquete por paquete.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, items: [{ mat: 'tisores', shelf: 0, pack: 'paperfilm' }, { mat: 'petri', shelf: 1 }, { mat: 'mangbisturi', shelf: 2, pack: 'crepe' }, { mat: 'pipetes', shelf: 0 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{}, { items: [{ mat: 'kocher', shelf: 0, pack: 'cloth' }, { mat: 'tubs', shelf: 1 }, { mat: 'flasco', shelf: 2 }, { mat: 'pcd', shelf: 1 }] }] },
    { id: 'D10', type: 'diag', level: 1, tags: ['record'], causes: ['k_record'],
      title: N('Paperassa pendent', 'Papeleo pendiente'),
      brief: N('El cicle ha acabat bé, però abans d\'alliberar revisa també la documentació i la identificació.', 'El ciclo ha terminado bien, pero antes de liberar revisa también la documentación y la identificación.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, items: [{ mat: 'pipetes', shelf: 0 }, { mat: 'tubs', shelf: 1 }, { mat: 'petri', shelf: 2 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{ recordIncomplete: true }, { items: [{ mat: 'pipetes', shelf: 0 }, { mat: 'tubs', shelf: 1, label: false }, { mat: 'petri', shelf: 2 }, { mat: 'pcd', shelf: 1 }] }] },
    { id: 'D11', type: 'diag', level: 3, tags: ['phys', 'overload'], causes: ['k_overload'],
      title: N('Un forn ple a vessar', 'Un horno lleno a rebosar'),
      brief: N('Per estalviar un cicle, algú ha omplert el forn al màxim. El registre de la sonda sembla correcte. Valida-ho.', 'Para ahorrar un ciclo, alguien ha llenado el horno al máximo. El registro de la sonda parece correcto. Valídalo.'),
      base: { params: { T: 180, t: 30, mode: 'probe' }, faults: { centreLag: 2.2 },
        items: [{ mat: 'caixacures', shelf: 1 }, { mat: 'caixacures', shelf: 1 }, { mat: 'cubeta', shelf: 1 }, { mat: 'caixacures', shelf: 1 }, { mat: 'cubeta', shelf: 0 }, { mat: 'cubeta', shelf: 0 }, { mat: 'caixacures', shelf: 0 }, { mat: 'cubeta', shelf: 2 }, { mat: 'caixacures', shelf: 2 }, { mat: 'caixacures', shelf: 2 }, { mat: 'pcd', shelf: 1 }] },
      variants: [{}] }
  ];

  /* ---------- Missatges d'avaluació: t = títol, w = per què, g = bona pràctica ---------- */
  const M = (tca, tes, wca, wes, gca, ges) => ({ ca: { t: tca, w: wca || '', g: gca || '' }, es: { t: tes, w: wes || '', g: ges || '' } });
  D.msgs = {
    /* càrrega */
    l_undecided: M('Material sense decidir', 'Material sin decidir', 'No has dit si aquesta peça va al forn o no.', 'No has dicho si esta pieza va al horno o no.', 'Revisa cada peça: acceptar-la i preparar-la o retirar-la amb el destí correcte.', 'Revisa cada pieza: aceptarla y prepararla o retirarla con el destino correcto.'),
    l_cond_dirty: M('Has carregat material brut', 'Has cargado material sucio', 'La matèria orgànica protegeix els microorganismes de la calor: si no és net, no es pot esterilitzar.', 'La materia orgánica protege a los microorganismos del calor: si no está limpio, no se puede esterilizar.', 'Torna\'l a la zona de rentat.', 'Devuélvelo a la zona de lavado.'),
    l_cond_wet: M('Has carregat material humit', 'Has cargado material húmedo', 'La humitat retarda l\'escalfament, afavoreix la corrosió i el vidre humit es pot esquerdar.', 'La humedad retrasa el calentamiento, favorece la corrosión y el vidrio húmedo se puede agrietar.', 'Tot ha d\'entrar ben sec: torna\'l a assecar.', 'Todo debe entrar bien seco: vuelve a secarlo.'),
    l_mat_no: M('Material no apte per a calor seca', 'Material no apto para calor seco', 'Plàstics, gomes, tèxtils, òptiques i líquids aquosos no resisteixen el calor sec o no s\'hi esterilitzen bé.', 'Plásticos, gomas, textiles, ópticas y líquidos acuosos no resisten el calor seco o no se esterilizan bien.', 'Deriva\'l al mètode adequat (autoclau o baixa temperatura).', 'Derívalo al método adecuado (autoclave o baja temperatura).'),
    l_mat_single: M('Material d\'un sol ús reprocessat', 'Material de un solo uso reprocesado', 'El material d\'un sol ús no es pot reprocessar si el fabricant no ho indica.', 'El material de un solo uso no se puede reprocesar si el fabricante no lo indica.', 'Rebutja\'l.', 'Deséchalo.'),
    l_mat_flam: M('Producte inflamable dins el forn', 'Producto inflamable dentro del horno', 'Els vapors de l\'alcohol es poden encendre amb les resistències: risc d\'incendi o explosió.', 'Los vapores del alcohol pueden encenderse con las resistencias: riesgo de incendio o explosión.', 'Mai no s\'introdueixen productes inflamables al forn.', 'Nunca se introducen productos inflamables en el horno.'),
    l_rejectOk: M('Retirada correcta', 'Retirada correcta'),
    l_reasonOk: M('Destí correcte', 'Destino correcto'),
    l_reasonBad: M('Destí incorrecte del material retirat', 'Destino incorrecto del material retirado', 'Has fet bé de retirar-lo, però no l\'envies on toca.', 'Has hecho bien en retirarlo, pero no lo envías donde toca.', '', ''),
    l_laterOk: M('Bé: part del material va al cicle següent', 'Bien: parte del material va al ciclo siguiente'),
    l_laterNo: M('Has deixat per a més tard material que hi cabia', 'Has dejado para más tarde material que cabía', 'No calia: la càrrega no superava el límit.', 'No hacía falta: la carga no superaba el límite.', 'Si tot hi cap sense superar el 80 %, es fa en un sol cicle.', 'Si todo cabe sin superar el 80 %, se hace en un solo ciclo.'),
    l_rejectedApt: M('Has retirat material apte', 'Has retirado material apto', 'Aquest material es pot esterilitzar per calor seca.', 'Este material se puede esterilizar por calor seco.', 'Accepta\'l i prepara\'l.', 'Acéptalo y prepáralo.'),
    l_packOk: M('Envàs adequat', 'Envase adecuado'),
    l_packMissing: M('Sense envàs triat', 'Sin envase elegido', '', '', 'Tria un envàs apte: caixa metàl·lica, paper d\'alumini, pot metàl·lic o recipient tapat.', 'Elige un envase apto: caja metálica, papel de aluminio, bote metálico o recipiente tapado.'),
    l_packBurn: M('Envàs que es crema', 'Envase que se quema', 'El paper i la roba es torren o s\'ennegreixen i deixen de fer de barrera; a temperatura alta poden encendre\'s.', 'El papel y la tela se tuestan o ennegrecen y dejan de hacer de barrera; a temperatura alta pueden encenderse.', 'En calor seca: caixes metàl·liques, paper d\'alumini o recipients de vidre/metall.', 'En calor seco: cajas metálicas, papel de aluminio o recipientes de vidrio/metal.'),
    l_packMelt: M('Envàs de plàstic', 'Envase de plástico', 'El plàstic es fon a la temperatura del forn.', 'El plástico se funde a la temperatura del horno.', 'Fes servir envasos metàl·lics o paper d\'alumini.', 'Usa envases metálicos o papel de aluminio.'),
    l_packMixed: M('Bossa mixta paper-plàstic al forn', 'Bolsa mixta papel-plástico en el horno', 'És un envàs per a vapor: el film es fon i el paper es torra.', 'Es un envase para vapor: el film se funde y el papel se tuesta.', 'En calor seca: caixa metàl·lica o paper d\'alumini.', 'En calor seco: caja metálica o papel de aluminio.'),
    l_packNone: M('Material sense envasar', 'Material sin envasar', 'En treure\'l del forn perd l\'esterilitat: no es pot emmagatzemar.', 'Al sacarlo del horno pierde la esterilidad: no se puede almacenar.', 'Envasa-ho sempre si s\'ha de guardar.', 'Envásalo siempre si se tiene que guardar.'),
    l_packNotValid: M('Envàs pensat per al vapor', 'Envase pensado para el vapor', 'Els contenidors amb filtre i juntes estan validats per al vapor; el filtre i les juntes no són per a calor seca (orientatiu, segons fabricant).', 'Los contenedores con filtro y juntas están validados para el vapor; el filtro y las juntas no son para calor seco (orientativo, según fabricante).', 'Fes servir una caixa metàl·lica tancada.', 'Usa una caja metálica cerrada.'),
    l_packMismatch: M('Envàs poc adequat per a aquesta peça', 'Envase poco adecuado para esta pieza', 'L\'envàs és apte per a calor seca, però no per a aquest material (p. ex., pols o olis han d\'anar en recipient tapat i en poca quantitat).', 'El envase es apto para calor seco, pero no para este material (p. ej., polvos o aceites deben ir en recipiente tapado y en poca cantidad).', '', ''),
    l_openOk: M('Articulat obert', 'Articulado abierto'),
    l_closed: M('Instrumental articulat tancat', 'Instrumental articulado cerrado', 'Les superfícies de l\'articulació no s\'exposen bé i el metall pateix tensions amb la dilatació.', 'Las superficies de la articulación no se exponen bien y el metal sufre tensiones con la dilatación.', 'Col·loca\'l obert (sense travar).', 'Colócalo abierto (sin trabar).'),
    l_thinOk: M('Capa fina', 'Capa fina'),
    l_thick: M('Oli o pols en capa gruixuda', 'Aceite o polvo en capa gruesa', 'La calor seca penetra per conducció, a poc a poc: el centre d\'una capa gruixuda no arriba a temperatura a temps.', 'El calor seco penetra por conducción, poco a poco: el centro de una capa gruesa no llega a temperatura a tiempo.', 'Poca quantitat i capa fina (orientatiu: menys de 0,5 cm).', 'Poca cantidad y capa fina (orientativo: menos de 0,5 cm).'),
    l_ciExtOk: M('Indicador extern correcte', 'Indicador externo correcto'),
    l_ciExt_steam: M('Indicador extern de vapor', 'Indicador externo de vapor', 'Cada indicador químic està dissenyat per a un mètode: el de vapor no és vàlid per a calor seca.', 'Cada indicador químico está diseñado para un método: el de vapor no es válido para calor seco.', 'Cinta o etiqueta específica per a calor seca a cada paquet.', 'Cinta o etiqueta específica para calor seco en cada paquete.'),
    l_ciExt_none: M('Paquet sense indicador extern', 'Paquete sin indicador externo', 'Sense indicador de procés no es pot distingir un paquet processat d\'un que no ho està.', 'Sin indicador de proceso no se puede distinguir un paquete procesado de uno que no lo está.', 'Indicador extern a cada paquet.', 'Indicador externo en cada paquete.'),
    l_ciIntOk: M('Indicador intern correcte', 'Indicador interno correcto'),
    l_ciInt_steam: M('Indicador intern de vapor', 'Indicador interno de vapor', 'No respon a les condicions de la calor seca.', 'No responde a las condiciones del calor seco.', 'Indicador intern específic per a calor seca.', 'Indicador interno específico para calor seco.'),
    l_ciInt_none: M('Paquet sense indicador intern', 'Paquete sin indicador interno', 'L\'indicador intern mostra que les condicions han arribat a l\'interior; es comprova en obrir el paquet per fer-lo servir.', 'El indicador interno muestra que las condiciones han llegado al interior; se comprueba al abrir el paquete para usarlo.', 'Posa un indicador intern a cada paquet (segons protocol).', 'Pon un indicador interno en cada paquete (según protocolo).'),
    l_labelOk: M('Etiquetat', 'Etiquetado'),
    l_noLabel: M('Paquet sense identificar', 'Paquete sin identificar', 'Sense data, contingut, lot i operador no hi ha traçabilitat.', 'Sin fecha, contenido, lote y operador no hay trazabilidad.', 'Etiqueta cada paquet abans de carregar-lo.', 'Etiqueta cada paquete antes de cargarlo.'),
    l_notPlaced: M('Paquet preparat però no carregat', 'Paquete preparado pero no cargado', '', '', 'Col·loca\'l en una reixeta.', 'Colócalo en una rejilla.'),
    l_floor: M('Paquet a la base de la cambra', 'Paquete en la base de la cámara', 'A la base hi ha la font de calor: s\'hi sobreescalfa i impedeix la circulació de l\'aire.', 'En la base está la fuente de calor: se sobrecalienta e impide la circulación del aire.', 'Sempre sobre les reixetes.', 'Siempre sobre las rejillas.'),
    l_shelfOk: M('Sobre reixeta', 'Sobre rejilla'),
    l_stacked: M('Paquets apilats', 'Paquetes apilados', 'Un paquet sobre un altre fa de barrera: l\'aire calent no circula i triga molt més a escalfar-se.', 'Un paquete sobre otro hace de barrera: el aire caliente no circula y tarda mucho más en calentarse.', 'No apilar: deixar espai entre paquets.', 'No apilar: dejar espacio entre paquetes.'),
    l_notStacked: M('Sense apilar', 'Sin apilar'),
    l_pcdMissing: M('Sense paquet de control (PCD) a la càrrega', 'Sin paquete de control (PCD) en la carga', 'L\'integrador del paquet de control demostra que les condicions de temps i temperatura s\'han assolit al punt més desfavorable.', 'El integrador del paquete de control demuestra que las condiciones de tiempo y temperatura se han alcanzado en el punto más desfavorable.', 'Un PCD a cada càrrega, al centre.', 'Un PCD en cada carga, en el centro.'),
    l_pcdOk: M('PCD al centre de la càrrega', 'PCD en el centro de la carga'),
    l_pcdPos: M('PCD mal situat', 'PCD mal situado', 'Ha d\'anar al punt més difícil d\'escalfar (centre de la càrrega).', 'Debe ir al punto más difícil de calentar (centro de la carga).', 'Col·loca\'l a la reixeta central.', 'Colócalo en la rejilla central.'),
    l_biMissing: M('Falta l\'indicador biològic', 'Falta el indicador biológico', 'Avui tocava el control biològic periòdic.', 'Hoy tocaba el control biológico periódico.', 'Col·loca\'l al centre de la càrrega.', 'Colócalo en el centro de la carga.'),
    l_biOk: M('Biològic al centre de la càrrega', 'Biológico en el centro de la carga'),
    l_biPos: M('Biològic mal situat', 'Biológico mal situado', 'Ha d\'anar al punt més desfavorable perquè la prova sigui exigent.', 'Debe ir al punto más desfavorable para que la prueba sea exigente.', 'Reixeta central, dins la càrrega.', 'Rejilla central, dentro de la carga.'),
    l_biWrong: M('Espores equivocades', 'Esporas equivocadas', 'Geobacillus stearothermophilus és l\'indicador del vapor (i del plasma); per a calor seca s\'usa Bacillus atrophaeus.', 'Geobacillus stearothermophilus es el indicador del vapor (y del plasma); para calor seco se usa Bacillus atrophaeus.', '', ''),
    l_biWrongOk: M('Bé: no has fet servir l\'indicador de vapor', 'Bien: no has usado el indicador de vapor'),
    l_ctrlInOven: M('Has processat el control positiu', 'Has procesado el control positivo', 'El control és un indicador del mateix lot que NO es processa: ha de créixer per demostrar que les espores eren viables i que la incubació funciona.', 'El control es un indicador del mismo lote que NO se procesa: debe crecer para demostrar que las esporas eran viables y que la incubación funciona.', 'Deixa\'l fora del forn.', 'Déjalo fuera del horno.'),
    l_ctrlKept: M('Control positiu reservat', 'Control positivo reservado'),
    l_overload: M('Càrrega per sobre del 80 %', 'Carga por encima del 80 %', 'Una cambra massa plena no deixa circular l\'aire: hi ha zones fredes i la càrrega triga molt més a arribar a temperatura.', 'Una cámara demasiado llena no deja circular el aire: hay zonas frías y la carga tarda mucho más en llegar a temperatura.', 'No superar el 80 % i fer un segon cicle si cal.', 'No superar el 80 % y hacer un segundo ciclo si hace falta.'),
    l_capOk: M('Càrrega dins del límit', 'Carga dentro del límite'),
    l_fullShelf: M('Reixeta plena: paquets tocant-se i tocant les parets', 'Rejilla llena: paquetes tocándose y tocando las paredes', 'Sense espai entre paquets ni amb les parets, l\'aire no circula i hi ha punts calents a les parets.', 'Sin espacio entre paquetes ni con las paredes, el aire no circula y hay puntos calientes en las paredes.', 'Deixa espai entre paquets i amb les parets.', 'Deja espacio entre paquetes y con las paredes.'),
    /* paràmetres */
    p_binomi: M('Binomi temperatura-temps eficaç', 'Binomio temperatura-tiempo eficaz'),
    p_tempLow: M('Temperatura insuficient', 'Temperatura insuficiente', 'Per sota de 160 °C el cicle no és eficaç amb els temps de protocol.', 'Por debajo de 160 °C el ciclo no es eficaz con los tiempos de protocolo.', 'Binomis: 180 °C 30 min · 170 °C 60 min · 160 °C 120 min.', 'Binomios: 180 °C 30 min · 170 °C 60 min · 160 °C 120 min.'),
    p_tempHigh: M('Temperatura excessiva', 'Temperatura excesiva', 'Més calor no vol dir més seguretat: deteriora l\'instrumental (perd el tall i l\'elasticitat) i augmenta el risc de cremar res.', 'Más calor no significa más seguridad: deteriora el instrumental (pierde el filo y la elasticidad) y aumenta el riesgo de quemar algo.', 'Fes servir un binomi validat.', 'Usa un binomio validado.'),
    p_timeShort: M('Temps d\'exposició insuficient', 'Tiempo de exposición insuficiente', 'Per a aquesta temperatura cal més temps.', 'Para esta temperatura hace falta más tiempo.', '180 °C 30 min · 170 °C 60 min · 160 °C 120 min.', '180 °C 30 min · 170 °C 60 min · 160 °C 120 min.'),
    p_protocol: M('Programa del protocol', 'Programa del protocolo'),
    p_protocolNA: M('Sense programa vàlid', 'Sin programa válido'),
    p_timeExcess: M('Exposició molt més llarga del necessari', 'Exposición mucho más larga de lo necesario', 'Allargar el cicle no aporta seguretat i desgasta el material.', 'Alargar el ciclo no aporta seguridad y desgasta el material.', 'Fes servir el binomi del protocol.', 'Usa el binomio del protocolo.'),
    p_nonStandard: M('Combinació no validada', 'Combinación no validada', 'Pot ser eficaç, però no és un dels binomis validats del centre.', 'Puede ser eficaz, pero no es uno de los binomios validados del centro.', 'Fes servir el binomi del protocol.', 'Usa el binomio del protocolo.'),
    p_notProtocol: M('Programa diferent del que fixa el protocol', 'Programa diferente del que fija el protocolo', 'És un binomi eficaç, però el protocol del centre en fixa un altre per a aquesta càrrega (p. ex., menys temperatura per a l\'instrumental articulat, per desgastar-lo menys).', 'Es un binomio eficaz, pero el protocolo del centro fija otro para esta carga (p. ej., menos temperatura para el instrumental articulado, para desgastarlo menos).', '', ''),
    p_modeProbe: M('Temps comptat amb tota la càrrega a temperatura', 'Tiempo contado con toda la carga a temperatura'),
    p_modeChamber: M('Temps comptat des que la cambra arriba a temperatura', 'Tiempo contado desde que la cámara llega a temperatura', 'El temps d\'exposició es compta des que TOTA la càrrega ha arribat a la temperatura, no des que hi arriba la cambra.', 'El tiempo de exposición se cuenta desde que TODA la carga ha llegado a la temperatura, no desde que llega la cámara.', 'Inici del recompte: sonda de càrrega.', 'Inicio del recuento: sonda de carga.'),
    /* procediment */
    pr_preOk: M('Comprovació prèvia feta', 'Comprobación previa hecha'),
    pr_preMissing: M('Comprovació prèvia oblidada', 'Comprobación previa olvidada'),
    pr_preWrong: M('Comprovació que no correspon al forn', 'Comprobación que no corresponde al horno', 'Aquesta comprovació és de l\'autoclau de vapor: el forn de calor seca no fa servir aigua, ni pressió, ni buit.', 'Esta comprobación es del autoclave de vapor: el horno de calor seco no usa agua, ni presión, ni vacío.', '', ''),
    pr_preAvoid: M('Bé: no has confós el forn amb l\'autoclau', 'Bien: no has confundido el horno con el autoclave'),
    pr_intOk: M('Interrupció ben resolta', 'Interrupción bien resuelta'),
    pr_intPart: M('Interrupció resolta a mitges', 'Interrupción resuelta a medias', 'Obrir la porta fa baixar la temperatura i obliga a tornar a comptar: allarga el cicle i estressa el vidre.', 'Abrir la puerta hace bajar la temperatura y obliga a volver a contar: alarga el ciclo y estresa el vidrio.', 'No obrir durant el cicle: el material oblidat va al cicle següent.', 'No abrir durante el ciclo: el material olvidado va al ciclo siguiente.'),
    pr_intBad: M('Interrupció mal resolta', 'Interrupción mal resuelta', 'Obrir i afegir material a mig cicle sense tornar a comptar deixa material sense esterilitzar.', 'Abrir y añadir material a mitad de ciclo sin volver a contar deja material sin esterilizar.', 'No obrir durant el cicle.', 'No abrir durante el ciclo.'),
    pr_openedDuring: M('Has obert la porta durant el cicle', 'Has abierto la puerta durante el ciclo', 'La temperatura baixa i el temps d\'exposició s\'ha de tornar a comptar.', 'La temperatura baja y el tiempo de exposición se tiene que volver a contar.', 'No obris mai la porta durant el cicle.', 'No abras nunca la puerta durante el ciclo.'),
    pr_doorOk: M('Porta tancada durant tot el cicle', 'Puerta cerrada durante todo el ciclo'),
    pr_noUnload: M('No has descarregat el forn', 'No has descargado el horno'),
    pr_coolOk: M('Descàrrega a temperatura segura', 'Descarga a temperatura segura'),
    pr_openWarm: M('Porta oberta massa aviat', 'Puerta abierta demasiado pronto', 'El material encara és molt calent: risc de cremades i de xoc tèrmic del vidre.', 'El material todavía está muy caliente: riesgo de quemaduras y de choque térmico del vidrio.', 'Espera que la temperatura baixi fins al valor segur (orientatiu ≤ 60 °C).', 'Espera a que la temperatura baje hasta el valor seguro (orientativo ≤ 60 °C).'),
    pr_openHot: M('Porta oberta amb el forn calent', 'Puerta abierta con el horno caliente', 'Risc greu de cremades; l\'aire fred pot trencar el vidre per xoc tèrmic.', 'Riesgo grave de quemaduras; el aire frío puede romper el vidrio por choque térmico.', 'Deixa refredar dins el forn amb la porta tancada.', 'Deja enfriar dentro del horno con la puerta cerrada.'),
    pr_epiOk: M('Guants tèrmics', 'Guantes térmicos'),
    pr_epi_nitrile: M('Guants de nitril per descarregar', 'Guantes de nitrilo para descargar', 'No protegeixen de la calor.', 'No protegen del calor.', 'Guants tèrmics secs.', 'Guantes térmicos secos.'),
    pr_epi_wet: M('Drap humit per descarregar', 'Paño húmedo para descargar', 'L\'aigua conductora i el vapor que es forma causen cremades.', 'El agua conductora y el vapor que se forma causan quemaduras.', 'Guants tèrmics secs.', 'Guantes térmicos secos.'),
    pr_epi_none: M('Descàrrega sense protecció', 'Descarga sin protección', 'Risc de cremades.', 'Riesgo de quemaduras.', 'Guants tèrmics secs.', 'Guantes térmicos secos.'),
    pr_postOk: M('Pas de descàrrega correcte', 'Paso de descarga correcto'),
    pr_postMissing: M('Pas de descàrrega oblidat', 'Paso de descarga olvidado'),
    pr_postWrong: M('Pràctica incorrecta a la descàrrega', 'Práctica incorrecta en la descarga'),
    pr_postAvoid: M('Bé: has evitat una mala pràctica', 'Bien: has evitado una mala práctica'),
    /* controls */
    c_physOk: M('Control físic ben interpretat', 'Control físico bien interpretado'),
    c_physBad: M('Control físic mal interpretat', 'Control físico mal interpretado', 'Al registre cal comprovar que TOTA la càrrega (sonda) ha estat a la temperatura de consigna durant tot el temps d\'exposició, sense interrupcions.', 'En el registro hay que comprobar que TODA la carga (sonda) ha estado a la temperatura de consigna durante todo el tiempo de exposición, sin interrupciones.', '', ''),
    c_causeOk: M('Causa identificada', 'Causa identificada'),
    c_causeBad: M('Causa del problema físic no identificada', 'Causa del problema físico no identificada'),
    c_pkgOk: M('Paquet ben revisat', 'Paquete bien revisado'),
    c_pkgBad: M('Paquet mal revisat', 'Paquete mal revisado', 'Un paquet és conforme només si l\'indicador extern de calor seca ha virat, l\'envàs és íntegre i està identificat.', 'Un paquete es conforme solo si el indicador externo de calor seco ha virado, el envase está íntegro y está identificado.', '', ''),
    c_pcdOk: M('Integrador del PCD ben llegit', 'Integrador del PCD bien leído'),
    c_pcdBad: M('Integrador del PCD mal llegit', 'Integrador del PCD mal leído', 'L\'integrador s\'accepta només si el front de color arriba a la finestra d\'acceptació.', 'El integrador se acepta solo si el frente de color llega a la ventana de aceptación.', '', ''),
    c_incubOk: M('Incubació correcta (30–37 °C)', 'Incubación correcta (30–37 °C)'),
    c_incubBad: M('Temperatura d\'incubació equivocada', 'Temperatura de incubación equivocada', 'Bacillus atrophaeus s\'incuba a 30–37 °C (segons fabricant); 55–60 °C és per a G. stearothermophilus.', 'Bacillus atrophaeus se incuba a 30–37 °C (según fabricante); 55–60 °C es para G. stearothermophilus.', '', ''),
    c_biOk: M('Biològic ben interpretat', 'Biológico bien interpretado'),
    c_biBad: M('Biològic mal interpretat', 'Biológico mal interpretado', 'Primer mira el control: si no creix, la prova no és vàlida. Si el control creix: tub sense canvi = negatiu (correcte); tub groc i tèrbol = positiu (fallada).', 'Primero mira el control: si no crece, la prueba no es válida. Si el control crece: tubo sin cambio = negativo (correcto); tubo amarillo y turbio = positivo (fallo).', '', ''),
    c_notDone: M('Controls no revisats', 'Controles no revisados'),
    g_causeOk: M('Diagnòstic de la causa correcte', 'Diagnóstico de la causa correcto'),
    g_causeBad: M('Diagnòstic de la causa incorrecte', 'Diagnóstico de la causa incorrecto'),
    d_ok: M('Decisió necessària presa', 'Decisión necesaria tomada'),
    d_missing: M('Falta una decisió necessària', 'Falta una decisión necesaria'),
    d_wrong: M('Decisió que no correspon', 'Decisión que no corresponde'),
    d_notDone: M('Sense decisió', 'Sin decisión'),
    /* seguretat */
    s_flammable: M('Inflamable dins el forn: escenari anul·lat', 'Inflamable dentro del horno: escenario anulado', 'Has posat en marxa el forn amb un producte inflamable a dins: risc d\'incendi i explosió.', 'Has puesto en marcha el horno con un producto inflamable dentro: riesgo de incendio y explosión.', 'Mai no s\'introdueixen inflamables al forn; revisa la càrrega abans d\'iniciar.', 'Nunca se introducen inflamables en el horno; revisa la carga antes de iniciar.'),
    s_openHot: M('Obertura amb el forn calent (−3 punts)', 'Apertura con el horno caliente (−3 puntos)', 'Per sobre de 80 °C (orientatiu) el risc de cremades i de trencament del vidre és alt.', 'Por encima de 80 °C (orientativo) el riesgo de quemaduras y de rotura del vidrio es alto.', '', ''),
    s_noEPI: M('Material calent sense guants tèrmics (−1 punt)', 'Material caliente sin guantes térmicos (−1 punto)', '', '', '', ''),
    s_liquid: M('Líquid aquós al forn (−1 punt)', 'Líquido acuoso en el horno (−1 punto)', 'El líquid bull i el flascó pot rebentar.', 'El líquido hierve y el frasco puede reventar.', '', ''),
    s_releaseUnsafe: M('Has alliberat material no estèril (nota màxima 3)', 'Has liberado material no estéril (nota máxima 3)', 'Un material mal processat pot arribar a un pacient que no ho pot saber.', 'Un material mal procesado puede llegar a un paciente que no lo puede saber.', 'Davant del dubte, no alliberar: retenir, reprocessar i avisar.', 'Ante la duda, no liberar: retener, reprocesar y avisar.'),
    /* danys visibles */
    dm_fire: M('Vapors inflamables: risc d\'incendi', 'Vapores inflamables: riesgo de incendio'),
    dm_boil: M('El líquid ha bullit i el flascó s\'ha esquerdat', 'El líquido ha hervido y el frasco se ha agrietado'),
    dm_melt: M('Fos / deformat', 'Fundido / deformado'),
    dm_rubber: M('Goma endurida i esquerdada', 'Goma endurecida y agrietada'),
    dm_optic: M('Òptica malmesa', 'Óptica dañada'),
    dm_scorch: M('Envàs torrat i ennegrit', 'Envase tostado y ennegrecido'),
    dm_burn: M('Envàs cremat', 'Envase quemado'),
    dm_crack: M('Vidre esquerdat', 'Vidrio agrietado'),
    /* causes (diagnòstic) */
    k_none: M('Cicle correcte', 'Ciclo correcto'),
    k_tempLow: M('Temperatura no assolida', 'Temperatura no alcanzada'),
    k_timeShort: M('Temps insuficient', 'Tiempo insuficiente'),
    k_interrupt: M('Interrupció del cicle', 'Interrupción del ciclo'),
    k_chamberCount: M('Temps comptat des de la cambra', 'Tiempo contado desde la cámara'),
    k_aborted: M('Cicle aturat', 'Ciclo detenido'),
    k_calib: M('Avaria de l\'equip', 'Avería del equipo'),
    k_pack: M('Envàs no apte', 'Envase no apto'),
    k_indicator: M('Indicador inadequat', 'Indicador inadecuado'),
    k_overload: M('Sobrecàrrega', 'Sobrecarga'),
    k_bi: M('Biològic positiu', 'Biológico positivo'),
    k_biInvalid: M('Biològic no vàlid', 'Biológico no válido'),
    k_record: M('Registre incomplet', 'Registro incompleto')
  };

  /* Explicació final de cada escenari de diagnòstic (bona pràctica). */
  D.diagExplain = {
    D1: N('Registre correcte (la sonda ha estat a temperatura tot el temps), indicadors virats, PCD acceptat i paquets íntegres i identificats: s\'allibera i es registra.', 'Registro correcto (la sonda ha estado a temperatura todo el tiempo), indicadores virados, PCD aceptado y paquetes íntegros e identificados: se libera y se registra.'),
    D2: N('El temporitzador mecànic ha seguit comptant mentre la porta era oberta i la temperatura baixava: la càrrega no ha estat a 180 °C durant 30 minuts seguits. Les cintes externes viren igualment (només indiquen que hi ha hagut calor). No s\'allibera: es reprocessa i es registra.', 'El temporizador mecánico ha seguido contando mientras la puerta estaba abierta y la temperatura bajaba: la carga no ha estado a 180 °C durante 30 minutos seguidos. Las cintas externas viran igualmente (solo indican que ha habido calor). No se libera: se reprocesa y se registra.'),
    D3: N('El recompte ha començat quan la CAMBRA ha arribat a la consigna, però la sonda de la càrrega hi ha arribat molt més tard: el temps real a temperatura és insuficient i l\'integrador del PCD no arriba a la zona d\'acceptació. Es reprocessa amb l\'inici del recompte per sonda.', 'El recuento ha empezado cuando la CÁMARA ha llegado a la consigna, pero la sonda de la carga ha llegado mucho más tarde: el tiempo real a temperatura es insuficiente y el integrador del PCD no llega a la zona de aceptación. Se reprocesa con el inicio del recuento por sonda.'),
    D4: N('El registre és perfecte perquè el mateix termòstat descalibrat el genera: la temperatura real era més baixa. Només l\'integrador químic del PCD ho delata. Forn fora de servei, avís a manteniment (calibratge), reprocessar i registrar.', 'El registro es perfecto porque el mismo termostato descalibrado lo genera: la temperatura real era más baja. Solo el integrador químico del PCD lo delata. Horno fuera de servicio, aviso a mantenimiento (calibración), reprocesar y registrar.'),
    D5: N('La resistència no ha pogut arribar a la consigna i el forn ha avortat per temps d\'escalfament excessiu. Cap paquet és estèril: reprocessar, forn fora de servei i avís a manteniment.', 'La resistencia no ha podido llegar a la consigna y el horno ha abortado por tiempo de calentamiento excesivo. Ningún paquete es estéril: reprocesar, horno fuera de servicio y aviso a mantenimiento.'),
    D6: N('El control ha crescut (les espores eren viables i la incubació funciona) i el tub de la prova també: biològic POSITIU. Tot el material processat des de l\'últim biològic negatiu es considera no estèril: retirar-lo, reprocessar, forn fora de servei, avisar i investigar.', 'El control ha crecido (las esporas eran viables y la incubación funciona) y el tubo de la prueba también: biológico POSITIVO. Todo el material procesado desde el último biológico negativo se considera no estéril: retirarlo, reprocesar, horno fuera de servicio, avisar e investigar.'),
    D7: N('El control no ha crescut: la prova no és vàlida (espores no viables, lot caducat o incubació incorrecta). No es pot concloure res del tub de prova: cal repetir el control biològic i revisar la incubadora i el lot d\'indicadors.', 'El control no ha crecido: la prueba no es válida (esporas no viables, lote caducado o incubación incorrecta). No se puede concluir nada del tubo de prueba: hay que repetir el control biológico y revisar la incubadora y el lote de indicadores.'),
    D8: N('Les cintes de vapor no estan pensades per a calor seca: el seu viratge no és interpretable. Encara que el PCD sigui correcte, cap paquet té un indicador de procés vàlid: no s\'allibera; es reenvasen amb indicadors de calor seca i es reprocessen.', 'Las cintas de vapor no están pensadas para calor seco: su viraje no es interpretable. Aunque el PCD sea correcto, ningún paquete tiene un indicador de proceso válido: no se libera; se reenvasan con indicadores de calor seco y se reprocesan.'),
    D9: N('El cicle és correcte, però els envasos de paper, roba o bossa mixta s\'han torrat o fos: aquests paquets no són estèrils ni íntegres. S\'alliberen només els conformes, es retira el material danyat i es reprocessa la resta amb envasos aptes.', 'El ciclo es correcto, pero los envases de papel, tela o bolsa mixta se han tostado o fundido: esos paquetes no son estériles ni íntegros. Se liberan solo los conformes, se retira el material dañado y se reprocesa el resto con envases aptos.'),
    D10: N('Sense registre complet o sense etiqueta no hi ha traçabilitat. Si només falta signar el registre del cicle, es completa abans d\'alliberar; un paquet sense identificar no s\'allibera: es reprocessa.', 'Sin registro completo o sin etiqueta no hay trazabilidad. Si solo falta firmar el registro del ciclo, se completa antes de liberar; un paquete sin identificar no se libera: se reprocesa.'),
    D11: N('La sonda era en una zona ben ventilada, però el centre de la càrrega, massa dens i apilat, no ha arribat a temperatura: l\'integrador del PCD ho mostra. No s\'allibera: es reprocessa en dues càrregues sense superar el 80 %.', 'La sonda estaba en una zona bien ventilada, pero el centro de la carga, demasiado denso y apilado, no ha llegado a temperatura: el integrador del PCD lo muestra. No se libera: se reprocesa en dos cargas sin superar el 80 %.')
  };

  /* Interrupció (P6): opcions durant l'exposició. w: f = correcte, p = parcial, w = error. */
  D.interrupt = {
    q: N('Un company arriba amb unes pinces que s\'havien quedat fora de la càrrega i et demana que les hi afegeixis «ara que encara està calent».', 'Un compañero llega con unas pinzas que se habían quedado fuera de la carga y te pide que las añadas «ahora que todavía está caliente».'),
    o: [
      { w: 'f', t: N('No obro: les pinces aniran al cicle següent.', 'No abro: las pinzas irán al ciclo siguiente.') },
      { w: 'p', t: N('Obro, les afegeixo i deixo que el forn torni a comptar l\'exposició des de zero.', 'Abro, las añado y dejo que el horno vuelva a contar la exposición desde cero.') },
      { w: 'w', t: N('Obro un moment amb guants i les afegeixo sense tocar res més: ja està calent.', 'Abro un momento con guantes y las añado sin tocar nada más: ya está caliente.') }
    ]
  };

  /* Guia ràpida (mode pràctica) */
  D.guide = [
    { h: N('Fonament i paràmetres', 'Fundamento y parámetros'), p: [
      N('La calor seca esterilitza per oxidació dels components cel·lulars. Penetra per conducció, a poc a poc: cal més temperatura i més temps que amb vapor.', 'El calor seco esteriliza por oxidación de los componentes celulares. Penetra por conducción, poco a poco: hace falta más temperatura y más tiempo que con vapor.'),
      N('Paràmetres: temperatura i temps (sense pressió). 180 °C 30 min · 170 °C 60 min · 160 °C 120 min.', 'Parámetros: temperatura y tiempo (sin presión). 180 °C 30 min · 170 °C 60 min · 160 °C 120 min.'),
      N('El temps es compta quan TOTA la càrrega és a temperatura, no quan s\'encén el forn ni quan hi arriba la cambra. Si s\'obre la porta, es torna a comptar.', 'El tiempo se cuenta cuando TODA la carga está a temperatura, no cuando se enciende el horno ni cuando llega la cámara. Si se abre la puerta, se vuelve a contar.')
    ] },
    { h: N('Què hi va i què no', 'Qué va y qué no'), p: [
      N('Sí: instrumental metàl·lic resistent (sobretot de tall), vidre, olis, vaselina, petrolats i pols (en capa fina).', 'Sí: instrumental metálico resistente (sobre todo de corte), vidrio, aceites, vaselina, petrolatos y polvos (en capa fina).'),
      N('No: plàstics, gomes i làtex, tèxtils i gases, paper, líquids aquosos, òptiques i material termolàbil; mai inflamables; mai material d\'un sol ús.', 'No: plásticos, gomas y látex, textiles y gasas, papel, líquidos acuosos, ópticas y material termolábil; nunca inflamables; nunca material de un solo uso.'),
      N('Envasos: caixes metàl·liques tancades (la calor passa per conducció), paper d\'alumini, pots metàl·lics. No paper, roba ni bosses mixtes.', 'Envases: cajas metálicas cerradas (el calor pasa por conducción), papel de aluminio, botes metálicos. No papel, tela ni bolsas mixtas.')
    ] },
    { h: N('Càrrega', 'Carga'), p: [
      N('Material net i sec. Articulats oberts. No superar el 80 %, deixar espai entre paquets i amb les parets, no apilar i no posar res a la base.', 'Material limpio y seco. Articulados abiertos. No superar el 80 %, dejar espacio entre paquetes y con las paredes, no apilar y no poner nada en la base.'),
      N('Indicador extern de calor seca i etiqueta (data, contingut, lot, operador) a cada paquet; indicador intern segons protocol; PCD amb integrador al centre de la càrrega.', 'Indicador externo de calor seco y etiqueta (fecha, contenido, lote, operador) en cada paquete; indicador interno según protocolo; PCD con integrador en el centro de la carga.')
    ] },
    { h: N('Controls', 'Controles'), p: [
      N('Físics (cada cicle): temperatura i temps del registre. Mostren que l\'aparell ha funcionat, però no que la calor ha arribat a l\'interior de cada paquet.', 'Físicos (cada ciclo): temperatura y tiempo del registro. Muestran que el aparato ha funcionado, pero no que el calor haya llegado al interior de cada paquete.'),
      N('Químics (cada paquet): l\'extern només diu «processat»; l\'intern i l\'integrador diuen que s\'han assolit les condicions. Cap no demostra l\'esterilitat.', 'Químicos (cada paquete): el externo solo dice «procesado»; el interno y el integrador dicen que se han alcanzado las condiciones. Ninguno demuestra la esterilidad.'),
      N('Biològics (com a mínim mensual, i després de reparacions): espores de Bacillus atrophaeus, amb un control sense processar del mateix lot. Incubació a 30–37 °C (segons fabricant). Positiu: tot el material des de l\'últim negatiu es considera no estèril.', 'Biológicos (como mínimo mensual, y tras reparaciones): esporas de Bacillus atrophaeus, con un control sin procesar del mismo lote. Incubación a 30–37 °C (según fabricante). Positivo: todo el material desde el último negativo se considera no estéril.')
    ] },
    { h: N('Seguretat i emmagatzematge', 'Seguridad y almacenamiento'), p: [
      N('No obrir durant el cicle. Deixar refredar dins el forn (orientatiu ≤ 60 °C), guants tèrmics secs, vidre sobre superfície seca i aïllant (xoc tèrmic).', 'No abrir durante el ciclo. Dejar enfriar dentro del horno (orientativo ≤ 60 °C), guantes térmicos secos, vidrio sobre superficie seca y aislante (choque térmico).'),
      N('Emmagatzematge: armaris tancats, 18–22 °C, 35–50 % d\'humitat, separats del terra, FIFO; caducitat segons envàs i protocol del centre.', 'Almacenamiento: armarios cerrados, 18–22 °C, 35–50 % de humedad, separados del suelo, FIFO; caducidad según envase y protocolo del centro.')
    ] }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.SimData = D;
})(this);
