import Interrupt from '../interrupt';

const TICKS_PER_LINE = 341;
const TOTAL_LINES = 262;
const VBLANK_LINE = 240;

export default class PPU {
  private interrupt: Interrupt;
  private clock: number;
  private oddFrame: boolean;
  private line: number;
  private ticksForCurrentLine: number;
  private renderingEnabled: boolean;
  private vblank: boolean;
  private nmiEnabled: boolean;

  constructor(interrupt: Interrupt) {
    this.interrupt = interrupt;
    this.clock = 0;
    this.oddFrame = false;
    this.line = 0;
    this.ticksForCurrentLine = TICKS_PER_LINE;
    this.renderingEnabled = false;
    this.vblank = false;
    this.nmiEnabled = false;
  }

  public get(offset: number): number {
    switch (offset % 8) {
      case 2: {
        const status = this.vblank ? 0x80 : 0x00;
        // TODO: Rest of the status
        this.vblank = false;
        return status;
      }
      default:
        return 0;
    }
  }

  public set(offset: number, value: number): void {
    switch (offset % 8) {
      case 0: {
        this.nmiEnabled = (value & 0x80) !== 0;

        if (this.nmiEnabled && this.vblank) {
          this.interrupt.triggerNmi();
        }

        break;
      }
    }
  }

  public tick(ticks: number): void {
    this.clock += ticks * 3;

    if (this.clock >= this.ticksForCurrentLine) {
      this.clock -= this.ticksForCurrentLine;
      ++this.line;

      if (this.line === TOTAL_LINES) {
        // New frame
        this.line = 0;
        this.oddFrame = !this.oddFrame;
        this.vblank = false;

        // Ensure this is always reset at the start of a frame (don't need to
        // check if odd or even)
        this.ticksForCurrentLine = TICKS_PER_LINE;
      } else if (this.line === VBLANK_LINE) {
        this.vblank = true;
      } else if (
        this.line === TOTAL_LINES - 1 &&
        this.oddFrame &&
        this.renderingEnabled
      ) {
        // Skip a clock cycle at the end of this line
        this.ticksForCurrentLine = TICKS_PER_LINE - 1;
      }

      if (this.vblank && this.nmiEnabled) {
        this.interrupt.triggerNmi();
      }
    }
  }
}
