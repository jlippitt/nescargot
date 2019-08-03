import { times } from 'lodash';

import SampleBuffer from './buffers/SampleBuffer';
import NoiseChannel from './channels/NoiseChannel';
import PulseChannel from './channels/PulseChannel';
import TriangleChannel from './channels/TriangleChannel';
import { APU_CLOCK_MULTIPLIER, APU_CLOCK_SHIFT } from './constants';
import FrameCounter from './FrameCounter';

export const SAMPLE_RATE = 11025;

const MASTER_CLOCK_RATE = (21477270 * APU_CLOCK_MULTIPLIER) / 12;

const TICKS_PER_SAMPLE = Math.ceil(MASTER_CLOCK_RATE / SAMPLE_RATE);

const PULSE_TABLE = times(31, (n) => 95.52 / (8128.0 / n + 100));

const TND_TABLE = times(203, (n) => 163.67 / (24329.0 / n + 100));

export default class APU {
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;
  private triangle: TriangleChannel;
  private noise: NoiseChannel;
  private frameCounter: FrameCounter;
  private sampleBuffer: SampleBuffer;
  private sampleClock: number = 0;

  constructor(sampleBuffer: SampleBuffer) {
    this.pulse1 = new PulseChannel(-1);
    this.pulse2 = new PulseChannel(0);
    this.triangle = new TriangleChannel();
    this.noise = new NoiseChannel();
    this.frameCounter = new FrameCounter();
    this.sampleBuffer = sampleBuffer;
  }

  public getByte(offset: number): number {
    // TODO: Read from status register
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
      case 0x08:
        this.triangle.setByte(offset, value);
      case 0x0c:
        this.noise.setByte(offset, value);
        break;
      case 0x14:
        if ((offset & 0x03) === 1) {
          this.pulse1.setEnabled((value & 0x01) !== 0);
          this.pulse2.setEnabled((value & 0x02) !== 0);
          this.triangle.setEnabled((value & 0x04) !== 0);
          this.noise.setEnabled((value & 0x08) !== 0);
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

    const frame = this.frameCounter.tick(ticks);

    if (frame) {
      const { shortFrame, longFrame, interrupt } = frame;

      if (shortFrame) {
        this.pulse1.update(longFrame);
        this.pulse2.update(longFrame);
        this.triangle.update(longFrame);
        this.noise.update(longFrame);
      }

      // TODO: Interrupt
    }

    this.pulse1.tick(ticks);
    this.pulse2.tick(ticks);
    this.triangle.tick(ticks);
    this.noise.tick(ticks);

    this.sampleClock += ticks;

    if (this.sampleClock >= TICKS_PER_SAMPLE) {
      this.sampleClock -= TICKS_PER_SAMPLE;

      const pulseOut = PULSE_TABLE[this.pulse1.sample() + this.pulse2.sample()];

      const tndOut =
        TND_TABLE[this.triangle.sample() * 3 + this.noise.sample() * 2];

      const sample = pulseOut + tndOut;

      this.sampleBuffer.writeSample(sample, sample);
    }
  }
}
