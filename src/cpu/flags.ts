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

  setZeroAndNegative(value: number): void {
    this.zero = value === 0;
    this.negative = (value & 0x80) !== 0;
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
