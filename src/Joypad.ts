import { JoypadState } from 'snek-client';

import { partialOpenBus } from 'cpu/MMU';
import { debug } from 'log';

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
  }

  public update(state: JoypadState): void {
    this.buttonState[0] = state.a;
    this.buttonState[1] = state.b;
    this.buttonState[2] = state.select;
    this.buttonState[3] = state.start;
    this.buttonState[4] = state.up;
    this.buttonState[5] = state.down;
    this.buttonState[6] = state.left;
    this.buttonState[7] = state.right;
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
