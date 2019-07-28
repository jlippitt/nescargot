import { debug } from 'log';
import Screen from 'screen';

import { PPUState } from './index';
import { Priority, Sprite } from './oam';
import { Color } from './paletteTable';

const RENDER_WIDTH = 256;
const TILE_SIZE = 8;
const SPRITES_PER_LINE = 8;

const isOnLine = (sprite: Sprite, line: number) =>
  line >= sprite.y && line < sprite.y + TILE_SIZE;

const flip = (shouldFlip: boolean, pixel: number) =>
  shouldFlip ? TILE_SIZE - pixel - 1 : pixel;

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

  public renderLine(): boolean {
    const { screen, mask, vram } = this.state;

    debug(`** Rendering line ${this.state.line} **`);

    const backgroundColor = vram.getPaletteTable().getBackgroundColor();

    if (mask.backgroundEnabled) {
      this.renderBackground();
    } else {
      this.lineBuffer.fill(backgroundColor);
      this.opacityBuffer.fill(false);
    }

    let spriteHit = false;

    if (mask.spritesEnabled) {
      this.selectSprites();
      this.renderSprites();
      this.combineSpritesWithBackground();
      spriteHit = this.detectSpriteHit();
    }

    this.screen.drawLine(this.lineBuffer);

    return spriteHit;
  }

  private renderBackground(): void {
    const { control, line, registers, vram } = this.state;

    const patternTable = vram.getPatternTable(
      control.backgroundPatternTableIndex,
    );

    const nameTables = vram.getNameTables();

    const paletteTable = vram.getPaletteTable();
    const palettes = paletteTable.getBackgroundPalettes();
    const backgroundColor = paletteTable.getBackgroundColor();

    const scroll = registers.getScroll();

    const posY = scroll.y + line;
    const nameTableY = Math.floor((posY % 480) / 240) << 1;
    const tileY = (posY >> 3) % 30;
    const pixelY = posY % TILE_SIZE;

    let posX = scroll.x;
    let pixelX = scroll.x % TILE_SIZE;

    let nameTableX = (posX & 0x1ff) >> 8;

    let nameTable = nameTables[nameTableY | nameTableX];

    let { patternIndex, paletteIndex } = nameTable.getTile(
      (posX >> 3) & 0x1f,
      tileY,
    );

    let patternRow = patternTable.getPattern(patternIndex)[pixelY];

    for (let x = 0; x < RENDER_WIDTH; ++x) {
      const pixel = patternRow[pixelX];

      if (pixel > 0) {
        this.lineBuffer[x] = palettes[paletteIndex][pixel];
        this.opacityBuffer[x] = true;
      } else {
        this.lineBuffer[x] = backgroundColor;
        this.opacityBuffer[x] = false;
      }

      ++posX;

      if (++pixelX === TILE_SIZE) {
        pixelX = 0;

        nameTableX = (posX & 0x1ff) >> 8;

        nameTable = nameTables[nameTableY | nameTableX];

        ({ patternIndex, paletteIndex } = nameTable.getTile(
          (posX >> 3) & 0x1f,
          tileY,
        ));

        patternRow = patternTable.getPattern(patternIndex)[pixelY];
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
    const { control, line, vram } = this.state;

    this.priorityBuffer.fill(undefined);

    const patternTables = vram.getPatternTables();
    const palettes = vram.getPaletteTable().getSpritePalettes();

    for (let i = this.selectedSprites.length - 1; i >= 0; --i) {
      const sprite = this.selectedSprites[i];

      if (!sprite) {
        continue;
      }

      const patternTable = patternTables[control.spritePatternTableIndex];
      const pattern = patternTable.getPattern(sprite.patternIndex);
      const palette = palettes[sprite.paletteIndex];

      const spriteY = flip(sprite.flipY, line - sprite.y);

      for (let x = 0; x < TILE_SIZE; ++x) {
        const spriteX = flip(sprite.flipX, x);

        const pixel = pattern[spriteY][spriteX];

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

  private detectSpriteHit(): boolean {
    const { control, line, oam, vram } = this.state;

    const sprite = oam.getSprites()[0];

    if (!isOnLine(sprite, line) || sprite.x === 255) {
      return false;
    }

    const patternTables = vram.getPatternTables();
    const patternTable = patternTables[control.spritePatternTableIndex];
    const pattern = patternTable.getPattern(sprite.patternIndex);

    const spriteY = flip(sprite.flipY, line - sprite.y);

    for (let x = 0; x < TILE_SIZE; ++x) {
      const spriteX = flip(sprite.flipX, x);

      if (this.opacityBuffer[sprite.x + x] && pattern[spriteY][spriteX] > 0) {
        return true;
      }
    }

    return false;
  }
}
