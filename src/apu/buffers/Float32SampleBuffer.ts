import { SAMPLE_RATE } from '../APU';
import SampleBuffer from './SampleBuffer';

const BUFFER_SIZE = Math.ceil(SAMPLE_RATE / 60) * 2;

export default class Float32SampleBuffer {
  private buffer: Float32Array;
  private position: number;

  constructor() {
    this.buffer = new Float32Array(BUFFER_SIZE);
    this.position = 0;
  }

  public writeSample(left: number, right: number) {
    this.buffer[this.position++] = left;
    this.buffer[this.position++] = right;
  }

  public fetchAvailableAudioData(): Float32Array {
    const availableData = this.buffer.slice(0, this.position);
    this.position = 0;
    return availableData;
  }
}
