import Interrupt from 'Interrupt';
import { debug } from 'log';

const TICKS_PER_SCANLINE = [114, 114, 113];

enum Mode {
  Scanline,
  Cycle,
}

class ScanlineDivider {
  private scanlineIndex: number = 0;
  private scanlineTicks: number = TICKS_PER_SCANLINE[0];
  private counter = 0;

  public reset() {
    this.counter = 0;
    this.scanlineIndex = 0;
    this.scanlineTicks = TICKS_PER_SCANLINE[0];
  }

  public tick(cpuTicks: number): boolean {
    this.counter += cpuTicks;

    if (this.counter >= this.scanlineTicks) {
      this.counter -= this.scanlineTicks;
      this.scanlineIndex = (this.scanlineIndex + 1) % TICKS_PER_SCANLINE.length;
      this.scanlineTicks = TICKS_PER_SCANLINE[this.scanlineIndex];
      return true;
    }

    return false;
  }
}

export default class IrqControl {
  private interrupt: Interrupt;
  private latch: number = 0;
  private mode: Mode = Mode.Scanline;
  private enabled: boolean = false;
  private enableAfterAcknowledge: boolean = false;
  private scanlineDivider: ScanlineDivider;
  private counter: number = 0;

  constructor(interrupt: Interrupt) {
    this.interrupt = interrupt;
    this.scanlineDivider = new ScanlineDivider();
  }

  public setByte(offset: number, value: number): void {
    switch (offset) {
      case 0:
        this.latch = value;
        debug('VRC6 IRQ Latch', this.latch);
        break;

      case 1:
        this.mode = (value & 0x04) !== 0 ? Mode.Cycle : Mode.Scanline;
        this.enabled = (value & 0x02) !== 0;
        this.enableAfterAcknowledge = (value & 0x01) !== 0;

        if (this.enabled) {
          this.counter = this.latch;
          this.scanlineDivider.reset();
        }

        debug('VRC6 IRQ Enabled', this.enabled);
        debug('VRC6 IRQ Counter', this.counter);
        break;

      case 2:
        this.interrupt.clearIrq();
        this.enabled = this.enableAfterAcknowledge;
        debug('VRC6 IRQ Cleared');
        debug('VRC6 IRQ Enabled', this.enabled);
        break;

      default:
        break;
    }
  }

  public tick(cpuTicks: number): void {
    if (!this.enabled) {
      return;
    }

    if (this.mode === Mode.Scanline) {
      if (this.scanlineDivider.tick(cpuTicks)) {
        this.updateCounter();
      }
    } else {
      for (let i = 0; i < cpuTicks; ++i) {
        this.updateCounter();
      }
    }
  }

  private updateCounter(): void {
    if (this.counter === 0xff) {
      this.counter = this.latch;
      this.interrupt.triggerIrq();
      debug('VRC6 IRQ Triggered');
      debug('VRC6 IRQ Counter', this.counter);
    } else {
      ++this.counter;
      debug('VRC6 IRQ Counter', this.counter);
    }
  }
}
