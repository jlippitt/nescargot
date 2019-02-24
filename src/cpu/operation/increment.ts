import { debug } from 'log';

import State from '../state';

export function inx({ regs, flags, clock }: State) {
  debug('INX');
  regs.x = (regs.x + 1) & 0xff;
  flags.setZeroAndNegative(regs.x);
  clock.tick(2);
}

export function iny({ regs, flags, clock }: State) {
  debug('INY');
  regs.y = (regs.y + 1) & 0xff;
  flags.setZeroAndNegative(regs.y);
  clock.tick(2);
}
