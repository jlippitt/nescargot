import { debug, toHex } from 'log';

import AddressMode from '../addressMode';
import State from '../state';

function add(state: State, rhs: number) {
  const { flags, regs, clock } = state;
  const lhs = regs.a;
  const result = lhs + rhs + (flags.carry ? 1 : 0);
  regs.a = result & 0xff;
  flags.setZeroAndNegative(regs.a);
  flags.carry = result > 0xff;
  flags.overflow = (~(lhs ^ rhs) & (rhs ^ regs.a) & 0x80) !== 0;
  clock.tick(2);
}

export const adc = (addressMode: AddressMode) => (state: State) => {
  debug(`ADC ${addressMode}`);
  const value = state.getByte(addressMode, true);
  add(state, value);
};

export function adcImmediate(state: State) {
  const value = state.nextByte();
  debug(`ADC ${toHex(value, 2)}`);
  add(state, value);
}

export const sbc = (addressMode: AddressMode) => (state: State) => {
  debug(`SBC ${addressMode}`);
  const value = state.getByte(addressMode, true);
  add(state, value ^ 0xff);
};

export function sbcImmediate(state: State) {
  const value = state.nextByte();
  debug(`SBC ${toHex(value, 2)}`);
  add(state, value ^ 0xff);
}
