import Interrupt from 'interrupt';
import Mapper from 'mapper';
import Screen from 'screen';

import VRAM from './vram';

const TICKS_PER_LINE = 341;
const TOTAL_LINES = 262;
const VBLANK_LINE = 240;

export interface PPUOptions {
  screen: Screen;
  interrupt: Interrupt;
  mapper: Mapper;
}

export interface PPUState {
  line: number;
  vram: VRAM;
  control: {
    nmiEnabled: boolean;
  };
  mask: {
    backgroundEnabled: boolean;
    spritesEnabled: boolean;
  };
  status: {
    vblank: boolean;
  };
}

export default class PPU {
  private interrupt: Interrupt;
  private state: PPUState;
  private clock: number;
  private oddFrame: boolean;
  private ticksForCurrentLine: number;

  constructor({ screen, interrupt, mapper }: PPUOptions) {
    this.interrupt = interrupt;

    this.state = {
      line: 0,
      vram: new VRAM(mapper),
      control: {
        nmiEnabled: false,
      },
      mask: {
        backgroundEnabled: false,
        spritesEnabled: false,
      },
      status: {
        vblank: false,
      },
    };

    this.clock = 0;
    this.oddFrame = false;
    this.ticksForCurrentLine = TICKS_PER_LINE;
  }

  public get(offset: number): number {
    const { vram, status } = this.state;

    switch (offset % 8) {
      case 2: {
        const value = status.vblank ? 0x80 : 0x00;
        // TODO: Rest of the status
        status.vblank = false;
        return value;
      }
      case 7:
        return vram.getDataByte();
      default:
        return 0;
    }
  }

  public set(offset: number, value: number): void {
    const { vram, control, mask, status } = this.state;

    switch (offset % 8) {
      case 0:
        control.nmiEnabled = (value & 0x80) !== 0;

        if (control.nmiEnabled && status.vblank) {
          this.interrupt.triggerNmi();
        }

        vram.setIncrementType((value & 0x40) !== 0);
        break;

      case 1:
        mask.backgroundEnabled = (value & 0x08) !== 0;
        mask.spritesEnabled = (value & 0x10) !== 0;
        break;

      case 6:
        vram.setAddressByte(value);
        break;

      case 7:
        vram.setDataByte(value);
    }
  }

  public tick(ticks: number): boolean {
    this.clock += ticks * 3;

    if (this.clock >= this.ticksForCurrentLine) {
      const { state } = this;
      const { control, mask, status } = state;

      this.clock -= this.ticksForCurrentLine;
      ++state.line;

      if (state.line === TOTAL_LINES) {
        // New frame
        state.line = 0;
        this.oddFrame = !this.oddFrame;
        status.vblank = false;

        // Ensure this is always reset at the start of a frame (don't need to
        // check if odd or even)
        this.ticksForCurrentLine = TICKS_PER_LINE;
        return true;
      } else if (state.line === VBLANK_LINE) {
        status.vblank = true;
      } else if (
        state.line === TOTAL_LINES - 1 &&
        this.oddFrame &&
        (mask.backgroundEnabled || mask.spritesEnabled)
      ) {
        // Skip a clock cycle at the end of this line
        this.ticksForCurrentLine = TICKS_PER_LINE - 1;
      }

      if (status.vblank && control.nmiEnabled) {
        this.interrupt.triggerNmi();
      }
    }

    return false;
  }
}
