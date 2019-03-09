export default class Flags {
  public carry: boolean;
  public zero: boolean;
  public interrupt: boolean;
  public decimal: boolean;
  public overflow: boolean;
  public negative: boolean;

  constructor() {
    this.carry = false;
    this.zero = false;
    this.interrupt = false;
    this.decimal = false;
    this.overflow = false;
    this.negative = false;
  }

  public setZeroAndNegative(value: number): void {
    this.zero = value === 0;
    this.negative = (value & 0x80) !== 0;
  }

  public toByte(breakFlag: boolean): number {
    let value = 0x20;
    value &= this.negative ? 0x80 : 0x00;
    value &= this.overflow ? 0x40 : 0x00;
    value &= breakFlag ? 0x10 : 0x00;
    value &= this.decimal ? 0x08 : 0x00;
    value &= this.interrupt ? 0x04 : 0x00;
    value &= this.zero ? 0x02 : 0x00;
    value &= this.carry ? 0x01 : 0x00;
    return value;
  }

  public toString(): string {
    let flagString = '';
    flagString += this.negative ? 'N' : '-';
    flagString += this.overflow ? 'V' : '-';
    flagString += '-';
    flagString += '-';
    flagString += this.decimal ? 'D' : '-';
    flagString += this.interrupt ? 'I' : '-';
    flagString += this.zero ? 'Z' : '-';
    flagString += this.carry ? 'C' : '-';
    return flagString;
  }
}
