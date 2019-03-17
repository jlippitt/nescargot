import { debug, toHex } from 'log';

import AddressMode from '../addressMode';
import State from '../state';

function compare(state: State, lhs: number, rhs: number) {
  const { flags, clock } = state;
  const result = (lhs - rhs) & 0xff;
  flags.setZeroAndNegative(result);
  flags.carry = lhs >= rhs;
  clock.tick(2);
}

export const cmp = (addressMode: AddressMode) => (state: State) => {
  const { regs } = state;
  debug(`CMP ${addressMode}`);
  const value = state.getByte(addressMode, true);
  compare(state, regs.a, value);
};

export function cmpImmediate(state: State) {
  const { regs } = state;
  const value = state.nextByte();
  debug(`CMP ${toHex(value, 2)}`);
  compare(state, regs.a, value);
}

export const cpx = (addressMode: AddressMode) => (state: State) => {
  const { regs } = state;
  debug(`CPX ${addressMode}`);
  const value = state.getByte(addressMode, true);
  compare(state, regs.x, value);
};

export function cpxImmediate(state: State) {
  const { regs } = state;
  const value = state.nextByte();
  debug(`CPX ${toHex(value, 2)}`);
  compare(state, regs.x, value);
}

export const cpy = (addressMode: AddressMode) => (state: State) => {
  const { regs } = state;
  debug(`CPY ${addressMode}`);
  const value = state.getByte(addressMode, true);
  compare(state, regs.y, value);
};

export function cpyImmediate(state: State) {
  const { regs } = state;
  const value = state.nextByte();
  debug(`CPY ${toHex(value, 2)}`);
  compare(state, regs.y, value);
}
