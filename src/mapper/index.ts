import { isEqual } from 'lodash';
import NameTable, { createNameTables } from 'ppu/nameTable';
import PatternTable, { createPatternTables } from 'ppu/patternTable';

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
  getNameTables(): NameTable[];
}

export enum NameTableMirroring {
  Horizontal,
  Vertical,
}

export interface ROM {
  prgRom: Uint8Array;
  chrRom: PatternTable[];
  ciRam: NameTable[];
  nameTableMirroring: NameTableMirroring;
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

  const nameTableCount = (data[6] & 0x08) !== 0 ? 4 : 2;

  const nameTableMirroring =
    (data[6] & 0x01) !== 0
      ? NameTableMirroring.Vertical
      : NameTableMirroring.Horizontal;

  return new NROM({
    prgRom: prgRomData,
    chrRom: createPatternTables(chrRomData),
    ciRam: createNameTables(nameTableCount),
    nameTableMirroring,
  });
}
