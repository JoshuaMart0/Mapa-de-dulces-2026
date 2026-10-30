import React from 'react';
import { CandyLocation } from '../types';
import { Candy, CheckCircle, Navigation, X, Sparkles, MapPin } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface CandyBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candies: CandyLocation[];
  collectedIds: Set<string>;
  onSelectCandy: (candy: CandyLocation) => void;
  getDistanceMeters: (candy: CandyLocation) => number;
}

export const CandyBagDrawer: React.FC<CandyBagDrawerProps> = ({
  isOpen,
  onClose,
  candies,
  collectedIds,
  onSelectCandy,
  getDistanceMeters,
}) => {
  if (!isOpen) return null;

  // Sort candies by distance from player
  const sortedCandies = [...candies].sort((a, b) => {
    return getDistanceMeters(a) - getDistanceMeters(b);
  });

  const collectedCount = collectedIds.size;
  const totalCount = candies.length;
  const progressPercent = Math.round((collectedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 pointer-events-auto">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-amber-500/40 text-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-orange-500/20">
              <Candy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Mi Canasta de Dulces</h3>
              <p className="text-xs text-amber-400">
                {collectedCount} de {totalCount} puntos recolectados ({progressPercent}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800">
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {collectedCount === totalCount && (
            <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>¡Felicidades! ¡Has recolectado todos los dulces del vecindario!</span>
            </div>
          )}
        </div>

        {/* Candies List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedCandies.map((candy) => {
            const isCollected = collectedIds.has(candy.id);
            const dist = Math.round(getDistanceMeters(candy));

            return (
              <div
                key={candy.id}
                onClick={() => {
                  sounds.playSelect();
                  onSelectCandy(candy);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCollected
                    ? 'bg-slate-950/60 border-emerald-900/40 text-slate-400 opacity-75 hover:opacity-100'
                    : 'bg-slate-800/90 border-slate-700/80 hover:border-amber-500/70 hover:bg-slate-800 text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: candy.color + '25',
                      border: `1.5px solid ${candy.color}`,
                    }}
                  >
                    <Candy className="w-5 h-5" style={{ color: candy.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{candy.name}</h4>
                      {isCollected && (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {candy.street} {candy.houseNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-300/80 mt-1 truncate">
                      {candy.treatsList.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>{dist} m</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Ver en 3D</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          Toca cualquier punto para enfocar la cámara 3D y trazar la ruta de dulces.
        </div>
      </div>
    </div>
  );
};
