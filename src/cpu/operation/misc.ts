import { debug, toHex } from 'log';

import State from '../state';
import AddressMode from './addressMode';

export const bit = (addressMode: AddressMode) => (state: State) => {
  const { regs, mmu, flags, clock } = state;
  const address = addressMode.lookup(state);
  const value = mmu.getByte(address);
  flags.zero = (regs.a & value) === 0;
  flags.overflow = (value & 0x40) !== 0;
  flags.negative = (value & 0x80) !== 0;
  clock.tick(2);
};
