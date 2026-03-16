/**
 * Immersive solar system background with Milky Way skybox.
 * Full 8-planet system with moons, labels, orbit paths.
 * Planets are clickable — camera flies to them as an Easter egg.
 * Quality-adaptive: low-end devices get simplified or no space background.
 */

import * as THREE from 'three';
import type { QualityTier } from '@/lib/deviceCapability';

const BG_LAYER = 2;

/* ─── Public Types ──────────────────────────────────────────────────────── */

export interface PlanetInfo {
  name: string;
  color: string;
  distFromSun: string;
  diameter: string;
  dayLength: string;
  yearLength: string;
  moonCount: number;
  temperature: string;
  funFact: string;
}

export interface ClickablePlanet {
  mesh: THREE.Mesh;
  info: PlanetInfo;
  labelSprite: THREE.Sprite;
}

export interface SpaceCleanup {
  dispose: () => void;
  getClickablePlanets: () => ClickablePlanet[];
  getMilkyWayTexture: () => THREE.Texture;
}

/* ─── Planet Data ───────────────────────────────────────────────────────── */

interface MoonDef {
  name: string;
  radius: number;
  color: number;
  orbitRadius: number;
  speed: number;
}

interface PlanetDef {
  name: string;
  radius: number;
  color: number;
  emissive: number;
  emissiveI: number;
  orbitRadius: number;
  speed: number;
  tilt: number;
  phase: number;
  yOffset: number;
  ring?: { inner: number; outer: number; color: number; opacity: number };
  moons: MoonDef[];
  info: PlanetInfo;
}

const SUN_POS = new THREE.Vector3(-400, 100, -800);

/* ─── Planet Texture Paths (Solar System Scope, CC-BY 4.0) ────────────── */

const PLANET_TEXTURES: Record<string, string> = {
  Sun: '/textures/planets/2k_sun.jpg',
  Mercury: '/textures/planets/2k_mercury.jpg',
  Venus: '/textures/planets/2k_venus_surface.jpg',
  Mars: '/textures/planets/2k_mars.jpg',
  Jupiter: '/textures/planets/2k_jupiter.jpg',
  Saturn: '/textures/planets/2k_saturn.jpg',
  Uranus: '/textures/planets/2k_uranus.jpg',
  Moon: '/textures/planets/2k_moon.jpg',
};

const SATURN_RING_TEXTURE = '/textures/planets/2k_saturn_ring_alpha.png';

