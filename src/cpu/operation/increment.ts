import { debug } from 'log';

import AddressMode from '../addressMode';
import Flags from '../flags';
import State from '../state';
import { mutateMemory } from './helpers';

function increment(value: number, flags: Flags): number {
  const result = (value + 1) & 0xff;
  flags.setZeroAndNegative(result);
  return result;
}

export const inc = mutateMemory('INC', increment);

export function inx({ regs, flags, clock }: State) {
  debug('INX');
  regs.x = increment(regs.x, flags);
  clock.tick(2);
}

export function iny({ regs, flags, clock }: State) {
  debug('INY');
  regs.y = increment(regs.y, flags);
  clock.tick(2);
}
