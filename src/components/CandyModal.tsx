import React from 'react';
import { CandyLocation } from '../types';
import { Candy, MapPin, Navigation, CheckCircle2, Sparkles, X, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../audio/soundEffects';

interface CandyModalProps {
  candy: CandyLocation | null;
  onClose: () => void;
  isCollected: boolean;
  onCollect: (candyId: string) => void;
  distanceMeters: number;
}

export const CandyModal: React.FC<CandyModalProps> = ({
  candy,
  onClose,
  isCollected,
  onCollect,
  distanceMeters,
}) => {
  if (!candy) return null;

  const handleCollectClick = () => {
    sounds.playCollectCandy();
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981'],
    });
    onCollect(candy.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-purple-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-950/40 border border-amber-300 flex items-center justify-center shadow-inner">
              <Candy className="w-6 h-6 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-amber-200">
                Punto de Entrega de Dulces
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">{candy.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Location & Proximity */}
          <div className="flex items-center justify-between bg-slate-800/90 rounded-xl p-3 border border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                <strong className="text-white">{candy.street}</strong> {candy.houseNumber}
              </span>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-300 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              <span>A ~{Math.round(distanceMeters)} m</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            {candy.description}
          </p>

          {/* Treats List */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>¿Qué dulces están repartiendo aquí?</span>
            </div>
            <ul className="space-y-1.5">
              {candy.treatsList.map((treat, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60 text-slate-200"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span>{treat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Estado en vivo:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded ${
                candy.status === 'special'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
              }`}
            >
              {candy.statusText}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            {isCollected ? (
              <div className="w-full py-3 bg-emerald-950 border border-emerald-500/60 rounded-xl text-emerald-300 font-semibold flex items-center justify-center gap-2 text-sm shadow-inner">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>¡Dulce recolectado en tu canasta!</span>
              </div>
            ) : (
              <button
                onClick={handleCollectClick}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>¡Pedir Calaverita / Recoger Dulce!</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors"
            >
              Cerrar y seguir explorando el mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
