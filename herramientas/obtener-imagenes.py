#!/usr/bin/env python3
"""Rellena el campo "imagen" de data/divulgacion.json con la imagen de portada (og:image)
de cada enlace. Solo toca las entradas que tienen "enlace" y todavía no tienen "imagen".

Uso (desde la carpeta de la web):   python herramientas/obtener-imagenes.py
Las entradas donde no se encuentra imagen se dejan igual (la web muestra una imagen por defecto).
"""
import html
import json
import re
import sys
import urllib.request
from urllib.parse import urljoin
from pathlib import Path

FICHERO = Path(__file__).resolve().parent.parent / "data" / "divulgacion.json"
AGENTES = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",  # muchos medios lo permiten
    "Twitterbot/1.0",
]
META = re.compile(r"<meta\b[^>]*>", re.I)
PROP = re.compile(r'(?:property|name)\s*=\s*["\'](og:image(?::secure_url)?|twitter:image(?::src)?)["\']', re.I)
CONT = re.compile(r'content\s*=\s*["\']([^"\']+)["\']', re.I)


def descargar(url, agente):
    req = urllib.request.Request(url, headers={"User-Agent": agente, "Accept-Language": "es,ca;q=0.8,en;q=0.5"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read(600_000).decode(r.headers.get_content_charset() or "utf-8", "replace"), r.geturl()


def buscar_imagen(url):
    for agente in AGENTES:
        try:
            pagina, final = descargar(url, agente)
        except Exception:
            continue
        og = tw = None
        for tag in META.findall(pagina):
            p, c = PROP.search(tag), CONT.search(tag)
            if p and c:
                valor = urljoin(final, html.unescape(c.group(1)).strip())
                if p.group(1).lower().startswith("og:"):
                    og = og or valor
                else:
                    tw = tw or valor
        img = og or tw
        if img and img.startswith("http"):
            return img
    return None


def main():
    texto = FICHERO.read_text(encoding="utf-8")
    json.loads(texto)  # valida antes de tocar nada
    lineas = texto.split("\n")
    nuevas = faltan = 0
    for i, linea in enumerate(lineas):
        m = re.search(r'"enlace":\s*"([^"]+)"', linea)
        if not m or '"imagen"' in linea or '"enlace": ""' in linea:
            continue
        img = buscar_imagen(m.group(1))
        if not img:
            faltan += 1
            print("  sin imagen:", m.group(1)[:90])
            continue
        # inserta el campo al final del objeto, respetando el formato de una línea por entrada
        lineas[i] = re.sub(r'\s*\}(\s*,?\s*)$', ', "imagen": %s }\\1' % json.dumps(img), linea, count=1)
        nuevas += 1
        print("  ok:", m.group(1)[:60], "->", img[:60])
    resultado = "\n".join(lineas)
    json.loads(resultado)  # comprueba que el JSON sigue siendo válido
    FICHERO.write_text(resultado, encoding="utf-8")
    print(f"\nImágenes añadidas: {nuevas} · sin imagen: {faltan}")


if __name__ == "__main__":
    sys.exit(main())
