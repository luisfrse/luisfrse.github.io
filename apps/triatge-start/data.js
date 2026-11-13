'use strict';
/* Triatge START · dades d'escenaris (sense DOM).
   Coordenades del mapa: 1600 × 1000 unitats (1 unitat = 0,1 m → 160 × 100 m).
   Zona freda comuna (x ≥ 1180): PMA, estacions de triatge, zona verda (CCP) i entrada d'ambulàncies.
   Textos: objectes {ca, es} (estructura preparada per afegir-hi `en`). */
(function (root) {
  const P = (ca, es) => ({ ca: ca, es: es });

  /* Zona freda comuna a tots els escenaris */
  const COLD = {
    x: 1180,
    start: { x: 1215, y: 560 },          /* on comença el rescatador */
    pma: { x: 1390, y: 150 },            /* lloc mèdic avançat */
    ccp: { x: 1400, y: 495, w: 320, h: 150 },   /* zona verda (lleus que caminen) */
    stations: {
      red: { x: 1315, y: 340, w: 150, h: 100 },
      yellow: { x: 1485, y: 340, w: 150, h: 100 },
      green: { x: 1400, y: 495, w: 320, h: 150 },
      black: { x: 1520, y: 660, w: 120, h: 80 }
    },
    bay: { x: 1390, y: 860 },            /* badia d'ambulàncies */
    entry: { x: 1600, y: 900 }
  };

  const SETTINGS = {
    bus: {
      id: 'bus', icon: 'bus',
      name: P('Autobús accidentat a la carretera', 'Autobús accidentado en la carretera'),
      short: P('Autobús', 'Autobús'),
      brief: P(
        'Un autobús de viatgers ha sortit de la carretera i ha bolcat al voral després de xocar amb un turisme. Hi ha vessament de gasoil al voltant de l\'autobús. Ets la primera persona formada que arriba: els bombers asseguren el vehicle i el vessament, i les ambulàncies van arribant per l\'entrada de la dreta.',
        'Un autobús de viajeros se ha salido de la carretera y ha volcado en el arcén tras chocar con un turismo. Hay vertido de gasóleo alrededor del autobús. Eres la primera persona formada que llega: los bomberos aseguran el vehículo y el vertido, y las ambulancias van llegando por la entrada de la derecha.'),
      hazard: P('Vessament de gasoil i autobús inestable', 'Vertido de gasóleo y autobús inestable'),
      hotClear: P('Bombers: autobús estabilitzat i vessament controlat. Zona calenta accessible.', 'Bomberos: autobús estabilizado y vertido controlado. Zona caliente accesible.'),
      hot: [[360, 540], [860, 520], [880, 790], [380, 800]],
      warm: [[40, 280], [1180, 280], [1180, 990], [40, 990]],
      spots: [[420, 575], [560, 772], [705, 548], [842, 725], [650, 770],
        [250, 520], [180, 660], [320, 700], [140, 880], [300, 960], [960, 600], [1060, 520], [1080, 690], [900, 880], [1040, 950],
        [700, 960], [520, 960], [280, 380], [450, 400], [700, 420], [900, 430], [1100, 860], [160, 460], [1120, 400], [1000, 700],
        [620, 870], [1130, 600], [80, 760], [820, 960]]
    },
    nave: {
      id: 'nave', icon: 'factory',
      name: P('Explosió en una nau industrial', 'Explosión en una nave industrial'),
      short: P('Nau industrial', 'Nave industrial'),
      brief: P(
        'Una explosió ha esfondrat part de la coberta d\'una nau d\'un polígon. Hi ha fum i risc de nous despreniments a l\'interior. Els bombers ventilen i revisen l\'estructura: fins que no ho autoritzin, no es pot entrar a la nau. A fora hi ha treballadors ferits escampats per la zona de càrrega i l\'aparcament.',
        'Una explosión ha hundido parte de la cubierta de una nave de un polígono. Hay humo y riesgo de nuevos desprendimientos en el interior. Los bomberos ventilan y revisan la estructura: hasta que no lo autoricen, no se puede entrar en la nave. Fuera hay trabajadores heridos repartidos por la zona de carga y el aparcamiento.'),
      hazard: P('Fum i risc d\'esfondrament a l\'interior de la nau', 'Humo y riesgo de derrumbe en el interior de la nave'),
      hotClear: P('Bombers: estructura revisada i fum ventilat. Es pot entrar a la nau.', 'Bomberos: estructura revisada y humo ventilado. Se puede entrar en la nave.'),
      hot: [[120, 120], [720, 120], [720, 560], [120, 560]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[240, 240], [420, 300], [600, 460], [300, 470], [560, 220],
        [820, 380], [1060, 180], [1080, 300], [900, 460], [1060, 450], [200, 640], [380, 700], [560, 660], [240, 840], [420, 880],
        [600, 920], [820, 700], [960, 760], [1100, 700], [880, 900], [1060, 920], [700, 620], [120, 940], [1130, 560], [780, 520],
        [980, 340], [140, 700], [660, 780]]
    },
    festival: {
      id: 'festival', icon: 'stage',
      name: P('Esfondrament d\'una estructura en un festival', 'Derrumbe de una estructura en un festival'),
      short: P('Festival', 'Festival'),
      brief: P(
        'Durant un concert a l\'aire lliure, una torre d\'il·luminació i part de l\'estructura de l\'escenari han caigut sobre el públic de les primeres files. La gent corre en totes direccions. L\'estructura caiguda encara té tensió elèctrica fins que els tècnics no tallin el corrent.',
        'Durante un concierto al aire libre, una torre de iluminación y parte de la estructura del escenario han caído sobre el público de las primeras filas. La gente corre en todas direcciones. La estructura caída aún tiene tensión eléctrica hasta que los técnicos no corten la corriente.'),
      hazard: P('Estructura caiguda amb tensió elèctrica', 'Estructura caída con tensión eléctrica'),
      hotClear: P('Tècnics: corrent tallat i estructura assegurada. Zona calenta accessible.', 'Técnicos: corriente cortada y estructura asegurada. Zona caliente accesible.'),
      hot: [[280, 230], [700, 330], [800, 560], [560, 600], [300, 460]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[420, 340], [560, 430], [680, 500], [380, 410], [600, 540],
        [160, 420], [180, 560], [300, 620], [460, 680], [640, 680], [820, 640], [940, 520], [1060, 600], [900, 300], [1060, 300],
        [760, 260], [180, 760], [380, 820], [560, 880], [740, 820], [960, 700], [1100, 760], [160, 920], [700, 940], [1120, 440],
        [840, 460], [260, 960], [1000, 900]]
    },
    tren: {
      id: 'tren', icon: 'train',
      name: P('Descarrilament d\'un tren de rodalia', 'Descarrilamiento de un tren de cercanías'),
      short: P('Tren', 'Tren'),
      brief: P(
        'Un tren de rodalia ha descarrilat a la sortida d\'una corba. El vagó central ha bolcat al costat de la via i ha arrencat la catenària. Fins que no es confirmi el tall de tensió, ningú no pot acostar-se al vagó bolcat. Molts passatgers han sortit pel seu peu i esperen al terraplè.',
        'Un tren de cercanías ha descarrilado a la salida de una curva. El vagón central ha volcado junto a la vía y ha arrancado la catenaria. Hasta que no se confirme el corte de tensión, nadie puede acercarse al vagón volcado. Muchos pasajeros han salido por su propio pie y esperan en el terraplén.'),
      hazard: P('Catenària caiguda (tensió elèctrica) i vagó bolcat', 'Catenaria caída (tensión eléctrica) y vagón volcado'),
      hotClear: P('Adif/bombers: tensió tallada i catenària posada a terra. Zona calenta accessible.', 'Adif/bomberos: tensión cortada y catenaria puesta a tierra. Zona caliente accesible.'),
      hot: [[380, 300], [740, 330], [760, 560], [400, 560]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[470, 380], [640, 482], [520, 500], [700, 370], [430, 485],
        [180, 380], [260, 600], [120, 700], [340, 720], [560, 680], [780, 640], [880, 520], [1000, 420], [1100, 300], [960, 280],
        [820, 330], [200, 860], [420, 900], [640, 860], [860, 820], [1060, 640], [1120, 820], [1000, 960], [300, 200], [560, 200],
        [160, 520], [760, 950], [1100, 540]]
    }
  };

  /* Plantilles de víctimes per «via» de l'algorisme. d = primera impressió (el que es veu en arribar, sense constants).
     site: lloc de la lesió principal; bleed: 'major' (hemorràgia massiva), 'minor' o absent; post: postura. */
  const T = (ca, es, o) => Object.assign({ d: P(ca, es) }, o || {});
  const TEMPLATES = {
    walk: [
      T('Talls superficials a l\'avantbraç i la cara; parla molt nerviós.', 'Cortes superficiales en el antebrazo y la cara; habla muy nervioso.', { site: 'arm', bleed: 'minor', post: 'stand' }),
      T('Es queixa de dolor al canell i se l\'aguanta amb l\'altra mà.', 'Se queja de dolor en la muñeca y se la sujeta con la otra mano.', { site: 'arm', post: 'stand' }),
      T('Cop a l\'espatlla; està desorientat per l\'ensurt però contesta bé.', 'Golpe en el hombro; está aturdido por el susto pero contesta bien.', { site: 'trunk', post: 'stand' }),
      T('Rascades a les cames i molta angoixa; plora.', 'Rasguños en las piernas y mucha angustia; llora.', { site: 'leg', post: 'stand' }),
      T('Tall al front que sagna poc; es pressiona amb un mocador.', 'Corte en la frente que sangra poco; se presiona con un pañuelo.', { site: 'head', bleed: 'minor', post: 'stand' }),
      T('Coixeja per un cop al genoll, però es pot moure.', 'Cojea por un golpe en la rodilla, pero se puede mover.', { site: 'leg', post: 'stand' }),
      T('Cremada lleu a la mà; diu que ha intentat ajudar algú.', 'Quemadura leve en la mano; dice que ha intentado ayudar a alguien.', { site: 'arm', post: 'stand' }),
      T('Dolor al pit en respirar fondo després d\'un cop amb el seient.', 'Dolor en el pecho al respirar hondo tras un golpe con el asiento.', { site: 'trunk', post: 'stand' })
    ],
    yellow: [
      T('Asseguda a terra amb la cama dreta deformada; diu que no s\'hi pot recolzar.', 'Sentada en el suelo con la pierna derecha deformada; dice que no puede apoyarla.', { site: 'leg', post: 'sit' }),
      T('Estirat, amb dolor intens al maluc; no s\'aixeca.', 'Tumbado, con dolor intenso en la cadera; no se levanta.', { site: 'leg', post: 'lie' }),
      T('Assegut contra una paret; té el turmell molt inflat i no pot caminar.', 'Sentado contra una pared; tiene el tobillo muy hinchado y no puede caminar.', { site: 'leg', post: 'sit' }),
      T('Estirada, es queixa de dolor a l\'esquena i no vol moure les cames.', 'Tumbada, se queja de dolor en la espalda y no quiere mover las piernas.', { site: 'trunk', post: 'lie' }),
      T('Ferida a la cuixa que sagna poc; li fa massa mal per caminar.', 'Herida en el muslo que sangra poco; le duele demasiado para caminar.', { site: 'leg', bleed: 'minor', post: 'sit' }),
      T('Estirat amb el braç i la clavícula deformats; mareig quan intenta aixecar-se.', 'Tumbado con el brazo y la clavícula deformados; mareo cuando intenta levantarse.', { site: 'arm', post: 'lie' })
    ],
    airway: [
      T('Estirat panxa enlaire, immòbil; no respon quan li parles.', 'Tumbado boca arriba, inmóvil; no responde cuando le hablas.', { site: 'head', post: 'lie' }),
      T('Estirada de costat amb la cara cap avall; no es mou.', 'Tumbada de lado con la cara hacia abajo; no se mueve.', { site: 'head', post: 'lie' }),
      T('Inconscient al costat de les restes; té una contusió al cap.', 'Inconsciente junto a los restos; tiene una contusión en la cabeza.', { site: 'head', post: 'lie' })
    ],
    rr: [
      T('Assegut, molt pàl·lid; respira de pressa i amb molt d\'esforç.', 'Sentado, muy pálido; respira deprisa y con mucho esfuerzo.', { site: 'trunk', post: 'sit' }),
      T('Estirada amb un cop fort al tòrax; diu que li falta l\'aire.', 'Tumbada con un golpe fuerte en el tórax; dice que le falta el aire.', { site: 'trunk', post: 'lie' }),
      T('Atrapat de cames per les restes; respira de manera ràpida i superficial.', 'Atrapado de piernas por los restos; respira de forma rápida y superficial.', { site: 'leg', post: 'lie' }),
      T('Ha inhalat fum; tus i respira molt de pressa.', 'Ha inhalado humo; tose y respira muy deprisa.', { site: 'trunk', post: 'sit' })
    ],
    bleed: [
      T('Estirat amb una ferida a la cuixa que sagna a raig; hi ha un bassal de sang.', 'Tumbado con una herida en el muslo que sangra a chorro; hay un charco de sangre.', { site: 'leg', bleed: 'major', post: 'lie' }),
      T('Assegut, amb el braç esquinçat per un vidre; la sang no para.', 'Sentado, con el brazo desgarrado por un cristal; la sangre no para.', { site: 'arm', bleed: 'major', post: 'sit' }),
      T('Estirada amb la cama atrapada i una ferida que sagna molt sota el genoll.', 'Tumbada con la pierna atrapada y una herida que sangra mucho bajo la rodilla.', { site: 'leg', bleed: 'major', post: 'lie' })
    ],
    bleedJunction: [
      T('Estirat, amb una ferida a l\'engonal que sagna abundantment.', 'Tumbado, con una herida en la ingle que sangra abundantemente.', { site: 'groin', bleed: 'major', post: 'lie' })
    ],
    shock: [
      T('Estirada, pàl·lida i suada; es queixa de dolor a la panxa.', 'Tumbada, pálida y sudorosa; se queja de dolor en la barriga.', { site: 'trunk', post: 'lie' }),
      T('Estirat amb dolor a la pelvis; té la pell freda i humida.', 'Tumbado con dolor en la pelvis; tiene la piel fría y húmeda.', { site: 'trunk', post: 'lie' }),
      T('Assegut, molt pàl·lid i amb set; diu que està marejat.', 'Sentado, muy pálido y con sed; dice que está mareado.', { site: 'trunk', post: 'sit' })
    ],
    mental: [
      T('Estirat amb un cop al cap; té els ulls oberts però murmura coses sense sentit.', 'Tumbado con un golpe en la cabeza; tiene los ojos abiertos pero murmura cosas sin sentido.', { site: 'head', post: 'lie' }),
      T('Asseguda i confusa; no sap on és i no fa cas del que li dius.', 'Sentada y confusa; no sabe dónde está y no hace caso de lo que le dices.', { site: 'head', post: 'sit' }),
      T('Estirat, gemega i es mou, però no contesta a les preguntes.', 'Tumbado, gime y se mueve, pero no contesta a las preguntas.', { site: 'head', post: 'lie' })
    ],
    black: [
      T('Estirat entre les restes, immòbil; traumatisme greu al cap.', 'Tumbado entre los restos, inmóvil; traumatismo grave en la cabeza.', { site: 'head', post: 'lie' }),
      T('Estirada sota part de l\'estructura; no es mou gens.', 'Tumbada bajo parte de la estructura; no se mueve nada.', { site: 'trunk', post: 'lie' }),
      T('Immòbil, amb el tòrax aixafat per l\'impacte.', 'Inmóvil, con el tórax aplastado por el impacto.', { site: 'trunk', post: 'lie' })
    ],
    /* Pediàtriques (JumpSTART) */
    jWalk: [
      T('Nen que plora i va de la mà d\'un adult; té rascades als genolls.', 'Niño que llora y va de la mano de un adulto; tiene rasguños en las rodillas.', { site: 'leg', post: 'stand' })
    ],
    jRr: [
      T('Nena estirada, molt pàl·lida; respira molt de pressa.', 'Niña tumbada, muy pálida; respira muy deprisa.', { site: 'trunk', post: 'lie' })
    ],
    jRescue: [
      T('Nen immòbil estirat a terra; no respon.', 'Niño inmóvil tumbado en el suelo; no responde.', { site: 'head', post: 'lie' })
    ],
    jMental: [
      T('Nena estirada amb un cop al cap; té els ulls tancats.', 'Niña tumbada con un golpe en la cabeza; tiene los ojos cerrados.', { site: 'head', post: 'lie' })
    ],
    jYellow: [
      T('Nen assegut que plora; té el braç deformat i no es vol moure.', 'Niño sentado que llora; tiene el brazo deformado y no se quiere mover.', { site: 'arm', post: 'sit' })
    ]
  };

  const HOSPITALS = [
    { id: 'H1', kind: 'trauma', name: P('Hospital de trauma (UCI)', 'Hospital de trauma (UCI)'), short: P('Trauma', 'Trauma') },
    { id: 'H2', kind: 'general', name: P('Hospital general comarcal', 'Hospital general comarcal'), short: P('General', 'General') },
    { id: 'H3', kind: 'cuap', name: P('Centre d\'urgències d\'atenció primària', 'Centro de urgencias de atención primaria'), short: P('CUAP', 'CUAP') }
  ];

  /* Banc del mode avaluable: mateixa mida i dificultat (composició idèntica), escenari i posicions diferents. */
  const BANK = [
    { setting: 'bus', seed: 'AV-BUS-1', n: 14, difficulty: 'normal' },
    { setting: 'bus', seed: 'AV-BUS-2', n: 14, difficulty: 'normal' },
    { setting: 'nave', seed: 'AV-NAU-1', n: 14, difficulty: 'normal' },
    { setting: 'nave', seed: 'AV-NAU-2', n: 14, difficulty: 'normal' },
    { setting: 'festival', seed: 'AV-FES-1', n: 14, difficulty: 'normal' },
    { setting: 'festival', seed: 'AV-FES-2', n: 14, difficulty: 'normal' },
    { setting: 'tren', seed: 'AV-TRE-1', n: 14, difficulty: 'normal' },
    { setting: 'tren', seed: 'AV-TRE-2', n: 14, difficulty: 'normal' }
  ];

  /* Escenari fix del mode guiat (petit i amb tots els camins de l'algorisme) */
  const GUIDED = { setting: 'bus', seed: 'GUIA-1', n: 13, difficulty: 'easy', guided: true };
  const CHALLENGE = { n: 16, difficulty: 'hard', realSeconds: 600 };

  const D = {
    slug: 'sim-triatge-start', version: '2.0.0',
    author: 'Luis Franco Serrano',
    COLD: COLD, SETTINGS: SETTINGS, TEMPLATES: TEMPLATES, HOSPITALS: HOSPITALS, BANK: BANK, GUIDED: GUIDED, CHALLENGE: CHALLENGE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.TriageData = D;
})(this);
