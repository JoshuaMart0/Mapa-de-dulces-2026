// Street network coordinates and pathfinding based on the user's croquis

export interface RoadNode {
  id: string;
  name: string;
  mapX: number;
  mapY: number;
  streetName: string;
  neighbors: string[];
}

export const STREET_NODES: Record<string, RoadNode> = {
  // Inicio & Southwest
  inicio: {
    id: 'inicio',
    name: 'Punto de Inicio',
    streetName: 'INICIO / J. Botánico Sur',
    mapX: 0.065,
    mapY: 0.815,
    neighbors: ['j_botanico_1', 'jardines_autlan_curve_1'],
  },
  j_botanico_1: {
    id: 'j_botanico_1',
    name: 'J. Botánico Sur (Oeste)',
    streetName: 'J. Botánico Sur',
    mapX: 0.220,
    mapY: 0.815,
    neighbors: ['inicio', 'j_botanico_2', 'jardines_autlan_curve_2'],
  },
  j_botanico_2: {
    id: 'j_botanico_2',
    name: 'J. Botánico Sur (Centro Casas)',
    streetName: 'J. Botánico Sur',
    mapX: 0.410,
    mapY: 0.815,
    neighbors: ['j_botanico_1', 'j_botanico_3'],
  },
  j_botanico_3: {
    id: 'j_botanico_3',
    name: 'J. Botánico Sur (Dulces Sur)',
    streetName: 'J. Botánico Sur',
    mapX: 0.540,
    mapY: 0.815,
    neighbors: ['j_botanico_2', 'j_botanico_east', 'amapolas_south'],
  },
  j_botanico_east: {
    id: 'j_botanico_east',
    name: 'J. Botánico Sur (Extremo Este)',
    streetName: 'J. Botánico Sur',
    mapX: 0.640,
    mapY: 0.815,
    neighbors: ['j_botanico_3', 'amapolas_corner'],
  },

  // Jardines Autlán (Curving north of J. Botánico)
  jardines_autlan_curve_1: {
    id: 'jardines_autlan_curve_1',
    name: 'Curva de Inicio',
    streetName: 'Jardines Autlán',
    mapX: 0.075,
    mapY: 0.720,
    neighbors: ['inicio', 'jardines_autlan_curve_2', 'park_west_court'],
  },
  jardines_autlan_curve_2: {
    id: 'jardines_autlan_curve_2',
    name: 'Jardines Autlán (Frente al Parque)',
    streetName: 'Jardines Autlán',
    mapX: 0.180,
    mapY: 0.660,
    neighbors: ['jardines_autlan_curve_1', 'jardines_autlan_mid', 'j_botanico_1'],
  },
  jardines_autlan_mid: {
    id: 'jardines_autlan_mid',
    name: 'Jardines Autlán (Centro)',
    streetName: 'Jardines Autlán',
    mapX: 0.320,
    mapY: 0.635,
    neighbors: ['jardines_autlan_curve_2', 'azaleas_junction', 'park_center_trail'],
  },
  azaleas_junction: {
    id: 'azaleas_junction',
    name: 'Cruce Jardines Autlán y Azaleas',
    streetName: 'Azaleas',
    mapX: 0.490,
    mapY: 0.590,
    neighbors: ['jardines_autlan_mid', 'azaleas_approach_glorieta'],
  },
  azaleas_approach_glorieta: {
    id: 'azaleas_approach_glorieta',
    name: 'Azaleas hacia la Glorieta',
    streetName: 'Azaleas',
    mapX: 0.535,
    mapY: 0.460,
    neighbors: ['azaleas_junction', 'glorieta_south'],
  },

  // Glorieta Central (Roundabout)
  glorieta_south: {
    id: 'glorieta_south',
    name: 'Glorieta Central (Entrada Azaleas)',
    streetName: 'Glorieta Central',
    mapX: 0.540,
    mapY: 0.400,
    neighbors: ['azaleas_approach_glorieta', 'glorieta_north', 'glorieta_east'],
  },
  glorieta_north: {
    id: 'glorieta_north',
    name: 'Glorieta Central (Salida Cipreses)',
    streetName: 'Glorieta Central',
    mapX: 0.565,
    mapY: 0.300,
    neighbors: ['glorieta_south', 'glorieta_east', 'cipreses_1'],
  },
  glorieta_east: {
    id: 'glorieta_east',
    name: 'Glorieta Central (Salida Autlán Sur)',
    streetName: 'Glorieta Central',
    mapX: 0.605,
    mapY: 0.362,
    neighbors: ['glorieta_south', 'glorieta_north', 'autlan_sur_1', 'azaleas_east_1'],
  },

  // J. Cipreses (North)
  cipreses_1: {
    id: 'cipreses_1',
    name: 'J. Cipreses (Acceso)',
    streetName: 'J. Cipreses',
    mapX: 0.565,
    mapY: 0.220,
    neighbors: ['glorieta_north', 'cipreses_2', 'top_residential_west'],
  },
  cipreses_2: {
    id: 'cipreses_2',
    name: 'J. Cipreses (Casas Norte)',
    streetName: 'J. Cipreses',
    mapX: 0.535,
    mapY: 0.125,
    neighbors: ['cipreses_1', 'cipreses_top'],
  },
  cipreses_top: {
    id: 'cipreses_top',
    name: 'J. Cipreses (Límite Norte)',
    streetName: 'J. Cipreses',
    mapX: 0.535,
    mapY: 0.040,
    neighbors: ['cipreses_2'],
  },

  // Jardines Autlán Sur (East of Glorieta)
  autlan_sur_1: {
    id: 'autlan_sur_1',
    name: 'Jardines Autlán Sur (Arboleda)',
    streetName: 'Jardines Autlán Sur',
    mapX: 0.690,
    mapY: 0.380,
    neighbors: ['glorieta_east', 'autlan_sur_2'],
  },
  autlan_sur_2: {
    id: 'autlan_sur_2',
    name: 'Jardines Autlán Sur (Este)',
    streetName: 'Jardines Autlán Sur',
    mapX: 0.880,
    mapY: 0.365,
    neighbors: ['autlan_sur_1'],
  },

  // Azaleas Este (Middle East Residential)
  azaleas_east_1: {
    id: 'azaleas_east_1',
    name: 'Azaleas Este (Casas Poniente)',
    streetName: 'Azaleas',
    mapX: 0.670,
    mapY: 0.565,
    neighbors: ['glorieta_east', 'azaleas_east_2', 'amapolas_corner'],
  },
  azaleas_east_2: {
    id: 'azaleas_east_2',
    name: 'Azaleas Este (Casas Oriente)',
    streetName: 'Azaleas',
    mapX: 0.855,
    mapY: 0.565,
    neighbors: ['azaleas_east_1'],
  },

  // J. Amapolas Sur (Lower East)
  amapolas_corner: {
    id: 'amapolas_corner',
    name: 'J. Amapolas Sur (Parque)',
    streetName: 'J. Amapolas Sur',
    mapX: 0.640,
    mapY: 0.680,
    neighbors: ['azaleas_east_1', 'j_botanico_east', 'amapolas_south'],
  },
  amapolas_south: {
    id: 'amapolas_south',
    name: 'J. Amapolas Sur (Residencias)',
    streetName: 'J. Amapolas Sur',
    mapX: 0.680,
    mapY: 0.770,
    neighbors: ['amapolas_corner', 'j_botanico_3', 'amapolas_east'],
  },
  amapolas_east: {
    id: 'amapolas_east',
    name: 'J. Amapolas Sur (Límite Este)',
    streetName: 'J. Amapolas Sur',
    mapX: 0.880,
    mapY: 0.770,
    neighbors: ['amapolas_south'],
  },

  // Park Trails (Senderos del Parque)
  park_west_court: {
    id: 'park_west_court',
    name: 'Cancha del Parque',
    streetName: 'Sendero del Parque (Cancha)',
    mapX: 0.110,
    mapY: 0.410,
    neighbors: ['jardines_autlan_curve_1', 'park_center_trail'],
  },
  park_center_trail: {
    id: 'park_center_trail',
    name: 'Sendero Central del Bosque',
    streetName: 'Sendero del Bosque Autlán',
    mapX: 0.285,
    mapY: 0.445,
    neighbors: ['park_west_court', 'jardines_autlan_mid', 'azaleas_junction'],
  },

  // North-west residential street
  top_residential_west: {
    id: 'top_residential_west',
    name: 'Calle Residencial Norte',
    streetName: 'Sector Norte',
    mapX: 0.250,
    mapY: 0.160,
    neighbors: ['cipreses_1', 'park_west_court'],
  },
};

