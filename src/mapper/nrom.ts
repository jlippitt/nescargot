import GenericMapper from './genericMapper';
import Mapper, { NameTableMirroring, ROM } from './index';

export default class NROM extends GenericMapper implements Mapper {
  public getPrgByte(offset: number): number {
    const { prgRom } = this.rom;

    if (offset >= 0x8000) {
      return prgRom[(offset & 0x7fff) % prgRom.length];
    } else {
      return super.getPrgByte(offset);
    }
  }
}
