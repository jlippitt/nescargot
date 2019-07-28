import { debug } from 'log';

import State from '../State';

const toSigned = (value: number): number =>
  value >= 128 ? value - 256 : value;

function branch(state: State, condition: boolean) {
  const { regs, clock } = state;

  if (condition) {
    const offset = state.nextByte();
    const target = (regs.pc + toSigned(offset)) & 0xffff;

    if ((target & 0xff00) === (regs.pc & 0xff00)) {
      clock.tick(3);
    } else {
      clock.tick(4);
    }

    regs.pc = target;
  } else {
    regs.pc += 1;
    clock.tick(2);
  }
}

export function bcc(state: State) {
  debug('BCC');
  branch(state, !state.flags.carry);
}

export function bcs(state: State) {
  debug('BCS');
  branch(state, state.flags.carry);
}

export function beq(state: State) {
  debug('BEQ');
  branch(state, state.flags.zero);
}

export function bmi(state: State) {
  debug('BMI');
  branch(state, state.flags.negative);
}

export function bne(state: State) {
  debug('BNE');
  branch(state, !state.flags.zero);
}

export function bpl(state: State) {
  debug('BPL');
  branch(state, !state.flags.negative);
}

export function bvc(state: State) {
  debug('BVC');
  branch(state, !state.flags.overflow);
}

export function bvs(state: State) {
  debug('BVS');
  branch(state, state.flags.overflow);
}
