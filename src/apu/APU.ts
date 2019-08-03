import SampleBuffer from './buffers/SampleBuffer';
import PulseChannel from './channels/PulseChannel';
import FrameCounter from './FrameCounter';
import Mixer from './Mixer';

export const SAMPLE_RATE = 11025;

export const APU_CLOCK_SHIFT = 8;
export const APU_CLOCK_MULTIPLIER = 1 << APU_CLOCK_SHIFT;

const MASTER_CLOCK_RATE = (21477270 * APU_CLOCK_MULTIPLIER) / 12;

const TICKS_PER_SAMPLE = Math.ceil(MASTER_CLOCK_RATE / SAMPLE_RATE);

export default class APU {
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;
  private mixer: Mixer;
  private frameCounter: FrameCounter;
  private sampleBuffer: SampleBuffer;
  private sampleClock: number = 0;

  constructor(sampleBuffer: SampleBuffer) {
    this.pulse1 = new PulseChannel();
    this.pulse2 = new PulseChannel();

    this.mixer = new Mixer({
      pulse1: this.pulse1,
      pulse2: this.pulse2,
    });

    this.frameCounter = new FrameCounter();
    this.sampleBuffer = sampleBuffer;
  }

  public getByte(offset: number): number {
    return 0;
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0xfc) {
      case 0x00:
        this.pulse1.setByte(offset, value);
        break;
      case 0x04:
        this.pulse2.setByte(offset, value);
        break;
      case 0x14:
        if ((offset & 0x03) === 1) {
          this.mixer.setByte(value);
        } else if ((offset & 0x03) === 3) {
          this.frameCounter.setByte(value);
        }
      default:
        // Nothing
        break;
    }
  }

  public tick(cpuTicks: number): void {
    // The extra 8 bits allow better timing accuracy
    const ticks = cpuTicks << APU_CLOCK_SHIFT;

    const frameAction = this.frameCounter.tick(ticks);

    if (frameAction) {
      const {
        updateLengthCounter,
        updateVolumeControl,
        triggerInterrupt,
      } = frameAction;

      // TODO: Update various things
    }

    this.pulse1.tick(ticks);
    this.pulse2.tick(ticks);

    this.sampleClock += ticks;

    if (this.sampleClock >= TICKS_PER_SAMPLE) {
      this.sampleClock -= TICKS_PER_SAMPLE;
      this.sampleBuffer.writeSample(this.mixer.sample(), this.mixer.sample());
    }
  }
}
