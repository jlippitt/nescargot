import { debug, toHex } from 'log';
import Mapper from 'mapper';

const HORIZONTAL_INCREMENT = 1;
const VERTICAL_INCREMENT = 32;

export default class VRAM {
  private mapper: Mapper;
  private address: number;
  private incrementAmount: number;

  constructor(mapper: Mapper) {
    this.mapper = mapper;
    this.address = 0x0000;
    this.incrementAmount = HORIZONTAL_INCREMENT;
  }

  public setIncrementType(vertical: boolean): void {
    this.incrementAmount = vertical ? VERTICAL_INCREMENT : HORIZONTAL_INCREMENT;
    debug(`VRAM Increment: ${this.incrementAmount}`);
  }

  public setAddressByte(value: number): void {
    // 16-bit address is set by writing two 8-bit values separately
    this.address = ((this.address & 0xff) << 8) | value;
    debug(`VRAM Address: ${toHex(this.address, 4)}`);
  }

  public getDataByte(): number {
    let value: number;

    if (this.address < 0x2000) {
      value = this.mapper.getChrByte(this.address);
    } else if (this.address < 0x3f00) {
      // TODO: Nametables
      value = 0;
    } else {
      // TODO: Palettes
      value = 0;
    }

    debug(`VRAM Read: ${toHex(this.address, 4)} => ${toHex(value, 2)}`);

    this.address = (this.address + this.incrementAmount) & 0x3fff;

    return value;
  }

  public setDataByte(value: number): void {
    if (this.address < 0x2000) {
      this.mapper.setChrByte(this.address, value);
    } else if (this.address < 0x3f00) {
      // TODO: Nametables
    } else {
      // TODO: Palettes
    }

    debug(`VRAM Write: ${toHex(this.address, 4)} <= ${toHex(value, 2)}`);

    this.address = (this.address + this.incrementAmount) & 0x3fff;
  }
}
