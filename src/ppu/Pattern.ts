import { times } from 'lodash';

const PATTERN_RAM_SIZE = 16;

export default class Pattern {
  private ram: Uint8Array;
  private pixels: number[][];

  constructor() {
    this.ram = new Uint8Array(PATTERN_RAM_SIZE);
    this.pixels = times(8, () => Array(8).fill(0));
  }

  public getRow(y: number): number[] {
    return this.pixels[y];
  }

  public getByte(offset: number): number {
    return this.ram[offset];
  }

  public setByte(offset: number, value: number): void {
    this.ram[offset] = value;

    const row = this.getRow(offset & 0x07);

    if ((offset & 0x08) !== 0) {
      for (let i = 0; i < 8; ++i) {
        row[i] = (row[i] & 0x01) | (((value >> (7 - i)) & 0x01) << 1);
      }
    } else {
      for (let i = 0; i < 8; ++i) {
        row[i] = (row[i] & 0x02) | ((value >> (7 - i)) & 0x01);
      }
    }
  }
}

export function createPatternTable(chrRomData: Uint8Array): Pattern[] {
  const patternTable: Pattern[] = [];

  for (let i = 0; i < chrRomData.length; i += PATTERN_RAM_SIZE) {
    const pattern = new Pattern();

    for (let j = 0; j < PATTERN_RAM_SIZE; ++j) {
      pattern.setByte(j, chrRomData[i + j]);
    }

    patternTable.push(pattern);
  }

  return patternTable;
}