const PLANETS: PlanetDef[] = [
  {
    name: 'Mercury', radius: 7, color: 0x8c7a6b, emissive: 0x5a4a3a, emissiveI: 0.6,
    orbitRadius: 130, speed: 0.0009, tilt: 0.05, phase: 0.5, yOffset: 0,
    moons: [],
    info: {
      name: 'Mercury', color: '#8c7a6b',
      distFromSun: '57.9 million km', diameter: '4,879 km',
      dayLength: '59 Earth days', yearLength: '88 Earth days',
      moonCount: 0, temperature: '−180°C to 430°C',
      funFact: 'The smallest planet and closest to the Sun. Despite its proximity, it\'s not the hottest — that\'s Venus!',
    },
  },
  {
    name: 'Venus', radius: 12, color: 0xe8c56a, emissive: 0xb89a35, emissiveI: 0.5,
    orbitRadius: 250, speed: 0.0006, tilt: 0.04, phase: 1.8, yOffset: 8,
    moons: [],
    info: {
      name: 'Venus', color: '#e8c56a',
      distFromSun: '108.2 million km', diameter: '12,104 km',
      dayLength: '243 Earth days', yearLength: '225 Earth days',
      moonCount: 0, temperature: '462°C average',
      funFact: 'Venus rotates backwards and has the longest day of any planet. Its thick atmosphere traps heat, making it hotter than Mercury.',
    },
  },
  {
    name: 'Mars', radius: 9, color: 0xc1440e, emissive: 0x8a2a0a, emissiveI: 0.7,
    orbitRadius: 480, speed: 0.00028, tilt: 0.03, phase: 3.2, yOffset: -10,
    moons: [
      { name: 'Phobos', radius: 1.8, color: 0x888888, orbitRadius: 18, speed: 0.02 },
      { name: 'Deimos', radius: 1.2, color: 0x777777, orbitRadius: 26, speed: 0.012 },
    ],
    info: {
      name: 'Mars', color: '#c1440e',
      distFromSun: '227.9 million km', diameter: '6,779 km',
      dayLength: '24.6 hours', yearLength: '687 Earth days',
      moonCount: 2, temperature: '−87°C to −5°C',
      funFact: 'Home to Olympus Mons, the tallest volcano in the solar system at 21.9 km — nearly 2.5x the height of Everest.',
    },
  },
  {
    name: 'Jupiter', radius: 42, color: 0xc4a46a, emissive: 0x8a6a3a, emissiveI: 0.5,
    orbitRadius: 750, speed: 0.00014, tilt: 0.02, phase: 4.5, yOffset: 15,
    moons: [
      { name: 'Io', radius: 4.5, color: 0xddcc44, orbitRadius: 56, speed: 0.018 },
      { name: 'Europa', radius: 3.8, color: 0xaabbdd, orbitRadius: 68, speed: 0.012 },
      { name: 'Ganymede', radius: 5.5, color: 0x999999, orbitRadius: 84, speed: 0.008 },
      { name: 'Callisto', radius: 4.5, color: 0x666666, orbitRadius: 102, speed: 0.005 },
    ],
    info: {
      name: 'Jupiter', color: '#c4a46a',
      distFromSun: '778.5 million km', diameter: '139,820 km',
      dayLength: '9.9 hours', yearLength: '11.9 Earth years',
      moonCount: 95, temperature: '−110°C',
      funFact: 'The Great Red Spot is a storm larger than Earth that has raged for at least 350 years. Jupiter has 95 known moons!',
    },
  },
  {
    name: 'Saturn', radius: 36, color: 0xd4b87a, emissive: 0x9a8a5a, emissiveI: 0.4,
    orbitRadius: 1000, speed: 0.00009, tilt: 0.07, phase: 5.8, yOffset: -12,
    ring: { inner: 46, outer: 72, color: 0xc9a855, opacity: 0.3 },
    moons: [
      { name: 'Titan', radius: 6.5, color: 0xcc8844, orbitRadius: 88, speed: 0.006 },
    ],
    info: {
      name: 'Saturn', color: '#d4b87a',
      distFromSun: '1.434 billion km', diameter: '116,460 km',
      dayLength: '10.7 hours', yearLength: '29.5 Earth years',
      moonCount: 146, temperature: '−140°C',
      funFact: 'Saturn\'s rings are made of billions of particles of ice and rock. It\'s so light it would float in water (if you had a big enough bathtub).',
    },
  },
  {
    name: 'Uranus', radius: 24, color: 0x6ab5c4, emissive: 0x3a8594, emissiveI: 0.5,
    orbitRadius: 1300, speed: 0.00005, tilt: 0.97, phase: 2.5, yOffset: 5,
    ring: { inner: 30, outer: 36, color: 0x88aacc, opacity: 0.15 },
    moons: [],
    info: {
      name: 'Uranus', color: '#6ab5c4',
      distFromSun: '2.871 billion km', diameter: '50,724 km',
      dayLength: '17.2 hours', yearLength: '84 Earth years',
      moonCount: 28, temperature: '−224°C',
      funFact: 'Uranus is tilted 98° on its axis — it essentially rolls around the Sun on its side. This gives it extreme seasons lasting 21 years each.',
    },
  },
  {
    name: 'Neptune', radius: 22, color: 0x2a5aaa, emissive: 0x1a3a6a, emissiveI: 0.6,
    orbitRadius: 1600, speed: 0.00003, tilt: 0.03, phase: 0.8, yOffset: -5,
    moons: [],
    info: {
      name: 'Neptune', color: '#2a5aaa',
      distFromSun: '4.495 billion km', diameter: '49,528 km',
      dayLength: '16.1 hours', yearLength: '165 Earth years',
      moonCount: 16, temperature: '−214°C',
      funFact: 'Neptune has the strongest winds in the solar system — up to 2,100 km/h. It was the first planet found by mathematical prediction rather than observation.',
    },
  },
];

