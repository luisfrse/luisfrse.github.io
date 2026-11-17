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

  /* Mapes grans (gran catàstrofe): 2400 × 1500 unitats; la zona freda comuna es desplaça (dx, dy) a la dreta i al centre.
     Punts de víctima en una graella regular amb petit desplaçament, excloent edificis i elements (determinista). */
  const BIG_MAP = { w: 2400, h: 1500 }, BIG_COLD = { dx: 800, dy: 250 };
  function gridSpots(avoid) {
    const out = [];
    for (let y = 90; y <= 1420; y += 120) for (let x = 90; x <= 1900; x += 135) {
      const px = x + ((y / 120) % 2 ? 50 : 0), py = y + ((x / 135) % 3) * 12;
      if (px > 1940) continue;
      if (avoid.some((r) => px >= r[0] - 20 && px <= r[2] + 20 && py >= r[1] - 20 && py <= r[3] + 20)) continue;
      out.push([px, py]);
    }
    return out;
  }
  const SETTINGS = {
    bus: {
      id: 'bus', icon: 'bus', ambience: 'road',
      name: P('Autobús accidentat a la carretera', 'Autobús accidentado en la carretera'),
      short: P('Autobús', 'Autobús'),
      brief: P(
        'Un autobús de viatgers ha sortit de la carretera i ha bolcat al voral després de xocar amb un turisme. Hi ha vessament de gasoil al voltant de l\'autobús. Ets la primera persona formada que arriba: els bombers asseguren el vehicle i el vessament, i les ambulàncies van arribant per l\'entrada de la dreta.',
        'Un autobús de viajeros se ha salido de la carretera y ha volcado en el arcén tras chocar con un turismo. Hay vertido de gasóleo alrededor del autobús. Eres la primera persona formada que llega: los bomberos aseguran el vehículo y el vertido, y las ambulancias van llegando por la entrada de la derecha.'),
      hazard: P('Vessament de gasoil i autobús inestable', 'Vertido de gasóleo y autobús inestable'),
      hotClear: P('Bombers: autobús estabilitzat i vessament controlat. Zona calenta accessible.', 'Bomberos: autobús estabilizado y vertido controlado. Zona caliente accesible.'),
      hazard2: { kind: 'fire', poly: [[800, 640], [1080, 640], [1080, 900], [800, 900]], safe: [1215, 560], text: P('Perill nou: el turisme accidentat ha començat a cremar. Els bombers allunyen tothom 30 metres: no t\'hi acostis.', 'Peligro nuevo: el turismo accidentado ha empezado a arder. Los bomberos alejan a todo el mundo 30 metros: no te acerques.'), clear: P('Bombers: foc del turisme extingit. Es pot tornar a la zona.', 'Bomberos: fuego del turismo extinguido. Se puede volver a la zona.') },
      hot: [[360, 540], [860, 520], [880, 790], [380, 800]],
      warm: [[40, 280], [1180, 280], [1180, 990], [40, 990]],
      spots: [[420, 575], [560, 772], [705, 548], [842, 725], [650, 770],
        [250, 520], [180, 660], [320, 700], [140, 880], [300, 960], [960, 600], [1060, 520], [1080, 690], [900, 880], [1040, 950],
        [700, 960], [520, 960], [280, 380], [450, 400], [700, 420], [900, 430], [1100, 860], [160, 460], [1120, 400], [1000, 700],
        [620, 870], [1130, 600], [80, 760], [820, 960]]
    },
    nave: {
      id: 'nave', icon: 'factory', ambience: 'industrial',
      name: P('Explosió en una nau industrial', 'Explosión en una nave industrial'),
      short: P('Nau industrial', 'Nave industrial'),
      brief: P(
        'Una explosió ha esfondrat part de la coberta d\'una nau d\'un polígon. Hi ha fum i risc de nous despreniments a l\'interior. Els bombers ventilen i revisen l\'estructura: fins que no ho autoritzin, no es pot entrar a la nau. A fora hi ha treballadors ferits escampats per la zona de càrrega i l\'aparcament.',
        'Una explosión ha hundido parte de la cubierta de una nave de un polígono. Hay humo y riesgo de nuevos desprendimientos en el interior. Los bomberos ventilan y revisan la estructura: hasta que no lo autoricen, no se puede entrar en la nave. Fuera hay trabajadores heridos repartidos por la zona de carga y el aparcamiento.'),
      hazard: P('Fum i risc d\'esfondrament a l\'interior de la nau', 'Humo y riesgo de derrumbe en el interior de la nave'),
      hotClear: P('Bombers: estructura revisada i fum ventilat. Es pot entrar a la nau.', 'Bomberos: estructura revisada y humo ventilado. Se puede entrar en la nave.'),
      hazard2: { kind: 'collapse', poly: [[760, 130], [1010, 130], [1010, 360], [760, 360]], safe: [1215, 560], text: P('Perill nou: els contenidors i la marquesina cruixen i amenacen de caure. Sortiu de la zona!', 'Peligro nuevo: los contenedores y la marquesina crujen y amenazan con caer. ¡Salid de la zona!'), clear: P('Bombers: marquesina apuntalada. Zona accessible de nou.', 'Bomberos: marquesina apuntalada. Zona accesible de nuevo.') },
      hot: [[120, 120], [720, 120], [720, 560], [120, 560]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[240, 240], [420, 300], [600, 460], [300, 470], [560, 220],
        [820, 380], [1060, 180], [1080, 300], [900, 460], [1060, 450], [200, 640], [380, 700], [560, 660], [240, 840], [420, 880],
        [600, 920], [820, 700], [960, 760], [1100, 700], [880, 900], [1060, 920], [700, 620], [120, 940], [1130, 560], [780, 520],
        [980, 340], [140, 700], [660, 780]]
    },
    festival: {
      id: 'festival', icon: 'stage', ambience: 'crowd',
      name: P('Esfondrament d\'una estructura en un festival', 'Derrumbe de una estructura en un festival'),
      short: P('Festival', 'Festival'),
      brief: P(
        'Durant un concert a l\'aire lliure, una torre d\'il·luminació i part de l\'estructura de l\'escenari han caigut sobre el públic de les primeres files. La gent corre en totes direccions. L\'estructura caiguda encara té tensió elèctrica fins que els tècnics no tallin el corrent.',
        'Durante un concierto al aire libre, una torre de iluminación y parte de la estructura del escenario han caído sobre el público de las primeras filas. La gente corre en todas direcciones. La estructura caída aún tiene tensión eléctrica hasta que los técnicos no corten la corriente.'),
      hazard: P('Estructura caiguda amb tensió elèctrica', 'Estructura caída con tensión eléctrica'),
      hotClear: P('Tècnics: corrent tallat i estructura assegurada. Zona calenta accessible.', 'Técnicos: corriente cortada y estructura asegurada. Zona caliente accesible.'),
      hazard2: { kind: 'collapse', poly: [[820, 230], [1130, 230], [1130, 480], [820, 480]], safe: [1215, 560], text: P('Perill nou: una segona torre de so s\'inclina sobre la zona de les food trucks. Tothom fora!', 'Peligro nuevo: una segunda torre de sonido se inclina sobre la zona de las food trucks. ¡Todo el mundo fuera!'), clear: P('Tècnics: segona torre assegurada. Es pot tornar a entrar.', 'Técnicos: segunda torre asegurada. Se puede volver a entrar.') },
      hot: [[280, 230], [700, 330], [800, 560], [560, 600], [300, 460]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[420, 340], [560, 430], [680, 500], [380, 410], [600, 540],
        [160, 420], [180, 560], [300, 620], [460, 680], [640, 680], [820, 640], [940, 520], [1060, 600], [900, 300], [1060, 300],
        [760, 260], [180, 760], [380, 820], [560, 880], [740, 820], [960, 700], [1100, 760], [160, 920], [700, 940], [1120, 440],
        [840, 460], [260, 960], [1000, 900]]
    },
    tren: {
      id: 'tren', icon: 'train', ambience: 'rail',
      name: P('Descarrilament d\'un tren de rodalia', 'Descarrilamiento de un tren de cercanías'),
      short: P('Tren', 'Tren'),
      brief: P(
        'Un tren de rodalia ha descarrilat a la sortida d\'una corba. El vagó central ha bolcat al costat de la via i ha arrencat la catenària. Fins que no es confirmi el tall de tensió, ningú no pot acostar-se al vagó bolcat. Molts passatgers han sortit pel seu peu i esperen al terraplè.',
        'Un tren de cercanías ha descarrilado a la salida de una curva. El vagón central ha volcado junto a la vía y ha arrancado la catenaria. Hasta que no se confirme el corte de tensión, nadie puede acercarse al vagón volcado. Muchos pasajeros han salido por su propio pie y esperan en el terraplén.'),
      hazard: P('Catenària caiguda (tensió elèctrica) i vagó bolcat', 'Catenaria caída (tensión eléctrica) y vagón volcado'),
      hotClear: P('Adif/bombers: tensió tallada i catenària posada a terra. Zona calenta accessible.', 'Adif/bomberos: tensión cortada y catenaria puesta a tierra. Zona caliente accesible.'),
      hazard2: { kind: 'wire', poly: [[100, 560], [420, 560], [420, 800], [100, 800]], safe: [1215, 560], text: P('Perill nou: cau un altre tram de catenària prop del terraplè. No us hi acosteu fins que no es confirmi el tall.', 'Peligro nuevo: cae otro tramo de catenaria cerca del terraplén. No os acerquéis hasta que se confirme el corte.'), clear: P('Adif: segon tram sense tensió i posat a terra. Zona accessible.', 'Adif: segundo tramo sin tensión y puesto a tierra. Zona accesible.') },
      hot: [[380, 300], [740, 330], [760, 560], [400, 560]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[470, 380], [640, 482], [520, 500], [700, 370], [430, 485],
        [180, 380], [260, 600], [120, 700], [340, 720], [560, 680], [780, 640], [880, 520], [1000, 420], [1100, 300], [960, 280],
        [820, 330], [200, 860], [420, 900], [640, 860], [860, 820], [1060, 640], [1120, 820], [1000, 960], [300, 200], [560, 200],
        [160, 520], [760, 950], [1100, 540]]
    },

    /* ---------- escenaris nous (ext: perfils ampliats; no entren a l'elecció aleatòria per llavor) ---------- */
    terremoto: {
      id: 'terremoto', icon: 'quake', ambience: 'quake', ext: true, alwaysHazard: true,
      name: P('Terratrèmol: edifici d\'habitatges esfondrat', 'Terremoto: edificio de viviendas derrumbado'),
      short: P('Terratrèmol', 'Terremoto'),
      brief: P(
        'Un terratrèmol de magnitud moderada ha fet caure bona part d\'un edifici de quatre plantes. Hi ha veïns atrapats sota la runa i ferits pel carrer. Els bombers i la unitat de rescat urbà (USAR) apuntalen l\'estructura: fins que no ho autoritzin, ningú no pot pujar a la runa. Es poden produir rèpliques.',
        'Un terremoto de magnitud moderada ha hecho caer buena parte de un edificio de cuatro plantas. Hay vecinos atrapados bajo los escombros y heridos por la calle. Los bomberos y la unidad de rescate urbano (USAR) apuntalan la estructura: hasta que no lo autoricen, nadie puede subir a los escombros. Pueden producirse réplicas.'),
      hazard: P('Runa inestable de l\'edifici esfondrat', 'Escombros inestables del edificio derrumbado'),
      hotClear: P('Bombers/USAR: runa apuntalada i fuita de gas tallada. Es pot accedir a les víctimes de la runa.', 'Bomberos/USAR: escombros apuntalados y fuga de gas cortada. Se puede acceder a las víctimas de los escombros.'),
      hazard2: { kind: 'quake', poly: [[780, 100], [1160, 100], [1160, 470], [780, 470]], safe: [1215, 620], text: P('Rèplica! La façana de l\'edifici del costat s\'esquerda i deixa caure cascots. Tothom fora d\'aquesta zona.', '¡Réplica! La fachada del edificio de al lado se agrieta y deja caer cascotes. Todo el mundo fuera de esta zona.'), clear: P('Bombers: façana revisada i zona acordonada amb pas segur. Es pot tornar a entrar.', 'Bomberos: fachada revisada y zona acordonada con paso seguro. Se puede volver a entrar.') },
      hot: [[250, 190], [710, 190], [740, 560], [230, 560]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[320, 260], [480, 240], [630, 300], [400, 420], [560, 480], [300, 510],
        [120, 180], [140, 330], [110, 480], [120, 640], [210, 760], [360, 700], [520, 760], [680, 700], [840, 760], [1000, 700],
        [1120, 790], [160, 900], [380, 920], [600, 900], [820, 920], [1060, 920], [860, 560], [1000, 580], [1120, 540], [780, 620],
        [880, 300], [1050, 360], [960, 420], [820, 180]],
      profiles: { green: ['pElderW', 'pAnxiety', 'pDeaf', 'pHidden'], yellow: ['pElderY', 'pWheel', 'pImpaled'], rr: ['pCrushR'], mental: ['pHeadOld'], perf: [], bleed: ['pAmput'], airway: ['pAirwayP'], black: ['pBlack'] },
      forceProfiles: ['pCrush'],
      lessons: [
        P('No pugis a una estructura col·lapsada: hi entren els bombers i els equips USAR quan l\'han apuntalada. La teva feina és triar i organitzar fora.', 'No subas a una estructura colapsada: entran los bomberos y los equipos USAR cuando la han apuntalado. Tu trabajo es triar y organizar fuera.'),
        P('Les rèpliques són habituals: localitza zones segures i camins de fugida, i allunya\'t de façanes esquerdades.', 'Las réplicas son habituales: localiza zonas seguras y caminos de huida, y aléjate de fachadas agrietadas.'),
        P('Síndrome d\'aixafament: qui ha estat atrapat molta estona pot semblar estable i entrar en xoc en alliberar-lo. Revalora els atrapats.', 'Síndrome de aplastamiento: quien ha estado atrapado mucho rato puede parecer estable y entrar en shock al liberarlo. Revalora a los atrapados.'),
        P('START no canvia per l\'escenari: camina?, respira?, FR > 30?, perfusió, obeeix ordres?', 'START no cambia por el escenario: ¿camina?, ¿respira?, ¿FR > 30?, perfusión, ¿obedece órdenes?')
      ]
    },
    incendio: {
      id: 'incendio', icon: 'fire', ambience: 'fire', ext: true,
      name: P('Incendi en un bloc d\'habitatges', 'Incendio en un bloque de viviendas'),
      short: P('Incendi', 'Incendio'),
      brief: P(
        'S\'ha declarat un incendi a la planta baixa d\'un bloc de pisos i el fum ha pujat per l\'escala. Molts veïns han sortit al carrer; d\'altres els han tret els bombers. Sense equip de respiració no es pot entrar a l\'edifici ni a la zona de fum de davant del portal.',
        'Se ha declarado un incendio en la planta baja de un bloque de pisos y el humo ha subido por la escalera. Muchos vecinos han salido a la calle; a otros los han sacado los bomberos. Sin equipo de respiración no se puede entrar en el edificio ni en la zona de humo delante del portal.'),
      hazard: P('Fum i foc a l\'edifici i davant del portal', 'Humo y fuego en el edificio y delante del portal'),
      hotClear: P('Bombers: foc controlat i fum ventilat. Es pot accedir a la zona del portal.', 'Bomberos: fuego controlado y humo ventilado. Se puede acceder a la zona del portal.'),
      hazard2: { kind: 'fire', poly: [[770, 110], [1010, 110], [1010, 430], [770, 430]], safe: [1215, 620], text: P('Perill nou: el foc passa al local del costat i cauen vidres de la façana. Allunyeu-vos!', 'Peligro nuevo: el fuego pasa al local de al lado y caen cristales de la fachada. ¡Alejaos!'), clear: P('Bombers: foc del local extingit i façana sanejada.', 'Bomberos: fuego del local extinguido y fachada saneada.') },
      hot: [[300, 110], [760, 110], [760, 470], [300, 470]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[380, 200], [560, 180], [680, 280], [420, 400], [600, 420],
        [100, 80], [290, 500], [120, 500], [260, 560], [430, 600], [620, 560], [820, 560], [1000, 520], [1120, 600], [1080, 320],
        [1080, 200], [180, 700], [360, 760], [560, 720], [760, 700], [960, 760], [1120, 820], [140, 900], [380, 940], [620, 920],
        [880, 920], [1060, 960], [1120, 440], [700, 860]],
      profiles: { green: ['pSmokeW', 'pBurnW', 'pElderW', 'pAnxiety', 'pPregW'], yellow: ['pBurnY', 'pElderY', 'pImpaled'], rr: ['pSmokeR', 'pBurnR'], mental: ['pHeadOld'], perf: [], bleed: [], airway: ['pAirwayP'], black: ['pBlack'] },
      redRoutes: ['rr', 'airway', 'rr', 'bleed', 'mental', 'shock', 'rr'],
      forceProfiles: ['pSmokeR', 'pBurnY'],
      lessons: [
        P('Sense equip de respiració autònoma no s\'entra al fum: rescaten els bombers i tu tries a fora.', 'Sin equipo de respiración autónoma no se entra en el humo: rescatan los bomberos y tú haces el triaje fuera.'),
        P('Inhalació de fum: veu ronca, sutge al nas o la boca, tos i soroll en respirar indiquen risc per a la via aèria; FR > 30 = vermell.', 'Inhalación de humo: voz ronca, hollín en la nariz o la boca, tos y ruido al respirar indican riesgo para la vía aérea; FR > 30 = rojo.'),
        P('Les cremades extenses impressionen, però START classifica per la fisiologia. Refredar amb aigua no ha de retardar el triatge.', 'Las quemaduras extensas impresionan, pero START clasifica por la fisiología. Enfriar con agua no debe retrasar el triaje.'),
        P('El monòxid de carboni pot causar confusió sense ferides visibles: si no obeeix ordres, vermell.', 'El monóxido de carbono puede causar confusión sin heridas visibles: si no obedece órdenes, rojo.')
      ]
    },
    atropello: {
      id: 'atropello', icon: 'van', ambience: 'road', ext: true,
      name: P('Atropellament múltiple en una parada d\'autobús', 'Atropello múltiple en una parada de autobús'),
      short: P('Atropellament', 'Atropello'),
      brief: P(
        'Una furgoneta s\'ha enfilat a la vorera i ha atropellat les persones que esperaven a la parada de l\'autobús i a la terrassa d\'un bar. El conductor ha patit un desmai. La furgoneta perd combustible i té el motor calent: fins que la policia i els bombers no l\'assegurin, no us hi acosteu.',
        'Una furgoneta se ha subido a la acera y ha atropellado a las personas que esperaban en la parada del autobús y en la terraza de un bar. El conductor ha sufrido un desmayo. La furgoneta pierde combustible y tiene el motor caliente: hasta que la policía y los bomberos no la aseguren, no os acerquéis.'),
      hazard: P('Furgoneta amb vessament de combustible i motor calent', 'Furgoneta con vertido de combustible y motor caliente'),
      hotClear: P('Policia i bombers: furgoneta assegurada, motor aturat i vessament recollit. Zona accessible.', 'Policía y bomberos: furgoneta asegurada, motor parado y vertido recogido. Zona accesible.'),
      hazard2: { kind: 'collapse', poly: [[800, 560], [1090, 560], [1090, 810], [800, 810]], safe: [1215, 520], text: P('Perill nou: l\'estructura del tendal de la terrassa, colpejada, cedeix i amenaça de caure.', 'Peligro nuevo: la estructura del toldo de la terraza, golpeada, cede y amenaza con caer.'), clear: P('Bombers: tendal desmuntat. Es pot tornar a la terrassa.', 'Bomberos: toldo desmontado. Se puede volver a la terraza.') },
      hot: [[470, 370], [770, 370], [770, 610], [470, 610]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[540, 430], [680, 450], [560, 560], [720, 560],
        [120, 200], [300, 180], [480, 200], [660, 220], [860, 200], [1060, 220], [140, 380], [320, 420], [140, 560], [340, 600],
        [880, 420], [1060, 440], [860, 640], [1000, 700], [1120, 620], [220, 780], [420, 760], [620, 780], [820, 900], [1040, 900],
        [160, 920], [420, 930], [640, 920], [960, 520]],
      profiles: { green: ['pElderW', 'pAnxiety', 'pPregW', 'pDeaf', 'pHidden'], yellow: ['pElderY', 'pPregY', 'pWheel', 'pImpaled'], rr: ['pCrushR'], mental: ['pHeadOld'], perf: [], bleed: ['pAmput'], airway: [], black: ['pBlack'] },
      redRoutes: ['bleed', 'mental', 'rr', 'shock', 'airway', 'mental', 'bleed'],
      forceProfiles: ['pHidden'],
      lessons: [
        P('Primer la seguretat viària: armilla, senyalitzar, que la policia talli el trànsit i que el vehicle tingui el motor aturat.', 'Primero la seguridad vial: chaleco, señalizar, que la policía corte el tráfico y que el vehículo tenga el motor parado.'),
        P('Mecanisme d\'alta energia: qui camina pot tenir lesions internes ocultes. Revalora també els verds.', 'Mecanismo de alta energía: quien camina puede tener lesiones internas ocultas. Revalora también a los verdes.'),
        P('Els traumatismes cranials són freqüents en atropellaments: si no obeeix ordres, vermell, encara que respiri bé.', 'Los traumatismos craneales son frecuentes en atropellos: si no obedece órdenes, rojo, aunque respire bien.'),
        P('Gent gran i infants són més vulnerables; START no canvia (JumpSTART en infants).', 'Personas mayores y niños son más vulnerables; START no cambia (JumpSTART en niños).')
      ]
    },
    tiroteo: {
      id: 'tiroteo', icon: 'gun', ambience: 'shooting', ext: true, contentWarning: true, hotK: 1.25,
      threatLabel: P('Amenaça activa: zona calenta sense assegurar', 'Amenaza activa: zona caliente sin asegurar'),
      name: P('Tiroteig en un centre comercial', 'Tiroteo en un centro comercial'),
      short: P('Tiroteig', 'Tiroteo'),
      brief: P(
        'Un agressor ha disparat dins d\'un centre comercial. Molta gent ha fugit cap a l\'aparcament i la plaça, i hi ha ferits per arma de foc fora i dins de l\'edifici. La policia encara busca l\'agressor a l\'interior: l\'edifici és ZONA CALENTA i el personal sanitari no hi entra fins que la policia no l\'asseguri. Fora, a la zona tèbia, prioritza aturar les hemorràgies massives i evacuar ràpidament.',
        'Un agresor ha disparado dentro de un centro comercial. Mucha gente ha huido hacia el aparcamiento y la plaza, y hay heridos por arma de fuego fuera y dentro del edificio. La policía aún busca al agresor en el interior: el edificio es ZONA CALIENTE y el personal sanitario no entra hasta que la policía lo asegure. Fuera, en la zona templada, prioriza detener las hemorragias masivas y evacuar rápidamente.'),
      hazard: P('Amenaça activa dins del centre comercial', 'Amenaza activa dentro del centro comercial'),
      hotClear: P('Policia: agressor neutralitzat i edifici assegurat. Els equips sanitaris poden entrar amb escorta.', 'Policía: agresor neutralizado y edificio asegurado. Los equipos sanitarios pueden entrar con escolta.'),
      hazard2: { kind: 'threat', poly: [[780, 600], [1160, 600], [1160, 970], [780, 970]], safe: [1215, 420], text: P('Avís de la policia: possible segon agressor a l\'aparcament. Zona tancada fins a nova ordre; retireu-vos a cobert.', 'Aviso de la policía: posible segundo agresor en el aparcamiento. Zona cerrada hasta nueva orden; retiraos a cubierto.'), clear: P('Policia: aparcament revisat, falsa alarma. Es pot tornar a la zona.', 'Policía: aparcamiento revisado, falsa alarma. Se puede volver a la zona.') },
      hot: [[120, 120], [760, 120], [760, 560], [120, 560]],
      warm: [[40, 40], [1180, 40], [1180, 990], [40, 990]],
      spots: [[220, 220], [420, 260], [620, 220], [300, 440], [560, 460],
        [60, 200], [60, 400], [60, 620], [200, 640], [360, 620], [520, 660], [680, 620], [860, 180], [1000, 160], [1120, 260],
        [880, 340], [1040, 400], [900, 520], [1100, 560], [180, 780], [340, 820], [520, 780], [700, 800], [860, 700], [1000, 720],
        [1120, 820], [200, 940], [440, 940], [660, 940], [900, 920], [1080, 960]],
      redRoutes: ['bleed', 'rr', 'bleed', 'shock', 'bleedJunction', 'airway', 'bleed'],
      profiles: { green: ['pAnxiety', 'pDeaf', 'pHidden'], yellow: ['pImpaled', 'pElderY', 'pPregY'], rr: ['pGswChest'], mental: [], perf: ['pGswAbd'], bleed: ['pGswLimb', 'pGswJunc'], airway: [], black: ['pBlackGsw'] },
      poolP: { red: 0.8, black: 1 },
      forceProfiles: ['pGswLimb', 'pGswChest'],
      lessons: [
        P('THREAT (Consens de Hartford): supressió de l\'amenaça (policia), control de l\'hemorràgia, extracció ràpida a lloc segur, valoració per sanitaris i trasllat a l\'hospital.', 'THREAT (Consenso de Hartford): supresión de la amenaza (policía), control de la hemorragia, extracción rápida a lugar seguro, valoración por sanitarios y traslado al hospital.'),
        P('Zona calenta = amenaça directa: el personal sanitari no hi entra fins que la policia l\'asseguri. Zona tèbia = amenaça indirecta: atenció amb mesures de seguretat. Zona freda: PMA i evacuació.', 'Zona caliente = amenaza directa: el personal sanitario no entra hasta que la policía la asegure. Zona templada = amenaza indirecta: atención con medidas de seguridad. Zona fría: PMA y evacuación.'),
        P('La primera causa de mort evitable és l\'hemorràgia: torniquet alt i fort a les extremitats i compressió o farciment a l\'engonal, l\'aixella o el coll. Cap ferit no hauria de morir per una hemorràgia que es podia aturar.', 'La primera causa de muerte evitable es la hemorragia: torniquete alto y fuerte en las extremidades y compresión o taponamiento en ingle, axila o cuello. Ningún herido debería morir por una hemorragia que se podía detener.'),
        P('Triatge ràpid i evacuació ràpida: les ferides penetrants al tòrax i a l\'abdomen necessiten cirurgia; no et quedis estabilitzant a l\'escena.', 'Triaje rápido y evacuación rápida: las heridas penetrantes en tórax y abdomen necesitan cirugía; no te quedes estabilizando en la escena.')
      ],
      sources: P('Fonts: Consens de Hartford I-III (American College of Surgeons, 2013-2015; Stop the Bleed); directrius TECC del Committee for Tactical Emergency Casualty Care (fases d\'amenaça directa, indirecta i evacuació, 2019); mètode START. Simplificació didàctica: segueix sempre el protocol del teu servei.', 'Fuentes: Consenso de Hartford I-III (American College of Surgeons, 2013-2015; Stop the Bleed); directrices TECC del Committee for Tactical Emergency Casualty Care (fases de amenaza directa, indirecta y evacuación, 2019); método START. Simplificación didáctica: sigue siempre el protocolo de tu servicio.')
    },

    /* ---------- gran catàstrofe (30–50 víctimes, mapa gran, diverses zones de treball, més ambulàncies) ---------- */
    sismo: {
      id: 'sismo', icon: 'quake', ambience: 'quake', ext: true, big: true, alwaysHazard: true, map: BIG_MAP, cold: BIG_COLD,
      name: P('Gran catàstrofe: terratrèmol en un barri', 'Gran catástrofe: terremoto en un barrio'),
      short: P('Terratrèmol (barri)', 'Terremoto (barrio)'),
      brief: P(
        'Un terratrèmol fort ha esfondrat tres edificis d\'un barri residencial i n\'ha deixat d\'altres esquerdats. Hi ha desenes de ferits pels carrers i atrapats a la runa. Cada edifici esfondrat és una zona calenta diferent: els equips USAR les van apuntalant una per una. Arriben moltes ambulàncies, de dues en dues, i dos autobusos sanitaris. Hi haurà rèpliques.',
        'Un terremoto fuerte ha derrumbado tres edificios de un barrio residencial y ha dejado otros agrietados. Hay decenas de heridos por las calles y atrapados en los escombros. Cada edificio derrumbado es una zona caliente distinta: los equipos USAR las van apuntalando una por una. Llegan muchas ambulancias, de dos en dos, y dos autobuses sanitarios. Habrá réplicas.'),
      hazard: P('Edificis esfondrats amb runa inestable', 'Edificios derrumbados con escombros inestables'),
      hotClear: P('USAR: totes les zones de runa apuntalades.', 'USAR: todas las zonas de escombros apuntaladas.'),
      hots: [
        { poly: [[200, 120], [640, 120], [660, 440], [180, 440]], k: 1, name: P('Edifici A (nord-oest)', 'Edificio A (noroeste)'), clear: P('USAR: edifici A apuntalat. Ja s\'hi pot accedir.', 'USAR: edificio A apuntalado. Ya se puede acceder.') },
        { poly: [[1100, 620], [1600, 620], [1620, 960], [1080, 960]], k: 1.6, name: P('Edifici B (centre)', 'Edificio B (centro)'), clear: P('USAR: edifici B apuntalat i gas tallat. Ja s\'hi pot accedir.', 'USAR: edificio B apuntalado y gas cortado. Ya se puede acceder.') },
        { poly: [[160, 1120], [640, 1120], [660, 1420], [140, 1420]], k: 2.2, name: P('Edifici C (sud-oest)', 'Edificio C (suroeste)'), clear: P('USAR: edifici C apuntalat. Ja s\'hi pot accedir.', 'USAR: edificio C apuntalado. Ya se puede acceder.') }
      ],
      hot: [[200, 120], [640, 120], [660, 440], [180, 440]],
      warm: [[40, 40], [1980, 40], [1980, 1460], [40, 1460]],
      hazard2: { kind: 'quake', poly: [[1040, 80], [1940, 80], [1940, 470], [1040, 470]], safe: [2015, 810], text: P('Rèplica forta! Els edificis esquerdats del nord-est deixen caure cascots: tothom fora d\'aquella illa.', '¡Réplica fuerte! Los edificios agrietados del noreste dejan caer cascotes: todo el mundo fuera de esa manzana.'), clear: P('Bombers: illa nord-est revisada i acordonada amb pas segur.', 'Bomberos: manzana noreste revisada y acordonada con paso seguro.') },
      sectors: [{ x: 420, y: 280, name: P('Edifici A', 'Edificio A') }, { x: 1350, y: 790, name: P('Edifici B', 'Edificio B') }, { x: 400, y: 1270, name: P('Edifici C', 'Edificio C') }, { x: 1450, y: 260, name: P('Illa nord-est', 'Manzana noreste') }, { x: 1450, y: 1260, name: P('Parc sud-est', 'Parque sureste') }],
      spots: gridSpots([[1100, 120, 1400, 400], [1520, 110, 1900, 300], [700, 640, 860, 940], [900, 0, 980, 1500], [0, 500, 1980, 580], [0, 1000, 1980, 1080]]),
      profiles: { green: ['pElderW', 'pAnxiety', 'pDeaf', 'pHidden', 'pPregW'], yellow: ['pElderY', 'pWheel', 'pImpaled', 'pPregY'], rr: ['pCrushR'], mental: ['pHeadOld', 'pNoObey'], perf: [], bleed: ['pAmput'], airway: ['pAirwayP'], black: ['pBlack'] },
      forceProfiles: ['pCrush'],
      lessons: [
        P('En una gran catàstrofe no hi ha prou mans: START serveix per decidir ràpid qui va primer, no per tractar. Menys d\'un minut per víctima.', 'En una gran catástrofe no hay manos suficientes: START sirve para decidir rápido quién va primero, no para tratar. Menos de un minuto por víctima.'),
        P('Sectoritza: cada edifici és una zona de treball que s\'allibera en un moment diferent. Comença pels sectors accessibles i les hemorràgies visibles.', 'Sectoriza: cada edificio es una zona de trabajo que se libera en un momento distinto. Empieza por los sectores accesibles y las hemorragias visibles.'),
        P('Rèpliques i aixafament: allunya\'t de façanes esquerdades i revalora els atrapats en alliberar-los.', 'Réplicas y aplastamiento: aléjate de fachadas agrietadas y revalora a los atrapados al liberarlos.'),
        P('Evacuació per prioritat: vermells a l\'hospital de trauma mentre hi hagi lloc; els verds, en autobús sanitari al CUAP.', 'Evacuación por prioridad: rojos al hospital de trauma mientras haya sitio; los verdes, en autobús sanitario al CUAP.')
      ]
    },
    avion: {
      id: 'avion', icon: 'plane', ambience: 'airport', ext: true, big: true, map: BIG_MAP, cold: BIG_COLD,
      name: P('Gran catàstrofe: accident aeri a l\'aeroport', 'Gran catástrofe: accidente aéreo en el aeropuerto'),
      short: P('Accident aeri', 'Accidente aéreo'),
      brief: P(
        'Un avió de passatgers ha sortit de la pista en aterrar, s\'ha partit en tres trams i s\'ha incendiat. Molts passatgers han sortit pel seu peu pels trencs del fuselatge i estan escampats per la pista i la gespa. Els bombers de l\'aeroport apaguen el foc tram per tram: el morro, el tram central i la cua són tres zones calentes. Arriben moltes ambulàncies i dos autobusos sanitaris.',
        'Un avión de pasajeros se ha salido de la pista al aterrizar, se ha partido en tres tramos y se ha incendiado. Muchos pasajeros han salido por su propio pie por las roturas del fuselaje y están repartidos por la pista y el césped. Los bomberos del aeropuerto apagan el fuego tramo a tramo: el morro, el tramo central y la cola son tres zonas calientes. Llegan muchas ambulancias y dos autobuses sanitarios.'),
      hazard: P('Fuselatge en flames i combustible vessat', 'Fuselaje en llamas y combustible derramado'),
      hotClear: P('Bombers de l\'aeroport: tots els trams extingits i refrigerats.', 'Bomberos del aeropuerto: todos los tramos extinguidos y refrigerados.'),
      hots: [
        { poly: [[420, 470], [960, 470], [960, 720], [420, 720]], k: 1, name: P('Morro de l\'avió', 'Morro del avión'), clear: P('Bombers de l\'aeroport: foc del morro extingit. Ja s\'hi pot accedir.', 'Bomberos del aeropuerto: fuego del morro extinguido. Ya se puede acceder.') },
        { poly: [[1000, 560], [1400, 560], [1400, 820], [1000, 820]], k: 1.4, name: P('Tram central (ales)', 'Tramo central (alas)'), clear: P('Bombers de l\'aeroport: tram central refrigerat. Ja s\'hi pot accedir.', 'Bomberos del aeropuerto: tramo central refrigerado. Ya se puede acceder.') },
        { poly: [[1440, 820], [1800, 820], [1800, 1060], [1440, 1060]], k: 1.9, name: P('Cua i combustible vessat', 'Cola y combustible derramado'), clear: P('Bombers de l\'aeroport: combustible cobert d\'escuma a la cua. Ja s\'hi pot accedir.', 'Bomberos del aeropuerto: combustible cubierto de espuma en la cola. Ya se puede acceder.') }
      ],
      hot: [[420, 470], [960, 470], [960, 720], [420, 720]],
      warm: [[40, 40], [1980, 40], [1980, 1460], [40, 1460]],
      hazard2: { kind: 'fire', poly: [[620, 860], [1060, 860], [1060, 1120], [620, 1120]], safe: [2015, 810], text: P('Perill nou: un motor que s\'ha desprès torna a encendre\'s i hi ha risc d\'explosió. Allunyeu-vos d\'aquella zona.', 'Peligro nuevo: un motor desprendido vuelve a encenderse y hay riesgo de explosión. Alejaos de esa zona.'), clear: P('Bombers de l\'aeroport: motor extingit i refrigerat.', 'Bomberos del aeropuerto: motor extinguido y refrigerado.') },
      sectors: [{ x: 690, y: 600, name: P('Morro', 'Morro') }, { x: 1200, y: 690, name: P('Tram central', 'Tramo central') }, { x: 1620, y: 940, name: P('Cua', 'Cola') }, { x: 600, y: 200, name: P('Pista', 'Pista') }, { x: 700, y: 1250, name: P('Gespa sud', 'Césped sur') }],
      spots: gridSpots([[0, 300, 1980, 440], [60, 1180, 520, 1440]]),
      profiles: { green: ['pSmokeW', 'pBurnW', 'pDeaf', 'pAnxiety', 'pHidden', 'pElderW', 'pPregW'], yellow: ['pBurnY', 'pElderY', 'pImpaled', 'pPregY'], rr: ['pSmokeR', 'pBurnR', 'pCrushR'], mental: ['pHeadOld'], perf: [], bleed: ['pAmput'], airway: ['pAirwayP'], black: ['pBlackGen'] },
      forceProfiles: ['pCrush', 'pBurnY', 'pSmokeR'],
      lessons: [
        P('A l\'aeroport hi ha plans d\'emergència assajats: bombers de l\'aeroport, punt de reunió i classificació. La teva part és el triatge i l\'evacuació ordenada.', 'En el aeropuerto hay planes de emergencia ensayados: bomberos del aeropuerto, punto de reunión y clasificación. Tu parte es el triaje y la evacuación ordenada.'),
        P('Cada tram de l\'avió és una zona calenta que s\'allibera en un moment diferent: treballa primer la pista i la gespa, i les hemorràgies visibles.', 'Cada tramo del avión es una zona caliente que se libera en un momento distinto: trabaja primero la pista y el césped, y las hemorragias visibles.'),
        P('Molts passatgers caminen (verds), però l\'impacte d\'alta energia i el fum poden amagar lesions: revalora els verds i els que tossen.', 'Muchos pasajeros caminan (verdes), pero el impacto de alta energía y el humo pueden ocultar lesiones: revalora a los verdes y a quienes tosen.'),
        P('Cremades i inhalació: la fisiologia mana (FR > 30, perfusió, estat mental), no l\'aparença de la cremada.', 'Quemaduras e inhalación: manda la fisiología (FR > 30, perfusión, estado mental), no el aspecto de la quemadura.')
      ]
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
      T('Asseguda a terra amb la cama dreta deformada; diu que no s\'hi pot recolzar.', 'Sentada en el suelo con la pierna derecha deformada; dice que no puede apoyarla.', { site: 'leg', post: 'sit', deform: true }),
      T('Estirat, amb dolor intens al maluc; no s\'aixeca.', 'Tumbado, con dolor intenso en la cadera; no se levanta.', { site: 'leg', post: 'lie' }),
      T('Assegut contra una paret; té el turmell molt inflat i no pot caminar.', 'Sentado contra una pared; tiene el tobillo muy hinchado y no puede caminar.', { site: 'leg', post: 'sit' }),
      T('Estirada, es queixa de dolor a l\'esquena i no vol moure les cames.', 'Tumbada, se queja de dolor en la espalda y no quiere mover las piernas.', { site: 'trunk', post: 'lie' }),
      T('Ferida a la cuixa que sagna poc; li fa massa mal per caminar.', 'Herida en el muslo que sangra poco; le duele demasiado para caminar.', { site: 'leg', bleed: 'minor', post: 'sit' }),
      T('Estirat amb el braç i la clavícula deformats; mareig quan intenta aixecar-se.', 'Tumbado con el brazo y la clavícula deformados; mareo cuando intenta levantarse.', { site: 'arm', post: 'lie', deform: true })
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
      T('Nen assegut que plora; té el braç deformat i no es vol moure.', 'Niño sentado que llora; tiene el brazo deformado y no se quiere mover.', { site: 'arm', post: 'sit', deform: true })
    ]
  };

  /* Plantilles dels perfils ampliats (escenaris i nivells nous). Mateixa estructura que TEMPLATES. Cada perfil té una fisiologia
     fixada a logic.js (PROFILES) coherent amb START; el text només descriu el que es veu, sense constants. */
  const PTEMPLATES = {
    pAnxiety: [
      T('Camina d\'un costat a l\'altre, respira molt de pressa i diu que li formigueja la boca i les mans; no té ferides visibles.', 'Camina de un lado a otro, respira muy deprisa y dice que le hormiguean la boca y las manos; no tiene heridas visibles.', { site: 'trunk', post: 'stand' }),
      T('Plora i crida que s\'ofega, però s\'aixeca sola i et segueix; té una rascada al colze.', 'Llora y grita que se ahoga, pero se levanta sola y te sigue; tiene un rasguño en el codo.', { site: 'arm', post: 'stand' })
    ],
    pBurnW: [
      T('Cremades vermelles i algunes butllofes al dors de les mans; camina i se les mira espantat.', 'Quemaduras rojas y algunas ampollas en el dorso de las manos; camina y se las mira asustado.', { site: 'arm', post: 'stand' }),
      T('Cremada a l\'avantbraç de fregar una peça calenta; es manté dreta i parla bé.', 'Quemadura en el antebrazo al rozar una pieza caliente; se mantiene de pie y habla bien.', { site: 'arm', post: 'stand' })
    ],
    pElderW: [
      T('Persona gran amb bastó; té un blau al front i va una mica desorientada, però camina sola.', 'Persona mayor con bastón; tiene un moratón en la frente y va algo desorientada, pero camina sola.', { site: 'head', post: 'stand' }),
      T('Senyor gran amb el braç adolorit; ha perdut les ulleres però s\'aixeca i camina.', 'Señor mayor con el brazo dolorido; ha perdido las gafas pero se levanta y camina.', { site: 'arm', post: 'stand', sex: 'm' })
    ],
    pPregW: [
      T('Embarassada d\'uns sis mesos, espantada; diu que no té dolor de panxa i camina sense ajuda.', 'Embarazada de unos seis meses, asustada; dice que no tiene dolor de barriga y camina sin ayuda.', { site: 'trunk', post: 'stand' }),
      T('Embarassada al final de la gestació amb una rascada al genoll; camina, però pregunta pel bebè.', 'Embarazada al final de la gestación con un rasguño en la rodilla; camina, pero pregunta por el bebé.', { site: 'leg', post: 'stand' })
    ],
    pSmokeW: [
      T('Tus molt i té la cara tacada de sutge; surt caminant per si sol.', 'Tose mucho y tiene la cara manchada de hollín; sale caminando por su propio pie.', { site: 'head', post: 'stand' }),
      T('Ulls irritats i tos seca després d\'estar entre el fum; camina i parla bé.', 'Ojos irritados y tos seca después de estar entre el humo; camina y habla bien.', { site: 'head', post: 'stand' })
    ],
    pDeaf: [
      T('No reacciona a l\'altaveu. Quan t\'hi acostes, s\'assenyala les orelles i fa signes: és sord. Té un tall petit a la mà.', 'No reacciona al altavoz. Cuando te acercas, se señala las orejas y hace signos: es sordo. Tiene un corte pequeño en la mano.', { site: 'arm', post: 'sit' }),
      T('Assegut, desorientat; l\'explosió li ha deixat les oïdes xiulant i no sent res del que li diuen.', 'Sentado, desorientado; la explosión le ha dejado los oídos pitando y no oye nada de lo que le dicen.', { site: 'head', post: 'sit' }),
      T('Dona amb audiòfons trencats; no sent l\'avís, però si li fas gestos entén i s\'aixeca.', 'Mujer con audífonos rotos; no oye el aviso, pero si le haces gestos entiende y se levanta.', { site: 'head', post: 'sit', sex: 'f' })
    ],
    pHidden: [
      T('Camina amb la mà al costat esquerre; diu que es va colpejar amb el seient, «però no és res».', 'Camina con la mano en el costado izquierdo; dice que se golpeó con el asiento, «pero no es nada».', { site: 'trunk', post: 'stand' }),
      T('Es queixa una mica de la panxa després d\'un cop; està pàl·lid però vol ajudar els altres.', 'Se queja un poco de la barriga tras un golpe; está pálido pero quiere ayudar a los demás.', { site: 'trunk', post: 'stand' })
    ],
    pBurnY: [
      T('Estirat, amb cremades extenses a les dues cames; diu que li fa molt de mal i no es pot aixecar.', 'Tumbado, con quemaduras extensas en las dos piernas; dice que le duele mucho y no puede levantarse.', { site: 'leg', post: 'lie' }),
      T('Asseguda, roba enganxada a la pell de l\'esquena i el braç cremats; tremola però contesta bé.', 'Sentada, ropa pegada a la piel de la espalda y el brazo quemados; tiembla pero contesta bien.', { site: 'trunk', post: 'sit' })
    ],
    pCrush: [
      T('Té les cames atrapades sota una biga des de fa estona; està conscient i parla, però no se les nota bé.', 'Tiene las piernas atrapadas bajo una viga desde hace rato; está consciente y habla, pero no se las nota bien.', { site: 'leg', post: 'lie' }),
      T('Braç i maluc aixafats per un bloc de formigó; respira tranquil i et demana que el treguis.', 'Brazo y cadera aplastados por un bloque de hormigón; respira tranquilo y te pide que lo saques.', { site: 'leg', post: 'lie' })
    ],
    pPregY: [
      T('Embarassada de set mesos asseguda a terra amb el turmell deformat; no s\'hi pot recolzar.', 'Embarazada de siete meses sentada en el suelo con el tobillo deformado; no puede apoyarlo.', { site: 'leg', post: 'sit', deform: true }),
      T('Embarassada estirada de costat amb dolor fort al maluc; no pot caminar.', 'Embarazada tumbada de lado con dolor fuerte en la cadera; no puede caminar.', { site: 'leg', post: 'lie' })
    ],
    pElderY: [
      T('Senyora gran estirada amb la cama escurçada i girada cap a fora; molt de dolor al maluc.', 'Señora mayor tumbada con la pierna acortada y girada hacia fuera; mucho dolor en la cadera.', { site: 'leg', post: 'lie', sex: 'f', deform: true }),
      T('Home gran assegut contra la paret, amb el canell deformat i un cop a la cuixa; no s\'aixeca.', 'Hombre mayor sentado contra la pared, con la muñeca deformada y un golpe en el muslo; no se levanta.', { site: 'leg', post: 'sit', sex: 'm', deform: true })
    ],
    pWheel: [
      T('Usuari de cadira de rodes, bolcada al seu costat; té paraplegia de fa anys i un cop al braç.', 'Usuario de silla de ruedas, volcada a su lado; tiene paraplejia desde hace años y un golpe en el brazo.', { site: 'arm', post: 'sit' }),
      T('Dona amb una discapacitat motora que no pot caminar sense les crosses, que han quedat sota les restes.', 'Mujer con una discapacidad motora que no puede caminar sin las muletas, que han quedado bajo los restos.', { site: 'leg', post: 'sit', sex: 'f' })
    ],
    pImpaled: [
      T('Assegut amb un tros de metall clavat a la cuixa que gairebé no sagna; no s\'aixeca.', 'Sentado con un trozo de metal clavado en el muslo que apenas sangra; no se levanta.', { site: 'leg', bleed: 'minor', post: 'sit' }),
      T('Estirada amb una estella de vidre clavada al braç; la sang regalima poc.', 'Tumbada con una astilla de cristal clavada en el brazo; la sangre gotea poco.', { site: 'arm', bleed: 'minor', post: 'lie' })
    ],
    pSmokeR: [
      T('Veu ronca, sutge al nas i a la boca i tos persistent; respira amb molt d\'esforç.', 'Voz ronca, hollín en la nariz y la boca y tos persistente; respira con mucho esfuerzo.', { site: 'head', post: 'sit' }),
      T('L\'han tret del fum; està assegut inclinat endavant i fa un soroll agut en respirar.', 'Lo han sacado del humo; está sentado inclinado hacia delante y hace un ruido agudo al respirar.', { site: 'head', post: 'sit' })
    ],
    pBurnR: [
      T('Cremades a la cara, celles i pèls del nas socarrimats; la veu se li apaga i respira de pressa.', 'Quemaduras en la cara, cejas y vello de la nariz chamuscados; la voz se le apaga y respira deprisa.', { site: 'head', post: 'sit' }),
      T('Estirada amb cremades al tòrax i al coll; respira curt i ràpid.', 'Tumbada con quemaduras en el tórax y el cuello; respira corto y rápido.', { site: 'trunk', post: 'lie' })
    ],
    pCrushR: [
      T('Atrapat de cintura en avall sota una llosa; el tòrax li puja i baixa molt de pressa.', 'Atrapado de cintura para abajo bajo una losa; el tórax le sube y baja muy deprisa.', { site: 'trunk', post: 'lie' }),
      T('Tòrax colpejat per la runa; un costat del pit es mou al revés quan respira.', 'Tórax golpeado por los escombros; un lado del pecho se mueve al revés al respirar.', { site: 'trunk', post: 'lie', para: true })
    ],
    pGswChest: [
      T('Ferida per arma de foc al costat dret del tòrax; respira de pressa i amb angoixa.', 'Herida por arma de fuego en el lado derecho del tórax; respira deprisa y con angustia.', { site: 'trunk', post: 'sit' }),
      T('Estirat amb un orifici a l\'esquena i bombolles de sang en respirar.', 'Tumbado con un orificio en la espalda y burbujas de sangre al respirar.', { site: 'trunk', post: 'lie' })
    ],
    pGswAbd: [
      T('Ferida de bala a l\'abdomen que gairebé no sagna per fora; pàl·lida, suada i amb set.', 'Herida de bala en el abdomen que apenas sangra por fuera; pálida, sudorosa y con sed.', { site: 'trunk', post: 'lie' }),
      T('Estirat amb les mans a la panxa i la pell freda; diu que està molt marejat.', 'Tumbado con las manos en la barriga y la piel fría; dice que está muy mareado.', { site: 'trunk', post: 'lie' })
    ],
    pHeadOld: [
      T('Persona gran amb un cop al cap que sagna poc; té els ulls oberts però no t\'entén. Pren anticoagulants, segons un veí.', 'Persona mayor con un golpe en la cabeza que sangra poco; tiene los ojos abiertos pero no te entiende. Toma anticoagulantes, según un vecino.', { site: 'head', bleed: 'minor', post: 'lie' }),
      T('Home gran estirat, confús, que repeteix la mateixa pregunta i no fa el que li demanes.', 'Hombre mayor tumbado, confuso, que repite la misma pregunta y no hace lo que le pides.', { site: 'head', post: 'lie', sex: 'm' })
    ],
    pNoObey: [
      T('Senyora amb demència, asseguda sense ferides visibles; no entén les ordres i no s\'aixeca.', 'Señora con demencia, sentada sin heridas visibles; no entiende las órdenes y no se levanta.', { site: 'head', post: 'sit', sex: 'f' }),
      T('Home desorientat que no respon a les preguntes; segons un company té una discapacitat intel·lectual.', 'Hombre desorientado que no responde a las preguntas; según un compañero tiene una discapacidad intelectual.', { site: 'head', post: 'sit', sex: 'm' })
    ],
    pAmput: [
      T('Amputació traumàtica de la cama per sota del genoll; la sang surt a raig.', 'Amputación traumática de la pierna por debajo de la rodilla; la sangre sale a chorro.', { site: 'leg', bleed: 'major', post: 'lie' }),
      T('L\'avantbraç li ha quedat esclafat i esquinçat; sagna sense parar.', 'El antebrazo le ha quedado aplastado y desgarrado; sangra sin parar.', { site: 'arm', bleed: 'major', post: 'lie' })
    ],
    pGswLimb: [
      T('Ferida per arma de foc a la cuixa; hi ha un bassal de sang que creix.', 'Herida por arma de fuego en el muslo; hay un charco de sangre que crece.', { site: 'leg', bleed: 'major', post: 'lie' }),
      T('Impacte de bala al braç; la màniga és xopa i la sang regalima del colze.', 'Impacto de bala en el brazo; la manga está empapada y la sangre chorrea del codo.', { site: 'arm', bleed: 'major', post: 'sit' })
    ],
    pGswJunc: [
      T('Ferida de bala a l\'engonal; la sang brolla i no hi ha lloc per posar un torniquet.', 'Herida de bala en la ingle; la sangre brota y no hay sitio para poner un torniquete.', { site: 'groin', bleed: 'major', post: 'lie' })
    ],
    pAirwayP: [
      T('Inconscient de bocaterrosa entre la runa; no es veu que respiri.', 'Inconsciente boca abajo entre los escombros; no se ve que respire.', { site: 'head', post: 'lie' }),
      T('Estirada immòbil amb la cara tacada de sutge; no hi ha moviment al pit.', 'Tumbada inmóvil con la cara manchada de hollín; no hay movimiento en el pecho.', { site: 'head', post: 'lie' })
    ],
    pBlackGen: [
      T('Immòbil, sense respiració ni cap signe de vida, amb lesions molt greus.', 'Inmóvil, sin respiración ni ningún signo de vida, con lesiones muy graves.', { site: 'trunk', post: 'lie' }),
      T('Estirada sense moviment entre les restes; no respira.', 'Tumbada sin movimiento entre los restos; no respira.', { site: 'head', post: 'lie' })
    ],
    pBlackGsw: [
      T('Immòbil, amb una ferida per arma de foc al cap; no hi ha cap signe de vida.', 'Inmóvil, con una herida por arma de fuego en la cabeza; no hay ningún signo de vida.', { site: 'head', post: 'lie' }),
      T('Estirat de bocaterrosa, sense moviment ni respiració visible.', 'Tumbado boca abajo, sin movimiento ni respiración visible.', { site: 'trunk', post: 'lie' })
    ],
    pBlack: [
      T('Sota una llosa de formigó, sense cap moviment ni signes de vida.', 'Bajo una losa de hormigón, sin ningún movimiento ni signos de vida.', { site: 'trunk', post: 'lie' }),
      T('Immòbil, amb lesions incompatibles amb la vida al cap.', 'Inmóvil, con lesiones incompatibles con la vida en la cabeza.', { site: 'head', post: 'lie' })
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

  /* Peligros visibles i resposta dels equips (NOMÉS presentació: no intervé en regles, temps, puntuació ni llavors).
     Cada zona calenta (mateix ordre que SETTINGS[id].hots o l'única `hot`) té: desc (què és i per què no s'hi entra),
     motifs (símbols dibuixats dins la zona; at = [fx, fy] fraccions del rectangle que l'envolta) i resp (qui ve a retirar-lo:
     unit fire|police|tech|usar, n vehicles, park e|s = per on aparquen, acts = accions, target = punt d'actuació, say = textos).
     `kinds` = el mateix per al perill nou a mitja partida (hazard2.kind). */
  const SAY = (ca, es) => ({ arrive: P(ca.arrive, es.arrive), act: P(ca.act, es.act) });
  const HAZVIS = {
    settings: {
      bus: { zones: [{
        desc: P('Gasoil vessat (relliscós i inflamable) i autobús bolcat que es pot moure. No t\'hi acostis fins que els bombers l\'assegurin.', 'Gasóleo derramado (resbaladizo e inflamable) y autobús volcado que puede moverse. No te acerques hasta que los bomberos lo aseguren.'),
        motifs: [{ m: 'spill', at: [0.38, 0.8], rx: 125, ry: 44 }, { m: 'fumes', at: [0.32, 0.7] }, { m: 'tilt', at: [0.68, 0.3], s: 1 }, { m: 'warn', at: [0.14, 0.2], sym: 'flame' }, { m: 'warn', at: [0.86, 0.82], sym: 'tilt' }],
        resp: { unit: 'fire', n: 2, park: 'e', acts: ['foam', 'props'], target: [0.45, 0.72], work: [[0.55, 0.45], [0.38, 0.78], [0.72, 0.36]],
          say: SAY({ arrive: 'Han arribat els bombers: estabilitzen l\'autobús amb falques i puntals i cobreixen el vessament de gasoil.', act: 'Bombers estabilitzant l\'autobús i cobrint el vessament' }, { arrive: 'Han llegado los bomberos: estabilizan el autobús con calzos y puntales y cubren el vertido de gasóleo.', act: 'Bomberos estabilizando el autobús y cubriendo el vertido' }) } }] },
      nave: { zones: [{
        desc: P('Fum dens, cables esquinçats que facen espurnes i una coberta que pot caure. No s\'entra a la nau fins que els bombers revisin l\'estructura.', 'Humo denso, cables rotos que sueltan chispas y una cubierta que puede caer. No se entra en la nave hasta que los bomberos revisen la estructura.'),
        motifs: [{ m: 'smoke', at: [0.5, 0.3], n: 5 }, { m: 'cracks', at: [0.55, 0.22], s: 1 }, { m: 'sparks', at: [0.78, 0.7], s: 1 }, { m: 'dust', at: [0.3, 0.2], n: 3 }, { m: 'tilt', at: [0.2, 0.65], s: 0.8 }, { m: 'warn', at: [0.88, 0.16], sym: 'crack' }, { m: 'warn', at: [0.12, 0.2], sym: 'gas' }],
        resp: { unit: 'fire', n: 2, park: 'e', acts: ['vent', 'props'], target: [0.5, 0.45], work: [[0.55, 0.3], [0.3, 0.6], [0.7, 0.55]],
          say: SAY({ arrive: 'Han arribat els bombers: ventilen la nau i apuntalen l\'estructura.', act: 'Bombers ventilant i revisant l\'estructura' }, { arrive: 'Han llegado los bomberos: ventilan la nave y apuntalan la estructura.', act: 'Bomberos ventilando y revisando la estructura' }) } }] },
      festival: { zones: [{
        desc: P('Torre i bastida caigudes amb cables elèctrics pelats que encara tenen tensió. No et toquis res: cal que els tècnics tallin el corrent.', 'Torre y andamio caídos con cables eléctricos pelados que aún tienen tensión. No toques nada: los técnicos tienen que cortar la corriente.'),
        motifs: [{ m: 'cable', from: [0.1, 0.18], to: [0.92, 0.78] }, { m: 'sparks', at: [0.92, 0.78], s: 1 }, { m: 'sparks', at: [0.5, 0.45], s: 0.8 }, { m: 'tilt', at: [0.3, 0.3], s: 0.9 }, { m: 'warn', at: [0.58, 0.12], sym: 'bolt' }, { m: 'warn', at: [0.12, 0.8], sym: 'bolt' }],
        resp: { unit: 'tech', n: 2, park: 'e', acts: ['cut', 'props'], target: [0.6, 0.55], work: [[0.55, 0.5], [0.85, 0.75]],
          say: SAY({ arrive: 'Han arribat els tècnics: tallen el corrent i asseguren l\'estructura caiguda.', act: 'Tècnics tallant el corrent' }, { arrive: 'Han llegado los técnicos: cortan la corriente y aseguran la estructura caída.', act: 'Técnicos cortando la corriente' }) } }] },
      tren: { zones: [{
        desc: P('Catenària caiguda amb tensió elèctrica i vagó bolcat inestable. Ningú no s\'hi acosta fins que es confirmi el tall de tensió.', 'Catenaria caída con tensión eléctrica y vagón volcado inestable. Nadie se acerca hasta que se confirme el corte de tensión.'),
        motifs: [{ m: 'cable', from: [0.08, 0.1], to: [0.9, 0.78] }, { m: 'sparks', at: [0.1, 0.12], s: 1 }, { m: 'sparks', at: [0.55, 0.5], s: 0.9 }, { m: 'sparks', at: [0.9, 0.78], s: 0.8 }, { m: 'tilt', at: [0.5, 0.35], s: 0.9 }, { m: 'warn', at: [0.3, 0.85], sym: 'bolt' }, { m: 'warn', at: [0.82, 0.14], sym: 'tilt' }],
        resp: { unit: 'tech', n: 2, park: 'e', acts: ['cut', 'props'], target: [0.55, 0.5], work: [[0.55, 0.5], [0.85, 0.75], [0.15, 0.2]],
          say: SAY({ arrive: 'Ha arribat l\'equip d\'Adif i els bombers: tallen la tensió i posen la catenària a terra.', act: 'Tallant la tensió de la catenària' }, { arrive: 'Ha llegado el equipo de Adif y los bomberos: cortan la tensión y ponen la catenaria a tierra.', act: 'Cortando la tensión de la catenaria' }) } }] },
      terremoto: { zones: [{
        desc: P('Runa de l\'edifici esfondrat que es pot moure, amb fuita de gas i pols. Ningú no puja a la runa fins que l\'equip USAR l\'apuntali.', 'Escombros del edificio derrumbado que pueden moverse, con fuga de gas y polvo. Nadie sube a los escombros hasta que el equipo USAR los apuntale.'),
        motifs: [{ m: 'cracks', at: [0.3, 0.3], s: 1.2 }, { m: 'cracks', at: [0.72, 0.65], s: 1 }, { m: 'dust', at: [0.5, 0.35], n: 4 }, { m: 'tilt', at: [0.5, 0.6], s: 1.1 }, { m: 'warn', at: [0.1, 0.2], sym: 'crack' }, { m: 'warn', at: [0.9, 0.2], sym: 'gas' }],
        resp: { unit: 'usar', n: 2, park: 'e', acts: ['props'], target: [0.5, 0.5], work: [[0.4, 0.4], [0.62, 0.55], [0.3, 0.65]],
          say: SAY({ arrive: 'Han arribat els bombers i l\'equip USAR: apuntalen la runa i tallen el gas.', act: 'USAR apuntalant la runa' }, { arrive: 'Han llegado los bomberos y el equipo USAR: apuntalan los escombros y cortan el gas.', act: 'USAR apuntalando los escombros' }) } }],
        shake: true },
      incendio: { zones: [{
        desc: P('Foc a la planta baixa i fum dens davant del portal. Sense equip de respiració no s\'entra: només hi treballen els bombers.', 'Fuego en la planta baja y humo denso delante del portal. Sin equipo de respiración no se entra: solo trabajan los bomberos.'),
        motifs: [{ m: 'flames', at: [0.2, 0.9], n: 3, s: 1.5 }, { m: 'flames', at: [0.5, 0.9], n: 3, s: 1.2 }, { m: 'flames', at: [0.8, 0.9], n: 2, s: 0.8 }, { m: 'smoke', at: [0.45, 0.4], n: 6 }, { m: 'warn', at: [0.9, 0.2], sym: 'flame' }, { m: 'warn', at: [0.08, 0.2], sym: 'gas' }],
        resp: { unit: 'fire', n: 2, park: 'e', acts: ['water', 'foam'], target: [0.4, 0.9], work: [[0.6, 0.85], [0.35, 0.88], [0.8, 0.8]],
          say: SAY({ arrive: 'Han arribat els bombers i estan apagant l\'incendi.', act: 'Bombers apagant l\'incendi' }, { arrive: 'Han llegado los bomberos y están apagando el incendio.', act: 'Bomberos apagando el incendio' }) } }] },
      atropello: { zones: [{
        desc: P('Furgoneta amb el motor calent i vessament de combustible. La policia talla el trànsit i els bombers l\'asseguren abans que ningú s\'hi acosti.', 'Furgoneta con el motor caliente y vertido de combustible. La policía corta el tráfico y los bomberos la aseguran antes de que nadie se acerque.'),
        motifs: [{ m: 'spill', at: [0.62, 0.78], rx: 80, ry: 28 }, { m: 'fumes', at: [0.5, 0.35] }, { m: 'cones', at: [0.96, 0.25], n: 3 }, { m: 'cones', at: [0.06, 0.88], n: 3 }, { m: 'warn', at: [0.14, 0.25], sym: 'flame' }, { m: 'warn', at: [0.88, 0.85], sym: 'excl' }],
        resp: { unit: 'fire', n: 1, units2: 'police', park: 'e', acts: ['foam', 'secure'], target: [0.5, 0.55], work: [[0.55, 0.55], [0.7, 0.75], [0.3, 0.3]],
          say: SAY({ arrive: 'Han arribat la policia i els bombers: acordonen, aturen el motor i recullen el vessament.', act: 'Policia i bombers assegurant la furgoneta' }, { arrive: 'Han llegado la policía y los bomberos: acordonan, paran el motor y recogen el vertido.', act: 'Policía y bomberos asegurando la furgoneta' }) } }] },
      tiroteo: { zones: [{
        desc: P('Amenaça activa a l\'interior de l\'edifici. Zona calenta: el personal sanitari no hi entra fins que la policia no l\'asseguri.', 'Amenaza activa en el interior del edificio. Zona caliente: el personal sanitario no entra hasta que la policía la asegure.'),
        motifs: [{ m: 'threat', at: [0.48, 0.45] }, { m: 'warn', at: [0.14, 0.2], sym: 'excl' }, { m: 'warn', at: [0.86, 0.2], sym: 'excl' }, { m: 'warn', at: [0.3, 0.92], sym: 'excl' }, { m: 'warn', at: [0.74, 0.92], sym: 'excl' }],
        resp: { unit: 'police', n: 3, park: 's', acts: ['police'], target: [0.48, 0.45], work: null, threat: true,
          say: SAY({ arrive: 'Ha arribat la policia: acordona el centre comercial i hi entra en formació per neutralitzar l\'amenaça.', act: 'Policia avançant en formació cap a l\'amenaça' }, { arrive: 'Ha llegado la policía: acordona el centro comercial y entra en formación para neutralizar la amenaza.', act: 'Policía avanzando en formación hacia la amenaza' }) } }] },
      sismo: { shake: true, zones: [
        { desc: P('Edifici A esfondrat: runa inestable i pols. L\'equip USAR l\'apuntala abans d\'accedir-hi.', 'Edificio A derrumbado: escombros inestables y polvo. El equipo USAR lo apuntala antes de acceder.'),
          motifs: [{ m: 'cracks', at: [0.3, 0.35], s: 1.2 }, { m: 'dust', at: [0.55, 0.4], n: 4 }, { m: 'tilt', at: [0.65, 0.6], s: 1.1 }, { m: 'warn', at: [0.1, 0.2], sym: 'crack' }],
          resp: { unit: 'usar', n: 2, park: 'e', acts: ['props'], target: [0.5, 0.5], work: [[0.4, 0.4], [0.62, 0.55]], say: SAY({ arrive: 'Ha arribat l\'equip USAR: apuntala {zone}.', act: 'USAR apuntalant {zone}' }, { arrive: 'Ha llegado el equipo USAR: apuntala {zone}.', act: 'USAR apuntalando {zone}' }) } },
        { desc: P('Edifici B esfondrat, amb fuita de gas i runa inestable. L\'equip USAR talla el gas i l\'apuntala.', 'Edificio B derrumbado, con fuga de gas y escombros inestables. El equipo USAR corta el gas y lo apuntala.'),
          motifs: [{ m: 'cracks', at: [0.5, 0.3], s: 1.3 }, { m: 'dust', at: [0.3, 0.5], n: 4 }, { m: 'tilt', at: [0.55, 0.65], s: 1.2 }, { m: 'warn', at: [0.12, 0.18], sym: 'gas' }, { m: 'warn', at: [0.88, 0.2], sym: 'crack' }],
          resp: { unit: 'usar', n: 2, park: 'e', acts: ['props'], target: [0.5, 0.5], work: [[0.4, 0.45], [0.65, 0.6]], say: SAY({ arrive: 'Ha arribat l\'equip USAR: talla el gas i apuntala {zone}.', act: 'USAR apuntalant {zone}' }, { arrive: 'Ha llegado el equipo USAR: corta el gas y apuntala {zone}.', act: 'USAR apuntalando {zone}' }) } },
        { desc: P('Edifici C esfondrat: runa inestable i pols. L\'equip USAR l\'apuntala abans d\'accedir-hi.', 'Edificio C derrumbado: escombros inestables y polvo. El equipo USAR lo apuntala antes de acceder.'),
          motifs: [{ m: 'cracks', at: [0.35, 0.4], s: 1.2 }, { m: 'dust', at: [0.6, 0.35], n: 4 }, { m: 'tilt', at: [0.6, 0.65], s: 1.1 }, { m: 'warn', at: [0.1, 0.2], sym: 'crack' }],
          resp: { unit: 'usar', n: 2, park: 'e', acts: ['props'], target: [0.5, 0.5], work: [[0.4, 0.4], [0.62, 0.55]], say: SAY({ arrive: 'Ha arribat l\'equip USAR: apuntala {zone}.', act: 'USAR apuntalant {zone}' }, { arrive: 'Ha llegado el equipo USAR: apuntala {zone}.', act: 'USAR apuntalando {zone}' }) } }] },
      avion: { zones: [
        { desc: P('Morro de l\'avió en flames, amb combustible vessat i fum dens. Els bombers de l\'aeroport l\'apaguen abans d\'accedir-hi.', 'Morro del avión en llamas, con combustible derramado y humo denso. Los bomberos del aeropuerto lo apagan antes de acceder.'),
          motifs: [{ m: 'flames', at: [0.3, 0.45], n: 4, s: 1.6 }, { m: 'flames', at: [0.7, 0.6], n: 2, s: 1 }, { m: 'smoke', at: [0.45, 0.3], n: 5 }, { m: 'spill', at: [0.55, 0.85], rx: 110, ry: 34 }, { m: 'warn', at: [0.9, 0.2], sym: 'flame' }],
          resp: { unit: 'fire', n: 2, park: 'e', acts: ['foam', 'water'], target: [0.4, 0.55], work: [[0.6, 0.5], [0.4, 0.6]], say: SAY({ arrive: 'Han arribat els bombers de l\'aeroport: apaguen amb aigua i escuma {zone}.', act: 'Bombers de l\'aeroport apagant {zone}' }, { arrive: 'Han llegado los bomberos del aeropuerto: apagan con agua y espuma {zone}.', act: 'Bomberos del aeropuerto apagando {zone}' }) } },
        { desc: P('Tram central i ales: foc als motors i combustible vessat. Els bombers de l\'aeroport el refreden amb escuma.', 'Tramo central y alas: fuego en los motores y combustible derramado. Los bomberos del aeropuerto lo enfrían con espuma.'),
          motifs: [{ m: 'flames', at: [0.3, 0.5], n: 3, s: 1.3 }, { m: 'flames', at: [0.75, 0.6], n: 3, s: 1.1 }, { m: 'smoke', at: [0.5, 0.35], n: 4 }, { m: 'spill', at: [0.5, 0.88], rx: 100, ry: 30 }, { m: 'warn', at: [0.88, 0.18], sym: 'flame' }],
          resp: { unit: 'fire', n: 2, park: 'e', acts: ['foam', 'water'], target: [0.5, 0.55], work: [[0.55, 0.5], [0.35, 0.6]], say: SAY({ arrive: 'Han arribat els bombers de l\'aeroport: refreden amb escuma {zone}.', act: 'Bombers de l\'aeroport refredant {zone}' }, { arrive: 'Han llegado los bomberos del aeropuerto: enfrían con espuma {zone}.', act: 'Bomberos del aeropuerto enfriando {zone}' }) } },
        { desc: P('Cua de l\'avió amb combustible vessat que pot encendre\'s. Els bombers de l\'aeroport el cobreixen d\'escuma.', 'Cola del avión con combustible derramado que puede encenderse. Los bomberos del aeropuerto lo cubren de espuma.'),
          motifs: [{ m: 'spill', at: [0.5, 0.65], rx: 150, ry: 46 }, { m: 'fumes', at: [0.4, 0.5] }, { m: 'flames', at: [0.8, 0.35], n: 2, s: 0.9 }, { m: 'smoke', at: [0.78, 0.2], n: 3 }, { m: 'warn', at: [0.1, 0.2], sym: 'flame' }],
          resp: { unit: 'fire', n: 2, park: 'e', acts: ['foam'], target: [0.5, 0.6], work: [[0.6, 0.55], [0.35, 0.65]], say: SAY({ arrive: 'Han arribat els bombers de l\'aeroport: cobreixen d\'escuma el combustible de {zone}.', act: 'Bombers de l\'aeroport cobrint {zone} d\'escuma' }, { arrive: 'Han llegado los bomberos del aeropuerto: cubren de espuma el combustible de {zone}.', act: 'Bomberos del aeropuerto cubriendo {zone} de espuma' }) } }] }
    },
    /* perill nou a mitja partida: segons el tipus (hazard2.kind) */
    kinds: {
      fire: { label: P('incendi', 'incendio'),
        motifs: [{ m: 'flames', at: [0.35, 0.7], n: 4, s: 1.3 }, { m: 'flames', at: [0.7, 0.55], n: 3, s: 0.9 }, { m: 'smoke', at: [0.5, 0.4], n: 4 }, { m: 'warn', at: [0.14, 0.2], sym: 'flame' }],
        resp: { unit: 'fire', n: 2, park: 'e', acts: ['water', 'foam'], target: [0.45, 0.65], work: [[0.55, 0.6], [0.35, 0.7]], say: SAY({ arrive: 'Han arribat els bombers i estan apagant el foc.', act: 'Bombers apagant el foc' }, { arrive: 'Han llegado los bomberos y están apagando el fuego.', act: 'Bomberos apagando el fuego' }) } },
      collapse: { label: P('estructura a punt de caure', 'estructura a punto de caer'),
        motifs: [{ m: 'cracks', at: [0.5, 0.35], s: 1 }, { m: 'tilt', at: [0.5, 0.6], s: 1.1 }, { m: 'dust', at: [0.3, 0.3], n: 3 }, { m: 'warn', at: [0.14, 0.2], sym: 'crack' }, { m: 'warn', at: [0.86, 0.8], sym: 'tilt' }],
        resp: { unit: 'fire', n: 2, park: 'e', acts: ['props'], target: [0.5, 0.55], work: [[0.4, 0.5], [0.62, 0.6]], say: SAY({ arrive: 'Han arribat els bombers: apuntalen l\'estructura que amenaça de caure.', act: 'Bombers apuntalant l\'estructura' }, { arrive: 'Han llegado los bomberos: apuntalan la estructura que amenaza con caer.', act: 'Bomberos apuntalando la estructura' }) } },
      wire: { label: P('cable amb tensió', 'cable con tensión'),
        motifs: [{ m: 'cable', from: [0.1, 0.2], to: [0.9, 0.8] }, { m: 'sparks', at: [0.55, 0.5], s: 1 }, { m: 'sparks', at: [0.9, 0.8], s: 0.8 }, { m: 'warn', at: [0.2, 0.75], sym: 'bolt' }, { m: 'warn', at: [0.8, 0.2], sym: 'bolt' }],
        resp: { unit: 'tech', n: 2, park: 'e', acts: ['cut'], target: [0.55, 0.5], work: [[0.55, 0.5], [0.85, 0.75]], say: SAY({ arrive: 'Han arribat els tècnics: tallen la tensió i posen el cable a terra.', act: 'Tècnics tallant la tensió' }, { arrive: 'Han llegado los técnicos: cortan la tensión y ponen el cable a tierra.', act: 'Técnicos cortando la tensión' }) } },
      quake: { label: P('rèplica i façana inestable', 'réplica y fachada inestable'), shake: true,
        motifs: [{ m: 'cracks', at: [0.35, 0.35], s: 1.2 }, { m: 'cracks', at: [0.7, 0.6], s: 1 }, { m: 'dust', at: [0.5, 0.3], n: 4 }, { m: 'tilt', at: [0.5, 0.65], s: 1.1 }, { m: 'warn', at: [0.12, 0.2], sym: 'crack' }],
        resp: { unit: 'usar', n: 2, park: 'e', acts: ['props'], target: [0.5, 0.5], work: [[0.4, 0.45], [0.62, 0.6]], say: SAY({ arrive: 'Han arribat els bombers: revisen la façana i acordonen la zona.', act: 'Bombers revisant la façana' }, { arrive: 'Han llegado los bomberos: revisan la fachada y acordonan la zona.', act: 'Bomberos revisando la fachada' }) } },
      threat: { label: P('possible segona amenaça', 'posible segunda amenaza'), softThreat: true,
        motifs: [{ m: 'threat', at: [0.5, 0.5] }, { m: 'warn', at: [0.14, 0.2], sym: 'excl' }, { m: 'warn', at: [0.86, 0.8], sym: 'excl' }],
        resp: { unit: 'police', n: 2, park: 'e', acts: ['police'], target: [0.5, 0.5], work: null, threat: true, say: SAY({ arrive: 'La policia revisa l\'aparcament: els agents avancen en formació.', act: 'Policia revisant l\'aparcament' }, { arrive: 'La policía revisa el aparcamiento: los agentes avanzan en formación.', act: 'Policía revisando el aparcamiento' }) } }
    }
  };

  const D = {
    slug: 'sim-triatge-start', version: '2.0.0',
    author: 'Luis Franco Serrano',
    COLD: COLD, SETTINGS: SETTINGS, TEMPLATES: TEMPLATES, PTEMPLATES: PTEMPLATES, HOSPITALS: HOSPITALS, BANK: BANK, GUIDED: GUIDED, CHALLENGE: CHALLENGE, HAZVIS: HAZVIS,
    /* l'opció «aleatori» tria només entre els escenaris originals (reproduïbilitat de les llavors antigues) */
    RANDOM_POOL: ['bus', 'nave', 'festival', 'tren']
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.TriageData = D;
})(this);
