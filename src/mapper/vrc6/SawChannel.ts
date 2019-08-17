import FrequencyClock, {
  deriveLinearPeriod,
} from 'apu/channels/components/FrequencyClock';

const ACCUMULATOR_SEQUENCE_LENGTH = 14;
const TIMER_PERIOD_MULTIPLIER = 1;

class Accumulator {
  private value: number = 0;
  private rate: number = 0;
  private counter: number = 0;

  public setRate(rate: number) {
    this.rate = rate;
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

export default class SawChannel {
  private timer: FrequencyClock;
  private accumulator: Accumulator;
  private enabled: boolean = false;

  constructor() {
    this.timer = new FrequencyClock(
      deriveLinearPeriod(TIMER_PERIOD_MULTIPLIER),
    );
    this.accumulator = new Accumulator();
  }

  public setByte(offset: number, value: number): void {
    switch (offset) {
      case 0:
        this.accumulator.setRate(value & 0x3f);
        break;

      case 1:
        this.timer.setLowerByte(value);
        break;

      case 2:
        this.timer.setUpperByte(value & 0x0f);
        this.enabled = (value & 0x80) !== 0;

        if (!this.enabled) {
          this.accumulator.reset();
        }
        break;
    }
  }

  public tick(cpuTicks: number): void {
    if (this.enabled) {
      this.accumulator.advance(this.timer.tick(cpuTicks));
    }
  }
}
