/* Ilustraciones SVG propias de la guía de SVB y DEA.
   Estilo común: la víctima en lila claro, quien reanima en azul, acentos en lila/ámbar/verde.
   RCP_ILL.get('nombre') devuelve el SVG como texto. */
window.RCP_ILL = (function () {
  const V = '#e2d4f7', V2 = '#c9b6ea', R = '#7fb2ea', R2 = '#5a93d1', A = '#b08be0', Y = '#f5b82e', G = '#4ade80', RD = '#f87171',
    INK = '#0d1a2a', DEV = '#1b3050', L = 'rgba(255,255,255,.2)';
  let uid = 0;

  const wrap = (inner) => {
    const id = 'rg' + (++uid);
    return `<svg class="ill" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16304f"/><stop offset="1" stop-color="#2a2a63"/></linearGradient></defs>
<rect width="320" height="200" rx="16" fill="url(#${id})"/><circle cx="276" cy="26" r="92" fill="${A}" opacity=".10"/>${inner}</svg>`;
  };
  const ground = `<path d="M14 172H306" stroke="${L}" stroke-width="2" stroke-linecap="round"/>`;
  const arrow = (x1, y1, x2, y2, col = A, w = 3.5) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 10, p = (ang) => [(x2 - h * Math.cos(a + ang)).toFixed(1), (y2 - h * Math.sin(a + ang)).toFixed(1)];
    const [ax, ay] = p(0.5), [bx, by] = p(-0.5);
    return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x2} ${y2}L${ax} ${ay}L${bx} ${by}Z" fill="${col}"/>`;
  };
  /* víctima tumbada boca arriba, vista lateral, con la cabeza a la izquierda en x */
  const lying = (x, col = V) => `<circle cx="${x}" cy="152" r="15" fill="${col}"/><rect x="${x + 12}" y="138" width="78" height="28" rx="14" fill="${col}"/><rect x="${x + 82}" y="142" width="78" height="22" rx="11" fill="${V2}"/>`;
  const txt = (x, y, s, size = 18, col = '#fff', anchor = 'middle', font = 'Bricolage Grotesque,system-ui,sans-serif') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-weight="700" font-size="${size}" fill="${col}">${s}</text>`;
  const torso = (cx = 160, top = 52, bottom = 190, w = 90) => `<path d="M${cx - w} ${top} Q${cx} ${top - 28} ${cx + w} ${top} L${cx + w - 14} ${bottom} H${cx - w + 14} Z" fill="${V}"/>`;
  const device = (x, y, w, h, small = false) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${small ? 12 : 20}" fill="${DEV}" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
<rect x="${x + w * .12}" y="${y + h * .13}" width="${w * .76}" height="${h * .3}" rx="7" fill="#0a1a2c"/>
<polyline points="${x + w * .16},${y + h * .29} ${x + w * .38},${y + h * .29} ${x + w * .45},${y + h * .19} ${x + w * .54},${y + h * .38} ${x + w * .62},${y + h * .26} ${x + w * .68},${y + h * .29} ${x + w * .84},${y + h * .29}" fill="none" stroke="${G}" stroke-width="2.5" stroke-linejoin="round"/>
<circle cx="${x + w / 2}" cy="${y + h * .72}" r="${h * .15}" fill="${G}"/>`;

  const S = {};

  S.seguridad = () => ground + lying(105) +
    `<path d="M58 88L92 150H24Z" fill="${Y}" stroke="${Y}" stroke-width="8" stroke-linejoin="round"/>` + txt(58, 138, '!', 36, INK, 'middle', 'Georgia,serif') +
    `<path d="M150 62Q190 28 230 62Q190 96 150 62Z" fill="#fff" opacity=".95"/><circle cx="190" cy="62" r="13" fill="${A}"/><circle cx="190" cy="62" r="5.5" fill="${INK}"/>
<path d="M190 20v-10M158 30l-7-8M222 30l7-8" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
<circle cx="276" cy="108" r="18" fill="${G}"/><path d="M267 108l7 7 12-14" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

  S.respuesta = () => ground + lying(58) +
    `<circle cx="214" cy="86" r="15" fill="${R}"/><rect x="198" y="100" width="34" height="52" rx="17" fill="${R}"/><rect x="190" y="148" width="58" height="22" rx="11" fill="${R2}"/>
