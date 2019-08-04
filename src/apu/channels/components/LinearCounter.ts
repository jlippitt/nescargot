export default class LinearCounter {
  private counter: number = 0;
  private reloadValue: number = 0;
  private control: boolean = false;
  private reload: boolean = false;

  public setByte(value: number): void {
    this.reloadValue = value & 0x7f;
    this.control = (value & 0x80) !== 0;
  }

  public setReload(): void {
    this.reload = true;
  }

  public advance(): void {
    if (this.reload) {
      this.counter = this.reloadValue;

      if (!this.control) {
        this.reload = false;
      }
    } else if (this.counter > 0) {
      --this.counter;
    }
  }

  public isEnabled(): boolean {
    return this.counter > 0;
  }
}
