import React from 'react';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface CameraControlsDockProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetAngle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  rotationDegrees?: number;
}

export const CameraControlsDock: React.FC<CameraControlsDockProps> = ({
  onRotateLeft,
  onRotateRight,
  onResetAngle,
  onZoomIn,
  onZoomOut,
  rotationDegrees = 43,
}) => {
  return (
    <aside
      aria-label="Controles de cámara y rotación"
      className="fixed right-3.5 top-36 z-30 flex flex-col items-center gap-2 pointer-events-auto select-none"
    >
      {/* 360° Rotation Controller Cluster */}
      <div
        className="flex flex-col items-center p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/40 shadow-2xl shadow-black/60"
        title="Rotación 360° de la cámara"
      >
        <span className="text-[9px] font-bold tracking-wider text-amber-400/90 uppercase px-1 pb-1">
          Rotar 360°
        </span>

        {/* Rotate Left 45° */}
        <button
          onClick={() => {
            sounds.playSelect();
            onRotateLeft();
          }}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-amber-400 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
          title="Rotar vista 45° a la izquierda (Antihorario)"
          aria-label="Rotar vista 45° a la izquierda"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-[8px] font-bold leading-none mt-0.5">-45°</span>
        </button>

        {/* Compass Dial / Reset to Default Angle */}
        <button
          onClick={() => {
            sounds.playSelect();
            onResetAngle();
          }}
          className="my-1 w-10 h-10 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-amber-400 text-amber-400 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-inner"
          title="Toca para restablecer ángulo inicial"
          aria-label="Restablecer ángulo inicial"
        >
          <Compass
            className="w-4 h-4 transition-transform duration-300"
            style={{ transform: `rotate(${-rotationDegrees}deg)` }}
          />
          <span className="text-[8px] font-black text-amber-300 leading-none mt-0.5">
            {Math.round(rotationDegrees)}°
          </span>
        </button>

        {/* Rotate Right 45° */}
        <button
          onClick={() => {
            sounds.playSelect();
            onRotateRight();
          }}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-amber-400 flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
          title="Rotar vista 45° a la derecha (Horario)"
          aria-label="Rotar vista 45° a la derecha"
        >
          <RotateCw className="w-4 h-4" />
          <span className="text-[8px] font-bold leading-none mt-0.5">+45°</span>
        </button>
      </div>

      {/* Zoom In & Zoom Out Cluster */}
      <div className="flex flex-col items-center p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl">
        <button
          onClick={() => {
            sounds.playSelect();
            onZoomIn();
          }}
          className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
          title="Acercar mapa (Zoom In)"
          aria-label="Acercar mapa"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-5 h-[1px] bg-slate-750 my-1" />
        <button
          onClick={() => {
            sounds.playSelect();
            onZoomOut();
          }}
          className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
          title="Alejar mapa (Zoom Out)"
          aria-label="Alejar mapa"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
