import * as THREE from 'three';

// Coordinate converter from normalized map coordinates (0..1) to 3D world units (X, Z)
export function mapToWorldCoords(mapX: number, mapY: number, worldW: number, worldH: number) {
  const x = (mapX - 0.5) * worldW;
  const z = (mapY - 0.5) * worldH;
  return { x, z };
}

// Authentic color palette matching the illustration's charming townhouses
export const CROQUIS_PALETTE = {
  walls: [
    0xd97706, // warm amber
    0xb45309, // pumpkin spice
    0x991b1b, // terracotta crimson
    0x1e3a8a, // deep midnight navy
    0x0f766e, // vintage teal
    0x4d7c0f, // olive moss
    0x6b21a8, // royal purple
    0x78350f, // rustic cedar brown
    0xca8a04, // harvest gold
    0x581c87, // spooky violet
    0x0369a1, // slate ocean blue
  ],
  roofs: [
    0x3f2314, // dark chocolate terracotta
    0x1e293b, // slate charcoal
    0x451a03, // burnt sienna
    0x27272a, // dark graphite
    0x581c87, // plum purple
    0x3b1c11, // espresso
  ],
  foliage: [
    0x14532d, // deep forest green
    0x166534, // rich evergreen
    0x0f766e, // spruce teal
    0x1e3a8a, // dark pine blue
    0x15803d, // bright moss green
    0x115e59, // dark teal
  ],
};

/**
 * 1. AESTHETIC 3D TOWNHOUSE
 * Multi-part composite model:
 * (1) Stone foundation plinth
 * (2) Main colorful facade walls
 * (3) Gabled beveled roof with fascia eaves and contrasting ridge beam
 * (4) Glowing warm windows with wooden muntins
 * (5) Recessed front door with entrance canopy & brass knob
 * (6) Brick chimney with stone raincap
 * (7) Micro pumpkin on the front step
 */
export function createHouseBadgeSprite(numberStr: string, hasCandy: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 70;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 160, 70);
    // Draw rounded badge background
    ctx.fillStyle = hasCandy ? 'rgba(217, 119, 6, 0.95)' : 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = hasCandy ? '#fef08a' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Fallback round rect
    const r = 14;
    const x = 6, y = 6, w = 148, h = 58;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // House Number Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = hasCandy ? `✨ #${numberStr} 🍬` : `#${numberStr}`;
    ctx.fillText(label, 80, 36);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.name = 'houseBadgeSprite';
  sprite.scale.set(1.5, 0.65, 1);
  return sprite;
}

export interface HouseOptions {
  houseId?: string;
  houseNumber?: string;
  streetName?: string;
  hasCandy?: boolean;
}

/**
 * 1. AESTHETIC 3D TOWNHOUSE
 * Multi-part composite model:
 * (1) Stone foundation plinth
 * (2) Main colorful facade walls
 * (3) Gabled beveled roof with fascia eaves and contrasting ridge beam
 * (4) Glowing warm windows with wooden muntins
 * (5) Recessed front door with entrance canopy & brass knob
 * (6) Brick chimney with stone raincap
 * (7) Micro pumpkin on the front step
 * (8) House number badge & candy glow effects
 */
