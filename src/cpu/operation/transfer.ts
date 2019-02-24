import { debug } from 'log';

import State from '../state';

export function tax({ regs, flags, clock }: State) {
  debug('TAX');
  regs.x = regs.a;
  flags.setZeroAndNegative(regs.x);
  clock.tick(2);
}

export function tay({ regs, flags, clock }: State) {
  debug('TAY');
  regs.y = regs.a;
  flags.setZeroAndNegative(regs.y);
  clock.tick(2);
}

export function tsx({ regs, flags, clock }: State) {
  debug('TSX');
  regs.x = regs.s;
  flags.setZeroAndNegative(regs.x);
  clock.tick(2);
}

export function txa({ regs, flags, clock }: State) {
  debug('TXA');
  regs.a = regs.x;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export function txs({ regs, clock }: State) {
  debug('TXS');
  regs.s = regs.x;
  clock.tick(2);
}

export function tya({ regs, flags, clock }: State) {
  debug('TYA');
  regs.a = regs.y;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}
