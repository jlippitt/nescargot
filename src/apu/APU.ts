import FrameCounter from './FrameCounter';
import PulseChannel from './PulseChannel';

// This is a slight simplification of what the actual hardware does, but
// probably good enough
const TICKS_PER_FRAME = 7457;

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
        this.pulse1.setByte(offset, value);
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

  public tick(ticks: number): void {
    this.clock += ticks;

    if (this.clock >= TICKS_PER_FRAME) {
      this.clock -= TICKS_PER_FRAME;

      const {
        updateLengthCounter,
        updateVolumeControl,
        triggerInterrupt,
      } = this.frameCounter.tick();

      // TODO: Update various things
    }
  }
}
