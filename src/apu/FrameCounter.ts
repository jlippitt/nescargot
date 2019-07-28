const SEQUENCE_SHORT = 4;
const SEQUENCE_LONG = 5;

export interface FrameActions {
  updateLengthCounter: boolean;
  updateVolumeControl: boolean;
  triggerInterrupt: boolean;
}

export default class FrameCounter {
  private sequenceLength: number = SEQUENCE_SHORT;
  private interruptEnabled: boolean = true;
  private clock: number = 0;

  public setByte(value: number): void {
    this.sequenceLength = (value & 0x08) !== 0 ? SEQUENCE_LONG : SEQUENCE_SHORT;
    this.interruptEnabled = (value & 0x40) === 0;
    this.clock = 0;
  }

  public tick(): FrameActions {
    if (++this.clock === this.sequenceLength) {
      this.clock = 0;
    }

    return {
      updateLengthCounter: this.clock % 2 === 0,
      updateVolumeControl: this.clock < 4,
      triggerInterrupt:
        this.interruptEnabled &&
        this.sequenceLength === SEQUENCE_SHORT &&
        this.clock === 3,
    };
  }
}
