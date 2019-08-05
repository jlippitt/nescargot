import GenericMapper from './GenericMapper';
import { MapperOptions, PRG_BANK_SIZE } from './Mapper';

export default class UxROM extends GenericMapper {
  private upperBankOffset: number;
  private lowerBankOffset: number;

  constructor(options: MapperOptions) {
    super(options);
    this.upperBankOffset = this.prgRom.length - PRG_BANK_SIZE;
    this.lowerBankOffset = 0;
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0xc000) {
      return this.prgRom[this.upperBankOffset | (offset & 0x3fff)];
    } else if (offset >= 0x8000) {
      return this.prgRom[this.lowerBankOffset | (offset & 0x3fff)];
    } else {
      return super.getPrgByte(offset);
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      this.lowerBankOffset = (value * PRG_BANK_SIZE) % this.prgRom.length;
    } else {
      super.setPrgByte(offset, value);
    }
  }
}
