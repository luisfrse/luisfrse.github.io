/* Pruebas del motor de cálculo.  Uso:  node apps/ruta/tests/test-calc.js */
const C = require('../calc.js');
let fails = 0, n = 0;
const near = (name, got, want, tol) => { n++; const ok = Math.abs(got - want) <= tol; if (!ok) fails++; console.log((ok ? 'OK  ' : 'FALLA') + ' ' + name + ' → ' + (+got.toFixed(3)) + ' (esperado ' + want + ' ±' + tol + ')'); };
const truthy = (name, v) => { n++; if (!v) fails++; console.log((v ? 'OK  ' : 'FALLA') + ' ' + name); };

/* --- métodos (valores calculados a mano) --- */
near('DIN 33466 12 km, 800 m ↑, 800 m ↓ = 346 min', C.methods.din({ dist: 12, up: 800, down: 800 }), 346, 0.5);
near('DIN solo horizontal 8 km = 120 min', C.methods.din({ dist: 8, up: 0, down: 0 }), 120, 0.01);
near('Naismith 10 km + 600 m ↑ = 180 min', C.methods.naismith({ dist: 10, up: 600, down: 0 }), 180, 0.01);
near('Naismith + Langmuir 10 km, 600 ↑ 600 ↓ (pend. media 6,8°, suave) = 160 min', C.methods.naismith({ dist: 10, up: 600, down: 600 }), 160, 0.01);
near('Naismith + Langmuir bajada fuerte (>12°): 4 km, 0 ↑, 900 ↓ → +30 min', C.methods.naismith({ dist: 4, up: 0, down: 900 }), 4 / 5 * 60 + 30, 0.01);
near('Tobler llano 10 km (5,04 km/h) = 119,1 min', C.methods.tobler({ dist: 10, up: 0, down: 0 }), 60 * 10 / (6 * Math.exp(-3.5 * 0.05)), 0.01);
near('Tobler máx. 6 km/h en -5 % de pendiente', C.toblerV(-0.05), 6, 1e-9);
near('Tobler fuera de camino (×0,6) llano: tiempo ×1,667', C.methods.tobler({ dist: 10, up: 0, down: 0 }, { offPath: true }) / C.methods.tobler({ dist: 10, up: 0, down: 0 }), 1 / 0.6, 1e-9);
near('Munter 10 km + 600 m ↑ = (10+6)/4 h = 240 min', C.methods.munter({ dist: 10, up: 600, down: 0 }), 240, 0.01);
near('Munter con 600 m ↓ (bfu: 200 m = 1 unidad) = 285 min', C.methods.munter({ dist: 10, up: 600, down: 600 }), 285, 0.01);

/* --- factores --- */
near('Mochila 5 kg = ×1', C.packFactor(5), 1, 1e-9);
near('Mochila 20 kg = ×1,09', C.packFactor(20), 1.09, 1e-9);
near('Altitud 1500 m = ×1', C.altFactor(1500), 1, 1e-9);
near('Altitud 3000 m = ×1,105', C.altFactor(3000), 1.105, 1e-9);
near('Grupo de 20 limitado a ×1,2', C.groupFactor(20), 1.2, 1e-9);

/* --- zig-zag de desnivel --- */
{
  const z = C.zigzag([0, 1, 0, 1, 0, 1, 0], 3); near('Ruido ±1 m con umbral 3 m → 0 de subida', z.up, 0, 1e-9);
  const w = C.zigzag([0, 5, 2, 10, 4], 3); near('Zig-zag 0→5→2→10→4: sube 13', w.up, 13, 1e-9); near('Zig-zag: baja 9', w.down, 9, 1e-9);
  const r = C.zigzag([100, 400, 100], 3); near('Subir 300 y bajar 300', r.up + r.down, 600, 1e-9);
}

/* --- plan: ida y vuelta, paradas y suma de tramos --- */
{
  const segs = [{ name: 'A', dist: 5, up: 400, down: 0, alt: 1500 }, { name: 'B', dist: 4, up: 300, down: 50, alt: 2000 }];
  const s = { level: 'average', custom: 1, pack: 5, terrain: 'path', snow: 'none', group: 1, breakEvery: 60, breakLen: 10, lunch: 30, extra: 0 };
  const p1 = C.plan(segs, s, false), p2 = C.plan(segs, s, true);
  near('Ida y vuelta: distancia doble', p2.dist, 18, 1e-9);
  near('Ida y vuelta: subida = subida + bajada de la ida', p2.up, 400 + 300 + 0 + 50, 1e-9);
  truthy('La vuelta aporta tiempo de marcha', p2.moving > p1.moving);
  truthy('Reloj coherente: duración = marcha + paradas', Math.abs(p2.duration - (p2.moving + p2.breaks)) < 1e-6);
  truthy('Comida en el punto de retorno', p2.legs.find(l => l.restAtEnd > 0) === p2.legs[1]);
  const fast = C.plan(segs, { ...s, level: 'athlete' }, false);
  near('Nivel atleta = ×0,72 del medio', fast.moving / p1.moving, 0.72, 1e-9);
  const hi = C.plan([{ dist: 5, up: 400, down: 0, alt: 3000 }], s, false);
  near('A 3000 m el tiempo sube un 10,5 % (mismo tramo a 1500 m = base)', hi.moving / C.plan([{ dist: 5, up: 400, down: 0, alt: 1500 }], s, false).moving, 1.105, 1e-9);
}

