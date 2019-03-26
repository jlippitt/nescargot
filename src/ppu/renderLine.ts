import { debug } from 'log';

import { PPUState } from './index';

const RENDER_WIDTH = 256;
const RENDER_HEIGHT = 240;
const NAME_TABLE_WIDTH = 32;
const TILE_SIZE = 8;

const lineBuffer = Array(RENDER_WIDTH).fill(0);

function renderBackground(state: PPUState): void {
  const { control, vram } = state;

  const patternTable = vram.getPatternTables()[
    control.backgroundPatternTableIndex
  ];

  const nameTable = vram.getNameTables()[control.backgroundNameTableIndex];

  const palettes = vram.getPaletteTable().getBackgroundPalettes();

  for (let x = 0; x < RENDER_WIDTH; ++x) {
    const { patternIndex, paletteIndex } = nameTable.getTile(
      x >> 3,
      state.line >> 3,
    );
    const pattern = patternTable.getPattern(patternIndex);
    const pixel = pattern[state.line % TILE_SIZE][x % TILE_SIZE];

    if (pixel > 0) {
      lineBuffer[x] = palettes[paletteIndex][pixel];
    }
  }
}

export default function renderLine(state: PPUState): void {
  const { screen, mask, vram } = state;

  debug(`** Rendering line ${state.line} **`);

  const paletteTable = vram.getPaletteTable();

  lineBuffer.fill(paletteTable.getBackgroundColor());

  if (mask.backgroundEnabled) {
    renderBackground(state);
  }

  screen.drawLine(lineBuffer);
}
