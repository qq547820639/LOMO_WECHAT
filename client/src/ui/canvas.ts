export interface CanvasViewport { w: number; h: number; dpr: number; topInset?: number; bottomInset?: number }

export function configureCanvas(canvas: any, viewport: CanvasViewport): { ctx: any; w: number; h: number; inputScale: number; inputOffsetY: number } {
  const logicalWidth = 375;
  const pixelRatio = Math.max(1, Math.min(2, viewport.dpr));
  canvas.width = Math.round(viewport.w * pixelRatio);
  canvas.height = Math.round(viewport.h * pixelRatio);
  const ctx = canvas.getContext('2d');
  const drawScale = canvas.width / logicalWidth;
  const inputScale = viewport.w / logicalWidth;
  const inputOffsetY = viewport.topInset ?? 0;
  const bottomInset = viewport.bottomInset ?? 0;
  ctx.fillStyle = '#091321';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(drawScale, drawScale);
  ctx.translate(0, inputOffsetY / inputScale);
  return { ctx, w: logicalWidth, h: Math.floor((viewport.h - inputOffsetY - bottomInset) / inputScale), inputScale, inputOffsetY };
}
