import { debug, toHex } from 'log';
import Mapper from 'mapper';
import PPU from 'ppu';

import Hardware from './hardware';

const RAM_SIZE = 2048;

export default class MMU {
  private mapper: Mapper;
  private ppu: PPU;
  private ram: Uint8Array;

  constructor({ mapper, ppu }: Hardware) {
    this.mapper = mapper;
    this.ppu = ppu;
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
        if (offset < 0x4018) {
          // TODO: APU and I/O registers
          value = 0;
        } else {
          value = this.mapper.get(offset);
        }
        break;
      default:
        value = this.mapper.get(offset);
    }

    debug(`Read: ${toHex(offset, 4)} => ${toHex(value, 2)}`);

    return value;
  }

  public getWord(offset: number): number {
    const lower = this.getByte(offset);
    const upper = this.getByte(offset + 1);
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
        if (offset < 0x4018) {
          // TODO: APU and I/O registers
        } else {
          this.mapper.set(offset, value);
        }
        break;
      default:
        this.mapper.set(offset, value);
    }

    debug(`Write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);
  }

  public setWord(offset: number, value: number): void {
    this.setByte(offset, value & 0xff);
    this.setByte(offset + 1, value >> 8);
  }
}
