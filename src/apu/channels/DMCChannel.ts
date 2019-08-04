import FrequencyClock from './components/FrequencyClock';

const TIMER_PERIODS = [
  428,
  380,
  340,
  320,
  286,
  254,
  226,
  214,
  190,
  160,
  142,
  128,
  106,
  84,
  72,
  54,
];

export default class DMCChannel {
  private timer: FrequencyClock;
  private outputLevel: number = 0;
  private sampleBuffer: number | undefined = undefined;
  private sampleAddress: number = 0xc000;
  private sampleLength: number = 1;
  private interruptEnabled: boolean = false;
  private loop: boolean = false;
  private interrupt: boolean = false;

  constructor() {
    this.timer = new FrequencyClock((value) => TIMER_PERIODS[value], 0);
  }

  public setByte(offset: number, value: number): void {
    switch (offset & 0x03) {
      case 0:
        this.interruptEnabled = (value & 0x80) !== 0;
        this.loop = (value & 0x40) !== 0;
        this.timer.setValue(value & 0x0f);
        this.interrupt = this.interrupt && this.interruptEnabled;
        break;
      case 1:
        this.outputLevel = value & 0x7f;
        break;
      case 2:
        this.sampleAddress = 0xc000 | (value << 6);
        break;
      case 3:
        this.sampleLength = (value << 4) + 1;
        break;
      default:
        throw new Error('Should not happen');
    }
  }

  public setEnabled(enabled: boolean): void {
    // Nothing yet
  }

  public tick(ticks: number): void {
    this.timer.tick(ticks);
  }

  public update(frameNumber: number): void {
    // Nothing yet
  }

  public isPlaying(): boolean {
    return false;
  }

  public sample(): number {
    return 0;
  }

  public isInterruptSet(): boolean {
    return this.interrupt;
  }

  public clearInterrupt(): void {
    this.interrupt = false;
  }
}
