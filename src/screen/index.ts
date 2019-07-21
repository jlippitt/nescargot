import { Color } from 'ppu/paletteTable';

export default interface Screen {
  drawLine(lineBuffer: Color[]): void;
}
