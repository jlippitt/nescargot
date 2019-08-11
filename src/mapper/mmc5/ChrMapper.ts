import { debug } from 'log';
import Pattern from 'ppu/Pattern';
import { PPUState } from 'ppu/PPU';
import { SpriteSize } from 'ppu/Renderer';

const BANK_SIZE = 64;

export default class ChrMapper {
  private chr: Pattern[];
  private mode: number = 3;
  private register: number[];
  private offset: number[];
  private bankOffset = 0;

  constructor(chr: Pattern[]) {
    this.chr = chr;
    this.register = Array(12).fill(0);
    this.offset = Array(16).fill(0);
    this.updateBanks();
  }

  public getPattern(index: number): Pattern {
    const bankIndex = this.bankOffset | ((index & 0x01c0) >> 6);
    return this.chr[this.offset[bankIndex] | (index & 0x003f)];
  }

  public setMode(value: number): void {
    this.mode = value & 0x03;
    debug(`CHR Mode ${this.mode}`);
    this.updateBanks();
  }

  public setRegister(index: number, value: number): void {
    this.register[index] = value;
    this.updateBanks();
  }

  public onPPUBackgroundRenderStart({ control }: PPUState): void {
    this.bankOffset = control.spriteSize === SpriteSize.Large ? 8 : 0;
  }

  public onPPUSpriteRenderStart(state: PPUState): void {
    this.bankOffset = 0;
  }

  private updateBanks(): void {
    switch (this.mode) {
      case 0:
        // Lower banks
        for (let i = 0; i < 8; ++i) {
          this.offset[i] = this.getOffset((this.register[7] << 3) + i);
        }

        // Upper banks
        for (let i = 0; i < 8; ++i) {
          this.offset[8 + i] = this.getOffset((this.register[11] << 3) + i);
        }
        break;

      case 1:
        // Lower banks
        for (let i = 0; i < 2; ++i) {
          const index = i * 4;
          const value = this.register[index + 1] << 2;

          for (let j = 0; j < 4; ++j) {
            this.offset[index + j] = this.getOffset(value + j);
          }
        }

        // Upper banks
        for (let i = 0; i < 2; ++i) {
          const index = 8 + i * 4;
          const value = this.register[11] << 2;

          for (let j = 0; j < 4; ++j) {
            this.offset[index + j] = this.getOffset(value + j);
          }
        }
        break;

      case 2:
        // Lower banks
        for (let i = 0; i < 4; ++i) {
          const index = i * 2;
          const value = this.register[index + 1] << 1;
          this.offset[index] = this.getOffset(value);
          this.offset[index + 1] = this.getOffset(value + 1);
        }

        // Upper banks
        for (let i = 0; i < 4; ++i) {
          const index = 8 + i * 2;
          const value = this.register[9 + 2 * (i % 2)] << 1;
          this.offset[index] = this.getOffset(value);
          this.offset[index + 1] = this.getOffset(value + 1);
        }
        break;

      case 3:
        // Lower banks
        for (let i = 0; i < 8; ++i) {
          this.offset[i] = this.getOffset(this.register[i]);
        }

        // Upper banks
        for (let i = 0; i < 8; ++i) {
          this.offset[8 + i] = this.getOffset(this.register[8 + (i % 4)]);
        }
        break;

      default:
        throw new Error('Should not happen');
    }

    for (let i = 0; i < 16; ++i) {
      debug(`CHR ${i} = ${this.offset[i]}`);
    }
  }

  private getOffset = (value: number): number =>
    (value * BANK_SIZE) % this.chr.length
}
