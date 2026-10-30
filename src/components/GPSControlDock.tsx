import React, { useState } from 'react';
import {
  Compass,
  Crosshair,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sunset,
  ChevronDown,
  ChevronUp,
  Candy,
  Plus,
  Minus,
  Footprints,
  RotateCcw,
  Sparkles,
  Navigation,
  Play,
  Square,
} from 'lucide-react';
import { CameraPreset, TimeOfDay, PlayerPosition } from '../types';
import { sounds } from '../audio/soundEffects';

interface GPSControlDockProps {
  playerPos: PlayerPosition;
  isGpsAvailable: boolean;
  gpsActive: boolean;
  isJourneyStarted: boolean;
  gpsError: string | null;
  onStartJourney: () => void;
  onStopJourney: () => void;
  onToggleGps: () => void;
  onCalibrateGps: () => void;
  onResetToStart: () => void;
  onRecenterOnPlayer: () => void;
  isFollowingPlayer: boolean;
  cameraPreset: CameraPreset;
  onSetCameraPreset: (preset: CameraPreset) => void;
  timeOfDay: TimeOfDay;
  onSetTimeOfDay: (time: TimeOfDay) => void;
  collectedCount: number;
  totalCandiesCount: number;
  candyHousesCount: number;
  totalHousesCount: number;
  onOpenCandyBag: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isWalkModeActive: boolean;
  onToggleWalkMode: () => void;
}

