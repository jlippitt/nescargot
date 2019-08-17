import FrequencyClock, {
  deriveLinearPeriod,
} from 'apu/channels/components/FrequencyClock';

import AudioComponent from './AudioComponent';

const TIMER_PERIOD_MULTIPLIER = 1;

export default class AudioChannel {
  private component: AudioComponent;
  private timer: FrequencyClock;
  private enabled: boolean = false;

  constructor(component: AudioComponent) {
    this.component = component;
    this.timer = new FrequencyClock(
      deriveLinearPeriod(TIMER_PERIOD_MULTIPLIER),
    );
  }

  public setByte(offset: number, value: number): void {
    switch (offset) {
      case 0:
        this.component.setByte(value);
        break;

      case 1:
        this.timer.setLowerByte(value);
        break;

      case 2:
        this.timer.setUpperByte(value & 0x0f);
        this.enabled = (value & 0x80) !== 0;

        if (!this.enabled) {
          this.component.reset();
        }
        break;

      default:
        break;
    }
  }

  public tick(cpuTicks: number): void {
    if (this.enabled) {
      this.component.advance(this.timer.tick(cpuTicks));
    }
  }

  public sample(): number {
    return this.enabled ? this.component.sample() : 0;
  }
}
