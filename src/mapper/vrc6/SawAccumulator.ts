import AudioComponent from './AudioComponent';

const ACCUMULATOR_SEQUENCE_LENGTH = 14;

export default class SawAccumulator implements AudioComponent {
  private value: number = 0;
  private rate: number = 0;
  private counter: number = 0;

  public setByte(value: number): void {
    this.rate = value & 0x3f;
  }

  public reset(): void {
    this.counter = 0;
    this.value = 0;
  }

  public advance(increment: number) {
    for (let i = 0; i < increment; ++i) {
      if (++this.counter < ACCUMULATOR_SEQUENCE_LENGTH) {
        if (this.counter % 2 === 0) {
          this.value += this.rate;
        }
      } else {
        this.reset();
      }
    }
  }
}
