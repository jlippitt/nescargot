import NameTable from 'ppu/NameTable';

import GenericMapper from './GenericMapper';

const PRG_BANK_SIZE = 32768;

export default class AxROM extends GenericMapper {
  private prgOffset: number = 0;
  private nameTableIndex: number = 0;

  public getNameTable(index: number): NameTable {
    return this.nameTables[this.nameTableIndex];
  }

  protected getPrgRomByte(offset: number): number {
    return this.prgRom[this.prgOffset | (offset & 0x7fff)];
  }

  protected setRegisterValue(offset: number, value: number): void {
    this.prgOffset = ((value & 0x07) * PRG_BANK_SIZE) % this.prgRom.length;
    this.nameTableIndex = (value & 0x10) >> 4;
  }
}
