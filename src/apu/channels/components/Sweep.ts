import FrequencyClock from './FrequencyClock';

const MIN_PERIOD = 8;
const MAX_PERIOD = 0x07ff;

export default class Sweep {
  public target: FrequencyClock;
  public negationOffset: number;
  public enabled: boolean = true;
  public dividerPeriod: number = 0;
  public negate: boolean = false;
  public shiftCount: number = 0;
  public divider: number = 0;
  public reload: boolean = false;
  public mute: boolean = false;

  constructor(target: FrequencyClock, negationOffset: number) {
    this.target = target;
    this.negationOffset = negationOffset;
  }

  public setByte(value: number): void {
    this.enabled = (value & 0x80) !== 0;
    this.dividerPeriod = (value & 0x70) >> 4;
    this.negate = (value & 0x08) !== 0;
    this.shiftCount = value & 0x07;
    this.reload = true;
  }

  public advance(): void {
    const currentPeriod = this.target.getValue();

    if (currentPeriod < MIN_PERIOD) {
      this.mute = true;
    }

    const shiftAmount = currentPeriod >> this.shiftCount;
    const signedShiftAmount = this.negate
      ? -shiftAmount + this.negationOffset
      : shiftAmount;
    const targetPeriod = currentPeriod + signedShiftAmount;

    this.mute = currentPeriod < MIN_PERIOD || targetPeriod > MAX_PERIOD;

    if (
      this.divider === 0 &&
      this.enabled &&
      !this.mute &&
      this.shiftCount > 0
    ) {
      this.target.setValue(targetPeriod);
    }

    if (this.divider === 0 || this.reload) {
      this.reload = false;
      this.divider = this.dividerPeriod;
    } else {
      --this.divider;
    }
  }

  public isMuteFlagSet(): boolean {
    return this.mute;
  }
}
