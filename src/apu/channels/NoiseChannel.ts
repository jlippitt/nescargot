import Envelope from './components/Envelope';
import FrequencyClock from './components/FrequencyClock';
import LengthCounter from './components/LengthCounter';

const TIMER_PERIODS = [
  4,
  8,
  16,
  32,
  64,
  96,
  128,
  160,
  202,
  254,
  380,
  508,
  762,
  1016,
  2034,
  4068,
];

export default class NoiseChannel {
  private timer: FrequencyClock;
  private envelope: Envelope;
  private lengthCounter: LengthCounter;
  private shift: number = 0x01;
  private mode: boolean = false;

  constructor() {
    this.timer = new FrequencyClock((value) => TIMER_PERIODS[value] * 2);
    this.envelope = new Envelope();
    this.lengthCounter = new LengthCounter();
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.lengthCounter.setHalted((value & 0x20) !== 0);
        this.envelope.setByte(value);
        break;
      case 1:
        // Unused
        break;
      case 2:
        this.mode = (value & 0x80) !== 0;
        this.timer.setValue(value & 0x0f);
        break;
      case 3:
        this.lengthCounter.setValue((value & 0xf8) >> 3);
        this.envelope.setStartFlag();
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  public setEnabled(enabled: boolean) {
    this.lengthCounter.setEnabled(enabled);
  }

  public tick(ticks: number): void {
    const shifts = this.timer.tick(ticks);

    for (let i = 0; i < shifts; ++i) {
      const lhs = this.shift & 0x01;

      const rhs = this.mode
        ? (this.shift & 0x40) >> 6
        : (this.shift & 0x02) >> 1;

      this.shift = (this.shift >> 1) | ((lhs ^ rhs) << 14);
    }
  }

  public update(longFrame: boolean): void {
    this.envelope.advance();

    if (longFrame) {
      this.lengthCounter.advance();
    }
  }

  public isPlaying(): boolean {
    return this.lengthCounter.isEnabled();
  }

  public sample(): number {
    if (this.lengthCounter.isEnabled() && (this.shift & 0x01) === 0) {
      return this.envelope.getVolume();
    } else {
      return 0;
    }
  }
}
