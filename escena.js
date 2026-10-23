/* =========================================================
   Alcazaba Residencias · escena 3D (three.js r186)

   - La villa, los olivos, la dehesa y el acueducto de
     Los Milagros se generan con código: no se descarga
     ningún modelo.
   - El sol recorre el día según el scroll. Cada elemento
     [data-escena] del HTML marca una hora (data-hora) y una
     vista de cámara (data-vista). Entre dos elementos, la hora
     y la cámara se mezclan.
   - En la sección [data-interactivo] la casa se puede girar
     arrastrando, tiene puntos que llevan la cámara a cada
     estancia y un control para elegir la hora.
   - ?render=1 deja la escena quieta y expone window.ESCENA
     para sacar fotogramas (fotos de las fichas y vídeos).
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ===================== CONFIG ===================== */
const PARAMS = new URLSearchParams(location.search);
const RENDER = PARAMS.has('render');
const VARIANTE = PARAMS.get('variante') || 'villa';
const MOVIL = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const MENOS_MOV = matchMedia('(prefers-reduced-motion: reduce)').matches;

const C = {
  cal: 0xf3eee6, calSombra: 0xe7dfd3, granito: 0x8d8a85, granitoOsc: 0x5f5d5a,
  madera: 0x8a5a3b, teja: 0xb8643f, arcilla: 0xc8795a, olivo: 0x7f8c66,
  encina: 0x3f4a2f, cipres: 0x34432d, cesped: 0x7c8d55, pasto: 0xc2ad78,
  ladrillo: 0x9b4e35, agua: 0x3f97ad
};

// Vistas de cámara: posición y punto al que mira (metros; la villa está en el centro).
const VISTAS = {
  hero:      { pos: [23, 7.5, 27],  mira: [0, 3, 0] },
  piscina:   { pos: [-15, 2.4, 15], mira: [-3, 1.4, 2] },
  aerea:     { pos: [2, 36, 24],    mira: [0, 0, 0] },
  terraza:   { pos: [13, 9.5, 10],  mira: [2.5, 5.2, -1] },
  acueducto: { pos: [17, 2.6, 15],  mira: [-150, 14, -40] },
  noche:     { pos: [19, 4.2, 21],  mira: [0, 2.6, 0] },
  villa:     { pos: [20, 8, 22],    mira: [0, 2.8, 0] }
};

// Puntos interactivos de la sección «La villa».
const PUNTOS = [
  { id: 'salon',   p: [1.5, 1.7, 4.2],   vista: { pos: [5, 2.2, 13], mira: [1, 1.6, 2] },     titulo: 'Salón de 64 m²', texto: 'Ventanal corredero de 11 metros que desaparece en la pared. Suelo radiante.' },
  { id: 'piscina', p: [-6, 0.4, 7.5],    vista: VISTAS.piscina,                                 titulo: 'Piscina desbordante', texto: '12 × 3,5 m, agua salina y lámina que se funde con la dehesa.' },
  { id: 'suite',   p: [3.5, 4.8, 3.7],   vista: VISTAS.terraza,                                 titulo: 'Suite principal', texto: 'Terraza volada de 28 m² orientada al poniente, con lamas de iroko.' },
  { id: 'granito', p: [9.5, 0.7, 8.5],   vista: { pos: [17, 2.2, 15], mira: [8, 0.8, 6] },     titulo: 'Muro de granito', texto: 'Piedra de las canteras de la comarca, la misma de los monumentos de Mérida.' }
];

/* ===================== UTILIDADES ===================== */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => Math.min(1, Math.max(0, v));
const suave = t => t * t * (3 - 2 * t);
let semilla = 7;
const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;

