import React, { useState, useMemo } from 'react';
import { HouseData } from '../types';
import { Candy, Search, MapPin, Eye, CheckCircle2, Circle, X, Sparkles } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface CandyHousesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  housesData: Record<string, HouseData>;
  collectedIds: Set<string>;
  onToggleCollected: (houseId: string) => void;
  onFocusHouse: (house: HouseData) => void;
  getDistanceMeters: (mapX: number, mapY: number) => number;
}

export const CandyHousesListModal: React.FC<CandyHousesListModalProps> = ({
  isOpen,
  onClose,
  housesData,
  collectedIds,
  onToggleCollected,
  onFocusHouse,
  getDistanceMeters,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'collected'>('all');

  // Filter only houses registered to give candy
  const candyHouses = useMemo(() => {
    return Object.values(housesData)
      .filter((h) => h.hasCandy)
      .map((h) => ({
        ...h,
        dist: getDistanceMeters(h.mapX, h.mapY),
        isCollected: collectedIds.has(h.id),
      }))
      .sort((a, b) => a.dist - b.dist);
  }, [housesData, getDistanceMeters, collectedIds]);

  const filteredHouses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return candyHouses.filter((h) => {
      // Filter by collection status
      if (filterMode === 'pending' && h.isCollected) return false;
      if (filterMode === 'collected' && !h.isCollected) return false;

      // Filter by search query
      if (!q) return true;
      const numMatch = (h.houseNumber || '').toLowerCase().includes(q);
      const streetMatch = (h.streetName || '').toLowerCase().includes(q);
      const notesMatch = (h.candyNotes || '').toLowerCase().includes(q);
      return numMatch || streetMatch || notesMatch;
    });
  }, [candyHouses, searchTerm, filterMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm pointer-events-auto select-none">
      <div className="w-full max-w-lg max-h-[88vh] bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 text-slate-950 font-black">
              <Candy className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Casas con Dulces
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {candyHouses.length} Registradas
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Puntos confirmados para pedir dulce en el vecindario
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Quick Filters Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número (#14) o calle..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => {
                sounds.playSelect();
                setFilterMode('all');
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todas ({candyHouses.length})
            </button>
            <button
              onClick={() => {
                sounds.playSelect();
                setFilterMode('pending');
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Pendientes ({candyHouses.filter((h) => !h.isCollected).length})
            </button>
            <button
              onClick={() => {
                sounds.playSelect();
                setFilterMode('collected');
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'collected'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Visitadas ({candyHouses.filter((h) => h.isCollected).length})
            </button>
          </div>
        </div>

        {/* Houses List Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredHouses.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2 text-slate-400">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto opacity-60" />
              <p className="text-sm font-semibold text-slate-300">
                {candyHouses.length === 0
                  ? 'Aún no hay casas con dulces registradas.'
                  : 'No se encontraron casas con ese criterio de búsqueda.'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {candyHouses.length === 0
                  ? 'El administrador puede activar los dulces tocando cualquier casa en el mapa.'
                  : 'Prueba buscando con otro número o nombre de calle.'}
              </p>
            </div>
          ) : (
            filteredHouses.map((house) => {
              const isCollected = house.isCollected;
              const distRounded = Math.round(house.dist);

              return (
                <div
                  key={house.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCollected
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-amber-500/20 hover:border-amber-500/50'
                  }`}
                >
                  {/* Left: House Number Badge & Street Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Big House Number Pill */}
                    <div
                      className={`px-3 py-2 rounded-xl flex items-center justify-center font-black text-sm tracking-wide shrink-0 shadow-md ${
                        isCollected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950'
                      }`}
                    >
                      <span>#{house.houseNumber || '?'}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {house.streetName || 'Calle del Vecindario'}
                        </span>
                        {isCollected && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Visitada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{distRounded} m de distancia</span>
                        </span>
                        {house.candyNotes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px] sm:max-w-[180px] text-slate-300">
                              {house.candyNotes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Mark Visited & View on Map */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Collected Button */}
                    <button
                      onClick={() => {
                        sounds.playCollectCandy();
                        onToggleCollected(house.id);
                      }}
                      className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                        isCollected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-slate-750 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                      title={isCollected ? 'Marcar como pendiente' : 'Marcar como visitada'}
                    >
                      {isCollected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    {/* View on Map Button */}
                    <button
                      onClick={() => {
                        sounds.playSelect();
                        onClose();
                        onFocusHouse(house);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer"
                      title="Ver esta casa en el mapa 3D"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver en Mapa</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {collectedIds.size} de {candyHouses.length} casas visitadas
          </span>
          <button
            onClick={() => {
              sounds.playSelect();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
