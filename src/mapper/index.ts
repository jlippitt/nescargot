import { isEqual } from 'lodash';

import NROM from './nrom';

const INES_CONSTANT = new Uint8Array([0x4E, 0x45, 0x53, 0x1A]);

const PRG_ROM_SIZE_MULTIPLIER = 16384;

export default interface Mapper {
  get(offset: number): number;
  set(offset: number, value: number): void;
}

export interface MapperOptions {
  prgRom: Uint8Array;
}

export function createMapper(data: Uint8Array): Mapper {
  if (!isEqual(data.slice(0, 4), INES_CONSTANT)) {
    throw new Error('Not a valid INES ROM');
  }

  const prgRomSize = data[4] * PRG_ROM_SIZE_MULTIPLIER;

  const hasTrainer = (data[6] & 0x04) !== 0;

  const prgRomStart = 16 + (hasTrainer ? 512: 0);

  const prgRom = data.slice(prgRomStart, prgRomStart + prgRomSize);

  return new NROM({ prgRom });
}
