export default class Clock {
  private ticks: number;

  constructor() {
    this.ticks = 0;
  }

  public tick(ticks: number): void {
    this.ticks += ticks;
  }

  public toString(): string {
    return this.ticks.toString();
  }
}
