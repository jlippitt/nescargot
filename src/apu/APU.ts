import FrameCounter from './FrameCounter';
import PulseChannel from './PulseChannel';

export default class APU {
  private pulse1: PulseChannel;
  private pulse2: PulseChannel;
  private frameCounter: FrameCounter;
  private clock: number = 0;

  constructor() {
    this.pulse1 = new PulseChannel();
    this.pulse2 = new PulseChannel();
    this.frameCounter = new FrameCounter();
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
        this.pulse2.setByte(offset, value);
        break;
      case 0x14:
        if ((offset & 0x03) === 3) {
          this.frameCounter.setByte(value);
        }
      default:
        // Nothing
        break;
    }
  }

  public tick(lowResTicks: number): void {
    // The extra 8 bits allow better timing accuracy
    const ticks = lowResTicks << 8;

    const frameAction = this.frameCounter.tick(ticks);

    if (frameAction) {
      const {
        updateLengthCounter,
        updateVolumeControl,
        triggerInterrupt,
      } = frameAction;

      // TODO: Update various things
    }
  }
}
