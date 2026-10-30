# Web personal · Luis Franco Serrano

Web estática (HTML + CSS + JS, sin instalar nada). Los contenidos que cambian con frecuencia
están separados en la carpeta `data/`, así que **para añadir un artículo, una entrevista o una foto
solo editas un archivo pequeño; no hay que tocar ni volver a subir el resto de la web.**

## Estructura

| Quiero… | Edito… |
|---|---|
| Añadir un artículo científico | `data/publicaciones.json` |
| Añadir un artículo de divulgación / audio / entrevista | `data/divulgacion.json` |
| Subir una foto | copio la imagen a `fotos/` y añado una línea en `data/fotos.json` |
| Añadir una aplicación | `data/aplicaciones.json` |
| Cambiar asignaturas, FP o cursos | `data/docencia.json` |
| Cambiar mis líneas de investigación | `data/investigacion.json` |
| Cambiar redes sociales, correo, enlace de la ONG | `js/config.js` |
| Cambiar colores | variables al inicio de `css/style.css` |
| Poner mi foto en «Sobre mí» | guardar `assets/foto-perfil.jpg` |
| Cambiar la imagen de portada | sustituir `assets/portada.jpg` (si no existe, se ve solo la animación de nodos) |

Lo más nuevo va **arriba** de cada lista.

### Ejemplos (copiar y pegar, separando con comas)

Publicación:
```json
{ "titulo": "Título del artículo", "anio": "2026", "revista": "Nombre de la revista", "enlace": "https://doi.org/..." }
```
Divulgación (`tipo`: articulo, radio, prensa, entrevista, podcast, video). `audio` y `imagen` son opcionales
(`audio` muestra un reproductor con un enlace directo a un .mp3):
```json
{ "tipo": "radio", "medio": "Onda Cero", "fecha": "2026-10-30", "titulo": "Título", "resumen": "Breve texto", "enlace": "https://...", "audio": "https://.../audio.mp3" }
```
Foto:
```json
{ "src": "fotos/cresta-1.jpg", "titulo": "Cresta al amanecer", "frase": "Una frase corta", "lugar": "Pirineos", "fecha": "2026-08" }
```
Un error de coma o comilla en un JSON hace que esa sección no cargue: se puede validar en jsonlint.com.

## Fotos
Se cargan solo al hacer scroll (`loading="lazy"`), así que no ralentizan la web. Antes de subirlas,
redúcelas a ~2000 px de ancho y calidad 80 % (unos 300-600 KB cada una). Google Fotos **no** sirve para
enlazar directamente imágenes de forma estable; guárdalas en la carpeta `fotos/`.

## Publicar gratis y actualizar sin resubir todo (GitHub Pages)
1. Crea una cuenta en github.com y un repositorio público nuevo (p. ej. `web`).
2. «Add file → Upload files» y arrastra **el contenido** de esta carpeta (`index.html`, `css`, `js`, `data`, `assets`, `fotos`).
3. «Settings → Pages → Deploy from a branch → main / (root)». En un minuto la web queda online.
4. Para actualizar: entra en el archivo (p. ej. `data/divulgacion.json`), pulsa el lápiz ✏️, pega la nueva línea
   y «Commit changes». Para una foto: «Add file → Upload files» dentro de `fotos/`. Solo cambia ese archivo.
5. Dominio propio (opcional): «Settings → Pages → Custom domain».

Alternativas equivalentes: Cloudflare Pages o Netlify conectados al repositorio de GitHub.
(Si en Netlify arrastras la carpeta a mano, tendrías que volver a subirla entera en cada cambio.)

## Opción aún más cómoda: gestionar listas desde Google Sheets
Con esto, añadir una entrada es escribir una fila en una hoja.
1. Crea una hoja con la fila 1 de cabeceras **en minúsculas y sin tildes**:
   - publicaciones: `titulo, anio, revista, autores, enlace`
   - divulgacion: `tipo, medio, fecha, titulo, resumen, enlace, audio, imagen`
   - fotos: `src, titulo, frase, lugar, fecha`
2. «Archivo → Compartir → Publicar en la web», elige la pestaña, formato **CSV**, y copia la URL.
3. Pégala en `js/config.js` (`hojas`). Si añades filas al final, pon `invertir: true` para esa sección.
4. Si la hoja falla, la web usa automáticamente `data/*.json`.

## Formulario de contacto
Sin configuración, el botón abre el programa de correo con el mensaje. Para recibirlos directamente,
crea un formulario en formspree.io y pega su URL en `formEndpoint` (`js/config.js`).

## Probar en local
Los navegadores bloquean la carga de datos si abres `index.html` con doble clic. Desde esta carpeta:
`python3 -m http.server 8000` y abre http://localhost:8000

## Páginas de asignatura (Docencia)
Cada tarjeta de `data/docencia.json` enlaza sola a su propia página (`#/docencia/<bloque>/<id>`).
El `<id>` sale del título sin tildes ni espacios (p. ej. «Bioquímica y Metabolismo» → `bioquimica-y-metabolismo`).
Campos opcionales de cada asignatura, curso o ciclo:
```json
{
  "titulo": "Fisiología",
  "icono": "fa-solid fa-heart-pulse",
  "descripcion": "Texto breve que sale en la tarjeta y al inicio de la página.",
  "texto": ["Párrafo 1 de la página.", "Párrafo 2."],
  "temas": ["Tema 1", "Tema 2"],
  "recursos": [ { "titulo": "Apuntes en PDF", "enlace": "https://..." } ]
}
```
Si no hay contenido, la página muestra «Contenido próximamente». Si pones `"enlace"`, la tarjeta va a ese enlace en lugar de a su página.
