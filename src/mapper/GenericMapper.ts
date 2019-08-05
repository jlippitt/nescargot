import { warn } from 'log';
import NameTable from 'ppu/NameTable';
import PatternTable from 'ppu/PatternTable';

import AbstractMapper from './AbstractMapper';
import { MapperOptions, NameTableMirroring } from './Mapper';

export default abstract class GenericMapper extends AbstractMapper {
  private nameTableMirroring: NameTableMirroring;

  constructor(options: MapperOptions) {
    super(options);
    this.nameTableMirroring = options.nameTableMirroring;
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x6000 && offset < 0x8000) {
      return this.prgRam[offset & 0x1fff];
    } else {
      warn('Attempted read from unexpected mapper location');
      return 0;
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0x6000 && offset < 0x8000) {
      this.prgRam[offset & 0x1fff] = value;
    } else {
      warn('Attempted write to unexpected mapper location');
    }
  }

  public getChrByte(offset: number): number {
    return this.chr[(offset & 0x1000) >> 12].getByte(offset & 0x0fff);
  }

  public setChrByte(offset: number, value: number): void {
    this.chr[(offset & 0x1000) >> 12].setByte(offset & 0x0fff, value);
  }

  public getPatternTables(): PatternTable[] {
    return [this.chr[0], this.chr[1]];
  }

  public getNameTables(): NameTable[] {
    if (this.nameTableMirroring === NameTableMirroring.Vertical) {
      return [
        this.nameTables[0],
        this.nameTables[1],
        this.nameTables[0],
        this.nameTables[1],
      ];
    } else {
      return [
        this.nameTables[0],
        this.nameTables[0],
        this.nameTables[1],
        this.nameTables[1],
      ];
    }
  }
}
