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
    // Medium blue
    paletteTable.setByte(0x3f10, 0x11);
    expect(colorToRgb(paletteTable.getBackgroundColor())).toEqual([8, 76, 196]);
  });

  it('should set background palette 0 at 0x3f01-0x3f03', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f01, 0x16);
    paletteTable.setByte(0x3f02, 0x1a);
    paletteTable.setByte(0x3f03, 0x12);

    const palette = paletteTable.getBackgroundPalettes()[0];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should set background palette 1 at 0x3f05-0x3f07', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f05, 0x16);
    paletteTable.setByte(0x3f06, 0x1a);
    paletteTable.setByte(0x3f07, 0x12);

    const palette = paletteTable.getBackgroundPalettes()[1];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should set background palette 2 at 0x3f09-0x3f0b', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f09, 0x16);
    paletteTable.setByte(0x3f0a, 0x1a);
    paletteTable.setByte(0x3f0b, 0x12);

    const palette = paletteTable.getBackgroundPalettes()[2];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should set sprite palette 3 at 0x3f0d-0x3f0f', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f0d, 0x16);
    paletteTable.setByte(0x3f0e, 0x1a);
    paletteTable.setByte(0x3f0f, 0x12);

    const palette = paletteTable.getBackgroundPalettes()[3];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should set sprite palette 0 at 0x3f11-0x3f13', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f11, 0x16);
    paletteTable.setByte(0x3f12, 0x1a);
    paletteTable.setByte(0x3f13, 0x12);

    const palette = paletteTable.getSpritePalettes()[0];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should set sprite palette 1 at 0x3f15-0x3f17', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f15, 0x16);
    paletteTable.setByte(0x3f16, 0x1a);
    paletteTable.setByte(0x3f17, 0x12);

    const palette = paletteTable.getSpritePalettes()[1];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should set sprite palette 2 at 0x3f19-0x3f1b', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f19, 0x16);
    paletteTable.setByte(0x3f1a, 0x1a);
    paletteTable.setByte(0x3f1b, 0x12);

    const palette = paletteTable.getSpritePalettes()[2];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should set sprite palette 3 at 0x3f1d-0x3f1f', () => {
    // Red, green, blue
    paletteTable.setByte(0x3f1d, 0x16);
    paletteTable.setByte(0x3f1e, 0x1a);
    paletteTable.setByte(0x3f1f, 0x12);

    const palette = paletteTable.getSpritePalettes()[3];

    expect(colorToRgb(palette[1])).toEqual([152, 34, 32]);
    expect(colorToRgb(palette[2])).toEqual([8, 124, 0]);
    expect(colorToRgb(palette[3])).toEqual([48, 50, 236]);
  });

  it('should mirror RAM writes for 0x3f00 to 0x3f10', () => {
    paletteTable.setByte(0x3f00, 1);
    expect(paletteTable.getByte(0x3f10)).toBe(1);
    paletteTable.setByte(0x3f10, 2);
    paletteTable.setByte(0x3f00, 2);
  });

  it('should mirror RAM writes for 0x3f04 to 0x3f14', () => {
    paletteTable.setByte(0x3f04, 1);
    expect(paletteTable.getByte(0x3f14)).toBe(1);
    paletteTable.setByte(0x3f14, 2);
    paletteTable.setByte(0x3f04, 2);
  });

  it('should mirror RAM writes for 0x3f04 to 0x3f18', () => {
    paletteTable.setByte(0x3f08, 1);
    expect(paletteTable.getByte(0x3f18)).toBe(1);
    paletteTable.setByte(0x3f18, 2);
    paletteTable.setByte(0x3f08, 2);
  });

  it('should mirror RAM writes for 0x3f0c to 0x3f1c', () => {
    paletteTable.setByte(0x3f0c, 1);
    expect(paletteTable.getByte(0x3f1c)).toBe(1);
    paletteTable.setByte(0x3f1c, 2);
    paletteTable.setByte(0x3f0c, 2);
  });
});
