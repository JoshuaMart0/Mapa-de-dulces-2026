import React, { useState } from 'react';
import { Candy, Navigation, HelpCircle, X, Sparkles, Compass } from 'lucide-react';
import { CANDY_LOCATIONS } from '../data/candyLocations';

interface HeaderBadgeProps {
  collectedCount: number;
  nearestCandyDistance: number | null;
  nearestCandyName: string | null;
  currentStreetName?: string;
  onResetNorth?: () => void;
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({
  collectedCount,
  nearestCandyDistance,
  nearestCandyName,
  currentStreetName,
  onResetNorth,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="fixed top-3 left-3 z-30 pointer-events-none select-none flex flex-col gap-1.5 max-w-[calc(100vw-24px)]">
        {/* Brand Badge */}
        <div className="flex items-center gap-2">
          <div
            className="px-3.5 py-2 rounded-2xl border border-amber-500/40 shadow-xl flex items-center gap-2.5 pointer-events-auto"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.94)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Candy className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
                <span>Mapa 3D Halloween</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Croquis 3D
                </span>
              </h1>
              <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                <span className="text-amber-400 font-semibold">📍 {currentStreetName || 'Jardines Autlán'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{collectedCount}/{CANDY_LOCATIONS.length} Dulces</span>
              </p>
            </div>
          </div>

          {/* Compass / Reset North button */}
          {onResetNorth && (
            <button
              onClick={onResetNorth}
              className="p-2 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-amber-400 shadow-xl pointer-events-auto transition-colors"
              title="Alinear al Norte"
              aria-label="Alinear al Norte"
            >
              <Compass className="w-5 h-5" />
            </button>
          )}

          {/* Help Info Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-white shadow-xl pointer-events-auto transition-colors"
            title="Cómo usar este mapa"
            aria-label="Ayuda"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Closest Candy Radar Pill */}
        {nearestCandyName && nearestCandyDistance !== null && (
          <div
            className="px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md text-xs flex items-center gap-2 pointer-events-auto max-w-fit"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.92)' }}
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-300">Más cercano:</span>
            <strong className="text-amber-300 truncate max-w-[130px] sm:max-w-[200px]">
              {nearestCandyName}
            </strong>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {Math.round(nearestCandyDistance)}m
            </span>
          </div>
        )}
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl p-5 shadow-2xl text-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Sparkles className="w-5 h-5" />
                <span>Guía del Mapa 3D de Halloween</span>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold">
                  1
                </span>
                <p>
                  <strong>GPS en Tiempo Real:</strong> Toca "Activar GPS Teléfono" en la barra inferior. Tu posición se actualizará en vivo sobre el mapa 3D mientras caminas. Si estás lejos del vecindario, toca "Alinear GPS aquí" para calibrar tus pasos reales con el mapa.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold">
                  2
                </span>
                <p>
                  <strong>Caramelos 3D Interactivos:</strong> Los caramelos brillantes indican casas y puntos donde están repartiendo dulces. Toca cualquier caramelo para ver la dirección, qué dulces regalan y trazar tu ruta neón.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold">
                  3
                </span>
                <p>
                  <strong>Navegación 3D y Zoom:</strong> Usa pellizco con dos dedos en tu teléfono o la rueda del mouse para hacer Zoom In y Zoom Out. Arrastra para rotar en 3D o cambiar de ángulo.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold">
                  4
                </span>
                <p>
                  <strong>Modo Simulación:</strong> Puedes caminar usando las teclas WASD / flechas o activar el botón "Caminar (Joystick)" para moverte libremente con el control virtual.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              ¡Entendido, a buscar dulces!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

