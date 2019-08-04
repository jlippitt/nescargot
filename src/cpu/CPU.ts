import DMA from 'DMA';
import Interrupt from 'Interrupt';
import { debug } from 'log';

import Hardware from './Hardware';
import operations from './operations';
import { irq, nmi } from './operations/interrupt';
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
    const { clock, flags } = this.state;

    debug(this.state.toString());

    const prevTicks = clock.getTicks();

    if (this.interrupt.hasAnyCondition(flags.interrupt)) {
      if (this.interrupt.isDmaInProgress()) {
        this.dma.tick(this.state);
      } else if (this.interrupt.checkNmi()) {
        nmi(this.state);
      } else if (this.interrupt.checkIrq()) {
        irq(this.state);
      }
    } else {
      const nextOp = this.state.nextByte();
      operations[nextOp](this.state);
    }

    return clock.getTicks() - prevTicks;
  }
}
