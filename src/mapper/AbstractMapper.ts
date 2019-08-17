import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';
import { PPUState } from 'ppu/PPU';

import Mapper, { MapperOptions } from './Mapper';

export default abstract class AbstractMapper implements Mapper {
  protected prgRom: Uint8Array;
  protected prgRam: Uint8Array;
  protected chr: Pattern[];
  protected nameTables: NameTable[];

  constructor({ prgRom, prgRam, chr, nameTables }: MapperOptions) {
    this.prgRom = prgRom;
    this.prgRam = prgRam;
    this.chr = chr;
    this.nameTables = nameTables;
  }

  public abstract getPrgByte(offset: number): number;

  public abstract setPrgByte(offset: number, value: number): void;

  public getChrByte(offset: number): number {
    return this.getPattern(offset >> 4).getByte(offset & 0x0f);
  }

  public setChrByte(offset: number, value: number): void {
    this.getPattern(offset >> 4).setByte(offset & 0x0f, value);
  }

  public abstract getPattern(index: number): Pattern;

  public abstract getNameTable(index: number): NameTable;

  public tick(cpuTicks: number): void {
    // Do nothing
  }

  public sample(): number {
    // No audio
    return 0;
  }

  public onPPULineStart(state: PPUState): void {
    // Do nothing
  }

  public onPPUSpriteMemoryStart(state: PPUState): void {
    // Do nothing
  }

  public onPPUBackgroundMemoryStart(state: PPUState): void {
    // Do nothing
  }

  public onPPUSpriteRenderStart(state: PPUState): void {
    // Do nothing
  }

  public onPPUBackgroundRenderStart(state: PPUState): void {
    // Do nothing
  }
}
