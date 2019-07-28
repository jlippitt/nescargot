import { debug } from 'log';

import AddressMode from '../AddressMode';
import Flags from '../Flags';
import State from '../State';
import { mutateAccumulator, mutateMemory } from './helpers';

function shiftLeft(value: number, flags: Flags): number {
  flags.carry = (value & 0x80) !== 0;
  const result = (value << 1) & 0xff;
  flags.setZeroAndNegative(result);
  return result;
}

function shiftRight(value: number, flags: Flags): number {
  flags.carry = (value & 0x01) !== 0;
  const result = value >> 1;
  flags.setZeroAndNegative(result);
  return result;
}

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

export const asl = mutateMemory('ASL', shiftLeft);
export const aslAccumulator = mutateAccumulator('ASL', shiftLeft);
export const lsr = mutateMemory('LSR', shiftRight);
export const lsrAccumulator = mutateAccumulator('LSR', shiftRight);
export const rol = mutateMemory('ROL', rotateLeft);
export const rolAccumulator = mutateAccumulator('ROL', rotateLeft);
export const ror = mutateMemory('ROR', rotateRight);
export const rorAccumulator = mutateAccumulator('ROR', rotateRight);
