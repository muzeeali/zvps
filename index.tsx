
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
export enum PlantType {
  SUNFLOWER = 'SUNFLOWER',
  PEASHOOTER = 'PEASHOOTER',
  WALLNUT = 'WALLNUT',
  CHERRY_BOMB = 'CHERRY_BOMB',
  SNOW_PEA = 'SNOW_PEA',
  POTATO_MINE = 'POTATO_MINE',
  REPEATER = 'REPEATER',
  PUFF_SHROOM = 'PUFF_SHROOM',
  FUME_SHROOM = 'FUME_SHROOM',
  SUN_SHROOM = 'SUN_SHROOM',
  CHOMPER = 'CHOMPER',
  SCAREDY_SHROOM = 'SCAREDY_SHROOM',
  ICE_SHROOM = 'ICE_SHROOM',
  DOOM_SHROOM = 'DOOM_SHROOM',
  SQUASH = 'SQUASH',
  THREEPEATER = 'THREEPEATER',
  JALAPENO = 'JALAPENO',
  SPIKEWEED = 'SPIKEWEED',
  TORCHWOOD = 'TORCHWOOD'
}

export enum ZombieType {
  NORMAL = 'NORMAL',
  CONEHEAD = 'CONEHEAD',
  BUCKETHEAD = 'BUCKETHEAD',
  POLE_VAULTER = 'POLE_VAULTER',
  WIZARD = 'WIZARD',
  GARGANTUAR = 'GARGANTUAR'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface PlantStats {
  type: PlantType;
  cost: number;
  hp: number;
  cooldown: number;
  icon: string;
  description: string;
}

export interface PlantEntity {
  id: string; x: number; y: number; row: number; hp: number;
  type: PlantType;
  lastAction: number;
  isArmed?: boolean;
  state?: 'idle' | 'attacking' | 'digesting' | 'hidden' | 'disabled';
  disabledUntil?: number;
}

export interface ZombieEntity {
  id: string; x: number; y: number; row: number; hp: number;
  maxHp: number;
  type: ZombieType;
  speed: number;
  isFrozen?: boolean;
  frozenUntil?: number;
  hasJumped?: boolean;
  lastAbilityUse?: number;
}

export interface Projectile {
  id: string; x: number; y: number; row: number; damage: number;
  type: 'pea' | 'snow_pea' | 'fire_pea' | 'fume';
  isPiercing?: boolean;
  hitIds?: string[];
}

export interface GameState {
  sun: number;
  plants: PlantEntity[];
  zombies: ZombieEntity[];
  projectiles: Projectile[];
  fallingSun: { id: string; x: number; y: number; createdAt: number }[];
  score: number;
  wave: number;
  isGameOver: boolean;
  isPaused: boolean;
  selectedPlant: PlantType | null;
  mowers: { row: number; x: number; isActive: boolean; isSpent: boolean }[];
  difficulty: Difficulty | null;
}

// --- CONSTANTS ---
const GRID_ROWS = 5;
const GRID_COLS = 9;
const CELL_WIDTH = 100;
const CELL_HEIGHT = 100;
const LAWN_WIDTH = GRID_COLS * CELL_WIDTH;
const INITIAL_SUN = 50;

const PLANT_DATA: Record<PlantType, PlantStats> = {
  [PlantType.SUNFLOWER]: { type: PlantType.SUNFLOWER, cost: 50, hp: 300, cooldown: 5000, icon: '🌻', description: 'Sun.' },
  [PlantType.PEASHOOTER]: { type: PlantType.PEASHOOTER, cost: 100, hp: 300, cooldown: 1400, icon: '🌱', description: 'Attack.' },
  [PlantType.WALLNUT]: { type: PlantType.WALLNUT, cost: 50, hp: 4000, cooldown: 20000, icon: '🌰', description: 'Defense.' },
  [PlantType.CHERRY_BOMB]: { type: PlantType.CHERRY_BOMB, cost: 150, hp: 10, cooldown: 25000, icon: '🍒', description: 'Boom!' },
  [PlantType.SNOW_PEA]: { type: PlantType.SNOW_PEA, cost: 175, hp: 300, cooldown: 1400, icon: '❄️', description: 'Slow.' },
  [PlantType.POTATO_MINE]: { type: PlantType.POTATO_MINE, cost: 25, hp: 10, cooldown: 15000, icon: '🥔', description: 'Mine.' },
  [PlantType.REPEATER]: { type: PlantType.REPEATER, cost: 200, hp: 300, cooldown: 1400, icon: '🎋', description: 'Double.' },
  [PlantType.PUFF_SHROOM]: { type: PlantType.PUFF_SHROOM, cost: 0, hp: 150, cooldown: 7500, icon: '🍄', description: 'Free.' },
  [PlantType.FUME_SHROOM]: { type: PlantType.FUME_SHROOM, cost: 75, hp: 300, cooldown: 1800, icon: '💨', description: 'Pierce.' },
  [PlantType.SUN_SHROOM]: { type: PlantType.SUN_SHROOM, cost: 25, hp: 300, cooldown: 7500, icon: '🔅', description: 'Cheap.' },
  [PlantType.CHOMPER]: { type: PlantType.CHOMPER, cost: 150, hp: 300, cooldown: 15000, icon: '🫦', description: 'Eat.' },
  [PlantType.SCAREDY_SHROOM]: { type: PlantType.SCAREDY_SHROOM, cost: 25, hp: 300, cooldown: 1400, icon: '🫣', description: 'Long.' },
  [PlantType.ICE_SHROOM]: { type: PlantType.ICE_SHROOM, cost: 75, hp: 10, cooldown: 35000, icon: '🥶', description: 'Freeze.' },
  [PlantType.DOOM_SHROOM]: { type: PlantType.DOOM_SHROOM, cost: 125, hp: 10, cooldown: 45000, icon: '🧨', description: 'Huge!' },
  [PlantType.SQUASH]: { type: PlantType.SQUASH, cost: 50, hp: 300, cooldown: 15000, icon: '🎃', description: 'Crush.' },
  [PlantType.THREEPEATER]: { type: PlantType.THREEPEATER, cost: 325, hp: 300, cooldown: 1400, icon: '🔱', description: '3 Rows.' },
  [PlantType.JALAPENO]: { type: PlantType.JALAPENO, cost: 125, hp: 10, cooldown: 25000, icon: '🌶️', description: 'Row.' },
  [PlantType.SPIKEWEED]: { type: PlantType.SPIKEWEED, cost: 100, hp: 1000, cooldown: 10000, icon: '🌵', description: 'Spike.' },
  [PlantType.TORCHWOOD]: { type: PlantType.TORCHWOOD, cost: 175, hp: 500, cooldown: 10000, icon: '🔥', description: 'Fire.' }
};

const GET_BASE_ZOMBIE_SPEED = (diff: Difficulty) => {
  const times = { [Difficulty.EASY]: 60, [Difficulty.MEDIUM]: 45, [Difficulty.HARD]: 30 };
  return LAWN_WIDTH / times[diff];
};

// --- GEMINI SERVICE ---
async function getTacticalAdvice(state: GameState): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  try {
    const prompt = `Crazy Dave strategist advice. Sun: ${state.sun}, Wave: ${state.wave}, Zombies: ${state.zombies.length}. 2 short funny sentences max. Wabby Wabbo style.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.9, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "Keep planting!";
  } catch { return "Wabby Wabbo! Brains are hungry!"; }
}

// --- COMPONENTS ---
const GameUI: React.FC<{ 
  sun: number, score: number, wave: number, selectedPlant: PlantType | null, 
  onSelect: (t: PlantType | null) => void, onAdvice: () => void, advice: string 
}> = ({ sun, score, wave, selectedPlant, onSelect, onAdvice, advice }) => (
  <div className="absolute top-0 left-0 w-full p-4 flex flex-col gap-4 pointer-events-none z-50">
    <div className="flex justify-between items-start w-full">
      <div className="flex gap-4 items-start pointer-events-auto">
        <div className="bg-amber-100 border-4 border-amber-900 rounded-xl p-2 shadow-lg flex flex-col items-center w-20">
          <span className="text-2xl">☀️</span>
          <span className="font-game text-lg text-amber-900">{sun}</span>
        </div>
        <div className="flex gap-1 bg-stone-800/90 p-2 rounded-xl border-2 border-stone-600 overflow-x-auto max-w-[55vw]">
          {Object.values(PLANT_DATA).map(p => (
            <button key={p.type} onClick={() => onSelect(selectedPlant === p.type ? null : p.type)}
              disabled={sun < p.cost} className={`w-14 h-20 rounded-lg flex flex-col items-center justify-between p-1 transition-all flex-shrink-0 ${selectedPlant === p.type ? 'ring-4 ring-yellow-400 scale-110' : ''} ${sun < p.cost ? 'opacity-40 grayscale bg-stone-500' : 'bg-stone-200'}`}>
              <span className="text-xl">{p.icon}</span>
              <span className="font-bold text-[10px] text-stone-900">{p.cost}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="bg-black/70 text-white px-4 py-2 rounded-full font-game text-[10px] sm:text-xs">
          SCORE: {score} <span className="text-red-400 ml-4">WAVE: {wave}</span>
        </div>
        <div className="max-w-[180px] pointer-events-auto">
          <button onClick={onAdvice} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold w-full border-b-2 border-green-800">🧔 TIPS</button>
          {advice && <div className="bg-white/95 p-2 rounded-lg border border-green-800 text-[9px] italic text-stone-800 shadow-xl mt-1">"{advice}"</div>}
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    sun: INITIAL_SUN, plants: [], zombies: [], projectiles: [], fallingSun: [],
    score: 0, wave: 1, isGameOver: false, isPaused: false, selectedPlant: null,
    mowers: Array.from({ length: GRID_ROWS }, (_, i) => ({ row: i, x: -40, isActive: false, isSpent: false })),
    difficulty: null,
  });
  const [advice, setAdvice] = useState("Wabby Wabbo! Pick a level!");
  const [scale, setScale] = useState(1);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimer = useRef({ zombie: 0, sun: 0 });
  const refs = useRef({ isGameOver: false, isPaused: false, difficulty: null as Difficulty | null, wave: 1 });

  useEffect(() => {
    refs.current = { isGameOver: gameState.isGameOver, isPaused: gameState.isPaused, difficulty: gameState.difficulty, wave: gameState.wave };
  }, [gameState.isGameOver, gameState.isPaused, gameState.difficulty, gameState.wave]);

  useEffect(() => {
    const resize = () => {
      const s = Math.min(1, (window.innerWidth - 40) / LAWN_WIDTH, (window.innerHeight - 180) / (GRID_ROWS * CELL_HEIGHT));
      setScale(s);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const spawnZombie = useCallback(() => {
    if (!refs.current.difficulty) return;
    const row = Math.floor(Math.random() * GRID_ROWS);
    const id = Math.random().toString(36).substr(2, 9);
    const mult = Math.pow(1.10, refs.current.wave - 1);
    const base = GET_BASE_ZOMBIE_SPEED(refs.current.difficulty);
    const speed = base * mult * (0.95 + Math.random() * 0.1);
    let hp = 100 + (refs.current.wave * 30), type = ZombieType.NORMAL;
    const r = Math.random();
    if (refs.current.wave >= 12 && r > 0.9) { type = ZombieType.GARGANTUAR; hp *= 10; }
    else if (refs.current.wave >= 8 && r > 0.7) { type = ZombieType.BUCKETHEAD; hp *= 3; }
    else if (refs.current.wave >= 4 && r > 0.5) { type = ZombieType.CONEHEAD; hp *= 2; }
    const z = { id, x: LAWN_WIDTH, y: row * CELL_HEIGHT, row, hp, maxHp: hp, type, speed };
    setGameState(p => ({ ...p, zombies: [...p.zombies, z] }));
  }, []);

  const update = useCallback((time: number) => {
    if (refs.current.isGameOver || refs.current.isPaused || !refs.current.difficulty) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    const dt = Math.min((time - (lastTimeRef.current || time)) / 1000, 0.1);
    lastTimeRef.current = time;

    setGameState(prev => {
      const now = Date.now();
      const nextMowers = prev.mowers.map(m => {
        let { x, isActive, isSpent } = m;
        if (!isActive && !isSpent && prev.zombies.some(z => z.row === m.row && z.x < 10)) isActive = true;
        if (isActive) { x += 1000 * dt; if (x > LAWN_WIDTH + 100) { isActive = false; isSpent = true; } }
        return { ...m, x, isActive, isSpent };
      });
      const nextZombies = prev.zombies.map(z => {
        const mower = nextMowers.find(m => m.row === z.row && m.isActive);
        const colliding = prev.plants.find(p => p.row === z.row && z.x < p.x + 60 && z.x > p.x + 10 && p.type !== PlantType.SPIKEWEED);
        if (mower && z.x < mower.x + 60) return { ...z, hp: 0 };
        if (colliding) return z;
        return { ...z, x: z.x - z.speed * dt };
      }).filter(z => z.hp > 0);
      const nextPlants = prev.plants.map(p => {
        const eating = prev.zombies.find(z => z.row === p.row && z.x < p.x + 60 && z.x > p.x + 10);
        return eating ? { ...p, hp: p.hp - 100 * dt } : p;
      }).filter(p => p.hp > 0);
      // Projectile logic, wave logic... (simplified for stability)
      spawnTimer.current.zombie += dt * 1000;
      if (spawnTimer.current.zombie > 5000 / (1 + prev.wave * 0.2)) { spawnZombie(); spawnTimer.current.zombie = 0; }
      spawnTimer.current.sun += dt * 1000;
      if (spawnTimer.current.sun > 5000) { 
        const s = { id: Math.random().toString(), x: Math.random() * 800, y: -50, createdAt: Date.now() };
        prev.fallingSun.push(s); spawnTimer.current.sun = 0; 
      }
      return { ...prev, zombies: nextZombies, plants: nextPlants, mowers: nextMowers, isGameOver: nextZombies.some(z => z.x < -80), wave: prev.wave + (Math.random() < 0.001 ? 1 : 0) };
    });
    requestRef.current = requestAnimationFrame(update);
  }, [spawnZombie]);

  useEffect(() => { requestRef.current = requestAnimationFrame(update); return () => cancelAnimationFrame(requestRef.current); }, [update]);

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-stone-900 overflow-hidden select-none">
      <div className="relative bg-green-800 border-8 border-amber-900 shadow-2xl overflow-hidden" style={{ width: LAWN_WIDTH, height: GRID_ROWS * CELL_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div className="absolute inset-0 grid grid-cols-9 grid-rows-5 pointer-events-none opacity-20">
          {Array.from({ length: 45 }).map((_, i) => <div key={i} className="border border-white/10" />)}
        </div>
        <div className="absolute inset-0 grid grid-cols-9 grid-rows-5 z-10">
          {Array.from({ length: 45 }).map((_, i) => (
            <div key={i} onClick={() => {
              const r = Math.floor(i / 9), c = i % 9;
              if (!gameState.selectedPlant) return;
              const stats = PLANT_DATA[gameState.selectedPlant];
              if (gameState.sun < stats.cost) return;
              setGameState(p => ({ ...p, sun: p.sun - stats.cost, selectedPlant: null, plants: [...p.plants, { id: Math.random().toString(), x: c * 100, y: r * 100, row: r, hp: stats.hp, type: gameState.selectedPlant, lastAction: Date.now() }] }));
            }} className="hover:bg-white/10 cursor-pointer" />
          ))}
        </div>
        <div className="absolute inset-0 pointer-events-none z-20">
          {gameState.mowers.map(m => !m.isSpent && <div key={m.row} className="absolute text-5xl" style={{ left: m.x, top: m.row * 100 + 20 }}>🚜</div>)}
          {gameState.plants.map(p => <div key={p.id} className="absolute text-6xl flex flex-col items-center" style={{ left: p.x + 20, top: p.y + 10 }}>{PLANT_DATA[p.type].icon}</div>)}
          {gameState.zombies.map(z => <div key={z.id} className="absolute text-6xl transform scale-x-[-1]" style={{ left: z.x, top: z.y + 10 }}>🧟</div>)}
          {gameState.fallingSun.map(s => <div key={s.id} onClick={(e) => { e.stopPropagation(); setGameState(p => ({ ...p, sun: p.sun + 25, fallingSun: p.fallingSun.filter(x => x.id !== s.id) })); }} className="absolute text-5xl cursor-pointer pointer-events-auto" style={{ left: s.x, top: s.y }}>☀️</div>)}
        </div>
      </div>
      <GameUI sun={gameState.sun} score={gameState.score} wave={gameState.wave} selectedPlant={gameState.selectedPlant} onSelect={t => setGameState(p => ({ ...p, selectedPlant: t }))} onAdvice={async () => setAdvice(await getTacticalAdvice(gameState))} advice={advice} />
      {!gameState.difficulty && (
        <div className="absolute inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl sm:text-6xl font-game text-white mb-12 drop-shadow-xl text-yellow-500">FLORA vs PHANTOMS</h1>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {Object.values(Difficulty).map(d => <button key={d} onClick={() => setGameState(p => ({ ...p, difficulty: d }))} className="bg-amber-800 hover:bg-amber-700 text-white font-game p-6 rounded-2xl border-b-8 border-amber-950 transition-all active:translate-y-2 active:border-b-0">{d}</button>)}
          </div>
        </div>
      )}
      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-5xl font-game text-red-600 mb-8 animate-pulse">THE ZOMBIES ATE YOUR BRAINS!</h1>
          <button onClick={() => window.location.reload()} className="bg-green-700 text-white font-game px-12 py-6 rounded-xl border-b-8 border-green-900">RETRY</button>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
