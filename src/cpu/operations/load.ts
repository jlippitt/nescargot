import { debug, toHex } from 'log';

import AddressMode from '../AddressMode';
import State from '../State';

export const lda = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`LDA ${addressMode}`);
  regs.a = state.getByte(addressMode, true);
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
};

export function ldaImmediate(state: State) {
  const { regs, flags, clock, nextByte } = state;
  regs.a = state.nextByte();
  debug(`LDA ${toHex(regs.a, 2)}`);
  flags.setZeroAndNegative(regs.a);
  clock.tick(2);
}

export const ldx = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`LDX ${addressMode}`);
  regs.x = state.getByte(addressMode, true);
  flags.setZeroAndNegative(regs.x);
  clock.tick(2);
};

export function ldxImmediate(state: State) {
  const { regs, flags, clock, nextByte } = state;
  regs.x = state.nextByte();
  debug(`LDX ${toHex(regs.x, 2)}`);
  flags.setZeroAndNegative(regs.x);
  clock.tick(2);
}

export const ldy = (addressMode: AddressMode) => (state: State) => {
  const { regs, flags, clock } = state;
  debug(`LDY ${addressMode}`);
  regs.y = state.getByte(addressMode, true);
  flags.setZeroAndNegative(regs.y);
  clock.tick(2);
};

export function ldyImmediate(state: State) {
  const { regs, flags, clock, nextByte } = state;
  regs.y = state.nextByte();
  debug(`LDY ${toHex(regs.y, 2)}`);
  flags.setZeroAndNegative(regs.y);
  clock.tick(2);
}
