/**
 * Space background decorations for the 3D globe scene.
 *
 * Adds distant planet spheres and a nebula particle cloud behind the globe.
 * All objects are placed on a separate raycast layer so they never interfere
 * with globe interactions (hover / click).
 */

import * as THREE from 'three';

// ── Planet definitions ──────────────────────────────────────────────────────

interface PlanetDef {
  name: string;
  radius: number;
  position: [number, number, number];
  color: number;
  emissive: number;
  emissiveIntensity: number;
  rotationSpeed: number; // radians per frame
  ring?: {
    innerRadius: number;
    outerRadius: number;
    color: number;
    opacity: number;
    tilt: number; // radians
  };
}

const PLANETS: PlanetDef[] = [
  {
    // Saturn-like planet with ring
    name: 'planet-purple',
    radius: 40,
    position: [380, -100, -600],
    color: 0x3d1f5c,
    emissive: 0x3d1f5c,
    emissiveIntensity: 0.7,
    rotationSpeed: 0.0005,
    ring: {
      innerRadius: 52,
      outerRadius: 76,
      color: 0x5a3a7a,
      opacity: 0.3,
      tilt: 0.5,
    },
  },
  {
    // Mars-like reddish planet
    name: 'planet-crimson',
    radius: 20,
    position: [-280, -200, -500],
    color: 0x6a2a1a,
    emissive: 0x6a2a1a,
    emissiveIntensity: 0.8,
    rotationSpeed: 0.001,
  },
];

// ── Non-interactive layer ───────────────────────────────────────────────────

/** Render-only layer index — camera can see it but raycaster ignores it. */
const BG_LAYER = 2;

// ── Builder ─────────────────────────────────────────────────────────────────

export interface SpaceCleanup {
  /** Remove all space objects from the scene and stop the animation loop. */
  dispose: () => void;
}

/**
 * Populate the given Three.js scene with background planets and a nebula
 * particle field. Returns a cleanup handle.
 */
export function addSpaceBackground(scene: THREE.Scene): SpaceCleanup {
  const objects: THREE.Object3D[] = [];
  let frameId: number | null = null;

  // ── Ambient light for planets ──
  const ambientLight = new THREE.AmbientLight(0x223355, 0.6);
  ambientLight.layers.set(BG_LAYER);
  scene.add(ambientLight);
  objects.push(ambientLight);

  const bgLight = new THREE.PointLight(0x4466aa, 1.2, 3000);
  bgLight.position.set(0, 0, 0);
  bgLight.layers.set(BG_LAYER);
  scene.add(bgLight);
  objects.push(bgLight);

  // ── Sun — bright glowing sphere with corona ─────────────────────────────
  const sunGeo = new THREE.SphereGeometry(60, 48, 48);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(-500, 300, -700);
  sun.layers.set(BG_LAYER);
  scene.add(sun);
  objects.push(sun);

  // Sun glow sprite (corona effect)
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const ctx = glowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255, 220, 60, 0.8)');
  gradient.addColorStop(0.3, 'rgba(255, 180, 40, 0.4)');
  gradient.addColorStop(0.6, 'rgba(255, 140, 20, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowSprite = new THREE.Sprite(glowMat);
  glowSprite.scale.set(350, 350, 1);
  glowSprite.position.copy(sun.position);
  glowSprite.layers.set(BG_LAYER);
  scene.add(glowSprite);
  objects.push(glowSprite);

  // Sun point light to illuminate nearby objects
  const sunLight = new THREE.PointLight(0xffdd44, 2, 2000);
  sunLight.position.copy(sun.position);
  sunLight.layers.set(BG_LAYER);
  scene.add(sunLight);
  objects.push(sunLight);

  // ── Moon — smaller grey sphere with craters effect ──────────────────────
  const moonGeo = new THREE.SphereGeometry(18, 32, 32);
  const moonMat = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    emissive: 0x444455,
    emissiveIntensity: 0.5,
    shininess: 5,
  });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.position.set(250, 200, -300);
  moon.layers.set(BG_LAYER);
  scene.add(moon);
  objects.push(moon);

  // ── Planets ───────────────────────────────────────────────────────────────

  const planetMeshes: THREE.Mesh[] = [];

  for (const def of PLANETS) {
    const geometry = new THREE.SphereGeometry(def.radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: def.color,
      emissive: def.emissive,
      emissiveIntensity: def.emissiveIntensity,
      shininess: 10,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...def.position);
    mesh.layers.set(BG_LAYER);
    mesh.name = def.name;

    scene.add(mesh);
    objects.push(mesh);
    planetMeshes.push(mesh);

    // Optional ring (Saturn-like)
    if (def.ring) {
      const ringGeo = new THREE.RingGeometry(
        def.ring.innerRadius,
        def.ring.outerRadius,
        64
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.ring.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: def.ring.opacity,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + def.ring.tilt;
      ringMesh.layers.set(BG_LAYER);

      mesh.add(ringMesh);
    }
  }

  // ── Nebula particle cloud ─────────────────────────────────────────────────

  const PARTICLE_COUNT = 1200;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  const nebulaColors = [
    new THREE.Color(0x1a0a3e), // deep violet
    new THREE.Color(0x0a1a3e), // deep blue
    new THREE.Color(0x3e0a1a), // deep crimson
    new THREE.Color(0x0a2a2a), // dark teal
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Spread particles in a large sphere behind the globe
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 600 + Math.random() * 1800;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = -(Math.abs(r * Math.cos(phi)) + 200); // push behind

    const col = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    sizes[i] = 2.5 + Math.random() * 4;
  }

  const nebulaGeo = new THREE.BufferGeometry();
  nebulaGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  nebulaGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  nebulaGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const nebulaMat = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const nebula = new THREE.Points(nebulaGeo, nebulaMat);
  nebula.layers.set(BG_LAYER);
  scene.add(nebula);
  objects.push(nebula);

  // ── Animation loop ────────────────────────────────────────────────────────

  let time = 0;
  function animate() {
    frameId = requestAnimationFrame(animate);
    time += 0.001;

    // Rotate planets
    for (let i = 0; i < PLANETS.length; i++) {
      planetMeshes[i].rotation.y += PLANETS[i].rotationSpeed;
    }

    // Slow sun rotation
    sun.rotation.y += 0.0003;

    // Moon orbits slowly around its starting position
    moon.position.x = 250 + Math.cos(time * 0.3) * 40;
    moon.position.y = 200 + Math.sin(time * 0.3) * 20;
    moon.rotation.y += 0.0008;

    // Very slow nebula drift
    nebula.rotation.y += 0.00005;
  }

  animate();

  // ── Cleanup ───────────────────────────────────────────────────────────────

  return {
    dispose() {
      if (frameId !== null) cancelAnimationFrame(frameId);

      for (const obj of objects) {
        scene.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      }
    },
  };
}
