import { debug } from 'log';

import State from '../state';

export function sei({ flags, clock }: State) {
  debug('SEI');
  flags.interrupt = true;
  clock.tick(2);
}
