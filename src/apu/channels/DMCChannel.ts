import SampleReader from 'SampleReader';

import FrequencyClock from './components/FrequencyClock';

const TIMER_PERIODS = [
  428,
  380,
  340,
  320,
  286,
  254,
  226,
  214,
  190,
  160,
  142,
  128,
  106,
  84,
  72,
  54,
];

export default class DMCChannel {
  private sampleReader: SampleReader;
  private timer: FrequencyClock;
  private outputLevel: number = 0;
  private shift: number = 0;
  private bitsRemaining: number = 8;
  private silence: boolean = true;

  constructor(sampleReader: SampleReader) {
    this.sampleReader = sampleReader;
    this.timer = new FrequencyClock((value) => TIMER_PERIODS[value]);
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.sampleReader.setInterruptEnabled((value & 0x80) !== 0);
        this.sampleReader.setLoop((value & 0x40) !== 0);
        this.timer.setValue(value & 0x0f);
        break;
      case 1:
        this.outputLevel = value & 0x7f;
        break;
      case 2:
        this.sampleReader.setAddress(value);
        break;
      case 3:
        this.sampleReader.setLength(value);
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  public setEnabled(enabled: boolean): void {
    this.sampleReader.setEnabled(enabled);
  }

  public tick(ticks: number): void {
    const clocks = this.timer.tick(ticks);

    for (let i = 0; i < clocks; ++i) {
      if (!this.silence) {
        const result =
          (this.shift & 0x01) !== 0
            ? this.outputLevel + 2
            : this.outputLevel - 2;

        if (result >= 0 && result <= 127) {
          this.outputLevel = result;
        }
      }

      this.shift = this.shift >> 1;

      if (--this.bitsRemaining > 0) {
        continue;
      }

      this.bitsRemaining = 8;

      const sample = this.sampleReader.readNext();

      if (sample !== undefined) {
        this.shift = sample;
        this.silence = false;
      } else {
        this.silence = true;
      }
    }
  }

  public update(frameNumber: number): void {
    // Nothing
  }

  public isPlaying(): boolean {
    return this.sampleReader.isPlaying();
  }

  public sample(): number {
    return this.silence ? this.outputLevel : 0;
  }

  public isInterruptSet(): boolean {
    return this.sampleReader.isInterruptSet();
  }

  public clearInterrupt(): void {
    this.sampleReader.clearInterrupt();
  }
}
