import NameTable from 'ppu/nameTable';
import PatternTable from 'ppu/patternTable';

import Mapper, { NameTableMirroring, ROM } from './Mapper';

export default class GenericMapper implements Mapper {
  protected rom: ROM;

  constructor(rom: ROM) {
    this.rom = rom;
  }

  public getPrgByte(offset: number): number {
    const { prgRom, prgRam } = this.rom;

    if (offset >= 0x8000) {
      return prgRom[(offset & 0x7fff) % prgRom.length];
    } else if (offset >= 0x6000) {
      return prgRam[offset & 0x1fff];
    } else {
      throw new Error('Attempted read from unexpected mapper location');
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x6000 && offset < 0x8000) {
      this.rom.prgRam[offset & 0x1fff] = value;
    } else {
      throw new Error('Attempted write to unexpected mapper location');
    }
  }

  public getChrByte(offset: number): number {
    return this.rom.chrRom[(offset & 0x1000) >> 12].getByte(offset & 0x0fff);
  }

  public setChrByte(offset: number, value: number): void {
    this.rom.chrRom[(offset & 0x1000) >> 12].setByte(offset & 0x0fff, value);
  }

  public getPatternTables(): PatternTable[] {
    const { chrRom } = this.rom;
    return [chrRom[0], chrRom[1]];
  }

  public getNameTables(): NameTable[] {
    const { ciRam } = this.rom;

    if (this.rom.nameTableMirroring === NameTableMirroring.Vertical) {
      return [ciRam[0], ciRam[1], ciRam[0], ciRam[1]];
    } else {
      return [ciRam[0], ciRam[0], ciRam[1], ciRam[1]];
    }
  }
}
