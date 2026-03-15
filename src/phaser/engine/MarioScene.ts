import { Mario } from '../entities/Mario';
import { Goomba } from '../entities/Goomba';
import { Koopa } from '../entities/Koopa';
import { Coin } from '../entities/Coin';
import { PowerUp } from '../entities/PowerUp';
import type { PowerUpType } from '../entities/PowerUp';
import { Fireball } from '../entities/Fireball';
import { AudioManager } from './AudioManager';
import type { LevelData, EntityConfig } from '../types/LevelData';

// Tile ID constants
const TILE_EMPTY = 0;
const TILE_GROUND = 1;
const TILE_BRICK = 2;
const TILE_QUESTION = 3;
const TILE_USED = 4;
const TILE_PIPE_TL = 5;
const TILE_PIPE_TR = 6;
const TILE_PIPE_BL = 7;
const TILE_PIPE_BR = 8;
const TILE_FLAG_POLE = 9;
const TILE_PLATFORM = 10;

const TILE_TEXTURES: Record<number, string> = {
  [TILE_GROUND]: 'ground',
  [TILE_BRICK]: 'brick',
  [TILE_QUESTION]: 'question',
  [TILE_USED]: 'used-block',
  [TILE_PIPE_TL]: 'pipe-tl',
  [TILE_PIPE_TR]: 'pipe-tr',
  [TILE_PIPE_BL]: 'pipe-bl',
  [TILE_PIPE_BR]: 'pipe-br',
  [TILE_FLAG_POLE]: 'flag-pole',
  [TILE_PLATFORM]: 'platform',
};

const SOLID_TILES = new Set([
  TILE_GROUND, TILE_BRICK, TILE_QUESTION, TILE_USED,
  TILE_PIPE_TL, TILE_PIPE_TR, TILE_PIPE_BL, TILE_PIPE_BR,
]);

interface QuestionBlockData {
  sprite: Phaser.Physics.Arcade.Image;
  col: number;
  row: number;
  hasItem: boolean;
  itemType: PowerUpType | 'coin' | null;
}

interface MovingPlatformData {
  sprites: Phaser.Physics.Arcade.Image[];
  body: Phaser.Physics.Arcade.StaticBody;
  axis: 'x' | 'y';
  startX: number;
  startY: number;
  rangePx: number;
  speed: number;
  dir: number;
  progress: number;
}

export class MarioScene extends Phaser.Scene {
  private mario!: Mario;
  private levelData!: LevelData;
  private levelId = 1;

  private groundGroup!: Phaser.Physics.Arcade.StaticGroup;
  private brickGroup!: Phaser.Physics.Arcade.StaticGroup;
  private questionBlocks: QuestionBlockData[] = [];
  private pipeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private platformGroup!: Phaser.Physics.Arcade.StaticGroup;
  private flagPoleGroup!: Phaser.Physics.Arcade.StaticGroup;

  private enemies!: Phaser.GameObjects.Group;
  private coins!: Phaser.GameObjects.Group;
  private powerUps!: Phaser.GameObjects.Group;
  private fireballs!: Phaser.GameObjects.Group;
  private movingPlatforms: MovingPlatformData[] = [];

  private audio!: AudioManager;
  private timeLeft = 400;
  private levelComplete = false;
  private gameOverTriggered = false;
  private flag!: Phaser.GameObjects.Image;
  private flagEndY = 0;

  constructor() {
    super({ key: 'MarioScene' });
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 1;
    this.levelComplete = false;
    this.gameOverTriggered = false;
    this.movingPlatforms = [];
    this.questionBlocks = [];
  }

  create(): void {
    this.audio = new AudioManager();

    // Load level data
    const key = `level${this.levelId}`;
    this.levelData = this.cache.json.get(key) as LevelData;

    if (!this.levelData) {
      console.error(`Level data not found for key: ${key}`);
      return;
    }

    this.timeLeft = this.levelData.timeLimit;
    const levelWidth = this.levelData.widthTiles * 32;
    const levelHeight = this.levelData.heightTiles * 32;

    // World bounds
    this.physics.world.setBounds(0, 0, levelWidth, levelHeight + 200);
    this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);

    // Setup background
    this.createBackground(levelWidth, levelHeight);

    // Setup physics groups
    this.groundGroup = this.physics.add.staticGroup();
    this.brickGroup = this.physics.add.staticGroup();
    this.pipeGroup = this.physics.add.staticGroup();
    this.platformGroup = this.physics.add.staticGroup();
    this.flagPoleGroup = this.physics.add.staticGroup();

