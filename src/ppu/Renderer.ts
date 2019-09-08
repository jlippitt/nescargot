import { times } from 'lodash';

import { debug } from 'log';
import Mapper from 'mapper/Mapper';
import Screen from 'screen/Screen';

import { SCREEN_WIDTH } from '../constants';
import { Priority, Sprite } from './OAM';
import { Color } from './PaletteTable';
import Pattern from './Pattern';
import { PPUControl, PPUState } from './PPU';

const NAME_TABLE_WIDTH = 32;
const TILE_SIZE = 8;
const BG_TILES_PER_LINE = 34;
const SPRITES_PER_LINE = 8;

const isOnLine = (spriteSize: number, line: number, sprite: Sprite) =>
  line >= sprite.y && line < sprite.y + spriteSize;

const flip = (spriteSize: number, shouldFlip: boolean, pixel: number) =>
  shouldFlip ? spriteSize - pixel - 1 : pixel;

const getSpritePatternRow = (
  control: PPUControl,
  mapper: Mapper,
  line: number,
  sprite: Sprite,
): number[] => {
  const spriteY = flip(control.spriteSize, sprite.flipY, line - sprite.y);

  let patternIndex;

  if (control.spriteSize === SpriteSize.Large) {
    patternIndex =
      ((sprite.patternIndex & 0x01) << 8) |
      (sprite.patternIndex & 0xfe) |
      (spriteY >> 3);
  } else {
    patternIndex = control.spritePatternOffset | sprite.patternIndex;
  }

  const pattern = mapper.getPattern(patternIndex);

  return pattern.getRow(spriteY % TILE_SIZE);
};

export enum SpriteSize {
  Small = 8,
  Large = 16,
}

interface RendererOptions {
  screen: Screen;
  state: PPUState;
  mapper: Mapper;
}

export default class Renderer {
  private screen: Screen;
  private state: PPUState;
  private mapper: Mapper;
  private lineBuffer: Color[];
  private tileBuffer: number[][];
  private paletteBuffer: number[][];
  private opacityBuffer: boolean[];
  private selectedSprites: Array<Sprite | undefined>;
  private spriteBuffer: Color[];
  private priorityBuffer: Array<Priority | undefined>;

  constructor({ screen, state, mapper }: RendererOptions) {
    this.screen = screen;
    this.state = state;
    this.mapper = mapper;
    this.lineBuffer = Array(SCREEN_WIDTH).fill(0);
    this.tileBuffer = times(BG_TILES_PER_LINE, () => Array(8).fill(0));
    this.paletteBuffer = times(BG_TILES_PER_LINE, () => Array(4).fill(0));
    this.opacityBuffer = Array(SCREEN_WIDTH).fill(false);
    this.selectedSprites = Array(SPRITES_PER_LINE).fill(undefined);
    this.spriteBuffer = Array(SCREEN_WIDTH).fill(0);
    this.priorityBuffer = Array(SCREEN_WIDTH).fill(undefined);
  }

  public renderLine(): void {
    const { mask, vram } = this.state;

    debug(`** Rendering line ${this.state.line} **`);

    const backgroundColor = vram.getPaletteTable().getBackgroundColor();

    if (mask.backgroundEnabled) {
      this.lineBuffer.fill(backgroundColor, 0, mask.backgroundXStart);
      this.opacityBuffer.fill(false, 0, mask.backgroundXStart);
      this.mapper.onPPUBackgroundRenderStart(this.state);
      this.renderBackground();
    } else {
      this.lineBuffer.fill(backgroundColor);
      this.opacityBuffer.fill(false);
    }

    if (mask.spritesEnabled) {
      this.selectSprites();
      this.mapper.onPPUSpriteRenderStart(this.state);
      this.renderSprites();
      this.combineSpritesWithBackground();
      this.detectSpriteHit();
    }

    this.screen.drawLine(this.lineBuffer);
  }

