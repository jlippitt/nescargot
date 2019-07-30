import audioReceiverNodeUrl from './AudioReceiverNode.worklet.js';

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
  const context = new AudioContext();

  await context.audioWorklet.addModule(audioReceiverNodeUrl);

  return new AudioController(context);
}
