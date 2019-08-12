import Pattern from 'ppu/Pattern';

import GenericMapper from './GenericMapper';

const CHR_BANK_SIZE = 512;

export default class CNROM extends GenericMapper {
  private chrOffset: number = 0;

  public getPattern(index: number): Pattern {
    return this.chr[this.chrOffset | index];
  }

  protected getPrgRomByte(offset: number): number {
    return this.prgRom[(offset & 0x7fff) % this.prgRom.length];
  }

  protected setRegisterValue(offset: number, value: number): void {
    this.chrOffset = (value * CHR_BANK_SIZE) % this.chr.length;
  }
}
