
import React from 'react';
import { PlantType, PlantStats } from '../types';
import { PLANT_DATA } from '../constants';

interface GameUIProps {
  sun: number;
  score: number;
  wave: number;
  selectedPlant: PlantType | null;
  onSelectPlant: (type: PlantType | null) => void;
  onGetAdvice: () => void;
  advice: string;
}

export const GameUI: React.FC<GameUIProps> = ({ 
  sun, score, wave, selectedPlant, onSelectPlant, onGetAdvice, advice 
}) => {
  return (
    <div className="absolute top-0 left-0 w-full p-4 flex flex-col gap-4 pointer-events-none z-50">
      <div className="flex justify-between items-start w-full">
        {/* Left: Sun and Seed Bank */}
        <div className="flex gap-4 items-start pointer-events-auto">
          <div className="bg-amber-100 border-4 border-amber-900 rounded-xl p-2 shadow-lg flex flex-col items-center w-20 flex-shrink-0">
            <span className="text-2xl">☀️</span>
            <span className="font-game text-lg text-amber-900 leading-tight">{sun}</span>
          </div>

          <div className="flex gap-1 bg-stone-800/90 p-2 rounded-xl border-2 border-stone-600 overflow-x-auto max-w-[50vw] custom-scrollbar">
            {(Object.values(PLANT_DATA) as PlantStats[]).map((p) => (
              <button
                key={p.type}
                onClick={() => onSelectPlant(selectedPlant === p.type ? null : p.type)}
                disabled={sun < p.cost}
                title={`${p.type}: ${p.description}`}
                className={`
                  w-14 h-20 rounded-lg flex flex-col items-center justify-between p-1 transition-all flex-shrink-0
                  ${selectedPlant === p.type ? 'ring-4 ring-yellow-400 scale-110 z-10' : 'scale-100'}
                  ${sun < p.cost ? 'opacity-40 grayscale' : 'hover:bg-stone-700 bg-stone-200'}
                  border-2 border-stone-400
                `}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="font-bold text-[10px] text-stone-900 leading-none">{p.cost}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Stats and Advice */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/70 text-white px-4 py-2 rounded-full font-game flex gap-4 text-xs">
            <span>SCORE: {score}</span>
            <span className="text-red-400">WAVE: {wave}</span>
          </div>
          
          <div className="max-w-[200px] pointer-events-auto">
            <button 
              onClick={onGetAdvice}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg w-full mb-1 border-b-2 border-green-800 active:border-b-0 active:translate-y-0.5 transition-all"
            >
              🧔 TIPS
            </button>
            {advice && (
              <div className="bg-white/95 p-2 rounded-lg border border-green-800 text-[10px] leading-tight italic text-stone-800 shadow-xl">
                "{advice}"
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
