import { debug, toHex } from 'log';

import State from '../state';

export function ldaImmediate(state: State) {
  const { regs, flags, clock, nextByte } = state;
  regs.a = state.nextByte();
  debug(`LDA ${toHex(regs.a, 2)}`);
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export function ldxImmediate(state: State) {
  const { regs, flags, clock, nextByte } = state;
  regs.x = state.nextByte();
  debug(`LDX ${toHex(regs.x, 2)}`);
  flags.setZeroAndNegative(regs.x);
  clock.tick(2);
}

export function ldyImmediate(state: State) {
  const { regs, flags, clock, nextByte } = state;
  regs.y = state.nextByte();
  debug(`LDY ${toHex(regs.y, 2)}`);
  flags.setZeroAndNegative(regs.y);
  clock.tick(2);
}