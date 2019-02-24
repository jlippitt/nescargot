import { toHex } from 'log';
import Mapper from 'mapper';

const RAM_SIZE = 2048;

export default class MMU {
  private mapper: Mapper;
  private ram: Uint8Array;

  constructor(mapper: Mapper) {
    this.mapper = mapper;
    this.ram = new Uint8Array(RAM_SIZE);
  }

  public getByte(offset: number): number {
    let value: number;

    switch (offset & 0xE000) {
      case 0x0000:
        value = this.ram[offset % RAM_SIZE];
        break;
      case 0x2000:
        // TODO: PPU registers
        value = 0;
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

    console.log(`Read: ${toHex(offset, 4)} => ${toHex(value, 2)}`);

    return value;
  }

  public getWord(offset: number): number {
    const lower = this.getByte(offset);
    const upper = this.getByte(offset + 1);
    return (upper << 8) | lower;
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0xE000) {
      case 0x0000:
        this.ram[offset % RAM_SIZE] = value;
        break;
      case 0x2000:
        // TODO: PPU registers
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

    console.log(`Write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);
  }

  public setWord(offset: number, value: number): void {
    this.setByte(offset, value & 0xFF);
    this.setByte(offset + 1, value >> 8);
  }
}