export function createAestheticHouse(
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  wallColor: number,
  roofColor: number,
  hasChimney: boolean = true,
  rotationY: number = 0,
  options?: HouseOptions
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0.05, z); // Flush on top of croquis plane (y = 0.05)
  group.name = options?.houseId || 'aestheticHouse';
  group.userData = {
    isHouse: true,
    houseId: options?.houseId || '',
    houseNumber: options?.houseNumber || '',
    streetName: options?.streetName || '',
    hasCandy: Boolean(options?.hasCandy),
    w,
    d,
    h,
    baseY: 0.05,
  };

  // (1) Stone foundation trim
  const foundationH = 0.08;
  const foundationGeo = new THREE.BoxGeometry(w + 0.04, foundationH, d + 0.04);
  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.1,
  });
  const foundation = new THREE.Mesh(foundationGeo, foundationMat);
  foundation.position.y = foundationH / 2;
  foundation.receiveShadow = true;
  group.add(foundation);

  // (2) Main Facade Body
  const bodyH = h;
  const bodyGeo = new THREE.BoxGeometry(w, bodyH, d);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.65,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = foundationH + bodyH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // (3) Gabled Roof with overhang eaves
  // Triangular gable faces the front (+Z) and back (-Z) as illustrated in the croquis!
  const roofH = bodyH * 0.46;
  const roofOverhang = 0.09;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-w / 2 - roofOverhang, 0);
  roofShape.lineTo(0, roofH);
  roofShape.lineTo(w / 2 + roofOverhang, 0);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: d + roofOverhang * 2,
    bevelEnabled: false,
  });
  roofGeo.center();
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofColor,
    roughness: 0.5,
    metalness: 0.1,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = foundationH + bodyH + roofH / 2;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // Roof Ridge Beam along Z axis
  const ridgeGeo = new THREE.CylinderGeometry(0.025, 0.025, d + roofOverhang * 2.1, 6);
  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.7,
  });
  const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridge.position.y = foundationH + bodyH + roofH + 0.015;
  ridge.rotation.x = Math.PI / 2;
  group.add(ridge);

  // (4) Glowing warm windows with wood frames
  const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });

  const createDetailedWindow = (wx: number, wy: number) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(wx, wy, d / 2 + 0.015);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.25, bodyH * 0.28), winMat);
    winGroup.add(glass);

    // Window muntin horizontal
    const muntinH = new THREE.Mesh(new THREE.BoxGeometry(w * 0.25, 0.02, 0.01), frameMat);
    winGroup.add(muntinH);

    // Window muntin vertical
    const muntinV = new THREE.Mesh(new THREE.BoxGeometry(0.02, bodyH * 0.28, 0.01), frameMat);
    winGroup.add(muntinV);

    // Window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(w * 0.29, 0.03, 0.04), frameMat);
    sill.position.y = -bodyH * 0.14;
    winGroup.add(sill);

    return winGroup;
  };

  group.add(createDetailedWindow(-w * 0.23, foundationH + bodyH * 0.62));
  group.add(createDetailedWindow(w * 0.23, foundationH + bodyH * 0.62));

  // Back windows (so houses look architecturally complete from all orbit angles)
  const createBackWindow = (wx: number, wy: number) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(wx, wy, -d / 2 - 0.015);
    winGroup.rotation.y = Math.PI;

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.22, bodyH * 0.24), winMat);
    winGroup.add(glass);

    const muntinH = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, 0.018, 0.01), frameMat);
    winGroup.add(muntinH);

    const muntinV = new THREE.Mesh(new THREE.BoxGeometry(0.018, bodyH * 0.24, 0.01), frameMat);
    winGroup.add(muntinV);

    return winGroup;
  };
  group.add(createBackWindow(-w * 0.23, foundationH + bodyH * 0.65));
  group.add(createBackWindow(w * 0.23, foundationH + bodyH * 0.65));

  // (5) Recessed Front Door & Porch Step
  const doorW = w * 0.26;
  const doorH = bodyH * 0.44;
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.03), doorMat);
  door.position.set(0, foundationH + doorH / 2, d / 2 + 0.015);
  group.add(door);

  // Front porch step
  const stepGeo = new THREE.BoxGeometry(doorW + 0.12, 0.04, 0.14);
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const step = new THREE.Mesh(stepGeo, stepMat);
  step.position.set(0, 0.02, d / 2 + 0.07);
  group.add(step);

  // Golden door handle
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), handleMat);
  handle.position.set(doorW * 0.35, foundationH + doorH * 0.5, d / 2 + 0.035);
  group.add(handle);

  // Door canopy / visor
  const canopyGeo = new THREE.BoxGeometry(doorW + 0.1, 0.03, 0.12);
  const canopy = new THREE.Mesh(canopyGeo, frameMat);
  canopy.position.set(0, foundationH + doorH + 0.02, d / 2 + 0.06);
  group.add(canopy);

  // (6) Chimney
  if (hasChimney) {
    const chimW = 0.15;
    const chimH = roofH * 1.05;
    const chimMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 });
    const chim = new THREE.Mesh(new THREE.BoxGeometry(chimW, chimH, chimW), chimMat);
    chim.position.set(w * 0.25, foundationH + bodyH + roofH * 0.6, -d * 0.1);
    chim.castShadow = true;
    group.add(chim);

    // Stone raincap
    const capMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(chimW + 0.04, 0.025, chimW + 0.04), capMat);
    cap.position.set(w * 0.25, foundationH + bodyH + roofH * 0.6 + chimH / 2 + 0.012, -d * 0.1);
    group.add(cap);
  }

  // (7) Candy glow effects around the house (No floating badge labels above houses)
  const hasCandy = Boolean(options?.hasCandy);
  const houseNumber = options?.houseNumber || '';

  // Specialized Candy Glow System all around the house
  const candyGlowGroup = new THREE.Group();
  candyGlowGroup.name = 'candyGlowGroup';
  candyGlowGroup.visible = hasCandy;

  const maxDim = Math.max(w, d);

  // 1. Primary ground aura ring around the house perimeter
  const innerAuraGeo = new THREE.RingGeometry(maxDim * 0.45, maxDim * 1.45, 32);
  const innerAuraMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: hasCandy ? 0.8 : 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const innerAura = new THREE.Mesh(innerAuraGeo, innerAuraMat);
  innerAura.name = 'candyAuraRing';
  innerAura.rotation.x = -Math.PI / 2;
  innerAura.position.set(0, 0.04, 0);
  candyGlowGroup.add(innerAura);

  // 2. Secondary wide corona aura (soft warm glow around the house)
  const outerAuraGeo = new THREE.RingGeometry(maxDim * 1.3, maxDim * 2.3, 32);
  const outerAuraMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: hasCandy ? 0.45 : 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerAura = new THREE.Mesh(outerAuraGeo, outerAuraMat);
  outerAura.name = 'candyOuterAuraRing';
  outerAura.rotation.x = -Math.PI / 2;
  outerAura.position.set(0, 0.038, 0);
  candyGlowGroup.add(outerAura);

  // 3. Ethereal vertical aura halo cylinder around the house
  const auraCylinderGeo = new THREE.CylinderGeometry(maxDim * 0.95, maxDim * 1.3, h * 1.6, 24, 1, true);
  const auraCylinderMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: hasCandy ? 0.22 : 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const auraCylinder = new THREE.Mesh(auraCylinderGeo, auraCylinderMat);
  auraCylinder.name = 'candyAuraCylinder';
  auraCylinder.position.set(0, (h * 1.6) / 2, 0);
  candyGlowGroup.add(auraCylinder);

  // 4. Warm radiant point light illuminating the house and surrounding area
  const candyLight = new THREE.PointLight(0xf59e0b, hasCandy ? 2.6 : 0, 8.0);
  candyLight.name = 'candyPointLight';
  candyLight.position.set(0, foundationH + bodyH * 0.8, d / 2 + 0.3);
  candyGlowGroup.add(candyLight);

  group.add(candyGlowGroup);

  // Propagate houseId & isHouse to all child meshes for raycasting
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.houseId = options?.houseId || '';
      child.userData.isHouse = true;
      child.userData.houseNumber = houseNumber;
      child.userData.streetName = options?.streetName || '';
    }
  });

  // Apply Y-axis rotation (0 for facing South, Math.PI for facing North)
  group.rotation.y = rotationY;

  return group;
}

