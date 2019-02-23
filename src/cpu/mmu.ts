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
    switch (offset & 0xE000) {
      case 0x0000:
        return this.ram[offset % RAM_SIZE];
      case 0x2000:
        // TODO: PPU registers
        return 0;
      case 0x4000:
        if (offset < 0x4018) {
          // TODO: APU and I/O registers
          return 0;
        } else {
          return this.mapper.get(offset);
        }
      default:
        return this.mapper.get(offset);
    }
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
  }

  public setWord(offset: number, value: number): void {
    this.setByte(offset, value & 0xFF);
    this.setByte(offset + 1, value >> 8);
  }
}
