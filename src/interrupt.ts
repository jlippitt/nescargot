export default class Interrupt {
  private nmi: boolean;

  constructor() {
    this.nmi = false;
  }

  public triggerNmi(): void {
    this.nmi = true;
  }

  public checkNmi(): boolean {
    if (this.nmi) {
      this.nmi = false;
      return true;
    } else {
      return false;
    }
  }
}
