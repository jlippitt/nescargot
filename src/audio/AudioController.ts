import { SAMPLE_RATE } from 'apu/APU';

export default class AudioController {
  private context: AudioContext;
  private audioReceiver: AudioWorkletNode;

  constructor(context: AudioContext) {
    this.context = context;
    this.audioReceiver = new AudioWorkletNode(context, 'AudioReceiverNode');
  }

  public start(): void {
    this.audioReceiver.connect(this.context.destination);
  }

  public sendAudioData(data: Float32Array) {
    this.audioReceiver.port.postMessage(data.buffer, [data.buffer]);
  }
}

export async function createAudioController(): Promise<AudioController> {
  const context = new AudioContext({ sampleRate: SAMPLE_RATE });

  const audioReceiverNodeUrl = require('./AudioReceiverNode.worklet.js') as string;

  await context.audioWorklet.addModule(audioReceiverNodeUrl);

  return new AudioController(context);
}
