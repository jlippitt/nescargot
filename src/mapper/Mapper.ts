import { isEqual, times } from 'lodash';

import Interrupt from 'Interrupt';
import { debug, toHex } from 'log';
import NameTable, { createNameTables } from 'ppu/NameTable';
import Pattern, { createPatternTable } from 'ppu/Pattern';
import { PPUState } from 'ppu/PPU';

import AxROM from './AxROM';
import CNROM from './CNROM';
import MMC1 from './MMC1';
import MMC2 from './MMC2';
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
  onPPULineStart(state: PPUState): void;
  onPPUSpriteMemoryStart(state: PPUState): void;
  onPPUBackgroundMemoryStart(state: PPUState): void;
  onPPUSpriteRenderStart(state: PPUState): void;
  onPPUBackgroundRenderStart(state: PPUState): void;
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

interface Header {
  mapperNumber: number;
  hasTrainer: boolean;
  prgRomSize: number;
  chrRomSize: number;
  nameTableCount: number;
  nameTableMirroring: NameTableMirroring;
}

const availableMappers = [
  NROM,
  MMC1,
  UxROM,
  CNROM,
  MMC3,
  MMC5,
  undefined,
  AxROM,
  undefined,
  MMC2,
];

const parseHeader = (header: Uint8Array): Header => {
  if (!isEqual(header.slice(0, 4), INES_CONSTANT)) {
    throw new Error('Not a valid INES-compatible ROM');
  }

  debug('INES header', Array.from(header).map((i) => toHex(i, 2)));

  const hasTrainer = (header[6] & 0x04) !== 0;
  const prgRomSize = header[4] * PRG_BANK_SIZE;
  const chrRomSize = header[5] * CHR_ROM_SIZE_MULTIPLIER;

  const nameTableCount = (header[6] & 0x08) !== 0 ? 4 : 2;
  const nameTableMirroring = (header[6] & 0x01) as NameTableMirroring;

  let mapperNumber: number;

  // TODO: Properly support NES 2.0
  if ((header[7] & 0x0c) === 0) {
    // Standard iNES
    mapperNumber = (header[7] & 0xf0) | ((header[6] & 0xf0) >> 4);
  } else {
    // Assume archaic iNES
    mapperNumber = (header[6] & 0xf0) >> 4;
  }

  return {
    mapperNumber,
    hasTrainer,
    prgRomSize,
    chrRomSize,
    nameTableCount,
    nameTableMirroring,
  };
};

export function createMapper(data: Uint8Array, interrupt: Interrupt): Mapper {
  const {
    mapperNumber,
    hasTrainer,
    prgRomSize,
    chrRomSize,
    nameTableCount,
    nameTableMirroring,
  } = parseHeader(data.slice(0, 16));

  debug(`Mapper Type: ${mapperNumber}`);
  debug(`PRG ROM Length: ${prgRomSize}`);

  const prgRomStart = 16 + (hasTrainer ? 512 : 0);
  const prgRomEnd = prgRomStart + prgRomSize;

  const prgRomData = data.slice(prgRomStart, prgRomEnd);

  let chr: Pattern[];

  if (chrRomSize > 0) {
    debug(`CHR ROM Length: ${chrRomSize}`);
    chr = createPatternTable(data.slice(prgRomEnd, prgRomEnd + chrRomSize));
  } else {
    debug('CHR RAM Enabled');
    chr = times(CHR_RAM_SIZE, () => new Pattern());
  }

  debug(`Nametable Mirroring: ${nameTableMirroring}`);

  const MapperConstructor = availableMappers[mapperNumber];

  if (!MapperConstructor) {
    throw new Error(`Unimplemented mapper number: ${mapperNumber}`);
  }

  return new MapperConstructor({
    prgRom: prgRomData,
    prgRam: new Uint8Array(8192),
    chr,
    nameTables: createNameTables(nameTableCount),
    nameTableMirroring,
    interrupt,
  });
}
