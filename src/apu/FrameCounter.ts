import { APU_CLOCK_MULTIPLIER } from './constants';

const TICKS_PER_FRAME = (89490 * APU_CLOCK_MULTIPLIER) / 12;

const SEQUENCE_SHORT = 4;
const SEQUENCE_LONG = 5;

export default class FrameCounter {
  private sequenceLength: number = SEQUENCE_SHORT;
  private interruptEnabled: boolean = true;
  private clock: number = 0;
  private frame: number = 0;
  private interrupt: boolean = false;

  public setByte(value: number): void {
    this.sequenceLength = (value & 0x80) !== 0 ? SEQUENCE_LONG : SEQUENCE_SHORT;
    this.interruptEnabled = (value & 0x40) === 0;
    this.clock = 0;
    this.frame = 0;
    this.interrupt = this.interrupt && this.interruptEnabled;
  }

  public tick(ticks: number): number | undefined {
    this.clock += ticks;

    if (this.clock >= TICKS_PER_FRAME) {
      this.clock -= TICKS_PER_FRAME;

      if (++this.frame === this.sequenceLength) {
        this.frame = 0;
      }

      this.interrupt =
        this.interrupt ||
        (this.interruptEnabled &&
          this.sequenceLength === SEQUENCE_SHORT &&
          this.frame === 0);

      return this.frame < 4 ? this.frame : undefined;
    }
  }

  public isInterruptSet(): boolean {
    return this.interrupt;
  }

  public clearInterrupt(): void {
    this.interrupt = false;
  }
}
