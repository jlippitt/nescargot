export interface Scroll {
  x: number;
  y: number;
}

export default class Registers {
  private vramAddress: number = 0;
  private tempAddress: number = 0;
  private fineXScroll: number = 0;
  private firstWrite: boolean = true;

  public getVramAddress = (): number => this.vramAddress;

  public getScroll(): Scroll {
    const nameTableX = (this.tempAddress & 0x0400) >> 10;
    const nameTableY = (this.tempAddress & 0x0800) >> 11;
    const coarseX = this.tempAddress & 0x001f;
    const coarseY = (this.tempAddress & 0x03e0) >> 5;
    const fineY = (this.tempAddress & 0x7000) >> 12;

    return {
      x: nameTableX * 256 + coarseX * 8 + this.fineXScroll,
      y: nameTableY * 240 + coarseY * 8 + fineY,
    };
  }

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
    } else {
      this.tempAddress = (this.tempAddress & 0xff00) | value;
      this.vramAddress = this.tempAddress;
    }

    this.firstWrite = !this.firstWrite;
  }
}
