import { OPEN_BUS } from 'cpu/MMU';
import { debug, toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';
import { PPUState } from 'ppu/PPU';

import AbstractMapper from '../AbstractMapper';
import { MapperOptions } from '../Mapper';

import ChrMapper from './ChrMapper';
import IrqControl from './IrqControl';
import PrgMapper from './PrgMapper';

export default class MMC5 extends AbstractMapper {
  private prgMapper: PrgMapper;
  private chrMapper: ChrMapper;
  private irqControl: IrqControl;
  private selectedNameTables: NameTable[];
  private fillMode: NameTable;
  private expansionRam: NameTable;

  constructor(options: MapperOptions) {
    super(options);
    this.prgMapper = new PrgMapper({ rom: this.prgRom, ram: this.prgRam });
    this.chrMapper = new ChrMapper(this.chr);
    this.irqControl = new IrqControl(options.interrupt);
    this.selectedNameTables = Array(4).fill(this.nameTables[0]);
    this.fillMode = new NameTable();
    this.expansionRam = new NameTable();
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x6000) {
      if ((offset & 0xfffe) === 0xfffa) {
        this.irqControl.reset();
      }
      return this.prgMapper.getByte(offset);
    } else if (offset === 0x5204) {
      return this.irqControl.getStatus();
    } else {
      warn(`Unexpected mapper read: ${toHex(offset, 4)}`);
      return OPEN_BUS;
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x6000) {
      this.prgMapper.setByte(offset, value);
    } else {
      this.setRegisterValue(offset, value);
    }
  }

  public getPattern(index: number): Pattern {
    return this.chrMapper.getPattern(index);
  }

  public getNameTable(index: number): NameTable {
    return this.selectedNameTables[index];
  }

  public onPPULineStart(state: PPUState): void {
    this.irqControl.onPPULineStart(state);
  }

  public onPPUBackgroundRenderStart(state: PPUState): void {
    this.chrMapper.onPPUBackgroundRenderStart(state);
  }

  public onPPUSpriteRenderStart(state: PPUState): void {
    this.chrMapper.onPPUSpriteRenderStart(state);
  }

  private setRegisterValue(offset: number, value: number): void {
    debug(`MMC5 register write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);

    if (offset >= 0x5c00) {
      this.expansionRam.setByte(offset & 0x03ff, value);
      return;
    }

    if (offset >= 0x5000 && offset < 0x5100) {
      debug('MMC5 audio not implemented');
      return;
    }

    switch (offset) {
      case 0x5100:
        this.prgMapper.setMode(value);
        break;

      case 0x5101:
        this.chrMapper.setMode(value);
        break;

      case 0x5104:
        if (value > 0) {
          warn('Extended RAM modes other than Mode 0 are not implemented');
        }
        break;

      case 0x5105:
        this.selectNameTable(0, value & 0x03);
        this.selectNameTable(1, (value & 0x0c) >> 2);
        this.selectNameTable(2, (value & 0x30) >> 4);
        this.selectNameTable(3, (value & 0xc0) >> 6);
        break;

      case 0x5106:
        for (let i = 0x0000; i < 0x03c0; ++i) {
          this.fillMode.setByte(i, value);
        }
        break;

      case 0x5107: {
        const attributeValue =
          ((value & 0x03) << 6) |
          ((value & 0x03) << 4) |
          ((value & 0x03) << 2) |
          (value & 0x03);

        for (let i = 0x03c0; i < 0x0400; ++i) {
          this.fillMode.setByte(i, attributeValue);
        }
        break;
      }

      case 0x5113:
      case 0x5114:
      case 0x5115:
      case 0x5116:
      case 0x5117:
        this.prgMapper.setRegister(offset - 0x5113, value);
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
        this.chrMapper.setRegister(offset - 0x5120, value);
        break;

      case 0x5200:
        if (value > 0) {
          warn('Vertical split mode not implemented');
        }
        break;

      case 0x5203:
        this.irqControl.setScanline(value);
        break;

      case 0x5204:
        this.irqControl.setEnabled((value & 0x80) !== 0);
        break;

      default:
        throw new Error(
          `Register not implemented: ${toHex(offset, 4)} <= ${toHex(value, 2)}`,
        );
    }
  }

  private selectNameTable(index: number, value: number): void {
    switch (value) {
      case 0:
      case 1:
        // Regular VRAM-accessible name tables
        this.selectedNameTables[index] = this.nameTables[value];
        break;

      case 2:
        // Extended RAM name table
        this.selectedNameTables[index] = this.expansionRam;
        break;

      case 3:
        // Fill mode
        this.selectedNameTables[index] = this.fillMode;
        break;

      default:
        throw new Error('Should not happen');
    }
  }
}
