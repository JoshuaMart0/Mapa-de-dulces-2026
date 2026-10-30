import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { HalloweenMap3D, HalloweenMapHandle } from './components/HalloweenMap3D';
import { HouseModal } from './components/HouseModal';
import { CandyBagDrawer } from './components/CandyBagDrawer';
import { HeaderBadge } from './components/HeaderBadge';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CameraControlsDock } from './components/CameraControlsDock';
import { CandyHousesListModal } from './components/CandyHousesListModal';
import { useGeolocation, NEIGHBORHOOD_WIDTH_METERS, NEIGHBORHOOD_HEIGHT_METERS } from './hooks/useGeolocation';
import { CANDY_LOCATIONS } from './data/candyLocations';
import { loadHousesData, saveHousesData } from './data/housesData';
import { HouseData, CameraPreset, TimeOfDay } from './types';
import { sounds } from './audio/soundEffects';
import { getClosestStreetName } from './data/streetNetwork';
import { Navigation, Play, ShieldAlert, LogOut, Lock, Edit3, Candy, MousePointerClick } from 'lucide-react';

import { subscribeToHouses, saveHouseToFirestore } from './data/firestoreHousesService';

export default function App() {
  const mapRef = useRef<HalloweenMapHandle>(null);

  const {
    playerPos,
    isJourneyStarted,
    gpsError,
    startJourney,
    stopJourney,
  } = useGeolocation();

  // Houses State & Persistence
  const [housesData, setHousesData] = useState<Record<string, HouseData>>(() => loadHousesData());
  const [selectedHouse, setSelectedHouse] = useState<HouseData | null>(null);

  // Admin Authentication State ("halloween2026")
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('halloween_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminCursorToolActive, setIsAdminCursorToolActive] = useState(true);

  // Navigation State
  const [isFollowingPlayer, setIsFollowingPlayer] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCandyListOpen, setIsCandyListOpen] = useState(false);
  const [cameraResetSignal, setCameraResetSignal] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [timeOfDay] = useState<TimeOfDay>('night');

  // Load collected candies from localStorage
  const [collectedCandyIds, setCollectedCandyIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('halloween_collected_candies_v1');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
    return new Set<string>();
  });

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(
        'halloween_collected_candies_v1',
        JSON.stringify(Array.from(collectedCandyIds))
      );
    } catch {
      // ignore
    }
  }, [collectedCandyIds]);

  // Real-time Firestore sync across all devices & users
  useEffect(() => {
    const unsubscribe = subscribeToHouses((liveHouses) => {
      setHousesData(liveHouses);
      // Synchronize 3D scene visual state and floating badges for each house
      Object.values(liveHouses).forEach((house) => {
        mapRef.current?.updateHouse(house.id, house.houseNumber, house.hasCandy);
      });
    });

    return () => unsubscribe();
  }, []);

  // Count houses with candy
  const candyHousesCount = useMemo(() => {
    return Object.values(housesData).filter((h) => h.hasCandy).length;
  }, [housesData]);

  // Distance calculation helper
  const getCoordsDistanceMeters = useCallback(
    (mapX: number, mapY: number) => {
      const dxMeters = (mapX - playerPos.mapX) * NEIGHBORHOOD_WIDTH_METERS;
      const dyMeters = (mapY - playerPos.mapY) * NEIGHBORHOOD_HEIGHT_METERS;
      return Math.hypot(dxMeters, dyMeters);
    },
    [playerPos.mapX, playerPos.mapY]
  );

  // Compute closest shining candy spot (house or park)
  const nearestCandyInfo = useMemo(() => {
    let minDistance = Infinity;
    let closestName: string | null = null;

    Object.values(housesData).forEach((h) => {
      if (h.hasCandy) {
        const dist = getCoordsDistanceMeters(h.mapX, h.mapY);
        if (dist < minDistance) {
          minDistance = dist;
          closestName = `Casa #${h.houseNumber} (${h.streetName})`;
        }
      }
    });

    CANDY_LOCATIONS.forEach((c) => {
      const dist = getCoordsDistanceMeters(c.mapX, c.mapY);
      if (dist < minDistance) {
        minDistance = dist;
        closestName = c.name;
      }
    });

    return {
      distance: minDistance === Infinity ? null : minDistance,
      name: closestName,
    };
  }, [housesData, getCoordsDistanceMeters]);

  // Current street based on croquis road network
  const currentStreetName = useMemo(() => {
    return getClosestStreetName(playerPos.mapX, playerPos.mapY);
  }, [playerPos.mapX, playerPos.mapY]);

  // Handle house saving by Admin (syncs to Firestore in cloud)
  const handleSaveHouse = useCallback((updated: HouseData) => {
    // 1. Instant local visual update & 3D badge update
    setHousesData((prev) => ({ ...prev, [updated.id]: updated }));
    mapRef.current?.updateHouse(updated.id, updated.houseNumber, updated.hasCandy);

    // 2. Persist to Firestore cloud database so every user's phone updates in real time
    saveHouseToFirestore(updated);
  }, []);

  // Handle candy collection toggle
  const handleToggleCollectedCandy = useCallback((houseId: string) => {
    setCollectedCandyIds((prev) => {
      const next = new Set(prev);
      if (next.has(houseId)) {
        next.delete(houseId);
      } else {
        next.add(houseId);
      }
      return next;
    });
  }, []);

  // Recenter on player
  const handleRecenterOnPlayer = useCallback(() => {
    sounds.playSelect();
    mapRef.current?.recenterOnPlayer();
    setIsFollowingPlayer(true);
  }, []);

  const handleResetView = () => {
    mapRef.current?.resetView();
    setCameraPreset('isometric');
    setIsFollowingPlayer(false);
    setCameraResetSignal((prev) => prev + 1);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    try {
      sessionStorage.setItem('halloween_admin_auth', 'true');
    } catch {
      // ignore
    }
  };

  const handleAdminLogout = () => {
    sounds.playSelect();
    setIsAdmin(false);
    try {
      sessionStorage.removeItem('halloween_admin_auth');
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D Isometric Three.js Canvas */}
      <HalloweenMap3D
        ref={mapRef}
        playerPos={playerPos}
        selectedHouseId={selectedHouse?.id ?? null}
        onSelectHouse={(house) => setSelectedHouse(house)}
        housesData={housesData}
        timeOfDay={timeOfDay}
        cameraPreset={cameraPreset}
        isFollowPlayer={isFollowingPlayer}
        onManualPan={() => setIsFollowingPlayer(false)}
        isAdmin={isAdmin}
        isAdminCursorActive={isAdmin && isAdminCursorToolActive}
      />

      {/* 360° Mobile Rotation & Zoom Controls Dock */}
      <CameraControlsDock
        onRotateLeft={() => mapRef.current?.rotateCounterClockwise(Math.PI / 4)}
        onRotateRight={() => mapRef.current?.rotateClockwise(Math.PI / 4)}
        onResetAngle={handleResetView}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        resetSignal={cameraResetSignal}
      />

      {/* Top Header Badge (Clean & Minimalist for participants) */}
      <HeaderBadge
        collectedCount={collectedCandyIds.size}
        nearestCandyDistance={nearestCandyInfo.distance}
        nearestCandyName={nearestCandyInfo.name}
        currentStreetName={currentStreetName}
        onResetNorth={handleResetView}
      />

      {/* ========================================================= */}
      {/* PRIMARY GPS BUTTON (ONLY BUTTON PARTICIPANTS NEED)       */}
      {/* ========================================================= */}
      {!isJourneyStarted ? (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[90vw]">
          <button
            onClick={() => {
              sounds.playCollectCandy();
              startJourney();
              setIsFollowingPlayer(true);
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wider shadow-2xl shadow-orange-500/40 border-2 border-amber-300 ring-2 ring-amber-500/30 flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950 shrink-0" />
            <span className="whitespace-nowrap">COMENZAR RECORRIDO GPS</span>
          </button>
        </div>
      ) : (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[90vw]">
          <div className="px-4 py-2 rounded-full bg-slate-900/95 border border-emerald-500/60 shadow-xl flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="whitespace-nowrap">GPS en Vivo: Siguiéndote en tiempo real</span>
            <button
              onClick={() => {
                sounds.playSelect();
                stopJourney();
              }}
              className="ml-2 text-[11px] text-amber-300 hover:text-white px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
            >
              Detener
            </button>
          </div>
        </div>
      )}

      {/* GPS Error notification if permissions blocked */}
      {gpsError && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[90vw] px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs shadow-xl text-center">
          {gpsError}
        </div>
      )}

      {/* Recenter on Player Floating Button */}
      <button
        onClick={handleRecenterOnPlayer}
        className={`fixed top-20 right-3.5 z-30 p-3 rounded-2xl shadow-xl border transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
          isFollowingPlayer
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30 ring-2 ring-amber-400/50'
            : 'bg-slate-900/95 hover:bg-slate-800 text-amber-400 border-amber-500/40 shadow-black/60'
        }`}
        title="Centrar mapa en mi ubicación GPS"
        aria-label="Centrar en mi ubicación"
      >
        <Navigation className="w-5 h-5" />
      </button>

      {/* ========================================================= */}
      {/* ADMIN STATUS BANNER (ONLY SHOWN WHEN LOGGED IN AS ADMIN) */}
      {/* ========================================================= */}
      {isAdmin && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[94vw] w-auto">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-amber-500/70 shadow-2xl flex items-center gap-3 text-xs text-amber-200 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black shrink-0">
                <Edit3 className="w-4 h-4" />
              </span>
              <div>
                <span className="font-black text-white block leading-tight text-xs sm:text-sm">Modo Administrador</span>
                <span className="text-[11px] text-amber-300/90 leading-tight block">
                  {isAdminCursorToolActive
                    ? '🎯 Selector con Mouse Activo: Pasa el cursor sobre una casa para seleccionarla y editarla'
                    : 'Modo navegación estándar'}
                </span>
              </div>
            </div>

            {/* Toggle Herramienta Cursor / Puntero Selector */}
            <button
              onClick={() => {
                sounds.playSelect();
                setIsAdminCursorToolActive((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
                isAdminCursorToolActive
                  ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-md shadow-amber-500/40 ring-1 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title="Activar o desactivar herramienta de cursor para seleccionar casas"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>{isAdminCursorToolActive ? 'Puntero: ON' : 'Puntero: OFF'}</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="ml-1 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-rose-950/80 hover:border-rose-500/40 flex items-center gap-1.5 font-semibold text-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CORNER BUTTON: LISTA DE CASAS REGISTRADAS PARA DULCES    */}
      {/* ========================================================= */}
      <div className="fixed bottom-3.5 left-3.5 z-30 pointer-events-auto">
        <button
          onClick={() => {
            sounds.playSelect();
            setIsCandyListOpen(true);
          }}
          className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-2xl shadow-orange-500/40 border-2 border-amber-300 ring-2 ring-amber-500/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          title="Ver lista de casas registradas para pedir dulce"
          aria-label="Ver casas con dulces"
        >
          <Candy className="w-4 h-4 text-slate-950 shrink-0" />
          <span className="whitespace-nowrap font-black">Casas con Dulces</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-extrabold text-[11px] leading-tight">
            {candyHousesCount}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUBTLE ADMIN CORNER BUTTON (ACCESO PARA EL ORGANIZADOR)   */}
      {/* ========================================================= */}
      {!isAdmin && (
        <button
          onClick={() => setIsAdminLoginOpen(true)}
          className="fixed bottom-3 right-3 z-30 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/95 border border-slate-800 hover:border-amber-500/40 text-slate-500 hover:text-amber-400 transition-all text-[11px] flex items-center gap-1.5 pointer-events-auto cursor-pointer shadow-md"
          title="Acceso de Administrador"
          aria-label="Acceso de Administrador"
        >
          <Lock className="w-3 h-3" />
          <span className="font-medium">Admin</span>
        </button>
      )}

      {/* Candy Houses List Modal */}
      <CandyHousesListModal
        isOpen={isCandyListOpen}
        onClose={() => setIsCandyListOpen(false)}
        housesData={housesData}
        collectedIds={collectedCandyIds}
        onToggleCollected={handleToggleCollectedCandy}
        onFocusHouse={(house) => {
          mapRef.current?.focusOnCoords(house.mapX, house.mapY);
          setSelectedHouse(house);
          setIsFollowingPlayer(false);
        }}
        getDistanceMeters={getCoordsDistanceMeters}
      />

      {/* Admin Login Password Modal ("halloween2026") */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* House Modal (View Mode for attendees, Edit Mode for Admin) */}
      {(() => {
        const activeHouse = selectedHouse ? (housesData[selectedHouse.id] || selectedHouse) : null;
        if (!activeHouse) return null;
        return (
          <HouseModal
            house={activeHouse}
            onClose={() => setSelectedHouse(null)}
            onSave={handleSaveHouse}
            isCandyCollected={collectedCandyIds.has(activeHouse.id)}
            onToggleCollected={handleToggleCollectedCandy}
            distanceMeters={getCoordsDistanceMeters(activeHouse.mapX, activeHouse.mapY)}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        );
      })()}

      {/* Candy Bag / Trick or Treat Drawer */}
      <CandyBagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        candies={CANDY_LOCATIONS}
        collectedIds={collectedCandyIds}
        onSelectCandy={(candy) => {
          setIsBagOpen(false);
          const foundHouse = Object.values(housesData).find(
            (h) => h.houseNumber === candy.houseNumber?.replace('#', '') || (Math.abs(h.mapX - candy.mapX) < 0.03 && Math.abs(h.mapY - candy.mapY) < 0.03)
          );
          if (foundHouse) {
            setSelectedHouse(foundHouse);
          }
        }}
        getDistanceMeters={(candy) => getCoordsDistanceMeters(candy.mapX, candy.mapY)}
      />
    </div>
  );
}
