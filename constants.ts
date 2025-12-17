
import { PlantType, PlantStats, Difficulty } from './types';

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_WIDTH = 100;
export const CELL_HEIGHT = 100;
export const LAWN_WIDTH = GRID_COLS * CELL_WIDTH;

export const PLANT_DATA: Record<PlantType, PlantStats> = {
  [PlantType.SUNFLOWER]: {
    type: PlantType.SUNFLOWER,
    cost: 50,
    hp: 100,
    cooldown: 5000,
    icon: '🌻',
    color: 'bg-yellow-400',
    description: 'Produces sun.'
  },
  [PlantType.PEASHOOTER]: {
    type: PlantType.PEASHOOTER,
    cost: 100,
    hp: 100,
    cooldown: 1400,
    icon: '🌱',
    color: 'bg-green-500',
    description: 'Shoots peas.'
  },
  [PlantType.WALLNUT]: {
    type: PlantType.WALLNUT,
    cost: 50,
    hp: 1000,
    cooldown: 12000,
    icon: '🌰',
    color: 'bg-amber-700',
    description: 'High health blocker.'
  },
  [PlantType.CHERRY_BOMB]: {
    type: PlantType.CHERRY_BOMB,
    cost: 150,
    hp: 10,
    cooldown: 20000,
    icon: '🍒',
    color: 'bg-red-600',
    description: 'Explodes nearby.'
  },
  [PlantType.SNOW_PEA]: {
    type: PlantType.SNOW_PEA,
    cost: 175,
    hp: 100,
    cooldown: 1400,
    icon: '❄️',
    color: 'bg-cyan-400',
    description: 'Slows zombies.'
  },
  [PlantType.POTATO_MINE]: {
    type: PlantType.POTATO_MINE,
    cost: 25,
    hp: 10,
    cooldown: 8000,
    icon: '🥔',
    color: 'bg-yellow-800',
    description: 'Explodes on contact.'
  },
  [PlantType.REPEATER]: {
    type: PlantType.REPEATER,
    cost: 200,
    hp: 100,
    cooldown: 1400,
    icon: '🎋',
    color: 'bg-green-700',
    description: 'Shoots two peas.'
  },
  [PlantType.PUFF_SHROOM]: {
    type: PlantType.PUFF_SHROOM,
    cost: 0,
    hp: 50,
    cooldown: 4000,
    icon: '🍄',
    color: 'bg-purple-400',
    description: 'Short range, free.'
  },
  [PlantType.FUME_SHROOM]: {
    type: PlantType.FUME_SHROOM,
    cost: 75,
    hp: 100,
    cooldown: 1800,
    icon: '💨',
    color: 'bg-purple-600',
    description: 'Piercing attacks.'
  },
  [PlantType.SUN_SHROOM]: {
    type: PlantType.SUN_SHROOM,
    cost: 25,
    hp: 100,
    cooldown: 4500,
    icon: '🔅',
    color: 'bg-yellow-200',
    description: 'Cheap sun producer.'
  },
  [PlantType.CHOMPER]: {
    type: PlantType.CHOMPER,
    cost: 150,
    hp: 200,
    cooldown: 15000,
    icon: '🫦',
    color: 'bg-indigo-700',
    description: 'Eats one zombie.'
  },
  [PlantType.SCAREDY_SHROOM]: {
    type: PlantType.SCAREDY_SHROOM,
    cost: 25,
    hp: 80,
    cooldown: 1400,
    icon: '🫣',
    color: 'bg-purple-300',
    description: 'Long range, shy.'
  },
  [PlantType.ICE_SHROOM]: {
    type: PlantType.ICE_SHROOM,
    cost: 75,
    hp: 10,
    cooldown: 25000,
    icon: '🥶',
    color: 'bg-blue-600',
    description: 'Freezes all zombies.'
  },
  [PlantType.DOOM_SHROOM]: {
    type: PlantType.DOOM_SHROOM,
    cost: 125,
    hp: 10,
    cooldown: 35000,
    icon: '🧨',
    color: 'bg-black',
    description: 'Massive explosion.'
  },
  [PlantType.SQUASH]: {
    type: PlantType.SQUASH,
    cost: 50,
    hp: 100,
    cooldown: 10000,
    icon: '🎃',
    color: 'bg-green-900',
    description: 'Crushes zombies.'
  },
  [PlantType.THREEPEATER]: {
    type: PlantType.THREEPEATER,
    cost: 325,
    hp: 120,
    cooldown: 1400,
    icon: '🔱',
    color: 'bg-green-400',
    description: 'Shoots in 3 rows.'
  },
  [PlantType.JALAPENO]: {
    type: PlantType.JALAPENO,
    cost: 125,
    hp: 10,
    cooldown: 18000,
    icon: '🌶️',
    color: 'bg-red-700',
    description: 'Clears a full row.'
  },
  [PlantType.SPIKEWEED]: {
    type: PlantType.SPIKEWEED,
    cost: 100,
    hp: 300,
    cooldown: 8000,
    icon: '🌵',
    color: 'bg-green-800',
    description: 'Damages walking zombies.'
  },
  [PlantType.TORCHWOOD]: {
    type: PlantType.TORCHWOOD,
    cost: 175,
    hp: 150,
    cooldown: 6000,
    icon: '🔥',
    color: 'bg-orange-600',
    description: 'Lights peas on fire.'
  }
};

export const CROSS_TIME_SECONDS: Record<Difficulty, number> = {
  [Difficulty.EASY]: 60,
  [Difficulty.MEDIUM]: 45,
  [Difficulty.HARD]: 30
};

/**
 * Returns velocity in pixels per second.
 * To get 30s cross time for a 900px lawn: 900 / 30 = 30px/s.
 */
export const GET_BASE_ZOMBIE_SPEED = (difficulty: Difficulty) => {
    return LAWN_WIDTH / CROSS_TIME_SECONDS[difficulty];
};

export const PEA_SPEED_PX_PER_SEC = 600; 
export const INITIAL_SUN = 500;
