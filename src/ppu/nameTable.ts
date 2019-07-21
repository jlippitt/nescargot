import { times } from 'lodash';

export interface Tile {
  patternIndex: number;
  paletteIndex: number;
}

export function createNameTables(count: number): NameTable[] {
  return times(count, () => new NameTable());
}

export default class NameTable {
  private ram: number[];
  private tiles: Tile[][];

  constructor() {
    this.ram = Array(1024).fill(0);

    this.tiles = times(30, () =>
      times(32, () => ({
        patternIndex: 0,
        paletteIndex: 0,
      })),
    );
  }

  public getTile(x: number, y: number): Tile {
    return this.tiles[y][x];
  }

  public getByte(offset: number): number {
    return this.ram[offset];
  }

  public setByte(offset: number, value: number): void {
    this.ram[offset] = value;

    if (offset < 0x03c0) {
      const row = this.tiles[offset >> 5];
      const tile = row[offset & 0x1f];
      tile.patternIndex = value;
    } else {
      const rowStart = (offset & 0x07) << 2;
      const columnStart = (offset & 0x38) >> 1;

      for (let y = columnStart; y < columnStart + 4; ++y) {
        for (let x = rowStart; x < rowStart + 4; ++x) {
          const tile = this.tiles[y][x];

          if ((x & 0x02) === 0 && (y & 0x02) === 0) {
            tile.paletteIndex = value & 0x03;
          } else if ((x & 0x02) === 0) {
            tile.paletteIndex = (value & 0x0c) >> 2;
          } else if ((y & 0x02) === 0) {
            tile.paletteIndex = (value & 0x30) >> 4;
          } else {
            tile.paletteIndex = (value & 0xc0) >> 6;
          }
        }
      }
    }
  }
}
