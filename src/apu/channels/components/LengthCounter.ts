const LENGTH_TABLE = [
  // 0x00
  10,
  254,
  20,
  2,
  40,
  4,
  80,
  6,
  // 0x08
  160,
  8,
  60,
  10,
  14,
  12,
  26,
  14,
  // 0x10
  12,
  16,
  24,
  18,
  48,
  20,
  96,
  22,
  // 0x18
  192,
  24,
  72,
  26,
  16,
  28,
  32,
  30,
];

export default class LengthCounter {
  public enabled: boolean = false;
  public halted: boolean = false;
  public value: number = 0;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.value = 0;
    }
  }

  public setHalted(halted: boolean): void {
    this.halted = halted;
  }

  public setValue(rawValue: number): void {
    if (this.enabled) {
      this.value = LENGTH_TABLE[rawValue];
    }
  }

  public advance(): void {
    if (!this.halted && this.value > 0) {
      --this.value;
    }
  }

  public isEnabled(): boolean {
    return this.value > 0;
  }
}
