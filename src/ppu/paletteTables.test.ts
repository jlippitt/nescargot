import PaletteTable from './paletteTable';

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
});
