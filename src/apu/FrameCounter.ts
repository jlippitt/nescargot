import { APU_CLOCK_MULTIPLIER } from './constants';

const TICKS_PER_FRAME = (89490 * APU_CLOCK_MULTIPLIER) / 12;

const SEQUENCE_SHORT = 4;
const SEQUENCE_LONG = 5;

export interface Frame {
  shortFrame: boolean;
  longFrame: boolean;
  interrupt: boolean;
}

export default class FrameCounter {
  private sequenceLength: number = SEQUENCE_SHORT;
  private interruptEnabled: boolean = true;
  private clock: number = 0;
  private frame: number = 0;

  public setByte(value: number): void {
    this.sequenceLength = (value & 0x80) !== 0 ? SEQUENCE_LONG : SEQUENCE_SHORT;
    this.interruptEnabled = (value & 0x40) === 0;
    this.clock = 0;
    this.frame = 0;
  }

  public tick(ticks: number): Frame | undefined {
    this.clock += ticks;

    if (this.clock >= TICKS_PER_FRAME) {
      this.clock -= TICKS_PER_FRAME;

      if (++this.frame === this.sequenceLength) {
        this.frame = 0;
      }

      const isShortSequence = this.sequenceLength === SEQUENCE_SHORT;

      const shortFrame = this.frame < 4;

      const longFrame =
        shortFrame && this.frame % 2 === (isShortSequence ? 0 : 1);

      const interrupt =
        this.interruptEnabled && isShortSequence && this.frame === 3;

      return { shortFrame, longFrame, interrupt };
    }
  }
}
