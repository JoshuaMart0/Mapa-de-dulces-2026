import * as THREE from 'three';
import { HouseData } from '../types';

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

// =========================================================================
// HIGH-PERFORMANCE GEOMETRY & MATERIAL REUSE CACHE
// Eliminates thousands of redundant allocations and GPU state changes
// =========================================================================
class ResourcePool {
  private boxGeos = new Map<string, THREE.BoxGeometry>();
  private cylGeos = new Map<string, THREE.CylinderGeometry>();
  private coneGeos = new Map<string, THREE.ConeGeometry>();
  private sphereGeos = new Map<string, THREE.SphereGeometry>();
  private roofGeos = new Map<string, THREE.BufferGeometry>();
  private ringGeos = new Map<string, THREE.RingGeometry>();
  private wallMats = new Map<number, THREE.MeshStandardMaterial>();
  private roofMats = new Map<number, THREE.MeshStandardMaterial>();
  private foliageMats = new Map<number, THREE.MeshStandardMaterial>();

  // Shared reusable materials
  public foundationMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.1,
  });

  public frameMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.8,
  });

  public winMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });

  public doorMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.8,
  });

  public stepMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
  });

  public handleMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.8,
    roughness: 0.2,
  });

  public chimneyMat = new THREE.MeshStandardMaterial({
    color: 0x7c2d12,
    roughness: 0.8,
  });

  public ridgeMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.7,
  });

  public pkinMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.45,
    metalness: 0.05,
    emissive: 0x9a3412,
    emissiveIntensity: 0.35,
  });

  public pkinStemMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.8,
  });

  public pkinGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });

  public treeTrunkPineMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.9,
  });

  public treeTrunkDecidMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
  });

  public ironMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.5,
    metalness: 0.8,
  });

  public lampGlassMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });

  public ghostMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
    emissive: 0x93c5fd,
    emissiveIntensity: 0.45,
  });

  public ghostSkirtMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    emissive: 0x93c5fd,
    emissiveIntensity: 0.35,
  });

  public ghostEyeMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
  });

  public strawMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.9,
    metalness: 0.05,
  });

  public twineMat = new THREE.MeshBasicMaterial({
    color: 0x78350f,
  });

  getBox(w: number, h: number, d: number) {
    const key = `${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let geo = this.boxGeos.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      this.boxGeos.set(key, geo);
    }
    return geo;
  }

  getCylinder(rt: number, rb: number, h: number, seg: number = 8) {
    const key = `${rt.toFixed(3)}_${rb.toFixed(3)}_${h.toFixed(3)}_${seg}`;
    let geo = this.cylGeos.get(key);
    if (!geo) {
      geo = new THREE.CylinderGeometry(rt, rb, h, seg);
      this.cylGeos.set(key, geo);
    }
    return geo;
  }

  getCone(r: number, h: number, seg: number = 7) {
    const key = `${r.toFixed(3)}_${h.toFixed(3)}_${seg}`;
    let geo = this.coneGeos.get(key);
    if (!geo) {
      geo = new THREE.ConeGeometry(r, h, seg);
      this.coneGeos.set(key, geo);
    }
    return geo;
  }

  getSphere(r: number, ws: number = 10, hs: number = 10) {
    const key = `${r.toFixed(3)}_${ws}_${hs}`;
    let geo = this.sphereGeos.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(r, ws, hs);
      this.sphereGeos.set(key, geo);
    }
    return geo;
  }

  getRing(inner: number, outer: number, seg: number = 24) {
    const key = `${inner.toFixed(3)}_${outer.toFixed(3)}_${seg}`;
    let geo = this.ringGeos.get(key);
    if (!geo) {
      geo = new THREE.RingGeometry(inner, outer, seg);
      this.ringGeos.set(key, geo);
    }
    return geo;
  }

  getRoof(w: number, d: number, bodyH: number) {
    const roofH = bodyH * 0.46;
    const roofOverhang = 0.09;
    const key = `${w.toFixed(3)}_${d.toFixed(3)}_${bodyH.toFixed(3)}`;
    let geo = this.roofGeos.get(key);
    if (!geo) {
      const roofShape = new THREE.Shape();
      roofShape.moveTo(-w / 2 - roofOverhang, 0);
      roofShape.lineTo(0, roofH);
      roofShape.lineTo(w / 2 + roofOverhang, 0);
      roofShape.closePath();

      geo = new THREE.ExtrudeGeometry(roofShape, {
        depth: d + roofOverhang * 2,
        bevelEnabled: false,
      });
      geo.center();
      this.roofGeos.set(key, geo);
    }
    return { geo, roofH, roofOverhang };
  }

  getWallMat(color: number) {
    let mat = this.wallMats.get(color);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.65,
        metalness: 0.1,
      });
      this.wallMats.set(color, mat);
    }
    return mat;
  }

  getRoofMat(color: number) {
    let mat = this.roofMats.get(color);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.1,
      });
      this.roofMats.set(color, mat);
    }
    return mat;
  }

  getFoliageMat(color: number) {
    let mat = this.foliageMats.get(color);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
        metalness: 0.05,
        flatShading: true,
      });
      this.foliageMats.set(color, mat);
    }
    return mat;
  }
}

export const pool = new ResourcePool();

export interface HouseOptions {
  houseId?: string;
  houseNumber?: string;
  streetName?: string;
  hasCandy?: boolean;
}

/**
 * 1. HIGH-PERFORMANCE AESTHETIC 3D TOWNHOUSE
 * Multi-part composite model with shared pooled geometries & materials.
 * Window geometry is streamlined to keep draw calls minimal while preserving the cozy visual style.
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
  group.position.set(x, 0.05, z);
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

  // (1) Stone foundation
  const foundationH = 0.08;
  const foundation = new THREE.Mesh(
    pool.getBox(w + 0.04, foundationH, d + 0.04),
    pool.foundationMat
  );
  foundation.position.y = foundationH / 2;
  group.add(foundation);

  // (2) Main Facade Body
  const bodyH = h;
  const body = new THREE.Mesh(
    pool.getBox(w, bodyH, d),
    pool.getWallMat(wallColor)
  );
  body.position.y = foundationH + bodyH / 2;
  body.castShadow = true;
  group.add(body);

  // (3) Gabled Roof
  const { geo: roofGeo, roofH, roofOverhang } = pool.getRoof(w, d, bodyH);
  const roof = new THREE.Mesh(roofGeo, pool.getRoofMat(roofColor));
  roof.position.y = foundationH + bodyH + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // Roof Ridge Beam
  const ridge = new THREE.Mesh(
    pool.getCylinder(0.025, 0.025, d + roofOverhang * 2.1, 6),
    pool.ridgeMat
  );
  ridge.position.y = foundationH + bodyH + roofH + 0.015;
  ridge.rotation.x = Math.PI / 2;
  group.add(ridge);

  // (4) Streamlined Glowing Windows (Front & Back)
  // Window frame & glowing pane
  const winFrameGeo = pool.getBox(w * 0.28, bodyH * 0.32, 0.02);
  const winGlassGeo = pool.getBox(w * 0.24, bodyH * 0.28, 0.025);

  const addWindow = (wx: number, wy: number, isBack: boolean = false) => {
    const zOffset = isBack ? -d / 2 - 0.01 : d / 2 + 0.01;
    const winGroup = new THREE.Group();
    winGroup.position.set(wx, wy, zOffset);
    if (isBack) winGroup.rotation.y = Math.PI;

    const frame = new THREE.Mesh(winFrameGeo, pool.frameMat);
    const glass = new THREE.Mesh(winGlassGeo, pool.winMat);
    winGroup.add(frame);
    winGroup.add(glass);
    group.add(winGroup);
  };

  const winY = foundationH + bodyH * 0.62;
  addWindow(-w * 0.24, winY, false);
  addWindow(w * 0.24, winY, false);
  addWindow(-w * 0.24, winY, true);
  addWindow(w * 0.24, winY, true);

  // (5) Recessed Front Door & Porch Step
  const doorW = w * 0.26;
  const doorH = bodyH * 0.44;
  const door = new THREE.Mesh(
    pool.getBox(doorW, doorH, 0.03),
    pool.doorMat
  );
  door.position.set(0, foundationH + doorH / 2, d / 2 + 0.015);
  group.add(door);

  // Front step
  const step = new THREE.Mesh(
    pool.getBox(doorW + 0.12, 0.04, 0.14),
    pool.stepMat
  );
  step.position.set(0, 0.02, d / 2 + 0.07);
  group.add(step);

  // Door canopy
  const canopy = new THREE.Mesh(
    pool.getBox(doorW + 0.1, 0.03, 0.12),
    pool.frameMat
  );
  canopy.position.set(0, foundationH + doorH + 0.02, d / 2 + 0.06);
  group.add(canopy);

  // (6) Chimney
  if (hasChimney) {
    const chimW = 0.15;
    const chimH = roofH * 1.05;
    const chim = new THREE.Mesh(
      pool.getBox(chimW, chimH, chimW),
      pool.chimneyMat
    );
    chim.position.set(w * 0.25, foundationH + bodyH + roofH * 0.6, -d * 0.1);
    group.add(chim);

    const cap = new THREE.Mesh(
      pool.getBox(chimW + 0.04, 0.025, chimW + 0.04),
      pool.foundationMat
    );
    cap.position.set(w * 0.25, foundationH + bodyH + roofH * 0.6 + chimH / 2 + 0.012, -d * 0.1);
    group.add(cap);
  }

  // (7) Candy Glow System (Rings & Halo, zero heavy point lights)
  const hasCandy = Boolean(options?.hasCandy);
  const houseNumber = options?.houseNumber || '';

  const candyGlowGroup = new THREE.Group();
  candyGlowGroup.name = 'candyGlowGroup';
  candyGlowGroup.visible = hasCandy;

  const maxDim = Math.max(w, d);

  // 1. Primary ground aura ring
  const innerAuraMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: hasCandy ? 0.8 : 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const innerAura = new THREE.Mesh(
    pool.getRing(maxDim * 0.45, maxDim * 1.45, 24),
    innerAuraMat
  );
  innerAura.name = 'candyAuraRing';
  innerAura.rotation.x = -Math.PI / 2;
  innerAura.position.set(0, 0.052, 0);
  candyGlowGroup.add(innerAura);

  // 2. Secondary corona aura
  const outerAuraMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: hasCandy ? 0.45 : 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerAura = new THREE.Mesh(
    pool.getRing(maxDim * 1.3, maxDim * 2.3, 24),
    outerAuraMat
  );
  outerAura.name = 'candyOuterAuraRing';
  outerAura.rotation.x = -Math.PI / 2;
  outerAura.position.set(0, 0.051, 0);
  candyGlowGroup.add(outerAura);

  // 3. Vertical aura cylinder halo
  const auraCylinderMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: hasCandy ? 0.22 : 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const auraCylinder = new THREE.Mesh(
    pool.getCylinder(maxDim * 0.95, maxDim * 1.3, h * 1.6, 16),
    auraCylinderMat
  );
  auraCylinder.name = 'candyAuraCylinder';
  auraCylinder.position.set(0, (h * 1.6) / 2 + 0.05, 0);
  candyGlowGroup.add(auraCylinder);

  // Attach candy glow group directly to the house group
  group.add(candyGlowGroup);

  // (8) Floating 3D House Number Badge Label (visible when house gives candy)
  const badgeY = foundationH + bodyH + roofH + 1.35;
  const badge = createHouseBadgeSprite(
    houseNumber || '?',
    options?.houseId,
    options?.streetName
  );
  badge.position.set(0, badgeY, 0);
  badge.visible = hasCandy;
  group.add(badge);
  group.userData.houseBadgeSprite = badge;

  // (9) Generous invisible hit volume covering house AND the entire floating tag above it
  const totalHitHeight = foundationH + bodyH + roofH + 2.8;
  const hitMesh = new THREE.Mesh(
    pool.getBox(w * 1.6, totalHitHeight, d * 1.6),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  hitMesh.position.set(0, totalHitHeight / 2, 0);
  hitMesh.name = 'houseClickHitBox';
  hitMesh.userData = {
    isHouse: true,
    houseId: options?.houseId || '',
    houseNumber,
    streetName: options?.streetName || '',
  };
  group.add(hitMesh);

  // Direct fast-access references stored on userData for O(1) animation
  group.userData.candyGlowGroup = candyGlowGroup;
  group.userData.candyAuraRing = innerAura;
  group.userData.candyOuterAuraRing = outerAura;
  group.userData.candyAuraCylinder = auraCylinder;

  // Propagate houseId & isHouse to child meshes for raycasting
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.houseId = options?.houseId || '';
      child.userData.isHouse = true;
      child.userData.houseNumber = houseNumber;
      child.userData.streetName = options?.streetName || '';
    }
  });

  group.rotation.y = rotationY;
  return group;
}

/**
 * Creates a crisp floating 3D badge showing the house number above the roof.
 * High-resolution canvas & enlarged sprite scale ensure high visibility from far distances.
 */
export function createHouseBadgeSprite(
  numberStr: string,
  houseId?: string,
  streetName?: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 180);

    // Glowing badge pill background
    const x = 12, y = 12, w = 488, h = 156, r = 44;
    ctx.beginPath();
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

    // Vibrant Halloween gradient (bright amber-400 to bold orange-600)
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#fbbf24'); // amber-400
    grad.addColorStop(0.5, '#f59e0b'); // amber-500
    grad.addColorStop(1, '#ea580c'); // orange-600
    ctx.fillStyle = grad;

    // Dark drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    // Reset shadow for crisp border
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Bright high-contrast white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Inner subtle darker rim for 3D depth
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text: Large bold House Number with candy icon
    const isSpecialNamed = numberStr.toLowerCase().includes('caseta') || numberStr.toLowerCase().includes('inicio');
    const label = isSpecialNamed
      ? `${numberStr} 🍬`
      : (numberStr && numberStr !== '?' ? `#${numberStr} 🍬` : '🍬 DULCES');

    ctx.font = '900 70px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dark black outline around text for ultra high contrast
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.strokeText(label, 256, 92);

    // Bright white fill
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 256, 92);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.name = 'houseBadgeSprite';
  // Generous scale to be easily legible across the whole 3D neighborhood
  sprite.scale.set(3.8, 1.35, 1);
  sprite.userData = {
    isHouse: true,
    isBadge: true,
    houseId: houseId || '',
    houseNumber: numberStr,
    streetName: streetName || '',
  };
  return sprite;
}

