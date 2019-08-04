import { times } from 'lodash';

import Interrupt from 'Interrupt';

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

export interface APUOptions {
  interrupt: Interrupt;
  sampleBuffer: SampleBuffer;
}

export default class APU {
  private interrupt: Interrupt;
  private sampleBuffer: SampleBuffer;
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;
  private triangle: TriangleChannel;
  private noise: NoiseChannel;
  private frameCounter: FrameCounter;
  private sampleClock: number = 0;

  constructor({ interrupt, sampleBuffer }: APUOptions) {
    this.interrupt = interrupt;
    this.sampleBuffer = sampleBuffer;
    this.pulse1 = new PulseChannel(-1);
    this.pulse2 = new PulseChannel(0);
    this.triangle = new TriangleChannel();
    this.noise = new NoiseChannel();
    this.frameCounter = new FrameCounter();
  }

  public getByte(offset: number): number {
    if ((offset & 0xff) === 0x15) {
      this.frameCounter.clearInterrupt();
      let result = 0;
      result |= this.pulse1.isPlaying() ? 0x01 : 0;
      result |= this.pulse2.isPlaying() ? 0x02 : 0;
      result |= this.triangle.isPlaying() ? 0x04 : 0;
      result |= this.noise.isPlaying() ? 0x08 : 0;
      return result;
    } else {
      return 0;
    }
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
        break;
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
        break;
      default:
        // Nothing
        break;
    }
  }

  public tick(cpuTicks: number): void {
    // The extra 8 bits allow better timing accuracy
    const ticks = cpuTicks << APU_CLOCK_SHIFT;

    const frameNumber = this.frameCounter.tick(ticks);

    if (frameNumber !== undefined) {
      this.pulse1.update(frameNumber);
      this.pulse2.update(frameNumber);
      this.triangle.update(frameNumber);
      this.noise.update(frameNumber);
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

    if (this.frameCounter.isInterruptSet()) {
      this.interrupt.triggerIrq();
    }
  }
}
