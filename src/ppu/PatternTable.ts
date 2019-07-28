import { times } from 'lodash';

const PATTERN_RAM_SIZE = 4096;

export type Pattern = number[][];

export function createPatternTables(chrRomData: Uint8Array): PatternTable[] {
  const patternTables = [];

  for (let i = 0; i < chrRomData.length / PATTERN_RAM_SIZE; ++i) {
    const patternTable = new PatternTable();

    for (let j = 0; j < PATTERN_RAM_SIZE; ++j) {
      patternTable.setByte(j, chrRomData[i * PATTERN_RAM_SIZE + j]);
    }

    patternTables.push(patternTable);
  }

  return patternTables;
}

export default class PatternTable {
  private ram: number[];
  private patterns: Pattern[];

  constructor() {
    this.ram = Array(PATTERN_RAM_SIZE).fill(0);
    this.patterns = times(256, () => times(8, () => Array(8).fill(0)));
  }

  public getPattern(index: number): Pattern {
    return this.patterns[index];
  }

  public getByte(offset: number): number {
    return this.ram[offset];
  }

  public setByte(offset: number, value: number) {
    this.ram[offset] = value;

    const pattern = this.patterns[offset >> 4];
    const row = pattern[offset & 0x07];

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
