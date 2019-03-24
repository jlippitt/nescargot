import { isEqual } from 'lodash';
import PatternTable, { initChrRom } from 'ppu/patternTable';

import NROM from './nrom';

const INES_CONSTANT = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]);

const PRG_ROM_SIZE_MULTIPLIER = 16384;
const CHR_ROM_SIZE_MULTIPLIER = 8192;

export default interface Mapper {
  getPrgByte(offset: number): number;
  setPrgByte(offset: number, value: number): void;
  getChrByte(offset: number): number;
  setChrByte(offset: number, value: number): void;
  getPatternTable(index: number): PatternTable;
}

export interface ROM {
  prgRom: Uint8Array;
  chrRom: PatternTable[];
}

export function createMapper(data: Uint8Array): Mapper {
  if (!isEqual(data.slice(0, 4), INES_CONSTANT)) {
    throw new Error('Not a valid INES ROM');
  }

  const prgRomSize = data[4] * PRG_ROM_SIZE_MULTIPLIER;
  const chrRomSize = data[5] * CHR_ROM_SIZE_MULTIPLIER;

  const hasTrainer = (data[6] & 0x04) !== 0;

  const prgRomStart = 16 + (hasTrainer ? 512 : 0);
  const chrRomStart = prgRomStart + prgRomSize;

  const prgRomData = data.slice(prgRomStart, chrRomStart);
  const chrRomData = data.slice(chrRomStart, chrRomStart + chrRomSize);

  return new NROM({
    prgRom: prgRomData,
    chrRom: initChrRom(chrRomData),
  });
}