export const GPSControlDock: React.FC<GPSControlDockProps> = ({
  playerPos,
  isGpsAvailable,
  gpsActive,
  isJourneyStarted,
  gpsError,
  onStartJourney,
  onStopJourney,
  onToggleGps,
  onCalibrateGps,
  onResetToStart,
  onRecenterOnPlayer,
  isFollowingPlayer,
  cameraPreset,
  onSetCameraPreset,
  timeOfDay,
  onSetTimeOfDay,
  collectedCount,
  totalCandiesCount,
  candyHousesCount,
  totalHousesCount,
  onOpenCandyBag,
  onZoomIn,
  onZoomOut,
  onResetView,
  isWalkModeActive,
  onToggleWalkMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [activeTab, setActiveTab] = useState<'gps' | 'camera' | 'atmosphere'>('gps');

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  return (
    <div
      className="fixed z-40 left-1/2 -translate-x-1/2 pointer-events-auto transition-all duration-300 w-full px-3"
      style={{
        bottom: isCollapsed ? '-8px' : '16px',
        maxWidth: 'min(940px, 96vw)',
      }}
    >
      {/* Collapse / Expand Tab Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-4 py-1.5 rounded-t-xl bg-slate-900 border-t border-x border-amber-500/50 text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-black/50 transition-all cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-4 h-4 text-amber-400" />
              <span>Mostrar Panel GPS & Casas 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-amber-400" />
              <span>Ocultar Panel (Navegar Libremente)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      {!isCollapsed && (
        <div
          className="rounded-2xl border border-amber-500/40 p-3 shadow-2xl text-slate-100 flex flex-col gap-2.5"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.96)' }}
        >
          {/* Top Bar: Live GPS Status Badge & Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Halloween 3D GPS
              </span>

              {/* GPS Live State Badge */}
              <div
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 border ${
                  isJourneyStarted
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isJourneyStarted ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                />
                <span>{isJourneyStarted ? 'Recorrido en Vivo' : 'En Caseta INICIO'}</span>
              </div>

              {/* Candy Houses Counter */}
              <div className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium flex items-center gap-1">
                <span>🍬 {candyHousesCount} casas con dulces brillando</span>
              </div>

              {gpsError && (
                <span className="text-[11px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 truncate max-w-[220px]">
                  {gpsError}
                </span>
              )}
            </div>

            {/* Quick Actions Right: Candy Basket Counter & Sound */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCandyBag}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Candy className="w-4 h-4" />
                <span>Dulces: {collectedCount}/{totalCandiesCount}</span>
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={isMuted ? 'Activar Sonidos' : 'Silenciar'}
                aria-label="Silenciar o activar sonido"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800/80 pb-1.5 text-xs">
            <button
              onClick={() => setActiveTab('gps')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'gps'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Ubicación GPS</span>
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Cámara & Navegación</span>
            </button>
            <button
              onClick={() => setActiveTab('atmosphere')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'atmosphere'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Ambiente de Noche</span>
            </button>
          </div>

          {/* Tab Content 1: Ubicación & GPS */}
          {activeTab === 'gps' && (
            <div className="space-y-2.5">
              {/* Prominent HERO "Comenzar" Button */}
              {!isJourneyStarted ? (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-950/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/40 shrink-0">
                      <Play className="w-5 h-5 fill-slate-950 translate-x-0.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        Comenzar Recorrido GPS
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase">
                          Listo
                        </span>
                      </p>
                      <p className="text-xs text-amber-200/80">
                        El monito permanece en la zona de inicio. Presiona comenzar para seguir tus movimientos por GPS.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playCollectCandy();
                      onStartJourney();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/40 active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>COMENZAR</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 shrink-0 animate-pulse">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                        Recorrido Activo con GPS
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </p>
                      <p className="text-xs text-slate-300">
                        El monito sigue tus pasos reales mientras caminas por la colonia.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        sounds.playSelect();
                        onStopJourney();
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-amber-300" />
                      <span>Detener</span>
                    </button>
                    <button
                      onClick={onResetToStart}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                      <span>Volver a Inicio</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={onToggleGps}
                  disabled={!isGpsAvailable}
                  className={`p-2.5 rounded-xl font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                    isJourneyStarted
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700/80 text-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>{isJourneyStarted ? 'Pausar GPS' : 'Activar GPS'}</span>
                </button>

                <button
                  onClick={onRecenterOnPlayer}
                  className={`p-2.5 rounded-xl font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                    isFollowingPlayer
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-800/90 border-slate-700 hover:border-amber-500/50 hover:bg-slate-700/80 text-slate-200'
                  }`}
                  title="Centrar la cámara en mi avatar"
                >
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Centrar en Mí</span>
                </button>

                <button
                  onClick={onResetToStart}
                  className="p-2.5 rounded-xl font-semibold bg-slate-800/90 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-700/80 text-slate-200 flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-orange-400" />
                  <span>Ir a Caseta INICIO</span>
                </button>

                <button
                  onClick={onToggleWalkMode}
                  className={`p-2.5 rounded-xl font-semibold border flex flex-col items-center justify-center gap-1 transition-all ${
                    isWalkModeActive
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Footprints className="w-4 h-4 text-amber-400" />
                  <span>{isWalkModeActive ? 'Ocultar Joystick' : 'Caminar (Joystick)'}</span>
                </button>
              </div>

              {/* Coordinates info tag */}
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                <span>📍 Origen GPS: <strong className="text-amber-300">19.78282° N, -104.35639° W</strong> (INICIO)</span>
                <span>💡 Toca cualquier casa para ver y editar su número</span>
              </div>
            </div>
          )}

          {/* Tab Content 2: Cámara 3D & Zoom */}
          {activeTab === 'camera' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Zoom In / Out Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 mr-1 text-[11px]">Zoom:</span>
                <button
                  onClick={onZoomIn}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center transition-colors"
                  title="Zoom In"
                  aria-label="Acercar mapa"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={onZoomOut}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center transition-colors"
                  title="Zoom Out"
                  aria-label="Alejar mapa"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={onRecenterOnPlayer}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Centrar en Mí</span>
                </button>
                <button
                  onClick={onResetView}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px]"
                >
                  Restablecer
                </button>
              </div>

              {/* Camera Presets */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-slate-400 mr-1 text-[11px]">Ángulo:</span>
                {(
                  [
                    { id: 'isometric', label: '📐 Isométrico 3D' },
                    { id: 'topdown', label: '🗺️ Vista Aérea' },
                    { id: 'cinematic', label: '🎃 Rasante 3D' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onSetCameraPreset(preset.id)}
                    className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-[11px] ${
                      cameraPreset === preset.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content 3: Ambiente & Iluminación */}
          {activeTab === 'atmosphere' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Momento del Día:</span>
                {(
                  [
                    { id: 'night', label: 'Noche Embrujada', icon: Moon },
                    { id: 'twilight', label: 'Crepúsculo Ámbar', icon: Sunset },
                    { id: 'day', label: 'Día Soleado', icon: Sun },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSetTimeOfDay(t.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                        timeOfDay === t.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Tip: Arrastra libremente con 1 dedo para explorar todo el vecindario.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
