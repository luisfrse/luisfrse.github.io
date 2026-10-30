/* ============================================================
   CONFIGURACIÓN DE LA WEB
   Este es el único archivo de "ajustes". Los contenidos que vas
   añadiendo (publicaciones, divulgación, fotos…) están en la
   carpeta /data y NO requieren tocar nada más.
   ============================================================ */
window.CONFIG = {
  nombre: 'Luis Franco Serrano',
  email: 'lfranco5@xtec.cat',

  // Enlace de la sección Solidaridad
  ong: { nombre: 'Bhai Nepal', url: 'https://bhainepal.com' },

  // Redes sociales (se muestran en la portada y en el pie de todas las páginas)
  redes: [
    { nombre: 'Instagram', url: 'https://www.instagram.com/prof_luisfrse', icono: 'fa-brands fa-instagram' },
    { nombre: 'LinkedIn',  url: 'https://www.linkedin.com/in/luisfrancoserrano/', icono: 'fa-brands fa-linkedin-in' },
    { nombre: 'X (Twitter)', url: 'https://x.com/luis_fs21', icono: 'fa-brands fa-x-twitter' },
    { nombre: 'Bluesky',   url: 'https://bsky.app/profile/luisfrse.bsky.social', icono: 'fa-brands fa-bluesky' },
    { nombre: 'YouTube',   url: 'https://www.youtube.com/@skyrun21', icono: 'fa-brands fa-youtube' }
  ],

  // Formulario de contacto. Si lo dejas vacío, el botón abre tu programa de correo.
  // Para recibir los mensajes directamente: crea un formulario gratis en formspree.io
  // y pega aquí su URL, por ejemplo 'https://formspree.io/f/xxxxxxx'
  formEndpoint: '',

  // OPCIONAL: gestionar listas desde una hoja de Google Sheets (ver README.md).
  // Pega aquí la URL "Publicar en la web > CSV" de cada hoja. Vacío = se usa data/*.json
  hojas: {
    publicaciones: '',
    divulgacion: '',
    fotos: ''
  },

  // Con hojas de cálculo se suele añadir filas al final: pon true para que
  // lo más nuevo (la última fila) salga arriba.
  invertir: {
    publicaciones: false,
    divulgacion: false,
    fotos: false
  }
};
