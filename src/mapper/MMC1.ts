import { debug, toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import PatternTable from 'ppu/PatternTable';

import Mapper, { PRG_BANK_SIZE, ROM } from './Mapper';

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
  chrRomBankMode: ChrRomBankMode;
}

export default class MMC1 implements Mapper {
  private rom: ROM;
  private shift: ShiftRegister;
  private control: ControlRegister;
  private chrBank: PatternTable[];
  private prgOffset: number[];
  private prgRamEnabled: boolean = true;

  constructor(rom: ROM) {
    this.rom = rom;
    this.shift = new ShiftRegister();
    this.control = {
      nameTableArrangement: NameTableArrangement.SingleScreenLower,
      prgRomBankMode: PrgRomBankMode.SwitchLower,
      chrRomBankMode: ChrRomBankMode.SwitchAll,
    };
    this.chrBank = [rom.chrRom[0], rom.chrRom[1]];
    this.prgOffset = [0, this.getPrgOffset(0x0f)];
  }

  public getPrgByte(offset: number): number {
    const { prgRom, prgRam } = this.rom;

    if (offset >= 0x8000) {
      const address =
        this.prgOffset[(offset & 0x4000) >> 14] | (offset & 0x3fff);
      debug(`Mapped address: ${toHex(address, 4)}`);
      return prgRom[address];
    } else if (offset >= 0x6000) {
      return this.prgRamEnabled ? prgRam[offset & 0x1fff] : 0;
    } else {
      warn('Attempted read from unexpected mapper location');
      return 0;
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      debug('setPrgByte', toHex(value, 2));

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
    } else if (offset >= 0x6000) {
      if (this.prgRamEnabled) {
        this.rom.prgRam[offset & 0x1fff] = value;
      }
    } else {
      warn('Attempted write to unexpected mapper location');
    }
  }

  public getChrByte(offset: number): number {
    return this.chrBank[(offset & 0x1000) >> 12].getByte(offset & 0x0fff);
  }

  public setChrByte(offset: number, value: number): void {
    this.chrBank[(offset & 0x1000) >> 12].setByte(offset & 0x0fff, value);
  }

  public getPatternTables(): PatternTable[] {
    return [this.chrBank[0], this.chrBank[1]];
  }

  public getNameTables(): NameTable[] {
    const { ciRam } = this.rom;

    switch (this.control.nameTableArrangement) {
      case NameTableArrangement.SingleScreenLower:
        return [ciRam[0], ciRam[0], ciRam[0], ciRam[0]];
      case NameTableArrangement.SingleScreenUpper:
        return [ciRam[1], ciRam[1], ciRam[1], ciRam[1]];
      case NameTableArrangement.VerticalMirroring:
        return [ciRam[0], ciRam[1], ciRam[0], ciRam[1]];
      case NameTableArrangement.HorizontalMirroring:
        return [ciRam[0], ciRam[0], ciRam[1], ciRam[1]];
      default:
        throw new Error('Should not happen');
    }
  }

  private setMapperValue(offset: number, value: number): void {
    const { chrRom } = this.rom;

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

        this.control.chrRomBankMode =
          (value & 0x10) !== 0
            ? ChrRomBankMode.SwitchSeparate
            : ChrRomBankMode.SwitchAll;

        debug(`Name table arrangement: ${this.control.nameTableArrangement}`);
        debug(`PRG ROM bank mode: ${this.control.prgRomBankMode}`);
        debug(`PRG ROM Offset 0 = ${toHex(this.prgOffset[0], 4)}`);
        debug(`PRG ROM Offset 1 = ${toHex(this.prgOffset[1], 4)}`);
        debug(`CHR ROM bank mode: ${this.control.chrRomBankMode}`);

        break;
      case 0xa000:
        if (this.control.chrRomBankMode === ChrRomBankMode.SwitchAll) {
          this.chrBank[0] = chrRom[value & 0x1e];
          this.chrBank[1] = chrRom[(value & 0x1e) + 1];
        } else {
          this.chrBank[0] = chrRom[value];
        }
        debug(`CHR Bank 0 = ${chrRom.indexOf(this.chrBank[0])}`);
        debug(`CHR Bank 1 = ${chrRom.indexOf(this.chrBank[1])}`);
        break;
      case 0xc000:
        if (this.control.chrRomBankMode !== ChrRomBankMode.SwitchAll) {
          this.chrBank[1] = chrRom[value];
        }
        debug(`CHR Bank 0 = ${chrRom.indexOf(this.chrBank[0])}`);
        debug(`CHR Bank 1 = ${chrRom.indexOf(this.chrBank[1])}`);
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
    (value * PRG_BANK_SIZE) % this.rom.prgRom.length
}
