import State from 'cpu/State';
import Interrupt from 'Interrupt';

export default class SampleReader {
  private interrupt: Interrupt;
  private buffer: number | undefined = undefined;
  private startAddress: number = 0xc000;
  private length: number = 1;
  private currentAddress: number = 0xc000;
  private bytesRemaining: number = 0;
  private loop: boolean = false;
  private interruptEnabled: boolean = false;
  private interruptSet: boolean = false;

  constructor(interrupt: Interrupt) {
    this.interrupt = interrupt;
  }

  public setAddress(value: number): void {
    this.startAddress = 0xc000 | (value << 6);
  }

  public setLength(value: number): void {
    this.length = (value << 4) + 1;
  }

  public setLoop(loop: boolean): void {
    this.loop = loop;
  }

  public setInterruptEnabled(interruptEnabled: boolean): void {
    this.interruptEnabled = interruptEnabled;
    this.interruptSet = this.interruptSet && interruptEnabled;
  }

  public setEnabled(enabled: boolean): void {
    if (enabled) {
      if (this.bytesRemaining === 0) {
        this.currentAddress = this.startAddress;
        this.bytesRemaining = this.length;
      }
    } else {
      this.bytesRemaining = 0;
    }
  }

  public isInterruptSet(): boolean {
    return this.interruptSet;
  }

  public clearInterrupt(): void {
    this.interruptSet = false;
  }

  public isPlaying(): boolean {
    return this.bytesRemaining > 0;
  }

  public readNext(): number | undefined {
    const sample = this.buffer;
    this.buffer = undefined;

    if (this.bytesRemaining > 0) {
      this.interrupt.requestNewSample();
    }

    return sample;
  }

  public tick(state: State): void {
    const { mmu, clock } = state;

    this.buffer = mmu.getByte(this.currentAddress);
    this.currentAddress = 0x8000 | ((this.currentAddress + 1) & 0x7fff);

    if (--this.bytesRemaining === 0) {
      if (this.loop) {
        this.currentAddress = this.startAddress;
        this.bytesRemaining = this.length;
      } else if (this.interruptEnabled) {
        this.interruptSet = true;
      }
    }

    clock.tick(this.interrupt.isDmaInProgress() ? 2 : 4);
  }
}
