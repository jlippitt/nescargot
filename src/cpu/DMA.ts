import Interrupt from 'Interrupt';
import { debug } from 'log';
import OAM, { OAM_SIZE } from 'ppu/OAM';

import State from './State';

export default class DMA {
  private oam: OAM;
  private interrupt: Interrupt;
  private startAddress: number;
  private offset: number;

  constructor(oam: OAM, interrupt: Interrupt) {
    this.oam = oam;
    this.interrupt = interrupt;
    this.startAddress = 0;
    this.offset = 0;
  }

  public begin(startAddress: number): void {
    this.startAddress = startAddress << 8;
    this.offset = 0;
    this.interrupt.setDmaInProgress(true);
  }

  public tick(state: State): void {
    const { clock, mmu } = state;

    debug('DMA');

    if (this.offset === 0) {
      clock.tick((clock.getTicks() % 2) + 1);
    }

    const value = mmu.getByte(this.startAddress + this.offset);
    this.oam.setDmaByte(this.offset, value);
    ++this.offset;

    if (this.offset >= OAM_SIZE) {
      this.interrupt.setDmaInProgress(false);
    }
  }
}
