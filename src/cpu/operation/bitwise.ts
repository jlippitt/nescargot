import { debug, toHex } from 'log';

import AddressMode from '../addressMode';
import State from '../state';

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

export const bit = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`BIT ${addressMode}`);
  const value = state.getByte(addressMode, false);
  flags.zero = (regs.a & value) === 0;
  flags.overflow = (value & 0x40) !== 0;
  flags.negative = (value & 0x80) !== 0;
  clock.tick(2);
};

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
