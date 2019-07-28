import Interrupt from 'interrupt';
import Mapper from 'mapper';
import Screen from 'screen';

import OAM from './oam';
import Registers from './registers';
import Renderer from './renderer';
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
  screen: Screen;
  line: number;
  oam: OAM;
  vram: VRAM;
  control: {
    backgroundNameTableX: number;
    backgroundNameTableY: number;
    backgroundPatternTableIndex: number;
    spritePatternTableIndex: number;
    nmiEnabled: boolean;
  };
  mask: {
    backgroundEnabled: boolean;
    spritesEnabled: boolean;
  };
  status: {
    vblank: boolean;
    spriteHit: boolean;
  };
  registers: Registers;
}

export default class PPU {
  private interrupt: Interrupt;
  private state: PPUState;
  private renderer: Renderer;
  private clock: number;
  private oddFrame: boolean;
  private ticksForCurrentLine: number;
  private previousWrite: number;

  constructor({ screen, interrupt, mapper }: PPUOptions) {
    this.interrupt = interrupt;

    this.state = {
      screen,
      line: 0,
      oam: new OAM(),
      vram: new VRAM(mapper),
      control: {
        backgroundNameTableX: 0,
        backgroundNameTableY: 0,
        backgroundPatternTableIndex: 0,
        spritePatternTableIndex: 0,
        nmiEnabled: false,
      },
      mask: {
        backgroundEnabled: false,
        spritesEnabled: false,
      },
      status: {
        vblank: false,
        spriteHit: false,
      },
      registers: new Registers(),
    };

    this.renderer = new Renderer(screen, this.state);

    this.clock = 0;
    this.oddFrame = false;
    this.ticksForCurrentLine = TICKS_PER_LINE;
    this.previousWrite = 0;
  }

  public getOam(): OAM {
    return this.state.oam;
  }

  public get(offset: number): number {
    const { oam, vram, status, registers } = this.state;

    switch (offset % 8) {
      case 2: {
        let value = this.previousWrite & 0x1f;
        value |= status.vblank ? 0x80 : 0x00;
        value |= status.spriteHit ? 0x40 : 0x00;
        // TODO: Sprite overflow
        status.vblank = false;
        registers.clearWriteLatch();
        return value;
      }

      case 4:
        return oam.getDataByte();

      case 7:
        return vram.getDataByte();

      default:
        return 0;
    }
  }

  public set(offset: number, value: number): void {
    const { oam, vram, control, mask, status, registers } = this.state;

    this.previousWrite = value;

    switch (offset % 8) {
      case 0:
        registers.setNameTableIndexes(value & 0x03);
        vram.setIncrementType((value & 0x04) !== 0);
        control.spritePatternTableIndex = (value & 0x08) >> 3;
        control.backgroundPatternTableIndex = (value & 0x10) >> 4;
        control.nmiEnabled = (value & 0x80) !== 0;

        if (control.nmiEnabled && status.vblank) {
          this.interrupt.triggerNmi();
        }
        break;

      case 1:
        mask.backgroundEnabled = (value & 0x08) !== 0;
        mask.spritesEnabled = (value & 0x10) !== 0;
        break;

      case 3:
        oam.setAddressByte(value);
        break;

      case 4:
        oam.setDataByte(value);

      case 5:
        registers.setScrollByte(value);
        break;

      case 6:
        registers.setAddressByte(value);
        vram.setAddress(registers.getVramAddress());
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

      if (state.line < VBLANK_LINE) {
        const spriteHit = this.renderer.renderLine();
        status.spriteHit = status.spriteHit || spriteHit;
      }

      ++state.line;

      if (state.line === VBLANK_LINE) {
        status.vblank = true;
        if (control.nmiEnabled) {
          this.interrupt.triggerNmi();
        }
      } else if (
        state.line === TOTAL_LINES - 1 &&
        this.oddFrame &&
        (mask.backgroundEnabled || mask.spritesEnabled)
      ) {
        // Skip a clock cycle at the end of this line
        this.ticksForCurrentLine = TICKS_PER_LINE - 1;
      } else if (state.line === TOTAL_LINES) {
        // New frame
        state.line = 0;
        this.oddFrame = !this.oddFrame;
        status.vblank = false;
        status.spriteHit = false;

        // Ensure this is always reset at the start of a frame (don't need to
        // check if odd or even)
        this.ticksForCurrentLine = TICKS_PER_LINE;
        return true;
      }
    }

    return false;
  }
}