function lienzo(w, h, pintar) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const texGranito = lienzo(256, 256, (g, w, h) => {
  g.fillStyle = '#8f8b86'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5000; i++) {
    const v = 90 + azar() * 110 | 0;
    g.fillStyle = `rgba(${v},${v - 4},${v - 8},${.35 + azar() * .5})`;
    g.fillRect(azar() * w, azar() * h, 1 + azar() * 2.5, 1 + azar() * 2.5);
  }
  g.strokeStyle = 'rgba(40,38,36,.45)'; g.lineWidth = 2;
  for (let y = 0; y < h; y += 32) {            // sillares
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    const off = (y / 32) % 2 ? 0 : 40;
    for (let x = off; x < w; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
  }
});
const texTeja = lienzo(128, 128, (g, w, h) => {
  g.fillStyle = '#b8643f'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) {
    const grad = g.createLinearGradient(x, 0, x + 16, 0);
    grad.addColorStop(0, 'rgba(70,25,10,.35)'); grad.addColorStop(.5, 'rgba(255,200,160,.18)'); grad.addColorStop(1, 'rgba(70,25,10,.35)');
    g.fillStyle = grad; g.fillRect(x, 0, 16, h);
  }
  for (let y = 0; y < h; y += 21) { g.fillStyle = 'rgba(50,20,8,.3)'; g.fillRect(0, y, w, 3); }
});
const texSuelo = lienzo(512, 512, (g, w, h) => {
  const grad = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
  grad.addColorStop(0, '#7c8d55'); grad.addColorStop(.055, '#7c8d55'); grad.addColorStop(.1, '#c4a46c'); grad.addColorStop(1, '#d1ad72');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${azar() > .5 ? '90,80,40' : '235,220,170'},${azar() * .25})`;
    g.fillRect(azar() * w, azar() * h, 1.5, 1.5);
  }
});
texSuelo.wrapS = texSuelo.wrapT = THREE.ClampToEdgeWrapping;
const texAguaNormal = (() => {
  const t = lienzo(256, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = Math.sin(x / w * Math.PI * 8 + Math.sin(y / h * Math.PI * 6) * 1.5);
      const b = Math.cos(y / h * Math.PI * 10 + Math.cos(x / w * Math.PI * 4) * 1.2);
      const i = (y * w + x) * 4;
      img.data[i] = 128 + a * 40; img.data[i + 1] = 128 + b * 40; img.data[i + 2] = 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  t.colorSpace = THREE.NoColorSpace;
  return t;
})();

/* ===================== MATERIALES ===================== */
const M = {
  cal: new THREE.MeshStandardMaterial({ color: C.cal, roughness: .92 }),
  calSombra: new THREE.MeshStandardMaterial({ color: C.calSombra, roughness: .95 }),
  granito: new THREE.MeshStandardMaterial({ map: texGranito, roughness: .85 }),
  pavimento: new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: .8 }),
  madera: new THREE.MeshStandardMaterial({ color: C.madera, roughness: .7 }),
  teja: new THREE.MeshStandardMaterial({ map: texTeja, roughness: .8 }),
  arcilla: new THREE.MeshStandardMaterial({ color: C.arcilla, roughness: .85 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: .45, metalness: .6 }),
  vidrio: new THREE.MeshStandardMaterial({ color: 0x5d7a8a, roughness: .05, metalness: .55, emissive: 0xffb36b, emissiveIntensity: 0 }),
  agua: new THREE.MeshStandardMaterial({ color: C.agua, roughness: .04, metalness: .1, normalMap: texAguaNormal, normalScale: new THREE.Vector2(.35, .35), emissive: 0x2fd0e0, emissiveIntensity: 0 }),
  rio: new THREE.MeshStandardMaterial({ color: 0x4f7b80, roughness: .1, metalness: .2, normalMap: texAguaNormal, normalScale: new THREE.Vector2(.25, .25) }),
  suelo: new THREE.MeshStandardMaterial({ map: texSuelo, roughness: 1 }),
  cesped: new THREE.MeshStandardMaterial({ color: C.cesped, roughness: 1 }),
  olivo: new THREE.MeshStandardMaterial({ color: C.olivo, roughness: .9, flatShading: true }),
  encina: new THREE.MeshStandardMaterial({ color: C.encina, roughness: .95, flatShading: true }),
  cipres: new THREE.MeshStandardMaterial({ color: C.cipres, roughness: .95, flatShading: true }),
  naranjo: new THREE.MeshStandardMaterial({ color: 0x3f5a2c, roughness: .9, flatShading: true }),
  naranja: new THREE.MeshStandardMaterial({ color: 0xf08a24, roughness: .6, emissive: 0x401800 }),
  tronco: new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 1 }),
  ladrillo: new THREE.MeshStandardMaterial({ color: C.ladrillo, roughness: .9 }),
  piedraAcu: new THREE.MeshStandardMaterial({ color: 0x9a9184, roughness: .95 }),
  farol: new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffc27a, emissiveIntensity: 0 }),
  colina: new THREE.MeshStandardMaterial({ color: 0x9c8d63, roughness: 1, flatShading: true })
};
const NOCTURNOS = [M.vidrio, M.farol];   // se iluminan al anochecer

/* ===================== PIEZAS ===================== */
function caja(grupo, w, h, d, mat, x, y, z, sombra = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = sombra; m.receiveShadow = true;
  grupo.add(m);
  return m;
}
function tejado(grupo, w, d, alto, x, y, z, rotY = 0) {   // tejado a dos aguas
  const s = new THREE.Shape();
  s.moveTo(-d / 2 - .3, 0); s.lineTo(0, alto); s.lineTo(d / 2 + .3, 0); s.lineTo(-d / 2 - .3, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: w + .5, bevelEnabled: false });
  g.translate(0, 0, -(w + .5) / 2);
  g.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(g, M.teja);
  m.position.set(x, y, z); m.rotation.y = rotY;
  m.castShadow = m.receiveShadow = true;
  grupo.add(m);
  return m;
}
function ventanal(grupo, w, h, x, y, z, rotY = 0, montantes = 4) {
  const v = new THREE.Group();
  const cristal = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.vidrio);
  v.add(cristal);
  for (let i = 0; i <= montantes; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(.08, h, .1), M.metal);
    m.position.x = -w / 2 + i * w / montantes; v.add(m);
  }
  const marco = new THREE.Mesh(new THREE.BoxGeometry(w, .1, .12), M.metal);
  marco.position.y = h / 2; v.add(marco);
  const marco2 = marco.clone(); marco2.position.y = -h / 2; v.add(marco2);
  v.position.set(x, y + h / 2, z); v.rotation.y = rotY;
  grupo.add(v);
  return v;
}
function olivo(grupo, x, z, esc = 1) {
  const t = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(.18, .32, 1.6, 6), M.tronco);
  tronco.position.y = .8; tronco.rotation.z = (azar() - .5) * .4; tronco.castShadow = true; t.add(tronco);
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(.75 + azar() * .45, 0), M.olivo);
    c.position.set((azar() - .5) * 1.8, 1.9 + azar() * .9, (azar() - .5) * 1.8);
    c.scale.y = .7; c.castShadow = true; t.add(c);
  }
  t.position.set(x, 0, z); t.scale.setScalar(esc); t.rotation.y = azar() * 6;
  grupo.add(t);
}
function cipres(grupo, x, z, alto = 6) {
  const c = new THREE.Mesh(new THREE.ConeGeometry(.75, alto, 7), M.cipres);
  c.position.set(x, alto / 2 + .2, z); c.castShadow = true;
  c.scale.set(1, 1, 1); grupo.add(c);
  const b = new THREE.Mesh(new THREE.SphereGeometry(.78, 7, 5), M.cipres);
  b.position.set(x, 1.1, z); b.scale.y = 1.6; grupo.add(b);
}
function naranjo(grupo, x, z) {
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 1.2, 6), M.tronco);
  tr.position.set(x, .6, z); grupo.add(tr);
  const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), M.naranjo);
  copa.position.set(x, 1.9, z); copa.castShadow = true; grupo.add(copa);
  for (let i = 0; i < 12; i++) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 4), M.naranja);
    const a = azar() * 6.28, b = azar() * 3.14;
    n.position.set(x + Math.sin(b) * Math.cos(a) * 1.02, 1.9 + Math.cos(b) * .9, z + Math.sin(b) * Math.sin(a) * 1.02);
    grupo.add(n);
  }
}
function piscina(grupo, w, d, x, z) {
  caja(grupo, w + .8, .25, d + .8, M.pavimento, x, 0, z, false);
  const a = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.agua);
  a.rotation.x = -Math.PI / 2; a.position.set(x, .27, z); a.receiveShadow = true;
  grupo.add(a);
  return a;
}
function farol(grupo, x, z) {
  caja(grupo, .14, .7, .14, M.metal, x, 0, z, false);
  caja(grupo, .16, .12, .16, M.farol, x, .7, z, false);
}
function pergola(grupo, w, d, x, y, z, alto = 2.7) {
  for (const [px, pz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) caja(grupo, .16, alto, .16, M.madera, x + px, y, z + pz);
  for (let i = 0; i <= w / .5; i++) caja(grupo, .08, .12, d + .3, M.madera, x - w / 2 + i * .5, y + alto, z);
}

/* ===================== VARIANTES =====================
   'villa' es la casa de la escena principal. Las demás son
   las fotos de las fichas de propiedades (se sacan con ?render=1&variante=…). */
const VARIANTES = {
  villa(g) {
    // planta baja
    caja(g, 15, .3, 9.5, M.pavimento, 0, 0, 0, false);
    caja(g, 13, 3.2, 7.5, M.cal, 0, .3, -.6);
    ventanal(g, 11, 2.7, -.6, .35, 3.17, 0, 6);
    ventanal(g, 5, 2.4, 6.52, .35, -.6, Math.PI / 2, 3);
    caja(g, 14, .28, 8.6, M.cal, 0, 3.5, -.1);                   // losa con vuelo
    // planta alta, volada sobre la terraza
    caja(g, 8.5, 2.9, 6.6, M.cal, 3, 3.78, -1.4);
    ventanal(g, 5.4, 2.4, 1.6, 3.98, 1.92, 0, 4);
    for (let i = 0; i < 13; i++) caja(g, .1, 2.6, .14, M.madera, 4.6 + i * .22, 3.9, 2.02, false);   // lamas
    caja(g, 9.4, .25, 7.4, M.cal, 3, 6.68, -1.4);
    caja(g, 2.6, .9, 2.2, M.calSombra, 5.5, 6.93, -2.4);          // casetón de la azotea
    // terraza alta con barandilla de vidrio
    caja(g, 4.4, .06, 4.6, M.madera, -3.6, 3.78, .2, false);
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1), M.vidrio);
    bar.position.set(-3.6, 4.3, 2.5); g.add(bar);
    // muro de granito y caminos
    caja(g, .6, 1.1, 18, M.granito, 10.5, 0, 2);
    caja(g, 8, 1.1, .6, M.granito, 6.8, 0, 11);
    caja(g, 2.2, .06, 9, M.pavimento, 4, 0, 8, false);
    // piscina y jardín
    piscina(g, 11, 3.5, -5.2, 7.6);
    for (let i = 0; i < 4; i++) caja(g, .7, .12, 2, M.madera, -7.8 + i * 1.1, .27, 11.2, false);   // tumbonas
    olivo(g, 8, 6, 1.2); olivo(g, -12, 2, 1.1); olivo(g, 13, -6, 1.3); olivo(g, -9, -7, 1);
    cipres(g, -13.5, -3.5, 7); cipres(g, -14.6, -1, 6); cipres(g, 12.5, 12, 6.5);
    for (const [x, z] of [[2.9, 5], [2.9, 9], [2.9, 12.5], [5.1, 5], [5.1, 9], [5.1, 12.5]]) farol(g, x, z);
    return { vista: VISTAS.hero };
  },
  atico(g) {
    caja(g, 16, 15, 12, M.cal, 0, -15, 0);
    for (let p = 0; p < 4; p++) for (let i = 0; i < 6; i++) ventanal(g, 1.6, 1.8, -6.2 + i * 2.5, -14 + p * 3.7, 6.02, 0, 2);
    caja(g, 16.4, .35, 12.4, M.calSombra, 0, 0, 0);
    caja(g, 10, 3, 7, M.cal, -2, .35, -2.2);
    ventanal(g, 9, 2.5, -2, .4, 1.32, 0, 6);
    pergola(g, 5.5, 4, 4.8, .35, 2.5);
    piscina(g, 4, 2.2, -4.5, 4.2);
    caja(g, 16.4, 1, .12, M.vidrio, 0, .35, 6.15, false);
    for (const x of [-7.4, 7.4]) caja(g, 1, .6, 1, M.arcilla, x, .35, 5.2);
    olivo(g, -7.4, 5.2, .45); olivo(g, 7.4, 5.2, .45);
    // Templo de Diana al fondo
    const t = new THREE.Group();
    caja(t, 12, 3, 20, M.piedraAcu, 0, 0, 0);
    for (let i = 0; i < 6; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, 8, 12), M.piedraAcu);
      col.position.set(-5 + i * 2, 7, 9); col.castShadow = true; t.add(col);
    }
    for (let i = 0; i < 7; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, 8, 12), M.piedraAcu);
      col.position.set(-5, 7, 9 - i * 3); t.add(col);
      const col2 = col.clone(); col2.position.x = 5; t.add(col2);
    }
    caja(t, 12, 1.4, 20, M.piedraAcu, 0, 11, 0);
    t.position.set(-27, -15, 4); t.rotation.y = .9; t.scale.setScalar(1.3); g.add(t);
    g.position.y = 15;
    return { vista: { pos: [19, 22, 24], mira: [-11, 11, -1] }, sinAcueducto: true };
  },
  patio(g) {
    const alas = [[0, -6, 14, 4], [0, 6, 14, 4], [-6, 0, 4, 8], [6, 0, 4, 8]];
    for (const [x, z, w, d] of alas) {
      caja(g, w, 5.6, d, M.cal, x, 0, z);
      caja(g, w + .02, .9, d + .02, M.arcilla, x, 0, z, false);        // zócalo
      tejado(g, w > d ? w : d, w > d ? d : w, 1.6, x, 5.6, z, w > d ? 0 : Math.PI / 2);
    }
    for (let i = 0; i < 4; i++) ventanal(g, 1, 1.6, -4.5 + i * 3, 3, 8.03, 0, 1);
    caja(g, 1.8, 2.6, .2, M.madera, 0, 0, 8.02);
    caja(g, 8, .08, 8, M.granito, 0, 0, 0, false);
    naranjo(g, -1.8, -1.6); naranjo(g, 2, 1.8);
    caja(g, 1.6, .5, 1.6, M.granito, 0, 0, 0);
    const fuente = new THREE.Mesh(new THREE.CircleGeometry(.6, 20), M.agua);
    fuente.rotation.x = -Math.PI / 2; fuente.position.y = .52; g.add(fuente);
    for (let i = -2; i <= 2; i++) if (i) { caja(g, 3.2, 6.5, 4, M.cal, i * 9, 0, -16); tejado(g, 3.2, 4, 1.3, i * 9, 6.5, -16, Math.PI / 2); }
    return { vista: { pos: [13, 15, 17], mira: [0, 1.5, 0] }, sinAcueducto: true };
  },
  corchera(g) {
    caja(g, 22, .3, 10, M.pavimento, 0, 0, 0, false);
    caja(g, 18, 3.3, 7, M.cal, 0, .3, -1);
    ventanal(g, 15, 2.8, 0, .35, 2.52, 0, 8);
    caja(g, 19, .3, 8, M.cal, 0, 3.6, -.6);
    pergola(g, 6, 4, -11.5, .3, 1);
    piscina(g, 14, 4, 0, 8);
    caja(g, 30, 4, .3, M.cipres, 0, 0, -12);
    olivo(g, 12, 6); olivo(g, -14, 8, 1.2);
    for (let i = 0; i < 6; i++) cipres(g, -14 + i * 5.6, -14, 6 + azar() * 2);
    return { vista: { pos: [16, 4.5, 22], mira: [0, 1.5, 0] } };
  },
  cortijo(g) {
    caja(g, 26, 4.5, 6, M.cal, 0, 0, 0);
    caja(g, 26.02, .8, 6.02, M.arcilla, 0, 0, 0, false);
    tejado(g, 26, 6, 1.8, 0, 4.5, 0);
    caja(g, 6, 3.4, 10, M.cal, 13, 0, 5);
    tejado(g, 10, 6, 1.4, 13, 3.4, 5, Math.PI / 2);
    for (let i = 0; i < 7; i++) { caja(g, 1.1, 1.5, .1, M.madera, -10.5 + i * 3.5, 1.4, 3.02, false); }
    caja(g, 1.2, 2.4, 1.2, M.cal, -10, 6, 0); // chimenea
    for (let f = 0; f < 5; f++) for (let i = 0; i < 9; i++) olivo(g, -20 + i * 5, 12 + f * 5, .8);
    pergola(g, 8, 3.5, -4, 0, 5);
    return { vista: { pos: [26, 9, 30], mira: [0, 2, 4] } };
  },
  rio(g) {
    for (let p = 0; p < 6; p++) {
      caja(g, 14, 3, 10, p % 2 ? M.cal : M.calSombra, 0, p * 3, 0);
      ventanal(g, 12, 2.2, 0, p * 3 + .4, 5.02, 0, 6);
      caja(g, 14.6, .2, 2, M.cal, 0, p * 3 + .2, 5.9);
      caja(g, 14.6, .9, .06, M.vidrio, 0, p * 3 + .4, 6.88, false);
    }
    caja(g, 14.6, .4, 10.6, M.calSombra, 0, 18, 0);
    caja(g, 70, .12, 16, M.cesped, 0, 0, 14, false);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(200, 30), M.rio);
    r.rotation.x = -Math.PI / 2; r.position.set(0, .06, 34); g.add(r);
    // puente de Lusitania: arco blanco sobre el tablero
    caja(g, 120, .8, 3, M.cal, 0, .5, 40);
    const arco = new THREE.Mesh(new THREE.TorusGeometry(26, .7, 8, 48, Math.PI), M.cal);
    arco.position.set(-12, 0, 40); arco.scale.y = .55; g.add(arco);
    for (let i = 1; i < 12; i++) {
      const x = -12 - 26 + i * 52 / 12, y = Math.sqrt(Math.max(0, 26 * 26 - (x + 12) ** 2)) * .55;
      caja(g, .06, y, .06, M.metal, x, .9, 40, false);
    }
    olivo(g, -10, 10); olivo(g, 11, 11, 1.2);
    return { vista: { pos: [44, 12, 66], mira: [-4, 6, 12] }, sinAcueducto: true };
  }
};

/* ===================== ENTORNO: dehesa y acueducto ===================== */
function entorno(escena, ligero, datos = {}) {
  const g = new THREE.Group();
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(400, 64), M.suelo);
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true;
  g.add(suelo);
  // colinas bajas en el horizonte
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + azar() * .2, r = 170 + azar() * 60;
    const c = new THREE.Mesh(new THREE.SphereGeometry(30 + azar() * 40, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), M.colina);
    c.position.set(Math.cos(a) * r, -4, Math.sin(a) * r); c.scale.y = .22 + azar() * .18;
    g.add(c);
  }
  // encinas de la dehesa (malla instanciada)
  const n = ligero ? 70 : 160;
  const enc = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), M.encina, n);
  const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(.15, .25, 1.4, 5), M.tronco, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    let x, z;
    do { x = (azar() - .5) * 260; z = (azar() - .5) * 260; } while (Math.hypot(x, z) < 28);
    const s = 1.6 + azar() * 1.6;
    o.position.set(x, 1.4 + s * .5, z); o.scale.set(s * 1.3, s * .75, s * 1.3); o.rotation.y = azar() * 6; o.updateMatrix();
    enc.setMatrixAt(i, o.matrix);
    o.position.set(x, .7, z); o.scale.set(1, 1, 1); o.updateMatrix();
    tr.setMatrixAt(i, o.matrix);
  }
  enc.castShadow = true;
  g.add(enc, tr);
  // acueducto de Los Milagros (silueta al norte)
  const acu = new THREE.Group();
  const piers = 15, paso = 7;
  for (let i = 0; i < piers; i++) {
    const x = (i - piers / 2) * paso, alto = 19 - Math.abs(i - piers / 2) * .5;
    for (let b = 0; b < 6; b++) caja(acu, 2, alto / 6, 2.6, b % 2 ? M.ladrillo : M.piedraAcu, x, b * alto / 6, 0, false);
    for (const y of [7, 13]) if (i < piers - 1 && y < alto) {
      const ar = new THREE.Mesh(new THREE.TorusGeometry(paso / 2 - 1, .45, 6, 16, Math.PI), M.ladrillo);
      ar.position.set(x + paso / 2, y - 2.6, 0); acu.add(ar);
      caja(acu, paso - 2, .5, 1.2, M.piedraAcu, x + paso / 2, y, 0, false);
    }
    if (i < piers - 1) caja(acu, paso - 2, .8, 2, M.piedraAcu, x + paso / 2, alto - .8, 0, false);
  }
  if (datos.sinAcueducto) { escena.add(g); return; }
  acu.position.set(-150, 0, -40); acu.rotation.y = Math.PI / 2 - .25; acu.scale.setScalar(1.7);
  g.add(acu);
  escena.add(g);
}

/* ===================== CIELO ===================== */
const cieloMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { arriba: { value: new THREE.Color() }, abajo: { value: new THREE.Color() }, solDir: { value: new THREE.Vector3() }, solColor: { value: new THREE.Color() } },
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform vec3 arriba, abajo, solDir, solColor; varying vec3 vP;
    void main(){
      float h = max(vP.y, 0.);
      vec3 c = mix(abajo, arriba, pow(h, .55));
      float d = max(dot(normalize(vP), normalize(solDir)), 0.);
      c += solColor * (pow(d, 900.) * 3. + pow(d, 12.) * .28);
      if (vP.y < 0.) c = abajo * .85;
      gl_FragColor = vec4(c, 1.);
    }`
});

