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
    // TODO
    return 0;
  }

  public setChrByte(offset: number, value: number): void {
    // TODO
  }

  public getPatternTable(index: number): PatternTable {
    // TODO
    return this.rom.chrRom[0];
  }
}
