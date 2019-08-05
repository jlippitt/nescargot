import { APU_CLOCK_MULTIPLIER } from './constants';

const TICKS_PER_FRAME = (89490 * APU_CLOCK_MULTIPLIER) / 12;

export enum FrameType {
  QuarterFrame,
  HalfFrame,
}

enum Sequence {
  Short,
  Long,
}

type FrameSequence = Array<FrameType | undefined>;

const FRAME_SEQUENCES: { [Key in Sequence]: FrameSequence } = {
  [Sequence.Short]: [
    FrameType.HalfFrame,
    FrameType.QuarterFrame,
    FrameType.HalfFrame,
    FrameType.QuarterFrame,
  ],
  [Sequence.Long]: [
    FrameType.HalfFrame,
    FrameType.QuarterFrame,
    FrameType.HalfFrame,
    FrameType.QuarterFrame,
    undefined,
  ],
};

export default class FrameCounter {
  private sequence: Sequence = Sequence.Short;
  private interruptEnabled: boolean = true;
  private clock: number = 0;
  private frame: number = 0;
  private interrupt: boolean = false;
  private immediateClock: boolean = false;

  public setByte(value: number): void {
    this.sequence = (value & 0x80) !== 0 ? Sequence.Long : Sequence.Short;
    this.interruptEnabled = (value & 0x40) === 0;
    this.clock = 0;
    this.frame = 0;
    this.interrupt = this.interrupt && this.interruptEnabled;
    this.immediateClock = this.sequence === Sequence.Long;
  }

  public tick(ticks: number): FrameType | undefined {
    this.clock += ticks;

    if (this.immediateClock) {
      this.immediateClock = false;
      return FrameType.HalfFrame;
    } else if (this.clock >= TICKS_PER_FRAME) {
      this.clock -= TICKS_PER_FRAME;

      const frameSequence = FRAME_SEQUENCES[this.sequence];

      if (++this.frame === frameSequence.length) {
        this.frame = 0;
      }

      this.interrupt =
        this.interrupt ||
        (this.interruptEnabled &&
          this.sequence === Sequence.Short &&
          this.frame === 0);

      return frameSequence[this.frame];
    }
  }

  public isInterruptSet(): boolean {
    return this.interrupt;
  }

  public clearInterrupt(): void {
    this.interrupt = false;
  }
}
