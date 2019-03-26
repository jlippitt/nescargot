import { debug } from 'log';

import { PPUState } from './index';

const RENDER_WIDTH = 256;
const TILE_SIZE = 8;

const lineBuffer = Array(RENDER_WIDTH).fill(0);

function renderBackground(state: PPUState): void {
  const { control, scroll, vram } = state;

  const patternTable = vram.getPatternTables()[
    control.backgroundPatternTableIndex
  ];
  const nameTable = vram.getNameTables()[control.backgroundNameTableIndex];
  const palettes = vram.getPaletteTable().getBackgroundPalettes();

  const y = state.line + scroll.y;

  for (let i = 0; i < RENDER_WIDTH; ++i) {
    const x = i + scroll.x;
    const { patternIndex, paletteIndex } = nameTable.getTile(x, y);
    const pattern = patternTable.getPattern(patternIndex);
    const pixel = pattern[y % TILE_SIZE][x % TILE_SIZE];

    if (pixel > 0) {
      lineBuffer[i] = palettes[paletteIndex][pixel];
    }
  }
}

export default function renderLine(state: PPUState): void {
  const { mask, vram } = state;

  debug(`** Rendering line ${state.line} **`);

  const paletteTable = vram.getPaletteTable();

  lineBuffer.fill(paletteTable.getBackgroundColor());

  if (mask.backgroundEnabled) {
    renderBackground(state);
  }
}
