import Pattern from 'ppu/Pattern';

import GenericMapper from './GenericMapper';

const CHR_BANK_SIZE = 512;

export default class CNROM extends GenericMapper {
  private chrOffset: number = 0;

  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      return this.prgRom[(offset & 0x7fff) % this.prgRom.length];
    } else {
      return super.getPrgByte(offset);
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      this.chrOffset = (value * CHR_BANK_SIZE) % this.chr.length;
    } else {
      super.setPrgByte(offset, value);
    }
  }

  public getPattern(index: number): Pattern {
    return this.chr[this.chrOffset | index];
  }
}
