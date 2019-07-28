import { isEqual } from 'lodash';

import { debug } from 'log';
import NameTable, { createNameTables } from 'ppu/nameTable';
import PatternTable, { createPatternTables } from 'ppu/patternTable';

import MMC1 from './MMC1';
import NROM from './NROM';
import UxROM from './UxROM';

const INES_CONSTANT = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]);

export const PRG_BANK_SIZE = 16384;

const CHR_ROM_SIZE_MULTIPLIER = 8192;

export default interface Mapper {
  getPrgByte(offset: number): number;
  setPrgByte(offset: number, value: number): void;
  getChrByte(offset: number): number;
  setChrByte(offset: number, value: number): void;
  getPatternTables(): PatternTable[];
  getNameTables(): NameTable[];
}

export enum NameTableMirroring {
  Horizontal = 0,
  Vertical = 1,
}

export interface ROM {
  prgRom: Uint8Array;
  prgRam: Uint8Array;
  chrRom: PatternTable[];
  ciRam: NameTable[];
  nameTableMirroring: NameTableMirroring;
}

const availableMappers = [NROM, MMC1, UxROM];

export function createMapper(data: Uint8Array): Mapper {
  if (!isEqual(data.slice(0, 4), INES_CONSTANT)) {
    throw new Error('Not a valid INES ROM');
  }

  const prgRomSize = data[4] * PRG_BANK_SIZE;
  const chrRomSize = data[5] * CHR_ROM_SIZE_MULTIPLIER;

  const hasTrainer = (data[6] & 0x04) !== 0;

  const prgRomStart = 16 + (hasTrainer ? 512 : 0);
  const chrRomStart = prgRomStart + prgRomSize;

  const prgRomData = data.slice(prgRomStart, chrRomStart);
  const chrRomData = data.slice(chrRomStart, chrRomStart + chrRomSize);

  const nameTableCount = (data[6] & 0x08) !== 0 ? 4 : 2;

  const nameTableMirroring = (data[6] & 0x01) as NameTableMirroring;

  const mapperNumber = (data[7] & 0xf0) | ((data[6] & 0xf0) >> 4);

  const MapperConstructor = availableMappers[mapperNumber];

  if (!MapperConstructor) {
    throw new Error(`Unimplemented mapper number: ${mapperNumber}`);
  }

  debug(`Mapper Type: ${mapperNumber}`);
  debug(`PRG ROM Length: ${prgRomData.length}`);

  let chrRom: PatternTable[];

  if (chrRomData.length > 0) {
    debug(`CHR ROM Length: ${chrRomData.length}`);
    chrRom = createPatternTables(chrRomData);
  } else {
    debug('CHR RAM Enabled');
    chrRom = [new PatternTable(), new PatternTable()];
  }

  debug(`Nametable Mirroring: ${nameTableMirroring}`);

  return new MapperConstructor({
    prgRom: prgRomData,
    prgRam: new Uint8Array(8192),
    chrRom,
    ciRam: createNameTables(nameTableCount),
    nameTableMirroring,
  });
}
