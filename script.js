/* =========================================================
   Alcazaba Residencias · interacción
   Menú, odómetros, fichas con contraventanas, panel de la
   villa, reloj, vídeo interactivo, hipoteca, formularios
   por WhatsApp y aviso de cookies.
   ========================================================= */
(() => {
  'use strict';

  /* ===================== CONFIG ===================== */
  const CONFIG = {
    whatsapp: '34600000000',            // número sin + ni espacios
    negocio: 'Alcazaba Residencias'
  };

  const PROPIEDADES = [
    { id: 'proserpina', tipo: 'villa', titulo: 'Villa Proserpina', zona: 'Proserpina · a 9 min del centro', precio: 1250000, hab: 5, banos: 4, m2: 420, img: 'img/prop-villa.webp', tag: 'Exclusiva',
      texto: 'Villa contemporánea de dos plantas entre encinas, junto al embalse romano de Proserpina. Salón de 64 m² con ventanal de 11 metros, cocina abierta a la piscina y suite con terraza volada al poniente.',
      extras: ['Parcela de 2.400 m²', 'Piscina desbordante de agua salina', 'Aerotermia y placas solares (A)', 'Muro de granito de la comarca'] },
    { id: 'diana', tipo: 'piso', titulo: 'Ático Templo de Diana', zona: 'Centro histórico', precio: 690000, hab: 3, banos: 2, m2: 180, img: 'img/prop-atico.webp', tag: 'Vistas',
      texto: 'Ático con 90 m² de terraza a la altura de los capiteles del Templo de Diana. Pérgola de madera, piscina de inmersión y ascensor directo a la vivienda.',
      extras: ['Terraza de 90 m² con pérgola', 'Piscina de inmersión', 'Dos plazas de garaje', 'Edificio rehabilitado en 2023'] },
    { id: 'patio', tipo: 'casa', titulo: 'Casa patio Santa Eulalia', zona: 'Centro · calle Santa Eulalia', precio: 545000, hab: 4, banos: 3, m2: 260, img: 'img/prop-patio.webp', tag: 'Rehabilitada',
      texto: 'Casa tradicional emeritense alrededor de un patio con naranjos y fuente de granito. Tejas árabes recuperadas, zócalo almagra y muros de 60 cm que mantienen el fresco en agosto.',
      extras: ['Patio de 64 m² con naranjos', 'Bodega en el sótano', 'Licencia de rehabilitación integral', 'A 3 min del Teatro Romano a pie'] },
    { id: 'corchera', tipo: 'villa', titulo: 'Villa La Corchera', zona: 'La Corchera', precio: 890000, hab: 4, banos: 3, m2: 340, img: 'img/prop-corchera.webp', tag: 'Nueva',
      texto: 'Villa de una sola planta con ventanal corrido de 15 metros, pérgola de madera y piscina de 14 metros frente a un seto de cipreses.',
      extras: ['Todo en una planta', 'Piscina de 14 × 4 m', 'Casa domótica', 'Entrega en marzo de 2027'] },
    { id: 'abadias', tipo: 'finca', titulo: 'Cortijo Las Abadías', zona: 'Las Abadías · 12 ha de olivar', precio: 1480000, hab: 6, banos: 5, m2: 610, img: 'img/prop-cortijo.webp', tag: 'Finca',
      texto: 'Cortijo encalado del siglo XIX con 12 hectáreas de olivar en producción, almazara antigua y casa de guardeses. Ideal para agroturismo o residencia familiar.',
      extras: ['12 ha de olivar (1.400 olivos)', 'Pozo y balsa de riego', 'Casa de guardeses', 'Posible licencia turística'] },
    { id: 'guadiana', tipo: 'piso', titulo: 'Mirador del Guadiana', zona: 'Nueva Ciudad · frente al puente Lusitania', precio: 485000, hab: 3, banos: 2, m2: 165, img: 'img/prop-rio.webp', tag: 'Río',
      texto: 'Vivienda en planta alta con terraza corrida al Guadiana y al puente Lusitania. Urbanización con jardín, piscina y acceso directo al paseo del río.',
      extras: ['Terraza de 32 m² al río', 'Piscina comunitaria', 'Trastero y garaje', 'Calificación energética B'] }
  ];

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const miles = n => { try { return n.toLocaleString('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }); } catch { return n.toLocaleString('es-ES', { maximumFractionDigits: 0 }); } };
  const euros = n => miles(n) + ' €';
  const menosMov = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const leer = k => { try { return localStorage.getItem(k); } catch { return null; } };

  /* ===================== CABECERA Y MENÚ ===================== */
  const header = $('[data-header]');
  const menu = $('[data-menu]'), menuBtn = $('[data-menu-btn]');
  const alScroll = () => header.classList.toggle('solida', scrollY > 40);
  addEventListener('scroll', alScroll, { passive: true }); alScroll();
  menuBtn.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    menuBtn.setAttribute('aria-expanded', abierto);
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', false); } });
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('abierto')) { menu.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', false); menuBtn.focus(); } });

  requestAnimationFrame(() => document.body.classList.add('listo'));

  /* ===================== ODÓMETROS ===================== */
  // Cada cifra es una columna 0-9 que rueda hasta su valor.
  function montarOdometro(el) {
    const decimales = +(el.dataset.decimales || 0);
    const valor = parseFloat(el.dataset.odometro.replace(',', '.'));
    const texto = ((decimales ? valor.toLocaleString('es-ES', { minimumFractionDigits: decimales }) : miles(valor)) + (el.dataset.sufijo || '')).replace(/ /g, '\u00a0');
    el.setAttribute('aria-label', texto);
    el.innerHTML = '';
    [...texto].forEach((ch, i) => {
      if (/\d/.test(ch)) {
        const d = document.createElement('span'); d.className = 'dig'; d.setAttribute('aria-hidden', 'true');
        const col = document.createElement('span');
        col.innerHTML = Array.from({ length: 20 }, (_, n) => `<i>${n % 10}</i>`).join('');
        col.style.transitionDelay = (i * 70) + 'ms';
        col.dataset.objetivo = 10 + +ch;
        d.appendChild(col); el.appendChild(d);
      } else {
        const s = document.createElement('span'); s.className = 'sep'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s);
      }
    });
  }
  function rodar(el) { $$('.dig > span', el).forEach(c => { c.style.transform = `translateY(-${c.dataset.objetivo}em)`; }); }
  const ioOdo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { rodar(e.target); ioOdo.unobserve(e.target); } }), { threshold: .6 });
  $$('[data-odometro]').forEach(el => { montarOdometro(el); menosMov ? rodar(el) : ioOdo.observe(el); });

  /* ===================== REVELADOS ===================== */
  const ioRev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); ioRev.unobserve(e.target); } }), { threshold: .25 });
  $$('.interludio .wrap > *, .sec-head, .opinion, .calc__res, .pasos li').forEach(el => { el.classList.add('revelar'); ioRev.observe(el); });

  /* ===================== PROPIEDADES ===================== */
  const lista = $('[data-fichas]');
  const icono = id => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const ioFicha = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('abierta'); ioFicha.unobserve(e.target); } }), { threshold: .35 });
  let filtro = 'todas', orden = 'destacadas';

  function pintarFichas() {
    let items = PROPIEDADES.filter(p => filtro === 'todas' || p.tipo === filtro);
    if (orden === 'precio-asc') items = [...items].sort((a, b) => a.precio - b.precio);
    if (orden === 'precio-desc') items = [...items].sort((a, b) => b.precio - a.precio);
    if (orden === 'm2') items = [...items].sort((a, b) => b.m2 - a.m2);
    lista.innerHTML = items.length ? items.map(p => `
      <li class="ficha">
        <button type="button" class="ficha__btn" data-abrir="${p.id}" aria-label="Ver ficha: ${p.titulo}, ${euros(p.precio)}">
          <div class="ficha__img"><span class="ficha__tag">${p.tag}</span><img src="${p.img}" alt="${p.titulo}, ${p.zona}" width="1200" height="900" loading="lazy" decoding="async"></div>
          <div class="ficha__body">
            <p class="ficha__zona">${icono('pin')} ${p.zona}</p>
            <h3 class="ficha__titulo">${p.titulo}</h3>
            <p class="ficha__precio"><span class="odometro" data-odometro="${p.precio}" data-sufijo=" €">${euros(p.precio)}</span></p>
            <ul class="specs"><li>${icono('bed')} ${p.hab} hab.</li><li>${icono('bath')} ${p.banos} baños</li><li>${icono('area')} ${p.m2} m²</li></ul>
          </div>
        </button>
      </li>`).join('') : '<li class="fichas__vacio">No hay propiedades de este tipo ahora mismo.</li>';
    $$('.ficha', lista).forEach((f, i) => {
      const odo = $('[data-odometro]', f); montarOdometro(odo);
      if (menosMov) { f.classList.add('abierta'); rodar(odo); }
      else { f.style.transitionDelay = (i % 3) * 90 + 'ms'; ioFicha.observe(f); ioOdo.observe(odo); }
    });
  }
  function cambiar(fn) {
    const fichas = $$('.ficha', lista);
    if (menosMov || !fichas.length) { fn(); pintarFichas(); return; }
    fichas.forEach(f => f.classList.add('saliendo'));
    setTimeout(() => { fn(); pintarFichas(); }, 280);
  }
  $$('[data-filtro]').forEach(b => b.addEventListener('click', () => cambiar(() => {
    filtro = b.dataset.filtro;
    $$('[data-filtro]').forEach(x => { x.classList.toggle('activo', x === b); x.setAttribute('aria-pressed', x === b); });
  })));
  $('[data-orden]').addEventListener('change', e => cambiar(() => { orden = e.target.value; }));
  pintarFichas();

  // select de la visita
  const selProp = $('[data-select-propiedad]');
  selProp.innerHTML = PROPIEDADES.map(p => `<option>${p.titulo}</option>`).join('') + '<option>Estudio hipotecario</option><option>Otra / aún no lo sé</option>';
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-visita]');
    if (a) selProp.value = a.dataset.visita;
  });

  /* ---------- ficha ampliada ---------- */
  const dlg = $('[data-dialog]');
  lista.addEventListener('click', e => {
    const b = e.target.closest('[data-abrir]'); if (!b) return;
    const p = PROPIEDADES.find(x => x.id === b.dataset.abrir);
    $('[data-dlg-img]').src = p.img; $('[data-dlg-img]').alt = p.titulo;
    $('[data-dlg-zona]').textContent = p.zona;
    $('[data-dlg-titulo]').textContent = p.titulo;
    $('[data-dlg-precio]').textContent = euros(p.precio);
    $('[data-dlg-specs]').innerHTML = `<li>${icono('bed')} ${p.hab} dormitorios</li><li>${icono('bath')} ${p.banos} baños</li><li>${icono('area')} ${p.m2} m²</li>`;
    $('[data-dlg-texto]').textContent = p.texto;
    $('[data-dlg-extras]').innerHTML = p.extras.map(x => `<li>${x}</li>`).join('');
    $('[data-dlg-visita]').dataset.visita = p.titulo;
    dlg.showModal();
  });
  $('[data-cerrar]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-dlg-visita]')) dlg.close(); });

  /* ===================== RELOJ Y PANEL DE LA VILLA ===================== */
  const hhmm = h => { const m = Math.round(h * 60) % 1440; return String(m / 60 | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const reloj = $('[data-reloj]'), rHora = $('[data-reloj-hora]'), rBarra = $('[data-reloj-barra]'), rIcono = $('[data-reloj-icono]');
  const horaCtl = $('[data-hora-ctl]'), horaOut = $('[data-hora-out]');
  let ultimaHora = -1;
  document.addEventListener('escena:hora', e => {
    const h = e.detail;
    if (Math.abs(h - ultimaHora) < .01) return;
    ultimaHora = h;
    rHora.textContent = hhmm(h);
    rBarra.style.width = ((h - 6.5) / (23 - 6.5) * 100).toFixed(1) + '%';
    rIcono.setAttribute('href', h > 20.3 || h < 6.8 ? '#i-moon' : '#i-sun');
    if (document.activeElement !== horaCtl && !horaCtl.dataset.manual) { horaCtl.value = h; horaOut.textContent = hhmm(h); }
  });
  // ocultar el reloj sobre el pie
  new IntersectionObserver(([e]) => reloj.classList.toggle('oculto', e.isIntersecting)).observe($('.footer'));

  horaCtl.addEventListener('input', () => {
    horaCtl.dataset.manual = '1';
    horaOut.textContent = hhmm(+horaCtl.value);
    window.ESCENA_API?.setHora(+horaCtl.value);
  });
  const panelInfo = $('[data-panel-info]'), verTodo = $('[data-ver-todo]');
  const infoInicial = panelInfo.innerHTML;
  const zonaVilla = $('[data-interactivo]');
  zonaVilla.addEventListener('escena:foco', e => {
    const p = e.detail;
    panelInfo.classList.add('cambiando');
    setTimeout(() => {
      panelInfo.innerHTML = p ? `<p><strong>${p.titulo}</strong>${p.texto}</p>` : infoInicial;
      panelInfo.classList.remove('cambiando');
    }, 200);
    verTodo.hidden = !p;
    if (!p) delete horaCtl.dataset.manual;
  });
  verTodo.addEventListener('click', () => window.ESCENA_API?.enfocar(null));

  /* ===================== VÍDEO INTERACTIVO ===================== */
  const player = $('[data-player]'), video = $('[data-video]');
  const capas = $('[data-hotspots]'), eleccion = $('[data-eleccion]'), tarjeta = $('[data-tarjeta]');
  const prog = $('[data-progreso]'), relleno = $('[data-progreso-relleno]'), tiempo = $('[data-tiempo]');
  const btnPlay = $('[data-play]'), btnGrande = $('[data-play-grande]');
  const CAPITULOS = { llegada: 0, piscina: 6, terraza: 12, noche: 18 };
  // puntos que aparecen en el vídeo: desde, hasta (segundos) y posición en % del encuadre
  const HOTSPOTS = [
    { d: 1.6, h: 5.4, x: 59, y: 63, t: 'Muro de granito', txt: 'Sillares de granito de la comarca, la piedra de los monumentos de Mérida. Cierra la parcela por el este.' },
    { d: 7, h: 11.6, x: 56, y: 60, t: 'Piscina desbordante', txt: '12 × 3,5 metros de agua salina, iluminación LED y una lámina que se funde con la dehesa.' },
    { d: 13.2, h: 17.6, x: 48, y: 52, t: 'Suite principal', txt: 'Dormitorio de 38 m² con vestidor, baño en granito pulido y terraza volada de 28 m² al poniente.' },
    { d: 19, h: 23.6, x: 50, y: 55, t: 'Casa encendida', txt: 'Domótica con 40 puntos de luz, escenas de iluminación y riego programado desde el móvil.' }
  ];
  const DECISION = 5.7;
  let decidido = false;
  const botonesHS = HOTSPOTS.map(hs => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hotspot';
    b.innerHTML = '<span class="punto__dot" aria-hidden="true"></span><span>' + hs.t + '</span>';
    b.addEventListener('click', () => { video.pause(); $('[data-tarjeta-tit]').textContent = hs.t; $('[data-tarjeta-txt]').textContent = hs.txt; tarjeta.hidden = false; $('[data-seguir]').focus(); });
    capas.appendChild(b);
    return b;
  });
  // coloca los puntos teniendo en cuenta el recorte del vídeo (object-fit: cover)
  function colocarHS() {
    const w = player.clientWidth, h = player.clientHeight;
    const k = Math.max(w / 1280, h / 720), dw = 1280 * k, dh = 720 * k;
    HOTSPOTS.forEach((hs, i) => {
      botonesHS[i].style.left = ((w - dw) / 2 + hs.x / 100 * dw) + 'px';
      botonesHS[i].style.top = ((h - dh) / 2 + hs.y / 100 * dh) + 'px';
    });
  }
  colocarHS(); addEventListener('resize', colocarHS);
  const mmss = s => (s / 60 | 0) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function jugar() { tarjeta.hidden = true; eleccion.hidden = true; video.play().catch(() => {}); }
  function ir(t, seguir = true) { video.currentTime = t; decidido = t >= DECISION; if (seguir) jugar(); }
  video.addEventListener('loadedmetadata', () => {
    Object.values(CAPITULOS).forEach(t => { if (t) { const i = document.createElement('i'); i.style.left = (t / video.duration * 100) + '%'; prog.appendChild(i); } });
  });
  video.addEventListener('play', () => { player.classList.add('reproduciendo'); btnPlay.innerHTML = icono('pause'); btnPlay.setAttribute('aria-label', 'Pausar'); });
  video.addEventListener('pause', () => { btnPlay.innerHTML = icono('play'); btnPlay.setAttribute('aria-label', 'Reproducir'); });
  video.addEventListener('ended', () => player.classList.remove('reproduciendo'));
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime, d = video.duration || 24;
    relleno.style.width = (t / d * 100) + '%';
    prog.setAttribute('aria-valuenow', Math.round(t / d * 100));
    tiempo.textContent = mmss(t);
    HOTSPOTS.forEach((hs, i) => botonesHS[i].classList.toggle('visible', t >= hs.d && t <= hs.h));
    $$('[data-cap]').forEach(b => { const c = +b.dataset.cap; b.classList.toggle('activo', t >= c && t < c + 6); });
    if (!decidido && t >= DECISION && t < DECISION + .6) { decidido = true; video.pause(); eleccion.hidden = false; }
  });
  btnPlay.addEventListener('click', () => video.paused ? jugar() : video.pause());
  btnGrande.addEventListener('click', jugar);
  video.addEventListener('click', () => video.paused ? jugar() : video.pause());
  $('[data-seguir]').addEventListener('click', jugar);
  $$('[data-ir]').forEach(b => b.addEventListener('click', () => ir(CAPITULOS[b.dataset.ir])));
  $$('[data-cap]').forEach(b => b.addEventListener('click', () => ir(+b.dataset.cap)));
  prog.addEventListener('click', e => { const r = prog.getBoundingClientRect(); ir((e.clientX - r.left) / r.width * (video.duration || 24), !video.paused); });
  prog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { video.currentTime = Math.min(video.duration, video.currentTime + 2); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { video.currentTime = Math.max(0, video.currentTime - 2); decidido = video.currentTime >= DECISION; e.preventDefault(); }
  });
  // pausa al salir de pantalla
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && !video.paused) video.pause(); }, { threshold: .2 }).observe(player);

  /* ===================== HIPOTECA ===================== */
  const calc = $('[data-calc]');
  function calcular() {
    const f = Object.fromEntries([...new FormData(calc)].map(([k, v]) => [k, +v]));
    const prestamo = f.precio * (1 - f.entrada / 100);
    const n = f.anos * 12, i = f.interes / 100 / 12;
    const cuota = prestamo * i / (1 - Math.pow(1 + i, -n));
    $('[data-out="precio"]').textContent = euros(f.precio);
    $('[data-out="entrada"]').textContent = f.entrada + ' % · ' + euros(f.precio * f.entrada / 100);
    $('[data-out="anos"]').textContent = f.anos + ' años';
    $('[data-out="interes"]').textContent = f.interes.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' %';
    $('[data-cuota]').textContent = miles(Math.round(cuota));
    $('[data-res="prestamo"]').textContent = euros(prestamo);
    $('[data-res="gastos"]').textContent = euros(f.precio * .1);
    $('[data-res="intereses"]').textContent = euros(cuota * n - prestamo);
  }
  calc.addEventListener('input', calcular); calcular();

  /* ===================== FORMULARIOS → WHATSAPP ===================== */
  function enviar(form, mensaje) {
    const msg = $('[data-msg]', form);
    const invalido = $$('[required]', form).find(el => el.type === 'checkbox' ? !el.checked : !el.value.trim());
    if (invalido) {
      msg.textContent = invalido.type === 'checkbox' ? 'Acepta la política de privacidad para continuar.' : 'Completa todos los campos.';
      msg.classList.add('error'); invalido.focus(); return;
    }
    msg.classList.remove('error');
    msg.textContent = 'Abriendo WhatsApp con tu mensaje…';
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje(new FormData(form)))}`, '_blank', 'noopener');
  }
  $('[data-valoracion]').addEventListener('submit', e => {
    e.preventDefault();
    enviar(e.target, d => `Hola, ${CONFIG.negocio}. Quiero una valoración gratuita.\n· Tipo: ${d.get('tipo')}\n· Zona: ${d.get('zona')}\n· Metros: ${d.get('m2')} m²\n· Teléfono: ${d.get('tel')}`);
  });
  $('[data-visita-form]').addEventListener('submit', e => {
    e.preventDefault();
    enviar(e.target, d => `Hola, ${CONFIG.negocio}. Soy ${d.get('nombre')} y quiero visitar: ${d.get('propiedad')}.\n· Cuándo: ${d.get('cuando')}`);
  });

  /* ===================== COOKIES ===================== */
  const aviso = $('[data-cookies]');
  if (!leer('alcazaba-cookies')) setTimeout(() => { aviso.hidden = false; }, 1800);
  $('[data-cookies-ok]').addEventListener('click', () => { guardar('alcazaba-cookies', 'ok'); aviso.hidden = true; });
  $('[data-cookies-abrir]').addEventListener('click', () => { aviso.hidden = false; });
})();
