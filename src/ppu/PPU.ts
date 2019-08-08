import Interrupt from 'Interrupt';
import { toHex, warn } from 'log';
import Mapper from 'mapper/Mapper';
import Screen from 'screen/Screen';

import OAM from './OAM';
import Registers from './Registers';
import Renderer, { SpriteSize } from './Renderer';
import VRAM from './VRAM';

const TOTAL_LINES = 262;
const POST_RENDER_LINE = 240;
const PRE_RENDER_LINE = 261;

export interface PPUOptions {
  screen: Screen;
  interrupt: Interrupt;
  mapper: Mapper;
}

export interface PPUControl {
  backgroundPatternOffset: number;
  spritePatternOffset: number;
  spriteSize: SpriteSize;
  nmiEnabled: boolean;
}

export interface PPUState {
  line: number;
  oam: OAM;
  vram: VRAM;
  control: PPUControl;
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

enum Mode {
  Render,
  HBlank1,
  HBlank2,
  PostRender,
  VBlank,
  PreRender1,
  PreRender2,
  PreRender3,
  PreRender4Short,
  PreRender4Long,
}

const MODE_TICKS: { [Key in Mode]: number } = {
  [Mode.Render]: 257,
  [Mode.HBlank1]: 64,
  [Mode.HBlank2]: 20,
  [Mode.PostRender]: 341,
  [Mode.VBlank]: 341,
  [Mode.PreRender1]: 257,
  [Mode.PreRender2]: 47,
  [Mode.PreRender3]: 17,
  [Mode.PreRender4Short]: 19,
  [Mode.PreRender4Long]: 20,
};

export default class PPU {
  private screen: Screen;
  private interrupt: Interrupt;
  private state: PPUState;
  private renderer: Renderer;
  private ticks: number;
  private mode: Mode;
  private modeTicks: number;
  private oddFrame: boolean;
  private previousWrite: number;

  constructor({ screen, interrupt, mapper }: PPUOptions) {
    this.screen = screen;
    this.interrupt = interrupt;

    this.state = {
      line: 0,
      oam: new OAM(),
      vram: new VRAM(mapper),
      control: {
        backgroundPatternOffset: 0,
        spritePatternOffset: 0,
        spriteSize: SpriteSize.Small,
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

    this.renderer = new Renderer({
      screen,
      state: this.state,
      mapper,
    });

    this.ticks = 0;
    this.mode = Mode.Render;
    this.modeTicks = MODE_TICKS[Mode.Render];
    this.oddFrame = false;
    this.previousWrite = 0;
  }

  public getOam(): OAM {
    return this.state.oam;
  }

  public get(offset: number): number {
    const { line, oam, vram, status, registers } = this.state;

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

      case 7: {
        const value = vram.getByte(registers.getVramAddress());
        registers.incrementVramAddress();
        if (line < POST_RENDER_LINE && this.isRenderingEnabled()) {
          warn('PPUDATA accessed while rendering');
        }
        return value;
      }

      default:
        warn(`Unexpected PPU read: ${toHex(offset, 4)}`);
        return 0;
    }
  }

  public set(offset: number, value: number): void {
    const { line, oam, vram, control, mask, status, registers } = this.state;

    this.previousWrite = value;

    switch (offset % 8) {
      case 0:
        registers.setNameTableIndexes(value & 0x03);
        registers.setVramIncrement((value & 0x04) !== 0);
        control.spritePatternOffset = (value & 0x08) << 5;
        control.backgroundPatternOffset = (value & 0x10) << 4;
        control.spriteSize =
          (value & 0x20) !== 0 ? SpriteSize.Large : SpriteSize.Small;

        const prevNmiEnabled = control.nmiEnabled;
        control.nmiEnabled = (value & 0x80) !== 0;

        if (status.vblank && control.nmiEnabled && !prevNmiEnabled) {
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
        break;

      case 5:
        registers.setScrollByte(value);
        break;

      case 6:
        registers.setAddressByte(value);
        break;

      case 7:
        vram.setByte(registers.getVramAddress(), value);
        registers.incrementVramAddress();
        if (line < POST_RENDER_LINE && this.isRenderingEnabled()) {
          warn('PPUDATA accessed while rendering');
        }
        break;

      default:
        warn(`Unexpected PPU write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);
    }
  }

  public tick(cpuTicks: number): void {
    this.ticks += cpuTicks * 3;

    if (this.ticks >= this.modeTicks) {
      this.ticks -= this.modeTicks;
      this.mode = this.nextMode();
      this.modeTicks = MODE_TICKS[this.mode];
    }
  }

  private nextMode(): Mode {
    const { control, status } = this.state;

    switch (this.mode) {
      case Mode.Render: {
        const spriteHit = this.renderer.renderLine();
        status.spriteHit = status.spriteHit || spriteHit;
        return Mode.HBlank1;
      }

      case Mode.HBlank1:
        return Mode.HBlank2;

      case Mode.HBlank2:
        if (++this.state.line === POST_RENDER_LINE) {
          this.screen.update();
          return Mode.PostRender;
        } else {
          return Mode.Render;
        }

      case Mode.PostRender:
        ++this.state.line;
        status.vblank = true;

        if (control.nmiEnabled) {
          this.interrupt.triggerNmi();
        }

        return Mode.VBlank;

      case Mode.VBlank:
        if (++this.state.line === PRE_RENDER_LINE) {
          status.vblank = false;
          status.spriteHit = false;
          return Mode.PreRender1;
        } else {
          return Mode.VBlank;
        }

      case Mode.PreRender1:
        return Mode.PreRender2;

      case Mode.PreRender2:
        return Mode.PreRender3;

      case Mode.PreRender3:
        if (this.oddFrame && this.isRenderingEnabled()) {
          return Mode.PreRender4Short;
        } else {
          return Mode.PreRender4Long;
        }

      default:
        this.state.line = 0;
        this.oddFrame = !this.oddFrame;
        return Mode.Render;
    }
  }

  private isRenderingEnabled = (): boolean =>
    this.state.mask.backgroundEnabled || this.state.mask.spritesEnabled
}
