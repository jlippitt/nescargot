import { debug } from 'log';

import State from '../state';

export function clc({ flags, clock }: State) {
  debug('CLC');
  flags.carry = false;
  clock.tick(2);
}

export function cld({ flags, clock }: State) {
  debug('CLD');
  flags.decimal = false;
  clock.tick(2);
}

export function cli({ flags, clock }: State) {
  debug('CLI');
  flags.interrupt = false;
  clock.tick(2);
}

export function clv({ flags, clock }: State) {
  debug('CLV');
  flags.overflow = false;
  clock.tick(2);
}

export function sec({ flags, clock }: State) {
  debug('SEC');
  flags.carry = true;
  clock.tick(2);
}

export function sed({ flags, clock }: State) {
  debug('SED');
  flags.decimal = true;
  clock.tick(2);
}

export function sei({ flags, clock }: State) {
  debug('SEI');
  flags.interrupt = true;
  clock.tick(2);
}
