import NameTable from 'ppu/NameTable';
import PatternTable from 'ppu/PatternTable';

import Mapper, { MapperOptions } from './Mapper';

export default abstract class AbstractMapper implements Mapper {
  protected prgRom: Uint8Array;
  protected prgRam: Uint8Array;
  protected chr: PatternTable[];
  protected nameTables: NameTable[];

  constructor({ prgRom, prgRam, chr, nameTables }: MapperOptions) {
    this.prgRom = prgRom;
    this.prgRam = prgRam;
    this.chr = chr;
    this.nameTables = nameTables;
  }

  public abstract getPrgByte(offset: number): number;

  public abstract setPrgByte(offset: number, value: number): void;

  public abstract getChrByte(offset: number): number;

  public abstract setChrByte(offset: number, value: number): void;

  public abstract getPatternTables(): PatternTable[];

  public abstract getNameTables(): NameTable[];
}
