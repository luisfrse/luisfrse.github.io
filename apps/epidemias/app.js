/* ============================================================
   Simulador de epidemias · interfaz
   Usa sim.js (modelo) y ../shared/app.js (AppKit).
   ============================================================ */
(() => {
  'use strict';
  const { Sim, derive, finalSize, seir, DT } = window.EpiSim;
  const K = AppKit;
  const $ = (s, r = document) => r.querySelector(s);
  const store = K.storage('epidemias');
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= textos ================= */
  const I18N = {
    es: {
      title: `Simulador de epidemias`,
      intro_h: `Cómo se propaga una epidemia`,
      intro_p: `Cada punto es una persona. Elige un escenario y observa cómo se transmite la infección, cuándo llega el pico y qué cambian las vacunas, las mascarillas, el distanciamiento o el aislamiento de casos.`,
      scen_h: `Escenario`, custom: `Personalizado`, custom_n: `Escenario personalizado`,
      custom_d: `Ajusta los parámetros de la enfermedad y de las medidas en el panel de controles para crear tu propio brote.`,
      f_r0: `R0 usado`, f_range: `Rango publicado`, f_latent: `Periodo latente`, f_infect: `Periodo infeccioso`, f_cfr: `Letalidad`, f_eff: `Eficacia de la vacuna`, f_need: `Cobertura necesaria`, f_src: `Fuentes`,
      f_note: `Los valores son aproximaciones: la bibliografía da rangos amplios según la población y el método.`,
      measles_n: `Sarampión`, measles_d: `Es el virus más contagioso de los habituales: un caso puede infectar a 12–18 personas sin inmunidad. Por eso hace falta que cerca del 95 % de la población esté protegida para cortar las cadenas de contagio.`,
      pertussis_n: `Tos ferina`, pertussis_d: `Muy contagiosa y con un periodo infeccioso largo. La protección de la vacuna disminuye con los años, por eso son importantes las dosis de refuerzo.`,
      varicella_n: `Varicela`, varicella_d: `Muy contagiosa, con una incubación larga. La vacuna de dos dosis protege bien y reduce mucho los brotes en los colegios.`,
      flu_n: `Gripe estacional`, flu_d: `Cada caso contagia a pocas personas, pero hay mucha población susceptible cada invierno. La vacuna protege solo en parte y se actualiza cada año.`,
      flu1918_n: `Gripe de 1918`, flu1918_d: `Pandemia de gripe A(H1N1) de 1918–1919, sin vacunas ni antibióticos. Aquí puedes comprobar cuánto ayudarían el aislamiento, el distanciamiento y las mascarillas (y una vacuna hipotética).`,
      covid_n: `COVID-19 (cepa original)`, covid_d: `Primera ola de la pandemia, sin inmunidad previa ni vacunas. Como parte del contagio ocurre antes de los síntomas, aislar casos funciona menos de lo que parece.`,
      s_day: `Día`, s_r0eff: `R0 con medidas`, s_re: `R ahora`, s_hit: `Umbral de inmunidad de grupo`, s_inf: `Infectados`, s_inf_th: `Infectados · teoría {v} %`, s_peak: `Pico de infecciosos`, s_peak_day: `Pico · día {d}`,
      world_h: `Población`, btn_play: `Iniciar`, btn_resume: `Reanudar`, btn_pause: `Pausar`, btn_step: `+1 día`, btn_week: `+7 días`, btn_reset: `Reiniciar`,
      speed_l: `Velocidad`, opt_radius: `Mostrar radio de contacto`, click_hint: `Haz clic en la población para introducir un caso nuevo.`,
      world_msg_done: `La epidemia terminó el día {d}: se infectó el {p} % de la población.`,
      world_msg_rm: `Animaciones reducidas: avanza con «+1 día» o «+7 días».`,
      world_aria: `Mapa de la población simulada: día {d}, {S} susceptibles, {E} expuestos, {I} infecciosos, {R} recuperados, {V} vacunados protegidos y {D} fallecidos.`,
      st_S: `Susceptibles`, st_E: `Expuestos`, st_I: `Infecciosos`, st_R: `Recuperados`, st_V: `Vacunados`, st_D: `Fallecidos`,
      sd_S: `Aún no se han infectado y no están protegidos`, sd_E: `Infectados que todavía no contagian (periodo latente)`, sd_I: `Pueden contagiar a quienes están cerca`,
      sd_R: `Se han recuperado y son inmunes`, sd_V: `Vacunados y protegidos`, sd_D: `Han fallecido por la infección`,
      t_stack: `Estados de la población`, t_inc: `Personas infecciosas a la vez`, x_days: `días`,
      k_agents: `Simulación`, k_seir: `Modelo SEIR (ecuaciones)`, k_ref: `Referencia`, k_cap: `Capacidad asistencial`,
      hit_line: `Umbral de inmunidad de grupo`, no_hit: `Con estas medidas R0 < 1: el brote no despega.`, peak_lbl: `pico {p} % · día {d}`,
      readout: `Día {d}: S {S} · E {E} · I {I} · R {R} · V {V} · D {D}`,
      stack_aria: `Gráfico de áreas apiladas con la evolución de los estados de la población. {s}`,
      inc_aria: `Gráfico con el porcentaje de personas infecciosas a lo largo del tiempo. {s}`,
      sum_now: `Día {d}: {I} infecciosos, {S} susceptibles. Pico: {p} % de la población el día {pd}.`,
      ref_set: `Fijar como referencia`, ref_clear: `Quitar referencia`, ref_ok: `Curva fijada: la verás punteada`,
      btn_csv: `Exportar CSV`, btn_png: `Copiar gráfico`, png_copied: `Gráfico copiado`, png_saved: `Gráfico descargado`, opt_seir: `Superponer el modelo SEIR (ecuaciones)`,
      ctl_h: `Parámetros`, g_disease: `La enfermedad`, g_pop: `Población y vacunación`, g_meas: `Medidas de control`, g_sim: `Simulación`,
      c_R0: `R0 (contagio sin medidas)`, c_R0_h: `Personas que contagia de media un caso en una población sin inmunidad.`,
      c_latent: `Periodo latente`, c_latent_h: `Días entre el contagio y el inicio de la capacidad de contagiar.`,
      c_infect: `Periodo infeccioso`, c_infect_h: `Días durante los que una persona puede contagiar.`,
      c_cfr: `Letalidad`, c_cfr_h: `Porcentaje de infectados que fallecen.`,
      c_N: `Población`, c_N_h: `Personas simuladas (cada punto es una persona).`,
      c_vacc: `Cobertura vacunal`, c_vacc_h: `Porcentaje de la población vacunada al empezar.`,
      c_eff: `Eficacia de la vacuna`, c_eff_h: `Porcentaje de vacunados que quedan protegidos.`,
      c_dist: `Distanciamiento`, c_dist_h: `Reducción de los contactos entre personas (también se mueven menos).`,
      c_quar: `Aislamiento de casos`, c_quar_h: `Casos que se aíslan un día después de empezar a contagiar.`,
      c_mask: `Uso de mascarillas`, c_mask_h: `Personas que las llevan. Efecto ilustrativo: −35 % al contagiar y −20 % al recibir.`,
      c_seeds: `Casos iniciales`, c_seeds_h: `Personas infecciosas al empezar (paciente cero).`,
      c_seed: `Semilla aleatoria`, c_seed_h: `Con la misma semilla y los mismos parámetros se repite el mismo brote.`, dice: `Semilla nueva`,
      need: `Cobertura necesaria ≈ {v} % (marca roja)`, need_no: `Con esta eficacia no basta con vacunar a toda la población: hacen falta además otras medidas.`, need_none: `R0 ≤ 1: no hay brote sostenido.`,
      dirty: `Has cambiado parámetros que solo se aplican al reiniciar la simulación.`, apply: `Reiniciar para aplicar`,
      chal_h: `Retos`, chal_p: `Pulsa «Cargar reto», ajusta los controles y deja que termine la epidemia. El azar influye: si falla por poco, prueba con otra semilla.`,
      chal_load: `Cargar reto`, chal_hint: `Ver pista`, chal_done: `Superado`, chal_active: `Reto activo`, chal_clear: `Salir del reto`, chal_win: `¡Reto superado!`, chal_lose: `Todavía no.`,
      ch_measles_t: `Frena el sarampión`, ch_measles_g: `Sarampión, sin otras medidas. ¿Qué cobertura vacunal hace falta para que se infecte menos del 3 % de la población?`,
      ch_measles_h: `Pista: cobertura necesaria = (1 − 1/R0) / eficacia. Con R0 = 15 y eficacia del 97 %, unos 96 %.`,
      ch_flat_t: `Aplana la curva de 1918`, ch_flat_g: `Gripe de 1918, sin vacuna. Con distanciamiento, aislamiento y mascarillas, consigue que el pico de infecciosos sea menos de la mitad del que habría sin medidas ({v} %).`,
      ch_flat_h: `Pista: lo que cuenta es el R0 con medidas. Cuanto más cerca de 1 (o por debajo), más baja y tardía es la curva.`,
      ch_cap_t: `Que no se colapse el sistema sanitario`, ch_cap_g: `COVID-19 original, sin vacuna. Mantén a menos del {c} % de la población infecciosa a la vez (línea ámbar del gráfico). Sin medidas, el pico supera el {v} %.`,
      ch_cap_h: `Pista: hay que llevar el R0 con medidas por debajo de 1,3 aproximadamente; combina las tres medidas.`,
      ch_eff_t: `Una vacuna imperfecta`, ch_eff_g: `Gripe de 1918 con una vacuna hipotética del 60 % de eficacia. ¿Qué cobertura mínima hace falta para que se infecte menos del 10 % de la población?`,
      ch_eff_h: `Pista: la protección total es cobertura × eficacia. Para cortar la epidemia debe superar 1 − 1/R0 = 50 %, es decir, cobertura ≥ 83 %; con margen para el azar, mejor ≥ 90 %.`,
      res_attack_win: `Se infectó el {p} % de la población (objetivo: menos del {g} %). La inmunidad de grupo corta las cadenas de contagio.`,
      res_attack_lose: `Se infectó el {p} % de la población (objetivo: menos del {g} %). Todavía quedan suficientes susceptibles para que el brote avance.`,
      res_flat_win: `Pico del {p} % frente a un {b} % sin medidas: ¡curva aplanada!`, res_flat_lose: `Pico del {p} % frente a un {b} % sin medidas: aún hay que bajarlo del {g} %.`,
      res_cap_win: `El máximo de infecciosos a la vez fue del {p} % (límite {c} %). ¡Sistema sanitario a salvo!`, res_cap_lose: `El máximo de infecciosos a la vez fue del {p} % (límite {c} %). Reduce más el R0 con medidas.`,
      res_novacc: `Este reto es sin vacuna: pon la cobertura vacunal a 0 %.`, res_nomeas: `Este reto es sin otras medidas: pon distanciamiento, aislamiento y mascarillas a 0 %.`,
      ex_h: `Qué estás viendo`,
      ex1_t: `Los puntos`, ex1_p: `Cada punto es una persona que se mueve al azar y contagia a quienes están a su alrededor. Los casos aislados llevan un anillo discontinuo y no se mueven.`,
      ex2_t: `R0, R efectivo y umbral de inmunidad de grupo`,
      ex2_p: `R0 es el número medio de personas que contagia un caso en una población sin inmunidad ni medidas. El R efectivo («R ahora») tiene en cuenta las medidas y la parte de la población que todavía es susceptible: cuando baja de 1, cada caso contagia a menos de una persona y el brote retrocede. El umbral de inmunidad de grupo es 1 − 1/R0: si la proporción de personas inmunes lo supera, no hay brote sostenido. En el gráfico de áreas, cuando todo lo que queda por debajo del azul (la parte que ya no es susceptible) cruza la línea de puntos, el R efectivo baja de 1 y el brote empieza a remitir; los infecciosos alcanzan su máximo poco después, porque aún hay personas incubando.`,
      ex3_t: `Azar frente a ecuaciones`,
      ex3_p: `La simulación con personas incluye azar: con otra semilla verás brotes distintos, y a veces ninguno si los primeros casos no llegan a contagiar. La línea punteada SEIR es el modelo de ecuaciones, que describe el comportamiento medio. El tamaño final teórico sale de la ecuación z = s0 · (1 − e^(−R·z)), donde s0 es la fracción sin vacuna eficaz.`,
      ex4_t: `Límites del modelo`,
      ex4_p: `Es un modelo simplificado con fines didácticos: población homogénea sin edades ni redes sociales, en un recinto cerrado. Los efectos de las medidas son ilustrativos (mascarilla: −35 % al contagiar y −20 % al recibir; los casos aislados contagian un 95 % menos, un día después de empezar a contagiar; la vacuna protege del todo a una parte de los vacunados). Con aislamiento, los casos que no se aíslan contagian más y la simulación queda por debajo de la curva SEIR. No sirve para predecir epidemias reales.`,
      csv_day: `dia`, csv_new: `nuevos_casos`, csv_cum: `casos_acumulados`
    },
    ca: {
      title: `Simulador d'epidèmies`,
      intro_h: `Com es propaga una epidèmia`,
      intro_p: `Cada punt és una persona. Tria un escenari i observa com es transmet la infecció, quan arriba el pic i què canvien les vacunes, les mascaretes, el distanciament o l'aïllament de casos.`,
      scen_h: `Escenari`, custom: `Personalitzat`, custom_n: `Escenari personalitzat`,
      custom_d: `Ajusta els paràmetres de la malaltia i de les mesures al quadre de controls per crear el teu propi brot.`,
      f_r0: `R0 utilitzat`, f_range: `Rang publicat`, f_latent: `Període latent`, f_infect: `Període infecciós`, f_cfr: `Letalitat`, f_eff: `Eficàcia de la vacuna`, f_need: `Cobertura necessària`, f_src: `Fonts`,
      f_note: `Els valors són aproximacions: la bibliografia dona rangs amplis segons la població i el mètode.`,
      measles_n: `Xarampió`, measles_d: `És el virus més contagiós dels habituals: un cas pot infectar 12–18 persones sense immunitat. Per això cal que prop del 95 % de la població estigui protegida per tallar les cadenes de contagi.`,
      pertussis_n: `Tos ferina`, pertussis_d: `Molt contagiosa i amb un període infecciós llarg. La protecció de la vacuna disminueix amb els anys, per això són importants les dosis de reforç.`,
      varicella_n: `Varicel·la`, varicella_d: `Molt contagiosa, amb una incubació llarga. La vacuna de dues dosis protegeix bé i redueix molt els brots a les escoles.`,
      flu_n: `Grip estacional`, flu_d: `Cada cas en contagia poques, però hi ha molta població susceptible cada hivern. La vacuna protegeix només en part i s'actualitza cada any.`,
      flu1918_n: `Grip de 1918`, flu1918_d: `Pandèmia de grip A(H1N1) de 1918–1919, sense vacunes ni antibiòtics. Aquí pots comprovar quant ajudarien l'aïllament, el distanciament i les mascaretes (i una vacuna hipotètica).`,
      covid_n: `COVID-19 (soca original)`, covid_d: `Primera onada de la pandèmia, sense immunitat prèvia ni vacunes. Com que part del contagi passa abans dels símptomes, aïllar casos funciona menys del que sembla.`,
      s_day: `Dia`, s_r0eff: `R0 amb mesures`, s_re: `R ara`, s_hit: `Llindar d'immunitat de grup`, s_inf: `Infectats`, s_inf_th: `Infectats · teoria {v} %`, s_peak: `Pic d'infecciosos`, s_peak_day: `Pic · dia {d}`,
      world_h: `Població`, btn_play: `Inicia`, btn_resume: `Reprèn`, btn_pause: `Pausa`, btn_step: `+1 dia`, btn_week: `+7 dies`, btn_reset: `Reinicia`,
      speed_l: `Velocitat`, opt_radius: `Mostra el radi de contacte`, click_hint: `Fes clic a la població per introduir-hi un cas nou.`,
      world_msg_done: `L'epidèmia ha acabat el dia {d}: s'ha infectat el {p} % de la població.`,
      world_msg_rm: `Animacions reduïdes: avança amb «+1 dia» o «+7 dies».`,
      world_aria: `Mapa de la població simulada: dia {d}, {S} susceptibles, {E} exposats, {I} infecciosos, {R} recuperats, {V} vacunats protegits i {D} morts.`,
      st_S: `Susceptibles`, st_E: `Exposats`, st_I: `Infecciosos`, st_R: `Recuperats`, st_V: `Vacunats`, st_D: `Morts`,
      sd_S: `Encara no s'han infectat i no estan protegits`, sd_E: `Infectats que encara no contagien (període latent)`, sd_I: `Poden contagiar qui és a prop`,
      sd_R: `S'han recuperat i són immunes`, sd_V: `Vacunats i protegits`, sd_D: `Han mort per la infecció`,
      t_stack: `Estats de la població`, t_inc: `Persones infeccioses alhora`, x_days: `dies`,
      k_agents: `Simulació`, k_seir: `Model SEIR (equacions)`, k_ref: `Referència`, k_cap: `Capacitat assistencial`,
      hit_line: `Llindar d'immunitat de grup`, no_hit: `Amb aquestes mesures R0 < 1: el brot no arrenca.`, peak_lbl: `pic {p} % · dia {d}`,
      readout: `Dia {d}: S {S} · E {E} · I {I} · R {R} · V {V} · D {D}`,
      stack_aria: `Gràfic d'àrees apilades amb l'evolució dels estats de la població. {s}`,
      inc_aria: `Gràfic amb el percentatge de persones infeccioses al llarg del temps. {s}`,
      sum_now: `Dia {d}: {I} infecciosos, {S} susceptibles. Pic: {p} % de la població el dia {pd}.`,
      ref_set: `Fixa com a referència`, ref_clear: `Treu la referència`, ref_ok: `Corba fixada: la veuràs puntejada`,
      btn_csv: `Exporta CSV`, btn_png: `Copia el gràfic`, png_copied: `Gràfic copiat`, png_saved: `Gràfic descarregat`, opt_seir: `Superposa el model SEIR (equacions)`,
      ctl_h: `Paràmetres`, g_disease: `La malaltia`, g_pop: `Població i vacunació`, g_meas: `Mesures de control`, g_sim: `Simulació`,
      c_R0: `R0 (contagi sense mesures)`, c_R0_h: `Persones que contagia de mitjana un cas en una població sense immunitat.`,
      c_latent: `Període latent`, c_latent_h: `Dies entre el contagi i l'inici de la capacitat de contagiar.`,
      c_infect: `Període infecciós`, c_infect_h: `Dies durant els quals una persona pot contagiar.`,
      c_cfr: `Letalitat`, c_cfr_h: `Percentatge d'infectats que moren.`,
      c_N: `Població`, c_N_h: `Persones simulades (cada punt és una persona).`,
      c_vacc: `Cobertura vacunal`, c_vacc_h: `Percentatge de la població vacunada a l'inici.`,
      c_eff: `Eficàcia de la vacuna`, c_eff_h: `Percentatge de vacunats que queden protegits.`,
      c_dist: `Distanciament`, c_dist_h: `Reducció dels contactes entre persones (també es mouen menys).`,
      c_quar: `Aïllament de casos`, c_quar_h: `Casos que s'aïllen un dia després de començar a contagiar.`,
      c_mask: `Ús de mascaretes`, c_mask_h: `Persones que en porten. Efecte il·lustratiu: −35 % en contagiar i −20 % en rebre.`,
      c_seeds: `Casos inicials`, c_seeds_h: `Persones infeccioses a l'inici (pacient zero).`,
      c_seed: `Llavor aleatòria`, c_seed_h: `Amb la mateixa llavor i els mateixos paràmetres es repeteix el mateix brot.`, dice: `Llavor nova`,
      need: `Cobertura necessària ≈ {v} % (marca vermella)`, need_no: `Amb aquesta eficàcia no n'hi ha prou vacunant tota la població: calen també altres mesures.`, need_none: `R0 ≤ 1: no hi ha brot sostingut.`,
      dirty: `Has canviat paràmetres que només s'apliquen en reiniciar la simulació.`, apply: `Reinicia per aplicar`,
      chal_h: `Reptes`, chal_p: `Prem «Carrega el repte», ajusta els controls i deixa que acabi l'epidèmia. L'atzar hi influeix: si falla per poc, prova amb una altra llavor.`,
      chal_load: `Carrega el repte`, chal_hint: `Mostra la pista`, chal_done: `Superat`, chal_active: `Repte actiu`, chal_clear: `Surt del repte`, chal_win: `Repte superat!`, chal_lose: `Encara no.`,
      ch_measles_t: `Atura el xarampió`, ch_measles_g: `Xarampió, sense altres mesures. Quina cobertura vacunal cal perquè s'infecti menys del 3 % de la població?`,
      ch_measles_h: `Pista: cobertura necessària = (1 − 1/R0) / eficàcia. Amb R0 = 15 i eficàcia del 97 %, uns 96 %.`,
      ch_flat_t: `Aplana la corba de 1918`, ch_flat_g: `Grip de 1918, sense vacuna. Amb distanciament, aïllament i mascaretes, aconsegueix que el pic d'infecciosos sigui menys de la meitat del que hi hauria sense mesures ({v} %).`,
      ch_flat_h: `Pista: el que compta és l'R0 amb mesures. Com més a prop d'1 (o per sota), més baixa i tardana és la corba.`,
      ch_cap_t: `Que no es col·lapsi el sistema sanitari`, ch_cap_g: `COVID-19 original, sense vacuna. Mantén menys del {c} % de la població infecciosa alhora (línia ambre del gràfic). Sense mesures, el pic supera el {v} %.`,
      ch_cap_h: `Pista: cal portar l'R0 amb mesures per sota d'1,3 aproximadament; combina les tres mesures.`,
      ch_eff_t: `Una vacuna imperfecta`, ch_eff_g: `Grip de 1918 amb una vacuna hipotètica del 60 % d'eficàcia. Quina cobertura mínima cal perquè s'infecti menys del 10 % de la població?`,
      ch_eff_h: `Pista: la protecció total és cobertura × eficàcia. Per tallar l'epidèmia ha de superar 1 − 1/R0 = 50 %, és a dir, cobertura ≥ 83 %; amb marge per a l'atzar, millor ≥ 90 %.`,
      res_attack_win: `S'ha infectat el {p} % de la població (objectiu: menys del {g} %). La immunitat de grup talla les cadenes de contagi.`,
      res_attack_lose: `S'ha infectat el {p} % de la població (objectiu: menys del {g} %). Encara hi ha prou susceptibles perquè el brot avanci.`,
      res_flat_win: `Pic del {p} % davant d'un {b} % sense mesures: corba aplanada!`, res_flat_lose: `Pic del {p} % davant d'un {b} % sense mesures: encara cal baixar-lo del {g} %.`,
      res_cap_win: `El màxim d'infecciosos alhora va ser del {p} % (límit {c} %). Sistema sanitari a recer!`, res_cap_lose: `El màxim d'infecciosos alhora va ser del {p} % (límit {c} %). Redueix més l'R0 amb mesures.`,
      res_novacc: `Aquest repte és sense vacuna: posa la cobertura vacunal a 0 %.`, res_nomeas: `Aquest repte és sense altres mesures: posa distanciament, aïllament i mascaretes a 0 %.`,
      ex_h: `Què estàs veient`,
      ex1_t: `Els punts`, ex1_p: `Cada punt és una persona que es mou a l'atzar i contagia qui té al voltant. Els casos aïllats porten un anell discontinu i no es mouen.`,
      ex2_t: `R0, R efectiva i llindar d'immunitat de grup`,
      ex2_p: `R0 és el nombre mitjà de persones que contagia un cas en una població sense immunitat ni mesures. La R efectiva («R ara») té en compte les mesures i la part de la població que encara és susceptible: quan baixa d'1, cada cas contagia menys d'una persona i el brot retrocedeix. El llindar d'immunitat de grup és 1 − 1/R0: si la proporció de persones immunes el supera, no hi ha brot sostingut. Al gràfic d'àrees, quan tot el que queda per sota del blau (la part que ja no és susceptible) creua la línia de punts, la R efectiva baixa d'1 i el brot comença a remetre; els infecciosos arriben al màxim poc després, perquè encara hi ha persones incubant.`,
      ex3_t: `Atzar davant d'equacions`,
      ex3_p: `La simulació amb persones inclou atzar: amb una altra llavor veuràs brots diferents, i de vegades cap si els primers casos no arriben a contagiar. La línia puntejada SEIR és el model d'equacions, que descriu el comportament mitjà. La mida final teòrica surt de l'equació z = s0 · (1 − e^(−R·z)), on s0 és la fracció sense vacuna eficaç.`,
      ex4_t: `Límits del model`,
      ex4_p: `És un model simplificat amb finalitats didàctiques: població homogènia sense edats ni xarxes socials, en un recinte tancat. Els efectes de les mesures són il·lustratius (mascareta: −35 % en contagiar i −20 % en rebre; els casos aïllats contagien un 95 % menys, un dia després de començar a contagiar; la vacuna protegeix del tot una part dels vacunats). Amb aïllament, els casos que no s'aïllen contagien més i la simulació queda per sota de la corba SEIR. No serveix per predir epidèmies reals.`,
      csv_day: `dia`, csv_new: `nous_casos`, csv_cum: `casos_acumulats`
    },
    en: {
      title: `Epidemic simulator`,
      intro_h: `How an epidemic spreads`,
      intro_p: `Each dot is a person. Pick a scenario and watch how the infection is transmitted, when the peak arrives and what changes with vaccines, masks, distancing or case isolation.`,
      scen_h: `Scenario`, custom: `Custom`, custom_n: `Custom scenario`,
      custom_d: `Adjust the disease and control-measure parameters in the controls panel to build your own outbreak.`,
      f_r0: `R0 used`, f_range: `Published range`, f_latent: `Latent period`, f_infect: `Infectious period`, f_cfr: `Fatality`, f_eff: `Vaccine efficacy`, f_need: `Coverage needed`, f_src: `Sources`,
      f_note: `Values are approximations: the literature gives wide ranges depending on the population and the method.`,
      measles_n: `Measles`, measles_d: `The most contagious of the usual viruses: one case can infect 12–18 people without immunity. That is why about 95% of the population needs protection to break the chains of transmission.`,
      pertussis_n: `Whooping cough`, pertussis_d: `Highly contagious, with a long infectious period. Vaccine protection fades over the years, which is why booster doses matter.`,
      varicella_n: `Chickenpox`, varicella_d: `Highly contagious, with a long incubation. The two-dose vaccine protects well and sharply reduces school outbreaks.`,
      flu_n: `Seasonal flu`, flu_d: `Each case infects only a few people, but there are plenty of susceptible people every winter. The vaccine protects only partly and is updated every year.`,
      flu1918_n: `1918 flu`, flu1918_d: `The 1918–1919 A(H1N1) influenza pandemic, with no vaccines or antibiotics. Here you can test how much isolation, distancing and masks would help (and a hypothetical vaccine).`,
      covid_n: `COVID-19 (original strain)`, covid_d: `The pandemic's first wave, with no prior immunity or vaccines. Since part of the transmission happens before symptoms, isolating cases works less well than it seems.`,
      s_day: `Day`, s_r0eff: `R0 with measures`, s_re: `R now`, s_hit: `Herd-immunity threshold`, s_inf: `Infected`, s_inf_th: `Infected · theory {v}%`, s_peak: `Infectious peak`, s_peak_day: `Peak · day {d}`,
      world_h: `Population`, btn_play: `Start`, btn_resume: `Resume`, btn_pause: `Pause`, btn_step: `+1 day`, btn_week: `+7 days`, btn_reset: `Reset`,
      speed_l: `Speed`, opt_radius: `Show contact radius`, click_hint: `Click the population to introduce a new case.`,
      world_msg_done: `The epidemic ended on day {d}: {p}% of the population was infected.`,
      world_msg_rm: `Reduced motion: advance with “+1 day” or “+7 days”.`,
      world_aria: `Map of the simulated population: day {d}, {S} susceptible, {E} exposed, {I} infectious, {R} recovered, {V} protected by vaccine and {D} dead.`,
      st_S: `Susceptible`, st_E: `Exposed`, st_I: `Infectious`, st_R: `Recovered`, st_V: `Vaccinated`, st_D: `Dead`,
      sd_S: `Not yet infected and not protected`, sd_E: `Infected but not yet contagious (latent period)`, sd_I: `Can infect people nearby`,
      sd_R: `Recovered and immune`, sd_V: `Vaccinated and protected`, sd_D: `Died from the infection`,
      t_stack: `Population states`, t_inc: `People infectious at the same time`, x_days: `days`,
      k_agents: `Simulation`, k_seir: `SEIR model (equations)`, k_ref: `Reference`, k_cap: `Healthcare capacity`,
      hit_line: `Herd-immunity threshold`, no_hit: `With these measures R0 < 1: the outbreak does not take off.`, peak_lbl: `peak {p}% · day {d}`,
      readout: `Day {d}: S {S} · E {E} · I {I} · R {R} · V {V} · D {D}`,
      stack_aria: `Stacked-area chart showing how the population states evolve. {s}`,
      inc_aria: `Chart of the percentage of infectious people over time. {s}`,
      sum_now: `Day {d}: {I} infectious, {S} susceptible. Peak: {p}% of the population on day {pd}.`,
      ref_set: `Set as reference`, ref_clear: `Clear reference`, ref_ok: `Curve saved: you will see it dotted`,
      btn_csv: `Export CSV`, btn_png: `Copy chart`, png_copied: `Chart copied`, png_saved: `Chart downloaded`, opt_seir: `Overlay the SEIR model (equations)`,
      ctl_h: `Parameters`, g_disease: `The disease`, g_pop: `Population and vaccination`, g_meas: `Control measures`, g_sim: `Simulation`,
      c_R0: `R0 (spread without measures)`, c_R0_h: `Average number of people one case infects in a population without immunity.`,
      c_latent: `Latent period`, c_latent_h: `Days between infection and becoming contagious.`,
      c_infect: `Infectious period`, c_infect_h: `Days during which a person can infect others.`,
      c_cfr: `Fatality`, c_cfr_h: `Percentage of infected people who die.`,
      c_N: `Population`, c_N_h: `Simulated people (each dot is a person).`,
      c_vacc: `Vaccination coverage`, c_vacc_h: `Percentage of the population vaccinated at the start.`,
      c_eff: `Vaccine efficacy`, c_eff_h: `Percentage of vaccinated people who end up protected.`,
      c_dist: `Distancing`, c_dist_h: `Reduction in contacts between people (they also move less).`,
      c_quar: `Case isolation`, c_quar_h: `Cases that are isolated one day after becoming contagious.`,
      c_mask: `Mask wearing`, c_mask_h: `People who wear them. Illustrative effect: −35% when infecting and −20% when receiving.`,
      c_seeds: `Initial cases`, c_seeds_h: `Infectious people at the start (patient zero).`,
      c_seed: `Random seed`, c_seed_h: `The same seed and parameters reproduce the same outbreak.`, dice: `New seed`,
      need: `Coverage needed ≈ {v}% (red mark)`, need_no: `With this efficacy, vaccinating the whole population is not enough: other measures are also needed.`, need_none: `R0 ≤ 1: no sustained outbreak.`,
      dirty: `You changed parameters that only apply when the simulation restarts.`, apply: `Restart to apply`,
      chal_h: `Challenges`, chal_p: `Press “Load challenge”, adjust the controls and let the epidemic finish. Chance plays a part: if you miss by a little, try another seed.`,
      chal_load: `Load challenge`, chal_hint: `Show hint`, chal_done: `Completed`, chal_active: `Active challenge`, chal_clear: `Leave challenge`, chal_win: `Challenge completed!`, chal_lose: `Not yet.`,
      ch_measles_t: `Stop measles`, ch_measles_g: `Measles, with no other measures. What vaccination coverage is needed for fewer than 3% of the population to be infected?`,
      ch_measles_h: `Hint: coverage needed = (1 − 1/R0) / efficacy. With R0 = 15 and 97% efficacy, about 96%.`,
      ch_flat_t: `Flatten the 1918 curve`, ch_flat_g: `1918 flu, no vaccine. Using distancing, isolation and masks, make the infectious peak less than half of what it would be without measures ({v}%).`,
      ch_flat_h: `Hint: what counts is R0 with measures. The closer to 1 (or below), the lower and later the curve.`,
      ch_cap_t: `Keep the health system from collapsing`, ch_cap_g: `Original COVID-19, no vaccine. Keep fewer than {c}% of the population infectious at the same time (amber line on the chart). Without measures, the peak exceeds {v}%.`,
      ch_cap_h: `Hint: you need to bring R0 with measures below roughly 1.3; combine all three measures.`,
      ch_eff_t: `An imperfect vaccine`, ch_eff_g: `1918 flu with a hypothetical vaccine that is 60% effective. What is the minimum coverage needed for fewer than 10% of the population to be infected?`,
      ch_eff_h: `Hint: total protection is coverage × efficacy. To stop the epidemic it must exceed 1 − 1/R0 = 50%, i.e. coverage ≥ 83%; with a margin for chance, better ≥ 90%.`,
      res_attack_win: `{p}% of the population was infected (goal: under {g}%). Herd immunity breaks the chains of transmission.`,
      res_attack_lose: `{p}% of the population was infected (goal: under {g}%). There are still enough susceptible people for the outbreak to advance.`,
      res_flat_win: `Peak of {p}% versus {b}% without measures: curve flattened!`, res_flat_lose: `Peak of {p}% versus {b}% without measures: it still needs to come below {g}%.`,
      res_cap_win: `The maximum number of infectious people at once was {p}% (limit {c}%). Health system saved!`, res_cap_lose: `The maximum number of infectious people at once was {p}% (limit {c}%). Lower R0 further with measures.`,
      res_novacc: `This challenge is without a vaccine: set vaccination coverage to 0%.`, res_nomeas: `This challenge is without other measures: set distancing, isolation and masks to 0%.`,
      ex_h: `What you are looking at`,
      ex1_t: `The dots`, ex1_p: `Each dot is a person who moves at random and infects those around them. Isolated cases have a dashed ring and do not move.`,
      ex2_t: `R0, effective R and herd-immunity threshold`,
      ex2_p: `R0 is the average number of people one case infects in a population with no immunity and no measures. Effective R (“R now”) takes the measures and the share of the population still susceptible into account: when it falls below 1, each case infects fewer than one person and the outbreak recedes. The herd-immunity threshold is 1 − 1/R0: if the share of immune people exceeds it, there is no sustained outbreak. In the area chart, when everything below the blue (the part that is no longer susceptible) crosses the dotted line, effective R falls below 1 and the outbreak starts to recede; the infectious peak comes shortly after, because people are still incubating.`,
      ex3_t: `Chance versus equations`,
      ex3_p: `The people-based simulation includes chance: with another seed you will see different outbreaks, and sometimes none if the first cases fail to infect anyone. The dotted SEIR line is the equation model, which describes the average behaviour. The theoretical final size comes from the equation z = s0 · (1 − e^(−R·z)), where s0 is the fraction without effective vaccine protection.`,
      ex4_t: `Limits of the model`,
      ex4_p: `This is a simplified model for teaching: a homogeneous population with no ages or social networks, in a closed area. The effects of measures are illustrative (mask: −35% when infecting and −20% when receiving; isolated cases infect 95% less, one day after becoming contagious; the vaccine fully protects a share of those vaccinated). With isolation, the cases that are not isolated infect more and the simulation falls below the SEIR curve. It cannot be used to predict real epidemics.`,
      csv_day: `day`, csv_new: `new_cases`, csv_cum: `cumulative_cases`
    }
  };
  const t = K.i18n(I18N);
  K.mount({ titleKey: 'title' });

  /* ================= datos ================= */
  const COL = { S: '#7fb2ea', E: '#f5b82e', I: '#ff5d73', R: '#4ade80', V: '#b08be0', D: '#7d8ca2' };
  const STATES = ['S', 'E', 'I', 'R', 'V', 'D'];
  const SPEEDS = [0.5, 1, 2, 4, 8];
  const DPS = 8;                                   // días simulados por segundo a velocidad ×1

  /* Escenarios: parámetros y fuentes (valores aproximados; ver nota en la ficha) */
  const SCEN = {
    measles:   { R0: 15,  range: [12, 18],   latent: 8,   infect: 8,  cfr: 0.2,  eff: 97, src: 'Guerra FM et al., Lancet Infect Dis 2017;17:e420–e428 · CDC, Pink Book (sarampión)' },
    pertussis: { R0: 12,  range: [5, 17],    latent: 7,   infect: 21, cfr: 0.1,  eff: 85, src: 'Kretzschmar M et al., PLoS Med 2010;7:e1000291 · Anderson & May, Infectious Diseases of Humans, 1991' },
    varicella: { R0: 10,  range: [8, 12],    latent: 12,  infect: 7,  cfr: 0.01, eff: 92, src: 'Anderson & May, 1991 (valores aproximados de revisiones clásicas) · CDC, Pink Book (varicela)' },
    flu:       { R0: 1.3, range: [1.2, 1.4], latent: 1.5, infect: 4,  cfr: 0.05, eff: 50, src: 'Biggerstaff M et al., BMC Infect Dis 2014;14:480 · CDC (efectividad vacunal ≈ 40–60 %)' },
    flu1918:   { R0: 2,   range: [1.4, 2.8], latent: 2,   infect: 4,  cfr: 2.5,  eff: 60, src: 'Mills CE et al., Nature 2004;432:904–906 · Taubenberger & Morens, Emerg Infect Dis 2006;12:15–22' },
    covid:     { R0: 2.9, range: [2, 3.3],   latent: 3,   infect: 8,  cfr: 0.7,  eff: 95, src: 'Liu Y et al., J Travel Med 2020;27:taaa021 · Meyerowitz-Katz & Merone, Int J Infect Dis 2020 · Polack FP et al., N Engl J Med 2020' }
  };
  const SCEN_ORDER = ['measles', 'pertussis', 'varicella', 'flu', 'flu1918', 'covid', 'custom'];
  const CHALS = {
    measles: { scen: 'measles', set: { vacc: 0 } },
    flat:    { scen: 'flu1918', set: { vacc: 0 } },
    cap:     { scen: 'covid', set: { vacc: 0 }, cap: 5 },
    eff:     { scen: 'flu1918', set: { eff: 60, vacc: 0 } }
  };
  const CHAL_ORDER = ['measles', 'flat', 'cap', 'eff'];
  const RESET_KEYS = ['N', 'vacc', 'eff', 'seeds', 'seed'];
  const BASE_KEYS = ['R0', 'latent', 'infect', 'cfr'];

  /* ================= estado ================= */
  const DEFAULT = Object.assign({ N: 600, vacc: 0, dist: 0, quar: 0, mask: 0, seeds: 3, seed: 1 }, { R0: SCEN.measles.R0, latent: SCEN.measles.latent, infect: SCEN.measles.infect, cfr: SCEN.measles.cfr, eff: SCEN.measles.eff });
  let P = Object.assign({}, DEFAULT, store.get('P', {}));
  let scenId = store.get('scen', 'measles');
  if (!SCEN_ORDER.includes(scenId)) scenId = 'custom';
  let speedIdx = K.clamp(store.get('speed', 1), 0, SPEEDS.length - 1);
  let showRadius = !!store.get('radius', false);
  let showSEIR = store.get('seir', true) !== false;
  let done = store.get('done', {});
  let sim = new Sim(P);
  let ode = null, dBase = derive(P);
  let ref = null, cursor = null, challenge = null, chalResult = null, capLine = null, baseInfo = null;
  let playing = false, raf = 0, lastTs = 0, acc = 0, resumeOnVisible = false, dirty = false, lastStamp = '';

  const els = {
    world: $('#world'), stack: $('#cv-stack'), inc: $('#cv-inc'), legend: $('#legend'), stats: $('#stats'),
    play: $('#btn-play'), ref: $('#btn-ref'), msg: $('#world-msg'), readout: $('#readout'), live: $('#live'),
    controls: $('#controls'), dirty: $('#dirty'), apply: $('#btn-apply'), banner: $('#challenge-banner')
  };

  /* ================= utilidades ================= */
  const pct = (x, d = 1) => K.fmt(x * 100, d);
  const fmtR = (r, d = 2) => K.fmt(r, d);
  const saveP = K.debounce(() => store.set('P', P), 300);
  const recomputeODE = K.debounce(() => { ode = seir(P, P.N, 365); drawCharts(); }, 120);
  const niceMax = (v) => { const steps = [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60, 80, 100]; for (const s of steps) if (v <= s) return s; return 100; };
  const niceStep = (span) => { for (const s of [5, 10, 20, 25, 50, 100, 200]) if (span / s <= 8) return s; return 200; };

  /* ================= dibujo del mapa ================= */
  function sizeCanvas(cv, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth;
    if (!w) return null;
    const hh = h || cv.clientHeight || w;
    const bw = Math.round(w * dpr), bh = Math.round(hh * dpr);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h: hh };
  }

  function drawWorld(time) {
    const c = sizeCanvas(els.world, els.world.clientWidth); if (!c) return;
    const { ctx, w: W } = c, s = sim, N = s.N, x = s.x, y = s.y, st = s.st;
    const bg = ctx.createRadialGradient(W * .5, W * .42, W * .04, W * .5, W * .5, W * .78);
    bg.addColorStop(0, '#133354'); bg.addColorStop(.55, '#0a1b30'); bg.addColorStop(1, '#040a14');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W);
    const dr = K.clamp(W * 0.0105 * Math.sqrt(600 / N), 1.6, 7);
    const dot = (list, rad) => { ctx.beginPath(); for (const i of list) { const px = x[i] * W, py = y[i] * W; ctx.moveTo(px + rad, py); ctx.arc(px, py, rad, 0, 6.2832); } };
    const by = [[], [], [], [], [], []];
    for (let i = 0; i < N; i++) by[st[i]].push(i);
    // radio de contacto de los infecciosos
    if (showRadius && by[2].length) {
      ctx.strokeStyle = 'rgba(255,93,115,.32)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const i of by[2]) { const px = x[i] * W, py = y[i] * W; ctx.moveTo(px + s.r * W, py); ctx.arc(px, py, s.r * W, 0, 6.2832); }
      ctx.stroke();
    }
    // fallecidos (cruz)
    if (by[5].length) {
      ctx.strokeStyle = COL.D; ctx.lineWidth = Math.max(1.2, dr * .38); ctx.beginPath();
      for (const i of by[5]) { const px = x[i] * W, py = y[i] * W, q = dr * .85; ctx.moveTo(px - q, py - q); ctx.lineTo(px + q, py + q); ctx.moveTo(px + q, py - q); ctx.lineTo(px - q, py + q); }
      ctx.stroke();
    }
    ctx.fillStyle = COL.S; dot(by[0], dr); ctx.fill();                                         // susceptibles
    ctx.fillStyle = COL.R; dot(by[3], dr * .92); ctx.fill();                                   // recuperados
    ctx.fillStyle = COL.V; dot(by[4], dr); ctx.fill();                                         // vacunados
    ctx.fillStyle = 'rgba(255,255,255,.85)'; dot(by[4], dr * .36); ctx.fill();
    ctx.fillStyle = 'rgba(245,184,46,.28)'; dot(by[1], dr); ctx.fill();                        // expuestos
    ctx.strokeStyle = COL.E; ctx.lineWidth = Math.max(1.4, dr * .42); dot(by[1], dr * .9); ctx.stroke();
    if (by[2].length) {                                                                         // infecciosos
      const pulse = RM ? 0 : Math.sin(time * 5) * .35;
      ctx.fillStyle = 'rgba(255,93,115,.20)'; dot(by[2], dr * (2.3 + pulse)); ctx.fill();
      ctx.fillStyle = COL.I; dot(by[2], dr * 1.18); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; dot(by[2], dr * .34); ctx.fill();
      const iso = by[2].filter(i => s.iso[i]);
      if (iso.length) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.3; ctx.setLineDash([2.5, 2.5]); dot(iso, dr * 2.1); ctx.stroke(); ctx.setLineDash([]); }
    }
    // viñeta de microscopio
    const vg = ctx.createRadialGradient(W / 2, W / 2, W * .42, W / 2, W / 2, W * .74);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, W);
  }

  /* ================= gráficos ================= */
  /* Áreas apiladas. o: { ctx, w, h, hist, N, xmax, cursor, hit, fs } */
  function drawStack(o) {
    const { ctx, w, h, hist, N, xmax } = o, fs = o.fs || 12;
    const m = { l: fs * 3.3, r: 12, t: fs * 1.3, b: fs * 3.2 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
    if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h); } else ctx.clearRect(0, 0, w, h);
    ctx.font = `${fs}px "Source Sans 3",system-ui,sans-serif`; ctx.textBaseline = 'middle';
    const X = (tt) => m.l + tt / xmax * pw, Y = (v) => m.t + ph - v / N * ph;
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.fillStyle = 'rgba(185,198,214,.9)'; ctx.lineWidth = 1; ctx.textAlign = 'right';
    for (const v of [0, 25, 50, 75, 100]) { const yy = Y(v / 100 * N); ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke(); ctx.fillText(v + '%', m.l - 6, yy); }
    ctx.textAlign = 'center'; const step = niceStep(xmax);
    for (let d = 0; d <= xmax; d += step) { ctx.fillText(String(d), X(d), m.t + ph + fs * 1.1); }
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(142,160,181,.95)'; ctx.fillText(t('x_days'), m.l + pw / 2, m.t + ph + fs * 2.3);
    const n = hist.t.length; if (!n) return;
    const order = ['V', 'R', 'D', 'I', 'E', 'S'], cum = new Array(n).fill(0), prev = new Array(n).fill(0);
    for (const k of order) {
      const arr = hist[k]; for (let i = 0; i < n; i++) cum[i] = prev[i] + arr[i];
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const px = X(hist.t[i]), py = Y(cum[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(X(hist.t[i]), Y(prev[i]));
      ctx.closePath(); ctx.fillStyle = COL[k]; ctx.globalAlpha = .92; ctx.fill(); ctx.globalAlpha = 1;
      for (let i = 0; i < n; i++) prev[i] = cum[i];
    }
    // umbral de inmunidad de grupo: con los susceptibles arriba, lo que queda por debajo del azul es la parte no susceptible; al cruzar la línea, Re < 1
    if (o.hit > 0) {
      const yy = Y(o.hit * N); ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke(); ctx.restore();
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(`${t('hit_line')} ${K.fmt(o.hit * 100, 0)}%`, m.l + 8, Math.max(m.t + fs * .7, yy - fs * .8));
    }
    if (o.cursor != null && o.cursor < n) {
      const xx = X(hist.t[o.cursor]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xx, m.t); ctx.lineTo(xx, m.t + ph); ctx.stroke();
    }
  }

  /* Personas infecciosas a la vez (% de la población) */
  function drawInc(o) {
    const { ctx, w, h, hist, N, xmax } = o, fs = o.fs || 12;
    const m = { l: fs * 3.3, r: 12, t: fs * 1.3, b: fs * 3.2 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${fs}px "Source Sans 3",system-ui,sans-serif`; ctx.textBaseline = 'middle';
    const agent = hist.I.map(v => v / N * 100);
    let peakV = Math.max(...agent, 0);
    const series = [];
    if (o.ode && o.showSEIR) series.push({ t: o.ode.t, v: o.ode.I.map(v => v * 100), css: 'rgba(255,255,255,.9)', dash: [7, 5] });
    if (o.ref) series.push({ t: o.ref.t, v: o.ref.I.map(v => v * 100), css: '#5eead4', dash: [3, 4] });
    for (const sr of series) for (let i = 0; i < sr.t.length; i++) if (sr.t[i] <= xmax) peakV = Math.max(peakV, sr.v[i]);
    if (o.cap) peakV = Math.max(peakV, o.cap * 1.25);
    const ymax = niceMax(Math.max(peakV * 1.12, 3));
    const X = (tt) => m.l + tt / xmax * pw, Y = (v) => m.t + ph - v / ymax * ph;
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.fillStyle = 'rgba(185,198,214,.9)'; ctx.lineWidth = 1; ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) { const v = ymax * i / 4, yy = Y(v); ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke(); ctx.fillText(K.fmt(v, v < 10 ? 1 : 0) + '%', m.l - 6, yy); }
    ctx.textAlign = 'center'; const step = niceStep(xmax);
    for (let d = 0; d <= xmax; d += step) ctx.fillText(String(d), X(d), m.t + ph + fs * 1.1);
    ctx.fillStyle = 'rgba(142,160,181,.95)'; ctx.fillText(t('x_days'), m.l + pw / 2, m.t + ph + fs * 2.3);
    const n = hist.t.length;
    if (n) {
      const g = ctx.createLinearGradient(0, m.t, 0, m.t + ph); g.addColorStop(0, 'rgba(255,93,115,.55)'); g.addColorStop(1, 'rgba(255,93,115,.04)');
      ctx.beginPath(); ctx.moveTo(X(hist.t[0]), Y(0));
      for (let i = 0; i < n; i++) ctx.lineTo(X(hist.t[i]), Y(agent[i]));
      ctx.lineTo(X(hist.t[n - 1]), Y(0)); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); for (let i = 0; i < n; i++) { const px = X(hist.t[i]), py = Y(agent[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.strokeStyle = '#ff5d73'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
    }
    for (const sr of series) {
      ctx.beginPath(); let first = true;
      for (let i = 0; i < sr.t.length; i++) { if (sr.t[i] > xmax) break; const px = X(sr.t[i]), py = Y(sr.v[i]); first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false; }
      ctx.save(); ctx.setLineDash(sr.dash); ctx.strokeStyle = sr.css; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
    }
    if (o.cap) {
      const yy = Y(o.cap); ctx.strokeStyle = '#f5b82e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.l, yy); ctx.lineTo(w - m.r, yy); ctx.stroke();
      ctx.textAlign = 'left'; ctx.fillStyle = '#f5b82e'; ctx.fillText(`${t('k_cap')} ${o.cap}%`, m.l + 8, yy - fs * .8);
    }
    if (n && o.peakDay != null && peakV > 0 && hist.t[n - 1] > 3) {
      const pv = Math.max(...agent); if (pv > 0) {
        const pxx = X(o.peakDay), pyy = Y(pv); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pxx, pyy, 3.5, 0, 6.2832); ctx.fill();
        ctx.textAlign = pxx > w * .7 ? 'right' : 'left'; ctx.fillStyle = '#fff'; ctx.fillText(t('peak_lbl', { p: K.fmt(pv, 1), d: K.fmt(o.peakDay, 1) }), pxx + (pxx > w * .7 ? -8 : 8), Math.max(m.t + fs * .7, pyy - fs * .9));
      }
    }
  }

  function xmaxNow() {
    const tmax = Math.max(sim.t, ref ? ref.t[ref.t.length - 1] : 0);
    return Math.max(60, Math.ceil((tmax + 3) / 10) * 10);
  }
  function drawCharts() {
    const xmax = xmaxNow();
    const a = sizeCanvas(els.stack, els.stack.clientHeight);
    if (a) drawStack({ ctx: a.ctx, w: a.w, h: a.h, hist: sim.h, N: sim.N, xmax, cursor, hit: dBase.hitEff });
    const b = sizeCanvas(els.inc, els.inc.clientHeight);
    if (b) drawInc({ ctx: b.ctx, w: b.w, h: b.h, hist: sim.h, N: sim.N, xmax, ode, showSEIR, ref, cap: capLine, peakDay: sim.peakDay });
    updateAria();
  }

  /* ================= estadísticas y textos dinámicos ================= */
  function updateLegend() {
    const stamp = sim.cnt.join(',');
    if (stamp === lastStamp) return; lastStamp = stamp;
    els.legend.querySelectorAll('[data-s]').forEach(e => { e.querySelector('em').textContent = sim.cnt[STATES.indexOf(e.dataset.s)]; });
  }
  function renderLegend() {
    els.legend.innerHTML = STATES.map(s => `<span class="chip" data-s="${s}" title="${K.esc(t('sd_' + s))}"><i style="background:${COL[s]}"></i>${K.esc(t('st_' + s))}<em>0</em></span>`).join('');
    lastStamp = ''; updateLegend();
  }
  function updateStats() {
    const s = sim.summary(), d = dBase, N = sim.N;
    const Re = d.R0eff * (s.S / N);
    const theory = finalSize(d.R0eff, d.s0);
    const hit = d.hitEff;
    const tiles = [
      { b: K.fmt(s.t, 1), l: t('s_day') },
      { b: fmtR(d.R0eff, 2), l: t('s_r0eff'), cls: d.R0eff < 1 ? 'ok' : '' },
      { b: fmtR(Re, 2), l: t('s_re'), cls: Re < 1 ? 'ok' : (s.I > 0 ? 'bad' : ''), hl: true },
      { b: hit > 0 ? pct(hit, 0) + ' %' : '—', l: t('s_hit') },
      { b: pct(s.attack, 1) + ' %', l: t('s_inf_th', { v: pct(theory + (P.seeds / N) * 0, 0) }) },
      { b: pct(s.peak, 1) + ' %', l: t('s_peak_day', { d: K.fmt(s.peakDay, 1) }) }
    ];
    els.stats.innerHTML = tiles.map(x => `<div class="stat ${x.hl ? 'hl' : ''} ${x.cls || ''}"><b>${x.b}</b><span>${K.esc(x.l)}</span></div>`).join('');
  }
  function updateReadout() {
    const h = sim.h, i = cursor != null ? Math.min(cursor, h.t.length - 1) : h.t.length - 1;
    els.readout.textContent = t('readout', { d: K.fmt(h.t[i], 1), S: h.S[i], E: h.E[i], I: h.I[i], R: h.R[i], V: h.V[i], D: h.D[i] });
  }
  function updateAria() {
    const s = sim.summary();
    const summ = t('sum_now', { d: K.fmt(s.t, 1), I: s.I, S: s.S, p: K.fmt(s.peak * 100, 1), pd: K.fmt(s.peakDay, 1) });
    els.stack.setAttribute('aria-label', t('stack_aria', { s: summ }));
    els.inc.setAttribute('aria-label', t('inc_aria', { s: summ }));
    els.world.setAttribute('aria-label', t('world_aria', { d: K.fmt(s.t, 1), S: s.S, E: s.E, I: s.I, R: s.R, V: s.V, D: s.D }));
  }
  function announce() { els.live.textContent = t('sum_now', { d: K.fmt(sim.t, 0), I: sim.cnt[2], S: sim.cnt[0], p: K.fmt(sim.peak / sim.N * 100, 1), pd: K.fmt(sim.peakDay, 1) }); }

  /* ================= bucle ================= */
  function setPlayLabel() {
    els.play.textContent = playing ? t('btn_pause') : (sim.t > 0 && !sim.finished ? t('btn_resume') : t('btn_play'));
    els.play.disabled = false;
  }
  function render(ts) {
    drawWorld((ts || performance.now()) / 1000);
    const len = sim.h.t.length;
    if (len !== render.len) { render.len = len; updateStats(); drawCharts(); updateReadout(); if (Math.round(sim.t) % 10 === 0) announce(); }
    updateLegend();
  }
  function frame(ts) {
    if (!playing) return;
    const real = Math.min(0.1, (ts - lastTs) / 1000); lastTs = ts;
    acc += real * DPS * SPEEDS[speedIdx];
    let ticks = Math.floor(acc / DT);
    if (ticks > 0) { acc -= ticks * DT; if (ticks > 80) { ticks = 80; acc = 0; } sim.step(ticks); }
    render(ts);
    if (sim.finished) { pause(); onFinished(); return; }
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (sim.finished) restart(false);
    playing = true; lastTs = performance.now(); acc = 0; els.msg.hidden = true; setPlayLabel(); K.keepAwake(false);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function pause() { playing = false; cancelAnimationFrame(raf); setPlayLabel(); }
  function stepDays(d) { if (playing) pause(); if (sim.finished) return; sim.advanceDays(d); render(); if (sim.finished) onFinished(); setPlayLabel(); }
  function restart(autoplay) {
    pause(); sim = new Sim(P); cursor = null; chalResult = null; dirty = false; els.dirty.hidden = true; els.apply.hidden = true; els.msg.hidden = true; render.len = -1;
    dBase = derive(P); render(); setPlayLabel(); renderBanner();
    if (autoplay && !RM) play(); else if (RM) { els.msg.textContent = t('world_msg_rm'); els.msg.hidden = false; }
  }
  function onFinished() {
    const s = sim.summary();
    els.msg.textContent = t('world_msg_done', { d: K.fmt(sim.finishedAt ?? s.t, 1), p: pct(s.attack, 1) }); els.msg.hidden = false;
    announce();
    if (challenge) evaluateChallenge();
  }

  /* ================= escenarios ================= */
  function scenName(id) { return id === 'custom' ? t('custom_n') : t(id + '_n'); }
  function renderScenarios() {
    $('#scen-chips').innerHTML = SCEN_ORDER.map(id => {
      const sc = SCEN[id];
      return `<button type="button" data-scen="${id}" aria-pressed="${id === scenId}">${K.esc(id === 'custom' ? t('custom') : t(id + '_n'))}${sc ? `<span class="r0">R0 ${K.fmt(sc.R0, 1)}</span>` : ''}</button>`;
    }).join('');
    const sc = SCEN[scenId], d = dBase;
    if (!sc) { $('#scen-card').innerHTML = `<div><h3>${K.esc(t('custom_n'))}</h3><p>${K.esc(t('custom_d'))}</p></div>${factsHTML(null)}`; return; }
    $('#scen-card').innerHTML = `<div><h3>${K.esc(t(scenId + '_n'))}</h3><p>${K.esc(t(scenId + '_d'))}</p><p class="src"><b>${K.esc(t('f_src'))}:</b> ${K.esc(sc.src)}. ${K.esc(t('f_note'))}</p></div>${factsHTML(sc)}`;
  }
  function factsHTML(sc) {
    const need = Number.isFinite(dBase.cover) ? (dBase.cover <= 1 ? K.fmt(dBase.cover * 100, 0) + ' %' : '> 100 %') : '—';
    const f = (b, l, wide) => `<div class="${wide ? 'wide' : ''}"><b>${b}</b><span>${K.esc(l)}</span></div>`;
    return `<div class="facts">${f(K.fmt(P.R0, 1), t('f_r0'))}${sc ? f(`${K.fmt(sc.range[0], 1)}–${K.fmt(sc.range[1], 1)}`, t('f_range')) : f('—', t('f_range'))}${f(K.fmt(P.latent, 1) + ' d', t('f_latent'))}${f(K.fmt(P.infect, 1) + ' d', t('f_infect'))}${f(K.fmt(P.cfr, 2) + ' %', t('f_cfr'))}${f(K.fmt(P.eff, 0) + ' %', t('f_eff'))}${f(need, t('f_need'), true)}</div>`;
  }
  function loadScenario(id, opts = {}) {
    const sc = SCEN[id];
    scenId = id;
    if (sc) Object.assign(P, { R0: sc.R0, latent: sc.latent, infect: sc.infect, cfr: sc.cfr, eff: sc.eff, vacc: 0, dist: 0, quar: 0, mask: 0, seeds: 3 });
    if (!opts.keepChallenge) { challenge = null; capLine = null; }
    store.set('P', P); store.set('scen', scenId);
    dBase = derive(P); renderScenarios(); renderControls(); renderChallenges(); recomputeODE();
    restart(opts.autoplay !== false);
  }

  /* ================= retos ================= */
  function renderChallenges() {
    $('#challenges').innerHTML = CHAL_ORDER.map(id => {
      const extra = chalParams(id);
      return `<article class="chal ${challenge === id ? 'active' : ''}"><h3>${K.esc(t('ch_' + id + '_t'))}${done[id] ? `<span class="done">✓ ${K.esc(t('chal_done'))}</span>` : ''}</h3>
        <p>${K.esc(t('ch_' + id + '_g', extra))}</p><p class="hint" hidden data-hint="${id}">${K.esc(t('ch_' + id + '_h'))}</p>
        <div class="row"><button class="btn small" type="button" data-load="${id}">${K.esc(t('chal_load'))}</button><button class="btn ghost small" type="button" data-showhint="${id}">${K.esc(t('chal_hint'))}</button></div></article>`;
    }).join('');
  }
  function chalParams(id) {
    const base = seir(Object.assign({}, P, { R0: SCEN[CHALS[id].scen].R0, latent: SCEN[CHALS[id].scen].latent, infect: SCEN[CHALS[id].scen].infect, cfr: SCEN[CHALS[id].scen].cfr, vacc: 0, dist: 0, quar: 0, mask: 0, seeds: 3, N: 600 }), 600, 365);
    return { v: K.fmt(base.peak * 100, 0), c: CHALS[id].cap || 0 };
  }
  function loadChallenge(id) {
    const def = CHALS[id];
    loadScenario(def.scen, { keepChallenge: true, autoplay: false });
    Object.assign(P, def.set); store.set('P', P);
    challenge = id; capLine = def.cap || null; chalResult = null;
    dBase = derive(P); renderControls(); renderChallenges(); recomputeODE(); restart(true);
    $('#app').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }
  function renderBanner() {
    const b = els.banner;
    if (!challenge) { b.hidden = true; return; }
    const extra = chalParams(challenge);
    b.hidden = false;
    if (chalResult) {
      b.className = 'banner challenge-banner ' + (chalResult.win ? 'win' : 'lose');
      b.innerHTML = `<b>${K.esc(t(chalResult.win ? 'chal_win' : 'chal_lose'))}</b> ${K.esc(chalResult.text)}<div class="row"><button class="btn small ghost" type="button" data-exit="1">${K.esc(t('chal_clear'))}</button></div>`;
    } else {
      b.className = 'banner challenge-banner';
      b.innerHTML = `<b>${K.esc(t('chal_active'))}: ${K.esc(t('ch_' + challenge + '_t'))}.</b> ${K.esc(t('ch_' + challenge + '_g', extra))}<div class="row"><button class="btn small ghost" type="button" data-exit="1">${K.esc(t('chal_clear'))}</button></div>`;
    }
  }
  function evaluateChallenge() {
    const s = sim.summary(), extra = chalParams(challenge), anyMeas = P.dist + P.quar + P.mask > 0;
    let win = false, text = '';
    if (challenge === 'measles' || challenge === 'eff') {
      const goal = challenge === 'measles' ? 3 : 10;
      if (anyMeas) text = t('res_nomeas'); else { win = s.attack * 100 < goal; text = t(win ? 'res_attack_win' : 'res_attack_lose', { p: pct(s.attack, 1), g: goal }); }
    } else if (P.vacc > 0) text = t('res_novacc');
    else if (challenge === 'flat') {
      const baseP = seir(Object.assign({}, P, { dist: 0, quar: 0, mask: 0, vacc: 0 }), sim.N, 365).peak;
      win = s.peak < baseP * 0.5; text = t(win ? 'res_flat_win' : 'res_flat_lose', { p: pct(s.peak, 1), b: pct(baseP, 1), g: pct(baseP * .5, 1) });
    } else if (challenge === 'cap') {
      win = s.peak * 100 <= CHALS.cap.cap; text = t(win ? 'res_cap_win' : 'res_cap_lose', { p: pct(s.peak, 1), c: CHALS.cap.cap });
    }
    chalResult = { win, text }; if (win) { done[challenge] = true; store.set('done', done); renderChallenges(); }
    renderBanner();
  }

  /* ================= controles ================= */
  const CTL = [
    { g: 'g_disease', items: [
      { k: 'R0', min: 0.5, max: 20, step: 0.1, f: v => K.fmt(v, 1) },
      { k: 'latent', min: 0, max: 21, step: 0.5, f: v => K.fmt(v, 1) + ' d' },
      { k: 'infect', min: 1, max: 30, step: 0.5, f: v => K.fmt(v, 1) + ' d' },
      { k: 'cfr', min: 0, max: 30, step: 0.05, f: v => K.fmt(v, 2) + ' %' }] },
    { g: 'g_pop', items: [
      { k: 'N', min: 100, max: 2000, step: 50, f: v => K.fmt(v, 0) },
      { k: 'vacc', min: 0, max: 100, step: 1, f: v => K.fmt(v, 0) + ' %', thr: true },
      { k: 'eff', min: 0, max: 100, step: 1, f: v => K.fmt(v, 0) + ' %' }] },
    { g: 'g_meas', items: [
      { k: 'dist', min: 0, max: 90, step: 5, f: v => K.fmt(v, 0) + ' %' },
      { k: 'quar', min: 0, max: 100, step: 5, f: v => K.fmt(v, 0) + ' %' },
      { k: 'mask', min: 0, max: 100, step: 5, f: v => K.fmt(v, 0) + ' %' }] },
    { g: 'g_sim', items: [
      { k: 'seeds', min: 1, max: 20, step: 1, f: v => K.fmt(v, 0) },
      { k: 'seed', seed: true }] }
  ];
  function renderControls() {
    els.controls.innerHTML = CTL.map(grp => `<div class="ctl-group"><h3>${K.esc(t(grp.g))}</h3>${grp.items.map(it => {
      if (it.seed) return `<div class="ctl"><label class="top" for="c-seed"><span>${K.esc(t('c_seed'))}</span></label><div class="seed-row"><input type="number" id="c-seed" data-k="seed" min="1" max="999999" step="1" value="${P.seed}"><button class="icon-btn" type="button" data-dice="1" title="${K.esc(t('dice'))}" aria-label="${K.esc(t('dice'))}">🎲</button></div><small>${K.esc(t('c_seed_h'))}</small></div>`;
      return `<div class="ctl"><label class="top" for="c-${it.k}"><span>${K.esc(t('c_' + it.k))}</span><output id="o-${it.k}">${it.f(P[it.k])}</output></label>
        <div class="track"><input type="range" id="c-${it.k}" data-k="${it.k}" min="${it.min}" max="${it.max}" step="${it.step}" value="${P[it.k]}">${it.thr ? '<i class="thr" id="thr" hidden></i>' : ''}</div>
        <small>${K.esc(t('c_' + it.k + '_h'))}</small>${it.thr ? '<small class="need" id="need"></small>' : ''}</div>`;
    }).join('')}</div>`).join('');
    updateThreshold();
  }
  function updateThreshold() {
    const thr = $('#thr'), need = $('#need'); if (!thr) return;
    const d = derive(P);
    if (P.R0 <= 1) { thr.hidden = true; need.textContent = t('need_none'); return; }
    if (!Number.isFinite(d.cover) || d.cover > 1) { thr.hidden = true; need.textContent = t('need_no'); return; }
    const p = d.cover * 100; thr.hidden = false; thr.style.left = `calc(${p}% + ${(0.5 - p / 100) * 16}px)`;
    need.textContent = t('need', { v: K.fmt(p, 0) });
  }
  function onControl(k, raw) {
    const v = k === 'seed' ? Math.max(1, Math.round(+raw) || 1) : +raw;
    P[k] = v; saveP();
    const out = $('#o-' + k); if (out) { const it = CTL.flatMap(g => g.items).find(i => i.k === k); out.textContent = it.f(v); }
    dBase = derive(P); updateThreshold();
    if (BASE_KEYS.includes(k) && scenId !== 'custom') { scenId = 'custom'; store.set('scen', scenId); }
    renderScenarios(); recomputeODE();
    if (RESET_KEYS.includes(k)) {
      if (sim.t === 0 || sim.finished) applyReset(); else { dirty = true; els.dirty.hidden = false; els.apply.hidden = false; }
    } else {
      sim.setParams(P); if (k === 'mask') sim.reassignMasks(P.mask / 100);
      render.len = -1; if (!playing) render();
    }
  }
  const applyReset = K.debounce(() => restart(true), 280);

  /* ================= exportar ================= */
  function exportCSV() {
    const h = sim.h, nl = '\r\n';
    const head = [`# ${t('title')} · ${scenName(scenId)}`, `# R0=${P.R0}; latent=${P.latent}; infect=${P.infect}; cfr=${P.cfr}%; N=${P.N}; vacc=${P.vacc}%; eff=${P.eff}%; dist=${P.dist}%; quar=${P.quar}%; mask=${P.mask}%; seeds=${P.seeds}; seed=${P.seed}`];
    const rows = [[t('csv_day'), 'S', 'E', 'I', 'R', 'V', 'D', t('csv_new'), t('csv_cum')]];
    for (let i = 0; i < h.t.length; i++) rows.push([h.t[i].toFixed(1).replace('.', ','), h.S[i], h.E[i], h.I[i], h.R[i], h.V[i], h.D[i], h.inc[i], h.cum[i]]);
    K.download(`epidemia-${scenId}-semilla${P.seed}.csv`, '﻿' + head.join(nl) + nl + K.toCSV(rows), 'text/csv;charset=utf-8');
  }
  function exportPNG() {
    const W = 1280, H = 720, c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0d1a2a'); g.addColorStop(1, '#1c3a5c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = '700 40px "Bricolage Grotesque",system-ui,sans-serif'; ctx.fillText(`${t('title')} · ${scenName(scenId)}`, 48, 70);
    ctx.font = '400 20px "Source Sans 3",system-ui,sans-serif'; ctx.fillStyle = '#b9c6d6';
    ctx.fillText(`R0 ${K.fmt(P.R0, 1)} · ${t('c_vacc')} ${K.fmt(P.vacc, 0)} % · ${t('c_eff')} ${K.fmt(P.eff, 0)} % · ${t('c_dist')} ${K.fmt(P.dist, 0)} % · ${t('c_quar')} ${K.fmt(P.quar, 0)} % · ${t('c_mask')} ${K.fmt(P.mask, 0)} %`, 48, 104);
    ctx.save(); ctx.translate(48, 130); drawStack({ ctx, w: 1184, h: 470, hist: sim.h, N: sim.N, xmax: xmaxNow(), cursor: null, hit: dBase.hitEff, fs: 16, bg: '#08131f' }); ctx.restore();
    let lx = 48; ctx.font = '600 18px "Source Sans 3",system-ui,sans-serif';
    for (const s of STATES) { ctx.fillStyle = COL[s]; ctx.beginPath(); ctx.arc(lx + 8, 640, 8, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(t('st_' + s), lx + 24, 646); lx += 40 + ctx.measureText(t('st_' + s)).width + 18; }
    ctx.textAlign = 'right'; ctx.fillStyle = '#8ea0b5'; ctx.fillText('luisfs.com', W - 48, 686);
    c.toBlob(async blob => {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); K.toast(t('png_copied')); }
      catch (_) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'epidemia.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); K.toast(t('png_saved')); }
    }, 'image/png');
  }

  /* ================= textos estáticos y re-render ================= */
  function renderStaticTexts() {
    document.title = `${t('title')} · Luis Franco Serrano`;
    $('#speed').innerHTML = SPEEDS.map((s, i) => `<button type="button" data-speed="${i}" aria-pressed="${i === speedIdx}">×${s}</button>`).join('');
    $('#t-stack').textContent = t('t_stack'); $('#t-inc').textContent = t('t_inc');
    $('#inc-key').innerHTML = `<span class="chip" style="color:#ff5d73"><i></i>${K.esc(t('k_agents'))}</span><span class="chip dash" style="color:#fff"><i></i>${K.esc(t('k_seir'))}</span>${ref ? `<span class="chip dash" style="color:#5eead4"><i></i>${K.esc(t('k_ref'))}</span>` : ''}`;
    els.ref.textContent = ref ? t('ref_clear') : t('ref_set');
    $('#opt-radius').checked = showRadius; $('#opt-seir').checked = showSEIR;
    $('#explain').innerHTML = `<h2>${K.esc(t('ex_h'))}</h2>
      <details open><summary>${K.esc(t('ex1_t'))}</summary><ul>${STATES.map(s => `<li><span class="sw" style="background:${COL[s]}"></span><b>${K.esc(t('st_' + s))}</b>: ${K.esc(t('sd_' + s))}</li>`).join('')}</ul><p>${K.esc(t('ex1_p'))}</p></details>
      <details><summary>${K.esc(t('ex2_t'))}</summary><p>${K.esc(t('ex2_p'))}</p></details>
      <details><summary>${K.esc(t('ex3_t'))}</summary><p>${K.esc(t('ex3_p'))}</p></details>
      <details><summary>${K.esc(t('ex4_t'))}</summary><p>${K.esc(t('ex4_p'))}</p></details>`;
    renderLegend(); renderScenarios(); renderControls(); renderChallenges(); renderBanner(); setPlayLabel();
    K.applyDom(); render.len = -1; render();
    if (sim.finished) { els.msg.textContent = t('world_msg_done', { d: K.fmt(sim.finishedAt ?? sim.t, 1), p: pct(sim.summary().attack, 1) }); els.msg.hidden = false; }
  }

  /* ================= eventos ================= */
  els.play.addEventListener('click', () => (playing ? pause() : play()));
  $('#btn-step').addEventListener('click', () => stepDays(1));
  $('#btn-week').addEventListener('click', () => stepDays(7));
  $('#btn-reset').addEventListener('click', () => restart(false));
  els.apply.addEventListener('click', () => restart(true));
  $('#speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (!b) return; speedIdx = +b.dataset.speed; store.set('speed', speedIdx); $('#speed').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.speed === speedIdx))); });
  $('#opt-radius').addEventListener('change', e => { showRadius = e.target.checked; store.set('radius', showRadius); render(); });
  $('#opt-seir').addEventListener('change', e => { showSEIR = e.target.checked; store.set('seir', showSEIR); drawCharts(); });
  els.ref.addEventListener('click', () => {
    if (ref) { ref = null; } else { ref = { t: sim.h.t.slice(), I: sim.h.I.map(v => v / sim.N) }; K.toast(t('ref_ok')); }
    renderStaticTexts();
  });
  $('#btn-csv').addEventListener('click', exportCSV);
  $('#btn-png').addEventListener('click', exportPNG);
  $('#scen-chips').addEventListener('click', e => { const b = e.target.closest('[data-scen]'); if (!b) return; if (b.dataset.scen === 'custom') { scenId = 'custom'; store.set('scen', 'custom'); renderScenarios(); } else loadScenario(b.dataset.scen); });
  $('#challenges').addEventListener('click', e => {
    const l = e.target.closest('[data-load]'); if (l) { loadChallenge(l.dataset.load); return; }
    const h = e.target.closest('[data-showhint]'); if (h) { const p = $(`[data-hint="${h.dataset.showhint}"]`); p.hidden = !p.hidden; }
  });
  els.banner.addEventListener('click', e => { if (e.target.closest('[data-exit]')) { challenge = null; capLine = null; chalResult = null; renderBanner(); renderChallenges(); drawCharts(); } });
  els.controls.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.k; if (k && e.target.type === 'range') onControl(k, e.target.value); });
  els.controls.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.k; if (k === 'seed') onControl('seed', e.target.value); });
  els.controls.addEventListener('click', e => { if (e.target.closest('[data-dice]')) { const s = 1 + Math.floor(Math.random() * 99999); $('#c-seed').value = s; onControl('seed', s); } });
  els.world.addEventListener('pointerdown', e => {
    const r = els.world.getBoundingClientRect(); const i = sim.introduce((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    if (i >= 0) { render.len = -1; els.msg.hidden = true; render(); if (!playing) setPlayLabel(); }
  });
  els.world.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sim.introduce(Math.random(), Math.random()); render.len = -1; render(); } });
  /* cursor en el gráfico de áreas */
  const setCursorFromX = (clientX) => {
    const r = els.stack.getBoundingClientRect(), fs = 12, ml = fs * 3.3, pw = r.width - ml - 12;
    const tt = (clientX - r.left - ml) / pw * xmaxNow(); cursor = K.clamp(Math.round(tt / (DT * 5)), 0, sim.h.t.length - 1); drawCharts(); updateReadout();
  };
  els.stack.addEventListener('pointermove', e => setCursorFromX(e.clientX));
  els.stack.addEventListener('pointerleave', () => { cursor = null; drawCharts(); updateReadout(); });
  els.stack.addEventListener('keydown', e => {
    const n = sim.h.t.length, cur = cursor == null ? n - 1 : cursor; let c = cur;
    if (e.key === 'ArrowLeft') c = cur - (e.shiftKey ? 10 : 1); else if (e.key === 'ArrowRight') c = cur + (e.shiftKey ? 10 : 1); else if (e.key === 'Home') c = 0; else if (e.key === 'End') c = n - 1; else if (e.key === 'Escape') { cursor = null; drawCharts(); updateReadout(); return; } else return;
    e.preventDefault(); cursor = K.clamp(c, 0, n - 1); drawCharts(); updateReadout();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) { pause(); resumeOnVisible = true; } else if (!document.hidden && resumeOnVisible) { resumeOnVisible = false; play(); }
  });
  window.addEventListener('beforeunload', () => store.set('P', P));
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(K.debounce(() => { render.len = -1; render(); }, 60)); [els.world, els.stack, els.inc].forEach(c => ro.observe(c)); }
  else window.addEventListener('resize', K.debounce(() => { render.len = -1; render(); }, 100));
  K.onLang(renderStaticTexts);

  /* ================= arranque ================= */
  dBase = derive(P); ode = seir(P, P.N, 365);
  renderStaticTexts();
  restart(true);
  window.__epi = { renderNow() { render.len = -1; render(); }, get sim() { return sim; }, get P() { return P; }, play, pause, stepDays, restart, loadScenario, loadChallenge, onControl, get state() { return { playing, scenId, challenge, chalResult }; } };   // para pruebas
})();
