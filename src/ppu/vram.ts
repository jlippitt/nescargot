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
  private addressByteIndex: number;
  private incrementAmount: number;
  private paletteTable: PaletteTable;

  constructor(mapper: Mapper) {
    this.mapper = mapper;
    this.address = 0x0000;
    this.addressByteIndex = 0;
    this.incrementAmount = HORIZONTAL_INCREMENT;
    this.paletteTable = new PaletteTable();
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

  public resetAddressByte(): void {
    this.addressByteIndex = 0;
  }

  public setAddressByte(value: number): void {
    // 16-bit address is set by writing two 8-bit values separately
    switch (this.addressByteIndex) {
      case 0:
        // Set high byte
        this.address = (value & 0x3f) << 8;
        ++this.addressByteIndex;
        break;

      case 1:
        // Set low byte
        this.address |= value;
        ++this.addressByteIndex;
        break;

      default:
        // Do nothing
        break;
    }

    debug(`VRAM Address: ${toHex(this.address, 4)}`);
  }

  public getDataByte(): number {
    let value: number;

    if (this.address < 0x2000) {
      value = this.mapper.getChrByte(this.address);
    } else if (this.address < 0x3f00) {
      value = this.mapper
        .getNameTables()
        [(this.address & 0x0c00) >> 10].getByte(this.address & 0x03ff);
    } else {
      value = this.paletteTable.getByte(this.address);
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