/**
 * Updates the visual state (candy glow) of an existing 3D house without adding number badges.
 */
export function updateHouseVisualState(
  houseGroup: THREE.Group,
  houseNumber: string,
  hasCandy: boolean
) {
  houseGroup.userData.houseNumber = houseNumber;
  houseGroup.userData.hasCandy = hasCandy;

  const candyGlowGroup = houseGroup.getObjectByName('candyGlowGroup');
  if (candyGlowGroup) {
    candyGlowGroup.visible = hasCandy;
  }

  // Update candy light
  const candyLight = houseGroup.getObjectByName('candyPointLight') as THREE.PointLight | undefined;
  if (candyLight) {
    candyLight.intensity = hasCandy ? 2.6 : 0;
  }

  // Update inner aura
  const aura = houseGroup.getObjectByName('candyAuraRing') as THREE.Mesh | undefined;
  if (aura && aura.material instanceof THREE.MeshBasicMaterial) {
    aura.material.opacity = hasCandy ? 0.8 : 0;
  }

  // Update outer aura
  const outerAura = houseGroup.getObjectByName('candyOuterAuraRing') as THREE.Mesh | undefined;
  if (outerAura && outerAura.material instanceof THREE.MeshBasicMaterial) {
    outerAura.material.opacity = hasCandy ? 0.45 : 0;
  }

  // Update vertical cylinder halo
  const cylinder = houseGroup.getObjectByName('candyAuraCylinder') as THREE.Mesh | undefined;
  if (cylinder && cylinder.material instanceof THREE.MeshBasicMaterial) {
    cylinder.material.opacity = hasCandy ? 0.22 : 0;
  }

  // Remove any obsolete badge sprite if present
  const existingBadge = houseGroup.getObjectByName('houseBadgeSprite');
  if (existingBadge) {
    houseGroup.remove(existingBadge);
  }

  // Propagate to meshes
  houseGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.houseNumber = houseNumber;
      child.userData.hasCandy = hasCandy;
    }
  });
}


/**
 * 2. AESTHETIC PINE / CONIFER TREE
 * Layered 3-tier stylized cone tree with woody trunk and root flare
 */
