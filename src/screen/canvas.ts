import Screen from './index';

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;

export default class CanvasScreen implements Screen {
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;
  private pixels: Uint32Array;
  private position: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('2D rendering context unavailable');
    }

    this.ctx = ctx;
    this.image = this.ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.pixels = new Uint32Array(this.image.data);
    this.position = 0;
  }

  public drawLine(lineBuffer: number[]): void {
    for (let i = 0; i < SCREEN_WIDTH; ++i) {
      this.pixels[this.position++] = lineBuffer[i];
    }

    if (this.position >= SCREEN_WIDTH * SCREEN_HEIGHT) {
      this.position = 0;
    }
  }

  public update(): void {
    this.ctx.putImageData(this.image, 0, 0);
  }
}
