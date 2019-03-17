import { debug, toHex } from 'log';

import AddressMode from '../addressMode';
import State from '../state';

export const sta = (addressMode: AddressMode) => (state: State) => {
  const { regs, mmu, clock } = state;
  debug(`STA ${addressMode}`);
  const address = addressMode.lookup(state);
  mmu.setByte(address, regs.a);
  clock.tick(2);
};

export const stx = (addressMode: AddressMode) => (state: State) => {
  const { regs, mmu, clock } = state;
  debug(`STX ${addressMode}`);
  const address = addressMode.lookup(state);
  mmu.setByte(address, regs.x);
  clock.tick(2);
};

export const sty = (addressMode: AddressMode) => (state: State) => {
  const { regs, mmu, clock } = state;
  debug(`STY ${addressMode}`);
  const address = addressMode.lookup(state);
  mmu.setByte(address, regs.y);
  clock.tick(2);
};