export function createAestheticPine(
  x: number,
  z: number,
  scale: number = 1.0,
  color: number = 0x14532d
): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0.05, z);
  tree.userData = { type: 'pine', seed: Math.random() * 10 };

  // Trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, 0.8 * scale, 6), trunkMat);
  trunk.position.y = 0.4 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage Material with flat shading for charming low-poly look
  const folMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true,
  });

  // Tier 1 (Bottom large cone)
  const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.85 * scale, 0.95 * scale, 7), folMat);
  cone1.position.y = 0.9 * scale;
  cone1.castShadow = true;
  tree.add(cone1);

  // Tier 2 (Middle cone)
  const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.68 * scale, 0.85 * scale, 7), folMat);
  cone2.position.y = 1.45 * scale;
  cone2.rotation.y = 0.35;
  cone2.castShadow = true;
  tree.add(cone2);

  // Tier 3 (Top crown cone)
  const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.48 * scale, 0.75 * scale, 7), folMat);
  cone3.position.y = 1.95 * scale;
  cone3.rotation.y = -0.2;
  cone3.castShadow = true;
  tree.add(cone3);

  return tree;
}

/**
 * 3. AESTHETIC DECIDUOUS ROUND TREE
 * Fluffy cloud-like canopy with multiple lobed spheres
 */
export function createAestheticDeciduousTree(
  x: number,
  z: number,
  scale: number = 1.0,
  color: number = 0x166534
): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0.05, z);
  tree.userData = { type: 'deciduous', seed: Math.random() * 10 };

  // Trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.16 * scale, 0.9 * scale, 6), trunkMat);
  trunk.position.y = 0.45 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  // Fluffy multi-lobed canopy
  const folMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    flatShading: true,
  });

  const centerSphere = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68 * scale, 1), folMat);
  centerSphere.position.y = 1.35 * scale;
  centerSphere.castShadow = true;
  tree.add(centerSphere);

  const lobe1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48 * scale, 1), folMat);
  lobe1.position.set(-0.35 * scale, 1.25 * scale, 0.2 * scale);
  lobe1.castShadow = true;
  tree.add(lobe1);

  const lobe2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52 * scale, 1), folMat);
  lobe2.position.set(0.35 * scale, 1.3 * scale, -0.15 * scale);
  lobe2.castShadow = true;
  tree.add(lobe2);

  const topLobe = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 * scale, 1), folMat);
  topLobe.position.set(0.05 * scale, 1.7 * scale, 0.05 * scale);
  topLobe.castShadow = true;
  tree.add(topLobe);

  return tree;
}

/**
 * 4. AESTHETIC 3D PUMPKIN (JACK-O'-LANTERN)
 * Multi-lobed ribbed sphere with curved green stem, carved glowing face, and inner candle flame
 */
export function createAestheticPumpkin(
  x: number,
  z: number,
  scale: number = 1.0,
  id: string = 'pumpkin'
): THREE.Group {
  const pkinGroup = new THREE.Group();
  pkinGroup.position.set(x, 0.05, z);
  pkinGroup.name = `pumpkin_${id}`;

  const r = 0.32 * scale;
  const pkinMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.45,
    metalness: 0.05,
  });

  // Base pumpkin body
  const body = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), pkinMat);
  body.scale.set(1.18, 0.92, 1.18);
  body.position.y = r * 0.92;
  body.castShadow = true;
  pkinGroup.add(body);

  // Curved Stem
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * scale, 0.05 * scale, 0.22 * scale, 6), stemMat);
  stem.position.set(0, (r * 0.92) * 2 + 0.08 * scale, 0);
  stem.rotation.z = 0.25;
  stem.rotation.x = -0.15;
  pkinGroup.add(stem);

  // Glowing Carved Facial Features
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  // Left Eye
  const eyeL = new THREE.Mesh(new THREE.ConeGeometry(0.065 * scale, 0.06 * scale, 3), glowMat);
  eyeL.position.set(-0.11 * scale, r * 1.1, r * 1.12);
  eyeL.rotation.x = Math.PI / 2;
  pkinGroup.add(eyeL);

  // Right Eye
  const eyeR = new THREE.Mesh(new THREE.ConeGeometry(0.065 * scale, 0.06 * scale, 3), glowMat);
  eyeR.position.set(0.11 * scale, r * 1.1, r * 1.12);
  eyeR.rotation.x = Math.PI / 2;
  pkinGroup.add(eyeR);

  // Jagged Mouth
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.05 * scale, 0.04 * scale), glowMat);
  mouth.position.set(0, r * 0.75, r * 1.14);
  pkinGroup.add(mouth);

  // Warm candlelight point light
  const candleLight = new THREE.PointLight(0xf59e0b, 1.1, 4.0 * scale);
  candleLight.position.set(0, r * 1.0, r * 0.5);
  pkinGroup.add(candleLight);

  return pkinGroup;
}