// Paleta del día. h = hora del día.
const DIA = [
  { h: 6.5,  arriba: 0x2c3e66, abajo: 0xf0a37a, sol: 0xffa36e, i: 1.1, amb: .35, env: .25 },
  { h: 9,    arriba: 0x6c9cd0, abajo: 0xd5e4ee, sol: 0xfff0da, i: 2.6, amb: .6,  env: .55 },
  { h: 13,   arriba: 0x4f86c6, abajo: 0xc0d8ea, sol: 0xffffff, i: 3.1, amb: .7,  env: .6 },
  { h: 17.5, arriba: 0x5b7fb0, abajo: 0xf2c690, sol: 0xffcf92, i: 2.6, amb: .55, env: .5 },
  { h: 20,   arriba: 0x28335a, abajo: 0xe27a52, sol: 0xff8656, i: 1.0, amb: .3,  env: .25 },
  { h: 21.3, arriba: 0x0c1226, abajo: 0x2a2b4a, sol: 0x9db7ff, i: .25, amb: .14, env: .06 },
  { h: 23.5, arriba: 0x060914, abajo: 0x161a30, sol: 0x9db7ff, i: .2,  amb: .1,  env: .05 }
];
const _a = new THREE.Color(), _b = new THREE.Color();
function paleta(h) {
  let i = 0;
  while (i < DIA.length - 2 && h > DIA[i + 1].h) i++;
  const A = DIA[i], B = DIA[i + 1], t = suave(clamp01((h - A.h) / (B.h - A.h)));
  return {
    arriba: _a.set(A.arriba).lerp(_b.set(B.arriba), t).clone(),
    abajo: _a.set(A.abajo).lerp(_b.set(B.abajo), t).clone(),
    sol: _a.set(A.sol).lerp(_b.set(B.sol), t).clone(),
    i: lerp(A.i, B.i, t), amb: lerp(A.amb, B.amb, t), env: lerp(A.env, B.env, t)
  };
}

