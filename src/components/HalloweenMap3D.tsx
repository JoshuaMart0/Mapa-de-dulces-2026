import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HouseData, PlayerPosition, TimeOfDay, CameraPreset } from '../types';
import { CANDY_LOCATIONS } from '../data/candyLocations';
import { sounds } from '../audio/soundEffects';
import { buildCompleteAestheticNeighborhood, BuiltNeighborhood } from '../models/neighborhoodLayout';
import { updateHouseVisualState } from '../models/aestheticNeighborhood';

export interface HalloweenMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  rotateClockwise: (angle?: number) => void;
  rotateCounterClockwise: (angle?: number) => void;
  setRotationAngle: (radians: number) => void;
  getRotationDegrees: () => number;
  focusOnCoords: (mapX: number, mapY: number) => void;
  recenterOnPlayer: () => void;
  updateHouse: (houseId: string, houseNumber: string, hasCandy: boolean) => void;
}

interface HalloweenMap3DProps {
  playerPos: PlayerPosition;
  selectedHouseId: string | null;
  onSelectHouse: (house: HouseData) => void;
  housesData: Record<string, HouseData>;
  timeOfDay: TimeOfDay;
  cameraPreset: CameraPreset;
  onMapTapMove?: (mapX: number, mapY: number) => void;
  isFollowPlayer?: boolean;
  onManualPan?: () => void;
}

// Map dimensions matching authentic image aspect ratio: 1094 / 738 = 1.4823848
const WORLD_WIDTH = 48;
const WORLD_HEIGHT = 48 / 1.4823848; // ~32.38

// Initial camera viewpoint matching the user's screenshot focused at INICIO & Cuadra 1
export const DEFAULT_CAMERA_CONFIG = {
  targetX: -16.0,
  targetY: 0,
  targetZ: 9.2,
  radius: 22,
  theta: Math.PI / 4.2,
  phi: Math.PI / 3.4,
};

// Module-scope temporary variables to prevent GC in render loop
const _vec3A = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

