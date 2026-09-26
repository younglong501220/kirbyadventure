import { sound } from '../audio/soundEngine';
import {
  ABILITY_INFO,
  NES_HEIGHT,
  NES_WIDTH,
  STAGE_1,
  STAGE_2,
  StageData,
  TILE_SIZE
} from './constants';
import {
  CopyAbility,
  Enemy,
  GameStats,
  InhaledContent,
  Item,
  KirbyPlayer,
  Particle,
  Projectile
} from '../types/game';

export interface GameEngineCallbacks {
  onHpChange?: (hp: number, maxHp: number) => void;
  onLivesChange?: (lives: number) => void;
  onScoreChange?: (score: number) => void;
  onStarsChange?: (stars: number) => void;
  onAbilityChange?: (ability: CopyAbility | null) => void;
  onStageClear?: (stageId: number, score: number) => void;
  onGameOver?: (score: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  public currentStageIndex: number = 0;
  public currentStage: StageData = STAGE_1;
  public tiles: number[][] = [];
  public mapWidth: number = 0;

  // Entities
  public kirby!: KirbyPlayer;
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public items: Item[] = [];
  public particles: Particle[] = [];

  // Stats
  public stats: GameStats = {
    enemiesInhaled: 0,
    abilitiesUsed: 0,
    blocksBroken: 0,
    starsCollected: 0,
    itemsCollected: 0
  };

  // Input states
  public keys: Record<string, boolean> = {};
  public paused: boolean = false;
  public isClear: boolean = false;
  public isGameOver: boolean = false;

  private callbacks: GameEngineCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;
    this.callbacks = callbacks;

    this.loadStage(0);
  }

  public loadStage(stageIndex: number) {
    this.currentStageIndex = stageIndex;
    this.currentStage = stageIndex === 0 ? STAGE_1 : STAGE_2;
    this.isClear = false;
    this.isGameOver = false;

    // Build map
    this.tiles = [];
    const grid = this.currentStage.mapGrid;
    this.mapWidth = grid[0].length * TILE_SIZE;

    for (let r = 0; r < grid.length; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < grid[r].length; c++) {
        const char = grid[r][c];
        this.tiles[r][c] = char === '.' ? 0 : parseInt(char, 10);
      }
    }

    // Initialize Kirby
    const prevScore = this.kirby?.score ?? 0;
    const prevLives = this.kirby?.lives ?? 3;
    const prevStars = this.kirby?.stars ?? 0;
    const prevAbility = this.kirby?.ability ?? null;

    this.kirby = {
      x: 32,
      y: 140,
      vx: 0,
      vy: 0,
      w: 14,
      h: 14,
      facing: 1,
      hp: 6,
      maxHp: 6,
      lives: prevLives,
      score: prevScore,
      stars: prevStars,
      state: 'normal',
      ability: prevAbility,
      inhaledContent: null,
      slideTimer: 0,
      inhaleTimer: 0,
      fireTimer: 0,
      sparkTimer: 0,
      swordTimer: 0,
      swordPhase: 0,
      invincibleTimer: 0,
      swallowTimer: 0,
      floatTimer: 0,
      hurtTimer: 0,
      victoryTimer: 0
    };

    // Spawn enemies
    this.enemies = this.currentStage.enemies.map((e, index) => ({
      id: `enemy_${index}`,
      type: e.type,
      x: e.x,
      y: e.y,
      vx: (e.facing ?? -1) * 0.45,
      vy: 0,
      w: 14,
      h: 14,
      hp: e.type === 'blade_knight' ? 2 : 1,
      maxHp: e.type === 'blade_knight' ? 2 : 1,
      facing: e.facing ?? -1,
      alive: true,
      copyAbility: e.copyAbility ?? null,
      name: e.type,
      actionTimer: 0,
      behaviorState: 0,
      beingInhaled: false,
      inhaleDistance: 0
    }));

    // Spawn items
    this.items = this.currentStage.items.map((it, idx) => ({
      id: `item_${idx}`,
      type: it.type,
      x: it.x,
      y: it.y,
      vx: 0,
      vy: 0,
      w: 12,
      h: 12,
      collected: false
    }));

    this.projectiles = [];
    this.particles = [];

