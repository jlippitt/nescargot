import { partialOpenBus } from 'cpu/MMU';
import { debug } from 'log';

enum Button {
  A = 0,
  B = 1,
  Select = 2,
  Start = 3,
  Up = 4,
  Down = 5,
  Left = 6,
  Right = 7,
}

// prettier-ignore
const keyboardMap: { [key: string]: Button } = {
  'z': Button.A,
  'x': Button.B,
  ' ': Button.Select,
  'Enter': Button.Start,
  'ArrowUp': Button.Up,
  'ArrowDown': Button.Down,
  'ArrowLeft': Button.Left,
  'ArrowRight': Button.Right,
  'Up': Button.Up,
  'Down': Button.Down,
  'Left': Button.Left,
  'Right': Button.Right,
};

export default class Joypad {
  private buttonState: boolean[];
  private polledState: boolean[];
  private buttonIndex: number;
  private strobe: boolean;

  constructor() {
    this.buttonState = Array(8).fill(false);
    this.polledState = Array(8).fill(false);
    this.buttonIndex = 0;
    this.strobe = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event: KeyboardEvent) => {
        event.preventDefault();
        if (keyboardMap.hasOwnProperty(event.key)) {
          this.buttonState[keyboardMap[event.key]] = true;
        }
      });

      window.addEventListener('keyup', (event: KeyboardEvent) => {
        event.preventDefault();
        if (keyboardMap.hasOwnProperty(event.key)) {
          this.buttonState[keyboardMap[event.key]] = false;
        }
      });
    }
  }

  public poll(): void {
    const [gamepad] = navigator.getGamepads();

    if (!gamepad) {
      return;
    }

    const { buttons } = gamepad;

    this.buttonState[Button.A] = buttons[1].pressed;
    this.buttonState[Button.B] = buttons[0].pressed;
    this.buttonState[Button.Select] = buttons[8].pressed;
    this.buttonState[Button.Start] = buttons[9].pressed;
    this.buttonState[Button.Up] = buttons[12].pressed;
    this.buttonState[Button.Down] = buttons[13].pressed;
    this.buttonState[Button.Left] = buttons[14].pressed;
    this.buttonState[Button.Right] = buttons[15].pressed;
  }

  public getByte(offset: number): number {
    let value: number;

    switch (offset) {
      case 0x4016:
        if (this.strobe) {
          value = this.buttonState[0] ? 1 : 0;
        } else if (this.buttonIndex < this.polledState.length) {
          debug(`Button read: ${this.buttonIndex}`);
          value = this.polledState[this.buttonIndex++] ? 1 : 0;
        } else {
          value = 1;
        }
        break;
      default:
        value = 0;
    }

    return partialOpenBus(value, 0xe0);
  }

  public setByte(offset: number, value: number): void {
    switch (offset) {
      case 0x4016:
        if (this.strobe) {
          this.polledState = this.buttonState;
          debug(`Button state: ${this.polledState}`);
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
