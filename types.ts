
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
  color: string;
  description: string;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  row: number;
  hp: number;
}

export interface PlantEntity extends Entity {
  type: PlantType;
  lastAction: number;
  isArmed?: boolean;
  state?: 'idle' | 'attacking' | 'digesting' | 'hidden' | 'disabled';
  disabledUntil?: number;
}

export interface ZombieEntity extends Entity {
  type: ZombieType;
  speed: number;
  maxHp: number;
  isFrozen?: boolean;
  frozenUntil?: number;
  hasJumped?: boolean;
  lastAbilityUse?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  row: number;
  damage: number;
  type: 'pea' | 'snow_pea' | 'fire_pea' | 'fume';
  isPiercing?: boolean;
  hitIds?: string[];
}

export interface MowerState {
  row: number;
  x: number;
  isActive: boolean;
  isSpent: boolean;
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
  mowers: MowerState[];
  difficulty: Difficulty | null;
}
