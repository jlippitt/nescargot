import { debug, toHex } from 'log';

import State from '../state';

export function cmpImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`CMP ${toHex(value, 2)}`);
  const result = (regs.a - value) & 0xff;
  flags.setZeroAndNegative(result);
  flags.carry = regs.a >= value;
  clock.tick(2);
}

export function cpxImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`CPX ${toHex(value, 2)}`);
  const result = (regs.x - value) & 0xff;
  flags.setZeroAndNegative(result);
  flags.carry = regs.x >= value;
  clock.tick(2);
}

export function cpyImmediate(state: State) {
  const { regs, flags, clock } = state;
  const value = state.nextByte();
  debug(`CPY ${toHex(value, 2)}`);
  const result = (regs.y - value) & 0xff;
  flags.setZeroAndNegative(result);
  flags.carry = regs.y >= value;
  clock.tick(2);
}
