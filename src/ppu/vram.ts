import { debug, toHex } from 'log';
import Mapper from 'mapper';

import NameTable from './nameTable';
import PaletteTable from './paletteTable';
import PatternTable from './patternTable';

const HORIZONTAL_INCREMENT = 1;
const VERTICAL_INCREMENT = 32;

export default class VRAM {
  private mapper: Mapper;
  private address: number;
  private incrementAmount: number;
  private paletteTable: PaletteTable;
  private readBuffer: number;

  constructor(mapper: Mapper) {
    this.mapper = mapper;
    this.address = 0x0000;
    this.incrementAmount = HORIZONTAL_INCREMENT;
    this.paletteTable = new PaletteTable();
    this.readBuffer = 0;
  }

  public getPatternTables(): PatternTable[] {
    return this.mapper.getPatternTables();
  }

  public getNameTables(): NameTable[] {
    return this.mapper.getNameTables();
  }

  public getPaletteTable(): PaletteTable {
    return this.paletteTable;
  }

  public setIncrementType(vertical: boolean): void {
    this.incrementAmount = vertical ? VERTICAL_INCREMENT : HORIZONTAL_INCREMENT;
    debug(`VRAM Increment: ${this.incrementAmount}`);
  }

  public setUpperAddressByte(value: number): void {
    this.address = (this.address & 0xff) | ((value & 0x3f) << 8);
    debug(`VRAM Address: ${toHex(this.address, 4)}`);
  }

  public setLowerAddressByte(value: number): void {
    this.address = (this.address & 0x3f00) | value;
    debug(`VRAM Address: ${toHex(this.address, 4)}`);
  }

  public getDataByte(): number {
    let value: number;

    if (this.address < 0x03f00) {
      value = this.readBuffer;
    } else {
      value = this.paletteTable.getByte(this.address);
    }

    if (this.address < 0x2000) {
      this.readBuffer = this.mapper.getChrByte(this.address);
    } else {
      this.readBuffer = this.mapper
        .getNameTables()
        [(this.address & 0x0c00) >> 10].getByte(this.address & 0x03ff);
    }

    debug(`VRAM Read: ${toHex(this.address, 4)} => ${toHex(value, 2)}`);

    this.address = (this.address + this.incrementAmount) & 0x3fff;

    return value;
  }

  public setDataByte(value: number): void {
    debug(`VRAM Write: ${toHex(this.address, 4)} <= ${toHex(value, 2)}`);

    if (this.address < 0x2000) {
      this.mapper.setChrByte(this.address, value);
    } else if (this.address < 0x3f00) {
      this.mapper
        .getNameTables()
        [(this.address & 0x0c00) >> 10].setByte(this.address & 0x03ff, value);
    } else {
      this.paletteTable.setByte(this.address, value);
    }

    this.address = (this.address + this.incrementAmount) & 0x3fff;
  }
}
