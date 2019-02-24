export default class PPU {
  public get(offset: number): number {
    switch (offset % 8) {
      case 2:
        return 0x80;
      default:
        return 0;
    }
  }

  public set(offset: number, value: number): void {
    // TODO
  }
}