<path d="M204 118L98 142" stroke="${R}" stroke-width="11" stroke-linecap="round"/><circle cx="94" cy="143" r="8.5" fill="${R2}"/>
<path d="M78 124q-9-7-3-17M112 128q10-8 5-19" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<rect x="150" y="18" width="84" height="46" rx="14" fill="#fff"/><path d="M200 62l-4 16 20-16z" fill="#fff"/>` + txt(192, 53, '?', 32, INK, 'middle', 'Georgia,serif');

  S.ayuda = () => ground +
    `<circle cx="104" cy="72" r="16" fill="${R}"/><rect x="86" y="92" width="36" height="62" rx="16" fill="${R}"/><rect x="90" y="146" width="12" height="26" rx="5" fill="${R2}"/><rect x="108" y="146" width="12" height="26" rx="5" fill="${R2}"/>
<path d="M90 102L62 66M118 102L146 66" stroke="${R}" stroke-width="10" stroke-linecap="round"/>
<path d="M168 40q16 12 0 30" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M178 30q26 20 0 50" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<rect x="206" y="22" width="92" height="64" rx="18" fill="#fff"/><path d="M214 84l-14 18 30-12z" fill="#fff"/>` + txt(252, 70, '!', 50, INK, 'middle', 'Georgia,serif') +
    `<circle cx="248" cy="132" r="11" fill="${V}"/><rect x="237" y="144" width="22" height="28" rx="11" fill="${V}"/>`;

  S.aire = () => `<rect x="170" y="122" width="144" height="46" rx="22" fill="${V}"/><rect x="138" y="130" width="56" height="30" rx="14" fill="${V}"/>
<circle cx="112" cy="132" r="40" fill="${V}"/><path d="M114 90l-5 12h12z" fill="${V2}"/><path d="M128 104q6 3 12 0" stroke="${V2}" stroke-width="3" fill="none" stroke-linecap="round"/>
<rect x="46" y="86" width="62" height="22" rx="11" fill="${R}" transform="rotate(26 77 97)"/><path d="M52 124q-16 22 2 44" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round"/>${arrow(54, 160, 62, 172, A, 3.5)}
<rect x="136" y="92" width="46" height="14" rx="7" fill="${R2}" transform="rotate(-24 159 99)"/><rect x="142" y="108" width="38" height="12" rx="6" fill="${R}" transform="rotate(-24 161 114)"/>${arrow(188, 90, 208, 56, A, 3.5)}
<path d="M138 106Q152 122 172 144" stroke="${G}" stroke-width="4" fill="none" stroke-dasharray="2 7" stroke-linecap="round"/>` + ground;

  S.respira = () => ground + lying(112) +
    `<circle cx="132" cy="88" r="16" fill="${R}"/><path d="M146 92L226 60" stroke="${R}" stroke-width="32" stroke-linecap="round"/>
<path d="M140 90Q158 106 174 134" stroke="#fff" stroke-width="3.5" stroke-dasharray="2 7" stroke-linecap="round" fill="none"/>${arrow(168, 124, 178, 138, '#fff', 3.5)}
<path d="M108 128q7-4 14 0M106 120q10-7 20 0M104 112q13-10 26 0" stroke="${Y}" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="270" cy="50" r="24" fill="none" stroke="#fff" stroke-width="4"/><path d="M270 50V36M270 50l10 6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` + txt(270, 98, '10 s', 17);

  S.llamar = () => `<rect x="112" y="18" width="96" height="164" rx="18" fill="${INK}" stroke="rgba(255,255,255,.5)" stroke-width="3"/>
<rect x="121" y="34" width="78" height="112" rx="9" fill="${A}" opacity=".9"/><rect x="121" y="34" width="78" height="112" rx="9" fill="url(#none)"/>` + txt(160, 102, '112', 32, INK) +
    `<circle cx="160" cy="164" r="12" fill="${G}"/><path d="M154 160q3 8 11 8l2-3-4-3-2 2q-3-1-4-4l2-2-3-4z" fill="${INK}"/>
<path d="M92 70q-14 24 0 48M76 58q-24 36 0 72M228 70q14 24 0 48M244 58q24 36 0 72" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;

  S.manos = () => torso(160, 52, 196, 90) +
    `<path d="M98 94Q160 114 222 94M104 116Q160 136 216 116M110 138Q160 158 210 138" stroke="${V2}" stroke-width="4" fill="none" stroke-linecap="round"/>
