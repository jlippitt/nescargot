import DMA from 'DMA';
import Joypad from 'Joypad';
import { debug, toHex } from 'log';
import Mapper from 'mapper/Mapper';
import PPU from 'ppu/PPU';

import Hardware from './Hardware';

const RAM_SIZE = 2048;

export default class MMU {
  private mapper: Mapper;
  private ppu: PPU;
  private joypad: Joypad;
  private dma: DMA;
  private ram: Uint8Array;

  constructor({ mapper, ppu, joypad, dma }: Hardware) {
    this.mapper = mapper;
    this.ppu = ppu;
    this.joypad = joypad;
    this.dma = dma;
    this.ram = new Uint8Array(RAM_SIZE);
  }

  public getByte(offset: number): number {
    let value: number;

    switch (offset & 0xe000) {
      case 0x0000:
        value = this.ram[offset % RAM_SIZE];
        break;
      case 0x2000:
        value = this.ppu.get(offset);
        break;
      case 0x4000:
        if (offset < 0x4020) {
          switch (offset) {
            case 0x4014:
              // Cannot read DMA
              value = 0;
              break;
            case 0x4016:
            case 0x4017:
              value = this.joypad.getByte(offset);
              break;
            default:
              // TODO: APU registers
              value = 0;
              break;
          }
        } else {
          value = this.mapper.getPrgByte(offset);
        }
        break;
      default:
        value = this.mapper.getPrgByte(offset);
    }

    debug(`Read: ${toHex(offset, 4)} => ${toHex(value, 2)}`);

    return value;
  }

  public getWord(offset: number): number {
    const lower = this.getByte(offset);
    const upper = this.getByte(offset + 1);
    return (upper << 8) | lower;
  }

  public getWordWithinPage(offset: number): number {
    const lower = this.getByte(offset);
    const upper = this.getByte((offset & 0xff00) | ((offset + 1) & 0x00ff));
    return (upper << 8) | lower;
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0xe000) {
      case 0x0000:
        this.ram[offset % RAM_SIZE] = value;
        break;
      case 0x2000:
        this.ppu.set(offset, value);
        break;
      case 0x4000:
        if (offset < 0x4020) {
          switch (offset) {
            case 0x4014:
              this.dma.begin(value);
              break;
            case 0x4016:
            case 0x4017:
              this.joypad.setByte(offset, value);
              break;
            default:
              // TODO: APU registers
              break;
          }
        } else {
          this.mapper.setPrgByte(offset, value);
        }
        break;
      default:
        this.mapper.setPrgByte(offset, value);
    }

    debug(`Write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);
  }
}
