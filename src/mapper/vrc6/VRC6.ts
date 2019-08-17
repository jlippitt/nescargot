import { debug, toHex, warn } from 'log';

import { OPEN_BUS } from 'cpu/MMU';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from '../AbstractMapper';
import { MapperOptions } from '../Mapper';

const PRG_BANK_SIZE = 8192;

export default class VRC6 extends AbstractMapper {
  private prgOffset: number[];
  private prgRamEnabled: boolean = false;

  constructor(options: MapperOptions) {
    super(options);
    this.prgOffset = [0, PRG_BANK_SIZE, 0, this.prgRom.length - PRG_BANK_SIZE];
    debug('VRC6 PRG Banks:', this.prgOffset);
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      return this.prgRom[
        this.prgOffset[(offset & 0x6000) >> 13] | (offset & 0x1fff)
      ];
    } else if (offset >= 0x6000) {
      return this.prgRamEnabled ? this.prgRam[offset & 0x1fff] : OPEN_BUS;
    } else {
      warn(`Unexpected mapper read: ${toHex(offset, 4)}`);
      return OPEN_BUS;
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      this.setRegisterValue(offset, value);
    } else if (offset >= 0x6000) {
      if (this.prgRamEnabled) {
        this.prgRam[offset & 0x1fff] = value;
      }
    } else {
      warn(
        `Unexpected mapper write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`,
      );
    }
  }

  public getPattern(index: number): Pattern {
    // TODO
    return this.chr[index];
  }

  public getNameTable(index: number): NameTable {
    // TODO
    return this.nameTables[index & 1];
  }

  private setRegisterValue(offset: number, value: number): void {
    const subRegister = offset & 0x03;

    switch (offset & 0xf000) {
      case 0x8000:
        this.prgOffset[0] = this.getPrgOffset(value << 1);
        this.prgOffset[1] = this.getPrgOffset((value << 1) | 0x01);
        debug('VRC6 PRG Banks:', this.prgOffset);
        break;

      case 0x9000:
        break;

      case 0xa000:
        break;

      case 0xb000:
        if (subRegister === 3) {
          this.prgRamEnabled = (value & 0x80) !== 0;
          debug('VRC6 PRG RAM Enabled:', this.prgRamEnabled);
        }
        break;

      case 0xc000:
        this.prgOffset[2] = this.getPrgOffset(value);
        debug('VRC6 PRG Banks:', this.prgOffset);
        break;

      case 0xd000:
        break;

      case 0xe000:
        break;

      case 0xf000:
        break;

      default:
        throw new Error('Should not happen');
    }
  }

  private getPrgOffset = (index: number): number =>
    (index * PRG_BANK_SIZE) % this.prgRom.length
}
