import SampleBuffer from './buffers/SampleBuffer';
import FrameCounter from './FrameCounter';
import PulseChannel from './PulseChannel';

export const SAMPLE_RATE = 11025;

const MASTER_CLOCK_RATE = (21477270 * 256) / 12;

const TICKS_PER_SAMPLE = Math.ceil(MASTER_CLOCK_RATE / SAMPLE_RATE);

export default class APU {
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;
  private frameCounter: FrameCounter;
  private sampleBuffer: SampleBuffer;
  private sampleClock: number = 0;

  constructor(sampleBuffer: SampleBuffer) {
    this.pulse1 = new PulseChannel();
    this.pulse2 = new PulseChannel();
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
        if ((offset & 0x03) === 3) {
          this.frameCounter.setByte(value);
        }
      default:
        // Nothing
        break;
    }
  }

  public tick(cpuTicks: number): void {
    // The extra 8 bits allow better timing accuracy
    const ticks = cpuTicks << 8;

    const frameAction = this.frameCounter.tick(ticks);

    if (frameAction) {
      const {
        updateLengthCounter,
        updateVolumeControl,
        triggerInterrupt,
      } = frameAction;

      // TODO: Update various things
    }

    this.sampleClock += ticks;

    if (this.sampleClock >= TICKS_PER_SAMPLE) {
      this.sampleClock -= TICKS_PER_SAMPLE;

      this.sampleBuffer.writeSample(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      );
    }
  }
}
