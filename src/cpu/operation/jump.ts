import { debug, toHex } from 'log';

import State from '../state';

export function jsr(state: State) {
  const { regs, clock } = state;
  const address = state.nextWord();
  debug(`JSR ${toHex(address, 4)}`);
  state.pushWord((regs.pc - 1) & 0xffff);
  regs.pc = address;
  clock.tick(6);
}
