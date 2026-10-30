import * as THREE from 'three';
import {
  mapToWorldCoords,
  CROQUIS_PALETTE,
  createAestheticHouse,
  createAestheticPine,
  createAestheticDeciduousTree,
  createAestheticPumpkin,
  createAestheticGhost,
  createAestheticHayBale,
  createAestheticStreetLamp,
} from './aestheticNeighborhood';

import { HouseData } from '../types';
import { loadHousesData } from '../data/housesData';

export interface BuiltNeighborhood {
  housesGroup: THREE.Group;
  treesGroup: THREE.Group;
  pumpkinsGroup: THREE.Group;
  ghostsGroup: THREE.Group;
  hayBalesGroup: THREE.Group;
  streetLampsGroup: THREE.Group;
  candyHouses: THREE.Group[];
  animatedTrees: { tree: THREE.Group; seed: number }[];
  animatedGhosts: { ghost: THREE.Group; baseY: number; seed: number }[];
}

/**
 * Builds the complete 3D neighborhood strictly aligned to the authentic croquis map.
 * Each residential block (cuadra) contains houses on the front AND on the back (back-to-back),
 * with their front facades, illuminated windows, and doors facing their respective streets.
 */
export function buildCompleteAestheticNeighborhood(
  worldW: number,
  worldH: number,
  customHousesData?: Record<string, HouseData>
): BuiltNeighborhood {
  const housesData = customHousesData || loadHousesData();

  const housesGroup = new THREE.Group();
  housesGroup.name = 'aestheticHouses';

  const treesGroup = new THREE.Group();
  treesGroup.name = 'aestheticTrees';

  const pumpkinsGroup = new THREE.Group();
  pumpkinsGroup.name = 'aestheticPumpkins';

  const ghostsGroup = new THREE.Group();
  ghostsGroup.name = 'aestheticGhosts';

  const hayBalesGroup = new THREE.Group();
  hayBalesGroup.name = 'aestheticHayBales';

  const streetLampsGroup = new THREE.Group();
  streetLampsGroup.name = 'aestheticStreetLamps';

  const candyHouses: THREE.Group[] = [];
  const animatedTrees: { tree: THREE.Group; seed: number }[] = [];
  const animatedGhosts: { ghost: THREE.Group; baseY: number; seed: number }[] = [];

  /**
   * Helper to construct a suburban block with houses facing both FRONT and BACK.
   * - North Row faces North (rotationY = Math.PI) towards the northern street.
   * - South Row faces South (rotationY = 0) towards the southern street.
   */
  const addBlockBackToBack = (cfg: {
    blockId: string;
    startX: number;
    endX: number;
    northY: number; // mapY for north row
    southY: number; // mapY for south row
    count: number;  // houses per row
    w: number;
    d: number;
    h: number;
    colorOffset?: number;
  }) => {
    const { blockId, startX, endX, northY, southY, count, w, d, h, colorOffset = 0 } = cfg;

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const mapX = startX + t * (endX - startX);

      // --- 1. North Row (casas por atrás/norte, miran hacia la calle norte) ---
      const northId = `${blockId}-n-${i}`;
      const nData = housesData[northId];
      const { x: nx, z: nz } = mapToWorldCoords(mapX, northY, worldW, worldH);
      const nWall = CROQUIS_PALETTE.walls[(i + colorOffset) % CROQUIS_PALETTE.walls.length];
      const nRoof = CROQUIS_PALETTE.roofs[(i + colorOffset + 1) % CROQUIS_PALETTE.roofs.length];
      const northHouse = createAestheticHouse(
        nx,
        nz,
        w,
        d,
        h,
        nWall,
        nRoof,
        (i + colorOffset) % 2 === 0,
        Math.PI, // Miran al Norte
        {
          houseId: northId,
          houseNumber: nData?.houseNumber || '',
          streetName: nData?.streetName || '',
          hasCandy: nData?.hasCandy || false,
        }
      );
      housesGroup.add(northHouse);
      if (nData?.hasCandy) {
        candyHouses.push(northHouse);
      }

      // --- 2. South Row (casas por el frente/sur, miran hacia la calle sur) ---
      const southId = `${blockId}-s-${i}`;
      const sData = housesData[southId];
      const { x: sx, z: sz } = mapToWorldCoords(mapX, southY, worldW, worldH);
      const sWall = CROQUIS_PALETTE.walls[(i + colorOffset + 4) % CROQUIS_PALETTE.walls.length];
      const sRoof = CROQUIS_PALETTE.roofs[(i + colorOffset + 2) % CROQUIS_PALETTE.roofs.length];
      const southHouse = createAestheticHouse(
        sx,
        sz,
        w,
        d,
        h,
        sWall,
        sRoof,
        (i + colorOffset + 1) % 2 === 0,
        0, // Miran al Sur
        {
          houseId: southId,
          houseNumber: sData?.houseNumber || '',
          streetName: sData?.streetName || '',
          hasCandy: sData?.hasCandy || false,
        }
      );
      housesGroup.add(southHouse);
      if (sData?.hasCandy) {
        candyHouses.push(southHouse);
      }
    }
  };

  // =========================================================================
  // 1. CUADRA 1: J. BOTÁNICO SUR - NORTE (Entre Jardines Autlán y J. Botánico Sur)
  // pixel bounds: x: 220..605, y: 500..595
  // =========================================================================
  // =========================================================================
  // 1. CUADRA 1: J. BOTÁNICO SUR - NORTE (Entre Jardines Autlán y J. Botánico Sur)
  // pixel bounds: x: 220..605, y: 500..595
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-1',
    startX: 0.201,
    endX: 0.553,
    northY: 0.709, // casas por atrás (norte), miran a Jardines Autlán
    southY: 0.778, // casas por el frente (sur), miran a J. Botánico Sur
    count: 16,
    w: 1.05,
    d: 1.05,
    h: 1.15,
    colorOffset: 0,
  });

  // =========================================================================
  // 2. CUADRA 2: J. BOTÁNICO SUR - SUR (Al sur de J. Botánico Sur, sobre el sembradío)
  // pixel bounds: x: 220..605, y: 645..700
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-2',
    startX: 0.201,
    endX: 0.553,
    northY: 0.889, // casas por el frente (norte), miran a J. Botánico Sur
    southY: 0.929, // casas por atrás (sur), miran al campo de cultivo
    count: 16,
    w: 1.05,
    d: 0.85,
    h: 1.05,
    colorOffset: 3,
  });

  // =========================================================================
  // 3. CUADRA 3: ORIENTE SUPERIOR (Norte de Azaleas, sur de J. Autlán Sur)
  // pixel bounds: x: 700..990, y: 355..420
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-3',
    startX: 0.640,
    endX: 0.905,
    northY: 0.499, // casas por el norte, miran a Jardines Autlán Sur
    southY: 0.549, // casas por el sur, miran a Azaleas
    count: 11,
    w: 1.10,
    d: 0.90,
    h: 1.10,
    colorOffset: 2,
  });

  // =========================================================================
  // 4. CUADRA 4: ORIENTE CENTRAL (Entre Azaleas y J. Amapolas Sur)
  // pixel bounds: x: 725..990, y: 485..560
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-4',
    startX: 0.663,
    endX: 0.905,
    northY: 0.680, // casas por el norte, miran a Azaleas
    southY: 0.734, // casas por el sur, miran a J. Amapolas Sur
    count: 10,
    w: 1.10,
    d: 0.90,
    h: 1.05,
    colorOffset: 5,
  });

  // =========================================================================
  // 5. CUADRA 5: ORIENTE INFERIOR (Al sur de J. Amapolas Sur)
  // pixel bounds: x: 730..990, y: 615..670
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-5',
    startX: 0.667,
    endX: 0.905,
    northY: 0.851, // casas por el norte, miran a J. Amapolas Sur
    southY: 0.892, // casas por el sur, miran al campo
    count: 9,
    w: 1.15,
    d: 0.85,
    h: 1.05,
    colorOffset: 7,
  });

  // =========================================================================
  // 6. CUADRA 6: J. CIPRESES INFERIOR (Al sur de la calle J. Cipreses)
  // pixel bounds: x: 445..685, y: 135..195
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-6',
    startX: 0.407,
    endX: 0.626,
    northY: 0.201, // casas por el norte, miran a J. Cipreses
    southY: 0.244, // casas por el sur, miran a la glorieta
    count: 8,
    w: 1.25,
    d: 0.85,
    h: 1.05,
    colorOffset: 4,
  });

  // =========================================================================
  // 7. CUADRA 7: J. CIPRESES SUPERIOR (Al norte de la calle J. Cipreses)
  // pixel bounds: x: 445..685, y: 15..90
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-7',
    startX: 0.407,
    endX: 0.626,
    northY: 0.041, // casas por el norte (límite superior)
    southY: 0.095, // casas por el sur, miran a J. Cipreses
    count: 8,
    w: 1.25,
    d: 0.90,
    h: 1.05,
    colorOffset: 1,
  });

  // =========================================================================
  // 8. CUADRA 8: NORPONIENTE INFERIOR (Al norte del Parque)
  // pixel bounds: x: 70..345, y: 130..190
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-8',
    startX: 0.064,
    endX: 0.315,
    northY: 0.197, // casas por el norte
    southY: 0.237, // casas por el sur (hacia el parque)
    count: 8,
    w: 1.35,
    d: 0.85,
    h: 1.00,
    colorOffset: 6,
  });

  // =========================================================================
  // 9. CUADRA 9: NORPONIENTE SUPERIOR
  // pixel bounds: x: 95..345, y: 15..90
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-9',
    startX: 0.087,
    endX: 0.315,
    northY: 0.041, // casas por el norte
    southY: 0.098, // casas por el sur
    count: 7,
    w: 1.35,
    d: 0.90,
    h: 1.00,
    colorOffset: 8,
  });

  // =========================================================================
  // 10. CUADRA 10: NORORIENTE (Al norte de Jardines Autlán Sur)
  // pixel bounds: x: 780..1020, y: 70..170
  // =========================================================================
  addBlockBackToBack({
    blockId: 'block-10',
    startX: 0.713,
    endX: 0.932,
    northY: 0.122, // casas por el norte
    southY: 0.201, // casas por el sur (miran a Jardines Autlán Sur)
    count: 10,
    w: 1.05,
    d: 1.05,
    h: 1.05,
    colorOffset: 2,
  });

  // =========================================================================
  // 11. EDIFICIO / CASETA INICIO (Clubhouse gris esquinero)
  // =========================================================================
  const { x: initX, z: initZ } = mapToWorldCoords(0.065, 0.935, worldW, worldH);
  const casetaData = housesData['house-caseta-inicio'];
  const startHouse = createAestheticHouse(
    initX,
    initZ,
    1.4,
    1.3,
    1.15,
    0x475569,
    0x1e293b,
    true,
    0,
    {
      houseId: 'house-caseta-inicio',
      houseNumber: casetaData?.houseNumber || 'INICIO',
      streetName: 'Acceso Principal (INICIO)',
      hasCandy: casetaData?.hasCandy ?? true,
    }
  );
  housesGroup.add(startHouse);
  if (casetaData?.hasCandy ?? true) {
    candyHouses.push(startHouse);
  }

  // =========================================================
  // 12. ÁRBOLES 3D ESTILIZADOS EN EL PARQUE Y GLORIETAS
  // Todos verificados sobre zonas verdes/boscosas del croquis
  // =========================================================
  const treeCoords = [
    // Bosque Poniente del parque
    { mx: 0.075, my: 0.285, type: 'pine', s: 1.15, c: 0x14532d },
    { mx: 0.100, my: 0.335, type: 'deciduous', s: 1.25, c: 0x166534 },
    { mx: 0.140, my: 0.315, type: 'pine', s: 1.30, c: 0x1e3a8a },
    { mx: 0.180, my: 0.320, type: 'deciduous', s: 1.20, c: 0x15803d },
    { mx: 0.160, my: 0.460, type: 'pine', s: 1.30, c: 0x0f766e },
    { mx: 0.120, my: 0.490, type: 'deciduous', s: 1.20, c: 0x166534 },
    { mx: 0.080, my: 0.520, type: 'pine', s: 1.10, c: 0x14532d },
    { mx: 0.140, my: 0.535, type: 'deciduous', s: 1.25, c: 0x15803d },
    // Bosque Centro del parque
    { mx: 0.200, my: 0.530, type: 'pine', s: 1.20, c: 0x14532d },
    { mx: 0.210, my: 0.470, type: 'deciduous', s: 1.30, c: 0x166534 },
    { mx: 0.250, my: 0.410, type: 'pine', s: 1.25, c: 0x1e3a8a },
    { mx: 0.220, my: 0.360, type: 'deciduous', s: 1.30, c: 0x0f766e },
    { mx: 0.260, my: 0.300, type: 'pine', s: 1.20, c: 0x14532d },
    // Bosque Oriente del parque (junto al claro de tierra)
    { mx: 0.365, my: 0.315, type: 'deciduous', s: 1.35, c: 0x166534 },
    { mx: 0.395, my: 0.380, type: 'pine', s: 1.25, c: 0x0f766e },
    { mx: 0.370, my: 0.440, type: 'deciduous', s: 1.30, c: 0x15803d },
    { mx: 0.425, my: 0.420, type: 'pine', s: 1.15, c: 0x14532d },
    { mx: 0.440, my: 0.480, type: 'deciduous', s: 1.25, c: 0x166534 },
    { mx: 0.335, my: 0.490, type: 'pine', s: 1.20, c: 0x1e3a8a },
    { mx: 0.310, my: 0.550, type: 'deciduous', s: 1.30, c: 0x14532d },
    { mx: 0.270, my: 0.560, type: 'pine', s: 1.10, c: 0x166534 },
    // Arboleda de la Glorieta (Jardines Autlán Sur)
    { mx: 0.650, my: 0.330, type: 'pine', s: 1.30, c: 0x14532d },
    { mx: 0.700, my: 0.340, type: 'deciduous', s: 1.35, c: 0x166534 },
    { mx: 0.725, my: 0.310, type: 'pine', s: 1.20, c: 0x0f766e },
  ];

  treeCoords.forEach((tc, idx) => {
    const { x, z } = mapToWorldCoords(tc.mx, tc.my, worldW, worldH);
    const tree = tc.type === 'pine'
      ? createAestheticPine(x, z, tc.s, tc.c)
      : createAestheticDeciduousTree(x, z, tc.s, tc.c);
    treesGroup.add(tree);
    animatedTrees.push({ tree, seed: idx * 1.5 });
  });

  // =========================================================
  // 13. CALABAZAS 3D (JACK-O'-LANTERNS)
  // =========================================================
  const pumpkinSpots = [
    { mx: 0.130, my: 0.305, s: 1.20, id: 'p1' }, // Parque norte
    { mx: 0.200, my: 0.420, s: 1.15, id: 'p2' }, // Parque centro
    { mx: 0.370, my: 0.505, s: 1.25, id: 'p3' }, // Cruce de andadores
    { mx: 0.530, my: 0.490, s: 1.10, id: 'p4' }, // Esquina de Azaleas
    { mx: 0.270, my: 0.585, s: 0.95, id: 'p5' }, // Banqueta parque
    { mx: 0.410, my: 0.605, s: 0.95, id: 'p6' }, // Banqueta J. Botánico
    { mx: 0.630, my: 0.755, s: 1.05, id: 'p7' }, // Jardín Amapolas
    { mx: 0.095, my: 0.745, s: 1.00, id: 'p8' }, // Entrada INICIO
  ];

  pumpkinSpots.forEach((ps) => {
    const { x, z } = mapToWorldCoords(ps.mx, ps.my, worldW, worldH);
    pumpkinsGroup.add(createAestheticPumpkin(x, z, ps.s, ps.id));
  });

  // =========================================================
  // 14. FANTASMAS 3D ETÉREOS FLOTANTES
  // =========================================================
  const ghostSpots = [
    { mx: 0.168, my: 0.380, s: 1.10, id: 'g1' }, // Parque cancha
    { mx: 0.245, my: 0.350, s: 1.20, id: 'g2' }, // Parque arboleda alta
    { mx: 0.135, my: 0.530, s: 1.05, id: 'g3' }, // Parque arboleda baja
    { mx: 0.402, my: 0.440, s: 1.15, id: 'g4' }, // Sendero lago
    { mx: 0.070, my: 0.080, s: 1.30, id: 'g_compass' }, // Fantasma de la rosa náutica
  ];

  ghostSpots.forEach((gs, idx) => {
    const { x, z } = mapToWorldCoords(gs.mx, gs.my, worldW, worldH);
    const ghost = createAestheticGhost(x, z, gs.s, gs.id);
    ghostsGroup.add(ghost);
    animatedGhosts.push({ ghost, baseY: 1.6, seed: idx * 2.2 });
  });

  // =========================================================
  // 15. PACAS DE HENO EN ÁREAS RÚSTICAS
  // =========================================================
  const hayBaleSpots = [
    { mx: 0.105, my: 0.850, s: 1.10, r: 0.3 }, // Cerca de INICIO
    { mx: 0.840, my: 0.350, s: 1.20, r: -0.2 }, // Claro noreste
    { mx: 0.935, my: 0.330, s: 1.10, r: 0.5 }, // Límite noreste
    { mx: 0.912, my: 0.945, s: 1.25, r: 0.1 }, // Campo de cultivo sur
  ];

  hayBaleSpots.forEach((hb) => {
    const { x, z } = mapToWorldCoords(hb.mx, hb.my, worldW, worldH);
    hayBalesGroup.add(createAestheticHayBale(x, z, hb.s, hb.r));
  });

  // =========================================================
  // 16. FAROLAS VICTORIANAS DE HIERRO CON LINTERNA CÁLIDA
  // Ubicadas sobre las banquetas a lo largo de las calles
  // =========================================================
  const lampSpots = [
    { mx: 0.095, my: 0.770 }, // Caseta INICIO
    { mx: 0.220, my: 0.825 }, // Banqueta J. Botánico Sur poniente
    { mx: 0.360, my: 0.825 }, // Banqueta J. Botánico Sur centro
    { mx: 0.500, my: 0.825 }, // Banqueta J. Botánico Sur oriente
    { mx: 0.535, my: 0.420 }, // Glorieta poniente
    { mx: 0.605, my: 0.420 }, // Glorieta oriente
    { mx: 0.650, my: 0.610 }, // Banqueta Azaleas
    { mx: 0.780, my: 0.600 }, // Banqueta Azaleas centro
    { mx: 0.670, my: 0.790 }, // Banqueta J. Amapolas Sur
    { mx: 0.800, my: 0.785 }, // Banqueta J. Amapolas Sur centro
    { mx: 0.410, my: 0.150 }, // Banqueta J. Cipreses
  ];

  lampSpots.forEach((lp) => {
    const { x, z } = mapToWorldCoords(lp.mx, lp.my, worldW, worldH);
    streetLampsGroup.add(createAestheticStreetLamp(x, z, 0.95));
  });

  return {
    housesGroup,
    treesGroup,
    pumpkinsGroup,
    ghostsGroup,
    hayBalesGroup,
    streetLampsGroup,
    candyHouses,
    animatedTrees,
    animatedGhosts,
  };
}
