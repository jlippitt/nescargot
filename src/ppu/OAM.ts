import { times } from 'lodash';
import { debug, toHex } from 'log';

const NUM_SPRITES = 64;

export const OAM_SIZE = NUM_SPRITES * 4;

export enum Priority {
  Front,
  Back,
}

export interface Sprite {
  x: number;
  y: number;
  patternIndex: number;
  paletteIndex: number;
  priority: Priority;
  flipX: boolean;
  flipY: boolean;
}

export default class OAM {
  private ram: number[];
  private sprites: Sprite[];
  private address: number;

  constructor() {
    this.ram = Array(OAM_SIZE).fill(0);

    this.sprites = times(NUM_SPRITES, () => ({
      x: 0,
      y: 0,
      patternIndex: 0,
      paletteIndex: 0,
      priority: Priority.Front,
      flipX: false,
      flipY: false,
    }));

    this.address = 0;
  }

  public setAddressByte(value: number): void {
    debug(`OAM Address: ${toHex(value, 2)}`);
    this.address = value;
  }

  public getByte(): number {
    // Note: Reads do not increment address
    const value = this.ram[this.address];
    debug(`OAM Read: ${toHex(this.address, 2)} => ${toHex(value, 2)}`);
    return value;
  }

  public setByte(value: number): void {
    debug(`OAM Write: ${toHex(this.address, 2)} <= ${toHex(value, 2)}`);

    this.ram[this.address] = value;

    const sprite = this.sprites[(this.address & 0xff) >> 2];

    switch (this.address & 0x03) {
      case 0:
        sprite.y = value + 1;
        break;
      case 1:
        sprite.patternIndex = value;
        break;
      case 2:
        sprite.paletteIndex = value & 0x03;
        sprite.priority = (value & 0x20) !== 0 ? Priority.Back : Priority.Front;
        sprite.flipX = (value & 0x40) !== 0;
        sprite.flipY = (value & 0x80) !== 0;
        break;
      case 3:
        sprite.x = value;
        break;
      default:
      // Can't happen
    }

    this.address = (this.address + 1) % OAM_SIZE;
  }

  public getSprites(): Sprite[] {
    return this.sprites;
  }
}