/**
 * 5. AESTHETIC 3D GHOST
 * Ethereal floating apparition with translucent glow, floating animation support
 */
export function createAestheticGhost(
  x: number,
  z: number,
  scale: number = 1.0,
  id: string = 'ghost'
): THREE.Group {
  const ghost = new THREE.Group();
  ghost.position.set(x, 1.6, z);
  ghost.userData = { baseY: 1.6, seed: Math.random() * 10, id };

  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
    emissive: 0x93c5fd,
    emissiveIntensity: 0.45,
  });

  // Dome head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 16, 16), ghostMat);
  head.scale.set(0.9, 1.3, 0.9);
  ghost.add(head);

  // Bottom skirt ripple
  const skirtMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    emissive: 0x93c5fd,
    emissiveIntensity: 0.35,
  });
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * scale, 0.48 * scale, 0.45 * scale, 12, 1, true), skirtMat);
  skirt.position.y = -0.35 * scale;
  ghost.add(skirt);

  // Dark expressive eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.075 * scale, 8, 8), eyeMat);
  eyeL.position.set(-0.14 * scale, 0.12 * scale, 0.35 * scale);
  ghost.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.075 * scale, 8, 8), eyeMat);
  eyeR.position.set(0.14 * scale, 0.12 * scale, 0.35 * scale);
  ghost.add(eyeR);

  // Spooky mouth
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.065 * scale, 8, 8), eyeMat);
  mouth.position.set(0, -0.06 * scale, 0.37 * scale);
  mouth.scale.set(0.8, 1.4, 0.8);
  ghost.add(mouth);

  return ghost;
}

/**
 * 6. AESTHETIC HAY BALE
 * Textured golden straw cylinder with twine bindings
 */
export function createAestheticHayBale(
  x: number,
  z: number,
  scale: number = 1.0,
  rotationY: number = 0
): THREE.Group {
  const baleGroup = new THREE.Group();
  baleGroup.position.set(x, 0.05, z);

  const r = 0.3 * scale;
  const l = 0.65 * scale;

  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 16), strawMat);
  cylinder.rotation.z = Math.PI / 2;
  cylinder.position.y = r;
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  baleGroup.add(cylinder);

  // Twine ropes
  const twineMat = new THREE.MeshBasicMaterial({ color: 0x78350f });
  const twine1 = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.02, 6, 24), twineMat);
  twine1.rotation.y = Math.PI / 2;
  twine1.position.set(-l * 0.25, r, 0);
  baleGroup.add(twine1);

  const twine2 = new THREE.Mesh(new THREE.TorusGeometry(r + 0.01, 0.02, 6, 24), twineMat);
  twine2.rotation.y = Math.PI / 2;
  twine2.position.set(l * 0.25, r, 0);
  baleGroup.add(twine2);

  baleGroup.rotation.y = rotationY;
  return baleGroup;
}

/**
 * 7. AESTHETIC VINTAGE STREET LAMP
 * Victorian wrought-iron lamp post with warm amber lantern cage & point light
 */
export function createAestheticStreetLamp(
  x: number,
  z: number,
  scale: number = 1.0
): THREE.Group {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0.05, z);

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.5,
    metalness: 0.8,
  });

  // Base plinth
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.15 * scale, 8), ironMat);
  base.position.y = 0.075 * scale;
  lamp.add(base);

  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * scale, 0.045 * scale, 1.4 * scale, 8), ironMat);
  pole.position.y = (0.15 + 0.7) * scale;
  lamp.add(pole);

  // Lantern collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.04 * scale, 0.06 * scale, 6), ironMat);
  collar.position.y = 1.58 * scale;
  lamp.add(collar);

  // Glowing lantern glass
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.065 * scale, 0.05 * scale, 0.16 * scale, 6), glassMat);
  glass.position.y = 1.68 * scale;
  lamp.add(glass);

  // Lantern iron cap
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.09 * scale, 0.08 * scale, 6), ironMat);
  cap.position.y = 1.8 * scale;
  lamp.add(cap);

  // Warm amber street glow light
  const light = new THREE.PointLight(0xfef08a, 0.65, 4.0 * scale);
  light.position.y = 1.7 * scale;
  lamp.add(light);

  return lamp;
}
