import Interrupt from 'Interrupt';
import { toHex, warn } from 'log';
import Mapper from 'mapper/Mapper';
import Screen from 'screen/Screen';

import { Event, initialEventState } from './Event';
import OAM from './OAM';
import Registers from './Registers';
import Renderer, { SpriteSize } from './Renderer';
import VRAM from './VRAM';

const CLIP_WIDTH = 8;

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
  oddFrame: boolean;
  oam: OAM;
  vram: VRAM;
  control: PPUControl;
  mask: {
    renderingEnabled: boolean;
    backgroundEnabled: boolean;
    spritesEnabled: boolean;
    backgroundXStart: number;
    spriteXStart: number;
  };
  status: {
    vblank: boolean;
    spriteHit: boolean;
    spriteOverflow: boolean;
  };
  registers: Registers;
}

export default class PPU {
  private screen: Screen;
  private mapper: Mapper;
  private interrupt: Interrupt;
  private state: PPUState;
  private renderer: Renderer;
  private ticks: number;
  private nextEvent: Event;
  private nextEventTime: number;
  private previousWrite: number;

  constructor({ screen, interrupt, mapper }: PPUOptions) {
    this.screen = screen;
    this.mapper = mapper;
    this.interrupt = interrupt;

    this.state = {
      line: 0,
      oddFrame: false,
      oam: new OAM(),
      vram: new VRAM(mapper),
      control: {
        backgroundPatternOffset: 0,
        spritePatternOffset: 0,
        spriteSize: SpriteSize.Small,
        nmiEnabled: false,
      },
      mask: {
        renderingEnabled: false,
        backgroundEnabled: false,
        spritesEnabled: false,
        backgroundXStart: CLIP_WIDTH,
        spriteXStart: CLIP_WIDTH,
      },
      status: {
        vblank: false,
        spriteHit: false,
        spriteOverflow: false,
      },
      registers: new Registers(),
    };

    this.renderer = new Renderer({
      screen,
      state: this.state,
      mapper,
    });

    this.ticks = 0;
    [this.nextEvent, this.nextEventTime] = initialEventState;
    this.previousWrite = 0;
  }

  public getOam(): OAM {
    return this.state.oam;
  }

  public get(offset: number): number {
    const { line, oam, vram, mask, status, registers } = this.state;

    switch (offset % 8) {
      case 2: {
        let value = this.previousWrite & 0x1f;
        value |= status.vblank ? 0x80 : 0x00;
        value |= status.spriteHit ? 0x40 : 0x00;
        value |= status.spriteOverflow ? 0x20 : 0x00;
        status.vblank = false;
        registers.clearWriteLatch();
        return value;
      }

      case 4:
        return oam.getDataByte();

      case 7: {
        const value = vram.getByte(registers.getVramAddress());
        registers.incrementVramAddress();
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
        mask.backgroundXStart = (value & 0x02) !== 0 ? 0 : CLIP_WIDTH;
        mask.spriteXStart = (value & 0x04) !== 0 ? 0 : CLIP_WIDTH;
        mask.backgroundEnabled = (value & 0x08) !== 0;
        mask.spritesEnabled = (value & 0x10) !== 0;
        mask.renderingEnabled = mask.backgroundEnabled || mask.spritesEnabled;
        vram.getPaletteTable().setMask(value);
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
        break;

      default:
        warn(`Unexpected PPU write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);
    }
  }

  public tick(cpuTicks: number): void {
    this.ticks += cpuTicks * 3;

    while (this.ticks >= this.nextEventTime) {
      this.ticks -= this.nextEventTime;

      [this.nextEvent, this.nextEventTime] = this.nextEvent({
        state: this.state,
        interrupt: this.interrupt,
        mapper: this.mapper,
        renderer: this.renderer,
      });
    }
  }
}
