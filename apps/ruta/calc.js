/* ============================================================
   Motor de cálculo de la calculadora de rutas (sin interfaz).
   Funciona en el navegador (window.RutaCalc) y en Node (para las pruebas).

   Métodos (tiempo de MARCHA, sin paradas, para un excursionista medio):
   - Naismith (1892) + corrección de Langmuir (1984)
   - Función de Tobler (1993)
   - Munter (unidades km + desnivel/100) con la regla suiza bfu para el descenso
   - DIN 33466 (como la usa el Club Alpino Alemán)
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RutaCalc = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RAD = Math.PI / 180;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---------------- geodesia ---------------- */
  function haversine(lat1, lon1, lat2, lon2) { // km
    const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /* ---------------- GPX (sin DOM, para poder probarlo en Node) ---------------- */
  const decodeXml = (s) => String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').trim();
  const attr = (s, name) => { const m = new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i').exec(s); return m ? (m[2] ?? m[3]) : null; };
  const tag = (body, name) => { const m = new RegExp('<' + name + '\\b[^>]*>([\\s\\S]*?)</' + name + '>', 'i').exec(body || ''); return m ? decodeXml(m[1]) : null; };

  function parseGPX(text) {
    if (typeof text !== 'string' || !/<gpx[\s>]/i.test(text)) throw new Error('not-gpx');
    const re = /<(trkpt|rtept|wpt)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;
    const trk = [], rte = [], waypoints = [];
    let m;
    while ((m = re.exec(text))) {
      const lat = parseFloat(attr(m[2], 'lat')), lon = parseFloat(attr(m[2], 'lon'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const eleS = tag(m[3], 'ele'), timeS = tag(m[3], 'time');
      const ele = eleS !== null && eleS !== '' && Number.isFinite(parseFloat(eleS)) ? parseFloat(eleS) : null;
      const t = timeS ? Date.parse(timeS) : NaN;
      const p = { lat, lon, ele, t: Number.isFinite(t) ? t : null };
      if (m[1].toLowerCase() === 'trkpt') trk.push(p);
      else if (m[1].toLowerCase() === 'rtept') rte.push(p);
      else waypoints.push({ lat, lon, ele, name: tag(m[3], 'name') || '' });
    }
    const points = trk.length >= 2 ? trk : rte;
    const meta = /<metadata\b[^>]*>([\s\S]*?)<\/metadata>/i.exec(text);
    const name = (meta && tag(meta[1], 'name')) || (/<trk\b[^>]*>([\s\S]*?)<\/trk>/i.exec(text) && tag(/<trk\b[^>]*>([\s\S]*?)<\/trk>/i.exec(text)[1], 'name')) || '';
    if (points.length < 2) throw new Error('no-track');
    return { points, waypoints, name };
  }

  /* ---------------- perfil: suavizado y desnivel ---------------- */
  function median(arr) { const a = arr.slice().sort((x, y) => x - y), n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : NaN; }
  function smooth(ele, med = 5, ma = 3) {
    const n = ele.length, h1 = Math.floor(med / 2), h2 = Math.floor(ma / 2);
    const m1 = ele.map((_, i) => median(ele.slice(Math.max(0, i - h1), Math.min(n, i + h1 + 1))));
    return m1.map((_, i) => { const s = m1.slice(Math.max(0, i - h2), Math.min(n, i + h2 + 1)); return s.reduce((a, b) => a + b, 0) / s.length; });
  }
  /* Desnivel acumulado con filtro de histéresis (zig-zag): solo cuenta cambios de sentido mayores que `T` metros */
  function zigzag(eles, T = 3) {
    let up = 0, down = 0;
    if (eles.length < 2) return { up, down };
    let pivot = eles[0], ext = eles[0], trend = 0;
    for (let i = 1; i < eles.length; i++) {
      const v = eles[i];
      if (trend === 0) {
        if (v - pivot >= T) { trend = 1; ext = v; } else if (pivot - v >= T) { trend = -1; ext = v; }
      } else if (trend === 1) {
        if (v > ext) ext = v; else if (ext - v >= T) { up += ext - pivot; pivot = ext; trend = -1; ext = v; }
      } else {
        if (v < ext) ext = v; else if (v - ext >= T) { down += pivot - ext; pivot = ext; trend = 1; ext = v; }
      }
    }
    if (trend === 1) up += ext - pivot; else if (trend === -1) down += pivot - ext;
    return { up, down };
  }

  /* Analiza un track: distancia, desnivel, perfil remuestreado y datos de tiempo registrado.
     points = [{lat, lon, ele|null, t|null}] */
  function analyzeTrack(points, { noise = 3 } = {}) {
    const n = points.length;
    const d = [0];
    for (let i = 1; i < n; i++) d.push(d[i - 1] + haversine(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon));
    const dist = d[n - 1];
    const hasEle = points.some(p => p.ele !== null);
    let ele = points.map(p => p.ele);
    if (hasEle) { // rellenar huecos por interpolación
      let last = ele.findIndex(e => e !== null);
      for (let i = 0; i < last; i++) ele[i] = ele[last];
      for (let i = last + 1; i < n; i++) {
        if (ele[i] === null) {
          let j = i; while (j < n && ele[j] === null) j++;
          if (j >= n) { for (let k = i; k < n; k++) ele[k] = ele[last]; break; }
          for (let k = i; k < j; k++) ele[k] = ele[last] + (ele[j] - ele[last]) * (d[k] - d[last]) / ((d[j] - d[last]) || 1);
          i = j - 1;
        }
        last = i;
      }
    } else ele = ele.map(() => 0);
    const sm = hasEle ? smooth(ele) : ele;

    // remuestreo uniforme en distancia
    const step = clamp(dist / 800, 0.02, 0.25);
    const prof = [];
    let j = 0;
    for (let x = 0; x < dist; x += step) {
      while (j < n - 2 && d[j + 1] < x) j++;
      const span = (d[j + 1] - d[j]) || 1, f = clamp((x - d[j]) / span, 0, 1);
      prof.push({ d: x, e: sm[j] + (sm[j + 1] - sm[j]) * f, lat: points[j].lat + (points[j + 1].lat - points[j].lat) * f, lon: points[j].lon + (points[j + 1].lon - points[j].lon) * f });
    }
    prof.push({ d: dist, e: sm[n - 1], lat: points[n - 1].lat, lon: points[n - 1].lon });
    const zz = hasEle ? zigzag(prof.map(p => p.e), noise) : { up: 0, down: 0 };
    const es = prof.map(p => p.e);

    // tiempo registrado (si el GPX lleva marcas de tiempo)
    let recorded = null;
    if (points[0].t !== null && points[n - 1].t !== null && points[n - 1].t > points[0].t) {
      let moving = 0;
      for (let i = 1; i < n; i++) {
        const dt = (points[i].t - points[i - 1].t) / 1000, dd = d[i] - d[i - 1];
        if (dt > 0 && dt <= 300 && (dd / (dt / 3600)) >= 1.0) moving += dt;
      }
      recorded = { elapsedMin: (points[n - 1].t - points[0].t) / 60000, movingMin: moving / 60 };
    }
    return { dist, up: zz.up, down: zz.down, hasEle, minEle: hasEle ? Math.min(...es) : null, maxEle: hasEle ? Math.max(...es) : null, prof, count: n, recorded, noise };
  }

  /* Corta el perfil entre d0 y d1 (km) y calcula distancia/desnivel del tramo */
  function sliceProfile(an, d0, d1, noise = an.noise || 3) {
    const pts = [];
    const interp = (x) => {
      const P = an.prof; let lo = 0, hi = P.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P[mid].d <= x) lo = mid; else hi = mid; }
      const a = P[lo], b = P[hi], f = (b.d - a.d) ? clamp((x - a.d) / (b.d - a.d), 0, 1) : 0;
      return { d: x, e: a.e + (b.e - a.e) * f, lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
    };
    pts.push(interp(d0));
    for (const p of an.prof) if (p.d > d0 && p.d < d1) pts.push(p);
    pts.push(interp(d1));
    const z = zigzag(pts.map(p => p.e), noise);
    return { dist: d1 - d0, up: z.up, down: z.down, prof: pts.map(p => ({ d: p.d - d0, e: p.e, lat: p.lat, lon: p.lon })), d0, d1 };
  }

  /* Puntos de control a partir de waypoints del GPX (proyectados sobre el track) y/o cada N km */
  function checkpoints(an, waypoints = [], { useWpt = true, every = 0 } = {}) {
    const cps = [];
    if (useWpt) {
      for (const w of waypoints) {
        let best = null;
        for (const p of an.prof) { const dd = haversine(w.lat, w.lon, p.lat, p.lon); if (!best || dd < best.dd) best = { dd, d: p.d }; }
        if (best && best.dd <= 0.3 && best.d > 0.2 && best.d < an.dist - 0.2) cps.push({ name: w.name || '', d: best.d });
      }
    }
    if (every > 0) for (let x = every; x < an.dist - every * 0.25; x += every) cps.push({ name: '', d: x });
    cps.sort((a, b) => a.d - b.d);
    const out = [];
    for (const c of cps) if (!out.length || c.d - out[out.length - 1].d >= 0.3) out.push(c);
    return out;
  }

  function trackSegments(an, cps = [], names = {}) {
    const bounds = [0, ...cps.map(c => c.d), an.dist];
    const segs = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const s = sliceProfile(an, bounds[i], bounds[i + 1]);
      s.name = (i < cps.length && cps[i].name) ? cps[i].name : (names.label ? names.label(i + 1) : String(i + 1));
      segs.push(s);
    }
    return segs;
  }

  function reverseSeg(s) {
    const r = { ...s, up: s.down, down: s.up, name: s.name };
    if (s.prof) r.prof = s.prof.slice().reverse().map(p => ({ ...p, d: s.dist - p.d }));
    return r;
  }

  /* Perfil esquemático de un tramo manual: primero la subida y luego la bajada (mismo supuesto del modelo) */
  function schematicProfile(segs, startEle = 0) {
    const out = [{ d: 0, e: startEle, lat: null, lon: null }];
    let x = 0, e = startEle;
    for (const s of segs) {
      const V = s.up + s.down;
      const fa = V > 0 ? s.up / V : 0;
      if (V <= 0) { x += s.dist; out.push({ d: x, e }); continue; }
      x += s.dist * fa; e += s.up; out.push({ d: x, e });
      x += s.dist * (1 - fa); e -= s.down; out.push({ d: x, e });
    }
    return out;
  }

  /* ---------------- métodos de tiempo (minutos de marcha) ---------------- */
  /* Modelo de pendiente media cuando solo hay totales: la distancia se reparte entre la parte que sube y la que baja
     en proporción a los metros, con la misma pendiente media absoluta s = (subida+bajada)/distancia. */
  function modelSlopes(seg) {
    const V = seg.up + seg.down, L = seg.dist * 1000;
    if (V <= 0 || L <= 0) return { s: 0, fa: 0, fd: 0 };
    return { s: V / L, fa: seg.up / V, fd: seg.down / V };
  }

  function descentBands(seg) { // metros de bajada en pendiente suave (5-12°) y fuerte (>12°)
    let gentle = 0, steep = 0;
    if (seg.prof && seg.prof.length > 2) {
      for (let i = 1; i < seg.prof.length; i++) {
        const dd = (seg.prof[i].d - seg.prof[i - 1].d) * 1000, dz = seg.prof[i].e - seg.prof[i - 1].e;
        if (dz < 0 && dd > 0) {
          const ang = Math.atan(-dz / dd) / RAD;
          if (ang >= 5 && ang <= 12) gentle += -dz; else if (ang > 12) steep += -dz;
        }
      }
    } else if (seg.down > 0) {
      const { s } = modelSlopes(seg), ang = Math.atan(s) / RAD;
      if (ang >= 5 && ang <= 12) gentle = seg.down; else if (ang > 12) steep = seg.down;
    }
    return { gentle, steep };
  }

  const M = {};
  /* Naismith: 5 km/h + 1 h por 600 m de subida. Langmuir: -10 min por 300 m de bajada entre 5° y 12°; +10 min por 300 m si > 12° */
  M.naismith = (seg) => {
    let h = seg.dist / 5 + seg.up / 600;
    const { gentle, steep } = descentBands(seg);
    h += (steep - gentle) / 300 * (10 / 60);
    return Math.max(h, seg.dist / 7) * 60;
  };
  /* Tobler: v = 6·exp(-3.5·|s + 0.05|) km/h, s = pendiente (tangente). */
  const toblerV = (s) => Math.max(0.4, 6 * Math.exp(-3.5 * Math.abs(s + 0.05)));
  M.tobler = (seg, { offPath = false } = {}) => {
    const k = offPath ? 0.6 : 1;
    let h = 0;
    if (seg.prof && seg.prof.length > 2) {
      for (let i = 1; i < seg.prof.length; i++) {
        const dd = seg.prof[i].d - seg.prof[i - 1].d; // km
        if (dd <= 0) continue;
        h += dd / (toblerV((seg.prof[i].e - seg.prof[i - 1].e) / (dd * 1000)) * k);
      }
    } else {
      const { s, fa, fd } = modelSlopes(seg);
      if (s === 0) h = seg.dist / (toblerV(0) * k);
      else h = seg.dist * fa / (toblerV(s) * k) + seg.dist * fd / (toblerV(-s) * k);
    }
    return h * 60;
  };
  /* Munter: unidades = km + subida/100 (+ bajada/200 según la regla suiza bfu); 4 unidades/hora */
  M.munter = (seg) => (seg.dist + seg.up / 100 + seg.down / 200) / 4 * 60;
  /* DIN 33466: horizontal 4 km/h; subida 300 m/h; bajada 500 m/h; tiempo = el mayor + la mitad del menor */
  M.din = (seg) => {
    const th = seg.dist / 4, tv = seg.up / 300 + seg.down / 500;
    return (Math.max(th, tv) + Math.min(th, tv) / 2) * 60;
  };
  const METHODS = ['naismith', 'tobler', 'munter', 'din'];

  /* ---------------- factores de ajuste ---------------- */
  const LEVELS = { relaxed: 1.25, average: 1.0, fit: 0.85, athlete: 0.72 };
  const TERRAIN = { path: 1.0, rough: 1.15, trackless: 1.5, blocks: 1.8, scramble: 2.0 };
  const SNOW = { none: 1.0, mud: 1.1, hard: 1.15, soft: 1.5, deep: 2.0 };
  const packFactor = (kg) => 1 + 0.006 * Math.max(0, kg - 5);
  const groupFactor = (n) => 1 + Math.min(0.2, 0.02 * Math.max(0, n - 1));
  const altFactor = (alt) => 1 + 0.007 * Math.max(0, (alt - 1500) / 100);

  function legFactor(s, { terrain, alt }) {
    const f = {
      level: (LEVELS[s.level] ?? 1) * (s.custom || 1),
      pack: packFactor(s.pack || 0),
      terrain: TERRAIN[terrain || s.terrain] ?? 1,
      snow: SNOW[s.snow] ?? 1,
      group: groupFactor(s.group || 1),
      alt: altFactor(alt || 0)
    };
    f.total = f.level * f.pack * f.terrain * f.snow * f.group * f.alt;
    return f;
  }

  /* ---------------- plan de la jornada ---------------- */
  /* segs: tramos de ida [{name,dist,up,down,prof?,terrain?,alt}] — alt = altitud media del tramo (m)
     s: ajustes {level,custom,pack,terrain,snow,group,breakEvery,breakLen,lunch,extra}
     roundTrip: añade la vuelta por el mismo itinerario */
  function plan(segs, s, roundTrip = false) {
    const legs = segs.map((g, i) => ({ ...g, idx: i, back: false }));
    if (roundTrip) segs.slice().reverse().forEach((g, i) => legs.push({ ...reverseSeg(g), name: g.name, idx: segs.length - 1 - i, back: true, terrain: g.terrain, alt: g.alt }));
    const totals = { naismith: 0, tobler: 0, munter: 0, din: 0, med: 0, adjusted: 0, min: 0, max: 0 };
    for (const L of legs) {
      L.methods = {};
      for (const k of METHODS) L.methods[k] = M[k](L);
      const arr = METHODS.map(k => L.methods[k]);
      L.base = median(arr);
      L.factor = legFactor(s, { terrain: L.terrain, alt: L.alt });
      L.moving = L.base * L.factor.total;
      L.range = [Math.min(...arr) * L.factor.total, Math.max(...arr) * L.factor.total];
      for (const k of METHODS) totals[k] += L.methods[k];
      totals.med += L.base; totals.adjusted += L.moving; totals.min += L.range[0]; totals.max += L.range[1];
    }
    const totalMoving = totals.adjusted;
    // paradas cortas: cada `breakEvery` minutos de marcha (no se cuenta una justo al final)
    const every = s.breakEvery > 0 ? s.breakEvery : 0;
    let cum = 0;
    legs.forEach((L) => {
      L.breakShort = 0;
      if (every > 0) {
        const before = Math.floor((cum + 1e-9) / every), after = Math.floor((cum + L.moving - 5) / every);
        L.breakShort = Math.max(0, after - before) * (s.breakLen || 0);
      }
      cum += L.moving;
    });
    // comida/parada larga: en el punto de retorno (ida y vuelta) o a mitad de marcha (solo ida)
    const rest = (s.lunch || 0) + (s.extra || 0);
    let restLeg = -1;
    if (rest > 0 && totalMoving >= 60) {
      if (roundTrip) restLeg = segs.length - 1;
      else { let c = 0; restLeg = legs.length - 1; for (let i = 0; i < legs.length; i++) { c += legs[i].moving; if (c >= totalMoving / 2) { restLeg = i; break; } } }
    }
    legs.forEach((L, i) => { L.restAtEnd = (i === restLeg) ? rest : 0; });
    const breaks = legs.reduce((a, L) => a + L.breakShort + L.restAtEnd, 0);
    // reloj relativo (minutos desde la salida)
    let t = 0;
    legs.forEach((L) => { L.tStart = t; L.tArrive = t + L.moving + L.breakShort; L.tLeave = L.tArrive + L.restAtEnd; t = L.tLeave; });
    const dist = legs.reduce((a, L) => a + L.dist, 0), up = legs.reduce((a, L) => a + L.up, 0), down = legs.reduce((a, L) => a + L.down, 0);
    const outLegs = legs.filter(L => !L.back), backLegs = legs.filter(L => L.back);
    return {
      legs, totals, moving: totalMoving, breaks, duration: t, dist, up, down,
      turnaroundAt: roundTrip ? outLegs[outLegs.length - 1].tArrive : null,
      backDuration: roundTrip ? (backLegs[backLegs.length - 1].tArrive - backLegs[0].tStart) : null
    };
  }

  /* ---------------- sol (NOAA / SunCalc) ---------------- */
  const DAY_MS = 86400000, J1970 = 2440588, J2000 = 2451545, E = RAD * 23.4397, J0 = 0.0009;
  const toJulian = (date) => date.valueOf() / DAY_MS - 0.5 + J1970;
  const fromJulian = (j) => new Date((j + 0.5 - J1970) * DAY_MS);
  const toDays = (date) => toJulian(date) - J2000;
  const solarMeanAnomaly = (d) => RAD * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (Ma) => { const C = RAD * (1.9148 * Math.sin(Ma) + 0.02 * Math.sin(2 * Ma) + 0.0003 * Math.sin(3 * Ma)); return Ma + C + RAD * 102.9372 + Math.PI; };
  const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));
  const julianCycle = (d, lw) => Math.round(d - J0 - lw / (2 * Math.PI));
  const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * Math.PI) + n;
  const solarTransitJ = (ds, Ma, L) => J2000 + ds + 0.0053 * Math.sin(Ma) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, dec) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));

  /* Devuelve Date (o null si no ocurre ese día) para: dawn/dusk (crepúsculo civil, -6°), sunrise/sunset (-0.833°), noon */
  function sunTimes(date, lat, lon) {
    const lw = RAD * -lon, phi = RAD * lat, d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n);
    const Ma = solarMeanAnomaly(ds), L = eclipticLongitude(Ma), dec = declination(L, 0), Jnoon = solarTransitJ(ds, Ma, L);
    const out = { noon: fromJulian(Jnoon) };
    const set = (name, rise, angle) => {
      const w = hourAngle(angle * RAD, phi, dec);
      if (!Number.isFinite(w)) { out[rise] = null; out[name] = null; return; }
      const Jset = solarTransitJ(approxTransit(w, lw, n), Ma, L);
      out[name] = fromJulian(Jset); out[rise] = fromJulian(Jnoon - (Jset - Jnoon));
    };
    set('sunset', 'sunrise', -0.833);
    set('dusk', 'dawn', -6);
    return out;
  }

  return { haversine, parseGPX, smooth, zigzag, analyzeTrack, sliceProfile, checkpoints, trackSegments, reverseSeg, schematicProfile,
    modelSlopes, descentBands, methods: M, METHODS, toblerV, LEVELS, TERRAIN, SNOW, packFactor, groupFactor, altFactor, legFactor, plan, sunTimes, median, clamp };
}));
