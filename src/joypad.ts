export default class Joypad {
  private buttonState: boolean[];
  private buttonIndex: number;
  private strobe: boolean;

  constructor() {
    this.buttonState = Array(8).fill(0);
    this.buttonIndex = 0;
    this.strobe = false;
  }

  public getByte(offset: number): number {
    switch (offset) {
      case 0x4016:
        if (this.strobe) {
          return this.buttonState[0] ? 1 : 0;
        } else if (this.buttonIndex < this.buttonState.length) {
          return this.buttonState[this.buttonIndex++] ? 1 : 0;
        } else {
          return 1;
        }
      default:
        return 0;
    }
  }

  public setByte(offset: number, value: number): void {
    switch (offset) {
      case 0x4016:
        if (this.strobe) {
          this.buttonIndex = 0;
        }
        this.strobe = !this.strobe;
        break;
      default:
        // Ignore for now
        break;
    }
  }
}
