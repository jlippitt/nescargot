import Screen from './Screen';

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;

const calculateCanvasSize = (container: HTMLElement): [number, number] => {
  const maxWidthScale = Math.floor(container.offsetWidth / SCREEN_WIDTH);
  const maxHeightScale = Math.floor(container.offsetHeight / SCREEN_HEIGHT);
  const scaleFactor = Math.min(maxWidthScale, maxHeightScale);

  return [scaleFactor * SCREEN_WIDTH, scaleFactor * SCREEN_HEIGHT];
};

const createCanvas = (
  width: number,
  height: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'block';
  canvas.style.margin = 'auto';

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D rendering context unavailable');
  }

  // We want our sharp pixels!
  context.imageSmoothingEnabled = false;

  return [canvas, context];
};

export default class CanvasScreen implements Screen {
  private outerCanvas: HTMLCanvasElement;
  private outerContext: CanvasRenderingContext2D;
  private innerCanvas: HTMLCanvasElement;
  private innerContext: CanvasRenderingContext2D;
  private image: ImageData;
  private position: number;

  constructor(container: HTMLElement) {
    const [width, height] = calculateCanvasSize(container);

    const [outerCanvas, outerContext] = createCanvas(width, height);

    container.appendChild(outerCanvas);

    const [innerCanvas, innerContext] = createCanvas(
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
    );

    this.outerCanvas = outerCanvas;
    this.outerContext = outerContext;
    this.innerCanvas = innerCanvas;
    this.innerContext = innerContext;
    this.image = innerContext.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.position = 0;

    window.addEventListener('resize', () => {
      const [newWidth, newHeight] = calculateCanvasSize(container);
      outerCanvas.width = newWidth;
      outerCanvas.height = newHeight;
    });
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
    }
  }

  public skipLine(): void {
    this.position += SCREEN_WIDTH * 4;
  }

  public update(): void {
    this.innerContext.putImageData(this.image, 0, 0);

    this.outerContext.drawImage(
      this.innerCanvas,
      0,
      0,
      this.outerCanvas.width,
      this.outerCanvas.height,
    );
  }
}
