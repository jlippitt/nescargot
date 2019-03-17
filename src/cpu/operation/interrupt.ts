import { debug } from 'log';

import State from '../state';

const NMI_VECTOR = 0xfffa;

export function nmi(state: State) {
  const { regs, flags, mmu, clock } = state;
  debug('NMI');
  state.pushWord(regs.pc);
  state.pushByte(flags.toByte(false));
  regs.pc = mmu.getWord(NMI_VECTOR);
  clock.tick(7);
}

export function rti(state: State) {
  const { regs, flags, clock } = state;
  debug('RTI');
  flags.fromByte(state.pullByte());
  regs.pc = state.pullWord();
  clock.tick(6);
}
