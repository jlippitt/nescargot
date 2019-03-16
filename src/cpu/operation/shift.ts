import { debug } from 'log';

import Flags from '../flags';
import State from '../state';
import AddressMode from './addressMode';

function rotateLeft(value: number, flags: Flags): number {
  const oldCarry = flags.carry ? 0x01 : 0x00;
  flags.carry = (value & 0x80) !== 0;
  const result = ((value << 1) & 0xff) | oldCarry;
  flags.setZeroAndNegative(result);
  return result;
}

function rotateRight(value: number, flags: Flags): number {
  const oldCarry = flags.carry ? 0x80 : 0x00;
  flags.carry = (value & 0x01) !== 0;
  const result = (value >> 1) | oldCarry;
  flags.setZeroAndNegative(result);
  return result;
}

export function aslAccumulator(state: State) {
  const { regs, flags, clock } = state;
  debug('ASL');
  flags.carry = (regs.a & 0x80) !== 0;
  regs.a = (regs.a << 1) & 0xff;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export function lsrAccumulator(state: State) {
  const { regs, flags, clock } = state;
  debug('LSR');
  flags.carry = (regs.a & 0x01) !== 0;
  regs.a = regs.a >> 1;
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export const rol = (addressMode: AddressMode) => (state: State) => {
  const { flags, mmu, clock } = state;
  debug(`ROL ${addressMode}`);
  const address = addressMode.lookup(state, false);
  const value = mmu.getByte(address);
  const result = rotateLeft(value, flags);
  mmu.setByte(address, result);
  clock.tick(4);
};

export function rolAccumulator(state: State) {
  const { regs, flags, clock } = state;
  debug('ROL');
  regs.a = rotateLeft(regs.a, flags);
  clock.tick(2);
}

export const ror = (addressMode: AddressMode) => (state: State) => {
  const { flags, mmu, clock } = state;
  debug(`ROR ${addressMode}`);
  const address = addressMode.lookup(state, false);
  const value = mmu.getByte(address);
  const result = rotateRight(value, flags);
  mmu.setByte(address, result);
  clock.tick(4);
};

export function rorAccumulator(state: State) {
  const { regs, flags, clock } = state;
  debug('ROR');
  regs.a = rotateRight(regs.a, flags);
  clock.tick(2);
}
