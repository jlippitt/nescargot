import { Color } from 'ppu/paletteTable';

import Screen from './index';

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;

export default class CanvasScreen implements Screen {
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;
  private position: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('2D rendering context unavailable');
    }

    this.ctx = ctx;
    this.image = this.ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.position = 0;
  }

  public drawLine(lineBuffer: Color[]): void {
    const imageData = this.image.data;

    for (let i = 0; i < SCREEN_WIDTH; ++i) {
      imageData[this.position++] = (lineBuffer[i] & 0xff0000) >> 16;
      imageData[this.position++] = (lineBuffer[i] & 0xff00) >> 8;
      imageData[this.position++] = lineBuffer[i] & 0xff;
      imageData[this.position++] = 0xff;
    }

    if (this.position >= imageData.length) {
      this.position = 0;
    }
  }

  public update(): void {
    this.ctx.putImageData(this.image, 0, 0);
  }
}
