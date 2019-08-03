import { SAMPLE_RATE } from '../APU';
import SampleBuffer from './SampleBuffer';

const BUFFER_SIZE = 1024;

const createBuffer = () =>
  new AudioBuffer({
    length: BUFFER_SIZE,
    numberOfChannels: 2,
    sampleRate: SAMPLE_RATE,
  });

export default class Float32SampleBuffer {
  private currentBuffer: AudioBuffer;
  private queuedBuffers: AudioBuffer[] = [];
  private leftSamples: Float32Array;
  private rightSamples: Float32Array;
  private position: number = 0;

  constructor() {
    this.currentBuffer = createBuffer();
    this.leftSamples = this.currentBuffer.getChannelData(0);
    this.rightSamples = this.currentBuffer.getChannelData(1);
  }

  public writeSample(left: number, right: number): void {
    this.leftSamples[this.position] = left;
    this.rightSamples[this.position] = right;

    if (++this.position >= BUFFER_SIZE) {
      this.queuedBuffers.push(this.currentBuffer);
      this.currentBuffer = createBuffer();
      this.leftSamples = this.currentBuffer.getChannelData(0);
      this.rightSamples = this.currentBuffer.getChannelData(1);
      this.position = 0;
    }
  }

  public fetchAvailableAudioData(): AudioBuffer | undefined {
    return this.queuedBuffers.shift();
  }
}
