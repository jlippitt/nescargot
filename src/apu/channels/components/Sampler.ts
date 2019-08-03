export type Sample = number[];

export default class Sampler {
  private buffer: Sample;
  private position: number = 0;

  constructor(sample: Sample) {
    this.buffer = sample;
  }

  public setSample(sample: Sample): void {
    if (sample.length !== this.buffer.length) {
      throw new Error('New sample must be same length as previous sample');
    }

    this.buffer = sample;
  }

  public advance(increment: number): void {
    this.position = (this.position + increment) % this.buffer.length;
  }

  public sample(): number {
    return this.buffer[this.position];
  }
}
