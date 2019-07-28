import GenericMapper from './GenericMapper';
import Mapper, { PRG_BANK_SIZE, ROM } from './Mapper';

export default class UxROM extends GenericMapper implements Mapper {
  private upperBankOffset: number;
  private lowerBankOffset: number;

  constructor(rom: ROM) {
    super(rom);
    this.upperBankOffset = rom.prgRom.length - PRG_BANK_SIZE;
    this.lowerBankOffset = 0;
  }

  public getPrgByte(offset: number): number {
    const { prgRom } = this.rom;

    if (offset >= 0xc000) {
      return prgRom[this.upperBankOffset | (offset & 0x3fff)];
    } else if (offset >= 0x8000) {
      return prgRom[this.lowerBankOffset | (offset & 0x3fff)];
    } else {
      return super.getPrgByte(offset);
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      this.lowerBankOffset = (value * PRG_BANK_SIZE) % this.rom.prgRom.length;
    } else {
      super.setPrgByte(offset, value);
    }
  }
}
