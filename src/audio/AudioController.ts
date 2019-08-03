import { SAMPLE_RATE } from 'apu/APU';

export default class AudioController {
  private context: AudioContext;
  private expectedTime: number;

  constructor() {
    this.context = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.expectedTime = this.context.currentTime;
  }

  public sendAudioData(buffer: AudioBuffer) {
    this.expectedTime = Math.max(
      this.expectedTime + buffer.duration,
      this.context.currentTime,
    );

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(this.expectedTime);
  }
}