/**
 * Updates the visual state (candy glow and floating house number badge) of an existing 3D house.
 */
export function updateHouseVisualState(
  houseGroup: THREE.Group,
  houseNumber: string,
  hasCandy: boolean
) {
  houseGroup.userData.houseNumber = houseNumber;
  houseGroup.userData.hasCandy = hasCandy;

  const candyGlowGroup = houseGroup.userData.candyGlowGroup as THREE.Group | undefined;
  if (candyGlowGroup) {
    candyGlowGroup.visible = hasCandy;
  }

  const aura = houseGroup.userData.candyAuraRing as THREE.Mesh | undefined;
  if (aura && aura.material instanceof THREE.MeshBasicMaterial) {
    aura.material.opacity = hasCandy ? 0.8 : 0;
  }

  const outerAura = houseGroup.userData.candyOuterAuraRing as THREE.Mesh | undefined;
  if (outerAura && outerAura.material instanceof THREE.MeshBasicMaterial) {
    outerAura.material.opacity = hasCandy ? 0.45 : 0;
  }

  const cylinder = houseGroup.userData.candyAuraCylinder as THREE.Mesh | undefined;
  if (cylinder && cylinder.material instanceof THREE.MeshBasicMaterial) {
    cylinder.material.opacity = hasCandy ? 0.22 : 0;
  }

  // Update floating house number badge above roof
  let badge = houseGroup.userData.houseBadgeSprite as THREE.Sprite | undefined;
  if (!badge) {
    badge = houseGroup.getObjectByName('houseBadgeSprite') as THREE.Sprite | undefined;
    if (badge) houseGroup.userData.houseBadgeSprite = badge;
  }

  if (hasCandy) {
    if (badge) {
      houseGroup.remove(badge);
      if (badge.material.map) badge.material.map.dispose();
      badge.material.dispose();
    }
    const bodyH = houseGroup.userData.h || 1.1;
    const roofH = bodyH * 0.46;
    const badgeY = 0.08 + bodyH + roofH + 1.35;
    const newBadge = createHouseBadgeSprite(
      houseNumber || '?',
      houseGroup.userData.houseId,
      houseGroup.userData.streetName
    );
    newBadge.position.set(0, badgeY, 0);
    newBadge.visible = true;
    houseGroup.add(newBadge);
    houseGroup.userData.houseBadgeSprite = newBadge;
  } else if (badge) {
    badge.visible = false;
  }

  houseGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.houseNumber = houseNumber;
      child.userData.hasCandy = hasCandy;
    }
  });
}

