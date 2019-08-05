import GenericMapper from './GenericMapper';

export default class NROM extends GenericMapper {
  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      return this.prgRom[(offset & 0x7fff) % this.prgRom.length];
    } else {
      return super.getPrgByte(offset);
    }
  }
}
