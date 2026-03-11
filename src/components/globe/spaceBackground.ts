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
    name: 'planet-blue',
    radius: 36,
    position: [-300, 180, -500],
    color: 0x1a3a6a,
    emissive: 0x1a3a6a,
    emissiveIntensity: 0.8,
    rotationSpeed: 0.0008,
  },
  {
    name: 'planet-purple',
    radius: 56,
    position: [420, -120, -750],
    color: 0x3d1f5c,
    emissive: 0x3d1f5c,
    emissiveIntensity: 0.7,
    rotationSpeed: 0.0005,
    ring: {
      innerRadius: 72,
      outerRadius: 104,
      color: 0x5a3a7a,
      opacity: 0.3,
      tilt: 0.5,
    },
  },
  {
    name: 'planet-amber',
    radius: 24,
    position: [280, 250, -400],
    color: 0x5a3210,
    emissive: 0x5a3210,
    emissiveIntensity: 0.9,
    rotationSpeed: 0.0012,
  },
  {
    name: 'planet-teal',
    radius: 44,
    position: [-450, -220, -800],
    color: 0x0f3d3d,
    emissive: 0x0f3d3d,
    emissiveIntensity: 0.7,
    rotationSpeed: 0.0006,
  },
  {
    name: 'planet-crimson',
    radius: 30,
    position: [160, -300, -600],
    color: 0x4a1520,
    emissive: 0x4a1520,
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

  // ── Ambient light for planets (scene already has directional from globe) ──
  const ambientLight = new THREE.AmbientLight(0x223355, 0.6);
  ambientLight.layers.set(BG_LAYER);
  scene.add(ambientLight);
  objects.push(ambientLight);

  // Dedicated point light to softly illuminate the background planets
  const bgLight = new THREE.PointLight(0x4466aa, 1.2, 3000);
  bgLight.position.set(0, 0, 0);
  bgLight.layers.set(BG_LAYER);
  scene.add(bgLight);
  objects.push(bgLight);

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

  function animate() {
    frameId = requestAnimationFrame(animate);

    // Rotate planets
    for (let i = 0; i < PLANETS.length; i++) {
      planetMeshes[i].rotation.y += PLANETS[i].rotationSpeed;
    }

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
