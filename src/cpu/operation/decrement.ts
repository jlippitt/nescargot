import { debug } from 'log';

import State from '../state';

export function dex({ regs, flags, clock }: State) {
  debug('DEX');
  regs.x = (regs.x - 1) & 0xff;
  flags.setZeroAndNegative(regs.x);
  clock.tick(2);
}

export function dey({ regs, flags, clock }: State) {
  debug('DEY');
  regs.y = (regs.y - 1) & 0xff;
  flags.setZeroAndNegative(regs.y);
  clock.tick(2);
}
