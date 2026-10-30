import React, { useState, useEffect } from 'react';
import { HouseData } from '../types';
import { Home, Sparkles, Candy, MapPin, Check, X, Edit3 } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface HouseModalProps {
  house: HouseData;
  onClose: () => void;
  onSave: (updatedHouse: HouseData) => void;
  isCandyCollected?: boolean;
  onToggleCollected?: (houseId: string) => void;
  distanceMeters?: number | null;
}

export const HouseModal: React.FC<HouseModalProps> = ({
  house,
  onClose,
  onSave,
  isCandyCollected = false,
  onToggleCollected,
  distanceMeters,
}) => {
  const [houseNumber, setHouseNumber] = useState(house.houseNumber || '');
  const [hasCandy, setHasCandy] = useState(house.hasCandy || false);
  const [candyNotes, setCandyNotes] = useState(house.candyNotes || '');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    setHouseNumber(house.houseNumber || '');
    setHasCandy(house.hasCandy || false);
    setCandyNotes(house.candyNotes || '');
    setIsSavedRecently(false);
  }, [house]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playCollectCandy();
    const updated: HouseData = {
      ...house,
      houseNumber: houseNumber.trim(),
      hasCandy,
      candyNotes: candyNotes.trim(),
    };
    onSave(updated);
    setIsSavedRecently(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl shadow-amber-950/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div
          className={`h-2 w-full transition-colors duration-300 ${
            hasCandy
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/50'
              : 'bg-slate-700'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playSelect();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          {/* Street & Location Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{house.streetName || 'Calle del Vecindario'}</span>
            {distanceMeters !== undefined && distanceMeters !== null && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] normal-case">
                A {Math.round(distanceMeters)}m
              </span>
            )}
          </div>

          {/* Title with House Number */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  hasCandy
                    ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40 shadow-inner'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {hasCandy ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Home className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Casa #{houseNumber || '?'}
                  {hasCandy && <span className="text-sm">🍬</span>}
                </h2>
                <p className="text-xs text-slate-400">Toca para editar el número y estado</p>
              </div>
            </div>
          </div>

          {/* Editable Field: House Number */}
          <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 focus-within:border-amber-500/60 transition">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                Número de Casa
              </span>
              <span className="text-[10px] text-slate-500">Visible en el mapa 3D</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-400">#</span>
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="Ej. 104, 18, 5A..."
                className="w-full bg-transparent text-lg font-bold text-white placeholder-slate-600 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Toggle: Candy Switch */}
          <div
            onClick={() => {
              sounds.playSelect();
              setHasCandy(!hasCandy);
            }}
            className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              hasCandy
                ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-950/40'
                : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  hasCandy ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Candy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">¿Repartiendo Dulces?</p>
                <p className="text-xs text-slate-400">
                  {hasCandy
                    ? '¡La casa brillará con luz mágica de Halloween!'
                    : 'Sin brillo en el mapa'}
                </p>
              </div>
            </div>

            {/* iOS style toggle pill */}
            <div
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                hasCandy ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  hasCandy ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Notes or Treats input if has candy */}
          {hasCandy && (
            <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-150">
              <label className="text-xs font-medium text-amber-300">
                Detalles / Golosinas que reparten
              </label>
              <textarea
                value={candyNotes}
                onChange={(e) => setCandyNotes(e.target.value)}
                placeholder="Ej. Chocolates Snickers, paletas Tutsi, caldero con humo..."
                rows={2}
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg shadow-orange-500/20 active:scale-98 transition cursor-pointer"
            >
              {isSavedRecently ? (
                <>
                  <Check className="w-5 h-5" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Guardar #{houseNumber || '?'}
                </>
              )}
            </button>

            {hasCandy && onToggleCollected && (
              <button
                type="button"
                onClick={() => {
                  sounds.playCollectCandy();
                  onToggleCollected(house.id);
                }}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  isCandyCollected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isCandyCollected ? '✓ Ya pedí dulces aquí' : 'Marcar como visitada'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
