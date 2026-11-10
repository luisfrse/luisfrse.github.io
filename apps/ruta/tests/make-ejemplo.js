/* Genera apps/ruta/ejemplo.gpx: una ruta FICTICIA de ejemplo (no es un recorrido real).
   Uso: node apps/ruta/tests/make-ejemplo.js */
const fs = require('fs'), path = require('path');
let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const lat0 = 42.62, lon0 = 0.98;
const kmLat = 111.19, kmLon = 111.32 * Math.cos(lat0 * Math.PI / 180);
const L = 8.2; // km
const base = (x) => x < 3.2 ? 1450 + 125 * x : x < 3.6 ? 1850 + 5 * (x - 3.2) : x < 6.1 ? 1852 + 199 * (x - 3.6) : x < 6.6 ? 2350 - 80 * (x - 6.1) : 2310 + 143 * (x - 6.6);
const east = (x) => x * 0.82 + 0.35 * Math.sin(x * 1.3), north = (x) => x * 0.55 + 0.25 * Math.sin(x * 0.9 + 1);
const pts = []; let t = Date.UTC(2025, 6, 12, 6, 40, 0); let prev = null;
for (let x = 0; x <= L + 1e-9; x += 0.04) {
  const e = base(x) + 5 * Math.sin(x * 6.5) + (rnd() - 0.5) * 5;
  const lat = lat0 + north(x) / kmLat, lon = lon0 + east(x) / kmLon;
  if (prev) {
    const dkm = x - prev.x, slope = (e - prev.e) / (dkm * 1000);
    const v = Math.max(1.6, 5.0 * Math.exp(-3.5 * Math.abs(slope + 0.05)) * 0.8); // km/h, ritmo tranquilo
    t += dkm / v * 3600000;
  }
  pts.push({ x, e, lat, lon, t });
  if (Math.abs(x - 3.4) < 0.021 && !pts.stopDone) { pts.stopDone = true; for (let k = 1; k <= 5; k++) pts.push({ x, e, lat, lon, t: t + k * 300000 }); t += 5 * 300000; }
  prev = { x, e };
}
const trkpts = pts.map(p => `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}"><ele>${p.e.toFixed(1)}</ele><time>${new Date(p.t).toISOString()}</time></trkpt>`).join('\n');
const at = (xk) => pts.reduce((b, p) => Math.abs(p.x - xk) < Math.abs(b.x - xk) ? p : b);
const wpt = (n, xk) => { const p = at(xk); return `  <wpt lat="${(p.lat + 0.0002).toFixed(6)}" lon="${p.lon.toFixed(6)}"><ele>${p.e.toFixed(0)}</ele><name>${n}</name></wpt>`; };
const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Ejemplo ficticio" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Ruta de ejemplo (ficticia)</name></metadata>
${wpt('Refugio', 3.4)}
${wpt('Collado', 6.1)}
  <trk><name>Ruta de ejemplo (ficticia)</name><trkseg>
${trkpts}
  </trkseg></trk>
</gpx>
`;
fs.writeFileSync(path.join(__dirname, '..', 'ejemplo.gpx'), gpx);
console.log('ejemplo.gpx:', pts.length, 'puntos,', (gpx.length / 1024).toFixed(0), 'KB');