    this.triggerCallbacks();
  }

  private triggerCallbacks() {
    this.callbacks.onHpChange?.(this.kirby.hp, this.kirby.maxHp);
    this.callbacks.onLivesChange?.(this.kirby.lives);
    this.callbacks.onScoreChange?.(this.kirby.score);
    this.callbacks.onStarsChange?.(this.kirby.stars);
    this.callbacks.onAbilityChange?.(this.kirby.ability);
  }

  public getTile(x: number, y: number): number {
    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);
    if (r < 0 || r >= this.tiles.length || c < 0 || c >= this.tiles[0].length) {
      return 0;
    }
    return this.tiles[r][c];
  }

  public setTile(x: number, y: number, val: number) {
    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);
    if (r >= 0 && r < this.tiles.length && c >= 0 && c < this.tiles[0].length) {
      this.tiles[r][c] = val;
    }
  }

  public breakBlock(x: number, y: number) {
    const tileVal = this.getTile(x, y);
    if (tileVal === 3) {
      // Star block break
      this.setTile(x, y, 0);
      sound.play('block_break');
      this.stats.blocksBroken++;
      this.kirby.score += 100;
      this.callbacks.onScoreChange?.(this.kirby.score);

      const blockCenterX = Math.floor(x / TILE_SIZE) * TILE_SIZE + 8;
      const blockCenterY = Math.floor(y / TILE_SIZE) * TILE_SIZE + 8;
      // Spawn star debris particles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2;
        this.addParticle(
          blockCenterX,
          blockCenterY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 1,
          i % 2 === 0 ? '#ffea00' : '#ffffff',
          25,
          3,
          'star'
        );
      }
    }
  }

  public addParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    life: number = 20,
    size: number = 3,
    shape: 'square' | 'star' | 'circle' | 'spark' = 'square'
  ) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      life,
      maxLife: life,
      size,
      shape
    });
  }

  // --- INPUT ACTION HANDLERS ---
  public setKey(code: string, pressed: boolean) {
    this.keys[code] = pressed;
    if (pressed) {
      sound.enableAudio();
    }
  }

  public dropAbility() {
    if (!this.kirby.ability) return;
    const droppedAbility = this.kirby.ability;
    this.kirby.ability = null;
    this.callbacks.onAbilityChange?.(null);

    sound.play('drop_star');

    // Spawn bouncing Ability Star
    this.projectiles.push({
      id: `drop_${Date.now()}`,
      type: 'drop_star',
      x: this.kirby.x,
      y: this.kirby.y - 12,
      vx: this.kirby.facing * 1.8,
      vy: -2.8,
      w: 12,
      h: 12,
      life: 180,
      maxLife: 180,
      damage: 1,
      canBeInhaled: true,
      copyAbility: droppedAbility
    });

    for (let i = 0; i < 6; i++) {
      this.addParticle(
        this.kirby.x + 7,
        this.kirby.y,
        (Math.random() - 0.5) * 3,
        -Math.random() * 2,
        '#ffe600',
        20,
        3,
        'star'
      );
    }
  }

  public resetGame() {
    this.loadStage(0);
    this.kirby.score = 0;
    this.kirby.lives = 3;
    this.kirby.stars = 0;
    this.kirby.ability = null;
    this.triggerCallbacks();
  }

  public nextStage() {
    if (this.currentStageIndex < 1) {
      this.loadStage(this.currentStageIndex + 1);
    } else {
      // Loop or victory
      this.loadStage(0);
    }
  }

  // --- MAIN UPDATE LOOP ---
  public update() {
    if (this.paused) return;

    const k = this.kirby;

    // Victory celebration state
    if (this.isClear) {
      k.victoryTimer++;
      k.vx = 0;
      k.vy = Math.sin(k.victoryTimer * 0.1) * 0.5;
      this.updateParticles();
      return;
    }

    // Game over state
    if (this.isGameOver) {
      k.vy += 0.2;
      k.y += k.vy;
      this.updateParticles();
      return;
    }

    // Invincible blink timer
    if (k.invincibleTimer > 0) k.invincibleTimer--;
    if (k.hurtTimer > 0) k.hurtTimer--;

    // Ground check
    const onGround =
      this.getTile(k.x + 2, k.y + k.h + 1) > 0 ||
      this.getTile(k.x + k.w - 2, k.y + k.h + 1) > 0;

    // Controls
    const leftPressed = this.keys['ArrowLeft'] || this.keys['KeyA'];
    const rightPressed = this.keys['ArrowRight'] || this.keys['KeyD'];
    const downPressed = this.keys['ArrowDown'] || this.keys['KeyS'];
    const upPressed = this.keys['ArrowUp'] || this.keys['KeyW'];
    const jumpPressed = this.keys['KeyZ'] || this.keys['Space'] || this.keys['KeyJ'];
    const attackPressed = this.keys['KeyX'] || this.keys['KeyK'];
    const dropPressed = this.keys['KeyC'] || this.keys['KeyL'];

    if (dropPressed && k.ability) {
      this.dropAbility();
      this.keys['KeyC'] = false;
      this.keys['KeyL'] = false;
    }

    // 1. Sliding Tackle (Down + Jump while on ground)
    if (downPressed && jumpPressed && onGround && k.state === 'normal') {
      k.state = 'sliding';
      k.slideTimer = 18;
      k.vx = k.facing * 3.6;
      sound.play('slide');
      for (let i = 0; i < 4; i++) {
        this.addParticle(
          k.x + (k.facing === 1 ? 0 : k.w),
          k.y + k.h - 2,
          -k.facing * (1 + Math.random()),
          -Math.random(),
          '#ffffff',
          14,
          2
        );
      }
    }

    if (k.state === 'sliding') {
      k.slideTimer--;
      k.vx *= 0.93;
      // Particle dust
      if (Math.random() > 0.4) {
        this.addParticle(
          k.x + (k.facing === 1 ? 0 : k.w),
          k.y + k.h - 1,
          -k.facing * 1.5,
          -0.5,
          '#f5d7b5',
          10,
          2
        );
      }
      if (k.slideTimer <= 0) {
        k.state = 'normal';
      }
    } else {
      // Normal Left/Right movement
      if (leftPressed) {
        k.vx = k.state === 'floating' ? -1.1 : -1.4;
        k.facing = -1;
      } else if (rightPressed) {
        k.vx = k.state === 'floating' ? 1.1 : 1.4;
        k.facing = 1;
      } else {
        k.vx *= 0.72;
      }

      // Crouch state
      if (downPressed && onGround && k.state === 'normal') {
        k.state = 'crouch';
      } else if (k.state === 'crouch' && !downPressed) {
        k.state = 'normal';
      }
    }

    // 2. Jumping and Infinite Hover Flutter
    if (jumpPressed || (upPressed && k.state === 'floating')) {
      if (onGround && k.state !== 'floating' && k.state !== 'sliding') {
        k.vy = -4.0;
        sound.play('jump');
        // Jump dust
        this.addParticle(k.x + 2, k.y + k.h, -1, 0, '#ffffff', 10, 2);
        this.addParticle(k.x + k.w - 2, k.y + k.h, 1, 0, '#ffffff', 10, 2);
      } else if (!onGround && k.state !== 'floating' && k.state !== 'mouthful') {
        // Inflate cheeks and start floating!
        k.state = 'floating';
        k.vy = -2.2;
        sound.play('float');
      } else if (k.state === 'floating') {
        // Continuous flutter
        k.vy = -1.8;
        sound.play('float');
        this.addParticle(k.x + 7, k.y + k.h, 0, 1.2, '#ffffff', 8, 2);
      }

      // Reset edge trigger
      this.keys['KeyZ'] = false;
      this.keys['Space'] = false;
      this.keys['KeyJ'] = false;
    }

    // Gravity calculation
    if (k.state === 'floating') {
      k.vy = Math.min(k.vy + 0.1, 0.75); // Slow flutter descent
    } else {
      k.vy = Math.min(k.vy + 0.26, 4.6); // Normal gravity
    }

    // 3. Attack / Inhale / Spit Actions
    if (attackPressed) {
      if (k.state === 'floating') {
        // Spit air puff to exhale and descend!
        k.state = 'normal';
        this.projectiles.push({
          id: `air_${Date.now()}`,
          type: 'air_puff',
          x: k.facing === 1 ? k.x + 15 : k.x - 9,
          y: k.y + 3,
          vx: k.facing * 3.4,
          vy: 0,
          w: 8,
          h: 8,
          life: 18,
          maxLife: 18,
          damage: 1
        });
        sound.play('air_puff');
        this.keys['KeyX'] = false;
        this.keys['KeyK'] = false;
      } else if (k.state === 'mouthful') {
        // Spit out piercing STAR SPIT!
        k.state = 'normal';
        this.projectiles.push({
          id: `star_${Date.now()}`,
          type: 'star',
          x: k.facing === 1 ? k.x + 16 : k.x - 14,
          y: k.y + 1,
          vx: k.facing * 4.6,
          vy: 0,
          w: 12,
          h: 12,
          life: 55,
          maxLife: 55,
          damage: 3
        });
        sound.play('spit');
        k.inhaledContent = null;
        this.keys['KeyX'] = false;
        this.keys['KeyK'] = false;
      } else if (k.state === 'normal' || k.state === 'crouch') {
        // Use Copy Ability or Vacuum Inhale
        if (k.ability === 'FIRE') {
          // Flame Breath
          k.fireTimer = 16;
          this.stats.abilitiesUsed++;
          if (Math.random() > 0.3) {
            sound.play('fire');
          }
          for (let i = 0; i < 2; i++) {
            this.projectiles.push({
              id: `fire_${Date.now()}_${i}`,
              type: 'fire',
              x: k.facing === 1 ? k.x + 14 : k.x - 8,
              y: k.y + 2 + (Math.random() * 8 - 4),
              vx: k.facing * (2.8 + Math.random() * 2.2),
              vy: (Math.random() - 0.5) * 1.2,
              w: 8,
              h: 8,
              life: 20,
              maxLife: 20,
              damage: 2
            });
          }
        } else if (k.ability === 'SPARK') {
          // Electric Spark Shield
          k.sparkTimer = 22;
          this.stats.abilitiesUsed++;
          if (Math.random() > 0.4) {
            sound.play('spark');
          }
          // Spawn electrical spark discharge hitbox
          this.projectiles.push({
            id: `spark_${Date.now()}`,
            type: 'spark_discharge',
            x: k.x - 6,
            y: k.y - 6,
            vx: 0,
            vy: 0,
            w: 26,
            h: 26,
            life: 6,
            maxLife: 6,
            damage: 2
          });
        } else if (k.ability === 'SWORD') {
          // Sword slash or sword beam
          if (k.swordTimer <= 0) {
            k.swordTimer = 18;
            k.swordPhase = 1;
            sound.play('sword');
            this.stats.abilitiesUsed++;

            // Sword slash hitbox
            this.projectiles.push({
              id: `sword_${Date.now()}`,
              type: 'sword_slash',
              x: k.facing === 1 ? k.x + 10 : k.x - 16,
              y: k.y - 2,
              vx: 0,
              vy: 0,
              w: 18,
              h: 18,
              life: 10,
              maxLife: 10,
              damage: 2
            });

            // If at full health or in air, shoot Sword Beam!
            if (k.hp === k.maxHp || !onGround) {
              this.projectiles.push({
                id: `sword_beam_${Date.now()}`,
                type: 'sword_beam',
                x: k.facing === 1 ? k.x + 16 : k.x - 12,
                y: k.y + 3,
                vx: k.facing * 4.2,
                vy: 0,
                w: 10,
                h: 8,
                life: 35,
                maxLife: 35,
                damage: 2
              });
            }
          }
          this.keys['KeyX'] = false;
          this.keys['KeyK'] = false;
        } else {
          // Vacuum Inhale
          k.inhaleTimer = 6;
          sound.startInhaleSound();

          // Vortex suction particles
          for (let i = 0; i < 2; i++) {
            const spawnX = k.x + (k.facing === 1 ? 44 : -34) + Math.random() * 14;
            const spawnY = k.y + Math.random() * 16 - 2;
            this.addParticle(
              spawnX,
              spawnY,
              k.facing * -3.2,
              (k.y + 6 - spawnY) * 0.1,
              '#ffffff',
              12,
              2
            );
          }

          // Check enemies for suction
          this.enemies.forEach(e => {
            if (!e.alive) return;
            const distX = (e.x - k.x) * k.facing;
            const distY = Math.abs(e.y - k.y);

            if (distX > 0 && distX < 68 && distY < 22) {
              e.beingInhaled = true;
              e.x -= k.facing * 2.8; // Draw into vortex

              // Swallowed into mouth!
              if (distX < 12) {
                e.alive = false;
                e.beingInhaled = false;
                k.state = 'mouthful';
                k.inhaledContent = {
                  enemyType: e.type,
                  copyAbility: e.copyAbility,
                  name: e.name
                };
                sound.stopInhaleSound();
                sound.play('jump');
                this.stats.enemiesInhaled++;
              }
            } else {
              e.beingInhaled = false;
            }
          });

          // Check droppable star projectiles for suction back
          this.projectiles.forEach(p => {
            if (p.canBeInhaled) {
              const distX = (p.x - k.x) * k.facing;
              const distY = Math.abs(p.y - k.y);
              if (distX > 0 && distX < 65 && distY < 24) {
                p.x -= k.facing * 3;
                if (distX < 10) {
                  p.life = 0;
                  k.state = 'mouthful';
                  k.inhaledContent = {
                    enemyType: 'drop_star',
                    copyAbility: p.copyAbility ?? null,
                    name: 'Ability Star'
                  };
                  sound.stopInhaleSound();
                  sound.play('jump');
                }
              }
            }
          });
        }
      }
    } else {
      if (k.inhaleTimer > 0) {
        k.inhaleTimer = 0;
        sound.stopInhaleSound();
      }
    }

    // 4. Swallow Inhaled Enemy & Obtain Copy Ability (Down key while mouthful)
    if (downPressed && k.state === 'mouthful') {
      k.state = 'normal';
      sound.play('swallow');
      k.swallowTimer = 16;

      if (k.inhaledContent?.copyAbility) {
        k.ability = k.inhaledContent.copyAbility;
        sound.play('copy');
        this.callbacks.onAbilityChange?.(k.ability);

        // Celebratory sparkles
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          this.addParticle(
            k.x + 7,
            k.y + 7,
            Math.cos(angle) * 2.2,
            Math.sin(angle) * 2.2,
            i % 2 === 0 ? '#ffea00' : '#ff44aa',
            24,
            3,
            'star'
          );
        }
      } else {
        // Normal enemy heals 1 HP!
        if (k.hp < k.maxHp) {
          k.hp = Math.min(k.hp + 1, k.maxHp);
          this.callbacks.onHpChange?.(k.hp, k.maxHp);
        }
        k.score += 200;
        this.callbacks.onScoreChange?.(k.score);
      }

      k.inhaledContent = null;
      this.keys['ArrowDown'] = false;
      this.keys['KeyS'] = false;
    }

    // Timers
    if (k.fireTimer > 0) k.fireTimer--;
    if (k.sparkTimer > 0) k.sparkTimer--;
    if (k.swordTimer > 0) k.swordTimer--;
    if (k.swallowTimer > 0) k.swallowTimer--;

    // 5. Physics & Collision Handling (X Axis)
    k.x += k.vx;

    // Boundary
    if (k.x < 0) {
      k.x = 0;
      k.vx = 0;
    }
    if (k.x > this.mapWidth - k.w) {
      k.x = this.mapWidth - k.w;
      k.vx = 0;
    }

    // Left wall collision
    if (
      this.getTile(k.x, k.y + 4) > 0 ||
      this.getTile(k.x, k.y + k.h - 2) > 0
    ) {
      if (k.state === 'sliding') {
        this.breakBlock(k.x, k.y + 4);
        this.breakBlock(k.x, k.y + k.h - 2);
      }
      k.x = Math.floor(k.x / TILE_SIZE + 1) * TILE_SIZE;
      k.vx = 0;
    }

    // Right wall collision
    if (
      this.getTile(k.x + k.w, k.y + 4) > 0 ||
      this.getTile(k.x + k.w, k.y + k.h - 2) > 0
    ) {
      if (k.state === 'sliding') {
        this.breakBlock(k.x + k.w, k.y + 4);
        this.breakBlock(k.x + k.w, k.y + k.h - 2);
      }
      k.x = Math.floor((k.x + k.w) / TILE_SIZE) * TILE_SIZE - k.w;
      k.vx = 0;
    }

    // 6. Physics & Collision Handling (Y Axis)
    k.y += k.vy;

    if (k.vy < 0) {
      // Head bump collision
      const headL = this.getTile(k.x + 2, k.y);
      const headR = this.getTile(k.x + k.w - 2, k.y);

      if (headL === 3) this.breakBlock(k.x + 2, k.y);
      if (headR === 3) this.breakBlock(k.x + k.w - 2, k.y);

      if (headL > 0 || headR > 0) {
        k.y = Math.floor(k.y / TILE_SIZE + 1) * TILE_SIZE;
        k.vy = 0;
      }
    } else {
      // Landing on floor
      const footL = this.getTile(k.x + 2, k.y + k.h);
      const footR = this.getTile(k.x + k.w - 2, k.y + k.h);

      if (footL > 0 || footR > 0) {
        k.y = Math.floor((k.y + k.h) / TILE_SIZE) * TILE_SIZE - k.h;
        k.vy = 0;
        if (k.state === 'floating') {
          k.state = 'normal'; // Landed safely
        }
      }
    }

    // Pit death
    if (k.y > NES_HEIGHT + 40) {
      this.takeDamage(999);
    }

    // 7. Enemy Updates & Interactions
    this.enemies.forEach(e => {
      if (!e.alive) return;

      // Enemy AI logic
      e.actionTimer++;
      if (e.type === 'sparky') {
        // Bouncing motion
        if (e.actionTimer % 45 === 0) {
          e.vy = -3.0;
        }
        e.vy = Math.min(e.vy + 0.2, 4);
        e.y += e.vy;
        if (this.getTile(e.x + 4, e.y + e.h) > 0) {
          e.y = Math.floor((e.y + e.h) / TILE_SIZE) * TILE_SIZE - e.h;
          e.vy = 0;
        }
      }

      if (!e.beingInhaled) {
        e.x += e.vx;
        // Turn around at wall or pit edge
        const frontX = e.x + (e.vx < 0 ? 0 : e.w);
        if (
          this.getTile(frontX, e.y + 6) > 0 ||
          this.getTile(frontX, e.y + e.h + 2) === 0
        ) {
          e.vx *= -1;
          e.facing = e.vx > 0 ? 1 : -1;
        }
      }

      // Check collision with Kirby
      const hitKirby =
        k.x < e.x + e.w &&
        k.x + k.w > e.x &&
        k.y < e.y + e.h &&
        k.y + k.h > e.y;

      if (hitKirby) {
        if (k.state === 'sliding' || k.sparkTimer > 0) {
          // Slide kick or Spark shield annihilates enemy!
          e.alive = false;
          sound.play('hit');
          k.score += 300;
          this.callbacks.onScoreChange?.(k.score);

          for (let i = 0; i < 8; i++) {
            this.addParticle(
              e.x + 7,
              e.y + 7,
              (Math.random() - 0.5) * 4,
              -Math.random() * 3,
              '#ffe000',
              20,
              3,
              'star'
            );
          }
        } else if (k.invincibleTimer === 0 && k.hurtTimer === 0) {
          // Kirby takes damage!
          this.takeDamage(1);
          k.vx = (k.x < e.x ? -2.4 : 2.4);
          k.vy = -2.6;
        }
      }
    });

    // 8. Projectiles Update
    for (let idx = this.projectiles.length - 1; idx >= 0; idx--) {
      const p = this.projectiles[idx];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // Gravity for drop star
      if (p.type === 'drop_star') {
        p.vy = Math.min(p.vy + 0.18, 3.5);
        if (this.getTile(p.x + 6, p.y + p.h) > 0) {
          p.y = Math.floor((p.y + p.h) / TILE_SIZE) * TILE_SIZE - p.h;
          p.vy = -2.2; // Bounce
        }
        if (this.getTile(p.x, p.y + 4) > 0 || this.getTile(p.x + p.w, p.y + 4) > 0) {
          p.vx *= -1;
        }
      }

      // Break star blocks
      const tileAtP = this.getTile(p.x + p.w / 2, p.y + p.h / 2);
      if (tileAtP === 3) {
        this.breakBlock(p.x + p.w / 2, p.y + p.h / 2);
        if (p.type !== 'fire') p.life = 0;
      }

      // Hit enemies
      this.enemies.forEach(e => {
        if (
          e.alive &&
          p.x < e.x + e.w &&
          p.x + p.w > e.x &&
          p.y < e.y + e.h &&
          p.y + p.h > e.y
        ) {
          e.hp -= p.damage;
          if (e.hp <= 0) {
            e.alive = false;
            k.score += 250;
            this.callbacks.onScoreChange?.(k.score);
            sound.play('hit');
            for (let i = 0; i < 8; i++) {
              this.addParticle(
                e.x + 7,
                e.y + 7,
                (Math.random() - 0.5) * 3,
                -Math.random() * 2.5,
                '#ffffff',
                20,
                3,
                'star'
              );
            }
          }
          if (p.type !== 'fire') {
            p.life = 0;
          }
        }
      });

      if (p.life <= 0) {
        this.projectiles.splice(idx, 1);
      }
    }

    // 9. Items Update & Pickup
    this.items.forEach(it => {
      if (it.collected) return;
      const hitItem =
        k.x < it.x + it.w &&
        k.x + k.w > it.x &&
        k.y < it.y + it.h &&
        k.y + k.h > it.y;

      if (hitItem) {
        it.collected = true;
        this.stats.itemsCollected++;

        if (it.type === 'maxim_tomato') {
          k.hp = k.maxHp;
          k.score += 1000;
          sound.play('tomato');
          this.callbacks.onHpChange?.(k.hp, k.maxHp);
          this.callbacks.onScoreChange?.(k.score);
        } else if (it.type === 'star_point') {
          k.stars++;
          k.score += 100;
          sound.play('collect');
          if (k.stars >= 100) {
            k.stars -= 100;
            k.lives++;
            this.callbacks.onLivesChange?.(k.lives);
          }
          this.callbacks.onStarsChange?.(k.stars);
          this.callbacks.onScoreChange?.(k.score);
        }

        // Twinkle burst
        for (let i = 0; i < 8; i++) {
          this.addParticle(
            it.x + 6,
            it.y + 6,
            (Math.random() - 0.5) * 3,
            -Math.random() * 2,
            '#ffeb3b',
            20,
            3,
            'star'
          );
        }
      }
    });

    // 10. Goal Star Check (Tile 9)
    const goalTile =
      this.getTile(k.x + 7, k.y + 7) === 9 ||
      this.getTile(k.x + k.w, k.y + 7) === 9;

    if (goalTile && !this.isClear) {
      this.isClear = true;
      k.score += 5000;
      this.callbacks.onScoreChange?.(k.score);
      sound.play('victory');
      this.callbacks.onStageClear?.(this.currentStage.id, k.score);
    }

    this.updateParticles();
  }

  private takeDamage(amount: number) {
    const k = this.kirby;
    k.hp = Math.max(0, k.hp - amount);
    this.callbacks.onHpChange?.(k.hp, k.maxHp);
    sound.play('hit');

    // Drop current ability when hit!
    if (k.ability && amount < 900) {
      this.dropAbility();
    }

    if (k.hp <= 0) {
      k.lives--;
      this.callbacks.onLivesChange?.(k.lives);
      sound.play('game_over');

      if (k.lives <= 0) {
        this.isGameOver = true;
        this.callbacks.onGameOver?.(k.score);
      } else {
        // Respawn in stage
        k.hp = k.maxHp;
        k.x = 32;
        k.y = 140;
        k.vx = 0;
        k.vy = 0;
        k.state = 'normal';
        k.invincibleTimer = 90;
        this.callbacks.onHpChange?.(k.hp, k.maxHp);
      }
    } else {
      k.invincibleTimer = 50;
      k.hurtTimer = 15;
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- RENDERING ---
  public render() {
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factor from NES 256x224 to Canvas
    const scaleX = canvas.width / NES_WIDTH;
    const scaleY = canvas.height / NES_HEIGHT;
    ctx.scale(scaleX, scaleY);

    // Camera follow Kirby
    const k = this.kirby;
    const camX = Math.max(
      0,
      Math.min(k.x - NES_WIDTH / 2, this.mapWidth - NES_WIDTH)
    );
    ctx.translate(-Math.floor(camX), 0);

    // 1. Dreamland Sky Background
    this.renderBackground(camX);

    // 2. Tilemap Blocks
    this.renderTiles(camX);

    // 3. Items
    this.renderItems(camX);

    // 4. Enemies
    this.renderEnemies(camX);

    // 5. Kirby Player
    this.renderKirby();

    // 6. Projectiles
    this.renderProjectiles();

    // 7. Particles
    this.renderParticles();

    ctx.restore();

    // 8. HUD & Overlays
    this.renderHUD();
  }

  private renderBackground(camX: number) {
    const ctx = this.ctx;
    const isDreamFountain = this.currentStage.theme === 'dream_fountain';

    if (!isDreamFountain) {
      // Vegetable Valley Daytime Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, NES_HEIGHT);
      skyGrad.addColorStop(0, '#f8bad2');
      skyGrad.addColorStop(0.55, '#fde1db');
      skyGrad.addColorStop(1, '#ffebf7');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camX, 0, NES_WIDTH, NES_HEIGHT);

      // Fluffy clouds in background (parallax)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 24; i++) {
        const cx = i * 110 - (camX * 0.3) % 110;
        ctx.beginPath();
        ctx.arc(camX + cx, 36, 16, 0, Math.PI * 2);
        ctx.arc(camX + cx + 14, 32, 12, 0, Math.PI * 2);
        ctx.arc(camX + cx - 12, 34, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant rolling green hills
      ctx.fillStyle = '#a6ea72';
      ctx.beginPath();
      ctx.moveTo(camX, NES_HEIGHT - 38);
      for (let x = 0; x <= NES_WIDTH; x += 32) {
        ctx.quadraticCurveTo(
          camX + x + 16,
          NES_HEIGHT - 65,
          camX + x + 32,
          NES_HEIGHT - 38
        );
      }
      ctx.lineTo(camX + NES_WIDTH, NES_HEIGHT);
      ctx.lineTo(camX, NES_HEIGHT);
      ctx.fill();
    } else {
      // Fountain of Dreams Night Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, NES_HEIGHT);
      skyGrad.addColorStop(0, '#100b2e');
      skyGrad.addColorStop(0.6, '#281a52');
      skyGrad.addColorStop(1, '#4d2d78');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(camX, 0, NES_WIDTH, NES_HEIGHT);

      // Twinkling stars
      ctx.fillStyle = '#ffe699';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 47) % this.mapWidth);
        const sy = (i * 19) % 110 + 10;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Rainbow aurora beam
      const auroraGrad = ctx.createLinearGradient(0, 0, 0, 120);
      auroraGrad.addColorStop(0, 'rgba(0, 255, 200, 0.25)');
      auroraGrad.addColorStop(0.5, 'rgba(255, 100, 220, 0.2)');
      auroraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(camX, 0, NES_WIDTH, 120);
    }
  }

  private renderTiles(camX: number) {
    const ctx = this.ctx;
    const startCol = Math.floor(camX / TILE_SIZE);
    const endCol = Math.min(
      this.tiles[0].length - 1,
      Math.ceil((camX + NES_WIDTH) / TILE_SIZE)
    );

    for (let r = 0; r < this.tiles.length; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const t = this.tiles[r][c];
        const px = c * TILE_SIZE;
        const py = r * TILE_SIZE;

        if (t === 2) {
          // Lush grass block
          ctx.fillStyle = '#7ac900';
          ctx.fillRect(px, py, TILE_SIZE, 5);
          ctx.fillStyle = '#4c8a00';
          ctx.fillRect(px, py + 4, TILE_SIZE, 1);
          ctx.fillStyle = '#e29457';
          ctx.fillRect(px, py + 5, TILE_SIZE, TILE_SIZE - 5);
        } else if (t === 1) {
          // Underground dirt brick
          ctx.fillStyle = '#c7752e';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#9e5217';
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        } else if (t === 3) {
          // Breakable Star Block
          ctx.fillStyle = '#fdb813';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#f88c00';
          ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.fillText('★', px + 3, py + 12);
        } else if (t === 4) {
          // Cloud platform
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(px, py, TILE_SIZE, 10, 4);
          ctx.fill();
        } else if (t === 5) {
          // Dream Temple Marble block
          ctx.fillStyle = '#d3c9e8';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#9684b5';
          ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        } else if (t === 9) {
          // Goal Star / Warp Star
          const bob = Math.sin(Date.now() * 0.005) * 3;
          ctx.fillStyle = '#ffea00';
          ctx.font = '20px monospace';
          ctx.fillText('★', px - 2, py + 14 + bob);

          // Sparkles around goal
          if (Math.random() > 0.6) {
            this.addParticle(
              px + Math.random() * 16,
              py + Math.random() * 16 + bob,
              0,
              -0.5,
              '#ffffff',
              15,
              2,
              'star'
            );
          }
        }
      }
    }
  }

  private renderItems(camX: number) {
    const ctx = this.ctx;
    this.items.forEach(it => {
      if (it.collected) return;
      if (it.x + it.w < camX || it.x > camX + NES_WIDTH) return;

      if (it.type === 'maxim_tomato') {
        // Red tomato with "M"
        ctx.fillStyle = '#e52521';
        ctx.beginPath();
        ctx.arc(it.x + 6, it.y + 6, 6, 0, Math.PI * 2);
        ctx.fill();

        // Green leaves
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(it.x + 4, it.y - 1, 4, 3);

        // "M" symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('M', it.x + 3, it.y + 9);
      } else if (it.type === 'star_point') {
        const bob = Math.sin(Date.now() * 0.006 + it.x) * 2;
        ctx.fillStyle = '#ffd700';
        ctx.font = '12px monospace';
        ctx.fillText('★', it.x, it.y + 10 + bob);
      }
    });
  }

  private renderEnemies(camX: number) {
    const ctx = this.ctx;
    this.enemies.forEach(e => {
      if (!e.alive) return;
      if (e.x + e.w < camX || e.x > camX + NES_WIDTH) return;

      ctx.save();
      ctx.translate(e.x + 7, e.y + 7);
      if (e.facing === 1) ctx.scale(-1, 1);

      if (e.type === 'waddle_dee') {
        // Waddle Dee: Orange body, cream face, red shoes
        ctx.fillStyle = '#f85820';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#fce4b8';
        ctx.beginPath();
        ctx.ellipse(-1, 0, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, -2, 2, 4);

        // Feet
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-4, 5, 4, 3);
        ctx.fillRect(1, 5, 4, 3);
      } else if (e.type === 'hot_head') {
        // Hot Head: Red body, fire crest crown
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, 1, 6, 0, Math.PI * 2);
        ctx.fill();

        // Burning flame crown
        ctx.fillStyle = Math.random() > 0.5 ? '#ff4500' : '#ffb703';
        ctx.beginPath();
        ctx.moveTo(-4, -4);
        ctx.lineTo(0, -9);
        ctx.lineTo(4, -4);
        ctx.fill();

        // Goggles / visor
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-4, -1, 7, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-2, 0, 2, 2);
      } else if (e.type === 'sparky') {
        // Sparky: Green glowing bouncy jelly
        ctx.fillStyle = '#06d6a0';
        ctx.beginPath();
        ctx.roundRect(-5, -5, 10, 11, 4);
        ctx.fill();

        // Spark antenna
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-1, -8, 2, 4);
        ctx.fillRect(-3, -10, 6, 3);

        // Eyes
        ctx.fillStyle = '#073b4c';
        ctx.fillRect(-3, -2, 2, 4);
        ctx.fillRect(1, -2, 2, 4);
      } else if (e.type === 'blade_knight') {
        // Blade Knight: Green armored helm with silver visor, purple plume, sword
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-4, -2, 8, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-2, -1, 3, 2);

        // Helmet plume
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(-2, -10, 4, 5);

        // Sword blade
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-8, 0, 6, 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-3, -1, 2, 5);
      }

      ctx.restore();
    });
  }

  private renderKirby() {
    const k = this.kirby;
    const ctx = this.ctx;

    // Invincible blink (skip rendering on alternate frames)
    if (k.invincibleTimer > 0 && Math.floor(k.invincibleTimer / 3) % 2 === 1) {
      return;
    }

    ctx.save();
    ctx.translate(k.x + 7, k.y + 7);
    if (k.facing === -1) ctx.scale(-1, 1);

    // Bloated radius when floating or mouthful
    const radius =
      k.state === 'floating' || k.state === 'mouthful' ? 9.5 : 7.2;

    // Kirby Pink Body
    ctx.fillStyle = '#ff9ebb';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Red Feet
    ctx.fillStyle = '#e52521';
    if (k.state === 'sliding') {
      ctx.fillRect(-2, 4, 13, 3);
    } else {
      ctx.fillRect(-6, 5, 5, 3);
      ctx.fillRect(2, 5, 5, 3);
    }

    // Hands
    ctx.fillStyle = '#ff8cae';
    if (k.state === 'floating') {
      // Flapping hands
      ctx.beginPath();
      ctx.arc(-7, -1, 3, 0, Math.PI * 2);
      ctx.arc(7, -1, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-7, 2, 2.5, 0, Math.PI * 2);
      ctx.arc(7, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Facial features
    if (k.inhaleTimer > 0) {
      // Wide open vacuum mouth
      ctx.fillStyle = '#220011';
      ctx.beginPath();
      ctx.ellipse(3, 1, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Determined eyes
      ctx.fillStyle = '#003388';
      ctx.fillRect(1, -4, 2, 3);
    } else if (k.state === 'mouthful' || k.state === 'floating') {
      // Puffed cheeks, closed cute mouth
      ctx.fillStyle = '#003388';
      ctx.fillRect(2, -3, 2, 4); // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -3, 1, 2);

      // Pink blush
      ctx.fillStyle = '#ff6088';
      ctx.fillRect(1, 2, 4, 2);
      ctx.fillRect(-4, 2, 3, 2);
    } else {
      // Normal happy face
      ctx.fillStyle = '#003388';
      ctx.fillRect(2, -3, 2, 4); // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -3, 1, 2); // Eye shine

      // Cheerful smile
      ctx.fillStyle = '#6b0022';
      ctx.fillRect(2, 2, 2, 1);

      // Pink blush
      ctx.fillStyle = '#ff6088';
      ctx.fillRect(0, 2, 3, 2);
    }

    // --- COPY ABILITY HEADWEAR ---
    if (k.ability === 'FIRE') {
      // Fiery Crown of Flame
      ctx.fillStyle = '#ff2200';
      ctx.beginPath();
      ctx.moveTo(-6, -7);
      ctx.lineTo(0, -14);
      ctx.lineTo(6, -7);
      ctx.fill();

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.lineTo(0, -12);
      ctx.lineTo(3, -7);
      ctx.fill();
    } else if (k.ability === 'SPARK') {
      // Lightning Crown
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-4, -12, 8, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -15, 4, 4);
    } else if (k.ability === 'SWORD') {
      // Green Link-style pointed cap + sword
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(-6, -7);
      ctx.lineTo(2, -14);
      ctx.lineTo(7, -7);
      ctx.fill();

      // Sword in hand
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, -2, 7, 2);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(5, -4, 2, 6);
    }

    // Spark Active Shield Effect
    if (k.sparkTimer > 0) {
      ctx.strokeStyle = Math.random() > 0.5 ? '#00f7ff' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16 + Math.random() * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Electrical arcs
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
        const rad = 14 + Math.random() * 6;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.cos(a) * rad, Math.sin(a) * rad, 3, 3);
      }
    }

    ctx.restore();
  }

  private renderProjectiles() {
    const ctx = this.ctx;
    this.projectiles.forEach(p => {
      if (p.type === 'star' || p.type === 'drop_star') {
        const bob = p.type === 'drop_star' ? Math.sin(Date.now() * 0.01) * 2 : 0;
        ctx.fillStyle = '#ffea00';
        ctx.font = '14px monospace';
        ctx.fillText('★', p.x, p.y + 10 + bob);
      } else if (p.type === 'fire') {
        ctx.fillStyle = Math.random() > 0.5 ? '#ff3b30' : '#ff9500';
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y + 3, 3 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'air_puff') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(p.x + 4, p.y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sword_slash') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x + 8, p.y + 8, 10, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      } else if (p.type === 'sword_beam') {
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.ellipse(p.x + 5, p.y + 4, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  private renderParticles() {
    const ctx = this.ctx;
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      if (pt.shape === 'star') {
        ctx.font = `${pt.size * 2}px monospace`;
        ctx.fillText('★', pt.x, pt.y);
      } else if (pt.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      }
    });
  }

  private renderHUD() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const k = this.kirby;

    // Classic NES Kirby HUD Bottom Bar
    const barHeight = 44;
    const barY = canvas.height - barHeight;

    ctx.fillStyle = '#0a0910';
    ctx.fillRect(0, barY, canvas.width, barHeight);

    // Subtle gold trim border
    ctx.fillStyle = '#f3a6b2';
    ctx.fillRect(0, barY, canvas.width, 2);

    // Kirby life gauge
    ctx.fillStyle = '#ffb7c5';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('KIRBY', 16, barY + 18);

    // 6 health bars
    ctx.fillStyle = '#ffffff';
    ctx.fillText('LIFE', 84, barY + 18);
    for (let i = 0; i < k.maxHp; i++) {
      ctx.fillStyle = i < k.hp ? '#ef4444' : '#334155';
      ctx.fillRect(130 + i * 14, barY + 9, 10, 11);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(130 + i * 14, barY + 9, 10, 11);
    }

    // Ability Badge / Marquee
    const abilityName = k.ability
      ? ABILITY_INFO[k.ability].en
      : k.state === 'mouthful'
      ? 'FULL'
      : 'NORMAL';

    ctx.fillStyle = k.ability ? ABILITY_INFO[k.ability].color : '#ffd700';
    ctx.fillText(`ABILITY: [ ${abilityName} ]`, 230, barY + 18);

    // Score & Stars
    ctx.fillStyle = '#e2e8f0';
    const scoreStr = k.score.toString().padStart(6, '0');
    ctx.fillText(`SCORE:${scoreStr}`, 16, barY + 35);
    ctx.fillStyle = '#ffea00';
    ctx.fillText(`★ x ${k.stars}`, 230, barY + 35);
    ctx.fillStyle = '#f472b6';
    ctx.fillText(`LIVES:${k.lives}`, 320, barY + 35);

    // Stage Clear Overlay
    if (this.isClear) {
      ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffeb3b';
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★ STAGE CLEAR! ★', canvas.width / 2, canvas.height / 2 - 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(
        `SCORE: ${k.score}`,
        canvas.width / 2,
        canvas.height / 2 + 10
      );
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(
        '點擊「下一關」或按下 空白鍵 繼續',
        canvas.width / 2,
        canvas.height / 2 + 36
      );
      ctx.textAlign = 'left';
    }

    // Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(10, 8, 20, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ef4444';
      ctx.font = '22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(
        `FINAL SCORE: ${k.score}`,
        canvas.width / 2,
        canvas.height / 2 + 12
      );
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('點擊「重新開始」再次啟程', canvas.width / 2, canvas.height / 2 + 36);
      ctx.textAlign = 'left';
    }
  }

  // --- ENGINE LIFECYCLE ---
  public start() {
    if (this.animFrameId !== null) return;
    this.lastTime = performance.now();

    const loop = (timestamp: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      this.update();
      this.render();
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopInhaleSound();
  }
}
