export type Sequence = number[];

export default class Sequencer {
  private sequence: Sequence;
  private position: number = 0;

  constructor(sequence: Sequence) {
    this.sequence = sequence;
  }

  public setSequence(sequence: Sequence): void {
    if (sequence.length !== this.sequence.length) {
      throw new Error('New sequence must be same length as previous sequence');
    }

    this.sequence = sequence;
  }

  public advance(increment: number): void {
    this.position = (this.position + increment) % this.sequence.length;
  }

  public sample(): number {
    return this.sequence[this.position];
  }
}
