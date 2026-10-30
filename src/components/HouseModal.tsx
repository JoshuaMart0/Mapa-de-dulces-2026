import React, { useState, useEffect } from 'react';
import { HouseData } from '../types';
import { Home, Sparkles, Candy, MapPin, Check, X, Edit3, ShieldAlert } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface HouseModalProps {
  house: HouseData;
  onClose: () => void;
  onSave?: (updatedHouse: HouseData) => void;
  isCandyCollected?: boolean;
  onToggleCollected?: (houseId: string) => void;
  distanceMeters?: number | null;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
}

export const HouseModal: React.FC<HouseModalProps> = ({
  house,
  onClose,
  onSave,
  isCandyCollected = false,
  onToggleCollected,
  distanceMeters,
  isAdmin = false,
  onOpenAdminLogin,
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
    if (!isAdmin || !onSave) return;
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
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div
          className={`h-2.5 w-full transition-colors duration-300 ${
            (isAdmin ? hasCandy : house.hasCandy)
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-md shadow-orange-500/40'
              : 'bg-slate-700'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playSelect();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {isAdmin ? (
          /* ========================================================= */
          /* ADMIN EDIT MODE                                           */
          /* ========================================================= */
          <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
              <div className="flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{house.streetName || 'Calle del Vecindario'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                👑 MODO EDITOR
              </span>
            </div>

            {/* Editable Field: House Number */}
            <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 focus-within:border-amber-500/60 transition">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Número de Casa
                </span>
                <span className="text-[10px] text-amber-400">Aparece flotando en 3D sobre el techo</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-amber-400">#</span>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="Ej. 104, 25-B, 8..."
                  className="w-full bg-transparent text-xl font-bold text-white placeholder-slate-600 focus:outline-none"
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
                      ? 'La casa brillará y mostrará su etiqueta #'
                      : 'Sin dulces ni etiqueta en el mapa'}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
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

            {/* Notes if has candy */}
            {hasCandy && (
              <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-2xl border border-amber-500/20">
                <label className="text-xs font-medium text-amber-300">
                  Golosinas o mensaje de bienvenida
                </label>
                <textarea
                  value={candyNotes}
                  onChange={(e) => setCandyNotes(e.target.value)}
                  placeholder="Ej. Chocolates, paletas, mesa con decoración..."
                  rows={2}
                  className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2.5">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
              >
                <Check className="w-5 h-5" />
                {isSavedRecently ? '¡Cambios Guardados!' : `Guardar Casa #${houseNumber || '?'}`}
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================= */
          /* REGULAR ATTENDEE / PARTICIPANT CLEAN VIEW MODE             */
          /* ========================================================= */
          <div className="p-5 sm:p-6 space-y-4">
            {/* Street & Distance */}
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
              <div className="flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{house.streetName || 'Calle del Vecindario'}</span>
              </div>
              {distanceMeters !== undefined && distanceMeters !== null && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] normal-case font-medium">
                  A {Math.round(distanceMeters)}m
                </span>
              )}
            </div>

            {/* House Title */}
            <div className="flex items-center gap-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div
                className={`p-3.5 rounded-2xl ${
                  house.hasCandy
                    ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40 shadow-inner'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {house.hasCandy ? <Sparkles className="w-7 h-7" /> : <Home className="w-7 h-7" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  Casa #{house.houseNumber || '?'}
                  {house.hasCandy && <span className="text-base">🍬</span>}
                </h2>
                <p className="text-xs font-medium text-slate-300 mt-0.5">
                  {house.hasCandy ? (
                    <span className="text-amber-400 font-semibold">¡Esta casa tiene dulces de Halloween!</span>
                  ) : (
                    <span className="text-slate-400">Sin dulces reportados</span>
                  )}
                </p>
              </div>
            </div>

            {/* Candy details if available */}
            {house.hasCandy && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Candy className="w-3.5 h-3.5" />
                  <span>Reparto de dulces</span>
                </div>
                <p className="text-slate-200 text-xs">
                  {house.candyNotes || 'Acércate a pedir dulce o truco.'}
                </p>
              </div>
            )}

            {/* Attendee Action: Collect candy into personal bag */}
            {house.hasCandy && onToggleCollected && (
              <button
                type="button"
                onClick={() => {
                  sounds.playCollectCandy();
                  onToggleCollected(house.id);
                }}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isCandyCollected
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-500/20'
                }`}
              >
                {isCandyCollected ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>✓ Dulce recolectado en tu bolsa</span>
                  </>
                ) : (
                  <>
                    <Candy className="w-4 h-4" />
                    <span>Pedir Dulce Aquí (Añadir a mi Bolsa)</span>
                  </>
                )}
              </button>
            )}

            {/* Subtle admin shortcut for the organizer */}
            {onOpenAdminLogin && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminLogin();
                  }}
                  className="text-[11px] text-slate-500 hover:text-amber-400/80 transition flex items-center justify-center gap-1 mx-auto"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>¿Eres el administrador? Iniciar sesión para editar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
