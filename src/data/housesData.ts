import { HouseData } from '../types';

export const HOUSES_STORAGE_KEY = 'halloween_houses_custom_data_v1';

/**
 * Initial catalog of houses across all 10 residential blocks.
 * Pre-seeded with authentic house numbers and candy distribution flags.
 */
export function generateDefaultHouses(): Record<string, HouseData> {
  const catalog: Record<string, HouseData> = {};

  // Helper to add block houses
  const registerBlock = (cfg: {
    blockId: string;
    northStreet: string;
    southStreet: string;
    startX: number;
    endX: number;
    northY: number;
    southY: number;
    count: number;
    startNorthNum: number;
    startSouthNum: number;
    candyNorthIndices?: { index: number; number?: string; notes?: string }[];
    candySouthIndices?: { index: number; number?: string; notes?: string }[];
  }) => {
    const {
      blockId,
      northStreet,
      southStreet,
      startX,
      endX,
      northY,
      southY,
      count,
      startNorthNum,
      startSouthNum,
      candyNorthIndices = [],
      candySouthIndices = [],
    } = cfg;

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const mapX = Number((startX + t * (endX - startX)).toFixed(4));

      // 1. North house
      const northId = `${blockId}-n-${i}`;
      const candyN = candyNorthIndices.find((c) => c.index === i);
      const numN = candyN?.number || `${startNorthNum + i * 2}`;
      catalog[northId] = {
        id: northId,
        blockId,
        streetName: northStreet,
        houseNumber: numN,
        hasCandy: Boolean(candyN),
        candyNotes: candyN?.notes || (candyN ? '¡Repartiendo dulces de Halloween!' : ''),
        mapX,
        mapY: Number(northY.toFixed(4)),
        rotationY: Math.PI,
      };

      // 2. South house
      const southId = `${blockId}-s-${i}`;
      const candyS = candySouthIndices.find((c) => c.index === i);
      const numS = candyS?.number || `${startSouthNum + i * 2}`;
      catalog[southId] = {
        id: southId,
        blockId,
        streetName: southStreet,
        houseNumber: numS,
        hasCandy: Boolean(candyS),
        candyNotes: candyS?.notes || (candyS ? '¡Repartiendo dulces de Halloween!' : ''),
        mapX,
        mapY: Number(southY.toFixed(4)),
        rotationY: 0,
      };
    }
  };

  // Cuadra 1: J. Botánico Sur - Norte (Entre Jardines Autlán y J. Botánico Sur)
  registerBlock({
    blockId: 'block-1',
    northStreet: 'Jardines Autlán',
    southStreet: 'J. Botánico Sur',
    startX: 0.201,
    endX: 0.553,
    northY: 0.709,
    southY: 0.778,
    count: 16,
    startNorthNum: 100,
    startSouthNum: 10,
    candyNorthIndices: [{ index: 5, number: '104', notes: 'Casa Las Azaleas - Mini barras de chocolates' }],
    candySouthIndices: [
      { index: 9, number: '18', notes: 'Paletas de mango con chile y chocolates' },
      { index: 11, number: '22', notes: 'Bombones gigantes y colmillos' },
      { index: 14, number: '28', notes: 'Reese\'s Cups y dulces de calabaza' },
      { index: 15, number: '32', notes: 'Mesa con luces UV y pulparindos' },
    ],
  });

  // Cuadra 2: J. Botánico Sur - Sur (Frente al campo de cultivo sur)
  registerBlock({
    blockId: 'block-2',
    northStreet: 'J. Botánico Sur',
    southStreet: 'J. Botánico Sur (Lado Sur)',
    startX: 0.201,
    endX: 0.553,
    northY: 0.889,
    southY: 0.929,
    count: 16,
    startNorthNum: 1,
    startSouthNum: 2,
    candyNorthIndices: [
      { index: 10, number: '05', notes: 'Villa Botánico Sur - Esqueletos gigantes' },
      { index: 14, number: '09', notes: 'Villa Botánico Sur - Barra de dulces' },
    ],
  });

  // Cuadra 3: Oriente Superior (Norte de Azaleas, sur de Jardines Autlán Sur)
  registerBlock({
    blockId: 'block-3',
    northStreet: 'Jardines Autlán Sur',
    southStreet: 'Azaleas',
    startX: 0.640,
    endX: 0.905,
    northY: 0.499,
    southY: 0.549,
    count: 11,
    startNorthNum: 201,
    startSouthNum: 11,
    candySouthIndices: [
      { index: 2, number: '12', notes: 'Casa Azaleas del Centro - Chocolates Carlos V' },
      { index: 9, number: '24', notes: 'Casa Azaleas del Este - Cofre pirata de dulces' },
    ],
  });

  // Cuadra 4: Oriente Central (Entre Azaleas y J. Amapolas Sur)
  registerBlock({
    blockId: 'block-4',
    northStreet: 'Azaleas',
    southStreet: 'J. Amapolas Sur',
    startX: 0.663,
    endX: 0.905,
    northY: 0.680,
    southY: 0.734,
    count: 10,
    startNorthNum: 12,
    startSouthNum: 80,
    candySouthIndices: [
      { index: 1, number: '88', notes: 'Casa Las Amapolas - Gran variedad de chocolates' },
    ],
  });

  // Cuadra 5: Oriente Inferior (Al sur de J. Amapolas Sur)
  registerBlock({
    blockId: 'block-5',
    northStreet: 'J. Amapolas Sur',
    southStreet: 'Límite Sur',
    startX: 0.667,
    endX: 0.905,
    northY: 0.851,
    southY: 0.892,
    count: 9,
    startNorthNum: 101,
    startSouthNum: 102,
  });

  // Cuadra 6: J. Cipreses Inferior (Norte de la glorieta)
  registerBlock({
    blockId: 'block-6',
    northStreet: 'J. Cipreses',
    southStreet: 'Glorieta Central',
    startX: 0.407,
    endX: 0.626,
    northY: 0.201,
    southY: 0.244,
    count: 8,
    startNorthNum: 41,
    startSouthNum: 51,
  });

  // Cuadra 7: J. Cipreses Superior (Norte de J. Cipreses)
  registerBlock({
    blockId: 'block-7',
    northStreet: 'Límite Norte',
    southStreet: 'J. Cipreses',
    startX: 0.407,
    endX: 0.626,
    northY: 0.041,
    southY: 0.095,
    count: 8,
    startNorthNum: 61,
    startSouthNum: 42,
    candySouthIndices: [
      { index: 5, number: '47', notes: 'La Mansión de las Sombras - Barras de Snickers completas' },
    ],
  });

  // Cuadra 8: Norponiente Inferior (Norte del parque)
  registerBlock({
    blockId: 'block-8',
    northStreet: 'Calle Poniente',
    southStreet: 'Paseo del Parque',
    startX: 0.064,
    endX: 0.315,
    northY: 0.197,
    southY: 0.237,
    count: 8,
    startNorthNum: 21,
    startSouthNum: 31,
  });

  // Cuadra 9: Norponiente Superior
  registerBlock({
    blockId: 'block-9',
    northStreet: 'Límite Norte Poniente',
    southStreet: 'Calle Poniente',
    startX: 0.087,
    endX: 0.315,
    northY: 0.041,
    southY: 0.098,
    count: 7,
    startNorthNum: 1,
    startSouthNum: 11,
  });

  // Cuadra 10: Nororiente
  registerBlock({
    blockId: 'block-10',
    northStreet: 'Límite Nororiente',
    southStreet: 'Jardines Autlán Sur',
    startX: 0.713,
    endX: 0.932,
    northY: 0.122,
    southY: 0.201,
    count: 10,
    startNorthNum: 301,
    startSouthNum: 302,
  });

  // Caseta / Edificio Inicio
  catalog['house-caseta-inicio'] = {
    id: 'house-caseta-inicio',
    blockId: 'caseta',
    streetName: 'Acceso Principal (INICIO)',
    houseNumber: 'Caseta de Control',
    hasCandy: true,
    candyNotes: '¡Punto de Bienvenida! Registro y dulces para todos.',
    mapX: 0.065,
    mapY: 0.935,
    rotationY: 0,
  };

  return catalog;
}

/**
 * Loads stored houses from localStorage merged with defaults.
 */
export function loadHousesData(): Record<string, HouseData> {
  const defaults = generateDefaultHouses();
  try {
    const raw = localStorage.getItem(HOUSES_STORAGE_KEY);
    if (raw) {
      const saved: Record<string, Partial<HouseData>> = JSON.parse(raw);
      // Merge saved overrides on top of defaults
      Object.keys(saved).forEach((id) => {
        if (defaults[id]) {
          defaults[id] = { ...defaults[id], ...saved[id] };
        } else if (saved[id] && saved[id].id) {
          defaults[id] = saved[id] as HouseData;
        }
      });
    }
  } catch (err) {
    console.warn('Error loading custom houses from localStorage', err);
  }
  return defaults;
}

/**
 * Saves houses data into localStorage.
 */
export function saveHousesData(houses: Record<string, HouseData>) {
  try {
    localStorage.setItem(HOUSES_STORAGE_KEY, JSON.stringify(houses));
  } catch (err) {
    console.warn('Error saving houses data to localStorage', err);
  }
}