<rect x="154" y="60" width="12" height="96" rx="6" fill="${V2}"/><rect x="141" y="108" width="38" height="50" rx="12" fill="${A}" opacity=".35" stroke="${A}" stroke-width="3" stroke-dasharray="5 4"/>
<path d="M150 14V100M170 14V100" stroke="${R}" stroke-width="15" stroke-linecap="round"/>
<rect x="134" y="106" width="52" height="30" rx="13" fill="${R}"/><rect x="141" y="94" width="38" height="28" rx="12" fill="${R2}"/>
<path d="M146 108v9M154 108v9M162 108v9M170 108v9" stroke="${R}" stroke-width="3" stroke-linecap="round"/>
<path d="M146 36l14 12 14-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;

  S.profundidad = () => `<path d="M40 176Q40 104 160 100Q280 104 280 176Z" fill="${V}"/><path d="M40 176Q40 126 160 122Q280 126 280 176" fill="none" stroke="${A}" stroke-width="3.5" stroke-dasharray="6 5"/>
<rect x="132" y="70" width="56" height="30" rx="13" fill="${R}"/><path d="M160 14V74" stroke="${R}" stroke-width="16" stroke-linecap="round"/>${arrow(160, 28, 160, 56, '#fff', 4)}
<path d="M300 100V122M293 100h14M293 122h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` + txt(296, 90, '5–6 cm', 16, '#fff', 'end') +
    `<path d="M70 132q-16-20 0-44" stroke="${G}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M70 88l-10 8M70 88l10 8" stroke="${G}" stroke-width="3.5" stroke-linecap="round"/>` + ground;

  S.ventilar = () => ground + lying(100) +
    `<circle cx="118" cy="102" r="16" fill="${R}"/><path d="M132 106L214 74" stroke="${R}" stroke-width="32" stroke-linecap="round"/>
<path d="M106 126q7 6 14 0M104 134q9 8 18 0" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="M136 130Q170 108 206 130" stroke="${G}" stroke-width="3.5" fill="none" stroke-dasharray="6 5" stroke-linecap="round"/>${arrow(172, 120, 172, 96, G, 3.5)}` + txt(238, 112, '1 s', 18);

  S.ciclo = () => `<circle cx="160" cy="100" r="62" fill="none" stroke="${A}" stroke-width="22" stroke-dasharray="345 44.6" transform="rotate(-90 160 100)" stroke-linecap="butt"/>
<circle cx="160" cy="100" r="62" fill="none" stroke="${R}" stroke-width="22" stroke-dasharray="24 365.6" stroke-dashoffset="-355" transform="rotate(-90 160 100)"/>` +
    txt(160, 112, '30:2', 36) + txt(92, 44, '× 30', 16, A) + txt(236, 44, '× 2', 16, R);

  S.dea_on = () => device(96, 44, 128, 124) +
    `<path d="M130 44V34Q130 26 138 26H182Q190 26 190 34V44" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="6"/>
<circle cx="160" cy="132" r="28" fill="none" stroke="${G}" stroke-opacity=".35" stroke-width="6"/>
<path d="M152 126a10 10 0 1 0 16 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M160 118v10" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
<path d="M224 150Q282 150 288 108" stroke="${Y}" stroke-width="4" fill="none"/><rect x="278" y="84" width="20" height="26" rx="5" fill="${Y}"/>`;

  S.dea_pads = () => torso(112, 56, 198, 74) +
    `<path d="M62 98Q112 114 162 98M66 120Q112 136 158 120" stroke="${V2}" stroke-width="4" fill="none" stroke-linecap="round"/>
<g transform="rotate(-22 78 88)"><rect x="60" y="74" width="40" height="28" rx="9" fill="#fff" stroke="${Y}" stroke-width="3.5"/><path d="M72 88h16M80 80v16" stroke="${Y}" stroke-width="3" stroke-linecap="round"/></g>
<g transform="rotate(-10 150 134)"><rect x="136" y="108" width="28" height="44" rx="9" fill="#fff" stroke="${Y}" stroke-width="3.5"/><path d="M144 130h12M150 122v16" stroke="${Y}" stroke-width="3" stroke-linecap="round"/></g>
<path d="M84 76Q130 34 232 76M160 112Q200 112 232 106" stroke="${Y}" stroke-width="3.5" fill="none" stroke-dasharray="6 5"/>` + device(228, 52, 74, 82, true);

  S.dea_analiza = () => device(24, 48, 120, 108) +
    `<path d="M62 24q-8 10 0 20M82 18q-12 16 0 32M102 24q-8 10 0 20" stroke="${G}" stroke-width="3" fill="none" stroke-linecap="round"/>
<rect x="206" y="96" width="56" height="46" rx="18" fill="${R}"/><rect x="208" y="52" width="11" height="52" rx="5.5" fill="${R}"/><rect x="222" y="44" width="11" height="60" rx="5.5" fill="${R}"/><rect x="236" y="46" width="11" height="58" rx="5.5" fill="${R}"/><rect x="250" y="54" width="11" height="50" rx="5.5" fill="${R}"/>
<rect x="192" y="106" width="32" height="12" rx="6" fill="${R}" transform="rotate(32 208 112)"/>
<circle cx="234" cy="98" r="62" fill="none" stroke="${RD}" stroke-width="8"/><path d="M190 54L278 142" stroke="${RD}" stroke-width="8" stroke-linecap="round"/>`;

  S.dea_descarga = () => ground + lying(100).replace('cy="152"', 'cy="152"') +
    `<path d="M170 14L132 76H158L146 124L194 58H166Z" fill="${Y}"/>
<circle cx="40" cy="92" r="11" fill="${R}"/><rect x="30" y="104" width="20" height="40" rx="10" fill="${R}"/><rect x="31" y="140" width="8" height="30" rx="4" fill="${R2}"/><rect x="42" y="140" width="8" height="30" rx="4" fill="${R2}"/>
<circle cx="284" cy="92" r="11" fill="${R}"/><rect x="274" y="104" width="20" height="40" rx="10" fill="${R}"/><rect x="275" y="140" width="8" height="30" rx="4" fill="${R2}"/><rect x="286" y="140" width="8" height="30" rx="4" fill="${R2}"/>
${arrow(78, 112, 56, 112, A, 3.5)}${arrow(246, 112, 268, 112, A, 3.5)}`;

  S.dosmin = () => `<circle cx="160" cy="74" r="50" fill="#0f2236" stroke="#fff" stroke-opacity=".55" stroke-width="4"/>
<circle cx="160" cy="74" r="40" fill="none" stroke="${A}" stroke-width="9" stroke-dasharray="190 61" transform="rotate(-90 160 74)" stroke-linecap="round"/>` + txt(160, 85, '2:00', 28) +
    `<circle cx="64" cy="144" r="10" fill="${R}"/><rect x="54" y="155" width="20" height="17" rx="8" fill="${R}"/><circle cx="256" cy="144" r="10" fill="${R2}"/><rect x="246" y="155" width="20" height="17" rx="8" fill="${R2}"/>
${arrow(86, 138, 232, 138, Y, 4)}${arrow(234, 156, 88, 156, Y, 4)}`;

  S.corazon = () => `<path d="M160 158C58 94 88 26 140 54Q160 66 160 76Q160 66 180 54C232 26 262 94 160 158Z" fill="${RD}"/>
<polyline points="96,96 132,96 146,72 162,124 176,90 186,96 226,96" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="260" cy="48" r="22" fill="${G}"/><path d="M249 48l8 8 14-16" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* ---- posición lateral de seguridad (vista desde arriba) ---- */
  const topBase = (o = {}) => `<circle cx="84" cy="92" r="20" fill="${V}"/><rect x="102" y="74" width="90" height="40" rx="20" fill="${V}"/><rect x="184" y="82" width="106" height="24" rx="12" fill="${V2}"/>` + (o.farLeg ? '' : '');
  S.pls1 = () => topBase() +
    `<rect x="116" y="98" width="62" height="14" rx="7" fill="${V2}" opacity=".4" stroke="#fff" stroke-opacity=".5" stroke-dasharray="4 4"/>
