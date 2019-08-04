import FrequencyClock, {
  deriveLinearPeriod,
} from './components/FrequencyClock';
import LengthCounter from './components/LengthCounter';
import LinearCounter from './components/LinearCounter';
import Sequencer, { Sequence } from './components/Sequencer';

const TIMER_PERIOD_MULTIPLIER = 1;

const TRIANGLE_SEQUENCE = [
  15,
  14,
  13,
  12,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
];

export default class TriangleChannel {
  private timer: FrequencyClock;
  private sequencer: Sequencer;
  private lengthCounter: LengthCounter;
  private linearCounter: LinearCounter;

  constructor() {
    this.timer = new FrequencyClock(
      deriveLinearPeriod(TIMER_PERIOD_MULTIPLIER),
    );
    this.sequencer = new Sequencer(TRIANGLE_SEQUENCE);
    this.lengthCounter = new LengthCounter();
    this.linearCounter = new LinearCounter();
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.lengthCounter.setHalted((value & 0x80) !== 0);
        this.linearCounter.setByte(value);
        this.linearCounter.setReload();
        break;
      case 1:
        // Unused
        break;
      case 2:
        this.timer.setLowerByte(value);
        break;
      case 3:
        this.lengthCounter.setValue((value & 0xf8) >> 3);
        this.timer.setUpperByte(value);
        this.linearCounter.setReload();
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  public setEnabled(enabled: boolean) {
    this.lengthCounter.setEnabled(enabled);
  }

  public tick(ticks: number): void {
    const sequenceTicks = this.timer.tick(ticks);

    if (this.lengthCounter.isEnabled() && this.linearCounter.isEnabled()) {
      this.sequencer.advance(sequenceTicks);
    }
  }

  public update(frameNumber: number): void {
    this.linearCounter.advance();

    if (frameNumber % 2 === 0) {
      this.lengthCounter.advance();
    }
  }

  public isPlaying(): boolean {
    return this.lengthCounter.isEnabled();
  }

  public sample(): number {
    return this.sequencer.sample();
  }
}