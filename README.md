# Alcazaba Residencias · web inmobiliaria 3D (concepto)

Web de una inmobiliaria **ficticia** de viviendas exclusivas en Mérida (Badajoz). Es una demo de la tarifa *Web interactiva 3D* del portfolio: una villa en 3D cuyo sol recorre el día mientras bajas por la página, del amanecer a la noche, con el acueducto de Los Milagros al fondo.

Web publicada (cuando se active GitHub Pages): https://danielduranmoya-spec.github.io/web-demo-inmobiliaria/

```
web-demo-inmobiliaria/
├── index.html        ← estructura, textos, SEO (metadatos, Open Graph, JSON-LD)
├── style.css         ← estilos: colores, tipografías y espaciado al principio, en :root
├── script.js         ← fichas, filtros, odómetros, panel de la villa, vídeo interactivo, hipoteca, formularios, cookies
├── escena.js         ← escena 3D con three.js: villa, dehesa, acueducto, cielo y ciclo del día
├── img/              ← fotos de las fichas, imagen sin 3D e imagen para redes (renders de la propia escena)
├── video/            ← recorrido de la villa (vídeo interactivo) y su póster
├── aviso-legal.html · privacidad.html · cookies.html   ← plantillas: completa los campos [PENDIENTE]
├── robots.txt · sitemap.xml
└── favicon.svg
```

## Qué hace

1. **Un día en la villa.** La escena 3D está fija detrás de la página. Las secciones transparentes son ventanas a ella y cada una marca una hora y una vista de cámara (`data-hora` y `data-vista` en el HTML). Entre dos ventanas, la hora y la cámara se mezclan con el scroll: amanecer en el inicio, mediodía cenital, tarde en la villa, atardecer sobre el acueducto y noche con la casa encendida en el contacto. Un reloj en la esquina marca la hora.
2. **Villa interactiva.** En la sección «Villa 3D» la casa se gira arrastrando, cuatro puntos llevan la cámara al salón, la piscina, la suite y el muro de granito, y un control deja verla a cualquier hora.
3. **Contraventanas.** Las fotos de las fichas aparecen tras dos hojas de lamas que se abren al entrar en pantalla, y los precios y las cifras ruedan como un odómetro.
4. **Vídeo interactivo.** Capítulos, puntos que aparecen en el vídeo y abren una tarjeta, y una elección a los 6 segundos: piscina o suite.
5. **Hipoteca y formularios.** Calculadora con sistema francés. La valoración y la visita preparan un mensaje de WhatsApp (no hay servidor).

Animación de referencia: plantilla *Zenith Realty* de motionsites.ai (landing inmobiliaria), reinterpretada y programada a mano.

## La escena 3D

- Todo se genera con código (no hay modelos que descargar): villa, olivos, cipreses, encinas instanciadas, piscina, colinas, acueducto, estrellas y luna.
- Cielo con shader propio. La paleta de cada hora está en `DIA` dentro de `escena.js`.
- Las fotos de las fichas son la misma escena con otras casas: `escena.js?render=1&variante=atico` (también `patio`, `corchera`, `cortijo`, `rio`). Con `?render=1` la escena se queda quieta y expone `window.ESCENA` para sacar fotogramas.
- En vertical la cámara se aleja para que quepa la casa. Si el móvil va lento, baja la resolución sola. Con *movimiento reducido* la cámara salta sin desplazarse. **Sin WebGL** se muestra una imagen fija de la villa y el resto de la web funciona igual.

## Abrirla en VS Code

```bash
git clone https://github.com/danielduranmoya-spec/web-demo-inmobiliaria.git
code web-demo-inmobiliaria
```

Usa la extensión **Live Server** (clic derecho en `index.html` → *Open with Live Server*). La escena 3D es un módulo de JavaScript y los navegadores no lo cargan con doble clic (`file://`).

## Qué cambiar para un cliente real

- **Teléfono y WhatsApp**: `CONFIG` al principio de `script.js`, el JSON-LD del `<head>` y los datos del contacto.
- **Propiedades**: `PROPIEDADES` en `script.js` (texto, precio, metros, foto).
- **Horas y vistas del scroll**: atributos `data-hora` y `data-vista` de las secciones; las vistas están en `VISTAS` de `escena.js`.
- **Puntos de la villa**: `PUNTOS` en `escena.js`. **Puntos del vídeo**: `HOTSPOTS` en `script.js` (posición en % del encuadre de 1280 × 720).
- **Colores**: variables de `:root` en `style.css`.
- **SEO**: quita `<meta name="robots" content="noindex, nofollow">` de `index.html` y cambia `robots.txt` a `Allow: /`. La demo no se indexa porque el negocio es ficticio.
- **Barra «Concepto»**: bórrala (`.concept-bar`).

## Privacidad y cookies

Sin cookies de análisis ni publicidad. Solo se guarda en `localStorage` (`alcazaba-cookies`) que se ha cerrado el aviso. Servicios externos: three.js desde jsDelivr (versión fijada 0.186.1) y las tipografías Cinzel y Outfit desde Google Fonts.

## Publicar

GitHub Pages desde la rama `main` (carpeta raíz). Cada `git push` a `main` actualiza la web en uno o dos minutos.
