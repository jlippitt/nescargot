import { debug, toHex } from 'log';

import AddressMode from '../AddressMode';
import State from '../State';

export const and = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`AND ${addressMode}`);
  regs.a &= state.getByte(addressMode, true);
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
};

export function andImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`AND ${toHex(value, 2)}`);
  regs.a &= value;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export const eor = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`EOR ${addressMode}`);
  regs.a ^= state.getByte(addressMode, true);
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
};

export function eorImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`EOR ${toHex(value, 2)}`);
  regs.a ^= value;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export const ora = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`ORA ${addressMode}`);
  regs.a |= state.getByte(addressMode, true);
  flags.setZeroAndNegative(regs.a);
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
