import Screen from './Screen';

export default class DummyScreen implements Screen {
  public drawLine(lineBuffer: number[]): void {
    // Do nothing
  }

  public skipLine(): void {
    // Do nothing
  }

  public update(): void {
    // Do nothing
  }
}
