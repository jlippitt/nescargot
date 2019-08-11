import { debug, toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from './AbstractMapper';
import { MapperOptions } from './Mapper';

const PRG_BANK_SIZE = 8192;
const CHR_BANK_SIZE = 64;

export default class MMC5 extends AbstractMapper {
  private prgMode: number = 3;
  private chrMode: number = 3;
  private prgRegister: number[];
  private prgArea: Uint8Array[];
  private prgOffset: number[];
  private chrRegister: number[];
  private chrOffset: number[];
  private nameTableOffset: number[];

  constructor(options: MapperOptions) {
    super(options);
    this.prgRegister = [0, 0, 0, 0, 0xff];
    this.prgArea = Array(5).fill(this.prgRom);
    this.prgOffset = Array(5).fill(0);
    this.chrRegister = Array(12).fill(0);
    this.chrOffset = Array(16).fill(0);
    this.nameTableOffset = Array(4).fill(0);
    this.updatePrgBanks();
    this.updateChrBanks();
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x6000) {
      const index = ((offset & 0xe000) >> 13) - 3;
      return this.prgArea[index][this.prgOffset[index] | (offset & 0x1fff)];
    } else {
      throw new Error('Unexpected mapper read');
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x6000) {
      // TODO: PRG RAM protection?
      const index = ((offset & 0xe000) >> 13) - 3;
      if (this.prgArea[index] === this.prgRam) {
        this.prgRam[this.prgOffset[index] | (offset & 0x1fff)] = value;
      }
    } else {
      this.setRegisterValue(offset, value);
    }
  }

  public getPattern(index: number): Pattern {
    // TODO: Higher pattern tables?
    return this.chr[this.chrOffset[(index & 0x01c0) >> 6] | (index & 0x003f)];
  }

  public getNameTable(index: number): NameTable {
    return this.nameTables[this.nameTableOffset[index]];
  }

  private setRegisterValue(offset: number, value: number): void {
    debug(`MMC5 register write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);

    if (offset >= 0x5000 && offset < 0x5100) {
      debug('MMC5 audio not implemented');
      return;
    }

    switch (offset) {
      case 0x5100:
        this.prgMode = value & 0x03;
        debug(`PRG Mode ${this.prgMode}`);
        this.updatePrgBanks();
        break;

      case 0x5101:
        this.chrMode = value & 0x03;
        debug(`CHR Mode ${this.chrMode}`);
        break;

      case 0x5104:
        debug('Extended RAM mode setting ignored');
        break;

      case 0x5105:
        if ((value & 0xaaaa) !== 0) {
          warn(`Unsupported name table options selected: ${toHex(value, 2)}`);
        }
        this.nameTableOffset[0] = value & 0x01;
        this.nameTableOffset[1] = (value & 0x04) >> 2;
        this.nameTableOffset[2] = (value & 0x10) >> 4;
        this.nameTableOffset[3] = (value & 0x40) >> 6;
        debug('Name Tables:', this.nameTableOffset);
        break;

      case 0x5106:
      case 0x5107:
        debug('Fill mode not implemented');
        break;

      case 0x5113:
      case 0x5114:
      case 0x5115:
      case 0x5116:
      case 0x5117:
        this.prgRegister[offset - 0x5113] = value;
        this.updatePrgBanks();
        break;

      case 0x5120:
      case 0x5121:
      case 0x5122:
      case 0x5123:
      case 0x5124:
      case 0x5125:
      case 0x5126:
      case 0x5127:
      case 0x5128:
      case 0x5129:
      case 0x512a:
      case 0x512b:
        this.chrRegister[offset - 0x5120] = value;
        this.updateChrBanks();
        break;

      case 0x5200:
        if (value > 0) {
          warn('Vertical split mode not implemented');
        }
        break;

      default:
        throw new Error(
          `Register not implemented: ${toHex(offset, 4)} <= ${toHex(value, 2)}`,
        );
    }
  }

  private updatePrgBanks(): void {
    this.setPrgBankValue(0, this.prgRegister[0] & 0x0f);

    switch (this.prgMode) {
      case 0:
        this.setPrgBankValue(1, (this.prgRegister[4] & 0xec) | 0xf0);
        this.setPrgBankValue(2, (this.prgRegister[4] & 0xec) | 0xf1);
        this.setPrgBankValue(3, (this.prgRegister[4] & 0xec) | 0xf2);
        this.setPrgBankValue(4, (this.prgRegister[4] & 0xec) | 0xf3);
        break;

      case 1:
        this.setPrgBankValue(1, this.prgRegister[2] & 0xfe);
        this.setPrgBankValue(2, (this.prgRegister[2] & 0xfe) | 0x01);
        this.setPrgBankValue(3, (this.prgRegister[4] & 0xee) | 0xf0);
        this.setPrgBankValue(4, (this.prgRegister[4] & 0xee) | 0xf1);
        break;

      case 2:
        this.setPrgBankValue(1, this.prgRegister[2] & 0xfe);
        this.setPrgBankValue(2, (this.prgRegister[2] & 0xfe) | 0x01);
        this.setPrgBankValue(3, this.prgRegister[3]);
        this.setPrgBankValue(4, (this.prgRegister[4] & 0xef) | 0xf0);
        break;

      case 3:
        this.setPrgBankValue(1, this.prgRegister[1]);
        this.setPrgBankValue(2, this.prgRegister[2]);
        this.setPrgBankValue(3, this.prgRegister[3]);
        this.setPrgBankValue(4, (this.prgRegister[4] & 0xef) | 0xf0);
        break;

      default:
        throw new Error('Should not happen');
    }

    for (let i = 0; i < 5; ++i) {
      debug(this.getPrgBankInfo(i));
    }
  }

  private setPrgBankValue(index: number, value: number): void {
    if ((value & 0x80) !== 0) {
      this.prgArea[index] = this.prgRom;
      this.prgOffset[index] = this.getPrgRomOffset(value & 0x7f);
    } else {
      this.prgArea[index] = this.prgRam;
      this.prgOffset[index] = this.getPrgRamOffset(value & 0x0f);
    }
  }

  private getPrgBankInfo(index: number): string {
    const address = toHex(0x6000 + index * 0x2000, 2);
    const area = this.prgArea[index] === this.prgRom ? 'ROM' : 'RAM';

    return `PRG ${address} = ${area} = ${this.prgOffset[index]}`;
  }

  private getPrgRomOffset = (value: number): number =>
    (value * PRG_BANK_SIZE) % this.prgRom.length

  private getPrgRamOffset = (value: number): number =>
    (value * PRG_BANK_SIZE) % this.prgRam.length

  private updateChrBanks(): void {
    switch (this.chrMode) {
      case 0:
        // Lower banks
        for (let i = 0; i < 8; ++i) {
          this.chrOffset[i] = this.getChrOffset((this.chrRegister[7] << 3) + i);
        }

        // Upper banks
        for (let i = 0; i < 8; ++i) {
          this.chrOffset[8 + i] = this.getChrOffset(
            (this.chrRegister[11] << 3) + i,
          );
        }
        break;

      case 1:
        // Lower banks
        for (let i = 0; i < 2; ++i) {
          const index = i * 4;
          const value = this.chrRegister[index + 1] << 2;

          for (let j = 0; j < 4; ++j) {
            this.chrOffset[index + j] = this.getChrOffset(value + j);
          }
        }

        // Upper banks
        for (let i = 0; i < 2; ++i) {
          const index = 8 + i * 4;
          const value = this.chrRegister[11] << 2;

          for (let j = 0; j < 4; ++j) {
            this.chrOffset[index + j] = this.getChrOffset(value + j);
          }
        }
        break;

      case 2:
        // Lower banks
        for (let i = 0; i < 4; ++i) {
          const index = i * 2;
          const value = this.chrRegister[index + 1] << 1;
          this.chrOffset[index] = this.getChrOffset(value);
          this.chrOffset[index + 1] = this.getChrOffset(value + 1);
        }

        // Upper banks
        for (let i = 0; i < 4; ++i) {
          const index = 8 + i * 2;
          const value = this.chrRegister[9 + 2 * (i % 2)] << 1;
          this.chrOffset[index] = this.getChrOffset(value);
          this.chrOffset[index + 1] = this.getChrOffset(value + 1);
        }
        break;

      case 3:
        // Lower banks
        for (let i = 0; i < 8; ++i) {
          this.chrOffset[i] = this.getChrOffset(this.chrRegister[i]);
        }

        // Upper banks
        for (let i = 0; i < 8; ++i) {
          this.chrOffset[8 + i] = this.getChrOffset(
            this.chrRegister[8 + (i % 4)],
          );
        }
        break;

      default:
        throw new Error('Should not happen');
    }

    for (let i = 0; i < 16; ++i) {
      debug(`CHR ${i} = ${this.chrOffset[i]}`);
    }
  }

  private getChrOffset = (value: number): number =>
    (value * CHR_BANK_SIZE) % this.chr.length
}
