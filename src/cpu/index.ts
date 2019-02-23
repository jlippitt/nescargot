import Mapper from 'mapper';

import State from './state';

export default class Cpu {
  private state: State;

  constructor(mapper: Mapper) {
    this.state = new State(mapper);
  }

  public tick(): void {
    console.log(this.state.toString());
  }
}