/**
 * 2. HIGH-PERFORMANCE AESTHETIC PINE TREE
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
  const trunk = new THREE.Mesh(
    pool.getCylinder(0.08 * scale, 0.14 * scale, 0.8 * scale, 6),
    pool.treeTrunkPineMat
  );
  trunk.position.y = 0.4 * scale;
  tree.add(trunk);

  const folMat = pool.getFoliageMat(color);

  // Cones
  const cone1 = new THREE.Mesh(pool.getCone(0.85 * scale, 0.95 * scale, 6), folMat);
  cone1.position.y = 0.9 * scale;
  cone1.castShadow = true;
  tree.add(cone1);

  const cone2 = new THREE.Mesh(pool.getCone(0.68 * scale, 0.85 * scale, 6), folMat);
  cone2.position.y = 1.45 * scale;
  cone2.rotation.y = 0.35;
  tree.add(cone2);

  const cone3 = new THREE.Mesh(pool.getCone(0.48 * scale, 0.75 * scale, 6), folMat);
  cone3.position.y = 1.95 * scale;
  cone3.rotation.y = -0.2;
  tree.add(cone3);

  return tree;
}

/**
 * 3. HIGH-PERFORMANCE AESTHETIC DECIDUOUS TREE
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

  const trunk = new THREE.Mesh(
    pool.getCylinder(0.09 * scale, 0.16 * scale, 0.9 * scale, 6),
    pool.treeTrunkDecidMat
  );
  trunk.position.y = 0.45 * scale;
  tree.add(trunk);

  const folMat = pool.getFoliageMat(color);

  const centerSphere = new THREE.Mesh(pool.getSphere(0.68 * scale, 8, 8), folMat);
  centerSphere.position.y = 1.35 * scale;
  centerSphere.castShadow = true;
  tree.add(centerSphere);

  const lobe1 = new THREE.Mesh(pool.getSphere(0.48 * scale, 6, 6), folMat);
  lobe1.position.set(-0.35 * scale, 1.25 * scale, 0.2 * scale);
  tree.add(lobe1);

  const lobe2 = new THREE.Mesh(pool.getSphere(0.52 * scale, 6, 6), folMat);
  lobe2.position.set(0.35 * scale, 1.3 * scale, -0.15 * scale);
  tree.add(lobe2);

  const topLobe = new THREE.Mesh(pool.getSphere(0.45 * scale, 6, 6), folMat);
  topLobe.position.set(0.05 * scale, 1.7 * scale, 0.05 * scale);
  tree.add(topLobe);

  return tree;
}

/**
 * 4. HIGH-PERFORMANCE AESTHETIC PUMPKIN (JACK-O'-LANTERN)
 * Self-illuminating carved face and glowing emissive body without heavy point lights.
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
  const body = new THREE.Mesh(pool.getSphere(r, 10, 8), pool.pkinMat);
  body.scale.set(1.18, 0.92, 1.18);
  body.position.y = r * 0.92;
  pkinGroup.add(body);

  // Stem
  const stem = new THREE.Mesh(
    pool.getCylinder(0.035 * scale, 0.05 * scale, 0.22 * scale, 6),
    pool.pkinStemMat
  );
  stem.position.set(0, (r * 0.92) * 2 + 0.08 * scale, 0);
  stem.rotation.z = 0.25;
  stem.rotation.x = -0.15;
  pkinGroup.add(stem);

  // Carved Eyes & Mouth
  const eyeL = new THREE.Mesh(pool.getCone(0.065 * scale, 0.06 * scale, 3), pool.pkinGlowMat);
  eyeL.position.set(-0.11 * scale, r * 1.1, r * 1.12);
  eyeL.rotation.x = Math.PI / 2;
  pkinGroup.add(eyeL);

  const eyeR = new THREE.Mesh(pool.getCone(0.065 * scale, 0.06 * scale, 3), pool.pkinGlowMat);
  eyeR.position.set(0.11 * scale, r * 1.1, r * 1.12);
  eyeR.rotation.x = Math.PI / 2;
  pkinGroup.add(eyeR);

  const mouth = new THREE.Mesh(pool.getBox(0.18 * scale, 0.05 * scale, 0.04 * scale), pool.pkinGlowMat);
  mouth.position.set(0, r * 0.75, r * 1.14);
  pkinGroup.add(mouth);

  return pkinGroup;
}

/**
 * 5. HIGH-PERFORMANCE AESTHETIC GHOST
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

  const head = new THREE.Mesh(pool.getSphere(0.42 * scale, 12, 12), pool.ghostMat);
  head.scale.set(0.9, 1.3, 0.9);
  ghost.add(head);

  const skirt = new THREE.Mesh(
    pool.getCylinder(0.38 * scale, 0.48 * scale, 0.45 * scale, 10),
    pool.ghostSkirtMat
  );
  skirt.position.y = -0.35 * scale;
  ghost.add(skirt);

  const eyeL = new THREE.Mesh(pool.getSphere(0.075 * scale, 6, 6), pool.ghostEyeMat);
  eyeL.position.set(-0.14 * scale, 0.12 * scale, 0.35 * scale);
  ghost.add(eyeL);

  const eyeR = new THREE.Mesh(pool.getSphere(0.075 * scale, 6, 6), pool.ghostEyeMat);
  eyeR.position.set(0.14 * scale, 0.12 * scale, 0.35 * scale);
  ghost.add(eyeR);

  const mouth = new THREE.Mesh(pool.getSphere(0.065 * scale, 6, 6), pool.ghostEyeMat);
  mouth.position.set(0, -0.06 * scale, 0.37 * scale);
  mouth.scale.set(0.8, 1.4, 0.8);
  ghost.add(mouth);

  return ghost;
}

/**
 * 6. HIGH-PERFORMANCE AESTHETIC HAY BALE
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

  const cylinder = new THREE.Mesh(pool.getCylinder(r, r, l, 12), pool.strawMat);
  cylinder.rotation.z = Math.PI / 2;
  cylinder.position.y = r;
  baleGroup.add(cylinder);

  baleGroup.rotation.y = rotationY;
  return baleGroup;
}

/**
 * 7. HIGH-PERFORMANCE AESTHETIC STREET LAMP
 * Victorian wrought-iron lamp post with warm luminous lantern glass.
 */
