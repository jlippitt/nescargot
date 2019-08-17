import { debug, toHex } from 'log';

const HORIZONTAL_INCREMENT = 1;
const VERTICAL_INCREMENT = 32;

export interface Scroll {
  nameTableIndex: number;
  coarseY: number;
  fineY: number;
  coarseX: number;
  fineX: number;
}

export default class Registers {
  private vramAddress: number = 0;
  private vramIncrement: number = HORIZONTAL_INCREMENT;
  private tempAddress: number = 0;
  private fineXScroll: number = 0;
  private firstWrite: boolean = true;

  public getVramAddress = (): number => this.vramAddress & 0x3fff;

  public getScroll = (): Scroll => ({
    nameTableIndex: (this.vramAddress & 0x0c00) >> 10,
    coarseY: (this.vramAddress & 0x03e0) >> 5,
    fineY: (this.vramAddress & 0x7000) >> 12,
    coarseX: this.vramAddress & 0x001f,
    fineX: this.fineXScroll,
  })

  public clearWriteLatch(): void {
    this.firstWrite = true;
  }

  public setNameTableIndexes(value: number): void {
    this.tempAddress = (this.tempAddress & 0xf3ff) | (value << 10);
  }

  public setScrollByte(value: number): void {
    if (this.firstWrite) {
      this.tempAddress = (this.tempAddress & 0xffe0) | ((value & 0xf8) >> 3);
      this.fineXScroll = value & 0x07;
    } else {
      this.tempAddress =
        (this.tempAddress & 0x0c1f) |
        ((value & 0xf8) << 2) |
        ((value & 0x07) << 12);
    }

    this.firstWrite = !this.firstWrite;
  }

  public setAddressByte(value: number): void {
    if (this.firstWrite) {
      this.tempAddress = (this.tempAddress & 0x00ff) | (value << 8);
      this.vramAddress ^= 0x4000;
    } else {
      this.tempAddress = (this.tempAddress & 0xff00) | value;
      this.vramAddress = this.tempAddress;
      debug(`VRAM Address: ${toHex(this.vramAddress, 4)}`);
    }

    this.firstWrite = !this.firstWrite;
  }

  public setVramIncrement(vertical: boolean): void {
    this.vramIncrement = vertical ? VERTICAL_INCREMENT : HORIZONTAL_INCREMENT;
    debug(`VRAM Increment: ${this.vramIncrement}`);
  }

  public incrementVramAddress(): void {
    this.vramAddress =
      (this.vramAddress & 0x4000) |
      ((this.vramAddress + this.vramIncrement) & 0x3fff);
  }

  public copyVerticalBits(): void {
    this.vramAddress =
      (this.vramAddress & 0x041f) | (this.tempAddress & 0x7be0);
  }

  public copyHorizontalBits(): void {
    // First increment Y scroll. Code 'paraphrased' from Nesdev wiki.
    if ((this.vramAddress & 0x7000) !== 0x7000) {
      this.vramAddress += 0x1000;
    } else {
      this.vramAddress &= ~0x7000;

      let y = (this.vramAddress & 0x03e0) >> 5;

      if (y === 29) {
        y = 0;
        this.vramAddress ^= 0x0800;
      } else if (y === 31) {
        y = 0;
      } else {
        y += 1;
      }

      this.vramAddress = (this.vramAddress & ~0x03e0) | (y << 5);
    }

    // Then reset horizontal scroll
    this.vramAddress =
      (this.vramAddress & 0x7be0) | (this.tempAddress & 0x041f);
  }
}
