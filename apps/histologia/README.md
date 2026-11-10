# Quiz de histología y citología

Aplicación estática (HTML + CSS + JS, sin servidor) para aprender a reconocer tejidos, órganos, tinciones,
células de la sangre, citología y anatomía patológica. Funciona en castellano, catalán e inglés y comparte el
idioma con el resto de la web.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página (carga el kit común `../shared/`) |
| `histologia.js` / `histologia.css` | Lógica y estilos de la aplicación |
| `data/imagenes.json` | **Todos los datos**: categorías, tinciones e imágenes |
| `img/` | Imágenes a tamaño de visor (≤ 1400 px, JPEG) |
| `img/min/` | Miniaturas para la galería (≈ 480 px) |

Lo que el usuario guarda (mejores resultados, estadísticas, imágenes falladas, ajustes) se queda en su navegador
(`localStorage`, clave `histologia:*`). No se envía nada a ningún servidor.

## Añadir tus propias imágenes (por ejemplo, de las prácticas)

1. Copia la foto a `img/` (JPEG, hasta ~1400 px de ancho; para la miniatura, una copia de ~480 px en `img/min/`).
2. Añade un bloque a `imagenes` en `data/imagenes.json`:

```json
{
  "id": "mi-higado-1",
  "archivo": "img/mi-higado-1.jpg",
  "miniatura": "img/min/mi-higado-1.jpg",
  "categoria": "organos",
  "grupo": "glandula",
  "tincion": "he",
  "aumento": "100×",
  "dificultad": 1,
  "nombre": { "es": "Hígado", "ca": "Fetge", "en": "Liver" },
  "alias":  { "es": ["Lobulillo hepático"], "ca": [], "en": ["Hepatic lobule"] },
  "rasgos": {
    "es": ["Hepatocitos en cordones", "Espacio porta con tríada"],
    "ca": ["Hepatòcits en cordons", "Espai porta amb tríada"],
    "en": ["Hepatocytes in cords", "Portal tract with triad"]
  },
  "autor": "Tu nombre",
  "licencia": "CC BY 4.0",
  "licurl": "https://creativecommons.org/licenses/by/4.0/",
  "origen": "https://tu-web.es"
}
```

* `categoria`: uno de los `id` de `categorias` (epitelios, conectivo, muscular-nervioso, organos, linfoide,
  tinciones, hematologia, citologia, patologia, microbiologia).
* `tincion`: una clave de `tinciones` (`he`, `pas`, `masson`, `giemsa`, `pap`…). Si no la conoces, omítela y no se
  harán preguntas de tinción para esa imagen. Para una tinción nueva, añade su clave a `tinciones` con los tres
  idiomas.
* `grupo`: opcional; las imágenes del mismo grupo se usan como distractores unas de otras (más difícil).
* `dificultad`: 1 (básico), 2 (medio) o 3 (difícil).
* `rasgos`: 2–4 frases por idioma, **con el mismo número en los tres idiomas**. Sirven de explicación y de
  preguntas «¿qué afirmación describe esta imagen?», así que deben ser específicas de esa imagen.
* `alias`: otros nombres que se aceptan en la respuesta escrita.
* Un error de coma o comilla en el JSON hace que la aplicación no cargue: valídalo en jsonlint.com.

### Solo para una sesión

En la pantalla de inicio, «Mis imágenes (solo esta sesión)» permite cargar fotos del equipo sin tocar el JSON.
No se suben a ningún sitio y desaparecen al cerrar la página.

## Licencias de las imágenes

Todas las imágenes incluidas proceden de Wikimedia Commons con licencia abierta (dominio público, CC0, CC BY o
CC BY-SA). La aplicación muestra siempre el autor, la licencia y el enlace de origen de cada imagen, y tiene una
pantalla «Créditos» con la lista completa. Si añades imágenes de otras fuentes, comprueba su licencia y rellena
`autor`, `licencia` y `origen`.

## Probar en local

```
python -m http.server 8000
```

y abre <http://localhost:8000/apps/histologia/> (abrir el HTML con doble clic no funciona: el navegador bloquea
la carga del JSON).
