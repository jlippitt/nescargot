import { debug } from 'log';

import State from '../state';

export function pha(state: State) {
  const { regs, clock } = state;
  debug('PHA');
  state.pushByte(regs.a);
  clock.tick(3);
}

export function php(state: State) {
  const { flags, clock } = state;
  debug('PHP');
  state.pushByte(flags.toByte(false));
  clock.tick(3);
}

export function pla(state: State) {
  const { regs, flags, clock } = state;
  debug('PLA');
  regs.a = state.pullByte();
  flags.setZeroAndNegative(regs.a);
  clock.tick(4);
}

export function plp(state: State) {
  const { flags, clock } = state;
  debug('PLP');
  flags.fromByte(state.pullByte());
  clock.tick(4);
}
