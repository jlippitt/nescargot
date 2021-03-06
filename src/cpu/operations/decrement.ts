import { debug } from 'log';

import AddressMode from '../AddressMode';
import Flags from '../Flags';
import State from '../State';
import { mutateMemory } from './helpers';

function decrement(value: number, flags: Flags): number {
  const result = (value - 1) & 0xff;
  flags.setZeroAndNegative(result);
  return result;
}

export const dec = mutateMemory('DEC', decrement);

export function dex({ regs, flags, clock }: State) {
  debug('DEX');
  regs.x = decrement(regs.x, flags);
  clock.tick(2);
}

export function dey({ regs, flags, clock }: State) {
  debug('DEY');
  regs.y = decrement(regs.y, flags);
  clock.tick(2);
}
