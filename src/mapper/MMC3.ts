import { times } from 'lodash';

import { debug, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from './AbstractMapper';
import { MapperOptions, NameTableMirroring } from './Mapper';

const PRG_BANK_SIZE = 8192;
const CHR_BANK_SIZE = 64;

export default class MMC3 extends AbstractMapper {
  private prgOffset: number[];
  private chrOffset: number[];
  private nextBank: number = 0;
  private prgBankMode: number = 0;
  private chrBankMode: number = 0;
  private nameTableMirroring = NameTableMirroring.Vertical;
  private prgRamEnabled: boolean = false;
  private prgRamProtected: boolean = false;

  constructor(options: MapperOptions) {
    super(options);
    this.prgOffset = [0, 0, this.getPrgOffset(-2), this.getPrgOffset(-1)];
    this.chrOffset = times(8, (i) => i * CHR_BANK_SIZE);
    debug('MMC3 PRG banks', this.prgOffset);
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
          this.prgBankMode = (value & 0x40) >> 6;
          this.chrBankMode = (value & 0x80) >> 7;
          const fixedOffsetBank = 2 - this.prgBankMode * 2;
          this.prgOffset[fixedOffsetBank] = this.getPrgOffset(-2);
          debug(`MMC3 next bank = ${this.nextBank}`);
          debug(`MMC3 PRG bank mode = ${this.prgBankMode}`);
          debug(`MMC3 CHR bank mode = ${this.chrBankMode}`);
          debug('MMC3 PRG banks', this.prgOffset);
        } else {
          this.selectBank(value);
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

  private selectBank(value: number): void {
    if (this.nextBank < 2) {
      // Large CHR banks
      const index = this.chrBankMode * 4 + this.nextBank * 2;
      this.chrOffset[index] = this.getChrOffset(value & 0xfe);
      this.chrOffset[index + 1] = this.getChrOffset((value & 0xfe) | 0x01);
    } else if (this.nextBank < 6) {
      // Small CHR banks
      const index = 2 + this.nextBank - this.chrBankMode * 4;
      this.chrOffset[index] = this.getChrOffset(value);
    } else if (this.nextBank === 6) {
      // Movable location PRG bank
      this.prgOffset[this.prgBankMode * 2] = this.getPrgOffset(value & 0x3f);
      debug('MMC3 PRG banks', this.prgOffset);
    } else {
      // Fixed location PRG bank
      this.prgOffset[1] = this.getPrgOffset(value & 0x3f);
      debug('MMC3 PRG banks', this.prgOffset);
    }
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
