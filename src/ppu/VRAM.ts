import { debug, toHex } from 'log';
import Mapper from 'mapper/Mapper';

import PaletteTable from './PaletteTable';

export default class VRAM {
  private mapper: Mapper;
  private paletteTable: PaletteTable;
  private readBuffer: number;

  constructor(mapper: Mapper) {
    this.mapper = mapper;
    this.paletteTable = new PaletteTable();
    this.readBuffer = 0;
  }

  public getPaletteTable(): PaletteTable {
    return this.paletteTable;
  }

  public getByte(offset: number): number {
    let value: number;

    if (offset < 0x03f00) {
      value = this.readBuffer;
    } else {
      value = this.paletteTable.getByte(offset);
    }

    if (offset < 0x2000) {
      this.readBuffer = this.mapper.getChrByte(offset);
    } else {
      this.readBuffer = this.mapper
        .getNameTable((offset & 0x0c00) >> 10)
        .getByte(offset & 0x03ff);
    }

    debug(`VRAM Read: ${toHex(offset, 4)} => ${toHex(value, 2)}`);

    return value;
  }

  public setByte(offset: number, value: number): void {
    debug(`VRAM Write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);

    if (offset < 0x2000) {
      this.mapper.setChrByte(offset, value);
    } else if (offset < 0x3f00) {
      this.mapper
        .getNameTable((offset & 0x0c00) >> 10)
        .setByte(offset & 0x03ff, value);
    } else {
      this.paletteTable.setByte(offset, value);
    }
  }
}
