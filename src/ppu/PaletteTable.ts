import { times } from 'lodash';
import { debug, toHex } from 'log';

const COLOR_TABLE_SIZE = 16;
const DE_EMPHASIS_MULTIPLIER = 0.85;

export type Color = number;
export type Palette = Color[];
export type Rgb = [number, number, number];

export const rgbToColor = ([red, green, blue]: Rgb): Color =>
  (red << 16) | (green << 8) | blue;

export const colorToRgb = (color: Color): Rgb => [
  color >> 16,
  (color >> 8) & 0xff,
  color & 0xff,
];

const rgbMap: Rgb[] = [
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

const colorTable: Color[][] = times(COLOR_TABLE_SIZE, (tint: number) =>
  times(rgbMap.length, (index: number) => {
    const baseColorIndex = (tint & 0x01) !== 0 ? index & 0x30 : index;
    let [red, green, blue] = rgbMap[baseColorIndex];

    if ((tint & 0x02) !== 0) {
      green *= DE_EMPHASIS_MULTIPLIER;
      blue *= DE_EMPHASIS_MULTIPLIER;
    }

    if ((tint & 0x04) !== 0) {
      red *= DE_EMPHASIS_MULTIPLIER;
      blue *= DE_EMPHASIS_MULTIPLIER;
    }

    if ((tint & 0x08) !== 0) {
      red *= DE_EMPHASIS_MULTIPLIER;
      green *= DE_EMPHASIS_MULTIPLIER;
    }

    return rgbToColor([Math.floor(red), Math.floor(green), Math.floor(blue)]);
  }),
);

export default class PaletteTable {
  private ram: number[];
  private colorMap: Color[];
  private backgroundColor: Color;
  private backgroundPalettes: Palette[];
  private spritePalettes: Palette[];

  constructor() {
    this.ram = Array(32).fill(0);
    this.colorMap = colorTable[0];
    this.backgroundColor = this.colorMap[0];
    this.backgroundPalettes = times(4, () => Array(4).fill(this.colorMap[0]));
    this.spritePalettes = times(4, () => Array(4).fill(this.colorMap[0]));
  }

  public setMask(value: number) {
    const oldColorMap = this.colorMap;

    const colorTableIndex = ((value & 0xe0) >> 4) | (value & 0x01);
    this.colorMap = colorTable[colorTableIndex];

    if (this.colorMap !== oldColorMap) {
      // Update all the stored colours
      for (let i = 0; i < this.ram.length; ++i) {
        this.setByte(i, this.getByte(i));
      }
    }
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
    if ((offset & 0x03) !== 0) {
      return this.ram[offset & 0x1f];
    } else {
      return this.ram[offset & 0x0f];
    }
  }

  public setByte(offset: number, value: number) {
    debug(`Palette Write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);

    const colorIndex = value & 0x3f;

    if ((offset & 0x03) !== 0) {
      if ((offset & 0x10) === 0) {
        this.backgroundPalettes[(offset & 0x0c) >> 2][
          offset & 0x03
        ] = this.colorMap[colorIndex];
      } else {
        this.spritePalettes[(offset & 0x0c) >> 2][
          offset & 0x03
        ] = this.colorMap[colorIndex];
      }

      this.ram[offset & 0x1f] = colorIndex;
    } else {
      if ((offset & 0x0f) === 0) {
        this.backgroundColor = this.colorMap[colorIndex];
      }

      this.ram[offset & 0x0f] = colorIndex;
    }
  }
}
