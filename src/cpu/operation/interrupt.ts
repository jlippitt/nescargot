import { debug } from 'log';

import State from '../state';

const IRQ_VECTOR = 0xfffe;
const NMI_VECTOR = 0xfffa;

function interrupt(state: State, vector: number, breakFlag: boolean) {
  const { regs, flags, mmu, clock } = state;
  state.pushWord(regs.pc);
  state.pushByte(flags.toByte(breakFlag));
  regs.pc = mmu.getWord(vector);
  clock.tick(7);
}

export function brk(state: State) {
  const { regs } = state;
  debug('BRK');
  ++regs.pc;
  interrupt(state, IRQ_VECTOR, true);
}

export function nmi(state: State) {
  debug('NMI');
  interrupt(state, NMI_VECTOR, false);
}

export function rti(state: State) {
  const { regs, flags, clock } = state;
  debug('RTI');
  flags.fromByte(state.pullByte());
  regs.pc = state.pullWord();
  clock.tick(6);
}
