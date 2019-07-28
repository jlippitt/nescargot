import Interrupt from 'interrupt';
import { debug } from 'log';
import PPU from 'ppu';

import DMA from './DMA';
import Hardware from './Hardware';
import operations from './operations';
import { nmi } from './operations/interrupt';
import State from './State';

export default class CPU {
  private state: State;
  private interrupt: Interrupt;
  private dma: DMA;

  constructor(hardware: Hardware) {
    this.state = new State(hardware);
    this.interrupt = hardware.interrupt;
    this.dma = hardware.dma;
  }

  public tick(): number {
    const { clock } = this.state;

    debug(this.state.toString());

    const prevTicks = clock.getTicks();

    if (this.interrupt.hasAnyCondition()) {
      if (this.interrupt.isDmaInProgress()) {
        this.dma.tick(this.state);
      } else if (this.interrupt.checkNmi()) {
        nmi(this.state);
      }
    } else {
      const nextOp = this.state.nextByte();
      operations[nextOp](this.state);
    }

    return clock.getTicks() - prevTicks;
  }
}
