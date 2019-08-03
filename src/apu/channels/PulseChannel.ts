import FrequencyClock from './components/FrequencyClock';
import LengthCounter from './components/LengthCounter';
import Sampler, { Sample } from './components/Sampler';

const DUTY_CYCLES: Sample[] = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1],
];

const FREQUENCY_DIVISOR = 2;

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
  private lengthCounter: LengthCounter;

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
    this.lengthCounter = new LengthCounter();
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.pulseDuty.setSample(DUTY_CYCLES[(value & 0xc0) >> 6]);
        this.lengthCounter.setHalted((value & 0x20) !== 0);
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
        this.lengthCounter.setValue((value & 0xf8) >> 3);
        this.timer.setUpperByte(value);
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  public setEnabled(enabled: boolean): void {
    this.lengthCounter.setEnabled(enabled);
  }

  public tick(ticks: number): void {
    this.pulseDuty.advance(this.timer.tick(ticks));
  }

  public update(longFrame: boolean): void {
    if (longFrame) {
      this.lengthCounter.advance();
    }
  }

  public sample(): number {
    return this.lengthCounter.isEnabled() ? this.pulseDuty.sample() * 15 : 0;
  }
}