/* ===================== ARRANQUE ===================== */
function hayWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function iniciar() {
  const canvas = document.querySelector('[data-escena-canvas]');
  if (!canvas || !hayWebGL()) { document.documentElement.classList.add('sin-3d'); return null; }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOVIL, preserveDrawingBuffer: RENDER, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const escena = new THREE.Scene();
  escena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  escena.fog = new THREE.Fog(0xffffff, 60, 330);

  const camara = new THREE.PerspectiveCamera(38, 1, .5, 900);
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), cieloMat);
  escena.add(cielo);

  const sol = new THREE.DirectionalLight(0xffffff, 3);
  sol.castShadow = true;
  sol.shadow.mapSize.setScalar(MOVIL ? 1024 : 2048);
  Object.assign(sol.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 140 });
  sol.shadow.bias = -.0004; sol.shadow.normalBias = .03;
  escena.add(sol, sol.target);
  const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x8a7a55, .6);
  escena.add(hemi);

  // estrellas
  const nE = 900, posE = new Float32Array(nE * 3);
  for (let i = 0; i < nE; i++) {
    const a = azar() * Math.PI * 2, b = Math.acos(azar() * .9);
    posE.set([Math.sin(b) * Math.cos(a) * 550, Math.cos(b) * 550, Math.sin(b) * Math.sin(a) * 550], i * 3);
  }
  const geoE = new THREE.BufferGeometry(); geoE.setAttribute('position', new THREE.BufferAttribute(posE, 3));
  const matE = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  escena.add(new THREE.Points(geoE, matE));
  const luna = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 12), new THREE.MeshBasicMaterial({ color: 0xf4f1e6, fog: false, transparent: true, opacity: 0 }));
  escena.add(luna);

  const casa = new THREE.Group();
  const datos = (VARIANTES[VARIANTE] || VARIANTES.villa)(casa);
  entorno(escena, MOVIL, datos);
  escena.add(casa);

  // luces interiores (solo de noche)
  const interior = [new THREE.PointLight(0xffb36b, 0, 14, 1.6), new THREE.PointLight(0xffb36b, 0, 12, 1.6), new THREE.PointLight(0x40e0ff, 0, 10, 1.8)];
  interior[0].position.set(-1, 2, 2.2); interior[1].position.set(2, 5.2, 1); interior[2].position.set(-5.2, .6, 7.6);
  if (VARIANTE === 'villa') escena.add(...interior);

  /* ---------- estado ---------- */
  const estado = { hora: 7, horaObjetivo: 7, horaManual: null, foco: null, giro: 0, giroObjetivo: 0, interactivo: false };
  const cam = { pos: new THREE.Vector3(...(datos.vista || VISTAS.hero).pos), mira: new THREE.Vector3(...(datos.vista || VISTAS.hero).mira) };
  const objetivo = { pos: cam.pos.clone(), mira: cam.mira.clone() };

  function aplicarHora(h) {
    const p = paleta(h);
    // el sol sale por el este (+x) y se pone por el oeste (-x), algo al sur (+z)
    const ang = (h - 6.2) / (21 - 6.2) * Math.PI;
    const dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang) * .85 + .02, Math.sin(ang) * .55 + .05).normalize();
    const noche = clamp01((h - 19.6) / 1.5);
    if (noche > .6) dir.set(-.45, .7, -.4).normalize();           // luz de luna
    sol.position.copy(dir).multiplyScalar(60);
    sol.color.copy(p.sol); sol.intensity = p.i;
    hemi.intensity = p.amb;
    hemi.color.copy(p.arriba).lerp(new THREE.Color(0xffffff), .5);
    escena.environmentIntensity = p.env;
    cieloMat.uniforms.arriba.value.copy(p.arriba);
    cieloMat.uniforms.abajo.value.copy(p.abajo);
    cieloMat.uniforms.solDir.value.copy(noche > .6 ? new THREE.Vector3(Math.cos(ang), Math.sin(ang), .55) : dir);
    cieloMat.uniforms.solColor.value.copy(p.sol).multiplyScalar(1 - noche);
    escena.fog.color.copy(p.abajo).lerp(p.arriba, .25);
    matE.opacity = noche * .9;
    luna.material.opacity = noche;
    luna.position.set(-260, 300, -280);
    M.vidrio.emissiveIntensity = noche * 1.7;
    M.farol.emissiveIntensity = noche * 3;
    M.agua.emissiveIntensity = noche * .7;
    interior[0].intensity = noche * 22; interior[1].intensity = noche * 14; interior[2].intensity = noche * 10;
    renderer.toneMappingExposure = lerp(1, 1.35, noche);
  }

  function ajustar() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // en vertical se aleja la cámara para que quepa la casa
    camara.fov = camara.aspect < 1 ? 38 + (1 - camara.aspect) * 26 : 38;
    camara.updateProjectionMatrix();
  }
  ajustar();
  addEventListener('resize', ajustar);

  /* ---------- scroll: hora y vista según [data-escena] ---------- */
  const marcas = [...document.querySelectorAll('[data-escena]')];
  function leerScroll() {
    if (!marcas.length) return;
    const centro = innerHeight / 2;
    const pts = marcas.map(el => {
      const r = el.getBoundingClientRect();
      return { c: r.top + r.height / 2, hora: parseFloat(el.dataset.hora), vista: VISTAS[el.dataset.vista] || VISTAS.hero, el };
    });
    let i = 0;
    while (i < pts.length - 1 && pts[i + 1].c < centro) i++;
    const A = pts[i], B = pts[Math.min(i + 1, pts.length - 1)];
    const t = A === B ? 0 : suave(clamp01((centro - A.c) / (B.c - A.c)));
    estado.horaObjetivo = lerp(A.hora, B.hora, t);
    const v = estado.foco || null;
    objetivo.pos.fromArray(A.vista.pos).lerp(new THREE.Vector3(...B.vista.pos), t);
    objetivo.mira.fromArray(A.vista.mira).lerp(new THREE.Vector3(...B.vista.mira), t);
    if (v) { objetivo.pos.fromArray(v.pos); objetivo.mira.fromArray(v.mira); }
  }
  addEventListener('scroll', leerScroll, { passive: true });
  leerScroll();
  estado.hora = estado.horaObjetivo;
  cam.pos.copy(objetivo.pos); cam.mira.copy(objetivo.mira);

  /* ---------- sección interactiva ---------- */
  const zona = document.querySelector('[data-interactivo]');
  const capa = document.querySelector('[data-puntos]');
  const botones = [];
  if (zona && capa) {
    for (const p of PUNTOS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'punto'; b.dataset.id = p.id;
      b.innerHTML = `<span class="punto__dot" aria-hidden="true"></span><span class="punto__label">${p.titulo}</span>`;
      b.setAttribute('aria-label', `${p.titulo}: ${p.texto}`);
      b.addEventListener('click', () => enfocar(p));
      capa.appendChild(b);
      botones.push({ b, v: new THREE.Vector3(...p.p) });
    }
    new IntersectionObserver(([e]) => {
      estado.interactivo = e.intersectionRatio > .35;
      document.documentElement.classList.toggle('villa-activa', estado.interactivo);
      if (!estado.interactivo) { estado.foco = null; estado.horaManual = null; estado.giroObjetivo = 0; zona.dispatchEvent(new CustomEvent('escena:foco', { detail: null })); }
      leerScroll();
    }, { threshold: [0, .35, .6] }).observe(zona);

    // arrastrar para girar
    let x0 = null;
    const sup = zona.querySelector('[data-arrastre]') || zona;
    sup.addEventListener('pointerdown', e => { if (e.target.closest('button, input, a')) return; x0 = e.clientX; sup.setPointerCapture(e.pointerId); sup.classList.add('arrastrando'); });
    sup.addEventListener('pointermove', e => { if (x0 === null) return; estado.giroObjetivo += (e.clientX - x0) * -.008; x0 = e.clientX; });
    const soltar = () => { x0 = null; sup.classList.remove('arrastrando'); };
    sup.addEventListener('pointerup', soltar); sup.addEventListener('pointercancel', soltar);
  }
  function enfocar(p) {
    estado.foco = p ? p.vista : null;
    estado.giroObjetivo = 0;
    botones.forEach(o => o.b.classList.toggle('activo', p && o.b.dataset.id === p.id));
    zona?.dispatchEvent(new CustomEvent('escena:foco', { detail: p }));
    leerScroll();
  }

  /* ---------- bucle ---------- */
  let visible = true, ultimo = performance.now(), lentos = 0;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  const ventanas = document.querySelectorAll('[data-escena]');
  let alguna = true;
  const io = new IntersectionObserver(es => {
    es.forEach(e => e.target._ve = e.isIntersecting);
    alguna = [...ventanas].some(el => el._ve);
  });
  ventanas.forEach(el => io.observe(el));

  const v3 = new THREE.Vector3(), off = new THREE.Vector3();
  function paso(ahora) {
    const dt = Math.min(.1, (ahora - ultimo) / 1000); ultimo = ahora;
    const k = MENOS_MOV ? 1 : 1 - Math.exp(-dt * 2.6);
    estado.hora = lerp(estado.hora, estado.horaManual ?? estado.horaObjetivo, k);
    estado.giro = lerp(estado.giro, estado.giroObjetivo, k);
    cam.pos.lerp(objetivo.pos, k); cam.mira.lerp(objetivo.mira, k);
    aplicarHora(estado.hora);

    // giro alrededor del punto al que se mira + leve deriva
    off.copy(cam.pos).sub(cam.mira);
    const deriva = MENOS_MOV || RENDER ? 0 : Math.sin(ahora / 6000) * .05;
    off.applyAxisAngle(THREE.Object3D.DEFAULT_UP, estado.giro + deriva);
    if (camara.aspect < 1) off.multiplyScalar(1 + (1 - camara.aspect) * .6);   // en vertical, más lejos
    camara.position.copy(cam.mira).add(off);
    camara.lookAt(cam.mira);
    texAguaNormal.offset.set(ahora / 40000, ahora / 55000);

    renderer.render(escena, camara);

    // puntos interactivos
    if (botones.length) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      for (const o of botones) {
        v3.copy(o.v).project(camara);
        const fuera = v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05;
        o.b.style.transform = `translate(${(v3.x * .5 + .5) * w}px, ${(-v3.y * .5 + .5) * h}px)`;
        o.b.classList.toggle('oculto', fuera || !estado.interactivo);
      }
    }
    // si el móvil va lento, baja la resolución
    if (!RENDER && dt > .045 && ++lentos > 40 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); ajustar(); lentos = 0; }
    document.dispatchEvent(new CustomEvent('escena:hora', { detail: estado.hora }));
  }
  function bucle(t) {
    requestAnimationFrame(bucle);
    if (visible && (alguna || estado.interactivo)) paso(t);
  }

  const api = {
    setHora(h) { estado.horaManual = h; },
    soltarHora() { estado.horaManual = null; },
    enfocar(id) { enfocar(PUNTOS.find(p => p.id === id) || null); },
    // render manual (vídeos y fotos)
    fotograma(h, pos, mira, t = 0) {
      estado.horaManual = h; estado.hora = h;
      if (pos) { cam.pos.fromArray(pos); objetivo.pos.fromArray(pos); }
      if (mira) { cam.mira.fromArray(mira); objetivo.mira.fromArray(mira); }
      ultimo = t - 16; paso(t);
    },
    proyectar(p) {
      const v = new THREE.Vector3(...p).project(camara);
      return [+((v.x * .5 + .5) * 100).toFixed(1), +((-v.y * .5 + .5) * 100).toFixed(1)];
    },
    vistas: VISTAS, variante: datos
  };
  if (RENDER) { window.ESCENA = api; document.documentElement.classList.add('modo-render'); window.ESCENA_LISTA = true; }
  else requestAnimationFrame(bucle);
  return api;
}
