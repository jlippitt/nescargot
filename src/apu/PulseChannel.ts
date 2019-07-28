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
  private timer: number;
  private pulseWidth: number;
  private lengthCounter: LengthCounter;
  private volumeControl: VolumeControl;
  private sweep: Sweep;

  constructor() {
    this.timer = 0;
    this.pulseWidth = 0;

    this.lengthCounter = {
      enabled: true,
      value: 0,
    };

    this.volumeControl = {
      type: VolumeControlType.EnvelopePeriod,
      value: 0,
    };

    this.sweep = {
      enabled: false,
      period: 0,
      negative: false,
      shiftCount: 0,
    };
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.pulseWidth = (value & 0xc0) >> 6;
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
        this.timer = (this.timer & 0xff00) | value;
        break;
      case 3:
        this.lengthCounter.value = (value & 0xf8) >> 3;
        this.timer = (this.timer & 0x00ff) | ((value & 0x07) << 8);
        break;
      default:
        throw new Error('Should not happen');
    }
  }
}
