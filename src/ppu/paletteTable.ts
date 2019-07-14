import { times } from 'lodash';
import { debug, toHex } from 'log';

export type Color = number;

export type Palette = Color[];

export type RGB = [number, number, number];

const rgbToColor = ([red, green, blue]: RGB): Color =>
  (red << 24) | (green << 16) | (blue << 8) | 0xff;

const rgbMap: RGB[] = [
  // Dark
  [84, 84, 84],
  [0, 30, 116],
  [8, 16, 144],
  [48, 0, 136],
  [68, 0, 100],
  [92, 0, 48],
  [84, 4, 0],
  [60, 24, 0],
  [32, 42, 0],
  [8, 58, 0],
  [0, 64, 0],
  [0, 60, 0],
  [0, 50, 60],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  // Medium
  [152, 150, 152],
  [8, 76, 196],
  [48, 50, 236],
  [92, 30, 228],
  [136, 20, 176],
  [160, 20, 100],
  [152, 34, 32],
  [120, 60, 0],
  [84, 90, 0],
  [40, 114, 0],
  [8, 124, 0],
  [0, 118, 40],
  [0, 102, 120],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  // Light
  [236, 238, 236],
  [76, 154, 236],
  [120, 124, 236],
  [176, 98, 236],
  [228, 84, 236],
  [236, 88, 180],
  [236, 106, 100],
  [212, 136, 32],
  [160, 170, 0],
  [116, 196, 0],
  [76, 208, 32],
  [56, 204, 108],
  [56, 180, 204],
  [60, 60, 60],
  [0, 0, 0],
  [0, 0, 0],
  // Pale
  [236, 238, 236],
  [168, 204, 236],
  [188, 188, 236],
  [212, 178, 236],
  [236, 174, 236],
  [236, 174, 212],
  [236, 180, 176],
  [228, 196, 144],
  [204, 210, 120],
  [180, 222, 120],
  [168, 226, 144],
  [152, 226, 180],
  [160, 214, 228],
  [160, 162, 160],
  [0, 0, 0],
  [0, 0, 0],
];

const colorMap = rgbMap.map(rgbToColor);

export default class PaletteTable {
  private ram: number[];
  private backgroundColor: Color;
  private backgroundPalettes: Palette[];
  private spritePalettes: Palette[];

  constructor() {
    this.ram = Array(32).fill(0);
    this.backgroundColor = 0;
    this.backgroundPalettes = times(4, () => [0, 0, 0, 0]);
    this.spritePalettes = times(4, () => [0, 0, 0, 0]);
  }

  public getBackgroundColor(): Color {
    return this.backgroundColor;
  }

  public getBackgroundPalettes(): Palette[] {
    return this.backgroundPalettes;
  }

  public getSpritePalettes(): Palette[] {
    return this.spritePalettes;
  }

  public getByte(offset: number): number {
    return this.ram[offset];
  }

  public setByte(offset: number, value: number) {
    debug(`Palette Write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);

    const colorIndex = value & 0x3f;

    this.ram[offset] = colorIndex;

    if ((offset & 0x03) !== 0) {
      if ((offset & 0x10) === 0) {
        this.backgroundPalettes[(offset & 0x0c) >> 2][offset & 0x03] =
          colorMap[colorIndex];
      } else {
        this.spritePalettes[(offset & 0x0c) >> 2][offset & 0x03] =
          colorMap[colorIndex];
      }
    } else if ((offset & 0x1f) === 0) {
      this.backgroundColor = colorMap[colorIndex];
    }
  }
}
