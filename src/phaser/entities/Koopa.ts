export class Koopa extends Phaser.Physics.Arcade.Sprite {
  isDead = false;
  isShell = false;
  isSliding = false;
  private shellTimer = 0;
  private animTimer = 0;
  private animFrame = 0;
  private moveSpeed = 55;
  private shellSpeed = 280;
  isFlying: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, flying = false) {
    super(scene, x, y, 'koopa-walk1');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.isFlying = flying;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 30);
    body.setOffset(4, 2);
    body.setGravityY(0);
    body.setMaxVelocityY(500);
    body.setVelocityX(-this.moveSpeed);
    this.setDepth(5);

    if (flying) {
      body.setAllowGravity(false);
      this.setupFlyingPath(x, y);
    }
  }

  private flyStartY = 0;
  private flyTime = 0;

  private setupFlyingPath(_x: number, y: number): void {
    this.flyStartY = y;
    this.flyTime = 0;
  }

  update(delta: number): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.isFlying) {
      this.flyTime += delta * 0.002;
      this.y = this.flyStartY + Math.sin(this.flyTime) * 40;
      if (body.blocked.left) {
        body.setVelocityX(this.moveSpeed);
      } else if (body.blocked.right) {
        body.setVelocityX(-this.moveSpeed);
      }
      this.setFlipX(body.velocity.x > 0);
      this.animTimer += delta;
      if (this.animTimer > 200) {
        this.animTimer = 0;
        this.animFrame = this.animFrame === 0 ? 1 : 0;
        this.setTexture(this.animFrame === 0 ? 'koopa-walk1' : 'koopa-walk2');
      }
      return;
    }

    if (this.isShell) {
      this.shellTimer -= delta;
      if (this.shellTimer <= 0 && !this.isSliding) {
        // Wake up
        this.isShell = false;
        this.setTexture('koopa-walk1');
        body.setSize(24, 30);
        body.setOffset(4, 2);
        body.setVelocityX(-this.moveSpeed);
        body.checkCollision.none = false;
      }
      if (this.isSliding) {
        if (body.blocked.left) {
          body.setVelocityX(this.shellSpeed);
        } else if (body.blocked.right) {
          body.setVelocityX(-this.shellSpeed);
        }
      }
      return;
    }

    // Normal walking
    if (body.blocked.left) {
      body.setVelocityX(this.moveSpeed);
    } else if (body.blocked.right) {
      body.setVelocityX(-this.moveSpeed);
    }

    this.setFlipX(body.velocity.x > 0);

    this.animTimer += delta;
    if (this.animTimer > 200) {
      this.animTimer = 0;
      this.animFrame = this.animFrame === 0 ? 1 : 0;
      this.setTexture(this.animFrame === 0 ? 'koopa-walk1' : 'koopa-walk2');
    }
  }

  stomp(): void {
    if (this.isDead) return;

    if (this.isShell && !this.isSliding) {
      // Kick shell
      this.isSliding = true;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(this.shellSpeed);
      body.checkCollision.none = false;
      return;
    }

    if (this.isSliding) {
      // Stop shell
      this.isSliding = false;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
      this.shellTimer = 5000;
      return;
    }

    // Retract into shell
    this.isShell = true;
    this.isSliding = false;
    this.shellTimer = 5000;
    this.setTexture('koopa-shell');
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 22);
    body.setOffset(4, 8);
    body.setVelocityX(0);
    body.checkCollision.none = false;
  }

  kill(): void {
    if (this.isDead) return;
    this.isDead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(body.velocity.x > 0 ? 100 : -100, -200);
    body.checkCollision.none = true;
    this.scene.time.delayedCall(1000, () => this.destroy());
  }
}
