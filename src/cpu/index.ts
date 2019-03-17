import Interrupt from 'interrupt';
import { debug } from 'log';
import Mapper from 'mapper';
import PPU from 'ppu';

import Hardware from './hardware';
import { opMap } from './operation';
import { nmi } from './operation/interrupt';
import State from './state';

export default class CPU {
  private state: State;
  private interrupt: Interrupt;

  constructor(hardware: Hardware) {
    this.state = new State(hardware);
    this.interrupt = hardware.interrupt;
  }

  public tick(): number {
    const { clock } = this.state;

    debug(this.state.toString());

    const prevTicks = clock.getTicks();

    if (this.interrupt.checkNmi()) {
      nmi(this.state);
    } else {
      const nextOp = this.state.nextByte();
      opMap[nextOp](this.state);
    }

    return clock.getTicks() - prevTicks;
  }
}
