import { debug, toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from './AbstractMapper';
import { MapperOptions, NameTableMirroring } from './Mapper';

const PRG_BANK_SIZE = 8192;
const CHR_BANK_SIZE = 64;

export default class MMC3 extends AbstractMapper {
  private prgOffset: number[];
  private chrOffset: number[];
  private bankMap: number[];
  private nextBank: number = 0;
  private prgBankFlag: boolean = false;
  private chrBankFlag: boolean = false;
  private nameTableMirroring = NameTableMirroring.Vertical;
  private prgRamEnabled: boolean = false;
  private prgRamProtected: boolean = false;

  constructor(options: MapperOptions) {
    super(options);
    this.prgOffset = Array(4).fill(0);
    this.chrOffset = Array(8).fill(0);
    this.bankMap = Array(8).fill(0);
    this.updateBanks();
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      return this.prgRom[
        this.prgOffset[(offset & 0x6000) >> 13] | (offset & 0x1fff)
      ];
    } else if (offset >= 0x6000) {
      return this.prgRamEnabled ? this.prgRam[offset & 0x1fff] : 0;
    } else {
      throw new Error('Unexpected mapper write');
    }
  }

  public setPrgByte(offset: number, value: number): void {
    switch (offset & 0xe000) {
      case 0xe000:
        // TODO: IRQ support
        warn('MMC3 IRQ not yet supported');
        break;

      case 0xc000:
        // TODO: IRQ support
        warn('MMC3 IRQ not yet supported');
        break;

      case 0xa000:
        if (offset % 2 === 0) {
          this.nameTableMirroring =
            (value & 0x01) !== 0
              ? NameTableMirroring.Horizontal
              : NameTableMirroring.Vertical;
        } else {
          this.prgRamEnabled = (value & 0x80) !== 0;
          this.prgRamProtected = (value & 0x40) !== 0;
        }
        break;

      case 0x8000:
        if (offset % 2 === 0) {
          this.nextBank = value & 0x07;
          this.prgBankFlag = (value & 0x40) !== 0;
          this.chrBankFlag = (value & 0x80) !== 0;
          debug(`MMC3 next bank = ${this.nextBank}`);
          debug(`MMC3 PRG bank flag = ${this.prgBankFlag}`);
          debug(`MMC3 CHR bank flag = ${this.chrBankFlag}`);
          this.updateBanks();
        } else {
          debug(`MMC3 bank ${this.nextBank} = ${toHex(value, 2)}`);
          this.bankMap[this.nextBank] = value;
          this.updateBanks();
        }
        break;

      case 0x6000:
        if (this.prgRamEnabled && !this.prgRamProtected) {
          this.prgRam[offset & 0x1fff] = value;
        }
        break;

      default:
        throw new Error('Unexpected mapper write');
    }
  }

  public getPattern(index: number): Pattern {
    return this.chr[this.chrOffset[(index & 0x01c0) >> 6] | (index & 0x003f)];
  }

  public getNameTable(index: number): NameTable {
    if (this.nameTableMirroring === NameTableMirroring.Vertical) {
      return this.nameTables[index & 1];
    } else {
      return this.nameTables[index >> 1];
    }
  }

  private updateBanks(): void {
    // Large CHR banks
    for (let i = 0; i < 2; ++i) {
      const index = (this.chrBankFlag ? 4 : 0) + i * 2;
      this.chrOffset[index] = this.getChrOffset(this.bankMap[i] & 0xfe);
      this.chrOffset[index + 1] = this.getChrOffset(
        (this.bankMap[i] & 0xfe) | 0x01,
      );
    }

    // Small CHR banks
    for (let i = 0; i < 4; ++i) {
      const index = (this.chrBankFlag ? 0 : 4) + i;
      this.chrOffset[index] = this.getChrOffset(this.bankMap[2 + i]);
    }

    // Movable location PRG bank
    this.prgOffset[this.prgBankFlag ? 2 : 0] = this.getPrgOffset(
      this.bankMap[6] & 0x3f,
    );

    // Fixed location PRG bank
    this.prgOffset[1] = this.getPrgOffset(this.bankMap[7] & 0x3f);

    // Fixed offset PRG bank
    this.prgOffset[this.prgBankFlag ? 0 : 2] = this.getPrgOffset(-2);

    // Fixed upper bank
    this.prgOffset[3] = this.getPrgOffset(-1);

    debug('MMC3 PRG banks', this.prgOffset);
    debug('MMC3 CHR banks', this.chrOffset);
  }

  private getPrgOffset(bankIndex: number): number {
    if (bankIndex >= 0) {
      return (bankIndex * PRG_BANK_SIZE) % this.prgRom.length;
    } else {
      return this.prgRom.length + bankIndex * PRG_BANK_SIZE;
    }
  }

  private getChrOffset = (bankIndex: number): number =>
    (bankIndex * CHR_BANK_SIZE) % this.chr.length
}
