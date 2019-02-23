import { toHex } from 'hex';
import Mapper from 'mapper';

import State from './state';

export default class Cpu {
  private state: State;

  constructor(mapper: Mapper) {
    this.state = new State(mapper);
  }

  public tick(): void {
    console.log(this.state.toString());

    const nextOp = this.state.nextByte();

    throw new Error(`Unknown op code ${toHex(nextOp, 2)}`);
  }
}
