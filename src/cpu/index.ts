import { debug } from 'log';
import Mapper from 'mapper';

import { opMap } from './operation';
import State from './state';

export default class Cpu {
  private state: State;

  constructor(mapper: Mapper) {
    this.state = new State(mapper);
  }

  public tick(): void {
    debug(this.state.toString());

    const nextOp = this.state.nextByte();

    opMap[nextOp](this.state);
  }
}
