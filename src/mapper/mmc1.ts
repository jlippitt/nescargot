import { debug, toHex } from 'log';
import NameTable from 'ppu/nameTable';
import PatternTable from 'ppu/patternTable';

import Mapper, { ROM } from './index';

const PRG_BANK_SIZE = 16384;

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
      return prgRom[
        this.prgOffset[(offset & 0x4000) >> 14] + (offset & 0x3fff)
      ];
    } else if (offset >= 0x6000) {
      return prgRam[offset & 0x1fff];
    } else {
      throw new Error('Attempted read from unexpected mapper location');
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      if ((value & 0x80) !== 0) {
        this.shift.reset();
        return;
      }

      const shiftValue = this.shift.writeBit(value & 0x01);

      if (shiftValue !== undefined) {
        this.setMapperValue(offset, shiftValue);
      }
    } else if (offset >= 0x6000 && offset < 0x8000) {
      this.rom.prgRam[offset & 0x1fff] = value;
    } else {
      throw new Error('Attempted write to unexpected mapper location');
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
      case NameTableArrangement.VerticalMirroring:
        return [ciRam[0], ciRam[0], ciRam[0], ciRam[0]];
      case NameTableArrangement.HorizontalMirroring:
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

        if ((value & 0x08) !== 0) {
          this.control.prgRomBankMode =
            (value & 0x04) !== 0
              ? PrgRomBankMode.SwitchLower
              : PrgRomBankMode.SwitchUpper;
        } else {
          this.control.prgRomBankMode = PrgRomBankMode.SwitchAll;
        }

        this.control.chrRomBankMode =
          (value & 0x10) !== 0
            ? ChrRomBankMode.SwitchSeparate
            : ChrRomBankMode.SwitchAll;

        debug(`Name table arrangement: ${this.control.nameTableArrangement}`);
        debug(`PRG ROM bank mode: ${this.control.prgRomBankMode}`);
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
        debug(`PRG ROM Offset 0 = ${toHex(this.prgOffset[0], 4)}`);
        debug(`PRG ROM Offset 1 = ${toHex(this.prgOffset[1], 4)}`);

        // TODO: Enable/disable PRG RAM?
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  private getPrgOffset = (value: number): number =>
    (value * PRG_BANK_SIZE) % this.rom.prgRom.length
}
