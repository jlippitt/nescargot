import { debug, toHex } from 'log';

import State from '../state';
import AddressMode from './addressMode';

function add(state: State, rhs: number) {
  const { flags, regs, clock } = state;
  const lhs = regs.a;
  regs.a = (lhs + rhs + (flags.carry ? 1 : 0)) & 0xff;
  flags.setZeroAndNegative(regs.a);
  flags.carry = regs.a < lhs;
  flags.overflow = ((lhs ^ regs.a) & (rhs ^ regs.a) & 0x80) !== 0;
  clock.tick(2);
}

function subtract(state: State, rhs: number) {
  const { flags, regs, clock } = state;
  const lhs = regs.a;
  regs.a = (lhs - rhs - (flags.carry ? 0 : 1)) & 0xff;
  flags.setZeroAndNegative(regs.a);
  flags.carry = regs.a <= lhs;
  flags.overflow = ((lhs ^ regs.a) & (rhs ^ regs.a) & 0x80) !== 0;
  clock.tick(2);
}

export const adc = (addressMode: AddressMode) => (state: State) => {
  const { mmu } = state;
  debug(`ADC ${addressMode}`);
  const address = addressMode.lookup(state, true);
  const value = mmu.getByte(address);
  add(state, value);
};

export function adcImmediate(state: State) {
  const value = state.nextByte();
  debug(`ADC ${toHex(value, 2)}`);
  add(state, value);
}

export const sbc = (addressMode: AddressMode) => (state: State) => {
  const { mmu } = state;
  debug(`SBC ${addressMode}`);
  const address = addressMode.lookup(state, true);
  const value = mmu.getByte(address);
  subtract(state, value);
};

export function sbcImmediate(state: State) {
  const value = state.nextByte();
  debug(`SBC ${toHex(value, 2)}`);
  subtract(state, value);
}
