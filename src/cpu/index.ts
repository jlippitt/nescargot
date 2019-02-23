import Rom from 'rom';

export default class Cpu {
  private rom: Rom;

  constructor(rom: Rom) {
    this.rom = rom;
  }

  public tick(): void {
    console.log('tick');
  }
}
