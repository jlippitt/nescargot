import PulseChannel from './PulseChannel';

export default class APU {
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;

  constructor() {
    this.pulse1 = new PulseChannel();
    this.pulse2 = new PulseChannel();
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
        this.pulse1.setByte(offset, value);
        break;
      default:
        // Nothing
        break;
    }
  }
}
