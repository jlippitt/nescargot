const MAX_DECAY = 15;

export default class Envelope {
  private value: number = 0;
  private constantVolume: boolean = false;
  private loop: boolean = false;
  private startFlag: boolean = false;
  private divider: number = 0;
  private decay: number = 0;

  public setByte(value: number): void {
    this.value = value & 0x0f;
    this.constantVolume = (value & 0x10) !== 0;
    this.loop = (value & 0x20) !== 0;
  }

  public setStartFlag(): void {
    this.startFlag = true;
  }

  public advance(): void {
    if (this.startFlag) {
      this.startFlag = false;
      this.divider = this.value;
      this.decay = MAX_DECAY;
    } else if (--this.divider === 0) {
      this.divider = this.value;

      if (this.decay > 0) {
        --this.decay;
      } else if (this.loop) {
        this.decay = MAX_DECAY;
      }
    }
  }

  public getVolume(): number {
    return this.constantVolume ? this.value : this.decay;
  }
}
