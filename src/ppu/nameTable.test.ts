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
    // Address 17. Should correspond to (1,2), or block (4-7,8-11).
    nameTable.setByte(0x03d1, 0xc9);

    // Expecting:
    // - Top left = 1
    // - Top right = 2
    // - Bottom left = 0
    // - Bottom right = 3
    expect(nameTable.getTile(4, 8).paletteIndex).toBe(1);
    expect(nameTable.getTile(4, 9).paletteIndex).toBe(1);
    expect(nameTable.getTile(4, 10).paletteIndex).toBe(0);
    expect(nameTable.getTile(4, 11).paletteIndex).toBe(0);
    expect(nameTable.getTile(5, 8).paletteIndex).toBe(1);
    expect(nameTable.getTile(5, 9).paletteIndex).toBe(1);
    expect(nameTable.getTile(5, 10).paletteIndex).toBe(0);
    expect(nameTable.getTile(5, 11).paletteIndex).toBe(0);
    expect(nameTable.getTile(6, 8).paletteIndex).toBe(2);
    expect(nameTable.getTile(6, 9).paletteIndex).toBe(2);
    expect(nameTable.getTile(6, 10).paletteIndex).toBe(3);
    expect(nameTable.getTile(6, 11).paletteIndex).toBe(3);
    expect(nameTable.getTile(7, 8).paletteIndex).toBe(2);
    expect(nameTable.getTile(7, 9).paletteIndex).toBe(2);
    expect(nameTable.getTile(7, 10).paletteIndex).toBe(3);
    expect(nameTable.getTile(7, 11).paletteIndex).toBe(3);
  });
});
