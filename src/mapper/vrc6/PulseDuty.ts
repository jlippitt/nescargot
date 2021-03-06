import AudioComponent from './AudioComponent';

const DUTY_CYCLE_LENGTH = 16;

export default class PulseDuty implements AudioComponent {
  private volume: number = 0;
  private threshold: number = 0;
  private ignoreDuty: boolean = false;
  private counter: number = 0;

  public setByte(value: number): void {
    this.volume = value & 0x0f;
    this.threshold = (value & 0xe0) >> 4;
    this.ignoreDuty = (value & 0x80) !== 0;
  }

  public reset(): void {
    this.counter = 0;
  }

  public advance(increment: number): void {
    this.counter -= increment;

    if (this.counter < 0) {
      this.counter += DUTY_CYCLE_LENGTH;
    }
  }

  public sample(): number {
    if (this.ignoreDuty || this.counter <= this.threshold) {
      return this.volume;
    } else {
      return 0;
    }
  }
}
