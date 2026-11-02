/* Contingut de l'escape room (català). Les respostes NO són aquí: són a answers.js en forma de hash. */
window.ESC_CONTENT = {
  title: 'Control del sistema de descontaminació',
  lab: 'Laboratori BSL-4',

  intro: {
    badge: 'Alerta biològica nivell 4',
    lines: [
      'S’ha detectat una contaminació al laboratori de seguretat BSL-4.',
      'Un incident ha compromès les mesures de contenció durant els experiments amb un virus hemorràgic altament letal.',
      'El sistema de descontaminació automàtic ha fallat i l’àrea es troba en quarantena.',
      'Tots els protocols d’emergència han estat activats.'
    ],
    ask: 'Per restablir el control i evitar la propagació, introdueix el codi segur de verificació.'
  },

  brief: {
    title: 'Error en el codi de verificació segur',
    lead: 'Codi segur de verificació incorrecte.',
    lines: [
      'Per activar el sistema de descontaminació heu de resoldre <b>6 proves de seguretat</b>. Cada prova us donarà una <b>paraula clau</b> que haureu d’introduir per continuar.',
      'La bitàcola desa les paraules clau que aneu desbloquejant. Tot i això, apunteu-les en un paper: podríeu necessitar-les.'
    ]
  },

  rules: {
    note: 'El sistema només accepta majúscules i no reconeix accents. Ho adaptem per vosaltres.'
  },

  proves: [
    {
      id: 'p1', type: 'order', title: '1a prova',
      quote: 'Només si entens l’ordre com es propaga la malaltia podràs trencar-ne el cicle.',
      task: 'Ordena els sis eslabons de la cadena d’infecció, des de l’origen fins a la persona que acaba emmalaltint. Les inicials formen la paraula clau.',
      items: [
        { id: 'hoste',   label: 'Hoste susceptible',  mark: 'H' },
        { id: 'via',     label: 'Via de transmissió', mark: 'V' },
        { id: 'agent',   label: 'Agent infecciós',    mark: 'A' },
        { id: 'entrada', label: 'Porta d’entrada', mark: 'E' },
        { id: 'sortida', label: 'Porta de sortida',   mark: 'S' },
        { id: 'reserva', label: 'Reserva del patogen', mark: 'R' }
      ],
      hints: [
        'Pensa en el recorregut d’un patogen: on viu, com surt, com viatja i com arriba a la persona següent.',
        'Comença pel microorganisme (l’agent) i acaba amb la persona que emmalalteix (l’hoste).'
      ]
    },

    {
      id: 'p2', type: 'select', title: '2a prova',
      quote: 'Només un agent pot travessar les parets de la cèl·lula i fer-la explotar des de dins. El coneixement és la millor vacuna.',
      task: 'L’ordinador de seguretat t’envia quatre informes biològics trobats a diferents mostres del laboratori. Només una correspon al patogen hemorràgic que ha provocat l’accident. Analitza les dades amb atenció: qualsevol error podria fer que el sistema no reconegui el patogen correcte.',
      pista: 'Les dues primeres lletres són importants.',
      prompt: 'Tipus probable d’agent',
      options: [
        { id: 'bacteri', label: 'Bacteri' }, { id: 'virus', label: 'Virus' },
        { id: 'fong', label: 'Fong' }, { id: 'prio', label: 'Prió' }, { id: 'parasit', label: 'Paràsit' }
      ],
      rows: [
        { title: 'Informe 1, mostra A', bullets: ['Té paret cel·lular gruixuda composta de peptidoglicans.', 'Es divideix per fissió binària.', 'Es pot tractar amb penicil·lina.', 'Viu lliurement fora de les cèl·lules.'] },
        { title: 'Informe 2, mostra B', bullets: ['Format per una càpsida proteica i un embolcall lipídic.', 'No presenta nucli ni citoplasma.', 'Pot contenir ARN com a material genètic.', 'Només es reprodueix dins de cèl·lules animals.', 'Sospita de malaltia hemorràgica.'] },
        { title: 'Informe 3, mostra C', bullets: ['És eucariota unicel·lular.', 'Es reprodueix per gemmació.', 'Forma colònies blanquinoses sobre medis sòlids.', 'Causa candidiasi en pacients immunodeprimits.'] },
        { title: 'Informe 4, mostra D', bullets: ['No té material genètic.', 'Es tracta d’una proteïna anòmala capaç de transformar altres proteïnes.', 'Causa lesions cerebrals irreversibles.', 'Extremadament resistent a l’esterilització.'] }
      ],
      hints: [
        'Compara cada informe amb l’estructura cel·lular: paret, nucli, càpsida, material genètic.',
        'Un dels agents no és una cèl·lula i n’hi ha un altre que ni tan sols té àcids nucleics.'
      ]
    },

    {
      id: 'p3', type: 'grid', title: '3a prova',
      quote: 'Només si interpretes correctament les dades descobriràs el codi per frenar la mutació del bacteri.',
      task: 'Els cultius del laboratori han mostrat diferents respostes a sis antibiòtics. S vol dir sensible i R resistent.',
      antibiotics: ['Amoxicil·lina', 'Eritromicina', 'Ciprofloxacina', 'Vancomicina', 'Doxiciclina', 'Gentamicina'],
      patients: [
        { name: 'Pacient A', res: 'SSRRRR' },
        { name: 'Pacient B', res: 'RRSSRR' },
        { name: 'Pacient C', res: 'RRRRSS' }
      ],
      steps: [
        { t: 'Pas 1', d: 'Marca els antibiòtics que faries servir per tractar cada pacient.' },
        { t: 'Pas 2', d: 'Cada antibiòtic té una lletra: agafa la que indica el seu número d’ordre.' },
        { t: 'Pas 3', d: 'Llegeix d’esquerra a dreta: Pacient A, Pacient B, Pacient C.' }
      ],
      letterRule: [['Amoxicil·lina', '2a'], ['Eritromicina', '1a'], ['Ciprofloxacina', '3a'], ['Vancomicina', '4a'], ['Doxiciclina', '2a'], ['Gentamicina', '6a']],
      hints: [
        'Només té sentit tractar amb antibiòtics als quals el bacteri és sensible (S).',
        'Cada pacient té exactament dos antibiòtics útils.'
      ]
    },

    {
      id: 'p4', type: 'select', title: '4a prova',
      quote: 'Cada error obre una porta nova al desastre.',
      task: 'El virus hemorràgic pot escapar per diferents vies. Només si bloqueges totes les rutes correctament formaràs la paraula que tancarà el circuit biològic.',
      legend: [['Contacte', 0], ['Gotes', 1], ['Aire', 2], ['Vectors', 0], ['Entèrica', 3], ['Fluids', 0]],
      legendNote: 'La lletra destacada de cada via és la que forma la paraula clau.',
      prompt: 'Via de transmissió',
      options: [
        { id: 'contacte', label: 'Contacte' }, { id: 'gotes', label: 'Gotes' }, { id: 'aire', label: 'Aire' },
        { id: 'vectors', label: 'Vectors' }, { id: 'enterica', label: 'Entèrica' }, { id: 'fluids', label: 'Fluids' }
      ],
      rows: [
        { title: 'Un tècnic neteja taules contaminades i es toca els ulls.' },
        { title: 'Una mostra de saliva projectada per una tos recorre menys d’un metre.' },
        { title: 'Un error en la ventilació dispersa aerosols microscòpics.' },
        { title: 'Un mosquit transmet el virus entre dues persones.' },
        { title: 'Un pacient beu aigua contaminada.' },
        { title: 'Un sanitari toca un teclat contaminat sense guants.' },
        { title: 'Un nen juga amb un objecte que havia tocat un malalt.' },
        { title: 'Una persona amb símptomes deixa secrecions a l’aire lliure.' }
      ],
      hints: [
        'Pregunta’t com arriba el patogen d’una persona a l’altra: tocant, per l’aire, per un insecte, per aigua o aliments…',
        'Els casos 1, 6 i 7 comparteixen la mateixa via.'
      ]
    },

    {
      id: 'p5', type: 'select', title: '5a prova',
      quote: 'El sistema defensor.',
      task: 'Has d’identificar correctament el component o concepte que resol cada microcas. Després agafaràs una lletra de cada terme, segons la posició que s’indica.',
      prompt: 'Component o concepte',
      options: [
        { id: 'humoral', label: 'Humoral' }, { id: 'neutrofils', label: 'Neutròfils' }, { id: 'anticossos', label: 'Anticossos' },
        { id: 'memoria', label: 'Memòria' }, { id: 'thelper', label: 'T-helper' }, { id: 'macrofags', label: 'Macròfags' },
        { id: 'innata', label: 'Innata' }, { id: 'limfocits', label: 'Limfòcits-T' }
      ],
      rows: [
        { title: 'Primera línia de defensa (pell, mucoses)', rule: '1a lletra' },
        { title: 'Genera memòria immunològica (exposicions futures)', rule: '1a lletra' },
        { title: 'Fagocitosi de patògens', rule: '1a lletra' },
        { title: 'Resposta adaptativa de tipus humoral', rule: '2a lletra' },
        { title: 'Leucòcits polimorfonuclears principals a fase aguda', rule: '1a lletra' },
        { title: 'Primera barrera i patró ràpid i inespecífic', rule: '1a lletra' },
        { title: 'Citotoxicitat específica (destrueix cèl·lules infectades)', rule: 'darrera lletra' },
        { title: 'Proteïnes que neutralitzen antígens', rule: '1a lletra' },
        { title: 'Cèl·lules T col·laboradores', rule: '1a lletra' }
      ],
      hints: [
        'Fixa-t’hi: cada pista descriu una defensa immediata i inespecífica, o bé una resposta específica amb memòria?',
        'Un mateix terme del banc s’utilitza dues vegades.'
      ]
    },

    {
      id: 'p6', type: 'select', title: '6a prova',
      quote: 'Cada patogen té el seu camí preferit.',
      task: 'Relaciona cada microorganisme amb la seva via principal de transmissió i agafa la lletra que s’indica.',
      prompt: 'Via principal',
      options: [
        { id: 'vectorial', label: 'Vectorial' }, { id: 'sanguinia', label: 'Sanguínia' }, { id: 'enterica', label: 'Entèrica' },
        { id: 'aeria', label: 'Aèria' }, { id: 'contacte', label: 'Contacte' }
      ],
      rows: [
        { title: 'Mycobacterium tuberculosis (bacteri)', sub: 'S’escampa quan una persona infectada tus en espais tancats.', rule: '2a lletra' },
        { title: 'Hepatitis B (virus)', sub: 'Es transmet per fluids corporals o transfusions.', rule: '3a lletra' },
        { title: 'Vibrio cholerae (bacteri)', sub: 'Causa infeccions intestinals després d’ingerir aigua contaminada.', rule: '1a lletra' },
        { title: 'Plasmodium falciparum (paràsit)', sub: 'Es transmet per picada de mosquit <i>Anopheles</i>.', rule: '3a lletra' },
        { title: 'Candida albicans (fong)', sub: 'Pot contagiar-se tocant amb mucoses o superfícies contaminades.', rule: '4a lletra' },
        { title: 'Coronavirus SARS-CoV-2 (virus)', sub: '', rule: '1a lletra' }
      ],
      hints: [
        'Pensa en el mecanisme principal de transmissió de cada microorganisme, no en totes les maneres possibles.',
        'Hi ha dos microorganismes que comparteixen la mateixa via.'
      ]
    }
  ],

  final: {
    title: 'Activació del sistema de descontaminació',
    lead: 'Desbloqueig permès. Introdueix la contrasenya de desbloqueig.',
    rules: [
      { p: 'p1', text: '2a lletra' },
      { p: 'p2', text: '7a lletra' },
      { p: 'p3', text: '2a lletra' },
      { p: 'p4', text: '2a lletra i 4a i 5a lletra juntes' },
      { p: 'p5', text: '1a lletra i 5a lletra' },
      { p: 'p6', text: '4a lletra' }
    ],
    pista: 'L’ordinador mostra les lletres disperses com a fragments d’un protocol perdut. Si les ordenes segons l’ordre temporal d’una infecció, és a dir, el que fem abans que el virus s’escapi, el sistema et donarà la clau per activar la barrera de seguretat.',
    hints: [
      'Primer troba els vuit fragments de lletres; després ordena’ls fins a formar una paraula d’aquest tema.',
      'La paraula té nou lletres.'
    ]
  },

  done: {
    title: 'Sistema de descontaminació activat',
    status: 'Protocol activat',
    online: 'Sistema de descontaminació del laboratori BSL-4: en línia',
    lines: [
      'Les llums d’emergència canvien de vermell a verd.',
      'El vapor antisèptic omple les cambres mentre el virus queda neutralitzat.'
    ],
    screens: ['Pressió negativa estabilitzada', 'Agents biològics confinats', 'Cap mostra activa detectada'],
    outro: ['Protocol PREVENCIO completat amb èxit.', 'El futur de la humanitat torna a estar sota control.'],
    closing: 'Laboratori descontaminat. Sessió finalitzada.'
  }
};
