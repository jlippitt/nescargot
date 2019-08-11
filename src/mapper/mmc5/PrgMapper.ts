import { debug, toHex } from 'log';

const BANK_SIZE = 8192;

export interface PrgMapperOptions {
  rom: Uint8Array;
  ram: Uint8Array;
}

export default class PrgMapper {
  private rom: Uint8Array;
  private ram: Uint8Array;
  private mode: number = 3;
  private register: number[];
  private area: Uint8Array[];
  private offset: number[];

  constructor({ rom, ram }: PrgMapperOptions) {
    this.rom = rom;
    this.ram = ram;
    this.register = [0, 0, 0, 0, 0xff];
    this.area = Array(5).fill(this.rom);
    this.offset = Array(5).fill(0);
    this.updateBanks();
  }

  public getByte(offset: number): number {
    const index = ((offset & 0xe000) >> 13) - 3;

    return this.area[index][this.offset[index] | (offset & 0x1fff)];
  }

  public setByte(offset: number, value: number): void {
    const index = ((offset & 0xe000) >> 13) - 3;

    if (this.area[index] === this.ram) {
      this.area[index][this.offset[index] | (offset & 0x1fff)] = value;
    }
  }

  public setMode(value: number): void {
    this.mode = value & 0x03;
    debug(`PRG Mode ${this.mode}`);
    this.updateBanks();
  }

  public setRegister(index: number, value: number): void {
    this.register[index] = value;
    this.updateBanks();
  }

  private updateBanks(): void {
    this.setBankValue(0, this.register[0] & 0x0f);

    switch (this.mode) {
      case 0:
        this.setBankValue(1, (this.register[4] & 0xec) | 0xf0);
        this.setBankValue(2, (this.register[4] & 0xec) | 0xf1);
        this.setBankValue(3, (this.register[4] & 0xec) | 0xf2);
        this.setBankValue(4, (this.register[4] & 0xec) | 0xf3);
        break;

      case 1:
        this.setBankValue(1, this.register[2] & 0xfe);
        this.setBankValue(2, (this.register[2] & 0xfe) | 0x01);
        this.setBankValue(3, (this.register[4] & 0xee) | 0xf0);
        this.setBankValue(4, (this.register[4] & 0xee) | 0xf1);
        break;

      case 2:
        this.setBankValue(1, this.register[2] & 0xfe);
        this.setBankValue(2, (this.register[2] & 0xfe) | 0x01);
        this.setBankValue(3, this.register[3]);
        this.setBankValue(4, (this.register[4] & 0xef) | 0xf0);
        break;

      case 3:
        this.setBankValue(1, this.register[1]);
        this.setBankValue(2, this.register[2]);
        this.setBankValue(3, this.register[3]);
        this.setBankValue(4, (this.register[4] & 0xef) | 0xf0);
        break;

      default:
        throw new Error('Should not happen');
    }

    for (let i = 0; i < 5; ++i) {
      debug(this.getBankInfo(i));
    }
  }

  private setBankValue(index: number, value: number): void {
    if ((value & 0x80) !== 0) {
      this.area[index] = this.rom;
      this.offset[index] = this.getRomOffset(value & 0x7f);
    } else {
      this.area[index] = this.ram;
      this.offset[index] = this.getRamOffset(value & 0x0f);
    }
  }

  private getBankInfo(index: number): string {
    const address = toHex(0x6000 + index * 0x2000, 2);
    const area = this.area[index] === this.rom ? 'ROM' : 'RAM';

    return `PRG ${address} = ${area} = ${this.offset[index]}`;
  }

  private getRomOffset = (value: number): number =>
    (value * BANK_SIZE) % this.rom.length

  private getRamOffset = (value: number): number =>
    (value * BANK_SIZE) % this.ram.length
}
