import { FrameType } from '../FrameCounter';
import Envelope from './components/Envelope';
import FrequencyClock, {
  deriveLinearPeriod,
} from './components/FrequencyClock';
import LengthCounter from './components/LengthCounter';
import Sequencer, { Sequence } from './components/Sequencer';
import Sweep from './components/Sweep';

const DUTY_CYCLES: Sequence[] = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1],
];

const TIMER_PERIOD_MULTIPLIER = 2;

export default class PulseChannel {
  private pulseDuty: Sequencer;
  private timer: FrequencyClock;
  private envelope: Envelope;
  private sweep: Sweep;
  private lengthCounter: LengthCounter;

  constructor(negationOffset: number) {
    this.pulseDuty = new Sequencer(DUTY_CYCLES[0]);
    this.timer = new FrequencyClock(
      deriveLinearPeriod(TIMER_PERIOD_MULTIPLIER),
    );
    this.envelope = new Envelope();
    this.sweep = new Sweep(this.timer, negationOffset);
    this.lengthCounter = new LengthCounter();
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.pulseDuty.setSequence(DUTY_CYCLES[(value & 0xc0) >> 6]);
        this.lengthCounter.setHalted((value & 0x20) !== 0);
        this.envelope.setByte(value & 0x3f);
        break;
      case 1:
        this.sweep.setByte(value);
        break;
      case 2:
        this.timer.setLowerByte(value);
        break;
      case 3:
        this.lengthCounter.setValue((value & 0xf8) >> 3);
        this.timer.setUpperByte(value);
        this.envelope.setStartFlag();
        this.pulseDuty.reset();
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  public setEnabled(enabled: boolean): void {
    this.lengthCounter.setEnabled(enabled);
  }

  public tick(ticks: number): void {
    this.pulseDuty.advance(this.timer.tick(ticks));
  }

  public update(frameType: FrameType): void {
    this.envelope.advance();

    if (frameType === FrameType.HalfFrame) {
      this.sweep.advance();
      this.lengthCounter.advance();
    }
  }

  public isPlaying(): boolean {
    return this.lengthCounter.isEnabled();
  }

  public sample(): number {
    if (this.lengthCounter.isEnabled() && !this.sweep.isMuteFlagSet()) {
      return this.pulseDuty.sample() * this.envelope.getVolume();
    } else {
      return 0;
    }
  }
}
