export class Mario extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private fireKey!: Phaser.Input.Keyboard.Key;

  powerLevel: 0 | 1 | 2 = 0; // 0=small, 1=super, 2=fire
  isDead = false;
  isInvincible = false;
  isInWarp = false;
  score = 0;
  lives = 3;
  coins = 0;

  private coyoteTimer = 0;
  private jumpBuffer = 0;
  private animTimer = 0;
  private animFrame = 0;
  private invincibleTimer = 0;
  private fireballCooldown = 0;
  private starTimer = 0;
  private isStar = false;

  onFireball?: (x: number, y: number, dir: number) => void;
  onScoreChange?: (score: number) => void;
  onCoinChange?: (coins: number) => void;
  onLivesChange?: (lives: number) => void;
  onPowerChange?: (power: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'mario-small-stand');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false);
    this.setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);
    body.setMaxVelocityY(500);
    this.updateBodySize();

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.jumpKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.fireKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  private updateBodySize(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.powerLevel === 0) {
      body.setSize(14, 14);
      body.setOffset(1, 2);
    } else {
      body.setSize(14, 28);
      body.setOffset(1, 4);
    }
  }

  update(delta: number): void {
    if (this.isDead || this.isInWarp) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const dt = delta / 1000;

    // Coyote time
    if (onGround) {
      this.coyoteTimer = 100;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // Jump buffer
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasdKeys.up) ||
      Phaser.Input.Keyboard.JustDown(this.jumpKey);

    if (jumpPressed) {
      this.jumpBuffer = 100;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);
    }

    // Horizontal movement
    const leftDown =
      this.cursors.left.isDown || this.wasdKeys.left.isDown;
    const rightDown =
      this.cursors.right.isDown || this.wasdKeys.right.isDown;

    const walkSpeed = 220;

    if (leftDown && !rightDown) {
      body.setVelocityX(-walkSpeed);
      this.setFlipX(true);
    } else if (rightDown && !leftDown) {
      body.setVelocityX(walkSpeed);
      this.setFlipX(false);
    } else {
      body.setVelocityX(body.velocity.x * 0.7);
      if (Math.abs(body.velocity.x) < 5) body.setVelocityX(0);
    }

    // Jump
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      body.setVelocityY(-480);
      this.jumpBuffer = 0;
      this.coyoteTimer = 0;
    }

    // Variable jump height - reduce upward velocity when jump key released
    const jumpHeld =
      this.cursors.up.isDown ||
      this.wasdKeys.up.isDown ||
      this.jumpKey.isDown;

    if (!jumpHeld && body.velocity.y < -200) {
      body.setVelocityY(body.velocity.y + 30);
    }

    // Fireball
    this.fireballCooldown = Math.max(0, this.fireballCooldown - delta);
    if (
      this.powerLevel === 2 &&
      Phaser.Input.Keyboard.JustDown(this.fireKey) &&
      this.fireballCooldown <= 0
    ) {
      const dir = this.flipX ? -1 : 1;
      const fbX = this.x + dir * 12;
      const fbY = this.y;
      if (this.onFireball) this.onFireball(fbX, fbY, dir);
      this.fireballCooldown = 400;
    }

    // Star timer
    if (this.isStar) {
      this.starTimer = Math.max(0, this.starTimer - delta);
      if (this.starTimer <= 0) {
        this.isStar = false;
        this.clearTint();
      }
    }

    // Invincibility timer
    if (this.isInvincible && !this.isStar) {
      this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);
      // Flicker
      this.setVisible(Math.floor(this.invincibleTimer / 100) % 2 === 0);
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.setVisible(true);
      }
    }

    // Animations
    this.updateAnimation(dt, onGround, body.velocity.x);
  }

  private updateAnimation(
    _dt: number,
    onGround: boolean,
    velX: number
  ): void {
    const prefix =
      this.powerLevel === 0 ? 'mario-small' : 'mario-super';

    if (!onGround) {
      this.setTexture(`${prefix}-jump`);
    } else if (Math.abs(velX) > 5) {
      this.animTimer += 1;
      if (this.animTimer > 6) {
        this.animTimer = 0;
        this.animFrame = this.animFrame === 0 ? 1 : 0;
      }
      const frame = this.animFrame === 0 ? 'walk1' : 'walk2';
      this.setTexture(`${prefix}-${frame}`);
    } else {
      this.setTexture(`${prefix}-stand`);
    }
  }

  growToSuper(): void {
    if (this.powerLevel < 1) {
      this.powerLevel = 1;
      this.updateBodySize();
      this.setOrigin(0.5, 1);
      this.onPowerChange?.(this.powerLevel);
    }
  }

  growToFire(): void {
    if (this.powerLevel < 2) {
      this.powerLevel = 2;
      this.updateBodySize();
      this.setOrigin(0.5, 1);
      this.onPowerChange?.(this.powerLevel);
    }
  }

  activateStar(): void {
    this.isStar = true;
    this.isInvincible = true;
    this.starTimer = 10000;
    this.setTint(0xffff00);
  }

  hurt(): void {
    if (this.isDead || this.isInvincible || this.isStar) return;

    if (this.powerLevel > 0) {
      this.powerLevel = 0;
      this.updateBodySize();
      this.setOrigin(0.5, 1);
      this.onPowerChange?.(this.powerLevel);
      this.isInvincible = true;
      this.invincibleTimer = 2000;
    } else {
      this.die();
    }
  }

  die(): void {
    if (this.isDead) return;
    this.isDead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -400);
    body.setGravityY(200);
    body.setAllowGravity(true);
    body.checkCollision.none = true;
    this.setTexture('mario-small-stand');
    this.lives--;
    this.onLivesChange?.(this.lives);
  }

  addScore(points: number): void {
    this.score += points;
    this.onScoreChange?.(this.score);
  }

  addCoin(): void {
    this.coins++;
    this.score += 200;
    this.onScoreChange?.(this.score);
    this.onCoinChange?.(this.coins);
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++;
      this.onLivesChange?.(this.lives);
      this.onCoinChange?.(this.coins);
    }
  }

  isStarPower(): boolean {
    return this.isStar;
  }
}