<rect x="118" y="108" width="16" height="58" rx="8" fill="${V2}"/><circle cx="126" cy="170" r="9" fill="${V}"/>
<path d="M142 108h-16v16" stroke="${A}" stroke-width="3" fill="none"/>
<path d="M164 112Q158 140 144 150" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M144 150l1-12m-1 12l11-3" stroke="${A}" stroke-width="3.5" stroke-linecap="round"/>
<rect x="104" y="152" width="40" height="16" rx="8" fill="${R}" transform="rotate(-12 124 160)" opacity=".95"/>`;
  S.pls2 = () => topBase() +
    `<rect x="118" y="108" width="16" height="58" rx="8" fill="${V2}" opacity=".5"/>
<path d="M170 80L120 98" stroke="${V2}" stroke-width="14" stroke-linecap="round"/><rect x="90" y="106" width="30" height="16" rx="8" fill="${R}"/><circle cx="104" cy="110" r="7" fill="${R2}"/>
${arrow(172, 74, 134, 92, A, 3.5)}<path d="M88 120q-3 14 8 22" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="2 6"/>`;
  S.pls3 = () => `<circle cx="84" cy="92" r="20" fill="${V}"/><rect x="102" y="74" width="90" height="40" rx="20" fill="${V}"/><rect x="184" y="92" width="106" height="24" rx="12" fill="${V2}"/>
