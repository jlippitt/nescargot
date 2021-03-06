import { OPEN_BUS } from 'cpu/MMU';
import { debug, toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from './AbstractMapper';
import { MapperOptions, PRG_BANK_SIZE } from './Mapper';

const CHR_BANK_SIZE = 256;

enum NameTableArrangement {
  SingleScreenLower = 0,
  SingleScreenUpper = 1,
  VerticalMirroring = 2,
  HorizontalMirroring = 3,
}

enum PrgRomBankMode {
  SwitchAll = 0,
  SwitchUpper = 2,
  SwitchLower = 3,
}

enum ChrRomBankMode {
  SwitchAll = 0,
  SwitchSeparate = 1,
}

class ShiftRegister {
  private value: number = 0;
  private writeCount: number = 0;

  public reset(): void {
    this.value = 0;
    this.writeCount = 0;
  }

  public writeBit(bit: number): number | undefined {
    this.value |= bit << this.writeCount;
    debug(`Shift value: ${toHex(this.value, 2)}`);

    if (++this.writeCount === 5) {
      const value = this.value;
      this.reset();
      return value;
    }

    debug(`Write count: ${this.writeCount}`);
  }
}

interface ControlRegister {
  nameTableArrangement: NameTableArrangement;
  prgRomBankMode: PrgRomBankMode;
  chrBankMode: ChrRomBankMode;
}

export default class MMC1 extends AbstractMapper {
  private shift: ShiftRegister;
  private control: ControlRegister;
  private prgOffset: number[];
  private prgRamEnabled: boolean = true;
  private chrOffset: number[];
  private successiveWriteLatch: boolean = false;

  constructor(options: MapperOptions) {
    super(options);
    this.shift = new ShiftRegister();
    this.control = {
      nameTableArrangement: NameTableArrangement.SingleScreenLower,
      prgRomBankMode: PrgRomBankMode.SwitchLower,
      chrBankMode: ChrRomBankMode.SwitchAll,
    };
    this.prgOffset = [0, this.getPrgOffset(0x0f)];
    this.chrOffset = [0, CHR_BANK_SIZE];
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      const address =
        this.prgOffset[(offset & 0x4000) >> 14] | (offset & 0x3fff);
      debug(`Mapped address: ${toHex(address, 4)}`);
      return this.prgRom[address];
    } else if (offset >= 0x6000) {
      return this.prgRamEnabled ? this.prgRam[offset & 0x1fff] : OPEN_BUS;
    } else {
      warn(
        `Attempted read from unexpected mapper location: ${toHex(offset, 4)}`,
      );
      return OPEN_BUS;
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      debug('setPrgByte', toHex(value, 2));

      if (this.successiveWriteLatch) {
        warn('Successive MMC1 writes');
        return;
      }

      if ((value & 0x80) !== 0) {
        debug('Reset');
        this.shift.reset();
        this.control.prgRomBankMode = PrgRomBankMode.SwitchLower;
        this.prgOffset[1] = this.getPrgOffset(0x0f);
        debug(`PRG ROM bank mode: ${this.control.prgRomBankMode}`);
        debug(`PRG ROM Offset 0 = ${toHex(this.prgOffset[0], 4)}`);
        debug(`PRG ROM Offset 1 = ${toHex(this.prgOffset[1], 4)}`);
        return;
      }

      const shiftValue = this.shift.writeBit(value & 0x01);

      if (shiftValue !== undefined) {
        this.setMapperValue(offset, shiftValue);
      }

      this.successiveWriteLatch = true;
    } else if (offset >= 0x6000) {
      if (this.prgRamEnabled) {
        this.prgRam[offset & 0x1fff] = value;
      }
    } else {
      warn(
        `Attempted write to unexpected mapper location: ${toHex(
          offset,
          4,
        )} <= ${toHex(value, 2)}`,
      );
    }
  }

  public getPattern(index: number): Pattern {
    return this.chr[this.chrOffset[index >> 8] | (index & 0xff)];
  }

  public getNameTable(index: number): NameTable {
    switch (this.control.nameTableArrangement) {
      case NameTableArrangement.SingleScreenLower:
        return this.nameTables[0];
      case NameTableArrangement.SingleScreenUpper:
        return this.nameTables[1];
      case NameTableArrangement.VerticalMirroring:
        return this.nameTables[index & 1];
      case NameTableArrangement.HorizontalMirroring:
        return this.nameTables[index >> 1];
      default:
        throw new Error('Should not happen');
    }
  }

  public tick(): void {
    this.successiveWriteLatch = false;
  }

  private setMapperValue(offset: number, value: number): void {
    debug(`Mapper write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);

    switch (offset & 0xe000) {
      case 0x8000:
        this.control.nameTableArrangement = (value &
          0x03) as NameTableArrangement;

        switch (value & 0x0c) {
          case 0x0c:
            this.control.prgRomBankMode = PrgRomBankMode.SwitchLower;
            this.prgOffset[1] = this.getPrgOffset(0x0f);
            break;
          case 0x08:
            this.control.prgRomBankMode = PrgRomBankMode.SwitchUpper;
            this.prgOffset[0] = 0;
            break;
          default:
            this.control.prgRomBankMode = PrgRomBankMode.SwitchAll;
        }

        this.control.chrBankMode =
          (value & 0x10) !== 0
            ? ChrRomBankMode.SwitchSeparate
            : ChrRomBankMode.SwitchAll;

        debug(`Name table arrangement: ${this.control.nameTableArrangement}`);
        debug(`PRG ROM bank mode: ${this.control.prgRomBankMode}`);
        debug(`PRG ROM Offset 0 = ${toHex(this.prgOffset[0], 4)}`);
        debug(`PRG ROM Offset 1 = ${toHex(this.prgOffset[1], 4)}`);
        debug(`CHR ROM bank mode: ${this.control.chrBankMode}`);

        break;
      case 0xa000:
        if (this.control.chrBankMode === ChrRomBankMode.SwitchAll) {
          this.chrOffset[0] = this.getChrOffset(value & 0x1e);
          this.chrOffset[1] = this.getChrOffset((value & 0x1e) | 0x01);
        } else {
          this.chrOffset[0] = this.getChrOffset(value);
        }
        debug(`CHR Offset 0 = ${this.chrOffset[0]}`);
        debug(`CHR Offset 1 = ${this.chrOffset[1]}`);
        break;
      case 0xc000:
        if (this.control.chrBankMode !== ChrRomBankMode.SwitchAll) {
          this.chrOffset[1] = this.getChrOffset(value);
        }
        debug(`CHR Offset 0 = ${this.chrOffset[0]}`);
        debug(`CHR Offset 1 = ${this.chrOffset[1]}`);
        break;
      case 0xe000:
        if (this.control.prgRomBankMode === PrgRomBankMode.SwitchLower) {
          this.prgOffset[0] = this.getPrgOffset(value & 0x0f);
        } else if (this.control.prgRomBankMode === PrgRomBankMode.SwitchUpper) {
          this.prgOffset[1] = this.getPrgOffset(value & 0x0f);
        } else {
          this.prgOffset[0] = this.getPrgOffset(value & 0x0e);
          this.prgOffset[1] = this.getPrgOffset((value & 0x0e) + 1);
        }

        this.prgRamEnabled = (value & 0x10) === 0;

        debug(`PRG ROM Offset 0 = ${toHex(this.prgOffset[0], 4)}`);
        debug(`PRG ROM Offset 1 = ${toHex(this.prgOffset[1], 4)}`);
        debug(`PRG RAM Enabled = ${this.prgRamEnabled}`);
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  private getPrgOffset = (value: number): number =>
    (value * PRG_BANK_SIZE) % this.prgRom.length

  private getChrOffset = (value: number): number =>
    (value * CHR_BANK_SIZE) % this.chr.length
}