/* --- sol: Greenwich 21-jun-2024: amanecer ≈ 03:43 UTC y ocaso ≈ 20:21 UTC --- */
{
  const t = C.sunTimes(new Date(Date.UTC(2024, 5, 21, 12, 0, 0)), 51.4779, 0);
  const m = (d) => d.getUTCHours() * 60 + d.getUTCMinutes();
  near('Greenwich solsticio: amanecer (min UTC)', m(t.sunrise), 3 * 60 + 43, 3);
  near('Greenwich solsticio: ocaso (min UTC)', m(t.sunset), 20 * 60 + 21, 3);
  const q = C.sunTimes(new Date(Date.UTC(2024, 2, 20, 12, 0, 0)), 0, 0);
  near('Ecuador en el equinoccio: día ≈ 12 h 08 min', (q.sunset - q.sunrise) / 60000, 12 * 60 + 8, 4);
  truthy('Crepúsculo civil antes del amanecer', t.dawn < t.sunrise && t.dusk > t.sunset);
  const polar = C.sunTimes(new Date(Date.UTC(2024, 5, 21, 12, 0, 0)), 78, 15);
  truthy('Sol de medianoche (78° N en junio): sin amanecer/ocaso', polar.sunrise === null && polar.sunset === null);
}

/* --- GPX sintético: sube 600 m en 6 km y baja 600 m en 4 km, con ruido de ±3 m --- */
function gpx(opts = {}) {
  const lat0 = 42.0, lon0 = 1.0, pts = [];
  const kmPerDegLon = 111.32 * Math.cos(lat0 * Math.PI / 180);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i <= 1000; i++) {
    const x = i / 100; // km
    const e = x <= 6 ? 1000 + 100 * x : 1600 - 150 * (x - 6);
    const noisy = e + (rnd() - 0.5) * 6; // ±3 m, como un GPS real
    const t = new Date(Date.UTC(2024, 6, 1, 8, 0, 0) + x * 720000).toISOString(); // 5 km/h
    pts.push(`<trkpt lon="${(lon0 + x / kmPerDegLon).toFixed(6)}" lat="${lat0}"><ele>${noisy.toFixed(1)}</ele>${opts.time === false ? '' : `<time>${t}</time>`}</trkpt>`);
  }
  return `<?xml version="1.0"?><gpx version="1.1"><metadata><name><![CDATA[Prueba & demo]]></name></metadata><wpt lat="${lat0}" lon="${lon0 + 6 / kmPerDegLon}"><name>Cima</name></wpt><trk><name>T</name><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}
{
  const g = C.parseGPX(gpx());
  near('GPX: 1001 puntos', g.points.length, 1001, 0);
  truthy('GPX: nombre con CDATA y entidades', g.name === 'Prueba & demo');
  truthy('GPX: waypoint leído', g.waypoints.length === 1 && g.waypoints[0].name === 'Cima');
  truthy('GPX: atributos lon/lat en cualquier orden', g.points[0].lat === 42 && g.points[0].lon === 1);
  const an = C.analyzeTrack(g.points, { noise: 3 });
  near('GPX: distancia 10 km', an.dist, 10, 0.05);
  near('GPX: subida con filtro de 3 m ≈ 600 m', an.up, 600, 40);
  near('GPX: bajada con filtro de 3 m ≈ 600 m', an.down, 600, 40);
  const raw = C.zigzag(g.points.map(p => p.ele), 0.0001);
  console.log('     (subida sin filtrar: ' + raw.up.toFixed(0) + ' m; con filtro: ' + an.up.toFixed(0) + ' m)');
  truthy('Sin filtro el ruido infla el desnivel (más de un 25 % por encima del real)', raw.up > 600 * 1.25);
  near('GPX: cota máx ≈ 1600', an.maxEle, 1600, 8);
  near('GPX: cota mín ≈ 1000', an.minEle, 1000, 8);
  truthy('GPX: tiempo registrado leído (≈ 120 min)', an.recorded && Math.abs(an.recorded.elapsedMin - 120) < 1);
  const cps = C.checkpoints(an, g.waypoints, { useWpt: true, every: 0 });
  truthy('Waypoint «Cima» como punto de control en ≈ 6 km', cps.length === 1 && Math.abs(cps[0].d - 6) < 0.2);
  const segs = C.trackSegments(an, cps);
  near('Tramo 1: 6 km', segs[0].dist, 6, 0.1); near('Tramo 2: 4 km', segs[1].dist, 4, 0.1);
  near('Tramo 1: subida ≈ 600', segs[0].up, 600, 40); near('Tramo 2: bajada ≈ 600', segs[1].down, 600, 40);
  const tob = C.methods.tobler(segs[0]);
  truthy('Tobler con perfil real da un tiempo razonable (90–140 min para 6 km con 600 m)', tob > 90 && tob < 140);
  const every = C.checkpoints(an, [], { useWpt: false, every: 2.5 });
  truthy('Puntos cada 2,5 km → 3 puntos de control (2,5 / 5 / 7,5)', every.length === 3);
  const nt = C.analyzeTrack(C.parseGPX(gpx({ time: false })).points);
  truthy('Sin marcas de tiempo: recorded = null', nt.recorded === null);
  let bad = false; try { C.parseGPX('<html></html>'); } catch (e) { bad = true; } truthy('Archivo que no es GPX → error', bad);
  const noEle = C.analyzeTrack([{ lat: 42, lon: 1, ele: null, t: null }, { lat: 42.01, lon: 1, ele: null, t: null }]);
  truthy('Sin altitudes: hasEle = false y desnivel 0', noEle.hasEle === false && noEle.up === 0);
}

console.log('\n' + (fails ? `✗ ${fails} de ${n} pruebas fallan` : `✓ ${n} pruebas correctas`));
process.exit(fails ? 1 : 0);
