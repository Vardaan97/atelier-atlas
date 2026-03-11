/**
 * High-quality solar system background for the 3D globe scene.
 * Sun with corona, moon, and planets orbiting with visible orbit trails.
 */

import * as THREE from 'three';

const BG_LAYER = 2;

interface OrbitingBody {
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  orbitTilt: number;
  orbitPhase: number; // starting angle
  selfRotation: number;
  yOffset: number;
}

export interface SpaceCleanup {
  dispose: () => void;
}

export function addSpaceBackground(scene: THREE.Scene): SpaceCleanup {
  const objects: THREE.Object3D[] = [];
  let frameId: number | null = null;

  // Sun position — everything orbits around this
  const SUN_POS = new THREE.Vector3(-400, 250, -800);

  // ── Lights ──────────────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0x334466, 0.5);
  ambient.layers.set(BG_LAYER);
  scene.add(ambient);
  objects.push(ambient);

  const sunLight = new THREE.PointLight(0xffdd44, 2.5, 3000);
  sunLight.position.copy(SUN_POS);
  sunLight.layers.set(BG_LAYER);
  scene.add(sunLight);
  objects.push(sunLight);

  // ── Sun sphere ──────────────────────────────────────────────────────────
  const sunGeo = new THREE.SphereGeometry(50, 48, 48);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.copy(SUN_POS);
  sun.layers.set(BG_LAYER);
  scene.add(sun);
  objects.push(sun);

  // Sun corona glow
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const ctx = glowCanvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 230, 80, 0.9)');
  grad.addColorStop(0.2, 'rgba(255, 200, 50, 0.5)');
  grad.addColorStop(0.5, 'rgba(255, 150, 30, 0.15)');
  grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(400, 400, 1);
  glow.position.copy(SUN_POS);
  glow.layers.set(BG_LAYER);
  scene.add(glow);
  objects.push(glow);

  // ── Helper: create orbit ring (visible path) ───────────────────────────
  function createOrbitRing(radius: number, tilt: number, color: number, opacity: number) {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(128);
    const geo = new THREE.BufferGeometry().setFromPoints(
      pts.map((p) => new THREE.Vector3(p.x, 0, p.y))
    );
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const ring = new THREE.Line(geo, mat);
    ring.position.copy(SUN_POS);
    ring.rotation.x = tilt;
    ring.layers.set(BG_LAYER);
    scene.add(ring);
    objects.push(ring);
  }

  // ── Helper: create planet with optional Saturn ring ─────────────────────
  function createPlanet(
    name: string,
    radius: number,
    color: number,
    emissive: number,
    emissiveIntensity: number,
    orbitRadius: number,
    orbitSpeed: number,
    orbitTilt: number,
    orbitPhase: number,
    yOffset: number,
    saturnRing?: { inner: number; outer: number; color: number; opacity: number },
  ): OrbitingBody {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive,
      emissiveIntensity,
      shininess: 15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.layers.set(BG_LAYER);
    mesh.name = name;
    scene.add(mesh);
    objects.push(mesh);

    if (saturnRing) {
      const rGeo = new THREE.RingGeometry(saturnRing.inner, saturnRing.outer, 64);
      const rMat = new THREE.MeshBasicMaterial({
        color: saturnRing.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: saturnRing.opacity,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = Math.PI / 2 + 0.4;
      rMesh.layers.set(BG_LAYER);
      mesh.add(rMesh);
    }

    // Draw orbit path
    createOrbitRing(orbitRadius, orbitTilt, color, 0.12);

    return { mesh, orbitRadius, orbitSpeed, orbitTilt, orbitPhase, selfRotation: orbitSpeed * 3, yOffset };
  }

  // ── Create solar system bodies ──────────────────────────────────────────
  const bodies: OrbitingBody[] = [];

  // Mercury — small, fast, close
  bodies.push(createPlanet('mercury', 8, 0x8c7a6b, 0x5a4a3a, 0.6, 120, 0.0008, 0.05, 0, 0));

  // Venus — slightly larger, warm orange
  bodies.push(createPlanet('venus', 12, 0xc9a855, 0x9a7a35, 0.5, 180, 0.0005, 0.08, 1.2, 10));

  // Mars — red, medium orbit
  bodies.push(createPlanet('mars', 10, 0xb44a2a, 0x7a2a1a, 0.7, 260, 0.0003, 0.04, 2.5, -15));

  // Jupiter — large, banded
  bodies.push(createPlanet('jupiter', 30, 0xc4a46a, 0x8a6a3a, 0.5, 370, 0.00015, 0.06, 4.0, 20));

  // Saturn — with rings
  bodies.push(createPlanet('saturn', 25, 0xd4b87a, 0x9a8a5a, 0.4, 480, 0.0001, 0.1, 5.5, -10,
    { inner: 34, outer: 50, color: 0xc9a855, opacity: 0.25 }
  ));

  // Neptune — distant, blue-ish
  bodies.push(createPlanet('neptune', 18, 0x2a4a8a, 0x1a2a5a, 0.6, 600, 0.00006, 0.03, 3.0, 5));

  // ── Moon (orbits Earth/globe, not the sun) ──────────────────────────────
  const moonGeo = new THREE.SphereGeometry(12, 32, 32);
  const moonMat = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    emissive: 0x555566,
    emissiveIntensity: 0.4,
    shininess: 5,
  });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.layers.set(BG_LAYER);
  scene.add(moon);
  objects.push(moon);

  // Moon orbit ring around globe origin (0,0,0)
  const moonOrbitCurve = new THREE.EllipseCurve(0, 0, 180, 180, 0, Math.PI * 2, false, 0);
  const moonOrbitPts = moonOrbitCurve.getPoints(96);
  const moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(
    moonOrbitPts.map((p) => new THREE.Vector3(p.x, 0, p.y))
  );
  const moonOrbitMat = new THREE.LineBasicMaterial({
    color: 0x888899,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  const moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
  moonOrbitLine.rotation.x = 0.3;
  moonOrbitLine.layers.set(BG_LAYER);
  scene.add(moonOrbitLine);
  objects.push(moonOrbitLine);

  // ── Nebula particles ────────────────────────────────────────────────────
  const PC = 1500;
  const pos = new Float32Array(PC * 3);
  const cols = new Float32Array(PC * 3);
  const nebColors = [
    new THREE.Color(0x1a0a3e),
    new THREE.Color(0x0a1a3e),
    new THREE.Color(0x3e0a1a),
    new THREE.Color(0x0a2a2a),
  ];
  for (let i = 0; i < PC; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 700 + Math.random() * 2000;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = -(Math.abs(r * Math.cos(phi)) + 300);
    const c = nebColors[Math.floor(Math.random() * nebColors.length)];
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  const nebGeo = new THREE.BufferGeometry();
  nebGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  nebGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const nebMat = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const nebula = new THREE.Points(nebGeo, nebMat);
  nebula.layers.set(BG_LAYER);
  scene.add(nebula);
  objects.push(nebula);

  // ── Animation loop ──────────────────────────────────────────────────────
  let time = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);
    time += 0.008;

    // Sun gentle pulsing glow
    const pulse = 1 + Math.sin(time * 0.5) * 0.05;
    glow.scale.set(400 * pulse, 400 * pulse, 1);
    sun.rotation.y += 0.0002;

    // Planets orbit the sun
    for (const body of bodies) {
      const angle = body.orbitPhase + time * body.orbitSpeed * 60;
      const x = SUN_POS.x + Math.cos(angle) * body.orbitRadius;
      const z = SUN_POS.z + Math.sin(angle) * body.orbitRadius;
      const y = SUN_POS.y + body.yOffset + Math.sin(angle) * body.orbitRadius * Math.sin(body.orbitTilt);
      body.mesh.position.set(x, y, z);
      body.mesh.rotation.y += body.selfRotation;
    }

    // Moon orbits the globe (origin) — tilted ellipse
    const moonAngle = time * 0.15;
    moon.position.set(
      Math.cos(moonAngle) * 180,
      Math.sin(moonAngle) * 180 * Math.sin(0.3),
      Math.sin(moonAngle) * 180 * Math.cos(0.3) - 50
    );
    moon.rotation.y += 0.001;

    // Nebula drift
    nebula.rotation.y += 0.00003;
  }

  animate();

  // ── Cleanup ─────────────────────────────────────────────────────────────
  return {
    dispose() {
      if (frameId !== null) cancelAnimationFrame(frameId);
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
    },
  };
}