    // Build tiles
    this.buildTiles();

    // Moving platforms
    this.buildMovingPlatforms();

    // Create entity groups
    this.enemies = this.add.group();
    this.coins = this.add.group();
    this.powerUps = this.add.group();
    this.fireballs = this.add.group();

    // Spawn entities
    this.spawnEntities();

    // Create Mario
    const startX = this.levelData.playerStartTileX * 32 + 16;
    const startY = this.levelData.playerStartTileY * 32 + 16;
    this.mario = new Mario(this, startX, startY);
    this.mario.setOrigin(0.5, 1);

    // Set up Mario callbacks
    this.mario.onFireball = (x, y, dir) => this.spawnFireball(x, y, dir);
    this.mario.onScoreChange = (score) => this.events.emit('score-update', score);
    this.mario.onCoinChange = (coins) => this.events.emit('coins-update', coins);
    this.mario.onLivesChange = (lives) => this.events.emit('lives-update', lives);
    this.mario.onPowerChange = (power) => this.events.emit('power-update', power);

    // Camera follows Mario
    this.cameras.main.startFollow(this.mario, true, 0.1, 0.1);

    // Setup colliders
    this.setupColliders();

    // Flag
    this.createFlag();

    // Emit initial state
    this.events.emit('world-update', this.levelData.name.replace('World ', ''));
    this.events.emit('score-update', this.mario.score);
    this.events.emit('coins-update', this.mario.coins);
    this.events.emit('lives-update', this.mario.lives);
    this.events.emit('time-update', this.timeLeft);
    this.events.emit('power-update', this.mario.powerLevel);

