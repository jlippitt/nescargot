import { debug, toHex, warn } from 'log';

import { OPEN_BUS } from 'cpu/MMU';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from '../AbstractMapper';
import { MapperOptions } from '../Mapper';

import IrqControl from './IrqControl';

const PRG_BANK_SIZE = 8192;
const CHR_BANK_SIZE = 64;

enum NameTableArrangement {
  VerticalMirroring = 0,
  HorizontalMirroring = 1,
  SingleScreenLower = 2,
  SingleScreenUpper = 3,
}

export default class VRC6 extends AbstractMapper {
  private prgOffset: number[];
  private prgRamEnabled: boolean = false;
  private chrOffset: number[];
  private nameTableArrangement: NameTableArrangement;
  private irqControl: IrqControl;

  constructor(options: MapperOptions) {
    super(options);
    this.prgOffset = [0, PRG_BANK_SIZE, 0, this.prgRom.length - PRG_BANK_SIZE];
    this.chrOffset = Array(8).fill(0);
    this.nameTableArrangement = NameTableArrangement.VerticalMirroring;
    this.irqControl = new IrqControl(options.interrupt);
    debug('VRC6 PRG Banks:', this.prgOffset);
    debug('VRC6 CHR Banks:', this.chrOffset);
    debug('VRC6 Name Tables:', this.nameTableArrangement);
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
    return this.chr[this.chrOffset[(index & 0x01c0) >> 6] | (index & 0x3f)];
  }

  public getNameTable(index: number): NameTable {
    switch (this.nameTableArrangement) {
      case NameTableArrangement.VerticalMirroring:
        return this.nameTables[index & 1];

      case NameTableArrangement.HorizontalMirroring:
        return this.nameTables[index >> 1];

      case NameTableArrangement.SingleScreenLower:
        return this.nameTables[0];

      case NameTableArrangement.SingleScreenUpper:
        return this.nameTables[1];
    }
  }

  public tick(cpuTicks: number): void {
    this.irqControl.tick(cpuTicks);
  }

  private setRegisterValue(offset: number, value: number): void {
    const subRegister = offset & 0x03;

    switch (offset & 0xf000) {
      case 0x8000:
        this.prgOffset[0] = this.getPrgOffset((value & 0x0f) << 1);
        this.prgOffset[1] = this.getPrgOffset(((value & 0x0f) << 1) | 0x01);
        debug('VRC6 PRG Banks:', this.prgOffset);
        break;

      case 0x9000:
        break;

      case 0xa000:
        break;

      case 0xb000:
        if (subRegister === 3) {
          // Only mode 0 is ever used in commercial games
          // TODO: Other modes?
          this.nameTableArrangement = ((value & 0x0c) >>
            2) as NameTableArrangement;
          this.prgRamEnabled = (value & 0x80) !== 0;
          debug('VRC6 Name Tables:', this.nameTableArrangement);
          debug('VRC6 PRG RAM Enabled:', this.prgRamEnabled);
        }
        break;

      case 0xc000:
        this.prgOffset[2] = this.getPrgOffset(value & 0x1f);
        debug('VRC6 PRG Banks:', this.prgOffset);
        break;

      case 0xd000:
        // Only mode 0 is ever used in commercial games
        // TODO: Other modes?
        this.chrOffset[subRegister] = this.getChrOffset(value);
        debug('VRC6 CHR Banks:', this.chrOffset);
        break;

      case 0xe000:
        // Only mode 0 is ever used in commercial games
        // TODO: Other modes?
        this.chrOffset[4 + subRegister] = this.getChrOffset(value);
        debug('VRC6 CHR Banks:', this.chrOffset);
        break;

      case 0xf000:
        this.irqControl.setByte(subRegister, value);
        break;

      default:
        throw new Error('Should not happen');
    }
  }

  private getPrgOffset = (index: number): number =>
    (index * PRG_BANK_SIZE) % this.prgRom.length

  private getChrOffset = (index: number): number =>
    (index * CHR_BANK_SIZE) % this.chr.length
}
