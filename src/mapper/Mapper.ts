import { isEqual, times } from 'lodash';

import Interrupt from 'Interrupt';
import { debug, toHex } from 'log';
import NameTable, { createNameTables } from 'ppu/NameTable';
import Pattern, { createPatternTable } from 'ppu/Pattern';
import { PPUState } from 'ppu/PPU';

import MMC1 from './MMC1';
import MMC3 from './MMC3';
import MMC5 from './mmc5/MMC5';
import NROM from './NROM';
import UxROM from './UxROM';

const INES_CONSTANT = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]);

export const PRG_BANK_SIZE = 16384;

const CHR_ROM_SIZE_MULTIPLIER = 8192;
const CHR_RAM_SIZE = 1024;

export default interface Mapper {
  getPrgByte(offset: number): number;
  setPrgByte(offset: number, value: number): void;
  getChrByte(offset: number): number;
  setChrByte(offset: number, value: number): void;
  getPattern(index: number): Pattern;
  getNameTable(index: number): NameTable;
  onPPUSpriteMemoryStart(state: PPUState): void;
  onPPUBackgroundMemoryStart(state: PPUState): void;
}

export enum NameTableMirroring {
  Horizontal = 0,
  Vertical = 1,
}

export interface MapperOptions {
  prgRom: Uint8Array;
  prgRam: Uint8Array;
  chr: Pattern[];
  nameTables: NameTable[];
  nameTableMirroring: NameTableMirroring;
  interrupt: Interrupt;
}

const availableMappers = [NROM, MMC1, UxROM, undefined, MMC3, MMC5];

export function createMapper(data: Uint8Array, interrupt: Interrupt): Mapper {
  if (!isEqual(data.slice(0, 4), INES_CONSTANT)) {
    throw new Error('Not a valid INES ROM');
  }

  debug('INES header', Array.from(data.slice(0, 16)).map((i) => toHex(i, 2)));

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

  let chr: Pattern[];

  if (chrRomData.length > 0) {
    debug(`CHR ROM Length: ${chrRomData.length}`);
    chr = createPatternTable(chrRomData);
  } else {
    debug('CHR RAM Enabled');
    chr = times(CHR_RAM_SIZE, () => new Pattern());
  }

  debug(`Nametable Mirroring: ${nameTableMirroring}`);

  return new MapperConstructor({
    prgRom: prgRomData,
    prgRam: new Uint8Array(8192),
    chr,
    nameTables: createNameTables(nameTableCount),
    nameTableMirroring,
    interrupt,
  });
}
