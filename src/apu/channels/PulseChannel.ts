import FrequencyClock from './components/FrequencyClock';
import Sampler, { Sample } from './components/Sampler';

const DUTY_CYCLES: Sample[] = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1],
];

const FREQUENCY_DIVISOR = 2;

interface LengthCounter {
  enabled: boolean;
  value: number;
}

enum VolumeControlType {
  EnvelopePeriod = 0,
  ConstantVolume = 1,
}

interface VolumeControl {
  type: VolumeControlType;
  value: number;
}

interface Sweep {
  enabled: boolean;
  period: number;
  negative: boolean;
  shiftCount: number;
}

export default class PulseChannel {
  private pulseDuty: Sampler;
  private timer: FrequencyClock;
  private enabled: boolean = false;

  private lengthCounter: LengthCounter = {
    enabled: true,
    value: 0,
  };

  private volumeControl: VolumeControl = {
    type: VolumeControlType.EnvelopePeriod,
    value: 0,
  };

  private sweep: Sweep = {
    enabled: false,
    period: 0,
    negative: false,
    shiftCount: 0,
  };

  constructor() {
    this.pulseDuty = new Sampler(DUTY_CYCLES[0]);
    this.timer = new FrequencyClock(FREQUENCY_DIVISOR);
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.pulseDuty.setSample(DUTY_CYCLES[value & 0x03]);
        this.lengthCounter.enabled = (value & 0x20) === 0;
        this.volumeControl.type = ((value & 0x10) >> 4) as VolumeControlType;
        this.volumeControl.value = value & 0x0f;
        break;
      case 1:
        this.sweep.enabled = (value & 0x80) !== 0;
        this.sweep.period = (value & 0x70) >> 4;
        this.sweep.negative = (value & 0x08) !== 0;
        this.sweep.shiftCount = value & 0x07;
        break;
      case 2:
        this.timer.setLowerByte(value);
        break;
      case 3:
        this.lengthCounter.value = (value & 0xf8) >> 3;
        this.timer.setUpperByte(value);
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.lengthCounter.value = 0;
    }
  }

  public tick(ticks: number): void {
    this.pulseDuty.advance(this.timer.tick(ticks));
  }

  public sample(): number {
    return this.pulseDuty.sample() * 15;
  }
}
