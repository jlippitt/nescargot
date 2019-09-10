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

  public getDataByte(): number {
    // Note: Reads do not increment address
    const value = this.ram[this.address];
    debug(`OAM Read: ${toHex(this.address, 2)} => ${toHex(value, 2)}`);
    return value;
  }

  public setDataByte(value: number): void {
    this.setDmaByte(this.address, value);
    this.address = (this.address + 1) % OAM_SIZE;
  }

  public setDmaByte(offset: number, value: number): void {
    debug(`OAM Write: ${toHex(offset, 2)} <= ${toHex(value, 2)}`);

    this.ram[offset] = value;

    const sprite = this.sprites[(offset & 0xff) >> 2];

    switch (offset & 0x03) {
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
  }

  public getSprites(): Sprite[] {
    return this.sprites;
  }
}
