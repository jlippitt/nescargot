import NameTable from 'ppu/NameTable';

import GenericMapper from './GenericMapper';

const PRG_BANK_SIZE = 32768;

export default class AxROM extends GenericMapper {
  private prgOffset: number = 0;
  private nameTableIndex: number = 0;

  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      return this.prgRom[this.prgOffset | (offset & 0x7fff)];
    } else {
      return super.getPrgByte(offset);
    }
  }

  public setPrgByte(offset: number, value: number) {
    if (offset >= 0x8000) {
      this.prgOffset = ((value & 0x07) * PRG_BANK_SIZE) % this.prgRom.length;
      this.nameTableIndex = (value & 0x10) >> 4;
    } else {
      super.setPrgByte(offset, value);
    }
  }

  public getNameTable(index: number): NameTable {
    return this.nameTables[this.nameTableIndex];
  }
}
