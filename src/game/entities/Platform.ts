export class Platform {
  x: number;
  y: number;
  width: number;
  height: number = 12;
  vx: number = 0;
  vy: number = 0;
  private startX: number;
  private startY: number;
  private moveX: number;
  private moveY: number;
  private rangeX: number;
  private rangeY: number;
  private dirX: number = 1;
  private dirY: number = 1;

  constructor(x: number, y: number, width: number, moveX: number, moveY: number, rangeX: number, rangeY: number) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = width;
    this.moveX = moveX;
    this.moveY = moveY;
    this.rangeX = rangeX;
    this.rangeY = rangeY;
  }

  update(dt: number): void {
    const speed = 80;

    if (this.moveX !== 0) {
      this.vx = this.dirX * speed;
      this.x += this.vx * dt;
      if (this.x > this.startX + this.rangeX) {
        this.x = this.startX + this.rangeX;
        this.dirX = -1;
      } else if (this.x < this.startX - this.rangeX) {
        this.x = this.startX - this.rangeX;
        this.dirX = 1;
      }
    } else {
      this.vx = 0;
    }

    if (this.moveY !== 0) {
      this.vy = this.dirY * speed;
      this.y += this.vy * dt;
      if (this.y > this.startY + this.rangeY) {
        this.y = this.startY + this.rangeY;
        this.dirY = -1;
      } else if (this.y < this.startY - this.rangeY) {
        this.y = this.startY - this.rangeY;
        this.dirY = 1;
      }
    } else {
      this.vy = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    ctx.fillStyle = '#cc6600';
    ctx.fillRect(x, y, this.width, this.height);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y + this.height - 4, this.width, 4);

    // Tile pattern
    const tileW = 32;
    for (let tx = x; tx < x + this.width; tx += tileW) {
      ctx.fillStyle = '#aa5500';
      ctx.fillRect(tx, y, Math.min(tileW, x + this.width - tx), 3);
    }
  }
}
