import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const browserPath = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((candidate) => existsSync(candidate));
if (!browserPath) throw new Error('Set CHROME_PATH to run native Canvas regression checks');
const compiledSource = (path) => readFileSync(fileURLToPath(new URL('../dist/client/src/' + path, import.meta.url)), 'utf8');
const sources = { canvas: compiledSource('ui/canvas.js'), widgets: compiledSource('ui/widgets.js'), theme: compiledSource('core/theme.js') };
const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setContent('<style>body{margin:0}canvas{display:block;width:390px;height:844px}</style><canvas></canvas>');
  const results = [];
  const scenarios = [1, 2, 3].flatMap((dpr) => [{ dpr, topInset: 0, bottomInset: 0 }, { dpr, topInset: 84, bottomInset: 34 }]);
  for (const scenario of scenarios) {
    const { dpr, topInset } = scenario;
    const result = await page.evaluate(({ sources, scenario }) => {
      const { dpr, topInset, bottomInset } = scenario;
      const theme = {};
      new Function('exports', sources.theme)(theme);
      const canvasModule = {};
      new Function('exports', sources.canvas)(canvasModule);
      const widgetModule = {};
      new Function('exports', 'require', sources.widgets)(widgetModule, () => theme);
      const canvas = document.querySelector('canvas');
      const layout = canvasModule.configureCanvas(canvas, { w: 390, h: 844, dpr, topInset, bottomInset });
      const context = layout.ctx;
      const drawScale = context.getTransform().a;
      const verticalOffset = context.getTransform().f;
      const redAt = (horizontal, vertical) => context.getImageData(Math.floor(horizontal * drawScale), Math.floor(vertical * drawScale + verticalOffset), 1, 1).data[0] > 200;
      context.fillStyle = '#ff0000';
      context.fillRect(10, 20, 40, 30);
      const rectangle = redAt(30, 35) && !redAt(55, 35);
      context.beginPath();
      context.roundRect(70, 20, 40, 30, 8);
      context.fill();
      const rounded = redAt(90, 35) && !redAt(71, 21);
      context.beginPath();
      context.moveTo(130, 20);
      context.lineTo(160, 50);
      context.lineTo(130, 50);
      context.closePath();
      context.fill();
      const path = redAt(135, 40) && !redAt(155, 25);
      context.beginPath();
      context.arc(195, 35, 12, 0, Math.PI * 2);
      context.fill();
      const arc = redAt(195, 35) && !redAt(212, 35);
      context.font = '20px sans-serif';
      const measuredWidth = context.measureText('Canvas').width;
      context.fillText('Canvas', 10, 120);
      const pixels = context.getImageData(0, Math.floor(85 * drawScale + verticalOffset), canvas.width, Math.ceil(45 * drawScale));
      let minimumRow = pixels.height;
      let maximumRow = -1;
      for (let row = 0; row < pixels.height; row++) {
        for (let column = 0; column < pixels.width; column++) {
          if (pixels.data[(row * pixels.width + column) * 4] > 80) { minimumRow = Math.min(minimumRow, row); maximumRow = Math.max(maximumRow, row); }
        }
      }
      const ui = new widgetModule.UI(context, layout.w, layout.h);
      window.canvasTapCount = 0;
      ui.button({ x: 100, y: 180, w: 100, h: 50 }, '点击', () => { window.canvasTapCount++; }, { id: 'retina-button' });
      canvas.onclick = (event) => ui.onTap(event.offsetX / layout.inputScale, (event.offsetY - layout.inputOffsetY) / layout.inputScale);
      return { dpr, topInset, rectangle, rounded, path, arc, measuredWidth, textHeight: (maximumRow - minimumRow + 1) / drawScale, width: canvas.width, drawScale, verticalOffset, logicalHeight: layout.h };
    }, { sources, scenario });
    for (const geometry of ['rectangle', 'rounded', 'path', 'arc']) assert.equal(result[geometry], true, `DPR ${dpr} ${geometry}`);
    assert.equal(result.width, 390 * Math.min(dpr, 2));
    assert.ok(Math.abs(result.verticalOffset - topInset * Math.min(dpr, 2)) < 0.001);
    if (topInset) assert.equal(result.logicalHeight, 698);
    await page.mouse.click(150 * 390 / 375, 205 * 390 / 375 + topInset);
    assert.equal(await page.evaluate(() => window.canvasTapCount), 1, `DPR ${dpr} CSS touch aligns with logical button`);
    results.push(result);
  }
  for (const result of results.slice(1)) {
    assert.ok(Math.abs(result.measuredWidth - results[0].measuredWidth) < 0.01, 'measureText stays in logical pixels');
    assert.ok(Math.abs(result.textHeight - results[0].textHeight) < 1.5, 'font remains the same logical height');
  }
  console.log('native-canvas ok:', JSON.stringify(results));
} finally {
  await browser.close();
}
