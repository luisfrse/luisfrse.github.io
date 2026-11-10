# Orden de pasos

Aplicación estática (HTML + CSS + JS, sin servidor) para practicar el orden correcto de:

1. Lavado de manos con agua y jabón (OMS, 40–60 s)
2. Higiene de manos con solución hidroalcohólica (OMS, 20–30 s)
3. Colocación del EPI
4. Retirada del EPI
5. Los 5 momentos de la higiene de manos (emparejar situación ↔ momento)

Modos: **Consulta** (con porqué y errores frecuentes y cartel A4 imprimible), **Ordenar** (arrastrar, flechas o teclado), **Siguiente paso**, **Prueba** cronometrada (mejor puntuación guardada en el navegador) y **Guía** (con cronómetro y ritmo rápido/normal/lento en el lavado de manos; paso a paso manual en el EPI). Para los 5 momentos: **Consulta**, **Practicar** (con explicación) y **Prueba**.

Está en castellano, catalán e inglés y comparte el idioma con el resto de la web.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `pasos.css`, `pasos.js` | La aplicación |
| `data/secuencias.json` | **Todo el contenido** (pasos, textos, tiempos) en 3 idiomas |
| `img/*.svg` | Ilustraciones propias (una por paso, más las portadas) |

Para probarla en local: `python -m http.server 8000` desde la raíz del repositorio y abrir `http://localhost:8000/apps/pasos/`. (Con doble clic en `index.html` el navegador bloquea la carga del JSON.)

## Cambiar el contenido: `data/secuencias.json`

Cada texto va en tres idiomas: `{ "es": "…", "ca": "…", "en": "…" }`. Si falta un idioma se usa el castellano.

Secuencia de pasos (`"type": "order"`):

```json
{
  "id": "retirada", "type": "order", "cover": "cover-retirada",
  "durationSec": null, "baseSec": 0,
  "title": {…}, "subtitle": {…}, "source": {…}, "note": {…}, "finish": {…},
  "steps": [
    { "id": "guantes", "img": "epi-r1-guantes", "seconds": 0,
      "title": {…}, "text": {…}, "why": {…}, "mistake": {…} }
  ]
}
```

- El **orden del archivo es el orden correcto**: la app lo mezcla sola.
- `img` es el nombre del SVG de `img/` sin la extensión.
- Para que la **Guía** lleve cronómetro, pon `"durationSec": [mínimo, máximo]` y `"baseSec"` (la duración «normal») y `"seconds"` en cada paso; la suma de `seconds` debe ser `baseSec`. Con `baseSec: 0` la guía es manual.
- Los **5 momentos** usan `"type": "match"` con `moments` (5 momentos con `examples`, `why`) y `situations` (`moment` = 1–5 + `text`). Añade situaciones copiando una de las existentes.
- Para **añadir una secuencia nueva**, copia una entrada de `sequences` y cambia `id` y los textos.

Un error de coma o comilla hace que no cargue nada: valida el archivo en jsonlint.com antes de subirlo.

## Imágenes

Las ilustraciones son SVG propios (estilo plano, paleta de la web, formato 320 × 240, relación 4:3). Para cambiar una, sustituye el archivo de `img/` manteniendo el nombre. Si prefieres fotografías reales (por ejemplo de tus propias prácticas), guárdalas como `.jpg`; hoy `pasos.js` espera `.svg` (función `img`), así que habría que cambiar allí la extensión.

## Fuentes y aviso

- Higiene de manos y 5 momentos: OMS, *Directrices de la OMS sobre higiene de las manos en la atención de la salud* (2009) y sus carteles «Cómo lavarse las manos», «Cómo desinfectarse las manos» y «Sus 5 momentos para la higiene de las manos».
- EPI: secuencias basadas en las de los CDC (EE. UU.) para la colocación y la retirada del equipo de protección individual, coherentes con las recomendaciones de la OMS.
- Los protocolos de EPI varían entre centros y niveles de riesgo (por ejemplo, si se retiran bata y guantes juntos o si se hace higiene de manos tras cada pieza). La app avisa de ello; adapta `secuencias.json` al protocolo de tu centro.
- Herramienta didáctica: no sustituye el protocolo del centro ni la formación acreditada.

## Datos que guarda

Solo en el navegador (`localStorage`, clave `pasos:*`): mejores puntuaciones y opciones (imágenes/texto, sonido, voz, ritmo). No se envía nada a ningún servidor.