<path d="M186 82L244 50L270 94" stroke="${V}" stroke-width="22" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="244" cy="52" r="9" fill="${V2}"/>
<rect x="228" y="64" width="30" height="16" rx="8" fill="${R}" transform="rotate(-28 243 72)"/>${arrow(212, 38, 248, 28, A, 3.5)}<circle cx="274" cy="102" r="6" fill="${V2}"/>`;
  S.pls4 = () => `<circle cx="96" cy="94" r="19" fill="${V}"/><rect x="114" y="82" width="76" height="26" rx="13" fill="${V}"/><rect x="184" y="86" width="96" height="20" rx="10" fill="${V2}"/>
<path d="M186 84L238 64L262 92" stroke="${V}" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M208 56Q150 36 120 70" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="1 7"/>` +
    `<path d="M234 154Q186 186 130 150" stroke="${A}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M130 150l14-3m-14 3l5 13" stroke="${A}" stroke-width="4" stroke-linecap="round"/>
<rect x="222" y="108" width="34" height="16" rx="8" fill="${R}" transform="rotate(30 239 116)"/><rect x="124" y="108" width="34" height="16" rx="8" fill="${R}" transform="rotate(-24 141 116)"/>`;
  S.pls5 = () => ground + `<ellipse cx="164" cy="168" rx="124" ry="6" fill="#000" opacity=".18"/>
<circle cx="70" cy="132" r="19" fill="${V}"/><rect x="82" y="124" width="104" height="38" rx="19" fill="${V}"/>
<rect x="176" y="140" width="92" height="22" rx="11" fill="${V2}"/>
<path d="M186 140L236 112L256 118" stroke="${V}" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M104 134L92 112L70 118" stroke="${V2}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="62" cy="120" r="8" fill="${V2}"/>
<path d="M60 108q-8-12 4-20" stroke="${A}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="2 6"/>
<circle cx="276" cy="48" r="20" fill="${G}"/><path d="M267 48l7 7 12-14" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  S.pls6 = () => S.llamar();

  const api = {
    get(name) { return S[name] ? wrap(S[name]()) : ''; },
    names: Object.keys(S)
  };
  return api;
})();
