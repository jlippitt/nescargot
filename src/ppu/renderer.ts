import { debug } from 'log';
import Screen from 'screen';

import { PPUState } from './index';
import { Color } from './paletteTable';

const RENDER_WIDTH = 256;
const RENDER_HEIGHT = 240;
const NAME_TABLE_WIDTH = 32;
const TILE_SIZE = 8;

export default class Renderer {
  private screen: Screen;
  private state: PPUState;
  private lineBuffer: Color[];

  constructor(screen: Screen, state: PPUState) {
    this.screen = screen;
    this.state = state;
    this.lineBuffer = Array(RENDER_WIDTH).fill(0);
  }

  public renderLine(): void {
    const { screen, mask, vram } = this.state;

    debug(`** Rendering line ${state.line} **`);

    const paletteTable = vram.getPaletteTable();

    this.lineBuffer.fill(paletteTable.getBackgroundColor());

    if (mask.backgroundEnabled) {
      this.renderBackground();
    }

    this.screen.drawLine(this.lineBuffer);
  }

  private renderBackground(): void {
    const { control, vram } = this.state;

    const patternTable = vram.getPatternTables()[
      control.backgroundPatternTableIndex
    ];

    const nameTable = vram.getNameTables()[control.backgroundNameTableIndex];

    const palettes = vram.getPaletteTable().getBackgroundPalettes();

    for (let x = 0; x < RENDER_WIDTH; ++x) {
      const { patternIndex, paletteIndex } = nameTable.getTile(
        x >> 3,
        this.state.line >> 3,
      );
      const pattern = patternTable.getPattern(patternIndex);
      const pixel = pattern[this.state.line % TILE_SIZE][x % TILE_SIZE];

      if (pixel > 0) {
        this.lineBuffer[x] = palettes[paletteIndex][pixel];
      }
    }
  }
}