export function createAestheticStreetLamp(
  x: number,
  z: number,
  scale: number = 1.0
): THREE.Group {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0.05, z);

  // Base plinth
  const base = new THREE.Mesh(pool.getCylinder(0.08 * scale, 0.12 * scale, 0.15 * scale, 6), pool.ironMat);
  base.position.y = 0.075 * scale;
  lamp.add(base);

  // Pole
  const pole = new THREE.Mesh(pool.getCylinder(0.035 * scale, 0.045 * scale, 1.4 * scale, 6), pool.ironMat);
  pole.position.y = (0.15 + 0.7) * scale;
  lamp.add(pole);

  // Lantern collar
  const collar = new THREE.Mesh(pool.getCylinder(0.07 * scale, 0.04 * scale, 0.06 * scale, 6), pool.ironMat);
  collar.position.y = 1.58 * scale;
  lamp.add(collar);

  // Glowing lantern glass
  const glass = new THREE.Mesh(pool.getCylinder(0.065 * scale, 0.05 * scale, 0.16 * scale, 6), pool.lampGlassMat);
  glass.position.y = 1.68 * scale;
  lamp.add(glass);

  // Lantern cap
  const cap = new THREE.Mesh(pool.getCone(0.09 * scale, 0.08 * scale, 6), pool.ironMat);
  cap.position.y = 1.8 * scale;
  lamp.add(cap);

  return lamp;
}
