import { debug } from 'log';

import AddressMode from '../AddressMode';
import Flags from '../Flags';
import State from '../State';

type Mutator = (value: number, flags: Flags) => number;

export const mutateAccumulator = (instruction: string, mutate: Mutator) => (
  state: State,
) => {
  const { regs, flags, clock } = state;
  debug(instruction);
  regs.a = mutate(regs.a, flags);
  clock.tick(2);
};

export const mutateMemory = (instruction: string, mutate: Mutator) => (
  addressMode: AddressMode,
) => (state: State) => {
  const { flags, mmu, clock } = state;
  debug(`${instruction} ${addressMode}`);
  const address = addressMode.lookup(state, false);
  const value = mmu.getByte(address);
  const result = mutate(value, flags);
  mmu.setByte(address, result);
  clock.tick(4);
};
