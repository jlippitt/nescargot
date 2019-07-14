import { debug } from 'log';
import Screen from 'screen';

import { PPUState } from './index';
import { Priority, Sprite } from './oam';
import { Color } from './paletteTable';

const RENDER_WIDTH = 256;
const RENDER_HEIGHT = 240;
const NAME_TABLE_WIDTH = 32;
const TILE_SIZE = 8;
const SPRITES_PER_LINE = 8;

const isOnLine = (sprite: Sprite, line: number) =>
  line >= sprite.y && line < sprite.y + TILE_SIZE;

export default class Renderer {
  private screen: Screen;
  private state: PPUState;
  private lineBuffer: Color[];
  private opacityBuffer: boolean[];
  private selectedSprites: Array<Sprite | undefined>;
  private spriteBuffer: Color[];
  private priorityBuffer: Array<Priority | undefined>;

  constructor(screen: Screen, state: PPUState) {
    this.screen = screen;
    this.state = state;
    this.lineBuffer = Array(RENDER_WIDTH).fill(0);
    this.opacityBuffer = Array(RENDER_WIDTH).fill(false);
    this.selectedSprites = Array(SPRITES_PER_LINE).fill(undefined);
    this.spriteBuffer = Array(RENDER_WIDTH).fill(0);
    this.priorityBuffer = Array(RENDER_WIDTH).fill(undefined);
  }

  public renderLine(): void {
    const { screen, mask, vram } = this.state;

    debug(`** Rendering line ${this.state.line} **`);

    const paletteTable = vram.getPaletteTable();

    this.lineBuffer.fill(paletteTable.getBackgroundColor());
    this.opacityBuffer.fill(false);

    if (mask.backgroundEnabled) {
      this.renderBackground();
    }

    if (mask.spritesEnabled) {
      this.selectSprites();
      this.renderSprites();
      this.combineSpritesWithBackground();
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
        this.opacityBuffer[x] = true;
      }
    }
  }

  private selectSprites(): void {
    const { line, oam } = this.state;
    let spriteIndex = 0;

    // Select front priority sprites
    for (const sprite of oam.getSprites()) {
      if (sprite.priority === Priority.Front && isOnLine(sprite, line)) {
        this.selectedSprites[spriteIndex++] = sprite;
        if (spriteIndex >= SPRITES_PER_LINE) {
          break;
        }
      }
    }

    if (spriteIndex < SPRITES_PER_LINE) {
      // Select back priority sprites
      for (const sprite of oam.getSprites()) {
        if (sprite.priority === Priority.Back && isOnLine(sprite, line)) {
          this.selectedSprites[spriteIndex++] = sprite;
          if (spriteIndex >= SPRITES_PER_LINE) {
            break;
          }
        }
      }
    }

    while (spriteIndex < SPRITES_PER_LINE) {
      this.selectedSprites[spriteIndex++] = undefined;
    }
  }

  private renderSprites(): void {
    const { line, vram } = this.state;

    this.spriteBuffer.fill(0);
    this.priorityBuffer.fill(undefined);

    const patternTables = vram.getPatternTables();
    const palettes = vram.getPaletteTable().getSpritePalettes();

    for (let i = this.selectedSprites.length - 1; i >= 0; --i) {
      const sprite = this.selectedSprites[i];

      if (!sprite) {
        break;
      }

      const patternTable = patternTables[sprite.patternTableIndex];
      const pattern = patternTable.getPattern(sprite.patternIndex);
      const palette = palettes[sprite.paletteIndex];

      const y = line - sprite.y;

      for (let x = 0; x < TILE_SIZE; ++x) {
        const pixel = pattern[y][x];

        if (pixel > 0) {
          const bufferIndex = sprite.x + x;
          this.spriteBuffer[bufferIndex] = palette[pixel];
          this.priorityBuffer[bufferIndex] = sprite.priority;
        }
      }
    }
  }

  private combineSpritesWithBackground(): void {
    for (let x = 0; x < RENDER_WIDTH; ++x) {
      switch (this.priorityBuffer[x]) {
        case Priority.Front:
          this.lineBuffer[x] = this.spriteBuffer[x];
          break;
        case Priority.Back:
          if (!this.opacityBuffer[x]) {
            this.lineBuffer[x] = this.spriteBuffer[x];
          }
          break;
        default:
          // No sprite on this pixel
          break;
      }
    }
  }
}
