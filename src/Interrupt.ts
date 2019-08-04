export default class Interrupt {
  private anyCondition: boolean;
  private anyConditionNoInterrupt: boolean;
  private dmaInProgress: boolean;
  private nmi: boolean;
  private irq: boolean;
  private sampleRequest: boolean;

  constructor() {
    this.anyCondition = false;
    this.anyConditionNoInterrupt = false;
    this.dmaInProgress = false;
    this.nmi = false;
    this.irq = false;
    this.sampleRequest = false;
  }

  public hasAnyCondition(interruptDisabled: boolean): boolean {
    return interruptDisabled ? this.anyConditionNoInterrupt : this.anyCondition;
  }

  public isDmaInProgress(): boolean {
    return this.dmaInProgress;
  }

  public setDmaInProgress(dmaInProgress: boolean): void {
    this.dmaInProgress = dmaInProgress;
    this.updateAnyCondition();
  }

  public triggerNmi(): void {
    this.nmi = true;
    this.updateAnyCondition();
  }

  public checkNmi(): boolean {
    if (this.nmi) {
      this.nmi = false;
      this.updateAnyCondition();
      return true;
    } else {
      return false;
    }
  }

  public triggerIrq(): void {
    this.irq = true;
    this.updateAnyCondition();
  }

  public checkIrq(): boolean {
    if (this.irq) {
      this.irq = false;
      this.updateAnyCondition();
      return true;
    } else {
      return false;
    }
  }

  public requestNewSample(): void {
    this.sampleRequest = true;
    this.updateAnyCondition();
  }

  public checkSampleRequest(): boolean {
    if (this.sampleRequest) {
      this.sampleRequest = false;
      this.updateAnyCondition();
      return true;
    } else {
      return false;
    }
  }

  private updateAnyCondition(): void {
    this.anyConditionNoInterrupt =
      this.dmaInProgress || this.nmi || this.sampleRequest;
    this.anyCondition = this.anyConditionNoInterrupt || this.irq;
  }
}
