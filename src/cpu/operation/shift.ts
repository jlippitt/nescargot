import { debug } from 'log';

import Flags from '../flags';
import State from '../state';
import AddressMode from './addressMode';
import { mutateAccumulator, mutateMemory } from './helpers';

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

export const rol = mutateMemory('ROL', rotateLeft);
export const rolAccumulator = mutateAccumulator('ROL', rotateLeft);
export const ror = mutateMemory('ROR', rotateRight);
export const rorAccumulator = mutateAccumulator('ROR', rotateRight);