  private renderBackground(): void {
    const { line, vram, control, mask, registers } = this.state;

    const paletteTable = vram.getPaletteTable();
    const palettes = paletteTable.getBackgroundPalettes();
    const backgroundColor = paletteTable.getBackgroundColor();

    const scroll = registers.getScroll();
    const { coarseY, fineY } = scroll;
    let { nameTableIndex, coarseX, fineX } = scroll;

    coarseX = (coarseX + (mask.backgroundXStart >> 3)) % NAME_TABLE_WIDTH;

    let nameTable = this.mapper.getNameTable(nameTableIndex);

    for (let i = 0; i < BG_TILES_PER_LINE; ++i) {
      const tileX = coarseX + i;

      if (tileX === NAME_TABLE_WIDTH) {
        nameTableIndex ^= 1;
        nameTable = this.mapper.getNameTable(nameTableIndex);
      }

      const { patternIndex, paletteIndex } = nameTable.getTile(
        tileX % NAME_TABLE_WIDTH,
        coarseY,
      );

      this.tileBuffer[i] = this.mapper
        .getPattern(control.backgroundPatternOffset | patternIndex)
        .getRow(fineY);

      this.paletteBuffer[i] = palettes[paletteIndex];
    }

    let tileBufferIndex = 0;
    let patternRow = this.tileBuffer[0];
    let palette = this.paletteBuffer[0];

    for (let x = mask.backgroundXStart; x < SCREEN_WIDTH; ++x) {
      const pixel = patternRow[fineX];

      if (pixel > 0) {
        this.lineBuffer[x] = palette[pixel];
        this.opacityBuffer[x] = true;
      } else {
        this.lineBuffer[x] = backgroundColor;
        this.opacityBuffer[x] = false;
      }

      if (++fineX === TILE_SIZE) {
        fineX = 0;
        ++tileBufferIndex;
        patternRow = this.tileBuffer[tileBufferIndex];
        palette = this.paletteBuffer[tileBufferIndex];
      }
    }
  }

  private selectSprites(): void {
    const { line, oam, control, status } = this.state;
    let spriteIndex = 0;

    for (const sprite of oam.getSprites()) {
      if (isOnLine(control.spriteSize, line, sprite)) {
        if (spriteIndex < SPRITES_PER_LINE) {
          this.selectedSprites[spriteIndex++] = sprite;
        } else {
          status.spriteOverflow = true;
          break;
        }
      }
    }

    while (spriteIndex < SPRITES_PER_LINE) {
      this.selectedSprites[spriteIndex++] = undefined;
    }
  }

  private renderSprites(): void {
    const { line, vram, control, mask } = this.state;

    this.priorityBuffer.fill(undefined);

    const palettes = vram.getPaletteTable().getSpritePalettes();

    for (const sprite of this.selectedSprites) {
      if (!sprite) {
        break;
      }

      const patternRow = getSpritePatternRow(
        control,
        this.mapper,
        line,
        sprite,
      );

      const palette = palettes[sprite.paletteIndex];

      for (let x = 0; x < TILE_SIZE; ++x) {
        const spriteX = flip(TILE_SIZE, sprite.flipX, x);

        const pixel = patternRow[spriteX];

        if (pixel > 0) {
          const bufferIndex = sprite.x + x;

          if (!this.priorityBuffer[bufferIndex]) {
            this.spriteBuffer[bufferIndex] = palette[pixel];
            this.priorityBuffer[bufferIndex] = sprite.priority;
          }
        }
      }
    }
  }

  private combineSpritesWithBackground(): void {
    for (let x = this.state.mask.spriteXStart; x < SCREEN_WIDTH; ++x) {
      const priority = this.priorityBuffer[x];

      if (priority === undefined) {
        continue;
      }

      if (priority === Priority.Front || !this.opacityBuffer[x]) {
        this.lineBuffer[x] = this.spriteBuffer[x];
      }
    }
  }

  private detectSpriteHit(): void {
    const { status } = this.state;

    if (status.spriteHit) {
      // No need to waste the cycles!
      return;
    }

    const { line, oam, vram, control, mask } = this.state;

    const sprite = oam.getSprites()[0];

    if (!isOnLine(control.spriteSize, line, sprite) || sprite.x === 255) {
      return;
    }

    const patternRow = getSpritePatternRow(control, this.mapper, line, sprite);

    for (let x = 0; x < TILE_SIZE; ++x) {
      const posX = sprite.x + x;

      const spriteX = flip(TILE_SIZE, sprite.flipX, x);

      if (
        posX >= mask.spriteXStart &&
        this.opacityBuffer[posX] &&
        patternRow[spriteX] > 0
      ) {
        status.spriteHit = true;
        break;
      }
    }
  }
}
