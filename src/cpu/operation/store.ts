import { debug, toHex } from 'log';

import State from '../state';
import AddressMode from './addressMode';

export const sta = (addressMode: AddressMode) => (state: State) => {
  const { regs, mmu, clock } = state;
  debug(`STA ${addressMode}`);
  const address = addressMode.lookup(state);
  mmu.setByte(address, regs.a);
  clock.tick(2);
};
