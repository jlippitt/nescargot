import { debug, toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from '../AbstractMapper';
import { MapperOptions } from '../Mapper';

import ChrMapper from './ChrMapper';
import PrgMapper from './PrgMapper';

export default class MMC5 extends AbstractMapper {
  private prgMapper: PrgMapper;
  private chrMapper: ChrMapper;
  private nameTableOffset: number[];

  constructor(options: MapperOptions) {
    super(options);
    this.prgMapper = new PrgMapper({ rom: this.prgRom, ram: this.prgRam });
    this.chrMapper = new ChrMapper(this.chr);
    this.nameTableOffset = Array(4).fill(0);
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x6000) {
      return this.prgMapper.getByte(offset);
    } else if (offset === 0x5204) {
      warn('Scanline IRQ not yet implemented');
      return 0;
    } else {
      throw new Error(`Unexpected mapper read: ${toHex(offset, 4)}`);
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
        this.prgMapper.setMode(value);
        break;

      case 0x5101:
        this.chrMapper.setMode(value);
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
      case 0x5204:
        warn('Scanline IRQ not yet implemented');
        break;

      default:
        throw new Error(
          `Register not implemented: ${toHex(offset, 4)} <= ${toHex(value, 2)}`,
        );
    }
  }
}
