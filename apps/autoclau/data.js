'use strict';
/* Simulador d'autoclau de vapor (C6 · CAI, unitat 7). Dades bilingües [ca, es]:
   catàleg de materials, envasos, destinacions, programes, opcions de decisió, missatges d'avaluació i banc d'escenaris.
   Valors tècnics segons el temari del campus (c6/7) i normes de referència (UNE-EN 285, UNE-EN 13060, UNE-EN ISO 11140-1, ISO 11138, UNE-EN ISO 17665);
   el que depèn del centre o del fabricant es marca com a orientatiu. */
(function (root) {
  const D = {
    slug: 'sim-autoclau',
    meta: {
      title: ['Simulador d\'autoclau de vapor', 'Simulador de autoclave de vapor'],
      lead: [
        'Prepara i carrega el material, tria el programa, fes funcionar l\'autoclau i revisa els controls físics, químics i biològics abans de decidir si el lot es pot alliberar.',
        'Prepara y carga el material, elige el programa, haz funcionar el autoclave y revisa los controles físicos, químicos y biológicos antes de decidir si el lote se puede liberar.'
      ],
      src: [
        'Fonts: temari C6 unitat 7 (L\'esterilització del material) i unitat 6; UNE-EN 285 i UNE-EN 13060 (esterilitzadors de vapor), UNE-EN ISO 11140-1 (indicadors químics), ISO 11138 (indicadors biològics), UNE-EN ISO 17665 (validació), UNE-EN ISO 11607 (envasos). Model físic didàctic simplificat (vapor saturat, z = 10 °C, D121 orientatiu de 1,5 min): els temps, les classes d\'indicadors i les freqüències de control són orientatius i depenen del protocol del centre i del fabricant.',
        'Fuentes: temario C6 unidad 7 (La esterilización del material) y unidad 6; UNE-EN 285 y UNE-EN 13060 (esterilizadores de vapor), UNE-EN ISO 11140-1 (indicadores químicos), ISO 11138 (indicadores biológicos), UNE-EN ISO 17665 (validación), UNE-EN ISO 11607 (envases). Modelo físico didáctico simplificado (vapor saturado, z = 10 °C, D121 orientativo de 1,5 min): los tiempos, las clases de indicadores y las frecuencias de control son orientativos y dependen del protocolo del centro y del fabricante.'
      ],
      equip: ['Autoclau AC-2 · classe B (prebuit fraccionat) · cambra 20 unitats de càrrega', 'Autoclave AC-2 · clase B (prevacío fraccionado) · cámara 20 unidades de carga']
    },

    /* capacitat de la cambra (unitats de volum) i límit de càrrega */
    chamber: { cap: 20, maxFill: 0.8 },

    /* ---------- Catàleg de materials ----------
       k: tipus (instr, bowl, set, cont, implant, textile, lumen, rubber, silicone, pp, tl, endo, oil, powder, single, liquid, flam, glass)
       art: articulat · concave: recipient (cubeta, ronyonera) · lumen: amb llum/hueco · porous: tèxtil · heavy: pesant/metàl·lic
       maxT: temperatura màxima tolerada al vapor (0 = no apte per al vapor) · packs: envasos adequats · vol: unitats de volum */
    items: {
      tisores: { k: 'instr', art: 1, maxT: 137, vol: 1, packs: ['bag'], n: ['Tisores de Mayo', 'Tijeras de Mayo'] },
      kocher: { k: 'instr', art: 1, maxT: 137, vol: 1, packs: ['bag'], n: ['Pinces de Kocher', 'Pinzas de Kocher'] },
      dissec: { k: 'instr', maxT: 137, vol: 1, packs: ['bag'], n: ['Pinces de dissecció', 'Pinzas de disección'] },
      portaag: { k: 'instr', art: 1, maxT: 137, vol: 1, packs: ['bag'], n: ['Portaagulles', 'Portaagujas'] },
      mango: { k: 'instr', maxT: 137, vol: 0.5, packs: ['bag'], n: ['Mànec de bisturí núm. 4', 'Mango de bisturí n.º 4'] },
      especul: { k: 'instr', art: 1, maxT: 137, vol: 1, packs: ['bag'], n: ['Espèculum vaginal metàl·lic', 'Espéculo vaginal metálico'] },
      ronyonera: { k: 'bowl', concave: 1, heavy: 1, maxT: 137, vol: 2, packs: ['bag', 'crepe', 'sms'], n: ['Ronyonera d\'acer inoxidable', 'Batea arriñonada de acero inoxidable'] },
      cubeta: { k: 'bowl', concave: 1, heavy: 1, maxT: 137, vol: 2, packs: ['bag', 'crepe', 'sms'], n: ['Cubeta (bol) d\'acer inoxidable', 'Cubeta (bol) de acero inoxidable'] },
      potvidre: { k: 'glass', concave: 1, maxT: 137, vol: 1.5, packs: ['bag', 'crepe', 'sms'], n: ['Pot de vidre buit (resistent a la calor)', 'Bote de vidrio vacío (resistente al calor)'] },
      caixacures: { k: 'set', heavy: 1, maxT: 137, vol: 4, packs: ['cont', 'crepe', 'sms', 'cloth'], n: ['Caixa d\'instrumental de cures', 'Caja de instrumental de curas'] },
      contquir: { k: 'cont', heavy: 1, maxT: 137, vol: 6, packs: ['cont', 'crepe', 'sms'], n: ['Contenidor de quiròfan (caixa de laparotomia)', 'Contenedor de quirófano (caja de laparotomía)'] },
      implants: { k: 'implant', heavy: 1, maxT: 137, vol: 4, packs: ['cont', 'crepe', 'sms'], n: ['Caixa d\'implants de traumatologia (cargols i plaques)', 'Caja de implantes de traumatología (tornillos y placas)'] },
      gases: { k: 'textile', porous: 1, maxT: 137, vol: 2, packs: ['bag', 'crepe', 'sms', 'cloth'], n: ['Paquet de gases i compreses de cotó', 'Paquete de gasas y compresas de algodón'] },
      talles: { k: 'textile', porous: 1, maxT: 137, vol: 3, packs: ['crepe', 'sms', 'cloth'], n: ['Talles i roba quirúrgica de cotó', 'Paños y ropa quirúrgica de algodón'] },
      canula: { k: 'lumen', lumen: 1, maxT: 137, vol: 1, packs: ['bag'], n: ['Cànula d\'aspiració metàl·lica (amb llum interior)', 'Cánula de aspiración metálica (con luz interior)'] },
      tubsil: { k: 'silicone', lumen: 1, maxT: 137, vol: 1, packs: ['bag'], n: ['Tub de silicona reutilitzable (apte fins a 134 °C)', 'Tubo de silicona reutilizable (apto hasta 134 °C)'] },
      latex: { k: 'rubber', maxT: 121, vol: 1, packs: ['bag'], n: ['Drenatge de goma de làtex reutilitzable', 'Drenaje de goma de látex reutilizable'] },
      pprecip: { k: 'pp', concave: 1, maxT: 121, vol: 1.5, packs: ['bag'], n: ['Recipient de polipropilè «autoclavable a 121 °C»', 'Recipiente de polipropileno «autoclavable a 121 °C»'] },
      plastl: { k: 'tl', maxT: 0, vol: 1, packs: [], n: ['Connexions de plàstic termolàbil (polietilè)', 'Conexiones de plástico termolábil (polietileno)'] },
      endo: { k: 'endo', maxT: 0, vol: 2, packs: [], n: ['Endoscopi flexible', 'Endoscopio flexible'] },
      vaselina: { k: 'oil', maxT: 0, vol: 1, packs: [], n: ['Pot de vaselina (gases vaselinades)', 'Bote de vaselina (gasas vaselinadas)'] },
      talc: { k: 'powder', maxT: 0, vol: 1, packs: [], n: ['Pols de talc en recipient', 'Polvos de talco en recipiente'] },
      sonda1u: { k: 'single', maxT: 0, vol: 0.5, packs: [], n: ['Sonda vesical d\'un sol ús (envàs obert sense fer servir)', 'Sonda vesical de un solo uso (envase abierto sin usar)'] },
      xeringa1u: { k: 'single', maxT: 0, vol: 0.5, packs: [], n: ['Xeringa de plàstic d\'un sol ús', 'Jeringa de plástico de un solo uso'] },
      serum: { k: 'liquid', maxT: 0, vol: 1.5, packs: [], n: ['Ampolla de sèrum fisiològic (500 ml)', 'Frasco de suero fisiológico (500 ml)'] },
      alcohol: { k: 'flam', maxT: 0, vol: 1, packs: [], n: ['Ampolla d\'alcohol de 70°', 'Frasco de alcohol de 70°'] }
    },
    /* estat amagat que es descobreix en inspeccionar */
    states: {
      ok: ['Net, sec i en bon estat.', 'Limpio, seco y en buen estado.'],
      dirty: ['Restes de sang seca a la cremallera i a les dents.', 'Restos de sangre seca en la cremallera y en los dientes.'],
      wet: ['Encara humit després del rentat.', 'Todavía húmedo después del lavado.'],
      rust: ['Taques de rovell i una punta desalineada.', 'Manchas de óxido y una punta desalineada.']
    },

    /* ---------- Destinacions ---------- */
    dests: {
      steam: ['Autoclau de vapor (aquest cicle)', 'Autoclave de vapor (este ciclo)'],
      later: ['Un altre cicle d\'autoclau (més tard)', 'Otro ciclo de autoclave (más tarde)'],
      dry: ['Calor seca (forn Pasteur)', 'Calor seco (horno Pasteur)'],
      lowtemp: ['Baixa temperatura (plasma, òxid d\'etilè) o DAN', 'Baja temperatura (plasma, óxido de etileno) o DAN'],
      clean: ['Tornar a neteja i assecat', 'Volver a limpieza y secado'],
      withdraw: ['Retirar (malmès o no esterilitzable)', 'Retirar (dañado o no esterilizable)'],
      discard: ['Un sol ús: no es reprocessa', 'Un solo uso: no se reprocesa']
    },
    /* ---------- Envasos ---------- ok: compatible amb vapor */
    packs: {
      bag: { ok: 1, n: ['Bossa mixta paper-plàstic (termosegellada)', 'Bolsa mixta papel-plástico (termosellada)'] },
      cont: { ok: 1, n: ['Contenidor rígid amb filtre', 'Contenedor rígido con filtro'] },
      crepe: { ok: 1, n: ['Paper crepat de grau mèdic (doble embolcall)', 'Papel crepado de grado médico (doble envoltorio)'] },
      sms: { ok: 1, n: ['Teixit sense teixir SMS (doble embolcall)', 'Tejido sin tejer SMS (doble envoltorio)'] },
      cloth: { ok: 1, n: ['Tela de cotó (doble embolcall)', 'Tela de algodón (doble envoltorio)'] },
      foil: { ok: 0, n: ['Paper d\'alumini', 'Papel de aluminio'] },
      box: { ok: 0, n: ['Caixa metàl·lica tancada hermèticament', 'Caja metálica cerrada herméticamente'] },
      poly: { ok: 0, n: ['Bossa de plàstic (polietilè)', 'Bolsa de plástico (polietileno)'] },
      none: { ok: 0, n: ['Sense envàs (nu)', 'Sin envase (desnudo)'] }
    },
    /* ---------- Col·locació ---------- */
    pos: {
      vert: ['Vertical, paper contra plàstic', 'Vertical, papel contra plástico'],
      pp: ['Vertical, plàstic contra plàstic', 'Vertical, plástico contra plástico'],
      flat: ['Plana i apilada', 'Plana y apilada'],
      down: ['Boca avall o de costat', 'Boca abajo o de lado'],
      up: ['Boca amunt', 'Boca arriba'],
      sep: ['Separat, sense apilar', 'Separado, sin apilar'],
      stack: ['Apilat sobre un altre paquet', 'Apilado sobre otro paquete']
    },
    shelves: { low: ['Safata inferior', 'Bandeja inferior'], up: ['Safata superior', 'Bandeja superior'] },
    ciClasses: {
      0: ['Sense indicador intern', 'Sin indicador interno'],
      1: ['Classe 1 (de procés, cinta)', 'Clase 1 (de proceso, cinta)'],
      4: ['Classe 4 (multiparamètric)', 'Clase 4 (multiparamétrico)'],
      5: ['Classe 5 (integrador)', 'Clase 5 (integrador)'],
      6: ['Classe 6 (emulador del cicle)', 'Clase 6 (emulador del ciclo)']
    },

    /* ---------- Programes de l'equip ---------- type: B prebuit fraccionat · N gravitatori · L líquids · BD Bowie-Dick · LEAK test de buit */
    programs: [
      { id: 'p134', type: 'B', T: 134, hold: 5, dry: 20, n: ['P1 · 134 °C embolcallat', 'P1 · 134 °C envuelto'], d: ['Instrumental metàl·lic, tèxtil i material resistent; prebuit fraccionat. 134 °C · ≈ 2 bar · 5 min · assecat 20 min.', 'Instrumental metálico, textil y material resistente; prevacío fraccionado. 134 °C · ≈ 2 bar · 5 min · secado 20 min.'] },
      { id: 'p121', type: 'B', T: 121, hold: 20, dry: 20, n: ['P2 · 121 °C goma i plàstic', 'P2 · 121 °C goma y plástico'], d: ['Goma i plàstics resistents al vapor; prebuit. 121 °C · ≈ 1 bar · 20 min · assecat 20 min.', 'Goma y plásticos resistentes al vapor; prevacío. 121 °C · ≈ 1 bar · 20 min · secado 20 min.'] },
      { id: 'pprion', type: 'B', T: 134, hold: 18, dry: 20, n: ['P3 · 134 °C priones (18 min)', 'P3 · 134 °C priones (18 min)'], d: ['Material amb risc de prions, per indicació del responsable. 134 °C · 18 min · assecat 20 min.', 'Material con riesgo de priones, por indicación del responsable. 134 °C · 18 min · secado 20 min.'] },
      { id: 'pflash', type: 'N', T: 134, hold: 4, dry: 2, n: ['P4 · 134 °C sòlids nus (classe N)', 'P4 · 134 °C sólidos desnudos (clase N)'], d: ['Gravitatori, sense envàs, per a ús immediat; no apte per a material embolcallat, porós ni amb llum.', 'Gravitatorio, sin envase, para uso inmediato; no apto para material envuelto, poroso ni con luz.'] },
      { id: 'pliq', type: 'L', T: 121, hold: 20, dry: 0, n: ['P5 · 121 °C líquids', 'P5 · 121 °C líquidos'], d: ['Només líquids en recipients aptes, sense buit i amb refredament lent; porta bloquejada fins a < 80 °C.', 'Solo líquidos en recipientes aptos, sin vacío y con enfriamiento lento; puerta bloqueada hasta < 80 °C.'] }
    ],
    testPrograms: {
      bd: { id: 'bd', type: 'BD', T: 134, hold: 3.5, dry: 1, n: ['Test de Bowie-Dick (134 °C · 3,5 min)', 'Test de Bowie-Dick (134 °C · 3,5 min)'] },
      leak: { id: 'leak', type: 'LEAK', T: 0, hold: 0, dry: 0, n: ['Test de buit (estanquitat)', 'Test de vacío (estanqueidad)'] }
    },
    phases: {
      pre: ['Precalentament', 'Precalentamiento'],
      vac: ['Eliminació de l\'aire (prebuit)', 'Eliminación del aire (prevacío)'],
      purge: ['Purga de l\'aire (gravitatori)', 'Purga del aire (gravitatorio)'],
      heat: ['Admissió de vapor i escalfament', 'Admisión de vapor y calentamiento'],
      hold: ['Esterilització (meseta)', 'Esterilización (meseta)'],
      exh: ['Descompressió', 'Descompresión'],
      cool: ['Refredament lent', 'Enfriamiento lento'],
      dry: ['Assecat', 'Secado'],
      vent: ['Entrada d\'aire filtrat', 'Entrada de aire filtrado'],
      leak: ['Test de buit', 'Test de vacío'],
      end: ['Fi de cicle', 'Fin de ciclo']
    },

    /* ---------- Opcions de decisió final ---------- */
    decisions: {
      release: ['Alliberar el lot: emmagatzemar el material conforme com a estèril', 'Liberar el lote: almacenar el material conforme como estéril'],
      quarantine: ['Retenir el lot en quarantena fins a tenir el resultat pendent', 'Retener el lote en cuarentena hasta tener el resultado pendiente'],
      reprocess_some: ['Reprocessar només els paquets no conformes', 'Reprocesar solo los paquetes no conformes'],
      reprocess_all: ['Reprocessar tota la càrrega (tornar a empaquetar i esterilitzar)', 'Reprocesar toda la carga (volver a empaquetar y esterilizar)'],
      recall: ['Retirar i recuperar el material dels lots distribuïts des de l\'últim control correcte', 'Retirar y recuperar el material de los lotes distribuidos desde el último control correcto'],
      out_of_service: ['Deixar l\'autoclau fora de servei i avisar el servei tècnic', 'Dejar el autoclave fuera de servicio y avisar al servicio técnico'],
      notify: ['Avisar el/la responsable de la central (supervisió)', 'Avisar al/a la responsable de la central (supervisión)'],
      repeat_test: ['Repetir la prova (Bowie-Dick, biològic o test de buit)', 'Repetir la prueba (Bowie-Dick, biológico o test de vacío)'],
      use_equipment: ['Continuar fent servir l\'equip: començar les càrregues del dia', 'Seguir usando el equipo: empezar las cargas del día'],
      register: ['Anotar-ho al registre (cicle, lot, resultats, incidències, operari)', 'Anotarlo en el registro (ciclo, lote, resultados, incidencias, operario)']
    },
    packDisp: {
      store: ['Apte: emmagatzemar', 'Apto: almacenar'],
      reprocess: ['No estèril: reprocessar', 'No estéril: reprocesar'],
      withdraw: ['Retirar (malmès)', 'Retirar (dañado)']
    },

    /* ---------- Comprovacions de descàrrega ---------- ok: 1 correcta i necessària · 0 incorrecta */
    unload: [
      { id: 'u_press', ok: 1, t: ['Comprovar que la pressió és 0 i esperar el desbloqueig de la porta', 'Comprobar que la presión es 0 y esperar el desbloqueo de la puerta'] },
      { id: 'u_ajar', ok: 1, t: ['Entreobrir la porta i apartar-se del vapor residual (no posar-s\'hi davant)', 'Entreabrir la puerta y apartarse del vapor residual (no ponerse delante)'] },
      { id: 'u_gloves', ok: 1, t: ['Posar-se guants tèrmics (resistents a la calor)', 'Ponerse guantes térmicos (resistentes al calor)'] },
      { id: 'u_cool', ok: 1, t: ['Deixar refredar la càrrega al carro abans de manipular-la, sense posar-la sobre superfícies fredes', 'Dejar enfriar la carga en el carro antes de manipularla, sin ponerla sobre superficies frías'] },
      { id: 'u_look', ok: 1, t: ['Revisar que cada paquet sigui sec, íntegre i amb l\'indicador virat', 'Revisar que cada paquete esté seco, íntegro y con el indicador virado'] },
      { id: 'u_hands', ok: 0, t: ['Treure els paquets de seguida amb les mans (nues o humides) per guanyar temps', 'Sacar los paquetes enseguida con las manos (desnudas o húmedas) para ganar tiempo'] },
      { id: 'u_water', ok: 0, t: ['Refredar el material de vidre amb aigua freda perquè es pugui guardar abans', 'Enfriar el material de vidrio con agua fría para poder guardarlo antes'] },
      { id: 'u_squeeze', ok: 0, t: ['Prémer els paquets calents per comprovar si són secs', 'Apretar los paquetes calientes para comprobar si están secos'] }
    ],

    /* ---------- Missatges d'avaluació: [error ca, error es, bona pràctica ca, bona pràctica es] ---------- */
    M: {
      dest_dirty: ['Material amb restes orgàniques: «si no és net, no es pot esterilitzar». La brutícia protegeix els microorganismes encara que els indicadors virin.', 'Material con restos orgánicos: «si no está limpio, no se puede esterilizar». La suciedad protege a los microorganismos aunque los indicadores viren.', 'Tornar-lo a la zona bruta per rentar-lo i assecar-lo abans d\'empaquetar.', 'Devolverlo a la zona sucia para lavarlo y secarlo antes de empaquetar.'],
      dest_wet: ['Material encara humit: no es pot empaquetar així (surt humit i no estèril).', 'Material todavía húmedo: no se puede empaquetar así (sale húmedo y no estéril).', 'Assecar-lo completament abans d\'empaquetar.', 'Secarlo completamente antes de empaquetar.'],
      dest_rust: ['Instrumental rovellat o defectuós: no s\'ha d\'esterilitzar ni fer servir.', 'Instrumental oxidado o defectuoso: no se debe esterilizar ni usar.', 'Retirar-lo de la circulació i comunicar-ho per reposar-lo.', 'Retirarlo de la circulación y comunicarlo para reponerlo.'],
      dest_single: ['Producte d\'un sol ús: no es pot reprocessar si el fabricant no ho indica.', 'Producto de un solo uso: no se puede reprocesar si el fabricante no lo indica.', 'Descartar-lo; no s\'esterilitza.', 'Desecharlo; no se esteriliza.'],
      dest_flam: ['Producte inflamable: mai no ha d\'entrar a l\'autoclau (risc d\'incendi o explosió).', 'Producto inflamable: nunca debe entrar en el autoclave (riesgo de incendio o explosión).', 'Retirar-lo del carro.', 'Retirarlo del carro.'],
      dest_oil: ['Olis, vaselina i pols: el vapor no els penetra.', 'Aceites, vaselina y polvos: el vapor no los penetra.', 'Esterilitzar-los per calor seca (forn Pasteur).', 'Esterilizarlos por calor seco (horno Pasteur).'],
      dest_tl: ['Material termolàbil (plàstic sensible, òptiques): el vapor el deforma o el malmet.', 'Material termolábil (plástico sensible, ópticas): el vapor lo deforma o lo daña.', 'Esterilització a baixa temperatura (plasma de peròxid d\'hidrogen, òxid d\'etilè) o desinfecció d\'alt nivell, segons protocol.', 'Esterilización a baja temperatura (plasma de peróxido de hidrógeno, óxido de etileno) o desinfección de alto nivel, según protocolo.'],
      dest_liquid: ['Líquids: no es processen en un programa de sòlids (ebullició sobtada i rebentada del recipient en la descompressió).', 'Líquidos: no se procesan en un programa de sólidos (ebullición brusca y rotura del recipiente en la descompresión).', 'Programa específic de líquids, en un cicle a part i sense altre material.', 'Programa específico de líquidos, en un ciclo aparte y sin otro material.'],
      dest_steam: ['Aquest material és apte per a l\'autoclau de vapor: no calia desviar-lo.', 'Este material es apto para el autoclave de vapor: no hacía falta desviarlo.', 'Processar-lo a l\'autoclau de vapor (mètode d\'elecció per al material que el suporta).', 'Procesarlo en el autoclave de vapor (método de elección para el material que lo soporta).'],
      dest_later: ['Hi havia lloc a la cambra sense passar del 80 %: no calia deixar-lo per a un altre cicle.', 'Había sitio en la cámara sin pasar del 80 %: no hacía falta dejarlo para otro ciclo.', 'Carregar-lo en aquest cicle si hi cap sense superar el 80 %.', 'Cargarlo en este ciclo si cabe sin superar el 80 %.'],
      pack_foil: ['El paper d\'alumini no deixa passar el vapor: l\'interior no s\'esterilitza.', 'El papel de aluminio no deja pasar el vapor: el interior no se esteriliza.', 'Envàs permeable al vapor: bossa mixta, contenidor amb filtre, paper crepat, SMS o tela.', 'Envase permeable al vapor: bolsa mixta, contenedor con filtro, papel crepado, SMS o tela.'],
      pack_box: ['Una caixa metàl·lica tancada no deixa entrar el vapor (és un envàs per a calor seca).', 'Una caja metálica cerrada no deja entrar el vapor (es un envase para calor seco).', 'Contenidor rígid amb filtre o embolcall permeable al vapor.', 'Contenedor rígido con filtro o envoltorio permeable al vapor.'],
      pack_poly: ['Una bossa de plàstic normal no és permeable al vapor i es pot fondre.', 'Una bolsa de plástico normal no es permeable al vapor y se puede fundir.', 'Bossa mixta paper-plàstic de grau mèdic.', 'Bolsa mixta papel-plástico de grado médico.'],
      pack_none: ['Sense envàs, el material perd l\'esterilitat en obrir la porta: no es pot emmagatzemar com a estèril.', 'Sin envase, el material pierde la esterilidad al abrir la puerta: no se puede almacenar como estéril.', 'Envasar-lo amb un sistema de barrera estèril (UNE-EN ISO 11607).', 'Envasarlo con un sistema de barrera estéril (UNE-EN ISO 11607).'],
      pack_size: ['Envàs poc adequat per a aquest material (mida, pes o forma): es pot trencar o protegir malament.', 'Envase poco adecuado para este material (tamaño, peso o forma): se puede romper o proteger mal.', 'Bosses per a peces petites; contenidor rígid o doble embolcall per a caixes i tèxtils voluminosos.', 'Bolsas para piezas pequeñas; contenedor rígido o doble envoltorio para cajas y textiles voluminosos.'],
      open_no: ['Instrumental articulat tancat o travat: el vapor no arriba a les superfícies de contacte.', 'Instrumental articulado cerrado o trabado: el vapor no llega a las superficies de contacto.', 'Col·locar-lo obert, sense travar la cremallera.', 'Colocarlo abierto, sin trabar la cremallera.'],
      fill_no: ['Bossa massa plena: el segellat no tanca bé i es pot obrir o trencar.', 'Bolsa demasiado llena: el sellado no cierra bien y se puede abrir o romper.', 'Omplir les bosses com a màxim fins a 3/4 parts.', 'Llenar las bolsas como máximo hasta 3/4 partes.'],
      air_no: ['No s\'ha tret l\'aire de la bossa: s\'infla i pot rebentar durant el buit.', 'No se ha sacado el aire de la bolsa: se hincha y puede reventar durante el vacío.', 'Treure l\'aire abans de segellar.', 'Sacar el aire antes de sellar.'],
      ci_missing: ['Falta l\'indicador químic intern en un paquet que el necessita (contenidor o embolcall).', 'Falta el indicador químico interno en un paquete que lo necesita (contenedor o envoltorio).', 'Posar un indicador intern de classe 4, 5 o 6 al centre del paquet (segons protocol).', 'Poner un indicador interno de clase 4, 5 o 6 en el centro del paquete (según protocolo).'],
      ci_class1: ['A l\'interior s\'ha posat un indicador de classe 1 (de procés): només diu que el paquet ha passat pel procés.', 'En el interior se ha puesto un indicador de clase 1 (de proceso): solo dice que el paquete ha pasado por el proceso.', 'A dins, indicador de classe 4, 5 o 6.', 'Dentro, indicador de clase 4, 5 o 6.'],
      bi_missing: ['Càrrega amb implants sense indicador biològic.', 'Carga con implantes sin indicador biológico.', 'Incloure un indicador biològic (dins d\'un dispositiu de prova, PCD) i retenir la càrrega fins al resultat.', 'Incluir un indicador biológico (dentro de un dispositivo de prueba, PCD) y retener la carga hasta el resultado.'],
      label_no: ['Paquet sense etiqueta: no hi ha traçabilitat.', 'Paquete sin etiqueta: no hay trazabilidad.', 'Etiquetar cada paquet: data, contingut, lot o núm. de càrrega, caducitat i operari.', 'Etiquetar cada paquete: fecha, contenido, lote o n.º de carga, caducidad y operario.'],
      pos_pp: ['Bosses amb plàstic contra plàstic: el vapor no passa entre elles i l\'assecat empitjora.', 'Bolsas con plástico contra plástico: el vapor no pasa entre ellas y el secado empeora.', 'Bosses verticals, com en un arxivador, paper contra plàstic.', 'Bolsas verticales, como en un archivador, papel contra plástico.'],
      pos_flat: ['Bosses planes i apilades: el vapor circula malament i surten humides.', 'Bolsas planas y apiladas: el vapor circula mal y salen húmedas.', 'Bosses verticals, paper contra plàstic, amb espai entre elles.', 'Bolsas verticales, papel contra plástico, con espacio entre ellas.'],
      pos_up: ['Recipient boca amunt: s\'hi acumula aigua condensada i aire.', 'Recipiente boca arriba: se acumula agua condensada y aire.', 'Cubetes, ronyoneres i pots, boca avall o de costat.', 'Cubetas, batea y botes, boca abajo o de lado.'],
      pos_stack: ['Paquets apilats: dificulten la circulació del vapor i l\'assecat.', 'Paquetes apilados: dificultan la circulación del vapor y el secado.', 'Paquets separats, sense apilar.', 'Paquetes separados, sin apilar.'],
      wall: ['Paquet tocant la paret de la cambra: s\'hi condensa el vapor i surt humit.', 'Paquete tocando la pared de la cámara: se condensa el vapor y sale húmedo.', 'Deixar espai entre els paquets i les parets.', 'Dejar espacio entre los paquetes y las paredes.'],
      shelf_heavy: ['Material pesant o metàl·lic a la safata superior: la condensació goteja sobre els paquets de sota.', 'Material pesado o metálico en la bandeja superior: la condensación gotea sobre los paquetes de abajo.', 'Pesants i metàl·lics a la safata inferior.', 'Pesados y metálicos en la bandeja inferior.'],
      shelf_textile: ['Tèxtil a la safata inferior: rep la condensació i surt humit.', 'Textil en la bandeja inferior: recibe la condensación y sale húmedo.', 'Tèxtils a la safata superior.', 'Textiles en la bandeja superior.'],
      overload: ['Cambra per sobre del 80 %: el vapor no circula i queden zones fredes i paquets humits.', 'Cámara por encima del 80 %: el vapor no circula y quedan zonas frías y paquetes húmedos.', 'No passar del 80 % de la capacitat; fer un segon cicle.', 'No pasar del 80 % de la capacidad; hacer un segundo ciclo.'],
      fill_ok: ['', '', 'Càrrega per sota del 80 % de la capacitat.', 'Carga por debajo del 80 % de la capacidad.'],
      inspect_no: ['No s\'ha inspeccionat el material abans de carregar-lo.', 'No se ha inspeccionado el material antes de cargarlo.', 'Inspeccionar cada peça: neta, seca, sense òxid i funcionant.', 'Inspeccionar cada pieza: limpia, seca, sin óxido y funcionando.'],

      type_N: ['Cicle gravitatori (classe N) amb material embolcallat, porós o amb llum: l\'aire no s\'elimina bé i l\'assecat és insuficient.', 'Ciclo gravitatorio (clase N) con material envuelto, poroso o con luz: el aire no se elimina bien y el secado es insuficiente.', 'Programa de prebuit fraccionat (classe B).', 'Programa de prevacío fraccionado (clase B).'],
      type_L: ['El programa de líquids no és per a material sòlid embolcallat (no fa buit ni assecat).', 'El programa de líquidos no es para material sólido envuelto (no hace vacío ni secado).', 'Programa de sòlids amb prebuit (classe B).', 'Programa de sólidos con prevacío (clase B).'],
      type_needL: ['Els líquids necessiten el programa específic de líquids.', 'Los líquidos necesitan el programa específico de líquidos.', 'P5 · 121 °C líquids, en un cicle a part.', 'P5 · 121 °C líquidos, en un ciclo aparte.'],
      T_rubber: ['134 °C malmet la goma de làtex i el plàstic marcat per a 121 °C.', '134 °C daña la goma de látex y el plástico marcado para 121 °C.', '121 °C, ≈ 1 bar, 15-20 min per a goma i plàstics resistents.', '121 °C, ≈ 1 bar, 15-20 min para goma y plásticos resistentes.'],
      T_nonstd: ['Temperatura no validada: els programes habituals són 121 °C i 134 °C.', 'Temperatura no validada: los programas habituales son 121 °C y 134 °C.', 'Fer servir un programa validat (121 °C o 134 °C).', 'Usar un programa validado (121 °C o 134 °C).'],
      T_prion: ['El material amb risc de prions requereix 134 °C.', 'El material con riesgo de priones requiere 134 °C.', '134 °C durant almenys 18 min (o destrucció), segons el responsable.', '134 °C durante al menos 18 min (o destrucción), según el responsable.'],
      hold_short: ['Temps d\'esterilització insuficient per a aquesta temperatura.', 'Tiempo de esterilización insuficiente para esta temperatura.', '134 °C: 5-7 min (mínim normalitzat 3 min); 121 °C: 15-20 min.', '134 °C: 5-7 min (mínimo normalizado 3 min); 121 °C: 15-20 min.'],
      hold_low: ['Temps per sota del protocol habitual (5-7 min a 134 °C), tot i que arriba al mínim normalitzat.', 'Tiempo por debajo del protocolo habitual (5-7 min a 134 °C), aunque llega al mínimo normalizado.', '134 °C durant 5-7 min.', '134 °C durante 5-7 min.'],
      hold_long: ['Temps excessiu: desgasta el material sense cap benefici.', 'Tiempo excesivo: desgasta el material sin ningún beneficio.', 'Respectar el temps del programa validat.', 'Respetar el tiempo del programa validado.'],
      hold_prion: ['Material amb risc de prions: el temps és insuficient.', 'Material con riesgo de priones: el tiempo es insuficiente.', '134 °C durant almenys 18 min (programa de prions).', '134 °C durante al menos 18 min (programa de priones).'],
      dry_short: ['Assecat insuficient per a aquesta càrrega: els paquets surten humits.', 'Secado insuficiente para esta carga: los paquetes salen húmedos.', 'Assecat complet segons la càrrega (orientativament 15-20 min amb buit).', 'Secado completo según la carga (orientativamente 15-20 min con vacío).'],
      prog_ok: ['', '', 'Programa adequat a la càrrega.', 'Programa adecuado a la carga.'],
      prog_none: ['No s\'ha triat cap programa.', 'No se ha elegido ningún programa.', 'Triar el programa validat adequat a la càrrega.', 'Elegir el programa validado adecuado a la carga.'],
      dest_none: ['No s\'ha decidit què fer amb aquest material.', 'No se ha decidido qué hacer con este material.', 'Inspeccionar cada peça i decidir-ne la destinació.', 'Inspeccionar cada pieza y decidir su destino.'],

      water_no: ['No s\'ha comprovat el nivell d\'aigua del dipòsit.', 'No se ha comprobado el nivel de agua del depósito.', 'Comprovar el dipòsit d\'aigua abans de començar.', 'Comprobar el depósito de agua antes de empezar.'],
      water_tap: ['S\'ha omplert amb aigua de l\'aixeta: deixa calç, taques i corrosió i fa malbé l\'equip.', 'Se ha llenado con agua del grifo: deja cal, manchas y corrosión y estropea el equipo.', 'Aigua desmineralitzada o destil·lada.', 'Agua desmineralizada o destilada.'],
      water_low: ['S\'ha engegat amb el dipòsit per sota del mínim: el cicle s\'ha avortat.', 'Se ha puesto en marcha con el depósito por debajo del mínimo: el ciclo se ha abortado.', 'Omplir el dipòsit amb aigua desmineralitzada abans d\'engegar.', 'Llenar el depósito con agua desmineralizada antes de poner en marcha.'],
      clean_no: ['No s\'ha netejat la cambra ni revisat la junta de la porta i el filtre del desguàs.', 'No se ha limpiado la cámara ni revisado la junta de la puerta y el filtro del desagüe.', 'Netejar la cambra i revisar la junta i el filtre abans de començar.', 'Limpiar la cámara y revisar la junta y el filtro antes de empezar.'],
      preheat_no: ['Equip fred sense precalentament: hi ha més condensació i els paquets poden sortir humits.', 'Equipo frío sin precalentamiento: hay más condensación y los paquetes pueden salir húmedos.', 'Engegar i esperar el precalentament de la camisa abans del primer cicle.', 'Encender y esperar el precalentamiento de la camisa antes del primer ciclo.'],
      bd_missing: ['Primer cicle del dia en un autoclau de prebuit sense test de Bowie-Dick.', 'Primer ciclo del día en un autoclave de prevacío sin test de Bowie-Dick.', 'Fer el Bowie-Dick a l\'inici de la jornada, amb la cambra buida.', 'Hacer el Bowie-Dick al inicio de la jornada, con la cámara vacía.'],
      bd_place: ['El paquet de Bowie-Dick s\'ha posat amb càrrega: la prova no és vàlida.', 'El paquete de Bowie-Dick se ha puesto con carga: la prueba no es válida.', 'Cambra buida i paquet de prova a la safata inferior, prop del desguàs.', 'Cámara vacía y paquete de prueba en la bandeja inferior, cerca del desagüe.'],
      bd_ignored: ['S\'ha carregat material amb un Bowie-Dick fallit.', 'Se ha cargado material con un Bowie-Dick fallido.', 'Amb un Bowie-Dick fallit no es processa cap càrrega: es repeteix i, si torna a fallar, fora de servei.', 'Con un Bowie-Dick fallido no se procesa ninguna carga: se repite y, si vuelve a fallar, fuera de servicio.'],
      bd_norepeat: ['Davant d\'un primer Bowie-Dick fallit no s\'ha repetit la prova.', 'Ante un primer Bowie-Dick fallido no se ha repetido la prueba.', 'Repetir el Bowie-Dick una vegada; si torna a fallar, fora de servei i avís al servei tècnic.', 'Repetir el Bowie-Dick una vez; si vuelve a fallar, fuera de servicio y aviso al servicio técnico.'],
      door_open: ['Intent d\'obrir la porta amb pressió o temperatura altes: risc de cremades i d\'explosió de vapor.', 'Intento de abrir la puerta con presión o temperatura altas: riesgo de quemaduras y de explosión de vapor.', 'No obrir mai fins que la pressió sigui 0 i la porta es desbloquegi sola.', 'No abrir nunca hasta que la presión sea 0 y la puerta se desbloquee sola.'],
      estop: ['Aturada d\'emergència sense cap motiu: el cicle queda invalidat.', 'Parada de emergencia sin motivo: el ciclo queda invalidado.', 'Fer servir l\'aturada només davant d\'una situació de perill.', 'Usar la parada solo ante una situación de peligro.'],
      liquid_grave: ['Líquid en un cicle de sòlids: ebullició sobtada i rebentada de l\'ampolla en la descompressió (risc de cremades).', 'Líquido en un ciclo de sólidos: ebullición brusca y rotura del frasco en la descompresión (riesgo de quemaduras).', 'Líquids només amb el programa de líquids i en un cicle a part.', 'Líquidos solo con el programa de líquidos y en un ciclo aparte.'],
      flam_grave: ['Producte inflamable dins l\'autoclau: risc d\'incendi o explosió.', 'Producto inflamable dentro del autoclave: riesgo de incendio o explosión.', 'Mai no s\'introdueixen productes inflamables a l\'autoclau.', 'Nunca se introducen productos inflamables en el autoclave.'],
      unload_bad: ['Pràctica insegura a la descàrrega.', 'Práctica insegura en la descarga.', '', ''],
      unload_miss: ['Falta una precaució de descàrrega.', 'Falta una precaución de descarga.', '', ''],
      hint: ['Pista utilitzada en mode avaluació (−0,5).', 'Pista utilizada en modo evaluación (−0,5).', '', ''],

      ans: ['Interpretació incorrecta.', 'Interpretación incorrecta.', '', ''],
      dec_miss: ['Falta una acció necessària.', 'Falta una acción necesaria.', '', ''],
      dec_forb: ['Acció contraindicada en aquesta situació.', 'Acción contraindicada en esta situación.', '', ''],
      dec_extra: ['Acció innecessària en aquesta situació.', 'Acción innecesaria en esta situación.', '', ''],
      disp: ['Destinació incorrecta del paquet.', 'Destino incorrecto del paquete.', '', ''],
      grave_release: ['S\'ha alliberat material no estèril: risc directe per al pacient. L\'escenari queda anul·lat.', 'Se ha liberado material no estéril: riesgo directo para el paciente. El escenario queda anulado.', 'Cap paquet no conforme ni cap càrrega amb un control fallit no es pot alliberar.', 'Ningún paquete no conforme ni ninguna carga con un control fallido se puede liberar.']
    },

    /* preguntes conceptuals */
    concepts: {
      ext: { q: ['Tots els paquets tenen l\'indicador extern (de procés) virat. Què vol dir?', 'Todos los paquetes tienen el indicador externo (de proceso) virado. ¿Qué significa?'], o: [['Que el paquet ha passat pel procés; no demostra que l\'interior sigui estèril', 'Que el paquete ha pasado por el proceso; no demuestra que el interior sea estéril'], ['Que el contingut és estèril i ja no cal revisar res més', 'Que el contenido es estéril y ya no hace falta revisar nada más'], ['Que el cicle ha durat el temps programat', 'Que el ciclo ha durado el tiempo programado'], ['Que s\'han destruït les espores de l\'indicador biològic', 'Que se han destruido las esporas del indicador biológico']] }
    },
    /* tiquet de la impressora */
    ticket: {
      ca: { head: 'CENTRAL D\'ESTERILITZACIÓ', date: 'Data:', cycle: 'Cicle núm.:', prog: 'Programa:', manual: 'Manual', set: 'Consigna:', dry: 'assecat', typeB: 'prebuit', typeN: 'gravitatori', typeL: 'líquids', op: 'Operari/ària:', lot: 'Lot:', cols: 'Hora      Fase                    T °C  P bar', leakRate: 'Velocitat de fuita:', limit: 'límit', okLeak: '*** TEST DE BUIT CORRECTE ***', badLeak: '*** TEST DE BUIT INCORRECTE ***', plateau: 'Meseta:', tminmax: 'T mín./màx.:', pminmax: 'P mín./màx.:', dur: 'Durada:', dryDone: 'Assecat:', end: 'Fi:', bad: 'CICLE INCORRECTE', good: 'CICLE CORRECTE', alarm: 'ALARMA', al_manual: 'cicle interromput', al_water: 'manca d\'aigua', al_steam: 'T per sota de la consigna', bdNote: 'Avaluar la full de prova Bowie-Dick', sign: 'Signatura: ____________' },
      es: { head: 'CENTRAL DE ESTERILIZACIÓN', date: 'Fecha:', cycle: 'Ciclo n.º:', prog: 'Programa:', manual: 'Manual', set: 'Consigna:', dry: 'secado', typeB: 'prevacío', typeN: 'gravitatorio', typeL: 'líquidos', op: 'Operario/a:', lot: 'Lote:', cols: 'Hora      Fase                    T °C  P bar', leakRate: 'Velocidad de fuga:', limit: 'límite', okLeak: '*** TEST DE VACÍO CORRECTO ***', badLeak: '*** TEST DE VACÍO INCORRECTO ***', plateau: 'Meseta:', tminmax: 'T mín./máx.:', pminmax: 'P mín./máx.:', dur: 'Duración:', dryDone: 'Secado:', end: 'Fin:', bad: 'CICLO INCORRECTO', good: 'CICLO CORRECTO', alarm: 'ALARMA', al_manual: 'ciclo interrumpido', al_water: 'falta de agua', al_steam: 'T por debajo de la consigna', bdNote: 'Evaluar la hoja de prueba Bowie-Dick', sign: 'Firma: ____________' }
    },
    /* explicació de cada decisió (per a la retroacció) */
    decWhy: {
      release: ['El lot només s\'allibera si tots els controls són correctes (físic, químics i, si n\'hi ha, biològic) i els paquets són secs i íntegres.', 'El lote solo se libera si todos los controles son correctos (físico, químicos y, si lo hay, biológico) y los paquetes están secos e íntegros.'],
      quarantine: ['Les càrregues amb implants es retenen fins al resultat negatiu del biològic (llevat d\'urgència documentada segons protocol).', 'Las cargas con implantes se retienen hasta el resultado negativo del biológico (salvo urgencia documentada según protocolo).'],
      reprocess_some: ['Els paquets humits, oberts o amb un viratge incorrecte es consideren no estèrils i es reprocessen.', 'Los paquetes húmedos, abiertos o con un viraje incorrecto se consideran no estériles y se reprocesan.'],
      reprocess_all: ['Si falla un control de tota la càrrega (cicle avortat, paràmetres fora de rang, registre absent) tota la càrrega és no estèril.', 'Si falla un control de toda la carga (ciclo abortado, parámetros fuera de rango, registro ausente) toda la carga es no estéril.'],
      recall: ['Un biològic positiu obliga a considerar no estèril tot el material processat des de l\'últim control correcte i a recuperar-lo.', 'Un biológico positivo obliga a considerar no estéril todo el material procesado desde el último control correcto y a recuperarlo.'],
      out_of_service: ['Una fallada de l\'equip (aire residual, temperatura, biològic positiu, Bowie-Dick repetit fallit) requereix aturar-lo i revisió tècnica.', 'Un fallo del equipo (aire residual, temperatura, biológico positivo, Bowie-Dick repetido fallido) requiere pararlo y revisión técnica.'],
      notify: ['Les incidències greus es comuniquen al responsable de la central.', 'Las incidencias graves se comunican al responsable de la central.'],
      repeat_test: ['Una prova fallida o no vàlida es repeteix per confirmar-ne el resultat.', 'Una prueba fallida o no válida se repite para confirmar su resultado.'],
      use_equipment: ['Amb el Bowie-Dick correcte, l\'equip es pot fer servir amb normalitat.', 'Con el Bowie-Dick correcto, el equipo se puede usar con normalidad.'],
      register: ['Sense registre no hi ha traçabilitat: cada cicle, control i incidència s\'anota.', 'Sin registro no hay trazabilidad: cada ciclo, control e incidencia se anota.']
    },

    /* ---------- Banc d'escenaris ----------
       kind: run (preparar i executar) · diag (diagnosticar a partir de les proves)
       level 1-3 · group (diag): equip | pack | bio
       cart: [[itemId, estat]] · vary: claus que es trien a l'atzar en cada partida */
    scenarios: [
      {
        id: 'r-cures', kind: 'run', level: 1, firstOfDay: true, askExt: true,
        t: ['Material de cures de la planta', 'Material de curas de la planta'],
        brief: ['Comença el torn a la central. Arriba un carro de la zona de rentat amb material de cures de la planta de cirurgia. És el primer cicle del dia en un autoclau de prebuit (classe B).', 'Empieza el turno en la central. Llega un carro de la zona de lavado con material de curas de la planta de cirugía. Es el primer ciclo del día en un autoclave de prevacío (clase B).'],
        hint: ['Comprova l\'equip abans de carregar (aigua, cambra, precalentament, Bowie-Dick). Articulats oberts, bosses fins a 3/4 i sense aire, cubetes boca avall, pesants a baix i tèxtils a dalt.', 'Comprueba el equipo antes de cargar (agua, cámara, precalentamiento, Bowie-Dick). Articulados abiertos, bolsas hasta 3/4 y sin aire, cubetas boca abajo, pesados abajo y textiles arriba.'],
        cart: [['tisores'], ['kocher'], ['dissec'], ['ronyonera'], ['gases'], ['caixacures']],
        vary: { water: ['ok', 'low'] }
      },
      {
        id: 'r-goma', kind: 'run', level: 1, firstOfDay: false,
        t: ['Goma, silicona i plàstic autoclavable', 'Goma, silicona y plástico autoclavable'],
        brief: ['L\'equip ja ha fet cicles avui (Bowie-Dick correcte a primera hora). Cal esterilitzar material de goma i plàstic reutilitzable d\'una consulta, amb unes pinces.', 'El equipo ya ha hecho ciclos hoy (Bowie-Dick correcto a primera hora). Hay que esterilizar material de goma y plástico reutilizable de una consulta, con unas pinzas.'],
        hint: ['Mira la temperatura màxima que tolera cada material: la goma de làtex i el plàstic de 121 °C no suporten 134 °C.', 'Mira la temperatura máxima que tolera cada material: la goma de látex y el plástico de 121 °C no soportan 134 °C.'],
        cart: [['latex'], ['pprecip'], ['tubsil'], ['dissec']],
        vary: { extra: ['plastl', 'xeringa1u'] }
      },
      {
        id: 'r-intrusos', kind: 'run', level: 2, firstOfDay: false,
        t: ['Carro mixt: què pot anar a l\'autoclau?', 'Carro mixto: ¿qué puede ir al autoclave?'],
        brief: ['Un company ha deixat un carro amb material molt divers per «esterilitzar-ho tot junt». Inspecciona cada peça i decideix-ne la destinació abans de carregar.', 'Un compañero ha dejado un carro con material muy diverso para «esterilizarlo todo junto». Inspecciona cada pieza y decide su destino antes de cargar.'],
        hint: ['Inspecciona cada peça. El vapor no penetra olis ni pols; el termolàbil va a baixa temperatura; el d\'un sol ús no es reprocessa; el brut torna a neteja.', 'Inspecciona cada pieza. El vapor no penetra aceites ni polvos; lo termolábil va a baja temperatura; lo de un solo uso no se reprocesa; lo sucio vuelve a limpieza.'],
        cart: [['tisores'], ['kocher', 'dirty'], ['portaag', 'rust'], ['canula'], ['especul'], ['gases'], ['vaselina'], ['talc'], ['endo'], ['sonda1u'], ['serum'], ['alcohol']],
        vary: {}
      },
      {
        id: 'r-implants', kind: 'run', level: 2, firstOfDay: false, needBI: true,
        t: ['Caixa d\'implants per a quiròfan', 'Caja de implantes para quirófano'],
        brief: ['Quiròfan de traumatologia necessita per demà una caixa d\'implants, un contenidor de laparotomia i roba quirúrgica. L\'equip ja ha passat el Bowie-Dick d\'avui.', 'El quirófano de traumatología necesita para mañana una caja de implantes, un contenedor de laparotomía y ropa quirúrgica. El equipo ya ha pasado el Bowie-Dick de hoy.'],
        hint: ['Les càrregues amb implants porten indicador biològic i es retenen fins al resultat. Contenidors amb indicador intern, a la safata inferior i sense apilar.', 'Las cargas con implantes llevan indicador biológico y se retienen hasta el resultado. Contenedores con indicador interno, en la bandeja inferior y sin apilar.'],
        cart: [['implants'], ['contquir'], ['talles']],
        vary: {}
      },
      {
        id: 'r-bdfail', kind: 'run', level: 3, firstOfDay: true, faults: { leak: 25 },
        t: ['Inici de jornada: el Bowie-Dick no surt bé', 'Inicio de jornada: el Bowie-Dick no sale bien'],
        brief: ['Primera hora. Tens preparat un carro de material de cures per al primer cicle de l\'autoclau de prebuit. Abans, cal posar l\'equip a punt.', 'Primera hora. Tienes preparado un carro de material de curas para el primer ciclo del autoclave de prevacío. Antes, hay que poner el equipo a punto.'],
        hint: ['Si el Bowie-Dick falla no es carrega res: es repeteix i, si torna a fallar, l\'equip queda fora de servei. El test de buit ajuda a trobar la causa.', 'Si el Bowie-Dick falla no se carga nada: se repite y, si vuelve a fallar, el equipo queda fuera de servicio. El test de vacío ayuda a encontrar la causa.'],
        cart: [['caixacures'], ['gases'], ['tisores'], ['cubeta']],
        vary: { water: ['ok', 'low'] }
      },
      {
        id: 'r-prions', kind: 'run', level: 3, firstOfDay: false, prion: true,
        t: ['Instrumental amb risc de prions', 'Instrumental con riesgo de priones'],
        brief: ['La supervisora indica que unes pinces i unes tisores s\'han fet servir en un pacient amb sospita de malaltia de Creutzfeldt-Jakob. Ja s\'ha fet la neteja alcalina prèvia i, segons el protocol del centre, s\'han de processar amb el programa de prions.', 'La supervisora indica que unas pinzas y unas tijeras se han usado en un paciente con sospecha de enfermedad de Creutzfeldt-Jakob. Ya se ha hecho la limpieza alcalina previa y, según el protocolo del centro, se deben procesar con el programa de priones.'],
        hint: ['Priones: 134 °C durant almenys 18 min (o destrucció), sempre per decisió del responsable.', 'Priones: 134 °C durante al menos 18 min (o destrucción), siempre por decisión del responsable.'],
        cart: [['kocher'], ['tisores'], ['dissec'], ['mango']],
        vary: {}
      },
      {
        id: 'r-alarma', kind: 'run', level: 2, firstOfDay: false, faults: { cut: 0.45 },
        t: ['Alarma durant la fase d\'esterilització', 'Alarma durante la fase de esterilización'],
        brief: ['Cicle ordinari de material de cures. L\'equip ja ha fet el Bowie-Dick avui. Vigila la pantalla durant el cicle.', 'Ciclo ordinario de material de curas. El equipo ya ha hecho el Bowie-Dick hoy. Vigila la pantalla durante el ciclo.'],
        hint: ['Si el cicle s\'avorta, la càrrega no és estèril encara que els indicadors externs hagin virat. No obris la porta fins que la pressió sigui 0.', 'Si el ciclo se aborta, la carga no es estéril aunque los indicadores externos hayan virado. No abras la puerta hasta que la presión sea 0.'],
        cart: [['caixacures'], ['tisores'], ['ronyonera'], ['gases']],
        vary: {}
      },
      {
        id: 'r-sobrecarrega', kind: 'run', level: 2, firstOfDay: false,
        t: ['Molta feina: la càrrega no hi cap', 'Mucho trabajo: la carga no cabe'],
        brief: ['Dia de molta activitat: el quiròfan demana dos contenidors, una caixa de cures, roba i una ronyonera alhora. Valora si tot cap en un cicle.', 'Día de mucha actividad: el quirófano pide dos contenedores, una caja de curas, ropa y una batea a la vez. Valora si todo cabe en un ciclo.'],
        hint: ['Calcula l\'ocupació: no es pot passar del 80 % de la cambra. El que no hi capi va al cicle següent.', 'Calcula la ocupación: no se puede pasar del 80 % de la cámara. Lo que no quepa va al ciclo siguiente.'],
        cart: [['contquir'], ['contquir'], ['caixacures'], ['talles'], ['gases'], ['ronyonera']],
        vary: {}
      },

      /* ---------- Diagnòstic ---------- */
      {
        id: 'd-bd-ok', kind: 'diag', level: 1, group: 'equip',
        t: ['Bowie-Dick de primera hora', 'Bowie-Dick de primera hora'],
        brief: ['Has fet el test de Bowie-Dick a primera hora amb la cambra buida. Revisa la gràfica, el tiquet i la full de prova i decideix.', 'Has hecho el test de Bowie-Dick a primera hora con la cámara vacía. Revisa la gráfica, el tique y la hoja de prueba y decide.'],
        hint: ['Un viratge uniforme de tota la full indica que l\'aire s\'ha eliminat bé.', 'Un viraje uniforme de toda la hoja indica que el aire se ha eliminado bien.'],
        setup: { bd: { fault: 0 } }
      },
      {
        id: 'd-bd-fail', kind: 'diag', level: 2, group: 'equip',
        t: ['La full de Bowie-Dick té el centre pàl·lid', 'La hoja de Bowie-Dick tiene el centro pálido'],
        brief: ['Test de Bowie-Dick de primera hora. Hi ha càrregues esperant. Revisa la full i el tiquet.', 'Test de Bowie-Dick de primera hora. Hay cargas esperando. Revisa la hoja y el tique.'],
        hint: ['Una zona central més clara indica aire residual o gasos no condensables.', 'Una zona central más clara indica aire residual o gases no condensables.'],
        setup: { bd: { fault: 22 } },
        vary: { repeat: [0, 1] }
      },
      {
        id: 'd-curt', kind: 'diag', level: 2, group: 'equip',
        t: ['Un tiquet amb la meseta massa curta', 'Un tique con la meseta demasiado corta'],
        brief: ['Un company ha programat a mà un cicle «per anar més de pressa». Tots els indicadors químics han virat. Revisa el tiquet abans d\'alliberar la càrrega.', 'Un compañero ha programado a mano un ciclo «para ir más deprisa». Todos los indicadores químicos han virado. Revisa el tique antes de liberar la carga.'],
        hint: ['Compara el temps de meseta amb el mínim per a la temperatura del cicle.', 'Compara el tiempo de meseta con el mínimo para la temperatura del ciclo.'],
        setup: { prog: { type: 'B', T: 134, hold: 2, dry: 20 }, load: 'std' },
        vary: { prog: [{ type: 'B', T: 134, hold: 2, dry: 20 }, { type: 'B', T: 134, hold: 2.5, dry: 20 }] }
      },
      {
        id: 'd-humits', kind: 'diag', level: 1, group: 'pack',
        t: ['Paquets humits a la descàrrega', 'Paquetes húmedos en la descarga'],
        brief: ['Descarregues un cicle de 134 °C. El tiquet és correcte, però alguns paquets tenen gotes i taques d\'humitat. Revisa la càrrega i decideix què fas amb cada paquet.', 'Descargas un ciclo de 134 °C. El tique es correcto, pero algunos paquetes tienen gotas y manchas de humedad. Revisa la carga y decide qué haces con cada paquete.'],
        hint: ['Un paquet humit no és estèril: la humitat fa de metxa per als microorganismes.', 'Un paquete húmedo no es estéril: la humedad hace de mecha para los microorganismos.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'wet' },
        q: [{ id: 'cause', q: ['Quina és la causa més probable d\'aquests paquets humits?', '¿Cuál es la causa más probable de estos paquetes húmedos?'], o: [['Paquets tocant la paret, recipient boca amunt i tèxtil a la safata inferior', 'Paquetes tocando la pared, recipiente boca arriba y textil en la bandeja inferior'], ['La temperatura de 134 °C és massa alta per al tèxtil', 'La temperatura de 134 °C es demasiado alta para el textil'], ['Els indicadors externs eren de mala qualitat', 'Los indicadores externos eran de mala calidad'], ['Hi havia massa poca càrrega a la cambra', 'Había demasiado poca carga en la cámara']], c: 0 }]
      },
      {
        id: 'd-ci', kind: 'diag', level: 2, group: 'pack',
        t: ['Un integrador intern que no ha virat', 'Un integrador interno que no ha virado'],
        brief: ['Cicle de 134 °C amb tiquet correcte. En obrir els paquets de control trobes un integrador de classe 5 que no arriba a la zona d\'acceptació.', 'Ciclo de 134 °C con tique correcto. Al abrir los paquetes de control encuentras un integrador de clase 5 que no llega a la zona de aceptación.'],
        hint: ['Si un indicador intern no vira, aquell paquet no es pot fer servir; la resta, només si tots els altres controls són correctes.', 'Si un indicador interno no vira, ese paquete no se puede usar; el resto, solo si todos los demás controles son correctos.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'ci' }
      },
      {
        id: 'd-bi-pos', kind: 'diag', level: 3, group: 'bio',
        t: ['Indicador biològic setmanal positiu', 'Indicador biológico semanal positivo'],
        brief: ['Fa dos dies es va processar el control biològic setmanal (Geobacillus stearothermophilus dins d\'un dispositiu de prova). Els lots d\'aquests dos dies ja s\'han distribuït. Avui llegeixes el resultat.', 'Hace dos días se procesó el control biológico semanal (Geobacillus stearothermophilus dentro de un dispositivo de prueba). Los lotes de estos dos días ya se han distribuido. Hoy lees el resultado.'],
        hint: ['Compara el tub processat amb el control positiu: groc = creixement.', 'Compara el tubo procesado con el control positivo: amarillo = crecimiento.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'bi', bi: { res: 'pos', ctrl: 1 } }
      },
      {
        id: 'd-bi-ctrl', kind: 'diag', level: 3, group: 'bio',
        t: ['Biològic negatiu… i control també negatiu', 'Biológico negativo… y control también negativo'],
        brief: ['Lectura del control biològic setmanal. El tub processat no ha canviat de color. El tub control (mateix lot, no processat) tampoc.', 'Lectura del control biológico semanal. El tubo procesado no ha cambiado de color. El tubo control (mismo lote, no procesado) tampoco.'],
        hint: ['El control no processat ha de créixer: si no creix, la prova no es pot interpretar.', 'El control no procesado debe crecer: si no crece, la prueba no se puede interpretar.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'bi', bi: { res: 'neg', ctrl: 0 } }
      },
      {
        id: 'd-caixa', kind: 'diag', level: 2, group: 'pack',
        t: ['Cinta virada, indicador intern no', 'Cinta virada, indicador interno no'],
        brief: ['Un company en pràctiques ha preparat part de la càrrega. Tots els paquets tenen la cinta exterior virada, però dos indicadors interns no han virat.', 'Un compañero en prácticas ha preparado parte de la carga. Todos los paquetes tienen la cinta exterior virada, pero dos indicadores internos no han virado.'],
        hint: ['La cinta externa només diu que el paquet ha estat exposat al procés. Mira com estan envasats.', 'La cinta externa solo dice que el paquete ha sido expuesto al proceso. Mira cómo están envasados.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'box' },
        q: [{ id: 'why', q: ['Per què la cinta exterior ha virat i l\'indicador intern no?', '¿Por qué la cinta exterior ha virado y el indicador interno no?'], o: [['Perquè l\'envàs (alumini, caixa tancada) no deixa passar el vapor: la cinta només indica exposició externa', 'Porque el envase (aluminio, caja cerrada) no deja pasar el vapor: la cinta solo indica exposición externa'], ['Perquè l\'indicador intern estava caducat; el paquet és estèril igualment', 'Porque el indicador interno estaba caducado; el paquete es estéril igualmente'], ['Perquè el cicle ha estat massa llarg', 'Porque el ciclo ha sido demasiado largo'], ['Perquè la cinta exterior és més fiable que l\'indicador intern', 'Porque la cinta exterior es más fiable que el indicador interno']], c: 0 }]
      },
      {
        id: 'd-aire', kind: 'diag', level: 3, group: 'equip',
        t: ['Pressió massa alta per a la temperatura', 'Presión demasiado alta para la temperatura'],
        brief: ['Aquest autoclau antic no calcula la temperatura teòrica. La impressora diu «CICLE CORRECTE». Revisa els valors de la meseta amb la relació del vapor saturat.', 'Este autoclave antiguo no calcula la temperatura teórica. La impresora dice «CICLO CORRECTO». Revisa los valores de la meseta con la relación del vapor saturado.'],
        hint: ['El vapor saturat a 134 °C fa ≈ 2,0-2,1 bar de sobrepressió. Si la pressió és clarament més alta, hi ha aire barrejat.', 'El vapor saturado a 134 °C da ≈ 2,0-2,1 bar de sobrepresión. Si la presión es claramente más alta, hay aire mezclado.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'std', faults: { ncg: 0.3 }, machineOk: true }
      },
      {
        id: 'd-porta', kind: 'diag', level: 2, group: 'pack',
        t: ['Cicle interromput durant l\'assecat', 'Ciclo interrumpido durante el secado'],
        brief: ['Per pressa, un company ha cancel·lat el cicle durant l\'assecat i ha tret la càrrega calenta. Et demana que la guardis al magatzem estèril.', 'Por prisa, un compañero ha cancelado el ciclo durante el secado y ha sacado la carga caliente. Te pide que la guardes en el almacén estéril.'],
        hint: ['Un cicle no acabat no és un cicle vàlid, i l\'assecat forma part del procés.', 'Un ciclo no acabado no es un ciclo válido, y el secado forma parte del proceso.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'std', abortDry: true }
      },
      {
        id: 'd-registre', kind: 'diag', level: 2, group: 'bio',
        t: ['Sense tiquet ni registre del cicle', 'Sin tique ni registro del ciclo'],
        brief: ['La impressora s\'ha quedat sense paper i la memòria de l\'equip no conserva aquest cicle. Els indicadors externs han virat i els paquets són secs. No hi ha cap altra dada del cicle.', 'La impresora se ha quedado sin papel y la memoria del equipo no conserva este ciclo. Los indicadores externos han virado y los paquetes están secos. No hay ningún otro dato del ciclo.'],
        hint: ['Sense control físic registrat no es pot demostrar que el cicle hagi complert els paràmetres.', 'Sin control físico registrado no se puede demostrar que el ciclo haya cumplido los parámetros.'],
        setup: { prog: { type: 'B', T: 134, hold: 5, dry: 20 }, load: 'std', noRecord: true }
      },
      {
        id: 'd-magatzem', kind: 'diag', level: 1, group: 'bio',
        t: ['Revisió del magatzem estèril', 'Revisión del almacén estéril'],
        brief: ['Fas la revisió setmanal del magatzem de material estèril. Decideix què es pot continuar fent servir i què no, i comprova les condicions de la sala.', 'Haces la revisión semanal del almacén de material estéril. Decide qué se puede seguir usando y qué no, y comprueba las condiciones de la sala.'],
        hint: ['Abans d\'usar un paquet: sencer, sec, indicador virat, etiqueta completa i dins de la data. FIFO.', 'Antes de usar un paquete: entero, seco, indicador virado, etiqueta completa y dentro de fecha. FIFO.'],
        setup: { storage: true },
        q: [{ id: 'room', q: ['El termohigròmetre de la sala marca 21 °C i 68 % d\'humitat relativa. Què en penses?', 'El termohigrómetro de la sala marca 21 °C y 68 % de humedad relativa. ¿Qué opinas?'], o: [['La humitat és massa alta (cal 35-50 %): s\'ha de comunicar i corregir', 'La humedad es demasiado alta (debe ser 35-50 %): se debe comunicar y corregir'], ['Tot correcte: com més humitat, millor es conserva el paper', 'Todo correcto: cuanta más humedad, mejor se conserva el papel'], ['La temperatura és massa baixa (cal > 25 °C)', 'La temperatura es demasiado baja (hace falta > 25 °C)'], ['Les condicions de la sala no influeixen en l\'esterilitat', 'Las condiciones de la sala no influyen en la esterilidad']], c: 0 }]
      },
      {
        id: 'd-121-ok', kind: 'diag', level: 1, group: 'equip',
        t: ['Cicle de 121 °C per revisar', 'Ciclo de 121 °C para revisar'],
        brief: ['Descarregues un cicle de goma i plàstic a 121 °C. Revisa el tiquet, els indicadors i l\'estat dels paquets abans de decidir.', 'Descargas un ciclo de goma y plástico a 121 °C. Revisa el tique, los indicadores y el estado de los paquetes antes de decidir.'],
        hint: ['121 °C: ≈ 1 bar de sobrepressió i 15-20 min de meseta.', '121 °C: ≈ 1 bar de sobrepresión y 15-20 min de meseta.'],
        setup: { prog: { type: 'B', T: 121, hold: 20, dry: 20 }, load: 'rub' }
      }
    ],

    /* càrregues predefinides dels escenaris de diagnòstic: [itemId, opcions] */
    loads: {
      std: [['caixacures', { pack: 'cont', ci: 5, shelf: 'low', pos: 'sep' }], ['tisores', { pack: 'bag', ci: 5 }], ['kocher', { pack: 'bag' }], ['gases', { pack: 'bag', shelf: 'up', ci: 5 }]],
      wet: [['caixacures', { pack: 'cont', ci: 5, shelf: 'low', pos: 'sep', wall: true }], ['ronyonera', { pack: 'bag', pos: 'up', shelf: 'low' }], ['tisores', { pack: 'bag', ci: 5 }], ['gases', { pack: 'bag', shelf: 'low', ci: 5 }], ['dissec', { pack: 'bag' }]],
      ci: [['caixacures', { pack: 'cont', ci: 5, shelf: 'low', pos: 'sep' }], ['tisores', { pack: 'bag', ci: 5, ciForce: 0 }], ['kocher', { pack: 'bag', ci: 5 }], ['gases', { pack: 'bag', shelf: 'up', ci: 5 }]],
      bi: [['caixacures', { pack: 'cont', ci: 5, shelf: 'low', pos: 'sep', bi: true }], ['tisores', { pack: 'bag', ci: 5 }], ['gases', { pack: 'bag', shelf: 'up', ci: 5 }]],
      box: [['caixacures', { pack: 'box', ci: 5, shelf: 'low', pos: 'sep' }], ['tisores', { pack: 'foil', ci: 5 }], ['kocher', { pack: 'bag', ci: 5 }], ['gases', { pack: 'bag', shelf: 'up', ci: 5 }]],
      rub: [['latex', { pack: 'bag', ci: 5 }], ['pprecip', { pack: 'bag', ci: 5 }], ['tubsil', { pack: 'bag', ci: 5 }]]
    },
    /* paquets del magatzem (escenari d-magatzem): st = estat; expected = destinació correcta */
    storage: [
      { item: 'caixacures', pack: 'cont', st: 'ok', exp: 'store' },
      { item: 'tisores', pack: 'bag', st: 'expired', exp: 'reprocess' },
      { item: 'gases', pack: 'bag', st: 'torn', exp: 'reprocess' },
      { item: 'kocher', pack: 'bag', st: 'wetstain', exp: 'reprocess' },
      { item: 'dissec', pack: 'bag', st: 'nolabel', exp: 'reprocess' },
      { item: 'ronyonera', pack: 'bag', st: 'noturn', exp: 'reprocess' },
      { item: 'portaag', pack: 'bag', st: 'ok', exp: 'store' }
    ],
    storageStates: {
      ok: ['Envàs sencer i sec, indicador virat, etiqueta completa i dins de la data.', 'Envase entero y seco, indicador virado, etiqueta completa y dentro de fecha.'],
      expired: ['Data de caducitat superada fa una setmana.', 'Fecha de caducidad superada hace una semana.'],
      torn: ['Un petit forat a la cara de paper.', 'Un pequeño agujero en la cara de papel.'],
      wetstain: ['Taca d\'aigua seca al paper (estava a prop de la pica).', 'Mancha de agua seca en el papel (estaba cerca del fregadero).'],
      nolabel: ['Sense etiqueta de lot ni data.', 'Sin etiqueta de lote ni fecha.'],
      noturn: ['L\'indicador de procés de la bossa no ha virat.', 'El indicador de proceso de la bolsa no ha virado.']
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.SimData = D;
})(this);
