import NameTable from './nameTable';

let nameTable: NameTable;

beforeEach(() => {
  nameTable = new NameTable();
});

describe('setByte', () => {
  it('should set the corresponding byte in RAM', () => {
    expect(nameTable.getByte(0x0009)).toBe(0);
    nameTable.setByte(0x0009, 34);
    expect(nameTable.getByte(0x0009)).toBe(34);
  });

  it('should set the pattern for the tile when address is < 0x03c0', () => {
    nameTable.setByte(32, 34);
    expect(nameTable.getTile(0, 1).patternIndex).toBe(34);
    nameTable.setByte(0x03bf, 78);
    expect(nameTable.getTile(31, 29).patternIndex).toBe(78);
  });

  it('should set the palette for a 4x4 tile area when address is >= 0x03c0', () => {
    // Address 18. Should correspond to (2,2), or block (8-11,8-11).
    nameTable.setByte(0x03d2, 0xe9);

    // Expecting:
    // - Top left = 1
    // - Top right = 2
    // - Bottom left = 2
    // - Bottom right = 3
    expect(nameTable.getTile(8, 8).paletteIndex).toBe(1);
    expect(nameTable.getTile(8, 9).paletteIndex).toBe(1);
    expect(nameTable.getTile(8, 10).paletteIndex).toBe(2);
    expect(nameTable.getTile(8, 11).paletteIndex).toBe(2);
    expect(nameTable.getTile(9, 8).paletteIndex).toBe(1);
    expect(nameTable.getTile(9, 9).paletteIndex).toBe(1);
    expect(nameTable.getTile(9, 10).paletteIndex).toBe(2);
    expect(nameTable.getTile(9, 11).paletteIndex).toBe(2);
    expect(nameTable.getTile(10, 8).paletteIndex).toBe(2);
    expect(nameTable.getTile(10, 9).paletteIndex).toBe(2);
    expect(nameTable.getTile(10, 10).paletteIndex).toBe(3);
    expect(nameTable.getTile(10, 11).paletteIndex).toBe(3);
    expect(nameTable.getTile(11, 8).paletteIndex).toBe(2);
    expect(nameTable.getTile(11, 9).paletteIndex).toBe(2);
    expect(nameTable.getTile(11, 10).paletteIndex).toBe(3);
    expect(nameTable.getTile(11, 11).paletteIndex).toBe(3);
  });
});
