export type CopyAbility = 'FIRE' | 'SPARK' | 'SWORD';

export type KirbyState =
  | 'normal'
  | 'crouch'
  | 'sliding'
  | 'floating'
  | 'mouthful'
  | 'hurt'
  | 'dead'
  | 'victory';

export interface InhaledContent {
  enemyType: string;
  copyAbility: CopyAbility | null;
  name: string;
}

export interface KirbyPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  lives: number;
  score: number;
  stars: number;
  state: KirbyState;
  ability: CopyAbility | null;
  inhaledContent: InhaledContent | null;

  // Timers
  slideTimer: number;
  inhaleTimer: number;
  fireTimer: number;
  sparkTimer: number;
  swordTimer: number;
  swordPhase: number; // 0: none, 1: slash, 2: spin/beam
  invincibleTimer: number;
  swallowTimer: number;
  floatTimer: number;
  hurtTimer: number;
  victoryTimer: number;
}

export type EnemyType =
  | 'waddle_dee'
  | 'hot_head'
  | 'sparky'
  | 'blade_knight'
  | 'bronto_burt'
  | 'whispy_apple';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  alive: boolean;
  copyAbility: CopyAbility | null;
  name: string;
  actionTimer: number;
  behaviorState: number;
  beingInhaled: boolean;
  inhaleDistance: number;
}

export type ProjectileType =
  | 'star'
  | 'air_puff'
  | 'fire'
  | 'spark_discharge'
  | 'sword_slash'
  | 'sword_beam'
  | 'drop_star'
  | 'enemy_fire'
  | 'apple_drop';

export interface Projectile {
  id: string;
  type: ProjectileType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  damage: number;
  facing?: 1 | -1;
  canBeInhaled?: boolean;
  copyAbility?: CopyAbility | null;
}

export type ItemType = 'star_point' | 'maxim_tomato' | 'one_up' | 'candy';

export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  shape?: 'square' | 'star' | 'circle' | 'spark';
}

export interface GameSettings {
  soundEnabled: boolean;
  bgmEnabled: boolean;
  crtFilterEnabled: boolean;
  showTouchControls: boolean;
}

export interface GameStats {
  enemiesInhaled: number;
  abilitiesUsed: number;
  blocksBroken: number;
  starsCollected: number;
  itemsCollected: number;
}
