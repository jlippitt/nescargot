import { debug, toHex } from 'log';

import State from '../state';

export function cmpImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`CMP ${value}`);
  const result = (regs.a - value) & 0xff;
  flags.setZeroAndNegative(result);
  flags.carry = regs.a >= value;
  clock.tick(2);
}
