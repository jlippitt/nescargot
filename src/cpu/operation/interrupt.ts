import { debug } from 'log';

import State from '../state';

const IRQ_VECTOR = 0xfffe;
const NMI_VECTOR = 0xfffa;

const interrupt = (instruction: string, vector: number, breakFlag: boolean) => (
  state: State,
) => {
  const { regs, flags, mmu, clock } = state;
  debug(instruction);
  state.pushWord(regs.pc);
  state.pushByte(flags.toByte(breakFlag));
  regs.pc = mmu.getWord(vector);
  clock.tick(7);
};

export const brk = interrupt('BRK', IRQ_VECTOR, true);
export const nmi = interrupt('NMI', NMI_VECTOR, false);

export function rti(state: State) {
  const { regs, flags, clock } = state;
  debug('RTI');
  flags.fromByte(state.pullByte());
  regs.pc = state.pullWord();
  clock.tick(6);
}
