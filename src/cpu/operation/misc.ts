import { debug } from 'log';

import AddressMode from '../addressMode';
import State from '../state';

export const bit = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`BIT ${addressMode}`);
  const value = state.getByte(addressMode, false);
  flags.zero = (regs.a & value) === 0;
  flags.overflow = (value & 0x40) !== 0;
  flags.negative = (value & 0x80) !== 0;
  clock.tick(2);
};

export const nop = (state: State) => {
  const { clock } = state;
  debug('NOP');
  clock.tick(2);
};
