import PaletteTable, { colorToRgb } from './paletteTable';

let paletteTable: PaletteTable;

beforeEach(() => {
  paletteTable = new PaletteTable();
});

describe('setByte', () => {
  it('should set the corresponding byte in RAM', () => {
    expect(paletteTable.getByte(0x3f09)).toBe(0);
    paletteTable.setByte(0x3f09, 34);
    expect(paletteTable.getByte(0x3f09)).toBe(34);
  });

  it('should set the background color at 0x3f00', () => {
    // Light blue
    paletteTable.setByte(0x3f00, 0x21);
    expect(colorToRgb(paletteTable.getBackgroundColor())).toEqual([
      76,
      154,
      236,
    ]);
  });

  it('should set the background color at 0x3f10', () => {
    // Dark blue
    paletteTable.setByte(0x3f10, 0x11);
    expect(colorToRgb(paletteTable.getBackgroundColor())).toEqual([8, 76, 196]);
  });
});
