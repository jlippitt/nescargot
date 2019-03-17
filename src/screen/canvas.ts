import Screen from './index';

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;

export default class CanvasScreen implements Screen {
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('2D rendering context unavailable');
    }

    this.ctx = ctx;
    this.image = this.ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  public update(): void {
    const pixels = this.image.data;

    for (let i = 0; i < pixels.length; ) {
      pixels[i++] = 0x00;
      pixels[i++] = 0x00;
      pixels[i++] = 0x00;
      pixels[i++] = 0xff;
    }

    this.ctx.putImageData(this.image, 0, 0);
  }
}
