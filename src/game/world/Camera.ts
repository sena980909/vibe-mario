export class Camera {
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;

  private minX = 0;
  private minY = 0;
  private maxX = 0;
  private maxY = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  follow(targetX: number, targetY: number, _dt: number): void {
    // Center on target
    let cx = targetX - this.width / 2;
    let cy = targetY - this.height / 2;

    // Clamp to bounds
    cx = Math.max(this.minX, Math.min(cx, this.maxX - this.width));
    cy = Math.max(this.minY, Math.min(cy, this.maxY - this.height));

    this.x = cx;
    this.y = cy;
  }

  isVisible(x: number, y: number, w: number, h: number): boolean {
    return (
      x + w > this.x &&
      x < this.x + this.width &&
      y + h > this.y &&
      y < this.y + this.height
    );
  }

  toScreenX(worldX: number): number {
    return worldX - this.x;
  }

  toScreenY(worldY: number): number {
    return worldY - this.y;
  }
}