/* ─── Simple Milky Way Fallback (shown briefly before real texture loads) ─ */

function createSimpleFallback(): THREE.CanvasTexture {
  const W = 1024, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Deep space base
  ctx.fillStyle = '#020209';
  ctx.fillRect(0, 0, W, H);

  // Faint horizontal band (milky way hint)
  const grad = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.7);
  grad.addColorStop(0, 'rgba(40, 35, 50, 0)');
  grad.addColorStop(0.5, 'rgba(40, 35, 50, 0.08)');
  grad.addColorStop(1, 'rgba(40, 35, 50, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Scatter a few hundred stars
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const b = 80 + Math.random() * 120;
    ctx.globalAlpha = 0.2 + Math.random() * 0.5;
    ctx.fillStyle = `rgb(${b}, ${b + 5}, ${b + 10})`;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ─── Helper: create text label sprite ─────────────────────────────────── */

function createLabel(text: string, color = '#ffffff', fontSize = 42): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 128);

  // Shadow for readability against any background
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.font = `bold ${fontSize}px "Inter", "Helvetica Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);

  // Second pass without shadow for crispness
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = 0.4;
  ctx.fillText(text, 256, 64);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.layers.set(BG_LAYER);
  return sprite;
}

/* ─── Helper: orbit ring ───────────────────────────────────────────────── */

function createOrbitRing(
  scene: THREE.Scene,
  objects: THREE.Object3D[],
  center: THREE.Vector3,
  radius: number,
  tilt: number,
  color: number,
  opacity: number,
) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const pts = curve.getPoints(160);
  const geo = new THREE.BufferGeometry().setFromPoints(
    pts.map((p) => new THREE.Vector3(p.x, 0, p.y)),
  );
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const ring = new THREE.Line(geo, mat);
  ring.position.copy(center);
  ring.rotation.x = tilt;
  ring.layers.set(BG_LAYER);
  scene.add(ring);
  objects.push(ring);
}

/* ─── Main ──────────────────────────────────────────────────────────────── */

export function addSpaceBackground(scene: THREE.Scene, tier: QualityTier = 'high'): SpaceCleanup {
  const loader = new THREE.TextureLoader();

  // ── Low-end devices: just dark bg + async milky way texture, no 3D objects ──
  if (tier === 'low') {
    scene.background = new THREE.Color(0x020209);
    let bgTex: THREE.Texture | null = null;
    loader.load('/textures/8k_stars_milky_way.jpg', (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
      bgTex = tex;
    });
    return {
      dispose() { bgTex?.dispose(); scene.background = null; },
      getClickablePlanets: () => [],
      getMilkyWayTexture: () => bgTex!,
    };
  }

  const objects: THREE.Object3D[] = [];
  const clickablePlanets: ClickablePlanet[] = [];
  let frameId: number | null = null;
  const loadTextures = tier === 'high';
  const segments = tier === 'medium' ? 20 : 32;

  // ── 1. Milky Way background ──
  let milkyWayTex: THREE.Texture;
  milkyWayTex = createSimpleFallback(); // fast placeholder
  scene.background = milkyWayTex;

  // Load real texture asynchronously — replaces placeholder once loaded
  loader.load(
    '/textures/8k_stars_milky_way.jpg',
    (realTex) => {
      realTex.mapping = THREE.EquirectangularReflectionMapping;
      realTex.colorSpace = THREE.SRGBColorSpace;
      scene.background = realTex;
      milkyWayTex.dispose();
      milkyWayTex = realTex;
    },
    undefined,
    () => {
      console.warn('Milky Way texture failed to load, using fallback');
    },
  );

  // ── 2. Lighting ──
  const ambient = new THREE.AmbientLight(0x445566, 0.6);
  ambient.layers.set(BG_LAYER);
  scene.add(ambient);
  objects.push(ambient);

  const sunLight = new THREE.PointLight(0xffee88, 3, 4000);
  sunLight.position.copy(SUN_POS);
  sunLight.layers.set(BG_LAYER);
  scene.add(sunLight);
  objects.push(sunLight);

  // ── 3. Sun ──
  const sunGeo = new THREE.SphereGeometry(55, segments + 16, segments + 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee55 });
  if (loadTextures) {
    loader.load(PLANET_TEXTURES.Sun, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      sunMat.map = tex;
      sunMat.needsUpdate = true;
    });
  }
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.copy(SUN_POS);
  sunMesh.layers.set(BG_LAYER);
  sunMesh.name = 'Sun';
  scene.add(sunMesh);
  objects.push(sunMesh);

  // Sun corona glow
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const glowCtx = glowCanvas.getContext('2d')!;
  const glowGrad = glowCtx.createRadialGradient(128, 128, 12, 128, 128, 128);
  glowGrad.addColorStop(0, 'rgba(255, 238, 100, 0.9)');
  glowGrad.addColorStop(0.15, 'rgba(255, 210, 60, 0.55)');
  glowGrad.addColorStop(0.4, 'rgba(255, 170, 40, 0.18)');
  glowGrad.addColorStop(0.7, 'rgba(255, 120, 20, 0.05)');
  glowGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
  glowCtx.fillStyle = glowGrad;
  glowCtx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coronaSprite = new THREE.Sprite(glowMat);
  coronaSprite.scale.set(450, 450, 1);
  coronaSprite.position.copy(SUN_POS);
  coronaSprite.layers.set(BG_LAYER);
  scene.add(coronaSprite);
  objects.push(coronaSprite);

  // Sun label
  const sunLabel = createLabel('☀ Sun', '#ffee88', 38);
  sunLabel.scale.set(100, 25, 1);
  sunLabel.position.set(SUN_POS.x, SUN_POS.y + 85, SUN_POS.z);
  scene.add(sunLabel);
  objects.push(sunLabel);

  // Sun is also clickable
  clickablePlanets.push({
    mesh: sunMesh,
    info: {
      name: 'Sun', color: '#ffee55',
      distFromSun: 'Center of the solar system',
      diameter: '1,391,000 km (109× Earth)',
      dayLength: '25.4 Earth days (at equator)',
      yearLength: '—',
      moonCount: 0, temperature: '5,500°C surface / 15M°C core',
      funFact: 'The Sun contains 99.86% of all mass in the solar system. Every second, it converts 600 million tons of hydrogen into helium.',
    },
    labelSprite: sunLabel,
  });

  // ── 4. Planets ──
  interface OrbitBody {
    mesh: THREE.Mesh;
    label: THREE.Sprite;
    def: PlanetDef;
    moonMeshes: { mesh: THREE.Mesh; def: MoonDef }[];
  }
  const orbitBodies: OrbitBody[] = [];

  for (const def of PLANETS) {
    // Planet mesh
    const geo = new THREE.SphereGeometry(def.radius, segments, segments);
    const mat = new THREE.MeshPhongMaterial({
      color: def.color,
      emissive: def.emissive,
      emissiveIntensity: def.emissiveI,
      shininess: 20,
    });
    // Load realistic texture only on high quality
    if (loadTextures) {
      const texPath = PLANET_TEXTURES[def.name];
      if (texPath) {
        loader.load(texPath, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          mat.needsUpdate = true;
        });
      }
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.layers.set(BG_LAYER);
    mesh.name = def.name;
    scene.add(mesh);
    objects.push(mesh);

    // Saturn/Uranus rings
    if (def.ring) {
      const rGeo = new THREE.RingGeometry(def.ring.inner, def.ring.outer, tier === 'medium' ? 40 : 80);
      // Fix ring UVs so texture maps correctly (radial mapping)
      const ringUvs = rGeo.attributes.uv;
      const ringPos = rGeo.attributes.position;
      for (let i = 0; i < ringUvs.count; i++) {
        const x = ringPos.getX(i);
        const y = ringPos.getY(i);
        const dist = Math.sqrt(x * x + y * y);
        ringUvs.setXY(i, (dist - def.ring.inner) / (def.ring.outer - def.ring.inner), 0.5);
      }
      const rMat = new THREE.MeshBasicMaterial({
        color: def.ring.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: def.ring.opacity,
      });
      // Load Saturn ring texture (high quality only)
      if (def.name === 'Saturn' && loadTextures) {
        loader.load(SATURN_RING_TEXTURE, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          rMat.map = tex;
          rMat.alphaMap = tex;
          rMat.needsUpdate = true;
        });
      }
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = Math.PI / 2 + (def.name === 'Uranus' ? 1.7 : 0.4);
      rMesh.layers.set(BG_LAYER);
      mesh.add(rMesh);
    }

    // Orbit path
    createOrbitRing(scene, objects, SUN_POS, def.orbitRadius, def.tilt, def.color, 0.1);

    // Label
    const labelColor = '#' + def.color.toString(16).padStart(6, '0');
    const label = createLabel(def.name, labelColor, 36);
    const labelScale = Math.max(50, def.radius * 3);
    label.scale.set(labelScale, labelScale * 0.25, 1);
    scene.add(label);
    objects.push(label);

    // Moons
    const moonMeshes: { mesh: THREE.Mesh; def: MoonDef }[] = [];
    for (const moonDef of def.moons) {
      const mGeo = new THREE.SphereGeometry(moonDef.radius, tier === 'medium' ? 8 : 16, tier === 'medium' ? 8 : 16);
      const mMat = new THREE.MeshPhongMaterial({
        color: moonDef.color,
        emissive: moonDef.color,
        emissiveIntensity: 0.3,
        shininess: 10,
      });
      const mMesh = new THREE.Mesh(mGeo, mMat);
      mMesh.layers.set(BG_LAYER);
      mMesh.name = moonDef.name;
      scene.add(mMesh);
      objects.push(mMesh);
      moonMeshes.push({ mesh: mMesh, def: moonDef });
    }

    orbitBodies.push({ mesh, label, def, moonMeshes });

    // Register as clickable
    clickablePlanets.push({ mesh, info: def.info, labelSprite: label });
  }

  // ── 5. Earth's Moon ──
  const moonGeo = new THREE.SphereGeometry(13, segments, segments);
  const moonMat = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    emissive: 0x556666,
    emissiveIntensity: 0.4,
    shininess: 5,
  });
  if (loadTextures) {
    loader.load(PLANET_TEXTURES.Moon, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      moonMat.map = tex;
      moonMat.needsUpdate = true;
    });
  }
  const earthMoon = new THREE.Mesh(moonGeo, moonMat);
  earthMoon.layers.set(BG_LAYER);
  earthMoon.name = 'Moon';
  scene.add(earthMoon);
  objects.push(earthMoon);

  // Moon orbit ring around Earth (origin)
  createOrbitRing(scene, objects, new THREE.Vector3(0, 0, 0), 180, 0.3, 0x888899, 0.06);

  // Moon label
  const moonLabel = createLabel('Moon', '#cccccc', 32);
  moonLabel.scale.set(45, 12, 1);
  scene.add(moonLabel);
  objects.push(moonLabel);

  // Earth label (for the globe)
  const earthLabel = createLabel('Earth 🌍', '#4488ff', 36);
  earthLabel.scale.set(60, 15, 1);
  earthLabel.position.set(0, 130, 0);
  scene.add(earthLabel);
  objects.push(earthLabel);

  // Register Moon as clickable
  clickablePlanets.push({
    mesh: earthMoon,
    info: {
      name: 'Moon', color: '#cccccc',
      distFromSun: '149.6 million km (with Earth)',
      diameter: '3,474 km',
      dayLength: '27.3 Earth days (tidally locked)',
      yearLength: '27.3 days (orbits Earth)',
      moonCount: 0, temperature: '−173°C to 127°C',
      funFact: 'The Moon is slowly drifting away from Earth at 3.8 cm per year. It\'s the only other world humans have walked on.',
    },
    labelSprite: moonLabel,
  });

  // ── 6. Asteroid belt hint (between Mars and Jupiter) ──
  const asteroidCount = tier === 'medium' ? 100 : 300;
  const astPos = new Float32Array(asteroidCount * 3);
  const astCols = new Float32Array(asteroidCount * 3);
  for (let i = 0; i < asteroidCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 580 + Math.random() * 120;
    const x = SUN_POS.x + Math.cos(angle) * r;
    const z = SUN_POS.z + Math.sin(angle) * r;
    const y = SUN_POS.y + (Math.random() - 0.5) * 40;
    astPos[i * 3] = x;
    astPos[i * 3 + 1] = y;
    astPos[i * 3 + 2] = z;
    const b = 0.3 + Math.random() * 0.3;
    astCols[i * 3] = b;
    astCols[i * 3 + 1] = b * 0.9;
    astCols[i * 3 + 2] = b * 0.8;
  }
  const astGeo = new THREE.BufferGeometry();
  astGeo.setAttribute('position', new THREE.BufferAttribute(astPos, 3));
  astGeo.setAttribute('color', new THREE.BufferAttribute(astCols, 3));
  const astMat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const asteroids = new THREE.Points(astGeo, astMat);
  asteroids.layers.set(BG_LAYER);
  scene.add(asteroids);
  objects.push(asteroids);

  // ── 7. Animation loop ──
  let time = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);
    time += 0.008;

    // Sun pulsing corona
    const pulse = 1 + Math.sin(time * 0.5) * 0.04;
    coronaSprite.scale.set(450 * pulse, 450 * pulse, 1);
    sunMesh.rotation.y += 0.0002;

    // Planets orbit the sun
    for (const body of orbitBodies) {
      const { mesh, label, def, moonMeshes } = body;
      const angle = def.phase + time * def.speed * 60;
      const x = SUN_POS.x + Math.cos(angle) * def.orbitRadius;
      const z = SUN_POS.z + Math.sin(angle) * def.orbitRadius;
      const y = SUN_POS.y + def.yOffset + Math.sin(angle) * def.orbitRadius * Math.sin(def.tilt);
      mesh.position.set(x, y, z);
      mesh.rotation.y += def.speed * 3;

      // Label above planet
      label.position.set(x, y + def.radius + 12, z);

      // Moons orbit their planet
      for (const m of moonMeshes) {
        const mAngle = time * m.def.speed * 60;
        const mx = x + Math.cos(mAngle) * m.def.orbitRadius;
        const mz = z + Math.sin(mAngle) * m.def.orbitRadius;
        const my = y + Math.sin(mAngle) * m.def.orbitRadius * 0.15;
        m.mesh.position.set(mx, my, mz);
      }
    }

    // Earth's Moon
    const moonAngle = time * 0.15;
    earthMoon.position.set(
      Math.cos(moonAngle) * 180,
      Math.sin(moonAngle) * 180 * Math.sin(0.3),
      Math.sin(moonAngle) * 180 * Math.cos(0.3) - 50,
    );
    earthMoon.rotation.y += 0.001;

    // Moon label follows
    moonLabel.position.set(
      earthMoon.position.x,
      earthMoon.position.y + 22,
      earthMoon.position.z,
    );

    // Slow asteroid drift
    asteroids.rotation.y += 0.00005;
  }

  animate();

  // ── Cleanup ──
  return {
    dispose() {
      if (frameId !== null) cancelAnimationFrame(frameId);
      milkyWayTex.dispose();
      for (const obj of objects) {
        scene.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
        if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
        if (obj instanceof THREE.Line) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
        if (obj instanceof THREE.Sprite) {
          (obj.material as THREE.SpriteMaterial).map?.dispose();
          obj.material.dispose();
        }
      }
      scene.background = null;
    },
    getClickablePlanets: () => clickablePlanets,
    getMilkyWayTexture: () => milkyWayTex,
  };
}
