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
});
