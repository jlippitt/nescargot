import { debug } from 'log';

import State from '../state';
import AddressMode from './addressMode';

export const inc = (addressMode: AddressMode) => (state: State) => {
  const { mmu, flags, clock } = state;
  debug(`INC ${addressMode}`);
  const address = addressMode.lookup(state, false);
  const value = mmu.getByte(address);
  const result = (value + 1) & 0xff;
  mmu.setByte(address, result);
  flags.setZeroAndNegative(result);
  clock.tick(4);
};

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
