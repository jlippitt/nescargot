import { debug } from 'log';
import Mapper from 'mapper';
import PPU from 'ppu';

import Hardware from './hardware';
import { opMap } from './operation';
import State from './state';

export default class CPU {
  private state: State;

  constructor(hardware: Hardware) {
    this.state = new State(hardware);
  }

  public tick(): void {
    debug(this.state.toString());

    const nextOp = this.state.nextByte();

    opMap[nextOp](this.state);
  }
}
