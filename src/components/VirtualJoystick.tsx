import React, { useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

interface VirtualJoystickProps {
  onWalk: (dx: number, dy: number) => void;
  isOpen: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onWalk, isOpen }) => {
  const activeDirectionRef = useRef<{ dx: number; dy: number } | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startMoving = (dx: number, dy: number) => {
    activeDirectionRef.current = { dx, dy };
    sounds.playStep();
    onWalk(dx, dy);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (activeDirectionRef.current) {
        onWalk(activeDirectionRef.current.dx, activeDirectionRef.current.dy);
      }
    }, 120);
  };

  const stopMoving = () => {
    activeDirectionRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Keyboard navigation support (Arrow keys and WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 0.012;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        onWalk(0, -step);
        sounds.playStep();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        onWalk(0, step);
        sounds.playStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        onWalk(-step, 0);
        sounds.playStep();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        onWalk(step, 0);
        sounds.playStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onWalk]);

  if (!isOpen) return null;

  const step = 0.014;

  return (
    <div
      className="fixed bottom-36 left-4 z-40 p-2.5 rounded-2xl border border-amber-500/40 shadow-2xl pointer-events-auto select-none"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.94)' }}
    >
      <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider text-center mb-1">
        Caminar
      </div>
      <div className="grid grid-cols-3 gap-1.5 w-32 h-32">
        <div />
        <button
          onPointerDown={() => startMoving(0, -step)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="rounded-xl bg-slate-800 hover:bg-amber-600 active:bg-amber-500 text-white flex items-center justify-center border border-slate-700 active:scale-95 transition-all shadow-md"
          aria-label="Caminar hacia arriba"
        >
          <ArrowUp className="w-5 h-5 text-amber-300" />
        </button>
        <div />

        <button
          onPointerDown={() => startMoving(-step, 0)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="rounded-xl bg-slate-800 hover:bg-amber-600 active:bg-amber-500 text-white flex items-center justify-center border border-slate-700 active:scale-95 transition-all shadow-md"
          aria-label="Caminar a la izquierda"
        >
          <ArrowLeft className="w-5 h-5 text-amber-300" />
        </button>

        <div className="rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">
          WASD
        </div>

        <button
          onPointerDown={() => startMoving(step, 0)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="rounded-xl bg-slate-800 hover:bg-amber-600 active:bg-amber-500 text-white flex items-center justify-center border border-slate-700 active:scale-95 transition-all shadow-md"
          aria-label="Caminar a la derecha"
        >
          <ArrowRight className="w-5 h-5 text-amber-300" />
        </button>

        <div />
        <button
          onPointerDown={() => startMoving(0, step)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="rounded-xl bg-slate-800 hover:bg-amber-600 active:bg-amber-500 text-white flex items-center justify-center border border-slate-700 active:scale-95 transition-all shadow-md"
          aria-label="Caminar hacia abajo"
        >
          <ArrowDown className="w-5 h-5 text-amber-300" />
        </button>
        <div />
      </div>
    </div>
  );
};
