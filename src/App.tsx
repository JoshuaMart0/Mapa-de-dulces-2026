import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { HalloweenMap3D, HalloweenMapHandle } from './components/HalloweenMap3D';
import { GPSControlDock } from './components/GPSControlDock';
import { HouseModal } from './components/HouseModal';
import { CandyBagDrawer } from './components/CandyBagDrawer';
import { HeaderBadge } from './components/HeaderBadge';
import { VirtualJoystick } from './components/VirtualJoystick';
import { useGeolocation, NEIGHBORHOOD_WIDTH_METERS, NEIGHBORHOOD_HEIGHT_METERS } from './hooks/useGeolocation';
import { CANDY_LOCATIONS } from './data/candyLocations';
import { loadHousesData, saveHousesData } from './data/housesData';
import { HouseData, CandyLocation, CameraPreset, TimeOfDay } from './types';
import { sounds } from './audio/soundEffects';
import { getClosestStreetName } from './data/streetNetwork';
import { Navigation, Play } from 'lucide-react';

export default function App() {
  const mapRef = useRef<HalloweenMapHandle>(null);

  const {
    playerPos,
    isGpsAvailable,
    gpsActive,
    isJourneyStarted,
    gpsError,
    startJourney,
    stopJourney,
    toggleGps,
    calibrateToCurrentLocation,
    teleportTo,
    walkStep,
    resetToStart,
  } = useGeolocation();

  // Houses State & Persistence
  const [housesData, setHousesData] = useState<Record<string, HouseData>>(() => loadHousesData());
  const [selectedHouse, setSelectedHouse] = useState<HouseData | null>(null);

  // Navigation State
  const [isFollowingPlayer, setIsFollowingPlayer] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isWalkModeActive, setIsWalkModeActive] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');

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

  // Count houses with candy
  const candyHousesCount = useMemo(() => {
    return Object.values(housesData).filter((h) => h.hasCandy).length;
  }, [housesData]);

  const totalHousesCount = useMemo(() => {
    return Object.keys(housesData).length;
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

    // Check candy houses
    Object.values(housesData).forEach((h) => {
      if (h.hasCandy) {
        const dist = getCoordsDistanceMeters(h.mapX, h.mapY);
        if (dist < minDistance) {
          minDistance = dist;
          closestName = `Casa #${h.houseNumber} (${h.streetName})`;
        }
      }
    });

    // Check special park candy spots
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

  // Handle house saving
  const handleSaveHouse = useCallback((updated: HouseData) => {
    setHousesData((prev) => {
      const next = { ...prev, [updated.id]: updated };
      saveHousesData(next);
      return next;
    });
    // Immediately update 3D scene visual state
    mapRef.current?.updateHouse(updated.id, updated.houseNumber, updated.hasCandy);
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

  // Zoom controls
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapRef.current?.resetView();
    setCameraPreset('isometric');
    setIsFollowingPlayer(false);
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
      />

      {/* Top Header Badge */}
      <HeaderBadge
        collectedCount={collectedCandyIds.size}
        nearestCandyDistance={nearestCandyInfo.distance}
        nearestCandyName={nearestCandyInfo.name}
        currentStreetName={currentStreetName}
        onResetNorth={handleResetView}
      />

      {/* Floating Primary "COMENZAR" Button */}
      {!isJourneyStarted ? (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[90vw]">
          <button
            onClick={() => {
              sounds.playCollectCandy();
              startJourney();
              setIsFollowingPlayer(true);
            }}
            className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-2xl shadow-orange-500/50 border-2 border-amber-300 ring-4 ring-amber-500/30 flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950 shrink-0" />
            <span className="whitespace-nowrap">COMENZAR RECORRIDO GPS</span>
          </button>
        </div>
      ) : (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[90vw]">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/50 backdrop-blur-md shadow-xl flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GPS en Vivo</span>
            <button
              onClick={() => {
                sounds.playSelect();
                stopJourney();
              }}
              className="ml-2 text-[10px] text-amber-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
            >
              Detener
            </button>
          </div>
        </div>
      )}

      {/* Floating Recenter on Player Button (Ergonomic for mobile thumb access) */}
      <button
        onClick={handleRecenterOnPlayer}
        className={`fixed top-20 right-3.5 z-30 p-3 rounded-2xl shadow-xl border backdrop-blur transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
          isFollowingPlayer
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30 ring-2 ring-amber-400/50'
            : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-amber-500/40 shadow-black/60'
        }`}
        title="Centrar mapa en mi ubicación GPS"
        aria-label="Centrar en mi ubicación"
      >
        <Navigation className="w-5 h-5" />
      </button>

      {/* Virtual Joystick for walking simulation */}
      <VirtualJoystick
        isOpen={isWalkModeActive}
        onWalk={(dx, dy) => walkStep(dx, dy)}
      />

      {/* Ergonomic Collapsible Bottom Dock */}
      <GPSControlDock
        playerPos={playerPos}
        isGpsAvailable={isGpsAvailable}
        gpsActive={gpsActive}
        isJourneyStarted={isJourneyStarted}
        gpsError={gpsError}
        onStartJourney={() => {
          sounds.playCollectCandy();
          startJourney();
          setIsFollowingPlayer(true);
        }}
        onStopJourney={() => {
          sounds.playSelect();
          stopJourney();
        }}
        onToggleGps={() => {
          sounds.playSelect();
          toggleGps();
        }}
        onCalibrateGps={() => {
          sounds.playSelect();
          calibrateToCurrentLocation();
        }}
        onResetToStart={() => {
          sounds.playSelect();
          resetToStart();
        }}
        onRecenterOnPlayer={handleRecenterOnPlayer}
        isFollowingPlayer={isFollowingPlayer}
        cameraPreset={cameraPreset}
        onSetCameraPreset={(preset) => {
          sounds.playSelect();
          setCameraPreset(preset);
        }}
        timeOfDay={timeOfDay}
        onSetTimeOfDay={(t) => {
          sounds.playSelect();
          setTimeOfDay(t);
        }}
        collectedCount={collectedCandyIds.size}
        totalCandiesCount={CANDY_LOCATIONS.length + candyHousesCount}
        candyHousesCount={candyHousesCount}
        totalHousesCount={totalHousesCount}
        onOpenCandyBag={() => {
          sounds.playSelect();
          setIsBagOpen(true);
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        isWalkModeActive={isWalkModeActive}
        onToggleWalkMode={() => setIsWalkModeActive(!isWalkModeActive)}
      />

      {/* House Number Inspection & Editing Modal */}
      {selectedHouse && (
        <HouseModal
          house={selectedHouse}
          onClose={() => setSelectedHouse(null)}
          onSave={handleSaveHouse}
          isCandyCollected={collectedCandyIds.has(selectedHouse.id)}
          onToggleCollected={handleToggleCollectedCandy}
          distanceMeters={getCoordsDistanceMeters(selectedHouse.mapX, selectedHouse.mapY)}
        />
      )}

      {/* Candy Bag / Trick or Treat Drawer */}
      <CandyBagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        candies={CANDY_LOCATIONS}
        collectedIds={collectedCandyIds}
        onSelectCandy={(candy) => {
          setIsBagOpen(false);
          // If candy corresponds to a house, select that house
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
