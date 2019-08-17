import FrequencyClock, {
  deriveLinearPeriod,
} from 'apu/channels/components/FrequencyClock';

const DUTY_CYCLE_LENGTH = 16;
const TIMER_PERIOD_MULTIPLIER = 1;

class PulseDuty {
  private threshold: number = 0;
  private counter: number = 0;

  public reset(): void {
    this.counter = 0;
  }

  public setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  public advance(increment: number): void {
    this.counter = (this.counter + increment) % DUTY_CYCLE_LENGTH;
  }
}

export default class PulseChannel {
  private timer: FrequencyClock;
  private pulseDuty: PulseDuty;
  private ignoreDuty: boolean = false;
  private volume: number = 0;
  private enabled: boolean = false;

  constructor() {
    this.timer = new FrequencyClock(
      deriveLinearPeriod(TIMER_PERIOD_MULTIPLIER),
    );
    this.pulseDuty = new PulseDuty();
  }

  public setByte(offset: number, value: number): void {
    switch (offset) {
      case 0:
        this.volume = value & 0x0f;
        this.pulseDuty.setThreshold((value & 0xe0) >> 4);
        this.ignoreDuty = (value & 0x80) !== 0;
        break;

      case 1:
        this.timer.setLowerByte(value);
        break;

      case 2:
        this.timer.setUpperByte(value & 0x0f);
        this.enabled = (value & 0x80) !== 0;

        if (!this.enabled) {
          this.pulseDuty.reset();
        }
        break;

      default:
        break;
    }
  }

  public tick(cpuTicks: number): void {
    if (this.enabled) {
      this.pulseDuty.advance(this.timer.tick(cpuTicks));
    }
  }
}
