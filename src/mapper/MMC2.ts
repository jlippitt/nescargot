import { toHex, warn } from 'log';
import NameTable from 'ppu/NameTable';
import Pattern from 'ppu/Pattern';
import { PPUState } from 'ppu/PPU';

import AbstractMapper from './AbstractMapper';
import { MapperOptions, NameTableMirroring } from './Mapper';

const PRG_BANK_SIZE = 8192;
const CHR_BANK_SIZE = 256;

const LATCH_TILE_0 = 0xfd;
const LATCH_TILE_1 = 0xfe;

export default class MMC2 extends AbstractMapper {
  private prgOffset: number[];
  private chrOffset: number[][];
  private chrLatch: number[];
  private seenThisFrame: boolean[];
  private nameTableMirroring: NameTableMirroring;

  constructor(options: MapperOptions) {
    super(options);
    this.prgOffset = [
      0,
      this.getPrgOffset(-3),
      this.getPrgOffset(-2),
      this.getPrgOffset(-1),
    ];
    this.chrOffset = [[0, 0], [0, 0]];
    this.chrLatch = [1, 1];
    this.seenThisFrame = [false, false];
    this.nameTableMirroring = NameTableMirroring.Vertical;
  }

  public getPrgByte(offset: number): number {
    if (offset >= 0x8000) {
      return this.prgRom[
        this.prgOffset[(offset & 0x6000) >> 13] | (offset & 0x1fff)
      ];
    } else if (offset >= 0x6000) {
      return this.prgRam[offset & 0x1fff];
    } else {
      warn(`Unexpected mapper read: ${toHex(offset, 4)}`);
      return 0;
    }
  }

  public setPrgByte(offset: number, value: number): void {
    if (offset >= 0xa000) {
      this.setRegisterValue(offset, value);
    } else if (offset >= 0x6000 && offset < 0x8000) {
      this.prgRam[offset & 0x1fff] = value;
    } else {
      warn(
        `Unexpected mapper write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`,
      );
    }
  }

  public getPattern(index: number): Pattern {
    const bankIndex = (index & 0x0100) >> 8;
    const latchIndex = this.chrLatch[bankIndex];
    const patternIndex = index & 0x00ff;

    const pattern = this.chr[
      this.chrOffset[bankIndex][latchIndex] | patternIndex
    ];

    if (patternIndex === LATCH_TILE_0) {
      this.updateLatch(bankIndex, 0);
    } else if (patternIndex === LATCH_TILE_1) {
      this.updateLatch(bankIndex, 1);
    }

    return pattern;
  }

  public getNameTable(index: number): NameTable {
    if (this.nameTableMirroring === NameTableMirroring.Vertical) {
      return this.nameTables[index & 1];
    } else {
      return this.nameTables[index >> 1];
    }
  }

  public onPPULineStart({ line }: PPUState): void {
    // CHR bank 0 is only supposed to switch on the first line of the tile.
    // This is a fairly hacky way of doing that without hurting performance
    // for other mapper types.
    if (line === 0) {
      this.seenThisFrame = [false, false];
    }
  }

  private setRegisterValue(offset: number, value: number): void {
    switch (offset & 0xf000) {
      case 0xa000:
        this.prgOffset[0] = this.getPrgOffset(value & 0x0f);
        break;

      case 0xb000:
        this.chrOffset[0][0] = this.getChrOffset(value & 0x1f);
        break;

      case 0xc000:
        this.chrOffset[0][1] = this.getChrOffset(value & 0x1f);
        break;

      case 0xd000:
        this.chrOffset[1][0] = this.getChrOffset(value & 0x1f);
        break;

      case 0xe000:
        this.chrOffset[1][1] = this.getChrOffset(value & 0x1f);
        break;

      case 0xf000:
        this.nameTableMirroring =
          (value & 0x01) !== 0
            ? NameTableMirroring.Horizontal
            : NameTableMirroring.Vertical;
        break;

      default:
        throw new Error('Should not happen');
    }
  }

  private updateLatch(bankIndex: number, latchIndex: number) {
    if (bankIndex === 1) {
      this.chrLatch[1] = latchIndex;
    } else if (!this.seenThisFrame[latchIndex]) {
      this.chrLatch[0] = latchIndex;
      this.seenThisFrame[latchIndex] = true;
    }
  }

  private getPrgOffset(index: number): number {
    if (index >= 0) {
      return (index * PRG_BANK_SIZE) % this.prgRom.length;
    } else {
      return this.prgRom.length + index * PRG_BANK_SIZE;
    }
  }

  private getChrOffset = (index: number): number =>
    (index * CHR_BANK_SIZE) % this.chr.length
}
