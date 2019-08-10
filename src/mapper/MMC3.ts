import { times } from 'lodash';

import Interrupt from 'Interrupt';
import { debug, toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';
import { PPUState } from 'ppu/PPU';

import AbstractMapper from './AbstractMapper';
import { MapperOptions, NameTableMirroring } from './Mapper';

const PRG_BANK_SIZE = 8192;
const CHR_BANK_SIZE = 64;

export default class MMC3 extends AbstractMapper {
  private interrupt: Interrupt;
  private prgOffset: number[];
  private chrOffset: number[];
  private bankMap: number[];
  private nextBank: number = 0;
  private prgBankFlag: boolean = false;
  private chrBankFlag: boolean = false;
  private nameTableMirroring = NameTableMirroring.Vertical;
  private prgRamEnabled: boolean = false;
  private prgRamProtected: boolean = false;
  private irqLatch: number = 0;
  private irqReload: boolean = false;
  private irqEnabled: boolean = false;
  private irqCounter: number = 0;

  constructor(options: MapperOptions) {
    super(options);
    this.interrupt = options.interrupt;
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
        if (offset % 2 === 0) {
          this.irqEnabled = true;
          debug('IRQ enabled');
        } else {
          this.irqEnabled = false;
          this.interrupt.clearIrq();
          debug('IRQ disabled');
        }
        break;

      case 0xc000:
        if (offset % 2 === 0) {
          this.irqLatch = value;
          debug(`IRQ latch = ${this.irqLatch}`);
        } else {
          this.irqReload = true;
          debug('IRQ reload requested');
        }
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
          debug(`PRG RAM Enabled = ${this.prgRamEnabled}`);
          debug(`PRG RAM Protected = ${this.prgRamProtected}`);
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

  public onPPUSpriteMemoryStart({ line, control, mask }: PPUState): void {
    if (
      mask.renderingEnabled &&
      control.backgroundPatternOffset === 0 &&
      control.spritePatternOffset !== 0
    ) {
      debug(`IRQ counter update on line ${line}, cycle 256`);
      this.updateIrqCounter();
    }
  }

  public onPPUBackgroundMemoryStart({ line, control, mask }: PPUState): void {
    if (
      mask.renderingEnabled &&
      control.spritePatternOffset === 0 &&
      control.backgroundPatternOffset !== 0
    ) {
      debug(`IRQ counter update on line ${line}, cycle 321`);
      this.updateIrqCounter();
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

  private updateIrqCounter(): void {
    if (this.irqReload || this.irqCounter === 0) {
      this.irqCounter = this.irqLatch;
      this.irqReload = false;
      debug(`IRQ counter = ${this.irqCounter}`);
    } else if (--this.irqCounter === 0 && this.irqEnabled) {
      debug('IRQ triggered');
      this.interrupt.triggerIrq();
    }
  }
}
