import { debug, toHex } from 'log';

import State from '../state';

export function jmpAbsolute(state: State) {
  const { regs, clock } = state;
  const address = state.nextWord();
  debug(`JMP ${toHex(address, 4)}`);
  regs.pc = address;
  clock.tick(3);
}

export function jmpIndirect(state: State) {
  const { regs, mmu, clock } = state;
  const address = state.nextWord();
  debug(`JMP (${toHex(address, 4)})`);
  regs.pc = mmu.getWordWithinPage(address);
  clock.tick(5);
}

export function jsr(state: State) {
  const { regs, clock } = state;
  const address = state.nextWord();
  debug(`JSR ${toHex(address, 4)}`);
  state.pushWord((regs.pc - 1) & 0xffff);
  regs.pc = address;
  clock.tick(6);
}

export function rts(state: State) {
  const { regs, clock } = state;
  debug('RTS');
  regs.pc = (state.pullWord() + 1) & 0xffff;
  clock.tick(6);
}
