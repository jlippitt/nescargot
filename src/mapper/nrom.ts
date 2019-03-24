import PatternTable from 'ppu/patternTable';

import Mapper, { ROM } from './index';

export default class NROM implements Mapper {
  private rom: ROM;

  constructor(rom: ROM) {
    this.rom = rom;
  }

  public getPrgByte(offset: number): number {
    const { prgRom } = this.rom;

    if (offset >= 0x8000) {
      return prgRom[(offset & 0x7fff) % prgRom.length];
    } else if (offset >= 0x6000) {
      throw new Error('PRG RAM not yet implemented');
    } else {
      throw new Error('Attempted read from unexpected mapper location');
    }
  }

  public setPrgByte(offset: number, value: number): void {
    throw new Error('PRG writes not yet implemented');
  }

  public getChrByte(offset: number): number {
    return this.rom.chrRom[(offset & 0x1000) >> 12].getByte(offset & 0x1fff);
  }

  public setChrByte(offset: number, value: number): void {
    this.rom.chrRom[(offset & 0x1000) >> 12].setByte(offset & 0x1fff, value);
  }

  public getPatternTable(index: number): PatternTable {
    return this.rom.chrRom[index];
  }
}
