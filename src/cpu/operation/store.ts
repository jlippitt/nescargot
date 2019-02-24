import { debug, toHex } from 'log';

import AddressMode from './addressMode';
import State from '../state';

export const sta = (addressMode: AddressMode) => function sta(state: State) {
  const { regs, mmu, clock } = state;
  debug(`STA ${addressMode}`);
  const address = addressMode.lookup(state);
  mmu.setByte(address, regs.a);
  clock.tick(2);
};
