import { OPEN_BUS } from 'cpu/MMU';
import { warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';

import AbstractMapper from './AbstractMapper';
import { MapperOptions, NameTableMirroring } from './Mapper';

export default abstract class GenericMapper extends AbstractMapper {
  private nameTableMirroring: NameTableMirroring;

  constructor(options: MapperOptions) {
    super(options);
    this.nameTableMirroring = options.nameTableMirroring;
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      return this.getPrgRomByte(offset);
    } else if (offset >= 0x6000) {
      return this.getPrgRamByte(offset);
    } else {
      warn('Attempted read from unexpected mapper location');
      return OPEN_BUS;
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x8000) {
      this.setRegisterValue(offset, value);
    } else if (offset >= 0x6000) {
      this.setPrgRamByte(offset, value);
    } else {
      warn('Attempted write to unexpected mapper location');
    }
  }

  public getPattern(index: number): Pattern {
    return this.chr[index];
  }

  public getNameTable(index: number): NameTable {
    if (this.nameTableMirroring === NameTableMirroring.Vertical) {
      return this.nameTables[index & 1];
    } else {
      return this.nameTables[index >> 1];
    }
  }

  protected abstract getPrgRomByte(offset: number): number;

  protected getPrgRamByte(offset: number): number {
    return OPEN_BUS;
  }

  protected setPrgRamByte(offset: number, value: number): void {
    // No RAM
  }

  protected abstract setRegisterValue(offset: number, value: number): void;
}
