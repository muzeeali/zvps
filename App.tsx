
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlantType, ZombieType, GameState, PlantEntity, ZombieEntity, 
  Projectile, PlantStats, MowerState, Difficulty 
} from './types';
import { 
  GRID_ROWS, GRID_COLS, CELL_WIDTH, CELL_HEIGHT, 
  PLANT_DATA, PEA_SPEED_PX_PER_SEC, INITIAL_SUN, GET_BASE_ZOMBIE_SPEED, LAWN_WIDTH
} from './constants';
import { GameUI } from './components/GameUI';
import { getTacticalAdvice } from './geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    sun: INITIAL_SUN,
    plants: [],
    zombies: [],
    projectiles: [],
    fallingSun: [],
    score: 0,
    wave: 1,
    isGameOver: false,
    isPaused: false,
    selectedPlant: null,
    mowers: Array.from({ length: GRID_ROWS }, (_, i) => ({
      row: i,
      x: -40,
      isActive: false,
      isSpent: false,
    })),
    difficulty: null,
  });

  const [advice, setAdvice] = useState<string>("Wabby Wabbo! Pick a difficulty!");
  const [scale, setScale] = useState(1);
  
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const zombieSpawnTimer = useRef<number>(0);
  const sunSpawnTimer = useRef<number>(0);

  // Synchronization refs for the high-performance game loop
  const isGameOverRef = useRef(false);
  const isPausedRef = useRef(false);
  const difficultyRef = useRef<Difficulty | null>(null);
  const waveRef = useRef(1);

  useEffect(() => {
    isGameOverRef.current = gameState.isGameOver;
    isPausedRef.current = gameState.isPaused;
    difficultyRef.current = gameState.difficulty;
    waveRef.current = gameState.wave;
  }, [gameState.isGameOver, gameState.isPaused, gameState.difficulty, gameState.wave]);

  // Responsive Board Scaling Logic
  useEffect(() => {
    const handleResize = () => {
      const horizontalPadding = 40;
      const verticalPadding = 160;
      const availableWidth = window.innerWidth - horizontalPadding;
      const availableHeight = window.innerHeight - verticalPadding;
      const boardWidth = LAWN_WIDTH;
      const boardHeight = GRID_ROWS * CELL_HEIGHT;
      
      const widthScale = availableWidth / boardWidth;
      const heightScale = availableHeight / boardHeight;
      const newScale = Math.min(1, widthScale, heightScale);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAdvice = async () => {
    const tip = await getTacticalAdvice(gameState);
    setAdvice(tip);
  };

  const spawnZombie = useCallback(() => {
    if (!difficultyRef.current) return;
    
    const row = Math.floor(Math.random() * GRID_ROWS);
    const id = Math.random().toString(36).substr(2, 9);
    
    const waveSpeedMultiplier = Math.pow(1.10, waveRef.current - 1);
    const baseSpeed = GET_BASE_ZOMBIE_SPEED(difficultyRef.current);
    let speed = baseSpeed * waveSpeedMultiplier * (0.95 + Math.random() * 0.1);

    let hp = 100 + (waveRef.current * 25);
    let type = ZombieType.NORMAL;

    const roll = Math.random();
    if (waveRef.current >= 15 && roll > 0.9) {
      type = ZombieType.GARGANTUAR;
      hp *= 15;
      speed *= 0.6;
    } else if (waveRef.current >= 10 && roll > 0.8) {
      type = ZombieType.WIZARD;
      hp *= 1.5;
    } else if (waveRef.current >= 5 && roll > 0.65) {
      type = ZombieType.POLE_VAULTER;
      speed *= 2.0; 
    } else if (waveRef.current > 6 && roll > 0.5) {
      type = ZombieType.BUCKETHEAD;
      hp *= 4;
    } else if (waveRef.current > 3 && roll > 0.3) {
      type = ZombieType.CONEHEAD;
      hp *= 2.5;
    }

    const newZombie: ZombieEntity = {
      id,
      x: GRID_COLS * CELL_WIDTH,
      y: row * CELL_HEIGHT,
      row,
      hp,
      maxHp: hp,
      type,
      speed,
      hasJumped: false,
      lastAbilityUse: Date.now()
    };
    setGameState(prev => ({ ...prev, zombies: [...prev.zombies, newZombie] }));
  }, []);

  const spawnSun = useCallback(() => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = Math.random() * (LAWN_WIDTH - 50);
    const newSun = { id, x, y: -50, createdAt: Date.now() };
    setGameState(prev => ({ ...prev, fallingSun: [...prev.fallingSun, newSun] }));
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (!gameState.selectedPlant) return;
    
    const plantStats = PLANT_DATA[gameState.selectedPlant];
    if (gameState.sun < plantStats.cost) return;

    const isOccupied = gameState.plants.some(p => p.row === row && Math.floor(p.x / CELL_WIDTH) === col);
    if (isOccupied && gameState.selectedPlant !== PlantType.JALAPENO && gameState.selectedPlant !== PlantType.CHERRY_BOMB) return;

    const newPlant: PlantEntity = {
      id: Math.random().toString(36).substr(2, 9),
      type: gameState.selectedPlant,
      x: col * CELL_WIDTH,
      y: row * CELL_HEIGHT,
      row,
      hp: plantStats.hp,
      lastAction: Date.now(),
      state: 'idle'
    };

    if (gameState.selectedPlant === PlantType.JALAPENO) {
        setGameState(prev => ({
            ...prev,
            sun: prev.sun - plantStats.cost,
            zombies: prev.zombies.filter(z => z.row !== row),
            selectedPlant: null
        }));
        return;
    }

    if (gameState.selectedPlant === PlantType.ICE_SHROOM) {
        setGameState(prev => ({
            ...prev,
            sun: prev.sun - plantStats.cost,
            zombies: prev.zombies.map(z => ({ ...z, isFrozen: true, frozenUntil: Date.now() + 5000 })),
            selectedPlant: null
        }));
        return;
    }

    setGameState(prev => ({
      ...prev,
      sun: prev.sun - plantStats.cost,
      plants: [...prev.plants, newPlant],
      selectedPlant: null,
    }));
  };

  const handleSunClick = (id: string) => {
    setGameState(prev => ({
      ...prev,
      sun: prev.sun + 25,
      fallingSun: prev.fallingSun.filter(s => s.id !== id),
    }));
  };

  const update = useCallback((time: number) => {
    if (isGameOverRef.current || isPausedRef.current || !difficultyRef.current) {
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    const deltaTime = time - (lastTimeRef.current || time);
    lastTimeRef.current = time;
    const dtSeconds = Math.min(deltaTime / 1000, 0.1);

    setGameState(prev => {
      const now = Date.now();
      const newProjectiles: Projectile[] = [...prev.projectiles];
      let sunGain = 0;

      const nextMowers: MowerState[] = prev.mowers.map(m => {
        let { x, isActive, isSpent } = m;
        if (!isActive && !isSpent) {
          const triggers = prev.zombies.some(z => z.row === m.row && z.x < 10);
          if (triggers) isActive = true;
        }
        if (isActive) {
          x += (1500 * dtSeconds); 
          if (x > LAWN_WIDTH + 100) {
            isActive = false;
            isSpent = true;
          }
        }
        return { ...m, x, isActive, isSpent };
      });

      const nextZombies: ZombieEntity[] = prev.zombies.map((z): ZombieEntity => {
        const spikes = prev.plants.filter(p => p.type === PlantType.SPIKEWEED && p.row === z.row && Math.abs(p.x - z.x) < 40);
        let hp = z.hp;
        if (spikes.length > 0) hp -= (50 * dtSeconds); 
        
        const rowMower = nextMowers.find(m => m.row === z.row && m.isActive);
        if (rowMower && z.x < rowMower.x + 80) hp = 0;

        let currentSpeed = z.speed;
        if (z.isFrozen && z.frozenUntil && z.frozenUntil > now) {
            currentSpeed = 0;
        } else if (z.isFrozen) {
            z.isFrozen = false;
        }

        const collidingPlant = prev.plants.find(p => 
          p.row === z.row && 
          z.x < p.x + 60 && 
          z.x > p.x + 10 &&
          p.type !== PlantType.SPIKEWEED
        );

        if (z.type === ZombieType.POLE_VAULTER && collidingPlant && !z.hasJumped) {
          return { ...z, x: z.x - 120, hasJumped: true, speed: z.speed / 2.0 };
        }

        if (z.type === ZombieType.WIZARD && now - (z.lastAbilityUse || 0) > 5000) {
          const targetPlant = prev.plants.find(p => p.row === z.row && p.x < z.x && p.x > z.x - 300 && p.state !== 'disabled');
          if (targetPlant) {
            targetPlant.state = 'disabled';
            targetPlant.disabledUntil = now + 4000;
            z.lastAbilityUse = now;
          }
        }

        if (collidingPlant && currentSpeed > 0) return { ...z, hp }; 
        return { ...z, x: z.x - (currentSpeed * dtSeconds), hp };
      }).filter(z => z.hp > 0);

      const nextPlants: PlantEntity[] = prev.plants.map((p): PlantEntity => {
        if (p.state === 'disabled' && p.disabledUntil && now > p.disabledUntil) {
          p.state = 'idle';
        }

        const stats = PLANT_DATA[p.type];
        const eatingZombie = prev.zombies.find(z => 
          z.row === p.row && 
          z.x < p.x + 60 && 
          z.x > p.x + 10 &&
          p.type !== PlantType.SPIKEWEED
        );

        let newHp = p.hp;
        if (eatingZombie) {
          const baseDPS = eatingZombie.type === ZombieType.GARGANTUAR ? 1000 : 100;
          newHp -= (baseDPS * dtSeconds);
        }

        if (p.state === 'disabled') return { ...p, hp: newHp };

        if (p.type === PlantType.POTATO_MINE && !p.isArmed && now - p.lastAction > 5000) {
            return { ...p, isArmed: true, hp: newHp };
        }

        if (now - p.lastAction > stats.cooldown) {
          const zombieInRow = prev.zombies.some(z => z.row === p.row && z.x > p.x);
          const nearbyZombie = prev.zombies.some(z => z.row === p.row && Math.abs(z.x - p.x) < 250);

          switch (p.type) {
            case PlantType.SUNFLOWER:
              sunGain += 25;
              return { ...p, hp: newHp, lastAction: now };
            case PlantType.SUN_SHROOM:
              sunGain += (now - p.lastAction > 15000) ? 25 : 15;
              return { ...p, hp: newHp, lastAction: now };
            case PlantType.PEASHOOTER:
              if (zombieInRow) {
                newProjectiles.push({ id: Math.random().toString(), x: p.x + 50, y: p.y + 30, row: p.row, damage: 20, type: 'pea' });
                return { ...p, hp: newHp, lastAction: now };
              }
              break;
            case PlantType.SNOW_PEA:
              if (zombieInRow) {
                newProjectiles.push({ id: Math.random().toString(), x: p.x + 50, y: p.y + 30, row: p.row, damage: 20, type: 'snow_pea' });
                return { ...p, hp: newHp, lastAction: now };
              }
              break;
            case PlantType.REPEATER:
              if (zombieInRow) {
                newProjectiles.push({ id: Math.random().toString(), x: p.x + 50, y: p.y + 30, row: p.row, damage: 20, type: 'pea' });
                newProjectiles.push({ id: Math.random().toString(), x: p.x + 80, y: p.y + 30, row: p.row, damage: 20, type: 'pea' });
                return { ...p, hp: newHp, lastAction: now };
              }
              break;
            case PlantType.THREEPEATER:
                if (prev.zombies.some(z => (z.row === p.row || z.row === p.row - 1 || z.row === p.row + 1) && z.x > p.x)) {
                    [-1, 0, 1].forEach(offset => {
                        const targetRow = p.row + offset;
                        if (targetRow >= 0 && targetRow < GRID_ROWS) {
                            newProjectiles.push({ id: Math.random().toString(), x: p.x + 50, y: p.y + 30 + (offset * CELL_HEIGHT), row: targetRow, damage: 20, type: 'pea' });
                        }
                    });
                    return { ...p, hp: newHp, lastAction: now };
                }
                break;
            case PlantType.PUFF_SHROOM:
                if (nearbyZombie) {
                    newProjectiles.push({ id: Math.random().toString(), x: p.x + 50, y: p.y + 30, row: p.row, damage: 15, type: 'pea' });
                    return { ...p, hp: newHp, lastAction: now };
                }
                break;
            case PlantType.FUME_SHROOM:
                if (nearbyZombie) {
                    newProjectiles.push({ id: Math.random().toString(), x: p.x + 50, y: p.y + 30, row: p.row, damage: 15, type: 'fume', isPiercing: true, hitIds: [] });
                    return { ...p, hp: newHp, lastAction: now };
                }
                break;
            case PlantType.SCAREDY_SHROOM:
                const zombieTooClose = prev.zombies.some(z => z.row === p.row && Math.abs(z.x - p.x) < 180);
                if (zombieTooClose) {
                    return { ...p, hp: newHp, state: 'hidden' };
                } else if (zombieInRow) {
                    newProjectiles.push({ id: Math.random().toString(), x: p.x + 50, y: p.y + 30, row: p.row, damage: 20, type: 'pea' });
                    return { ...p, hp: newHp, lastAction: now, state: 'idle' };
                }
                break;
            case PlantType.CHERRY_BOMB:
            case PlantType.DOOM_SHROOM:
                return { ...p, hp: 0 };
            case PlantType.SQUASH:
                const target = prev.zombies.find(z => z.row === p.row && Math.abs(z.x - p.x) < 120);
                if (target) {
                    target.hp -= 2000;
                    return { ...p, hp: 0 };
                }
                break;
            case PlantType.CHOMPER:
                const prey = prev.zombies.find(z => z.row === p.row && z.x > p.x && z.x < p.x + 150);
                if (prey && p.state !== 'digesting') {
                    prey.hp = 0;
                    return { ...p, state: 'digesting', lastAction: now };
                }
                if (p.state === 'digesting' && now - p.lastAction > 12000) {
                    return { ...p, state: 'idle', lastAction: now };
                }
                break;
          }
        }
        return { ...p, hp: newHp };
      }).filter(p => p.hp > 0);

      prev.plants.forEach(p => {
          if (p.type === PlantType.POTATO_MINE && p.isArmed) {
              const victim = nextZombies.find(z => z.row === p.row && Math.abs(z.x - p.x) < 40);
              if (victim) {
                  victim.hp -= 2000;
                  const idx = nextPlants.findIndex(plant => plant.id === p.id);
                  if (idx > -1) nextPlants.splice(idx, 1);
              }
          }
          if (p.type === PlantType.CHERRY_BOMB && now - p.lastAction > 500) {
              nextZombies.forEach(z => {
                  if (Math.abs(z.row - p.row) <= 1 && Math.abs(z.x - p.x) < 180) z.hp -= 2000;
              });
          }
          if (p.type === PlantType.DOOM_SHROOM && now - p.lastAction > 500) {
            nextZombies.forEach(z => {
                if (Math.abs(z.row - p.row) <= 2 && Math.abs(z.x - p.x) < 350) z.hp -= 5000;
            });
          }
      });

      const nextProjectiles = newProjectiles.map(pr => {
          let x = pr.x + (PEA_SPEED_PX_PER_SEC * dtSeconds);
          let type = pr.type;
          let damage = pr.damage;
          const torch = prev.plants.find(p => p.type === PlantType.TORCHWOOD && p.row === pr.row && pr.x > p.x && pr.x < p.x + 50);
          if (torch && type === 'pea') {
              type = 'fire_pea';
              damage *= 2;
          } else if (torch && type === 'snow_pea') {
              type = 'pea';
          }
          return { ...pr, x, type, damage };
      }).filter(pr => pr.x < LAWN_WIDTH + 50);

      let scoreGain = 0;
      nextProjectiles.forEach(pr => {
          const hitZombie = nextZombies.find(z => 
            z.row === pr.row && 
            pr.x > z.x && 
            pr.x < z.x + 60 &&
            (!pr.isPiercing || !pr.hitIds?.includes(z.id))
          );
          if (hitZombie) {
              hitZombie.hp -= pr.damage;
              if (pr.type === 'snow_pea') hitZombie.speed = Math.max(0.15 * (GET_BASE_ZOMBIE_SPEED(prev.difficulty || Difficulty.EASY)), hitZombie.speed * 0.5);
              if (pr.isPiercing) {
                  pr.hitIds?.push(hitZombie.id);
              } else {
                  pr.x = 9999; 
              }
              if (hitZombie.hp <= 0) scoreGain += 100;
          }
      });

      const nextFallingSun = prev.fallingSun.map(s => ({ ...s, y: s.y + (150 * dtSeconds) }))
        .filter(s => s.y < 450);

      const isGameOver = nextZombies.some(z => {
        const rowMower = nextMowers[z.row];
        return z.x < -60 && rowMower.isSpent;
      });

      zombieSpawnTimer.current += deltaTime;
      const spawnRate = prev.difficulty === Difficulty.HARD ? 3500 : prev.difficulty === Difficulty.MEDIUM ? 5000 : 7000;
      if (zombieSpawnTimer.current > (spawnRate / (1 + prev.wave * 0.35))) {
        spawnZombie();
        zombieSpawnTimer.current = 0;
      }

      sunSpawnTimer.current += deltaTime;
      if (sunSpawnTimer.current > 4000) {
        spawnSun();
        sunSpawnTimer.current = 0;
      }

      return {
        ...prev,
        zombies: nextZombies.filter(z => z.hp > 0),
        plants: nextPlants,
        projectiles: nextProjectiles.filter(pr => pr.x < LAWN_WIDTH + 50),
        fallingSun: nextFallingSun,
        sun: prev.sun + sunGain,
        score: prev.score + scoreGain,
        mowers: nextMowers,
        isGameOver
      };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [spawnZombie, spawnSun]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  useEffect(() => {
    if (!gameState.difficulty) return;
    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
    }, 15000); 
    return () => clearInterval(interval);
  }, [gameState.difficulty]);

  const selectDifficulty = (diff: Difficulty) => {
    setGameState(prev => ({ ...prev, difficulty: diff }));
    setAdvice(diff === Difficulty.HARD ? "Wabby Wabbo! Watch out, they move fast!" : "Let's plant some stuff!");
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-stone-900 overflow-hidden select-none">
      <div 
        className="relative bg-green-800 border-8 border-amber-900 shadow-2xl overflow-hidden transition-transform"
        style={{ 
          width: LAWN_WIDTH, 
          height: GRID_ROWS * CELL_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        <div className="absolute inset-0 grid grid-cols-9 grid-rows-5 pointer-events-none">
          {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
            const row = Math.floor(i / GRID_COLS);
            const col = i % GRID_COLS;
            const isDark = (row + col) % 2 === 0;
            return (
              <div key={i} className={`${isDark ? 'bg-green-600' : 'bg-green-500'} border border-green-700/10`}/>
            );
          })}
        </div>

        <div className="absolute inset-0 grid grid-cols-9 grid-rows-5 z-10">
          {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
            const r = Math.floor(i / GRID_COLS);
            const c = i % GRID_COLS;
            return (
              <div key={i} onClick={() => handleCellClick(r, c)} className="hover:bg-white/10 cursor-pointer transition-colors"/>
            );
          })}
        </div>

        <div className="absolute inset-0 pointer-events-none z-20">
          {gameState.mowers.map(m => !m.isSpent && (
            <div key={m.row} className="absolute text-5xl z-40 transition-all" style={{ left: m.x, top: m.row * CELL_HEIGHT + 20 }}>
              🚜
            </div>
          ))}

          {gameState.plants.map(p => (
            <div key={p.id} className="absolute flex items-center justify-center" style={{ left: p.x, top: p.y, width: CELL_WIDTH, height: CELL_HEIGHT }}>
              <div className="relative">
                <span className={`text-6xl ${p.state === 'hidden' ? 'opacity-30 scale-75' : p.state === 'disabled' ? 'scale-75' : 'animate-bounce'}`} style={{ animationDuration: '1.5s' }}>
                  {p.state === 'disabled' ? '🐑' : PLANT_DATA[p.type].icon}
                </span>
                {p.type === PlantType.POTATO_MINE && !p.isArmed && <span className="absolute -top-2 text-xs">⏳</span>}
                {p.state === 'digesting' && <span className="absolute -bottom-2 text-xs">💤</span>}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-red-900 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 transition-all" style={{ width: `${(p.hp / PLANT_DATA[p.type].hp) * 100}%` }}/>
                </div>
              </div>
            </div>
          ))}

          {gameState.zombies.map(z => (
            <div key={z.id} className="absolute z-30 transition-all duration-75" style={{ left: z.x, top: z.y, width: CELL_WIDTH, height: CELL_HEIGHT }}>
              <div className="flex items-center justify-center h-full w-full relative">
                 <div className={`transform scale-x-[-1] ${z.isFrozen ? 'text-blue-300' : ''} ${z.type === ZombieType.GARGANTUAR ? 'text-8xl scale-150' : 'text-6xl'} ${z.type === ZombieType.WIZARD ? 'drop-shadow-[0_0_10px_purple]' : ''}`}>
                    {z.type === ZombieType.BUCKETHEAD ? '🪣' : 
                     z.type === ZombieType.CONEHEAD ? '⚠️' : 
                     z.type === ZombieType.POLE_VAULTER ? (z.hasJumped ? '🧟' : '🏃') :
                     z.type === ZombieType.WIZARD ? '🧙' :
                     z.type === ZombieType.GARGANTUAR ? '👹' : '🧟'}
                 </div>
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-stone-900/60 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${(z.hp / z.maxHp) * 100}%` }}/>
                </div>
              </div>
            </div>
          ))}

          {gameState.projectiles.map(pr => (
            <div key={pr.id} className={`absolute border-2 rounded-full shadow-md ${pr.type === 'snow_pea' ? 'bg-blue-300 border-blue-600' : pr.type === 'fire_pea' ? 'bg-orange-500 border-orange-800 animate-pulse' : pr.type === 'fume' ? 'bg-purple-400 border-purple-800 scale-150 opacity-60' : 'bg-green-400 border-green-800'}`} style={{ left: pr.x, top: pr.y, width: 22, height: 22 }}/>
          ))}

          {gameState.fallingSun.map(s => (
            <div key={s.id} onClick={(e) => { e.stopPropagation(); handleSunClick(s.id); }} className="absolute text-5xl cursor-pointer pointer-events-auto hover:scale-125 transition-transform animate-spin" style={{ left: s.x, top: s.y, animationDuration: '4s' }}>
              ☀️
            </div>
          ))}
        </div>
      </div>

      <GameUI 
        sun={gameState.sun}
        score={gameState.score}
        wave={gameState.wave}
        selectedPlant={gameState.selectedPlant}
        onSelectPlant={(type) => setGameState(prev => ({ ...prev, selectedPlant: type }))}
        onGetAdvice={fetchAdvice}
        advice={advice}
      />

      {!gameState.difficulty && (
        <div className="absolute inset-0 bg-black/80 z-[110] flex flex-col items-center justify-center p-4">
          <div className="bg-stone-800 border-8 border-amber-900 p-6 sm:p-12 rounded-3xl shadow-2xl flex flex-col items-center max-w-2xl text-center w-full">
            <h1 className="text-3xl sm:text-6xl font-game text-white mb-4 drop-shadow-lg">FLORA vs PHANTOMS</h1>
            <p className="text-sm sm:text-xl text-amber-200 font-bold mb-6 sm:mb-12 uppercase tracking-widest">Select Your Challenge</p>
            <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-md">
              <button onClick={() => selectDifficulty(Difficulty.EASY)} className="bg-green-600 hover:bg-green-500 text-white p-4 sm:p-6 rounded-2xl font-game text-lg sm:text-2xl border-b-8 border-green-800 flex justify-between items-center group transition-all active:translate-y-1 active:border-b-4">
                <span>EASY</span>
                <span className="text-[10px] sm:text-sm opacity-60 font-sans">60s CROSS</span>
              </button>
              <button onClick={() => selectDifficulty(Difficulty.MEDIUM)} className="bg-yellow-600 hover:bg-yellow-500 text-white p-4 sm:p-6 rounded-2xl font-game text-lg sm:text-2xl border-b-8 border-yellow-800 flex justify-between items-center group transition-all active:translate-y-1 active:border-b-4">
                <span>MEDIUM</span>
                <span className="text-[10px] sm:text-sm opacity-60 font-sans">45s CROSS</span>
              </button>
              <button onClick={() => selectDifficulty(Difficulty.HARD)} className="bg-red-600 hover:bg-red-500 text-white p-4 sm:p-6 rounded-2xl font-game text-lg sm:text-2xl border-b-8 border-red-800 flex justify-between items-center group transition-all active:translate-y-1 active:border-b-4">
                <span>HARD</span>
                <span className="text-[10px] sm:text-sm opacity-60 font-sans">30s CROSS</span>
              </button>
            </div>
            <p className="mt-4 sm:mt-8 text-stone-400 italic text-[10px] sm:text-sm">Zombies get 10% faster every wave!</p>
          </div>
        </div>
      )}

      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/95 z-[120] flex flex-col items-center justify-center text-white text-center p-6">
          <h1 className="text-4xl sm:text-7xl font-game text-red-600 mb-6 animate-pulse uppercase tracking-tighter">THE ZOMBIES ATE YOUR BRAINS!</h1>
          <p className="text-lg sm:text-2xl mb-10 font-game opacity-80">Score: {gameState.score} | Waves: {gameState.wave}</p>
          <button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 sm:px-12 sm:py-4 rounded-xl font-game text-xl sm:text-3xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all">TRY AGAIN</button>
        </div>
      )}

      {gameState.wave % 5 === 0 && gameState.difficulty && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-ping text-center w-full px-4">
              <span className="font-game text-2xl sm:text-6xl text-red-500 drop-shadow-lg">A HUGE WAVE IS APPROACHING!</span>
          </div>
      )}
    </div>
  );
};

export default App;
