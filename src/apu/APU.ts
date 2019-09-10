import { times } from 'lodash';

import { OPEN_BUS } from 'cpu/MMU';
import Interrupt from 'Interrupt';
import { debug, toHex, warn } from 'log';
import Mapper from 'mapper/Mapper';
import SampleReader from 'SampleReader';

import { MASTER_CLOCK_RATE, SAMPLE_RATE } from '../constants';
import SampleBuffer from './buffers/SampleBuffer';
import DMCChannel from './channels/DMCChannel';
import NoiseChannel from './channels/NoiseChannel';
import PulseChannel from './channels/PulseChannel';
import TriangleChannel from './channels/TriangleChannel';
import { APU_CLOCK_MULTIPLIER, APU_CLOCK_SHIFT } from './constants';
import FrameCounter from './FrameCounter';

const APU_CLOCK_RATE = (MASTER_CLOCK_RATE * APU_CLOCK_MULTIPLIER) / 12;

const TICKS_PER_SAMPLE = Math.ceil(APU_CLOCK_RATE / SAMPLE_RATE);

const PULSE_TABLE = times(31, (n) => 95.52 / (8128.0 / n + 100));

const TND_TABLE = times(203, (n) => 163.67 / (24329.0 / n + 100));

export interface APUOptions {
  interrupt: Interrupt;
  mapper: Mapper;
  sampleBuffer: SampleBuffer;
  sampleReader: SampleReader;
}

export default class APU {
  private interrupt: Interrupt;
  private mapper: Mapper;
  private sampleBuffer: SampleBuffer;
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;
  private triangle: TriangleChannel;
  private noise: NoiseChannel;
  private dmc: DMCChannel;
  private frameCounter: FrameCounter;
  private sampleClock: number = 0;

  constructor({ interrupt, mapper, sampleBuffer, sampleReader }: APUOptions) {
    this.interrupt = interrupt;
    this.mapper = mapper;
    this.sampleBuffer = sampleBuffer;
    this.pulse1 = new PulseChannel(-1);
    this.pulse2 = new PulseChannel(0);
    this.triangle = new TriangleChannel();
    this.noise = new NoiseChannel();
    this.dmc = new DMCChannel(sampleReader);
    this.frameCounter = new FrameCounter();
  }

  public getByte(offset: number): number {
    if ((offset & 0xff) === 0x15) {
      let result = 0;
      result |= this.pulse1.isPlaying() ? 0x01 : 0;
      result |= this.pulse2.isPlaying() ? 0x02 : 0;
      result |= this.triangle.isPlaying() ? 0x04 : 0;
      result |= this.noise.isPlaying() ? 0x08 : 0;
      result |= this.dmc.isPlaying() ? 0x10 : 0;
      result |= this.frameCounter.isInterruptSet() ? 0x40 : 0;
      result |= this.dmc.isInterruptSet() ? 0x80 : 0;
      this.frameCounter.clearInterrupt();
      return result;
    } else {
      warn(`Unexpected APU read: ${toHex(offset, 4)}`);
      return OPEN_BUS;
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
      case 0x10:
        this.dmc.setByte(offset, value);
        break;
      case 0x14:
        if ((offset & 0x03) === 1) {
          this.pulse1.setEnabled((value & 0x01) !== 0);
          this.pulse2.setEnabled((value & 0x02) !== 0);
          this.triangle.setEnabled((value & 0x04) !== 0);
          this.noise.setEnabled((value & 0x08) !== 0);
          this.dmc.setEnabled((value & 0x10) !== 0);
          this.dmc.clearInterrupt();
        } else if ((offset & 0x03) === 3) {
          this.frameCounter.setByte(value);
        }
        break;
      default:
        warn(`Unexpected APU write: ${toHex(offset, 4)} <= ${toHex(value, 2)}`);
        break;
    }
  }

  public tick(cpuTicks: number): void {
    // The extra 8 bits allow better timing accuracy
    const hiResTicks = cpuTicks << APU_CLOCK_SHIFT;

    const frameNumber = this.frameCounter.tick(hiResTicks);

    if (frameNumber !== undefined) {
      this.pulse1.update(frameNumber);
      this.pulse2.update(frameNumber);
      this.triangle.update(frameNumber);
      this.noise.update(frameNumber);
      this.dmc.update(frameNumber);
    }

    this.pulse1.tick(cpuTicks);
    this.pulse2.tick(cpuTicks);
    this.triangle.tick(cpuTicks);
    this.noise.tick(cpuTicks);
    this.dmc.tick(cpuTicks);

    this.sampleClock += hiResTicks;

    if (this.sampleClock >= TICKS_PER_SAMPLE) {
      this.sampleClock -= TICKS_PER_SAMPLE;

      const pulse1 = this.pulse1.sample();
      const pulse2 = this.pulse2.sample();
      const triangle = this.triangle.sample();
      const noise = this.noise.sample();
      const dmc = this.dmc.sample();

      const pulseOut = PULSE_TABLE[pulse1 + pulse2];
      const tndOut = TND_TABLE[triangle * 3 + noise * 2 + dmc];
      const sample = pulseOut + tndOut + this.mapper.sample();

      this.sampleBuffer.writeSample(sample, sample);
    }

    if (this.frameCounter.isInterruptSet() || this.dmc.isInterruptSet()) {
      debug('IRQ triggered from within APU');
      debug(`Frame counter: ${this.frameCounter.isInterruptSet()}`);
      debug(`DMC: ${this.dmc.isInterruptSet()}`);
      this.interrupt.triggerIrq();
    }
  }
}
