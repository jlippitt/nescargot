import { Color } from 'ppu/paletteTable';

import Screen from './index';

export default class DummyScreen implements Screen {
  public drawLine(lineBuffer: Color[]): void {
    // Do nothing
  }
}
