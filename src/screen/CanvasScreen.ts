import Screen from './Screen';

const SCREEN_WIDTH = 256;

export interface ExternalScreenInterface {
  image: ImageData;
  update(): void;
}

export default class CanvasScreen implements Screen {
  private image: ImageData;
  private update: () => void;
  private position: number;

  constructor({ image, update }: ExternalScreenInterface) {
    this.image = image;
    this.update = update;
    this.position = 0;
  }

  public drawLine(lineBuffer: number[]): void {
    const imageData = this.image.data;

    for (let i = 0; i < SCREEN_WIDTH; ++i) {
      imageData[this.position++] = (lineBuffer[i] & 0xff0000) >> 16;
      imageData[this.position++] = (lineBuffer[i] & 0xff00) >> 8;
      imageData[this.position++] = lineBuffer[i] & 0xff;
      imageData[this.position++] = 0xff;
    }

    if (this.position >= imageData.length) {
      this.position = 0;
      this.update();
    }
  }
}
