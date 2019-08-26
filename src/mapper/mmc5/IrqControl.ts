import Interrupt from 'Interrupt';
import { debug } from 'log';
import { PPUState } from 'ppu/PPU';

import { SCREEN_HEIGHT } from '../../constants';

export default class IrqControl {
  private interrupt: Interrupt;
  private enabled: boolean = false;
  private scanline: number = 0;
  private inFrame: boolean = false;
  private irqPending: boolean = false;
  private counter = 0;

  constructor(interrupt: Interrupt) {
    this.interrupt = interrupt;
  }

  public setEnabled(enabled: boolean): void {
    debug(`MMC5 IRQ enabled = ${enabled}`);
    this.enabled = enabled;
  }

  public setScanline(scanline: number): void {
    debug(`MMC5 IRQ scanline = ${scanline}`);
    this.scanline = scanline;
  }

  public getStatus(): number {
    let result = 0;
    result |= this.irqPending ? 0x80 : 0;
    result |= this.inFrame ? 0x40 : 0;
    this.acknowledge();
    return result;
  }

  public reset(): void {
    debug('MMC5 IRQ reset');
    this.inFrame = false;
    this.counter = 0;
    this.acknowledge();
  }

  public onPPULineStart({ line, mask }: PPUState): void {
    if (!mask.renderingEnabled) {
      this.inFrame = false;
      return;
    }

    if (line < SCREEN_HEIGHT) {
      if (line === 0) {
        this.acknowledge();
      }

      if (!this.inFrame) {
        debug('MMC5 IRQ new frame');
        this.inFrame = true;
        this.counter = 0;
      } else if (++this.counter === this.scanline) {
        debug(`MMC5 IRQ pending at line ${line}`);
        this.irqPending = true;
      }
    } else if (line === SCREEN_HEIGHT) {
      debug('MMC5 IRQ end of frame');
      this.inFrame = false;
    } else if (line === SCREEN_HEIGHT + 1) {
      this.reset();
    }

    if (this.enabled && this.irqPending) {
      debug(`MMC5 IRQ triggered at line ${line}`);
      this.interrupt.triggerIrq();
    }
  }

  private acknowledge(): void {
    debug('MMC5 IRQ acknowledged');
    this.irqPending = false;
    this.interrupt.clearIrq();
  }
}