export const HalloweenMap3D = React.forwardRef<HalloweenMapHandle, HalloweenMap3DProps>(({
  playerPos,
  selectedHouseId,
  onSelectHouse,
  housesData,
  timeOfDay,
  cameraPreset,
  onMapTapMove,
  isFollowPlayer = false,
  onManualPan,
}, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groundMeshRef = useRef<THREE.Mesh | null>(null);
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const neighborhoodRef = useRef<BuiltNeighborhood | null>(null);
  const specialCandySpotsGroupRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<{
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    ambientLight: THREE.AmbientLight;
  } | null>(null);

  // Smooth camera controls state initialized to exact user screenshot angle & target
  const cameraControlRef = useRef({
    target: new THREE.Vector3(DEFAULT_CAMERA_CONFIG.targetX, DEFAULT_CAMERA_CONFIG.targetY, DEFAULT_CAMERA_CONFIG.targetZ),
    spherical: {
      radius: DEFAULT_CAMERA_CONFIG.radius,
      theta: DEFAULT_CAMERA_CONFIG.theta,
      phi: DEFAULT_CAMERA_CONFIG.phi,
    },
    isDragging: false,
    dragButton: 0,
    prevPointer: { x: 0, y: 0 },
    dragDistance: 0,
    didTriggerPan: false,
    desiredTarget: new THREE.Vector3(DEFAULT_CAMERA_CONFIG.targetX, DEFAULT_CAMERA_CONFIG.targetY, DEFAULT_CAMERA_CONFIG.targetZ),
    desiredRadius: DEFAULT_CAMERA_CONFIG.radius,
    desiredTheta: DEFAULT_CAMERA_CONFIG.theta,
    desiredPhi: DEFAULT_CAMERA_CONFIG.phi,
  });

  const playerPosRef = useRef(playerPos);
  playerPosRef.current = playerPos;

  const housesDataRef = useRef(housesData);
  housesDataRef.current = housesData;

  const selectedHouseIdRef = useRef(selectedHouseId);
  selectedHouseIdRef.current = selectedHouseId;

  const isFollowPlayerRef = useRef(isFollowPlayer);
  isFollowPlayerRef.current = isFollowPlayer;

  // Convert normalized map coordinates (0..1) to 3D world coordinates (X, Z)
  const mapCoordsToWorld = useCallback((mapX: number, mapY: number) => {
    const x = (mapX - 0.5) * WORLD_WIDTH;
    const z = (mapY - 0.5) * WORLD_HEIGHT;
    return { x, z };
  }, []);

  const worldCoordsToMap = useCallback((x: number, z: number) => {
    const mapX = x / WORLD_WIDTH + 0.5;
    const mapY = z / WORLD_HEIGHT + 0.5;
    return {
      mapX: Math.max(0, Math.min(1, mapX)),
      mapY: Math.max(0, Math.min(1, mapY)),
    };
  }, []);

  // Synchronize 3D visual state (candy glows, floating badges) whenever housesData changes
  useEffect(() => {
    if (!neighborhoodRef.current) return;
    const nb = neighborhoodRef.current;
    Object.values(housesData).forEach((house) => {
      const houseGroup = nb.housesGroup.getObjectByName(house.id) as THREE.Group | undefined;
      if (houseGroup) {
        updateHouseVisualState(houseGroup, house.houseNumber, house.hasCandy);
        const list = nb.candyHouses;
        const idx = list.indexOf(houseGroup);
        if (house.hasCandy && idx === -1) {
          list.push(houseGroup);
        } else if (!house.hasCandy && idx !== -1) {
          list.splice(idx, 1);
        }
      }
    });
  }, [housesData]);

  // Update lighting when time of day changes
  useEffect(() => {
    if (!lightsRef.current || !sceneRef.current) return;
    const { dirLight, hemiLight, ambientLight } = lightsRef.current;
    const scene = sceneRef.current;

    if (timeOfDay === 'night') {
      scene.background = new THREE.Color(0x0a0c16);
      if (scene.fog) scene.fog.color = new THREE.Color(0x0a0c16);
      ambientLight.color.setHex(0x1a2138);
      ambientLight.intensity = 0.65;
      hemiLight.color.setHex(0x3a4b6e);
      hemiLight.groundColor.setHex(0x0f1422);
      hemiLight.intensity = 0.5;
      dirLight.color.setHex(0x90a5d4);
      dirLight.intensity = 1.0;
    } else if (timeOfDay === 'twilight') {
      scene.background = new THREE.Color(0x211229);
      if (scene.fog) scene.fog.color = new THREE.Color(0x211229);
      ambientLight.color.setHex(0x3b1d3d);
      ambientLight.intensity = 0.85;
      hemiLight.color.setHex(0xf97316);
      hemiLight.groundColor.setHex(0x2e1065);
      hemiLight.intensity = 0.9;
      dirLight.color.setHex(0xfb923c);
      dirLight.intensity = 1.6;
    } else {
      // Day
      scene.background = new THREE.Color(0x87ceeb);
      if (scene.fog) scene.fog.color = new THREE.Color(0x87ceeb);
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 1.1;
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0x7c9c63);
      hemiLight.intensity = 0.8;
      dirLight.color.setHex(0xfffaed);
      dirLight.intensity = 2.0;
    }
  }, [timeOfDay]);

  // Adjust camera to presets without abruptly resetting user position
  useEffect(() => {
    const controls = cameraControlRef.current;
    if (cameraPreset === 'isometric') {
      controls.desiredTheta = Math.PI / 4;
      controls.desiredPhi = Math.PI / 3.4; // ~53° isometric tilt
    } else if (cameraPreset === 'topdown') {
      controls.desiredTheta = 0.01;
      controls.desiredPhi = 0.12; // overhead
    } else if (cameraPreset === 'follow') {
      const { x, z } = mapCoordsToWorld(playerPos.mapX, playerPos.mapY);
      controls.desiredTarget.set(x, 0, z);
      controls.desiredRadius = 24;
      controls.desiredPhi = Math.PI / 3.2;
    } else if (cameraPreset === 'cinematic') {
      controls.desiredTheta = Math.PI / 3;
      controls.desiredPhi = Math.PI / 2.3;
      controls.desiredRadius = 26;
    }
  }, [cameraPreset, mapCoordsToWorld, playerPos.mapX, playerPos.mapY]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software GL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c16);
    scene.fog = new THREE.FogExp2(0x0a0c16, 0.012);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 300);
    cameraRef.current = camera;
    camera.position.set(22, 28, 24);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.replaceChildren(renderer.domElement);

    // Studio Environment map
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // fallback
    }

    // Lighting rig
    const ambientLight = new THREE.AmbientLight(0x1a2138, 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x3a4b6e, 0x0f1422, 0.5);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x90a5d4, 1.2);
    dirLight.position.set(20, 35, 15);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      dirLight.shadow.mapSize.width = isMobile ? 512 : 1024;
      dirLight.shadow.mapSize.height = isMobile ? 512 : 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 70;
      const d = 28;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    lightsRef.current = { dirLight, hemiLight, ambientLight };

    // ==========================================
    // 1. GROUND MAP PLANE (AUTHENTIC CROQUIS)
    // ==========================================
    const textureLoader = new THREE.TextureLoader();
    const mapTexture = textureLoader.load(
      '/assets/aistudio/image_fa6634df.png',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        if (groundMeshRef.current) {
          (groundMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
    );
    mapTexture.colorSpace = THREE.SRGBColorSpace;
    mapTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mapTexture.minFilter = THREE.LinearFilter;
    mapTexture.magFilter = THREE.LinearFilter;

    // Ground plane with the authentic croquis texture
    const groundGeo = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      map: mapTexture,
      roughness: 0.45,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0.05; // Flush on top of base
    groundMesh.receiveShadow = true;
    groundMesh.name = 'groundPlane';
    scene.add(groundMesh);
    groundMeshRef.current = groundMesh;

    // 3D Architectural Base Slab strictly beneath
    const slabGeo = new THREE.BoxGeometry(WORLD_WIDTH + 0.6, 1.2, WORLD_HEIGHT + 0.6);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -0.58;
    slabMesh.receiveShadow = true;
    scene.add(slabMesh);

    // ==========================================
    // 2. AESTHETIC 3D NEIGHBORHOOD
    // Houses with custom numbers, door alignment, and shining candy lights!
    // ==========================================
    const neighborhood = buildCompleteAestheticNeighborhood(
      WORLD_WIDTH,
      WORLD_HEIGHT,
      housesDataRef.current
    );
    scene.add(neighborhood.housesGroup);
    scene.add(neighborhood.treesGroup);
    scene.add(neighborhood.pumpkinsGroup);
    scene.add(neighborhood.ghostsGroup);
    scene.add(neighborhood.hayBalesGroup);
    scene.add(neighborhood.streetLampsGroup);
    neighborhoodRef.current = neighborhood;

    // Immediately synchronize all houses with live housesData
    Object.values(housesDataRef.current).forEach((house) => {
      const houseGroup = neighborhood.housesGroup.getObjectByName(house.id) as THREE.Group | undefined;
      if (houseGroup) {
        updateHouseVisualState(houseGroup, house.houseNumber, house.hasCandy);
        const list = neighborhood.candyHouses;
        const idx = list.indexOf(houseGroup);
        if (house.hasCandy && idx === -1) {
          list.push(houseGroup);
        } else if (!house.hasCandy && idx !== -1) {
          list.splice(idx, 1);
        }
      }
    });

    // ==========================================
    // 3. PARK & GLORIETA SPECIAL CANDY GLOW SPOTS
    // For community park spots (no house), they have radiant ground auras & glowing mini pumpkins
    // ==========================================
    const specialCandySpotsGroup = new THREE.Group();
    specialCandySpotsGroup.name = 'specialParkCandyAuras';
    scene.add(specialCandySpotsGroup);
    specialCandySpotsGroupRef.current = specialCandySpotsGroup;

    const parkAuraMeshes: THREE.Mesh[] = [];

    const parkCandyLocations = CANDY_LOCATIONS.filter(
      (c) => c.status === 'special' || c.houseNumber === 'Puesto Comunitario' || c.houseNumber === 'Área Verde' || c.houseNumber === 'Sendero #2' || c.houseNumber === 'Glorieta Central'
    );

    parkCandyLocations.forEach((spot) => {
      const { x, z } = mapCoordsToWorld(spot.mapX, spot.mapY);
      const spotGroup = new THREE.Group();
      spotGroup.position.set(x, 0.06, z);

      // Glowing aura ring on ground
      const auraRing = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 1.2, 24),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(spot.color),
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        })
      );
      auraRing.rotation.x = -Math.PI / 2;
      auraRing.name = 'parkAuraRing';
      spotGroup.add(auraRing);
      parkAuraMeshes.push(auraRing);

      // Decorative mini glowing pumpkin with emissive radiance
      const miniPkin = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.3,
          emissive: 0xea580c,
          emissiveIntensity: 0.8,
        })
      );
      miniPkin.position.y = 0.22;
      spotGroup.add(miniPkin);

      specialCandySpotsGroup.add(spotGroup);
    });

    // ==========================================
    // 4. 3D PLAYER GPS AVATAR & RADAR
    // ==========================================
    const playerGroup = new THREE.Group();
    const initWorld = mapCoordsToWorld(playerPosRef.current.mapX, playerPosRef.current.mapY);
    playerGroup.position.set(initWorld.x, 0, initWorld.z);
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // Glowing Concentric Radar Rings on Ground
    const radarRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const radarRing = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.72, 32), radarRingMat);
    radarRing.rotation.x = -Math.PI / 2;
    radarRing.position.y = 0.04;
    radarRing.name = 'playerRadarRing';
    playerGroup.add(radarRing);

    // Inner pulsing disc
    const innerDiscMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(0.48, 32), innerDiscMat);
    innerDisc.rotation.x = -Math.PI / 2;
    innerDisc.position.y = 0.035;
    playerGroup.add(innerDisc);

    // 3D Trick-or-Treater Avatar Character
    const avatarGroup = new THREE.Group();
    avatarGroup.position.y = 0.05;
    avatarGroup.name = 'avatarModel';

    // Costume: Cute Spooky Witch/Wizard Hat & Cloak
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.5 });
    const cloak = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.9, 12), cloakMat);
    cloak.position.y = 0.55;
    cloak.castShadow = true;
    avatarGroup.add(cloak);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), headMat);
    head.position.y = 1.15;
    head.castShadow = true;
    avatarGroup.add(head);

    // Hat
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.4 });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16), hatMat);
    hatBrim.position.y = 1.25;
    avatarGroup.add(hatBrim);

    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 12), hatMat);
    hatCone.position.set(0, 1.62, -0.05);
    hatCone.rotation.x = -0.15;
    avatarGroup.add(hatCone);

    // Little Pumpkin Basket
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
    const basket = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), basketMat);
    basket.position.set(0.35, 0.5, 0.2);
    avatarGroup.add(basket);

    // 3D Floating Location Pin Marker above Head
    const pinGroup = new THREE.Group();
    pinGroup.position.set(0, 2.3, 0);

    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0xdc2626,
      emissiveIntensity: 0.4,
    });
    const pinSphere = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), pinMat);
    pinSphere.position.y = 0.4;
    pinGroup.add(pinSphere);

    const pinDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    pinDot.position.set(0, 0.4, 0.2);
    pinGroup.add(pinDot);

    const pinCone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 16), pinMat);
    pinCone.rotation.x = Math.PI;
    pinCone.position.y = 0.15;
    pinGroup.add(pinCone);

    avatarGroup.add(pinGroup);

    // Player lantern light
    const playerLight = new THREE.PointLight(0xfef08a, 1.2, 7.0);
    playerLight.position.set(0, 1.2, 0.3);
    avatarGroup.add(playerLight);

    playerGroup.add(avatarGroup);

    // ==========================================
    // 5. ANIMATION LOOP
    // ==========================================
    let animFrameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Smooth & Responsive Camera Damping
      const controls = cameraControlRef.current;
      controls.spherical.radius = THREE.MathUtils.damp(
        controls.spherical.radius,
        controls.desiredRadius,
        14,
        delta
      );
      controls.spherical.theta = THREE.MathUtils.damp(
        controls.spherical.theta,
        controls.desiredTheta,
        14,
        delta
      );
      controls.spherical.phi = THREE.MathUtils.damp(
        controls.spherical.phi,
        controls.desiredPhi,
        14,
        delta
      );

      const targetLerp = controls.isDragging ? 28 : 14;
      controls.target.lerp(controls.desiredTarget, Math.min(1, targetLerp * delta));

      // Compute camera position from spherical coordinates
      const sinPhi = Math.sin(controls.spherical.phi);
      const cosPhi = Math.cos(controls.spherical.phi);
      const sinTheta = Math.sin(controls.spherical.theta);
      const cosTheta = Math.cos(controls.spherical.theta);

      camera.position.x = controls.target.x + controls.spherical.radius * sinPhi * sinTheta;
      camera.position.y = controls.target.y + controls.spherical.radius * cosPhi;
      camera.position.z = controls.target.z + controls.spherical.radius * sinPhi * cosTheta;
      camera.lookAt(controls.target);

      // Smoothly update player avatar position in 3D world
      if (playerGroupRef.current) {
        const curMap = playerPosRef.current;
        const targetWorld = mapCoordsToWorld(curMap.mapX, curMap.mapY);
        playerGroupRef.current.position.x = THREE.MathUtils.damp(
          playerGroupRef.current.position.x,
          targetWorld.x,
          8,
          delta
        );
        playerGroupRef.current.position.z = THREE.MathUtils.damp(
          playerGroupRef.current.position.z,
          targetWorld.z,
          8,
          delta
        );

        if (curMap.heading !== undefined) {
          const targetRad = THREE.MathUtils.degToRad(-curMap.heading);
          playerGroupRef.current.rotation.y = THREE.MathUtils.damp(
            playerGroupRef.current.rotation.y,
            targetRad,
            8,
            delta
          );
        }

        // Radar pulse
        const radar = playerGroupRef.current.getObjectByName('playerRadarRing');
        if (radar) {
          const pulse = (elapsed * 1.5) % 1;
          const s = 1.0 + pulse * 0.8;
          radar.scale.set(s, s, s);
          (radar as THREE.Mesh).material = radarRingMat;
          radarRingMat.opacity = Math.max(0, 0.75 * (1 - pulse));
        }

        // Avatar slight walking bob
        const avatar = playerGroupRef.current.getObjectByName('avatarModel');
        if (avatar) {
          avatar.position.y = 0.05 + Math.sin(elapsed * 6) * 0.04;
        }

        // ONLY if user explicitly requested follow mode, keep target locked on player
        if (isFollowPlayerRef.current) {
          controls.desiredTarget.set(
            playerGroupRef.current.position.x,
            0,
            playerGroupRef.current.position.z
          );
        }
      }

      // Animate candy shining effects (houses & park auras) - O(1) direct iteration
      if (neighborhoodRef.current) {
        const nb = neighborhoodRef.current;

        // Animate shining candy houses directly with subtle, gentle glow
        nb.candyHouses.forEach((house, idx) => {
          if (!house.userData.hasCandy) return;
          const pulse = (Math.sin(elapsed * 2.5 + idx * 0.8) + 1) * 0.5;
          const aura = house.userData.candyAuraRing as THREE.Mesh | undefined;
          if (aura && aura.material instanceof THREE.MeshBasicMaterial) {
            aura.material.opacity = 0.16 + pulse * 0.10; // subtle range 0.16 - 0.26
            const s = 1.0 + pulse * 0.08;
            aura.scale.set(s, s, s);
          }
          const outerAura = house.userData.candyOuterAuraRing as THREE.Mesh | undefined;
          if (outerAura && outerAura.material instanceof THREE.MeshBasicMaterial) {
            const pulse2 = (Math.sin(elapsed * 2.0 + idx * 0.8 + 1.2) + 1) * 0.5;
            outerAura.material.opacity = 0.05 + pulse2 * 0.05; // delicate corona 0.05 - 0.10
            const s2 = 1.0 + pulse2 * 0.10;
            outerAura.scale.set(s2, s2, s2);
          }
        });

        // Trees: gentle autumn breeze sway
        nb.animatedTrees.forEach(({ tree, seed }) => {
          tree.rotation.z = Math.sin(elapsed * 1.5 + seed) * 0.035;
          tree.rotation.x = Math.cos(elapsed * 1.2 + seed) * 0.02;
        });

        // Ghosts: floating apparitions
        nb.animatedGhosts.forEach(({ ghost, baseY, seed }) => {
          ghost.position.y = baseY + Math.sin(elapsed * 2.2 + seed) * 0.22;
          ghost.rotation.y = Math.sin(elapsed * 1.2 + seed) * 0.35;
        });
      }

      // Animate special park auras
      parkAuraMeshes.forEach((aura, idx) => {
        if (aura.material instanceof THREE.MeshBasicMaterial) {
          const pulse = (Math.sin(elapsed * 4 + idx * 1.5) + 1) * 0.5;
          aura.material.opacity = 0.5 + pulse * 0.45;
          const s = 1.0 + pulse * 0.25;
          aura.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            animFrameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            animFrameId = window.setTimeout(tick, 70);
          }
        };
        animFrameId = window.setTimeout(poll, 5);
      } else {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    tick();

    // ==========================================
    // 6. ERGONOMIC MOBILE TOUCH & MOUSE PAN / ZOOM / TAP
    // 1-finger drag = PAN (desplazar libremente por el croquis)
    // 2-finger pinch = ZOOM
    // Tap = seleccionar casa para ver/editar número
    // ==========================================
    const dom = renderer.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      dom.setPointerCapture(e.pointerId);
      const controls = cameraControlRef.current;
      controls.isDragging = true;
      controls.dragButton = e.button;
      controls.prevPointer = { x: e.clientX, y: e.clientY };
      controls.dragDistance = 0;
      controls.didTriggerPan = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const controls = cameraControlRef.current;
      if (!controls.isDragging) return;

      const dx = e.clientX - controls.prevPointer.x;
      const dy = e.clientY - controls.prevPointer.y;
      controls.prevPointer = { x: e.clientX, y: e.clientY };
      controls.dragDistance += Math.hypot(dx, dy);

      // User is manually moving the camera -> detach any player auto-follow (fire once per gesture)
      if (controls.dragDistance > 6 && !controls.didTriggerPan) {
        controls.didTriggerPan = true;
        isFollowPlayerRef.current = false;
        if (onManualPan) onManualPan();
      }

      // PAN across the map (Free 1-finger or drag navigation for mobile and desktop)
      // Extracts exact screen-right and screen-up ground projection from active camera
      if (controls.dragButton === 0 || controls.dragButton === 1) {
        // Natural touch & mouse pan:
        // Calculate ground pan speed proportional to camera distance and FOV
        const panSpeed = (controls.spherical.radius / 36) * 0.038;
        const camera = cameraRef.current;

        // Screen RIGHT vector projected on ground (XZ)
        let camRight = new THREE.Vector3(1, 0, 0);
        // Screen UP / Forward vector projected on ground (XZ)
        let camForward = new THREE.Vector3(0, 0, -1);

        if (camera) {
          camera.matrixWorld.extractBasis(camRight, new THREE.Vector3(), new THREE.Vector3());
          camRight.y = 0;
          if (camRight.lengthSq() > 0.00001) {
            camRight.normalize();
          }

          camera.getWorldDirection(camForward);
          camForward.y = 0;
          if (camForward.lengthSq() > 0.00001) {
            camForward.normalize();
          }
        } else {
          const sinTheta = Math.sin(controls.spherical.theta);
          const cosTheta = Math.cos(controls.spherical.theta);
          camRight.set(cosTheta, 0, -sinTheta);
          camForward.set(-sinTheta, 0, -cosTheta);
        }

        const groundDx = (-camRight.x * dx + camForward.x * dy) * panSpeed;
        const groundDz = (-camRight.z * dx + camForward.z * dy) * panSpeed;

        controls.desiredTarget.x += groundDx;
        controls.desiredTarget.z += groundDz;
        // Direct move on current target so camera moves 1:1 with finger under drag
        controls.target.x += groundDx;
        controls.target.z += groundDz;

        // Keep target reasonably within neighborhood bounds
        controls.desiredTarget.x = Math.max(-WORLD_WIDTH * 0.7, Math.min(WORLD_WIDTH * 0.7, controls.desiredTarget.x));
        controls.desiredTarget.z = Math.max(-WORLD_HEIGHT * 0.7, Math.min(WORLD_HEIGHT * 0.7, controls.desiredTarget.z));
      } else if (controls.dragButton === 2) {
        // Right-click drag: Orbit / Rotate view
        controls.desiredTheta -= dx * 0.007;
        controls.desiredPhi = Math.max(
          0.1,
          Math.min(Math.PI / 2.1, controls.desiredPhi - dy * 0.007)
        );
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      cameraControlRef.current.isDragging = false;
    };

    // Wheel zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const controls = cameraControlRef.current;
      const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
      controls.desiredRadius = Math.max(12, Math.min(85, controls.desiredRadius * zoomFactor));
    };

    // Click / Tap detection for selecting house with STRICT TAG PRIORITY
    // "Dale prioridad a las tags cuando se seleccionen en vez de las casas"
    const handleClick = (e: MouseEvent) => {
      const controls = cameraControlRef.current;
      // If user dragged substantially, it was a pan, not a tap
      if (controls.dragDistance > 16) return;

      const rect = dom.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;

      _pointer.x = ((clickX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((clickY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_pointer, camera);

      if (!neighborhoodRef.current) return;
      const housesGroup = neighborhoodRef.current.housesGroup;

      // =========================================================================
      // PRIORITY 1: FLOATING TAGS (SPRITE BADGES)
      // =========================================================================
      const visibleBadges: THREE.Sprite[] = [];
      housesGroup.traverse((child) => {
        if (child instanceof THREE.Sprite && child.name === 'houseBadgeSprite' && child.visible) {
          visibleBadges.push(child);
        }
      });

      if (visibleBadges.length > 0) {
        // 1A. Direct 3D Raycast on all visible tags first
        const badgeHits = _raycaster.intersectObjects(visibleBadges, false);
        if (badgeHits.length > 0) {
          const hitSprite = badgeHits[0].object as THREE.Sprite;
          const targetHouseId = hitSprite.userData?.houseId;
          if (targetHouseId && housesDataRef.current[targetHouseId]) {
            sounds.playSelect();
            onSelectHouse(housesDataRef.current[targetHouseId]);
            return;
          }
        }

        // 1B. Touch Screen-Space Proximity (within 44px of floating badge center)
        // Solves mobile finger inaccuracy when tapping tags
        const badgeWorldPos = new THREE.Vector3();
        let closestTagHouseId: string | null = null;
        let minPixelDist = 44;

        for (const badge of visibleBadges) {
          badge.getWorldPosition(badgeWorldPos);
          badgeWorldPos.project(camera);
          // Only test if in front of camera lens (NDC z < 1)
          if (badgeWorldPos.z < 1) {
            const screenX = ((badgeWorldPos.x + 1) * 0.5) * rect.width + rect.left;
            const screenY = ((-badgeWorldPos.y + 1) * 0.5) * rect.height + rect.top;
            const dist = Math.hypot(screenX - clickX, screenY - clickY);
            if (dist < minPixelDist) {
              minPixelDist = dist;
              closestTagHouseId = badge.userData?.houseId || null;
            }
          }
        }

        if (closestTagHouseId && housesDataRef.current[closestTagHouseId]) {
          sounds.playSelect();
          onSelectHouse(housesDataRef.current[closestTagHouseId]);
          return;
        }
      }

      // =========================================================================
      // PRIORITY 2: PHYSICAL HOUSE GEOMETRY (Roof, Walls, Foundation, Door)
      // Only runs if no tag was tapped. Auras, ground rings, and trees are ignored.
      // =========================================================================
      const houseIntersects = _raycaster.intersectObjects(housesGroup.children, true);
      for (const hit of houseIntersects) {
        const obj = hit.object;

        // Strictly ignore auras, halos, and hitboxes
        if (
          obj.userData?.isAura ||
          obj.name?.includes('Aura') ||
          obj.name?.includes('Cylinder') ||
          obj.name?.includes('HitBox')
        ) {
          continue;
        }

        let cur: THREE.Object3D | null = obj;
        let targetHouseId: string | null = cur.userData?.houseId || null;

        while (cur && cur !== housesGroup && !targetHouseId) {
          if (cur.userData?.isHouse && cur.userData?.houseId) {
            targetHouseId = cur.userData.houseId;
            break;
          }
          cur = cur.parent;
        }

        if (targetHouseId && housesDataRef.current[targetHouseId]) {
          sounds.playSelect();
          onSelectHouse(housesDataRef.current[targetHouseId]);
          return;
        }
      }
    };

    // Multi-touch gestures (Pinch-to-zoom & two-finger rotate)
    let initialTouchDist = 0;
    let initialAngle = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialTouchDist = Math.hypot(dx, dy);
        initialAngle = Math.atan2(dy, dx);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const currentAngle = Math.atan2(dy, dx);

        if (initialTouchDist > 0) {
          const ratio = initialTouchDist / currentDist;
          const controls = cameraControlRef.current;
          controls.desiredRadius = Math.max(
            12,
            Math.min(85, controls.desiredRadius * (ratio > 1 ? 1.04 : 0.96))
          );
        }
        if (initialAngle !== 0) {
          const dAngle = currentAngle - initialAngle;
          cameraControlRef.current.desiredTheta -= dAngle * 0.4;
        }

        initialTouchDist = currentDist;
        initialAngle = currentAngle;
      }
    };

    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointercancel', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('click', handleClick);
    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    dom.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animFrameId);
      clearTimeout(animFrameId);

      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointercancel', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('click', handleClick);
      dom.removeEventListener('touchstart', handleTouchStart);
      dom.removeEventListener('touchmove', handleTouchMove);

      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      mapTexture.dispose();
    };
  }, [mapCoordsToWorld, onManualPan, onMapTapMove, onSelectHouse, worldCoordsToMap]);

  // Imperative handle for parent component actions
  React.useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const controls = cameraControlRef.current;
      controls.desiredRadius = Math.max(12, controls.desiredRadius * 0.82);
    },
    zoomOut: () => {
      const controls = cameraControlRef.current;
      controls.desiredRadius = Math.min(85, controls.desiredRadius * 1.22);
    },
    resetView: () => {
      const controls = cameraControlRef.current;
      controls.desiredTheta = DEFAULT_CAMERA_CONFIG.theta;
      controls.desiredPhi = DEFAULT_CAMERA_CONFIG.phi;
      controls.desiredRadius = DEFAULT_CAMERA_CONFIG.radius;
      controls.desiredTarget.set(
        DEFAULT_CAMERA_CONFIG.targetX,
        DEFAULT_CAMERA_CONFIG.targetY,
        DEFAULT_CAMERA_CONFIG.targetZ
      );
      isFollowPlayerRef.current = false;
    },
    rotateClockwise: (angle: number = Math.PI / 4) => {
      const controls = cameraControlRef.current;
      controls.desiredTheta += angle;
    },
    rotateCounterClockwise: (angle: number = Math.PI / 4) => {
      const controls = cameraControlRef.current;
      controls.desiredTheta -= angle;
    },
    setRotationAngle: (radians: number) => {
      const controls = cameraControlRef.current;
      controls.desiredTheta = radians;
    },
    getRotationDegrees: () => {
      const theta = cameraControlRef.current.spherical.theta;
      let deg = Math.round((theta * 180) / Math.PI) % 360;
      if (deg < 0) deg += 360;
      return deg;
    },
    focusOnCoords: (mapX: number, mapY: number) => {
      const controls = cameraControlRef.current;
      const { x, z } = mapCoordsToWorld(mapX, mapY);
      controls.desiredTarget.set(x, 0, z);
      controls.desiredRadius = 22;
      isFollowPlayerRef.current = false;
    },
    recenterOnPlayer: () => {
      const controls = cameraControlRef.current;
      const { x, z } = mapCoordsToWorld(playerPosRef.current.mapX, playerPosRef.current.mapY);
      controls.desiredTarget.set(x, 0, z);
      controls.desiredRadius = 22;
      isFollowPlayerRef.current = true;
    },
    updateHouse: (houseId: string, houseNumber: string, hasCandy: boolean) => {
      if (neighborhoodRef.current) {
        const houseGroup = neighborhoodRef.current.housesGroup.getObjectByName(houseId) as THREE.Group | undefined;
        if (houseGroup) {
          updateHouseVisualState(houseGroup, houseNumber, hasCandy);
          const list = neighborhoodRef.current.candyHouses;
          const idx = list.indexOf(houseGroup);
          if (hasCandy && idx === -1) {
            list.push(houseGroup);
          } else if (!hasCandy && idx !== -1) {
            list.splice(idx, 1);
          }
        }
      }
    },
  }), [mapCoordsToWorld]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden touch-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
});

HalloweenMap3D.displayName = 'HalloweenMap3D';
