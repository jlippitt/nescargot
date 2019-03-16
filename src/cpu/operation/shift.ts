import { debug } from 'log';

import State from '../state';

export function aslAccumulator(state: State) {
  const { regs, flags, clock } = state;
  debug('ASL');
  flags.carry = (regs.a & 0x80) !== 0;
  regs.a = (regs.a << 1) & 0xff;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export function lsrAccumulator(state: State) {
  const { regs, flags, clock } = state;
  debug('LSR');
  flags.carry = (regs.a & 0x01) !== 0;
  regs.a = regs.a >> 1;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}
