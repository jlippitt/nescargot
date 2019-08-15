import { times } from 'lodash';

import APU from 'apu/APU';
import DMA from 'DMA';
import Joypad from 'Joypad';
import { debug, toHex } from 'log';
import Mapper from 'mapper/Mapper';
import PPU from 'ppu/PPU';

import Hardware from './Hardware';

export const OPEN_BUS = 0xff00;

export const partialOpenBus = (value: number, mask: number) =>
  (mask << 8) | value;

const RAM_SIZE = 2048;

export default class MMU {
  private mapper: Mapper;
  private ppu: PPU;
  private apu: APU;
  private joypad: Joypad;
  private dma: DMA;
  private ram: Uint8Array;
  private storedValue: number = 0;

  constructor({ mapper, ppu, apu, joypad, dma }: Hardware) {
    this.mapper = mapper;
    this.ppu = ppu;
    this.apu = apu;
    this.joypad = joypad;
    this.dma = dma;
    this.ram = Uint8Array.from(
      times(RAM_SIZE, () => Math.floor(Math.random() * 256)),
    );
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
            case 0x4016:
            case 0x4017:
              value = this.joypad.getByte(offset);
              break;
            default:
              value = this.apu.getByte(offset);
              break;
          }
        } else {
          value = this.mapper.getPrgByte(offset);
        }
        break;
      default:
        value = this.mapper.getPrgByte(offset);
    }

    // Here's how we do open bus behaviour without any branching and without
    // leaving the nice, fast world of integers. Simply use a 16-bit value:
    // Bits 0-7: The actual value (if any)
    // Bits 8-15: Mask for bits that should be considered 'open bus'
    const mask = value >> 8;
    this.storedValue = (value & 0xff & ~mask) | (this.storedValue & mask);

    debug(`Read: ${toHex(offset, 4)} => ${toHex(this.storedValue, 2)}`);

    return this.storedValue;
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
              this.joypad.setByte(offset, value);
              break;
            default:
              this.apu.setByte(offset, value);
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