    // Listen for mute toggle
    this.events.on('toggle-mute', (muted: boolean) => {
      this.audio.setMuted(muted);
    });
  }

  private createBackground(levelWidth: number, levelHeight: number): void {
    const bgKey =
      this.levelData.background === 'sky' ? 'sky-bg' : 'underground-bg';

    // Tile background
    for (let x = 0; x < levelWidth; x += 800) {
      this.add.image(x + 400, levelHeight / 2, bgKey).setDepth(-10);
    }

    if (this.levelData.background === 'sky') {
      // Clouds
      const cloudPositions = [
        { x: 200, y: 60 }, { x: 500, y: 40 }, { x: 900, y: 70 },
        { x: 1300, y: 50 }, { x: 1700, y: 65 }, { x: 2100, y: 45 },
        { x: 2500, y: 70 }, { x: 2900, y: 55 }, { x: 3300, y: 60 },
      ];
      for (const pos of cloudPositions) {
        this.add.image(pos.x, pos.y, 'cloud').setDepth(-5).setScrollFactor(0.5);
      }
      // Hills
      const hillPositions = [120, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200];
      for (const x of hillPositions) {
        this.add.image(x, levelHeight - 32, 'hill').setDepth(-5).setScrollFactor(0.8);
      }
      // Bushes
      const bushPositions = [300, 700, 1000, 1400, 1800, 2200, 2600, 3000];
      for (const x of bushPositions) {
        this.add.image(x, levelHeight - 30, 'bush').setDepth(-4).setScrollFactor(0.9);
      }
    }
  }

  private buildTiles(): void {
    const { tiles, widthTiles, heightTiles, tileSize } = this.levelData;

    for (let row = 0; row < heightTiles; row++) {
      for (let col = 0; col < widthTiles; col++) {
        const tileId = tiles[row]?.[col] ?? 0;
        if (tileId === TILE_EMPTY) continue;

        const x = col * tileSize + tileSize / 2;
        const y = row * tileSize + tileSize / 2;
        const textureKey = TILE_TEXTURES[tileId];

        if (!textureKey) continue;

        if (tileId === TILE_QUESTION) {
          const sprite = this.physics.add.image(x, y, textureKey)
            .setImmovable(true) as Phaser.Physics.Arcade.Image;
          (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
          // Decide what's inside
          let itemType: PowerUpType | 'coin' | null = 'coin';
          // Some question blocks have power ups - set by entity placement
          this.questionBlocks.push({
            sprite,
            col,
            row,
            hasItem: true,
            itemType,
          });
        } else if (tileId === TILE_BRICK) {
          const sprite = this.brickGroup.create(x, y, textureKey) as Phaser.Physics.Arcade.Image;
          (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        } else if (tileId === TILE_FLAG_POLE) {
          const sprite = this.flagPoleGroup.create(x, y, textureKey) as Phaser.Physics.Arcade.Image;
          (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        } else if (tileId === TILE_PIPE_TL || tileId === TILE_PIPE_TR ||
                   tileId === TILE_PIPE_BL || tileId === TILE_PIPE_BR) {
          const sprite = this.pipeGroup.create(x, y, textureKey) as Phaser.Physics.Arcade.Image;
          (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        } else if (tileId === TILE_PLATFORM) {
          const sprite = this.platformGroup.create(x, y, textureKey) as Phaser.Physics.Arcade.Image;
          (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        } else if (SOLID_TILES.has(tileId)) {
          const sprite = this.groundGroup.create(x, y, textureKey) as Phaser.Physics.Arcade.Image;
          (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        }
      }
    }
  }

  private buildMovingPlatforms(): void {
    for (const mpConfig of this.levelData.movingPlatforms) {
      const startX = mpConfig.tileX * 32;
      const startY = mpConfig.tileY * 32;
      const rangePx = mpConfig.rangeTiles * 32;
      const sprites: Phaser.Physics.Arcade.Image[] = [];

      for (let i = 0; i < mpConfig.widthTiles; i++) {
        const sx = startX + i * 32 + 16;
        const sy = startY + 16;
        const sp = this.physics.add.image(sx, sy, 'platform') as Phaser.Physics.Arcade.Image;
        sp.setImmovable(true);
        (sp.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        sprites.push(sp);
      }

      this.movingPlatforms.push({
        sprites,
        body: sprites[0].body as Phaser.Physics.Arcade.StaticBody,
        axis: mpConfig.axis,
        startX,
        startY,
        rangePx,
        speed: mpConfig.speed,
        dir: 1,
        progress: 0,
      });
    }
  }

  private spawnEntities(): void {
    for (const entity of this.levelData.entities) {
      this.spawnEntity(entity);
    }
  }

  private spawnEntity(entity: EntityConfig): void {
    const x = entity.tileX * 32 + 16;
    const y = entity.tileY * 32 + 16;

    switch (entity.type) {
      case 'goomba': {
        const g = new Goomba(this, x, y);
        this.enemies.add(g);
        break;
      }
      case 'koopa': {
        const k = new Koopa(this, x, y, false);
        this.enemies.add(k);
        break;
      }
      case 'flying-koopa': {
        const fk = new Koopa(this, x, y, true);
        this.enemies.add(fk);
        break;
      }
      case 'coin': {
        const c = new Coin(this, x, y);
        this.coins.add(c);
        break;
      }
      case 'mushroom': {
        const pu = new PowerUp(this, x, y, 'mushroom');
        this.powerUps.add(pu);
        break;
      }
      case 'fireflower': {
        const ff = new PowerUp(this, x, y, 'fireflower');
        this.powerUps.add(ff);
        break;
      }
      case 'star': {
        const st = new PowerUp(this, x, y, 'star');
        this.powerUps.add(st);
        break;
      }
    }
  }

  private createFlag(): void {
    const flagX = this.levelData.flagTileX * 32 + 16;
    const topY = 5 * 32 + 8;
    const bottomY = 12 * 32;

    this.flag = this.add.image(flagX - 8, topY, 'flag');
    this.flag.setOrigin(0, 0);
    this.flag.setDepth(3);
    this.flagEndY = bottomY;
  }

  private setupColliders(): void {
    const questionSprites = this.questionBlocks.map((qb) => qb.sprite);
    const questionGroup = this.physics.add.staticGroup(questionSprites);

    // Mario vs ground
    this.physics.add.collider(this.mario, this.groundGroup);
    this.physics.add.collider(this.mario, this.brickGroup, this.handleBrickHit, undefined, this);
    this.physics.add.collider(this.mario, questionGroup, this.handleQuestionHit, undefined, this);
    this.physics.add.collider(this.mario, this.pipeGroup);
    this.physics.add.collider(this.mario, this.platformGroup);
    this.physics.add.collider(this.mario, this.flagPoleGroup);

    // Moving platforms
    for (const mp of this.movingPlatforms) {
      for (const sp of mp.sprites) {
        this.physics.add.collider(this.mario, sp);
      }
    }

    // Enemies vs ground
    this.physics.add.collider(this.enemies, this.groundGroup);
    this.physics.add.collider(this.enemies, this.pipeGroup);
    this.physics.add.collider(this.enemies, this.brickGroup);
    this.physics.add.collider(this.enemies, questionGroup);
    this.physics.add.collider(this.enemies, this.platformGroup);

    // Enemies bounce off each other
    this.physics.add.collider(this.enemies, this.enemies);

    // Mario vs enemies
    this.physics.add.overlap(
      this.mario,
      this.enemies,
      this.handleMarioEnemyOverlap,
      undefined,
      this
    );

    // Mario vs coins
    this.physics.add.overlap(
      this.mario,
      this.coins,
      this.handleMarioCoinOverlap,
      undefined,
      this
    );

    // Mario vs power ups
    this.physics.add.overlap(
      this.mario,
      this.powerUps,
      this.handleMarioPowerUpOverlap,
      undefined,
      this
    );

    // Mario vs flag pole
    this.physics.add.overlap(
      this.mario,
      this.flagPoleGroup,
      this.handleFlagPoleOverlap,
      undefined,
      this
    );

    // Fireballs vs enemies
    this.physics.add.overlap(
      this.fireballs,
      this.enemies,
      this.handleFireballEnemyOverlap,
      undefined,
      this
    );

    // Fireballs vs ground
    this.physics.add.collider(this.fireballs, this.groundGroup);
    this.physics.add.collider(this.fireballs, this.pipeGroup);
  }

  private handleBrickHit = (
    mario: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    brick: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void => {
    const marioBody = (mario as Mario).body as Phaser.Physics.Arcade.Body;
    const brickSprite = brick as Phaser.Physics.Arcade.Image;

    if (marioBody.velocity.y < 0 && marioBody.y < brickSprite.y) {
      if (this.mario.powerLevel > 0) {
        // Break brick
        this.audio.playBrickBreak();
        this.mario.addScore(50);
        // Particle effect
        this.createBrickParticles(brickSprite.x, brickSprite.y);
        brickSprite.destroy();
      } else {
        // Bump brick
        this.audio.playBlockHit();
        this.bumpBlock(brickSprite);
      }
    }
  };

  private handleQuestionHit = (
    mario: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    block: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void => {
    const marioBody = (mario as Mario).body as Phaser.Physics.Arcade.Body;
    const blockSprite = block as Phaser.Physics.Arcade.Image;

    if (marioBody.velocity.y < 0 && marioBody.y < blockSprite.y) {
      const qb = this.questionBlocks.find((q) => q.sprite === blockSprite);
      if (!qb || !qb.hasItem) return;

      qb.hasItem = false;
      qb.sprite.setTexture('used-block');
      this.audio.playBlockHit();
      this.bumpBlock(blockSprite);

      // Spawn item
      if (qb.itemType === 'coin') {
        this.mario.addCoin();
        this.audio.playCoin();
        // Coin pop animation
        const coinAnim = this.add.image(blockSprite.x, blockSprite.y - 16, 'coin');
        coinAnim.setDepth(15);
        this.tweens.add({
          targets: coinAnim,
          y: blockSprite.y - 64,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => coinAnim.destroy(),
        });
      } else if (qb.itemType) {
        const pu = new PowerUp(this, blockSprite.x, blockSprite.y - 32, qb.itemType);
        this.powerUps.add(pu);
        this.physics.add.collider(pu, this.groundGroup);
        this.physics.add.collider(pu, this.pipeGroup);
        this.physics.add.collider(pu, this.brickGroup);
        this.physics.add.overlap(this.mario, pu, this.handleMarioPowerUpOverlap, undefined, this);
      }
    }
  };

  private bumpBlock(sprite: Phaser.Physics.Arcade.Image): void {
    const originalY = sprite.y;
    this.tweens.add({
      targets: sprite,
      y: originalY - 8,
      duration: 80,
      yoyo: true,
      ease: 'Power1',
    });
  }

  private createBrickParticles(x: number, y: number): void {
    const colors = [0xc84b0c, 0xe05a1a, 0x8b3a10];
    for (let i = 0; i < 6; i++) {
      const piece = this.add.rectangle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-4, 4),
        8, 8,
        colors[i % colors.length]
      );
      piece.setDepth(20);
      this.tweens.add({
        targets: piece,
        x: piece.x + Phaser.Math.Between(-60, 60),
        y: piece.y - Phaser.Math.Between(40, 100),
        rotation: Phaser.Math.FloatBetween(-3, 3),
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => piece.destroy(),
      });
    }
  }

  private handleMarioEnemyOverlap = (
    marioObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void => {
    const mario = marioObj as Mario;
    const marioBody = mario.body as Phaser.Physics.Arcade.Body;

    if (mario.isDead || mario.isInWarp) return;

    if (enemyObj instanceof Goomba) {
      const goomba = enemyObj as Goomba;
      if (goomba.isDead) return;

      if (mario.isStarPower()) {
        goomba.kill();
        mario.addScore(200);
        this.audio.playEnemyStomp();
        return;
      }

      // Stomp check: mario falling, center above enemy center
      if (marioBody.velocity.y > 0 && mario.y < goomba.y) {
        goomba.stomp();
        mario.addScore(100);
        marioBody.setVelocityY(-280);
        this.audio.playEnemyStomp();
      } else {
        mario.hurt();
        this.audio.playDead();
      }
    } else if (enemyObj instanceof Koopa) {
      const koopa = enemyObj as Koopa;
      if (koopa.isDead) return;

      if (mario.isStarPower()) {
        koopa.kill();
        mario.addScore(200);
        this.audio.playEnemyStomp();
        return;
      }

      if (marioBody.velocity.y > 0 && mario.y < koopa.y) {
        koopa.stomp();
        mario.addScore(100);
        marioBody.setVelocityY(-280);
        this.audio.playEnemyStomp();
      } else if (!koopa.isShell || koopa.isSliding) {
        mario.hurt();
        this.audio.playDead();
      }
    }
  };

  private handleMarioCoinOverlap = (
    _mario: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    coinObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void => {
    const coin = coinObj as Coin;
    if (coin.isCollected) return;
    coin.collect();
    this.mario.addCoin();
    this.audio.playCoin();
  };

  private handleMarioPowerUpOverlap = (
    _mario: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    puObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void => {
    const pu = puObj as PowerUp;
    if (pu.isCollected) return;
    pu.collect();
    this.audio.playPowerUp();

    switch (pu.powerType) {
      case 'mushroom':
        this.mario.growToSuper();
        this.mario.addScore(1000);
        break;
      case 'fireflower':
        this.mario.growToFire();
        this.mario.addScore(1000);
        break;
      case 'star':
        this.mario.activateStar();
        this.mario.addScore(1000);
        this.audio.playStarMusic();
        break;
    }
  };

  private handleFlagPoleOverlap = (
    _mario: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    _pole: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void => {
    if (this.levelComplete) return;
    this.triggerLevelComplete();
  };

  private handleFireballEnemyOverlap = (
    fbObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ): void => {
    const fb = fbObj as Fireball;
    if (fb.isDead) return;

    if (enemyObj instanceof Goomba) {
      const g = enemyObj as Goomba;
      if (!g.isDead) { g.kill(); this.mario.addScore(200); }
    } else if (enemyObj instanceof Koopa) {
      const k = enemyObj as Koopa;
      if (!k.isDead) { k.kill(); this.mario.addScore(200); }
    }
    fb.hitEnemy();
    this.audio.playEnemyStomp();
  };

  private spawnFireball(x: number, y: number, dir: number): void {
    const fb = new Fireball(this, x, y, dir);
    this.fireballs.add(fb);
    this.physics.add.collider(fb, this.groundGroup);
    this.physics.add.collider(fb, this.pipeGroup);
    this.physics.add.collider(fb, this.brickGroup);
    this.physics.add.overlap(fb, this.enemies, this.handleFireballEnemyOverlap, undefined, this);
    this.audio.playFireball();
  }

  private triggerLevelComplete(): void {
    this.levelComplete = true;
    this.mario.isInWarp = true;

    const marioBody = this.mario.body as Phaser.Physics.Arcade.Body;
    marioBody.setVelocityX(0);
    marioBody.setVelocityY(0);

    this.audio.playFlagpole();
    this.events.emit('level-complete');

    // Slide flag down
    this.tweens.add({
      targets: this.flag,
      y: this.flagEndY,
      duration: 1000,
      ease: 'Linear',
    });

    // Time bonus
    const timeBonus = Math.ceil(this.timeLeft) * 50;
    this.mario.addScore(timeBonus);

    // Next level or back to menu
    this.time.delayedCall(3000, () => {
      const nextLevel = this.levelId + 1;
      if (this.cache.json.exists(`level${nextLevel}`)) {
        this.scene.stop('UIScene');
        this.scene.restart({ levelId: nextLevel });
        this.scene.launch('UIScene');
      } else {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      }
    });
  }

  private checkWarps(): void {
    if (this.mario.isInWarp) return;
    const marioTileX = Math.floor(this.mario.x / 32);
    const marioTileY = Math.floor(this.mario.y / 32);

    for (const warp of this.levelData.warps) {
      if (
        Math.abs(marioTileX - warp.srcTileX) <= 1 &&
        Math.abs(marioTileY - warp.srcTileY) <= 1
      ) {
        const down =
          this.input.keyboard!.checkDown(
            this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
          ) ||
          this.input.keyboard!.checkDown(
            this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
          );
        if (down) {
          this.mario.isInWarp = true;
          this.time.delayedCall(500, () => {
            const score = this.mario.score;
            const lives = this.mario.lives;
            const coins = this.mario.coins;
            const power = this.mario.powerLevel;
            this.scene.stop('UIScene');
            this.scene.restart({ levelId: warp.destLevel });
            this.scene.launch('UIScene');
            // Restore state after restart
            this.time.delayedCall(100, () => {
              if (this.mario) {
                this.mario.score = score;
                this.mario.lives = lives;
                this.mario.coins = coins;
                this.mario.powerLevel = power;
              }
            });
          });
        }
        break;
      }
    }
  }

  private updateMovingPlatforms(delta: number): void {
    for (const mp of this.movingPlatforms) {
      const dt = delta / 1000;
      mp.progress += mp.dir * mp.speed * dt;

      if (mp.progress >= mp.rangePx) {
        mp.progress = mp.rangePx;
        mp.dir = -1;
      } else if (mp.progress <= 0) {
        mp.progress = 0;
        mp.dir = 1;
      }

      const offsetX = mp.axis === 'x' ? mp.progress : 0;
      const offsetY = mp.axis === 'y' ? mp.progress : 0;

      for (let i = 0; i < mp.sprites.length; i++) {
        const sp = mp.sprites[i];
        sp.x = mp.startX + i * 32 + 16 + offsetX;
        sp.y = mp.startY + 16 + offsetY;
        (sp.body as Phaser.Physics.Arcade.StaticBody).reset(sp.x, sp.y);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (!this.mario) return;

    // Update mario
    this.mario.update(delta);

    // Update enemies
    const enemyChildren = this.enemies.getChildren();
    for (const child of enemyChildren) {
      if (child instanceof Goomba) {
        child.update(delta);
      } else if (child instanceof Koopa) {
        child.update(delta);
      }
    }

    // Update coins
    const coinChildren = this.coins.getChildren();
    for (const child of coinChildren) {
      if (child instanceof Coin) {
        child.update(delta);
      }
    }

    // Update power ups
    const puChildren = this.powerUps.getChildren();
    for (const child of puChildren) {
      if (child instanceof PowerUp) {
        child.update(delta);
      }
    }

    // Update fireballs
    const fbChildren = this.fireballs.getChildren();
    for (const child of fbChildren) {
      if (child instanceof Fireball) {
        child.update(delta);
      }
    }

    // Update moving platforms
    this.updateMovingPlatforms(delta);

    // Timer
    if (!this.levelComplete && !this.mario.isDead) {
      this.timeLeft -= delta / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.mario.die();
      }
      this.events.emit('time-update', this.timeLeft);
    }

    // Check warps
    this.checkWarps();

    // Check if Mario fell off level
    if (this.mario.y > this.levelData.heightTiles * 32 + 100 && !this.mario.isDead) {
      this.mario.die();
    }

    // Handle death / game over
    if (this.mario.isDead && !this.gameOverTriggered) {
      const marioBody = this.mario.body as Phaser.Physics.Arcade.Body;
      // Wait until mario has fallen off screen
      if (this.mario.y > this.levelData.heightTiles * 32 + 200 ||
          marioBody.velocity.y === 0) {
        this.gameOverTriggered = true;
        if (this.mario.lives <= 0) {
          this.time.delayedCall(1000, () => {
            this.events.emit('game-over');
          });
        } else {
          this.time.delayedCall(2000, () => {
            this.scene.stop('UIScene');
            this.scene.restart({ levelId: this.levelId });
            this.scene.launch('UIScene');
          });
        }
      }
    }
  }
}
