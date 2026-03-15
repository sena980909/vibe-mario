export class PauseMenu {
  draw(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Panel
    const panelW = 280;
    const panelH = 200;
    const px = (canvasW - panelW) / 2;
    const py = (canvasH - panelH) / 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 3;
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeRect(px, py, panelW, panelH);

    // Title
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvasW / 2, py + 50);

    // Instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('Press ESC to resume', canvasW / 2, py + 100);
    ctx.fillText('Arrow Keys / WASD: Move', canvasW / 2, py + 128);
    ctx.fillText('Space / W: Jump', canvasW / 2, py + 152);
    ctx.fillText('Z / X: Fire (Fire Mario)', canvasW / 2, py + 176);
  }
}
