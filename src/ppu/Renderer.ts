import { debug } from 'log';
import Screen from 'screen/Screen';

import { Priority, Sprite } from './OAM';
import { Color } from './PaletteTable';
import PatternTable from './PatternTable';
import { PPUControl, PPUState } from './PPU';

const RENDER_WIDTH = 256;
const NAME_TABLE_WIDTH = 32;
const TILE_SIZE = 8;
const SPRITES_PER_LINE = 8;

const isOnLine = (spriteSize: number, line: number, sprite: Sprite) =>
  line >= sprite.y && line < sprite.y + spriteSize;

const flip = (spriteSize: number, shouldFlip: boolean, pixel: number) =>
  shouldFlip ? spriteSize - pixel - 1 : pixel;

const getSpritePatternRow = (
  control: PPUControl,
  patternTables: PatternTable[],
  line: number,
  sprite: Sprite,
): number[] => {
  const spriteY = flip(control.spriteSize, sprite.flipY, line - sprite.y);

  let patternTableIndex;
  let patternIndex;

  if (control.spriteSize === SpriteSize.Large) {
    patternTableIndex = sprite.patternIndex & 0x01;
    patternIndex = (sprite.patternIndex & 0xfe) | (spriteY >> 3);
  } else {
    patternTableIndex = control.spritePatternTableIndex;
    patternIndex = sprite.patternIndex;
  }

  const patternTable = patternTables[patternTableIndex];
  const pattern = patternTable.getPattern(patternIndex);

  return pattern[spriteY % TILE_SIZE];
};

export enum SpriteSize {
  Small = 8,
  Large = 16,
}

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

    if (mask.backgroundEnabled) {
      this.renderBackground();
    } else {
      const backgroundColor = vram.getPaletteTable().getBackgroundColor();
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

    let nameTableX = (scroll.x & 0x1ff) >> 8;
    let tileX = (scroll.x >> 3) & 0x1f;
    let pixelX = scroll.x % TILE_SIZE;

    let nameTable = nameTables[nameTableY | nameTableX];

    let { patternIndex, paletteIndex } = nameTable.getTile(tileX, tileY);

    let patternRow = patternTable.getPattern(patternIndex)[pixelY];

    let palette = palettes[paletteIndex];

    for (let x = 0; x < RENDER_WIDTH; ++x) {
      const pixel = patternRow[pixelX];

      if (pixel > 0) {
        this.lineBuffer[x] = palette[pixel];
        this.opacityBuffer[x] = true;
      } else {
        this.lineBuffer[x] = backgroundColor;
        this.opacityBuffer[x] = false;
      }

      if (++pixelX === TILE_SIZE) {
        pixelX = 0;

        if (++tileX === NAME_TABLE_WIDTH) {
          tileX = 0;
          nameTableX ^= 1;
        }

        nameTable = nameTables[nameTableY | nameTableX];

        ({ patternIndex, paletteIndex } = nameTable.getTile(tileX, tileY));

        patternRow = patternTable.getPattern(patternIndex)[pixelY];

        palette = palettes[paletteIndex];
      }
    }
  }

  private selectSprites(): void {
    const { control, line, oam } = this.state;
    let spriteIndex = 0;

    // Select front priority sprites
    for (const sprite of oam.getSprites()) {
      if (
        sprite.priority === Priority.Front &&
        isOnLine(control.spriteSize, line, sprite)
      ) {
        this.selectedSprites[spriteIndex++] = sprite;
        if (spriteIndex >= SPRITES_PER_LINE) {
          break;
        }
      }
    }

    if (spriteIndex < SPRITES_PER_LINE) {
      // Select back priority sprites
      for (const sprite of oam.getSprites()) {
        if (
          sprite.priority === Priority.Back &&
          isOnLine(control.spriteSize, line, sprite)
        ) {
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

      const patternRow = getSpritePatternRow(
        control,
        patternTables,
        line,
        sprite,
      );
      const palette = palettes[sprite.paletteIndex];

      for (let x = 0; x < TILE_SIZE; ++x) {
        const spriteX = flip(TILE_SIZE, sprite.flipX, x);

        const pixel = patternRow[spriteX];

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

    if (!isOnLine(control.spriteSize, line, sprite) || sprite.x === 255) {
      return false;
    }

    const patternTables = vram.getPatternTables();

    const patternRow = getSpritePatternRow(
      control,
      patternTables,
      line,
      sprite,
    );

    for (let x = 0; x < TILE_SIZE; ++x) {
      const spriteX = flip(TILE_SIZE, sprite.flipX, x);

      if (this.opacityBuffer[sprite.x + x] && patternRow[spriteX] > 0) {
        return true;
      }
    }

    return false;
  }
}
