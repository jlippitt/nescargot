import GenericMapper from './GenericMapper';

export default class NROM extends GenericMapper {
  protected getPrgRomByte(offset: number): number {
    return this.prgRom[(offset & 0x7fff) % this.prgRom.length];
  }

  protected setRegisterValue(offset: number, value: number): void {
    // NROM has no registers
  }
}
