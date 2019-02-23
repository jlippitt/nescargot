import Mapper, { MapperOptions } from './index'

export default class NROM implements Mapper {
  private prgRom: Uint8Array;

  constructor(options: MapperOptions) {
    this.prgRom = options.prgRom;
  }

  public get(offset: number): number {
    if (offset >= 0x8000) {
      return this.prgRom[(offset & 0x7FFF) % this.prgRom.length];
    } else if (offset >= 0x6000) {
      throw new Error('PRG RAM not yet implemented');
    } else {
      throw new Error('Attempted read from unexpected mapper location');
    }
  }

  public set(offset: number, value: number): void {
    throw new Error('Writes not yet implemented');
  }
}
