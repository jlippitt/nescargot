interface ButtonMap {
  [key: string]: number;
}

// prettier-ignore
const buttonMap: ButtonMap = {
  'Z': 0,
  'X': 1,
  ' ': 2,
  'Enter': 3,
  'ArrowUp': 4,
  'ArrowDown': 5,
  'ArrowLeft': 6,
  'ArrowRight': 7,
  'Up': 4,
  'Down': 5,
  'Left': 6,
  'Right': 7,
};

export default class Joypad {
  private buttonState: boolean[];
  private buttonIndex: number;
  private strobe: boolean;

  constructor() {
    this.buttonState = Array(8).fill(false);
    this.buttonIndex = 0;
    this.strobe = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (buttonMap.hasOwnProperty(event.key)) {
          this.buttonState[buttonMap[event.key]] = true;
        }
      });

      window.addEventListener('keyup', (event: KeyboardEvent) => {
        if (buttonMap.hasOwnProperty(event.key)) {
          this.buttonState[buttonMap[event.key]] = false;
        }
      });
    }
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
