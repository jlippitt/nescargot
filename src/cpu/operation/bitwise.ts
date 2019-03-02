import { debug, toHex } from 'log';

import State from '../state';
import AddressMode from './addressMode';

export function andImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`AND ${toHex(value, 2)}`);
  regs.a &= value;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export const bit = (addressMode: AddressMode) => (state: State) => {
  const { regs, mmu, flags, clock } = state;
  debug(`BIT ${addressMode}`);
  const address = addressMode.lookup(state);
  const value = mmu.getByte(address);
  flags.zero = (regs.a & value) === 0;
  flags.overflow = (value & 0x40) !== 0;
  flags.negative = (value & 0x80) !== 0;
  clock.tick(2);
};

export function oraImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`ORA ${toHex(value, 2)}`);
  regs.a |= value;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}