/**
 * Identify closest street to any map coordinate
 */
export function getClosestStreetName(mapX: number, mapY: number): string {
  let closestDist = Infinity;
  let closestStreet = 'Jardines Autlán';

  Object.values(STREET_NODES).forEach((node) => {
    const dist = Math.hypot(node.mapX - mapX, node.mapY - mapY);
    if (dist < closestDist) {
      closestDist = dist;
      closestStreet = node.streetName;
    }
  });

  return closestStreet;
}

/**
 * Find closest node ID in the street network
 */
function findClosestNode(mapX: number, mapY: number): string {
  let closestId = 'inicio';
  let minD = Infinity;

  Object.entries(STREET_NODES).forEach(([id, node]) => {
    const d = Math.hypot(node.mapX - mapX, node.mapY - mapY);
    if (d < minD) {
      minD = d;
      closestId = id;
    }
  });

  return closestId;
}

/**
 * Calculate waypoint path along the streets from start (startX, startY) to target (targetX, targetY)
 * Using Dijkstra's shortest path on the street network
 */
export function calculateStreetPath(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number
): { mapX: number; mapY: number }[] {
  const startNodeId = findClosestNode(startX, startY);
  const targetNodeId = findClosestNode(targetX, targetY);

  if (startNodeId === targetNodeId) {
    return [
      { mapX: startX, mapY: startY },
      { mapX: targetX, mapY: targetY },
    ];
  }

  // Dijkstra
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  Object.keys(STREET_NODES).forEach((id) => {
    distances[id] = Infinity;
    previous[id] = null;
    unvisited.add(id);
  });

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let closestUnvisited: string | null = null;
    let minD = Infinity;

    unvisited.forEach((id) => {
      if (distances[id] < minD) {
        minD = distances[id];
        closestUnvisited = id;
      }
    });

    if (!closestUnvisited || distances[closestUnvisited] === Infinity) break;
    if (closestUnvisited === targetNodeId) break;

    unvisited.delete(closestUnvisited);
    const currNode = STREET_NODES[closestUnvisited];

    currNode.neighbors.forEach((neighId) => {
      if (!unvisited.has(neighId)) return;
      const neighNode = STREET_NODES[neighId];
      if (!neighNode) return;

      const edgeWeight = Math.hypot(currNode.mapX - neighNode.mapX, currNode.mapY - neighNode.mapY);
      const alt = distances[closestUnvisited!] + edgeWeight;

      if (alt < distances[neighId]) {
        distances[neighId] = alt;
        previous[neighId] = closestUnvisited;
      }
    });
  }

  // Reconstruct path
  const pathNodes: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr) {
    pathNodes.unshift(curr);
    curr = previous[curr];
  }

  if (pathNodes.length === 0 || pathNodes[0] !== startNodeId) {
    // Direct fallback
    return [
      { mapX: startX, mapY: startY },
      { mapX: targetX, mapY: targetY },
    ];
  }

  const result: { mapX: number; mapY: number }[] = [{ mapX: startX, mapY: startY }];
  pathNodes.forEach((id) => {
    const n = STREET_NODES[id];
    result.push({ mapX: n.mapX, mapY: n.mapY });
  });
  result.push({ mapX: targetX, mapY: targetY });

  return result;
}
