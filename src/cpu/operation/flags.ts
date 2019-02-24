import State from '../state';

export function sei({ flags, clock }: State) {
  console.log('SEI');
  flags.interrupt = true;
  clock.tick(2);
}
