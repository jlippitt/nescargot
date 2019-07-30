const TICKS_PER_FRAME = 1909120;

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
  private frame: number = 0;

  public setByte(value: number): void {
    this.sequenceLength = (value & 0x08) !== 0 ? SEQUENCE_LONG : SEQUENCE_SHORT;
    this.interruptEnabled = (value & 0x40) === 0;
    this.clock = 0;
    this.frame = 0;
  }

  public tick(ticks: number): FrameActions | undefined {
    this.clock += ticks;

    if (this.clock >= TICKS_PER_FRAME) {
      this.clock -= TICKS_PER_FRAME;

      if (++this.frame === this.sequenceLength) {
        this.frame = 0;
      }

      return {
        updateLengthCounter: this.frame % 2 === 0,
        updateVolumeControl: this.frame < 4,
        triggerInterrupt:
          this.interruptEnabled &&
          this.sequenceLength === SEQUENCE_SHORT &&
          this.frame === 3,
      };
    }
  }
}
