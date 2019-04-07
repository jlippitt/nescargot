export default class Interrupt {
  private anyCondition: boolean;
  private dmaInProgress: boolean;
  private nmi: boolean;

  constructor() {
    this.anyCondition = false;
    this.dmaInProgress = false;
    this.nmi = false;
  }

  public hasAnyCondition(): boolean {
    return this.anyCondition;
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

  private updateAnyCondition(): void {
    this.anyCondition = this.dmaInProgress || this.nmi;
  }
}
