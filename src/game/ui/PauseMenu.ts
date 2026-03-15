export class PauseMenu {
  private volumeLevel = 0.5;
  private isDraggingSlider = false;

  // Returns panel dimensions for hit-testing
  private getPanelRect(canvasW: number, canvasH: number) {
    const panelW = 300;
    const panelH = 280;
    const px = (canvasW - panelW) / 2;
    const py = (canvasH - panelH) / 2;
    return { px, py, panelW, panelH };
  }

  draw(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const { px, py, panelW, panelH } = this.getPanelRect(canvasW, canvasH);

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
    ctx.fillText('PAUSED', canvasW / 2, py + 42);

    // Instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px monospace';
    ctx.fillText('Arrow Keys / WASD: Move', canvasW / 2, py + 82);
    ctx.fillText('Space / W / Up: Jump', canvasW / 2, py + 100);
    ctx.fillText('Z / X: Fire (Fire Mario)', canvasW / 2, py + 118);

    // Volume label
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('VOLUME', canvasW / 2, py + 148);

    // Volume slider background
    const sliderX = px + 30;
    const sliderY = py + 162;
    const sliderW = panelW - 60;
    const sliderH = 12;

    ctx.fillStyle = '#333355';
    ctx.fillRect(sliderX, sliderY, sliderW, sliderH);

    // Filled portion
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(sliderX, sliderY, sliderW * this.volumeLevel, sliderH);

    // Slider border
    ctx.strokeStyle = '#8888aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(sliderX, sliderY, sliderW, sliderH);

    // Slider handle
    const handleX = sliderX + sliderW * this.volumeLevel;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(handleX, sliderY + sliderH / 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Volume percentage text
    ctx.fillStyle = '#aaaacc';
    ctx.font = '12px monospace';
    ctx.fillText(`${Math.round(this.volumeLevel * 100)}%`, canvasW / 2, py + 186);

    // Resume button
    const resumeBtnY = py + 214;
    ctx.fillStyle = '#226622';
    ctx.fillRect(px + 30, resumeBtnY, panelW - 60, 28);
    ctx.strokeStyle = '#44aa44';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 30, resumeBtnY, panelW - 60, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('RESUME  (ESC)', canvasW / 2, resumeBtnY + 14);

    // Menu button
    const menuBtnY = py + 248;
    ctx.fillStyle = '#662222';
    ctx.fillRect(px + 30, menuBtnY, panelW - 60, 24);
    ctx.strokeStyle = '#aa4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 30, menuBtnY, panelW - 60, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('QUIT TO MENU', canvasW / 2, menuBtnY + 12);
  }

  handleClick(x: number, y: number, canvasW: number, canvasH: number): 'resume' | 'menu' | null {
    const { px, py, panelW, panelH } = this.getPanelRect(canvasW, canvasH);
    void panelH;

    // Resume button
    const resumeBtnY = py + 214;
    if (x >= px + 30 && x <= px + panelW - 30 && y >= resumeBtnY && y <= resumeBtnY + 28) {
      return 'resume';
    }

    // Menu button
    const menuBtnY = py + 248;
    if (x >= px + 30 && x <= px + panelW - 30 && y >= menuBtnY && y <= menuBtnY + 24) {
      return 'menu';
    }

    // Slider drag start
    const sliderX = px + 30;
    const sliderY = py + 162;
    const sliderW = panelW - 60;
    const sliderH = 12;
    if (x >= sliderX - 10 && x <= sliderX + sliderW + 10 && y >= sliderY - 10 && y <= sliderY + sliderH + 10) {
      this.isDraggingSlider = true;
      this.volumeLevel = Math.max(0, Math.min(1, (x - sliderX) / sliderW));
    }

    return null;
  }

  handleMouseMove(x: number, y: number, canvasW: number, canvasH: number): void {
    if (!this.isDraggingSlider) return;
    const { px, panelW } = this.getPanelRect(canvasW, canvasH);
    const sliderX = px + 30;
    const sliderW = panelW - 60;
    void y;
    this.volumeLevel = Math.max(0, Math.min(1, (x - sliderX) / sliderW));
  }

  handleMouseUp(): void {
    this.isDraggingSlider = false;
  }

  getVolume(): number {
    return this.volumeLevel;
  }

  setVolume(vol: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, vol));
  }
}
